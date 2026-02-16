---
mmh3_hash: "549ef8fbf0914e42df7232a7ada8f56d"
summary: "macOS 权限持久化 (TCC) 和签名要求"
read_when:
  - 调试缺失或卡住的 macOS 权限提示
  - 打包或签名 macOS 应用
  - 更改 bundle ID 或应用安装路径
title: "macOS 权限"
---

# macOS 权限 (TCC)

macOS 权限授予是脆弱的。TCC 将权限授予与应用的代码签名、bundle identifier 和磁盘路径相关联。如果其中任何一个更改, macOS 会将应用视为新应用, 并可能删除或隐藏提示。

## 稳定权限的要求

- 相同路径: 从固定位置运行应用 (对于 OpenClaw, 为 `dist/OpenClaw.app`)。
- 相同的 bundle identifier: 更改 bundle ID 会创建新的权限标识。
- 已签名的应用: 未签名或 ad-hoc 签名的构建不会持久化权限。
- 一致的签名: 使用真正的 Apple Development 或 Developer ID 证书,
  以便签名在重建时保持稳定。

Ad-hoc 签名在每次构建时生成新标识。macOS 会忘记以前的授予, 提示可能完全消失, 直到清除陈旧的条目。

## 提示消失时的恢复清单

1. 退出应用。
2. 在 System Settings → Privacy & Security 中删除应用条目。
3. 从相同路径重新启动应用并重新授予权限。
4. 如果提示仍未出现, 请使用 `tccutil` 重置 TCC 条目并重试。
5. 某些权限仅在完全 macOS 重启后才会重新出现。

示例重置 (根据需要替换 bundle ID):

```bash
sudo tccutil reset Accessibility bot.molt.mac
sudo tccutil reset ScreenCapture bot.molt.mac
sudo tccutil reset AppleEvents
```

## Files and folders 权限 (Desktop/Documents/Downloads)

macOS 也可能对终端/后台进程门控 Desktop、Documents 和 Downloads。如果文件读取或目录列表挂起, 请授予对执行文件操作的相同进程上下文的访问权限 (例如 Terminal/iTerm、LaunchAgent 启动的应用或 SSH 进程)。

解决方法: 如果您想避免按文件夹授予权限, 请将文件移动到 OpenClaw workspace (`~/.openclaw/workspace`)。

如果您正在测试权限, 请始终使用真实证书签名。Ad-hoc 构建仅适用于权限无关紧要的快速本地运行。
