---
mmh3_hash: "81d70b616dea43adf43636fd01ba2b9a"
title: "实验性功能"
summary: "OpenClaw 中实验性标志的含义以及当前已记录的功能"
read_when:
  - 您看到 `.experimental` 配置键并想知道它是否稳定
  - 您想尝试预览运行时功能，而不将其与正常默认值混淆
  - 您想在一处找到当前已记录的实验性标志
---

# 实验性功能

OpenClaw 中的实验性功能是**可选的预览界面**。它们位于显式标志之后，因为它们在值得获得稳定默认值或长期公共合约之前，仍需要真实世界的使用验证。

与正常配置区别对待它们：

- 默认保持**关闭**，除非相关文档告诉您尝试某个功能。
- 预期**形状和行为**比稳定配置变化更快。
- 当稳定路径已存在时，优先使用稳定路径。
- 如果您要广泛推广 OpenClaw，请在将实验性标志纳入共享基线之前，先在较小的环境中测试它们。

## 当前已记录的标志

| 界面                 | 键                                                        | 适用场景                                                                                           | 更多信息                                                                                      |
| -------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本地模型运行时       | `agents.defaults.experimental.localModelLean`             | 较小或更严格的本地后端在 OpenClaw 的完整默认工具接口上运行异常                                     | [本地模型](/gateway/local-models)                                                             |
| Memory 搜索          | `agents.defaults.memorySearch.experimental.sessionMemory` | 您希望 `memory_search` 索引之前的 Session 记录，并接受额外的存储/索引成本                          | [Memory 配置参考](/reference/memory-config#session-memory-search-experimental)                |
| 结构化规划工具       | `tools.experimental.planTool`                             | 您希望在兼容的运行时和 UI 中为多步骤工作跟踪公开结构化的 `update_plan` 工具                        | [Gateway 配置参考](/gateway/configuration-reference#toolsexperimental)                        |

## 本地模型精简模式

`agents.defaults.experimental.localModelLean: true` 是较弱本地模型设置的压力释放阀。它裁剪了 `browser`、`cron` 和 `message` 等重量级默认工具，使提示形状更小，对于小上下文或更严格的 OpenAI 兼容后端不那么脆弱。

这有意**不是**正常路径。如果您的后端可以干净地处理完整运行时，请保持此选项关闭。

## 实验性不等于隐藏

如果一个功能是实验性的，OpenClaw 应在文档和配置路径本身中明确说明。它**不应该**做的是将预览行为塞入看起来稳定的默认旋钮中，然后假装这是正常的。这就是配置界面变得混乱的方式。
