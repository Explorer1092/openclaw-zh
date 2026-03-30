---
read_when:
  - 集成需要 OpenAI Chat Completions 的工具
summary: 从 Gateway 网关暴露 OpenAI 兼容的 /v1/chat/completions HTTP 端点
title: OpenAI Chat Completions
x-i18n:
  generated_at: "2026-02-03T07:48:15Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 16d216ae115d4dbaab9294b7cc93476e0a886f746f2416981217d39afa69bbd8
  source_path: gateway/openai-http-api.md
  workflow: 15
---

# OpenAI Chat Completions（HTTP）

OpenClaw 的 Gateway 网关可以提供一个小型的 OpenAI 兼容 Chat Completions 端点。

此端点**默认禁用**。请先在配置中启用它。

- `POST /v1/chat/completions`
- 与 Gateway 网关相同的端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/v1/chat/completions`

当 Gateway 网关的 OpenAI 兼容 HTTP 接口启用时，还会提供：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

底层实现中，请求作为普通的 Gateway 网关智能体运行执行（与 `openclaw agent` 相同的代码路径），因此路由/权限/配置与你的 Gateway 网关一致。

## 认证

使用 Gateway 网关认证配置。发送 bearer 令牌：

- `Authorization: Bearer <token>`

注意事项：

- 当 `gateway.auth.mode="token"` 时，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 当 `gateway.auth.mode="password"` 时，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 如果配置了 `gateway.auth.rateLimit` 且发生过多认证失败，端点会返回带 `Retry-After` 的 `429`。

## 安全边界（重要）

将此端点视为该 Gateway 网关实例的**完整操作员访问**接口。

- 此处的 HTTP bearer 认证不是窄范围的单用户模型。
- 此端点的有效 Gateway 令牌/密码应视为所有者/操作员凭证。
- 请求与受信任的操作员操作走相同的控制平面智能体路径。
- 此端点上没有单独的非所有者/单用户工具边界；一旦调用者通过此处的 Gateway 认证，OpenClaw 将该调用者视为此 Gateway 的受信任操作员。
- 如果目标智能体策略允许敏感工具，此端点可以使用它们。
- 请将此端点仅保留在 loopback/tailnet/私有入口；不要直接向公共互联网暴露。

参见 [安全](/gateway/security) 和 [远程访问](/gateway/remote)。

## 智能体优先的模型合约

OpenClaw 将 OpenAI `model` 字段视为**智能体目标**，而非原始提供商模型 ID。

- `model: "openclaw"` 路由到已配置的默认智能体。
- `model: "openclaw/default"` 也路由到已配置的默认智能体。
- `model: "openclaw/<agentId>"` 路由到特定智能体。

可选请求头：

- `x-openclaw-model: <provider/model-or-bare-id>` 为选定的智能体覆盖后端模型。
- `x-openclaw-agent-id: <agentId>` 作为兼容性覆盖仍受支持。
- `x-openclaw-session-key: <sessionKey>` 完全控制会话路由。
- `x-openclaw-message-channel: <channel>` 为支持渠道感知的提示和策略设置合成入站渠道上下文。

仍接受的兼容别名：

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## 启用端点

将 `gateway.http.endpoints.chatCompletions.enabled` 设置为 `true`：

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## 禁用端点

将 `gateway.http.endpoints.chatCompletions.enabled` 设置为 `false`：

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## 会话行为

默认情况下，端点是**每请求无状态**的（每次调用生成新的会话键）。

如果请求包含 OpenAI `user` 字符串，Gateway 网关会从中派生一个稳定的会话键，因此重复调用可以共享智能体会话。

## 为什么这组接口很重要

这是自托管前端和工具中兼容性最高的接口集：

- 大多数 Open WebUI、LobeChat 和 LibreChat 设置需要 `/v1/models`。
- 许多 RAG 系统需要 `/v1/embeddings`。
- 现有 OpenAI 聊天客户端通常可以从 `/v1/chat/completions` 开始使用。
- 更多智能体原生客户端越来越倾向于使用 `/v1/responses`。

## 模型列表与智能体路由

<AccordionGroup>
  <Accordion title="`/v1/models` 返回什么？">
    OpenClaw 智能体目标列表。

    返回的 ID 是 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>` 条目。
    直接将它们用作 OpenAI `model` 值。

  </Accordion>
  <Accordion title="`/v1/models` 列出智能体还是子智能体？">
    它列出顶级智能体目标，而非后端提供商模型，也不包含子智能体。

    子智能体保持内部执行拓扑。它们不会作为伪模型出现。

  </Accordion>
  <Accordion title="为什么包含 `openclaw/default`？">
    `openclaw/default` 是已配置默认智能体的稳定别名。

    这意味着即使实际默认智能体 ID 在不同环境之间变化，客户端也可以继续使用一个可预测的 ID。

  </Accordion>
  <Accordion title="如何覆盖后端模型？">
    使用 `x-openclaw-model`。

    示例：
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.4`

    如果省略，选定的智能体将使用其正常配置的模型选择。

  </Accordion>
  <Accordion title="Embedding 如何适配这个合约？">
    `/v1/embeddings` 使用相同的智能体目标 `model` ID。

    使用 `model: "openclaw/default"` 或 `model: "openclaw/<agentId>"`。
    当你需要特定的 Embedding 模型时，在 `x-openclaw-model` 中发送它。
    不带该头时，请求会透传到选定智能体的正常 Embedding 设置。

  </Accordion>
</AccordionGroup>

## 流式传输（SSE）

设置 `stream: true` 以接收 Server-Sent Events（SSE）：

- `Content-Type: text/event-stream`
- 每个事件行是 `data: <json>`
- 流以 `data: [DONE]` 结束

## Open WebUI 快速设置

对于基本的 Open WebUI 连接：

- Base URL：`http://127.0.0.1:18789/v1`
- macOS 上 Docker 的 Base URL：`http://host.docker.internal:18789/v1`
- API key：你的 Gateway bearer 令牌
- 模型：`openclaw/default`

预期行为：

- `GET /v1/models` 应列出 `openclaw/default`
- Open WebUI 应使用 `openclaw/default` 作为聊天模型 ID
- 如果你想为该智能体指定特定的后端提供商/模型，请设置智能体的正常默认模型或发送 `x-openclaw-model`

快速验证：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果返回 `openclaw/default`，大多数 Open WebUI 设置可以使用相同的 base URL 和令牌连接。

## 示例

非流式：

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

流式：

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

列出模型：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

获取单个模型：

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

创建 Embedding：

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

注意事项：

- `/v1/models` 返回 OpenClaw 智能体目标，而非原始提供商目录。
- `openclaw/default` 始终存在，因此一个稳定 ID 可在各环境中使用。
- 后端提供商/模型覆盖放在 `x-openclaw-model` 中，而非 OpenAI `model` 字段。
- `/v1/embeddings` 支持 `input` 为字符串或字符串数组。
