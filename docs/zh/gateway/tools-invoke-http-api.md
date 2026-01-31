---
title: "工具调用 (HTTP)"
sidebarTitle: "工具调用"
mmh3_hash: "6afe0483405c853fd13d1a80aec88061"
summary: "通过网关 HTTP 端点直接调用单个工具"
read_when: ["在不运行完整代理轮次的情况下调用工具","构建需要工具策略强制执行的自动化"]
---
# 工具调用 (HTTP)

OpenClaw 的网关暴露了一个简单的 HTTP 端点,用于直接调用单个工具。它始终启用,但受网关身份验证和工具策略控制。

- `POST /tools/invoke`
- 与网关相同的端口(WS + HTTP 多路复用):`http://<gateway-host>:<port>/tools/invoke`

默认最大有效载荷大小为 2 MB。

## 身份验证

使用网关身份验证配置。发送承载令牌:

- `Authorization: Bearer <token>`

注意:
- 当 `gateway.auth.mode="token"` 时,使用 `gateway.auth.token`(或 `OPENCLAW_GATEWAY_TOKEN`)。
- 当 `gateway.auth.mode="password"` 时,使用 `gateway.auth.password`(或 `OPENCLAW_GATEWAY_PASSWORD`)。

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
- `action`(字符串,可选):如果工具模式支持 `action` 且 args 有效载荷省略了它,则映射到 args。
- `args`(对象,可选):工具特定的参数。
- `sessionKey`(字符串,可选):目标会话密钥。如果省略或 `"main"`,网关使用配置的主会话密钥(遵守 `session.mainKey` 和默认代理,或全局范围中的 `global`)。
- `dryRun`(布尔值,可选):保留供将来使用;当前忽略。

## 策略 + 路由行为

工具可用性通过网关代理使用的相同策略链过滤:
- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 群组策略(如果会话密钥映射到群组或通道)
- 子代理策略(当使用子代理会话密钥调用时)

如果策略不允许工具,端点返回 **404**。

为帮助群组策略解析上下文,您可以选择性地设置:
- `x-openclaw-message-channel: <channel>`(示例:`slack`、`telegram`)
- `x-openclaw-account-id: <accountId>`(当存在多个账户时)

## 响应

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }`(无效请求或工具错误)
- `401` → 未授权
- `404` → 工具不可用(未找到或未列入白名单)
- `405` → 方法不允许

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
