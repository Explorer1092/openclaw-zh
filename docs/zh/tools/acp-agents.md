---
mmh3_hash: "301e39eb6ea0345a625f46699a94bb3a"
summary: "使用 ACP 运行时 Session 运行 Codex、Claude Code、Cursor、Gemini CLI、OpenClaw ACP 及其他 harness Agent"
read_when:
  - 通过 ACP 运行编程 harness
  - 在消息 Channel 上设置绑定对话的 ACP Session
  - 将消息 Channel 对话绑定到持久化 ACP Session
  - 排查 ACP 后端及 Plugin 接线问题
  - 从聊天中操作 /acp 命令
title: "ACP Agent"
---

# ACP Agent

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) Session 让 OpenClaw 通过 ACP 后端 Plugin 运行外部编程 harness（例如 Pi、Claude Code、Codex、Cursor、Copilot、OpenClaw ACP、OpenCode、Gemini CLI 及其他受支持的 ACPX harness）。

如果你用自然语言告诉 OpenClaw"在 Codex 里运行这个"或"在 thread 里启动 Claude Code"，OpenClaw 应将请求路由到 ACP 运行时（而非原生子 Agent 运行时）。每个 ACP Session 的启动都会作为[后台任务](/automation/tasks)被跟踪。

如果你希望 Codex 或 Claude Code 作为外部 MCP 客户端直接连接到现有的 OpenClaw Channel 对话，请使用 [`openclaw mcp serve`](/cli/mcp) 而非 ACP。

## 我需要哪个页面？

有三个容易混淆的相邻功能：

| 你想要...                                                          | 使用                       | 说明                                                                                                       |
| ------------------------------------------------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 通过 OpenClaw _运行_ Codex、Claude Code、Gemini CLI 或其他外部 harness | 本页：ACP Agent            | 聊天绑定 Session、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、后台任务、运行时控制                |
| 将 OpenClaw Gateway Session _暴露为_ ACP 服务器供编辑器或客户端使用  | [`openclaw acp`](/cli/acp) | 桥接模式。IDE/客户端通过 stdio/WebSocket 以 ACP 协议连接 OpenClaw                                          |

## 开箱即用吗？

通常是的。

- 全新安装默认已启用捆绑的 `acpx` 运行时 Plugin。
- 捆绑的 `acpx` Plugin 优先使用其 Plugin 本地固定的 `acpx` 二进制文件。
- 启动时，OpenClaw 会探测该二进制文件并在需要时自动修复。
- 如需快速检查就绪状态，从 `/acp doctor` 开始。

首次使用时仍可能发生的情况：

- 目标 harness 适配器可能在首次使用该 harness 时通过 `npx` 按需获取。
- 该 harness 仍然需要在主机上存在供应商认证。
- 如果主机没有 npm/网络访问权限，首次运行的适配器获取可能会失败，直到缓存预热或以其他方式安装了适配器。

示例：

- `/acp spawn codex`：OpenClaw 应准备好引导 `acpx`，但 Codex ACP 适配器可能仍需要首次运行获取。
- `/acp spawn claude`：Claude ACP 适配器类似，加上该主机上的 Claude 端认证。

## 快速操作流程

当你需要 `/acp` 实操手册时使用以下步骤：

1. 启动 Session：
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. 在绑定的对话或 thread 中工作（或显式指定该 Session key）。
3. 查看运行时状态：
   - `/acp status`
4. 按需调整运行时选项：
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. 在不替换上下文的情况下微调活跃 Session：
   - `/acp steer tighten logging and continue`
6. 停止工作：
   - `/acp cancel`（停止当前 turn），或
   - `/acp close`（关闭 Session 并移除绑定）

## 用户快速入门

自然语言请求示例：

- "将此 Discord Channel 绑定到 Codex。"
- "在此 thread 中启动一个持久化 Codex Session 并保持专注。"
- "以一次性 Claude Code ACP Session 运行此任务并汇总结果。"
- "将此 iMessage 聊天绑定到 Codex，并让后续跟进保持在同一工作区中。"
- "在 thread 中使用 Gemini CLI 完成这个任务，后续跟进保持在同一 thread 中。"

OpenClaw 应执行的操作：

1. 选择 `runtime: "acp"`。
2. 解析请求的 harness 目标（`agentId`，例如 `codex`）。
3. 如果请求了当前对话绑定且活跃 Channel 支持，将 ACP Session 绑定到该对话。
4. 否则，如果请求了 thread 绑定且当前 Channel 支持，将 ACP Session 绑定到该 thread。
5. 将后续绑定消息路由到同一 ACP Session，直至取消焦点/关闭/过期。

## ACP 与子 Agent 对比

需要外部 harness 运行时时使用 ACP。需要 OpenClaw 原生委托运行时使用子 Agent。

| 方面          | ACP Session                           | 子 Agent 运行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时        | ACP 后端 Plugin（例如 acpx）          | OpenClaw 原生子 Agent 运行时       |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令      | `/acp ...`                            | `/subagents ...`                   |
| 启动工具      | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn`（默认运行时）     |

另见 [子 Agent](/tools/subagents)。

## ACP 如何运行 Claude Code

对于通过 ACP 的 Claude Code，栈结构为：

1. OpenClaw ACP Session 控制平面
2. 捆绑的 `acpx` 运行时 Plugin
3. Claude ACP 适配器
4. Claude 端运行时/Session 机制

重要区别：

- ACP Claude 是具有 ACP 控制、Session 恢复、后台任务跟踪和可选对话/thread 绑定的 harness Session。
  对于运营者，实际规则是：

- 需要 `/acp spawn`、可绑定 Session、运行时控制或持久化 harness 工作：使用 ACP

## 绑定 Session

### 当前对话绑定

当你希望当前对话成为持久化 ACP 工作区而不创建子 thread 时，使用 `/acp spawn <harness> --bind here`。

行为：

- OpenClaw 继续拥有 Channel 传输、认证、安全和交付。
- 当前对话被固定到已启动的 ACP Session key。
- 该对话中的后续消息路由到同一 ACP Session。
- `/new` 和 `/reset` 原地重置同一绑定 ACP Session。
- `/acp close` 关闭 Session 并移除当前对话绑定。

实际意味着：

- `--bind here` 保持相同的聊天界面。在 Discord 上，当前 Channel 仍然是当前 Channel。
- `--bind here` 在启动全新工作时仍然可以创建新的 ACP Session。绑定将该 Session 附加到当前对话。
- `--bind here` 本身不会创建子 Discord thread 或 Telegram 话题。
- ACP 运行时仍然可以有自己的工作目录（`cwd`）或磁盘上后端管理的工作区。该运行时工作区与聊天界面分离，不意味着新的消息 thread。
- 如果你启动到不同的 ACP Agent 且不传递 `--cwd`，OpenClaw 默认继承**目标 Agent** 的工作区，而非请求者的工作区。
- 如果继承的工作区路径缺失（`ENOENT`/`ENOTDIR`），OpenClaw 回退到后端默认 cwd，而不是静默地重用错误的目录树。
- 如果继承的工作区存在但无法访问（例如 `EACCES`），启动会返回真实的访问错误而非丢弃 `cwd`。

概念模型：

- 聊天界面：人们继续交谈的地方（`Discord channel`、`Telegram topic`、`iMessage chat`）
- ACP Session：OpenClaw 路由到的持久化 Codex/Claude/Gemini 运行时状态
- 子 thread/话题：仅通过 `--thread ...` 创建的可选额外消息界面
- 运行时工作区：harness 运行的文件系统位置（`cwd`、代码仓库检出、后端工作区）

示例：

- `/acp spawn codex --bind here`：保持此聊天，启动或附加 Codex ACP Session，并将此处的未来消息路由到它
- `/acp spawn codex --thread auto`：OpenClaw 可能创建子 thread/话题并将 ACP Session 绑定到那里
- `/acp spawn codex --bind here --cwd /workspace/repo`：与上述相同的聊天绑定，但 Codex 在 `/workspace/repo` 中运行

当前对话绑定支持：

- 公开了当前对话绑定支持的聊天/消息 Channel 可以通过共享对话绑定路径使用 `--bind here`。
- 具有自定义 thread/话题语义的 Channel 仍然可以在同一共享接口后面提供 Channel 特定的规范化。
- `--bind here` 始终意味着"原地绑定当前对话"。
- 通用当前对话绑定使用共享 OpenClaw 绑定存储，并在正常 Gateway 重启后仍然存在。

注意事项：

- `--bind here` 和 `--thread ...` 在 `/acp spawn` 调用中互斥。
- 在 Discord 上，`--bind here` 原地绑定当前 Channel 或 thread。仅当 OpenClaw 需要为 `--thread auto|here` 创建子 thread 时才需要 `spawnAcpSessions`。
- 如果活跃 Channel 不暴露当前对话 ACP 绑定，OpenClaw 返回明确的不支持消息。
- `resume` 和"新 Session"问题是 ACP Session 问题，而非 Channel 问题。你可以在不更改当前聊天界面的情况下重用或替换运行时状态。

### Thread 绑定 Session

当 Channel 适配器启用 thread 绑定时，ACP Session 可绑定到 thread：

- OpenClaw 将 thread 绑定到目标 ACP Session。
- 该 thread 中的后续消息路由到绑定的 ACP Session。
- ACP 输出回传到同一 thread。
- 取消焦点/关闭/归档/空闲超时或最大时效过期会移除绑定。

Thread 绑定支持取决于具体适配器。如果当前 Channel 适配器不支持 thread 绑定，OpenClaw 会返回明确的不支持/不可用消息。

Thread 绑定 ACP 所需的功能标志：

- `acp.enabled=true`
- `acp.dispatch.enabled` 默认开启（设为 `false` 可暂停 ACP 调度）
- Channel 适配器 ACP thread 启动标志已启用（适配器特定）
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

### 支持 Thread 的 Channel

- 任何暴露了 Session/thread 绑定能力的 Channel 适配器。
- 当前内置支持：
  - Discord threads/channels
  - Telegram 话题（群组/超级群组和私信中的论坛话题）
- Plugin Channel 可通过相同的绑定接口添加支持。

## Channel 特定设置

对于非临时工作流，在顶层 `bindings[]` 条目中配置持久化 ACP 绑定。

### 绑定模型

- `bindings[].type="acp"` 标记持久化 ACP 对话绑定。
- `bindings[].match` 标识目标对话：
  - Discord Channel 或 thread：`match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram 论坛话题：`match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/群聊：`match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    对于稳定的群组绑定，首选 `chat_id:*` 或 `chat_identifier:*`。
  - iMessage DM/群聊：`match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    对于稳定的群组绑定，首选 `chat_id:*`。
- `bindings[].agentId` 是归属的 OpenClaw Agent ID。
- 可选的 ACP 覆盖位于 `bindings[].acp` 下：
  - `mode`（`persistent` 或 `oneshot`）
  - `label`
  - `cwd`
  - `backend`

### 每 Agent 的运行时默认值

使用 `agents.list[].runtime` 为每个 Agent 定义一次 ACP 默认值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness ID，例如 `codex` 或 `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP 绑定 Session 的覆盖优先级：

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. 全局 ACP 默认值（例如 `acp.backend`）

示例：

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

行为：

- OpenClaw 在使用前确保已配置的 ACP Session 存在。
- 该 Channel 或话题中的消息路由到已配置的 ACP Session。
- 在绑定对话中，`/new` 和 `/reset` 原地重置同一 ACP Session key。
- 临时运行时绑定（例如由 thread 焦点流程创建的）在存在时仍然适用。

当前对话绑定不需要创建子 thread。它们需要活跃的对话上下文和暴露了 ACP 对话绑定的 Channel 适配器。

## 启动 ACP Session（接口）

### 通过 `sessions_spawn`

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

注意事项：

- `runtime` 默认为 `subagent`，因此 ACP Session 需显式设置 `runtime: "acp"`。
- 如果省略 `agentId`，OpenClaw 在已配置时使用 `acp.defaultAgent`。
- `mode: "session"` 需要 `thread: true` 以维持持久化绑定对话。

接口详情：

- `task`（必填）：发送给 ACP Session 的初始提示词。
- `runtime`（ACP 必填）：必须为 `"acp"`。
- `agentId`（可选）：ACP 目标 harness ID。如果已设置，回退到 `acp.defaultAgent`。
- `thread`（可选，默认 `false`）：在支持的地方请求 thread 绑定流程。
- `mode`（可选）：`run`（一次性）或 `session`（持久化）。
  - 默认为 `run`
  - 如果 `thread: true` 且省略了 mode，OpenClaw 可能根据运行时路径默认为持久化行为
  - `mode: "session"` 需要 `thread: true`
- `cwd`（可选）：请求的运行时工作目录（由后端/运行时策略验证）。
- `label`（可选）：用于 Session/横幅文本的面向运营者的标签。
- `resumeSessionId`（可选）：恢复现有 ACP Session 而非创建新 Session。Agent 通过 `session/load` 重放对话历史记录。需要 `runtime: "acp"`。
- `streamTo`（可选）：`"parent"` 将初始 ACP 运行进度摘要作为系统事件流式传回请求者 Session。
  - 当可用时，接受的响应包含 `streamLogPath`，指向 Session 范围的 JSONL 日志（`<sessionId>.acp-stream.jsonl`），可追踪完整的中继历史记录。

### 恢复现有 Session

使用 `resumeSessionId` 继续之前的 ACP Session 而非从头开始。Agent 通过 `session/load` 重放对话历史记录，因此可以在具有完整上下文的情况下继续之前的工作。

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

常见使用场景：

- 将 Codex Session 从笔记本电脑移交到手机——让 Agent 从上次离开的地方继续
- 继续在 CLI 中以交互方式开始的编码 Session，现在通过 Agent 无头运行
- 继续因 Gateway 重启或空闲超时而中断的工作

注意事项：

- `resumeSessionId` 需要 `runtime: "acp"`——与子 Agent 运行时一起使用时会返回错误。
- `resumeSessionId` 恢复上游 ACP 对话历史记录；`thread` 和 `mode` 仍正常适用于你正在创建的新 OpenClaw Session，因此 `mode: "session"` 仍然需要 `thread: true`。
- 目标 Agent 必须支持 `session/load`（Codex 和 Claude Code 支持）。
- 如果找不到 Session ID，启动会失败并显示明确的错误——不会静默回退到新 Session。

### 运营者冒烟测试

在 Gateway 部署后，当你需要快速验证 ACP 启动是否端到端正常工作时使用此方法，而不仅仅是通过单元测试。

推荐步骤：

1. 验证目标主机上已部署的 Gateway 版本/提交。
2. 确认已部署的源代码在 `src/gateway/sessions-patch.ts` 中包含 ACP 血统接受（`subagent:* or acp:* sessions`）。
3. 打开到实时 Agent 的临时 ACPX 桥 Session（例如 `jpclawhq` 上的 `razor(main)`）。
4. 要求该 Agent 使用以下参数调用 `sessions_spawn`：
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task：`Reply with exactly LIVE-ACP-SPAWN-OK`
5. 验证 Agent 报告：
   - `accepted=yes`
   - 一个真实的 `childSessionKey`
   - 没有验证错误
6. 清理临时 ACPX 桥 Session。

发给实时 Agent 的示例提示词：

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

注意事项：

- 除非有意测试 thread 绑定的持久化 ACP Session，否则请将此冒烟测试保持在 `mode: "run"` 上。
- 不要将 `streamTo: "parent"` 作为基本关卡的要求。该路径取决于请求者/Session 能力，是单独的集成检查。
- 将 thread 绑定的 `mode: "session"` 测试视为来自真实 Discord thread 或 Telegram 话题的第二次更丰富的集成测试。

## 沙箱兼容性

ACP Session 目前在主机运行时上运行，而不是在 OpenClaw 沙箱内部。

当前限制：

- 如果请求者 Session 已沙箱化，`sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 的 ACP 启动都会被阻止。
  - 错误：`Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` 与 `runtime: "acp"` 不支持 `sandbox: "require"`。
  - 错误：`sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

需要沙箱强制执行时使用 `runtime: "subagent"`。

### 通过 `/acp` 命令

需要时从聊天中使用 `/acp spawn` 进行显式运营者控制。

```text
/acp spawn codex --bind here
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --thread here
```

主要标志：

- `--bind here|off`
- `--mode persistent|oneshot`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

参见 [Slash Commands](/tools/slash-commands)。

## Session 目标解析

大多数 `/acp` 操作接受可选的 Session 目标（`session-key`、`session-id` 或 `session-label`）。

解析顺序：

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 尝试 key
   - 然后 UUID 形状的 session id
   - 然后 label
2. 当前 thread 绑定（如果此对话/thread 已绑定到 ACP Session）
3. 当前请求者 Session 回退

当前对话绑定和 thread 绑定都参与第 2 步。

如果没有目标解析，OpenClaw 返回明确的错误（`Unable to resolve session target: ...`）。

## 启动绑定模式

`/acp spawn` 支持 `--bind here|off`。

| 模式   | 行为                                               |
| ------ | -------------------------------------------------- |
| `here` | 原地绑定当前活跃对话；如果没有活跃对话则失败。     |
| `off`  | 不创建当前对话绑定。                               |

注意事项：

- `--bind here` 是"使此 Channel 或聊天由 Codex 支持"的最简单运营者路径。
- `--bind here` 不会创建子 thread。
- `--bind here` 仅在暴露了当前对话绑定支持的 Channel 上可用。
- `--bind` 和 `--thread` 不能在同一个 `/acp spawn` 调用中组合使用。

## 启动 Thread 模式

`/acp spawn` 支持 `--thread auto|here|off`。

| 模式   | 行为                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| `auto` | 在活跃 thread 中：绑定该 thread。在 thread 外：在支持时创建/绑定子 thread。                   |
| `here` | 需要当前活跃 thread；如果不在 thread 中则失败。                                               |
| `off`  | 无绑定。Session 启动时未绑定。                                                                 |

注意事项：

- 在非 thread 绑定界面上，默认行为实际上是 `off`。
- Thread 绑定启动需要 Channel 策略支持：
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
- 当你希望固定当前对话而不创建子 thread 时，使用 `--bind here`。

## ACP 控制

可用命令族：

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` 显示有效的运行时选项，以及（在可用时）运行时级别和后端级别的 Session 标识符。

某些控制取决于后端能力。如果后端不支持某个控制，OpenClaw 返回明确的不支持控制错误。

## ACP 命令手册

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

`/acp sessions` 从当前绑定或请求者 Session 的存储中读取。接受 `session-key`、`session-id` 或 `session-label` 令牌的命令通过 Gateway Session 发现解析目标，包括自定义的每 Agent `session.store` 根目录。

## 运行时选项映射

`/acp` 有便捷命令和通用设置器。

等价操作：

- `/acp model <id>` 映射到运行时配置键 `model`。
- `/acp permissions <profile>` 映射到运行时配置键 `approval_policy`。
- `/acp timeout <seconds>` 映射到运行时配置键 `timeout`。
- `/acp cwd <path>` 直接更新运行时 cwd 覆盖。
- `/acp set <key> <value>` 是通用路径。
  - 特殊情况：`key=cwd` 使用 cwd 覆盖路径。
- `/acp reset-options` 清除目标 Session 的所有运行时覆盖。

## acpx harness 支持（当前）

当前 acpx 内置 harness 别名：

- `claude`
- `codex`
- `copilot`
- `cursor`（Cursor CLI：`cursor-agent acp`）
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

当 OpenClaw 使用 acpx 后端时，除非你的 acpx 配置定义了自定义 Agent 别名，否则优先使用这些值作为 `agentId`。
如果你本地的 Cursor 安装仍将 ACP 暴露为 `agent acp`，请在 acpx 配置中覆盖 `cursor` Agent 命令，而不是更改内置默认值。

直接 acpx CLI 使用也可以通过 `--agent <command>` 定向到任意适配器，但这是 acpx CLI 功能（不是正常的 OpenClaw `agentId` 路径）。

## 必需配置

核心 ACP 基线：

```json5
{
  acp: {
    enabled: true,
    // 可选。默认为 true；设为 false 可在保持 /acp 控制的同时暂停 ACP 调度。
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Thread 绑定配置因 Channel 适配器而异。Discord 示例：

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

如果 thread 绑定 ACP 启动不工作，首先验证适配器功能标志：

- Discord：`channels.discord.threadBindings.spawnAcpSessions=true`

当前对话绑定不需要创建子 thread。它们需要活跃的对话上下文和暴露了 ACP 对话绑定的 Channel 适配器。

参见 [配置参考](/gateway/configuration-reference)。

## acpx 后端的 Plugin 设置

全新安装默认已启用捆绑的 `acpx` 运行时 Plugin，因此 ACP 通常无需手动安装 Plugin 步骤即可工作。

从以下命令开始：

```text
/acp doctor
```

如果你禁用了 `acpx`、通过 `plugins.allow`/`plugins.deny` 拒绝了它，或者想切换到本地开发检出，请使用显式 Plugin 路径：

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

开发期间本地工作区安装：

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

然后验证后端健康状况：

```text
/acp doctor
```

### acpx 命令和版本配置

默认情况下，捆绑的 acpx 后端 Plugin（`acpx`）使用 Plugin 本地固定的二进制文件：

1. 命令默认为 ACPX Plugin 包内 Plugin 本地的 `node_modules/.bin/acpx`。
2. 预期版本默认为扩展固定版本。
3. 启动时立即将 ACP 后端注册为未就绪。
4. 后台确保作业验证 `acpx --version`。
5. 如果 Plugin 本地二进制文件缺失或版本不匹配，运行：`npm install --omit=dev --no-save acpx@<pinned>` 并重新验证。

你可以在 Plugin 配置中覆盖命令/版本：

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

注意事项：

- `command` 接受绝对路径、相对路径或命令名称（`acpx`）。
- 相对路径从 OpenClaw 工作区目录解析。
- `expectedVersion: "any"` 禁用严格版本匹配。
- 当 `command` 指向自定义二进制文件/路径时，Plugin 本地自动安装被禁用。
- OpenClaw 启动在后端健康检查运行期间保持非阻塞状态。

参见 [Plugin](/tools/plugin)。

### 自动依赖安装

当你使用 `npm install -g openclaw` 全局安装 OpenClaw 时，acpx 运行时依赖项（平台特定的二进制文件）会通过 postinstall hook 自动安装。如果自动安装失败，Gateway 仍会正常启动，并通过 `openclaw acp doctor` 报告缺失的依赖项。

### Plugin 工具 MCP 桥接

默认情况下，ACPX Session **不**向 ACP harness 暴露 OpenClaw Plugin 注册的工具。

如果你希望 Codex 或 Claude Code 等 ACP Agent 调用已安装的 OpenClaw Plugin 工具（如记忆召回/存储），请启用专用桥接：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

此操作的作用：

- 将名为 `openclaw-plugin-tools` 的内置 MCP 服务器注入 ACPX Session 引导程序。
- 暴露已安装且启用的 OpenClaw Plugin 已注册的 Plugin 工具。
- 保持该功能显式且默认关闭。

安全和信任注意事项：

- 这会扩展 ACP harness 工具界面。
- ACP Agent 只能访问 Gateway 中已激活的 Plugin 工具。
- 将其视为与让这些 Plugin 在 OpenClaw 本身中执行相同的信任边界。
- 启用前请检查已安装的 Plugin。

自定义 `mcpServers` 仍像以前一样工作。内置 Plugin 工具桥接是额外的可选便捷功能，而非通用 MCP 服务器配置的替代品。

## 权限配置

ACP Session 以非交互方式运行——没有 TTY 来批准或拒绝文件写入和 shell 执行权限提示。acpx Plugin 提供了两个配置键来控制权限处理方式：

这些 ACPX harness 权限与 OpenClaw exec 批准分离，也与 CLI 后端供应商绕过标志（如 Claude CLI `--permission-mode bypassPermissions`）分离。ACPX `approve-all` 是 ACP Session 的 harness 级别破玻璃开关。

### `permissionMode`

控制 harness Agent 可以在不提示的情况下执行哪些操作。

| 值              | 行为                                       |
| --------------- | ------------------------------------------ |
| `approve-all`   | 自动批准所有文件写入和 shell 命令。        |
| `approve-reads` | 仅自动批准读取；写入和执行需要提示。       |
| `deny-all`      | 拒绝所有权限提示。                         |

### `nonInteractivePermissions`

控制当权限提示将显示但没有交互式 TTY 可用时（ACP Session 始终如此）发生的情况。

| 值     | 行为                                                   |
| ------ | ------------------------------------------------------ |
| `fail` | 以 `AcpRuntimeError` 中止 Session。**（默认）**        |
| `deny` | 静默拒绝权限并继续（优雅降级）。                       |

### 配置

通过 Plugin 配置设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

更改这些值后重启 Gateway。

> **重要：** OpenClaw 当前默认为 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非交互式 ACP Session 中，任何触发权限提示的写入或执行操作都可能以 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` 失败。
>
> 如果需要限制权限，请将 `nonInteractivePermissions` 设置为 `deny`，以便 Session 优雅降级而不是崩溃。

## 故障排查

| 症状                                                                     | 可能原因                                                                   | 解决方案                                                                                                                                                     |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                  | 后端 Plugin 缺失或已禁用。                                                 | 安装并启用后端 Plugin，然后运行 `/acp doctor`。                                                                                                              |
| `ACP is disabled by policy (acp.enabled=false)`                          | ACP 全局禁用。                                                             | 设置 `acp.enabled=true`。                                                                                                                                    |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`        | 来自普通 thread 消息的调度已禁用。                                          | 设置 `acp.dispatch.enabled=true`。                                                                                                                           |
| `ACP agent "<id>" is not allowed by policy`                              | Agent 不在允许列表中。                                                     | 使用允许的 `agentId` 或更新 `acp.allowedAgents`。                                                                                                            |
| `Unable to resolve session target: ...`                                  | 错误的 key/id/label 令牌。                                                 | 运行 `/acp sessions`，复制确切的 key/label，重试。                                                                                                           |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` 在没有活跃可绑定对话的情况下使用。                          | 移至目标聊天/Channel 并重试，或使用未绑定的启动。                                                                                                            |
| `Conversation bindings are unavailable for <channel>.`                   | 适配器缺少当前对话 ACP 绑定能力。                                          | 在支持的地方使用 `/acp spawn ... --thread ...`、配置顶层 `bindings[]`，或移至支持的 Channel。                                                                |
| `--thread here requires running /acp spawn inside an active ... thread`  | `--thread here` 在 thread 上下文外使用。                                   | 移至目标 thread 或使用 `--thread auto`/`off`。                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`            | 另一用户拥有活跃绑定目标。                                                 | 以所有者身份重新绑定或使用不同的对话或 thread。                                                                                                              |
| `Thread bindings are unavailable for <channel>.`                         | 适配器缺少 thread 绑定能力。                                               | 使用 `--thread off` 或移至支持的适配器/Channel。                                                                                                             |
| `Sandboxed sessions cannot spawn ACP sessions ...`                       | ACP 运行时在主机端；请求者 Session 已沙箱化。                              | 在沙箱化 Session 中使用 `runtime="subagent"`，或从未沙箱化 Session 运行 ACP 启动。                                                                           |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`  | 为 ACP 运行时请求了 `sandbox="require"`。                                  | 使用 `runtime="subagent"` 进行必需的沙箱隔离，或使用 ACP 配合从未沙箱化 Session 的 `sandbox="inherit"`。                                                    |
| 绑定 Session 缺少 ACP 元数据                                              | 过期/已删除的 ACP Session 元数据。                                         | 用 `/acp spawn` 重新创建，然后重新绑定/聚焦 thread。                                                                                                         |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 在非交互式 ACP Session 中阻止了写入/执行。                | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all` 并重启 Gateway。参见 [权限配置](#权限配置)。                                             |
| ACP Session 输出很少就提前失败                                            | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。             | 检查 Gateway 日志中的 `AcpRuntimeError`。要获得完整权限，设置 `permissionMode=approve-all`；要优雅降级，设置 `nonInteractivePermissions=deny`。               |
| ACP Session 在完成工作后无限期停滞                                        | harness 进程已完成但 ACP Session 未报告完成。                              | 用 `ps aux \| grep acpx` 监控；手动终止僵尸进程。                                                                                                            |
