---
mmh3_hash: "093fd4eec0be604a9ee79f2a22b6ab6d"
title: Anthropic
summary: 在 OpenClaw 中通过 API 密钥、setup-token 或 Claude CLI 使用 Anthropic Claude
read_when:
  - 你想在 OpenClaw 中使用 Anthropic 模型
  - 你想使用 setup-token 而不是 API 密钥
  - 你想在 Gateway 宿主机上复用 Claude CLI 订阅认证
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: providers/anthropic.md
  workflow: 15
---

# Anthropic（Claude）

Anthropic 构建了 **Claude** 模型家族，并通过 API 提供访问。在 OpenClaw 中，你可以使用 API 密钥或 **setup-token** 进行身份验证。

## 选项 A：Anthropic API 密钥

**适合：** 标准 API 访问和按用量计费。在 Anthropic Console 中创建你的 API 密钥。

### CLI 设置

```bash
openclaw onboard
# 选择：Anthropic API key

# 或非交互式
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Claude CLI 配置片段

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 思考默认值（Claude 4.6）

- 当没有显式设置思考级别时，Anthropic Claude 4.6 模型在 OpenClaw 中默认使用 `adaptive` 思考。
- 你可以按消息覆盖（`/think:<level>`）或在模型参数中覆盖：`agents.defaults.models["anthropic/<model>"].params.thinking`。
- 相关 Anthropic 文档：
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## 快速模式（Anthropic API）

OpenClaw 的共享 `/fast` 切换也支持直接的 Anthropic 公网流量，包括发送到 `api.anthropic.com` 的 API 密钥和 OAuth 认证请求。

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

- OpenClaw 仅对直接 `api.anthropic.com` 请求注入 Anthropic service tier。如果你通过代理或 Gateway 路由 `anthropic/*`，`/fast` 不会修改 `service_tier`。
- 当两者同时设置时，显式的 Anthropic `serviceTier` 或 `service_tier` 模型参数会覆盖 `/fast` 默认值。
- Anthropic 在响应的 `usage.service_tier` 下报告有效 tier。在没有优先级 Tier 容量的账号上，`service_tier: "auto"` 仍可能解析为 `standard`。

## Prompt 缓存（Anthropic API）

OpenClaw 支持 Anthropic 的 Prompt 缓存功能。这是**仅限 API** 的功能；订阅认证不支持缓存设置。

### 配置

在模型配置中使用 `cacheRetention` 参数：

| 值       | 缓存时长 | 描述                           |
| -------- | -------- | ------------------------------ |
| `none`   | 无缓存   | 禁用 Prompt 缓存               |
| `short`  | 5 分钟   | API Key 认证的默认值           |
| `long`   | 1 小时   | 扩展缓存（需要 beta 标志）     |

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

使用 Anthropic API Key 认证时，OpenClaw 会自动对所有 Anthropic 模型应用 `cacheRetention: "short"`（5 分钟缓存）。你可以在配置中显式设置 `cacheRetention` 来覆盖此默认值。

### 按 Agent 覆盖 cacheRetention

将模型级参数作为基准，然后通过 `agents.list[].params` 覆盖特定 Agent。

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
      { id: "alerts", params: { cacheRetention: "none" } }, // 仅此 Agent 覆盖
    ],
  },
}
```

缓存相关参数的配置合并顺序：

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params`（匹配 `id`，按键覆盖）

这允许一个 Agent 保持长期缓存，而同一模型上的另一个 Agent 为高频低复用流量禁用缓存以避免写入成本。

### Bedrock Claude 注意事项

- Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）配置后接受 `cacheRetention` 透传。
- 非 Anthropic Bedrock 模型在运行时强制使用 `cacheRetention: "none"`。
- Anthropic API 密钥智能默认值也会为 Claude on Bedrock 模型引用注入 `cacheRetention: "short"`（当没有显式值时）。

### 旧版参数

旧版 `cacheControlTtl` 参数仍然支持，以便向后兼容：

- `"5m"` 映射到 `short`
- `"1h"` 映射到 `long`

建议迁移到新的 `cacheRetention` 参数。

OpenClaw 为 Anthropic API 请求包含 `extended-cache-ttl-2025-04-11` beta 标志；如果你覆盖 Provider 请求头，请保留它（参见 [/gateway/configuration](/gateway/configuration)）。

## 100 万 Token 上下文窗口（Anthropic beta）

Anthropic 的 100 万 Token 上下文窗口受 beta 门控。在 OpenClaw 中，对支持的 Opus/Sonnet 模型使用 `params.context1m: true` 按模型启用。

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

OpenClaw 将此映射到 Anthropic 请求上的 `anthropic-beta: context-1m-2025-08-07`。

这仅在 `params.context1m` 对该模型显式设置为 `true` 时激活。

要求：Anthropic 必须允许该凭证使用长上下文（通常是 API 密钥计费，或启用了 Extra Usage 的订阅账号）。否则 Anthropic 返回：`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

注意：Anthropic 目前在使用 OAuth/订阅 Token（`sk-ant-oat-*`）时拒绝 `context-1m-*` beta 请求。OpenClaw 自动跳过 OAuth 认证的 context1m beta 请求头，并保留所需的 OAuth beta。

## 选项 B：将 Claude CLI 作为消息 Provider

**适合：** 已安装 Claude CLI 并以 Claude 订阅登录的单用户 Gateway 宿主机。

此路径使用本地 `claude` 二进制文件进行模型推理，而非直接调用 Anthropic API。OpenClaw 将其视为**CLI 后端 Provider**，模型引用格式如：

- `claude-cli/claude-sonnet-4-6`
- `claude-cli/claude-opus-4-6`

工作原理：

1. OpenClaw 在 **Gateway 宿主机**上启动 `claude -p --output-format json ...`。
2. 第一轮发送 `--session-id <uuid>`。
3. 后续轮次通过 `--resume <sessionId>` 复用存储的 Claude Session。
4. 你的聊天消息仍经过正常的 OpenClaw 消息流水线，但实际模型回复由 Claude CLI 生成。

### 要求

- Claude CLI 已安装在 Gateway 宿主机上并在 PATH 中可用，或已配置绝对命令路径。
- Claude CLI 在同一宿主机上已完成认证：

```bash
claude auth status
```

- 当你的配置显式引用 `claude-cli/...` 或 `claude-cli` 后端配置时，OpenClaw 在 Gateway 启动时自动加载捆绑的 Anthropic 插件。

### 配置片段

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "claude-cli/claude-sonnet-4-6",
      },
      models: {
        "claude-cli/claude-sonnet-4-6": {},
      },
      sandbox: { mode: "off" },
    },
  },
}
```

如果 `claude` 二进制文件不在 Gateway 宿主机 PATH 中：

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

### 你得到的

- 从本地 CLI 复用 Claude 订阅认证
- 正常的 OpenClaw 消息/Session 路由
- 跨轮次的 Claude CLI Session 连续性

### 从 Anthropic 认证迁移到 Claude CLI

如果你目前使用 `anthropic/...` 配合 setup-token 或 API 密钥，想将同一 Gateway 宿主机切换到 Claude CLI：

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

或在引导时：

```bash
openclaw onboard --auth-choice anthropic-cli
```

此操作会：

- 验证 Claude CLI 已在 Gateway 宿主机上登录
- 将默认模型切换为 `claude-cli/...`
- 将类似 `anthropic/claude-opus-4-6` 的 Anthropic 默认模型回退重写为 `claude-cli/claude-opus-4-6`
- 在 `agents.defaults.models` 中添加匹配的 `claude-cli/...` 条目

此操作**不会**：

- 删除你现有的 Anthropic 认证配置
- 移除主默认模型/允许列表路径之外的旧 `anthropic/...` 配置引用

这使回退很简单：如需恢复，将默认模型改回 `anthropic/...` 即可。

### 重要限制

- 这**不是** Anthropic API Provider。它是本地 CLI 运行时。
- CLI 后端运行时，OpenClaw 侧的工具被禁用。
- 文本输入，文本输出。没有 OpenClaw 流式传输交接。
- 最适合个人 Gateway 宿主机，不适合共享多用户计费场景。

更多详情：[/gateway/cli-backends](/gateway/cli-backends)

## 选项 C：Claude setup-token

**适合：** 使用你的 Claude 订阅。

### 获取 setup-token 的方法

Setup-token 由 **Claude Code CLI** 创建，而非 Anthropic Console。你可以在**任何机器**上运行：

```bash
claude setup-token
```

将 Token 粘贴到 OpenClaw（向导：**Anthropic token（粘贴 setup-token）**），或在 Gateway 宿主机上运行：

```bash
openclaw models auth setup-token --provider anthropic
```

如果你在不同机器上生成了 Token，粘贴它：

```bash
openclaw models auth paste-token --provider anthropic
```

### CLI 设置（setup-token）

```bash
# 设置过程中粘贴 setup-token
openclaw onboard --auth-choice setup-token
```

### 配置片段（setup-token）

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 注意事项

- 使用 `claude setup-token` 生成 setup-token 并粘贴，或在 Gateway 宿主机上运行 `openclaw models auth setup-token`。
- 如果你在 Claude 订阅上看到"OAuth token refresh failed …"，请使用 setup-token 重新认证。参见 [/gateway/troubleshooting](/gateway/troubleshooting)。
- 认证详情和复用规则见 [/concepts/oauth](/concepts/oauth)。

## 故障排查

**401 错误 / Token 突然失效**

- Claude 订阅认证可能过期或被撤销。重新运行 `claude setup-token` 并将其粘贴到 **Gateway 宿主机**。
- 如果 Claude CLI 登录在另一台机器上，在 Gateway 宿主机上使用 `openclaw models auth paste-token --provider anthropic`。

**No API key found for provider "anthropic"**

- 认证是**按 Agent** 的。新 Agent 不继承主 Agent 的密钥。
- 为该 Agent 重新运行引导，或在 Gateway 宿主机上粘贴 setup-token / API 密钥，然后使用 `openclaw models status` 验证。

**No credentials found for profile `anthropic:default`**

- 运行 `openclaw models status` 查看当前激活的认证配置。
- 重新运行引导，或为该配置粘贴 setup-token / API 密钥。

**No available auth profile (all in cooldown/unavailable)**

- 检查 `openclaw models status --json` 中的 `auth.unusableProfiles`。
- 添加另一个 Anthropic 配置或等待冷却时间结束。

更多：[/gateway/troubleshooting](/gateway/troubleshooting) 和 [/help/faq](/help/faq)。
