---
mmh3_hash: "302354d9fc73f9b8b7b8e145d4f68f7d"
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

- `openclaw gateway status` 显示 `Runtime: running`、`Connectivity probe: ok` 和一行 `Capability: ...`。
- `openclaw doctor` 报告没有阻塞的配置/服务问题。
- `openclaw channels status --probe` 显示实时每账户传输状态，以及在支持的情况下探测/审计结果（如 `works` 或 `audit ok`）。

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
2. 使用符合长上下文请求条件的 Anthropic 凭证，或切换到 Anthropic API 密钥。
3. 配置备用模型,以便在 Anthropic 长上下文请求被拒绝时运行继续。

相关:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 本地 OpenAI 兼容后端通过直接探测但 Agent 运行失败

当以下情况时使用:

- `curl ... /v1/models` 有效
- 小型直接 `/v1/chat/completions` 调用有效
- OpenClaw 模型运行仅在正常 Agent 轮次上失败

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

查找:

- 直接小型调用成功,但 OpenClaw 运行仅在较大提示上失败
- 关于 `messages[].content` 期望字符串的后端错误
- 仅在较大提示 token 数量或完整 Agent 运行时提示下出现的后端崩溃

常见特征:

- `messages[...].content: invalid type: sequence, expected a string` → 后端拒绝结构化 Chat Completions 内容部分。修复:设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 直接小型请求成功,但 OpenClaw Agent 运行因后端/模型崩溃而失败(例如某些 `inferrs` 构建上的 Gemma) → OpenClaw 传输层可能已经正确；后端在较大的 Agent 运行时提示形状上失败。
- 禁用工具后失败减少但未消失 → 工具 schema 是部分原因,但剩余问题仍然是上游模型/服务器容量或后端 bug。

修复选项:

1. 为仅字符串 Chat Completions 后端设置 `compat.requiresStringContent: true`。
2. 为无法可靠处理 OpenClaw 工具 schema 的模型/后端设置 `compat.supportsTools: false`。
3. 尽可能降低提示压力:更小的 workspace 引导、更短的 Session 历史、更轻量的本地模型，或支持更强长上下文的后端。
4. 如果小型直接请求持续通过而 OpenClaw Agent 轮次仍在后端内崩溃,将其视为上游服务器/模型限制,并使用接受的负载形状在那里提交复现报告。

相关:

- [/gateway/local-models](/gateway/local-models)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/gateway/configuration-reference#openai-compatible-endpoints)

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

常见特征：

- `device identity required` → 非安全上下文或缺少设备认证。
- `origin not allowed` → 浏览器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或者您从非回环浏览器源连接而没有明确的允许列表）。
- `device nonce required` / `device nonce mismatch` → 客户端未完成基于挑战的设备认证流程（`connect.challenge` + `device.nonce`）。
- `device signature invalid` / `device signature expired` → 客户端为当前握手签署了错误的负载（或陈旧的时间戳）。
- `AUTH_TOKEN_MISMATCH` 带 `canRetryWithDeviceToken=true` → 客户端可以使用缓存的设备令牌进行一次受信任的重试。该缓存令牌重试复用与配对设备令牌一起存储的缓存范围集。明确 `deviceToken` / 明确 `scopes` 的调用者保留其请求的范围集。
- 在该重试路径之外，连接认证优先级为：明确共享 token/password 优先，然后是明确 `deviceToken`，然后是存储的设备令牌，最后是引导令牌。
- 在异步 Tailscale Serve Control UI 路径上，来自同一客户端的同一 `{scope, ip}` 失败尝试在限制器记录失败之前会被序列化。因此，来自同一客户端的两次并发错误重试可能会在第二次尝试时显示 `retry later` 而不是两次普通的不匹配。
- `too many failed authentication attempts (retry later)` 来自浏览器源回环客户端 → 来自同一规范化 `Origin` 的重复失败会被临时锁定；另一个 localhost 源使用独立的计数桶。
- 在该重试后重复 `unauthorized` → 共享令牌/设备令牌漂移；刷新令牌配置并在需要时重新批准/轮换设备令牌。
- `gateway connect failed:` → 错误的主机/端口/URL 目标。

### 认证详细代码快速映射

使用失败的 `connect` 响应中的 `error.details.code` 选择下一步操作:

| 详细代码                  | 含义                                                  | 推荐操作                                                                                                                                                                   |
| ---------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 客户端未发送所需的共享令牌。             | 在客户端粘贴/设置令牌并重试。对于 dashboard 路径:`openclaw config get gateway.auth.token` 然后粘贴到 Control UI 设置中。                          |
| `AUTH_TOKEN_MISMATCH`        | 共享令牌与 Gateway 认证令牌不匹配。           | 如果 `canRetryWithDeviceToken=true`，允许一次受信任的重试。缓存令牌重试复用已存储的批准范围；明确 `deviceToken` / `scopes` 的调用者保留请求的范围。如果仍然失败，运行[令牌漂移恢复清单](/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 缓存的每设备令牌过时或已撤销。             | 使用[设备 CLI](/cli/devices) 轮换/重新批准设备令牌,然后重新连接。                                                                                    |
| `PAIRING_REQUIRED`           | 设备身份需要批准。检查 `error.details.reason` 中的 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，并在存在时使用 `requestId` / `remediationHint`。 | 批准待处理请求:`openclaw devices list` 然后 `openclaw devices approve <requestId>`。范围/角色升级在您审查请求的访问权限后使用相同的流程。 |

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

如果 `openclaw devices rotate` / `revoke` / `remove` 意外被拒绝:

- 除非调用者也有 `operator.admin`,否则配对设备令牌 Session 只能管理**自己的**设备
- `openclaw devices rotate --scope ...` 只能请求调用者 Session 已持有的操作员范围

相关：

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/gateway/configuration)（Gateway 认证模式）
- [/gateway/trusted-proxy-auth](/gateway/trusted-proxy-auth)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway 服务未运行

当服务已安装但进程无法保持运行时使用。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 同时扫描系统级服务
```

查找：

- `Runtime: stopped` 带退出提示。
- 服务配置不匹配（`Config (cli)` vs `Config (service)`）。
- 端口/监听器冲突。
- 使用 `--deep` 时的额外 launchd/systemd/schtasks 安装。
- `Other gateway-like services detected (best effort)` 清理提示。

常见特征：

- `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 本地 Gateway 模式未启用，或配置文件被覆盖而丢失了 `gateway.mode`。修复：在配置中设置 `gateway.mode="local"`，或重新运行 `openclaw onboard --mode local` / `openclaw setup` 以重新标记预期的本地模式配置。如果您通过 Podman 运行 OpenClaw，默认配置路径为 `~/.openclaw/openclaw.json`。
- `refusing to bind gateway ... without auth` → 非回环绑定没有有效的 Gateway 认证路径（token/password，或已配置的 trusted-proxy）。
- `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。
- `Other gateway-like services detected (best effort)` → 存在过时或并行的 launchd/systemd/schtasks 单元。大多数设置应在每台机器上保持一个 Gateway；如果确实需要多个，请隔离端口 + 配置/状态/工作区。参见 [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)。

相关：

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## Gateway 探测警告

当 `openclaw gateway probe` 可以访问到某处但仍然打印警告块时使用。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

查找：

- JSON 输出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否关于 SSH 回退、多个 Gateway、缺少范围或未解析的认证引用。

常见特征：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 设置失败，但命令仍然尝试直接配置/回环目标。
- `multiple reachable gateways detected` → 多个目标响应。通常意味着有意的多 Gateway 设置或过时/重复的监听器。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 连接成功，但详细读取探测受范围限制；配对设备身份或使用具有 `operator.read` 的凭证。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文本 → 认证材料在失败目标的此命令路径中不可用。

相关：

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)
- [/gateway/remote](/gateway/remote)

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

查找：

- Cron 已启用且下次唤醒存在。
- 作业运行历史状态（`ok`、`skipped`、`error`）。
- Heartbeat 跳过原因（`quiet-hours`、`requests-in-flight`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

常见特征：

- `cron: scheduler disabled; jobs will not run automatically` → Cron 已禁用。
- `cron: timer tick failed` → 调度器滴答失败；检查文件/日志/运行时错误。
- `heartbeat skipped` 带 `reason=quiet-hours` → 在活跃时间窗口外。
- `heartbeat skipped` 带 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在但只包含空行 / Markdown 标题，所以 OpenClaw 跳过模型调用。
- `heartbeat skipped` 带 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 块，但没有任务在此次滴答时到期。
- `heartbeat: unknown accountId` → Heartbeat 交付目标的账户 ID 无效。
- `heartbeat skipped` 带 `reason=dm-blocked` → Heartbeat 目标解析为 DM 风格的目的地，而 `agents.defaults.heartbeat.directPolicy`（或每个 Agent 的覆盖）设置为 `block`。

相关：

- [/automation/cron-jobs#troubleshooting](/automation/cron-jobs#troubleshooting)
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

查找：

- `plugins.allow` 是否已设置并包含 `browser`。
- 有效的 Browser 可执行文件路径。
- CDP 配置文件可达性。
- `existing-session` / `user` 配置文件的本地 Chrome 可用性。

常见特征：

- `unknown command "browser"` 或 `unknown command 'browser'` → 捆绑的 Browser 插件被 `plugins.allow` 排除。
- browser 工具缺失/不可用而 `browser.enabled=true` → `plugins.allow` 排除了 `browser`，导致插件从未加载。
- `Failed to start Chrome CDP on port` → Browser 进程启动失败。
- `browser.executablePath not found` → 配置的路径无效。
- `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不支持的方案，如 `file:` 或 `ftp:`。
- `browser.cdpUrl has invalid port` → 配置的 CDP URL 端口无效或超出范围。
- `No Chrome tabs found for profile="user"` → Chrome MCP 附加配置文件没有打开的本地 Chrome 标签。
- `Remote CDP for profile "<name>" is not reachable` → 配置的远程 CDP 端点无法从 Gateway 主机访问。
- `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 仅附加配置文件没有可访问的目标，或 HTTP 端点有响应但 CDP WebSocket 仍无法打开。
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 当前 Gateway 安装缺少完整的 Playwright 包；ARIA 快照和基本页面截图仍可工作，但导航、AI 快照、CSS 选择器元素截图和 PDF 导出不可用。
- `fullPage is not supported for element screenshots` → 截图请求混合了 `--full-page` 和 `--ref` 或 `--element`。
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 截图调用必须使用页面捕获或快照 `--ref`，而不是 CSS `--element`。
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上传钩子需要快照 refs，而不是 CSS 选择器。
- `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 配置文件上每次调用发送一个上传。
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 配置文件上的对话框钩子不支持超时覆盖。
- `response body is not supported for existing-session profiles yet.` → `responsebody` 仍然需要托管浏览器或原始 CDP 配置文件。
- 仅附加或远程 CDP 配置文件上的过时视口 / 深色模式 / 区域设置 / 离线覆盖 → 运行 `openclaw browser stop --browser-profile <name>` 关闭活动控制 Session 并释放 Playwright/CDP 仿真状态，而无需重启整个 Gateway。

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
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

检查内容：

- 非回环绑定（`lan`、`tailnet`、`custom`）需要有效的 Gateway 认证路径：共享 token/password 认证，或正确配置的非回环 `trusted-proxy` 部署。
- 像 `gateway.token` 这样的旧密钥不替代 `gateway.auth.token`。

常见特征:

- `refusing to bind gateway ... without auth` → 绑定+认证不匹配。
- `Connectivity probe: failed` 而运行时正在运行 → Gateway 活跃但当前认证/URL 无法访问。

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
