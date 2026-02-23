---
mmh3_hash: "0c0a8f881ab66f27b79ca45b082e4ae0"
title: "社区插件"
summary: "社区插件：质量标准、托管要求与 PR 提交路径"
read_when:
  - 希望发布第三方 OpenClaw 插件
  - 希望将插件提交到文档列表
---

# 社区插件

本页追踪 OpenClaw 的高质量**社区维护插件**。

满足质量标准的社区插件可通过 PR 添加至此处。

## 列入要求

- 插件包已发布到 npmjs（可通过 `openclaw plugins install <npm-spec>` 安装）。
- 源代码托管在 GitHub（公开仓库）。
- 仓库包含设置/使用文档及问题追踪器。
- 插件具有明确的维护信号（活跃维护者、近期更新或积极响应的问题处理）。

## 如何提交

提交一个 PR，将你的插件添加到本页，需包含：

- 插件名称
- npm 包名
- GitHub 仓库 URL
- 一行描述
- 安装命令

## 审核标准

我们倾向于收录实用、有文档且安全可操作的插件。
低质量的封装、所有权不明确或无人维护的包可能会被拒绝。

## 候选格式

添加条目时请使用以下格式：

- **插件名称** — 简短描述
  npm: `@scope/package`
  repo: `https://github.com/org/repo`
  install: `openclaw plugins install @scope/package`
