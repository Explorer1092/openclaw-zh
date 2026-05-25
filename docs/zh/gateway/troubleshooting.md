---
mmh3_hash: "868a76894162ca27d0b83db1437925df"
summary: "Gateway、Channel、自动化、节点和 Browser 的深度故障排除运行手册"
read_when:
  - 故障排除中心将您引导到这里进行更深入的诊断
  - 您需要基于症状的稳定运行手册章节和确切命令
title: "Troubleshooting"
sidebarTitle: "Troubleshooting"
---

本页是深度运行手册。如果您想要快速分类流程，请先从 [/help/troubleshooting](/help/troubleshooting) 开始。

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

## 更新后

当更新完成但 Gateway 宕机、Channel 为空或模型调用开始出现 401 错误时使用。

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

查找：

- `openclaw status` / `openclaw status --all` 中的 `Update restart`。待处理或失败的切换包含下一步要运行的命令。
- Channel 下的 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`。这意味着 Channel 配置仍然存在，但在 Channel 加载之前插件注册失败。
- 重新认证后的 Provider 401 错误。`openclaw doctor --fix` 检查过时的每 Agent OAuth 认证阴影并删除旧副本，使所有 Agent 解析当前共享 Profile。

## 裂脑安装和较新配置守护

当 Gateway 服务在更新后意外停止，或日志显示某个 `openclaw` 二进制文件比上次写入 `openclaw.json` 的版本更旧时使用。

OpenClaw 使用 `meta.lastTouchedVersion` 标记配置写入。只读命令仍然可以检查较新 OpenClaw 写入的配置，但进程和服务变更拒绝从较旧的二进制文件继续。被阻止的操作包括 Gateway 服务启动、停止、重启、卸载、强制服务重安装、服务模式 Gateway 启动以及 `gateway --force` 端口清理。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="修复 PATH">
    修复 `PATH`，使 `openclaw` 解析到较新的安装，然后重新运行该操作。
  </Step>
  <Step title="重新安装 Gateway 服务">
    从较新的安装中重新安装预期的 Gateway 服务：

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="删除过时的包装器">
    删除仍指向旧 `openclaw` 二进制文件的过时系统包或旧包装器条目。
  </Step>
</Steps>

<Warning>
仅用于有意降级或紧急恢复，为单个命令设置 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`。正常操作时保持未设置。
</Warning>

## 回滚后协议不匹配

当降级或回滚 OpenClaw 后日志持续打印 `protocol mismatch` 时使用。这意味着旧版 Gateway 正在运行，但较新的本地客户端进程仍在尝试以旧版 Gateway 无法处理的协议范围重新连接。

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

查找：

- Gateway 日志中的 `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`。
- `openclaw gateway status --deep` 中的 `Established clients:` 或 `openclaw doctor --deep` 中的 `Gateway clients`。这列出了连接到 Gateway 端口的活动 TCP 客户端，在 OS 允许的情况下包括 PID 和命令行。
- 命令行指向您回滚的较新 OpenClaw 安装或包装器的客户端进程。

修复：

1. 停止或重启 `gateway status --deep` 显示的过时 OpenClaw 客户端进程。
2. 重启嵌入 OpenClaw 的应用或包装器，例如本地 dashboard、编辑器、应用服务器助手或长时间运行的 `openclaw logs --follow` shell。
3. 重新运行 `openclaw gateway status --deep` 或 `openclaw doctor --deep`，确认过时的客户端 PID 已消失。

不要让旧版 Gateway 接受较新的不兼容协议。协议升级保护了线路契约；回滚恢复是进程/版本清理问题。

## Skill 符号链接被跳过（路径逃逸）

当日志包含以下内容时使用：

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw 将每个 Skill 根目录视为包含边界。当 `~/.agents/skills`、`<workspace>/.agents/skills`、`<workspace>/skills` 或 `~/.openclaw/skills` 下的符号链接的真实目标解析到该根目录之外时，除非目标已被显式信任，否则会被跳过。

检查链接：

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

如果目标是有意的，请同时配置直接 Skill 根目录和允许的符号链接目标：

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

然后启动新 Session 或等待 Skills 监视器刷新。如果运行中的进程早于配置更改，请重启 Gateway。

不要使用宽泛的目标，如 `~`、`/` 或整个同步的项目文件夹。将 `allowSymlinkTargets` 限定在包含受信任 `SKILL.md` 目录的真实 Skill 根目录范围内。

相关：

- [Skills 配置](/tools/skills-config#symlinked-sibling-repos)
- [配置示例](/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 长上下文需要额外使用

当日志/错误包含以下内容时使用:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

查找:

- 选定的 Anthropic 模型是具备 GA 能力的 1M Claude 4.x 模型，或该模型具有旧版 `params.context1m: true`。
- 当前 Anthropic 凭证不符合长上下文使用条件。
- 仅在需要 1M 上下文路径的长 Session/模型运行上请求失败。

修复选项:

<Steps>
  <Step title="使用标准上下文窗口">
    切换到标准窗口模型，或从不具备 1M 上下文 GA 能力的旧模型配置中移除旧版 `context1m`。
  </Step>
  <Step title="使用符合条件的凭证">
    使用符合长上下文请求条件的 Anthropic 凭证，或切换到 Anthropic API 密钥。
  </Step>
  <Step title="配置备用模型">
    配置备用模型，以便在 Anthropic 长上下文请求被拒绝时运行继续。
  </Step>
</Steps>

相关:

- [Anthropic](/providers/anthropic)
- [Token 使用和成本](/reference/token-use)
- [为什么我看到 Anthropic 的 HTTP 429？](/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 上游 403 被阻止的响应

当上游 LLM 提供商返回类似 `Your request was blocked` 的通用 `403` 时使用。

不要假设这总是 OpenClaw 配置问题。该响应可能来自上游安全层，如 CDN、WAF、机器人管理规则，或 OpenAI 兼容端点前面的反向代理。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

查找：

- 同一提供商下的多个模型以相同方式失败
- HTML 或通用安全文本，而不是正常的提供商 API 错误
- 同一请求时间的提供商侧安全事件
- 一个微小的直接 `curl` 探测成功，而正常 SDK 形状的请求失败

当证据指向 WAF/CDN 阻止时，优先修复提供商侧过滤。为 OpenClaw 使用的 API 路径设置范围较窄的允许或跳过规则，避免禁用整个站点的保护。

<Warning>
成功的最小 `curl` 不能保证真实的 SDK 风格请求能通过同一上游安全层。
</Warning>

相关：

- [OpenAI 兼容端点](/gateway/configuration-reference#openai-compatible-endpoints)
- [Provider 配置](/providers)
- [日志](/logging)

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

查找：

- 直接小型调用成功，但 OpenClaw 运行仅在较大提示上失败
- 即使直接 `/v1/chat/completions` 使用相同的裸模型 ID 有效，仍出现 `model_not_found` 或 404 错误
- 关于 `messages[].content` 期望字符串的后端错误
- 带有 OpenAI 兼容本地后端的断续 `incomplete turn detected ... stopReason=stop payloads=0` 警告
- 仅在较大提示 token 数量或完整 Agent 运行时提示下出现的后端崩溃

<AccordionGroup>
  <Accordion title="常见特征">
    - `model_not_found` 配合本地 MLX/vLLM 风格服务器 → 验证 `baseUrl` 包含 `/v1`，`api` 对于 `/v1/chat/completions` 后端是 `"openai-completions"`，且 `models.providers.<provider>.models[].id` 是裸 provider 本地 id。用 provider 前缀选择一次，例如 `mlx/mlx-community/Qwen3-30B-A3B-6bit`；保持目录条目为 `mlx-community/Qwen3-30B-A3B-6bit`。
    - `messages[...].content: invalid type: sequence, expected a string` → 后端拒绝结构化 Chat Completions 内容部分。修复：设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
    - `validation.keys` 或允许的消息键如 `["role","content"]` → 后端拒绝 Chat Completions 消息上的 OpenAI 风格回放元数据。修复：设置 `models.providers.<provider>.models[].compat.strictMessageKeys: true`。
    - `incomplete turn detected ... stopReason=stop payloads=0` → 后端完成了 Chat Completions 请求但该轮次未返回用户可见的助手文本。OpenClaw 对可重放的空 OpenAI 兼容轮次重试一次；持续失败通常意味着后端发出了空/非文本内容或抑制了最终答案文本。
    - 直接小型请求成功，但 OpenClaw Agent 运行因后端/模型崩溃而失败（例如某些 `inferrs` 构建上的 Gemma）→ OpenClaw 传输层可能已经正确；后端在较大的 Agent 运行时提示形状上失败。
    - 禁用工具后失败减少但未消失 → 工具 schema 是部分原因，但剩余问题仍然是上游模型/服务器容量或后端 bug。
  </Accordion>
  <Accordion title="修复选项">
    1. 为仅字符串 Chat Completions 后端设置 `compat.requiresStringContent: true`。
    2. 为只接受每条消息上 `role` 和 `content` 的严格 Chat Completions 后端设置 `compat.strictMessageKeys: true`。
    3. 为无法可靠处理 OpenClaw 工具 schema 的模型/后端设置 `compat.supportsTools: false`。
    4. 尽可能降低提示压力：更小的 workspace 引导、更短的 Session 历史、更轻量的本地模型，或支持更强长上下文的后端。
    5. 如果小型直接请求持续通过而 OpenClaw Agent 轮次仍在后端内崩溃，将其视为上游服务器/模型限制，并使用接受的负载形状在那里提交复现报告。
  </Accordion>
</AccordionGroup>

相关:

- [配置](/gateway/configuration)
- [本地模型](/gateway/local-models)
- [OpenAI 兼容端点](/gateway/configuration-reference#openai-compatible-endpoints)

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

相关：

- [Channel 故障排除](/channels/troubleshooting)
- [群组](/channels/groups)
- [配对](/channels/pairing)

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

如果本地浏览器在更新后无法连接到 `127.0.0.1:18789`，首先恢复本地 Gateway 服务并确认它正在提供 dashboard：

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

如果 `curl` 返回 OpenClaw HTML，则 Gateway 正在工作，其余问题很可能是浏览器缓存、旧的深链接或过时的标签状态。直接打开 `http://127.0.0.1:18789` 并从 dashboard 导航。如果重启后服务仍未运行，运行 `openclaw gateway start` 并重新检查 `openclaw gateway status`。

<AccordionGroup>
  <Accordion title="连接/认证特征">
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
  </Accordion>
</AccordionGroup>

### 认证详细代码快速映射

使用失败的 `connect` 响应中的 `error.details.code` 选择下一步操作:

| 详细代码                  | 含义                                                  | 推荐操作                                                                                                                                                                   |
| ---------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 客户端未发送所需的共享令牌。             | 在客户端粘贴/设置令牌并重试。对于 dashboard 路径:`openclaw config get gateway.auth.token` 然后粘贴到 Control UI 设置中。                          |
| `AUTH_TOKEN_MISMATCH`        | 共享令牌与 Gateway 认证令牌不匹配。           | 如果 `canRetryWithDeviceToken=true`，允许一次受信任的重试。缓存令牌重试复用已存储的批准范围；明确 `deviceToken` / `scopes` 的调用者保留请求的范围。如果仍然失败，运行[令牌漂移恢复清单](/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 缓存的每设备令牌过时或已撤销。             | 使用[设备 CLI](/cli/devices) 轮换/重新批准设备令牌,然后重新连接。                                                                                    |
| `AUTH_SCOPE_MISMATCH`        | 设备令牌有效，但其批准的角色/范围不覆盖此连接请求。                                                  | 重新配对设备或批准请求的范围契约；不要将其视为共享令牌漂移。                                                                                                               |
| `PAIRING_REQUIRED`           | 设备身份需要批准。检查 `error.details.reason` 中的 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，并在存在时使用 `requestId` / `remediationHint`。 | 批准待处理请求:`openclaw devices list` 然后 `openclaw devices approve <requestId>`。范围/角色升级在您审查请求的访问权限后使用相同的流程。 |

设备认证 v2 迁移检查:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果日志显示 nonce/签名错误，更新连接的客户端并验证它：

<Steps>
  <Step title="等待 connect.challenge">
    客户端等待 Gateway 颁发的 `connect.challenge`。
  </Step>
  <Step title="签署负载">
    客户端签署与挑战绑定的负载。
  </Step>
  <Step title="发送设备 nonce">
    客户端发送与挑战 nonce 相同的 `connect.params.device.nonce`。
  </Step>
</Steps>

如果 `openclaw devices rotate` / `revoke` / `remove` 意外被拒绝：

- 除非调用者也有 `operator.admin`，否则配对设备令牌 Session 只能管理**自己的**设备
- `openclaw devices rotate --scope ...` 只能请求调用者 Session 已持有的操作员范围

<Note>
直接回环后端 RPC（以共享 Gateway token/password 认证）不应依赖 CLI 配对设备范围基线。如果子 Agent 或其他内部调用仍因 `scope-upgrade` 失败，请验证调用者使用了 `client.id: "gateway-client"` 和 `client.mode: "backend"`，且没有强制明确的 `deviceIdentity` 或设备令牌。
</Note>

相关：

- [配置](/gateway/configuration)（Gateway 认证模式）
- [Control UI](/web/control-ui)
- [设备](/cli/devices)
- [远程访问](/gateway/remote)
- [Trusted proxy auth](/gateway/trusted-proxy-auth)

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

<AccordionGroup>
  <Accordion title="常见特征">
    - `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 本地 Gateway 模式未启用，或配置文件被覆盖而丢失了 `gateway.mode`。修复：在配置中设置 `gateway.mode="local"`，或重新运行 `openclaw onboard --mode local` / `openclaw setup` 以重新标记预期的本地模式配置。如果您通过 Podman 运行 OpenClaw，默认配置路径为 `~/.openclaw/openclaw.json`。
    - `refusing to bind gateway ... without auth` → 非回环绑定没有有效的 Gateway 认证路径（token/password，或已配置的 trusted-proxy）。
    - `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。
    - `Other gateway-like services detected (best effort)` → 存在过时或并行的 launchd/systemd/schtasks 单元。大多数设置应在每台机器上保持一个 Gateway；如果确实需要多个，请隔离端口 + 配置/状态/工作区。参见 [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)。
    - `System-level OpenClaw gateway service detected` 来自 doctor → systemd 系统单元存在而用户级服务缺失。在允许 doctor 安装用户服务之前删除或禁用重复单元，或者如果系统单元是预期的监督者则设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。
    - `Gateway service port does not match current gateway config` → 已安装的监督者仍固定旧的 `--port`。运行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，然后重启 Gateway 服务。
  </Accordion>
</AccordionGroup>

相关：

- [后台 exec 和进程工具](/gateway/background-process)
- [配置](/gateway/configuration)
- [Doctor](/gateway/doctor)

## Gateway 在高内存使用时退出

当 Gateway 在负载下消失、监督者报告 OOM 风格的重启，或日志提到 `critical memory pressure bundle written` 时使用。

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

查找：

- 最新稳定性 bundle 中的 `Reason: diagnostic.memory.pressure.critical`。
- `Memory pressure:` 带有 `critical/rss_threshold`、`critical/heap_threshold` 或 `critical/rss_growth`。
- 接近堆限制的 `V8 heap:` 值。
- `Largest session files:` 条目，如 `agents/<agent>/sessions/<session>.jsonl` 或 `sessions/<session>.jsonl`。
- 当 Gateway 在容器或内存受限服务中运行时的 Linux cgroup 内存计数器。

常见特征：

- `critical memory pressure bundle written` 在重启前不久出现 → OpenClaw 捕获了 OOM 前的稳定性 bundle。用 `openclaw gateway stability --bundle latest` 检查它。
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` 出现在 Gateway 日志中 → OpenClaw 检测到严重内存压力，但 OOM 前稳定性快照已关闭。
- `Largest session files:` 指向非常大的已编辑转录路径 → 减少保留的 Session 历史，检查 Session 增长，或在重启前将旧转录移出活动存储。
- `V8 heap:` 使用字节接近堆限制 → 降低提示/Session 压力，减少并发工作，或仅在确认工作负载符合预期后提高 Node 堆限制。
- `Memory pressure: critical/rss_growth` → 内存在一个采样窗口内快速增长。检查最新日志中是否有大型导入、失控的工具输出、重复重试或一批排队的 Agent 工作。
- 日志中出现严重内存压力但不存在 bundle → 这是默认情况。设置 `diagnostics.memoryPressureSnapshot: true` 以在未来严重内存压力事件时捕获 OOM 前稳定性 bundle。

稳定性 bundle 不含负载内容。它包含操作内存证据和已编辑的相对文件路径，不包含消息文本、Webhook 主体、凭证、令牌、Cookie 或原始 Session ID。将诊断导出附加到错误报告，而不是复制原始日志。

相关：

- [Gateway 健康状况](/gateway/health)
- [诊断导出](/gateway/diagnostics)
- [Sessions](/cli/sessions)

## Gateway 拒绝了无效配置

当 Gateway 启动时因 `Invalid config` 失败，或热重载日志显示它跳过了无效编辑时使用。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

查找：

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- 活动配置旁边的带时间戳的 `openclaw.json.rejected.*` 文件
- 带时间戳的 `openclaw.json.clobbered.*` 文件（如果 `doctor --fix` 修复了损坏的直接编辑）
- OpenClaw 为每个配置路径保留最新的 32 个 `.clobbered.*` 文件并轮换旧的

<AccordionGroup>
  <Accordion title="发生了什么">
    - 配置在启动、热重载或 OpenClaw 拥有的写入期间未能验证。
    - Gateway 启动失败关闭，而不是重写 `openclaw.json`。
    - 热重载跳过无效的外部编辑并保持当前运行时配置活跃。
    - OpenClaw 拥有的写入在提交前拒绝无效/破坏性的负载并保存 `.rejected.*`。
    - `openclaw doctor --fix` 拥有修复权。它可以删除非 JSON 前缀或恢复最后已知良好的副本，同时将被拒绝的负载保留为 `.clobbered.*`。
    - 当一个配置路径发生多次修复时，OpenClaw 轮换旧的 `.clobbered.*` 文件，以便最新修复的负载仍然可用。
  </Accordion>
  <Accordion title="检查和修复">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="常见特征">
    - `.clobbered.*` 存在 → doctor 在修复活动配置时保留了损坏的外部编辑。
    - `.rejected.*` 存在 → OpenClaw 拥有的配置写入在提交前未通过 schema 或覆盖检查。
    - `Config write rejected:` → 写入试图删除必需的形状、大幅缩减文件或持久化无效配置。
    - `config reload skipped (invalid config):` → 直接编辑未通过验证并被运行中的 Gateway 忽略。
    - `Invalid config at ...` → Gateway 服务启动前启动失败。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good` 或 `size-drop-vs-last-good:*` → OpenClaw 拥有的写入被拒绝，因为与上次已知良好备份相比它丢失了字段或大小。
    - `Config last-known-good promotion skipped` → 候选包含如 `***` 之类的已编辑密钥占位符。
  </Accordion>
  <Accordion title="修复选项">
    1. 运行 `openclaw doctor --fix` 让 doctor 修复前缀/覆盖配置或恢复上次已知良好配置。
    2. 仅从 `.clobbered.*` 或 `.rejected.*` 中复制预期的键，然后使用 `openclaw config set` 或 `config.patch` 应用它们。
    3. 在重启之前运行 `openclaw config validate`。
    4. 如果手动编辑，请保留完整的 JSON5 配置，而不仅仅是您想要更改的部分对象。
  </Accordion>
</AccordionGroup>

相关：

- [Config](/cli/config)
- [配置：热重载](/gateway/configuration#config-hot-reload)
- [配置：严格验证](/gateway/configuration#strict-validation)
- [Doctor](/gateway/doctor)

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
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 连接成功，但完整诊断 RPC 集超时或失败。将其视为可访问的 Gateway 但诊断降级；在 `--json` 输出中比较 `connect.ok` 和 `connect.rpcOk`。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → Gateway 响应，但此客户端仍需要配对/批准才能获得正常 Operator 访问。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文本 → 认证材料在失败目标的此命令路径中不可用。

相关：

- [Gateway](/cli/gateway)
- [同一主机上的多个 Gateway](/gateway#multiple-gateways-same-host)
- [远程访问](/gateway/remote)

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

相关：

- [Channel 故障排除](/channels/troubleshooting)
- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [WhatsApp](/channels/whatsapp)

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
- Heartbeat 跳过原因（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="常见特征">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron 已禁用。
    - `cron: timer tick failed` → 调度器滴答失败；检查文件/日志/运行时错误。
    - `heartbeat skipped` 带 `reason=quiet-hours` → 在活跃时间窗口外。
    - `heartbeat skipped` 带 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在但只包含空行 / Markdown 标题，所以 OpenClaw 跳过模型调用。
    - `heartbeat skipped` 带 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 块，但没有任务在此次滴答时到期。
    - `heartbeat: unknown accountId` → Heartbeat 交付目标的账户 ID 无效。
    - `heartbeat skipped` 带 `reason=dm-blocked` → Heartbeat 目标解析为 DM 风格的目的地，而 `agents.defaults.heartbeat.directPolicy`（或每个 Agent 的覆盖）设置为 `block`。

  </Accordion>
</AccordionGroup>

相关：

- [Heartbeat](/gateway/heartbeat)
- [定时任务](/automation/cron-jobs)
- [定时任务：故障排除](/automation/cron-jobs#troubleshooting)

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

相关：

- [Exec 审批](/tools/exec-approvals)
- [节点故障排除](/nodes/troubleshooting)
- [节点](/nodes/index)

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

<AccordionGroup>
  <Accordion title="Plugin / 可执行文件特征">
    - `unknown command "browser"` 或 `unknown command 'browser'` → 捆绑的 Browser 插件被 `plugins.allow` 排除。
    - browser 工具缺失/不可用而 `browser.enabled=true` → `plugins.allow` 排除了 `browser`，导致插件从未加载。
    - `Failed to start Chrome CDP on port` → Browser 进程启动失败。
    - `browser.executablePath not found` → 配置的路径无效。
    - `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不支持的方案，如 `file:` 或 `ftp:`。
    - `browser.cdpUrl has invalid port` → 配置的 CDP URL 端口无效或超出范围。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 当前 Gateway 安装缺少核心浏览器运行时依赖；重新安装或更新 OpenClaw，然后重启 Gateway。ARIA 快照和基本页面截图仍可工作，但导航、AI 快照、CSS 选择器元素截图和 PDF 导出不可用。
  </Accordion>
  <Accordion title="Chrome MCP / existing-session 特征">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session 尚无法附加到选定的浏览器数据目录。打开浏览器检查页面，启用远程调试，保持浏览器打开，批准第一个附加提示，然后重试。如果不需要已登录状态，请优先使用托管的 `openclaw` 配置文件。
    - `No Chrome tabs found for profile="user"` → Chrome MCP 附加配置文件没有打开的本地 Chrome 标签。
    - `Remote CDP for profile "<name>" is not reachable` → 配置的远程 CDP 端点无法从 Gateway 主机访问。
    - `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 仅附加配置文件没有可访问的目标，或 HTTP 端点有响应但 CDP WebSocket 仍无法打开。
  </Accordion>
  <Accordion title="元素 / 截图 / 上传特征">
    - `fullPage is not supported for element screenshots` → 截图请求混合了 `--full-page` 和 `--ref` 或 `--element`。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 截图调用必须使用页面捕获或快照 `--ref`，而不是 CSS `--element`。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上传钩子需要快照 refs，而不是 CSS 选择器。
    - `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 配置文件上每次调用发送一个上传。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 配置文件上的对话框钩子不支持超时覆盖。
    - `existing-session type does not support timeoutMs overrides.` → 对于 `profile="user"` / Chrome MCP existing-session 配置文件上的 `act:type` 忽略 `timeoutMs`，或在需要自定义超时时使用托管/CDP 浏览器配置文件。
    - `existing-session evaluate does not support timeoutMs overrides.` → 对于 `profile="user"` / Chrome MCP existing-session 配置文件上的 `act:evaluate` 忽略 `timeoutMs`，或在需要自定义超时时使用托管/CDP 浏览器配置文件。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` 仍然需要托管浏览器或原始 CDP 配置文件。
    - 仅附加或远程 CDP 配置文件上的过时视口 / 深色模式 / 区域设置 / 离线覆盖 → 运行 `openclaw browser stop --browser-profile <name>` 关闭活动控制 Session 并释放 Playwright/CDP 仿真状态，而无需重启整个 Gateway。
  </Accordion>
</AccordionGroup>

相关：

- [Browser（OpenClaw 托管）](/tools/browser)
- [Browser 故障排除](/tools/browser-linux-troubleshooting)

## 升级后某些东西突然坏了

大多数升级后的故障是配置漂移或现在正在执行的更严格默认值。

<AccordionGroup>
  <Accordion title="1. 认证和 URL 覆盖行为已更改">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    检查内容：

    - 如果 `gateway.mode=remote`，CLI 调用可能定向到远程而您的本地服务正常。
    - 明确的 `--url` 调用不会回退到存储的凭证。

    常见特征：

    - `gateway connect failed:` → 错误的 URL 目标。
    - `unauthorized` → 端点可访问但认证错误。

  </Accordion>
  <Accordion title="2. 绑定和认证护栏更严格">
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

    常见特征：

    - `refusing to bind gateway ... without auth` → 非回环绑定没有有效的 Gateway 认证路径。
    - `Connectivity probe: failed` 而运行时正在运行 → Gateway 活跃但当前认证/URL 无法访问。

  </Accordion>
  <Accordion title="3. 配对和设备身份状态已更改">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    检查内容：

    - dashboard/节点的待处理设备批准。
    - 策略或身份更改后的待处理 DM 配对批准。

    常见特征：

    - `device identity required` → 设备认证未满足。
    - `pairing required` → 发送者/设备必须被批准。

  </Accordion>
</AccordionGroup>

如果检查后服务配置和运行时仍不一致，从同一配置文件/状态目录重新安装服务元数据：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相关：

- [认证](/gateway/authentication)
- [后台 exec 和进程工具](/gateway/background-process)
- [Gateway 配对](/gateway/pairing)

## 相关

- [Doctor](/gateway/doctor)
- [常见问题](/help/faq)
- [Gateway 服务手册](/gateway)
