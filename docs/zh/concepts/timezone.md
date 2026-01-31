---
title: "Timezones"
mmh3_hash: "4ee18a2763f55b0423bf67945f39b2a9"
summary: "Agents、envelopes 和 prompts 的 Timezone 处理"
read_when:
  - 你需要了解如何为 model 规范化时间戳
  - 为 system prompts 配置用户 timezone
---

# Timezones

OpenClaw 标准化时间戳,以便 model 看到 **单个参考时间**。

## Message envelopes (默认本地)

入站消息包装在信封中,如:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

信封中的时间戳 **默认为主机本地**,精度为分钟。

你可以使用以下方式覆盖:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on" // "on" | "off"
    }
  }
}
```

- `envelopeTimezone: "utc"` 使用 UTC。
- `envelopeTimezone: "user"` 使用 `agents.defaults.userTimezone`(后备到主机 timezone)。
- 使用显式 IANA timezone(例如,`"Europe/Vienna"`)以获得固定偏移量。
- `envelopeTimestamp: "off"` 从信封标头中删除绝对时间戳。
- `envelopeElapsed: "off"` 删除经过时间后缀(`+2m` 样式)。

### 示例

**本地(默认):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**固定 timezone:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**经过时间:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## Tool payloads (原始 provider 数据 + 规范化字段)

Tool 调用(`channels.discord.readMessages`、`channels.slack.readMessages` 等)返回 **原始 provider 时间戳**。我们还附加规范化字段以保持一致性:

- `timestampMs` (UTC epoch 毫秒)
- `timestampUtc` (ISO 8601 UTC 字符串)

保留原始 provider 字段。

## System prompt 的用户 timezone

设置 `agents.defaults.userTimezone` 以告诉 model 用户的本地时区。如果未设置,OpenClaw 在 runtime 解析 **主机 timezone**(无配置写入)。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } }
}
```

System prompt 包括:
- 带有本地时间和 timezone 的 `Current Date & Time` 部分
- `Time format: 12-hour` 或 `24-hour`

你可以使用 `agents.defaults.timeFormat` (`auto` | `12` | `24`)控制 prompt 格式。

参见 [Date & Time](/zh/date-time) 了解完整行为和示例。
