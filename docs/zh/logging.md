---
mmh3_hash: "f66526a262b5f874239b6f632be7064f"
title: "日志记录"
summary: "文件日志、控制台输出、CLI 跟踪和控制 UI 日志选项卡"
read_when:
  - 您需要 OpenClaw 日志记录的初学者友好概述
  - 您想配置日志级别、格式或脱敏
  - 您正在故障排除并需要快速查找日志
---

# 日志记录

OpenClaw 有两个主要日志界面：

- **文件日志**（JSON 行）由 Gateway 写入。
- **控制台输出**显示在终端和 Gateway 调试 UI 中。

控制 UI 的**日志**选项卡跟踪 Gateway 文件日志。本页解释了日志的位置、如何读取它们以及如何配置日志级别和格式。

## 日志位置

默认情况下，Gateway 在以下位置写入滚动日志文件：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 Gateway 主机的本地时区。

每个文件在达到 `logging.maxFileBytes`（默认：100 MB）时轮转。OpenClaw 在活动文件旁保留最多五个编号的归档文件，如 `openclaw-YYYY-MM-DD.1.log`，并继续写入新的活动日志而不是抑制诊断信息。

您可以在 `~/.openclaw/openclaw.json` 中覆盖此设置：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何读取日志

### CLI：实时跟踪（推荐）

使用 CLI 通过 RPC 跟踪 Gateway 日志文件：

```bash
openclaw logs --follow
```

当前可用选项：

- `--local-time`：以您的本地时区渲染时间戳
- `--url <url>` / `--token <token>` / `--timeout <ms>`：标准 Gateway RPC 标志
- `--expect-final`：Agent 支持的 RPC 最终响应等待标志（通过共享客户端层在此处接受）

输出模式：

- **TTY 会话**：漂亮、彩色、结构化的日志行。
- **非 TTY 会话**：纯文本。
- `--json`：行分隔 JSON（每行一个日志事件）。
- `--plain`：在 TTY 会话中强制纯文本。
- `--no-color`：禁用 ANSI 颜色。

当您传递显式 `--url` 时，CLI 不会自动应用配置或环境凭据；如果目标 Gateway 需要认证，请自己包含 `--token`。

在 JSON 模式下，CLI 输出 `type` 标记的对象：

- `meta`：流元数据（文件、游标、大小）
- `log`：已解析的日志条目
- `notice`：截断/轮转提示
- `raw`：未解析的日志行

如果本地环回 Gateway 请求配对、在连接期间关闭，或在 `logs.tail` 响应前超时，`openclaw logs` 会自动回退到配置的 Gateway 文件日志。显式 `--url` 目标不使用此回退。

如果 Gateway 不可访问，CLI 会打印简短提示以运行：

```bash
openclaw doctor
```

### 控制 UI（Web）

控制 UI 的**日志**选项卡使用 `logs.tail` 跟踪同一文件。
参见 [控制 UI](/web/control-ui) 了解如何打开它。

### 仅 Channel 日志

要过滤 Channel 活动（WhatsApp/Telegram 等），请使用：

```bash
openclaw channels logs --channel whatsapp
```

## 日志格式

### 文件日志（JSONL）

日志文件中的每一行都是一个 JSON 对象。CLI 和控制 UI 解析这些条目以呈现结构化输出（时间、级别、子系统、消息）。

文件日志 JSONL 记录在可用时还包括机器可过滤的顶级字段：

- `hostname`：Gateway 主机名。
- `message`：用于全文搜索的扁平化日志消息文本。
- `agent_id`：当日志调用携带 Agent 上下文时的活动 Agent ID。
- `session_id`：当日志调用携带会话上下文时的活动会话 ID/键。
- `channel`：当日志调用携带 Channel 上下文时的活动 Channel。

OpenClaw 在这些字段旁边保留原始结构化日志参数，以便读取编号 tslog 参数键的现有解析器继续工作。

Talk、实时语音和托管房间活动通过同一文件日志管道发出有界生命周期日志记录。这些记录包括事件类型、模式、传输、Provider 以及可用时的大小/计时测量值，但省略了转录文本、音频载荷、轮次 ID、通话 ID 和 Provider 项目 ID。

### 控制台输出

控制台日志**可感知 TTY**，格式化以提高可读性：

- 子系统前缀（例如 `gateway/channels/whatsapp`）
- 级别着色（info/warn/error）
- 可选的紧凑或 JSON 模式

控制台格式由 `logging.consoleStyle` 控制。

### Gateway WebSocket 日志

`openclaw gateway` 还有针对 RPC 流量的 WebSocket 协议日志：

- 正常模式：仅记录有趣的结果（错误、解析错误、慢调用）
- `--verbose`：所有请求/响应流量
- `--ws-log auto|compact|full`：选择详细渲染风格
- `--compact`：`--ws-log compact` 的别名

示例：

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## 配置日志记录

所有日志配置位于 `~/.openclaw/openclaw.json` 中的 `logging` 下。

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### 日志级别

- `logging.level`：**文件日志**（JSONL）级别。
- `logging.consoleLevel`：**控制台**详细程度级别。

您可以通过 **`OPENCLAW_LOG_LEVEL`** 环境变量覆盖两者（例如 `OPENCLAW_LOG_LEVEL=debug`）。环境变量优先于配置文件，因此您可以为单次运行提高详细程度而无需编辑 `openclaw.json`。您也可以传递全局 CLI 选项 **`--log-level <level>`**（例如，`openclaw --log-level debug gateway run`），它会为该命令覆盖环境变量。

`--verbose` 仅影响控制台输出和 WS 日志详细程度；它不会更改文件日志级别。

### 针对性模型传输诊断

调试 Provider 调用时，使用针对性环境标志而不是将所有日志提升到 `debug`：

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

可用标志：

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`：在 `info` 级别发出请求开始、获取响应、SDK 标头、第一个流事件、流完成和传输错误。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`：在模型请求日志中包含有界请求载荷摘要。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`：在载荷摘要中包含所有面向模型的工具名称。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`：包含经过脱敏的、有上限的 JSON 载荷快照。仅在调试时使用；密钥已脱敏，但提示和消息文本可能仍然存在。
- `OPENCLAW_DEBUG_SSE=events`：发出第一个事件和流完成计时。
- `OPENCLAW_DEBUG_SSE=peek`：还发出前五个经过脱敏的 SSE 事件载荷，每个事件有上限。
- `OPENCLAW_DEBUG_CODE_MODE=1`：发出代码模式模型界面诊断，包括当代码模式拥有工具界面时原生 Provider 工具被隐藏的情况。

这些标志通过正常的 OpenClaw 日志记录记录，因此 `openclaw logs --follow` 和控制 UI 日志选项卡都能显示它们。没有这些标志，相同的诊断在 `debug` 级别仍然可用。

### 追踪关联

文件日志是 JSONL 格式。当日志调用携带有效的诊断追踪上下文时，OpenClaw 将追踪字段写为顶级 JSON 键（`traceId`、`spanId`、`parentSpanId`、`traceFlags`），以便外部日志处理器可以将该行与 OTEL span 和 Provider `traceparent` 传播关联起来。

Gateway HTTP 请求和 Gateway WebSocket 帧建立内部请求追踪范围。在该异步范围内发出的日志和诊断事件在不传递显式追踪上下文时继承请求追踪。Agent 运行和模型调用追踪成为活动请求追踪的子项，因此本地日志、诊断快照、OTEL span 和受信任的 Provider `traceparent` 标头可以通过 `traceId` 连接，而无需记录原始请求或模型内容。

Talk 生命周期日志记录在启用 OpenTelemetry 日志导出时也流向 OTLP 日志，使用与文件日志相同的有界属性。

### 模型调用大小和计时

模型调用诊断记录有界的请求/响应测量，而不捕获原始提示或响应内容：

- `requestPayloadBytes`：最终模型请求载荷的 UTF-8 字节大小
- `responseStreamBytes`：流式模型响应事件的 UTF-8 字节大小
- `timeToFirstByteMs`：第一个流式响应事件之前的经过时间
- `durationMs`：模型调用总持续时间

这些字段可用于诊断快照、模型调用 Plugin Hook 以及启用诊断导出时的 OTEL 模型调用 span/指标。

### 控制台样式

`logging.consoleStyle`：

- `pretty`：人性化、彩色，带时间戳。
- `compact`：更紧凑的输出（适合长时间会话）。
- `json`：每行 JSON（用于日志处理器）。

### 脱敏

OpenClaw 可以在敏感令牌出现在控制台输出、文件日志、OTLP 日志记录、持久会话转录文本或控制 UI 工具事件载荷（工具启动参数、部分/最终结果载荷、派生的执行输出和补丁摘要）之前将其脱敏：

- `logging.redactSensitive`：`off` | `tools`（默认：`tools`）
- `logging.redactPatterns`：用于覆盖默认集的正则表达式字符串列表。自定义模式在控制 UI 工具载荷的内置默认值之上应用，因此添加模式不会削弱对已被默认值捕获的值的脱敏。

文件日志和会话转录保持 JSONL 格式，但匹配的密钥值在行或消息写入磁盘之前被屏蔽。脱敏是尽力而为的：它适用于承载文本的消息内容和日志字符串，而不是每个标识符或二进制载荷字段。

内置默认值涵盖常见的 API 凭据和支付凭据字段名称，例如卡号、CVC/CVV、共享支付令牌以及以 JSON 字段、URL 参数、CLI 标志或赋值形式出现的支付凭据。

`logging.redactSensitive: "off"` 仅禁用此通用日志/转录策略。OpenClaw 仍会脱敏可以显示给 UI 客户端、支持包、诊断观察者、审批提示或 Agent 工具的安全边界载荷。示例包括控制 UI 工具调用事件、`sessions_history` 输出、诊断支持导出、Provider 错误观察、执行审批命令显示和 Gateway WebSocket 协议日志。自定义 `logging.redactPatterns` 仍可在这些界面上添加项目特定模式。

## 诊断和 OpenTelemetry

诊断是用于模型运行和消息流遥测（webhooks、队列、会话状态）的结构化、机器可读事件。它们**不**替换日志——它们为指标、追踪和导出器提供数据。无论您是否导出，事件都在进程内发出。

两个相邻界面：

- **OpenTelemetry 导出** — 通过 OTLP/HTTP 将指标、追踪和日志发送到任何兼容 OpenTelemetry 的收集器或后端（Grafana、Datadog、Honeycomb、New Relic、Tempo 等）。完整配置、信号目录、指标/span 名称、环境变量和隐私模型在专用页面上：[OpenTelemetry 导出](/gateway/opentelemetry)。
- **诊断标志** — 将额外日志路由到 `logging.file` 而不提升 `logging.level` 的针对性调试日志标志。标志不区分大小写，支持通配符（`telegram.*`、`*`）。在 `diagnostics.flags` 下配置或通过 `OPENCLAW_DIAGNOSTICS=...` 环境变量覆盖。完整指南：[诊断标志](/diagnostics/flags)。

要在没有 OTLP 导出的情况下为 Plugin 或自定义接收器启用诊断事件：

```json5
{
  diagnostics: { enabled: true },
}
```

有关到收集器的 OTLP 导出，请参阅 [OpenTelemetry 导出](/gateway/opentelemetry)。

## 故障排除提示

- **Gateway 不可访问？** 首先运行 `openclaw doctor`。
- **日志为空？** 检查 Gateway 是否正在运行并写入 `logging.file` 中的文件路径。
- **需要更多详细信息？** 将 `logging.level` 设置为 `debug` 或 `trace` 并重试。

## 相关

- [OpenTelemetry 导出](/gateway/opentelemetry) — OTLP/HTTP 导出、指标/span 目录、隐私模型
- [诊断标志](/diagnostics/flags) — 针对性调试日志标志
- [Gateway 日志内部机制](/gateway/logging) — WS 日志风格、子系统前缀和控制台捕获
- [配置参考](/gateway/configuration-reference#diagnostics) — 完整 `diagnostics.*` 字段参考
