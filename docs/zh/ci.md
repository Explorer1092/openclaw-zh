---
mmh3_hash: "0d51d0ca37a5ab66ff98a3d77d0b55e2"
title: "CI Pipeline"
summary: "CI 任务图、范围控制门以及本地等效命令"
read_when:
  - 您需要了解 CI 任务为何运行或未运行
  - 您正在调试失败的 GitHub Actions 检查
  - 您正在协调发布验证运行或重新运行
  - 您正在更改 ClawSweeper 调度或 GitHub 活动转发
---

OpenClaw CI 在每次推送到 `main` 和每个 Pull Request 时运行。`preflight` 任务对差异进行分类，并在仅发生不相关区域的变更时关闭昂贵的通道。手动 `workflow_dispatch` 运行会有意绕过智能范围控制，并为发布候选版本和广泛验证展开完整图。Android 通道通过 `include_android` 保持选择性加入。仅发布的插件覆盖存在于单独的 [`Plugin Prerelease`](#plugin-prerelease) 工作流中，仅从 [`Full Release Validation`](#full-release-validation) 或明确的手动调度运行。

## Pipeline 概述

| 任务                              | 用途                                                                                                   | 运行时机                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `preflight`                      | 检测仅文档变更、已变更范围、已变更扩展，并构建 CI 清单                                                   | 始终在非草稿推送和 PR 上运行    |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                                  | 始终在非草稿推送和 PR 上运行    |
| `security-dependency-audit`      | 针对 npm 通告的无依赖生产锁文件审计                                                                     | 始终在非草稿推送和 PR 上运行    |
| `security-fast`                  | 快速安全任务的必要聚合                                                                                  | 始终在非草稿推送和 PR 上运行    |
| `check-dependencies`             | 生产 Knip 仅依赖检查以及未使用文件允许列表守护                                                           | Node 相关变更                  |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查以及可重用的下游产物                                               | Node 相关变更                  |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如捆绑/插件合同/协议检查                                                        | Node 相关变更                  |
| `checks-fast-contracts-channels` | 具有稳定聚合检查结果的分片 Channel 合同检查                                                              | Node 相关变更                  |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括 Channel、捆绑、合同和扩展通道                                                  | Node 相关变更                  |
| `check`                          | 分片主要本地门控等效项：生产类型、lint、守护、测试类型和严格冒烟                                           | Node 相关变更                  |
| `check-additional`               | 架构、分片边界/提示漂移、扩展守护、包边界和 gateway 监视                                                  | Node 相关变更                  |
| `build-smoke`                    | 已构建 CLI 冒烟测试和启动内存冒烟                                                                       | Node 相关变更                  |
| `checks`                         | 已构建产物 Channel 测试的验证器                                                                         | Node 相关变更                  |
| `checks-node-compat-node22`      | Node 22 兼容性构建和冒烟通道                                                                            | 发布的手动 CI 调度              |
| `check-docs`                     | 文档格式化、lint 和断链检查                                                                             | 文档变更                       |
| `skills-python`                  | Python 支持 Skill 的 Ruff + pytest                                                                     | Python Skill 相关变更           |
| `checks-windows`                 | Windows 特定进程/路径测试以及共享运行时导入说明符回归                                                    | Windows 相关变更                |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                            | macOS 相关变更                  |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                                     | macOS 相关变更                  |
| `android`                        | 两种版本的 Android 单元测试以及一个 debug APK 构建                                                      | Android 相关变更                |
| `test-performance-agent`         | 可信活动后的每日 Codex 慢速测试优化                                                                     | 主 CI 成功或手动调度             |
| `openclaw-performance`           | 具有模拟 Provider、深度分析和 GPT 5.4 实时通道的每日/按需 Kova 运行时性能报告                            | 计划和手动调度                  |

## 快速失败顺序

1. `preflight` 决定哪些通道存在。`docs-scope` 和 `changed-scope` 逻辑是此任务中的步骤，而不是独立任务。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 快速失败，无需等待较重的产物和平台矩阵任务。
3. `build-artifacts` 与快速 Linux 通道重叠，因此下游消费者可以在共享构建准备好后立即开始。
4. 较重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

当更新的推送落在同一 PR 或 `main` ref 上时，GitHub 可能将已取代的任务标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍然报告正常的分片失败，但在整个工作流已被取代后不会排队。自动 CI 并发键已版本化（`CI-v7-*`），因此旧队列组中的 GitHub 僵尸无法无限期阻止较新的主运行。手动全套运行使用 `CI-manual-v1-*` 且不取消进行中的运行。

`ci-timings-summary` 任务为每个非草稿 CI 运行上传一个紧凑的 `ci-timings-summary` 产物。它记录当前运行的挂钟时间、队列时间、最慢的任务和失败的任务，因此 CI 健康检查不需要重复抓取完整的 Actions 负载。

## 范围和路由

范围逻辑存在于 `scripts/ci-changed-scope.mjs` 中，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动调度跳过已变更范围检测，并使 preflight 清单表现得好像每个作用域区域都已变更。

- **CI 工作流编辑**验证 Node CI 图以及工作流 lint，但不强制 Windows、Android 或 macOS 原生构建；这些平台通道保持作用于平台源变更。
- **仅 CI 路由编辑、选定的廉价核心测试固件编辑以及狭窄的插件合同辅助/测试路由编辑**使用快速仅 Node 清单路径：`preflight`、安全以及单个 `checks-fast-core` 任务。当变更限于快速任务直接练习的路由或辅助界面时，该路径跳过构建产物、Node 22 兼容性、Channel 合同、完整核心分片、捆绑插件分片和附加守护矩阵。
- **Windows Node 检查**的范围是 Windows 特定进程/路径包装器、npm/pnpm/UI 运行器辅助器、包管理器配置以及执行该通道的 CI 工作流界面；不相关的源、插件、安装冒烟和仅测试变更保留在 Linux Node 通道上。

最慢的 Node 测试系列被拆分或平衡，以使每个任务保持小而不过度保留运行器：Channel 合同作为三个加权 Blacksmith 支持的分片运行，带有标准 GitHub 运行器回退，核心单元快速/支持通道单独运行，核心运行时基础架构在状态、进程/配置、Cron 和共享分片之间拆分，自动回复作为平衡工作者运行（回复子树拆分为 agent 运行器、调度和命令/状态路由分片），以及 agentic gateway/服务器配置跨聊天/认证/模型/http 插件/运行时/启动通道拆分，而不是等待构建产物。广泛的浏览器、QA、媒体和其他插件测试使用其专用的 Vitest 配置，而不是共享的插件全包。包含模式分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和过滤的分片。`check-additional` 将包边界编译/金丝雀工作放在一起，并将运行时拓扑架构与 gateway 监视覆盖分开；边界守护列表跨四个矩阵分片分条，每个分片并发运行选定的独立守护并打印每检查计时。昂贵的 Codex 快乐路径提示快照漂移检查作为手动 CI 和仅提示影响变更的独立附加任务运行，因此正常的不相关 Node 变更不会等待冷提示快照生成，边界分片保持平衡，而提示漂移仍然固定到导致它的 PR；同样的标志跳过内置产物核心支持边界分片中的提示快照 Vitest 生成。Gateway 监视、Channel 测试和核心支持边界分片在 `dist/` 和 `dist-runtime/` 已构建后在 `build-artifacts` 中并发运行。

Android CI 运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方版本没有单独的源集或清单；其单元测试通道仍然使用 SMS/呼叫日志 BuildConfig 标志编译该版本，同时避免在每次 Android 相关推送上重复 debug APK 打包任务。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`（一个生产 Knip 仅依赖检查，固定到最新 Knip 版本，`dlx` 安装禁用 pnpm 的最低发布年龄）和 `pnpm deadcode:unused-files`，它将 Knip 的生产未使用文件发现与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 添加新的未审查的未使用文件或保留陈旧的允许列表条目时，未使用文件守护失败，同时保留 Knip 无法静态解析的有意动态插件、生成的、构建、实时测试和包桥接界面。

## ClawSweeper 活动转发

`.github/workflows/clawsweeper-dispatch.yml` 是从 OpenClaw 仓库活动进入 ClawSweeper 的目标端桥。它不检出或执行不受信任的 Pull Request 代码。工作流从 `CLAWSWEEPER_APP_PRIVATE_KEY` 创建 GitHub App 令牌，然后将紧凑的 `repository_dispatch` 负载调度到 `openclaw/clawsweeper`。

该工作流有四个通道：

- `clawsweeper_item` 用于精确的 Issue 和 Pull Request 审查请求；
- `clawsweeper_comment` 用于 Issue 评论中的明确 ClawSweeper 命令；
- `clawsweeper_commit_review` 用于 `main` 推送上的提交级别审查请求；
- `github_activity` 用于 ClawSweeper agent 可能检查的一般 GitHub 活动。

`github_activity` 通道仅转发规范化元数据：事件类型、操作、执行者、仓库、项目编号、URL、标题、状态以及出现时的评论或审查的简短摘录。它有意避免转发完整的 webhook 正文。`openclaw/clawsweeper` 中的接收工作流是 `.github/workflows/github-activity.yml`，它将规范化事件发布到 ClawSweeper agent 的 OpenClaw Gateway 钩子。

一般活动是观察，而不是默认交付。ClawSweeper agent 在其提示中接收 Discord 目标，并且只应在事件令人惊讶、可操作、有风险或在操作上有用时发布到 `#clawsweeper`。例行开放、编辑、机器人搅动、重复 webhook 噪音和正常审查流量应导致 `NO_REPLY`。

在整个路径中将 GitHub 标题、评论、正文、审查文本、分支名称和提交消息视为不受信任的数据。它们是总结和分类的输入，而不是工作流或 agent 运行时的指令。

## 手动调度

手动 CI 调度运行与正常 CI 相同的任务图，但强制每个非 Android 作用域通道打开：Linux Node 分片、捆绑插件分片、Channel 合同、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skill、Windows、macOS 和 Control UI i18n。独立手动 CI 调度仅在 `include_android=true` 时运行 Android；完整发布伞通过传递 `include_android=true` 启用 Android。插件预发布静态检查、仅发布的 `agentic-plugins` 分片、完整扩展批次扫描和插件预发布 Docker 通道被排除在 CI 之外。Docker 预发布套件仅在 `Full Release Validation` 以启用的发布验证门调度单独的 `Plugin Prerelease` 工作流时运行。

手动运行使用唯一的并发组，因此发布候选完整套件不会被同一 ref 上的另一次推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任的调用者在分支、标签或完整提交 SHA 上运行该图，同时使用来自选定调度 ref 的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 运行器

| 运行器                            | 任务                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`、快速安全任务和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/合同/捆绑检查、分片 Channel 合同检查、除 lint 外的 `check` 分片、`check-additional` 聚合、Node 测试聚合验证器、文档检查、Python Skill、工作流健全性、标记器、自动响应；安装冒烟 preflight 也使用 GitHub 托管的 Ubuntu 以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、低权重扩展分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke、Linux Node 测试分片、捆绑插件测试分片、`check-additional` 分片、`android`                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`、`check-lint`（CPU 敏感到 8 vCPU 花费超过节省）；安装冒烟 Docker 构建（32 vCPU 队列时间花费超过节省）                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；forks 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；forks 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                          |

规范仓库 CI 将 Blacksmith 作为默认运行器路径。在 `preflight` 期间，`scripts/ci-runner-labels.mjs` 检查最近排队和进行中的 Actions 运行，查找排队的 Blacksmith 任务。如果特定 Blacksmith 标签已有排队的任务，则使用该确切标签的下游任务仅在该运行中回退到匹配的 GitHub 托管运行器（`ubuntu-24.04`、`windows-2025` 或 `macos-latest`）。同一 OS 系列中的其他 Blacksmith 大小保持在其主要标签上。如果 API 探测失败，则不应用回退。

## 本地等效命令

```bash
pnpm changed:lanes                            # 检查 origin/main...HEAD 的本地已变更通道分类器
pnpm check:changed                            # 智能本地检查门控：按边界通道更改的类型检查/lint/守护
pnpm check                                    # 快速本地门控：生产 tsgo + 分片 lint + 并行快速守护
pnpm check:test-types
pnpm check:timed                              # 带每阶段计时的相同门控
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest 测试
pnpm test:changed                             # 廉价的智能已变更 Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # 文档格式 + lint + 断链
pnpm build                                    # 当 CI 产物/build-smoke 通道重要时构建 dist
pnpm ci:timings                               # 总结最新的 origin/main 推送 CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 总结挂钟时间、队列时间和最慢的任务
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/评论噪音并选择 origin/main 推送 CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw 性能

`OpenClaw Performance` 是产品/运行时性能工作流。它每天在 `main` 上运行，也可以手动调度：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手动调度通常对工作流 ref 进行基准测试。设置 `target_ref` 以使用当前工作流实现对发布标签或其他分支进行基准测试。发布的报告路径和最新指针以测试的 ref 为键，每个 `index.md` 记录测试的 ref/SHA、工作流 ref/SHA、Kova ref、配置文件、通道认证模式、模型、重复次数和场景过滤器。

工作流从固定发布安装 OCM，从 `openclaw/Kova` 以固定的 `kova_ref` 输入安装 Kova，然后运行三个通道：

- `mock-provider`：针对具有确定性假 OpenAI 兼容认证的本地构建运行时的 Kova 诊断场景。
- `mock-deep-profile`：启动、gateway 和 agent 轮次热点的 CPU/堆/跟踪分析。
- `live-gpt54`：真实的 OpenAI `openai/gpt-5.4` agent 轮次，当 `OPENAI_API_KEY` 不可用时跳过。

模拟 Provider 通道还在 Kova 通道之后运行 OpenClaw 原生源探测：跨默认、钩子和 50 插件启动情况的 gateway 启动计时和内存；重复的模拟 OpenAI `channel-chat-baseline` hello 循环；以及针对已启动 gateway 的 CLI 启动命令。源探测 Markdown 摘要存在于报告包中的 `source/index.md`，旁边有原始 JSON。

每个通道上传 GitHub 产物。当配置了 `CLAWGRIT_REPORTS_TOKEN` 时，工作流还将 `report.json`、`report.md`、捆绑包、`index.md` 和源探测产物提交到 `openclaw/clawgrit-reports`，路径为 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`。当前测试 ref 指针写为 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## Full Release Validation

`Full Release Validation` 是"发布前运行所有内容"的手动伞形工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，调度 `Plugin Prerelease` 进行仅发布插件/包/静态/Docker 证明，并调度 `OpenClaw Release Checks` 进行安装冒烟、包接受、跨 OS 包检查、QA Lab 对等、Matrix 和 Telegram 通道。稳定/默认运行在 `run_release_soak=true` 后面保留详尽的实时/E2E 和 Docker 发布路径覆盖；`release_profile=full` 强制打开该浸泡覆盖，以便广泛的建议验证保持广泛。使用 `rerun_group=all` 和 `release_profile=full`，它还在发布检查的 `release-package-under-test` 产物上针对 `npm_telegram_package_spec` 运行 `NPM Telegram Beta E2E`。发布后，传递 `release_package_spec` 以在发布检查、包接受、Docker、跨 OS 和 Telegram 中重用已发布的 npm 包，而无需重建。仅在 Telegram 必须证明不同包时使用 `npm_telegram_package_spec`。

有关阶段矩阵、确切工作流任务名称、配置文件差异、产物和聚焦重新运行句柄，请参阅[完整发布验证](/reference/full-release-validation)。

`OpenClaw Release Publish` 是手动变更发布工作流。在发布标签存在之后以及 OpenClaw npm preflight 成功之后，从 `release/YYYY.M.D` 或 `main` 调度它。它验证 `pnpm plugins:sync:check`，为所有可发布的插件包调度 `Plugin NPM Release`，为同一发布 SHA 调度 `Plugin ClawHub Release`，然后仅在保存的 `preflight_run_id` 下调度 `OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

对于快速移动分支上的固定提交证明，使用辅助器而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流调度 ref 必须是分支或标签，而不是原始提交 SHA。辅助器在目标 SHA 推送临时 `release-ci/<sha>-...` 分支，从该固定 ref 调度 `Full Release Validation`，验证每个子工作流 `headSha` 与目标匹配，并在运行完成时删除临时分支。当任何子工作流在不同的 SHA 上运行时，伞形验证器也会失败。

`release_profile` 控制传递到发布检查的实时/Provider 广度。手动发布工作流默认为 `stable`；仅在您有意希望广泛建议 Provider/媒体矩阵时使用 `full`。`run_release_soak` 控制稳定/默认发布检查是否运行详尽的实时/E2E 和 Docker 发布路径浸泡；`full` 强制打开浸泡。

- `minimum` 保留最快的 OpenAI/核心发布关键通道。
- `stable` 添加稳定的 Provider/后端集。
- `full` 运行广泛的建议 Provider/媒体矩阵。

伞形记录已调度的子运行 ID，最终的 `Verify full validation` 任务重新检查当前子运行结论并为每个子运行附加最慢任务表。如果子工作流重新运行并变为绿色，只需重新运行父验证器任务以刷新伞形结果和计时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对发布候选使用 `all`，对仅正常完整 CI 子项使用 `ci`，对仅插件预发布子项使用 `plugin-prerelease`，对每个发布子项使用 `release-checks`，或使用更窄的组：伞形上的 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这使得在针对性修复后重新运行失败的发布箱保持有界。对于一个失败的跨 OS 通道，将 `rerun_group=cross-os` 与 `cross_os_suite_filter` 结合使用，例如 `windows/packaged-upgrade`；长跨 OS 命令发出心跳行，打包升级摘要包括每阶段计时。QA 发布检查通道是建议性的，因此仅 QA 失败会警告但不会阻止发布检查验证器。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将选定的 ref 一次解析为 `release-package-under-test` 压缩包，然后将该产物传递给跨 OS 检查和包接受，以及运行浸泡覆盖时的实时/E2E 发布路径 Docker 工作流。这使包字节在发布箱之间保持一致，并避免在多个子任务中重新打包同一候选版本。

对 `ref=main` 和 `rerun_group=all` 的重复 `Full Release Validation` 运行会取代旧的伞形。父监视器在父被取消时取消其已调度的任何子工作流，因此较新的 main 验证不会等待陈旧的两小时发布检查运行。发布分支/标签验证和聚焦重新运行组保持 `cancel-in-progress: false`。

## 实时和 E2E 分片

发布实时/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但通过 `scripts/test-live-shard.mjs` 将其作为命名分片运行，而不是一个串行任务：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- Provider 过滤的 `native-live-src-gateway-profiles` 任务
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分的媒体音频/视频分片和 Provider 过滤的音乐分片

这在保持相同文件覆盖的同时，使慢速实时 Provider 失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称对于手动一次性重新运行仍然有效。

原生实时媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，由 `Live Media Runner Image` 工作流构建。该镜像预安装 `ffmpeg` 和 `ffprobe`；媒体任务在设置前只验证二进制文件。将 Docker 支持的实时套件保持在普通的 Blacksmith 运行器上 — 容器任务不适合启动嵌套的 Docker 测试。

Docker 支持的实时模型/后端分片为每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布工作流构建并推送该镜像一次，然后 Docker 实时模型、Provider 分片 gateway、CLI 后端、ACP 绑定和 Codex 测试框架分片以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。Gateway Docker 分片在工作流任务超时以下携带明确的脚本级 `timeout` 上限，因此卡住的容器或清理路径快速失败，而不是消耗整个发布检查预算。如果这些分片独立重建完整源 Docker 目标，则发布运行配置错误，并将在重复镜像构建上浪费挂钟时间。

## 包接受

当问题是"这个可安装的 OpenClaw 包是否作为产品工作？"时，使用 `Package Acceptance`。它与正常 CI 不同：正常 CI 验证源代码树，而包接受通过用户安装或更新后练习的相同 Docker E2E 测试框架验证单个压缩包。

### 任务

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者上传为 `package-under-test` 产物，并在 GitHub 步骤摘要中打印源、工作流 ref、包 ref、版本、SHA-256 和配置文件。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，带 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。可重用工作流下载该产物，验证压缩包清单，在需要时准备包摘要 Docker 镜像，并针对该包而不是打包工作流检出运行选定的 Docker 通道。当配置文件选择多个目标 `docker_lanes` 时，可重用工作流准备包和共享镜像一次，然后将这些通道作为带有唯一产物的并行目标 Docker 任务展开。
3. `package_telegram` 可选地调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行，并在包接受解析了一个时安装相同的 `package-under-test` 产物；独立 Telegram 调度仍然可以安装已发布的 npm 规格。
4. `summary` 在包解析、Docker 接受或可选 Telegram 通道失败时使工作流失败。

### 候选来源

- `source=npm` 仅接受 `openclaw@beta`、`openclaw@latest` 或确切的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布的预发布/稳定接受。
- `source=ref` 打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器获取 OpenClaw 分支/标签，验证选定的提交可从仓库分支历史或发布标签访问，在分离的工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下载 HTTPS `.tgz`；需要 `package_sha256`。
- `source=artifact` 从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选的，但对于外部共享产物应该提供。

保持 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的受信任工作流/测试框架代码。`package_ref` 是在 `source=ref` 时打包的源提交。这允许当前测试框架验证较旧的受信任源提交，而不运行旧的工作流逻辑。

### 套件配置文件

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 带 OpenWebUI 的完整 Docker 发布路径块
- `custom` — 确切的 `docker_lanes`；当 `suite_profile=custom` 时需要

`package` 配置文件使用离线插件覆盖，因此已发布包验证不受制于实时 ClawHub 可用性。可选的 Telegram 通道在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 产物，为独立调度保持已发布的 npm 规格路径。

有关专用更新和插件测试策略，包括本地命令、Docker 通道、包接受输入、发布默认值和失败分类，请参阅[测试更新和插件](/help/testing-updates-plugins)。

发布检查使用 `source=artifact`、准备好的发布包产物、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` 和 `telegram_mode=mock-openai` 调用包接受。这将包迁移、更新、实时 ClawHub Skill 安装、陈旧插件依赖清理、已配置插件安装修复、离线插件、插件更新和 Telegram 证明保持在同一解析的包压缩包上。发布后在 Full Release Validation 或 OpenClaw Release Checks 上设置 `release_package_spec` 以针对已发布的 npm 包运行相同的矩阵，无需重建；仅在包接受需要与发布验证其余部分不同的包时设置 `package_acceptance_package_spec`。跨 OS 发布检查仍然涵盖 OS 特定的入门、安装程序和平台行为；包/更新产品验证应从包接受开始。`published-upgrade-survivor` Docker 通道在阻塞发布路径中每次运行验证一个已发布的包基准。在包接受中，解析的 `package-under-test` 压缩包始终是候选，`published_upgrade_survivor_baseline` 选择回退已发布的基准，默认为 `openclaw@latest`；失败通道重新运行命令保留该基准。带 `run_release_soak=true` 或 `release_profile=full` 的 Full Release Validation 设置 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues` 以跨四个最新稳定 npm 版本加上固定的插件兼容性边界版本和 Feishu 配置、保留的 bootstrap/persona 文件、已配置的 OpenClaw 插件安装、波浪号日志路径和陈旧旧版插件依赖根的 issue 形状固件进行扩展。多基准已发布升级幸存者选择按基准分片为单独的目标 Docker 运行器任务。单独的 `Update Migration` 工作流在问题是详尽的已发布更新清理而不是正常的完整发布 CI 广度时，使用带 `all-since-2026.4.23` 和 `plugin-deps-cleanup` 的 `update-migration` Docker 通道。本地聚合运行可以使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 传递确切的包规格，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`（例如 `openclaw@2026.4.15`）保留单个通道，或为场景矩阵设置 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`。已发布通道使用烘焙的 `openclaw config set` 命令配方配置基准，在 `summary.json` 中记录配方步骤，并在 Gateway 启动后探测 `/healthz`、`/readyz` 以及 RPC 状态。Windows 打包和安装程序新鲜通道还验证已安装的包可以从原始绝对 Windows 路径导入浏览器控制覆盖。OpenAI 跨 OS agent 轮次冒烟设置时默认为 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则为 `openai/gpt-5.4`，因此安装和 gateway 证明保持在 GPT-5 测试模型上，同时避免 GPT-4.x 默认值。

### 旧版兼容性窗口

包接受对已发布包有有界的旧版兼容性窗口。通过 `2026.4.25`（包括 `2026.4.25-beta.*`）的包可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可能指向压缩包中省略的文件；
- 当包不公开该标志时，`doctor-switch` 可能跳过 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可能从压缩包派生的假 git 固件中修剪缺少的 pnpm `patchedDependencies`，并可能记录缺少的持久化 `update.channel`；
- 插件冒烟可能读取旧版安装记录位置或接受缺少的市场安装记录持久化；
- `plugin-update` 可能在仍然要求安装记录和无重新安装行为保持不变的同时允许配置元数据迁移。

已发布的 `2026.4.26` 包也可能警告已经发布的本地构建元数据标记文件。较新的包必须满足现代合同；相同条件失败而不是警告或跳过。

### 示例

```bash
# 使用产品级覆盖验证当前 beta 包。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# 使用当前测试框架打包并验证发布分支。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# 验证压缩包 URL。source=url 时 SHA-256 是必需的。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 重用另一个 Actions 运行上传的压缩包。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

调试失败的包接受运行时，从 `resolve_package` 摘要开始确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 产物：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段计时和重新运行命令。优先重新运行失败的包配置文件或确切的 Docker 通道，而不是重新运行完整的发布验证。

## 安装冒烟

单独的 `Install Smoke` 工作流通过其自己的 `preflight` 任务重用相同的范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径**为触及 Docker/包界面、捆绑插件包/清单变更或 Docker 冒烟任务练习的核心插件/Channel/gateway/Plugin SDK 界面的 Pull Request 运行。仅源捆绑插件变更、仅测试编辑和仅文档编辑不保留 Docker 工作者。快速路径构建一次根 Dockerfile 镜像，检查 CLI，运行 agents 删除共享工作区 CLI 冒烟，运行容器 gateway-network e2e，验证捆绑扩展构建参数，并在 240 秒聚合命令超时下运行有界的捆绑插件 Docker 配置文件（每个场景的 Docker 运行单独限制）。
- **完整路径**为夜间计划运行、手动调度、工作流调用发布检查以及真正触及安装程序/包/Docker 界面的 Pull Request 保留 QR 包安装和安装程序 Docker/更新覆盖。在完整模式下，安装冒烟准备或重用一个目标 SHA GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/gateway 冒烟、安装程序/更新冒烟和快速捆绑插件 Docker E2E 作为单独的任务运行，以便安装程序工作不等待根镜像冒烟。

`main` 推送（包括合并提交）不强制完整路径；当已变更范围逻辑会在推送时请求完整覆盖时，工作流保持快速 Docker 冒烟，并将完整安装冒烟留给夜间或发布验证。

慢速 Bun 全局安装镜像 Provider 冒烟由 `run_bun_global_install_smoke` 单独门控。它在夜间计划和发布检查工作流上运行，手动 `Install Smoke` 调度可以选择加入，但 Pull Request 和 `main` 推送不运行。QR 和安装程序 Docker 测试保留其自己的以安装为重点的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 预构建一个共享实时测试镜像，将 OpenClaw 一次打包为 npm 压缩包，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 用于安装程序/更新/插件依赖通道的裸 Node/Git 运行器；
- 将相同压缩包安装到 `/app` 的功能镜像，用于正常功能通道。

Docker 通道定义存在于 `scripts/lib/docker-e2e-scenarios.mjs` 中，规划器逻辑存在于 `scripts/lib/docker-e2e-plan.mjs` 中，运行器只执行选定的计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 按通道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道。

### 可调整参数

| 变量                                   | 默认值  | 用途                                                                                       |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 正常通道的主池槽数。                                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Provider 敏感尾池槽数。                                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发实时通道上限，以避免 Provider 限速。                                                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 并发 npm 安装通道上限。                                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务通道上限。                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 通道启动之间的交错，以避免 Docker 守护进程创建风暴；设置 `0` 表示无交错。                    |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每通道回退超时（120 分钟）；选定的实时/尾通道使用更严格的上限。                              |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未设置  | `1` 打印调度器计划而不运行通道。                                                            |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未设置  | 逗号分隔的确切通道列表；跳过清理冒烟，以便 agent 可以重现一个失败的通道。                   |

重于其有效上限的通道仍然可以从空池开始，然后单独运行直到释放容量。本地聚合预检 Docker，删除陈旧的 OpenClaw E2E 容器，发出活动通道状态，持久化通道计时以便最长优先排序，并在第一次失败后默认停止安排新的池化通道。

### 可重用实时/E2E 工作流

可重用实时/E2E 工作流询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、实时镜像、通道和凭据覆盖。`scripts/docker-e2e.mjs` 然后将该计划转换为 GitHub 输出和摘要。它通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，或下载当前运行包产物，或从 `package_artifact_run_id` 下载包产物；验证压缩包清单；当计划需要包安装通道时，通过 Blacksmith 的 Docker 层缓存构建并推送包摘要标记的裸/功能 GHCR Docker E2E 镜像；并重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有的包摘要镜像，而不是重建。Docker 镜像拉取使用有界的每次尝试 180 秒超时重试，因此卡住的注册表/缓存流快速重试而不是消耗大部分 CI 关键路径。

### 发布路径块

发布 Docker 覆盖以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行较小的块化任务，因此每个块只拉取它需要的镜像类型，并通过同一加权调度器执行多个通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

当前发布 Docker 块是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services` 以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 保持聚合插件/运行时别名。`install-e2e` 通道别名保持两个 Provider 安装程序通道的聚合手动重新运行别名。

当完整发布路径覆盖请求时，OpenWebUI 被折叠到 `plugins-runtime-services`，并且仅对仅 OpenWebUI 调度保留独立的 `openwebui` 块。捆绑 Channel 更新通道对瞬态 npm 网络失败重试一次。

每个块上传 `.artifacts/docker-tests/`，包含通道日志、计时、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON、慢通道表和每通道重新运行命令。工作流 `docker_lanes` 输入针对准备好的镜像而不是块任务运行选定的通道，这使失败通道调试限制在一个目标 Docker 任务中，并为该运行准备、下载或重用包产物；如果选定的通道是实时 Docker 通道，目标任务会为该重新运行本地构建实时测试镜像。生成的每通道 GitHub 重新运行命令在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败的通道可以从失败运行中重用确切的包和镜像。

```bash
pnpm test:docker:rerun <run-id>      # 下载 Docker 产物并打印组合/每通道目标重新运行命令
pnpm test:docker:timings <summary>   # 慢通道和阶段关键路径摘要
```

计划的实时/E2E 工作流每天运行完整的发布路径 Docker 套件。

## Plugin Prerelease

`Plugin Prerelease` 是更昂贵的产品/包覆盖，因此它是一个由 `Full Release Validation` 或明确的操作员调度的单独工作流。正常的 Pull Request、`main` 推送和独立手动 CI 调度关闭该套件。它在八个扩展工作者之间平衡捆绑插件测试；这些扩展分片任务一次运行最多两个插件配置组，每组一个 Vitest 工作者，更大的 Node 堆，以便导入密集的插件批次不会创建额外的 CI 任务。仅发布的 Docker 预发布路径以小组批量处理目标 Docker 通道，以避免为一到三分钟的任务保留数十个运行器。

## QA Lab

QA Lab 在主要智能范围工作流之外有专用 CI 通道。Agentic 对等嵌套在广泛的 QA 和发布测试框架下，而不是独立的 PR 工作流。当对等应与广泛验证运行一起时，使用 `rerun_group=qa-parity` 的 `Full Release Validation`。

- `QA-Lab - All Lanes` 工作流每晚在 `main` 上以及手动调度时运行；它将模拟对等通道、实时 Matrix 通道以及实时 Telegram 和 Discord 通道作为并行任务展开。实时任务使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。

发布检查使用确定性模拟 Provider 和模拟限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输通道，以便 Channel 合同与实时模型延迟隔离。实时传输 gateway 禁用记忆搜索，因为 QA 对等单独涵盖记忆行为；Provider 连接性由单独的实时模型、原生 Provider 和 Docker Provider 套件覆盖。

Matrix 对计划和发布门使用 `--profile fast`，仅在检出的 CLI 支持时添加 `--fail-fast`。CLI 默认和手动工作流输入保持 `all`；手动 `matrix_profile=all` 调度始终将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 任务。

`OpenClaw Release Checks` 还在发布批准之前运行发布关键的 QA Lab 通道；其 QA 对等门将候选和基准包作为并行通道任务运行，然后将两个产物下载到小型报告任务中进行最终对等比较。

对于正常 PR，遵循范围 CI/检查证据，而不是将对等视为必需状态。

## CodeQL

`CodeQL` 工作流有意是一个狭窄的第一遍安全扫描仪，而不是完整的仓库扫描。每日、手动和非草稿 Pull Request 守护运行扫描 Actions 工作流代码加上最高风险的 JavaScript/TypeScript 界面，使用过滤到高/关键 `security-severity` 的高置信度安全查询。

Pull Request 守护保持轻量：它仅在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的变更时启动，并运行与计划工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不在 PR 默认值中。

### 安全类别

| 类别                                               | 界面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 认证、秘密、沙箱、Cron 和 gateway 基线                                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | 核心 Channel 实现合同加上 Channel 插件运行时、gateway、Plugin SDK、秘密、审计接触点                                                  |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络守护、web-fetch 和 Plugin SDK SSRF 策略界面                                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行辅助器、出站交付和 agent 工具执行门                                                                             |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、清单、注册表、包管理器安装、源加载和 Plugin SDK 包合同信任界面                                                     |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 计划的 Android 安全分片。在工作流健全性接受的最小 Blacksmith Linux 运行器上为 CodeQL 手动构建 Android 应用。上传到 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤依赖构建结果，并上传到 `/codeql-critical-security/macos`。由于 macOS 构建即使干净也主导运行时，保留在每日默认值之外。

### 关键质量类别

`CodeQL Critical Quality` 是匹配的非安全分片。它仅在较小的 Blacksmith Linux 运行器上对狭窄的高价值界面运行仅错误严重性、非安全 JavaScript/TypeScript 质量查询。其 Pull Request 守护比计划配置文件有意更小：非草稿 PR 仅运行匹配的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片（用于 agent 命令/模型/工具执行和回复调度代码、配置 schema/迁移/IO 代码、认证/秘密/沙箱/安全代码、核心 Channel 和捆绑 Channel 插件运行时、gateway 协议/服务器方法、记忆运行时/SDK 粘合、MCP/进程/出站交付、Provider 运行时/模型目录、会话诊断/交付队列、插件加载器、Plugin SDK/包合同或 Plugin SDK 回复运行时变更）。CodeQL 配置和质量工作流变更运行所有十二个 PR 质量分片。

手动调度接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭窄配置文件是用于孤立运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 界面                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 认证、秘密、沙箱、Cron 和 gateway 安全边界代码                                                                                                                   |
| `/codeql-critical-quality/config-boundary`              | 配置 schema、迁移、规范化和 IO 合同                                                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 协议 schema 和服务器方法合同                                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心 Channel 和捆绑 Channel 插件实现合同                                                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/Provider 调度、自动回复调度和队列以及 ACP 控制平面运行时合同                                                                                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥接、进程监督辅助器以及出站交付合同                                                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆主机 SDK、记忆运行时外观、记忆 Plugin SDK 别名、记忆运行时激活粘合以及记忆 doctor 命令                                                                        |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部、会话交付队列、出站会话绑定/交付辅助器、诊断事件/日志包界面以及会话 doctor CLI 合同                                                                  |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 入站回复调度、回复负载/分块/运行时辅助器、Channel 回复选项、交付队列以及会话/线程绑定辅助器                                                            |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、Provider 认证和发现、Provider 运行时注册、Provider 默认值/目录以及 web/搜索/获取/嵌入注册表                                                      |
| `/codeql-critical-quality/ui-control-plane`             | Control UI 引导、本地持久化、gateway 控制流以及任务控制平面运行时合同                                                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web 获取/搜索、媒体 IO、媒体理解、图像生成以及媒体生成运行时合同                                                                                            |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公共界面和 Plugin SDK 入口合同                                                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布的包侧 Plugin SDK 源和插件包合同辅助器                                                                                                                      |

质量与安全分开，以便质量发现可以在不模糊安全信号的情况下被计划、测量、禁用或扩展。Swift、Python 和捆绑插件 CodeQL 扩展只应在狭窄配置文件具有稳定运行时和信号之后作为作用域或分片后续工作添加回来。

## 维护工作流

### 文档 Agent

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于保持现有文档与最近落地的变更对齐。它没有纯计划：在 `main` 上成功的非机器人推送 CI 运行可以触发它，手动调度可以直接运行它。当另一个非跳过的 Docs Agent 运行在最后一小时内创建时，工作流调用会跳过；当 `main` 已经前进时也跳过。当它运行时，它审查从上一个非跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一个每小时的运行可以覆盖自上次文档通道以来积累的所有 main 变更。

### 测试性能 Agent

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于慢速测试。它没有纯计划：在 `main` 上成功的非机器人推送 CI 运行可以触发它，但如果另一个工作流运行调用当天已经运行或正在运行，它会跳过。手动调度绕过该每日活动门。该通道构建完整套件的分组 Vitest 性能报告，让 Codex 只进行小的保留覆盖的测试性能修复而不是广泛重构，然后重新运行完整套件报告，并拒绝减少通过基线测试计数的变更。如果基线有失败的测试，Codex 可能只修复明显的失败，且 after-agent 完整套件报告必须在提交任何内容之前通过。当 `main` 在机器人推送落地之前前进时，通道将验证的补丁 rebase，重新运行 `pnpm check:changed`，并重试推送；冲突的陈旧补丁被跳过。它使用 GitHub 托管的 Ubuntu，以便 Codex 操作可以保持与文档 agent 相同的 drop-sudo 安全态势。

### 合并后重复 PR

`Duplicate PRs After Merge` 工作流是用于落地后重复清理的手动维护者工作流。它默认为 dry-run，并且仅在 `apply=true` 时关闭明确列出的 PR。在变更 GitHub 之前，它验证已落地的 PR 已合并，并且每个重复的 PR 具有共享的引用 issue 或重叠的已变更代码块。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门控和已变更路由

本地已变更通道逻辑存在于 `scripts/changed-lanes.mjs` 中，并由 `scripts/check-changed.mjs` 执行。该本地检查门控对架构边界比广泛的 CI 平台范围更严格：

- 核心生产变更运行核心生产和核心测试类型检查以及核心 lint/守护；
- 仅核心测试变更只运行核心测试类型检查加上核心 lint；
- 扩展生产变更运行扩展生产和扩展测试类型检查加上扩展 lint；
- 仅扩展测试变更运行扩展测试类型检查加上扩展 lint；
- 公共 Plugin SDK 或插件合同变更扩展到扩展类型检查，因为扩展依赖于那些核心合同（Vitest 扩展扫描保持明确的测试工作）；
- 仅发布元数据版本升级运行目标版本/配置/根依赖检查；
- 未知的根/配置变更安全地失败到所有检查通道。

本地已变更测试路由存在于 `scripts/test-projects.test-support.mjs` 中，有意比 `check:changed` 更便宜：直接测试编辑运行自身，源编辑偏好明确映射，然后是兄弟测试和导入图依赖。共享群组房间交付配置是明确映射之一：对群组可见回复配置、源回复交付模式或消息工具系统提示的变更通过核心回复测试加上 Discord 和 Slack 交付回归路由，以便共享默认变更在第一次 PR 推送之前失败。仅在变更对测试框架足够广泛以至于廉价的映射集不是可信代理时使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

Crabbox 是用于维护者 Linux 证明的仓库自有远程盒子包装器。当检查对于本地编辑循环太广泛、CI 对等很重要，或证明需要秘密、Docker、包通道、可重用盒子或远程日志时，从仓库根目录使用它。正常的 OpenClaw 后端是 `blacksmith-testbox`；自有的 AWS/Hetzner 容量是 Blacksmith 中断、配额问题或明确自有容量测试的回退。

Crabbox 支持的 Blacksmith 运行预热、认领、同步、运行、报告和清理一次性 Testbox。内置同步健全性检查在必需的根文件（例如 `pnpm-lock.yaml`）消失时或 `git status --short` 显示至少 200 个跟踪删除时快速失败。对于有意的大删除 PR，为远程命令设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

Crabbox 还终止在同步阶段停留超过五分钟而没有同步后输出的本地 Blacksmith CLI 调用。设置 `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 禁用该守护，或为异常大的本地差异使用更大的毫秒值。

在第一次运行之前，从仓库根目录检查包装器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

仓库包装器拒绝不宣传 `blacksmith-testbox` 的陈旧 Crabbox 二进制文件。即使 `.crabbox.yaml` 有自有云默认值，也要明确传递 Provider。

已变更门控：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

聚焦测试重新运行：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

完整套件：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

读取最终 JSON 摘要。有用的字段是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。一次性 Blacksmith 支持的 Crabbox 运行应自动停止 Testbox；如果运行被中断或清理不明确，检查活动盒子并只停止您创建的盒子：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

仅在您有意需要在同一水化盒子上运行多个命令时使用重用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果 Crabbox 是损坏的层但 Blacksmith 本身工作，仅将直接 Blacksmith 用于诊断，例如 `list`、`status` 和清理。在将直接 Blacksmith 运行视为维护者证明之前修复 Crabbox 路径。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 工作，但新的预热在几分钟后没有 IP 或 Actions 运行 URL 的情况下处于 `queued` 状态，将其视为 Blacksmith Provider、队列、计费或组织限制压力。停止您创建的排队 ID，避免启动更多 Testbox，并在有人检查 Blacksmith 仪表板、计费和组织限制时将证明移至下面的自有 Crabbox 容量路径。

仅在 Blacksmith 宕机、配额受限、缺少所需环境或自有容量明确是目标时升级到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

在 AWS 压力下，除非任务确实需要 48xlarge 级别的 CPU，否则避免使用 `class=beast`。`beast` 请求从 192 vCPU 开始，是触发区域 EC2 Spot 或按需标准配额的最简单方法。仓库自有的 `.crabbox.yaml` 默认为 `standard`、多容量区域和 `capacity.hints: true`，以便中介 AWS 租约打印选定的区域/市场、配额压力、Spot 回退和高压类警告。对较重的广泛检查使用 `fast`，只有在 standard/fast 不够时才使用 `large`，只对特殊 CPU 密集通道（例如完整套件或所有插件 Docker 矩阵、明确的发布/阻塞器验证或高核性能分析）使用 `beast`。对于 `pnpm check:changed`、聚焦测试、仅文档工作、普通 lint/类型检查、小型 E2E 重现或 Blacksmith 中断分类，不要使用 `beast`。对容量诊断使用 `--market on-demand`，以便 Spot 市场流失不与信号混合。

`.crabbox.yaml` 拥有自有云通道的 Provider、同步和 GitHub Actions 水化默认值。它排除本地 `.git`，以便水化的 Actions 检出保留其自己的远程 Git 元数据，而不是同步维护者本地远程和对象存储，并排除不应该传输的本地运行时/构建产物。`.github/workflows/crabbox-hydrate.yml` 拥有检出、Node/pnpm 设置、`origin/main` 获取以及用于自有云 `crabbox run --id <cbx_id>` 命令的非秘密环境交接。

## 相关文档

- [安装概述](/install)
- [开发渠道](/install/development-channels)
