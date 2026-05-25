---
mmh3_hash: "61685112a4220481108abd2f26c45284"
summary: "`openclaw skills` 的 CLI 参考（搜索/安装/更新/列表/信息/检查）"
read_when:
  - 您想查看哪些技能可用并准备运行
  - 您想从 ClawHub 搜索或从 ClawHub、Git 或本地目录安装技能
  - 您想调试技能缺失的二进制文件/环境/配置
title: "Skills"
---

# `openclaw skills`

检查本地技能，搜索 ClawHub，从 ClawHub/Git/本地目录安装技能，以及更新 ClawHub 跟踪的安装。

相关：

- 技能系统：[技能](/tools/skills)
- 技能配置：[技能配置](/tools/skills-config)
- ClawHub 安装：[ClawHub](/clawhub/cli)

## 命令

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills install <slug> --global
openclaw skills update <slug>
openclaw skills update <slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
```

`search` 和 `update` 直接使用 ClawHub。`install <slug>` 安装 ClawHub 技能，`install git:owner/repo[@ref]` 克隆 Git 技能，`install ./path` 复制本地技能目录。默认情况下，`install` 和 `update` 以活动工作空间的 `skills/` 目录为目标；使用 `--global` 时，以共享的托管技能目录为目标。`list`/`info`/`check` 仍然检查当前工作空间和配置中可见的本地技能。工作空间支持的命令从 `--agent <id>` 解析目标工作空间，然后在当前工作目录位于已配置的 Agent 工作空间内时解析，再解析默认 Agent。

Git 和本地目录安装期望在源根目录中有 `SKILL.md`。安装 slug 来自 `SKILL.md` frontmatter 中的有效 `name` 字段，然后是源目录或仓库名称；使用 `--as <slug>` 可覆盖它。`--version` 仅限 ClawHub。技能安装不支持 npm 包规范或 zip/归档路径，`openclaw skills update` 仅更新 ClawHub 跟踪的安装。

从入职或技能设置触发的 Gateway 支持的技能依赖安装使用单独的 `skills.install` 请求路径。

注意事项：

- `search [query...]` 接受可选的查询；省略它以浏览默认的 ClawHub 搜索提要。
- `search --limit <n>` 限制返回的结果。
- `install git:owner/repo[@ref]` 安装 Git 技能。分支引用可以包含斜杠，例如 `git:owner/repo@feature/foo`。
- `install ./path/to/skill` 安装根目录包含 `SKILL.md` 的本地目录。
- `install --as <slug>` 为 Git 和本地目录安装覆盖推断的 slug。
- `install --version <version>` 仅适用于 ClawHub 技能 slug。
- `install --force` 覆盖同一 slug 的现有工作空间技能文件夹。
- `--global` 以共享的托管技能目录为目标，不能与 `--agent <id>` 组合使用。
- `--agent <id>` 定向一个已配置的 Agent 工作空间，并覆盖当前工作目录推断。
- `update <slug>` 更新单个跟踪技能。添加 `--global` 以定向共享托管技能目录而非工作空间。
- `update --all` 更新所选工作空间中跟踪的 ClawHub 安装，或与 `--global` 结合时更新共享托管技能目录中的安装。
- `check --agent <id>` 检查选定 Agent 的工作空间，并报告哪些就绪的技能实际上对该 Agent 的提示或命令界面可见。
- `list` 是未提供子命令时的默认操作。
- `list`、`info` 和 `check` 将其渲染的输出写入 stdout。使用 `--json` 时，机器可读有效载荷保留在 stdout 上，供管道和脚本使用。

## 相关

- [CLI 参考](/cli)
- [技能](/tools/skills)
