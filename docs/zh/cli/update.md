---
title: "`openclaw update`"
sidebarTitle: "openclaw update"
mmh3_hash: "77e46d7f8628098bae2c082a3ca94a37"
summary: "`openclaw update` 的 CLI 参考(相对安全的源更新 + Gateway 自动重启)"
read_when:
  - 您想安全地更新源检出
  - 您需要了解 `--update` 简写行为
---

# `openclaw update`

安全地更新 OpenClaw 并在 stable/beta/dev Channel 之间切换。

如果您通过 **npm/pnpm** 安装(全局安装,无 git 元数据),更新通过[更新](/install/updating)中的包管理器流程进行。

## 用法

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --json
openclaw --update
```

## 选项

- `--no-restart`:成功更新后跳过重启 Gateway 服务。
- `--channel <stable|beta|dev>`:设置更新 Channel(git + npm;在配置中持久化)。
- `--tag <dist-tag|version|spec>`:仅覆盖此次更新的包目标。对于包安装,`main` 映射到 `github:openclaw/openclaw#main`。
- `--dry-run`:预览计划的更新操作(Channel/标签/目标/重启流程),而不写入配置、安装、同步插件或重启。
- `--json`:打印机器可读的 `UpdateRunResult` JSON。
- `--timeout <seconds>`:每步超时(默认为 1200 秒)。
- `--yes`:跳过确认提示(例如降级确认)

注意:降级需要确认,因为较旧的版本可能会破坏配置。

## `update status`

显示活动更新 Channel + git 标签/分支/SHA(用于源检出),以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项:

- `--json`:打印机器可读的状态 JSON。
- `--timeout <seconds>`:检查超时(默认为 3 秒)。

## `update wizard`

交互流程以选择更新 Channel 并确认在更新后是否重启 Gateway(默认是重启)。如果您在没有 git 检出的情况下选择 `dev`,它会提供创建一个。

选项:

- `--timeout <seconds>`:每个更新步骤的超时(默认 `1200`)

## 它的作用

当您明确切换 Channel(`--channel ...`)时,OpenClaw 还保持安装方法对齐:

- `dev` → 确保 git 检出(默认:`~/openclaw`,使用 `OPENCLAW_GIT_DIR` 覆盖),更新它,并从该检出安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm dist-tag `beta`,但当 beta 缺失或比当前稳定版本旧时,回退到 `latest`。

Gateway 核心自动更新器(通过配置启用时)复用此相同的更新路径。

## Git 检出流程

Channel:

- `stable`:检出最新的非 beta 标签,然后构建 + doctor。
- `beta`:优先选择最新的 `-beta` 标签,但当 beta 缺失或比最新稳定标签旧时回退到最新稳定标签。
- `dev`:检出 `main`,然后获取 + 变基。

高级:

1. 需要干净的工作树(无未提交的更改)。
2. 切换到选定的 Channel(标签或分支)。
3. 获取上游(仅限 dev)。
4. 仅限 Dev:在临时工作树中进行预检 lint + TypeScript 构建;如果提示失败,则向后走最多 10 次提交以找到最新的干净构建。
5. 变基到选定的提交(仅限 dev)。
6. 使用仓库包管理器安装依赖项。对于 pnpm 检出,更新器按需引导 `pnpm`(首先通过 `corepack`,然后使用临时 `npm install pnpm@10` 回退),而不是在 pnpm 工作区内运行 `npm run build`。
7. 构建 + 构建控制 UI。
8. 运行 `openclaw doctor` 作为最终"安全更新"检查。
9. 将插件同步到活动 Channel(dev 使用捆绑扩展;stable/beta 使用 npm)并更新 npm 安装的插件。

如果 pnpm 引导仍然失败,更新器现在会提前停止并显示特定于包管理器的错误,而不是尝试在检出内运行 `npm run build`。

## `--update` 简写

`openclaw --update` 重写为 `openclaw update`(对 shell 和启动器脚本有用)。

## 另请参阅

- `openclaw doctor`(在 git 检出时首先提供运行更新)
- [开发 Channel](/install/development-channels)
- [更新](/install/updating)
- [CLI 参考](/cli)
