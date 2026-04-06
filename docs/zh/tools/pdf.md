---
mmh3_hash: "9fca6fdd61675df190f11fe9498b67ac"
title: "PDF 工具"
summary: "使用原生 Provider 支持和提取回退分析一个或多个 PDF 文档"
read_when:
  - 您想从 Agent 分析 PDF
  - 您需要确切的 pdf 工具参数和限制
  - 您正在调试原生 PDF 模式与提取回退
---

# PDF 工具

`pdf` 分析一个或多个 PDF 文档并返回文本。

快速行为概览：

- Anthropic 和 Google 模型 Provider 使用原生 Provider 模式。
- 其他 Provider 使用提取回退模式（先提取文本，需要时再提取页面图像）。
- 支持单个（`pdf`）或多个（`pdfs`）输入，每次调用最多 10 个 PDF。

## 可用性

仅当 OpenClaw 能为 Agent 解析出支持 PDF 的模型配置时，该工具才会注册：

1. `agents.defaults.pdfModel`
2. 回退到 `agents.defaults.imageModel`
3. 回退到 Agent 已解析的 Session/默认模型
4. 如果原生 PDF Provider 有认证支持，优先于通用图像回退候选

如果无法解析可用的模型，`pdf` 工具不会暴露。

可用性说明：

- 回退链是认证感知的。已配置的 `provider/model` 仅在 OpenClaw 实际上能为 Agent 认证该 Provider 时才有效。
- 原生 PDF Provider 目前为 **Anthropic** 和 **Google**。
- 如果已解析的 Session/默认 Provider 已有配置的视觉/PDF 模型，PDF 工具会在回退到其他有认证的 Provider 之前复用它。

## 输入参考

- `pdf`（`string`）：一个 PDF 路径或 URL
- `pdfs`（`string[]`）：多个 PDF 路径或 URL，总计最多 10 个
- `prompt`（`string`）：分析提示，默认为 `Analyze this PDF document.`
- `pages`（`string`）：页面过滤，如 `1-5` 或 `1,3,7-9`
- `model`（`string`）：可选的模型覆盖（`provider/model`）
- `maxBytesMb`（`number`）：每个 PDF 的大小上限（MB）

输入说明：

- `pdf` 和 `pdfs` 在加载前会合并并去重。
- 如果没有提供 PDF 输入，工具报错。
- `pages` 解析为基于 1 的页码，去重、排序并限制到配置的最大页数。
- `maxBytesMb` 默认为 `agents.defaults.pdfMaxBytesMb` 或 `10`。

## 支持的 PDF 引用

- 本地文件路径（包括 `~` 展开）
- `file://` URL
- `http://` 和 `https://` URL

引用说明：

- 其他 URI 方案（例如 `ftp://`）会以 `unsupported_pdf_reference` 被拒绝。
- 在沙箱模式下，远程 `http(s)` URL 会被拒绝。
- 启用仅工作区文件策略时，允许根目录之外的本地文件路径会被拒绝。

## 执行模式

### 原生 Provider 模式

原生模式用于 Provider `anthropic` 和 `google`。
工具直接将原始 PDF 字节发送到 Provider API。

原生模式限制：

- 不支持 `pages`。如果设置了，工具返回错误。
- 支持多 PDF 输入；每个 PDF 在提示之前作为原生文档块/内联 PDF 部分发送。

### 提取回退模式

回退模式用于非原生 Provider。

流程：

1. 从选定页面提取文本（最多 `agents.defaults.pdfMaxPages`，默认 `20`）。
2. 如果提取的文本长度低于 `200` 个字符，将选定页面渲染为 PNG 图像并包含。
3. 将提取的内容加上提示发送到选定的模型。

回退详情：

- 页面图像提取使用 `4,000,000` 像素预算。
- 如果目标模型不支持图像输入且没有可提取的文本，工具报错。
- 如果文本提取成功，但图像提取需要在仅文本模型上使用视觉功能，OpenClaw 会丢弃已渲染的图像并继续使用提取的文本。
- 提取回退需要 `pdfjs-dist`（以及用于图像渲染的 `@napi-rs/canvas`）。

## 配置

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

完整字段详情参见 [配置参考](/gateway/configuration-reference)。

## 输出详情

工具在 `content[0].text` 中返回文本，在 `details` 中返回结构化元数据。

常见的 `details` 字段：

- `model`：已解析的模型引用（`provider/model`）
- `native`：原生 Provider 模式为 `true`，回退为 `false`
- `attempts`：成功前失败的回退尝试次数

路径字段：

- 单个 PDF 输入：`details.pdf`
- 多个 PDF 输入：带 `pdf` 条目的 `details.pdfs[]`
- 沙箱路径重写元数据（如适用）：`rewrittenFrom`

## 错误行为

- 缺少 PDF 输入：抛出 `pdf required: provide a path or URL to a PDF document`
- PDF 过多：在 `details.error = "too_many_pdfs"` 中返回结构化错误
- 不支持的引用方案：返回 `details.error = "unsupported_pdf_reference"`
- 原生模式中使用 `pages`：抛出明确的 `pages is not supported with native PDF providers` 错误

## 示例

单个 PDF：

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

多个 PDF：

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

页面过滤的回退模型：

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## 相关

- [工具概览](/tools) — 所有可用的 Agent 工具
- [配置参考](/gateway/configuration-reference#agent-defaults) — pdfMaxBytesMb 和 pdfMaxPages 配置
