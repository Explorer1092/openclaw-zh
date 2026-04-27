---
mmh3_hash: "352876e9460660ac8bcc062f0b677375"
title: "Model Failover"
sidebarTitle: "Model Failover"
summary: "OpenClaw 如何轮换 auth profiles 并跨 model 后备"
read_when:
  - 诊断 auth profile 轮换、cooldown 或 model 后备行为
  - 更新 auth profiles 或 model 的 failover 规则
  - 了解 Session model 覆盖如何与后备重试交互
---

OpenClaw 分两个阶段处理故障：

1. 当前 provider 内的 **Auth profile 轮换**。
2. **Model 后备**到 `agents.defaults.model.fallbacks` 中的下一个 model。

本文档解释运行时规则和支持它们的数据。

## 运行时流程

对于正常文本运行，OpenClaw 按以下顺序评估候选项：

<Steps>
  <Step title="解析 Session 状态">
    解析活动 Session model 和 auth profile 偏好。
  </Step>
  <Step title="构建候选链">
    从当前选定的 Session model 构建 model 候选链，然后按顺序构建 `agents.defaults.model.fallbacks`，当运行从覆盖启动时以配置的主 model 结束。
  </Step>
  <Step title="尝试当前 provider">
    使用 auth profile 轮换/cooldown 规则尝试当前 provider。
  </Step>
  <Step title="在值得 failover 的错误上推进">
    如果该 provider 因值得 failover 的错误而耗尽，移至下一个 model 候选项。
  </Step>
  <Step title="持久化 fallback 覆盖">
    在重试开始前持久化选定的 fallback 覆盖，以便其他 Session 读取器看到 runner 即将使用的相同 provider/model。持久化的 model 覆盖标记为 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="失败时狭义回滚">
    如果 fallback 候选项失败，仅在与该失败候选项匹配时回滚 fallback 拥有的 Session 覆盖字段。
  </Step>
  <Step title="耗尽时抛出 FallbackSummaryError">
    如果所有候选项都失败，抛出带有每次尝试详情的 `FallbackSummaryError`，以及已知时最早的 cooldown 到期时间。
  </Step>
</Steps>

这有意比"保存和恢复整个 Session"更窄。回复 runner 只持久化它为 fallback 拥有的 model 选择字段：

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这防止失败的 fallback 重试覆盖更新的无关 Session 变更，例如在尝试运行时发生的手动 `/model` 更改或 Session 轮换更新。

## Auth 存储（keys + OAuth）

OpenClaw 对 API keys 和 OAuth tokens 都使用 **auth profiles**。

- Secrets 位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（旧版：`~/.openclaw/agent/auth-profiles.json`）。
- 运行时 auth 路由状态位于 `~/.openclaw/agents/<agentId>/agent/auth-state.json`。
- 配置 `auth.profiles` / `auth.order` 是**仅元数据 + 路由**（无 secrets）。
- 旧版仅导入 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时导入 `auth-profiles.json`）。

更多详细信息：[OAuth](/concepts/oauth)

凭据类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（+ 某些 provider 的 `projectId`/`enterpriseUrl`）

## Profile IDs

OAuth 登录创建不同的 profile，以便多个账户可以共存。

- 默认：当没有 email 可用时为 `provider:default`。
- 带 email 的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

Profile 位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当 provider 有多个 profile 时，OpenClaw 选择如下顺序：

<Steps>
  <Step title="显式配置">
    `auth.order[provider]`（如果设置）。
  </Step>
  <Step title="配置的 profile">
    按 provider 过滤的 `auth.profiles`。
  </Step>
  <Step title="存储的 profile">
    `auth-profiles.json` 中该 provider 的条目。
  </Step>
</Steps>

如果未配置显式顺序，OpenClaw 使用循环顺序：

- **主键：** profile 类型（**OAuth 优先于 API keys**）。
- **次键：** `usageStats.lastUsed`（最旧的优先，在每种类型内）。
- **Cooldown/disabled profile** 移到末尾，按最快到期时间排序。

### Session 粘性（缓存友好）

OpenClaw **每个 Session 固定选择的 auth profile** 以保持 provider 缓存热度。它**不**在每个请求上轮换。固定的 profile 被重用，直到：

- Session 被重置（`/new` / `/reset`）
- compaction 完成（compaction 计数增加）
- profile 处于 cooldown/disabled

通过 `/model …@<profileId>` 手动选择为该 Session 设置**用户覆盖**，并且在新 Session 开始之前不会自动轮换。

<Note>
自动固定的 profile（由 Session router 选择）被视为**偏好**：首先尝试，但 OpenClaw 可能在速率限制/超时时轮换到另一个 profile。用户固定的 profile 保持锁定；如果失败并配置了 model fallback，OpenClaw 移动到下一个 model 而不是切换 profile。
</Note>

### 为什么 OAuth 可能"看起来丢失"

如果你对同一 provider 既有 OAuth profile 又有 API key profile，循环可以在消息之间切换它们，除非固定。要强制单个 profile：

- 使用 `auth.order[provider] = ["provider:profileId"]` 固定，或
- 通过 `/model …` 使用 profile 覆盖（在你的 UI/chat 表面支持时）进行每个 Session 覆盖。

## Cooldown

当 profile 由于 auth/速率限制错误（或看起来像速率限制的超时）失败时，OpenClaw 将其标记为 cooldown 并移至下一个 profile。

<AccordionGroup>
  <Accordion title="进入速率限制/超时桶的情况">
    该速率限制桶比普通 `429` 更宽泛：它还包括提供商消息，如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及定期使用窗口限制，如 `weekly/monthly limit reached`。

    Format/invalid-request 错误（例如 Cloud Code Assist tool call ID 验证失败）被视为值得 failover，并使用相同的 cooldown。OpenAI 兼容的停止原因错误，如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，被归类为超时/failover 信号。

    当来源匹配已知临时模式时，通用服务器文本也会进入该超时桶。例如，裸 pi-ai stream-wrapper 消息 `An unknown error occurred` 对每个 provider 都被视为值得 failover，因为 pi-ai 在 provider 流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束而没有具体详情时会发出它。带有临时服务器文本（如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`）的 JSON `api_error` payloads 也被视为值得 failover 的超时。

    OpenRouter 特定的通用上游文本（如裸 `Provider returned error`）仅在 provider context 实际为 OpenRouter 时才被视为超时。通用内部备用文本（如 `LLM request failed with an unknown error.`）保持保守处理，不会自行触发 failover。

  </Accordion>
  <Accordion title="SDK retry-after 上限">
    某些 provider SDK 可能在将控制权返回给 OpenClaw 之前为较长的 `Retry-After` 窗口休眠。对于基于 Stainless 的 SDK（如 Anthropic 和 OpenAI），OpenClaw 默认将 SDK 内部 `retry-after-ms` / `retry-after` 等待上限设为 60 秒，并立即呈现较长的可重试响应，以便此 failover 路径可以运行。通过 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用上限；参见 [Retry 行为](/concepts/retry)。
  </Accordion>
  <Accordion title="Model 范围的 cooldown">
    速率限制 cooldown 也可以是 model 范围的：

    - OpenClaw 在已知失败 model id 时记录速率限制失败的 `cooldownModel`。
    - 同一 provider 上的兄弟 model 在 cooldown 范围限于不同 model 时仍可以被尝试。
    - 账单/禁用窗口仍然跨 model 阻塞整个 profile。

  </Accordion>
</AccordionGroup>

Cooldown 使用指数退避：

- 1 分钟
- 5 分钟
- 25 分钟
- 1 小时（上限）

状态存储在 `auth-state.json` 的 `usageStats` 下：

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

账单/信用失败（例如"insufficient credits" / "credit balance too low"）被视为值得 failover，但通常不是暂时的。OpenClaw 不是短暂的 cooldown，而是将 profile 标记为**disabled**（具有更长的退避），并轮换到下一个 profile/provider。

<Note>
不是每个账单形态的响应都是 `402`，也不是每个 HTTP `402` 都在这里。OpenClaw 即使在 provider 返回 `401` 或 `403` 时也将显式账单文本保留在账单通道中，但 provider 特定的匹配器仍范围限于拥有它们的 provider（例如 OpenRouter `403 Key limit exceeded`）。

同时，临时的 `402` 使用窗口和组织/工作区支出限制错误在消息看起来可重试时被分类为 `rate_limit`（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`）。这些保留在短期 cooldown/failover 路径上，而不是长期账单禁用路径上。
</Note>

状态存储在 `auth-state.json` 中：

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

默认值：

- 账单退避从 **5 小时** 开始，每次账单失败加倍，上限为 **24 小时**。
- 如果 profile 在 **24 小时** 内没有失败（可配置），退避计数器重置。
- 过载重试在 model fallback 之前允许 **1 次同 provider profile 轮换**。
- 过载重试默认使用 **0 ms 退避**。

## Model 后备

如果 provider 的所有 profile 都失败，OpenClaw 移动到 `agents.defaults.model.fallbacks` 中的下一个 model。这适用于 auth 失败、速率限制和耗尽 profile 轮换的超时（其他错误不推进 fallback）。

过载和速率限制错误比账单 cooldown 处理得更激进。默认情况下，OpenClaw 允许一次同 provider auth profile 重试，然后切换到下一个配置的 model fallback，无需等待。provider 忙信号（如 `ModelNotReadyException`）属于该过载桶。通过 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 调整。

当运行以 model 覆盖（hooks 或 CLI）开始时，fallback 在尝试任何配置的 fallback 后仍以 `agents.defaults.model.primary` 结束。

### 候选链规则

OpenClaw 从当前请求的 `provider/model` 加上配置的 fallback 构建候选列表。

<AccordionGroup>
  <Accordion title="规则">
    - 请求的 model 始终排第一。
    - 显式配置的 fallback 已去重但不被 model 允许列表过滤——它们被视为明确的操作员意图。
    - 如果当前运行已经在同一 provider 系列的配置 fallback 上，OpenClaw 继续使用完整的配置链。
    - 如果当前运行在与配置不同的 provider 上，且该当前 model 不在配置的 fallback 链中，OpenClaw 不会追加来自另一 provider 的无关配置 fallback。
    - 当运行从覆盖启动时，配置的主 model 被追加到末尾，以便链在早期候选项耗尽后可以回到正常默认值。
  </Accordion>
</AccordionGroup>

### 哪些错误推进 fallback

<Tabs>
  <Tab title="继续的情况">
    - auth 失败
    - 速率限制和 cooldown 耗尽
    - 过载/provider 忙错误
    - 超时形态的 failover 错误
    - 账单禁用
    - `LiveSessionModelSwitchError`，被规范化为 failover 路径，以防止过时的持久化 model 产生外部重试循环
    - 仍有剩余候选项时的其他未识别错误
  </Tab>
  <Tab title="不继续的情况">
    - 非超时/failover 形态的显式中止
    - 应保留在 compaction/重试逻辑内的 context 溢出错误（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model` 或 `ollama error: context length exceeded`）
    - 没有剩余候选项时的最终未知错误
  </Tab>
</Tabs>

### Cooldown 跳过 vs 探测行为

当 provider 的每个 auth profile 都已处于 cooldown 时，OpenClaw 不会自动永远跳过该 provider。它会按候选项做出决策：

<AccordionGroup>
  <Accordion title="按候选项的决策">
    - 持久性 auth 失败立即跳过整个 provider。
    - 账单禁用通常会跳过，但主候选项仍可在节流时进行探测，以便无需重启即可恢复。
    - 主候选项可在 cooldown 临近到期时进行探测，每个 provider 设有探测节流限制。
    - 当失败看起来是临时性的（`rate_limit`、`overloaded` 或未知）时，同 provider 的 fallback 兄弟 model 仍可尝试，即使处于 cooldown。当速率限制是 model 范围的而兄弟 model 可能立即恢复时，这尤为重要。
    - 临时 cooldown 探测每次 fallback 运行中每个 provider 限制一次，以避免单个 provider 阻塞跨 provider fallback。
  </Accordion>
</AccordionGroup>

## Session 覆盖和实时 model 切换

Session model 更改是共享状态。活动 runner、`/model` 命令、compaction/session 更新和实时 Session 协调都读取或写入同一 Session 条目的各个部分。

这意味着 fallback 重试必须与实时 model 切换协调：

- 只有明确的用户驱动 model 更改才标记待处理的实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 系统驱动的 model 更改，如 fallback 轮换、心跳覆盖或 compaction，不会自行标记待处理的实时切换。
- 在 fallback 重试开始之前，回复 runner 将选定的 fallback 覆盖字段持久化到 Session 条目。
- 自动 fallback 覆盖在后续回合中保持选定，因此 OpenClaw 不会在每条消息上探测已知有问题的主 model。`/new`、`/reset` 和 `sessions.reset` 清除自动来源的覆盖并将 Session 返回到配置的默认值。
- `/status` 显示选定的 model，以及当 fallback 状态不同时，活动的 fallback model 和原因。
- 实时 Session 协调优先使用持久化的 Session 覆盖而非过时的运行时 model 字段。
- 如果实时切换错误指向活动 fallback 链中较后的候选项，OpenClaw 直接跳到该选定 model，而不是先走过无关的候选项。
- 如果 fallback 尝试失败，runner 仅回滚它写入的覆盖字段，且仅在它们仍与失败候选项匹配时。

这防止了经典竞争：

<Steps>
  <Step title="主 model 失败">
    选定的主 model 失败。
  </Step>
  <Step title="在内存中选择 Fallback">
    在内存中选择 Fallback 候选项。
  </Step>
  <Step title="Session store 仍显示旧主 model">
    Session store 仍反映旧主 model。
  </Step>
  <Step title="实时协调读取过时状态">
    实时 Session 协调读取过时的 Session 状态。
  </Step>
  <Step title="重试被回滚">
    重试在 fallback 尝试开始之前被回滚到旧 model。
  </Step>
</Steps>

持久化的 fallback 覆盖关闭了这个窗口，而狭义的回滚保持了更新的手动或运行时 Session 更改不变。

## 可观察性和失败摘要

`runWithModelFallback(...)` 记录每次尝试的详情，用于日志和面向用户的 cooldown 消息：

- 尝试的 provider/model
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 等 failover 原因）
- 可选的状态/代码
- 人类可读的错误摘要

当所有候选项都失败时，OpenClaw 抛出 `FallbackSummaryError`。外部回复 runner 可以使用它构建更具体的消息，如"所有 model 暂时受速率限制"，并在已知时包含最早的 cooldown 到期时间。

该 cooldown 摘要是 model 感知的：

- 不相关的 model 范围速率限制对于尝试的 provider/model 链被忽略
- 如果剩余的阻塞是匹配的 model 范围速率限制，OpenClaw 报告仍阻塞该 model 的最后匹配到期时间

## 相关配置

参见 [Gateway configuration](/gateway/configuration) 了解：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

参见 [Models](/concepts/models) 了解更广泛的 model 选择和 fallback 概述。
