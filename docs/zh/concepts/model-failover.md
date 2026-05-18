---
mmh3_hash: "47a91ae6dbc90afb2ce4a49274a26568"
title: "Model failover"
sidebarTitle: "Model failover"
summary: "OpenClaw 如何轮换 auth profiles 并跨 model 进行故障转移"
read_when:
  - 诊断 auth profile 轮换、冷却或 model 故障转移行为
  - 更新 auth profiles 或 model 的故障转移规则
  - 了解 Session model 覆盖与故障转移重试的交互方式
---

OpenClaw 分两个阶段处理故障：

1. 在当前 provider 内进行 **auth profile 轮换**。
2. **Model 故障转移**至 `agents.defaults.model.fallbacks` 中的下一个 model。

本文档解释运行时规则及其支撑数据。

## 运行时流程

对于普通文本运行，OpenClaw 按以下顺序评估候选项：

<Steps>
  <Step title="解析 Session 状态">
    解析活跃 Session 的 model 和 auth profile 偏好。
  </Step>
  <Step title="构建候选链">
    从当前 model 选择和该选择来源的故障转移策略构建 model 候选链。已配置的默认值、cron job 主 model 和自动选择的故障转移 model 可使用已配置的故障转移；明确的用户 Session 选择是严格的。
  </Step>
  <Step title="尝试当前 provider">
    使用 auth profile 轮换/冷却规则尝试当前 provider。
  </Step>
  <Step title="在可故障转移的错误时推进">
    如果该 provider 因可故障转移的错误而耗尽，则移至下一个 model 候选。
  </Step>
  <Step title="在重试前持久化故障转移覆盖">
    在重试开始前持久化所选的故障转移覆盖，以便其他 Session 读取器能看到运行器即将使用的 provider/model。持久化的 model 覆盖被标记为 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="失败时窄范围回滚">
    如果故障转移候选失败，仅在这些字段仍匹配该失败候选时回滚故障转移拥有的 Session 覆盖字段。
  </Step>
  <Step title="耗尽时抛出 FallbackSummaryError">
    如果每个候选都失败，抛出带有每次尝试详情的 `FallbackSummaryError`，以及已知的最快冷却到期时间。
  </Step>
</Steps>

这比"保存并恢复整个 Session"更窄。回复运行器仅持久化它为故障转移拥有的 model 选择字段：

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这防止失败的故障转移重试覆盖更新的无关 Session 变更，例如在尝试运行时发生的手动 `/model` 更改或 Session 轮换更新。

## 选择来源策略

OpenClaw 将已选的 provider/model 与选择原因分开。该来源控制是否允许故障转移链：

- **已配置默认值**：`agents.defaults.model.primary` 使用 `agents.defaults.model.fallbacks`。
- **Agent 主 model**：`agents.list[].model` 是严格的，除非该 agent model 对象包含自己的 `fallbacks`。使用 `fallbacks: []` 使严格行为明确，或提供非空列表以将该 agent 选择加入 model 故障转移。
- **自动故障转移覆盖**：运行时故障转移写入 `providerOverride`、`modelOverride`、`modelOverrideSource: "auto"` 和所选源 model，然后重试。该自动覆盖可继续沿已配置的故障转移链走，无需在每条消息上探测主 model，但 OpenClaw 会定期再次探测已配置的源，并在恢复时清除自动覆盖。`/new`、`/reset` 和 `sessions.reset` 也会清除自动来源的覆盖。没有明确 `heartbeat.model` 的心跳运行，当其源不再匹配当前已配置默认值时，也会清除直接自动覆盖。
- **用户 Session 覆盖**：`/model`、model 选择器、`session_status(model=...)` 和 `sessions.patch` 写入 `modelOverrideSource: "user"`。这是一个精确的 Session 选择。如果所选 provider/model 在产生回复之前失败，OpenClaw 报告失败，而不是从无关的已配置故障转移中回答。
- **传统 Session 覆盖**：较旧的 Session 条目可能有 `modelOverride` 但没有 `modelOverrideSource`。OpenClaw 将这些视为用户覆盖，以避免明确的旧选择被静默转换为故障转移行为。
- **Cron payload model**：cron job 的 `payload.model` / `--model` 是 job 主 model，而不是用户 Session 覆盖。它使用已配置的故障转移，除非 job 提供 `payload.fallbacks`；`payload.fallbacks: []` 使 cron 运行变为严格。

自动故障转移主 model 探测间隔为 5 分钟，不可配置。OpenClaw 会记住每个 Session 和主 model 的最近探测记录，以避免在每轮消息中都重试已知失败的主 model。当 Session 转移到故障转移 model 时，OpenClaw 发送一次可见通知；当恢复到所选主 model 时，再发送一次通知；在保持故障转移的每轮消息中不重复该通知。

## 用户可见的故障转移通知

当 Session 转移到自动选择的故障转移 model 时，OpenClaw 在同一回复界面发送状态通知：

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

当后续探测成功并且 Session 恢复到所选主 model 时，OpenClaw 发送：

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

这些通知是运维消息，而非 assistant 内容。它们在每次状态变化时投递一次，包括可行时的仅产生副作用的轮次，但保持故障转移的轮次不会重复投递。投递会绕过正常的来源回复抑制，通知不会占用线程 channel 的第一个 assistant 回复槽，并且排除在文字转语音和承诺提取之外。

## Auth 存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth token 都使用 **auth profiles**。

- 密钥存储在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（传统：`~/.openclaw/agent/auth-profiles.json`）。
- 运行时 auth 路由状态存储在 `~/.openclaw/agents/<agentId>/agent/auth-state.json`。
- 配置 `auth.profiles` / `auth.order` 仅用于**元数据 + 路由**（不含密钥）。
- 传统仅导入 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时导入 `auth-profiles.json`）。

更多详情见 [OAuth](/concepts/oauth)

凭据类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些 provider 还有 `projectId`/`enterpriseUrl`）

## Profile ID

OAuth 登录创建不同的 profile，以便多个账户共存。

- 默认：无 email 可用时为 `provider:default`。
- 带 email 的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

Profile 存储在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当一个 provider 有多个 profile 时，OpenClaw 按以下方式选择顺序：

<Steps>
  <Step title="明确配置">
    `auth.order[provider]`（如已设置）。
  </Step>
  <Step title="已配置 profile">
    按 provider 过滤的 `auth.profiles`。
  </Step>
  <Step title="已存储 profile">
    `auth-profiles.json` 中该 provider 的条目。
  </Step>
</Steps>

如果未配置明确顺序，OpenClaw 使用轮询顺序：

- **主键**：profile 类型（**OAuth 优先于 API 密钥**）。
- **次键**：`usageStats.lastUsed`（每种类型内最旧优先）。
- **冷却/禁用 profile** 移至末尾，按最快到期时间排序。

### Session 粘性（缓存友好）

OpenClaw **每个 Session 固定选择的 auth profile** 以保持 provider 缓存热度。它**不会**在每次请求时轮换。固定的 profile 将被重用，直到：

- Session 被重置（`/new` / `/reset`）
- 压缩完成（压缩计数增加）
- profile 处于冷却/禁用状态

通过 `/model …@<profileId>` 手动选择会为该 Session 设置**用户覆盖**，直到新 Session 开始前不会自动轮换。

<Note>
自动固定的 profile（由 Session 路由器选择）被视为**偏好**：优先尝试，但 OpenClaw 可能在速率限制/超时时轮换到另一个 profile。用户固定的 profile 锁定到该 profile；如果失败且配置了 model 故障转移，OpenClaw 会移至下一个 model，而不是切换 profile。
</Note>

### OpenAI Codex 订阅加 API 密钥备份

对于 OpenAI agent model，auth 和 runtime 是分离的。`openai/gpt-*` 保持在 Codex harness 上，而 auth 可以在 Codex 订阅 profile 和 OpenAI API 密钥备份之间轮换。

使用 `auth.order.openai` 设置面向用户的顺序：

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

现有 Codex 订阅 profile 可能仍使用旧版 `openai-codex:*` profile id。有序的 API 密钥备份可以是普通的 `openai:*` API 密钥 profile。当订阅达到 Codex 使用限制时，OpenClaw 记录 Codex 提供的精确重置时间（如有），尝试下一个有序 auth profile，并保持运行在 Codex harness 内。一旦重置时间过去，订阅 profile 即可再次使用，下一次自动选择可以返回到它。

仅当需要为该 Session 强制使用某个账户/密钥时，才使用用户固定 profile。用户固定 profile 是严格的，不会静默跳转到另一个 profile。

## 冷却

当 profile 因 auth/速率限制错误（或看起来像速率限制的超时）失败时，OpenClaw 将其标记为冷却并移至下一个 profile。

<AccordionGroup>
  <Accordion title="进入速率限制/超时桶的情况">
    该速率限制桶比普通 `429` 更宽：还包括 provider 消息，如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及周期性使用窗口限制如 `weekly/monthly limit reached`。

    格式/无效请求错误通常是终止性的，因为重试相同载荷会以相同方式失败，所以 OpenClaw 暴露它们而不是轮换 auth profile。已知的重试修复路径可以明确选择加入：例如 Cloud Code Assist 工具调用 ID 验证失败通过 `allowFormatRetry` 策略被净化并重试一次。OpenAI 兼容的停止原因错误，如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，被分类为超时/故障转移信号。

    当来源匹配已知瞬态模式时，通用服务器文本也可以进入该超时桶。例如，裸 pi-ai 流封装消息 `An unknown error occurred` 对每个 provider 都被视为可故障转移，因为 pi-ai 在 provider 流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束但没有特定详情时发出该消息。带有瞬态服务器文本（如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`）的 JSON `api_error` 载荷也被视为可故障转移的超时。

    OpenRouter 特定的通用上游文本，如裸 `Provider returned error`，仅当 provider 上下文实际上是 OpenRouter 时才被视为超时。通用内部回退文本如 `LLM request failed with an unknown error.` 保持保守，不会自行触发故障转移。

  </Accordion>
  <Accordion title="SDK 重试等待上限">
    某些 provider SDK 可能会在将控制权返回给 OpenClaw 之前休眠较长的 `Retry-After` 窗口。对于基于 Stainless 的 SDK（如 Anthropic 和 OpenAI），OpenClaw 默认将 SDK 内部 `retry-after-ms` / `retry-after` 等待上限设为 60 秒，并立即暴露更长的可重试响应，以便此故障转移路径可以运行。通过 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用上限；见 [重试行为](/concepts/retry)。
  </Accordion>
  <Accordion title="Model 范围的冷却">
    速率限制冷却也可以是 model 范围的：

    - 当失败的 model id 已知时，OpenClaw 为速率限制失败记录 `cooldownModel`。
    - 同一 provider 上的兄弟 model 在冷却范围为不同 model 时仍可被尝试。
    - 账单/禁用窗口仍然在跨 model 范围内阻塞整个 profile。

  </Accordion>
</AccordionGroup>

冷却使用指数退避：

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

账单/信用失败（例如"credits 不足"/"credit 余额过低"）被视为可故障转移，但通常不是瞬态的。OpenClaw 将 profile 标记为**禁用**（使用更长的退避），而不是短暂冷却，并轮换至下一个 profile/provider。

<Note>
并非每个账单形状的响应都是 `402`，也并非每个 HTTP `402` 都落在这里。OpenClaw 即使 provider 返回 `401` 或 `403`，也将明确的账单文本保留在账单通道，但 provider 特定匹配器的范围仍限于拥有它们的 provider（例如 OpenRouter `403 Key limit exceeded`）。

同时，临时的 `402` 使用窗口和组织/工作区支出限制错误，当消息看起来可重试时（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`），被分类为 `rate_limit`。这些保持在短冷却/故障转移路径，而不是长账单禁用路径。
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

- 账单退避从 **5 小时**开始，每次账单失败翻倍，上限为 **24 小时**。
- 退避计数器在 profile 24 小时未失败后重置（可配置）。
- 过载重试在 model 故障转移前允许 **1 次同 provider profile 轮换**。
- 过载重试默认使用 **0 ms 退避**。

## Model 故障转移

如果一个 provider 的所有 profile 都失败，OpenClaw 移至 `agents.defaults.model.fallbacks` 中的下一个 model。这适用于耗尽了 profile 轮换的 auth 失败、速率限制和超时（其他错误不推进故障转移）。未暴露足够详情的 provider 错误在故障转移状态中仍被精确标记：`empty_response` 表示 provider 未返回可用消息或状态，`no_error_details` 表示 provider 明确返回 `Unknown error (no error details in response)`，`unclassified` 表示 OpenClaw 保留了原始预览但尚未有分类器匹配。

过载和速率限制错误比账单冷却处理更积极。默认情况下，OpenClaw 允许一次同 provider 的 auth profile 重试，然后在不等待的情况下切换到下一个已配置的 model 故障转移。`ModelNotReadyException` 等 provider 繁忙信号落入该过载桶。通过 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 调整。

当运行从已配置的默认主 model、cron job 主 model、带明确故障转移的 agent 主 model 或自动选择的故障转移覆盖开始时，OpenClaw 可以沿匹配的已配置故障转移链走。不带明确故障转移的 agent 主 model 和明确的用户选择（例如 `/model ollama/qwen3.5:27b`、model 选择器、`sessions.patch` 或一次性 CLI provider/model 覆盖）是严格的：如果该 provider/model 不可达或在产生回复之前失败，OpenClaw 报告失败，而不是从无关的故障转移中回答。

### 候选链规则

OpenClaw 从当前请求的 `provider/model` 加上已配置的故障转移构建候选列表。

<AccordionGroup>
  <Accordion title="规则">
    - 请求的 model 始终排第一。
    - 明确配置的故障转移被去重但不被 model 允许列表过滤。它们被视为明确的运营者意图。
    - 如果当前运行已在同 provider 系列的已配置故障转移上，OpenClaw 继续使用完整的已配置链。
    - 当未提供明确的故障转移覆盖时，即使请求的 model 使用不同的 provider，已配置的故障转移也在已配置的主 model 之前被尝试。
    - 当故障转移运行器未提供明确的故障转移覆盖时，已配置的主 model 被追加到末尾，以便链在早期候选耗尽后能回落到正常默认值。
    - 当调用者提供 `fallbacksOverride` 时，运行器使用恰好是请求的 model 加上该覆盖列表。空列表禁用 model 故障转移，并防止已配置的主 model 被追加为隐藏的重试目标。

  </Accordion>
</AccordionGroup>

### 哪些错误推进故障转移

<Tabs>
  <Tab title="继续于">
    - auth 失败
    - 速率限制和冷却耗尽
    - 过载/provider 繁忙错误
    - 超时形状的故障转移错误
    - 账单禁用
    - `LiveSessionModelSwitchError`，被规范化为故障转移路径，以避免过时的持久化 model 创建外部重试循环
    - 当仍有剩余候选时，其他未识别的错误

  </Tab>
  <Tab title="不继续于">
    - 不是超时/故障转移形状的明确中止
    - 应在压缩/重试逻辑内处理的上下文溢出错误（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model` 或 `ollama error: context length exceeded`）
    - 没有剩余候选时的最终未知错误

  </Tab>
</Tabs>

### 冷却跳过与探测行为

当某个 provider 的所有 auth profile 都已在冷却时，OpenClaw 不会自动永远跳过该 provider。它做出每候选决定：

<AccordionGroup>
  <Accordion title="每候选决定">
    - 持久 auth 失败立即跳过整个 provider。
    - 账单禁用通常跳过，但主候选仍可在节流时被探测，以便无需重启即可恢复。
    - 主候选可能在冷却临近到期时被探测，使用每 provider 节流。
    - 同 provider 的故障转移兄弟，当失败看起来是瞬态（`rate_limit`、`overloaded` 或未知）时，可以尽管处于冷却中也被尝试。这在速率限制是 model 范围的且兄弟 model 可能立即恢复时尤其相关。
    - 瞬态冷却探测每 provider 每次故障转移运行限制一次，以避免单个 provider 阻碍跨 provider 故障转移。

  </Accordion>
</AccordionGroup>

## Session 覆盖和实时 model 切换

Session model 更改是共享状态。活跃运行器、`/model` 命令、压缩/Session 更新和实时 Session 对账都读取或写入同一 Session 条目的部分内容。

这意味着故障转移重试必须与实时 model 切换协调：

- 只有明确的用户驱动 model 更改才会标记待处理的实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 系统驱动的 model 更改，如故障转移轮换、心跳覆盖或压缩，不会自行标记待处理的实时切换。
- 用户驱动的 model 覆盖被视为故障转移策略的精确选择，因此不可达的选定 provider 表面为失败，而不是被 `agents.defaults.model.fallbacks` 掩盖。
- 在故障转移重试开始前，回复运行器将选定的故障转移覆盖字段持久化到 Session 条目。
- 自动故障转移覆盖在后续轮次中保持选中，以便 OpenClaw 不会在每条消息上探测已知不良的主 model。OpenClaw 会定期再次探测已配置的源，并在恢复时清除自动覆盖；`/new`、`/reset` 和 `sessions.reset` 立即清除自动来源的覆盖。
- 用户回复在每次状态变化时公告一次故障转移过渡和故障转移恢复。保持故障转移的轮次不重复该通知。
- `/status` 显示选定的 model，以及当故障转移状态不同时，活跃的故障转移 model 和原因。
- 实时 Session 对账优先于过时运行时 model 字段的持久化 Session 覆盖。
- 如果实时切换错误指向活跃故障转移链中的后续候选，OpenClaw 直接跳转到该选定 model，而不是先走无关的候选。
- 如果故障转移尝试失败，运行器仅回滚它写入的覆盖字段，且仅当它们仍匹配该失败候选时。

这防止了经典竞争条件：

<Steps>
  <Step title="主 model 失败">
    所选主 model 失败。
  </Step>
  <Step title="内存中选择故障转移">
    在内存中选择故障转移候选。
  </Step>
  <Step title="Session 存储仍显示旧主 model">
    Session 存储仍反映旧主 model。
  </Step>
  <Step title="实时对账读取过时状态">
    实时 Session 对账读取过时的 Session 状态。
  </Step>
  <Step title="重试被推回">
    重试在故障转移尝试开始前被推回到旧 model。
  </Step>
</Steps>

持久化的故障转移覆盖关闭了这个窗口，而窄范围回滚保持了更新的手动或运行时 Session 更改完整。

## 可观测性和失败摘要

`runWithModelFallback(...)` 记录每次尝试的详情，用于日志和面向用户的冷却消息：

- 尝试的 provider/model
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 和类似的故障转移原因）
- 可选的状态/代码
- 人类可读的错误摘要

结构化的 `model_fallback_decision` 日志在候选失败、被跳过或后续故障转移成功时也包含扁平的 `fallbackStep*` 字段。这些字段使尝试的转换明确（`fallbackStepFromModel`、`fallbackStepToModel`、`fallbackStepFromFailureReason`、`fallbackStepFromFailureDetail`、`fallbackStepFinalOutcome`），以便日志和诊断导出器可以重建主要失败，即使终止故障转移也失败时。

当每个候选都失败时，OpenClaw 抛出 `FallbackSummaryError`。外部回复运行器可以使用它来构建更具体的消息，如"所有 model 暂时受到速率限制"，并在已知时包含最快的冷却到期时间。

该冷却摘要感知 model：

- 不相关的 model 范围速率限制对尝试的 provider/model 链被忽略
- 如果剩余的阻塞是匹配的 model 范围速率限制，OpenClaw 报告仍然阻塞该 model 的最后匹配到期时间

## 相关配置

见 [Gateway 配置](/gateway/configuration)：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

见 [Models](/concepts/models) 了解更广泛的 model 选择和故障转移概述。
