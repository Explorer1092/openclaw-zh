---
mmh3_hash: "6c30e612a4e5081280cdba287f24d168"
summary: "通过 diagnostics-prometheus Plugin 将 OpenClaw 诊断暴露为 Prometheus 文本 metrics"
title: "Prometheus metrics"
sidebarTitle: "Prometheus"
read_when:
  - 你想让 Prometheus、Grafana、VictoriaMetrics 或其他抓取器收集 OpenClaw Gateway metrics
  - 你需要仪表板或告警的 Prometheus 指标名称和标签策略
  - 你想在不运行 OpenTelemetry 收集器的情况下获取 metrics
---

OpenClaw 可以通过捆绑的 `diagnostics-prometheus` Plugin 暴露诊断 metrics。它监听受信任的内部诊断，并在以下地址渲染 Prometheus 文本端点：

```text
GET /api/diagnostics/prometheus
```

Content type 为 `text/plain; version=0.0.4; charset=utf-8`，即标准 Prometheus 展示格式。

<Warning>
该路由使用 Gateway 认证（operator 范围）。不要将其作为公开的未认证 `/metrics` 端点暴露。通过与其他 operator API 相同的认证路径抓取它。
</Warning>

关于 traces、logs、OTLP 推送和 OpenTelemetry GenAI 语义属性，请参见 [OpenTelemetry 导出](/gateway/opentelemetry)。

## 快速开始

<Steps>
  <Step title="启用 Plugin">
    <Tabs>
      <Tab title="配置">
        ```json5
        {
          plugins: {
            allow: ["diagnostics-prometheus"],
            entries: {
              "diagnostics-prometheus": { enabled: true },
            },
          },
          diagnostics: {
            enabled: true,
          },
        }
        ```
      </Tab>
      <Tab title="CLI">
        ```bash
        openclaw plugins enable diagnostics-prometheus
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="重启 Gateway">
    HTTP 路由在 Plugin 启动时注册，因此启用后需要重新加载。
  </Step>
  <Step title="抓取受保护的路由">
    发送与 operator 客户端相同的 gateway 认证：

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="接入 Prometheus">
    ```yaml
    # prometheus.yml
    scrape_configs:
      - job_name: openclaw
        scrape_interval: 30s
        metrics_path: /api/diagnostics/prometheus
        authorization:
          credentials_file: /etc/prometheus/openclaw-gateway-token
        static_configs:
          - targets: ["openclaw-gateway:18789"]
    ```
  </Step>
</Steps>

<Note>
需要 `diagnostics.enabled: true`。没有它，Plugin 仍然注册 HTTP 路由，但没有诊断事件流入导出器，因此响应为空。
</Note>

## 导出的 metrics

| 指标                                          | 类型      | 标签                                                                                    |
| --------------------------------------------- | --------- | --------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                    |
| `openclaw_run_duration_seconds`               | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                    |
| `openclaw_model_call_total`                   | counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                    |
| `openclaw_model_call_duration_seconds`        | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                    |
| `openclaw_model_tokens_total`                 | counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                   |
| `openclaw_gen_ai_client_token_usage`          | histogram | `model`, `provider`, `token_type`                                                       |
| `openclaw_model_cost_usd_total`               | counter   | `agent`, `channel`, `model`, `provider`                                                 |
| `openclaw_tool_execution_total`               | counter   | `error_category`, `outcome`, `params_kind`, `tool`                                      |
| `openclaw_tool_execution_duration_seconds`    | histogram | `error_category`, `outcome`, `params_kind`, `tool`                                      |
| `openclaw_harness_run_total`                  | counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | counter   | `channel`, `outcome`, `reason`                                                          |
| `openclaw_message_processed_duration_seconds` | histogram | `channel`, `outcome`, `reason`                                                          |
| `openclaw_message_delivery_total`             | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                 |
| `openclaw_message_delivery_duration_seconds`  | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                 |
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                  |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                  |
| `openclaw_session_state_total`                | counter   | `reason`, `state`                                                                       |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                 |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                  |
| `openclaw_memory_rss_bytes`                   | histogram | 无                                                                                      |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                       |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                |
| `openclaw_prometheus_series_dropped_total`    | counter   | 无                                                                                      |

## 标签策略

<AccordionGroup>
  <Accordion title="有界的低基数标签">
    Prometheus 标签保持有界和低基数。导出器不发出原始诊断标识符，如 `runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、消息 ID、聊天 ID 或 Provider 请求 ID。

    标签值经过编辑，必须符合 OpenClaw 的低基数字符策略。不符合策略的值被替换为 `unknown`、`other` 或 `none`，具体取决于指标。

  </Accordion>
  <Accordion title="系列上限和溢出核算">
    导出器在内存中将保留的时间系列上限限制为跨计数器、仪表和直方图总计 **2048** 个系列。超出上限的新系列被丢弃，每次时 `openclaw_prometheus_series_dropped_total` 加一。

    将此计数器视为上游属性泄漏高基数值的硬信号。导出器不会自动提升上限；如果它上涨，修复来源而不是禁用上限。

  </Accordion>
  <Accordion title="Prometheus 输出中永远不会出现的内容">
    - prompt 文本、响应文本、工具输入、工具输出、系统 prompt
    - 原始 Provider 请求 ID（仅有界散列，适用时在 span 上，而不是在 metrics 上）
    - Session 密钥和 Session ID
    - 主机名、文件路径、密钥值
  </Accordion>
</AccordionGroup>

## PromQL 配方

```promql
# 每分钟 token，按 Provider 拆分
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# 过去一小时的花费（美元），按 model
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# model 运行时长的第 95 百分位
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# 队列等待时间 SLO（95p 低于 2s）
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# 丢弃的 Prometheus 系列（基数告警）
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
跨 Provider 仪表板首选 `gen_ai_client_token_usage`：它遵循 OpenTelemetry GenAI 语义规范，与来自非 OpenClaw GenAI 服务的 metrics 保持一致。
</Tip>

## 选择 Prometheus 还是 OpenTelemetry 导出

OpenClaw 独立支持两种表面。你可以运行其中之一、两者或都不运行。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **拉取**模型：Prometheus 抓取 `/api/diagnostics/prometheus`。
    - 不需要外部收集器。
    - 通过正常 Gateway 认证进行身份验证。
    - 表面仅限 metrics（无 traces 或 logs）。
    - 最适合已经标准化在 Prometheus + Grafana 上的技术栈。
  </Tab>
  <Tab title="diagnostics-otel">
    - **推送**模型：OpenClaw 通过 OTLP/HTTP 发送到收集器或 OTLP 兼容后端。
    - 表面包括 metrics、traces 和 logs。
    - 当你同时需要两者时，通过 OpenTelemetry Collector（`prometheus` 或 `prometheusremotewrite` 导出器）桥接到 Prometheus。
    - 完整目录请参见 [OpenTelemetry 导出](/gateway/opentelemetry)。
  </Tab>
</Tabs>

## 故障排查

<AccordionGroup>
  <Accordion title="响应体为空">
    - 检查配置中的 `diagnostics.enabled: true`。
    - 用 `openclaw plugins list --enabled` 确认 Plugin 已启用和加载。
    - 生成一些流量；计数器和直方图仅在至少发生一个事件后才发出行。
  </Accordion>
  <Accordion title="401 / 未授权">
    该端点需要 Gateway operator 范围（`auth: "gateway"` 配合 `gatewayRuntimeScopeSurface: "trusted-operator"`）。使用与 Prometheus 用于任何其他 Gateway operator 路由相同的 token 或密码。没有公开的未认证模式。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` 上涨">
    某个新属性超过了 **2048** 系列上限。检查最近的 metrics 中意外的高基数标签，并在源头修复它。导出器有意丢弃新系列而不是静默重写标签。
  </Accordion>
  <Accordion title="重启后 Prometheus 显示过期系列">
    Plugin 仅在内存中保持状态。Gateway 重启后，计数器重置为零，仪表在下一个报告值重新开始。使用 PromQL `rate()` 和 `increase()` 干净地处理重置。
  </Accordion>
</AccordionGroup>

## 相关文档

- [诊断导出](/gateway/diagnostics) — 用于支持包的本地诊断 zip
- [健康和就绪](/gateway/health) — `/healthz` 和 `/readyz` 探测
- [日志记录](/logging) — 基于文件的日志记录
- [OpenTelemetry 导出](/gateway/opentelemetry) — traces、metrics 和 logs 的 OTLP 推送
