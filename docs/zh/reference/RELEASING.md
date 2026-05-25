---
mmh3_hash: "6a7b5ce1c971d0229ccfc66fe9a5ebe1"
title: "发布策略"
summary: "发布通道、操作员检查清单、验证套件、版本命名和发布节奏"
read_when:
  - 查找公开发布通道定义
  - 运行发布验证或包验收
  - 查找版本命名和发布节奏
---

OpenClaw 有三个公开发布通道：

- stable：带标签的版本，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
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

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，并确认当前 `main` CI 足够绿色可以从中创建分支。
2. 使用 `/changelog` 从真实提交历史重写 `CHANGELOG.md` 顶部章节，保持条目面向用户，提交并推送，在分支前再次 rebase/pull。
3. 审查 `src/plugins/compat/registry.ts` 和 `src/commands/doctor/shared/deprecation-compat.ts` 中的发布兼容性记录。只有当升级路径仍然覆盖时才删除过期的兼容性，或者记录为何有意保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上进行正常的发布工作。
5. 为预期标签更新每个必需的版本位置，然后运行 `pnpm release:prep`。它按正确顺序刷新插件版本、插件清单、配置 schema、捆绑 Channel 配置元数据、配置文档基线、插件 SDK 导出和插件 SDK API 基线。在打标签前提交所有生成的漂移。然后运行本地确定性预检：`pnpm check:test-types`、`pnpm check:architecture`、`pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签存在之前，允许使用完整的 40 字符发布分支 SHA 进行仅验证预检。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 为发布分支、标签或完整提交 SHA 启动所有发布前测试。这是四个大型发布测试套件（Vitest、Docker、QA Lab 和 Package）的唯一手动入口点。
8. 如果验证失败，在发布分支上修复并重新运行能证明修复有效的最小失败文件、通道、工作流任务、包配置文件、Provider 或模型允许列表。只有当变更的范围使之前的证据失效时才重新运行完整伞形工作流。
9. 对于 beta，打标签 `vYYYY.M.D-beta.N`，然后从匹配的 `release/YYYY.M.D` 分支运行 `pnpm release:candidate -- --tag vYYYY.M.D-beta.N`。该工具运行本地生成发布检查，分派或验证完整发布验证和 npm 预检证据，运行 Parallels 和 Telegram 包验证，记录插件 npm 和 ClawHub 计划，并仅在证据包通过后打印确切的 `OpenClaw Release Publish` 命令。`OpenClaw Release Publish` 将所选或所有可发布插件包并行分派到 npm 和 ClawHub，然后在插件 npm 发布成功后立即使用匹配的 dist-tag 推广已准备好的 OpenClaw npm 预检产物。OpenClaw npm 发布子任务成功后，它会从完整匹配的 `CHANGELOG.md` 章节创建或更新匹配的 GitHub 发布/预发布页面。发布到 npm `latest` 的 stable 版本成为 GitHub latest release；保留在 npm `beta` 的 stable 维护版本以 `latest=false` 创建。工作流还将预检依赖证据作为 `openclaw-<version>-dependency-evidence.zip` 上传到 GitHub 发布页面，用于发布后事件响应。发布工作流立即打印子运行 ID，自动批准工作流令牌被允许批准的发布环境门，汇总失败的子 Job 和日志尾部，在 OpenClaw npm 发布成功后立即关闭 GitHub 发布和依赖证据，在发布 OpenClaw npm 时等待 ClawHub，然后运行 `pnpm release:verify-beta` 并上传 GitHub 发布、npm 包、所选插件 npm 包、所选 ClawHub 包、子工作流运行 ID 和可选 NPM Telegram 运行 ID 的发布后证据。ClawHub 路径会重试临时 CLI 依赖安装失败，即使某个预览单元偶发失败也会发布通过预览的插件，并以对每个预期插件版本进行注册表验证结束，以便部分发布保持可见和可重试。然后针对已发布的 `openclaw@YYYY.M.D-beta.N` 或 `openclaw@beta` 包运行发布后包验收。如果已推送或发布的预发布需要修复，发布下一个匹配的预发布编号；不要删除或重写旧的预发布。
10. 对于 stable，只有在经过验证的 beta 或发布候选具有所需验证证据后才继续。Stable npm 发布也通过 `OpenClaw Release Publish` 进行，通过 `preflight_run_id` 复用成功的预检产物；stable macOS 发布准备还需要打包的 `.zip`、`.dmg`、`.dSYM.zip` 和 `main` 上更新的 `appcast.xml`。私有 macOS 发布工作流在验证发布产物后自动将签名的 appcast 发布到公开 `main`；如果分支保护阻止直接推送，它会打开或更新一个 appcast PR。
11. 发布后，运行 npm 发布后验证器、可选的独立已发布 npm Telegram E2E（当需要发布后 Channel 证明时）、必要时的 dist-tag 推广、验证生成的 GitHub 发布页面，以及发布公告步骤。

## 发布前检查

- 在发布预检前运行 `pnpm check:test-types`，使测试 TypeScript 在更快的本地 `pnpm check` 关卡之外保持覆盖
- 在发布预检前运行 `pnpm check:architecture`，使更广泛的导入循环和架构边界检查在更快的本地关卡之外保持绿色
- 在运行 `pnpm release:check` 前先运行 `pnpm build && pnpm ui:build`，以确保预期的 `dist/*` 发布产物和 Control UI 包在打包验证步骤中存在
- 在版本号更新后和打标签前运行 `pnpm release:prep`。它运行在版本/配置/API 更改后通常会发生漂移的每个确定性发布生成器：插件版本、插件清单、基础配置 schema、捆绑 Channel 配置元数据、配置文档基线、插件 SDK 导出和插件 SDK API 基线。`pnpm release:check` 以检查模式重新运行这些守护程序，并在一次执行中报告它找到的所有生成漂移失败，然后再运行包发布检查。
- 在发布审批前运行手动 `Full Release Validation` 工作流，从一个入口点启动所有发布前测试套件。它接受分支、标签或完整提交 SHA，分派手动 `CI`，并分派 `OpenClaw Release Checks` 用于安装烟雾测试、包验收、跨 OS 包检查、QA Lab 对等性、Matrix 和 Telegram 通道。Stable/默认运行将详尽的实时/E2E 和 Docker 发布路径浸泡测试保留在 `run_release_soak=true` 之后；`release_profile=full` 强制启用浸泡测试。使用 `release_profile=full` 和 `rerun_group=all` 时，它还会针对发布检查的 `release-package-under-test` 产物运行包 Telegram E2E。发布 beta 后提供 `release_package_spec` 以在发布检查、Package Acceptance 和包 Telegram E2E 之间复用已发布的 npm 包，无需重新构建发布 tarball。仅当 Telegram 应使用与发布验证其余部分不同的已发布包时才提供 `npm_telegram_package_spec`。仅当 Package Acceptance 应使用与发布包规范不同的已发布包时才提供 `package_acceptance_package_spec`。仅当私有证据报告应证明验证匹配已发布的 npm 包而不强制运行 Telegram E2E 时才提供 `evidence_package_spec`。示例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当需要在发布工作继续进行的同时获得包候选的旁路证明时，运行手动 `Package Acceptance` 工作流。使用 `source=npm` 用于 `openclaw@beta`、`openclaw@latest` 或精确发布版本；`source=ref` 使用当前 `workflow_ref` 工具包打包可信的 `package_ref` 分支/标签/SHA；`source=url` 用于带有所需 SHA-256 的 HTTPS tarball；或 `source=artifact` 用于由另一个 GitHub Actions 运行上传的 tarball。工作流将候选解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并可以使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 针对同一 tarball 运行 Telegram QA。当所选 Docker 通道包含 `published-upgrade-survivor` 时，包产物是候选，`published_upgrade_survivor_baseline` 选择已发布的基线。`update-restart-auth` 使用候选包同时作为已安装的 CLI 和 package-under-test，以便测试候选更新命令的托管重启路径。示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`。常用配置文件：
  - `smoke`：安装/Channel/Agent、Gateway 网络和配置重新加载通道
  - `package`：不含 OpenWebUI 或实时 ClawHub 的产物原生包/更新/重启/插件通道
  - `product`：包配置文件加 MCP Channel、cron/子 Agent 清理、OpenAI web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径块
  - `custom`：用于专注重新运行的精确 `docker_lanes` 选择
- 仅当只需要发布候选的完整正常 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 分派绕过变更范围限制，强制执行 Linux Node 分片、捆绑插件分片、Channel 合约、Node 22 兼容性、`check`、`check-additional`、构建烟雾测试、文档检查、Python skills、Windows、macOS、Android 和 Control UI i18n 通道。示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它通过本地 OTLP/HTTP 接收器对 QA Lab 进行测试，并在不需要 Opik、Langfuse 或其他外部收集器的情况下验证导出的 trace span 名称、有界属性和内容/标识符编辑。
- 在每次带标签发布之前运行 `pnpm release:check`
- 发布后，使用 `OpenClaw Release Publish` 执行变更性发布序列，标签存在后从 `release/YYYY.M.D`（或发布主分支可达标签时从 `main`）分派，传递发布标签和成功的 OpenClaw npm `preflight_run_id`，并保持默认插件发布范围 `all-publishable`，除非有意进行专注修复。工作流将插件 npm 发布、插件 ClawHub 发布和 OpenClaw npm 发布串行化，以确保核心包不在其外部化插件之前发布。
- 发布检查现在在单独的手动工作流中运行：`OpenClaw Release Checks`
- `OpenClaw Release Checks` 还在发布审批前运行 QA Lab mock 对等性通道加上快速实时 Matrix 配置文件和 Telegram QA 通道。实时通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭据租约。当需要并行进行完整 Matrix 传输、媒体和 E2EE 清单时，使用 `matrix_profile=all` 和 `matrix_shards=true` 运行手动 `QA-Lab - All Lanes` 工作流。
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
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租用 Telegram 凭据池针对已发布的 npm 包验证已安装包的引导、Telegram 设置和真实 Telegram E2E。本地维护者一次性操作可以省略 Convex 变量并直接传递三个 `OPENCLAW_QA_TELEGRAM_*` 环境凭据。
- 要从维护者机器运行完整的发布后 beta 烟雾测试，使用 `pnpm release:beta-smoke -- --beta betaN`。该工具运行 Parallels npm 更新/全新目标验证，分派 `NPM Telegram Beta E2E`，轮询确切的工作流运行，下载产物并打印 Telegram 报告。
- 维护者可以通过手动 `NPM Telegram Beta E2E` 工作流从 GitHub Actions 运行相同的发布后检查。它有意仅为手动触发，不在每次合并时运行。
- 维护者发布自动化现在使用预检-然后推广流程：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支分派
  - stable npm 发布默认使用 `beta`
  - stable npm 发布可以通过工作流输入明确指定 `latest`
  - 基于 Token 的 npm dist-tag 修改现在位于 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 以确保安全，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开 `macOS Release` 仅用于验证；当标签仅存在于发布分支但工作流从 `main` 分派时，设置 `public_release_branch=release/YYYY.M.D`
  - 真实的私有 Mac 发布必须通过成功的私有 Mac `preflight_run_id` 和 `validate_run_id`
  - 真实的发布路径推广已准备好的产物，而不是重新构建
- 对于 `YYYY.M.D-N` 这样的 stable 修正发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同临时前缀升级路径，以确保发布修正不会悄悄地让旧的全局安装停留在基础 stable 版本上
- npm 发布预检在 tarball 不包含 `dist/control-ui/index.html` 和非空 `dist/control-ui/assets/` 有效负载时关闭失败，以确保不会再次发布空浏览器仪表板
- 发布后验证还检查已发布的插件入口点和包元数据是否存在于已安装的注册表布局中。发布了缺失插件运行时有效负载的版本会使发布后验证器失败，无法推广到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，以便安装器 e2e 在发布路径之前捕获意外的包大小膨胀
- 如果发布工作涉及 CI 规划、扩展时间清单或扩展测试矩阵，在审批前从 `.github/workflows/plugin-prerelease.yml` 重新生成并检查规划器拥有的 `plugin-prerelease-extension-shard` 矩阵输出，以便发布说明不描述过时的 CI 布局
- Stable macOS 发布准备还包括更新器界面：
  - GitHub 发布最终必须包含打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后 `main` 上的 `appcast.xml` 必须指向新的 stable zip；私有 macOS 发布工作流会自动提交，或在直接推送被阻止时打开 appcast PR
  - 打包的应用必须保留非调试包 ID、非空 Sparkle feed URL，以及对于该发布版本等于或高于规范 Sparkle 构建底限的 `CFBundleVersion`

## 发布测试套件

`Full Release Validation` 是操作员从一个入口点启动所有发布前测试的方式。对于快速移动分支上的固定提交证明，使用以下工具，以确保每个子工作流都从固定在目标 SHA 的临时分支运行：

```bash
pnpm ci:full-release --sha <full-sha>
```

该工具推送 `release-ci/<sha>-...`，从该分支以 `ref=<sha>` 分派 `Full Release Validation`，验证每个子工作流 `headSha` 与目标匹配，然后删除临时分支。这避免了意外地证明更新的 `main` 子运行。

对于发布分支或标签验证，从受信任的 `main` 工作流引用运行，并将发布分支或标签作为 `ref` 传递：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

工作流解析目标引用，使用 `target_ref=<release-ref>` 分派手动 `CI`，分派 `OpenClaw Release Checks`，为面向包的检查准备父级 `release-package-under-test` 产物，并在 `release_profile=full` 加 `rerun_group=all` 或设置 `release_package_spec` 或 `npm_telegram_package_spec` 时分派独立的包 Telegram E2E。`OpenClaw Release Checks` 然后展开安装烟雾测试、跨 OS 发布检查、启用浸泡时的实时/E2E Docker 发布路径覆盖、带 Telegram 包 QA 的 Package Acceptance、QA Lab 对等性、实时 Matrix 和实时 Telegram。只有当 `Full Release Validation` 摘要显示 `normal_ci` 和 `release_checks` 都成功时，完整运行才是可接受的。在 full/all 模式下，`npm_telegram` 子任务也必须成功；在 full/all 之外，除非提供了已发布的 `release_package_spec` 或 `npm_telegram_package_spec`，否则它会被跳过。最终验证器摘要包含每个子运行的最慢任务表，因此发布管理员无需下载日志即可看到当前关键路径。参见[完整发布验证](/reference/full-release-validation)了解完整阶段矩阵、确切工作流任务名称、stable 与 full 配置文件差异、产物和专注重新运行句柄。子工作流从运行 `Full Release Validation` 的受信任引用（通常是 `--ref main`）分派，即使目标 `ref` 指向较旧的发布分支或标签。没有单独的 Full Release Validation 工作流引用输入；通过选择工作流运行引用来选择受信任的工具包。不要对移动的 `main` 使用 `--ref main -f ref=<sha>` 进行精确提交证明；原始提交 SHA 不能作为工作流分派引用，因此使用 `pnpm ci:full-release --sha <sha>` 创建固定临时分支。

使用 `release_profile` 选择实时/提供商广度：

- `minimum`：最快的发布关键 OpenAI/核心实时和 Docker 路径
- `stable`：minimum 加上 stable 提供商/后端覆盖以供发布审批
- `full`：stable 加上广泛的建议提供商/媒体覆盖

使用 `run_release_soak=true` 配合 `stable`，当发布阻塞通道为绿色且需要详尽的实时/E2E、Docker 发布路径和有界已发布升级幸存者扫描时再升级。该扫描涵盖最新四个 stable 包加上固定的 `2026.4.23` 和 `2026.5.2` 基线加上旧版 `2026.4.15` 覆盖，删除重复基线并将每个基线分片到其自己的 Docker 运行器任务中。`full` 隐含 `run_release_soak=true`。

`OpenClaw Release Checks` 使用受信任的工作流引用将目标引用一次解析为 `release-package-under-test`，并在浸泡运行时将该产物复用于跨 OS、Package Acceptance 和发布路径 Docker 检查中。这确保所有面向包的套件使用相同的字节，避免重复构建包。beta 已在 npm 上发布后，设置 `release_package_spec=openclaw@YYYY.M.D-beta.N`，以便发布检查下载已发布的包一次，从 `dist/build-info.json` 提取其构建源 SHA，并将该产物复用于跨 OS、Package Acceptance、发布路径 Docker 和包 Telegram 通道。跨 OS OpenAI 安装烟雾测试在设置了仓库/组织变量时使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因为此通道旨在证明包安装、引导、Gateway 启动和一次实时 Agent 轮次，而非对最慢默认模型进行基准测试。更广泛的实时提供商矩阵仍然是模型特定覆盖的场所。

根据发布阶段使用以下变体：

```bash
# 验证未发布的发布候选分支。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# 验证精确的已推送提交。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# 发布 beta 后，添加已发布包的 Telegram E2E。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要在专注修复后将完整伞形工作流作为第一次重新运行。如果一个套件失败，对下一次证明使用失败的子工作流、任务、Docker 通道、包配置文件、模型提供商或 QA 通道。只有当修复更改了共享发布编排或使之前的全套证据失效时，才再次运行完整伞形工作流。伞形工作流的最终验证器重新检查记录的子工作流运行 ID，因此在子工作流成功重新运行后，只需重新运行失败的 `Verify full validation` 父任务。

对于有界恢复，将 `rerun_group` 传递给伞形工作流。`all` 是真正的发布候选运行，`ci` 仅运行正常 CI 子任务，`plugin-prerelease` 仅运行发布专用插件子任务，`release-checks` 运行所有发布套件，较窄的发布组有 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。专注的 `npm-telegram` 重新运行需要 `release_package_spec` 或 `npm_telegram_package_spec`；full/all 运行使用 `release_profile=full` 时使用发布检查包产物。专注的跨 OS 重新运行可以添加 `cross_os_suite_filter=windows/packaged-upgrade` 或其他 OS/套件过滤器。QA 发布检查失败是建议性的，但标准运行时工具覆盖率关卡除外，当必需的 OpenClaw 动态工具在标准层摘要中发生漂移或消失时，该关卡会阻断发布验证。

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
- 按目标 SHA 进行根 Dockerfile 烟雾镜像准备/复用，QR、根/Gateway 和安装器/Bun 烟雾任务作为独立安装烟雾分片运行
- 仓库 E2E 通道
- 发布路径 Docker 块：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 到 `plugins-runtime-install-h`
- 请求时在 `plugins-runtime-services` 块中进行 OpenWebUI 覆盖
- 拆分捆绑插件安装/卸载通道 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 当发布检查包含实时套件时，实时/E2E 提供商套件和 Docker 实时模型覆盖

重新运行之前使用 Docker 产物。发布路径调度器上传 `.artifacts/docker-tests/`，包含通道日志、`summary.json`、`failures.json`、阶段时间、调度器计划 JSON 和重新运行命令。对于专注恢复，在可复用的实时/E2E 工作流上使用 `docker_lanes=<lane[,lane]>` 而不是重新运行所有发布块。生成的重新运行命令在可用时包含之前的 `package_artifact_run_id` 和已准备的 Docker 镜像输入，因此失败的通道可以复用相同的 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 套件也是 `OpenClaw Release Checks` 的一部分。它是 Agent 行为和 Channel 级别的发布关卡，与 Vitest 和 Docker 包机制分离。

发布 QA Lab 覆盖包括：

- 使用 Agent 对等性包将 OpenAI 候选通道与 Opus 4.6 基准进行比较的 mock 对等性关卡
- 使用 `qa-live-shared` 环境的快速实时 Matrix QA 配置文件
- 使用 Convex CI 凭据租约的实时 Telegram QA 通道
- 当发布遥测需要明确本地证明时的 `pnpm qa:otel:smoke`

使用此套件回答"发布在 QA 场景和实时 Channel 流中是否表现正确？"在审批发布时保留对等性、Matrix 和 Telegram 通道的产物 URL。完整 Matrix 覆盖仍作为手动分片 QA-Lab 运行可用，而不是默认的发布关键通道。

### Package

Package 套件是可安装产品的关卡。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支持。解析器将候选规范化为 Docker E2E 使用的 `package-under-test` tarball，验证包清单，记录包版本和 SHA-256，并将工作流工具包引用与包源引用分开。

支持的候选源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` 工具包打包可信的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载带有所需 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用由另一个 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、已准备的发布包产物、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update` 和 `telegram_mode=mock-openai` 运行 Package Acceptance。Package Acceptance 保持迁移、更新、配置身份验证更新重启、实时 ClawHub 技能安装、过时插件依赖清理、离线插件固件、插件更新和 Telegram 包 QA 针对相同解析的 tarball。阻塞发布检查使用默认最新已发布包基线；`run_release_soak=true` 或 `release_profile=full` 扩展到从 `2026.4.23` 到 `latest` 的每个 stable npm 已发布基线加上报告问题的固件。对于已发布的候选包使用 `source=npm`，对于发布前的 SHA 支持本地 npm tarball 使用 `source=ref`/`source=artifact`。它是之前需要 Parallels 的大多数包/更新覆盖的 GitHub 原生替代。跨 OS 发布检查对于 OS 特定的引导、安装器和平台行为仍然很重要，但包/更新产品验证应优先使用 Package Acceptance。

更新和插件验证的规范检查清单是[测试更新和插件](/help/testing-updates-plugins)。在决定哪种本地、Docker、Package Acceptance 或发布检查通道能证明插件安装/更新、doctor 清理或已发布包迁移更改时使用它。从每个 stable `2026.4.23+` 包进行详尽的已发布更新迁移是一个独立的手动 `Update Migration` 工作流，不是完整发布 CI 的一部分。

旧版包验收宽限期有意设置了时间限制。`2026.4.25` 之前的包可以使用已发布到 npm 的元数据缺口的兼容路径：tarball 中缺少的私有 QA 清单条目、缺少 `gateway install --wrapper`、tarball 派生的 git 固件中缺少补丁文件、缺少持久化的 `update.channel`、旧版插件安装记录位置、缺少市场安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。已发布的 `2026.4.26` 包可能对已发布的本地构建元数据戳记文件发出警告。之后的包必须满足现代包合约；这些相同的缺口会导致发布验证失败。

当发布问题涉及实际可安装包时，使用更广泛的 Package Acceptance 配置文件：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常用包配置文件：

- `smoke`：快速包安装/Channel/Agent、Gateway 网络和配置重新加载通道
- `package`：安装/更新/重启/插件包合约加实时 ClawHub 技能安装证明；这是发布检查默认值
- `product`：`package` 加 MCP Channel、cron/子 Agent 清理、OpenAI web 搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径块
- `custom`：用于专注重新运行的精确 `docker_lanes` 列表

对于包候选 Telegram 证明，在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。工作流将解析的 `package-under-test` tarball 传递到 Telegram 通道；独立 Telegram 工作流仍然接受已发布的 npm 规范用于发布后检查。

## 发布发布自动化

`OpenClaw Release Publish` 是正常的变更性发布入口点。它按发布所需的顺序编排受信任发布者工作流：

1. 检出发布标签并解析其提交 SHA。
2. 验证标签可从 `main` 或 `release/*` 访问。
3. 运行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 分派 `Plugin NPM Release`。
5. 使用相同范围和 SHA 分派 `Plugin ClawHub Release`。
6. 使用发布标签、npm dist-tag 和已保存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。

Beta 发布示例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

发布到默认 beta dist-tag 的 stable 版本：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

直接升级到 `latest` 的 stable 版本需明确指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

仅对专注修复或重新发布工作使用较低级别的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流。对于选定的插件修复，将 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 传递给 `OpenClaw Release Publish`，或在不能发布 OpenClaw 包时直接分派子工作流。

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下操作员控制的输入：

- `tag`：必需的发布标签，如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前完整的 40 字符工作流分支提交 SHA 用于纯验证预检
- `preflight_only`：`true` 仅用于验证/构建/打包，`false` 用于真实发布路径
- `preflight_run_id`：在真实发布路径上必需，以便工作流重用来自成功预检运行的已准备 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Publish` 接受以下操作员控制的输入：

- `tag`：必需的发布标签；必须已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 预检运行 ID；当 `publish_openclaw_npm=true` 时必需
- `npm_dist_tag`：OpenClaw 包的 npm 目标标签
- `plugin_publish_scope`：默认为 `all-publishable`；仅对专注修复工作使用 `selected`
- `plugins`：当 `plugin_publish_scope=selected` 时，逗号分隔的 `@openclaw/*` 包名
- `publish_openclaw_npm`：默认为 `true`；仅在将工作流用作仅插件修复编排器时设置 `false`

`OpenClaw Release Checks` 接受以下操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。包含 Secret 的检查要求解析的提交可从 OpenClaw 分支或发布标签访问。
- `run_release_soak`：在 stable/默认发布检查上启用详尽的实时/E2E、Docker 发布路径和全量升级幸存者浸泡测试。它由 `release_profile=full` 强制启用。

规则：

- Stable 和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有当 `preflight_only=true` 时才允许完整提交 SHA 输入
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间使用的相同 `npm_dist_tag`；工作流在发布继续之前验证该元数据

## Stable npm 发布流程

在进行 stable npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签存在之前，可以使用当前完整的工作流分支提交 SHA 进行预检工作流的纯验证演练
2. 对于正常的 beta 优先流程选择 `npm_dist_tag=beta`，或仅在明确想要直接 stable 发布时选择 `latest`
3. 当需要从一个手动工作流获得正常 CI 加实时提示缓存、Docker、QA Lab、Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果有意只需要确定性正常测试图，改为在发布引用上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag` 和已保存的 `preflight_run_id` 运行 `OpenClaw Release Publish`；它在升级 OpenClaw npm 包之前将外部化插件发布到 npm 和 ClawHub
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

维护者使用 [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) 中的私有发布文档进行实际操作手册。

## 相关

- [发布通道](/install/development-channels)
