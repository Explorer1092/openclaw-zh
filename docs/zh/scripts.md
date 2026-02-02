---
title: "脚本"
sidebarTitle: "脚本"
mmh3_hash: "455f311348d02b2203a6e2fc1e9ac8df"
summary: "仓库脚本:目的、范围和安全注意事项"
read_when: ["从仓库运行脚本","在 ./scripts 下添加或更改脚本"]
---
# 脚本

`scripts/` 目录包含用于本地工作流和操作任务的辅助脚本。
当任务明显与脚本相关时使用这些脚本;否则优先使用 CLI。

## 约定

- 脚本是**可选的**,除非在文档或发布检查列表中引用。
- 当 CLI 界面存在时优先使用它们(示例:身份验证监控使用 `openclaw models status --check`)。
- 假设脚本是主机特定的;在新机器上运行之前请阅读它们。

## Git 钩子

- `scripts/setup-git-hooks.js`:当在 git 仓库内时,为 `core.hooksPath` 提供尽力而为的设置。
- `scripts/format-staged.js`:用于暂存的 `src/` 和 `test/` 文件的预提交格式化程序。

## 身份验证监控脚本

身份验证监控脚本记录在此处:
[/automation/auth-monitoring](/automation/auth-monitoring)

## 添加脚本时

- 保持脚本专注和有文档记录。
- 在相关文档中添加简短条目(如果缺少,则创建一个)。
