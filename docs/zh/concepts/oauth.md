---
mmh3_hash: "0fcf56078c2f5b7109e7da1b18e7e385"
summary: "OpenClaw 中的 OAuth: token 交换、存储和多账户模式"
read_when:
  - 需要了解 OpenClaw OAuth 端到端流程
  - 遇到 token 失效 / 登出问题
  - 需要使用 Claude CLI 或 OAuth 认证流程
  - 需要多账户或 profile 路由
title: "OAuth"
---

OpenClaw 通过 OAuth 支持"订阅认证"，适用于提供此功能的 provider（特别是 **OpenAI Codex（ChatGPT OAuth）**）。对于 Anthropic，目前的实际分工是：

- **Anthropic API 密钥**：正常的 Anthropic API 计费
- **Anthropic Claude CLI / OpenClaw 内的订阅认证**：Anthropic 员工告诉我们这种用法再次被允许

OpenAI Codex OAuth 明确支持在 OpenClaw 等外部工具中使用。本页解释：

对于生产环境中的 Anthropic，API 密钥认证是更安全的推荐路径。

- OAuth **token 交换**的工作原理（PKCE）
- token 的**存储位置**（及原因）
- 如何处理**多个账户**（profiles + per-session 覆盖）

OpenClaw 还支持自带 OAuth 或 API 密钥流程的 **provider 插件**。通过以下命令运行：

```bash
openclaw models auth login --provider <id>
```

## Token 汇聚（为何存在）

OAuth provider 通常在登录/刷新流程中生成**新的 refresh token**。某些 provider（或 OAuth 客户端）在为同一用户/应用签发新 token 时，可能使旧的 refresh token 失效。

实际症状：

- 你同时通过 OpenClaw 和 Claude Code / Codex CLI 登录 → 其中一个之后随机"被登出"

为减少这种情况，OpenClaw 将 `auth-profiles.json` 视为 **token 汇聚**：

- 运行时从**一个地方**读取凭据
- 可以保存多个 profile 并确定性地路由它们
- 外部 CLI 复用因 provider 而异：Codex CLI 可以引导一个空的 `openai-codex:default` profile，但一旦 OpenClaw 有了本地 OAuth profile，本地 refresh token 就是权威的。如果本地 Codex refresh 失败且 Codex CLI 有同一账户的可用 token，OpenClaw 可能将该 token 用于当前运行时请求而不写回 `auth-profiles.json`；其他集成可以保持外部管理并重新读取它们的 CLI auth 存储
- 已知已配置 provider 集的状态和启动路径会将外部 CLI 发现的范围限定到该集合，因此对于单 provider 设置，不会探测无关的 CLI 登录存储

## 存储（token 在哪里）

密钥存储在 agent auth 存储中：

- Auth profiles（OAuth + API 密钥 + 可选的值级引用）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 传统兼容文件：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （静态 `api_key` 条目在发现时会被清除）

传统仅导入文件（仍受支持，但不是主要存储）：

- `~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）

以上所有文件也遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration](/gateway/configuration-reference#auth-storage)

有关静态密钥引用和运行时快照激活行为，参见 [Secrets Management](/gateway/secrets)。

当次级 agent 没有本地 auth profile 时，OpenClaw 使用从默认/主 agent 存储的读透继承。它不会在读取时克隆主 agent 的 `auth-profiles.json`。OAuth refresh token 尤其敏感：默认情况下，普通复制流会跳过它们，因为某些 provider 在使用后会轮换或使 refresh token 失效。当 agent 需要独立账户时，为其配置单独的 OAuth 登录。

## Anthropic 传统 token 兼容性

<Warning>
Anthropic 的公开 Claude Code 文档表示直接使用 Claude Code 在 Claude 订阅限制内，Anthropic 员工告诉我们 OpenClaw 风格的 Claude CLI 用法再次被允许。因此，OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为此集成的批准用法，除非 Anthropic 发布新政策。

有关 Anthropic 当前直接 Claude Code 计划文档，参见 [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan) 和 [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果需要 OpenClaw 中其他订阅式选项，参见 [OpenAI Codex](/providers/openai)、[Qwen Cloud Coding Plan](/providers/qwen)、[MiniMax Coding Plan](/providers/minimax) 和 [Z.AI / GLM Coding Plan](/providers/glm)。
</Warning>

OpenClaw 也将 Anthropic setup-token 作为受支持的 token 认证路径，但现在在可用时优先使用 Claude CLI 复用和 `claude -p`。

## Anthropic Claude CLI 迁移

OpenClaw 再次支持 Anthropic Claude CLI 复用。如果主机上已有本地 Claude 登录，引导/配置流程可以直接复用它。

## OAuth 交换（登录如何工作）

OpenClaw 的交互式登录流程在 `@earendil-works/pi-ai` 中实现，并接入向导/命令。

### Anthropic setup-token

流程形状：

1. 从 OpenClaw 启动 Anthropic setup-token 或 paste-token
2. OpenClaw 将生成的 Anthropic 凭据存储在 auth profile 中
3. model 选择保持在 `anthropic/...`
4. 现有 Anthropic auth profiles 仍可用于回滚/顺序控制

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 明确支持在 Codex CLI 之外使用，包括 OpenClaw 工作流。

流程形状（PKCE）：

1. 生成 PKCE verifier/challenge + 随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`
3. 尝试在 `http://127.0.0.1:1455/auth/callback` 捕获回调
4. 如果回调无法绑定（或处于远程/无头环境），粘贴重定向 URL/code
5. 在 `https://auth.openai.com/oauth/token` 交换
6. 从 access token 提取 `accountId` 并存储 `{ access, refresh, expires, accountId }`

向导路径：`openclaw onboard` → 选择 auth `openai-codex`。

## 刷新 + 过期

Profiles 存储 `expires` 时间戳。

运行时：

- 如果 `expires` 在未来 → 使用存储的 access token
- 如果已过期 → 刷新（在文件锁下）并覆盖存储的凭据
- 如果次级 agent 读取继承的主 agent OAuth profile，刷新会写回主 agent 存储，而不是将 refresh token 复制到次级 agent 存储中
- 例外：某些外部 CLI 凭据保持外部管理；OpenClaw 重新读取那些 CLI auth 存储，而不是消耗复制的 refresh token。Codex CLI 引导有意更窄：它会创建一个空的 `openai-codex:default` profile，然后 OpenClaw 拥有的刷新操作保持本地 profile 为权威的。如果本地 Codex refresh 失败且 Codex CLI 有同一账户的可用 token，OpenClaw 可能将该 token 用于当前运行时请求而不写回 `auth-profiles.json`。

刷新流程是自动的；通常不需要手动管理 token。

## 多账户（profiles）+ 路由

两种模式：

### 1) 推荐：独立 agents

如果希望"个人"和"工作"永不交互，使用隔离的 agents（独立 sessions + 凭据 + workspace）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后 per-agent 配置认证（向导）并将聊天路由到正确的 agent。

### 2) 高级：单个 agent 中的多个 profiles

`auth-profiles.json` 支持同一 provider 的多个 profile ID。

选择使用哪个 profile：

- 全局通过配置排序（`auth.order`）
- per-session 通过 `/model ...@<profileId>`

示例（session 覆盖）：

- `/model Opus@anthropic:work`

如何查看存在哪些 profile ID：

- `openclaw channels list --json`（显示 `auth[]`）

相关文档：

- [Model failover](/concepts/model-failover)（轮换 + 冷却规则）
- [Slash commands](/tools/slash-commands)（命令界面）

## 相关

- [Authentication](/gateway/authentication) - model provider 认证概述
- [Secrets](/gateway/secrets) - 凭据存储和 SecretRef
- [Configuration Reference](/gateway/configuration-reference#auth-storage) - auth 配置键
