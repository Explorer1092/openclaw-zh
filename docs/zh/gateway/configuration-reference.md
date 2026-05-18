---
mmh3_hash: "d09077ad8e6c94460ab780f0c38696eb"
summary: "核心 OpenClaw 键、默认值以及专项子系统参考链接的 Gateway 配置参考"
title: "Configuration reference"
read_when:
  - 需要精确的字段级配置语义或默认值时
  - 验证 Channel、模型、Gateway 或工具配置块时
---

`~/.openclaw/openclaw.json` 的核心配置参考。如需面向任务的概览，请参阅 [配置](/gateway/configuration)。

涵盖 OpenClaw 的主要配置接口，并在子系统有自己更深入的参考文档时提供链接。Channel 和插件拥有的命令目录以及深层内存/QMD 配置项在各自的专属页面，而不在此页。

代码事实来源：

- `openclaw config schema` 输出用于验证和 Control UI 的实时 JSON Schema（在可用时合并捆绑/插件/Channel 元数据）
- `config.schema.lookup` 返回路径范围内的 schema 节点，供深入工具使用
- `pnpm config:docs:check` / `pnpm config:docs:gen` 根据当前 schema 表面验证配置文档的基准哈希

Agent 查找路径：在编辑前，使用 `gateway` 工具操作 `config.schema.lookup` 获取精确的字段级文档和约束。使用 [配置](/gateway/configuration) 获取面向任务的指导，使用本页获取更广泛的字段映射、默认值和子系统参考链接。

专项深度参考：

- [内存配置参考](/reference/memory-config)，用于 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations` 和 `plugins.entries.memory-core.config.dreaming` 下的 dreaming 配置
- [Slash Commands](/tools/slash-commands)，用于当前内置 + 捆绑命令目录
- 拥有 Channel/插件页面，用于各 Channel 专用命令接口

配置格式为 **JSON5**（支持注释和末尾逗号）。所有字段均为可选——省略时 OpenClaw 使用安全默认值。

---

## Channels

各 Channel 配置键已移至专属页面——请参阅 [配置 — channels](/gateway/config-channels) 了解 `channels.*`，包括 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 和其他捆绑 Channel（认证、访问控制、多账户、mention 限制）。

## Agent 默认值、多 Agent、Session 和消息

已移至专属页面——请参阅 [配置 — agents](/gateway/config-agents)，涵盖：

- `agents.defaults.*`（workspace、模型、思考、heartbeat、内存、媒体、skills、沙盒）
- `multiAgent.*`（多 Agent 路由和绑定）
- `session.*`（Session 生命周期、压缩、修剪）
- `messages.*`（消息传递、TTS、markdown 渲染）
- `talk.*`（Talk 模式）
  - `talk.consultThinkingLevel`：Control UI Talk 实时咨询后台完整 OpenClaw Agent 运行的 thinking 级别覆盖
  - `talk.consultFastMode`：Control UI Talk 实时咨询的一次性快速模式覆盖
  - `talk.speechLocale`：iOS/macOS 上 Talk 语音识别的可选 BCP 47 区域 ID
  - `talk.silenceTimeoutMs`：未设置时，Talk 保持平台默认的暂停窗口后再发送转录文本（`macOS 和 Android 上 700 ms，iOS 上 900 ms`）

## 工具和自定义提供商

工具策略、实验性开关、提供商支持的工具配置和自定义提供商/base-URL 设置已移至专属页面——请参阅 [配置 — 工具和自定义提供商](/gateway/config-tools)。

## 模型

Provider 定义、model 允许列表和自定义 Provider 设置位于 [配置 — 工具和自定义提供商](/gateway/config-tools#custom-providers-and-base-urls)。`models` 根节点也拥有全局 model 目录行为。

```json5
{
  models: {
    // 可选。默认：true。更改时需要 Gateway 重启。
    pricing: { enabled: false },
  },
}
```

- `models.mode`：Provider 目录行为（`merge` 或 `replace`）。
- `models.providers`：以 provider id 为键的自定义 Provider 映射。
- `models.providers.*.localService`：本地 model 服务器的可选按需进程管理器。OpenClaw 探测已配置的健康端点，在需要时启动绝对路径 `command`，等待就绪，然后发送 model 请求。请参见 [Local model services](/gateway/local-model-services)。
- `models.pricing.enabled`：控制在 sidecars 和 channels 到达 Gateway 就绪路径后启动的后台定价引导。当为 `false` 时，Gateway 跳过 OpenRouter 和 LiteLLM 定价目录获取；已配置的 `models.providers.*.models[].cost` 值仍适用于本地成本估算。

## MCP

OpenClaw 管理的 MCP 服务器定义位于 `mcp.servers` 下，由嵌入式 Pi 和其他运行时适配器使用。`openclaw mcp list`、`show`、`set` 和 `unset` 命令在不连接目标服务器的情况下管理此块。

```json5
{
  mcp: {
    // 可选。默认：600000 ms（10 分钟）。设置 0 禁用空闲驱逐。
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        // 可选的 Codex app-server 投影控制。
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`：命名的 stdio 或远程 MCP 服务器定义，供公开已配置 MCP 工具的运行时使用。远程条目使用 `transport: "streamable-http"` 或 `transport: "sse"`；`type: "http"` 是 `openclaw mcp set` 和 `openclaw doctor --fix` 规范化为 `transport` 字段的 CLI 原生别名。
- `mcp.servers.<name>.codex`：可选的 Codex app-server 投影控制。此块是仅用于 Codex app-server 线程的 OpenClaw 元数据；它不影响 ACP Session、通用 Codex harness 配置或其他运行时适配器。非空 `codex.agents` 将服务器限制为列出的 OpenClaw Agent id。空、空白或无效的范围 Agent 列表被配置验证拒绝，并由运行时投影路径省略，而不是变为全局。`codex.defaultToolsApprovalMode` 为该服务器发出 Codex 的原生 `default_tools_approval_mode`。OpenClaw 在将原生 `mcp_servers` 配置传递给 Codex 之前去除 `codex` 块。省略该块以保持服务器对每个 Codex app-server Agent 的投影，使用 Codex 的默认 MCP 批准行为。
- `mcp.sessionIdleTtlMs`：Session 范围捆绑 MCP 运行时的空闲 TTL。一次性嵌入式运行在运行结束时请求清理；此 TTL 是长期 Session 和未来调用方的最后保障。
- `mcp.*` 下的更改通过释放缓存的 Session MCP 运行时热应用。下次工具发现/使用时从新配置重新创建，因此删除的 `mcp.servers` 条目立即回收，而不是等待空闲 TTL。

参见 [MCP](/cli/mcp#openclaw-as-an-mcp-client-registry) 和 [CLI backends](/gateway/cli-backends#bundle-mcp-overlays) 了解运行时行为。

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或纯文本字符串
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`：仅适用于捆绑 skills 的可选 allowlist（托管/workspace skills 不受影响）。
- `load.extraDirs`：额外的共享 skill 根目录（最低优先级）。
- `load.allowSymlinkTargets`：当链接位于已配置源根之外时，skill 符号链接可以解析到的受信任真实目标根目录。
- `install.preferBrew`：当为 true 时，在 `brew` 可用时优先使用 Homebrew 安装器，然后再回退到其他安装器类型。
- `install.nodeManager`：`metadata.openclaw.install` 规格的节点安装器首选项（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`：允许受信任的 `operator.admin` Gateway 客户端安装通过 `skills.upload.*` 暂存的私有 zip 存档（默认：false）。这仅启用已上传存档路径；正常的 ClawHub 安装不需要它。
- `entries.<skillKey>.enabled: false` 即使已捆绑/安装也禁用该 skill。
- `entries.<skillKey>.apiKey`：声明主要环境变量的 skills 的便捷字段（纯文本字符串或 SecretRef 对象）。

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- 从 `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions` 以及 `plugins.load.paths` 加载。
- 发现接受原生 OpenClaw 插件以及兼容的 Codex 捆绑包和 Claude 捆绑包，包括无清单的 Claude 默认布局捆绑包。
- **配置更改需要重启 Gateway。**
- `allow`：可选的 allowlist（仅列出的插件加载）。`deny` 优先级更高。
- `bundledDiscovery`：对于新配置默认为 `"allowlist"`，因此非空的 `plugins.allow` 也会限制捆绑的 Provider 插件，包括 web-search 运行时 Provider。Doctor 为迁移的旧版 allowlist 配置写入 `"compat"` 以保留现有的捆绑 Provider 行为，直到你选择加入。
- `plugins.entries.<id>.apiKey`：插件级 API 密钥便捷字段（当插件支持时）。
- `plugins.entries.<id>.env`：插件范围的环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：当为 `false` 时，核心阻止 `before_prompt_build` 并忽略旧版 `before_agent_start` 中的提示修改字段，同时保留旧版 `modelOverride` 和 `providerOverride`。适用于原生插件 hook 和受支持的捆绑包提供的 hook 目录。
- `plugins.entries.<id>.hooks.allowConversationAccess`：当为 `true` 时，受信任的非捆绑插件可以从类型化 hook（如 `llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize` 和 `agent_end`）中读取原始对话内容。
- `plugins.entries.<id>.subagent.allowModelOverride`：明确信任此插件为后台子 Agent 运行请求每次运行的 `provider` 和 `model` 覆盖。
- `plugins.entries.<id>.subagent.allowedModels`：受信任子 Agent 覆盖的可选规范 `provider/model` 目标 allowlist。仅当您有意允许任何模型时使用 `"*"`。
- `plugins.entries.<id>.llm.allowModelOverride`：明确信任此插件为 `api.runtime.llm.complete` 请求 model 覆盖。
- `plugins.entries.<id>.llm.allowedModels`：受信任插件 LLM 完成覆盖的可选规范 `provider/model` 目标 allowlist。仅当您有意允许任何模型时使用 `"*"`。
- `plugins.entries.<id>.llm.allowAgentIdOverride`：明确信任此插件针对非默认 Agent id 运行 `api.runtime.llm.complete`。
- `plugins.entries.<id>.config`：插件定义的配置对象（当原生 OpenClaw 插件 schema 可用时验证）。
- Channel 插件账户/运行时设置位于 `channels.<id>` 下，应由拥有插件的清单 `channelConfigs` 元数据描述，而不由中央 OpenClaw 选项注册表描述。
### Codex harness 插件配置

捆绑的 `codex` 插件拥有 `plugins.entries.codex.config` 下的原生 Codex app-server harness 设置。完整配置接口请参见 [Codex harness reference](/plugins/codex-harness-reference)，运行时模型请参见 [Codex harness](/plugins/codex-harness)。

`codexPlugins` 仅适用于选择原生 Codex harness 的 Session。它不为 Pi、普通 OpenAI Provider 运行、ACP 对话绑定或任何非 Codex harness 启用 Codex 插件。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`：为 Codex harness 启用原生 Codex 插件/应用支持。默认：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`：已迁移插件应用引导的默认破坏性操作策略。默认：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`：当全局 `codexPlugins.enabled` 也为 true 时启用已迁移的插件条目。显式条目默认：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`：稳定的市场标识。V1 仅支持 `"openai-curated"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`：迁移的稳定 Codex 插件标识，例如 `"google-calendar"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`：每插件破坏性操作覆盖。省略时使用全局 `allow_destructive_actions` 值。

`codexPlugins.enabled` 是全局启用指令。由迁移写入的显式插件条目是持久安装和修复资格集。`plugins["*"]` 不受支持，没有 `install` 开关，本地 `marketplacePath` 值有意不是配置字段，因为它们是主机特定的。

`app/list` 就绪检查缓存一小时，过期时异步刷新。Codex 线程应用配置在 Codex harness Session 建立时计算，而不是在每轮次；在更改原生插件配置后使用 `/new`、`/reset` 或 Gateway 重启。

- `plugins.entries.firecrawl.config.webFetch`：Firecrawl web-fetch 提供商设置。
  - `apiKey`：Firecrawl API 密钥（接受 SecretRef）。回退到 `plugins.entries.firecrawl.config.webSearch.apiKey`、旧版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 环境变量。
  - `baseUrl`：Firecrawl API 基础 URL（默认：`https://api.firecrawl.dev`）。
  - `onlyMainContent`：仅从页面提取主要内容（默认：`true`）。
  - `maxAgeMs`：最大缓存年龄（毫秒）（默认：`172800000` / 2 天）。
  - `timeoutSeconds`：抓取请求超时（秒）（默认：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok web 搜索）设置。
  - `enabled`：启用 X Search 提供商。
  - `model`：用于搜索的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：内存 dreaming 设置。参见 [Dreaming](/concepts/dreaming) 了解阶段和阈值。
  - `enabled`：主 dreaming 开关（默认 `false`）。
  - `frequency`：每次完整 dreaming 扫描的 cron 节奏（默认 `"0 3 * * *"`）。
  - `model`：可选的 Dream Diary 子 Agent model 覆盖。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；配合 `allowedModels` 限制目标。model 不可用错误会用 Session 默认 model 重试一次；信任或 allowlist 失败不会静默回退。
  - 阶段策略和阈值是实现细节（非用户面向的配置键）。
- 完整内存配置位于 [内存配置参考](/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 启用的 Claude 捆绑插件也可以从 `settings.json` 贡献嵌入式 Pi 默认值；OpenClaw 将这些作为经过清理的 Agent 设置应用，而不是作为原始 OpenClaw 配置补丁。
- `plugins.slots.memory`：选择活跃的内存插件 ID，或 `"none"` 禁用内存插件。
- `plugins.slots.contextEngine`：选择活跃的上下文引擎插件 ID；默认为 `"legacy"`，除非安装并选择了另一个引擎。

参见 [Plugins](/tools/plugin)。

---

## Commitments

`commitments` 控制推断的后续内存：OpenClaw 可以从对话轮次中检测签到并通过 heartbeat 运行传递它们。

- `commitments.enabled`：启用隐藏的 LLM 提取、存储和 heartbeat 传递，用于推断的后续承诺。默认：`false`。
- `commitments.maxPerDay`：每 Agent Session 在滚动一天内传递的最大推断后续承诺数。默认：`3`。

参见 [Inferred commitments](/concepts/commitments)。

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅对受信任的私有网络访问启用
      // allowPrivateNetwork: true, // 旧版别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` 禁用 `act:evaluate` 和 `wait --fn`。
- `tabCleanup` 在空闲时间后或 Session 超出上限时回收已跟踪的主 Agent 标签页。设置 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 可禁用这些单独的清理模式。
- 未设置时 `ssrfPolicy.dangerouslyAllowPrivateNetwork` 被禁用，因此浏览器导航默认保持严格模式。
- 仅当您有意信任私有网络浏览器导航时，才设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在严格模式下，远程 CDP 配置文件端点（`profiles.*.cdpUrl`）在可达性/发现检查期间受到相同的私有网络阻止。
- `ssrfPolicy.allowPrivateNetwork` 作为旧版别名仍受支持。
- 在严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 添加明确的例外。
- 远程配置文件仅支持附加（禁用启动/停止/重置）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。使用 HTTP(S) 让 OpenClaw 发现 `/json/version`；使用 WS(S) 当提供商给您一个直接的 DevTools WebSocket URL 时。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 适用于远程和 `attachOnly` CDP 可达性以及标签页打开请求。托管的回环配置文件保持本地 CDP 默认值。
- 如果外部管理的 CDP 服务通过回环可达，将该配置文件的 `attachOnly: true` 设置；否则 OpenClaw 将回环端口视为本地托管浏览器配置文件，可能报告本地端口所有权错误。
- `existing-session` 配置文件使用 Chrome MCP 而不是 CDP，可以在选定的主机上或通过连接的浏览器节点附加。
- `existing-session` 配置文件可以设置 `userDataDir` 以针对特定的基于 Chromium 的浏览器配置文件，如 Brave 或 Edge。
- `existing-session` 配置文件保持当前 Chrome MCP 路由限制：快照/ref 驱动的操作而非 CSS 选择器定位、单文件上传 hook、无对话框超时覆盖、无 `wait --load networkidle`，以及无 `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地托管的 `openclaw` 配置文件自动分配 `cdpPort` 和 `cdpUrl`；仅为远程 CDP 显式设置 `cdpUrl`。
- 本地托管配置文件可以设置 `executablePath` 以覆盖该配置文件的全局 `browser.executablePath`。用于在 Chrome 中运行一个配置文件，在 Brave 中运行另一个。
- 本地托管配置文件使用 `browser.localLaunchTimeoutMs` 进行进程启动后的 Chrome CDP HTTP 发现，使用 `browser.localCdpReadyTimeoutMs` 进行启动后 CDP websocket 就绪。在较慢主机上提高这些值，Chrome 成功启动但就绪检查与启动竞争。两个值必须是最大 `120000` ms 的正整数；无效配置值被拒绝。
- 自动检测顺序：默认浏览器（如果基于 Chromium）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 在 Chromium 启动前都接受 `~` 和 `~/...` 作为您的操作系统主目录。`existing-session` 配置文件上的每配置文件 `userDataDir` 也进行波浪号展开。
- Control 服务：仅回环（端口从 `gateway.port` 派生，默认 `18791`）。
- `extraArgs` 为本地 Chromium 启动附加额外的启动标志（例如 `--disable-gpu`、窗口大小或调试标志）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji、短文本、图片 URL 或 data URI
    },
  },
}
```

- `seamColor`：原生应用 UI chrome 的强调色（Talk Mode 气泡色调等）。
- `assistant`：Control UI 身份覆盖。回退到活跃 Agent 身份。

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // 或 OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // 用于 mode=trusted-proxy；参见 /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // 危险：允许绝对外部 http(s) 嵌入 URL
      // allowedOrigins: ["https://control.example.com"], // 非回环 Control UI 必须
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危险的 Host 头源回退模式
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // 可选。默认 false。
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // 可选。默认未设置/禁用。
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // 额外的 /tools/invoke HTTP 拒绝
      deny: ["browser"],
      // 从默认 HTTP 拒绝列表中删除工具
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway 字段详情">

- `mode`：`local`（运行 Gateway）或 `remote`（连接到远程 Gateway）。Gateway 拒绝启动，除非是 `local`。
- `port`：WS + HTTP 的单一多路复用端口。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（仅 Tailscale IP）或 `custom`。
- **旧版绑定别名**：在 `gateway.bind` 中使用绑定模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），而不是主机别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意**：默认的 `loopback` 绑定在容器内监听 `127.0.0.1`。使用 Docker bridge 网络（`-p 18789:18789`），流量到达 `eth0`，因此 Gateway 不可访问。使用 `--network host`，或设置 `bind: "lan"`（或带 `customBindHost: "0.0.0.0"` 的 `bind: "custom"`）监听所有接口。
- **Auth**：默认必需。非回环绑定需要 Gateway auth。实际上意味着共享令牌/密码或带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。引导向导默认生成令牌。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），请显式设置 `gateway.auth.mode` 为 `token` 或 `password`。当两者都配置且模式未设置时，启动和服务安装/修复流程会失败。
- `gateway.auth.mode: "none"`：明确的无认证模式。仅用于受信任的本地回环设置；引导向导故意不提供此选项。
- `gateway.auth.mode: "trusted-proxy"`：将认证委托给身份感知反向代理，并信任来自 `gateway.trustedProxies` 的身份头（参见 [Trusted Proxy Auth](/gateway/trusted-proxy-auth)）。此模式期望**非回环**代理源；同主机回环反向代理需要显式 `gateway.auth.trustedProxy.allowLoopback = true`。内部同主机调用者可以使用 `gateway.auth.password` 作为本地直接回退；`gateway.auth.token` 仍与 trusted-proxy 模式互斥。
- `gateway.auth.allowTailscale`：当为 `true` 时，Tailscale Serve 身份头可以满足 Control UI/WebSocket auth（通过 `tailscale whois` 验证）。HTTP API 端点**不**使用该 Tailscale 头认证；它们遵循 Gateway 的正常 HTTP 认证模式。此无令牌流程假设 Gateway 主机是受信任的。当 `tailscale.mode = "serve"` 时默认为 `true`。
- `gateway.auth.rateLimit`：可选的认证失败限制器。按客户端 IP 和 auth 范围应用（共享密钥和设备令牌独立跟踪）。被阻止的尝试返回 `429` + `Retry-After`。
  - 在异步 Tailscale Serve Control UI 路径上，来自同一 `{scope, clientIp}` 的失败尝试在失败写入之前序列化。来自同一客户端的并发错误尝试因此可能在第二个请求上触发限制器，而不是两个都作为普通不匹配通过。
  - `gateway.auth.rateLimit.exemptLoopback` 默认为 `true`；当您有意希望对 localhost 流量也进行速率限制时设置为 `false`（用于测试设置或严格代理部署）。
- 浏览器源 WS 认证尝试始终在禁用回环豁免的情况下受到限制（深度防御，对抗基于浏览器的 localhost 暴力破解）。
- 在回环上，这些浏览器源锁定按规范化的 `Origin` 值隔离，因此来自一个 localhost 源的重复失败不会自动锁定不同的源。
- `tailscale.mode`：`serve`（仅 tailnet，回环绑定）或 `funnel`（公开，需要 auth）。
- `tailscale.preserveFunnel`：当为 `true` 且 `tailscale.mode = "serve"` 时，OpenClaw 在启动时重新应用 Serve 之前检查 `tailscale funnel status`，如果外部配置的 Funnel 路由已覆盖 Gateway 端口，则跳过。默认 `false`。
- `controlUi.allowedOrigins`：Gateway WebSocket 连接的明确浏览器源 allowlist。非回环公共浏览器源必需。从回环、RFC1918/链路本地、`.local`、`.ts.net` 或 Tailscale CGNAT 主机加载的私有同源 LAN/Tailnet UI 无需启用 Host 头回退即可接受。
- `controlUi.chatMessageMaxWidth`：分组 Control UI 聊天消息的可选最大宽度。接受受约束的 CSS 宽度值，如 `960px`、`82%`、`min(1280px, 82%)` 和 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危险模式，为有意依赖 Host 头源策略的部署启用 Host 头源回退。
- `remote.transport`：`ssh`（默认）或 `direct`（ws/wss）。对于 `direct`，公共主机的 `remote.url` 必须是 `wss://`；明文 `ws://` 仅对回环、LAN、链路本地、`.local`、`.ts.net` 和 Tailscale CGNAT 主机接受。
- `remote.remotePort`：远程 SSH 主机上的 Gateway 端口。默认为 `18789`；当本地隧道端口与远程 Gateway 端口不同时使用此项。
- `gateway.remote.token` / `.password` 是远程客户端凭证字段。它们本身不配置 Gateway auth。
- `gateway.push.apns.relay.baseUrl`：官方/TestFlight iOS 构建在向 Gateway 发布中继支持的注册后使用的外部 APNs 中继的基础 HTTPS URL。此 URL 必须与编译到 iOS 构建中的中继 URL 匹配。
- `gateway.push.apns.relay.timeoutMs`：Gateway 到中继的发送超时（毫秒）。默认为 `10000`。
- 中继支持的注册被委托给特定的 Gateway 身份。配对的 iOS 应用获取 `gateway.identity.get`，在中继注册中包含该身份，并向 Gateway 转发注册范围的发送授权。另一个 Gateway 不能重用该存储的注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：上述中继配置的临时环境变量覆盖。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：仅开发用的回环 HTTP 中继 URL 的紧急出口。生产中继 URL 应保持在 HTTPS 上。
- `gateway.channelHealthCheckMinutes`：Channel 健康监控间隔（分钟）。设置 `0` 全局禁用健康监控重启。默认：`5`。
- `gateway.channelStaleEventThresholdMinutes`：过期 socket 阈值（分钟）。保持大于或等于 `gateway.channelHealthCheckMinutes`。默认：`30`。
- `gateway.channelMaxRestartsPerHour`：滚动小时内每个 Channel/账户的最大健康监控重启次数。默认：`10`。
- `channels.<provider>.healthMonitor.enabled`：Channel 级别的健康监控重启退出，同时保持全局监控启用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账户 Channel 的每账户覆盖。设置时优先于 Channel 级别覆盖。
- `gateway.handshakeTimeoutMs`：预认证 Gateway WebSocket 握手超时（毫秒）。默认：`15000`。设置时 `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 优先。在启动预热仍在稳定的负载或低功耗主机上增加此值，以使本地客户端能够连接。
- 本地 Gateway 调用路径仅在 `gateway.auth.*` 未设置时可以使用 `gateway.remote.*` 作为回退。
- 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置且未解析，解析失败关闭（无远程回退掩盖）。
- `trustedProxies`：终止 TLS 或注入转发客户端头的反向代理 IP。只列出您控制的代理。回环条目对于同主机代理/本地检测设置（例如 Tailscale Serve 或本地反向代理）仍然有效，但它们**不**使回环请求符合 `gateway.auth.mode: "trusted-proxy"` 的条件。
- `allowRealIpFallback`：当为 `true` 时，如果 `X-Forwarded-For` 缺失，Gateway 接受 `X-Real-IP`。默认 `false` 用于失败关闭行为。
- `gateway.nodes.pairing.autoApproveCidrs`：用于自动批准首次节点设备配对（无请求范围）的可选 CIDR/IP allowlist。未设置时禁用。不自动批准 operator/浏览器/Control UI/WebChat 配对，也不自动批准角色、范围、元数据或公钥升级。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`：配对和平台 allowlist 评估后声明的节点命令的全局允许/拒绝整形。使用 `allowCommands` 选择加入危险节点命令，如 `camera.snap`、`camera.clip` 和 `screen.record`；`denyCommands` 即使平台默认或显式允许也会删除命令。节点更改其声明的命令列表后，拒绝并重新批准该设备配对，以便 Gateway 存储更新的命令快照。
- `gateway.tools.deny`：HTTP `POST /tools/invoke` 的额外阻止工具名称（扩展默认拒绝列表）。
- `gateway.tools.allow`：从默认 HTTP 拒绝列表中删除工具名称。

</Accordion>

### OpenAI 兼容端点

- Admin HTTP RPC：默认关闭，作为 `admin-http-rpc` 插件。启用插件以注册 `POST /api/v1/admin/rpc`。参见 [Admin HTTP RPC](/plugins/admin-http-rpc)。
- Chat Completions：默认禁用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 启用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 输入强化：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空 allowlist 被视为未设置；使用 `gateway.http.endpoints.responses.files.allowUrl=false` 和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 禁用 URL 获取。
- 可选响应强化头：
  - `gateway.http.securityHeaders.strictTransportSecurity`（仅为您控制的 HTTPS 源设置；参见 [Trusted Proxy Auth](/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多实例隔离

在一台主机上运行多个 Gateway，使用唯一端口和状态目录：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便捷标志：`--dev`（使用 `~/.openclaw-dev` + 端口 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

参见 [多个 Gateway](/gateway/multiple-gateways)。

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`：在 Gateway 监听器上启用 TLS 终止（HTTPS/WSS）（默认：`false`）。
- `autoGenerate`：当未配置显式文件时自动生成本地自签名证书/密钥对；仅用于本地/开发。
- `certPath`：TLS 证书文件的文件系统路径。
- `keyPath`：TLS 私钥文件的文件系统路径；保持权限限制。
- `caPath`：用于客户端验证或自定义信任链的可选 CA 捆绑包路径。

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`：控制如何在运行时应用配置编辑。
  - `"off"`：忽略实时编辑；更改需要显式重启。
  - `"restart"`：配置更改时始终重启 Gateway 进程。
  - `"hot"`：在进程内应用更改而不重启。
  - `"hybrid"`（默认）：首先尝试热重载；如果需要则回退到重启。
- `debounceMs`：应用配置更改前的防抖窗口（毫秒，非负整数）。
- `deferralTimeoutMs`：等待飞行中操作完成后强制重启或 Channel 热重载的可选最大时间（毫秒）。省略以使用默认的有界等待（`300000`）；设置 `0` 以无限期等待并记录定期的仍待处理警告。

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

认证：`Authorization: Bearer <token>` 或 `x-openclaw-token: <token>`。
查询字符串 hook 令牌被拒绝。

验证和安全注意事项：

- `hooks.enabled=true` 需要非空的 `hooks.token`。
- `hooks.token` 必须**与** `gateway.auth.token` **不同**；重用 Gateway 令牌被拒绝。
- `hooks.path` 不能是 `/`；使用专用子路径，如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，约束 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果映射或预设使用模板化的 `sessionKey`，设置 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。静态映射键不需要该选项。

**端点：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 请求负载中的 `sessionKey` 仅在 `hooks.allowRequestSessionKey=true`（默认：`false`）时接受。
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析
  - 模板渲染的映射 `sessionKey` 值被视为外部提供，也需要 `hooks.allowRequestSessionKey=true`。

<Accordion title="映射详情">

- `match.path` 匹配 `/hooks` 后的子路径（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 匹配通用路径的负载字段。
- 如 `{{messages[0].subject}}` 的模板从负载读取。
- `transform` 可以指向返回 hook 操作的 JS/TS 模块。
  - `transform.module` 必须是相对路径，并保持在 `hooks.transformsDir` 内（绝对路径和遍历被拒绝）。
- `agentId` 路由到特定 Agent；未知 ID 回退到默认。
- `allowedAgentIds`：限制显式路由（`*` 或省略 = 允许全部，`[]` = 拒绝全部）。
- `defaultSessionKey`：没有显式 `sessionKey` 的 hook Agent 运行的可选固定 Session 键。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用者和模板驱动的映射 Session 键设置 `sessionKey`（默认：`false`）。
- `allowedSessionKeyPrefixes`：显式 `sessionKey` 值（请求 + 映射）的可选前缀 allowlist，例如 `["hook:"]`。当任何映射或预设使用模板化 `sessionKey` 时变为必需。
- `deliver: true` 将最终回复发送到 Channel；`channel` 默认为 `last`。
- `model` 覆盖此 hook 运行的 LLM（如果设置了模型目录，必须被允许）。

</Accordion>

### Gmail 集成

- 内置 Gmail 预设使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果保留该每消息路由，设置 `hooks.allowRequestSessionKey: true` 并约束 `hooks.allowedSessionKeyPrefixes` 以匹配 Gmail 命名空间，例如 `["hook:", "hook:gmail:"]`。
- 如果需要 `hooks.allowRequestSessionKey: false`，用静态 `sessionKey` 覆盖预设，而不是模板化默认值。

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 配置后，Gateway 在启动时自动启动 `gog gmail watch serve`。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 禁用。
- 不要在 Gateway 旁边单独运行 `gog gmail watch serve`。

---

## Canvas plugin host

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // 或 OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- 在 Gateway 端口下通过 HTTP 提供 Agent 可编辑的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 仅本地：保持 `gateway.bind: "loopback"`（默认）。
- 非回环绑定：canvas 路由需要 Gateway auth（令牌/密码/trusted-proxy），与其他 Gateway HTTP 接口相同。
- 节点 WebView 通常不发送 auth 头；配对并连接节点后，Gateway 为 canvas/A2UI 访问广播节点范围的功能 URL。
- 功能 URL 绑定到活跃的节点 WS Session 并快速过期。不使用基于 IP 的回退。
- 向提供的 HTML 注入实时重载客户端。
- 当为空时自动创建启动器 `index.html`。
- 也在 `/__openclaw__/a2ui/` 提供 A2UI。
- 更改需要重启 Gateway。
- 对于大目录或 `EMFILE` 错误，禁用实时重载。

---

## Discovery

### mDNS（Bonjour）

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`（捆绑的 `bonjour` 插件启用时的默认值）：从 TXT 记录中省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`；LAN 组播广告仍然需要启用捆绑的 `bonjour` 插件。
- `off`：在不更改插件启用状态的情况下抑制 LAN 组播广告。
- 捆绑的 `bonjour` 插件在 macOS 主机上自动启动，在 Linux、Windows 和容器化 Gateway 部署上为选择加入。
- 主机名在有效 DNS 标签时默认为系统主机名，回退到 `openclaw`。使用 `OPENCLAW_MDNS_HOSTNAME` 覆盖。

### Wide-area（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下写入单播 DNS-SD 区域。对于跨网络发现，配合 DNS 服务器（推荐 CoreDNS）+ Tailscale split DNS。

设置：`openclaw dns setup --apply`。

---

## Environment

### `env`（内联环境变量）

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- 内联环境变量仅在进程环境缺少该键时应用。
- `.env` 文件：CWD `.env` + `~/.openclaw/.env`（两者都不覆盖现有变量）。
- `shellEnv`：从您的登录 shell profile 导入缺少的预期键。
- 参见 [Environment](/help/environment) 了解完整优先级。

### 环境变量替换

使用 `${VAR_NAME}` 在任何配置字符串中引用环境变量：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`。
- 缺失/空变量在配置加载时抛出错误。
- 使用 `$${VAR}` 转义以获得字面 `${VAR}`。
- 在 `$include` 中有效。

---

## Secrets

Secret ref 是附加的：纯文本值仍然有效。

### `SecretRef`

使用一种对象形状：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

验证：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id：绝对 JSON 指针（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` id 模式：`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` id 不得包含 `.` 或 `..` 斜杠分隔的路径段（例如 `a/../b` 被拒绝）

### 支持的凭证接口

- 规范矩阵：[SecretRef 凭证接口](/reference/secretref-credential-surface)
- `secrets apply` 针对支持的 `openclaw.json` 凭证路径。
- `auth-profiles.json` ref 包含在运行时解析和审计覆盖中。

### Secret 提供商配置

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 可选的显式 env 提供商
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

注意：

- `file` 提供商支持 `mode: "json"` 和 `mode: "singleValue"`（singleValue 模式下 `id` 必须是 `"value"`）。
- 当 Windows ACL 验证不可用时，文件和 exec 提供商路径失败关闭。仅对无法验证的受信任路径设置 `allowInsecurePath: true`。
- `exec` 提供商需要绝对 `command` 路径，并在 stdin/stdout 上使用协议负载。
- 默认情况下，符号链接命令路径被拒绝。设置 `allowSymlinkCommand: true` 允许符号链接路径，同时验证解析的目标路径。
- 如果配置了 `trustedDirs`，受信任目录检查适用于解析的目标路径。
- `exec` 子环境默认最小；使用 `passEnv` 显式传递所需变量。
- Secret ref 在激活时解析为内存快照，然后请求路径仅读取快照。
- 激活期间应用活跃接口过滤：启用接口上的未解析 ref 导致启动/重载失败，而不活跃接口被跳过并带有诊断信息。

---

## Auth 存储

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- 每 Agent profile 存储在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支持值级别 ref（`api_key` 的 `keyRef`，`token` 的 `tokenRef`）用于静态凭证模式。
- OAuth 模式 profile（`auth.profiles.<id>.mode = "oauth"`）不支持 SecretRef 支持的 auth-profile 凭证。
- 静态运行时凭证来自内存解析的快照；发现旧版静态 `auth.json` 条目时被清除。
- 从 `~/.openclaw/credentials/oauth.json` 导入旧版 OAuth。
- 参见 [OAuth](/concepts/oauth)。
- Secret 运行时行为和 `audit/configure/apply` 工具：[Secrets 管理](/gateway/secrets)。

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`：profile 因真实计费/信用不足错误失败时的基础退避时间（小时）（默认：`5`）。显式计费文本甚至可能在 `401`/`403` 响应上出现，但提供商特定文本匹配器仍限定在拥有它们的提供商（例如 OpenRouter `Key limit exceeded`）。可重试的 HTTP `402` 使用窗口或组织/工作区支出限制消息保留在 `rate_limit` 路径中。
- `billingBackoffHoursByProvider`：计费退避小时数的可选每提供商覆盖。
- `billingMaxHours`：计费退避指数增长的上限（小时）（默认：`24`）。
- `authPermanentBackoffMinutes`：高置信度 `auth_permanent` 失败的基础退避（分钟）（默认：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避增长上限（分钟）（默认：`60`）。
- `failureWindowHours`：退避计数器使用的滚动窗口（小时）（默认：`24`）。
- `overloadedProfileRotations`：在切换到模型回退之前，过载错误的最大同提供商 auth-profile 轮换次数（默认：`1`）。`ModelNotReadyException` 等提供商繁忙形态落在此处。
- `overloadedBackoffMs`：在重试过载提供商/profile 轮换之前的固定延迟（默认：`0`）。
- `rateLimitedProfileRotations`：在切换到模型回退之前，速率限制错误的最大同提供商 auth-profile 轮换次数（默认：`1`）。该速率限制桶包括提供商形态文本，如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

---

## Logging

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- 默认日志文件：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 设置 `logging.file` 获得稳定的路径。
- `--verbose` 时 `consoleLevel` 提升到 `debug`。
- `maxFileBytes`：轮换前活跃日志文件的最大大小（字节，正整数；默认：`104857600` = 100 MB）。OpenClaw 在活跃文件旁保留最多五个编号的存档。
- `redactSensitive` / `redactPatterns`：控制台输出、文件日志、OTLP 日志记录和持久化 Session 转录文本的尽力屏蔽。

---

## Diagnostics

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`：检测输出的主开关（默认：`true`）。
- `flags`：启用定向日志输出的标志字符串数组（支持通配符如 `"telegram.*"` 或 `"*"`）。
- `stuckSessionWarnMs`：将长时间运行的处理 Session 分类为 `session.long_running`、`session.stalled` 或 `session.stuck` 的无进展年龄阈值（毫秒）。回复、工具、状态、block 和 ACP 进展会重置计时器；重复的 `session.stuck` 诊断在状态未变时会降频。
- `stuckSessionAbortMs`：符合中止排空恢复条件之前的无进展年龄阈值（毫秒）。未设置时，OpenClaw 使用至少 5 分钟和 3 倍 `stuckSessionWarnMs` 的更安全的扩展嵌入式运行窗口。
- `memoryPressureSnapshot`：当内存压力达到 `critical` 时捕获已修订的 OOM 前稳定性快照（默认：`false`）。设置为 `true` 可在保持正常内存压力事件的同时添加稳定性捆绑文件扫描/写入。
- `otel.enabled`：启用 OpenTelemetry 导出管道（默认：`false`）。完整配置、信号目录和隐私模型参见 [OpenTelemetry 导出](/gateway/opentelemetry)。
- `otel.endpoint`：OTel 导出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：可选的特定信号 OTLP 端点。设置时，仅为该信号覆盖 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（默认）或 `"grpc"`。
- `otel.headers`：随 OTel 导出请求发送的额外 HTTP/gRPC 元数据头。
- `otel.serviceName`：资源属性的服务名称。
- `otel.traces` / `otel.metrics` / `otel.logs`：启用跟踪、指标或日志导出。
- `otel.sampleRate`：跟踪采样率 `0`–`1`。
- `otel.flushIntervalMs`：定期遥测刷新间隔（毫秒）。
- `otel.captureContent`：OTEL span 属性的选择性原始内容捕获。默认关闭。布尔 `true` 捕获非系统消息/工具内容；对象形式允许您显式启用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs` 和 `systemPrompt`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：最新实验性 GenAI span 提供商属性的环境开关。默认情况下 span 保持旧版 `gen_ai.system` 属性以保持兼容性；GenAI 指标使用有界语义属性。
- `OPENCLAW_OTEL_PRELOADED=1`：已注册全局 OpenTelemetry SDK 的主机的环境开关。OpenClaw 然后跳过插件拥有的 SDK 启动/关闭，同时保持诊断监听器活跃。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 和 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：当匹配的配置键未设置时使用的特定信号端点环境变量。
- `cacheTrace.enabled`：记录嵌入式运行的缓存跟踪快照（默认：`false`）。
- `cacheTrace.filePath`：缓存跟踪 JSONL 的输出路径（默认：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制缓存跟踪输出中包含的内容（全部默认：`true`）。

---

## Update

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`：npm/git 安装的发布渠道——`"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`：Gateway 启动时检查 npm 更新（默认：`true`）。
- `auto.enabled`：为包安装启用后台自动更新（默认：`false`）。
- `auto.stableDelayHours`：stable 渠道自动应用前的最小延迟（小时）（默认：`6`；最大：`168`）。
- `auto.stableJitterHours`：额外的 stable 渠道发布分散窗口（小时）（默认：`12`；最大：`168`）。
- `auto.betaCheckIntervalHours`：beta 渠道检查运行的频率（小时）（默认：`1`；最大：`24`）。

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`：全局 ACP 功能开关（默认：`true`；设置 `false` 隐藏 ACP 调度和生成功能）。
- `dispatch.enabled`：ACP Session 轮次调度的独立开关（默认：`true`）。设置 `false` 保持 ACP 命令可用，同时阻止执行。
- `backend`：默认 ACP 运行时后端 ID（必须匹配已注册的 ACP 运行时插件）。如果设置了 `plugins.allow`，包含后端插件 ID（例如 `acpx`），否则捆绑的默认插件不会加载。
- `defaultAgent`：spawn 未指定显式目标时的回退 ACP 目标 Agent ID。
- `allowedAgents`：ACP 运行时 Session 允许的 Agent ID allowlist；为空表示无额外限制。
- `maxConcurrentSessions`：最大并发活跃 ACP Session 数。
- `stream.coalesceIdleMs`：流式文本的空闲刷新窗口（毫秒）。
- `stream.maxChunkChars`：分割流式块投影前的最大块大小。
- `stream.repeatSuppression`：每轮次抑制重复的状态/工具行（默认：`true`）。
- `stream.deliveryMode`：`"live"` 增量流式传输；`"final_only"` 缓冲直到轮次终端事件。
- `stream.hiddenBoundarySeparator`：隐藏工具事件后可见文本前的分隔符（默认：`"paragraph"`）。
- `stream.maxOutputChars`：每 ACP 轮次投影的最大助手输出字符数。
- `stream.maxSessionUpdateChars`：投影的 ACP 状态/更新行的最大字符数。
- `stream.tagVisibility`：标签名称到布尔可见性覆盖的记录，用于流式事件。
- `runtime.ttlMinutes`：ACP Session 工作者在符合清理条件前的空闲 TTL（分钟）。
- `runtime.installCommand`：引导 ACP 运行时环境时运行的可选安装命令。

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` 控制横幅标语样式：
  - `"random"`（默认）：旋转有趣/季节性标语。
  - `"default"`：固定的中性标语（`All your chats, one OpenClaw.`）。
  - `"off"`：无标语文本（横幅标题/版本仍显示）。
- 要隐藏整个横幅（不仅是标语），设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

---

## Wizard

CLI 引导流程（`onboard`、`configure`、`doctor`）写入的元数据：

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identity

参见 [Agent 默认值](/gateway/config-agents#agent-defaults) 下的 `agents.list` 身份字段。

---

## Bridge（旧版，已移除）

当前构建不再包含 TCP bridge。节点通过 Gateway WebSocket 连接。`bridge.*` 键不再是配置 schema 的一部分（验证失败直到删除；`openclaw doctor --fix` 可以去除未知键）。

<Accordion title="旧版 bridge 配置（历史参考）">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2, // cron 调度 + 隔离的 cron Agent 轮次执行
    webhook: "https://example.invalid/legacy", // 存储的 notify:true 任务的旧版回退
    webhookToken: "replace-with-dedicated-token", // 出站 webhook auth 的可选 Bearer 令牌
    sessionRetention: "24h", // 持续时间字符串或 false
    runLog: {
      maxBytes: "2mb", // 默认 2_000_000 字节
      keepLines: 2000, // 默认 2000
    },
  },
}
```

- `sessionRetention`：修剪前保留已完成的隔离 cron 运行 Session 的时间。也控制已存档删除的 cron 转录的清理。默认：`24h`；设置 `false` 禁用。
- `runLog.maxBytes`：每个运行日志文件（`cron/runs/<jobId>.jsonl`）修剪前的最大大小。默认：`2_000_000` 字节。
- `runLog.keepLines`：触发运行日志修剪时保留的最新行数。默认：`2000`。
- `webhookToken`：用于 cron webhook POST 传递（`delivery.mode = "webhook"`）的 Bearer 令牌，如果省略则不发送认证头。
- `webhook`：旧版回退 webhook URL（http/https），仅用于仍有 `notify: true` 的存储任务。

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`：一次性任务在瞬态错误时的最大重试次数（默认：`3`；范围：`0`–`10`）。
- `backoffMs`：每次重试尝试的退避延迟数组（毫秒）（默认：`[30000, 60000, 300000]`；1–10 个条目）。
- `retryOn`：触发重试的错误类型——`"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略以重试所有瞬态类型。

仅适用于一次性 cron 任务。周期性任务使用单独的失败处理。

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`：为 cron 任务启用失败告警（默认：`false`）。
- `after`：触发告警前的连续失败次数（正整数，最小：`1`）。
- `cooldownMs`：同一任务重复告警之间的最小毫秒数（非负整数）。
- `includeSkipped`：将连续跳过的运行计入告警阈值（默认：`false`）。跳过的运行单独跟踪，不影响执行错误退避。
- `mode`：传递模式——`"announce"` 通过 Channel 消息发送；`"webhook"` 发布到已配置的 webhook。
- `accountId`：可选的账户或 Channel ID，用于限定告警传递范围。

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- 所有任务的 cron 失败通知的默认目的地。
- `mode`：`"announce"` 或 `"webhook"`；当有足够的目标数据时默认为 `"announce"`。
- `channel`：announce 传递的 Channel 覆盖。`"last"` 重用最后已知的传递 Channel。
- `to`：显式 announce 目标或 webhook URL。webhook 模式必需。
- `accountId`：传递的可选账户覆盖。
- 每任务 `delivery.failureDestination` 覆盖此全局默认值。
- 当全局和每任务失败目的地都未设置时，已通过 `announce` 传递的任务在失败时回退到该主要 announce 目标。
- `delivery.failureDestination` 仅对 `sessionTarget="isolated"` 任务受支持，除非任务的主要 `delivery.mode` 是 `"webhook"`。

参见 [Cron 任务](/automation/cron-jobs)。隔离的 cron 执行跟踪为[后台任务](/automation/tasks)。

---

## 媒体模型模板变量

在 `tools.media.models[].args` 中展开的模板占位符：

| 变量               | 描述                                      |
| ------------------ | ----------------------------------------- |
| `{{Body}}`         | 完整的入站消息正文                        |
| `{{RawBody}}`      | 原始正文（无历史/发送者包装）             |
| `{{BodyStripped}}` | 去除群组 mention 的正文                   |
| `{{From}}`         | 发送者标识符                              |
| `{{To}}`           | 目标标识符                                |
| `{{MessageSid}}`   | Channel 消息 ID                           |
| `{{SessionId}}`    | 当前 Session UUID                         |
| `{{IsNewSession}}` | 新 Session 创建时为 `"true"`              |
| `{{MediaUrl}}`     | 入站媒体伪 URL                            |
| `{{MediaPath}}`    | 本地媒体路径                              |
| `{{MediaType}}`    | 媒体类型（image/audio/document/…）        |
| `{{Transcript}}`   | 音频转录                                  |
| `{{Prompt}}`       | CLI 条目的解析媒体提示                    |
| `{{MaxChars}}`     | CLI 条目的解析最大输出字符                |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                   |
| `{{GroupSubject}}` | 群组主题（尽力而为）                      |
| `{{GroupMembers}}` | 群组成员预览（尽力而为）                  |
| `{{SenderName}}`   | 发送者显示名称（尽力而为）                |
| `{{SenderE164}}`   | 发送者电话号码（尽力而为）                |
| `{{Provider}}`     | 提供商提示（whatsapp、telegram、discord 等）|

---

## 配置包含（`$include`）

将配置拆分到多个文件：

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**合并行为：**

- 单个文件：替换包含的对象。
- 文件数组：按顺序深度合并（后者覆盖前者）。
- 兄弟键：包含后合并（覆盖包含的值）。
- 嵌套包含：最多 10 层深。
- 路径：相对于包含文件解析，但必须保持在顶层配置目录（`openclaw.json` 的 `dirname`）内。绝对/`../` 形式仅在仍在该边界内解析时允许。
- 仅更改单个文件支持的单个顶层部分的 OpenClaw 拥有的写入会写入该包含文件。例如，`plugins install` 更新 `plugins.json5` 中的 `plugins: { $include: "./plugins.json5" }` 并保持 `openclaw.json` 完整。
- 根包含、包含数组和带有兄弟覆盖的包含对于 OpenClaw 拥有的写入是只读的；这些写入失败关闭而不是扁平化配置。
- 错误：缺少文件、解析错误和循环包含的清晰消息。

---

_相关：[配置](/gateway/configuration) · [配置示例](/gateway/configuration-examples) · [Doctor](/gateway/doctor)_

## 相关

- [配置](/gateway/configuration)
- [配置示例](/gateway/configuration-examples)
