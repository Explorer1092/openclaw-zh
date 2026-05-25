---
mmh3_hash: "456c8cb3add75d3078f54fbb0d66bc09"
title: "Slack"
sidebarTitle: "Slack"
summary: "Slack 设置和运行时行为（Socket Mode + HTTP Request URLs）"
read_when:
  - 设置 Slack 或调试 Slack socket/HTTP 模式
---

通过 Slack app 集成，支持私信和频道，已可用于生产环境。默认模式为 Socket Mode；也支持 HTTP Request URLs。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    Slack 私信默认使用 Pairing 模式。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="Channel 故障排除" icon="wrench" href="/channels/troubleshooting">
    跨 Channel 诊断和修复手册。
  </Card>
</CardGroup>

## 选择 Socket Mode 还是 HTTP Request URLs

两种传输方式均已可用于生产环境，在消息、斜杠命令、App Home 和交互性方面达到功能同等。请根据部署形式选择，而不是功能。

| 关注点                      | Socket Mode（默认）                                                                                                                             | HTTP Request URLs                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 公开 Gateway URL           | 不需要                                                                                                                                          | 需要（DNS、TLS、反向代理或隧道）                                                                             |
| 出站网络             | 必须能访问出站 WSS `wss-primary.slack.com`                                                                                                      | 无出站 WS；仅入站 HTTPS                                                                                      |
| 所需 Token                | Bot token（`xoxb-...`）+ 带 `connections:write` 的 App-Level Token（`xapp-...`）                                                                | Bot token（`xoxb-...`）+ Signing Secret                                                                        |
| 开发笔记本 / 防火墙后 | 开箱即用                                                                                                                                        | 需要公开隧道（ngrok、Cloudflare Tunnel、Tailscale Funnel）或 Staging Gateway                                   |
| 水平扩展           | 每个 app 每台主机一个 Socket Mode Session；多个 Gateway 需要独立的 Slack app                                                                       | 无状态 POST 处理器；多个 Gateway 副本可共享一个 app 并通过负载均衡                                             |
| 单 Gateway 多账户 | 支持；每个账户开启自己的 WS                                                                                                                     | 支持；每个账户需要唯一的 `webhookPath`（默认 `/slack/events`）以避免注册冲突                                   |
| 斜杠命令传输      | 通过 WS 连接发送；`slash_commands[].url` 被忽略                                                                                                 | Slack POST 到 `slash_commands[].url`；命令分发必填此字段                                                       |
| 请求签名              | 不使用（认证通过 App-Level Token）                                                                                                              | Slack 对每个请求签名；OpenClaw 用 `signingSecret` 验证                                                         |
| 连接断开后恢复  | Slack SDK 自动重连已启用；OpenClaw 也通过有限退避重启失败的 Socket Mode Session。Pong-timeout 传输调优适用。 | 无持久连接断开；重试由 Slack 按请求进行                                                                          |

<Note>
  **选 Socket Mode**：适用于单 Gateway 主机、开发笔记本以及能访问出站 `*.slack.com` 但无法接受入站 HTTPS 的内网环境。

**选 HTTP Request URLs**：适用于在负载均衡器后运行多个 Gateway 副本、出站 WSS 受阻但入站 HTTPS 允许，或已在反向代理处终止 Slack Webhook 的场景。
</Note>

## 安装

配置 Channel 之前先安装 Slack：

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` 注册并启用 Plugin。在配置 Slack app 和以下 Channel 设置之前，Plugin 不会执行任何操作。有关 Plugin 通用行为和安装规则，请参见 [Plugins](/tools/plugin)。

## 快速设置

<Tabs>
  <Tab title="Socket Mode（默认）">
    <Steps>
      <Step title="创建新的 Slack app">
        打开 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 选择工作区 → 粘贴以下某个 manifest → **Next** → **Create**。

        <CodeGroup>

```json Recommended
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json Minimal
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Recommended** 匹配 Slack Plugin 的完整功能集：App Home、斜杠命令、文件、Reaction、Pin、群组私信以及 emoji/用户组读取。在工作区策略限制权限时选择 **Minimal**——它涵盖私信、频道/群组历史、@提及和斜杠命令，但去除了文件、Reaction、Pin、群组私信（`mpim:*`）、`emoji:read` 和 `usergroups:read`。请参见[清单和权限清单](#manifest-and-scope-checklist)了解各 scope 的说明以及额外斜杠命令等叠加选项。
        </Note>

        Slack 创建 app 后：

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**：添加 `connections:write`，保存后复制 `xapp-...` 值。
        - **Install App → Install to Workspace**：复制 `xoxb-...` Bot User OAuth Token。

      </Step>

      <Step title="配置 OpenClaw">

        推荐使用 SecretRef 设置：

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

        环境变量回退（仅限默认账户）：

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
      <Step title="创建新的 Slack app">
        打开 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 选择工作区 → 粘贴以下某个 manifest → 将 `https://gateway-host.example.com/slack/events` 替换为您的公开 Gateway URL → **Next** → **Create**。

        <CodeGroup>

```json Recommended
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json Minimal
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Recommended** 匹配 Slack Plugin 的完整功能集；**Minimal** 针对限制权限的工作区去除了文件、Reaction、Pin、群组私信（`mpim:*`）、`emoji:read` 和 `usergroups:read`。请参见[清单和权限清单](#manifest-and-scope-checklist)了解各 scope 说明。
        </Note>

        <Info>
          三个 URL 字段（`slash_commands[].url`、`event_subscriptions.request_url` 和 `interactivity.request_url` / `message_menu_options_url`）都指向同一个 OpenClaw 端点。Slack 的 manifest schema 要求分别命名，但 OpenClaw 按载荷类型路由，因此单个 `webhookPath`（默认 `/slack/events`）即可。HTTP 模式下没有 `slash_commands[].url` 的斜杠命令将静默失效。
        </Info>

        Slack 创建 app 后：

        - **Basic Information → App Credentials**：复制 **Signing Secret** 用于请求验证。
        - **Install App → Install to Workspace**：复制 `xoxb-...` Bot User OAuth Token。

      </Step>

      <Step title="配置 OpenClaw">

        推荐使用 SecretRef 设置：

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
        多账户 HTTP 模式下使用唯一的 Webhook 路径

        为每个账户设置不同的 `webhookPath`（默认 `/slack/events`），避免注册冲突。
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

OpenClaw 默认将 Socket Mode 的 Slack SDK 客户端 Pong 超时设置为 15 秒。仅在需要针对特定工作区或主机进行调优时才覆盖传输设置：

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

仅在 Socket Mode 工作区日志显示 Slack WebSocket pong/server-ping 超时或运行在已知事件循环饥饿主机上时使用。`clientPingTimeout` 是 SDK 发送客户端 ping 后等待 pong 的时间；`serverPingTimeout` 是等待 Slack 服务器 ping 的时间。App 消息和事件属于应用状态，而非传输活跃度信号。

注意：

- `socketMode` 在 HTTP Request URL 模式下被忽略。
- `channels.slack.socketMode` 基础设置适用于所有 Slack 账户，除非被覆盖。每账户覆盖使用 `channels.slack.accounts.<accountId>.socketMode`；由于这是对象覆盖，需包含该账户所需的所有 Socket 调优字段。
- 只有 `clientPingTimeout` 有 OpenClaw 默认值（`15000`）。`serverPingTimeout` 和 `pingPongLoggingEnabled` 仅在配置后才传递给 Slack SDK。
- Socket Mode 重启退避从约 2 秒开始，上限约 30 秒。连续可恢复的 start/start-wait 失败在 12 次尝试后停止；成功连接后，后续可恢复的断开将开始新的重试周期。不可恢复的 Slack 认证错误（如 `invalid_auth`、吊销的 Token 或缺少 scope）将快速失败，而非无限重试。

## 清单和权限清单

Socket Mode 和 HTTP Request URLs 的基础 Slack app manifest 相同。仅 `settings` 块（以及斜杠命令 `url`）有所不同。

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

**HTTP Request URLs 模式**下，将 `settings` 替换为 HTTP 变体，并为每个斜杠命令添加 `url`。需要公开 URL：

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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

### 其他 manifest 设置

扩展上述默认值的表面功能。

默认 manifest 启用 Slack App Home **Home** 标签页并订阅 `app_home_opened`。当工作区成员打开 Home 标签页时，OpenClaw 使用 `views.publish` 发布安全的默认 Home 视图；不包含对话载荷或私有配置。**Messages** 标签页保持启用以支持 Slack 私信。manifest 还通过 `features.assistant_view`、`assistant:write`、`assistant_thread_started` 和 `assistant_thread_context_changed` 启用 Slack 助手线程；助手线程路由到各自的 OpenClaw 线程 Session，并向 Agent 提供 Slack 提供的线程上下文。

<AccordionGroup>
  <Accordion title="可选原生斜杠命令">

    可以使用多个[原生斜杠命令](#commands-and-slash-behavior)代替带细微差别的单个配置命令：

    - 使用 `/agentstatus` 而不是 `/status`，因为 `/status` 命令已被保留。
    - 一次最多可用 25 个斜杠命令。

    将现有的 `features.slash_commands` 部分替换为[可用命令](/tools/slash-commands#command-list)的子集：

    <Tabs>
      <Tab title="Socket Mode（默认）">

```json
{
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
      "command": "/session",
      "description": "Manage thread-binding expiry",
      "usage_hint": "idle <duration|off> or max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "Set the thinking level",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Toggle verbose output",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Show or set fast mode",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Toggle reasoning visibility",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Toggle elevated mode",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Show or set exec defaults",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/model",
      "description": "Show or set the model",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "List providers/models",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Show the short help summary"
    },
    {
      "command": "/commands",
      "description": "Show the generated command catalog"
    },
    {
      "command": "/tools",
      "description": "Show what the current agent can use right now",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Show runtime status, including provider usage/quota when available"
    },
    {
      "command": "/tasks",
      "description": "List active/recent background tasks for the current session"
    },
    {
      "command": "/context",
      "description": "Explain how context is assembled",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Show your sender identity"
    },
    {
      "command": "/skill",
      "description": "Run a skill by name",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP Request URLs">
        使用与上面 Socket Mode 相同的 `slash_commands` 列表，并为每条记录添加 `"url": "https://gateway-host.example.com/slack/events"`。示例：

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Show the short help summary",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        对列表中的每个命令重复该 `url` 值。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="可选署名 scope（写操作）">
    如果希望发出的消息使用活跃 Agent 身份（自定义用户名和图标）而非默认 Slack app 身份，请添加 `chat:write.customize` bot scope。

    如果使用 emoji 图标，Slack 期望 `:emoji_name:` 语法。

  </Accordion>
  <Accordion title="可选用户 Token scope（读操作）">
    如果配置了 `channels.slack.userToken`，典型的读取 scope 包括：

    - `channels:history`、`groups:history`、`im:history`、`mpim:history`
    - `channels:read`、`groups:read`、`im:read`、`mpim:read`
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
- 配置中的 Token 会覆盖环境变量回退。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 环境变量回退仅适用于默认账户。
- `userToken`（`xoxp-...`）仅支持配置（无环境变量回退），默认为只读行为（`userTokenReadOnly: true`）。

状态快照行为：

- Slack 账户检查跟踪每个凭据的 `*Source` 和 `*Status` 字段（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 状态为 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示账户已通过 SecretRef 或其他非内联密钥源配置，但当前命令/运行时路径无法解析实际值。
- HTTP 模式下包含 `signingSecretStatus`；Socket Mode 下所需的一对是 `botTokenStatus` + `appTokenStatus`。

<Tip>
对于操作/目录读取，配置了用户 Token 时可优先使用用户 Token。对于写操作，bot token 仍为首选；仅在 `userTokenReadOnly: false` 且 bot token 不可用时，才允许使用用户 Token 写入。
</Tip>

## 操作和门控

Slack 操作由 `channels.slack.actions.*` 控制。

当前 Slack 工具中可用的操作组：

| 组          | 默认  |
| ----------- | ----- |
| messages    | 已启用 |
| reactions   | 已启用 |
| pins        | 已启用 |
| memberInfo  | 已启用 |
| emojiList   | 已启用 |

当前 Slack 消息操作包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。`download-file` 接受入站文件占位符中显示的 Slack 文件 ID，并为图片返回图像预览，为其他文件类型返回本地文件元数据。

## 访问控制和路由

<Tabs>
  <Tab title="私信策略">
    `channels.slack.dmPolicy` 控制私信访问。`channels.slack.allowFrom` 是标准私信 allowlist。

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `channels.slack.allowFrom` 包含 `"*"`）
    - `disabled`

    私信标志：

    - `dm.enabled`（默认 true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（遗留）
    - `dm.groupEnabled`（群组私信默认 false）
    - `dm.groupChannels`（可选 MPIM allowlist）

    多账户优先级：

    - `channels.slack.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 命名账户在自身 `allowFrom` 未设置时继承 `channels.slack.allowFrom`。
    - 命名账户不继承 `channels.slack.accounts.default.allowFrom`。

    遗留的 `channels.slack.dm.policy` 和 `channels.slack.dm.allowFrom` 仍可读取以保持兼容性。当可以在不改变访问权限的情况下迁移时，`openclaw doctor --fix` 会将其迁移到 `dmPolicy` 和 `allowFrom`。

    私信中的 Pairing 使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="Channel 策略">
    `channels.slack.groupPolicy` 控制频道处理：

    - `open`
    - `allowlist`
    - `disabled`

    频道 allowlist 位于 `channels.slack.channels` 下，**必须使用稳定的 Slack 频道 ID**（例如 `C12345678`）作为配置键。

    运行时注意：如果 `channels.slack` 完全缺失（仅环境变量设置），运行时回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy`）。

    名称/ID 解析：

    - 频道 allowlist 和私信 allowlist 条目在启动时解析（Token 权限允许时）
    - 未解析的频道名称条目按配置保留，但默认不参与路由
    - 入站授权和频道路由默认以 ID 优先；直接用户名/slug 匹配需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    基于名称的键（`#channel-name` 或 `channel-name`）在 `groupPolicy: "allowlist"` 下**不匹配**。频道查找默认以 ID 优先，因此基于名称的键将永远无法成功路由，该频道中的所有消息将被静默屏蔽。这与 `groupPolicy: "open"` 不同，在 open 模式下，频道键不是路由必需的，基于名称的键看似有效。

    始终使用 Slack 频道 ID 作为键。查找方法：在 Slack 中右键点击频道 → **Copy link** — URL 末尾的 `C...` 值即为频道 ID。

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

  <Tab title="提及和频道用户">
    频道消息默认需要@提及。

    提及来源：

    - 显式 app 提及（`<@botId>`）
    - Slack 用户组提及（`<!subteam^S...>`）当 bot 用户是该用户组成员时；需要 `usergroups:read`
    - 提及正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 隐式回复-bot-线程行为（当 `thread.requireExplicitMention` 为 `true` 时禁用）

    每频道控制（`channels.slack.channels.<id>`；名称仅通过启动解析或 `dangerouslyAllowNameMatching`）：

    - `requireMention`
    - `users`（allowlist）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender` 键格式：`channel:`、`id:`、`e164:`、`username:`、`name:` 或 `"*"` 通配符
      （遗留无前缀键仍仅映射到 `id:`）

    `allowBots` 对频道和私有频道采用保守策略：仅在发送 bot 明确列入该房间的 `users` allowlist，或 `channels.slack.allowFrom` 中至少一个显式 Slack 所有者 ID 当前是房间成员时，才接受 bot 发送的房间消息。通配符和显示名称所有者条目不满足所有者在线条件。所有者在线检查使用 Slack `conversations.members`；确保 app 对房间类型有匹配的读取 scope（公开频道用 `channels:read`，私有频道用 `groups:read`）。如果成员查找失败，OpenClaw 丢弃该 bot 发送的房间消息。

    已接受的 bot 发送 Slack 消息使用共享的 [bot 循环保护](/channels/bot-loop-protection)。在 `channels.defaults.botLoopProtection` 中配置默认限额，然后在工作区或频道需要不同限制时用 `channels.slack.botLoopProtection` 或 `channels.slack.channels.<id>.botLoopProtection` 覆盖。

  </Tab>
</Tabs>

## 线程、Session 和回复标签

- 私信路由为 `direct`；频道为 `channel`；MPIM 为 `group`。
- Slack 路由绑定接受原始对等 ID 以及 Slack 目标格式，如 `channel:C12345678`、`user:U12345678` 和 `<@U12345678>`。
- 使用默认 `session.dmScope=main` 时，Slack 私信归并到 Agent 主 Session。
- 频道 Session：`agent:<agentId>:slack:channel:<channelId>`。
- 普通顶级频道消息保持在每频道 Session 上，即使 `replyToMode` 非 `off`。
- Slack 线程回复使用父 Slack `thread_ts` 作为 Session 后缀（`:thread:<threadTs>`），即使使用 `replyToMode="off"` 禁用了出站回复线程。
- 当预计某顶级频道根节点会开启可见的 Slack 线程时，OpenClaw 将其植入 `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`，使根节点和后续线程回复共享一个 OpenClaw Session。适用于 `app_mention` 事件、显式 bot 或配置的提及模式匹配，以及 `requireMention: false` 且 `replyToMode` 非 `off` 的频道。
- `channels.slack.thread.historyScope` 默认为 `thread`；`thread.inheritParent` 默认为 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程 Session 启动时获取的现有线程消息数量（默认 `20`；设为 `0` 禁用）。
- `channels.slack.thread.requireExplicitMention`（默认 `false`）：为 `true` 时，抑制隐式线程提及，即使 bot 已参与线程，也只响应线程内的显式 `@bot` 提及。没有此设置，bot 参与的线程中的回复会绕过 `requireMention` 门控。

回复线程控制：

- `channels.slack.replyToMode`：`off|first|all|batched`（默认 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 分别设置
- 私信的遗留回退：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

对于 `message` 工具发出的显式 Slack 线程回复，使用 `action: "send"` 时设置 `replyBroadcast: true` 加 `threadId` 或 `replyTo`，以请求 Slack 同时将线程回复广播到父频道。这映射到 Slack 的 `chat.postMessage` `reply_broadcast` 标志，仅支持文本或 Block Kit 发送，不支持媒体上传。

当 `message` 工具调用在 Slack 线程内运行并以相同频道为目标时，OpenClaw 通常根据 `replyToMode` 继承当前 Slack 线程。在 `action: "send"` 或 `action: "upload-file"` 上设置 `topLevel: true` 可强制发送新的父频道消息。`threadId: null` 同样被接受为顶级退出选项。

<Note>
`replyToMode="off"` 禁用出站 Slack 回复线程，包括显式 `[[reply_to_*]]` 标签。它不会展平入站 Slack 线程 Session：已发布在 Slack 线程中的消息仍路由到 `:thread:<threadTs>` Session。这与 Telegram 不同，Telegram 的 `"off"` 模式下仍接受显式标签。Slack 线程将消息从频道中隐藏，而 Telegram 回复在内联可见。
</Note>

## Ack Reaction

`ackReaction` 在 OpenClaw 处理入站消息时发送一个确认 emoji。

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Agent 身份 emoji 回退（`agents.list[].identity.emoji`，否则 "👀"）

注意：

- Slack 期望短代码（例如 `"eyes"`）。
- 使用 `""` 为该 Slack 账户或全局禁用此 Reaction。

## 文本流式传输

`channels.slack.streaming` 控制实时预览行为：

- `off`：禁用实时预览流式传输。
- `partial`（默认）：用最新的部分输出替换预览文本。
- `block`：追加分块预览更新。
- `progress`：生成时显示进度状态文本，然后发送最终文本。
- `streaming.preview.toolProgress`：当草稿预览激活时，将工具/进度更新路由到同一个已编辑预览消息（默认：`true`）。设为 `false` 保留单独的工具/进度消息。
- `streaming.preview.commandText` / `streaming.progress.commandText`：设为 `status` 以保留简洁的工具进度行同时隐藏原始命令/exec 文本（默认：`raw`）。

隐藏原始命令/exec 文本同时保留简洁进度行：

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

- 必须有可用的回复线程才能显示原生文本流式传输和 Slack 助手线程状态。线程选择仍遵循 `replyToMode`。
- 频道、群组聊天和顶级私信根节点在原生流式传输不可用或没有回复线程时仍可使用普通草稿预览。
- 顶级 Slack 私信默认不在线程中，因此不显示 Slack 的线程式原生流/状态预览；OpenClaw 改为在私信中发布并编辑草稿预览。
- 媒体和非文本载荷回退到普通传递。
- 媒体/错误最终答案取消待处理的预览编辑；符合条件的文本/块最终答案仅在能就地编辑预览时才刷新。
- 如果流式传输在回复中途失败，OpenClaw 对剩余载荷回退到普通传递。

使用草稿预览替代 Slack 原生文本流式传输：

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

遗留键：

- `channels.slack.streamMode`（`replace | status_final | append`）是 `channels.slack.streaming.mode` 的遗留运行时别名。
- 布尔值 `channels.slack.streaming` 是 `channels.slack.streaming.mode` 和 `channels.slack.streaming.nativeTransport` 的遗留运行时别名。
- 遗留的 `channels.slack.nativeStreaming` 是 `channels.slack.streaming.nativeTransport` 的运行时别名。
- 运行 `openclaw doctor --fix` 将持久化的 Slack 流式传输配置重写为标准键。

## 打字 Reaction 回退

`typingReaction` 在 OpenClaw 处理回复时向入站 Slack 消息添加临时 Reaction，回复完成时移除。在线程回复之外最为有用，因为线程回复默认使用"正在输入..."状态指示器。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意：

- Slack 期望短代码（例如 `"hourglass_flowing_sand"`）。
- Reaction 是尽力而为的；回复或失败路径完成后会自动尝试清理。

## 媒体、分块和传递

<AccordionGroup>
  <Accordion title="入站附件">
    Slack 文件附件从 Slack 托管的私有 URL（Token 认证请求流程）下载，下载成功且大小在限制内时写入媒体存储。文件占位符包含 Slack `fileId`，供 Agent 用 `download-file` 获取原始文件。

    下载使用有限的空闲和总超时。如果 Slack 文件检索停滞或失败，OpenClaw 继续处理消息并回退到文件占位符。

    运行时入站大小上限默认为 `20MB`，除非被 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="出站文本和文件">
    - 文本块使用 `channels.slack.textChunkLimit`（默认 4000）
    - `channels.slack.chunkMode="newline"` 启用段落优先分割
    - 文件发送使用 Slack 上传 API，可包含线程回复（`thread_ts`）
    - 出站媒体上限遵循 `channels.slack.mediaMaxMb`（如已配置）；否则频道发送使用媒体管道中的 MIME 类型默认值

  </Accordion>

  <Accordion title="传递目标">
    推荐的显式目标：

    - `user:<id>` 用于私信
    - `channel:<id>` 用于频道

    纯文本/块 Slack 私信可直接发布到用户 ID；文件上传和线程发送由于需要具体的对话 ID，会先通过 Slack 对话 API 打开私信。

  </Accordion>
</AccordionGroup>

## 命令和斜杠行为

斜杠命令在 Slack 中以单个配置命令或多个原生命令的形式出现。配置 `channels.slack.slashCommand` 更改命令默认值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生命令需要 Slack app 中的[其他 manifest 设置](#additional-manifest-settings)，并通过 `channels.slack.commands.native: true` 或全局配置中的 `commands.native: true` 启用。

- 原生命令自动模式对 Slack 为**关闭**，因此 `commands.native: "auto"` 不启用 Slack 原生命令。

```txt
/help
```

原生参数菜单使用自适应渲染策略，在分派选定选项值之前显示确认模态框：

- 最多 5 个选项：按钮块
- 6-100 个选项：静态选择菜单
- 超过 100 个选项：在交互选项处理器可用时使用带异步选项过滤的外部选择
- 超过 Slack 限制：编码选项值回退到按钮

```txt
/think
```

斜杠 Session 使用 `agent:<agentId>:slack:slash:<userId>` 等独立键，并仍使用 `CommandTargetSessionKey` 将命令执行路由到目标对话 Session。

## 交互式回复

Slack 可以渲染 Agent 撰写的交互式回复控件，但此功能默认禁用。
对于新的 Agent、CLI 和 Plugin 输出，优先使用共享的 `presentation` 按钮或选择块。它们使用相同的 Slack 交互路径，同时在其他 Channel 上也能降级显示。

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

或仅为某个 Slack 账户启用：

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

启用后，Agent 仍可发出已弃用的 Slack 专用回复指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

这些指令编译为 Slack Block Kit 并通过现有 Slack 交互事件路径路由点击或选择。在旧提示词和 Slack 专用解决方案中保留使用；对于新的可移植控件使用共享 presentation。

指令编译器 API 对新的生产代码也已弃用：

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

对新的 Slack 渲染控件使用 `presentation` 载荷和 `buildSlackPresentationBlocks(...)`。

注意：

- 这是 Slack 专用的遗留 UI。其他 Channel 不将 Slack Block Kit 指令转换为各自的按钮系统。
- 交互回调值是 OpenClaw 生成的不透明 Token，而非 Agent 原始值。
- 如果生成的交互块超过 Slack Block Kit 限制，OpenClaw 回退到原始文本回复，而非发送无效的块载荷。

### Plugin 拥有的模态框提交

注册了交互处理器的 Slack Plugin 还可以在 OpenClaw 将载荷压缩为 Agent 可见系统事件之前，接收模态框 `view_submission` 和 `view_closed` 生命周期事件。打开 Slack 模态框时使用以下路由模式之一：

- 将 `callback_id` 设为 `openclaw:<namespace>:<payload>`。
- 或保留现有的 `callback_id` 并在模态框 `private_metadata` 中放入 `pluginInteractiveData: "<namespace>:<payload>"`。

处理器接收 `ctx.interaction.kind` 为 `view_submission` 或 `view_closed`，规范化的 `inputs` 以及来自 Slack 的完整原始 `stateValues` 对象。仅 callback-id 路由就足以调用 Plugin 处理器；当模态框还需生成 Agent 可见的系统事件时，请包含现有模态框 `private_metadata` 中的用户/Session 路由字段。Agent 收到简洁的、已脱敏的 `Slack interaction: ...` 系统事件。如果处理器返回 `systemEvent.summary`、`systemEvent.reference` 或 `systemEvent.data`，这些字段会包含在该简洁事件中，以便 Agent 引用 Plugin 拥有的存储而无需查看完整表单载荷。

## Slack 中的 Exec 审批

Slack 可以作为带有交互按钮和交互的原生审批客户端，而不必回退到 Web UI 或终端。

- Exec 和 Plugin 审批可以渲染为 Slack 原生 Block Kit 提示。
- `channels.slack.execApprovals.*` 仍然是原生 exec 审批客户端启用和私信/频道路由配置。
- Exec 审批私信使用 `channels.slack.execApprovals.approvers` 或 `commands.ownerAllowFrom`。
- 当 Slack 作为发起 Session 的原生审批客户端启用，或当 `approvals.plugin` 路由到发起 Slack Session 或 Slack 目标时，Plugin 审批使用 Slack 原生按钮。
- Plugin 审批私信使用来自 `channels.slack.allowFrom`、命名账户 `allowFrom` 或账户默认路由的 Slack Plugin 审批者。
- 审批者授权仍然强制执行：仅 exec 审批者不能审批 Plugin 请求，除非他们同时也是 Plugin 审批者。

这使用与其他 Channel 相同的共享审批按钮界面。当 Slack app 设置中启用了 `interactivity` 时，审批提示在对话中直接以 Block Kit 按钮渲染。
当这些按钮存在时，它们是主要的审批 UX；OpenClaw 仅在工具结果表明聊天审批不可用或手动审批是唯一路径时才包含手动 `/approve` 命令。

配置路径：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（可选；尽可能回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `agentFilter`、`sessionFilter`

当 `enabled` 未设置或为 `"auto"` 且至少一个 exec 审批者可解析时，Slack 自动启用原生 exec 审批。当 Slack Plugin 审批者可解析且请求与原生客户端过滤器匹配时，Slack 也可以通过此原生客户端路径处理原生 Plugin 审批。设置 `enabled: false` 显式禁用 Slack 作为原生审批客户端。设置 `enabled: true` 在审批者可解析时强制开启原生审批。禁用 Slack exec 审批不会禁用通过 `approvals.plugin` 启用的原生 Slack Plugin 审批传递；Plugin 审批传递改用 Slack Plugin 审批者。

无显式 Slack exec 审批配置时的默认行为：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

仅在需要覆盖审批者、添加过滤器或选择启用来源聊天传递时才需要显式 Slack 原生配置：

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

共享的 `approvals.exec` 转发是独立的。仅在 exec 审批提示还必须路由到其他聊天或显式带外目标时使用。共享的 `approvals.plugin` 转发也是独立的；当 Slack 能够原生处理 Plugin 审批请求时，Slack 原生传递会抑制该回退。

同频道 `/approve` 在已支持命令的 Slack 频道和私信中也有效。完整的审批转发模型请参见 [Exec 审批](/tools/exec-approvals)。

## 事件和操作行为

- 消息编辑/删除映射为系统事件。
- 线程广播（"Also send to channel"线程回复）作为普通用户消息处理。
- Reaction 添加/移除事件映射为系统事件。
- 成员加入/离开、频道创建/重命名以及 Pin 添加/移除事件映射为系统事件。
- `channel_id_changed` 在 `configWrites` 启用时可迁移频道配置键。
- 频道主题/目的元数据被视为不可信上下文，可注入到路由上下文中。
- 线程发起者和初始线程历史上下文植入在适用时按配置的发送者 allowlist 过滤。
- 块操作和模态框交互发出带有丰富载荷字段的结构化 `Slack interaction: ...` 系统事件：
  - 块操作：选定值、标签、选择器值和 `workflow_*` 元数据
  - 带路由频道元数据和表单输入的模态框 `view_submission` 和 `view_closed` 事件

## 配置参考

主要参考：[配置参考 - Slack](/gateway/config-channels#slack)。

<Accordion title="高信号 Slack 字段">

- mode/auth：`mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- 私信访问：`dm.enabled`、`dmPolicy`、`allowFrom`（遗留：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 兼容开关：`dangerouslyAllowNameMatching`（紧急关口；除非必要否则保持关闭）
- 频道访问：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
- 线程/历史：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 传递：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- unfurl：`unfurlLinks`（默认：`false`）、`unfurlMedia`，用于 `chat.postMessage` 链接/媒体预览控制；设置 `unfurlLinks: true` 重新启用链接预览
- 操作/功能：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## 故障排除

<AccordionGroup>
  <Accordion title="频道中无回复">
    按顺序检查：

    - `groupPolicy`
    - 频道 allowlist（`channels.slack.channels`）——**键必须是频道 ID**（`C12345678`），而非名称（`#channel-name`）。基于名称的键在 `groupPolicy: "allowlist"` 下静默失败，因为频道路由默认以 ID 优先。查找 ID 的方法：在 Slack 中右键点击频道 → **Copy link** — URL 末尾的 `C...` 值即为频道 ID。
    - `requireMention`
    - 每频道 `users` allowlist
    - `messages.groupChat.visibleReplies`：普通群组/频道请求默认为 `"automatic"`。如果选择了 `"message_tool"` 且日志显示助手文本但没有 `message(action=send)` 调用，说明模型错过了可见消息工具路径。此模式下最终文本保持私有；查看 Gateway 详细日志中被抑制的载荷元数据，或设置为 `"automatic"` 让每个普通助手最终回复通过遗留路径发布。
    - `messages.groupChat.unmentionedInbound`：如果为 `"room_event"`，未@提及的允许频道消息是环境上下文，除非 Agent 调用 `message` 工具否则保持静默。参见[环境房间事件](/channels/ambient-room-events)。

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    实用命令：

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="私信消息被忽略">
    检查：

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（或遗留的 `channels.slack.dm.policy`）
    - Pairing 审批 / allowlist 条目（`dmPolicy: "open"` 仍需要 `channels.slack.allowFrom: ["*"]`）
    - 群组私信使用 MPIM 处理；启用 `channels.slack.dm.groupEnabled`，如已配置，将 MPIM 包含在 `channels.slack.dm.groupChannels` 中
    - Slack Assistant 私信事件：详细日志中提到 `drop message_changed` 通常意味着 Slack 发送了一个编辑的 Assistant 线程事件，且消息元数据中没有可恢复的人类发送者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode 无法连接">
    验证 bot + app token 以及 Slack app 设置中的 Socket Mode 启用情况。
    `xapp-...` App-Level Token 需要 `connections:write`，且 `xoxb-...`
    bot token 必须属于与 app token 相同的 Slack app/工作区。

    如果 `openclaw channels status --probe --json` 显示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，说明 Slack 账户已配置
    但当前运行时无法解析 SecretRef 支持的值。

    类似 `slack socket mode failed to start; retry ...` 的日志是可恢复的
    启动失败。缺少 scope、吊销的 Token 和无效认证会快速失败而非重试。
    `slack token mismatch ...` 日志意味着 bot token 和 app token 似乎属于不同的
    Slack app；修复 Slack app 凭据。

  </Accordion>

  <Accordion title="HTTP 模式无法接收事件">
    验证：

    - Signing secret
    - Webhook 路径
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - 每个 HTTP 账户的唯一 `webhookPath`
    - 公开 URL 终止 TLS 并将请求转发到 Gateway 路径
    - Slack app `request_url` 路径与 `channels.slack.webhookPath` 完全匹配（默认 `/slack/events`）

    如果账户快照中出现 `signingSecretStatus: "configured_unavailable"`，
    说明 HTTP 账户已配置但当前运行时无法解析 SecretRef 支持的 signing secret。

    重复出现的 `slack: webhook path ... already registered` 日志意味着两个 HTTP
    账户使用了相同的 `webhookPath`；为每个账户分配不同的路径。

  </Accordion>

  <Accordion title="原生/斜杠命令不触发">
    确认您的意图是：

    - 原生命令模式（`channels.slack.commands.native: true`）且在 Slack 中注册了匹配的斜杠命令
    - 还是单斜杠命令模式（`channels.slack.slashCommand.enabled: true`）

    Slack 不会自动创建或删除斜杠命令。`commands.native: "auto"` 不启用 Slack 原生命令；使用 `true` 并在 Slack app 中创建匹配的命令。HTTP 模式下，每个 Slack 斜杠命令必须包含 Gateway URL。Socket Mode 下，命令载荷通过 WebSocket 发送，Slack 忽略 `slash_commands[].url`。

    同时检查 `commands.useAccessGroups`、私信授权、频道 allowlist
    以及每频道 `users` allowlist。Slack 对被阻止的斜杠命令发送者返回临时错误，包括：

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## 附件视觉参考

当 Slack 文件下载成功且大小在限制内时，Slack 可将已下载的媒体附加到 Agent 轮次。图片文件可通过媒体理解管道或直接传递给支持视觉的回复模型；其他文件作为可下载的文件上下文保留，而非作为图像输入处理。

### 支持的媒体类型

| 媒体类型                       | 来源                 | 当前行为                                                                          | 备注                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 图片 | Slack 文件 URL       | 下载并附加到轮次，供支持视觉的处理路径使用                                         | 每文件上限：`channels.slack.mediaMaxMb`（默认 20 MB）                     |
| PDF 文件                      | Slack 文件 URL       | 下载后作为文件上下文暴露给 `download-file` 或 `pdf` 等工具                         | Slack 入站不会自动将 PDF 转换为图像视觉输入                               |
| 其他文件                      | Slack 文件 URL       | 尽可能下载并作为文件上下文暴露                                                     | 二进制文件不作为图像输入处理                                              |
| 线程回复                      | 线程发起者文件       | 当回复没有直接媒体时，可将根消息文件作为上下文补充                                 | 纯文件发起者使用附件占位符                                                |
| 多图消息                      | 多个 Slack 文件      | 每个文件独立评估                                                                   | Slack 处理每条消息最多八个文件                                            |

### 入站管道

当带有文件附件的 Slack 消息到达时：

1. OpenClaw 使用 bot token（`xoxb-...`）从 Slack 的私有 URL 下载文件。
2. 下载成功时将文件写入媒体存储。
3. 下载的媒体路径和内容类型添加到入站上下文。
4. 支持图像的模型/工具路径可使用该上下文中的图像附件。
5. 非图像文件作为文件元数据或媒体引用保留，供可处理它们的工具使用。

### 线程根附件继承

当消息到达线程中（有 `thread_ts` 父节点）时：

- 如果回复本身没有直接媒体且包含的根消息有文件，Slack 可将根文件作为线程发起者上下文补充。
- 直接回复附件优先于根消息附件。
- 只有文件没有文本的根消息用附件占位符表示，以便回退仍可包含其文件。

### 多附件处理

当单条 Slack 消息包含多个文件附件时：

- 每个附件通过媒体管道独立处理。
- 下载的媒体引用聚合到消息上下文中。
- 处理顺序遵循 Slack 事件载荷中的文件顺序。
- 某个附件下载失败不会阻止其他附件处理。

### 大小、下载和模型限制

- **大小上限**：默认每文件 20 MB。可通过 `channels.slack.mediaMaxMb` 配置。
- **下载失败**：Slack 无法提供的文件、过期 URL、不可访问文件、超大文件以及 Slack 认证/登录 HTML 响应会被跳过，而非报告为不支持的格式。
- **视觉模型**：图像分析使用支持视觉的活跃回复模型，或 `agents.defaults.imageModel` 配置的图像模型。

### 已知限制

| 场景                                   | 当前行为                                                                     | 解决方法                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Slack 文件 URL 过期                    | 文件被跳过；不显示错误                                                        | 在 Slack 中重新上传文件                                                    |
| 未配置视觉模型                         | 图像附件作为媒体引用存储，但不作为图像分析                                    | 配置 `agents.defaults.imageModel` 或使用支持视觉的回复模型                  |
| 非常大的图像（默认 > 20 MB）          | 按大小上限跳过                                                               | 如果 Slack 允许，增大 `channels.slack.mediaMaxMb`                           |
| 转发/共享附件                          | 文本和 Slack 托管的图像/文件媒体是尽力而为的                                  | 直接在 OpenClaw 线程中重新分享                                             |
| PDF 附件                               | 作为文件/媒体上下文存储，不自动通过图像视觉路由                               | 使用 `download-file` 获取文件元数据或使用 `pdf` 工具进行 PDF 分析           |

### 相关文档

- [媒体理解管道](/nodes/media-understanding)
- [PDF 工具](/tools/pdf)
- Epic：[#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 附件视觉启用
- 回归测试：[#51353](https://github.com/openclaw/openclaw/issues/51353)
- 实时验证：[#51354](https://github.com/openclaw/openclaw/issues/51354)

## 相关

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    将 Slack 用户配对到 Gateway。
  </Card>
  <Card title="Groups" icon="users" href="/channels/groups">
    频道和群组私信行为。
  </Card>
  <Card title="Channel Routing" icon="route" href="/channels/channel-routing">
    将入站消息路由到 Agent。
  </Card>
  <Card title="Security" icon="shield" href="/gateway/security">
    威胁模型和加固。
  </Card>
  <Card title="Configuration" icon="sliders" href="/gateway/configuration">
    配置布局和优先级。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/tools/slash-commands">
    命令目录和行为。
  </Card>
</CardGroup>
