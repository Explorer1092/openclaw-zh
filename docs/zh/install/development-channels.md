---
title: "开发频道"
mmh3_hash: "2c585945d1bad7c8ddc1649a2b665637"
summary: "稳定版、测试版和开发版频道：语义、切换和标记"
read_when:
  - 你想要在稳定版/测试版/开发版之间切换
  - 你正在标记或发布预发布版本
---

# 开发频道

最后更新：2026-01-21

OpenClaw 发布三个更新频道：

- **stable (稳定版)**: npm dist-tag `latest`。
- **beta (测试版)**: npm dist-tag `beta` (测试中的构建)。
- **dev (开发版)**: `main` (git) 的移动头。npm dist-tag: `dev` (当发布时)。

我们将构建发布到 **beta**，测试它们，然后 **将经过审查的构建提升到 `latest`** 而不更改版本号 —— dist-tags 是 npm 安装的事实来源。

## 切换频道

Git checkout:

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

- `stable`/`beta` 检出最新的匹配标签（通常是相同的标签）。
- `dev` 切换到 `main` 并在上游进行变基。

npm/pnpm 全局安装：

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

这将通过相应的 npm dist-tag (`latest`, `beta`, `dev`) 进行更新。

当你使用 `--channel` **显式** 切换频道时，OpenClaw 也会对齐安装方法：

- `dev` 确保 git checkout（默认 `~/openclaw`，使用 `OPENCLAW_GIT_DIR` 覆盖），更新它，并从该 checkout 安装全局 CLI。
- `stable`/`beta` 使用匹配的 dist-tag 从 npm 安装。

提示：如果你想要并行 stable + dev，请保留两个克隆并将你的网关指向 stable 的那个。

## 插件和频道

当你使用 `openclaw update` 切换频道时，OpenClaw 也会同步插件源：

- `dev` 首选来自 git checkout 的捆绑插件。
- `stable` 和 `beta` 恢复 npm 安装的插件包。

## 标记最佳实践

- 标记你希望 git checkout 登陆的版本（`vYYYY.M.D` 或 `vYYYY.M.D-<patch>`）。
- 保持标签不可变：永远不要移动或重用标签。
- npm dist-tags 仍然是 npm 安装的事实来源：
  - `latest` → stable
  - `beta` → 候选构建
  - `dev` → main 快照 (可选)

## macOS 应用可用性

Beta 和 dev 构建可能 **不** 包含 macOS 应用发布。这没关系：

- git 标签和 npm dist-tag 仍然可以发布。
- 在发行说明或变更日志中注明“此 beta 没有 macOS 构建”。
