---
mmh3_hash: "489479567c8eb542275688e3de5faf0c"
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

该场景使用驱动 bot 发布父消息，创建真实的 Discord 线程，使用仓库本地的 `filePath` 调用 OpenClaw 的 `message.thread-reply` 操作，然后轮询线程获取 SUT 回复和附件文件名。基线截图显示没有附件的回复；候选截图显示预期的 `mantis-thread-report.md` 附件。

第一个 VM/浏览器原始操作是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它租用或重用 Crabbox 桌面机器，在 VNC 会话中启动可见浏览器，捕获桌面，将产物拉回到本地输出目录，并将重新连接命令写入报告。命令默认使用 Hetzner Provider，因为它是 Mantis 通道中第一个具有桌面/VNC 覆盖的 Provider。使用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 在针对另一个 Crabbox 集群运行时覆盖它。

有用的桌面 smoke 标志：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 重用预热的桌面。
- `--browser-url <url>` 更改在可见浏览器中打开的页面。
- `--html-file <path>` 在可见浏览器中渲染仓库本地的 HTML 产物。Mantis 使用此功能通过真实的 Crabbox 桌面捕获生成的 Discord 状态反应时间线。
- `--browser-profile-dir <remote-path>` 重用远程 Chrome user-data-dir，使持久化的 Mantis 桌面可以在运行之间保持登录状态。将此用于长期存在的 Discord Web 查看器配置文件。
- `--browser-profile-archive-env <name>` 在启动浏览器之前从命名环境变量恢复 base64 `.tgz` Chrome user-data-dir 存档。将此用于已登录的见证者，如 Discord Web。默认 env 变量是 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`。
- `--video-duration <seconds>` 控制 MP4 捕获长度。对于需要时间稳定的慢速已登录 Web 应用，使用更长的持续时间。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 保持新创建的通过租用打开以供 VNC 检查。失败的运行默认保持租用，以便操作员可以重新连接。
- `--class`、`--idle-timeout` 和 `--ttl` 调整机器大小和租用生命周期。

对于 Discord Web 证据，Mantis 使用专用查看器账户而不是 bot 令牌。实时 Discord API 场景仍然是预言机：它创建真实的线程，发送 SUT `thread-reply`，并通过 Discord REST 检查附件。当设置 `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 时，场景还会写入 Discord Web URL 产物。当设置 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 时，它保持该线程可用足够长的时间，使已登录的浏览器可以打开并录制它。

第一个完整桌面传输原始操作是 Slack 桌面 smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它租用或重用 Crabbox 桌面机器，将当前检出同步到 VM 中，在该 VM 内运行 `pnpm openclaw qa slack`，在 VNC 浏览器中打开 Slack Web，捕获可见桌面，并将 Slack QA 产物和 VNC 截图都复制回本地输出目录。这是第一个 SUT OpenClaw Gateway 和浏览器都在同一个 Linux 桌面 VM 内的 Mantis 形状。

使用 `--gateway-setup`，命令在 `$HOME/.openclaw-mantis/slack-openclaw` 创建持久化的可处置 OpenClaw 主目录，为选定的 Channel 修补 Slack Socket Mode 配置，在端口 `38973` 启动 `openclaw gateway run`，并保持 Chrome 在 VNC 会话中运行。这是"给我一个带有 Slack 和 claw 运行的 Linux 桌面"模式；当省略 `--gateway-setup` 时，bot 到 bot 的 Slack QA 通道仍然是默认值。

`--credential-source env` 所需的输入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 远程模型通道的 `OPENCLAW_LIVE_OPENAI_KEY`。如果本地只设置了 `OPENAI_API_KEY`，Mantis 在调用 Crabbox 之前将其映射到 `OPENCLAW_LIVE_OPENAI_KEY`，以便 Crabbox 的 `OPENCLAW_*` env 转发可以将其携带到 VM 中。

使用 `--gateway-setup --credential-source convex`，Mantis 在创建 VM 之前从共享池租用 Slack SUT 凭据，并将租用的 Channel ID、Socket Mode 应用令牌和 bot 令牌作为桌面内的 `OPENCLAW_MANTIS_SLACK_*` 运行时 env 转发。这使 GitHub 工作流保持精简：它们只需要 Convex 代理密钥，而不是原始 Slack bot 或应用令牌。

GitHub smoke 工作流是 `Mantis Discord Smoke`。第一个真实场景的前后 GitHub 工作流是 `Mantis Discord Status Reactions`。`Mantis Scenario` 是通用的手动入口点。`Mantis Slack Desktop Smoke` 是第一个 Slack VM 工作流。`Mantis Telegram Live` 将现有的 Telegram 实时 QA 通道包装在相同的 PR 证据流水线中。`Mantis Telegram Desktop Proof` 是 Agent 式的原生 Telegram Desktop 前后包装器。

对于人在回路的 Telegram 桌面设置，使用场景构建器：

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

每个发布 PR 的场景都在其报告旁边写入 `mantis-evidence.json`。此模式是场景代码和 GitHub 评论之间的交接：

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "PR 评论的人类可读摘要。",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

支持的产物类型：

- `timeline`：确定性场景截图，通常是前后对比。
- `desktopScreenshot`：VNC/浏览器桌面截图。
- `motionPreview`：从桌面录像生成的内联动画 GIF。
- `motionClip`：去除静态前导和尾部的动态剪辑 MP4。
- `fullVideo`：用于深度检查的完整 MP4 录像。
- `metadata`：JSON/日志附件。
- `report`：Markdown 报告。

您还可以从 PR 评论触发状态反应运行：

```text
@openclaw-mantis discord status reactions
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

## Discord MVP

第一个场景应针对 guild Channel 中的 Discord 状态反应，其中源回复传递模式为 `message_tool_only`。

为什么它是一个好的 Mantis 种子：

- 它在 Discord 中作为触发消息上的反应可见。
- 它通过 Discord 消息反应状态具有强大的 REST 预言机。
- 它练习了真实的 OpenClaw Gateway、Discord bot 认证、消息分发、源回复传递模式、状态反应状态和模型轮次生命周期。
- 它足够窄，使第一个实现保持诚实。

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

摘要必须包括：

- 测试的引用和 SHA
- 传输和场景 ID
- 机器 Provider 和机器 ID 或租用 ID
- 无密钥值的凭据来源
- 基线结果
- 候选结果
- Bug 是否在基线上重现
- 候选是否修复了它
- 产物路径
- 经过净化的设置或清理问题

## 机器

Mantis 应该为第一个远程实现优先通过 Crabbox 使用 AWS。Crabbox 为我们提供了预热的机器、租用跟踪、水化、日志、结果和清理。

最低 VM 要求：

- 具有桌面功能的 Chrome 或 Chromium 安装的 Linux
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw 检出和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存用于一个 OpenClaw Gateway、一个浏览器和一个模型运行
- 对 Discord、GitHub、模型 Provider 和凭据代理的出站访问

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

## GitHub 产物和 PR 评论

Mantis 工作流应将完整的证据包作为短期 Actions 产物上传。当工作流针对 Bug 报告或修复 PR 运行时，它还应将经过编辑的内联媒体发布到已配置的 Mantis R2/S3 存储桶，并在该 Bug 或修复 PR 上插入/更新带有内联前后截图的评论。

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

## Provider 扩展

在 Discord 之后，相同的运行器可以添加：

- Slack：反应、线程、应用提及、模态框、文件上传。
- 邮件：使用 `gog` 进行 Gmail 认证和消息线程化。
- WhatsApp：QR 登录、重新识别、消息传递、媒体、反应。
- Telegram：群组提及门控、命令、反应（如果可用）。
- Matrix：加密房间、线程或回复关系、重启恢复。

## 未解决的问题

- 当重用现有 Mantis bot 时，哪个 Discord bot 应该是驱动者，哪个应该是 SUT？
- 观察者浏览器登录应该使用人类 Discord 账户、测试账户，还是仅在第一阶段使用 bot 可读的 REST 证据？
- GitHub 应该为 PR 保留 Mantis 产物多长时间？
- ClawSweeper 何时应该自动推荐 Mantis 而不是等待维护者命令？
- 截图在上传到公共 PR 之前是否应该经过编辑或裁剪？

## 相关

- [QA 概述](/concepts/qa-e2e-automation)
- [Mantis Slack 桌面端运行手册](/concepts/mantis-slack-desktop-runbook)
- [测试](/help/testing)
