---
title: "浏览器 (OpenClaw 管理)"
sidebarTitle: "浏览器"
mmh3_hash: "ce87d8c088725bae6bcc5da638f23006"
summary: "集成浏览器控制服务 + 操作命令"
read_when:
  - 添加 Agent 控制的浏览器自动化
  - 调试 OpenClaw 为何干扰你自己的 Chrome
  - 在 macOS 应用中实现浏览器设置和生命周期
---

# 浏览器（OpenClaw 管理）

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
- 可选的多配置文件支持（`openclaw`、`work`、`remote` 等）。

这个浏览器**不是**你的日常使用浏览器。它是 Agent 自动化和验证的安全隔离平台。

## 快速入门

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果出现"Browser disabled"，请在配置中启用它（见下文）并重启 Gateway。

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
      dangerouslyAllowPrivateNetwork: true, // 默认信任网络模式
      // allowPrivateNetwork: true, // 旧版别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 旧版单配置文件覆盖
    remoteCdpTimeoutMs: 1500, // 远程 CDP HTTP 超时（毫秒）
    remoteCdpHandshakeTimeoutMs: 3000, // 远程 CDP WebSocket 握手超时（毫秒）
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

说明：

- 浏览器控制服务绑定到回环地址，端口由 `gateway.port` 派生（默认：`18791`，即 gateway + 2）。
- 如果你覆盖了 Gateway 端口（`gateway.port` 或 `OPENCLAW_GATEWAY_PORT`），派生的浏览器端口会相应移动以保持在同一"族"中。
- `cdpUrl` 未设置时默认为托管的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程（非回环）CDP 可达性检查。
- `remoteCdpHandshakeTimeoutMs` 适用于远程 CDP WebSocket 可达性检查。
- 浏览器导航/打开标签页在导航前受 SSRF 保护，并在导航后对最终的 `http(s)` URL 进行尽力重检。
- 在严格 SSRF 模式下，远程 CDP 端点发现/探测（`cdpUrl`，包括 `/json/version` 查找）也会被检查。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认为 `true`（信任网络模型）。将其设置为 `false` 可实现严格的仅公网浏览。
- `browser.ssrfPolicy.allowPrivateNetwork` 作为旧版别名保持兼容性支持。
- `attachOnly: true` 表示"永不启动本地浏览器；仅在已运行时附加"。
- `color` 和每个配置文件的 `color` 为浏览器 UI 着色，让你可以看到哪个配置文件处于活动状态。
- 默认配置文件为 `openclaw`（OpenClaw 托管的独立浏览器）。使用 `defaultProfile: "user"` 可选择已登录用户浏览器。
- 自动检测顺序：如果系统默认浏览器是基于 Chromium 的，则使用它；否则按 Chrome → Brave → Edge → Chromium → Chrome Canary 顺序。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl` — 仅为远程 CDP 设置这些值。
- `driver: "existing-session"` 使用 Chrome DevTools MCP 而非原始 CDP。不要为该驱动设置 `cdpUrl`。
- 当现有 Session 配置文件应附加到非默认 Chromium 用户配置文件（如 Brave 或 Edge）时，设置 `browser.profiles.<name>.userDataDir`。

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

## 本地与远程控制

- **本地控制（默认）：** Gateway 启动回环控制服务，并可启动本地浏览器。
- **远程控制（节点主机）：** 在有浏览器的机器上运行节点主机；Gateway 将浏览器操作代理到该节点。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以附加到远程基于 Chromium 的浏览器。这种情况下，OpenClaw 不会启动本地浏览器。

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

[Browserless](https://browserless.io) 是一个托管 Chromium 服务，通过 HTTPS 暴露 CDP 端点。你可以将 OpenClaw 浏览器配置文件指向 Browserless 区域端点，并使用你的 API 密钥进行认证。

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
        cdpUrl: "https://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

说明：

- 将 `<BROWSERLESS_API_KEY>` 替换为你真实的 Browserless token。
- 选择与你的 Browserless 账号匹配的区域端点（参见其文档）。

## 直接 WebSocket CDP 提供商

一些托管浏览器服务暴露的是**直接 WebSocket** 端点，而非标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 两者均支持：

- **HTTP(S) 端点**（如 Browserless）— OpenClaw 调用 `/json/version` 发现 WebSocket 调试器 URL，然后连接。
- **WebSocket 端点**（`ws://` / `wss://`）— OpenClaw 直接连接，跳过 `/json/version`。适用于 [Browserbase](https://www.browserbase.com) 等给你提供 WebSocket URL 的服务。

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
- 如果浏览器控制已启用且未配置认证，OpenClaw 会在启动时自动生成 `gateway.auth.token` 并持久化到配置中。
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
- 现有 Session 截图支持页面捕获和来自快照的 `--ref` 元素捕获，但不支持 CSS `--element` 选择器。
- 现有 Session `wait --url` 与其他浏览器驱动一样支持精确、子字符串和 glob 模式。目前不支持 `wait --load networkidle`。
- 某些功能仍需要托管浏览器路径，如 PDF 导出和下载拦截。
- 现有 Session 是主机本地的。如果 Chrome 位于不同机器或不同网络命名空间，请改用远程 CDP 或节点主机。

## 隔离保证

- **专用用户数据目录**：从不触碰你的个人浏览器配置文件。
- **专用端口**：避免使用 `9222` 以防止与开发工作流冲突。
- **确定性标签页控制**：通过 `targetId` 而非"最后一个标签页"来定位标签页。

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
- Linux：查找 `google-chrome`、`brave`、`microsoft-edge`、`chromium` 等。
- Windows：检查常见安装位置。

## 控制 API（可选）

仅用于本地集成，Gateway 暴露一个小型回环 HTTP API：

- 状态/启动/停止：`GET /`、`POST /start`、`POST /stop`
- 标签页：`GET /tabs`、`POST /tabs/open`、`POST /tabs/focus`、`DELETE /tabs/:targetId`
- 快照/截图：`GET /snapshot`、`POST /screenshot`
- 操作：`POST /navigate`、`POST /act`
- Hooks：`POST /hooks/file-chooser`、`POST /hooks/dialog`
- 下载：`POST /download`、`POST /wait/download`
- 调试：`GET /console`、`POST /pdf`
- 调试：`GET /errors`、`GET /requests`、`POST /trace/start`、`POST /trace/stop`、`POST /highlight`
- 网络：`POST /response/body`
- 状态：`GET /cookies`、`POST /cookies/set`、`POST /cookies/clear`
- 状态：`GET /storage/:kind`、`POST /storage/:kind/set`、`POST /storage/:kind/clear`
- 设置：`POST /set/offline`、`POST /set/headers`、`POST /set/credentials`、`POST /set/geolocation`、`POST /set/media`、`POST /set/timezone`、`POST /set/locale`、`POST /set/device`

所有端点均接受 `?profile=<name>`。

如果配置了 Gateway 认证，浏览器 HTTP 路由也需要认证：

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` 或使用该密码的 HTTP Basic 认证

### Playwright 要求

某些功能（navigate/act/AI 快照/role 快照、元素截图、PDF）需要 Playwright。如果未安装 Playwright，这些端点会返回清晰的 501 错误。ARIA 快照和基本截图仍然适用于 openclaw 托管的 Chrome。

如果你看到 `Playwright is not available in this gateway build`，请安装完整的 Playwright 包（而非 `playwright-core`）并重启 Gateway，或重新安装带浏览器支持的 OpenClaw。

#### Docker Playwright 安装

如果你的 Gateway 在 Docker 中运行，请避免使用 `npx playwright`（npm 覆盖冲突）。改用内置 CLI：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

要持久化浏览器下载，请设置 `PLAYWRIGHT_BROWSERS_PATH`（例如 `/home/node/.cache/ms-playwright`），并确保 `/home/node` 通过 `OPENCLAW_HOME_VOLUME` 或绑定挂载持久化。参见 [Docker](/install/docker)。

## 工作原理（内部）

高层流程：

- 一个小型**控制服务器**接受 HTTP 请求。
- 它通过 **CDP** 连接到基于 Chromium 的浏览器（Chrome/Brave/Edge/Chromium）。
- 对于高级操作（点击/输入/快照/PDF），它在 CDP 之上使用 **Playwright**。
- 当 Playwright 不可用时，只有非 Playwright 操作可用。

这种设计让 Agent 保持稳定的确定性接口，同时让你可以切换本地/远程浏览器和配置文件。

## CLI 快速参考

所有命令均接受 `--browser-profile <name>` 来定位特定配置文件。
所有命令也接受 `--json` 以获取机器可读的输出（稳定载荷）。

基础：

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

注意：

- `upload` 和 `dialog` 是**武装**调用；在触发文件选择器/对话框的点击/按键之前运行它们。
- 下载和 trace 输出路径受限于 OpenClaw 临时根目录：
  - traces：`/tmp/openclaw`（回退：`${os.tmpdir()}/openclaw`）
  - downloads：`/tmp/openclaw/downloads`（回退：`${os.tmpdir()}/openclaw/downloads`）
- 上传路径受限于 OpenClaw 临时上传根目录：
  - uploads：`/tmp/openclaw/uploads`（回退：`${os.tmpdir()}/openclaw/uploads`）
- `upload` 也可以通过 `--input-ref` 或 `--element` 直接设置文件输入。
- `snapshot`：
  - `--format ai`（安装 Playwright 时为默认）：返回带数字 ref（`aria-ref="<n>"`）的 AI 快照。
  - `--format aria`：返回可访问性树（无 ref；仅用于检查）。
  - `--efficient`（或 `--mode efficient`）：紧凑 role 快照预设（interactive + compact + depth + 较低的 maxChars）。
  - 配置默认值（仅工具/CLI）：设置 `browser.snapshotDefaults.mode: "efficient"` 可在调用者未传入模式时使用高效快照（参见 [Gateway 配置](/gateway/configuration-reference#browser)）。
  - Role 快照选项（`--interactive`、`--compact`、`--depth`、`--selector`）强制使用带 `ref=e12` 格式 ref 的基于 role 的快照。
  - `--frame "<iframe selector>"` 将 role 快照范围限制在 iframe 内（与 `e12` 格式的 role ref 配对）。
  - `--interactive` 输出交互元素的扁平易选列表（最适合驱动操作）。
  - `--labels` 添加带覆盖 ref 标签的仅视口截图（打印 `MEDIA:<path>`）。
- `click`/`type` 等需要来自 `snapshot` 的 `ref`（数字 `12` 或 role ref `e12`）。操作故意不支持 CSS 选择器。

## 快照和 ref

OpenClaw 支持两种"快照"样式：

- **AI 快照（数字 ref）**：`openclaw browser snapshot`（默认；`--format ai`）
  - 输出：包含数字 ref 的文本快照。
  - 操作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部通过 Playwright 的 `aria-ref` 解析 ref。

- **Role 快照（`e12` 格式的 role ref）**：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 输出：带 `[ref=e12]`（和可选 `[nth=1]`）的基于 role 的列表/树。
  - 操作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部通过 `getByRole(...)` 解析 ref（加上 `nth()` 用于重复项）。
  - 添加 `--labels` 可包含带覆盖 `e12` 标签的视口截图。

Ref 行为：

- Ref 在导航后**不稳定**；如果某操作失败，重新运行 `snapshot` 并使用新的 ref。
- 如果 role 快照是使用 `--frame` 拍摄的，role ref 会限定到该 iframe，直到下一次 role 快照。

## 等待增强功能

你可以等待不仅仅是时间/文本：

- 等待 URL（Playwright 支持 glob）：
  - `openclaw browser wait --url "**/dash"`
- 等待加载状态：
  - `openclaw browser wait --load networkidle`
- 等待 JS 谓词：
  - `openclaw browser wait --fn "window.ready===true"`
- 等待选择器变为可见：
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

当操作失败时（如"not visible"、"strict mode violation"、"covered"）：

1. `openclaw browser snapshot --interactive`
2. 使用 `click <ref>` / `type <ref>`（interactive 模式下优先使用 role ref）
3. 如果仍然失败：`openclaw browser highlight <ref>` 查看 Playwright 正在针对什么
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

JSON 中的 role 快照包含 `refs` 以及一个小型 `stats` 块（lines/chars/refs/interactive），便于工具推理载荷大小和密度。

## 状态和环境旋钮

这些对于"让网站表现得像 X"工作流很有用：

- Cookies：`cookies`、`cookies set`、`cookies clear`
- 存储：`storage local|session get|set|clear`
- 离线：`set offline on|off`
- 请求头：`set headers --headers-json '{"X-Debug":"1"}'`（旧版 `set headers --json '{"X-Debug":"1"}'` 仍然支持）
- HTTP basic 认证：`set credentials user pass`（或 `--clear`）
- 地理位置：`set geo <lat> <lon> --origin "https://example.com"`（或 `--clear`）
- 媒体：`set media dark|light|no-preference|none`
- 时区/区域设置：`set timezone ...`、`set locale ...`
- 设备/视口：
  - `set device "iPhone 14"`（Playwright 设备预设）
  - `set viewport 1280 720`

## 安全与隐私

- openclaw 浏览器配置文件可能包含已登录 Session；将其视为敏感数据。
- `browser act kind=evaluate` / `openclaw browser evaluate` 和 `wait --fn` 在页面上下文中执行任意 JavaScript。提示注入可能引导这个操作。如果不需要，用 `browser.evaluateEnabled=false` 禁用它。
- 有关登录和反机器人说明（X/Twitter 等），参见 [Browser login + X/Twitter posting](/tools/browser-login)。
- 保持 Gateway/节点主机私有（回环或 tailnet 专用）。
- 远程 CDP 端点功能强大；通过隧道保护它们。

严格模式示例（默认阻止私有/内部目标）：

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // 可选精确允许
    },
  },
}
```

## 故障排除

有关 Linux 特定问题（尤其是 snap Chromium），参见
[浏览器故障排除](/tools/browser-linux-troubleshooting)。

有关 WSL2 Gateway + Windows Chrome 分离主机设置，参见
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

## Agent 工具 + 控制原理

Agent 获得**一个工具**用于浏览器自动化：

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

映射方式：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用快照 `ref` ID 进行点击/输入/拖拽/选择。
- `browser screenshot` 捕获像素（整页或元素）。
- `browser` 接受：
  - `profile` 选择命名浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`）选择浏览器所在位置。
  - 在沙盒 Session 中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙盒 Session 默认为 `sandbox`，非沙盒 Session 默认为 `host`。
  - 如果连接了具有浏览器能力的节点，工具可能自动路由到该节点，除非你固定 `target="host"` 或 `target="node"`。

这保持了 Agent 的确定性，避免了脆弱的选择器。
