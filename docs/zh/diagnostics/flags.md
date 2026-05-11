---
title: "诊断标志"
mmh3_hash: "e8c8a05b58e968d5e3db2473d4f28afc"
summary: "用于定向调试日志的诊断标志"
read_when:
  - 您需要定向调试日志而不提高全局日志级别
  - 您需要捕获子系统特定日志以进行支持
---

诊断标志允许您启用定向调试日志，而无需在任何地方开启详细日志记录。标志是选择性的，除非子系统检查它们，否则不起作用。

## 工作原理

- 标志是字符串（不区分大小写）。
- 您可以在配置中或通过环境变量覆盖启用标志。
- 支持通配符：
  - `telegram.*` 匹配 `telegram.http`
  - `*` 启用所有标志

## 通过配置启用

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

多个标志：

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

更改标志后重启 Gateway。

## 环境变量覆盖（一次性）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

禁用所有标志：

```bash
OPENCLAW_DIAGNOSTICS=0
```

## 时间线制品

`timeline` 标志为外部 QA 测试套件写入结构化的启动和运行时计时事件：

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

也可以在配置中启用：

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

时间线文件路径仍来自 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`。当 `timeline` 仅从配置启用时，最早的配置加载 span 不会被发出，因为 OpenClaw 尚未读取配置；后续启动 span 使用配置标志。

`OPENCLAW_DIAGNOSTICS=1`、`OPENCLAW_DIAGNOSTICS=all` 和 `OPENCLAW_DIAGNOSTICS=*` 也会启用时间线，因为它们启用所有诊断标志。仅需要 JSONL 计时制品时，优先使用 `timeline`。

时间线记录使用 `openclaw.diagnostics.v1` 信封。事件可以包括进程 ID、阶段名称、span 名称、持续时间、Plugin ID、依赖计数、事件循环延迟采样、Provider 操作名称、子进程退出状态以及启动错误名称/消息。请将时间线文件视为本地诊断制品，在分享到机器之外前请先审查。

## 日志去向

标志将日志发送到标准诊断日志文件。默认情况下：

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

如果您设置了 `logging.file`，请改用该路径。日志为 JSONL 格式（每行一个 JSON 对象）。脱敏仍然基于 `logging.redactSensitive` 应用。

## 提取日志

选择最新的日志文件：

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

筛选 Telegram HTTP 诊断：

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

筛选 Brave Search HTTP 诊断：

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

或在重现时追踪：

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

对于远程 Gateway，您还可以使用 `openclaw logs --follow`（参见 [/cli/logs](/cli/logs)）。

## 注意事项

- 如果 `logging.level` 设置高于 `warn`，这些日志可能会被抑制。默认 `info` 即可。
- `brave.http` 记录 Brave Search 请求 URL/查询参数、响应状态/计时和缓存命中/未命中/写入事件。它不记录 API 密钥或响应正文，但搜索查询可能是敏感的。
- 标志可以安全地保持启用状态；它们只影响特定子系统的日志量。
- 使用 [/logging](/logging) 更改日志目标、级别和脱敏。

## 相关

- [Gateway 诊断](/gateway/diagnostics)
- [Gateway 故障排除](/gateway/troubleshooting)
