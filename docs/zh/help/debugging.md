---
mmh3_hash: "79814e7ff07d528ad15cce542429268d"
title: "调试"
summary: "调试工具：监视模式、原始模型流和追踪推理泄漏"
read_when:
  - 你需要检查原始模型输出以查找推理泄漏
  - 你想在迭代时以监视模式运行 Gateway
  - 你需要可重复的调试工作流
---

流式输出的调试助手，特别是当 Provider 将推理混入正常文本时。

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

## Plugin 生命周期追踪

当 Plugin 生命周期命令感觉缓慢，且你需要对 Plugin 元数据、发现、注册表、运行时镜像、配置变更和刷新工作进行内置阶段分解时，使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。该追踪是可选入的，写入 stderr，因此 JSON 命令输出保持可解析。

示例：

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

示例输出：

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

在使用 CPU 性能分析器之前，先用此工具进行 Plugin 生命周期调查。如果命令从源码检出运行，优先使用 `pnpm build` 后的 `node dist/entry.js ...` 测量已构建的运行时；`pnpm openclaw ...` 也会测量源码运行器的开销。

## CLI 启动和命令性能分析

当命令感觉缓慢时，使用内置的启动基准测试：

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

对于通过普通源码运行器的一次性性能分析，设置 `OPENCLAW_RUN_NODE_CPU_PROF_DIR`：

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

源码运行器添加 Node CPU 性能分析标志，并为命令写入 `.cpuprofile` 文件。在向命令代码添加临时插桩之前先使用此方法。

对于看起来像同步文件系统或模块加载器工作的启动停顿，通过源码运行器添加 Node 的同步 I/O 追踪标志：

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` 默认对被监视的 Gateway 子进程禁用此标志。当你明确需要监视模式中的 Node 同步 I/O 追踪输出时，设置 `OPENCLAW_TRACE_SYNC_IO=1`。

## Gateway 监视模式

为了快速迭代，在文件监视器下运行 Gateway：

```bash
pnpm gateway:watch
```

默认情况下，这会启动或重启名为 `openclaw-gateway-watch-main` 的 tmux 会话（或特定配置文件/端口变体，如 `openclaw-gateway-watch-dev-19001`），并从交互式终端自动附加。非交互式 shell、CI 和 agent exec 调用保持分离并打印附加说明。需要时手动附加：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux 面板运行原始监视器：

```bash
node scripts/watch-node.mjs gateway --force
```

不需要 tmux 时使用前台模式：

```bash
pnpm gateway:watch:raw
# 或
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

保持 tmux 管理的同时禁用自动附加：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

调试启动/运行时热点时对被监视的 Gateway CPU 时间进行性能分析：

```bash
pnpm gateway:watch --benchmark
```

监视包装器在 `--benchmark` 到达 Gateway 之前消耗它，并在 `.artifacts/gateway-watch-profiles/` 下为每次 Gateway 子进程退出写入一个 V8 `.cpuprofile` 文件。停止或重启被监视的 Gateway 以刷新当前配置文件，然后用 Chrome DevTools 或 Speedscope 打开它：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

当你想将配置文件存放在其他位置时使用 `--benchmark-dir <path>`。当你希望被测子进程跳过默认的 `--force` 端口清理并在 Gateway 端口已被占用时快速失败时使用 `--benchmark-no-force`。基准模式默认抑制同步 I/O 追踪输出。当你明确希望同时获得 CPU 配置文件和 Node 同步 I/O 堆栈追踪时，在 `--benchmark` 中设置 `OPENCLAW_TRACE_SYNC_IO=1`。在基准模式下，这些追踪块写入基准目录下的 `gateway-watch-output.log`，并从终端面板过滤；普通 Gateway 日志仍然可见。

tmux 包装器将常见的非敏感运行时选择器（如 `OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`）携带到面板中。将 Provider 凭据放在普通的配置文件/配置中，或使用原始前台模式处理一次性的临时密钥。如果被监视的 Gateway 在启动期间退出，监视器会运行一次 `openclaw doctor --fix --non-interactive` 并重启 Gateway 子进程。当你想要不带仅开发修复通道的原始启动失败时，使用 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`。托管的 tmux 面板也默认使用彩色 Gateway 日志以提高可读性；在启动 `pnpm gateway:watch` 时设置 `FORCE_COLOR=0` 以禁用 ANSI 输出。

监视器在 `src/` 下的构建相关文件、扩展源文件、扩展 `package.json` 和 `openclaw.plugin.json` 元数据、`tsconfig.json`、`package.json` 以及 `tsdown.config.ts` 更改时重启。扩展元数据更改会在不强制执行 `tsdown` 重建的情况下重启 Gateway；源码和配置更改仍会先重建 `dist`。

在 `gateway:watch` 后添加任何 Gateway CLI 标志，它们将在每次重启时传递。重新运行相同的监视命令会重新创建命名的 tmux 面板，原始监视器仍保持其单监视器锁，因此重复的监视器父级会被替换而不是堆积。

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

<Note>
`--dev` 是一个**全局**配置文件标志，会被某些运行器吃掉。如果需要明确指定，请使用环境变量形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 会清除配置、凭据、Session 和开发工作区（使用 `trash`，不是 `rm`），然后重新创建默认开发设置。

<Tip>
如果非开发 Gateway 已在运行（launchd 或 systemd），请先停止它：

```bash
openclaw gateway stop
```

</Tip>

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

## 在 VSCode 中调试

由于构建过程的一部分，许多生成的文件最终会使用哈希名称，因此在基于 VSCode 的 IDE 中启用调试需要 Source Map。内置的 `launch.json` 配置以 Gateway 服务为目标，但可以快速适配到其他用途：

1. **重建并调试 Gateway** - 创建新构建后调试 Gateway 服务
2. **调试 Gateway** - 调试已有构建的 Gateway 服务

### 设置

默认的**重建并调试 Gateway** 配置是开箱即用的，它会自动删除 `/dist` 文件夹，并在启用调试的情况下重建项目：

1. 从活动栏打开**运行和调试**面板，或按 `Ctrl`+`Shift`+`D`
2. 在 IDE 中，确保配置下拉菜单中选择了**重建并调试 Gateway**，然后按**开始调试**按钮

或者，如果你希望手动管理构建和调试过程：

1. 打开终端并启用 Source Map：
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. 在同一终端中重建项目：`pnpm clean:dist && pnpm build`
3. 在 IDE 中，在**运行和调试**配置下拉菜单中选择**调试 Gateway** 选项，然后按**开始调试**按钮

现在你可以在 TypeScript 源文件（`src/` 目录）中设置断点，调试器将通过 Source Map 正确将断点映射到编译后的 JavaScript。你将能够检查变量、单步执行代码并检查调用堆栈。

### 说明

- 如果使用**"重建并调试 Gateway"**选项——每次启动调试器时，它都会完全删除 `/dist` 文件夹，并在启动 Gateway 之前运行完整的启用 Source Map 的 `pnpm build`
- 如果使用**"调试 Gateway"**选项——可以随时启动和停止调试会话而不影响 `/dist` 文件夹，但必须使用单独的终端进程来启用调试和管理构建周期
- 修改 `launch.json` 的 `args` 设置以调试项目的其他部分
- 如果需要将构建的 OpenClaw CLI 用于其他任务（即如果你的调试会话生成新的 auth token，则使用 `dashboard --no-open`），可以在另一个终端中以 `node ./openclaw.mjs` 运行它，或创建一个 shell 别名，如 `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## 相关

- [故障排除](/help/troubleshooting)
- [FAQ](/help/faq)
