---
mmh3_hash: "46670353df281ec2beaff835d1e737ec"
summary: "模型认证:OAuth、API 密钥和 setup-token"
read_when:
  - 调试模型认证或 OAuth 过期问题
  - 记录认证或凭证存储相关内容
title: "认证"
---

# 认证

OpenClaw 支持模型提供商的 OAuth 和 API 密钥认证。对于长期运行的 Gateway 主机,API 密钥通常是最可预测的选项。当提供商账户模式匹配时,也支持订阅/OAuth 流程。

完整的 OAuth 流程和存储布局请参见 [/concepts/oauth](/concepts/oauth)。
对于基于 SecretRef 的认证(`env`/`file`/`exec` providers),请参见 [Secrets Management](/gateway/secrets)。
有关 `models status --probe` 使用的凭证资格/原因代码规则,请参见 [Auth Credential Semantics](/auth-credential-semantics)。

## 推荐的设置(API 密钥,任意提供商)

如果您在运行长期 Gateway,请从所选提供商的 API 密钥开始。
对于 Anthropic,API 密钥认证是安全路径,推荐优先于订阅 setup-token 认证。

1. 在提供商控制台中创建一个 API 密钥。
2. 将其放在 **Gateway 主机**(运行 `openclaw gateway` 的机器)上。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. 如果 Gateway 在 systemd/launchd 下运行,建议将密钥放在 `~/.openclaw/.env` 中,以便 daemon 可以读取:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

然后重启 daemon(或重启您的 Gateway 进程)并重新检查:

```bash
openclaw models status
openclaw doctor
```

如果您不想自己管理环境变量,引导向导可以为 daemon 使用存储 API 密钥:`openclaw onboard`。

有关环境变量继承的详细信息(`env.shellEnv`、`~/.openclaw/.env`、systemd/launchd),请参见 [Help](/help)。

## Anthropic: setup-token(订阅认证)

如果您使用 Claude 订阅,支持 setup-token 流程。在 **Gateway 主机**上运行:

```bash
claude setup-token
```

然后将其粘贴到 OpenClaw 中:

```bash
openclaw models auth setup-token --provider anthropic
```

如果令牌是在另一台机器上创建的,请手动粘贴:

```bash
openclaw models auth paste-token --provider anthropic
```

如果您看到 Anthropic 错误,例如:

```
This credential is only authorized for use with Claude Code and cannot be used for other API requests.
```

…请改用 Anthropic API 密钥。

<Warning>
Anthropic setup-token 支持仅为技术兼容性。Anthropic 过去曾封锁 Claude Code 之外的部分订阅用途。仅在您认为政策风险可接受时使用,并请自行验证 Anthropic 的当前条款。
</Warning>

手动输入令牌(任何提供商;写入 `auth-profiles.json` 并更新配置):

```bash
openclaw models auth paste-token --provider anthropic
openclaw models auth paste-token --provider openrouter
```

Auth profile refs 也支持静态凭证:

- `api_key` 凭证可以使用 `keyRef: { source, provider, id }`
- `token` 凭证可以使用 `tokenRef: { source, provider, id }`

自动化友好的检查(过期/缺失时退出 `1`,即将过期时退出 `2`):

```bash
openclaw models status --check
```

可选的运维脚本(systemd/Termux)记录在此:
[/automation/auth-monitoring](/automation/auth-monitoring)

> `claude setup-token` 需要交互式 TTY。

## 检查模型认证状态

```bash
openclaw models status
openclaw doctor
```

## API 密钥轮换行为(Gateway)

部分提供商支持在 API 调用触发提供商速率限制时,使用备用密钥重试请求。

- 优先级顺序:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`(单个覆盖)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 提供商还包括 `GOOGLE_API_KEY` 作为额外回退。
- 相同的密钥列表在使用前会去重。
- OpenClaw 仅针对速率限制错误使用下一个密钥重试(例如 `429`、`rate_limit`、`quota`、`resource exhausted`)。
- 非速率限制错误不会使用备用密钥重试。
- 如果所有密钥都失败,则返回最后一次尝试的最终错误。

## 控制使用哪个凭证

### Per-session(聊天命令)

使用 `/model <alias-or-id>@<profileId>` 为当前 Session 固定特定的提供商凭证(示例 profile ID:`anthropic:default`、`anthropic:work`)。

使用 `/model`(或 `/model list`)获取紧凑选择器;使用 `/model status` 获取完整视图(候选项 + 下一个认证 profile,以及配置时的提供商端点详情)。

### Per-agent(CLI 覆盖)

为 Agent 设置显式的认证 profile 顺序覆盖(存储在该 Agent 的 `auth-profiles.json` 中):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 指定特定的 Agent;省略则使用配置的默认 Agent。

## 故障排除

### "未找到凭证"

如果 Anthropic 令牌 profile 缺失,在 **Gateway 主机**上运行 `claude setup-token`,然后重新检查:

```bash
openclaw models status
```

### 令牌即将过期/已过期

运行 `openclaw models status` 确认哪个 profile 即将过期。如果 profile 缺失,重新运行 `claude setup-token` 并再次粘贴令牌。

## 要求

- Anthropic 订阅账户(用于 `claude setup-token`)
- 已安装 Claude Code CLI(`claude` 命令可用)
