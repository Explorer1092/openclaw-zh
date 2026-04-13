---
mmh3_hash: "c37d54e101f3bc0e046986f436f9cbb2"
summary: "qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化形态"
read_when:
  - 扩展 qa-lab 或 qa-channel
  - 添加仓库支持的 QA 场景
  - 围绕 Gateway 仪表板构建更高真实感的 QA 自动化
title: "QA E2E Automation"
---

# QA E2E Automation

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

要运行传输真实的 Matrix 冒烟通道，执行：

```bash
pnpm openclaw qa matrix
```

该通道在 Docker 中配置一个一次性 Tuwunel homeserver，注册临时驱动器、SUT 和观察者用户，创建一个私有房间，然后在 QA gateway 子进程中运行真实的 Matrix plugin。实时传输通道将子进程配置限定为被测传输，因此 Matrix 运行时子进程配置中不包含 `qa-channel`。

要运行传输真实的 Telegram 冒烟通道，执行：

```bash
pnpm openclaw qa telegram
```

该通道目标是一个真实的私有 Telegram 群组，而不是配置一次性服务器。它需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，以及同一私有群组中的两个不同 bot。SUT bot 必须有 Telegram 用户名，当两个 bot 都在 `@BotFather` 中启用了 Bot-to-Bot 通信模式时，bot 之间的观察效果最佳。

实时传输通道现在共享一个较小的合约，而不是各自定义自己的场景列表形态：

`qa-channel` 仍然是广泛的合成产品行为套件，不是实时传输覆盖矩阵的一部分。

| 通道     | 金丝雀 | 提及门控 | 允许列表阻止 | 顶级回复 | 重启恢复 | 线程跟进 | 线程隔离 | 反应观察 | Help 命令 |
| -------- | ------ | -------- | ------------ | -------- | -------- | -------- | -------- | -------- | --------- |
| Matrix   | x      | x        | x            | x        | x        | x        | x        | x        |           |
| Telegram | x      |          |              |          |          |          |          |          | x         |

这使 `qa-channel` 保持为广泛的产品行为套件，而 Matrix、Telegram 和未来的实时传输共享一个明确的传输合约检查清单。

要运行不将 Docker 引入 QA 路径的一次性 Linux VM 通道，执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这将启动一个全新的 Multipass 客户机，安装依赖项，在客户机内构建 OpenClaw，运行 `qa suite`，然后将正常的 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...`。
它复用与主机上 `qa suite` 相同的场景选择行为。
主机和 Multipass 套件运行默认情况下以孤立的 gateway worker 并行执行多个选定场景，最多 64 个 worker 或选定的场景数量。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 进行串行执行。
实时运行转发对客户机实用的受支持 QA auth 输入：基于 env 的 provider keys、QA 实时 provider 配置路径，以及存在时的 `CODEX_HOME`。将 `--output-dir` 保持在 repo 根目录下，以便客户机可以通过挂载的工作区回写。

## 仓库支持的种子

种子资产位于 `qa/` 目录下：

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

这些文件有意放入 Git，使 QA 计划对人类和 Agent 都可见。

`qa-lab` 应保持为通用的 Markdown 运行器。每个场景 Markdown 文件是一次测试运行的真实来源，应定义：

- 场景元数据
- 文档和代码引用
- 可选的 plugin 要求
- 可选的 gateway 配置补丁
- 可执行的 `qa-flow`

支持 `qa-flow` 的可复用运行时接口允许保持通用和跨切。例如，Markdown 场景可以将传输端助手与浏览器端助手结合，通过 Gateway `browser.request` 接缝驱动嵌入的控制 UI，而无需添加特殊的运行器。

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

## 传输适配器

`qa-lab` 为 Markdown QA 场景拥有通用的传输接缝。
`qa-channel` 是该接缝上的第一个适配器，但设计目标更广泛：
未来的真实或合成 channels 应该插入同一个套件运行器，
而不是添加特定于传输的 QA 运行器。

在架构层面，分工如下：

- `qa-lab` 拥有通用场景执行、worker 并发、工件写入和报告。
- 传输适配器拥有 gateway 配置、就绪状态、入站和出站观察、传输操作以及规范化的传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时接口。

面向维护者的新 channel 适配器采用指南位于 [Testing](/help/testing#adding-a-channel-to-qa)。

## 报告

`qa-lab` 从观察到的总线时间线导出 Markdown 协议报告。报告应回答：

- 什么成功了
- 什么失败了
- 什么仍被阻塞
- 值得添加哪些后续场景

要进行角色和风格检查，在多个实时 model refs 上运行相同的场景，并编写评判 Markdown 报告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

该命令运行本地 QA gateway 子进程，而非 Docker。角色评估场景应通过 `SOUL.md` 设置人物角色，然后运行普通的用户回合，如聊天、workspace 帮助和小文件任务。候选 model 不应被告知正在接受评估。该命令保留每个完整对话记录、记录基本运行统计信息，然后以 `xhigh` reasoning 快速模式请求评判 model 按自然度、氛围和幽默感对运行进行排名。
使用 `--blind-judge-models` 比较 provider 时：评判提示仍然获得每个对话记录和运行状态，但候选 refs 被替换为中性标签（如 `candidate-01`）；报告在解析后将排名映射回真实 refs。
候选运行默认为 `high` thinking，支持它的 OpenAI models 使用 `xhigh`。使用 `--model provider/model,thinking=<level>` 内联覆盖特定候选。`--thinking <level>` 仍设置全局回退，旧版 `--model-thinking <provider/model=level>` 形式保留以兼容。
OpenAI 候选 refs 默认为快速模式，以便在 provider 支持时使用优先处理。当单个候选或评判需要覆盖时，内联添加 `,fast`、`,no-fast` 或 `,fast=false`。仅当你想对所有候选 model 强制开启快速模式时才传递 `--fast`。候选和评判持续时间记录在报告中用于基准分析，但评判提示明确说明不按速度排名。
候选和评判 model 运行都默认并发 16。当 provider 限制或本地 gateway 压力使运行过于嘈杂时，降低 `--concurrency` 或 `--judge-concurrency`。
未传递候选 `--model` 时，角色评估默认为 `openai/gpt-5.4`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。
未传递 `--judge-model` 时，评判默认为 `openai/gpt-5.4,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [Testing](/help/testing)
- [QA Channel](/channels/qa-channel)
- [Dashboard](/web/dashboard)
