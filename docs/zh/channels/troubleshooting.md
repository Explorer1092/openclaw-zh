---
mmh3_hash: "095ab86b40f977ac8dd965182745862f"
summary: "按 Channel 分类的故障特征和修复方案，快速排查 Channel 级问题"
read_when:
  - Channel 传输层显示已连接但回复失败
  - 在深入查看 Provider 文档之前需要特定 Channel 的检查步骤
title: "Channel 故障排除"
---

当 Channel 连接但行为异常时，使用本页面进行排查。

## 命令检查顺序

按顺序优先运行以下命令：

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
- Channel probe 显示传输已连接，在支持的情况下显示 `works` 或 `audit ok`

## 更新后

当 Telegram、iMessage、BlueBubbles 时代的配置或其他 Plugin Channel 在更新后消失时使用此方法。

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

在 `openclaw status --all` 中查找 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`。这表示 Channel 已配置，但 Plugin 设置/加载路径遇到了损坏的依赖树，而未能注册 Channel。`openclaw doctor --fix` 会删除过时的 Plugin 依赖暂存目录和过时的认证影子文件，然后 `openclaw gateway restart` 重新加载干净的状态。

## WhatsApp

### WhatsApp 故障特征

| 症状                     | 最快检查方式                                          | 修复方案                                                                           |
| ------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 已连接但没有私信回复     | `openclaw pairing list whatsapp`                      | 批准发送者或切换私信策略/allowlist。                                               |
| 群组消息被忽略           | 检查配置中的 `requireMention` + 提及模式              | 提及机器人或放宽该群组的提及策略。                                                 |
| 二维码登录超时 408       | 检查 Gateway 的 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量 | 设置可访问的代理；仅对绕过使用 `NO_PROXY`。                                        |
| 随机断开/重新登录循环    | `openclaw channels status --probe` + 日志             | 即使当前已连接，最近的重连也会被标记；观察日志，重启 Gateway，若仍抖动则重新关联。 |
| `status=408 Request Time-out` 循环 | Probe、日志、doctor，然后 Gateway 状态 | 先修复主机连接/计时问题；如果循环持续，备份认证数据并重新关联账户。 |
| 回复延迟数秒/分钟        | `openclaw doctor --fix`                               | Doctor 会停止经验证的过时本地 TUI 客户端，以避免它们降低 Gateway 事件循环性能。    |

完整故障排除：[WhatsApp 故障排除](/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 故障特征

| 症状                            | 最快检查方式                                  | 修复方案                                                                                                       |
| ------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `/start` 但没有可用的回复流程   | `openclaw pairing list telegram`              | 批准配对或更改私信策略。                                                                                       |
| 机器人在线但群组保持沉默        | 验证提及要求和机器人隐私模式                  | 禁用群组可见性的隐私模式或提及机器人。                                                                         |
| 发送失败并出现网络错误          | 检查日志中的 Telegram API 调用失败            | 修复到 `api.telegram.org` 的 DNS/IPv6/代理路由。                                                               |
| 启动时报告 `getMe returned 401` | 检查配置的 Token 来源                         | 重新复制或重新生成 BotFather Token，并更新 `botToken`、`tokenFile` 或默认账户 `TELEGRAM_BOT_TOKEN`。           |
| 轮询停滞或重连缓慢              | `openclaw logs --follow` 查看轮询诊断         | 升级；如果重启是误报，调整 `pollingStallThresholdMs`。持续停滞仍指向代理/DNS/IPv6 问题。                       |
| 启动时 `setMyCommands` 被拒绝   | 检查日志中的 `BOT_COMMANDS_TOO_MUCH`          | 减少 Plugin/Skill/自定义 Telegram 命令或禁用原生菜单。                                                         |
| 升级后 allowlist 阻止您         | `openclaw security audit` 和配置 allowlist    | 运行 `openclaw doctor --fix` 或将 `@username` 替换为数字发送者 ID。                                            |

完整故障排除：[Telegram 故障排除](/channels/telegram#troubleshooting)

## Discord

### Discord 故障特征

| 症状                                 | 最快检查方式                                                                                                              | 修复方案                                                                                                                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 机器人在线但无服务器回复             | `openclaw channels status --probe`                                                                                        | 允许服务器/频道并验证消息内容 Intent。                                                                                                                                                                                 |
| 群组消息被忽略                       | 检查日志中的提及门控丢弃                                                                                                  | 提及机器人或设置服务器/频道 `requireMention: false`。                                                                                                                                                                  |
| 有打字/Token 消耗但没有 Discord 消息 | 检查是否为环境房间事件，或是否为模型错过 `message(action=send)` 的 `message_tool` 房间                                    | 检查 Gateway 详细日志中被抑制的最终负载元数据，验证 `messages.groupChat.unmentionedInbound`，阅读[环境房间事件](/channels/ambient-room-events)，或对正常群组请求保留 `messages.groupChat.visibleReplies: "automatic"`。 |
| 私信回复缺失                         | `openclaw pairing list discord`                                                                                           | 批准私信配对或调整私信策略。                                                                                                                                                                                           |

完整故障排除：[Discord 故障排除](/channels/discord#troubleshooting)

## Slack

### Slack 故障特征

| 症状                        | 最快检查方式                               | 修复方案                                                                                                                                             |
| --------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket Mode 已连接但无响应  | `openclaw channels status --probe`         | 验证应用 Token + 机器人 Token 及所需权限范围；注意 SecretRef 支持的设置中 `botTokenStatus` / `appTokenStatus = configured_unavailable` 的情况。 |
| 私信被阻止                  | `openclaw pairing list slack`              | 批准配对或放宽私信策略。                                                                                                                             |
| 频道消息被忽略              | 检查 `groupPolicy` 和频道 allowlist        | 允许该频道或将策略切换为 `open`。                                                                                                                    |

完整故障排除：[Slack 故障排除](/channels/slack#troubleshooting)

## iMessage

### iMessage 故障特征

| 症状                           | 最快检查方式                                              | 修复方案                                                               |
| ------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| 非 macOS 上缺少或失败的 `imsg` | `openclaw channels status --probe --channel imessage`     | 在 Messages Mac 上运行 OpenClaw，或为 `cliPath` 使用 SSH 包装器。      |
| macOS 上可以发送但无法接收     | 检查 Messages 自动化的 macOS 隐私权限                     | 重新授予 TCC 权限并重启 Channel 进程。                                  |
| 私信发送者被阻止               | `openclaw pairing list imessage`                          | 批准配对或更新 allowlist。                                              |

完整故障排除：

- [iMessage 故障排除](/channels/imessage#troubleshooting)

## Signal

### Signal 故障特征

| 症状                     | 最快检查方式                               | 修复方案                                                      |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------- |
| 守护进程可达但机器人沉默 | `openclaw channels status --probe`         | 验证 `signal-cli` 守护进程 URL/账户和接收模式。               |
| 私信被阻止               | `openclaw pairing list signal`             | 批准发送者或调整私信策略。                                    |
| 群组回复不触发           | 检查群组 allowlist 和提及模式              | 添加发送者/群组或放宽门控。                                   |

完整故障排除：[Signal 故障排除](/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 故障特征

| 症状                     | 最快检查方式                               | 修复方案                                                         |
| ------------------------ | ------------------------------------------ | ---------------------------------------------------------------- |
| 机器人回复"gone to Mars" | 验证配置中的 `appId` 和 `clientSecret`     | 设置凭据或重启 Gateway。                                         |
| 没有入站消息             | `openclaw channels status --probe`         | 在 QQ 开放平台上验证凭据。                                       |
| 语音未被转录             | 检查 STT Provider 配置                     | 配置 `channels.qqbot.stt` 或 `tools.media.audio`。               |
| 主动消息未到达           | 检查 QQ 平台交互要求                       | QQ 可能会阻止没有最近互动的机器人发起消息。                      |

完整故障排除：[QQ Bot 故障排除](/channels/qqbot#troubleshooting)

## Matrix

### Matrix 故障特征

| 症状                          | 最快检查方式                               | 修复方案                                                                      |
| ----------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------- |
| 已登录但忽略房间消息          | `openclaw channels status --probe`         | 检查 `groupPolicy`、房间 allowlist 和提及门控。                               |
| 私信不处理                    | `openclaw pairing list matrix`             | 批准发送者或调整私信策略。                                                    |
| 加密房间失败                  | `openclaw matrix verify status`            | 重新验证设备，然后检查 `openclaw matrix verify backup status`。               |
| 备份恢复待处理/损坏           | `openclaw matrix verify backup status`     | 运行 `openclaw matrix verify backup restore` 或使用恢复密钥重新运行。         |
| 交叉签名/引导看起来有问题     | `openclaw matrix verify bootstrap`         | 一次性修复密钥存储、交叉签名和备份状态。                                      |

完整设置和配置：[Matrix](/channels/matrix)

## 相关

- [Pairing](/channels/pairing)
- [Channel routing](/channels/channel-routing)
- [Gateway troubleshooting](/gateway/troubleshooting)
