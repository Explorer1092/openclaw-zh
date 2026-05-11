---
title: "WebChat"
mmh3_hash: "a78231544f29a27cb133bfec9fc7e266"
summary: "环回 WebChat 静态主机和 Gateway WS 聊天 UI 使用"
read_when:
  - 调试或配置 WebChat 访问
---

状态：macOS/iOS SwiftUI 聊天 UI 直接与 Gateway WebSocket 通信。

## 它是什么

- Gateway 的原生聊天 UI（无嵌入式浏览器，无本地静态服务器）。
- 使用与其他 Channel 相同的会话和路由规则。
- 确定性路由：回复始终返回到 WebChat。

## 快速开始

1. 启动 Gateway。
2. 打开 WebChat UI（macOS/iOS 应用）或 Control UI 聊天标签页。
3. 确保配置了有效的 Gateway 认证路径（默认为共享密钥，即使在环回上也是如此）。

## 工作原理（行为）

- UI 连接到 Gateway WebSocket 并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.history` 受限以确保稳定性：Gateway 可能会截断长文本字段，省略重型元数据，并用 `[chat.history omitted: message too large]` 替换超大条目。
- `chat.history` 遵循现代仅追加会话文件的活动转录分支，因此放弃的重写分支和被取代的提示副本不会在 WebChat 中渲染。
- 压缩条目渲染为明确的压缩历史分隔符。分隔符解释早期轮次保存在检查点中，并链接到会话检查点控件，当操作员的权限允许时，可以从中分支或恢复压缩前的视图。
- Control UI 记住 `chat.history` 返回的支持 Gateway `sessionId`，并将其包含在后续 `chat.send` 调用中，因此重新连接和页面刷新继续相同的存储对话，除非用户开始或重置会话。
- Control UI 在生成新的 `chat.send` 运行 ID 之前，对相同会话、消息和附件的重复进行中提交进行合并；Gateway 仍然对重用相同幂等性键的重复请求进行去重。
- 工作区启动文件和待处理的 `BOOTSTRAP.md` 指令通过 agent 系统提示的项目上下文提供，而不是复制到 WebChat 用户消息中。引导截断仅添加简洁的系统提示恢复通知；详细的计数和配置旋钮保留在诊断界面上。
- `chat.history` 也进行显示规范化：仅运行时的 OpenClaw 上下文、入站信封包装、内联交付指令标签（如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和截断的工具调用块）以及泄漏的 ASCII/全角模型控制令牌从可见文本中被剥离，整个可见文本只是精确静默令牌 `NO_REPLY` / `no_reply` 的助手条目被省略。
- 推理标记的回复负载（`isReasoning: true`）从 WebChat 助手内容、转录回放文本和音频内容块中排除，因此仅思考的负载不会作为可见的助手消息或可播放的音频出现。
- `chat.inject` 直接将助手注释附加到转录，并将其广播到 UI（无 agent 运行）。
- 中止的运行可以在 UI 中保持部分助手输出可见。
- 当存在缓冲输出时，Gateway 将中止的部分助手文本持久化到转录历史中，并用中止元数据标记这些条目。
- 历史始终从 Gateway 获取（无本地文件监视）。
- 如果 Gateway 不可达，WebChat 是只读的。

### 转录和交付模型

WebChat 有两个独立的数据路径：

- 会话 JSONL 文件是持久的模型/运行时转录。对于正常的 agent 运行，Pi 通过其会话管理器持久化模型可见的 `user`、`assistant` 和 `toolResult` 消息。WebChat 不会将任意的交付、状态或辅助文本写入该转录。
- Gateway `ReplyPayload` 事件是实时交付投影。它们可以针对 WebChat/Channel 显示进行规范化，阻止流式传输，指令标签、媒体嵌入、TTS/音频标志和 UI 回退行为。它们本身不是规范的会话日志。
- WebChat 仅当 Gateway 拥有正常 Pi 助手轮次之外显示的消息时才注入助手转录条目：`chat.inject`、非 agent 命令回复、中止的部分输出和 WebChat 管理的媒体转录补充。
- `chat.history` 读取存储的会话转录并应用 WebChat 显示投影。如果运行期间出现实时助手文本但在历史重新加载后消失，首先检查原始 JSONL 是否包含助手文本，然后检查 `chat.history` 投影是否剥离了它，然后检查 Control UI 乐观尾部合并是否用持久化的快照替换了本地交付状态。

正常的 agent 运行最终答案应该是持久的，因为 Pi 写入助手 `message_end`。将交付的最终负载镜像到转录中的任何回退都必须首先避免重复 Pi 已经写入的助手轮次。

## Control UI agent 工具面板

- Control UI `/agents` 工具面板有两个独立的视图：
  - **立即可用**使用 `tools.effective(sessionKey=...)` 并显示当前会话在运行时实际可以使用的内容，包括核心、插件和 Channel 拥有的工具。
  - **工具配置**使用 `tools.catalog` 并专注于配置文件、覆盖和目录语义。
- 运行时可用性是会话范围的。在同一 agent 上切换会话可以更改**立即可用**列表。
- 配置编辑器不暗示运行时可用性；有效访问仍然遵循策略优先级（`allow`/`deny`、每 agent 和 provider/Channel 覆盖）。

## 远程使用

- 远程模式通过 SSH/Tailscale 隧道化 Gateway WebSocket。
- 您不需要运行单独的 WebChat 服务器。

## 配置参考（WebChat）

完整配置：[配置](/gateway/configuration)

WebChat 选项：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 响应中文本字段的最大字符数。当转录条目超过此限制时，Gateway 截断长文本字段，并可能用占位符替换超大消息。客户端也可以发送每请求 `maxChars` 以覆盖单个 `chat.history` 调用的此默认值。

相关全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：共享密钥 WebSocket 认证。
- `gateway.auth.allowTailscale`：启用时，浏览器 Control UI 聊天标签页可以使用 Tailscale Serve 身份标头。
- `gateway.auth.mode: "trusted-proxy"`：在身份感知**非环回**代理源（参见 [可信代理认证](/gateway/trusted-proxy-auth)）后面的浏览器客户端的反向代理认证。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程 Gateway 目标。
- `session.*`：会话存储和主键默认值。

## 相关文档

- [Control UI](/web/control-ui)
- [Dashboard](/web/dashboard)
