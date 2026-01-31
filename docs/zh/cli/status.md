---
mmh3_hash: "40ac6fa8bdaf11f0a566dcb5180b62aa"
summary: "`openclaw status` 的 CLI 参考(诊断、探测、使用快照)"
read_when:
  - 您想快速诊断频道健康状况 + 最近的会话收件人
  - 您想要用于调试的可粘贴"全部"状态
---

# `openclaw status`

频道 + 会话的诊断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注意:
- `--deep` 运行实时探测(WhatsApp Web + Telegram + Discord + Google Chat + Slack + Signal)。
- 配置多个代理时,输出包括每个代理的会话存储。
- 概述包括网关 + 节点主机服务安装/运行时状态(如果可用)。
- 概述包括更新频道 + git SHA(用于源检出)。
- 更新信息显示在概述中;如果有可用更新,状态会打印运行 `openclaw update` 的提示(参见 [更新](/install/updating))。
