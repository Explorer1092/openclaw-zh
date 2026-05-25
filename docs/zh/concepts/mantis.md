---
mmh3_hash: "1b2fd2cffe71de8d618a6c1e77820f76"
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
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 保持新创建的通过租约打开以供 VNC 检查。失败的运行默认保持租约，以便操作员可以重新连接。
- `--class`、`--idle-timeout` 和 `--ttl` 调整机器大小和租约生命周期。

对于 Discord Web 证据，Mantis 使用专用查看器账户而不是 bot 令牌。实时 Discord API 场景仍然是预言机：它创建真实的线程，发送 SUT `thread-reply`，并通过 Discord REST 检查附件。当设置 `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 时，场景还会写入 Discord Web URL 产物。当设置 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 时，它保持该线程可用足够长的时间，使已登录的浏览器可以打开并录制它。

GitHub 工作流通过 Discord Web 打开候选线程 URL，捕获截图，录制 MP4，并在 Crabbox 媒体工具可用时生成动态剪辑 GIF 预览。优先使用通过 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 配置的持久查看器配置文件路径，因为完整的 Chrome 配置文件存档可能超过 GitHub 密钥大小限制。对于小型/引导配置文件，工作流也可以从 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 恢复 base64 `.tgz` 存档。如果两个配置文件来源都未配置，工作流仍会发布确定性的基线/候选附件截图，并记录一条通知，说明已跳过已登录的 Discord Web 见证者。

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

有用的 Slack 桌面标志：

- `--lease-id <cbx_...>` 在操作员已通过 VNC 登录 Slack Web 的机器上重新运行。
- `--gateway-setup` 在 VM 内启动持久化的 OpenClaw Slack Gateway，而不仅仅是运行 bot 到 bot 的 QA 通道。
- `--keep-lease` 成功后保持 Gateway VM 开放以供 VNC 检查；`--no-keep-lease` 在收集产物后停止它。
- `--slack-url <url>` 打开特定的 Slack Web URL。没有它时，当 SUT bot 令牌可用时，Mantis 从 Slack `auth.test` 派生 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 Gateway 设置使用的 Slack Channel 允许列表。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 内的持久 Chrome 配置文件。默认值为 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手动 Slack Web 登录可以在同一租约上的重新运行中保持存活。
- `--credential-source convex --credential-role ci` 使用共享凭据池而不是直接的 Slack env 令牌。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 传递到 Slack 实时通道。

审批检查点运行将 Slack API 消息快照渲染为检查点 PNG，用于 CI 安全的视觉证明。只有当租约使用已登录的热浏览器配置文件时，`slack-desktop-smoke.png` 才是 Slack Web 的证明。

GitHub smoke 工作流是 `Mantis Discord Smoke`。第一个真实场景的前后 GitHub 工作流是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：预期重现仅排队行为的引用。
- `candidate_ref`：预期显示 `queued -> thinking -> done` 的引用。

它检出工作流工具引用，构建独立的基线和候选 worktree，针对每个 worktree 运行 `discord-status-reactions-tool-only`，并将 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作为 Actions 产物上传。它还在 Crabbox 桌面浏览器中渲染每个通道的时间线 HTML，并将这些 VNC 截图与 PR 评论中的确定性时间线 PNG 一起发布。同一 PR 评论嵌入由 `crabbox media preview` 生成的轻量级动态剪辑 GIF 预览，链接到匹配的动态剪辑 MP4 片段，并保留完整桌面 MP4 文件以供深度检查。截图以内联方式保留以供快速审查。工作流从 `openclaw/crabbox` main 构建 Crabbox CLI，以便在下一个 Crabbox 二进制版本发布之前使用当前桌面/浏览器租约标志。

`Mantis Scenario` 是通用的手动入口点。它接受 `scenario_id`、`candidate_ref`、可选的 `baseline_ref` 和可选的 `pr_number`，然后分发场景拥有的工作流。包装器有意保持精简：场景工作流仍然拥有其传输设置、凭据、VM 类、预期预言机和产物清单。

`Mantis Slack Desktop Smoke` 是第一个 Slack VM 工作流。它在独立的 worktree 中检出受信任的候选引用，租用 Crabbox Linux 桌面，针对该候选运行 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`，在 VNC 浏览器中打开 Slack Web，录制桌面，使用 `crabbox media preview` 生成动态剪辑预览，上传完整产物目录，并可选地在目标 PR 上发布内联证据评论。默认使用 AWS 进行桌面租约，并公开手动 Provider 输入，以便操作员在 AWS 容量不足或不可用时切换到 Hetzner。当您想要"带有 Slack 和 claw 运行的 Linux 桌面"而不仅仅是 bot 到 bot 的 Slack 转录时，使用此通道。

`Mantis Telegram Live` 将现有的 Telegram 实时 QA 通道包装在相同的 PR 证据流水线中。它在独立的 worktree 中检出受信任的候选引用，运行 `pnpm openclaw qa telegram --credential-source convex --credential-role ci`，从 Telegram QA 摘要和观察到的消息产物写入 `mantis-evidence.json` 清单，通过 Crabbox 桌面浏览器渲染经过编辑的转录 HTML，使用 `crabbox media preview` 生成动态剪辑 GIF，并在 PR 号可用时发布内联 PR 证据评论。此通道是转录视觉的，而非已登录 Telegram Web 的证明：Telegram Bot API 提供稳定的实时消息证据，但正常 Mantis 自动化不需要 Telegram Web 登录状态。

`Mantis Telegram Desktop Proof` 是 Agent 式的原生 Telegram Desktop 前后包装器。维护者可以通过 PR 评论 `@openclaw-mantis telegram desktop proof`、通过 Actions UI 使用自由形式指令，或通过通用的 `Mantis Scenario` 分发器触发它。工作流将 PR、基线引用、候选引用和维护者指令交给 Codex。Agent 读取 PR，决定哪些 Telegram 可见行为证明了变更，为基线和候选运行真实用户的 Crabbox Telegram Desktop 证明通道，迭代直到原生 GIF 有用，将成对的 `motionPreview` 产物写入 `mantis-evidence.json`，上传包，并在 PR 号可用时发布 2 列 PR 证据表格。

对于人在回路的 Telegram 桌面设置，使用场景构建器：

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

构建器租用或重用 Crabbox 桌面，安装原生 Linux Telegram Desktop 二进制文件，可选地恢复用户会话存档，使用租用的 Telegram SUT bot 令牌配置 OpenClaw，在端口 `38974` 启动 `openclaw gateway run`，向租用的私有群组发布驱动 bot 就绪消息，然后从可见的 VNC 桌面捕获截图和 MP4。bot 令牌从不登录 Telegram Desktop；它只配置 OpenClaw。桌面查看器是一个独立的 Telegram 用户会话，从 `--telegram-profile-archive-env <name>` 恢复或通过 VNC 手动创建，并使用 `--keep-lease` 保持存活。

有用的 Telegram 桌面构建器标志：

- `--lease-id <cbx_...>` 在操作员已登录 Telegram Desktop 的 VM 上重新运行。
- `--telegram-profile-archive-env <name>` 从该 env 变量读取 base64 `.tgz` Telegram Desktop 配置文件存档，并在启动前恢复它。
- `--telegram-profile-dir <remote-path>` 控制远程 Telegram Desktop 配置文件目录。默认值为 `$HOME/.local/share/TelegramDesktop`。
- `--no-gateway-setup` 安装并打开 Telegram Desktop，而无需配置 OpenClaw。
- `--credential-source convex --credential-role ci` 使用共享凭据代理而不是直接的 Telegram env 令牌。

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

产物的 `path` 值相对于清单目录。`targetPath` 值是配置的 Mantis R2/S3 产物前缀下的相对路径。发布者拒绝路径遍历，并在可选预览或视频不可用时跳过标记为 `"required": false` 的条目。

支持的产物类型：

- `timeline`：确定性场景截图，通常是前后对比。
- `desktopScreenshot`：VNC/浏览器桌面截图。
- `motionPreview`：从桌面录像生成的内联动画 GIF。
- `motionClip`：去除静态前导和尾部的动态剪辑 MP4。
- `fullVideo`：用于深度检查的完整 MP4 录像。
- `metadata`：JSON/日志附件。
- `report`：Markdown 报告。

可重用的发布者是 `scripts/mantis/publish-pr-evidence.mjs`。工作流使用清单、目标 PR、产物目标根、评论标记、Actions 产物 URL、运行 URL 和请求来源调用它。它将声明的产物上传到配置的 Mantis R2/S3 存储桶，构建带有内联图像/预览和链接视频的摘要优先的 PR 评论，然后更新现有标记评论或创建一个新的。工作流发布到 `openclaw-crabbox-artifacts`，公共 URL 在 `https://artifacts.openclaw.ai` 下。它们直接提供存储桶、区域和公共 URL 值。可重用发布者需要：

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

您还可以从 PR 评论直接触发状态反应运行：

```text
@openclaw-mantis discord status reactions
```

评论触发有意保持较窄。它只在具有写、维护或管理权限的用户的 Pull Request 评论上运行，并且只识别 Discord 状态反应请求。默认情况下，它使用已知的错误基线引用和当前 PR 头部 SHA 作为候选。维护者可以覆盖任一引用：

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

也可以从 PR 评论触发 Telegram 实时 QA：

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

默认情况下，它使用当前 PR 头部 SHA 作为候选并运行 `telegram-status-command`。维护者可以覆盖 `candidate=...`、`provider=aws|hetzner` 和 `lease=<cbx_...>`，当他们需要特定的引用或预热的 Crabbox 桌面时。

ClawSweeper 命令示例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一个命令是显式的，以场景为中心的。第二个命令以后可以根据标签、更改的文件和 ClawSweeper 审查结果，将 PR 或 Issue 映射到推荐的 Mantis 场景。

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

场景应能以两种不同的方式失败：

- **Bug 已重现**：基线以预期方式失败。
- **工具失败**：环境设置、凭据、Discord API、浏览器或 Provider 在 Bug 预言机有意义之前失败。

最终报告必须将这些情况分开，以便维护者不会将不稳定的环境与产品行为混淆。

## Discord MVP

第一个场景应针对 guild Channel 中的 Discord 状态反应，其中源回复传递模式为 `message_tool_only`。

为什么它是一个好的 Mantis 种子：

- 它在 Discord 中作为触发消息上的反应可见。
- 它通过 Discord 消息反应状态具有强大的 REST 预言机。
- 它练习了真实的 OpenClaw Gateway、Discord bot 认证、消息分发、源回复传递模式、状态反应状态和模型轮次生命周期。
- 它足够窄，使第一个实现保持诚实。

预期的场景形状：

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

基线证据应显示排队确认反应，但在仅工具模式下没有生命周期转换。候选证据应在 `messages.statusReactions.enabled` 明确为 true 时显示生命周期状态反应运行。

可执行的第一个切片是可选的 Discord 实时 QA 场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它使用始终开启的 guild 处理、`visibleReplies: "message_tool"`、`ackReaction: "👀"` 和显式状态反应配置 SUT。预言机轮询真实的 Discord 触发消息，并期望观察到的序列 `👀 -> 🤔 -> 👍`。产物包括 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 现有的 QA 部件

Mantis 应该建立在现有的私有 QA 栈之上，而不是从零开始：

- `pnpm openclaw qa discord` 已经使用驱动 bot 和 SUT bot 运行实时 Discord 通道。
- 实时传输运行器已经在 `.artifacts/qa-e2e/` 下写入报告和观察到的消息产物。
- Convex 凭据租约已经提供对共享实时传输凭据的独占访问。
- 浏览器控制服务已经支持截图、快照、无头托管配置文件和远程 CDP 配置文件。
- QA Lab 已经有调试器 UI 和用于传输形状测试的总线。

第一个 Mantis 实现可以是这些部件上的精简前后运行器，加上一个视觉证据层。

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
- 机器 Provider 和机器 ID 或租约 ID
- 无密钥值的凭据来源
- 基线结果
- 候选结果
- Bug 是否在基线上重现
- 候选是否修复了它
- 产物路径
- 经过净化的设置或清理问题

截图是证据，而非密钥。它们仍需要编辑纪律：私有频道名称、用户名或消息内容可能出现。对于公共 PR，在编辑方案更完善之前，优先使用 GitHub Actions 产物链接而非内联图像。

## 浏览器和 VNC

浏览器通道有两种模式：

- **无头自动化**：CI 的默认模式。Chrome 以 CDP 启用运行，Playwright 或 OpenClaw 浏览器控制捕获截图。
- **VNC 救援**：当登录、MFA、Discord 反自动化或视觉调试需要人工时，在同一 VM 上启用。

Discord 观察者浏览器配置文件应该足够持久，以避免每次运行都登录，但与个人浏览器状态隔离。配置文件属于 Mantis 机器池，而不是开发者笔记本电脑。

当 Mantis 卡住时，它会发布带有以下信息的 Discord 状态消息：

- 运行 ID
- 场景 ID
- 机器 Provider
- 产物目录
- VNC 或 noVNC 连接指令（如果可用）
- 简短的阻塞文本

第一个私有部署可以将这些消息发布到现有的操作员频道，稍后再移动到专用的 Mantis 频道。

## 机器

Mantis 应该为第一个远程实现优先通过 Crabbox 使用 AWS。Crabbox 为我们提供了预热的机器、租约跟踪、水化、日志、结果和清理。如果 AWS 容量太慢或不可用，在相同的机器接口后面添加 Hetzner Provider。

最低 VM 要求：

- 具有桌面功能的 Chrome 或 Chromium 安装的 Linux
- 用于浏览器自动化的 CDP 访问
- 用于救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw 检出和依赖缓存
- 使用 Playwright 时的 Playwright Chromium 浏览器缓存
- 足够的 CPU 和内存用于一个 OpenClaw Gateway、一个浏览器和一个模型运行
- 对 Discord、GitHub、模型 Provider 和凭据代理的出站访问

VM 不应在预期的凭据或浏览器配置文件存储之外保留长期存在的原始密钥。

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

长期来看，Convex 凭据池应该保持为实时传输凭据的正常来源。GitHub 密钥引导代理和回退通道。Discord 状态反应工作流将 Mantis Crabbox 密钥映射回 Crabbox CLI 期望的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 环境变量。普通的 `CRABBOX_*` GitHub 密钥名称作为兼容性回退仍被接受。

Mantis 运行器绝对不能打印：

- Discord bot 令牌
- Provider API 密钥
- 浏览器 Cookie
- 认证配置文件内容
- VNC 密码
- 原始凭据有效载荷

公共产物上传还应编辑 Discord 目标元数据，如 bot、guild、channel 和消息 ID。GitHub smoke 工作流为此启用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果令牌意外粘贴到 Issue、PR、聊天或日志中，在存储新密钥后轮换它。

## GitHub 产物和 PR 评论

Mantis 工作流应将完整的证据包作为短期 Actions 产物上传。当工作流针对 Bug 报告或修复 PR 运行时，它还应将经过编辑的内联媒体发布到已配置的 Mantis R2/S3 存储桶，并在该 Bug 或修复 PR 上插入/更新带有内联前后截图的评论。不要只在通用 QA 自动化 PR 上发布主要证明。原始日志、观察到的消息和其他庞大的证据保留在 Actions 产物中。

生产工作流应使用 Mantis GitHub App 而非 `github-actions[bot]` 发布这些评论。将应用 ID 和私钥存储为 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 密钥。工作流使用隐藏标记作为插入/更新键，在令牌可以编辑时更新该评论，并在旧的 bot 拥有的标记无法编辑时创建新的 Mantis 拥有的评论。

PR 评论应该简短且直观：

```md
Mantis Discord Status Reactions QA

摘要：Mantis 针对已知的错误基线和候选修复重新运行了报告的 Discord 状态反应 Bug。基线重现了 Bug，而候选显示了预期的 queued -> thinking -> done 序列。

- 场景：`discord-status-reactions-tool-only`
- 运行：<工作流运行链接>
- 产物：<产物链接>
- 基线：`<状态>` 在 `<sha>`
- 候选：`<状态>` 在 `<sha>`

| 基线            | 候选            |
| --------------- | --------------- |
| <内联截图>      | <内联截图>      |
```

当运行因工具失败而失败时，评论必须说明这一点，而不是暗示候选失败。

## 私有部署说明

私有部署可能已经有一个 Mantis Discord 应用程序。当它具有正确的 bot 权限并且可以安全轮换时，重用该应用程序而不是创建另一个应用程序。

通过密钥或部署配置设置初始操作员通知频道。它可以先指向现有的维护者或运营频道，一旦存在专用的 Mantis 频道，再移动过去。

不要在本文档中放置 guild ID、channel ID、bot 令牌、浏览器 Cookie 或 VNC 密码。将它们存储在 GitHub 密钥、凭据代理或操作员的本地密钥存储中。

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
- 邮件：使用 `gog` 进行 Gmail 认证和消息线程化，适用于连接器不够用的情况。
- WhatsApp：QR 登录、重新识别、消息传递、媒体、反应。
- Telegram：群组提及门控、命令、反应（如果可用）。
- Matrix：加密房间、线程或回复关系、重启恢复。

每个传输应该有一个廉价的 smoke 场景和一个或多个 Bug 类场景。昂贵的视觉场景应该保持可选。

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
