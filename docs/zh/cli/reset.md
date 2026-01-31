---
title: "`openclaw reset`"
mmh3_hash: "03f6231336776724e2e6a80430aa6e11"
summary: "`openclaw reset` 的 CLI 参考(重置本地状态/配置)"
read_when:
  - 您想在保持 CLI 安装的同时擦除本地状态
  - 您想要将要删除的内容的模拟运行
---

# `openclaw reset`

重置本地配置/状态(保留已安装的 CLI)。

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config+creds+sessions --yes --non-interactive
```
