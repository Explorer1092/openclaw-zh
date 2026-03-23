---
title: "`openclaw browser`"
sidebarTitle: "openclaw browser"
mmh3_hash: "cfef22c911ac8b2381d1767fdde856a2"
summary: "`openclaw browser` 的 CLI 参考(配置文件、标签、操作、Chrome MCP 和 CDP)"
read_when:
  - 您使用 `openclaw browser` 并想要常见任务的示例
  - 您想通过节点主机控制在另一台机器上运行的浏览器
  - 您想通过 Chrome MCP 附加到本地已登录的 Chrome
---

# `openclaw browser`

管理 OpenClaw 的浏览器控制服务器并运行浏览器操作(标签、快照、屏幕截图、导航、点击、输入)。

相关:

- 浏览器工具 + API:[Browser tool](/tools/browser)

## 常用标志

- `--url <gatewayWsUrl>`:Gateway WebSocket URL(默认为配置)。
- `--token <token>`:Gateway 令牌(如果需要)。
- `--timeout <ms>`:请求超时(毫秒)。
- `--browser-profile <name>`:选择浏览器配置文件(从配置中默认)。
- `--json`:机器可读输出(如果支持)。

## 快速入门(本地)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## 配置文件

配置文件是命名的浏览器路由配置。实际上:

- `openclaw`:启动/附加到专用的 OpenClaw 管理的 Chrome 实例(隔离的用户数据目录)。
- `user`:通过 Chrome DevTools MCP 控制您现有的已登录 Chrome Session。
- 自定义 CDP 配置文件:指向本地或远程 CDP 端点。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser delete-profile --name work
```

使用特定配置文件:

```bash
openclaw browser --browser-profile work tabs
```

## 标签

```bash
openclaw browser tabs
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## 快照/屏幕截图/操作

快照:

```bash
openclaw browser snapshot
```

屏幕截图:

```bash
openclaw browser screenshot
```

导航/点击/输入(基于引用的 UI 自动化):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
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

## 远程浏览器控制(节点主机代理)

如果 Gateway 在与浏览器不同的机器上运行,请在具有 Chrome/Brave/Edge/Chromium 的机器上运行**节点主机**。Gateway 将把浏览器操作代理到该节点(不需要单独的浏览器控制服务器)。

使用 `gateway.nodes.browser.mode` 控制自动路由,使用 `gateway.nodes.browser.node` 在连接多个节点时固定特定节点。

安全 + 远程设置:[Browser tool](/tools/browser)、[Remote access](/gateway/remote)、[Tailscale](/gateway/tailscale)、[Security](/gateway/security)
