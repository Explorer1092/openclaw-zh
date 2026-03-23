---
mmh3_hash: "6ac0a81ee1db86023d8239090c01c78a"
summary: "通过 Gateway HTTP 端点直接调用单个工具"
read_when:
  - 在不运行完整 Agent 轮次的情况下调用工具
  - 构建需要工具策略强制执行的自动化
title: "Tools Invoke API"
---

# Tools Invoke (HTTP)

OpenClaw 的 Gateway 暴露了一个简单的 HTTP 端点,用于直接调用单个工具。它始终启用,但受 Gateway 身份验证和工具策略控制。

- `POST /tools/invoke`
- 与 Gateway 相同的端口(WS + HTTP 多路复用):`http://<gateway-host>:<port>/tools/invoke`

默认最大有效载荷大小为 2 MB。

## 身份验证

使用 Gateway 身份验证配置。发送 Bearer 令牌:

- `Authorization: Bearer <token>`

注意:

- 当 `gateway.auth.mode="token"` 时,使用 `gateway.auth.token`(或 `OPENCLAW_GATEWAY_TOKEN`)。
- 当 `gateway.auth.mode="password"` 时,使用 `gateway.auth.password`(或 `OPENCLAW_GATEWAY_PASSWORD`)。
- 如果配置了 `gateway.auth.rateLimit` 且发生太多认证失败,端点返回 `429` 和 `Retry-After`。

## 请求正文

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

字段:

- `tool`(字符串,必需):要调用的工具名称。
- `action`(字符串,可选):如果工具架构支持 `action` 且 args 有效载荷省略了它,则映射到 args。
- `args`(对象,可选):工具特定的参数。
- `sessionKey`(字符串,可选):目标 Session 键。如果省略或 `"main"`,Gateway 使用配置的主 Session 键(遵守 `session.mainKey` 和默认 Agent,或全局作用域中的 `global`)。
- `dryRun`(布尔值,可选):保留供将来使用;当前忽略。

## 策略 + 路由行为

工具可用性通过 Gateway Agent 使用的相同策略链过滤:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 群组策略(如果 Session 键映射到群组或 Channel)
- 子 Agent 策略(当使用子 Agent Session 键调用时)

如果策略不允许工具,端点返回 **404**。

Gateway HTTP 还默认应用硬拒绝列表(即使 Session 策略允许工具):

- `sessions_spawn`
- `sessions_send`
- `gateway`
- `whatsapp_login`

您可以通过 `gateway.tools` 自定义此拒绝列表:

```json5
{
  gateway: {
    tools: {
      // 通过 HTTP /tools/invoke 阻止的额外工具
      deny: ["browser"],
      // 从默认拒绝列表中删除工具
      allow: ["gateway"],
    },
  },
}
```

为帮助群组策略解析上下文,您可以选择性地设置:

- `x-openclaw-message-channel: <channel>`(示例:`slack`、`telegram`)
- `x-openclaw-account-id: <accountId>`(当存在多个账户时)

## 响应

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }`(无效请求或工具输入错误)
- `401` → 未授权
- `429` → 认证速率受限(`Retry-After` 已设置)
- `404` → 工具不可用(未找到或未列入允许列表)
- `405` → 方法不允许
- `500` → `{ ok: false, error: { type, message } }`(意外工具执行错误;清理的消息)

## 示例

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```
