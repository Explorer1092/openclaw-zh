---
mmh3_hash: "b757e4ef396d7ca3d6cacdec7e1b9008"
summary: "Hooks：用于命令和生命周期事件的事件驱动自动化"
read_when:
  - 你需要为 /new、/reset、/stop 和 Agent 生命周期事件设置事件驱动自动化
  - 你想构建、安装或调试 Hooks
title: "Hooks"
---

Hooks 是在 Gateway 内部发生某些事情时运行的小型脚本。它们可以从目录中发现，并可通过 `openclaw hooks` 检查。在你启用 Hooks 或配置至少一个 Hook 条目、Hook 包、旧版处理程序或额外 Hook 目录之后，Gateway 才会加载内部 Hooks。

OpenClaw 中有两种 Hooks：

- **内部 Hooks**（本页）：当 Agent 事件触发时在 Gateway 内部运行，如 `/new`、`/reset`、`/stop` 或生命周期事件。
- **Webhooks**：允许其他系统在 OpenClaw 中触发工作的外部 HTTP 端点。参见 [Webhooks](/automation/cron-jobs#webhooks)。

Hooks 也可以捆绑在插件中。`openclaw hooks list` 会同时显示独立 Hooks 和插件管理的 Hooks。

## 快速开始

```bash
# 列出可用 Hooks
openclaw hooks list

# 启用一个 Hook
openclaw hooks enable session-memory

# 检查 Hook 状态
openclaw hooks check

# 获取详细信息
openclaw hooks info session-memory
```

## 事件类型

| 事件                     | 触发时机                                               |
| ------------------------ | ------------------------------------------------------ |
| `command:new`            | 发出 `/new` 命令                                       |
| `command:reset`          | 发出 `/reset` 命令                                     |
| `command:stop`           | 发出 `/stop` 命令                                      |
| `command`                | 任何命令事件（通用监听器）                             |
| `session:compact:before` | 压缩汇总历史之前                                       |
| `session:compact:after`  | 压缩完成之后                                           |
| `session:patch`          | 修改 Session 属性时                                    |
| `agent:bootstrap`        | 注入工作区引导文件之前                                 |
| `gateway:startup`        | Channel 启动且 Hooks 加载完成后                        |
| `gateway:shutdown`       | Gateway 开始关闭时                                     |
| `gateway:pre-restart`    | 预期的 Gateway 重启之前                                |
| `message:received`       | 来自任何 Channel 的入站消息                            |
| `message:transcribed`    | 音频转录完成后                                         |
| `message:preprocessed`   | 媒体和链接预处理完成或跳过后                           |
| `message:sent`           | 出站消息已交付                                         |

## 编写 Hooks

### Hook 结构

每个 Hook 是一个包含两个文件的目录：

```
my-hook/
├── HOOK.md          # 元数据 + 文档
└── handler.ts       # 处理程序实现
```

### HOOK.md 格式

```markdown
---
name: my-hook
description: "此 Hook 功能的简短描述"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

详细文档写在这里。
```

**元数据字段**（`metadata.openclaw`）：

| 字段       | 描述                                                  |
| ---------- | ----------------------------------------------------- |
| `emoji`    | CLI 显示用表情符号                                    |
| `events`   | 要监听的事件数组                                      |
| `export`   | 要使用的命名导出（默认为 `"default"`）                |
| `os`       | 所需平台（如 `["darwin", "linux"]`）                  |
| `requires` | 所需的 `bins`、`anyBins`、`env` 或 `config` 路径      |
| `always`   | 绕过资格检查（布尔值）                                |
| `install`  | 安装方法                                              |

### 处理程序实现

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // 你的逻辑在这里

  // 可选地向用户发送消息
  event.messages.push("Hook executed!");
};

export default handler;
```

每个事件包括：`type`、`action`、`sessionKey`、`timestamp`、`messages`（推送以发送给用户）和 `context`（事件特定数据）。Agent 和工具插件 Hook 上下文还可以包含 `trace`，这是一个只读的 W3C 兼容诊断跟踪上下文，插件可以将其传入结构化日志以进行 OTEL 关联。

### 事件上下文要点

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**消息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（Provider 特定数据，包括 `senderId`、`senderName`、`guildId`）。`context.content` 优先选择类命令消息的非空命令体，然后回退到原始入站体和通用体；不包含 Agent 专属的增强内容，如线程历史或链接摘要。

**消息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`。

**消息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**消息事件**（`message:preprocessed`）：`context.bodyForAgent`（最终增强体）、`context.from`、`context.channelId`。

**引导事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可变数组）、`context.agentId`。

**Session 补丁事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（仅已更改字段）、`context.cfg`。只有特权客户端才能触发补丁事件。

**压缩事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 添加 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 观察用户发出 `/stop`；它是取消/命令生命周期，而非 Agent 最终化门控。需要检查自然最终答案并请求 Agent 再进行一轮的插件应使用类型化插件 Hook `before_agent_finalize`。参见 [Plugin hooks](/plugins/hooks)。

**Gateway 生命周期事件**：`gateway:shutdown` 包含 `reason` 和 `restartExpectedMs`，在 Gateway 开始关闭时触发。`gateway:pre-restart` 包含相同上下文，但仅在关闭是预期重启的一部分且提供了有限的 `restartExpectedMs` 值时触发。关闭期间，每个生命周期 Hook 等待是尽力的且有时间限制，以便在处理程序停滞时关闭仍能继续。`gateway:shutdown` 的默认等待预算为 5 秒，`gateway:pre-restart` 为 10 秒。

## Hook 发现

Hooks 按以下顺序从这些目录中发现，覆盖优先级递增：

1. **捆绑 Hooks**：随 OpenClaw 一起提供
2. **插件 Hooks**：捆绑在已安装插件中的 Hooks
3. **托管 Hooks**：`~/.openclaw/hooks/`（用户安装，跨工作区共享）。来自 `hooks.internal.load.extraDirs` 的额外目录共享此优先级。
4. **工作区 Hooks**：`<workspace>/hooks/`（按 Agent，默认禁用直到明确启用）

工作区 Hooks 可以添加新 Hook 名称，但不能覆盖具有相同名称的捆绑、托管或插件提供的 Hooks。

Gateway 在启动时会跳过内部 Hook 发现，直到内部 Hooks 被配置。使用 `openclaw hooks enable <name>` 启用捆绑或托管 Hook，安装 Hook 包，或设置 `hooks.internal.enabled=true` 来选择加入。当你启用一个命名 Hook 时，Gateway 仅加载该 Hook 的处理程序；`hooks.internal.enabled=true`、额外 Hook 目录和旧版处理程序选择加入广泛发现。

### Hook 包

Hook 包是通过 `package.json` 中的 `openclaw.hooks` 导出 Hooks 的 npm 包。使用以下命令安装：

```bash
openclaw plugins install <path-or-spec>
```

npm 规格仅限于注册表（包名 + 可选的精确版本或发行标签）。Git/URL/文件规格和 semver 范围会被拒绝。

## 捆绑 Hooks

| Hook                  | 事件                                              | 功能                                                   |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| session-memory        | `command:new`、`command:reset`                    | 将 Session 上下文保存到 `<workspace>/memory/`          |
| bootstrap-extra-files | `agent:bootstrap`                                 | 从 glob 模式注入额外的引导文件                         |
| command-logger        | `command`                                         | 将所有命令记录到 `~/.openclaw/logs/commands.log`       |
| compaction-notifier   | `session:compact:before`、`session:compact:after` | 在 Session 压缩开始/结束时发送可见的聊天通知           |
| boot-md               | `gateway:startup`                                 | Gateway 启动时运行 `BOOT.md`                           |

启用任何捆绑 Hook：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 详情

提取最近 15 条用户/助手消息，并使用主机本地日期保存到 `<workspace>/memory/YYYY-MM-DD-HHMM.md`。内存捕获在后台运行，因此 `/new` 和 `/reset` 确认不会因转录读取或可选的 slug 生成而延迟。设置 `hooks.internal.entries.session-memory.llmSlug: true` 可使用已配置的模型生成描述性文件名 slug。需要配置 `workspace.dir`。

<a id="bootstrap-extra-files"></a>

### bootstrap-extra-files 配置

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

路径相对于工作区解析。只加载已识别的引导文件基名（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger 详情

将每个斜杠命令记录到 `~/.openclaw/logs/commands.log`。

<a id="compaction-notifier"></a>

### compaction-notifier 详情

在 OpenClaw 开始和完成压缩 Session 转录时，向当前对话发送简短的状态消息。这使聊天界面上的长轮次不那么令人困惑，因为用户可以看到助手正在汇总上下文，并将在压缩后继续。

<a id="boot-md"></a>

### boot-md 详情

Gateway 启动时从活跃工作区运行 `BOOT.md`。

## Plugin Hooks

插件可以通过 Plugin SDK 注册类型化 Hooks 以实现更深层集成：拦截工具调用、修改提示词、控制消息流等。当你需要 `before_tool_call`、`before_agent_reply`、`before_install` 或其他进程内生命周期 Hooks 时，请使用插件 Hooks。

完整的插件 Hook 参考，请参见 [Plugin hooks](/plugins/hooks)。

## 配置

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

每个 Hook 的环境变量：

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

额外 Hook 目录：

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
旧版 `hooks.internal.handlers` 数组配置格式仍然受支持以向后兼容，但新 Hooks 应使用基于发现的系统。
</Note>

## CLI 参考

```bash
# 列出所有 Hooks（添加 --eligible、--verbose 或 --json）
openclaw hooks list

# 显示 Hook 的详细信息
openclaw hooks info <hook-name>

# 显示资格摘要
openclaw hooks check

# 启用/禁用
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## 最佳实践

- **保持处理程序快速。** Hooks 在命令处理期间运行。使用 `void processInBackground(event)` 在后台异步处理繁重工作。
- **优雅地处理错误。** 用 try/catch 包裹有风险的操作；不要抛出异常，以便其他处理程序可以运行。
- **尽早过滤事件。** 如果事件类型/动作不相关，立即返回。
- **使用特定事件键。** 优先使用 `"events": ["command:new"]` 而非 `"events": ["command"]` 以减少开销。

## 故障排除

### Hook 未被发现

```bash
# 验证目录结构
ls -la ~/.openclaw/hooks/my-hook/
# 应显示：HOOK.md、handler.ts

# 列出所有已发现的 Hooks
openclaw hooks list
```

### Hook 不符合资格

```bash
openclaw hooks info my-hook
```

检查缺少的二进制文件（PATH）、环境变量、配置值或 OS 兼容性。

### Hook 未执行

1. 验证 Hook 已启用：`openclaw hooks list`
2. 重启 Gateway 进程以重新加载 Hooks。
3. 检查 Gateway 日志：`./scripts/clawlog.sh | grep hook`

## 相关

- [CLI 参考：hooks](/cli/hooks)
- [Webhooks](/automation/cron-jobs#webhooks)
- [Plugin hooks](/plugins/hooks) — 进程内插件生命周期 Hooks
- [配置](/gateway/configuration-reference#hooks)
