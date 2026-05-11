---
title: "Timezones"
sidebarTitle: "Timezones"
mmh3_hash: "3fd5f3058b532949f6193294f5ae1c78"
summary: "Timezone 在 OpenClaw 中的三个界面——envelopes、工具载荷、system prompt"
read_when:
  - 需要快速了解 timezone 处理的心智模型
  - 正在决定在哪里设置或覆盖 timezone
---

OpenClaw 标准化时间戳，以便 model 看到**单一参考时间**，而非 provider 本地时钟的混合。Timezone 出现在三个界面，每个界面都有其自身用途：

## 三个 timezone 界面

| 界面 | 显示内容 | 默认值 | 配置方式 |
| --- | --- | --- | --- |
| Message envelopes | 包裹入站 channel 消息：`[Signal +1555 2026-01-18 00:19 PST] hello` | 主机本地时间 | `agents.defaults.envelopeTimezone` |
| 工具载荷 | Channel `readMessages` 类工具返回原始 provider 时间 + 规范化的 `timestampMs` / `timestampUtc` | UTC 字段始终存在 | 不可配置——保留 provider 原生时间戳 |
| System prompt | 一个小的 `Current Date & Time` 块，仅包含**时区**（无时钟值，以保持缓存稳定） | 未设置 `userTimezone` 时使用主机时区 | `agents.defaults.userTimezone` |

System prompt 故意省略实时时钟以保持跨轮次的 prompt 缓存稳定。当 agent 需要当前时间时，它调用 `session_status`。

## 设置用户 timezone

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

如果未设置 `userTimezone`，OpenClaw 在运行时解析主机 timezone（不写入配置）。`agents.defaults.timeFormat`（`auto` | `12` | `24`）控制 envelopes 和下游界面中的 12 小时/24 小时渲染，而非 system prompt 部分。

## 何时覆盖

- **使用 UTC envelopes**（`envelopeTimezone: "utc"`）当你希望跨不同地区的主机拥有稳定的时间戳时，或者希望 UTC 对齐的日志与诊断输出匹配时。
- **使用固定的 IANA 时区**（如 `"Europe/Vienna"`）当 Gateway 主机在一个时区而用户在另一个时区，且你希望 envelopes 无论主机迁移如何都以用户时区显示时。
- **设置 `envelopeTimestamp: "off"`** 在时间戳 context 对对话无用时，以减少 token 消耗。

完整行为参考、各 provider 示例和已过时间格式，参见 [Date & Time](/date-time)。

## 相关

- [Date & Time](/date-time) — 完整的 envelope/工具/prompt 行为和示例。
- [Heartbeat](/gateway/heartbeat) — 活跃时段使用 timezone 进行调度。
- [Cron Jobs](/automation/cron-jobs) — cron 表达式使用 timezone 进行调度。
