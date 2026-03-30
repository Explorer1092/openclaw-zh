---
mmh3_hash: "39780d4a9db4c7fbc1d74dd9bdbffe4c"
read_when:
  - 使用或配置聊天命令
  - 调试命令路由或权限
summary: 斜杠命令：文本 vs 原生、配置和支持的命令
title: 斜杠命令
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: tools/slash-commands.md
  workflow: 15
---

# 斜杠命令

命令由 Gateway 网关处理。大多数命令必须作为以 `/` 开头的**独立**消息发送。
仅主机的 bash 聊天命令使用 `! <cmd>`（`/bash <cmd>` 是别名）。

有两个相关系统：

- **命令**：独立的 `/...` 消息。
- **指令**：`/think`、`/fast`、`/verbose`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。
  - 指令在模型看到消息之前被剥离。
  - 在普通聊天消息中（不是仅指令消息），它们被视为"内联提示"，**不会**持久化会话设置。
  - 在仅指令消息中（消息只包含指令），它们会持久化到会话并回复确认。
  - 指令仅对**授权发送者**生效。如果设置了 `commands.allowFrom`，则它是唯一使用的白名单；否则授权来自渠道白名单/配对加上 `commands.useAccessGroups`。未授权发送者看到指令被视为纯文本。

还有一些**内联快捷方式**（仅限白名单/授权发送者）：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
它们立即运行，在模型看到消息之前被剥离，剩余文本继续通过正常流程。

## 配置

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: false,
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text`（默认 `true`）启用解析聊天消息中的 `/...`。
  - 在没有原生命令的平台上（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams），即使你将此设置为 `false`，文本命令仍然有效。
- `commands.native`（默认 `"auto"`）注册原生命令。
  - Auto：在 Discord/Telegram 上启用；在 Slack 上禁用（直到你添加斜杠命令）；在不支持原生命令的提供商上忽略。
  - 设置 `channels.discord.commands.native`、`channels.telegram.commands.native` 或 `channels.slack.commands.native` 以按提供商覆盖（布尔值或 `"auto"`）。
  - `false` 在启动时清除 Discord/Telegram 上之前注册的命令。Slack 命令在 Slack 应用中管理，不会自动删除。
- `commands.nativeSkills`（默认 `"auto"`）在支持时原生注册 **Skill** 命令。
  - Auto：在 Discord/Telegram 上启用；在 Slack 上禁用（Slack 需要为每个 Skill 创建一个斜杠命令）。
  - 设置 `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills` 或 `channels.slack.commands.nativeSkills` 以按提供商覆盖（布尔值或 `"auto"`）。
- `commands.bash`（默认 `false`）启用 `! <cmd>` 来运行主机 shell 命令（`/bash <cmd>` 是别名；需要 `tools.elevated` 白名单）。
- `commands.bashForegroundMs`（默认 `2000`）控制 bash 切换到后台模式之前等待多长时间（`0` 立即后台运行）。
- `commands.config`（默认 `false`）启用 `/config`（读写 `openclaw.json`）。
- `commands.mcp`（默认 `false`）启用 `/mcp`（读写 `mcp.servers` 下 OpenClaw 管理的 MCP 配置）。
- `commands.plugins`（默认 `false`）启用 `/plugins`（插件发现/状态以及安装 + 启用/禁用控制）。
- `commands.debug`（默认 `false`）启用 `/debug`（仅运行时覆盖）。
- `commands.allowFrom`（可选）设置命令授权的按提供商白名单。配置后，它是命令和指令的唯一授权来源（渠道白名单/配对和 `commands.useAccessGroups` 被忽略）。使用 `"*"` 作为全局默认；特定提供商的键覆盖它。
- `commands.useAccessGroups`（默认 `true`）在未设置 `commands.allowFrom` 时对命令强制执行白名单/策略。

## 命令列表

文本 + 原生（启用时）：

- `/help`
- `/commands`
- `/tools [compact|verbose]`（显示当前智能体现在可以使用什么；`verbose` 添加描述）
- `/skill <name> [input]`（按名称运行 Skill）
- `/status`（显示当前状态；在可用时包含当前模型提供商的使用量/配额）
- `/allowlist`（列出/添加/删除白名单条目）
- `/approve <id> allow-once|allow-always|deny`（解决 exec 审批提示）
- `/context [list|detail|json]`（解释"上下文"；`detail` 显示每个文件 + 每个工具 + 每个 Skill + 系统提示词大小）
- `/btw <question>`（对当前会话提出临时侧边问题，不改变未来会话上下文；参见 [/tools/btw](/tools/btw)）
- `/export-session [path]`（别名：`/export`）（将当前会话导出为带完整系统提示的 HTML）
- `/whoami`（显示你的发送者 ID；别名：`/id`）
- `/session idle <duration|off>`（管理已绑定线程的非活跃自动取消焦点）
- `/session max-age <duration|off>`（管理已绑定线程的硬性上限自动取消焦点）
- `/subagents list|kill|log|info|send|steer|spawn`（检查、控制或创建当前会话的子智能体运行）
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions`（检查和控制 ACP 运行时会话）
- `/agents`（列出此会话的线程绑定智能体）
- `/focus <target>`（Discord：将此线程或新线程绑定到会话/子智能体目标）
- `/unfocus`（Discord：移除当前线程绑定）
- `/kill <id|#|all>`（立即中止此会话的一个或全部子智能体运行；无确认消息）
- `/steer <id|#> <message>`（立即引导正在运行的子智能体：在运行中时尽可能在线，否则中止当前工作并在引导消息上重启）
- `/tell <id|#> <message>`（`/steer` 的别名）
- `/config show|get|set|unset`（将配置持久化到磁盘，仅所有者；需要 `commands.config: true`）
- `/mcp show|get|set|unset`（管理 OpenClaw MCP 服务器配置，仅所有者；需要 `commands.mcp: true`）
- `/plugins list|show|get|install|enable|disable`（检查已发现的插件、安装新插件并切换启用状态；写操作仅所有者；需要 `commands.plugins: true`）
  - `/plugin` 是 `/plugins` 的别名。
  - `/plugin install <spec>` 接受与 `openclaw plugins install` 相同的插件规格：本地路径/压缩包、npm 包或 `clawhub:<pkg>`。
  - 启用/禁用写操作仍会回复重启提示。在有监视的前台 Gateway 上，OpenClaw 可能在写入后立即自动执行重启。
- `/debug show|set|unset|reset`（运行时覆盖，仅所有者；需要 `commands.debug: true`）
- `/usage off|tokens|full|cost`（每响应使用量页脚或本地成本摘要）
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio`（控制 TTS；参见 [/tts](/tools/tts)）
  - Discord：原生命令是 `/voice`（Discord 保留了 `/tts`）；文本 `/tts` 仍然有效。
- `/stop`
- `/restart`
- `/dock-telegram`（别名：`/dock_telegram`）（将回复切换到 Telegram）
- `/dock-discord`（别名：`/dock_discord`）（将回复切换到 Discord）
- `/dock-slack`（别名：`/dock_slack`）（将回复切换到 Slack）
- `/activation mention|always`（仅限群组）
- `/send on|off|inherit`（仅所有者）
- `/reset` 或 `/new [model]`（可选模型提示；其余部分传递）
- `/think <off|minimal|low|medium|high|xhigh>`（按模型/提供商动态选择；别名：`/thinking`、`/t`）
- `/fast status|on|off`（省略参数显示当前有效的快速模式状态）
- `/verbose on|full|off`（别名：`/v`）
- `/reasoning on|off|stream`（别名：`/reason`；启用时，发送带有 `Reasoning:` 前缀的单独消息；`stream` = 仅 Telegram 草稿）
- `/elevated on|off|ask|full`（别名：`/elev`；`full` 跳过 exec 审批）
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`（发送 `/exec` 显示当前设置）
- `/model <name>`（别名：`/models`；或 `agents.defaults.models.*.alias` 中的 `/<alias>`）
- `/queue <mode>`（加上选项如 `debounce:2s cap:25 drop:summarize`；发送 `/queue` 查看当前设置）
- `/bash <command>`（仅主机；`! <command>` 的别名；需要 `commands.bash: true` + `tools.elevated` 白名单）

仅文本：

- `/compact [instructions]`（参见 [/concepts/compaction](/concepts/compaction)）
- `! <command>`（仅主机；一次一个；对长时间运行的任务使用 `!poll` + `!stop`）
- `!poll`（检查输出/状态；接受可选的 `sessionId`；`/bash poll` 也可用）
- `!stop`（停止正在运行的 bash 任务；接受可选的 `sessionId`；`/bash stop` 也可用）

注意事项：

- 命令接受命令和参数之间的可选 `:`（例如 `/think: high`、`/send: on`、`/help:`）。
- `/new <model>` 接受模型别名、`provider/model` 或提供商名称（模糊匹配）；如果没有匹配，文本被视为消息正文。
- 要获取完整的提供商使用量分解，使用 `openclaw status --usage`。
- `/allowlist add|remove` 需要 `commands.config=true` 并遵循渠道 `configWrites`。
- 在多账户渠道中，配置目标的 `/allowlist --account <id>` 和 `/config set channels.<provider>.accounts.<id>...` 也遵循目标账户的 `configWrites`。
- `/usage` 控制每响应使用量页脚；`/usage cost` 从 OpenClaw 会话日志打印本地成本摘要。
- `/restart` 默认启用；设置 `commands.restart: false` 以禁用它。
- Discord 专属原生命令：`/vc join|leave|status` 控制语音频道（需要 `channels.discord.voice` 和原生命令；不支持文本形式）。
- Discord 线程绑定命令（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）需要有效启用线程绑定（`session.threadBindings.enabled` 和/或 `channels.discord.threadBindings.enabled`）。
- ACP 命令参考和运行时行为：[ACP Agents](/tools/acp-agents)。
- `/verbose` 用于调试和额外可见性；在正常使用中保持**关闭**。
- `/fast on|off` 持久化会话覆盖。使用 Sessions UI 的 `inherit` 选项清除它并回退到配置默认值。
- `/fast` 是特定于提供商的：OpenAI/OpenAI Codex 在原生 Responses 端点上将其映射到 `service_tier=priority`，而直接公共 Anthropic 请求（包括发送到 `api.anthropic.com` 的 OAuth 认证流量）将其映射到 `service_tier=auto` 或 `standard_only`。参见 [OpenAI](/providers/openai) 和 [Anthropic](/providers/anthropic)。
- 工具失败摘要在相关时仍然显示，但详细失败文本仅在 `/verbose` 为 `on` 或 `full` 时包含。
- `/reasoning`（和 `/verbose`）在群组设置中有风险：它们可能会暴露你不打算公开的内部推理或工具输出。最好保持关闭，尤其是在群聊中。
- **快速路径：** 来自白名单发送者的仅命令消息会立即处理（绕过队列 + 模型）。
- **群组提及门控：** 来自白名单发送者的仅命令消息绕过提及要求。
- **内联快捷方式（仅限白名单发送者）：** 某些命令在嵌入普通消息时也能工作，并在模型看到剩余文本之前被剥离。
  - 示例：`hey /status` 触发状态回复，剩余文本继续通过正常流程。
- 目前：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
- 未授权的仅命令消息被静默忽略，内联 `/...` 令牌被视为纯文本。
- **Skill 命令：** `user-invocable` Skills 作为斜杠命令公开。名称被清理为 `a-z0-9_`（最多 32 个字符）；冲突获得数字后缀（例如 `_2`）。
  - `/skill <name> [input]` 按名称运行 Skill（当原生命令限制阻止每个 Skill 命令时有用）。
  - 默认情况下，Skill 命令作为普通请求转发给模型。
  - Skills 可以选择声明 `command-dispatch: tool` 将命令直接路由到工具（确定性，无模型）。
  - 示例：`/prose`（OpenProse 插件）— 参见 [OpenProse](/prose)。
- **原生命令参数：** Discord 使用自动完成进行动态选项（以及当你省略必需参数时的按钮菜单）。当命令支持选择且你省略参数时，Telegram 和 Slack 显示按钮菜单。

## `/tools`

`/tools` 回答的是运行时问题，而非配置问题：**此智能体在当前对话中现在可以使用什么**。

- 默认 `/tools` 是紧凑格式，针对快速扫描进行了优化。
- `/tools verbose` 添加简短描述。
- 支持参数的原生命令平台公开相同的 `compact|verbose` 模式切换。
- 结果是会话范围的，因此更改智能体、渠道、线程、发送者授权或模型可能会改变输出。
- `/tools` 包括运行时实际可达的工具，包括核心工具、已连接的插件工具和渠道自有工具。

对于配置文件和覆盖编辑，请使用 Control UI 工具面板或配置/目录界面，而不是将 `/tools` 视为静态目录。

## 使用量显示（什么显示在哪里）

- **提供商使用量/配额**（示例："Claude 80% left"）在启用使用量跟踪时显示在 `/status` 中，针对当前模型提供商。
- **每响应令牌/成本**由 `/usage off|tokens|full` 控制（附加到普通回复）。
- `/model status` 是关于**模型/认证/端点**的，不是使用量。

## 模型选择（`/model`）

`/model` 作为指令实现。

示例：

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model opus@anthropic:default
/model status
```

注意事项：

- `/model` 和 `/model list` 显示紧凑的编号选择器（模型系列 + 可用提供商）。
- 在 Discord 上，`/model` 和 `/models` 打开带有提供商和模型下拉菜单以及提交步骤的交互式选择器。
- `/model <#>` 从该选择器中选择（并在可能时优先选择当前提供商）。
- `/model status` 显示详细视图，包括在可用时配置的提供商端点（`baseUrl`）和 API 模式（`api`）。

## 调试覆盖

`/debug` 让你设置**仅运行时**的配置覆盖（内存，不写磁盘）。仅所有者。默认禁用；使用 `commands.debug: true` 启用。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

注意事项：

- 覆盖立即应用于新的配置读取，但**不会**写入 `openclaw.json`。
- 使用 `/debug reset` 清除所有覆盖并返回到磁盘上的配置。

## 配置更新

`/config` 写入你的磁盘配置（`openclaw.json`）。仅所有者。默认禁用；使用 `commands.config: true` 启用。

示例：

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

注意事项：

- 配置在写入前会验证；无效更改会被拒绝。
- `/config` 更新在重启后持久化。

## MCP 更新

`/mcp` 将 OpenClaw 管理的 MCP 服务器定义写入 `mcp.servers` 下。仅所有者。默认禁用；使用 `commands.mcp: true` 启用。

示例：

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

注意事项：

- `/mcp` 将配置存储在 OpenClaw 配置中，而不是 Pi 拥有的项目设置中。
- 运行时适配器决定哪些传输实际上可执行。

## 插件更新

`/plugins` 让操作员检查已发现的插件并在配置中切换启用状态。只读流程可以使用 `/plugin` 作为别名。默认禁用；使用 `commands.plugins: true` 启用。

示例：

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

注意事项：

- `/plugins list` 和 `/plugins show` 对当前工作区和磁盘配置使用真实插件发现。
- `/plugins enable|disable` 仅更新插件配置；不安装或卸载插件。
- 启用/禁用更改后，重启 Gateway 以应用它们。

## 平台注意事项

- **文本命令**在普通聊天会话中运行（私信共享 `main`，群组有自己的会话）。
- **原生命令**使用隔离的会话：
  - Discord：`agent:<agentId>:discord:slash:<userId>`
  - Slack：`agent:<agentId>:slack:slash:<userId>`（前缀可通过 `channels.slack.slashCommand.sessionPrefix` 配置）
  - Telegram：`telegram:slash:<userId>`（通过 `CommandTargetSessionKey` 定向到聊天会话）
- **`/stop`** 定向到活动聊天会话，因此可以中止当前运行。
- **Slack：** `channels.slack.slashCommand` 仍然支持单个 `/openclaw` 风格的命令。如果你启用 `commands.native`，你必须为每个内置命令创建一个 Slack 斜杠命令（与 `/help` 相同的名称）。Slack 的命令参数菜单以临时 Block Kit 按钮形式发送。
  - Slack 原生例外：注册 `/agentstatus`（不是 `/status`）因为 Slack 保留了 `/status`。文本 `/status` 在 Slack 消息中仍然有效。

## BTW 侧边问题

`/btw` 是关于当前会话的快速**侧边问题**。

与普通聊天不同：

- 它使用当前会话作为背景上下文，
- 它作为独立的**无工具**一次性调用运行，
- 它不改变未来的会话上下文，
- 它不写入转录历史，
- 它作为实时侧边结果而不是普通助手消息传递。

这使 `/btw` 在你想要临时澄清而主任务继续进行时非常有用。

示例：

```text
/btw what are we doing right now?
```

参见 [BTW 侧边问题](/tools/btw) 了解完整行为和客户端 UX 详情。
