---
title: "macOS 签名 (调试构建)"
sidebarTitle: "签名 (调试)"
mmh3_hash: "dc5e15f8158912e54a038c0838046b21"
summary: "由打包脚本生成的 macOS 调试构建的签名步骤"
read_when: ["构建或签名 mac 调试构建"]
---
# macOS 签名 (调试构建)

此应用通常从 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 构建,现在:

- 设置稳定的调试捆绑包标识符:`ai.openclaw.mac.debug`
- 使用该捆绑包 id 写入 Info.plist(通过 `BUNDLE_ID=...` 覆盖)
- 调用 [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) 签名主二进制文件和应用捆绑包,以便 macOS 将每次重建视为相同的签名捆绑包并保留 TCC 权限(通知、辅助功能、屏幕录制、麦克风、语音)。对于稳定的权限,使用真实的签名身份;ad-hoc 是可选的且脆弱(参见 [macOS 权限](/platforms/mac/permissions))。
- 默认使用 `CODESIGN_TIMESTAMP=auto`;它为 Developer ID 签名启用受信任的时间戳。设置 `CODESIGN_TIMESTAMP=off` 以跳过时间戳(离线调试构建)。
- 将构建元数据注入 Info.plist:`OpenClawBuildTimestamp`(UTC)和 `OpenClawGitCommit`(短哈希),以便 About 窗格可以显示构建、git 和调试/发布通道。
- **打包需要 Node 22+**: 脚本运行 TS 构建和控制 UI 构建。
- 从环境中读取 `SIGN_IDENTITY`。将 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`(或你的 Developer ID Application 证书)添加到你的 shell rc 以始终使用你的证书签名。Ad-hoc 签名需要通过 `ALLOW_ADHOC_SIGNING=1` 或 `SIGN_IDENTITY="-"` 明确选择(不推荐用于权限测试)。
- 签名后运行 Team ID 审计,如果应用捆绑包内的任何 Mach-O 由不同的 Team ID 签名则失败。设置 `SKIP_TEAM_ID_CHECK=1` 以绕过。

## 用法

```bash
# 从仓库根目录
scripts/package-mac-app.sh               # 自动选择身份;如果未找到则出错
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # 真实证书
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc(权限不会保留)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # 明确的 ad-hoc(相同注意事项)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # 仅开发 Sparkle Team ID 不匹配解决方法
```

### Ad-hoc 签名说明
使用 `SIGN_IDENTITY="-"`(ad-hoc)签名时,脚本会自动禁用 **Hardened Runtime**(`--options runtime`)。这是必要的,以防止应用尝试加载不共享相同 Team ID 的嵌入式框架(如 Sparkle)时崩溃。Ad-hoc 签名也会破坏 TCC 权限持久性;有关恢复步骤,请参阅 [macOS 权限](/platforms/mac/permissions)。

## 关于的构建元数据

`package-mac-app.sh` 使用以下内容标记捆绑包:
- `OpenClawBuildTimestamp`:打包时的 ISO8601 UTC
- `OpenClawGitCommit`:短 git 哈希(或不可用时为 `unknown`)

About 选项卡读取这些键以显示版本、构建日期、git 提交以及是否为调试构建(通过 `#if DEBUG`)。在代码更改后运行打包器以刷新这些值。

## 为什么

TCC 权限与捆绑包标识符*和*代码签名相关联。具有更改 UUID 的未签名调试构建导致 macOS 在每次重建后忘记授予。签名二进制文件(默认为 ad-hoc)并保持固定的捆绑包 id/路径(`dist/OpenClaw.app`)在构建之间保留授予,匹配 VibeTunnel 方法。
