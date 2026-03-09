---
mmh3_hash: "12a1cfdf39b74a878430f3d33005f006"
title: "`openclaw reset`"
sidebarTitle: "openclaw reset"
summary: "`openclaw reset` 的 CLI 参考(重置本地状态/配置)"
read_when:
  - 您想在保持 CLI 安装的同时擦除本地状态
  - 您想要将要删除的内容的模拟运行
---

# `openclaw reset`

重置本地配置/状态(保留已安装的 CLI)。

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config+creds+sessions --yes --non-interactive
```

如果您想在删除本地状态之前进行可恢复的快照,请先运行 `openclaw backup create`。
