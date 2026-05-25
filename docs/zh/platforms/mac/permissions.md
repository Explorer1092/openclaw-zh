---
mmh3_hash: "9993ee5e42ee2a38695afca28fa4db59"
summary: "macOS 权限持久化 (TCC) 和签名要求"
read_when:
  - 调试缺失或卡住的 macOS 权限提示
  - 决定是否将 Accessibility 授予 node 或 CLI 运行时
  - 打包或签名 macOS 应用
  - 更改 bundle ID 或应用安装路径
title: "macOS 权限"
---

macOS 权限授予是脆弱的。TCC 将权限授予与应用的代码签名、bundle identifier 和磁盘路径相关联。如果其中任何一个更改,macOS 会将应用视为新应用,并可能删除或隐藏提示。

## 稳定权限的要求

- 相同路径:从固定位置运行应用(对于 OpenClaw,为 `dist/OpenClaw.app`)。
- 相同的 bundle identifier:更改 bundle ID 会创建新的权限标识。
- 已签名的应用:未签名或 ad-hoc 签名的构建不会持久化权限。
- 一致的签名:使用真正的 Apple Development 或 Developer ID 证书,
  以便签名在重建时保持稳定。

Ad-hoc 签名在每次构建时生成新标识。macOS 会忘记以前的授予，提示可能完全消失，直到清除陈旧的条目。

## Node 和 CLI 运行时的 Accessibility 授权

优先将 Accessibility 授予 OpenClaw.app、Peekaboo.app 或其他拥有自己 bundle identifier 的已签名 helper，而不是通用的 `node` 二进制文件。

macOS TCC 将 Accessibility 授予它所看到进程的代码标识。如果 Homebrew、nvm、pnpm 或 npm 工作流导致共享的 `node` 可执行文件获得 Accessibility，则通过该同一可执行文件启动的任何 JavaScript 包都可能继承 GUI 自动化权限。

请将 System Settings 中的 `node` 条目视为对该 Node 运行时的广泛权限，而不是对某个 npm 包的权限。避免向 `node` 授予 Accessibility，除非你信任通过该确切 Node 安装启动的每个脚本和包。

如果你不小心向 `node` 授予了 Accessibility，请从 System Settings → Privacy & Security → Accessibility 中删除该条目。然后将权限授予应该拥有 UI 自动化的已签名应用或 helper。

## 提示消失时的恢复清单

1. 退出应用。
2. 在 System Settings → Privacy & Security 中删除应用条目。
3. 从相同路径重新启动应用并重新授予权限。
4. 如果提示仍未出现,请使用 `tccutil` 重置 TCC 条目并重试。
5. 某些权限仅在完全 macOS 重启后才会重新出现。

示例重置(根据需要替换 bundle ID):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Files and folders 权限 (Desktop/Documents/Downloads)

macOS 也可能对终端/后台进程门控 Desktop、Documents 和 Downloads。如果文件读取或目录列表挂起,请授予对执行文件操作的相同进程上下文的访问权限(例如 Terminal/iTerm、LaunchAgent 启动的应用或 SSH 进程)。

解决方法:如果你想避免按文件夹授予权限,请将文件移动到 OpenClaw workspace(`~/.openclaw/workspace`)。

如果你正在测试权限,请始终使用真实证书签名。Ad-hoc 构建仅适用于权限无关紧要的快速本地运行。

## 相关文档

- [macOS 应用](/platforms/macos)
- [macOS 签名](/platforms/mac/signing)
