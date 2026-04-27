---
mmh3_hash: "5f67cbf2221ddcfa768db27d8885fc72"
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

## 临时 CLI 调试计时

OpenClaw 在 `src/cli/debug-timing.ts` 中保留了一个用于本地调查的小型辅助工具。它有意不接入 CLI 启动、命令路由或任何默认命令。仅在调试慢速命令时使用它，然后在提交行为变更前删除导入和 span。

当命令缓慢且你在决定是否使用 CPU 性能分析器或修复特定子系统之前需要快速的阶段分解时，使用此工具。

### 添加临时 span

在你正在调查的代码附近添加辅助工具。例如，在调试 `openclaw models list` 时，`src/commands/models/list.list-command.ts` 中的临时补丁可能如下所示：

```ts
// 仅用于临时调试。提交前请删除。
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

指南：

- 临时阶段名称以 `debug:` 为前缀。
- 只在疑似慢速的部分添加少量 span。
- 优先使用 `registry`、`auth_store` 或 `rows` 等宽泛阶段名，而非辅助函数名。
- 对同步工作使用 `time()`，对 Promise 使用 `timeAsync()`。
- 保持 stdout 干净。辅助工具写入 stderr，因此命令 JSON 输出保持可解析。
- 在提交最终修复 PR 之前删除临时导入和 span。
- 在解释优化的 issue 或 PR 中包含计时输出或简短摘要。

### 使用可读输出运行

可读模式最适合实时调试：

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

临时 `models list` 调查的示例输出：

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

此输出的发现：

| 阶段                                     |       耗时 | 含义                                                                           |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------ |
| `debug:models:list:auth_store`           |      20.3s | 认证配置文件存储加载是最大开销，应首先调查。                                   |
| `debug:models:list:ensure_models_json`   |       5.0s | 同步 `models.json` 的开销足够大，值得检查缓存或跳过条件。                      |
| `debug:models:list:load_model_registry`  |       5.9s | 注册表构建和 Provider 可用性工作也是有意义的开销。                             |
| `debug:models:list:read_registry_models` |       2.4s | 读取所有注册表模型并非免费，对 `--all` 可能很重要。                            |
| row append 阶段                          | 总计 3.2s  | 构建五个显示行仍需几秒，因此过滤路径值得仔细检查。                             |
| `debug:models:list:print_model_table`    |        0ms | 渲染不是瓶颈。                                                                 |

这些发现足以指导下一个补丁，无需在生产路径中保留计时代码。

### 使用 JSON 输出运行

当你想保存或比较计时数据时，使用 JSON 模式：

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

每一行 stderr 是一个 JSON 对象：

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### 提交前清理

在提交最终 PR 之前：

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

该命令应返回无临时插桩调用点，除非 PR 明确添加永久诊断界面。对于正常的性能修复，只保留行为变更、测试和带有计时证据的简短说明。

对于更深层的 CPU 热点，使用 Node 性能分析（`--cpu-prof`）或外部性能分析器，而不是添加更多计时包装器。

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

## 相关

- [故障排除](/help/troubleshooting)
- [FAQ](/help/faq)
