---
mmh3_hash: "70c5927a8bffe910b395274e3fb02256"
title: "Anthropic (Claude)"
sidebarTitle: "Anthropic"
summary: "在 OpenClaw 中通过 API 密钥或 setup-token 使用 Anthropic Claude"
read_when:
  - 您想在 OpenClaw 中使用 Anthropic 模型
  - 您想使用 setup-token 而不是 API 密钥
---

# Anthropic (Claude)

Anthropic 构建了 **Claude** 模型系列，并通过 API 提供访问。
在 OpenClaw 中，您可以使用 API 密钥或 **setup-token** 进行身份验证。

## 选项 A：Anthropic API 密钥

**适用于：** 标准 API 访问和基于使用量的计费。
在 Anthropic Console 中创建您的 API 密钥。

### CLI 设置

```bash
openclaw onboard
# 选择: Anthropic API key

# 或非交互式
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### 配置片段

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 思考默认值（Claude 4.6）

- 当没有设置明确的思考级别时，Anthropic Claude 4.6 模型在 OpenClaw 中默认使用 `adaptive` 思考模式。
- 您可以按消息覆盖（`/think:<level>`）或在模型参数中设置：
  `agents.defaults.models["anthropic/<model>"].params.thinking`。
- 相关 Anthropic 文档：
  - [自适应思考](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [扩展思考](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Fast 模式（Anthropic API）

OpenClaw 的共享 `/fast` 切换也支持直接 Anthropic API 密钥流量。

- `/fast on` 映射到 `service_tier: "auto"`
- `/fast off` 映射到 `service_tier: "standard_only"`
- 配置默认值：

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-6": {
          params: { fastMode: true },
        },
      },
    },
  },
}
```

重要限制：

- 此功能**仅限 API 密钥**。Anthropic setup-token / OAuth 身份验证不支持 OpenClaw fast 模式服务层注入。
- OpenClaw 仅对直接 `api.anthropic.com` 请求注入 Anthropic 服务层。如果您通过代理或网关路由 `anthropic/*`，`/fast` 不会修改 `service_tier`。
- Anthropic 在响应的 `usage.service_tier` 中报告有效层级。在没有 Priority Tier 容量的账户上，`service_tier: "auto"` 仍可能解析为 `standard`。

## Prompt 缓存（Anthropic API）

OpenClaw 支持 Anthropic 的 prompt 缓存功能。这是**仅限 API** 的功能；订阅身份验证不遵守缓存设置。

### 配置

在您的模型配置中使用 `cacheRetention` 参数：

| 值      | 缓存持续时间 | 描述                         |
| ------- | ------------ | ---------------------------- |
| `none`  | 不缓存       | 禁用 prompt 缓存             |
| `short` | 5 分钟       | API Key 身份验证的默认值     |
| `long`  | 1 小时       | 扩展缓存（需要 beta 标志）   |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### 默认值

当使用 Anthropic API Key 身份验证时，OpenClaw 会自动为所有 Anthropic 模型应用 `cacheRetention: "short"`（5 分钟缓存）。您可以通过在配置中显式设置 `cacheRetention` 来覆盖此设置。

### 按 Agent 的 cacheRetention 覆盖

使用模型级参数作为基准，然后通过 `agents.list[].params` 覆盖特定 Agent。

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // 大多数 Agent 的基准
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // 仅覆盖此 Agent
    ],
  },
}
```

缓存相关参数的配置合并顺序：

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params`（匹配 `id`，按键覆盖）

这允许一个 Agent 保持长期缓存，而同一模型上的另一个 Agent 禁用缓存，以避免对突发/低重用流量产生写入成本。

### Bedrock Claude 注意事项

- Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在配置时接受 `cacheRetention` 透传。
- 非 Anthropic Bedrock 模型在运行时强制设置为 `cacheRetention: "none"`。
- Anthropic API 密钥智能默认值也会在没有设置显式值时为 Claude-on-Bedrock 模型引用生成 `cacheRetention: "short"`。

### 旧参数

旧的 `cacheControlTtl` 参数仍然支持以保持向后兼容性：

- `"5m"` 映射到 `short`
- `"1h"` 映射到 `long`

我们建议迁移到新的 `cacheRetention` 参数。

OpenClaw 在 Anthropic API 请求中包含 `extended-cache-ttl-2025-04-11` beta 标志；
如果您覆盖提供商标头，请保留它（参见 [/gateway/configuration](/gateway/configuration)）。

## 1M 上下文窗口（Anthropic beta）

Anthropic 的 1M 上下文窗口处于 beta 阶段。在 OpenClaw 中，通过为支持的 Opus/Sonnet 模型设置
`params.context1m: true` 来逐个启用。

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { context1m: true },
        },
      },
    },
  },
}
```

OpenClaw 将此映射到 Anthropic 请求的 `anthropic-beta: context-1m-2025-08-07`。

仅当 `params.context1m` 显式设置为 `true` 时，此功能才会激活。

要求：Anthropic 必须允许该凭据使用长上下文（通常是 API 密钥计费，或启用了 Extra Usage 的订阅账户）。否则 Anthropic 会返回：
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

注意：当使用 OAuth/订阅令牌（`sk-ant-oat-*`）时，Anthropic 当前会拒绝 `context-1m-*` beta 请求。OpenClaw 会自动跳过 OAuth 身份验证的 context1m beta 标头，并保留所需的 OAuth beta。

## 选项 B：Claude setup-token

**适用于：** 使用您的 Claude 订阅。

### 在哪里获取 setup-token

Setup-tokens 由 **Claude Code CLI** 创建，而不是 Anthropic Console。您可以在**任何机器**上运行此命令：

```bash
claude setup-token
```

将令牌粘贴到 OpenClaw 中（向导：**Anthropic token (paste setup-token)**），或在网关主机上运行：

```bash
openclaw models auth setup-token --provider anthropic
```

如果您在不同的机器上生成了令牌，请粘贴它：

```bash
openclaw models auth paste-token --provider anthropic
```

### CLI 设置 (setup-token)

```bash
# 在入门期间粘贴 setup-token
openclaw onboard --auth-choice setup-token
```

### 配置片段 (setup-token)

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 注意事项

- 使用 `claude setup-token` 生成 setup-token 并粘贴它，或在网关主机上运行 `openclaw models auth setup-token`。
- 如果您在 Claude 订阅上看到 "OAuth token refresh failed …"，请使用 setup-token 重新认证。参见 [/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription](/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription)。
- 身份验证详细信息 + 重用规则在 [/concepts/oauth](/concepts/oauth) 中。

## 故障排除

**401 错误 / 令牌突然无效**

- Claude 订阅身份验证可能会过期或被撤销。重新运行 `claude setup-token`
  并将其粘贴到**网关主机**中。
- 如果 Claude CLI 登录在不同的机器上，请在网关主机上使用
  `openclaw models auth paste-token --provider anthropic`。

**找不到提供商 "anthropic" 的 API 密钥**

- 身份验证是**按 Agent** 的。新 Agent 不继承主 Agent 的密钥。
- 为该 Agent 重新运行入门，或在网关主机上粘贴 setup-token / API 密钥，
  然后使用 `openclaw models status` 验证。

**找不到配置文件 `anthropic:default` 的凭据**

- 运行 `openclaw models status` 查看哪个身份验证配置文件处于活动状态。
- 重新运行入门，或为该配置文件粘贴 setup-token / API 密钥。

**没有可用的身份验证配置文件（全部处于冷却/不可用状态）**

- 检查 `openclaw models status --json` 中的 `auth.unusableProfiles`。
- 添加另一个 Anthropic 配置文件或等待冷却结束。

更多信息：[/gateway/troubleshooting](/gateway/troubleshooting) 和 [/help/faq](/help/faq)。
