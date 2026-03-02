---
mmh3_hash: "c02d76087017fcbda713b2909348baab"
summary: "如何在本地运行测试（vitest）以及何时使用 force/coverage 模式"
read_when:
  - 运行或修复测试
title: "测试"
---

# 测试

- 完整测试套件（套件、实时、Docker）：[测试](/help/testing)

- `pnpm test:force`：杀死任何占用默认控制端口的遗留 Gateway 进程，然后使用隔离的 Gateway 端口运行完整的 Vitest 套件，以便服务器测试不会与运行的实例冲突。当先前的 Gateway 运行占用端口 18789 时使用此选项。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元套件（通过 `vitest.unit.config.ts`）。全局阈值为 70% 行/分支/函数/语句。覆盖率排除集成繁重的入口点（CLI 布线、Gateway/Telegram 桥、webchat 静态服务器），以保持目标专注于可单元测试的逻辑。
- Node 24+ 上的 `pnpm test`：OpenClaw 自动禁用 Vitest `vmForks` 并使用 `forks`，以避免 `ERR_VM_MODULE_LINK_FAILURE` / `module is already linked`。您可以使用 `OPENCLAW_TEST_VM_FORKS=0|1` 强制设置行为。
- `pnpm test`：默认运行快速核心单元通道，以便快速获得本地反馈。
- `pnpm test:channels`：运行频道密集型套件。
- `pnpm test:extensions`：运行扩展/插件套件。
- Gateway 集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择加入。
- `pnpm test:e2e`：运行 Gateway 端到端冒烟测试（多实例 WS/HTTP/节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `vmForks` + 自适应工作线程；使用 `OPENCLAW_E2E_WORKERS=<n>` 调整，使用 `OPENCLAW_E2E_VERBOSE=1` 获取详细日志。
- `pnpm test:live`：运行提供商实时测试（minimax/zai）。需要 API 密钥和 `LIVE=1`（或提供商特定的 `*_LIVE_TEST=1`）以取消跳过。

## 本地 PR 门控

对于本地 PR 落地/门控检查，运行：

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载繁重的主机上出现波动，请在将其视为回归之前重新运行一次，然后使用 `pnpm vitest run <path/to/test>` 隔离。对于内存受限的主机，使用：

- `OPENCLAW_TEST_PROFILE=low OPENCLAW_TEST_SERIAL_GATEWAY=1 pnpm test`

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

此脚本通过伪 tty 驱动交互式向导，验证配置/工作空间/会话文件，然后启动 Gateway 并运行 `openclaw health`。

## QR 导入冒烟（Docker）

确保 `qrcode-terminal` 在 Docker 的 Node 22+ 下加载：

```bash
pnpm test:docker:qr
```
