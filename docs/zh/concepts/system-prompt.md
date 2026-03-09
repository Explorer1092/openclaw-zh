---
title: "系统提示词 (System Prompt)"
sidebarTitle: "系统提示词"
mmh3_hash: "1156c0c588984539ea0af86676c47a82"
summary: "OpenClaw system prompt 包含什么以及如何组装"
read_when: ["编辑 system prompt 文本、tools 列表或 time/heartbeat 部分","更改 workspace bootstrap 或 skills 注入行为"]
---
# 系统提示词 (System Prompt)

OpenClaw 为每个 agent 运行构建自定义 system prompt。Prompt 由 **OpenClaw 拥有**,不使用 pi-coding-agent 默认 prompt。

Prompt 由 OpenClaw 组装并注入到每个 agent 运行中。

## 结构

Prompt 有意紧凑并使用固定部分:

- **Tooling**: 当前 tool 列表 + 简短描述。
- **Safety**: 简短的护栏提醒,避免权力寻求行为或绕过监督。
- **Skills** (在可用时):告诉 model 如何按需加载 skill 指令。
- **OpenClaw Self-Update**: 如何运行 `config.apply` 和 `update.run`。
- **Workspace**: 工作目录(`agents.defaults.workspace`)。
- **Documentation**: OpenClaw 文档的本地路径(repo 或 npm package)以及何时阅读它们。
- **Workspace Files (注入)**: 表示下面包含 bootstrap 文件。
- **Sandbox** (启用时):表示沙盒 runtime、sandbox 路径以及是否可用 elevated exec。
- **Current Date & Time**: 用户本地时间、timezone 和时间格式。
- **Reply Tags**: 支持的 providers 的可选回复标签语法。
- **Heartbeats**: heartbeat prompt 和 ack 行为。
- **Runtime**: host、OS、node、model、repo root(检测时)、thinking level(一行)。
- **Reasoning**: 当前可见性级别 + /reasoning 切换提示。

System prompt 中的安全护栏是建议性的。它们指导 model 行为,但不强制执行策略。使用 tool policy、exec approvals、sandboxing 和 channel allowlists 进行硬性强制执行;运营者可以按设计禁用这些。

## Prompt 模式

OpenClaw 可以为 sub-agents 渲染更小的 system prompts。Runtime 为每次运行设置 `promptMode`(不是用户面向的配置):

- `full` (默认):包括上述所有部分。
- `minimal`: 用于 sub-agents;省略 **Skills**、**Memory Recall**、**OpenClaw Self-Update**、**Model Aliases**、**User Identity**、**Reply Tags**、**Messaging**、**Silent Replies** 和 **Heartbeats**。Tooling、**Safety**、Workspace、Sandbox、Current Date & Time(已知时)、Runtime 和注入的 context 保持可用。
- `none`: 仅返回基础身份行。

当 `promptMode=minimal` 时,额外注入的 prompts 被标记为 **Subagent Context** 而不是 **Group Chat Context**。

## Workspace bootstrap 注入

Bootstrap 文件被修剪并附加在 **Project Context** 下,以便 model 无需显式读取即可看到身份和配置文件 context:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (仅在全新 workspaces 上)
- `MEMORY.md` 和/或 `memory.md`(在 workspace 中存在时;任一或两者都可能被注入)

所有这些文件都**注入到 context window 中**,每次对话都会消耗 tokens。保持它们简洁——尤其是 `MEMORY.md`,它会随时间增长,导致意外的高 context 使用量和更频繁的压缩。

> **注意:** `memory/*.md` 每日文件**不会**自动注入。它们通过 `memory_search` 和 `memory_get` 工具按需访问,因此除非 model 显式读取它们,否则不计入 context window。

大文件用标记截断。每个文件的最大大小由 `agents.defaults.bootstrapMaxChars` 控制(默认:20000)。跨文件注入的总 bootstrap 内容上限由 `agents.defaults.bootstrapTotalMaxChars` 控制(默认:150000)。缺失的文件注入简短的缺失文件标记。发生截断时,OpenClaw 可以在 Project Context 中注入警告块;使用 `agents.defaults.bootstrapPromptTruncationWarning`(`off`、`once`、`always`;默认:`once`)进行控制。

Sub-agent sessions 仅注入 `AGENTS.md` 和 `TOOLS.md`(其他 bootstrap 文件被过滤掉以保持 sub-agent context 小巧)。

Internal hooks 可以通过 `agent:bootstrap` 拦截此步骤以变更或替换注入的 bootstrap 文件(例如将 `SOUL.md` 交换为备用 persona)。

要检查每个注入文件的贡献(原始 vs 注入、截断,加上 tool schema 开销),使用 `/context list` 或 `/context detail`。参见 [Context](/zh/concepts/context)。

## 时间处理

当已知用户 timezone 时,system prompt 包含专用的 **Current Date & Time** 部分。为了保持 prompt cache 稳定,它现在仅包括 **time zone**(无动态时钟或时间格式)。

当 agent 需要当前时间时使用 `session_status`;status 卡包括时间戳行。

配置:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

参见 [Date & Time](/zh/date-time) 了解完整行为详细信息。

## Skills

当存在合格的 skills 时,OpenClaw 注入紧凑的 **available skills list** (`formatSkillsForPrompt`),其中包括每个 skill 的 **file path**。Prompt 指示 model 使用 `read` 加载列出位置的 SKILL.md(workspace、managed 或 bundled)。如果没有合格的 skills,则省略 Skills 部分。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这使基础 prompt 保持小巧,同时仍启用有针对性的 skill 使用。

## Documentation

在可用时,system prompt 包括指向本地 OpenClaw 文档目录(repo workspace 中的 `docs/` 或捆绑的 npm package 文档)的 **Documentation** 部分,并且还注释公共镜像、源 repo、社区 Discord 和 ClawHub (https://clawhub.com) 用于 skills 发现。Prompt 指示 model 首先查阅本地文档以了解 OpenClaw 行为、commands、configuration 或 architecture,并在可能时自己运行 `openclaw status`(仅在缺少访问权限时询问用户)。
