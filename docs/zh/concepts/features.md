---
mmh3_hash: "10a966495ad92fd1f5155703dc06d2e3"
summary: "OpenClaw 跨 Channel、路由、媒体和用户体验的功能"
read_when:
  - 你想要 OpenClaw 支持内容的完整列表
title: "Features"
---

# Features

## 亮点

<Columns>
  <Card title="Channels" icon="message-square">
    单个 Gateway 支持 Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat 及更多。
  </Card>
  <Card title="Plugins" icon="plug">
    捆绑插件在正常当前版本中无需单独安装即可添加 Matrix、Nextcloud Talk、Nostr、Twitch、Zalo 及更多功能。
  </Card>
  <Card title="路由" icon="route">
    具有隔离 Session 的多 Agent 路由。
  </Card>
  <Card title="媒体" icon="image">
    支持图像、音频、视频、文档的输入输出，以及图像/视频生成。
  </Card>
  <Card title="应用和界面" icon="monitor">
    Web Control UI 和 macOS 配套应用。
  </Card>
  <Card title="移动节点" icon="smartphone">
    支持配对、语音/聊天和丰富设备命令的 iOS 和 Android 节点。
  </Card>
</Columns>

## 完整列表

**Channels：**

- 内置 Channel 包括 Discord、Google Chat、iMessage（旧版）、IRC、Signal、Slack、Telegram、WebChat 和 WhatsApp
- 捆绑插件 Channel 包括 BlueBubbles（iMessage）、Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal
- 可选单独安装的 Channel 插件包括 Voice Call 和 WeChat 等第三方软件包
- 第三方 Channel 插件可进一步扩展 Gateway，例如 WeChat
- 支持基于提及激活的群聊
- 带有允许列表和配对的私信安全机制

**Agent：**

- 支持工具流式传输的嵌入式 Agent runtime
- 具有隔离 Session（每个 workspace 或发送者）的多 Agent 路由
- Session：直接聊天折叠到共享的 `main`；群组是隔离的
- 长响应的流式传输和分块

**Auth 和 Provider：**

- 35+ model provider（Anthropic、OpenAI、Google 及更多）
- 通过 OAuth 进行订阅 auth（例如 OpenAI Codex）
- 自定义和自托管 provider 支持（vLLM、SGLang、Ollama 及任何 OpenAI 兼容或 Anthropic 兼容端点）

**媒体：**

- 图像、音频、视频和文档的输入输出
- 共享图像生成和视频生成能力
- 语音笔记转录
- 支持多个 provider 的文字转语音

**应用和界面：**

- WebChat 和浏览器 Control UI
- macOS 菜单栏配套应用
- 支持配对、Canvas、摄像头、屏幕录制、位置和语音的 iOS 节点
- 支持配对、聊天、语音、Canvas、摄像头和设备命令的 Android 节点

**工具和自动化：**

- 浏览器自动化、exec、沙盒
- 网络搜索（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）
- Cron jobs 和心跳调度
- Skills、插件和工作流管道（Lobster）
