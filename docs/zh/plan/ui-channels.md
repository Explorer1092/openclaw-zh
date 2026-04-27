---
mmh3_hash: "635996b711dcdf14125742cb456c4d0c"
summary: 将语义消息表示与 Channel 原生 UI 渲染器解耦。
title: Channel 表示重构计划
read_when:
  - 重构 Channel 消息 UI、交互式有效载荷或原生 Channel 渲染器
  - 更改消息工具能力、交付提示或跨 context 标记
  - 调试 Discord Carbon 导入扩展或 Channel 插件运行时懒加载
---

## 状态

已针对共享 Agent、CLI、插件能力和出站交付界面实现：

- `ReplyPayload.presentation` 携带语义消息 UI。
- `ReplyPayload.delivery.pin` 携带已发送消息的置顶请求。
- 共享消息操作暴露 `presentation`、`delivery` 和 `pin`，而不是 Provider 原生的 `components`、`blocks`、`buttons` 或 `card`。
- 核心通过插件声明的出站能力渲染或自动降级表示。
- Discord、Slack、Telegram、Mattermost、MS Teams 和 Feishu 渲染器使用通用合约。
- Discord Channel 控制平面代码不再导入 Carbon 支持的 UI 容器。

规范文档现在存在于[消息表示](/plugins/message-presentation)中。
将此计划作为历史实现 context 保留；合约、渲染器或回退行为变更时更新规范指南。

## 问题

Channel UI 目前分散在几个不兼容的界面上：

- 核心通过 `buildCrossContextComponents` 拥有一个 Discord 形状的跨 context 渲染器钩子。
- Discord `channel.ts` 可以通过 `DiscordUiContainer` 导入原生 Carbon UI，这将运行时 UI 依赖项拉入 Channel 插件控制平面。
- Agent 和 CLI 暴露了原生有效载荷逃生舱，如 Discord `components`、Slack `blocks`、Telegram 或 Mattermost `buttons` 以及 Teams 或 Feishu `card`。
- `ReplyPayload.channelData` 同时携带传输提示和原生 UI 信封。
- 通用的 `interactive` 模型存在，但它比 Discord、Slack、Teams、Feishu、LINE、Telegram 和 Mattermost 已经使用的更丰富的布局更窄。

这使核心了解了原生 UI 形状，削弱了插件运行时懒加载，并给 Agent 太多了 Provider 特定的方式来表达相同的消息意图。

## 目标

- 核心根据声明的能力为消息决定最佳的语义表示。
- 扩展声明能力并将语义表示渲染到原生传输有效载荷中。
- Web Control UI 与聊天原生 UI 保持分离。
- 原生 Channel 有效载荷不通过共享 Agent 或 CLI 消息界面暴露。
- 不支持的表示功能自动降级为最佳文本表示。
- 置顶已发送消息等交付行为是通用的交付元数据，而不是表示。

## 非目标

- 不为 `buildCrossContextComponents` 提供向后兼容性 shim。
- 不为 `components`、`blocks`、`buttons` 或 `card` 提供公共的原生逃生舱。
- 不在核心中导入 Channel 原生 UI 库。
- 不为捆绑 Channel 提供特定于 Provider 的 SDK 接缝。

## 目标模型

向 `ReplyPayload` 添加核心拥有的 `presentation` 字段。

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
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
```

`interactive` 在迁移期间成为 `presentation` 的子集：

- `interactive` 文本块映射到 `presentation.blocks[].type = "text"`。
- `interactive` 按钮块映射到 `presentation.blocks[].type = "buttons"`。
- `interactive` 选择块映射到 `presentation.blocks[].type = "select"`。

外部 Agent 和 CLI schema 现在使用 `presentation`；`interactive` 仍然是现有回复生产者的内部旧版解析器/渲染助手。

## 交付元数据

为不是 UI 的发送行为添加核心拥有的 `delivery` 字段。

```ts
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

语义：

- `delivery.pin = true` 意味着置顶第一个成功交付的消息。
- `notify` 默认为 `false`。
- `required` 默认为 `false`；不支持的 Channel 或失败的置顶通过继续交付自动降级。
- 现有消息的手动 `pin`、`unpin` 和 `list-pins` 消息操作保持不变。

当前 Telegram ACP 主题绑定应该从 `channelData.telegram.pin = true` 移动到 `delivery.pin = true`。

## 运行时能力合约

向运行时出站适配器添加表示和交付渲染钩子，而不是控制平面 Channel 插件。

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

核心行为：

- 解析目标 Channel 和运行时适配器。
- 询问表示能力。
- 在渲染之前降级不支持的块。
- 调用 `renderPresentation`。
- 如果不存在渲染器，将表示转换为文本回退。
- 成功发送后，当请求 `delivery.pin` 且受支持时调用 `pinDeliveredMessage`。

## Channel 映射

Discord：

- 在仅运行时模块中将 `presentation` 渲染到 components v2 和 Carbon 容器。
- 在轻量模块中保留强调颜色助手。
- 从 Channel 插件控制平面代码中删除 `DiscordUiContainer` 导入。

Slack：

- 将 `presentation` 渲染到 Block Kit。
- 删除 Agent 和 CLI 的 `blocks` 输入。

Telegram：

- 将文本、context 和分隔符渲染为文本。
- 在目标表面配置且允许时，将操作和选择渲染为内联键盘。
- 禁用内联按钮时使用文本回退。
- 将 ACP 主题置顶移动到 `delivery.pin`。

Mattermost：

- 在已配置的地方将操作渲染为交互式按钮。
- 将其他块渲染为文本回退。

MS Teams：

- 将 `presentation` 渲染到 Adaptive Cards。
- 保留手动 pin/unpin/list-pins 操作。
- 如果 Graph 支持对目标对话可靠，可选择实现 `pinDeliveredMessage`。

Feishu：

- 将 `presentation` 渲染到交互式卡片。
- 保留手动 pin/unpin/list-pins 操作。
- 如果 API 行为可靠，可选择实现 `pinDeliveredMessage` 用于已发送消息置顶。

LINE：

- 在可能的情况下将 `presentation` 渲染到 Flex 或模板消息。
- 对不支持的块回退到文本。
- 从 `channelData` 中删除 LINE UI 有效载荷。

简单或有限的 Channel：

- 使用保守格式将表示转换为文本。

## 重构步骤

1. 重新应用 Discord 发布修复，将 `ui-colors.ts` 从 Carbon 支持的 UI 中分离，并从 `extensions/discord/src/channel.ts` 中删除 `DiscordUiContainer`。
2. 向 `ReplyPayload`、出站有效载荷规范化、交付摘要和钩子有效载荷添加 `presentation` 和 `delivery`。
3. 在窄 SDK/运行时子路径中添加 `MessagePresentation` schema 和解析器助手。
4. 将消息能力 `buttons`、`cards`、`components` 和 `blocks` 替换为语义表示能力。
5. 向运行时出站适配器添加表示渲染和交付置顶的钩子。
6. 将跨 context 组件构建替换为 `buildCrossContextPresentation`。
7. 删除 `src/infra/outbound/channel-adapters.ts` 并从 Channel 插件类型中删除 `buildCrossContextComponents`。
8. 更改 `maybeApplyCrossContextMarker` 以附加 `presentation` 而不是原生参数。
9. 更新插件调度发送路径，仅使用语义表示和交付元数据。
10. 删除 Agent 和 CLI 原生有效载荷参数：`components`、`blocks`、`buttons` 和 `card`。
11. 删除创建原生消息工具 schema 的 SDK 助手，用表示 schema 助手替换它们。
12. 从 `channelData` 中删除 UI/原生信封；在审查每个剩余字段之前仅保留传输元数据。
13. 迁移 Discord、Slack、Telegram、Mattermost、MS Teams、Feishu 和 LINE 渲染器。
14. 更新消息 CLI、Channel 页面、插件 SDK 和能力手册的文档。
15. 为 Discord 和受影响的 Channel 入口点运行导入扩展分析。

步骤 1-11 和 13-14 在此重构中针对共享 Agent、CLI、插件能力和出站适配器合约实现。步骤 12 仍然是针对特定于 Provider 的 `channelData` 传输信封的更深层内部清理工作。如果我们想要超出类型/测试门控的量化导入扩展数字，步骤 15 仍然是后续验证。

## 测试

添加或更新：

- 表示规范化测试。
- 不支持块的表示自动降级测试。
- 插件调度和核心交付路径的跨 context 标记测试。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE 和文本回退的 Channel 渲染矩阵测试。
- 证明原生字段消失的消息工具 schema 测试。
- 证明原生标志消失的 CLI 测试。
- Discord 入口点导入懒加载覆盖 Carbon 的回归测试。
- 覆盖 Telegram 和通用回退的交付置顶测试。

## 开放问题

- `delivery.pin` 应该在第一次通过时为 Discord、Slack、MS Teams 和 Feishu 实现，还是只先为 Telegram？
- `delivery` 是否最终应该吸收现有字段，如 `replyToId`、`replyToCurrent`、`silent` 和 `audioAsVoice`，还是现在专注于发送后行为？
- 表示是否应该直接支持图像或文件引用，还是媒体现在应该与 UI 布局分开？

## 相关

- [Channel 概述](/channels)
- [消息表示](/plugins/message-presentation)
