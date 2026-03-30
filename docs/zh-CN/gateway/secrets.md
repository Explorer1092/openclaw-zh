---
summary: 密钥管理：SecretRef 合约、运行时快照行为和安全单向清除
read_when:
  - 为 Provider 凭证和 auth-profiles.json 引用配置 SecretRef
  - 在生产环境中安全地操作密钥重载、审计、配置和应用
  - 了解启动快速失败、非活跃表面过滤和最后已知良好状态行为
title: 密钥管理
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: anthropic
  source_hash: cf82ac2d30ed6b9d8c00081266c4561c0c37850f228b174f1639743da11c4ebe
  source_path: gateway/secrets.md
  workflow: 15
---

# 密钥管理

OpenClaw 支持附加式 SecretRef，这样支持的凭证无需以明文形式存储在配置中。

明文依然有效。SecretRef 是每个凭证的可选功能。

## 目标与运行时模型

密钥被解析为内存中的运行时快照。

- 解析在激活时积极执行，而非在请求路径上惰性执行。
- 当有效活跃的 SecretRef 无法解析时，启动快速失败。
- 重载使用原子交换：完全成功，或保留最后已知良好快照。
- 运行时请求仅从活跃的内存快照中读取。
- 在第一次成功的配置激活/加载后，运行时代码路径持续读取该活跃内存快照，直到成功重载交换它。
- 出站交付路径也从该活跃快照读取（例如 Discord 回复/线程交付和 Telegram 操作发送）；它们不在每次发送时重新解析 SecretRef。

这使密钥 Provider 中断不影响热请求路径。

## 活跃表面过滤

SecretRef 仅在有效活跃的表面上验证。

- 已启用表面：未解析的引用阻止启动/重载。
- 非活跃表面：未解析的引用不阻止启动/重载。
- 非活跃引用发出带有代码 `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 的非致命诊断信息。

非活跃表面示例：

- 已禁用的渠道/账户条目。
- 没有已启用账户继承的顶级渠道凭证。
- 已禁用的工具/功能表面。
- `tools.web.search.provider` 未选择的网络搜索 Provider 特定密钥。
  在自动模式（未设置 provider）下，按优先级查询密钥进行 provider 自动检测，直到某个解析成功。
  选择后，未选择的 provider 密钥被视为非活跃，直到被选中。
- 沙箱 SSH 认证材料（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`，加上每智能体覆盖）仅在默认智能体或已启用智能体的有效沙箱后端为 `ssh` 时才活跃。
- `gateway.remote.token` / `gateway.remote.password` SecretRef 在以下任一条件为真时活跃：
  - `gateway.mode=remote`
  - `gateway.remote.url` 已配置
  - `gateway.tailscale.mode` 为 `serve` 或 `funnel`
  - 在没有这些远程表面的本地模式下：
    - 当令牌认证可以胜出且没有配置环境/认证令牌时，`gateway.remote.token` 活跃。
    - 仅当密码认证可以胜出且没有配置环境/认证密码时，`gateway.remote.password` 活跃。
- 当设置了 `OPENCLAW_GATEWAY_TOKEN` 时，`gateway.auth.token` SecretRef 在启动认证解析时非活跃，因为环境令牌输入在该运行时赢得优先。

## Gateway 网关认证表面诊断

当在 `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token` 或 `gateway.remote.password` 上配置了 SecretRef 时，Gateway 网关启动/重载明确记录表面状态：

- `active`：SecretRef 是有效认证表面的一部分，必须解析。
- `inactive`：该运行时忽略 SecretRef，因为另一个认证表面胜出，或远程认证已禁用/不活跃。

这些条目以 `SECRETS_GATEWAY_AUTH_SURFACE` 记录，并包含活跃表面策略使用的原因，你可以看到凭证被视为活跃或非活跃的原因。

## 引导参考预检

当引导在交互模式下运行且你选择 SecretRef 存储时，OpenClaw 在保存前运行预检验证：

- 环境引用：验证环境变量名称并确认设置期间可见非空值。
- Provider 引用（`file` 或 `exec`）：验证 provider 选择，解析 `id`，并检查解析的值类型。
- 快速启动复用路径：当 `gateway.auth.token` 已经是 SecretRef 时，引导在探测/仪表盘引导之前解析它（对于 `env`、`file` 和 `exec` 引用），使用相同的快速失败门控。

如果验证失败，引导显示错误并允许你重试。

## SecretRef 合约

在任何地方使用一种对象形式：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

验证：

- `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
- `id` 必须匹配 `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

验证：

- `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
- `id` 必须是绝对 JSON 指针（`/...`）
- 段中的 RFC6901 转义：`~` => `~0`，`/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

验证：

- `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
- `id` 必须匹配 `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` 不得包含 `.` 或 `..` 作为斜杠分隔的路径段（例如 `a/../b` 被拒绝）

## Provider 配置

在 `secrets.providers` 下定义 provider：

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

### 环境 Provider

- 通过 `allowlist` 提供可选允许列表。
- 缺失/空的环境变量值导致解析失败。

### 文件 Provider

- 从 `path` 读取本地文件。
- `mode: "json"` 期望 JSON 对象负载并将 `id` 解析为指针。
- `mode: "singleValue"` 期望引用 id `"value"` 并返回文件内容。
- 路径必须通过所有权/权限检查。
- Windows 失败关闭说明：如果某个路径的 ACL 验证不可用，解析失败。仅对于可信路径，在该 provider 上设置 `allowInsecurePath: true` 以绕过路径安全检查。

### Exec Provider

- 运行配置的绝对二进制路径，无 shell。
- 默认情况下，`command` 必须指向常规文件（不是符号链接）。
- 设置 `allowSymlinkCommand: true` 允许符号链接命令路径（例如 Homebrew shims）。OpenClaw 验证解析的目标路径。
- 将 `allowSymlinkCommand` 与 `trustedDirs` 配对用于包管理器路径（例如 `["/opt/homebrew"]`）。
- 支持超时、无输出超时、输出字节限制、环境允许列表和可信目录。
- Windows 失败关闭说明：如果命令路径的 ACL 验证不可用，解析失败。仅对于可信路径，在该 provider 上设置 `allowInsecurePath: true` 以绕过路径安全检查。

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

## Exec 集成示例

### 1Password CLI

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

### HashiCorp Vault CLI

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

### `sops`

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

## MCP 服务器环境变量

通过 `plugins.entries.acpx.config.mcpServers` 配置的 MCP 服务器环境变量支持 SecretInput。这使 API 密钥和令牌远离明文配置：

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

明文字符串值依然有效。类似 `${MCP_SERVER_API_KEY}` 的环境模板引用和 SecretRef 对象在 MCP 服务器进程生成前的 Gateway 网关激活期间解析。与其他 SecretRef 表面一样，未解析的引用仅在 `acpx` 插件有效活跃时才阻止激活。

## 沙箱 SSH 认证材料

核心 `ssh` 沙箱后端也支持 SSH 认证材料的 SecretRef：

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

- OpenClaw 在沙箱激活期间解析这些引用，而不是在每次 SSH 调用时惰性解析。
- 解析的值以限制权限写入临时文件，并在生成的 SSH 配置中使用。
- 如果有效沙箱后端不是 `ssh`，这些引用保持非活跃状态且不阻止启动。

## 支持的凭证表面

标准支持和不支持的凭证列在：

- [SecretRef 凭证表面](/reference/secretref-credential-surface)

运行时生成或轮换的凭证及 OAuth 刷新材料故意从只读 SecretRef 解析中排除。

## 必需行为和优先级

- 没有引用的字段：不变。
- 有引用的字段：在激活期间对活跃表面必需。
- 如果同时存在明文和引用，引用在支持的优先级路径上优先。

警告和审计信号：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（运行时警告）
- `REF_SHADOWED`（当 `auth-profiles.json` 凭证优先于 `openclaw.json` 引用时的审计发现）

Google Chat 兼容行为：

- `serviceAccountRef` 优先于明文 `serviceAccount`。
- 当同级引用已设置时，明文值被忽略。

## 激活触发器

密钥激活在以下情况运行：

- 启动（预检加最终激活）
- 配置重载热应用路径
- 配置重载重启检查路径
- 通过 `secrets.reload` 手动重载

激活合约：

- 成功时原子交换快照。
- 启动失败中止 Gateway 网关启动。
- 运行时重载失败保留最后已知良好快照。
- 向出站辅助/工具调用提供显式的每次调用渠道令牌不触发 SecretRef 激活；激活点仍为启动、重载和显式 `secrets.reload`。

## 降级和恢复信号

当重载时激活在健康状态后失败时，OpenClaw 进入密钥降级状态。

一次性系统事件和日志代码：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行为：

- 降级：运行时保留最后已知良好快照。
- 恢复：在下次成功激活后发出一次。
- 在已降级时重复失败记录警告但不垃圾事件。
- 启动快速失败不发出降级事件，因为运行时从未变为活跃。

## 命令路径解析

命令路径可以通过 Gateway 网关快照 RPC 选择支持的 SecretRef 解析。

有两种广泛行为：

- 严格命令路径（例如 `openclaw memory` 远程内存路径和 `openclaw qr --remote`）从活跃快照读取，并在所需 SecretRef 不可用时快速失败。
- 只读命令路径（例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit` 以及只读 doctor/config 修复流程）也优先使用活跃快照，但当该命令路径中的目标 SecretRef 不可用时降级而不是中止。

只读行为：

- 当 Gateway 网关运行时，这些命令首先从活跃快照读取。
- 如果 Gateway 网关解析不完整或 Gateway 网关不可用，它们尝试针对特定命令表面进行有针对性的本地回退。
- 如果目标 SecretRef 仍不可用，命令继续降级的只读输出并显示明确诊断，例如"已配置但在此命令路径中不可用"。
- 这种降级行为仅限于命令本地。它不削弱运行时启动、重载或发送/认证路径。

其他说明：

- 后端密钥轮换后的快照刷新由 `openclaw secrets reload` 处理。
- 这些命令路径使用的 Gateway 网关 RPC 方法：`secrets.resolve`。

## 审计和配置工作流

默认操作员流程：

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

发现包括：

- 静态明文值（`openclaw.json`、`auth-profiles.json`、`.env` 和生成的 `agents/*/agent/models.json`）
- 生成的 `models.json` 条目中的明文敏感 Provider 头部残留
- 未解析的引用
- 优先级遮蔽（`auth-profiles.json` 优先于 `openclaw.json` 引用）
- 遗留残留（`auth.json`、OAuth 提醒）

Exec 说明：

- 默认情况下，审计跳过 exec SecretRef 可解析性检查以避免命令副作用。
- 使用 `openclaw secrets audit --allow-exec` 在审计期间执行 exec provider。

头部残留说明：

- 敏感 Provider 头部检测基于名称启发（常见认证/凭证头部名称和片段，例如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`）。

### `secrets configure`

交互式辅助工具，用于：

- 首先配置 `secrets.providers`（`env`/`file`/`exec`，添加/编辑/删除）
- 让你为一个智能体作用域选择 `openclaw.json` 和 `auth-profiles.json` 中支持的密钥承载字段
- 可以直接在目标选择器中创建新的 `auth-profiles.json` 映射
- 捕获 SecretRef 详细信息（`source`、`provider`、`id`）
- 运行预检解析
- 可以立即应用

Exec 说明：

- 除非设置了 `--allow-exec`，否则预检跳过 exec SecretRef 检查。
- 如果你直接从 `configure --apply` 应用且计划包含 exec 引用/provider，对于应用步骤也保持 `--allow-exec` 已设置。

有用的模式：

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

`configure` 应用默认值：

- 清除目标 provider 在 `auth-profiles.json` 中匹配的静态凭证
- 清除 `auth.json` 中的遗留静态 `api_key` 条目
- 清除 `<config-dir>/.env` 中匹配的已知密钥行

### `secrets apply`

应用已保存的计划：

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Exec 说明：

- dry-run 跳过 exec 检查，除非设置了 `--allow-exec`。
- 写入模式拒绝包含 exec SecretRef/provider 的计划，除非设置了 `--allow-exec`。

严格目标/路径合约详情和确切的拒绝规则，参见：

- [密钥应用计划合约](/gateway/secrets-plan-contract)

## 单向安全策略

OpenClaw 故意不写入包含历史明文密钥值的回滚备份。

安全模型：

- 写入模式前预检必须成功
- 提交前验证运行时激活
- 应用使用原子文件替换更新文件，失败时尽力恢复

## 遗留认证兼容说明

对于静态凭证，运行时不再依赖明文遗留认证存储。

- 运行时凭证来源是已解析的内存快照。
- 发现时清除遗留静态 `api_key` 条目。
- OAuth 相关兼容行为保持独立。

## Web UI 说明

某些 SecretInput 联合类型在原始编辑器模式下比表单模式更容易配置。

## 相关文档

- CLI 命令：[secrets](/cli/secrets)
- 计划合约详情：[密钥应用计划合约](/gateway/secrets-plan-contract)
- 凭证表面：[SecretRef 凭证表面](/reference/secretref-credential-surface)
- 认证设置：[认证](/gateway/authentication)
- 安全态势：[安全](/gateway/security)
- 环境优先级：[环境变量](/help/environment)
