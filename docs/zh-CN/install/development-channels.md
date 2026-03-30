---
read_when:
  - 你想在 stable/beta/dev 之间切换
  - 你正在标记或发布预发布版本
summary: stable、beta 和 dev 渠道：语义、切换和标签
title: 开发渠道
x-i18n:
  generated_at: "2026-02-03T10:07:21Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 3551792e4cbd18733c7b1029dc7699df2763ffac0de2ca0bbe624e68d9fad160
  source_path: install/development-channels.md
  workflow: 15
---

# 开发渠道

最后更新：2026-01-21

OpenClaw 提供三个更新渠道：

- **stable**：npm dist-tag `latest`。
- **beta**：npm dist-tag `beta`（测试中的构建）。
- **dev**：`main` 的移动头（git）。npm dist-tag：`dev`（发布时）。

我们将构建发布到 **beta**，进行测试，然后**将经过验证的构建提升到 `latest`**，
版本号不变——dist-tag 是 npm 安装的数据源。

## 切换渠道

Git checkout：

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

- `stable`/`beta` 检出最新匹配的标签（通常是同一个标签）。
- `dev` 切换到 `main` 并在上游基础上 rebase。

npm/pnpm 全局安装：

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

这会通过相应的 npm dist-tag（`latest`、`beta`、`dev`）进行更新。

当你使用 `--channel` **显式**切换渠道时，OpenClaw 还会对齐安装方式：

- `dev` 确保有一个 git checkout（默认 `~/openclaw`，可通过 `OPENCLAW_GIT_DIR` 覆盖），
  更新它，并从该 checkout 安装全局 CLI。
- `stable`/`beta` 使用匹配的 dist-tag 从 npm 安装。

提示：如果你想同时使用 stable + dev，保留两个克隆并将 Gateway 网关指向 stable 那个。

## 单次版本或标签目标

使用 `--tag` 针对特定 dist-tag、版本或包规格进行单次更新，**不改变**你持久化的渠道：

```bash
# 安装特定版本
openclaw update --tag 2026.3.30-beta.1

# 从 beta dist-tag 安装（单次，不持久化）
openclaw update --tag beta

# 从 GitHub main 分支安装（npm tarball）
openclaw update --tag main

# 安装特定 npm 包规格
openclaw update --tag openclaw@2026.3.30-beta.1
```

注意事项：

- `--tag` **仅适用于包（npm）安装**。Git 安装会忽略它。
- 标签不会持久化。下次 `openclaw update` 仍使用你配置的渠道。
- 降级保护：如果目标版本比当前版本旧，OpenClaw 会提示确认（用 `--yes` 跳过）。

## 试运行

预览 `openclaw update` 的操作而不实际执行：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.3.30-beta.1 --dry-run
openclaw update --dry-run --json
```

试运行会显示有效渠道、目标版本、计划操作，以及是否需要降级确认。

## 插件和渠道

当你使用 `openclaw update` 切换渠道时，OpenClaw 还会同步插件来源：

- `dev` 优先使用 git checkout 中的内置插件。
- `stable` 和 `beta` 恢复 npm 安装的插件包。
- npm 安装的插件在核心更新完成后更新。

## 检查当前状态

```bash
openclaw update status
```

显示活跃渠道、安装类型（git 或包）、当前版本，以及来源（配置、git 标签、git 分支或默认值）。

## 标签最佳实践

- 为发布版本打标签（stable 用 `vYYYY.M.D`，beta 用 `vYYYY.M.D-beta.N`）。
- `vYYYY.M.D.beta.N` 也可识别（兼容），但推荐使用 `-beta.N`。
- 遗留的 `vYYYY.M.D-<patch>` 标签仍被识别为 stable（非 beta）。
- 保持标签不可变：永远不要移动或重用标签。
- npm dist-tag 仍然是 npm 安装的数据源：
  - `latest` → stable
  - `beta` → 候选构建
  - `dev` → main 快照（可选）

## macOS 应用可用性

Beta 和 dev 构建可能**不**包含 macOS 应用发布。这没问题：

- git 标签和 npm dist-tag 仍然可以发布。
- 在发布说明或变更日志中注明"此 beta 无 macOS 构建"。
