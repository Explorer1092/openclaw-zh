---
title: "macOS 签名 (调试构建)"
sidebarTitle: "签名 (调试)"
mmh3_hash: "a977de7d89eb8013c05494e989a33cd0"
summary: "打包脚本生成的 macOS 调试构建的签名步骤"
read_when:
  - 构建或签名 mac 调试构建
---

# mac 签名（调试构建）

此应用通常由 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 构建，该脚本现在：

- 设置稳定的调试 bundle 标识符：`ai.openclaw.mac.debug`
- 用该 bundle id 写入 Info.plist（通过 `BUNDLE_ID=...` 覆盖）
- 调用 [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) 签名主二进制文件和应用包，以便 macOS 将每次重建视为相同的签名包并保持 TCC 权限（通知、辅助功能、屏幕录制、麦克风、语音识别）。要获得稳定权限，使用真实签名身份；ad-hoc 是选择性加入且不稳定（参见 [macOS 权限](/platforms/mac/permissions)）。
- 默认使用 `CODESIGN_TIMESTAMP=auto`；它为 Developer ID 签名启用受信任的时间戳。设置 `CODESIGN_TIMESTAMP=off` 跳过时间戳（离线调试构建）。
- 将构建元数据注入 Info.plist：`OpenClawBuildTimestamp`（UTC）和 `OpenClawGitCommit`（短哈希），以便 About 窗格可以显示构建、git 和 debug/release 频道。
- **打包默认为 Node 24**：脚本运行 TS 构建和 Control UI 构建。Node 22 LTS，当前 `22.14+`，仍然支持兼容性。
- 从环境读取 `SIGN_IDENTITY`。将 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`（或你的 Developer ID Application 证书）添加到你的 shell rc，以始终使用你的证书签名。Ad-hoc 签名需要通过 `ALLOW_ADHOC_SIGNING=1` 或 `SIGN_IDENTITY="-"` 明确选择加入（不推荐用于权限测试）。
- 签名后运行 Team ID 审计，如果应用包内的任何 Mach-O 由不同的 Team ID 签名则失败。设置 `SKIP_TEAM_ID_CHECK=1` 绕过。

## 用法

```bash
# 从 repo 根目录
scripts/package-mac-app.sh               # 自动选择身份；如果找不到则报错
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # 真实证书
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc（权限不会持久）
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # 明确 ad-hoc（相同警告）
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # 仅 dev 的 Sparkle Team ID 不匹配解决方法
```

### Ad-hoc 签名说明

使用 `SIGN_IDENTITY="-"`（ad-hoc）签名时，脚本自动禁用 **Hardened Runtime**（`--options runtime`）。这是防止应用在尝试加载不共享相同 Team ID 的嵌入式框架（如 Sparkle）时崩溃所必需的。Ad-hoc 签名也会破坏 TCC 权限持久性；参见 [macOS 权限](/platforms/mac/permissions) 了解恢复步骤。

## About 的构建元数据

`package-mac-app.sh` 将以下内容印记到包中：

- `OpenClawBuildTimestamp`：打包时的 ISO8601 UTC
- `OpenClawGitCommit`：短 git 哈希（如果不可用则为 `unknown`）

About 选项卡读取这些 key 以显示版本、构建日期、git commit 以及是否为调试构建（通过 `#if DEBUG`）。代码更改后运行打包器以刷新这些值。

## 为什么

TCC 权限与 bundle 标识符 _和_ 代码签名绑定。具有变化 UUID 的未签名调试构建导致 macOS 在每次重建后忘记授权。签名二进制文件（默认 ad-hoc）并保持固定的 bundle id/路径（`dist/OpenClaw.app`）在构建之间保留授权，与 VibeTunnel 方法匹配。
