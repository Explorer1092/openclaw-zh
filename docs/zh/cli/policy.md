---
mmh3_hash: "7e3603f1bfe83913b6b891c3087cdbef"
summary: "`openclaw policy` 合规性检查的 CLI 参考"
read_when:
  - 您想根据编写的 policy.jsonc 检查 OpenClaw 设置
  - 您希望在 doctor lint 中包含 Policy 检查结果
  - 您需要用于审计证据的 Policy 证明哈希
title: "Policy"
---

# `openclaw policy`

`openclaw policy` 由捆绑的 Policy Plugin 提供。Policy 是对现有 OpenClaw 设置的企业合规性层。它不添加第二个配置系统。`policy.jsonc` 定义编写的要求，OpenClaw 将活跃工作区作为证据观察，Policy 健康检查通过 `doctor --lint` 报告偏差。最终的合规性信号是干净的 `doctor --lint` 运行；Policy 向该共享 lint 接口贡献检查结果，而不是创建单独的健康门控。

Policy 目前管理已配置的 Channel、MCP 服务器、模型 Provider、网络 SSRF 姿态、Gateway 暴露姿态、Agent 工作区姿态、OpenClaw 配置密钥 Provider/Auth 档案姿态，以及受管工具声明。例如，IT 或工作区运营商可以记录 Telegram 不是批准的 Channel Provider，将 MCP 服务器和模型引用限制为批准的条目，要求私有网络获取/浏览器访问保持禁用，要求 Gateway 绑定/Auth/HTTP 暴露在审查范围内，要求 Agent 工作区访问和工具拒绝保持在审查姿态，要求 OpenClaw 配置 SecretRef 使用托管 Provider，要求配置 Auth 档案携带 Provider/模式元数据，要求受管工具携带风险和敏感性元数据，然后使用 `doctor --lint` 作为共享合规性门控。

当工作区需要持久声明（如"这些 Channel 不得启用"或"受管工具必须声明审批元数据"）以及可重复的方式证明 OpenClaw 仍符合该声明时，使用 Policy。当您只需要本地行为而不需要 Policy 检查结果或证明输出时，单独使用常规配置和工作区文档。

## 快速开始

首次使用前启用捆绑的 Policy Plugin：

```bash
openclaw plugins enable policy
```

启用 Policy 后，doctor 无需激活任意 Plugin 即可加载 Policy 健康检查。即使 `policy.jsonc` 缺失，Plugin 也保持启用状态，因此 doctor 可以报告缺失的工件。

Policy 是编写的，而不是从用户当前设置生成的。适用于 Channel、MCP 服务器、模型 Provider、网络姿态、Gateway 暴露、Agent 工作区姿态、OpenClaw 配置密钥 Provider/Auth 档案姿态和工具元数据的最小 Policy 如下所示：

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram 不适用于此工作区。",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

规则是权威。类别块只是命名空间；仅当存在具体规则时才运行检查。OpenClaw 读取当前 `channels.*` 设置、`mcp.servers.*`、`models.providers.*`、选定的 Agent 模型引用、网络 SSRF 设置、Gateway 绑定/Auth/Control UI/Tailscale/远程/HTTP 姿态、OpenClaw 配置 Agent 沙箱工作区访问和工具拒绝姿态、配置密钥 Provider 和 SecretRef 来源、配置 Auth 档案元数据、已配置的全局/每 Agent 工具姿态以及 `TOOLS.md` 声明作为证据，然后报告不符合要求的观察状态。如果 Policy 拒绝非回环 Gateway 绑定，则仅在您愿意审查运行时默认值时才省略 `gateway.bind`；对于严格配置合规性，设置 `gateway.bind=loopback`。对于只读 Agent 姿态，在适用的默认值或 Agent 上配置沙箱模式，并将 `workspaceAccess` 设置为 `none` 或 `ro`；省略或 `off` 沙箱模式不满足只读/禁止写入的 Policy。`agents.workspace.denyTools` 支持 `exec`、`process`、`write`、`edit` 和 `apply_patch`；OpenClaw 配置中 `group:fs` 涵盖文件变更工具，`group:runtime` 涵盖 shell/进程工具。工具姿态 Policy 观察 `tools.profile`、`tools.allow`、`tools.alsoAllow`、`tools.deny`、`tools.fs.workspaceOnly`、`tools.exec.security`、`tools.exec.ask`、`tools.exec.host`、`tools.elevated.enabled`，以及相同的每 Agent `agents.list[].tools.*` 覆盖。它不读取运行时/运营商审批状态（如 exec-approvals.json），也不在运行时强制执行工具调用。密钥证据记录 Provider/来源姿态和 SecretRef 元数据，从不记录原始密钥值。Policy 不读取或证明每 Agent 凭证存储（如 `auth-profiles.json`）；这些存储由现有的 Auth 和凭证流程拥有。

### Policy 规则参考

以下每个 Policy 字段都是可选的。仅当 `policy.jsonc` 中存在匹配规则时才运行检查。观察状态是现有的 OpenClaw 配置或工作区元数据；Policy 报告偏差，但不重写运行时行为，除非明确提供并启用了修复路径。

#### Channel

| Policy 字段                          | 观察状态                              | 使用场景                                       |
| ------------------------------------ | ------------------------------------- | ---------------------------------------------- |
| `channels.denyRules[].when.provider` | `channels.*` Provider 和启用状态     | 拒绝来自 `telegram` 等 Provider 的已配置 Channel。|
| `channels.denyRules[].reason`        | 检查结果消息和修复提示上下文           | 解释为何拒绝该 Provider。                      |

#### MCP 服务器

| Policy 字段         | 观察状态            | 使用场景                                         |
| ------------------- | ------------------- | ------------------------------------------------ |
| `mcp.servers.allow` | `mcp.servers.*` ID | 要求每个已配置的 MCP 服务器都在白名单中。         |
| `mcp.servers.deny`  | `mcp.servers.*` ID | 拒绝特定已配置的 MCP 服务器 ID。                 |

#### 模型 Provider

| Policy 字段              | 观察状态                                        | 使用场景                                                          |
| ------------------------ | ----------------------------------------------- | ----------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` ID 和选定的模型引用        | 要求已配置的 Provider 和选定模型引用使用批准的 Provider。         |
| `models.providers.deny`  | `models.providers.*` ID 和选定的模型引用        | 按 Provider ID 拒绝已配置的 Provider 和选定模型引用。             |

#### 网络

| Policy 字段                    | 观察状态                        | 使用场景                                           |
| ------------------------------ | ------------------------------- | -------------------------------------------------- |
| `network.privateNetwork.allow` | 私有网络 SSRF 逃逸通道          | 设置为 `false` 要求私有网络访问保持禁用。           |

#### Gateway

| Policy 字段                             | 观察状态                                   | 使用场景                                           |
| --------------------------------------- | ------------------------------------------ | -------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                             | 设置为 `false` 要求 Gateway 仅绑定到回环地址。     |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel Gateway 姿态        | 设置为 `false` 拒绝 Tailscale Funnel 暴露。        |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                        | 设置为 `true` 拒绝禁用 Gateway Auth。              |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                   | 设置为 `true` 要求显式 Auth 速率限制配置。         |
| `gateway.controlUi.allowInsecure`       | Control UI 不安全 Auth/设备/来源开关       | 设置为 `false` 拒绝不安全的 Control UI 暴露开关。  |
| `gateway.remote.allow`                  | 远程 Gateway 模式/配置                     | 设置为 `false` 拒绝远程 Gateway 模式。             |
| `gateway.http.denyEndpoints`            | Gateway HTTP API 端点                      | 拒绝端点 ID，如 `chatCompletions` 或 `responses`。|
| `gateway.http.requireUrlAllowlists`     | Gateway HTTP URL 获取输入                  | 设置为 `true` 要求 URL 获取输入具有 URL 白名单。   |

#### Agent 工作区

| Policy 字段                      | 观察状态                                                                              | 使用场景                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` 和 `agents.list[].sandbox.workspaceAccess` | 仅允许沙箱工作区访问值，如 `none` 或 `ro`。                                                   |
| `agents.workspace.denyTools`     | 全局和每 Agent 工具拒绝配置                                                           | 要求拒绝工作区/运行时变更工具，如 `exec`、`process`、`write`、`edit` 或 `apply_patch`。       |

#### 密钥

| Policy 字段                       | 观察状态                                                 | 使用场景                                                             |
| --------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 配置 SecretRef 和 `secrets.providers.*` 声明            | 设置为 `true` 要求 SecretRef 指向已声明的 Provider。                 |
| `secrets.denySources`             | 密钥 Provider 来源和 SecretRef 来源                      | 拒绝来源，如 `exec`、`file` 或其他已配置的来源名称。                 |
| `secrets.allowInsecureProviders`  | 不安全密钥 Provider 姿态标志                             | 设置为 `false` 拒绝选择不安全姿态的 Provider。                       |

#### Auth 档案

| Policy 字段                     | 观察状态                                 | 使用场景                                                                     |
| ------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | `auth.profiles.*` Provider 和模式元数据 | 要求配置 Auth 档案上具有 `provider` 和 `mode` 等元数据键。                   |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                  | 仅允许支持的 Auth 档案模式，如 `api_key`、`aws-sdk`、`oauth` 或 `token`。    |

#### 工具元数据

| Policy 字段             | 观察状态                       | 使用场景                                                                     |
| ----------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| `tools.requireMetadata` | 受管 `TOOLS.md` 声明           | 要求受管工具声明元数据键，如 `risk`、`sensitivity` 或 `owner`。              |

#### 工具姿态

| Policy 字段                     | 观察状态                                                  | 使用场景                                                                                           |
| ------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` 和 `agents.list[].tools.profile`          | 仅允许工具 Profile ID，如 `minimal`、`messaging` 或 `coding`。                                     |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` 和每 Agent `tools.fs` 覆盖       | 设置为 `true` 要求仅限工作区的文件系统工具姿态。                                                   |
| `tools.exec.allowSecurity`      | `tools.exec.security` 和每 Agent exec 安全性              | 仅允许 exec 安全模式，如 `deny` 或 `allowlist`。                                                   |
| `tools.exec.requireAsk`         | `tools.exec.ask` 和每 Agent exec 询问模式                 | 要求审批姿态，如 `always`。                                                                        |
| `tools.exec.allowHosts`         | `tools.exec.host` 和每 Agent exec 主机路由                | 仅允许 exec 主机路由模式，如 `sandbox`。                                                           |
| `tools.elevated.allow`          | `tools.elevated.enabled` 和每 Agent 高权限姿态            | 设置为 `false` 要求高权限工具模式保持禁用。                                                        |
| `tools.denyTools`               | `tools.deny` 和 `agents.list[].tools.deny`                | 要求已配置的工具拒绝列表包含工具 ID 或组，如 `group:runtime` 和 `group:fs`。                       |

在编写过程中运行仅 Policy 检查：

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` 仅运行 Policy 检查集并输出证据、检查结果和证明哈希。当启用 Policy Plugin 时，相同的检查结果也会出现在 `openclaw doctor --lint` 中。

干净的 JSON 输出示例包含运营商或监督者可以记录的稳定哈希：

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## 配置 Policy

Policy 配置位于 `plugins.entries.policy.config` 下。

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| 设置                       | 用途                                                        |
| -------------------------- | ----------------------------------------------------------- |
| `enabled`                  | 即使 `policy.jsonc` 不存在也启用 Policy 检查。              |
| `workspaceRepairs`         | 允许 `doctor --fix` 编辑 Policy 管理的工作区设置。          |
| `expectedHash`             | 已批准 Policy 工件的可选哈希锁定。                          |
| `expectedAttestationHash`  | 最后一次接受的干净 Policy 检查的可选哈希锁定。              |
| `path`                     | Policy 工件的工作区相对位置。                               |

将 `plugins.entries.policy.config.enabled` 设置为 `false` 可在保持 Plugin 安装的同时禁用工作区的 Policy 检查。

工具元数据要求在 `policy.jsonc` 中使用 `tools.requireMetadata` 编写，例如 `["risk", "sensitivity", "owner"]`。

## 接受 Policy 状态

JSON 输出示例：

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [...],
    "mcpServers": [...],
    "modelProviders": [...],
    "modelRefs": [...],
    "network": [...],
    "gatewayExposure": [...],
    "agentWorkspace": [...],
    "secrets": [...],
    "authProfiles": [...],
    "tools": [...]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

Policy 哈希标识编写的规则工件。证据块记录 Policy 检查使用的观察 OpenClaw 状态。`workspace.hash` 值标识已检查范围的该证据负载。检查结果哈希标识检查返回的确切检查结果集。`checkedAt` 记录评估运行时间。证明哈希标识稳定的声明：Policy 哈希、证据哈希、检查结果哈希以及结果是否干净。它故意不包含 `checkedAt`，因此相同的 Policy 状态在重复检查中产生相同的证明。这些共同构成此 Policy 检查的审计元组。

如果后续 Gateway 或监督者使用 Policy 来阻止、批准或注释运行时操作，它应记录最后一次干净 Policy 检查中的证明哈希。`checkedAt` 保留在 JSON 输出中用于审计日志，但不是稳定证明哈希的一部分。

接受 Policy 状态时使用以下生命周期：

1. 编写或审查 `policy.jsonc`。
2. 运行 `openclaw policy check --json`。
3. 如果结果干净，将 `attestation.policy.hash` 记录为 `expectedHash`。
4. 将 `attestation.attestationHash` 记录为 `expectedAttestationHash`。
5. 在 CI 或发布门控中重新运行 `openclaw doctor --lint`。

如果 Policy 规则有意更改，请从干净检查中更新两个接受的哈希。如果工作区设置有意更改但 Policy 保持不变，通常只有 `expectedAttestationHash` 会更改。

启用或升级 `agents.workspace` 规则会将 `agentWorkspace` 证据添加到工作区哈希和证明哈希中。运营商应在启用这些规则后审查新证据并刷新接受的证明哈希。以相同方式启用或升级工具姿态规则会添加 `toolPosture` 证据。

`openclaw policy watch` 重复运行相同的检查，并在当前证据不再匹配 `expectedAttestationHash` 时报告：

```bash
openclaw policy watch --json
```

在只需要一次偏差评估的 CI 或脚本中使用 `--once`。不使用 `--once` 时，命令默认每两秒轮询一次；使用 `--interval-ms` 选择不同的间隔。

## 检查结果

Policy 目前验证以下内容：

| 检查 ID                                       | 检查结果                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                 | Policy 已启用但 `policy.jsonc` 缺失。                                             |
| `policy/policy-jsonc-invalid`                 | Policy 无法解析或包含格式错误的规则条目。                                         |
| `policy/policy-hash-mismatch`                 | Policy 与已配置的 `expectedHash` 不匹配。                                         |
| `policy/attestation-hash-mismatch`            | 当前 Policy 证据不再匹配已接受的证明。                                            |
| `policy/channels-denied-provider`             | 已启用的 Channel 匹配 Channel 拒绝规则。                                          |
| `policy/mcp-denied-server`                    | 已配置的 MCP 服务器被 Policy 拒绝。                                               |
| `policy/mcp-unapproved-server`                | 已配置的 MCP 服务器不在白名单中。                                                 |
| `policy/models-denied-provider`               | 已配置的模型 Provider 或模型引用使用了被拒绝的 Provider。                         |
| `policy/models-unapproved-provider`           | 已配置的模型 Provider 或模型引用不在白名单中。                                    |
| `policy/network-private-access-enabled`       | 当 Policy 拒绝时，私有网络 SSRF 逃逸通道已启用。                                  |
| `policy/gateway-non-loopback-bind`            | 当 Policy 拒绝时，Gateway 绑定姿态允许非回环暴露。                                |
| `policy/gateway-auth-disabled`                | 当 Policy 要求 Auth 时，Gateway 身份验证被禁用。                                  |
| `policy/gateway-rate-limit-missing`           | 当 Policy 要求时，Gateway Auth 速率限制姿态不明确。                               |
| `policy/gateway-control-ui-insecure`          | Gateway Control UI 不安全暴露开关已启用。                                         |
| `policy/gateway-tailscale-funnel`             | 当 Policy 拒绝时，Gateway Tailscale Funnel 暴露已启用。                           |
| `policy/gateway-remote-enabled`               | 当 Policy 拒绝时，Gateway 远程模式处于活跃状态。                                  |
| `policy/gateway-http-endpoint-enabled`        | Gateway HTTP API 端点在被 Policy 拒绝的情况下仍处于启用状态。                    |
| `policy/gateway-http-url-fetch-unrestricted`  | Gateway HTTP URL 获取输入缺少必需的 URL 白名单。                                  |
| `policy/agents-workspace-access-denied`       | Agent 沙箱模式或工作区访问不在 Policy 白名单中。                                  |
| `policy/agents-tool-not-denied`               | Agent 或默认配置未拒绝 Policy 要求拒绝的工具。                                    |
| `policy/tools-profile-unapproved`             | 已配置的全局或每 Agent 工具 Profile 不在白名单中。                                |
| `policy/tools-fs-workspace-only-required`     | 文件系统工具未配置仅限工作区的路径姿态。                                          |
| `policy/tools-exec-security-unapproved`       | Exec 安全模式不在 Policy 白名单中。                                               |
| `policy/tools-exec-ask-unapproved`            | Exec 询问模式不在 Policy 白名单中。                                               |
| `policy/tools-exec-host-unapproved`           | Exec 主机路由不在 Policy 白名单中。                                               |
| `policy/tools-elevated-enabled`               | 当 Policy 拒绝时，高权限工具模式已启用。                                          |
| `policy/tools-required-deny-missing`          | 全局或每 Agent 工具拒绝列表不包含必需的被拒绝工具。                               |
| `policy/secrets-unmanaged-provider`           | 配置 SecretRef 引用了未在 `secrets.providers` 下声明的 Provider。                 |
| `policy/secrets-denied-provider-source`       | 配置密钥 Provider 或 SecretRef 使用了 Policy 拒绝的来源。                        |
| `policy/secrets-insecure-provider`            | 当 Policy 拒绝时，密钥 Provider 选择了不安全姿态。                                |
| `policy/auth-profile-invalid-metadata`        | 配置 Auth 档案缺少有效的 Provider 或模式元数据。                                  |
| `policy/auth-profile-unapproved-mode`         | 配置 Auth 档案模式不在 Policy 白名单中。                                          |
| `policy/tools-missing-risk-level`             | 受管工具声明缺少风险元数据。                                                      |
| `policy/tools-unknown-risk-level`             | 受管工具声明使用了未知风险值。                                                    |
| `policy/tools-missing-sensitivity-token`      | 受管工具声明缺少敏感性元数据。                                                    |
| `policy/tools-missing-owner`                  | 受管工具声明缺少所有者元数据。                                                    |
| `policy/tools-unknown-sensitivity-token`      | 受管工具声明使用了未知敏感性值。                                                  |

Policy 检查结果可以同时包含 `target` 和 `requirement`。`target` 是不符合要求的已观察工作区对象。`requirement` 是使其成为检查结果的编写 Policy 规则。两个值目前都是地址（通常是 `oc://` 路径），但字段名描述的是其 Policy 角色而非地址格式。

## 修复

`doctor --lint` 和 `policy check` 是只读的。

`doctor --fix` 仅在显式启用 `workspaceRepairs` 时才编辑 Policy 管理的工作区设置。没有该选项，Policy 检查会报告它们将修复的内容并保持设置不变。

在此版本中，修复可以禁用在 OpenClaw 配置中启用但被 `channels.denyRules` 拒绝的 Channel。仅在审查 Policy 文件后才启用 `workspaceRepairs`，因为有效的拒绝规则可以关闭已配置的 Channel：

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## 退出代码

| 命令           | `0`                              | `1`                                  | `2`                     |
| -------------- | -------------------------------- | ------------------------------------ | ----------------------- |
| `policy check` | 阈值内无检查结果。               | 一个或多个检查结果达到阈值。         | 参数或运行时失败。      |
| `policy watch` | 无检查结果且接受的哈希是最新的。 | 存在检查结果或接受的证明已过时。     | 参数或运行时失败。      |

## 相关

- [Doctor lint 模式](/cli/doctor#lint-mode)
- [Path CLI](/cli/path)
