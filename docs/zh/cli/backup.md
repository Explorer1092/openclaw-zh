---
mmh3_hash: "e8a33eb0a41143c2dc07324739a0c082"
summary: "`openclaw backup` 的 CLI 参考（创建本地备份归档）"
read_when:
  - 您想为本地 OpenClaw 状态创建一流的备份归档
  - 您想在重置或卸载前预览哪些路径会被包含
title: "backup"
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
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## 说明

- 归档包含一个 `manifest.json` 文件，其中记录了已解析的源路径和归档布局。
- 默认输出为当前工作目录中带时间戳的 `.tar.gz` 归档。
- 如果当前工作目录位于已备份的源目录树内，OpenClaw 会回退到您的主目录作为默认归档位置。
- 现有归档文件不会被覆盖。
- 输出路径位于源状态/工作区目录树内时会被拒绝，以避免自包含。
- `openclaw backup verify <archive>` 验证归档是否恰好包含一个根 manifest，拒绝遍历式归档路径，并检查每个 manifest 声明的负载是否存在于 tarball 中。
- `openclaw backup create --verify` 在写入归档后立即运行该验证。
- `openclaw backup create --only-config` 仅备份当前活跃的 JSON 配置文件。

## 备份的内容

`openclaw backup create` 从您本地的 OpenClaw 安装中规划备份来源：

- OpenClaw 本地状态解析器返回的状态目录，通常为 `~/.openclaw`
- 当前活跃的配置文件路径
- 存在于状态目录外时的已解析 `credentials/` 目录
- 从当前配置中发现的工作区目录，除非您传递 `--no-include-workspace`

Model auth profiles 已是状态目录的一部分，位于 `agents/<agentId>/agent/auth-profiles.json`，因此通常已被状态备份条目覆盖。

如果您使用 `--only-config`，OpenClaw 将跳过状态、凭据目录和工作区发现，仅归档活跃配置文件路径。

OpenClaw 在构建归档前会对路径进行规范化。如果配置、凭据或工作区已在状态目录内，则不会作为单独的顶层备份来源重复添加。缺失的路径会被跳过。

归档负载存储来自这些源目录树的文件内容，嵌入的 `manifest.json` 记录了已解析的绝对源路径以及每个资产使用的归档布局。

## 配置无效时的行为

`openclaw backup` 特意绕过正常的配置预检，以便在恢复期间仍能提供帮助。由于工作区发现依赖于有效的配置，当配置文件存在但无效且工作区备份仍处于启用状态时，`openclaw backup create` 会立即失败。

如果您仍希望在该情况下进行部分备份，请重新运行：

```bash
openclaw backup create --no-include-workspace
```

这会保留状态、配置和凭据的范围，同时完全跳过工作区发现。

如果您只需要配置文件本身的副本，`--only-config` 在配置格式错误时同样有效，因为它不依赖于解析配置来进行工作区发现。

## 大小和性能

OpenClaw 不强制执行内置的最大备份大小或单文件大小限制。

实际限制来自本地机器和目标文件系统：

- 临时归档写入和最终归档的可用空间
- 遍历大型工作区目录树并将其压缩为 `.tar.gz` 的时间
- 使用 `openclaw backup create --verify` 或运行 `openclaw backup verify` 时重新扫描归档的时间
- 目标路径的文件系统行为。OpenClaw 优先使用无覆盖的硬链接发布步骤，当不支持硬链接时回退到独占复制

大型工作区通常是归档大小的主要驱动因素。如果您想要更小或更快的备份，请使用 `--no-include-workspace`。

要获得最小的归档，请使用 `--only-config`。

## 相关

- [CLI 参考](/cli)
