---
title: "发布检查清单 (npm + macOS)"
sidebarTitle: "发布检查清单"
mmh3_hash: "36b7e9d4f02b8dd22a8140f811927a83"
summary: "npm + macOS 应用的逐步发布检查清单"
read_when: ["发布新的 npm 版本","发布新的 macOS 应用版本","在发布前验证元数据"]
---

# 发布检查清单 (npm + macOS)

从仓库根目录使用 `pnpm`(Node 22+)。在标记/发布之前保持工作树干净。

## 操作员触发
当操作员说"release"时,立即执行此飞行前检查(除非被阻止,否则无需额外问题):
- 阅读本文档和 `docs/platforms/mac/release.md`。
- 从 `~/.profile` 加载环境并确认已设置 `SPARKLE_PRIVATE_KEY_FILE` + App Store Connect 变量(SPARKLE_PRIVATE_KEY_FILE 应该存在于 `~/.profile` 中)。
- 如果需要,从 `~/Library/CloudStorage/Dropbox/Backup/Sparkle` 使用 Sparkle 密钥。

1) **版本和元数据**
- [ ] 提升 `package.json` 版本(例如 `2026.1.29`)。
- [ ] 运行 `pnpm plugins:sync` 以对齐扩展包版本 + changelog。
- [ ] 更新 CLI/版本字符串: [`src/cli/program.ts`](https://github.com/openclaw/openclaw/blob/main/src/cli/program.ts) 和 [`src/provider-web.ts`](https://github.com/openclaw/openclaw/blob/main/src/provider-web.ts) 中的 Baileys 用户代理。
- [ ] 确认包元数据(名称、描述、仓库、关键字、许可证),`bin` 映射指向 [`openclaw.mjs`](https://github.com/openclaw/openclaw/blob/main/openclaw.mjs) 用于 `openclaw`。
- [ ] 如果依赖项更改,运行 `pnpm install` 以便 `pnpm-lock.yaml` 是最新的。

2) **构建和工件**
- [ ] 如果 A2UI 输入更改,运行 `pnpm canvas:a2ui:bundle` 并提交任何更新的 [`src/canvas-host/a2ui/a2ui.bundle.js`](https://github.com/openclaw/openclaw/blob/main/src/canvas-host/a2ui/a2ui.bundle.js)。
- [ ] `pnpm run build`(重新生成 `dist/`)。
- [ ] 验证 npm 包 `files` 包括所有必需的 `dist/*` 文件夹(特别是 `dist/node-host/**` 和 `dist/acp/**` 用于无头节点 + ACP CLI)。
- [ ] 确认 `dist/build-info.json` 存在并包括预期的 `commit` 哈希(CLI 横幅在 npm 安装时使用此哈希)。
- [ ] 可选: 构建后 `npm pack --pack-destination /tmp`;检查 tarball 内容并保留它用于 GitHub 发布(**不要**提交它)。

3) **Changelog 和文档**
- [ ] 使用面向用户的亮点更新 `CHANGELOG.md`(如果缺失则创建文件);严格按版本降序保留条目。
- [ ] 确保 README 示例/标志与当前 CLI 行为匹配(特别是新命令或选项)。

4) **验证**
- [ ] `pnpm lint`
- [ ] `pnpm test`(或 `pnpm test:coverage` 如果需要覆盖率输出)
- [ ] `pnpm run build`(测试后的最后健全性检查)
- [ ] `pnpm release:check`(验证 npm pack 内容)
- [ ] `OPENCLAW_INSTALL_SMOKE_SKIP_NONROOT=1 pnpm test:install:smoke`(Docker 安装冒烟测试,快速路径;发布前必需)
  - 如果上一个 npm 发布已知损坏,为预安装步骤设置 `OPENCLAW_INSTALL_SMOKE_PREVIOUS=<last-good-version>` 或 `OPENCLAW_INSTALL_SMOKE_SKIP_PREVIOUS=1`。
- [ ] (可选)完整安装程序冒烟(添加 non-root + CLI 覆盖): `pnpm test:install:smoke`
- [ ] (可选)安装程序 E2E(Docker,运行 `curl -fsSL https://openclaw.bot/install.sh | bash`,引导,然后运行真实工具调用):
  - `pnpm test:install:e2e:openai`(需要 `OPENAI_API_KEY`)
  - `pnpm test:install:e2e:anthropic`(需要 `ANTHROPIC_API_KEY`)
  - `pnpm test:install:e2e`(需要两个密钥;运行两个提供程序)
- [ ] (可选)如果您的更改影响发送/接收路径,抽查 web 网关。

5) **macOS 应用(Sparkle)**
- [ ] 构建 + 签名 macOS 应用,然后压缩以进行分发。
- [ ] 生成 Sparkle appcast(通过 [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh) 的 HTML 注释)并更新 `appcast.xml`。
- [ ] 保留应用 zip(和可选的 dSYM zip)以附加到 GitHub 发布。
- [ ] 遵循 [macOS 发布](/platforms/mac/release) 了解确切的命令和所需的环境变量。
  - `APP_BUILD` 必须是数字 + 单调(无 `-beta`),以便 Sparkle 正确比较版本。
  - 如果公证,使用从 App Store Connect API 环境变量创建的 `openclaw-notary` 钥匙串配置文件(参见 [macOS 发布](/platforms/mac/release))。

6) **发布(npm)**
- [ ] 确认 git 状态干净;根据需要提交和推送。
- [ ] 如果需要,`npm login`(验证 2FA)。
- [ ] `npm publish --access public`(对预发布使用 `--tag beta`)。
- [ ] 验证注册表: `npm view openclaw version`、`npm view openclaw dist-tags` 和 `npx -y openclaw@X.Y.Z --version`(或 `--help`)。

### 故障排除(来自 2.0.0-beta2 发布的注释)
- **npm pack/publish 挂起或生成巨大的 tarball**: `dist/OpenClaw.app` 中的 macOS 应用捆绑包(和发布 zip)被扫入包中。通过 `package.json` `files` 白名单发布内容来修复(包括 dist 子目录、docs、skills;排除应用捆绑包)。使用 `npm pack --dry-run` 确认未列出 `dist/OpenClaw.app`。
- **npm auth web loop for dist-tags**: 使用遗留身份验证以获取 OTP 提示:
  - `NPM_CONFIG_AUTH_TYPE=legacy npm dist-tag add openclaw@X.Y.Z latest`
- **`npx` 验证失败,显示 `ECOMPROMISED: Lock compromised`**: 使用新缓存重试:
  - `NPM_CONFIG_CACHE=/tmp/npm-cache-$(date +%s) npx -y openclaw@X.Y.Z --version`
- **在后期修复后需要重新指向标记**: 强制更新和推送标记,然后确保 GitHub 发布资产仍然匹配:
  - `git tag -f vX.Y.Z && git push -f origin vX.Y.Z`

7) **GitHub 发布 + appcast**
- [ ] 标记和推送: `git tag vX.Y.Z && git push origin vX.Y.Z`(或 `git push --tags`)。
- [ ] 为 `vX.Y.Z` 创建/刷新 GitHub 发布,**标题为 `openclaw X.Y.Z`**(不仅仅是标记);正文应包括该版本的**完整** changelog 部分(亮点 + 更改 + 修复),内联(无裸链接),并且**不得在正文中重复标题**。
- [ ] 附加工件: `npm pack` tarball(可选)、`OpenClaw-X.Y.Z.zip` 和 `OpenClaw-X.Y.Z.dSYM.zip`(如果生成)。
- [ ] 提交更新的 `appcast.xml` 并推送(Sparkle 从 main 提供)。
- [ ] 从干净的临时目录(无 `package.json`),运行 `npx -y openclaw@X.Y.Z send --help` 以确认安装/CLI 入口点工作。
- [ ] 宣布/分享发布说明。

## 插件发布范围(npm)

我们仅在 `@openclaw/*` 范围下发布**现有的 npm 插件**。不在 npm 上的捆绑插件保持**仅磁盘树**(仍在 `extensions/**` 中发布)。

派生列表的过程:
1) `npm search @openclaw --json` 并捕获包名称。
2) 与 `extensions/*/package.json` 名称比较。
3) 仅发布**交集**(已在 npm 上)。

当前 npm 插件列表(根据需要更新):
- @openclaw/bluebubbles
- @openclaw/diagnostics-otel
- @openclaw/discord
- @openclaw/lobster
- @openclaw/matrix
- @openclaw/msteams
- @openclaw/nextcloud-talk
- @openclaw/nostr
- @openclaw/voice-call
- @openclaw/zalo
- @openclaw/zalouser

发布说明还必须指出**默认情况下未启用**的**新可选捆绑插件**(示例: `tlon`)。
