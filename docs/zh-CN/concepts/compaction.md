---
read_when:
  - 你想了解自动压缩和 /compact
  - 你正在调试长会话触及上下文限制的问题
summary: OpenClaw 如何将长对话压缩摘要以保持在模型限制内
title: 压缩
x-i18n:
  generated_at: "2026-02-01T20:22:17Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: fef11fce07eddef6f7e79e32961f52b787330617cd848f40bfc72dfdda8e6532
  source_path: concepts/compaction.md
  workflow: 14
---

# 压缩

每个模型都有一个**上下文窗口**——它可以处理的最大 token 数。当对话接近该限制时，OpenClaw 会将较早的消息**压缩**为摘要，以便聊天可以继续进行。

## 工作原理

1. 较早的对话轮次被摘要为一条紧凑条目。
2. 摘要保存在会话记录中。
3. 近期消息保持完整。

完整的对话历史保留在磁盘上。压缩只改变模型在下一轮看到的内容。

## 自动压缩

自动压缩默认开启。当会话接近上下文限制时运行，或当模型返回上下文溢出错误时运行（此时 OpenClaw 会压缩并重试）。

<Info>
在压缩之前，OpenClaw 会自动提醒智能体将重要笔记保存到[记忆](/concepts/memory)文件中，以防止上下文丢失。
</Info>

## 手动压缩

在任意聊天中输入 `/compact` 可强制执行压缩。可添加指令来引导摘要内容：

```
/compact Focus on the API design decisions
```

## 使用不同的模型

默认情况下，压缩使用你智能体的主要模型。你可以使用能力更强的模型以获得更好的摘要：

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## 压缩与修剪

|              | 压缩                      | 修剪                          |
| ------------ | ------------------------- | ----------------------------- |
| **功能**     | 总结较早的对话            | 裁剪旧的工具结果              |
| **是否保存** | 是（保存在会话记录中）    | 否（仅在内存中，按请求进行）  |
| **范围**     | 整个对话                  | 仅限工具结果                  |

[会话修剪](/concepts/session-pruning)是一种更轻量的补充方案，可在不进行摘要的情况下裁剪工具输出。

## 故障排查

**压缩过于频繁？** 模型的上下文窗口可能较小，或工具输出较大。可尝试启用[会话修剪](/concepts/session-pruning)。

**压缩后上下文感觉过时？** 使用 `/compact Focus on <topic>` 来引导摘要，或启用[记忆刷写](/concepts/memory)以保留笔记。

**需要全新开始？** `/new` 会启动一个新会话而无需压缩。

高级配置（保留 token、标识符保留、自定义上下文引擎、OpenAI 服务端压缩）请参阅[会话管理深度指南](/reference/session-management-compaction)。
