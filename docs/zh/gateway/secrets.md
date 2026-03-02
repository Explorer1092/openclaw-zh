---
mmh3_hash: "0de456aeaa2aff975c132d6e0063815c"
summary: "Secrets 管理:SecretRef 合约、运行时快照行为和安全单向清除"
read_when:
  - 为 Provider、认证 profile、Skill 或 Google Chat 配置 SecretRef
  - 在生产环境中安全地操作 secrets reload/audit/configure/apply
  - 了解快速失败和保留上一已知正常状态的行为
title: "Secrets 管理"
---

# Secrets 管理

OpenClaw 支持附加式 secret 引用，使凭证无需以明文形式存储在配置文件中。

明文仍然有效。Secret ref 是可选的。

## 目标和运行时模型

Secrets 被解析到内存中的运行时快照。

- 解析在激活时立即进行，而非在请求路径上延迟执行。
- 如果任何引用的凭证无法解析，启动将快速失败。
- 重新加载使用原子替换：完全成功或保留上一已知正常状态。
- 运行时请求从活跃的内存快照读取。

这使 secret Provider 中断不会影响热请求路径。

## 引导参考预检

当引导在交互模式下运行且您选择 secret 引用存储时，OpenClaw 在保存前执行快速预检:

- Env ref：验证环境变量名称，并确认在引导期间可以看到非空值。
- Provider ref（`file` 或 `exec`）：验证选定的 Provider，解析提供的 `id`，并检查值类型。

如果验证失败，引导将显示错误并允许您重试。

## SecretRef 合约

在所有地方使用同一对象形状:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

验证:

- `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
- `id` 必须匹配 `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

验证:

- `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
- `id` 必须是绝对 JSON 指针（`/...`）
- 段中的 RFC6901 转义：`~` => `~0`，`/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

验证:

- `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
- `id` 必须匹配 `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`

## Provider 配置

在 `secrets.providers` 下定义 Provider:

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

### Env Provider

- 通过 `allowlist` 设置可选白名单。
- 缺失/空环境变量将导致解析失败。

### File Provider

- 从 `path` 读取本地文件。
- `mode: "json"` 期望 JSON 对象负载，并将 `id` 解析为指针。
- `mode: "singleValue"` 期望 ref id 为 `"value"`，并返回文件内容。
- 路径必须通过所有权/权限检查。

### Exec Provider

- 运行已配置的绝对二进制路径，不使用 shell。
- 默认情况下，`command` 必须指向常规文件（非符号链接）。
- 设置 `allowSymlinkCommand: true` 以允许符号链接命令路径（例如 Homebrew shim）。OpenClaw 会验证解析后的目标路径。
- 仅在受信任的包管理器路径需要时才启用 `allowSymlinkCommand`，并配合 `trustedDirs`（例如 `["/opt/homebrew"]`）使用。
- 设置 `trustedDirs` 后，检查适用于解析后的目标路径。
- 支持超时、无输出超时、输出字节限制、环境变量白名单和受信目录。
- 请求负载（stdin）:

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

- 响应负载（stdout）:

```json
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "sk-..." } }
```

可选的每个 id 错误:

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
        allowSymlinkCommand: true, // Homebrew 符号链接二进制文件所需
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
        allowSymlinkCommand: true, // Homebrew 符号链接二进制文件所需
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
        allowSymlinkCommand: true, // Homebrew 符号链接二进制文件所需
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

## 范围内字段（v1）

### `~/.openclaw/openclaw.json`

- `models.providers.<provider>.apiKey`
- `skills.entries.<skillKey>.apiKey`
- `channels.googlechat.serviceAccount`
- `channels.googlechat.serviceAccountRef`
- `channels.googlechat.accounts.<accountId>.serviceAccount`
- `channels.googlechat.accounts.<accountId>.serviceAccountRef`

### `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

- `profiles.<profileId>.keyRef`（`type: "api_key"`）
- `profiles.<profileId>.tokenRef`（`type: "token"`）

OAuth 凭证存储更改不在范围内。

## 必要行为和优先级

- 没有 ref 的字段：保持不变。
- 有 ref 的字段：激活时必须存在。
- 如果明文和 ref 同时存在，ref 在运行时优先，明文被忽略。

警告代码:

- `SECRETS_REF_OVERRIDES_PLAINTEXT`

## 激活触发条件

Secret 激活在以下情况下尝试:

- 启动（预检加最终激活）
- 配置重新加载热应用路径
- 配置重新加载重启检查路径
- 通过 `secrets.reload` 手动重新加载

激活合约:

- 成功时原子性替换快照。
- 启动失败会中止 Gateway 启动。
- 运行时重新加载失败时保留上一已知正常快照。

## 降级和恢复运维信号

当重新加载时激活在健康状态后失败，OpenClaw 进入 secrets 降级状态。

一次性系统事件和日志代码:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行为:

- 降级：运行时保留上一已知正常快照。
- 恢复：在成功激活后发出一次。
- 已处于降级状态时的重复失败记录警告，但不产生事件洪泛。
- 启动快速失败不会发出降级事件，因为此时还没有运行时快照。

## 审计和配置工作流

使用以下默认运维流程:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

迁移完整性:

- 当这些 Skill 使用 API 密钥时，请包含 `skills.entries.<skillKey>.apiKey` 目标。
- 如果部分迁移后 `audit --check` 仍报告明文发现，请迁移剩余报告的路径并重新运行 audit。

### `secrets audit`

发现内容包括:

- 静态明文值（`openclaw.json`、`auth-profiles.json`、`.env`）
- 未解析的 ref
- 优先级覆盖（`auth-profiles` 优先于配置 ref）
- 遗留残留（`auth.json`、OAuth 范围外提醒）

### `secrets configure`

交互式助手，可:

- 首先配置 `secrets.providers`（`env`/`file`/`exec`，添加/编辑/删除）
- 让您选择 `openclaw.json` 中含 secret 的字段
- 捕获 SecretRef 详情（`source`、`provider`、`id`）
- 运行预检解析
- 可立即应用

实用模式:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`

`configure` 应用默认执行:

- 从 `auth-profiles.json` 中清除目标 Provider 对应的静态凭证
- 从 `auth.json` 中清除遗留静态 `api_key` 条目
- 从 `<config-dir>/.env` 中清除匹配的已知 secret 行

### `secrets apply`

应用已保存的计划:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
```

有关严格的目标/路径合约详情和确切拒绝规则，请参见:

- [Secrets Apply 计划合约](/gateway/secrets-plan-contract)

## 单向安全策略

OpenClaw 有意**不**写入包含迁移前明文 secret 值的回滚备份。

安全模型:

- 写入模式前预检必须成功
- 提交前验证运行时激活
- apply 使用原子文件替换更新文件，失败时尽力进行内存内恢复

## `auth.json` 兼容性说明

对于静态凭证，OpenClaw 运行时不再依赖明文 `auth.json`。

- 运行时凭证来源是已解析的内存快照。
- 遗留 `auth.json` 静态 `api_key` 条目在发现时被清除。
- OAuth 相关的遗留兼容行为保持独立。

## 相关文档

- CLI 命令:[secrets](/cli/secrets)
- 计划合约详情:[Secrets Apply 计划合约](/gateway/secrets-plan-contract)
- 认证设置:[认证](/gateway/authentication)
- 安全态势:[安全](/gateway/security)
- 环境变量优先级:[环境变量](/help/environment)
