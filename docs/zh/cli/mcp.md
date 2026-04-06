---
mmh3_hash: "4d9cb405020f9e6eb034cb4d1efba3ca"
summary: "通过 MCP 公开 OpenClaw Channel 会话,并管理已保存的 MCP 服务器定义"
read_when:
  - 将 Codex、Claude Code 或其他 MCP 客户端连接到 OpenClaw 支持的 Channel
  - 运行 `openclaw mcp serve`
  - 管理 OpenClaw 保存的 MCP 服务器定义
title: "mcp"
---

# mcp

`openclaw mcp` 有两项职责:

- 通过 `openclaw mcp serve` 将 OpenClaw 作为 MCP 服务器运行
- 通过 `list`、`show`、`set` 和 `unset` 管理 OpenClaw 拥有的出站 MCP 服务器定义

换句话说:

- `serve` 是 OpenClaw 作为 MCP 服务器运行
- `list` / `show` / `set` / `unset` 是 OpenClaw 作为其运行时后续可能使用的其他 MCP 服务器的客户端注册表

如果 OpenClaw 应自身托管编码运行环境会话并通过 ACP 路由该运行时,请使用 [`openclaw acp`](/cli/acp)。

## OpenClaw 作为 MCP 服务器

这是 `openclaw mcp serve` 路径。

## 何时使用 `serve`

在以下情况下使用 `openclaw mcp serve`:

- Codex、Claude Code 或其他 MCP 客户端应直接与 OpenClaw 支持的 Channel 会话通信
- 您已有本地或远程的 OpenClaw Gateway,且路由 Session 已就绪
- 您希望一个 MCP 服务器跨 OpenClaw 的所有 Channel 后端工作,而不是运行独立的每 Channel 桥接

如果 OpenClaw 应自身托管编码运行时并将 Agent Session 保持在 OpenClaw 内部,请改用 [`openclaw acp`](/cli/acp)。

## 工作原理

`openclaw mcp serve` 启动一个 stdio MCP 服务器。MCP 客户端拥有该进程。当客户端保持 stdio Session 打开时,桥接通过 WebSocket 连接到本地或远程 OpenClaw Gateway,并通过 MCP 公开路由的 Channel 会话。

生命周期:

1. MCP 客户端生成 `openclaw mcp serve`
2. 桥接连接到 Gateway
3. 路由的 Session 变为 MCP 会话和记录/历史工具
4. 当桥接连接时,实时事件在内存中排队
5. 如果启用了 Claude Channel 模式,同一 Session 也可以接收 Claude 特定的推送通知

重要行为:

- 实时队列状态在桥接连接时开始
- 较早的记录历史通过 `messages_read` 读取
- Claude 推送通知仅在 MCP Session 处于活动状态时存在
- 当客户端断开连接时,桥接退出且实时队列消失

## 选择客户端模式

以两种不同方式使用同一桥接:

- 通用 MCP 客户端:仅标准 MCP 工具。使用 `conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send` 和批准工具。
- Claude Code:标准 MCP 工具加上 Claude 特定的 Channel 适配器。启用 `--claude-channel-mode on` 或保留默认的 `auto`。

目前 `auto` 的行为与 `on` 相同。尚无客户端能力检测。

## `serve` 公开的内容

桥接使用现有的 Gateway Session 路由元数据公开 Channel 支持的会话。当 OpenClaw 已经拥有包含已知路由的 Session 状态时,会话才会出现,例如:

- `channel`
- 收件人或目标元数据
- 可选的 `accountId`
- 可选的 `threadId`

这为 MCP 客户端提供了一个地方来:

- 列出最近路由的会话
- 读取最近的记录历史
- 等待新的入站事件
- 通过同一路由发送回复
- 查看桥接连接时到达的批准请求

## 用法

```bash
# 本地 Gateway
openclaw mcp serve

# 远程 Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 使用密码认证的远程 Gateway
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# 启用详细桥接日志
openclaw mcp serve --verbose

# 禁用 Claude 特定推送通知
openclaw mcp serve --claude-channel-mode off
```

## 桥接工具

当前桥接公开以下 MCP 工具:

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

列出 Gateway Session 状态中已有路由元数据的最近 Session 支持的会话。

有用的过滤器:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

通过 `session_key` 返回一个会话。

### `messages_read`

读取一个 Session 支持的会话的最近记录消息。

### `attachments_fetch`

从一条记录消息中提取非文本消息内容块。这是记录内容的元数据视图,而非独立的持久附件存储。

### `events_poll`

从数字游标开始读取排队的实时事件。

### `events_wait`

长轮询直到下一个匹配的排队事件到达或超时。

当通用 MCP 客户端需要近实时传递而无需 Claude 特定推送协议时,使用此工具。

### `messages_send`

通过 Session 上已记录的同一路由发送文本。

当前行为:

- 需要现有的会话路由
- 使用 Session 的 Channel、收件人、账户 ID 和线程 ID
- 仅发送文本

### `permissions_list_open`

列出桥接连接到 Gateway 后观察到的待处理 exec/plugin 批准请求。

### `permissions_respond`

使用以下方式解决一个待处理的 exec/plugin 批准请求:

- `allow-once`
- `allow-always`
- `deny`

## 事件模型

桥接连接时在内存中维护事件队列。

当前事件类型:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

重要限制:

- 队列仅为实时;在 MCP 桥接启动时开始
- `events_poll` 和 `events_wait` 本身不重播较早的 Gateway 历史
- 持久积压应通过 `messages_read` 读取

## Claude Channel 通知

桥接还可以公开 Claude 特定的 Channel 通知。这是 OpenClaw 等效的 Claude Code Channel 适配器:标准 MCP 工具仍然可用,但实时入站消息也可以作为 Claude 特定的 MCP 通知到达。

标志:

- `--claude-channel-mode off`:仅标准 MCP 工具
- `--claude-channel-mode on`:启用 Claude Channel 通知
- `--claude-channel-mode auto`:当前默认;与 `on` 相同的桥接行为

启用 Claude Channel 模式后,服务器会公布 Claude 实验能力并可发出:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

当前桥接行为:

- 入站 `user` 记录消息作为 `notifications/claude/channel` 转发
- 通过 MCP 接收的 Claude 权限请求在内存中跟踪
- 如果链接的会话后来发送 `yes abcde` 或 `no abcde`,桥接将其转换为 `notifications/claude/channel/permission`
- 这些通知仅限实时 Session;如果 MCP 客户端断开连接,则没有推送目标

这是有意的客户端特定行为。通用 MCP 客户端应依赖标准轮询工具。

## MCP 客户端配置

stdio 客户端配置示例:

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

对于大多数通用 MCP 客户端,从标准工具界面开始,忽略 Claude 模式。仅对真正理解 Claude 特定通知方法的客户端开启 Claude 模式。

## 选项

`openclaw mcp serve` 支持:

- `--url <url>`:Gateway WebSocket URL
- `--token <token>`:Gateway 令牌
- `--token-file <path>`:从文件读取令牌
- `--password <password>`:Gateway 密码
- `--password-file <path>`:从文件读取密码
- `--claude-channel-mode <auto|on|off>`:Claude 通知模式
- `-v`、`--verbose`:在 stderr 上输出详细日志

在可能的情况下,优先使用 `--token-file` 或 `--password-file` 而非内联密钥。

## 安全和信任边界

桥接不创建路由。它仅公开 Gateway 已知如何路由的会话。

这意味着:

- 发送者允许列表、配对和 Channel 级别信任仍属于底层 OpenClaw Channel 配置
- `messages_send` 只能通过现有的已存储路由回复
- 批准状态对于当前桥接 Session 仅为实时/内存中
- 桥接认证应使用与其他远程 Gateway 客户端相同的 Gateway 令牌或密码控制

如果会话在 `conversations_list` 中缺失,通常原因不在于 MCP 配置,而是底层 Gateway Session 中缺少或不完整的路由元数据。

## 测试

OpenClaw 为此桥接提供确定性 Docker 冒烟测试:

```bash
pnpm test:docker:mcp-channels
```

该冒烟测试:

- 启动一个已填充数据的 Gateway 容器
- 启动第二个生成 `openclaw mcp serve` 的容器
- 验证会话发现、记录读取、附件元数据读取、实时事件队列行为和出站发送路由
- 通过真实的 stdio MCP 桥接验证 Claude 风格的 Channel 和权限通知

这是验证桥接工作的最快方式,无需将真实的 Telegram、Discord 或 iMessage 账户连接到测试运行中。

更广泛的测试背景,请参见 [Testing](/help/testing)。

## 故障排除

### 未返回会话

通常意味着 Gateway Session 尚不可路由。确认底层 Session 已存储 Channel/提供商、收件人以及可选的账户/线程路由元数据。

### `events_poll` 或 `events_wait` 遗漏旧消息

预期行为。实时队列在桥接连接时开始。使用 `messages_read` 读取较早的记录历史。

### Claude 通知未显示

检查以下所有内容:

- 客户端保持 stdio MCP Session 打开
- `--claude-channel-mode` 为 `on` 或 `auto`
- 客户端实际理解 Claude 特定的通知方法
- 入站消息在桥接连接后发生

### 批准缺失

`permissions_list_open` 仅显示桥接连接时观察到的批准请求。这不是持久的批准历史 API。

## OpenClaw 作为 MCP 客户端注册表

这是 `openclaw mcp list`、`show`、`set` 和 `unset` 路径。

这些命令不通过 MCP 公开 OpenClaw。它们管理 OpenClaw 配置中 `mcp.servers` 下 OpenClaw 拥有的 MCP 服务器定义。

这些保存的定义供 OpenClaw 后续启动或配置的运行时使用,例如嵌入式 Pi 和其他运行时适配器。OpenClaw 集中存储这些定义,以便这些运行时无需维护各自重复的 MCP 服务器列表。

重要行为:

- 这些命令仅读取或写入 OpenClaw 配置
- 它们不连接到目标 MCP 服务器
- 它们不验证命令、URL 或远程传输是否当前可达
- 运行时适配器在执行时决定实际支持的传输方式

## 已保存的 MCP 服务器定义

OpenClaw 还在配置中为需要 OpenClaw 管理的 MCP 定义的界面存储轻量级 MCP 服务器注册表。

命令:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

说明:

- `list` 对服务器名称排序。
- `show` 不带名称时打印完整配置的 MCP 服务器对象。
- `set` 期望命令行上有一个 JSON 对象值。
- `unset` 在命名的服务器不存在时失败。

示例:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

示例配置结构:

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

### stdio 传输

启动本地子进程并通过 stdin/stdout 通信。

| 字段                       | 描述                             |
| -------------------------- | -------------------------------- |
| `command`                  | 要生成的可执行文件(必需)         |
| `args`                     | 命令行参数数组                   |
| `env`                      | 额外的环境变量                   |
| `cwd` / `workingDirectory` | 进程的工作目录                   |

### SSE / HTTP 传输

通过 HTTP Server-Sent Events 连接到远程 MCP 服务器。

| 字段                  | 描述                                                           |
| --------------------- | -------------------------------------------------------------- |
| `url`                 | 远程服务器的 HTTP 或 HTTPS URL(必需)                           |
| `headers`             | 可选的 HTTP 标头键值映射(例如认证令牌)                         |
| `connectionTimeoutMs` | 每服务器连接超时(毫秒,可选)                                   |

示例:

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

`url`(用户信息部分)和 `headers` 中的敏感值在日志和状态输出中会被隐藏。

### Streamable HTTP 传输

`streamable-http` 是 `sse` 和 `stdio` 之外的另一种传输选项。它使用 HTTP 流式传输与远程 MCP 服务器进行双向通信。

| 字段                  | 描述                                                                          |
| --------------------- | ----------------------------------------------------------------------------- |
| `url`                 | 远程服务器的 HTTP 或 HTTPS URL(必需)                                          |
| `transport`           | 设置为 `"streamable-http"` 以选择此传输;省略时 OpenClaw 使用 `sse`            |
| `headers`             | 可选的 HTTP 标头键值映射(例如认证令牌)                                        |
| `connectionTimeoutMs` | 每服务器连接超时(毫秒,可选)                                                  |

示例:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

这些命令仅管理已保存的配置。它们不启动 Channel 桥接、不打开实时 MCP 客户端 Session,也不验证目标服务器是否可达。

## 当前限制

本页记录当前已发布的桥接。

当前限制:

- 会话发现依赖于现有的 Gateway Session 路由元数据
- 除 Claude 特定适配器外,无通用推送协议
- 目前没有消息编辑或回应工具
- HTTP/SSE/streamable-http 传输连接到单个远程服务器;暂无多路复用上游
- `permissions_list_open` 仅包含桥接连接时观察到的批准
