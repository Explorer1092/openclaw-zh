---
mmh3_hash: "7ca6ee0a5e21de49f432a4274e347a38"
summary: "Agent runtime (embedded pi-mono)、workspace 契约和 session bootstrap"
read_when:
  - 更改 agent runtime、workspace bootstrap 或 session 行为
title: "Agent Runtime"
---

# Agent Runtime 🤖

OpenClaw 运行一个派生自 **pi-mono** 的单个嵌入式 agent runtime。

## Workspace (必需)

OpenClaw 使用单个 agent workspace 目录 (`agents.defaults.workspace`) 作为 agent 用于工具和 context 的**唯一**工作目录 (`cwd`)。

推荐:使用 `openclaw setup` 创建 `~/.openclaw/openclaw.json`(如果缺失)并初始化 workspace 文件。

完整的 workspace 布局 + 备份指南:[Agent workspace](/concepts/agent-workspace)

如果启用了 `agents.defaults.sandbox`,非主 sessions 可以在 `agents.defaults.sandbox.workspaceRoot` 下使用每个 session 的 workspaces 覆盖此设置(参见
[Gateway configuration](/gateway/configuration))。

## Bootstrap 文件(注入)

在 `agents.defaults.workspace` 中,OpenClaw 期望这些用户可编辑的文件:

- `AGENTS.md` — 操作说明 + "内存"
- `SOUL.md` — 人格、边界、语气
- `TOOLS.md` — 用户维护的工具注释(例如 `imsg`、`sag`、约定)
- `BOOTSTRAP.md` — 一次性首次运行仪式(完成后删除)
- `IDENTITY.md` — agent 名称/氛围/表情符号
- `USER.md` — 用户配置文件 + 首选称呼

在新 session 的第一个回合中,OpenClaw 将这些文件的内容直接注入到 agent context 中。

跳过空白文件。大文件被修剪和截断并带有标记,以保持 prompts 精简(读取文件以获取完整内容)。

如果文件缺失,OpenClaw 会注入一个"缺失文件"标记行(`openclaw setup` 将创建一个安全的默认模板)。

`BOOTSTRAP.md` 仅为**全新 workspace**(不存在其他 bootstrap 文件)创建。如果在完成仪式后删除它,它不应在以后的重启时重新创建。

要完全禁用 bootstrap 文件创建(对于预先植入的 workspaces),请设置:

```json5
{ agent: { skipBootstrap: true } }
```

## 内置工具

核心工具(read/exec/edit/write 和相关系统工具)始终可用,受 tool policy 约束。`apply_patch` 是可选的,由 `tools.exec.applyPatch` 控制。`TOOLS.md` **不**控制哪些工具存在;它是关于*你*希望如何使用它们的指导。

## Skills

OpenClaw 从三个位置加载 skills(workspace 在名称冲突时获胜):

- Bundled(随安装附带)
- Managed/local: `~/.openclaw/skills`
- Workspace: `<workspace>/skills`

Skills 可以通过配置/env 进行控制(参见 [Gateway configuration](/gateway/configuration) 中的 `skills`)。

## pi-mono 集成

OpenClaw 重用 pi-mono 代码库的部分内容(models/tools),但**session 管理、发现和 tool 连接由 OpenClaw 拥有**。

- 没有 pi-coding agent runtime。
- 不会查询 `~/.pi/agent` 或 `<workspace>/.pi` 设置。

## Sessions

Session transcripts 存储为 JSONL,位于:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

session ID 是稳定的,由 OpenClaw 选择。传统的 Pi/Tau session 文件夹**不**被读取。

## 流式传输时的引导

当队列模式为 `steer` 时,入站消息被注入到当前运行中。在**每次工具调用后**检查队列;如果存在排队消息,则跳过当前 assistant 消息中的其余工具调用(错误工具结果为"由于排队的用户消息而跳过。"),然后在下一个 assistant 响应之前注入排队的用户消息。

当队列模式为 `followup` 或 `collect` 时,入站消息将保持到当前回合结束,然后使用排队的 payloads 开始新的 agent 回合。参见 [Queue](/concepts/queue) 了解模式 + debounce/cap 行为。

Block 流式传输在完成后立即发送完成的 assistant blocks;它**默认关闭** (`agents.defaults.blockStreamingDefault: "off"`)。通过 `agents.defaults.blockStreamingBreak` 调整边界(`text_end` vs `message_end`;默认为 text_end)。使用 `agents.defaults.blockStreamingChunk` 控制软 block 分块(默认为 800–1200 字符;首选段落分隔符,然后是换行符;最后是句子)。使用 `agents.defaults.blockStreamingCoalesce` 合并流式块以减少单行垃圾信息(发送前基于空闲的合并)。非 Telegram 通道需要显式 `*.blockStreaming: true` 以启用 block 回复。详细工具摘要在工具启动时发出(无 debounce);Control UI 在可用时通过 agent 事件流式传输工具输出。更多详细信息:[Streaming + chunking](/concepts/streaming)。

## Model refs

配置中的 model refs(例如 `agents.defaults.model` 和 `agents.defaults.models`)通过在**第一个** `/` 上拆分来解析。

- 配置 models 时使用 `provider/model`。
- 如果 model ID 本身包含 `/`(OpenRouter 样式),请包含 provider 前缀(例如:`openrouter/moonshotai/kimi-k2`)。
- 如果省略 provider,OpenClaw 将输入视为别名或**默认 provider** 的 model(仅当 model ID 中没有 `/` 时才有效)。

## 配置(最小)

至少设置:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`(强烈推荐)

---

_下一步: [Group Chats](/channels/group-messages)_ 🦞
