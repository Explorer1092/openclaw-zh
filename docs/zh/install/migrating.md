---
mmh3_hash: "28dede80080bedde9c49e4e632ec20c5"
summary: "将 OpenClaw 安装从一台机器移动（迁移）到另一台机器"
read_when:
  - 你正在将 OpenClaw 移动到新的笔记本电脑/服务器
  - 你想保留会话、认证和频道登录（WhatsApp 等）
---
# 将 OpenClaw 迁移到新机器

本指南将 OpenClaw 网关从一台机器迁移到另一台机器，而 **无需重做入门引导**。

迁移在概念上很简单：

- 复制 **状态目录** (`$OPENCLAW_STATE_DIR`, 默认: `~/.openclaw/`) — 这包括配置、认证、会话和频道状态。
- 复制你的 **工作区** (`~/.openclaw/workspace/` 默认) — 这包括你的智能体文件（记忆、提示词等）。

但是在 **配置文件**、**权限** 和 **部分复制** 方面存在常见的陷阱。

## 开始之前 (你正在迁移什么)

### 1) 识别你的状态目录

大多数安装使用默认值：

- **状态目录:** `~/.openclaw/`

但如果你使用以下内容，它可能会有所不同：

- `--profile <name>` (通常变为 `~/.openclaw-<profile>/`)
- `OPENCLAW_STATE_DIR=/some/path`

如果你不确定，请在 **旧** 机器上运行：

```bash
openclaw status
```

在输出中查找 `OPENCLAW_STATE_DIR` / profile 的提及。如果你运行多个网关，请为每个配置文件重复此操作。

### 2) 识别你的工作区

常见的默认值：

- `~/.openclaw/workspace/` (推荐的工作区)
- 你创建的自定义文件夹

你的工作区是 `MEMORY.md`, `USER.md`, 和 `memory/*.md` 等文件所在的地方。

### 3) 了解你将保留什么

如果你复制 **状态目录和工作区两者**，你将保留：

- 网关配置 (`openclaw.json`)
- 认证配置文件 / API 密钥 / OAuth 令牌
- 会话历史 + 智能体状态
- 频道状态 (例如 WhatsApp 登录/会话)
- 你的工作区文件 (记忆、技能笔记等)

如果你 **只** 复制工作区（例如，通过 Git），你 **不** 会保留：

- 会话
- 凭据
- 频道登录

这些存在于 `$OPENCLAW_STATE_DIR` 下。

## 迁移步骤 (推荐)

### 步骤 0 — 制作备份 (旧机器)

在 **旧** 机器上，先停止网关，以免文件在复制中途更改：

```bash
openclaw gateway stop
```

(可选但推荐) 归档状态目录和工作区：

```bash
# 如果你使用配置文件或自定义位置，请调整路径
cd ~
tar -czf openclaw-state.tgz .openclaw

tar -czf openclaw-workspace.tgz .openclaw/workspace
```

如果你有多个配置文件/状态目录 (例如 `~/.openclaw-main`, `~/.openclaw-work`)，请归档每一个。

### 步骤 1 — 在新机器上安装 OpenClaw

在 **新** 机器上，安装 CLI (如果需要，还有 Node)：

- 参见：[安装](/install)

在这个阶段，如果入门引导创建了一个新的 `~/.openclaw/` 也没关系 — 你将在下一步中覆盖它。

### 步骤 2 — 复制状态目录 + 工作区到新机器

复制 **两者**：

- `$OPENCLAW_STATE_DIR` (默认 `~/.openclaw/`)
- 你的工作区 (默认 `~/.openclaw/workspace/`)

常见方法：

- `scp` tarball 并解压
- 通过 SSH `rsync -a`
- 外部驱动器

复制后，确保：

- 包含隐藏目录 (例如 `.openclaw/`)
- 文件所有权对于运行网关的用户是正确的

### 步骤 3 — 运行 Doctor (迁移 + 服务修复)

在 **新** 机器上：

```bash
openclaw doctor
```

Doctor 是“安全无聊”的命令。它修复服务，应用配置迁移，并警告不匹配。

然后：

```bash
openclaw gateway restart
openclaw status
```

## 常见的陷阱 (以及如何避免它们)

### 陷阱：配置文件 / 状态目录不匹配

如果你使用配置文件（或 `OPENCLAW_STATE_DIR`）运行旧网关，而新网关使用不同的，你会看到如下症状：

- 配置更改不生效
- 频道丢失 / 已注销
- 会话历史为空

修复：使用你迁移的 **相同** 配置文件/状态目录运行网关/服务，然后重新运行：

```bash
openclaw doctor
```

### 陷阱：仅复制 `openclaw.json`

`openclaw.json` 是不够的。许多提供商将状态存储在：

- `$OPENCLAW_STATE_DIR/credentials/`
- `$OPENCLAW_STATE_DIR/agents/<agentId>/...`

始终迁移整个 `$OPENCLAW_STATE_DIR` 文件夹。

### 陷阱：权限 / 所有权

如果你作为 root 复制或更改了用户，网关可能无法读取凭据/会话。

修复：确保状态目录 + 工作区由运行网关的用户拥有。

### 陷阱：在远程/本地模式之间迁移

- 如果你的 UI (WebUI/TUI) 指向 **远程** 网关，远程主机拥有会话存储 + 工作区。
- 迁移你的笔记本电脑不会移动远程网关的状态。

如果你处于远程模式，迁移 **网关主机**。

### 陷阱：备份中的机密

`$OPENCLAW_STATE_DIR` 包含机密 (API 密钥, OAuth 令牌, WhatsApp 凭据)。像对待生产机密一样对待备份：

- 加密存储
- 避免通过不安全渠道共享
- 如果你怀疑暴露，轮换密钥

## 验证清单

在新机器上，确认：

- `openclaw status` 显示网关正在运行
- 你的频道仍然连接（例如 WhatsApp 不需要重新配对）
- 仪表盘打开并显示现有会话
- 你的工作区文件（记忆、配置）存在

## 相关

- [Doctor](/gateway/doctor)
- [网关故障排除](/gateway/troubleshooting)
- [OpenClaw 在哪里存储其数据？](/help/faq#where-does-openclaw-store-its-data)
