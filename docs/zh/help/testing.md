---
mmh3_hash: "e7fae5847ffa15d13c34f5f962e73c0b"
title: "测试"
summary: "测试套件：单元/e2e/实时套件、Docker 运行器以及每个测试涵盖的内容"
read_when:
  - 在本地或 CI 中运行测试
  - 为模型/Provider 错误添加回归测试
  - 调试 Gateway 和 Agent 行为
---

OpenClaw 有三个 Vitest 套件（单元/集成、e2e、实时）和一小组
Docker 运行器。本文档是"我们如何测试"的指南：

- 每个套件涵盖的内容（以及它故意_不_涵盖的内容）。
- 针对常见工作流（本地、预推送、调试）运行哪些命令。
- 实时测试如何发现凭据并选择模型/Provider。
- 如何为真实世界的模型/Provider 问题添加回归测试。

<Note>
**QA 堆栈（qa-lab、qa-channel、实时传输通道）**已单独记录：

- [QA 概述](/concepts/qa-e2e-automation) - 架构、命令界面、场景编写。
- [Matrix QA](/concepts/qa-matrix) - `pnpm openclaw qa matrix` 参考。
- [QA Channel](/channels/qa-channel) - 仓库支持场景使用的合成传输 Plugin。

本页面涵盖运行常规测试套件和 Docker/Parallels 运行器。下面的 QA 专用运行器部分（[QA 专用运行器](#qa-specific-runners)）列出了具体的 `qa` 调用，并指向上面的参考资料。
</Note>

## 快速入门

平时：

- 完整门控（推送前预期运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在宽裕的机器上更快的本地全套件运行：`pnpm test:max`
- 直接 Vitest 监视循环：`pnpm test:watch`
- 直接文件定位现在也路由扩展/Channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 在单个失败上迭代时首选定向运行。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改测试或需要额外信心时：

- 覆盖率门控：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

调试真实 Provider/模型时（需要真实凭据）：

- 实时套件（模型 + Gateway 工具/图像探测）：`pnpm test:live`
- 安静地定向一个实时文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 运行时性能报告：分派 `OpenClaw Performance`，使用 `live_gpt54=true` 进行真实 `openai/gpt-5.4` Agent 轮次，或使用 `deep_profile=true` 获取 Kova CPU/堆/跟踪工件。每日计划运行在配置 `CLAWGRIT_REPORTS_TOKEN` 时将 mock-provider、深度配置文件和 GPT 5.4 通道工件发布到 `openclaw/clawgrit-reports`。mock-provider 报告还包括源级 Gateway 启动、内存、Plugin 压力、重复假模型 hello 循环和 CLI 启动数字。
- Docker 实时模型扫描：`pnpm test:docker:live-models`
  - 每个选定的模型现在运行一个文本轮次加上一个小的文件读取风格探测。元数据声明 `image` 输入的模型还运行一个小的图像轮次。在隔离 Provider 故障时，使用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用额外探测。
  - CI 覆盖：每日 `OpenClaw Scheduled Live And E2E Checks` 和手动 `OpenClaw Release Checks` 都以 `include_live_suites: true` 调用可重用的实时/E2E 工作流，其中包括按 Provider 分片的单独 Docker 实时模型矩阵作业。
  - 对于有针对性的 CI 重新运行，分派 `OpenClaw Live And E2E Checks (Reusable)`，使用 `include_live_suites: true` 和 `live_models_only: true`。
  - 将新的高信号 Provider 密钥添加到 `scripts/ci-hydrate-live-auth.sh` 以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 及其计划/发布调用者。
- 原生 Codex 绑定聊天冒烟：`pnpm test:docker:live-codex-bind`
  - 对 Codex 应用服务器路径运行 Docker 实时通道，用 `/codex bind` 绑定合成 Slack DM，测试 `/codex fast` 和 `/codex permissions`，然后验证纯回复和图像附件通过原生 Plugin 绑定而不是 ACP 路由。
- Codex 应用服务器测试套件冒烟：`pnpm test:docker:live-codex-harness`
  - 通过 Plugin 拥有的 Codex 应用服务器测试套件运行 Gateway Agent 轮次，验证 `/codex status` 和 `/codex models`，默认测试图像、Cron MCP、子 Agent 和 Guardian 探测。使用 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 禁用子 Agent 探测，以隔离其他 Codex 应用服务器故障。对于有针对性的子 Agent 检查，禁用其他探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。除非设置 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则在子 Agent 探测后退出。
- Codex 按需安装冒烟：`pnpm test:docker:codex-on-demand`
  - 在 Docker 中安装打包的 OpenClaw tarball，运行 OpenAI API 密钥引导，并验证 Codex Plugin 和 `@openai/codex` 依赖项在按需时下载到受管理的 npm 根目录中。
- 实时 Plugin 工具依赖冒烟：`pnpm test:docker:live-plugin-tool`
  - 打包带有真实 `slugify` 依赖项的固定 Plugin，通过 `npm-pack:` 安装它，验证受管理的 npm 根目录下的依赖项，然后要求实时 OpenAI 模型调用 Plugin 工具并返回隐藏的 slug。
- Crestodian 救援命令冒烟：`pnpm test:live:crestodian-rescue-channel`
  - 消息 Channel 救援命令界面的可选双重保障检查。它测试 `/crestodian status`，排队一个持久的模型更改，回复 `/crestodian yes`，并验证审计/配置写入路径。
- Crestodian 规划器 Docker 冒烟：`pnpm test:docker:crestodian-planner`
  - 在无配置容器中运行 Crestodian，PATH 上有假的 Claude CLI，并验证模糊规划器回退是否转换为经过审计的类型化配置写入。
- Crestodian 首次运行 Docker 冒烟：`pnpm test:docker:crestodian-first-run`
  - 从空的 OpenClaw 状态目录开始，将裸 `openclaw` 路由到 Crestodian，应用 setup/model/agent/Discord Plugin + SecretRef 写入，验证配置，并验证审计条目。同样的 Ring 0 设置路径也由 QA Lab 的 `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 涵盖。
- Moonshot/Kimi 成本冒烟：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后对 `moonshot/kimi-k2.6` 运行隔离的 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。验证 JSON 报告 Moonshot/K2.6 并且 Assistant 脚本存储了标准化的 `usage.cost`。

<Tip>
当你只需要一个失败的案例时，最好通过下面描述的白名单环境变量缩小实时测试范围。
</Tip>

## QA 专用运行器

当你需要 QA 实验室真实感时，这些命令位于主测试套件旁边：

CI 在专用工作流中运行 QA Lab。智能体对等嵌套在 `QA-Lab - All Lanes` 和发布验证下，而不是独立的 PR 工作流。广泛验证应使用带有 `rerun_group=qa-parity` 的 `Full Release Validation` 或发布检查 QA 组。稳定/默认发布检查将详尽的实时/Docker 浸泡保留在 `run_release_soak=true` 之后；`full` 配置文件强制打开浸泡。`QA-Lab - All Lanes` 每晚在 `main` 上运行，并从手动分派运行，具有 mock 对等通道、实时 Matrix 通道、Convex 管理的实时 Telegram 通道和 Convex 管理的实时 Discord 通道作为并行作业。计划的 QA 和发布检查显式传递 Matrix `--profile fast`，而 Matrix CLI 和手动工作流输入默认保持 `all`；手动分派可以将 `all` 分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 在发布批准之前运行对等以及快速 Matrix 和 Telegram 通道，使用 `mock-openai/gpt-5.5` 进行发布传输检查，使其保持确定性并避免正常的 Provider Plugin 启动。这些实时传输网关禁用内存搜索；内存行为由 QA 对等套件覆盖。

完整发布实时媒体分片使用 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已有 `ffmpeg` 和 `ffprobe`。Docker 实时模型/后端分片使用每个选定提交构建一次的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取它，而不是在每个分片中重建。

- `pnpm openclaw qa suite`
  - 直接在主机上运行仓库支持的 QA 场景。
  - 默认通过隔离的 Gateway 工作器并行运行多个选定的场景。`qa-channel` 默认并发数为 4（受选定场景数量限制）。使用 `--concurrency <count>` 调整工作器数量，或使用 `--concurrency 1` 进行旧的串行通道。
  - 当任何场景失败时以非零退出。当你想要工件而不需要失败退出代码时，使用 `--allow-failures`。
  - 支持 Provider 模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 启动本地 AIMock 支持的 Provider 服务器，用于实验性固件和协议 mock 覆盖，而不替换场景感知的 `mock-openai` 通道。
- `pnpm test:plugins:kitchen-sink-live`
  - 通过 QA Lab 运行实时 OpenAI Kitchen Sink Plugin 测试。它安装外部 Kitchen Sink 包，验证 Plugin SDK 界面库存，探测 `/healthz` 和 `/readyz`，记录 Gateway CPU/RSS 证据，运行实时 OpenAI 轮次，并检查对抗性诊断。需要实时 OpenAI 认证，如 `OPENAI_API_KEY`。在经过水化的 Testbox Session 中，当存在 `openclaw-testbox-env` 帮助器时，它会自动获取 Testbox 实时认证配置文件。
- `pnpm test:gateway:cpu-scenarios`
  - 运行 Gateway 启动基准测试加上小型 mock QA Lab 场景包（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`），并在 `.artifacts/gateway-cpu-scenarios/` 下写入组合 CPU 观察摘要。
  - 默认仅标记持续高 CPU 观察（`--cpu-core-warn` 加 `--hot-wall-warn-ms`），因此短暂启动突发作为指标记录，而不像持续数分钟的 Gateway 峰值回归。
  - 使用已构建的 `dist` 工件；当检出没有新鲜运行时输出时，先运行构建。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 中运行相同的 QA 套件。
  - 保持与主机上 `qa suite` 相同的场景选择行为。
  - 重用与 `qa suite` 相同的 Provider/模型选择标志。
  - 实时运行转发来宾支持的实时 QA 认证输入：基于环境的 Provider 密钥、QA 实时 Provider 配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保留在仓库根目录下，以便来宾可以通过挂载的工作区写回。
  - 在 `.artifacts/qa-e2e/...` 下写入正常的 QA 报告 + 摘要以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点，用于运营风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建 npm tarball，将其全局安装在 Docker 中，运行非交互式 OpenAI API 密钥引导，默认配置 Telegram，验证打包的 Plugin 运行时无需启动依赖修复即可加载，运行 doctor，并对 mock OpenAI 端点运行一个本地 Agent 轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 运行相同的打包安装通道。
- `pnpm test:docker:session-runtime-context`
  - 运行嵌入式运行时上下文脚本的确定性内置应用 Docker 冒烟。它验证隐藏的 OpenClaw 运行时上下文作为非显示自定义消息持久化，而不是泄漏到可见的用户轮次中，然后播种受影响的损坏 Session JSONL 并验证 `openclaw doctor --fix` 将其重写到带有备份的活跃分支。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装 OpenClaw 包候选，运行已安装包引导，通过已安装的 CLI 配置 Telegram，然后将实时 Telegram QA 通道与已安装的包作为 SUT Gateway 重用。
  - 包装器仅从检出挂载 `qa-lab` 测试套件源；已安装的包拥有 `dist`、`openclaw/plugin-sdk` 和捆绑的 Plugin 运行时，因此通道不会将当前检出的 Plugin 混入被测试的包中。
  - 默认为 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；设置 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或 `OPENCLAW_CURRENT_PACKAGE_TGZ` 以测试已解析的本地 tarball，而不是从注册表安装。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境凭据或 Convex 凭据来源。对于 CI/发布自动化，设置 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` 加 `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密钥。如果 `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密钥在 CI 中存在，Docker 包装器会自动选择 Convex。
  - 包装器在 Docker 构建/安装工作之前验证主机上的 Telegram 或 Convex 凭据环境。仅在故意调试预凭据设置时设置 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅为此通道覆盖共享的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 将此通道作为手动维护者工作流 `NPM Telegram Beta E2E` 公开。它不在合并时运行。工作流使用 `qa-live-shared` 环境和 Convex CI 凭据租约。
- GitHub Actions 还公开 `Package Acceptance` 用于针对一个候选包的附加产品证明。它接受可信引用、已发布的 npm 规范、HTTPS tarball URL 加 SHA-256，或来自另一次运行的 tarball 工件，将标准化的 `openclaw-current.tgz` 上传为 `package-under-test`，然后使用冒烟、包、产品、完整或自定义通道配置文件运行现有的 Docker E2E 调度器。设置 `telegram_mode=mock-openai` 或 `live-frontier` 以对相同的 `package-under-test` 工件运行 Telegram QA 工作流。
  - 最新 beta 产品证明：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 精确 tarball URL 证明需要摘要：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- 工件证明从另一个 Actions 运行下载 tarball 工件：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中打包并安装当前的 OpenClaw 构建，使用配置的 OpenAI 启动 Gateway，然后通过配置编辑启用捆绑的 Channel/Plugin。
  - 验证设置发现留下未配置的可下载 Plugin，第一次配置的 doctor 修复明确安装每个缺失的可下载 Plugin，第二次重启不运行隐藏的依赖修复。
  - 还安装已知的旧 npm 基线，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选的更新后 doctor 清理旧版 Plugin 依赖碎片，而不需要测试套件端的后安装修复。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels 来宾运行原生打包安装更新冒烟。每个选定的平台首先安装请求的基线包，然后在同一来宾中运行已安装的 `openclaw update` 命令，并验证已安装的版本、更新状态、Gateway 就绪状态和一个本地 Agent 轮次。
  - 在迭代一个来宾时使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 获取摘要工件路径和每通道状态。
  - OpenAI 通道默认使用 `openai/gpt-5.5` 进行实时 Agent 轮次证明。当故意验证另一个 OpenAI 模型时，传递 `--model <provider/model>` 或设置 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 将长本地运行包装在主机超时中，以防 Parallels 传输停止消耗剩余的测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 脚本在 `/tmp/openclaw-parallels-npm-update.*` 下写入嵌套通道日志。在假设外部包装器挂起之前，检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - Windows 更新在冷来宾上的更新后 doctor 和包更新工作上可能花费 10 到 15 分钟；当嵌套的 npm 调试日志在推进时，这仍然是健康的。
  - 不要将此聚合包装器与单个 Parallels macOS、Windows 或 Linux 冒烟通道并行运行。它们共享 VM 状态，可能在快照恢复、包服务或来宾 Gateway 状态上发生冲突。
  - 更新后证明运行正常的捆绑 Plugin 界面，因为语音、图像生成和媒体理解等能力外观即使 Agent 轮次本身只检查简单的文本响应，也会通过捆绑的运行时 API 加载。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock Provider 服务器进行直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 对一次性 Docker 支持的 Tuwunel 家庭服务器运行 Matrix 实时 QA 通道。仅限源检出 - 打包安装不包含 `qa-lab`。
  - 完整的 CLI、配置文件/场景目录、环境变量和工件布局：[Matrix QA](/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用来自环境的驱动程序和 SUT 机器人令牌对真实私有群组运行 Telegram 实时 QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 ID 必须是数字 Telegram 聊天 ID。
  - 支持 `--credential-source convex` 用于共享池凭据。默认使用环境模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以选择共享租约。
  - 默认覆盖金丝雀、提及门控、命令寻址、`/status`、机器人到机器人的提及回复和核心原生命令回复。`mock-openai` 默认还覆盖确定性回复链和 Telegram 最终消息流式回归。使用 `--list-scenarios` 获取可选探测，如 `session_status`。
  - 当任何场景失败时以非零退出。当你想要工件而不需要失败退出代码时，使用 `--allow-failures`。
  - 需要同一私有群组中两个不同的机器人，SUT 机器人公开一个 Telegram 用户名。
  - 为了稳定的机器人到机器人观察，在 `@BotFather` 中为两个机器人启用机器人到机器人通信模式，并确保驱动程序机器人可以观察群组机器人流量。
  - 在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和观察到的消息工件。回复场景包括从驱动程序发送请求到观察到的 SUT 回复的 RTT。

`Mantis Telegram Live` 是围绕此通道的 PR 证据包装器。它使用 Convex 租借的 Telegram 凭据运行候选引用，在 Crabbox 桌面浏览器中呈现经过编辑的观察到的消息脚本，记录 MP4 证据，生成运动裁剪的 GIF，上传工件包，并在设置 `pr_number` 时通过 Mantis GitHub App 发布内联 PR 证据。维护者可以通过 Actions UI 的 `Mantis Scenario`（`scenario_id: telegram-live`）或直接从 PR 评论启动它：

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` 是用于 PR 视觉证明的智能体原生 Telegram Desktop 前后包装器。通过 `Mantis Scenario`（`scenario_id: telegram-desktop-proof`）或从 PR 评论，从 Actions UI 使用自由格式 `instructions` 启动它：

```text
@Mantis telegram desktop proof
```

Mantis Agent 读取 PR，决定哪些 Telegram 可见行为证明了更改，在基线和候选引用上运行真实用户 Crabbox Telegram Desktop 证明通道，迭代直到原生 GIF 有用，写入配对的 `motionPreview` 清单，并在设置 `pr_number` 时通过 Mantis GitHub App 发布相同的 2 列 GIF 表格。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - 租用或重用 Crabbox Linux 桌面，安装原生 Telegram Desktop，使用租用的 Telegram SUT 机器人令牌配置 OpenClaw，启动 Gateway，并从可见的 VNC 桌面记录截图/MP4 证据。
  - 默认为 `--credential-source convex`，因此工作流只需要 Convex 代理密钥。使用 `--credential-source env` 和 `pnpm openclaw qa telegram` 相同的 `OPENCLAW_QA_TELEGRAM_*` 变量。
  - Telegram Desktop 仍然需要用户登录/配置文件。机器人令牌仅配置 OpenClaw。使用 `--telegram-profile-archive-env <name>` 获取 base64 `.tgz` 配置文件存档，或使用 `--keep-lease` 并通过 VNC 手动登录一次。
  - 在输出目录下写入 `mantis-telegram-desktop-builder-report.md`、`mantis-telegram-desktop-builder-summary.json`、`telegram-desktop-builder.png` 和 `telegram-desktop-builder.mp4`。

实时传输通道共享一个标准合约，以防新传输漂移；每通道覆盖矩阵位于 [QA 概述 → 实时传输覆盖](/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是广泛的合成套件，不属于该矩阵。

### 通过 Convex 共享 Telegram 凭据（v1）

当 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）启用时，QA Lab 从 Convex 支持的池中获取独占租约，在通道运行时心跳该租约，并在关闭时释放租约。该章节名称早于 Discord、Slack 和 WhatsApp 支持；租约合约跨种类共享。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 选定角色的一个密钥：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用于 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用于 `ci`
- 凭据角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境默认：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认为 `ci`，否则为 `maintainer`）

可选的环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选跟踪 ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许本地环回 `http://` Convex URL 仅用于本地开发。

`OPENCLAW_QA_CONVEX_SITE_URL` 在正常操作中应使用 `https://`。

维护者管理命令（池添加/移除/列出）需要专门的 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

维护者的 CLI 帮助器：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在实时运行之前使用 `doctor` 检查 Convex 站点 URL、代理密钥、端点前缀、HTTP 超时和管理/列出可达性，而不打印密钥值。使用 `--json` 获取脚本和 CI 实用程序中的机器可读输出。

默认端点合约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 耗尽/可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - 成功：`{ status: "ok", index, data }`
- `POST /heartbeat`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空 `2xx`）
- `POST /release`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空 `2xx`）
- `POST /admin/add`（仅维护者密钥）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅维护者密钥）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约保护：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅维护者密钥）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 种类的有效负载形状：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数字 Telegram 聊天 ID 字符串。
- `admin/add` 验证 `kind: "telegram"` 的此形状并拒绝格式错误的有效负载。

Telegram 真实用户种类的有效负载形状：

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId` 和 `telegramApiId` 必须是数字字符串。
- `tdlibArchiveSha256` 和 `desktopTdataArchiveSha256` 必须是 SHA-256 十六进制字符串。
- `kind: "telegram-user"` 代表一个 Telegram 临时账户。将租约视为账户范围：TDLib CLI 驱动程序和 Telegram Desktop 视觉见证从相同的有效负载恢复，一次只有一个作业应持有租约。

Telegram 真实用户租约恢复：

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

使用 `Telegram -workdir "$tmp/desktop"` 恢复的 Desktop 配置文件，当需要视觉录制时。在本地运营者环境中，`scripts/e2e/telegram-user-credential.ts` 如果进程环境变量缺失，默认读取 `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env`。

Agent 驱动的 Crabbox Session：

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` 租用 `telegram-user` 凭据，将同一账户恢复到 Crabbox Linux 桌面上的 TDLib 和 Telegram Desktop 中，从当前检出启动本地 mock SUT Gateway，打开可见的 Telegram 聊天，开始桌面录制，并写入私有 `session.json`。当 Session 处于活跃状态时，Agent 可以继续测试直到满意：

- `send --session <file> --text <message>` 通过真实 TDLib 用户发送并等待 SUT 回复。
- `run --session <file> -- <remote command>` 在 Crabbox 上运行任意命令并保存其输出。
- `screenshot --session <file>` 捕获当前可见的桌面。
- `status --session <file>` 打印租约和 WebVNC 命令。
- `finish --session <file>` 停止录制器，捕获截图/视频/运动裁剪工件，释放 Convex 凭据，停止本地 SUT 进程，并停止 Crabbox 租约，除非传递了 `--keep-box`。
- `publish --session <file> --pr <number>` 默认发布仅 GIF 的 PR 评论。仅当有意需要日志或 JSON 工件时才传递 `--full-artifacts`。

### 向 QA 添加 Channel

新 Channel 适配器的架构和场景帮助器名称位于 [QA 概述 → 添加 Channel](/concepts/qa-e2e-automation#adding-a-channel)。最低标准：在共享的 `qa-lab` 主机接缝上实现传输运行器，在 Plugin 清单中声明 `qaRunners`，挂载为 `openclaw qa <runner>`，并在 `qa/scenarios/` 下编写场景。

## 测试套件（在哪里运行什么）

将套件视为"增加的真实感"（以及增加的不稳定性/成本）：

### 单元/集成（默认）

- 命令：`pnpm test`
- 配置：未定向的运行使用 `vitest.full-*.config.ts` 分片集，可能将多项目分片扩展为每项目配置以进行并行调度
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的核心/单元库存；UI 单元测试在专用 `unit-ui` 分片中运行
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 认证、路由、工具、解析、配置）
  - 已知错误的确定性回归
- 期望：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
  - 解析器和公共界面加载器测试必须使用生成的小型 Plugin 固件证明广泛的 `api.js` 和 `runtime-api.js` 回退行为，而不是真实的捆绑 Plugin 源 API。真实的 Plugin API 加载属于 Plugin 拥有的合约/集成套件。

原生依赖策略：

- 默认测试安装跳过可选的原生 Discord opus 构建。Discord 语音接收使用纯 JS `opusscript` 解码器，`@discordjs/opus` 在 `allowBuilds` 中保持禁用，因此本地测试和 Testbox 通道不编译原生附加组件。
- 如果你有意需要比较原生 opus 构建，请使用专用的 Discord 语音性能或实时通道。不要在默认 `allowBuilds` 中将 `@discordjs/opus` 设置为 `true`；这会使不相关的安装/测试循环编译原生代码。

<AccordionGroup>
  <Accordion title="项目、分片和范围通道">

    - 未定向的 `pnpm test` 运行十二个较小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这减少了负载机器上的峰值 RSS，并避免自动回复/扩展工作饿死不相关的套件。
    - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片监视循环不实用。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 首先通过范围通道路由显式文件/目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 避免支付完整根项目启动费用。
    - `pnpm test:changed` 默认通过廉价的范围通道扩展已更改的 git 路径：直接测试编辑、兄弟 `*.test.ts` 文件、显式源映射和本地导入图依赖项。配置/设置/包编辑不广泛运行测试，除非你显式使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄工作的正常智能本地检查门控。它将差异分类为核心、核心测试、扩展、扩展测试、应用、文档、发布元数据、实时 Docker 工具和工具，然后运行匹配的类型检查、lint 和保护命令。它不运行 Vitest 测试；调用 `pnpm test:changed` 或显式 `pnpm test <target>` 获取测试证明。仅版本提升的发布元数据运行有针对性的版本/配置/根依赖检查，以及拒绝顶级版本字段之外的包更改的保护。
    - 实时 Docker ACP 测试套件编辑运行有针对性的检查：实时 Docker 认证脚本的 Shell 语法和实时 Docker 调度器空运行。仅当差异限于 `scripts["test:docker:live-*"]` 时才包含 `package.json` 更改；依赖、导出、版本和其他包界面编辑仍然使用更广泛的保护。
    - 来自 Agent、命令、Plugin、自动回复帮助器、`plugin-sdk` 和类似纯实用程序区域的导入轻量单元测试通过 `unit-fast` 通道路由，跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时密集的文件保留在现有通道上。
    - 选定的 `plugin-sdk` 和 `commands` 帮助器源文件还将更改模式运行映射到那些轻量通道中的显式兄弟测试，因此帮助器编辑避免重新运行该目录的完整重量套件。
    - `auto-reply` 对顶级核心帮助器、顶级 `reply.*` 集成测试和 `src/auto-reply/reply/**` 子树有专用桶。CI 进一步将 reply 子树拆分为 Agent 运行器、分发和命令/状态路由分片，以防一个导入密集桶拥有完整的 Node 尾部。
    - 正常 PR/主要 CI 故意跳过扩展批量扫描和仅发布的 `agentic-plugins` 分片。完整发布验证在发布候选上为那些 Plugin/扩展重型套件分派单独的 `Plugin Prerelease` 子工作流。

  </Accordion>

  <Accordion title="嵌入式运行器覆盖">

    - 当你更改消息工具发现输入或压缩运行时上下文时，保持两个级别的覆盖。
    - 为纯路由和规范化边界添加有针对性的帮助器回归。
    - 保持嵌入式运行器集成套件健康：`src/agents/pi-embedded-runner/compact.hooks.test.ts`、`src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和 `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些套件验证范围 ID 和压缩行为仍然通过真实的 `run.ts` / `compact.ts` 路径流动；仅帮助器测试不足以替代那些集成路径。

  </Accordion>

  <Accordion title="Vitest 池和隔离默认值">

    - 基础 Vitest 配置默认为 `threads`。
    - 共享 Vitest 配置在根项目、e2e 和实时配置中固定 `isolate: false` 并使用非隔离运行器。
    - 根 UI 通道保留其 `jsdom` 设置和优化器，但也在共享的非隔离运行器上运行。
    - 每个 `pnpm test` 分片从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
    - `scripts/run-vitest.mjs` 默认为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译流失。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 与原始 V8 行为进行比较。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 显示差异触发了哪些架构通道。
    - 预提交钩子仅格式化。它重新暂存格式化的文件，不运行 lint、类型检查或测试。
    - 在交接或推送之前，当你需要智能本地检查门控时，显式运行 `pnpm check:changed`。
    - `pnpm test:changed` 默认通过廉价的范围通道路由。仅当 Agent 决定测试套件、配置、包或合约编辑真正需要更广泛的 Vitest 覆盖时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是工作器数量上限更高。
    - 本地工作器自动扩展有意保守，当主机负载平均值已经很高时会退缩，因此默认情况下多个并发 Vitest 运行损害较小。
    - 基础 Vitest 配置将项目/配置文件标记为 `forceRerunTriggers`，以便在测试布线更改时更改模式重新运行保持正确。
    - 配置在支持的主机上保持 `OPENCLAW_VITEST_FS_MODULE_CACHE` 启用；如果你想要一个明确的缓存位置进行直接分析，设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 启用 Vitest 导入持续时间报告加导入分解输出。
    - `pnpm test:perf:imports:changed` 将相同的分析视图范围限制为自 `origin/main` 以来更改的文件。
    - 分片计时数据写入 `.artifacts/vitest-shard-timings.json`。整配置运行使用配置路径作为键；include-pattern CI 分片附加分片名称，以便可以单独跟踪过滤的分片。
    - 当一个热测试仍然大部分时间花在启动导入上时，将重型依赖项保留在窄的本地 `*.runtime.ts` 接缝后面，并直接模拟该接缝，而不是深度导入运行时帮助器只是为了通过 `vi.mock(...)` 传递它们。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 将路由的 `test:changed` 与该提交差异的原生根项目路径进行比较，并打印墙时间加 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 通过 `scripts/test-projects.mjs` 和根 Vitest 配置路由更改的文件列表，对当前脏树进行基准测试。
    - `pnpm test:perf:profile:main` 为 Vitest/Vite 启动和转换开销写入主线程 CPU 配置文件。
    - `pnpm test:perf:profile:runner` 在禁用文件并行性的情况下为单元套件写入运行器 CPU + 堆配置文件。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制为一个工作器
- 范围：
  - 启动默认启用诊断的真实环回 Gateway
  - 通过诊断事件路径驱动合成 Gateway 消息、内存和大有效负载流失
  - 通过 Gateway WS RPC 查询 `diagnostics.stability`
  - 涵盖诊断稳定性包持久化帮助器
  - 断言记录器保持有界，合成 RSS 样本保持在压力预算下，每 Session 队列深度排回零
- 期望：
  - CI 安全且无密钥
  - 稳定性回归跟进的窄通道，不是完整 Gateway 套件的替代

### E2E（Gateway 冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts` 和 `extensions/` 下捆绑 Plugin E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads`，`isolate: false`，与仓库其余部分匹配。
  - 使用自适应工作器（CI：最多 2，本地：默认 1）。
  - 默认以静默模式运行以减少控制台 I/O 开销。
- 有用的覆盖：
  - `OPENCLAW_E2E_WORKERS=<n>` 强制工作器数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 端到端行为
  - WebSocket/HTTP 界面、Node 配对和更重的网络
- 期望：
  - 在 CI 中运行（当在管道中启用时）
  - 不需要真实密钥
  - 比单元测试有更多的移动部件（可能更慢）

### E2E：OpenShell 后端冒烟

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动隔离的 OpenShell Gateway
  - 从临时本地 Dockerfile 创建沙盒
  - 通过真实的 `sandbox ssh-config` + SSH exec 测试 OpenClaw 的 OpenShell 后端
  - 通过沙盒 fs 桥验证远程规范文件系统行为
- 期望：
  - 仅可选；不属于默认 `pnpm test:e2e` 运行
  - 需要本地 `openshell` CLI 和工作的 Docker 守护进程
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 和沙盒
- 有用的覆盖：
  - `OPENCLAW_E2E_OPENSHELL=1` 在手动运行更广泛的 e2e 套件时启用测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 指向非默认 CLI 二进制或包装脚本

### 实时（真实 Provider + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts` 和 `extensions/` 下捆绑 Plugin 实时测试
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - "这个 Provider/模型今天用真实凭据实际可用吗？"
  - 捕获 Provider 格式更改、工具调用怪癖、认证问题和速率限制行为
- 期望：
  - 设计上不稳定（真实网络、真实 Provider 策略、配额、中断）
  - 花钱/使用速率限制
  - 更喜欢运行缩小的子集而不是"所有"
- 实时运行源 `~/.profile` 以获取缺失的 API 密钥。
- 默认情况下，实时运行仍然隔离 `HOME` 并将配置/认证材料复制到临时测试主目录中，因此单元固件无法修改你真实的 `~/.openclaw`。
- 仅在你有意需要实时测试使用你真实主目录时设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认为更安静的模式：保持 `[live] ...` 进度输出，但抑制额外的 `~/.profile` 通知并静音 Gateway 引导日志/Bonjour 喋喋不休。如果你想要完整的启动日志，设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（特定 Provider）：使用逗号/分号格式设置 `*_API_KEYS` 或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）或通过 `OPENCLAW_LIVE_*_KEY` 进行每实时覆盖；测试在速率限制响应上重试。
- 进度/心跳输出：
  - 实时套件现在将进度行发送到 stderr，因此即使 Vitest 控制台捕获安静，长 Provider 调用也明显处于活跃状态。
  - `vitest.live.config.ts` 禁用 Vitest 控制台拦截，因此 Provider/Gateway 进度行在实时运行期间立即流式传输。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway/探测心跳。

## 我应该运行哪个套件？

使用此决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果你更改了很多，还运行 `pnpm test:coverage`）
- 触及 Gateway 网络/WS 协议/配对：添加 `pnpm test:e2e`
- 调试"我的机器人挂了"/特定 Provider 失败/工具调用：运行缩小的 `pnpm test:live`

## 实时（网络触达）测试

有关实时模型矩阵、CLI 后端冒烟、ACP 冒烟、Codex 应用服务器测试套件和所有媒体 Provider 实时测试（Deepgram、BytePlus、ComfyUI、图像、音乐、视频、媒体测试套件）以及实时运行的凭据处理，请参阅[实时测试套件](/help/testing-live)。有关专用的更新和 Plugin 验证清单，请参阅[更新和 Plugin 测试](/help/testing-updates-plugins)。

## Docker 运行器（可选的"在 Linux 上工作"检查）

这些 Docker 运行器分为两个桶：

- 实时模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只运行各自匹配的配置文件密钥实时文件在仓库 Docker 镜像中（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），挂载你的本地配置目录和工作区（如果挂载，则源 `~/.profile`）。匹配的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 实时运行器默认为较小的冒烟上限，以使完整的 Docker 扫描保持实用：`test:docker:live-models` 默认为 `OPENCLAW_LIVE_MAX_MODELS=12`，`test:docker:live-gateway` 默认为 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和 `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确想要更大的详尽扫描时，覆盖这些环境变量。
- `test:docker:all` 通过 `test:docker:live-build` 构建一次实时 Docker 镜像，通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 一次打包为 npm tarball，然后构建/重用两个 `scripts/e2e/Dockerfile` 镜像。裸镜像只是安装/更新/Plugin 依赖通道的 Node/Git 运行器；这些通道挂载预构建的 tarball。功能镜像将相同的 tarball 安装到 `/app` 中用于内置应用功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行选定的计划。聚合使用加权本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程插槽，而资源上限防止重型实时、npm 安装和多服务通道同时全部启动。如果单个通道重于活跃上限，调度器仍然可以在池为空时启动它，然后让它单独运行，直到容量再次可用。默认为 10 个插槽，`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`，`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`，`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；仅在 Docker 主机有更多空间时调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。运行器默认执行 Docker 预检，删除陈旧的 OpenClaw E2E 容器，每 30 秒打印状态，将成功的通道计时存储在 `.artifacts/docker-tests/lane-timings.json` 中，并使用这些计时在以后的运行中首先启动较长的通道。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 打印加权通道清单而不构建或运行 Docker，或使用 `node scripts/test-docker-all.mjs --plan-json` 打印选定通道、包/镜像需求和凭据的 CI 计划。
- `Package Acceptance` 是用于"此可安装 tarball 是否作为产品工作？"的 GitHub 原生包门控。它从 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一个候选包，将其上传为 `package-under-test`，然后对该确切 tarball 运行可重用的 Docker E2E 通道，而不是重新打包选定的引用。配置文件按广度排序：`smoke`、`package`、`product` 和 `full`。有关包/更新/Plugin 合约、已发布升级幸存者矩阵、发布默认值和故障分类，请参阅[更新和 Plugin 测试](/help/testing-updates-plugins)。
- 构建和发布检查在 tsdown 后运行 `scripts/check-cli-bootstrap-imports.mjs`。保护程序从 `dist/entry.js` 和 `dist/cli/run-main.js` 走静态构建图，如果预调度启动导入在命令调度之前包含 Commander、提示 UI、undici 或日志记录等包依赖项，则失败；它还将捆绑的 Gateway 运行块保持在预算下，并拒绝已知冷 Gateway 路径的静态导入。打包的 CLI 冒烟还涵盖根帮助、引导帮助、doctor 帮助、状态、配置模式和模型列表命令。
- Package Acceptance 旧版兼容性上限为 `2026.4.25`（包括 `2026.4.25-beta.*`）。在该截止之前，测试套件只允许已发布包元数据差距：省略的私有 QA 库存条目、缺失的 `gateway install --wrapper`、tarball 派生 git 固件中缺失的补丁文件、缺失的持久 `update.channel`、旧版 Plugin 安装记录位置、缺失的市场安装记录持久性和 `plugins update` 期间的配置元数据迁移。对于 `2026.4.25` 之后的包，这些路径是严格失败。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix` 和 `test:docker:config-reload` 启动一个或多个真实容器并验证更高级别的集成路径。

实时模型 Docker 运行器还仅绑定挂载所需的 CLI 认证主目录（或在运行未缩小时所有支持的），然后在运行之前将它们复制到容器主目录中，以便外部 CLI OAuth 可以刷新令牌而不修改主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，通过 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 进行严格的 Droid/OpenCode 覆盖）
- CLI 后端冒烟：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex 应用服务器测试套件冒烟：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway + 开发 Agent：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性冒烟：`pnpm qa:otel:smoke` 是私有 QA 源检出通道。它有意不属于包 Docker 发布通道，因为 npm tarball 省略了 QA Lab。
- Open WebUI 实时冒烟：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 引导/Channel/Agent 冒烟：`pnpm test:docker:npm-onboard-channel-agent` 在 Docker 中全局安装打包的 OpenClaw tarball，通过环境引用引导加默认 Telegram 配置 OpenAI，运行 doctor，并运行一个 mocked OpenAI Agent 轮次。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用预构建的 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过主机重建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切换 Channel。
- Skill 安装冒烟：`pnpm test:docker:skill-install` 在 Docker 中全局安装打包的 OpenClaw tarball，在配置中禁用上传的存档安装，从搜索解析当前实时 ClawHub Skill slug，使用 `openclaw skills install` 安装它，并验证已安装的 Skill 加上 `.clawhub` 来源/锁定元数据。
- 更新 Channel 切换冒烟：`pnpm test:docker:update-channel-switch` 在 Docker 中全局安装打包的 OpenClaw tarball，从包 `stable` 切换到 git `dev`，验证持久化的 Channel 和 Plugin 更新后工作，然后切换回包 `stable` 并检查更新状态。
- 升级幸存者冒烟：`pnpm test:docker:upgrade-survivor` 在具有 Agent、Channel 配置、Plugin 白名单、陈旧 Plugin 依赖状态和现有工作区/Session 文件的脏旧用户固件上安装打包的 OpenClaw tarball。它在没有实时 Provider 或 Channel 密钥的情况下运行包更新加非交互式 doctor，然后启动环回 Gateway 并检查配置/状态保存加启动/状态预算。
- 已发布升级幸存者冒烟：`pnpm test:docker:published-upgrade-survivor` 默认安装 `openclaw@latest`，播种真实的现有用户文件，使用烘焙的命令配方配置该基线，验证结果配置，将该已发布安装更新到候选 tarball，运行非交互式 doctor，写入 `.artifacts/upgrade-survivor/summary.json`，然后启动环回 Gateway 并检查配置意图、状态保存、启动、`/healthz`、`/readyz` 和 RPC 状态预算。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖一个基线，要求聚合调度器使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`（如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`）扩展精确的本地基线，并使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`（如 `reported-issues`）扩展问题形状固件；reported-issues 集包括用于自动外部 OpenClaw Plugin 安装修复的 `configured-plugin-installs`。Package Acceptance 将这些公开为 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，解析 `last-stable-4` 或 `all-since-2026.4.23` 等元基线令牌，完整发布验证将发布浸泡包门控扩展到 `last-stable-4 2026.4.23 2026.5.2 2026.4.15` 加 `reported-issues`。
- Session 运行时上下文冒烟：`pnpm test:docker:session-runtime-context` 验证隐藏运行时上下文脚本持久化加受影响的重复提示重写分支的 doctor 修复。
- Bun 全局安装冒烟：`bash scripts/e2e/bun-global-install-smoke.sh` 打包当前树，在隔离的主目录中使用 `bun install -g` 安装它，并验证 `openclaw infer image providers --json` 返回捆绑的图像 Provider 而不是挂起。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用预构建的 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过主机构建，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从构建的 Docker 镜像复制 `dist/`。
- 安装程序 Docker 冒烟：`bash scripts/test-install-sh-docker.sh` 在其根、更新和直接 npm 容器中共享一个 npm 缓存。更新冒烟默认为 npm `latest` 作为稳定基线，然后升级到候选 tarball。在本地使用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，或在 GitHub 上使用 Install Smoke 工作流的 `update_baseline_version` 输入。非根安装程序检查保留隔离的 npm 缓存，以防根拥有的缓存条目掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 在本地重新运行中重用根/更新/直接 npm 缓存。
- Install Smoke CI 使用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的直接 npm 全局更新；在本地运行不带该环境的脚本，当需要直接 `npm install -g` 覆盖时。
- Agent 删除共享工作区 CLI 冒烟：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认构建根 Dockerfile 镜像，在隔离的容器主目录中播种两个具有一个工作区的 Agent，运行 `agents delete --json`，并验证有效 JSON 加保留的工作区行为。使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用安装冒烟镜像。
- Gateway 网络（两个容器，WS 认证 + 健康）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照冒烟：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）构建源 E2E 镜像加 Chromium 层，使用原始 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证 CDP 角色快照涵盖链接 URL、光标提升的可点击元素、iframe 引用和帧元数据。
- OpenAI Responses web_search 最小推理回归：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）通过 Gateway 运行 mocked OpenAI 服务器，验证 `web_search` 将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制 Provider schema 拒绝并检查原始详细信息是否出现在 Gateway 日志中。
- MCP Channel 桥（播种的 Gateway + stdio 桥 + 原始 Claude 通知帧冒烟）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi 捆绑 MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi 配置文件允许/拒绝冒烟）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/子 Agent MCP 清理（真实 Gateway + 隔离 Cron 和一次性子 Agent 运行后 stdio MCP 子进程拆除）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugin（本地路径、`file:`、npm 注册表与提升的依赖项、git 移动引用、ClawHub kitchen-sink、市场更新和 Claude 捆绑启用/检查的安装/更新冒烟）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 跳过 ClawHub 块，或使用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认 kitchen-sink 包/运行时对。没有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`，测试使用密闭的本地 ClawHub 固件服务器。
- Plugin 更新未更改冒烟：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- Plugin 生命周期矩阵冒烟：`pnpm test:docker:plugin-lifecycle-matrix` 在裸容器中安装打包的 OpenClaw tarball，安装 npm Plugin，切换启用/禁用，通过本地 npm 注册表升级和降级它，删除已安装的代码，然后验证卸载仍然删除陈旧状态，同时记录每个生命周期阶段的 RSS/CPU 指标。
- 配置重新加载元数据冒烟：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）

要手动预构建和重用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

套件特定的镜像覆盖（如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）在设置时仍然优先。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，脚本在本地不存在时拉取它。QR 和安装程序 Docker 测试保留自己的 Dockerfile，因为它们验证包/安装行为而不是共享的内置应用运行时。

实时模型 Docker 运行器还只读绑定挂载当前检出并将其暂存到容器内的临时工作目录中。这使运行时镜像保持精简，同时仍然对你确切的本地源/配置运行 Vitest。暂存步骤跳过大型仅本地缓存和应用构建输出，如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__` 和应用本地 `.build` 或 Gradle 输出目录，因此 Docker 实时运行不会花费数分钟复制特定于机器的工件。它们还设置 `OPENCLAW_SKIP_CHANNELS=1`，因此 Gateway 实时探测不会在容器内启动真实的 Telegram/Discord/等 Channel 工作器。`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要从该 Docker 通道缩小或排除 Gateway 实时覆盖时，也传递 `OPENCLAW_LIVE_GATEWAY_*`。`test:docker:openwebui` 是更高级别的兼容性冒烟：它启动一个启用 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 容器，对该 Gateway 启动一个固定的 Open WebUI 容器，通过 Open WebUI 登录，验证 `/api/models` 公开 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送真实的聊天请求。设置 `OPENWEBUI_SMOKE_MODE=models` 用于发布路径 CI 检查，这些检查应在 Open WebUI 登录和模型发现后停止，而不等待实时模型完成。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile` 并在运行测试前源
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 仅验证从 `OPENCLAW_PROFILE_FILE` 源的环境变量，使用临时配置/工作区目录，无外部 CLI 认证挂载
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global` 用于 Docker 内部缓存的 CLI 安装
- `$HOME` 下的外部 CLI 认证目录/文件只读挂载在 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小的 Provider 运行仅挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断的所需目录/文件
  - 使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或逗号列表如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 缩小运行
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 容器内过滤 Provider
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 重用现有的 `openclaw:local-live` 镜像，用于不需要重建的重新运行
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 确保凭据来自配置文件存储（而不是环境）
- `OPENCLAW_OPENWEBUI_MODEL=...` 选择 Gateway 为 Open WebUI 冒烟公开的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 覆盖 Open WebUI 冒烟使用的随机数检查提示
- `OPENWEBUI_IMAGE=...` 覆盖固定的 Open WebUI 镜像标签

## 文档健全性

文档编辑后运行文档检查：`pnpm check:docs`。
当你还需要页面内标题检查时，运行完整的 Mintlify 锚点验证：`pnpm docs:check-links:anchors`。

## 离线回归（CI 安全）

这些是不使用真实 Provider 的"真实管道"回归：

- Gateway 工具调用（mock OpenAI，真实 Gateway + Agent 循环）：`src/gateway/gateway.test.ts`（案例："通过 Gateway Agent 循环端到端运行 mock OpenAI 工具调用"）
- Gateway 向导（WS `wizard.start`/`wizard.next`，强制执行写入配置 + 认证）：`src/gateway/gateway.test.ts`（案例："通过 ws 运行向导并写入认证令牌配置"）

## Agent 可靠性评估（Skills）

我们已经有一些 CI 安全测试，其行为类似于"Agent 可靠性评估"：

- 通过真实 Gateway + Agent 循环进行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证 Session 布线和配置效果的端到端向导流（`src/gateway/gateway.test.ts`）。

Skill 中仍然缺少的内容（参阅 [Skills](/tools/skills)）：

- **决策制定：**当 Skill 列在提示词中时，Agent 是否选择了正确的 Skill（或避免不相关的）？
- **合规性：**Agent 是否在使用前读取 `SKILL.md` 并遵循必需的步骤/参数？
- **工作流合约：**断言工具顺序、Session 历史传递和沙盒边界的多轮场景。

未来的评估应首先保持确定性：

- 使用 mock Provider 断言工具调用 + 顺序、Skill 文件读取和 Session 布线的场景运行器。
- 一小套以 Skill 为重点的场景（使用与避免、门控、提示注入）。
- 可选的实时评估（仅在 CI 安全套件就位后，通过环境变量选择加入）。

## 合约测试（Plugin 和 Channel 形状）

合约测试验证每个注册的 Plugin 和 Channel 是否符合其接口合约。它们遍历所有发现的 Plugin 并运行一套形状和行为断言。默认 `pnpm test` 单元通道有意跳过这些共享接缝和冒烟文件；当你触及共享 Channel 或 Provider 界面时，显式运行合约命令。

### 命令

- 所有合约：`pnpm test:contracts`
- 仅 Channel 合约：`pnpm test:contracts:channels`
- 仅 Provider 合约：`pnpm test:contracts:plugins`

### Channel 合约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基础 Plugin 形状（id、名称、能力）
- **setup** - 设置向导合约
- **session-binding** - Session 绑定行为
- **outbound-payload** - 消息有效负载结构
- **inbound** - 入站消息处理
- **actions** - Channel 动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/名册 API
- **group-policy** - 群组策略执行

### Provider 状态合约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - Channel 状态探测
- **registry** - Plugin 注册表形状

### Provider 合约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流合约
- **auth-choice** - 认证选择/选择
- **catalog** - 模型目录 API
- **discovery** - Plugin 发现
- **loader** - Plugin 加载
- **runtime** - Provider 运行时
- **shape** - Plugin 形状/接口
- **wizard** - 设置向导

### 何时运行

- 更改 plugin-sdk 导出或子路径后
- 添加或修改 Channel 或 Provider Plugin 后
- 重构 Plugin 注册或发现后

合约测试在 CI 中运行，不需要真实的 API 密钥。

## 添加回归（指导）

当你修复实时中发现的 Provider/模型问题时：

- 如果可能，添加 CI 安全回归（mock/存根 Provider，或捕获确切的请求形状转换）
- 如果它本质上是仅实时的（速率限制、认证策略），通过环境变量保持实时测试窄且可选
- 优先定向捕获错误的最小层：
  - Provider 请求转换/重放错误 → 直接模型测试
  - Gateway Session/历史/工具管道错误 → Gateway 实时冒烟或 CI 安全 Gateway mock 测试
- SecretRef 遍历保护：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 从注册表元数据（`listSecretTargetRegistryEntries()`）为每个 SecretRef 类派生一个采样目标，然后断言遍历段执行 ID 被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加新的 `includeInPlan` SecretRef 目标家族，更新该测试中的 `classifyTargetClass`。测试有意在未分类的目标 ID 上失败，因此新类不能被静默跳过。

## 相关

- [实时测试](/help/testing-live)
- [更新和 Plugin 测试](/help/testing-updates-plugins)
- [CI](/ci)
