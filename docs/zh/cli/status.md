---
title: "`openclaw status`"
sidebarTitle: "openclaw status"
mmh3_hash: "4d5ec73e8822acbadde223c23767b47d"
summary: "`openclaw status` 的 CLI 参考(诊断、探测、使用快照)"
read_when: ["您想快速诊断Channel健康状况 + 最近的Session收件人","您想要用于调试的可粘贴\"全部\"状态"]
---

# `openclaw status`

Channel + Session的诊断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注意:
- `--deep` 运行实时探测(WhatsApp Web + Telegram + Discord + Google Chat + Slack + Signal)。
- 配置多个Agent时,输出包括每个Agent的Session存储。
- 概述包括Gateway + Node主机服务安装/运行时状态(如果可用)。
- 概述包括更新Channel + git SHA(用于源检出)。
- 更新信息显示在概述中;如果有可用更新,状态会打印运行 `openclaw update` 的提示(参见 [更新](/install/updating))。
