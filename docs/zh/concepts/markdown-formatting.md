---
title: "Markdown 格式"
sidebarTitle: "Markdown 格式"
mmh3_hash: "69b17d883823ad6d99a695cbb87c0e4d"
summary: "出站 channels 的 Markdown 格式化管道"
read_when: ["你正在为出站 channels 更改 markdown 格式化或分块","你正在添加新的 channel formatter 或样式映射","你正在调试跨 channels 的格式化回归"]
---
# Markdown 格式

OpenClaw 通过将出站 Markdown 转换为共享的中间表示(IR),然后再渲染特定于 channel 的输出来格式化它。IR 保持源文本完整,同时携带样式/链接跨度,以便分块和渲染可以在 channels 之间保持一致。

## 目标

- **一致性:** 一个解析步骤,多个渲染器。
- **安全分块:** 在渲染之前拆分文本,以便内联格式化永远不会跨块分解。
- **Channel 适配:** 将相同的 IR 映射到 Slack mrkdwn、Telegram HTML 和 Signal 样式范围,而无需重新解析 Markdown。

## 管道

1. **解析 Markdown -> IR**
   - IR 是纯文本加上样式跨度(bold/italic/strike/code/spoiler)和链接跨度。
   - 偏移量是 UTF-16 代码单元,因此 Signal 样式范围与其 API 对齐。
   - 仅当 channel 选择加入表转换时才解析表。
2. **分块 IR(格式优先)**
   - 分块在渲染之前发生在 IR 文本上。
   - 内联格式化不会跨块拆分;每个块的跨度被切片。
3. **按 channel 渲染**
   - **Slack:** mrkdwn tokens(bold/italic/strike/code),链接为 `<url|label>`。
   - **Telegram:** HTML tags(`<b>`、`<i>`、`<s>`、`<code>`、`<pre><code>`、`<a href>`)。
   - **Signal:** 纯文本 + `text-style` 范围;当标签不同时,链接变为 `label (url)`。

## IR 示例

输入 Markdown:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR(示意):

```json
{
  "text": "Hello world — see docs.",
  "styles": [
    { "start": 6, "end": 11, "style": "bold" }
  ],
  "links": [
    { "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }
  ]
}
```

## 在哪里使用

- Slack、Telegram 和 Signal 出站适配器从 IR 渲染。
- 其他 channels(WhatsApp、iMessage、MS Teams、Discord)仍使用纯文本或其自己的格式化规则,在启用时在分块之前应用 Markdown 表转换。

## 表处理

Markdown 表在聊天客户端之间不一致支持。使用 `markdown.tables` 按 channel(和每个账户)控制转换。

- `code`: 将表渲染为代码块(大多数 channels 的默认值)。
- `bullets`: 将每行转换为项目符号点(Signal + WhatsApp 的默认值)。
- `off`: 禁用表解析和转换;原始表文本通过。

配置键:

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

- 块限制来自 channel 适配器/配置,并应用于 IR 文本。
- 代码围栏作为带有尾随换行符的单个块保留,以便 channels 正确渲染它们。
- 列表前缀和 blockquote 前缀是 IR 文本的一部分,因此分块不会在前缀中间拆分。
- 内联样式(bold/italic/strike/inline-code/spoiler)永远不会跨块拆分;渲染器在每个块内重新打开样式。

如果你需要更多关于跨 channels 的分块行为,请参见 [Streaming + chunking](/concepts/streaming)。

## 链接策略

- **Slack:** `[label](url)` -> `<url|label>`;裸 URLs 保持裸露。在解析期间禁用 Autolink 以避免双重链接。
- **Telegram:** `[label](url)` -> `<a href="url">label</a>`(HTML 解析模式)。
- **Signal:** `[label](url)` -> `label (url)`,除非 label 匹配 URL。

## Spoilers

Spoiler 标记(`||spoiler||`)仅针对 Signal 解析,它们映射到 SPOILER 样式范围。其他 channels 将它们视为纯文本。

## 如何添加或更新 channel formatter

1. **解析一次:** 使用共享的 `markdownToIR(...)` helper,使用 channel 适当的选项(autolink、heading style、blockquote prefix)。
2. **渲染:** 使用 `renderMarkdownWithMarkers(...)` 和样式标记映射(或 Signal 样式范围)实现渲染器。
3. **分块:** 在渲染之前调用 `chunkMarkdownIR(...)`;渲染每个块。
4. **连接适配器:** 更新 channel 出站适配器以使用新的 chunker 和渲染器。
5. **测试:** 添加或更新格式测试,如果 channel 使用分块,则添加出站交付测试。

## 常见陷阱

- Slack 尖括号 tokens(`<@U123>`、`<#C123>`、`<https://...>`)必须保留;安全地转义原始 HTML。
- Telegram HTML 需要转义标签之外的文本以避免损坏的标记。
- Signal 样式范围依赖于 UTF-16 偏移量;不要使用代码点偏移量。
- 为围栏代码块保留尾随换行符,以便关闭标记位于其自己的行上。
