---
title: "OpenResponses 网关集成计划"
mmh3_hash: "24f4587197544a65376fd22ce2e01a8d"
summary: "计划: 添加 OpenResponses /v1/responses 端点并干净地弃用聊天完成"
owner: "openclaw"
status: "草案"
last_updated: "2026-01-19"
---

# OpenResponses 网关集成计划

## 背景

OpenClaw 网关目前在 `/v1/chat/completions` 公开一个最小的 OpenAI 兼容聊天完成端点(参见 [OpenAI 聊天完成](/gateway/openai-http-api))。

Open Responses 是基于 OpenAI Responses API 的开放推理标准。它专为代理工作流设计,使用基于项目的输入加语义流事件。OpenResponses 规范定义 `/v1/responses`,而不是 `/v1/chat/completions`。

## 目标

- 添加符合 OpenResponses 语义的 `/v1/responses` 端点。
- 将聊天完成保留为易于禁用并最终移除的兼容层。
- 使用隔离的可重用架构标准化验证和解析。

## 非目标

- 第一次完全 OpenResponses 功能对等(图像、文件、托管工具)。
- 替换内部代理执行逻辑或工具编排。
- 在第一阶段更改现有的 `/v1/chat/completions` 行为。

## 研究摘要

来源: OpenResponses OpenAPI、OpenResponses 规范站点和 Hugging Face 博客文章。

提取的要点:

- `POST /v1/responses` 接受 `CreateResponseBody` 字段,如 `model`、`input`(字符串或 `ItemParam[]`)、`instructions`、`tools`、`tool_choice`、`stream`、`max_output_tokens` 和 `max_tool_calls`。
- `ItemParam` 是一个区分联合:
  - 具有角色 `system`、`developer`、`user`、`assistant` 的 `message` 项
  - `function_call` 和 `function_call_output`
  - `reasoning`
  - `item_reference`
- 成功的响应返回带有 `object: "response"`、`status` 和 `output` 项的 `ResponseResource`。
- 流使用语义事件,例如:
  - `response.created`、`response.in_progress`、`response.completed`、`response.failed`
  - `response.output_item.added`、`response.output_item.done`
  - `response.content_part.added`、`response.content_part.done`
  - `response.output_text.delta`、`response.output_text.done`
- 规范要求:
  - `Content-Type: text/event-stream`
  - `event:` 必须匹配 JSON `type` 字段
  - 终端事件必须是文字 `[DONE]`
- 推理项可能公开 `content`、`encrypted_content` 和 `summary`。
- HF 示例在请求中包括 `OpenResponses-Version: latest`(可选标头)。

## 提议的架构

- 添加 `src/gateway/open-responses.schema.ts`,仅包含 Zod 架构(无网关导入)。
- 为 `/v1/responses` 添加 `src/gateway/openresponses-http.ts`(或 `open-responses-http.ts`)。
- 保持 `src/gateway/openai-http.ts` 完整作为遗留兼容性适配器。
- 添加配置 `gateway.http.endpoints.responses.enabled`(默认 `false`)。
- 保持 `gateway.http.endpoints.chatCompletions.enabled` 独立;允许单独切换两个端点。
- 启用聊天完成时发出启动警告以表示遗留状态。

## 聊天完成的弃用路径

- 维护严格的模块边界: responses 和 chat completions 之间没有共享架构类型。
- 通过配置使聊天完成选择加入,以便可以在不更改代码的情况下禁用它。
- 一旦 `/v1/responses` 稳定,更新文档以将聊天完成标记为遗留。
- 可选的未来步骤: 将聊天完成请求映射到 Responses 处理程序以简化移除路径。

## 阶段 1 支持子集

- 接受 `input` 作为字符串或带有消息角色和 `function_call_output` 的 `ItemParam[]`。
- 将系统和开发者消息提取到 `extraSystemPrompt` 中。
- 使用最近的 `user` 或 `function_call_output` 作为代理运行的当前消息。
- 使用 `invalid_request_error` 拒绝不支持的内容部分(图像/文件)。
- 返回带有 `output_text` 内容的单个助手消息。
- 返回带有零值的 `usage`,直到令牌计费接入。

## 验证策略(无 SDK)

- 为支持的子集实现 Zod 架构:
  - `CreateResponseBody`
  - `ItemParam` + 消息内容部分联合
  - `ResponseResource`
  - 网关使用的流事件形状
- 将架构保存在单个隔离模块中以避免漂移并允许将来的代码生成。

## 流实现(阶段 1)

- 带有 `event:` 和 `data:` 的 SSE 行。
- 所需序列(最小可行):
  - `response.created`
  - `response.output_item.added`
  - `response.content_part.added`
  - `response.output_text.delta`(根据需要重复)
  - `response.output_text.done`
  - `response.content_part.done`
  - `response.completed`
  - `[DONE]`

## 测试和验证计划

- 为 `/v1/responses` 添加 e2e 覆盖:
  - 需要身份验证
  - 非流响应形状
  - 流事件排序和 `[DONE]`
  - 使用标头和 `user` 的会话路由
- 保持 `src/gateway/openai-http.e2e.test.ts` 不变。
- 手动: 使用 `stream: true` curl 到 `/v1/responses` 并验证事件排序和终端 `[DONE]`。

## 文档更新(后续)

- 为 `/v1/responses` 使用和示例添加新的文档页面。
- 使用遗留说明更新 `/gateway/openai-http-api` 并指向 `/v1/responses`。
