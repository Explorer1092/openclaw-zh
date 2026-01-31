---
title: "调试"
mmh3_hash: "9ce1c2781330b751584b02e76614311d"
summary: "调试工具:监视模式、原始模型流和跟踪推理泄漏"
read_when:
  - 您需要检查原始模型输出以查找推理泄漏
  - 您希望在迭代时以监视模式运行网关
  - 您需要可重复的调试工作流
---

# 调试

本页介绍用于流式输出的调试助手,特别是当提供程序将推理混合到普通文本中时。

## 运行时调试覆盖

在聊天中使用 `/debug` 设置**仅运行时**配置覆盖(内存,而非磁盘)。
`/debug` 默认禁用;使用 `commands.debug: true` 启用。
当您需要在不编辑 `openclaw.json` 的情况下切换不常见的设置时,这很方便。

示例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 清除所有覆盖并返回到磁盘配置。

## 网关监视模式

为了快速迭代,在文件监视器下运行网关:

```bash
pnpm gateway:watch --force
```

这映射到:

```bash
tsx watch src/entry.ts gateway --force
```

在 `gateway:watch` 之后添加任何网关 CLI 标志,它们将在每次重启时传递。

## 开发配置文件 + 开发网关 (--dev)

使用开发配置文件来隔离状态并为调试启动一个安全、可丢弃的设置。有**两个** `--dev` 标志:

- **全局 `--dev`(配置文件):** 将状态隔离在 `~/.openclaw-dev` 下,并将网关端口默认为 `19001`(派生端口随之变化)。
- **`gateway --dev`:告诉网关在缺少时自动创建默认配置 + 工作区**(并跳过 BOOTSTRAP.md)。

推荐流程(开发配置文件 + 开发引导):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果您还没有全局安装,请通过 `pnpm openclaw ...` 运行 CLI。

这做了什么:

1) **配置文件隔离**(全局 `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`(浏览器/画布相应变化)

2) **开发引导**(`gateway --dev`)
   - 如果缺少,则写入最小配置(`gateway.mode=local`,绑定 loopback)。
   - 将 `agent.workspace` 设置为开发工作区。
   - 设置 `agent.skipBootstrap=true`(无 BOOTSTRAP.md)。
   - 如果缺少,则为工作区文件播种:
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 默认身份:**C3‑PO**(协议机器人)。
   - 在开发模式下跳过通道提供程序(`OPENCLAW_SKIP_CHANNELS=1`)。

重置流程(全新开始):

```bash
pnpm gateway:dev:reset
```

注意:`--dev` 是**全局**配置文件标志,会被某些运行器吃掉。
如果您需要明确说明,请使用环境变量形式:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` 擦除配置、凭证、会话和开发工作区(使用 `trash`,而非 `rm`),然后重新创建默认开发设置。

提示:如果非开发网关已经在运行(launchd/systemd),请先停止它:

```bash
openclaw gateway stop
```

## 原始流日志记录(OpenClaw)

OpenClaw 可以在任何过滤/格式化之前记录**原始助手流**。
这是查看推理是否作为纯文本增量(或作为单独的思考块)到达的最佳方法。

通过 CLI 启用:

```bash
pnpm gateway:watch --force --raw-stream
```

可选路径覆盖:

```bash
pnpm gateway:watch --force --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

等效环境变量:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

默认文件:

`~/.openclaw/logs/raw-stream.jsonl`

## 原始块日志记录(pi-mono)

要在将**原始 OpenAI 兼容块**解析为块之前捕获它们,pi-mono 公开了一个单独的记录器:

```bash
PI_RAW_STREAM=1
```

可选路径:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

默认文件:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注意:这仅由使用 pi-mono 的 `openai-completions` 提供程序的进程发出。

## 安全注意事项

- 原始流日志可以包含完整的提示、工具输出和用户数据。
- 将日志保留在本地,并在调试后删除它们。
- 如果您共享日志,请先清除机密和 PII。
