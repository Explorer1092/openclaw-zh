---
mmh3_hash: "3d53a26fa334319f396e7d5c7278daec"
summary: "Context engine: 可插拔的 context 组装、compaction 和子 agent 生命周期"
read_when:
  - 你想了解 OpenClaw 如何组装 model context
  - 你正在切换 legacy engine 和 plugin engine
  - 你正在构建 context engine plugin
title: "Context Engine"
---

# Context Engine

**context engine** 控制 OpenClaw 如何为每次运行构建 model context。它决定包含哪些消息、如何总结较旧的历史记录,以及如何跨子 agent 边界管理 context。

OpenClaw 内置一个 `legacy` engine。Plugin 可以注册替代 engine 来替换活动的 context engine 生命周期。

## 快速开始

检查哪个 engine 处于活动状态:

```bash
openclaw doctor
# 或直接检查配置:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### 安装 context engine plugin

Context engine plugin 的安装方式与其他 OpenClaw plugin 相同。先安装,然后在 slot 中选择 engine:

```bash
# 从 npm 安装
openclaw plugins install @martian-engineering/lossless-claw

# 或从本地路径安装(用于开发)
openclaw plugins install -l ./my-context-engine
```

然后在配置中启用 plugin 并将其选为活动 engine:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // 必须与 plugin 注册的 engine id 匹配
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Plugin 特定配置在此处(参见 plugin 文档)
      },
    },
  },
}
```

安装和配置后重启 gateway。

要切换回内置 engine,将 `contextEngine` 设置为 `"legacy"`(或完全删除该键——`"legacy"` 是默认值)。

## 工作原理

每次 OpenClaw 运行 model prompt 时,context engine 在四个生命周期点参与:

1. **Ingest** — 当新消息添加到 session 时调用。engine 可以在其自己的数据存储中存储或索引消息。
2. **Assemble** — 在每次 model 运行之前调用。engine 返回一组有序的消息(以及可选的 `systemPromptAddition`),以符合 token 预算。
3. **Compact** — 当 context window 已满时,或当用户运行 `/compact` 时调用。engine 总结较旧的历史记录以释放空间。
4. **After turn** — 在运行完成后调用。engine 可以持久化状态、触发后台 compaction 或更新索引。

### 子 agent 生命周期(可选)

OpenClaw 目前调用一个子 agent 生命周期 hook:

- **onSubagentEnded** — 当子 agent session 完成或被清理时进行清理。

`prepareSubagentSpawn` hook 是接口的一部分,供将来使用,但 runtime 目前尚未调用它。

### System prompt addition

`assemble` 方法可以返回一个 `systemPromptAddition` 字符串。OpenClaw 将其插入到运行的 system prompt 开头。这让 engine 可以注入动态回忆指导、检索指令或上下文感知提示,而无需静态 workspace 文件。

## Legacy engine

内置的 `legacy` engine 保留了 OpenClaw 的原始行为:

- **Ingest**: 无操作(session manager 直接处理消息持久化)。
- **Assemble**: 直通(runtime 中现有的 sanitize → validate → limit 管道处理 context 组装)。
- **Compact**: 委托给内置的摘要 compaction,它创建旧消息的单个摘要并保留最近的消息完整。
- **After turn**: 无操作。

Legacy engine 不注册工具,也不提供 `systemPromptAddition`。

当没有设置 `plugins.slots.contextEngine`(或设置为 `"legacy"`)时,此 engine 会自动使用。

## Plugin engines

Plugin 可以使用 plugin API 注册 context engine:

```ts
export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // 将消息存储在你的数据存储中
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget }) {
      // 返回符合预算的消息
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: "Use lcm_grep to search history...",
      };
    },

    async compact({ sessionId, force }) {
      // 总结较旧的 context
      return { ok: true, compacted: true };
    },
  }));
}
```

然后在配置中启用它:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### ContextEngine 接口

必需成员:

| 成员               | 类型     | 用途                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | 属性     | Engine id、名称、版本以及是否拥有 compaction             |
| `ingest(params)`   | 方法     | 存储单个消息                                             |
| `assemble(params)` | 方法     | 为 model 运行构建 context(返回 `AssembleResult`)         |
| `compact(params)`  | 方法     | 总结/减少 context                                        |

`assemble` 返回包含以下内容的 `AssembleResult`:

- `messages` — 发送给 model 的有序消息。
- `estimatedTokens`(必需,`number`)— engine 对组装 context 中总 tokens 的估计。OpenClaw 将此用于 compaction 阈值决策和诊断报告。
- `systemPromptAddition`(可选,`string`)— 插入到 system prompt 开头。

可选成员:

| 成员                           | 类型   | 用途                                                                                                            |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法   | 初始化 session 的 engine 状态。当 engine 首次看到 session 时调用一次(例如,导入历史记录)。                        |
| `ingestBatch(params)`          | 方法   | 批量摄取已完成的回合。在运行完成后调用,一次性获取该回合的所有消息。                                              |
| `afterTurn(params)`            | 方法   | 运行后生命周期工作(持久化状态、触发后台 compaction)。                                                           |
| `prepareSubagentSpawn(params)` | 方法   | 为子 session 设置共享状态。                                                                                     |
| `onSubagentEnded(params)`      | 方法   | 在子 agent 结束后进行清理。                                                                                     |
| `dispose()`                    | 方法   | 释放资源。在 gateway 关闭或 plugin 重新加载期间调用——不是每个 session。                                          |

### ownsCompaction

`ownsCompaction` 控制 Pi 的内置运行中自动 compaction 是否为该运行保持启用:

- `true` — engine 拥有 compaction 行为。OpenClaw 为该运行禁用 Pi 的内置自动 compaction,engine 的 `compact()` 实现负责 `/compact`、溢出恢复 compaction 以及它想在 `afterTurn()` 中做的任何主动 compaction。
- `false` 或未设置 — Pi 的内置自动 compaction 在 prompt 执行期间仍可能运行,但活动 engine 的 `compact()` 方法仍用于 `/compact` 和溢出恢复。

`ownsCompaction: false` **并不**意味着 OpenClaw 自动回退到 legacy engine 的 compaction 路径。

这意味着有两种有效的 plugin 模式:

- **Owning mode** — 实现你自己的 compaction 算法并设置 `ownsCompaction: true`。
- **Delegating mode** — 设置 `ownsCompaction: false` 并让 `compact()` 从 `openclaw/plugin-sdk/core` 调用 `delegateCompactionToRuntime(...)` 以使用 OpenClaw 的内置 compaction 行为。

对于活动的非 owning engine,无操作的 `compact()` 是不安全的,因为它会禁用该 engine slot 的正常 `/compact` 和溢出恢复 compaction 路径。

## 配置参考

```json5
{
  plugins: {
    slots: {
      // 选择活动 context engine。默认: "legacy"。
      // 设置为 plugin id 以使用 plugin engine。
      contextEngine: "legacy",
    },
  },
}
```

slot 在运行时是独占的——对于给定的运行或 compaction 操作,只有一个注册的 context engine 被解析。其他启用的 `kind: "context-engine"` plugin 仍然可以加载并运行其注册代码;`plugins.slots.contextEngine` 仅选择 OpenClaw 需要 context engine 时解析的注册 engine id。

## 与 compaction 和 memory 的关系

- **Compaction** 是 context engine 的一项职责。Legacy engine 委托给 OpenClaw 的内置摘要。Plugin engine 可以实现任何 compaction 策略(DAG 摘要、向量检索等)。
- **Memory plugins**(`plugins.slots.memory`)与 context engine 是分开的。Memory plugin 提供搜索/检索;context engine 控制 model 看到什么。它们可以协同工作——context engine 可能在组装期间使用 memory plugin 数据。
- **Session pruning**(在内存中修剪旧工具结果)仍然运行,无论哪个 context engine 处于活动状态。

## 提示

- 使用 `openclaw doctor` 验证你的 engine 是否正确加载。
- 如果切换 engine,现有 session 继续使用其当前历史记录。新 engine 接管未来的运行。
- Engine 错误被记录并在诊断中显示。如果 plugin engine 注册失败或无法解析所选 engine id,OpenClaw 不会自动回退;运行会失败,直到你修复 plugin 或将 `plugins.slots.contextEngine` 切换回 `"legacy"`。
- 对于开发,使用 `openclaw plugins install -l ./my-engine` 链接本地 plugin 目录而无需复制。

另请参见：[Compaction](/concepts/compaction)、[Context](/concepts/context)、[Plugins](/tools/plugin)、[Plugin manifest](/plugins/manifest)。

## 相关链接

- [Context](/concepts/context) — Agent 回合的 context 如何构建
- [Plugin Architecture](/plugins/architecture) — 注册 context engine plugin
- [Compaction](/concepts/compaction) — 总结长对话
