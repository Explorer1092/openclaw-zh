---
mmh3_hash: "1135ef59bc5a2e4fd18d80eddaf6afb9"
summary: "OpenClaw 中实验性标志的含义，以及当前已记录的标志"
title: "实验性功能"
read_when:
  - 您看到 `.experimental` 配置键，想了解它是否稳定
  - 您想在不与正常默认值混淆的情况下尝试预览运行时功能
  - 您想在一个地方找到当前已记录的实验性标志
---

OpenClaw 中的实验性功能是**可选的预览界面**。它们位于显式标志之后，因为它们在获得稳定的默认值或长期公共契约之前仍需要真实世界的使用验证。

请区别对待它们与正常配置：

- 除非相关文档告诉您尝试，否则默认保持**关闭**。
- 预期其**形状和行为**比稳定配置变化更快。
- 当稳定路径已存在时，优先使用稳定路径。
- 如果您正在广泛推广 OpenClaw，请在将实验性标志纳入共享基线之前先在较小的环境中进行测试。

## 当前已记录的标志

| 界面 | 键 | 使用时机 | 更多信息 |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本地模型运行时 | `agents.defaults.experimental.localModelLean` | 较小或更严格的本地后端无法处理 OpenClaw 的完整默认工具界面 | [本地模型](/gateway/local-models) |
| 内存搜索 | `agents.defaults.memorySearch.experimental.sessionMemory` | 您希望 `memory_search` 索引先前的 Session 记录并接受额外的存储/索引成本 | [内存配置参考](/reference/memory-config#session-memory-search-experimental) |
| 结构化规划工具 | `tools.experimental.planTool` | 您希望为兼容运行时和 UI 中的多步骤工作跟踪公开结构化 `update_plan` 工具 | [Gateway 配置参考](/gateway/config-tools#toolsexperimental) |

## 本地模型精简模式

`agents.defaults.experimental.localModelLean: true` 是针对较弱本地模型设置的压力释放阀。启用后，OpenClaw 会从 Agent 的工具界面中移除三个默认工具——`browser`、`cron` 和 `message`——用于每次轮次。其他设置不变。

### 为什么是这三个工具

这三个工具在默认 OpenClaw 运行时中具有最大的描述和最多的参数形状。对于小上下文或更严格的 OpenAI 兼容后端，差异在于：

- 工具架构是否能整洁地适配提示词，还是会挤占对话历史。
- 模型是否能选择正确的工具，还是因为太多相似的架构而发出格式错误的工具调用。
- Chat Completions 适配器是否能在服务器的结构化输出限制内，还是因工具调用负载大小触发 400 错误。

移除它们不会静默地重新连接 OpenClaw——只是让工具列表更短。模型仍然可以使用 `read`、`write`、`edit`、`exec`、`apply_patch`、网络搜索/获取（当已配置时）、内存以及 Session/Agent 工具。

### 何时开启

当您已验证模型能够与 Gateway 通信，但完整 Agent 轮次行为异常时，启用精简模式。典型的信号链：

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` 成功。
2. 普通 Agent 轮次因格式错误的工具调用、过大的提示词或模型忽略其工具而失败。
3. 切换 `localModelLean: true` 解决了问题。

### 何时保持关闭

如果您的后端能整洁地处理完整的默认运行时，请保持关闭。精简模式是一种变通办法，而非默认值。它之所以存在，是因为某些本地堆栈需要更小的工具界面才能正常工作；托管模型和资源充足的本地机器不需要它。

精简模式也不能替代 `tools.profile`、`tools.allow`/`tools.deny` 或模型 `compat.supportsTools: false` 逃生舱。如果您需要为特定 Agent 永久缩小工具界面，请优先使用这些稳定的配置旋钮，而非实验性标志。

### 启用

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

更改标志后重启 Gateway，然后用以下命令确认已修剪的工具列表：

```bash
openclaw status --deep
```

深度状态输出列出了活跃的 Agent 工具；当精简模式开启时，`browser`、`cron` 和 `message` 应不在其中。

## 实验性不意味着隐藏

如果一个功能是实验性的，OpenClaw 应该在文档和配置路径本身中明确说明。它**不应该**做的是将预览行为偷偷塞入看起来稳定的默认配置键，并假装这是正常的。这就是配置界面变得混乱的原因。

## 相关

- [功能](/concepts/features)
- [发布渠道](/install/development-channels)
