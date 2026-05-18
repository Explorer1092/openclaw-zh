---
mmh3_hash: "4a66cc1a8ceb0dcb6358520b8776cece"
summary: "OpenClaw code mode：一种可选的 exec/wait 工具界面，由 QuickJS-WASI 和隐藏的运行范围工具目录支撑"
title: "Code mode"
sidebarTitle: "Code mode"
read_when:
  - 你想为 Agent 运行启用 OpenClaw code mode 时
  - 你需要解释 code mode 与 Codex Code mode 的区别时
  - 你正在审查 exec/wait 合约、QuickJS-WASI 沙箱、TypeScript 转换或隐藏的工具目录桥接时
---

Code mode 是 OpenClaw Agent 运行时的一项实验性功能，默认关闭。启用后，OpenClaw 会为一次运行改变模型所见的内容：不是直接暴露每个已启用工具的 Schema，而是让模型只能看到 `exec` 和 `wait`。

本页记录 OpenClaw code mode。它不是 Codex Code mode。Codex Code mode 是 Codex 编码工作架的一部分，有自己的项目工作区、运行时、工具和执行语义。Codex Code mode 和 Codex 原生动态工具搜索是稳定的 Codex 工作架界面。OpenClaw code mode 是 OpenClaw 自有的、用于通用 OpenClaw 运行的实验性工具界面适配器。它使用 `quickjs-wasi`、隐藏的 OpenClaw 工具目录和正常的 OpenClaw 工具执行器。

## 这是什么？

OpenClaw code mode 让模型编写一个小型 JavaScript 或 TypeScript 程序，而不是直接从长列表中选择工具。

当 code mode 激活时：

- 模型可见的工具列表恰好是 `exec` 和 `wait`。
- `exec` 在受约束的 QuickJS-WASI worker 中评估模型生成的 JavaScript 或 TypeScript。
- 普通的 OpenClaw 工具对模型提示词隐藏，并通过 `ALL_TOOLS` 和 `tools` 在访客程序内部暴露。
- 访客代码可以搜索隐藏目录、描述工具，并通过 Agent 轮次中使用的相同 OpenClaw 执行路径调用工具。
- `wait` 在嵌套工具调用仍在等待时恢复已暂停的 code mode 运行。

重要区别：code mode 改变了面向模型的编排界面。它不替换 OpenClaw 工具、插件工具、MCP 工具、认证、批准策略、Channel 行为或模型选择。

## 为什么这有用？

Code mode 使模型更容易使用大型工具目录。

- 更小的提示词界面：Provider 接收两个控制工具，而非数十或数百个完整工具 Schema。
- 更好的编排：模型可以在一个代码单元内使用循环、连接、小型转换、条件逻辑和并行嵌套工具调用。
- Provider 中立：它适用于 OpenClaw、插件、MCP 和客户端工具，无需依赖 Provider 原生代码执行。
- 现有策略保持有效：嵌套工具调用仍通过 OpenClaw 策略、批准、Hook、Session 上下文和审计路径。
- 清晰的失败模式：当 code mode 被明确启用但运行时不可用时，OpenClaw 会失败关闭，而不是回退到广泛的直接工具暴露。

Code mode 对于拥有大型已启用工具目录的 Agent，或模型在产生答案之前需要反复搜索、组合和调用工具的工作流，特别有用。

## 如何启用

将 `tools.codeMode.enabled: true` 添加到 Agent 或运行时配置：

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

也接受简写形式：

```json5
{
  tools: {
    codeMode: true,
  },
}
```

当 `tools.codeMode` 被省略、为 `false` 或为不含 `enabled: true` 的对象时，code mode 保持关闭。

需要更严格限制时，使用明确的限制：

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

调试时，使用针对性日志确认模型载荷形状：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

激活 code mode 后，记录的面向模型的工具名称应为 `exec` 和 `wait`。如果需要经过脱敏的 Provider 载荷，在短暂的调试会话中添加 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。

## 技术概览

本页的其余部分描述运行时合约和实现细节，适合维护者、调试工具暴露的插件作者以及验证高风险部署的操作者阅读。

## 运行时状态

- 运行时：[`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)。
- 默认状态：禁用。
- 稳定性：实验性 OpenClaw 界面；Codex Code mode 是独立的稳定 Codex 工作架界面。
- 目标界面：通用 OpenClaw Agent 运行。
- 安全态势：模型代码是恶意的。
- 面向用户的承诺：启用 code mode 永远不会静默回退到广泛的直接工具暴露。

## 范围

Code mode 拥有准备好的运行的面向模型的编排形状。它不拥有模型选择、Channel 行为、认证、工具策略或工具实现。

范围内：

- 模型可见的 `exec` 和 `wait` 工具定义
- 隐藏工具目录构建
- JavaScript 和 TypeScript 访客执行
- QuickJS-WASI worker 运行时
- 目录搜索、Schema 描述和工具调用的主机回调
- 暂停访客程序的可恢复状态
- 输出、超时、内存、待处理调用和快照限制
- 嵌套工具调用的遥测和轨迹投影

范围外：

- Provider 原生远程代码执行
- Shell 执行语义
- 更改现有工具授权
- 持久化用户创作的脚本
- 访客代码中的包管理器、文件、网络或模块访问
- 直接复用 Codex Code mode 内部实现

Provider 拥有的工具（如远程 Python 沙箱）保持独立工具。参见[代码执行](/tools/code-execution)。

## 术语

**Code mode** 是隐藏普通模型工具并仅暴露 `exec` 和 `wait` 的 OpenClaw 运行时模式。

**访客运行时**是评估模型代码的 QuickJS-WASI JavaScript VM。

**主机桥接**是从访客代码回到 OpenClaw 的窄 JSON 兼容回调界面。

**目录**是经过正常工具策略、插件、MCP 和客户端工具解析后的运行范围有效工具列表。

**嵌套工具调用**是从访客代码通过主机桥接发出的工具调用。

**快照**是序列化的 QuickJS-WASI VM 状态，保存以便 `wait` 可以继续已暂停的 code mode 运行。

## 配置

`tools.codeMode.enabled` 是激活门控。设置其他 code mode 字段不会启用该功能。

支持的字段：

- `enabled`：布尔值。默认 `false`。仅当为 `true` 时启用 code mode。
- `runtime`：`"quickjs-wasi"`。唯一支持的运行时。
- `mode`：`"only"`。暴露 `exec` 和 `wait`，隐藏普通模型工具。
- `languages`：`"javascript"` 和 `"typescript"` 的数组。默认包含两者。
- `timeoutMs`：一次 `exec` 或 `wait` 的挂钟上限。默认 `10000`。运行时限制：`100` 到 `60000`。
- `memoryLimitBytes`：QuickJS 堆上限。默认 `67108864`。运行时限制：`1048576` 到 `1073741824`。
- `maxOutputBytes`：返回文本、JSON 和日志的上限。默认 `65536`。运行时限制：`1024` 到 `10485760`。
- `maxSnapshotBytes`：序列化 VM 快照的上限。默认 `10485760`。运行时限制：`1024` 到 `268435456`。
- `maxPendingToolCalls`：并发嵌套工具调用的上限。默认 `16`。运行时限制：`1` 到 `128`。
- `snapshotTtlSeconds`：暂停 VM 可被恢复的时长。默认 `900`。运行时限制：`1` 到 `86400`。
- `searchDefaultLimit`：默认隐藏目录搜索结果数。默认 `8`。运行时将其限制在 `maxSearchLimit` 内。
- `maxSearchLimit`：最大隐藏目录搜索结果数。默认 `50`。运行时限制：`1` 到 `50`。

如果 code mode 已启用但 QuickJS-WASI 无法加载，OpenClaw 会对该运行失败关闭。它不会静默地将普通工具作为备选暴露。

## 激活

Code mode 在已知有效工具策略后、最终模型请求组装之前进行评估。

激活顺序：

1. 解析 Agent、模型、Provider、沙箱、Channel、发送者和运行策略。
2. 构建有效的 OpenClaw 工具列表。
3. 添加符合条件的插件、MCP 和客户端工具。
4. 应用允许和拒绝策略。
5. 如果 `tools.codeMode.enabled` 为 false，继续使用正常工具暴露。
6. 如果已启用且运行中有活跃工具，在 code mode 目录中注册有效工具。
7. 从模型可见工具列表中移除所有普通工具。
8. 添加 code mode 的 `exec` 和 `wait`。

有意没有工具的运行（如原始模型调用、`disableTools` 或空白名单）即使配置中包含 `tools.codeMode.enabled: true`，也不会激活 code mode 界面。

Code mode 目录的范围为每次运行。它不得从另一个 Agent、Session、发送者或运行中泄漏工具。

## 模型可见工具

当 code mode 激活时，模型恰好看到这些顶级工具：

- `exec`
- `wait`

所有其他已启用工具对模型可见工具列表隐藏，并在 code mode 目录中注册。

模型应使用 `exec` 进行工具编排、数据连接、循环、并行嵌套调用和结构化转换。仅当 `exec` 返回可恢复的 `waiting` 结果时，模型才应使用 `wait`。

## `exec`

`exec` 启动一个 code mode 单元并返回一个结果。输入代码由模型生成，必须被视为恶意的。

输入：

```typescript
type CodeModeExecInput = {
  code: string;
  language?: "javascript" | "typescript";
};
```

输入规则：

- `code` 是必填项且必须非空。
- `language` 默认为 `"javascript"`。
- 如果 `language` 为 `"typescript"`，OpenClaw 在评估前进行转换。
- `exec` 在 v1 中拒绝 `import`、`require`、动态导入和模块加载器模式。
- `exec` 不会递归暴露普通的 Shell `exec` 实现。

结果：

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

当 QuickJS VM 以可恢复状态暂停时，`exec` 返回 `waiting`。结果包含用于 `wait` 的 `runId`。

仅当访客 VM 没有待处理工作且最终值在 OpenClaw 的输出适配器运行后与 JSON 兼容时，`exec` 才返回 `completed`。

## `wait`

`wait` 继续已暂停的 code mode VM。

输入：

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

输出与 `exec` 返回的 `CodeModeResult` 联合类型相同。

`wait` 的存在是因为嵌套的 OpenClaw 工具可能很慢、需要交互、受批准门控或流式传输部分更新。模型不应在主机等待外部工作时保持一个长 `exec` 调用开放。

QuickJS-WASI 快照和恢复是 v1 的恢复机制：

1. `exec` 评估代码直到完成、失败或暂停。
2. 暂停时，OpenClaw 对 QuickJS VM 进行快照并记录待处理的主机工作。
3. 当待处理工作完成时，`wait` 恢复 VM 快照。
4. OpenClaw 按稳定名称重新注册主机回调。
5. OpenClaw 将嵌套工具结果传入恢复的 VM。
6. OpenClaw 排空 QuickJS 待处理任务。
7. `wait` 返回 `completed`、`failed` 或另一个 `waiting` 结果。

快照是运行时状态，而非用户产物。它们有大小限制、过期时间，并且作用域限于创建它们的运行和 Session。

`wait` 在以下情况下失败：

- `runId` 未知。
- 快照已过期。
- 父运行或 Session 已中止。
- 调用者不在相同的运行/Session 范围内。
- QuickJS-WASI 恢复失败。
- 恢复会超过配置的限制。

## 访客运行时 API

访客运行时暴露了一个小型全局 API：

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` 是运行范围目录的紧凑元数据。默认不包含完整 Schema。

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

完整 Schema 仅按需加载：

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

目录辅助函数：

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

便利工具函数仅为无歧义的安全名称安装：

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// 如果隐藏目录有一个无歧义的 `web_search` 条目：
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

访客运行时不得直接暴露主机对象。输入和输出通过具有明确大小限制的 JSON 兼容值跨越桥接。

## 输出 API

`text(value)` 将人类可读输出追加到 `output` 数组。

`json(value)` 在 JSON 兼容序列化后追加结构化输出项。

访客代码的最终返回值成为 `completed` 结果中的 `value`。

输出项：

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

输出规则：

- 输出顺序与访客调用匹配
- 输出受 `maxOutputBytes` 限制
- 不可序列化的值转换为普通字符串或错误
- v1 中不支持二进制值
- 图像和文件通过普通的 OpenClaw 工具传输，而非通过 code mode 桥接

## 工具目录

隐藏目录包含经过有效策略过滤后的工具：

1. OpenClaw 核心工具。
2. 捆绑插件工具。
3. 外部插件工具。
4. MCP 工具。
5. 当前运行的客户端提供的工具。

目录 ID 在一次运行内稳定，并在可能的情况下跨等效工具集具有确定性。

推荐的 ID 格式：

```text
<source>:<owner>:<tool-name>
```

示例：

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

目录省略 code mode 控制工具：

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

这防止递归并保持面向模型的合约简洁。

## 与 Tool Search 的交互

对于激活它的运行，code mode 取代了 PI Tool Search 模型界面。

当 `tools.codeMode.enabled` 为 true 且 code mode 激活时：

- OpenClaw 不会将 `tool_search_code`、`tool_search`、`tool_describe` 或 `tool_call` 暴露为模型可见工具。
- 相同的目录思想移入访客运行时。
- 访客运行时接收紧凑的 `ALL_TOOLS` 元数据以及搜索、描述和调用辅助函数。
- 嵌套调用通过 Tool Search 使用的相同 OpenClaw 执行器路径分发。

现有的 [Tool Search](/tools/tool-search) 页面描述了 PI 紧凑目录桥接。Code mode 是可以使用 `exec` 和 `wait` 的运行的通用 OpenClaw 替代方案。

## 工具名称和冲突

模型可见的 `exec` 工具是 code mode 工具。如果普通的 OpenClaw Shell `exec` 工具已启用，它对模型隐藏并像任何其他工具一样被编入目录。

在访客运行时内部：

- 如果策略允许，`tools.call("openclaw:core:exec", input)` 可以调用 Shell exec 工具。
- 仅当 Shell exec 目录条目有无歧义的安全名称时，才安装 `tools.exec(...)`。
- code mode `exec` 工具永远不会通过 `tools` 递归可用。

如果两个工具归一化为相同的安全便利名称，OpenClaw 省略便利函数并要求 `tools.call(id, input)`。

## 嵌套工具执行

每个嵌套工具调用都跨越主机桥接并重新进入 OpenClaw。

嵌套执行保留：

- 活跃 Agent ID
- Session ID 和 Session 键
- 发送者和 Channel 上下文
- 沙箱策略
- 批准策略
- 插件 `before_tool_call` Hook
- 中止信号
- 可用时的流式更新
- 轨迹和审计事件

嵌套调用投影到转录中作为真实工具调用，以便支持包可以显示发生的情况。投影标识父 code mode 工具调用和嵌套工具 ID。

并行嵌套调用被允许，最多 `maxPendingToolCalls` 个。

## 运行时状态

每个 code mode 运行都有一个状态机：

- `running`：VM 正在执行或嵌套调用正在进行。
- `waiting`：VM 快照存在，可以用 `wait` 恢复。
- `completed`：返回最终值；快照已删除。
- `failed`：返回错误；快照已删除。
- `expired`：快照或待处理状态超过保留期；无法恢复。
- `aborted`：父运行/Session 已取消；快照已删除。

状态按 Agent 运行、Session 和工具调用 ID 作用域。来自不同运行或 Session 的 `wait` 调用会失败。

快照存储有界：

- 每次运行的最大快照字节数
- 每个进程的最大活跃快照数
- 快照 TTL
- 运行结束时清理
- 不支持持久化时的 Gateway 关机清理

## QuickJS-WASI 运行时

OpenClaw 在拥有的包中将 `quickjs-wasi` 作为直接依赖项加载。运行时不依赖为代理、PAC 或其他无关依赖项安装的传递副本。

运行时职责：

- 编译或加载 QuickJS-WASI WebAssembly 模块
- 为每次 code mode 运行或恢复创建一个隔离的 VM
- 按稳定名称注册主机回调
- 设置内存和中断限制
- 评估 JavaScript
- 排空待处理任务
- 对暂停的 VM 状态进行快照
- 为 `wait` 恢复快照
- 在终止状态后处置 VM 句柄和快照

运行时在 worker 中在 OpenClaw 主事件循环之外执行。访客无限循环不得无限期阻塞 Gateway 进程。

## TypeScript

TypeScript 支持仅是源转换：

- 接受的输入：一个 TypeScript 代码字符串
- 输出：由 QuickJS-WASI 评估的 JavaScript 字符串
- 不进行类型检查
- 不进行模块解析
- v1 中不支持 `import` 或 `require`
- 诊断作为 `failed` 结果返回

TypeScript 编译器仅对 TypeScript 单元懒加载。普通 JavaScript 单元和禁用的 code mode 不加载编译器。

转换应在可行时保留有用的行号。

## 安全边界

模型代码是恶意的。运行时使用深度防御：

- 在主事件循环之外运行 QuickJS-WASI
- 作为直接依赖项加载 `quickjs-wasi`，而非通过 Codex 或传递包
- 访客中没有文件系统、网络、子进程、模块导入、环境变量或主机全局对象
- 使用 QuickJS 内存和中断限制
- 强制父进程挂钟超时
- 强制输出、快照、日志和待处理调用上限
- 通过窄 JSON 适配器序列化主机桥接值
- 将主机错误转换为普通访客错误，绝不传入主机 realm 对象
- 超时、中止、Session 结束或过期时删除快照
- 拒绝对 `exec`、`wait` 和 Tool Search 控制工具的递归访问
- 防止便利名称冲突遮蔽目录辅助函数

沙箱是一个安全层。高风险部署的操作者仍需要 OS 级别的加固。

## 错误码

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

返回给访客的错误是普通数据。主机 `Error` 实例、堆栈对象、原型和主机函数不会进入 QuickJS。

## 遥测

Code mode 报告：

- 发送给模型的可见工具名称
- 隐藏目录大小和来源细分
- `exec` 和 `wait` 计数
- 嵌套搜索、描述和调用计数
- 调用的嵌套工具 ID
- 超时、内存、快照和输出上限失败
- 快照生命周期事件

遥测不得包含密钥、原始环境值或超出现有 OpenClaw 轨迹策略的未脱敏工具输入。

## 调试

当 code mode 行为与正常工具运行不同时，使用针对性模型传输日志：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

对于载荷形状调试，使用 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。这记录模型请求的一个上限、脱敏的 JSON 快照；仅在调试时使用，因为提示词和消息文本仍可能出现。

对于流调试，使用 `OPENCLAW_DEBUG_SSE=peek` 记录前五个脱敏的 SSE 事件。如果最终 Provider 载荷在 code mode 界面激活后未恰好包含 `exec` 和 `wait`，code mode 也会失败关闭。

## 实现布局

实现单元：

- 配置合约：`tools.codeMode`
- 目录构建器：有效工具到紧凑条目和 ID 映射
- 模型界面适配器：用 `exec` 和 `wait` 替换可见工具
- QuickJS-WASI 运行时适配器：加载、评估、快照、恢复、处置
- Worker 监督器：超时、中止、崩溃隔离
- 桥接适配器：JSON 安全的主机回调和结果交付
- TypeScript 转换适配器
- 快照存储：TTL、大小上限、运行/Session 作用域
- 嵌套工具调用的轨迹投影
- 遥测计数器和诊断

实现复用了 Tool Search 的目录和执行器概念，但不使用 `node:vm` 子项作为沙箱。

## 验证清单

Code mode 覆盖应证明：

- 禁用配置使现有工具暴露保持不变
- 不含 `enabled: true` 的对象配置使 code mode 禁用
- 启用配置在运行中有活跃工具时仅向模型暴露 `exec` 和 `wait`
- 原始无工具运行、`disableTools` 和空白名单不触发 code mode 载荷强制执行
- 所有有效工具出现在 `ALL_TOOLS` 中
- 被拒绝的工具不出现在 `ALL_TOOLS` 中
- `tools.search`、`tools.describe` 和 `tools.call` 对 OpenClaw 工具有效
- Tool Search 控制工具对模型界面和隐藏目录均隐藏
- 嵌套调用保留批准和 Hook 行为
- Shell `exec` 对模型隐藏，但在允许时可通过目录 ID 调用
- 递归 code mode `exec` 和 `wait` 不可从访客代码调用
- TypeScript 输入在禁用或仅 JavaScript 路径上转换和评估时不加载 TypeScript
- `import`、`require`、文件系统、网络和环境访问失败
- 无限循环超时且无法阻塞 Gateway
- 内存上限失败终止访客 VM
- 已完成和已暂停调用的输出和快照上限得到强制执行
- `wait` 恢复已暂停的快照并返回最终值
- 过期、中止、错误 Session 和未知 `runId` 值失败
- 转录重放和持久化保留 code mode 控制调用
- 转录和遥测清晰显示嵌套工具调用

## E2E 测试计划

更改运行时时，将这些作为集成或端到端测试运行：

1. 以 `tools.codeMode.enabled: false` 启动 Gateway。
2. 发送带有小型直接工具集的 Agent 轮次。
3. 断言模型可见工具不变。
4. 以 `tools.codeMode.enabled: true` 重启。
5. 发送带有 OpenClaw、插件、MCP 和客户端测试工具的 Agent 轮次。
6. 断言模型可见工具列表恰好是 `exec`、`wait`。
7. 在 `exec` 中读取 `ALL_TOOLS` 并断言有效的测试工具存在。
8. 在 `exec` 中调用 `tools.search`、`tools.describe` 和 `tools.call`。
9. 断言被拒绝的工具不在其中，且无法通过猜测的 ID 调用。
10. 启动一个在 `exec` 返回 `waiting` 后解析的嵌套工具调用。
11. 调用 `wait` 并断言恢复的 VM 接收到工具结果。
12. 断言最终答案包含恢复后产生的输出。
13. 断言超时、中止和快照过期会清理运行时状态。
14. 导出轨迹并断言嵌套调用在父 code mode 调用下可见。

对本页仅修改文档时，仍应运行 `pnpm check:docs`。

## 相关

- [Tool Search](/tools/tool-search)
- [Agent 运行时](/concepts/agent-runtimes)
- [Exec 工具](/tools/exec)
- [代码执行](/tools/code-execution)
