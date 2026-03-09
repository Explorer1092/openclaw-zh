---
title: "工具(OpenClaw)"
mmh3_hash: "a48aba15587cf5073df468962e35693b"
summary: "OpenClaw 的 Agent 工具表面(浏览器、画布、节点、消息、cron)替代旧版 `openclaw-*` Skill"
read_when:
  - 添加或修改 agent 工具
  - 停用或更改 `openclaw-*` Skill
---

# 工具(OpenClaw)

OpenClaw 为浏览器、画布、节点和 cron 公开**一流的 agent 工具**。这些替代了旧的 `openclaw-*` Skill: 工具是类型化的,无需 shell,agent 应该直接依赖它们。

## 禁用工具

您可以通过 `openclaw.json` 中的 `tools.allow` / `tools.deny` 全局允许/拒绝工具(拒绝获胜)。这可以防止不允许的工具被发送到模型 Provider。

```json5
{
  tools: { deny: ["browser"] },
}
```

注意:

- 匹配不区分大小写。
- 支持 `*` 通配符(`"*"` 表示所有工具)。
- 如果 `tools.allow` 仅引用未知或未加载的 Plugin 工具名称,OpenClaw 会记录警告并忽略允许列表,以便核心工具保持可用。

## 工具配置文件(基础允许列表)

`tools.profile` 在 `tools.allow`/`tools.deny` 之前设置**基础工具允许列表**。每个 agent 覆盖: `agents.list[].tools.profile`。

配置文件:

- `minimal`: 仅 `session_status`
- `coding`: `group:fs`、`group:runtime`、`group:sessions`、`group:memory`、`image`
- `messaging`: `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`
- `full`: 无限制(与未设置相同)

示例(默认仅消息传递,也允许 Slack + Discord 工具):

```json5
{
  tools: {
    profile: "messaging",
    allow: ["slack", "discord"],
  },
}
```

示例(编码配置文件,但在所有地方拒绝 exec/process):

```json5
{
  tools: {
    profile: "coding",
    deny: ["group:runtime"],
  },
}
```

示例(全局编码配置文件,仅消息传递支持 agent):

```json5
{
  tools: { profile: "coding" },
  agents: {
    list: [
      {
        id: "support",
        tools: { profile: "messaging", allow: ["slack"] },
      },
    ],
  },
}
```

## 特定 Provider 的工具策略

使用 `tools.byProvider` 为特定 Provider(或单个 `provider/model`)**进一步限制**工具,而无需更改全局默认值。每个 agent 覆盖: `agents.list[].tools.byProvider`。

这在基础工具配置文件**之后**和允许/拒绝列表**之前**应用,因此它只能缩小工具集。Provider 键接受 `provider`(例如 `google-antigravity`)或 `provider/model`(例如 `openai/gpt-5.2`)。

示例(保持全局编码配置文件,但 Google Antigravity 使用最小工具):

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```

示例(针对不稳定端点的 provider/model 特定允许列表):

```json5
{
  tools: {
    allow: ["group:fs", "group:runtime", "sessions_list"],
    byProvider: {
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

示例(单个 Provider 的 agent 特定覆盖):

```json5
{
  agents: {
    list: [
      {
        id: "support",
        tools: {
          byProvider: {
            "google-antigravity": { allow: ["message", "sessions_list"] },
          },
        },
      },
    ],
  },
}
```

## 工具组(简写)

工具策略(全局、agent、沙箱)支持扩展为多个工具的 `group:*` 条目。在 `tools.allow` / `tools.deny` 中使用这些。

可用组:

- `group:runtime`: `exec`、`bash`、`process`
- `group:fs`: `read`、`write`、`edit`、`apply_patch`
- `group:sessions`: `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status`
- `group:memory`: `memory_search`、`memory_get`
- `group:web`: `web_search`、`web_fetch`
- `group:ui`: `browser`、`canvas`
- `group:automation`: `cron`、`gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: 所有内置 OpenClaw 工具(不包括 Provider Plugin)

示例(仅允许文件工具 + 浏览器):

```json5
{
  tools: {
    allow: ["group:fs", "browser"],
  },
}
```

## Plugin + 工具

Plugin 可以注册超出核心集的**附加工具**(和 CLI 命令)。有关安装 + 配置,请参见 [Plugin](/tools/plugin),有关如何将工具使用指导注入提示的信息,请参见 [Skill](/tools/skills)。一些 Plugin 在工具旁边提供自己的 Skill(例如,voice-call Plugin)。

可选 Plugin 工具:

- [Lobster](/tools/lobster): 带有可恢复批准的类型化工作流运行时(需要 Gateway 主机上的 Lobster CLI)。
- [LLM Task](/tools/llm-task): 用于结构化工作流输出的仅 JSON LLM 步骤(可选架构验证)。
- [Diffs](/tools/diffs): 用于文本前后对比或统一补丁的只读 diff 查看器和 PNG 或 PDF 文件渲染器。

## 工具清单

### `apply_patch`

跨一个或多个文件应用结构化补丁。用于多块编辑。
实验性: 通过 `tools.exec.applyPatch.enabled` 启用(仅 OpenAI 模型)。
`tools.exec.applyPatch.workspaceOnly` 默认为 `true`(工作区包含)。仅在您故意希望 `apply_patch` 在工作区目录之外写入/删除时才将其设置为 `false`。

### `exec`

在工作区中运行 shell 命令。

核心参数:

- `command`（必需）
- `yieldMs`（超时后自动后台运行,默认 10000）
- `background`（立即后台运行）
- `timeout`（秒;如果超过则杀死进程,默认 1800）
- `elevated`（bool;如果启用/允许提升模式则在主机上运行;仅当 agent 被沙箱化时才更改行为）
- `host`（`sandbox | gateway | node`）
- `security`（`deny | allowlist | full`）
- `ask`（`off | on-miss | always`）
- `node`（`host=node` 的节点 id/名称）
- 需要真正的 TTY? 设置 `pty: true`。

注意:

- 后台运行时返回 `status: "running"` 和 `sessionId`。
- 使用 `process` 轮询/记录/写入/杀死/清除后台 Session。
- 如果 `process` 被禁止,`exec` 同步运行并忽略 `yieldMs`/`background`。
- `elevated` 由 `tools.elevated` 加上任何 `agents.list[].tools.elevated` 覆盖(两者都必须允许)限制,是 `host=gateway` + `security=full` 的别名。
- `elevated` 仅在 agent 被沙箱化时更改行为(否则是无操作)。
- `host=node` 可以定位到 macOS 伴侣应用或无头节点主机(`openclaw node run`)。
- Gateway/节点批准和允许列表: [Exec 批准](/tools/exec-approvals)。

### `process`

管理后台 exec Session。

核心操作:

- `list`、`poll`、`log`、`write`、`kill`、`clear`、`remove`

注意:

- `poll` 在完成时返回新输出和退出状态。
- `log` 支持基于行的 `offset`/`limit`（省略 `offset` 以获取最后 N 行）。
- `process` 的作用域限定为每个 agent;来自其他 agent 的 Session 不可见。

### `loop-detection`（工具调用循环防护）

OpenClaw 跟踪最近的工具调用历史,并在检测到重复无进展循环时阻止或发出警告。
通过 `tools.loopDetection.enabled: true` 启用（默认为 `false`）。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      historySize: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `genericRepeat`: 重复相同工具 + 相同参数的调用模式。
- `knownPollNoProgress`: 使用相同输出重复类轮询工具。
- `pingPong`: 交替 `A/B/A/B` 无进展模式。
- 每个 agent 覆盖: `agents.list[].tools.loopDetection`。

### `web_search`

使用 Perplexity、Brave、Gemini、Grok 或 Kimi 搜索网络。

核心参数:

- `query`（必需）
- `count`（1–10;默认来自 `tools.web.search.maxResults`）

注意:

- 需要 Brave API 密钥（推荐: `openclaw configure --section web`,或设置 `BRAVE_API_KEY`）。
- 通过 `tools.web.search.enabled` 启用。
- 响应被缓存（默认 15 分钟）。
- 有关设置,请参见 [Web 工具](/tools/web)。

### `web_fetch`

从 URL 获取和提取可读内容（HTML → markdown/text）。

核心参数:

- `url`（必需）
- `extractMode`（`markdown` | `text`）
- `maxChars`（截断长页面）

注意:

- 通过 `tools.web.fetch.enabled` 启用。
- `maxChars` 受 `tools.web.fetch.maxCharsCap` 限制（默认 50000）。
- 响应被缓存（默认 15 分钟）。
- 对于 JS 密集型网站,优先使用浏览器工具。
- 有关设置,请参见 [Web 工具](/tools/web)。
- 有关可选的反机器人回退,请参见 [Firecrawl](/tools/firecrawl)。

### `browser`

控制专用的 OpenClaw 管理浏览器。

核心操作:

- `status`、`start`、`stop`、`tabs`、`open`、`focus`、`close`
- `snapshot`（aria/ai）
- `screenshot`（返回图像块 + `MEDIA:<path>`）
- `act`（UI 操作: click/type/press/hover/drag/select/fill/resize/wait/evaluate）
- `navigate`、`console`、`pdf`、`upload`、`dialog`

配置文件管理:

- `profiles` — 列出所有浏览器配置文件及其状态
- `create-profile` — 创建具有自动分配端口（或 `cdpUrl`）的新配置文件
- `delete-profile` — 停止浏览器、删除用户数据、从配置中删除（仅本地）
- `reset-profile` — 杀死配置文件端口上的孤立进程（仅本地）

常见参数:

- `profile`（可选;默认为 `browser.defaultProfile`）
- `target`（`sandbox` | `host` | `node`）
- `node`（可选;选择特定的节点 id/名称）

注意:

- 需要 `browser.enabled=true`（默认为 `true`;设置 `false` 以禁用）。
- 所有操作都接受可选的 `profile` 参数以支持多实例。
- 当省略 `profile` 时,使用 `browser.defaultProfile`（默认为"chrome"）。
- 配置文件名称: 仅小写字母数字 + 连字符（最多 64 个字符）。
- 端口范围: 18800-18899（最多约 100 个配置文件）。
- 远程配置文件仅附加（无启动/停止/重置）。
- 如果连接了具有浏览器功能的节点,该工具可能会自动路由到它（除非您固定 `target`）。
- 当安装 Playwright 时,`snapshot` 默认为 `ai`;使用 `aria` 获取可访问性树。
- `snapshot` 还支持返回类似 `e12` 的引用的角色快照选项（`interactive`、`compact`、`depth`、`selector`）。
- `act` 需要来自 `snapshot` 的 `ref`（来自 AI 快照的数字 `12`,或来自角色快照的 `e12`）;使用 `evaluate` 以满足罕见的 CSS 选择器需求。
- 默认情况下避免 `act` → `wait`;仅在特殊情况下使用它（没有可靠的 UI 状态可等待）。
- `upload` 可以可选地传递 `ref` 以在预备后自动点击。
- `upload` 还支持 `inputRef`（aria ref）或 `element`（CSS 选择器）以直接设置 `<input type="file">`。

### `canvas`

驱动节点 Canvas（present、eval、snapshot、A2UI）。

核心操作:

- `present`、`hide`、`navigate`、`eval`
- `snapshot`（返回图像块 + `MEDIA:<path>`）
- `a2ui_push`、`a2ui_reset`

注意:

- 在底层使用 Gateway `node.invoke`。
- 如果未提供 `node`,工具会选择默认值（单个连接的节点或本地 mac 节点）。
- A2UI 仅为 v0.8（无 `createSurface`）;CLI 拒绝带有行错误的 v0.9 JSONL。
- 快速检查: `openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"`。

### `nodes`

发现和定位配对的节点;发送通知;捕获相机/屏幕。

核心操作:

- `status`、`describe`
- `pending`、`approve`、`reject`（配对）
- `notify`（macOS `system.notify`）
- `run`（macOS `system.run`）
- `camera_list`、`camera_snap`、`camera_clip`、`screen_record`
- `location_get`、`notifications_list`、`notifications_action`
- `device_status`、`device_info`、`device_permissions`、`device_health`

注意:

- 相机/屏幕命令需要节点应用在前台。
- 图像返回图像块 + `MEDIA:<path>`。
- 视频返回 `FILE:<path>`（mp4）。
- 位置返回 JSON 负载（lat/lon/accuracy/timestamp）。
- `run` 参数: `command` argv 数组;可选的 `cwd`、`env`（`KEY=VAL`）、`commandTimeoutMs`、`invokeTimeoutMs`、`needsScreenRecording`。

示例（`run`）:

```json
{
  "action": "run",
  "node": "office-mac",
  "command": ["echo", "Hello"],
  "env": ["FOO=bar"],
  "commandTimeoutMs": 12000,
  "invokeTimeoutMs": 45000,
  "needsScreenRecording": false
}
```

### `image`

使用配置的图像模型分析图像。

核心参数:

- `image`（必需路径或 URL）
- `prompt`（可选;默认为"描述图像。"）
- `model`（可选覆盖）
- `maxBytesMb`（可选大小上限）

注意:

- 仅在配置 `agents.defaults.imageModel`（主要或回退）时可用,或者当可以从您的默认模型 + 配置的认证推断出隐式图像模型时（尽力配对）。
- 直接使用图像模型（独立于主聊天模型）。

### `pdf`

分析一个或多个 PDF 文档。

完整行为、限制、配置和示例，请参阅 [PDF 工具](/tools/pdf)。

### `message`

跨 Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/iMessage/MS Teams 发送消息和 Channel 操作。

核心操作:

- `send`（文本 + 可选媒体;MS Teams 还支持自适应卡的 `card`）
- `poll`（WhatsApp/Discord/MS Teams 投票）
- `react` / `reactions` / `read` / `edit` / `delete`
- `pin` / `unpin` / `list-pins`
- `permissions`
- `thread-create` / `thread-list` / `thread-reply`
- `search`
- `sticker`
- `member-info` / `role-info`
- `emoji-list` / `emoji-upload` / `sticker-upload`
- `role-add` / `role-remove`
- `channel-info` / `channel-list`
- `voice-status`
- `event-list` / `event-create`
- `timeout` / `kick` / `ban`

注意:

- `send` 通过 Gateway 路由 WhatsApp;其他 Channel 直接发送。
- `poll` 对 WhatsApp 和 MS Teams 使用 Gateway;Discord 投票直接发送。
- 当消息工具调用绑定到活动聊天 Session 时,发送被限制到该 Session 的目标以避免跨上下文泄漏。

### `cron`

管理 Gateway cron 作业和唤醒。

核心操作:

- `status`、`list`
- `add`、`update`、`remove`、`run`、`runs`
- `wake`（排队系统事件 + 可选的立即心跳）

注意:

- `add` 需要完整的 cron 作业对象（与 `cron.add` RPC 相同的架构）。
- `update` 使用 `{ jobId, patch }`（`id` 接受以兼容性）。

### `gateway`

重启或将更新应用到正在运行的 Gateway 进程（就地）。

核心操作:

- `restart`（授权 + 发送 `SIGUSR1` 以进行进程内重启;`openclaw gateway` 就地重启）
- `config.schema.lookup`（一次检查一个配置路径，无需将完整 schema 加载到提示上下文）
- `config.get`
- `config.apply`（验证 + 写入配置 + 重启 + 唤醒）
- `config.patch`（合并部分更新 + 重启 + 唤醒）
- `update.run`（运行更新 + 重启 + 唤醒）

注意:

- `config.schema.lookup` 需要指定目标配置路径，例如 `gateway.auth` 或 `agents.list.*.heartbeat`。
- 路径在寻址 `plugins.entries.<id>` 时可以包含斜线分隔的插件 id，例如 `plugins.entries.pack/one.config`。
- 使用 `delayMs`（默认为 2000）以避免中断进行中的回复。
- `config.schema` 仍可用于内部 Control UI 流程，不通过 agent `gateway` 工具公开。
- `restart` 默认启用;使用 `commands.restart: false` 禁用它。

### `sessions_list` / `sessions_history` / `sessions_send` / `sessions_spawn` / `session_status`

列出 Session、检查记录历史或发送到另一个 Session。

核心参数:

- `sessions_list`: `kinds?`、`limit?`、`activeMinutes?`、`messageLimit?`（0 = 无）
- `sessions_history`: `sessionKey`（或 `sessionId`）、`limit?`、`includeTools?`
- `sessions_send`: `sessionKey`（或 `sessionId`）、`message`、`timeoutSeconds?`（0 = 即发即弃）
- `sessions_spawn`: `task`、`label?`、`runtime?`、`agentId?`、`model?`、`thinking?`、`cwd?`、`runTimeoutSeconds?`、`thread?`、`mode?`、`cleanup?`、`sandbox?`、`streamTo?`、`attachments?`、`attachAs?`
- `session_status`: `sessionKey?`（默认当前;接受 `sessionId`）、`model?`（`default` 清除覆盖）

注意:

- `main` 是规范的直接聊天键;全局/未知被隐藏。
- `messageLimit > 0` 获取每个 Session 的最后 N 条消息（工具消息已过滤）。
- Session 定位由 `tools.sessions.visibility` 控制（默认 `tree`: 当前 Session + 衍生子 agent Session）。如果您为多个用户运行共享 agent,请考虑将 `tools.sessions.visibility: "self"` 设置为防止跨 Session 浏览。
- 当 `timeoutSeconds > 0` 时,`sessions_send` 等待最终完成。
- 投递/公告在完成后发生,是尽力而为的;`status: "ok"` 确认 agent 运行完成,而不是公告已投递。
- `sessions_spawn` 支持 `runtime: "subagent" | "acp"`（默认 `subagent`）。有关 ACP 运行时行为,请参见 [ACP Agents](/tools/acp-agents)。
- 对于 ACP 运行时，`streamTo: "parent"` 将初始运行进度摘要以系统事件形式路由回请求者 Session，而非直接子交付。
- `sessions_spawn` 启动子 agent 运行并将公告回复发布回请求者聊天。
  - 支持一次性模式（`mode: "run"`）和持久线程绑定模式（`mode: "session"` 与 `thread: true`）。
  - 如果 `thread: true` 且省略 `mode`,模式默认为 `session`。
  - `mode: "session"` 需要 `thread: true`。
  - 如果省略 `runTimeoutSeconds`,OpenClaw 在设置时使用 `agents.defaults.subagents.runTimeoutSeconds`;否则超时默认为 `0`（无超时）。
  - Discord 线程绑定流程依赖于 `session.threadBindings.*` 和 `channels.discord.threadBindings.*`。
  - 回复格式包括 `Status`、`Result` 和紧凑统计信息。
  - `Result` 是助手完成文本;如果缺少,则使用最新的 `toolResult` 作为回退。
- 手动完成模式衍生直接优先发送,有队列回退和瞬态失败重试（`status: "ok"` 表示运行完成,不是公告已投递）。
- `sessions_spawn` 支持仅子 agent 运行时的内联文件附件（ACP 拒绝它们）。每个附件有 `name`、`content` 和可选的 `encoding`（`utf8` 或 `base64`）和 `mimeType`。文件被物化到子工作区的 `.openclaw/attachments/<uuid>/` 中,带有 `.manifest.json` 元数据文件。工具返回带有 `count`、`totalBytes`、每个文件 `sha256` 和 `relDir` 的收据。附件内容从记录持久化中自动删除。
  - 通过 `tools.sessions_spawn.attachments`（`enabled`、`maxTotalBytes`、`maxFiles`、`maxFileBytes`、`retainOnSessionKeep`）配置限制。
  - `attachAs.mountPath` 是未来挂载实现的保留提示。
- `sessions_spawn` 是非阻塞的,立即返回 `status: "accepted"`。
- ACP `streamTo: "parent"` 响应可能包含 `streamLogPath`（Session 范围内的 `*.acp-stream.jsonl`），用于追踪进度历史。
- `sessions_send` 运行回复乒乓（回复 `REPLY_SKIP` 以停止;最大轮次通过 `session.agentToAgent.maxPingPongTurns`,0–5）。
- 乒乓后,目标 agent 运行**公告步骤**;回复 `ANNOUNCE_SKIP` 以抑制公告。
- 沙箱限制: 当当前 Session 被沙箱化且 `agents.defaults.sandbox.sessionToolsVisibility: "spawned"` 时,OpenClaw 将 `tools.sessions.visibility` 限制为 `tree`。

### `agents_list`

列出当前 Session 可以使用 `sessions_spawn` 定位的 agent id。

注意:

- 结果受每个 agent 允许列表的限制（`agents.list[].subagents.allowAgents`）。
- 当配置 `["*"]` 时,工具包括所有配置的 agent 并标记 `allowAny: true`。

## 参数(常见)

Gateway 支持的工具（`canvas`、`nodes`、`cron`）:

- `gatewayUrl`（默认 `ws://127.0.0.1:18789`）
- `gatewayToken`（如果启用认证）
- `timeoutMs`

注意: 当设置 `gatewayUrl` 时,请明确包含 `gatewayToken`。工具不会为覆盖继承配置或环境凭据,缺少明确凭据是错误。

浏览器工具:

- `profile`（可选;默认为 `browser.defaultProfile`）
- `target`（`sandbox` | `host` | `node`）
- `node`（可选;固定特定的节点 id/名称）

## 推荐的 agent 流程

浏览器自动化:

1. `browser` → `status` / `start`
2. `snapshot`（ai 或 aria）
3. `act`（click/type/press）
4. 如果您需要视觉确认,`screenshot`

Canvas 渲染:

1. `canvas` → `present`
2. `a2ui_push`（可选）
3. `snapshot`

节点定位:

1. `nodes` → `status`
2. 在选定的节点上 `describe`
3. `notify` / `run` / `camera_snap` / `screen_record`

## 安全

- 避免直接 `system.run`;仅在获得明确用户同意的情况下使用 `nodes` → `run`。
- 尊重用户对相机/屏幕捕获的同意。
- 在调用媒体命令之前使用 `status/describe` 确保权限。

## 如何向 agent 呈现工具

工具通过两个并行通道公开:

1. **系统提示文本**: 人类可读的列表 + 指导。
2. **工具架构**: 发送到模型 API 的结构化函数定义。

这意味着 agent 会看到"存在哪些工具"和"如何调用它们"。如果工具没有出现在系统提示或架构中,模型无法调用它。
