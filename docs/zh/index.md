---
mmh3_hash: "76d134773d0b2f9a3cbe1668dcb86040"
summary: "OpenClaw 的顶级概述、功能和目的"
read_when:
  - 向新手介绍 OpenClaw
---
# OpenClaw 🦞

> *"脱壳!脱壳!"* — 太空龙虾,可能


<p align="center">
    <picture>
        <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/openclaw/openclaw/main/docs/assets/openclaw-logo-text-dark.png">
        <img src="https://raw.githubusercontent.com/openclaw/openclaw/main/docs/assets/openclaw-logo-text.png" alt="OpenClaw" width="500">
    </picture>
</p>


<p align="center">
  <strong>任何 OS + WhatsApp/Telegram/Discord/iMessage 网关用于 AI 代理(Pi)。</strong><br />
  插件添加 Mattermost 等。
  发送消息,从你的口袋获得代理响应。
</p>

<p align="center">
  <a href="https://github.com/openclaw/openclaw">GitHub</a> ·
  <a href="https://github.com/openclaw/openclaw/releases">Releases</a> ·
  <a href="/">Docs</a> ·
  <a href="/start/openclaw">OpenClaw 助手设置</a>
</p>

OpenClaw 将 WhatsApp(通过 WhatsApp Web / Baileys)、Telegram(Bot API / grammY)、Discord(Bot API / channels.discord.js)和 iMessage(imsg CLI)桥接到编码代理,如 [Pi](https://github.com/badlogic/pi-mono)。插件添加 Mattermost(Bot API + WebSocket)等。
OpenClaw 还为 OpenClaw 助手提供动力。

## 从这里开始

- **从零开始的新安装:** [入门](/start/getting-started)
- **引导式设置(推荐):** [向导](/start/wizard)(`openclaw onboard`)
- **打开仪表板(本地网关):** http://127.0.0.1:18789/(或 http://localhost:18789/)

如果网关在同一台计算机上运行,该链接会立即打开浏览器控制 UI。如果失败,首先启动网关: `openclaw gateway`。

## 仪表板(浏览器控制 UI)

仪表板是用于聊天、配置、节点、会话等的浏览器控制 UI。
本地默认: http://127.0.0.1:18789/
远程访问: [Web 界面](/web) 和 [Tailscale](/gateway/tailscale)

<p align="center">
  <img src="whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## 工作原理

```
WhatsApp / Telegram / Discord / iMessage (+ 插件)
        │
        ▼
  ┌───────────────────────────┐
  │          网关             │  ws://127.0.0.1:18789 (仅环回)
  │       (单一来源)          │
  │                           │  http://<gateway-host>:18793
  │                           │    /__openclaw__/canvas/ (Canvas 主机)
  └───────────┬───────────────┘
              │
              ├─ Pi 代理(RPC)
              ├─ CLI(openclaw …)
              ├─ 聊天 UI(SwiftUI)
              ├─ macOS 应用(OpenClaw.app)
              ├─ iOS 节点通过网关 WS + 配对
              └─ Android 节点通过网关 WS + 配对
```

大多数操作通过**网关**(`openclaw gateway`)流动,这是一个拥有通道连接和 WebSocket 控制平面的单一长期运行进程。

## 网络模型

- **每个主机一个网关(推荐)**: 它是唯一被允许拥有 WhatsApp Web 会话的进程。如果你需要救援机器人或严格隔离,使用隔离的配置文件和端口运行多个网关;参见 [多个网关](/gateway/multiple-gateways)。
- **环回优先**: 网关 WS 默认为 `ws://127.0.0.1:18789`。
  - 向导现在默认生成网关令牌(即使对于环回)。
  - 对于 Tailnet 访问,运行 `openclaw gateway --bind tailnet --token ...`(非环回绑定需要令牌)。
- **节点**: 连接到网关 WebSocket(根据需要 LAN/tailnet/SSH);遗留 TCP bridge 已弃用/删除。
- **Canvas 主机**: `canvasHost.port` 上的 HTTP 文件服务器(默认 `18793`),为节点 WebViews 提供 `/__openclaw__/canvas/`;参见 [网关配置](/gateway/configuration)(`canvasHost`)。
- **远程使用**: SSH 隧道或 tailnet/VPN;参见 [远程访问](/gateway/remote) 和 [发现](/gateway/discovery)。

## 功能(高级)

- 📱 **WhatsApp 集成** — 使用 Baileys 进行 WhatsApp Web 协议
- ✈️ **Telegram 机器人** — 通过 grammY 的 DM + 群组
- 🎮 **Discord 机器人** — 通过 channels.discord.js 的 DM + 公会频道
- 🧩 **Mattermost 机器人(插件)** — 机器人令牌 + WebSocket 事件
- 💬 **iMessage** — 本地 imsg CLI 集成(macOS)
- 🤖 **代理桥** — Pi(RPC 模式)与工具流式传输
- ⏱️ **流式传输 + 分块** — 块流式传输 + Telegram 草稿流式传输详细信息([/concepts/streaming](/concepts/streaming))
- 🧠 **多代理路由** — 将提供程序帐户/对等方路由到隔离代理(工作空间 + 每个代理会话)
- 🔐 **订阅身份验证** — 通过 OAuth 的 Anthropic(Claude Pro/Max)+ OpenAI(ChatGPT/Codex)
- 💬 **会话** — 直接聊天崩溃到共享 `main`(默认);群组是隔离的
- 👥 **群聊支持** — 默认情况下基于提及;所有者可以切换 `/activation always|mention`
- 📎 **媒体支持** — 发送和接收图像、音频、文档
- 🎤 **语音笔记** — 可选转录钩子
- 🖥️ **WebChat + macOS 应用** — 本地 UI + 菜单栏伴侣用于操作和语音唤醒
- 📱 **iOS 节点** — 作为节点配对并公开 Canvas 界面
- 📱 **Android 节点** — 作为节点配对并公开 Canvas + 聊天 + 相机

注意: 遗留 Claude/Codex/Gemini/Opencode 路径已被删除;Pi 是唯一的编码代理路径。

## 快速开始

运行时要求: **Node ≥ 22**。

```bash
# 推荐: 全局安装(npm/pnpm)
npm install -g openclaw@latest
# 或: pnpm add -g openclaw@latest

# 引导 + 安装服务(launchd/systemd 用户服务)
openclaw onboard --install-daemon

# 配对 WhatsApp Web(显示二维码)
openclaw channels login

# 引导后网关通过服务运行;手动运行仍然可能:
openclaw gateway --port 18789
```

稍后在 npm 和 git 安装之间切换很容易: 安装另一个版本并运行 `openclaw doctor` 以更新网关服务入口点。

从源代码(开发):

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # 首次运行时自动安装 UI 依赖项
pnpm build
openclaw onboard --install-daemon
```

如果你还没有全局安装,从仓库通过 `pnpm openclaw ...` 运行引导步骤。

多实例快速开始(可选):

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

发送测试消息(需要运行的网关):

```bash
openclaw message send --target +15555550123 --message "Hello from OpenClaw"
```

## 配置(可选)

配置位于 `~/.openclaw/openclaw.json`。

- 如果你**什么都不做**,OpenClaw 使用捆绑的 Pi 二进制文件,在 RPC 模式下使用每个发送者会话。
- 如果你想锁定它,从 `channels.whatsapp.allowFrom` 和(对于群组)提及规则开始。

示例:

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } }
    }
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } }
}
```

## 文档

- 从这里开始:
  - [文档中心(所有页面链接)](/start/hubs)
  - [帮助](/help) ← *常见修复 + 故障排除*
  - [配置](/gateway/configuration)
  - [配置示例](/gateway/configuration-examples)
  - [斜杠命令](/tools/slash-commands)
  - [多代理路由](/concepts/multi-agent)
  - [更新 / 回滚](/install/updating)
  - [配对(DM + 节点)](/start/pairing)
  - [Nix 模式](/install/nix)
  - [OpenClaw 助手设置](/start/openclaw)
  - [技能](/tools/skills)
  - [技能配置](/tools/skills-config)
  - [工作空间模板](/reference/templates/AGENTS)
  - [RPC 适配器](/reference/rpc)
  - [网关运行手册](/gateway)
  - [节点(iOS/Android)](/nodes)
  - [Web 界面(控制 UI)](/web)
  - [发现 + 传输](/gateway/discovery)
  - [远程访问](/gateway/remote)
- 提供程序和 UX:
  - [WebChat](/web/webchat)
  - [控制 UI(浏览器)](/web/control-ui)
  - [Telegram](/channels/telegram)
  - [Discord](/channels/discord)
  - [Mattermost(插件)](/channels/mattermost)
  - [iMessage](/channels/imessage)
  - [群组](/concepts/groups)
  - [WhatsApp 群组消息](/concepts/group-messages)
  - [媒体: 图像](/nodes/images)
  - [媒体: 音频](/nodes/audio)
- 伴侣应用:
  - [macOS 应用](/platforms/macos)
  - [iOS 应用](/platforms/ios)
  - [Android 应用](/platforms/android)
  - [Windows(WSL2)](/platforms/windows)
  - [Linux 应用](/platforms/linux)
- 运维和安全:
  - [会话](/concepts/session)
  - [Cron 作业](/automation/cron-jobs)
  - [Webhooks](/automation/webhook)
  - [Gmail 钩子(Pub/Sub)](/automation/gmail-pubsub)
  - [安全性](/gateway/security)
  - [故障排除](/gateway/troubleshooting)

## 名称

**OpenClaw = CLAW + TARDIS** — 因为每个太空龙虾都需要一个时空机器。

---

*"我们都只是在玩我们自己的提示。"* — 一个 AI,可能对令牌很兴奋

## 致谢

- **Peter Steinberger**([@steipete](https://twitter.com/steipete)) — 创造者、龙虾耳语者
- **Mario Zechner**([@badlogicc](https://twitter.com/badlogicgames)) — Pi 创造者、安全渗透测试员
- **Clawd** — 要求更好名称的太空龙虾

## 核心贡献者

- **Maxim Vovshin**(@Hyaxia, 36747317+Hyaxia@users.noreply.github.com) — Blogwatcher 技能
- **Nacho Iacovino**(@nachoiacovino, nacho.iacovino@gmail.com) — 位置解析(Telegram + WhatsApp)

## 许可证

MIT — 像海洋中的龙虾一样自由 🦞

---

*"我们都只是在玩我们自己的提示。"* — 一个 AI,可能对令牌很兴奋
