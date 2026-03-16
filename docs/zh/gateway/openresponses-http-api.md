---
mmh3_hash: "13da0765c1c78ca4e18dd0b98dcdd509"
summary: "从 Gateway 公开兼容 OpenResponses 的 /v1/responses HTTP 端点"
read_when:
  - 集成使用 OpenResponses API 的客户端
  - 您想要基于 Item 的输入、客户端工具调用或 SSE 事件
title: "OpenResponses API"
---

# OpenResponses API (HTTP)

OpenClaw 的 Gateway 可以提供兼容 OpenResponses 的 `POST /v1/responses` 端点。

此端点**默认禁用**。首先在配置中启用它。

- `POST /v1/responses`
- 与 Gateway 相同的端口(WS + HTTP 多路复用):`http://<gateway-host>:<port>/v1/responses`

底层请求作为普通 Gateway Agent 运行执行(与 `openclaw agent` 相同的代码路径),因此路由/权限/配置与您的 Gateway 匹配。

## 认证、安全和路由

操作行为与 [OpenAI Chat Completions](/gateway/openai-http-api) 相同:

- 使用带有普通 Gateway 认证配置的 `Authorization: Bearer <token>`
- 将端点视为 Gateway 实例的完整操作员访问
- 使用 `model: "openclaw:<agentId>"`、`model: "agent:<agentId>"` 或 `x-openclaw-agent-id` 选择 Agent
- 使用 `x-openclaw-session-key` 进行明确的 Session 路由

使用 `gateway.http.endpoints.responses.enabled` 启用或禁用此端点。

## Session 行为

默认情况下端点**每请求无状态**(每次调用生成新的 Session 键)。

如果请求包含 OpenResponses `user` 字符串,Gateway 从中派生稳定的 Session 键,以便重复调用可以共享 Agent Session。

## 请求形状(支持)

请求遵循带有基于 Item 输入的 OpenResponses API。当前支持:

- `input`:字符串或 Item 对象数组。
- `instructions`:合并到系统提示中。
- `tools`:客户端工具定义(函数工具)。
- `tool_choice`:过滤或要求客户端工具。
- `stream`:启用 SSE 流式传输。
- `max_output_tokens`:尽力输出限制(取决于提供商)。
- `user`:稳定的 Session 路由。

接受但**当前忽略**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `previous_response_id`
- `truncation`

## Items(输入)

### `message`

角色:`system`、`developer`、`user`、`assistant`。

- `system` 和 `developer` 被追加到系统提示。
- 最近的 `user` 或 `function_call_output` Item 成为"当前消息"。
- 较早的 user/assistant 消息作为历史上下文包含。

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

接受以保证 schema 兼容性,但在构建提示时被忽略。

## 工具(客户端函数工具)

使用 `tools: [{ type: "function", function: { name, description?, parameters? } }]` 提供工具。

如果 Agent 决定调用工具,响应返回 `function_call` 输出 Item。然后您发送带有 `function_call_output` 的后续请求以继续轮次。

## 图像(`input_image`)

支持 base64 或 URL 来源:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

允许的 MIME 类型(当前):`image/jpeg`、`image/png`、`image/gif`、`image/webp`、`image/heic`、`image/heif`。
最大大小(当前):10MB。

## 文件(`input_file`)

支持 base64 或 URL 来源:

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

- 文件内容被解码并添加到**系统提示**,而不是用户消息,因此它保持短暂(不在 Session 历史中持久化)。
- PDF 被解析以获取文本。如果找到的文本很少,前几页被光栅化为图像并传递给模型。

PDF 解析使用 Node 友好的 `pdfjs-dist` 传统构建(无 worker)。现代 PDF.js 构建需要浏览器 worker/DOM 全局变量,因此不在 Gateway 中使用。

URL 获取默认值:

- `files.allowUrl`:`true`
- `images.allowUrl`:`true`
- `maxUrlParts`:`8`(每个请求基于 URL 的 `input_file` + `input_image` 部分总计)
- 请求受到保护(DNS 解析、私有 IP 阻止、重定向上限、超时)。
- 每个输入类型支持可选的主机名允许列表(`files.urlAllowlist`、`images.urlAllowlist`)。
  - 精确主机:`"cdn.example.com"`
  - 通配符子域:`"*.assets.example.com"`(不匹配顶级域)

## 文件 + 图像限制(配置)

可以在 `gateway.http.endpoints.responses` 下调整默认值:

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

省略时的默认值:

- `maxBodyBytes`:20MB
- `maxUrlParts`:8
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
- HEIC/HEIF `input_image` 来源被接受并在提供商交付前规范化为 JPEG。

安全注意事项:

- URL 允许列表在获取前和重定向跳转时强制执行。
- 将主机名列入白名单不会绕过私有/内部 IP 阻止。
- 对于互联网暴露的 Gateway,除了应用级别的防护之外,还要应用网络出口控制。
  参见[安全](/gateway/security)。

## 流式传输(SSE)

设置 `stream: true` 以接收服务器发送的事件(SSE):

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

## 使用量

当底层提供商报告 token 计数时,`usage` 被填充。

## 错误

错误使用如下 JSON 对象:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

常见情况:

- `401` 认证缺失/无效
- `400` 无效请求正文
- `405` 方法错误

## 示例

非流式:

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

流式:

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
