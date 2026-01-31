---
title: "OpenAI Chat Completions(HTTP)"
mmh3_hash: "5d8a167b36a7e912ac3fe56d0cbbfdde"
summary: "从 Gateway 公开兼容 OpenAI 的 /v1/chat/completions HTTP 端点"
read_when:
  - 集成期望 OpenAI Chat Completions 的工具
---
# OpenAI Chat Completions(HTTP)

OpenClaw 的 Gateway 可以提供一个小的 OpenAI 兼容的 Chat Completions 端点。

此端点**默认禁用**。首先在配置中启用它。

- `POST /v1/chat/completions`
- 与 Gateway 相同的端口(WS + HTTP 多路复用):`http://<gateway-host>:<port>/v1/chat/completions`

在底层,请求作为正常的 Gateway agent 运行执行(与 `openclaw agent` 相同的代码路径),因此路由/权限/配置与您的 Gateway 匹配。

## 认证

使用 Gateway 认证配置。发送 bearer 令牌:

- `Authorization: Bearer <token>`

注意:
- 当 `gateway.auth.mode="token"` 时,使用 `gateway.auth.token`(或 `OPENCLAW_GATEWAY_TOKEN`)。
- 当 `gateway.auth.mode="password"` 时,使用 `gateway.auth.password`(或 `OPENCLAW_GATEWAY_PASSWORD`)。

## 选择 agent

不需要自定义标头:在 OpenAI `model` 字段中编码 agent id:

- `model: "openclaw:<agentId>"`(示例:`"openclaw:main"`、`"openclaw:beta"`)
- `model: "agent:<agentId>"`(别名)

或通过标头定位特定的 OpenClaw agent:

- `x-openclaw-agent-id: <agentId>`(默认:`main`)

高级:
- `x-openclaw-session-key: <sessionKey>` 以完全控制 session 路由。

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

默认情况下,端点是**每个请求无状态的**(每次调用生成一个新的 session 键)。

如果请求包含 OpenAI `user` 字符串,Gateway 从中派生一个稳定的 session 键,因此重复调用可以共享 agent session。

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
