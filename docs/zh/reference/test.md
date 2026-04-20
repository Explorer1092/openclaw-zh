---
mmh3_hash: "57124a804349f7343bdbb3ac8ff16a5d"
summary: "如何在本地运行测试（vitest）以及何时使用 force/coverage 模式"
read_when:
  - 运行或修复测试
title: "测试"
---

# 测试

- 完整测试套件（套件、实时、Docker）：[测试](/help/testing)

- `pnpm test:force`：杀死任何占用默认控制端口的遗留 Gateway 进程，然后使用隔离的 Gateway 端口运行完整的 Vitest 套件，以便服务器测试不会与运行的实例冲突。当先前的 Gateway 运行占用端口 18789 时使用此选项。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元套件（通过 `vitest.unit.config.ts`）。全局阈值为 70% 行/分支/函数/语句。覆盖率排除集成繁重的入口点（CLI 布线、Gateway/Telegram 桥、webchat 静态服务器），以保持目标专注于可单元测试的逻辑。
- `pnpm test:coverage:changed`：仅对自 `origin/main` 以来变更的文件运行单元覆盖率。
- `pnpm test:changed`：将变更的 git 路径扩展到有作用域的 Vitest 通道，当差异仅涉及可路由的源/测试文件时。配置/设置变更仍然回退到原生根项目运行，以便在需要时布线编辑能够广泛重新运行。
- `pnpm test`：通过有作用域的 Vitest 通道路由显式文件/目录目标。无目标运行现在执行十一个顺序分片配置（`vitest.full-core-unit-src.config.ts`、`vitest.full-core-unit-security.config.ts`、`vitest.full-core-unit-ui.config.ts`、`vitest.full-core-unit-support.config.ts`、`vitest.full-core-support-boundary.config.ts`、`vitest.full-core-contracts.config.ts`、`vitest.full-core-bundled.config.ts`、`vitest.full-core-runtime.config.ts`、`vitest.full-agentic.config.ts`、`vitest.full-auto-reply.config.ts`、`vitest.full-extensions.config.ts`），而非一个大型根项目进程。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在通过只保留 `test/setup.ts` 的专用轻量通道路由，将运行时密集型用例保留在其现有通道上。
- 选定的 `plugin-sdk` 和 `commands` 辅助源文件也将 `pnpm test:changed` 映射到这些轻量通道中的明确兄弟测试，以便小型辅助编辑避免重新运行繁重的运行时支持套件。
- `auto-reply` 现在还拆分为三个专用配置（`core`、`top-level`、`reply`），以便回复测试套件不会主导较轻量的顶层状态/token/辅助测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在仓库配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 运行 `vitest.extensions.config.ts`。
- `pnpm test:extensions`：运行扩展/Plugin 套件。
- `pnpm test:perf:imports`：启用 Vitest 导入时长 + 导入分解报告，同时对显式文件/目录目标仍使用有作用域的通道路由。
- `pnpm test:perf:imports:changed`：同样的导入分析，但仅针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 将已路由的变更模式路径与相同提交 git 差异的原生根项目运行进行基准测试。
- `pnpm test:perf:changed:bench -- --worktree` 在不先提交的情况下对当前工作树变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU 性能文件（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元运行器写入 CPU + 堆内存性能文件（`.artifacts/vitest-runner-profile`）。
- Gateway 集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择加入。
- `pnpm test:e2e`：运行 Gateway 端到端冒烟测试（多实例 WS/HTTP/节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应工作线程；使用 `OPENCLAW_E2E_WORKERS=<n>` 调整，使用 `OPENCLAW_E2E_VERBOSE=1` 获取详细日志。
- `pnpm test:live`：运行提供商实时测试（minimax/zai）。需要 API 密钥和 `LIVE=1`（或提供商特定的 `*_LIVE_TEST=1`）以取消跳过。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行真实的代理聊天。需要可用的实时模型密钥（例如 `~/.profile` 中的 OpenAI），拉取外部 Open WebUI 镜像，且不像正常的单元/e2e 套件那样期望 CI 稳定。
- `pnpm test:docker:mcp-channels`：启动已种子的 Gateway 容器和第二个生成 `openclaw mcp serve` 的客户端容器，然后验证路由对话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由以及通过真实 stdio 桥的 Claude 风格 Channel + 权限通知。Claude 通知断言直接读取原始 stdio MCP 帧，以便冒烟反映桥实际发出的内容。

## 本地 PR 门控

对于本地 PR 落地/门控检查，运行：

- `pnpm check`
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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

预设：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
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

确保 `qrcode-terminal` 在支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```
