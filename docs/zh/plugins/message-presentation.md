---
mmh3_hash: "9873e5d490b003b6d8c5f7e37d29bf90"
summary: "Channel Plugin 的语义消息卡片、按钮、选择菜单、降级文本和交付提示"
title: "消息呈现"
read_when:
  - 添加或修改消息卡片、按钮或选择菜单渲染
  - 构建支持富文本出站消息的 Channel Plugin
  - 更改消息工具呈现或交付能力
  - 调试特定于 Provider 的卡片/块/组件渲染回归
---

消息呈现是 OpenClaw 用于富文本出站聊天 UI 的共享契约。它让 Agent、CLI 命令、审批流程和 Plugin 只需描述一次消息意图，而每个 Channel Plugin 会渲染它能渲染的最佳原生形式。

使用呈现来实现可移植的消息 UI：

- 文本部分
- 小型上下文/页脚文本
- 分隔符
- 按钮
- 选择菜单
- 卡片标题和基调

不要向共享消息工具添加新的 Provider 原生字段，如 Discord `components`、Slack `blocks`、Telegram `buttons`、Teams `card` 或 Feishu `card`。这些是 Channel Plugin 拥有的渲染器输出。

## 契约

Plugin 作者从以下位置导入公共契约：

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

形态：

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

按钮语义：

- `value` 是在 Channel 支持可点击控件时通过 Channel 现有交互路径路由回的应用程序操作值。
- `url` 是链接按钮。它可以在没有 `value` 的情况下存在。
- `label` 是必填的，也用于文本降级。
- `style` 是建议性的。渲染器应将不支持的样式映射到安全的默认值，而不是发送失败。

选择菜单语义：

- `options[].value` 是选定的应用程序值。
- `placeholder` 是建议性的，可能被没有原生选择支持的 Channel 忽略。
- 如果 Channel 不支持选择菜单，降级文本会列出标签。

## 生产者示例

简单卡片：

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

仅 URL 链接按钮：

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

选择菜单：

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

CLI 发送：

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

固定交付：

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

带有显式 JSON 的固定交付：

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## 渲染器契约

Channel Plugin 在其出站适配器上声明渲染支持：

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

能力字段是有意的简单布尔值。它们描述渲染器可以使交互式的内容，而不是每个原生平台的限制。渲染器仍然拥有特定于平台的限制，如最大按钮数量、块数量和卡片大小。

## 核心渲染流程

当 `ReplyPayload` 或消息操作包含 `presentation` 时，核心：

1. 规范化呈现有效负载。
2. 解析目标 Channel 的出站适配器。
3. 读取 `presentationCapabilities`。
4. 当适配器可以渲染有效负载时调用 `renderPresentation`。
5. 当适配器不存在或无法渲染时回退到保守文本。
6. 通过正常的 Channel 交付路径发送结果有效负载。
7. 在第一条成功发送的消息后应用交付元数据，如 `delivery.pin`。

核心拥有降级行为，以便生产者可以保持 Channel 无关。Channel Plugin 拥有原生渲染和交互处理。

## 降级规则

呈现在有限的 Channel 上发送必须是安全的。

降级文本包括：

- `title` 作为第一行
- `text` 块作为普通段落
- `context` 块作为紧凑上下文行
- `divider` 块作为视觉分隔符
- 按钮标签，包括链接按钮的 URL
- 选择选项标签

不支持的原生控件应该降级而不是使整个发送失败。示例：

- 禁用内联按钮的 Telegram 发送文本降级。
- 没有选择支持的 Channel 将选择选项列为文本。
- 仅 URL 按钮变为原生链接按钮或降级 URL 行。
- 可选的固定失败不会使交付的消息失败。

主要例外是 `delivery.pin.required: true`；如果固定被请求为必需且 Channel 无法固定发送的消息，交付报告失败。

## Provider 映射

当前 Bundle 渲染器：

| Channel | 原生渲染目标 | 说明 |
| --- | --- | --- |
| Discord | 组件和组件容器 | 为现有 Provider 原生有效负载生产者保留旧版 `channelData.discord.components`，但新的共享发送应使用 `presentation`。 |
| Slack | Block Kit | 为现有 Provider 原生有效负载生产者保留旧版 `channelData.slack.blocks`，但新的共享发送应使用 `presentation`。 |
| Telegram | 文本加内联键盘 | 按钮/选择需要目标界面的内联按钮能力；否则使用文本降级。 |
| Mattermost | 文本加交互属性 | 其他块降级为文本。 |
| Microsoft Teams | 自适应卡片 | 当同时提供时，普通 `message` 文本包含在卡片中。 |
| Feishu | 交互卡片 | 卡片标题可以使用 `title`；正文避免重复该标题。 |
| 纯文本 Channel | 文本降级 | 没有渲染器的 Channel 仍然获得可读输出。 |

Provider 原生有效负载兼容性是现有回复生产者的过渡便利。这不是向共享消息操作 Schema 添加新共享原生字段的理由。

## 呈现与 InteractiveReply

`InteractiveReply` 是审批和交互助手使用的旧版内部子集。它支持：

- 文本
- 按钮
- 选择菜单

`MessagePresentation` 是规范的共享发送契约。它添加了：

- 标题
- 基调
- 上下文
- 分隔符
- 仅 URL 按钮
- 通过 `ReplyPayload.delivery` 的通用交付元数据

从 `openclaw/plugin-sdk/interactive-runtime` 使用助手来桥接旧版代码：

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

新代码应直接接受或生成 `MessagePresentation`。

## 交付固定

固定是交付行为，而不是呈现。使用 `delivery.pin` 而不是 Provider 原生字段，如 `channelData.telegram.pin`。

语义：

- `pin: true` 固定第一条成功交付的消息。
- `pin.notify` 默认为 `false`。
- `pin.required` 默认为 `false`。
- 可选的固定失败降级并保持发送的消息完整。
- 必需的固定失败使交付失败。
- 分块消息固定第一个交付的块，而不是尾部块。

手动 `pin`、`unpin` 和 `pins` 消息操作对于 Provider 支持这些操作的现有消息仍然存在。

## Plugin 作者清单

- 当 Channel 可以渲染或安全降级语义呈现时，从 `describeMessageTool(...)` 声明 `presentation`。
- 在运行时出站适配器中添加 `presentationCapabilities`。
- 在运行时代码中实现 `renderPresentation`，而不是控制平面 Plugin 设置代码。
- 将原生 UI 库保留在热设置/目录路径之外。
- 在渲染器和测试中保留平台限制。
- 为不支持的按钮、选择菜单、URL 按钮、标题/文本重复和混合 `message` 加 `presentation` 发送添加降级测试。
- 仅当 Provider 可以固定发送的消息 id 时，才通过 `deliveryCapabilities.pin` 和 `pinDeliveredMessage` 添加交付固定支持。
- 不要通过共享消息操作 Schema 公开新的 Provider 原生卡片/块/组件/按钮字段。

## 相关文档

- [消息 CLI](/cli/message)
- [Plugin SDK 概览](/plugins/sdk-overview)
- [Plugin 架构](/plugins/architecture-internals#message-tool-schemas)
- [Channel 呈现重构计划](/plan/ui-channels)
