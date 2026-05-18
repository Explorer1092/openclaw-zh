---
mmh3_hash: "ae71d70592872216d7523a83320b7696"
title: "工具循环检测"
summary: "如何启用和调整检测重复工具调用循环的防护机制"
read_when:
  - 用户反映 Agent 陷入重复工具调用的僵局
  - 需要调整重复调用保护参数
  - 正在编辑 Agent 工具/运行时策略
  - 上下文溢出重试后遇到 `compaction_loop_persisted` 中止
---

OpenClaw 有两个协作的防护机制，用于检测重复工具调用模式：

1. **循环检测**（`tools.loopDetection.enabled`）——默认**禁用**。监视滚动工具调用历史中的重复模式和未知工具重试。
2. **压缩后防护**（`tools.loopDetection.postCompactionGuard`）——默认**启用**，除非 `tools.loopDetection.enabled` 被显式设为 `false`。在每次压缩重试后激活，当 Agent 在窗口内发出相同的 `(工具, 参数, 结果)` 三元组时中止运行。

两者都在同一个 `tools.loopDetection` 块下配置，但压缩后防护只要主开关未显式关闭就会运行。设置 `tools.loopDetection.enabled: false` 可同时关闭两个防护面。

## 为何需要此功能

- 检测未取得进展的重复序列。
- 检测高频无结果循环（相同工具、相同输入、反复报错）。
- 检测已知轮询工具的特定重复调用模式。
- 防止上下文溢出 → 压缩 → 相同循环的周期无限运行。

## 配置块

全局默认值，展示所有记录的字段：

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // 滚动历史检测器的主开关
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // 压缩重试后激活；除非 enabled 显式为 false 否则始终运行
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

| 字段                             | 默认值  | 效果                                                                                                                   |
| -------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false` | 滚动历史检测器的主开关。设置 `false` 同时禁用压缩后防护。                                                             |
| `historySize`                    | `30`    | 用于分析的近期工具调用保留数量。                                                                                       |
| `warningThreshold`               | `10`    | 将模式归类为仅警告的阈值。                                                                                             |
| `criticalThreshold`              | `20`    | 阻断重复循环模式的阈值。                                                                                               |
| `unknownToolThreshold`           | `10`    | 在相同不可用工具被调用此次数后阻断重复调用。                                                                           |
| `globalCircuitBreakerThreshold`  | `30`    | 所有检测器的全局无进展断路器阈值。                                                                                     |
| `detectors.genericRepeat`        | `true`  | 对相同工具 + 相同参数的重复模式发出警告，当相同调用也返回相同结果时阻断。                                              |
| `detectors.knownPollNoProgress`  | `true`  | 检测已知的无状态变化的轮询类模式。                                                                                     |
| `detectors.pingPong`             | `true`  | 检测交替乒乓模式。                                                                                                     |
| `postCompactionGuard.windowSize` | `3`     | 压缩后工具调用窗口大小——防护在此期间保持激活，相同三元组出现此次数后中止运行。                                         |

对于 `exec`，无进展检查比较稳定的命令结果，忽略持续时间、PID、Session ID 和工作目录等易变的运行时元数据。当运行 id 可用时，近期工具调用历史仅在该运行内评估，以防止定时心跳周期和新运行继承早期运行的过期循环计数。

## 推荐设置

- 对于较小的模型，设置 `enabled: true` 并保持阈值为默认值。旗舰模型很少需要滚动历史检测，可以将主开关保持在 `false`，同时仍从压缩后防护中受益。
- 保持阈值有序：`warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`。
- 如果出现误报：
  - 提高 `warningThreshold` 和/或 `criticalThreshold`
  - （可选）提高 `globalCircuitBreakerThreshold`
  - 仅禁用导致问题的检测器（`detectors.<name>: false`）
  - 降低 `historySize` 以减少历史上下文的严格程度
- 要禁用所有功能（包括压缩后防护），显式设置 `tools.loopDetection.enabled: false`。

## 压缩后防护

当运行器在上下文溢出后完成压缩重试时，它会激活一个短窗口防护，监视接下来的几次工具调用。如果 Agent 在窗口内多次发出相同的 `(toolName, argsHash, resultHash)` 三元组，防护会得出压缩未打破循环的结论，并以 `compaction_loop_persisted` 错误中止运行。

防护由主 `tools.loopDetection.enabled` 标志控制，但有一个细微之处：当标志未设置或为 `true` 时，防护**保持启用**，仅当标志显式为 `false` 时才停用。这是有意为之。防护的目的是逃离否则会消耗无界 token 的压缩循环，因此没有配置的用户仍能获得保护。

```json5
{
  tools: {
    loopDetection: {
      // 主开关；设置 false 同时禁用防护和滚动检测器
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // 默认值
      },
    },
  },
}
```

- 较小的 `windowSize` 更严格（中止前尝试次数更少）。
- 较大的 `windowSize` 给 Agent 更多恢复尝试次数。
- 防护仅在结果相同时中止，结果有变化时不会中止。
- 防护设计为窄范围：仅在压缩重试后立即触发。

<Note>
  压缩后防护只要主标志未显式为 `false` 就会运行，即使您从未编写过 `tools.loopDetection` 块。要验证，请在压缩事件后立即在 Gateway 日志中查找 `post-compaction guard armed for N attempts`。
</Note>

## 日志与预期行为

检测到循环时，OpenClaw 会报告循环事件，并根据严重程度阻断或抑制下一个工具周期。这可保护用户免受失控的 token 消耗和死锁影响，同时保持正常的工具访问。

- 优先发出警告。
- 模式持续超过警告阈值后进行抑制。
- 关键阈值阻断下一个工具周期，并在运行记录中显示清晰的循环检测原因。
- 压缩后防护发出 `compaction_loop_persisted` 错误，包含违规工具名称和相同调用次数。

## 相关

<CardGroup cols={2}>
  <Card title="Exec 批准" href="/tools/exec-approvals" icon="shield">
    Shell 执行的允许/拒绝策略。
  </Card>
  <Card title="思考级别" href="/tools/thinking" icon="brain">
    推理 effort 级别和 Provider 策略交互。
  </Card>
  <Card title="子 Agent" href="/tools/subagents" icon="users">
    生成隔离的 Agent 以限制失控行为。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    完整的 `tools.loopDetection` Schema 和合并语义。
  </Card>
</CardGroup>
