---
title: "OAuth 认证"
sidebarTitle: "OAuth 认证"
mmh3_hash: "1f6cbc211d79663f11393f5c6e7d1938"
summary: "OpenClaw 中的 OAuth: token 交换、存储和多账户模式"
read_when: ["你想端到端了解 OpenClaw OAuth","你遇到 token 失效 / 登出问题","你想要 setup-token 或 OAuth auth 流程","你想要多个账户或 profile 路由"]
---
# OAuth 认证

OpenClaw 通过 OAuth 支持提供它的 providers 的"subscription auth"(特别是 **OpenAI Codex (ChatGPT OAuth)**)。对于 Anthropic subscriptions,使用 **setup-token** 流程。本页面解释:

- OAuth **token 交换** 如何工作(PKCE)
- tokens **存储** 在哪里(以及为什么)
- 如何处理 **多个账户**(profiles + 每个 session 的覆盖)

OpenClaw 还支持附带自己的 OAuth 或 API‑key 流程的 **provider plugins**。通过以下方式运行它们:

```bash
openclaw models auth login --provider <id>
```

## Token sink(为什么存在)

OAuth providers 通常在登录/刷新流程期间铸造 **新的 refresh token**。某些 providers(或 OAuth 客户端)在为同一用户/应用发出新 token 时可能会使较旧的 refresh tokens 无效。

实际症状:
- 你通过 OpenClaw *和* Claude Code / Codex CLI 登录 → 其中一个稍后随机"登出"

为了减少这种情况,OpenClaw 将 `auth-profiles.json` 视为 **token sink**:
- runtime 从 **一个地方** 读取凭据
- 我们可以保留多个 profiles 并确定性地路由它们

## 存储(tokens 位于何处)

Secrets 按 **agent** 存储:

- Auth profiles (OAuth + API keys): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Runtime cache (自动管理;不要编辑): `~/.openclaw/agents/<agentId>/agent/auth.json`

传统的仅导入文件(仍受支持,但不是主 store):
- `~/.openclaw/credentials/oauth.json` (首次使用时导入 `auth-profiles.json`)

以上所有内容也尊重 `$OPENCLAW_STATE_DIR`(state dir 覆盖)。完整参考:[/gateway/configuration](/zh/gateway/configuration#auth-storage-oauth--api-keys)

## Anthropic setup-token (subscription auth)

在任何机器上运行 `claude setup-token`,然后将其粘贴到 OpenClaw 中:

```bash
openclaw models auth setup-token --provider anthropic
```

如果你在其他地方生成了 token,请手动粘贴:

```bash
openclaw models auth paste-token --provider anthropic
```

验证:

```bash
openclaw models status
```

## OAuth 交换(登录如何工作)

OpenClaw 的交互式登录流程在 `@mariozechner/pi-ai` 中实现,并连接到向导/命令。

### Anthropic (Claude Pro/Max) setup-token

流程形状:

1) 运行 `claude setup-token`
2) 将 token 粘贴到 OpenClaw 中
3) 存储为 token auth profile(无刷新)

向导路径是 `openclaw onboard` → auth 选择 `setup-token` (Anthropic)。

### OpenAI Codex (ChatGPT OAuth)

流程形状(PKCE):

1) 生成 PKCE verifier/challenge + 随机 `state`
2) 打开 `https://auth.openai.com/oauth/authorize?...`
3) 尝试在 `http://127.0.0.1:1455/auth/callback` 上捕获回调
4) 如果回调无法绑定(或你是远程/headless),粘贴重定向 URL/code
5) 在 `https://auth.openai.com/oauth/token` 交换
6) 从 access token 中提取 `accountId` 并存储 `{ access, refresh, expires, accountId }`

向导路径是 `openclaw onboard` → auth 选择 `openai-codex`。

## 刷新 + 过期

Profiles 存储 `expires` 时间戳。

在 runtime:
- 如果 `expires` 在未来 → 使用存储的 access token
- 如果过期 → 刷新(在文件锁下)并覆盖存储的凭据

刷新流程是自动的;你通常不需要手动管理 tokens。

## 多个账户(profiles) + 路由

两种模式:

### 1) 首选:单独的 agents

如果你希望"个人"和"工作"永远不交互,使用隔离的 agents(单独的 sessions + 凭据 + workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

然后为每个 agent 配置 auth(向导)并将聊天路由到正确的 agent。

### 2) 高级:一个 agent 中的多个 profiles

`auth-profiles.json` 支持同一 provider 的多个 profile IDs。

选择使用哪个 profile:
- 通过配置排序全局(`auth.order`)
- 通过 `/model ...@<profileId>` 按 session

示例(session 覆盖):
- `/model Opus@anthropic:work`

如何查看存在哪些 profile IDs:
- `openclaw channels list --json` (显示 `auth[]`)

相关文档:
- [/concepts/model-failover](/zh/concepts/model-failover) (轮换 + cooldown 规则)
- [/tools/slash-commands](/zh/tools/slash-commands) (命令表面)
