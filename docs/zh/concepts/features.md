---
mmh3_hash: "093138e4de4b750114eaa337d79b7a6c"
summary: "OpenClaw 跨 Channels、路由、媒体和用户体验的功能。"
read_when:
  - 您想要 OpenClaw 支持内容的完整列表
title: "Features"
---

# Features

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

**Channels:**

- WhatsApp、Telegram、Discord、iMessage(内置)
- Mattermost、Matrix、Microsoft Teams、Nostr 及更多(plugin)
- 支持基于提及激活的群聊
- 带有允许列表和配对的 DM 安全机制

**Agent:**

- 支持工具流式传输的嵌入式 agent runtime
- 具有隔离 sessions(每个 workspace 或发送者)的多 agent 路由
- Sessions:直接聊天折叠到共享的 `main`;群组是隔离的
- 长响应的流式传输和分块

**Auth 和 providers:**

- 35+ model providers(Anthropic、OpenAI、Google 及更多)
- 通过 OAuth 进行订阅 auth(例如 OpenAI Codex)
- 自定义和自托管 provider 支持(vLLM、SGLang、Ollama 及任何 OpenAI 兼容或 Anthropic 兼容端点)

**媒体:**

- 图像、音频、视频和文档的输入输出
- 语音笔记转录
- 支持多个 provider 的文字转语音

**应用和界面:**

- WebChat 和浏览器 Control UI
- macOS 菜单栏配套应用
- 支持配对、Canvas、摄像头、屏幕录制、位置和语音的 iOS 节点
- 支持配对、聊天、语音、Canvas、摄像头和设备命令的 Android 节点

**工具和自动化:**

- 浏览器自动化、exec、沙盒
- 网络搜索(Brave、Perplexity、Gemini、Grok、Kimi、Firecrawl)
- Cron jobs 和心跳调度
- Skills、plugin 和工作流管道(Lobster)
