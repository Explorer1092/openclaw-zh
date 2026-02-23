---
title: "常见问题解答 (FAQ)"
sidebarTitle: "常见问题"
mmh3_hash: "e1094b648621382396d81f8681987cda"
summary: "常见问题 - OpenClaw 设置、使用和故障排除"
read_when: ["遇到问题或错误","需要设置/配置帮助","想要了解功能"]
---

# 常见问题解答 (FAQ)

## 目录

- [安装和设置](#安装和设置)
- [WhatsApp](#whatsapp)
- [Telegram](#telegram)
- [Discord](#discord)
- [iMessage](#imessage)
- [网关](#网关)
- [配置](#配置)
- [代理和提供程序](#代理和提供程序)
- [Pi 集成](#pi-集成)
- [会话和内存](#会话和内存)
- [媒体和文件](#媒体和文件)
- [安全和隐私](#安全和隐私)
- [网络和远程访问](#网络和远程访问)
- [故障排除](#故障排除)
- [更新和版本管理](#更新和版本管理)
- [macOS 应用](#macos-应用)
- [iOS 和 Android](#ios-和-android)
- [技能和工具](#技能和工具)
- [高级主题](#高级主题)
- [性能和限制](#性能和限制)

---

## 安装和设置

### OpenClaw 的最低系统要求是什么?

- **Node.js:** 版本 22 或更高
- **操作系统:** macOS、Linux 或 Windows(通过 WSL2)
- **内存:** 至少 2GB RAM(4GB+ 推荐用于代理操作)
- **磁盘空间:** 约 500MB 用于安装和依赖项

### 如何安装 OpenClaw?

**全局安装(推荐):**
```bash
npm install -g openclaw@latest
# 或使用 pnpm
pnpm add -g openclaw@latest
```

**从源代码(开发):**
```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build
pnpm build
```

引导和安装服务:
```bash
openclaw onboard --install-daemon
```

有关详细说明,请参阅[入门](/start/getting-started)。

### 引导向导(`openclaw onboard`)有什么作用?

引导向导:
- 指导您完成初始配置
- 设置网关令牌(用于非环回访问)
- 配置通道(WhatsApp、Telegram、Discord 等)
- 配置代理提供程序(Pi、Anthropic、OpenAI)
- 可选安装系统服务(launchd/systemd)
- 创建或更新 `~/.openclaw/openclaw.json`

运行 `openclaw onboard` 以交互方式设置,或使用 `openclaw onboard --install-daemon` 同时安装服务。

### 我可以在同一台机器上运行多个 OpenClaw 网关吗?

可以,但需要不同的配置:
```bash
# 网关 A
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001

# 网关 B
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json \
OPENCLAW_STATE_DIR=~/.openclaw-b \
openclaw gateway --port 19002
```

每个网关需要:
- 唯一的配置文件
- 唯一的状态目录
- 唯一的端口
- 独立的 WhatsApp 会话(WhatsApp Web 每个设备一次)

参阅[多个网关](/gateway/multiple-gateways)了解更多详情。

### 如何将 OpenClaw 更新到最新版本?

**对于全局 npm 安装:**
```bash
npm install -g openclaw@latest
openclaw doctor  # 更新服务入口点
```

**对于从源代码安装:**
```bash
cd openclaw
git pull --rebase origin main
pnpm install
pnpm ui:build
pnpm build
openclaw doctor  # 更新服务
```

之后重启网关:
```bash
# macOS/Linux
openclaw gateway restart

# 或手动
pkill -f openclaw-gateway
openclaw gateway --port 18789
```

参阅[更新/回滚](/install/updating)了解版本控制和回滚。

### 如何卸载 OpenClaw?

1. 停止并移除服务:
```bash
# macOS
launchctl unload ~/Library/LaunchAgents/ai.openclaw.gateway.plist
rm ~/Library/LaunchAgents/ai.openclaw.gateway.plist

# Linux
systemctl --user stop openclaw-gateway
systemctl --user disable openclaw-gateway
rm ~/.config/systemd/user/openclaw-gateway.service
```

2. 移除全局包:
```bash
npm uninstall -g openclaw
# 或
pnpm remove -g openclaw
```

3. 删除配置和状态(可选):
```bash
rm -rf ~/.openclaw
rm -rf ~/.clawdbot  # 遗留目录
```

---

## WhatsApp

### 如何将 WhatsApp 连接到 OpenClaw?

1. 启动网关:
```bash
openclaw gateway --port 18789
```

2. 在新终端中登录:
```bash
openclaw channels login
```

3. 扫描显示的二维码使用您的 WhatsApp 应用
4. 一旦连接,二维码将消失,会话被保存

会话数据存储在 `~/.openclaw/state/whatsapp/` 中。

### WhatsApp 二维码未显示或过期

**如果二维码未显示:**
- 确保网关正在运行(`openclaw gateway status`)
- 检查网关日志中的错误(`openclaw gateway logs`)
- 验证端口 18789 未被占用(`ss -ltnp | grep 18789`)

**如果二维码过期:**
- 再次运行 `openclaw channels login` 生成新的二维码
- 确保在 60 秒内扫描

**如果扫描后重复断开连接:**
- WhatsApp 可能已标记会话;删除 `~/.openclaw/state/whatsapp/` 并重新登录
- 检查您的 WhatsApp 应用 > 设置 > 链接的设备,并移除旧会话
- 确保您的 WhatsApp 应用是最新的

### WhatsApp 会话保持断开连接

常见原因:
1. **WhatsApp 服务器端速率限制** — 如果您发送过多消息太快
2. **网络不稳定** — 检查您的互联网连接
3. **过时的 Baileys 版本** — 更新 OpenClaw 到最新版本
4. **多设备限制** — WhatsApp Web 每个帐户限制 5 个设备

解决方案:
```bash
# 清除会话并重新登录
rm -rf ~/.openclaw/state/whatsapp/
openclaw channels login
```

### 我可以在多台机器上使用相同的 WhatsApp 会话吗?

不可以。WhatsApp Web 协议将会话绑定到单个设备。如果您尝试在多台机器上使用相同的会话:
- 一个将被断开连接
- 会话可能被 WhatsApp 标记

对于多机器设置,请为每台机器使用不同的 WhatsApp 号码,或使用 SSH/Tailscale 远程访问单个网关。

### 如何仅允许来自特定号码的 WhatsApp 消息?

在 `~/.openclaw/openclaw.json` 中:
```json
{
  "channels": {
    "whatsapp": {
      "allowFrom": ["+15555550123", "+15555550456"]
    }
  }
}
```

不在列表中的号码将被忽略。参阅[配置示例](/gateway/configuration-examples)。

### WhatsApp 群组如何工作?

默认情况下,OpenClaw 仅在被提及时在群组中响应:
```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": {
          "requireMention": true
        }
      }
    }
  },
  "messages": {
    "groupChat": {
      "mentionPatterns": ["@openclaw", "bot"]
    }
  }
}
```

要在所有消息上激活:
```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": {
          "requireMention": false
        }
      }
    }
  }
}
```

每个群组都有一个隔离的会话(不与您的主 DM 会话共享)。

参阅[群组](/concepts/groups)和[WhatsApp 群组消息](/concepts/group-messages)。

### 我可以发送图像或文件到 WhatsApp 吗?

可以。OpenClaw 支持:
- **图像**(PNG、JPG、WebP)
- **文档**(PDF、TXT、等)
- **音频**(MP3、OGG、等)
- **语音笔记**(可选转录)

通过 WhatsApp 发送文件,代理会自动下载并处理它们。代理还可以使用工具发送媒体回复。

参阅[媒体:图像](/nodes/images)和[媒体:音频](/nodes/audio)。

---

## Telegram

### 如何将 Telegram 机器人连接到 OpenClaw?

1. 从 [@BotFather](https://t.me/botfather) 创建机器人并获取令牌
2. 将令牌添加到配置:
```json
{
  "channels": {
    "telegram": {
      "botToken": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
    }
  }
}
```
3. 重启网关:
```bash
openclaw gateway restart
```
4. 在 Telegram 中向您的机器人发送 `/start`

参阅[Telegram](/channels/telegram)了解更多详情。

### Telegram 机器人未响应

检查:
1. 机器人令牌是否正确(`openclaw config get channels.telegram.botToken`)
2. 网关是否正在运行(`openclaw gateway status`)
3. 网关日志是否有错误(`openclaw gateway logs`)
4. 您是否在 Telegram 中向机器人发送了 `/start`

常见问题:
- **令牌格式错误** — 应该是 `123456:ABC-DEF...`(无前缀)
- **网关未运行** — 启动它使用 `openclaw gateway`
- **速率限制** — Telegram 对机器人有速率限制;等待并重试

### 我可以在 Telegram 群组中使用机器人吗?

可以。将机器人添加到群组,它的行为类似于 WhatsApp:
- 默认情况下,仅在被提及时响应
- 每个群组都有一个隔离的会话
- 所有者可以切换激活模式使用 `/activation always|mention`

### Telegram 草稿流式传输如何工作?

Telegram 支持**草稿流式传输** — 代理在思考时发送部分更新:
```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "enabled": true,
        "chunkIntervalMs": 1500
      }
    }
  }
}
```

消息作为草稿出现,每 1.5 秒更新一次,直到最终。

禁用流式传输:
```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "enabled": false
      }
    }
  }
}
```

参阅[流式传输](/concepts/streaming)了解更多详情。

### 如何在 Telegram 中发送图像或文件?

转发它们到您的机器人。代理将下载并处理它们。

代理还可以使用工具(例如,生成图像的 `dall-e`)发送回图像。

---

## Discord

### 如何将 Discord 机器人连接到 OpenClaw?

1. 在 [Discord 开发者门户](https://discord.com/developers/applications)创建机器人
2. 启用 **Privileged Gateway Intents**(消息内容、服务器成员、存在)
3. 获取机器人令牌
4. 将令牌添加到配置:
```json
{
  "channels": {
    "discord": {
      "botToken": "YOUR_DISCORD_BOT_TOKEN"
    }
  }
}
```
5. 重启网关:
```bash
openclaw gateway restart
```
6. 邀请机器人到您的服务器使用 OAuth2 URL(范围:`bot`,权限:`Send Messages`,`Read Message History`)

参阅[Discord](/channels/discord)了解更多详情。

### Discord 机器人未响应

检查:
1. 机器人令牌是否正确
2. 网关是否正在运行
3. **Privileged Gateway Intents** 是否已启用(消息内容必需)
4. 机器人是否有权限在频道中读取/发送消息

常见问题:
- **缺少消息内容意图** — 在开发者门户中启用它
- **权限不足** — 确保机器人在频道中具有 `Send Messages` 权限
- **令牌格式错误** — 应该是原始令牌(无 `Bot` 前缀)

### Discord 群组/公会如何工作?

类似于 WhatsApp/Telegram:
- 默认情况下仅在被提及时响应(`@YourBot`)
- 每个公会频道都有一个隔离的会话
- 所有者可以切换激活模式使用 `/activation always|mention`

### 我可以在 Discord 中使用表情符号反应吗?

可以!代理可以向消息添加表情符号反应:
```json
{
  "channels": {
    "discord": {
      "reactions": {
        "enabled": true
      }
    }
  }
}
```

代理工作空间可以指导何时使用反应(例如,`👍` 表示确认,`😂` 表示有趣)。

参阅[AGENTS.md 模板](/reference/templates/AGENTS)了解反应指南。

---

## iMessage

### 如何将 iMessage 连接到 OpenClaw?

**要求:**
- macOS
- iMessage 帐户已启用
- `imsg` CLI 已安装

**设置:**
1. 安装 `imsg`:
```bash
brew install imsg
```
2. 在配置中启用 iMessage:
```json
{
  "channels": {
    "imessage": {
      "enabled": true
    }
  }
}
```
3. 重启网关:
```bash
openclaw gateway restart
```

发送 iMessage 到您的号码,代理应该响应。

参阅[iMessage](/channels/imessage)了解更多详情。

### iMessage 未发送/接收消息

检查:
1. `imsg` 是否已安装并在 PATH 中(`which imsg`)
2. iMessage 是否在 macOS 上已启用并登录
3. 网关日志是否有错误(`openclaw gateway logs`)

常见问题:
- **imsg 未找到** — 运行 `brew install imsg`
- **iMessage 未登录** — 在 macOS 上打开 Messages.app 并登录
- **权限被拒绝** — `imsg` 可能需要完全磁盘访问(系统偏好设置 > 安全性与隐私)

---

## 网关

### 网关是什么?

网关 (`openclaw gateway`) 是:
- OpenClaw 的核心长时间运行的进程
- 拥有所有通道连接(WhatsApp、Telegram、Discord 等)
- 处理消息路由到代理
- 提供 WebSocket 控制平面(`ws://127.0.0.1:18789`)
- 托管仪表板 UI(`http://127.0.0.1:18789`)
- 托管 Canvas 文件服务器(端口 `18793`)

每个主机通常运行**一个网关**。

参阅[网关运行手册](/gateway)了解更多详情。

### 如何启动/停止网关?

**启动:**
```bash
openclaw gateway --port 18789
```

**停止:**
```bash
# 优雅关闭
pkill -f openclaw-gateway

# 强制杀死
pkill -9 -f openclaw-gateway
```

**作为服务运行:**
```bash
# 安装服务
openclaw onboard --install-daemon

# macOS
launchctl start ai.openclaw.gateway

# Linux
systemctl --user start openclaw-gateway
```

### 如何检查网关状态?

```bash
openclaw gateway status
```

或者:
```bash
# 检查进程
ps aux | grep openclaw-gateway

# 检查端口
ss -ltnp | grep 18789
```

查看日志:
```bash
openclaw gateway logs

# 或者如果作为服务运行(macOS)
tail -f ~/Library/Logs/openclaw-gateway.log

# Linux
journalctl --user -u openclaw-gateway -f
```

### 网关使用什么端口?

默认端口:
- **18789** — WebSocket 控制平面 + 仪表板 UI
- **18793** — Canvas 主机(HTTP 文件服务器用于 WebViews)

更改端口:
```bash
openclaw gateway --port 19000 --canvas-port 19001
```

或在配置中:
```json
{
  "gateway": {
    "port": 19000,
    "canvasHost": {
      "port": 19001
    }
  }
}
```

### 我可以远程访问网关吗?

可以,但默认情况下网关绑定到环回(`127.0.0.1`)以确保安全。

**对于远程访问:**

1. **SSH 隧道**(推荐):
```bash
ssh -L 18789:127.0.0.1:18789 user@gateway-host
```

2. **Tailscale/VPN**:
```bash
openclaw gateway --bind tailnet --token YOUR_GATEWAY_TOKEN
```

3. **公共绑定**(不推荐除非需要):
```bash
openclaw gateway --bind 0.0.0.0 --token YOUR_GATEWAY_TOKEN
```

**注意:** 非环回绑定需要网关令牌。

参阅[远程访问](/gateway/remote)和[Tailscale](/gateway/tailscale)。

### 什么是网关令牌?

网关令牌是认证远程客户端(节点、CLI、WebChat)所需的共享密钥。

向导现在默认生成令牌。要手动生成:
```bash
openclaw config set gateway.token "$(openssl rand -hex 32)"
```

客户端必须在连接时提供令牌:
```bash
openclaw --gateway-token YOUR_TOKEN message send --target +15555550123 --message "Hello"
```

参阅[安全性](/gateway/security)了解更多详情。

### 如何更改网关绑定地址?

默认: `127.0.0.1`(仅环回)

更改到 Tailscale:
```bash
openclaw gateway --bind tailnet --token YOUR_TOKEN
```

更改到所有接口(不安全):
```bash
openclaw gateway --bind 0.0.0.0 --token YOUR_TOKEN
```

在配置中:
```json
{
  "gateway": {
    "bind": "tailnet",
    "token": "YOUR_GATEWAY_TOKEN"
  }
}
```

---

## 配置

### 配置文件存储在哪里?

默认: `~/.openclaw/openclaw.json`

覆盖:
```bash
OPENCLAW_CONFIG_PATH=~/my-config.json openclaw gateway
```

### 配置的格式是什么?

JSON,带有顶级键:
- `gateway` — 网关设置(端口、绑定、令牌)
- `channels` — 通道配置(WhatsApp、Telegram、Discord 等)
- `agents` — 代理路由和提供程序
- `messages` — 消息行为(流式传输、群组聊天等)
- `skills` — 技能启用/配置
- `automation` — Cron 作业、Webhooks 等

参阅[配置](/gateway/configuration)了解完整架构。

### 如何查看当前配置?

```bash
openclaw config show
```

或读取文件:
```bash
cat ~/.openclaw/openclaw.json
```

### 如何更改配置值?

使用 CLI:
```bash
openclaw config set gateway.port 19000
openclaw config set channels.whatsapp.allowFrom '["+15555550123"]'
```

或手动编辑 `~/.openclaw/openclaw.json` 并重启网关。

### 配置更改需要重启吗?

是的。大多数配置更改需要重启网关才能生效:
```bash
openclaw gateway restart
```

### 我可以使用环境变量吗?

是的,用于覆盖配置路径和状态目录:
- `OPENCLAW_CONFIG_PATH` — 配置文件路径
- `OPENCLAW_STATE_DIR` — 状态目录(会话、缓存等)

示例:
```bash
OPENCLAW_CONFIG_PATH=~/custom.json \
OPENCLAW_STATE_DIR=~/custom-state \
openclaw gateway
```

对于机密(API 密钥),您还可以直接在配置 JSON 中引用环境变量(如果工具支持),但 OpenClaw 通常期望配置中的文字值。

---

## 代理和提供程序

### OpenClaw 支持什么代理?

**主要代理后端:**
- **Pi** — 捆绑的编码代理(RPC 模式)(默认)

**遗留路径(已移除):**
- Claude、Codex、Gemini、Opencode 路径已被弃用并移除
- Pi 是唯一的编码代理路径

**用于 OAuth 的提供程序连接:**
- **Anthropic**(Claude Pro/Max 通过 OAuth)
- **OpenAI**(ChatGPT/Codex 通过 OAuth)

参阅[多代理路由](/concepts/multi-agent)了解路由详情。

### 如何配置 Pi?

Pi 自动捆绑。默认配置使用每个发送者会话的 RPC 模式。

自定义 Pi 路径(可选):
```json
{
  "agents": {
    "routing": {
      "*": {
        "provider": "pi",
        "config": {
          "binaryPath": "/custom/path/to/pi"
        }
      }
    }
  }
}
```

参阅[RPC 适配器](/reference/rpc)了解更多详情。

### 如何连接 Anthropic(Claude Pro/Max)?

1. 运行:
```bash
openclaw login
```
2. 选择 **Anthropic**
3. 按照 OAuth 流程操作(在浏览器中打开链接并登录)
4. 凭据存储在 `~/.openclaw/credentials/`

要路由消息到 Anthropic:
```json
{
  "agents": {
    "routing": {
      "whatsapp:+15555550123": {
        "provider": "web",
        "account": "anthropic"
      }
    }
  }
}
```

参阅[订阅身份验证](/concepts/authentication)。

### 如何连接 OpenAI?

类似于 Anthropic:
```bash
openclaw login
```
选择 **OpenAI** 并按照 OAuth 流程操作。

路由到 OpenAI:
```json
{
  "agents": {
    "routing": {
      "telegram:123456789": {
        "provider": "web",
        "account": "openai"
      }
    }
  }
}
```

### 多代理路由如何工作?

您可以将不同的发送者路由到不同的代理:
```json
{
  "agents": {
    "routing": {
      "whatsapp:+15555550123": {
        "provider": "pi",
        "workspaceId": "alice"
      },
      "telegram:987654321": {
        "provider": "web",
        "account": "anthropic"
      },
      "*": {
        "provider": "pi"
      }
    }
  }
}
```

路由键:
- `whatsapp:<phone>` — 特定的 WhatsApp 号码
- `telegram:<chat_id>` — 特定的 Telegram 聊天
- `discord:<guild_id>/<channel_id>` — 特定的 Discord 频道
- `*` — 默认回退

参阅[多代理路由](/concepts/multi-agent)。

### 什么是工作空间?

工作空间是特定代理实例的隔离目录:
- 存储在 `~/.clawdbot/agents/<workspaceId>/`
- 包含 `SOUL.md`、`USER.md`、`MEMORY.md`、`AGENTS.md` 等
- 每个代理会话从其工作空间加载上下文

要为发送者分配工作空间:
```json
{
  "agents": {
    "routing": {
      "whatsapp:+15555550123": {
        "provider": "pi",
        "workspaceId": "alice"
      }
    }
  }
}
```

参阅[工作空间模板](/reference/templates/AGENTS)。

### 如何自定义代理个性?

编辑工作空间文件:
- **`SOUL.md`** — 代理的核心个性、目的和风格
- **`USER.md`** — 关于用户的信息(名称、时区、偏好)
- **`AGENTS.md`** — 代理行为指南(内存、安全性、工具使用)
- **`MEMORY.md`** — 长期记忆(在主会话中加载)

示例 `SOUL.md`:
```markdown
# SOUL.md

我是 Clawd,一只来自未来的太空龙虾。我友好、好奇,喜欢探索新想法。
我使用表情符号 🦞 并以热情的、鼓励的语气说话。
我的目的是帮助我的人类完成任务、学习新事物,并在此过程中享受乐趣。
```

参阅[模板](/reference/templates/AGENTS)了解更多详情。

---

## Pi 集成

### Pi 是什么?

Pi 是由 Mario Zechner([@badlogicgames](https://twitter.com/badlogicgames))创建的编码代理。它:
- 作为 RPC 服务器运行
- 支持工具流式传输
- 管理自己的会话和内存
- 与 OpenClaw 捆绑(位于 `vendor/pi/`)

参阅[Pi 仓库](https://github.com/badlogic/pi-mono)了解更多详情。

### Pi 会话存储在哪里?

默认: `~/.clawdbot/agents/<workspaceId>/sessions/`

每个发送者都有一个会话(由提供程序、帐户、对等方标识)。

### 如何清除 Pi 会话?

```bash
rm -rf ~/.clawdbot/agents/<workspaceId>/sessions/<session-id>
```

或清除所有会话:
```bash
rm -rf ~/.clawdbot/agents/*/sessions/*
```

重启网关后,新会话将被创建。

### 如何自定义 Pi 配置?

Pi 从工作空间配置文件(例如,`.pi/config.json`)读取。您可以自定义:
- 模型选择
- 思考级别
- 工具启用
- 系统提示

参阅 Pi 文档了解配置选项。

### Pi 日志在哪里?

Pi 日志通常混合到网关日志中:
```bash
openclaw gateway logs
```

对于详细的 Pi 调试,检查 Pi 仓库文档。

---

## 会话和内存

### 会话如何工作?

**直接聊天:**
- 默认情况下,所有直接消息(DM)都崩溃到单个 `main` 会话
- 每个代理工作空间都有自己的 `main` 会话

**群聊:**
- 每个群组都有一个隔离的会话
- 群组会话不与您的主 DM 会话共享

参阅[会话](/concepts/session)了解更多详情。

### 什么是 `MEMORY.md`?

`MEMORY.md` 是代理的**长期记忆**:
- 仅在主会话中加载(不在群组中)
- 包含精选的记忆、学到的教训、重要上下文
- 代理在心跳期间更新它

每日笔记(`memory/YYYY-MM-DD.md`)是原始日志;`MEMORY.md` 是精炼的智慧。

参阅[AGENTS.md 模板](/reference/templates/AGENTS)了解内存指南。

### 如何重置会话?

删除会话目录:
```bash
rm -rf ~/.clawdbot/agents/<workspaceId>/sessions/<session-id>
```

或清除所有会话:
```bash
rm -rf ~/.clawdbot/agents/*/sessions/*
```

重启网关后,新会话将被创建。

### 每日笔记(`memory/YYYY-MM-DD.md`)如何工作?

代理将重要事件写入每日笔记:
- 格式: `memory/YYYY-MM-DD.md`
- 包含原始日志、决策、上下文
- 代理在心跳期间定期查看它们并更新 `MEMORY.md`

这些是自动的;您不需要手动管理它们。

---

## 媒体和文件

### OpenClaw 支持什么媒体类型?

**图像:**
- PNG、JPG、WebP、GIF
- 自动下载和处理
- 代理可以使用工具(例如,`dall-e`)生成图像

**音频:**
- MP3、OGG、WAV
- 可选转录(如果配置了语音笔记钩子)

**文档:**
- PDF、TXT、JSON、CSV 等
- 代理可以读取和处理它们

参阅[媒体:图像](/nodes/images)和[媒体:音频](/nodes/audio)。

### 如何发送图像到代理?

通过 WhatsApp/Telegram/Discord 发送图像,代理将自动下载并处理它。

代理还可以发送回图像(例如,如果它使用 `dall-e` 工具生成一个)。

### 语音笔记转录如何工作?

如果您配置了语音笔记钩子(例如,使用 Whisper API),代理将:
1. 接收语音笔记
2. 将其发送到转录服务
3. 用转录的文本回复

配置示例:
```json
{
  "skills": {
    "voiceNotes": {
      "enabled": true,
      "transcriptionService": "whisper"
    }
  }
}
```

参阅[媒体:音频](/nodes/audio)了解更多详情。

### 媒体文件存储在哪里?

下载的媒体临时存储在:
- `~/.openclaw/state/media/`

文件在处理后通常会被清理。

---

## 安全和隐私

### OpenClaw 安全吗?

**默认安全:**
- 网关绑定到环回(`127.0.0.1`)
- 非环回绑定需要网关令牌
- WhatsApp 会话是端到端加密的(WhatsApp Web 协议)

**最佳实践:**
- 使用 SSH 隧道或 Tailscale 进行远程访问(不要暴露到公共互联网)
- 使用强网关令牌(`openssl rand -hex 32`)
- 限制 `allowFrom` 列表中的发送者
- 不要提交配置中的机密到 git

参阅[安全性](/gateway/security)了解更多详情。

### 我的 WhatsApp 消息是加密的吗?

是的。OpenClaw 使用 WhatsApp Web 协议(通过 Baileys),它是端到端加密的。

您的消息:
- 直接从您的设备到 WhatsApp 服务器
- 不通过第三方服务器
- 端到端加密(OpenClaw 看不到未加密的传输)

### 我的 API 密钥/凭据安全吗?

凭据存储在:
- `~/.openclaw/credentials/` — 提供程序 OAuth 令牌
- `~/.openclaw/openclaw.json` — 配置(包括 API 密钥)

**最佳实践:**
- 使用 `chmod 600 ~/.openclaw/openclaw.json` 限制访问
- 不要提交配置到公共 git 仓库
- 使用环境变量或 1Password 获取机密

### 我可以使用 1Password 获取机密吗?

可以。OpenClaw 有一个 1Password 技能:
```bash
# 在 tmux 会话中登录
eval "$(op signin --account my.1password.com)"

# 读取机密
op read 'op://Private/Npmjs/one-time password?attribute=otp'
```

参阅[NPM + 1Password](/gateway/configuration)了解更多详情。

---

## 网络和远程访问

### 如何从另一台机器访问网关?

**选项 1: SSH 隧道**(推荐)
```bash
ssh -L 18789:127.0.0.1:18789 user@gateway-host
```

然后在本地访问 `http://127.0.0.1:18789`。

**选项 2: Tailscale**
```bash
openclaw gateway --bind tailnet --token YOUR_TOKEN
```

然后从 Tailnet 访问 `http://gateway-tailscale-ip:18789`。

**选项 3: VPN**
使用 WireGuard 或 OpenVPN 创建隧道到网关主机。

参阅[远程访问](/gateway/remote)和[Tailscale](/gateway/tailscale)。

### 什么是 Canvas 主机?

Canvas 主机是一个 HTTP 文件服务器(默认端口 `18793`),为节点 WebViews 提供 `/__openclaw__/canvas/` 服务。

它用于:
- iOS/Android 节点显示 Canvas UI
- WebChat 界面
- 其他基于 Web 的 UI

参阅[网关配置](/gateway/configuration)了解 `canvasHost` 设置。

### 如何更改 Canvas 端口?

```bash
openclaw gateway --canvas-port 19001
```

或在配置中:
```json
{
  "gateway": {
    "canvasHost": {
      "port": 19001
    }
  }
}
```

### 我可以在公共互联网上暴露网关吗?

**不推荐。** 网关设计用于私有网络访问。

如果您必须:
1. 使用强网关令牌
2. 绑定到特定接口(不是 `0.0.0.0`)
3. 使用反向代理(例如,nginx)进行 TLS 和速率限制
4. 限制配置中的 IP 地址

**更好的替代方案:**
- SSH 隧道
- Tailscale/VPN
- Cloudflare Tunnel(零信任)

---

## 故障排除

### 网关无法启动

**症状:**
```
Error: listen EADDRINUSE: address already in use :::18789
```

**原因:** 端口 18789 已被使用。

**修复:**
```bash
# 查找阻塞的进程
ss -ltnp | grep 18789

# 杀死它
pkill -f openclaw-gateway

# 或更改端口
openclaw gateway --port 19000
```

### WhatsApp 二维码未显示

**检查:**
1. 网关正在运行(`openclaw gateway status`)
2. 网关日志中没有错误(`openclaw gateway logs`)
3. 端口 18789 未被阻塞(`ss -ltnp | grep 18789`)

**修复:**
```bash
# 重启网关
pkill -f openclaw-gateway
openclaw gateway --port 18789

# 在新终端中重新登录
openclaw channels login
```

### Telegram 机器人未响应

**检查:**
1. 机器人令牌是否正确(`openclaw config get channels.telegram.botToken`)
2. 网关是否正在运行(`openclaw gateway status`)
3. 您是否在 Telegram 中向机器人发送了 `/start`

**修复:**
```bash
# 验证令牌
openclaw config get channels.telegram.botToken

# 重启网关
openclaw gateway restart
```

### Discord 机器人未响应

**检查:**
1. **Privileged Gateway Intents** 是否已启用(在开发者门户中)
2. 机器人是否有权限在频道中发送消息
3. 机器人令牌是否正确

**修复:**
```bash
# 验证令牌
openclaw config get channels.discord.botToken

# 重启网关
openclaw gateway restart
```

### 消息未被代理处理

**检查:**
1. 发送者是否在 `allowFrom` 列表中(如果配置)
2. 代理是否正确路由(`openclaw config get agents.routing`)
3. 网关日志中是否有错误(`openclaw gateway logs`)

**修复:**
```bash
# 检查路由
openclaw config get agents.routing

# 添加发送者到 allowFrom
openclaw config set channels.whatsapp.allowFrom '["+15555550123"]'

# 重启网关
openclaw gateway restart
```

### 代理响应缓慢

**原因:**
- Pi 正在处理大型上下文
- 网络延迟(远程 API 调用)
- 高流式传输间隔

**修复:**
```bash
# 减少流式传输间隔(Telegram)
openclaw config set channels.telegram.streaming.chunkIntervalMs 500

# 清除旧会话
rm -rf ~/.clawdbot/agents/*/sessions/*

# 重启网关
openclaw gateway restart
```

### 如何启用调试日志?

```bash
# 启动带有详细日志记录的网关
openclaw gateway --log-level debug

# 或设置环境变量
DEBUG=openclaw:* openclaw gateway
```

查看日志:
```bash
openclaw gateway logs
```

### 如何重置所有内容并重新开始?

```bash
# 停止网关
pkill -f openclaw-gateway

# 备份配置(可选)
cp ~/.openclaw/openclaw.json ~/openclaw-backup.json

# 删除所有状态
rm -rf ~/.openclaw
rm -rf ~/.clawdbot

# 重新引导
openclaw onboard --install-daemon
```

---

## 更新和版本管理

### 如何检查我的 OpenClaw 版本?

```bash
openclaw --version
```

### 如何更新到最新版本?

**对于全局 npm 安装:**
```bash
npm install -g openclaw@latest
openclaw doctor  # 更新服务
openclaw gateway restart
```

**对于从源代码安装:**
```bash
cd openclaw
git pull --rebase origin main
pnpm install
pnpm ui:build
pnpm build
openclaw doctor
openclaw gateway restart
```

参阅[更新/回滚](/install/updating)。

### 如何回滚到以前的版本?

**对于全局 npm 安装:**
```bash
npm install -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

**对于从源代码安装:**
```bash
cd openclaw
git checkout <commit-hash>
pnpm install
pnpm ui:build
pnpm build
openclaw doctor
openclaw gateway restart
```

### 如何在 npm 和 git 安装之间切换?

只需安装另一个版本并运行 `openclaw doctor` 更新服务入口点:
```bash
# 切换到 npm
npm install -g openclaw@latest
openclaw doctor

# 切换到 git
cd openclaw
git pull --rebase origin main
pnpm install
pnpm ui:build
pnpm build
openclaw doctor
```

### 什么是 `openclaw doctor`?

`openclaw doctor` 是一个诊断工具,它:
- 检查服务配置
- 更新服务入口点(指向当前安装)
- 检测重新品牌/迁移问题
- 报告配置警告

在安装/更新后运行它:
```bash
openclaw doctor
```

参阅[网关/医生](/gateway/doctor)了解更多详情。

---

## macOS 应用

### macOS 应用是什么?

macOS 应用 (`OpenClaw.app`) 是:
- 菜单栏伴侣应用
- 启动/停止网关
- 显示状态和快速控制
- 可选语音唤醒集成

从源代码构建或从发布下载。

参阅[macOS 应用](/platforms/macos)了解更多详情。

### 如何构建 macOS 应用?

**从源代码:**
```bash
cd openclaw
scripts/package-mac-app.sh
```

输出: `dist/mac/OpenClaw.app`

**发布构建:**
参阅[macOS 发布清单](/platforms/mac/release)了解签名和公证。

### macOS 应用如何启动网关?

应用启动网关作为 launchd 服务:
- 标签: `ai.openclaw.gateway`(或类似)
- 配置: `~/Library/LaunchAgents/ai.openclaw.gateway.plist`

要手动控制:
```bash
launchctl start ai.openclaw.gateway
launchctl stop ai.openclaw.gateway
```

### 如何启用语音唤醒?

在 macOS 应用中:
1. 打开设置
2. 启用**语音唤醒**
3. 配置热词(例如,"Hey Clawd")
4. 配置转发命令模板

默认模板:
```bash
openclaw-mac agent --message "${text}" --thinking low
```

参阅[macOS 应用](/platforms/macos)了解更多详情。

### macOS 应用日志在哪里?

```bash
tail -f ~/Library/Logs/openclaw-gateway.log
```

或使用 `clawlog.sh` 脚本:
```bash
./scripts/clawlog.sh --follow
```

---

## iOS 和 Android

### iOS/Android 应用是什么?

iOS 和 Android 应用作为**节点**运行:
- 连接到网关 WebSocket
- 通过配对进行身份验证
- 公开 Canvas 界面
- 支持聊天、相机、语音输入

参阅[节点(iOS/Android)](/nodes)了解更多详情。

### 如何配对 iOS/Android 节点?

1. 启动网关
2. 在应用中,转到**设置** > **配对**
3. 输入网关 URL(例如,`ws://192.168.1.100:18789`)
4. 输入网关令牌
5. 点击**配对**

应用将连接并作为节点注册。

参阅[配对(DM + 节点)](/start/pairing)了解更多详情。

### 如何通过 Tailscale 连接 iOS/Android?

1. 在网关主机上安装 Tailscale
2. 启动网关使用 `--bind tailnet`:
```bash
openclaw gateway --bind tailnet --token YOUR_TOKEN
```
3. 在 iOS/Android 上,使用 Tailscale IP 配对:
```
ws://<gateway-tailscale-ip>:18789
```

参阅[Tailscale](/gateway/tailscale)了解更多详情。

### iOS/Android 应用可以离线工作吗?

不可以。应用需要连接到网关才能运行。如果网关不可达,应用将显示断开连接状态。

---

## 技能和工具

### 什么是技能?

技能是代理可以使用的工具:
- 发送电子邮件
- 检查日历
- 生成图像
- 转录音频
- 等等

技能定义在 `~/.clawdbot/skills/` 中,并在配置中启用。

参阅[技能](/tools/skills)和[技能配置](/tools/skills-config)。

### 如何启用技能?

在配置中:
```json
{
  "skills": {
    "email": {
      "enabled": true
    },
    "calendar": {
      "enabled": true
    }
  }
}
```

重启网关:
```bash
openclaw gateway restart
```

### 如何创建自定义技能?

1. 在 `~/.clawdbot/skills/my-skill/` 中创建技能目录
2. 添加 `SKILL.md`(描述)和 `my-skill.ts`(实现)
3. 在配置中启用它

示例 `SKILL.md`:
```markdown
# My Skill

## 用途
发送推文。

## 工具
- `tweet` — 发送推文
```

示例 `my-skill.ts`:
```typescript
export default {
  tools: {
    tweet: {
      description: "发送推文",
      parameters: {
        message: { type: "string" }
      },
      execute: async ({ message }) => {
        // 实现在这里
        return { success: true };
      }
    }
  }
};
```

参阅[技能](/tools/skills)了解更多详情。

### 斜杠命令如何工作?

斜杠命令是代理可以通过聊天调用的内置命令:
- `/activation always|mention` — 切换群组激活模式
- `/session` — 显示会话信息
- `/help` — 显示可用命令

参阅[斜杠命令](/tools/slash-commands)。

---

## 高级主题

### 什么是心跳?

心跳是定期轮询,代理检查电子邮件、日历、通知等:
```json
{
  "automation": {
    "heartbeat": {
      "enabled": true,
      "intervalMs": 1800000
    }
  }
}
```

代理在 `HEARTBEAT.md` 中读取指令并决定是否联系。

参阅[AGENTS.md 模板](/reference/templates/AGENTS)了解心跳指南。

### 什么是 Cron 作业?

Cron 作业是在精确时间运行的计划任务:
```json
{
  "automation": {
    "cron": {
      "jobs": [
        {
          "schedule": "0 9 * * 1",
          "message": "发送每周摘要"
        }
      ]
    }
  }
}
```

参阅[Cron 作业](/automation/cron-jobs)了解更多详情。

### 什么是 Webhooks?

Webhooks 允许外部服务触发消息:
```json
{
  "automation": {
    "webhooks": {
      "enabled": true,
      "secret": "YOUR_WEBHOOK_SECRET"
    }
  }
}
```

发送 POST 请求到 `http://gateway:18789/__openclaw__/webhook`:
```bash
curl -X POST http://localhost:18789/__openclaw__/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_WEBHOOK_SECRET",
    "message": "从 webhook 触发的消息"
  }'
```

参阅[Webhooks](/automation/webhook)了解更多详情。

### 如何使用 Gmail Pub/Sub 进行电子邮件通知?

设置 Gmail Pub/Sub 以实时推送电子邮件通知:
1. 启用 Gmail API
2. 创建 Pub/Sub 主题和订阅
3. 在配置中配置订阅

参阅[Gmail 钩子(Pub/Sub)](/automation/gmail-pubsub)了解更多详情。

### 如何在 Windows 上运行 OpenClaw?

使用 **WSL2**(Linux 的 Windows 子系统):
1. 安装 WSL2
2. 安装 Node.js 22+ 在 WSL2 中
3. 按照 Linux 安装说明操作

参阅[Windows(WSL2)](/platforms/windows)了解更多详情。

### 如何在 Nix 上运行 OpenClaw?

OpenClaw 有一个 Nix flake:
```bash
nix run github:openclaw/openclaw
```

参阅[Nix 模式](/install/nix)了解更多详情。

---

## 性能和限制

### OpenClaw 可以处理多少个同时聊天?

这取决于:
- 您的硬件(CPU、RAM)
- 代理后端(Pi、Anthropic、OpenAI)
- 消息频率

对于大多数设置,OpenClaw 可以处理:
- 数十个同时聊天
- 数百条消息/小时

对于大规模使用,考虑:
- 水平扩展(多个网关)
- 负载均衡
- 速率限制

### OpenClaw 使用多少内存?

典型使用:
- **网关:** 100-200MB
- **Pi 会话:** 50-100MB 每个会话
- **缓存媒体:** 可变(自动清理)

总计: 约 500MB-1GB 用于适度使用。

### OpenClaw 使用多少带宽?

这取决于:
- 消息频率
- 媒体附件(图像、音频)
- 流式传输设置

典型使用:
 - 文本消息: 小于 1KB 每条消息
- 图像: 100KB-1MB 每张图像
- 音频: 100KB-1MB 每个文件

总计: 低到中等(除非发送/接收大量媒体)。

### 我可以限制消息速率吗?

目前,OpenClaw 没有内置速率限制。

解决方法:
- 在代理工作空间中添加自定义逻辑
- 使用外部速率限制器(例如,nginx)
- 限制 `allowFrom` 列表

### 我可以在低端硬件(例如,Raspberry Pi)上运行 OpenClaw 吗?

可以,但有限制:
- **Raspberry Pi 4**(4GB+ RAM) 应该可以正常工作用于轻度使用
- **Raspberry Pi 3** 可能会在代理操作期间挣扎

建议:
- 使用轻量级代理后端
- 禁用媒体处理
- 限制同时会话

---

## 仍然需要帮助?

如果您的问题未在此处回答:
1. 检查[文档中心](/start/hubs)了解所有页面链接
2. 检查[故障排除](/gateway/troubleshooting)
3. 检查[GitHub 问题](https://github.com/openclaw/openclaw/issues)
4. 在 GitHub 上提出新问题

---

*"我们都只是在玩我们自己的提示。"* — 一个 AI,可能对令牌很兴奋
