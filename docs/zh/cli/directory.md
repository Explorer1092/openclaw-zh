---
summary: "`openclaw directory` 的 CLI 参考（自己、对等方、群组）"
read_when:
  - 您想查找 Channel 的联系人/群组/自己的 ID
  - 您正在开发 Channel 目录适配器
title: "Directory"
---

# `openclaw directory`

针对支持该功能的 Channel 进行目录查找（联系人/对等方、群组和"我"）。

## 常用标志

- `--channel <name>`：Channel ID/别名（配置了多个 Channel 时必需；只配置一个时自动）
- `--account <id>`：账户 ID（默认：Channel 默认）
- `--json`：输出 JSON

## 注意事项

- `directory` 旨在帮助您找到可以粘贴到其他命令（尤其是 `openclaw message send --target ...`）的 ID。
- 对于许多 Channel，结果是配置支持的（允许列表/已配置的群组），而不是实时 Provider 目录。
- 已安装的 Channel Plugin 仍可能不支持目录；在这种情况下，命令报告不支持的目录操作，而不是重新安装 Plugin。
- 默认输出是以制表符分隔的 `id`（有时是 `name`）；使用 `--json` 进行脚本编写。

## 与 `message send` 配合使用结果

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 格式（按 Channel）

- WhatsApp：`+15551234567`（私信）、`1234567890-1234567890@g.us`（群组）、`120363123456789@newsletter`（Channel/Newsletter 出站目标）
- Telegram：`@username` 或数字聊天 ID；群组是数字 ID
- Slack：`user:U…` 和 `channel:C…`
- Discord：`user:<id>` 和 `channel:<id>`
- Matrix（插件）：`user:@user:server`、`room:!roomId:server` 或 `#alias:server`
- Microsoft Teams（插件）：`user:<id>` 和 `conversation:<id>`
- Zalo（插件）：用户 ID（Bot API）
- Zalo Personal / `zalouser`（插件）：来自 `zca` 的线程 ID（私信/群组）（`me`、`friend list`、`group list`）

## 自己（"me"）

```bash
openclaw directory self --channel zalouser
```

## 对等方（联系人/用户）

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## 群组

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## 相关

- [CLI 参考](/cli)
