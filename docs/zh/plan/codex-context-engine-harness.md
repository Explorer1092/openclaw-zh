---
mmh3_hash: "b61332f3a8b5dd92853b6a3ba0b82cba"
title: "Codex 测试套件 Context Engine 移植"
summary: "使捆绑的 Codex app-server 测试套件遵守 OpenClaw context-engine 插件的规范说明"
read_when:
  - 你正在将 context-engine 生命周期行为接入 Codex 测试套件
  - 你需要 lossless-claw 或其他 context-engine 插件与 codex/* 嵌入式测试套件 Session 一起工作
  - 你正在比较嵌入式 PI 和 Codex app-server context 行为
---

## 状态

草稿实现规范。

## 目标

使捆绑的 Codex app-server 测试套件遵守嵌入式 PI 轮次已经遵守的相同 OpenClaw context-engine
生命周期合约。

使用 `agents.defaults.embeddedHarness.runtime: "codex"` 或 `codex/*` 模型的 Session 应该仍然让选定的 context-engine 插件（如 `lossless-claw`）在 Codex app-server 边界允许的范围内控制 context 组装、轮后摄取、维护和 OpenClaw 级别的压缩策略。

## 非目标

- 不要重新实现 Codex app-server 内部。
- 不要让 Codex 原生线程压缩产生 lossless-claw 摘要。
- 不要要求非 Codex 模型使用 Codex 测试套件。
- 不要更改 ACP/acpx Session 行为。本规范仅针对非 ACP 嵌入式 Agent 测试套件路径。
- 不要让第三方插件注册 Codex app-server 扩展工厂；现有的捆绑插件信任边界保持不变。

## 当前架构

嵌入式运行循环在选择具体的底层测试套件之前，每次运行解析一次配置的 context engine：

- `src/agents/pi-embedded-runner/run.ts`
  - 初始化 context-engine 插件
  - 调用 `resolveContextEngine(params.config)`
  - 将 `contextEngine` 和 `contextTokenBudget` 传递到
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` 委托给选定的 Agent 测试套件：

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-server 测试套件由捆绑的 Codex 插件注册：

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex 测试套件实现接收与 PI 支持的尝试相同的 `EmbeddedRunAttemptParams`：

- `extensions/codex/src/app-server/run-attempt.ts`

这意味着所需的钩子点在 OpenClaw 控制的代码中。外部边界是 Codex app-server 协议本身：OpenClaw 可以控制发送到 `thread/start`、`thread/resume` 和 `turn/start` 的内容，并可以观察通知，但不能更改 Codex 的内部线程存储或原生压缩器。

## 当前差距

嵌入式 PI 尝试直接调用 context-engine 生命周期：

- 尝试前的引导/维护
- 模型调用前的组装
- 尝试后的 afterTurn 或 ingest
- 成功轮次后的维护
- 拥有压缩的引擎的 context-engine 压缩

相关 PI 代码：

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex app-server 尝试当前运行通用 Agent 测试套件钩子并镜像脚本，但不调用 `params.contextEngine.bootstrap`、`params.contextEngine.assemble`、`params.contextEngine.afterTurn`、`params.contextEngine.ingestBatch`、`params.contextEngine.ingest` 或 `params.contextEngine.maintain`。

相关 Codex 代码：

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 期望行为

对于 Codex 测试套件轮次，OpenClaw 应该保留此生命周期：

1. 读取镜像的 OpenClaw Session 脚本。
2. 当存在先前的 Session 文件时，引导活跃的 context engine。
3. 在可用时运行引导维护。
4. 使用活跃的 context engine 组装 context。
5. 将组装的 context 转换为 Codex 兼容的输入。
6. 使用包含任何 context-engine `systemPromptAddition` 的开发者指令启动或恢复 Codex 线程。
7. 使用组装的面向用户的提示词启动 Codex 轮次。
8. 将 Codex 结果镜像回 OpenClaw 脚本。
9. 如果实现了 `afterTurn`，调用它，否则使用镜像的脚本快照调用 `ingestBatch`/`ingest`。
10. 在成功的非中止轮次后运行轮次维护。
11. 保留 Codex 原生压缩信号和 OpenClaw 压缩钩子。

## 设计约束

### Codex app-server 对原生线程状态保持权威

Codex 拥有其原生线程和任何内部扩展历史。OpenClaw 不应该尝试通过支持的协议调用之外的方式改变 app-server 的内部历史。

OpenClaw 的脚本镜像仍然是 OpenClaw 功能的来源：

- 聊天历史
- 搜索
- `/new` 和 `/reset` 账目
- 未来的模型或测试套件切换
- context-engine 插件状态

### Context engine 组装必须投影到 Codex 输入中

context-engine 接口返回 OpenClaw `AgentMessage[]`，而不是 Codex 线程补丁。Codex app-server `turn/start` 接受当前用户输入，而 `thread/start` 和 `thread/resume` 接受开发者指令。

因此实现需要一个投影层。安全的第一版本应该避免假装它可以替换 Codex 内部历史。它应该将组装的 context 作为确定性的提示词/开发者指令材料注入到当前轮次周围。

### 提示词缓存稳定性很重要

对于像 lossless-claw 这样的引擎，组装的 context 对于相同输入应该是确定性的。不要在生成的 context 文本中添加时间戳、随机 ID 或不确定性排序。

### PI 回退语义不变

测试套件选择保持不变：

- `runtime: "pi"` 强制 PI
- `runtime: "codex"` 选择注册的 Codex 测试套件
- `runtime: "auto"` 让插件测试套件声明支持的 Provider
- `fallback: "none"` 在没有插件测试套件匹配时禁用 PI 回退

这项工作改变的是 Codex 测试套件被选择后发生的事情。

## 实现计划

### 1. 导出或重新定位可重用的 context-engine 尝试助手

今天，可重用的生命周期助手存在于 PI 运行器下：

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

如果可以避免，Codex 不应该从名称暗示 PI 的实现路径导入。

创建一个测试套件中立的模块，例如：

- `src/agents/harness/context-engine-lifecycle.ts`

移动或重新导出：

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- `runContextEngineMaintenance` 的小型包装器

通过从旧文件重新导出或在同一 PR 中更新 PI 调用点来保持 PI 导入工作。

中立助手名称不应该提及 PI。

建议名称：

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. 添加 Codex context 投影助手

添加新模块：

- `extensions/codex/src/app-server/context-engine-projection.ts`

职责：

- 接受组装的 `AgentMessage[]`、原始镜像历史和当前提示词。
- 确定哪个 context 属于开发者指令与当前用户输入。
- 将当前用户提示词保留为最终可操作请求。
- 以稳定的、显式的格式渲染之前的消息。
- 避免易变的元数据。

建议 API：

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

推荐的第一个投影：

- 将 `systemPromptAddition` 放入开发者指令中。
- 将组装的脚本 context 放在 `promptText` 中当前提示词之前。
- 清楚地标记为 OpenClaw 组装的 context。
- 将当前提示词放在最后。
- 如果重复的当前用户提示词已经出现在尾部，则排除它。

示例提示词形状：

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

这不如原生 Codex 历史手术优雅，但可以在 OpenClaw 内部实现并保留 context-engine 语义。

未来改进：如果 Codex app-server 暴露了替换或补充线程历史的协议，将此投影层替换为使用该 API。

### 3. 在 Codex 线程启动前接入引导

在 `extensions/codex/src/app-server/run-attempt.ts` 中：

- 如今读取镜像的 Session 历史。
- 确定此运行之前 Session 文件是否存在。优先使用在镜像写入之前检查 `fs.stat(params.sessionFile)` 的助手。
- 打开 `SessionManager` 或使用窄 Session 管理器适配器（如果助手需要它）。
- 当 `params.contextEngine` 存在时调用中立引导助手。

伪流程：

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

使用与 Codex 工具桥和脚本镜像相同的 `sessionKey` 约定。今天 Codex 从 `params.sessionKey` 或 `params.sessionId` 计算 `sandboxSessionKey`；一致使用它，除非有理由保留原始 `params.sessionKey`。

### 4. 在 `thread/start` / `thread/resume` 和 `turn/start` 前接入组装

在 `runCodexAppServerAttempt` 中：

1. 首先构建动态工具，以便 context engine 看到实际可用的工具名称。
2. 读取镜像的 Session 历史。
3. 当 `params.contextEngine` 存在时运行 context-engine `assemble(...)`。
4. 将组装的结果投影到：
   - 开发者指令补充
   - `turn/start` 的提示词文本

现有的钩子调用：

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

应该变为 context 感知的：

1. 用 `buildDeveloperInstructions(params)` 计算基础开发者指令
2. 应用 context-engine 组装/投影
3. 使用投影的提示词/开发者指令运行 `before_prompt_build`

这个顺序让通用提示词钩子看到 Codex 将收到的相同提示词。如果需要严格的 PI 对等，在钩子组合之前运行 context-engine 组装，因为 PI 在其提示词管道之后将 context-engine `systemPromptAddition` 应用到最终系统提示词。重要的不变量是 context engine 和钩子都获得确定性的、有文档的顺序。

第一个实现的推荐顺序：

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. 将 `systemPromptAddition` 追加/前置到开发者指令
4. 将组装的消息投影到提示词文本中
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 将最终开发者指令传递到 `startOrResumeThread(...)`
7. 将最终提示词文本传递到 `buildTurnStartParams(...)`

规范应该在测试中编码，以便未来的更改不会意外地重新排序它。

### 5. 保留提示词缓存稳定的格式

投影助手必须为相同输入产生字节稳定的输出：

- 稳定的消息顺序
- 稳定的角色标签
- 没有生成的时间戳
- 没有对象键顺序泄露
- 没有随机分隔符
- 没有每次运行的 ID

使用固定分隔符和显式节。

### 6. 在脚本镜像后接入轮后

Codex 的 `CodexAppServerEventProjector` 为当前轮次构建本地 `messagesSnapshot`。`mirrorTranscriptBestEffort(...)` 将该快照写入 OpenClaw 脚本镜像。

镜像成功或失败后，使用最佳可用消息快照调用 context-engine 终结器：

- 优先在写入后读取完整镜像的 Session context，因为 `afterTurn` 期望 Session 快照，而不仅仅是当前轮次。
- 如果 Session 文件无法重新打开，回退到 `historyMessages + result.messagesSnapshot`。

伪流程：

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

如果镜像失败，仍然使用回退快照调用 `afterTurn`，但记录 context engine 从回退轮次数据摄取。

### 7. 规范化使用情况和提示词缓存运行时 context

Codex 结果在可用时包含来自 app-server 令牌通知的规范化使用情况。将该使用情况传递到 context-engine 运行时 context 中。

如果 Codex app-server 最终暴露了缓存读/写详情，将它们映射到 `ContextEnginePromptCacheInfo`。在此之前，省略 `promptCache` 而不是发明零。

### 8. 压缩策略

有两个压缩系统：

1. OpenClaw context-engine `compact()`
2. Codex app-server 原生 `thread/compact/start`

不要静默地混淆它们。

#### `/compact` 和显式 OpenClaw 压缩

当选定的 context engine 具有 `info.ownsCompaction === true` 时，显式的
OpenClaw 压缩应该优先使用 context engine 的 `compact()` 结果用于 OpenClaw 脚本镜像和插件状态。

当选定的 Codex 测试套件具有原生线程绑定时，我们可能额外请求 Codex 原生压缩以保持 app-server 线程健康，但这必须作为详情中的单独后端操作报告。

推荐行为：

- 如果 `contextEngine.info.ownsCompaction === true`：
  - 首先调用 context-engine `compact()`
  - 然后在存在线程绑定时尽力调用 Codex 原生压缩
  - 将 context-engine 结果作为主要结果返回
  - 在 `details.codexNativeCompaction` 中包含 Codex 原生压缩状态
- 如果活跃的 context engine 不拥有压缩：
  - 保留当前的 Codex 原生压缩行为

这可能需要更改 `extensions/codex/src/app-server/compact.ts` 或从通用压缩路径包装它，取决于 `maybeCompactAgentHarnessSession(...)` 被调用的位置。

#### 轮内 Codex 原生 contextCompaction 事件

Codex 可能在轮次期间发出 `contextCompaction` 项目事件。保留 `event-projector.ts` 中当前的压缩前/后钩子发射，但不要将其视为已完成的 context-engine 压缩。

对于拥有压缩的引擎，当 Codex 无论如何执行原生压缩时发出显式诊断：

- 流/事件名称：现有的 `compaction` 流是可接受的
- 详情：`{ backend: "codex-app-server", ownsCompaction: true }`

这使分割可审计。

### 9. Session 重置和绑定行为

现有的 Codex 测试套件 `reset(...)` 从 OpenClaw Session 文件清除 Codex app-server 绑定。保留该行为。

还要确保 context-engine 状态清理通过现有的 OpenClaw Session 生命周期路径继续发生。不要添加 Codex 特定的清理，除非 context-engine 生命周期当前对所有测试套件都遗漏了重置/删除事件。

### 10. 错误处理

遵循 PI 语义：

- 引导失败：警告并继续
- 组装失败：警告并回退到未组装的管道消息/提示词
- afterTurn/ingest 失败：警告并将轮后最终化标记为失败
- 维护：仅在成功的、非中止的、非 yield 的轮次后运行
- 压缩错误：不应作为新的提示词重试

Codex 特定的补充：

- 如果 context 投影失败，警告并回退到原始提示词。
- 如果脚本镜像失败，仍然尝试使用回退消息进行 context-engine 最终化。
- 如果 Codex 原生压缩在 context-engine 压缩成功后失败，当 context engine 是主要时不要使整个 OpenClaw 压缩失败。

## 测试计划

### 单元测试

在 `extensions/codex/src/app-server` 下添加测试：

1. `run-attempt.context-engine.test.ts`
   - 当 Session 文件存在时，Codex 调用 `bootstrap`。
   - Codex 使用镜像的消息、令牌预算、工具名称、引用模式、模型 ID 和提示词调用 `assemble`。
   - `systemPromptAddition` 包含在开发者指令中。
   - 组装的消息在当前请求之前投影到提示词中。
   - Codex 在脚本镜像后调用 `afterTurn`。
   - 没有 `afterTurn` 时，Codex 调用 `ingestBatch` 或每消息 `ingest`。
   - 成功的轮次后运行轮次维护。
   - 轮次维护不在提示词错误、中止或 yield 中止时运行。

2. `context-engine-projection.test.ts`
   - 相同输入的稳定输出
   - 当组装的历史包含当前提示词时，没有重复的当前提示词
   - 处理空历史
   - 保留角色顺序
   - 仅在开发者指令中包含系统提示词补充

3. `compact.context-engine.test.ts`
   - 拥有的 context engine 主要结果获胜
   - 在也尝试时，Codex 原生压缩状态出现在详情中
   - Codex 原生失败不会使拥有的 context-engine 压缩失败
   - 非拥有的 context engine 保留当前的原生压缩行为

### 需要更新的现有测试

- `extensions/codex/src/app-server/run-attempt.test.ts`（如果存在），否则是最近的 Codex app-server 运行测试。
- `extensions/codex/src/app-server/event-projector.test.ts` 仅当压缩事件详情发生变化时。
- `src/agents/harness/selection.test.ts` 不应需要更改，除非配置行为发生变化；它应该保持稳定。
- PI context-engine 测试应该继续无变化地通过。

### 集成 / 实时测试

添加或扩展实时 Codex 测试套件冒烟测试：

- 将 `plugins.slots.contextEngine` 配置为测试引擎
- 将 `agents.defaults.model` 配置为 `codex/*` 模型
- 将 `agents.defaults.embeddedHarness.runtime` 配置为 `"codex"`
- 断言测试引擎观察到：
  - 引导
  - 组装
  - afterTurn 或 ingest
  - 维护

避免在 OpenClaw 核心测试中需要 lossless-claw。使用仓库内的小型假 context engine 插件。

## 可观察性

在 Codex context-engine 生命周期调用周围添加调试日志：

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped`（带原因）
- `codex native compaction completed alongside context-engine compaction`

避免记录完整的提示词或脚本内容。

在有用的地方添加结构化字段：

- `sessionId`
- `sessionKey`（根据现有日志实践编辑或省略）
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## 迁移 / 兼容性

这应该是向后兼容的：

- 如果没有配置 context engine，旧版 context engine 行为应该等同于今天的 Codex 测试套件行为。
- 如果 context-engine `assemble` 失败，Codex 应该继续使用原始提示词路径。
- 现有的 Codex 线程绑定应该保持有效。
- 动态工具指纹不应包含 context-engine 输出；否则每次 context 更改都可能强制新的 Codex 线程。只有工具目录应该影响动态工具指纹。

## 开放问题

1. 组装的 context 应该完全注入到用户提示词中、完全注入到开发者指令中，还是分割？

   推荐：分割。将 `systemPromptAddition` 放入开发者指令；将组装的脚本 context 放入用户提示词包装器。这最好匹配当前的 Codex 协议，而不会改变原生线程历史。

2. 当 context engine 拥有压缩时，应该禁用 Codex 原生压缩吗？

   推荐：不，最初不。Codex 原生压缩可能仍然对保持 app-server 线程活跃是必要的。但它必须报告为原生 Codex 压缩，而不是 context-engine 压缩。

3. `before_prompt_build` 应该在 context-engine 组装之前还是之后运行？

   推荐：对于 Codex，在 context-engine 投影之后，以便通用测试套件钩子看到 Codex 将收到的实际提示词/开发者指令。如果 PI 对等要求相反，在测试中编码所选顺序并在此处记录。

4. Codex app-server 是否可以接受未来结构化的 context/历史覆盖？

   未知。如果可以，将文本投影层替换为该协议，并保持生命周期调用不变。

## 验收标准

- `codex/*` 嵌入式测试套件轮次调用选定 context engine 的组装生命周期。
- context-engine `systemPromptAddition` 影响 Codex 开发者指令。
- 组装的 context 确定性地影响 Codex 轮次输入。
- 成功的 Codex 轮次调用 `afterTurn` 或 ingest 回退。
- 成功的 Codex 轮次运行 context-engine 轮次维护。
- 失败/中止/yield 中止的轮次不运行轮次维护。
- context-engine 拥有的压缩对于 OpenClaw/插件状态保持主要。
- Codex 原生压缩作为原生 Codex 行为保持可审计。
- 现有的 PI context-engine 行为不变。
- 当没有非旧版 context engine 被选定或组装失败时，现有的 Codex 测试套件行为不变。
