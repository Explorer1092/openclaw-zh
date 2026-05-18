---
mmh3_hash: "0623ee1d4ca9cf7dd199b89e00602ac6"
summary: "用于隐私保护个人助手工作流检查的本地 qa-channel 场景。"
read_when:
  - 运行本地个人 Agent 可靠性检查时
  - 扩展仓库支持的 QA 场景目录时
  - 验证提醒、回复、记忆、脱敏、安全工具执行跟进和任务状态行为时
title: "Personal agent benchmark pack"
---

Personal Agent Benchmark Pack 是一个小型仓库支持的 QA 场景包，用于本地个人助手工作流。它不是通用模型基准测试，也不需要新的运行器。该包复用 [QA 概述](/concepts/qa-e2e-automation)中描述的私有 QA 堆栈、合成 [QA Channel](/channels/qa-channel) 以及现有的 `qa/scenarios` Markdown 目录。

首个包有意设计得较为简洁：

- 通过本地 Cron 交付的虚假个人提醒
- 通过 `qa-channel` 的虚假 DM 和线程回复路由
- 从临时 QA 工作区记忆文件中召回虚假偏好
- 虚假密钥不回显检查
- 短暂批准式轮次后的安全读取支持工具执行跟进
- 敏感本地读取请求的批准拒绝停止行为
- 将待处理、阻塞和完成分开记录的带证明任务状态报告

## 场景

机器可读的包元数据存放在 `extensions/qa-lab/src/scenario-packs.ts`。使用 `--pack personal-agent` 运行该包：

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` 与重复的 `--scenario` 标志是累加的。显式场景先运行，然后按 `QA_PERSONAL_AGENT_SCENARIO_IDS` 顺序运行包场景，并去除重复项。

该包设计用于配合 `qa-channel` 和 `mock-openai` 或其他本地 QA Provider 通道。不应将其指向实时聊天服务或真实个人账户。

## 隐私模型

场景仅使用虚假用户、虚假偏好、虚假密钥以及套件创建的临时 QA Gateway 工作区。它们不得读取或写入真实的 OpenClaw 用户记忆、Session、凭证、Launch Agent、全局配置或实时 Gateway 状态。

产物保留在现有 QA 套件产物目录下，应被视为测试输出。脱敏检查使用虚假标记，因此失败可以安全地检查和提交为 Issue。

## 扩展包

在 `qa/scenarios/personal/` 下添加新用例，然后将场景 ID 添加到 `QA_PERSONAL_AGENT_SCENARIO_IDS`。保持每个用例小型、本地、在 `mock-openai` 中确定性，并专注于一个个人助手行为。

良好的后续候选：

- 脱敏轨迹导出检查
- 仅本地插件工作流检查

在场景目录拥有足够稳定的用例来证明该界面合理之前，避免添加新的运行器、插件、依赖项、实时传输或模型评判器。
