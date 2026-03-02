---
title: "`openclaw pairing`"
sidebarTitle: "openclaw pairing"
mmh3_hash: "50111cc43f16e73a2e7a20a583b294ec"
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

openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## 注意

- Channel 输入:以位置参数传递(`pairing list telegram`)或使用 `--channel <channel>`。
- `pairing list` 支持多账户 Channel 的 `--account <accountId>`。
- `pairing approve` 支持 `--account <accountId>` 和 `--notify`。
- 如果只配置了一个支持配对的 Channel,则允许使用 `pairing approve <code>`。
