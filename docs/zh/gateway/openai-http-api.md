---
mmh3_hash: "db58566fa2ebbb5c4f13abda29a09068"
summary: "从 Gateway 公开兼容 OpenAI 的 /v1/chat/completions HTTP 端点"
read_when:
  - 集成期望 OpenAI Chat Completions 的工具
title: "OpenAI chat completions"
---

OpenClaw 的 Gateway 可以提供一个小的 OpenAI 兼容的 Chat Completions 端点。

此端点**默认禁用**。首先在配置中启用它。

- `POST /v1/chat/completions`
- 与 Gateway 相同的端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/v1/chat/completions`

启用 Gateway 的 OpenAI 兼容 HTTP 接口后，它还会提供：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

在底层，请求作为正常的 Gateway Agent 运行执行（与 `openclaw agent` 相同的代码路径），因此路由/权限/配置与您的 Gateway 匹配。

## 认证

使用 Gateway 认证配置。

常见 HTTP 认证路径：

- 共享密钥认证（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 受信任身份感知 HTTP 认证（`gateway.auth.mode="trusted-proxy"`）：
  通过配置的身份感知代理路由，让其注入所需的身份头
- 私有 ingress 开放认证（`gateway.auth.mode="none"`）：
  无需认证头

注意：

- 当 `gateway.auth.mode="token"` 时，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 当 `gateway.auth.mode="password"` 时，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 当 `gateway.auth.mode="trusted-proxy"` 时，HTTP 请求必须来自配置的受信任代理来源；同一主机的回环代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。
- 绕过代理的内部同一主机调用者可以使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 作为本地直接回退。任何 `Forwarded`、`X-Forwarded-*` 或 `X-Real-IP` 头证据都会使请求保持在 trusted-proxy 路径上。
- 如果配置了 `gateway.auth.rateLimit` 且发生太多认证失败，端点返回 `429` 和 `Retry-After`。

## 安全边界（重要）

将此端点视为 Gateway 实例的**完整 Operator 访问**接口。

- 此处的 HTTP Bearer 认证不是狭义的按用户范围模型。
- 此端点有效的 Gateway token/password 应被视为 owner/operator 凭证。
- 请求通过与受信任 Operator 操作相同的控制平面 Agent 路径运行。
- 此端点没有独立的非 owner/按用户工具边界；一旦调用者通过此处的 Gateway 认证，OpenClaw 将该调用者视为此 Gateway 的受信任 Operator。
- 对于共享密钥认证模式（`token` 和 `password`），即使调用者发送了更窄的 `x-openclaw-scopes` 头，端点也会恢复正常的完整 Operator 默认值。
- 受信任身份感知 HTTP 模式（例如 trusted proxy 认证或 `gateway.auth.mode="none"`）在存在 `x-openclaw-scopes` 时遵循它，否则回退到正常 Operator 默认范围集。
- 如果目标 Agent 策略允许敏感工具，此端点可以使用它们。
- 仅在回环/tailnet/私有 ingress 上保留此端点；不要将其直接暴露到公共互联网。

认证矩阵：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 证明持有共享 Gateway Operator 密钥
  - 忽略更窄的 `x-openclaw-scopes`
  - 恢复完整的默认 Operator 范围集：
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - 将此端点上的聊天轮次视为 owner-sender 轮次
- 受信任身份感知 HTTP 模式（例如 trusted proxy 认证，或私有 ingress 上的 `gateway.auth.mode="none"`）
  - 认证某个外部受信任身份或部署边界
  - 当头存在时遵循 `x-openclaw-scopes`
  - 当头不存在时回退到正常 Operator 默认范围集
  - 仅当调用者明确缩小范围并省略 `operator.admin` 时才失去 owner 语义

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

## Session 行为

默认情况下，端点是**每个请求无状态的**（每次调用生成一个新的 Session 键）。

如果请求包含 OpenAI `user` 字符串，Gateway 从中派生一个稳定的 Session 键，因此重复调用可以共享 Agent Session。

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

## 流式传输（SSE）

设置 `stream: true` 以接收 Server-Sent Events（SSE）：

- `Content-Type: text/event-stream`
- 每个事件行是 `data: <json>`
- 流以 `data: [DONE]` 结束

## Chat 工具契约

`/v1/chat/completions` 支持与常见 OpenAI Chat 客户端兼容的函数工具子集。

### 支持的请求字段

- `tools`：`{ "type": "function", "function": { ... } }` 数组
- `tool_choice`：`"auto"`、`"none"`
- `messages[*].role: "tool"` 后续轮次
- `messages[*].tool_call_id`：将工具结果绑定回先前工具调用
- `max_completion_tokens`：数字；每次调用完成 token 总数上限（含推理 token）。当前 OpenAI Chat Completions 字段名；同时发送 `max_completion_tokens` 和 `max_tokens` 时优先使用。
- `max_tokens`：数字；向后兼容接受的旧版别名。当 `max_completion_tokens` 也存在时忽略。
- `temperature`：数字；尽力而为的采样温度，通过 Agent 流参数通道转发给上游 provider。
- `top_p`：数字；尽力而为的核采样，通过 Agent 流参数通道转发给上游 provider。

当设置任一 token 上限字段时，该值通过 Agent 流参数通道转发给上游 provider。发送给上游 provider 的实际 wire 字段名由 provider 传输选择：OpenAI 系列端点使用 `max_completion_tokens`，仅接受旧版名称的 provider（如 Mistral 和 Chutes）使用 `max_tokens`。采样字段（`temperature`、`top_p`）遵循相同的流参数通道；基于 ChatGPT 的 Codex Responses 后端在服务器端剥离它们，因为它使用固定采样。

### 不支持的变体

对于不支持的工具变体，端点返回 `400 invalid_request_error`，包括：

- 非数组 `tools`
- 非函数工具条目
- 缺少 `tool.function.name`
- `tool_choice` 变体，如 `allowed_tools` 和 `custom`
- `tool_choice: "required"`（运行时尚未强制执行；实现硬性强制后将支持）
- `tool_choice: { "type": "function", "function": { "name": "..." } }`（与 `required` 相同的原因）
- 与提供的 `tools` 不匹配的 `tool_choice.function.name` 值

### 非流式工具响应形状

当 Agent 决定调用工具时，响应使用：

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` 条目，包含：
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments`（JSON 字符串）

工具调用前的 Assistant 注释在 `choices[0].message.content` 中返回（可能为空）。

### 流式工具响应形状

当 `stream: true` 时，工具调用作为增量 SSE 块发出：

- 初始 assistant role delta
- 可选的 assistant 注释 delta
- 一个或多个携带工具标识和参数片段的 `delta.tool_calls` 块
- 带 `finish_reason: "tool_calls"` 的最终块
- `data: [DONE]`

如果 `stream_options.include_usage=true`，在 `[DONE]` 之前会发出一个尾随使用量块。

### 工具后续循环

收到 `tool_calls` 后，客户端应执行请求的函数，并发送包含以下内容的后续请求：

- 先前的 assistant 工具调用消息
- 一个或多个带有匹配 `tool_call_id` 的 `role: "tool"` 消息

这允许 Gateway Agent 运行继续相同的推理循环并生成最终 assistant 答案。

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

非流式传输：

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

流式传输：

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
