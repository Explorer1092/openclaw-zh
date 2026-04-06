---
mmh3_hash: "2b6e3f1fab60eee0925c524713650976"
title: "`openclaw uninstall`"
sidebarTitle: "openclaw uninstall"
summary: "`openclaw uninstall` 的 CLI 参考(删除 Gateway 服务 + 本地数据)"
read_when:
  - 您想删除 Gateway 服务和/或本地状态
  - 您首先想要模拟运行
---

# `openclaw uninstall`

卸载 Gateway 服务 + 本地数据(CLI 保留)。

选项:

- `--service`:删除 Gateway 服务
- `--state`:删除状态和配置
- `--workspace`:删除工作区目录
- `--app`:删除 macOS 应用
- `--all`:删除服务、状态、工作区和应用
- `--yes`:跳过确认提示
- `--non-interactive`:禁用提示;需要 `--yes`
- `--dry-run`:打印操作而不删除文件

示例:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

注意:

- 如果您想在删除状态或工作区之前进行可恢复的快照,请先运行 `openclaw backup create`。
- `--all` 是同时删除服务、状态、工作区和应用的简写。
- `--non-interactive` 需要 `--yes`。
