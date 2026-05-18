---
mmh3_hash: "a2d40cc019f3e986b6da1f06a2dcf458"
summary: "查找和发布社区维护的 OpenClaw Plugin"
read_when:
  - 您想查找第三方 OpenClaw Plugin
  - 您想在 ClawHub 上发布或列出您自己的 Plugin
title: "社区 Plugin"
doc-schema-version: 1
---

社区 Plugin 是第三方包，通过 Channel、工具、Provider、Hook 或其他能力扩展 OpenClaw。使用 [ClawHub](/clawhub) 作为公共社区 Plugin 的主要发现表面。

## 查找 Plugin

从 CLI 搜索 ClawHub：

```bash
openclaw plugins search "calendar"
```

使用显式来源前缀安装 ClawHub Plugin：

```bash
openclaw plugins install clawhub:<package-name>
```

在发布切换期间，npm 仍是支持的直接安装路径：

```bash
openclaw plugins install npm:<package-name>
```

有关常见的安装、更新、检查和卸载示例，请参见 [管理 Plugin](/plugins/manage-plugins)。有关完整的命令参考和来源选择规则，请参见 [`openclaw plugins`](/cli/plugins)。

## 发布 Plugin

当您希望 OpenClaw 用户发现并安装您的 Plugin 时，请在 ClawHub 上发布公共社区 Plugin。ClawHub 拥有实时包列表、发布历史、扫描状态和安装提示；文档不维护静态的第三方 Plugin 目录。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

在发布之前，请确保 Plugin 具有包元数据、Plugin Manifest、设置文档和明确的维护所有者。ClawHub 在创建发布之前会验证所有者范围、包名、版本、文件限制和来源元数据，然后在审查和验证完成之前将新发布隐藏在正常的安装和下载表面之外。

发布前请使用以下检查清单：

| 要求          | 原因                                                 |
| -------------------- | --------------------------------------------------- |
| 在 ClawHub 上发布 | 用户需要 `openclaw plugins install` 提示才能工作 |
| 公开的 GitHub 仓库   | 源代码审查、问题跟踪、透明度         |
| 设置和使用文档 | 用户需要知道如何配置它              |
| 积极维护   | 近期更新或响应式问题处理         |

使用以下页面了解完整的发布契约：

- [ClawHub 发布](/clawhub/publishing) 解释所有者、范围、发布、审查、包验证和包转让。
- [构建 Plugin](/plugins/building-plugins) 展示 Plugin 包形状和首次发布工作流程。
- [Plugin Manifest](/plugins/manifest) 定义原生 Plugin Manifest 字段。

## 相关

- [Plugin](/tools/plugin) - 安装、配置、重启和故障排除
- [管理 Plugin](/plugins/manage-plugins) - 命令示例
- [ClawHub 发布](/clawhub/publishing) - 发布和版本规则
