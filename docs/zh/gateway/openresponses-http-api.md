---
title: "OpenResponses API(HTTP)"
mmh3_hash: "f922120ac612a764c59d4c1599a42f2c"
summary: "从 Gateway 公开兼容 OpenResponses 的 /v1/responses HTTP 端点"
read_when:
  - 集成使用 OpenResponses API 的客户端
  - 您想要基于 item 的输入、客户端工具调用或 SSE events
---
# OpenResponses API(HTTP)

OpenClaw 的 Gateway 可以提供兼容 OpenResponses 的 `POST /v1/responses` 端点。

此端点**默认禁用**。首先在配置中启用它。

- `POST /v1/responses`
- 与 Gateway 相同的端口(WS + HTTP 多路复用):`http://<gateway-host>:<port>/v1/responses`

在底层,请求作为正常的 Gateway agent 运行执行(与 `openclaw agent` 相同的代码路径),因此路由/权限/配置与您的 Gateway 匹配。

## 认证

使用 Gateway 认证配置。发送 bearer 令牌:

- `Authorization: Bearer <token>`

注意:
- 当 `gateway.auth.mode="token"` 时,使用 `gateway.auth.token`(或 `OPENCLAW_GATEWAY_TOKEN`)。
- 当 `gateway.auth.mode="password"` 时,使用 `gateway.auth.password`(或 `OPENCLAW_GATEWAY_PASSWORD`)。

## 选择 agent

不需要自定义标头:在 OpenResponses `model` 字段中编码 agent id:

- `model: "openclaw:<agentId>"`(示例:`"openclaw:main"`、`"openclaw:beta"`)
- `model: "agent:<agentId>"`(别名)

或通过标头定位特定的 OpenClaw agent:

- `x-openclaw-agent-id: <agentId>`(默认:`main`)

高级:
- `x-openclaw-session-key: <sessionKey>` 以完全控制 session 路由。

## 启用端点

将 `gateway.http.endpoints.responses.enabled` 设置为 `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: { enabled: true }
      }
    }
  }
}
```

## 禁用端点

将 `gateway.http.endpoints.responses.enabled` 设置为 `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: { enabled: false }
      }
    }
  }
}
```

## Session 行为

默认情况下,端点是**每个请求无状态的**(每次调用生成一个新的 session 键)。

如果请求包含 OpenResponses `user` 字符串,Gateway 从中派生一个稳定的 session 键,因此重复调用可以共享 agent session。

## 请求形状(支持)

请求遵循基于 item 的输入的 OpenResponses API。当前支持:

- `input`:字符串或 item 对象数组。
- `instructions`:合并到系统提示中。
- `tools`:客户端工具定义(function tools)。
- `tool_choice`:过滤或要求客户端工具。
- `stream`:启用 SSE 流式传输。
- `max_output_tokens`:尽力而为的输出限制(provider 依赖)。
- `user`:稳定的 session 路由。

接受但**当前忽略**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `previous_response_id`
- `truncation`

## Items(input)

### `message`
角色:`system`、`developer`、`user`、`assistant`。

- `system` 和 `developer` 附加到系统提示。
- 最近的 `user` 或 `function_call_output` item 成为"当前消息"。
- 较早的 user/assistant 消息作为上下文的历史包含在内。

### `function_call_output`(基于轮次的工具)

将工具结果发送回模型:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` 和 `item_reference`

接受以实现 schema 兼容性,但在构建提示时忽略。

## Tools(客户端 function tools)

使用 `tools: [{ type: "function", function: { name, description?, parameters? } }]` 提供工具。

如果 agent 决定调用工具,响应返回 `function_call` output item。然后,您使用 `function_call_output` 发送后续请求以继续轮次。

## Images(`input_image`)

支持 base64 或 URL 源:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

允许的 MIME 类型(当前):`image/jpeg`、`image/png`、`image/gif`、`image/webp`。最大大小(当前):10MB。

## Files(`input_file`)

支持 base64 或 URL 源:

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

允许的 MIME 类型(当前):`text/plain`、`text/markdown`、`text/html`、`text/csv`、`application/json`、`application/pdf`。

最大大小(当前):5MB。

当前行为:
- 文件内容被解码并添加到**系统提示**,而不是用户消息,因此它保持短暂(不在 session 历史中持久化)。
- PDFs 被解析为文本。如果找到很少的文本,第一页将被光栅化为图像并传递给模型。

PDF 解析使用 Node 友好的 `pdfjs-dist` 旧版构建(无 worker)。现代 PDF.js 构建期望浏览器 workers/DOM 全局变量,因此不在 Gateway 中使用。

URL 获取默认值:
- `files.allowUrl`:`true`
- `images.allowUrl`:`true`
- 请求受到保护(DNS 解析、私有 IP 阻止、重定向上限、超时)。

## 文件 + 图像限制(配置)

默认值可以在 `gateway.http.endpoints.responses` 下调整:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          files: {
            allowUrl: true,
            allowedMimes: ["text/plain", "text/markdown", "text/html", "text/csv", "application/json", "application/pdf"],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200
            }
          },
          images: {
            allowUrl: true,
            allowedMimes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000
          }
        }
      }
    }
  }
}
```

省略时的默认值:
- `maxBodyBytes`:20MB
- `files.maxBytes`:5MB
- `files.maxChars`:200k
- `files.maxRedirects`:3
- `files.timeoutMs`:10s
- `files.pdf.maxPages`:4
- `files.pdf.maxPixels`:4,000,000
- `files.pdf.minTextChars`:200
- `images.maxBytes`:10MB
- `images.maxRedirects`:3
- `images.timeoutMs`:10s

## 流式传输(SSE)

设置 `stream: true` 以接收 Server-Sent Events(SSE):

- `Content-Type: text/event-stream`
- 每个事件行是 `event: <type>` 和 `data: <json>`
- 流以 `data: [DONE]` 结束

当前发出的事件类型:
- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed`(出错时)

## Usage

当底层 provider 报告令牌计数时,`usage` 被填充。

## 错误

错误使用如下 JSON 对象:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

常见情况:
- `401` 缺失/无效认证
- `400` 无效请求正文
- `405` 错误方法

## 示例

非流式传输:
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

流式传输:
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
