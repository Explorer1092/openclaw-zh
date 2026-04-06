---
title: "WebChat (Gateway WebSocket UI)"
sidebarTitle: "WebChat"
mmh3_hash: "f394f22ddb801aaec0744d4a4f796828"
summary: "环回 WebChat 静态主机和 Gateway WS 聊天 UI 使用"
read_when: ["调试或配置 WebChat 访问"]
---
# WebChat (Gateway WebSocket UI)

状态: macOS/iOS SwiftUI 聊天 UI 直接与 Gateway WebSocket 通信。

## 它是什么

- Gateway 的原生聊天 UI(无嵌入式浏览器,无本地静态服务器)。
- 使用与其他通道相同的会话和路由规则。
- 确定性路由: 回复始终返回 WebChat。

## 快速开始

1. 启动 Gateway。
2. 打开 WebChat UI(macOS/iOS 应用)或 Control UI 聊天选项卡。
3. 确保配置了 Gateway 身份验证(默认情况下需要,即使在环回上)。

## 工作原理（行为）

- UI 连接到 Gateway WebSocket 并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.history` 有大小限制以保证稳定性：Gateway 可能截断长文本字段、省略大型元数据，并用占位符替换超大条目（`[chat.history omitted: message too large]`）。
- `chat.history` 还进行显示标准化：内联传递指令标签（如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 有效载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和截断的工具调用块）以及泄漏的 ASCII/全角模型控制令牌从可见文本中被去除，整个可见文本仅为精确静默令牌 `NO_REPLY` / `no_reply` 的 assistant 条目被省略。
- `chat.inject` 直接将 assistant 注释附加到转录并将其广播到 UI（无 Agent 运行）。
- 中止的运行可以在 UI 中保留部分 assistant 输出可见。
- 当存在缓冲输出时，Gateway 将中止的部分 assistant 文本持久化到转录历史中，并用中止元数据标记这些条目。
- 历史始终从 Gateway 获取（无本地文件监视）。
- 如果 Gateway 不可访问，WebChat 是只读的。

## Control UI Agents 工具面板

- Control UI `/agents` 工具面板有两个独立视图：
  - **Available Right Now** 使用 `tools.effective(sessionKey=...)` 并显示当前 Session 在运行时实际可以使用的内容，包括核心、Plugin 和 Channel 拥有的工具。
  - **Tool Configuration** 使用 `tools.catalog` 并专注于配置文件、覆盖和目录语义。
- 运行时可用性以 Session 为范围。在同一 Agent 上切换 Session 可以更改 **Available Right Now** 列表。
- 配置编辑器不意味着运行时可用性；有效访问仍然遵循策略优先级（`allow`/`deny`，每 Agent 和 Provider/Channel 覆盖）。

## 远程使用

- 远程模式通过 SSH/Tailscale 隧道 Gateway WebSocket。
- 您不需要运行单独的 WebChat 服务器。

## 配置参考(WebChat)

完整配置: [配置](/gateway/configuration)

WebChat 选项：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 响应中文本字段的最大字符数。当转录条目超过此限制时，Gateway 截断长文本字段，并可能用占位符替换超大消息。客户端也可以为单个 `chat.history` 调用发送每请求 `maxChars` 以覆盖此默认值。

相关全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：共享密钥 WebSocket 认证。
- `gateway.auth.allowTailscale`：启用时浏览器 Control UI 聊天标签可使用 Tailscale Serve 身份标头。
- `gateway.auth.mode: "trusted-proxy"`：身份感知**非环回**代理来源后面的浏览器客户端的反向代理认证（请参见 [Trusted Proxy Auth](/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程 Gateway 目标。
- `session.*`：Session 存储和主键默认值。
