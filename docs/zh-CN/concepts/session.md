---
read_when:
  - 你想了解会话路由和隔离
  - 你想为多用户场景配置私信作用域
summary: OpenClaw 如何管理对话会话
title: 会话管理
x-i18n:
  generated_at: "2026-02-03T07:47:44Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: a97d9c4dc45608dd9fc108633ddf084bf6b6169d0b9a0832b572ffc22fbe64cb
  source_path: concepts/session.md
  workflow: 15
---

# 会话管理

OpenClaw 将对话组织到**会话**中。每条消息根据其来源——私信、群聊、定时任务等——路由到相应的会话。

## 消息路由方式

| 来源       | 行为                    |
| ---------- | ----------------------- |
| 私信       | 默认共享会话            |
| 群聊       | 每个群独立隔离          |
| 房间/频道  | 每个房间独立隔离        |
| 定时任务   | 每次运行创建新会话      |
| Webhook    | 每个 hook 独立隔离      |

## 私信隔离

默认情况下，所有私信共享一个会话以保持连续性。这对单用户场景没有问题。

<Warning>
如果多个用户可以向你的智能体发送消息，请启用私信隔离。否则，所有用户会共享相同的对话上下文——Alice 的私信将对 Bob 可见。
</Warning>

**解决方案：**

```json5
{
  session: {
    dmScope: "per-channel-peer", // 按渠道 + 发送者隔离
  },
}
```

其他选项：

- `main`（默认）— 所有私信共享一个会话。
- `per-peer` — 按发送者隔离（跨渠道）。
- `per-channel-peer` — 按渠道 + 发送者隔离（推荐）。
- `per-account-channel-peer` — 按账户 + 渠道 + 发送者隔离。

<Tip>
如果同一个人通过多个渠道联系你，使用 `session.identityLinks` 关联他们的身份，让他们共享一个会话。
</Tip>

使用 `openclaw security audit` 验证你的配置。

## 会话生命周期

会话会被复用，直到过期：

- **每日重置**（默认）— 在 Gateway 网关主机本地时间凌晨 4:00 创建新会话。
- **空闲重置**（可选）— 在空闲一段时间后创建新会话。设置 `session.reset.idleMinutes`。
- **手动重置** — 在聊天中输入 `/new` 或 `/reset`。`/new <model>` 同时切换模型。

同时配置每日重置和空闲重置时，先过期者生效。

## 状态存储位置

所有会话状态由 **Gateway 网关**管理。UI 客户端向 Gateway 网关查询会话数据。

- **存储：** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **记录：** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## 会话维护

OpenClaw 会自动限制会话存储的增长。默认以 `warn` 模式运行（报告将要清理的内容）。将 `session.maintenance.mode` 设置为 `"enforce"` 以启用自动清理：

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

使用 `openclaw sessions cleanup --dry-run` 预览清理效果。

## 检查会话

- `openclaw status` — 会话存储路径和最近活动。
- `openclaw sessions --json` — 所有会话（使用 `--active <minutes>` 过滤）。
- 在聊天中输入 `/status` — 上下文使用情况、模型和开关状态。
- `/context list` — 系统提示中的内容。

## 延伸阅读

- [会话修剪](/concepts/session-pruning) — 裁剪工具结果
- [压缩](/concepts/compaction) — 总结长对话
- [会话工具](/concepts/session-tool) — 用于跨会话工作的智能体工具
- [会话管理深度指南](/reference/session-management-compaction) — 存储模式、记录、发送策略、来源元数据和高级配置
