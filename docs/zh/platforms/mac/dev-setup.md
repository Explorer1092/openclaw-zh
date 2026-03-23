---
mmh3_hash: "f9c5e2715d835c64d5c16cd1c59cf214"
title: "macOS 开发设置"
summary: "在 OpenClaw macOS 应用上工作的开发者设置指南"
read_when:
  - 设置 macOS 开发环境
---

# macOS 开发者设置

本指南涵盖从源码构建和运行 OpenClaw macOS 应用所需的步骤。

## 先决条件

在构建应用之前，确保你已安装以下内容：

1. **Xcode 26.2+**：Swift 开发必需。
2. **Node.js 24 & pnpm**：推荐用于 gateway、CLI 和打包脚本。Node 22 LTS，当前 `22.16+`，仍然支持兼容性。

## 1. 安装依赖

安装项目范围的依赖：

```bash
pnpm install
```

## 2. 构建和打包应用

要构建 macOS 应用并将其打包到 `dist/OpenClaw.app`，运行：

```bash
./scripts/package-mac-app.sh
```

如果你没有 Apple Developer ID 证书，脚本将自动使用 **ad-hoc 签名**（`-`）。

有关 dev 运行模式、签名标志和 Team ID 故障排除，请参阅 macOS 应用 README：
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **注意**：Ad-hoc 签名的应用可能触发安全提示。如果应用立即崩溃并显示"Abort trap 6"，请参阅 [故障排除](#故障排除) 部分。

## 3. 安装 CLI

macOS 应用期望一个全局 `openclaw` CLI 安装来管理后台任务。

**安装（推荐）：**

1. 打开 OpenClaw 应用。
2. 进入 **General** settings 选项卡。
3. 点击 **"Install CLI"**。

或者，手动安装：

```bash
npm install -g openclaw@<version>
```

## 故障排除

### 构建失败：工具链或 SDK 不匹配

macOS 应用构建需要最新的 macOS SDK 和 Swift 6.2 工具链。

**系统依赖（必需）：**

- **Software Update 中可用的最新 macOS 版本**（Xcode 26.2 SDK 需要）
- **Xcode 26.2**（Swift 6.2 工具链）

**检查：**

```bash
xcodebuild -version
xcrun swift --version
```

如果版本不匹配，更新 macOS/Xcode 并重新运行构建。

### 授予权限时应用崩溃

如果应用在你尝试允许**语音识别**或**麦克风**访问时崩溃，可能是由于 TCC 缓存损坏或签名不匹配。

**修复：**

1. 重置 TCC 权限：

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 如果失败，暂时更改 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 中的 `BUNDLE_ID` 以强制从 macOS 获得"干净的开始"。

### Gateway 无限期显示"Starting..."

如果 gateway 状态停留在"Starting..."，检查是否有僵尸进程占用端口：

```bash
openclaw gateway status
openclaw gateway stop

# 如果你没有使用 LaunchAgent（dev 模式 / 手动运行），找到监听器：
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

如果手动运行占用了端口，停止该进程（Ctrl+C）。作为最后手段，杀死你在上面找到的 PID。
