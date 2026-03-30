---
read_when:
  - 你想添加/删除渠道账户（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（插件）/Signal/iMessage/Matrix）
  - 你想检查渠道状态或跟踪渠道日志
summary: "`openclaw channels` 的 CLI 参考（账户、状态、登录/登出、日志）"
title: channels
x-i18n:
  generated_at: "2026-02-03T07:44:51Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 770f89a11ee92fe9569e9b129a19890b713bc0fd46e7c1f23badd25a3cbf7887
  source_path: cli/channels.md
  workflow: 15
---

# `openclaw channels`

管理 Gateway 网关上的聊天渠道账户及其运行时状态。

相关文档：

- 渠道指南：[渠道](/channels/index)
- Gateway 网关配置：[配置](/gateway/configuration)

## 常用命令

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## 添加/删除账户

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

提示：`openclaw channels add --help` 显示每个渠道的标志（token、私钥、app token、signal-cli 路径等）。

当你不带标志运行 `openclaw channels add` 时，交互式向导会提示：

- 每个选定渠道的账户 ID
- 这些账户的可选显示名称
- `现在将已配置的渠道账户绑定到智能体？`

如果你确认立即绑定，向导会询问哪个智能体应拥有每个已配置的渠道账户，并写入账户作用域的路由绑定。

你也可以稍后通过 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由规则（参见 [agents](/cli/agents)）。

当你向仍使用单账户顶层设置（尚无 `channels.<channel>.accounts` 条目）的渠道添加非默认账户时，OpenClaw 会将账户作用域的单账户顶层值移入 `channels.<channel>.accounts.default`，然后写入新账户。这在迁移到多账户形式的同时保留了原始账户行为。

路由行为保持一致：

- 现有仅渠道绑定（无 `accountId`）继续匹配默认账户。
- `channels add` 在非交互式模式下不会自动创建或重写绑定。
- 交互式设置可以选择性地添加账户作用域绑定。

如果你的配置已处于混合状态（存在命名账户、缺少 `default`、且顶层单账户值仍已设置），请运行 `openclaw doctor --fix` 将账户作用域值移入 `accounts.default`。

## 登录/登出（交互式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

## 故障排除

- 运行 `openclaw status --deep` 进行全面探测。
- 使用 `openclaw doctor` 获取引导式修复。
- `openclaw channels list` 输出 `Claude: HTTP 403 ... user:profile` → 用量快照需要 `user:profile` 权限范围。使用 `--no-usage`，或提供 claude.ai 会话密钥（`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`），或通过 Claude Code CLI 重新授权。
- `openclaw channels status` 在 Gateway 网关不可达时回退到仅配置摘要。如果支持的渠道凭证通过 SecretRef 配置但在当前命令路径中不可用，它会将该账户报告为已配置但降级，而不是显示为未配置。

## 能力探测

获取提供商能力提示（可用的 intents/scopes）以及静态功能支持：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

说明：

- `--channel` 是可选的；省略它可列出所有渠道（包括扩展）。
- `--target` 接受 `channel:<id>` 或原始数字频道 id，仅适用于 Discord。
- 探测是特定于提供商的：Discord intents + 可选的频道权限；Slack bot + user scopes；Telegram bot 标志 + webhook；Signal daemon 版本；Microsoft Teams app token + Graph roles/scopes（在已知处标注）。没有探测功能的渠道报告 `Probe: unavailable`。

## 解析名称为 ID

使用提供商目录将渠道/用户名称解析为 ID：

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

说明：

- 使用 `--kind user|group|auto` 强制指定目标类型。
- 当多个条目共享相同名称时，解析优先选择活跃的匹配项。
- `channels resolve` 是只读的。如果选定账户通过 SecretRef 配置但该凭证在当前命令路径中不可用，命令会返回降级的未解析结果及说明，而不是中止整个运行。
