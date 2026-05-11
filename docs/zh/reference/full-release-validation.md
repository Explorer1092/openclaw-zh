---
mmh3_hash: "e3dec92cdaaa8bc37b53a9d5bca6c365"
summary: "完整发布验证的各阶段、子工作流、发布 Profile、重新运行 Handle 和测试证据"
title: "完整发布验证"
read_when:
  - 运行或重新运行完整发布验证
  - 比较 stable 和完整发布验证 Profile
  - 调试发布验证阶段失败
---

`Full Release Validation` 是发布的总控工作流，是发布前验证的唯一手动入口，但大部分工作在子工作流中完成，因此失败的阶段可以单独重新运行而无需重启整个发布流程。

从可信工作流 ref（通常是 `main`）运行它，并将发布分支、Tag 或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流使用可信工作流 ref 作为测试框架，使用输入 `ref` 作为被测候选版本。这样，在验证旧版发布分支或 Tag 时，新的验证逻辑仍然可用。

默认情况下，`release_profile=stable` 运行阻断发布的通道并跳过详尽的实时/Docker 浸泡测试。传入 `run_release_soak=true` 可在 stable 运行中包含浸泡通道。`release_profile=full` 始终启用浸泡通道，确保广泛的建议性 Profile 不会静默丢失覆盖。

Package Acceptance 通常从解析的 `ref` 构建候选 tarball，包括使用 `pnpm ci:full-release` 分发的完整 SHA 运行。在 beta 发布后，传入 `release_package_spec=openclaw@YYYY.M.D-beta.N` 可在发布检查、Package Acceptance、跨 OS、发布路径 Docker 和 package Telegram 中复用已发布的 npm 包。仅当 Package Acceptance 需要验证不同包时才使用 `package_acceptance_package_spec`。

## 顶层阶段

| 阶段 | 详情 |
| ---- | ---- |
| 目标解析 | **Job：** `Resolve target ref`<br />**子工作流：** 无<br />**验证：** 解析发布分支、Tag 或完整提交 SHA，并记录所选输入。<br />**重新运行：** 若此阶段失败，重新运行整个总控工作流。 |
| Vitest 和普通 CI | **Job：** `Run normal full CI`<br />**子工作流：** `CI`<br />**验证：** 针对目标 ref 的手动完整 CI 图，包括 Linux Node 通道、捆绑 Plugin 分片、Channel 契约、Node 22 兼容性、`check`、`check-additional`、构建烟雾测试、文档检查、Python Skills、Windows、macOS、Control UI i18n 以及通过总控工作流的 Android。<br />**重新运行：** `rerun_group=ci`。 |
| Plugin 预发布 | **Job：** `Run plugin prerelease validation`<br />**子工作流：** `Plugin Prerelease`<br />**验证：** 仅限发布的 Plugin 静态检查、Agent 式 Plugin 覆盖、完整扩展批次分片和 Plugin 预发布 Docker 通道。<br />**重新运行：** `rerun_group=plugin-prerelease`。 |
| 发布检查 | **Job：** `Run release/live/Docker/QA validation`<br />**子工作流：** `OpenClaw Release Checks`<br />**验证：** 安装烟雾测试、跨 OS 包检查、Package Acceptance、QA Lab 一致性、实时 Matrix 和实时 Telegram。若设置了 `run_release_soak=true` 或 `release_profile=full`，还会运行详尽的实时/E2E 套件和 Docker 发布路径区块。<br />**重新运行：** `rerun_group=release-checks` 或更细粒度的发布检查 Handle。 |
| 包产物 | **Job：** `Prepare release package artifact`<br />**子工作流：** 无<br />**验证：** 尽早创建父级 `release-package-under-test` tarball，供无需等待 `OpenClaw Release Checks` 完成的包相关检查使用。<br />**重新运行：** 重新运行总控工作流，或在已发布包的重新运行时提供 `release_package_spec`。 |
| Package Telegram | **Job：** `Run package Telegram E2E`<br />**子工作流：** `NPM Telegram Beta E2E`<br />**验证：** 在 `rerun_group=all` 和 `release_profile=full` 时，基于父级产物的 Telegram 包验证；当设置了 `release_package_spec` 或 `npm_telegram_package_spec` 时，进行已发布包的 Telegram 验证。<br />**重新运行：** 配合 `release_package_spec` 或 `npm_telegram_package_spec` 使用 `rerun_group=npm-telegram`。 |
| 总控验证器 | **Job：** `Verify full validation`<br />**子工作流：** 无<br />**验证：** 重新检查已记录的子运行结论，并追加来自子工作流的最慢 Job 表格。<br />**重新运行：** 在重新运行失败的子工作流并通过后，仅重新运行此 Job。 |

对于 `ref=main` 和 `rerun_group=all`，较新的总控工作流会取代较旧的。当父级被取消时，其监视器会取消已分发的所有子工作流。发布分支和 Tag 验证运行默认不会相互取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它解析一次目标，并在包或 Docker 相关阶段需要时准备共享的 `release-package-under-test` 产物。

| 阶段 | 详情 |
| ---- | ---- |
| 发布目标 | **Job：** `Resolve target ref`<br />**支撑工作流：** 无<br />**测试：** 所选 ref、可选的预期 SHA、Profile、重新运行分组和聚焦实时套件过滤器。<br />**重新运行：** `rerun_group=release-checks`。 |
| 包产物 | **Job：** `Prepare release package artifact`<br />**支撑工作流：** 无<br />**测试：** 打包或解析一个候选 tarball，并上传 `release-package-under-test` 供下游包相关检查使用。<br />**重新运行：** 受影响的包、跨 OS 或实时/E2E 分组。 |
| 安装烟雾测试 | **Job：** `Run install smoke`<br />**支撑工作流：** `Install Smoke`<br />**测试：** 复用根 Dockerfile 烟雾镜像的完整安装路径、QR 包安装、根和 Gateway Docker 烟雾测试、安装器 Docker 测试、Bun 全局安装镜像 Provider 烟雾测试，以及快速捆绑 Plugin 安装/卸载 E2E。<br />**重新运行：** `rerun_group=install-smoke`。 |
| 跨 OS | **Job：** `cross_os_release_checks`<br />**支撑工作流：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试：** 针对所选 Provider 和模式，在 Linux、Windows 和 macOS 上使用候选 tarball 和基线包进行全新安装和升级通道测试。<br />**重新运行：** `rerun_group=cross-os`。 |
| 仓库和实时 E2E | **Job：** `Run repo/live E2E validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 仓库 E2E、实时缓存、OpenAI WebSocket 流式传输、原生实时 Provider 和 Plugin 分片，以及由 `release_profile` 选择的 Docker 支撑的实时模型/后端/Gateway 测试框架。<br />**运行条件：** `run_release_soak=true`、`release_profile=full` 或聚焦 `rerun_group=live-e2e`。<br />**重新运行：** `rerun_group=live-e2e`，可选配合 `live_suite_filter`。 |
| Docker 发布路径 | **Job：** `Run Docker release-path validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 针对共享包产物的发布路径 Docker 区块。<br />**运行条件：** `run_release_soak=true`、`release_profile=full` 或聚焦 `rerun_group=live-e2e`。<br />**重新运行：** `rerun_group=live-e2e`。 |
| Package Acceptance | **Job：** `Run package acceptance`<br />**支撑工作流：** `Package Acceptance`<br />**测试：** 离线 Plugin 包 Fixture、Plugin 更新、Mock-OpenAI Telegram 包验收，以及针对同一 tarball 的已发布升级存活者检查。阻断发布的检查使用默认最新已发布基线；浸泡检查扩展至 `2026.4.23` 后的每个稳定 npm 发布及已报告问题 Fixture。<br />**重新运行：** `rerun_group=package`。 |
| QA 一致性 | **Job：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支撑工作流：** 直接 Job<br />**测试：** 候选版本和基线的 Agent 式一致性包，以及一致性报告。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。 |
| QA 实时 Matrix | **Job：** `Run QA Lab live Matrix lane`<br />**支撑工作流：** 直接 Job<br />**测试：** 在 `qa-live-shared` 环境中运行快速实时 Matrix QA Profile。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。 |
| QA 实时 Telegram | **Job：** `Run QA Lab live Telegram lane`<br />**支撑工作流：** 直接 Job<br />**测试：** 使用 Convex CI 凭据租约进行实时 Telegram QA。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。 |
| 发布验证器 | **Job：** `Verify release checks`<br />**支撑工作流：** 无<br />**测试：** 所选重新运行分组的必要发布检查 Job。<br />**重新运行：** 在聚焦的子 Job 通过后重新运行。 |

## Docker 发布路径区块

当 `live_suite_filter` 为空时，Docker 发布路径阶段运行以下区块：

| 区块 | 覆盖范围 |
| ---- | -------- |
| `core` | 核心 Docker 发布路径烟雾通道。 |
| `package-update-openai` | OpenAI 包安装/更新行为，包括 Codex 按需安装。 |
| `package-update-anthropic` | Anthropic 包安装和更新行为。 |
| `package-update-core` | Provider 无关的包和更新行为。 |
| `plugins-runtime-plugins` | 演练 Plugin 行为的 Plugin 运行时通道。 |
| `plugins-runtime-services` | 服务支撑和实时 Plugin 运行时通道；请求时包含 OpenWebUI。 |
| `plugins-runtime-install-a` 至 `plugins-runtime-install-h` | Plugin 安装/运行时批次，拆分为并行发布验证。 |

当只有一个 Docker 通道失败时，在可复用的实时/E2E 工作流上使用有针对性的 `docker_lanes=<lane[,lane]>`。发布产物在可用时包含每个通道的重新运行命令及包产物和镜像复用输入。

## 发布 Profile

`release_profile` 主要控制发布检查内的实时/Provider 广度。它不会移除普通完整 CI、Plugin 预发布、安装烟雾测试、Package Acceptance 或 QA Lab。对于 `stable`，详尽的仓库/实时 E2E 和 Docker 发布路径区块属于浸泡覆盖，在 `run_release_soak=true` 时运行。`full` 强制开启浸泡覆盖，并且在 `rerun_group=all` 时还让总控工作流针对父级发布包产物运行 Package Telegram E2E，确保完整的预发布候选版本不会静默跳过该 Telegram 包通道。

| Profile | 预期用途 | 包含的实时/Provider 覆盖 |
| ------- | -------- | ------------------------- |
| `minimum` | 最快的发布关键烟雾测试。 | OpenAI/核心实时路径，Docker 实时模型（OpenAI），原生 Gateway 核心，原生 OpenAI Gateway Profile，原生 OpenAI Plugin，以及 Docker 实时 Gateway OpenAI。 |
| `stable` | 默认发布批准 Profile。 | `minimum` 加 Anthropic 烟雾测试、Google、MiniMax、后端、原生实时测试框架、Docker 实时 CLI 后端、Docker ACP 绑定、Docker Codex 测试框架，以及 OpenCode Go 烟雾分片。 |
| `full` | 广泛的建议性扫描。 | `stable` 加建议性 Provider、Plugin 实时分片和媒体实时分片。 |

## 仅限 full 的附加内容

以下套件被 `stable` 跳过，由 `full` 包含：

| 领域 | 仅限 full 的覆盖 |
| ---- | ---------------- |
| Docker 实时模型 | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。 |
| Docker 实时 Gateway | 建议性 Provider 拆分为 DeepSeek/Fireworks、OpenCode Go/OpenRouter 以及 xAI/Z.ai 分片。 |
| 原生 Gateway Provider Profile | 完整的 Anthropic Opus 和 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整的 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。 |
| 原生 Plugin 实时分片 | Plugin A-K、L-N、O-Z 其他、Moonshot 和 xAI。 |
| 原生媒体实时分片 | 音频、Google 音乐、MiniMax 音乐和视频分组 A-D。 |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和 `native-live-src-gateway-profiles-opencode-go-smoke`；`full` 使用更广泛的 Anthropic 和 OpenCode Go 模型分片替代。聚焦重新运行仍可使用聚合 `native-live-src-gateway-profiles-anthropic` 或 `native-live-src-gateway-profiles-opencode-go` Handle。

## 聚焦重新运行

使用 `rerun_group` 避免重复运行无关的发布阶段：

| Handle | 范围 |
| ------ | ---- |
| `all` | 所有完整发布验证阶段。 |
| `ci` | 仅手动完整 CI 子工作流。 |
| `plugin-prerelease` | 仅 Plugin 预发布子工作流。 |
| `release-checks` | 所有 OpenClaw Release Checks 阶段。 |
| `install-smoke` | 通过发布检查的安装烟雾测试。 |
| `cross-os` | 跨 OS 发布检查。 |
| `live-e2e` | 仓库/实时 E2E 和 Docker 发布路径验证。 |
| `package` | Package Acceptance。 |
| `qa` | QA 一致性加 QA 实时通道。 |
| `qa-parity` | 仅 QA 一致性通道和报告。 |
| `qa-live` | 仅 QA 实时 Matrix 和 Telegram。 |
| `npm-telegram` | 已发布包的 Telegram E2E；需要 `release_package_spec` 或 `npm_telegram_package_spec`。 |

当某个实时套件失败时，配合 `rerun_group=live-e2e` 使用 `live_suite_filter`。有效的过滤器 ID 定义在可复用的实时/E2E 工作流中，包括 `docker-live-models`、`live-gateway-docker`、`live-gateway-anthropic-docker`、`live-gateway-google-docker`、`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、`live-cli-backend-docker`、`live-acp-bind-docker` 和 `live-codex-harness-docker`。

`live-gateway-advisory-docker` Handle 是其三个 Provider 分片的聚合重新运行 Handle，因此它仍会分发至所有建议性 Docker Gateway Job。

当某个跨 OS 通道失败时，配合 `rerun_group=cross-os` 使用 `cross_os_suite_filter`。该过滤器接受 OS ID、套件 ID 或 OS/套件对，例如 `windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨 OS 摘要包含打包升级通道的每阶段计时，长时间运行的命令会打印心跳行，以便在 Job 超时前发现卡住的 Windows 更新。

QA 发布检查通道为建议性质。仅 QA 失败会报告为警告，不阻断发布检查验证器；当需要新的 QA 测试证据时，重新运行 `rerun_group=qa`、`qa-parity` 或 `qa-live`。

## 需要保留的测试证据

将 `Full Release Validation` 摘要作为发布级索引。它链接子运行 ID 并包含最慢 Job 表格。对于失败情况，先检查子工作流，然后使用上述最小匹配 Handle 重新运行。

有用的产物：

- 来自完整发布验证父级和 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 发布路径产物
- Package Acceptance 的 `package-under-test` 和 Docker 验收产物
- 每个 OS 和套件的跨 OS 发布检查产物
- QA 一致性、Matrix 和 Telegram 产物

## 工作流文件

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
