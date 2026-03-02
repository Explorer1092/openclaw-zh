---
mmh3_hash: "90ddf789989866f16f3177450e417691"
summary: "OpenClaw 跨 Channels、路由、媒体和用户体验的功能。"
read_when:
  - 您想要 OpenClaw 支持内容的完整列表
title: "Features"
---

## 亮点

<Columns>
  <Card title="Channels" icon="message-square">
    单个 Gateway 支持 WhatsApp、Telegram、Discord 和 iMessage。
  </Card>
  <Card title="Plugins" icon="plug">
    通过扩展添加 Mattermost 等更多功能。
  </Card>
  <Card title="路由" icon="route">
    具有隔离 sessions 的多 Agent 路由。
  </Card>
  <Card title="媒体" icon="image">
    支持图像、音频和文档的输入输出。
  </Card>
  <Card title="应用和用户界面" icon="monitor">
    Web Control UI 和 macOS 配套应用。
  </Card>
  <Card title="移动节点" icon="smartphone">
    支持配对、语音/聊天和丰富设备命令的 iOS 和 Android 节点。
  </Card>
</Columns>

## 完整列表

- 通过 WhatsApp Web（Baileys）集成 WhatsApp
- Telegram 机器人支持（grammY）
- Discord 机器人支持（channels.discord.js）
- Mattermost 机器人支持（Plugin）
- 通过本地 imsg CLI 集成 iMessage（macOS）
- RPC 模式下 Pi 的 Agent 桥接，支持工具流式传输
- 长响应的流式传输和分块
- 每个工作空间或发送者隔离 sessions 的多 Agent 路由
- 通过 OAuth 进行 Anthropic 和 OpenAI 的订阅认证
- Sessions：直接聊天折叠到共享的 `main`；群组是隔离的
- 群聊支持，基于提及激活
- 支持图像、音频和文档的媒体
- 可选的语音笔记转录 Hook
- WebChat 和 macOS 菜单栏应用
- 具有配对、Canvas、摄像头、屏幕录制、位置和语音功能的 iOS 节点
- 具有配对、Connect 标签、聊天 sessions、语音标签、Canvas/摄像头/屏幕，以及设备、通知、联系人/日历、运动、照片、短信和应用更新命令的 Android 节点

<Note>
旧版 Claude、Codex、Gemini 和 Opencode 路径已被移除。Pi 是唯一的编码 Agent 路径。
</Note>
