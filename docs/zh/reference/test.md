---
title: "测试"
sidebarTitle: "测试参考"
mmh3_hash: "263d17ed277a7b98d9e12b8ddf7026ec"
summary: "如何在本地运行测试(vitest)以及何时使用 force/coverage 模式"
read_when: ["运行或修复测试"]
---
# 测试

- 完整测试套件(套件、实时、Docker): [测试](/testing)

- `pnpm test:force`: 杀死任何占用默认控制端口的遗留网关进程,然后使用隔离的网关端口运行完整的 Vitest 套件,以便服务器测试不会与运行的实例冲突。当先前的网关运行占用端口 18789 时使用此选项。
- `pnpm test:coverage`: 使用 V8 覆盖率运行 Vitest。全局阈值为 70% 行/分支/函数/语句。覆盖率排除集成繁重的入口点(CLI 布线、网关/telegram 桥、webchat 静态服务器),以保持目标专注于可单元测试的逻辑。
- `pnpm test:e2e`: 运行网关端到端冒烟测试(多实例 WS/HTTP/节点配对)。
- `pnpm test:live`: 运行提供程序实时测试(minimax/zai)。需要 API 密钥和 `LIVE=1`(或提供程序特定的 `*_LIVE_TEST=1`)以取消跳过。

## 模型延迟基准(本地密钥)

脚本: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法:
- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境: `MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示: "Reply with a single word: ok. No punctuation or extra text."

上次运行(2025-12-31,20 次运行):
- minimax 中位数 1279ms(最小 1114,最大 2431)
- opus 中位数 2454ms(最小 1224,最大 3170)

## 引导 E2E(Docker)

Docker 是可选的;这仅用于容器化引导冒烟测试。

在干净的 Linux 容器中完整冷启动流程:

```bash
scripts/e2e/onboard-docker.sh
```

此脚本通过伪 tty 驱动交互式向导,验证配置/工作空间/会话文件,然后启动网关并运行 `openclaw health`。

## QR 导入冒烟(Docker)

确保 `qrcode-terminal` 在 Docker 的 Node 22+ 下加载:

```bash
pnpm test:docker:qr
```
