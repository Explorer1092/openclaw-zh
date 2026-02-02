---
title: "Zalo (Bot API)"
sidebarTitle: "Zalo"
mmh3_hash: "bd911fd73c7c70a1c8dd0748e25bee29"
summary: "Zalo bot 支持状态、功能和配置"
read_when: ["Working on Zalo features or webhooks"]
---
# Zalo (Bot API)

状态：实验性。仅支持私信；根据 Zalo 文档，群组功能即将推出。

## 需要插件
Zalo 作为插件提供，未与核心安装包捆绑。
- 通过 CLI 安装：`openclaw plugins install @openclaw/zalo`
- 或在新手引导过程中选择 **Zalo** 并确认安装提示
- 详情：[插件](/plugin)

## 快速设置（新手）
1) 安装 Zalo 插件：
   - 从源代码检出：`openclaw plugins install ./extensions/zalo`
   - 从 npm（如已发布）：`openclaw plugins install @openclaw/zalo`
   - 或在新手引导中选择 **Zalo** 并确认安装提示
2) 设置 token：
   - 环境变量：`ZALO_BOT_TOKEN=...`
   - 或配置：`channels.zalo.botToken: "..."`。
3) 重启 gateway（或完成新手引导）。
4) 私信访问默认为配对模式；首次联系时批准配对码。

最小配置：
```json5
{
  channels: {
    zalo: {
      enabled: true,
      botToken: "12345689:abc-xyz",
      dmPolicy: "pairing"
    }
  }
}
```

## 它是什么
Zalo 是一款专注于越南市场的消息应用；其 Bot API 允许 Gateway 运行用于一对一对话的 bot。
它适合需要确定性路由回 Zalo 的支持或通知场景。
- 由 Gateway 拥有的 Zalo Bot API 频道。
- 确定性路由：回复返回到 Zalo；模型不选择频道。
- 私信共享 agent 的主会话。
- 尚不支持群组（Zalo 文档表示"即将推出"）。

## 设置（快速路径）

### 1) 创建 bot token（Zalo Bot Platform）
1) 前往 **https://bot.zaloplatforms.com** 并登录。
2) 创建新 bot 并配置其设置。
3) 复制 bot token（格式：`12345689:abc-xyz`）。

### 2) 配置 token（环境变量或配置）
示例：

```json5
{
  channels: {
    zalo: {
      enabled: true,
      botToken: "12345689:abc-xyz",
      dmPolicy: "pairing"
    }
  }
}
```

环境变量选项：`ZALO_BOT_TOKEN=...`（仅适用于默认账户）。

多账户支持：使用 `channels.zalo.accounts`，配置每个账户的 token 和可选的 `name`。

3) 重启 gateway。当 token 被解析（环境变量或配置）时，Zalo 启动。
4) 私信访问默认为配对模式。当 bot 首次被联系时批准配对码。

## 工作原理（行为）
- 入站消息被规范化为共享频道信封，包含媒体占位符。
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
- 配对是默认的 token 交换机制。详情：[配对](/start/pairing)
- `channels.zalo.allowFrom` 接受数字用户 ID（不支持用户名查找）。

## 长轮询 vs webhook
- 默认：长轮询（无需公共 URL）。
- Webhook 模式：设置 `channels.zalo.webhookUrl` 和 `channels.zalo.webhookSecret`。
  - Webhook secret 必须是 8-256 字符。
  - Webhook URL 必须使用 HTTPS。
  - Zalo 发送带有 `X-Bot-Api-Secret-Token` 头的事件用于验证。
  - Gateway HTTP 在 `channels.zalo.webhookPath` 处理 webhook 请求（默认为 webhook URL 路径）。

**注意：** 根据 Zalo API 文档，getUpdates（轮询）和 webhook 互斥。

## 支持的消息类型
- **文本消息**：完全支持，包含 2000 字符分块。
- **图片消息**：下载并处理入站图片；通过 `sendPhoto` 发送图片。
- **贴纸**：已记录但未完全处理（无 agent 响应）。
- **不支持的类型**：已记录（例如，来自受保护用户的消息）。

## 功能
| 功能 | 状态 |
|---------|--------|
| 私信 | ✅ 支持 |
| 群组 | ❌ 即将推出（根据 Zalo 文档） |
| 媒体（图片） | ✅ 支持 |
| 反应 | ❌ 不支持 |
| 主题 | ❌ 不支持 |
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

Provider 选项：
- `channels.zalo.enabled`：启用/禁用频道启动。
- `channels.zalo.botToken`：来自 Zalo Bot Platform 的 bot token。
- `channels.zalo.tokenFile`：从文件路径读取 token。
- `channels.zalo.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.zalo.allowFrom`：私信白名单（用户 ID）。`open` 需要 `"*"`。向导会要求输入数字 ID。
- `channels.zalo.mediaMaxMb`：入站/出站媒体上限（MB，默认 5）。
- `channels.zalo.webhookUrl`：启用 webhook 模式（需要 HTTPS）。
- `channels.zalo.webhookSecret`：webhook secret（8-256 字符）。
- `channels.zalo.webhookPath`：gateway HTTP 服务器上的 webhook 路径。
- `channels.zalo.proxy`：API 请求的代理 URL。

多账户选项：
- `channels.zalo.accounts.<id>.botToken`：每个账户的 token。
- `channels.zalo.accounts.<id>.tokenFile`：每个账户的 token 文件。
- `channels.zalo.accounts.<id>.name`：显示名称。
- `channels.zalo.accounts.<id>.enabled`：启用/禁用账户。
- `channels.zalo.accounts.<id>.dmPolicy`：每个账户的私信策略。
- `channels.zalo.accounts.<id>.allowFrom`：每个账户的白名单。
- `channels.zalo.accounts.<id>.webhookUrl`：每个账户的 webhook URL。
- `channels.zalo.accounts.<id>.webhookSecret`：每个账户的 webhook secret。
- `channels.zalo.accounts.<id>.webhookPath`：每个账户的 webhook 路径。
- `channels.zalo.accounts.<id>.proxy`：每个账户的代理 URL。
