---
title: "Context"
mmh3_hash: "4aa26d197ac3aa8c956fc8c702c3fe15"
summary: "Context: model 看到什么、如何构建以及如何检查"
read_when:
  - 你想了解 OpenClaw 中"context"的含义
  - 你正在调试为什么 model "知道"某事(或忘记了它)
  - 你想减少 context 开销(/context、/status、/compact)
---
# Context

"Context"是 **OpenClaw 发送给 model 用于运行的所有内容**。它受 model 的 **context window**(token 限制)约束。

初学者心智模型:
- **System prompt** (OpenClaw 构建):规则、tools、skills 列表、时间/runtime 和注入的 workspace 文件。
- **对话历史**:此 session 的你的消息 + assistant 的消息。
- **Tool calls/results + 附件**:命令输出、文件读取、图像/音频等。

Context *不同于*"内存":内存可以存储在磁盘上并稍后重新加载;context 是 model 当前窗口内的内容。

## 快速开始(检查 context)

- `/status` → 快速"我的窗口有多满?" 视图 + session 设置。
- `/context list` → 注入了什么 + 大致大小(每个文件 + 总计)。
- `/context detail` → 更深入的细分:每个文件、每个工具 schema 大小、每个 skill 条目大小和 system prompt 大小。
- `/usage tokens` → 向正常回复附加每个回复的 usage footer。
- `/compact` → 将较旧的历史记录总结为紧凑条目以释放窗口空间。

另见:[Slash commands](/zh/tools/slash-commands)、[Token use & costs](/zh/token-use)、[Compaction](/zh/concepts/compaction)。

## 示例输出

值因 model、provider、tool policy 和 workspace 中的内容而异。

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 20,000 chars
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

## 什么计入 context window

model 接收的所有内容都计入,包括:
- System prompt(所有部分)。
- 对话历史。
- Tool calls + tool results。
- 附件/transcripts(图像/音频/文件)。
- Compaction 摘要和 pruning 工件。
- Provider "包装器"或隐藏标头(不可见,仍然计数)。

## OpenClaw 如何构建 system prompt

System prompt 由 **OpenClaw 拥有** 并在每次运行时重建。它包括:
- Tool 列表 + 简短描述。
- Skills 列表(仅元数据;见下文)。
- Workspace 位置。
- 时间(UTC + 转换后的用户时间,如果已配置)。
- Runtime 元数据(host/OS/model/thinking)。
- 在 **Project Context** 下注入的 workspace bootstrap 文件。

完整细分:[System Prompt](/zh/concepts/system-prompt)。

## 注入的 workspace 文件(Project Context)

默认情况下,OpenClaw 注入一组固定的 workspace 文件(如果存在):
- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`(仅首次运行)

大文件使用 `agents.defaults.bootstrapMaxChars`(默认 `20000` 字符)按文件截断。`/context` 显示 **原始 vs 注入** 大小以及是否发生截断。

## Skills: 注入了什么 vs 按需加载

System prompt 包含紧凑的 **skills 列表**(name + description + location)。此列表具有真实的开销。

Skill 指令 *默认不包含*。期望 model **仅在需要时** `read` skill 的 `SKILL.md`。

## Tools: 有两个成本

Tools 以两种方式影响 context:
1) System prompt 中的 **Tool 列表文本**(你看到的"Tooling")。
2) **Tool schemas** (JSON)。这些被发送给 model 以便它可以调用 tools。即使你看不到它们作为纯文本,它们也计入 context。

`/context detail` 分解最大的 tool schemas,以便你可以看到什么占主导地位。

## Commands、directives 和"内联快捷方式"

Slash commands 由 Gateway 处理。有几种不同的行为:
- **独立 commands**:仅为 `/...` 的消息作为 command 运行。
- **Directives**: `/think`、`/verbose`、`/reasoning`、`/elevated`、`/model`、`/queue` 在 model 看到消息之前被剥离。
  - 仅 directive 的消息持久化 session 设置。
  - 正常消息中的内联 directives 作为每条消息的提示。
- **内联快捷方式**(仅允许列表发送者):正常消息中的某些 `/...` tokens 可以立即运行(例如:"hey /status"),并在 model 看到剩余文本之前被剥离。

详细信息:[Slash commands](/zh/tools/slash-commands)。

## Sessions、compaction 和 pruning(什么持久化)

跨消息持久化的内容取决于机制:
- **正常历史记录** 在 session transcript 中持久化,直到通过 policy compact/prune。
- **Compaction** 将摘要持久化到 transcript 中并保持最近的消息完整。
- **Pruning** 从运行的 *内存中* prompt 中删除旧的 tool results,但不重写 transcript。

文档:[Session](/zh/concepts/session)、[Compaction](/zh/concepts/compaction)、[Session pruning](/zh/concepts/session-pruning)。

## `/context` 实际报告什么

`/context` 在可用时更喜欢最新的 **运行构建的** system prompt 报告:
- `System prompt (run)` = 从最后一次嵌入式(工具能力)运行中捕获并持久化在 session store 中。
- `System prompt (estimate)` = 当没有运行报告时(或通过不生成报告的 CLI backend 运行时)即时计算。

无论哪种方式,它都报告大小和主要贡献者;它 **不** 转储完整的 system prompt 或 tool schemas。
