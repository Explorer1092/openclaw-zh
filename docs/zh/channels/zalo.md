---
mmh3_hash: "b5ff11ac91184cca22ed431b376384c5"
summary: "Zalo bot 支持状态、功能和配置"
read_when:
  - 开发 Zalo 功能或 webhook
title: "Zalo"
---

状态：实验性。支持私信。下方[功能](#capabilities)部分反映当前 Marketplace bot 行为。

## 内置插件

Zalo 在当前 OpenClaw 版本中作为内置插件提供，因此正常的打包构建无需单独安装。

如果您使用的是较旧的构建版本或不包含 Zalo 的自定义安装，请手动安装：

- 通过 CLI 安装：`openclaw plugins install @openclaw/zalo`
- 或从源代码检出：`openclaw plugins install ./path/to/local/zalo-plugin`
- 详情：[插件](/tools/plugin)

## 快速设置（新手）

1. 确保 Zalo 插件可用。
   - 当前打包的 OpenClaw 版本已内置。
   - 较旧/自定义安装可使用上述命令手动添加。
2. 设置 token：
   - 环境变量：`ZALO_BOT_TOKEN=...`
   - 或配置：`channels.zalo.accounts.default.botToken: "..."`。
3. 重启 gateway（或完成新手引导）。
4. 私信访问默认为配对模式；首次联系时批准配对码。

最小配置：

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## 它是什么

Zalo 是一款专注于越南市场的消息应用；其 Bot API 允许 Gateway 运行用于一对一对话的 bot。
它适合需要确定性路由回 Zalo 的支持或通知场景。

本页面反映 **Zalo Bot Creator / Marketplace bot** 的当前 OpenClaw 行为。
**Zalo Official Account (OA) bot** 是不同的 Zalo 产品面，行为可能有所不同。

- 由 Gateway 拥有的 Zalo Bot API Channel。
- 确定性路由：回复返回到 Zalo；模型不选择 Channel。
- 私信共享 agent 的主会话。
- 下方[功能](#capabilities)部分显示当前 Marketplace bot 支持情况。

## 设置（快速路径）

### 1) 创建 bot token（Zalo Bot Platform）

1. 前往 [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) 并登录。
2. 创建新 bot 并配置其设置。
3. 复制完整的 bot token（通常为 `numeric_id:secret`）。对于 Marketplace bot，可用的运行时 token 可能出现在 bot 创建后的欢迎消息中。

### 2) 配置 token（环境变量或配置）

示例：

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

如果您以后迁移到支持群组的 Zalo bot 产品面，可以显式添加群组特定配置，例如 `groupPolicy` 和 `groupAllowFrom`。有关当前 Marketplace bot 行为，请参见[功能](#capabilities)。

环境变量选项：`ZALO_BOT_TOKEN=...`（仅适用于默认账户）。

多账户支持：使用 `channels.zalo.accounts`，配置每个账户的 token 和可选的 `name`。

3. 重启 gateway。当 token 被解析（环境变量或配置）时，Zalo 启动。
4. 私信访问默认为配对模式。当 bot 首次被联系时批准配对码。

## 工作原理（行为）

- 入站消息被规范化为共享 Channel 信封，包含媒体占位符。
- 回复始终路由回同一个 Zalo 聊天。
- 默认长轮询；可通过 `channels.zalo.webhookUrl` 使用 webhook 模式。

## 限制

- 出站文本被分块为 2000 字符（Zalo API 限制）。
- 媒体下载/上传受 `channels.zalo.mediaMaxMb` 限制（默认 5）。
- 默认阻止流式传输，因为 2000 字符限制使流式传输不太实用。

## 访问控制（私信）

### 私信访问

- 默认：`channels.zalo.dmPolicy = "pairing"`。未知发送者收到配对码；在批准之前消息被忽略（配对码 1 小时后过期）。
- 批准方式：
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- 配对是默认的 token 交换机制。详情：[配对](/channels/pairing)
- `channels.zalo.allowFrom` 接受数字用户 ID（不支持用户名查找）。

## 访问控制（群组）

对于 **Zalo Bot Creator / Marketplace bot**，实际上不支持群组，因为 bot 根本无法添加到群组中。

这意味着以下群组相关配置键存在于 schema 中，但对 Marketplace bot 不可用：

- `channels.zalo.groupPolicy` 控制群组入站处理：`open | allowlist | disabled`。
- `channels.zalo.groupAllowFrom` 限制哪些发送者 ID 可以在群组中触发 bot。
- 如果 `groupAllowFrom` 未设置，Zalo 回退到 `allowFrom` 进行发送者检查。
- 运行时注意：如果 `channels.zalo` 完全缺失，运行时仍会回退到 `groupPolicy="allowlist"` 以确保安全。

群组策略值（当您的 bot 产品面支持群组访问时）：

- `groupPolicy: "disabled"` — 阻止所有群组消息。
- `groupPolicy: "open"` — 允许任何群组成员（需要提及）。
- `groupPolicy: "allowlist"` — 失败关闭的默认值；仅允许的发送者被接受。

如果您使用不同的 Zalo bot 产品面且已验证群组行为正常，请单独记录，而不要假设其与 Marketplace bot 流程匹配。

## 长轮询 vs webhook

- 默认：长轮询（无需公共 URL）。
- Webhook 模式：设置 `channels.zalo.webhookUrl` 和 `channels.zalo.webhookSecret`。
  - Webhook secret 必须是 8-256 字符。
  - Webhook URL 必须使用 HTTPS。
  - Zalo 发送带有 `X-Bot-Api-Secret-Token` 头的事件用于验证。
  - Gateway HTTP 在 `channels.zalo.webhookPath` 处理 webhook 请求（默认为 webhook URL 路径）。
  - 请求必须使用 `Content-Type: application/json`（或 `+json` 媒体类型）。
  - 重复事件（`event_name + message_id`）在短暂的重放窗口内被忽略。
  - 突发流量按路径/来源进行限速，可能返回 HTTP 429。

**注意：** 根据 Zalo API 文档，getUpdates（轮询）和 webhook 互斥。

## 支持的消息类型

快速支持概览请参见[功能](#capabilities)。以下注释在行为需要额外上下文时添加详情。

- **文本消息**：完全支持，包含 2000 字符分块。
- **文本中的普通 URL**：与普通文本输入一样处理。
- **链接预览 / 富链接卡片**：请参见[功能](#capabilities)中的 Marketplace bot 状态；它们无法可靠触发回复。
- **图片消息**：请参见[功能](#capabilities)中的 Marketplace bot 状态；入站图片处理不可靠（出现正在输入指示符但没有最终回复）。
- **贴纸**：请参见[功能](#capabilities)中的 Marketplace bot 状态。
- **语音笔记 / 音频文件 / 视频 / 通用文件附件**：请参见[功能](#capabilities)中的 Marketplace bot 状态。
- **不支持的类型**：已记录（例如，来自受保护用户的消息）。

## 功能 {#capabilities}

此表总结了 OpenClaw 中当前 **Zalo Bot Creator / Marketplace bot** 的行为。

| 功能 | 状态 |
| --- | --- |
| 私信 | ✅ 支持 |
| 群组 | ❌ Marketplace bot 不可用 |
| 媒体（入站图片） | ⚠️ 有限 / 请在您的环境中验证 |
| 媒体（出站图片） | ⚠️ Marketplace bot 未重新测试 |
| 文本中的普通 URL | ✅ 支持 |
| 链接预览 | ⚠️ Marketplace bot 不可靠 |
| Reaction | ❌ 不支持 |
| 贴纸 | ⚠️ Marketplace bot 无 agent 回复 |
| 语音笔记 / 音频 / 视频 | ⚠️ Marketplace bot 无 agent 回复 |
| 文件附件 | ⚠️ Marketplace bot 无 agent 回复 |
| 话题串 | ❌ 不支持 |
| 投票 | ❌ 不支持 |
| 原生命令 | ❌ 不支持 |
| 流式传输 | ⚠️ 已阻止（2000 字符限制） |

## 发送目标（CLI/cron）

- 使用聊天 ID 作为目标。
- 示例：`openclaw message send --channel zalo --target 123456789 --message "hi"`。

## 故障排除

**Bot 不响应：**

- 检查 token 是否有效：`openclaw channels status --probe`
- 验证发送者是否已批准（配对或 allowFrom）
- 检查 gateway 日志：`openclaw logs --follow`

**Webhook 未接收事件：**

- 确保 webhook URL 使用 HTTPS
- 验证 secret token 是 8-256 字符
- 确认 gateway HTTP 端点在配置的路径上可访问
- 检查 getUpdates 轮询是否未运行（它们互斥）

## 配置参考（Zalo）

完整配置：[配置](/gateway/configuration)

顶层平坦键（`channels.zalo.botToken`、`channels.zalo.dmPolicy` 等）是旧版单账户简写。新配置推荐使用 `channels.zalo.accounts.<id>.*`。两种形式仍在此处记录，因为它们存在于 schema 中。

Provider 选项：

- `channels.zalo.enabled`：启用/禁用 Channel 启动。
- `channels.zalo.botToken`：来自 Zalo Bot Platform 的 bot token。
- `channels.zalo.tokenFile`：从文件路径读取 token。符号链接被拒绝。
- `channels.zalo.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.zalo.allowFrom`：私信 allowlist（用户 ID）。`open` 需要 `"*"`。向导会要求输入数字 ID。
- `channels.zalo.groupPolicy`：`open | allowlist | disabled`（默认：allowlist）。存在于配置中；有关当前 Marketplace bot 行为，请参见[功能](#capabilities)和[访问控制（群组）](#access-control-groups)。
- `channels.zalo.groupAllowFrom`：群组发送者 allowlist（用户 ID）。未设置时回退到 `allowFrom`。
- `channels.zalo.mediaMaxMb`：入站/出站媒体上限（MB，默认 5）。
- `channels.zalo.webhookUrl`：启用 webhook 模式（需要 HTTPS）。
- `channels.zalo.webhookSecret`：webhook secret（8-256 字符）。
- `channels.zalo.webhookPath`：gateway HTTP 服务器上的 webhook 路径。
- `channels.zalo.proxy`：API 请求的代理 URL。

多账户选项：

- `channels.zalo.accounts.<id>.botToken`：每账户 token。
- `channels.zalo.accounts.<id>.tokenFile`：每账户普通 token 文件。符号链接被拒绝。
- `channels.zalo.accounts.<id>.name`：显示名称。
- `channels.zalo.accounts.<id>.enabled`：启用/禁用账户。
- `channels.zalo.accounts.<id>.dmPolicy`：每账户私信策略。
- `channels.zalo.accounts.<id>.allowFrom`：每账户 allowlist。
- `channels.zalo.accounts.<id>.groupPolicy`：每账户群组策略。存在于配置中；有关当前 Marketplace bot 行为，请参见[功能](#capabilities)和[访问控制（群组）](#access-control-groups)。
- `channels.zalo.accounts.<id>.groupAllowFrom`：每账户群组发送者 allowlist。
- `channels.zalo.accounts.<id>.webhookUrl`：每账户 webhook URL。
- `channels.zalo.accounts.<id>.webhookSecret`：每账户 webhook secret。
- `channels.zalo.accounts.<id>.webhookPath`：每账户 webhook 路径。
- `channels.zalo.accounts.<id>.proxy`：每账户代理 URL。

## 相关

- [Channels 概述](/channels) — 所有支持的 Channels
- [Pairing](/channels/pairing) — DM 认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
