---
mmh3_hash: "55c48b1d4913c5e9fadab42c2bfda4d4"
summary: "使用 ACP 运行时 Session 运行 Pi、Claude Code、Codex、OpenCode、Gemini CLI 及其他 harness Agent"
read_when:
  - 通过 ACP 运行编程 harness
  - 在支持 thread 的 Channel 上设置绑定 thread 的 ACP Session
  - 排查 ACP 后端及 Plugin 接线问题
  - 从聊天中操作 /acp 命令
title: "ACP Agent"
---

# ACP Agent

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) Session 让 OpenClaw 通过 ACP 后端 Plugin 运行外部编程 harness（例如 Pi、Claude Code、Codex、OpenCode 和 Gemini CLI）。

如果你用自然语言���诉 OpenClaw"在 Codex 里运行这个"或"在 thread 里启动 Claude Code"，OpenClaw 会将请求路由到 ACP 运行时（而非原生子 Agent 运行时）。

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

当需要外部 harness 运行时使用 ACP；当需要 OpenClaw 原生委托运行时使用子 Agent。

| 方面          | ACP Session                           | 子 Agent 运行                       |
| ------------- | ------------------------------------- | ----------------------------------- |
| 运行时        | ACP 后端 Plugin（例如 acpx）          | OpenClaw 原生子 Agent 运行时        |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| 主要命令      | `/acp ...`                            | `/subagents ...`                    |
| 启动工具      | `sessions_spawn` 加 `runtime:"acp"`   | `sessions_spawn`（默认运行时）      |

另请参阅 [子 Agent](/tools/subagents)。

## 绑定 Thread 的 Session（与 Channel 无关）

当 Channel 适配器启用 thread 绑定时，ACP Session 可以绑定到 thread：

- OpenClaw 将 thread 绑定到目标 ACP Session。
- 该 thread 中的后续消息路由到绑定的 ACP Session。
- ACP 输出返回到同一 thread。
- 取消聚焦/关闭/归档/空闲超时或最大存活时间到期后，绑定将被移除。

thread 绑定支持与适配器有关。如果当前 Channel 适配器不支持 thread 绑定，OpenClaw 将返回明确的不支持/不可用消息。

绑定 thread 的 ACP 所需功能开关：

- `acp.enabled=true`
- `acp.dispatch.enabled=true`
- Channel 适配器 ACP thread 启动开关已启用（与适配器有关）
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`

### 支持 Thread 的 Channel

- 任何公开 Session/thread 绑定能力的 Channel 适配器。
- 当前内置支持：Discord。
- Plugin Channel 可通过同一绑定接口添加支持。

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

- `runtime` 默认为 `subagent`，ACP Session 需显式设置 `runtime: "acp"`。
- 如果省略 `agentId`，OpenClaw 将使用已配置的 `acp.defaultAgent`。
- `mode: "session"` 需要 `thread: true` 以保持持久化绑定对话。

接口详情：

- `task`（必填）：发送给 ACP Session 的初始提示。
- `runtime`（ACP 必填）：必须为 `"acp"`。
- `agentId`（可选）：ACP 目标 harness id。若已设置则回退到 `acp.defaultAgent`。
- `thread`（可选，默认 `false`）：在支持的地方请求 thread 绑定流程。
- `mode`（可选）：`run`（一次性）或 `session`（持久化）。
  - 默认为 `run`
  - 若 `thread: true` 且未指定 mode，OpenClaw 可能根据运行时路径默认采用持久化行为
  - `mode: "session"` 需要 `thread: true`
- `cwd`（可选）：请求的运行时工作目录（由后端/运行时策略验证）。
- `label`（可选）：用于 Session/横幅文本的操作员可见标签。

### 通过 `/acp` 命令

需要时可在聊天中使用 `/acp spawn` 进行显式操作员控制。

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --thread here
```

关键参数：

- `--mode persistent|oneshot`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

参阅 [Slash 命令](/tools/slash-commands)。

## Session 目标解析

大多数 `/acp` 操作接受可选的 Session 目标（`session-key`、`session-id` 或 `session-label`）。

解析顺序：

1. 显式目标参数（或 `/acp steer` 的 `--session`）
   - 尝试 key
   - 然后 UUID 格式的 session id
   - 然后 label
2. 当前 thread 绑定（如果此对话/thread 已绑定到 ACP Session）
3. 当前请求者 Session 回退

如果无法解析目标，OpenClaw 将返回明确的错误（`Unable to resolve session target: ...`）。

## 启动 Thread 模式

`/acp spawn` 支持 `--thread auto|here|off`。

| 模式   | 行为                                                                                  |
| ------ | ------------------------------------------------------------------------------------- |
| `auto` | 在活跃 thread 中：绑定该 thread。在 thread 外：在支持时创建/绑定子 thread。           |
| `here` | 要求当前处于活跃 thread；若不在则失败。                                               |
| `off`  | 不绑定。Session 以未绑定状态启动。                                                    |

注意事项：

- 在不支持 thread 绑定的平面上，默认行为实际上等同于 `off`。
- thread 绑定启动需要 Channel 策略支持（Discord：`channels.discord.threadBindings.spawnAcpSessions=true`）。

## ACP 控制命令

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

`/acp status` 显示有效运行时选项，以及（如有）运行时级别和后端级别的 Session 标识符。

某些控制命令依赖后端能力。如果后端不支持某控制命令，OpenClaw 将返回明确的不支持控制错误。

## ACP 命令速查表

| 命令                 | 功能                                           | 示例                                                           |
| -------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| `/acp spawn`         | 创建 ACP Session；可选 thread 绑定。           | `/acp spawn codex --mode persistent --thread auto --cwd /repo` |
| `/acp cancel`        | 取消目标 Session 正在执行的 turn。             | `/acp cancel agent:codex:acp:<uuid>`                           |
| `/acp steer`         | 向运行中的 Session 发送引导指令。              | `/acp steer --session support inbox prioritize failing tests`  |
| `/acp close`         | 关闭 Session 并解绑 thread 目标。             | `/acp close`                                                   |
| `/acp status`        | 显示后端、模式、状态、运行时选项及能力。       | `/acp status`                                                  |
| `/acp set-mode`      | 设置目标 Session 的运行时模式。                | `/acp set-mode plan`                                           |
| `/acp set`           | 通用运行时配置选项写入。                       | `/acp set model openai/gpt-5.2`                                |
| `/acp cwd`           | 设置运行时工作目录覆盖。                       | `/acp cwd /Users/user/Projects/repo`                           |
| `/acp permissions`   | 设置审批策略配置文件。                         | `/acp permissions strict`                                      |
| `/acp timeout`       | 设置运行时超时（秒）。                         | `/acp timeout 120`                                             |
| `/acp model`         | 设置运行时模型覆盖。                           | `/acp model anthropic/claude-opus-4-5`                         |
| `/acp reset-options` | 移除 Session 运行时选项覆盖。                  | `/acp reset-options`                                           |
| `/acp sessions`      | 列出存储中最近的 ACP Session。                 | `/acp sessions`                                                |
| `/acp doctor`        | 后端健康检查、能力检测及可操作修复建议。       | `/acp doctor`                                                  |
| `/acp install`       | 打印确定性安装和启用步骤。                     | `/acp install`                                                 |

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

当 OpenClaw 使用 acpx 后端时，优先使用这些值作为 `agentId`，除非你的 acpx 配置定义了自定义 Agent 别名。

直接使用 acpx CLI 也可以通过 `--agent <command>` 指定任意适配器，但这是 acpx CLI 的原始 escape hatch 功能（不是正常的 OpenClaw `agentId` 路径）。

## 必需配置

ACP 核心基础配置：

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: ["pi", "claude", "codex", "opencode", "gemini"],
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

thread 绑定配置与 Channel 适配器有关。Discord 示例：

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

如果 thread 绑定 ACP 启动不起作用，请先验证适配器功能开关：

- Discord：`channels.discord.threadBindings.spawnAcpSessions=true`

参阅 [配置参考](/gateway/configuration-reference)。

## acpx 后端 Plugin 安装

安装并启用 Plugin：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

开发期间本地 workspace 安装：

```bash
openclaw plugins install ./extensions/acpx
```

然后验证后端健康状态：

```text
/acp doctor
```

### acpx 命令与版本配置

默认情况下，`@openclaw/acpx` 使用 Plugin 本地固定二进制：

1. 命令默认为 `extensions/acpx/node_modules/.bin/acpx`。
2. 期望版本默认为扩展固定版本。
3. 启动时立即将 ACP 后端注册为未就绪状态。
4. 后台确保任务验证 `acpx --version`。
5. 如果 Plugin 本地二进制缺失或版本不匹配，将运行：
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

- `command` 接受绝对路径、相对路径或命令名称（`acpx`）。
- 相对路径从 OpenClaw workspace 目录解析。
- `expectedVersion: "any"` 禁用严格版本匹配。
- 当 `command` 指向自定义二进制/路径时，Plugin 本地自动安装将被禁用。
- OpenClaw 启动在后端健康检查运行期间保持非阻塞。

参阅 [Plugin](/tools/plugin)。

## 权限配置

ACP Session 以非交互方式运行——没有 TTY 来批准或拒绝文件写入和 shell 执行权限提示。acpx Plugin 提供两个控制权限处理方式的配置键：

### `permissionMode`

控制 harness Agent 无需提示即可执行的操作。

| 值              | 行为                                        |
| --------------- | ------------------------------------------- |
| `approve-all`   | 自动批准所有文件写入和 shell 命令。         |
| `approve-reads` | 仅自动批准读取操作；写入和执行需要提示。    |
| `deny-all`      | 拒绝所有权限提示。                          |

### `nonInteractivePermissions`

控制当权限提示应显示但无可用交互式 TTY 时（ACP Session 始终如此）发生的情况。

| 值     | 行为                                                    |
| ------ | ------------------------------------------------------- |
| `fail` | 以 `AcpRuntimeError` 中止 Session。**（默认）**         |
| `deny` | 静默拒绝权限并继续（优雅降级）。                        |

### 配置

通过 Plugin 配置设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

更改这些值后重启 Gateway。

> **重要：** OpenClaw 当前默认为 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非交互式 ACP Session 中，任何触发权限提示的写入或执行操作都可能以 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` 失败。
>
> 如果需要限制权限，请将 `nonInteractivePermissions` 设置为 `deny`，使 Session 优雅降级而非崩溃。

## 故障排查

| 症状                                                                     | 可能原因                                                    | 修复方法                                                                                                                                                          |
| ------------------------------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                  | 后端 Plugin 缺失或已禁用。                                  | 安装并启用后端 Plugin，然后运行 `/acp doctor`。                                                                                                                   |
| `ACP is disabled by policy (acp.enabled=false)`                          | ACP 全局禁用。                                              | 设置 `acp.enabled=true`。                                                                                                                                         |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`        | 来自普通 thread 消息的 dispatch 已禁用。                    | 设置 `acp.dispatch.enabled=true`。                                                                                                                                |
| `ACP agent "<id>" is not allowed by policy`                              | Agent 不在允许列表中。                                      | 使用允许的 `agentId` 或更新 `acp.allowedAgents`。                                                                                                                 |
| `Unable to resolve session target: ...`                                  | key/id/label 令牌无效。                                     | 运行 `/acp sessions`，复制准确的 key/label 后重试。                                                                                                               |
| `--thread here requires running /acp spawn inside an active ... thread`  | `--thread here` 在 thread 上下文之外使用。                  | 移至目标 thread 或使用 `--thread auto`/`off`。                                                                                                                    |
| `Only <user-id> can rebind this thread.`                                 | 另一用户拥有 thread 绑定。                                  | 以所有者身份重新绑定或使用不同 thread。                                                                                                                           |
| `Thread bindings are unavailable for <channel>.`                         | 适配器不具备 thread 绑定能力。                              | 使用 `--thread off` 或移至支持的适配器/Channel。                                                                                                                  |
| ACP Session 缺少绑定 Session 的元数据                                   | ACP Session 元数据过期/已删除。                             | 使用 `/acp spawn` 重新创建，然后重新绑定/聚焦 thread。                                                                                                            |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 在非交互式 ACP Session 中阻止了写入/执行。 | 将 `plugins.entries.acpx.config.permissionMode` 设置为 `approve-all` 并重启 Gateway。参阅[权限配置](#permission-configuration)。                                  |
| ACP Session 以极少输出提前失败                                          | 权限提示被 `permissionMode`/`nonInteractivePermissions` 阻止。 | 检查 Gateway 日志中的 `AcpRuntimeError`。如需完整权限，设置 `permissionMode=approve-all`；如需优雅降级，设置 `nonInteractivePermissions=deny`。                    |
| ACP Session 在完成工作后无限期停滞                                      | harness 进程已结束但 ACP Session 未报告完成。               | 使用 `ps aux \| grep acpx` 监控；手动终止残留进程。                                                                                                               |
