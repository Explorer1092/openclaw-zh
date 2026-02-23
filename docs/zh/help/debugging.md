---
mmh3_hash: "3776c98147c75b316938a38fd17d8d9c"
summary: "调试工具：监视模式、原始模型流和跟踪推理泄漏"
read_when:
  - 您需要检查原始模型输出以查找推理泄漏
  - 您想在迭代时以监视模式运行 Gateway
  - 您需要可重复的调试工作流
title: "调试"
---

# 调试

本页介绍流式输出的调试助手,特别是当 Provider 将推理混入普通文本时。

## 运行时调试覆盖

在聊天中使用 `/debug` 设置**仅运行时**配置覆盖（内存,不是磁盘）。`/debug` 默认禁用;使用 `commands.debug: true` 启用。当您需要切换隐晦设置而不编辑 `openclaw.json` 时,这很方便。

示例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 清除所有覆盖并返回磁盘配置。

## Gateway 监视模式

为了快速迭代,在文件监视器下运行 Gateway:

```bash
pnpm gateway:watch
```

这映射到:

```bash
node --watch-path src --watch-path tsconfig.json --watch-path package.json --watch-preserve-output scripts/run-node.mjs gateway --force
```

在 `gateway:watch` 之后添加任何 Gateway CLI 标志,它们将在每次重启时传递。

## Dev 配置文件 + dev Gateway (--dev)

使用 dev 配置文件隔离状态并启动安全、可丢弃的调试设置。有**两个** `--dev` 标志:

- **全局 `--dev`（配置文件）:** 在 `~/.openclaw-dev` 下隔离状态,并将 Gateway 端口默认为 `19001`（派生端口随之移动）。
- **`gateway --dev`:** 告诉 Gateway 在缺失时自动创建默认配置 + 工作空间（并跳过 BOOTSTRAP.md）。

推荐流程（dev 配置文件 + dev 引导）:

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果您还没有全局安装,请通过 `pnpm openclaw ...` 运行 CLI。

这会做什么:

1. **配置文件隔离**（全局 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas 相应移动）

2. **Dev 引导**（`gateway --dev`）
   - 如果缺失则写入最小配置（`gateway.mode=local`,绑定回环）。
   - 将 `agent.workspace` 设置为 dev 工作空间。
   - 设置 `agent.skipBootstrap=true`（无 BOOTSTRAP.md）。
   - 如果缺失则播种工作空间文件: `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 默认身份: **C3-PO**（协议机器人）。
   - 在 dev 模式下跳过 Channel Providers（`OPENCLAW_SKIP_CHANNELS=1`）。

重置流程（全新开始）:

```bash
pnpm gateway:dev:reset
```

注意: `--dev` 是一个**全局**配置文件标志,被某些运行器吃掉。如果您需要明确拼写出来,请使用环境变量形式:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` 擦除配置、凭据、会话和 dev 工作空间（使用 `trash`,不是 `rm`）,然后重新创建默认 dev 设置。

提示: 如果非 dev Gateway 已经在运行（launchd/systemd）,请先停止它:

```bash
openclaw gateway stop
```

## 原始流日志记录（OpenClaw）

OpenClaw 可以在任何过滤/格式化之前记录**原始助手流**。这是查看推理是否作为纯文本增量到达（或作为单独的思考块）的最佳方式。

通过 CLI 启用它:

```bash
pnpm gateway:watch --raw-stream
```

可选路径覆盖:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

等效环境变量:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

默认文件:

`~/.openclaw/logs/raw-stream.jsonl`

## 原始块日志记录（pi-mono）

要在解析为块之前捕获**原始 OpenAI 兼容块**,pi-mono 公开一个单独的记录器:

```bash
PI_RAW_STREAM=1
```

可选路径:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

默认文件:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注意: 这仅由使用 pi-mono 的 `openai-completions` Provider 的进程发出。

## 安全注意事项

- 原始流日志可以包含完整的提示、工具输出和用户数据。
- 保持日志本地并在调试后删除它们。
- 如果您共享日志,请先清理密钥和 PII。
