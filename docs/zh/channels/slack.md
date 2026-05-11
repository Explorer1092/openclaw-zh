---
mmh3_hash: "4e139e7fe5757a5444726c1bb142b829"
summary: "Slack 设置和运行时行为（Socket Mode + HTTP Request URLs）"
read_when:
  - 设置 Slack 或调试 Slack socket/HTTP 模式
title: "Slack"
---

通过 Slack 应用集成支持私信和 Channel，生产环境可用。默认模式为 Socket Mode；同时支持 HTTP Request URLs。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    Slack 私信默认使用配对模式。
  </Card>
  <Card title="Slash 命令" icon="terminal" href="/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="Channel 故障排除" icon="wrench" href="/channels/troubleshooting">
    跨 Channel 诊断和修复手册。
  </Card>
</CardGroup>

## 选择 Socket Mode 还是 HTTP Request URLs

两种传输方式均可用于生产环境，在消息传递、slash 命令、App Home 和交互性方面功能相同。请根据部署方式选择，而非功能需求。

| 考量因素                   | Socket Mode（默认）                                                              | HTTP Request URLs                                                                                |
| -------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 公共 Gateway URL           | 不需要                                                                           | 需要（DNS、TLS、反向代理或隧道）                                                                 |
| 出站网络                   | `wss-primary.slack.com` 的出站 WSS 必须可达                                      | 无出站 WS；仅入站 HTTPS                                                                          |
| 所需 Token                 | Bot token（`xoxb-...`）+ 带 `connections:write` 的 App-Level Token（`xapp-...`） | Bot token（`xoxb-...`）+ Signing Secret                                                          |
| 开发笔记本/防火墙后         | 开箱即用                                                                         | 需要公共隧道（ngrok、Cloudflare Tunnel、Tailscale Funnel）或暂存 Gateway                          |
| 水平扩展                   | 每个应用每台主机一个 Socket Mode 会话；多个 Gateway 需要独立的 Slack 应用          | 无状态 POST 处理器；多个 Gateway 副本可以在负载均衡器后共享一个应用                               |
| 单 Gateway 多账户          | 支持；每个账户打开自己的 WS                                                      | 支持；每个账户需要唯一的 `webhookPath`（默认 `/slack/events`）以避免注册冲突                      |
| Slash 命令传输             | 通过 WS 连接传递；`slash_commands[].url` 被忽略                                  | Slack POST 到 `slash_commands[].url`；字段是命令派发必需的                                       |
| 请求签名                   | 不使用（认证是 App-Level Token）                                                 | Slack 签署每个请求；OpenClaw 使用 `signingSecret` 验证                                           |
| 连接断开后恢复              | Slack SDK 自动重连；Gateway 的 pong-timeout 传输调优适用                          | 无需持久连接；重试来自 Slack 的每次请求                                                           |

<Note>
  **选择 Socket Mode**：适合单 Gateway 主机、开发笔记本和可以出站访问 `*.slack.com` 但无法接受入站 HTTPS 的内网。

**选择 HTTP Request URLs**：适合在负载均衡器后运行多个 Gateway 副本时，出站 WSS 被阻止但入站 HTTPS 允许时，或已在反向代理终止 Slack webhook 时。
</Note>

## 快速设置

<Tabs>
  <Tab title="Socket Mode（默认）">
    <Steps>
      <Step title="创建新的 Slack 应用">
        打开 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 选择工作区 → 粘贴下方 manifest → **Next** → **Create**。

        <CodeGroup>

```json 推荐
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

```json 最小化
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **推荐** 匹配内置 Slack 插件的完整功能集：App Home、slash 命令、文件、reactions、pins、群组私信和 emoji/usergroup 读取。当工作区策略限制 scope 时选择**最小化**——它涵盖私信、Channel/群组历史、提及和 slash 命令，但不包含文件、reactions、pins、群组私信（`mpim:*`）、`emoji:read` 和 `usergroups:read`。参见 [Manifest 和权限检查清单](#manifest-and-scope-checklist) 了解各 scope 说明及附加选项。
        </Note>

        Slack 创建应用后：

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**：添加 `connections:write`，保存并复制 `xapp-...` 值。
        - **Install App → Install to Workspace**：复制 `xoxb-...` Bot User OAuth Token。

      </Step>

      <Step title="配置 OpenClaw">

        推荐的 SecretRef 设置：

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        环境变量回退（仅默认账户）：

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="启动 Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="创建新的 Slack 应用">
        打开 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 选择工作区 → 粘贴下方 manifest → 将 `https://gateway-host.example.com/slack/events` 替换为您的公共 Gateway URL → **Next** → **Create**。

        <CodeGroup>

```json 推荐
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

```json 最小化
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

        </CodeGroup>

        <Note>
          **推荐** 匹配内置 Slack 插件的完整功能集；**最小化** 为受限工作区删除了文件、reactions、pins、群组私信（`mpim:*`）、`emoji:read` 和 `usergroups:read`。参见 [Manifest 和权限检查清单](#manifest-and-scope-checklist) 了解各 scope 说明。
        </Note>

        <Info>
          三个 URL 字段（`slash_commands[].url`、`event_subscriptions.request_url` 和 `interactivity.request_url` / `message_menu_options_url`）均指向同一个 OpenClaw 端点。Slack 的 manifest schema 要求分别命名，但 OpenClaw 按负载类型路由，因此单个 `webhookPath`（默认 `/slack/events`）已足够。HTTP 模式下没有 `slash_commands[].url` 的 slash 命令将静默失效。
        </Info>

        Slack 创建应用后：

        - **Basic Information → App Credentials**：复制 **Signing Secret** 用于请求验证。
        - **Install App → Install to Workspace**：复制 `xoxb-...` Bot User OAuth Token。

      </Step>

      <Step title="配置 OpenClaw">

        推荐的 SecretRef 设置：

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        多账户 HTTP 请使用唯一的 webhook 路径

        为每个账户提供不同的 `webhookPath`（默认 `/slack/events`）以避免注册冲突。
        </Note>

      </Step>

      <Step title="启动 Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode 传输调优

OpenClaw 默认将 Slack SDK 客户端 pong 超时设置为 15 秒用于 Socket Mode。仅当需要针对工作区或主机进行特定调优时才覆盖传输设置：

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

仅在 Socket Mode 工作区日志记录 Slack websocket pong/server-ping 超时或在已知事件循环饥饿的主机上运行时使用此配置。`clientPingTimeout` 是 SDK 发送客户端 ping 后等待 pong 的时间；`serverPingTimeout` 是等待 Slack 服务器 ping 的时间。应用消息和事件是应用状态，而非传输活跃性信号。

## Manifest 和权限检查清单

Socket Mode 和 HTTP Request URLs 使用相同的 Slack 应用 manifest 基础。只有 `settings` 块（以及 slash 命令 `url`）不同。

基础 manifest（Socket Mode 默认）：

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

对于 **HTTP Request URLs 模式**，将 `settings` 替换为 HTTP 变体并向每个 slash 命令添加 `url`。需要公共 URL：

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### 附加 manifest 设置

扩展上述默认值的不同功能。

默认 manifest 启用 Slack App Home **Home** 标签并订阅 `app_home_opened`。当工作区成员打开 Home 标签时，OpenClaw 使用 `views.publish` 发布一个安全的默认 Home 视图；不包含对话负载或私有配置。**Messages** 标签保持启用以用于 Slack 私信。

<AccordionGroup>
  <Accordion title="可选原生 slash 命令">

    可以使用多个[原生 slash 命令](#commands-and-slash-behavior)替代单个配置的命令：

    - 使用 `/agentstatus` 而不是 `/status`，因为 `/status` 命令是保留命令。
    - 同时最多可以提供 25 个 slash 命令。

    将现有的 `features.slash_commands` 部分替换为[可用命令](/tools/slash-commands#command-list)的子集：

    <Tabs>
      <Tab title="Socket Mode（默认）">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        使用与 Socket Mode 相同的 `slash_commands` 列表，并向每个条目添加 `"url": "https://gateway-host.example.com/slack/events"`。
      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="可选写操作权限（authorship scopes）">
    如果您希望出站消息使用活动 Agent 身份（自定义 username 和图标）而不是默认 Slack 应用身份，请添加 `chat:write.customize` bot 权限。

    如果使用 emoji 图标，Slack 期望 `:emoji_name:` 语法。

  </Accordion>
  <Accordion title="可选 user-token 权限（读取操作）">
    如果您配置了 `channels.slack.userToken`，典型的读取权限为：

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（如果依赖 Slack 搜索读取）

  </Accordion>
</AccordionGroup>

## Token 模型

- Socket Mode 需要 `botToken` + `appToken`。
- HTTP 模式需要 `botToken` + `signingSecret`。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受明文字符串或 SecretRef 对象。
- 配置中的 token 会覆盖环境变量回退。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 环境变量回退仅适用于默认账户。
- `userToken`（`xoxp-...`）仅在配置中设置（无环境变量回退），默认为只读行为（`userTokenReadOnly: true`）。

状态快照行为：

- Slack 账户检查跟踪每个凭据的 `*Source` 和 `*Status` 字段（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 状态为 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示账户通过 SecretRef 或其他非内联密钥来源配置，但当前命令/运行时路径无法解析实际值。
- 在 HTTP 模式下，包含 `signingSecretStatus`；在 Socket Mode 下，必需对为 `botTokenStatus` + `appTokenStatus`。

<Tip>
对于操作/目录读取，配置了 user token 时可以优先使用。对于写入，bot token 仍然优先；仅当 `userTokenReadOnly: false` 且 bot token 不可用时才允许 user-token 写入。
</Tip>

## 操作和门控

Slack 操作通过 `channels.slack.actions.*` 控制。

当前 Slack 工具中可用的操作组：

| 组         | 默认 |
| ---------- | ---- |
| messages   | 启用 |
| reactions  | 启用 |
| pins       | 启用 |
| memberInfo | 启用 |
| emojiList  | 启用 |

当前 Slack 消息操作包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。`download-file` 接受入站文件占位符中显示的 Slack 文件 ID，并返回图片的图像预览或其他文件类型的本地文件元数据。

## 访问控制和路由

<Tabs>
  <Tab title="私信策略">
    `channels.slack.dmPolicy` 控制私信访问（旧版：`channels.slack.dm.policy`）：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `channels.slack.allowFrom` 包含 `"*"`；旧版：`channels.slack.dm.allowFrom`）
    - `disabled`

    私信标志：

    - `dm.enabled`（默认 true）
    - `channels.slack.allowFrom`（推荐）
    - `dm.allowFrom`（旧版）
    - `dm.groupEnabled`（群组私信默认 false）
    - `dm.groupChannels`（可选 MPIM allowlist）

    多账户优先级：

    - `channels.slack.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 命名账户在未设置自身 `allowFrom` 时继承 `channels.slack.allowFrom`。
    - 命名账户不继承 `channels.slack.accounts.default.allowFrom`。

    私信配对使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="Channel 策略">
    `channels.slack.groupPolicy` 控制 Channel 处理：

    - `open`
    - `allowlist`
    - `disabled`

    Channel allowlist 位于 `channels.slack.channels`，**必须使用稳定的 Slack Channel ID**（例如 `C12345678`）作为配置键。

    运行时注意：如果完全没有 `channels.slack`（仅环境变量设置），运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy`）。

    名称/ID 解析：

    - 在启动时解析 Channel allowlist 条目和私信 allowlist 条目（当 token 访问允许时）
    - 未解析的 Channel 名称条目保持配置状态，但默认情况下路由时被忽略
    - 入站授权和 Channel 路由默认以 ID 为优先；直接 username/slug 匹配需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    基于名称的键（`#channel-name` 或 `channel-name`）在 `groupPolicy: "allowlist"` 下**不会**匹配。Channel 查找默认以 ID 为优先，因此基于名称的键永远无法成功路由，该 Channel 中的所有消息将被静默屏蔽。这与 `groupPolicy: "open"` 不同，在 open 策略下 Channel 键不是路由必需的，基于名称的键看起来可以工作。

    始终使用 Slack Channel ID 作为键。查找方式：在 Slack 中右键点击 Channel → **Copy link** — URL 末尾的 `C...` 即为 ID。

    正确：

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    错误（在 `groupPolicy: "allowlist"` 下静默屏蔽）：

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="提及和 Channel 用户">
    Channel 消息默认需要提及才能触发。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - Slack 用户组提及（`<!subteam^S...>`），当 bot 用户是该用户组成员时；需要 `usergroups:read`
    - 提及正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 隐式回复-bot-线程行为（当 `thread.requireExplicitMention` 为 `true` 时禁用）

    按 Channel 控制（`channels.slack.channels.<id>`；名称仅通过启动解析或 `dangerouslyAllowNameMatching`）：

    - `requireMention`
    - `users`（allowlist）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 键格式：`id:`、`e164:`、`username:`、`name:` 或 `"*"` 通配符
      （旧版无前缀键仍映射到 `id:` 匹配）

    `allowBots` 对 Channel 和私有 Channel 较为保守：仅当发送 bot 明确列在该聊天室的 `users` allowlist 中，或 `channels.slack.allowFrom` 中至少一个显式 Slack owner ID 当前是聊天室成员时，才接受 bot 发送的聊天室消息。通配符和显示名称 owner 条目不满足 owner 在线条件。Owner 在线检查使用 Slack `conversations.members`；请确保应用具有对应聊天室类型的读取 scope（公开 Channel 为 `channels:read`，私有 Channel 为 `groups:read`）。如果成员查找失败，OpenClaw 会丢弃该 bot 发送的聊天室消息。

  </Tab>
</Tabs>

## 线程、Session 和回复标签

- 私信路由为 `direct`；Channel 路由为 `channel`；MPIM 路由为 `group`。
- Slack 路由绑定接受原始对等 ID 以及 Slack 目标形式，例如 `channel:C12345678`、`user:U12345678` 和 `<@U12345678>`。
- 使用默认 `session.dmScope=main` 时，Slack 私信合并到 Agent 主 Session。
- Channel Session：`agent:<agentId>:slack:channel:<channelId>`。
- 线程回复可以在适用时创建线程 Session 后缀（`:thread:<threadTs>`）。
- 在 OpenClaw 处理顶层消息且不需要显式提及的 Channel 中，非 `off` 的 `replyToMode` 会将每个处理的根消息路由到 `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`，这样可见的 Slack 线程从第一轮起就映射到一个 OpenClaw Session。
- `channels.slack.thread.historyScope` 默认为 `thread`；`thread.inheritParent` 默认为 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程 Session 启动时获取多少现有线程消息（默认 `20`；设置 `0` 禁用）。
- `channels.slack.thread.requireExplicitMention`（默认 `false`）：当为 `true` 时，抑制隐式线程提及，使 bot 仅在线程内响应显式 `@bot` 提及，即使 bot 已参与该线程。没有此项时，bot 已参与的线程中的回复会绕过 `requireMention` 门控。

回复线程控制：

- `channels.slack.replyToMode`：`off|first|all|batched`（默认 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 设置
- 私聊的旧版回退：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

对于 `message` 工具中显式的 Slack 线程回复，在 `action: "send"` 中设置 `replyBroadcast: true` 并附带 `threadId` 或 `replyTo`，可以要求 Slack 同时将线程回复广播到父 Channel。这映射到 Slack 的 `chat.postMessage` `reply_broadcast` 标志，仅支持文本或 Block Kit 发送，不支持媒体上传。

当 `message` 工具调用在 Slack 线程内运行且目标为同一 Channel 时，OpenClaw 通常根据 `replyToMode` 继承当前 Slack 线程。在 `action: "send"` 或 `action: "upload-file"` 上设置 `topLevel: true` 可强制创建新的父 Channel 消息。`threadId: null` 作为同样的顶层退出选项也被接受。

<Note>
`replyToMode="off"` 禁用 Slack 中**所有**回复线程，包括显式 `[[reply_to_*]]` 标签。这与 Telegram 不同，在 Telegram 中显式标签在 `"off"` 模式下仍然有效。Slack 线程会将消息从 Channel 中隐藏，而 Telegram 回复在主聊天流中仍然可见。
</Note>

## 确认 Reaction

`ackReaction` 在 OpenClaw 处理入站消息时发送确认 emoji。

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Agent 身份 emoji 回退（`agents.list[].identity.emoji`，否则 "👀"）

注意：

- Slack 期望 shortcode（例如 `"eyes"`）。
- 使用 `""` 禁用 Slack 账户或全局的 reaction。

## 文本流式传输

`channels.slack.streaming` 控制实时预览行为：

- `off`：禁用实时预览流式传输。
- `partial`（默认）：用最新的部分输出替换预览文本。
- `block`：以分块预览更新追加。
- `progress`：生成时显示进度状态文本，然后发送最终文本。
- `streaming.preview.toolProgress`：当草稿预览处于活动状态时，将工具/进度更新路由到同一已编辑预览消息（默认：`true`）。设置 `false` 保留单独的工具/进度消息。
- `streaming.preview.commandText` / `streaming.progress.commandText`：设置为 `status` 可在保留紧凑工具进度行的同时隐藏原始命令/exec 文本（默认：`raw`）。

隐藏原始命令/exec 文本同时保留紧凑进度行：

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

`channels.slack.streaming.nativeTransport` 控制当 `channels.slack.streaming.mode` 为 `partial` 时的 Slack 原生文本流式传输（默认：`true`）。

- 必须有可用的回复线程才能显示原生文本流式传输和 Slack assistant 线程状态。线程选择仍遵循 `replyToMode`。
- Channel 和群聊根仍然可以在原生流式传输不可用时使用正常草稿预览。
- 顶级 Slack 私信默认不在线程中，因此不会显示线程式预览；如果需要在那里显示进度，请使用线程回复或 `typingReaction`。
- 媒体和非文本负载回退到正常传递。
- 媒体/错误最终值取消待处理的预览编辑；符合条件的文本/块最终值仅在能够就地编辑预览时才刷新。
- 如果流式传输在回复中途失败，OpenClaw 对剩余负载回退到正常传递。

使用草稿预览而非 Slack 原生文本流式传输：

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

旧版键：

- `channels.slack.streamMode`（`replace | status_final | append`）是 `channels.slack.streaming.mode` 的旧版运行时别名。
- 布尔值 `channels.slack.streaming` 是 `channels.slack.streaming.mode` 和 `channels.slack.streaming.nativeTransport` 的旧版运行时别名。
- 旧版 `channels.slack.nativeStreaming` 是 `channels.slack.streaming.nativeTransport` 的运行时别名。
- 运行 `openclaw doctor --fix` 可将持久化的 Slack streaming 配置重写为规范键。

## 输入 Reaction 回退

`typingReaction` 在 OpenClaw 处理回复时，向入站 Slack 消息添加临时 reaction，运行完成后再移除。这在线程回复之外最为有用，线程回复使用默认的"正在输入..."状态指示器。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意：

- Slack 期望 shortcode（例如 `"hourglass_flowing_sand"`）。
- Reaction 是尽力而为的，回复或失败路径完成后会自动尝试清理。

## 媒体、分块和传递

<AccordionGroup>
  <Accordion title="入站附件">
    Slack 文件附件从 Slack 托管的私有 URL 下载（token 认证请求流）并在获取成功且大小限制允许时写入媒体存储。文件占位符包含 Slack `fileId`，以便 Agent 可以使用 `download-file` 获取原始文件。

    下载使用有界的空闲超时和总超时。如果 Slack 文件获取停滞或失败，OpenClaw 继续处理消息并回退到文件占位符。

    运行时入站大小上限默认为 `20MB`，除非通过 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="出站文本和文件">
    - 文本块使用 `channels.slack.textChunkLimit`（默认 4000）
    - `channels.slack.chunkMode="newline"` 启用段落优先分割
    - 文件发送使用 Slack 上传 API 且可以包含线程回复（`thread_ts`）
    - 出站媒体上限遵循配置的 `channels.slack.mediaMaxMb`；否则 Channel 发送使用媒体管道的 MIME 类型默认值
  </Accordion>

  <Accordion title="传递目标">
    推荐的显式目标：

    - `user:<id>` 用于私信
    - `channel:<id>` 用于 Channel

    纯文本/block 的 Slack 私信可以直接发送到用户 ID；文件上传和带线程的发送需要先通过 Slack conversation API 打开私信，因为这些路径需要具体的 conversation ID。

  </Accordion>
</AccordionGroup>

## 命令和 slash 行为

Slash 命令在 Slack 中以单个配置命令或多个原生命令的形式出现。通过 `channels.slack.slashCommand` 配置命令默认值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生命令需要 Slack 应用中的[附加 manifest 设置](#additional-manifest-settings)，并通过 `channels.slack.commands.native: true` 或全局配置中的 `commands.native: true` 启用。

- Slack 的原生命令自动模式默认**关闭**，因此 `commands.native: "auto"` 不会启用 Slack 原生命令。

```txt
/help
```

原生参数菜单使用自适应渲染策略，在派发所选选项值之前显示确认对话框：

- 最多 5 个选项：按钮块
- 6-100 个选项：静态选择菜单
- 超过 100 个选项：当 interactivity 选项处理器可用时使用带异步选项过滤的外部选择
- 超过 Slack 限制：编码的选项值回退到按钮

```txt
/think
```

Slash Session 使用隔离的键（如 `agent:<agentId>:slack:slash:<userId>`），并使用 `CommandTargetSessionKey` 将命令执行路由到目标对话 Session。

## 交互式回复

Slack 可以渲染 Agent 编写的交互式回复控件，但此功能默认禁用。

全局启用：

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

或仅为一个 Slack 账户启用：

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

启用后，Agent 可以发出 Slack 专用回复指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

这些指令编译为 Slack Block Kit，并将点击或选择路由回现有的 Slack 交互事件路径。

注意：

- 这是 Slack 专用 UI。其他 Channel 不会将 Slack Block Kit 指令转换为自己的按钮系统。
- 交互式回调值是 OpenClaw 生成的不透明 token，而不是 Agent 编写的原始值。
- 如果生成的交互式块会超过 Slack Block Kit 限制，OpenClaw 会回退到原始文本回复，而不是发送无效的 blocks 负载。

## Slack 中的 Exec 批准

Slack 可以作为具有交互式按钮和交互的原生批准客户端，而不必回退到 Web UI 或终端。

- Exec 批准使用 `channels.slack.execApprovals.*` 进行原生私信/Channel 路由。
- 当请求已落入 Slack 且批准 id 类型为 `plugin:` 时，Plugin 批准仍可通过相同的 Slack 原生按钮界面解决。
- 批准者授权仍然强制执行：只有被识别为批准者的用户才能通过 Slack 批准或拒绝请求。

这使用与其他 Channel 相同的共享批准按钮界面。当您的 Slack 应用设置中启用了 `interactivity` 时，批准提示直接在对话中渲染为 Block Kit 按钮。当这些按钮存在时，它们是主要的批准 UX；仅当工具结果表明聊天批准不可用或手动批准是唯一路径时，OpenClaw 才应包含手动 `/approve` 命令。

配置路径：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（可选；当可能时回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `agentFilter`、`sessionFilter`

当 `enabled` 未设置或为 `"auto"` 且至少一个批准者解析时，Slack 自动启用原生 exec 批准。设置 `enabled: false` 显式禁用 Slack 作为原生批准客户端。设置 `enabled: true` 在批准者解析时强制启用原生批准。

没有显式 Slack exec 批准配置时的默认行为：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

仅当您要覆盖批准者、添加过滤器或选择启用源聊天传递时，才需要显式 Slack 原生配置：

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

共享 `approvals.exec` 转发是单独的。仅当 exec 批准提示还必须路由到其他聊天或显式带外目标时才使用它。共享 `approvals.plugin` 转发也是单独的；当这些请求已落入 Slack 时，Slack 原生按钮仍可解决 Plugin 批准。

Slack Channel 和私信中同样支持同聊天 `/approve`（已支持命令的）。参见 [Exec approvals](/tools/exec-approvals) 了解完整的批准转发模型。

## 事件和操作行为

- 消息编辑/删除映射到系统事件。
- 线程广播（"Also send to channel"线程回复）作为普通用户消息处理。
- Reaction 添加/移除事件映射到系统事件。
- 成员加入/离开、Channel 创建/重命名、置顶添加/移除事件映射到系统事件。
- `channel_id_changed` 可以在 `configWrites` 启用时迁移 Channel 配置键。
- Channel 主题/目的元数据被视为不可信上下文，可以注入到路由上下文中。
- 线程启动者和初始线程历史上下文种子在适用时通过配置的发送者 allowlist 过滤。
- Block actions 和 modal 交互触发结构化的 `Slack interaction: ...` 系统事件，包含丰富的负载字段：
  - block actions：所选值、标签、选择器值和 `workflow_*` 元数据
  - modal `view_submission` 和 `view_closed` 事件，包含路由 Channel 元数据和表单输入

## 配置参考

主要参考：[配置参考 - Slack](/gateway/config-channels#slack)。

<Accordion title="重点 Slack 字段">

- 模式/认证：`mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- 私信访问：`dm.enabled`、`dmPolicy`、`allowFrom`（旧版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 兼容性开关：`dangerouslyAllowNameMatching`（紧急模式；非必要保持关闭）
- Channel 访问：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
- 线程/历史：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 传递：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- unfurl：`unfurlLinks`、`unfurlMedia` 用于 `chat.postMessage` 链接/媒体预览控制
- 操作/功能：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## 故障排除

<AccordionGroup>
  <Accordion title="Channel 中没有回复">
    按顺序检查：

    - `groupPolicy`
    - Channel allowlist（`channels.slack.channels`）——**键必须是 Channel ID**（`C12345678`），不能是名称（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，基于名称的键会静默失败，因为 Channel 路由默认以 ID 为优先。查找 ID 方式：在 Slack 中右键点击 Channel → **Copy link** — URL 末尾的 `C...` 即为 Channel ID。
    - `requireMention`
    - 按 Channel `users` allowlist

    有用的命令：

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="私信被忽略">
    检查：

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（或旧版 `channels.slack.dm.policy`）
    - 配对批准 / allowlist 条目
    - Slack Assistant 私信事件：verbose 日志中提及 `drop message_changed` 通常意味着 Slack 发送了一个没有可恢复的人类发送者的已编辑 Assistant 线程事件

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode 未连接">
    验证 bot + app token 以及 Slack 应用设置中的 Socket Mode 启用状态。

    如果 `openclaw channels status --probe --json` 显示 `botTokenStatus` 或 `appTokenStatus: "configured_unavailable"`，Slack 账户已配置但当前运行时无法解析 SecretRef 支持的值。

  </Accordion>

  <Accordion title="HTTP 模式未接收事件">
    验证：

    - signing secret
    - Webhook 路径
    - Slack Request URL（Events + Interactivity + Slash Commands）
    - 每个 HTTP 账户唯一的 `webhookPath`

    如果账户快照中出现 `signingSecretStatus: "configured_unavailable"`，说明 HTTP 账户已配置但当前运行时无法解析 SecretRef 支持的 signing secret。

  </Accordion>

  <Accordion title="原生/slash 命令未触发">
    验证您是否想要：

    - 原生命令模式（`channels.slack.commands.native: true`）并在 Slack 中注册匹配的 slash 命令
    - 或单个 slash 命令模式（`channels.slack.slashCommand.enabled: true`）

    同时检查 `commands.useAccessGroups` 和 Channel/用户 allowlist。

  </Accordion>
</AccordionGroup>

## 附件视觉参考

当 Slack 文件下载成功且大小限制允许时，Slack 可以将已下载媒体附加到 Agent 回合。图像文件可以通过媒体理解路径或直接传递给支持视觉的回复模型；其他文件作为可下载的文件上下文保留，而不被视为图像输入。

### 支持的媒体类型

| 媒体类型                      | 来源               | 当前行为                                                                 | 备注                                                                    |
| ----------------------------- | ------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 图像  | Slack 文件 URL     | 下载并附加到回合以供支持视觉的处理                                       | 每个文件上限：`channels.slack.mediaMaxMb`（默认 20 MB）                  |
| PDF 文件                      | Slack 文件 URL     | 下载并作为文件上下文暴露给 `download-file` 或 `pdf` 等工具              | Slack 入站不会自动将 PDF 转换为图像视觉输入                              |
| 其他文件                      | Slack 文件 URL     | 尽可能下载并作为文件上下文暴露                                           | 二进制文件不被视为图像输入                                              |
| 线程回复                      | 线程启动文件       | 当回复没有直接媒体时，可以将根消息文件注水为上下文                       | 纯文件启动者使用附件占位符                                              |
| 多图消息                      | 多个 Slack 文件    | 每个文件独立评估                                                         | Slack 处理每条消息最多 8 个文件                                          |

### 入站管道

当带有文件附件的 Slack 消息到达时：

1. OpenClaw 使用 bot token（`xoxb-...`）从 Slack 的私有 URL 下载文件。
2. 下载成功后将文件写入媒体存储。
3. 已下载媒体路径和内容类型被添加到入站上下文。
4. 支持图像的模型/工具路径可以使用该上下文中的图像附件。
5. 非图像文件作为文件元数据或媒体引用保留，供能处理它们的工具使用。

### 线程根附件继承

当消息到达线程中（有 `thread_ts` 父节点）时：

- 如果回复本身没有直接媒体，且包含的根消息有文件，Slack 可以将根文件注水为线程启动上下文。
- 直接回复附件优先于根消息附件。
- 仅有文件而无文本的根消息用附件占位符表示，以便回退仍可包含其文件。

### 多附件处理

当单个 Slack 消息包含多个文件附件时：

- 每个附件通过媒体管道独立处理。
- 已下载媒体引用聚合到消息上下文中。
- 处理顺序遵循 Slack 事件负载中的文件顺序。
- 一个附件下载失败不会阻止其他附件。

### 大小、下载和模型限制

- **大小上限**：每个文件默认 20 MB。可通过 `channels.slack.mediaMaxMb` 配置。
- **下载失败**：Slack 无法提供、URL 过期、文件不可访问、文件超大以及 Slack 认证/登录 HTML 响应会被跳过，而不是报告为不支持的格式。
- **视觉模型**：图像分析使用支持视觉的活动回复模型，或 `agents.defaults.imageModel` 中配置的图像模型。

### 已知限制

| 场景                            | 当前行为                                                              | 解决方案                                                                    |
| ------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Slack 文件 URL 过期             | 文件被跳过；不显示错误                                                | 在 Slack 中重新上传文件                                                      |
| 未配置视觉模型                  | 图像附件存储为媒体引用，但不作为图像分析                              | 配置 `agents.defaults.imageModel` 或使用支持视觉的回复模型                   |
| 非常大的图像（默认超过 20 MB）  | 按大小上限跳过                                                        | 如果 Slack 允许，增加 `channels.slack.mediaMaxMb`                            |
| 转发/共享附件                   | 文本和 Slack 托管的图像/文件媒体尽力而为                               | 在 OpenClaw 线程中直接重新共享                                               |
| PDF 附件                        | 存储为文件/媒体上下文，不自动通过图像视觉路由                         | 使用 `download-file` 获取文件元数据或使用 `pdf` 工具进行 PDF 分析            |

### 相关文档

- [媒体理解管道](/nodes/media-understanding)
- [PDF 工具](/tools/pdf)

## 相关

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    将 Slack 用户配对到 Gateway。
  </Card>
  <Card title="Groups" icon="users" href="/channels/groups">
    Channel 和群组私信行为。
  </Card>
  <Card title="Channel routing" icon="route" href="/channels/channel-routing">
    将入站消息路由到 Agent。
  </Card>
  <Card title="Security" icon="shield" href="/gateway/security">
    威胁模型和安全加固。
  </Card>
  <Card title="Configuration" icon="sliders" href="/gateway/configuration">
    配置布局和优先级。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tools/slash-commands">
    命令目录和行为。
  </Card>
</CardGroup>
