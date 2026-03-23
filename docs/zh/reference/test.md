---
mmh3_hash: "6ba49c4408086170b4a3b3272f819537"
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
- `pnpm test:changed`：使用 `--changed origin/main` 运行包装器。基础 Vitest 配置将包装器清单/配置文件视为 `forceRerunTriggers`，因此需要时调度器变更仍会广泛重新运行。
- `pnpm test`：运行完整包装器。它在 git 中只保留一个小的行为覆盖清单，然后使用已检入的计时快照将最重的已测量单元文件分配到专用通道。
- 单元文件在包装器中默认使用 `threads`；在 `test/fixtures/test-parallel.behavior.json` 中记录仅 fork 的例外。
- `pnpm test:channels` 现在通过 `vitest.channels.config.ts` 默认使用 `threads`；2026 年 3 月 22 日的直接完整套件控制运行通过，没有 channel 特定的 fork 例外。
- `pnpm test:extensions` 通过包装器运行，并在 `test/fixtures/test-parallel.behavior.json` 中记录扩展 fork 专用例外；共享扩展通道仍然默认使用 `threads`。
- `pnpm test:extensions`：运行扩展/插件套件。
- `pnpm test:perf:imports`：为包装器启用 Vitest 导入时长 + 导入分解报告。
- `pnpm test:perf:imports:changed`：与导入分析相同，但仅针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU 性能文件（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元运行器写入 CPU + 堆内存性能文件（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:update-timings`：刷新 `scripts/test-parallel.mjs` 使用的已检入慢文件计时快照。
- Gateway 集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择加入。
- `pnpm test:e2e`：运行 Gateway 端到端冒烟测试（多实例 WS/HTTP/节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `forks` + 自适应工作线程；使用 `OPENCLAW_E2E_WORKERS=<n>` 调整，使用 `OPENCLAW_E2E_VERBOSE=1` 获取详细日志。
- `pnpm test:live`：运行提供商实时测试（minimax/zai）。需要 API 密钥和 `LIVE=1`（或提供商特定的 `*_LIVE_TEST=1`）以取消跳过。

## 本地 PR 门控

对于本地 PR 落地/门控检查，运行：

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载繁重的主机上出现波动，请在将其视为回归之前重新运行一次，然后使用 `pnpm vitest run <path/to/test>` 隔离。对于内存受限的主机，使用：

- `OPENCLAW_TEST_PROFILE=low OPENCLAW_TEST_SERIAL_GATEWAY=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE=0 pnpm test:changed`

## 模型延迟基准（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示："Reply with a single word: ok. No punctuation or extra text."

上次运行（2025-12-31，20 次运行）：

- minimax 中位数 1279ms（最小 1114，最大 2431）
- opus 中位数 2454ms（最小 1224，最大 3170）

## CLI 启动基准

脚本：[`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

用法：

- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --entry dist/entry.js --timeout-ms 45000`

此基准测试以下命令：

- `--version`
- `--help`
- `health --json`
- `status --json`
- `status`

输出包括每个命令的平均值、p50、p95、最小/最大值以及退出码/信号分布。

## 引导 E2E（Docker）

Docker 是可选的；这仅用于容器化引导冒烟测试。

在干净的 Linux 容器中完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

此脚本通过伪 tty 驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 并运行 `openclaw health`。

## QR 导入冒烟（Docker）

确保 `qrcode-terminal` 在受支持的 Docker Node 运行时（Node 24 默认，Node 22 兼容）下加载：

```bash
pnpm test:docker:qr
```
