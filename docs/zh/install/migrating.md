---
mmh3_hash: "ce959877e46c8263f0017bfe4fafa65f"
title: "迁移指南"
sidebarTitle: "迁移"
summary: "迁移中枢：跨系统导入、机器间迁移和 plugin 升级"
read_when:
  - 你要将 OpenClaw 迁移到新笔记本电脑或服务器
  - 你来自另一个 agent 系统，想要保留状态
  - 你正在就地升级 plugin
---

OpenClaw 支持三种迁移路径：从另一个 agent 系统导入、将现有安装迁移到新机器，以及就地升级 plugin。

## 从另一个 agent 系统导入

使用内置迁移 provider 将指令、MCP 服务器、skill、模型配置和（选择加入）API 密钥引入 OpenClaw。计划在任何更改之前预览，报告中编辑 secret，应用由已验证的备份支持。

<CardGroup cols={2}>
  <Card title="从 Claude 迁移" href="/install/migrating-claude" icon="brain">
    导入 Claude Code 和 Claude Desktop 状态，包括 `CLAUDE.md`、MCP 服务器、skill 和项目命令。
  </Card>
  <Card title="从 Hermes 迁移" href="/install/migrating-hermes" icon="feather">
    导入 Hermes 配置、provider、MCP 服务器、内存、skill 和支持的 `.env` 密钥。
  </Card>
</CardGroup>

CLI 入口点是 [`openclaw migrate`](/cli/migrate)。引导流程在检测到已知来源时也可以提供迁移（`openclaw onboard --flow import`）。

## 将 OpenClaw 迁移到新机器

复制**状态目录**（默认 `~/.openclaw/`）和你的**工作区**以保留：

- **配置** — `openclaw.json` 和所有 gateway 设置。
- **认证** — 每个 agent 的 `auth-profiles.json`（API 密钥加 OAuth），以及 `credentials/` 下的任何 channel 或 provider 状态。
- **Session** — 对话历史和 agent 状态。
- **Channel 状态** — WhatsApp 登录、Telegram session 等。
- **工作区文件** — `MEMORY.md`、`USER.md`、skill 和提示词。

<Tip>
在旧机器上运行 `openclaw status` 以确认你的状态目录路径。自定义 profile 使用 `~/.openclaw-<profile>/` 或通过 `OPENCLAW_STATE_DIR` 设置的路径。
</Tip>

### 迁移步骤

<Steps>
  <Step title="停止 gateway 并备份">
    在**旧**机器上，停止 gateway 以使文件不在复制过程中改变，然后归档：

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    如果你使用多个 profile（例如 `~/.openclaw-work`），请分别归档每个。

  </Step>

  <Step title="在新机器上安装 OpenClaw">
    在新机器上[安装](/install) CLI（如果需要还要安装 Node）。引导流程创建全新的 `~/.openclaw/` 是可以的。你接下来会覆盖它。
  </Step>

  <Step title="复制状态目录和工作区">
    通过 `scp`、`rsync -a` 或外部驱动器传输归档，然后解压：

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    确保包含了隐藏目录，并且文件所有权与将运行 gateway 的用户匹配。

  </Step>

  <Step title="运行 doctor 并验证">
    在新机器上，运行 [Doctor](/gateway/doctor) 以应用配置迁移并修复服务：

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

如果 Telegram 或 Discord 使用默认的环境变量回退（`TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN`），请验证迁移的状态目录 `.env` 包含这些密钥，而不打印 secret 值：

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

当启用的默认 Telegram 或 Discord 账户没有配置令牌且相应的环境变量对 doctor 进程不可用时，`openclaw doctor` 也会发出警告。

### 常见陷阱

<AccordionGroup>
  <Accordion title="Profile 或状态目录不匹配">
    如果旧的 gateway 使用了 `--profile` 或 `OPENCLAW_STATE_DIR` 而新的没有，channel 将显示为已登出，session 将为空。使用你迁移的相同 profile 或状态目录启动 gateway，然后重新运行 `openclaw doctor`。
  </Accordion>

  <Accordion title="只复制 openclaw.json">
    单独的配置文件是不够的。模型认证 profile 存储在 `agents/<agentId>/agent/auth-profiles.json` 下，channel 和 provider 状态存储在 `credentials/` 下。始终迁移**整个**状态目录。
  </Accordion>

  <Accordion title="权限和所有权">
    如果你以 root 复制或切换了用户，gateway 可能无法读取凭据。确保状态目录和工作区由运行 gateway 的用户拥有。
  </Accordion>

  <Accordion title="远程模式">
    如果你的 UI 指向**远程** gateway，远程主机拥有 session 和工作区。迁移 gateway 主机本身，而不是你的本地笔记本电脑。请参阅 [FAQ](/help/faq#where-things-live-on-disk)。
  </Accordion>

  <Accordion title="备份中的 Secret">
    状态目录包含认证 profile、channel 凭据和其他 provider 状态。加密存储备份，避免不安全的传输渠道，如果你怀疑泄露则轮换密钥。
  </Accordion>
</AccordionGroup>

### 验证清单

在新机器上，确认：

- [ ] `openclaw status` 显示 gateway 正在运行。
- [ ] Channel 仍然已连接（无需重新配对）。
- [ ] Dashboard 打开并显示现有 session。
- [ ] 工作区文件（内存、配置）存在。

## 就地升级 plugin

就地 plugin 升级保留相同的 plugin id 和配置密钥，但可能将磁盘状态移动到当前布局中。特定 plugin 升级指南与其 channel 一起提供：

- [Matrix 迁移](/channels/matrix-migration)：加密状态恢复限制、自动快照行为和手动恢复命令。

## 相关

- [`openclaw migrate`](/cli/migrate)：跨系统导入的 CLI 参考。
- [安装概览](/install)：所有安装方法。
- [Doctor](/gateway/doctor)：迁移后健康检查。
- [卸载](/install/uninstall)：干净地删除 OpenClaw。
