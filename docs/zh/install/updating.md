---
mmh3_hash: "e9ebf341db48a288b9b5c5b738fcef27"
summary: "安全地更新 OpenClaw（全局安装或源码），以及回滚策略"
read_when:
  - 更新 OpenClaw
  - 更新后出现问题
title: "更新"
---

保持 OpenClaw 最新。

## 推荐：`openclaw update`

最快的更新方式。它会检测你的安装类型（npm 或 git），获取最新版本，运行 `openclaw doctor`，并重启 gateway。

```bash
openclaw update
```

要切换 channel 或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # 预览但不应用
```

`openclaw update` 不接受 `--verbose`。如需更新诊断，请使用
`--dry-run` 预览计划的操作，使用 `--json` 获取结构化结果，或使用
`openclaw update status --json` 检查 channel 和可用状态。
安装器有自己的 `--verbose` 标志，但该标志不属于
`openclaw update`。

`--channel beta` 优先选择 beta，但当 beta 标签缺失或比最新稳定版旧时，运行时会回退到 stable/latest。如果你想一次性更新原始 npm beta dist-tag，请使用 `--tag beta`。

请参阅[开发 channel](/install/development-channels) 了解 channel 语义。

## 在 npm 和 git 安装之间切换

当你想更改安装类型时，请使用 channel。更新器会保留你在 `~/.openclaw` 中的状态、配置、凭据和工作区；它只更改 CLI 和 gateway 使用的 OpenClaw 代码安装。

```bash
# npm 包安装 -> 可编辑的 git 检出
openclaw update --channel dev

# git 检出 -> npm 包安装
openclaw update --channel stable
```

先使用 `--dry-run` 预览确切的安装模式切换：

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` channel 确保 git 检出，构建它，并从该检出安装全局 CLI。
`stable` 和 `beta` channel 使用包安装。如果 gateway 已安装，
`openclaw update` 会刷新服务元数据并重启它，除非你传递 `--no-restart`。

## 备用方案：重新运行安装器

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

添加 `--no-onboard` 跳过引导。要通过安装器强制特定的安装类型，请传递
`--install-method git --no-onboard` 或
`--install-method npm --no-onboard`。

如果 `openclaw update` 在 npm 包安装阶段后失败，请重新运行安装器。安装器不会调用旧的更新器；它直接运行全局包安装，并可以恢复部分更新的 npm 安装。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

要将恢复固定到特定版本或 dist-tag，请添加 `--version`：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 备用方案：手动 npm、pnpm 或 bun

```bash
npm i -g openclaw@latest
```

对于监督安装，优先使用 `openclaw update`，因为它可以协调与正在运行的 Gateway 服务的包切换。如果你在托管 Gateway 运行时手动更新，请在包管理器完成后立即重启 Gateway，以避免旧进程继续从已替换的包文件中提供服务。

当 `openclaw update` 管理全局 npm 安装时，它首先将目标安装到临时 npm 前缀，验证打包的 `dist` 清单，然后将干净的包树交换到真实的全局前缀。这避免了 npm 将新包覆盖在旧包的陈旧文件上。如果安装命令失败，OpenClaw 会使用 `--omit=optional` 重试一次。这种重试有助于本地可选依赖无法编译的主机，同时在回退也失败时保持原始错误可见。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高级 npm 安装主题

<AccordionGroup>
  <Accordion title="只读包树">
    OpenClaw 在运行时将打包的全局安装视为只读，即使全局包目录对当前用户可写。Plugin 包安装存储在用户配置目录下 OpenClaw 拥有的 npm/git 根目录中，Gateway 启动不会改变 OpenClaw 包树。

    一些 Linux npm 设置将全局包安装在 root 拥有的目录下，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 支持该布局，因为 plugin 安装/更新命令写入该全局包目录之外。

  </Accordion>
  <Accordion title="加固的 systemd 单元">
    给 OpenClaw 对其配置/状态根的写入权限，以便显式的 plugin 安装、plugin 更新和 doctor 清理可以持久化其更改：

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="磁盘空间预检">
    在包更新和显式 plugin 安装之前，OpenClaw 会尝试对目标卷进行尽力而为的磁盘空间检查。空间不足会产生带有检查路径的警告，但不会阻止更新，因为在检查后文件系统配额、快照和网络卷可能会发生变化。实际的包管理器安装和安装后验证仍然是权威的。
  </Accordion>
</AccordionGroup>

## 自动更新器

自动更新器默认关闭。在 `~/.openclaw/openclaw.json` 中启用：

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Channel  | 行为                                                                                          |
| -------- | --------------------------------------------------------------------------------------------- |
| `stable` | 等待 `stableDelayHours`，然后在 `stableJitterHours` 内以确定性抖动应用（分散推出）。        |
| `beta`   | 每 `betaCheckIntervalHours`（默认：每小时）检查一次，并立即应用。                            |
| `dev`    | 不自动应用。手动使用 `openclaw update`。                                                     |

gateway 也会在启动时记录更新提示（使用 `update.checkOnStart: false` 禁用）。
对于降级或事故恢复，在 gateway 环境中设置 `OPENCLAW_NO_AUTO_UPDATE=1` 以阻止自动应用，即使已配置 `update.auto.enabled`。启动更新提示仍可运行，除非同时禁用了 `update.checkOnStart`。

通过实时 Gateway 控制平面处理器请求的包管理器更新会在包交换后强制执行非延迟、无冷却时间的更新重启。这避免了旧的内存进程在包树已被替换后仍然延迟加载块。Shell `openclaw update` 仍然是监督安装的首选路径，因为它可以在更新周围停止和重启服务。

## 更新后

<Steps>

### 运行 doctor

```bash
openclaw doctor
```

迁移配置、审计 DM 策略并检查 gateway 健康。详情：[Doctor](/gateway/doctor)

### 重启 gateway

```bash
openclaw gateway restart
```

### 验证

```bash
openclaw health
```

</Steps>

## 回滚

### 固定版本（npm）

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` 显示当前发布的版本。
</Tip>

### 固定提交（源码）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

要返回最新版本：`git checkout main && git pull`。

## 如果遇到问题

- 再次运行 `openclaw doctor` 并仔细阅读输出。
- 对于源码检出上的 `openclaw update --channel dev`，更新器在需要时会自动引导 `pnpm`。如果你看到 pnpm/corepack 引导错误，请手动安装 `pnpm`（或重新启用 `corepack`）并重新运行更新。
- 检查：[故障排除](/gateway/troubleshooting)
- 在 Discord 上提问：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相关

- [安装概览](/install)：所有安装方法。
- [Doctor](/gateway/doctor)：更新后的健康检查。
- [迁移](/install/migrating)：主版本迁移指南。
