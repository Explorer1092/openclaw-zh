---
mmh3_hash: "d500668d76d21ec0a2827a3c62fb5ce9"
summary: "OpenClaw 已移除 BlueBubbles 支持。新的和迁移的 iMessage 设置请使用捆绑的 iMessage 插件（imsg）。"
read_when:
  - 你使用了旧的 BlueBubbles Channel 并需要迁移到 iMessage
  - 你正在选择 OpenClaw 支持的 iMessage 设置
  - 你需要了解 BlueBubbles 移除的简要说明
title: "BlueBubbles 移除与 imsg iMessage 路径"
---

# BlueBubbles 移除与 imsg iMessage 路径

OpenClaw 不再内置 BlueBubbles Channel。iMessage 支持现在通过捆绑的 `imessage` 插件运行，该插件在本地或通过 SSH 包装器启动 [`imsg`](https://github.com/steipete/imsg)，并通过 stdin/stdout 进行 JSON-RPC 通信。

如果你的配置中仍包含 `channels.bluebubbles`，请将其迁移到 `channels.imessage`。旧版 `/channels/bluebubbles` 文档 URL 会重定向到[从 BlueBubbles 迁移](/channels/imessage-from-bluebubbles)，其中包含完整的配置对照表和切换检查清单。

## 变化内容

- 在 OpenClaw 支持的 iMessage 路径中，不存在 BlueBubbles HTTP 服务器、Webhook 路由、REST 密码或 BlueBubbles 插件运行时。
- OpenClaw 通过 `imsg` 在已登录 Messages.app 的 Mac 上读取和监听消息。
- 基本的发送、接收、历史和媒体使用标准的 `imsg` 接口和 macOS 权限。
- 线程回复、tapbacks、编辑、撤回、特效、已读回执、正在输入指示器和群组管理等高级操作需要使用私有 API 桥接的 `imsg launch`。
- Linux 和 Windows Gateway 仍可通过将 `channels.imessage.cliPath` 设置为在已登录 Mac 上运行 `imsg` 的 SSH 包装器来使用 iMessage。

## 操作步骤

1. 在 Messages Mac 上安装并验证 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. 为运行 `imsg` 和 OpenClaw 的进程上下文授予完全磁盘访问权限和自动化权限。

3. 转换旧配置：

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. 重启 Gateway 并验证：

   ```bash
   openclaw channels status --probe
   ```

5. 在删除旧 BlueBubbles 服务器之前，测试私聊、群组、附件以及你依赖的任何私有 API 操作。

## 迁移说明

- `channels.bluebubbles.serverUrl` 和 `channels.bluebubbles.password` 在 iMessage 中没有对应项。
- `channels.bluebubbles.allowFrom`、`groupAllowFrom`、`groups`、`includeAttachments`、附件根目录、媒体大小限制、分块以及操作开关都有 iMessage 对应项。
- `channels.imessage.includeAttachments` 默认仍为关闭。如果你希望入站照片、语音备忘录、视频或文件能到达 Agent，请明确设置该项。
- 使用 `groupPolicy: "allowlist"` 时，复制旧 `groups` 块，包括任何 `"*"` 通配符条目。群组发送者允许列表和群组注册表是独立的门控。
- 匹配 `channel: "bluebubbles"` 的 ACP 绑定必须更改为 `channel: "imessage"`。
- 旧 BlueBubbles Session 键不会成为 iMessage Session 键。配对批准按联系人标识符延续，但 BlueBubbles Session 键下的对话历史不会延续。

## 另请参阅

- [从 BlueBubbles 迁移](/channels/imessage-from-bluebubbles)
- [iMessage](/channels/imessage)
- [配置参考 - iMessage](/gateway/config-channels#imessage)
