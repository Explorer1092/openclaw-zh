---
title: "浏览器 (OpenClaw 管理)"
sidebarTitle: "浏览器"
mmh3_hash: "02585b16844322fa89b32827f4040c4b"
summary: "集成浏览器控制服务 + 操作命令"
read_when:
  - 添加 Agent 控制的浏览器自动化
  - 调试 OpenClaw 为何干扰你自己的 Chrome
  - 在 macOS 应用中实现浏览器设置和生命周期
---

OpenClaw 可以运行一个 Agent 控制的**专用 Chrome/Brave/Edge/Chromium 配置文件**。
它与你的个人浏览器隔离，通过 Gateway 内部的小型本地控制服务（仅回环）管理。

初学者视角：

- 把它看作一个**独立的、仅供 Agent 使用的浏览器**。
- `openclaw` 配置文件**不会**触碰你的个人浏览器配置文件。
- Agent 可以在安全的通道中**打开标签页、阅读页面、点击和输入**。
- 内置的 `user` 配置文件通过 Chrome MCP 附加到你真实的已登录 Chrome Session。

## 你能获得什么

- 一个名为 **openclaw** 的独立浏览器配置文件（默认橙色主题）。
- 确定性的标签页控制（列表/打开/聚焦/关闭）。
- Agent 操作（点击/输入/拖拽/选择）、快照、截图、PDF。
- 一个捆绑的 `browser-automation` Skill，在浏览器插件启用时教会 Agent 快照、稳定标签页、过期 ref 以及手动阻塞恢复循环。
- 可选的多配置文件支持（`openclaw`、`work`、`remote` 等）。

这个浏览器**不是**你的日常使用浏览器。它是 Agent 自动化和验证的安全隔离平台。

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

如果 `openclaw browser` 完全缺失，或 Agent 报告浏览器工具不可用，请跳转到[缺少浏览器命令或工具](/tools/browser#缺少浏览器命令或工具)。

## Plugin 控制

默认的 `browser` 工具是一个捆绑插件。禁用它可以用另一个注册相同 `browser` 工具名称的插件替换它：

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

默认配置需要 `plugins.entries.browser.enabled` **和** `browser.enabled=true` 同时满足。仅禁用插件会一起移除 `openclaw browser` CLI、`browser.request` Gateway 方法、Agent 工具和控制服务；你的 `browser.*` 配置保持完整，供替换插件复用。

浏览器配置更改需要重启 Gateway，以便插件能够使用新设置重新注册其服务。

## Agent 指引

工具配置文件注意事项：`tools.profile: "coding"` 包含 `web_search` 和 `web_fetch`，但不包含完整的 `browser` 工具。如果 Agent 或生成的子 Agent 需要使用浏览器自动化，请在配置文件阶段添加 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

对于单个 Agent，使用 `agents.list[].tools.alsoAllow: ["browser"]`。仅设置 `tools.subagents.tools.allow: ["browser"]` 是不够的，因为子 Agent 策略在配置文件过滤之后才会应用。

浏览器插件包含两个级别的 Agent 指引：

- `browser` 工具描述包含紧凑的始终在线契约：选择正确的配置文件，在同一标签页上保持 ref，使用 `tabId`/标签进行标签页定向，并在多步骤工作时加载浏览器 Skill。
- 捆绑的 `browser-automation` Skill 包含更长的操作循环：先检查状态/标签页，为任务标签页添加标签，快照后再操作，UI 变化后重新快照，一次性恢复过期 ref，并将登录/2FA/验证码或摄像头/麦克风阻碍报告为手动操作而非猜测。

插件捆绑的 Skill 会在插件启用时列在 Agent 的可用 Skill 中。完整 Skill 说明按需加载，因此常规轮次不会付出完整的 token 成本。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 是未知命令，`browser.request` 缺失，或 Agent 报告浏览器工具不可用，通常原因是 `plugins.allow` 列表中省略了 `browser` 且没有根级 `browser` 配置块。添加即可修复：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

显式的根级 `browser` 块（例如 `browser.enabled=true` 或 `browser.profiles.<name>`）即使在限制性的 `plugins.allow` 下也会激活捆绑的浏览器插件，与 Channel 配置行为一致。`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 本身不能替代允许列表成员资格。完全删除 `plugins.allow` 也会恢复默认设置。

## 配置文件：`openclaw` 与 `user`

- `openclaw`：托管的隔离浏览器（无需扩展）。
- `user`：内置的 Chrome MCP 附加配置文件，用于你**真实的已登录 Chrome** Session。

对于 Agent 浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有已登录 Session 很重要且用户在电脑旁可以点击/批准附加提示时，优先使用 `profile="user"`。
- `profile` 是当你想要特定浏览器模式时的显式覆盖。

如果你希望默认使用托管模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // 默认：true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在信任私有网络访问时选择启用
      // allowPrivateNetwork: true, // 旧版别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 旧版单配置文件覆盖
    remoteCdpTimeoutMs: 1500, // 远程 CDP HTTP 超时（毫秒）
    remoteCdpHandshakeTimeoutMs: 3000, // 远程 CDP WebSocket 握手超时（毫秒）
    localLaunchTimeoutMs: 15000, // 本地托管 Chrome 发现超时（毫秒）
    localCdpReadyTimeoutMs: 8000, // 本地托管启动后 CDP 就绪超时（毫秒）
    actionTimeoutMs: 60000, // 默认浏览器 act 超时（毫秒）
    tabCleanup: {
      enabled: true, // 默认：true
      idleMinutes: 120, // 设为 0 禁用空闲清理
      maxTabsPerSession: 8, // 设为 0 禁用每 Session 上限
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

<Accordion title="端口与可达性">

- 浏览器控制服务绑定到回环地址，端口由 `gateway.port` 派生（默认 `18791` = gateway + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会在同一"族"中移动派生端口。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl`；仅为远程 CDP 设置这些值。`cdpUrl` 未设置时默认为托管的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程和 `attachOnly` CDP HTTP 可达性检查以及标签页打开 HTTP 请求；`remoteCdpHandshakeTimeoutMs` 适用于其 CDP WebSocket 握手。
- `localLaunchTimeoutMs` 是本地启动的托管 Chrome 进程暴露其 CDP HTTP 端点的时间预算。`localCdpReadyTimeoutMs` 是进程发现后 CDP WebSocket 就绪的后续时间预算。在 Raspberry Pi、低端 VPS 或旧硬件上请提高这些值。值必须为最大 `120000` 毫秒的正整数；无效的配置值会被拒绝。
- 重复的托管 Chrome 启动/就绪失败会按配置文件进行熔断。多次连续失败后，OpenClaw 会短暂暂停新的启动尝试，而不是在每次浏览器工具调用时都生成 Chromium。修复启动问题、禁用不需要的浏览器，或在修复后重启 Gateway。
- `actionTimeoutMs` 是当调用方未传递 `timeoutMs` 时浏览器 `act` 请求的默认时间预算。客户端传输添加了一个小的宽限窗口，使长等待能够完成而不是在 HTTP 边界超时。
- `tabCleanup` 是对主 Agent 浏览器 Session 打开的标签页进行的尽力清理。子 Agent、cron 和 ACP 生命周期清理仍在 Session 结束时关闭其显式跟踪的标签页；主 Session 保持活跃标签页可复用，然后在后台关闭空闲或超出数量的已跟踪标签页。

</Accordion>

<Accordion title="SSRF 策略">

- 浏览器导航和打开标签页在导航前受 SSRF 保护，并在导航后对最终的 `http(s)` URL 进行尽力重检。
- 在严格 SSRF 模式下，远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）也会被检查。
- Gateway/Provider 的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 环境变量不会自动代理 OpenClaw 托管的浏览器。托管 Chrome 默认直接启动，因此 Provider 代理设置不会削弱浏览器 SSRF 检查。
- 要代理托管浏览器本身，请通过 `browser.extraArgs` 传递显式的 Chrome 代理标志，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。严格 SSRF 模式会阻止显式浏览器代理路由，除非有意启用私有网络浏览器访问。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅在有意信任私有网络浏览器访问时启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 作为旧版别名保持支持。

</Accordion>

<Accordion title="配置文件行为">

- `attachOnly: true` 表示"永不启动本地浏览器；仅在已运行时附加"。
- `headless` 可以全局设置或按本地托管配置文件设置。每个配置文件的值会覆盖 `browser.headless`，因此一个本地启动的配置文件可以保持无头模式，而另一个保持可见。
- `POST /start?headless=true` 和 `openclaw browser start --headless` 为本地托管配置文件请求一次性无头启动，而不覆写 `browser.headless` 或配置文件配置。现有 Session、仅附加和远程 CDP 配置文件会拒绝该覆盖，因为 OpenClaw 不会启动这些浏览器进程。
- 在没有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主机上，当环境和配置文件/全局配置均未明确选择有头模式时，本地托管配置文件会自动默认使用无头模式。`openclaw browser status --json` 将 `headlessSource` 报告为 `env`、`profile`、`config`、`request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 强制本地托管启动使用无头模式。`OPENCLAW_BROWSER_HEADLESS=0` 强制普通启动使用有头模式，并在没有显示服务器的 Linux 主机上返回可操作的错误；显式的 `start --headless` 请求对该单次启动仍然有效。
- `executablePath` 可以全局设置或按本地托管配置文件设置。每个配置文件的值会覆盖 `browser.executablePath`，因此不同的托管配置文件可以启动不同的基于 Chromium 的浏览器。两种形式都接受 `~` 表示你的操作系统主目录。
- `color`（顶级和每个配置文件）为浏览器 UI 着色，让你可以看到哪个配置文件处于活动状态。
- 默认配置文件为 `openclaw`（托管独立）。使用 `defaultProfile: "user"` 可选择已登录用户浏览器。
- 自动检测顺序：如果系统默认浏览器是基于 Chromium 的，则使用它；否则按 Chrome → Brave → Edge → Chromium → Chrome Canary 顺序。
- `driver: "existing-session"` 使用 Chrome DevTools MCP 而非原始 CDP。不要为该驱动设置 `cdpUrl`。
- 当现有 Session 配置文件应附加到非默认 Chromium 用户配置文件（如 Brave 或 Edge）时，设置 `browser.profiles.<name>.userDataDir`。此路径也接受 `~` 表示你的操作系统主目录。

</Accordion>

</AccordionGroup>

## 使用 Brave（或其他基于 Chromium 的浏览器）

如果你的**系统默认**浏览器是基于 Chromium 的（Chrome/Brave/Edge 等），OpenClaw 会自动使用它。设置 `browser.executablePath` 可覆盖自动检测。顶级和每个配置文件的 `executablePath` 值都接受 `~` 表示你的操作系统主目录：

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

每个配置文件的 `executablePath` 只影响 OpenClaw 启动的本地托管配置文件。`existing-session` 配置文件附加到已在运行的浏览器，远程 CDP 配置文件使用 `cdpUrl` 背后的浏览器。

## 本地与远程控制

- **本地控制（默认）：** Gateway 启动回环控制服务，并可启动本地浏览器。
- **远程控制（节点主机）：** 在有浏览器的机器上运行节点主机；Gateway 将浏览器操作代理到该节点。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以附加到远程基于 Chromium 的浏览器。这种情况下，OpenClaw 不会启动本地浏览器。
- 对于回环上的外部托管 CDP 服务（例如发布到 `127.0.0.1` 的 Docker 中的 Browserless），还需设置 `attachOnly: true`。没有 `attachOnly` 的回环 CDP 会被视为本地 OpenClaw 托管的浏览器配置文件。
- `headless` 只影响 OpenClaw 启动的本地托管配置文件。它不会重启或更改现有 Session 或远程 CDP 浏览器。
- `executablePath` 遵循相同的本地托管配置文件规则。在运行中的本地托管配置文件上更改它会标记该配置文件进行重启/协调，以便下次启动使用新的二进制文件。

停止行为因配置文件模式而异：

- 本地托管配置文件：`openclaw browser stop` 停止 OpenClaw 启动的浏览器进程
- 仅附加和远程 CDP 配置文件：`openclaw browser stop` 关闭活动控制 Session 并释放 Playwright/CDP 模拟覆盖（视口、配色方案、语言、时区、离线模式和类似状态），即使 OpenClaw 没有启动浏览器进程

远程 CDP URL 可以包含认证信息：

- 查询 token（例如 `https://provider.example?token=<token>`）
- HTTP Basic 认证（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点和连接 CDP WebSocket 时会保留认证信息。建议使用环境变量或密钥管理器来存储 token，而不是将其提交到配置文件中。

## 节点浏览器代理（零配置默认）

如果你在有浏览器的机器上运行**节点主机**，OpenClaw 可以自动将浏览器工具调用路由到该节点，无需任何额外的浏览器配置。这是远程 Gateway 的默认路径。

说明：

- 节点主机通过**代理命令**暴露其本地浏览器控制服务器。
- 配置文件来自节点自身的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选的。留空则使用旧版/默认行为：所有已配置的配置文件都可通过代理访问，包括配置文件创建/删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 将其视为最小权限边界：只有允许列表中的配置文件可以被指定，且代理层面的持久配置文件创建/删除路由会被阻止。
- 如果不需要，可以禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 Gateway 上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管 Chromium 服务，通过 HTTPS 和 WebSocket 暴露 CDP 连接 URL。OpenClaw 两种形式均可使用，但对于远程浏览器配置文件，最简单的选项是 Browserless 连接文档中的直接 WebSocket URL。

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

说明：

- 将 `<BROWSERLESS_API_KEY>` 替换为你真实的 Browserless token。
- 选择与你的 Browserless 账号匹配的区域端点（参见其文档）。
- 如果 Browserless 提供的是 HTTPS 基础 URL，你可以将其转换为 `wss://` 进行直接 CDP 连接，或保留 HTTPS URL 让 OpenClaw 自动发现 `/json/version`。

### 同一主机上的 Browserless Docker

当 Browserless 以 Docker 方式自托管且 OpenClaw 运行在主机上时，将 Browserless 视为外部托管的 CDP 服务：

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

`browser.profiles.browserless.cdpUrl` 中的地址必须从 OpenClaw 进程可达。Browserless 还必须公告一个匹配的可达端点；将 Browserless `EXTERNAL` 设置为对 OpenClaw 公开的 WebSocket 基址，例如 `ws://127.0.0.1:3000`、`ws://browserless:3000` 或稳定的私有 Docker 网络地址。如果 `/json/version` 返回的 `webSocketDebuggerUrl` 指向 OpenClaw 无法访问的地址，CDP HTTP 看起来正常但 WebSocket 附加仍会失败。

不要对回环 Browserless 配置文件省略 `attachOnly`。没有 `attachOnly`，OpenClaw 会将回环端口视为本地托管浏览器配置文件，并可能报告端口正在使用但不属于 OpenClaw。

## 直接 WebSocket CDP 提供商

一些托管浏览器服务暴露的是**直接 WebSocket** 端点，而非标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种 CDP URL 形式并自动选择正确的连接策略：

- **HTTP(S) 发现** — `http://host[:port]` 或 `https://host[:port]`。OpenClaw 调用 `/json/version` 发现 WebSocket 调试器 URL，然后连接。无 WebSocket 回退。
- **直接 WebSocket 端点** — `ws://host[:port]/devtools/<kind>/<id>` 或带有 `/devtools/browser|page|worker|shared_worker|service_worker/<id>` 路径的 `wss://...`。OpenClaw 通过 WebSocket 握手直接连接，完全跳过 `/json/version`。
- **裸 WebSocket 根** — 没有 `/devtools/...` 路径的 `ws://host[:port]` 或 `wss://host[:port]`（例如 [Browserless](https://browserless.io)、[Browserbase](https://www.browserbase.com)）。OpenClaw 首先尝试 HTTP `/json/version` 发现（将协议规范化为 `http`/`https`）；如果发现返回 `webSocketDebuggerUrl` 则使用它，否则 OpenClaw 回退到裸根的直接 WebSocket 握手。如果公告的 WebSocket 端点拒绝 CDP 握手但配置的裸根接受，OpenClaw 也会回退到该根。这使得指向本地 Chrome 的裸 `ws://` 仍然可以连接，因为 Chrome 只接受来自 `/json/version` 特定目标路径的 WebSocket 升级，而托管 Provider 在其发现端点公告的是不适合 Playwright CDP 的短期 URL 时，仍然可以使用其根 WebSocket 端点。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个云平台，用于运行具有内置 CAPTCHA 求解、隐身模式和住宅代理的无头浏览器。

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

说明：

- [注册](https://www.browserbase.com/sign-up)并从 [Overview 控制面板](https://www.browserbase.com/overview)复制你的 **API Key**。
- 将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API 密钥。
- Browserbase 在 WebSocket 连接时自动创建浏览器 Session，无需手动创建 Session。
- 免费层允许一个并发 Session 和每月一个浏览器小时。查看[定价](https://www.browserbase.com/pricing)了解付费计划限制。
- 参见 [Browserbase 文档](https://docs.browserbase.com)了解完整 API 参考、SDK 指南和集成示例。

## 安全

关键要点：

- 浏览器控制仅限回环；访问通过 Gateway 认证或节点配对流转。
- 独立的回环浏览器 HTTP API 仅使用**共享密钥认证**：Gateway token bearer 认证、`x-openclaw-password` 或使用已配置 Gateway 密码的 HTTP Basic 认证。
- Tailscale Serve 身份标头和 `gateway.auth.mode: "trusted-proxy"` **不会**对这个独立的回环浏览器 API 进行认证。
- 如果浏览器控制已启用且未配置共享密钥认证，OpenClaw 会在启动时自动生成 `gateway.auth.token` 并持久化到配置中。
- 当 `gateway.auth.mode` 已经是 `password`、`none` 或 `trusted-proxy` 时，OpenClaw **不会**自动生成该 token。
- 将 Gateway 和所有节点主机保持在私有网络（Tailscale）中；避免公开暴露。
- 将远程 CDP URL/token 视为机密；建议使用环境变量或密钥管理器。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）和短期 token。
- 避免将长期 token 直接嵌入配置文件。

## 配置文件（多浏览器）

OpenClaw 支持多个命名配置文件（路由配置）。配置文件可以是：

- **openclaw 托管**：具有自己用户数据目录 + CDP 端口的专用基于 Chromium 的浏览器实例
- **远程**：显式 CDP URL（在其他地方运行的基于 Chromium 的浏览器）
- **现有 Session**：通过 Chrome DevTools MCP 自动连接使用你现有的 Chrome 配置文件

默认值：

- 如果缺少 `openclaw` 配置文件，会自动创建。
- `user` 配置文件是 Chrome MCP 现有 Session 附加的内置配置文件。
- 现有 Session 配置文件除 `user` 外均为可选；使用 `--driver existing-session` 创建。
- 本地 CDP 端口默认从 **18800–18899** 分配。
- 删除配置文件会将其本地数据目录移到回收站。

所有控制端点均接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用现有 Session

OpenClaw 还可以通过官方 Chrome DevTools MCP 服务器附加到正在运行的基于 Chromium 的浏览器配置文件。这会复用该浏览器配置文件中已打开的标签页和登录状态。

官方背景和设置参考：

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置文件：

- `user`

可选：如果你想要不同的名称、颜色或浏览器数据目录，可以创建自定义现有 Session 配置文件。

默认行为：

- 内置的 `user` 配置文件使用 Chrome MCP 自动连接，针对默认本地 Google Chrome 配置文件。

使用 `userDataDir` 连接 Brave、Edge、Chromium 或非默认 Chrome 配置文件：

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

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

实时附加冒烟测试：

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

成功的表现：

- `status` 显示 `driver: existing-session`
- `status` 显示 `transport: chrome-mcp`
- `status` 显示 `running: true`
- `tabs` 列出你已打开的浏览器标签页
- `snapshot` 返回所选实时标签页的 ref

如果附加不起作用，请检查：

- 目标基于 Chromium 的浏览器版本为 `144+`
- 在该浏览器的检查页面中已启用远程调试
- 浏览器已显示并且你已接受附加同意提示
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置并检查本地是否安装了 Chrome 用于默认自动连接配置文件，但它无法为你启用浏览器端的远程调试

Agent 使用：

- 当你需要用户的已登录浏览器状态时，使用 `profile="user"`。
- 如果使用自定义现有 Session 配置文件，请传递该显式配置文件名称。
- 仅在用户在电脑旁可以批准附加提示时选择此模式。
- Gateway 或节点主机可以生成 `npx chrome-devtools-mcp@latest --autoConnect`

注意：

- 这条路径比隔离的 `openclaw` 配置文件风险更高，因为它可以在你的已登录浏览器 Session 内操作。
- OpenClaw 不会为此驱动启动浏览器；它仅附加到现有 Session。
- OpenClaw 在这里使用官方 Chrome DevTools MCP `--autoConnect` 流程。如果设置了 `userDataDir`，OpenClaw 会将其传递以针对该显式 Chromium 用户数据目录。
- 现有 Session 可以在选定的主机上附加，也可以通过已连接的浏览器节点附加。如果 Chrome 在其他地方且没有连接浏览器节点，请改用远程 CDP 或节点主机。

### 自定义 Chrome MCP 启动

当默认的 `npx chrome-devtools-mcp@latest` 流程不适合你的情况时（离线主机、固定版本、打包的二进制文件），可以按配置文件覆盖生成的 Chrome DevTools MCP 服务器：

| 字段         | 作用                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| `mcpCommand` | 替代 `npx` 的可执行文件。按原样解析；支持绝对路径。                                                                 |
| `mcpArgs`    | 逐字传递给 `mcpCommand` 的参数数组。替换默认的 `chrome-devtools-mcp@latest --autoConnect` 参数。 |

当现有 Session 配置文件设置了 `cdpUrl` 时，OpenClaw 跳过 `--autoConnect` 并自动将端点转发给 Chrome MCP：

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 发现端点）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

端点标志和 `userDataDir` 不能组合使用：设置了 `cdpUrl` 时，`userDataDir` 在 Chrome MCP 启动中被忽略，因为 Chrome MCP 附加到端点背后正在运行的浏览器，而不是打开配置文件目录。

<Accordion title="现有 Session 功能限制">

与托管的 `openclaw` 配置文件相比，现有 Session 驱动受到更多限制：

- **截图** — 页面捕获和 `--ref` 元素捕获可用；CSS `--element` 选择器不可用。`--full-page` 不能与 `--ref` 或 `--element` 组合。页面截图和基于 ref 的元素截图不需要 Playwright。
- **操作** — `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要快照 ref（无 CSS 选择器）。`click-coords` 点击可见视口坐标，不需要快照 ref。`click` 仅支持左键。`type` 不支持 `slowly=true`；使用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持每次调用的超时覆盖。`select` 接受单个值。
- **等待/上传/对话框** — `wait --url` 支持精确、子字符串和 glob 模式；不支持 `wait --load networkidle`。上传 Hook 需要 `ref` 或 `inputRef`，一次支持一个文件，不支持 CSS `element`。对话框 Hook 不支持超时覆盖。
- **仅托管功能** — 批量操作、PDF 导出、下载拦截和 `responsebody` 仍需要托管浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：从不触碰你的个人浏览器配置文件。
- **专用端口**：避免使用 `9222` 以防止与开发工作流冲突。
- **确定性标签页控制**：`tabs` 优先返回 `suggestedTargetId`，然后是稳定的 `tabId` 句柄（如 `t1`）、可选标签和原始 `targetId`。Agent 应复用 `suggestedTargetId`；原始 ID 仍可用于调试和兼容性。

## 浏览器选择

在本地启动时，OpenClaw 选择第一个可用的：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以用 `browser.executablePath` 覆盖。

平台：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：检查 `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和 `/usr/lib/chromium-browser` 下的常见 Chrome/Brave/Edge/Chromium 位置。
- Windows：检查常见安装位置。

## 控制 API（可选）

用于脚本和调试，Gateway 暴露一个小型**仅回环 HTTP 控制 API**，以及配套的 `openclaw browser` CLI（快照、ref、等待增强、JSON 输出、调试工作流）。完整参考请参见[浏览器控制 API](/tools/browser-control)。

## 故障排除

有关 Linux 特定问题（尤其是 snap Chromium），参见
[浏览器故障排除](/tools/browser-linux-troubleshooting)。

有关 WSL2 Gateway + Windows Chrome 分离主机设置，参见
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败 vs 导航 SSRF 阻止

这是两类不同的故障，指向不同的代码路径。

- **CDP 启动或就绪失败**意味着 OpenClaw 无法确认浏览器控制平面是否正常。
- **导航 SSRF 阻止**意味着浏览器控制平面正常，但页面导航目标被策略拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - 当回环外部 CDP 服务配置时未设置 `attachOnly: true`，出现 `Port <port> is in use for profile "<name>" but not by openclaw`
- 导航 SSRF 阻止：
  - `open`、`navigate`、快照或标签页打开流程以浏览器/网络策略错误失败，而 `start` 和 `tabs` 仍然正常工作

使用此最小序列来区分两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

如何解读结果：

- 如果 `start` 以 `not reachable after start` 失败，首先排查 CDP 可达性。
- 如果 `start` 成功但 `tabs` 失败，控制平面仍然不健康。将其视为 CDP 可达性问题，而非页面导航问题。
- 如果 `start` 和 `tabs` 成功但 `open` 或 `navigate` 失败，浏览器控制平面正常，故障在于导航策略或目标页面。
- 如果 `start`、`tabs` 和 `open` 都成功，基本的受管浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置也默认为失败关闭的 SSRF 策略对象。
- 对于本地环回 `openclaw` 受管配置文件，CDP 健康检查有意跳过对 OpenClaw 自己本地控制平面的浏览器 SSRF 可达性强制执行。
- 导航保护是独立的。成功的 `start` 或 `tabs` 结果并不意味着后续的 `open` 或 `navigate` 目标是允许的。

安全指南：

- 默认情况下**不要**放宽浏览器 SSRF 策略。
- 优先使用窄主机例外（如 `hostnameAllowlist` 或 `allowedHostnames`），而不是宽泛的私有网络访问。
- 仅在有意信任的环境中使用 `dangerouslyAllowPrivateNetwork: true`，其中需要私有网络浏览器访问并经过审查。

示例：导航被阻止，控制平面健康

- `start` 成功
- `tabs` 成功
- `open http://internal.example` 失败

这通常意味着浏览器启动正常，导航目标需要策略审查。

示例：启动在导航之前就被阻止

- `start` 以 `not reachable after start` 失败
- `tabs` 也失败或无法运行

这指向浏览器启动或 CDP 可达性问题，而非页面 URL 允许列表问题。

## Agent 工具 + 控制原理

Agent 获得**一个工具**用于浏览器自动化：

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

映射方式：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用快照 `ref` ID 进行点击/输入/拖拽/选择。
- `browser screenshot` 捕获像素（整页、元素或带标签的 ref）。
- `browser doctor` 检查 Gateway、插件、配置文件、浏览器和标签页就绪情况。
- `browser` 接受：
  - `profile` 选择命名浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`）选择浏览器所在位置。
  - 在沙盒 Session 中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙盒 Session 默认为 `sandbox`，非沙盒 Session 默认为 `host`。
  - 如果连接了具有浏览器能力的节点，工具可能自动路由到该节点，除非你固定 `target="host"` 或 `target="node"`。

这保持了 Agent 的确定性，避免了脆弱的选择器。

## 相关

- [工具概览](/tools) — 所有可用 Agent 工具
- [沙盒化](/gateway/sandboxing) — 沙盒环境中的浏览器控制
- [安全](/gateway/security) — 浏览器控制风险和加固
