---
title: "Retry policy"
sidebarTitle: "Retry policy"
mmh3_hash: "29d22338f3db7d2fb2fa64aa324d8b4a"
summary: "出站 provider 调用的重试 policy"
read_when:
  - 更新 provider 重试行为或默认值
  - 调试 provider 发送错误或速率限制
---

## 目标

- 按 HTTP 请求重试，而不是按多步骤流程。
- 通过仅重试当前步骤来保留排序。
- 避免重复非幂等操作。

## 默认值

- 尝试次数：3
- 最大延迟上限：30000 ms
- Jitter：0.1（10 percent）
- Provider 默认值：
  - Telegram min delay：400 ms
  - Discord min delay：500 ms

## 行为

### Model providers

- OpenClaw 让 provider SDKs 处理正常的短重试。
- 对于基于 Stainless 的 SDKs（如 Anthropic 和 OpenAI），可重试响应（`408`、`409`、`429` 和 `5xx`）可以包含 `retry-after-ms` 或 `retry-after`。当该等待超过 60 秒时，OpenClaw 注入 `x-should-retry: false`，以便 SDK 立即浮现错误，model failover 可以轮换到另一个 auth profile 或 fallback model。
- 使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` 覆盖上限。将其设置为 `0`、`false`、`off`、`none` 或 `disabled` 以让 SDKs 在内部遵守长 `Retry-After` 睡眠。

### Discord

- 仅在速率限制错误（HTTP 429）时重试。
- 在可用时使用 Discord `retry_after`，否则指数退避。

### Telegram

- 在瞬态错误（429、timeout、connect/reset/closed、temporarily unavailable）时重试。
- 在可用时使用 `retry_after`，否则指数退避。
- Markdown parse 错误不会重试；它们退回到纯文本。

## 配置

在 `~/.openclaw/openclaw.json` 中按 provider 设置重试 policy：

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## 注意

- 重试按请求应用（消息发送、媒体上传、reaction、poll、sticker）。
- 复合流程不重试已完成的步骤。

## Related

- [Model failover](/concepts/model-failover)
- [Command queue](/concepts/queue)
