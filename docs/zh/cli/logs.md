---
mmh3_hash: "a259abe53f228205ea5dc102a29d4bff"
title: "`openclaw logs`"
sidebarTitle: "openclaw logs"
summary: "`openclaw logs` 的 CLI 参考(通过 RPC 尾随 Gateway 日志)"
read_when:
  - 您需要远程尾随 Gateway 日志(无需 SSH)
  - 您想要用于工具的 JSON 日志行
---

# `openclaw logs`

通过 RPC 尾随 Gateway 文件日志(在远程模式下工作)。

相关:

- 日志概述:[Logging](/logging)
- Gateway CLI:[gateway](/cli/gateway)

## 选项

- `--limit <n>`:返回的最大日志行数(默认 `200`)
- `--max-bytes <n>`:从日志文件读取的最大字节数(默认 `250000`)
- `--follow`:跟踪日志流
- `--interval <ms>`:跟踪时的轮询间隔(默认 `1000`)
- `--json`:发出行分隔的 JSON 事件
- `--plain`:纯文本输出,无样式格式
- `--no-color`:禁用 ANSI 颜色
- `--local-time`:以您的本地时区渲染时间戳

## 共享 Gateway RPC 选项

`openclaw logs` 还接受标准 Gateway 客户端标志:

- `--url <url>`:Gateway WebSocket URL
- `--token <token>`:Gateway 令牌
- `--timeout <ms>`:超时(毫秒,默认 `30000`)
- `--expect-final`:当 Gateway 调用由 Agent 支持时等待最终响应

当您传递 `--url` 时,CLI 不会自动应用配置或环境凭据。如果目标 Gateway 需要认证,请显式包含 `--token`。

## 示例

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## 说明

- 使用 `--local-time` 以您的本地时区渲染时间戳。
- 如果本地回环 Gateway 要求配对,`openclaw logs` 会自动回退到已配置的本地日志文件。显式 `--url` 目标不使用此回退。
