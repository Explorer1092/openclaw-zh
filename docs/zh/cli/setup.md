---
title: "`openclaw setup`"
sidebarTitle: "openclaw setup"
mmh3_hash: "8fcba69880ddb989ecc15c9918f11bfb"
summary: "`openclaw setup` 的 CLI 参考(初始化配置 + 工作区)"
read_when:
  - 您正在进行首次运行设置而不使用完整的入职向导
  - 您想设置默认工作区路径
---

# `openclaw setup`

初始化 `~/.openclaw/openclaw.json` 和 Agent 工作区。

相关:

- 入门:[入门](/start/getting-started)
- CLI 入职:[入职向导 (CLI)](/start/wizard)

## 示例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 选项

- `--workspace <dir>`:Agent 工作区目录(存储为 `agents.defaults.workspace`)
- `--wizard`:运行入职向导
- `--non-interactive`:无提示运行入职向导
- `--mode <local|remote>`:入职模式
- `--import-from <provider>`:入职期间运行的迁移 Provider
- `--import-source <path>`:用于 `--import-from` 的源 Agent 主目录
- `--import-secrets`:入职迁移期间导入支持的 secret
- `--remote-url <url>`:远程 Gateway WebSocket URL
- `--remote-token <token>`:远程 Gateway 令牌

通过 setup 运行入职向导:

```bash
openclaw setup --wizard
```

注意:

- 普通的 `openclaw setup` 初始化配置 + 工作区,不运行完整的入职流程。
- 当存在任何入职标志时(`--wizard`、`--non-interactive`、`--mode`、`--import-from`、`--import-source`、`--import-secrets`、`--remote-url`、`--remote-token`),入职会自动运行。
- 如果检测到 Hermes 状态,交互式入职可以自动提供迁移。导入入职需要全新设置;在入职外使用 [Migrate](/cli/migrate) 进行模拟运行计划、备份和覆盖模式。

## 相关

- [CLI 参考](/cli)
- [安装概述](/install)
