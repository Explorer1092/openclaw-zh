---
mmh3_hash: "7c5cd1478c365c5cdab7bf2bf00745bc"
title: "CI Pipeline"
summary: "CI 任务图、范围控制门以及本地等效命令"
read_when:
  - 需要了解某个 CI 任务是否运行及其原因
  - 调试失败的 GitHub Actions 检查
---

# CI 流水线

CI 在每次推送到 `main` 分支以及每个拉取请求时运行。它使用智能范围控制，当仅有不相关区域发生变更时跳过开销较大的任务。手动 `workflow_dispatch` 运行特意绕过智能范围控制，为发布候选或广泛验证展开完整的正常 CI 图。

`Full Release Validation` 是"发布前运行所有内容"的手动总体工作流。它接受分支、标签或完整提交 SHA，使用该目标分发手动 `CI` 工作流，并为安装冒烟、包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab 对等、Matrix 和 Telegram 通道分发 `OpenClaw Release Checks`。当提供已发布的包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

`Package Acceptance` 是用于在不阻塞发布工作流的情况下验证包工件的侧运行工作流。它从已发布的 npm 规范、使用所选 `workflow_ref` 工具构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL 或另一个 GitHub Actions 运行的 tarball 工件中解析一个候选，上传为 `package-under-test`，然后使用该 tarball 重用 Docker 发布/E2E 调度器，而不是重新打包工作流检出。配置文件涵盖冒烟、包、产品、完整和自定义 Docker 通道选择。`package` 配置文件使用离线插件覆盖，因此已发布包的验证不会受 live ClawHub 可用性的限制。可选的 Telegram 通道在 `NPM Telegram Beta E2E` 工作流中重用 `package-under-test` 工件，已发布的 npm 规范路径保留用于独立分发。

## 包验收

当问题是"这个可安装的 OpenClaw 包是否作为产品正常工作？"时使用 `Package Acceptance`。它与普通 CI 不同：普通 CI 验证源代码树，而包验收通过用户安装或更新后使用的相同 Docker E2E 工具验证单个 tarball。

该工作流有四个任务：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中打印来源、工作流引用、包引用、版本、SHA-256 和配置文件。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流下载该工件，验证 tarball 清单，在需要时准备包摘要 Docker 镜像，并针对该包运行所选 Docker 通道，而不是打包工作流检出。
3. `package_telegram` 可选地调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行，并在包验收解析后安装相同的 `package-under-test` 工件；独立 Telegram 分发仍然可以安装已发布的 npm 规范。
4. `summary` 在包解析、Docker 验收或可选 Telegram 通道失败时使工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本，如 `openclaw@2026.4.27-beta.2`。用于已发布的 beta/stable 验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在分离的 worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；`package_sha256` 是必需的。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选的，但应为外部共享工件提供。

保持 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的受信任工作流/工具代码。`package_ref` 是 `source=ref` 时打包的源提交。这允许当前测试工具在不运行旧工作流逻辑的情况下验证较旧的受信任源提交。

配置文件映射到 Docker 覆盖：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带有 OpenWebUI 的完整 Docker 发布路径块
- `custom`：精确的 `docker_lanes`；`suite_profile=custom` 时必需

发布检查使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=package` 和 `telegram_mode=mock-openai` 调用包验收。该配置文件是大多数 Parallels 包/更新验证的 GitHub 原生替代，Telegram 通过 QA live 传输验证相同的包工件。跨 OS 发布检查仍然涵盖 OS 特定的入门、安装程序和平台行为；包/更新产品验证应从包验收开始。

示例：

```bash
# 使用产品级覆盖验证当前 beta 包。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# 使用当前工具打包和验证发布分支。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# 验证 tarball URL。source=url 时 SHA-256 是必需的。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 重用另一个 Actions 运行上传的 tarball。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

调试失败的包验收运行时，从 `resolve_package` 摘要开始确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段计时和重新运行命令。优先重新运行失败的包配置文件或精确的 Docker 通道，而不是重新运行完整的发布验证。

QA Lab 在主智能范围工作流之外有专用的 CI 通道。`Parity gate` 工作流在匹配的 PR 变更和手动分发时运行；它构建私有 QA 运行时并比较模拟 GPT-5.5 和 Opus 4.6 的 agent 包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行并在手动分发时运行；它将模拟对等门、实时 Matrix 通道以及实时 Telegram 和 Discord 通道作为并行任务展开。实时任务使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。Matrix 在计划和发布门中使用 `--profile fast --fail-fast`，而 CLI 默认和手动工作流输入保持为 `all`；手动 `matrix_profile=all` 分发始终将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 任务。`OpenClaw Release Checks` 还在发布批准前运行发布关键 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是用于合并后重复清理的手动维护者工作流。它默认为试运行，仅在 `apply=true` 时关闭明确列出的 PR。在修改 GitHub 之前，它验证已合并的 PR 是否已合并，以及每个重复项是否有共享引用的 issue 或重叠的变更块。

`Docs Agent` 工作流是用于保持现有文档与最近落地变更一致的事件驱动 Codex 维护通道。它没有纯粹的计划：`main` 上成功的非机器人推送 CI 运行可以触发它，手动分发可以直接运行它。当 `main` 已向前移动或最近一小时内另一个非跳过的 Docs Agent 运行被创建时，工作流运行调用会跳过。当它运行时，它会审查从上一个非跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档处理以来积累的所有 main 变更。

`Test Performance Agent` 工作流是用于慢速测试的事件驱动 Codex 维护通道。它没有纯粹的计划：`main` 上成功的非机器人推送 CI 运行可以触发它，但如果另一个工作流运行调用已在当天 UTC 运行或正在运行，则会跳过。手动分发绕过该每日活动门。该通道构建完整套件分组的 Vitest 性能报告，让 Codex 仅进行小型保留覆盖率的测试性能修复而不是广泛的重构，然后重新运行完整套件报告并拒绝减少通过基线测试计数的变更。如果基线有失败的测试，Codex 只能修复明显的失败，并且在提交任何内容之前，代理后完整套件报告必须通过。当 `main` 在机器人推送落地之前推进时，该通道重新基于验证的补丁，重新运行 `pnpm check:changed`，并重试推送；冲突的过时补丁被跳过。它使用 GitHub 托管的 Ubuntu，以便 Codex 操作可以保持与文档代理相同的无 sudo 安全态势。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 任务概览

| 任务                              | 用途                                                                                       | 运行时机                       |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------ |
| `preflight`                       | 检测仅文档变更、变更范围、变更扩展，并构建 CI 清单                                         | 非草稿推送和 PR 时始终运行     |
| `security-scm-fast`               | 通过 `zizmor` 进行私钥检测和工作流审计                                                     | 非草稿推送和 PR 时始终运行     |
| `security-dependency-audit`       | 针对 npm 安全公告的无依赖生产锁文件审计                                                     | 非草稿推送和 PR 时始终运行     |
| `security-fast`                   | 快速安全任务的必需聚合                                                                      | 非草稿推送和 PR 时始终运行     |
| `build-artifacts`                 | 构建 `dist/`、Control UI、已构建工件检查和可重用下游工件                                    | Node 相关变更                  |
| `checks-fast-core`                | 快速 Linux 正确性通道，如打包/插件合约/协议检查                                             | Node 相关变更                  |
| `checks-fast-contracts-channels`  | 分片 Channel 合约检查，具有稳定的聚合检查结果                                              | Node 相关变更                  |
| `checks-node-extensions`          | 跨扩展套件的完整打包插件测试分片                                                            | Node 相关变更                  |
| `checks-node-core-test`           | 核心 Node 测试分片，排除 Channel、打包、合约和扩展通道                                      | Node 相关变更                  |
| `check`                           | 分片主本地门控等效：prod 类型、lint、守卫、测试类型和严格冒烟                               | Node 相关变更                  |
| `check-additional`                | 架构、边界、扩展界面守卫、包边界和 gateway-watch 分片                                       | Node 相关变更                  |
| `build-smoke`                     | 已构建 CLI 冒烟测试和启动内存冒烟测试                                                       | Node 相关变更                  |
| `checks`                          | 已构建工件 Channel 测试的验证器                                                             | Node 相关变更                  |
| `checks-node-compat-node22`       | Node 22 兼容性构建和冒烟通道                                                                | 发布的手动 CI 分发             |
| `check-docs`                      | 文档格式化、lint 和断链检查                                                                 | 文档变更时                     |
| `skills-python`                   | Python 支持 Skill 的 Ruff + pytest                                                          | Python Skill 相关变更          |
| `checks-windows`                  | Windows 特定进程/路径测试加共享运行时导入说明符回归                                         | Windows 相关变更               |
| `macos-node`                      | macOS TypeScript 测试通道，使用共享构建工件                                                 | macOS 相关变更                 |
| `macos-swift`                     | macOS 应用的 Swift lint、构建和测试                                                         | macOS 相关变更                 |
| `android`                         | 两种 flavor 的 Android 单元测试加一个 debug APK 构建                                        | Android 相关变更               |
| `test-performance-agent`          | 受信任活动后每日 Codex 慢速测试优化                                                         | Main CI 成功或手动分发         |

手动 CI 分发运行与普通 CI 相同的任务图，但强制打开每个范围通道：Linux Node 分片、打包插件分片、Channel 合约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python 技能、Windows、macOS、Android 和 Control UI i18n。手动运行使用唯一的并发组，因此发布候选完整套件不会被同一引用上的另一次推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任的调用者在使用所选分发引用的工作流文件的情况下对分支、标签或完整提交 SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

任务排列顺序使得廉价检查先于昂贵检查失败：

1. `preflight` 决定哪些通道存在。`docs-scope` 和 `changed-scope` 逻辑是此任务中的步骤，而非独立任务。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 快速失败，无需等待较重的工件和平台矩阵任务。
3. `build-artifacts` 与快速 Linux 通道重叠，以便下游消费者可以在共享构建就绪后立即启动。
4. 较重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动分发跳过变更范围检测，并使预检清单表现得好像每个范围区域都已更改一样。CI 工作流编辑验证 Node CI 图以及工作流 linting，但本身不强制 Windows、Android 或 macOS 原生构建；这些平台通道仍然范围于平台源变更。

手动 CI 分发将 `checks-node-compat-node22` 作为发布候选兼容性覆盖运行。普通拉取请求和 `main` 推送跳过该通道，并将矩阵集中在 Node 24 测试/Channel 通道上。

## 运行器

| 运行器                              | 任务                                                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                      | `preflight`、快速安全任务和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/合约/打包检查、分片 Channel 合约检查、`check` 分片（除 lint 外）、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python 技能、工作流健全性、标签器、自动响应；安装冒烟预检也使用 GitHub 托管 Ubuntu |
| `blacksmith-8vcpu-ubuntu-2404`      | `build-artifacts`、构建冒烟、Linux Node 测试分片、打包插件测试分片、`android`                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`     | `check-lint`（仍然对 CPU 敏感，8 vCPU 成本高于节省的）；安装冒烟 Docker 构建（32 vCPU 队列时间成本高于节省的）                                |
| `blacksmith-16vcpu-windows-2025`    | `checks-windows`                                                                                                                               |
| `blacksmith-6vcpu-macos-latest`     | `openclaw/openclaw` 上的 `macos-node`；fork 回退到 `macos-latest`                                                                              |
| `blacksmith-12vcpu-macos-latest`    | `openclaw/openclaw` 上的 `macos-swift`；fork 回退到 `macos-latest`                                                                             |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地变更通道分类器
pnpm check:changed   # 智能本地检查门：按边界通道变更的类型检查/lint/守卫
pnpm check          # 快速本地门控：production tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门控，带每阶段计时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:changed   # 廉价智能变更 Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 断链检查
pnpm build          # 当 CI 工件/build-smoke 通道重要时构建 dist
pnpm ci:timings                               # 汇总最新 origin/main 推送 CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总挂钟时间、队列时间和最慢任务
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/评论噪音并选择 origin/main 推送 CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关

- [安装概览](/install)
- [发布渠道](/install/development-channels)
