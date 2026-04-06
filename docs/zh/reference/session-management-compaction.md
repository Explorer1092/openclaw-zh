---
mmh3_hash: "7d5e5abce127adddd8caa2003df4fbab"
summary: "深入研究：Session 存储 + 转录、生命周期和（自动）压缩内部"
read_when:
  - 您需要调试 Session id、转录 JSONL 或 sessions.json 字段
  - 您正在更改自动压缩行为或添加"压缩前"维护
  - 您想要实现记忆刷新或静默系统轮次
title: "Session 管理深入研究"
---

# Session 管理与压缩（深入研究）

本文档解释了 OpenClaw 如何端到端管理 Session：

- **Session 路由**（入站消息如何映射到 `sessionKey`）
- **Session 存储**（`sessions.json`）及其跟踪内容
- **转录持久化**（`*.jsonl`）及其结构
- **转录卫生**（运行前的提供商特定修复）
- **上下文限制**（上下文窗口 vs 跟踪 token）
- **压缩**（手动 + 自动压缩）以及在哪里挂钩压缩前工作
- **静默维护**（例如不应产生用户可见输出的记忆写入）

如果您想要更高级别的概述，请从以下开始：

- [/concepts/session](/concepts/session)
- [/concepts/compaction](/concepts/compaction)
- [/concepts/memory](/concepts/memory)
- [/concepts/memory-search](/concepts/memory-search)
- [/concepts/session-pruning](/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

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

---

## 磁盘位置

每个 Agent，在 Gateway 主机上：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 转录：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主题 Session：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些路径。

---

## 存储维护和磁盘控制

Session 持久化具有自动维护控制（`session.maintenance`），用于 `sessions.json` 和转录工件：

- `mode`：`warn`（默认）或 `enforce`
- `pruneAfter`：过期条目年龄截止（默认 `30d`）
- `maxEntries`：限制 `sessions.json` 中的条目（默认 `500`）
- `rotateBytes`：当 `sessions.json` 过大时轮换（默认 `10mb`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 转录存档的保留时间（默认：与 `pruneAfter` 相同；`false` 禁用清理）
- `maxDiskBytes`：可选 Session 目录预算
- `highWaterBytes`：清理后的可选目标（默认 `maxDiskBytes` 的 `80%`）

磁盘预算清理的强制执行顺序（`mode: "enforce"`）：

1. 首先删除最旧的已存档或孤立转录工件。
2. 如果仍然超出目标，驱逐最旧的 Session 条目及其转录文件。
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
- **线程父级分叉守卫**（`session.parentForkMaxTokens`，默认 `100000`）当父级 Session 已经太大时跳过父级转录分叉；新线程从头开始。设置 `0` 禁用。

实现细节：决策发生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()` 中。

---

## Session 存储架构（`sessions.json`）

存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（非详尽）：

- `sessionId`：当前转录 id（文件名从此派生，除非设置了 `sessionFile`）
- `updatedAt`：最后活动时间戳
- `sessionFile`：可选的明确转录路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：群组/Channel 标记的元数据
- 切换：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（每 Session 覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- Token 计数器（尽力而为/取决于提供商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：该 Session 键自动压缩完成的次数
- `memoryFlushAt`：最后压缩前记忆刷新的时间戳
- `memoryFlushCompactionCount`：最后刷新运行时的压缩计数

存储可以安全编辑，但 Gateway 是权威：它可能会在 Session 运行时重写或重新水化条目。

---

## 转录结构（`*.jsonl`）

转录由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

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

有关更多信息，请参见 [/token-use](/reference/token-use)。

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

1. **溢出恢复**：模型返回上下文溢出错误（`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded` 以及类似的提供商变体）→ 压缩 → 重试。
2. **阈值维护**：成功的轮次后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为提示 + 下一次模型输出保留的余量

这些是 Pi 运行时语义（OpenClaw 消费事件，但 Pi 决定何时压缩）。

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

原因：在压缩变得不可避免之前，为多轮"维护"（如记忆写入）留出足够的余量。

实现：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`（从 `src/agents/pi-embedded-runner.ts` 调用）。

---

## 用户可见界面

您可以通过以下方式观察压缩和 Session 状态：

- `/status`（在任何聊天 Session 中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
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
- `softThresholdTokens`（默认：`4000`）
- `prompt`（刷新轮次的用户消息）
- `systemPrompt`（刷新轮次附加的额外系统提示）

注意事项：

- 默认提示/系统提示包含 `NO_REPLY` 提示以抑制传递。
- 刷新每个压缩周期运行一次（在 `sessions.json` 中跟踪）。
- 刷新仅针对嵌入式 Pi Session 运行。
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
