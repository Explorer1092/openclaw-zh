---
mmh3_hash: "27aac4ea3b37a5faf74d52c1abfd8a97"
summary: "Context：model 看到什么、如何构建以及如何检查"
read_when:
  - 您想了解 OpenClaw 中"context"的含义
  - 您正在调试为什么 model "知道"某事（或忘记了它）
  - 您想减少 context 开销（/context、/status、/compact）
title: "Context"
---

"Context"是 **OpenClaw 发送给 model 用于运行的所有内容**。它受 model 的 **context window**（token 限制）约束。

初学者心智模型：

- **System prompt**（OpenClaw 构建）：规则、tools、skills 列表、时间/runtime 和注入的 workspace 文件。
- **对话历史**：此 Session 的您的消息 + assistant 的消息。
- **Tool calls/results + 附件**：命令输出、文件读取、图像/音频等。

Context 与"内存"不同：内存可以存储在磁盘上并稍后重新加载；context 是 model 当前窗口内的内容。

## 快速开始（检查 context）

- `/status` → 快速"我的窗口有多满？"视图 + Session 设置。
- `/context list` → 注入了什么 + 大致大小（每个文件 + 总计）。
- `/context detail` → 更深入的细分：每个文件、每个工具 schema 大小、每个 Skill 条目大小和 system prompt 大小。
- `/context map` → 当前 Session 追踪的 context 贡献者的 WinDirStat 风格树形图图像。
- `/usage tokens` → 向正常回复附加每个回复的 usage footer。
- `/compact` → 将较旧的历史记录总结为紧凑条目以释放窗口空间。

另见：[Slash commands](/tools/slash-commands)、[Token use & costs](/reference/token-use)、[Compaction](/concepts/compaction)。

## 示例输出

值因 model、provider、tool policy 和 workspace 中的内容而异。

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

### `/context map`

发送从最新缓存运行报告生成的图像。在正常消息在 Session 中产生运行报告之前，`/context map` 返回不可用消息，而不是渲染估算。矩形面积与追踪的 prompt 字符数成正比：

- 注入的 workspace 文件
- 基础 system prompt 文本
- Skill prompt 条目
- Tool JSON schemas

`/context list`、`/context detail` 和 `/context json` 在没有缓存运行报告时仍然可以检查按需估算。

## 什么计入 context window

model 接收的所有内容都计入，包括：

- System prompt（所有部分）。
- 对话历史。
- Tool calls + tool results。
- 附件/transcripts（图像/音频/文件）。
- Compaction 摘要和 pruning 工件。
- Provider "包装器"或隐藏标头（不可见，仍然计数）。

## OpenClaw 如何构建 system prompt

System prompt 由 **OpenClaw 拥有**并在每次运行时重建。它包括：

- Tool 列表 + 简短描述。
- Skills 列表（仅元数据；见下文）。
- Workspace 位置。
- 时间（UTC + 转换后的用户时间，如果已配置）。
- Runtime 元数据（host/OS/model/thinking）。
- 在 **Project Context** 下注入的 workspace bootstrap 文件。

完整细分：[System Prompt](/concepts/system-prompt)。

## 注入的 workspace 文件（Project Context）

默认情况下，OpenClaw 注入一组固定的 workspace 文件（如果存在）：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅首次运行）

大文件使用 `agents.defaults.bootstrapMaxChars`（默认 `12000` 字符）按文件截断。OpenClaw 还使用 `agents.defaults.bootstrapTotalMaxChars`（默认 `60000` 字符）在文件间强制执行总 bootstrap 注入上限。`/context` 显示**原始 vs 注入**大小以及是否发生截断。

发生截断时，runtime 可以在 Project Context 下注入一个提示内警告块。使用 `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`；默认 `once`）进行配置。

## Skills：注入了什么 vs 按需加载

System prompt 包含紧凑的 **Skills 列表**（name + description + location）。此列表具有真实的开销。

Skill 指令默认不包含。期望 model **仅在需要时** `read` Skill 的 `SKILL.md`。

## Tools：有两个成本

Tools 以两种方式影响 context：

1. **Tool 列表文本**在 system prompt 中（您看到的"Tooling"）。
2. **Tool schemas**（JSON）。这些被发送给 model 以便它可以调用 tools。即使您看不到它们作为纯文本，它们也计入 context。

`/context detail` 分解最大的 tool schemas，以便您可以看到什么占主导地位。

## Commands、directives 和"内联快捷方式"

Slash commands 由 Gateway 处理。有几种不同的行为：

- **独立 commands**：仅为 `/...` 的消息作为 command 运行。
- **Directives**：`/think`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/model`、`/queue` 在 model 看到消息之前被剥离。
  - 仅 directive 的消息持久化 Session 设置。
  - 正常消息中的内联 directives 作为每条消息的提示。
- **内联快捷方式**（仅允许列表发送者）：正常消息中的某些 `/...` tokens 可以立即运行（例如："hey /status"），并在 model 看到剩余文本之前被剥离。

详细信息：[Slash commands](/tools/slash-commands)。

## Sessions、compaction 和 pruning（什么持久化）

跨消息持久化的内容取决于机制：

- **正常历史记录**在 Session transcript 中持久化，直到通过 policy compact/prune。
- **Compaction** 将摘要持久化到 transcript 中并保持最近的消息完整。
- **Pruning** 从运行的内存中 prompt 中删除旧的 tool results，但不重写 transcript。

文档：[Session](/concepts/session)、[Compaction](/concepts/compaction)、[Session pruning](/concepts/session-pruning)。

默认情况下，OpenClaw 使用内置的 `legacy` context engine 进行组装和 compaction。如果您安装了提供 `kind: "context-engine"` 的 Plugin 并通过 `plugins.slots.contextEngine` 选择它，OpenClaw 会将 context 组装、`/compact` 和相关的子 Agent context 生命周期 hooks 委托给该 engine。`ownsCompaction: false` 不会自动回退到 legacy engine；活动 engine 仍必须正确实现 `compact()`。参见 [Context Engine](/concepts/context-engine) 了解完整的可插拔接口、生命周期 hooks 和配置。

## `/context` 实际报告什么

`/context` 在可用时更喜欢最新的**运行构建的** system prompt 报告：

- `System prompt (run)` = 从最后一次嵌入式（工具能力）运行中捕获并持久化在 Session store 中。
- `System prompt (estimate)` = 当没有运行报告时即时计算（或通过不生成报告的 CLI 后端运行时）。

无论哪种方式，它都报告大小和主要贡献者；它**不**转储完整的 system prompt 或 tool schemas。

## 相关

<CardGroup cols={2}>
  <Card title="Context Engine" href="/concepts/context-engine" icon="puzzle-piece">
    通过 Plugin 自定义 context 注入。
  </Card>
  <Card title="Compaction" href="/concepts/compaction" icon="compress">
    总结长对话以保持在 model 窗口内。
  </Card>
  <Card title="System Prompt" href="/concepts/system-prompt" icon="message-lines">
    system prompt 如何构建以及每次轮次注入什么。
  </Card>
  <Card title="Agent Loop" href="/concepts/agent-loop" icon="arrows-rotate">
    从入站消息到最终回复的完整 Agent 执行周期。
  </Card>
</CardGroup>
