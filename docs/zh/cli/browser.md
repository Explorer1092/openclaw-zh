---
mmh3_hash: "ed4c98f2de56a5cf6f2f843140d01f37"
title: "`openclaw browser`"
sidebarTitle: "openclaw browser"
summary: "`openclaw browser` 的 CLI 参考(生命周期、配置文件、标签、操作、状态和调试)"
read_when:
  - 您使用 `openclaw browser` 并想要常见任务的示例
  - 您想通过节点主机控制在另一台机器上运行的浏览器
  - 您想通过 Chrome MCP 附加到本地已登录的 Chrome
---

# `openclaw browser`

管理 OpenClaw 的浏览器控制界面并运行浏览器操作(生命周期、配置文件、标签、快照、截图、导航、输入、状态模拟和调试)。

相关:

- 浏览器工具 + API:[Browser tool](/tools/browser)

## 常用标志

- `--url <gatewayWsUrl>`:Gateway WebSocket URL(默认为配置)。
- `--token <token>`:Gateway 令牌(如果需要)。
- `--timeout <ms>`:请求超时(毫秒)。
- `--expect-final`:等待最终 Gateway 响应。
- `--browser-profile <name>`:选择浏览器配置文件(从配置中默认)。
- `--json`:机器可读输出(在支持的地方)。

## 快速入门(本地)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## 生命周期

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

说明:

- 对于 `attachOnly` 和远程 CDP 配置文件,`openclaw browser stop` 关闭
  活动控制 Session 并清除临时模拟覆盖,即使 OpenClaw 未自行启动浏览器进程。
- 对于本地托管配置文件,`openclaw browser stop` 停止生成的浏览器进程。

## 如果命令缺失

如果 `openclaw browser` 是未知命令,请检查
`~/.openclaw/openclaw.json` 中的 `plugins.allow`。

当 `plugins.allow` 存在时,必须显式列出捆绑的浏览器插件:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

当插件允许列表排除 `browser` 时,`browser.enabled=true` 不会恢复 CLI 子命令。

相关:[Browser tool](/tools/browser#missing-browser-command-or-tool)

## 配置文件

配置文件是命名的浏览器路由配置。实际上:

- `openclaw`:启动或附加到专用的 OpenClaw 管理的 Chrome 实例(隔离的用户数据目录)。
- `user`:通过 Chrome DevTools MCP 控制您现有的已登录 Chrome Session。
- 自定义 CDP 配置文件:指向本地或远程 CDP 端点。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

使用特定配置文件:

```bash
openclaw browser --browser-profile work tabs
```

## 标签

```bash
openclaw browser tabs
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## 快照/截图/操作

快照:

```bash
openclaw browser snapshot
```

截图:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

说明:

- `--full-page` 仅用于页面截图;不能与 `--ref` 或 `--element` 组合。
- `existing-session` / `user` 配置文件支持页面截图和快照输出中的 `--ref` 截图,但不支持 CSS `--element` 截图。

导航/点击/输入(基于引用的 UI 自动化):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

文件 + 对话框助手:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

## 状态和存储

视口 + 模拟:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookies + 存储:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## 调试

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## 通过 MCP 使用现有 Chrome

使用内置的 `user` 配置文件,或创建您自己的 `existing-session` 配置文件:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

此路径仅限主机。对于 Docker、无头服务器、Browserless 或其他远程设置,请改用 CDP 配置文件。

当前 existing-session 限制:

- 基于快照的操作使用引用,而非 CSS 选择器
- `click` 仅支持左键点击
- `type` 不支持 `slowly=true`
- `press` 不支持 `delayMs`
- `hover`、`scrollintoview`、`drag`、`select`、`fill` 和 `evaluate` 不支持每次调用的超时覆盖
- `select` 仅支持一个值
- 不支持 `wait --load networkidle`
- 文件上传需要 `--ref` / `--input-ref`,不支持 CSS `--element`,目前每次只支持一个文件
- 对话框钩子不支持 `--timeout`
- 截图支持页面截图和 `--ref`,但不支持 CSS `--element`
- `responsebody`、下载拦截、PDF 导出和批量操作仍需要托管浏览器或原始 CDP 配置文件

## 远程浏览器控制(节点主机代理)

如果 Gateway 在与浏览器不同的机器上运行,请在具有 Chrome/Brave/Edge/Chromium 的机器上运行**节点主机**。Gateway 将把浏览器操作代理到该节点(不需要单独的浏览器控制服务器)。

使用 `gateway.nodes.browser.mode` 控制自动路由,使用 `gateway.nodes.browser.node` 在连接多个节点时固定特定节点。

安全 + 远程设置:[Browser tool](/tools/browser)、[Remote access](/gateway/remote)、[Tailscale](/gateway/tailscale)、[Security](/gateway/security)
