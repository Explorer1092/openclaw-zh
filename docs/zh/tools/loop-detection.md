---
mmh3_hash: "aa451ea59b00a56f2c62f05f312bca94"
title: "工具循环检测"
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
      historySize: 20,
      detectorCooldownMs: 12000,
      repeatThreshold: 3,
      criticalThreshold: 6,
      detectors: {
        repeatedFailure: true,
        knownPollLoop: true,
        repeatingNoProgress: true,
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
            repeatThreshold: 2,
            criticalThreshold: 5,
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
- `detectorCooldownMs`：无进展检测器使用的时间窗口。
- `repeatThreshold`：触发警告/阻断的最小重复次数。
- `criticalThreshold`：可触发更严格处理的更高阈值。
- `detectors.repeatedFailure`：检测相同调用路径上的重复失败尝试。
- `detectors.knownPollLoop`：检测已知的轮询类循环。
- `detectors.repeatingNoProgress`：检测无状态变化的高频重复调用。

## 推荐设置

- 从 `enabled: true`、默认值不变开始。
- 如果出现误报：
  - 提高 `repeatThreshold` 和/或 `criticalThreshold`
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
