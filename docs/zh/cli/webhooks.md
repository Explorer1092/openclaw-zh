---
mmh3_hash: "3b15a461756bca68c7140c9d69b56b44"
summary: "`openclaw webhooks` 的 CLI 参考（webhook 助手 + Gmail Pub/Sub）"
read_when:
  - 您想将 Gmail Pub/Sub 事件接入 OpenClaw
  - 您需要完整的标志列表和默认值
title: "Webhooks"
---

# `openclaw webhooks`

Webhook 助手和集成。目前此界面范围限于与捆绑的 `gog` 监视器集成的 Gmail Pub/Sub 流程。

## 子命令

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| 子命令        | 描述                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------- |
| `gmail setup` | 配置 Gmail 监视、Pub/Sub 主题/订阅和 OpenClaw webhook 交付目标。                            |
| `gmail run`   | 运行 `gog watch serve` 加上监视自动续订循环。                                               |

## `webhooks gmail setup`

配置 Gmail 监视、Pub/Sub 和 OpenClaw webhook 交付。

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### 必需

| 标志                | 描述               |
| ------------------- | ------------------ |
| `--account <email>` | 要监视的 Gmail 账户。 |

### Pub/Sub 选项

| 标志                    | 默认值                 | 描述                                                    |
| ----------------------- | ---------------------- | ------------------------------------------------------- |
| `--project <id>`        | （无）                 | GCP 项目 ID（OAuth 客户端所有者）。                     |
| `--topic <name>`        | `gog-gmail-watch`      | Pub/Sub 主题名称。                                      |
| `--subscription <name>` | `gog-gmail-watch-push` | Pub/Sub 订阅名称。                                      |
| `--label <label>`       | `INBOX`                | 要监视的 Gmail 标签。                                   |
| `--push-endpoint <url>` | （无）                 | 显式的 Pub/Sub 推送端点。覆盖 Tailscale。               |

### OpenClaw 交付选项

| 标志                   | 默认值 | 描述                                   |
| ---------------------- | ------ | -------------------------------------- |
| `--hook-url <url>`     | （无） | OpenClaw webhook URL。                 |
| `--hook-token <token>` | （无） | OpenClaw webhook 令牌。                |
| `--push-token <token>` | （无） | 转发到 `gog watch serve` 的推送令牌。  |

### `gog watch serve` 选项

| 标志                  | 默认值          | 描述                                                                         |
| --------------------- | --------------- | ---------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | `gog watch serve` 绑定主机。                                                 |
| `--port <port>`       | `8788`          | `gog watch serve` 端口。                                                     |
| `--path <path>`       | `/gmail-pubsub` | `gog watch serve` 路径。                                                     |
| `--include-body`      | `true`          | 包含电子邮件正文片段。传递 `--no-include-body` 以禁用。                      |
| `--max-bytes <n>`     | `20000`         | 每个正文片段的最大字节数。                                                   |
| `--renew-minutes <n>` | `720`（12 小时）| 每 N 分钟续订 Gmail 监视。                                                   |

### Tailscale 暴露

| 标志                      | 默认值   | 描述                                                          |
| ------------------------- | -------- | ------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | 通过 tailscale 公开推送端点：`funnel`、`serve` 或 `off`。     |
| `--tailscale-path <path>` | （无）   | tailscale serve/funnel 路径。                                 |
| `--tailscale-target <t>`  | （无）   | Tailscale serve/funnel 目标（端口、`host:port` 或 URL）。     |

### 输出

| 标志     | 描述                                       |
| -------- | ------------------------------------------ |
| `--json` | 打印机器可读摘要，而不是文本。             |

## `webhooks gmail run`

在前台运行 `gog watch serve` 加上监视自动续订循环。

```bash
openclaw webhooks gmail run --account you@example.com
```

`run` 接受与 `setup` 相同的 `gog watch serve`、OpenClaw 交付、Pub/Sub 和 Tailscale 标志，但以下情况除外：

- `--account` 在 `run` 上是**可选的**（它回退到已配置的账户）。
- `run` **不**接受 `--project`、`--push-endpoint` 或 `--json`。
- `run` 标志没有内置默认值；缺少的值回退到 `setup` 写入的值。

| 类别              | 标志                                                                             |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`、`--topic`、`--subscription`、`--label`                              |
| OpenClaw 交付     | `--hook-url`、`--hook-token`、`--push-token`                                     |
| `gog watch serve` | `--bind`、`--port`、`--path`、`--include-body`、`--max-bytes`、`--renew-minutes` |
| Tailscale         | `--tailscale`、`--tailscale-path`、`--tailscale-target`                          |

<Note>
对于 `run`，`--topic` 值是完整的 Pub/Sub 主题路径（`projects/.../topics/...`），而不仅仅是简短的主题名称。
</Note>

## 端到端流程

请参阅 [Gmail Pub/Sub 集成](/automation/cron-jobs#gmail-pubsub-integration) 了解与这些 CLI 命令配合使用的 GCP 项目、OAuth 和 Gateway 端设置。

## 相关

- [CLI 参考](/cli)
- [Webhook 自动化](/automation/webhook)
- [Gmail Pub/Sub](/automation/cron-jobs#gmail-pubsub-integration)
