---
mmh3_hash: "8e785feaee55e9c333f1dd8b48426812"
summary: "OpenClaw 可以连接的消息平台"
read_when:
  - 选择 OpenClaw 的聊天 Channel
title: "Channels"
---

OpenClaw 可连接到多个消息平台（Channel）。每个 Channel 都有自己的插件、认证机制以及访问控制模型。

## 核心 Channel

这些 Channel 内置于核心 OpenClaw 软件包中：

| Channel        | 说明                                                                 |
| -------------- | -------------------------------------------------------------------- |
| **Discord**    | 机器人 Token，支持服务器（Guild）和私信。                             |
| **iMessage**   | 通过 `imsg`（macOS 专属）原生接入 iMessage。                         |
| **Signal**     | 通过 `signal-cli` 守护进程接入。                                     |
| **Slack**      | Socket Mode 或 HTTP Request URL，支持工作区和私信。                  |
| **Telegram**   | 基于 grammY 的机器人，长轮询或 Webhook。                             |
| **WhatsApp**   | 通过 WhatsApp Web（Baileys）按需安装。                               |

## 可下载 Channel（Plugin）

这些 Channel 作为单独的 Plugin 分发：

| Channel              | 说明                                               |
| -------------------- | -------------------------------------------------- |
| **Feishu**           | Feishu/Lark 机器人，WebSocket 或 Webhook 模式。    |
| **Google Chat**      | 通过服务账户 + Webhook 接入。                      |
| **LINE**             | LINE Messaging API Webhook。                        |
| **Matrix**           | 支持 E2EE 的 Matrix 协议，可自托管。               |
| **Mattermost**       | Mattermost 机器人 Token，原生斜杠命令。            |
| **Microsoft Teams**  | Bot Framework，支持联合认证。                      |
| **QQ Bot**           | QQ 官方机器人 API。                                |

## 传递说明

- 每个 Channel 通过自身的 Plugin 运行，可独立启用/禁用。
- 访问控制（`dmPolicy`、`groupPolicy`、`allowFrom`）在每个 Channel 单独配置。
- 配对（DM 访问批准）适用于所有支持的 Channel。
- 多账户在支持多个机器人身份的 Channel 中可用。

## 相关

- [Pairing](/channels/pairing) — DM 访问批准流程
- [Groups](/channels/groups) — 跨 Channel 群组消息行为
- [Channel routing](/channels/channel-routing) — 会话路由
- [Gateway configuration](/gateway/configuration) — 完整 Channel 配置参考
