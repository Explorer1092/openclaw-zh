---
title: "`openclaw update`"
sidebarTitle: "openclaw update"
mmh3_hash: "38ea6fbbc759bf4c81ec345e5ab51bda"
summary: "`openclaw update` 的 CLI 参考(相对安全的源更新 + Gateway 自动重启)"
read_when:
  - 您想安全地更新源检出
  - 您需要了解 `--update` 简写行为
---

# `openclaw update`

安全地更新 OpenClaw 并在 stable/beta/dev Channel 之间切换。

如果您通过 **npm/pnpm/bun** 安装(全局安装,无 git 元数据),更新通过[更新](/install/updating)中的包管理器流程进行。

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
openclaw update --yes
openclaw update --json
openclaw --update
```

## 选项

- `--no-restart`:成功更新后跳过重启 Gateway 服务。执行重启的包管理器更新会在命令成功前验证重启的服务是否报告了预期的更新版本。
- `--channel <stable|beta|dev>`:设置更新 Channel(git + npm;在配置中持久化)。
- `--tag <dist-tag|version|spec>`:仅覆盖此次更新的包目标。对于包安装,`main` 映射到 `github:openclaw/openclaw#main`。
- `--dry-run`:预览计划的更新操作(Channel/标签/目标/重启流程),而不写入配置、安装、同步插件或重启。
- `--json`:打印机器可读的 `UpdateRunResult` JSON,包括在更新后插件同步期间检测到 npm 插件构件漂移时的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`:每步超时(默认为 1800 秒)。
- `--yes`:跳过确认提示(例如降级确认)。

<Warning>
降级需要确认,因为较旧的版本可能会破坏配置。
</Warning>

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

- `--timeout <seconds>`:每个更新步骤的超时(默认 `1800`)

## 它的作用

当您明确切换 Channel(`--channel ...`)时,OpenClaw 还保持安装方法对齐:

- `dev` → 确保 git 检出(默认:`~/openclaw`,使用 `OPENCLAW_GIT_DIR` 覆盖),更新它,并从该检出安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm dist-tag `beta`,但当 beta 缺失或比当前稳定版本旧时,回退到 `latest`。

Gateway 核心自动更新器(通过配置启用时)复用此相同的更新路径。

对于包管理器安装,`openclaw update` 在调用包管理器之前解析目标包版本。即使已安装版本与目标匹配,命令也会刷新全局包安装,然后运行插件同步、核心命令补全刷新和重启工作。这使打包的附属组件和 Channel 拥有的插件记录与已安装的 OpenClaw 构建保持一致,同时将完整的插件命令补全重建留给显式的 `openclaw completion --write-state` 运行。

## Git 检出流程

### Channel 选择

- `stable`:检出最新的非 beta 标签,然后构建 + doctor。
- `beta`:优先选择最新的 `-beta` 标签,但当 beta 缺失或比最新稳定标签旧时回退到最新稳定标签。
- `dev`:检出 `main`,然后获取 + 变基。

### 更新步骤

<Steps>
  <Step title="验证干净的工作树">
    需要无未提交的更改。
  </Step>
  <Step title="切换 Channel">
    切换到选定的 Channel(标签或分支)。
  </Step>
  <Step title="获取上游">
    仅限 dev。
  </Step>
  <Step title="预检构建(仅限 dev)">
    在临时工作树中运行 lint 和 TypeScript 构建。如果提示失败,则向后走最多 10 次提交以找到最新的干净构建。
  </Step>
  <Step title="变基">
    变基到选定的提交(仅限 dev)。
  </Step>
  <Step title="安装依赖项">
    使用仓库包管理器。对于 pnpm 检出,更新器按需引导 `pnpm`(首先通过 `corepack`,然后使用临时 `npm install pnpm@10` 回退),而不是在 pnpm 工作区内运行 `npm run build`。
  </Step>
  <Step title="构建 Control UI">
    构建 Gateway 和 Control UI。
  </Step>
  <Step title="运行 doctor">
    `openclaw doctor` 作为最终安全更新检查运行。
  </Step>
  <Step title="同步插件">
    将插件同步到活动 Channel。Dev 使用捆绑插件;stable 和 beta 使用 npm。更新 npm 安装的插件。
  </Step>
</Steps>

<Warning>
如果精确固定的 npm 插件更新解析到完整性与存储的安装记录不同的构件,`openclaw update` 会中止该插件构件更新而不是安装它。仅在验证您信任新构件后,才显式重新安装或更新插件。
</Warning>

<Note>
更新后的插件同步失败会使更新结果失败并停止重启后续工作。修复插件安装或更新错误,然后重新运行 `openclaw update`。

当更新后的 Gateway 启动时,已启用的捆绑插件运行时依赖项在插件激活前会被暂存。更新触发的重启会在关闭 Gateway 前排空所有正在进行的运行时依赖项暂存,因此服务管理器重启不会中断正在进行的 npm 安装。

如果 pnpm 引导仍然失败,更新器会提前停止并显示特定于包管理器的错误,而不是尝试在检出内运行 `npm run build`。
</Note>

## `--update` 简写

`openclaw --update` 重写为 `openclaw update`(对 shell 和启动器脚本有用)。

## 相关

- `openclaw doctor`(在 git 检出时首先提供运行更新)
- [开发 Channel](/install/development-channels)
- [更新](/install/updating)
- [CLI 参考](/cli)
