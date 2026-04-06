---
mmh3_hash: "494f0f18e380d283806aed45afebdabf"
title: "`openclaw reset`"
sidebarTitle: "openclaw reset"
summary: "`openclaw reset` 的 CLI 参考(重置本地状态/配置)"
read_when:
  - 您想在保持 CLI 安装的同时擦除本地状态
  - 您想要将要删除的内容的模拟运行
---

# `openclaw reset`

重置本地配置/状态(保留已安装的 CLI)。

选项:

- `--scope <scope>`:`config`、`config+creds+sessions` 或 `full`
- `--yes`:跳过确认提示
- `--non-interactive`:禁用提示;需要 `--scope` 和 `--yes`
- `--dry-run`:打印操作而不删除文件

示例:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

注意:

- 如果您想在删除本地状态之前进行可恢复的快照,请先运行 `openclaw backup create`。
- 如果省略 `--scope`,`openclaw reset` 使用交互式提示选择要删除的内容。
- `--non-interactive` 仅在同时设置 `--scope` 和 `--yes` 时有效。
