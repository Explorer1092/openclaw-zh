---
summary: "运行 ACP 桥接以支持 IDE 集成"
read_when:
  - 设置基于 ACP 的 IDE 集成
  - 调试 ACP Session 路由到 Gateway
title: "ACP"
---

运行与 OpenClaw Gateway 通信的 [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 桥接。

此命令通过 stdio 与 IDE 进行 ACP 通信，并通过 WebSocket 将提示转发到 Gateway。它将 ACP Session 映射到 Gateway Session 密钥。

`openclaw acp` 是一个由 Gateway 支持的 ACP 桥接，而非完整的 ACP 原生编辑器运行时。它专注于 Session 路由、提示传递和基本流式更新。

如果您希望外部 MCP 客户端直接与 OpenClaw Channel 会话通信，而不是托管 ACP 运行环境 Session，请改用 [`openclaw mcp serve`](/cli/mcp)。

## 这不是什么

本页经常与 ACP 运行环境 Session 混淆。

`openclaw acp` 的含义是：

- OpenClaw 充当 ACP 服务器
- IDE 或 ACP 客户端连接到 OpenClaw
- OpenClaw 将该工作转发到 Gateway Session

这与 [ACP Agents](/tools/acp-agents) 不同，在那里 OpenClaw 通过 `acpx` 运行外部运行环境（如 Codex 或 Claude Code）。

快速规则：

- 编辑器/客户端想以 ACP 方式与 OpenClaw 通信：使用 `openclaw acp`
- OpenClaw 应将 Codex/Claude/Gemini 作为 ACP 运行环境启动：使用 `/acp spawn` 和 [ACP Agents](/tools/acp-agents)

## 兼容性矩阵

| ACP 区域                                                              | 状态      | 备注                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 已实现 | 通过 stdio 到 Gateway chat/send + abort 的核心桥接流程。                                                                                                                                                                                        |
| `listSessions`，Slash 命令                                            | 已实现 | Session 列表针对 Gateway Session 状态运行，具有有界光标分页和 `cwd` 过滤（当 Gateway Session 行携带工作区元数据时）；命令通过 `available_commands_update` 进行通告。                                                                             |
| `resumeSession`, `closeSession`                                       | 已实现 | Resume 将 ACP Session 重新绑定到现有 Gateway Session，而不重放历史记录。Close 取消活跃的桥接工作，将待处理的提示解析为已取消，并释放桥接 Session 状态。                                                                                         |
| `loadSession`                                                         | 部分实现     | 将 ACP Session 重新绑定到 Gateway Session 密钥，并重放桥接创建的 Session 的 ACP 事件账本历史记录。较旧的/无账本的 Session 回退到存储的用户/助手文本。                                                                                           |
| 提示内容（`text`、嵌入的 `resource`、图像）                           | 部分实现     | 文本/资源被展平为聊天输入；图像成为 Gateway 附件。                                                                                                                                                                                              |
| Session 模式                                                          | 部分实现     | `session/set_mode` 受支持，桥接为思考级别、工具详细程度、推理、使用详情和提升操作提供初始 Gateway 支持的 Session 控制。更广泛的 ACP 原生模式/配置界面仍超出范围。                                                                               |
| Session 信息和使用更新                                                | 部分实现     | 桥接从缓存的 Gateway Session 快照发出 `session_info_update` 和尽力而为的 `usage_update` 通知。使用量是近似值，仅在 Gateway 将总 Token 数据标记为新鲜时才发送。                                                                                   |
| 工具流式传输                                                          | 部分实现     | `tool_call` / `tool_call_update` 事件包含原始 I/O、文本内容，以及当 Gateway 工具参数/结果暴露时的尽力而为的文件位置。嵌入式终端和更丰富的差异原生输出仍未暴露。                                                                                  |
| 执行审批                                                              | 部分实现     | 活跃 ACP 提示轮次期间的 Gateway 执行审批提示通过 `session/request_permission` 中继到 ACP 客户端。                                                                                                                                               |
| 每 Session 的 MCP 服务器（`mcpServers`）                              | 不支持 | 桥接模式拒绝每 Session 的 MCP 服务器请求。请在 OpenClaw Gateway 或 Agent 上配置 MCP。                                                                                                                                                           |
| 客户端文件系统方法（`fs/read_text_file`, `fs/write_text_file`）       | 不支持 | 桥接不调用 ACP 客户端文件系统方法。                                                                                                                                                                                                             |
| 客户端终端方法（`terminal/*`）                                        | 不支持 | 桥接不创建 ACP 客户端终端，也不通过工具调用流式传输终端 ID。                                                                                                                                                                                    |
| Session 计划/思考流式传输                                             | 不支持 | 桥接当前发出输出文本和工具状态，而不是 ACP 计划或思考更新。                                                                                                                                                                                     |

## 已知限制

- `loadSession` 只能重放桥接创建的 Session 的完整 ACP 事件账本历史记录。较旧的/无账本的 Session 仍使用转录回退，不重建历史工具调用或系统通知。
- 如果多个 ACP 客户端共享同一 Gateway Session 密钥，事件和取消路由是尽力而为的，而不是严格按每个客户端隔离的。当您需要干净的编辑器本地轮次时，建议使用默认的隔离 `acp:<uuid>` Session。
- Gateway 停止状态被转换为 ACP 停止原因，但该映射不如完全 ACP 原生运行时表达力强。
- 初始 Session 控制当前只暴露 Gateway 旋钮的一个聚焦子集：思考级别、工具详细程度、推理、使用详情和提升操作。模型选择和执行主机控制尚未作为 ACP 配置选项暴露。
- `session_info_update` 和 `usage_update` 来源于 Gateway Session 快照，而非实时 ACP 原生运行时会计。使用量是近似值，不含成本数据，仅在 Gateway 将总 Token 数据标记为新鲜时才发送。
- 工具跟进数据是尽力而为的。桥接可以在已知工具参数/结果中显示文件路径，但尚未发出 ACP 终端或结构化文件差异。
- 执行审批中继范围仅限于活跃的 ACP 提示轮次；来自其他 Gateway Session 的审批会被忽略。

## 用法

```bash
openclaw acp

# 远程 Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# 远程 Gateway（从文件读取 token）
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 附加到现有 Session 密钥
openclaw acp --session agent:main:main

# 通过标签附加（必须已存在）
openclaw acp --session-label "support inbox"

# 首次提示前重置 Session 密钥
openclaw acp --session agent:main:main --reset-session
```

## ACP 客户端（调试）

使用内置 ACP 客户端在不使用 IDE 的情况下对桥接进行完整性检查。
它会生成 ACP 桥接并允许您以交互方式输入提示。

```bash
openclaw acp client

# 将生成的桥接指向远程 Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 覆盖服务器命令（默认：openclaw）
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

权限模型（客户端调试模式）：

- 自动审批基于允许列表，仅适用于受信任的核心工具 ID。
- `read` 自动审批限定在当前工作目录（设置时为 `--cwd`）。
- ACP 仅自动审批狭义的只读类别：活跃 cwd 下的受限 `read` 调用以及只读搜索工具（`search`、`web_search`、`memory_search`）。未知/非核心工具、超出范围的读取、具有执行能力的工具、控制平面工具、修改工具和交互式流程始终需要明确的提示审批。
- 服务器提供的 `toolCall.kind` 被视为不受信任的元数据（不作为授权来源）。
- 此 ACP 桥接策略与 ACPX 运行环境权限分开。如果您通过 `acpx` 后端运行 OpenClaw，`plugins.entries.acpx.config.permissionMode=approve-all` 是该运行环境 Session 的紧急"yolo"开关。

## 协议冒烟测试

对于协议级别的调试，请使用隔离状态启动 Gateway，并使用 ACP JSON-RPC 客户端通过 stdio 驱动 `openclaw acp`。覆盖 `initialize`、`session/new`、带绝对 `cwd` 的 `session/list`、`session/resume`、`session/close`、重复关闭和缺失恢复。

证明应包括通告的生命周期能力、一个由 Gateway 支持的 Session 行、更新通知以及 Gateway `sessions.list` 日志：

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

避免仅使用 `openclaw gateway call sessions.list` 作为唯一的 ACP 证明。该 CLI 路径可能请求新鲜 Token 操作员范围升级；ACP 桥接的正确性通过 ACP stdio 帧加上 Gateway `sessions.list` 日志来证明。

## 如何使用

当 IDE（或其他客户端）使用 Agent Client Protocol 并且您希望它驱动 OpenClaw Gateway Session 时，使用 ACP。

1. 确保 Gateway 正在运行（本地或远程）。
2. 配置 Gateway 目标（配置或标志）。
3. 将您的 IDE 配置为通过 stdio 运行 `openclaw acp`。

示例配置（持久化）：

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

示例直接运行（不写入配置）：

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# 建议用于本地进程安全
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## 选择 Agent

ACP 不直接选择 Agent。它通过 Gateway Session 密钥进行路由。

使用 Agent 范围的 Session 密钥来定位特定 Agent：

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

每个 ACP Session 映射到单个 Gateway Session 密钥。一个 Agent 可以有多个 Session；ACP 默认使用隔离的 `acp:<uuid>` Session，除非您覆盖密钥或标签。

桥接模式不支持每 Session 的 `mcpServers`。如果 ACP 客户端在 `newSession` 或 `loadSession` 期间发送它们，桥接会返回明确的错误，而不是静默忽略。

如果您希望 ACPX 支持的 Session 能看到 OpenClaw Plugin 工具或选定的内置工具（如 `cron`），请在 Gateway 侧启用 ACPX MCP 桥接，而不是尝试传递每 Session 的 `mcpServers`。请参阅 [ACP Agents](/tools/acp-agents-setup#plugin-tools-mcp-bridge) 和 [OpenClaw 工具 MCP 桥接](/tools/acp-agents-setup#openclaw-tools-mcp-bridge)。

## 从 `acpx` 使用（Codex、Claude 及其他 ACP 客户端）

如果您希望 Codex 或 Claude Code 等编码 Agent 通过 ACP 与您的 OpenClaw 机器人通信，请将 `acpx` 与其内置的 `openclaw` 目标配合使用。

典型流程：

1. 运行 Gateway 并确保 ACP 桥接可以访问它。
2. 将 `acpx openclaw` 指向 `openclaw acp`。
3. 以编码 Agent 使用的 OpenClaw Session 密钥为目标。

示例：

```bash
# 一次性请求进入您的默认 OpenClaw ACP Session
acpx openclaw exec "Summarize the active OpenClaw session state."

# 用于后续轮次的持久命名 Session
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

如果您希望 `acpx openclaw` 每次都定位到特定的 Gateway 和 Session 密钥，请在 `~/.acpx/config.json` 中覆盖 `openclaw` Agent 命令：

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

对于本地仓库的 OpenClaw 检出，请使用直接 CLI 入口点而不是开发运行器，以保持 ACP 流的干净。例如：

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

这是让 Codex、Claude Code 或其他支持 ACP 的客户端从 OpenClaw Agent 提取上下文信息的最简单方法，无需抓取终端。

## Zed 编辑器设置

在 `~/.config/zed/settings.json` 中添加自定义 ACP Agent（或使用 Zed 的设置 UI）：

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

要定位到特定的 Gateway 或 Agent：

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

在 Zed 中，打开 Agent 面板并选择"OpenClaw ACP"以开始一个线程。

## Session 映射

默认情况下，ACP Session 获得带 `acp:` 前缀的隔离 Gateway Session 密钥。要重用已知 Session，请传递 Session 密钥或标签：

- `--session <key>`：使用特定的 Gateway Session 密钥。
- `--session-label <label>`：通过标签解析现有 Session。
- `--reset-session`：为该密钥铸造新的 Session ID（相同密钥，新转录）。

如果您的 ACP 客户端支持元数据，可以每 Session 覆盖：

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

了解更多关于 Session 密钥的信息：[/concepts/session](/concepts/session)。

## 选项

- `--url <url>`：Gateway WebSocket URL（配置时默认为 gateway.remote.url）。
- `--token <token>`：Gateway 身份验证 Token。
- `--token-file <path>`：从文件读取 Gateway 身份验证 Token。
- `--password <password>`：Gateway 身份验证密码。
- `--password-file <path>`：从文件读取 Gateway 身份验证密码。
- `--session <key>`：默认 Session 密钥。
- `--session-label <label>`：要解析的默认 Session 标签。
- `--require-existing`：如果 Session 密钥/标签不存在则失败。
- `--reset-session`：首次使用前重置 Session 密钥。
- `--no-prefix-cwd`：不在提示前添加工作目录前缀。
- `--provenance <off|meta|meta+receipt>`：包含 ACP 出处元数据或收据。
- `--verbose, -v`：向 stderr 输出详细日志。

安全说明：

- `--token` 和 `--password` 在某些系统上可能在本地进程列表中可见。
- 建议使用 `--token-file`/`--password-file` 或环境变量（`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`）。
- Gateway 身份验证解析遵循其他 Gateway 客户端使用的共享契约：
  - 本地模式：env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> 仅在 `gateway.auth.*` 未设置时回退到 `gateway.remote.*`（已配置但未解析的本地 SecretRef 失败关闭）
  - 远程模式：`gateway.remote.*` 按远程优先级规则进行 env/配置回退
  - `--url` 是覆盖安全的，不会重用隐式配置/env 凭据；请传递显式的 `--token`/`--password`（或文件变体）
- ACP 运行时后端子进程接收 `OPENCLAW_SHELL=acp`，可用于上下文特定的 Shell/配置文件规则。
- `openclaw acp client` 在生成的桥接进程上设置 `OPENCLAW_SHELL=acp-client`。

### `acp client` 选项

- `--cwd <dir>`：ACP Session 的工作目录。
- `--server <command>`：ACP 服务器命令（默认：`openclaw`）。
- `--server-args <args...>`：传递给 ACP 服务器的额外参数。
- `--server-verbose`：在 ACP 服务器上启用详细日志。
- `--verbose, -v`：详细客户端日志。

## 相关

- [CLI 参考](/cli)
- [ACP Agents](/tools/acp-agents)
