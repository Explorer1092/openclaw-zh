---
mmh3_hash: "8e2b80224f3ddacc5dd9f5c9e5fb00c6"
title: "调试"
summary: "调试工具：监视模式、原始模型流和追踪推理泄漏"
read_when:
  - 你需要检查原始模型输出以查找推理泄漏
  - 你想在迭代时以监视模式运行 Gateway
  - 你需要可重复的调试工作流
---

# 调试

本页涵盖流式输出的调试助手，特别是当 Provider 将推理混入正常文本时。

## 运行时调试覆盖

在聊天中使用 `/debug` 设置**仅运行时**的配置覆盖（内存中，非磁盘）。`/debug` 默认禁用；使用 `commands.debug: true` 启用。当你需要切换晦涩设置而不编辑 `openclaw.json` 时非常方便。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 清除所有覆盖并返回到磁盘上的配置。

## Session 追踪输出

当你想在一个 Session 中查看插件拥有的追踪/调试行而不开启完整的详细模式时，使用 `/trace`。

示例：

```text
/trace
/trace on
/trace off
```

使用 `/trace` 进行插件诊断，例如 Active Memory 调试摘要。继续使用 `/verbose` 查看普通的详细状态/工具输出，继续使用 `/debug` 进行仅运行时的配置覆盖。

## Gateway 监视模式

为了快速迭代，在文件监视器下运行 Gateway：

```bash
pnpm gateway:watch
```

这映射到：

```bash
node scripts/watch-node.mjs gateway --force
```

监视器在 `src/` 下的构建相关文件、扩展源文件、扩展 `package.json` 和 `openclaw.plugin.json` 元数据、`tsconfig.json`、`package.json` 以及 `tsdown.config.ts` 更改时重启。扩展元数据更改会在不强制执行 `tsdown` 重建的情况下重启 Gateway；源码和配置更改仍会先重建 `dist`。

在 `gateway:watch` 后添加任何 Gateway CLI 标志，它们将在每次重启时传递。为同一仓库/标志集重新运行相同的监视命令现在会替换旧的监视器，而不是留下重复的监视器父级。

## 开发配置文件 + 开发 Gateway（--dev）

使用开发配置文件来隔离状态并为调试启动安全、一次性的设置。有**两个** `--dev` 标志：

- **全局 `--dev`（配置文件）**：将状态隔离在 `~/.openclaw-dev` 下，并将 Gateway 端口默认为 `19001`（派生端口随之移动）。
- **`gateway --dev`：告诉 Gateway 在缺失时自动创建默认配置 + 工作区**（并跳过 BOOTSTRAP.md）。

推荐流程（开发配置文件 + 开发引导）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你还没有全局安装，通过 `pnpm openclaw ...` 运行 CLI。

这做了什么：

1. **配置文件隔离**（全局 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（浏览器/Canvas 相应移动）

2. **开发引导**（`gateway --dev`）
   - 如果缺失则写入最小配置（`gateway.mode=local`，绑定 loopback）。
   - 将 `agent.workspace` 设置为开发工作区。
   - 设置 `agent.skipBootstrap=true`（无 BOOTSTRAP.md）。
   - 如果缺失则为工作区文件播种：`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 默认身份：**C3-PO**（协议机器人）。
   - 在开发模式下跳过 Channel Provider（`OPENCLAW_SKIP_CHANNELS=1`）。

重置流程（全新开始）：

```bash
pnpm gateway:dev:reset
```

注意：`--dev` 是一个**全局**配置文件标志，会被某些运行器吃掉。如果需要明确指定，请使用环境变量形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` 会清除配置、凭据、会话和开发工作区（使用 `trash`，不是 `rm`），然后重新创建默认开发设置。

提示：如果非开发 Gateway 已在运行（launchd/systemd），请先停止它：

```bash
openclaw gateway stop
```

## 原始流日志（OpenClaw）

OpenClaw 可以在任何过滤/格式化之前记录**原始助手流**。这是查看推理是否以纯文本增量（或作为单独的思考块）到达的最佳方式。

通过 CLI 启用：

```bash
pnpm gateway:watch --raw-stream
```

可选路径覆盖：

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

等效的环境变量：

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

默认文件：

`~/.openclaw/logs/raw-stream.jsonl`

## 原始块日志（pi-mono）

要在解析成块之前捕获**原始 OpenAI 兼容块**，pi-mono 公开了一个单独的记录器：

```bash
PI_RAW_STREAM=1
```

可选路径：

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

默认文件：

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注意：这仅由使用 pi-mono 的 `openai-completions` Provider 的进程发出。

## 安全说明

- 原始流日志可能包含完整的提示、工具输出和用户数据。
- 将日志保留在本地并在调试后删除。
- 如果共享日志，请先清除密钥和个人信息。
