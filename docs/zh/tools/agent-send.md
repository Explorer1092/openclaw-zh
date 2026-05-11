---
mmh3_hash: "7f97aaf5cac2fb0404a551ee15e61ec9"
summary: "从 CLI 运行 Agent 轮次并可选地将回复发送到 Channel"
read_when:
  - 想从脚本或命令行触发 Agent 运行
  - 需要以编程方式将 Agent 回复发送到聊天 Channel
title: "Agent send"
---

`openclaw agent` 无需入站聊天消息即可从命令行运行单个 Agent 轮次。可用于脚本化工作流、测试和程序化交付。

## 快速入门

<Steps>
  <Step title="运行简单的 Agent 轮次">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    这会通过 Gateway 发送消息并打印回复。

  </Step>

  <Step title="指定特定 Agent 或 Session">
    ```bash
    # 指定特定 Agent
    openclaw agent --agent ops --message "Summarize logs"

    # 指定电话号码（派生 Session key）
    openclaw agent --to +15555550123 --message "Status update"

    # 复用现有 Session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="将回复发送到 Channel">
    ```bash
    # 发送到 WhatsApp（默认 Channel）
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # 发送到 Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## 标志

| 标志                          | 说明                                                    |
| ----------------------------- | ------------------------------------------------------- |
| `--message \<text\>`          | 要发送的消息（必填）                                    |
| `--to \<dest\>`               | 从目标派生 Session key（电话号码、聊天 id）             |
| `--agent \<id\>`              | 指定已配置的 Agent（使用其 `main` Session）             |
| `--session-id \<id\>`         | 通过 id 复用现有 Session                                |
| `--local`                     | 强制使用本地嵌入式运行时（跳过 Gateway）                |
| `--deliver`                   | 将回复发送到聊天 Channel                                |
| `--channel \<name\>`          | 交付 Channel（whatsapp、telegram、discord、slack 等）   |
| `--reply-to \<target\>`       | 覆盖交付目标                                            |
| `--reply-channel \<name\>`    | 覆盖交付 Channel                                        |
| `--reply-account \<id\>`      | 覆盖交付账户 id                                         |
| `--thinking \<level\>`        | 为所选模型 Profile 设置思考级别                         |
| `--verbose \<on\|full\|off\>` | 设置详细级别                                            |
| `--timeout \<seconds\>`       | 覆盖 Agent 超时                                         |
| `--json`                      | 输出结构化 JSON                                         |

## 行为

- 默认情况下，CLI **通过 Gateway** 运行。添加 `--local` 可强制在当前机器上使用嵌入式运行时。
- 如果 Gateway 不可访问，CLI **回退**到本地嵌入式运行。
- Session 选择：`--to` 派生 Session key（群组/Channel 目标保持隔离；直接聊天折叠为 `main`）。
- 思考和详细标志会持久保存到 Session 存储中。
- 输出：默认为纯文本，或使用 `--json` 获取结构化载荷加元数据。
- 使用 `--json --deliver` 时，JSON 包含已发送、已抑制、部分发送和发送失败的交付状态。请参见 [JSON 交付状态](/cli/agent#json-delivery-status)。

## 示例

```bash
# 带 JSON 输出的简单轮次
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# 带思考级别的轮次
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# 发送到与 Session 不同的 Channel
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 相关

<CardGroup cols={2}>
  <Card title="Agent CLI 参考" href="/cli/agent" icon="terminal">
    完整的 `openclaw agent` 标志和选项参考。
  </Card>
  <Card title="子 Agent" href="/tools/subagents" icon="users">
    后台子 Agent 生成。
  </Card>
  <Card title="Session" href="/concepts/session" icon="comments">
    Session key 的工作原理以及 `--to`、`--agent` 和 `--session-id` 的解析方式。
  </Card>
  <Card title="Slash 命令" href="/tools/slash-commands" icon="slash">
    Agent Session 内部使用的原生命令目录。
  </Card>
</CardGroup>
