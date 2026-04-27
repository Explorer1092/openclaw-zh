---
title: "`openclaw directory`"
sidebarTitle: "openclaw directory"
mmh3_hash: "9cfc810d8138213e59ad42b2df5bba6b"
summary: "`openclaw directory` 的 CLI 参考(自己、对等方、组)"
read_when:
  - 您想查找Channel的联系人/组/自己 ID
  - 您正在开发Channel目录适配器
---

# `openclaw directory`

支持的Channel的目录查找(联系人/对等方、组和"我")。

## 常用标志
- `--channel <name>`:Channel ID/别名(配置多个Channel时必需;仅配置一个时自动)
- `--account <id>`:账户 ID(默认:Channel默认)
- `--json`:输出 JSON

## 注意
- `directory` 旨在帮助您找到可以粘贴到其他命令中的 ID(特别是 `openclaw message send --target ...`)。
- 对于许多Channel,结果是基于配置的(允许列表/配置的组)而不是实时提供商目录。
- 默认输出是 `id`(有时是 `name`)由制表符分隔;使用 `--json` 进行脚本编写。

## 将结果与 `message send` 一起使用

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 格式(按Channel)

- WhatsApp:`+15551234567`(DM)、`1234567890-1234567890@g.us`(组)
- Telegram:`@username` 或数字聊天 ID;组是数字 ID
- Slack:`user:U…` 和 `channel:C…`
- Discord:`user:<id>` 和 `channel:<id>`
- Matrix(插件):`user:@user:server`、`room:!roomId:server` 或 `#alias:server`
- Microsoft Teams(插件):`user:<id>` 和 `conversation:<id>`
- Zalo(插件):用户 ID(Bot API)
- Zalo Personal / `zalouser`(插件):来自 `zca` 的线程 ID(DM/组)(`me`、`friend list`、`group list`)

## 自己("我")

```bash
openclaw directory self --channel zalouser
```

## 对等方(联系人/用户)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## 组

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## 相关

- [CLI 参考](/cli)
