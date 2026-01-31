---
title: "认证"
mmh3_hash: "454afa16c8015edb23e4e6b45bdeb687"
summary: "模型认证:OAuth、API 密钥和 setup-token"
read_when:
  - 调试模型认证或 OAuth 过期问题
  - 记录认证或凭证存储相关内容
---
# 认证

OpenClaw 支持模型提供商的 OAuth 和 API 密钥认证。对于 Anthropic 账户,我们推荐使用 **API 密钥**。对于 Claude 订阅访问,使用通过 `claude setup-token` 创建的长期令牌。

完整的 OAuth 流程和存储布局请参见 [/zh/concepts/oauth](/zh/concepts/oauth)。

## 推荐的 Anthropic 设置 (API 密钥)

如果您直接使用 Anthropic,请使用 API 密钥。

1) 在 Anthropic Console 中创建一个 API 密钥。
2) 将其放在 **gateway 主机**(运行 `openclaw gateway` 的机器)上。

```bash
export ANTHROPIC_API_KEY="..."
openclaw models status
```

3) 如果 Gateway 在 systemd/launchd 下运行,建议将密钥放在 `~/.openclaw/.env` 中,以便 daemon 可以读取:

```bash
cat >> ~/.openclaw/.env <<'EOF'
ANTHROPIC_API_KEY=...
EOF
```

然后重启 daemon(或重启您的 Gateway 进程)并重新检查:

```bash
openclaw models status
openclaw doctor
```

如果您不想自己管理环境变量,引导向导可以为 daemon 使用存储 API 密钥:`openclaw onboard`。

有关环境变量继承的详细信息(`env.shellEnv`、`~/.openclaw/.env`、systemd/launchd),请参见 [Help](/zh/help)。

## Anthropic: setup-token (订阅认证)

对于 Anthropic,推荐的方式是使用 **API 密钥**。如果您使用 Claude 订阅,也支持 setup-token 流程。在 **gateway 主机**上运行:

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

手动输入令牌(任何提供商;写入 `auth-profiles.json` 并更新配置):

```bash
openclaw models auth paste-token --provider anthropic
openclaw models auth paste-token --provider openrouter
```

自动化友好的检查(过期/缺失时退出 `1`,即将过期时退出 `2`):

```bash
openclaw models status --check
```

可选的运维脚本(systemd/Termux)记录在此:
[/zh/automation/auth-monitoring](/zh/automation/auth-monitoring)

> `claude setup-token` 需要交互式 TTY。

## 检查模型认证状态

```bash
openclaw models status
openclaw doctor
```

## 控制使用哪个凭证

### 每个 session (聊天命令)

使用 `/model <alias-or-id>@<profileId>` 为当前 session 固定特定的提供商凭证(示例 profile id:`anthropic:default`、`anthropic:work`)。

使用 `/model`(或 `/model list`)获取紧凑选择器;使用 `/model status` 获取完整视图(候选项 + 下一个认证配置文件,以及配置时的提供商端点详情)。

### 每个 agent (CLI 覆盖)

为 agent 设置显式的认证配置文件顺序覆盖(存储在该 agent 的 `auth-profiles.json` 中):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 指定特定的 agent;省略则使用配置的默认 agent。

## 故障排除

### "未找到凭证"

如果 Anthropic 令牌配置文件缺失,在 **gateway 主机**上运行 `claude setup-token`,然后重新检查:

```bash
openclaw models status
```

### 令牌即将过期/已过期

运行 `openclaw models status` 确认哪个配置文件即将过期。如果配置文件缺失,重新运行 `claude setup-token` 并再次粘贴令牌。

## 要求

- Claude Max 或 Pro 订阅(用于 `claude setup-token`)
- 已安装 Claude Code CLI(`claude` 命令可用)
