---
mmh3_hash: "fbe620348c98516096c3bf98ceaab18e"
summary: "从 CLI 运行 Agent turn 并可选地将回复传递到 Channel"
read_when:
  - 希望从脚本或命令行触发 Agent 运行
  - 需要以编程方式将 Agent 回复传递到聊天 Channel
title: "Agent Send"
---

`openclaw agent` 无需入站聊天消息即可从命令行运行单个 Agent turn。适用于脚本化工作流、测试和程序化传递。

## 快速开始

<Steps>
  <Step title="运行简单的 Agent turn">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    这会通过 Gateway 发送消息并打印回复。

  </Step>

  <Step title="指定特定 Agent 或 Session">
    ```bash
    # 指定特定 Agent
    openclaw agent --agent ops --message "Summarize logs"

    # 指定电话号码（推导 Session key）
    openclaw agent --to +15555550123 --message "Status update"

    # 复用现有 Session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="将回复传递到 Channel">
    ```bash
    # 传递到 WhatsApp（默认 Channel）
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # 传递到 Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## 标志

| 标志                          | 描述                                                     |
| ----------------------------- | -------------------------------------------------------- |
| `--message \<text\>`          | 要发送的消息（必填）                                     |
| `--to \<dest\>`               | 从目标推导 Session key（电话、聊天 ID）                  |
| `--agent \<id\>`              | 指定已配置的 Agent（使用其 `main` Session）              |
| `--session-id \<id\>`         | 通过 ID 复用现有 Session                                 |
| `--local`                     | 强制使用本地嵌入运行时（跳过 Gateway）                   |
| `--deliver`                   | 将回复发送到聊天 Channel                                 |
| `--channel \<name\>`          | 传递 Channel（whatsapp、telegram、discord、slack 等）    |
| `--reply-to \<target\>`       | 传递目标覆盖                                             |
| `--reply-channel \<name\>`    | 传递 Channel 覆盖                                        |
| `--reply-account \<id\>`      | 传递账号 ID 覆盖                                         |
| `--thinking \<level\>`        | 为所选模型配置文件设置思考级别                           |
| `--verbose \<on\|full\|off\>` | 设置详细级别                                             |
| `--timeout \<seconds\>`       | 覆盖 Agent 超时                                          |
| `--json`                      | 输出结构化 JSON                                          |

## 行为

- 默认情况下，CLI **通过 Gateway** 运行。添加 `--local` 可强制在当前机器上使用嵌入运行时。
- 如果 Gateway 不可达，CLI **回退**到本地嵌入运行。
- Session 选择：`--to` 推导 Session key（群组/Channel 目标保持隔离；私信收缩为 `main`）。
- 思考和详细标志持久化到 Session 存储中。
- 输出：默认纯文本，或使用 `--json` 获取结构化载荷 + 元数据。

## 示例

```bash
# 带 JSON 输出的简单 turn
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# 带思考级别的 turn
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# 传递到与 Session 不同的 Channel
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 相关

- [Agent CLI 参考](/cli/agent)
- [子 Agent](/tools/subagents) -- 后台子 Agent 启动
- [Session](/concepts/session) -- Session key 的工作原理
