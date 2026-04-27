---
mmh3_hash: "631421ed637d38a4f19fe976410dcbba"
summary: "安全地更新 OpenClaw（全局安装或源码），以及回滚策略"
read_when:
  - 更新 OpenClaw
  - 更新后出现问题
title: "更新"
---

保持 OpenClaw 最新。

## 推荐：`openclaw update`

最快的更新方式。它检测你的安装类型（npm 或 git），获取最新版本，运行 `openclaw doctor`，并重启 gateway。

```bash
openclaw update
```

切换 channel 或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # 预览而不应用
```

`--channel beta` 优先使用 beta，但当 beta 标签缺失或比最新稳定版旧时，运行时会回退到 stable/latest。如果你想要原始 npm beta dist-tag 进行一次性包更新，请使用 `--tag beta`。

有关 channel 语义，请参阅 [开发 channel](/install/development-channels)。

## 在 npm 和 git 安装之间切换

使用 channel 更改安装类型。更新程序将你的
状态、配置、凭据和工作区保留在 `~/.openclaw` 中；它只更改
CLI 和 gateway 使用的 OpenClaw 代码安装。

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

`dev` channel 确保使用 git 检出，构建它，并从该检出安装全局 CLI。`stable` 和 `beta` channel 使用包安装。如果 gateway 已安装，`openclaw update` 会刷新服务元数据并重启它，除非你传递 `--no-restart`。

## 替代方案：重新运行安装程序

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

添加 `--no-onboard` 跳过引导。要通过安装程序强制特定的安装类型，传递 `--install-method git --no-onboard` 或
`--install-method npm --no-onboard`。

如果 `openclaw update` 在 npm 包安装阶段后失败，重新运行安装程序。安装程序不调用旧的更新程序；它直接运行全局包安装，可以恢复部分更新的 npm 安装。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

要将恢复固定到特定版本或 dist-tag，添加 `--version`：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 替代方案：手动 npm、pnpm 或 bun

```bash
npm i -g openclaw@latest
```

当 `openclaw update` 管理全局 npm 安装时，它首先运行普通的全局安装命令。如果该命令失败，OpenClaw 使用 `--omit=optional` 重试一次。这种重试帮助无法编译原生可选依赖的主机，同时在回退也失败时保持原始失败可见。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高级 npm 安装主题

<AccordionGroup>
  <Accordion title="只读包树">
    OpenClaw 将打包的全局安装视为运行时只读，即使全局包目录可被当前用户写入。捆绑的插件运行时依赖项被暂存到可写的运行时目录中，而不是修改包树。这使 `openclaw update` 不会与在同一安装期间修复插件依赖项的运行中的 gateway 或本地 agent 产生竞争。

    某些 Linux npm 设置将全局包安装在 root 拥有的目录下，如 `/usr/lib/node_modules/openclaw`。OpenClaw 通过相同的外部暂存路径支持该布局。

  </Accordion>
  <Accordion title="加固的 systemd 单元">
    设置包含在 `ReadWritePaths` 中的可写暂存目录：

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` 也接受路径列表。OpenClaw 从左到右跨列出的根解析捆绑的插件运行时依赖项，将较早的根视为只读预安装层，并仅安装或修复到最终的可写根：

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    如果未设置 `OPENCLAW_PLUGIN_STAGE_DIR`，OpenClaw 在 systemd 提供时使用 `$STATE_DIRECTORY`，然后回退到 `~/.openclaw/plugin-runtime-deps`。修复步骤将该暂存视为 OpenClaw 拥有的本地包根，并忽略用户 npm 前缀和全局设置，因此全局安装的 npm 配置不会将捆绑的插件依赖项重定向到 `~/node_modules` 或全局包树。

  </Accordion>
  <Accordion title="磁盘空间预检">
    在包更新和捆绑的运行时依赖修复之前，OpenClaw 尝试对目标卷进行尽力的磁盘空间检查。空间不足时会产生带有检查路径的警告，但不会阻止更新，因为文件系统配额、快照和网络卷在检查后可能会改变。实际的 npm 安装、复制和安装后验证仍然是权威的。
  </Accordion>
  <Accordion title="捆绑的插件运行时依赖项">
    打包的安装将捆绑的插件运行时依赖项保持在只读包树之外。在启动和 `openclaw doctor --fix` 期间，OpenClaw 仅为在配置中激活、通过旧版 channel 配置激活或由其捆绑清单默认启用的捆绑插件修复运行时依赖项。仅持久化的 channel 认证状态不会触发 Gateway 启动时的运行时依赖修复。

    显式禁用优先。禁用的插件或 channel 不会因为它存在于包中就获得其运行时依赖项修复。外部插件和自定义加载路径仍使用 `openclaw plugins install` 或 `openclaw plugins update`。

  </Accordion>
</AccordionGroup>

## 自动更新程序

自动更新程序默认关闭。在 `~/.openclaw/openclaw.json` 中启用：

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

| Channel  | 行为                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------- |
| `stable` | 等待 `stableDelayHours`，然后在 `stableJitterHours` 内以确定性抖动应用（分散推出）。                      |
| `beta`   | 每 `betaCheckIntervalHours`（默认：每小时）检查并立即应用。                                               |
| `dev`    | 不自动应用。手动使用 `openclaw update`。                                                                  |

Gateway 在启动时也会记录更新提示（使用 `update.checkOnStart: false` 禁用）。
对于降级或事故恢复，在 gateway 环境中设置 `OPENCLAW_NO_AUTO_UPDATE=1` 以阻止自动应用，即使配置了 `update.auto.enabled`。除非同时禁用 `update.checkOnStart`，否则启动更新提示仍可运行。

## 更新后

<Steps>

### 运行 doctor

```bash
openclaw doctor
```

迁移配置，审计 DM 策略，并检查 gateway 健康状态。详情：[Doctor](/gateway/doctor)

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

返回最新：`git checkout main && git pull`。

## 如果你卡住了

- 再次运行 `openclaw doctor` 并仔细阅读输出。
- 对于源码检出的 `openclaw update --channel dev`，更新程序在需要时会自动引导 `pnpm`。如果你看到 pnpm/corepack 引导错误，手动安装 `pnpm`（或重新启用 `corepack`）并重新运行更新。
- 检查：[故障排除](/gateway/troubleshooting)
- 在 Discord 询问：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相关

- [安装概览](/install)：所有安装方法。
- [Doctor](/gateway/doctor)：更新后的健康检查。
- [迁移](/install/migrating)：主要版本迁移指南。
