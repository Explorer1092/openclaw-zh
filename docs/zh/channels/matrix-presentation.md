---
mmh3_hash: "128a36a02287fade591a296c3c5e981d"
summary: "适用于 OpenClaw 感知客户端的 Matrix MessagePresentation 元数据"
read_when:
  - 构建渲染 OpenClaw 富文本响应的 Matrix 客户端
  - 调试 com.openclaw.presentation 事件内容
title: "Matrix 展示元数据"
---

OpenClaw 可以在 `com.openclaw.presentation` 下将规范化的 `MessagePresentation` 元数据附加到出站 Matrix `m.room.message` 事件中。

标准 Matrix 客户端继续渲染纯文本 `body`。OpenClaw 感知的客户端可以读取结构化元数据并渲染原生 UI，例如按钮、选择框、上下文行和分隔符。

## 事件内容

元数据存储在 Matrix 事件内容中：

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\n- DeepSeek: /model deepseek/deepseek-chat",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Select model",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choose model",
        "options": [
          {
            "label": "DeepSeek",
            "value": "/model deepseek/deepseek-chat"
          }
        ]
      }
    ]
  }
}
```

`version` 是 Matrix 展示元数据模式版本。`type` 是 OpenClaw 感知客户端的稳定判别符。客户端应忽略未知的 `type` 值、无法安全解释的未知版本以及未知的块类型。

## 回退行为

OpenClaw 始终将可读的纯文本回退渲染到 `body` 中。结构化元数据是附加性的，不得要求用于基本的 Matrix 互操作性。

不支持的客户端应继续显示回退文本。OpenClaw 感知的客户端可以优先使用结构化元数据进行显示，同时保留回退文本用于复制、搜索、通知和无障碍访问。

## 支持的块

Matrix 出站适配器宣布支持：

- `buttons`
- `select`
- `context`
- `divider`

客户端应将这些块视为尽力而为的展示提示。未知字段和未知块类型应被忽略，而不是导致整个消息渲染失败。

## 交互

此元数据不添加 Matrix 回调语义。按钮和选择选项值是回退交互载体，通常是斜杠命令或文本命令。希望支持交互的 Matrix 客户端可以将选定的值作为普通消息发送回房间。

例如，值为 `/model deepseek/deepseek-chat` 的按钮可以通过在同一房间发送该值作为加密 Matrix 文本消息来处理。

## 与审批元数据的关系

`com.openclaw.presentation` 用于一般的富文本消息展示。

审批提示使用专用的 `com.openclaw.approval` 元数据，因为审批携带安全敏感的状态、决策以及执行/Plugin 详情。如果同一事件上同时存在两个元数据键，客户端应优先使用专用的审批渲染器。

## 媒体消息

当回复包含多个媒体 URL 时，OpenClaw 为每个媒体 URL 发送一个 Matrix 事件。展示元数据仅附加到第一个媒体事件，以便客户端有一个稳定的结构化载体并避免重复渲染器。

保持展示元数据紧凑。大量用户可见文本应保留在 `body` 中并使用正常的 Matrix 文本分块路径。
