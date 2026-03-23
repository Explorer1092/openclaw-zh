---
mmh3_hash: "7d733170f1da6626278b06e51a3c54cc"
title: "迁移指南"
sidebarTitle: "迁移"
summary: "将 OpenClaw 安装从一台机器移动（迁移）到另一台机器"
read_when:
  - 你正在将 OpenClaw 移动到新的笔记本电脑/服务器
  - 你想保留会话、认证和频道登录（WhatsApp 等）
---

# 将 OpenClaw 迁移到新机器

本指南将 OpenClaw Gateway 从一台机器迁移到另一台机器，无需重做引导向导。

## 迁移内容

当你复制**状态目录**（默认 `~/.openclaw/`）和**工作区**时，你将保留：

- **配置** -- `openclaw.json` 和所有 Gateway 设置
- **认证** -- API 密钥、OAuth 令牌、凭据配置文件
- **会话** -- 对话历史和 Agent 状态
- **Channel 状态** -- WhatsApp 登录、Telegram 会话等
- **工作区文件** -- `MEMORY.md`、`USER.md`、技能和提示词

<Tip>
在旧机器上运行 `openclaw status` 确认你的状态目录路径。
自定义配置文件使用 `~/.openclaw-<profile>/` 或通过 `OPENCLAW_STATE_DIR` 设置的路径。
</Tip>

## 迁移步骤

<Steps>
  <Step title="停止 Gateway 并备份">
    在**旧**机器上，停止 Gateway 以防止文件在复制过程中更改，然后归档：

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    如果你使用多个配置文件（例如 `~/.openclaw-work`），分别归档每一个。

  </Step>

  <Step title="在新机器上安装 OpenClaw">
    在新机器上[安装](/install) CLI（如有需要还要安装 Node）。
    如果引导向导创建了全新的 `~/.openclaw/` 也没关系 -- 下一步你将覆盖它。
  </Step>

  <Step title="复制状态目录和工作区">
    通过 `scp`、`rsync -a` 或外部驱动器传输存档，然后解压：

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    确保包含了隐藏目录，且文件所有权与将运行 Gateway 的用户匹配。

  </Step>

  <Step title="运行 doctor 并验证">
    在新机器上，运行 [Doctor](/gateway/doctor) 应用配置迁移并修复服务：

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## 常见陷阱

<AccordionGroup>
  <Accordion title="配置文件或状态目录不匹配">
    如果旧 Gateway 使用了 `--profile` 或 `OPENCLAW_STATE_DIR`，而新 Gateway 没有，
    Channel 会显示已注销，会话会为空。
    使用你迁移时相同的配置文件或状态目录启动 Gateway，然后重新运行 `openclaw doctor`。
  </Accordion>

  <Accordion title="只复制 openclaw.json">
    仅配置文件是不够的。凭据在 `credentials/` 下，Agent 状态在 `agents/` 下。始终迁移**整个**状态目录。
  </Accordion>

  <Accordion title="权限和所有权">
    如果你以 root 身份复制或切换了用户，Gateway 可能无法读取凭据。
    确保状态目录和工作区由运行 Gateway 的用户拥有。
  </Accordion>

  <Accordion title="远程模式">
    如果你的 UI 指向**远程** Gateway，远程主机拥有会话和工作区。
    迁移 Gateway 主机本身，而不是你的本地笔记本电脑。请参阅 [FAQ](/help/faq#where-does-openclaw-store-its-data)。
  </Accordion>

  <Accordion title="备份中的机密">
    状态目录包含 API 密钥、OAuth 令牌和 Channel 凭据。
    加密存储备份，避免通过不安全渠道传输，如果怀疑泄露请轮换密钥。
  </Accordion>
</AccordionGroup>

## 验证清单

在新机器上确认：

- [ ] `openclaw status` 显示 Gateway 正在运行
- [ ] Channel 仍然连接（无需重新配对）
- [ ] 仪表盘打开并显示现有会话
- [ ] 工作区文件（记忆、配置）存在
