---
mmh3_hash: "5c5cbfc2e90e39ead1d649688fe5d2a5"
summary: "通过 diagnostics-otel Plugin（OTLP/HTTP）将 OpenClaw 诊断导出到任何 OpenTelemetry 收集器"
title: "OpenTelemetry export"
read_when:
  - 你想将 OpenClaw model 使用情况、消息流或 Session 指标发送到 OpenTelemetry 收集器
  - 你正在将 traces、metrics 或 logs 接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 后端
  - 你需要确切的指标名称、span 名称或属性形状来构建仪表板或告警
---

OpenClaw 通过捆绑的 `diagnostics-otel` Plugin 使用 **OTLP/HTTP（protobuf）** 导出诊断。任何接受 OTLP/HTTP 的收集器或后端无需更改代码即可工作。关于本地文件日志及其读取方法，请参见 [日志记录](/logging)。

## 工作原理

- **诊断事件**是由 Gateway 和捆绑 Plugin 针对 model 运行、消息流、Session、队列和 exec 发出的结构化进程内记录。
- **`diagnostics-otel` Plugin** 订阅这些事件，并通过 OTLP/HTTP 将它们导出为 OpenTelemetry **metrics**、**traces** 和 **logs**。
- **Provider 调用** 在 Provider 传输接受自定义头时，从 OpenClaw 受信任的 model 调用 span 上下文接收 W3C `traceparent` 头。Plugin 发出的 trace 上下文不传播。
- 导出器仅在诊断表面和 Plugin 都启用时才附加，因此默认情况下进程内成本几乎为零。

## 快速开始

对于打包安装，请先安装 Plugin：

```bash
openclaw plugins install clawhub:@openclaw/diagnostics-otel
```

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

也可以从 CLI 启用 Plugin：

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` 目前仅支持 `http/protobuf`。`grpc` 被忽略。
</Note>

## 导出的信号

| 信号        | 包含内容                                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | token 使用量、成本、运行时长、消息流、Talk 事件、队列通道、Session 状态/恢复、exec 和内存压力的计数器和直方图。               |
| **Traces**  | model 使用、model 调用、harness 生命周期、工具执行、exec、webhook/消息处理、上下文组装和工具循环的 span。                     |
| **Logs**    | 启用 `diagnostics.otel.logs` 时通过 OTLP 导出的结构化 `logging.file` 记录。                                                  |

独立切换 `traces`、`metrics` 和 `logs`。当 `diagnostics.otel.enabled` 为 true 时，三者都默认开启。

## 配置参考

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc 被忽略
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // 根 span 采样器，0.0..1.0
      flushIntervalMs: 60000, // 指标导出间隔（最小 1000ms）
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### 环境变量

| 变量                                                                                                              | 用途                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 覆盖 `diagnostics.otel.endpoint`。如果值已包含 `/v1/traces`、`/v1/metrics` 或 `/v1/logs`，则按原样使用。                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 当对应的 `diagnostics.otel.*Endpoint` 配置键未设置时使用的信号特定端点覆盖。信号特定配置优先于信号特定环境变量，后者优先于共享端点。                                                                            |
| `OTEL_SERVICE_NAME`                                                                                               | 覆盖 `diagnostics.otel.serviceName`。                                                                                                                                                                            |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 覆盖线路协议（今天只接受 `http/protobuf`）。                                                                                                                                                                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 设置为 `gen_ai_latest_experimental` 以发出最新的实验性 GenAI span 属性（`gen_ai.provider.name`）而不是旧版 `gen_ai.system`。GenAI 指标无论如何都始终使用有界的低基数语义属性。                                   |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 当另一个预加载或主机进程已经注册了全局 OpenTelemetry SDK 时设置为 `1`。Plugin 然后跳过其自己的 NodeSDK 生命周期，但仍然连接诊断监听器并遵守 `traces`/`metrics`/`logs`。                                          |

## 隐私和内容捕获

原始 model/工具内容**默认不导出**。span 携带有界标识符（Channel、Provider、model、错误类别、仅散列的请求 id），从不包含 prompt 文本、响应文本、工具输入、工具输出或 Session 密钥。Talk 指标仅导出有界事件元数据，如模式、传输、Provider 和事件类型，不包含转录、音频有效负载、Session id、轮次 id、通话 id、房间 id 或切换令牌。

出站 model 请求可能包含 W3C `traceparent` 头。该头仅从 OpenClaw 拥有的活跃 model 调用诊断 trace 上下文生成。现有的调用者提供的 `traceparent` 头被替换，因此 Plugin 或自定义 Provider 选项无法伪造跨服务 trace 祖先。

仅当你的收集器和保留策略被批准用于 prompt、响应、工具或系统 prompt 文本时，才将 `diagnostics.otel.captureContent.*` 设置为 `true`。每个子键独立选择加入：

- `inputMessages` — 用户 prompt 内容。
- `outputMessages` — model 响应内容。
- `toolInputs` — 工具参数有效负载。
- `toolOutputs` — 工具结果有效负载。
- `systemPrompt` — 组装的系统/开发者 prompt。

启用任何子键时，model 和工具 span 还会获得仅针对你选择加入的那类内容的有界、编辑的 `openclaw.content.*` 属性。

## 采样和刷新

- **Traces：** `diagnostics.otel.sampleRate`（仅根 span，`0.0` 丢弃所有，`1.0` 保留所有）。
- **Metrics：** `diagnostics.otel.flushIntervalMs`（最小 `1000`）。
- **Logs：** OTLP logs 遵守 `logging.level`（文件日志级别）。它们使用诊断日志记录编辑路径，而非控制台格式。高容量安装应优先使用 OTLP 收集器采样/过滤而非本地采样。
- **文件日志关联：** 当日志调用携带有效的诊断 trace 上下文时，JSONL 文件日志包含顶级 `traceId`、`spanId`、`parentSpanId` 和 `traceFlags`，这使日志处理器能够将本地日志行与导出的 span 连接起来。
- **请求关联：** Gateway HTTP 请求和 WebSocket 帧创建内部请求 trace 范围。该范围内的日志和诊断事件默认继承请求 trace，而 Agent 运行和 model 调用 span 作为子项创建，使 Provider `traceparent` 头保持在同一 trace 上。

## 导出的 metrics

### Model 使用

- `openclaw.tokens`（计数器，属性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（计数器，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方图，属性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方图，GenAI 语义规范指标，属性：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（直方图，秒，GenAI 语义规范指标，属性：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`、可选 `error.type`）
- `openclaw.model_call.duration_ms`（直方图，属性：`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`，错误时加 `openclaw.errorCategory` 和 `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（直方图，最终 model 请求有效负载的 UTF-8 字节大小；无原始有效负载内容）
- `openclaw.model_call.response_bytes`（直方图，流式 model 响应事件的 UTF-8 字节大小；无原始响应内容）
- `openclaw.model_call.time_to_first_byte_ms`（直方图，第一个流式响应事件之前的经过时间）

### 消息流

- `openclaw.webhook.received`（计数器，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.error`（计数器，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.message.queued`（计数器，属性：`openclaw.channel`、`openclaw.source`）
- `openclaw.message.processed`（计数器，属性：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.delivery.started`（计数器，属性：`openclaw.channel`、`openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`）

### Talk

- `openclaw.talk.event`（计数器，属性：`openclaw.talk.event_type`、`openclaw.talk.mode`、`openclaw.talk.transport`、`openclaw.talk.brain`、`openclaw.talk.provider`）
- `openclaw.talk.event.duration_ms`（直方图，属性：与 `openclaw.talk.event` 相同；当 Talk 事件报告时长时发出）
- `openclaw.talk.audio.bytes`（直方图，属性：与 `openclaw.talk.event` 相同；对报告字节长度的 Talk 音频帧事件发出）

### 队列和 Session

- `openclaw.queue.lane.enqueue`（计数器，属性：`openclaw.lane`）
- `openclaw.queue.lane.dequeue`（计数器，属性：`openclaw.lane`）
- `openclaw.queue.depth`（直方图，属性：`openclaw.lane` 或 `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（直方图，属性：`openclaw.lane`）
- `openclaw.session.state`（计数器，属性：`openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（计数器，属性：`openclaw.state`；仅对无活跃工作的陈旧 Session 账目发出）
- `openclaw.session.stuck_age_ms`（直方图，属性：`openclaw.state`；仅对无活跃工作的陈旧 Session 账目发出）
- `openclaw.session.recovery.requested`（计数器，属性：`openclaw.state`、`openclaw.action`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.completed`（计数器，属性：`openclaw.state`、`openclaw.action`、`openclaw.status`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.age_ms`（直方图，属性：与对应恢复计数器相同）
- `openclaw.run.attempt`（计数器，属性：`openclaw.attempt`）

### Session 活跃度遥测

`diagnostics.stuckSessionWarnMs` 是 Session 活跃度诊断的无进度老化阈值。当 OpenClaw 观察到回复、工具、状态、块或 ACP 运行时进度时，`processing` Session 不向该阈值累积老化。输入保活不算作进度，因此仍可检测到静默的模型或 harness。

OpenClaw 按可观察到的工作对 Session 进行分类：

- `session.long_running`：活跃的嵌入式工作、模型调用或工具调用仍在取得进度。
- `session.stalled`：活跃工作存在，但活跃运行最近未报告进度。停滞的嵌入式运行起初仅处于观察状态，然后在 `diagnostics.stuckSessionAbortMs` 时间无进度后进行中止排空，以便 lane 后面排队的轮次可以恢复。未设置时，中止阈值默认为至少 5 分钟且为 `diagnostics.stuckSessionWarnMs` 3 倍的更安全延展窗口。
- `session.stuck`：无活跃工作的陈旧 Session 账目。这会立即释放受影响的 Session lane。

恢复发出结构化的 `session.recovery.requested` 和 `session.recovery.completed` 事件。诊断 Session 状态仅在变更恢复结果（`aborted` 或 `released`）后且仅在相同处理代仍是当前代时才标记为空闲。

只有 `session.stuck` 发出 `openclaw.session.stuck` 计数器、`openclaw.session.stuck_age_ms` 直方图和 `openclaw.session.stuck` span。重复的 `session.stuck` 诊断在 Session 保持不变时退避，因此仪表板应对持续增长而非每次心跳滴答发出告警。有关配置旋钮和默认值，请参见[配置参考](/gateway/configuration-reference#diagnostics)。

### Harness 生命周期

- `openclaw.harness.duration_ms`（直方图，属性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`，错误时加 `openclaw.harness.phase`）

### Exec

- `openclaw.exec.duration_ms`（直方图，属性：`openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 诊断内部（内存和工具循环）

- `openclaw.memory.heap_used_bytes`（直方图，属性：`openclaw.memory.kind`）
- `openclaw.memory.rss_bytes`（直方图）
- `openclaw.memory.pressure`（计数器，属性：`openclaw.memory.level`）
- `openclaw.tool.loop.iterations`（计数器，属性：`openclaw.toolName`、`openclaw.outcome`）
- `openclaw.tool.loop.duration_ms`（直方图，属性：`openclaw.toolName`、`openclaw.outcome`）

## 导出的 span

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.tokens.*`（input/output/cache_read/cache_write/total）
  - 默认 `gen_ai.system`，或选择最新 GenAI 语义规范时 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - 默认 `gen_ai.system`，或选择最新 GenAI 语义规范时 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
  - 错误时 `openclaw.errorCategory` 和可选 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash`（上游 Provider 请求 id 的有界 SHA 散列；原始 id 不导出）
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完成时：`openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - 错误时：`openclaw.harness.phase`、`openclaw.errorCategory`，可选 `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`、`openclaw.toolName`、`openclaw.errorCategory`、`openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`、`openclaw.exec.command_length`、`openclaw.exec.exit_code`、`openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`、`openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`、`openclaw.outcome`、`openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`、`openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`、`openclaw.ageMs`、`openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（无 prompt、历史、响应或 Session 密钥内容）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.outcome`、`openclaw.iterations`、`openclaw.errorCategory`（无循环消息、参数或工具输出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.rss_bytes`

当显式启用内容捕获时，model 和工具 span 还可以为你选择加入的特定内容类包含有界的、编辑的 `openclaw.content.*` 属性。

## 诊断事件目录

以下事件支撑上述 metrics 和 span。Plugin 也可以直接订阅它们，而无需 OTLP 导出。

**Model 使用**

- `model.usage` — token、成本、时长、上下文、provider/model/channel、Session id。`usage` 是用于成本和遥测的 provider/轮次核算；`context.used` 是当前 prompt/上下文快照，当涉及缓存输入或工具循环调用时可能低于 provider `usage.total`。

**消息流**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**队列和 Session**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat`（聚合计数器：webhook/队列/Session）

**Harness 生命周期**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` — Agent harness 的每次运行生命周期。包括 `harnessId`、可选 `pluginId`、provider/model/channel 和运行 id。完成时添加 `durationMs`、`outcome`、可选 `resultClassification`、`yieldDetected` 和 `itemLifecycle` 计数。错误时添加 `phase`（`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory` 和可选 `cleanupFailed`。

**Exec**

- `exec.process.completed` — 终止结果、时长、目标、模式、退出码和失败类型。不包含命令文本和工作目录。

## 不使用导出器

你可以在不运行 `diagnostics-otel` 的情况下让诊断事件对 Plugin 或自定义 sink 可用：

```json5
{
  diagnostics: { enabled: true },
}
```

对于不提高 `logging.level` 的目标调试输出，使用诊断标志。标志不区分大小写并支持通配符（例如 `telegram.*` 或 `*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

或作为一次性环境变量覆盖：

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

标志输出写入标准日志文件（`logging.file`），仍由 `logging.redactSensitive` 编辑。完整指南：[诊断标志](/diagnostics/flags)。

## 禁用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

你也可以将 `diagnostics-otel` 排除在 `plugins.allow` 之外，或运行 `openclaw plugins disable diagnostics-otel`。

## 相关文档

- [日志记录](/logging) — 文件日志、控制台输出、CLI 追踪和控制 UI 日志标签
- [Gateway 日志记录内部](/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [诊断标志](/diagnostics/flags) — 针对性调试日志标志
- [诊断导出](/gateway/diagnostics) — operator 支持包工具（与 OTEL 导出分离）
- [配置参考](/gateway/configuration-reference#diagnostics) — 完整 `diagnostics.*` 字段参考
