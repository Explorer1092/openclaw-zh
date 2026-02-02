---
title: "openclaw agent (直接运行 agent)"
sidebarTitle: "openclaw agent 命令"
mmh3_hash: "64d3a4c72dadf98ddd3ef3e8e8075661"
summary: "直接运行 `openclaw agent` CLI(可选投递)"
read_when: ["添加或修改 agent CLI 入口点"]
---
# openclaw agent (直接运行 agent)

`openclaw agent` 无需入站聊天消息即可运行单次 agent 转换。
默认情况下它会**通过网关**运行;添加 `--local` 可强制使用当前机器上的嵌入式运行时。

## 行为

- 必需: `--message <文本>`
- 会话选择:
  - `--to <目标>` 派生会话密钥(组/频道目标保持隔离;直接聊天折叠到 `main`),**或**
  - `--session-id <id>` 通过 id 重用现有会话,**或**
  - `--agent <id>` 直接定位到已配置的 agent(使用该 agent 的 `main` 会话密钥)
- 运行与正常入站回复相同的嵌入式 agent 运行时。
- Thinking/verbose 标志会持久化到会话存储中。
- 输出:
  - 默认: 打印回复文本(加上 `MEDIA:<url>` 行)
  - `--json`: 打印结构化负载 + 元数据
- 可选择使用 `--deliver` + `--channel` 将回复投递到频道(目标格式与 `openclaw message --target` 匹配)。
- 使用 `--reply-channel`/`--reply-to`/`--reply-account` 在不更改会话的情况下覆盖投递设置。

如果网关无法访问,CLI 会**回退**到嵌入式本地运行。

## 示例

```bash
openclaw agent --to +15555550123 --message "status update"
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --to +15555550123 --message "Summon reply" --deliver
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```

## 标志

- `--local`: 本地运行(需要在您的 shell 中配置模型提供商 API 密钥)
- `--deliver`: 将回复发送到选定的频道
- `--channel`: 投递频道(`whatsapp|telegram|discord|googlechat|slack|signal|imessage`,默认: `whatsapp`)
- `--reply-to`: 投递目标覆盖
- `--reply-channel`: 投递频道覆盖
- `--reply-account`: 投递账户 id 覆盖
- `--thinking <off|minimal|low|medium|high|xhigh>`: 持久化 thinking 级别(仅 GPT-5.2 + Codex 模型)
- `--verbose <on|full|off>`: 持久化 verbose 级别
- `--timeout <秒>`: 覆盖 agent 超时时间
- `--json`: 输出结构化 JSON
