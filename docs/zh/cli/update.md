---
title: "`openclaw update`"
sidebarTitle: "openclaw update"
mmh3_hash: "f0ad4cb251126c423601f5111fcfd48b"
summary: "`openclaw update` 的 CLI 参考(相对安全的源更新 + Gateway自动重启)"
read_when:
  - 您想安全地更新源检出
  - 您需要了解 `--update` 简写行为
---

# `openclaw update`

安全地更新 OpenClaw 并在 stable/beta/dev Channel之间切换。

如果您通过 **npm/pnpm** 安装(全局安装,无 git 元数据),更新通过 [更新](/install/updating) 中的包管理器流程进行。

## 用法

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --no-restart
openclaw update --json
openclaw --update
```

## 选项

- `--no-restart`:成功更新后跳过重启Gateway服务。
- `--channel <stable|beta|dev>`:设置更新Channel(git + npm;在配置中持久化)。
- `--tag <dist-tag|version>`:仅覆盖此更新的 npm dist-tag 或版本。
- `--json`:打印机器可读的 `UpdateRunResult` JSON。
- `--timeout <seconds>`:每步超时(默认为 1200 秒)。

注意:降级需要确认,因为较旧的版本可能会破坏配置。

## `update status`

显示活动更新Channel + git 标签/分支/SHA(用于源检出),以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项:
- `--json`:打印机器可读的状态 JSON。
- `--timeout <seconds>`:检查超时(默认为 3 秒)。

## `update wizard`

交互流程以选择更新Channel并确认在更新后是否重启Gateway
(默认是重启)。如果您在没有 git 检出的情况下选择 `dev`,它会
提供创建一个。

## 它的作用

当您明确切换Channel(`--channel ...`)时,OpenClaw 还保持
安装方法对齐:

- `dev` → 确保 git 检出(默认:`~/openclaw`,使用 `OPENCLAW_GIT_DIR` 覆盖),
  更新它,并从该检出安装全局 CLI。
- `stable`/`beta` → 使用匹配的 dist-tag 从 npm 安装。

## Git 检出流程

Channel:

- `stable`:检出最新的非 beta 标签,然后构建 + doctor。
- `beta`:检出最新的 `-beta` 标签,然后构建 + doctor。
- `dev`:检出 `main`,然后获取 + 变基。

高级:

1. 需要干净的工作树(无未提交的更改)。
2. 切换到选定的Channel(标签或分支)。
3. 获取上游(仅限 dev)。
4. 仅限 Dev:在临时工作树中进行预检 lint + TypeScript 构建;如果提示失败,则向后走最多 10 次提交以找到最新的干净构建。
5. 变基到选定的提交(仅限 dev)。
6. 安装依赖项(首选 pnpm;npm 回退)。
7. 构建 + 构建控制 UI。
8. 运行 `openclaw doctor` 作为最终"安全更新"检查。
9. 将插件同步到活动Channel(dev 使用捆绑扩展;stable/beta 使用 npm)并更新 npm 安装的插件。

## `--update` 简写

`openclaw --update` 重写为 `openclaw update`(对 shell 和启动器脚本有用)。

## 另请参阅

- `openclaw doctor`(在 git 检出时首先提供运行更新)
- [开发Channel](/install/development-channels)
- [更新](/install/updating)
- [CLI 参考](/cli)
