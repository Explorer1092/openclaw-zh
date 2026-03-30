---
read_when:
  - 你希望为 `/new`、`/reset`、`/stop` 和智能体生命周期事件使用事件驱动自动化
  - 你希望构建、安装或调试 Hooks
summary: Hooks：用于命令和生命周期事件的事件驱动自动化
title: Hooks
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: 62b0b6647bad836886286a28df9920ad550c270b9691b5ebbf7461561d7b40ed
  source_path: automation/hooks.md
  workflow: 15
---

# Hooks

Hooks 提供了一个可扩展的事件驱动系统，用于在响应智能体命令和事件时自动执行操作。Hooks 会从目录中自动发现，并可通过 `openclaw hooks` 检查，而 hook 包的安装和更新则通过 `openclaw plugins` 进行。

## 熟悉基础

Hooks 是在某些事情发生时运行的小脚本。它们有两种类型：

- **Hooks**（本页）：当智能体事件触发时，在 Gateway 网关内运行，例如 `/new`、`/reset`、`/stop` 或生命周期事件。
- **Webhooks**：外部 HTTP webhook，可让其他系统在 OpenClaw 中触发工作。请参阅 [Webhook Hooks](/automation/webhook)，或使用 `openclaw webhooks` 获取 Gmail 辅助命令。

Hooks 也可以打包在插件中；请参阅[插件 Hooks](/plugins/architecture#provider-runtime-hooks)。`openclaw hooks list` 同时显示独立 hook 和插件管理的 hook。

常见用途：

- 当你重置会话时保存一份内存快照
- 为故障排除或合规保留命令审计轨迹
- 当会话开始或结束时触发后续自动化
- 当事件触发时，将文件写入智能体工作区或调用外部 API

如果你会写一个小型 TypeScript 函数，你就能编写一个 hook。托管和内置 hook 是受信任的本地代码。工作区 hook 会被自动发现，但 OpenClaw 会将它们保持禁用状态，直到你通过 CLI 或配置显式启用它们。

## 概览

Hooks 系统允许你：

- 当发出 `/new` 时，将会话上下文保存到 memory
- 记录所有命令以供审计
- 在智能体生命周期事件上触发自定义自动化
- 在不修改核心代码的情况下扩展 OpenClaw 的行为

## 入门指南

### 内置 Hooks

OpenClaw 自带四个会被自动发现的内置 hook：

- **💾 session-memory**：当你发出 `/new` 或 `/reset` 时，将会话上下文保存到你的智能体工作区（默认是 `~/.openclaw/workspace/memory/`）
- **📎 bootstrap-extra-files**：在 `agent:bootstrap` 期间，从已配置的 glob/路径模式中注入额外的工作区引导文件
- **📝 command-logger**：将所有命令事件记录到 `~/.openclaw/logs/commands.log`
- **🚀 boot-md**：当 Gateway 网关启动时运行 `BOOT.md`（需要启用内部 hooks）

列出可用 hooks：

```bash
openclaw hooks list
```

启用一个 hook：

```bash
openclaw hooks enable session-memory
```

检查 hook 状态：

```bash
openclaw hooks check
```

获取详细信息：

```bash
openclaw hooks info session-memory
```

### 新手引导

在新手引导期间（`openclaw onboard`），系统会提示你启用推荐的 hooks。向导会自动发现符合条件的 hooks 并供你选择。

### 信任边界

Hooks 在 Gateway 网关进程内运行。将内置 hook、托管 hook 和 `hooks.internal.load.extraDirs` 视为受信任的本地代码。工作区 `<workspace>/hooks/` 下的 hook 是仓库本地代码，因此 OpenClaw 在加载它们之前需要一个明确的启用步骤。

## Hook 发现

Hooks 会从以下目录中自动发现，按优先级从低到高排列：

1. **内置 hooks**：随 OpenClaw 一起提供；对于 npm 安装位于 `<openclaw>/dist/hooks/bundled/`（或编译二进制的同级 `hooks/bundled/`）
2. **插件 hooks**：打包在已安装插件中的 hooks（参见[插件 Hooks](/plugins/architecture#provider-runtime-hooks)）
3. **托管 hooks**：`~/.openclaw/hooks/`（用户安装，跨工作区共享；可覆盖内置和插件 hook）。通过 `hooks.internal.load.extraDirs` 配置的**额外 hook 目录**也被视为托管 hook，共享相同的覆盖优先级。
4. **工作区 hooks**：`<workspace>/hooks/`（每个智能体单独配置，默认禁用直到显式启用；不能覆盖其他来源的 hook）

工作区 hook 可以为仓库添加新 hook 名称，但不能覆盖同名的内置、托管或插件提供的 hook。

托管 hook 目录既可以是 **单个 hook**，也可以是 **hook 包**（包目录）。

每个 hook 都是一个包含以下内容的目录：

```
my-hook/
├── HOOK.md          # 元数据 + 文档
└── handler.ts       # 处理器实现
```

## Hook 包（npm/归档）

Hook 包是标准的 npm 包，它们通过 `package.json` 中的 `openclaw.hooks` 导出一个或多个 hook。使用以下命令安装它们：

```bash
openclaw plugins install <path-or-spec>
```

npm spec 仅支持注册表形式（包名 + 可选的精确版本或 dist-tag）。
Git/URL/file spec 和 semver 范围会被拒绝。

裸 spec 和 `@latest` 会保持在稳定轨道上。如果 npm 将其中任意一种解析为预发布版本，OpenClaw 会停止并要求你通过预发布标签（例如 `@beta`/`@rc`）或精确的预发布版本显式选择加入。

`package.json` 示例：

```json
{
  "name": "@acme/my-hooks",
  "version": "0.1.0",
  "openclaw": {
    "hooks": ["./hooks/my-hook", "./hooks/other-hook"]
  }
}
```

每个条目都指向一个包含 `HOOK.md` 和处理器文件的 hook 目录。加载器按顺序尝试 `handler.ts`、`handler.js`、`index.ts`、`index.js`。
Hook 包可以携带依赖；它们会安装到 `~/.openclaw/hooks/<id>` 下。
每个 `openclaw.hooks` 条目在解析符号链接后都必须保持在包目录内部；超出目录范围的条目会被拒绝。

安全说明：`openclaw plugins install` 会使用 `npm install --ignore-scripts` 安装 hook 包依赖
（不运行生命周期脚本）。请保持 hook 包依赖树为"纯 JS/TS"，并避免依赖 `postinstall` 构建的包。

## Hook 结构

### HOOK.md 格式

`HOOK.md` 文件包含 YAML frontmatter 中的元数据以及 Markdown 文档：

```markdown
---
name: my-hook
description: "Short description of what this hook does"
homepage: https://docs.openclaw.ai/automation/hooks#my-hook
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

详细文档写在这里……

## 它的作用

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

- **`emoji`**：CLI 显示用 emoji（例如 `"💾"`）
- **`events`**：要监听的事件数组（例如 `["command:new", "command:reset"]`）
- **`export`**：要使用的命名导出（默认为 `"default"`）
- **`homepage`**：文档 URL
- **`os`**：必须的平台（例如 `["darwin", "linux"]`）
- **`requires`**：可选要求
  - **`bins`**：PATH 中必须存在的二进制文件（例如 `["git", "node"]`）
  - **`anyBins`**：这些二进制文件中至少要存在一个
  - **`env`**：必需的环境变量
  - **`config`**：必需的配置路径（例如 `["workspace.dir"]`）
- **`always`**：绕过资格检查（布尔值）
- **`install`**：安装方式（对于内置 hooks：`[{"id":"bundled","kind":"bundled"}]`）

### 处理器实现

`handler.ts` 文件会导出一个 `HookHandler` 函数：

```typescript
const myHandler = async (event) => {
  // 仅在 'new' 命令时触发
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  console.log(`  Session: ${event.sessionKey}`);
  console.log(`  Timestamp: ${event.timestamp.toISOString()}`);

  // 你的自定义逻辑写在这里

  // 可选：向用户发送消息
  event.messages.push("✨ My hook executed!");
};

export default myHandler;
```

#### 事件上下文

每个事件都包含：

```typescript
{
  type: 'command' | 'session' | 'agent' | 'gateway' | 'message',
  action: string,              // 例如 'new'、'reset'、'stop'、'received'、'sent'
  sessionKey: string,          // 会话标识符
  timestamp: Date,             // 事件发生时间
  messages: string[],          // 将消息推入这里以发送给用户
  context: {
    // 命令事件（command:new, command:reset）：
    sessionEntry?: SessionEntry,       // 当前会话条目
    previousSessionEntry?: SessionEntry, // 重置前的条目（session-memory 推荐使用）
    commandSource?: string,            // 例如 'whatsapp'、'telegram'
    senderId?: string,
    workspaceDir?: string,
    cfg?: OpenClawConfig,
    // 命令事件（仅 command:stop）：
    sessionId?: string,
    // 智能体引导事件（agent:bootstrap）：
    bootstrapFiles?: WorkspaceBootstrapFile[],
    sessionKey?: string,           // 路由会话键
    sessionId?: string,            // 内部会话 UUID
    agentId?: string,              // 已解析的智能体 ID
    // 消息事件（完整详情见"消息事件"部分）：
    from?: string,             // message:received
    to?: string,               // message:sent
    content?: string,
    channelId?: string,
    success?: boolean,         // message:sent
  }
}
```

## 事件类型

### 命令事件

在发出智能体命令时触发：

- **`command`**：所有命令事件（通用监听器）
- **`command:new`**：发出 `/new` 命令时
- **`command:reset`**：发出 `/reset` 命令时
- **`command:stop`**：发出 `/stop` 命令时

### 会话事件

- **`session:compact:before`**：在压缩开始总结历史记录之前
- **`session:compact:after`**：在压缩完成并带有摘要元数据之后

内部 hook 负载会将这些事件表示为 `type: "session"`，并将 `action` 设为 `"compact:before"` / `"compact:after"`；监听器使用上面的组合键进行订阅。
具体处理器注册使用字面量键格式 `${type}:${action}`。对于这些事件，请注册 `session:compact:before` 和 `session:compact:after`。

`session:compact:before` 上下文字段：

- `sessionId`：内部会话 UUID
- `missingSessionKey`：无会话键时为 true
- `messageCount`：压缩前的消息数量
- `tokenCount`：压缩前的 token 数量（可能不存在）
- `messageCountOriginal`：完整未截断会话历史的消息数量
- `tokenCountOriginal`：完整原始历史的 token 数量（可能不存在）

`session:compact:after` 上下文字段（除 `sessionId` 和 `missingSessionKey` 外）：

- `messageCount`：压缩后的消息数量
- `tokenCount`：压缩后的 token 数量（可能不存在）
- `compactedCount`：被压缩/移除的消息数量
- `summaryLength`：生成的压缩摘要的字符长度
- `tokensBefore`：压缩前的 token 数量（用于计算差值）
- `tokensAfter`：压缩后的 token 数量
- `firstKeptEntryId`：压缩后保留的第一条消息条目的 ID

### 智能体事件

- **`agent:bootstrap`**：在工作区引导文件被注入之前（hooks 可以修改 `context.bootstrapFiles`）

### Gateway 网关事件

在 Gateway 网关启动时触发：

- **`gateway:startup`**：在渠道启动且 hooks 已加载之后

### 会话补丁事件

在会话属性被修改时触发：

- **`session:patch`**：当会话被更新时

#### 会话事件上下文

会话事件包含关于会话和变更的丰富上下文：

```typescript
{
  sessionEntry: SessionEntry, // 完整的已更新会话条目
  patch: {                    // 补丁对象（仅包含已更改的字段）
    // 会话标识与标签
    label?: string | null,           // 可读会话标签

    // AI 模型配置
    model?: string | null,           // 模型覆盖（例如 "claude-sonnet-4-6"）
    thinkingLevel?: string | null,   // 思维级别（"off"|"low"|"med"|"high"）
    verboseLevel?: string | null,    // 详细输出级别
    reasoningLevel?: string | null,  // 推理模式覆盖
    elevatedLevel?: string | null,   // 增强模式覆盖
    responseUsage?: "off" | "tokens" | "full" | "on" | null, // 用量显示模式
    fastMode?: boolean | null,                    // 快速/turbo 模式切换
    spawnedWorkspaceDir?: string | null,          // 派生子智能体的工作区目录覆盖
    subagentRole?: "orchestrator" | "leaf" | null, // 子智能体角色分配
    subagentControlScope?: "children" | "none" | null, // 子智能体控制范围

    // 工具执行设置
    execHost?: string | null,        // 执行主机（sandbox|gateway|node）
    execSecurity?: string | null,    // 安全模式（deny|allowlist|full）
    execAsk?: string | null,         // 审批模式（off|on-miss|always）
    execNode?: string | null,        // host=node 时的节点 ID

    // 子智能体协调
    spawnedBy?: string | null,       // 父会话键（用于子智能体）
    spawnDepth?: number | null,      // 嵌套深度（0 = 根）

    // 通信策略
    sendPolicy?: "allow" | "deny" | null,          // 消息发送策略
    groupActivation?: "mention" | "always" | null, // 群组聊天激活
  },
  cfg: OpenClawConfig            // 当前 Gateway 网关配置
}
```

**安全说明：** 只有特权客户端（包括控制 UI）才能触发 `session:patch` 事件。标准 WebChat 客户端被阻止修补会话，因此 hook 不会从这些连接触发。

完整类型定义请参阅 `src/gateway/protocol/schema/sessions.ts` 中的 `SessionsPatchParamsSchema`。

#### 示例：会话补丁记录器 Hook

```typescript
const handler = async (event) => {
  if (event.type !== "session" || event.action !== "patch") {
    return;
  }
  const { patch } = event.context;
  console.log(`[session-patch] Session updated: ${event.sessionKey}`);
  console.log(`[session-patch] Changes:`, patch);
};

export default handler;
```

### 消息事件

在消息被接收或发送时触发：

- **`message`**：所有消息事件（通用监听器）
- **`message:received`**：当从任意渠道收到入站消息时。在处理的早期阶段触发，媒体理解尚未完成。对于尚未处理的媒体附件，内容中可能包含类似 `<media:audio>` 的原始占位符。
- **`message:transcribed`**：当一条消息已被完全处理，包括音频转写和链接理解时触发。此时，`transcript` 包含音频消息的完整转写文本。当你需要访问已转写的音频内容时，请使用此 hook。
- **`message:preprocessed`**：在所有媒体 + 链接理解完成后，为每条消息触发，使 hooks 可以在智能体看到消息之前访问完全增强的正文（转写、图像描述、链接摘要）。
- **`message:sent`**：当出站消息成功发送时

#### 消息事件上下文

消息事件包含关于消息的丰富上下文：

```typescript
// message:received context
{
  from: string,           // 发送者标识符（电话号码、用户 ID 等）
  content: string,        // 消息内容
  timestamp?: number,     // 接收时的 Unix 时间戳
  channelId: string,      // 渠道（例如 "whatsapp"、"telegram"、"discord"）
  accountId?: string,     // 多账号设置中的提供商账号 ID
  conversationId?: string, // 聊天/会话 ID
  messageId?: string,     // 提供商返回的消息 ID
  metadata?: {            // 额外的提供商特定数据
    to?: string,
    provider?: string,
    surface?: string,
    threadId?: string | number,
    senderId?: string,
    senderName?: string,
    senderUsername?: string,
    senderE164?: string,
    guildId?: string,     // Discord 服务器 ID
    channelName?: string, // 渠道名称（例如 Discord 频道名）
  }
}

// message:sent context
{
  to: string,             // 接收者标识符
  content: string,        // 已发送的消息内容
  success: boolean,       // 发送是否成功
  error?: string,         // 如果发送失败，则为错误消息
  channelId: string,      // 渠道（例如 "whatsapp"、"telegram"、"discord"）
  accountId?: string,     // 提供商账号 ID
  conversationId?: string, // 聊天/会话 ID
  messageId?: string,     // 提供商返回的消息 ID
  isGroup?: boolean,      // 此出站消息是否属于群组/渠道上下文
  groupId?: string,       // 用于与 message:received 关联的群组/渠道标识符
}

// message:transcribed context
{
  from?: string,          // 发送者标识符
  to?: string,            // 接收者标识符
  body?: string,          // 增强前的原始入站正文
  bodyForAgent?: string,  // 对智能体可见的增强正文
  transcript: string,     // 音频转写文本
  timestamp?: number,     // 接收时的 Unix 时间戳
  channelId: string,      // 渠道（例如 "telegram"、"whatsapp"）
  conversationId?: string,
  messageId?: string,
  senderId?: string,      // 发送者用户 ID
  senderName?: string,    // 发送者显示名称
  senderUsername?: string,
  provider?: string,      // 提供商名称
  surface?: string,       // 界面名称
  mediaPath?: string,     // 已转写的媒体文件路径
  mediaType?: string,     // 媒体的 MIME 类型
}

// message:preprocessed context
{
  from?: string,          // 发送者标识符
  to?: string,            // 接收者标识符
  body?: string,          // 原始入站正文
  bodyForAgent?: string,  // 媒体/链接理解后的最终增强正文
  transcript?: string,    // 存在音频时的转写内容
  timestamp?: number,     // 接收时的 Unix 时间戳
  channelId: string,      // 渠道（例如 "telegram"、"whatsapp"）
  conversationId?: string,
  messageId?: string,
  senderId?: string,      // 发送者用户 ID
  senderName?: string,    // 发送者显示名称
  senderUsername?: string,
  provider?: string,      // 提供商名称
  surface?: string,       // 界面名称
  mediaPath?: string,     // 媒体文件路径
  mediaType?: string,     // 媒体的 MIME 类型
  isGroup?: boolean,
  groupId?: string,
}
```

#### 示例：消息记录器 Hook

```typescript
const isMessageReceivedEvent = (event: { type: string; action: string }) =>
  event.type === "message" && event.action === "received";
const isMessageSentEvent = (event: { type: string; action: string }) =>
  event.type === "message" && event.action === "sent";

const handler = async (event) => {
  if (isMessageReceivedEvent(event as { type: string; action: string })) {
    console.log(`[message-logger] Received from ${event.context.from}: ${event.context.content}`);
  } else if (isMessageSentEvent(event as { type: string; action: string })) {
    console.log(`[message-logger] Sent to ${event.context.to}: ${event.context.content}`);
  }
};

export default handler;
```

### 工具结果 Hooks（插件 API）

这些 hooks 不是事件流监听器；它们允许插件在 OpenClaw 持久化工具结果之前同步调整工具结果。

- **`tool_result_persist`**：在工具结果写入会话转录之前对其进行转换。必须是同步的；返回更新后的工具结果负载，或返回 `undefined` 以保持原样。请参阅 [Agent Loop](/concepts/agent-loop)。

### 插件 Hook 事件

#### before_tool_call

在每次工具调用之前运行。插件可以修改参数、阻止调用或请求用户审批。

返回字段：

- **`params`**：覆盖工具参数（与原始参数合并）
- **`block`**：设为 `true` 可阻止工具调用
- **`blockReason`**：被阻止时向智能体显示的原因
- **`requireApproval`**：暂停执行并通过渠道等待用户审批

`requireApproval` 字段会触发原生平台审批（Telegram 按钮、Discord 组件、`/approve` 命令），而非依赖智能体配合：

```typescript
{
  requireApproval: {
    title: "Sensitive operation",
    description: "This tool call modifies production data",
    severity: "warning",       // "info" | "warning" | "critical"
    timeoutMs: 120000,         // 默认：120s
    timeoutBehavior: "deny",   // "allow" | "deny"（默认）
    onResolution: async (decision) => {
      // 用户解决后调用："allow-once"、"allow-always"、"deny"、"timeout" 或 "cancelled"
    },
  }
}
```

`onResolution` 回调在审批解决、超时或取消后使用最终决定字符串调用。它在插件内进程中运行（不发送到 Gateway 网关）。用于持久化决定、更新缓存或执行清理。

`pluginId` 字段由 hook 运行器从插件注册自动标记。当多个插件返回 `requireApproval` 时，第一个（最高优先级）胜出。

`block` 优先于 `requireApproval`：如果合并后的 hook 结果同时包含 `block: true` 和 `requireApproval` 字段，工具调用会立即被阻止，不会触发审批流程。这确保较高优先级插件的阻止不会被较低优先级插件的审批请求覆盖。

如果 Gateway 网关不可用或不支持插件审批，工具调用会回退到使用 `description` 作为阻止原因的软阻止。

#### before_install

在内置安装安全扫描后、安装继续之前运行。OpenClaw 会在交互式 skill 安装以及插件包、归档和单文件安装时触发此 hook。

返回字段：

- **`findings`**：作为警告呈现的额外扫描发现
- **`block`**：设为 `true` 可阻止安装
- **`blockReason`**：被阻止时显示的可读原因

事件字段：

- **`targetType`**：安装目标类别（`skill` 或 `plugin`）
- **`targetName`**：安装目标的可读 skill 名称或插件 ID
- **`sourcePath`**：被扫描的安装目标内容的绝对路径
- **`sourcePathKind`**：被扫描内容是 `file` 还是 `directory`
- **`origin`**：可用时的规范化安装来源（例如 `openclaw-bundled`、`openclaw-workspace`、`plugin-bundle`、`plugin-package` 或 `plugin-file`）
- **`request`**：安装请求的来源，包括 `kind`、`mode` 和可选的 `requestedSpecifier`
- **`builtinScan`**：内置扫描器的结构化结果，包括 `status`、摘要计数、发现和可选的 `error`
- **`skill`**：`targetType` 为 `skill` 时的 skill 安装元数据，包括 `installId` 和选定的 `installSpec`
- **`plugin`**：`targetType` 为 `plugin` 时的插件安装元数据，包括规范的 `pluginId`、规范化的 `contentType`、可选的 `packageName` / `manifestId` / `version` 和 `extensions`

示例事件（插件包安装）：

```json
{
  "targetType": "plugin",
  "targetName": "acme-audit",
  "sourcePath": "/var/folders/.../openclaw-plugin-acme-audit/package",
  "sourcePathKind": "directory",
  "origin": "plugin-package",
  "request": {
    "kind": "plugin-npm",
    "mode": "install",
    "requestedSpecifier": "@acme/openclaw-plugin-audit@1.4.2"
  },
  "builtinScan": {
    "status": "ok",
    "scannedFiles": 12,
    "critical": 0,
    "warn": 1,
    "info": 0,
    "findings": [
      {
        "severity": "warn",
        "ruleId": "network_fetch",
        "file": "dist/index.js",
        "line": 88,
        "message": "Dynamic network fetch detected during install review."
      }
    ]
  },
  "plugin": {
    "pluginId": "acme-audit",
    "contentType": "package",
    "packageName": "@acme/openclaw-plugin-audit",
    "manifestId": "acme-audit",
    "version": "1.4.2",
    "extensions": ["./dist/index.js"]
  }
}
```

Skill 安装使用相同的事件结构，但 `targetType: "skill"` 且包含 `skill` 对象而非 `plugin`。

决策语义：

- `before_install`：`{ block: true }` 是终止性的，会阻止较低优先级的处理器。
- `before_install`：`{ block: false }` 被视为无决策。

对于需要在安装前审计安装来源的外部安全扫描器、策略引擎或企业审批门控，请使用此 hook。

#### 压缩生命周期

通过插件 hook 运行器暴露的压缩生命周期 hooks：

- **`before_compaction`**：在压缩前运行，并带有计数/token 元数据
- **`after_compaction`**：在压缩后运行，并带有压缩摘要元数据

### 完整插件 Hook 参考

所有通过插件 SDK 注册的 27 个 hook。标记为**顺序**的 hook 按优先级顺序运行并可修改结果；**并行** hook 是即发即忘的。

#### 模型和提示 hooks

| Hook                   | 触发时机                                   | 执行方式 | 返回值                                                     |
| ---------------------- | ------------------------------------------ | -------- | ---------------------------------------------------------- |
| `before_model_resolve` | 模型/提供商查找之前                        | 顺序     | `{ modelOverride?, providerOverride? }`                    |
| `before_prompt_build`  | 模型已解析、会话消息就绪之后               | 顺序     | `{ systemPrompt?, prependContext?, appendSystemContext? }` |
| `before_agent_start`   | 旧版组合 hook（推荐使用上面两个）          | 顺序     | 两种结果形状的联合                                         |
| `llm_input`            | LLM API 调用之前                           | 并行     | `void`                                                     |
| `llm_output`           | 收到 LLM 响应之后                          | 并行     | `void`                                                     |

#### 智能体生命周期 hooks

| Hook                | 触发时机                                   | 执行方式 | 返回值   |
| ------------------- | ------------------------------------------ | -------- | -------- |
| `agent_end`         | 智能体运行完成后（成功或失败）             | 并行     | `void`   |
| `before_reset`      | `/new` 或 `/reset` 清除会话时             | 并行     | `void`   |
| `before_compaction` | 压缩开始总结历史之前                       | 并行     | `void`   |
| `after_compaction`  | 压缩完成之后                               | 并行     | `void`   |

#### 会话生命周期 hooks

| Hook            | 触发时机                 | 执行方式 | 返回值   |
| --------------- | ------------------------ | -------- | -------- |
| `session_start` | 新会话开始时             | 并行     | `void`   |
| `session_end`   | 会话结束时               | 并行     | `void`   |

#### 消息流 hooks

| Hook                   | 触发时机                                              | 执行方式             | 返回值                        |
| ---------------------- | ----------------------------------------------------- | -------------------- | ----------------------------- |
| `inbound_claim`        | 命令/智能体分发之前；首个声明胜出                     | 顺序                 | `{ handled: boolean }`        |
| `message_received`     | 入站消息收到之后                                      | 并行                 | `void`                        |
| `before_dispatch`      | 命令解析完成、模型分发之前                            | 顺序                 | `{ handled: boolean, text? }` |
| `message_sending`      | 出站消息投递之前                                      | 顺序                 | `{ content?, cancel? }`       |
| `message_sent`         | 出站消息投递之后                                      | 并行                 | `void`                        |
| `before_message_write` | 消息写入会话转录之前                                  | **同步**，顺序       | `{ block?, message? }`        |

#### 工具执行 hooks

| Hook                  | 触发时机                                          | 执行方式             | 返回值                                                |
| --------------------- | ------------------------------------------------- | -------------------- | ----------------------------------------------------- |
| `before_tool_call`    | 每次工具调用之前                                  | 顺序                 | `{ params?, block?, blockReason?, requireApproval? }` |
| `after_tool_call`     | 工具调用完成之后                                  | 并行                 | `void`                                                |
| `tool_result_persist` | 工具结果写入转录之前                              | **同步**，顺序       | `{ message? }`                                        |

#### 子智能体 hooks

| Hook                       | 触发时机                                   | 执行方式 | 返回值                            |
| -------------------------- | ------------------------------------------ | -------- | --------------------------------- |
| `subagent_spawning`        | 子智能体会话创建之前                       | 顺序     | `{ status, threadBindingReady? }` |
| `subagent_delivery_target` | 派生之后，解析投递目标时                   | 顺序     | `{ origin? }`                     |
| `subagent_spawned`         | 子智能体完全派生之后                       | 并行     | `void`                            |
| `subagent_ended`           | 子智能体会话终止时                         | 并行     | `void`                            |

#### Gateway 网关 hooks

| Hook            | 触发时机                                   | 执行方式 | 返回值   |
| --------------- | ------------------------------------------ | -------- | -------- |
| `gateway_start` | Gateway 网关进程完全启动后                 | 并行     | `void`   |
| `gateway_stop`  | Gateway 网关正在关闭时                     | 并行     | `void`   |

#### 安装 hooks

| Hook             | 触发时机                                                  | 执行方式 | 返回值                                |
| ---------------- | --------------------------------------------------------- | -------- | ------------------------------------- |
| `before_install` | 内置安全扫描后、安装继续之前                              | 顺序     | `{ findings?, block?, blockReason? }` |

<Note>
两个 hook（`tool_result_persist` 和 `before_message_write`）**仅支持同步**——它们不能返回 Promise。从这些 hook 返回 Promise 会在运行时被捕获，结果会被丢弃并发出警告。
</Note>

完整处理器签名和上下文类型请参阅[插件架构](/plugins/architecture)。

### 未来事件

以下事件类型计划用于内部 hook 事件流。
注意 `session_start` 和 `session_end` 已作为[插件 Hook API](/plugins/architecture#provider-runtime-hooks) hook 存在，
但尚未作为 `HOOK.md` 元数据中的内部 hook 事件键提供：

- **`session:start`**：当新会话开始时（计划用于内部 hook 流；可作为插件 hook `session_start` 使用）
- **`session:end`**：当会话结束时（计划用于内部 hook 流；可作为插件 hook `session_end` 使用）
- **`agent:error`**：当智能体遇到错误时

## 创建自定义 Hooks

### 1. 选择位置

- **工作区 hooks**（`<workspace>/hooks/`）：每个智能体单独配置；可以添加新 hook 名称，但不能覆盖同名的内置、托管或插件 hook
- **托管 hooks**（`~/.openclaw/hooks/`）：跨工作区共享；可覆盖内置和插件 hook

### 2. 创建目录结构

```bash
mkdir -p ~/.openclaw/hooks/my-hook
cd ~/.openclaw/hooks/my-hook
```

### 3. 创建 HOOK.md

```markdown
---
name: my-hook
description: "Does something useful"
metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
---

# My Custom Hook

当你发出 `/new` 时，此 hook 会执行一些有用的事情。
```

### 4. 创建 handler.ts

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log("[my-hook] Running!");
  // 你的逻辑写在这里
};

export default handler;
```

### 5. 启用并测试

```bash
# 验证 hook 已被发现
openclaw hooks list

# 启用它
openclaw hooks enable my-hook

# 重启你的 Gateway 网关进程（macOS 上重启菜单栏应用，或重启你的开发进程）

# 触发事件
# 通过你的消息渠道发送 /new
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

Hooks 可以具有自定义配置：

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

从额外目录加载 hooks（被视为托管 hook，共享相同的覆盖优先级）：

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

### 旧版配置格式（仍受支持）

旧配置格式仍可用于向后兼容：

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

注意：`module` 必须是相对于工作区的路径。绝对路径和超出工作区范围的遍历路径会被拒绝。

**迁移**：对于新的 hooks，请使用基于发现的新系统。旧版 handlers 会在基于目录的 hooks 之后加载。

## CLI 命令

### 列出 Hooks

```bash
# 列出所有 hooks
openclaw hooks list

# 仅显示符合条件的 hooks
openclaw hooks list --eligible

# 详细输出（显示缺失的要求）
openclaw hooks list --verbose

# JSON 输出
openclaw hooks list --json
```

### Hook 信息

```bash
# 显示某个 hook 的详细信息
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
# 启用一个 hook
openclaw hooks enable session-memory

# 禁用一个 hook
openclaw hooks disable command-logger
```

## 内置 hook 参考

### session-memory

当你发出 `/new` 或 `/reset` 时，将会话上下文保存到 memory。

**事件**：`command:new`、`command:reset`

**要求**：必须配置 `workspace.dir`

**输出**：`<workspace>/memory/YYYY-MM-DD-slug.md`（默认是 `~/.openclaw/workspace`）

**它的作用**：

1. 使用重置前的会话条目定位正确的转录
2. 从对话中提取最近 15 条用户/助手消息（可配置）
3. 使用 LLM 生成描述性的文件名 slug
4. 将会话元数据保存到带日期的 memory 文件中

**示例输出**：

```markdown
# Session: 2026-01-16 14:30:00 UTC

- **Session Key**: agent:main:main
- **Session ID**: abc123def456
- **Source**: telegram

## Conversation Summary

user: Can you help me design the API?
assistant: Sure! Let's start with the endpoints...
```

**文件名示例**：

- `2026-01-16-vendor-pitch.md`
- `2026-01-16-api-design.md`
- `2026-01-16-1430.md`（如果 slug 生成失败，则回退为时间戳）

**启用**：

```bash
openclaw hooks enable session-memory
```

### bootstrap-extra-files

在 `agent:bootstrap` 期间注入额外的引导文件（例如 monorepo 本地的 `AGENTS.md` / `TOOLS.md`）。

**事件**：`agent:bootstrap`

**要求**：必须配置 `workspace.dir`

**输出**：不写入文件；仅在内存中修改引导上下文。

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

**配置选项**：

- `paths`（string[]）：从工作区解析的 glob/路径模式。
- `patterns`（string[]）：`paths` 的别名。
- `files`（string[]）：`paths` 的别名。

**说明**：

- 路径相对于工作区解析。
- 文件必须保持在工作区内部（通过 realpath 检查）。
- 仅加载已识别的引导基础文件名（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`、`memory.md`）。
- 对于子智能体/cron 会话，适用更窄的允许列表（`AGENTS.md`、`TOOLS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`）。

**启用**：

```bash
openclaw hooks enable bootstrap-extra-files
```

### command-logger

将所有命令事件记录到集中式审计文件。

**事件**：`command`

**要求**：无

**输出**：`~/.openclaw/logs/commands.log`

**它的作用**：

1. 捕获事件详情（命令操作、时间戳、会话键、发送者 ID、来源）
2. 以 JSONL 格式附加到日志文件
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

# 使用 jq 美化输出
cat ~/.openclaw/logs/commands.log | jq .

# 按操作筛选
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**启用**：

```bash
openclaw hooks enable command-logger
```

### boot-md

当 Gateway 网关启动时（渠道启动之后）运行 `BOOT.md`。
必须启用内部 hooks，此功能才会运行。

**事件**：`gateway:startup`

**要求**：必须配置 `workspace.dir`

**它的作用**：

1. 从你的工作区读取 `BOOT.md`
2. 通过智能体运行器执行其中的指令
3. 通过消息工具发送任何请求的出站消息

**启用**：

```bash
openclaw hooks enable boot-md
```

## 最佳实践

### 保持处理器快速

Hooks 在命令处理期间运行。请保持其轻量：

```typescript
// ✓ 好 - 异步工作，立即返回
const handler: HookHandler = async (event) => {
  void processInBackground(event); // 触发后不等待
};

// ✗ 差 - 阻塞命令处理
const handler: HookHandler = async (event) => {
  await slowDatabaseQuery(event);
  await evenSlowerAPICall(event);
};
```

### 优雅地处理错误

始终包装高风险操作：

```typescript
const handler: HookHandler = async (event) => {
  try {
    await riskyOperation(event);
  } catch (err) {
    console.error("[my-handler] Failed:", err instanceof Error ? err.message : String(err));
    // 不要抛出错误 - 让其他处理器继续运行
  }
};
```

### 尽早过滤事件

如果事件不相关，请尽早返回：

```typescript
const handler: HookHandler = async (event) => {
  // 仅处理 'new' 命令
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  // 你的逻辑写在这里
};
```

### 使用具体事件键

如果可能，请在元数据中指定精确事件：

```yaml
metadata: { "openclaw": { "events": ["command:new"] } } # 精确
```

而不是：

```yaml
metadata: { "openclaw": { "events": ["command"] } } # 通用 - 开销更大
```

## 调试

### 启用 Hook 日志

Gateway 网关会在启动时记录 hook 加载情况：

```
Registered hook: session-memory -> command:new, command:reset
Registered hook: bootstrap-extra-files -> agent:bootstrap
Registered hook: command-logger -> command
Registered hook: boot-md -> gateway:startup
```

### 检查发现情况

列出所有已发现的 hooks：

```bash
openclaw hooks list --verbose
```

### 检查注册情况

在你的处理器中，记录它何时被调用：

```typescript
const handler: HookHandler = async (event) => {
  console.log("[my-handler] Triggered:", event.type, event.action);
  // 你的逻辑
};
```

### 验证资格

检查某个 hook 为什么不符合条件：

```bash
openclaw hooks info my-hook
```

查看输出中缺失的要求。

## 测试

### Gateway 网关日志

监控 Gateway 网关日志以查看 hook 执行情况：

```bash
# macOS
./scripts/clawlog.sh -f

# 其他平台
tail -f ~/.openclaw/gateway.log
```

### 直接测试 Hooks

单独测试你的 handlers：

```typescript
import { test } from "vitest";
import myHandler from "./hooks/my-hook/handler.js";

test("my handler works", async () => {
  const event = {
    type: "command",
    action: "new",
    sessionKey: "test-session",
    timestamp: new Date(),
    messages: [],
    context: { foo: "bar" },
  };

  await myHandler(event);

  // 断言副作用
});
```

## 架构

### 核心组件

- **`src/hooks/types.ts`**：类型定义
- **`src/hooks/workspace.ts`**：目录扫描与加载
- **`src/hooks/frontmatter.ts`**：`HOOK.md` 元数据解析
- **`src/hooks/config.ts`**：资格检查
- **`src/hooks/hooks-status.ts`**：状态报告
- **`src/hooks/loader.ts`**：动态模块加载器
- **`src/cli/hooks-cli.ts`**：CLI 命令
- **`src/gateway/server-startup.ts`**：在 Gateway 网关启动时加载 hooks
- **`src/auto-reply/reply/commands-core.ts`**：触发命令事件

### 发现流程

```
Gateway 网关启动
    ↓
扫描目录（内置 → 插件 → 托管 + 额外目录 → 工作区）
    ↓
解析 HOOK.md 文件
    ↓
按覆盖优先级排序（内置 < 插件 < 托管 < 工作区）
    ↓
检查资格（bins、env、config、os）
    ↓
从符合条件的 hooks 加载 handlers
    ↓
为事件注册 handlers
```

### 事件流程

```
用户发送 /new
    ↓
命令校验
    ↓
创建 hook 事件
    ↓
触发 hook（所有已注册的 handlers）
    ↓
命令处理继续
    ↓
会话重置
```

## 故障排除

### Hook 未被发现

1. 检查目录结构：

   ```bash
   ls -la ~/.openclaw/hooks/my-hook/
   # 应显示：HOOK.md, handler.ts
   ```

2. 验证 HOOK.md 格式：

   ```bash
   cat ~/.openclaw/hooks/my-hook/HOOK.md
   # 应包含带有 name 和 metadata 的 YAML frontmatter
   ```

3. 列出所有已发现的 hooks：

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
- OS 兼容性

### Hook 未执行

1. 验证 hook 已启用：

   ```bash
   openclaw hooks list
   # 应在已启用的 hooks 旁显示 ✓
   ```

2. 重启你的 Gateway 网关进程以重新加载 hooks。

3. 检查 Gateway 网关日志中的错误：

   ```bash
   ./scripts/clawlog.sh | grep hook
   ```

### 处理器错误

检查 TypeScript/import 错误：

```bash
# 直接测试导入
node -e "import('./path/to/handler.ts').then(console.log)"
```

## 迁移指南

### 从旧版配置迁移到发现机制

**迁移前**：

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

**迁移后**：

1. 创建 hook 目录：

   ```bash
   mkdir -p ~/.openclaw/hooks/my-hook
   mv ./hooks/handlers/my-handler.ts ~/.openclaw/hooks/my-hook/handler.ts
   ```

2. 创建 HOOK.md：

   ```markdown
   ---
   name: my-hook
   description: "My custom hook"
   metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
   ---

   # My Hook

   执行某些有用的事情。
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

4. 验证并重启你的 Gateway 网关进程：

   ```bash
   openclaw hooks list
   # 应显示：🎯 my-hook ✓
   ```

**迁移的好处**：

- 自动发现
- CLI 管理
- 资格检查
- 更好的文档
- 一致的结构

## 另请参阅

- [CLI Reference: hooks](/cli/hooks)
- [Bundled Hooks README](https://github.com/openclaw/openclaw/tree/main/src/hooks/bundled)
- [Webhook Hooks](/automation/webhook)
- [Configuration](/gateway/configuration#hooks)
