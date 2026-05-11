---
mmh3_hash: "1de11747f25f26f291dc228ecf585e4d"
title: "Session management"
sidebarTitle: "Session management"
summary: "OpenClaw 如何管理对话 session"
read_when:
  - 需要了解 session 路由和隔离
  - 需要为多用户设置配置 DM 范围
  - 正在调试每日或空闲 session 重置
---

OpenClaw 将对话组织为 **session**。每条消息根据其来源（DM、群聊、cron 作业等）路由到相应的 session。

## 消息路由方式

| 来源 | 行为 |
| --- | --- |
| 私信 | 默认共享 session |
| 群聊 | 每个群组独立隔离 |
| 房间/channel | 每个房间独立隔离 |
| Cron 作业 | 每次运行新 session |
| Webhook | 每个 hook 独立隔离 |

## DM 隔离

默认情况下，所有 DM 共享一个 session 以保持连续性。这对单用户设置来说没问题。

<Warning>
如果多人可以向你的 agent 发消息，请启用 DM 隔离。没有它，所有用户共享同一个对话上下文——Alice 的私信对 Bob 可见。
</Warning>

**解决方法：**

```json5
{
  session: {
    dmScope: "per-channel-peer", // 按 channel + 发件人隔离
  },
}
```

其他选项：

- `main`（默认）——所有 DM 共享一个 session。
- `per-peer`——按发件人隔离（跨 channel）。
- `per-channel-peer`——按 channel + 发件人隔离（推荐）。
- `per-account-channel-peer`——按账户 + channel + 发件人隔离。

<Tip>
如果同一个人从多个 channel 联系你，使用 `session.identityLinks` 关联他们的身份，这样他们共享一个 session。
</Tip>

### 停靠关联 channel

Dock 命令让用户可以将当前私信 session 的回复路由移到另一个关联 channel，而不需要启动新 session。参见 [Channel docking](/concepts/channel-docking) 获取示例、配置和故障排除。

使用 `openclaw security audit` 验证你的设置。

## Session 生命周期

Session 会被复用直到过期：

- **每日重置**（默认）——在 Gateway 主机本地时间凌晨 4:00 创建新 session。每日新鲜度基于当前 `sessionId` 开始时间，而非后续的元数据写入。
- **空闲重置**（可选）——在一段不活跃时间后创建新 session。设置 `session.reset.idleMinutes`。空闲新鲜度基于最后一次真实的用户/channel 交互，因此心跳、cron 和 exec 系统事件不会保持 session 活跃。
- **手动重置**——在聊天中输入 `/new` 或 `/reset`。`/new <model>` 还可以切换 model。

同时配置每日和空闲重置时，最先到期的获胜。心跳、cron、exec 和其他系统事件轮次可能写入 session 元数据，但这些写入不会延长每日或空闲重置的新鲜度。当重置滚动 session 时，旧 session 的排队系统事件通知会被丢弃，以避免过时的后台更新被添加到新 session 的第一个提示之前。

拥有活跃 provider 所有 CLI session 的 session 不会被隐式每日默认值切断。当这些 session 应在计时器到期时，使用 `/reset` 或显式配置 `session.reset`。

## 状态存储位置

所有 session 状态由 **Gateway** 拥有。UI 客户端向 Gateway 查询 session 数据。

- **存储：** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **转录：** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` 保存独立的生命周期时间戳：

- `sessionStartedAt`：当前 `sessionId` 开始的时间；每日重置使用此值。
- `lastInteractionAt`：延长空闲生命周期的最后一次用户/channel 交互。
- `updatedAt`：最后一次存储行变更；对列表和清理有用，但不是每日/空闲重置新鲜度的权威来源。

没有 `sessionStartedAt` 的旧行在可用时从转录 JSONL session 头解析。如果旧行也缺少 `lastInteractionAt`，空闲新鲜度回退到该 session 开始时间，而非后续的簿记写入。

## Session 维护

OpenClaw 随时间自动限制 session 存储。默认以 `warn` 模式运行（报告将被清理的内容）。将 `session.maintenance.mode` 设为 `"enforce"` 以自动清理：

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

对于生产规模的 `maxEntries` 限制，Gateway 运行时写入使用小型高水位缓冲区，并分批清理回配置的上限。Gateway 启动时 session 存储读取不会清理或限制条目。这避免在每次启动或隔离 cron session 时运行完整的存储清理。`openclaw sessions cleanup --enforce` 立即应用上限。

维护保留持久的外部对话指针，包括群组 session 和线程范围的聊天 session，同时允许合成的 cron、hook、心跳、ACP 和子 agent 条目随时间老化。

如果之前使用了私信隔离，之后将 `session.dmScope` 恢复为 `main`，使用 `openclaw sessions cleanup --dry-run --fix-dm-scope` 预览过时的 peer 键 DM 行。应用相同标志会退役那些旧私信行并将其转录保留为已删除的归档。

使用 `openclaw sessions cleanup --dry-run` 预览。

## 检查 session

- `openclaw status` — session 存储路径和最近活动。
- `openclaw sessions --json` — 所有 session（使用 `--active <minutes>` 过滤）。
- `/status` 在聊天中 — 上下文使用情况、model 和开关。
- `/context list` — 系统提示中的内容。

## 延伸阅读

- [Session 清理](/concepts/session-pruning) — 修剪工具结果
- [Compaction](/concepts/compaction) — 总结长对话
- [Session Tools](/concepts/session-tool) — 跨 session 工作的 agent 工具
- [Session Management Deep Dive](/reference/session-management-compaction) — 存储 schema、转录、发送 policy、来源元数据和高级配置
- [Multi-Agent](/concepts/multi-agent) — 跨 agent 的路由和 session 隔离
- [Background Tasks](/automation/tasks) — 分离的工作如何创建带有 session 引用的任务记录
- [Channel Routing](/channels/channel-routing) — 入站消息如何路由到 session

## 相关

- [Session 清理](/concepts/session-pruning)
- [Session tools](/concepts/session-tool)
- [Command queue](/concepts/queue)
