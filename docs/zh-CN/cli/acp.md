---
read_when:
  - 设置基于 ACP 的 IDE 集成
  - 调试到 Gateway 网关的 ACP 会话路由
summary: 运行用于 IDE 集成的 ACP 桥接器
title: acp
x-i18n:
  generated_at: "2026-02-03T07:44:38Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 481ea9069fa32267bfdadfa9a6665ac7060bb777f6bd846c7556dcb6fcdf1bd8
  source_path: cli/acp.md
  workflow: 15
---

# acp

运行与 OpenClaw Gateway 网关通信的 [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 桥接器。

此命令通过 stdio 使用 ACP 协议与 IDE 通信，并通过 WebSocket 将提示转发到 Gateway 网关。它将 ACP 会话映射到 Gateway 网关会话键。

`openclaw acp` 是一个由 Gateway 网关驱动的 ACP 桥接器，而非完整的 ACP 原生编辑器运行时。它专注于会话路由、提示投递和基本流式更新。

如果你希望外部 MCP 客户端直接与 OpenClaw 渠道对话而不托管 ACP 会话，请改用 [`openclaw mcp serve`](/cli/mcp)。

## 兼容性矩阵

| ACP 领域                                                              | 状态        | 备注                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`、`newSession`、`prompt`、`cancel`                        | 已实现      | 通过 stdio 到 Gateway 网关 chat/send + abort 的核心桥接流程。                                                                                                                                                                                     |
| `listSessions`、斜杠命令                                               | 已实现      | 会话列表针对 Gateway 网关会话状态工作；命令通过 `available_commands_update` 发布。                                                                                                                                                               |
| `loadSession`                                                         | 部分支持    | 将 ACP 会话重新绑定到 Gateway 网关会话键，并重播存储的用户/助手文本历史记录。工具/系统历史记录尚未重建。                                                                                                                                        |
| 提示内容（`text`、嵌入 `resource`、图片）                             | 部分支持    | 文本/资源被扁平化为聊天输入；图片成为 Gateway 网关附件。                                                                                                                                                                                         |
| 会话模式                                                              | 部分支持    | 支持 `session/set_mode`，桥接器公开初始的由 Gateway 网关驱动的会话控制，用于调节思考级别、工具详细程度、推理、使用详情和提升操作。更广泛的 ACP 原生模式/配置界面仍不在范围内。                                                                  |
| 会话信息和使用量更新                                                  | 部分支持    | 桥接器从缓存的 Gateway 网关会话快照发出 `session_info_update` 和尽力而为的 `usage_update` 通知。使用量是近似值，仅在 Gateway 网关将令牌总量标记为最新时才发送。                                                                                  |
| 工具流式传输                                                          | 部分支持    | `tool_call` / `tool_call_update` 事件包含原始 I/O、文本内容，以及在 Gateway 网关工具参数/结果中出现时尽力而为的文件位置。嵌入终端和更丰富的差异原生输出尚未公开。                                                                              |
| 每会话 MCP 服务器（`mcpServers`）                                     | 不支持      | 桥接器模式拒绝每会话 MCP 服务器请求。请在 OpenClaw gateway 或 agent 上配置 MCP。                                                                                                                                                                 |
| 客户端文件系统方法（`fs/read_text_file`、`fs/write_text_file`）       | 不支持      | 桥接器不调用 ACP 客户端文件系统方法。                                                                                                                                                                                                            |
| 客户端终端方法（`terminal/*`）                                        | 不支持      | 桥接器不创建 ACP 客户端终端，也不通过工具调用流式传输终端 id。                                                                                                                                                                                   |
| 会话计划 / 思考流式传输                                               | 不支持      | 桥接器目前发出输出文本和工具状态，而不是 ACP 计划或思考更新。                                                                                                                                                                                    |

## 已知限制

- `loadSession` 重播存储的用户和助手文本历史记录，但不重建历史工具调用、系统通知或更丰富的 ACP 原生事件类型。
- 如果多个 ACP 客户端共享同一 Gateway 网关会话键，事件和取消路由是尽力而为的，而非严格按客户端隔离。当你需要干净的编辑器本地轮次时，建议使用默认隔离的 `acp:<uuid>` 会话。
- Gateway 网关停止状态被转换为 ACP 停止原因，但该映射不如完整的 ACP 原生运行时丰富。
- 初始会话控制目前公开了 Gateway 网关旋钮的一个集中子集：思考级别、工具详细程度、推理、使用详情和提升操作。模型选择和执行主机控制尚未作为 ACP 配置选项公开。
- `session_info_update` 和 `usage_update` 来自 Gateway 网关会话快照，而非实时 ACP 原生运行时统计。使用量是近似值，不含费用数据，仅在 Gateway 网关将令牌总量数据标记为最新时才发出。
- 工具跟进数据是尽力而为的。桥接器可以显示在已知工具参数/结果中出现的文件路径，但尚未发出 ACP 终端或结构化文件差异。

## 用法

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## ACP 客户端（调试）

使用内置 ACP 客户端在没有 IDE 的情况下检查桥接器是否正常工作。
它会启动 ACP 桥接器并让你交互式输入提示。

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

权限模型（客户端调试模式）：

- 自动批准基于允许列表，仅适用于受信任的核心工具 ID。
- `read` 自动批准的范围限定在当前工作目录（设置了 `--cwd` 时使用该目录）。
- 未知/非核心工具名称、范围外读取和危险工具始终需要明确的提示批准。
- 服务器提供的 `toolCall.kind` 被视为不受信任的元数据（不是授权来源）。

## 如何使用

当 IDE（或其他客户端）使用 Agent Client Protocol 并且你希望它驱动 OpenClaw Gateway 网关会话时，请使用 ACP。

1. 确保 Gateway 网关正在运行（本地或远程）。
2. 配置 Gateway 网关目标（配置或标志）。
3. 将你的 IDE 配置为通过 stdio 运行 `openclaw acp`。

示例配置（持久化）：

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

示例直接运行（不写入配置）：

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# 优先用于本地进程安全
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## 选择智能体

ACP 不直接选择智能体。它通过 Gateway 网关会话键进行路由。

使用智能体作用域的会话键来定位特定智能体：

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

每个 ACP 会话映射到单个 Gateway 网关会话键。一个智能体可以有多个会话；除非你覆盖键或标签，否则 ACP 默认使用隔离的 `acp:<uuid>` 会话。

桥接器模式不支持每会话 `mcpServers`。如果 ACP 客户端在 `newSession` 或 `loadSession` 期间发送这些内容，桥接器会返回明确错误，而不是静默忽略。

如果你希望 ACPX 驱动的会话能够看到 OpenClaw 插件工具，请启用 gateway 端的 ACPX 插件桥接器，而不是尝试传递每会话 `mcpServers`。参见 [ACP Agents](/tools/acp-agents#plugin-tools-mcp-bridge)。

## 从 `acpx` 使用（Codex、Claude 及其他 ACP 客户端）

如果你希望 Codex 或 Claude Code 等编码智能体通过 ACP 与你的 OpenClaw 机器人通信，请使用带有内置 `openclaw` 目标的 `acpx`。

典型流程：

1. 运行 Gateway 网关，确保 ACP 桥接器可以访问它。
2. 将 `acpx openclaw` 指向 `openclaw acp`。
3. 指定你希望编码智能体使用的 OpenClaw 会话键。

示例：

```bash
# 一次性请求到你的默认 OpenClaw ACP 会话
acpx openclaw exec "Summarize the active OpenClaw session state."

# 用于后续轮次的持久命名会话
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

如果你希望 `acpx openclaw` 每次都定位到特定 Gateway 网关和会话键，请在 `~/.acpx/config.json` 中覆盖 `openclaw` 智能体命令：

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

对于仓库本地的 OpenClaw checkout，使用直接 CLI 入口点而不是开发运行器，以保持 ACP 流干净。例如：

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

这是让 Codex、Claude Code 或其他支持 ACP 的客户端从 OpenClaw 智能体拉取上下文信息而无需抓取终端的最简单方式。

## Zed 编辑器设置

在 `~/.config/zed/settings.json` 中添加自定义 ACP 智能体（或使用 Zed 的设置界面）：

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

要定位特定的 Gateway 网关或智能体：

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

在 Zed 中，打开 Agent 面板并选择"OpenClaw ACP"来开始一个会话。

## 会话映射

默认情况下，ACP 会话获得一个带有 `acp:` 前缀的隔离 Gateway 网关会话键。
要重用已知会话，请传递会话键或标签：

- `--session <key>`：使用特定的 Gateway 网关会话键。
- `--session-label <label>`：通过标签解析现有会话。
- `--reset-session`：为该键生成新的会话 ID（相同键，新对话记录）。

如果你的 ACP 客户端支持元数据，你可以按会话覆盖：

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

在 [/concepts/session](/concepts/session) 了解更多关于会话键的信息。

## 选项

- `--url <url>`：Gateway 网关 WebSocket URL（配置后默认为 gateway.remote.url）。
- `--token <token>`：Gateway 网关认证令牌。
- `--token-file <path>`：从文件读取 Gateway 网关认证令牌。
- `--password <password>`：Gateway 网关认证密码。
- `--password-file <path>`：从文件读取 Gateway 网关认证密码。
- `--session <key>`：默认会话键。
- `--session-label <label>`：要解析的默认会话标签。
- `--require-existing`：如果会话键/标签不存在则失败。
- `--reset-session`：在首次使用前重置会话键。
- `--no-prefix-cwd`：不在提示前添加工作目录前缀。
- `--verbose, -v`：向 stderr 输出详细日志。

安全注意事项：

- `--token` 和 `--password` 在某些系统的本地进程列表中可能可见。
- 建议使用 `--token-file`/`--password-file` 或环境变量（`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`）。
- Gateway 网关认证解析遵循其他 Gateway 网关客户端使用的共享约定：
  - 本地模式：env（`OPENCLAW_GATEWAY_*`）-> `gateway.auth.*` -> 仅在 `gateway.auth.*` 未设置时回退到 `gateway.remote.*`（已配置但未解析的本地 SecretRef 失败关闭）
  - 远程模式：按远程优先级规则回退的 `gateway.remote.*`（含 env/config）
  - `--url` 是覆盖安全的，不重用隐式配置/env 凭证；请传递明确的 `--token`/`--password`（或文件变体）
- ACP 运行时后端子进程接收 `OPENCLAW_SHELL=acp`，可用于上下文相关的 shell/profile 规则。
- `openclaw acp client` 在生成的桥接器进程上设置 `OPENCLAW_SHELL=acp-client`。

### `acp client` 选项

- `--cwd <dir>`：ACP 会话的工作目录。
- `--server <command>`：ACP 服务器命令（默认：`openclaw`）。
- `--server-args <args...>`：传递给 ACP 服务器的额外参数。
- `--server-verbose`：启用 ACP 服务器的详细日志。
- `--verbose, -v`：详细客户端日志。
