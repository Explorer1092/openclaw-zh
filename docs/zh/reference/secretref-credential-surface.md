---
mmh3_hash: "7a93f30db2ab3689646ff69c68a0f6be"
summary: "SecretRef 凭据界面的规范支持与不支持范围"
read_when:
  - 验证 SecretRef 凭据覆盖范围
  - 审查凭据是否符合 `secrets configure` 或 `secrets apply` 的条件
  - 验证凭据为何在支持范围之外
title: "SecretRef 凭据界面"
---

# SecretRef 凭据界面

本页定义了规范的 SecretRef 凭据界面。

范围意图：

- 范围内：严格由用户提供的凭据，OpenClaw 不会生成或轮换。
- 范围外：运行时生成或轮换的凭据、OAuth 刷新材料以及类 Session 的工件。

## 支持的凭据

### `openclaw.json` 目标（`secrets configure` + `secrets apply` + `secrets audit`）

[//]: # "secretref-supported-list-start"

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.elevenlabs.apiKey`
- `messages.tts.openai.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `tools.web.search.apiKey`
- `tools.web.search.gemini.apiKey`
- `tools.web.search.grok.apiKey`
- `tools.web.search.kimi.apiKey`
- `tools.web.search.perplexity.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.elevenlabs.apiKey`
- `channels.discord.voice.tts.openai.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.elevenlabs.apiKey`
- `channels.discord.accounts.*.voice.tts.openai.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` 通过同级 `serviceAccountRef`（兼容性例外）
- `channels.googlechat.accounts.*.serviceAccount` 通过同级 `serviceAccountRef`（兼容性例外）

### `auth-profiles.json` 目标（`secrets configure` + `secrets apply` + `secrets audit`）

- `profiles.*.keyRef`（`type: "api_key"`）
- `profiles.*.tokenRef`（`type: "token"`）

[//]: # "secretref-supported-list-end"

说明：

- Auth Profile 计划目标需要 `agentId`。
- 计划条目以 `profiles.*.key` / `profiles.*.token` 为目标，并写入同级引用（`keyRef` / `tokenRef`）。
- Auth Profile 引用包含在运行时解析和审计覆盖中。
- 对于 SecretRef 管理的模型 Provider，生成的 `agents/*/agent/models.json` 条目为 `apiKey`/header 界面持久化非 secret 标记（不是已解析的 secret 值）。
- 标记持久化是以来源为权威的：OpenClaw 从活跃来源配置快照（解析前）写入标记，而不是从已解析的运行时 secret 值。
- 对于 Web 搜索：
  - 在显式 Provider 模式（已设置 `tools.web.search.provider`）下，仅激活所选 Provider 的键。
  - 在自动模式（未设置 `tools.web.search.provider`）下，仅按优先级解析的第一个 Provider 键处于活跃状态。
  - 在自动模式下，未选择的 Provider 引用在被选中之前视为非活跃状态。
  - 旧版 `tools.web.search.*` Provider 路径在兼容窗口期间仍可解析，但规范 SecretRef 界面为 `plugins.entries.<plugin>.config.webSearch.*`。

## 不支持的凭据

范围外的凭据包括：

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `channels.matrix.accessToken`
- `channels.matrix.accounts.*.accessToken`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `discord.threadBindings.*.webhookToken`
- `whatsapp.creds.json`

[//]: # "secretref-unsupported-list-end"

原因：

- 这些凭据属于生成、轮换、携带 Session 或 OAuth 持久性类别，不适合只读的外部 SecretRef 解析。
