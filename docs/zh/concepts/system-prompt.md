---
mmh3_hash: "3a04e985a90fea084ad347559cdbdb90"
summary: "OpenClaw system prompt 包含什么以及如何组装"
read_when:
  - 编辑 system prompt 文本、工具列表或时间/心跳部分
  - 更改 workspace bootstrap 或 skills 注入行为
title: "System prompt"
---

OpenClaw 为每次 agent 运行构建自定义 system prompt。该 prompt 由 **OpenClaw 拥有**，不使用 pi-coding-agent 默认 prompt。

Prompt 由 OpenClaw 组装并注入每次 agent 运行。

Prompt 组装分三层：

- `buildAgentSystemPrompt` 从显式输入渲染 prompt。它应保持为纯渲染器，不应直接读取全局配置。
- `resolveAgentSystemPromptConfig` 解析由配置支持的 prompt 旋钮，例如 owner 显示、TTS 提示、model 别名、memory 引用模式，以及特定 agent 的子 agent 委托模式。
- 运行时适配器（嵌入式、CLI、命令/导出预览、compaction）收集工具、沙箱状态、channel 功能、context 文件和 provider prompt 贡献等实时信息，然后调用已配置的 prompt facade。

这样可以使导出/调试 prompt 界面与实时运行保持一致，而无需将每个运行时特定细节都变成一个庞大的整体构建器。

Provider plugin 可以在不替换完整 OpenClaw 所有 prompt 的情况下贡献感知缓存的 prompt 指导。Provider 运行时可以：

- 替换一小组命名的核心部分（`interaction_style`、`tool_call_style`、`execution_bias`）
- 在 prompt 缓存边界上方注入**稳定前缀**
- 在 prompt 缓存边界下方注入**动态后缀**

将 provider 自有贡献用于特定 model 系列的调优。保留旧版 `before_prompt_build` prompt 变更以兼容或真正全局 prompt 变更，而非普通 provider 行为。

OpenAI GPT-5 系列覆盖层保持核心执行规则较小，并为 persona 锁定、简洁输出、工具纪律、并行查找、可交付成果覆盖、验证、缺失 context 和终端工具卫生添加特定 model 的指导。

## 结构

Prompt 设计上紧凑，使用固定部分：

- **Tooling**：结构化工具权威来源提醒加运行时工具使用指导。
- **Execution Bias**：紧凑的执行指导：在可操作请求上即时行动，持续直到完成或受阻，从弱工具结果中恢复，实时检查可变状态，并在最终确定前验证。
- **Safety**：避免寻求权力行为或绕过监督的简短护栏提醒。
- **Skills**（如果可用）：告知 model 如何按需加载 skill 指令。
- **OpenClaw Control**：告知 model 优先使用 `gateway` 工具进行配置/重启工作，避免发明 CLI 命令。
- **OpenClaw Self-Update**：如何使用 `config.schema.lookup` 安全检查配置，使用 `config.patch` 修改配置，使用 `config.apply` 替换完整配置，以及仅在用户明确请求时运行 `update.run`。仅限 owner 的 `gateway` 工具也拒绝重写 `tools.exec.ask` / `tools.exec.security`，包括归一化为这些受保护 exec 路径的旧版 `tools.bash.*` 别名。
- **Workspace**：工作目录（`agents.defaults.workspace`）。
- **Documentation**：OpenClaw 文档/源代码的本地路径以及何时读取它们。
- **Workspace Files（injected）**：指示下方包含 bootstrap 文件。
- **Sandbox**（启用时）：指示沙箱化运行时、沙箱路径以及是否可用提升的 exec。
- **Current Date & Time**：仅时区（缓存稳定；实时时钟来自 `session_status`）。
- **Assistant Output Directives**：紧凑的附件、语音笔记和回复标签语法。
- **Heartbeats**：心跳 prompt 和 ack 行为，当默认 agent 启用心跳时。
- **Runtime**：主机、OS、node、model、repo 根目录（检测到时）、thinking 级别（一行）。
- **Reasoning**：当前可见级别 + /reasoning 切换提示。

OpenClaw 将大型稳定内容（包括 **Project Context**）保持在内部 prompt 缓存边界之上。易变的 channel/session 部分，如 Control UI 嵌入指导、**Messaging**、**Voice**、**Group Chat Context**、**Reactions**、**Heartbeats** 和 **Runtime**，附加在该边界之下，以便具有前缀缓存的本地后端可以跨 channel 轮次重用稳定的 workspace 前缀。工具描述同样应避免在已接受的 schema 携带该运行时详情时嵌入当前 channel 名称。

Tooling 部分还包括长期运行工作的运行时指导：

- 使用 cron 进行未来跟进（"稍后回来"、提醒、定期工作），而非 `exec` 睡眠循环、`yieldMs` 延迟技巧或重复 `process` 轮询
- 仅对现在启动并在后台继续运行的命令使用 `exec` / `process`
- 当启用自动完成唤醒时，启动一次命令并在它发出输出或失败时依靠基于推送的唤醒路径
- 当需要检查正在运行的命令时，使用 `process` 进行日志、状态、输入或干预
- 如果任务较大，优先使用 `sessions_spawn`；子 agent 完成是基于推送的，会自动向请求者通知
- 不要在循环中轮询 `subagents list` / `sessions_list` 只是为了等待完成

`agents.defaults.subagents.delegationMode` 可以加强此指导。默认的 `suggest` 模式保持基准提示。`prefer` 添加专用的 **Sub-Agent Delegation** 部分，告知主 agent 作为响应式协调器，将任何比直接回复更复杂的工作通过 `sessions_spawn` 推送。这仅是 prompt 层面的；工具策略仍控制 `sessions_spawn` 是否可用。

当实验性 `update_plan` 工具启用时，Tooling 还会告知 model 仅对非平凡的多步骤工作使用它，保持恰好一个 `in_progress` 步骤，并避免在每次更新后重复整个计划。

System prompt 中的安全护栏是建议性的。它们引导 model 行为但不强制策略。使用工具策略、exec 审批、沙箱化和 channel 允许列表进行硬性强制执行；operator 可以通过设计禁用这些。

在具有原生审批卡/按钮的 channel 上，运行时 prompt 现在告知 agent 首先依赖该原生审批 UI。只有在工具结果表明聊天审批不可用或手动审批是唯一途径时，才应包含手动 `/approve` 命令。

## Prompt 模式

OpenClaw 可以为子 agent 渲染更小的 system prompt。运行时为每次运行设置 `promptMode`（不是用户可见的配置）：

- `full`（默认）：包含上述所有部分。
- `minimal`：用于子 agent；省略 **Memory Recall**、**OpenClaw Self-Update**、**Model Aliases**、**User Identity**、**Assistant Output Directives**、**Messaging**、**Silent Replies** 和 **Heartbeats**。Tooling、**Safety**、**Skills**（如果提供）、Workspace、Sandbox、Current Date & Time（已知时）、Runtime 和注入的 context 保持可用。
- `none`：仅返回基本身份行。

当 `promptMode=minimal` 时，额外注入的 prompt 标记为 **Subagent Context** 而非 **Group Chat Context**。

对于 channel 自动回复运行，当直接、群组或仅消息工具的 context 拥有可见回复合约时，OpenClaw 省略通用的 **Silent Replies** 部分。只有旧的自动群组/channel 模式应该显示 `NO_REPLY`；直接聊天和仅消息工具的回复不接收静默令牌指导。

## Prompt 快照

OpenClaw 在 `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 下为 Codex 运行时快乐路径保留已提交的 prompt 快照。它们渲染选定的 app-server 线程/轮次参数，以及为 Telegram 直接、Discord 群组和心跳轮次重建的 model 绑定 prompt 层堆栈。该堆栈包括从 Codex model 目录/缓存形状生成的固定 Codex `gpt-5.5` model prompt fixture、Codex 快乐路径权限开发者文本、OpenClaw 开发者指令、OpenClaw 提供时的轮次范围协作模式指令、用户轮次输入，以及动态工具规格的引用。

使用 `pnpm prompt:snapshots:sync-codex-model` 刷新固定的 Codex model prompt fixture。默认情况下，脚本在 `$CODEX_HOME/models_cache.json`、`~/.codex/models_cache.json` 处查找 Codex 的运行时缓存，然后才回退到 `~/code/codex/codex-rs/models-manager/models.json` 的维护者 Codex checkout 约定。如果这些源都不存在，命令退出而不更改已提交的 fixture。传递 `--catalog <path>` 从特定的 `models_cache.json` 或 `models.json` 文件刷新。

这些快照仍然不是逐字节的原始 OpenAI 请求捕获。Codex 可以在 OpenClaw 发送线程和轮次参数后，在 Codex 运行时内部添加运行时拥有的 workspace context，如 `AGENTS.md`、环境 context、memories、app/plugin 指令和内置默认协作模式指令。

使用 `pnpm prompt:snapshots:gen` 重新生成它们，使用 `pnpm prompt:snapshots:check` 验证漂移。CI 在附加边界分片中运行漂移检查，以便 prompt 变更和快照更新保持附加到同一 PR。

## Workspace bootstrap 注入

Bootstrap 文件从活跃 workspace 解析，然后路由到与其生命周期匹配的 prompt 界面：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅在全新 workspace 上）
- `MEMORY.md`（如果存在）

在原生 Codex harness 上，OpenClaw 避免在每次用户轮次中重复稳定的 workspace 文件。Codex 通过其自己的项目文档发现加载 `AGENTS.md`。`SOUL.md`、`IDENTITY.md`、`TOOLS.md` 和 `USER.md` 作为 Codex 开发者指令转发。`HEARTBEAT.md` 内容不注入；心跳轮次在文件存在且非空时获得一条指向该文件的协作模式说明。`MEMORY.md` 和活跃的 `BOOTSTRAP.md` 内容目前保留普通轮次 context 角色。

在非 Codex harness 上，bootstrap 文件继续按其现有门控组合到 OpenClaw prompt 中。当默认 agent 禁用心跳或 `agents.defaults.heartbeat.includeSystemPromptSection` 为 false 时，`HEARTBEAT.md` 在正常运行中被省略。保持注入文件简洁，尤其是 `MEMORY.md`。`MEMORY.md` 旨在保持为精选的长期摘要；详细的每日笔记属于 `memory/*.md`，`memory_search` 和 `memory_get` 可以按需检索它们。过大的 `MEMORY.md` 文件会增加 prompt 使用量，并可能因以下 bootstrap 文件限制而被部分注入。

<Note>
`memory/*.md` 每日文件**不**是正常 bootstrap Project Context 的一部分。在普通轮次中，它们通过 `memory_search` 和 `memory_get` 工具按需访问，因此除非 model 显式读取它们，否则不会计入 context 窗口。裸 `/new` 和 `/reset` 轮次是例外：运行时可以将最近的每日 memory 作为一次性启动 context 块预置到该首次轮次。
</Note>

大文件会以标记截断。每文件最大大小由 `agents.defaults.bootstrapMaxChars`（默认：12000）控制。所有文件的总注入 bootstrap 内容受 `agents.defaults.bootstrapTotalMaxChars`（默认：60000）限制。缺失文件注入简短的缺失文件标记。当发生截断时，OpenClaw 可以注入简洁的 system prompt 警告通知；通过 `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`；默认：`always`）控制此选项。详细的原始/注入计数保留在诊断中，如 `/context`、`/status`、doctor 和日志。

对于 memory 文件，截断不是数据丢失：文件在磁盘上保持完整，但 model 只看到缩短的注入副本，直到它直接读取或搜索 memory。如果 `MEMORY.md` 反复被截断，将其提炼为较短的持久摘要，并将详细历史移入 `memory/*.md`，或有意提高 bootstrap 限制。

子 agent session 仅注入 `AGENTS.md` 和 `TOOLS.md`（其他 bootstrap 文件被过滤掉以保持子 agent context 较小）。

内部 hook 可以通过 `agent:bootstrap` 拦截此步骤，以变更或替换注入的 bootstrap 文件（例如将 `SOUL.md` 替换为备用 persona）。

如果你想让 agent 听起来不那么千篇一律，从 [SOUL.md 个性指南](/concepts/soul)开始。

要检查每个注入文件的贡献量（原始与注入、截断，以及工具 schema 开销），使用 `/context list` 或 `/context detail`。参见 [Context](/concepts/context)。

## 时间处理

当用户时区已知时，system prompt 包含专用的 **Current Date & Time** 部分。为了保持 prompt 缓存稳定，它现在只包含**时区**（无动态时钟或时间格式）。

当 agent 需要当前时间时，使用 `session_status`；状态卡包含时间戳行。同一工具还可以选择性地设置 per-session model 覆盖（`model=default` 清除它）。

配置方式：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行为详情参见 [Date & Time](/date-time)。

## Skills

当存在符合条件的 skill 时，OpenClaw 注入一个紧凑的**可用 skill 列表**（`formatSkillsForPrompt`），其中包含每个 skill 的**文件路径**。Prompt 指示 model 使用 `read` 加载列出位置（workspace、managed 或 bundled）的 SKILL.md。如果没有符合条件的 skill，Skills 部分将被省略。

资格包括 skill 元数据门控、运行时环境/配置检查，以及配置了 `agents.defaults.skills` 或 `agents.list[].skills` 时的有效 agent skill 允许列表。

Plugin 捆绑的 skill 只有在其拥有的 plugin 启用时才有资格。这让工具 plugin 可以公开更深入的操作指南，而无需将所有指导直接嵌入每个工具描述中。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这使基本 prompt 保持较小，同时仍支持有针对性的 skill 使用。

Skill 列表预算由 skills 子系统拥有：

- 全局默认值：`skills.limits.maxSkillsPromptChars`
- Per-agent 覆盖：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用有界运行时摘录使用不同的界面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

这种分割将 skill 大小调整与运行时读取/注入大小调整（如 `memory_get`、实时工具结果和 compaction 后 AGENTS.md 刷新）分开。

## 文档

System prompt 包含一个 **Documentation** 部分。当本地文档可用时，它指向本地 OpenClaw 文档目录（Git checkout 中的 `docs/` 或捆绑的 npm 包文档）。如果本地文档不可用，则回退到 [https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一部分还包括 OpenClaw 源代码位置。Git checkout 暴露本地源根目录，以便 agent 可以直接检查代码。包安装包含 GitHub 源 URL，并告知 agent 在文档不完整或过时时在那里查看源代码。Prompt 还注明公共文档镜像、社区 Discord 和 ClawHub（[https://clawhub.ai](https://clawhub.ai)）用于 skill 发现。它告知 model 对于 OpenClaw 行为、命令、配置或架构，首先查阅文档，并尽可能自己运行 `openclaw status`（仅在无法访问时才询问用户）。对于配置，它将 agent 指向 `gateway` 工具操作 `config.schema.lookup` 获取精确的字段级文档和约束，然后指向 `docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md` 获取更广泛的指导。

## 相关

- [Agent 运行时](/concepts/agent)
- [Agent workspace](/concepts/agent-workspace)
- [Context engine](/concepts/context-engine)
