---
mmh3_hash: "5ef6625a427f802d9059c0ce21aace5e"
title: "`openclaw channels`"
sidebarTitle: "openclaw channels"
summary: "`openclaw channels` 的 CLI 参考(账户、状态、登录/登出、日志)"
read_when:
  - 您想添加/删除 Channel 账户(WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (插件)/Signal/iMessage/Matrix)
  - 您想检查 Channel 状态或查看 Channel 日志
---

# `openclaw channels`

管理 Gateway 上的聊天 Channel 账户及其运行时状态。

相关文档:

- Channel 指南:[Channels](/channels/index)
- Gateway 配置:[Configuration](/gateway/configuration)

## 常用命令

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## 状态/能力/解析/日志

- `channels status`:`--probe`、`--timeout <ms>`、`--json`
- `channels capabilities`:`--channel <name>`、`--account <id>`(仅与 `--channel` 一起使用)、`--target <dest>`、`--timeout <ms>`、`--json`
- `channels resolve`:`<entries...>`、`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`、`--json`
- `channels logs`:`--channel <name|all>`、`--lines <n>`、`--json`

`channels status --probe` 是实时路径:在可访问的 Gateway 上,它运行每个账户的
`probeAccount` 和可选的 `auditAccount` 检查,因此输出可以包括传输状态
以及探测结果,如 `works`、`probe failed`、`audit ok` 或 `audit failed`。
如果 Gateway 不可访问,`channels status` 回退到仅配置摘要而非实时探测输出。

## 添加/删除账户

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

提示:`openclaw channels add --help` 显示每个 Channel 的标志(令牌、私钥、应用令牌、signal-cli 路径等)。

常见的非交互式添加界面包括:

- 机器人令牌 Channel:`--token`、`--bot-token`、`--app-token`、`--token-file`
- Signal/iMessage 传输字段:`--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`、`--db-path`、`--service`、`--region`
- Google Chat 字段:`--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`
- Matrix 字段:`--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit`
- Nostr 字段:`--private-key`、`--relay-urls`
- Tlon 字段:`--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`
- `--use-env` 用于支持默认账户环境变量认证的情况

不带标志运行 `openclaw channels add` 时,交互式向导可以提示:

- 每个所选 Channel 的账户 ID
- 这些账户的可选显示名称
- `现在将已配置的 Channel 账户绑定到 Agent 吗?`

如果您确认立即绑定,向导会询问哪个 Agent 应拥有每个已配置的 Channel 账户,并写入账户范围的路由绑定。

您也可以稍后通过 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由规则(参见 [agents](/cli/agents))。

当您向仍使用单账户顶层设置的 Channel 添加非默认账户时,OpenClaw 会将账户范围的顶层值提升到 Channel 的账户映射中,然后再写入新账户。大多数 Channel 将这些值保存在 `channels.<channel>.accounts.default` 中,但捆绑 Channel 可以保留现有匹配的提升账户。Matrix 是当前的示例:如果一个命名账户已存在,或 `defaultAccount` 指向现有命名账户,提升会保留该账户而不是创建新的 `accounts.default`。

路由行为保持一致:

- 现有的仅 Channel 绑定(无 `accountId`)继续匹配默认账户。
- `channels add` 在非交互模式下不会自动创建或重写绑定。
- 交互式设置可以选择性地添加账户范围的绑定。

如果您的配置已处于混合状态(存在命名账户,仍设置了顶层单账户值),请运行 `openclaw doctor --fix` 将账户范围的值移动到为该 Channel 选择的提升账户中。大多数 Channel 提升到 `accounts.default`;Matrix 可以保留现有的命名/默认目标。

## 登录/登出(交互式)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

说明:

- `channels login` 支持 `--verbose`。
- 当只配置了一个支持的登录目标时,`channels login` / `logout` 可以推断 Channel。

## 故障排除

- 运行 `openclaw status --deep` 进行广泛探测。
- 使用 `openclaw doctor` 获取指导性修复。
- `openclaw channels list` 打印 `Claude: HTTP 403 ... user:profile` → 使用快照需要 `user:profile` 范围。使用 `--no-usage`,或提供 claude.ai 会话密钥(`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`),或通过 Claude CLI 重新认证。
- `openclaw channels status` 在 Gateway 无法访问时回退到仅配置摘要。如果支持的 Channel 凭据通过 SecretRef 配置但在当前命令路径中不可用,它会将该账户报告为已配置但带有降级说明,而不是显示为未配置。

## 能力探测

获取提供商能力提示(意图/范围,如果可用)以及静态功能支持:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

说明:

- `--channel` 是可选的;省略它以列出每个 Channel(包括扩展)。
- `--account` 仅与 `--channel` 一起有效。
- `--target` 接受 `channel:<id>` 或原始数字 Channel ID,仅适用于 Discord。
- 探测是提供商特定的:Discord 意图 + 可选 Channel 权限;Slack 机器人 + 用户范围;Telegram 机器人标志 + webhook;Signal 守护进程版本;Microsoft Teams 应用令牌 + Graph 角色/范围(在已知的地方注释)。没有探测的 Channel 报告 `Probe: unavailable`。

## 将名称解析为 ID

使用提供商目录将 Channel/用户名称解析为 ID:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

说明:

- 使用 `--kind user|group|auto` 强制目标类型。
- 当多个条目共享相同名称时,解析优先选择活动匹配项。
- `channels resolve` 是只读的。如果所选账户通过 SecretRef 配置但该凭据在当前命令路径中不可用,命令将返回降级的未解析结果并附带说明,而不是中止整个运行。
