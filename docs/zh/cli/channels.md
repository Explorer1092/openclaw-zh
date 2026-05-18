---
mmh3_hash: "14c2f7b3d7ae68fb1d91f54dd63a31d1"
summary: "`openclaw channels` 的 CLI 参考（账户、状态、登录/登出、日志）"
read_when:
  - 您想添加/删除 Channel 账户（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（插件）/Signal/iMessage/Matrix）
  - 您想检查 Channel 状态或查看 Channel 日志
title: "Channels"
---

# `openclaw channels`

管理 Gateway 上的聊天 Channel 账户及其运行时状态。

相关文档：

- Channel 指南：[Channels](/channels)
- Gateway 配置：[Configuration](/gateway/configuration)

## 常用命令

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` 仅显示聊天 Channel：默认显示按账户配置的账户，每个账户附带 `installed`、`configured` 和 `enabled` 状态标签。传递 `--all` 还会显示尚无配置账户的捆绑 Channel 以及尚未在磁盘上的可安装目录 Channel。身份验证 Provider（OAuth + API 密钥）和模型 Provider 使用/配额快照不再在此打印；请使用 `openclaw models auth list` 获取 Provider auth profiles，使用 `openclaw status` 或 `openclaw models list` 获取使用情况。

## 状态 / 能力 / 解析 / 日志

- `channels status`：`--channel <name>`、`--probe`、`--timeout <ms>`、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（仅与 `--channel` 配合）、`--target <dest>`、`--timeout <ms>`、`--json`
- `channels resolve`：`<entries...>`、`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`、`--json`
- `channels logs`：`--channel <name|all>`、`--lines <n>`、`--json`

`channels status --probe` 是实时路径：在可访问的 Gateway 上，它对每个账户运行 `probeAccount` 和可选的 `auditAccount` 检查，因此输出可以包含传输状态以及 `works`、`probe failed`、`audit ok` 或 `audit failed` 等探测结果。
如果 Gateway 不可访问，`channels status` 会回退到仅配置摘要而不是实时探测输出。

不要使用 `openclaw sessions`、Gateway `sessions.list` 或 Agent `sessions_list` 工具作为 Channel Socket 健康信号。这些界面报告存储的对话行，而不是 Provider 运行时状态。Discord Provider 重启后，已连接但安静的账户可能是健康的，而在下一个入站或出站对话事件之前不会出现 Discord Session 行。

## 添加/删除账户

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` 显示每个 Channel 的标志（token、私钥、应用 token、signal-cli 路径等）。
</Tip>

`channels remove` 仅在已安装/已配置的 Channel Plugin 上运行。对于可安装的目录 Channel，请先使用 `channels add`。
对于运行时支持的 Channel Plugin，`channels remove` 还会要求正在运行的 Gateway 在更新配置之前停止所选账户，因此禁用或删除账户不会使旧侦听器在重启之前保持活跃。

常见的非交互式添加界面包括：

- bot-token Channel：`--token`、`--bot-token`、`--app-token`、`--token-file`
- Signal/iMessage 传输字段：`--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`、`--db-path`、`--service`、`--region`
- Google Chat 字段：`--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`
- Matrix 字段：`--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit`
- Nostr 字段：`--private-key`、`--relay-urls`
- Tlon 字段：`--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`
- 支持时使用 `--use-env` 进行默认账户环境支持的身份验证

如果在标志驱动的添加命令期间需要安装 Channel Plugin，OpenClaw 使用 Channel 的默认安装来源而不打开交互式 Plugin 安装提示。

当您不带标志运行 `openclaw channels add` 时，交互式向导可以提示：

- 每个所选 Channel 的账户 ID
- 这些账户的可选显示名称
- `现在将这些 Channel 账户路由到 Agent 吗？`

如果您确认立即绑定，向导会询问哪个 Agent 应拥有每个已配置的 Channel 账户，并写入账户范围的路由绑定。

您也可以稍后使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由规则（参见 [agents](/cli/agents)）。

当您向仍在使用单账户顶层设置的 Channel 添加非默认账户时，OpenClaw 会在写入新账户之前将账户范围的顶层值提升到 Channel 的账户映射中。大多数 Channel 将这些值放在 `channels.<channel>.accounts.default` 中，但捆绑的 Channel 可以保留现有的匹配提升账户。Matrix 是当前的示例：如果一个命名账户已存在，或 `defaultAccount` 指向一个现有的命名账户，提升会保留该账户而不是创建新的 `accounts.default`。

路由行为保持一致：

- 现有的仅 Channel 绑定（无 `accountId`）继续匹配默认账户。
- `channels add` 在非交互模式下不会自动创建或重写绑定。
- 交互式设置可以选择性地添加账户范围的绑定。

如果您的配置已处于混合状态（命名账户存在且顶层单账户值仍然设置），请运行 `openclaw doctor --fix` 将账户范围的值移入为该 Channel 选择的提升账户。大多数 Channel 提升到 `accounts.default`；Matrix 可以保留现有的命名/默认目标。

## 登录和登出（交互式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支持 `--verbose`。
- `channels login` 和 `logout` 可以在只配置了一个支持的登录目标时推断 Channel。
- `channels logout` 在可访问时优先使用实时 Gateway 路径，因此登出会在清除 Channel 身份验证状态之前停止任何活跃侦听器。如果本地 Gateway 不可访问，它会回退到本地身份验证清理。
- 在 Gateway 主机上的终端中运行 `channels login`。Agent `exec` 会阻止此交互式登录流程；当可用时，应从聊天中使用 Channel 原生的 Agent 登录工具，如 `whatsapp_login`。

## 故障排除

- 运行 `openclaw status --deep` 进行广泛探测。
- 使用 `openclaw doctor` 进行引导修复。
- `openclaw channels list` 不再打印模型 Provider 使用/配额快照。对于这些信息，请使用 `openclaw status`（概览）或 `openclaw models list`（每个 Provider）。
- 当 Gateway 不可访问时，`openclaw channels status` 回退到仅配置摘要。如果受支持的 Channel 凭据是通过 SecretRef 配置的但在当前命令路径中不可用，它会将该账户报告为已配置但有降级说明，而不是显示为未配置。

## 能力探测

获取 Provider 能力提示（可用时的意图/范围）以及静态功能支持：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注意：

- `--channel` 是可选的；省略它可列出每个 Channel（包括扩展）。
- `--account` 仅与 `--channel` 一起有效。
- `--target` 接受 `channel:<id>` 或原始数字 Channel ID，仅适用于 Discord。对于 Discord 语音 Channel，权限检查会标记缺失的 `ViewChannel`、`Connect`、`Speak`、`SendMessages` 和 `ReadMessageHistory`。
- 探测是 Provider 特定的：Discord 意图 + 可选 Channel 权限；Slack bot + 用户范围；Telegram bot 标志 + webhook；Signal 守护进程版本；Microsoft Teams 应用 token + Graph 角色/范围（已知时带注释）。没有探测的 Channel 报告 `Probe: unavailable`。

## 将名称解析为 ID

使用 Provider 目录将 Channel/用户名称解析为 ID：

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注意：

- 使用 `--kind user|group|auto` 强制指定目标类型。
- 当多个条目共享相同名称时，解析优先使用活跃匹配。
- `channels resolve` 是只读的。如果所选账户是通过 SecretRef 配置的但该凭据在当前命令路径中不可用，命令会返回带说明的降级未解析结果，而不是中止整个运行。
- `channels resolve` 不会安装 Channel Plugin。对于可安装的目录 Channel，请在解析名称之前先使用 `channels add --channel <name>`。

## 相关

- [CLI 参考](/cli)
- [Channels 概述](/channels)
