---
mmh3_hash: "ba04c436e4d43d22100ae8cb9c9a6890"
summary: "上下文引擎：可插拔的上下文组装、压缩和子 Agent 生命周期"
read_when:
  - 您想了解 OpenClaw 如何组装模型上下文
  - 您在旧版引擎和 Plugin 引擎之间切换
  - 您正在构建上下文引擎 Plugin
title: "上下文引擎"
sidebarTitle: "上下文引擎"
---

**上下文引擎**控制 OpenClaw 如何为每次运行构建模型上下文：包含哪些消息、如何总结旧历史以及如何跨子 Agent 边界管理上下文。

OpenClaw 附带内置的 `legacy` 引擎并默认使用它——大多数用户永远不需要更改这个。仅当您需要不同的组装、压缩或跨 Session 回调行为时，才安装并选择 Plugin 引擎。

## 快速开始

<Steps>
  <Step title="检查哪个引擎处于活跃状态">
    ```bash
    openclaw doctor
    # 或直接检查配置：
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="安装 Plugin 引擎">
    上下文引擎 Plugin 像任何其他 OpenClaw Plugin 一样安装。

    <Tabs>
      <Tab title="从 npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="从本地路径">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="启用并选择引擎">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // 必须与 Plugin 注册的引擎 id 匹配
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin 特定配置在此（参见 Plugin 文档）
          },
        },
      },
    }
    ```

    安装和配置后重启 Gateway。

  </Step>
  <Step title="切换回旧版（可选）">
    将 `contextEngine` 设置为 `"legacy"`（或完全删除该键——`"legacy"` 是默认值）。
  </Step>
</Steps>

## 工作原理

每次 OpenClaw 运行模型提示时，上下文引擎参与四个生命周期点：

<AccordionGroup>
  <Accordion title="1. 摄取（Ingest）">
    当新消息添加到 Session 时调用。引擎可以在其自己的数据存储中存储或索引消息。
  </Accordion>
  <Accordion title="2. 组装（Assemble）">
    在每次模型运行前调用。引擎返回适合 token 预算的有序消息集（以及可选的 `systemPromptAddition`）。
  </Accordion>
  <Accordion title="3. 压缩（Compact）">
    当上下文窗口已满时，或当用户运行 `/compact` 时调用。引擎总结旧历史以释放空间。
  </Accordion>
  <Accordion title="4. 轮次后（After turn）">
    运行完成后调用。引擎可以持久化状态、触发后台压缩或更新索引。
  </Accordion>
</AccordionGroup>

对于捆绑的非 ACP Codex Harness，OpenClaw 通过将组装的上下文投影到 Codex 开发者指令和当前轮次提示中来应用相同的生命周期。Codex 仍然拥有其原生线程历史和原生压缩器。

### 子 Agent 生命周期（可选）

OpenClaw 调用两个可选的子 Agent 生命周期 Hook：

<ParamField path="prepareSubagentSpawn" type="method">
  在子运行开始前准备共享上下文状态。Hook 接收父/子 Session 键、`contextMode`（`isolated` 或 `fork`）、可用的转录 ID/文件和可选的 TTL。如果返回回滚句柄，OpenClaw 会在准备成功后生成失败时调用它。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  当子 Agent Session 完成或被清除时清理。
</ParamField>

### 系统提示添加

`assemble` 方法可以返回 `systemPromptAddition` 字符串。OpenClaw 将其添加到运行的系统提示前面。这让引擎可以注入动态回调指导、检索指令或上下文感知提示，而无需静态工作区文件。

## 旧版引擎

内置的 `legacy` 引擎保留 OpenClaw 的原始行为：

- **摄取**：无操作（Session 管理器直接处理消息持久化）。
- **组装**：传递（运行时中现有的 sanitize → validate → limit 流水线处理上下文组装）。
- **压缩**：委托给内置摘要压缩，创建旧消息的单个摘要并保持最近消息完整。
- **轮次后**：无操作。

旧版引擎不注册工具也不提供 `systemPromptAddition`。

当没有设置 `plugins.slots.contextEngine`（或设置为 `"legacy"`）时，自动使用此引擎。

## Plugin 引擎

Plugin 可以使用 Plugin API 注册上下文引擎：

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // 在您的数据存储中存储消息
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // 返回适合预算的消息
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // 总结旧上下文
      return { ok: true, compacted: true };
    },
  }));
}
```

工厂 `ctx` 包含可选的 `config`、`agentDir` 和 `workspaceDir` 值，这样 Plugin 可以在第一个生命周期 Hook 运行前初始化每个 Agent 或每个工作区的状态。

然后在配置中启用它：

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

必需成员：

| 成员               | 类型     | 用途                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | 属性     | 引擎 ID、名称、版本以及是否拥有压缩                      |
| `ingest(params)`   | 方法     | 存储单个消息                                             |
| `assemble(params)` | 方法     | 为模型运行构建上下文（返回 `AssembleResult`）            |
| `compact(params)`  | 方法     | 总结/减少上下文                                          |

`assemble` 返回带有以下内容的 `AssembleResult`：

<ParamField path="messages" type="Message[]" required>
  发送给模型的有序消息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎对组装上下文中总 token 的估计。OpenClaw 将其用于压缩阈值决策和诊断报告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  添加到系统提示前面。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  控制运行器用于先发制人的溢出预检的 token 估计。默认为 `"assembled"`，表示只检查已组装提示的估计——适用于返回有窗口的、自包含上下文的引擎。仅当您的组装视图可能在底层转录中隐藏溢出风险时设置为 `"preassembly_may_overflow"`；运行器然后在决定是否先发制人地压缩时取组装估计和预组装（未加窗）Session 历史估计中的最大值。无论哪种方式，您返回的消息仍然是模型看到的——`promptAuthority` 只影响预检。
</ParamField>

`compact` 返回 `CompactResult`。当压缩轮换活跃转录时，`result.sessionId` 和 `result.sessionFile` 标识下一次重试或轮次必须使用的后继 Session。

可选成员：

| 成员                           | 类型   | 用途                                                                                                        |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法   | 初始化 Session 的引擎状态。在引擎第一次看到 Session 时调用一次（例如导入历史）。                            |
| `ingestBatch(params)`          | 方法   | 将完成的轮次作为批次摄取。在运行完成后调用，一次包含该轮次的所有消息。                                      |
| `afterTurn(params)`            | 方法   | 运行后生命周期工作（持久化状态、触发后台压缩）。                                                            |
| `prepareSubagentSpawn(params)` | 方法   | 在子 Session 开始前为其设置共享状态。                                                                       |
| `onSubagentEnded(params)`      | 方法   | 子 Agent 结束后清理。                                                                                       |
| `dispose()`                    | 方法   | 释放资源。在 Gateway 关闭或 Plugin 重新加载时调用——不是每个 Session。                                       |

### ownsCompaction

`ownsCompaction` 控制 Pi 的内置运行中自动压缩是否对该运行保持启用：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    引擎拥有压缩行为。OpenClaw 禁用该运行的 Pi 内置自动压缩，引擎的 `compact()` 实现负责 `/compact`、溢出恢复压缩以及它在 `afterTurn()` 中想做的任何主动压缩。OpenClaw 可能仍运行预提示溢出安全守卫；当它预测完整转录将溢出时，恢复路径在提交另一个提示前调用活跃引擎的 `compact()`。
  </Accordion>
  <Accordion title="ownsCompaction: false 或未设置">
    Pi 的内置自动压缩可能仍在提示执行期间运行，但活跃引擎的 `compact()` 方法仍然会为 `/compact` 和溢出恢复调用。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **不**意味着 OpenClaw 自动回退到旧版引擎的压缩路径。
</Warning>

这意味着有两种有效的 Plugin 模式：

<Tabs>
  <Tab title="拥有模式">
    实现您自己的压缩算法并设置 `ownsCompaction: true`。
  </Tab>
  <Tab title="委托模式">
    设置 `ownsCompaction: false` 并让 `compact()` 调用来自 `openclaw/plugin-sdk/core` 的 `delegateCompactionToRuntime(...)` 以使用 OpenClaw 的内置压缩行为。
  </Tab>
</Tabs>

对于活跃的非拥有引擎，无操作的 `compact()` 是不安全的，因为它禁用了该引擎槽的正常 `/compact` 和溢出恢复压缩路径。

## 配置参考

```json5
{
  plugins: {
    slots: {
      // 选择活跃的上下文引擎。默认："legacy"。
      // 设置为 Plugin ID 以使用 Plugin 引擎。
      contextEngine: "legacy",
    },
  },
}
```

<Note>
槽在运行时是独占的——只有一个已注册的上下文引擎为给定的运行或压缩操作解析。其他启用了 `kind: "context-engine"` 的 Plugin 仍然可以加载并运行其注册代码；`plugins.slots.contextEngine` 只选择 OpenClaw 需要上下文引擎时解析的已注册引擎 ID。
</Note>

<Note>
**Plugin 卸载：** 当您卸载当前选为 `plugins.slots.contextEngine` 的 Plugin 时，OpenClaw 将槽重置回默认值（`legacy`）。相同的重置行为适用于 `plugins.slots.memory`。不需要手动编辑配置。
</Note>

## 与压缩和 Memory 的关系

<AccordionGroup>
  <Accordion title="压缩">
    压缩是上下文引擎的一个职责。旧版引擎委托给 OpenClaw 的内置摘要。Plugin 引擎可以实现任何压缩策略（DAG 摘要、向量检索等）。
  </Accordion>
  <Accordion title="Memory Plugin">
    Memory Plugin（`plugins.slots.memory`）与上下文引擎是分开的。Memory Plugin 提供搜索/检索；上下文引擎控制模型看到的内容。它们可以一起工作——上下文引擎可能在组装时使用 Memory Plugin 数据。想要活跃 Memory 提示路径的 Plugin 引擎应优先使用来自 `openclaw/plugin-sdk/core` 的 `buildMemorySystemPromptAddition(...)`，它将活跃 Memory 提示部分转换为即用的 `systemPromptAddition`。如果引擎需要更低级的控制，它仍然可以通过 `buildActiveMemoryPromptSection(...)` 从 `openclaw/plugin-sdk/memory-host-core` 中提取原始行。
  </Accordion>
  <Accordion title="Session 修剪">
    内存中修剪旧工具结果仍然运行，无论哪个上下文引擎处于活跃状态。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 验证您的引擎是否正确加载。
- 如果切换引擎，现有 Session 继续使用其当前历史。新引擎接管未来的运行。
- 引擎错误会被记录并在诊断中显示。如果 Plugin 引擎无法注册或选定的引擎 ID 无法解析，OpenClaw 不会自动回退；运行会失败，直到您修复 Plugin 或将 `plugins.slots.contextEngine` 切换回 `"legacy"`。
- 对于开发，使用 `openclaw plugins install -l ./my-engine` 链接本地 Plugin 目录，无需复制。

## 相关

- [压缩](/concepts/compaction) - 总结长对话
- [上下文](/concepts/context) - 如何为 Agent 轮次构建上下文
- [Plugin 架构](/plugins/architecture) - 注册上下文引擎 Plugin
- [Plugin 清单](/plugins/manifest) - Plugin 清单字段
- [Plugin](/tools/plugin) - Plugin 概述
