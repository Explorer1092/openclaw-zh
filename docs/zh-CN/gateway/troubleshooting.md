---
read_when:
  - 故障排查 Hub 将你指向此处进行深度诊断
  - 需要基于症状的稳定运行手册章节和精确命令
summary: Gateway 网关、渠道、自动化、节点和浏览器的深度故障排查运行手册
title: 故障排查
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: anthropic
  source_hash: e2985452e5275ed6d4d4fce4fba6d24d74bbd6826adb929e2e8687346b6d24f8
  source_path: gateway/troubleshooting.md
  workflow: 15
---

# Gateway 网关故障排查

本页是深度运行手册。
如果你想先走快速分类流程，请从 [/help/troubleshooting](/help/troubleshooting) 开始。

## 命令阶梯

按顺序先执行这些命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

预期健康信号：

- `openclaw gateway status` 显示 `Runtime: running` 和 `RPC probe: ok`。
- `openclaw doctor` 报告无阻塞性配置/服务问题。
- `openclaw channels status --probe` 显示已连接/就绪的渠道。

## Anthropic 429 长上下文需要额外用量

当日志/错误包含以下内容时使用：
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

检查项：

- 所选 Anthropic Opus/Sonnet 模型是否设置了 `params.context1m: true`。
- 当前 Anthropic 凭证是否不支持长上下文用量。
- 请求是否仅在需要 1M beta 路径的长会话/模型运行时失败。

修复选项：

1. 为该模型禁用 `context1m` 以回退到正常上下文窗口。
2. 使用有计费的 Anthropic API 密钥，或在订阅账户上启用 Anthropic Extra Usage。
3. 配置回退模型，使 Anthropic 长上下文请求被拒绝时运行仍可继续。

相关：

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 无回复

如果渠道已运行但没有任何响应，在重新连接任何东西之前先检查路由和策略。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

检查项：

- DM 发送者的配对是否待处理。
- 群组提及门控（`requireMention`、`mentionPatterns`）。
- 渠道/群组允许列表不匹配。

常见特征：

- `drop guild message (mention required` → 群组消息被忽略，直到被提及。
- `pairing request` → 发送者需要审批。
- `blocked` / `allowlist` → 发送者/渠道被策略过滤。

相关：

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/pairing](/channels/pairing)
- [/channels/groups](/channels/groups)

## 仪表板 Control UI 连接问题

当仪表板/Control UI 无法连接时，验证 URL、认证模式和安全上下文假设。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

检查项：

- 正确的探测 URL 和仪表板 URL。
- 客户端与 Gateway 网关之间的认证模式/令牌不匹配。
- 需要设备身份验证的地方使用了 HTTP。

常见特征：

- `device identity required` → 非安全上下文或缺少设备认证。
- `device nonce required` / `device nonce mismatch` → 客户端未完成基于质询的设备认证流程（`connect.challenge` + `device.nonce`）。
- `device signature invalid` / `device signature expired` → 客户端对当前握手签署了错误的负载（或时间戳已过期）。
- `AUTH_TOKEN_MISMATCH` 且 `canRetryWithDeviceToken=true` → 客户端可以用缓存的设备令牌进行一次可信重试。
- 重试后仍然 `unauthorized` → 共享令牌/设备令牌漂移；刷新令牌配置并根据需要重新审批/轮换设备令牌。
- `gateway connect failed:` → 目标主机/端口/URL 错误。

### 认证详细代码快速映射

使用失败的 `connect` 响应中的 `error.details.code` 来确定下一步操作：

| 详细代码                     | 含义                                 | 推荐操作                                                                                                                                                                            |
| ---------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 客户端未发送所需的共享令牌。         | 在客户端粘贴/设置令牌并重试。对于仪表板路径：`openclaw config get gateway.auth.token`，然后粘贴到 Control UI 设置中。                                                              |
| `AUTH_TOKEN_MISMATCH`        | 共享令牌与 Gateway 网关认证令牌不匹配。 | 如果 `canRetryWithDeviceToken=true`，允许一次可信重试。如果仍然失败，运行[令牌漂移恢复清单](/cli/devices#token-drift-recovery-checklist)。                                          |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 缓存的每设备令牌已过期或被撤销。     | 使用 [devices CLI](/cli/devices) 轮换/重新审批设备令牌，然后重新连接。                                                                                                              |
| `PAIRING_REQUIRED`           | 设备身份已知但未为此角色审批。       | 审批待处理请求：`openclaw devices list` 然后 `openclaw devices approve <requestId>`。                                                                                               |

设备认证 v2 迁移检查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果日志显示 nonce/签名错误，更新连接客户端并验证它：

1. 等待 `connect.challenge`
2. 对绑定质询的负载进行签名
3. 在 `connect.params.device.nonce` 中发送相同的质询 nonce

相关：

- [/web/control-ui](/web/control-ui)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway 网关服务未运行

当服务已安装但进程无法持续运行时使用。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep
```

检查项：

- 带有退出提示的 `Runtime: stopped`。
- 服务配置不匹配（`Config (cli)` 与 `Config (service)`）。
- 端口/监听器冲突。

常见特征：

- `Gateway start blocked: set gateway.mode=local` → 本地 Gateway 网关模式未启用。修复：在配置中设置 `gateway.mode="local"`（或运行 `openclaw configure`）。如果通过 Podman 运行 OpenClaw，默认配置路径为 `~/.openclaw/openclaw.json`。
- `refusing to bind gateway ... without auth` → 非 loopback 绑定但未配置令牌/密码。
- `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。

相关：

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## 渠道已连接但消息未流动

如果渠道状态显示已连接但消息流量中断，重点检查策略、权限和渠道特定的投递规则。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

检查项：

- DM 策略（`pairing`、`allowlist`、`open`、`disabled`）。
- 群组允许列表和提及要求。
- 缺少渠道 API 权限/作用域。

常见特征：

- `mention required` → 消息因群组提及策略被忽略。
- `pairing` / 待处理审批追踪 → 发送者未被审批。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → 渠道认证/权限问题。

相关：

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/whatsapp](/channels/whatsapp)
- [/channels/telegram](/channels/telegram)
- [/channels/discord](/channels/discord)

## Cron 和心跳投递

如果 Cron 或心跳未运行或未投递，先验证调度器状态，再检查投递目标。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

检查项：

- Cron 已启用且存在下次唤醒时间。
- Job 运行历史状态（`ok`、`skipped`、`error`）。
- 心跳跳过原因（`quiet-hours`、`requests-in-flight`、`alerts-disabled`）。

常见特征：

- `cron: scheduler disabled; jobs will not run automatically` → Cron 已禁用。
- `cron: timer tick failed` → 调度器 tick 失败；检查文件/日志/运行时错误。
- `heartbeat skipped` 且 `reason=quiet-hours` → 在活跃时段窗口之外。
- `heartbeat: unknown accountId` → 心跳投递目标的 account id 无效。
- `heartbeat skipped` 且 `reason=dm-blocked` → 心跳目标解析为 DM 类型目标，而 `agents.defaults.heartbeat.directPolicy`（或每智能体覆盖）设置为 `block`。

相关：

- [/automation/troubleshooting](/automation/troubleshooting)
- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## 已配对的节点工具失败

如果节点已配对但工具失败，隔离前台状态、权限和审批状态。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

检查项：

- 节点在线且具有预期能力。
- 摄像头/麦克风/位置/屏幕的操作系统权限授予情况。
- Exec 审批和允许列表状态。

常见特征：

- `NODE_BACKGROUND_UNAVAILABLE` → 节点应用必须处于前台。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少操作系统权限。
- `SYSTEM_RUN_DENIED: approval required` → Exec 审批待处理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被允许列表阻止。

相关：

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## 浏览器工具失败

当 Gateway 网关本身健康但浏览器工具操作失败时使用。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

检查项：

- `plugins.allow` 是否已设置且包含 `browser`。
- 有效的浏览器可执行文件路径。
- CDP Profile 可达性。
- `existing-session` / `user` Profile 的本地 Chrome 可用性。

常见特征：

- `unknown command "browser"` 或 `unknown command 'browser'` → 捆绑的浏览器插件被 `plugins.allow` 排除。
- `browser.enabled=true` 时浏览器工具缺失/不可用 → `plugins.allow` 排除了 `browser`，导致插件从未加载。
- `Failed to start Chrome CDP on port` → 浏览器进程启动失败。
- `browser.executablePath not found` → 配置的路径无效。
- `No Chrome tabs found for profile="user"` → Chrome MCP 附加 Profile 没有打开的本地 Chrome 标签页。
- `Browser attachOnly is enabled ... not reachable` → 仅附加模式 Profile 没有可达目标。

相关：

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/browser](/tools/browser)

## 升级后某些功能突然失效

大多数升级后的问题是配置漂移或更严格的默认值现在被强制执行。

### 1) 认证和 URL 覆盖行为发生变化

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

检查项：

- 如果 `gateway.mode=remote`，CLI 调用可能指向远端，而本地服务实际上是正常的。
- 显式 `--url` 调用不会回退到存储的凭证。

常见特征：

- `gateway connect failed:` → URL 目标错误。
- `unauthorized` → 端点可达但认证错误。

### 2) 绑定和认证护栏更加严格

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

检查项：

- 非 loopback 绑定（`lan`、`tailnet`、`custom`）需要配置认证。
- 旧密钥如 `gateway.token` 不能替代 `gateway.auth.token`。

常见特征：

- `refusing to bind gateway ... without auth` → 绑定与认证不匹配。
- `RPC probe: failed` 而运行时正在运行 → Gateway 网关存活但当前认证/URL 无法访问。

### 3) 配对和设备身份状态发生变化

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

检查项：

- 仪表板/节点的待处理设备审批。
- 策略或身份变更后的待处理 DM 配对审批。

常见特征：

- `device identity required` → 设备认证未满足。
- `pairing required` → 发送者/设备必须被审批。

如果服务配置和运行时在检查后仍然不一致，从相同的 Profile/状态目录重新安装服务元数据：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相关：

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
