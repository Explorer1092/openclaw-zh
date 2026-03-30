---
read_when:
  - 集成使用 OpenResponses API 的客户端
  - 你需要基于 item 的输入、客户端工具调用或 SSE 事件
summary: 从 Gateway 网关暴露兼容 OpenResponses 的 /v1/responses HTTP 端点
title: OpenResponses API
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: anthropic
  source_hash: d8c2c04093c2b340613849c4e9c56cdc13c60f55f42cbadd2df4284756ce31c2
  source_path: gateway/openresponses-http-api.md
  workflow: 15
---

# OpenResponses API（HTTP）

OpenClaw 的 Gateway 网关可以提供兼容 OpenResponses 的 `POST /v1/responses` 端点。

此端点**默认禁用**。请先在配置中启用。

- `POST /v1/responses`
- 与 Gateway 网关相同的端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/v1/responses`

底层实现中，请求作为正常的 Gateway 网关智能体运行执行（与 `openclaw agent` 相同的代码路径），因此路由/权限/配置与你的 Gateway 网关一致。

## 认证、安全与路由

操作行为与 [OpenAI Chat Completions](/gateway/openai-http-api) 相同：

- 使用 `Authorization: Bearer <token>` 配合正常的 Gateway 网关认证配置
- 将端点视为该 Gateway 网关实例的完整操作员访问接口
- 使用 `model: "openclaw"`、`model: "openclaw/default"`、`model: "openclaw/<agentId>"` 或 `x-openclaw-agent-id` 选择智能体
- 当需要覆盖选定智能体的后端模型时使用 `x-openclaw-model`
- 使用 `x-openclaw-session-key` 进行显式会话路由
- 当需要非默认的合成入站渠道上下文时使用 `x-openclaw-message-channel`

使用 `gateway.http.endpoints.responses.enabled` 启用或禁用此端点。

同一兼容接口还包括：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

关于智能体目标模型、`openclaw/default`、Embedding 透传和后端模型覆盖如何配合使用的权威说明，请参阅 [OpenAI Chat Completions](/gateway/openai-http-api#agent-first-model-contract) 和 [模型列表与智能体路由](/gateway/openai-http-api#model-list-and-agent-routing)。

## 会话行为

默认情况下，端点**每个请求都是无状态的**（每次调用生成新的会话键）。

如果请求包含 OpenResponses `user` 字符串，Gateway 网关会从中派生稳定的会话键，这样重复调用可以共享智能体会话。

## 请求结构（支持的）

请求遵循 OpenResponses API，使用基于 item 的输入。当前支持：

- `input`：字符串或 item 对象数组。
- `instructions`：合并到系统提示中。
- `tools`：客户端工具定义（函数工具）。
- `tool_choice`：过滤或要求客户端工具。
- `stream`：启用 SSE 流式传输。
- `max_output_tokens`：尽力而为的输出限制（取决于提供商）。
- `user`：稳定的会话路由。

接受但**当前忽略**：

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

支持：

- `previous_response_id`：当请求保持在相同的智能体/用户/请求会话范围内时，OpenClaw 会复用之前的响应会话。

## Item（输入）

### `message`

角色：`system`、`developer`、`user`、`assistant`。

- `system` 和 `developer` 追加到系统提示。
- 最近的 `user` 或 `function_call_output` item 成为"当前消息"。
- 较早的 user/assistant 消息作为上下文历史包含。

### `function_call_output`（基于回合的工具）

将工具结果发送回模型：

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` 和 `item_reference`

为了 schema 兼容性而接受，但在构建提示时忽略。

## 工具（客户端函数工具）

使用 `tools: [{ type: "function", function: { name, description?, parameters? } }]` 提供工具。

如果智能体决定调用工具，响应返回一个 `function_call` 输出 item。然后你发送带有 `function_call_output` 的后续请求以继续回合。

## 图像（`input_image`）

支持 base64 或 URL 来源：

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

允许的 MIME 类型（当前）：`image/jpeg`、`image/png`、`image/gif`、`image/webp`、`image/heic`、`image/heif`。
最大大小（当前）：10MB。

## 文件（`input_file`）

支持 base64 或 URL 来源：

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

允许的 MIME 类型（当前）：`text/plain`、`text/markdown`、`text/html`、`text/csv`、`application/json`、`application/pdf`。

最大大小（当前）：5MB。

当前行为：

- 文件内容被解码并添加到**系统提示**，而不是用户消息，所以它保持临时性（不持久化在会话历史中）。
- PDF 被解析提取文本。如果发现的文本很少，前几页会被栅格化为图像并传递给模型。

PDF 解析使用 Node 友好的 `pdfjs-dist` legacy 构建（无 worker）。现代 PDF.js 构建期望浏览器 worker/DOM 全局变量，因此不在 Gateway 网关中使用。

URL 获取默认值：

- `files.allowUrl`：`true`
- `images.allowUrl`：`true`
- `maxUrlParts`：`8`（每个请求中基于 URL 的 `input_file` + `input_image` 部件总数）
- 请求受到保护（DNS 解析、私有 IP 阻止、重定向限制、超时）。
- 每种输入类型支持可选的主机名允许列表（`files.urlAllowlist`、`images.urlAllowlist`）。
  - 精确主机：`"cdn.example.com"`
  - 通配符子域名：`"*.assets.example.com"`（不匹配顶级域名）
  - 空或省略的允许列表意味着不限制主机名。
- 要完全禁用基于 URL 的获取，将 `files.allowUrl: false` 和/或 `images.allowUrl: false` 设置为 false。

## 文件 + 图像限制（配置）

默认值可在 `gateway.http.endpoints.responses` 下调整：

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

省略时的默认值：

- `maxBodyBytes`：20MB
- `maxUrlParts`：8
- `files.maxBytes`：5MB
- `files.maxChars`：200k
- `files.maxRedirects`：3
- `files.timeoutMs`：10s
- `files.pdf.maxPages`：4
- `files.pdf.maxPixels`：4,000,000
- `files.pdf.minTextChars`：200
- `images.maxBytes`：10MB
- `images.maxRedirects`：3
- `images.timeoutMs`：10s
- HEIC/HEIF 类型的 `input_image` 来源会被接受并在传递给提供商前标准化为 JPEG。

安全说明：

- URL 允许列表在获取前和重定向跳转时均会强制执行。
- 将主机名加入允许列表不会绕过私有/内部 IP 阻止。
- 对于暴露在互联网上的 Gateway 网关，除了应用层防护外，还要应用网络出口控制。
  参见 [安全](/gateway/security)。

## 流式传输（SSE）

设置 `stream: true` 接收 Server-Sent Events（SSE）：

- `Content-Type: text/event-stream`
- 每个事件行是 `event: <type>` 和 `data: <json>`
- 流以 `data: [DONE]` 结束

当前发出的事件类型：

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed`（出错时）

## 用量

当底层提供商报告令牌计数时，`usage` 会被填充。

## 错误

错误使用如下 JSON 对象：

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

常见情况：

- `401` 缺少/无效认证
- `400` 无效请求体
- `405` 错误的方法

## 示例

非流式：

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

流式：

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```
