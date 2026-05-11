---
mmh3_hash: "cac42084346b0e40fdd96c78bb1f671f"
summary: "Docker 支持的 Matrix 实时 QA 通道维护者参考：CLI、配置文件、环境变量、场景和输出产物。"
read_when:
  - 在本地运行 pnpm openclaw qa matrix
  - 添加或选择 Matrix QA 场景
  - 排查 Matrix QA 失败、超时或清理卡死问题
title: "Matrix QA"
---

Matrix QA 通道将捆绑的 `@openclaw/matrix` 插件运行在 Docker 中的一次性 Tuwunel 主服务器上，配合临时的 driver、SUT 和 observer 账户以及预置房间。它是 Matrix 的实时传输真实覆盖测试。

这是仅供维护者使用的工具。打包的 OpenClaw 发布版本有意省略了 `qa-lab`，因此 `openclaw qa` 仅在源代码检出中可用。源代码检出直接加载捆绑的运行器，无需插件安装步骤。

有关更广泛的 QA 框架背景，请参见 [QA 概述](/concepts/qa-e2e-automation)。

## 快速开始

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

直接运行 `pnpm openclaw qa matrix` 会使用 `--profile all`，且不会在第一次失败时停止。对于发布门控使用 `--profile fast --fail-fast`；在并行运行完整目录时，使用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` 分片目录。

## 该通道的功能

1. 在 Docker 中提供一次性 Tuwunel 主服务器（默认镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`，服务器名 `matrix-qa.test`，端口 `28008`）。
2. 注册三个临时用户：`driver`（发送入站流量）、`sut`（被测 OpenClaw Matrix 账户）、`observer`（第三方流量捕获）。
3. 预置所选场景所需的房间（main、threading、media、restart、secondary、allowlist、E2EE、verification DM 等）。
4. 使用真实 Matrix 插件（限定到 SUT 账户）启动子 OpenClaw Gateway；子 Gateway 中不加载 `qa-channel`。
5. 按顺序运行场景，通过 driver/observer Matrix 客户端观察事件。
6. 拆除主服务器，写入报告和摘要产物，然后退出。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 常用参数

| 参数                  | 默认值                                        | 说明                                                                                                            |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | 场景配置文件。参见[配置文件](#配置文件)。                                                                       |
| `--fail-fast`         | 关闭                                          | 在第一个失败的检查或场景后停止。                                                                                |
| `--scenario <id>`     | -                                             | 只运行该场景。可重复使用。参见[场景](#场景)。                                                                   |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 写入报告、摘要、观察到的事件和输出日志的目录。相对路径相对于 `--repo-root` 解析。                               |
| `--repo-root <path>`  | `process.cwd()`                               | 从中性工作目录调用时的仓库根路径。                                                                              |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 配置中的 Matrix 账户 ID。                                                                            |

### Provider 参数

该通道使用真实 Matrix 传输，但模型 Provider 可配置：

| 参数                     | 默认值           | 说明                                                                                                                               |
| ------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` 用于确定性模拟调度，`live-frontier` 用于实时前沿 Provider。旧版别名 `live-openai` 仍然有效。                         |
| `--model <ref>`          | Provider 默认值  | 主 `provider/model` 引用。                                                                                                         |
| `--alt-model <ref>`      | Provider 默认值  | 场景中途切换时使用的备用 `provider/model` 引用。                                                                                   |
| `--fast`                 | 关闭             | 在支持的地方启用 Provider 快速模式。                                                                                               |

Matrix QA 不接受 `--credential-source` 或 `--credential-role`。该通道在本地提供一次性用户；没有可供租用的共享凭据池。

## 配置文件

所选配置文件决定运行哪些场景。

| 配置文件          | 适用场景                                                                                                                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`（默认）     | 完整目录。慢但详尽。                                                                                                                                                                                                              |
| `fast`            | 覆盖实时传输契约的发布门控子集：canary、mention 门控、allowlist 阻止、回复形状、重启恢复、线程跟进、线程隔离、反应观察和执行审批元数据传递。                                                                                    |
| `transport`       | 传输级别的线程、DM、房间、自动加入、mention/allowlist、审批和反应场景。                                                                                                                                                          |
| `media`           | 图片、音频、视频、PDF、EPUB 附件覆盖。                                                                                                                                                                                            |
| `e2ee-smoke`      | 最小 E2EE 覆盖：基本加密回复、线程跟进、引导成功。                                                                                                                                                                                |
| `e2ee-deep`       | 详尽的 E2EE 状态丢失、备份、密钥和恢复场景。                                                                                                                                                                                      |
| `e2ee-cli`        | 通过 QA 工具驱动的 `openclaw matrix encryption setup` 和 `verify *` CLI 场景。                                                                                                                                                    |

精确映射在 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` 中。

## 场景

完整场景 ID 列表是 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` 中的 `MatrixQaScenarioId` 联合类型。类别包括：

- 线程：`matrix-thread-*`、`matrix-subagent-thread-spawn`
- 顶层 / DM / 房间：`matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- 流式传输和工具进度：`matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- 媒体：`matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- 路由：`matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- 反应：`matrix-reaction-*`
- 审批：`matrix-approval-*`（执行/插件元数据、分块回退、拒绝反应、线程和 `target: "both"` 路由）
- 重启和重播：`matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- mention 门控、bot 对 bot 和 allowlist：`matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE：`matrix-e2ee-*`（基本回复、线程跟进、引导、恢复密钥生命周期、状态丢失变体、服务器备份行为、设备卫生、SAS / QR / DM 验证、重启、产物编辑）
- E2EE CLI：`matrix-e2ee-cli-*`（加密设置、幂等设置、引导失败、恢复密钥生命周期、多账户、Gateway 回复往返、自我验证）

传入 `--scenario <id>`（可重复）运行手动选取的场景集；与 `--profile all` 组合可忽略配置文件门控。

## 环境变量

| 变量                                    | 默认值                                    | 作用                                                                                                                                                                             |
| --------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000`（30 分钟）                      | 整个运行的硬性上限。                                                                                                                                                             |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 初始 canary 回复的上限。发布 CI 在共享 runner 上提高此值，以防慢速的第一个 Gateway 轮次在场景覆盖开始前失败。                                                                    |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 负面无回复断言的静默窗口。限制为 `≤` 运行超时。                                                                                                                                  |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 拆除的上限。失败界面包括打印的恢复命令（`docker compose ... down --remove-orphans` 调用）。                                                                               |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 针对不同 Tuwunel 版本进行验证时覆盖主服务器镜像。                                                                                                                                |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | 开启                                      | `0` 在 stderr 上静默 `[matrix-qa] ...` 进度行。`1` 强制开启。                                                                                                                    |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 已编辑                                    | `1` 在 `matrix-qa-observed-events.json` 中保留消息正文和 `formatted_body`。默认编辑以保持 CI 产物安全。                                                                          |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | 关闭                                      | `1` 跳过产物写入后的确定性 `process.exit`。默认强制退出，因为 matrix-js-sdk 的原生加密句柄可能在产物完成后保持事件循环存活。                                                      |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未设置                                    | 由外部启动器（如 `scripts/run-node.mjs`）设置时，Matrix QA 重用该日志路径，而不是启动自己的 tee。                                                                                |

## 输出产物

写入 `--output-dir`：

- `matrix-qa-report.md`：Markdown 协议报告（通过、失败、跳过的内容及原因）。
- `matrix-qa-summary.json`：适合 CI 解析和仪表板的结构化摘要。
- `matrix-qa-observed-events.json`：来自 driver 和 observer 客户端的观察 Matrix 事件。除非设置 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`，否则正文将被编辑；审批元数据使用选定的安全字段摘要化，并截断命令预览。
- `matrix-qa-output.log`：运行的组合 stdout/stderr。如果设置了 `OPENCLAW_RUN_NODE_OUTPUT_LOG`，则重用外部启动器的日志。

默认输出目录是 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`，这样连续运行不会相互覆盖。

## 排查技巧

- **运行在接近结束时卡住**：`matrix-js-sdk` 原生加密句柄可能比工具保持更长时间。默认在产物写入后强制执行干净的 `process.exit`；如果您取消设置 `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`，预期进程会停留。
- **清理错误**：查找打印的恢复命令（`docker compose ... down --remove-orphans` 调用）并手动运行以释放主服务器端口。
- **CI 中不稳定的负面断言窗口**：CI 快时降低 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（默认 8 秒）；在慢共享 runner 上提高它。
- **需要已编辑正文用于 Bug 报告**：用 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` 重新运行并附加 `matrix-qa-observed-events.json`。将结果产物视为敏感文件。
- **不同的 Tuwunel 版本**：将 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 指向被测版本。该通道只签入固定的默认镜像。

## 实时传输契约

Matrix 是三个实时传输通道（Matrix、Telegram、Discord）之一，共享 [QA 概述 → 实时传输覆盖](/concepts/qa-e2e-automation#live-transport-coverage) 中定义的单一契约清单。`qa-channel` 仍然是广泛的合成套件，有意不属于该矩阵。

## 相关

- [QA 概述](/concepts/qa-e2e-automation)：整体 QA 栈和实时传输契约
- [QA Channel](/channels/qa-channel)：用于仓库支持场景的合成 Channel 适配器
- [测试](/help/testing)：运行测试和添加 QA 覆盖
- [Matrix](/channels/matrix)：被测 Channel 插件
