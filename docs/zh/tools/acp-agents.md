---
mmh3_hash: "2a58dc93c66debf14150386db082199f"
summary: "通过 ACP 后端运行外部编程 harness（Claude Code、Cursor、Gemini CLI、显式 Codex ACP、OpenClaw ACP、OpenCode）"
read_when:
  - 通过 ACP 运行编程 harness
  - 在消息 Channel 上设置绑定对话的 ACP Session
  - 将消息 Channel 对话绑定到持久化 ACP Session
  - 排查 ACP 后端、Plugin 接线或完成交付问题
  - 从聊天中操作 /acp 命令
title: "ACP Agents"
sidebarTitle: "ACP Agents"
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) Session 让 OpenClaw 通过 ACP 后端 Plugin 运行外部编程 harness（例如 Pi、Claude Code、Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI 及其他受支持的 ACPX harness）。

每个 ACP Session 的启动都会作为[后台任务](/automation/tasks)被跟踪。

<Note>
**ACP 是外部 harness 路径，而非默认的 Codex 路径。** 原生 Codex 应用服务器 Plugin 拥有 `/codex ...` 控制和 `agentRuntime.id: "codex"` 嵌入式运行时；ACP 拥有 `/acp ...` 控制和 `sessions_spawn({ runtime: "acp" })` Session。

如果你希望 Codex 或 Claude Code 作为外部 MCP 客户端直接连接到现有的 OpenClaw Channel 对话，请使用 [`openclaw mcp serve`](/cli/mcp) 而非 ACP。
</Note>

## 我需要哪个页面？

| 你想要...                                                                   | 使用                                  | 说明                                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 在当前对话中绑定或控制 Codex                                                | `/codex bind`、`/codex threads`       | 当 `codex` Plugin 启用时的原生 Codex 应用服务器路径；包括绑定聊天回复、图像转发、模型/fast/权限、停止和引导控制。ACP 是显式回退。                                 |
| 通过 OpenClaw _运行_ Claude Code、Gemini CLI、显式 Codex ACP 或其他外部 harness | 本页                                  | 聊天绑定 Session、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制                                                                         |
| 将 OpenClaw Gateway Session _暴露为_ ACP 服务器供编辑器或客户端使用         | [`openclaw acp`](/cli/acp)            | 桥接模式。IDE/客户端通过 stdio/WebSocket 以 ACP 协议连接 OpenClaw                                                                                                  |
| 将本地 AI CLI 复用为纯文本回退模型                                          | [CLI Backends](/gateway/cli-backends) | 非 ACP。无 OpenClaw 工具、无 ACP 控制、无 harness 运行时                                                                                                           |

## 开箱即用吗？

通常是的。全新安装默认已启用捆绑的 `acpx` 运行时 Plugin，该 Plugin 使用其本地固定的 `acpx` 二进制文件，OpenClaw 在启动时探测并自动修复。运行 `/acp doctor` 进行就绪检查。

OpenClaw 仅在 ACP **真正可用**时才向 Agent 介绍 ACP 启动：ACP 必须已启用、调度不得被禁用、当前 Session 不得受沙箱阻止，且必须加载了运行时后端。如果这些条件不满足，ACP Plugin 技能和 `sessions_spawn` ACP 指导将保持隐藏，以免 Agent 建议不可用的后端。

<AccordionGroup>
  <Accordion title="首次运行注意事项">
    - 如果设置了 `plugins.allow`，它是一个限制性 Plugin 列表，**必须**包含 `acpx`；否则捆绑的默认值会被有意阻止，`/acp doctor` 会报告缺失的允许列表条目。
    - 目标 harness 适配器（Codex、Claude 等）可能在你首次使用时通过 `npx` 按需获取。
    - 该 harness 仍然需要在主机上存在供应商认证。
    - 如果主机没有 npm 或网络访问权限，首次运行的适配器获取会失败，直到缓存预热或以其他方式安装了适配器。
  </Accordion>
  <Accordion title="运行时先决条件">
    ACP 启动真实的外部 harness 进程。OpenClaw 拥有路由、后台任务状态、交付、绑定和策略；harness 拥有其 Provider 登录、模型目录、文件系统行为和原生工具。

    在归咎于 OpenClaw 之前，请验证：

    - `/acp doctor` 报告已启用且健康的后端。
    - 当设置了 `acp.allowedAgents` 允许列表时，目标 id 被允许。
    - harness 命令可以在 Gateway 主机上启动。
    - 该 harness 存在 Provider 认证（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所选模型对该 harness 存在——模型 id 不能跨 harness 移植。
    - 请求的 `cwd` 存在且可访问，或省略 `cwd` 让后端使用其默认值。
    - 权限模式与工作匹配。非交互式 Session 无法点击原生权限提示，因此写入/执行繁重的编码运行通常需要可无头继续的 ACPX 权限配置文件。

  </Accordion>
</AccordionGroup>

默认情况下，OpenClaw Plugin 工具和内置 OpenClaw 工具**不**向 ACP harness 暴露。仅在 harness 应直接调用这些工具时，才在 [ACP agents — 设置](/tools/acp-agents-setup) 中启用显式 MCP 桥接。

## 支持的 harness 目标

使用捆绑的 `acpx` 后端，将以下 harness id 用作 `/acp spawn <id>` 或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目标：

| Harness id | 典型后端                                   | 说明                                                                             |
| ---------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP 适配器                     | 需要主机上的 Claude Code 认证。                                                  |
| `codex`    | Codex ACP 适配器                           | 仅当原生 `/codex` 不可用或明确请求 ACP 时才作为显式 ACP 回退。                  |
| `copilot`  | GitHub Copilot ACP 适配器                  | 需要 Copilot CLI/运行时认证。                                                    |
| `cursor`   | Cursor CLI ACP（`cursor-agent acp`）       | 如果本地安装暴露了不同的 ACP 入口点，请覆盖 acpx 命令。                         |
| `droid`    | Factory Droid CLI                          | 需要 Factory/Droid 认证或 harness 环境中的 `FACTORY_API_KEY`。                  |
| `gemini`   | Gemini CLI ACP 适配器                      | 需要 Gemini CLI 认证或 API 密钥设置。                                            |
| `iflow`    | iFlow CLI                                  | 适配器可用性和模型控制取决于已安装的 CLI。                                       |
| `kilocode` | Kilo Code CLI                              | 适配器可用性和模型控制取决于已安装的 CLI。                                       |
| `kimi`     | Kimi/Moonshot CLI                          | 需要主机上的 Kimi/Moonshot 认证。                                                |
| `kiro`     | Kiro CLI                                   | 适配器可用性和模型控制取决于已安装的 CLI。                                       |
| `opencode` | OpenCode ACP 适配器                        | 需要 OpenCode CLI/Provider 认证。                                                |
| `openclaw` | 通过 `openclaw acp` 的 OpenClaw Gateway 桥接 | 让支持 ACP 的 harness 与 OpenClaw Gateway Session 通信。                        |
| `pi`       | Pi/嵌入式 OpenClaw 运行时                  | 用于 OpenClaw 原生 harness 实验。                                                |
| `qwen`     | Qwen Code / Qwen CLI                       | 需要主机上的 Qwen 兼容认证。                                                     |

自定义 acpx Agent 别名可以在 acpx 本身中配置，但 OpenClaw 策略在调度前仍会检查 `acp.allowedAgents` 和任何 `agents.list[].runtime.acp.agent` 映射。

## 运营者操作手册

从聊天中快速执行 `/acp` 流程：

<Steps>
  <Step title="启动">
    `/acp spawn claude --bind here`、
    `/acp spawn gemini --mode persistent --thread auto`，或显式
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="工作">
    在绑定的对话或 thread 中继续（或显式指定 Session key）。
  </Step>
  <Step title="检查状态">
    `/acp status`
  </Step>
  <Step title="调整">
    `/acp model <provider/model>`、
    `/acp permissions <profile>`、
    `/acp timeout <seconds>`。
  </Step>
  <Step title="引导">
    不替换上下文的情况下：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（当前 turn）或 `/acp close`（Session + 绑定）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命周期详情">
    - 启动创建或恢复 ACP 运行时 Session，在 OpenClaw Session 存储中记录 ACP 元数据，并在运行由父级拥有时可能创建后台任务。
    - 绑定的后续消息直接发送到 ACP Session，直到绑定被关闭、取消焦点、重置或过期。
    - Gateway 命令保持本地。`/acp ...`、`/status` 和 `/unfocus` 永不作为普通提示文本发送给绑定的 ACP harness。
    - `cancel` 在后端支持取消时中止活跃 turn；它不删除绑定或 Session 元数据。
    - `close` 从 OpenClaw 的角度结束 ACP Session 并移除绑定。如果 harness 支持恢复，它可能仍然保留自己的上游历史记录。
    - 空闲运行时工作者在 `acp.runtime.ttlMinutes` 后符合清理条件；存储的 Session 元数据仍可通过 `/acp sessions` 获取。
  </Accordion>
  <Accordion title="原生 Codex 路由规则">
    当原生 Codex Plugin 启用时，应路由到**原生 Codex Plugin** 的自然语言触发器：

    - "将此 Discord Channel 绑定到 Codex。"
    - "将此聊天附加到 Codex thread `<id>`。"
    - "显示 Codex threads，然后绑定这个。"

    原生 Codex 对话绑定是默认的聊天控制路径。
    OpenClaw 动态工具仍通过 OpenClaw 执行，而
    Codex 原生工具（如 shell/apply-patch）在 Codex 内部执行。
    对于 Codex 原生工具事件，OpenClaw 注入每 turn 的原生
    Hook 中继，以便 Plugin Hook 可以阻止 `before_tool_call`、
    观察 `after_tool_call`，并通过 OpenClaw 审批路由 Codex
    `PermissionRequest` 事件。Codex `Stop` Hook 被中继到
    OpenClaw `before_agent_finalize`，Plugin 可以在 Codex 最终确定
    答案之前请求再一次模型轮次。该中继保持刻意保守：
    它不会改变 Codex 原生工具参数或重写 Codex thread 记录。
    仅在需要 ACP 运行时/Session 模型时使用显式 ACP。
    嵌入式 Codex 支持边界记录在
    [Codex harness v1 支持合同](/plugins/codex-harness#v1-support-contract) 中。

  </Accordion>
  <Accordion title="模型/Provider/运行时选择速查表">
    - `openai-codex/*` — PI Codex OAuth/订阅路由。
    - `openai/*` 加 `agentRuntime.id: "codex"` — 原生 Codex 应用服务器嵌入式运行时。
    - `/codex ...` — 原生 Codex 对话控制。
    - `/acp ...` 或 `runtime: "acp"` — 显式 ACP/acpx 控制。
  </Accordion>
  <Accordion title="ACP 路由自然语言触发器">
    应路由到 ACP 运行时的触发器：

    - "以一次性 Claude Code ACP Session 运行此任务并汇总结果。"
    - "在 thread 中使用 Gemini CLI 完成这个任务，后续跟进保持在同一 thread 中。"
    - "在后台 thread 中通过 ACP 运行 Codex。"

    OpenClaw 选择 `runtime: "acp"`，解析 harness `agentId`，
    在支持时绑定到当前对话或 thread，并将后续路由到该 Session 直至关闭/过期。
    仅当 ACP/acpx 是显式的或原生 Codex Plugin 对请求的操作不可用时，
    Codex 才遵循此路径。

    对于 `sessions_spawn`，`runtime: "acp"` 仅在 ACP 已启用、
    请求者未沙箱化且 ACP 运行时后端已加载时才会被广播。
    它针对 ACP harness id，如 `codex`、`claude`、`droid`、`gemini` 或 `opencode`。
    除非该条目明确配置了 `agents.list[].runtime.type="acp"`，否则不要传递来自
    `agents_list` 的普通 OpenClaw 配置 Agent id；否则使用默认子 Agent 运行时。
    当 OpenClaw Agent 配置了 `runtime.type="acp"` 时，OpenClaw 使用
    `runtime.acp.agent` 作为底层 harness id。

  </Accordion>
</AccordionGroup>

## ACP 与子 Agent 对比

当你需要外部 harness 运行时时使用 ACP。当 `codex` Plugin 启用时，将**原生 Codex 应用服务器**用于 Codex 对话绑定/控制。需要 OpenClaw 原生委托运行时时使用**子 Agent**。

| 方面          | ACP Session                           | 子 Agent 运行                       |
| ------------- | ------------------------------------- | ----------------------------------- |
| 运行时        | ACP 后端 Plugin（例如 acpx）          | OpenClaw 原生子 Agent 运行时        |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| 主要命令      | `/acp ...`                            | `/subagents ...`                    |
| 启动工具      | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn`（默认运行时）      |

另见 [子 Agent](/tools/subagents)。

## ACP 如何运行 Claude Code

对于通过 ACP 的 Claude Code，栈结构为：

1. OpenClaw ACP Session 控制平面。
2. 捆绑的 `acpx` 运行时 Plugin。
3. Claude ACP 适配器。
4. Claude 端运行时/Session 机制。

ACP Claude 是具有 ACP 控制、Session 恢复、后台任务跟踪和可选对话/thread 绑定的 harness Session。

CLI backend 是独立的纯文本本地回退运行时——参见 [CLI Backends](/gateway/cli-backends)。

对于运营者，实际规则是：

- **需要 `/acp spawn`、可绑定 Session、运行时控制或持久化 harness 工作？** 使用 ACP。
- **需要通过原始 CLI 进行简单本地文本回退？** 使用 CLI backend。

## 绑定 Session

### 心智模型

- **聊天界面** — 人们继续交谈的地方（Discord Channel、Telegram 话题、iMessage 聊天）。
- **ACP Session** — OpenClaw 路由到的持久化 Codex/Claude/Gemini 运行时状态。
- **子 thread/话题** — 仅通过 `--thread ...` 创建的可选额外消息界面。
- **运行时工作区** — harness 运行的文件系统位置（`cwd`、代码仓库检出、后端工作区）。独立于聊天界面。

### 当前对话绑定

`/acp spawn <harness> --bind here` 将当前对话固定到已启动的 ACP Session——无子 thread，相同聊天界面。OpenClaw 继续拥有传输、认证、安全和交付。该对话中的后续消息路由到同一 Session；`/new` 和 `/reset` 原地重置 Session；`/acp close` 移除绑定。

示例：

```text
/codex bind                                              # 原生 Codex 绑定，将未来消息路由到此处
/codex model gpt-5.4                                     # 调整绑定的原生 Codex thread
/codex stop                                              # 控制活跃的原生 Codex turn
/acp spawn codex --bind here                             # Codex 的显式 ACP 回退
/acp spawn codex --thread auto                           # 可能创建子 thread/话题并绑定到那里
/acp spawn codex --bind here --cwd /workspace/repo       # 相同聊天绑定，Codex 在 /workspace/repo 中运行
```

<AccordionGroup>
  <Accordion title="绑定规则和排他性">
    - `--bind here` 和 `--thread ...` 互斥。
    - `--bind here` 仅在暴露了当前对话绑定的 Channel 上有效；否则 OpenClaw 返回明确的不支持消息。绑定在 Gateway 重启后仍然存在。
    - 在 Discord 上，仅当 OpenClaw 需要为 `--thread auto|here` 创建子 thread 时才需要 `spawnAcpSessions`——不适用于 `--bind here`。
    - 如果你在不传递 `--cwd` 的情况下启动到不同的 ACP Agent，OpenClaw 默认继承**目标 Agent** 的工作区。缺失的继承路径（`ENOENT`/`ENOTDIR`）回退到后端默认值；其他访问错误（如 `EACCES`）作为启动错误显示。
    - Gateway 管理命令在绑定对话中保持本地——即使普通后续文本路由到绑定的 ACP Session，`/acp ...` 命令也由 OpenClaw 处理；`/status` 和 `/unfocus` 在该界面启用命令处理时也保持本地。
  </Accordion>
  <Accordion title="Thread 绑定 Session">
    当 Channel 适配器启用 thread 绑定时：

    - OpenClaw 将 thread 绑定到目标 ACP Session。
    - 该 thread 中的后续消息路由到绑定的 ACP Session。
    - ACP 输出回传到同一 thread。
    - 取消焦点/关闭/归档/空闲超时或最大时效过期会移除绑定。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是 Gateway 命令，不是发给 ACP harness 的提示词。

    Thread 绑定 ACP 所需的功能标志：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 默认开启（设为 `false` 可暂停 ACP 调度）。
    - 已启用 Channel 适配器 ACP thread 启动标志（适配器特定）：
      - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

    Thread 绑定支持取决于具体适配器。如果当前 Channel 适配器不支持 thread 绑定，OpenClaw 会返回明确的不支持/不可用消息。

  </Accordion>
  <Accordion title="支持 Thread 的 Channel">
    - 任何暴露了 Session/thread 绑定能力的 Channel 适配器。
    - 当前内置支持：**Discord** threads/channels、**Telegram** 话题（群组/超级群组和私信中的论坛话题）。
    - Plugin Channel 可通过相同的绑定接口添加支持。
  </Accordion>
</AccordionGroup>

## 持久化 Channel 绑定

对于非临时工作流，在顶层 `bindings[]` 条目中配置持久化 ACP 绑定。

### 绑定模型

<ParamField path="bindings[].type" type='"acp"'>
  标记持久化 ACP 对话绑定。
</ParamField>
<ParamField path="bindings[].match" type="object">
  标识目标对话。各 Channel 的格式：

- **Discord Channel/thread：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram 论坛话题：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/群聊：** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。稳定的群组绑定首选 `chat_id:*` 或 `chat_identifier:*`。
- **iMessage DM/群聊：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。稳定的群组绑定首选 `chat_id:*`。
  </ParamField>
  <ParamField path="bindings[].agentId" type="string">
  归属的 OpenClaw Agent id。
  </ParamField>
  <ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  可选 ACP 覆盖。
  </ParamField>
  <ParamField path="bindings[].acp.label" type="string">
  可选面向运营者的标签。
  </ParamField>
  <ParamField path="bindings[].acp.cwd" type="string">
  可选运行时工作目录。
  </ParamField>
  <ParamField path="bindings[].acp.backend" type="string">
  可选后端覆盖。
  </ParamField>

### 每 Agent 的运行时默认值

使用 `agents.list[].runtime` 为每个 Agent 定义一次 ACP 默认值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness id，例如 `codex` 或 `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP 绑定 Session 的覆盖优先级：**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. 全局 ACP 默认值（例如 `acp.backend`）

### 示例

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### 行为

- OpenClaw 在使用前确保已配置的 ACP Session 存在。
- 该 Channel 或话题中的消息路由到已配置的 ACP Session。
- 在绑定对话中，`/new` 和 `/reset` 原地重置同一 ACP Session key。
- 临时运行时绑定（例如由 thread 焦点流程创建的）在存在时仍然适用。
- 对于没有显式 `cwd` 的跨 Agent ACP 启动，OpenClaw 从 Agent 配置中继承目标 Agent 工作区。
- 缺失的继承工作区路径回退到后端默认 cwd；非缺失的访问失败作为启动错误显示。

## 启动 ACP Session

两种启动 ACP Session 的方式：

<Tabs>
  <Tab title="通过 sessions_spawn">
    在 Agent turn 或工具调用中使用 `runtime: "acp"` 启动 ACP Session。

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` 默认为 `subagent`，因此 ACP Session 需显式设置 `runtime: "acp"`。
    如果省略 `agentId`，OpenClaw 在已配置时使用 `acp.defaultAgent`。
    `mode: "session"` 需要 `thread: true` 以维持持久化绑定对话。
    </Note>

  </Tab>
  <Tab title="通过 /acp 命令">
    从聊天中使用 `/acp spawn` 进行显式运营者控制。

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    主要标志：

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    参见 [Slash Commands](/tools/slash-commands)。

  </Tab>
</Tabs>

### `sessions_spawn` 参数

<ParamField path="task" type="string" required>
  发送给 ACP Session 的初始提示词。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP Session 必须为 `"acp"`。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 目标 harness id。如果已设置，回退到 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支持的地方请求 thread 绑定流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是一次性；`"session"` 是持久化。如果 `thread: true` 且
  省略了 `mode`，OpenClaw 可能根据运行时路径默认为持久化行为。
  `mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  请求的运行时工作目录（由后端/运行时策略验证）。如果省略，ACP 启动继承
  已配置的目标 Agent 工作区；缺失的继承路径回退到后端默认值，而真实访问错误会被返回。
</ParamField>
<ParamField path="label" type="string">
  用于 Session/横幅文本的面向运营者的标签。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  恢复现有 ACP Session 而非创建新 Session。Agent 通过 `session/load` 重放
  对话历史记录。需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 将初始 ACP 运行进度摘要作为系统事件流式传回请求者 Session。
  接受的响应包含 `streamLogPath`，指向 Session 范围的 JSONL 日志
  （`<sessionId>.acp-stream.jsonl`），可追踪完整的中继历史记录。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  N 秒后中止 ACP 子 turn。`0` 让 turn 保持在 Gateway 的无超时路径上。
  相同值同时应用于 Gateway 运行和 ACP 运行时，以防止停滞/配额耗尽的 harness
  无限期占用父 Agent 通道。
</ParamField>
<ParamField path="model" type="string">
  ACP 子 Session 的显式模型覆盖。Codex ACP 启动在 `session/new` 之前将
  OpenClaw Codex 引用（如 `openai-codex/gpt-5.4`）规范化为 Codex ACP 启动配置；
  斜杠形式（如 `openai-codex/gpt-5.4/high`）也设置 Codex ACP 推理努力。
  其他 harness 必须广播 ACP `models` 并支持 `session/set_model`；否则 OpenClaw/acpx
  会明确失败而不是静默回退到目标 Agent 默认值。
</ParamField>
<ParamField path="thinking" type="string">
  显式思考/推理努力。对于 Codex ACP，`minimal` 映射到低努力，
  `low`/`medium`/`high`/`xhigh` 直接映射，`off` 省略推理努力启动覆盖。
</ParamField>

## 启动绑定和 thread 模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行为                                               |
    | ------ | -------------------------------------------------- |
    | `here` | 原地绑定当前活跃对话；如果没有活跃对话则失败。     |
    | `off`  | 不创建当前对话绑定。                               |

    注意事项：

    - `--bind here` 是"使此 Channel 或聊天由 Codex 支持"的最简单运营者路径。
    - `--bind here` 不会创建子 thread。
    - `--bind here` 仅在暴露了当前对话绑定支持的 Channel 上可用。
    - `--bind` 和 `--thread` 不能在同一个 `/acp spawn` 调用中组合使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行为                                                                                     |
    | ------ | ---------------------------------------------------------------------------------------- |
    | `auto` | 在活跃 thread 中：绑定该 thread。在 thread 外：在支持时创建/绑定子 thread。              |
    | `here` | 需要当前活跃 thread；如果不在 thread 中则失败。                                          |
    | `off`  | 无绑定。Session 启动时未绑定。                                                           |

    注意事项：

    - 在非 thread 绑定界面上，默认行为实际上是 `off`。
    - Thread 绑定启动需要 Channel 策略支持：
      - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
    - 当你希望固定当前对话而不创建子 thread 时，使用 `--bind here`。

  </Tab>
</Tabs>

## 交付模型

ACP Session 可以是交互式工作区或父级拥有的后台工作。交付路径取决于该形式。

<AccordionGroup>
  <Accordion title="交互式 ACP Session">
    交互式 Session 旨在在可见的聊天界面上继续交谈：

    - `/acp spawn ... --bind here` 将当前对话绑定到 ACP Session。
    - `/acp spawn ... --thread ...` 将 Channel thread/话题绑定到 ACP Session。
    - 持久化配置的 `bindings[].type="acp"` 将匹配的对话路由到同一 ACP Session。

    绑定对话中的后续消息直接路由到 ACP Session，ACP 输出回传到同一 Channel/thread/话题。

    OpenClaw 发送给 harness 的内容：

    - 普通绑定后续消息作为提示文本发送，加上仅当 harness/后端支持时的附件。
    - `/acp` 管理命令和本地 Gateway 命令在 ACP 调度前被拦截。
    - 运行时生成的完成事件按目标物化。OpenClaw Agent 获得 OpenClaw 内部运行时上下文信封；外部 ACP harness 获得带有子结果和指令的普通提示词。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 信封永不应发送给外部 harness 或作为 ACP 用户转录文本保存。
    - ACP 转录条目使用用户可见的触发文本或普通完成提示词。内部事件元数据在可能的情况下保持结构化存储在 OpenClaw 中，不被视为用户创作的聊天内容。

  </Accordion>
  <Accordion title="父级拥有的一次性 ACP Session">
    由另一个 Agent 运行启动的一次性 ACP Session 是后台子任务，类似于子 Agent：

    - 父级使用 `sessions_spawn({ runtime: "acp", mode: "run" })` 请求工作。
    - 子任务在其自己的 ACP harness Session 中运行。
    - 子 turn 在原生子 Agent 启动使用的同一后台通道上运行，因此慢速 ACP harness 不会阻塞无关的主 Session 工作。
    - 完成通过任务完成通知路径报告。OpenClaw 在将内部完成元数据发送给外部 harness 之前将其转换为普通 ACP 提示词，因此 harness 不会看到 OpenClaw 专用的运行时上下文标记。
    - 父级在用户可见回复有用时以普通助手语气重写子任务结果。

    **不要**将此路径视为父子之间的点对点聊天。子任务已经有了返回父级的完成通道。

  </Accordion>
  <Accordion title="sessions_send 和 A2A 交付">
    `sessions_send` 可以在启动后以另一个 Session 为目标。对于普通对等 Session，OpenClaw 在注入消息后使用 Agent 到 Agent（A2A）后续路径：

    - 等待目标 Session 的回复。
    - 可选地让请求者和目标交换有限次数的后续 turn。
    - 要求目标生成通知消息。
    - 将该通知交付到可见的 Channel 或 thread。

    当无关的 Session 可以看到并向 ACP 目标发送消息时（例如在宽泛的 `tools.sessions.visibility` 设置下），该 A2A 路径作为需要可见后续的对等发送的回退保持启用。

    OpenClaw 仅在请求者是其自己父级拥有的一次性 ACP 子任务的父级时才跳过 A2A 后续。在该情况下，在任务完成之上运行 A2A 可能会用子任务结果唤醒父级，将父级回复转发回子任务，并创建父/子回声循环。`sessions_send` 结果对该拥有子任务情况报告 `delivery.status="skipped"`，因为完成路径已经负责结果。

  </Accordion>
  <Accordion title="恢复现有 Session">
    使用 `resumeSessionId` 继续之前的 ACP Session 而非从头开始。Agent 通过 `session/load` 重放对话历史记录，因此可以在具有完整之前上下文的情况下继续。

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常见使用场景：

    - 将 Codex Session 从笔记本电脑移交到手机——让 Agent 从上次离开的地方继续。
    - 继续在 CLI 中以交互方式开始的编码 Session，现在通过 Agent 无头运行。
    - 继续因 Gateway 重启或空闲超时而中断的工作。

    注意事项：

    - `resumeSessionId` 需要 `runtime: "acp"`——与子 Agent 运行时一起使用时会返回错误。
    - `resumeSessionId` 恢复上游 ACP 对话历史记录；`thread` 和 `mode` 仍正常适用于你正在创建的新 OpenClaw Session，因此 `mode: "session"` 仍然需要 `thread: true`。
    - 目标 Agent 必须支持 `session/load`（Codex 和 Claude Code 支持）。
    - 如果找不到 Session ID，启动会失败并显示明确的错误——不会静默回退到新 Session。

  </Accordion>
  <Accordion title="部署后冒烟测试">
    Gateway 部署后，运行实时端到端检查而不仅仅依赖单元测试：

    1. 验证目标主机上已部署的 Gateway 版本和提交。
    2. 打开到实时 Agent 的临时 ACPX 桥接 Session。
    3. 要求该 Agent 使用以下参数调用 `sessions_spawn`：`runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，任务为 `Reply with exactly LIVE-ACP-SPAWN-OK`。
    4. 验证 `accepted=yes`、一个真实的 `childSessionKey` 以及没有验证错误。
    5. 清理临时桥接 Session。

    将关卡保持在 `mode: "run"` 并跳过 `streamTo: "parent"`——
    thread 绑定的 `mode: "session"` 和流式中继路径是单独的更丰富的集成检查。

  </Accordion>
</AccordionGroup>

## 沙箱兼容性

ACP Session 目前在主机运行时上运行，**不**在 OpenClaw 沙箱内部。

<Warning>
**安全边界：**

- 外部 harness 可以根据其自身的 CLI 权限和所选的 `cwd` 进行读写。
- OpenClaw 的沙箱策略**不**包裹 ACP harness 执行。
- OpenClaw 仍然强制执行 ACP 功能门控、允许的 Agent、Session 所有权、Channel 绑定和 Gateway 交付策略。
- 对于沙箱强制执行的 OpenClaw 原生工作，使用 `runtime: "subagent"`。
  </Warning>

当前限制：

- 如果请求者 Session 已沙箱化，`sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 的 ACP 启动都会被阻止。
- `sessions_spawn` 与 `runtime: "acp"` 不支持 `sandbox: "require"`。

## Session 目标解析

大多数 `/acp` 操作接受可选的 Session 目标（`session-key`、`session-id` 或 `session-label`）。

**解析顺序：**

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 尝试 key
   - 然后 UUID 形状的 session id
   - 然后 label
2. 当前 thread 绑定（如果此对话/thread 已绑定到 ACP Session）。
3. 当前请求者 Session 回退。

当前对话绑定和 thread 绑定都参与第 2 步。

如果没有目标解析，OpenClaw 返回明确的错误（`Unable to resolve session target: ...`）。

## ACP 控制

| 命令                 | 功能                                             | 示例                                                             |
| -------------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| `/acp spawn`         | 创建 ACP Session；可选当前绑定或 thread 绑定。   | `/acp spawn codex --bind here --cwd /repo`                       |
| `/acp cancel`        | 取消目标 Session 的进行中 turn。                 | `/acp cancel agent:codex:acp:<uuid>`                             |
| `/acp steer`         | 向运行中的 Session 发送引导指令。                | `/acp steer --session support inbox prioritize failing tests`    |
| `/acp close`         | 关闭 Session 并解绑 thread 目标。                | `/acp close`                                                     |
| `/acp status`        | 显示后端、模式、状态、运行时选项、能力。         | `/acp status`                                                    |
| `/acp set-mode`      | 设置目标 Session 的运行时模式。                  | `/acp set-mode plan`                                             |
| `/acp set`           | 通用运行时配置选项写入。                         | `/acp set model openai/gpt-5.4`                                  |
| `/acp cwd`           | 设置运行时工作目录覆盖。                         | `/acp cwd /Users/user/Projects/repo`                             |
| `/acp permissions`   | 设置审批策略配置文件。                           | `/acp permissions strict`                                        |
| `/acp timeout`       | 设置运行时超时（秒）。                           | `/acp timeout 120`                                               |
| `/acp model`         | 设置运行时模型覆盖。                             | `/acp model anthropic/claude-opus-4-6`                           |
| `/acp reset-options` | 移除 Session 运行时选项覆盖。                    | `/acp reset-options`                                             |
| `/acp sessions`      | 从存储中列出最近的 ACP Session。                 | `/acp sessions`                                                  |
| `/acp doctor`        | 后端健康状况、能力、可操作修复建议。             | `/acp doctor`                                                    |
| `/acp install`       | 打印确定性安装和启用步骤。                       | `/acp install`                                                   |

`/acp status` 显示有效的运行时选项以及运行时级别和后端级别的 Session 标识符。当后端缺乏某项能力时，不支持的控制错误会明确显示。`/acp sessions` 从当前绑定或请求者 Session 的存储中读取；目标令牌（`session-key`、`session-id` 或 `session-label`）通过 Gateway Session 发现解析，包括自定义的每 Agent `session.store` 根目录。

### 运行时选项映射

`/acp` 有便捷命令和通用设置器。等价操作：

| 命令                         | 映射到                               | 说明                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | 运行时配置键 `model`                 | 对于 Codex ACP，OpenClaw 将 `openai-codex/<model>` 规范化为适配器模型 id，并将斜杠推理后缀（如 `openai-codex/gpt-5.4/high`）映射到 `reasoning_effort`。                              |
| `/acp set thinking <level>`  | 运行时配置键 `thinking`              | 对于 Codex ACP，OpenClaw 在适配器支持时发送相应的 `reasoning_effort`。                                                                                                               |
| `/acp permissions <profile>` | 运行时配置键 `approval_policy`       | —                                                                                                                                                                                     |
| `/acp timeout <seconds>`     | 运行时配置键 `timeout`               | —                                                                                                                                                                                     |
| `/acp cwd <path>`            | 运行时 cwd 覆盖                      | 直接更新。                                                                                                                                                                            |
| `/acp set <key> <value>`     | 通用                                 | `key=cwd` 使用 cwd 覆盖路径。                                                                                                                                                         |
| `/acp reset-options`         | 清除所有运行时覆盖                   | —                                                                                                                                                                                     |

## acpx harness、Plugin 设置和权限

有关 acpx harness 配置（Claude Code / Codex / Gemini CLI 别名）、Plugin 工具和 OpenClaw 工具 MCP 桥接以及 ACP 权限模式，请参阅 [ACP agents — 设置](/tools/acp-agents-setup)。

## 故障排查

| 症状                                                                        | 可能原因                                                                    | 解决方案                                                                                                                                                                              |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | 后端 Plugin 缺失、已禁用或被 `plugins.allow` 阻止。                        | 安装并启用后端 Plugin，当设置了该允许列表时在 `plugins.allow` 中包含 `acpx`，然后运行 `/acp doctor`。                                                                               |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP 全局禁用。                                                              | 设置 `acp.enabled=true`。                                                                                                                                                             |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 来自普通 thread 消息的调度已禁用。                                          | 设置 `acp.dispatch.enabled=true`。                                                                                                                                                    |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent 不在允许列表中。                                                      | 使用允许的 `agentId` 或更新 `acp.allowedAgents`。                                                                                                                                     |
| `/acp doctor` 在启动后立即报告后端未就绪                                     | Plugin 依赖项探测或自修复仍在运行。                                         | 短暂等待并重新运行 `/acp doctor`；如果仍不健康，检查后端安装错误和 Plugin 允许/拒绝策略。                                                                                            |
| harness 命令未找到                                                           | 适配器 CLI 未安装或首次运行 `npx` 获取失败。                                | 在 Gateway 主机上安装/预热适配器，或在 acpx 配置中显式配置 acpx Agent 命令。                                                                                                         |
| harness 中的模型未找到                                                       | 模型 id 对另一个 Provider/harness 有效，但对此 ACP 目标无效。               | 使用该 harness 列出的模型，在 harness 中配置模型，或省略覆盖。                                                                                                                        |
| harness 中的供应商认证错误                                                   | OpenClaw 健康，但目标 CLI/Provider 未登录。                                 | 在 Gateway 主机环境中登录或提供所需的 Provider 密钥。                                                                                                                                 |
| `Unable to resolve session target: ...`                                     | 错误的 key/id/label 令牌。                                                  | 运行 `/acp sessions`，复制确切的 key/label，重试。                                                                                                                                    |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` 在没有活跃可绑定对话的情况下使用。                            | 移至目标聊天/Channel 并重试，或使用未绑定的启动。                                                                                                                                     |
| `Conversation bindings are unavailable for <channel>.`                      | 适配器缺少当前对话 ACP 绑定能力。                                           | 在支持的地方使用 `/acp spawn ... --thread ...`、配置顶层 `bindings[]`，或移至支持的 Channel。                                                                                        |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` 在 thread 上下文外使用。                                    | 移至目标 thread 或使用 `--thread auto`/`off`。                                                                                                                                        |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 另一用户拥有活跃绑定目标。                                                  | 以所有者身份重新绑定或使用不同的对话或 thread。                                                                                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | 适配器缺少 thread 绑定能力。                                                | 使用 `--thread off` 或移至支持的适配器/Channel。                                                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP 运行时在主机端；请求者 Session 已沙箱化。                               | 在沙箱化 Session 中使用 `runtime="subagent"`，或从未沙箱化 Session 运行 ACP 启动。                                                                                                   |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | 为 ACP 运行时请求了 `sandbox="require"`。                                   | 使用 `runtime="subagent"` 进行必需的沙箱隔离，或使用 ACP 配合从未沙箱化 Session 的 `sandbox="inherit"`。                                                                             |
| `Cannot apply --model ... did not advertise model support`                  | 目标 harness 不暴露通用 ACP 模型切换。                                      | 使用广播了 ACP `models`/`session/set_model` 的 harness，使用 Codex ACP 模型引用，或如果该 harness 有自己的启动标志则直接在其中配置模型。                                              |
| 绑定 Session 缺少 ACP 元数据                                                 | 过期/已删除的 ACP Session 元数据。                                          | 用 `/acp spawn` 重新创建，然后重新绑定/聚焦 thread。                                                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` 在非交互式 ACP Session 中阻止了写入/执行。                 | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all` 并重启 Gateway。参见[权限配置](/tools/acp-agents-setup#permission-configuration)。                               |
| ACP Session 输出很少就提前失败                                               | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。              | 检查 Gateway 日志中的 `AcpRuntimeError`。要获得完整权限，设置 `permissionMode=approve-all`；要优雅降级，设置 `nonInteractivePermissions=deny`。                                       |
| ACP Session 在完成工作后无限期停滞                                           | harness 进程已完成但 ACP Session 未报告完成。                               | 用 `ps aux \| grep acpx` 监控；手动终止僵尸进程。                                                                                                                                     |
| harness 看到 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 内部事件信封跨越了 ACP 边界泄漏。                                           | 更新 OpenClaw 并重新运行完成流程；外部 harness 应只接收普通完成提示词。                                                                                                               |

## 相关

- [ACP agents — 设置](/tools/acp-agents-setup)
- [Agent send](/tools/agent-send)
- [CLI Backends](/gateway/cli-backends)
- [Codex harness](/plugins/codex-harness)
- [多 Agent 沙箱工具](/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（桥接模式）](/cli/acp)
- [子 Agent](/tools/subagents)
</content>
</invoke>