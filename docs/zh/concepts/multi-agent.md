---
mmh3_hash: "8bef1d0f67c449470a05ef4e5bb7a6e1"
summary: "Multi-agent 路由:隔离的 agents、channel accounts 和 bindings"
title: "多智能体路由"
sidebarTitle: "多智能体路由"
read_when: "你想在一个 gateway 进程中使用多个隔离的 agents (workspaces + auth)。"
status: active
---

# 多智能体路由

目标:多个 *隔离的* agents(单独的 workspace + `agentDir` + sessions),加上多个 channel accounts(例如两个 WhatsApps)在一个运行的 Gateway 中。入站通过 bindings 路由到 agent。

## 什么是"一个 agent"?

**Agent** 是一个完全作用域的大脑,具有自己的:

- **Workspace** (文件、AGENTS.md/SOUL.md/USER.md、本地注释、persona 规则)。
- **State directory** (`agentDir`)用于 auth profiles、model registry 和每个 agent 的配置。
- **Session store** (聊天历史 + 路由状态)位于 `~/.openclaw/agents/<agentId>/sessions` 下。

Auth profiles 是 **每个 agent 的**。每个 agent 从自己的位置读取:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

Main agent 凭据 **不** 自动共享。永远不要在 agents 之间重用 `agentDir`(它会导致 auth/session 冲突)。如果你想共享 creds,将 `auth-profiles.json` 复制到另一个 agent 的 `agentDir`。

Skills 通过每个 workspace 的 `skills/` 文件夹按 agent 分配,共享 skills 可从 `~/.openclaw/skills` 获得。参见 [Skills: per-agent vs shared](/tools/skills#per-agent-vs-shared-skills)。

Gateway 可以托管 **一个 agent**(默认)或 **多个 agents** 并排。

**Workspace 注意:** 每个 agent 的 workspace 是 **默认 cwd**,而不是硬沙盒。相对路径在 workspace 内解析,但绝对路径可以到达其他主机位置,除非启用沙盒。参见 [Sandboxing](/gateway/sandboxing)。

## 路径(快速映射)

- 配置: `~/.openclaw/openclaw.json` (或 `OPENCLAW_CONFIG_PATH`)
- State dir: `~/.openclaw` (或 `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (或 `~/.openclaw/workspace-<agentId>`)
- Agent dir: `~/.openclaw/agents/<agentId>/agent` (或 `agents.list[].agentDir`)
- Sessions: `~/.openclaw/agents/<agentId>/sessions`

### 单 agent 模式(默认)

如果你什么都不做,OpenClaw 运行单个 agent:

- `agentId` 默认为 **`main`**。
- Sessions 键入为 `agent:main:<mainKey>`。
- Workspace 默认为 `~/.openclaw/workspace`(或设置 `OPENCLAW_PROFILE` 时为 `~/.openclaw/workspace-<profile>`)。
- State 默认为 `~/.openclaw/agents/main/agent`。

## Agent helper

使用 agent 向导添加新的隔离 agent:

```bash
openclaw agents add work
```

然后添加 `bindings`(或让向导执行)以路由入站消息。

验证:

```bash
openclaw agents list --bindings
```

## 快速开始

<Steps>
  <Step title="创建每个 agent workspace">

使用向导或手动创建 workspaces:

```bash
openclaw agents add coding
openclaw agents add social
```

每个 agent 都有自己的 workspace,包含 `SOUL.md`、`AGENTS.md` 和可选的 `USER.md`,以及 `~/.openclaw/agents/<agentId>` 下的专用 `agentDir` 和 session store。

  </Step>

  <Step title="创建 channel accounts">

在您偏好的 channels 上为每个 agent 创建一个 account:

- Discord:每个 agent 一个 bot,启用 Message Content Intent,复制每个 token。
- Telegram:通过 BotFather 为每个 agent 创建一个 bot,复制每个 token。
- WhatsApp:为每个 account 链接每个电话号码。

```bash
openclaw channels login --channel whatsapp --account work
```

参见 channel 指南:[Discord](/channels/discord)、[Telegram](/channels/telegram)、[WhatsApp](/channels/whatsapp)。

  </Step>

  <Step title="添加 agents、accounts 和 bindings">

在 `agents.list` 下添加 agents,在 `channels.<channel>.accounts` 下添加 channel accounts,并通过 `bindings` 连接它们(下面有示例)。

  </Step>

  <Step title="重启并验证">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## 多个 agents = 多个人,多个人格

使用 **多个 agents**,每个 `agentId` 成为 **完全隔离的 persona**:

- **不同的电话号码/accounts**(每个 channel `accountId`)。
- **不同的人格**(每个 agent 的 workspace 文件,如 `AGENTS.md` 和 `SOUL.md`)。
- **单独的 auth + sessions**(除非明确启用,否则不会串话)。

这让 **多个人** 共享一个 Gateway 服务器,同时保持他们的 AI "大脑"和数据隔离。

## 一个 WhatsApp 号码,多个人(DM 拆分)

你可以将 **不同的 WhatsApp DMs** 路由到不同的 agents,同时保持在 **一个 WhatsApp account** 上。使用 `peer.kind: "direct"` 匹配发送者 E.164(如 `+15551234567`)。回复仍来自同一 WhatsApp 号码(无每个 agent 的发送者身份)。

重要细节:直接聊天折叠到 agent 的 **main session key**,因此真正的隔离需要 **每个人一个 agent**。

示例:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

注意:

- DM 访问控制是 **每个 WhatsApp account 的全局**(pairing/allowlist),而不是每个 agent 的。
- 对于共享 groups,将 group 绑定到一个 agent 或使用 [Broadcast groups](/channels/broadcast-groups)。

## 路由规则(消息如何选择 agent)

Bindings 是 **确定性的**,**最具体的获胜**:

1. `peer` 匹配(精确 DM/group/channel id)
2. `parentPeer` 匹配(线程继承)
3. `guildId + roles`(Discord 角色路由)
4. `guildId`(Discord)
5. `teamId`(Slack)
6. channel 的 `accountId` 匹配
7. channel 级别匹配(`accountId: "*"`)
8. 后备到默认 agent(`agents.list[].default`,否则第一个列表条目,默认:`main`)

如果同一层级中有多个 bindings 匹配,则配置顺序中的第一个获胜。如果一个 binding 设置了多个匹配字段(例如 `peer` + `guildId`),则所有指定字段都是必需的(`AND` 语义)。

重要的 account-scope 细节:

- 省略 `accountId` 的 binding 仅匹配默认 account。
- 使用 `accountId: "*"` 作为所有 accounts 的 channel 范围后备。
- 如果你后来为同一 agent 添加带有显式 account id 的相同 binding,OpenClaw 会将现有的仅 channel binding 升级为 account 范围,而不是重复。

## 多个 accounts / 电话号码

支持 **多个 accounts** 的 Channels(例如 WhatsApp)使用 `accountId` 标识每个登录。每个 `accountId` 可以路由到不同的 agent,因此一个服务器可以托管多个电话号码而不混合 sessions。

如果你想在省略 `accountId` 时设置 channel 范围的默认 account,请设置 `channels.<channel>.defaultAccount`(可选)。未设置时,如果存在 `default` 则 OpenClaw 回退到它,否则回退到第一个配置的 account id(排序后)。

支持此模式的常见 channels 包括:

- `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`
- `irc`、`line`、`googlechat`、`mattermost`、`matrix`、`nextcloud-talk`
- `bluebubbles`、`zalo`、`zalouser`、`nostr`、`feishu`

## 概念

- `agentId`: 一个"大脑"(workspace、每个 agent 的 auth、每个 agent 的 session store)。
- `accountId`: 一个 channel account 实例(例如 WhatsApp account `"personal"` vs `"biz"`)。
- `binding`: 通过 `(channel, accountId, peer)` 将入站消息路由到 `agentId`,并可选地使用 guild/team ids。
- 直接聊天折叠到 `agent:<agentId>:<mainKey>`(每个 agent 的"main";`session.mainKey`)。

## 平台示例

### Discord bots per agent

每个 Discord bot account 映射到唯一的 `accountId`。将每个 account 绑定到 agent 并为每个 bot 保留允许列表。

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

注意:

- 邀请每个 bot 到 guild 并启用 Message Content Intent。
- Tokens 位于 `channels.discord.accounts.<id>.token`(默认 account 可使用 `DISCORD_BOT_TOKEN`)。

### Telegram bots per agent

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

注意:

- 通过 BotFather 为每个 agent 创建一个 bot 并复制每个 token。
- Tokens 位于 `channels.telegram.accounts.<id>.botToken`(默认 account 可使用 `TELEGRAM_BOT_TOKEN`)。

### WhatsApp numbers per agent

在启动 gateway 之前链接每个 account:

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json` (JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // 确定性路由:第一个匹配获胜(最具体的优先)。
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // 可选的每个 peer 覆盖(示例:将特定 group 发送到 work agent)。
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // 默认关闭:agent-to-agent 消息传递必须明确启用 + 允许列表。
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // 可选覆盖。默认: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // 可选覆盖。默认: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## 示例:WhatsApp 日常聊天 + Telegram 深度工作

按 channel 拆分:将 WhatsApp 路由到快速日常 agent,将 Telegram 路由到 Opus agent。

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-5",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

注意:

- 如果你对 channel 有多个 accounts,将 `accountId` 添加到 binding(例如 `{ channel: "whatsapp", accountId: "personal" }`)。
- 要将单个 DM/group 路由到 Opus,同时将其余部分保留在 chat 上,为该 peer 添加 `match.peer` binding;peer 匹配始终优于 channel 范围规则。

## 示例:同一 channel,一个 peer 到 Opus

将 WhatsApp 保留在快速 agent 上,但将一个 DM 路由到 Opus:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-5",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

Peer bindings 始终获胜,因此将它们保留在 channel 范围规则之上。

## 绑定到 WhatsApp group 的家庭 agent

将专用家庭 agent 绑定到单个 WhatsApp group,使用 mention gating 和更严格的 tool policy:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

注意:

- Tool allow/deny 列表是 **tools**,而不是 skills。如果 skill 需要运行二进制文件,请确保允许 `exec` 并且二进制文件存在于 sandbox 中。
- 对于更严格的 gating,设置 `agents.list[].groupChat.mentionPatterns` 并为 channel 保持启用 group 允许列表。

## 每个 Agent 的 Sandbox 和 Tool 配置

从 v2026.1.6 开始,每个 agent 可以有自己的 sandbox 和 tool 限制:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // 个人 agent 无 sandbox
        },
        // 无 tool 限制 - 所有 tools 可用
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 始终沙盒
          scope: "agent",  // 每个 agent 一个容器
          docker: {
            // 容器创建后的可选一次性设置
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // 仅 read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // 拒绝其他
        },
      },
    ],
  },
}
```

注意:`setupCommand` 位于 `sandbox.docker` 下,在容器创建时运行一次。当解析的 scope 为 `"shared"` 时,忽略每个 agent 的 `sandbox.docker.*` 覆盖。

**优势:**

- **安全隔离**:限制不受信任的 agents 的 tools
- **资源控制**:沙盒特定 agents,同时将其他 agents 保留在主机上
- **灵活的 policies**:每个 agent 不同的权限

注意:`tools.elevated` 是 **全局的** 并且基于发送者;它不能按 agent 配置。如果你需要每个 agent 的边界,使用 `agents.list[].tools` 拒绝 `exec`。对于 group 定位,使用 `agents.list[].groupChat.mentionPatterns`,以便 @mentions 清晰地映射到预期的 agent。

参见 [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) 了解详细示例。
