---
mmh3_hash: "a91ac97f7f0c0b2afc442b59606c5295"
summary: "`openclaw update` 的 CLI 参考（相对安全的源更新 + Gateway 自动重启）"
read_when:
  - 您想安全地更新源代码检出
  - 您正在调试 `openclaw update` 输出或选项
  - 您需要了解 `--update` 简写行为
title: "Update"
---

# `openclaw update`

安全地更新 OpenClaw 并在稳定/测试版/开发渠道之间切换。

如果您通过 **npm/pnpm/bun** 安装（全局安装，无 git 元数据），更新通过[更新](/install/updating)中的包管理器流程进行。

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

- `--no-restart`：成功更新后跳过重启 Gateway 服务。确实重启 Gateway 的包管理器更新会在命令成功之前验证重启后的服务报告了预期的更新版本。
- `--channel <stable|beta|dev>`：设置更新渠道（git + npm；在配置中持久化）。
- `--tag <dist-tag|version|spec>`：仅为本次更新覆盖包目标。对于包安装，`main` 映射到 `github:openclaw/openclaw#main`。
- `--dry-run`：预览计划的更新操作（渠道/标签/目标/重启流程），不写入配置、安装、同步 Plugin 或重启。
- `--json`：打印机器可读的 `UpdateRunResult` JSON，包括当核心更新成功后损坏或无法加载的托管 Plugin 需要修复时的 `postUpdate.plugins.warnings`，以及在更新后 Plugin 同步期间检测到 npm Plugin 工件漂移时的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每步超时（默认 1800 秒）。
- `--yes`：跳过确认提示（例如降级确认）。

`openclaw update` 没有 `--verbose` 标志。使用 `--dry-run` 预览计划的渠道/标签/安装/重启操作，使用 `--json` 获取机器可读结果，使用 `openclaw update status --json` 仅需渠道和可用性详细信息。如果您正在调试更新周围的 Gateway 日志，控制台详细程度和文件日志级别是分开的：Gateway `--verbose` 影响终端/WebSocket 输出，而文件日志需要配置中的 `logging.level: "debug"` 或 `"trace"`。请参阅 [Gateway 日志](/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，变更性的 `openclaw update` 运行被禁用。更新此安装的 Nix 源或 flake 输入；对于 nix-openclaw，使用 Agent 优先的[快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 保持只读。
</Note>

<Warning>
降级需要确认，因为旧版本可能会破坏配置。
</Warning>

## `update status`

显示活动更新渠道 + git 标签/分支/SHA（对于源代码检出），加上更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：打印机器可读的状态 JSON。
- `--timeout <seconds>`：检查超时（默认 3 秒）。

## `update wizard`

交互式流程，用于选择更新渠道并确认更新后是否重启 Gateway（默认重启）。如果您选择 `dev` 但没有 git 检出，它会提议创建一个。

选项：

- `--timeout <seconds>`：每个更新步骤的超时（默认 `1800`）

## 它的作用

当您明确切换渠道（`--channel ...`）时，OpenClaw 还会保持安装方法一致：

- `dev` → 确保 git 检出（默认：`~/openclaw`，用 `OPENCLAW_GIT_DIR` 覆盖），更新它，并从该检出安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm dist-tag `beta`，但当 beta 缺失或比当前稳定版本旧时回退到 `latest`。

Gateway 核心自动更新程序（通过配置启用时）在实时 Gateway 请求处理程序之外启动 CLI 更新路径。控制平面 `update.run` 包管理器更新在包交换后强制非延迟、无冷却更新重启，因为旧 Gateway 进程可能仍有指向新包删除的文件的内存中块。

对于包管理器安装，`openclaw update` 在调用包管理器之前解析目标包版本。npm 全局安装使用分阶段安装：OpenClaw 将新包安装到临时 npm 前缀中，在那里验证打包的 `dist` 清单，然后将该干净的包树交换到真实的全局前缀中。如果验证失败，更新后的 doctor、Plugin 同步和重启工作不会从可疑的树中运行。即使已安装的版本已与目标匹配，该命令也会刷新全局包安装，然后运行 Plugin 同步、核心命令补全刷新和重启工作。这使打包的附属程序和 Channel 拥有的 Plugin 记录与已安装的 OpenClaw 版本保持一致，同时将完整的 Plugin 命令补全重建留给显式的 `openclaw completion --write-state` 运行。

当安装了本地托管的 Gateway 服务且启用了重启时，包管理器更新在替换包树之前停止运行的服务，然后从更新后的安装刷新服务元数据，重启服务，并在报告成功之前验证重启后的 Gateway 报告了预期版本。在 macOS 上，更新后检查还验证 LaunchAgent 已为活动配置文件加载/运行，并且已配置的回环端口是健康的。如果 plist 已安装但 launchd 没有监督它，OpenClaw 自动重新引导 LaunchAgent，然后重新运行健康/版本/渠道就绪检查。全新的引导直接加载 RunAtLoad 作业，因此更新恢复不会立即 `kickstart -k` 新生成的 Gateway。如果 Gateway 仍然不健康，命令以非零退出并打印重启日志路径加上显式的重启、重新安装和包回滚说明。使用 `--no-restart` 时，包替换仍然运行，但托管服务不会被停止或重启，因此运行中的 Gateway 可能会保留旧代码，直到您手动重启它。

## Git 检出流程

### 渠道选择

- `stable`：检出最新的非测试版标签，然后构建和 doctor。
- `beta`：优先使用最新的 `-beta` 标签，但当 beta 缺失或比最新稳定标签旧时回退到它。
- `dev`：检出 `main`，然后 fetch 和 rebase。

### 更新步骤

<Steps>
  <Step title="验证干净的工作树">
    需要无未提交的更改。
  </Step>
  <Step title="切换渠道">
    切换到选定的渠道（标签或分支）。
  </Step>
  <Step title="获取上游">
    仅限 dev。
  </Step>
  <Step title="预检构建（仅限 dev）">
    在临时工作树中运行 TypeScript 构建。如果最新提交失败，最多回退 10 个提交以找到最新可构建的提交。设置 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 以在此预检期间也运行 lint；lint 以受限串行模式运行，因为用户更新主机通常比 CI 运行器小。
  </Step>
  <Step title="Rebase">
    Rebase 到选定的提交（仅限 dev）。
  </Step>
  <Step title="安装依赖项">
    使用仓库包管理器。对于 pnpm 检出，更新程序按需引导 `pnpm`（首先通过 `corepack`，然后是临时 `npm install pnpm@11` 回退），而不是在 pnpm 工作空间内运行 `npm run build`。
  </Step>
  <Step title="构建控制 UI">
    构建 Gateway 和控制 UI。
  </Step>
  <Step title="运行 doctor">
    `openclaw doctor` 作为最终安全更新检查运行。
  </Step>
  <Step title="同步 Plugin">
    将 Plugin 同步到活动渠道。dev 使用捆绑的 Plugin；stable 和 beta 使用 npm。更新跟踪的 Plugin 安装。
  </Step>
</Steps>

在测试版更新渠道上，遵循默认/最新线的跟踪 npm 和 ClawHub Plugin 安装首先尝试 Plugin `@beta` 版本。如果 Plugin 没有测试版，OpenClaw 回退到记录的默认/最新规范。对于 npm Plugin，当测试版包存在但安装验证失败时，OpenClaw 也会回退。精确版本和显式标签不会被重写。

<Warning>
如果精确固定的 npm Plugin 更新解析为完整性与存储的安装记录不同的工件，`openclaw update` 会中止该 Plugin 工件更新，而不是安装它。只有在验证您信任新工件后才能显式重新安装或更新 Plugin。
</Warning>

<Note>
范围限定为托管 Plugin 的更新后 Plugin 同步失败在核心更新成功后作为警告报告。JSON 结果保持顶级更新 `status: "ok"` 并报告 `postUpdate.plugins.status: "warning"`，包含 `openclaw doctor --fix` 和 `openclaw plugins inspect <id> --runtime --json` 指导。意外的更新程序或同步异常仍然使更新结果失败。修复 Plugin 安装或更新错误，然后重新运行 `openclaw doctor --fix` 或 `openclaw update`。

当更新后的 Gateway 启动时，Plugin 加载仅用于验证：启动不运行包管理器或改变依赖项树。包管理器 `update.run` 重启在包树已交换后绕过正常的空闲延迟和重启冷却，这样旧进程就不能继续惰性加载已删除的块。

如果 pnpm 引导仍然失败，更新程序会提前停止，并给出特定于包管理器的错误，而不是在检出内尝试 `npm run build`。
</Note>

## `--update` 简写

`openclaw --update` 重写为 `openclaw update`（对 Shell 和启动器脚本有用）。

## 相关

- `openclaw doctor`（在 git 检出上提议先运行更新）
- [开发渠道](/install/development-channels)
- [更新](/install/updating)
- [CLI 参考](/cli)
