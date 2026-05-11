---
mmh3_hash: "dfb542253294029df8d4b5514dd4eb17"
summary: "从 Gateway 公开兼容 OpenAI 的 /v1/chat/completions HTTP 端点"
read_when:
  - 集成期望 OpenAI Chat Completions 的工具
title: "OpenAI chat completions"
---


OpenClaw 的 Gateway 可以提供一个小的 OpenAI 兼容的 Chat Completions 端点。

此端点**默认禁用**。首先在配置中启用它。

- `POST /v1/chat/completions`
- 与 Gateway 相同的端口(WS + HTTP 多路复用):`http://<gateway-host>:<port>/v1/chat/completions`

启用 Gateway 的 OpenAI 兼容 HTTP 接口后,它还会提供:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

在底层,请求作为正常的 Gateway Agent 运行执行(与 `openclaw agent` 相同的代码路径),因此路由/权限/配置与您的 Gateway 匹配。

## 认证

使用 Gateway 认证配置。

常见 HTTP 认证路径:

- 共享密钥认证(`gateway.auth.mode="token"` 或 `"password"`):
  `Authorization: Bearer <token-or-password>`
- 受信任的身份承载 HTTP 认证(`gateway.auth.mode="trusted-proxy"`):
  通过已配置的身份感知代理路由，并让其注入所需的身份头
- 私有入口开放认证(`gateway.auth.mode="none"`):
  无需认证头

注意:

- 当 `gateway.auth.mode="token"` 时,使用 `gateway.auth.token`(或 `OPENCLAW_GATEWAY_TOKEN`)。
- 当 `gateway.auth.mode="password"` 时,使用 `gateway.auth.password`(或 `OPENCLAW_GATEWAY_PASSWORD`)。
- 当 `gateway.auth.mode="trusted-proxy"` 时,HTTP 请求必须来自已配置的非回环受信任代理源;同主机回环代理不满足此模式。
- 如果配置了 `gateway.auth.rateLimit` 且发生太多认证失败,端点返回 `429` 和 `Retry-After`。

## 安全边界(重要)

将此端点视为 Gateway 实例的**完全操作员访问**界面。

- 此处的 HTTP Bearer 认证不是针对每个用户的狭窄范围模型。
- 此端点的有效 Gateway token/password 应被视为所有者/操作员凭证。
- 请求通过与受信任的操作员操作相同的控制平面 Agent 路径运行。
- 此端点没有独立的非所有者/每用户工具边界；一旦调用者通过此处的 Gateway 认证，OpenClaw 将该调用者视为此 Gateway 的受信任操作员。
- 对于共享密钥认证模式（`token` 和 `password`），端点即使调用者发送了更窄的 `x-openclaw-scopes` 头，也会恢复正常的完整操作员默认值。
- 受信任的身份承载 HTTP 模式（例如受信任代理认证或 `gateway.auth.mode="none"`）在存在时遵守 `x-openclaw-scopes`，否则回退到正常的操作员默认范围集。
- 如果目标 Agent 策略允许敏感工具,此端点可以使用它们。
- 仅在 loopback/tailnet/私有入口保留此端点;不要将其直接暴露到公共互联网。

认证矩阵:

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 证明持有共享 Gateway 操作员密钥
  - 忽略更窄的 `x-openclaw-scopes`
  - 恢复完整的默认操作员范围集：
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - 将此端点上的聊天轮次视为所有者发送者轮次
- 受信任的身份承载 HTTP 模式（例如受信任代理认证，或私有入口上的 `gateway.auth.mode="none"`）
  - 认证某个外部受信任身份或部署边界
  - 在头存在时遵守 `x-openclaw-scopes`
  - 在头缺失时回退到正常的操作员默认范围集
  - 仅当调用者明确缩小范围并省略 `operator.admin` 时才失去所有者语义

参见 [Security](/gateway/security) 和 [Remote access](/gateway/remote)。

## 以 Agent 为先的模型契约

OpenClaw 将 OpenAI `model` 字段视为 **Agent 目标**，而不是原始 provider 模型 id。

- `model: "openclaw"` 路由到已配置的默认 Agent。
- `model: "openclaw/default"` 也路由到已配置的默认 Agent。
- `model: "openclaw/<agentId>"` 路由到特定 Agent。

可选请求头：

- `x-openclaw-model: <provider/model-or-bare-id>` 覆盖所选 Agent 的后端模型。
- `x-openclaw-agent-id: <agentId>` 作为兼容性覆盖仍然受支持。
- `x-openclaw-session-key: <sessionKey>` 完全控制 Session 路由。
- `x-openclaw-message-channel: <channel>` 设置 Channel 感知提示和策略的合成入口 Channel 上下文。

仍然接受的兼容性别名：

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## 启用端点

将 `gateway.http.endpoints.chatCompletions.enabled` 设置为 `true`:

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

将 `gateway.http.endpoints.chatCompletions.enabled` 设置为 `false`:

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

## Session 行为

默认情况下,端点是**每个请求无状态的**(每次调用生成一个新的 Session 键)。

如果请求包含 OpenAI `user` 字符串,Gateway 从中派生一个稳定的 Session 键,因此重复调用可以共享 Agent Session。

## 为什么这个接口重要

这是自托管前端和工具的最高价值兼容性集：

- 大多数 Open WebUI、LobeChat 和 LibreChat 设置期望 `/v1/models`。
- 许多 RAG 系统期望 `/v1/embeddings`。
- 现有的 OpenAI 聊天客户端通常可以从 `/v1/chat/completions` 开始。
- 更多 Agent 原生客户端越来越倾向于 `/v1/responses`。

## 模型列表和 Agent 路由

<AccordionGroup>
  <Accordion title="`/v1/models` 返回什么？">
    一个 OpenClaw Agent 目标列表。

    返回的 id 是 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>` 条目。
    直接将它们用作 OpenAI `model` 值。

  </Accordion>
  <Accordion title="`/v1/models` 列出 Agent 还是子 Agent？">
    它列出顶级 Agent 目标，而不是后端 provider 模型，也不是子 Agent。

    子 Agent 保持内部执行拓扑。它们不作为伪模型出现。

  </Accordion>
  <Accordion title="为什么包含 `openclaw/default`？">
    `openclaw/default` 是已配置默认 Agent 的稳定别名。

    这意味着即使真实的默认 Agent id 在环境之间发生变化，客户端也可以继续使用一个可预测的 id。

  </Accordion>
  <Accordion title="如何覆盖后端模型？">
    使用 `x-openclaw-model`。

    示例：
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    如果省略，所选 Agent 将使用其正常配置的模型选择运行。

  </Accordion>
  <Accordion title="嵌入如何符合此契约？">
    `/v1/embeddings` 使用相同的 Agent 目标 `model` id。

    使用 `model: "openclaw/default"` 或 `model: "openclaw/<agentId>"`。
    当您需要特定的嵌入模型时，在 `x-openclaw-model` 中发送它。
    没有该头，请求将通过所选 Agent 的正常嵌入设置。

  </Accordion>
</AccordionGroup>

## 流式传输(SSE)

设置 `stream: true` 以接收 Server-Sent Events(SSE):

- `Content-Type: text/event-stream`
- 每个事件行是 `data: <json>`
- 流以 `data: [DONE]` 结束

## Open WebUI 快速设置

基本 Open WebUI 连接：

- Base URL：`http://127.0.0.1:18789/v1`
- Docker on macOS base URL：`http://host.docker.internal:18789/v1`
- API key：您的 Gateway Bearer token
- Model：`openclaw/default`

预期行为：

- `GET /v1/models` 应列出 `openclaw/default`
- Open WebUI 应使用 `openclaw/default` 作为聊天模型 id
- 如果您想要该 Agent 的特定后端 provider/model，请设置 Agent 的正常默认模型或发送 `x-openclaw-model`

快速验证：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果返回 `openclaw/default`，大多数 Open WebUI 设置可以使用相同的 base URL 和 token 连接。

## 示例

非流式传输:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

流式传输:

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

创建嵌入：

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

- `/v1/models` 返回 OpenClaw Agent 目标，而不是原始 provider 目录。
- `openclaw/default` 始终存在，因此一个稳定的 id 在所有环境中都有效。
- 后端 provider/model 覆盖属于 `x-openclaw-model`，而不是 OpenAI `model` 字段。
- `/v1/embeddings` 支持 `input` 作为字符串或字符串数组。

## 相关

- [配置参考](/gateway/configuration-reference)
- [OpenAI](/providers/openai)
