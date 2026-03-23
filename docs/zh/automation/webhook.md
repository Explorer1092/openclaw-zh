---
title: "Webhook"
sidebarTitle: "Webhook"
mmh3_hash: "8baa25f7c4ce8d1aa958b37473b0db6a"
summary: "用于唤醒和隔离 Agent 运行的 Webhook 入口"
read_when: ["添加或更改 webhook 端点时","将外部系统连接到 OpenClaw 时"]
---

# Webhook

Gateway 可以为外部触发器暴露一个小型 HTTP webhook 端点。

## 启用

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    // 可选: 将显式 `agentId` 路由限制到此白名单。
    // 省略或包含 "*" 以允许任何 Agent。
    // 设置 [] 以拒绝所有显式 `agentId` 路由。
    allowedAgentIds: ["hooks", "main"],
  },
}
```

注意:

- 当 `hooks.enabled=true` 时,`hooks.token` 是必需的。
- `hooks.path` 默认为 `/hooks`。

## 认证

每个请求必须包含 hook 令牌。首选标头:

- `Authorization: Bearer <token>` (推荐)
- `x-openclaw-token: <token>`
- 查询字符串令牌被拒绝 (`?token=...` 返回 `400`)。
- 将 `hooks.token` 持有者视为该 Gateway 上 hook 入口的完全信任调用者。Hook 载荷内容仍不受信任，但这不是单独的非所有者认证边界。

## 端点

### `POST /hooks/wake`

载荷:

```json
{ "text": "System line", "mode": "now" }
```

- `text` **必需** (字符串): 事件描述(例如 "New email received")。
- `mode` 可选 (`now` | `next-heartbeat`): 是否触发立即心跳(默认 `now`) 或等待下一次定期检查。

效果:

- 为 **main** session 排队一个系统事件
- 如果 `mode=now`,触发立即心跳

### `POST /hooks/agent`

载荷:

```json
{
  "message": "Run this",
  "name": "Email",
  "agentId": "hooks",
  "sessionKey": "hook:email:msg-123",
  "wakeMode": "now",
  "deliver": true,
  "channel": "last",
  "to": "+15551234567",
  "model": "openai/gpt-5.2-mini",
  "thinking": "low",
  "timeoutSeconds": 120
}
```

- `message` **必需** (字符串): 供 Agent 处理的提示词或消息。
- `name` 可选 (字符串): Hook 的人类可读名称(例如 "GitHub"),用作 session 摘要中的前缀。
- `agentId` 可选 (字符串): 将此 hook 路由到特定 Agent。未知 ID 回退到默认 Agent。设置后,hook 使用已解析 Agent 的工作区和配置运行。
- `sessionKey` 可选 (字符串): 用于标识 Agent session 的键。默认情况下,除非 `hooks.allowRequestSessionKey=true`,否则拒绝此字段。
- `wakeMode` 可选 (`now` | `next-heartbeat`): 是否触发立即心跳(默认 `now`) 或等待下一次定期检查。
- `deliver` 可选 (布尔值): 如果为 `true`,Agent 的响应将发送到消息 Channel。默认为 `true`。仅包含心跳确认的响应会自动跳过。
- `channel` 可选 (字符串): 用于传递的消息 Channel。核心 channels: `last`, `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`, `irc`, `googlechat`, `line`。扩展 channels（插件）: `msteams`, `mattermost` 等。默认为 `last`。
- `to` 可选 (字符串): Channel 的接收者标识符（例如 WhatsApp/Signal 的电话号码，Telegram 的聊天 ID，Discord/Slack/Mattermost（插件）的 Channel ID，Microsoft Teams 的对话 ID）。默认为 main session 中的最后一个接收者。
- `model` 可选 (字符串): 模型覆盖(例如 `anthropic/claude-3-5-sonnet` 或别名)。如果受限,必须在允许的模型列表中。
- `thinking` 可选 (字符串): 思考级别覆盖(例如 `low`, `medium`, `high`)。
- `timeoutSeconds` 可选 (数字): Agent 运行的最大持续时间(秒)。

效果:

- 运行一个 **隔离的** Agent 回合(拥有自己的 session 键)
- 始终向 **main** session 发布摘要
- 如果 `wakeMode=now`,触发立即心跳

## Session 键策略 (破坏性更改)

默认情况下禁用 `/hooks/agent` 载荷 `sessionKey` 覆盖。

- 推荐: 设置固定的 `hooks.defaultSessionKey` 并保持请求覆盖关闭。
- 可选: 仅在需要时允许请求覆盖,并限制前缀。

推荐配置:

```json5
{
  hooks: {
    enabled: true,
    token: "${OPENCLAW_HOOKS_TOKEN}",
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
  },
}
```

兼容性配置 (旧版行为):

```json5
{
  hooks: {
    enabled: true,
    token: "${OPENCLAW_HOOKS_TOKEN}",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:"], // 强烈推荐
  },
}
```

### `POST /hooks/<name>` (映射)

自定义 hook 名称通过 `hooks.mappings` 解析(参见配置)。映射可以将任意载荷转换为 `wake` 或 `agent` 动作,带有可选的模板或代码转换。

映射选项(摘要):

- `hooks.presets: ["gmail"]` 启用内置的 Gmail 映射。
- `hooks.mappings` 允许你在配置中定义 `match`, `action`, 和模板。
- `hooks.transformsDir` + `transform.module` 加载 JS/TS 模块以进行自定义逻辑。
  - `hooks.transformsDir` (如果设置) 必须保持在你的 OpenClaw 配置目录下的转换根目录内 (通常是 `~/.openclaw/hooks/transforms`)。
  - `transform.module` 必须在有效的转换目录内解析 (拒绝遍历/转义路径)。
- 使用 `match.source` 保持通用摄取端点(载荷驱动路由)。
- TS 转换需要运行时有 TS 加载器(例如 `bun` 或 `tsx`) 或预编译的 `.js`。
- 在映射上设置 `deliver: true` + `channel`/`to` 以将回复路由到聊天界面
  (`channel` 默认为 `last` 并回退到 WhatsApp)。
- `agentId` 将 hook 路由到特定 Agent;未知 ID 回退到默认 Agent。
- `hooks.allowedAgentIds` 限制显式 `agentId` 路由。省略它 (或包含 `*`) 以允许任何 Agent。设置 `[]` 以拒绝显式 `agentId` 路由。
- `hooks.defaultSessionKey` 在未提供显式键时为 hook Agent 运行设置默认 session。
- `hooks.allowRequestSessionKey` 控制 `/hooks/agent` 载荷是否可以设置 `sessionKey` (默认: `false`)。
- `hooks.allowedSessionKeyPrefixes` 可选地限制来自请求载荷和映射的显式 `sessionKey` 值。
- `allowUnsafeExternalContent: true` 禁用该 hook 的外部内容安全包装器
  (危险;仅适用于受信任的内部来源)。
- `openclaw webhooks gmail setup` 为 `openclaw webhooks gmail run` 写入 `hooks.gmail` 配置。
  有关完整的 Gmail watch 流程,请参见 [Gmail Pub/Sub](/automation/gmail-pubsub)。

## 响应

- `200` 对于 `/hooks/wake`
- `200` 对于 `/hooks/agent` (异步运行已接受)
- `401` 认证失败
- `429` 来自同一客户端的重复认证失败后 (检查 `Retry-After`)
- `400` 无效载荷
- `413` 超大载荷

## 示例

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","wakeMode":"next-heartbeat"}'
```

### 使用不同的模型

向 Agent 载荷(或映射) 添加 `model` 以覆盖该次运行的模型:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.2-mini"}'
```

如果你强制执行 `agents.defaults.models`,请确保覆盖模型包含在其中。

```bash
curl -X POST http://127.0.0.1:18789/hooks/gmail \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"source":"gmail","messages":[{"from":"Ada","subject":"Hello","snippet":"Hi"}]}'
```

## 安全

- 将 hook 端点保持在回环、tailnet 或受信任的反向代理后面。
- 使用专用的 hook 令牌；不要重用 Gateway 认证令牌。
- 优先使用具有严格 `tools.profile` 和沙箱的专用 hook Agent，使 hook 入口具有更窄的影响范围。
- 重复的认证失败会按客户端地址进行速率限制，以减缓暴力破解尝试。
- 如果你使用多 Agent 路由,设置 `hooks.allowedAgentIds` 以限制显式 `agentId` 选择。
- 保持 `hooks.allowRequestSessionKey=false` 除非你需要调用者选择的 session。
- 如果你启用请求 `sessionKey`,限制 `hooks.allowedSessionKeyPrefixes` (例如 `["hook:"]`)。
- 避免在 webhook 日志中包含敏感的原始载荷。
- 默认情况下,hook 载荷被视为不受信任并用安全边界包裹。
  如果你必须为特定 hook 禁用此功能,请在该 hook 的映射中设置 `allowUnsafeExternalContent: true`
  (危险)。
