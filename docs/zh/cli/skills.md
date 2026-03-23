---
title: "`openclaw skills`"
sidebarTitle: "openclaw skills"
mmh3_hash: "f9d10f2e7b779c3aa0f0510e20b45455"
summary: "`openclaw skills` 的 CLI 参考(搜索/安装/更新/列表/信息/检查)和技能资格"
read_when:
  - 您想查看哪些技能可用并准备运行
  - 您想从 ClawHub 搜索、安装或更新技能
  - 您想调试技能缺少的二进制文件/环境/配置
---

# `openclaw skills`

检查本地技能并从 ClawHub 安装/更新技能。

相关:

- 技能系统:[技能](/tools/skills)
- 技能配置:[技能配置](/tools/skills-config)
- ClawHub 安装:[ClawHub](/tools/clawhub)

## 命令

```bash
openclaw skills search "calendar"
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills info <name>
openclaw skills check
```

`search`/`install`/`update` 直接使用 ClawHub 并安装到活动工作区的 `skills/` 目录中。`list`/`info`/`check` 仍然检查当前工作区和配置可见的本地技能。
