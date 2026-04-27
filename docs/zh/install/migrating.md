---
mmh3_hash: "cc88787079df05ea021f9ae14b4f83a6"
title: "迁移指南"
sidebarTitle: "迁移"
summary: "将 OpenClaw 安装从一台机器移动（迁移）到另一台机器"
read_when:
  - 你正在将 OpenClaw 迁移到新笔记本/服务器
  - 你想保留会话、认证和 channel 登录（WhatsApp 等）
---

# 将 OpenClaw 迁移到新机器

在不重新进行入门引导的情况下将 OpenClaw gateway 迁移到新机器。

## 会迁移什么

当你复制**状态目录**（默认为 `~/.openclaw/`）和你的**工作区**时，你会保留：

- **配置** — `openclaw.json` 和所有 gateway 设置。
- **认证** — 每个 agent 的 `auth-profiles.json`（API 密钥加 OAuth），以及 `credentials/` 下的任何 channel 或 provider 状态。
- **Sessions** — 对话历史和 agent 状态。
- **Channel 状态** — WhatsApp 登录、Telegram Session 等。
- **工作区文件** — `MEMORY.md`、`USER.md`、技能和提示词。

<Tip>
在旧机器上运行 `openclaw status` 以确认你的状态目录路径。
自定义配置文件使用 `~/.openclaw-<profile>/` 或通过 `OPENCLAW_STATE_DIR` 设置的路径。
</Tip>

## 迁移步骤

<Steps>
  <Step title="停止 gateway 并备份">
    在**旧**机器上，停止 gateway 以使文件不在复制过程中更改，然后归档：

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    如果你使用多个配置文件（例如 `~/.openclaw-work`），请分别归档每个。

  </Step>

  <Step title="在新机器上安装 OpenClaw">
    在新机器上[安装](/install) CLI（以及如需 Node）。
    如果入门引导创建了一个全新的 `~/.openclaw/` 也没关系——你接下来会覆盖它。
  </Step>

  <Step title="复制状态目录和工作区">
    通过 `scp`、`rsync -a` 或外部驱动器传输归档，然后解压：

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    确保隐藏目录已包含在内，并且文件所有权与将运行 gateway 的用户匹配。

  </Step>

  <Step title="运行 doctor 并验证">
    在新机器上，运行 [Doctor](/gateway/doctor) 以应用配置迁移和修复服务：

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## 常见问题

<AccordionGroup>
  <Accordion title="配置文件或状态目录不匹配">
    如果旧 gateway 使用了 `--profile` 或 `OPENCLAW_STATE_DIR` 而新的没有，
    channels 将显示为已登出，sessions 将为空。
    使用你迁移的**相同**配置文件或状态目录启动 gateway，然后重新运行 `openclaw doctor`。
  </Accordion>

  <Accordion title="仅复制 openclaw.json">
    配置文件单独不够。Model 认证配置文件位于
    `agents/<agentId>/agent/auth-profiles.json` 下，channel/provider 状态仍然
    位于 `credentials/` 下。始终迁移**整个**状态目录。
  </Accordion>

  <Accordion title="权限和所有权">
    如果你以 root 身份复制或切换了用户，gateway 可能无法读取凭据。
    确保状态目录和工作区归运行 gateway 的用户所有。
  </Accordion>

  <Accordion title="远程模式">
    如果你的 UI 指向**远程** gateway，则远程主机拥有 sessions 和工作区。
    迁移 gateway 主机本身，而不是你的本地笔记本。参见 [FAQ](/help/faq#where-things-live-on-disk)。
  </Accordion>

  <Accordion title="备份中的密钥">
    状态目录包含认证配置文件、channel 凭据和其他
    provider 状态。
    加密存储备份，避免使用不安全的传输通道，如果怀疑泄露请轮换密钥。
  </Accordion>
</AccordionGroup>

## 验证清单

在新机器上，确认：

- [ ] `openclaw status` 显示 gateway 正在运行
- [ ] Channels 仍然已连接（无需重新配对）
- [ ] 仪表板打开并显示现有 sessions
- [ ] 工作区文件（内存、配置）已存在

## 相关

- [安装概览](/install)
- [Matrix 迁移](/install/migrating-matrix)
- [卸载](/install/uninstall)
