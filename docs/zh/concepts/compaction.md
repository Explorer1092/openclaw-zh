---
mmh3_hash: "d9d795482fac1f9962afca5fb2ceacb1"
summary: "OpenClaw 如何总结长对话以保持在 model 限制内"
read_when:
  - 你想了解自动 compaction 和 /compact
  - 你正在调试达到 context 限制的长 Session
title: "Compaction"
---

每个 model 都有一个 context window——它能处理的最大 token 数量。当对话接近该限制时，OpenClaw 将较旧的消息**压缩**成摘要，以便聊天可以继续。

## 工作原理

1. 较旧的对话回合被总结成一个紧凑条目。
2. 摘要保存在 Session transcript 中。
3. 近期消息保持完整。

当 OpenClaw 将历史记录分割成 compaction 块时，它会将 assistant 工具调用与其对应的 `toolResult` 条目配对保留。如果分割点落在工具块内部，OpenClaw 会移动边界以保持配对完整，当前未总结的尾部得以保留。

完整的对话历史保存在磁盘上。Compaction 只改变 model 在下一回合看到的内容。

## 自动 compaction

自动 compaction 默认开启。当 Session 接近 context 限制时运行，或当 model 返回 context 溢出错误时运行（此时 OpenClaw 会 compact 并重试）。

你会看到：

- 在 verbose 模式下显示 `🧹 Auto-compaction complete`
- `/status` 显示 `🧹 Compactions: <count>`

<Info>
在 compact 之前，OpenClaw 会自动提醒 Agent 将重要笔记保存到[内存](/concepts/memory)文件。这可以防止 context 丢失。
</Info>

<AccordionGroup>
  <Accordion title="识别到的溢出特征">
    OpenClaw 从以下 provider 错误模式检测 context 溢出：

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手动 compaction

在任何聊天中输入 `/compact` 可强制进行 compaction。可添加说明以引导摘要：

```
/compact Focus on the API design decisions
```

当 `agents.defaults.compaction.keepRecentTokens` 设置后，手动 compaction 会遵循该 Pi 截断点并在重建 context 中保留最近的尾部。没有显式保留预算时，手动 compaction 表现为硬检查点，并仅从新摘要继续。

## 配置

在 `openclaw.json` 的 `agents.defaults.compaction` 下配置 compaction。下面列出了最常见的选项；完整参考请参见 [Session management deep dive](/reference/session-management-compaction)。

### 使用不同的 model

默认情况下，compaction 使用 Agent 的主 model。设置 `agents.defaults.compaction.model` 以将摘要委托给更有能力或专门的 model。覆盖值接受任意 `provider/model-id` 字符串：

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

本地 model 同样适用，例如专门用于摘要的第二个 Ollama model：

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

未设置时，compaction 使用 Agent 的主 model。

### 标识符保留

Compaction 摘要默认保留不透明标识符（`identifierPolicy: "strict"`）。可以用 `identifierPolicy: "off"` 覆盖，或使用 `identifierPolicy: "custom"` 和 `identifierInstructions` 提供自定义指导。

### 活跃转录字节守护

当 `agents.defaults.compaction.maxActiveTranscriptBytes` 设置后，如果活跃 JSONL 达到该大小，OpenClaw 会在运行前触发正常的本地 compaction。这对于长期运行的 Session 很有用，其中 provider 端 context 管理可能保持 model context 健康，而本地转录却持续增长。它不分割原始 JSONL 字节；它要求正常 compaction 管道创建语义摘要。

<Warning>
字节守护需要 `truncateAfterCompaction: true`。没有转录轮换，活跃文件不会缩小，守护将保持不活跃。
</Warning>

### 后继转录

当 `agents.defaults.compaction.truncateAfterCompaction` 启用时，OpenClaw 不会就地重写现有转录。它从 compaction 摘要、保留的状态和未总结的尾部创建新的活跃后继转录，然后将之前的 JSONL 保留为存档检查点来源。

### Compaction 通知

默认情况下，compaction 静默运行。设置 `notifyUser` 以在 compaction 开始和完成时显示简短状态消息：

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

### 内存刷新

在 compaction 之前，OpenClaw 可以运行**静默内存刷新**回合，将持久笔记保存到磁盘。详情和配置参见 [Memory](/concepts/memory)。

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

设置 `provider` 会自动强制 `mode: "safeguard"`。Provider 接收与内置路径相同的 compaction 指令和标识符保留策略，OpenClaw 在 provider 输出后仍保留最近回合和拆分回合后缀 context。

<Note>
如果 provider 失败或返回空结果，OpenClaw 回退到内置 LLM 摘要。
</Note>

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

关于高级配置（reserve tokens、标识符保留、自定义 context engine、OpenAI 服务端 compaction），参见 [Session management deep dive](/reference/session-management-compaction)。

## 相关链接

- [Session](/concepts/session)：Session 管理和生命周期。
- [Session pruning](/concepts/session-pruning)：修剪 tool results。
- [Context](/concepts/context)：Agent 回合的 context 如何构建。
- [Hooks](/automation/hooks)：compaction 生命周期 hooks（`before_compaction`、`after_compaction`）。
