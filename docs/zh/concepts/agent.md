---
mmh3_hash: "a7863a0d6612b0bc1dd7a47d4ded5b5d"
summary: "Agent 运行时、工作区契约和 Session Bootstrap"
read_when:
  - 修改 Agent 运行时、工作区 Bootstrap 或 Session 行为
title: "Agent 运行时"
---

OpenClaw 运行一个**单个嵌入式 Agent 运行时**——每个 Gateway 一个 Agent 进程，拥有自己的工作区、Bootstrap 文件和 Session 存储。本页涵盖该运行时契约：工作区必须包含什么，哪些文件会被注入，以及 Session 如何对其进行 Bootstrap。

## 工作区（必需）

OpenClaw 使用单个 Agent 工作区目录（`agents.defaults.workspace`）作为工具和上下文的 Agent **唯一**工作目录（`cwd`）。

建议：如果 `~/.openclaw/openclaw.json` 缺失，使用 `openclaw setup` 创建它并初始化工作区文件。

完整工作区布局 + 备份指南：[Agent 工作区](/concepts/agent-workspace)

如果启用了 `agents.defaults.sandbox`，非主 Session 可以使用 `agents.defaults.sandbox.workspaceRoot` 下的每个 Session 的沙盒工作区（参见 [Gateway 配置](/gateway/configuration)）。

## Bootstrap 文件（已注入）

在 `agents.defaults.workspace` 内，OpenClaw 期望这些用户可编辑的文件：

- `AGENTS.md` - 操作指令 + "Memory"
- `SOUL.md` - 人设、边界、语气
- `TOOLS.md` - 用户维护的工具说明（例如 `imsg`、`sag`、约定）
- `BOOTSTRAP.md` - 一次性的首次运行仪式（完成后删除）
- `IDENTITY.md` - Agent 名称/氛围/表情符号
- `USER.md` - 用户 Profile + 首选称谓

在新 Session 的第一次轮次，OpenClaw 将这些文件的内容注入到系统提示的项目上下文中。

空白文件会被跳过。大型文件会被修剪并截断，带有标记，以保持提示精简（读取文件以获取完整内容）。

如果文件缺失，OpenClaw 注入一行"缺失文件"标记行（`openclaw setup` 将创建一个安全的默认模板）。

`BOOTSTRAP.md` 仅为**全新工作区**创建（没有其他 Bootstrap 文件存在）。在待处理时，OpenClaw 将其保留在项目上下文中，并为初始仪式添加系统提示 Bootstrap 指导，而不是将其复制到用户消息中。如果在完成仪式后删除它，它不应在以后的重启时重新创建。

要完全禁用 Bootstrap 文件创建（对于预填充的工作区），设置：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 内置工具

核心工具（read/exec/edit/write 和相关系统工具）始终可用，受工具策略约束。`apply_patch` 是可选的，由 `tools.exec.applyPatch` 门控。`TOOLS.md` **不**控制哪些工具存在；它是关于_您_如何使用它们的指导。

## Skills

OpenClaw 从这些位置加载 Skill（最高优先级优先）：

- 工作区：`<workspace>/skills`
- 项目 Agent Skill：`<workspace>/.agents/skills`
- 个人 Agent Skill：`~/.agents/skills`
- 托管/本地：`~/.openclaw/skills`
- 捆绑（随安装附带）
- 额外 Skill 文件夹：`skills.load.extraDirs`

Skill 可以由配置/环境门控（参见 [Gateway 配置](/gateway/configuration) 中的 `skills`）。

## 运行时边界

嵌入式 Agent 运行时基于 Pi Agent 核心（模型、工具和提示流水线）。Session 管理、发现、工具连接和 Channel 传递是该核心之上的 OpenClaw 拥有的层。

## Session

Session 转录以 JSONL 格式存储在：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Session ID 是稳定的，由 OpenClaw 选择。不会读取其他工具的旧版 Session 文件夹。

## 流式传输时的 Steering

当队列模式为 `steer` 时，入站消息被注入到当前运行中。排队的 Steering 在**当前助手轮次完成其工具调用执行后**、在下一次 LLM 调用之前传递。Pi 在 `steer` 时一起清空所有待处理的 Steering 消息；旧版 `queue` 每个模型边界清空一条消息。Steering 不再跳过当前助手消息中剩余的工具调用。

当队列模式为 `followup` 或 `collect` 时，入站消息被保留直到当前轮次结束，然后用排队的有效载荷开始新的 Agent 轮次。参见[队列](/concepts/queue)和[Steering 队列](/concepts/queue-steering)了解模式和边界行为。

块流式传输在助手块完成后立即发送；它**默认关闭**（`agents.defaults.blockStreamingDefault: "off"`）。通过 `agents.defaults.blockStreamingBreak` 调整边界（`text_end` 与 `message_end`；默认为 text_end）。用 `agents.defaults.blockStreamingChunk` 控制软块分块（默认 800-1200 字符；优先段落分隔，然后换行；最后才是句子）。用 `agents.defaults.blockStreamingCoalesce` 合并流式块以减少单行垃圾信息（发送前基于空闲的合并）。非 Telegram Channel 需要显式 `*.blockStreaming: true` 来启用块回复。

更多细节：[流式传输 + 分块](/concepts/streaming)。

## 模型引用

配置中的模型引用（例如 `agents.defaults.model` 和 `agents.defaults.models`）通过拆分**第一个** `/` 来解析。

- 配置模型时使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含 Provider 前缀（例如：`openrouter/moonshotai/kimi-k2`）。
- 如果省略 Provider，OpenClaw 先尝试别名，然后尝试该精确模型 ID 的唯一已配置 Provider 匹配，最后才回退到已配置的默认 Provider。

## 配置（最小化）

至少设置：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（强烈建议）

---

_下一步：[群聊](/channels/group-messages)_ 🦞

## 相关

- [Agent 工作区](/concepts/agent-workspace)
- [多 Agent 路由](/concepts/multi-agent)
- [Session 管理](/concepts/session)
