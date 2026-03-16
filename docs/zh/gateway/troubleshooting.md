---
mmh3_hash: "55e3506a32b7834d4a756982be95439c"
summary: "Gateway、Channel、自动化、节点和 Browser 的深度故障排除运行手册"
read_when:
  - 故障排除中心将您引导到这里进行更深入的诊断
  - 您需要基于症状的稳定运行手册章节和确切命令
title: "故障排除"
---

# Gateway 故障排除

本页是深度运行手册。
如果您想要快速分类流程,请先从 [/help/troubleshooting](/help/troubleshooting) 开始。

## 命令阶梯

首先按顺序运行这些:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

预期的健康信号:

- `openclaw gateway status` 显示 `Runtime: running` 和 `RPC probe: ok`。
- `openclaw doctor` 报告没有阻塞的配置/服务问题。
- `openclaw channels status --probe` 显示已连接/就绪的 Channel。

## Anthropic 429 长上下文需要额外使用

当日志/错误包含以下内容时使用:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

查找:

- 选定的 Anthropic Opus/Sonnet 模型具有 `params.context1m: true`。
- 当前 Anthropic 凭证不符合长上下文使用条件。
- 仅在需要 1M beta 路径的长 Session/模型运行上请求失败。

修复选项:

1. 禁用该模型的 `context1m` 以回退到普通上下文窗口。
2. 使用带计费的 Anthropic API 密钥,或在订阅账户上启用 Anthropic Extra Usage。
3. 配置备用模型,以便在 Anthropic 长上下文请求被拒绝时运行继续。

相关:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 无回复

如果 Channel 已启动但没有任何回应,在重新连接任何内容之前检查路由和策略。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

查找:

- DM 发送者的配对待处理。
- 群组提及门控(`requireMention`、`mentionPatterns`)。
- Channel/群组允许列表不匹配。

常见特征:

- `drop guild message (mention required` → 群组消息被忽略直到提及。
- `pairing request` → 发送者需要批准。
- `blocked` / `allowlist` → 发送者/Channel 被策略过滤。

相关:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/pairing](/channels/pairing)
- [/channels/groups](/channels/groups)

## Dashboard Control UI 连接

当 dashboard/control UI 无法连接时,验证 URL、认证模式和安全上下文假设。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

查找:

- 正确的探测 URL 和 dashboard URL。
- 客户端和 Gateway 之间的认证模式/令牌不匹配。
- 需要设备身份的地方使用了 HTTP。

常见特征:

- `device identity required` → 非安全上下文或缺少设备认证。
- `device nonce required` / `device nonce mismatch` → 客户端未完成基于挑战的设备认证流程(`connect.challenge` + `device.nonce`)。
- `device signature invalid` / `device signature expired` → 客户端为当前握手签署了错误的负载(或陈旧的时间戳)。
- `AUTH_TOKEN_MISMATCH` 带 `canRetryWithDeviceToken=true` → 客户端可以使用缓存的设备令牌进行一次受信任的重试。
- 在该重试后重复 `unauthorized` → 共享令牌/设备令牌漂移;刷新令牌配置并在需要时重新批准/轮换设备令牌。
- `gateway connect failed:` → 错误的主机/端口/URL 目标。

### 认证详细代码快速映射

使用失败的 `connect` 响应中的 `error.details.code` 选择下一步操作:

| 详细代码                  | 含义                                                  | 推荐操作                                                                                                                                                                   |
| ---------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 客户端未发送所需的共享令牌。             | 在客户端粘贴/设置令牌并重试。对于 dashboard 路径:`openclaw config get gateway.auth.token` 然后粘贴到 Control UI 设置中。                          |
| `AUTH_TOKEN_MISMATCH`        | 共享令牌与 Gateway 认证令牌不匹配。           | 如果 `canRetryWithDeviceToken=true`,允许一次受信任的重试。如果仍然失败,运行[令牌漂移恢复清单](/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 缓存的每设备令牌过时或已撤销。             | 使用[设备 CLI](/cli/devices) 轮换/重新批准设备令牌,然后重新连接。                                                                                    |
| `PAIRING_REQUIRED`           | 设备身份已知但未批准此角色。 | 批准待处理请求:`openclaw devices list` 然后 `openclaw devices approve <requestId>`。                                                                        |

设备认证 v2 迁移检查:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果日志显示 nonce/签名错误,更新连接的客户端并验证它:

1. 等待 `connect.challenge`
2. 签署挑战绑定的负载
3. 发送与挑战 nonce 相同的 `connect.params.device.nonce`

相关:

- [/web/control-ui](/web/control-ui)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway 服务未运行

当服务已安装但进程无法保持运行时使用。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep
```

查找:

- `Runtime: stopped` 带退出提示。
- 服务配置不匹配(`Config (cli)` vs `Config (service)`)。
- 端口/监听器冲突。

常见特征:

- `Gateway start blocked: set gateway.mode=local` → 本地 Gateway 模式未启用。修复:在配置中设置 `gateway.mode="local"`(或运行 `openclaw configure`)。如果您通过 Podman 使用专用的 `openclaw` 用户运行 OpenClaw,配置位于 `~openclaw/.openclaw/openclaw.json`。
- `refusing to bind gateway ... without auth` → 非回环绑定没有令牌/密码。
- `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。

相关:

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## Channel 已连接但消息未流动

如果 Channel 状态已连接但消息流死亡,重点关注策略、权限和特定于 Channel 的交付规则。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

查找:

- DM 策略(`pairing`、`allowlist`、`open`、`disabled`)。
- 群组允许列表和提及要求。
- 缺少 Channel API 权限/范围。

常见特征:

- `mention required` → 消息被群组提及策略忽略。
- `pairing` / 待批准跟踪 → 发送者未被批准。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → Channel 认证/权限问题。

相关:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/whatsapp](/channels/whatsapp)
- [/channels/telegram](/channels/telegram)
- [/channels/discord](/channels/discord)

## Cron 和 Heartbeat 交付

如果 Cron 或 Heartbeat 未运行或未交付,首先验证调度器状态,然后是交付目标。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

查找:

- Cron 已启用且下次唤醒存在。
- 作业运行历史状态(`ok`、`skipped`、`error`)。
- Heartbeat 跳过原因(`quiet-hours`、`requests-in-flight`、`alerts-disabled`)。

常见特征:

- `cron: scheduler disabled; jobs will not run automatically` → Cron 已禁用。
- `cron: timer tick failed` → 调度器滴答失败;检查文件/日志/运行时错误。
- `heartbeat skipped` 带 `reason=quiet-hours` → 在活跃时间窗口外。
- `heartbeat: unknown accountId` → Heartbeat 交付目标的账户 ID 无效。
- `heartbeat skipped` 带 `reason=dm-blocked` → Heartbeat 目标解析为 DM 风格的目的地,而 `agents.defaults.heartbeat.directPolicy`(或每个 Agent 的覆盖)设置为 `block`。

相关:

- [/automation/troubleshooting](/automation/troubleshooting)
- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## 节点配对工具失败

如果节点已配对但工具失败,隔离前台、权限和审批状态。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

查找:

- 节点在线具有预期能力。
- camera/mic/location/screen 的 OS 权限授予。
- Exec 审批和允许列表状态。

常见特征:

- `NODE_BACKGROUND_UNAVAILABLE` → 节点应用必须在前台。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少 OS 权限。
- `SYSTEM_RUN_DENIED: approval required` → exec 审批待处理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被允许列表阻止。

相关:

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## Browser 工具失败

当 Browser 工具操作失败即使 Gateway 本身健康时使用。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

查找:

- 有效的 Browser 可执行文件路径。
- CDP 配置文件可达性。
- `existing-session` / `user` 配置文件的本地 Chrome 可用性。

常见特征:

- `Failed to start Chrome CDP on port` → Browser 进程启动失败。
- `browser.executablePath not found` → 配置的路径无效。
- `No Chrome tabs found for profile="user"` → Chrome MCP 附加配置文件没有打开的本地 Chrome 标签。
- `Browser attachOnly is enabled ... not reachable` → 仅附加配置文件没有可访问的目标。

相关:

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/browser](/tools/browser)

## 升级后某些东西突然坏了

大多数升级后的故障是配置漂移或现在正在执行的更严格默认值。

### 1) 认证和 URL 覆盖行为已更改

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

检查内容:

- 如果 `gateway.mode=remote`,CLI 调用可能定向到远程而您的本地服务正常。
- 明确的 `--url` 调用不会回退到存储的凭证。

常见特征:

- `gateway connect failed:` → 错误的 URL 目标。
- `unauthorized` → 端点可访问但认证错误。

### 2) 绑定和认证护栏更严格

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

检查内容:

- 非回环绑定(`lan`、`tailnet`、`custom`)需要配置认证。
- 像 `gateway.token` 这样的旧密钥不替代 `gateway.auth.token`。

常见特征:

- `refusing to bind gateway ... without auth` → 绑定+认证不匹配。
- `RPC probe: failed` 而运行时正在运行 → Gateway 活跃但当前认证/URL 无法访问。

### 3) 配对和设备身份状态已更改

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

检查内容:

- dashboard/节点的待处理设备批准。
- 策略或身份更改后的待处理 DM 配对批准。

常见特征:

- `device identity required` → 设备认证未满足。
- `pairing required` → 发送者/设备必须被批准。

如果检查后服务配置和运行时仍不一致,从同一配置文件/状态目录重新安装服务元数据:

```bash
openclaw gateway install --force
openclaw gateway restart
```

相关:

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
