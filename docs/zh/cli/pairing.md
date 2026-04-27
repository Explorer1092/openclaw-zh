---
title: "`openclaw pairing`"
sidebarTitle: "openclaw pairing"
mmh3_hash: "1848d49c3bb4775677fcf69a71ae8ccf"
summary: "`openclaw pairing` 的 CLI 参考(批准/列出配对请求)"
read_when:
  - 您正在使用配对模式的 DM 并需要批准发件人
---

# `openclaw pairing`

批准或检查 DM 配对请求(对于支持配对的 Channel)。

相关:

- 配对流程:[配对](/channels/pairing)

## 命令

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

列出一个 Channel 的待处理配对请求。

选项:

- `[channel]`:位置 Channel ID
- `--channel <channel>`:显式 Channel ID
- `--account <accountId>`:多账户 Channel 的账户 ID
- `--json`:机器可读输出

注意:

- 如果配置了多个支持配对的 Channel,您必须以位置参数或使用 `--channel` 提供 Channel。
- 只要 Channel ID 有效,扩展 Channel 是允许的。

## `pairing approve`

批准待处理的配对码并允许该发件人。

用法:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- 当只配置了一个支持配对的 Channel 时,使用 `openclaw pairing approve <code>`

选项:

- `--channel <channel>`:显式 Channel ID
- `--account <accountId>`:多账户 Channel 的账户 ID
- `--notify`:在同一 Channel 上向请求者发送确认

## 注意

- Channel 输入:以位置参数传递(`pairing list telegram`)或使用 `--channel <channel>`。
- `pairing list` 支持多账户 Channel 的 `--account <accountId>`。
- `pairing approve` 支持 `--account <accountId>` 和 `--notify`。
- 如果只配置了一个支持配对的 Channel,则允许使用 `pairing approve <code>`。

## 相关

- [CLI 参考](/cli)
- [Channel 配对](/channels/pairing)
