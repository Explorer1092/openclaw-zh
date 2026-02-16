---
mmh3_hash: "b239b107bcffda016570b058205d02d0"
summary: "ClawHub 指南：公共技能注册表 + CLI 工作流"
read_when:
  - 向新用户介绍 ClawHub
  - 安装、搜索或发布技能
  - 解释 ClawHub CLI 标志和同步行为
title: "ClawHub"
---

# ClawHub

ClawHub 是 **OpenClaw 的公共技能注册表**。这是一项免费服务：所有技能都是公开的、开放的，并对每个人可见以供共享和重复使用。技能只是一个包含 `SKILL.md` 文件（加上支持的文本文件）的文件夹。您可以在 Web 应用中浏览技能，或使用 CLI 搜索、安装、更新和发布技能。

网站：[clawhub.com](https://clawhub.com)

## 适用对象（初学者友好）

如果您想为您的 OpenClaw 智能体添加新功能，ClawHub 是查找和安装技能的最简单方法。您不需要了解后端的工作原理。您可以：

- 使用自然语言搜索技能。
- 将技能安装到您的工作区。
- 稍后使用一个命令更新技能。
- 通过发布备份您自己的技能。

## 快速开始（非技术性）

1. 安装 CLI（见下一节）。
2. 搜索您需要的内容：
   - `clawhub search "calendar"`
3. 安装技能：
   - `clawhub install <skill-slug>`
4. 启动新的 OpenClaw 会话，以便它获取新技能。

## 安装 CLI

选择一个：

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## 如何融入 OpenClaw

默认情况下，CLI 将技能安装到当前工作目录下的 `./skills` 中。如果配置了 OpenClaw 工作区，`clawhub` 会回退到该工作区，除非您覆盖 `--workdir`（或 `CLAWHUB_WORKDIR`）。OpenClaw 从 `<workspace>/skills` 加载工作区技能，并将在**下一个**会话中获取它们。如果您已经使用 `~/.openclaw/skills` 或捆绑技能，工作区技能优先。

有关如何加载、共享和限制技能的更多详细信息，请参阅
[技能](/tools/skills)。

## 服务提供的功能（特性）

- **公开浏览**技能及其 `SKILL.md` 内容。
- **搜索**由嵌入（向量搜索）支持，而不仅仅是关键字。
- **版本控制**，带有 semver、更新日志和标签（包括 `latest`）。
- **下载**，每个版本作为 zip。
- **星标和评论**用于社区反馈。
- **审核**钩子用于批准和审计。
- **CLI 友好的 API**用于自动化和脚本编写。

## CLI 命令和参数

全局选项（适用于所有命令）：

- `--workdir <dir>`：工作目录（默认：当前目录；回退到 OpenClaw 工作区）。
- `--dir <dir>`：技能目录，相对于 workdir（默认：`skills`）。
- `--site <url>`：站点基础 URL（浏览器登录）。
- `--registry <url>`：注册表 API 基础 URL。
- `--no-input`：禁用提示（非交互式）。
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
- `--version <version>`：安装特定版本。
- `--force`：如果文件夹已存在则覆盖。

更新：

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`：更新到特定版本（仅单个 slug）。
- `--force`：当本地文件与任何已发布版本不匹配时覆盖。

列表：

- `clawhub list`（读取 `.clawhub/lock.json`）

发布：

- `clawhub publish <path>`
- `--slug <slug>`：技能 slug。
- `--name <name>`：显示名称。
- `--version <version>`：Semver 版本。
- `--changelog <text>`：更新日志文本（可以为空）。
- `--tags <tags>`：逗号分隔的标签（默认：`latest`）。

删除/取消删除（仅所有者/管理员）：

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

同步（扫描本地技能 + 发布新/更新）：

- `clawhub sync`
- `--root <dir...>`：额外的扫描根目录。
- `--all`：无需提示即上传所有内容。
- `--dry-run`：显示将上传的内容。
- `--bump <type>`：更新的 `patch|minor|major`（默认：`patch`）。
- `--changelog <text>`：非交互式更新的更新日志。
- `--tags <tags>`：逗号分隔的标签（默认：`latest`）。
- `--concurrency <n>`：注册表检查（默认：4）。

## 智能体的常见工作流程

### 搜索技能

```bash
clawhub search "postgres backups"
```

### 下载新技能

```bash
clawhub install my-skill-pack
```

### 更新已安装的技能

```bash
clawhub update --all
```

### 备份您的技能（发布或同步）

对于单个技能文件夹：

```bash
clawhub publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

一次扫描并备份多个技能：

```bash
clawhub sync --all
```

## 高级详细信息（技术性）

### 版本控制和标签

- 每次发布都会创建一个新的 **semver** `SkillVersion`。
- 标签（如 `latest`）指向一个版本；移动标签可以让您回滚。
- 更新日志附加到每个版本，并且在同步或发布更新时可以为空。

### 本地更改与注册表版本

更新会使用内容哈希将本地技能内容与注册表版本进行比较。如果本地文件与任何已发布版本不匹配，CLI 会在覆盖之前询问（或在非交互式运行中需要 `--force`）。

### 同步扫描和回退根目录

`clawhub sync` 首先扫描您的当前 workdir。如果未找到技能，它会回退到已知的旧版位置（例如 `~/openclaw/skills` 和 `~/.openclaw/skills`）。这旨在查找较旧的技能安装，而无需额外的标志。

### 存储和锁定文件

- 已安装的技能记录在 workdir 下的 `.clawhub/lock.json` 中。
- 认证令牌存储在 ClawHub CLI 配置文件中（通过 `CLAWHUB_CONFIG_PATH` 覆盖）。

### 遥测（安装计数）

当您在登录时运行 `clawhub sync` 时，CLI 会发送最小快照以计算安装计数。您可以完全禁用此功能：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## 环境变量

- `CLAWHUB_SITE`：覆盖站点 URL。
- `CLAWHUB_REGISTRY`：覆盖注册表 API URL。
- `CLAWHUB_CONFIG_PATH`：覆盖 CLI 存储令牌/配置的位置。
- `CLAWHUB_WORKDIR`：覆盖默认 workdir。
- `CLAWHUB_DISABLE_TELEMETRY=1`：在 `sync` 时禁用遥测。
