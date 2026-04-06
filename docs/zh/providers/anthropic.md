---
mmh3_hash: "7f4cf903577204cbcc889d437bfcf2cb"
title: "Anthropic (Claude)"
sidebarTitle: "Anthropic"
summary: "在 OpenClaw 中通过 API 密钥使用 Anthropic Claude"
read_when:
  - 您想在 OpenClaw 中使用 Anthropic 模型
---

# Anthropic (Claude)

Anthropic 构建了 **Claude** 模型系列，并通过 API 提供访问。在 OpenClaw 中，新的 Anthropic 设置应使用 API 密钥。如果已配置现有旧版 Anthropic 令牌配置文件，在运行时仍会生效。

<Warning>
关于 OpenClaw 中 Anthropic 的计费拆分：

- **Anthropic API 密钥**：正常的 Anthropic API 计费。
- **OpenClaw 中的 Claude 订阅身份验证**：Anthropic 于 **2026 年 4 月 4 日太平洋时间上午 12:00 / 英国夏令时晚上 8:00** 告知 OpenClaw 用户，此方式属于第三方工具使用，需要**额外使用（Extra Usage）**（按使用量付费，与订阅单独计费）。

我们的本地重现与该拆分一致：

- 直接使用 `claude -p` 可能仍然有效
- 当提示识别 OpenClaw 时，`claude -p --append-system-prompt ...` 可能触发额外使用限制
- 相同的 OpenClaw 风格系统提示在 Anthropic SDK + `ANTHROPIC_API_KEY` 路径上**不会**重现该阻止

因此实际规则是：**使用 Anthropic API 密钥，或启用了额外使用的 Claude 订阅**。如果您想要最清晰的生产路径，请使用 Anthropic API 密钥。

Anthropic 当前的公开文档：

- [Claude Code CLI 参考](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK 概述](https://platform.claude.com/docs/en/agent-sdk/overview)

- [使用 Pro 或 Max 计划的 Claude Code](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [使用 Team 或 Enterprise 计划的 Claude Code](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

如果您想要最清晰的计费路径，请改用 Anthropic API 密钥。OpenClaw 还支持其他订阅式选项，包括 [OpenAI Codex](/providers/openai)、[Qwen Cloud Coding Plan](/providers/qwen)、[MiniMax Coding Plan](/providers/minimax) 和 [Z.AI / GLM Coding Plan](/providers/glm)。
</Warning>

## 选项 A：Anthropic API 密钥

**适用于：** 标准 API 访问和基于使用量的计费。在 Anthropic Console 中创建您的 API 密钥。

### CLI 设置

```bash
openclaw onboard
# 选择: Anthropic API key

# 或非交互式
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Anthropic 配置片段

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

OpenClaw 的共享 `/fast` 切换也支持直接 Anthropic 公共流量，包括发送到 `api.anthropic.com` 的 API 密钥和 OAuth 身份验证请求。

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

- OpenClaw 仅对直接 `api.anthropic.com` 请求注入 Anthropic 服务层。如果您通过代理或网关路由 `anthropic/*`，`/fast` 不会修改 `service_tier`。
- 当两者都设置时，显式的 Anthropic `serviceTier` 或 `service_tier` 模型参数会覆盖 `/fast` 默认值。
- Anthropic 在响应的 `usage.service_tier` 中报告有效层级。在没有 Priority Tier 容量的账户上，`service_tier: "auto"` 仍可能解析为 `standard`。

## Prompt 缓存（Anthropic API）

OpenClaw 支持 Anthropic 的 prompt 缓存功能。这是**仅限 API** 的功能；旧版 Anthropic 令牌身份验证不遵守缓存设置。

### 配置

在您的模型配置中使用 `cacheRetention` 参数：

| 值      | 缓存持续时间 | 描述                         |
| ------- | ------------ | ---------------------------- |
| `none`  | 不缓存       | 禁用 prompt 缓存             |
| `short` | 5 分钟       | API Key 身份验证的默认值     |
| `long`  | 1 小时       | 扩展缓存                     |

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

## 1M 上下文窗口（Anthropic beta）

Anthropic 的 1M 上下文窗口处于 beta 阶段。在 OpenClaw 中，通过为支持的 Opus/Sonnet 模型设置 `params.context1m: true` 来逐个启用。

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

要求：Anthropic 必须允许该凭据使用长上下文（通常是 API 密钥计费，或启用了 Extra Usage 的 OpenClaw Claude 登录路径/旧版令牌身份验证）。否则 Anthropic 会返回：
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

注意：当使用旧版 Anthropic 令牌身份验证（`sk-ant-oat-*`）时，Anthropic 当前会拒绝 `context-1m-*` beta 请求。如果您在该旧版身份验证模式下配置了 `context1m: true`，OpenClaw 会记录警告并通过跳过 context1m beta 标头（同时保留所需的 OAuth beta）来回退到标准上下文窗口。

## 已移除：Claude CLI 后端

内置的 Anthropic `claude-cli` 后端已被移除。

- Anthropic 于 2026 年 4 月 4 日的通知称，OpenClaw 驱动的 Claude 登录流量是第三方工具使用，需要**额外使用**。
- 我们的本地重现也表明，当附加的提示识别 OpenClaw 时，直接使用 `claude -p --append-system-prompt ...` 可能触发相同的限制。
- 相同的 OpenClaw 风格系统提示在 Anthropic SDK + `ANTHROPIC_API_KEY` 路径上不会触发该限制。
- 在 OpenClaw 中，请使用 Anthropic API 密钥处理 Anthropic 流量。

## 注意事项

- Anthropic 的公开 Claude Code 文档仍记录了直接 CLI 使用方式如 `claude -p`，但 Anthropic 对 OpenClaw 用户的单独通知表明，**OpenClaw** Claude 登录路径是第三方工具使用，需要**额外使用**（按使用量付费，与订阅单独计费）。我们的本地重现也表明，当附加的提示识别 OpenClaw 时，直接使用 `claude -p --append-system-prompt ...` 可能触发相同的限制，而相同的提示形式在 Anthropic SDK + `ANTHROPIC_API_KEY` 路径上不会重现。对于生产环境，我们建议使用 Anthropic API 密钥。
- Anthropic setup-token 在 OpenClaw 中作为旧版/手动路径再次可用。Anthropic 针对 OpenClaw 的计费通知仍然适用，因此使用时应预期 Anthropic 对此路径需要**额外使用**。
- 身份验证详细信息 + 重用规则在 [/concepts/oauth](/concepts/oauth) 中。

## 故障排除

**401 错误 / 令牌突然无效**

- 旧版 Anthropic 令牌身份验证可能会过期或被撤销。
- 对于新设置，请迁移到 Anthropic API 密钥。

**找不到提供商 "anthropic" 的 API 密钥**

- 身份验证是**按 Agent** 的。新 Agent 不继承主 Agent 的密钥。
- 为该 Agent 重新运行入门，或在网关主机上配置 API 密钥，然后使用 `openclaw models status` 验证。

**找不到配置文件 `anthropic:default` 的凭据**

- 运行 `openclaw models status` 查看哪个身份验证配置文件处于活动状态。
- 重新运行入门，或为该配置文件路径配置 API 密钥。

**没有可用的身份验证配置文件（全部处于冷却/不可用状态）**

- 检查 `openclaw models status --json` 中的 `auth.unusableProfiles`。
- Anthropic 速率限制冷却可能是模型范围的，因此即使当前模型处于冷却中，同系列的 Anthropic 模型仍可能可用。
- 添加另一个 Anthropic 配置文件或等待冷却结束。

更多信息：[/gateway/troubleshooting](/gateway/troubleshooting) 和 [/help/faq](/help/faq)。
