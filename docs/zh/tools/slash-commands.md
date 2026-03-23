---
title: "斜杠命令"
sidebarTitle: "斜杠命令"
mmh3_hash: "0d0f2c6240b4051db7fe0be22b676ab0"
summary: "斜杠命令：文本 vs 原生、配置和支持的命令"
read_when:
  - 使用或配置聊天命令
  - 调试命令路由或权限
---

# 斜杠命令

命令由 Gateway 处理。大多数命令必须作为以 `/` 开头的**独立**消息发送。仅主机的 bash 聊天命令使用 `! <cmd>`（以 `/bash <cmd>` 作为别名）。

有两个相关系统：

- **命令**：独立的 `/...` 消息。
- **指令**：`/think`、`/fast`、`/verbose`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。
  - 在模型看到消息之前，指令会从消息中剥离。
  - 在正常聊天消息（非仅指令）中，它们被视为"内联提示"，**不**持久化 Session 设置。
  - 在仅指令消息（消息仅包含指令）中，它们持久化到 Session 并回复确认。
  - 指令仅对**授权发送者**应用。如果设置了 `commands.allowFrom`，它是唯一使用的允许列表；否则授权来自 Channel 允许列表/配对加 `commands.useAccessGroups`。未授权的发送者看到指令被视为纯文本。

还有一些**内联快捷方式**（仅允许列表/授权发送者）：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。它们立即运行，在模型看到消息之前被剥离，剩余文本继续正常流程。

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

- `commands.text`（默认 `true`）启用在聊天消息中解析 `/...`。
  - 在没有原生命令的表面上（WhatsApp/WebChat/Signal/iMessage/Google Chat/MS Teams），即使您将其设置为 `false`，文本命令仍然有效。
- `commands.native`（默认 `"auto"`）注册原生命令。
  - 自动：对 Discord/Telegram 开启；对 Slack 关闭（直到您添加斜杠命令）；对不支持的 Provider 忽略。
  - 设置 `channels.discord.commands.native`、`channels.telegram.commands.native` 或 `channels.slack.commands.native` 以每个 Provider 覆盖（bool 或 `"auto"`）。
  - `false` 在启动时清除 Discord/Telegram 上先前注册的命令。Slack 命令在 Slack 应用中管理，不会自动删除。
- `commands.nativeSkills`（默认 `"auto"`）在支持时原生注册 **Skill** 命令。
  - 自动：对 Discord/Telegram 开启；对 Slack 关闭（Slack 需要为每个 Skill 创建斜杠命令）。
  - 设置 `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills` 或 `channels.slack.commands.nativeSkills` 以每个 Provider 覆盖（bool 或 `"auto"`）。
- `commands.bash`（默认 `false`）启用 `! <cmd>` 运行主机 Shell 命令（`/bash <cmd>` 是别名；需要 `tools.elevated` 允许列表）。
- `commands.bashForegroundMs`（默认 `2000`）控制 bash 在切换到后台模式之前等待多长时间（`0` 立即后台运行）。
- `commands.config`（默认 `false`）启用 `/config`（读取/写入 `openclaw.json`）。
- `commands.mcp`（默认 `false`）启用 `/mcp`（读取/写入 `mcp.servers` 下 OpenClaw 管理的 MCP 配置）。
- `commands.plugins`（默认 `false`）启用 `/plugins`（Plugin 发现/状态以及安装 + 启用/禁用控制）。
- `commands.debug`（默认 `false`）启用 `/debug`（仅运行时覆盖）。
- `commands.allowFrom`（可选）设置命令授权的每 Provider 允许列表。配置时，它是命令和指令的唯一授权来源（Channel 允许列表/配对和 `commands.useAccessGroups` 被忽略）。使用 `"*"` 作为全局默认值；Provider 特定的键覆盖它。
- `commands.useAccessGroups`（默认 `true`）在未设置 `commands.allowFrom` 时对命令强制执行允许列表/策略。

## 命令列表

文本 + 原生（启用时）：

- `/help`
- `/commands`
- `/skill <name> [input]`（按名称运行 Skill）
- `/status`（显示当前状态；当可用时包括当前模型 Provider 的提供商使用/配额）
- `/allowlist`（列出/添加/删除允许列表条目）
- `/approve <id> allow-once|allow-always|deny`（解决 exec 批准提示）
- `/context [list|detail|json]`（解释"上下文"；`detail` 显示每个文件 + 每个工具 + 每个 Skill + 系统提示大小）
- `/btw <question>`（询问关于当前 Session 的临时旁问，不改变未来的 Session 上下文；参见 [/tools/btw](/tools/btw)）
- `/export-session [path]`（别名：`/export`）（将当前 Session 导出为包含完整系统提示的 HTML）
- `/whoami`（显示您的发送者 ID；别名：`/id`）
- `/session idle <duration|off>`（管理聚焦线程绑定的非活动自动取消聚焦）
- `/session max-age <duration|off>`（管理聚焦线程绑定的硬最大年龄自动取消聚焦）
- `/subagents list|kill|log|info|send|steer|spawn`（检查、控制或生成当前 Session 的子 Agent 运行）
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions`（检查和控制 ACP 运行时 Session）
- `/agents`（列出此 Session 的线程绑定 Agent）
- `/focus <target>`（Discord：将此线程或新线程绑定到 Session/子 Agent 目标）
- `/unfocus`（Discord：删除当前线程绑定）
- `/kill <id|#|all>`（立即中止一个或所有运行中的子 Agent；无确认消息）
- `/steer <id|#> <message>`（立即引导运行中的子 Agent：运行中时就地，否则中止当前工作并在引导消息上重启）
- `/tell <id|#> <message>`（`/steer` 的别名）
- `/config show|get|set|unset`（将配置持久化到磁盘，仅所有者；需要 `commands.config: true`）
- `/mcp show|get|set|unset`（管理 OpenClaw MCP 服务器配置，仅所有者；需要 `commands.mcp: true`）
- `/plugins list|show|get|install|enable|disable`（检查已发现的 Plugin，安装新 Plugin，切换启用状态；写入操作仅所有者；需要 `commands.plugins: true`）
  - `/plugin` 是 `/plugins` 的别名。
  - `/plugin install <spec>` 接受与 `openclaw plugins install` 相同的 Plugin 规格：本地路径/存档、npm 包或 `clawhub:<pkg>`。
  - 启用/禁用写入仍会回复重启提示。在带监视的前台 Gateway 上，OpenClaw 可能在写入后自动执行重启。
- `/debug show|set|unset|reset`（运行时覆盖，仅所有者；需要 `commands.debug: true`）
- `/usage off|tokens|full|cost`（每响应使用页脚或本地成本摘要）
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio`（控制 TTS；参见 [/tts](/tools/tts)）
  - Discord：原生命令是 `/voice`（Discord 保留 `/tts`）；文本 `/tts` 仍然有效。
- `/stop`
- `/restart`
- `/dock-telegram`（别名：`/dock_telegram`）（将回复切换到 Telegram）
- `/dock-discord`（别名：`/dock_discord`）（将回复切换到 Discord）
- `/dock-slack`（别名：`/dock_slack`）（将回复切换到 Slack）
- `/activation mention|always`（仅组）
- `/send on|off|inherit`（仅所有者）
- `/reset` 或 `/new [model]`（可选模型提示；剩余部分通过）
- `/think <off|minimal|low|medium|high|xhigh>`（按模型/Provider 的动态选择；别名：`/thinking`、`/t`）
- `/fast status|on|off`（省略参数显示当前有效的快速模式状态）
- `/verbose on|full|off`（别名：`/v`）
- `/reasoning on|off|stream`（别名：`/reason`；开启时，发送单独的消息，前缀为 `Reasoning:`；`stream` = 仅 Telegram 草稿）
- `/elevated on|off|ask|full`（别名：`/elev`；`full` 跳过 exec 批准）
- `/exec host=<sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`（发送 `/exec` 以显示当前）
- `/model <name>`（别名：`/models`；或来自 `agents.defaults.models.*.alias` 的 `/<alias>`）
- `/queue <mode>`（加上 `debounce:2s cap:25 drop:summarize` 等选项；发送 `/queue` 以查看当前设置）
- `/bash <command>`（仅主机；`! <command>` 的别名；需要 `commands.bash: true` + `tools.elevated` 允许列表）

仅文本：

- `/compact [instructions]`（参见 [/concepts/compaction](/concepts/compaction)）
- `! <command>`（仅主机；一次一个；对长时间运行的作业使用 `!poll` + `!stop`）
- `!poll`（检查输出/状态；接受可选的 `sessionId`；`/bash poll` 也有效）
- `!stop`（停止正在运行的 bash 作业；接受可选的 `sessionId`；`/bash stop` 也有效）

注意：

- 命令在命令和参数之间接受可选的 `:`（例如 `/think: high`、`/send: on`、`/help:`）。
- `/new <model>` 接受模型别名、`provider/model` 或 Provider 名称（模糊匹配）；如果没有匹配，文本被视为消息正文。
- 有关完整的 Provider 使用细分，使用 `openclaw status --usage`。
- `/allowlist add|remove` 需要 `commands.config=true` 并遵守 Channel `configWrites`。
- 在多账户 Channel 中，`/allowlist --account <id>` 和 `/config set channels.<provider>.accounts.<id>...` 的配置目标也遵守目标账户的 `configWrites`。
- `/usage` 控制每响应使用页脚；`/usage cost` 从 OpenClaw Session 日志打印本地成本摘要。
- `/restart` 默认启用；设置 `commands.restart: false` 以禁用它。
- Discord 专有原生命令：`/vc join|leave|status` 控制语音 Channel（需要 `channels.discord.voice` 和原生命令；不作为文本使用）。
- Discord 线程绑定命令（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）需要启用有效的线程绑定（`session.threadBindings.enabled` 和/或 `channels.discord.threadBindings.enabled`）。
- ACP 命令参考和运行时行为：[ACP Agents](/tools/acp-agents)。
- `/verbose` 用于调试和额外的可见性；在正常使用中保持**关闭**。
- `/fast on|off` 持久化 Session 覆盖。使用 Sessions UI `inherit` 选项清除它并回退到配置默认值。
- 工具失败摘要在相关时仍然显示，但详细失败文本仅在 `/verbose` 为 `on` 或 `full` 时包含。
- `/reasoning`（和 `/verbose`）在组设置中有风险：它们可能会暴露您不想公开的内部推理或工具输出。优先保持关闭，特别是在组聊天中。
- **快速路径：** 来自允许列表发送者的仅命令消息立即处理（绕过队列 + 模型）。
- **组提及门控：** 来自允许列表发送者的仅命令消息绕过提及要求。
- **内联快捷方式（仅允许列表发送者）：** 某些命令在嵌入正常消息中时也有效，并在模型看到剩余文本之前被剥离。
  - 示例：`hey /status` 触发状态回复，剩余文本继续正常流程。
- 当前：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
- 未授权的仅命令消息被静默忽略，内联 `/...` 令牌被视为纯文本。
- **Skill 命令：** `user-invocable` Skill 作为斜杠命令公开。名称清理为 `a-z0-9_`（最多 32 个字符）；冲突获得数字后缀（例如 `_2`）。
  - `/skill <name> [input]` 按名称运行 Skill（当原生命令限制阻止每个 Skill 命令时很有用）。
  - 默认情况下，Skill 命令作为正常请求转发到模型。
  - Skill 可以可选地声明 `command-dispatch: tool` 以将命令直接路由到工具（确定性，无模型）。
  - 示例：`/prose`（OpenProse Plugin）— 参见 [OpenProse](/prose)。
- **原生命令参数：** Discord 对动态选项使用自动完成（并在您省略必需参数时使用按钮菜单）。当命令支持选择且您省略参数时，Telegram 和 Slack 显示按钮菜单。

## 使用表面（在哪里显示什么）

- **Provider 使用/配额**（示例："Claude 剩余 80%"）在当前模型 Provider 启用使用跟踪时显示在 `/status` 中。
- **每响应令牌/成本**由 `/usage off|tokens|full` 控制（附加到正常回复）。
- `/model status` 是关于**模型/认证/端点**，而非使用。

## 模型选择（`/model`）

`/model` 实现为指令。

示例：

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model opus@anthropic:default
/model status
```

注意：

- `/model` 和 `/model list` 显示紧凑的编号选择器（模型系列 + 可用 Provider）。
- 在 Discord 上，`/model` 和 `/models` 打开带有 Provider 和模型下拉列表以及提交步骤的交互式选择器。
- `/model <#>` 从该选择器中选择（并在可能时优先使用当前 Provider）。
- `/model status` 显示详细视图，包括配置的 Provider 端点（`baseUrl`）和 API 模式（`api`）（可用时）。

## 调试覆盖

`/debug` 允许您设置**仅运行时**配置覆盖（内存，不是磁盘）。仅所有者。默认禁用；使用 `commands.debug: true` 启用。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

注意：

- 覆盖立即应用于新的配置读取，但**不**写入 `openclaw.json`。
- 使用 `/debug reset` 清除所有覆盖并返回到磁盘上的配置。

## 配置更新

`/config` 写入您的磁盘配置（`openclaw.json`）。仅所有者。默认禁用；使用 `commands.config: true` 启用。

示例：

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

注意：

- 配置在写入前验证；无效的更改被拒绝。
- `/config` 更新在重启后持久化。

## MCP 更新

`/mcp` 在 `mcp.servers` 下写入 OpenClaw 管理的 MCP 服务器定义。仅所有者。默认禁用；使用 `commands.mcp: true` 启用。

示例：

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

注意：

- `/mcp` 将配置存储在 OpenClaw 配置中，而不是 Pi 拥有的项目设置中。
- 运行时适配器决定实际可执行的传输方式。

## Plugin 更新

`/plugins` 允许操作员检查已发现的 Plugin 并在配置中切换启用状态。只读流程可以使用 `/plugin` 作为别名。默认禁用；使用 `commands.plugins: true` 启用。

示例：

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

注意：

- `/plugins list` 和 `/plugins show` 使用针对当前工作区和磁盘配置的真实 Plugin 发现。
- `/plugins enable|disable` 仅更新 Plugin 配置；不安装或卸载 Plugin。
- 启用/禁用更改后，重启 Gateway 以应用它们。

## 表面注意事项

- **文本命令**在正常聊天 Session 中运行（DM 共享 `main`，组有自己的 Session）。
- **原生命令**使用隔离的 Session：
  - Discord：`agent:<agentId>:discord:slash:<userId>`
  - Slack：`agent:<agentId>:slack:slash:<userId>`（前缀可通过 `channels.slack.slashCommand.sessionPrefix` 配置）
  - Telegram：`telegram:slash:<userId>`（通过 `CommandTargetSessionKey` 定位聊天 Session）
- **`/stop`** 定位活动聊天 Session，以便它可以中止当前运行。
- **Slack：** 仍支持 `channels.slack.slashCommand` 用于单个 `/openclaw` 风格命令。如果启用 `commands.native`，您必须为每个内置命令创建一个 Slack 斜杠命令（与 `/help` 相同的名称）。Slack 的命令参数菜单作为临时 Block Kit 按钮提供。
  - Slack 原生例外：注册 `/agentstatus`（而非 `/status`），因为 Slack 保留了 `/status`。文本 `/status` 在 Slack 消息中仍然有效。

## BTW 旁问

`/btw` 是关于当前 Session 的快速**旁问**。

与普通聊天不同：

- 它使用当前 Session 作为背景上下文，
- 它作为单独的**无工具**一次性调用运行，
- 它不改变未来的 Session 上下文，
- 它不写入转录历史，
- 它作为实时旁结果而非正常助手消息传递。

这使 `/btw` 在您想要临时澄清而主任务继续进行时非常有用。

示例：

```text
/btw what are we doing right now?
```

有关完整行为和客户端 UX 详情，参见 [BTW 旁问](/tools/btw)。
