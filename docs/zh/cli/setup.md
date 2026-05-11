---
mmh3_hash: "28d1f79fa5722132f93dd404c3ef0b82"
summary: "`openclaw setup` 的 CLI 参考（初始化配置 + 工作空间，可选运行入职向导）"
read_when:
  - 您在不进行完整 CLI 入职的情况下进行首次运行设置
  - 您想设置默认工作空间路径
  - 您需要了解每个标志以及 setup 如何在基准和向导模式之间决策
title: "Setup"
---

# `openclaw setup`

初始化基准配置和 Agent 工作空间。当存在任何入职标志时，还会运行向导。

<Note>
`openclaw setup` 适用于可变配置安装。在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，OpenClaw 拒绝 setup 写入，因为配置文件由 Nix 管理。使用第一方 [nix-openclaw 快速开始](https://github.com/openclaw/nix-openclaw#quick-start)或其他 Nix 包的等效源配置。
</Note>

## 选项

| 标志                       | 描述                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Agent 工作空间目录（默认 `~/.openclaw/workspace`；存储为 `agents.defaults.workspace`）。            |
| `--wizard`                 | 运行交互式入职向导。                                                                                |
| `--non-interactive`        | 不带提示运行入职向导。                                                                              |
| `--mode <mode>`            | 入职模式：`local` 或 `remote`。                                                                     |
| `--import-from <provider>` | 入职期间运行的迁移 Provider。                                                                       |
| `--import-source <path>`   | `--import-from` 的源 Agent 主目录。                                                                 |
| `--import-secrets`         | 入职迁移期间导入支持的密钥。                                                                        |
| `--remote-url <url>`       | 远程 Gateway WebSocket URL。                                                                        |
| `--remote-token <token>`   | 远程 Gateway 令牌（可选）。                                                                         |

### 向导自动触发

当以下任何标志显式存在时，`openclaw setup` 会运行向导，即使没有 `--wizard`：

`--wizard`、`--non-interactive`、`--mode`、`--import-from`、`--import-source`、`--import-secrets`、`--remote-url`、`--remote-token`。

## 示例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 注意事项

- 普通的 `openclaw setup` 初始化配置和工作空间，不运行完整的入职流程。
- 普通 setup 后，运行 `openclaw onboard` 进行完整的引导之旅，运行 `openclaw configure` 进行有针对性的更改，或运行 `openclaw channels add` 添加 Channel 账户。
- 如果检测到 Hermes 状态，交互式入职可以自动提供迁移。导入入职需要全新的设置；对于入职外的干运行计划、备份和覆盖模式，请使用 [Migrate](/cli/migrate)。

## 相关

- [CLI 参考](/cli)
- [入职（CLI）](/start/wizard)
- [入门](/start/getting-started)
- [安装概述](/install)
