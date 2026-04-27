---
mmh3_hash: "ac002199e0ddcc324a049a55291d502c"
title: "脚本"
summary: "仓库脚本：目的、范围和安全注意事项"
read_when:
  - 从仓库运行脚本
  - 在 ./scripts 下添加或更改脚本
---

# 脚本

`scripts/` 目录包含用于本地工作流和运维任务的辅助脚本。当任务明确与脚本相关时使用这些脚本；否则优先使用 CLI。

## 约定

- 脚本是**可选的**，除非在文档或发布检查清单中引用。
- 当存在 CLI 界面时优先使用（示例：认证监控使用 `openclaw models status --check`）。
- 假设脚本是特定于主机的；在新机器上运行之前先阅读它们。

## 认证监控脚本

认证监控在[认证](/gateway/authentication)中有说明。`scripts/` 下的脚本是 systemd/Termux 手机工作流的可选附加项。

## GitHub 读取助手

当你希望 `gh` 使用 GitHub App 安装 token 进行仓库范围的读取调用，同时将普通 `gh` 保留在个人登录用于写入操作时，使用 `scripts/gh-read`。

必需的 env 变量：

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

可选的 env 变量：

- `OPENCLAW_GH_READ_INSTALLATION_ID`：当你想跳过基于仓库的安装查找时使用
- `OPENCLAW_GH_READ_PERMISSIONS`：以逗号分隔的覆盖，用于请求的读取权限子集

仓库解析顺序：

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

示例：

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## 添加脚本时

- 保持脚本专注且有文档。
- 在相关文档中添加简短条目（如果缺失则创建）。

## 相关

- [测试](/help/testing)
- [实时测试](/help/testing-live)
