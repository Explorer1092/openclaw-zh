---
mmh3_hash: "a12c75df38c3fb39e2c0af84e7caefc5"
read_when:
  - 向新用户介绍 ClawHub
  - 安装、搜索或发布 Skills 或插件
  - 说明 ClawHub CLI 标志和同步行为
summary: ClawHub 指南：公共注册中心、原生 OpenClaw 安装流程及 ClawHub CLI 工作流
title: ClawHub
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: tools/clawhub.md
  workflow: 15
---

# ClawHub

ClawHub 是 **OpenClaw 的公共 Skills 与插件注册中心**。

- 使用原生 `openclaw` 命令搜索/安装/更新 Skills，以及从 ClawHub 安装插件。
- 当你需要注册中心认证、发布、删除、恢复删除或同步工作流时，使用单独的 `clawhub` CLI。

网站：[clawhub.ai](https://clawhub.ai)

## 原生 OpenClaw 流程

Skills：

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

插件：

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

裸 npm 安全的插件规格也会先尝试 ClawHub，再尝试 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

原生 `openclaw` 命令会安装到活跃工作区，并持久化源元数据，以便之后的 `update` 调用保持使用 ClawHub。

## ClawHub 是什么

- OpenClaw Skills 与插件的公共注册中心。
- 技能包和元数据的版本化存储。
- 支持搜索、标签和使用信号的发现平台。

## 工作原理

1. 用户发布 Skills 包（文件 + 元数据）。
2. ClawHub 存储包、解析元数据并分配版本号。
3. 注册中心为搜索和发现建立 Skills 索引。
4. 用户在 OpenClaw 中浏览、下载和安装 Skills。

## 功能概述

- 发布新 Skills 及现有 Skills 的新版本。
- 按名称、标签或搜索发现 Skills。
- 下载 Skills 包并检查其文件。
- 举报滥用或不安全的 Skills。
- 如果你是管理员，可以隐藏、取消隐藏、删除或封禁。

## 适用人群（新手友好）

如果你想为 OpenClaw 智能体添加新功能，ClawHub 是查找和安装 Skills 的最简单方式。你不需要了解后端的工作原理。你可以：

- 使用自然语言搜索 Skills。
- 将 Skills 安装到你的工作区。
- 之后使用一条命令更新 Skills。
- 通过发布 Skills 来备份你自己的 Skills。

## 快速入门（非技术人员）

1. 搜索你需要的内容：
   - `openclaw skills search "calendar"`
2. 安装一个 Skills：
   - `openclaw skills install <skill-slug>`
3. 启动一个新的 OpenClaw 会话，以加载新 Skills。
4. 如果你需要发布或管理注册中心认证，也可以安装单独的 `clawhub` CLI。

## 安装 ClawHub CLI

只有在需要发布/同步等注册中心认证工作流时才需要：

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## 在 OpenClaw 中的定位

原生 `openclaw skills install` 会安装到活跃工作区的 `skills/` 目录。`openclaw plugins install clawhub:...` 会记录一个普通的托管插件安装，以及用于后续更新的 ClawHub 源元数据。

单独的 `clawhub` CLI 也会将 Skills 安装到当前工作目录下的 `./skills`。如果已配置 OpenClaw 工作区，`clawhub` 会回退到该工作区，除非你通过 `--workdir`（或 `CLAWHUB_WORKDIR`）进行覆盖。OpenClaw 从 `<workspace>/skills` 加载工作区 Skills，并会在**下一个**会话中生效。如果你已经在使用 `~/.openclaw/skills` 或内置 Skills，工作区 Skills 优先级更高。

有关 Skills 加载、共享和权限控制的更多详情，请参阅
[Skills](/tools/skills)。

## Skills 系统概览

Skills 是一个版本化的文件包，用于教 OpenClaw 如何执行特定任务。每次发布都会创建一个新版本，注册中心保留版本历史，以便用户审计变更。

典型的 Skills 包含：

- 包含主要说明和使用方法的 `SKILL.md` 文件。
- 可选的配置、脚本或 Skills 使用的辅助文件。
- 标签、摘要和安装要求等元数据。

ClawHub 使用元数据驱动发现，并安全地暴露 Skills 能力。
注册中心还会跟踪使用信号（如星标和下载量），以提升排名和可见性。

## 服务功能

- **公开浏览** Skills 及其 `SKILL.md` 内容。
- 基于嵌入向量（向量搜索）的**搜索**，而不仅仅是关键词匹配。
- 支持语义化版本号、变更日志和标签（包括 `latest`）的**版本管理**。
- 每个版本以 zip 格式**下载**。
- **星标和评论**，支持社区反馈。
- **审核**钩子，用于审批和审计。
- **CLI 友好的 API**，支持自动化和脚本编写。

## 安全性和内容审核

ClawHub 默认对外开放。任何人都可以上传 Skills，但 GitHub 账号必须至少注册满一周才能发布。这有助于减缓滥用，同时不阻止合法贡献者。

举报和审核机制：

- 任何已登录用户都可以举报 Skills。
- 举报原因为必填项并会被记录。
- 每位用户最多可以同时提交 20 个活跃举报。
- 收到超过 3 个独立举报的 Skills 默认会被自动隐藏。
- 管理员可以查看被隐藏的 Skills，并进行取消隐藏、删除或封禁用户的操作。
- 滥用举报功能可能导致账号被封禁。

有意成为管理员？在 OpenClaw Discord 中提问并联系管理员或维护者。

## CLI 命令和参数

全局选项（适用于所有命令）：

- `--workdir <dir>`：工作目录（默认：当前目录；回退到 OpenClaw 工作区）。
- `--dir <dir>`：Skills 目录，相对于工作目录（默认：`skills`）。
- `--site <url>`：网站基础 URL（浏览器登录）。
- `--registry <url>`：注册中心 API 基础 URL。
- `--no-input`：禁用提示（非交互模式）。
- `-V, --cli-version`：打印 CLI 版本。

认证：

- `clawhub login`（浏览器流程）或 `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

选项：

- `--token <token>`：粘贴 API 令牌。
- `--label <label>`：为浏览器登录令牌存储的标签（默认：`CLI token`）。
- `--no-browser`：不打开浏览器（需要 `--token`）。

搜索：

- `clawhub search "query"`
- `--limit <n>`：最大结果数。

安装：

- `clawhub install <slug>`
- `--version <version>`：安装指定版本。
- `--force`：如果文件夹已存在则覆盖。

更新：

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`：更新到指定版本（仅限单个 slug）。
- `--force`：当本地文件与任何已发布版本不匹配时强制覆盖。

列表：

- `clawhub list`（读取 `.clawhub/lock.json`）

发布 Skills：

- `clawhub skill publish <path>`
- `--slug <slug>`：Skills 标识符。
- `--name <name>`：显示名称。
- `--version <version>`：语义化版本号。
- `--changelog <text>`：变更日志文本（可以为空）。
- `--tags <tags>`：逗号分隔的标签（默认：`latest`）。

发布插件：

- `clawhub package publish <source>`
- `<source>` 可以是本地文件夹、`owner/repo`、`owner/repo@ref` 或 GitHub URL。
- `--dry-run`：只生成发布计划，不实际上传。
- `--json`：为 CI 输出结构化 JSON。
- `--source-repo`、`--source-commit`、`--source-ref`：当自动检测不足时的可选覆盖。

删除/恢复（仅所有者/管理员）：

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

同步（扫描本地 Skills + 发布新增/更新的 Skills）：

- `clawhub sync`
- `--root <dir...>`：额外的扫描根目录。
- `--all`：无提示上传所有内容。
- `--dry-run`：显示将要上传的内容。
- `--bump <type>`：更新的版本号递增类型 `patch|minor|major`（默认：`patch`）。
- `--changelog <text>`：非交互更新的变更日志。
- `--tags <tags>`：逗号分隔的标签（默认：`latest`）。
- `--concurrency <n>`：注册中心检查并发数（默认：4）。

## 智能体常用工作流

### 搜索 Skills

```bash
clawhub search "postgres backups"
```

### 下载新 Skills

```bash
clawhub install my-skill-pack
```

### 更新已安装的 Skills

```bash
clawhub update --all
```

### 备份你的 Skills（发布或同步）

对于单个 Skills 文件夹：

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

一次扫描并备份多个 Skills：

```bash
clawhub sync --all
```

### 从 GitHub 发布插件

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

代码插件必须在 `package.json` 中包含所需的 OpenClaw 元数据：

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

## 高级详情（技术性）

### 版本管理和标签

- 每次发布都会创建一个新的**语义化版本** `SkillVersion`。
- 标签（如 `latest`）指向某个版本；移动标签可以实现回滚。
- 变更日志附加在每个版本上，在同步或发布更新时可以为空。

### 本地更改与注册中心版本

更新时会使用内容哈希将本地 Skills 内容与注册中心版本进行比较。如果本地文件与任何已发布版本不匹配，CLI 会在覆盖前询问确认（或在非交互模式下需要 `--force`）。

### 同步扫描和回退根目录

`clawhub sync` 首先扫描当前工作目录。如果未找到 Skills，它会回退到已知的旧版位置（例如 `~/openclaw/skills` 和 `~/.openclaw/skills`）。这样设计是为了在不需要额外标志的情况下找到旧版 Skills 安装。

### 存储和锁文件

- 已安装的 Skills 记录在工作目录下的 `.clawhub/lock.json` 中。
- 认证令牌存储在 ClawHub CLI 配置文件中（可通过 `CLAWHUB_CONFIG_PATH` 覆盖）。

### 遥测（安装计数）

当你在登录状态下运行 `clawhub sync` 时，CLI 会发送一个最小快照用于计算安装次数。你可以完全禁用此功能：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## 环境变量

- `CLAWHUB_SITE`：覆盖网站 URL。
- `CLAWHUB_REGISTRY`：覆盖注册中心 API URL。
- `CLAWHUB_CONFIG_PATH`：覆盖 CLI 存储令牌/配置的位置。
- `CLAWHUB_WORKDIR`：覆盖默认工作目录。
- `CLAWHUB_DISABLE_TELEMETRY=1`：禁用 `sync` 的遥测功能。
