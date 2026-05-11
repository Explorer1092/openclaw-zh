---
mmh3_hash: "509b86266670e39727c49a68468463b4"
title: "脚本"
summary: "仓库脚本：目的、范围和安全注意事项"
read_when:
  - 运行仓库中的脚本
  - 在 ./scripts 下添加或修改脚本
---

`scripts/` 目录包含用于本地工作流和运维任务的辅助脚本。
当任务明确与某个脚本相关时使用这些脚本；否则优先使用 CLI。

## 规范

- 除非在文档或发布检查清单中被引用，脚本是**可选的**。
- 当存在 CLI 界面时优先使用（示例：认证监控使用 `openclaw models status --check`）。
- 假设脚本是主机特定的；在新机器上运行之前先阅读它们。

## 认证监控脚本

认证监控在[认证](/gateway/authentication)中有说明。`scripts/` 下的脚本是 systemd/Termux 手机工作流的可选附加功能。

## GitHub 读取辅助工具

当你希望 `gh` 使用 GitHub App 安装令牌进行仓库范围的读取调用，同时将普通 `gh` 保留在你的个人登录以进行写操作时，使用 `scripts/gh-read`。

所需环境变量：

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

可选环境变量：

- `OPENCLAW_GH_READ_INSTALLATION_ID`：当你想跳过基于仓库的安装查找时
- `OPENCLAW_GH_READ_PERMISSIONS`：以逗号分隔的读取权限子集覆盖

仓库解析顺序：

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

示例：

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## 添加脚本时

- 保持脚本专注并有文档记录。
- 在相关文档中添加简短条目（如果缺少则创建一个）。

## 相关

- [测试](/help/testing)
- [实时测试](/help/testing-live)
