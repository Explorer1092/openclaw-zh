---
mmh3_hash: "9a7fe413115b84c1a5eba2e23376e07e"
summary: "Mantis 是 OpenClaw 的视觉端到端验证系统，用于在真实传输上重现 Bug、捕获前后证据并将产物附加到 PR。"
title: "Mantis"
read_when:
  - 为 OpenClaw Bug 构建或运行实时视觉 QA
  - 为 Pull Request 添加前后验证
  - 添加 Discord、Slack、WhatsApp 或其他实时传输场景
  - 调试需要截图、浏览器自动化或 VNC 访问的 QA 运行
---

Mantis 是 OpenClaw 的端到端验证系统，用于需要真实运行时、真实传输和可见证明的 Bug。它针对已知错误的引用运行场景，捕获证据，然后针对候选引用运行相同的场景，并将比较结果作为产物发布，维护者可从 PR 或本地命令中检查。

Mantis 从 Discord 开始，因为 Discord 为我们提供了高价值的第一个通道：真实的 bot 认证、真实的 guild 频道、反应、线程、原生命令以及人类可以直观确认传输显示内容的浏览器 UI。

## 目标

- 使用用户看到的相同传输形状重现来自 GitHub Issue 或 PR 的 Bug。
- 在应用修复前，在基线引用上捕获**前**产物。
- 在应用修复后，在候选引用上捕获**后**产物。
- 尽可能使用确定性预言机，如 Discord REST 反应读取或频道记录检查。
- 当 Bug 有可见的 UI 界面时捕获截图。
- 从 Agent 控制的 CLI 本地运行，也从 GitHub 远程运行。
- 当登录、浏览器自动化或 Provider 认证卡住时，保留足够的机器状态以进行 VNC 救援。
- 当运行被阻塞、需要手动 VNC 帮助或完成时，向操作员 Discord 频道发布简洁状态。

## 非目标

- Mantis 不是单元测试的替代品。理解修复后，Mantis 运行通常应转变为更小的回归测试。
- Mantis 不是正常的快速 CI 门控。它更慢，使用真实凭据，仅保留用于实际环境重要的 Bug。
- Mantis 不应要求人工进行正常操作。手动 VNC 是救援路径，而非正常路径。
- Mantis 不会在产物、日志、截图、Markdown 报告或 PR 评论中存储原始密钥。

## 所有权

Mantis 存在于 OpenClaw QA 栈中。

- OpenClaw 拥有场景运行时、传输适配器、证据模式和 `pnpm openclaw qa mantis` 下的本地 CLI。
- QA Lab 拥有实时传输工具部件、浏览器捕获辅助工具和产物写入器。
- Crabbox 拥有需要远程 VM 时的预热 Linux 机器。
- GitHub Actions 拥有远程工作流入口和产物保留。
- ClawSweeper 拥有 GitHub 评论路由：解析维护者命令、分发工作流和发布最终 PR 评论。
- OpenClaw Agent 在场景需要 Agent 设置、调试或卡住状态报告时通过 Codex 驱动 Mantis。

这个边界将传输知识保留在 OpenClaw 中，将机器调度保留在 Crabbox 中，将维护者工作流粘合保留在 ClawSweeper 中。

## 命令形状

第一个本地命令验证 Discord bot、guild、频道、消息发送、反应发送和产物路径：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本地前后运行器接受以下形状：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

运行器在输出目录下创建独立的基线和候选 worktree，安装依赖项，构建每个引用，使用 `--allow-failures` 运行场景，然后写入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。对于第一个 Discord 场景，成功验证意味着基线状态为 `fail`，候选状态为 `pass`。

第二个 Discord 前后探测针对线程附件：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

第一个 VM/浏览器原始操作是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

第一个完整桌面传输原始操作是 Slack 桌面 smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

## 运行生命周期

1. 获取凭据。
2. 分配或复用 VM。
3. 当场景需要 UI 证据时准备桌面/浏览器配置文件。
4. 为基线引用准备干净的检出。
5. 仅安装场景所需的依赖项和构建内容。
6. 使用隔离状态目录启动子 OpenClaw Gateway。
7. 配置实时传输、Provider、模型和浏览器配置文件。
8. 运行场景并捕获基线证据。
9. 停止 Gateway 并保留日志。
10. 在同一 VM 中准备候选引用。
11. 运行相同的场景并捕获候选证据。
12. 比较预言机结果和视觉证据。
13. 写入 Markdown、JSON、日志、截图和可选的追踪产物。
14. 上传 GitHub Actions 产物。
15. 发布简洁的 PR 或 Discord 状态消息。

## 证据模型

每次运行写入稳定的产物目录：

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` 应该是机器可读的事实来源。Markdown 报告用于 PR 评论和人工审查。

## 机密

机密存储在 GitHub 组织或仓库密钥中（用于远程运行），以及本地操作员控制的密钥文件中（用于本地运行）。

建议的密钥名称：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`（用于公开 GitHub 产物上传）
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Mantis 运行器绝对不能打印：

- Discord bot 令牌
- Provider API 密钥
- 浏览器 Cookie
- 认证配置文件内容
- VNC 密码
- 原始凭据有效载荷

## 添加场景

Mantis 场景应声明：

- ID 和标题
- 传输
- 所需凭据
- 基线引用策略
- 候选引用策略
- OpenClaw 配置补丁
- 设置步骤
- 刺激
- 预期基线预言机
- 预期候选预言机
- 视觉捕获目标
- 超时预算
- 清理步骤

场景应优先使用小型、类型化的预言机：

- Discord 反应状态（用于反应 Bug）
- Discord 消息引用（用于线程 Bug）
- Slack 线程 ts 和反应 API 状态（用于 Slack Bug）
- 邮件消息 ID 和标头（用于邮件 Bug）
- 浏览器截图（当 UI 是唯一可靠的可观察对象时）

视觉检查应该是附加的。如果平台 API 可以证明 Bug，使用该 API 作为通过/失败预言机，并保留截图用于人工信心。

## 相关

- [QA 概述](/concepts/qa-e2e-automation)
- [Mantis Slack 桌面端运行手册](/concepts/mantis-slack-desktop-runbook)
- [测试](/help/testing)
