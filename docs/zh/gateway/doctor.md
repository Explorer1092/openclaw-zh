---
mmh3_hash: "b5d660c00e851d54de686171cd9377f1"
summary: "Doctor 命令：健康检查、配置迁移和修复步骤"
read_when:
  - 添加或修改 doctor 迁移
  - 引入破坏性配置更改
title: "Doctor"
sidebarTitle: "Doctor"
---

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它修复过时的配置/状态，检查健康状况，并提供可操作的修复步骤。

## 快速入门

```bash
openclaw doctor
```

### 无头和自动化模式

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    接受默认值而不提示（包括适用时的重启/服务/沙盒修复步骤）。

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    应用推荐的修复而不提示（在安全时修复 + 重启）。

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    为 CI 或预检自动化运行结构化健康检查。此模式为只读：不提示、不修复、不迁移配置、不重启服务、不修改状态。

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    也应用激进的修复（覆盖自定义 supervisor 配置）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    在不提示的情况下运行，仅应用安全迁移（配置规范化 + 磁盘状态移动）。跳过需要人工确认的重启/服务/沙盒操作。检测到旧版状态迁移时自动运行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    扫描系统服务以查找额外的 Gateway 安装（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

如果您想在写入之前查看更改，请先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 只读 lint 模式

`openclaw doctor --lint` 是 `openclaw doctor --fix` 的自动化友好兄弟。两者都使用 doctor 健康检查，但姿态不同：

| 模式                     | 提示   | 写入配置/状态     | 输出                 | 用途                      |
| ------------------------ | ------ | ----------------- | -------------------- | ------------------------- |
| `openclaw doctor`        | 是     | 否                | 友好健康报告         | 人工检查状态              |
| `openclaw doctor --fix`  | 有时   | 是，带修复策略    | 友好修复日志         | 应用已批准的修复          |
| `openclaw doctor --lint` | 否     | 否                | 结构化发现           | CI、预检和审查门          |

现代化的健康检查可能提供可选的 `repair()` 实现。`doctor --fix` 在存在时应用这些修复，并继续对尚未迁移的检查使用现有 doctor 修复流程。结构化修复契约还将修复报告与检测分离：`detect()` 报告当前发现，而 `repair()` 可以报告变更、配置/文件差异和非文件副作用。这为未来 `doctor --fix --dry-run` 和差异输出保留了迁移路径，而不会使 lint 检查计划变更。

示例：

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON 输出包括：

- `ok`：是否有任何可见发现达到所选严重性阈值
- `checksRun`：执行的健康检查数量
- `checksSkipped`：被 `--only` 或 `--skip` 跳过的检查
- `findings`：带 `checkId`、`severity`、`message` 和可选 `path`、`line`、`column`、`ocPath`、`fixHint` 的结构化诊断

退出代码：

- `0`：没有达到或超过所选阈值的发现
- `1`：一个或多个发现达到所选阈值
- `2`：在可以发出 lint 发现之前命令/运行时失败

使用 `--severity-min info|warning|error` 控制打印内容和导致非零 lint 退出的内容。使用 `--only <id>` 进行窄预检门和 `--skip <id>` 临时排除嘈杂检查，同时保持其余 lint 运行活跃。`--json`、`--severity-min`、`--only` 和 `--skip` 等 lint 输出选项必须与 `--lint` 配对；常规 doctor 和修复运行会拒绝它们。

## 它做什么（摘要）

<AccordionGroup>
  <Accordion title="健康、UI 和更新">
    - git 安装的可选预检更新（仅交互式）。
    - UI 协议新鲜度检查（当协议 schema 较新时重建 Control UI）。
    - 健康检查 + 重启提示。
    - Skills 状态摘要（符合条件/缺失/被阻止）和插件状态。

  </Accordion>
  <Accordion title="配置和迁移">
    - 旧版值的配置规范化。
    - Talk 配置迁移：从旧版平铺 `talk.*` 字段迁移到 `talk.provider` + `talk.providers.<provider>`。
    - 旧版 Chrome 扩展配置和 Chrome MCP 就绪状态的 Browser 迁移检查。
    - OpenCode provider 覆盖警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth 配置文件的 OAuth TLS 先决条件检查。
    - 当 `plugins.allow` 具有限制性但工具策略仍请求通配符或插件拥有的工具时的插件/工具 allowlist 警告。
    - 旧版磁盘状态迁移（sessions/agent dir/WhatsApp 认证）。
    - 旧版插件清单合同键迁移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - 旧版 cron 存储迁移（`jobId`、`schedule.cron`、顶级 delivery/payload 字段、payload `provider`、简单 `notify: true` webhook 回退作业）。
    - 旧版整 Agent 运行时策略清理；provider/model 运行时策略是活跃的路由选择器。
    - 当插件启用时的陈旧插件配置清理；当 `plugins.enabled=false` 时，陈旧插件引用被视为惰性包含配置并保留。

  </Accordion>
  <Accordion title="状态和完整性">
    - Session 锁文件检查和陈旧锁清理。
    - Session transcript 分支修复，用于修复受影响的 2026.4.24 版本创建的重复提示重写分支。
    - 楔入子 Agent 重启恢复逻辑检测，`--fix` 支持清除陈旧的已中止恢复标志，使启动不再持续将子进程视为重启已中止。
    - 状态完整性和权限检查（sessions、transcripts、state dir）。
    - 本地运行时的配置文件权限检查（chmod 600）。
    - 模型认证健康：检查 OAuth 过期，可以刷新即将过期的令牌，并报告 auth-profile 冷却/禁用状态。
    - 额外的 workspace 目录检测（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、服务和 supervisor">
    - 启用沙盒时的沙盒镜像修复。
    - 旧版服务迁移和额外 Gateway 检测。
    - Matrix Channel 旧版状态迁移（在 `--fix` / `--repair` 模式下）。
    - Gateway 运行时检查（已安装服务但未运行；缓存的 launchd 标签）。
    - Channel 状态警告（从正在运行的 Gateway 探测）。
    - Channel 特定权限检查位于 `openclaw channels capabilities` 下；例如，Discord 语音频道权限通过 `openclaw channels capabilities --channel discord --target channel:<channel-id>` 审计。
    - WhatsApp 响应性检查用于本地 TUI 客户端仍在运行时 Gateway 事件循环健康降级；`--fix` 仅停止经过验证的本地 TUI 客户端。
    - Codex 路由修复：修复主要模型、回退、heartbeat/subagent/compaction 覆盖、hooks、Channel 模型覆盖和 Session 路由固定中的旧版 `openai-codex/*` 模型引用；`--fix` 将它们重写为 `openai/*`，删除陈旧的 Session/整 Agent 运行时固定，并在默认 Codex 线束上保留规范 OpenAI Agent 引用。
    - Supervisor 配置审计（launchd/systemd/schtasks）带有可选修复。
    - 嵌入的代理环境清理，针对在安装或更新期间捕获了 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值的 Gateway 服务。
    - Gateway 运行时最佳实践检查（Node vs Bun，version-manager 路径）。
    - Gateway 端口冲突诊断（默认 `18789`）。

  </Accordion>
  <Accordion title="认证、安全和配对">
    - 开放 DM 策略的安全警告。
    - 本地令牌模式的 Gateway 认证检查（当没有令牌来源存在时提供令牌生成；不覆盖令牌 SecretRef 配置）。
    - 设备配对问题检测（待处理的首次配对请求、待处理的角色/范围升级、本地设备令牌缓存漂移以及已配对记录认证漂移）。

  </Accordion>
  <Accordion title="workspace 和 shell">
    - Linux 上的 systemd linger 检查。
    - workspace bootstrap 文件大小检查（截断/接近限制的上下文文件警告）。
    - 默认 Agent 的 Skills 就绪检查；报告缺少二进制文件、env、配置或 OS 要求的允许 Skills，`--fix` 可以在 `skills.entries` 中禁用不可用的 Skills。
    - Shell 补全状态检查和自动安装/升级。
    - 内存搜索嵌入 Provider 就绪检查（本地模型、远程 API key 或 QMD 二进制文件）。
    - 源安装检查（pnpm workspace 不匹配，缺少 UI 资产，缺少 tsx 二进制文件）。
    - 写入更新的配置 + 向导元数据。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填和重置

Control UI 的 Dreams 场景包含用于接地梦境工作流的**回填**、**重置**和**清除接地**操作。这些操作使用 Gateway doctor 风格的 RPC 方法，但它们**不是** `openclaw doctor` CLI 修复/迁移的一部分。

它们的功能：

- **回填** 扫描活跃 workspace 中历史的 `memory/YYYY-MM-DD.md` 文件，运行接地 REM 日记过程，并将可逆的回填条目写入 `DREAMS.md`。
- **重置** 仅从 `DREAMS.md` 中删除那些标记的回填日记条目。
- **清除接地** 仅删除来自历史回放的暂存接地专用短期条目，这些条目尚未积累实时记忆或每日支持。

它们本身**不**执行的操作：

- 不编辑 `MEMORY.md`
- 不运行完整的 doctor 迁移
- 不自动将接地候选项暂存到实时短期提升存储中，除非您先明确运行暂存 CLI 路径

如果您希望接地历史回放影响正常的深度提升通道，请改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

这会将接地持久候选项暂存到短期梦境存储中，同时保留 `DREAMS.md` 作为审查界面。

## 详细行为和理由

<AccordionGroup>
  <Accordion title="0. 可选更新（git 安装）">
    如果这是 git checkout 并且 doctor 以交互方式运行，它会在运行 doctor 之前提供更新（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 配置规范化">
    如果配置包含旧版值形状（例如 `messages.ackReaction` 没有特定 Channel 的覆盖），doctor 将它们规范化为当前 schema。

    这包括旧版 Talk 平铺字段。当前公开的 Talk 语音配置为 `talk.provider` + `talk.providers.<provider>`，实时语音配置为 `talk.realtime.*`。Doctor 将旧版 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形状重写为 Provider 映射，并将旧版顶级实时选择器（`talk.mode`、`talk.transport`、`talk.brain`、`talk.model`、`talk.voice`）重写为 `talk.realtime`。

    当 `plugins.allow` 非空且工具策略使用通配符或插件拥有的工具条目时，Doctor 也会发出警告。`tools.allow: ["*"]` 仅匹配实际加载的插件中的工具；它不会绕过独占插件 allowlist。Doctor 为迁移的旧版 allowlist 配置写入 `plugins.bundledDiscovery: "compat"` 以保留现有捆绑 provider 行为，然后指向更严格的 `"allowlist"` 设置。

  </Accordion>
  <Accordion title="2. 旧版配置键迁移">
    当配置包含已弃用的键时，其他命令拒绝运行并要求您运行 `openclaw doctor`。

    Doctor 将：

    - 解释找到了哪些旧版键。
    - 显示它应用的迁移。
    - 用更新的 schema 重写 `~/.openclaw/openclaw.json`。

    Gateway 启动拒绝旧版配置格式并要求您运行 `openclaw doctor --fix`；它不会在启动时重写 `openclaw.json`。Cron 作业存储迁移由 `openclaw doctor --fix` 处理。

    当前迁移：

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → 顶级 `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - 旧版 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - 旧版顶级实时 Talk 选择器（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`）+ `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` 和 `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` 和 `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` 和 `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` 和 `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 对于具有命名 `accounts` 但存在遗留单账户顶级 Channel 值的 Channel，将这些账户范围的值移入该 Channel 选择的提升账户中（大多数 Channel 为 `accounts.default`；Matrix 可以保留现有的匹配命名/默认目标）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；对于慢速 provider/model 超时使用 `models.providers.<id>.timeoutSeconds`，并在整个运行必须持续更长时间时保持 Agent/运行超时高于该值
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（旧版扩展中继设置）
    - 旧版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 启动时对 `api` 设置为未来或未知枚举值的 provider 也跳过而不是失败关闭）
    - 移除 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex 应用服务器始终保持 Codex 原生 workspace 工具原生

    Doctor 警告还包括多账户 Channel 的账户默认指导：

    - 如果配置了两个或更多 `channels.<channel>.accounts` 条目而没有 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 会警告回退路由可能选择意外账户。
    - 如果 `channels.<channel>.defaultAccount` 设置为未知账户 ID，doctor 会警告并列出已配置的账户 ID。

  </Accordion>
  <Accordion title="2b. OpenCode provider 覆盖">
    如果您手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它会覆盖来自 `@earendil-works/pi-ai` 的内置 OpenCode 目录。这可能会强制模型使用错误的 API 或将成本清零。Doctor 会发出警告，以便您可以删除覆盖并恢复每个模型的 API 路由 + 成本。
  </Accordion>
  <Accordion title="2c. Browser 迁移和 Chrome MCP 就绪状态">
    如果您的 Browser 配置仍然指向已移除的 Chrome 扩展路径，doctor 会将其规范化为当前的主机本地 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 变为 `"existing-session"`
    - `browser.relayBindHost` 被移除

    当您使用 `defaultProfile: "user"` 或配置的 `existing-session` 配置文件时，Doctor 还会审计主机本地 Chrome MCP 路径：

    - 检查同一主机上是否安装了 Google Chrome 用于默认自动连接配置文件
    - 检查检测到的 Chrome 版本，并在低于 Chrome 144 时发出警告
    - 提醒您在浏览器检查页面中启用远程调试（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 无法为您启用 Chrome 端设置。主机本地 Chrome MCP 仍然需要：

    - Gateway/节点主机上的基于 Chromium 的浏览器 144+
    - 浏览器在本地运行
    - 在该浏览器中启用远程调试
    - 在浏览器中批准首次附加同意提示

    此处的就绪性仅涉及本地附加先决条件。现有 Session 保持当前的 Chrome MCP 路由限制；高级路由（如 `responsebody`、PDF 导出、下载拦截和批量操作）仍然需要托管浏览器或原始 CDP 配置文件。

    此检查**不适用于** Docker、沙盒、远程浏览器或其他无头流程。这些继续使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 先决条件">
    当配置了 OpenAI Codex OAuth 配置文件时，doctor 探测 OpenAI 授权端点以验证本地 Node/OpenSSL TLS 栈是否可以验证证书链。如果探测因证书错误失败（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、过期证书或自签名证书），doctor 打印平台特定的修复指南。在 macOS 上使用 Homebrew Node 时，修复通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，即使 Gateway 健康，探测也会运行。
  </Accordion>
  <Accordion title="2e. Codex OAuth provider 覆盖">
    如果您之前在 `models.providers.openai-codex` 下手动添加了旧版 OpenAI 传输设置，它们可能会遮蔽较新版本自动使用的内置 Codex OAuth provider 路径。当 doctor 看到这些旧版传输设置与 Codex OAuth 并存时，会发出警告，以便您可以删除或重写陈旧的传输覆盖并恢复内置路由/回退行为。自定义代理和仅标头覆盖仍受支持，不会触发此警告。
  </Accordion>
  <Accordion title="2f. Codex 路由修复">
    Doctor 检查旧版 `openai-codex/*` 模型引用。原生 Codex 线束路由使用规范 `openai/*` 模型引用；OpenAI Agent 轮次通过 Codex 应用服务器线束而不是 OpenClaw PI OpenAI 路径。

    在 `--fix` / `--repair` 模式下，doctor 重写受影响的默认 Agent 和每个 Agent 引用，包括主要模型、回退、heartbeat/subagent/compaction 覆盖、hooks、Channel 模型覆盖和陈旧的持久 Session 路由状态：

    - `openai-codex/gpt-*` 变为 `openai/gpt-*`。
    - Codex 意图移到 provider/model 范围的 `agentRuntime.id: "codex"` 条目，用于修复后的 Agent 模型引用，以便 `openai-codex:...` 认证配置文件在模型引用变为 `openai/*` 后仍可选择。
    - 陈旧的整 Agent 运行时配置和持久 Session 运行时固定被删除，因为运行时选择是 provider/model 范围的。
    - 现有 provider/model 运行时策略保留，除非修复后的旧版模型引用需要 Codex 路由以保持旧认证路径。
    - 现有模型回退列表保留，旧版条目被重写；复制的每模型设置从旧版键移到规范 `openai/*` 键。
    - 持久 Session `modelProvider`/`providerOverride`、`model`/`modelOverride`、回退通知和认证配置文件固定在所有发现的 Agent Session 存储中修复。
    - `/codex ...` 表示"从聊天中控制或绑定原生 Codex 对话"。
    - `/acp ...` 或 `runtime: "acp"` 表示"使用外部 ACP/acpx 适配器"。

  </Accordion>
  <Accordion title="2g. Session 路由清理">
    Doctor 还扫描已发现的 Agent Session 存储中陈旧的自动创建路由状态，以便在您将配置的模型或运行时从插件拥有的路由（如 Codex）移走后进行清理。

    `openclaw doctor --fix` 可以清除自动创建的陈旧状态，例如 `modelOverrideSource: "auto"` 模型固定、运行时模型元数据、固定的线束 ID、CLI Session 绑定以及当其拥有路由不再配置时的自动认证配置文件覆盖。明确的用户或旧版 Session 模型选择会被报告供手动审查并保持不变；当不再打算使用该路由时，使用 `/model ...`、`/new` 或重置 Session 来切换它们。

  </Accordion>
  <Accordion title="3. 旧版状态迁移（磁盘布局）">
    Doctor 可以将较旧的磁盘布局迁移到当前结构：

    - Sessions 存储 + transcripts：
      - 从 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - Agent 目录：
      - 从 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 认证状态（Baileys）：
      - 从旧版 `~/.openclaw/credentials/*.json`（除了 `oauth.json`）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认 account id: `default`）

    这些迁移是尽力而为且幂等的；当它将任何旧版文件夹作为备份留下时，doctor 将发出警告。Gateway/CLI 也会在启动时自动迁移旧版 sessions + agent dir，因此历史/认证/模型会进入每个 Agent 的路径，而无需手动运行 doctor。WhatsApp 认证仅通过 `openclaw doctor` 迁移。Talk provider/provider-map 规范化现在通过结构相等性进行比较，因此仅键顺序差异不再触发重复的无操作 `doctor --fix` 更改。

  </Accordion>
  <Accordion title="3a. 旧版插件清单迁移">
    Doctor 扫描所有已安装的插件清单，查找已废弃的顶级能力键（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。发现时，提供将它们移入 `contracts` 对象并就地重写清单文件。此迁移是幂等的；如果 `contracts` 键已经有相同的值，则删除旧版键而不重复数据。
  </Accordion>
  <Accordion title="3b. 旧版 cron 存储迁移">
    Doctor 还检查 cron 作业存储（`~/.openclaw/cron/jobs.json`，或 `cron.store` 覆盖时）中调度器为兼容性仍接受的旧版作业形状。

    当前 cron 清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 顶级 payload 字段（`message`、`model`、`thinking`...）→ `payload`
    - 顶级 delivery 字段（`deliver`、`channel`、`to`、`provider`...）→ `delivery`
    - payload `provider` delivery 别名 → 明确的 `delivery.channel`
    - 简单旧版 `notify: true` webhook 回退作业 → 明确的 `delivery.mode="webhook"` 和 `delivery.to=cron.webhook`

    Doctor 仅在不改变行为的情况下自动迁移 `notify: true` 作业。如果作业将旧版 notify 回退与现有非 webhook delivery 模式结合，doctor 会警告并将该作业留给手动审查。

    在 Linux 上，当用户的 crontab 仍然调用旧版 `~/.openclaw/bin/ensure-whatsapp.sh` 时，doctor 也会发出警告。该主机本地脚本不由当前 OpenClaw 维护，当 cron 无法访问 systemd 用户总线时可能会向 `~/.openclaw/logs/whatsapp-health.log` 写入错误的 `Gateway inactive` 消息。使用 `crontab -e` 删除陈旧的 crontab 条目；使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status` 进行当前健康检查。

  </Accordion>
  <Accordion title="3c. Session 锁清理">
    Doctor 扫描每个 Agent Session 目录中的陈旧写锁文件——Session 异常退出时留下的文件。对于发现的每个锁文件，报告：路径、PID、PID 是否仍在运行、锁的存在时间，以及是否认为是陈旧的（死 PID、超过 30 分钟，或属于非 OpenClaw 进程的活跃 PID）。在 `--fix` / `--repair` 模式下，自动删除陈旧的锁文件；否则打印提示并指示您使用 `--fix` 重新运行。
  </Accordion>
  <Accordion title="3d. Session transcript 分支修复">
    Doctor 扫描 Agent Session JSONL 文件，查找由 2026.4.24 提示 transcript 重写错误创建的重复分支形状：一个带有 OpenClaw 内部运行时上下文的废弃用户轮次，以及包含相同可见用户提示的活跃同级轮次。在 `--fix` / `--repair` 模式下，doctor 在原始文件旁边备份每个受影响的文件，并将 transcript 重写为活跃分支，使 Gateway 历史和内存读取器不再看到重复轮次。
  </Accordion>
  <Accordion title="4. 状态完整性检查（Session 持久化、路由和安全）">
    状态目录是操作核心。如果它消失，您将丢失 Session、凭证、日志和配置（除非您在其他地方有备份）。

    Doctor 检查：

    - **状态目录缺失**：警告灾难性状态丢失，提示重新创建目录，并提醒您它无法恢复丢失的数据。
    - **状态目录权限**：验证可写性；提供修复权限（并在检测到所有者/组不匹配时发出 `chown` 提示）。
    - **macOS 云同步状态目录**：当状态解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 下时发出警告，因为同步备份路径可能导致较慢的 I/O 和锁/同步竞争。
    - **Linux SD 或 eMMC 状态目录**：当状态解析到 `mmcblk*` 挂载源时发出警告，因为 SD 或 eMMC 支持的随机 I/O 在 Session 和凭证写入下可能更慢且磨损更快。
    - **Session 目录缺失**：`sessions/` 和 Session 存储目录是持久化历史和避免 `ENOENT` 崩溃所必需的。
    - **Transcript 不匹配**：当最近的 Session 条目缺少 transcript 文件时发出警告。
    - **主 Session "1 行 JSONL"**：当主 transcript 只有一行时标记（历史未累积）。
    - **多个状态目录**：当多个 `~/.openclaw` 文件夹存在于主目录或 `OPENCLAW_STATE_DIR` 指向其他地方时发出警告（历史可能在安装之间分裂）。
    - **远程模式提醒**：如果 `gateway.mode=remote`，doctor 提醒您在远程主机上运行它（状态在那里）。
    - **配置文件权限**：如果 `~/.openclaw/openclaw.json` 是组/其他可读的，则发出警告并提供收紧到 `600`。

  </Accordion>
  <Accordion title="5. 模型认证健康（OAuth 过期）">
    Doctor 检查认证存储中的 OAuth 配置文件，在令牌即将过期/已过期时发出警告，并在安全时刷新它们。如果 Anthropic OAuth/token 配置文件过时，它建议使用 Anthropic API key 或 Anthropic setup-token 路径。刷新提示仅在以交互方式运行（TTY）时出现；`--non-interactive` 跳过刷新尝试。

    当 OAuth 刷新永久失败时（例如 `refresh_token_reused`、`invalid_grant` 或 Provider 要求重新登录），Doctor 会报告需要重新认证，并打印确切的 `openclaw models auth login --provider ...` 命令供运行。

    Doctor 还报告由于以下原因暂时不可用的认证配置文件：

    - 短冷却（速率限制/超时/认证失败）
    - 更长的禁用（计费/信用失败）

  </Accordion>
  <Accordion title="6. Hooks 模型验证">
    如果设置了 `hooks.gmail.model`，doctor 会根据目录和 allowlist 验证模型引用，并在无法解析或被禁止时发出警告。
  </Accordion>
  <Accordion title="7. 沙盒镜像修复">
    启用沙盒时，doctor 检查 Docker 镜像，并在当前镜像缺失时提供构建或切换到旧版名称。
  </Accordion>
  <Accordion title="7b. 插件安装清理">
    Doctor 在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式下删除旧版 OpenClaw 生成的插件依赖暂存状态。这涵盖陈旧的生成依赖根、旧版安装暂存目录、来自早期捆绑插件依赖修复代码的包本地残留，以及可能遮蔽当前捆绑清单的孤立或恢复的 `@openclaw/*` 插件的托管 npm 副本。Doctor 还将主机 `openclaw` 包重新链接到声明 `peerDependencies.openclaw` 的托管 npm 插件，使 `openclaw/plugin-sdk/*` 等包本地运行时导入在更新或 npm 修复后保持可解析。

    当配置引用缺失插件但本地插件注册表无法找到它们时，Doctor 还可以重新安装可下载插件。示例包括 `plugins.entries`、配置的 Channel/provider/搜索设置和配置的 Agent 运行时。在包更新期间，doctor 避免在核心包被替换时运行包管理器插件修复；如果配置的插件仍需恢复，更新后再次运行 `openclaw doctor --fix`。Gateway 启动和配置重新加载不运行包管理器；插件安装仍为明确的 doctor/install/update 工作。

  </Accordion>
  <Accordion title="8. Gateway 服务迁移和清理提示">
    Doctor 检测旧版 Gateway 服务（launchd/systemd/schtasks）并提供删除它们并使用当前 Gateway 端口安装 OpenClaw 服务。它还可以扫描额外的类似 Gateway 的服务并打印清理提示。配置文件命名的 OpenClaw Gateway 服务被视为一流的，不会被标记为"额外"。

    在 Linux 上，如果用户级 Gateway 服务缺失但存在系统级 OpenClaw Gateway 服务，doctor 不会自动安装第二个用户级服务。使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 检查，然后删除重复项或在外部 supervisor 拥有 Gateway 生命周期时设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 启动 Matrix 迁移">
    当 Matrix Channel 账户有待处理或可操作的旧版状态迁移时，doctor（在 `--fix` / `--repair` 模式下）创建预迁移快照，然后运行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版加密状态准备。两个步骤都是非致命的；错误会被记录，启动继续。在只读模式（不带 `--fix` 的 `openclaw doctor`）下，此检查完全跳过。
  </Accordion>
  <Accordion title="8c. 设备配对和认证漂移">
    Doctor 现在将设备配对状态检查作为正常健康检查的一部分。

    它报告的内容：

    - 待处理的首次配对请求
    - 已配对设备的待处理角色升级
    - 已配对设备的待处理范围升级
    - 设备 ID 仍匹配但设备身份不再与已批准记录匹配的公钥不匹配修复
    - 已批准角色缺少活跃令牌的已配对记录
    - 范围漂移超出已批准配对基线的已配对令牌
    - 当前机器上的本地缓存设备令牌条目早于 Gateway 端令牌轮换或携带陈旧范围元数据

    Doctor 不自动批准配对请求或自动轮换设备令牌。它打印确切的后续步骤：

    - 使用 `openclaw devices list` 检查待处理请求
    - 使用 `openclaw devices approve <requestId>` 批准确切请求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 轮换新令牌
    - 使用 `openclaw devices remove <deviceId>` 删除并重新批准陈旧记录

    这解决了常见的"已配对但仍然收到需要配对"的问题：doctor 现在区分首次配对、待处理的角色/范围升级和陈旧的令牌/设备身份漂移。

  </Accordion>
  <Accordion title="9. 安全警告">
    当 provider 对没有 allowlist 的 DM 开放，或者策略以危险方式配置时，Doctor 会发出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果作为 systemd 用户服务运行，doctor 确保启用 lingering，以便 Gateway 在注销后保持活动。
  </Accordion>
  <Accordion title="11. workspace 状态（Skills、插件和旧版目录）">
    Doctor 打印默认 Agent 的 workspace 状态摘要：

    - **Skills 状态**：计算符合条件、缺失需求和 allowlist 阻止的 Skills。
    - **旧版 workspace 目录**：当 `~/openclaw` 或其他旧版 workspace 目录与当前 workspace 并存时发出警告。
    - **插件状态**：计算已启用/禁用/错误的插件；列出任何错误的插件 ID；报告捆绑插件功能。
    - **插件兼容性警告**：标记与当前运行时有兼容性问题的插件。
    - **插件诊断**：展示插件注册表发出的任何加载时警告或错误。

  </Accordion>
  <Accordion title="11b. Bootstrap 文件大小">
    Doctor 检查 workspace bootstrap 文件（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过配置的字符预算。它报告每个文件的原始 vs. 注入字符数、截断百分比、截断原因（`max/file` 或 `max/total`），以及总注入字符占总预算的比例。当文件被截断或接近限制时，doctor 打印调整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 陈旧 Channel 插件清理">
    当 `openclaw doctor --fix` 移除缺失的 Channel 插件时，它还会删除引用该插件的悬空 Channel 范围配置：`channels.<id>` 条目、命名该 Channel 的 heartbeat 目标，以及 `agents.*.models["<channel>/*"]` 覆盖。这可以防止 Gateway 启动循环，即 Channel 运行时已消失但配置仍要求 Gateway 绑定到它。
  </Accordion>
  <Accordion title="11c. Shell 补全">
    Doctor 检查当前 shell（zsh、bash、fish 或 PowerShell）是否安装了 Tab 补全：

    - 如果 shell 配置文件使用了慢速动态补全模式（`source <(openclaw completion ...)`），doctor 将其升级为更快的缓存文件变体。
    - 如果配置文件中配置了补全但缓存文件缺失，doctor 自动重新生成缓存。
    - 如果根本没有配置补全，doctor 提示安装（仅交互模式；使用 `--non-interactive` 时跳过）。

    运行 `openclaw completion --write-state` 手动重新生成缓存。

  </Accordion>
  <Accordion title="12. Gateway 认证检查（本地令牌）">
    Doctor 检查本地 Gateway 令牌认证就绪情况。

    - 如果令牌模式需要令牌且没有令牌来源，Doctor 提供生成令牌。
    - 如果 `gateway.auth.token` 是 SecretRef 管理的但不可用，Doctor 会发出警告且不会用明文覆盖它。
    - `openclaw doctor --generate-gateway-token` 仅在未配置令牌 SecretRef 时强制生成。

  </Accordion>
  <Accordion title="12b. 只读 SecretRef 感知修复">
    部分修复流程需要检查配置的凭证，同时不削弱运行时快速失败行为。

    - `openclaw doctor --fix` 现在对目标配置修复使用与状态类命令相同的只读 SecretRef 摘要模型。
    - 示例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修复尝试在可用时使用配置的 bot 凭证。
    - 如果 Telegram bot token 通过 SecretRef 配置但在当前命令路径中不可用，Doctor 会报告凭证已配置但不可用，并跳过自动解析而不是崩溃或错误报告令牌缺失。

  </Accordion>
  <Accordion title="13. Gateway 健康检查 + 重启">
    Doctor 运行健康检查，并在看起来不健康时提供重启 Gateway。
  </Accordion>
  <Accordion title="13b. 内存搜索就绪性">
    Doctor 检查为默认 Agent 配置的内存搜索嵌入 Provider 是否就绪。行为取决于配置的后端和 Provider：

    - **QMD 后端**：探测 `qmd` 二进制文件是否可用且可启动。如果不可用，打印修复指南，包括 npm 包和手动二进制路径选项。
    - **显式本地 Provider**：检查本地模型文件或已识别的远程/可下载模型 URL。如果缺失，建议切换到远程 Provider。
    - **显式远程 Provider**（`openai`、`voyage` 等）：验证环境或认证存储中是否存在 API key。如果缺失，打印可操作的修复提示。
    - **自动 Provider**：先检查本地模型可用性，然后按自动选择顺序尝试每个远程 Provider。

    当缓存的 Gateway 探测结果可用时（检查时 Gateway 健康），doctor 将其结果与 CLI 可见配置进行对照，并注明任何差异。Doctor 不在默认路径上启动新的嵌入 ping；当您需要实时 Provider 检查时，使用深度内存状态命令。

    使用 `openclaw memory status --deep` 在运行时验证嵌入就绪性。

  </Accordion>
  <Accordion title="14. Channel 状态警告">
    如果 Gateway 健康，doctor 运行 Channel 状态探测并报告带有建议修复的警告。
  </Accordion>
  <Accordion title="15. Supervisor 配置审计 + 修复">
    Doctor 检查已安装的 supervisor 配置（launchd/systemd/schtasks）是否缺少或过时的默认值（例如，systemd network-online 依赖项和重启延迟）。当它发现不匹配时，它建议更新并可以将服务文件/任务重写为当前默认值。

    注意：

    - `openclaw doctor` 在重写 supervisor 配置之前提示。
    - `openclaw doctor --yes` 接受默认修复提示。
    - `openclaw doctor --fix` 应用推荐的修复而不提示（`--repair` 是别名）。
    - `openclaw doctor --fix --force` 覆盖自定义 supervisor 配置。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 使 doctor 对 Gateway 服务生命周期保持只读。它仍报告服务健康状况并运行非服务修复，但跳过服务安装/启动/重启/引导、supervisor 配置重写和旧版服务清理，因为外部 supervisor 拥有该生命周期。
    - 在 Linux 上，doctor 在匹配的 systemd Gateway 单元处于活跃状态时不重写命令/入口点元数据。在重复服务扫描期间，它还会忽略非活跃的非旧版类 Gateway 额外单元，使伴随服务文件不产生清理噪音。
    - 如果令牌认证需要令牌且 `gateway.auth.token` 是 SecretRef 管理的，Doctor 服务安装/修复会验证 SecretRef，但不会将解析后的明文令牌值持久化到 supervisor 服务环境元数据中。
    - Doctor 检测托管 `.env`/SecretRef 支持的服务环境值，这些值被旧版 LaunchAgent、systemd 或 Windows 计划任务安装内联嵌入，并重写服务元数据，使这些值从运行时源加载而不是从 supervisor 定义加载。
    - Doctor 检测服务命令在 `gateway.port` 更改后仍固定旧版 `--port` 的情况，并将服务元数据重写为当前端口。
    - 如果令牌认证需要令牌且配置的令牌 SecretRef 未解析，Doctor 会以可操作的指导阻止安装/修复路径。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password` 且 `gateway.auth.mode` 未设置，Doctor 会阻止安装/修复直到明确设置模式。
    - 对于 Linux 用户 systemd 单元，Doctor 令牌漂移检查现在包括 `Environment=` 和 `EnvironmentFile=` 来源，用于比较服务认证元数据。
    - Doctor 服务修复拒绝在配置由较新版本最后写入时从较旧的 OpenClaw 二进制文件重写、停止或重启 Gateway 服务。参见 [Gateway 故障排除](/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 您始终可以通过 `openclaw gateway install --force` 强制完全重写。

  </Accordion>
  <Accordion title="16. Gateway 运行时 + 端口诊断">
    Doctor 检查服务运行时（PID、最后退出状态）并在服务已安装但实际上未运行时发出警告。它还检查 Gateway 端口（默认 `18789`）上的端口冲突，并报告可能的原因（Gateway 已运行，SSH 隧道）。
  </Accordion>
  <Accordion title="17. Gateway 运行时最佳实践">
    当 Gateway 服务在 Bun 或版本管理的 Node 路径（`nvm`、`fnm`、`volta`、`asdf` 等）上运行时，Doctor 会发出警告。WhatsApp + Telegram Channel 需要 Node，并且版本管理器路径可能在升级后中断，因为服务不加载您的 Shell init。当系统 Node 安装可用（Homebrew/apt/choco）时，Doctor 提供迁移到它。

    新安装或修复的 macOS LaunchAgents 使用规范系统 PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是复制交互式 Shell PATH，因此 Homebrew 管理的系统二进制文件保持可用，而 Volta、asdf、fnm、pnpm 和其他版本管理器目录不会改变子进程解析的 Node。Linux 服务仍然保留显式环境根（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和稳定的用户 bin 目录，但只有在磁盘上存在这些目录时，猜测的版本管理器回退目录才会写入服务 PATH。

  </Accordion>
  <Accordion title="18. 配置写入 + 向导元数据">
    Doctor 持久化任何配置更改并标记向导元数据以记录 doctor 运行。
  </Accordion>
  <Accordion title="19. Workspace 提示（备份 + 内存系统）">
    当缺失时，Doctor 建议 workspace 内存系统，并在 workspace 尚未在 git 下时打印备份提示。

    有关 workspace 结构和 git 备份的完整指南（推荐私有 GitHub 或 GitLab），请参见 [/concepts/agent-workspace](/concepts/agent-workspace)。

  </Accordion>
</AccordionGroup>

## 相关

- [Gateway 说明书](/gateway)
- [Gateway 故障排除](/gateway/troubleshooting)
