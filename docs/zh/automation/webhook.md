---
title: "Webhook"
sidebarTitle: "Webhook"
mmh3_hash: "632610c706c4db1c57e311d96d95067c"
summary: "用于唤醒和隔离智能体运行的 Webhook 入口"
read_when: ["添加或更改 webhook 端点时","将外部系统连接到 OpenClaw 时"]
---

# Webhook

网关可以为外部触发器暴露一个小型 HTTP webhook 端点。

## 启用

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks"
  }
}
```

注意：
- 当 `hooks.enabled=true` 时，`hooks.token` 是必需的。
- `hooks.path` 默认为 `/hooks`。

## 认证

每个请求必须包含 hook 令牌。首选标头：
- `Authorization: Bearer <token>` (推荐)
- `x-openclaw-token: <token>`
- `?token=<token>` (已弃用；记录警告并将在未来的主要版本中删除)

## 端点

### `POST /hooks/wake`

载荷：
```json
{ "text": "System line", "mode": "now" }
```

- `text` **必需** (字符串): 事件描述 (例如 "New email received")。
- `mode` 可选 (`now` | `next-heartbeat`): 是否触发立即心跳 (默认 `now`) 或等待下一次定期检查。

效果：
- 为 **主** 会话排队一个系统事件
- 如果 `mode=now`，触发立即心跳

### `POST /hooks/agent`

载荷：
```json
{
  "message": "Run this",
  "name": "Email",
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

- `message` **必需** (字符串): 供智能体处理的提示词或消息。
- `name` 可选 (字符串): Hook 的人类可读名称 (例如 "GitHub")，用作会话摘要中的前缀。
- `sessionKey` 可选 (字符串): 用于标识智能体会话的键。默认为随机 `hook:<uuid>`。使用一致的键允许在 hook 上下文中进行多轮对话。
- `wakeMode` 可选 (`now` | `next-heartbeat`): 是否触发立即心跳 (默认 `now`) 或等待下一次定期检查。
- `deliver` 可选 (布尔值): 如果为 `true`，智能体的响应将发送到消息频道。默认为 `true`。仅包含心跳确认的响应会自动跳过。
- `channel` 可选 (字符串): 用于传递的消息频道。之一：`last`, `whatsapp`, `telegram`, `discord`, `slack`, `mattermost` (插件), `signal`, `imessage`, `msteams`。默认为 `last`。
- `to` 可选 (字符串): 频道的接收者标识符 (例如 WhatsApp/Signal 的电话号码，Telegram 的聊天 ID，Discord/Slack/Mattermost (插件) 的频道 ID，MS Teams 的对话 ID)。默认为主会话中的最后一个接收者。
- `model` 可选 (字符串): 模型覆盖 (例如 `anthropic/claude-3.5-sonnet` 或别名)。如果受限，必须在允许的模型列表中。
- `thinking` 可选 (字符串): 思考级别覆盖 (例如 `low`, `medium`, `high`)。
- `timeoutSeconds` 可选 (数字): 智能体运行的最大持续时间（秒）。

效果：
- 运行一个 **隔离的** 智能体回合 (拥有自己的会话键) 
- 始终向 **主** 会话发布摘要
- 如果 `wakeMode=now`，触发立即心跳

### `POST /hooks/<name>` (映射)

自定义 hook 名称通过 `hooks.mappings` 解析（参见配置）。映射可以将任意载荷转换为 `wake` 或 `agent` 动作，带有可选的模板或代码转换。

映射选项 (摘要):
- `hooks.presets: ["gmail"]` 启用内置的 Gmail 映射。
- `hooks.mappings` 允许你在配置中定义 `match`, `action`, 和模板。
- `hooks.transformsDir` + `transform.module` 加载 JS/TS 模块以进行自定义逻辑。
- 使用 `match.source` 保持通用摄取端点（载荷驱动路由）。
- TS 转换需要运行时有 TS 加载器 (例如 `bun` 或 `tsx`) 或预编译的 `.js`。
- 在映射上设置 `deliver: true` + `channel`/`to` 以将回复路由到聊天界面
  (`channel` 默认为 `last` 并回退到 WhatsApp)。
- `allowUnsafeExternalContent: true` 禁用该 hook 的外部内容安全包装器
  (危险；仅适用于受信任的内部来源)。
- `openclaw webhooks gmail setup` 为 `openclaw webhooks gmail run` 写入 `hooks.gmail` 配置。
有关完整的 Gmail 监视流程，请参见 [Gmail Pub/Sub](/automation/gmail-pubsub)。

## 响应

- `200` 对于 `/hooks/wake`
- `202` 对于 `/hooks/agent` (异步运行已开始)
- `401` 认证失败
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

向智能体载荷（或映射）添加 `model` 以覆盖该次运行的模型：

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.2-mini"}'
```

如果你强制执行 `agents.defaults.models`，请确保覆盖模型包含在其中。

```bash
curl -X POST http://127.0.0.1:18789/hooks/gmail \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"source":"gmail","messages":[{"from":"Ada","subject":"Hello","snippet":"Hi"}]}'
```

## 安全

- 将 hook 端点保持在回环、tailnet 或受信任的反向代理后面。
- 使用专用的 hook 令牌；不要重用网关认证令牌。
- 避免在 webhook 日志中包含敏感的原始载荷。
- 默认情况下，hook 载荷被视为不受信任并用安全边界包裹。 
  如果你必须为特定 hook 禁用此功能，请在该 hook 的映射中设置 `allowUnsafeExternalContent: true`
  (危险)。

```
