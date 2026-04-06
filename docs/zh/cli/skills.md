---
title: "`openclaw skills`"
sidebarTitle: "openclaw skills"
mmh3_hash: "36eca797121544ca0ee67a26dac572c2"
summary: "`openclaw skills` 的 CLI 参考(搜索/安装/更新/列表/信息/检查)"
read_when:
  - 您想查看哪些 Skill 可用并准备运行
  - 您想从 ClawHub 搜索、安装或更新 Skill
  - 您想调试 Skill 缺少的二进制文件/环境/配置
---

# `openclaw skills`

检查本地 Skill 并从 ClawHub 安装/更新 Skill。

相关:

- Skill 系统:[Skills](/tools/skills)
- Skill 配置:[Skills 配置](/tools/skills-config)
- ClawHub 安装:[ClawHub](/tools/clawhub)

## 命令

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search`/`install`/`update` 直接使用 ClawHub 并安装到活动工作区的 `skills/` 目录中。`list`/`info`/`check` 仍然检查当前工作区和配置可见的本地 Skill。

此 CLI `install` 命令从 ClawHub 下载 Skill 文件夹。从入职向导或 Skill 设置触发的 Gateway 支持的 Skill 依赖安装改用单独的 `skills.install` 请求路径。

注意:

- `search [query...]` 接受可选查询;省略它可浏览默认的 ClawHub 搜索馈送。
- `search --limit <n>` 限制返回的结果数量。
- `install --force` 覆盖相同 slug 的现有工作区 Skill 文件夹。
- `update --all` 仅更新活动工作区中跟踪的 ClawHub 安装。
- `list` 是未提供子命令时的默认操作。
- `list`、`info` 和 `check` 将渲染的输出写入 stdout。使用 `--json` 时,这意味着机器可读的有效载荷保留在 stdout 上供管道和脚本使用。
