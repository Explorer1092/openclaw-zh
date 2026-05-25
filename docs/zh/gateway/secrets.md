---
mmh3_hash: "101d6c63ee14f521dffd98ef5ff42d38"
summary: "Secrets 管理:SecretRef 合约、运行时快照行为和安全单向清除"
read_when:
  - 为 Provider 凭证和 `auth-profiles.json` refs 配置 SecretRefs
  - 在生产环境中安全地操作 secrets reload、audit、configure 和 apply
  - 了解启动快速失败、非活跃表面过滤和上一已知正常状态行为
title: "Secrets management"
sidebarTitle: "Secrets management"
---

OpenClaw 支持附加性 SecretRefs，因此支持的凭证不需要以明文存储在配置中。

<Note>
明文仍然有效。SecretRefs 是每个凭证可选的。
</Note>

<Warning>
如果明文凭证存储在 Agent 可以检查的文件中，包括 `openclaw.json`、`auth-profiles.json`、`.env` 或生成的 `agents/*/agent/models.json` 文件，它们对 Agent 仍然可读。SecretRefs 仅在每个支持的凭证都已迁移且 `openclaw secrets audit --check` 报告没有明文密钥残留后，才减少该本地爆炸半径。
</Warning>

## 目标和运行时模型

Secrets 被解析到内存中的运行时快照。

- 解析在激活期间是急切的，而不是在请求路径上懒加载的。
- 当有效活跃的 SecretRef 无法解析时，启动会快速失败。
- 重载使用原子交换：完全成功，或保留上一已知正常快照。
- SecretRef 策略违规（例如 OAuth 模式认证配置文件与 SecretRef 输入组合）在运行时交换之前使激活失败。
- 运行时请求只从活跃的内存快照读取。
- 第一次成功的配置激活/加载后，运行时代码路径继续读取该活跃的内存快照，直到成功重载将其替换。
- 出站交付路径也从该活跃快照读取（例如 Discord 回复/线程交付和 Telegram 操作发送）；它们不会在每次发送时重新解析 SecretRefs。

这使 secret 提供商中断不影响热请求路径。

## Agent 访问边界

SecretRefs 保护凭证不被持久化在支持的配置和生成的模型表面中，但它们不是进程隔离边界。如果明文凭证保留在 Agent 可以读取的路径上的磁盘上，Agent 可以通过使用文件或 shell 工具检查该文件来绕过 API 级编辑。

对于 Agent 可访问文件在范围内的生产部署，仅在以下所有条件成立时才将 SecretRef 迁移视为完成：

- 支持的凭证使用 SecretRefs 而不是明文值
- 旧版明文残留已从 `openclaw.json`、`auth-profiles.json`、`.env` 和生成的 `models.json` 文件中清除
- 迁移后 `openclaw secrets audit --check` 报告干净
- 任何剩余的不支持或轮换的凭证受操作系统隔离、容器隔离或外部凭证代理保护

这就是为什么 audit/configure/apply 工作流是安全迁移门控，而不仅仅是便利助手。

<Warning>
SecretRefs 不会使任意可读文件安全。备份、复制的配置、旧版生成的模型目录以及不支持的凭证类在它们被删除、移到 Agent 信任边界之外或受单独隔离层保护之前，必须被视为生产密钥。
</Warning>

## 活跃表面过滤

SecretRefs 仅在有效活跃表面上验证。

- 已启用的表面：未解析的 refs 阻止启动/重载。
- 非活跃表面：未解析的 refs 不阻止启动/重载。
- 非活跃 refs 以代码 `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 发出非致命诊断。

<AccordionGroup>
  <Accordion title="非活跃表面示例">
    - 禁用的 Channel/账户条目。
    - 没有已启用账户继承的顶级 Channel 凭证。
    - 禁用的工具/功能表面。
    - 未被 `tools.web.search.provider` 选择的 Web 搜索提供商特定密钥。在自动模式（提供商未设置）中，按优先级查询密钥以进行提供商自动检测，直到一个解析。选择后，非选定的提供商密钥在选定之前被视为非活跃。
    - 沙盒 SSH 认证材料（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`，加上每个 Agent 的覆盖）仅在默认 Agent 或已启用 Agent 的有效沙盒后端为 `ssh` 时才活跃。
    - `gateway.remote.token` / `gateway.remote.password` SecretRefs 在以下情况之一时活跃：
      - `gateway.mode=remote`
      - 配置了 `gateway.remote.url`
      - `gateway.tailscale.mode` 是 `serve` 或 `funnel`
      - 在没有这些远程表面的本地模式中：
        - 当 token 认证可以赢且没有配置 env/auth token 时，`gateway.remote.token` 是活跃的。
        - 仅当密码认证可以赢且没有配置 env/auth 密码时，`gateway.remote.password` 才是活跃的。
    - `gateway.auth.token` SecretRef 在 `OPENCLAW_GATEWAY_TOKEN` 已设置时对启动认证解析是非活跃的，因为环境 token 输入在该运行时赢了。

  </Accordion>
</AccordionGroup>

## Gateway 认证表面诊断

当 SecretRef 配置在 `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token` 或 `gateway.remote.password` 上时，Gateway 启动/重载明确记录表面状态：

- `active`：SecretRef 是有效认证表面的一部分，必须解析。
- `inactive`：SecretRef 因另一个认证表面赢了或远程认证已禁用/未活跃而被该运行时忽略。

这些条目以 `SECRETS_GATEWAY_AUTH_SURFACE` 记录，并包含活跃表面策略使用的原因，因此您可以看到凭证被视为活跃或非活跃的原因。

## 引导参考预检

当引导在交互模式下运行且您选择 SecretRef 存储时，OpenClaw 在保存前运行预检验证：

- Env refs：验证环境变量名称并确认在设置期间可见非空值。
- Provider refs（`file` 或 `exec`）：验证提供商选择，解析 `id`，并检查解析的值类型。
- 快速启动重用路径：当 `gateway.auth.token` 已经是 SecretRef 时，引导在 probe/dashboard 引导之前使用相同的快速失败门解析它（对于 `env`、`file` 和 `exec` refs）。

如果验证失败，引导显示错误并让您重试。

## SecretRef 合约

在任何地方使用一种对象形状：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    支持的 SecretInput 字段也接受精确字符串简写：

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    验证：

    - `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必须匹配 `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    验证：

    - `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必须是绝对 JSON 指针（`/...`）
    - 段中的 RFC6901 转义：`~` => `~0`，`/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    验证：

    - `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必须匹配 `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支持如 `secret#json_key` 的选择器）
    - `id` 不得包含 `.` 或 `..` 作为斜杠分隔的路径段（例如 `a/../b` 被拒绝）

  </Tab>
</Tabs>

## Provider 配置

在 `secrets.providers` 下定义 providers：

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // 或 "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Env provider">
    - 通过 `allowlist` 可选的允许列表。
    - 缺失/空环境值解析失败。

  </Accordion>
  <Accordion title="File provider">
    - 从 `path` 读取本地文件。
    - `mode: "json"` 需要 JSON 对象负载并将 `id` 解析为指针。
    - `mode: "singleValue"` 需要 ref id `"value"` 并返回文件内容。
    - 路径必须通过所有权/权限检查。
    - Windows 关闭失败注意：如果路径的 ACL 验证不可用，解析失败。对于受信任的路径，在该 provider 上设置 `allowInsecurePath: true` 以绕过路径安全检查。

  </Accordion>
  <Accordion title="Exec provider">
    - 运行配置的绝对二进制路径，无 shell。
    - 默认情况下，`command` 必须指向常规文件（不是符号链接）。
    - 设置 `allowSymlinkCommand: true` 以允许符号链接命令路径（例如 Homebrew shims）。OpenClaw 验证解析的目标路径。
    - 将 `allowSymlinkCommand` 与 `trustedDirs` 配对用于包管理器路径（例如 `["/opt/homebrew"]`）。
    - 支持超时、无输出超时、输出字节限制、环境允许列表和受信任目录。
    - Windows 关闭失败注意：如果命令路径的 ACL 验证不可用，解析失败。对于受信任的路径，在该 provider 上设置 `allowInsecurePath: true` 以绕过路径安全检查。

    请求负载（stdin）：

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    响应负载（stdout）：

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    可选的每 id 错误：

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## 基于文件的 API 密钥

不要将 `file:...` 字符串放在配置的 `env` 块中。`env` 块是字面量且不覆盖，因此 `file:...` 不会被解析。

在支持的凭证字段上使用文件 SecretRef：

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

对于 `mode: "singleValue"`，SecretRef `id` 是 `"value"`。对于 `mode: "json"`，使用绝对 JSON 指针，例如 `"/providers/xai/apiKey"`。

参见 [SecretRef Credential Surface](/reference/secretref-credential-surface) 了解接受 SecretRefs 的配置字段。

## Exec 集成示例

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // Homebrew 符号链接二进制文件必需
            trustedDirs: ["/opt/homebrew"],
            args: ["read", "op://Personal/OpenClaw QA API Key/password"],
            passEnv: ["HOME"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // Homebrew 符号链接二进制文件必需
            trustedDirs: ["/opt/homebrew"],
            args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
            passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "vault_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // Homebrew 符号链接二进制文件必需
            trustedDirs: ["/opt/homebrew"],
            args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
            passEnv: ["SOPS_AGE_KEY_FILE"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "sops_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## MCP server 环境变量

通过 `plugins.entries.acpx.config.mcpServers` 配置的 MCP server 环境变量支持 SecretInput。这使 API 密钥和令牌不会出现在纯文本配置中：

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

纯文本字符串值仍然有效。环境模板引用（如 `${MCP_SERVER_API_KEY}`）和 SecretRef 对象在 Gateway 激活期间、MCP server 进程启动之前解析。与其他 SecretRef 表面一样，未解析的引用仅在 `acpx` 插件有效激活时才会阻止激活。

## 沙盒 SSH 认证材料

核心 `ssh` 沙盒后端也支持 SSH 认证材料的 SecretRefs：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

运行时行为：

- OpenClaw 在沙盒激活期间解析这些 refs，而不是在每次 SSH 调用时懒加载。
- 解析的值以限制性权限写入临时文件，并在生成的 SSH 配置中使用。
- 如果有效沙盒后端不是 `ssh`，这些 refs 保持非活跃且不阻止启动。

## 支持的凭证表面

规范的支持和不支持的凭证列在：

- [SecretRef Credential Surface](/reference/secretref-credential-surface)

<Note>
运行时铸造或轮换的凭证以及 OAuth 刷新材料被有意排除在只读 SecretRef 解析之外。
</Note>

## 必需行为和优先级

- 没有 ref 的字段：不变。
- 有 ref 的字段：在激活期间对活跃表面是必需的。
- 如果同时存在明文和 ref，ref 在支持的优先级路径上优先。
- 编辑哨兵 `__OPENCLAW_REDACTED__` 保留用于内部配置编辑/恢复，并作为字面提交的配置数据被拒绝。

警告和审计信号：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（运行时警告）
- `REF_SHADOWED`（当 `auth-profiles.json` 凭证优先于 `openclaw.json` refs 时的审计发现）

Google Chat 兼容性行为：

- `serviceAccountRef` 优先于明文 `serviceAccount`。
- 当兄弟 ref 已设置时，明文值被忽略。

## 激活触发器

Secret 激活在以下时间运行：

- 启动（预检加最终激活）
- 配置重载热应用路径
- 配置重载重启检查路径
- 通过 `secrets.reload` 手动重载
- Gateway 配置写入 RPC 预检（`config.set` / `config.apply` / `config.patch`），在持久化编辑之前对提交的配置负载中的活跃表面 SecretRef 可解析性进行预检

激活契约：

- 成功原子性地交换快照。
- 启动失败中止 Gateway 启动。
- 运行时重载失败保留上一已知正常快照。
- 写入 RPC 预检失败拒绝提交的配置，并保持磁盘配置和活跃运行时快照不变。
- 为出站助手/工具调用提供明确的每次调用 Channel token 不会触发 SecretRef 激活；激活点保持为启动、重载和明确的 `secrets.reload`。

## 降级和恢复信号

当重载时激活在健康状态后失败，OpenClaw 进入降级 secrets 状态。

一次性系统事件和日志代码：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行为：

- 降级：运行时保留上一已知正常快照。
- 恢复：在下次成功激活后发出一次。
- 在已降级时重复失败会记录警告，但不会发送垃圾事件。
- 启动快速失败不会发出降级事件，因为运行时从未变为活跃。

## 命令路径解析

命令路径可以通过 Gateway 快照 RPC 选择支持的 SecretRef 解析。

有两种广泛的行为：

<Tabs>
  <Tab title="严格命令路径">
    例如 `openclaw memory` 远程内存路径和 `openclaw qr --remote`（当需要远程共享密钥 refs 时）。它们从活跃快照读取，当所需的 SecretRef 不可用时快速失败。
  </Tab>
  <Tab title="只读命令路径">
    例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit` 和只读 doctor/config 修复流程。它们也优先使用活跃快照，但当目标 SecretRef 在该命令路径中不可用时降级而不是中止。

    只读行为：

    - 当 Gateway 运行时，这些命令首先从活跃快照读取。
    - 如果 Gateway 解析不完整或 Gateway 不可用，它们尝试对特定命令表面进行目标本地回退。
    - 如果目标 SecretRef 仍然不可用，命令继续使用降级的只读输出，并附有明确的诊断，例如"已配置但在此命令路径中不可用"。
    - 此降级行为仅限于命令本地。它不会削弱运行时启动、重载或发送/认证路径。

  </Tab>
</Tabs>

其他注意事项：

- 后端 secret 轮换后的快照刷新由 `openclaw secrets reload` 处理。
- 这些命令路径使用的 Gateway RPC 方法：`secrets.resolve`。

## 审计和配置工作流

默认操作员流程：

<Steps>
  <Step title="审计当前状态">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="配置 SecretRefs">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="重新审计">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    发现包括：

    - 静态明文值（`openclaw.json`、`auth-profiles.json`、`.env` 和生成的 `agents/*/agent/models.json`）
    - 生成的 `models.json` 条目中明文敏感 provider 标头残留
    - 未解析的 refs
    - 优先级阴影（`auth-profiles.json` 优先于 `openclaw.json` refs）
    - 旧版残留（`auth.json`、OAuth 提醒）

    Exec 注意：

    - 默认情况下，audit 跳过 exec SecretRef 可解析性检查以避免命令副作用。
    - 使用 `openclaw secrets audit --allow-exec` 在 audit 期间执行 exec providers。

    标头残留注意：

    - 敏感 provider 标头检测基于名称启发式（常见的认证/凭证标头名称和片段，例如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`）。

  </Accordion>
  <Accordion title="secrets configure">
    交互式助手：

    - 首先配置 `secrets.providers`（`env`/`file`/`exec`，添加/编辑/删除）
    - 让您在 `openclaw.json` 加上一个 Agent 范围的 `auth-profiles.json` 中选择支持的密钥承载字段
    - 可以在目标选择器中直接创建新的 `auth-profiles.json` 映射
    - 捕获 SecretRef 详情（`source`、`provider`、`id`）
    - 运行预检解析
    - 可以立即应用

    Exec 注意：

    - 除非设置了 `--allow-exec`，否则预检跳过 exec SecretRef 检查。
    - 如果您从 `configure --apply` 直接应用且计划包含 exec refs/providers，也要为应用步骤保留 `--allow-exec`。

    有用的模式：

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 应用默认值：

    - 从 `auth-profiles.json` 中为目标 providers 清除匹配的静态凭证
    - 从 `auth.json` 中清除旧版静态 `api_key` 条目
    - 从 `<config-dir>/.env` 中清除匹配的已知密钥行

  </Accordion>
  <Accordion title="secrets apply">
    应用已保存的计划：

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec 注意：

    - dry-run 跳过 exec 检查，除非设置了 `--allow-exec`。
    - 写入模式拒绝包含 exec SecretRefs/providers 的计划，除非设置了 `--allow-exec`。

    有关严格的目标/路径契约详情和精确的拒绝规则，参见 [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)。

  </Accordion>
</AccordionGroup>

## 单向安全策略

<Warning>
OpenClaw 故意不写入包含历史明文密钥值的回滚备份。
</Warning>

安全模型：

- 预检必须在写入模式之前成功
- 在提交前验证运行时激活
- apply 使用原子文件替换更新文件，失败时尽力恢复

## 旧版认证兼容性说明

对于静态凭证，运行时不再依赖明文旧版认证存储。

- 运行时凭证来源是解析的内存快照。
- 旧版静态 `api_key` 条目在发现时被清除。
- OAuth 相关的兼容性行为保持独立。

## Web UI 说明

某些 SecretInput 联合在原始编辑器模式中比在表单模式中更容易配置。

## 相关

- [Authentication](/gateway/authentication) — 认证设置
- [CLI: secrets](/cli/secrets) — CLI 命令
- [Environment Variables](/help/environment) — 环境优先级
- [SecretRef Credential Surface](/reference/secretref-credential-surface) — 凭证表面
- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract) — 计划契约详情
- [Security](/gateway/security) — 安全态势
