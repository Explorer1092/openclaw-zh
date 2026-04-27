---
mmh3_hash: "ff9bd4a6da448a9c414c49ce389d9f0d"
title: "测试"
summary: "测试套件：单元/e2e/实时套件、Docker 运行器以及每个测试涵盖的内容"
read_when:
  - 在本地或 CI 中运行测试
  - 为 model/provider 错误添加回归测试
  - 调试 gateway + agent 行为
---

OpenClaw 有三个 Vitest 套件（单元/集成、e2e、实时）和一小组 Docker 运行器。本文档是"我们如何测试"的指南：

- 每个套件涵盖什么（以及它刻意_不_涵盖什么）。
- 常见工作流（本地、推送前、调试）运行哪些命令。
- 实时测试如何发现凭据并选择 models/providers。
- 如何为真实 model/provider 问题添加回归测试。

## 快速入门

大多数时候：

- 完整门控（推送前预期）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在较宽裕机器上更快的本地完整套件运行：`pnpm test:max`
- 直接 Vitest 监视循环：`pnpm test:watch`
- 直接文件定向现在也路由扩展/channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 在针对单个失败进行迭代时，优先使用目标化运行。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改测试或想要额外信心时：

- 覆盖率门控：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

调试真实 providers/models 时（需要真实凭据）：

- 实时套件（models + gateway 工具/图像探测）：`pnpm test:live`
- 安静地针对一个实时文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker 实时 model 扫描：`pnpm test:docker:live-models`
  - 每个选定的 model 现在运行一个文本回合加一个小型文件读取式探测。
    元数据宣传 `image` 输入的 model 还会运行一个小型图像回合。
    用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`
    禁用额外探测，以隔离 provider 故障。
  - CI 覆盖：每日 `OpenClaw Scheduled Live And E2E Checks` 和手动
    `OpenClaw Release Checks` 都以 `include_live_suites: true` 调用可复用的实时/E2E 工作流，
    其中包括按 provider 分片的独立 Docker 实时 model 矩阵作业。
  - 如需进行 CI 的焦点重跑，可调度 `OpenClaw Live And E2E Checks (Reusable)`，
    设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 将新的高信号 provider 密钥添加到 `scripts/ci-hydrate-live-auth.sh`
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 及其
    计划/发布调用方。
- Native Codex bound-chat smoke：`pnpm test:docker:live-codex-bind`
  - 在 Codex app-server 路径上运行 Docker 实时通道，用 `/codex bind` 绑定一个合成
    Slack DM，执行 `/codex fast` 和 `/codex permissions`，然后验证普通回复和图像附件
    通过原生插件绑定而非 ACP 路由。
- Codex app-server 测试套件 smoke：`pnpm test:docker:live-codex-harness`
  - 通过插件拥有的 Codex app-server 测试套件运行 gateway agent 回合，
    验证 `/codex status` 和 `/codex models`，默认执行图像、cron MCP、子 agent
    和 Guardian 探测。用 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 禁用子 agent
    探测，以隔离其他 Codex app-server 故障。如需进行子 agent 的焦点检查，禁用其他探测：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非设置了 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则在子 agent 探测后退出。
- Crestodian 救援命令 smoke：`pnpm test:live:crestodian-rescue-channel`
  - 消息 channel 救援命令界面的可选双重保险检查。它执行 `/crestodian status`，
    排队一个持久 model 变更，回复 `/crestodian yes`，并验证审计/配置写入路径。
- Crestodian 规划器 Docker smoke：`pnpm test:docker:crestodian-planner`
  - 在无配置容器中运行 Crestodian，PATH 上有假 Claude CLI，验证模糊规划器回退
    转换为审计的类型化配置写入。
- Crestodian 首次运行 Docker smoke：`pnpm test:docker:crestodian-first-run`
  - 从空的 OpenClaw 状态目录开始，将裸 `openclaw` 路由到 Crestodian，
    应用 setup/model/agent/Discord 插件 + SecretRef 写入，验证配置，
    并验证审计条目。同一 Ring 0 设置路径也在 QA Lab 中通过
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot/Kimi 成本 smoke：设置 `MOONSHOT_API_KEY` 后，运行
  `openclaw models list --provider moonshot --json`，然后对 `moonshot/kimi-k2.6` 运行一个隔离的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  验证 JSON 报告 Moonshot/K2.6 且 assistant 转录存储规范化的 `usage.cost`。

<Tip>
当你只需要一个失败案例时，优先通过下面描述的允许列表 env vars 缩小实时测试范围。
</Tip>

## QA 专用运行器

当你需要 QA 实验室真实感时，这些命令位于主测试套件旁边：

CI 在专用工作流中运行 QA Lab。`Parity gate` 在匹配的 PR 上运行，也可从手动调度以模拟 provider。
`QA-Lab - All Lanes` 每晚在 `main` 上运行，可从手动调度运行，包含模拟奇偶门、实时 Matrix 通道、
Convex 管理的实时 Telegram 通道和 Convex 管理的实时 Discord 通道作为并行作业。
计划 QA 和发布检查明确传递 Matrix `--profile fast`，而 Matrix CLI 和手动工作流输入默认仍为 `all`；
手动调度可将 `all` 分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。
`OpenClaw Release Checks` 在发布审批前运行奇偶校验以及快速 Matrix 和 Telegram 通道。

- `pnpm openclaw qa suite`
  - 直接在主机上运行仓库支持的 QA 场景。
  - 默认使用隔离的 gateway worker 并行运行多个选定场景。`qa-channel` 默认并发数为 4
    （受所选场景数量限制）。用 `--concurrency <count>` 调整 worker 数量，
    或用 `--concurrency 1` 使用旧的串行通道。
  - 任何场景失败时以非零退出。当你希望在不产生失败退出码的情况下获取产出物时，使用 `--allow-failures`。
  - 支持 provider 模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 启动一个本地 AIMock 支持的 provider 服务器，用于实验性夹具和协议模拟覆盖，
    而不替换场景感知的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 内运行相同的 QA 套件。
  - 保持与主机上 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的 provider/model 选择标志。
  - 实时运行转发对 guest 实用的受支持 QA 认证输入：
    基于 env 的 provider 密钥、QA 实时 provider 配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须位于仓库根目录下，以便 guest 可以通过挂载的工作区写回。
  - 在 `.artifacts/qa-e2e/...` 下写入正常的 QA 报告 + 摘要以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点，用于操作员式 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建 npm 压缩包，在 Docker 中全局安装它，运行非交互式 OpenAI API 密钥入门引导，
    默认配置 Telegram，验证启用插件按需安装运行时依赖，运行 doctor，
    并针对模拟 OpenAI 端点运行一个本地 agent 回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以相同的打包安装通道运行 Discord。
- `pnpm test:docker:session-runtime-context`
  - 为嵌入式运行时上下文转录运行确定性内置应用 Docker smoke。它验证隐藏的 OpenClaw 运行时上下文
    作为非显示自定义消息持久化，而不是泄漏到可见的用户回合中，然后播种一个受影响的损坏会话 JSONL
    并验证 `openclaw doctor --fix` 将其重写为具有备份的活动分支。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装 OpenClaw 包候选，运行已安装包的入门引导，通过已安装的 CLI 配置 Telegram，
    然后以已安装的包作为 SUT Gateway 复用实时 Telegram QA 通道。
  - 默认为 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；设置
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ` 以测试已解析的本地压缩包，而非从注册表安装。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram env 凭据或 Convex 凭据来源。
    对于 CI/发布自动化，设置 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` 加上
    `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密钥。如果 `OPENCLAW_QA_CONVEX_SITE_URL` 和
    Convex 角色密钥在 CI 中存在，Docker 包装器会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅为此通道覆盖共享的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 将此通道暴露为手动维护者工作流 `NPM Telegram Beta E2E`。
    它不在合并时运行。该工作流使用 `qa-live-shared` 环境和 Convex CI 凭据租约。
- GitHub Actions 还暴露了 `Package Acceptance`，用于针对一个候选包进行侧运行产品证明。
  它接受受信任的 ref、已发布的 npm 规格、带 SHA-256 的 HTTPS 压缩包 URL 或来自另一次运行的
  压缩包产出物，将规范化的 `openclaw-current.tgz` 上传为 `package-under-test`，
  然后以 smoke、package、product、full 或自定义通道配置文件运行现有的 Docker E2E 调度器。
  设置 `telegram_mode=mock-openai` 或 `live-frontier` 以针对同一 `package-under-test`
  产出物运行 Telegram QA 工作流。
  - 最新 beta 产品证明：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 精确压缩包 URL 证明需要摘要：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- 产出物证明从另一次 Actions 运行下载压缩包产出物：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，以配置了 OpenAI 的 Gateway 启动，
    然后通过配置编辑启用捆绑的 channel/插件。
  - 验证安装发现使未配置的插件运行时依赖保持缺失，第一次配置的 Gateway 或 doctor 运行
    按需安装每个捆绑插件的运行时依赖，第二次重启不会重新安装已激活的依赖。
  - 还安装一个已知的旧 npm 基线，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，
    并验证候选的发布后 doctor 修复捆绑的 channel 运行时依赖，无需测试套件端的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 在 Parallels guest 上运行本地打包安装更新 smoke。每个选定的平台首先安装请求的基线包，
    然后在同一 guest 中运行已安装的 `openclaw update` 命令，并验证已安装的版本、
    更新状态、gateway 就绪情况和一个本地 agent 回合。
  - 使用 `--platform macos`、`--platform windows` 或 `--platform linux` 在一个 guest 上迭代。
    使用 `--json` 获取摘要产出物路径和每通道状态。
  - OpenAI 通道默认使用 `openai/gpt-5.5` 进行实时 agent 回合证明。
    在刻意验证另一个 OpenAI model 时，传递 `--model <provider/model>` 或设置
    `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 将长时间本地运行包装在主机超时中，以防 Parallels 传输停滞消耗剩余的测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 该脚本在 `/tmp/openclaw-parallels-npm-update.*` 下写入嵌套通道日志。
    在假设外层包装器挂起之前，先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - Windows 更新在冷 guest 上的发布后 doctor/运行时依赖修复中可能花费 10 到 15 分钟；
    当嵌套的 npm 调试日志在推进时，这仍然是健康的。
  - 不要将此聚合包装器与单独的 Parallels macOS、Windows 或 Linux smoke 通道并行运行。
    它们共享 VM 状态，可能在快照恢复、包服务或 guest gateway 状态上产生冲突。
  - 发布后证明运行正常的捆绑插件界面，因为语音、图像生成和媒体理解等能力外观
    通过捆绑运行时 API 加载，即使 agent 回合本身只检查简单的文本响应。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock provider 服务器，用于直接协议 smoke 测试。
- `pnpm openclaw qa matrix`
  - 针对一次性 Docker 支持的 Tuwunel 家庭服务器运行 Matrix 实时 QA 通道。
  - 此 QA 主机今天仅限仓库/开发使用。打包的 OpenClaw 安装不附带 `qa-lab`，
    因此不暴露 `openclaw qa`。
  - 仓库检出直接加载捆绑的运行器；无需单独的插件安装步骤。
  - 配置三个临时 Matrix 用户（`driver`、`sut`、`observer`）加一个私人房间，
    然后以真实 Matrix 插件作为 SUT 传输启动一个 QA gateway 子进程。
  - 默认为 `--profile all`。使用 `--profile fast --fail-fast` 进行发布关键的传输证明，
    或使用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` 分片完整目录。
  - 默认使用固定的稳定 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。
    需要测试不同镜像时，用 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享凭据来源标志，因为该通道在本地配置一次性用户。
  - 在 `.artifacts/qa-e2e/...` 下写入 Matrix QA 报告、摘要、观察事件产出物和组合的 stdout/stderr 输出日志。
  - 默认发出进度，并用 `OPENCLAW_QA_MATRIX_TIMEOUT_MS`（默认 30 分钟）强制执行硬运行超时。
    `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` 调整负无回复安静窗口，
    清理由 `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 限制，失败包括恢复 `docker compose ... down --remove-orphans` 命令。
- `pnpm openclaw qa telegram`
  - 使用来自 env 的驱动程序和 SUT bot token，针对真实私人群组运行 Telegram 实时 QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是数字 Telegram 聊天 id。
  - 支持 `--credential-source convex` 用于共享池化凭据。默认使用 env 模式，
    或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 选择池化租约。
  - 任何场景失败时以非零退出。当你希望在不产生失败退出码的情况下获取产出物时，使用 `--allow-failures`。
  - 需要同一私人群组中的两个不同 bot，SUT bot 暴露一个 Telegram 用户名。
  - 为了稳定的 bot 到 bot 观察，在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，
    并确保驱动 bot 可以观察群组 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和观察消息产出物。
    回复场景包括从驱动发送请求到观察到 SUT 回复的 RTT。

实时传输通道共享一个标准合约，以使新传输不会漂移：

`qa-channel` 仍然是广泛的合成 QA 套件，不是实时传输覆盖矩阵的一部分。

| 通道     | 金丝雀 | 提及门控 | 允许列表阻止 | 顶级回复 | 重启恢复 | 线程跟进 | 线程隔离 | 反应观察 | 帮助命令 | 原生命令注册 |
| -------- | ------ | -------- | ------------ | -------- | -------- | -------- | -------- | -------- | -------- | ------------ |
| Matrix   | x      | x        | x            | x        | x        | x        | x        | x        |          |              |
| Telegram | x      | x        |              |          |          |          |          |          | x        |              |
| Discord  | x      | x        |              |          |          |          |          |          |          | x            |

### 通过 Convex 共享 Telegram 凭据（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，
QA lab 从 Convex 支持的池获取独占租约，在通道运行时对该租约进行心跳，并在关闭时释放租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的 env 变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所选角色的一个密钥：
  - `maintainer` 用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 凭据角色选择：
  - CLI：`--credential-role maintainer|ci`
  - Env 默认：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认为 `ci`，否则为 `maintainer`）

可选的 env 变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选追踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许用于仅限本地开发的 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在正常操作中应使用 `https://`。

维护者管理员命令（池 add/remove/list）特别需要 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

维护者的 CLI 助手：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在实时运行之前使用 `doctor` 检查 Convex 站点 URL、broker 密钥、端点前缀、
HTTP 超时以及管理员/列表可达性，而不打印密钥值。使用 `--json` 在脚本和 CI 实用程序中获取机器可读输出。

默认端点合约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 耗尽/可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空 `2xx`）
- `POST /release`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空 `2xx`）
- `POST /admin/add`（仅限维护者密钥）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅限维护者密钥）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约守卫：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅限维护者密钥）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 类型的 payload 形状：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数字 Telegram 聊天 id 字符串。
- `admin/add` 为 `kind: "telegram"` 验证此形状，并拒绝格式错误的 payload。

### 向 QA 添加 channel

向 markdown QA 系统添加 channel 确切需要两件事：

1. channel 的传输适配器。
2. 演练 channel 合约的场景包。

当共享的 `qa-lab` 主机可以拥有该流程时，不要添加新的顶级 QA 命令根。

`qa-lab` 拥有共享主机机制：

- `openclaw qa` 命令根
- 套件启动和清理
- worker 并发
- 产出物写入
- 报告生成
- 场景执行
- 旧版 `qa-channel` 场景的兼容性别名

运行器插件拥有传输合约：

- `openclaw qa <runner>` 如何挂载在共享 `qa` 根下
- gateway 如何为该传输配置
- 如何检查就绪情况
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露转录和规范化的传输状态
- 如何执行传输支持的操作
- 如何处理特定于传输的重置或清理

新 channel 的最低采用门槛是：

1. 保持 `qa-lab` 作为共享 `qa` 根的所有者。
2. 在共享 `qa-lab` 主机接缝上实现传输运行器。
3. 将特定于传输的机制保留在运行器插件或 channel 测试套件中。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个竞争的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，
   并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 轻量；懒加载 CLI 和运行器执行应该保留在独立的入口点后面。
5. 在主题化的 `qa/scenarios/` 目录下编写或改编 markdown 场景。
6. 为新场景使用通用场景助手。
7. 保持现有的兼容性别名正常工作，除非仓库正在进行有意的迁移。

决策规则是严格的：

- 如果行为可以在 `qa-lab` 中一次性表达，就放在 `qa-lab` 中。
- 如果行为依赖于一个 channel 传输，就将其保留在该运行器插件或插件测试套件中。
- 如果场景需要多个 channel 可以使用的新能力，添加通用助手而不是在 `suite.ts` 中添加特定于 channel 的分支。
- 如果行为仅对一种传输有意义，使场景特定于传输并在场景合约中明确说明。

新场景的首选通用助手名称：

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

现有场景的兼容性别名仍然可用，包括：

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新 channel 工作应使用通用助手名称。
兼容性别名的存在是为了避免强制迁移，而不是作为新场景编写的模型。

## 测试套件（在哪里运行什么）

将套件视为"增加真实感"（以及增加不稳定性/成本）：

### 单元/集成（默认）

- 命令：`pnpm test`
- 配置：未定向的运行使用 `vitest.full-*.config.ts` 分片集，并可能将多项目分片扩展为每个项目的配置以进行并行调度
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的核心/单元清单；UI 单元测试在专用的 `unit-ui` 分片中运行
- 范围：
  - 纯单元测试
  - 进程内集成测试（gateway 认证、路由、工具、解析、配置）
  - 已知 bug 的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定

<AccordionGroup>
  <Accordion title="项目、分片和范围通道">

    - 未定向的 `pnpm test` 运行十二个较小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的本地根项目进程。这降低了繁忙机器上的峰值 RSS，并避免 auto-reply/extension 工作饥饿无关套件。
    - `pnpm test --watch` 仍然使用本地根 `vitest.config.ts` 项目图，因为多分片监视循环不实用。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 首先通过范围通道路由显式文件/目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 避免支付完整的根项目启动税。
    - `pnpm test:changed` 默认将更改的 git 路径扩展到廉价的范围通道：直接测试编辑、同级 `*.test.ts` 文件、显式源映射和本地导入图依赖项。配置/设置/包编辑不会广泛运行测试，除非你明确使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是针对窄工作的正常智能本地检查门。它将差异分类为核心、核心测试、扩展、扩展测试、应用、文档、发布元数据、实时 Docker 工具和工具，然后运行匹配的类型检查、lint 和守卫命令。它不运行 Vitest 测试；调用 `pnpm test:changed` 或显式 `pnpm test <target>` 进行测试证明。仅发布元数据版本号更新运行目标版本/配置/根依赖检查，守卫拒绝顶级版本字段之外的包更改。
    - 实时 Docker ACP 测试套件编辑运行焦点检查：实时 Docker 认证脚本的 shell 语法检查和实时 Docker 调度器试运行。`package.json` 更改仅在差异限于 `scripts["test:docker:live-*"]` 时包含；依赖、导出、版本和其他包界面编辑仍使用更广泛的守卫。
    - 来自 agents、commands、plugins、auto-reply 助手、`plugin-sdk` 和类似纯实用程序区域的导入轻量单元测试通过 `unit-fast` 通道路由，该通道跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时密集型文件保留在现有通道上。
    - 选定的 `plugin-sdk` 和 `commands` 助手源文件也将更改模式运行映射到这些轻量通道中的显式同级测试，因此助手编辑避免为该目录重新运行完整的重量套件。
    - `auto-reply` 有专用的顶级核心助手、顶级 `reply.*` 集成测试和 `src/auto-reply/reply/**` 子树桶。CI 进一步将回复子树分片为 agent 运行器、调度和命令/状态路由分片，因此一个导入密集型桶不拥有完整的 Node 尾部。

  </Accordion>

  <Accordion title="嵌入式运行器覆盖">

    - 当你更改消息工具发现输入或压缩运行时上下文时，保持两级覆盖。
    - 为纯路由和规范化边界添加焦点助手回归。
    - 保持嵌入式运行器集成套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些套件验证范围 id 和压缩行为仍通过真实的 `run.ts` / `compact.ts` 路径流动；
      仅助手测试不足以替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest 池和隔离默认值">

    - 基本 Vitest 配置默认为 `threads`。
    - 共享 Vitest 配置在根项目、e2e 和实时配置中固定 `isolate: false` 并使用非隔离运行器。
    - 根 UI 通道保留其 `jsdom` 设置和优化器，但也在共享的非隔离运行器上运行。
    - 每个 `pnpm test` 分片从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
    - `scripts/run-vitest.mjs` 默认为 Vitest 子 Node 进程添加 `--no-maglev` 以减少大型本地运行期间的 V8 编译抖动。
      设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 与标准 V8 行为进行比较。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 显示差异触发哪些架构通道。
    - 预提交钩子仅用于格式化。它重新暂存格式化的文件，不运行 lint、类型检查或测试。
    - 在交接或推送之前显式运行 `pnpm check:changed`，当你需要智能本地检查门时。
    - `pnpm test:changed` 默认通过廉价的范围通道路由。仅当 agent 决定测试套件、配置、
      包或合约编辑真正需要更广泛的 Vitest 覆盖时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是有更高的 worker 上限。
    - 本地 worker 自动扩缩在主机负载平均值已经很高时有意地保守并退避，
      因此多个并发 Vitest 运行默认情况下损害较小。
    - 基本 Vitest 配置将项目/配置文件标记为 `forceRerunTriggers`，
      以便在测试布线更改时更改模式重新运行保持正确。
    - 配置在受支持的主机上保持 `OPENCLAW_VITEST_FS_MODULE_CACHE` 启用；
      如果你想要一个明确的缓存位置用于直接分析，设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 启用 Vitest 导入持续时间报告加导入分解输出。
    - `pnpm test:perf:imports:changed` 将相同的分析视图范围限制为自 `origin/main` 以来更改的文件。
    - 分片计时数据写入 `.artifacts/vitest-shard-timings.json`。
      整配置运行使用配置路径作为键；包含模式的 CI 分片附加分片名称，
      以便可以单独跟踪过滤的分片。
    - 当一个热测试仍然大部分时间花在启动导入上时，将重型依赖保留在狭窄的本地 `*.runtime.ts` 接缝后，
      并直接模拟该接缝，而不是深层导入运行时助手只是将它们传递给 `vi.mock(...)`。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 比较针对该提交差异的路由 `test:changed`
      与本地根项目路径，并打印墙时钟时间加 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 通过将更改的文件列表路由经过
      `scripts/test-projects.mjs` 和根 Vitest 配置来基准测试当前脏树。
    - `pnpm test:perf:profile:main` 为 Vitest/Vite 启动和转换开销写入主线程 CPU 配置文件。
    - `pnpm test:perf:profile:runner` 在禁用文件并行的情况下为单元套件写入运行器 CPU+堆配置文件。

  </Accordion>
</AccordionGroup>

### 稳定性（gateway）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制单个 worker
- 范围：
  - 启动一个默认启用诊断的真实 loopback Gateway
  - 通过诊断事件路径驱动合成的 gateway 消息、内存和大 payload 流失
  - 通过 Gateway WS RPC 查询 `diagnostics.stability`
  - 涵盖诊断稳定性包持久化助手
  - 断言记录器保持有界，合成 RSS 样本保持在压力预算下，每个 Session 队列深度排回零
- 预期：
  - CI 安全且无密钥
  - 用于稳定性回归跟进的窄通道，不是完整 Gateway 套件的替代

### E2E（gateway smoke）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts` 和 `extensions/` 下的捆绑插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 和 `isolate: false`，与仓库其余部分匹配。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认在静默模式下运行以减少控制台 I/O 开销。
- 有用的覆盖：
  - `OPENCLAW_E2E_WORKERS=<n>` 强制 worker 计数（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 重新启用详细控制台输出。
- 范围：
  - 多实例 gateway 端到端行为
  - WebSocket/HTTP 界面、node 配对和更重的网络
- 预期：
  - 在 CI 中运行（在流水线中启用时）
  - 不需要真实密钥
  - 比单元测试更多移动部件（可能更慢）

### E2E：OpenShell 后端 smoke

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell gateway
  - 从临时本地 Dockerfile 创建一个沙盒
  - 通过真实的 `sandbox ssh-config` + SSH exec 演练 OpenClaw 的 OpenShell 后端
  - 通过沙盒 fs 桥验证远程规范文件系统行为
- 预期：
  - 仅可选；不是默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 加上工作的 Docker 守护程序
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 gateway 和沙盒
- 有用的覆盖：
  - `OPENCLAW_E2E_OPENSHELL=1` 在手动运行更广泛的 e2e 套件时启用测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 指向非默认 CLI 二进制或包装脚本

### 实时（真实 providers + 真实 models）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts` 和 `extensions/` 下的捆绑插件实时测试
- 默认：**通过** `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - "这个 provider/model 今天用真实凭据实际上能工作吗？"
  - 捕获 provider 格式更改、工具调用怪癖、认证问题和速率限制行为
- 预期：
  - 设计上不适合 CI 稳定（真实网络、真实 provider 策略、配额、中断）
  - 花钱/使用速率限制
  - 优先运行缩小的子集而不是"所有"
- 实时运行源 `~/.profile` 以获取缺失的 API 密钥。
- 默认情况下，实时运行仍然隔离 `HOME` 并将配置/认证材料复制到临时测试主目录中，
  以防单元夹具改变你真实的 `~/.openclaw`。
- 仅当你有意需要实时测试使用你真实主目录时，设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认为更安静的模式：它保留 `[live] ...` 进度输出，
  但抑制额外的 `~/.profile` 通知并静音 gateway 引导日志/Bonjour 噪声。
  如果你想要完整的启动日志，设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（特定于 provider）：用逗号/分号格式设置 `*_API_KEYS`
  或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）
  或通过 `OPENCLAW_LIVE_*_KEY` 进行每实时覆盖；测试在速率限制响应时重试。
- 进度/心跳输出：
  - 实时套件现在向 stderr 发出进度行，因此即使在 Vitest 控制台捕获安静时，
    长时间的 provider 调用也可见。
  - `vitest.live.config.ts` 禁用 Vitest 控制台拦截，以便 provider/gateway 进度行
    在实时运行期间立即流式传输。
  - 用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接 model 心跳。
  - 用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 gateway/探测心跳。

## 我应该运行哪个套件？

使用此决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果你更改了很多，也运行 `pnpm test:coverage`）
- 涉及 gateway 网络 / WS 协议 / 配对：添加 `pnpm test:e2e`
- 调试"我的 bot 停了"/ 特定于 provider 的失败 / 工具调用：运行缩小的 `pnpm test:live`

## 实时（网络触及）测试

对于实时 model 矩阵、CLI 后端 smoke、ACP smoke、Codex app-server
测试套件，以及所有媒体 provider 实时测试（Deepgram、BytePlus、ComfyUI、图像、
音乐、视频、媒体测试套件）— 加上实时运行的凭据处理 — 请参阅
[测试 — 实时套件](/help/testing-live)。

## Docker 运行器（可选的"在 Linux 上工作"检查）

这些 Docker 运行器分为两个桶：

- 实时 model 运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 仅在仓库 Docker 镜像内
  运行其匹配的配置文件密钥实时文件（`src/agents/models.profiles.live.test.ts` 和
  `src/gateway/gateway-models.profiles.live.test.ts`），挂载你的本地配置目录和工作区
  （并在挂载时源 `~/.profile`）。匹配的本地入口点是 `test:live:models-profiles` 和
  `test:live:gateway-profiles`。
- Docker 实时运行器默认为较小的 smoke 上限，以使完整的 Docker 扫描保持实用：
  `test:docker:live-models` 默认为 `OPENCLAW_LIVE_MAX_MODELS=12`，
  `test:docker:live-gateway` 默认为 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。
  当你明确需要更大的详尽扫描时，覆盖这些 env 变量。
- `test:docker:all` 通过 `test:docker:live-build` 一次性构建实时 Docker 镜像，
  通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 一次性打包为 npm 压缩包，
  然后构建/复用两个 `scripts/e2e/Dockerfile` 镜像。裸镜像仅是安装/更新/插件依赖通道的
  Node/Git 运行器；这些通道挂载预构建的压缩包。功能镜像将相同的压缩包安装到 `/app` 中，
  用于内置应用功能通道。Docker 通道定义在 `scripts/lib/docker-e2e-scenarios.mjs` 中；
  规划器逻辑在 `scripts/lib/docker-e2e-plan.mjs` 中；`scripts/test-docker-all.mjs` 执行选定的计划。
  聚合使用加权本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽，
  而资源上限防止重型实时、npm 安装和多服务通道同时启动。如果单个通道比活跃上限更重，
  调度器在池为空时仍然可以启动它，然后保持它单独运行直到容量再次可用。
  默认为 10 个槽、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和
  `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；仅当 Docker 主机有更多余量时才调整
  `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。
  运行器默认执行 Docker 预检，删除过期的 OpenClaw E2E 容器，每 30 秒打印状态，
  将成功的通道计时存储在 `.artifacts/docker-tests/lane-timings.json` 中，
  并在后续运行中使用这些计时首先启动较长的通道。
  使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 打印加权通道清单而不构建或运行 Docker，
  或使用 `node scripts/test-docker-all.mjs --plan-json` 打印选定通道的 CI 计划、包/镜像需求和凭据。
- `Package Acceptance` 是"这个可安装的压缩包作为产品能工作吗？"的 GitHub 原生包门。
  它从 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一个候选包，
  将其上传为 `package-under-test`，然后针对该精确压缩包运行可复用的 Docker E2E 通道，
  而不是重新打包选定的 ref。`workflow_ref` 选择受信任的工作流/测试套件脚本，
  而 `package_ref` 在 `source=ref` 时选择要打包的源提交/分支/标签；
  这让当前的验收逻辑验证较旧的受信任提交。配置文件按广度排序：
  `smoke` 是快速安装/channel/agent 加 gateway/配置，`package` 是包/更新/插件合约，
  是大多数 Parallels 包/更新覆盖的默认本地替代，`product` 添加 MCP channels、
  cron/子 agent 清理、OpenAI 网络搜索和 OpenWebUI，`full` 运行带 OpenWebUI 的发布路径 Docker 块。
  发布验证为目标 ref 以启用 Telegram 包 QA 运行 `package` 配置文件。
  从产出物生成的目标 GitHub Docker 重跑命令在可用时包括先前的包产出物和已准备的镜像输入，
  因此失败的通道可以避免重新构建包和镜像。
- Package Acceptance 旧版兼容性上限为 `2026.4.25`（包含 `2026.4.25-beta.*`）。
  在该截止日期之前，测试套件仅容忍已发布包元数据缺口：省略的私有 QA 清单条目、
  缺失的 `gateway install --wrapper`、压缩包派生的 git 夹具中缺失的补丁文件、
  缺失持久化的 `update.channel`、旧版插件安装记录位置、缺失的市场安装记录持久化，
  以及 `plugins update` 期间的配置元数据迁移。对于 `2026.4.25` 之后的包，这些路径是严格失败。
- 容器 smoke 运行器：`test:docker:openwebui`、`test:docker:onboard`、
  `test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、
  `test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、
  `test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、
  `test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、
  `test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和
  `test:docker:config-reload` 启动一个或多个真实容器并验证更高级别的集成路径。

实时 model Docker 运行器还以只读方式绑定挂载当前检出，并在容器内将其暂存到临时工作目录中。
这使运行时镜像保持轻量，同时仍然对你的精确本地源/配置运行 Vitest。
暂存步骤跳过大型仅本地缓存和应用构建输出，例如 `.pnpm-store`、`.worktrees`、
`__openclaw_vitest__` 和应用本地 `.build` 或 Gradle 输出目录，
因此 Docker 实时运行不会花费数分钟复制特定于机器的产出物。
它们还设置 `OPENCLAW_SKIP_CHANNELS=1`，以便 gateway 实时探测不在容器内启动
真实的 Telegram/Discord/等 channel worker。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此在需要从该 Docker 通道缩小
或排除 gateway 实时覆盖时，也传递 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是更高级别的兼容性 smoke：它启动一个启用了 OpenAI 兼容 HTTP 端点的
OpenClaw gateway 容器，针对该 gateway 启动一个固定的 Open WebUI 容器，
通过 Open WebUI 登录，验证 `/api/models` 暴露 `openclaw/default`，
然后通过 Open WebUI 的 `/api/chat/completions` 代理发送真实的聊天请求。
第一次运行可能明显较慢，因为 Docker 可能需要拉取 Open WebUI 镜像，
Open WebUI 可能需要完成自己的冷启动设置。
此通道需要可用的实时 model 密钥，`OPENCLAW_PROFILE_FILE`（默认 `~/.profile`）
是在 Docker 化运行中提供它的主要方式。
成功的运行打印一个小的 JSON payload，如 `{ "ok": true, "model": "openclaw/default", ... }`。
`test:docker:mcp-channels` 是有意确定的，不需要真实的 Telegram、Discord 或 iMessage 帐户。
它启动一个已播种的 Gateway 容器，启动第二个生成 `openclaw mcp serve` 的容器，
然后通过真实的 stdio MCP 桥验证路由的会话发现、转录读取、附件元数据、
实时事件队列行为、出站发送路由以及 Claude 风格的 channel + 权限通知。
通知检查直接检查原始 stdio MCP 帧，因此 smoke 验证桥实际发出的内容，
而不仅仅是特定客户端 SDK 碰巧暴露的内容。
`test:docker:pi-bundle-mcp-tools` 是确定的，不需要实时 model 密钥。
它构建仓库 Docker 镜像，在容器内启动一个真实的 stdio MCP 探测服务器，
通过嵌入式 Pi bundle MCP 运行时实现该服务器，执行工具，
然后验证 `coding` 和 `messaging` 保留 `bundle-mcp` 工具，
而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 过滤它们。
`test:docker:cron-mcp-cleanup` 是确定的，不需要实时 model 密钥。
它启动一个带有真实 stdio MCP 探测服务器的已播种 Gateway，运行一个隔离的 cron 回合
和一个 `/subagents spawn` 一次性子回合，然后验证 MCP 子进程在每次运行后退出。

实时 model Docker 运行器还绑定挂载所需的 CLI 认证主目录（或在运行未缩小时绑定所有支持的主目录），
然后在运行前将它们复制到容器主目录中，以便外部 CLI OAuth 可以刷新 token 而不改变主机认证存储：

- 直接 models：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP bind smoke：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；
  默认涵盖 Claude、Codex 和 Gemini，通过 `pnpm test:docker:live-acp-bind:droid` 和
  `pnpm test:docker:live-acp-bind:opencode` 进行严格的 Droid/OpenCode 覆盖）
- CLI 后端 smoke：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server 测试套件 smoke：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性 smoke：`pnpm qa:otel:smoke` 是私有 QA 源检出通道。它有意不是包 Docker 发布通道的一部分，
  因为 npm 压缩包省略了 QA Lab。
- Open WebUI 实时 smoke：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 入门引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm 压缩包入门引导/channel/agent smoke：`pnpm test:docker:npm-onboard-channel-agent` 在 Docker 中
  全局安装打包的 OpenClaw 压缩包，通过 env-ref 入门引导加 Telegram 默认配置 OpenAI，
  验证 doctor 修复已激活的插件运行时依赖，并运行一个模拟的 OpenAI agent 回合。
  用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建的压缩包，
  用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过主机重建，或用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换 channel。
- 更新 channel 切换 smoke：`pnpm test:docker:update-channel-switch` 在 Docker 中全局安装打包的
  OpenClaw 压缩包，从包 `stable` 切换到 git `dev`，验证持久化的 channel 和插件发布后工作，
  然后切换回包 `stable` 并检查更新状态。
- Session 运行时上下文 smoke：`pnpm test:docker:session-runtime-context` 验证隐藏的运行时上下文转录持久化
  加受影响的重复提示重写分支的 doctor 修复。
- Bun 全局安装 smoke：`bash scripts/e2e/bun-global-install-smoke.sh` 打包当前树，
  在隔离的主目录中用 `bun install -g` 安装它，并验证 `openclaw infer image providers --json`
  返回捆绑的图像 provider 而不是挂起。用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`
  复用预构建的压缩包，用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过主机构建，
  或用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从构建的 Docker 镜像复制 `dist/`。
- 安装器 Docker smoke：`bash scripts/test-install-sh-docker.sh` 在其 root、update 和 direct-npm 容器中
  共享一个 npm 缓存。更新 smoke 默认使用 npm `latest` 作为稳定基线，然后升级到候选压缩包。
  在本地用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，
  或在 GitHub 上用 Install Smoke 工作流的 `update_baseline_version` 输入覆盖。
  非 root 安装器检查保留隔离的 npm 缓存，以便 root 拥有的缓存条目不会掩盖用户本地安装行为。
  设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 以在本地重跑之间复用
  root/update/direct-npm 缓存。
- Install Smoke CI 用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；
  在需要直接 `npm install -g` 覆盖时，在没有该 env 的情况下在本地运行该脚本。
- Agents 删除共享工作区 CLI smoke：`pnpm test:docker:agents-delete-shared-workspace`
  （脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认构建根 Dockerfile 镜像，
  在隔离的容器主目录中播种两个具有一个工作区的 agent，运行 `agents delete --json`，
  并验证有效的 JSON 加保留的工作区行为。
  用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用安装 smoke 镜像。
- Gateway 网络（两个容器，WS 认证 + 健康）：`pnpm test:docker:gateway-network`
  （脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照 smoke：`pnpm test:docker:browser-cdp-snapshot`
  （脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）构建源 E2E 镜像加 Chromium 层，
  以原始 CDP 启动 Chromium，运行 `browser doctor --deep`，
  并验证 CDP 角色快照涵盖链接 URL、光标提升的可点击项、iframe 引用和帧元数据。
- OpenAI Responses web_search 最小推理回归：`pnpm test:docker:openai-web-search-minimal`
  （脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）通过 Gateway 运行模拟 OpenAI 服务器，
  验证 `web_search` 将 `reasoning.effort` 从 `minimal` 提高到 `low`，
  然后强制 provider 模式拒绝并检查原始详细信息出现在 Gateway 日志中。
- MCP channel 桥（已播种的 Gateway + stdio 桥 + 原始 Claude 通知帧 smoke）：
  `pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi 配置文件允许/拒绝 smoke）：
  `pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/子 agent MCP 清理（真实 Gateway + 隔离 cron 和一次性子 agent 运行后的 stdio MCP 子进程清理）：
  `pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装 smoke、ClawHub 安装/卸载、市场更新以及 Claude-bundle 启用/检查）：
  `pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 跳过实时 ClawHub 块，
  或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认包。
- 插件更新无更改 smoke：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置重载元数据 smoke：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 捆绑插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认构建一个小的 Docker 运行器镜像，
  在主机上一次性构建和打包 OpenClaw，然后将该压缩包挂载到每个 Linux 安装场景中。
  用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像，在新鲜本地构建后用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`
  跳过主机重建，或用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有压缩包。
  完整的 Docker 聚合和发布路径 `plugins-integrations` 块在主机上一次性预打包该压缩包，
  然后将捆绑的 channel 检查分片为独立通道，包括 Telegram、Discord、Slack、Feishu、
  memory-lancedb 和 ACPX 的独立更新通道。使用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`
  在直接运行捆绑通道时缩小 channel 矩阵，或用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`
  缩小更新场景。该通道还验证 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false`
  抑制 doctor/运行时依赖修复。
- 在迭代时通过禁用无关场景缩小捆绑插件运行时依赖，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

手动预构建和复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

特定于套件的镜像覆盖（如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）在设置时仍然优先。
当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果本地没有该镜像，脚本会拉取它。
QR 和安装器 Docker 测试保留自己的 Dockerfile，因为它们验证包/安装行为而不是共享的内置应用运行时。

手动 ACP 纯语言线程 smoke（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归/调试工作流。ACP 线程路由验证可能再次需要它，所以不要删除它。

有用的 env 变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile` 并在运行测试前源
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 仅验证从 `OPENCLAW_PROFILE_FILE` 源的 env 变量，
  使用临时配置/工作区目录且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）
  挂载到 `/home/node/.npm-global`，用于 Docker 内缓存的 CLI 安装
- `$HOME` 下的外部 CLI 认证目录/文件以只读方式挂载在 `/host-auth...` 下，
  然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、
    `~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小的 provider 运行仅挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录/文件
  - 用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或逗号列表
    如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 在容器内过滤 provider
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 在不需要重建的重跑中复用现有的 `openclaw:local-live` 镜像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 确保凭据来自配置文件存储（而非 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 选择 gateway 为 Open WebUI smoke 暴露的 model
- `OPENCLAW_OPENWEBUI_PROMPT=...` 覆盖 Open WebUI smoke 使用的随机数检查提示
- `OPENWEBUI_IMAGE=...` 覆盖固定的 Open WebUI 镜像标签

## 文档健全性

文档编辑后运行文档检查：`pnpm check:docs`。
当你也需要页内标题检查时，运行完整的 Mintlify 锚点验证：`pnpm docs:check-links:anchors`。

## 离线回归（CI 安全）

这些是没有真实 provider 的"真实流水线"回归：

- Gateway 工具调用（模拟 OpenAI，真实 gateway + agent 循环）：`src/gateway/gateway.test.ts`
  （案例："通过 gateway agent 循环端到端运行模拟 OpenAI 工具调用"）
- Gateway 向导（WS `wizard.start`/`wizard.next`，强制写入配置 + 认证）：
  `src/gateway/gateway.test.ts`（案例："通过 ws 运行向导并写入认证 token 配置"）

## Agent 可靠性评估（技能）

我们已经有一些表现得像"agent 可靠性评估"的 CI 安全测试：

- 通过真实 gateway + agent 循环进行模拟工具调用（`src/gateway/gateway.test.ts`）。
- 验证 Session 布线和配置效果的端到端向导流（`src/gateway/gateway.test.ts`）。

技能仍然缺少什么（见 [技能](/tools/skills)）：

- **决策：** 当技能在提示中列出时，agent 是否选择正确的技能（或避免无关的技能）？
- **合规：** agent 是否在使用前阅读 `SKILL.md` 并遵循所需的步骤/参数？
- **工作流合约：** 断言工具顺序、Session 历史记录传递和沙盒边界的多回合场景。

未来的评估应该首先保持确定性：

- 使用模拟 provider 的场景运行器，断言工具调用 + 顺序、技能文件读取和 Session 布线。
- 一小套以技能为中心的场景（使用与避免、门控、提示注入）。
- 可选的实时评估（可选加入，env 门控）仅在 CI 安全套件就位后进行。

## 合约测试（插件和 channel 形状）

合约测试验证每个注册的插件和 channel 符合其接口合约。
它们遍历所有发现的插件并运行一套形状和行为断言。
默认的 `pnpm test` 单元通道有意跳过这些共享接缝和 smoke 文件；
当你触及共享的 channel 或 provider 界面时，明确运行合约命令。

### 命令

- 所有合约：`pnpm test:contracts`
- 仅 channel 合约：`pnpm test:contracts:channels`
- 仅 provider 合约：`pnpm test:contracts:plugins`

### Channel 合约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、name、capabilities）
- **setup** - 安装向导合约
- **session-binding** - Session 绑定行为
- **outbound-payload** - 消息 payload 结构
- **inbound** - 入站消息处理
- **actions** - Channel 操作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/名册 API
- **group-policy** - 群组策略执行

### Provider 状态合约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - Channel 状态探测
- **registry** - 插件注册表形状

### Provider 合约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流合约
- **auth-choice** - 认证选择/选取
- **catalog** - Model 目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - Provider 运行时
- **shape** - 插件形状/接口
- **wizard** - 安装向导

### 何时运行

- 更改 plugin-sdk 导出或子路径后
- 添加或修改 channel 或 provider 插件后
- 重构插件注册或发现后

合约测试在 CI 中运行，不需要真实的 API 密钥。

## 添加回归（指南）

当你修复在实时发现的 provider/model 问题时：

- 如果可能，添加 CI 安全回归（模拟/存根 provider，或捕获精确的请求形状转换）
- 如果本质上是仅实时的（速率限制、认证策略），保持实时测试窄且通过 env 变量可选加入
- 优先针对捕获 bug 的最小层：
  - provider 请求转换/重放 bug → 直接 models 测试
  - gateway Session/历史记录/工具流水线 bug → gateway 实时 smoke 或 CI 安全 gateway 模拟测试
- SecretRef 遍历护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 从注册表元数据（`listSecretTargetRegistryEntries()`）
    每个 SecretRef 类派生一个采样目标，然后断言遍历段 exec id 被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加新的 `includeInPlan` SecretRef 目标族，
    在该测试中更新 `classifyTargetClass`。测试在未分类的目标 id 上有意失败，
    因此新类别不能被静默跳过。

## 相关

- [实时测试](/help/testing-live)
- [CI](/ci)
