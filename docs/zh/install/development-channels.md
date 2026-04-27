---
mmh3_hash: "491121c08c4aa4dacd0d2a5b383c4957"
title: "发布频道"
sidebarTitle: "发布频道"
summary: "稳定版、测试版和开发版频道：语义、切换、固定版本和标记"
read_when:
  - 你想在稳定版/测试版/开发版之间切换
  - 你想固定特定版本、标签或 SHA
  - 你正在标记或发布预发布版本
---

# 开发频道

OpenClaw 提供三个更新频道：

- **stable**：npm dist-tag `latest`。推荐大多数用户使用。
- **beta**：npm dist-tag `beta`（当前可用时）；如果 beta 缺失或比最新的稳定版发布更旧，更新流程会回退到 `latest`。
- **dev**：`main` 的移动头（git）。npm dist-tag：`dev`（发布时）。
  `main` 分支用于实验和活跃开发。它可能包含不完整的功能或破坏性更改。不要用于生产 gateway。

我们通常先将稳定构建发布到 **beta**，在那里测试，然后运行一个明确的提升步骤，将经过验证的构建移动到 `latest`，而不更改版本号。维护者在需要时也可以直接将稳定版发布到 `latest`。Dist-tag 是 npm 安装的事实来源。

## 切换频道

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 将你的选择持久化到配置中（`update.channel`）并调整安装方法：

- **`stable`**（包安装）：通过 npm dist-tag `latest` 更新。
- **`beta`**（包安装）：优先使用 npm dist-tag `beta`，但当 `beta` 缺失或比当前稳定标签更旧时回退到 `latest`。
- **`stable`**（git 安装）：检出最新的稳定 git 标签。
- **`beta`**（git 安装）：优先使用最新的 beta git 标签，但当 beta 缺失或更旧时回退到最新的稳定 git 标签。
- **`dev`**：确保 git 检出（默认 `~/openclaw`，用 `OPENCLAW_GIT_DIR` 覆盖），切换到 `main`，在上游变基，构建，并从该检出安装全局 CLI。

<Tip>
如果你想同时使用 stable 和 dev，保留两个克隆并将你的 gateway 指向稳定的那个。
</Tip>

## 一次性版本或标签定位

使用 `--tag` 为单次更新定位特定 dist-tag、版本或包规格，**不**更改你持久化的频道：

```bash
# 安装特定版本
openclaw update --tag 2026.4.1-beta.1

# 从 beta dist-tag 安装（一次性，不持久化）
openclaw update --tag beta

# 从 GitHub main 分支安装（npm 压缩包）
openclaw update --tag main

# 安装特定 npm 包规格
openclaw update --tag openclaw@2026.4.1-beta.1
```

注意：

- `--tag` 仅适用于**包（npm）安装**。Git 安装会忽略它。
- 标签不会持久化。你的下一次 `openclaw update` 会像往常一样使用你配置的频道。
- 降级保护：如果目标版本比你的当前版本更旧，OpenClaw 会提示确认（用 `--yes` 跳过）。
- `--channel beta` 与 `--tag beta` 不同：频道流程在 beta 缺失或更旧时可以回退到稳定/latest，而 `--tag beta` 在该次运行中定位原始的 `beta` dist-tag。

## 试运行

预览 `openclaw update` 将做什么而不实际做任何更改：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

试运行显示有效频道、目标版本、计划的操作，以及是否需要降级确认。

## 插件和 channels

当你用 `openclaw update` 切换频道时，OpenClaw 也会同步插件来源：

- `dev` 优先使用 git 检出中的捆绑插件。
- `stable` 和 `beta` 恢复 npm 安装的插件包。
- npm 安装的插件在核心更新完成后更新。

## 检查当前状态

```bash
openclaw update status
```

显示活跃频道、安装类型（git 或包）、当前版本和来源（配置、git 标签、git 分支或默认值）。

## 标记最佳实践

- 标记你希望 git 检出落在的版本（稳定版用 `vYYYY.M.D`，beta 用 `vYYYY.M.D-beta.N`）。
- `vYYYY.M.D.beta.N` 也被识别以兼容，但优先使用 `-beta.N`。
- 旧版 `vYYYY.M.D-<patch>` 标签仍然被识别为稳定版（非 beta）。
- 保持标签不可变：永远不要移动或重用标签。
- npm dist-tag 仍然是 npm 安装的事实来源：
  - `latest` -> 稳定版
  - `beta` -> 候选构建或 beta 优先的稳定构建
  - `dev` -> main 快照（可选）

## macOS 应用可用性

Beta 和 dev 构建**可能**不包含 macOS 应用发布。这没问题：

- git 标签和 npm dist-tag 仍然可以发布。
- 在发布说明或变更日志中注明"此 beta 没有 macOS 构建"。

## 相关

- [更新](/install/updating)
- [安装器内部](/install/installer)
