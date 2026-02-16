---
mmh3_hash: "36ad6d04bc00fe32425d726362deb37b"
summary: "Hooks：用于命令和生命周期事件的事件驱动自动化"
read_when:
  - 您需要为 /new、/reset、/stop 和 Agent 生命周期事件设置事件驱动自动化
  - 您想构建、安装或调试 Hooks
title: "Hooks"
---

# Hooks

Hooks 提供了一个可扩展的事件驱动系统，用于响应 Agent 命令和事件自动执行操作。Hooks 会从目录中自动发现，并可以通过 CLI 命令管理，类似于 OpenClaw 中 Skills 的工作方式。

## 入门指南

Hooks 是在某些事件发生时运行的小脚本。有两种类型：

- **Hooks**（本页）：在 Agent 事件（如 `/new`、`/reset`、`/stop` 或生命周期事件）触发时，在 Gateway 内运行。
- **Webhooks**：外部 HTTP Webhooks，允许其他系统在 OpenClaw 中触发工作。参见 [Webhook Hooks](/automation/webhook) 或使用 `openclaw webhooks` 获取 Gmail 辅助命令。

Hooks 也可以打包在 Plugins 中；参见 [Plugins](/tools/plugin#plugin-hooks)。

常见用途：

- 重置会话时保存内存快照
- 保留命令审计日志以便故障排除或合规
- 会话开始或结束时触发后续自动化
- 事件触发时向 Agent 工作空间写入文件或调用外部 API

如果您能编写一个小的 TypeScript 函数，就能编写一个 Hook。Hooks 会自动被发现，您可以通过 CLI 启用或禁用它们。

## 概述

Hooks 系统允许您：

- 在发出 `/new` 命令时将会话上下文保存到内存
- 记录所有命令以供审计
- 在 Agent 生命周期事件上触发自定义自动化
- 扩展 OpenClaw 的行为而无需修改核心代码

## 快速开始

### 内置 Hooks

OpenClaw 附带四个自动发现的内置 Hooks：

- **💾 session-memory**：当您发出 `/new` 命令时，将会话上下文保存到您的 Agent 工作空间（默认为 `~/.openclaw/workspace/memory/`）
- **📎 bootstrap-extra-files**：在 `agent:bootstrap` 期间从配置的 glob/路径模式注入额外的工作空间引导文件
- **📝 command-logger**：将所有命令事件记录到 `~/.openclaw/logs/commands.log`
- **🚀 boot-md**：Gateway 启动时运行 `BOOT.md`（需要启用内部 Hooks）

列出可用的 Hooks：

```bash
openclaw hooks list
```

启用一个 Hook：

```bash
openclaw hooks enable session-memory
```

检查 Hook 状态：

```bash
openclaw hooks check
```

获取详细信息：

```bash
openclaw hooks info session-memory
```

### 引导流程

在引导期间（`openclaw onboard`），系统会提示您启用推荐的 Hooks。向导会自动发现符合条件的 Hooks 并提供选择。

## Hook 发现

Hooks 会从三个目录自动发现（按优先级顺序）：

1. **工作空间 Hooks**：`<workspace>/hooks/`（每个 Agent，最高优先级）
2. **托管 Hooks**：`~/.openclaw/hooks/`（用户安装，跨工作空间共享）
3. **内置 Hooks**：`<openclaw>/dist/hooks/bundled/`（随 OpenClaw 一起提供）

托管 Hook 目录可以是**单个 Hook** 或 **Hook Pack**（包目录）。

每个 Hook 是一个包含以下内容的目录：

```
my-hook/
├── HOOK.md          # 元数据 + 文档
└── handler.ts       # Handler 实现
```

## Hook Packs（npm/存档）

Hook Packs 是标准的 npm 包，通过 `package.json` 中的 `openclaw.hooks` 导出一个或多个 Hooks。使用以下命令安装：

```bash
openclaw hooks install <path-or-spec>
```

Npm 规范仅限注册表（包名 + 可选版本/标签）。Git/URL/文件规范会被拒绝。

示例 `package.json`：

```json
{
  "name": "@acme/my-hooks",
  "version": "0.1.0",
  "openclaw": {
    "hooks": ["./hooks/my-hook", "./hooks/other-hook"]
  }
}
```

每个条目指向一个包含 `HOOK.md` 和 `handler.ts`（或 `index.ts`）的 Hook 目录。Hook Packs 可以附带依赖项；它们将被安装在 `~/.openclaw/hooks/<id>` 下。

安全说明：`openclaw hooks install` 使用 `npm install --ignore-scripts` 安装依赖项（不运行生命周期脚本）。保持 Hook Pack 依赖树为"纯 JS/TS"，避免依赖于 `postinstall` 构建的包。

## Hook 结构

### HOOK.md 格式

`HOOK.md` 文件在 YAML frontmatter 中包含元数据加上 Markdown 文档：

```markdown
---
name: my-hook
description: "此 Hook 功能的简短描述"
homepage: https://docs.openclaw.ai/automation/hooks#my-hook
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

详细文档在此...

## 功能说明

- 监听 `/new` 命令
- 执行某些操作
- 记录结果

## 要求

- 必须安装 Node.js

## 配置

无需配置。
```

### 元数据字段

`metadata.openclaw` 对象支持：

- **`emoji`**：CLI 显示的表情符号（例如 `"💾"`）
- **`events`**：要监听的事件数组（例如 `["command:new", "command:reset"]`）
- **`export`**：要使用的命名导出（默认为 `"default"`）
- **`homepage`**：文档 URL
- **`requires`**：可选要求
  - **`bins`**：PATH 上需要的二进制文件（例如 `["git", "node"]`）
  - **`anyBins`**：这些二进制文件中至少有一个必须存在
  - **`env`**：需要的环境变量
  - **`config`**：需要的配置路径（例如 `["workspace.dir"]`）
  - **`os`**：需要的平台（例如 `["darwin", "linux"]`）
- **`always`**：绕过资格检查（布尔值）
- **`install`**：安装方法（对于内置 Hooks：`[{"id":"bundled","kind":"bundled"}]`）

### Handler 实现

`handler.ts` 文件导出一个 `HookHandler` 函数：

```typescript
import type { HookHandler } from "../../src/hooks/hooks.js";

const myHandler: HookHandler = async (event) => {
  // 仅在 'new' 命令时触发
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] 触发了新命令`);
  console.log(`  Session: ${event.sessionKey}`);
  console.log(`  时间戳: ${event.timestamp.toISOString()}`);

  // 您的自定义逻辑在此

  // 可选地向用户发送消息
  event.messages.push("✨ 我的 Hook 已执行！");
};

export default myHandler;
```

#### 事件上下文

每个事件包括：

```typescript
{
  type: 'command' | 'session' | 'agent' | 'gateway',
  action: string,              // 例如 'new'、'reset'、'stop'
  sessionKey: string,          // Session 标识符
  timestamp: Date,             // 事件发生时间
  messages: string[],          // 在此推送消息以发送给用户
  context: {
    sessionEntry?: SessionEntry,
    sessionId?: string,
    sessionFile?: string,
    commandSource?: string,    // 例如 'whatsapp'、'telegram'
    senderId?: string,
    workspaceDir?: string,
    bootstrapFiles?: WorkspaceBootstrapFile[],
    cfg?: OpenClawConfig
  }
}
```

## 事件类型

### 命令事件

在发出 Agent 命令时触发：

- **`command`**：所有命令事件（通用监听器）
- **`command:new`**：发出 `/new` 命令时
- **`command:reset`**：发出 `/reset` 命令时
- **`command:stop`**：发出 `/stop` 命令时

### Agent 事件

- **`agent:bootstrap`**：在注入工作空间引导文件之前（Hooks 可以修改 `context.bootstrapFiles`）

### Gateway 事件

Gateway 启动时触发：

- **`gateway:startup`**：在 Channels 启动且 Hooks 加载后

### Tool Result Hooks（Plugin API）

这些 Hooks 不是事件流监听器；它们让 Plugins 在 OpenClaw 持久化 Tool 结果之前同步调整它们。

- **`tool_result_persist`**：在将 Tool 结果写入会话记录之前对其进行转换。必须是同步的；返回更新后的 Tool 结果负载或 `undefined` 以保持原样。参见 [Agent Loop](/concepts/agent-loop)。

### 未来事件

计划的事件类型：

- **`session:start`**：新会话开始时
- **`session:end`**：会话结束时
- **`agent:error`**：Agent 遇到错误时
- **`message:sent`**：发送消息时
- **`message:received`**：接收消息时

## 创建自定义 Hooks

### 1. 选择位置

- **工作空间 Hooks**（`<workspace>/hooks/`）：每个 Agent，最高优先级
- **托管 Hooks**（`~/.openclaw/hooks/`）：跨工作空间共享

### 2. 创建目录结构

```bash
mkdir -p ~/.openclaw/hooks/my-hook
cd ~/.openclaw/hooks/my-hook
```

### 3. 创建 HOOK.md

```markdown
---
name: my-hook
description: "做一些有用的事情"
metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
---

# 我的自定义 Hook

此 Hook 在您发出 `/new` 时做一些有用的事情。
```

### 4. 创建 handler.ts

```typescript
import type { HookHandler } from "../../src/hooks/hooks.js";

const handler: HookHandler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log("[my-hook] 运行中！");
  // 您的逻辑在此
};

export default handler;
```

### 5. 启用和测试

```bash
# 验证 Hook 已被发现
openclaw hooks list

# 启用它
openclaw hooks enable my-hook

# 重启您的 Gateway 进程（macOS 上的菜单栏应用重启，或重启您的开发进程）

# 触发事件
# 通过您的消息 Channel 发送 /new
```

## 配置

### 新配置格式（推荐）

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

### 每个 Hook 的配置

Hooks 可以有自定义配置：

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": {
            "MY_CUSTOM_VAR": "value"
          }
        }
      }
    }
  }
}
```

### 额外目录

从额外目录加载 Hooks：

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

### 旧版配置格式（仍支持）

旧配置格式仍然支持向后兼容：

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "handlers": [
        {
          "event": "command:new",
          "module": "./hooks/handlers/my-handler.ts",
          "export": "default"
        }
      ]
    }
  }
}
```

注意：`module` 必须是工作空间相对路径。绝对路径和遍历工作空间外部的路径会被拒绝。

**迁移**：对于新 Hooks，使用基于发现的新系统。旧版 Handlers 在基于目录的 Hooks 之后加载。

## CLI 命令

### 列出 Hooks

```bash
# 列出所有 Hooks
openclaw hooks list

# 仅显示符合条件的 Hooks
openclaw hooks list --eligible

# 详细输出（显示缺失的要求）
openclaw hooks list --verbose

# JSON 输出
openclaw hooks list --json
```

### Hook 信息

```bash
# 显示 Hook 的详细信息
openclaw hooks info session-memory

# JSON 输出
openclaw hooks info session-memory --json
```

### 检查资格

```bash
# 显示资格摘要
openclaw hooks check

# JSON 输出
openclaw hooks check --json
```

### 启用/禁用

```bash
# 启用 Hook
openclaw hooks enable session-memory

# 禁用 Hook
openclaw hooks disable command-logger
```

## 内置 Hook 参考

### session-memory

在您发出 `/new` 时将会话上下文保存到内存。

**事件**：`command:new`

**要求**：必须配置 `workspace.dir`

**输出**：`<workspace>/memory/YYYY-MM-DD-slug.md`（默认为 `~/.openclaw/workspace`）

**功能**：

1. 使用重置前的会话条目定位正确的记录
2. 提取对话的最后 15 行
3. 使用 LLM 生成描述性文件名 slug
4. 将会话元数据保存到日期内存文件

**示例输出**：

```markdown
# Session: 2026-01-16 14:30:00 UTC

- **Session Key**: agent:main:main
- **Session ID**: abc123def456
- **Source**: telegram
```

**文件名示例**：

- `2026-01-16-vendor-pitch.md`
- `2026-01-16-api-design.md`
- `2026-01-16-1430.md`（如果 slug 生成失败则回退时间戳）

**启用**：

```bash
openclaw hooks enable session-memory
```

### bootstrap-extra-files

在 `agent:bootstrap` 期间注入额外的引导文件（例如 monorepo 本地的 `AGENTS.md` / `TOOLS.md`）。

**事件**：`agent:bootstrap`

**要求**：必须配置 `workspace.dir`

**输出**：不写入文件；引导上下文仅在内存中修改。

**配置**：

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
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

**注意**：

- 路径相对于工作空间解析。
- 文件必须保持在工作空间内（realpath 检查）。
- 仅加载已识别的引导基本名称。
- Subagent 白名单被保留（仅 `AGENTS.md` 和 `TOOLS.md`）。

**启用**：

```bash
openclaw hooks enable bootstrap-extra-files
```

### command-logger

将所有命令事件记录到集中审计文件。

**事件**：`command`

**要求**：无

**输出**：`~/.openclaw/logs/commands.log`

**功能**：

1. 捕获事件详情（命令操作、时间戳、会话密钥、发送者 ID、来源）
2. 以 JSONL 格式追加到日志文件
3. 在后台静默运行

**示例日志条目**：

```jsonl
{"timestamp":"2026-01-16T14:30:00.000Z","action":"new","sessionKey":"agent:main:main","senderId":"+1234567890","source":"telegram"}
{"timestamp":"2026-01-16T15:45:22.000Z","action":"stop","sessionKey":"agent:main:main","senderId":"user@example.com","source":"whatsapp"}
```

**查看日志**：

```bash
# 查看最近的命令
tail -n 20 ~/.openclaw/logs/commands.log

# 使用 jq 美化打印
cat ~/.openclaw/logs/commands.log | jq .

# 按操作过滤
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**启用**：

```bash
openclaw hooks enable command-logger
```

### boot-md

Gateway 启动时运行 `BOOT.md`（在 Channels 启动后）。内部 Hooks 必须启用才能运行。

**事件**：`gateway:startup`

**要求**：必须配置 `workspace.dir`

**功能**：

1. 从您的工作空间读取 `BOOT.md`
2. 通过 Agent 运行器运行指令
3. 通过消息工具发送任何请求的出站消息

**启用**：

```bash
openclaw hooks enable boot-md
```

## 最佳实践

### 保持 Handlers 快速

Hooks 在命令处理期间运行。保持它们轻量级：

```typescript
// ✓ 好 - 异步工作，立即返回
const handler: HookHandler = async (event) => {
  void processInBackground(event); // 触发并忘记
};

// ✗ 坏 - 阻塞命令处理
const handler: HookHandler = async (event) => {
  await slowDatabaseQuery(event);
  await evenSlowerAPICall(event);
};
```

### 优雅地处理错误

始终包装风险操作：

```typescript
const handler: HookHandler = async (event) => {
  try {
    await riskyOperation(event);
  } catch (err) {
    console.error("[my-handler] 失败：", err instanceof Error ? err.message : String(err));
    // 不要抛出 - 让其他 Handlers 运行
  }
};
```

### 尽早过滤事件

如果事件不相关，尽早返回：

```typescript
const handler: HookHandler = async (event) => {
  // 仅处理 'new' 命令
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  // 您的逻辑在此
};
```

### 使用特定的事件键

在元数据中尽可能指定确切的事件：

```yaml
metadata: { "openclaw": { "events": ["command:new"] } } # 特定
```

而不是：

```yaml
metadata: { "openclaw": { "events": ["command"] } } # 通用 - 更多开销
```

## 调试

### 启用 Hook 日志

Gateway 在启动时记录 Hook 加载：

```
Registered hook: session-memory -> command:new
Registered hook: bootstrap-extra-files -> agent:bootstrap
Registered hook: command-logger -> command
Registered hook: boot-md -> gateway:startup
```

### 检查发现

列出所有发现的 Hooks：

```bash
openclaw hooks list --verbose
```

### 检查注册

在您的 Handler 中，记录它何时被调用：

```typescript
const handler: HookHandler = async (event) => {
  console.log("[my-handler] 触发：", event.type, event.action);
  // 您的逻辑
};
```

### 验证资格

检查为什么 Hook 不符合条件：

```bash
openclaw hooks info my-hook
```

在输出中查找缺失的要求。

## 测试

### Gateway 日志

监控 Gateway 日志以查看 Hook 执行：

```bash
# macOS
./scripts/clawlog.sh -f

# 其他平台
tail -f ~/.openclaw/gateway.log
```

### 直接测试 Hooks

独立测试您的 Handlers：

```typescript
import { test } from "vitest";
import { createHookEvent } from "./src/hooks/hooks.js";
import myHandler from "./hooks/my-hook/handler.js";

test("my handler works", async () => {
  const event = createHookEvent("command", "new", "test-session", {
    foo: "bar",
  });

  await myHandler(event);

  // 断言副作用
});
```

## 架构

### 核心组件

- **`src/hooks/types.ts`**：类型定义
- **`src/hooks/workspace.ts`**：目录扫描和加载
- **`src/hooks/frontmatter.ts`**：HOOK.md 元数据解析
- **`src/hooks/config.ts`**：资格检查
- **`src/hooks/hooks-status.ts`**：状态报告
- **`src/hooks/loader.ts`**：动态模块加载器
- **`src/cli/hooks-cli.ts`**：CLI 命令
- **`src/gateway/server-startup.ts`**：Gateway 启动时加载 Hooks
- **`src/auto-reply/reply/commands-core.ts`**：触发命令事件

### 发现流程

```
Gateway 启动
    ↓
扫描目录（workspace → managed → bundled）
    ↓
解析 HOOK.md 文件
    ↓
检查资格（bins、env、config、os）
    ↓
从符合条件的 Hooks 加载 Handlers
    ↓
为事件注册 Handlers
```

### 事件流程

```
用户发送 /new
    ↓
命令验证
    ↓
创建 Hook 事件
    ↓
触发 Hook（所有已注册的 Handlers）
    ↓
命令处理继续
    ↓
Session 重置
```

## 故障排除

### Hook 未被发现

1. 检查目录结构：

   ```bash
   ls -la ~/.openclaw/hooks/my-hook/
   # 应该显示：HOOK.md, handler.ts
   ```

2. 验证 HOOK.md 格式：

   ```bash
   cat ~/.openclaw/hooks/my-hook/HOOK.md
   # 应该有带 name 和 metadata 的 YAML frontmatter
   ```

3. 列出所有发现的 Hooks：

   ```bash
   openclaw hooks list
   ```

### Hook 不符合条件

检查要求：

```bash
openclaw hooks info my-hook
```

查找缺失的：

- 二进制文件（检查 PATH）
- 环境变量
- 配置值
- 操作系统兼容性

### Hook 未执行

1. 验证 Hook 已启用：

   ```bash
   openclaw hooks list
   # 已启用的 Hooks 旁边应该显示 ✓
   ```

2. 重启您的 Gateway 进程以重新加载 Hooks。

3. 检查 Gateway 日志中的错误：

   ```bash
   ./scripts/clawlog.sh | grep hook
   ```

### Handler 错误

检查 TypeScript/导入错误：

```bash
# 直接测试导入
node -e "import('./path/to/handler.ts').then(console.log)"
```

## 迁移指南

### 从旧版配置到发现

**之前**：

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "handlers": [
        {
          "event": "command:new",
          "module": "./hooks/handlers/my-handler.ts"
        }
      ]
    }
  }
}
```

**之后**：

1. 创建 Hook 目录：

   ```bash
   mkdir -p ~/.openclaw/hooks/my-hook
   mv ./hooks/handlers/my-handler.ts ~/.openclaw/hooks/my-hook/handler.ts
   ```

2. 创建 HOOK.md：

   ```markdown
   ---
   name: my-hook
   description: "我的自定义 Hook"
   metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
   ---

   # My Hook

   做一些有用的事情。
   ```

3. 更新配置：

   ```json
   {
     "hooks": {
       "internal": {
         "enabled": true,
         "entries": {
           "my-hook": { "enabled": true }
         }
       }
     }
   }
   ```

4. 验证并重启您的 Gateway 进程：

   ```bash
   openclaw hooks list
   # 应该显示：🎯 my-hook ✓
   ```

**迁移的好处**：

- 自动发现
- CLI 管理
- 资格检查
- 更好的文档
- 一致的结构

## 另见

- [CLI 参考：hooks](/cli/hooks)
- [内置 Hooks README](https://github.com/openclaw/openclaw/tree/main/src/hooks/bundled)
- [Webhook Hooks](/automation/webhook)
- [配置](/gateway/configuration#hooks)
