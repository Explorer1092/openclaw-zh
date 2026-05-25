---
mmh3_hash: "9cabe2fe3427922ce8f2d122afbcfb91"
summary: "`openclaw backup` 的 CLI 参考（创建本地备份归档）"
read_when:
  - 您想为本地 OpenClaw 状态创建一流的备份归档
  - 您想在重置或卸载前预览哪些路径会被包含
title: "Backup"
---

# `openclaw backup`

为 OpenClaw 的状态、配置、auth profiles、Channel/Provider 凭据、Session 以及可选的工作区创建本地备份归档。

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## 注意事项

- 归档包含一个 `manifest.json` 文件，其中包含已解析的源路径和归档布局。
- 默认输出是当前工作目录中带时间戳的 `.tar.gz` 归档。
- 带时间戳的备份文件名使用机器的本地时区，并包含 UTC 偏移量。
- 如果当前工作目录在备份的源目录树内，OpenClaw 会回退到您的主目录作为默认归档位置。
- 现有归档文件不会被覆盖。
- 源状态/工作区树内的输出路径会被拒绝，以避免自我包含。
- `openclaw backup verify <archive>` 验证归档包含恰好一个根清单，拒绝遍历式归档路径，并检查每个清单声明的有效载荷是否存在于 tar 包中。
- `openclaw backup create --verify` 在写入归档后立即运行该验证。
- `openclaw backup create --only-config` 仅备份活跃 JSON 配置文件。

## 备份内容

`openclaw backup create` 从您的本地 OpenClaw 安装中规划备份来源：

- OpenClaw 本地状态解析器返回的状态目录，通常为 `~/.openclaw`
- 活跃配置文件路径
- 当凭据目录存在于状态目录之外时，解析出的 `credentials/` 目录
- 从当前配置中发现的工作区目录，除非您传递 `--no-include-workspace`

Model auth profiles 已经是状态目录下 `agents/<agentId>/agent/auth-profiles.json` 的一部分，因此通常已被状态备份条目覆盖。

如果您使用 `--only-config`，OpenClaw 会跳过状态、凭据目录和工作区发现，仅归档活跃配置文件路径。

OpenClaw 在构建归档之前会规范化路径。如果配置、凭据目录或工作区已位于状态目录内，它们不会作为单独的顶层备份来源重复。缺失的路径会被跳过。

归档有效载荷存储来自这些源目录树的文件内容，而嵌入的 `manifest.json` 记录已解析的绝对源路径以及每个资产使用的归档布局。

在归档创建期间，OpenClaw 会跳过没有恢复价值的已知活跃修改文件，包括活跃 Agent Session 转录、cron 运行日志、滚动日志、状态目录下的传递队列、socket/pid/临时文件以及相关的持久队列临时文件。JSON 结果包含 `skippedVolatileCount`，以便自动化可以查看有多少文件被有意省略。

状态目录 `extensions/` 树下已安装的 Plugin 源文件和清单文件会被包含，但它们嵌套的 `node_modules/` 依赖树会被跳过。这些依赖是可重新构建的安装工件；恢复归档后，当已恢复的 Plugin 报告缺少依赖项时，请使用 `openclaw plugins update <id>` 或使用 `openclaw plugins install <spec> --force` 重新安装 Plugin。

## 无效配置行为

`openclaw backup` 有意绕过正常的配置预检，以便在恢复期间仍然可以提供帮助。由于工作区发现依赖于有效的配置，当配置文件存在但无效且工作区备份仍处于启用状态时，`openclaw backup create` 会快速失败。

如果您在这种情况下仍想要部分备份，请重新运行：

```bash
openclaw backup create --no-include-workspace
```

这将状态、配置和外部凭据目录保留在范围内，同时完全跳过工作区发现。

如果您只需要配置文件本身的副本，`--only-config` 在配置格式错误时也能工作，因为它不依赖解析配置进行工作区发现。

## 大小和性能

OpenClaw 不强制执行内置的最大备份大小或每个文件的大小限制。

实际限制来自本地机器和目标文件系统：

- 临时归档写入加上最终归档的可用空间
- 遍历大型工作区目录树并将其压缩为 `.tar.gz` 的时间
- 如果使用 `openclaw backup create --verify` 或运行 `openclaw backup verify`，重新扫描归档的时间
- 目标路径的文件系统行为。OpenClaw 优先使用无覆盖的硬链接发布步骤，并在硬链接不受支持时回退到独占复制

大型工作区通常是归档大小的主要驱动因素。如果您想要更小或更快的备份，请使用 `--no-include-workspace`。

对于最小的归档，请使用 `--only-config`。

## 相关

- [CLI 参考](/cli)
