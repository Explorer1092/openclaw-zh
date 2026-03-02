---
mmh3_hash: "acf5cf658faa97e81a1d7cd173e91aea"
summary: "深入研究：会话存储 + 转录、生命周期和（自动）压缩内部"
read_when:
  - 您需要调试会话 id、转录 JSONL 或 sessions.json 字段
  - 您正在更改自动压缩行为或添加"压缩前"维护
  - 您想要实现内存刷新或静默系统轮次
title: "会话管理深入研究"
---

# 会话管理与压缩（深入研究）

本文档解释了 OpenClaw 如何端到端管理会话：

- **会话路由**（入站消息如何映射到 `sessionKey`）
- **会话存储**（`sessions.json`）及其跟踪内容
- **转录持久化**（`*.jsonl`）及其结构
- **转录卫生**（运行前的提供商特定修复）
- **上下文限制**（上下文窗口 vs 跟踪令牌）
- **压缩**（手动 + 自动压缩）以及在哪里挂钩压缩前工作
- **静默维护**（例如不应产生用户可见输出的内存写入）

如果您想要更高级别的概述，请从以下开始：

- [/concepts/session](/concepts/session)
- [/concepts/compaction](/concepts/compaction)
- [/concepts/session-pruning](/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## 真实来源：Gateway

OpenClaw 围绕拥有会话状态的单个 **Gateway 进程**设计。

- UI（macOS 应用、Web 控制 UI、TUI）应该查询 Gateway 以获取会话列表和令牌计数。
- 在远程模式下，会话文件位于远程主机上；"检查您的本地 Mac 文件"不会反映 Gateway 正在使用的内容。

---

## 两个持久化层

OpenClaw 在两层中持久化会话：

1. **会话存储（`sessions.json`）**
   - 键/值映射：`sessionKey -> SessionEntry`
   - 小型、可变、可安全编辑（或删除条目）
   - 跟踪会话元数据（当前会话 id、最后活动、切换、令牌计数器等）

2. **转录（`<sessionId>.jsonl`）**
   - 具有树结构的仅追加转录（条目具有 `id` + `parentId`）
   - 存储实际对话 + 工具调用 + 压缩摘要
   - 用于为未来轮次重建模型上下文

---

## 磁盘位置

每个 Agent，在 Gateway 主机上：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 转录：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主题会话：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些。

---

## 存储维护与磁盘控制

会话持久化具有自动维护控制（`session.maintenance`），用于管理 `sessions.json` 和转录工件：

- `mode`：`warn`（默认）或 `enforce`
- `pruneAfter`：过期条目年龄截止（默认 `30d`）
- `maxEntries`：限制 `sessions.json` 中的条目数（默认 `500`）
- `rotateBytes`：当 `sessions.json` 过大时轮转（默认 `10mb`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 转录归档的保留时间（默认：与 `pruneAfter` 相同；`false` 禁用清理）
- `maxDiskBytes`：可选的会话目录预算
- `highWaterBytes`：清理后的可选目标（默认为 `maxDiskBytes` 的 `80%`）

磁盘预算清理的执行顺序（`mode: "enforce"`）：

1. 首先删除最旧的归档或孤立转录工件。
2. 如果仍超出目标，则驱逐最旧的会话条目及其转录文件。
3. 继续直到使用量达到或低于 `highWaterBytes`。

在 `mode: "warn"` 中，OpenClaw 报告潜在的驱逐但不修改存储/文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 会话和运行日志

隔离的 Cron 运行也会创建会话条目/转录，它们有专用的保留控制：

- `cron.sessionRetention`（默认 `24h`）从会话存储中清除旧的隔离 Cron 运行会话（`false` 禁用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 清理 `~/.openclaw/cron/runs/<jobId>.jsonl` 文件（默认：`2_000_000` 字节和 `2000` 行）。

---

## 会话键（`sessionKey`）

`sessionKey` 标识_您所在的哪个对话桶_（路由 + 隔离）。

常见模式：

- 主/直接聊天（每个 Agent）：`agent:<agentId>:<mainKey>`（默认 `main`）
- 群组：`agent:<agentId>:<channel>:group:<id>`
- 房间/频道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非覆盖）

规范规则记录在 [/concepts/session](/concepts/session)。

---

## 会话 id（`sessionId`）

每个 `sessionKey` 指向当前 `sessionId`（继续对话的转录文件）。

经验法则：

- **重置**（`/new`、`/reset`）为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认凌晨 4:00 Gateway 主机本地时间）在重置边界后的下一条消息上创建新的 `sessionId`。
- **空闲到期**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）在消息在空闲窗口后到达时创建新的 `sessionId`。当每日 + 空闲都配置时，首先到期的获胜。
- **线程父节点分叉保护**（`session.parentForkMaxTokens`，默认 `100000`）当父会话已经太大时跳过父转录分叉；新线程从头开始。设置 `0` 以禁用。

实现细节：决定发生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()` 中。

---

## 会话存储架构（`sessions.json`）

存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（非详尽）：

- `sessionId`：当前转录 id（除非设置了 `sessionFile`，否则从此派生文件名）
- `updatedAt`：最后活动时间戳
- `sessionFile`：可选的显式转录路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：群组/频道标记的元数据
- 切换：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（每个会话覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- 令牌计数器（尽力而为 / 提供商依赖）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此会话键的自动压缩完成了多少次
- `memoryFlushAt`：上次压缩前内存刷新的时间戳
- `memoryFlushCompactionCount`：上次刷新运行时的压缩计数

存储可以安全编辑，但 Gateway 是权威：它可能会在会话运行时重写或重新水化条目。

---

## 转录结构（`*.jsonl`）

转录由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

文件是 JSONL：

- 第一行：会话标头（`type: "session"`，包括 `id`、`cwd`、`timestamp`、可选 `parentSession`）
- 然后：具有 `id` + `parentId` 的会话条目（树）

值得注意的条目类型：

- `message`：user/assistant/toolResult 消息
- `custom_message`：扩展注入的消息，_确实_进入模型上下文（可以从 UI 隐藏）
- `custom`：扩展状态，_不_进入模型上下文
- `compaction`：持久化的压缩摘要，带有 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：导航树分支时的持久化摘要

OpenClaw 故意**不**"修复"转录；Gateway 使用 `SessionManager` 读取/写入它们。

---

## 上下文窗口 vs 跟踪令牌

两个不同的概念很重要：

1. **模型上下文窗口**：每个模型的硬上限（模型可见的令牌）
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计（用于 /status 和仪表板）

如果您正在调整限制：

- 上下文窗口来自模型目录（可以通过配置覆盖）。
- 存储中的 `contextTokens` 是运行时估计/报告值；不要将其视为严格保证。

有关更多信息，请参见 [/token-use](/reference/token-use)。

---

## 压缩：它是什么

压缩将较旧的对话摘要为转录中的持久 `compaction` 条目，并保持最近的消息完整。

压缩后，未来的轮次看到：

- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩是**持久的**（与会话修剪不同）。请参见 [/concepts/session-pruning](/concepts/session-pruning)。

---

## 何时发生自动压缩（Pi 运行时）

在嵌入式 Pi Agent 中，自动压缩在两种情况下触发：

1. **溢出恢复**：模型返回上下文溢出错误 → 压缩 → 重试。
2. **阈值维护**：成功轮次后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为提示 + 下一个模型输出保留的空间

这些是 Pi 运行时语义（OpenClaw 消费事件，但 Pi 决定何时压缩）。

---

## 压缩设置（`reserveTokens`、`keepRecentTokens`）

Pi 的压缩设置存在于 Pi 设置中：

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw 还为嵌入式运行强制执行安全下限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 会提升它。
- 默认下限是 `20000` 令牌。
- 设置 `agents.defaults.compaction.reserveTokensFloor: 0` 以禁用下限。
- 如果已经更高，OpenClaw 会保持不变。

原因：在压缩变得不可避免之前，为多轮"维护"（如内存写入）留下足够的空间。

实现：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`（从 `src/agents/pi-embedded-runner.ts` 调用）。

---

## 用户可见界面

您可以通过以下方式观察压缩和会话状态：

- `/status`（在任何聊天会话中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 详细模式：`🧹 Auto-compaction complete` + 压缩计数

---

## 静默维护（`NO_REPLY`）

OpenClaw 支持用于后台任务的"静默"轮次，用户不应看到中间输出。

约定：

- 助手以 `NO_REPLY` 开始其输出，表示"不要向用户传递回复"。
- OpenClaw 在传递层中剥离/抑制此内容。

从 `2026.1.10` 开始，当部分块以 `NO_REPLY` 开始时，OpenClaw 还会抑制**草稿/打字流**，因此静默操作不会在轮次中泄漏部分输出。

---

## 压缩前"内存刷新"（已实现）

目标：在自动压缩发生之前，运行一个静默 Agent 轮次，将持久状态写入磁盘（例如 Agent 工作空间中的 `memory/YYYY-MM-DD.md`），以便压缩无法擦除关键上下文。

OpenClaw 使用**预阈值刷新**方法：

1. 监视会话上下文使用情况。
2. 当它越过"软阈值"（低于 Pi 的压缩阈值）时，运行静默"立即写入内存"指令到 Agent。
3. 使用 `NO_REPLY`，以便用户什么也看不到。

配置（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（默认：`true`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（刷新轮次的用户消息）
- `systemPrompt`（为刷新轮次附加的额外系统提示）

注意事项：

- 默认 prompt/system prompt 包括 `NO_REPLY` 提示以抑制传递。
- 刷新每个压缩周期运行一次（在 `sessions.json` 中跟踪）。
- 刷新仅针对嵌入式 Pi 会话运行（CLI 后端跳过它）。
- 当会话工作空间为只读时跳过刷新（`workspaceAccess: "ro"` 或 `"none"`）。
- 有关工作空间文件布局和写入模式，请参见 [内存](/concepts/memory)。

Pi 还在扩展 API 中公开 `session_before_compact` 钩子，但 OpenClaw 的刷新逻辑目前存在于 Gateway 端。

---

## 故障排除清单

- 会话键错误？从 [/concepts/session](/concepts/session) 开始，并在 `/status` 中确认 `sessionKey`。
- 存储 vs 转录不匹配？从 `openclaw status` 确认 Gateway 主机和存储路径。
- 压缩过于频繁？检查：
  - 模型上下文窗口（太小）
  - 压缩设置（对于模型窗口，`reserveTokens` 太高会导致更早的压缩）
  - 工具结果膨胀：启用/调整会话修剪
- 静默轮次泄漏？确认回复以 `NO_REPLY`（确切令牌）开始，并且您正在使用包含流抑制修复的构建。
