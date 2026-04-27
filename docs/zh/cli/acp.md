---
mmh3_hash: "9c632b641b45996b75bc52d5b726a725"
title: "acp"
summary: "运行 ACP 桥接以支持 IDE 集成"
read_when:
  - 设置基于 ACP 的 IDE 集成
  - 调试 ACP Session 路由到 Gateway
---

# acp

运行与 OpenClaw Gateway 通信的 [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 桥接。

此命令通过 stdio 与 IDE 进行 ACP 通信,并通过 WebSocket 将提示转发到 Gateway。它将 ACP Session 映射到 Gateway Session 密钥。

`openclaw acp` 是一个由 Gateway 支持的 ACP 桥接,而非完整的 ACP 原生编辑器运行时。它专注于 Session 路由、提示传递和基本流式更新。

如果您希望外部 MCP 客户端直接与 OpenClaw Channel 会话通信,而不是托管 ACP 运行环境 Session,请改用 [`openclaw mcp serve`](/cli/mcp)。

## 这不是什么

本页经常与 ACP 运行环境 Session 混淆。

`openclaw acp` 的含义是:

- OpenClaw 充当 ACP 服务器
- IDE 或 ACP 客户端连接到 OpenClaw
- OpenClaw 将该工作转发到 Gateway Session

这与 [ACP Agents](/tools/acp-agents) 不同,在那里 OpenClaw 通过 `acpx` 运行外部运行环境(如 Codex 或 Claude Code)。

快速规则:

- 编辑器/客户端想与 OpenClaw 进行 ACP 通信:使用 `openclaw acp`
- OpenClaw 应将 Codex/Claude/Gemini 作为 ACP 运行环境启动:使用 `/acp spawn` 和 [ACP Agents](/tools/acp-agents)

## 兼容性矩阵

| ACP 功能区域                                                          | 状态       | 说明                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`、`newSession`、`prompt`、`cancel`                        | 已实现     | 通过 stdio 到 Gateway chat/send + abort 的核心桥接流程。                                                                                                                                                                                             |
| `listSessions`、斜杠命令                                              | 已实现     | Session 列表针对 Gateway Session 状态工作;命令通过 `available_commands_update` 进行通告。                                                                                                                                                           |
| `loadSession`                                                         | 部分实现   | 将 ACP Session 重新绑定到 Gateway Session 密钥,并重播已存储的用户/助手文本历史。工具/系统历史尚未重建。                                                                                                                                             |
| 提示内容(`text`、嵌入的 `resource`、图像)                            | 部分实现   | 文本/资源被平铺为聊天输入;图像成为 Gateway 附件。                                                                                                                                                                                                   |
| Session 模式                                                          | 部分实现   | 支持 `session/set_mode`,桥接为思考级别、工具详细程度、推理、使用详情和提升操作提供初始 Gateway 支持的 Session 控制。更广泛的 ACP 原生模式/配置界面仍在范围外。                                                                                      |
| Session 信息和使用更新                                                | 部分实现   | 桥接从缓存的 Gateway Session 快照发出 `session_info_update` 和尽力而为的 `usage_update` 通知。使用是近似值,仅在 Gateway 将总令牌数据标记为最新时才发送。                                                                                             |
| 工具流式传输                                                          | 部分实现   | `tool_call` / `tool_call_update` 事件包含原始 I/O、文本内容以及当 Gateway 工具参数/结果暴露时的尽力而为的文件位置。嵌入式终端和更丰富的 diff 原生输出仍未暴露。                                                                                     |
| 每 Session MCP 服务器(`mcpServers`)                                  | 不支持     | 桥接模式拒绝每 Session MCP 服务器请求。请在 OpenClaw Gateway 或 Agent 上配置 MCP。                                                                                                                                                                   |
| 客户端文件系统方法(`fs/read_text_file`、`fs/write_text_file`)       | 不支持     | 桥接不调用 ACP 客户端文件系统方法。                                                                                                                                                                                                                  |
| 客户端终端方法(`terminal/*`)                                          | 不支持     | 桥接不创建 ACP 客户端终端或通过工具调用流式传输终端 ID。                                                                                                                                                                                             |
| Session 计划/思考流式传输                                             | 不支持     | 桥接目前发出输出文本和工具状态,而非 ACP 计划或思考更新。                                                                                                                                                                                            |

## 已知限制

- `loadSession` 重播已存储的用户和助手文本历史,但不重建历史工具调用、系统通知或更丰富的 ACP 原生事件类型。
- 如果多个 ACP 客户端共享同一个 Gateway Session 密钥,事件和取消路由是尽力而为的,而非严格按每个客户端隔离。当您需要干净的编辑器本地轮次时,请优先使用默认的隔离 `acp:<uuid>` Session。
- Gateway 停止状态被转换为 ACP 停止原因,但该映射不如完全 ACP 原生运行时那么丰富。
- 初始 Session 控制目前仅暴露 Gateway 旋钮的一个子集:思考级别、工具详细程度、推理、使用详情和提升操作。模型选择和执行主机控制尚未作为 ACP 配置选项暴露。
- `session_info_update` 和 `usage_update` 来自 Gateway Session 快照,而非实时 ACP 原生运行时计账。使用是近似值,不含成本数据,仅在 Gateway 将总令牌数据标记为最新时才发出。
- 工具跟进数据是尽力而为的。桥接可以暴露出现在已知工具参数/结果中的文件路径,但尚未发出 ACP 终端或结构化文件差异。

## 用法

```bash
openclaw acp

# 远程 Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# 远程 Gateway(从文件读取令牌)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 附加到现有 Session 密钥
openclaw acp --session agent:main:main

# 按标签附加(必须已存在)
openclaw acp --session-label "support inbox"

# 在第一次提示之前重置 Session 密钥
openclaw acp --session agent:main:main --reset-session
```

## ACP 客户端(调试)

使用内置的 ACP 客户端在不使用 IDE 的情况下对桥接进行健全性检查。
它会生成 ACP 桥接并允许您交互式地输入提示。

```bash
openclaw acp client

# 将生成的桥接指向远程 Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 覆盖服务器命令(默认:openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

权限模型(客户端调试模式):

- 自动批准基于允许列表,仅适用于受信任的核心工具 ID。
- `read` 自动批准的范围限定于当前工作目录(设置了 `--cwd` 时)。
- ACP 仅自动批准窄范围的只读类操作:活动工作目录下的范围 `read` 调用,以及只读搜索工具(`search`、`web_search`、`memory_search`)。未知/非核心工具、超出范围的读取操作、具有执行能力的工具、控制平面工具、变更性工具和交互式流程始终需要明确的提示批准。
- 服务器提供的 `toolCall.kind` 被视为不受信任的元数据(不是授权来源)。
- 此 ACP 桥接策略与 ACPX 运行环境权限分开。如果通过 `acpx` 后端运行 OpenClaw,`plugins.entries.acpx.config.permissionMode=approve-all` 是该运行环境 Session 的紧急"全允许"开关。

## 如何使用

当 IDE(或其他客户端)使用 Agent Client Protocol 并且您希望它驱动 OpenClaw Gateway Session 时,请使用 ACP。

1. 确保 Gateway 正在运行(本地或远程)。
2. 配置 Gateway 目标(配置或标志)。
3. 将您的 IDE 配置为通过 stdio 运行 `openclaw acp`。

配置示例(持久化):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

直接运行示例(不写入配置):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# 对于本地进程安全性,首选此方式
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## 选择 Agent

ACP 不直接选择 Agent。它通过 Gateway Session 密钥进行路由。

使用 Agent 范围的 Session 密钥来定位特定 Agent:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

每个 ACP Session 映射到单个 Gateway Session 密钥。一个 Agent 可以有多个 Session;除非您覆盖密钥或标签,否则 ACP 默认为隔离的 `acp:<uuid>` Session。

每 Session 的 `mcpServers` 在桥接模式下不受支持。如果 ACP 客户端在 `newSession` 或 `loadSession` 期间发送它们,桥接会返回明确的错误而非静默忽略。

如果您希望 ACPX 支持的 Session 能够使用 OpenClaw 插件工具或所选内置工具(如 `cron`),请启用 Gateway 侧的 ACPX MCP 桥接,而不是尝试传递每 Session 的 `mcpServers`。参见 [ACP Agents](/tools/acp-agents-setup#plugin-tools-mcp-bridge) 和 [OpenClaw tools MCP bridge](/tools/acp-agents-setup#openclaw-tools-mcp-bridge)。

## 从 `acpx` 使用(Codex、Claude 及其他 ACP 客户端)

如果您希望 Codex 或 Claude Code 等编码 Agent 通过 ACP 与您的 OpenClaw 机器人通信,请使用 `acpx` 及其内置的 `openclaw` 目标。

典型流程:

1. 运行 Gateway,确保 ACP 桥接可以访问它。
2. 将 `acpx openclaw` 指向 `openclaw acp`。
3. 指定您希望编码 Agent 使用的 OpenClaw Session 密钥。

示例:

```bash
# 向您的默认 OpenClaw ACP Session 发送一次性请求
acpx openclaw exec "Summarize the active OpenClaw session state."

# 使用持久命名 Session 进行后续对话
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

如果您希望 `acpx openclaw` 每次都指向特定 Gateway 和 Session 密钥,请在 `~/.acpx/config.json` 中覆盖 `openclaw` Agent 命令:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

对于本地 OpenClaw 仓库,请使用直接 CLI 入口点而非开发运行器,以保持 ACP 流的干净。例如:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

这是让 Codex、Claude Code 或其他支持 ACP 的客户端从 OpenClaw Agent 获取上下文信息的最简方式,无需抓取终端输出。

## Zed 编辑器设置

在 `~/.config/zed/settings.json` 中添加自定义 ACP 代理(或使用 Zed 的设置 UI):

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

要定位特定 Gateway 或 Agent:

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

在 Zed 中,打开 Agent 面板并选择"OpenClaw ACP"以启动线程。

## Session 映射

默认情况下,ACP Session 获得一个带有 `acp:` 前缀的隔离 Gateway Session 密钥。
要重用已知 Session,请传递 Session 密钥或标签:

- `--session <key>`:使用特定的 Gateway Session 密钥。
- `--session-label <label>`:通过标签解析现有 Session。
- `--reset-session`:为该密钥生成新的 Session ID(相同密钥,新记录)。

如果您的 ACP 客户端支持元数据,您可以覆盖每个 Session:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

在 [/concepts/session](/concepts/session) 了解有关 Session 密钥的更多信息。

## 选项

- `--url <url>`:Gateway WebSocket URL(配置时默认为 gateway.remote.url)。
- `--token <token>`:Gateway 身份验证令牌。
- `--token-file <path>`:从文件读取 Gateway 身份验证令牌。
- `--password <password>`:Gateway 身份验证密码。
- `--password-file <path>`:从文件读取 Gateway 身份验证密码。
- `--session <key>`:默认 Session 密钥。
- `--session-label <label>`:要解析的默认 Session 标签。
- `--require-existing`:如果 Session 密钥/标签不存在则失败。
- `--reset-session`:在首次使用前重置 Session 密钥。
- `--no-prefix-cwd`:不在提示前添加工作目录前缀。
- `--provenance <off|meta|meta+receipt>`:包含 ACP 出处元数据或收据。
- `--verbose, -v`:详细日志输出到 stderr。

安全说明:

- `--token` 和 `--password` 在某些系统上可能在本地进程列表中可见。
- 首选 `--token-file`/`--password-file` 或环境变量(`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`)。
- Gateway 身份验证解析遵循其他 Gateway 客户端使用的共享约定:
  - 本地模式:环境变量 (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> 当 `gateway.auth.*` 未设置时回退到 `gateway.remote.*`(已配置但未解析的本地 SecretRef 失败关闭)
  - 远程模式:`gateway.remote.*` 带有按远程优先规则的环境变量/配置回退
  - `--url` 是覆盖安全的,不重用隐式配置/环境变量凭据;请传递显式 `--token`/`--password`(或文件变体)
- ACP 运行时后端子进程接收 `OPENCLAW_SHELL=acp`,可用于特定于上下文的 shell/配置规则。
- `openclaw acp client` 在生成的桥接进程上设置 `OPENCLAW_SHELL=acp-client`。

### `acp client` 选项

- `--cwd <dir>`:ACP Session 的工作目录。
- `--server <command>`:ACP 服务器命令(默认:`openclaw`)。
- `--server-args <args...>`:传递给 ACP 服务器的额外参数。
- `--server-verbose`:在 ACP 服务器上启用详细日志。
- `--verbose, -v`:详细客户端日志。

## 相关

- [CLI 参考](/cli)
- [ACP agents](/tools/acp-agents)
