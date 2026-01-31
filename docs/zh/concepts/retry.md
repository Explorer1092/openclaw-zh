---
title: "重试策略"
sidebarTitle: "重试策略"
mmh3_hash: "d5bfe1e425fbe40cdedd77bb753ba73b"
summary: "出站 provider 调用的重试 policy"
read_when:
  - 更新 provider 重试行为或默认值
  - 调试 provider 发送错误或速率限制
---
# 重试策略

## 目标
- 按 HTTP 请求重试,而不是按多步骤流程。
- 通过仅重试当前步骤来保留排序。
- 避免重复非幂等操作。

## 默认值
- 尝试次数: 3
- 最大延迟上限: 30000 ms
- Jitter: 0.1 (10 percent)
- Provider 默认值:
  - Telegram min delay: 400 ms
  - Discord min delay: 500 ms

## 行为
### Discord
- 仅在速率限制错误(HTTP 429)时重试。
- 在可用时使用 Discord `retry_after`,否则指数退避。

### Telegram
- 在瞬态错误(429、timeout、connect/reset/closed、temporarily unavailable)时重试。
- 在可用时使用 `retry_after`,否则指数退避。
- Markdown parse 错误不会重试;它们退回到纯文本。

## 配置
在 `~/.openclaw/openclaw.json` 中按 provider 设置重试 policy:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1
      }
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1
      }
    }
  }
}
```

## 注意
- 重试按请求应用(消息发送、媒体上传、reaction、poll、sticker)。
- 复合流程不重试已完成的步骤。
