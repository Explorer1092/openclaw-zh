---
mmh3_hash: "220ace720d40c10df44e871b1051e39d"
title: "工具循环检测"
description: "配置可选的防护机制，防止重复性或停滞的工具调用循环"
summary: "如何启用和调整检测重复工具调用循环的防护机制"
read_when:
  - 用户反映 Agent 陷入重复工具调用的僵局
  - 需要调整重复调用保护参数
  - 正在编辑 Agent 工具/运行时策略
---

# 工具循环检测

OpenClaw 可防止 Agent 陷入重复的工具调用模式。
该防护默认**禁用**。

仅在需要时启用，因为严格设置可能会阻止合法的重复调用。

## 为何需要此功能

- 检测未取得进展的重复序列。
- 检测高频无结果循环（相同工具、相同输入、反复报错）。
- 检测已知轮询工具的特定重复调用模式。

## 配置块

全局默认值：

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

每个 Agent 的覆盖配置（可选）：

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### 字段说明

- `enabled`：总开关。`false` 表示不执行任何循环检测。
- `historySize`：用于分析的近期工具调用保留数量。
- `warningThreshold`：将模式归类为仅警告的阈值。
- `criticalThreshold`：阻断重复循环模式的阈值。
- `globalCircuitBreakerThreshold`：全局无进展断路器阈值。
- `detectors.genericRepeat`：检测相同工具 + 相同参数的重复模式。
- `detectors.knownPollNoProgress`：检测已知的无状态变化的轮询类模式。
- `detectors.pingPong`：检测交替乒乓模式。

## 推荐设置

- 从 `enabled: true`、默认值不变开始。
- 保持阈值有序：`warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`。
- 如果出现误报：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`
  - （可选）提高 `globalCircuitBreakerThreshold`
  - 仅禁用导致问题的检测器
  - 降低 `historySize` 以减少历史上下文的严格程度

## 日志与预期行为

检测到循环时，OpenClaw 会报告循环事件，并根据严重程度阻断或抑制下一个工具周期。
这可保护用户免受失控的 token 消耗和死锁影响，同时保持正常的工具访问。

- 优先发出警告并临时抑制。
- 仅在反复出现证据时才升级处理。

## 说明

- `tools.loopDetection` 与 Agent 级别的覆盖配置合并。
- 每个 Agent 的配置完全覆盖或扩展全局值。
- 如果不存在配置，防护将保持关闭状态。
