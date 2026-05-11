---
mmh3_hash: "bc69775bb1cd5d29653b053dddcc2f49"
summary: "Multi-agent 路由：隔离的 agents、channel accounts 和 bindings"
title: "Multi-agent routing"
sidebarTitle: "Multi-agent routing"
read_when: "需要在一个 Gateway 进程中运行多个隔离 agents（独立 workspace + auth）。"
status: active
---

在一个运行中的 Gateway 内，运行多个_隔离的_ agent——每个都有自己的 workspace、状态目录（`agentDir`）和 session 历史——以及多个 channel 账户（例如两个 WhatsApp 号码）。入站消息通过 bindings 路由到正确的 agent。

**agent** 是完整的 per-persona 范围：workspace 文件、auth profiles、model 注册表和 session 存储。`agentDir` 是磁盘上的状态目录，保存 per-agent 配置，路径为 `~/.openclaw/agents/<agentId>/`。**binding** 将 channel 账户（如 Slack workspace 或 WhatsApp 号码）映射到其中一个 agent。

## "单个 agent"是什么？

一个 **agent** 是一个功能完整的独立大脑，拥有自己的：

- **Workspace**（文件、AGENTS.md/SOUL.md/USER.md、本地笔记、persona 规则）。
- **状态目录**（`agentDir`）用于 auth profiles、model 注册表和 per-agent 配置。
- **Session 存储**（聊天历史 + 路由状态），位于 `~/.openclaw/agents/<agentId>/sessions`。

Auth profiles 是 **per-agent** 的。每个 agent 从自己的文件中读取：

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` 也是更安全的跨 session 回溯路径：它返回有限的、经过净化的视图，而不是原始转录导出。Assistant 回溯会剥除思考标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和截断的工具调用块）、降级的工具调用脚手架、泄露的 ASCII/全角模型控制 token，以及格式错误的 MiniMax 工具调用 XML，然后再进行编辑/截断。
</Note>

<Warning>
永远不要在不同 agent 之间复用 `agentDir`（这会导致 auth/session 冲突）。当 agent 没有本地 profile 时，可以读取默认/主 agent 的 auth profiles，但 OpenClaw 不会将 OAuth refresh token 克隆到次级 agent 存储中。如果需要独立的 OAuth 账户，请从该 agent 登录；如果手动复制凭据，只复制可移植的静态 `api_key` 或 `token` profiles。
</Warning>

Skills 从每个 agent workspace 以及共享根目录（如 `~/.openclaw/skills`）加载，然后在配置了有效 agent skill 允许列表时按其过滤。使用 `agents.defaults.skills` 作为共享基线，使用 `agents.list[].skills` 进行 per-agent 替换。参见 [Skills: per-agent vs shared](/tools/skills#per-agent-vs-shared-skills) 和 [Skills: agent skill allowlists](/tools/skills#agent-skill-allowlists)。

Gateway 可以托管**单个 agent**（默认）或**多个 agent** 并行运行。

<Note>
**Workspace 说明：** 每个 agent 的 workspace 是**默认 cwd**，而非严格沙箱。相对路径在 workspace 内解析，但绝对路径可访问其他主机位置，除非启用了沙箱。参见 [Sandboxing](/gateway/sandboxing)。
</Note>

## 路径（快速对照）

- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 状态目录：`~/.openclaw`（或 `OPENCLAW_STATE_DIR`）
- Workspace：`~/.openclaw/workspace`（或 `~/.openclaw/workspace-<agentId>`）
- Agent 目录：`~/.openclaw/agents/<agentId>/agent`（或 `agents.list[].agentDir`）
- Sessions：`~/.openclaw/agents/<agentId>/sessions`

### 单 agent 模式（默认）

不做任何设置时，OpenClaw 运行单个 agent：

- `agentId` 默认为 **`main`**。
- Sessions 键为 `agent:main:<mainKey>`。
- Workspace 默认为 `~/.openclaw/workspace`（设置了 `OPENCLAW_PROFILE` 时为 `~/.openclaw/workspace-<profile>`）。
- 状态默认为 `~/.openclaw/agents/main/agent`。

## Agent 向导

使用 agent 向导添加新的隔离 agent：

```bash
openclaw agents add work
```

然后添加 `bindings`（或让向导自动处理）以路由入站消息。

使用以下命令验证：

```bash
openclaw agents list --bindings
```

## 快速开始

<Steps>
  <Step title="创建各 agent workspace">
    使用向导或手动创建 workspace：

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    每个 agent 都会获得自己的 workspace（含 `SOUL.md`、`AGENTS.md` 和可选的 `USER.md`），以及 `~/.openclaw/agents/<agentId>` 下的专用 `agentDir` 和 session 存储。

  </Step>
  <Step title="创建 channel 账户">
    在你偏好的 channel 上为每个 agent 创建一个账户：

    - Discord：每个 agent 使用一个 bot，启用 Message Content Intent，复制各自的 token。
    - Telegram：通过 BotFather 为每个 agent 创建一个 bot，复制各自的 token。
    - WhatsApp：为每个账户关联各自的手机号码。

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    参见 channel 指南：[Discord](/channels/discord)、[Telegram](/channels/telegram)、[WhatsApp](/channels/whatsapp)。

  </Step>
  <Step title="添加 agents、accounts 和 bindings">
    在 `agents.list` 下添加 agents，在 `channels.<channel>.accounts` 下添加 channel 账户，并用 `bindings` 连接它们（示例见下文）。
  </Step>
  <Step title="重启并验证">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 多 agent = 多人、多个性

使用**多个 agent** 时，每个 `agentId` 成为**完全隔离的 persona**：

- **不同的手机号/账户**（per-channel `accountId`）。
- **不同的个性**（per-agent workspace 文件，如 `AGENTS.md` 和 `SOUL.md`）。
- **独立的 auth + sessions**（除非明确启用，否则不会互通）。

这样，**多人**可以共享一个 Gateway 服务器，同时保持各自的 AI "大脑"和数据隔离。

## 跨 agent QMD 记忆搜索

如果某个 agent 需要搜索另一个 agent 的 QMD session 转录，可在 `agents.list[].memorySearch.qmd.extraCollections` 下添加额外集合。仅当每个 agent 都应继承相同的共享转录集合时，才使用 `agents.defaults.memorySearch.qmd.extraCollections`。

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // 在 workspace 内解析 -> 集合名为 "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

额外集合路径可在 agent 之间共享，但当路径在 agent workspace 之外时，集合名称需明确指定。workspace 内的路径保持 agent 范围，使每个 agent 保留自己的转录搜索集合。

## 一个 WhatsApp 号码，多人（DM 拆分）

可以将**不同的 WhatsApp DM**路由到不同的 agent，同时使用**同一个 WhatsApp 账户**。通过 `peer.kind: "direct"` 匹配发件人 E.164 号码（如 `+15551234567`）。回复仍来自同一个 WhatsApp 号码（没有 per-agent 的发件人身份）。

<Note>
私信会折叠到 agent 的**主 session 键**，因此真正的隔离需要**每人一个 agent**。
</Note>

示例：

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

注意事项：

- DM 访问控制是**全局 per WhatsApp 账户**的（配对/允许列表），而非 per agent。
- 对于共享群组，将群组绑定到一个 agent 或使用 [广播群组](/channels/broadcast-groups)。

## 路由规则（消息如何选择 agent）

Bindings 是**确定性的**，遵循**最具体优先**原则：

<Steps>
  <Step title="peer 匹配">
    精确的 DM/group/channel id。
  </Step>
  <Step title="parentPeer 匹配">
    线程继承。
  </Step>
  <Step title="guildId + roles">
    Discord 角色路由。
  </Step>
  <Step title="guildId">
    Discord。
  </Step>
  <Step title="teamId">
    Slack。
  </Step>
  <Step title="channel 的 accountId 匹配">
    Per-account 回退。
  </Step>
  <Step title="Channel 级别匹配">
    `accountId: "*"`。
  </Step>
  <Step title="默认 agent">
    回退到 `agents.list[].default`，否则第一个列表条目，默认：`main`。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="平局处理和 AND 语义">
    - 如果同一层级有多个 binding 匹配，按配置顺序第一个获胜。
    - 如果一个 binding 设置了多个匹配字段（例如 `peer` + `guildId`），所有指定字段都是必须的（AND 语义）。

  </Accordion>
  <Accordion title="Account 范围详情">
    - 省略 `accountId` 的 binding 仅匹配默认账户。
    - 使用 `accountId: "*"` 作为跨所有账户的 channel 级别回退。
    - 如果稍后为同一 agent 添加带有明确 account id 的相同 binding，OpenClaw 会将现有的 channel 级别 binding 升级为 account 范围的，而不是重复添加。

  </Accordion>
</AccordionGroup>

## 多账户 / 多手机号

支持**多账户**的 channel（如 WhatsApp）使用 `accountId` 标识每个登录。每个 `accountId` 可以路由到不同的 agent，因此一台服务器可以托管多个手机号码而不会混淆 sessions。

如果希望在省略 `accountId` 时有 channel 级别的默认账户，可设置 `channels.<channel>.defaultAccount`（可选）。未设置时，如果存在 `default` 则回退到它，否则使用第一个已配置的 account id（按排序）。

支持此模式的常见 channel 包括：

- `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`
- `irc`、`line`、`googlechat`、`mattermost`、`matrix`、`nextcloud-talk`
- `zalo`、`zalouser`、`nostr`、`feishu`

## 概念

- `agentId`：一个"大脑"（workspace、per-agent auth、per-agent session 存储）。
- `accountId`：一个 channel 账户实例（例如 WhatsApp 账户 `"personal"` 与 `"biz"`）。
- `binding`：通过 `(channel, accountId, peer)` 以及可选的 guild/team id 将入站消息路由到 `agentId`。
- 私信折叠到 `agent:<agentId>:<mainKey>`（per-agent 的"main"；`session.mainKey`）。

## 平台示例

<AccordionGroup>
  <Accordion title="每个 agent 一个 Discord bot">
    每个 Discord bot 账户映射到唯一的 `accountId`。将每个账户绑定到一个 agent 并为每个 bot 保留允许列表。

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

    - 将每个 bot 邀请到 guild 并启用 Message Content Intent。
    - Token 位于 `channels.discord.accounts.<id>.token`（默认账户可使用 `DISCORD_BOT_TOKEN`）。

  </Accordion>
  <Accordion title="每个 agent 一个 Telegram bot">
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

    - 通过 BotFather 为每个 agent 创建一个 bot，并复制各自的 token。
    - Token 位于 `channels.telegram.accounts.<id>.botToken`（默认账户可使用 `TELEGRAM_BOT_TOKEN`）。

  </Accordion>
  <Accordion title="每个 agent 一个 WhatsApp 号码">
    在启动 Gateway 之前关联每个账户：

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json`（JSON5）：

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

      // 确定性路由：最先匹配获胜（最具体的放前面）。
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // 可选的 per-peer 覆盖（示例：将特定群组发送到 work agent）。
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // 默认关闭：agent 间通信必须明确启用 + 加入允许列表。
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
              // 可选覆盖。默认：~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // 可选覆盖。默认：~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## 常见模式

<Tabs>
  <Tab title="WhatsApp 日常 + Telegram 深度工作">
    按 channel 拆分：将 WhatsApp 路由到快速日常 agent，Telegram 路由到 Opus agent。

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
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

    注意事项：

    - 如果一个 channel 有多个账户，在 binding 中添加 `accountId`（例如 `{ channel: "whatsapp", accountId: "personal" }`）。
    - 要将单个 DM/群组路由到 Opus 而其余保留在 chat，添加针对该 peer 的 `match.peer` binding；peer 匹配始终优先于 channel 级别规则。

  </Tab>
  <Tab title="同一 channel，单个 peer 路由到 Opus">
    保持 WhatsApp 使用快速 agent，但将一个 DM 路由到 Opus：

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
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

    Peer bindings 始终获胜，所以将它们放在 channel 级别规则之上。

  </Tab>
  <Tab title="家庭 agent 绑定到 WhatsApp 群组">
    将专用的家庭 agent 绑定到单个 WhatsApp 群组，添加 mention 门控和更严格的工具策略：

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

    注意事项：

    - 工具允许/拒绝列表是**工具**，不是 skills。如果 skill 需要运行二进制文件，确保 `exec` 被允许且二进制文件存在于沙箱中。
    - 要实现更严格的门控，设置 `agents.list[].groupChat.mentionPatterns` 并为 channel 保持群组允许列表启用。

  </Tab>
</Tabs>

## Per-agent 沙箱和工具配置

每个 agent 可以有自己的沙箱和工具限制：

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // 个人 agent 不使用沙箱
        },
        // 无工具限制 - 所有工具可用
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 始终沙箱化
          scope: "agent",  // 每个 agent 一个容器
          docker: {
            // 容器创建后的可选一次性设置
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // 只允许 read 工具
          deny: ["exec", "write", "edit", "apply_patch"],    // 拒绝其他
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` 位于 `sandbox.docker` 下，在容器创建时运行一次。当解析的范围为 `"shared"` 时，per-agent 的 `sandbox.docker.*` 覆盖会被忽略。
</Note>

**优势：**

- **安全隔离**：限制不受信任 agent 的工具访问。
- **资源控制**：对特定 agent 使用沙箱，同时其他 agent 保留在宿主机上。
- **灵活策略**：每个 agent 可有不同的权限。

<Note>
`tools.elevated` 是**全局**的，基于发件人；它不可按 agent 配置。如果需要 per-agent 边界，使用 `agents.list[].tools` 拒绝 `exec`。对于群组定向，使用 `agents.list[].groupChat.mentionPatterns` 以便 @mention 能干净地映射到目标 agent。
</Note>

参见 [Multi-agent sandbox and tools](/tools/multi-agent-sandbox-tools) 获取详细示例。

## 相关

- [ACP agents](/tools/acp-agents) — 运行外部编码 harnesses
- [Channel routing](/channels/channel-routing) — 消息如何路由到 agents
- [Presence](/concepts/presence) — agent 在线状态和可用性
- [Session](/concepts/session) — session 隔离和路由
- [Sub-agents](/tools/subagents) — 派生后台 agent 运行
