---
read_when:
  - 运行或修复测试
summary: 如何在本地运行测试（vitest）以及何时使用 force/coverage 模式
title: 测试
x-i18n:
  generated_at: "2026-02-03T10:09:52Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: e98276f974a776246609228583f64ad4988c70adc41391c3422a4eea39f09675
  source_path: reference/test.md
  workflow: 15
---

# 测试

- 完整测试套件（测试集、实时测试、Docker）：[测试](/help/testing)

- `pnpm test:force`：终止任何占用默认控制端口的遗留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 套件，这样服务器测试不会与正在运行的实例冲突。当之前的 Gateway 网关运行占用了端口 18789 时使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行 Vitest。全局阈值为 70% 的行/分支/函数/语句覆盖率。覆盖率排除了集成密集型入口点（CLI 连接、gateway/telegram 桥接、webchat 静态服务器），以保持目标集中在可单元测试的逻辑上。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS/HTTP/节点配对）。
- `pnpm test:live`：运行提供商实时测试（minimax/zai）。需要 API 密钥和 `LIVE=1`（或提供商特定的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:openwebui`：启动容器化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行真实的代理聊天。需要可用的实时模型密钥（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，不像普通的单元/e2e 套件那样预期在 CI 中稳定。
- `pnpm test:docker:mcp-channels`：启动一个预置的 Gateway 网关容器和一个生成 `openclaw mcp serve` 的第二个客户端容器，然后验证路由对话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio 桥接的 Claude 风格渠道和权限通知。Claude 通知断言直接读取原始 stdio MCP 帧，以确保冒烟测试反映桥接实际发出的内容。

## 模型延迟基准测试（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词："Reply with a single word: ok. No punctuation or extra text."

上次运行（2025-12-31，20 次）：

- minimax 中位数 1279ms（最小 1114，最大 2431）
- opus 中位数 2454ms（最小 1224，最大 3170）

## 新手引导 E2E（Docker）

Docker 是可选的；这仅用于容器化的新手引导冒烟测试。

在干净的 Linux 容器中完整的冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

此脚本通过伪终端驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保 `qrcode-terminal` 在 Docker 中的 Node 22+ 下加载：

```bash
pnpm test:docker:qr
```
