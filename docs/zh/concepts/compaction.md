---
mmh3_hash: "059a3cd6e4559d45484846c296d1ffca"
summary: "OpenClaw 如何总结长对话以保持在 model 限制内"
read_when:
  - 你想了解自动 compaction 和 /compact
  - 你正在调试达到 context 限制的长 Session
title: "Compaction"
---

# Compaction

每个 model 都有一个 context window——它能处理的最大 token 数量。当对话接近该限制时，OpenClaw 将较旧的消息**压缩**成摘要，以便聊天可以继续。

## 工作原理

1. 较旧的对话回合被总结成一个紧凑条目。
2. 摘要保存在 Session transcript 中。
3. 近期消息保持完整。

当 OpenClaw 将历史记录分割成 compaction 块时，它会将 assistant 工具调用与其对应的 `toolResult` 条目配对保留。如果分割点落在工具块内部，OpenClaw 会移动边界以保持配对完整，当前未总结的尾部得以保留。

完整的对话历史保存在磁盘上。Compaction 只改变 model 在下一回合看到的内容。

## 自动 compaction

自动 compaction 默认开启。当 Session 接近 context 限制时运行，或当 model 返回 context 溢出错误时运行（此时 OpenClaw 会 compact 并重试）。典型的溢出信号包括 `request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model` 和 `ollama error: context length exceeded`。

<Info>
在 compact 之前，OpenClaw 会自动提醒 Agent 将重要笔记保存到[内存](/concepts/memory)文件。这可以防止 context 丢失。
</Info>

使用 `openclaw.json` 中的 `agents.defaults.compaction` 设置来配置 compaction 行为（模式、目标 tokens 等）。
Compaction 摘要默认保留不透明标识符（`identifierPolicy: "strict"`）。可以用 `identifierPolicy: "off"` 覆盖，或使用 `identifierPolicy: "custom"` 和 `identifierInstructions` 提供自定义文本。

你可以通过 `agents.defaults.compaction.model` 为 compaction 摘要指定不同的 model。当主 model 是本地或小型 model 时，这很有用——可以让更有能力的 model 来生成 compaction 摘要。覆盖值接受任意 `provider/model-id` 字符串：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

本地 model 同样适用，例如专门用于摘要的第二个 Ollama model 或经过微调的 compaction 专用模型：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

未设置时，compaction 使用 agent 的主 model。

## 可插拔 compaction provider

Plugin 可以通过 plugin API 上的 `registerCompactionProvider()` 注册自定义 compaction provider。当 provider 注册并配置后，OpenClaw 会将摘要委托给它，而不是内置 LLM 管道。

要使用已注册的 provider，在配置中设置 provider id：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

设置 `provider` 会自动强制 `mode: "safeguard"`。Provider 接收与内置路径相同的 compaction 指令和标识符保留策略，OpenClaw 在 provider 输出后仍保留最近回合和拆分回合后缀 context。如果 provider 失败或返回空结果，OpenClaw 回退到内置 LLM 摘要。

## 自动 compaction（默认开启）

当 Session 接近或超过 model 的 context window 时，OpenClaw 触发自动 compaction，并可能使用已压缩的 context 重试原始请求。

你会看到：

- 在 verbose 模式下显示 `🧹 Auto-compaction complete`
- `/status` 显示 `🧹 Compactions: <count>`

在 compaction 之前，OpenClaw 可以运行**静默内存刷新**回合，将持久笔记保存到磁盘。详情和配置参见 [Memory](/concepts/memory)。

## 手动 compaction

在任何聊天中输入 `/compact` 可强制进行 compaction。可添加说明以引导摘要：

```
/compact Focus on the API design decisions
```

## 使用不同的 model

默认情况下，compaction 使用 Agent 的主 model。你可以使用更强大的 model 以获得更好的摘要：

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

## Compaction 开始提示

默认情况下，compaction 静默运行。要在 compaction 开始时显示简短提示，启用 `notifyUser`：

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

启用后，用户在每次 compaction 运行开始时会看到简短消息（例如"Compacting context..."）。

## Compaction vs pruning

|                  | Compaction                       | Pruning                              |
| ---------------- | -------------------------------- | ------------------------------------ |
| **功能**         | 总结较旧的对话                   | 修剪旧的 tool results                |
| **是否保存？**   | 是（在 Session transcript 中）   | 否（仅内存，每次请求）               |
| **范围**         | 整个对话                         | 仅 tool results                      |

[Session pruning](/concepts/session-pruning) 是一个较轻量的补充，在不进行总结的情况下修剪工具输出。

## 故障排除

**压缩太频繁？** model 的 context window 可能较小，或工具输出可能较大。尝试启用 [session pruning](/concepts/session-pruning)。

**compaction 后 context 感觉过时？** 使用 `/compact Focus on <topic>` 引导摘要，或启用[内存刷新](/concepts/memory)以保留笔记。

**需要全新开始？** `/new` 无需 compact 即可启动新 Session。

关于高级配置（reserve tokens、标识符保留、自定义 context engine、OpenAI 服务端 compaction），参见 [Session Management Deep Dive](/reference/session-management-compaction)。

## 相关链接

- [Session](/concepts/session) — Session 管理和生命周期
- [Session Pruning](/concepts/session-pruning) — 修剪 tool results
- [Context](/concepts/context) — Agent 回合的 context 如何构建
- [Hooks](/automation/hooks) — compaction 生命周期 hooks（before_compaction、after_compaction）
