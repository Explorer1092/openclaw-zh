---
read_when:
  - 你使用 `openclaw browser` 并想要常见任务的示例
  - 你想通过 node host 控制在另一台机器上运行的浏览器
  - 你想通过 Chrome MCP 附加到本地已登录的 Chrome
summary: "`openclaw browser` 的 CLI 参考（配置文件、标签页、操作、Chrome MCP 和 CDP）"
title: browser
x-i18n:
  generated_at: "2026-02-03T07:44:49Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 40ed9d9b52d392919f8f85ee240a55a7a51291d7e2a697dce6f79704fccc85ee
  source_path: cli/browser.md
  workflow: 15
---

# `openclaw browser`

管理 OpenClaw 的浏览器控制服务器并运行浏览器操作（标签页、快照、截图、导航、点击、输入）。

相关：

- 浏览器工具 + API：[浏览器工具](/tools/browser)

## 通用标志

- `--url <gatewayWsUrl>`：Gateway 网关 WebSocket URL（默认从配置获取）。
- `--token <token>`：Gateway 网关令牌（如果需要）。
- `--timeout <ms>`：请求超时（毫秒）。
- `--browser-profile <name>`：选择浏览器配置文件（默认从配置获取）。
- `--json`：机器可读输出（在支持的地方）。

## 快速开始（本地）

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## 如果命令不存在

如果 `openclaw browser` 是未知命令，请检查 `~/.openclaw/openclaw.json` 中的 `plugins.allow`。

当 `plugins.allow` 存在时，必须明确列出内置浏览器插件：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` 不会在插件允许列表排除 `browser` 时恢复 CLI 子命令。

相关：[浏览器工具](/tools/browser#missing-browser-command-or-tool)

## 配置文件

配置文件是命名的浏览器路由配置。实际上：

- `openclaw`：启动或附加到专用的 OpenClaw 管理的 Chrome 实例（隔离的用户数据目录）。
- `user`：通过 Chrome DevTools MCP 控制你现有的已登录 Chrome 会话。
- 自定义 CDP 配置文件：指向本地或远程 CDP 端点。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser delete-profile --name work
```

使用特定配置文件：

```bash
openclaw browser --browser-profile work tabs
```

## 标签页

```bash
openclaw browser tabs
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## 快照 / 截图 / 操作

快照：

```bash
openclaw browser snapshot
```

截图：

```bash
openclaw browser screenshot
```

导航/点击/输入（基于 ref 的 UI 自动化）：

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
```

## 通过 MCP 使用现有 Chrome

使用内置 `user` 配置文件，或创建自己的 `existing-session` 配置文件：

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

此路径仅适用于主机。对于 Docker、无头服务器、Browserless 或其他远程设置，请改用 CDP 配置文件。

## 远程浏览器控制（node host 代理）

如果 Gateway 网关与浏览器运行在不同的机器上，在有 Chrome/Brave/Edge/Chromium 的机器上运行 **node host**。Gateway 网关会将浏览器操作代理到该节点（无需单独的浏览器控制服务器）。

使用 `gateway.nodes.browser.mode` 控制自动路由，使用 `gateway.nodes.browser.node` 在连接多个节点时固定特定节点。

安全 + 远程设置：[浏览器工具](/tools/browser)、[远程访问](/gateway/remote)、[Tailscale](/gateway/tailscale)、[安全](/gateway/security)
