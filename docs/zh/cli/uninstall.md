---
mmh3_hash: "554882dded9d7be642c33c20d94b3fcd"
title: "`openclaw uninstall`"
sidebarTitle: "openclaw uninstall"
summary: "`openclaw uninstall` 的 CLI 参考(删除 Gateway 服务 + 本地数据)"
read_when:
  - 您想删除 Gateway 服务和/或本地状态
  - 您首先想要模拟运行
---

# `openclaw uninstall`

卸载 Gateway 服务 + 本地数据(CLI 保留)。

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

如果您想在删除状态或工作区之前进行可恢复的快照,请先运行 `openclaw backup create`。
