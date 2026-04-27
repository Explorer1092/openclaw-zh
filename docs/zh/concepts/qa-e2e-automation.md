---
mmh3_hash: "c3e4acc06841dc2d09646edde6194897"
summary: "qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化形态"
read_when:
  - 扩展 qa-lab 或 qa-channel
  - 添加仓库支持的 QA 场景
  - 围绕 Gateway 仪表板构建更高真实感的 QA 自动化
title: "QA E2E automation"
---

私有 QA 栈旨在以比单个单元测试更真实、更接近 Channel 形态的方式演练 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息 Channel，包含私信、Channel、线程、反应、编辑和删除等操作面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察对话记录、注入入站消息以及导出 Markdown 报告。
- `qa/`：仓库支持的启动任务和基准 QA 场景种子资产。

当前的 QA 操作员流程是一个双面板 QA 站点：

- 左侧：带有 Agent 的 Gateway 仪表板（控制 UI）。
- 右侧：QA Lab，显示类 Slack 的对话记录和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

这将构建 QA 站点、启动 Docker 支持的 gateway 通道，并展示 QA Lab 页面，操作员或自动化循环可以在此给 Agent 分配 QA 任务，观察真实的 Channel 行为，并记录什么成功、什么失败或什么仍被阻塞。

如需在不每次重建 Docker 镜像的情况下更快地迭代 QA Lab UI，可使用绑定挂载的 QA Lab bundle 启动堆栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 将 Docker 服务保持在预构建的镜像上，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 在更改时重新构建该 bundle，浏览器会在 QA Lab 资产哈希变化时自动重新加载。

如需本地 OpenTelemetry 追踪冒烟测试，运行：

```bash
pnpm qa:otel:smoke
```

该脚本启动本地 OTLP/HTTP 追踪接收器，使用启用了 `diagnostics-otel` plugin 的 `otel-trace-smoke` QA 场景运行，然后解码导出的 protobuf spans 并断言发布关键形态：`openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery` 必须存在；成功回合中 model calls 不能导出 `StreamAbandoned`；原始诊断 IDs 和 `openclaw.content.*` 属性必须不出现在追踪中。它将 `otel-smoke-summary.json` 写入 QA 套件工件旁边。

可观察性 QA 仅限源代码检出。npm tarball 有意省略 QA Lab，因此包 Docker 发布通道不运行 `qa` 命令。在更改诊断仪器时，从构建的源代码检出运行 `pnpm qa:otel:smoke`。

要运行传输真实的 Matrix 冒烟通道，运行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

该通道在 Docker 中配置一个一次性 Tuwunel homeserver，注册临时驱动器、SUT 和观察者用户，创建一个私有房间，然后在 QA gateway 子进程中运行真实的 Matrix plugin。实时传输通道将子进程配置限定为被测传输，因此 Matrix 运行时子进程配置中不包含 `qa-channel`。它将结构化报告工件和合并的 stdout/stderr 日志写入所选的 Matrix QA 输出目录。要同时捕获外层 `scripts/run-node.mjs` 构建/启动器输出，将 `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` 设置为仓库本地日志文件。
Matrix 进度默认打印。CLI 默认 profile 是 `all`，因此普通 `pnpm openclaw qa matrix` 仍然运行完整目录。使用 `--profile fast` 运行发布关键传输合约，或使用 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 分片完整覆盖。`--fail-fast` 在第一个失败场景后停止，当你想要发布门控而不是完整清单时使用。`OPENCLAW_QA_MATRIX_TIMEOUT_MS` 限制完整运行，`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` 可以缩短 CI 的无回复静默窗口，`OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 限制清理以便卡住的 Docker 拆卸报告确切的恢复命令，而不是挂起。

要运行传输真实的 Telegram 冒烟通道，执行：

```bash
pnpm openclaw qa telegram
```

该通道目标是一个真实的私有 Telegram 群组，而不是配置一次性服务器。它需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，以及同一私有群组中的两个不同 bot。SUT bot 必须有 Telegram 用户名，当两个 bot 都在 `@BotFather` 中启用了 Bot-to-Bot 通信模式时，bot 之间的观察效果最佳。
命令在任何场景失败时以非零状态退出。当你希望获取工件而不触发失败退出码时，使用 `--allow-failures`。
Telegram 报告和摘要包含从驱动消息发送请求到观察到的 SUT 回复的每个回复 RTT，从金丝雀开始。

在使用池化实时凭据之前，运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 检查 Convex broker env，验证端点设置，并在存在维护者 secret 时验证 admin/list 可达性。它仅报告 secret 的设置/缺失状态。

要运行传输真实的 Discord 冒烟通道，运行：

```bash
pnpm openclaw qa discord
```

该通道目标是一个真实的私有 Discord guild channel，有两个 bots：一个由测试工具控制的驱动 bot 和一个由子 OpenClaw gateway 通过捆绑的 Discord plugin 启动的 SUT bot。使用 env 凭据时它需要 `OPENCLAW_QA_DISCORD_GUILD_ID`、`OPENCLAW_QA_DISCORD_CHANNEL_ID`、`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN` 和 `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`。
该通道验证 channel mention 处理，并检查 SUT bot 是否已向 Discord 注册了原生 `/help` 命令。
命令在任何场景失败时以非零状态退出。当你希望获取工件而不触发失败退出码时，使用 `--allow-failures`。

实时传输通道现在共享一个较小的合约，而不是各自定义自己的场景列表形态：

`qa-channel` 仍然是广泛的合成产品行为套件，不是实时传输覆盖矩阵的一部分。

| 通道     | 金丝雀 | 提及门控 | 允许列表阻止 | 顶级回复 | 重启恢复 | 线程跟进 | 线程隔离 | 反应观察 | Help 命令 | 原生命令注册 |
| -------- | ------ | -------- | ------------ | -------- | -------- | -------- | -------- | -------- | --------- | ------------ |
| Matrix   | x      | x        | x            | x        | x        | x        | x        | x        |           |              |
| Telegram | x      | x        |              |          |          |          |          |          | x         |              |
| Discord  | x      | x        |              |          |          |          |          |          |           | x            |

这使 `qa-channel` 保持为广泛的产品行为套件，而 Matrix、Telegram 和未来的实时传输共享一个明确的传输合约检查清单。

要运行不将 Docker 引入 QA 路径的一次性 Linux VM 通道，执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这将启动一个全新的 Multipass 客户机，安装依赖项，在客户机内构建 OpenClaw，运行 `qa suite`，然后将正常的 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...`。
它复用与主机上 `qa suite` 相同的场景选择行为。
主机和 Multipass 套件运行默认情况下以隔离的 gateway worker 并行执行多个选定场景。`qa-channel` 默认并发数为 4，上限为选定的场景数量。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 进行串行执行。
命令在任何场景失败时以非零状态退出。当您希望获取工件而不触发失败退出码时，使用 `--allow-failures`。
实时运行转发对客户机实用的受支持 QA auth 输入：基于 env 的 provider keys、QA 实时 provider 配置路径，以及存在时的 `CODEX_HOME`。将 `--output-dir` 保持在 repo 根目录下，以便客户机可以通过挂载的工作区回写。

## 仓库支持的种子

种子资产位于 `qa/` 目录下：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些文件有意放入 Git，使 QA 计划对人类和 Agent 都可见。

`qa-lab` 应保持为通用的 Markdown 运行器。每个场景 Markdown 文件是一次测试运行的真实来源，应定义：

- 场景元数据
- 可选的类别、能力、通道和风险元数据
- 文档和代码引用
- 可选的 plugin 要求
- 可选的 gateway 配置补丁
- 可执行的 `qa-flow`

支持 `qa-flow` 的可复用运行时接口允许保持通用和跨切。例如，Markdown 场景可以将传输端助手与浏览器端助手结合，通过 Gateway `browser.request` 接缝驱动嵌入的控制 UI，而无需添加特殊的运行器。

场景文件应按产品能力而不是源代码树文件夹分组。文件移动时保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 进行实现可追溯性。

基准列表应足够广泛，涵盖：

- 私信和 Channel 聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 内存召回
- 模型切换
- 子 Agent 交接
- 仓库读取和文档读取
- 一个小型构建任务，例如 Lobster Invaders

## Provider 模拟通道

`qa suite` 有两个本地 provider 模拟通道：

- `mock-openai` 是场景感知的 OpenClaw 模拟。它仍然是仓库支持的 QA 和平行门控的默认确定性模拟通道。
- `aimock` 启动 AIMock 支持的 provider 服务器，用于实验性协议、固件、录制/重放和混沌覆盖。它是附加的，不替换 `mock-openai` 场景分发器。

Provider 通道实现位于 `extensions/qa-lab/src/providers/` 下。每个 provider 拥有其默认值、本地服务器启动、gateway 模型配置、auth-profile 暂存需求和实时/模拟能力标志。共享的套件和 gateway 代码应通过 provider 注册表路由，而不是按 provider 名称分支。

## 传输适配器

`qa-lab` 为 Markdown QA 场景拥有通用的传输接缝。
`qa-channel` 是该接缝上的第一个适配器，但设计目标更广泛：
未来的真实或合成 channels 应该插入同一个套件运行器，
而不是添加特定于传输的 QA 运行器。

在架构层面，分工如下：

- `qa-lab` 拥有通用场景执行、worker 并发、工件写入和报告。
- 传输适配器拥有 gateway 配置、就绪状态、入站和出站观察、传输操作以及规范化的传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时接口。

面向维护者的新 Channel 适配器采用指南位于 [Testing](/help/testing#adding-a-channel-to-qa)。

## 报告

`qa-lab` 从观察到的总线时间线导出 Markdown 协议报告。报告应回答：

- 什么成功了
- 什么失败了
- 什么仍被阻塞
- 值得添加哪些后续场景

要进行角色和风格检查，在多个实时 model refs 上运行相同的场景，并编写评判 Markdown 报告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

该命令运行本地 QA gateway 子进程，而非 Docker。角色评估场景应通过 `SOUL.md` 设置人物角色，然后运行普通的用户回合，如聊天、workspace 帮助和小文件任务。候选 model 不应被告知正在接受评估。该命令保留每个完整对话记录、记录基本运行统计信息，然后以快速模式和支持时的 `xhigh` reasoning 请求评判 model 按自然度、氛围和幽默感对运行进行排名。
使用 `--blind-judge-models` 比较 provider 时：评判提示仍然获得每个对话记录和运行状态，但候选 refs 被替换为中性标签（如 `candidate-01`）；报告在解析后将排名映射回真实 refs。
候选运行默认为 `high` thinking，GPT-5.5 使用 `medium`，支持它的旧版 OpenAI eval refs 使用 `xhigh`。使用 `--model provider/model,thinking=<level>` 内联覆盖特定候选。`--thinking <level>` 仍设置全局回退，旧版 `--model-thinking <provider/model=level>` 形式保留以兼容。
OpenAI 候选 refs 默认为快速模式，以便在 provider 支持时使用优先处理。当单个候选或评判需要覆盖时，内联添加 `,fast`、`,no-fast` 或 `,fast=false`。仅当你想对所有候选 model 强制开启快速模式时才传递 `--fast`。候选和评判持续时间记录在报告中用于基准分析，但评判提示明确说明不按速度排名。
候选和评判 model 运行都默认并发 16。当 provider 限制或本地 gateway 压力使运行过于嘈杂时，降低 `--concurrency` 或 `--judge-concurrency`。
未传递候选 `--model` 时，角色评估默认为 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。
未传递 `--judge-model` 时，评判默认为 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [Testing](/help/testing)
- [QA Channel](/channels/qa-channel)
- [Dashboard](/web/dashboard)
