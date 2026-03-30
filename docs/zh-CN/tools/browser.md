---
mmh3_hash: "67a40025913c9cc5f1c7a47fa1879484"
read_when:
  - 添加智能体控制的浏览器自动化
  - 调试 openclaw 干扰你自己 Chrome 的问题
  - 在 macOS 应用中实现浏览器设置和生命周期管理
summary: 集成浏览器控制服务 + 操作命令
title: 浏览器（OpenClaw 托管）
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: tools/browser.md
  workflow: 15
---

# 浏览器（openclaw 托管）

OpenClaw 可以运行一个由智能体控制的**专用 Chrome/Brave/Edge/Chromium 配置文件**。
它与你的个人浏览器隔离，通过 Gateway 网关内部的小型本地控制服务进行管理（仅限 loopback）。

新手视角：

- 把它想象成一个**独立的、仅供智能体使用的浏览器**。
- `openclaw` 配置文件**不会**触及你的个人浏览器配置文件。
- 智能体可以在安全的通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` 配置文件通过 Chrome MCP 附加到你真实的已登录 Chrome 会话。

## 功能概览

- 一个名为 **openclaw** 的独立浏览器配置文件（默认橙色主题）。
- 确定性标签页控制（列出/打开/聚焦/关闭）。
- 智能体操作（点击/输入/拖动/选择）、快照、截图、PDF。
- 可选的多配置文件支持（`openclaw`、`work`、`remote` 等）。

此浏览器**不是**你的日常浏览器。它是一个安全、隔离的界面，用于智能体自动化和验证。

## 快速开始

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果出现"Browser disabled"，请在配置中启用它（见下文）并重启 Gateway 网关。

如果 `openclaw browser` 完全缺失，或者智能体说浏览器工具不可用，请跳转到[缺少浏览器命令或工具](/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具现在是一个随附的插件，默认启用。这意味着你可以在不删除 OpenClaw 插件系统其他部分的情况下禁用或替换它：

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

在安装另一个提供相同 `browser` 工具名称的插件之前，先禁用随附的插件。默认浏览器体验需要同时满足：

- `plugins.entries.browser.enabled` 未被禁用
- `browser.enabled=true`

如果你只关闭插件，随附的浏览器 CLI（`openclaw browser`）、Gateway 方法（`browser.request`）、智能体工具和默认浏览器控制服务都会一起消失。你的 `browser.*` 配置保留，供替换插件重用。

随附的浏览器插件现在也拥有浏览器运行时实现。核心仅保留共享 Plugin SDK 辅助工具以及用于旧内部导入路径的兼容性重导出。实际上，移除或替换浏览器插件包会移除浏览器功能集，而不会在后面留下第二个核心拥有的运行时。

浏览器配置更改仍然需要 Gateway 网关重启，这样随附的插件才能用新设置重新注册其浏览器服务。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 突然变成未知命令，或者智能体报告浏览器工具缺失，最常见的原因是限制性的 `plugins.allow` 列表不包含 `browser`。

示例损坏配置：

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

通过将 `browser` 添加到插件白名单来修复：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

重要说明：

- 仅 `browser.enabled=true` 在设置了 `plugins.allow` 时不够。
- 仅 `plugins.entries.browser.enabled=true` 在设置了 `plugins.allow` 时也不够。
- `tools.alsoAllow: ["browser"]` **不会**加载随附的浏览器插件。它只在插件已加载后调整工具策略。
- 如果你不需要限制性的插件白名单，删除 `plugins.allow` 也会恢复默认的随附浏览器行为。

典型症状：

- `openclaw browser` 是未知命令。
- `browser.request` 缺失。
- 智能体报告浏览器工具不可用或缺失。

## 配置文件：`openclaw` 与 `user`

- `openclaw`：托管的隔离浏览器（无需扩展）。
- `user`：内置的 Chrome MCP 附加配置文件，用于你**真实的已登录 Chrome** 会话。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有已登录会话重要且用户在电脑旁可点击/批准任何附加提示时，优先选择 `profile="user"`。
- `profile` 是当你想要特定浏览器模式时的显式覆盖。

如果你想要默认使用托管模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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

注意事项：

- 浏览器控制服务绑定到 loopback 上的端口，该端口从 `gateway.port` 派生（默认：`18791`，即 gateway + 2）。
- 如果你覆盖了 Gateway 网关端口（`gateway.port` 或 `OPENCLAW_GATEWAY_PORT`），派生的浏览器端口会相应调整以保持在同一"系列"中。
- 未设置时，`cdpUrl` 默认为托管本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程（非 loopback）CDP 可达性检查。
- `remoteCdpHandshakeTimeoutMs` 适用于远程 CDP WebSocket 可达性检查。
- 浏览器导航/打开标签页在导航前经过 SSRF 防护，并在最终 `http(s)` URL 后进行尽力再检查。
- 在严格 SSRF 模式下，远程 CDP 端点发现/探测（`cdpUrl`，包括 `/json/version` 查找）也会被检查。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认为 `true`（受信任网络模型）。设置为 `false` 可进行严格的仅公网浏览。
- `browser.ssrfPolicy.allowPrivateNetwork` 保留为向后兼容的旧别名。
- `attachOnly: true` 表示"永不启动本地浏览器；仅在浏览器已运行时附加"。
- `color` + 每个配置文件的 `color` 为浏览器 UI 着色，以便你能看到哪个配置文件处于活动状态。
- 默认配置文件是 `openclaw`（OpenClaw 托管的独立浏览器）。使用 `defaultProfile: "user"` 可选择已登录的用户浏览器。
- 自动检测顺序：如果系统默认浏览器是基于 Chromium 的则使用它；否则 Chrome → Brave → Edge → Chromium → Chrome Canary。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl` — 仅为远程 CDP 设置这些。
- `driver: "existing-session"` 使用 Chrome DevTools MCP 而不是原始 CDP。不要为该驱动设置 `cdpUrl`。
- 当现有会话配置文件应附加到非默认 Chromium 用户配置文件（如 Brave 或 Edge）时，设置 `browser.profiles.<name>.userDataDir`。

## 使用 Brave（或其他基于 Chromium 的浏览器）

如果你的**系统默认**浏览器是基于 Chromium 的（Chrome/Brave/Edge 等），OpenClaw 会自动使用它。设置 `browser.executablePath` 可覆盖自动检测：

CLI 示例：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关启动 loopback 控制服务，可以启动本地浏览器。
- **远程控制（节点主机）：** 在有浏览器的机器上运行节点主机；Gateway 网关将浏览器操作代理到该节点。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以附加到远程的基于 Chromium 的浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。

远程 CDP URL 可以包含认证信息：

- 查询令牌（例如 `https://provider.example?token=<token>`）
- HTTP Basic 认证（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点和连接 CDP WebSocket 时会保留认证信息。建议使用环境变量或密钥管理器存储令牌，而不是将其提交到配置文件中。

## 节点浏览器代理（零配置默认）

如果你在有浏览器的机器上运行**节点主机**，OpenClaw 可以自动将浏览器工具调用路由到该节点，无需任何额外的浏览器配置。这是远程 Gateway 网关的默认路径。

注意事项：

- 节点主机通过**代理命令**暴露其本地浏览器控制服务器。
- 配置文件来自节点自己的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选的。留空以使用旧版/默认行为：所有已配置的配置文件通过代理仍然可访问，包括配置文件创建/删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 将其视为最小权限边界：只有白名单中的配置文件可以被定位，并且持久配置文件创建/删除路由在代理界面上被阻止。
- 如果不需要可以禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 Gateway 网关上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管的 Chromium 服务，通过 HTTPS 和 WebSocket 暴露 CDP 连接 URL。OpenClaw 可以使用这两种形式，但对于远程浏览器配置文件，最简单的选项是来自 Browserless 连接文档的直接 WebSocket URL。

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

- 将 `<BROWSERLESS_API_KEY>` 替换为你真实的 Browserless 令牌。
- 选择与你的 Browserless 账户匹配的区域端点（请参阅其文档）。

## 直接 WebSocket CDP 提供商

一些托管浏览器服务暴露**直接 WebSocket** 端点，而不是标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 两者都支持：

- **HTTP(S) 端点** — OpenClaw 调用 `/json/version` 发现 WebSocket 调试器 URL，然后连接。
- **WebSocket 端点**（`ws://` / `wss://`）— OpenClaw 直接连接，跳过 `/json/version`。适用于 [Browserless](https://browserless.io)、[Browserbase](https://www.browserbase.com) 或任何提供 WebSocket URL 的提供商。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个用于运行无头浏览器的云平台，内置验证码解决、隐身模式和住宅代理。

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

- 注册并从 Overview 仪表板复制你的 **API Key**。
- 将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API key。
- Browserbase 在 WebSocket 连接时自动创建浏览器会话，无需手动创建会话步骤。

## 安全性

核心理念：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关的认证或节点配对进行。
- 如果启用了浏览器控制且未配置认证，OpenClaw 在启动时自动生成 `gateway.auth.token` 并持久化到配置中。
- 将 Gateway 网关和任何节点主机保持在私有网络上（Tailscale）；避免公开暴露。
- 将远程 CDP URL/令牌视为机密；优先使用环境变量或密钥管理器。

远程 CDP 提示：

- 尽可能使用加密端点（HTTPS 或 WSS）和短期令牌。
- 避免在配置文件中直接嵌入长期令牌。

## 配置文件（多浏览器）

OpenClaw 支持多个命名配置文件（路由配置）。配置文件可以是：

- **openclaw 托管**：具有独立用户数据目录和 CDP 端口的专用基于 Chromium 的浏览器实例
- **远程**：显式 CDP URL（在其他地方运行的基于 Chromium 的浏览器）
- **现有会话**：通过 Chrome DevTools MCP 自动连接访问你现有的 Chrome 配置文件

默认值：

- 如果缺少 `openclaw` 配置文件，会自动创建。
- `user` 配置文件是内置的，用于 Chrome MCP 现有会话附加。
- 超过 `user` 的现有会话配置文件是选择加入的；使用 `--driver existing-session` 创建它们。
- 本地 CDP 端口默认从 **18800–18899** 分配。
- 删除配置文件会将其本地数据目录移至回收站。

所有控制端点接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用现有会话

OpenClaw 还可以通过官方 Chrome DevTools MCP 服务器附加到正在运行的基于 Chromium 的浏览器配置文件。这会重用该浏览器配置文件中已打开的标签页和登录状态。

内置配置文件：

- `user`

默认行为：

- 内置的 `user` 配置文件使用 Chrome MCP 自动连接，定向到默认的本地 Google Chrome 配置文件。

对于 Brave、Edge、Chromium 或非默认 Chrome 配置文件，使用 `userDataDir`：

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

然后在匹配的浏览器中：

1. 打开该浏览器的远程调试检查页面。
2. 启用远程调试。
3. 保持浏览器运行，并在 OpenClaw 附加时批准连接提示。

常见检查页面：

- Chrome：`chrome://inspect/#remote-debugging`
- Brave：`brave://inspect/#remote-debugging`
- Edge：`edge://inspect/#remote-debugging`

实时附加冒烟测试：

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

注意事项：

- 此路径比隔离的 `openclaw` 配置文件风险更高，因为它可以在你已登录的浏览器会话内操作。
- OpenClaw 不会为此驱动启动浏览器；它只附加到现有会话。
- 现有会话是主机本地的。如果 Chrome 在不同机器或不同网络命名空间上，请改用远程 CDP 或节点主机。

## 隔离保证

- **专用用户数据目录**：永不触及你的个人浏览器配置文件。
- **专用端口**：避免使用 `9222` 以防止与开发工作流冲突。
- **确定性标签页控制**：通过 `targetId` 定位标签页，而非"最后一个标签页"。

## 浏览器选择

本地启动时，OpenClaw 选择第一个可用的：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以使用 `browser.executablePath` 覆盖。

平台：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：查找 `google-chrome`、`brave`、`microsoft-edge`、`chromium` 等。
- Windows：检查常见安装位置。

## 控制 API（可选）

仅用于本地集成，Gateway 网关暴露一个小型的 loopback HTTP API：

- 状态/启动/停止：`GET /`、`POST /start`、`POST /stop`
- 标签页：`GET /tabs`、`POST /tabs/open`、`POST /tabs/focus`、`DELETE /tabs/:targetId`
- 快照/截图：`GET /snapshot`、`POST /screenshot`
- 操作：`POST /navigate`、`POST /act`
- 钩子：`POST /hooks/file-chooser`、`POST /hooks/dialog`
- 下载：`POST /download`、`POST /wait/download`
- 调试：`GET /console`、`POST /pdf`
- 调试：`GET /errors`、`GET /requests`、`POST /trace/start`、`POST /trace/stop`、`POST /highlight`
- 网络：`POST /response/body`
- 状态：`GET /cookies`、`POST /cookies/set`、`POST /cookies/clear`
- 状态：`GET /storage/:kind`、`POST /storage/:kind/set`、`POST /storage/:kind/clear`
- 设置：`POST /set/offline`、`POST /set/headers`、`POST /set/credentials`、`POST /set/geolocation`、`POST /set/media`、`POST /set/timezone`、`POST /set/locale`、`POST /set/device`

所有端点接受 `?profile=<name>`。

### Playwright 要求

某些功能（navigate/act/AI 快照/角色快照、元素截图、PDF）需要 Playwright。如果未安装 Playwright，这些端点会返回明确的 501 错误。ARIA 快照和基本截图对于 openclaw 托管的 Chrome 仍然有效。

如果你看到 `Playwright is not available in this gateway build`，请安装完整的 Playwright 包（不是 `playwright-core`）并重启 Gateway 网关，或者重新安装带浏览器支持的 OpenClaw。

#### Docker Playwright 安装

如果你的 Gateway 网关在 Docker 中运行，避免使用 `npx playwright`（npm 覆盖冲突）。改用随附的 CLI：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

要持久化浏览器下载，设置 `PLAYWRIGHT_BROWSERS_PATH`（例如 `/home/node/.cache/ms-playwright`），并确保 `/home/node` 通过 `OPENCLAW_HOME_VOLUME` 或绑定挂载持久化。参见 [Docker](/install/docker)。

## 工作原理（内部）

高层流程：

- 一个小型**控制服务器**接受 HTTP 请求。
- 它通过 **CDP** 连接到基于 Chromium 的浏览器（Chrome/Brave/Edge/Chromium）。
- 对于高级操作（点击/输入/快照/PDF），它在 CDP 之上使用 **Playwright**。
- 当缺少 Playwright 时，仅非 Playwright 操作可用。

这种设计使智能体保持在稳定、确定性的接口上，同时让你可以切换本地/远程浏览器和配置文件。

## CLI 快速参考

所有命令接受 `--browser-profile <name>` 以定位特定配置文件。
所有命令也接受 `--json` 以获得机器可读的输出（稳定的负载）。

基础操作：

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

检查：

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

操作：

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

状态：

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

注意事项：

- `upload` 和 `dialog` 是**预备**调用；在触发选择器/对话框的点击/按键之前运行它们。
- 下载和 trace 输出路径限制在 OpenClaw 临时根目录：traces 在 `/tmp/openclaw`，downloads 在 `/tmp/openclaw/downloads`。
- Upload 路径限制在 `/tmp/openclaw/uploads`。
- `upload` 也可以通过 `--input-ref` 或 `--element` 直接设置文件输入。
- `snapshot`：
  - `--format ai`（安装 Playwright 时的默认值）：返回带有数字 ref 的 AI 快照（`aria-ref="<n>"`）。
  - `--format aria`：返回无障碍树（无 ref；仅供检查）。
  - `--efficient`（或 `--mode efficient`）：紧凑角色快照预设（interactive + compact + depth + 较低的 maxChars）。
  - 配置默认值（仅限工具/CLI）：设置 `browser.snapshotDefaults.mode: "efficient"` 以在调用者未传递模式时使用高效快照。
  - 角色快照选项（`--interactive`、`--compact`、`--depth`、`--selector`）强制使用带有 `ref=e12` 等 ref 的基于角色的快照。
  - `--frame "<iframe selector>"` 将角色快照范围限定到 iframe（与 `e12` 等角色 ref 配合使用）。
  - `--interactive` 输出一个扁平的、易于选择的交互元素列表（最适合驱动操作）。
  - `--labels` 添加一个带有叠加 ref 标签的仅视口截图（打印 `MEDIA:<path>`）。
- `click`/`type` 等需要来自 `snapshot` 的 `ref`（数字 `12` 或角色 ref `e12`）。操作故意不支持 CSS 选择器。

## 快照和 ref

OpenClaw 支持两种"快照"风格：

- **AI 快照（数字 ref）**：`openclaw browser snapshot`（默认；`--format ai`）
  - 输出：包含数字 ref 的文本快照。
  - 操作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部通过 Playwright 的 `aria-ref` 解析 ref。

- **角色快照（角色 ref 如 `e12`）**：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 输出：带有 `[ref=e12]`（和可选的 `[nth=1]`）的基于角色的列表/树。
  - 操作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部通过 `getByRole(...)`（加上重复项的 `nth()`）解析 ref。
  - 添加 `--labels` 可包含带有叠加 `e12` 标签的视口截图。

ref 行为：

- ref 在**导航之间不稳定**；如果出错，重新运行 `snapshot` 并使用新的 ref。
- 如果角色快照是使用 `--frame` 拍摄的，角色 ref 将限定在该 iframe 内，直到下一次角色快照。

## 等待增强功能

你可以等待的不仅仅是时间/文本：

- 等待 URL（Playwright 支持通配符）：
  - `openclaw browser wait --url "**/dash"`
- 等待加载状态：
  - `openclaw browser wait --load networkidle`
- 等待 JS 断言：
  - `openclaw browser wait --fn "window.ready===true"`
- 等待选择器变得可见：
  - `openclaw browser wait "#main"`

这些可以组合使用：

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## 调试工作流

当操作失败时（例如"not visible"、"strict mode violation"、"covered"）：

1. `openclaw browser snapshot --interactive`
2. 使用 `click <ref>` / `type <ref>`（在交互模式下优先使用角色 ref）
3. 如果仍然失败：`openclaw browser highlight <ref>` 查看 Playwright 定位的目标
4. 如果页面行为异常：
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 深度调试：录制 trace：
   - `openclaw browser trace start`
   - 重现问题
   - `openclaw browser trace stop`（打印 `TRACE:<path>`）

## JSON 输出

`--json` 用于脚本和结构化工具。

示例：

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON 格式的角色快照包含 `refs` 加上一个小的 `stats` 块（lines/chars/refs/interactive），以便工具可以推断负载大小和密度。

## 状态和环境开关

这些对于"让网站表现得像 X"的工作流很有用：

- Cookies：`cookies`、`cookies set`、`cookies clear`
- 存储：`storage local|session get|set|clear`
- 离线：`set offline on|off`
- 请求头：`set headers --headers-json '{"X-Debug":"1"}'`（旧版 `set headers --json` 仍然支持）
- HTTP basic 认证：`set credentials user pass`（或 `--clear`）
- 地理位置：`set geo <lat> <lon> --origin "https://example.com"`（或 `--clear`）
- 媒体：`set media dark|light|no-preference|none`
- 时区/语言环境：`set timezone ...`、`set locale ...`
- 设备/视口：
  - `set device "iPhone 14"`（Playwright 设备预设）
  - `set viewport 1280 720`

## 安全与隐私

- openclaw 浏览器配置文件可能包含已登录的会话；请将其视为敏感信息。
- `browser act kind=evaluate` / `openclaw browser evaluate` 和 `wait --fn` 在页面上下文中执行任意 JavaScript。提示注入可能会操纵它。如果不需要，请使用 `browser.evaluateEnabled=false` 禁用它。
- 有关登录和反机器人注意事项（X/Twitter 等），请参阅 [浏览器登录 + X/Twitter 发帖](/tools/browser-login)。
- 保持 Gateway 网关/节点主机私有（仅限 loopback 或 tailnet）。
- 远程 CDP 端点功能强大；请通过隧道保护它们。

## 故障排除

有关 Linux 特定问题（特别是 snap Chromium），请参阅[浏览器故障排除](/tools/browser-linux-troubleshooting)。

有关 WSL2 Gateway + Windows Chrome 分离主机设置，请参阅 [WSL2 + Windows + 远程 Chrome CDP 故障排除](/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

## 智能体工具 + 控制工作原理

智能体获得**一个工具**用于浏览器自动化：

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

映射方式：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用快照 `ref` ID 来点击/输入/拖动/选择。
- `browser screenshot` 捕获像素（整页或元素）。
- `browser` 接受：
  - `profile` 来选择命名的浏览器配置文件（openclaw、user 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`）来选择浏览器所在位置。
  - 在沙箱会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱会话默认为 `sandbox`，非沙箱会话默认为 `host`。
  - 如果连接了具有浏览器能力的节点，工具可能会自动路由到该节点，除非你指定 `target="host"` 或 `target="node"`。

这使智能体保持确定性并避免脆弱的选择器。
