---
mmh3_hash: "60872ceebee61b6b86a999e52ab18b14"
summary: "SecretRef 凭据界面的规范支持与不支持范围"
read_when:
  - 验证 SecretRef 凭据覆盖范围
  - 审查凭据是否符合 `secrets configure` 或 `secrets apply` 的条件
  - 验证凭据为何在支持范围之外
title: "SecretRef 凭据界面"
---

本页定义了规范的 SecretRef 凭据界面。

范围意图：

- 范围内：严格由用户提供的凭据，OpenClaw 不会生成或轮换。
- 范围外：运行时生成或轮换的凭据、OAuth 刷新材料以及类 Session 的工件。

## 支持的凭据

### `openclaw.json` 目标（`secrets configure` + `secrets apply` + `secrets audit`）

[//]: # "secretref-supported-list-start"

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `models.providers.*.request.auth.token`
- `models.providers.*.request.auth.value`
- `models.providers.*.request.headers.*`
- `models.providers.*.request.proxy.tls.ca`
- `models.providers.*.request.proxy.tls.cert`
- `models.providers.*.request.proxy.tls.key`
- `models.providers.*.request.proxy.tls.passphrase`
- `models.providers.*.request.tls.ca`
- `models.providers.*.request.tls.cert`
- `models.providers.*.request.tls.key`
- `models.providers.*.request.tls.passphrase`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].tts.providers.*.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.acpx.config.mcpServers.*.env.*`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `plugins.entries.voice-call.config.realtime.providers.*.apiKey`
- `plugins.entries.voice-call.config.streaming.providers.*.apiKey`
- `plugins.entries.voice-call.config.tts.providers.*.apiKey`
- `plugins.entries.voice-call.config.twilio.authToken`
- `tools.web.search.apiKey`
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
- `channels.discord.voice.tts.providers.*.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.providers.*.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.qqbot.clientSecret`
- `channels.qqbot.accounts.*.clientSecret`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.accessToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.accessToken`
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

- `profiles.*.keyRef`（`type: "api_key"`；当 `auth.profiles.<id>.mode = "oauth"` 时不支持）
- `profiles.*.tokenRef`（`type: "token"`；当 `auth.profiles.<id>.mode = "oauth"` 时不支持）

[//]: # "secretref-supported-list-end"

注意事项：

- 身份验证配置文件计划目标需要 `agentId`。
- 计划条目以 `profiles.*.key` / `profiles.*.token` 为目标，并写入同级 ref（`keyRef` / `tokenRef`）。
- 身份验证配置文件 ref 包含在运行时解析和审计覆盖中。
- 在 `openclaw.json` 中，SecretRef 必须使用结构化对象，例如 `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`。遗留的 `secretref-env:<ENV_VAR>` 标记字符串在 SecretRef 凭据路径上被拒绝；运行 `openclaw doctor --fix` 以迁移有效的标记。
- OAuth 策略守卫：`auth.profiles.<id>.mode = "oauth"` 不能与该配置文件的 SecretRef 输入结合使用。当违反此策略时，启动/重新加载和身份验证配置文件解析会快速失败。
- 对于 SecretRef 管理的模型 Provider，生成的 `agents/*/agent/models.json` 条目为 `apiKey`/头部界面持久化非密钥标记（而非解析的密钥值）。
- 标记持久化以源为权威：OpenClaw 从活动源配置快照（预解析）写入标记，而非从解析的运行时密钥值写入。
- 对于网络搜索：
  - 在显式 Provider 模式（设置了 `tools.web.search.provider`）中，仅活动 Provider 密钥有效。
  - 在自动模式（未设置 `tools.web.search.provider`）中，仅按优先级解析的第一个 Provider 密钥有效。
  - 在自动模式中，未选择的 Provider ref 被视为非活动，直到被选择。
  - 旧版 `tools.web.search.*` Provider 路径在兼容窗口期间仍会解析，但规范的 SecretRef 界面是 `plugins.entries.<plugin>.config.webSearch.*`。

## 不支持的凭据

超出范围的凭据包括：

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `channels.discord.threadBindings.webhookToken`
- `channels.discord.accounts.*.threadBindings.webhookToken`
- `channels.whatsapp.creds.json`
- `channels.whatsapp.accounts.*.creds.json`

[//]: # "secretref-unsupported-list-end"

原因：

- 这些凭据是生成的、轮换的、承载 Session 的或 OAuth 持久类，不适合只读外部 SecretRef 解析。

## 相关

- [Secrets 管理](/gateway/secrets)
- [Auth 凭据语义](/auth-credential-semantics)
