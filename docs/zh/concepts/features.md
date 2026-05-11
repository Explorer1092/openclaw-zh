---
mmh3_hash: "1018eebb2a8aa1dabf21f380be26558b"
summary: "OpenClaw 跨 Channel、路由、媒体和用户体验的功能"
read_when:
  - 你想要 OpenClaw 支持内容的完整列表
title: "功能"
---

## 亮点

<Columns>
  <Card title="Channels" icon="message-square" href="/channels">
    单个 Gateway 支持 Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat 及更多。
  </Card>
  <Card title="Plugins" icon="plug" href="/tools/plugin">
    捆绑插件在正常当前版本中无需单独安装即可添加 Matrix、Nextcloud Talk、Nostr、Twitch、Zalo 及更多功能。
  </Card>
  <Card title="路由" icon="route" href="/concepts/multi-agent">
    具有隔离 Session 的多 Agent 路由。
  </Card>
  <Card title="媒体" icon="image" href="/nodes/images">
    图片、音频、视频、文档以及图片/视频生成。
  </Card>
  <Card title="应用与 UI" icon="monitor" href="/web/control-ui">
    Web Control UI 和 macOS 配套应用。
  </Card>
  <Card title="移动 Node" icon="smartphone" href="/nodes">
    iOS 和 Android Node，支持配对、语音/聊天和丰富的设备命令。
  </Card>
</Columns>

## 完整列表

**Channels：**

- 内置 Channel 包括 Discord、Google Chat、iMessage、IRC、Signal、Slack、Telegram、WebChat 和 WhatsApp
- 捆绑插件 Channel 包括 Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal
- 可选单独安装的 Channel 插件包括 Voice Call 和第三方包（如 WeChat）
- 第三方 Channel 插件可进一步扩展 Gateway，如 WeChat
- 支持基于 @ 提及激活的群聊
- 使用允许列表和配对保障 DM 安全

**Agent：**

- 内嵌 Agent 运行时，支持工具流
- 具有隔离 Session 的多 Agent 路由（按工作区或发送者）
- Sessions：直接聊天合并到共享的 `main`；群组隔离
- 长回复的流式传输和分块

**认证与 Provider：**

- 35+ 模型 Provider（Anthropic、OpenAI、Google 等）
- 通过 OAuth 的订阅认证（如 OpenAI Codex）
- 自定义和自托管 Provider 支持（vLLM、SGLang、Ollama 及任何 OpenAI 兼容或 Anthropic 兼容端点）

**媒体：**

- 输入和输出图片、音频、视频和文档
- 共享图片生成和视频生成能力界面
- 语音备忘录转录
- 多 Provider 的文字转语音

**应用与界面：**

- WebChat 和浏览器 Control UI
- macOS 菜单栏配套应用
- iOS Node，支持配对、Canvas、相机、屏幕录制、位置和语音
- Android Node，支持配对、聊天、语音、Canvas、相机和设备命令

**工具与自动化：**

- 浏览器自动化、exec、沙盒
- 网络搜索（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）
- Cron 任务和心跳调度
- Skill、Plugin 和工作流管道（Lobster）

## 相关

<CardGroup cols={2}>
  <Card title="实验性功能" href="/concepts/experimental-features" icon="flask">
    尚未发布到默认界面的可选功能。
  </Card>
  <Card title="Agent 运行时" href="/concepts/agent" icon="robot">
    Agent 运行时模型以及运行如何调度。
  </Card>
  <Card title="Channels" href="/channels" icon="message-square">
    从一个 Gateway 连接 Telegram、WhatsApp、Discord、Slack 及更多。
  </Card>
  <Card title="Plugins" href="/tools/plugin" icon="plug">
    扩展 OpenClaw 的捆绑和第三方插件。
  </Card>
</CardGroup>
