---
mmh3_hash: "e2579030b1538583b518edbcc18fb4f8"
read_when:
  - 通过 ACP 运行编码 Harness
  - 在消息 Channel 上设置会话绑定的 ACP Session
  - 将消息 Channel 对话绑定到持久 ACP Session
  - 排查 ACP 后端和插件接线问题
  - 在聊天中使用 /acp 命令
summary: 通过 ACP 运行时 Session 使用 Codex、Claude Code、Cursor、Gemini CLI、OpenClaw ACP 及其他 Harness 智能体
title: ACP 智能体
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: tools/acp-agents.md
  workflow: 15
---

# ACP 智能体

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) Session 允许 OpenClaw 通过 ACP 后端插件运行外部编码 Harness（例如 Pi、Claude Code、Codex、Cursor、Copilot、OpenClaw ACP、OpenCode、Gemini CLI 及其他支持的 ACPX Harness）。

如果你用自然语言要求 OpenClaw "在 Codex 中运行这个"或"在线程中启动 Claude Code"，OpenClaw 应将该请求路由到 ACP 运行时（而非原生子 Agent 运行时）。每次 ACP Session 创建都作为[后台任务](/automation/tasks)跟踪。

如果你想让 Codex 或 Claude Code 作为外部 MCP 客户端直接连接到现有 OpenClaw Channel 对话，请使用 [`openclaw mcp serve`](/cli/mcp) 而非 ACP。

## 快速操作流程

当你需要一个实用的 `/acp` 操作手册时使用：

1. 创建 Session：
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. 在绑定的对话或线程中工作（或显式指定该 Session Key）。
3. 检查运行时状态：
   - `/acp status`
4. 根据需要调整运行时选项：
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. 在不替换上下文的情况下引导活跃 Session：
   - `/acp steer tighten logging and continue`
6. 停止工作：
   - `/acp cancel`（取消当前轮次），或
   - `/acp close`（关闭 Session + 移除绑定）

## 人工快速入门

自然请求示例：

- "将此 Discord Channel 绑定到 Codex。"
- "在此处的线程中启动持久 Codex Session 并保持专注。"
- "以一次性 Claude Code ACP Session 运行此任务并总结结果。"
- "将此 iMessage 聊天绑定到 Codex，并在同一工作区保持后续交互。"
- "在线程中使用 Gemini CLI 处理这个任务，然后在该线程中保持后续交互。"

OpenClaw 应该做的事：

1. 选择 `runtime: "acp"`。
2. 解析请求的 Harness 目标（`agentId`，例如 `codex`）。
3. 如果请求了当前对话绑定，且活跃 Channel 支持，则将 ACP Session 绑定到该对话。
4. 否则，如果请求了线程绑定，且当前 Channel 支持，则将 ACP Session 绑定到线程。
5. 在取消焦点/关闭/过期之前，将后续绑定消息路由到同一 ACP Session。

## ACP 与子 Agent 对比

当需要外部 Harness 运行时使用 ACP。当需要 OpenClaw 原生委托运行时使用子 Agent。

| 领域          | ACP Session                           | 子 Agent 运行                        |
| ------------- | ------------------------------------- | ------------------------------------ |
| 运行时        | ACP 后端插件（例如 acpx）             | OpenClaw 原生子 Agent 运行时         |
| Session Key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`    |
| 主要命令      | `/acp ...`                            | `/subagents ...`                     |
| 创建工具      | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn`（默认运行时）       |

另见 [Sub-agents](/tools/subagents)。

## 绑定 Session

### 当前对话绑定

当你希望当前对话成为持久 ACP 工作区而不创建子线程时，使用 `/acp spawn <harness> --bind here`。

行为：

- OpenClaw 继续持有 Channel 传输、认证、安全性和投递。
- 当前对话被固定到已创建的 ACP Session Key。
- 该对话中的后续消息路由到同一 ACP Session。
- `/new` 和 `/reset` 就地重置同一绑定的 ACP Session。
- `/acp close` 关闭 Session 并移除当前对话绑定。

实际意义：

- `--bind here` 保持相同的聊天界面。在 Discord 上，当前 Channel 保持不变。
- `--bind here` 在创建新工作时仍可创建新 ACP Session。绑定将该 Session 附加到当前对话。
- `--bind here` 本身不会创建子 Discord 线程或 Telegram 话题。
- ACP 运行时仍可在磁盘上拥有自己的工作目录（`cwd`）或后端管理的工作区。该运行时工作区与聊天界面分离，不意味着创建新的消息线程。

心智模型：

- 聊天界面：人们继续交流的地方（`Discord Channel`、`Telegram topic`、`iMessage chat`）
- ACP Session：OpenClaw 路由到的持久 Codex/Claude/Gemini 运行时状态
- 子线程/话题：仅由 `--thread ...` 创建的可选额外消息界面
- 运行时工作区：Harness 运行的文件系统位置（`cwd`、仓库检出、后端工作区）

示例：

- `/acp spawn codex --bind here`：保持此聊天，创建或附加 Codex ACP Session，并将此处的后续消息路由到它
- `/acp spawn codex --thread auto`：OpenClaw 可能创建子线程/话题并将 ACP Session 绑定到那里
- `/acp spawn codex --bind here --cwd /workspace/repo`：与上述相同的聊天绑定，但 Codex 在 `/workspace/repo` 中运行

当前对话绑定支持：

- 支持当前对话绑定的 Channel 适配器可通过共享对话绑定路径使用 `--bind here`。
- 具有自定义线程/话题语义的 Channel 仍可在同一共享接口背后提供特定于 Channel 的规范化。
- `--bind here` 始终意味着"就地绑定当前对话"。
- 通用当前对话绑定使用共享的 OpenClaw 绑定存储，在正常 Gateway 重启后仍然有效。

注意事项：

- `--bind here` 和 `--thread ...` 在 `/acp spawn` 中互斥。
- 在 Discord 上，`--bind here` 就地绑定当前 Channel 或线程。仅当 OpenClaw 需要为 `--thread auto|here` 创建子线程时才需要 `spawnAcpSessions`。
- 如果活跃 Channel 不支持当前对话 ACP 绑定，OpenClaw 返回清晰的不支持消息。
- `resume` 和"新 Session"问题是 ACP Session 问题，而非 Channel 问题。可以重用或替换运行时状态而不改变当前聊天界面。

### 线程绑定 Session

当 Channel 适配器启用线程绑定时，ACP Session 可以绑定到线程：

- OpenClaw 将线程绑定到目标 ACP Session。
- 该线程中的后续消息路由到绑定的 ACP Session。
- ACP 输出投递回同一线程。
- 取消焦点/关闭/归档/空闲超时或最大年龄到期后移除绑定。

线程绑定支持因适配器而异。如果活跃 Channel 适配器不支持线程绑定，OpenClaw 返回清晰的不支持/不可用消息。

线程绑定 ACP 所需的功能标志：

- `acp.enabled=true`
- `acp.dispatch.enabled` 默认为开启（设置 `false` 可暂停 ACP 调度）
- Channel 适配器 ACP 线程创建标志已启用（适配器特定）
  - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`

### 支持线程的 Channel

- 任何暴露 Session/线程绑定能力的 Channel 适配器。
- 当前内置支持：
  - Discord 线程/Channel
  - Telegram 话题（群组/超级群组中的论坛话题和 DM 话题）
- 插件 Channel 可以通过相同的绑定接口添加支持。

## Channel 专属设置

对于非临时工作流，在顶层 `bindings[]` 条目中配置持久 ACP 绑定。

### 绑定模型

- `bindings[].type="acp"` 标记持久 ACP 对话绑定。
- `bindings[].match` 标识目标对话：
  - Discord Channel 或线程：`match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram 论坛话题：`match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/群聊：`match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    对稳定的群组绑定优先使用 `chat_id:*` 或 `chat_identifier:*`。
  - iMessage DM/群聊：`match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    对稳定的群组绑定优先使用 `chat_id:*`。
- `bindings[].agentId` 是所属 OpenClaw 智能体 id。
- 可选的 ACP 覆盖位于 `bindings[].acp` 下：
  - `mode`（`persistent` 或 `oneshot`）
  - `label`
  - `cwd`
  - `backend`

### 每智能体的运行时默认值

使用 `agents.list[].runtime` 为每个智能体定义一次 ACP 默认值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（Harness id，例如 `codex` 或 `claude`）
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
  ],
}
```

## 启动 ACP Session（接口）

### 从 `sessions_spawn`

使用 `runtime: "acp"` 从智能体轮次或工具调用启动 ACP Session。

```json
{
  "task": "打开仓库并总结失败的测试",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

注意事项：

- `runtime` 默认为 `subagent`，因此 ACP Session 需显式设置 `runtime: "acp"`。
- 如果省略 `agentId`，OpenClaw 在配置了 `acp.defaultAgent` 时使用它。
- `mode: "session"` 需要 `thread: true` 以保持持久绑定对话。

接口详情：

- `task`（必填）：发送到 ACP Session 的初始提示词。
- `runtime`（ACP 必填）：必须为 `"acp"`。
- `agentId`（可选）：ACP 目标 Harness id。如果设置了 `acp.defaultAgent` 则回退到它。
- `thread`（可选，默认 `false`）：在支持的地方请求线程绑定流程。
- `mode`（可选）：`run`（一次性）或 `session`（持久）。
- `cwd`（可选）：请求的运行时工作目录（由后端/运行时策略验证）。
- `label`（可选）：在 Session/横幅文本中使用的操作员可见标签。
- `resumeSessionId`（可选）：恢复现有 ACP Session 而非创建新 Session。
- `streamTo`（可选）：`"parent"` 将初始 ACP 运行进度摘要作为系统事件流式传输回请求者 Session。

### 恢复现有 Session

使用 `resumeSessionId` 继续之前的 ACP Session 而非从头开始。

```json
{
  "task": "从上次中断处继续——修复剩余的测试失败",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

## 沙箱兼容性

ACP Session 目前在宿主运行时上运行，而非 OpenClaw 沙箱内部。

当前限制：

- 如果请求者 Session 处于沙箱中，`sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 的 ACP 创建均被阻止。
- `sessions_spawn` with `runtime: "acp"` 不支持 `sandbox: "require"`。

需要沙箱强制执行时使用 `runtime: "subagent"`。

### 从 `/acp` 命令

在需要时使用 `/acp spawn` 从聊天进行显式操作员控制。

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

关键标志：

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

参见 [Slash Commands](/tools/slash-commands)。

## ACP 控制命令

可用命令系列：

- `/acp spawn`、`/acp cancel`、`/acp steer`、`/acp close`、`/acp status`
- `/acp set-mode`、`/acp set`、`/acp cwd`、`/acp permissions`、`/acp timeout`
- `/acp model`、`/acp reset-options`、`/acp sessions`、`/acp doctor`、`/acp install`

## acpx Harness 支持（当前）

当前内置 acpx Harness 别名：

`claude`、`codex`、`copilot`、`cursor`、`droid`、`gemini`、`iflow`、`kilocode`、`kimi`、`kiro`、`openclaw`、`opencode`、`pi`、`qwen`

## 必需配置

核心 ACP 基础配置：

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: ["claude", "codex", "copilot", "cursor", "gemini", "openclaw", "opencode", "pi"],
    maxConcurrentSessions: 8,
  },
}
```

## 插件设置（acpx 后端）

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

验证后端健康状态：

```text
/acp doctor
```

## 权限配置

### `permissionMode`

| 值              | 行为                                       |
| --------------- | ------------------------------------------ |
| `approve-all`   | 自动批准所有文件写入和 shell 命令。        |
| `approve-reads` | 仅自动批准读取；写入和 exec 需要提示。     |
| `deny-all`      | 拒绝所有权限提示。                         |

### `nonInteractivePermissions`

| 值     | 行为                                               |
| ------ | -------------------------------------------------- |
| `fail` | 以 `AcpRuntimeError` 中止 Session。**（默认）**    |
| `deny` | 静默拒绝权限并继续（优雅降级）。                   |

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

## 故障排查

| 症状                                                | 可能原因                               | 修复方法                                               |
| --------------------------------------------------- | -------------------------------------- | ------------------------------------------------------ |
| `ACP runtime backend is not configured`             | 后端插件缺失或禁用。                   | 安装并启用后端插件，然后运行 `/acp doctor`。           |
| `ACP is disabled by policy (acp.enabled=false)`     | ACP 全局禁用。                         | 设置 `acp.enabled=true`。                              |
| `ACP agent "<id>" is not allowed by policy`         | 智能体不在允许列表中。                 | 使用允许的 `agentId` 或更新 `acp.allowedAgents`。      |
| `Unable to resolve session target: ...`             | Key/id/label 令牌错误。                | 运行 `/acp sessions`，复制精确的 key/label，重试。     |
| `Sandboxed sessions cannot spawn ACP sessions ...`  | ACP 运行时在宿主侧；请求者 Session 处于沙箱中。 | 从沙箱 Session 使用 `runtime="subagent"`。           |

更多详情参见 [配置参考](/gateway/configuration-reference)。
