---
mmh3_hash: "bd2a47d101f769abc9be7484685410a4"
summary: "从 Gateway 公开兼容 OpenAI 的 /v1/chat/completions HTTP 端点"
read_when:
  - 集成期望 OpenAI Chat Completions 的工具
title: "OpenAI Chat Completions"
---

# OpenAI Chat Completions (HTTP)

OpenClaw 的 Gateway 可以提供一个小的 OpenAI 兼容的 Chat Completions 端点。

此端点**默认禁用**。首先在配置中启用它。

- `POST /v1/chat/completions`
- 与 Gateway 相同的端口(WS + HTTP 多路复用):`http://<gateway-host>:<port>/v1/chat/completions`

在底层,请求作为正常的 Gateway Agent 运行执行(与 `openclaw agent` 相同的代码路径),因此路由/权限/配置与您的 Gateway 匹配。

## 认证

使用 Gateway 认证配置。发送 Bearer 令牌:

- `Authorization: Bearer <token>`

注意:

- 当 `gateway.auth.mode="token"` 时,使用 `gateway.auth.token`(或 `OPENCLAW_GATEWAY_TOKEN`)。
- 当 `gateway.auth.mode="password"` 时,使用 `gateway.auth.password`(或 `OPENCLAW_GATEWAY_PASSWORD`)。
- 如果配置了 `gateway.auth.rateLimit` 且发生太多认证失败,端点返回 `429` 和 `Retry-After`。

## 安全边界(重要)

将此端点视为 Gateway 实例的**完全操作员访问**界面。

- 此处的 HTTP Bearer 认证不是针对每个用户的狭窄范围模型。
- 此端点的有效 Gateway token/password 应被视为所有者/操作员凭证。
- 请求通过与受信任的操作员操作相同的控制平面 Agent 路径运行。
- 如果目标 Agent 策略允许敏感工具,此端点可以使用它们。
- 仅在 loopback/tailnet/私有入口保留此端点;不要将其直接暴露到公共互联网。

参见 [Security](/gateway/security) 和 [Remote access](/gateway/remote)。

## 选择 Agent

不需要自定义标头:在 OpenAI `model` 字段中编码 Agent ID:

- `model: "openclaw:<agentId>"`(示例:`"openclaw:main"`、`"openclaw:beta"`)
- `model: "agent:<agentId>"`(别名)

或通过标头定位特定的 OpenClaw Agent:

- `x-openclaw-agent-id: <agentId>`(默认:`main`)

高级:

- `x-openclaw-session-key: <sessionKey>` 以完全控制 Session 路由。

## 启用端点

将 `gateway.http.endpoints.chatCompletions.enabled` 设置为 `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true }
      }
    }
  }
}
```

## 禁用端点

将 `gateway.http.endpoints.chatCompletions.enabled` 设置为 `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false }
      }
    }
  }
}
```

## Session 行为

默认情况下,端点是**每个请求无状态的**(每次调用生成一个新的 Session 键)。

如果请求包含 OpenAI `user` 字符串,Gateway 从中派生一个稳定的 Session 键,因此重复调用可以共享 Agent Session。

## 流式传输(SSE)

设置 `stream: true` 以接收 Server-Sent Events(SSE):

- `Content-Type: text/event-stream`
- 每个事件行是 `data: <json>`
- 流以 `data: [DONE]` 结束

## 示例

非流式传输:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

流式传输:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```
