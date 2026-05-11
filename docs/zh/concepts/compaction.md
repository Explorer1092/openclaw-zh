---
mmh3_hash: "f34df0508046ff1177f0c5ec2345e59e"
summary: "OpenClaw 如何总结长对话以保持在模型限制内"
read_when:
  - 您想了解自动压缩和 /compact
  - 您正在调试遇到上下文限制的长 Session
title: "压缩"
---

每个模型都有一个上下文窗口：它能处理的最大 token 数量。当对话接近该限制时，OpenClaw 将旧消息**压缩**成摘要，以便聊天可以继续。

## 工作原理

1. 旧的对话轮次被总结成一个压缩条目。
2. 摘要保存在 Session 转录中。
3. 最近的消息保持完整。

当 OpenClaw 将历史拆分为压缩块时，它保持助手工具调用与匹配的 `toolResult` 条目配对。如果拆分点落在工具块内，OpenClaw 移动边界使该对保持在一起，并保留当前未总结的尾部。

完整的对话历史保留在磁盘上。压缩只改变模型在下一轮次看到的内容。

## 自动压缩

自动压缩默认开启。当 Session 接近上下文限制时运行，或当模型返回上下文溢出错误时（此时 OpenClaw 压缩并重试）。

您将看到：

- 正常 Gateway 日志中的 `embedded run auto-compaction start` / `complete`。
- 详细模式下的 `🧹 Auto-compaction complete`。
- `/status` 显示 `🧹 Compactions: <count>`。

<Info>
压缩前，OpenClaw 会自动提醒 Agent 将重要说明保存到 [Memory](/concepts/memory) 文件。这防止上下文丢失。
</Info>

<AccordionGroup>
  <Accordion title="已识别的溢出签名">
    OpenClaw 从以下 Provider 错误模式检测上下文溢出：

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手动压缩

在任何聊天中输入 `/compact` 强制压缩。添加指令来指导摘要：

```
/compact Focus on the API design decisions
```

当设置了 `agents.defaults.compaction.keepRecentTokens` 时，手动压缩遵循该 Pi 截断点并在重建的上下文中保留最近的尾部。没有显式保留预算时，手动压缩作为硬检查点运行，仅从新摘要继续。

## 配置

在 `openclaw.json` 的 `agents.defaults.compaction` 下配置压缩。下面列出了最常用的参数；完整参考请参见[Session 管理深入解析](/reference/session-management-compaction)。

### 使用不同的模型

默认情况下，压缩使用 Agent 的主要模型。设置 `agents.defaults.compaction.model` 以将摘要委托给更有能力或专门化的模型。覆盖接受任何 `provider/model-id` 字符串：

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

这也适用于本地模型，例如专用于摘要的第二个 Ollama 模型：

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

未设置时，压缩从活跃 Session 模型开始。如果摘要因模型回退合格的 Provider 错误而失败，OpenClaw 通过 Session 现有的模型回退链重试该压缩尝试。回退选择是临时的，不会写回 Session 状态。显式的 `agents.defaults.compaction.model` 覆盖保持精确，不继承 Session 回退链。

### 标识符保留

压缩摘要默认保留不透明标识符（`identifierPolicy: "strict"`）。使用 `identifierPolicy: "off"` 禁用，或使用 `identifierPolicy: "custom"` 加 `identifierInstructions` 进行自定义指导。

### 活跃转录字节守卫

当设置了 `agents.defaults.compaction.maxActiveTranscriptBytes` 时，如果活跃 JSONL 达到该大小，OpenClaw 在运行前触发正常的本地压缩。这对于 Provider 端上下文管理可能保持模型上下文健康而本地转录持续增长的长时间运行 Session 很有用。它不拆分原始 JSONL 字节；它要求正常的压缩流水线创建语义摘要。

<Warning>
字节守卫需要 `truncateAfterCompaction: true`。没有转录轮换，活跃文件不会缩小，守卫保持不活跃。
</Warning>

### 后继转录

当启用 `agents.defaults.compaction.truncateAfterCompaction` 时，OpenClaw 不会就地重写现有转录。它从压缩摘要、保留状态和未总结的尾部创建新的活跃后继转录，然后将之前的 JSONL 保留为存档检查点源。
后继转录还会丢弃在短重试窗口内到达的完全重复的长用户轮次，以防 Channel 重试风暴在压缩后被带入下一个活跃转录。

预压缩检查点仅在保持在 OpenClaw 的检查点大小上限内时保留；超大的活跃转录仍然压缩，但 OpenClaw 跳过大型调试快照，而不是翻倍磁盘使用量。

### 压缩通知

默认情况下，压缩静默运行。设置 `notifyUser` 以在压缩开始和完成时显示简短状态消息：

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

### Memory 刷新

压缩前，OpenClaw 可以运行**静默 Memory 刷新**轮次，将持久说明存储到磁盘。当此维护轮次应使用本地模型而不是活跃对话模型时，设置 `agents.defaults.compaction.memoryFlush.model`：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

Memory 刷新模型覆盖是精确的，不继承活跃 Session 回退链。参见 [Memory](/concepts/memory) 了解详情和配置。

## 可插拔压缩 Provider

Plugin 可以通过 Plugin API 上的 `registerCompactionProvider()` 注册自定义压缩 Provider。当 Provider 已注册并已配置时，OpenClaw 将摘要委托给它，而不是内置 LLM 流水线。

要使用已注册的 Provider，在配置中设置其 ID：

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

设置 `provider` 会自动强制 `mode: "safeguard"`。Provider 接收与内置路径相同的压缩指令和标识符保留策略，OpenClaw 仍在 Provider 输出后保留最近轮次和拆分轮次后缀上下文。

<Note>
如果 Provider 失败或返回空结果，OpenClaw 会回退到内置 LLM 摘要。
</Note>

## 压缩 vs 修剪

|              | 压缩                          | 修剪                             |
| ------------ | ----------------------------- | -------------------------------- |
| **功能**     | 总结旧对话                    | 修剪旧工具结果                   |
| **已保存？** | 是（在 Session 转录中）       | 否（仅内存，每个请求）           |
| **范围**     | 整个对话                      | 仅工具结果                       |

[Session 修剪](/concepts/session-pruning)是一个更轻量级的补充，在不总结的情况下修剪工具输出。

## 故障排查

**压缩太频繁？** 模型的上下文窗口可能很小，或工具输出可能很大。尝试启用 [Session 修剪](/concepts/session-pruning)。

**压缩后上下文感觉陈旧？** 使用 `/compact Focus on <topic>` 来指导摘要，或启用 [Memory 刷新](/concepts/memory) 以便说明能存活下来。

**需要干净的开始？** `/new` 在不压缩的情况下开始新的 Session。

有关高级配置（保留 token、标识符保留、自定义上下文引擎、OpenAI 服务器端压缩），请参见[Session 管理深入解析](/reference/session-management-compaction)。

## 相关

- [Session](/concepts/session)：Session 管理和生命周期。
- [Session 修剪](/concepts/session-pruning)：修剪工具结果。
- [上下文](/concepts/context)：如何为 Agent 轮次构建上下文。
- [Hook](/automation/hooks)：压缩生命周期 Hook（`before_compaction`、`after_compaction`）。
