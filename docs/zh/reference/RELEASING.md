---
mmh3_hash: "d5e64dfcd9f4d60cfb3f310dd0de0dc2"
title: "发布策略"
summary: "公开发布渠道、版本命名和发布节奏"
read_when:
  - 查找公开发布渠道定义
  - 查找版本命名和发布节奏
---

# 发布策略

OpenClaw 有三个公开发布通道：

- stable：默认发布到 npm `beta`，或在明确请求时发布到 npm `latest` 的带标签版本
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 分支的移动头

## 版本命名

- Stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- Stable 修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月份或日期不要补零
- `latest` 表示当前已推广的 stable npm 发布版本
- `beta` 表示当前的 beta 安装目标
- Stable 和 stable 修正发布默认发布到 npm `beta`；发布操作员可以明确指定 `latest`，或之后推广经过验证的 beta 构建
- 每个 OpenClaw 发布都同时发布 npm 包和 macOS 应用

## 发布节奏

- 发布先走 beta 通道
- 只有在最新 beta 经过验证后，stable 才会跟进
- 详细的发布流程、审批、凭据和恢复说明仅供维护者使用

## 发布前检查

- 在运行 `pnpm release:check` 前先运行 `pnpm build && pnpm ui:build`，以确保预期的 `dist/*` 发布产物和 Control UI 包在打包验证步骤中存在
- 在每次带标签发布之前运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- 跨 OS 安装和升级运行时验证从私有调用工作流
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  调度，该工作流调用可复用的公开工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种分离是有意为之：保持真实 npm 发布路径简短、
  确定性且以产物为中心，而较慢的实时检查保留在各自的
  通道中，以免拖延或阻塞发布
- 发布检查必须从 `main` 工作流引用调度，以使工作流逻辑和密钥保持规范
- 该工作流接受现有的发布标签或当前完整的 40 字符 `main` 提交 SHA
- 在提交 SHA 模式下，仅接受当前 `origin/main` HEAD；对于较旧的发布提交使用发布标签
- `OpenClaw NPM Release` 纯验证预检也接受当前完整的 40 字符 `main` 提交 SHA，无需推送标签
- 该 SHA 路径仅用于验证，不能升级为真实发布
- 在 SHA 模式下，工作流仅为包元数据检查合成 `v<package.json version>`；真实发布仍需要真实的发布标签
- 两个工作流都将真实发布和推广路径保留在 GitHub 托管的运行器上，而非变更的验证路径可以使用更大的 Blacksmith Linux 运行器
- 该工作流运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，
  使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥
- npm 发布预检不再等待单独的发布检查通道
- 在审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或匹配的 beta/修正标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或匹配的 beta/修正版本）在新的临时前缀中验证已发布的注册表安装路径
- 维护者发布自动化现在使用预检-然后推广流程：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - stable npm 发布默认使用 `beta`
  - stable npm 发布可以通过工作流输入明确指定 `latest`
  - 基于 Token 的 npm dist-tag 修改现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    以确保安全，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证
  - 真实的私有 Mac 发布必须通过成功的私有 Mac `preflight_run_id` 和 `validate_run_id`
  - 真实的发布路径推广已准备好的产物，而不是重新构建
- 对于 `YYYY.M.D-N` 这样的 stable 修正发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同临时前缀升级路径，这样发布修正就不会悄悄地让旧的全局安装停留在基础 stable 版本上
- npm 发布预检在 tarball 不包含 `dist/control-ui/index.html` 和非空 `dist/control-ui/assets/` 有效负载时关闭失败，这样我们就不会再次发布空浏览器仪表板
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，以便安装器 e2e 在发布路径之前捕获意外的包大小膨胀
- 如果发布工作涉及 CI 规划、扩展时间清单或扩展测试矩阵，在审批前从 `.github/workflows/ci.yml` 重新生成并检查规划器拥有的 `checks-node-extensions` 工作流矩阵输出，以便发布说明不描述过时的 CI 布局
- Stable macOS 发布准备还包括更新器界面：
  - GitHub 发布最终必须包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后 `main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包的应用必须保留非调试包 ID、非空 Sparkle feed URL，以及对于该发布版本等于或高于规范 Sparkle 构建底限的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下操作员控制的输入：

- `tag`：必需的发布标签，如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前完整的 40 字符 `main` 提交 SHA 用于纯验证预检
- `preflight_only`：`true` 仅用于验证/构建/打包，`false` 用于真实发布路径
- `preflight_run_id`：在真实发布路径上必需，以便工作流重用来自成功预检运行的已准备 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下操作员控制的输入：

- `ref`：要验证的现有发布标签或当前完整的 40 字符 `main` 提交 SHA

规则：

- Stable 和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 仅当 `preflight_only=true` 时才允许完整提交 SHA 输入
- 发布检查提交 SHA 模式还需要当前 `origin/main` HEAD
- 真实发布路径必须使用预检期间使用的相同 `npm_dist_tag`；工作流在发布继续之前验证该元数据

## Stable npm 发布流程

在进行 stable npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，您可以使用当前完整的 `main` 提交 SHA 进行预检工作流的纯验证演练
2. 对于正常的 beta 优先流程选择 `npm_dist_tag=beta`，或仅在明确想要直接 stable 发布时选择 `latest`
3. 使用相同的标签或完整的当前 `main` 提交 SHA 单独运行 `OpenClaw Release Checks`，以获得实时提示缓存覆盖
   - 这是有意分离的，以便实时覆盖在不将长时间运行或不稳定的检查重新耦合到发布工作流的情况下保持可用
4. 保存成功的 `preflight_run_id`
5. 再次运行 `OpenClaw NPM Release`，使用 `preflight_only=false`、相同的 `tag`、相同的 `npm_dist_tag` 和已保存的 `preflight_run_id`
6. 如果发布落在 `beta` 上，使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流将该 stable 版本从 `beta` 推广到 `latest`
7. 如果发布有意直接发布到 `latest`，而 `beta` 应该立即跟随相同的 stable 构建，使用相同的私有工作流将两个 dist-tag 都指向 stable 版本，或者让其计划的自愈同步稍后移动 `beta`

dist-tag 修改位于私有仓库中以确保安全，因为它仍然需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布。

这样使直接发布路径和 beta 优先推广路径都有文档记录且对操作员可见。

## 公开参考

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私有发布文档进行实际操作手册。
