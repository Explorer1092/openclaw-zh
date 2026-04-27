---
mmh3_hash: "44423d2d0b8e928f4a0f2bb5d0463049"
title: "发布策略"
summary: "发布通道、操作员检查清单、验证套件、版本命名和发布节奏"
read_when:
  - 查找公开发布通道定义
  - 运行发布验证或包验收
  - 查找版本命名和发布节奏
---

OpenClaw 有三个公开发布通道：

- stable：带标签版本，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
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
- 每次 stable OpenClaw 发布都同时发布 npm 包和 macOS 应用；beta 发布通常先验证并发布 npm/包路径，mac 应用的构建/签名/公证保留用于 stable，除非明确请求

## 发布节奏

- 发布先走 beta 通道
- 只有在最新 beta 经过验证后，stable 才会跟进
- 维护者通常从基于当前 `main` 创建的 `release/YYYY.M.D` 分支发布，以便发布验证和修复不会阻塞 `main` 上的新开发
- 如果 beta 标签已推送或发布后需要修复，维护者会发布下一个 `-beta.N` 标签，而不是删除或重新创建旧的 beta 标签
- 详细的发布流程、审批、凭据和恢复说明仅供维护者使用

## 发布操作员检查清单

此检查清单是发布流程的公开形态。私有凭据、签名、公证、dist-tag 恢复和紧急回滚详情保留在仅维护者可见的发布手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，并确认当前 `main` CI 足够绿色可以从中分支。
2. 使用 `/changelog` 从真实提交历史重写 `CHANGELOG.md` 顶部章节，保持条目面向用户，提交并推送，在分支前再次 rebase/pull。
3. 审查 `src/plugins/compat/registry.ts` 和 `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有当升级路径仍然覆盖时才删除过期的兼容性，或者记录为何有意保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上进行正常的发布工作。
5. 为预期标签更新每个必需的版本位置，然后运行本地确定性预检：`pnpm check:test-types`、`pnpm check:architecture`、`pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，可以使用完整的 40 字符发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 为发布分支、标签或完整提交 SHA 启动所有发布前测试。这是四个大型发布测试套件的唯一手动入口点：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复并重新运行能证明修复有效的最小失败文件、通道、工作流任务、包配置文件、Provider 或模型允许列表。只有当变更的范围使之前的证据失效时才重新运行完整伞形工作流。
9. 对于 beta，打标签 `vYYYY.M.D-beta.N`，使用 npm dist-tag `beta` 发布，然后针对已发布的 `openclaw@YYYY.M.D-beta.N` 或 `openclaw@beta` 包运行发布后包验收。如果已推送或发布的 beta 需要修复，发布下一个 `-beta.N`；不要删除或重写旧的 beta。
10. 对于 stable，只有在经过验证的 beta 或发布候选具有所需验证证据后才继续。Stable npm 发布通过 `preflight_run_id` 复用成功的预检产物；stable macOS 发布准备还需要打包的 `.zip`、`.dmg`、`.dSYM.zip` 和 `main` 上更新的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器、可选的独立已发布 npm Telegram E2E（当需要发布后 Channel 证明时）、必要时的 dist-tag 推广、来自完整匹配 `CHANGELOG.md` 章节的 GitHub 发布/预发布说明，以及发布公告步骤。

## 发布前检查

- 在发布预检前运行 `pnpm check:test-types`，使测试 TypeScript 在更快的本地 `pnpm check` 关卡之外保持覆盖
- 在发布预检前运行 `pnpm check:architecture`，使更广泛的导入循环和架构边界检查在更快的本地关卡之外保持绿色
- 在运行 `pnpm release:check` 前先运行 `pnpm build && pnpm ui:build`，以确保预期的 `dist/*` 发布产物和 Control UI 包在打包验证步骤中存在
- 在发布审批前运行手动 `Full Release Validation` 工作流以从一个入口点启动所有发布前测试套件。它接受分支、标签或完整提交 SHA，分派手动 `CI`，并分派 `OpenClaw Release Checks` 用于安装烟雾测试、包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab 同等性、Matrix 和 Telegram 通道。只有在包发布后且发布后 Telegram E2E 也应运行时才提供 `npm_telegram_package_spec`。示例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当您想要在发布工作继续进行的同时获得包候选的旁路证明时，运行手动 `Package Acceptance` 工作流。使用 `source=npm` 用于 `openclaw@beta`、`openclaw@latest` 或精确发布版本；`source=ref` 使用当前 `workflow_ref` 工具包打包可信的 `package_ref` 分支/标签/SHA；`source=url` 用于带有所需 SHA-256 的 HTTPS tarball；或 `source=artifact` 用于由另一个 GitHub Actions 运行上传的 tarball。工作流将候选解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可以使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一 tarball 运行 Telegram QA。示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`，常用配置文件：
  - `smoke`：安装/Channel/Agent、Gateway 网络和配置重新加载通道
  - `package`：不含 OpenWebUI 或实时 ClawHub 的产物原生包/更新/插件通道
  - `product`：包配置文件加 MCP Channels、cron/子Agent 清理、OpenAI web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径块
  - `custom`：用于专注重新运行的精确 `docker_lanes` 选择
- 仅当您只需要发布候选的确定性正常测试图时，直接运行手动 `CI` 工作流。手动 CI 分派绕过变更范围限制，强制执行 Linux Node 分片、捆绑插件分片、Channel 合约、Node 22 兼容性、`check`、`check-additional`、构建烟雾测试、文档检查、Python skills、Windows、macOS、Android 和 Control UI i18n 通道。示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器对 QA Lab 进行测试，并在不需要 Opik、Langfuse 或其他外部收集器的情况下验证导出的 trace span 名称、有界属性和内容/标识符编辑。
- 在每次带标签发布之前运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：`OpenClaw Release Checks`
- `OpenClaw Release Checks` 还在发布审批前运行 QA Lab mock 同等性关卡加上快速实时 Matrix 配置文件和 Telegram QA 通道。实时通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭据租约。当您想要并行进行完整的 Matrix 传输、媒体和 E2EE 清单时，使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
- 跨 OS 安装和升级运行时验证是公开的 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们直接调用可复用工作流 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种分离是有意为之：保持真实 npm 发布路径简短、确定性且以产物为中心，而较慢的实时检查保留在各自的通道中，以免拖延或阻塞发布
- 包含 Secret 的发布检查应通过 `Full Release Validation` 分派，或从 `main`/发布工作流引用分派，以使工作流逻辑和密钥保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析的提交可从 OpenClaw 分支或发布标签访问
- `OpenClaw NPM Release` 仅验证预检也接受当前完整的 40 字符工作流分支提交 SHA，无需推送标签
- 该 SHA 路径仅用于验证，不能升级为真实发布
- 在 SHA 模式下，工作流仅为包元数据检查合成 `v<package.json version>`；真实发布仍需要真实的发布标签
- 两个工作流都将真实发布和推广路径保留在 GitHub 托管的运行器上，而非变更的验证路径可以使用更大的 Blacksmith Linux 运行器
- 该工作流运行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥
- npm 发布预检不再等待单独的发布检查通道
- 在审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或匹配的 beta/修正标签）
- npm 发布后，运行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或匹配的 beta/修正版本）在新的临时前缀中验证已发布的注册表安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` 使用共享的租用 Telegram 凭据池针对已发布的 npm 包验证已安装包的引导、Telegram 设置和真实 Telegram E2E。本地维护者一次性操作可以省略 Convex 变量并直接传递三个 `OPENCLAW_QA_TELEGRAM_*` 环境凭据。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流从 GitHub Actions 运行相同的发布后检查。它有意仅为手动触发，不在每次合并时运行。
- 维护者发布自动化现在使用预检-然后推广流程：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分派
  - stable npm 发布默认使用 `beta`
  - stable npm 发布可以通过工作流输入明确指定 `latest`
  - 基于 Token 的 npm dist-tag 修改现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 以确保安全，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证
  - 真实的私有 Mac 发布必须通过成功的私有 Mac `preflight_run_id` 和 `validate_run_id`
  - 真实的发布路径推广已准备好的产物，而不是重新构建
- 对于 `YYYY.M.D-N` 这样的 stable 修正发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同临时前缀升级路径，这样发布修正就不会悄悄地让旧的全局安装停留在基础 stable 版本上
- npm 发布预检在 tarball 不包含 `dist/control-ui/index.html` 和非空 `dist/control-ui/assets/` 有效负载时关闭失败，这样我们就不会再次发布空浏览器仪表板
- 发布后验证还检查已发布的注册表安装是否在根 `dist/*` 布局下包含非空的捆绑插件运行时依赖。发布了缺失或空捆绑插件依赖有效负载的版本会使发布后验证器失败，无法推广到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，以便安装器 e2e 在发布路径之前捕获意外的包大小膨胀
- 如果发布工作涉及 CI 规划、扩展时间清单或扩展测试矩阵，在审批前从 `.github/workflows/ci.yml` 重新生成并检查规划器拥有的 `checks-node-extensions` 工作流矩阵输出，以便发布说明不描述过时的 CI 布局
- Stable macOS 发布准备还包括更新器界面：
  - GitHub 发布最终必须包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后 `main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包的应用必须保留非调试包 ID、非空 Sparkle feed URL，以及对于该发布版本等于或高于规范 Sparkle 构建底限的 `CFBundleVersion`

## 发布测试套件

`Full Release Validation` 是操作员从一个入口点启动所有发布前测试的方式。从受信任的 `main` 工作流引用运行，并将发布分支、标签或完整提交 SHA 作为 `ref` 传递：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both
```

工作流解析目标引用，使用 `target_ref=<release-ref>` 分派手动 `CI`，分派 `OpenClaw Release Checks`，并在设置 `npm_telegram_package_spec` 时可选地分派独立的发布后 Telegram E2E。`OpenClaw Release Checks` 然后展开安装烟雾测试、跨 OS 发布检查、实时/E2E Docker 发布路径覆盖、带 Telegram 包 QA 的 Package Acceptance、QA Lab 同等性、实时 Matrix 和实时 Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 都成功，且任何可选的 `npm_telegram` 子项要么成功要么有意跳过时，完整运行才是可接受的。

根据发布阶段使用以下变体：

```bash
# 验证未发布的发布候选分支。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both

# 验证精确的已推送提交。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both

# 发布 beta 后，添加已发布包的 Telegram E2E。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要在专注修复后将完整伞形工作流作为第一次重新运行。如果一个套件失败，对下一次证明使用失败的子工作流、任务、Docker 通道、包配置文件、模型 Provider 或 QA 通道。只有当修复更改了共享发布编排或使之前的全套证据失效时，才再次运行完整伞形工作流。

### Vitest

Vitest 套件是手动 `CI` 子工作流。手动 CI 有意绕过变更范围限制，强制执行发布候选的正常测试图：Linux Node 分片、捆绑插件分片、Channel 合约、Node 22 兼容性、`check`、`check-additional`、构建烟雾测试、文档检查、Python skills、Windows、macOS、Android 和 Control UI i18n。

使用此套件回答"源代码树是否通过了完整的正常测试套件？"它与发布路径产品验证不同。需要保留的证据：

- `Full Release Validation` 摘要显示分派的 `CI` 运行 URL
- `CI` 在精确目标 SHA 上绿色
- 调查回归时 CI 任务中失败或慢速的分片名称
- 运行需要性能分析时的 Vitest 时间产物（如 `.artifacts/vitest-shard-timings.json`）

仅当发布需要确定性正常 CI 而不需要 Docker、QA Lab、实时、跨 OS 或包套件时，直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 套件通过 `openclaw-live-and-e2e-checks-reusable.yml` 存在于 `OpenClaw Release Checks` 中，以及发布模式的 `install-smoke` 工作流。它通过打包的 Docker 环境而不仅仅是源级测试来验证发布候选。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装烟雾测试的完整安装烟雾测试
- 仓库 E2E 通道
- 发布路径 Docker 块：`core`、`package-update` 和 `plugins-integrations`
- 请求时在 `plugins-integrations` 块中进行 OpenWebUI 覆盖
- 在 `plugins-integrations` 内部拆分捆绑 Channel 依赖通道，而不是串行的全合一捆绑 Channel 通道
- 当发布检查包含实时套件时，实时/E2E Provider 套件和 Docker 实时模型覆盖

重新运行之前使用 Docker 产物。发布路径调度器上传 `.artifacts/docker-tests/`，包含通道日志、`summary.json`、`failures.json`、阶段时间、调度器计划 JSON 和重新运行命令。对于专注恢复，在可复用的实时/E2E 工作流上使用 `docker_lanes=<lane[,lane]>` 而不是重新运行所有发布块。生成的重新运行命令在可用时包含之前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败的通道可以复用相同的 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 套件也是 `OpenClaw Release Checks` 的一部分。它是 Agent 行为和 Channel 级别的发布关卡，与 Vitest 和 Docker 包机制分离。

发布 QA Lab 覆盖包括：

- 使用 Agent 同等性包将 OpenAI 候选通道与 Opus 4.6 基准进行比较的 mock 同等性关卡
- 使用 `qa-live-shared` 环境的快速实时 Matrix QA 配置文件
- 使用 Convex CI 凭据租约的实时 Telegram QA 通道
- 当发布遥测需要明确本地证明时的 `pnpm qa:otel:smoke`

使用此套件回答"发布在 QA 场景和实时 Channel 流中是否表现正确？"在审批发布时保留同等性、Matrix 和 Telegram 通道的产物 URL。完整 Matrix 覆盖仍作为手动分片 QA-Lab 运行可用，而不是默认的发布关键通道。

### Package

Package 套件是可安装产品的关卡。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支持。解析器将候选规范化为 Docker E2E 使用的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并将工作流工具包引用与包源引用分开。

支持的候选源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` 工具包打包可信的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载带有所需 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用由另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=ref`、`package_ref=<release-ref>`、`suite_profile=package` 和 `telegram_mode=mock-openai` 运行 Package Acceptance。该配置文件覆盖安装、更新、通过离线插件固件的插件包合约，以及针对相同解析 tarball 的 Telegram 包 QA。它是之前需要 Parallels 的大多数包/更新覆盖的 GitHub 原生替代。跨 OS 发布检查对于 OS 特定的引导、安装器和平台行为仍然很重要，但包/更新产品验证应优先使用 Package Acceptance。

遗留包验收宽限期有意设置了时间限制。`2026.4.25` 之前的包可以使用已发布到 npm 的元数据缺口的兼容路径：tarball 中缺少的私有 QA 清单条目、缺少 `gateway install --wrapper`、tarball 派生的 git 固件中缺少补丁文件、缺少持久化的 `update.channel`、遗留插件安装记录位置、缺少市场安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。`2026.4.25` 之后的包必须满足现代包合约；这些相同的缺口会导致发布验证失败。

当发布问题涉及实际可安装包时，使用更广泛的 Package Acceptance 配置文件：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

常用包配置文件：

- `smoke`：快速包安装/Channel/Agent、Gateway 网络和配置重新加载通道
- `package`：不含实时 ClawHub 的安装/更新/插件包合约；这是发布检查默认值
- `product`：`package` 加 MCP Channels、cron/子Agent 清理、OpenAI web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径块
- `custom`：用于专注重新运行的精确 `docker_lanes` 列表

对于包候选 Telegram 证明，在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。工作流将解析的 `package-under-test` tarball 传递到 Telegram 通道；独立 Telegram 工作流仍然接受已发布的 npm 规范用于发布后检查。

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下操作员控制的输入：

- `tag`：必需的发布标签，如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前完整的 40 字符工作流分支提交 SHA 用于纯验证预检
- `preflight_only`：`true` 仅用于验证/构建/打包，`false` 用于真实发布路径
- `preflight_run_id`：在真实发布路径上必需，以便工作流重用来自成功预检运行的已准备 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。包含 Secret 的检查要求解析的提交可从 OpenClaw 分支或发布标签访问。

规则：

- Stable 和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有当 `preflight_only=true` 时才允许完整提交 SHA 输入
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的相同 `npm_dist_tag`；工作流在发布继续之前验证该元数据

## Stable npm 发布流程

在进行 stable npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，您可以使用当前完整的工作流分支提交 SHA 进行预检工作流的纯验证演练
2. 对于正常的 beta 优先流程选择 `npm_dist_tag=beta`，或仅在明确想要直接 stable 发布时选择 `latest`
3. 当您想要从一个手动工作流获得正常 CI 加实时提示缓存、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果您有意只需要确定性正常测试图，改为在发布引用上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，使用 `preflight_only=false`、相同的 `tag`、相同的 `npm_dist_tag` 和已保存的 `preflight_run_id`
7. 如果发布落在 `beta` 上，使用私有 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 工作流将该 stable 版本从 `beta` 推广到 `latest`
8. 如果发布有意直接发布到 `latest`，而 `beta` 应该立即跟随相同的 stable 构建，使用该相同的私有工作流将两个 dist-tag 都指向 stable 版本，或者让其计划的自愈同步稍后移动 `beta`

dist-tag 修改位于私有仓库中以确保安全，因为它仍然需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布。

这样使直接发布路径和 beta 优先推广路径都有文档记录且对操作员可见。

如果维护者必须回退到本地 npm 身份验证，仅在专用 tmux Session 中运行任何 1Password CLI（`op`）命令。不要直接从主 Agent Shell 调用 `op`；将其保存在 tmux 中可以使提示、警报和 OTP 处理可观察，并防止重复的主机警报。

## 公开参考

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私有发布文档进行实际操作手册。

## 相关

- [发布通道](/install/development-channels)
