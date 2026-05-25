---
mmh3_hash: "503486c489175e5f208e2474e513c899"
summary: "进度草稿：Agent 运行时持续更新的单条可见进行中消息"
read_when:
  - 为长时间运行的聊天轮次配置可见进度更新
  - 在 partial、block 和 progress 流式模式之间选择
  - 解释 OpenClaw 如何在工作进行中更新单条 Channel 消息
  - 排查进度草稿、独立进度消息或最终化回退问题
title: "进度草稿"
---

进度草稿让长时间运行的 Agent 轮次在聊天中保持活跃感，同时不会把对话变成一堆临时状态回复。

启用进度草稿后，OpenClaw 仅在轮次确实在做实际工作后才创建一条可见的进行中消息，在 Agent 读取、规划、调用工具或等待审批时持续更新它，然后在 Channel 安全允许的情况下将草稿变为最终答案。

```text
Shelling
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

当您希望在工具密集型工作期间看到一条整洁的状态消息，并在轮次结束时得到最终答案时，请使用进度草稿。

## 快速开始

通过 `streaming.mode: "progress"` 为每个 Channel 启用进度草稿：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

通常这就够了。OpenClaw 会自动选择一个单词标签，等待工作持续至少五秒或发出第二个工作事件后开始显示，在有用工作发生时添加简洁的进度行，并为该轮次抑制重复的独立进度信息。

## 用户看到什么

进度草稿有两个部分：

| 部分       | 用途                                                                                |
| ---------- | ----------------------------------------------------------------------------------- |
| 标签       | 简短的启动/状态行，如 `Working` 或 `Shelling`。                              |
| 进度行     | 使用与详细输出相同的工具图标和详情格式化器的简洁运行更新。                          |

标签在 Agent 开始有意义的工作且持续忙碌五秒或发出第二个工作事件后出现。它是滚动进度行列表的一部分，因此一旦出现足够多的具体工作，启动状态就会滚走。纯文本回复不显示进度草稿。只有当 Agent 发出有用的工作更新时，才会添加进度行，例如 `🛠️ Bash: run tests`、`🔎 Web Search: for "discord edit message"` 或 `✍️ Write: to /tmp/file`。
默认情况下使用与 `/verbose` 相同的简洁说明模式；在调试时若想附加原始命令/详情，可设置 `agents.defaults.toolProgressDetail: "raw"`。
最终答案在可能时替换草稿；否则 OpenClaw 正常发送最终答案，并根据 Channel 的传输方式清理或停止更新草稿。

## 选择模式

`channels.<channel>.streaming.mode` 控制可见的进行中行为：

| 模式       | 最适合                         | 聊天中显示内容                                    |
| ---------- | ------------------------------ | ------------------------------------------------- |
| `off`      | 安静的 Channel                  | 仅最终答案。                                      |
| `partial`  | 观看答案文本出现                | 以最新答案文本编辑的单条草稿。                    |
| `block`    | 更大的答案预览块               | 以更大块更新或追加的单条预览。                    |
| `progress` | 工具密集或长时间运行的轮次     | 单条状态草稿，然后是最终答案。                    |

当用户更关心"正在发生什么"而非逐 token 观看答案流式传输时，选择 `progress`。

当答案本身就是进度信号时，选择 `partial`。

当您希望以更大文本块进行草稿预览更新时，选择 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍是预览流式传输，而不是普通的块传递。需要普通块回复时，请使用 `streaming.block.enabled` 或旧版 `blockStreaming`。

## 配置标签

进度标签位于 `channels.<channel>.streaming.progress` 下。

默认标签为 `auto`，从 OpenClaw 内置的单词标签池中选取：

```text
Working
Shelling
Scuttling
Clawing
Pinching
Molting
Bubbling
Tiding
Reefing
Cracking
Sifting
Brining
Nautiling
Krilling
Barnacling
Lobstering
Tidepooling
Pearling
Snapping
Surfacing
```

使用固定标签：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

使用自定义自动标签池：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
        },
      },
    },
  },
}
```

隐藏标签，只显示进度行：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## 控制进度行

进度模式下默认启用进度行。它们来自真实的运行事件：工具启动、条目更新、任务计划、审批、命令输出、补丁摘要以及类似的 Agent 活动。

OpenClaw 对进度草稿和 `/verbose` 使用相同的格式化器：

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` 是默认值，保持草稿稳定，使用简洁的标签，如 `🛠️ check JS syntax for /tmp/app.js`。`"raw"` 在有底层命令/详情时附加，在调试时有用，但在聊天中噪音更多。

例如，同一命令在不同详情模式下的显示：

| 模式      | 进度行                                                         |
| --------- | -------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

限制可见行数：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

进度行会自动压缩，以减少草稿编辑时的聊天气泡重排。

OpenClaw 默认截断长进度行，避免重复的草稿编辑因换行不同而产生差异。默认每行字符预算为 120 个字符。散文在单词边界截断，而路径或原始命令等长详情则以中间省略号缩短，保留后缀可见。

调整每行字符预算：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

Slack 可以将进度行渲染为结构化的 Block Kit 字段，而不是单一文本体：

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

富渲染保留相同的纯文本回退，因此不支持更丰富形状的 Channel 和客户端仍可显示简洁的进度文本。

保留单条进度草稿但隐藏工具和任务行：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

设置 `toolProgress: false` 后，OpenClaw 仍会为该轮次抑制旧版的独立工具进度消息。Channel 保持视觉安静，直到最终答案，除非配置了标签。

## Channel 行为

每个 Channel 使用其支持的最干净的传输方式：

| Channel          | 进度传输                              | 备注                                                                  |
| ---------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Discord          | 发送一条消息，然后编辑它。            | 最终文本在适合一条安全预览消息时就地编辑。                            |
| Matrix           | 发送一个事件，然后编辑它。            | 账户级流式配置控制账户级草稿。                                        |
| Microsoft Teams  | 个人聊天中的原生 Teams 流。           | `streaming.mode: "block"` 映射到 Teams 块传递。                       |
| Slack            | 原生流或可编辑的草稿帖子。            | 线程可用性影响是否可以使用原生流式传输。                              |
| Telegram         | 发送一条消息，然后编辑它。            | 旧的可见草稿可能被替换，以保持最终时间戳的有用性。                    |
| Mattermost       | 可编辑的草稿帖子。                    | 工具活动折叠到同一草稿风格的帖子中。                                  |

不支持安全编辑的 Channel 通常会回退到输入指示器或仅最终传递。

## 最终化

最终答案准备好后，OpenClaw 尝试保持聊天整洁：

- 如果草稿可以安全地成为最终答案，OpenClaw 就地编辑它。
- 如果 Channel 使用原生进度流，OpenClaw 在原生传输接受最终文本时最终化该流。
- 如果最终答案有媒体、审批提示、显式回复目标、过多块，或编辑/发送失败，OpenClaw 通过正常 Channel 传递路径发送最终答案。

回退路径是有意为之的。发送新的最终答案比丢失文本、错误线程回复或用 Channel 无法安全表示的载荷覆盖草稿要好。

## 故障排查

**我只看到最终答案。**

检查处理消息的账户或 Channel 的 `channels.<channel>.streaming.mode` 是否设置为 `progress`。某些群组或引用回复路径在 Channel 无法安全编辑正确消息时可能会为该轮次禁用草稿预览。

**我看到标签但没有工具行。**

检查 `streaming.progress.toolProgress`。如果为 `false`，OpenClaw 保留单条草稿行为但隐藏工具和任务进度行。

**我看到新的最终消息而不是编辑的草稿。**

这是安全回退。可能发生在媒体回复、长答案、显式回复目标、旧的 Telegram 草稿、缺失的 Slack 线程目标、已删除的预览消息或失败的原生流最终化时。

**我仍然看到独立的进度消息。**

进度模式在草稿活跃时抑制默认的独立工具进度消息。如果独立消息仍然出现，请确认该轮次实际上使用的是进度模式，而不是 `streaming.mode: "off"` 或无法为该消息创建草稿的 Channel 路径。

**Teams 的行为与 Discord 或 Telegram 不同。**

Microsoft Teams 在个人聊天中使用原生流，而不是通用的发送并编辑预览传输。Teams 也将 `streaming.mode: "block"` 视为 Teams 块传递，因为它没有 Discord 和 Telegram 使用的相同草稿预览块模式。

## 相关

- [流式传输与分块](/concepts/streaming)
- [消息](/concepts/messages)
- [Channel 配置](/gateway/config-channels)
- [Discord](/channels/discord)
- [Matrix](/channels/matrix)
- [Microsoft Teams](/channels/msteams)
- [Slack](/channels/slack)
- [Telegram](/channels/telegram)
