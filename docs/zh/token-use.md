---
title: "Token 使用与成本"
sidebarTitle: "Token 使用与成本"
mmh3_hash: "3483261a054486b3978b7f409ac5a932"
summary: "OpenClaw 如何构建提示词上下文并报告 Token 使用情况 + 成本"
read_when: ["解释 Token 使用、成本或上下文窗口","调试上下文增长或压缩行为"]
---
# Token 使用与成本

OpenClaw 跟踪 **Token (tokens)**，而不是字符。Token 是特定于模型的，但大多数 OpenAI 风格的模型平均每 Token 约 4 个英文字符。

## 系统提示词是如何构建的

OpenClaw 在每次运行时组装自己的系统提示词。它包括：

- 工具列表 + 简短描述
- 技能列表（仅元数据；指令通过 `read` 按需加载）
- 自我更新指令
- 工作区 + 引导文件 (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, 或者是新的 `BOOTSTRAP.md`)。大文件会被 `agents.defaults.bootstrapMaxChars` (默认: 20000) 截断。
- 时间 (UTC + 用户时区)
- 回复标签 + 心跳行为
- 运行时元数据 (主机/操作系统/模型/思考)

在 [系统提示词](/concepts/system-prompt) 中查看完整细分。

## 算入上下文窗口的内容

模型接收到的所有内容都计入上下文限制：

- 系统提示词（上面列出的所有部分）
- 对话历史（用户 + 助手消息）
- 工具调用和工具结果
- 附件/转录（图像、音频、文件）
- 压缩摘要和修剪产物
- 提供商包装器或安全标头（不可见，但仍计算在内）

要查看实际细分（每个注入的文件、工具、技能和系统提示词大小），请使用 `/context list` 或 `/context detail`。参见 [上下文](/concepts/context)。

## 如何查看当前 Token 使用情况

在聊天中使用这些：

- `/status` → **表情丰富的状态卡片**，包含会话模型、上下文使用情况、最后响应输入/输出 Token，以及 **估计成本** (仅限 API 密钥)。
- `/usage off|tokens|full` → 在每次回复后附加 **每次响应的使用情况页脚**。
  - 按会话持久化（存储为 `responseUsage`）。
  - OAuth 认证 **隐藏成本** (仅显示 Token)。
- `/usage cost` → 从 OpenClaw 会话日志中显示本地成本摘要。

其他界面：

- **TUI/Web TUI:** 支持 `/status` + `/usage`。
- **CLI:** `openclaw status --usage` 和 `openclaw channels list` 显示提供商配额窗口（不是每次响应的成本）。

## 成本估算 (当显示时)

成本是根据你的模型定价配置估算的：

- `models.providers.<provider>.models[].cost`

这些是 **每 1M Token 的美元价格**，针对 `input` (输入)、`output` (输出)、`cacheRead` (缓存读取) 和 `cacheWrite` (缓存写入)。如果缺少定价，OpenClaw 仅显示 Token。OAuth Token 从不显示美元成本。

## 缓存 TTL 和修剪影响

提供商提示词缓存仅适用于缓存 TTL 窗口内。OpenClaw 可以选择性地运行 **缓存 TTL 修剪**：一旦缓存 TTL 过期，它就会修剪会话，然后重置缓存窗口，以便后续请求可以重用新缓存的上下文，而不是重新缓存完整的历史记录。当会话空闲超过 TTL 时，这可以降低缓存写入成本。

在 [网关配置](/gateway/configuration) 中配置它，并在 [会话修剪](/concepts/session-pruning) 中查看行为细节。

心跳可以在空闲间隙保持缓存 **热**。如果你的模型缓存 TTL 为 `1h`，将心跳间隔设置在该时间之下（例如 `55m`）可以避免重新缓存完整的提示词，从而降低缓存写入成本。

对于 Anthropic API 定价，缓存读取比输入 Token 便宜得多，而缓存写入则以更高的倍数计费。有关最新费率和 TTL 倍数，请参阅 Anthropic 的提示词缓存定价：
https://docs.anthropic.com/docs/build-with-claude/prompt-caching

### 示例：使用心跳保持 1h 缓存热度

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-5"
    models:
      "anthropic/claude-opus-4-5":
        params:
          cacheControlTtl: "1h"
    heartbeat:
      every: "55m"
```

## 降低 Token 压力的提示

- 使用 `/compact` 总结长会话。
- 在你的工作流中修剪大型工具输出。
- 保持技能描述简短（技能列表被注入到提示词中）。
- 对于冗长的探索性工作，首选较小的模型。

有关确切的技能列表开销公式，请参见 [技能](/tools/skills)。
