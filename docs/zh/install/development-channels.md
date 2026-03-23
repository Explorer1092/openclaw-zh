---
mmh3_hash: "286017540e13d6966509e1920ac3f8da"
title: "发布频道"
sidebarTitle: "发布频道"
summary: "稳定版、测试版和开发版频道：语义、切换、固定版本和标记"
read_when:
  - 你想在稳定版/测试版/开发版之间切换
  - 你想固定特定版本、标签或 SHA
  - 你正在标记或发布预发布版本
---

# 开发频道

OpenClaw 发布三个更新频道：

- **stable（稳定版）**：npm dist-tag `latest`。推荐大多数用户使用。
- **beta（测试版）**：npm dist-tag `beta`（测试中的构建）。
- **dev（开发版）**：`main`（git）的移动头。npm dist-tag：`dev`（当发布时）。
  `main` 分支用于实验和活跃开发。可能包含不完整的功能或破坏性变更。请勿将其用于生产 Gateway。

我们将构建发布到 **beta**，测试它们，然后**将经过审查的构建提升到 `latest`** 而不更改版本号 —— dist-tags 是 npm 安装的事实来源。

## 切换频道

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 会将你的选择持久化到配置中（`update.channel`）并对齐安装方法：

- **`stable`/`beta`**（包安装）：通过匹配的 npm dist-tag 更新。
- **`stable`/`beta`**（git 安装）：检出最新匹配的 git 标签。
- **`dev`**：确保 git checkout（默认 `~/openclaw`，使用 `OPENCLAW_GIT_DIR` 覆盖），切换到 `main`，在上游进行变基，构建，并从该 checkout 安装全局 CLI。

提示：如果你想要并行 stable + dev，保留两个克隆并将 Gateway 指向 stable 的那个。

## 一次性版本或标签指定

使用 `--tag` 针对特定 dist-tag、版本或包规范进行单次更新，**不会**更改持久化的频道：

```bash
# 安装特定版本
openclaw update --tag 2026.3.22

# 从 beta dist-tag 安装（一次性，不持久化）
openclaw update --tag beta

# 从 GitHub main 分支安装（npm tarball）
openclaw update --tag main

# 安装特定的 npm 包规范
openclaw update --tag openclaw@2026.3.22
```

注意：

- `--tag` 仅适用于**包（npm）安装**。git 安装会忽略它。
- 标签不持久化。下次 `openclaw update` 将按常规使用你配置的频道。
- 降级保护：如果目标版本比当前版本旧，OpenClaw 会提示确认（使用 `--yes` 跳过）。

## 预演

预览 `openclaw update` 会做什么而不实际应用更改：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.3.22 --dry-run
openclaw update --dry-run --json
```

预演会显示有效频道、目标版本、计划操作以及是否需要降级确认。

## 插件和频道

当你使用 `openclaw update` 切换频道时，OpenClaw 也会同步插件源：

- `dev` 首选来自 git checkout 的捆绑插件。
- `stable` 和 `beta` 恢复 npm 安装的插件包。
- 核心更新完成后更新 npm 安装的插件。

## 检查当前状态

```bash
openclaw update status
```

显示活跃频道、安装类型（git 或包）、当前版本以及来源（配置、git 标签、git 分支或默认值）。

## 标记最佳实践

- 标记你希望 git checkout 登陆的版本（stable 用 `vYYYY.M.D`，beta 用 `vYYYY.M.D-beta.N`）。
- `vYYYY.M.D.beta.N` 也被识别以保持兼容性，但首选 `-beta.N`。
- 旧版 `vYYYY.M.D-<patch>` 标签仍被识别为 stable（非 beta）。
- 保持标签不可变：永远不要移动或重用标签。
- npm dist-tags 仍然是 npm 安装的事实来源：
  - `latest` → stable
  - `beta` → 候选构建
  - `dev` → main 快照（可选）

## macOS 应用可用性

Beta 和 dev 构建可能**不**包含 macOS 应用发布。这没关系：

- git 标签和 npm dist-tag 仍然可以发布。
- 在发行说明或变更日志中注明"此 beta 没有 macOS 构建"。
