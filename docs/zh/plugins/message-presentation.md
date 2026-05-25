---
mmh3_hash: "ea02a9b5cef7f5bb4a304daa57f6dcc6"
summary: "Channel Plugin 的语义消息卡片、按钮、选择菜单、降级文本和交付提示"
title: "消息呈现"
read_when:
  - 添加或修改消息卡片、按钮或选择菜单渲染
  - 构建支持丰富出站消息的 Channel Plugin
  - 更改消息工具呈现或交付能力
  - 调试特定于 Provider 的卡片/块/组件渲染回归
doc-schema-version: 1
---

消息呈现是 OpenClaw 丰富出站聊天 UI 的共享契约。它让 Agent、CLI 命令、审批流和 Plugin 只需描述一次消息意图，而每个 Channel Plugin 会以其能支持的最佳原生形式渲染。

使用呈现来实现可移植消息 UI：

- 文本节
- 小型上下文/页脚文本
- 分隔符
- 按钮
- 选择菜单
- 卡片标题和语气

不要向共享消息工具添加新的 Provider 原生字段，例如 Discord `components`、Slack `blocks`、Telegram `buttons`、Teams `card` 或 Feishu `card`。这些是由 Channel Plugin 拥有的渲染器输出。

## 契约

Plugin 作者从以下位置导入公共契约：

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

结构：

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
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
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

- `value` 是应用程序操作值，当 Channel 支持可点击控件时，通过 Channel 现有的交互路径路由回来。
- `url` 是链接按钮。它可以不带 `value` 存在。
- `webApp` 描述 Channel 原生 Web 应用按钮。Telegram 将其渲染为 `web_app`，仅在私聊中支持。`web_app` 仍然在松散 JSON 载荷中接受以保持兼容性，但 TypeScript 生产者应使用 `webApp`。
- `label` 是必需的，也用于文本降级。
- `style` 是建议性的。渲染器应将不支持的样式映射到安全默认值，而不是使发送失败。
- `priority` 是可选的。当 Channel 宣传操作限制且必须删除控件时，Core 优先保留高优先级按钮，并在同等优先级按钮中保持原始顺序。当所有控件都适合时，保持编写顺序。
- `disabled` 是可选的。Channel 必须通过 `supportsDisabled` 选择加入；否则 Core 将禁用的控件降级为非交互降级文本。

选择语义：

- `options[].value` 是所选的应用程序值。
- `placeholder` 是建议性的，可能会被没有原生选择支持的 Channel 忽略。
- 如果 Channel 不支持选择，则降级文本会列出标签。

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

仅 URL 的链接按钮：

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

Telegram Mini App 按钮：

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
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

带显式 JSON 的固定交付：

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
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
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

能力布尔值描述渲染器可以实现交互的内容。可选的 `limits` 描述了 Core 在调用渲染器之前可以适配的通用信封：

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};
```

Core 在渲染之前将通用限制应用于语义控件。渲染器仍然负责对无法在通用契约中表达的原生块计数、卡片大小、URL 限制和 Provider 特性进行最终的特定于 Provider 的验证和裁剪。如果限制从块中删除了每个控件，Core 会将标签保留为非交互上下文文本，以便交付的消息仍然有可见的降级。

## Core 渲染流程

当 `ReplyPayload` 或消息操作包含 `presentation` 时，Core：

1. 规范化呈现载荷。
2. 解析目标 Channel 的出站适配器。
3. 读取 `presentationCapabilities`。
4. 当适配器宣传操作数量、标签长度和选择选项数量等通用能力限制时应用它们。
5. 当适配器可以渲染载荷时调用 `renderPresentation`。
6. 当适配器不存在或无法渲染时降级为保守文本。
7. 通过正常的 Channel 交付路径发送结果载荷。
8. 在第一条成功发送的消息之后应用交付元数据，例如 `delivery.pin`。

Core 拥有降级行为，因此生产者可以保持 Channel 无关性。Channel Plugin 拥有原生渲染和交互处理。

## 降级规则

呈现必须在有限 Channel 上安全发送。

降级文本包括：

- `title` 作为第一行
- `text` 块作为普通段落
- `context` 块作为紧凑上下文行
- `divider` 块作为视觉分隔符
- 按钮标签，包括链接按钮的 URL
- 选择选项标签

不支持的原生控件应降级而不是使整个发送失败。示例：

- 禁用内联按钮的 Telegram 发送文本降级。
- 不支持选择的 Channel 将选择选项列为文本。
- 仅 URL 的按钮成为原生链接按钮或降级 URL 行。
- 可选固定失败不会使已交付的消息失败。

主要例外是 `delivery.pin.required: true`；如果固定被请求为必需且 Channel 无法固定已发送的消息，则交付报告失败。

## Provider 映射

当前捆绑的渲染器：

| Channel         | 原生渲染目标               | 注意事项                                                                                                                                         |
| --------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Discord         | 组件和组件容器             | 为现有 Provider 原生载荷生产者保留旧版 `channelData.discord.components`，但新的共享发送应使用 `presentation`。                                    |
| Slack           | Block Kit                  | 为现有 Provider 原生载荷生产者保留旧版 `channelData.slack.blocks`，但新的共享发送应使用 `presentation`。                                          |
| Telegram        | 文本加内联键盘             | 按钮/选择需要目标表面的内联按钮能力；否则使用文本降级。                                                                                           |
| Mattermost      | 文本加交互属性             | 其他块降级为文本。                                                                                                                               |
| Microsoft Teams | Adaptive Cards             | 当两者都提供时，纯 `message` 文本会包含在卡片中。                                                                                               |
| Feishu          | 交互式卡片                 | 卡片标题可以使用 `title`；正文避免重复该标题。                                                                                                   |
| 纯文本 Channel  | 文本降级                   | 没有渲染器的 Channel 仍然会获得可读输出。                                                                                                        |

Provider 原生载荷兼容性是现有回复生产者的过渡机制。这不是向共享消息操作 Schema 添加新共享原生字段的理由。

## Presentation 与 InteractiveReply

`InteractiveReply` 是审批和交互助手使用的旧版内部子集。它支持：

- 文本
- 按钮
- 选择

`MessagePresentation` 是规范的共享发送契约。它添加了：

- 标题
- 语气
- 上下文
- 分隔符
- 仅 URL 的按钮
- 通过 `ReplyPayload.delivery` 的通用交付元数据

桥接旧版代码时，使用来自 `openclaw/plugin-sdk/interactive-runtime` 的助手：

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

新代码应直接接受或生产 `MessagePresentation`。现有的 `interactive` 载荷是 `presentation` 的已弃用子集；运行时支持旧版生产者仍然保持。

旧版 `InteractiveReply*` 类型和转换助手在 SDK 中标记为 `@deprecated`：

- `InteractiveReply`、`InteractiveReplyBlock`、`InteractiveReplyButton`、`InteractiveReplyOption`、`InteractiveReplySelectBlock` 和 `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` 和 `presentationToInteractiveControlsReply(...)` 仍然作为旧版 Channel 实现的渲染器桥接可用。新生产者代码不应调用它们；发送 `presentation` 并让 Core/Channel 适配处理渲染。

审批助手也有呈现优先的替换：

- 使用 `buildApprovalPresentationFromActionDescriptors(...)` 代替 `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- 使用 `buildApprovalPresentation(...)` 代替 `buildApprovalInteractiveReply(...)`
- 使用 `buildExecApprovalPresentation(...)` 代替 `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` 对于没有文本降级的呈现块（例如仅有分隔符的呈现）返回空字符串。需要非空发送正文的传输可以传递 `emptyFallback` 以选择最小正文，而不更改默认降级契约。

## 交付固定

固定是交付行为，而非呈现。使用 `delivery.pin` 代替 Provider 原生字段，例如 `channelData.telegram.pin`。

语义：

- `pin: true` 固定第一条成功交付的消息。
- `pin.notify` 默认为 `false`。
- `pin.required` 默认为 `false`。
- 可选固定失败降级并保留已发送的消息。
- 必需固定失败使交付失败。
- 分块消息固定第一个交付的块，而不是尾部块。

手动 `pin`、`unpin` 和 `pins` 消息操作仍然存在于 Provider 支持这些操作的现有消息中。

## Plugin 作者检查清单

- 当 Channel 可以渲染或安全降级语义呈现时，从 `describeMessageTool(...)` 声明 `presentation`。
- 向运行时出站适配器添加 `presentationCapabilities`。
- 在运行时代码中实现 `renderPresentation`，而不是控制平面 Plugin 设置代码。
- 将原生 UI 库保留在热设置/目录路径之外。
- 当通用能力限制已知时，在 `presentationCapabilities.limits` 上声明它们。
- 在渲染器和测试中保留最终平台限制。
- 为不支持的按钮、选择、URL 按钮、标题/文本重复以及混合 `message` 加 `presentation` 发送添加降级测试。
- 仅当 Provider 可以固定已发送的消息 ID 时，才通过 `deliveryCapabilities.pin` 和 `pinDeliveredMessage` 添加交付固定支持。
- 不要通过共享消息操作 Schema 公开新的 Provider 原生卡片/块/组件/按钮字段。

## 相关文档

- [Message CLI](/cli/message)
- [Plugin SDK 概览](/plugins/sdk-overview)
- [Plugin 架构](/plugins/architecture-internals#message-tool-schemas)
- [Channel 呈现重构计划](/plan/ui-channels)
