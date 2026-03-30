---
mmh3_hash: "1a1aae314243ecbcd150dd9ffe4917d8"
summary: "通过 MCP 开放 OpenClaw Channel 对话，并管理已保存的 MCP 服务器定义"
read_when:
  - 将 Codex、Claude Code 或其他 MCP 客户端连接到 OpenClaw 支持的 Channel
  - 运行 `openclaw mcp serve`
  - 管理 OpenClaw 保存的 MCP 服务器定义
title: "mcp"
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: placeholder
  source_path: "cli/mcp.md"
  workflow: 15
---

# mcp

`openclaw mcp` 有两个功能：

- 使用 `openclaw mcp serve` 将 OpenClaw 作为 MCP 服务器运行
- 使用 `list`、`show`、`set` 和 `unset` 管理 OpenClaw 拥有的出站 MCP 服务器定义

换句话说：

- `serve` 是 OpenClaw 作为 MCP 服务器运行
- `list` / `show` / `set` / `unset` 是 OpenClaw 作为其运行时可能稍后使用的其他 MCP 服务器的 MCP 客户端注册表

当 OpenClaw 应该自己托管编码 Harness Session 并通过 ACP 路由该运行时，请使用 [`openclaw acp`](/cli/acp)。

## OpenClaw 作为 MCP 服务器

这是 `openclaw mcp serve` 路径。

## 何时使用 `serve`

在以下情况使用 `openclaw mcp serve`：

- Codex、Claude Code 或其他 MCP 客户端应直接与 OpenClaw 支持的 Channel 对话
- 您已有带路由 Session 的本地或远程 OpenClaw Gateway
- 您希望一个 MCP 服务器跨 OpenClaw 的 Channel 后端工作，而不是运行独立的每 Channel 桥接

当 OpenClaw 应该自己托管编码运行时并将 Agent Session 保留在 OpenClaw 内时，改用 [`openclaw acp`](/cli/acp)。

## 工作原理

`openclaw mcp serve` 启动一个 stdio MCP 服务器。MCP 客户端拥有该进程。当客户端保持 stdio Session 打开时，桥接通过 WebSocket 连接到本地或远程 OpenClaw Gateway，并通过 MCP 开放路由的 Channel 对话。

生命周期：

1. MCP 客户端生成 `openclaw mcp serve`
2. 桥接连接到 Gateway
3. 路由 Session 成为 MCP 对话和转录/历史工具
4. 桥接连接时，实时事件在内存中排队
5. 如果启用了 Claude Channel 模式，同一 Session 也可以接收 Claude 特定的推送通知

重要行为：

- 实时队列状态从桥接连接时开始
- 较旧的转录历史使用 `messages_read` 读取
- Claude 推送通知仅在 MCP Session 存活期间存在
- 当客户端断开连接时，桥接退出，实时队列消失

## 选择客户端模式

以两种不同方式使用同一桥接：

- 通用 MCP 客户端：仅标准 MCP 工具。使用 `conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send` 和审批工具。
- Claude Code：标准 MCP 工具加上 Claude 特定的 Channel 适配器。启用 `--claude-channel-mode on` 或保留默认值 `auto`。

目前，`auto` 行为与 `on` 相同。尚无客户端能力检测。

## `serve` 开放的内容

桥接使用现有的 Gateway Session 路由元数据来开放 Channel 支持的对话。当 OpenClaw 已有具有已知路由的 Session 状态时，对话才会出现，例如：

- `channel`
- 收件人或目标元数据
- 可选的 `accountId`
- 可选的 `threadId`

这给 MCP 客户端提供一个统一的地方来：

- 列出最近的路由对话
- 读取最近的转录历史
- 等待新的入站事件
- 通过同一路由发送回复
- 查看桥接连接时收到的审批请求

## 使用方法

```bash
# 本地 Gateway
openclaw mcp serve

# 远程 Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 使用密码认证的远程 Gateway
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# 启用详细桥接日志
openclaw mcp serve --verbose

# 禁用 Claude 特定的推送通知
openclaw mcp serve --claude-channel-mode off
```

## 桥接工具

当前桥接开放以下 MCP 工具：

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

列出 Gateway Session 状态中已有路由元数据的最近 Session 支持的对话。

有用的过滤器：

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

通过 `session_key` 返回单个对话。

### `messages_read`

读取一个 Session 支持对话的最近转录消息。

### `attachments_fetch`

从一条转录消息中提取非文本消息内容块。这是转录内容的元数据视图，不是独立的持久附件 Blob 存储。

### `events_poll`

从数字游标读取排队的实时事件。

### `events_wait`

长轮询直到下一个匹配的排队事件到达或超时。

当通用 MCP 客户端需要近实时投递而没有 Claude 特定推送协议时使用。

### `messages_send`

通过 Session 上已记录的同一路由发送文本。

当前行为：

- 需要现有的对话路由
- 使用 Session 的 Channel、收件人、账户 ID 和线程 ID
- 仅发送文本

### `permissions_list_open`

列出桥接自连接到 Gateway 以来观察到的待处理执行/Plugin 审批请求。

### `permissions_respond`

使用以下选项解决一个待处理的执行/Plugin 审批请求：

- `allow-once`
- `allow-always`
- `deny`

## 事件模型

桥接在连接时保持内存中的事件队列。

当前事件类型：

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

重要限制：

- 队列仅为实时；从 MCP 桥接启动时开始
- `events_poll` 和 `events_wait` 本身不重放较旧的 Gateway 历史
- 持久积压应使用 `messages_read` 读取

## Claude Channel 通知

桥接还可以开放 Claude 特定的 Channel 通知。这是 OpenClaw 等效的 Claude Code Channel 适配器：标准 MCP 工具仍然可用，但实时入站消息也可以作为 Claude 特定的 MCP 通知到达。

标志：

- `--claude-channel-mode off`：仅标准 MCP 工具
- `--claude-channel-mode on`：启用 Claude Channel 通知
- `--claude-channel-mode auto`：当前默认值；与 `on` 的桥接行为相同

当启用 Claude Channel 模式时，服务器宣告 Claude 实验性功能，并可以发出：

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

当前桥接行为：

- 入站 `user` 转录消息作为 `notifications/claude/channel` 转发
- 通过 MCP 接收的 Claude 权限请求在内存中跟踪
- 如果链接的对话稍后发送 `yes abcde` 或 `no abcde`，桥接将其转换为 `notifications/claude/channel/permission`
- 这些通知仅限于实时 Session；如果 MCP 客户端断开连接，则没有推送目标

这是有意针对特定客户端的。通用 MCP 客户端应依赖标准轮询工具。

## MCP 客户端配置

示例 stdio 客户端配置：

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

对于大多数通用 MCP 客户端，从标准工具界面开始，忽略 Claude 模式。仅对实际理解 Claude 特定通知方法的客户端启用 Claude 模式。

## 选项

`openclaw mcp serve` 支持：

- `--url <url>`：Gateway WebSocket URL
- `--token <token>`：Gateway 令牌
- `--token-file <path>`：从文件读取令牌
- `--password <password>`：Gateway 密码
- `--password-file <path>`：从文件读取密码
- `--claude-channel-mode <auto|on|off>`：Claude 通知模式
- `-v`、`--verbose`：详细日志输出到 stderr

尽可能使用 `--token-file` 或 `--password-file` 而非内联密钥。

## 安全和信任边界

桥接不会发明路由。它只开放 Gateway 已知如何路由的对话。

这意味着：

- 发件人允许列表、配对和 Channel 级信任仍然属于底层 OpenClaw Channel 配置
- `messages_send` 只能通过现有存储的路由回复
- 审批状态仅为当前桥接 Session 的实时/内存状态
- 桥接认证应使用与您信任任何其他远程 Gateway 客户端相同的 Gateway 令牌或密码控制

如果对话从 `conversations_list` 中缺失，通常原因不是 MCP 配置问题，而是底层 Gateway Session 中缺少或不完整的路由元数据。

## 测试

OpenClaw 为此桥接提供确定性 Docker 冒烟测试：

```bash
pnpm test:docker:mcp-channels
```

该冒烟测试：

- 启动种子 Gateway 容器
- 启动第二个容器，生成 `openclaw mcp serve`
- 验证对话发现、转录读取、附件元数据读取、实时事件队列行为和出站发送路由
- 通过真实 stdio MCP 桥接验证 Claude 样式的 Channel 和权限通知

这是在不将真实 Telegram、Discord 或 iMessage 账户接入测试运行的情况下证明桥接工作的最快方法。

更广泛的测试上下文，参见 [Testing](/help/testing)。

## 故障排除

### 未返回对话

通常意味着 Gateway Session 尚不可路由。确认底层 Session 已存储 Channel/Provider、收件人和可选的账户/线程路由元数据。

### `events_poll` 或 `events_wait` 错过较旧消息

这是预期行为。实时队列在桥接连接时开始。使用 `messages_read` 读取较旧的转录历史。

### Claude 通知未显示

检查以下所有内容：

- 客户端保持 stdio MCP Session 打开
- `--claude-channel-mode` 为 `on` 或 `auto`
- 客户端实际理解 Claude 特定的通知方法
- 入站消息在桥接连接后发生

### 审批缺失

`permissions_list_open` 仅显示桥接连接期间观察到的审批请求。它不是持久的审批历史 API。

## OpenClaw 作为 MCP 客户端注册表

这是 `openclaw mcp list`、`show`、`set` 和 `unset` 路径。

这些命令不会通过 MCP 开放 OpenClaw。它们管理 OpenClaw 拥有的 MCP 服务器定义，存储在 OpenClaw 配置的 `mcp.servers` 下。

这些保存的定义用于 OpenClaw 稍后启动或配置的运行时，例如嵌入式 Pi 和其他运行时适配器。OpenClaw 集中存储这些定义，以便这些运行时不需要维护自己重复的 MCP 服务器列表。

重要行为：

- 这些命令仅读取或写入 OpenClaw 配置
- 它们不连接到目标 MCP 服务器
- 它们不验证命令、URL 或远程传输是否当前可达
- 运行时适配器在执行时决定它们实际支持哪些传输形式

## 已保存的 MCP 服务器定义

OpenClaw 还在配置中存储轻量级 MCP 服务器注册表，供需要 OpenClaw 管理的 MCP 定义的界面使用。

命令：

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

示例：

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

示例配置格式：

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Stdio 传输

启动本地子进程并通过 stdin/stdout 通信。

| 字段                       | 描述                              |
| -------------------------- | --------------------------------- |
| `command`                  | 要生成的可执行文件（必填）          |
| `args`                     | 命令行参数数组                     |
| `env`                      | 额外的环境变量                     |
| `cwd` / `workingDirectory` | 进程的工作目录                     |

### SSE / HTTP 传输

通过 HTTP Server-Sent Events 连接到远程 MCP 服务器。

| 字段     | 描述                                                      |
| --------- | ---------------------------------------------------------------- |
| `url`     | 远程服务器的 HTTP 或 HTTPS URL（必填）                      |
| `headers` | 可选的 HTTP 头键值映射（例如认证令牌）                      |

示例：

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url`（userinfo）和 `headers` 中的敏感值在日志和状态输出中会被脱敏。

这些命令仅管理已保存的配置。它们不启动 Channel 桥接、不打开实时 MCP 客户端 Session，也不证明目标服务器可达。

## 当前限制

本页面记录今日发布的桥接情况。

当前限制：

- 对话发现依赖现有的 Gateway Session 路由元数据
- 除 Claude 特定适配器外，没有通用推送协议
- 目前还没有消息编辑或反应工具
- HTTP/SSE 传输连接到单个远程服务器；尚不支持多路上游
- `permissions_list_open` 仅包含桥接连接期间观察到的审批
