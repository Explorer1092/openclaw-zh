---
title: "系统提示词 (System Prompt)"
sidebarTitle: "系统提示词"
mmh3_hash: "5df19fa6acc4c3fa2b1f0f249fe40271"
summary: "OpenClaw system prompt 包含什么以及如何组装"
read_when: ["编辑 system prompt 文本、tools 列表或 time/heartbeat 部分","更改 workspace bootstrap 或 skills 注入行为"]
---

# 系统提示词 (System Prompt)

OpenClaw 为每个 agent 运行构建自定义 system prompt。Prompt 由 **OpenClaw 拥有**，不使用 pi-coding-agent 默认 prompt。

Prompt 由 OpenClaw 组装并注入到每个 agent 运行中。

Provider plugins 可以贡献 cache-aware prompt 指导，而不替换完整的 OpenClaw 拥有的 prompt。Provider runtime 可以：

- 替换一小组命名的核心部分（`interaction_style`、`tool_call_style`、`execution_bias`）
- 在 prompt cache 边界上方注入**稳定前缀**
- 在 prompt cache 边界下方注入**动态后缀**

将 provider 拥有的贡献用于模型族特定的调优。保留旧版 `before_prompt_build` prompt 修改以实现兼容性或真正的全局 prompt 更改，而不是正常的 provider 行为。

## 结构

Prompt 有意紧凑并使用固定部分：

- **Tooling**：结构化工具真实来源提醒，加上运行时工具使用指导。
- **Safety**：简短的护栏提醒，避免权力寻求行为或绕过监督。
- **Skills**（在可用时）：告诉 model 如何按需加载 skill 指令。
- **OpenClaw Self-Update**：如何使用 `config.schema.lookup` 安全检查配置、使用 `config.patch` 修补配置、使用 `config.apply` 替换完整配置，以及仅在用户明确请求时运行 `update.run`。仅限所有者的 `gateway` 工具也拒绝重写 `tools.exec.ask` / `tools.exec.security`，包括规范化到这些受保护 exec 路径的旧版 `tools.bash.*` 别名。
- **Workspace**：工作目录（`agents.defaults.workspace`）。
- **Documentation**：OpenClaw 文档的本地路径（repo 或 npm 包）以及何时读取它们。
- **Workspace Files (injected)**：表示 bootstrap 文件包含在下面。
- **Sandbox**（在启用时）：表示沙盒运行时、沙盒路径以及是否有提升的 exec 可用。
- **Current Date & Time**：用户本地时间、时区和时间格式。
- **Reply Tags**：支持的 providers 的可选回复标签语法。
- **Heartbeats**：heartbeat prompt 和 ack 行为。
- **Runtime**：主机、OS、node、model、repo root（在检测到时）、thinking 级别（一行）。
- **Reasoning**：当前可见性级别 + /reasoning 切换提示。

Tooling 部分还包括长时间运行工作的运行时指导：

- 使用 cron 进行未来跟进（"稍后回来"、提醒、重复工作），而不是 `exec` sleep 循环、`yieldMs` 延迟技巧或重复的 `process` 轮询
- 仅将 `exec` / `process` 用于现在启动并继续在后台运行的命令
- 当启用自动完成唤醒时，启动命令一次，并在它发出输出或失败时依赖基于推送的唤醒路径
- 当你需要检查正在运行的命令时，使用 `process` 查看日志、状态、输入或干预
- 如果任务较大，优先使用 `sessions_spawn`；子 agent 完成是基于推送的，并自动通知请求者
- 不要在循环中轮询 `subagents list` / `sessions_list` 只是为了等待完成

当实验性 `update_plan` 工具启用时，Tooling 还告诉 model 仅对非平凡的多步骤工作使用它，保持恰好一个 `in_progress` 步骤，并避免在每次更新后重复整个计划。

System prompt 中的安全护栏是建议性的。它们指导 model 行为，但不强制执行策略。使用 tool 策略、exec 批准、沙盒和 channel 允许列表进行硬强制；运营者可以按设计禁用这些。

在具有原生批准卡片/按钮的 channels 上，运行时 prompt 现在告诉 agent 首先依赖该原生批准 UI。只有当 tool result 表示聊天批准不可用或手动批准是唯一路径时，才应包含手动 `/approve` 命令。

## Prompt 模式

OpenClaw 可以为子 agents 渲染较小的 system prompts。运行时为每次运行设置 `promptMode`（不是面向用户的配置）：

- `full`（默认）：包括上面的所有部分。
- `minimal`：用于子 agents；省略 **Skills**、**Memory Recall**、**OpenClaw Self-Update**、**Model Aliases**、**User Identity**、**Reply Tags**、**Messaging**、**Silent Replies** 和 **Heartbeats**。Tooling、**Safety**、Workspace、Sandbox、Current Date & Time（在已知时）、Runtime 和注入的 context 保持可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的 prompts 被标记为 **Subagent Context** 而不是 **Group Chat Context**。

## Workspace bootstrap 注入

Bootstrap 文件被修剪并附加在 **Project Context** 下，以便 model 在不需要显式读取的情况下看到身份和 profile context：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅在全新 workspaces 上）
- `MEMORY.md`（在存在时），否则以小写 `memory.md` 作为备用

所有这些文件在每次回合都**注入到 context 窗口中**，这意味着它们消耗 tokens。保持它们简洁 — 特别是 `MEMORY.md`，它可能随时间增长并导致意外的高 context 使用和更频繁的 compaction。

> **注意：** `memory/*.md` 每日文件**不会**自动注入。它们通过 `memory_search` 和 `memory_get` tools 按需访问，因此除非 model 明确读取它们，否则不会计入 context 窗口。

大文件会用标记截断。每个文件的最大大小由 `agents.defaults.bootstrapMaxChars` 控制（默认：20000）。跨文件的总注入 bootstrap 内容上限由 `agents.defaults.bootstrapTotalMaxChars` 控制（默认：150000）。缺失文件注入一个简短的缺失文件标记。当发生截断时，OpenClaw 可以在 Project Context 中注入警告块；通过 `agents.defaults.bootstrapPromptTruncationWarning` 控制（`off`、`once`、`always`；默认：`once`）。

子 agent sessions 仅注入 `AGENTS.md` 和 `TOOLS.md`（其他 bootstrap 文件被过滤掉以保持子 agent context 小）。

内部 hooks 可以通过 `agent:bootstrap` 拦截此步骤以改变或替换注入的 bootstrap 文件（例如交换 `SOUL.md` 为替代角色）。

如果你想让 agent 听起来不那么通用，从 [SOUL.md 个性指南](/concepts/soul) 开始。

要检查每个注入文件贡献多少（原始与注入、截断，加上 tool schema 开销），使用 `/context list` 或 `/context detail`。参见 [Context](/concepts/context)。

## 时间处理

当用户时区已知时，system prompt 包括专用的 **Current Date & Time** 部分。为了保持 prompt cache 稳定，它现在只包括**时区**（没有动态时钟或时间格式）。

当 agent 需要当前时间时使用 `session_status`；状态卡包括时间戳行。同一工具还可以选择性地设置每个 session 的 model 覆盖（`model=default` 清除它）。

配置：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

参见 [Date & Time](/date-time) 了解完整行为详情。

## Skills

当存在符合条件的 skills 时，OpenClaw 注入一个紧凑的**可用 skills 列表**（`formatSkillsForPrompt`），其中包含每个 skill 的**文件路径**。Prompt 指示 model 使用 `read` 在列出的位置（workspace、managed 或 bundled）加载 SKILL.md。如果没有符合条件的 skills，则省略 Skills 部分。

资格包括 skill 元数据门、运行时环境/配置检查，以及在配置 `agents.defaults.skills` 或 `agents.list[].skills` 时的有效 agent skill 允许列表。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这使基础 prompt 保持小，同时仍然支持针对性的 skill 使用。

## Documentation

在可用时，system prompt 包括一个 **Documentation** 部分，指向本地 OpenClaw 文档目录（repo workspace 中的 `docs/` 或捆绑的 npm 包 docs），还注明了公共镜像、源码 repo、社区 Discord 和 ClawHub（[https://clawhub.ai](https://clawhub.ai)）用于 skills 发现。Prompt 指示 model 首先参考本地文档了解 OpenClaw 行为、命令、配置或架构，并尽可能自己运行 `openclaw status`（仅在缺乏访问权限时询问用户）。
