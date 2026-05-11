---
title: "日期和时间"
mmh3_hash: "cc4036dd769c9e1cfab4d03e8ee69f39"
summary: "跨信封、提示、工具和连接器的日期和时间处理"
read_when:
  - 您正在更改向模型或用户显示时间戳的方式
  - 您正在调试消息或系统提示输出中的时间格式
---

OpenClaw 默认对**传输时间戳使用主机本地时间**，对**系统提示中仅使用用户时区**。Provider 时间戳被保留，以便工具保留其原生语义（当前时间可通过 `session_status` 获得）。

## 消息信封（默认本地）

入站消息使用时间戳包装（分钟精度）：

```
[Provider ... 2026-01-05 16:26 PST] message text
```

该信封时间戳**默认使用主机本地时间**，无论 provider 时区如何。

您可以覆盖此行为：

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA 时区
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` 使用 UTC。
- `envelopeTimezone: "local"` 使用主机时区。
- `envelopeTimezone: "user"` 使用 `agents.defaults.userTimezone`（回退到主机时区）。
- 使用明确的 IANA 时区（例如 `"America/Chicago"`）以获得固定时区。
- `envelopeTimestamp: "off"` 从信封标头中删除绝对时间戳。
- `envelopeElapsed: "off"` 删除经过时间后缀（`+2m` 样式）。

### 示例

**本地（默认）：**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**用户时区：**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**启用经过时间：**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## 系统提示：当前日期和时间

如果知道用户时区，系统提示包括专用的**当前日期和时间**部分，仅包含**时区**（无时钟/时间格式），以保持提示缓存稳定：

```
Time zone: America/Chicago
```

当 agent 需要当前时间时，使用 `session_status` 工具；状态卡包含时间戳行。

## 系统事件行（默认本地）

插入到 agent 上下文中的排队系统事件使用与消息信封相同的时区选择作为时间戳前缀（默认：主机本地）。

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### 配置用户时区 + 格式

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` 设置提示上下文的**用户本地时区**。
- `timeFormat` 控制提示中的 **12h/24h 显示**。`auto` 遵循操作系统偏好。

## 时间格式检测（auto）

当 `timeFormat: "auto"` 时，OpenClaw 检查操作系统偏好（macOS/Windows）并回退到区域设置格式。检测到的值**按进程缓存**以避免重复的系统调用。

## 工具负载 + 连接器（原始 provider 时间 + 规范化字段）

Channel 工具返回 **provider 原生时间戳**并添加规范化字段以保持一致性：

- `timestampMs`：纪元毫秒（UTC）
- `timestampUtc`：ISO 8601 UTC 字符串

保留原始 provider 字段，以免丢失任何内容。

- Slack：来自 API 的纪元样式字符串
- Discord：UTC ISO 时间戳
- Telegram/WhatsApp：provider 特定的数字/ISO 时间戳

如果您需要本地时间，请使用已知的时区在下游进行转换。

## 相关文档

- [系统提示](/concepts/system-prompt)
- [时区](/concepts/timezone)
- [消息](/concepts/messages)
