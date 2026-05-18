---
mmh3_hash: "8dee1dd27e44b47ef08e702fb10b7aae"
summary: "QA 栈概述：qa-lab、qa-channel、种子场景、实时传输通道、传输适配器和报告。"
read_when:
  - 了解 QA 栈如何整合
  - 扩展 qa-lab、qa-channel 或传输适配器
  - 添加代码库支持的 QA 场景
  - 围绕 Gateway 仪表板构建高真实感 QA 自动化
title: "QA 概述"
---

私有 QA 栈旨在以比单个单元测试更真实、更接近 channel 形状的方式测试 OpenClaw。

当前组件：

- `extensions/qa-channel`：合成消息 channel，具有 DM、channel、thread、reaction、edit 和 delete 界面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察转录、注入入站消息和导出 Markdown 报告。
- `extensions/qa-matrix` 及未来的 runner 插件：实时传输适配器，在子 QA Gateway 内驱动真实 channel。
- `qa/`：代码库支持的启动任务和基础 QA 场景的种子资产。
- [Mantis](/concepts/mantis)：针对需要真实传输、浏览器截图、VM 状态和 PR 证据的 bug 的前后实时验证。

## 命令界面

所有 QA 流程均在 `pnpm openclaw qa <subcommand>` 下运行。许多命令有 `pnpm qa:*` 脚本别名；两种形式均受支持。

| 命令 | 用途 |
| --- | --- |
| `qa run` | 捆绑的 QA 自检；写入 Markdown 报告。 |
| `qa suite` | 针对 QA Gateway 通道运行代码库支持的场景。别名：`pnpm openclaw qa suite --runner multipass` 用于一次性 Linux VM。 |
| `qa coverage` | 打印 Markdown 场景覆盖率清单（`--json` 用于机器输出）。 |
| `qa parity-report` | 比较两个 `qa-suite-summary.json` 文件并写入 agentic parity 报告。 |
| `qa character-eval` | 跨多个实时 model 运行角色 QA 场景并生成评判报告。参见 [报告](#报告)。 |
| `qa manual` | 针对所选 provider/model 通道运行一次性提示。 |
| `qa ui` | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。 |
| `qa docker-build-image` | 构建预烘焙 QA Docker 镜像。 |
| `qa docker-scaffold` | 为 QA 仪表板 + Gateway 通道写入 docker-compose 脚手架。 |
| `qa up` | 构建 QA 站点，启动 Docker 支持的栈，打印 URL（别名：`pnpm qa:lab:up`；`:fast` 变体添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。 |
| `qa aimock` | 仅启动 AIMock provider 服务器。 |
| `qa mock-openai` | 仅启动场景感知的 `mock-openai` provider 服务器。 |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享 Convex 凭据池。 |
| `qa matrix` | 针对一次性 Tuwunel homeserver 的实时传输通道。参见 [Matrix QA](/concepts/qa-matrix)。 |
| `qa telegram` | 针对真实私有 Telegram 群组的实时传输通道。 |
| `qa discord` | 针对真实私有 Discord guild channel 的实时传输通道。 |
| `qa slack` | 针对真实私有 Slack channel 的实时传输通道。 |
| `qa mantis` | 实时传输 bug 的前后验证 runner，包含 Discord 状态反应证据、Crabbox 桌面/浏览器烟雾测试和 Slack-in-VNC 烟雾测试。参见 [Mantis](/concepts/mantis) 和 [Mantis Slack Desktop Runbook](/concepts/mantis-slack-desktop-runbook)。 |

## 操作流程

当前 QA 操作流程是一个双面板 QA 站点：

- 左：带 agent 的 Gateway 仪表板（Control UI）。
- 右：QA Lab，显示类 Slack 的转录和场景计划。

运行方式：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动 Docker 支持的 Gateway 通道，并暴露 QA Lab 页面，操作员或自动化循环可以在此给 agent 分配 QA 任务、观察真实 channel 行为并记录哪些有效、失败或仍被阻止。

要在不每次重新构建 Docker 镜像的情况下加速 QA Lab UI 迭代，可使用绑定挂载的 QA Lab 包启动栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 保持 Docker 服务使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 在更改时重新构建该包，浏览器在 QA Lab 资产哈希更改时自动重新加载。

要进行本地 OpenTelemetry 追踪烟雾测试，运行：

```bash
pnpm qa:otel:smoke
```

该脚本启动本地 OTLP/HTTP 追踪接收器，在启用 `diagnostics-otel` 插件的情况下运行 `otel-trace-smoke` QA 场景，然后解码导出的 protobuf spans 并断言发布关键形状：`openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery` 必须存在；成功轮次的 model 调用不得导出 `StreamAbandoned`；原始诊断 ID 和 `openclaw.content.*` 属性必须不出现在追踪中。它将 `otel-smoke-summary.json` 写入 QA suite 构件旁边。

可观测性 QA 仅保留源代码检出。npm tarball 有意省略 QA Lab，因此包 Docker 发布通道不运行 `qa` 命令。更改诊断插桩时，从构建的源代码检出运行 `pnpm qa:otel:smoke`。

要进行传输真实的 Matrix 烟雾通道，运行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

该通道的完整 CLI 参考、profile/场景目录、环境变量和构件布局位于 [Matrix QA](/concepts/qa-matrix)。简要说明：它在 Docker 中配置一次性 Tuwunel homeserver，注册临时 driver/SUT/observer 用户，在限定于该传输的子 QA Gateway 内运行真实 Matrix 插件（无 `qa-channel`），然后将 Markdown 报告、JSON 摘要、观察到的事件构件和合并输出日志写入 `.artifacts/qa-e2e/matrix-<timestamp>/`。

场景涵盖单元测试无法端到端证明的传输行为：mention 门控、allow-bot 策略、允许列表、顶级和线程回复、DM 路由、reaction 处理、入站 edit 抑制、重启重放去重、homeserver 中断恢复、审批元数据投递、媒体处理，以及 Matrix E2EE 引导/恢复/验证流程。E2EE CLI profile 还通过同一次性 homeserver 驱动 `openclaw matrix encryption setup` 和验证命令，然后检查 Gateway 回复。

Discord 也有 Mantis 专用的可选场景用于 bug 复现。使用 `--scenario discord-status-reactions-tool-only` 进行显式状态反应时间线，或使用 `--scenario discord-thread-reply-filepath-attachment` 创建真实 Discord thread 并验证 `message.thread-reply` 保留了 `filePath` 附件。这些场景排除在默认实时 Discord 通道之外，因为它们是前后复现探针而非广泛的烟雾覆盖。thread 附件 Mantis 工作流在配置了 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 时，还可以添加已登录 Discord Web 的见证视频。该 viewer profile 仅用于视觉捕获；通过/失败决定仍来自 Discord REST oracle。

CI 在 `.github/workflows/qa-live-transports-convex.yml` 中使用相同的命令界面。计划和默认手动运行执行带实时前沿凭据的快速 Matrix profile，以及 `--fast` 和 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`。手动 `matrix_profile=all` 分散到五个 profile 分片，以便穷举目录可以并行运行，同时每个分片保留一个构件目录。

要进行传输真实的 Telegram、Discord 和 Slack 烟雾通道：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

它们针对预先存在的真实 channel，使用两个 bot（driver + SUT）。所需的环境变量、场景列表、输出构件和 Convex 凭据池记录在下面的 [Telegram、Discord 和 Slack QA 参考](#telegram-discord-和-slack-qa-参考) 中。

要使用 VNC 救援运行完整的 Slack 桌面 VM，运行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

该命令租用一个 Crabbox 桌面/浏览器机器，在 VM 内运行 Slack 实时通道，在 VNC 浏览器中打开 Slack Web，捕获桌面，并在视频捕获可用时将 `slack-qa/`、`slack-desktop-smoke.png` 和 `slack-desktop-smoke.mp4` 复制回 Mantis 构件目录。Crabbox 桌面/浏览器租约预先提供捕获工具和浏览器/原生构建辅助包，因此场景只应在较旧的租约上安装回退。Mantis 在 `mantis-slack-desktop-smoke-report.md` 中报告总时间和分阶段时间，以便慢速运行显示时间花在租约预热、凭据获取、远程设置还是构件复制上。通过 VNC 手动登录到 Slack Web 后使用 `--lease-id <cbx_...>` 复用；复用的租约还保持 Crabbox 的 pnpm 存储缓存温暖。默认 `--hydrate-mode source` 从源代码检出验证并在 VM 内运行 install/build。仅在复用的远程 workspace 已有 `node_modules` 和构建好的 `dist/` 时使用 `--hydrate-mode prehydrated`；该模式跳过昂贵的 install/build 步骤，当 workspace 未就绪时失败关闭。使用 `--gateway-setup` 时，Mantis 在 VM 内的端口 `38973` 上保留持久运行的 OpenClaw Slack Gateway；不使用时，命令运行正常的 bot-to-bot Slack QA 通道并在构件捕获后退出。

操作员检查清单、GitHub workflow dispatch 命令、证据注释合同、hydrate-mode 决策表、时间解释和故障处理步骤位于 [Mantis Slack Desktop Runbook](/concepts/mantis-slack-desktop-runbook)。

要进行 agent/CV 风格的桌面任务，运行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` 租用或复用 Crabbox 桌面/浏览器机器，启动 `crabbox record --while`，通过嵌套 `visual-driver` 驱动可见浏览器，捕获 `visual-task.png`，在选择 `--vision-mode image-describe` 时对截图运行 `openclaw infer image describe`，并写入 `visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json` 和 `mantis-visual-task-report.md`。设置 `--expect-text` 时，视觉提示要求结构化 JSON 判断，仅当 model 报告正面可见证据时才通过；仅引用目标文本的否定回复会使断言失败。对于无需调用图像理解 provider 的烟雾测试，使用 `--vision-mode metadata` 来证明桌面、浏览器、截图和视频管道。录制是 `visual-task` 的必要构件；如果 Crabbox 未录制任何非空 `visual-task.mp4`，即使视觉驱动通过，任务也会失败。失败时，除非任务已通过且未设置 `--keep-lease`，否则 Mantis 保留租约用于 VNC。

在使用池化的实时凭据之前，运行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 检查 Convex broker 环境，验证端点设置，并在存在维护者密钥时验证管理员/列表可达性。它仅报告密钥的已设置/缺失状态。

## 实时传输覆盖

实时传输通道共享一个合同，而不是各自定义场景列表形状。`qa-channel` 是广泛的合成产品行为套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | Canary | Mention 门控 | Bot-to-bot | 允许列表阻止 | 顶级回复 | 重启恢复 | Thread 后续 | Thread 隔离 | Reaction 观察 | Help 命令 | 原生命令注册 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Matrix | x | x | x | x | x | x | x | x | x | | |
| Telegram | x | x | x | | | | | | | x | |
| Discord | x | x | x | | | | | | | | x |
| Slack | x | x | x | x | x | x | x | x | | | |

这保持 `qa-channel` 作为广泛的产品行为套件，同时 Matrix、Telegram 和未来的实时传输共享一个明确的传输合同检查清单。

要在不将 Docker 引入 QA 路径的情况下运行一次性 Linux VM 通道，运行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个新的 Multipass 虚拟机，安装依赖项，在虚拟机内构建 OpenClaw，运行 `qa suite`，然后将正常的 QA 报告和摘要复制回主机的 `.artifacts/qa-e2e/...`。它复用与主机上 `qa suite` 相同的场景选择行为。主机和 Multipass suite 运行默认并行执行多个选定场景，使用隔离的 Gateway worker。`qa-channel` 默认并发数为 4，受选定场景数上限。使用 `--concurrency <count>` 调整 worker 数，或 `--concurrency 1` 进行串行执行。当任何场景失败时，命令退出非零。使用 `--allow-failures` 在不设置失败退出码的情况下写入构件。实时运行转发对虚拟机实际可行的受支持 QA auth 输入：基于环境变量的 provider 密钥、QA 实时 provider 配置路径，以及存在时的 `CODEX_HOME`。将 `--output-dir` 保持在代码库根目录下，以便虚拟机可以通过挂载的 workspace 写回。

## Telegram、Discord 和 Slack QA 参考

Matrix 有 [专用页面](/concepts/qa-matrix)，因为其场景数量和 Docker 支持的 homeserver 配置。Telegram、Discord 和 Slack 较小——各有少量场景，无 profile 系统，针对预先存在的真实 channel——所以它们的参考在这里。

### 共享 CLI 标志

这些通道通过 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 注册，接受相同的标志：

| 标志 | 默认值 | 描述 |
| --- | --- | --- |
| `--scenario <id>` | - | 仅运行此场景。可重复。 |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 报告/摘要/观察到的消息和输出日志写入位置。相对路径相对于 `--repo-root` 解析。 |
| `--repo-root <path>` | `process.cwd()` | 从中性 cwd 调用时的代码库根目录。 |
| `--sut-account <id>` | `sut` | QA Gateway 配置内的临时 account id。 |
| `--provider-mode <mode>` | `live-frontier` | `mock-openai` 或 `live-frontier`（传统 `live-openai` 仍有效）。 |
| `--model <ref>` / `--alt-model <ref>` | provider 默认值 | 主/备用 model 引用。 |
| `--fast` | 关 | 在支持的情况下使用 provider 快速模式。 |
| `--credential-source <env\|convex>` | `env` | 参见 [Convex 凭据池](#convex-凭据池)。 |
| `--credential-role <maintainer\|ci>` | CI 中为 `ci`，否则为 `maintainer` | `--credential-source convex` 时使用的角色。 |

每个通道在任何场景失败时退出非零。`--allow-failures` 在不设置失败退出码的情况下写入构件。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

针对一个真实私有 Telegram 群组，使用两个不同的 bot（driver + SUT）。SUT bot 必须有 Telegram 用户名；当两个 bot 都在 `@BotFather` 中启用了 **Bot-to-Bot Communication Mode** 时，bot-to-bot 观察效果最佳。

`--credential-source env` 时所需的环境变量：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 数字聊天 id（字符串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

可选：

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 在观察到的消息构件中保留消息正文（默认会编辑）。

场景（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`）：

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

隐式默认集始终涵盖 canary、mention 门控、原生命令回复、命令寻址和 bot-to-bot 群组回复。`mock-openai` 默认值还包括确定性回复链和最终消息 streaming 检查。`telegram-current-session-status-tool` 保持可选，因为它只有在直接跟在 canary 后面、而不是在任意原生命令回复后面时才稳定。使用 `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` 打印当前默认/可选分割及回归参考。

输出构件：

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - 包含从 canary 开始的每次回复 RTT（driver 发送 → 观察到 SUT 回复）。
- `telegram-qa-observed-messages.json` - 除非 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否则正文会被编辑。

### Discord QA

```bash
pnpm openclaw qa discord
```

针对一个真实私有 Discord guild channel，使用两个 bot：一个由 harness 控制的 driver bot 和一个由子 OpenClaw Gateway 通过捆绑的 Discord 插件启动的 SUT bot。验证 channel mention 处理，确认 SUT bot 已向 Discord 注册原生 `/help` 命令，以及可选的 Mantis 证据场景。

`--credential-source env` 时所需的环境变量：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必须匹配 Discord 返回的 SUT bot 用户 id（否则通道立即失败）。

可选：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 在观察到的消息构件中保留消息正文。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 为 `discord-voice-autojoin` 选择语音/舞台 channel；不设置时，场景为 SUT bot 选取第一个可见的语音/舞台 channel。

场景（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 可选语音场景。单独运行，启用 `channels.discord.voice.autoJoin`，并验证 SUT bot 当前的 Discord 语音状态是目标语音/舞台 channel。Convex Discord 凭据可能包含可选的 `voiceChannelId`；否则 runner 发现 guild 中第一个可见的语音/舞台 channel。
- `discord-status-reactions-tool-only` - 可选 Mantis 场景。单独运行，因为它将 SUT 切换为始终开启、仅工具的 guild 回复，启用 `messages.statusReactions.enabled=true`，然后捕获 REST reaction 时间线加 HTML/PNG 视觉构件。Mantis 前后报告还将场景提供的 MP4 构件保留为 `baseline.mp4` 和 `candidate.mp4`。

明确运行 Discord 语音自动加入场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

明确运行 Mantis 状态反应场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

输出构件：

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - 除非 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否则正文会被编辑。
- 状态反应场景运行时的 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

针对一个真实私有 Slack channel，使用两个不同的 bot：一个由 harness 控制的 driver bot 和一个由子 OpenClaw Gateway 通过捆绑的 Slack 插件启动的 SUT bot。

`--credential-source env` 时所需的环境变量：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

可选：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 在观察到的消息构件中保留消息正文。

场景（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

输出构件：

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - 除非 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否则正文会被编辑。

#### 设置 Slack workspace

该通道需要一个 workspace 中的两个不同 Slack 应用，以及两个 bot 均已加入的 channel：

- `channelId` - 两个 bot 已被邀请的 channel 的 `Cxxxxxxxxxx` id。使用专用 channel；通道每次运行都会发帖。
- `driverBotToken` - **Driver** 应用的 bot token（`xoxb-...`）。
- `sutBotToken` - **SUT** 应用的 bot token（`xoxb-...`），必须是与 driver 不同的 Slack 应用，以便其 bot 用户 id 不同。
- `sutAppToken` - SUT 应用的应用级 token（`xapp-...`），具有 `connections:write`，供 Socket Mode 使用，以便 SUT 应用可以接收事件。

建议使用专用于 QA 的 Slack workspace，而非复用生产 workspace。

下面的 SUT manifest 有意缩减了捆绑 Slack 插件的生产安装范围（`extensions/slack/src/setup-shared.ts:10`），仅包含实时 Slack QA suite 覆盖的权限和事件。有关用户看到的生产 channel 设置，请参见 [Slack channel 快速设置](/channels/slack#quick-setup)；QA Driver/SUT 对是有意分开的，因为通道需要一个 workspace 中的两个不同 bot 用户 id。

**1. 创建 Driver 应用**

访问 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → 选择 QA workspace，粘贴以下 manifest，然后 _Install to Workspace_：

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

复制 _Bot User OAuth Token_（`xoxb-...`）——这将成为 `driverBotToken`。driver 只需要发布消息并识别自身；无需事件，无需 Socket Mode。

**2. 创建 SUT 应用**

在同一 workspace 中重复 _Create New App → From a manifest_。此 QA 应用有意使用捆绑 Slack 插件生产 manifest（`extensions/slack/src/setup-shared.ts:10`）的较窄版本：省略了 reaction 范围和事件，因为实时 Slack QA suite 尚未涵盖 reaction 处理。

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Slack 创建应用后，在其设置页面执行两件事：

- _Install to Workspace_ → 复制 _Bot User OAuth Token_ → 这将成为 `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 添加范围 `connections:write` → 保存 → 复制 `xapp-...` 值 → 这将成为 `sutAppToken`。

通过对每个 token 调用 `auth.test` 验证两个 bot 具有不同的用户 id。运行时通过用户 id 区分 driver 和 SUT；为两者复用一个应用会立即导致 mention 门控失败。

**3. 创建 channel**

在 QA workspace 中创建一个 channel（例如 `#openclaw-qa`）并从 channel 内邀请两个 bot：

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

从 _channel info → About → Channel ID_ 复制 `Cxxxxxxxxxx` id——这将成为 `channelId`。公共 channel 可以使用；如果使用私有 channel，两个应用都已有 `groups:history`，因此 harness 的历史读取仍将成功。

**4. 注册凭据**

两个选项。使用环境变量进行单机调试（设置四个 `OPENCLAW_QA_SLACK_*` 变量并传递 `--credential-source env`），或将共享 Convex 池播种，以便 CI 和其他维护者可以租用它们。

对于 Convex 池，将四个字段写入 JSON 文件：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在 shell 中导出 `OPENCLAW_QA_CONVEX_SITE_URL` 和 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 后，注册并验证：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

期望 `count: 1`、`status: "active"`，无 `lease` 字段。

**5. 端到端验证**

本地运行通道以确认两个 bot 可以通过 broker 相互通信：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功运行在不到 30 秒内完成，`slack-qa-report.md` 显示 `slack-canary` 和 `slack-mention-gating` 状态均为 `pass`。如果通道挂起约 90 秒后以 `Convex credential pool exhausted for kind "slack"` 退出，则池为空或每行都已被租用——`qa credentials list --kind slack --status all --json` 会告诉你是哪种情况。

### Convex 凭据池

Telegram、Discord、Slack 和 WhatsApp 通道可以从共享 Convex 池租用凭据，而不是读取上面的环境变量。传递 `--credential-source convex`（或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 获取独占租约，在运行期间发送心跳，并在关闭时释放。池类型为 `"telegram"`、`"discord"`、`"slack"` 和 `"whatsapp"`。

broker 在 `admin/add` 时验证的载荷形状：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` - `groupId` 必须是数字 chat-id 字符串。
- Telegram 真实用户（`kind: "telegram-user"`）：`{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - 一个由 TDLib CLI driver 和 Telegram Desktop 视觉见证共用的独占一次性账户租约。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- WhatsApp（`kind: "whatsapp"`）：`{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - 手机号码必须是不同的 E.164 字符串。

对于视觉真实用户 Telegram 证明，优先使用持有的 Crabbox session：

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` 为 TDLib CLI driver 和 Telegram Desktop 见证持有一个独占 Convex `telegram-user` 租约，开始桌面录制，并保持 Crabbox 运行以进行任意 agent 驱动的复现步骤。agent 可以使用 `send`、`run`、`screenshot` 和 `status`，直到满意，然后 `finish` 在释放凭据之前收集截图、视频、去除静帧的视频/GIF、TDLib 探测输出和日志。默认情况下，`publish --session <file> --pr <number>` 仅注释 motion GIF；`--full-artifacts` 是日志和 JSON 输出的明确选择加入。默认 `probe` 命令仍是快速 `/status` 烟雾检查的单命令简写。

当 PR 需要确定性视觉差异时，使用 `--mock-response-file <path>`：同一个 mock model 回复可以在 `main` 和 PR head 上运行，同时 Telegram 格式化器或投递层发生变化。捕获默认值针对 PR 注释进行了调整：标准 Crabbox 类、24fps 桌面录制、24fps motion GIF 和 1920px 预览宽度。前后注释应发布仅包含预期 GIF 的干净包。

Slack 通道也可以使用池。Slack 载荷形状检查目前位于 Slack QA runner 而非 broker 中；使用 `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`，Slack channel id 格式为 `Cxxxxxxxxxx`。有关应用和范围配置，请参见 [设置 Slack workspace](#设置-slack-workspace)。

操作环境变量和 Convex broker 端点合同位于 [Testing → Shared Telegram credentials via Convex](/help/testing#shared-telegram-credentials-via-convex-v1)（该章节名称早于多 channel 池；租约语义在各类型间共享）。

## 代码库支持的种子

种子资产位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些有意放在 git 中，以便 QA 计划对人类和 agent 都可见。

`qa-lab` 应保持为通用 markdown runner。每个场景 markdown 文件是一次测试运行的事实来源，应定义：

- 场景元数据
- 可选的类别、能力、通道和风险元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 Gateway 配置补丁
- 可执行的 `qa-flow`

支持 `qa-flow` 的可复用运行时界面可以保持通用和跨切的。例如，markdown 场景可以将传输侧辅助工具与浏览器侧辅助工具结合，通过 Gateway `browser.request` 接缝驱动嵌入的 Control UI，而无需添加特殊案例 runner。

场景文件应按产品能力而非源代码树文件夹分组。文件移动时保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 进行实现可追溯性。

基础列表应足够广泛，涵盖：

- DM 和 channel 聊天
- thread 行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- model 切换
- subagent 交接
- 代码库读取和文档读取
- 一个小型构建任务，如 Lobster Invaders

## Provider mock 通道

`qa suite` 有两个本地 provider mock 通道：

- `mock-openai` 是 OpenClaw 场景感知 mock。它仍然是代码库支持 QA 和 parity 门控的默认确定性 mock 通道。
- `aimock` 启动 AIMock 支持的 provider 服务器，用于实验性协议、fixture、录制/重放和混沌覆盖。它是附加的，不替代 `mock-openai` 场景分发器。

Provider 通道实现位于 `extensions/qa-lab/src/providers/`。每个 provider 拥有其默认值、本地服务器启动、Gateway model 配置、auth-profile 暂存需求和实时/mock 能力标志。共享的 suite 和 Gateway 代码应通过 provider 注册表路由，而不是按 provider 名称分支。

## 传输适配器

`qa-lab` 拥有 markdown QA 场景的通用传输接缝。`qa-channel` 是该接缝上的第一个适配器，但设计目标更广：未来的真实或合成 channel 应插入同一个 suite runner，而不是添加传输特定的 QA runner。

在架构层面，分工是：

- `qa-lab` 拥有通用场景执行、worker 并发、构件写入和报告。
- 传输适配器拥有 Gateway 配置、就绪性、入站和出站观察、传输操作和规范化传输状态。
- `qa/scenarios/` 下的 markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时界面。

### 添加 channel

将 channel 添加到 markdown QA 系统只需要两件事：

1. 该 channel 的传输适配器。
2. 一个测试 channel 合同的场景包。

当共享 `qa-lab` 主机可以拥有流程时，不要添加新的顶级 QA 命令根。

`qa-lab` 拥有共享主机机制：

- `openclaw qa` 命令根
- suite 启动和销毁
- worker 并发
- 构件写入
- 报告生成
- 场景执行
- 较旧 `qa-channel` 场景的兼容别名

Runner 插件拥有传输合同：

- 如何在共享 `qa` 根下挂载 `openclaw qa <runner>`
- 如何为该传输配置 Gateway
- 如何检查就绪性
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露转录和规范化传输状态
- 如何执行传输支持的操作
- 如何处理传输特定的重置或清理

新 channel 的最低采用门槛：

1. 保持 `qa-lab` 作为共享 `qa` 根的拥有者。
2. 在共享 `qa-lab` 主机接缝上实现传输 runner。
3. 将传输特定的机制保留在 runner 插件或 channel harness 内。
4. 将 runner 挂载为 `openclaw qa <runner>`，而不是注册竞争性根命令。Runner 插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；延迟 CLI 和 runner 执行应保持在单独的入口点后面。
5. 在主题化的 `qa/scenarios/` 目录下编写或改编 markdown 场景。
6. 对新场景使用通用场景辅助工具。
7. 除非代码库正在进行有意迁移，否则保持现有兼容别名有效。

决策规则是严格的：

- 如果行为可以在 `qa-lab` 中表达一次，就放在 `qa-lab`。
- 如果行为依赖于一个 channel 传输，将其保留在该 runner 插件或插件 harness 中。
- 如果场景需要多个 channel 可以使用的新能力，添加通用辅助工具而不是 `suite.ts` 中的 channel 特定分支。
- 如果行为仅对一个传输有意义，保持场景传输特定并在场景合同中明确说明。

### 场景辅助工具名称

新场景的首选通用辅助工具：

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

兼容别名仍适用于现有场景——`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus`——但新场景编写应使用通用名称。别名的存在是为了避免一次性迁移，而不是作为未来的模式。

## 报告

`qa-lab` 从观察到的总线时间线导出 Markdown 协议报告。报告应回答：

- 什么有效
- 什么失败了
- 什么仍被阻止
- 哪些后续场景值得添加

要获取可用场景的清单——在规划后续工作或接入新传输时有用——运行 `pnpm openclaw qa coverage`（添加 `--json` 获取机器可读输出）。

要进行角色和风格检查，跨多个实时 model 引用运行同一场景并写入评判 Markdown 报告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-7,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-7,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

该命令运行本地 QA Gateway 子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，如聊天、workspace 帮助和小型文件任务。不应告知候选 model 它正在被评估。该命令保留每份完整转录，记录基本运行统计，然后要求评判 model 在支持的情况下以快速模式和 `xhigh` 推理按自然度、氛围和幽默感对运行进行排名。在比较 provider 时使用 `--blind-judge-models`：评判提示仍然获得每份转录和运行状态，但候选引用被替换为中性标签如 `candidate-01`；报告在解析后将排名映射回真实引用。候选运行默认为 `high` 思考，GPT-5.5 为 `medium`，支持它的较旧 OpenAI 评估引用为 `xhigh`。使用 `--model provider/model,thinking=<level>` 内联覆盖特定候选。`--thinking <level>` 仍设置全局回退，较旧的 `--model-thinking <provider/model=level>` 形式保留以兼容。OpenAI 候选引用默认为快速模式，以便在 provider 支持的情况下使用优先处理。在单个候选或评判需要覆盖时，内联添加 `,fast`、`,no-fast` 或 `,fast=false`。仅在需要对每个候选 model 强制开启快速模式时传递 `--fast`。候选和评判 model 运行均默认并发 16。当 provider 限制或本地 Gateway 压力使运行过于嘈杂时，降低 `--concurrency` 或 `--judge-concurrency`。当未传递候选 `--model` 时，角色评估默认为 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-7`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。当未传递 `--judge-model` 时，评判默认为 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-7,thinking=high`。

## 相关文档

- [Matrix QA](/concepts/qa-matrix)
- [个人 Agent 基准测试包](/concepts/personal-agent-benchmark-pack)
- [QA Channel](/channels/qa-channel)
- [Testing](/help/testing)
- [Dashboard](/web/dashboard)
