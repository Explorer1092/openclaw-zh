---
mmh3_hash: "c224265a1479a477eb070e8972706291"
title: "Session management"
sidebarTitle: "Session management"
summary: "OpenClaw 如何管理对话 Session"
read_when:
  - 你想了解 Session 路由和隔离
  - 你想为多用户设置配置私信范围
  - 你在调试每日或空闲 Session 重置
---

OpenClaw 将对话组织成 **Session**。每条消息根据其来源——私信、群聊、cron 任务等——路由到一个 Session。

## 消息如何被路由

| 来源          | 行为                   |
| ------------- | ---------------------- |
| 私信          | 默认共享 Session       |
| 群聊          | 每个群组独立           |
| 房间/Channel  | 每个房间独立           |
| Cron 任务     | 每次运行全新 Session   |
| Webhook       | 每个 Hook 独立         |

## 私信隔离

默认情况下，所有私信共享一个 Session 以保持连续性。这对单用户设置来说没问题。

<Warning>
如果多人可以给你的 Agent 发消息，请启用私信隔离。没有它，所有用户共享相同的对话上下文——Alice 的私信对 Bob 可见。
</Warning>

**解决方法：**

```json5
{
  session: {
    dmScope: "per-channel-peer", // 按 Channel + 发送者隔离
  },
}
```

其他选项：

- `main`（默认）— 所有私信共享一个 Session。
- `per-peer` — 按发送者（跨 Channel）隔离。
- `per-channel-peer` — 按 Channel + 发送者隔离（推荐）。
- `per-account-channel-peer` — 按账户 + Channel + 发送者隔离。

<Tip>
如果同一个人从多个 Channel 联系你，使用 `session.identityLinks` 链接他们的身份，使他们共享一个 Session。
</Tip>

使用 `openclaw security audit` 验证你的设置。

## Session 生命周期

Session 被复用直到过期：

- **每日重置**（默认）— Gateway 主机本地时间凌晨 4:00 创建新 Session。每日新鲜度基于当前 `sessionId` 开始的时间，而不是后来的元数据写入。
- **空闲重置**（可选）— 一段时间不活动后创建新 Session。设置 `session.reset.idleMinutes`。空闲新鲜度基于上一次真实的用户/Channel 交互，因此心跳、cron 和 exec 系统事件不会保持 Session 存活。
- **手动重置** — 在聊天中输入 `/new` 或 `/reset`。`/new <model>` 同时切换 model。

当每日和空闲重置都配置时，最先到期的那个获胜。心跳、cron、exec 和其他系统事件回合可能会写入 Session 元数据，但这些写入不会延长每日或空闲重置的新鲜度。当重置滚动 Session 时，旧 Session 排队的系统事件通知将被丢弃，以免过时的后台更新被添加到新 Session 的第一个 prompt 之前。

具有活跃 provider 拥有的 CLI Session 的 Sessions 不会被隐式的每日默认切断。当这些 Sessions 应该在计时器上过期时，使用 `/reset` 或明确配置 `session.reset`。

## 状态存储位置

所有 Session 状态由 **Gateway** 拥有。UI 客户端向 Gateway 查询 Session 数据。

- **存储：** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcript：** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` 保留独立的生命周期时间戳：

- `sessionStartedAt`：当前 `sessionId` 开始的时间；每日重置使用此值。
- `lastInteractionAt`：延长空闲生命周期的上一次用户/Channel 交互。
- `updatedAt`：上一次 store 行变更；对列出和修剪有用，但不是每日/空闲重置新鲜度的权威来源。

没有 `sessionStartedAt` 的旧行在可用时从 transcript JSONL Session 头解析。如果旧行也缺少 `lastInteractionAt`，空闲新鲜度回退到该 Session 开始时间，而不是后来的记账写入。

## Session 维护

OpenClaw 随时间自动限制 Session 存储。默认情况下，它在 `warn` 模式下运行（报告将被清理的内容）。将 `session.maintenance.mode` 设置为 `"enforce"` 以自动清理：

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

使用 `openclaw sessions cleanup --dry-run` 预览。

## 检查 Session

- `openclaw status` — Session 存储路径和最近活动。
- `openclaw sessions --json` — 所有 Session（使用 `--active <minutes>` 过滤）。
- 在聊天中输入 `/status` — 上下文使用量、model 和切换状态。
- 在聊天中输入 `/context list` — system prompt 中的内容。

## 延伸阅读

- [Session Pruning](/concepts/session-pruning) — 修剪 tool results
- [Compaction](/concepts/compaction) — 总结长对话
- [Session Tools](/concepts/session-tool) — 跨 Session 工作的 Agent 工具
- [Session Management Deep Dive](/reference/session-management-compaction) — 存储 schema、transcript、发送策略、来源元数据和高级配置
- [Multi-Agent](/concepts/multi-agent) — 跨 Agent 的路由和 Session 隔离
- [Background Tasks](/automation/tasks) — 分离的工作如何创建带 Session 引用的任务记录
- [Channel Routing](/channels/channel-routing) — 入站消息如何路由到 Session

## Related

- [Session pruning](/concepts/session-pruning)
- [Session tools](/concepts/session-tool)
- [Command queue](/concepts/queue)
