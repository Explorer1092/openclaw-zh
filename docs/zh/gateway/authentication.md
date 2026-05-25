---
mmh3_hash: "4467ad01f6700f6edd8dcf92c9f1a3cb"
summary: "模型认证:OAuth、API 密钥、Claude CLI 复用和 Anthropic setup-token"
read_when:
  - 调试模型认证或 OAuth 过期问题
  - 记录认证或凭证存储相关内容
title: "Authentication"
---

<Note>
本页面涵盖**模型提供商**认证（API 密钥、OAuth 和 Claude CLI 复用及 Anthropic setup-token）。有关 **Gateway 连接**认证（token、密码、trusted-proxy），请参见 [Configuration](/gateway/configuration) 和 [Trusted Proxy Auth](/gateway/trusted-proxy-auth)。
</Note>

OpenClaw 支持模型提供商的 OAuth 和 API 密钥认证。对于长期运行的 Gateway 主机，API 密钥通常是最可预测的选项。当提供商账户模式匹配时，也支持订阅/OAuth 流程。

完整的 OAuth 流程和存储布局请参见 [/concepts/oauth](/concepts/oauth)。
对于基于 SecretRef 的认证（`env`/`file`/`exec` providers），请参见 [Secrets Management](/gateway/secrets)。
有关 `models status --probe` 使用的凭证资格/原因代码规则，请参见 [Auth Credential Semantics](/auth-credential-semantics)。

## 推荐的设置（API 密钥，任意提供商）

如果您在运行长期 Gateway，请从所选提供商的 API 密钥开始。
对于 Anthropic，API 密钥认证仍然是最可预测的服务器设置，但 OpenClaw 也支持复用本地 Claude CLI 登录。

1. 在提供商控制台中创建一个 API 密钥。
2. 将其放在 **Gateway 主机**（运行 `openclaw gateway` 的机器）上。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. 如果 Gateway 在 systemd/launchd 下运行，建议将密钥放在 `~/.openclaw/.env` 中，以便 daemon 可以读取：

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

然后重启 daemon（或重启您的 Gateway 进程）并重新检查：

```bash
openclaw models status
openclaw doctor
```

如果您不想自己管理环境变量，引导向导可以为 daemon 使用存储 API 密钥：`openclaw onboard`。

有关环境变量继承的详细信息（`env.shellEnv`、`~/.openclaw/.env`、systemd/launchd），请参见 [Help](/help)。

## Anthropic：Claude CLI 和 token 兼容性

Anthropic setup-token 认证在 OpenClaw 中作为受支持的 token 路径仍然可用。Anthropic 工作人员告知我们 OpenClaw 风格的 Claude CLI 使用已再次获得许可，因此除非 Anthropic 发布新的政策，OpenClaw 将 Claude CLI 复用和 `claude -p` 的使用视为此集成的认可路径。当 Claude CLI 复用在主机上可用时，该路径现在是首选路径。

对于长期 Gateway 主机，Anthropic API 密钥仍然是最可预测的设置。如果您想在同一主机上复用现有的 Claude 登录，请使用引导/配置中的 Anthropic Claude CLI 路径。

Claude CLI 复用的推荐主机设置：

```bash
# 在 Gateway 主机上运行
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

这是一个两步设置：

1. 在 Gateway 主机上将 Claude Code 本身登录到 Anthropic。
2. 告诉 OpenClaw 将 Anthropic 模型选择切换到本地 `claude-cli` 后端，并存储匹配的 OpenClaw auth profile。

如果 `claude` 不在 `PATH` 上，请先安装 Claude Code 或将 `agents.defaults.cliBackends.claude-cli.command` 设置为真实的二进制路径。

手动输入令牌（任何提供商；写入 `auth-profiles.json` 并更新配置）：

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` 仅存储凭证。其规范格式为：

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw 在运行时期望使用规范的 `version` + `profiles` 格式。如果旧安装仍有扁平格式文件（如 `{ "openrouter": { "apiKey": "..." } }`），请运行 `openclaw doctor --fix` 将其重写为 `openrouter:default` API 密钥 profile；doctor 会在原文件旁保留 `.legacy-flat.*.bak` 备份。`baseUrl`、`api`、模型 ID、标头和超时等端点详情属于 `openclaw.json` 或 `models.json` 中的 `models.providers.<id>`，而非 `auth-profiles.json`。

Bedrock `auth: "aws-sdk"` 等外部认证路由也不是凭证。如需命名的 Bedrock 路由，请在 `openclaw.json` 中设置 `auth.profiles.<id>.mode: "aws-sdk"`；不要将 `type: "aws-sdk"` 写入 `auth-profiles.json`。`openclaw doctor --fix` 会将旧版 AWS SDK 标记从凭证存储移至配置元数据。

Auth profile refs 也支持静态凭证：

- `api_key` 凭证可以使用 `keyRef: { source, provider, id }`
- `token` 凭证可以使用 `tokenRef: { source, provider, id }`
- OAuth 模式的 profile 不支持 SecretRef 凭证；如果 `auth.profiles.<id>.mode` 设置为 `"oauth"`，则该 profile 的 SecretRef 支持的 `keyRef`/`tokenRef` 输入将被拒绝。

自动化友好的检查（过期/缺失时退出 `1`，即将过期时退出 `2`）：

```bash
openclaw models status --check
```

实时认证探测：

```bash
openclaw models status --probe
```

说明：

- 探测行可来自认证 profile、环境变量凭证或 `models.json`。
- 如果显式的 `auth.order.<provider>` 省略了某个已存储的 profile，探测将报告该 profile 为 `excluded_by_auth_order`，而不是尝试使用它。
- 如果认证存在但 OpenClaw 无法为该提供商解析可探测的模型候选，探测将报告 `status: no_model`。
- 速率限制冷却可以限定在模型范围内。一个针对某模型进入冷却的 profile，仍可用于同一提供商的其他模型。

可选的运维脚本（systemd/Termux）记录在此：
[Auth monitoring scripts](/help/scripts#auth-monitoring-scripts)

## Anthropic 说明

Anthropic `claude-cli` 后端再次被支持。

- Anthropic 工作人员告知我们此 OpenClaw 集成路径已再次获得许可。
- 因此，除非 Anthropic 发布新的政策，OpenClaw 将 Claude CLI 复用和 `claude -p` 的使用视为 Anthropic 支持的运行的认可路径。
- 对于长期 Gateway 主机和明确的服务器端计费控制，Anthropic API 密钥仍然是最可预测的选择。

## 检查模型认证状态

```bash
openclaw models status
openclaw doctor
```

## API 密钥轮换行为（Gateway）

部分提供商支持在 API 调用触发提供商速率限制时，使用备用密钥重试请求。

- 优先级顺序：
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单个覆盖）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 提供商还包括 `GOOGLE_API_KEY` 作为额外回退。
- 相同的密钥列表在使用前会去重。
- OpenClaw 仅针对速率限制错误使用下一个密钥重试（例如 `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached` 或 `workers_ai ... quota limit exceeded`）。
- 非速率限制错误不会使用备用密钥重试。
- 如果所有密钥都失败，则返回最后一次尝试的最终错误。

## 在 Gateway 运行时移除提供商认证

当通过 Gateway 控制平面移除提供商认证时，OpenClaw 会删除该提供商已保存的认证 profile，并中止已选择 model provider 与被移除提供商匹配的活跃聊天或 agent 运行。中止的运行将以 `stopReason: "auth-revoked"` 发出正常的聊天取消和生命周期事件，以便连接的客户端可以显示运行因凭证被移除而停止。

移除已保存的认证不会在提供商处撤销密钥。如需提供商端失效，请在提供商控制台中轮换或撤销密钥。

## 控制使用哪个凭证

### Per-session（聊天命令）

使用 `/model <alias-or-id>@<profileId>` 为当前 Session 固定特定的提供商凭证（示例 profile ID：`anthropic:default`、`anthropic:work`）。

使用 `/model`（或 `/model list`）获取紧凑选择器；使用 `/model status` 获取完整视图（候选项 + 下一个认证 profile，以及配置时的提供商端点详情）。

### During login（CLI）

对于支持在登录时使用命名 auth profile 的提供商，请使用 `openclaw models auth login --provider <id> --profile-id <profileId>`。

```bash
openclaw models auth login --provider openai-codex --profile-id openai-codex:ritsuko
openclaw models auth login --provider openai-codex --profile-id openai-codex:lain
```

这是在一个 Agent 中为同一提供商保持多个 OAuth 登录分离的最简单方法。

### Per-session（聊天命令）

使用 `/model <alias-or-id>@<profileId>` 为当前 Session 固定特定的提供商凭证（示例 profile ID：`anthropic:default`、`anthropic:work`）。

使用 `/model`（或 `/model list`）获取紧凑选择器；使用 `/model status` 获取完整视图（候选项 + 下一个认证 profile，以及配置时的提供商端点详情）。

### Per-agent（CLI 覆盖）

为 Agent 设置显式的认证 profile 顺序覆盖（存储在该 Agent 的 `auth-state.json` 中）：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 指定特定的 Agent；省略则使用配置的默认 Agent。
调试顺序问题时，`openclaw models status --probe` 会将被省略的已存储 profile 显示为 `excluded_by_auth_order`，而不是静默跳过。
调试冷却问题时，请记住速率限制冷却可能绑定到一个模型 ID，而非整个提供商 profile。

如果您更改了已在运行的聊天的认证顺序或 profile 固定，请在该聊天中发送 `/new` 或 `/reset` 以开始新 Session。现有 Session 可以保留其当前的模型/profile 选择，直到重置。

## 故障排除

### "未找到凭证"

如果 Anthropic profile 缺失，请在 **Gateway 主机**上配置 Anthropic API 密钥或设置 Anthropic setup-token 路径，然后重新检查：

```bash
openclaw models status
```

### 令牌即将过期/已过期

运行 `openclaw models status` 确认哪个 profile 即将过期。如果 Anthropic token profile 缺失或已过期，请通过 setup-token 刷新该设置或迁移到 Anthropic API 密钥。

## 相关

- [Secrets 管理](/gateway/secrets)
- [远程访问](/gateway/remote)
- [Auth 存储](/concepts/oauth)
