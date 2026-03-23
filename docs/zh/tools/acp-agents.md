---
mmh3_hash: "b23bbefa0479c7e106014733b29465e0"
summary: "使用 ACP 运行时 Session 运行 Pi、Claude Code、Codex、OpenCode、Gemini CLI 及其他 harness Agent"
read_when:
  - 通过 ACP 运行编程 harness
  - 在支持 thread 的 Channel 上设置绑定 thread 的 ACP Session
  - 将 Discord Channel 或 Telegram 论坛话题绑定到持久化 ACP Session
  - 排查 ACP 后端及 Plugin 接线问题
  - 从聊天中操作 /acp 命令
title: "ACP Agent"
---

# ACP Agent

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) Session 让 OpenClaw 通过 ACP 后端 Plugin 运行外部编程 harness（例如 Pi、Claude Code、Codex、OpenCode 和 Gemini CLI）。

如果你用自然语言告诉 OpenClaw"在 Codex 里运行这个"或"在 thread 里启动 Claude Code"，OpenClaw 会将请求路由到 ACP 运行时（而非原生子 Agent 运行时）。

## 快速操作流程

当你需要 `/acp` 实操手册时使用以下步骤：

1. 启动 Session：
   - `/acp spawn codex --mode persistent --thread auto`
2. 在绑定的 thread 中工作（或显式指定该 Session key）。
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

- "在此 thread 中启动一个持久化 Codex Session 并保持专注。"
- "以一次性 Claude Code ACP Session 运行此任务并汇总结果。"
- "在 thread 中使用 Gemini CLI 完成这个任务，后续跟进保持在同一 thread 中。"

OpenClaw 应执行的操作：

1. 选择 `runtime: "acp"`。
2. 解析请求的 harness 目标（`agentId`，例如 `codex`）。
3. 如果请求了 thread 绑定且当前 Channel 支持，将 ACP Session 绑定到该 thread。
4. 将后续 thread 消息路由到同一 ACP Session，直至取消焦点/关闭/过期。

## ACP 与子 Agent 对比

需要外部 harness 运行时时使用 ACP。需要 OpenClaw 原生委托运行时使用子 Agent。

| 方面          | ACP Session                           | 子 Agent 运行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时        | ACP 后端 Plugin（例如 acpx）          | OpenClaw 原生子 Agent 运行时       |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令      | `/acp ...`                            | `/subagents ...`                   |
| 启动工具      | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn`（默认运行时）     |

另见 [子 Agent](/tools/subagents)。

## Thread 绑定 Session（与 Channel 无关）

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
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --thread here
```

主要标志：

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

如果没有目标解析，OpenClaw 返回明确的错误（`Unable to resolve session target: ...`）。

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

| 命令                 | 功能                                             | 示例                                                           |
| -------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| `/acp spawn`         | 创建 ACP Session；可选 thread 绑定。             | `/acp spawn codex --mode persistent --thread auto --cwd /repo` |
| `/acp cancel`        | 取消目标 Session 的进行中 turn。                 | `/acp cancel agent:codex:acp:<uuid>`                           |
| `/acp steer`         | 向运行中的 Session 发送引导指令。                | `/acp steer --session support inbox prioritize failing tests`  |
| `/acp close`         | 关闭 Session 并解绑 thread 目标。                | `/acp close`                                                   |
| `/acp status`        | 显示后端、模式、状态、运行时选项、能力。         | `/acp status`                                                  |
| `/acp set-mode`      | 设置目标 Session 的运行时模式。                  | `/acp set-mode plan`                                           |
| `/acp set`           | 通用运行时配置选项写入。                         | `/acp set model openai/gpt-5.2`                                |
| `/acp cwd`           | 设置运行时工作目录覆盖。                         | `/acp cwd /Users/user/Projects/repo`                           |
| `/acp permissions`   | 设置审批策略配置文件。                           | `/acp permissions strict`                                      |
| `/acp timeout`       | 设置运行时超时（秒）。                           | `/acp timeout 120`                                             |
| `/acp model`         | 设置运行时模型覆盖。                             | `/acp model anthropic/claude-opus-4-6`                         |
| `/acp reset-options` | 移除 Session 运行时选项覆盖。                    | `/acp reset-options`                                           |
| `/acp sessions`      | 从存储中列出最近的 ACP Session。                 | `/acp sessions`                                                |
| `/acp doctor`        | 后端健康状况、能力、可操作修复建议。             | `/acp doctor`                                                  |
| `/acp install`       | 打印确定性安装和启用步骤。                       | `/acp install`                                                 |

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

- `pi`
- `claude`
- `codex`
- `opencode`
- `gemini`
- `kimi`

当 OpenClaw 使用 acpx 后端时，除非你的 acpx 配置定义了自定义 Agent 别名，否则优先使用这些值作为 `agentId`。

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
    allowedAgents: ["pi", "claude", "codex", "opencode", "gemini", "kimi"],
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

参见 [配置参考](/gateway/configuration-reference)。

## acpx 后端的 Plugin 设置

安装并启用 Plugin：

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

开发期间本地工作区安装：

```bash
openclaw plugins install ./extensions/acpx
```

然后验证后端健康状况：

```text
/acp doctor
```

### acpx 命令和版本配置

默认情况下，捆绑的 acpx 后端 Plugin（`acpx`）使用 Plugin 本地固定的二进制文件：

1. 命令默认为 `extensions/acpx/node_modules/.bin/acpx`。
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

## 权限配置

ACP Session 以非交互方式运行——没有 TTY 来批准或拒绝文件写入和 shell 执行权限提示。acpx Plugin 提供了两个配置键来控制权限处理方式：

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
| `--thread here requires running /acp spawn inside an active ... thread`  | `--thread here` 在 thread 上下文外使用。                                   | 移至目标 thread 或使用 `--thread auto`/`off`。                                                                                                               |
| `Only <user-id> can rebind this thread.`                                 | 另一用户拥有 thread 绑定。                                                 | 以所有者身份重新绑定或使用不同的 thread。                                                                                                                    |
| `Thread bindings are unavailable for <channel>.`                         | 适配器缺少 thread 绑定能力。                                               | 使用 `--thread off` 或移至支持的适配器/Channel。                                                                                                             |
| `Sandboxed sessions cannot spawn ACP sessions ...`                       | ACP 运行时在主机端；请求者 Session 已沙箱化。                              | 在沙箱化 Session 中使用 `runtime="subagent"`，或从未沙箱化 Session 运行 ACP 启动。                                                                           |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`  | 为 ACP 运行时请求了 `sandbox="require"`。                                  | 使用 `runtime="subagent"` 进行必需的沙箱隔离，或使用 ACP 配合从未沙箱化 Session 的 `sandbox="inherit"`。                                                    |
| 绑定 Session 缺少 ACP 元数据                                              | 过期/已删除的 ACP Session 元数据。                                         | 用 `/acp spawn` 重新创建，然后重新绑定/聚焦 thread。                                                                                                         |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 在非交互式 ACP Session 中阻止了写入/执行。                | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all` 并重启 Gateway。参见 [权限配置](#权限配置)。                                             |
| ACP Session 输出很少就提前失败                                            | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。             | 检查 Gateway 日志中的 `AcpRuntimeError`。要获得完整权限，设置 `permissionMode=approve-all`；要优雅降级，设置 `nonInteractivePermissions=deny`。               |
| ACP Session 在完成工作后无限期停滞                                        | harness 进程已完成但 ACP Session 未报告完成。                              | 用 `ps aux \| grep acpx` 监控；手动终止僵尸进程。                                                                                                            |
