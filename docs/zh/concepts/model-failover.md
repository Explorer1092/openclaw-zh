---
title: "模型故障转移"
sidebarTitle: "模型故障转移"
mmh3_hash: "6be529140229316d6ea250eb9bf54d2f"
summary: "OpenClaw 如何轮换 auth profiles 并跨 models 后备"
read_when: ["诊断 auth profile 轮换、cooldowns 或 model 后备行为","更新 auth profiles 或 models 的 failover 规则"]
---

# 模型故障转移

OpenClaw 分两个阶段处理故障:
1) 当前 provider 内的 **Auth profile 轮换**。
2) **Model 后备** 到 `agents.defaults.model.fallbacks` 中的下一个 model。

本文档解释运行时规则和支持它们的数据。

## Auth 存储(keys + OAuth)

OpenClaw 对 API keys 和 OAuth tokens 都使用 **auth profiles**。

- Secrets 位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`(传统:`~/.openclaw/agent/auth-profiles.json`)。
- 配置 `auth.profiles` / `auth.order` 是 **仅元数据 + 路由**(无 secrets)。
- 传统的仅导入 OAuth 文件:`~/.openclaw/credentials/oauth.json`(首次使用时导入 `auth-profiles.json`)。

更多详细信息:[/concepts/oauth](/zh/concepts/oauth)

凭据类型:
- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ 某些 providers 的 `projectId`/`enterpriseUrl`)

## Profile IDs

OAuth 登录创建不同的 profiles,以便多个账户可以共存。
- 默认:当没有 email 可用时为 `provider:default`。
- 带 email 的 OAuth:`provider:<email>`(例如 `google-antigravity:user@gmail.com`)。

Profiles 位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当 provider 有多个 profiles 时,OpenClaw 选择如下顺序:

1) **显式配置**:`auth.order[provider]`(如果设置)。
2) **配置的 profiles**:按 provider 过滤的 `auth.profiles`。
3) **存储的 profiles**:`auth-profiles.json` 中该 provider 的条目。

如果未配置显式顺序,OpenClaw 使用循环顺序:
- **主键:** profile 类型(**OAuth 优先于 API keys**)。
- **次键:** `usageStats.lastUsed`(最旧的优先,在每种类型内)。
- **Cooldown/disabled profiles** 移到末尾,按最快到期时间排序。

### Session 粘性(缓存友好)

OpenClaw **每个 session 固定选择的 auth profile** 以保持 provider 缓存温暖。它 **不** 在每个请求上轮换。固定的 profile 被重用,直到:
- session 被重置(`/new` / `/reset`)
- compaction 完成(compaction 计数增加)
- profile 处于 cooldown/disabled

通过 `/model …@<profileId>` 手动选择为该 session 设置 **用户覆盖**,并且在新 session 开始之前不会自动轮换。

自动固定的 profiles(由 session router 选择)被视为 **偏好**:它们首先尝试,但 OpenClaw 可能在速率限制/超时时轮换到另一个 profile。用户固定的 profiles 保持锁定到该 profile;如果失败并配置了 model fallbacks,OpenClaw 移动到下一个 model 而不是切换 profiles。

### 为什么 OAuth 可能"看起来丢失"

如果你对同一 provider 既有 OAuth profile 又有 API key profile,循环可以在消息之间切换它们,除非固定。要强制单个 profile:
- 使用 `auth.order[provider] = ["provider:profileId"]` 固定,或
- 通过 `/model …` 使用 profile 覆盖(在你的 UI/chat 表面支持时)进行每个 session 覆盖。

## Cooldowns

当 profile 由于 auth/rate‑limit 错误(或看起来像速率限制的超时)失败时,OpenClaw 将其标记为 cooldown 并移至下一个 profile。Format/invalid‑request 错误(例如 Cloud Code Assist tool call ID 验证失败)被视为值得 failover,并使用相同的 cooldowns。OpenAI 兼容的停止原因错误,如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`,被归类为超时/failover 信号。

Cooldowns 使用指数退避:
- 1 分钟
- 5 分钟
- 25 分钟
- 1 小时(上限)

状态存储在 `auth-profiles.json` 的 `usageStats` 下:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## 账单禁用

账单/信用失败(例如"信用不足" / "信用余额太低")被视为值得 failover,但它们通常不是暂时的。OpenClaw 不是短暂的 cooldown,而是将 profile 标记为 **disabled**(具有更长的退避),并轮换到下一个 profile/provider。

状态存储在 `auth-profiles.json` 中:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

默认值:
- 账单退避从 **5 小时** 开始,每次账单失败加倍,上限为 **24 小时**。
- 如果 profile 在 **24 小时** 内没有失败(可配置),退避计数器重置。

## Model 后备

如果 provider 的所有 profiles 都失败,OpenClaw 移动到 `agents.defaults.model.fallbacks` 中的下一个 model。这适用于 auth 失败、速率限制和耗尽 profile 轮换的超时(其他错误不推进 fallback)。

当运行以 model 覆盖(hooks 或 CLI)开始时,fallbacks 在尝试任何配置的 fallbacks 后仍以 `agents.defaults.model.primary` 结束。

## 相关配置

参见 [Gateway configuration](/gateway/configuration) 了解:
- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

参见 [Models](/concepts/models) 了解更广泛的 model 选择和 fallback 概述。
