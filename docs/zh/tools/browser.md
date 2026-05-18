---
mmh3_hash: "f23495d8b375138934324349d21b0120"
summary: "集成浏览器控制服务 + 操作命令"
read_when:
  - 添加 Agent 控制的浏览器自动化
  - 调试为什么 openclaw 干扰了您自己的 Chrome
  - 在 macOS 应用中实现浏览器设置和生命周期
title: "浏览器 (OpenClaw 管理)"
---

OpenClaw 可以运行一个 Agent 控制的**专用 Chrome/Brave/Edge/Chromium Profile**。它与您的个人浏览器隔离，并通过 Gateway 内部的一个小型本地控制服务（仅回环）进行管理。

初学者视角：

- 将其视为一个**独立的、仅供 Agent 使用的浏览器**。
- `openclaw` Profile **不**接触您的个人浏览器 Profile。
- Agent 可以在安全通道中**打开标签页、阅读页面、点击和输入**。
- 内置的 `user` Profile 通过 Chrome MCP 附加到您真实的已登录 Chrome Session。

## 您获得的功能

- 名为 **openclaw** 的独立浏览器 Profile（默认橙色强调色）。
- 确定性标签页控制（列表/打开/聚焦/关闭）。
- Agent 操作（点击/输入/拖拽/选择）、快照、截图、PDF。
- 一个捆绑的 `browser-automation` Skill，在启用浏览器 Plugin 时可教导 Agent 快照、稳定标签页、过期引用和手动拦截恢复循环。
- 可选的多 Profile 支持（`openclaw`、`work`、`remote` 等）。

这个浏览器**不是**您的日常使用浏览器。它是用于 Agent 自动化和验证的安全隔离界面。

## 快速入门

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果出现"Browser disabled"，请在配置中启用它（见下文）并重启 Gateway。

如果 `openclaw browser` 完全缺失，或 Agent 报告浏览器工具不可用，请跳转到[缺少浏览器命令或工具](/tools/browser#missing-browser-command-or-tool)。

## Plugin 控制

默认的 `browser` 工具是一个捆绑的 Plugin。禁用它可以用另一个注册了相同 `browser` 工具名称的 Plugin 来替换：

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

默认设置需要 `plugins.entries.browser.enabled` **和** `browser.enabled=true` 都满足。仅禁用 Plugin 会作为一个单元移除 `openclaw browser` CLI、`browser.request` Gateway 方法、Agent 工具和控制服务；您的 `browser.*` 配置保持完整，供替换使用。

浏览器配置更改需要重启 Gateway，以便 Plugin 可以重新注册其服务。

## Agent 指导

工具 Profile 注意：`tools.profile: "coding"` 包含 `web_search` 和 `web_fetch`，但不包含完整的 `browser` 工具。如果 Agent 或生成的子 Agent 应该使用浏览器自动化，请在 Profile 阶段添加 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

对于单个 Agent，使用 `agents.list[].tools.alsoAllow: ["browser"]`。
单独的 `tools.subagents.tools.allow: ["browser"]` 是不够的，因为子 Agent 策略是在 Profile 过滤之后应用的。

浏览器 Plugin 包含两个级别的 Agent 指导：

- `browser` 工具描述携带紧凑的始终开启契约：选择正确的 Profile，在同一标签页上保持引用，使用 `tabId`/标签进行标签页定位，以及为多步骤工作加载浏览器 Skill。
- 捆绑的 `browser-automation` Skill 携带更长的操作循环：先检查状态/标签页，为任务标签页贴标签，在操作前快照，在 UI 变化后重新快照，一次性恢复过期引用，以及将登录/2FA/验证码或摄像头/麦克风拦截报告为需要手动操作而不是猜测。

Plugin 捆绑的 Skill 在启用 Plugin 时列在 Agent 的可用 Skill 中。完整的 Skill 指令按需加载，因此常规轮次不需要支付完整的 token 成本。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 不可用、`browser.request` 缺失，或 Agent 报告浏览器工具不可用，通常原因是 `plugins.allow` 列表省略了 `browser` 且不存在根 `browser` 配置块。添加它：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

显式的根 `browser` 块（例如 `browser.enabled=true` 或 `browser.profiles.<name>`）即使在严格的 `plugins.allow` 下也能激活捆绑的浏览器 Plugin，与 Channel 配置行为一致。`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 单独不能替代允许列表成员资格。完全删除 `plugins.allow` 也可以恢复默认值。

## Profile：`openclaw` 与 `user`

- `openclaw`：托管的、隔离的浏览器（无需扩展）。
- `user`：用于您的**真实已登录 Chrome** Session 的内置 Chrome MCP 附加 Profile。

对于 Agent 浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有的已登录 Session 很重要且用户在电脑前可以点击/批准任何附加提示时，优先使用 `profile="user"`。
- `profile` 是您想要特定浏览器模式时的显式覆盖。

如果您想默认使用托管模式，设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // 默认：true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在需要信任的私有网络访问时才选择启用
      // allowPrivateNetwork: true, // 旧版别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 旧版单 Profile 覆盖
    remoteCdpTimeoutMs: 1500, // 远程 CDP HTTP 超时（毫秒）
    remoteCdpHandshakeTimeoutMs: 3000, // 远程 CDP WebSocket 握手超时（毫秒）
    localLaunchTimeoutMs: 15000, // 本地托管 Chrome 发现超时（毫秒）
    localCdpReadyTimeoutMs: 8000, // 本地托管启动后 CDP 就绪超时（毫秒）
    actionTimeoutMs: 60000, // 默认浏览器 act 超时（毫秒）
    tabCleanup: {
      enabled: true, // 默认：true
      idleMinutes: 120, // 设置为 0 可禁用空闲清理
      maxTabsPerSession: 8, // 设置为 0 可禁用每 Session 的上限
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="端口和可达性">

- 控制服务绑定到回环上的端口，该端口从 `gateway.port` 派生（默认 `18791` = gateway + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会以相同方式移动同族中的派生端口。
- 本地 `openclaw` Profile 自动分配 `cdpPort`/`cdpUrl`；仅为远程 CDP 设置这些。`cdpUrl` 在未设置时默认为托管的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程和 `attachOnly` CDP HTTP 可达性检查以及标签页打开 HTTP 请求；`remoteCdpHandshakeTimeoutMs` 适用于其 CDP WebSocket 握手。
- `localLaunchTimeoutMs` 是本地启动的托管 Chrome 进程暴露其 CDP HTTP 端点的时间预算。`localCdpReadyTimeoutMs` 是进程发现后 CDP WebSocket 就绪的后续时间预算。在树莓派、低端 VPS 或旧硬件上（Chromium 启动较慢）请适当提高这些值。值必须是最大 `120000` 毫秒的正整数；无效的配置值会被拒绝。
- 重复的托管 Chrome 启动/就绪失败会按 Profile 进行熔断。在若干次连续失败后，OpenClaw 会短暂暂停新的启动尝试，而不是在每次浏览器工具调用时生成 Chromium。请修复启动问题，如果不需要浏览器则禁用它，或在修复后重启 Gateway。
- `actionTimeoutMs` 是当调用者未传入 `timeoutMs` 时浏览器 `act` 请求的默认时间预算。客户端传输会添加一个小的宽限窗口，以便长时间等待能够完成而不是在 HTTP 边界处超时。
- `tabCleanup` 是对主 Agent 浏览器 Session 打开的标签页的尽力清理。子 Agent、Cron 和 ACP 生命周期清理仍然在 Session 结束时关闭其明确跟踪的标签页；主 Session 保持活动标签页可复用，然后在后台关闭空闲或超量的跟踪标签页。

</Accordion>

<Accordion title="SSRF 策略">

- 浏览器导航和打开标签页在导航前受 SSRF 防护，并在最终 `http(s)` URL 上进行尽力复查。
- 在严格 SSRF 模式下，远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）也会被检查。
- Gateway/Provider 的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 环境变量不会自动代理 OpenClaw 托管的浏览器。托管 Chrome 默认直接启动，因此 Provider 代理设置不会削弱浏览器 SSRF 检查。
- 要代理托管浏览器本身，请通过 `browser.extraArgs` 传递显式的 Chrome 代理标志，如 `--proxy-server=...` 或 `--proxy-pac-url=...`。严格 SSRF 模式会阻止显式浏览器代理路由，除非有意启用了私有网络浏览器访问。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅在有意信任私有网络浏览器访问时才启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 作为旧版别名仍受支持。

</Accordion>

<Accordion title="Profile 行为">

- `attachOnly: true` 表示从不启动本地浏览器；仅在浏览器已在运行时才附加。
- `headless` 可以全局设置或按本地托管 Profile 设置。每个 Profile 的值覆盖 `browser.headless`，因此一个本地启动的 Profile 可以保持无头，而另一个保持可见。
- `POST /start?headless=true` 和 `openclaw browser start --headless` 为本地托管 Profile 请求一次性无头启动，而不重写 `browser.headless` 或 Profile 配置。现有 Session、仅附加和远程 CDP Profile 拒绝该覆盖，因为 OpenClaw 不会启动这些浏览器进程。
- 在没有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主机上，当环境或 Profile/全局配置均未明确选择有头模式时，本地托管 Profile 默认自动使用无头模式。`openclaw browser status --json` 将 `headlessSource` 报告为 `env`、`profile`、`config`、`request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 强制当前进程的本地托管启动使用无头模式。`OPENCLAW_BROWSER_HEADLESS=0` 强制普通启动使用有头模式，并在没有显示服务器的 Linux 主机上返回可操作的错误；但对于那次启动，显式的 `start --headless` 请求仍然优先。
- `executablePath` 可以全局设置或按本地托管 Profile 设置。每个 Profile 的值覆盖 `browser.executablePath`，因此不同的托管 Profile 可以启动不同的基于 Chromium 的浏览器。两种形式都接受 `~` 作为 OS 主目录。
- `color`（顶层和每个 Profile）为浏览器 UI 染色，以便您看到哪个 Profile 处于活动状态。
- 默认 Profile 为 `openclaw`（托管独立版）。使用 `defaultProfile: "user"` 可以选择已登录的用户浏览器。
- 自动检测顺序：如果系统默认浏览器是基于 Chromium 的则使用它；否则 Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` 使用 Chrome DevTools MCP 而非原始 CDP。不要为该驱动器设置 `cdpUrl`。
- 当现有 Session Profile 应附加到非默认 Chromium 用户 Profile（Brave、Edge 等）时，设置 `browser.profiles.<name>.userDataDir`。此路径也接受 `~` 作为 OS 主目录。

</Accordion>

</AccordionGroup>

## 使用 Brave 或其他基于 Chromium 的浏览器

如果您的**系统默认**浏览器是基于 Chromium 的（Chrome/Brave/Edge 等），OpenClaw 会自动使用它。设置 `browser.executablePath` 可以覆盖自动检测。顶层和每个 Profile 的 `executablePath` 值接受 `~` 作为 OS 主目录：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

或在配置中按平台设置：

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

每个 Profile 的 `executablePath` 仅影响 OpenClaw 启动的本地托管 Profile。`existing-session` Profile 附加到已运行的浏览器，远程 CDP Profile 使用 `cdpUrl` 背后的浏览器。

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 启动回环控制服务，可以启动本地浏览器。
- **远程控制（node 主机）：** 在有浏览器的机器上运行 node 主机；Gateway 将浏览器操作代理到它。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以附加到远程基于 Chromium 的浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。
- 对于发布到 `127.0.0.1` 的回环外部托管 CDP 服务（例如 Docker 中的 Browserless），还需设置 `attachOnly: true`。没有 `attachOnly` 的回环 CDP 被视为本地 OpenClaw 托管浏览器 Profile。
- `headless` 仅影响 OpenClaw 启动的本地托管 Profile。它不会重启或更改现有 Session 或远程 CDP 浏览器。
- `executablePath` 遵循相同的本地托管 Profile 规则。在运行中的本地托管 Profile 上更改它会将该 Profile 标记为需要重启/重新协调，以便下次启动使用新的二进制文件。

不同 Profile 模式的停止行为有所不同：

- 本地托管 Profile：`openclaw browser stop` 停止 OpenClaw 启动的浏览器进程
- 仅附加和远程 CDP Profile：`openclaw browser stop` 关闭活动控制 Session 并释放 Playwright/CDP 模拟覆盖（视口、颜色方案、语言区域、时区、离线模式和类似状态），即使没有浏览器进程是由 OpenClaw 启动的

远程 CDP URL 可以包含认证：

- 查询 token（例如 `https://provider.example?token=<token>`）
- HTTP Basic 认证（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点和连接到 CDP WebSocket 时会保留认证。建议使用环境变量或密钥管理器存储 token，而不是提交到配置文件。

## Node 浏览器代理（零配置默认）

如果您在有浏览器的机器上运行 **node 主机**，OpenClaw 可以自动将浏览器工具调用路由到该 node，无需额外的浏览器配置。这是远程 Gateway 的默认路径。

注意事项：

- node 主机通过**代理命令**暴露其本地浏览器控制服务器。
- Profile 来自 node 自己的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选的。留空则采用旧版/默认行为：所有配置的 Profile 都可以通过代理访问，包括 Profile 创建/删除路由。
- 如果您设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 将其视为最小权限边界：只有允许列表中的 Profile 才能被针对，并且代理界面上的持久 Profile 创建/删除路由会被阻止。
- 如果不想要此功能，可以禁用：
  - 在 node 上：`nodeHost.browserProxy.enabled=false`
  - 在 Gateway 上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管 Chromium 服务，通过 HTTPS 和 WebSocket 暴露 CDP 连接 URL。OpenClaw 可以使用任一形式，但对于远程浏览器 Profile，最简单的选项是来自 Browserless 连接文档的直接 WebSocket URL。

示例：

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

注意事项：

- 将 `<BROWSERLESS_API_KEY>` 替换为您真实的 Browserless token。
- 选择与您的 Browserless 账户匹配的区域端点（请参见其文档）。
- 如果 Browserless 提供的是 HTTPS base URL，您可以将其转换为 `wss://` 进行直接 CDP 连接，或保留 HTTPS URL 让 OpenClaw 发现 `/json/version`。

### 同一主机上的 Browserless Docker

当 Browserless 在 Docker 中自托管且 OpenClaw 在主机上运行时，将 Browserless 视为外部托管的 CDP 服务：

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

`browser.profiles.browserless.cdpUrl` 中的地址必须能从 OpenClaw 进程访问。Browserless 还必须公布一个匹配的可访问端点；将 Browserless `EXTERNAL` 设置为相同的 OpenClaw 可访问 WebSocket base，如 `ws://127.0.0.1:3000`、`ws://browserless:3000` 或稳定的私有 Docker 网络地址。如果 `/json/version` 返回的 `webSocketDebuggerUrl` 指向 OpenClaw 无法访问的地址，CDP HTTP 看起来健康但 WebSocket 附加仍会失败。

不要让回环 Browserless Profile 的 `attachOnly` 保持未设置。没有 `attachOnly`，OpenClaw 将回环端口视为本地托管浏览器 Profile，可能报告端口正在使用但不属于 OpenClaw。

## 直接 WebSocket CDP 提供商

某些托管浏览器服务暴露**直接 WebSocket** 端点而非标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种 CDP URL 形式并自动选择正确的连接策略：

- **HTTP(S) 发现** - `http://host[:port]` 或 `https://host[:port]`。
  OpenClaw 调用 `/json/version` 发现 WebSocket 调试器 URL，然后连接。没有 WebSocket 回退。
- **直接 WebSocket 端点** - `ws://host[:port]/devtools/<kind>/<id>` 或带有 `/devtools/browser|page|worker|shared_worker|service_worker/<id>` 路径的 `wss://...`。OpenClaw 直接通过 WebSocket 握手连接，完全跳过 `/json/version`。
- **裸 WebSocket 根** - `ws://host[:port]` 或 `wss://host[:port]`，没有 `/devtools/...` 路径（例如 [Browserless](https://browserless.io)、[Browserbase](https://www.browserbase.com)）。OpenClaw 先尝试 HTTP `/json/version` 发现（将 scheme 规范化为 `http`/`https`）；如果发现返回 `webSocketDebuggerUrl` 则使用它，否则 OpenClaw 回退到裸根的直接 WebSocket 握手。如果公布的 WebSocket 端点拒绝 CDP 握手但配置的裸根接受，OpenClaw 也会回退到该根。这允许指向本地 Chrome 的裸 `ws://` 仍然连接，因为 Chrome 只接受来自 `/json/version` 的特定每目标路径上的 WebSocket 升级，而托管提供商在其发现端点公布的是短期 URL 不适合 Playwright CDP 时，仍然可以使用其根 WebSocket 端点。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个云平台，用于运行带有内置 CAPTCHA 解决、隐身模式和住宅代理的无头浏览器。

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

注意事项：

- [注册](https://www.browserbase.com/sign-up)并从[概览仪表板](https://www.browserbase.com/overview)复制您的 **API Key**。
- 将 `<BROWSERBASE_API_KEY>` 替换为您真实的 Browserbase API key。
- Browserbase 在 WebSocket 连接时自动创建浏览器 Session，无需手动创建 Session 步骤。
- 免费套餐允许一个并发 Session 和每月一个浏览器小时。有关付费套餐限制，请参见[定价](https://www.browserbase.com/pricing)。
- 有关完整 API 参考、SDK 指南和集成示例，请参见 [Browserbase 文档](https://docs.browserbase.com)。

## 安全

关键思路：

- 浏览器控制仅限回环；访问通过 Gateway 的认证或 node 配对。
- 独立的回环浏览器 HTTP API 仅使用**共享密钥认证**：Gateway token Bearer 认证、`x-openclaw-password` 或配置了 Gateway 密码的 HTTP Basic 认证。
- Tailscale Serve 身份标头和 `gateway.auth.mode: "trusted-proxy"` **不**认证这个独立的回环浏览器 API。
- 如果启用了浏览器控制且未配置共享密钥认证，OpenClaw 会为该次启动生成一个仅运行时的 Gateway token。如果客户端需要跨重启的稳定密钥，请显式配置 `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD`。
- 当 `gateway.auth.mode` 已经是 `password`、`none` 或 `trusted-proxy` 时，OpenClaw **不会**自动生成该 token。
- 将 Gateway 和任何 node 主机保持在私有网络（Tailscale）上；避免公开暴露。
- 将远程 CDP URL/token 视为密钥；优先使用环境变量或密钥管理器。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）和短期 token。
- 避免在配置文件中直接嵌入长期 token。

## Profile（多浏览器）

OpenClaw 支持多个命名 Profile（路由配置）。Profile 可以是：

- **openclaw 托管**：具有自己的用户数据目录 + CDP 端口的专用基于 Chromium 的浏览器实例
- **远程**：显式 CDP URL（在其他地方运行的基于 Chromium 的浏览器）
- **现有 Session**：通过 Chrome DevTools MCP 自动连接的您现有的 Chrome Profile

默认：

- 如果缺失，`openclaw` Profile 会自动创建。
- `user` Profile 是用于 Chrome MCP 现有 Session 附加的内置 Profile。
- 除 `user` 之外的现有 Session Profile 需要选择启用；使用 `--driver existing-session` 创建它们。
- 本地 CDP 端口默认从 **18800-18899** 分配。
- 删除 Profile 会将其本地数据目录移至废纸篓。

所有控制端点接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用现有 Session

OpenClaw 也可以通过官方 Chrome DevTools MCP 服务器附加到运行中的基于 Chromium 的浏览器 Profile。这会复用该浏览器 Profile 中已打开的标签页和登录状态。

官方背景和设置参考：

- [Chrome for Developers：使用 Chrome DevTools MCP 调试您的浏览器 Session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置 Profile：

- `user`

可选：如果您想要不同的名称、颜色或浏览器数据目录，可以创建自己的自定义现有 Session Profile。

默认行为：

- 内置的 `user` Profile 使用 Chrome MCP 自动连接，针对默认的本地 Google Chrome Profile。

对于 Brave、Edge、Chromium 或非默认 Chrome Profile，使用 `userDataDir`。`~` 扩展为 OS 主目录：

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

然后在对应的浏览器中：

1. 打开该浏览器的远程调试检查页面。
2. 启用远程调试。
3. 保持浏览器运行，当 OpenClaw 附加时批准连接提示。

常见检查页面：

- Chrome：`chrome://inspect/#remote-debugging`
- Brave：`brave://inspect/#remote-debugging`
- Edge：`edge://inspect/#remote-debugging`

实时附加烟雾测试：

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

成功的标志：

- `status` 显示 `driver: existing-session`
- `status` 显示 `transport: chrome-mcp`
- `status` 显示 `running: true`
- `tabs` 列出您已打开的浏览器标签页
- `snapshot` 从选定的活动标签页返回引用

如果附加不起作用，请检查：

- 目标基于 Chromium 的浏览器版本为 `144+`
- 在该浏览器的检查页面中已启用远程调试
- 浏览器显示了附加同意提示且您已接受
- `openclaw doctor` 会迁移旧版基于扩展的浏览器配置，并检查是否在本地安装了 Chrome 用于默认自动连接 Profile，但它无法为您启用浏览器端的远程调试

Agent 使用：

- 当您需要用户的已登录浏览器状态时，使用 `profile="user"`。
- 如果您使用自定义现有 Session Profile，请传递该显式 Profile 名称。
- 仅在用户在电脑前可以批准附加提示时才选择此模式。
- Gateway 或 node 主机可以生成 `npx chrome-devtools-mcp@latest --autoConnect`

注意事项：

- 这条路径比隔离的 `openclaw` Profile 风险更高，因为它可以在您的已登录浏览器 Session 内操作。
- OpenClaw 不为此驱动器启动浏览器；它只附加。
- OpenClaw 在这里使用官方 Chrome DevTools MCP `--autoConnect` 流程。如果设置了 `userDataDir`，它会被传递以针对该用户数据目录。
- 现有 Session 可以在选定的主机上附加或通过连接的浏览器 node 附加。如果 Chrome 在其他地方且没有浏览器 node 连接，请改用远程 CDP 或 node 主机。

### 自定义 Chrome MCP 启动

当默认的 `npx chrome-devtools-mcp@latest` 流程不适合时（离线主机、固定版本、本地化二进制），可以按 Profile 覆盖生成的 Chrome DevTools MCP 服务器：

| 字段         | 作用                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | 替代 `npx` 生成的可执行文件。按原样解析；支持绝对路径。                                                                  |
| `mcpArgs`    | 逐字传递给 `mcpCommand` 的参数数组。替换默认的 `chrome-devtools-mcp@latest --autoConnect` 参数。                        |

当在现有 Session Profile 上设置了 `cdpUrl` 时，OpenClaw 会跳过 `--autoConnect` 并自动将端点转发给 Chrome MCP：

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 发现端点）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

端点标志和 `userDataDir` 不能组合：当设置了 `cdpUrl` 时，`userDataDir` 在 Chrome MCP 启动时会被忽略，因为 Chrome MCP 附加到端点背后的运行中浏览器，而不是打开 Profile 目录。

<Accordion title="现有 Session 功能限制">

与托管的 `openclaw` Profile 相比，现有 Session 驱动器受到更多限制：

- **截图** - 页面截图和 `--ref` 元素截图有效；CSS `--element` 选择器无效。`--full-page` 不能与 `--ref` 或 `--element` 组合。Playwright 不是页面或基于引用的元素截图所必需的。
- **操作** - `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要快照引用（不支持 CSS 选择器）。`click-coords` 点击可见视口坐标且不需要快照引用。`click` 仅为左键。`type` 不支持 `slowly=true`；请使用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持每次调用的超时。`select` 接受单个值。
- **等待/上传/对话框** - `wait --url` 支持精确、子字符串和 glob 模式；不支持 `wait --load networkidle`。上传 Hook 需要 `ref` 或 `inputRef`，每次一个文件，不支持 CSS `element`。对话框 Hook 不支持超时覆盖或 `dialogId`。
- **仅托管功能** - 批量操作、PDF 导出、下载拦截和 `responsebody` 仍需要托管浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：从不接触您的个人浏览器 Profile。
- **专用端口**：避免 `9222` 以防止与开发工作流冲突。
- **确定性标签页控制**：`tabs` 首先返回 `suggestedTargetId`，然后是稳定的 `tabId` 句柄（如 `t1`）、可选标签和原始 `targetId`。Agent 应复用 `suggestedTargetId`；原始 id 仍可用于调试和兼容性。

## 浏览器选择

本地启动时，OpenClaw 按顺序选择第一个可用的：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

您可以使用 `browser.executablePath` 覆盖。

平台：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：检查 `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和 `/usr/lib/chromium-browser` 下的常见 Chrome/Brave/Edge/Chromium 位置，以及 `PLAYWRIGHT_BROWSERS_PATH` 或 `~/.cache/ms-playwright` 下 Playwright 管理的 Chromium。
- Windows：检查常见的安装位置。

## 控制 API（可选）

对于脚本化和调试，Gateway 暴露了一个小型**仅回环 HTTP 控制 API**以及匹配的 `openclaw browser` CLI（快照、引用、等待增强功能、JSON 输出、调试工作流）。完整参考请参见[浏览器控制 API](/tools/browser-control)。

## 故障排除

有关 Linux 特定问题（尤其是 snap Chromium），请参见[浏览器故障排除](/tools/browser-linux-troubleshooting)。

有关 WSL2 Gateway + Windows Chrome 分割主机设置，请参见 [WSL2 + Windows + 远程 Chrome CDP 故障排除](/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败与导航 SSRF 阻断

这是两种不同的失败类别，指向不同的代码路径。

- **CDP 启动或就绪失败**意味着 OpenClaw 无法确认浏览器控制平面是否健康。
- **导航 SSRF 阻断**意味着浏览器控制平面是健康的，但页面导航目标被策略拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - 当配置了没有 `attachOnly: true` 的回环外部 CDP 服务时：`Port <port> is in use for profile "<name>" but not by openclaw`
- 导航 SSRF 阻断：
  - `open`、`navigate`、快照或标签页打开流程失败并出现浏览器/网络策略错误，而 `start` 和 `tabs` 仍然有效

使用此最小序列来区分两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

如何读取结果：

- 如果 `start` 失败并出现 `not reachable after start`，先排查 CDP 就绪问题。
- 如果 `start` 成功但 `tabs` 失败，控制平面仍然不健康。将其视为 CDP 可达性问题，而非页面导航问题。
- 如果 `start` 和 `tabs` 成功但 `open` 或 `navigate` 失败，浏览器控制平面已启动，失败在于导航策略或目标页面。
- 如果 `start`、`tabs` 和 `open` 都成功，基本托管浏览器控制路径是健康的。

重要行为细节：

- 即使您没有配置 `browser.ssrfPolicy`，浏览器配置也会默认为一个失败关闭的 SSRF 策略对象。
- 对于本地回环 `openclaw` 托管 Profile，CDP 健康检查故意跳过浏览器 SSRF 可达性强制，用于 OpenClaw 自己的本地控制平面。
- 导航保护是独立的。成功的 `start` 或 `tabs` 结果不意味着后续的 `open` 或 `navigate` 目标是允许的。

安全指导：

- **不要**默认放宽浏览器 SSRF 策略。
- 优先使用窄主机例外（如 `hostnameAllowlist` 或 `allowedHostnames`）而非宽泛的私有网络访问。
- 仅在需要私有网络浏览器访问且经过审查的有意信任环境中使用 `dangerouslyAllowPrivateNetwork: true`。

## Agent 工具 + 控制原理

Agent 获得**一个工具**用于浏览器自动化：

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

映射方式：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用快照 `ref` ID 进行点击/输入/拖拽/选择。
- `browser screenshot` 截取像素（全页、元素或带标签引用）。
- `browser doctor` 检查 Gateway、Plugin、Profile、浏览器和标签页就绪状态。
- `browser` 接受：
  - `profile` 选择命名的浏览器 Profile（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`）选择浏览器所在位置。
  - 在沙箱化 Session 中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱化 Session 默认为 `sandbox`，非沙箱 Session 默认为 `host`。
  - 如果连接了具有浏览器能力的 node，工具可能会自动路由到它，除非您固定 `target="host"` 或 `target="node"`。

这使 Agent 保持确定性并避免脆弱的选择器。

## 相关

- [工具概览](/tools) - 所有可用的 Agent 工具
- [沙箱化](/gateway/sandboxing) - 沙箱化环境中的浏览器控制
- [安全](/gateway/security) - 浏览器控制风险和加固
