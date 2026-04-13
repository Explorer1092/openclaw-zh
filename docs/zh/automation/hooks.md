---
mmh3_hash: "7b41063d5ccd3b1fca51c579a7370fee"
summary: "Hooks：用于命令和生命周期事件的事件驱动自动化"
read_when:
  - 你需要为 /new、/reset、/stop 和 Agent 生命周期事件设置事件驱动自动化
  - 你想构建、安装或调试 Hooks
title: "Hooks"
---

# Hooks

Hooks 是在 Gateway 内发生某些事件时运行的小脚本。它们会从目录中自动发现，并可以通过 `openclaw hooks` 检查。

OpenClaw 中有两种类型的 Hooks：

- **内部 Hooks**（本页）：在 Agent 事件触发时在 Gateway 内运行，如 `/new`、`/reset`、`/stop` 或生命周期事件。
- **Webhooks**：外部 HTTP 端点，允许其他系统在 OpenClaw 中触发工作。参见 [Webhooks](/automation/cron-jobs#webhooks)。

Hooks 也可以打包在 Plugin 中。`openclaw hooks list` 会显示独立 Hooks 和 Plugin 托管的 Hooks。

## 快速开始

```bash
# 列出可用 Hooks
openclaw hooks list

# 启用 Hook
openclaw hooks enable session-memory

# 检查 Hook 状态
openclaw hooks check

# 获取详细信息
openclaw hooks info session-memory
```

## 事件类型

| 事件                      | 触发时机                                         |
| ------------------------- | ------------------------------------------------ |
| `command:new`             | 发出 `/new` 命令                                 |
| `command:reset`           | 发出 `/reset` 命令                               |
| `command:stop`            | 发出 `/stop` 命令                                |
| `command`                 | 任何命令事件（通用监听器）                       |
| `session:compact:before`  | 压缩汇总历史之前                                 |
| `session:compact:after`   | 压缩完成之后                                     |
| `session:patch`           | 会话属性被修改时                                 |
| `agent:bootstrap`         | 工作空间引导文件注入之前                         |
| `gateway:startup`         | Channel 启动且 Hooks 加载后                      |
| `message:received`        | 从任何 Channel 接收到入站消息                    |
| `message:transcribed`     | 音频转录完成后                                   |
| `message:preprocessed`    | 所有媒体和链接理解完成后                         |
| `message:sent`            | 出站消息已传递                                   |

## 编写 Hooks

### Hook 结构

每个 Hook 是一个包含两个文件的目录：

```
my-hook/
├── HOOK.md          # 元数据 + 文档
└── handler.ts       # 处理器实现
```

### HOOK.md 格式

```markdown
---
name: my-hook
description: "这个 Hook 的简短描述"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

详细文档写在这里。
```

**元数据字段**（`metadata.openclaw`）：

| 字段       | 描述                                                   |
| ---------- | ------------------------------------------------------ |
| `emoji`    | CLI 显示表情                                           |
| `events`   | 要监听的事件数组                                       |
| `export`   | 要使用的命名导出（默认为 `"default"`）                 |
| `os`       | 必需平台（如 `["darwin", "linux"]`）                   |
| `requires` | 必需的 `bins`、`anyBins`、`env` 或 `config` 路径       |
| `always`   | 绕过资格检查（布尔值）                                 |
| `install`  | 安装方法                                               |

### 处理器实现

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // 你的逻辑在这里

  // 可选：向用户发送消息
  event.messages.push("Hook executed!");
};

export default handler;
```

每个事件包括：`type`、`action`、`sessionKey`、`timestamp`、`messages`（push 以发送给用户）和 `context`（事件特定数据）。

### 事件上下文亮点

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**消息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（Provider 特定数据，包括 `senderId`、`senderName`、`guildId`）。

**消息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`。

**消息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**消息事件**（`message:preprocessed`）：`context.bodyForAgent`（最终丰富正文）、`context.from`、`context.channelId`。

**引导事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可变数组）、`context.agentId`。

**会话补丁事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（仅更改的字段）、`context.cfg`。只有特权客户端可以触发补丁事件。

**压缩事件**：`session:compact:before` 包括 `messageCount`、`tokenCount`。`session:compact:after` 添加 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

## Hook 发现

Hooks 会从以下目录自动发现，按覆盖优先级从低到高排列：

1. **内置 Hooks**：随 OpenClaw 一起提供
2. **Plugin Hooks**：打包在已安装 Plugin 中的 Hooks
3. **托管 Hooks**：`~/.openclaw/hooks/`（用户安装，跨工作空间共享）。来自 `hooks.internal.load.extraDirs` 的额外目录共享此优先级。
4. **工作空间 Hooks**：`<workspace>/hooks/`（每 Agent，默认禁用直到明确启用）

工作空间 Hooks 可以添加新的 Hook 名称，但不能覆盖具有相同名称的内置、托管或 Plugin 提供的 Hooks。

### Hook Pack

Hook Pack 是通过 `package.json` 中的 `openclaw.hooks` 导出 Hooks 的 npm 包。安装方式：

```bash
openclaw plugins install <path-or-spec>
```

npm 规范仅限注册表（包名 + 可选的精确版本或 dist-tag）。拒绝 Git/URL/文件规范和语义版本范围。

## 内置 Hooks

| Hook                   | 事件                            | 功能                                                   |
| ---------------------- | ------------------------------- | ------------------------------------------------------ |
| session-memory         | `command:new`、`command:reset`  | 将会话上下文保存到 `<workspace>/memory/`               |
| bootstrap-extra-files  | `agent:bootstrap`               | 从 glob 模式注入额外的引导文件                         |
| command-logger         | `command`                       | 将所有命令记录到 `~/.openclaw/logs/commands.log`       |
| boot-md                | `gateway:startup`               | Gateway 启动时运行 `BOOT.md`                           |

启用任何内置 Hook：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 详情

提取最后 15 条用户/助手消息，通过 LLM 生成描述性文件名 slug，并保存到 `<workspace>/memory/YYYY-MM-DD-slug.md`。需要配置 `workspace.dir`。

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

路径相对于工作空间解析。只加载已识别的引导文件基本名称（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger 详情

将每个斜杠命令记录到 `~/.openclaw/logs/commands.log`。

<a id="boot-md"></a>

### boot-md 详情

Gateway 启动时从活动工作空间运行 `BOOT.md`。

## Plugin Hooks

Plugin 可以通过 Plugin SDK 注册 Hooks 以进行更深度的集成：拦截工具调用、修改提示、控制消息流等。Plugin SDK 公开了 28 个 Hooks，涵盖模型解析、Agent 生命周期、消息流、工具执行、子 Agent 协调和 Gateway 生命周期。

有关完整的 Plugin Hook 参考，包括 `before_tool_call`、`before_agent_reply`、`before_install` 和所有其他 Plugin Hooks，请参见 [Plugin 架构](/plugins/architecture#provider-runtime-hooks)。

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
遗留的 `hooks.internal.handlers` 数组配置格式仍然受向后兼容性支持，但新 Hooks 应使用基于发现的系统。
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

- **保持处理器快速。** Hooks 在命令处理期间运行。使用 `void processInBackground(event)` 进行即发即忘的繁重工作。
- **优雅处理错误。** 将风险操作包装在 try/catch 中；不要抛出异常，让其他处理器可以运行。
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

## 相关文档

- [CLI 参考：hooks](/cli/hooks)
- [Webhooks](/automation/cron-jobs#webhooks)
- [Plugin 架构](/plugins/architecture#provider-runtime-hooks) — 完整 Plugin Hook 参考
- [配置](/gateway/configuration-reference#hooks)
