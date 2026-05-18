---
mmh3_hash: "53fc9dfcbbdcde5214126dd53ce892ec"
summary: "深入研究：Session 存储 + 转录、生命周期和（自动）压缩内部"
read_when:
  - 您需要调试 Session id、转录 JSONL 或 sessions.json 字段
  - 您正在更改自动压缩行为或添加"压缩前"维护
  - 您想要实现记忆刷新或静默系统轮次
title: "Session 管理深入研究"
---

OpenClaw 端到端管理以下领域的 Session：

- **Session 路由**（入站消息如何映射到 `sessionKey`）
- **Session 存储**（`sessions.json`）及其跟踪内容
- **转录持久化**（`*.jsonl`）及其结构
- **转录卫生**（运行前的 Provider 特定修复）
- **上下文限制**（上下文窗口 vs 跟踪 token）
- **压缩**（手动和自动压缩）以及在哪里挂钩压缩前工作
- **静默维护**（不应产生用户可见输出的记忆写入）

如果您想要更高级别的概述，请从以下开始：

- [Session 管理](/concepts/session)
- [压缩](/concepts/compaction)
- [记忆概述](/concepts/memory)
- [记忆搜索](/concepts/memory-search)
- [Session 修剪](/concepts/session-pruning)
- [转录卫生](/reference/transcript-hygiene)

---

## 真实来源：Gateway

OpenClaw 围绕拥有 Session 状态的单个 **Gateway 进程**设计。

- UI（macOS 应用、Web Control UI、TUI）应向 Gateway 查询 Session 列表和 token 计数。
- 在远程模式下，Session 文件位于远程主机上；"查看本地 Mac 文件"不会反映 Gateway 使用的内容。

---

## 两个持久化层

OpenClaw 在两个层中持久化 Session：

1. **Session 存储（`sessions.json`）**
   - 键/值映射：`sessionKey -> SessionEntry`
   - 小型、可变，可以安全编辑（或删除条目）
   - 跟踪 Session 元数据（当前 Session id、最后活动、切换、token 计数器等）

2. **转录（`<sessionId>.jsonl`）**
   - 带有树结构的仅追加转录（条目有 `id` + `parentId`）
   - 存储实际对话 + 工具调用 + 压缩摘要
   - 用于为未来轮次重建模型上下文
   - 一旦活动转录超过检查点大小上限，大型压缩前调试检查点将被跳过，避免产生第二个巨大的 `.checkpoint.*.jsonl` 副本。

Gateway 历史读取器应避免实体化整个转录，除非界面明确需要任意历史访问。首页历史、嵌入式聊天历史、重启恢复和 token/使用情况检查使用有界尾读。完整的转录扫描通过异步转录索引进行，该索引按文件路径加 `mtimeMs`/`size` 缓存，并在并发读取器之间共享。

---

## 磁盘位置

每个 Agent，在 Gateway 主机上：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 转录：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主题 Session：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些路径。

---

## 存储维护和磁盘控制

Session 持久化具有自动维护控制（`session.maintenance`），用于 `sessions.json`、转录工件和轨迹辅助文件：

- `mode`：`warn`（默认）或 `enforce`
- `pruneAfter`：过期条目年龄截止（默认 `30d`）
- `maxEntries`：限制 `sessions.json` 中的条目（默认 `500`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 转录存档的保留时间（默认：与 `pruneAfter` 相同；`false` 禁用清理）
- `maxDiskBytes`：可选 Session 目录预算
- `highWaterBytes`：清理后的可选目标（默认 `maxDiskBytes` 的 `80%`）

正常的 Gateway 写入流程通过每存储的 Session 写入器进行，该写入器在不占用运行时文件锁的情况下序列化进程内变更。热路径补丁助手在持有该写入器槽时借用已验证的可变缓存，因此大型 `sessions.json` 文件不会为每次元数据更新进行克隆或重读。运行时代码应优先使用 `updateSessionStore(...)` 或 `updateSessionStoreEntry(...)`；直接整存储保存是兼容性和离线维护工具。当 Gateway 可访问时，非空运行的 `openclaw sessions cleanup` 和 `openclaw agents delete` 将存储变更委托给 Gateway，以便清理加入相同的写入器队列；`--store <path>` 是直接文件维护的显式离线修复路径。`maxEntries` 清理仍然对生产大小的上限进行批处理，因此在下次高水位清理将其重写回来之前，存储可能会短暂超过配置的上限。Session 存储读取在 Gateway 启动期间不会修剪或限制条目；使用写入或 `openclaw sessions cleanup --enforce` 进行清理。`openclaw sessions cleanup --enforce` 仍然立即应用配置的上限，并修剪旧的未引用的转录、检查点和轨迹工件，即使没有配置磁盘预算。

维护保留持久的外部对话指针，如群组 Session 和线程范围的聊天 Session，但当超过配置的年龄、计数或磁盘预算时，仍然可以删除 cron、hooks、心跳、ACP 和子 Agent 的合成运行时条目。

OpenClaw 不再在 Gateway 写入期间创建自动 `sessions.json.bak.*` 轮换备份。旧版 `session.maintenance.rotateBytes` 键被忽略，`openclaw doctor --fix` 会从旧配置中删除它。

转录变更使用 Session 的转录文件写入锁。锁获取等待最多 `session.writeLock.acquireTimeoutMs` 后才会显示繁忙 Session 错误；默认为 `60000` 毫秒。仅在合法的准备、清理、压缩或转录镜像工作在慢速机器上竞争更长时才提高此值。过期锁检测和最大保持时间警告仍然是独立的策略。

磁盘预算清理的强制执行顺序（`mode: "enforce"`）：

1. 首先删除最旧的已存档、孤立转录或孤立轨迹工件。
2. 如果仍然超出目标，驱逐最旧的 Session 条目及其转录/轨迹文件。
3. 继续直到使用量达到或低于 `highWaterBytes`。

在 `mode: "warn"` 中，OpenClaw 报告潜在的驱逐但不修改存储/文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron Session 和运行日志

隔离的 Cron 运行也会创建 Session 条目/转录，它们有专用的保留控制：

- `cron.sessionRetention`（默认 `24h`）从 Session 存储中清除旧的隔离 Cron 运行 Session（`false` 禁用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 清除 `~/.openclaw/cron/runs/<jobId>.jsonl` 文件（默认：`2_000_000` 字节和 `2000` 行）。

当 cron 强制创建新的隔离运行 Session 时，它会在写入新行之前清理上一个 `cron:<jobId>` Session 条目。它携带安全的偏好设置，如 thinking/fast/verbose 设置、标签和明确的用户选择的模型/auth 覆盖。它会丢弃环境对话上下文，如 Channel/群组路由、发送或队列策略、提升、来源和 ACP 运行时绑定，以便新的隔离运行不会从旧运行继承过时的传递或运行时权限。

---

## Session 键（`sessionKey`）

`sessionKey` 标识您所在的_对话桶_（路由 + 隔离）。

常见模式：

- 主/直接聊天（每个 Agent）：`agent:<agentId>:<mainKey>`（默认 `main`）
- 群组：`agent:<agentId>:<channel>:group:<id>`
- 房间/Channel（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆盖）

规范规则记录在 [/concepts/session](/concepts/session)。

---

## Session ID（`sessionId`）

每个 `sessionKey` 指向一个当前的 `sessionId`（继续对话的转录文件）。

经验法则：

- **重置**（`/new`、`/reset`）为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（Gateway 主机本地时间默认凌晨 4:00）在重置边界后的下一条消息时创建新的 `sessionId`。
- **空闲到期**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）当空闲窗口后消息到达时创建新的 `sessionId`。当每日和空闲都配置时，首先到期的胜出。
- **系统事件**（心跳、cron 唤醒、exec 通知、Gateway 记账）可能会改变 Session 行，但不会延长每日/空闲重置的新鲜度。重置滚动会在构建新提示词之前丢弃上一个 Session 排队的系统事件通知。
- **父级分叉策略**在创建线程或子 Agent 分叉时使用 Pi 的活动分支。如果该分支太大，OpenClaw 会以隔离上下文启动子级，而不是失败或继承无法使用的历史。大小调整策略是自动的；旧版 `session.parentForkMaxTokens` 配置已由 `openclaw doctor --fix` 删除。

实现细节：决策发生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()` 中。

---

## Session 存储架构（`sessions.json`）

存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（非详尽）：

- `sessionId`：当前转录 id（文件名从此派生，除非设置了 `sessionFile`）
- `sessionStartedAt`：当前 `sessionId` 的开始时间戳；每日重置的新鲜度使用此字段。旧版行可以从 JSONL Session 头派生它。
- `lastInteractionAt`：最后真实用户/Channel 交互时间戳；空闲重置的新鲜度使用此字段，使心跳、cron 和 exec 事件不会保持 Session 存活。没有此字段的旧版行会回退到恢复的 Session 开始时间来判断空闲新鲜度。
- `updatedAt`：最后存储行变更时间戳，用于列表、修剪和记账。它不是每日/空闲重置新鲜度的权威。
- `sessionFile`：可选的明确转录路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：群组/Channel 标记的元数据
- 切换：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（每 Session 覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- Token 计数器（尽力而为/取决于 Provider）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：该 Session 键自动压缩完成的次数
- `memoryFlushAt`：最后压缩前记忆刷新的时间戳
- `memoryFlushCompactionCount`：最后刷新运行时的压缩计数

存储可以安全编辑，但 Gateway 是权威：它可能会在 Session 运行时重写或重新水化条目。

---

## 转录结构（`*.jsonl`）

转录由 `@earendil-works/pi-coding-agent` 的 `SessionManager` 管理。

文件是 JSONL：

- 第一行：Session 头（`type: "session"`，包含 `id`、`cwd`、`timestamp`，可选 `parentSession`）
- 然后：带有 `id` + `parentId` 的 Session 条目（树）

值得注意的条目类型：

- `message`：用户/助手/toolResult 消息
- `custom_message`：_确实_进入模型上下文的扩展注入消息（可以对 UI 隐藏）
- `custom`：_不_进入模型上下文的扩展状态
- `compaction`：带有 `firstKeptEntryId` 和 `tokensBefore` 的持久化压缩摘要
- `branch_summary`：导航树分支时的持久化摘要

OpenClaw 有意**不**"修复"转录；Gateway 使用 `SessionManager` 读写它们。

---

## 上下文窗口 vs 跟踪 token

两个不同的概念很重要：

1. **模型上下文窗口**：每个模型的硬上限（模型可见的 token）
2. **Session 存储计数器**：写入 `sessions.json` 的滚动统计（用于 /status 和仪表板）

如果您在调整限制：

- 上下文窗口来自模型目录（可以通过配置覆盖）。
- 存储中的 `contextTokens` 是运行时估计/报告值；不要将其视为严格保证。

有关更多信息，请参见 [token 使用](/reference/token-use)。

---

## 压缩：它是什么

压缩将较旧的对话摘要到转录中的持久化 `compaction` 条目，并保持最近的消息完整。

压缩后，未来的轮次会看到：

- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩是**持久的**（不同于 Session 修剪）。请参见 [/concepts/session-pruning](/concepts/session-pruning)。

## 压缩块边界和工具配对

当 OpenClaw 将长转录分割为压缩块时，它将助手工具调用与其匹配的 `toolResult` 条目配对。

- 如果 token 份额分割落在工具调用和其结果之间，OpenClaw 将边界移至助手工具调用消息，而不是分离配对。
- 如果尾随的工具结果块否则会将块推过目标，OpenClaw 保留那个待处理的工具块并保持未摘要的尾部完整。
- 中止/错误的工具调用块不会保持待处理的分割开放。

---

## 何时发生自动压缩（Pi 运行时）

在嵌入式 Pi Agent 中，自动压缩在两种情况下触发：

1. **溢出恢复**：模型返回上下文溢出错误（`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded` 以及类似的 Provider 变体）→ 压缩 → 重试。
2. **阈值维护**：成功的轮次后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为提示 + 下一次模型输出保留的余量

这些是 Pi 运行时语义（OpenClaw 消费事件，但 Pi 决定何时压缩）。

当 `agents.defaults.compaction.maxActiveTranscriptBytes` 设置且活动转录文件达到该大小时，OpenClaw 还可以在打开下一次运行之前触发预检本地压缩。这是一个本地重新打开成本的文件大小保护，而非原始存档：OpenClaw 仍然运行正常的语义压缩，并且需要 `truncateAfterCompaction`，以便压缩后的摘要可以成为新的后继转录。

对于嵌入式 Pi 运行，`agents.defaults.compaction.midTurnPrecheck.enabled: true` 添加了一个可选加入的工具循环保护。在工具结果被追加后、下一次模型调用之前，OpenClaw 使用与轮次开始时相同的预检预算逻辑估计提示压力。如果上下文不再适合，保护不会在 Pi 的 `transformContext` 钩子内进行压缩。它会发出一个结构化的轮中预检信号，停止当前的提示提交，让外部运行循环使用现有的恢复路径：当足够时截断过大的工具结果，或触发配置的压缩模式并重试。该选项默认禁用，与 `default` 和 `safeguard` 压缩模式都兼容，包括 Provider 支持的保障压缩。这与 `maxActiveTranscriptBytes` 无关：字节大小保护在轮次开始前运行，而轮中预检在新工具结果被追加后在嵌入式 Pi 工具循环中稍后运行。

---

## 压缩设置（`reserveTokens`、`keepRecentTokens`）

Pi 的压缩设置位于 Pi 设置中：

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw 还为嵌入式运行强制执行安全底限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 会提升它。
- 默认底限为 `20000` token。
- 设置 `agents.defaults.compaction.reserveTokensFloor: 0` 禁用底限。
- 如果已经更高，OpenClaw 保持不变。
- 手动 `/compact` 会遵守明确的 `agents.defaults.compaction.keepRecentTokens` 并保持 Pi 的最近尾部截点。没有明确的保留预算时，手动压缩仍然是硬检查点，重建的上下文从新摘要开始。
- 设置 `agents.defaults.compaction.midTurnPrecheck.enabled: true` 以在新工具结果之后、下一次模型调用之前运行可选的工具循环预检。这只是一个触发器；摘要生成仍然使用配置的压缩路径。它与 `maxActiveTranscriptBytes` 无关，后者是一个轮次开始的活动转录字节大小保护。
- 设置 `agents.defaults.compaction.maxActiveTranscriptBytes` 为字节值或字符串（如 `"20mb"`），以在活动转录变大时在轮次之前运行本地压缩。此保护仅在同时启用 `truncateAfterCompaction` 时有效。不设置或设置 `0` 则禁用。
- 当启用 `agents.defaults.compaction.truncateAfterCompaction` 时，OpenClaw 在压缩后将活动转录轮换到压缩后的后继 JSONL。旧的完整转录仍然存档，并从压缩检查点链接，而不是就地重写。

原因：在压缩变得不可避免之前，为多轮"维护"（如记忆写入）留出足够的余量。

实现：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`（从 `src/agents/pi-embedded-runner.ts` 调用）。

---

## 可插拔压缩 Provider

Plugin 可以通过 Plugin API 上的 `registerCompactionProvider()` 注册压缩 Provider。当 `agents.defaults.compaction.provider` 设置为已注册的 Provider id 时，保障扩展将摘要委托给该 Provider，而非内置的 `summarizeInStages` 管道。

- `provider`：已注册的压缩 Provider Plugin 的 id。不设置则使用默认 LLM 摘要。
- 设置 `provider` 会强制 `mode: "safeguard"`。
- Provider 接收与内置路径相同的压缩指令和标识符保留策略。
- 保障在 Provider 输出后仍保留最近轮次和分割轮次的后缀上下文。
- 内置保障摘要会将之前的摘要与新消息重新提炼，而不是逐字保留完整的上一个摘要。
- 保障模式默认启用摘要质量审计；设置 `qualityGuard.enabled: false` 跳过格式错误输出的重试行为。
- 如果 Provider 失败或返回空结果，OpenClaw 自动回退到内置 LLM 摘要。
- 中止/超时信号会被重新抛出（不会被吞没）以尊重调用方的取消。

来源：`src/plugins/compaction-provider.ts`、`src/agents/pi-hooks/compaction-safeguard.ts`。

---

## 用户可见界面

您可以通过以下方式观察压缩和 Session 状态：

- `/status`（在任何聊天 Session 中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- Gateway 日志（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 详细模式：`🧹 Auto-compaction complete` + 压缩计数

---

## 静默维护（`NO_REPLY`）

OpenClaw 支持后台任务的"静默"轮次，用户不应看到中间输出。

约定：

- 助手以精确的静默 token `NO_REPLY` / `no_reply` 开始其输出，表示"不向用户发送回复"。
- OpenClaw 在传递层中删除/抑制这个。
- 精确的静默 token 抑制不区分大小写，因此当整个有效负载只是静默 token 时，`NO_REPLY` 和 `no_reply` 都计算在内。
- 这仅用于真正的后台/无传递轮次；它不是普通可操作用户请求的快捷方式。

从 `2026.1.10` 起，当部分块以 `NO_REPLY` 开头时，OpenClaw 还会抑制**草稿/打字流式传输**，以便静默操作不会在轮次中途泄漏部分输出。

---

## 压缩前"记忆刷新"（已实现）

目标：在自动压缩发生之前，运行一个静默的 Agentic 轮次，将持久状态写入磁盘（例如 Agent 工作区中的 `memory/YYYY-MM-DD.md`），以便压缩无法删除关键上下文。

OpenClaw 使用**预阈值刷新**方法：

1. 监控 Session 上下文使用情况。
2. 当它超过"软阈值"（低于 Pi 的压缩阈值）时，向 Agent 运行静默的"立即写记忆"指令。
3. 使用精确的静默 token `NO_REPLY` / `no_reply`，用户什么也看不到。

配置（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（默认：`true`）
- `model`（可选的精确 provider/model 覆盖，例如 `ollama/qwen3:8b`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（刷新轮次的用户消息）
- `systemPrompt`（刷新轮次附加的额外系统提示）

注意事项：

- 默认提示/系统提示包含 `NO_REPLY` 提示以抑制传递。
- 设置 `model` 时，刷新轮次使用该模型，而不继承活动 Session 回退链，因此本地专属的维护不会静默回退到付费对话模型。
- 刷新每个压缩周期运行一次（在 `sessions.json` 中跟踪）。
- 刷新仅针对嵌入式 Pi Session 运行（CLI 后端跳过）。
- 当 Session 工作区为只读（`workspaceAccess: "ro"` 或 `"none"`）时，刷新被跳过。
- 有关工作区文件布局和写入模式，请参见[记忆](/concepts/memory)。

Pi 还在扩展 API 中公开了 `session_before_compact` 钩子，但 OpenClaw 的刷新逻辑今天位于 Gateway 侧。

---

## 故障排除清单

- Session 键错误？从 [/concepts/session](/concepts/session) 开始，并在 `/status` 中确认 `sessionKey`。
- 存储 vs 转录不匹配？从 `openclaw status` 确认 Gateway 主机和存储路径。
- 压缩频繁？检查：
  - 模型上下文窗口（太小）
  - 压缩设置（对于模型窗口，`reserveTokens` 太高可能导致更早的压缩）
  - 工具结果膨胀：启用/调整 Session 修剪
- 静默轮次泄漏？确认回复以 `NO_REPLY`（不区分大小写的精确 token）开头，并且您使用的是包含流式传输抑制修复的构建。

## 相关

- [Session 管理](/concepts/session)
- [Session 修剪](/concepts/session-pruning)
- [上下文引擎](/concepts/context-engine)
