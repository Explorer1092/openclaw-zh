---
mmh3_hash: "2fb12e6757ef4f9853e162ef3cb6b2b8"
summary: "`openclaw browser` 的 CLI 参考(配置文件、标签、操作、扩展中继)"
read_when:
  - 您使用 `openclaw browser` 并想要常见任务的示例
  - 您想通过节点主机控制在另一台机器上运行的浏览器
  - 您想使用 Chrome 扩展中继(通过工具栏按钮附加/分离)
---

# `openclaw browser`

管理 OpenClaw 的浏览器控制服务器并运行浏览器操作(标签、快照、屏幕截图、导航、点击、输入)。

相关:
- 浏览器工具 + API:[浏览器工具](/tools/browser)
- Chrome 扩展中继:[Chrome 扩展](/tools/chrome-extension)

## 常用标志

- `--url <gatewayWsUrl>`:网关 WebSocket URL(默认为配置)。
- `--token <token>`:网关令牌(如果需要)。
- `--timeout <ms>`:请求超时(毫秒)。
- `--browser-profile <name>`:选择浏览器配置文件(从配置中默认)。
- `--json`:机器可读输出(如果支持)。

## 快速入门(本地)

```bash
openclaw browser --browser-profile chrome tabs
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## 配置文件

配置文件是命名的浏览器路由配置。实际上:
- `openclaw`:启动/附加到专用的 OpenClaw 管理的 Chrome 实例(隔离的用户数据目录)。
- `chrome`:通过 Chrome 扩展中继控制现有的 Chrome 标签。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
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

## Chrome 扩展中继(通过工具栏按钮附加)

此模式允许代理控制您手动附加的现有 Chrome 标签(它不会自动附加)。

将未打包的扩展安装到稳定路径:

```bash
openclaw browser extension install
openclaw browser extension path
```

然后 Chrome → `chrome://extensions` → 启用"开发者模式" → "加载已解压的扩展程序" → 选择打印的文件夹。

完整指南:[Chrome 扩展](/tools/chrome-extension)

## 远程浏览器控制(节点主机代理)

如果网关在与浏览器不同的机器上运行,请在具有 Chrome/Brave/Edge/Chromium 的机器上运行**节点主机**。网关将把浏览器操作代理到该节点(不需要单独的浏览器控制服务器)。

使用 `gateway.nodes.browser.mode` 控制自动路由,使用 `gateway.nodes.browser.node` 在连接多个节点时固定特定节点。

安全 + 远程设置:[浏览器工具](/tools/browser)、[远程访问](/gateway/remote)、[Tailscale](/gateway/tailscale)、[安全](/gateway/security)
