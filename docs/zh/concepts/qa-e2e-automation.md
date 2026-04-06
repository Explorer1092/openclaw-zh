---
mmh3_hash: "3e94dfa3d43caf89cf979fdf8ecbf03c"
summary: "qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化形态"
read_when:
  - 扩展 qa-lab 或 qa-channel
  - 添加仓库支持的 QA 场景
  - 围绕 Gateway 仪表板构建更高真实感的 QA 自动化
title: "QA E2E 自动化"
---

# QA E2E 自动化

私有 QA 栈旨在以比单个单元测试更真实、更接近 Channel 形态的方式演练 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息 Channel，包含私信、Channel、线程、反应、编辑和删除等操作面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察对话记录、注入入站消息以及导出 Markdown 报告。
- `qa/`：仓库支持的启动任务和基准 QA 场景种子资产。

长期目标是一个双面板 QA 站点：

- 左侧：带有 Agent 的 Gateway 仪表板（控制 UI）。
- 右侧：QA Lab，显示类 Slack 的对话记录和场景计划。

这样操作员或自动化循环可以给 Agent 分配 QA 任务，观察真实的 Channel 行为，并记录什么成功、什么失败或什么仍被阻塞。

## 仓库支持的种子

种子资产位于 `qa/` 目录下：

- `qa/QA_KICKOFF_TASK.md`
- `qa/seed-scenarios.json`

这些文件有意放入 Git，使 QA 计划对人类和 Agent 都可见。基准列表应足够广泛，涵盖：

- 私信和 Channel 聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 内存召回
- 模型切换
- 子 Agent 交接
- 仓库读取和文档读取
- 一个小型构建任务，例如 Lobster Invaders

## 报告

`qa-lab` 从观察到的总线时间线导出 Markdown 协议报告。报告应回答：

- 什么成功了
- 什么失败了
- 什么仍被阻塞
- 值得添加哪些后续场景

## 相关文档

- [测试](/help/testing)
- [QA Channel](/channels/qa-channel)
- [仪表板](/web/dashboard)
