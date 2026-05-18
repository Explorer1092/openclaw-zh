---
title: "斜杠命令"
sidebarTitle: "斜杠命令"
mmh3_hash: "52eaa7a593a00612d52edfca7d35fdb9"
summary: "斜杠命令：文本 vs 原生、配置和支持的命令"
read_when:
  - 使用或配置聊天命令
  - 调试命令路由或权限
---

命令由 Gateway 处理。大多数命令必须作为以 `/` 开头的**独立**消息发送。仅主机的 bash 聊天命令使用 `! <cmd>`（以 `/bash <cmd>` 作为别名）。

当对话或线程绑定到 ACP Session 时，正常的后续文本路由到该 ACP 框架。Gateway 管理命令仍保持本地：`/acp ...` 始终到达 OpenClaw ACP 命令处理器，`/status` 和 `/unfocus` 在命令处理启用时始终保持本地。

有两个相关系统：

<AccordionGroup>
  <Accordion title="命令">
    独立的 `/...` 消息。
  </Accordion>
  <Accordion title="指令">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。

    - 在模型看到消息之前，指令会从消息中剥离。
    - 在正常聊天消息（非仅指令）中，它们被视为"内联提示"，**不**持久化 Session 设置。
    - 在仅指令消息（消息仅包含指令）中，它们持久化到 Session 并回复确认。
    - 指令仅对**授权发送者**应用。如果设置了 `commands.allowFrom`，它是唯一使用的允许列表；否则授权来自 Channel 允许列表/配对加 `commands.useAccessGroups`。未授权的发送者看到指令被视为纯文本。

  </Accordion>
  <Accordion title="内联快捷方式">
    仅允许列表/授权发送者：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。

    它们立即运行，在模型看到消息之前被剥离，剩余文本继续正常流程。

  </Accordion>
</AccordionGroup>

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
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  启用在聊天消息中解析 `/...`。在没有原生命令的表面上（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams），即使将其设置为 `false`，文本命令仍然有效。
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  注册原生命令。自动：对 Discord/Telegram 开启；对 Slack 关闭（直到您添加斜杠命令）；对不支持的 Provider 忽略。设置 `channels.discord.commands.native`、`channels.telegram.commands.native` 或 `channels.slack.commands.native` 以每个 Provider 覆盖（bool 或 `"auto"`）。在 Discord 上，`false` 在启动时跳过斜杠命令注册和清理；先前注册的命令可能保持可见，直到您从 Discord 应用中删除它们。Slack 命令在 Slack 应用中管理，不会自动删除。
</ParamField>
在 Discord 上，原生命令规格可以包含 `descriptionLocalizations`，OpenClaw 将其发布为 Discord `description_localizations` 并包含在协调比较中。
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  在支持时原生注册 **Skill** 命令。自动：对 Discord/Telegram 开启；对 Slack 关闭（Slack 需要为每个 Skill 创建斜杠命令）。设置 `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills` 或 `channels.slack.commands.nativeSkills` 以每个 Provider 覆盖（bool 或 `"auto"`）。
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  启用 `! <cmd>` 运行主机 Shell 命令（`/bash <cmd>` 是别名；需要 `tools.elevated` 允许列表）。
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  控制 bash 在切换到后台模式之前等待多长时间（`0` 立即后台运行）。
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  启用 `/config`（读取/写入 `openclaw.json`）。
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  启用 `/mcp`（读取/写入 `mcp.servers` 下 OpenClaw 管理的 MCP 配置）。
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  启用 `/plugins`（Plugin 发现/状态以及安装 + 启用/禁用控制）。
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  启用 `/debug`（仅运行时覆盖）。
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  启用 `/restart` 及 Gateway 重启工具操作。
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  设置仅所有者命令/工具表面的显式所有者允许列表。这是可以批准危险操作并运行 `/diagnostics`、`/export-trajectory` 和 `/config` 等命令的人工操作员账户。它与 `commands.allowFrom` 以及 DM 配对访问是独立的。
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  每 Channel：使仅所有者命令在该表面上需要**所有者身份**才能运行。为 `true` 时，发送者必须匹配已解析的所有者候选（例如 `commands.ownerAllowFrom` 中的条目或 Provider 原生所有者元数据），或在内部消息 Channel 上持有内部 `operator.admin` 范围。Channel `allowFrom` 中的通配符条目，或空/未解析的所有者候选列表，**不**足以——仅所有者命令在该 Channel 上关闭失败。如果您希望仅所有者命令仅由 `ownerAllowFrom` 和标准命令允许列表门控，请关闭此项。
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  控制所有者 id 在系统提示中的显示方式。
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  在 `commands.ownerDisplay="hash"` 时可选设置 HMAC 密钥。
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  命令授权的每 Provider 允许列表。配置时，它是命令和指令的唯一授权来源（Channel 允许列表/配对和 `commands.useAccessGroups` 被忽略）。使用 `"*"` 作为全局默认值；Provider 特定的键覆盖它。
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  在未设置 `commands.allowFrom` 时对命令强制执行允许列表/策略。
</ParamField>

## 命令列表

当前事实来源：

- 核心内置命令来自 `src/auto-reply/commands-registry.shared.ts`
- 生成的 dock 命令来自 `src/auto-reply/commands-registry.data.ts`
- Plugin 命令来自 Plugin 的 `registerCommand()` 调用
- 您的 Gateway 上的实际可用性仍取决于配置标志、Channel 表面和已安装/启用的 Plugin

### 核心内置命令

<AccordionGroup>
  <Accordion title="Session 和运行">
    - `/new [model]` 开始新 Session；`/reset` 是重置别名。
    - Control UI 拦截键入的 `/new` 以创建并切换到新的仪表板 Session，但当 `session.dmScope: "main"` 已配置且当前父级是 Agent 的主 Session 时除外；在这种情况下，`/new` 就地重置主 Session。键入的 `/reset` 仍然运行 Gateway 的就地重置。
    - `/reset soft [message]` 保留当前转录，删除重用的 CLI 后端 Session id，并就地重新运行启动/系统提示加载。
    - `/compact [instructions]` 压缩 Session 上下文。参见 [Compaction](/concepts/compaction)。
    - `/stop` 中止当前运行。
    - `/session idle <duration|off>` 和 `/session max-age <duration|off>` 管理线程绑定过期。
    - `/export-session [path]` 将当前 Session 导出为 HTML。别名：`/export`。
    - `/export-trajectory [path]` 请求 exec 批准，然后为当前 Session 导出 JSONL [轨迹包](/tools/trajectory)。当您需要一个 OpenClaw Session 的提示、工具和转录时间线时使用它。在组聊天中，批准提示和导出结果私下发送给所有者。别名：`/trajectory`。

  </Accordion>
  <Accordion title="模型和运行控制">
    - `/think <level|default>` 设置思考级别或清除 Session 覆盖。选项来自活动模型的 Provider 配置文件；常见级别为 `off`、`minimal`、`low`、`medium` 和 `high`，以及自定义级别如 `xhigh`、`adaptive`、`max`，或仅在支持时的二进制 `on`。别名：`/thinking`、`/t`。
    - `/verbose on|off|full` 切换详细输出。别名：`/v`。
    - `/trace on|off` 切换当前 Session 的 Plugin 跟踪输出。
    - `/fast [status|on|off|default]` 显示、设置或清除快速模式。
    - `/reasoning [on|off|stream]` 切换推理可见性。别名：`/reason`。
    - `/elevated [on|off|ask|full]` 切换提升模式。别名：`/elev`。
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` 显示或设置 exec 默认值。
    - `/model [name|#|status]` 显示或设置模型。
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` 列出已配置/认证可用的 Provider 或某个 Provider 的模型；添加 `all` 以浏览该 Provider 的完整目录。`agents.defaults.models` 中的 `provider/*` 条目使 `/model` 和 `/models` 仅显示这些 Provider 的已发现模型。
    - `/queue <mode>` 管理活动运行队列行为（`steer`、`followup`、`collect`、`interrupt`）以及 `debounce:0.5s cap:25 drop:summarize` 等选项；`/queue default` 或 `/queue reset` 清除 Session 覆盖。运行中提示默认不带队列指令的引导。参见 [命令队列](/concepts/queue) 和 [引导队列](/concepts/queue-steering)。
    - `/steer <message>` 将引导注入当前 Session 的活动运行，与 `/queue` 模式无关。如果引导不可用或 Session 处于空闲状态，`<message>` 作为正常提示继续。别名：`/tell`。参见 [Steer](/tools/steer)。

  </Accordion>
  <Accordion title="发现和状态">
    - `/help` 显示简短帮助摘要。
    - `/commands` 显示生成的命令目录。
    - `/tools [compact|verbose]` 显示当前 Agent 现在可以使用的工具。
    - `/status` 显示执行/运行时状态、Gateway 和系统正常运行时间，以及可用时的 Provider 使用/配额。
    - `/diagnostics [note]` 是 Gateway 错误和 Codex 框架运行的仅所有者支持报告流程。它在运行 `openclaw gateway diagnostics export --json` 之前每次都请求明确的 exec 批准；不要使用全允许规则批准诊断。批准后，它发送一个可粘贴的报告，包含本地包路径、Manifest 摘要、隐私说明和相关 Session id。在组聊天中，批准提示和报告私下发送给所有者。当活动 Session 使用 OpenAI Codex 框架时，同一批准还会向 OpenAI 服务器发送相关 Codex 反馈，完成的回复列出 OpenClaw Session id、Codex 线程 id 和 `codex resume <thread-id>` 命令。参见 [诊断导出](/gateway/diagnostics)。
    - `/crestodian <request>` 从所有者 DM 运行 Crestodian 设置和修复助手。
    - `/tasks` 列出当前 Session 的活动/最近后台任务。
    - `/context [list|detail|map|json]` 解释上下文是如何组装的。`map` 发送当前 Session 上下文的树形图图像。
    - `/whoami` 显示您的发送者 id。别名：`/id`。
    - `/usage off|tokens|full|cost` 控制每响应使用页脚或打印本地成本摘要。

  </Accordion>
  <Accordion title="Skill、允许列表、批准">
    - `/skill <name> [input]` 按名称运行 Skill。
    - `/allowlist [list|add|remove] ...` 管理允许列表条目。仅文本。
    - `/approve <id> <decision>` 解决 exec 批准提示。
    - `/btw <question>` 询问旁问，不改变未来的 Session 上下文。别名：`/side`。参见 [BTW](/tools/btw)。

  </Accordion>
  <Accordion title="子 Agent 和 ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` 管理当前 Session 的子 Agent 运行。
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` 管理 ACP Session 和运行时选项。
    - `/focus <target>` 将当前 Discord 线程或 Telegram 话题/对话绑定到 Session 目标。
    - `/unfocus` 移除当前绑定。
    - `/agents` 列出当前 Session 的线程绑定 Agent。
    - `/kill <id|#|all>` 中止一个或所有运行中的子 Agent。
    - `/subagents steer <id|#> <message>` 向运行中的子 Agent 发送引导。参见 [Steer](/tools/steer)。

  </Accordion>
  <Accordion title="仅所有者写入和管理">
    - `/config show|get|set|unset` 读取或写入 `openclaw.json`。仅所有者。需要 `commands.config: true`。
    - `/mcp show|get|set|unset` 读取或写入 `mcp.servers` 下 OpenClaw 管理的 MCP 服务器配置。仅所有者。需要 `commands.mcp: true`。
    - `/plugins list|inspect|show|get|install|enable|disable` 检查或修改 Plugin 状态。`/plugin` 是别名。写入操作仅所有者。需要 `commands.plugins: true`。
    - `/debug show|set|unset|reset` 管理仅运行时配置覆盖。仅所有者。需要 `commands.debug: true`。
    - `/restart` 在启用时重启 OpenClaw。默认：启用；设置 `commands.restart: false` 以禁用。
    - `/send on|off|inherit` 设置发送策略。仅所有者。

  </Accordion>
  <Accordion title="语音、TTS、Channel 控制">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` 控制 TTS。参见 [TTS](/tools/tts)。
    - `/activation mention|always` 设置组激活模式。
    - `/bash <command>` 运行主机 Shell 命令。仅文本。别名：`! <command>`。需要 `commands.bash: true` 加 `tools.elevated` 允许列表。
    - `!poll [sessionId]` 检查后台 bash 作业。
    - `!stop [sessionId]` 停止后台 bash 作业。

  </Accordion>
</AccordionGroup>

### 生成的 dock 命令

Dock 命令将当前 Session 的回复路由切换到另一个已链接的 Channel。有关设置、示例和故障排除，参见 [Channel 停靠](/concepts/channel-docking)。

Dock 命令由具有原生命令支持的 Channel Plugin 生成。当前捆绑集：

- `/dock-discord`（别名：`/dock_discord`）
- `/dock-mattermost`（别名：`/dock_mattermost`）
- `/dock-slack`（别名：`/dock_slack`）
- `/dock-telegram`（别名：`/dock_telegram`）

从直接聊天使用 dock 命令将当前 Session 的回复路由切换到另一个已链接的 Channel。Agent 保持相同的 Session 上下文，但该 Session 的未来回复会投递到所选的 Channel 对等体。

Dock 命令需要 `session.identityLinks`。源发送者和目标对等体必须在同一身份组中，例如 `["telegram:123", "discord:456"]`。如果 id 为 `123` 的 Telegram 用户发送 `/dock_discord`，OpenClaw 会在活动 Session 上存储 `lastChannel: "discord"` 和 `lastTo: "456"`。如果发送者未链接到 Discord 对等体，命令会回复设置提示，而不是进入正常聊天。

停靠只更改活动 Session 路由。它不创建 Channel 账户、授予访问权限、绕过 Channel 允许列表或将转录历史移动到另一个 Session。使用 `/dock-telegram`、`/dock-slack`、`/dock-mattermost` 或另一个生成的 dock 命令再次切换路由。

### 捆绑 Plugin 命令

捆绑 Plugin 可以添加更多斜杠命令。本仓库中当前的捆绑命令：

- `/dreaming [on|off|status|help]` 切换记忆 dreaming。参见 [Dreaming](/concepts/dreaming)。
- `/pair [qr|status|pending|approve|cleanup|notify]` 管理设备配对/设置流程。参见 [配对](/channels/pairing)。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` 临时启用高风险手机节点命令。
- `/voice status|list [limit]|set <voiceId|name>` 管理 Talk 语音配置。在 Discord 上，原生命令名称为 `/talkvoice`。
- `/card ...` 发送 LINE 富卡预设。参见 [LINE](/channels/line)。
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` 检查和控制捆绑的 Codex 应用服务器框架。参见 [Codex Harness](/plugins/codex-harness)。
- 仅 QQBot 命令：
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 动态 Skill 命令

用户可调用的 Skill 也作为斜杠命令公开：

- `/skill <name> [input]` 始终作为通用入口点有效。
- Skill 也可能作为直接命令出现，如 Skill/Plugin 注册时的 `/prose`。
- 原生 Skill 命令注册由 `commands.nativeSkills` 和 `channels.<provider>.commands.nativeSkills` 控制。
- 命令规格可以为支持本地化描述的原生表面（包括 Discord）提供 `descriptionLocalizations`。

<AccordionGroup>
  <Accordion title="参数和解析器说明">
    - 命令在命令和参数之间接受可选的 `:`（例如 `/think: high`、`/send: on`、`/help:`）。
    - `/new <model>` 接受模型别名、`provider/model` 或 Provider 名称（模糊匹配）；如果没有匹配，文本被视为消息正文。
    - 有关完整的 Provider 使用细分，使用 `openclaw status --usage`。
    - `/allowlist add|remove` 需要 `commands.config=true` 并遵守 Channel `configWrites`。
    - 在多账户 Channel 中，`/allowlist --account <id>` 和 `/config set channels.<provider>.accounts.<id>...` 的配置目标也遵守目标账户的 `configWrites`。
    - `/usage` 控制每响应使用页脚；`/usage cost` 从 OpenClaw Session 日志打印本地成本摘要。
    - `/restart` 默认启用；设置 `commands.restart: false` 以禁用它。
    - `/plugins install <spec>` 接受与 `openclaw plugins install` 相同的 Plugin 规格：本地路径/存档、npm 包、`git:<repo>` 或 `clawhub:<pkg>`。托管 Gateway 自动重启，因为 Plugin 源模块已更改。
    - `/plugins enable|disable` 仅更新 Plugin 配置，为新的 Agent 轮次触发 Gateway Plugin 运行时重载；install 自动重启托管 Gateway，因为 Plugin 源模块已更改。

  </Accordion>
  <Accordion title="Channel 特定行为">
    - 仅 Discord 原生命令：`/vc join|leave|status` 控制语音 Channel（不作为文本使用）。`join` 需要公会和选定的语音/舞台 Channel。需要 `channels.discord.voice` 和原生命令。
    - Discord 线程绑定命令（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）需要启用有效的线程绑定（`session.threadBindings.enabled` 和/或 `channels.discord.threadBindings.enabled`）。
    - ACP 命令参考和运行时行为：[ACP Agents](/tools/acp-agents)。

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning 安全">
    - `/verbose` 用于调试和额外的可见性；在正常使用中保持**关闭**。
    - `/trace` 比 `/verbose` 范围更窄：它只显示 Plugin 拥有的跟踪/调试行，保持普通详细工具内容关闭。
    - `/fast on|off` 持久化 Session 覆盖。使用 Sessions UI `inherit` 选项清除它并回退到配置默认值。
    - `/fast` 因 Provider 而异：OpenAI/OpenAI Codex 在原生 Responses 端点上将其映射到 `service_tier=priority`，而直接的公共 Anthropic 请求（包括发送到 `api.anthropic.com` 的 OAuth 认证流量）映射到 `service_tier=auto` 或 `standard_only`。参见 [OpenAI](/providers/openai) 和 [Anthropic](/providers/anthropic)。
    - 工具失败摘要在相关时仍然显示，但详细失败文本仅在 `/verbose` 为 `on` 或 `full` 时包含。
    - `/reasoning`、`/verbose` 和 `/trace` 在组设置中有风险：它们可能会暴露您不想公开的内部推理、工具输出或 Plugin 诊断。优先保持关闭，特别是在组聊天中。

  </Accordion>
  <Accordion title="模型切换">
    - `/model` 立即持久化新的 Session 模型。
    - 如果 Agent 处于空闲状态，下次运行将立即使用它。
    - 如果运行已经激活，OpenClaw 将实时切换标记为待处理，并仅在干净的重试点重启到新模型。
    - 如果工具活动或回复输出已经开始，待处理的切换可以保持排队，直到稍后的重试机会或下一个用户轮次。
    - 在本地 TUI 中，`/crestodian [request]` 从正常 Agent TUI 返回到 Crestodian。这与消息 Channel 救援模式是独立的，不授予远程配置权限。

  </Accordion>
  <Accordion title="快速路径和内联快捷方式">
    - **快速路径：** 来自允许列表发送者的仅命令消息立即处理（绕过队列 + 模型）。
    - **组提及门控：** 来自允许列表发送者的仅命令消息绕过提及要求。
    - **内联快捷方式（仅允许列表发送者）：** 某些命令在嵌入正常消息中时也有效，并在模型看到剩余文本之前被剥离。
      - 示例：`hey /status` 触发状态回复，剩余文本继续正常流程。
    - 当前：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
    - 未授权的仅命令消息被静默忽略，内联 `/...` 令牌被视为纯文本。

  </Accordion>
  <Accordion title="Skill 命令和原生参数">
    - **Skill 命令：** `user-invocable` Skill 作为斜杠命令公开。名称清理为 `a-z0-9_`（最多 32 个字符）；冲突获得数字后缀（例如 `_2`）。
      - `/skill <name> [input]` 按名称运行 Skill（当原生命令限制阻止每个 Skill 命令时很有用）。
      - 默认情况下，Skill 命令作为正常请求转发到模型。
      - Skill 可以可选地声明 `command-dispatch: tool` 以将命令直接路由到工具（确定性，无模型）。
      - 示例：`/prose`（OpenProse Plugin）— 参见 [OpenProse](/prose)。
    - **原生命令参数：** Discord 对动态选项使用自动完成（并在您省略必需参数时使用按钮菜单）。当命令支持选择且您省略参数时，Telegram 和 Slack 显示按钮菜单。动态选项针对目标 Session 模型解析，因此 `/think` 级别等模型特定选项遵循该 Session 的 `/model` 覆盖。

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` 回答的是运行时问题，而非配置问题：**当前 Agent 在此对话中现在可以使用什么**。

- 默认 `/tools` 紧凑，针对快速扫描进行了优化。
- `/tools verbose` 添加简短描述。
- 支持参数的原生命令表面提供与 `compact|verbose` 相同的模式切换。
- 结果是 Session 范围的，因此更改 Agent、Channel、线程、发送者授权或模型可能会更改输出。
- `/tools` 包括运行时实际可访问的工具，包括核心工具、连接的 Plugin 工具和 Channel 自有工具。

如需编辑配置文件和覆盖，请使用 Control UI 工具面板或配置/目录表面，而不是将 `/tools` 视为静态目录。

## 使用表面（在哪里显示什么）

- **Provider 使用/配额**（示例："Claude 剩余 80%"）在当前模型 Provider 启用使用跟踪时显示在 `/status` 中。OpenClaw 将 Provider 窗口规范化为"剩余 %"；对于 MiniMax，仅剩余百分比字段在显示前取反，`model_remains` 响应优先使用聊天模型条目加上模型标记的计划标签。
- `/status` 中的**令牌/缓存行**可以在实时 Session 快照稀疏时回退到最新的转录使用条目。现有的非零实时值仍然优先，转录回退也可以恢复活动运行时模型标签，以及在存储总量缺失或较小时的更大的面向提示的总量。
- **执行 vs 运行时：** `/status` 报告 `Execution`（有效沙箱路径）和 `Runtime`（实际运行 Session 的主体）：`OpenClaw Pi Default`、`OpenAI Codex`、CLI 后端或 ACP 后端。
- **每响应令牌/成本**由 `/usage off|tokens|full` 控制（附加到正常回复）。
- `/model status` 是关于**模型/认证/端点**，而非使用。

## 模型选择（`/model`）

`/model` 实现为指令。

示例：

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

注意：

- `/model` 和 `/model list` 显示紧凑的编号选择器（模型系列 + 可用 Provider）。
- 在 Discord 上，`/model` 和 `/models` 打开带有 Provider 和模型下拉列表以及提交步骤的交互式选择器。选择器遵守 `agents.defaults.models`，包括 `provider/*` 条目，因此 Provider 范围的发现可以将选择器保持在 Discord 的 25 个选项组件限制以下。
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

<Note>
覆盖立即应用于新的配置读取，但**不**写入 `openclaw.json`。使用 `/debug reset` 清除所有覆盖并返回到磁盘上的配置。
</Note>

## Plugin 跟踪输出

`/trace` 让您在不开启完整详细模式的情况下切换**Session 范围的 Plugin 跟踪/调试行**。

示例：

```text
/trace
/trace on
/trace off
```

注意：

- 不带参数的 `/trace` 显示当前 Session 跟踪状态。
- `/trace on` 为当前 Session 启用 Plugin 跟踪行。
- `/trace off` 再次禁用它们。
- Plugin 跟踪行可以出现在 `/status` 中，以及在正常助手回复之后作为跟进诊断消息。
- `/trace` 不替代 `/debug`；`/debug` 仍然管理仅运行时配置覆盖。
- `/trace` 不替代 `/verbose`；普通详细工具/状态输出仍属于 `/verbose`。

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

<Note>
配置在写入前验证；无效的更改被拒绝。`/config` 更新在重启后持久化。
</Note>

## MCP 更新

`/mcp` 在 `mcp.servers` 下写入 OpenClaw 管理的 MCP 服务器定义。仅所有者。默认禁用；使用 `commands.mcp: true` 启用。

示例：

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` 将配置存储在 OpenClaw 配置中，而不是 Pi 拥有的项目设置中。运行时适配器决定实际可执行的传输方式。
</Note>

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

<Note>
- `/plugins list` 和 `/plugins show` 使用针对当前工作区和磁盘配置的真实 Plugin 发现。
- `/plugins install` 从 ClawHub、npm、git、本地目录和存档安装。
- `/plugins enable|disable` 仅更新 Plugin 配置；不安装或卸载 Plugin。
- 启用和禁用更改为新的 Agent 轮次热重载 Gateway Plugin 运行时表面；install 自动重启托管 Gateway，因为 Plugin 源模块已更改。

</Note>

## 表面注意事项

<AccordionGroup>
  <Accordion title="每个表面的 Session">
    - **文本命令**在正常聊天 Session 中运行（DM 共享 `main`，组有自己的 Session）。
    - **原生命令**使用隔离的 Session：
      - Discord：`agent:<agentId>:discord:slash:<userId>`
      - Slack：`agent:<agentId>:slack:slash:<userId>`（前缀可通过 `channels.slack.slashCommand.sessionPrefix` 配置）
      - Telegram：`telegram:slash:<userId>`（通过 `CommandTargetSessionKey` 定位聊天 Session）
    - **`/stop`** 定位活动聊天 Session，以便它可以中止当前运行。

  </Accordion>
  <Accordion title="Slack 特殊情况">
    仍支持 `channels.slack.slashCommand` 用于单个 `/openclaw` 风格命令。如果启用 `commands.native`，您必须为每个内置命令创建一个 Slack 斜杠命令（与 `/help` 相同的名称）。Slack 的命令参数菜单作为临时 Block Kit 按钮提供。

    Slack 原生例外：注册 `/agentstatus`（而非 `/status`），因为 Slack 保留了 `/status`。文本 `/status` 在 Slack 消息中仍然有效。

  </Accordion>
</AccordionGroup>

## BTW 旁问

`/btw` 是关于当前 Session 的快速**旁问**。`/side` 是别名。

与普通聊天不同：

- 它使用当前 Session 作为背景上下文，
- 在 Codex 框架 Session 中，它作为带有当前 Codex 权限和原生工具表面的临时 Codex 旁线程运行，
- 在非 Codex Session 中，它保留较旧的直接一次性旁调用行为，
- 它不改变未来的 Session 上下文，
- 它不写入转录历史，
- 它作为实时旁结果而非正常助手消息传递。

这使 `/btw` 在您想要临时澄清而主任务继续进行时非常有用。

示例：

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

有关完整行为和客户端 UX 详情，参见 [BTW 旁问](/tools/btw)。

## 相关

- [创建 Skill](/tools/creating-skills)
- [Skill](/tools/skills)
- [Skill 配置](/tools/skills-config)
