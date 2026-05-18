---
mmh3_hash: "93bd1e26930ecd34d044df268714a26e"
summary: "出站 Channel 的 Markdown 格式化管道"
read_when:
  - 您正在更改出站 Channel 的 Markdown 格式化或分块
  - 您正在添加新的 Channel 格式化器或样式映射
  - 您正在调试跨 Channel 的格式化回归
title: "Markdown 格式"
---

OpenClaw 通过将出站 Markdown 转换为共享的中间表示（IR）来格式化，然后再渲染特定 Channel 的输出。IR 保持源文本完整，同时携带样式/链接跨度，使分块和渲染在各 Channel 间保持一致。

## 目标

- **一致性：** 一次解析步骤，多个渲染器。
- **安全分块：** 在渲染前对 IR 文本进行拆分，使内联格式不会跨块分割。
- **Channel 适配：** 将相同的 IR 映射到 Slack mrkdwn、Telegram HTML 和 Signal 样式范围，无需重新解析 Markdown。

## 管道

1. **解析 Markdown -> IR**
   - IR 是纯文本加上样式跨度（粗体/斜体/删除线/代码/剧透）和链接跨度。
   - 偏移量为 UTF-16 代码单元，使 Signal 样式范围与其 API 对齐。
   - 仅当 Channel 选择启用表格转换时才解析表格。
2. **对 IR 进行分块（格式优先）**
   - 分块在渲染前对 IR 文本进行。
   - 内联格式不会跨块分割；跨度按块切片。
3. **按 Channel 渲染**
   - **Slack：** mrkdwn 标记（粗体/斜体/删除线/代码），链接为 `<url|label>`。
   - **Telegram：** HTML 标签（`<b>`、`<i>`、`<s>`、`<code>`、`<pre><code>`、`<a href>`）。
   - **Signal：** 纯文本加 `text-style` 范围；当标签与 URL 不同时，链接变为 `label (url)`。

## IR 示例

输入 Markdown：

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR（示意）：

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## 使用位置

- Slack、Telegram 和 Signal 出站适配器从 IR 渲染。
- 其他 Channel（WhatsApp、iMessage、Microsoft Teams、Discord）仍使用纯文本或各自的格式规则，在启用时会在分块前应用 Markdown 表格转换。

## 表格处理

Markdown 表格在聊天客户端中没有统一支持。使用 `markdown.tables` 控制每个 Channel（和每个账户）的转换。

- `code`：将表格渲染为代码块（大多数 Channel 的默认值）。
- `bullets`：将每行转换为项目符号（Matrix、Signal 和 WhatsApp 的默认值）。
- `off`：禁用表格解析和转换；原始表格文本直接传递。

配置键：

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## 分块规则

- 分块限制来自 Channel 适配器/配置，并应用于 IR 文本。
- 代码围栏作为单个块保留，末尾有换行符，使 Channel 能正确渲染。
- 列表前缀和块引用前缀是 IR 文本的一部分，因此分块不会在前缀中间分割。
- 内联样式（粗体/斜体/删除线/内联代码/剧透）绝不跨块分割；渲染器在每个块内重新打开样式。

如果您需要了解更多关于跨 Channel 分块行为的信息，请参阅[流式传输 + 分块](/concepts/streaming)。

## 链接策略

- **Slack：** `[label](url)` -> `<url|label>`；裸 URL 保持原样。解析时禁用自动链接以避免双重链接。
- **Telegram：** `[label](url)` -> `<a href="url">label</a>`（HTML 解析模式）。
- **Signal：** `[label](url)` -> `label (url)`，除非标签与 URL 匹配。

## 剧透

剧透标记（`||spoiler||`）仅为 Signal 解析，映射到 SPOILER 样式范围。其他 Channel 将其视为纯文本。

## 如何添加或更新 Channel 格式化器

1. **一次解析：** 使用共享的 `markdownToIR(...)` 助手，带有适合 Channel 的选项（自动链接、标题样式、块引用前缀）。
2. **渲染：** 使用 `renderMarkdownWithMarkers(...)` 和样式标记映射（或 Signal 样式范围）实现渲染器。
3. **分块：** 在渲染前调用 `chunkMarkdownIR(...)`；渲染每个块。
4. **连接适配器：** 更新 Channel 出站适配器以使用新的分块器和渲染器。
5. **测试：** 添加或更新格式测试，如果 Channel 使用分块，则添加出站传递测试。

## 常见陷阱

- Slack 尖括号标记（`<@U123>`、`<#C123>`、`<https://...>`）必须保留；安全地转义原始 HTML。
- Telegram HTML 需要对标签外的文本进行转义，以避免破损的标记。
- Signal 样式范围依赖 UTF-16 偏移量；不要使用代码点偏移量。
- 保留围栏代码块的尾部换行符，使闭合标记位于独立行。

## 相关

<CardGroup cols={2}>
  <Card title="流式传输和分块" href="/concepts/streaming" icon="bars-staggered">
    出站流式传输行为、块边界和特定 Channel 的传递。
  </Card>
  <Card title="System Prompt" href="/concepts/system-prompt" icon="message-lines">
    模型在对话之前看到的内容，包括注入的工作区文件。
  </Card>
</CardGroup>
