---
mmh3_hash: "08cef3ceb002df284b2429ce01576d38"
summary: "快速频道级故障排除，含各频道故障特征和修复方法"
read_when:
  - 频道传输显示已连接但回复失败
  - 深入查阅 provider 文档前需要进行频道特定检查
title: "Channel troubleshooting"
---

当频道已连接但行为异常时，请使用本页面。

## 命令阶梯

首先按顺序运行以下命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

健康基线：

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`、`write-capable` 或 `admin-capable`
- 频道探测显示传输已连接，并在支持的情况下显示 `works` 或 `audit ok`

## WhatsApp

### WhatsApp 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| --- | --- | --- |
| 已连接但无私信回复 | `openclaw pairing list whatsapp` | 批准发送者或切换私信策略/allowlist。 |
| 群组消息被忽略 | 检查配置中的 `requireMention` 和提及模式 | 提及 bot 或放宽该群组的提及策略。 |
| QR 登录超时（408） | 检查 gateway 的 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量 | 设置可达的代理；仅在需要绕过时使用 `NO_PROXY`。 |
| 随机断开/重新登录循环 | `openclaw channels status --probe` + 日志 | 最近的重连即使当前已连接也会被标记；观察日志，重启 gateway，如持续抖动则重新关联。 |
| 回复延迟数秒或数分钟 | `openclaw doctor --fix` | Doctor 会在本地 TUI 客户端验证陈旧并降低 Gateway 事件循环性能时将其停止。 |

完整故障排除：[WhatsApp 故障排除](/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| --- | --- | --- |
| `/start` 但无可用回复流程 | `openclaw pairing list telegram` | 批准配对或更改私信策略。 |
| Bot 在线但群组保持沉默 | 验证提及要求和 bot 隐私模式 | 禁用隐私模式以提高群组可见性，或提及 bot。 |
| 网络错误导致发送失败 | 检查日志中的 Telegram API 调用失败 | 修复到 `api.telegram.org` 的 DNS/IPv6/代理路由。 |
| 启动时报告 `getMe returned 401` | 检查已配置的 token 来源 | 重新复制或重新生成 BotFather token，并更新 `botToken`、`tokenFile` 或默认账户的 `TELEGRAM_BOT_TOKEN`。 |
| 轮询停滞或重连缓慢 | `openclaw logs --follow` 查看轮询诊断 | 升级；如果重启是误报，调整 `pollingStallThresholdMs`。持续停滞仍指向代理/DNS/IPv6 问题。 |
| `setMyCommands` 启动时被拒绝 | 检查日志中的 `BOT_COMMANDS_TOO_MUCH` | 减少插件/技能/自定义 Telegram 命令或禁用原生菜单。 |
| 升级后 allowlist 阻止您 | `openclaw security audit` 和配置 allowlist | 运行 `openclaw doctor --fix` 或将 `@username` 替换为数字发送者 ID。 |

完整故障排除：[Telegram 故障排除](/channels/telegram#troubleshooting)

## Discord

### Discord 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| --- | --- | --- |
| Bot 在线但无服务器回复 | `openclaw channels status --probe` | 允许服务器/频道并验证消息内容意图。 |
| 群组消息被忽略 | 检查日志中的提及门控丢弃 | 提及 bot 或设置服务器/频道 `requireMention: false`。 |
| 有 typing 指示和 token 消耗但无 Discord 消息 | Session 日志显示助手文本中有 `didSendViaMessagingTool: false` | 模型私下回答而未调用消息工具。使用工具调用可靠的模型，或设置 `messages.groupChat.visibleReplies: "automatic"` 以自动发布。 |
| 私信回复缺失 | `openclaw pairing list discord` | 批准私信配对或调整私信策略。 |

完整故障排除：[Discord 故障排除](/channels/discord#troubleshooting)

## Slack

### Slack 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| --- | --- | --- |
| Socket 模式已连接但无响应 | `openclaw channels status --probe` | 验证 app token + bot token 和所需权限范围；注意 SecretRef 配置下的 `botTokenStatus` / `appTokenStatus = configured_unavailable`。 |
| 私信被阻止 | `openclaw pairing list slack` | 批准配对或放宽私信策略。 |
| 频道消息被忽略 | 检查 `groupPolicy` 和频道 allowlist | 允许该频道或将策略切换为 `open`。 |

完整故障排除：[Slack 故障排除](/channels/slack#troubleshooting)

## iMessage

### iMessage 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| --- | --- | --- |
| 非 macOS 上 `imsg` 缺失或失败 | `openclaw channels status --probe --channel imessage` | 在 Messages Mac 上运行 OpenClaw，或使用 SSH wrapper 配置 `cliPath`。 |
| macOS 上可发送但无法接收 | 检查 Messages 自动化的 macOS 隐私权限 | 重新授予 TCC 权限并重启频道进程。 |
| 私信发送者被阻止 | `openclaw pairing list imessage` | 批准配对或更新 allowlist。 |

完整故障排除：

- [iMessage 故障排除](/channels/imessage#troubleshooting)

## Signal

### Signal 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| --- | --- | --- |
| 守护进程可达但 bot 沉默 | `openclaw channels status --probe` | 验证 `signal-cli` 守护进程 URL/账户和接收模式。 |
| 私信被阻止 | `openclaw pairing list signal` | 批准发送者或调整私信策略。 |
| 群组回复不触发 | 检查群组 allowlist 和提及模式 | 添加发送者/群组或放宽门控。 |

完整故障排除：[Signal 故障排除](/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| --- | --- | --- |
| Bot 回复"gone to Mars" | 验证配置中的 `appId` 和 `clientSecret` | 设置凭据或重启 gateway。 |
| 无入站消息 | `openclaw channels status --probe` | 在 QQ 开放平台验证凭据。 |
| 语音未转录 | 检查 STT provider 配置 | 配置 `channels.qqbot.stt` 或 `tools.media.audio`。 |
| 主动消息未到达 | 检查 QQ 平台交互要求 | QQ 可能会阻止没有近期交互的 bot 发起消息。 |

完整故障排除：[QQ Bot 故障排除](/channels/qqbot#troubleshooting)

## Matrix

### Matrix 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| --- | --- | --- |
| 已登录但忽略房间消息 | `openclaw channels status --probe` | 检查 `groupPolicy`、房间 allowlist 和提及门控。 |
| 私信未处理 | `openclaw pairing list matrix` | 批准发送者或调整私信策略。 |
| 加密房间失败 | `openclaw matrix verify status` | 重新验证设备，然后检查 `openclaw matrix verify backup status`。 |
| 备份恢复挂起/损坏 | `openclaw matrix verify backup status` | 运行 `openclaw matrix verify backup restore` 或使用恢复密钥重新运行。 |
| 交叉签名/引导看起来不正确 | `openclaw matrix verify bootstrap` | 一次性修复密钥存储、交叉签名和备份状态。 |

完整设置和配置：[Matrix](/channels/matrix)

## 相关

- [Pairing](/channels/pairing)
- [Channel 路由](/channels/channel-routing)
- [Gateway 故障排除](/gateway/troubleshooting)
