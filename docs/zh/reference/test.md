---
mmh3_hash: "5cba52fc5020835080a52a9cd65b1f0b"
summary: "如何在本地运行测试（vitest）以及何时使用 force/coverage 模式"
read_when:
  - 运行或修复测试
title: "测试"
---

- 完整测试套件（套件、实时、Docker）：[测试](/help/testing)
- 更新和 Plugin 包验证：[测试更新和 Plugin](/help/testing-updates-plugins)

- `pnpm test:force`：杀死任何占用默认控制端口的遗留 Gateway 进程，然后使用隔离的 Gateway 端口运行完整的 Vitest 套件，以便服务器测试不会与运行的实例冲突。当先前的 Gateway 运行占用端口 18789 时使用此选项。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元套件（通过 `vitest.unit.config.ts`）。这是默认单元通道的覆盖率关卡，而不是全仓库所有文件的覆盖率。阈值为 70% 行/函数/语句和 55% 分支。因为 `coverage.all` 为 false 且默认通道作用域的覆盖率仅包含带有同级源文件的非快速单元测试，该关卡测量此通道拥有的源文件，而不是它碰巧加载的每个传递导入。
- `pnpm test:coverage:changed`：仅对自 `origin/main` 以来变更的文件运行单元覆盖率。
- `pnpm test:changed`：低成本智能变更测试运行。它从直接测试编辑、同级 `*.test.ts` 文件、显式源映射和本地导入图中运行精确目标。广泛的/配置/包变更会被跳过，除非它们映射到精确的测试。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：显式广泛变更测试运行。当测试工具/配置/包编辑应回退到 Vitest 更广泛的变更测试行为时使用它。
- `pnpm changed:lanes`：显示针对 `origin/main` 差异触发的架构通道。
- `pnpm check:changed`：为针对 `origin/main` 差异运行智能变更检查关卡。它为受影响的架构通道运行类型检查、lint 和守护命令，但不运行 Vitest 测试。对于测试证明使用 `pnpm test:changed` 或显式 `pnpm test <target>`。
- `pnpm test`：通过有作用域的 Vitest 通道路由显式文件/目录目标。无目标运行使用固定的分片组并扩展到叶配置以进行本地并行执行；扩展组始终扩展到每个扩展的分片配置，而不是一个大型根项目进程。
- 测试包装器运行以简短的 `[test] passed|failed|skipped ... in ...` 摘要结束。Vitest 自己的持续时间行保持为每个分片的详细信息。
- 共享 OpenClaw 测试状态：当测试需要隔离的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、配置固件、工作区、Agent 目录或 auth-profile 存储时，从 Vitest 使用 `src/test-utils/openclaw-test-state.ts`。
- 进程 E2E 辅助程序：当 Vitest 进程级 E2E 测试需要运行的 Gateway、CLI 环境、日志捕获和一站式清理时，使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E 辅助程序：来源 `scripts/lib/docker-e2e-image.sh` 的通道可以将 `docker_e2e_test_state_shell_b64 <label> <scenario>` 传递到容器，并用 `scripts/lib/openclaw-e2e-instance.sh` 解码；多主脚本可以传递 `docker_e2e_test_state_function_b64` 并在每个流中调用 `openclaw_test_state_create <label> <scenario>`。较低级别的调用者可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 获取容器内 shell 代码片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 获取可加载的主机环境文件。`--` 在 `create` 之前防止较新的 Node 运行时将 `--env-file` 视为 Node 标志。启动 Gateway 的 Docker/Bash 通道可以在容器内来源 `scripts/lib/openclaw-e2e-instance.sh` 以获取入口点解析、模拟 OpenAI 启动、Gateway 前台/后台启动、就绪探测、状态环境导出、日志转储和进程清理。
- 完整、扩展和包含模式分片运行更新 `.artifacts/vitest-shard-timings.json` 中的本地时间数据；之后的整个配置运行使用这些时间来平衡慢速和快速分片。包含模式 CI 分片将分片名称附加到时间键，这使得过滤的分片时间可见而不替换整体配置时间数据。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 以忽略本地时间产物。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在通过只保留 `test/setup.ts` 的专用轻量通道路由，将运行时密集型用例保留在其现有通道上。
- 有同级测试的源文件在回退到更宽目录通配符之前会映射到该同级。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的辅助函数编辑使用本地导入图来运行导入测试，而不是在依赖路径精确时广泛运行每个分片。
- `auto-reply` 现在还拆分为三个专用配置（`core`、`top-level`、`reply`），以便回复工具不会主导较轻量的顶层状态/token/辅助测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在仓库配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展/Plugin 分片。重型 Channel Plugin、浏览器 Plugin 和 OpenAI 作为专用分片运行；其他 Plugin 组保持批处理。使用 `pnpm test extensions/<id>` 运行一个捆绑 Plugin 通道。
- `pnpm test:perf:imports`：启用 Vitest 导入时长 + 导入分解报告，同时对显式文件/目录目标仍使用有作用域的通道路由。
- `pnpm test:perf:imports:changed`：同样的导入分析，但仅针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 将已路由的变更模式路径与相同提交 git 差异的原生根项目运行进行基准测试。
- `pnpm test:perf:changed:bench -- --worktree` 在不先提交的情况下对当前工作树变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU 性能文件（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元运行器写入 CPU + 堆内存性能文件（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整套件 Vitest 叶配置并写入分组持续时间数据加上每个配置的 JSON/日志产物。测试性能 Agent 在尝试修复慢速测试之前将此用作其基准。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在专注于性能的变更后比较分组报告。
- Gateway 集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择加入。
- `pnpm test:e2e`：运行 Gateway 端到端冒烟测试（多实例 WS/HTTP/节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应工作线程；使用 `OPENCLAW_E2E_WORKERS=<n>` 调整，使用 `OPENCLAW_E2E_VERBOSE=1` 获取详细日志。
- `pnpm test:live`：运行 Provider 实时测试（minimax/zai）。需要 API 密钥和 `LIVE=1`（或 Provider 特定的 `*_LIVE_TEST=1`）以取消跳过。
- `pnpm test:docker:all`：构建共享实时测试镜像，将 OpenClaw 打包一次为 npm tarball，构建/复用裸 Node/Git 运行器镜像加上将该 tarball 安装到 `/app` 的功能镜像，然后通过加权调度器使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker 烟雾通道。裸镜像（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用于安装器/更新/插件依赖通道；这些通道挂载预构建的 tarball 而不是使用复制的仓库源。功能镜像（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用于正常的已构建应用功能通道。`scripts/package-openclaw-for-docker.mjs` 是单一本地/CI 包打包器，并在 Docker 使用之前验证 tarball 加 `dist/postinstall-inventory.json`。Docker 通道定义存在于 `scripts/lib/docker-e2e-scenarios.mjs`；规划器逻辑存在于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行所选计划。`node scripts/test-docker-all.mjs --plan-json` 为所选通道、镜像类型、包/实时镜像需求和凭据检查发出调度器拥有的 CI 计划，而不构建或运行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽，默认为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制 Provider 敏感尾部池，默认为 10。重型通道上限默认为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；Provider 上限默认为通过 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 每个 Provider 一个重型通道。使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` 适用于更大的主机。如果一个通道在低并行度主机上超过有效的权重或资源上限，它仍然可以从空池启动，并将独自运行直到释放容量。通道启动默认错开 2 秒以避免本地 Docker 守护程序创建风暴；使用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。运行器默认预检 Docker，清理陈旧的 OpenClaw E2E 容器，每 30 秒发出活跃通道状态，在兼容通道之间共享 Provider CLI 工具缓存，默认重试一次瞬态实时 Provider 失败（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并将通道时间存储在 `.artifacts/docker-tests/lane-timings.json` 中以便在后续运行中按最长优先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 打印通道清单而不运行 Docker，`OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 调整状态输出，或 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 禁用时间复用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 仅用于确定性/本地通道，或 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 仅用于实时 Provider 通道；包别名为 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。仅实时模式将主要和尾部实时通道合并到一个最长优先池中，以便 Provider 桶可以将 Claude、Codex 和 Gemini 工作一起打包。运行器在第一次失败后停止调度新的池化通道，除非设置了 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，每个通道都有 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的实时/尾部通道使用更严格的每通道上限。CLI 后端 Docker 设置命令通过 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 有自己的超时（默认 180）。每个通道的日志、`summary.json`、`failures.json` 和阶段时间写在 `.artifacts/docker-tests/<run-id>/` 下；使用 `pnpm test:docker:timings <summary.json>` 检查慢速通道，使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 打印低成本的针对性重新运行命令。
- `pnpm test:docker:browser-cdp-snapshot`：构建基于 Chromium 的源 E2E 容器，启动原始 CDP 加上隔离的 Gateway，运行 `browser doctor --deep`，并验证 CDP 角色快照包含链接 URL、光标提升的可点击项、iframe 引用和帧元数据。
- CLI 后端实时 Docker 探针可以作为专注通道运行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 有匹配的 `:resume` 和 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行真实的代理聊天。需要可用的实时模型密钥（例如 `~/.profile` 中的 OpenAI），拉取外部 Open WebUI 镜像，且不像正常的单元/e2e 套件那样期望 CI 稳定。
- `pnpm test:docker:mcp-channels`：启动已种子的 Gateway 容器和第二个生成 `openclaw mcp serve` 的客户端容器，然后验证路由对话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由以及通过真实 stdio 桥的 Claude 风格 Channel + 权限通知。Claude 通知断言直接读取原始 stdio MCP 帧，以便冒烟反映桥实际发出的内容。
- `pnpm test:docker:upgrade-survivor`：将打包的 OpenClaw tarball 安装在旧用户脏固件上，无需实时 Provider 或 Channel 密钥即可运行包更新加非交互式 doctor，然后启动回环 Gateway 并检查 Agent、Channel 配置、Plugin 允许列表、工作区/Session 文件、过期旧 Plugin 依赖状态、启动和 RPC 状态是否存活。
- `pnpm test:docker:published-upgrade-survivor`：默认安装 `openclaw@latest`，在没有实时 Provider 或 Channel 密钥的情况下播种真实的现有用户文件，使用烘焙的 `openclaw config set` 命令配方配置该基准线，将该已发布安装更新到打包的 OpenClaw tarball，运行非交互式 doctor，写入 `.artifacts/upgrade-survivor/summary.json`，然后启动回环 Gateway 并检查已配置的意图、工作区/Session 文件、过期 Plugin 配置和旧版依赖状态、启动、`/healthz`、`/readyz` 和 RPC 状态是否存活或干净修复。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖一个基准线，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 扩展精确的本地矩阵（如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`），或使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 添加场景固件；reported-issues 集包括 `configured-plugin-installs`（验证已配置的外部 OpenClaw Plugin 在升级期间自动安装）和 `stale-source-plugin-shadow`（防止仅源 Plugin 影子破坏启动）。Package Acceptance 将这些公开为 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，并在将精确包规格传递给 Docker 通道之前解析元基准线 token（如 `last-stable-4` 或 `all-since-2026.4.23`）。
- `pnpm test:docker:update-migration`：在 `plugin-deps-cleanup` 场景的清理密集型 published-upgrade survivor 工具中运行，默认从 `openclaw@2026.4.23` 开始。独立的 `Update Migration` 工作流通过 `baselines=all-since-2026.4.23` 扩展此通道，以便从 `.23` 以后的每个稳定已发布包更新到候选包，并在完整发布 CI 之外证明已配置的 Plugin 依赖清理。
- `pnpm test:docker:plugins`：为本地路径、`file:`、带提升依赖的 npm 注册表包、git 移动引用、ClawHub 固件、市场更新和 Claude 包启用/检查运行安装/更新冒烟。
- `pnpm test:docker:skill-install`：在裸 Docker 运行器中安装打包的 OpenClaw tarball，禁用 `skills.install.allowUploadedArchives`，从实时 ClawHub 搜索解析当前的 Skill slug，通过 `openclaw skills install` 安装它，并验证 `SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json` 和 `skills info --json`。

## 本地 PR 门控

对于本地 PR 落地/门控检查，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较重的主机上不稳定，在将其视为回归之前重新运行一次，然后使用 `pnpm test <path/to/test>` 隔离。对于内存受限的主机，使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词："Reply with a single word: ok. No punctuation or extra text."

最后运行结果（2025-12-31，20 次运行）：

- minimax 中位数 1279ms（最小 1114，最大 2431）
- opus 中位数 2454ms（最小 1224，最大 3170）

## CLI 启动基准测试

脚本：[`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

用法：

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

预设：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`tasks --json`、`tasks list --json`、`tasks audit --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：两个预设

输出包括 `sampleCount`、avg、p50、p95、min/max、退出代码/信号分布，以及每个命令的最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 按运行写入 V8 性能文件，以便计时和性能文件捕获使用相同的测试套件。

已保存输出约定：

- `pnpm test:startup:bench:smoke` 在 `.artifacts/cli-startup-bench-smoke.json` 写入目标冒烟产物
- `pnpm test:startup:bench:save` 使用 `runs=5` 和 `warmup=1` 在 `.artifacts/cli-startup-bench-all.json` 写入完整套件产物
- `pnpm test:startup:bench:update` 使用 `runs=5` 和 `warmup=1` 刷新已检入的基准测试固件，位于 `test/fixtures/cli-startup-bench.json`

已检入固件：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与固件进行比较

## 引导 E2E（Docker）

Docker 是可选的；这只是容器化引导冒烟测试所需的。

在干净的 Linux 容器中完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

此脚本通过伪 tty 驱动交互式向导，验证配置/工作区/Session 文件，然后启动 Gateway 并运行 `openclaw health`。

## QR 导入冒烟（Docker）

确保维护的 QR 运行时辅助程序在支持的 Docker Node 运行时下加载（Node 24 默认，Node 22 兼容）：

```bash
pnpm test:docker:qr
```

## 相关

- [测试](/help/testing)
- [实时测试](/help/testing-live)
- [测试更新和 Plugin](/help/testing-updates-plugins)
