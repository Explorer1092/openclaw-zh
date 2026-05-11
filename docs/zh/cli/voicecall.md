---
mmh3_hash: "2ff8928d5f0180d0742b4a28c17c491e"
summary: "`openclaw voicecall` 的 CLI 参考（语音呼叫 Plugin 命令界面）"
read_when:
  - 您使用语音呼叫 Plugin 并想了解每个 CLI 入口点
  - 您需要 setup、smoke、call、continue、speak、dtmf、end、status、tail、latency、expose 和 start 的标志表和默认值
title: "Voicecall"
---

# `openclaw voicecall`

`voicecall` 是 Plugin 提供的命令。仅在安装并启用了语音呼叫 Plugin 时出现。

当 Gateway 运行时，操作命令（`call`、`start`、`continue`、`speak`、`dtmf`、`end`、`status`）被路由到该 Gateway 的语音呼叫运行时。如果没有 Gateway 可达，它们回退到独立的 CLI 运行时。

## 子命令

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| 子命令     | 描述                                                           |
| ---------- | -------------------------------------------------------------- |
| `setup`    | 显示 Provider 和 webhook 就绪检查。                            |
| `smoke`    | 运行就绪检查；仅在使用 `--yes` 时进行实时测试呼叫。            |
| `call`     | 发起出站语音呼叫。                                             |
| `start`    | `call` 的别名，`--to` 必需，`--message` 可选。                 |
| `continue` | 发送消息并等待下一个响应。                                     |
| `speak`    | 发送消息而不等待响应。                                         |
| `dtmf`     | 向活动通话发送 DTMF 数字。                                     |
| `end`      | 挂断活动通话。                                                 |
| `status`   | 检查活动通话（或按 `--call-id` 查看一个）。                    |
| `tail`     | 跟踪 `calls.jsonl`（在 Provider 测试期间很有用）。             |
| `latency`  | 从 `calls.jsonl` 汇总轮次延迟指标。                            |
| `expose`   | 切换 webhook 端点的 Tailscale serve/funnel。                   |

## 设置和冒烟测试

### `setup`

默认打印人类可读的就绪检查。传递 `--json` 用于脚本。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

运行相同的就绪检查。除非同时存在 `--to` 和 `--yes`，否则不会进行真实的电话呼叫。

| 标志               | 默认值                            | 描述                             |
| ------------------ | --------------------------------- | -------------------------------- |
| `-t, --to <phone>` | （无）                            | 用于实时冒烟测试的电话号码。     |
| `--message <text>` | `OpenClaw voice call smoke test.` | 冒烟测试呼叫期间要说的消息。     |
| `--mode <mode>`    | `notify`                          | 呼叫模式：`notify` 或 `conversation`。 |
| `--yes`            | `false`                           | 实际进行实时出站呼叫。           |
| `--json`           | `false`                           | 打印机器可读 JSON。              |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # 干运行
openclaw voicecall smoke --to "+15555550123" --yes  # 实时通知呼叫
```

<Note>
对于外部 Provider（`twilio`、`telnyx`、`plivo`），`setup` 和 `smoke` 需要来自 `publicUrl`、隧道或 Tailscale 暴露的公共 webhook URL。回环或私有 serve 回退会被拒绝，因为运营商无法访问它。
</Note>

## 呼叫生命周期

### `call`

发起出站语音呼叫。

| 标志                   | 必需 | 默认值            | 描述                                                                       |
| ---------------------- | ---- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | 是   | （无）            | 呼叫接通时要说的消息。                                                     |
| `-t, --to <phone>`     | 否   | 配置的 `toNumber` | 要呼叫的 E.164 电话号码。                                                  |
| `--mode <mode>`        | 否   | `conversation`    | 呼叫模式：`notify`（消息后挂断）或 `conversation`（保持打开）。            |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

`call` 的别名，标志形状不同。

| 标志               | 必需 | 默认值         | 描述                                 |
| ------------------ | ---- | -------------- | ------------------------------------ |
| `--to <phone>`     | 是   | （无）         | 要呼叫的电话号码。                   |
| `--message <text>` | 否   | （无）         | 呼叫接通时要说的消息。               |
| `--mode <mode>`    | 否   | `conversation` | 呼叫模式：`notify` 或 `conversation`。 |

### `continue`

发送消息并等待响应。

| 标志               | 必需 | 描述           |
| ------------------ | ---- | -------------- |
| `--call-id <id>`   | 是   | 呼叫 ID。      |
| `--message <text>` | 是   | 要说的消息。   |

### `speak`

发送消息而不等待响应。

| 标志               | 必需 | 描述           |
| ------------------ | ---- | -------------- |
| `--call-id <id>`   | 是   | 呼叫 ID。      |
| `--message <text>` | 是   | 要说的消息。   |

### `dtmf`

向活动通话发送 DTMF 数字。

| 标志                | 必需 | 描述                                     |
| ------------------- | ---- | ---------------------------------------- |
| `--call-id <id>`    | 是   | 呼叫 ID。                                |
| `--digits <digits>` | 是   | DTMF 数字（例如 `ww123456#` 用于等待）。 |

### `end`

挂断活动通话。

| 标志             | 必需 | 描述      |
| ---------------- | ---- | --------- |
| `--call-id <id>` | 是   | 呼叫 ID。 |

### `status`

检查活动通话。

| 标志             | 默认值 | 描述                     |
| ---------------- | ------ | ------------------------ |
| `--call-id <id>` | （无） | 将输出限制为一个通话。   |
| `--json`         | `false` | 打印机器可读 JSON。      |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## 日志和指标

### `tail`

跟踪语音呼叫 JSONL 日志。在启动时打印最后 `--since` 行，然后在写入新行时流式传输。

| 标志            | 默认值                     | 描述                       |
| --------------- | -------------------------- | -------------------------- |
| `--file <path>` | 从 Plugin 存储解析         | `calls.jsonl` 的路径。     |
| `--since <n>`   | `25`                       | 跟踪前要打印的行数。       |
| `--poll <ms>`   | `250`（最小 50）           | 轮询间隔（毫秒）。         |

### `latency`

从 `calls.jsonl` 汇总轮次延迟和监听等待指标。输出是带有 `recordsScanned`、`turnLatency` 和 `listenWait` 摘要的 JSON。

| 标志            | 默认值                     | 描述                             |
| --------------- | -------------------------- | -------------------------------- |
| `--file <path>` | 从 Plugin 存储解析         | `calls.jsonl` 的路径。           |
| `--last <n>`    | `200`（最小 1）            | 要分析的最近记录数。             |

## 公开 Webhook

### `expose`

为语音 webhook 启用、禁用或更改 Tailscale serve/funnel 配置。

| 标志                  | 默认值                                    | 描述                                                 |
| --------------------- | ----------------------------------------- | ---------------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`、`serve`（tailnet）或 `funnel`（公开）。       |
| `--path <path>`       | 配置的 `tailscale.path` 或 `--serve-path` | 要公开的 Tailscale 路径。                            |
| `--port <port>`       | 配置的 `serve.port` 或 `3334`             | 本地 webhook 端口。                                  |
| `--serve-path <path>` | 配置的 `serve.path` 或 `/voice/webhook`   | 本地 webhook 路径。                                  |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
仅将 webhook 端点公开到您信任的网络。在可能的情况下，优先使用 Tailscale Serve 而非 Funnel。
</Warning>

## 相关

- [CLI 参考](/cli)
- [语音呼叫 Plugin](/plugins/voice-call)
