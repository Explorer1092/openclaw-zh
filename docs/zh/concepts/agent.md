---
mmh3_hash: "e6acad0588f1608593177b8cdbcb8560"
summary: "Agent runtime、workspace 契约和 session bootstrap"
read_when:
  - 更改 agent runtime、workspace bootstrap 或 session 行为
title: "Agent Runtime"
---

OpenClaw 运行一个**单个嵌入式 agent runtime**——每个 Gateway 一个 agent 进程，拥有自己的 workspace、bootstrap 文件和 session 存储。本页涵盖该 runtime 契约：workspace 必须包含什么，哪些文件会被注入，以及 session 如何对其进行 bootstrap。

## Workspace（必需）

OpenClaw 使用单个 agent workspace 目录 (`agents.defaults.workspace`) 作为 agent 用于工具和 context 的**唯一**工作目录 (`cwd`)。

推荐：使用 `openclaw setup` 创建 `~/.openclaw/openclaw.json`（如果缺失）并初始化 workspace 文件。

完整的 workspace 布局 + 备份指南：[Agent workspace](/concepts/agent-workspace)

如果启用了 `agents.defaults.sandbox`，非主 Session 可以在 `agents.defaults.sandbox.workspaceRoot` 下使用每个 Session 的 workspace 覆盖此设置（参见 [Gateway configuration](/gateway/configuration)）。

## Bootstrap 文件（注入）

在 `agents.defaults.workspace` 中，OpenClaw 期望这些用户可编辑的文件：

- `AGENTS.md` — 操作说明 + "内存"
- `SOUL.md` — 人格、边界、语气
- `TOOLS.md` — 用户维护的工具注释（例如 `imsg`、`sag`、约定）
- `BOOTSTRAP.md` — 一次性首次运行仪式（完成后删除）
- `IDENTITY.md` — agent 名称/氛围/表情符号
- `USER.md` — 用户配置文件 + 首选称呼

在新 Session 的第一个回合中，OpenClaw 将这些文件的内容直接注入到 agent context 中。

跳过空白文件。大文件被修剪和截断并带有标记，以保持 prompts 精简（读取文件以获取完整内容）。

如果文件缺失，OpenClaw 会注入一个"缺失文件"标记行（`openclaw setup` 将创建一个安全的默认模板）。

`BOOTSTRAP.md` 仅为**全新 workspace**（不存在其他 bootstrap 文件）创建。如果在完成仪式后删除它，它不应在以后的重启时重新创建。

要完全禁用 bootstrap 文件创建（对于预先植入的 workspace），请设置：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 内置工具

核心工具（read/exec/edit/write 和相关系统工具）始终可用，受 tool policy 约束。`apply_patch` 是可选的，由 `tools.exec.applyPatch` 控制。`TOOLS.md` **不**控制哪些工具存在；它是关于*你*希望如何使用它们的指导。

## Skills

OpenClaw 从以下位置加载 Skills（优先级从高到低）：

- Workspace: `<workspace>/skills`
- Project agent skills: `<workspace>/.agents/skills`
- Personal agent skills: `~/.agents/skills`
- Managed/local: `~/.openclaw/skills`
- Bundled（随安装附带）
- Extra skill folders: `skills.load.extraDirs`

Skills 可以通过配置/env 进行控制（参见 [Gateway configuration](/gateway/configuration) 中的 `skills`）。

## Runtime 边界

嵌入式 agent runtime 建立在 Pi agent core（models、工具和 prompt 管道）上。Session 管理、发现、工具连接和 channel 传递是 OpenClaw 在该 core 之上的层。

## Sessions

Session transcripts 存储为 JSONL，位于：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Session ID 是稳定的，由 OpenClaw 选择。其他工具的旧版 Session 文件夹不被读取。

## 流式传输时的引导

当队列模式为 `steer` 时，入站消息被注入到当前运行中。排队的引导在**当前 assistant 回合完成其工具调用之后**、下一次 LLM 调用之前传递。引导不再跳过当前 assistant 消息中的剩余工具调用；它在下一个 model 边界注入排队的消息。

当队列模式为 `followup` 或 `collect` 时，入站消息将保持到当前回合结束，然后使用排队的 payloads 开始新的 agent 回合。参见 [Queue](/concepts/queue) 了解模式 + debounce/cap 行为。

Block 流式传输在完成后立即发送完成的 assistant blocks；它**默认关闭**（`agents.defaults.blockStreamingDefault: "off"`）。通过 `agents.defaults.blockStreamingBreak` 调整边界（`text_end` vs `message_end`；默认为 text_end）。使用 `agents.defaults.blockStreamingChunk` 控制软 block 分块（默认为 800–1200 字符；首选段落分隔符，然后是换行符；最后是句子）。使用 `agents.defaults.blockStreamingCoalesce` 合并流式块以减少单行垃圾信息（发送前基于空闲的合并）。非 Telegram Channel 需要显式 `*.blockStreaming: true` 以启用 block 回复。详细工具摘要在工具启动时发出（无 debounce）；Control UI 在可用时通过 agent 事件流式传输工具输出。更多详细信息：[Streaming + chunking](/concepts/streaming)。

## Model refs

配置中的 model refs（例如 `agents.defaults.model` 和 `agents.defaults.models`）通过在**第一个** `/` 上拆分来解析。

- 配置 models 时使用 `provider/model`。
- 如果 model ID 本身包含 `/`（OpenRouter 样式），请包含 provider 前缀（例如：`openrouter/moonshotai/kimi-k2`）。
- 如果省略 provider，OpenClaw 先尝试别名匹配，再进行唯一配置的 provider 精确 model id 匹配，最后才回退到配置的默认 provider。如果该 provider 不再提供配置的默认 model，OpenClaw 会回退到第一个配置的 provider/model，而不是显示过时的已移除 provider 默认值。

## 配置（最小）

至少设置：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（强烈推荐）

---

_下一步：[Group Chats](/channels/group-messages)_ 🦞

## 相关链接

- [Agent workspace](/concepts/agent-workspace)
- [Multi-agent 路由](/concepts/multi-agent)
- [Session 管理](/concepts/session)
