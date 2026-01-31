---
mmh3_hash: "174d1fc5b78905cf7485a7716d1d7b25"
summary: "OpenClaw macOS 发布清单(Sparkle feed、打包、签名)"
read_when:
  - 剪切或验证 OpenClaw macOS 发布
  - 更新 Sparkle appcast 或 feed 资源
---

# OpenClaw macOS 发布(Sparkle)

此应用现在提供 Sparkle 自动更新。发布版本必须经过 Developer ID 签名、
压缩并使用签名的 appcast 条目发布。

## 前置条件
- 已安装 Developer ID Application 证书(示例:`Developer ID Application: <Developer Name> (<TEAMID>)`)。
- 在环境中将 Sparkle 私钥路径设置为 `SPARKLE_PRIVATE_KEY_FILE`(指向你的 Sparkle ed25519 私钥的路径;公钥烘焙到 Info.plist 中)。如果缺失,请检查 `~/.profile`。
- 如果你想要 Gatekeeper 安全的 DMG/zip 分发,请为 `xcrun notarytool` 提供公证凭据(钥匙串配置文件或 API 密钥)。
  - 我们使用名为 `openclaw-notary` 的钥匙串配置文件,从你的 shell 配置文件中的 App Store Connect API 密钥环境变量创建:
    - `APP_STORE_CONNECT_API_KEY_P8`、`APP_STORE_CONNECT_KEY_ID`、`APP_STORE_CONNECT_ISSUER_ID`
    - `echo "$APP_STORE_CONNECT_API_KEY_P8" | sed 's/\n/
/g' > /tmp/openclaw-notary.p8`
    - `xcrun notarytool store-credentials "openclaw-notary" --key /tmp/openclaw-notary.p8 --key-id "$APP_STORE_CONNECT_KEY_ID" --issuer "$APP_STORE_CONNECT_ISSUER_ID"`
- 已安装 `pnpm` 依赖项(`pnpm install --config.node-linker=hoisted`)。
- Sparkle 工具通过 SwiftPM 在 `apps/macos/.build/artifacts/sparkle/Sparkle/bin/` 自动获取(`sign_update`、`generate_appcast` 等)。

## 构建和打包
注意:
- `APP_BUILD` 映射到 `CFBundleVersion`/`sparkle:version`;保持其数字 + 单调(无 `-beta`),否则 Sparkle 将其比较为相等。
- 默认为当前架构(`$(uname -m)`)。对于发布/通用构建,设置 `BUILD_ARCHS="arm64 x86_64"`(或 `BUILD_ARCHS=all`)。
- 使用 `scripts/package-mac-dist.sh` 用于发布工件(zip + DMG + 公证)。使用 `scripts/package-mac-app.sh` 用于本地/开发打包。

```bash
# 从仓库根目录;设置发布 ID 以启用 Sparkle feed。
# APP_BUILD 必须是数字 + 单调的,以便 Sparkle 比较。
BUNDLE_ID=bot.molt.mac APP_VERSION=2026.1.27-beta.1 APP_BUILD="$(git rev-list --count HEAD)" BUILD_CONFIG=release SIGN_IDENTITY="Developer ID Application: <Developer Name> (<TEAMID>)" scripts/package-mac-app.sh

# 用于分发的 Zip(包括 Sparkle delta 支持的资源分支)
ditto -c -k --sequesterRsrc --keepParent dist/OpenClaw.app dist/OpenClaw-2026.1.27-beta.1.zip

# 可选:还为人类构建一个样式化的 DMG(拖到 /Applications)
scripts/create-dmg.sh dist/OpenClaw.app dist/OpenClaw-2026.1.27-beta.1.dmg

# 推荐:构建 + 公证/装订 zip + DMG
# 首先,创建一次钥匙串配置文件:
#   xcrun notarytool store-credentials "openclaw-notary" #     --apple-id "<apple-id>" --team-id "<team-id>" --password "<app-specific-password>"
NOTARIZE=1 NOTARYTOOL_PROFILE=openclaw-notary BUNDLE_ID=bot.molt.mac APP_VERSION=2026.1.27-beta.1 APP_BUILD="$(git rev-list --count HEAD)" BUILD_CONFIG=release SIGN_IDENTITY="Developer ID Application: <Developer Name> (<TEAMID>)" scripts/package-mac-dist.sh

# 可选:与发布一起发布 dSYM
ditto -c -k --keepParent apps/macos/.build/release/OpenClaw.app.dSYM dist/OpenClaw-2026.1.27-beta.1.dSYM.zip
```

## Appcast 条目
使用发布说明生成器,以便 Sparkle 渲染格式化的 HTML 说明:
```bash
SPARKLE_PRIVATE_KEY_FILE=/path/to/ed25519-private-key scripts/make_appcast.sh dist/OpenClaw-2026.1.27-beta.1.zip https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml
```
从 `CHANGELOG.md` 生成 HTML 发布说明(通过 [`scripts/changelog-to-html.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/changelog-to-html.sh))并将它们嵌入 appcast 条目。
发布时,将更新的 `appcast.xml` 与发布资源(zip + dSYM)一起提交。

## 发布和验证
- 将 `OpenClaw-2026.1.27-beta.1.zip`(和 `OpenClaw-2026.1.27-beta.1.dSYM.zip`)上传到标签 `v2026.1.27-beta.1` 的 GitHub 发布。
- 确保原始 appcast URL 与烘焙的 feed 匹配:`https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml`。
- 健全性检查:
  - `curl -I https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml` 返回 200。
  - 上传资源后,`curl -I <enclosure url>` 返回 200。
  - 在以前的公共构建上,从 About 选项卡运行"Check for Updates…",并验证 Sparkle 干净地安装了新构建。

完成定义:签名的应用 + appcast 已发布,更新流程从旧安装版本工作,
发布资源已附加到 GitHub 发布。
