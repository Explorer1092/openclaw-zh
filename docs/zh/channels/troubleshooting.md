---
title: "频道故障排除"
sidebarTitle: "频道故障排除"
mmh3_hash: "aef1510f79567d267a7101e2eb5d57f2"
summary: "快速频道级故障排除，含各频道故障特征和修复方法"
read_when:
  - 频道传输显示已连接但回复失败
  - 深入查阅 provider 文档前需要进行频道特定检查
---

# 频道故障排除

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
- `RPC probe: ok`
- 频道探测显示传输已连接，并在支持的情况下显示 `works` 或 `audit ok`

## WhatsApp

### WhatsApp 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| --- | --- | --- |
| 已连接但无私信回复 | `openclaw pairing list whatsapp` | 批准发送者或切换私信策略/allowlist。 |
| 群组消息被忽略 | 检查配置中的 `requireMention` 和提及模式 | 提及 bot 或放宽该群组的提及策略。 |
| 随机断开/重新登录循环 | `openclaw channels status --probe` + 日志 | 重新登录并验证凭据目录是否正常。 |

完整故障排除：[/channels/whatsapp#troubleshooting](/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| --- | --- | --- |
| `/start` 但无可用回复流程 | `openclaw pairing list telegram` | 批准配对或更改私信策略。 |
| Bot 在线但群组保持沉默 | 验证提及要求和 bot 隐私模式 | 禁用隐私模式以提高群组可见性，或提及 bot。 |
| 网络错误导致发送失败 | 检查日志中的 Telegram API 调用失败 | 修复到 `api.telegram.org` 的 DNS/IPv6/代理路由。 |
| `setMyCommands` 启动时被拒绝 | 检查日志中的 `BOT_COMMANDS_TOO_MUCH` | 减少插件/技能/自定义 Telegram 命令或禁用原生菜单。 |
| 升级后 allowlist 阻止您 | `openclaw security audit` 和配置 allowlist | 运行 `openclaw doctor --fix` 或将 `@username` 替换为数字发送者 ID。 |

完整故障排除：[/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## Discord

### Discord 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| --- | --- | --- |
| Bot 在线但无服务器回复 | `openclaw channels status --probe` | 允许服务器/频道并验证消息内容意图。 |
| 群组消息被忽略 | 检查日志中的提及门控丢弃 | 提及 bot 或设置服务器/频道 `requireMention: false`。 |
| 私信回复缺失 | `openclaw pairing list discord` | 批准私信配对或调整私信策略。 |

完整故障排除：[/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## Slack

### Slack 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| --- | --- | --- |
| Socket 模式已连接但无响应 | `openclaw channels status --probe` | 验证 app token + bot token 和所需权限范围。 |
| 私信被阻止 | `openclaw pairing list slack` | 批准配对或放宽私信策略。 |
| 频道消息被忽略 | 检查 `groupPolicy` 和频道 allowlist | 允许该频道或将策略切换为 `open`。 |

完整故障排除：[/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessage 和 BlueBubbles

### iMessage 和 BlueBubbles 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| --- | --- | --- |
| 无入站事件 | 验证 webhook/服务器可达性和应用权限 | 修复 webhook URL 或 BlueBubbles 服务器状态。 |
| macOS 上可发送但无法接收 | 检查 Messages 自动化的 macOS 隐私权限 | 重新授予 TCC 权限并重启频道进程。 |
| 私信发送者被阻止 | `openclaw pairing list imessage` 或 `openclaw pairing list bluebubbles` | 批准配对或更新 allowlist。 |

完整故障排除：

- [/channels/imessage#troubleshooting](/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/channels/bluebubbles#troubleshooting)

## Signal

### Signal 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| --- | --- | --- |
| 守护进程可达但 bot 沉默 | `openclaw channels status --probe` | 验证 `signal-cli` 守护进程 URL/账户和接收模式。 |
| 私信被阻止 | `openclaw pairing list signal` | 批准发送者或调整私信策略。 |
| 群组回复不触发 | 检查群组 allowlist 和提及模式 | 添加发送者/群组或放宽门控。 |

完整故障排除：[/channels/signal#troubleshooting](/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| --- | --- | --- |
| Bot 回复"gone to Mars" | 验证配置中的 `appId` 和 `clientSecret` | 设置凭据或重启 gateway。 |
| 无入站消息 | `openclaw channels status --probe` | 在 QQ 开放平台验证凭据。 |
| 语音未转录 | 检查 STT provider 配置 | 配置 `channels.qqbot.stt` 或 `tools.media.audio`。 |
| 主动消息未到达 | 检查 QQ 平台交互要求 | QQ 可能会阻止没有近期交互的 bot 发起消息。 |

完整故障排除：[/channels/qqbot#troubleshooting](/channels/qqbot#troubleshooting)

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
