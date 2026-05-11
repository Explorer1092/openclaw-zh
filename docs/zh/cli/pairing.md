---
mmh3_hash: "5f166e2b79e6951824045b361c3604a4"
summary: "`openclaw pairing` 的 CLI 参考（批准/列出配对请求）"
read_when:
  - 您正在使用配对模式 DM 并需要批准发件人
title: "Pairing"
---

# `openclaw pairing`

批准或检查 DM 配对请求（适用于支持配对的 Channel）。

相关：

- 配对流程：[配对](/channels/pairing)

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

选项：

- `[channel]`：位置 Channel ID
- `--channel <channel>`：显式 Channel ID
- `--account <accountId>`：多账户 Channel 的账户 ID
- `--json`：机器可读输出

注意事项：

- 如果配置了多个支持配对的 Channel，则必须通过位置参数或 `--channel` 提供 Channel。
- 只要 Channel ID 有效，扩展 Channel 也是允许的。

## `pairing approve`

批准待处理的配对码并允许该发件人。

用法：

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`（当恰好配置了一个支持配对的 Channel 时）

选项：

- `--channel <channel>`：显式 Channel ID
- `--account <accountId>`：多账户 Channel 的账户 ID
- `--notify`：在同一 Channel 上向请求者发送确认

所有者引导：

- 如果在您批准配对码时 `commands.ownerAllowFrom` 为空，OpenClaw 还会将已批准的发件人记录为命令所有者，使用 Channel 范围的条目，如 `telegram:123456789`。
- 这只引导第一个所有者。后续的配对批准不会替换或扩展 `commands.ownerAllowFrom`。
- 命令所有者是允许运行仅限所有者命令和批准危险操作（如 `/diagnostics`、`/export-trajectory`、`/config` 和 exec 审批）的人工操作员账户。

## 注意事项

- Channel 输入：通过位置参数（`pairing list telegram`）或 `--channel <channel>` 传递。
- `pairing list` 支持 `--account <accountId>` 用于多账户 Channel。
- `pairing approve` 支持 `--account <accountId>` 和 `--notify`。
- 如果只配置了一个支持配对的 Channel，则允许 `pairing approve <code>`。
- 如果您在此引导存在之前批准了发件人，请运行 `openclaw doctor`；当没有配置命令所有者时它会发出警告，并显示 `openclaw config set commands.ownerAllowFrom ...` 命令来修复它。

## 相关

- [CLI 参考](/cli)
- [Channel 配对](/channels/pairing)
