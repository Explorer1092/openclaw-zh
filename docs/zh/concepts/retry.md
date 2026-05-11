---
title: "Retry policy"
sidebarTitle: "Retry policy"
mmh3_hash: "c6946dc0ab51e5ddf4fd716f6c0db7f6"
summary: "出站 provider 调用的重试 policy"
read_when:
  - 更新 provider 重试行为或默认值
  - 调试 provider 发送错误或速率限制
---

## 目标

- 按 HTTP 请求重试，而不是按多步骤流程重试。
- 仅重试当前步骤以保持顺序。
- 避免重复非幂等操作。

## 默认值

- 尝试次数：3
- 最大延迟上限：30000 ms
- 抖动：0.1（10%）
- Provider 默认值：
  - Telegram 最小延迟：400 ms
  - Discord 最小延迟：500 ms

## 行为

### Model providers

- OpenClaw 让 provider SDK 处理正常的短期重试。
- 对于基于 Stainless 的 SDK（如 Anthropic 和 OpenAI），可重试响应（`408`、`409`、`429` 和 `5xx`）可能包含 `retry-after-ms` 或 `retry-after`。当等待时间超过 60 秒时，OpenClaw 注入 `x-should-retry: false`，以便 SDK 立即暴露错误，model 故障转移可以轮换到另一个 auth profile 或 fallback model。
- 使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` 覆盖上限。将其设为 `0`、`false`、`off`、`none` 或 `disabled` 可让 SDK 在内部遵循长时间的 `Retry-After` 等待。

### Discord

- 在速率限制错误（HTTP 429）、请求超时、HTTP 5xx 响应，以及 DNS 查找失败、连接重置、socket 关闭和 fetch 失败等瞬态传输故障时重试。
- 在可用时使用 Discord `retry_after`，否则使用指数退避。

### Telegram

- 在瞬态错误（429、超时、连接/重置/关闭、暂时不可用）时重试。
- 在可用时使用 `retry_after`，否则使用指数退避。
- Markdown 解析错误不重试；回退到纯文本。

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

## 注意事项

- 重试按请求应用（消息发送、媒体上传、reaction、poll、sticker）。
- 复合流程不重试已完成的步骤。

## 相关

- [Model failover](/concepts/model-failover)
- [Command queue](/concepts/queue)
