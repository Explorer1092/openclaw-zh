---
mmh3_hash: "75e3d4bc81ff4765a9960116ac1087d6"
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
4. 将该 thread 的后续消息路由到同一 ACP Session，直到取消聚焦/关闭/过期。

## ACP 与子 Agent 对比

当需要外部 harness 运行时时使用 ACP。当需要 OpenClaw 原生委托运行时使用子 Agent。

| 维度          | ACP Session                           | 子 Agent 运行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 运行时       | ACP 后端 Plugin（例如 acpx）          | OpenClaw 原生子 Agent 运行时       |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令     | `/acp ...`                            | `/subagents ...`                   |
| 启动工具     | `sessions_spawn` 配合 `runtime:"acp"` | `sessions_spawn`（默认运行时）     |

另请参阅 [Sub-Agents](/tools/subagents)。

## 绑定 thread 的 Session（与 Channel 无关）

当 Channel 适配器启用了 thread 绑定功能时，ACP Session 可绑定到 thread：

- OpenClaw 将 thread 绑定到目标 ACP Session。
- 该 thread 中的后续消息路由到已绑定的 ACP Session。
- ACP 输出回传到同一 thread。
- 取消聚焦/关闭/归档/空闲超时或达到最大存活时间后，绑定被移除。

Thread 绑定支持因适配器而异。若当前 Channel 适配器不支持 thread 绑定，OpenClaw 将返回明确的不支持/不可用消息。

绑定 thread 的 ACP 所需的功能开关：

- `acp.enabled=true`
- `acp.dispatch.enabled` 默认开启（设为 `false` 可暂停 ACP 分发）
- Channel 适配器 ACP thread 启动开关已启用（因适配器而异）
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

### 支持 thread 的 Channel

- 任何暴露了 Session/thread 绑定能力的 Channel 适配器。
- 当前内置支持：
  - Discord thread/Channel
  - Telegram 话题（群组/超级群组中的论坛话题以及私信话题）
- Plugin Channel 可通过相同的绑定接口添加支持。

## 各 Channel 特定设置

对于非临时工作流，在顶层 `bindings[]` 条目中配置持久化 ACP 绑定。

### 绑定模型

- `bindings[].type="acp"` 标记持久化 ACP 会话绑定。
- `bindings[].match` 用于标识目标会话：
  - Discord Channel 或 thread：`match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram 论坛话题：`match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- `bindings[].agentId` 是所属 OpenClaw Agent 的 id。
- 可选的 ACP 覆盖配置位于 `bindings[].acp` 下：
  - `mode`（`persistent` 或 `oneshot`）
  - `label`
  - `cwd`
  - `backend`

### 每个 Agent 的运行时默认值

使用 `agents.list[].runtime` 为每个 Agent 定义一次 ACP 默认值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness id，例如 `codex` 或 `claude`）
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

行为说明：

- OpenClaw 在使用前确保已配置的 ACP Session 存在。
- 该 Channel 或话题中的消息路由到已配置的 ACP Session。
- 在绑定的会话中，`/new` 和 `/reset` 会就地重置同一 ACP Session key。
- 临时运行时绑定（例如通过 thread 聚焦流创建的绑定）在存在时仍然适用。

## 启动 ACP Session（接口）

### 通过 `sessions_spawn`

使用 `runtime: "acp"` 从 Agent turn 或工具调用中启动 ACP Session。

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

- `runtime` 默认为 `subagent`，因此对于 ACP Session 需要显式设置 `runtime: "acp"`。
- 如果省略 `agentId`，OpenClaw 在已配置的情况下使用 `acp.defaultAgent`。
- `mode: "session"` 需要 `thread: true` 以保持持久化绑定会话。

接口详情：

- `task`（必填）：发送给 ACP Session 的初始提示。
- `runtime`（ACP 必填）：必须为 `"acp"`。
- `agentId`（可选）：ACP 目标 harness id。若已设置则回退到 `acp.defaultAgent`。
- `thread`（可选，默认 `false`）：在支持的地方请求 thread 绑定流程。
- `mode`（可选）：`run`（一次性）或 `session`（持久化）。
  - 默认为 `run`
  - 若 `thread: true` 且省略 mode，OpenClaw 可能根据运行时路径默认为持久化行为
  - `mode: "session"` 需要 `thread: true`
- `cwd`（可选）：请求的运行时工作目录（由后端/运行时策略验证）。
- `label`（可选）：Session/标语文本中面向操作者的标签。
- `resumeSessionId`（可选）：恢复现有 ACP Session 而非新建。Agent 通过 `session/load` 重放其对话历史。需要 `runtime: "acp"`。
- `streamTo`（可选）：`"parent"` 将初始 ACP 运行进度摘要作为系统事件流回请求方 Session。
  - 在可用时，接受的响应包括 `streamLogPath`，指向一个 Session 范围的 JSONL 日志（`<sessionId>.acp-stream.jsonl`），可用于跟踪完整的中继历史。

### 恢复现有 Session

使用 `resumeSessionId` 继续之前的 ACP Session，而非从头开始。Agent 通过 `session/load` 重放其对话历史，从而携带完整的上下文继续工作。

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

常见使用场景：

- 将 Codex Session 从笔记本电脑切换到手机——让 Agent 从上次中断的地方继续
- 继续在 CLI 中以交互方式开始的编程 Session，现在通过 Agent 无头运行
- 恢复因 Gateway 重启或空闲超时而中断的工作

注意事项：

- `resumeSessionId` 需要 `runtime: "acp"`——与子 Agent 运行时一起使用时返回错误。
- `resumeSessionId` 恢复上游 ACP 会话历史；`thread` 和 `mode` 仍正常适用于你正在创建的新 OpenClaw Session，因此 `mode: "session"` 仍需 `thread: true`。
- 目标 Agent 必须支持 `session/load`（Codex 和 Claude Code 支持）。
- 若找不到 Session ID，启动失败并返回明确错误——不会静默回退到新 Session。

### 操作者冒烟测试

在 Gateway 部署后，当你希望快速验证 ACP 启动端到端实际工作（而非仅通过单元测试）时使用此方法。

推荐验证步骤：

1. 验证目标主机上已部署的 Gateway 版本/提交。
2. 确认已部署的源码在 `src/gateway/sessions-patch.ts` 中包含 ACP 谱系接受（`subagent:* or acp:* sessions`）。
3. 向实时 Agent 开启一个临时 ACPX bridge Session（例如 `jpclawhq` 上的 `razor(main)`）。
4. 要求该 Agent 调用 `sessions_spawn` 并传入：
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task：`Reply with exactly LIVE-ACP-SPAWN-OK`
5. 验证 Agent 报告：
   - `accepted=yes`
   - 一个真实的 `childSessionKey`
   - 无验证错误
6. 清理临时 ACPX bridge Session。

发送给实时 Agent 的示例提示：

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

注意事项：

- 除非你有意测试绑定 thread 的持久化 ACP Session，否则此冒烟测试保持 `mode: "run"`。
- 基础验证无需 `streamTo: "parent"`。该路径依赖于请求方/Session 能力，是独立的集成检查。
- 将绑定 thread 的 `mode: "session"` 测试视为第二轮、从真实 Discord thread 或 Telegram 话题进行的更丰富集成测试。

## 沙盒兼容性

ACP Session 目前在主机运行时上运行，而不在 OpenClaw 沙盒内运行。

当前限制：

- 若请求方 Session 处于沙盒中，`sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 的 ACP 启动均被阻止。
  - 错误：`Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- 带 `runtime: "acp"` 的 `sessions_spawn` 不支持 `sandbox: "require"`。
  - 错误：`sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

当需要强制沙盒执行时，使用 `runtime: "subagent"`。

### 通过 `/acp` 命令

需要从聊天进行显式操作者控制时，使用 `/acp spawn`。

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --thread here
```

关键标志：

- `--mode persistent|oneshot`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

参阅 [Slash Commands](/tools/slash-commands)。

## Session 目标解析

大多数 `/acp` 操作接受一个可选的 Session 目标（`session-key`、`session-id` 或 `session-label`）。

解析顺序：

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 先尝试 key
   - 再尝试 UUID 格式的 session id
   - 最后尝试 label
2. 当前 thread 绑定（若此会话/thread 已绑定到 ACP Session）
3. 当前请求方 Session 回退

若没有目标能解析，OpenClaw 返回明确错误（`Unable to resolve session target: ...`）。

## 启动 thread 模式

`/acp spawn` 支持 `--thread auto|here|off`。

| 模式   | 行为                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------- |
| `auto` | 在活跃 thread 中：绑定该 thread。在 thread 外：在支持时创建/绑定子 thread。 |
| `here` | 要求当前活跃 thread；若不在 thread 中则失败。                                                  |
| `off`  | 无绑定。Session 以未绑定状态启动。                                                             |

注意事项：

- 在不支持 thread 绑定的表面上，默认行为实际等同于 `off`。
- 绑定 thread 的启动需要 Channel 策略支持：
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

`/acp status` 显示有效的运行时选项，并在可用时同时显示运行时级别和后端级别的 Session 标识符。

部分控制依赖于后端能力。若后端不支持某项控制，OpenClaw 返回明确的不支持控制错误。

## ACP 命令速查表

| 命令              | 功能                                              | 示例                                                        |
| -------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| `/acp spawn`         | 创建 ACP Session；可选绑定 thread。                 | `/acp spawn codex --mode persistent --thread auto --cwd /repo` |
| `/acp cancel`        | 取消目标 Session 正在进行的 turn。                   | `/acp cancel agent:codex:acp:<uuid>`                           |
| `/acp steer`         | 向运行中的 Session 发送引导指令。                | `/acp steer --session support inbox prioritize failing tests`  |
| `/acp close`         | 关闭 Session 并解除 thread 目标绑定。                  | `/acp close`                                                   |
| `/acp status`        | 显示后端、模式、状态、运行时选项、能力。 | `/acp status`                                                  |
| `/acp set-mode`      | 为目标 Session 设置运行时模式。                      | `/acp set-mode plan`                                           |
| `/acp set`           | 通用运行时配置选项写入。                   | `/acp set model openai/gpt-5.2`                                |
| `/acp cwd`           | 设置运行时工作目录覆盖。                   | `/acp cwd /Users/user/Projects/repo`                           |
| `/acp permissions`   | 设置审批策略配置。                              | `/acp permissions strict`                                      |
| `/acp timeout`       | 设置运行时超时（秒）。                            | `/acp timeout 120`                                             |
| `/acp model`         | 设置运行时模型覆盖。                             | `/acp model anthropic/claude-opus-4-5`                         |
| `/acp reset-options` | 移除 Session 运行时选项覆盖。                  | `/acp reset-options`                                           |
| `/acp sessions`      | 列出存储中最近的 ACP Session。                      | `/acp sessions`                                                |
| `/acp doctor`        | 后端健康状况、能力及可操作的修复建议。           | `/acp doctor`                                                  |
| `/acp install`       | 打印确定性的安装和启用步骤。             | `/acp install`                                                 |

`/acp sessions` 读取当前绑定或请求方 Session 的存储。接受 `session-key`、`session-id` 或 `session-label` 令牌的命令通过 Gateway Session 发现解析目标，包括每个 Agent 自定义的 `session.store` 根路径。

## 运行时选项映射

`/acp` 提供便捷命令和通用设置器。

等效操作：

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

当 OpenClaw 使用 acpx 后端时，优先使用这些值作为 `agentId`，除非你的 acpx 配置定义了自定义 Agent 别名。

直接使用 acpx CLI 也可以通过 `--agent <command>` 定位任意适配器，但这是 acpx CLI 功能（不是正常的 OpenClaw `agentId` 路径）。

## 必要配置

ACP 核心基线配置：

```json5
{
  acp: {
    enabled: true,
    // 可选。默认为 true；设为 false 可暂停 ACP 分发同时保留 /acp 控制。
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

若绑定 thread 的 ACP 启动无效，请先验证适配器功能开关：

- Discord：`channels.discord.threadBindings.spawnAcpSessions=true`

参阅 [配置参考](/gateway/configuration-reference)。

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

然后验证后端健康状态：

```text
/acp doctor
```

### acpx 命令和版本配置

默认情况下，acpx Plugin（发布为 `@openclaw/acpx`）使用 Plugin 本地固定的二进制文件：

1. 命令默认为 `extensions/acpx/node_modules/.bin/acpx`。
2. 预期版本默认为扩展固定版本。
3. 启动时立即将 ACP 后端注册为未就绪状态。
4. 后台确保任务验证 `acpx --version`。
5. 若 Plugin 本地二进制文件缺失或版本不匹配，则运行：
   `npm install --omit=dev --no-save acpx@<pinned>` 并重新验证。

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

- `command` 接受绝对路径、相对路径或命令名（`acpx`）。
- 相对路径从 OpenClaw 工作区目录解析。
- `expectedVersion: "any"` 禁用严格版本匹配。
- 当 `command` 指向自定义二进制/路径时，Plugin 本地自动安装被禁用。
- OpenClaw 启动在后端健康检查运行时保持非阻塞状态。

参阅 [Plugins](/tools/plugin)。

## 权限配置

ACP Session 以非交互方式运行——没有 TTY 可以批准或拒绝文件写入和 Shell 执行权限提示。acpx Plugin 提供两个配置键来控制权限处理方式：

### `permissionMode`

控制 harness Agent 可以在不提示的情况下执行哪些操作。

| 值           | 行为                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | 自动批准所有文件写入和 Shell 命令。          |
| `approve-reads` | 仅自动批准读取；写入和执行需要提示。 |
| `deny-all`      | 拒绝所有权限提示。                              |

### `nonInteractivePermissions`

控制当需要显示权限提示但没有交互式 TTY 时（ACP Session 始终如此）的处理方式。

| 值  | 行为                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | 以 `AcpRuntimeError` 中止 Session。**（默认）**           |
| `deny` | 静默拒绝权限并继续（优雅降级）。 |

### 配置

通过 Plugin 配置设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

更改这些值后重启 Gateway。

> **重要提示：** OpenClaw 目前默认使用 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非交互式 ACP Session 中，任何触发权限提示的写入或执行操作都可能以 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` 失败。
>
> 若需要限制权限，将 `nonInteractivePermissions` 设为 `deny`，这样 Session 可优雅降级而不是崩溃。

## 故障排除

| 症状                                                                  | 可能原因                                                                    | 修复方法                                                                                                                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                  | 后端 Plugin 缺失或已禁用。                                             | 安装并启用后端 Plugin，然后运行 `/acp doctor`。                                                                                                                        |
| `ACP is disabled by policy (acp.enabled=false)`                          | ACP 已全局禁用。                                                          | 设置 `acp.enabled=true`。                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`        | 来自普通 thread 消息的分发已禁用。                                  | 设置 `acp.dispatch.enabled=true`。                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                              | Agent 不在允许列表中。                                                         | 使用允许的 `agentId` 或更新 `acp.allowedAgents`。                                                                                                                    |
| `Unable to resolve session target: ...`                                  | key/id/label 令牌无效。                                                     | 运行 `/acp sessions`，复制确切的 key/label，重试。                                                                                                                 |
| `--thread here requires running /acp spawn inside an active ... thread`  | `--thread here` 在 thread 上下文外使用。                                  | 移至目标 thread 或使用 `--thread auto`/`off`。                                                                                                                    |
| `Only <user-id> can rebind this thread.`                                 | 另一用户拥有 thread 绑定。                                               | 以所有者身份重新绑定或使用不同的 thread。                                                                                                                          |
| `Thread bindings are unavailable for <channel>.`                         | 适配器缺乏 thread 绑定能力。                                        | 使用 `--thread off` 或切换到支持的适配器/Channel。                                                                                                                  |
| `Sandboxed sessions cannot spawn ACP sessions ...`                       | ACP 运行时在主机侧；请求方 Session 处于沙盒中。                       | 从沙盒 Session 使用 `runtime="subagent"`，或从非沙盒 Session 运行 ACP 启动。                                                                                      |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`  | 为 ACP 运行时请求了 `sandbox="require"`。                                | 使用 `runtime="subagent"` 强制沙盒，或使用 ACP 配合非沙盒 Session 的 `sandbox="inherit"`。                                                                          |
| 绑定 Session 缺少 ACP 元数据                                   | ACP Session 元数据已过期/已删除。                                             | 用 `/acp spawn` 重新创建，然后重新绑定/聚焦 thread。                                                                                                               |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 在非交互式 ACP Session 中阻止写入/执行。             | 将 `plugins.entries.acpx.config.permissionMode` 设为 `approve-all` 并重启 Gateway。参阅 [权限配置](#permission-configuration)。                 |
| ACP Session 输出很少就提前失败                               | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。 | 检查 Gateway 日志中的 `AcpRuntimeError`。完整权限时设 `permissionMode=approve-all`；优雅降级时设 `nonInteractivePermissions=deny`。 |
| ACP Session 完成工作后无限期卡住                                    | harness 进程已完成但 ACP Session 未报告完成。             | 用 `ps aux \| grep acpx` 监控；手动终止过期进程。                                                                                                                 |
