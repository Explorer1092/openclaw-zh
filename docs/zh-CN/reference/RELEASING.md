---
read_when:
  - 查找公开发布渠道的定义
  - 查找版本命名与发布节奏
summary: 公开发布渠道、版本命名与发布节奏
title: 发布策略
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: e316161b6997d3c3f56fecb8c9a744582bfc511701bee9b10081edc8cb2a26b4
  source_path: reference/RELEASING.md
  workflow: 15
---

# 发布策略

OpenClaw 有三个公开发布渠道：

- stable：带标签的正式发布，发布到 npm `latest`，并将相同版本同步到 `beta`（除非 `beta` 已指向更新的预发布版本）
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 分支的最新提交

## 版本命名

- 正式发布版本号：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 正式修正版本号：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本号：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月份和日期不补零
- `latest` 表示当前 npm 正式发布版本
- `beta` 表示当前 beta 安装目标，可能指向活跃的预发布版本或最新已提升的 stable 构建
- stable 和 stable 修正版本发布到 npm `latest`，提升后还会将 npm `beta` 重新打标到同一非 beta 版本（除非 `beta` 已指向更新的预发布版本）
- 每个 OpenClaw 版本同时发布 npm 包和 macOS 应用

## 发布节奏

- 发布遵循 beta 优先原则
- 仅在最新的 beta 版本验证通过后才会发布正式版本
- 详细的发布流程、审批、凭证和恢复说明仅限维护者查阅

## 发布前检查

- 运行 `pnpm build` 后再运行 `pnpm release:check`，以确保预期的 `dist/*` 发布产物存在以供打包验证步骤使用
- 每次带标签发布前运行 `pnpm release:check`
- 在审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或对应的 beta/修正标签）
- npm 发布后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或对应的 beta/修正版本）在全新的临时前缀中验证已发布的注册表安装路径
- 对于 `YYYY.M.D-N` 等 stable 修正版本，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同临时前缀升级路径，确保发布修正不会让旧版全局安装静默保留在基础 stable 有效载荷上
- npm 发布前检查如果 tarball 不包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 有效载荷，则会以失败结束，以防再次发布空浏览器仪表板
- stable macOS 发布就绪还包括更新器界面：
  - GitHub Release 必须最终包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后 `main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包的应用必须保留非调试 bundle id、非空的 Sparkle feed URL，以及 `CFBundleVersion` 不低于该发布版本的规范 Sparkle 构建下限

## 公开参考

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私有发布文档作为实际操作手册。
