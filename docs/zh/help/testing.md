---
mmh3_hash: "8b1292083ac673d84c114c4ae1891b9d"
title: "测试"
summary: "测试套件：单元/e2e/实时套件、Docker 运行器以及每个测试涵盖的内容"
read_when:
  - 在本地或 CI 中运行测试
  - 为 model/provider 错误添加回归测试
  - 调试 gateway + agent 行为
---

# 测试

OpenClaw 有三个 Vitest 套件（单元/集成、e2e、实时）和一小组 Docker 运行器。

本文档是"我们如何测试"的指南：

- 每个套件涵盖什么（以及它刻意_不_涵盖什么）
- 常见工作流（本地、推送前、调试）运行哪些命令
- 实时测试如何发现凭据并选择 models/providers
- 如何为真实 model/provider 问题添加回归测试

## 快速入门

大多数时候：

- 完整门控（推送前预期）：`pnpm build && pnpm check && pnpm test`
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

提示：当你只需要一个失败案例时，优先通过下面描述的允许列表 env vars 缩小实时测试范围。

## QA 专用运行器

当你需要 QA 实验室真实感时，这些命令位于主测试套件旁边：

- `pnpm openclaw qa suite`
  - 直接在主机上运行仓库支持的 QA 场景。
  - 默认使用隔离的 gateway 工作器并行运行多个选定场景。`qa-channel` 默认并发数为 4（受选定场景数量限制）。使用 `--concurrency <count>` 调整工作器数量，或 `--concurrency 1` 使用旧的串行通道。
  - 当任何场景失败时以非零退出。当你想要工件而不希望失败退出代码时使用 `--allow-failures`。
  - 支持 provider 模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 启动本地 AIMock 支持的 provider 服务器，用于实验性 fixture 和协议 mock 覆盖，而不替换场景感知的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 内运行相同的 QA 套件。
  - 与主机上的 `qa suite` 保持相同的场景选择行为。
  - 重用与 `qa suite` 相同的 provider/model 选择标志。
  - 实时运行转发对客户机实用的支持 QA auth 输入：基于 env 的 provider 密钥、QA 实时 provider 配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，以便客户机可以通过挂载的工作区写回。
  - 在 `.artifacts/qa-e2e/...` 下写入正常的 QA 报告 + 摘要以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点用于运营式 QA 工作。
- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock provider 服务器用于直接协议烟雾测试。
- `pnpm openclaw qa matrix`
  - 针对一次性 Docker 支持的 Tuwunel 主服务器运行 Matrix 实时 QA 通道。
  - 此 QA 主机今天仅用于仓库/开发。打包的 OpenClaw 安装不附带 `qa-lab`，因此不暴露 `openclaw qa`。
  - 仓库 checkout 直接加载捆绑的运行器；不需要单独的插件安装步骤。
  - 配置三个临时 Matrix 用户（`driver`、`sut`、`observer`）加一个私人房间，然后以真实 Matrix 插件作为 SUT 传输启动 QA gateway 子进程。
  - 默认使用固定的稳定 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。当你需要测试不同镜像时使用 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享凭据来源标志，因为该通道在本地配置一次性用户。
  - 在 `.artifacts/qa-e2e/...` 下写入 Matrix QA 报告、摘要、观察到的事件工件和合并的 stdout/stderr 输出日志。
- `pnpm openclaw qa telegram`
  - 针对使用驱动器和 SUT bot token 的真实私人群组运行 Telegram 实时 QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是数字 Telegram 聊天 id。
  - 支持 `--credential-source convex` 用于共享的池化凭据。默认使用 env 模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 选择池化租约。
  - 当任何场景失败时以非零退出。当你想要工件而不希望失败退出代码时使用 `--allow-failures`。
  - 需要同一私人群组中的两个不同 bot，SUT bot 暴露 Telegram 用户名。
  - 为了稳定的 bot 间观察，在 `@BotFather` 中为两个 bot 启用 Bot 间通信模式，并确保驱动器 bot 可以观察群组 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和观察到的消息工件。

实时传输通道共享一个标准契约，以便新传输不会偏离：

`qa-channel` 仍然是广泛的合成 QA 套件，不是实时传输覆盖矩阵的一部分。

| 通道     | 金丝雀 | 提及门控 | 允许列表阻止 | 顶级回复 | 重启恢复 | 线程跟进 | 线程隔离 | 反应观察 | 帮助命令 |
| -------- | ------ | -------- | ------------ | -------- | -------- | -------- | -------- | -------- | -------- |
| Matrix   | x      | x        | x            | x        | x        | x        | x        | x        |          |
| Telegram | x      |          |              |          |          |          |          |          | x        |

### 通过 Convex 共享 Telegram 凭据（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA 实验室从 Convex 支持的池获取独占租约，在通道运行期间对该租约进行心跳，并在关闭时释放租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的 env 变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所选角色的一个 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用于 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用于 `ci`
- 凭据角色选择：
  - CLI：`--credential-role maintainer|ci`
  - Env 默认：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认为 `ci`，否则默认为 `maintainer`）

可选 env 变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选的跟踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许仅本地开发使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在正常操作中应使用 `https://`。

维护者管理命令（池添加/删除/列出）需要专门的 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

维护者 CLI 助手：

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在脚本和 CI 工具中使用 `--json` 获取机器可读输出。

默认端点契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

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
- `POST /admin/add`（仅维护者 secret）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅维护者 secret）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约守卫：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅维护者 secret）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram kind 的载荷格式：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数字 Telegram 聊天 id 字符串。
- `admin/add` 为 `kind: "telegram"` 验证此格式并拒绝格式错误的载荷。

### 向 QA 添加 channel

向 markdown QA 系统添加 channel 恰好需要两件事：

1. 该 channel 的传输适配器。
2. 练习 channel 契约的场景包。

当共享的 `qa-lab` 主机可以拥有流程时，不要添加新的顶级 QA 命令根。

`qa-lab` 拥有共享主机机制：

- `openclaw qa` 命令根
- 套件启动和拆卸
- 工作器并发
- 工件写入
- 报告生成
- 场景执行
- 旧版 `qa-channel` 场景的兼容别名

运行器插件拥有传输契约：

- `openclaw qa <runner>` 如何挂载在共享 `qa` 根下
- 如何为该传输配置 gateway
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露转录和规范化的传输状态
- 如何执行传输支持的操作
- 如何处理传输特定的重置或清理

新 channel 的最低采用门槛：

1. 保持 `qa-lab` 作为共享 `qa` 根的所有者。
2. 在共享 `qa-lab` 主机接缝上实现传输运行器。
3. 将传输特定的机制保留在运行器插件或 channel 测试套件内。
4. 将运行器挂载为 `openclaw qa <runner>` 而不是注册竞争的根命令。运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners` 并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；延迟 CLI 和运行器执行应保留在单独的入口点后面。
5. 在主题化的 `qa/scenarios/` 目录下编写或改编 markdown 场景。
6. 为新场景使用通用场景助手。
7. 保持现有的兼容别名工作，除非仓库正在进行有意的迁移。

决策规则是严格的：

- 如果行为可以在 `qa-lab` 中表达一次，将其放在 `qa-lab` 中。
- 如果行为依赖于一个 channel 传输，将其保留在该运行器插件或插件测试套件中。
- 如果场景需要多个 channel 都可以使用的新功能，添加通用助手而不是 `suite.ts` 中的 channel 特定分支。
- 如果行为只对一个传输有意义，将场景保持传输特定并在场景契约中明确说明。

新场景首选的通用助手名称：

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

兼容别名仍可用于现有场景，包括：

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新 channel 工作应使用通用助手名称。兼容别名的存在是为了避免一次性迁移，而不是新场景编写的模型。

## 测试套件（什么在哪里运行）

将套件视为"增加真实性"（以及增加不稳定性/成本）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：十个顺序分片运行（`vitest.full-*.config.ts`），覆盖现有的有范围 Vitest 项目
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 下的核心/单元清单，以及 `vitest.unit.config.ts` 涵盖的白名单 `ui` 节点测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（gateway auth、路由、工具、解析、配置）
  - 已知错误的确定性回归测试
- 期望：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
- 项目注意事项：
  - 无目标的 `pnpm test` 现在运行十一个较小的分片配置（`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这在负载机器上减少了峰值 RSS 并避免 auto-reply/extension 工作占用无关套件。
  - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片监视循环不实用。
  - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 首先通过有范围通道路由显式文件/目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 避免支付完整根项目启动税。
  - `pnpm test:changed` 当差异仅涉及可路由的源/测试文件时，将更改的 git 路径展开到相同的有范围通道；配置/设置编辑仍然回退到广泛的根项目重新运行。
  - 来自 agents、commands、plugins、auto-reply 助手、`plugin-sdk` 和类似纯工具区域的导入轻量单元测试通过 `unit-fast` 通道路由，该通道跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时重量文件保留在现有通道上。
  - 选定的 `plugin-sdk` 和 `commands` 助手源文件还将 changed 模式运行映射到这些轻量通道中的显式兄弟测试，因此助手编辑避免为该目录重新运行完整的重量套件。
  - `auto-reply` 现在有三个专用桶：顶级核心助手、顶级 `reply.*` 集成测试和 `src/auto-reply/reply/**` 子树。这使最重的 reply 测试套件工作远离廉价的 status/chunk/token 测试。
- 嵌入式运行器注意事项：
  - 当你更改 message-tool 发现输入或 compaction 运行时上下文时，保持两层覆盖。
  - 为纯路由/规范化边界添加专注的辅助回归测试。
  - 同时保持嵌入式运行器集成套件健康：`src/agents/pi-embedded-runner/compact.hooks.test.ts`、`src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和 `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - 这些套件验证作用域 id 和 compaction 行为是否仍通过真实的 `run.ts` / `compact.ts` 路径流动；仅辅助测试不能替代这些集成路径。
- Pool 注意事项：
  - 基础 Vitest 配置现在默认为 `threads`。
  - 共享 Vitest 配置还固定了 `isolate: false`，并在根项目、e2e 和实时配置中使用非隔离运行器。
  - 根 UI 通道保留其 `jsdom` 设置和优化器，但现在也在共享非隔离运行器上运行。
  - 每个 `pnpm test` 分片从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
  - 共享的 `scripts/run-vitest.mjs` 启动器现在还默认为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。如果你需要与标准 V8 行为进行比较，设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`。
- 快速本地迭代注意事项：
  - `pnpm test:changed` 当更改路径清晰映射到较小套件时通过有范围通道路由。
  - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是工作器上限更高。
  - 本地工作器自动缩放现在故意保守，当主机负载平均值已经很高时也会退缩，因此多个并发 Vitest 运行默认情况下损害较小。
  - 基础 Vitest 配置将 projects/config 文件标记为 `forceRerunTriggers`，以便在测试连线更改时 changed 模式重新运行保持正确。
  - 配置在支持的主机上保持 `OPENCLAW_VITEST_FS_MODULE_CACHE` 启用；如果你想要一个显式的缓存位置用于直接分析，设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
- 性能调试注意事项：
  - `pnpm test:perf:imports` 启用 Vitest 导入时长报告加上导入分解输出。
  - `pnpm test:perf:imports:changed` 将相同的分析视图范围限制为自 `origin/main` 以来更改的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 将路由的 `test:changed` 与该提交差异的原生根项目路径进行比较，并打印墙时间加 macOS 最大 RSS。
- `pnpm test:perf:changed:bench -- --worktree` 通过 `scripts/test-projects.mjs` 和根 Vitest 配置路由更改的文件列表来对当前脏树进行基准测试。
  - `pnpm test:perf:profile:main` 为 Vitest/Vite 启动和转换开销写入主线程 CPU profile。
  - `pnpm test:perf:profile:runner` 为禁用文件并行的单元套件写入运行器 CPU+堆 profile。

### E2E（gateway 冒烟测试）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- 运行时默认值：
  - 使用 Vitest `threads` 配合 `isolate: false`，与仓库其余部分匹配。
  - 使用自适应 workers（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行以减少控制台 I/O 开销。
- 有用的覆盖：
  - `OPENCLAW_E2E_WORKERS=<n>` 强制 worker 数量（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 重新启用详细控制台输出。
- 范围：
  - 多实例 gateway 端到端行为
  - WebSocket/HTTP 接口、node 配对和更重的网络
- 期望：
  - 在 CI 中运行（当在管道中启用时）
  - 不需要真实密钥
  - 比单元测试有更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟测试

- 命令：`pnpm test:e2e:openshell`
- 文件：`test/openshell-sandbox.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动隔离的 OpenShell gateway
  - 从临时本地 Dockerfile 创建沙盒
  - 通过真实的 `sandbox ssh-config` + SSH exec 在 OpenClaw 的 OpenShell 后端上进行练习
  - 通过沙盒 fs 桥验证远程规范文件系统行为
- 期望：
  - 仅选择性加入；不是默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 加上正常工作的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 gateway 和沙盒
- 有用的覆盖：
  - `OPENCLAW_E2E_OPENSHELL=1` 在手动运行更广泛的 e2e 套件时启用测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 指向非默认 CLI 二进制或包装脚本

### 实时测试（真实 providers + 真实 models）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - "这个 provider/model _今天_用真实凭据实际上有效吗？"
  - 捕获 provider 格式更改、工具调用怪癖、auth 问题和速率限制行为
- 期望：
  - 设计上不稳定 CI（真实网络、真实 provider 策略、配额、中断）
  - 花钱 / 使用速率限制
  - 优先运行缩小的子集而不是"所有内容"
- 实时运行将获取 `~/.profile` 以获取缺失的 API keys。
- 默认情况下，实时运行仍然隔离 `HOME` 并将配置/auth 材料复制到临时测试 home 中，因此单元 fixtures 不会修改你真实的 `~/.openclaw`。
- 仅当你有意需要实时测试使用你真实的主目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认为更安静的模式：它保留 `[live] ...` 进度输出，但抑制额外的 `~/.profile` 通知并静音 gateway 引导日志/Bonjour 聊天。如果你想要完整的启动日志，设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（provider 特定）：用逗号/分号格式设置 `*_API_KEYS` 或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）或通过 `OPENCLAW_LIVE_*_KEY` 按实时覆盖；测试在速率限制响应时重试。
- 进度/心跳输出：
  - 实时套件现在将进度行发送到 stderr，以便即使在 Vitest 控制台捕获安静时，长时间的 provider 调用也可见活跃状态。
  - `vitest.live.config.ts` 禁用 Vitest 控制台拦截，以便 provider/gateway 进度行在实时运行期间立即流式传输。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 gateway/探测心跳。

## 我应该运行哪个套件？

使用这个决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果你改变了很多，加上 `pnpm test:coverage`）
- 触及 gateway 网络 / WS 协议 / 配对：添加 `pnpm test:e2e`
- 调试"我的 bot 停了" / provider 特定失败 / 工具调用：运行缩小的 `pnpm test:live`

## 实时测试：Android node 能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用连接的 Android node 当前**广告的每个命令**并断言命令契约行为。
- 范围：
  - 前置条件/手动设置（套件不安装/运行/配对应用）。
  - 为所选 Android node 逐命令 gateway `node.invoke` 验证。
- 需要预设置：
  - Android 应用已连接 + 与 gateway 配对。
  - 应用保持在前台。
  - 为你期望通过的能力授予权限/捕获同意。
- 可选目标覆盖：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情：[Android App](/platforms/android)

## 实时测试：model 冒烟（profile keys）

实时测试分为两层，这样我们可以隔离失败：

- "直接 model"告诉我们 provider/model 是否能用给定的 key 完全回答。
- "Gateway 冒烟"告诉我们完整的 gateway+agent 管道是否对该 model 有效（sessions、历史记录、工具、沙盒策略等）。

### 第 1 层：直接 model completion（无 gateway）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举发现的 models
  - 使用 `getApiKeyForModel` 选择你有凭据的 models
  - 每个 model 运行一个小的 completion（需要时加上有针对性的回归测试）
- 如何启用：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，是 modern 的别名）以实际运行此套件；否则它会跳过以使 `pnpm test:live` 专注于 gateway 冒烟
- 如何选择 models：
  - `OPENCLAW_LIVE_MODELS=modern` 运行现代允许列表（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是现代允许列表的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` （逗号允许列表）
  - 现代/全量扫描默认为精心策划的高信号上限；设置 `OPENCLAW_LIVE_MAX_MODELS=0` 进行详尽的现代扫描，或设置正数以获得更小的上限。
- 如何选择 providers：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` （逗号允许列表）
- keys 来自哪里：
  - 默认：profile 存储和 env 回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制**仅** profile 存储
- 为什么存在：
  - 将"provider API 坏了 / key 无效"与"gateway agent 管道坏了"分开
  - 包含小型隔离回归测试（示例：OpenAI Responses/Codex Responses 推理重播 + 工具调用流）

### 第 2 层：Gateway + dev agent 冒烟（"@openclaw"实际做的事情）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动进程内 gateway
  - 创建/修补 `agent:dev:*` session（每次运行 model 覆盖）
  - 遍历有 key 的 models 并断言：
    - "有意义"的响应（无工具）
    - 真实工具调用有效（read 探测）
    - 可选的额外工具探测（exec+read 探测）
    - OpenAI 回归路径（仅工具调用 → 后续）保持有效
- 探测详情（这样你可以快速解释失败）：
  - `read` 探测：测试在 workspace 中写入一个随机文件并要求 agent `read` 它并回显该随机内容。
  - `exec+read` 探测：测试要求 agent `exec` 将随机内容写入临时文件，然后 `read` 它回来。
  - 图像探测：测试附加生成的 PNG（cat + 随机化代码）并期望 model 返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 如何启用：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 如何选择 models：
  - 默认：现代允许列表（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代允许列表的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）来缩小
  - 现代/全量 gateway 扫描默认为精心策划的高信号上限；设置 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 进行详尽的现代扫描，或设置正数以获得更小的上限。
- 如何选择 providers（避免"OpenRouter 所有"）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` （逗号允许列表）
- 工具 + 图像探测在此实时测试中始终开启：
  - `read` 探测 + `exec+read` 探测（工具压力）
  - 图像探测在 model 广告图像输入支持时运行
  - 流程（高层次）：
    - 测试生成带"CAT" + 随机代码的小 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式 agent 将多模态用户消息转发给 model
    - 断言：回复包含 `cat` + 代码（OCR 容错：允许轻微错误）

提示：要查看你机器上可以测试的内容（以及确切的 `provider/model` ids），运行：

```bash
openclaw models list
openclaw models list --json
```

## 实时测试：CLI 后端冒烟（Claude、Codex、Gemini 或其他本地 CLIs）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway + agent 管道，而不触及你的默认配置。
- 后端特定的冒烟默认值与拥有的扩展的 `cli-backend.ts` 定义一起存在。
- 启用：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认：
  - 默认 provider/model：`claude-cli/claude-sonnet-4-6`
  - 命令/参数/图像行为来自拥有的 CLI 后端插件元数据。
- 覆盖（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 发送真实图像附件（路径注入到 prompt 中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 将图像文件路径作为 CLI 参数传递而不是 prompt 注入。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）控制设置 `IMAGE_ARG` 时图像参数如何传递。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 发送第二轮并验证 resume 流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` 禁用默认的 Claude Sonnet -> Opus 同 session 连续性探测（设置为 `1` 可在所选 model 支持切换目标时强制开启）。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-cli-backend
```

单 provider Docker 配方：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注意：

- Docker 运行器位于 `scripts/test-live-cli-backend-docker.sh`。
- 它以非 root `node` 用户在仓库 Docker 镜像内运行实时 CLI 后端冒烟。
- 它从拥有的扩展解析 CLI 冒烟元数据，然后将匹配的 Linux CLI 包（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安装到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 的可写缓存前缀（默认：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要通过 `~/.claude/.credentials.json` 中的 `claudeAiOauth.subscriptionType` 或来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN` 的可移植 Claude Code 订阅 OAuth。它首先在 Docker 中证明直接的 `claude -p`，然后在不保留 Anthropic API key env vars 的情况下运行两个 Gateway CLI 后端轮次。此订阅通道默认禁用 Claude MCP/工具和图像探测，因为 Claude 目前通过额外使用计费而不是正常的订阅计划限制路由第三方应用使用。
- 实时 CLI 后端冒烟现在为 Claude、Codex 和 Gemini 练习相同的端到端流程：文本轮次、图像分类轮次，然后通过 gateway CLI 验证的 MCP `cron` 工具调用。
- Claude 的默认冒烟还将 session 从 Sonnet 补丁到 Opus，并验证恢复的 session 仍然记得之前的注释。

## 实时测试：ACP bind 冒烟（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用实时 ACP agent 验证真实的 ACP 对话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 绑定一个合成的消息 channel 对话
  - 在同一对话上发送正常的后续消息
  - 验证后续消息落在绑定的 ACP session 转录中
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认：
  - Docker 中的 ACP agents：`claude,codex,gemini`
  - 直接 `pnpm test:live ...` 的 ACP agent：`claude`
  - 合成 channel：Slack DM 风格对话上下文
  - ACP 后端：`acpx`
- 覆盖：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 注意：
  - 此通道使用带管理员专用合成起源路由字段的 gateway `chat.send` 接口，以便测试可以附加消息 channel 上下文而无需假装外部投递。
  - 当 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 未设置时，测试使用嵌入式 `acpx` 插件的内置 agent 注册表用于所选 ACP 测试套件 agent。

示例：

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-acp-bind
```

单 agent Docker 配方：

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker 注意：

- Docker 运行器位于 `scripts/test-live-acp-bind-docker.sh`。
- 默认情况下，它依次针对所有支持的实时 CLI agents 运行 ACP bind 冒烟：`claude`、`codex`，然后是 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 缩小矩阵。
- 它获取 `~/.profile`，将匹配的 CLI auth 材料暂存到容器中，将 `acpx` 安装到可写的 npm 前缀，然后在缺少时安装请求的实时 CLI（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）。
- 在 Docker 内，运行器设置 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`，以便 acpx 将来自获取的 profile 的 provider env vars 保持对子测试套件 CLI 可用。

## 实时测试：Codex app-server 测试套件冒烟

- 目标：通过正常的 gateway `agent` 方法验证插件拥有的 Codex 测试套件：
  - 加载捆绑的 `codex` 插件
  - 选择 `OPENCLAW_AGENT_RUNTIME=codex`
  - 向 `codex/gpt-5.4` 发送第一个 gateway agent 轮次
  - 向同一个 OpenClaw session 发送第二轮并验证 app-server 线程可以恢复
  - 通过同一个 gateway 命令路径运行 `/codex status` 和 `/codex models`
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 默认 model：`codex/gpt-5.4`
- 可选图像探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP/工具探测：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 冒烟设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，以便损坏的 Codex 测试套件不能通过静默回退到 PI 而通过。
- Auth：来自 shell/profile 的 `OPENAI_API_KEY`，加上可选的复制 `~/.codex/auth.json` 和 `~/.codex/config.toml`

本地配方：

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 配方：

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker 注意：

- Docker 运行器位于 `scripts/test-live-codex-harness-docker.sh`。
- 它获取挂载的 `~/.profile`，传递 `OPENAI_API_KEY`，在存在时复制 Codex CLI auth 文件，将 `@openai/codex` 安装到可写的挂载 npm 前缀，暂存源树，然后只运行 Codex 测试套件实时测试。
- Docker 默认启用图像和 MCP/工具探测。当你需要更窄的调试运行时，设置 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或 `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`。
- Docker 还导出 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，与实时测试配置匹配，以便 `openai-codex/*` 或 PI 回退不能隐藏 Codex 测试套件回归。

### 推荐的实时测试配方

缩窄、明确的允许列表最快且最不不稳定：

- 单个 model，直接（无 gateway）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单个 model，gateway 冒烟：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个 providers 的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 重点（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注意：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth 桥（Cloud Code Assist 风格 agent 端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（单独的 auth + 工具怪癖）。
- Gemini API vs Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API key / profile auth）；这是大多数用户所说的"Gemini"。
  - CLI：OpenClaw 调用本地 `gemini` 二进制；它有自己的 auth，行为可能不同（流/工具支持/版本偏差）。

## 实时测试：model 矩阵（我们涵盖什么）

没有固定的"CI model 列表"（实时是选择性加入），但这些是我们期望在有 key 的开发机器上定期覆盖的**推荐** models。

### 现代冒烟集（工具调用 + 图像）

这是我们期望保持有效的"常见 models"运行：

- OpenAI（非 Codex）：`openai/gpt-5.4`（可选：`openai/gpt-5.4-mini`）
- OpenAI Codex：`openai-codex/gpt-5.4`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免旧的 Gemini 2.x models）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

用工具 + 图像运行 gateway 冒烟：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基准：工具调用（Read + 可选 Exec）

每个 provider 系列至少选一个：

- OpenAI：`openai/gpt-5.4`（或 `openai/gpt-5.4-mini`）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

可选额外覆盖（最好有）：

- xAI：`xai/grok-4`（或最新可用）
- Mistral：`mistral/`...（选一个你启用的支持工具的 model）
- Cerebras：`cerebras/`...（如果你有访问权限）
- LM Studio：`lmstudio/`...（本地；工具调用取决于 API 模式）

### 视觉：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的 model（Claude/Gemini/OpenAI 视觉能力变体等）以练习图像探测。

### 聚合器 / 替代 gateways

如果你启用了 key，我们还支持通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个 models；使用 `openclaw models scan` 查找支持工具+图像的候选者）
- OpenCode：`opencode/...` 用于 Zen，`opencode-go/...` 用于 Go（auth 通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

你可以在实时矩阵中包含的更多 providers（如果你有凭据/配置）：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云/API），以及任何 OpenAI/Anthropic 兼容代理（LM Studio、vLLM、LiteLLM 等）

提示：不要尝试在文档中硬编码"所有 models"。权威列表是你机器上 `discoverModels(...)` 返回的内容加上可用的 keys。

## 凭据（永远不要提交）

实时测试与 CLI 相同方式发现凭据。实际含义：

- 如果 CLI 有效，实时测试应该找到相同的 keys。
- 如果实时测试说"无凭据"，用与调试 `openclaw models list` / model 选择相同的方式调试。

- 每个 agent 的 auth profiles：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这是实时测试中"profile keys"的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（在存在时复制到暂存的实时 home 中，但不是主要的 profile key 存储）
- 实时本地运行默认将活跃配置、每个 agent 的 `auth-profiles.json` 文件、旧版 `credentials/` 和支持的外部 CLI auth 目录复制到临时测试 home；暂存的实时 home 跳过 `workspace/` 和 `sandboxes/`，`agents.*.workspace` / `agentDir` 路径覆盖被剥离，以便探测远离你真实的主机工作区。

如果你想依赖 env keys（例如在 `~/.profile` 中导出的），在 `source ~/.profile` 后运行本地测试，或使用下面的 Docker 运行器（它们可以将 `~/.profile` 挂载到容器中）。

## Deepgram 实时测试（音频转录）

- 测试：`src/media-understanding/providers/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus 编码计划实时测试

- 测试：`src/agents/byteplus.live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 可选 model 覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流媒体实时测试

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 练习捆绑的 comfy 图像、视频和 `music_generate` 路径
  - 除非配置了 `models.providers.comfy.<capability>`，否则跳过每个功能
  - 在更改 comfy 工作流提交、轮询、下载或插件注册后很有用

## 图像生成实时测试

- 测试：`src/image-generation/runtime.live.test.ts`
- 命令：`pnpm test:live src/image-generation/runtime.live.test.ts`
- 测试套件：`pnpm test:live:media image`
- 范围：
  - 枚举每个已注册的图像生成 provider 插件
  - 在探测前从登录 Shell（`~/.profile`）加载缺失的 provider env vars
  - 默认使用实时/env API keys 优于存储的 auth profiles，以便 `auth-profiles.json` 中的陈旧测试 keys 不会遮蔽真实的 Shell 凭据
  - 跳过没有可用 auth/profile/model 的 providers
  - 通过共享运行时功能运行标准图像生成变体：
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 当前捆绑的 providers 覆盖：
  - `openai`
  - `google`
- 可选缩窄：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- 可选 auth 行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制 profile 存储 auth 并忽略仅 env 覆盖

## 音乐生成实时测试

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 测试套件：`pnpm test:live:media music`
- 范围：
  - 练习共享捆绑的音乐生成 provider 路径
  - 目前覆盖 Google 和 MiniMax
  - 在探测前从登录 Shell（`~/.profile`）加载 provider env vars
  - 默认使用实时/env API keys 优于存储的 auth profiles，以便 `auth-profiles.json` 中的陈旧测试 keys 不会遮蔽真实的 Shell 凭据
  - 跳过没有可用 auth/profile/model 的 providers
  - 在可用时运行两种声明的运行时模式：
    - `generate`，带仅 prompt 输入
    - `edit`，当 provider 声明 `capabilities.edit.enabled` 时
  - 当前共享通道覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：单独的 Comfy 实时文件，不在此共享扫描中
- 可选缩窄：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 可选 auth 行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制 profile 存储 auth 并忽略仅 env 覆盖

## 视频生成实时测试

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 测试套件：`pnpm test:live:media video`
- 范围：
  - 练习共享捆绑的视频生成 provider 路径
  - 默认为发布安全的冒烟路径：非 FAL providers、每个 provider 一个文本到视频请求、一秒 lobster prompt，以及来自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（默认 `180000`）的每个 provider 操作上限
  - 默认跳过 FAL，因为 provider 端队列延迟可能主导发布时间；传递 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 以显式运行它
  - 在探测前从登录 Shell（`~/.profile`）加载 provider env vars
  - 默认使用实时/env API keys 优于存储的 auth profiles，以便 `auth-profiles.json` 中的陈旧测试 keys 不会遮蔽真实的 Shell 凭据
  - 跳过没有可用 auth/profile/model 的 providers
  - 默认只运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 还可以在可用时运行声明的转换模式：
    - `imageToVideo`，当 provider 声明 `capabilities.imageToVideo.enabled` 且所选 provider/model 在共享扫描中接受缓冲支持的本地图像输入时
    - `videoToVideo`，当 provider 声明 `capabilities.videoToVideo.enabled` 且所选 provider/model 在共享扫描中接受缓冲支持的本地视频输入时
  - 当前共享扫描中声明但跳过的 `imageToVideo` providers：
    - `vydra`，因为捆绑的 `veo3` 仅支持文本，捆绑的 `kling` 需要远程图像 URL
  - Vydra 特定的 provider 覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件运行 `veo3` 文本到视频加上默认使用远程图像 URL fixture 的 `kling` 通道
  - 当前 `videoToVideo` 实时覆盖：
    - 仅当所选 model 为 `runway/gen4_aleph` 时才有 `runway`
  - 当前共享扫描中声明但跳过的 `videoToVideo` providers：
    - `alibaba`、`qwen`、`xai`，因为这些路径目前需要远程 `http(s)` / MP4 参考 URL
    - `google`，因为当前共享的 Gemini/Veo 通道使用本地缓冲支持的输入，而该路径在共享扫描中不被接受
    - `openai`，因为当前共享通道缺乏特定组织的视频修复/重混访问保证
- 可选缩窄：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 在默认扫描中包含每个 provider，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 减少每个 provider 操作上限以进行积极的冒烟运行
- 可选 auth 行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制 profile 存储 auth 并忽略仅 env 覆盖

## 媒体实时测试套件

- 命令：`pnpm test:live:media`
- 目的：
  - 通过一个仓库原生入口点运行共享的图像、音乐和视频实时套件
  - 自动从 `~/.profile` 加载缺失的 provider env vars
  - 默认自动将每个套件缩窄到当前具有可用 auth 的 providers
  - 重用 `scripts/test-live.mjs`，以便心跳和安静模式行为保持一致
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker 运行器（可选的"在 Linux 上有效"检查）

这些 Docker 运行器分为两个桶：

- 实时 model 运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 仅在仓库 Docker 镜像内运行各自匹配的 profile key 实时文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），挂载你的本地配置目录和 workspace（以及在挂载时获取 `~/.profile`）。匹配的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 实时运行器默认为较小的冒烟上限，以便完整的 Docker 扫描保持实用：`test:docker:live-models` 默认为 `OPENCLAW_LIVE_MAX_MODELS=12`，`test:docker:live-gateway` 默认为 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和 `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确想要更大的详尽扫描时，覆盖这些 env vars。
- `test:docker:all` 通过 `test:docker:live-build` 构建一次实时 Docker 镜像，然后为两个实时 Docker 通道重用它。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels` 和 `test:docker:plugins` 启动一个或多个真实容器并验证更高级别的集成路径。

实时 model Docker 运行器还仅绑定挂载所需的 CLI auth home（或运行未缩窄时所有支持的），然后在运行前将其复制到容器 home 中，以便外部 CLI OAuth 可以刷新 token 而不会修改主机 auth 存储：

- 直接 models：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP bind 冒烟：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server 测试套件冒烟：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI 实时冒烟：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Gateway 网络（两个容器，WS auth + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- MCP channel 桥（有种子的 Gateway + stdio 桥 + 原始 Claude 通知帧冒烟）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Plugins（安装冒烟 + `/plugin` 别名 + Claude-bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）

实时 model Docker 运行器还将当前 checkout 只读绑定挂载并将其暂存到容器内的临时工作目录中。这保持运行时镜像精简，同时仍然针对你的确切本地源/配置运行 Vitest。暂存步骤跳过大型仅本地缓存和应用构建输出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__` 和应用本地 `.build` 或 Gradle 输出目录，以便 Docker 实时运行不会花费数分钟复制机器特定工件。它们还设置 `OPENCLAW_SKIP_CHANNELS=1`，以便 gateway 实时探测不会在容器内启动真实的 Telegram/Discord 等 channel workers。`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要缩窄或排除该 Docker 通道的 gateway 实时覆盖时，也需要传递 `OPENCLAW_LIVE_GATEWAY_*`。`test:docker:openwebui` 是更高级别的兼容性冒烟：它启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw gateway 容器，针对该 gateway 启动一个固定的 Open WebUI 容器，通过 Open WebUI 登录，验证 `/api/models` 暴露 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送真实的聊天请求。第一次运行可能明显较慢，因为 Docker 可能需要拉取 Open WebUI 镜像，Open WebUI 可能需要完成自己的冷启动设置。此通道需要可用的实时 model key，`OPENCLAW_PROFILE_FILE`（默认 `~/.profile`）是在 Dockerized 运行中提供它的主要方式。成功运行会打印一个小的 JSON 载荷，如 `{ "ok": true, "model": "openclaw/default", ... }`。`test:docker:mcp-channels` 是故意确定性的，不需要真实的 Telegram、Discord 或 iMessage 账户。它启动一个有种子的 Gateway 容器，启动第二个生成 `openclaw mcp serve` 的容器，然后通过真实的 stdio MCP 桥验证路由的对话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由和 Claude 风格的 channel + 权限通知。通知检查直接检查原始 stdio MCP 帧，以便冒烟验证桥实际发出的内容，而不仅仅是特定客户端 SDK 碰巧暴露的内容。

手动 ACP 自然语言线程冒烟（不是 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归/调试工作流。对于 ACP 线程路由验证可能再次需要它，所以不要删除它。

有用的 env vars：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile` 并在运行测试前获取
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 仅验证从 `OPENCLAW_PROFILE_FILE` 获取的 env vars，使用临时配置/workspace 目录且不进行外部 CLI auth 挂载
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global` 用于 Docker 内的缓存 CLI 安装
- `$HOME` 下的外部 CLI auth 目录/文件只读挂载到 `/host-auth...`，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩窄的 provider 运行仅挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断需要的目录/文件
  - 使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或逗号列表如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 在容器内过滤 providers
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 为不需要重建的重新运行重用现有的 `openclaw:local-live` 镜像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 确保凭据来自 profile 存储（不是 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 选择 gateway 为 Open WebUI 冒烟暴露的 model
- `OPENCLAW_OPENWEBUI_PROMPT=...` 覆盖 Open WebUI 冒烟使用的 nonce 检查 prompt
- `OPENWEBUI_IMAGE=...` 覆盖固定的 Open WebUI 镜像标签

## 文档健全性检查

在编辑文档后运行文档检查：`pnpm check:docs`。
当你还需要页面内标题检查时，运行完整的 Mintlify 锚点验证：`pnpm docs:check-links:anchors`。

## 离线回归（CI 安全）

这些是没有真实 providers 的"真实管道"回归测试：

- Gateway 工具调用（mock OpenAI，真实 gateway + agent 循环）：`src/gateway/gateway.test.ts`（案例："通过 gateway agent 循环端到端运行 mock OpenAI 工具调用"）
- Gateway 向导（WS `wizard.start`/`wizard.next`，写入配置 + auth 强制）：`src/gateway/gateway.test.ts`（案例："通过 ws 运行向导并写入 auth token 配置"）

## Agent 可靠性评估（skills）

我们已经有一些行为类似于"agent 可靠性评估"的 CI 安全测试：

- 通过真实 gateway + agent 循环的 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证 session 连线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

Skills 仍然缺少什么（参见 [Skills](/tools/skills)）：

- **决策：** 当 skills 在 prompt 中列出时，agent 是否选择了正确的 skill（或避免不相关的 skill）？
- **合规性：** agent 是否在使用前读取 `SKILL.md` 并遵循必需的步骤/参数？
- **工作流契约：** 断言工具顺序、session 历史携带和沙盒边界的多轮场景。

未来的评估应首先保持确定性：

- 使用 mock providers 的场景运行器，以断言工具调用 + 顺序、skill 文件读取和 session 连线。
- 一小套以 skill 为重点的场景（使用 vs 避免、门控、prompt injection）。
- 可选的实时评估（选择性加入，env 门控），仅在 CI 安全套件就位后。

## 契约测试（plugin 和 channel 形态）

契约测试验证每个已注册的 plugin 和 channel 是否符合其接口契约。它们遍历所有发现的 plugin 并运行一套形态和行为断言。默认 `pnpm test` 单元通道故意跳过这些共享接缝和冒烟文件；在你触及共享 channel 或 provider 接口时显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅 channel 契约：`pnpm test:contracts:channels`
- 仅 provider 契约：`pnpm test:contracts:plugins`

### Channel 契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本 plugin 形态（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - Session 绑定行为
- **outbound-payload** - 消息载荷结构
- **inbound** - 入站消息处理
- **actions** - Channel 动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/名册 API
- **group-policy** - 群组策略执行

### Provider 状态契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **status** - Channel 状态探测
- **registry** - Plugin 注册表形态

### Provider 契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - Auth 流契约
- **auth-choice** - Auth 选择/选项
- **catalog** - 模型目录 API
- **discovery** - Plugin 发现
- **loader** - Plugin 加载
- **runtime** - Provider 运行时
- **shape** - Plugin 形态/接口
- **wizard** - 设置向导

### 何时运行

- 更改 plugin-sdk 导出或子路径后
- 添加或修改 channel 或 provider plugin 后
- 重构 plugin 注册或发现后

契约测试在 CI 中运行，不需要真实的 API key。

## 添加回归测试（指导）

当你修复在实时测试中发现的 provider/model 问题时：

- 如果可能，添加 CI 安全回归测试（mock/stub provider，或捕获确切的请求形状转换）
- 如果它本质上是仅实时的（速率限制、auth 策略），保持实时测试缩窄并通过 env vars 选择性加入
- 优先针对能捕获错误的最小层：
  - provider 请求转换/重播错误 → 直接 models 测试
  - gateway session/历史/工具管道错误 → gateway 实时冒烟或 CI 安全 gateway mock 测试
- SecretRef 遍历护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 从注册表元数据（`listSecretTargetRegistryEntries()`）为每个 SecretRef 类派生一个采样目标，然后断言遍历段 exec ids 被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加新的 `includeInPlan` SecretRef 目标系列，更新该测试中的 `classifyTargetClass`。测试在未分类目标 ids 上故意失败，这样新类就不能被静默跳过。
