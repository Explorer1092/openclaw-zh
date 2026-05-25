---
mmh3_hash: "979ed4dd04de3d290cb953b0addf0d2a"
title: "发布频道"
sidebarTitle: "发布频道"
summary: "稳定版、测试版和开发版频道：语义、切换、固定版本和标记"
read_when:
  - 你想在稳定版/测试版/开发版之间切换
  - 你想固定特定版本、标签或 SHA
  - 你正在标记或发布预发布版本
---

OpenClaw 提供三个更新频道：

- **stable**：npm dist-tag `latest`。推荐大多数用户使用。
- **beta**：当其为最新时，npm dist-tag 为 `beta`；如果 beta 缺失或比最新稳定版旧，更新流程将回退到 `latest`。
- **dev**：`main` 的移动头（git）。npm dist-tag：`dev`（发布时）。`main` 分支用于实验和积极开发，可能包含不完整的功能或重大更改。不要将其用于生产 gateway。

我们通常先将稳定版构建发布到 **beta**，在那里测试，然后运行明确的推广步骤，将经过验证的构建移动到 `latest`，而不更改版本号。维护者也可以在需要时直接将稳定版本发布到 `latest`。dist-tag 是 npm 安装的事实来源。

## 切换频道

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 将你的选择持久化到配置中（`update.channel`），并对齐安装方式：

- **`stable`**（包安装）：通过 npm dist-tag `latest` 更新。
- **`beta`**（包安装）：优先使用 npm dist-tag `beta`，但当 `beta` 缺失或比当前稳定标签旧时，回退到 `latest`。
- **`stable`**（git 安装）：检出最新的稳定 git 标签。
- **`beta`**（git 安装）：优先使用最新的 beta git 标签，但当 beta 缺失或比最新稳定标签旧时，回退到最新稳定 git 标签。
- **`dev`**：确保 git 检出（默认 `~/openclaw`，或在设置了 `OPENCLAW_HOME` 时为 `$OPENCLAW_HOME/openclaw`；可通过 `OPENCLAW_GIT_DIR` 覆盖），切换到 `main`，在上游变基，构建并从该检出安装全局 CLI。

<Tip>
如果你想同时使用稳定版和开发版，保留两个克隆，并将你的 gateway 指向稳定版。
</Tip>

## 一次性版本或标签定位

使用 `--tag` 定位特定 dist-tag、版本或包规范，用于单次更新，**不会**更改你持久化的频道：

```bash
# 安装特定版本
openclaw update --tag 2026.4.1-beta.1

# 从 beta dist-tag 安装（一次性，不持久化）
openclaw update --tag beta

# 切换到移动的 GitHub main 检出
openclaw update --channel dev

# 安装特定 npm 包规范
openclaw update --tag openclaw@2026.4.1-beta.1

# 一次性从 GitHub main 安装而不持久化频道
openclaw update --tag main
```

注意：

- `--tag` **仅适用于包（npm）安装**。git 安装会忽略它。
- 标签不会持久化。你的下一次 `openclaw update` 将照常使用你配置的频道。
- 对于包安装，OpenClaw 在暂存 npm 安装之前将 GitHub/git 源规范预先打包成临时 tarball。当你希望移动的 `main` 检出作为持久安装时，请使用 `--channel dev` 或 `--install-method git --version main`。
- 降级保护：如果目标版本比你当前版本旧，OpenClaw 会提示确认（使用 `--yes` 跳过）。
- `--channel beta` 与 `--tag beta` 不同：频道流程在 beta 缺失或比稳定版旧时可以回退到 stable/latest，而 `--tag beta` 针对该次运行的原始 `beta` dist-tag。

## 试运行

预览 `openclaw update` 将执行的操作而不实际应用更改：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

试运行显示有效频道、目标版本、计划操作，以及是否需要降级确认。

## Plugin 和频道

当你使用 `openclaw update` 切换频道时，OpenClaw 也会同步 plugin 来源：

- `dev` 优先使用 git 检出中的捆绑 plugin。
- `stable` 和 `beta` 恢复 npm 安装的 plugin 包。
- npm 安装的 plugin 在核心更新完成后更新。

## 检查当前状态

```bash
openclaw update status
```

显示活动频道、安装类型（git 或包）、当前版本和来源（配置、git 标签、git 分支或默认值）。

## 标记最佳实践

- 标记你希望 git 检出使用的版本（稳定版使用 `vYYYY.M.D`，beta 使用 `vYYYY.M.D-beta.N`）。
- `vYYYY.M.D.beta.N` 也可识别以保持兼容性，但优先使用 `-beta.N`。
- 旧版 `vYYYY.M.D-<patch>` 标签仍被识别为稳定版（非 beta）。
- 保持标签不可变：永不移动或重用标签。
- npm dist-tag 仍然是 npm 安装的事实来源：
  - `latest` -> 稳定版
  - `beta` -> 候选构建或 beta 优先稳定构建
  - `dev` -> main 快照（可选）

## macOS 应用可用性

Beta 和开发版构建**可能不**包含 macOS 应用发布。这没关系：

- git 标签和 npm dist-tag 仍然可以发布。
- 在发布说明或更新日志中注明"此 beta 无 macOS 构建"。

## 相关

- [更新](/install/updating)
- [安装程序内部](/install/installer)
