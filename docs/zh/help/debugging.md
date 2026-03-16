---
mmh3_hash: "c60c741fadb518ff55f8759846c967f9"
summary: "调试工具:监视模式、原始模型流和跟踪推理泄漏"
read_when:
  - 您需要检查原始模型输出以查找推理泄漏
  - 您想在迭代时以监视模式运行 Gateway
  - 您需要可重复的调试工作流
title: "调试"
---

# 调试

本页面涵盖流输出的调试助手,特别是当 provider 将推理混入正常文本时。

## 运行时调试覆盖

在聊天中使用 `/debug` 设置**仅运行时**配置覆盖(内存,非磁盘)。
`/debug` 默认禁用;使用 `commands.debug: true` 启用。
当您需要切换晦涩设置而不编辑 `openclaw.json` 时很方便。

示例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 清除所有覆盖并返回到磁盘上的配置。

## Gateway 监视模式

为了快速迭代,在文件监视器下运行 gateway:

```bash
pnpm gateway:watch
```

这映射到:

```bash
node scripts/watch-node.mjs gateway --force
```

监视器在 `src/` 下的构建相关文件、扩展源文件、扩展 `package.json` 和 `openclaw.plugin.json` 元数据、`tsconfig.json`、`package.json` 以及 `tsdown.config.ts` 上重启。扩展元数据更改在不强制 `tsdown` 重建的情况下重启 gateway;源代码和配置更改仍然先重建 `dist`。

在 `gateway:watch` 后添加任何 gateway CLI flags,它们将在每次重启时传递。

## 开发 profile + 开发 gateway (--dev)

使用 dev profile 隔离状态并启动安全的、可丢弃的调试设置。有**两个** `--dev` flags:

- **全局 `--dev`(profile):** 将状态隔离在 `~/.openclaw-dev` 下,并将 gateway 端口默认为 `19001`(派生端口随之移动)。
- **`gateway --dev`: 告诉 Gateway 在缺失时自动创建默认配置 + workspace**(并跳过 BOOTSTRAP.md)。

推荐流程(dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果您还没有全局安装,通过 `pnpm openclaw ...` 运行 CLI。

这做了什么:

1. **Profile 隔离**(全局 `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`(browser/canvas 相应移动)

2. **开发 bootstrap**(`gateway --dev`)
   - 如果缺失,写入最小配置(`gateway.mode=local`,绑定 loopback)。
   - 将 `agent.workspace` 设置为开发 workspace。
   - 设置 `agent.skipBootstrap=true`(无 BOOTSTRAP.md)。
   - 如果缺失,初始化 workspace 文件:
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 默认身份:**C3-PO**(协议机器人)。
   - 在 dev 模式下跳过 channel providers(`OPENCLAW_SKIP_CHANNELS=1`)。

重置流程(全新开始):

```bash
pnpm gateway:dev:reset
```

注意:`--dev` 是**全局** profile flag,被一些运行器消耗。
如果您需要明确拼写,使用 env var 形式:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` 擦除配置、凭据、sessions 和 dev workspace(使用 `trash`,而非 `rm`),然后重新创建默认 dev 设置。

提示:如果非 dev gateway 已在运行(launchd/systemd),先停止它:

```bash
openclaw gateway stop
```

## 原始流日志(OpenClaw)

OpenClaw 可以在任何过滤/格式化之前记录**原始 assistant 流**。
这是查看推理是否以纯文本 deltas(或作为单独的 thinking blocks)到达的最佳方式。

通过 CLI 启用:

```bash
pnpm gateway:watch --raw-stream
```

可选路径覆盖:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

等效 env vars:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

默认文件:

`~/.openclaw/logs/raw-stream.jsonl`

## 原始 chunk 日志(pi-mono)

要在将**原始 OpenAI 兼容 chunks** 解析为 blocks 之前捕获它们,pi-mono 提供一个单独的记录器:

```bash
PI_RAW_STREAM=1
```

可选路径:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

默认文件:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注意:这仅由使用 pi-mono 的 `openai-completions` provider 的进程发出。

## 安全注意事项

- 原始流日志可以包含完整的 prompts、tool 输出和用户数据。
- 保持日志在本地并在调试后删除它们。
- 如果您分享日志,先清除 secrets 和 PII。
