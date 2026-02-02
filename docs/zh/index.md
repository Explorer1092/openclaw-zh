---
mmh3_hash: "d2110b81137c03680e9b0c42aac974ca"
title: "OpenClaw"
sidebarTitle: "OpenClaw"
summary: "OpenClaw 的顶层概览、功能和用途"
read_when:
  - 向新人介绍 OpenClaw
---

# OpenClaw 🦞

> _"脱壳！脱壳！"_ — 来自一只太空龙虾，大概

<p align="center">
    <img
        src="/assets/openclaw-logo-text-dark.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-logo-text.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

<p align="center">
  <strong>适用于任何操作系统 + WhatsApp/Telegram/Discord/iMessage gateway，用于 AI agent（Pi）。</strong><br />
  插件支持 Mattermost 等更多平台。
  发送消息，从口袋里获取 agent 响应。
</p>

<p align="center">
  <a href="https://github.com/openclaw/openclaw">GitHub</a> ·
  <a href="https://github.com/openclaw/openclaw/releases">版本发布</a> ·
  <a href="/">文档</a> ·
  <a href="/start/openclaw">OpenClaw 助手设置</a>
</p>

OpenClaw 桥接 WhatsApp（通过 WhatsApp Web / Baileys）、Telegram（Bot API / grammY）、Discord（Bot API / channels.discord.js）和 iMessage（imsg CLI）到编码 agent，如 [Pi](https://github.com/badlogic/pi-mono)。插件支持 Mattermost（Bot API + WebSocket）等更多平台。
OpenClaw 也为 OpenClaw 助手提供支持。

## 从这里开始

- **从零开始的新安装：** [入门指南](/start/getting-started)
- **引导式设置（推荐）：** [向导](/start/wizard)（`openclaw onboard`）
- **打开仪表板（本地 Gateway）：** http://127.0.0.1:18789/ （或 http://localhost:18789/）

如果 Gateway 在同一台计算机上运行，该链接会立即打开浏览器控制 UI。如果失败，请先启动 Gateway：`openclaw gateway`。

## 仪表板（浏览器控制 UI）

仪表板是用于聊天、配置、节点、会话等的浏览器控制 UI。
本地默认地址：http://127.0.0.1:18789/
远程访问：[Web surfaces](/web) 和 [Tailscale](/gateway/tailscale)

<p align="center">
  <img src="whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## 工作原理

```
WhatsApp / Telegram / Discord / iMessage（+ 插件）
        │
        ▼
  ┌───────────────────────────┐
  │          Gateway          │  ws://127.0.0.1:18789（仅 loopback）
  │      （单一来源）         │
  │                           │  http://<gateway-host>:18793
  │                           │    /__openclaw__/canvas/（Canvas host）
  └───────────┬───────────────┘
              │
              ├─ Pi agent（RPC）
              ├─ CLI（openclaw …）
              ├─ Chat UI（SwiftUI）
              ├─ macOS app（OpenClaw.app）
              ├─ iOS node 通过 Gateway WS + 配对
              └─ Android node 通过 Gateway WS + 配对
```

大多数操作都通过 **Gateway**（`openclaw gateway`）流转，这是一个长期运行的单一进程，拥有通道连接和 WebSocket 控制平面。

## 网络模型

- **每个主机一个 Gateway（推荐）**：它是唯一允许拥有 WhatsApp Web 会话的进程。如果需要救援 bot 或严格隔离，请使用隔离的配置文件和端口运行多个 gateway；参见 [Multiple gateways](/gateway/multiple-gateways)。
- **优先 Loopback**：Gateway WS 默认为 `ws://127.0.0.1:18789`。
  - 现在向导默认生成 gateway token（即使对于 loopback）。
  - 对于 Tailnet 访问，运行 `openclaw gateway --bind tailnet --token ...`（非 loopback 绑定需要 token）。
- **Nodes**：连接到 Gateway WebSocket（根据需要 LAN/tailnet/SSH）；传统的 TCP bridge 已弃用/删除。
- **Canvas host**：HTTP 文件服务器在 `canvasHost.port`（默认 `18793`）上，为 node WebViews 提供 `/__openclaw__/canvas/`；参见 [Gateway configuration](/gateway/configuration)（`canvasHost`）。
- **远程使用**：SSH tunnel 或 tailnet/VPN；参见 [Remote access](/gateway/remote) 和 [Discovery](/gateway/discovery)。

## 功能（高层级）

- 📱 **WhatsApp 集成** — 使用 Baileys 实现 WhatsApp Web 协议
- ✈️ **Telegram Bot** — 通过 grammY 支持 DM + 群组
- 🎮 **Discord Bot** — 通过 channels.discord.js 支持 DM + 服务器频道
- 🧩 **Mattermost Bot（插件）** — Bot token + WebSocket 事件
- 💬 **iMessage** — 本地 imsg CLI 集成（macOS）
- 🤖 **Agent 桥接** — Pi（RPC 模式）与 tool streaming
- ⏱️ **Streaming + chunking** — Block streaming + Telegram draft streaming 详情（[/concepts/streaming](/concepts/streaming)）
- 🧠 **多 agent 路由** — 将 provider 账户/对等方路由到隔离的 agent（workspace + 每个 agent 的会话）
- 🔐 **订阅认证** — Anthropic（Claude Pro/Max）+ OpenAI（ChatGPT/Codex）通过 OAuth
- 💬 **Sessions** — 直接聊天折叠到共享的 `main`（默认）；群组是隔离的
- 👥 **群聊支持** — 默认基于提及；所有者可以切换 `/activation always|mention`
- 📎 **媒体支持** — 发送和接收图像、音频、文档
- 🎤 **语音消息** — 可选的转录 hook
- 🖥️ **WebChat + macOS app** — 本地 UI + 菜单栏伴侣用于操作和语音唤醒
- 📱 **iOS node** — 作为节点配对并公开 Canvas surface
- 📱 **Android node** — 作为节点配对并公开 Canvas + Chat + Camera

注意：传统的 Claude/Codex/Gemini/Opencode 路径已被删除；Pi 是唯一的编码 agent 路径。

## 快速开始

运行时要求：**Node ≥ 22**。

```bash
# 推荐：全局安装（npm/pnpm）
npm install -g openclaw@latest
# 或：pnpm add -g openclaw@latest

# 入门 + 安装服务（launchd/systemd 用户服务）
openclaw onboard --install-daemon

# 配对 WhatsApp Web（显示二维码）
openclaw channels login

# Gateway 在入门后通过服务运行；仍可以手动运行：
openclaw gateway --port 18789
```

稍后在 npm 和 git 安装之间切换很容易：安装另一种风格并运行 `openclaw doctor` 以更新 gateway 服务入口点。

从源代码（开发）：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # 首次运行时自动安装 UI 依赖
pnpm build
openclaw onboard --install-daemon
```

如果尚未进行全局安装，请从 repo 通过 `pnpm openclaw ...` 运行入门步骤。

多实例快速启动（可选）：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

发送测试消息（需要运行中的 Gateway）：

```bash
openclaw message send --target +15555550123 --message "Hello from OpenClaw"
```

## 配置（可选）

配置位于 `~/.openclaw/openclaw.json`。

- 如果你**什么都不做**，OpenClaw 使用捆绑的 Pi 二进制文件，以 RPC 模式和每个发送者的会话运行。
- 如果你想锁定它，从 `channels.whatsapp.allowFrom` 开始，（对于群组）提及规则。

示例：

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## 文档

- 从这里开始：
  - [文档中心（所有页面链接）](/start/hubs)
  - [帮助](/help) ← _常见修复 + 故障排除_
  - [配置](/gateway/configuration)
  - [配置示例](/gateway/configuration-examples)
  - [Slash 命令](/tools/slash-commands)
  - [多 agent 路由](/concepts/multi-agent)
  - [更新 / 回滚](/install/updating)
  - [配对（DM + nodes）](/start/pairing)
  - [Nix 模式](/install/nix)
  - [OpenClaw 助手设置](/start/openclaw)
  - [Skills](/tools/skills)
  - [Skills 配置](/tools/skills-config)
  - [Workspace 模板](/reference/templates/AGENTS)
  - [RPC adapters](/reference/rpc)
  - [Gateway 运行手册](/gateway)
  - [Nodes（iOS/Android）](/nodes)
  - [Web surfaces（控制 UI）](/web)
  - [Discovery + transports](/gateway/discovery)
  - [远程访问](/gateway/remote)
- Providers 和 UX：
  - [WebChat](/web/webchat)
  - [控制 UI（浏览器）](/web/control-ui)
  - [Telegram](/channels/telegram)
  - [Discord](/channels/discord)
  - [Mattermost（插件）](/channels/mattermost)
  - [iMessage](/channels/imessage)
  - [群组](/concepts/groups)
  - [WhatsApp 群组消息](/concepts/group-messages)
  - [媒体：图像](/nodes/images)
  - [媒体：音频](/nodes/audio)
- 配套应用：
  - [macOS app](/platforms/macos)
  - [iOS app](/platforms/ios)
  - [Android app](/platforms/android)
  - [Windows（WSL2）](/platforms/windows)
  - [Linux app](/platforms/linux)
- 运维和安全：
  - [Sessions](/concepts/session)
  - [Cron 作业](/automation/cron-jobs)
  - [Webhooks](/automation/webhook)
  - [Gmail hooks（Pub/Sub）](/automation/gmail-pubsub)
  - [安全](/gateway/security)
  - [故障排除](/gateway/troubleshooting)

## 名称由来

**OpenClaw = CLAW + TARDIS** — 因为每只太空龙虾都需要一台时空机器。

---

_"我们都只是在玩我们自己的 prompts。"_ — 一个 AI，可能是 token 过量

## 致谢

- **Peter Steinberger**（[@steipete](https://x.com/steipete)）— 创作者，龙虾耳语者
- **Mario Zechner**（[@badlogicc](https://x.com/badlogicgames)）— Pi 创作者，安全渗透测试者
- **Clawd** — 要求更好名字的太空龙虾

## 核心贡献者

- **Maxim Vovshin**（@Hyaxia, 36747317+Hyaxia@users.noreply.github.com）— Blogwatcher skill
- **Nacho Iacovino**（@nachoiacovino, nacho.iacovino@gmail.com）— 位置解析（Telegram + WhatsApp）

## 许可证

MIT — 像海洋中的龙虾一样自由 🦞

---

_"我们都只是在玩我们自己的 prompts。"_ — 一个 AI，可能是 token 过量
