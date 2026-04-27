---
title: "OAuth"
mmh3_hash: "b1fdcca0d137e458df9105cccb80e51f"
summary: "OpenClaw 中的 OAuth: token 交换、存储和多账户模式"
read_when:
  - 你想端到端了解 OpenClaw OAuth
  - 你遇到 token 失效 / 登出问题
  - 你想要 Claude CLI 或 OAuth auth 流程
  - 你想要多个账户或 profile 路由
---

OpenClaw 通过 OAuth 支持提供 provider "subscription auth"（特别是 **OpenAI Codex（ChatGPT OAuth）**）。对于 Anthropic，实际分工现在是：

- **Anthropic API key**：正常的 Anthropic API 计费
- **OpenClaw 内的 Anthropic Claude CLI / subscription auth**：Anthropic 工作人员告诉我们此用法再次被允许

OpenAI Codex OAuth 明确支持在 OpenClaw 等外部工具中使用。本页面解释：

对于 Anthropic 的生产使用，API key 认证是更安全的推荐路径。

- OAuth **token 交换** 如何工作（PKCE）
- tokens **存储** 在哪里（以及为什么）
- 如何处理 **多个账户**（profiles + 每个 Session 的覆盖）

OpenClaw 还支持附带自己的 OAuth 或 API‑key 流程的 **provider plugins**。通过以下方式运行它们：

```bash
openclaw models auth login --provider <id>
```

## Token sink（为什么存在）

OAuth providers 通常在登录/刷新流程期间铸造 **新的 refresh token**。某些 providers（或 OAuth 客户端）在为同一用户/应用发出新 token 时可能会使较旧的 refresh tokens 无效。

实际症状：

- 你通过 OpenClaw *和* Claude Code / Codex CLI 登录 → 其中一个稍后随机"登出"

为了减少这种情况，OpenClaw 将 `auth-profiles.json` 视为 **token sink**：

- runtime 从 **一个地方** 读取凭据
- 我们可以保留多个 profiles 并确定性地路由它们
- 外部 CLI 重用是 provider 特定的：Codex CLI 可以引导一个空的 `openai-codex:default` profile，但一旦 OpenClaw 有了本地 OAuth profile，本地 refresh token 就是规范的；其他集成可以保持外部管理并重新读取其 CLI auth store

## 存储（tokens 位于何处）

Secrets 按 **agent** 存储：

- Auth profiles（OAuth + API keys + 可选的值级别引用）: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 传统兼容性文件: `~/.openclaw/agents/<agentId>/agent/auth.json`
  （发现时静态 `api_key` 条目会被清除）

传统的仅导入文件（仍受支持，但不是主 store）：

- `~/.openclaw/credentials/oauth.json`（首次使用时导入 `auth-profiles.json`）

以上所有内容也尊重 `$OPENCLAW_STATE_DIR`（state dir 覆盖）。完整参考：[/gateway/configuration](/gateway/configuration-reference#auth-storage)

有关静态 secret 引用和 runtime 快照激活行为，请参见 [Secrets Management](/gateway/secrets)。

## Anthropic 旧版 token 兼容性

<Warning>
Anthropic 的公共 Claude Code 文档说直接 Claude Code 使用保持在 Claude 订阅限制内，Anthropic 工作人员告诉我们 OpenClaw 风格的 Claude CLI 使用再次被允许。因此，OpenClaw 将 Claude CLI 重用和 `claude -p` 使用视为此集成的授权，除非 Anthropic 发布新政策。

有关 Anthropic 当前直接 Claude Code 计划文档，参见 [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
和 [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你想要 OpenClaw 中其他订阅式选项，参见 [OpenAI
Codex](/providers/openai)、[Qwen Cloud Coding
Plan](/providers/qwen)、[MiniMax Coding Plan](/providers/minimax)
和 [Z.AI / GLM Coding Plan](/providers/glm)。
</Warning>

OpenClaw 还公开 Anthropic setup-token 作为受支持的 token-auth 路径，但现在在可用时优先使用 Claude CLI 重用和 `claude -p`。

## Anthropic Claude CLI 迁移

OpenClaw 再次支持 Anthropic Claude CLI 重用。如果主机上已有本地 Claude 登录，onboarding/configure 可以直接重用它。

## OAuth 交换（登录如何工作）

OpenClaw 的交互式登录流程在 `@mariozechner/pi-ai` 中实现，并连接到向导/命令。

### Anthropic setup-token

流程形状：

1. 从 OpenClaw 启动 Anthropic setup-token 或 paste-token
2. OpenClaw 将结果 Anthropic 凭据存储在 auth profile 中
3. model 选择保持在 `anthropic/...`
4. 现有 Anthropic auth profiles 保持可用于回滚/顺序控制

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 明确支持在 Codex CLI 之外使用，包括 OpenClaw 工作流。

流程形状（PKCE）：

1. 生成 PKCE verifier/challenge + 随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`
3. 尝试在 `http://127.0.0.1:1455/auth/callback` 上捕获回调
4. 如果回调无法绑定（或你是远程/headless），粘贴重定向 URL/code
5. 在 `https://auth.openai.com/oauth/token` 交换
6. 从 access token 中提取 `accountId` 并存储 `{ access, refresh, expires, accountId }`

向导路径是 `openclaw onboard` → auth 选择 `openai-codex`。

## 刷新 + 过期

Profiles 存储 `expires` 时间戳。

在 runtime：

- 如果 `expires` 在未来 → 使用存储的 access token
- 如果过期 → 刷新（在文件锁下）并覆盖存储的凭据
- 例外：某些外部 CLI 凭据保持外部管理；OpenClaw 重新读取这些 CLI auth store，而不是消耗复制的 refresh tokens。Codex CLI bootstrap 有意更窄：它为空的 `openai-codex:default` profile 播种，然后 OpenClaw 拥有的刷新保持本地 profile 为规范

刷新流程是自动的；你通常不需要手动管理 tokens。

## 多个账户（profiles） + 路由

两种模式：

### 1) 首选：单独的 agents

如果你希望"个人"和"工作"永远不交互，使用隔离的 agents（单独的 sessions + 凭据 + workspace）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后为每个 agent 配置 auth（向导）并将聊天路由到正确的 agent。

### 2) 高级：一个 agent 中的多个 profiles

`auth-profiles.json` 支持同一 provider 的多个 profile IDs。

选择使用哪个 profile：

- 通过配置排序全局（`auth.order`）
- 通过 `/model ...@<profileId>` 按 Session

示例（Session 覆盖）：

- `/model Opus@anthropic:work`

如何查看存在哪些 profile IDs：

- `openclaw channels list --json`（显示 `auth[]`）

相关文档：

- [Model failover](/concepts/model-failover)（轮换 + cooldown 规则）
- [Slash commands](/tools/slash-commands)（命令表面）

## Related

- [Authentication](/gateway/authentication) — model provider auth 概述
- [Secrets](/gateway/secrets) — 凭据存储和 SecretRef
- [Configuration Reference](/gateway/configuration-reference#auth-storage) — auth 配置键
