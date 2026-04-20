---
mmh3_hash: "f997ecde2550732c5c467dd7fe2c8611"
---
# 异步执行重复完成调查

## 范围

- Session：`agent:main:telegram:group:-1003774691294:topic:1`
- 症状：同一个异步执行完成（Session/run `keen-nexus`）在 LCM 中被记录了两次，作为用户轮次。
- 目标：判断这最可能是重复 Session 注入还是单纯的出站交付重试。

## 结论

最可能的原因是**重复 Session 注入**，而非单纯的出站交付重试。

Gateway 侧最明显的缺口在于 **node exec 完成路径**：

1. node 侧的 exec 完成发出带有完整 `runId` 的 `exec.finished`。
2. Gateway `server-node-events` 将其转换为系统事件并请求心跳。
3. 心跳运行将已排空的系统事件块注入 Agent 提示词。
4. 嵌入式运行器将该提示词作为新的用户轮次持久化到 Session 转录中。

如果同一 `exec.finished` 因任何原因（重放、重连重复、上游重发、重复生产者）对同一 `runId` 到达 Gateway 两次，OpenClaw 目前在此路径上**没有以 `runId`/`contextKey` 为键的幂等性检查**。第二个副本将成为内容相同的第二条用户消息。

## 精确代码路径

### 1. 生产者：node exec 完成事件

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` 发出带有 `exec.finished` 事件的 `node.event`。
  - 载荷包含 `sessionKey` 和完整的 `runId`。

### 2. Gateway 事件摄取

- `src/gateway/server-node-events.ts:574-640`
  - 处理 `exec.finished`。
  - 构建文本：
    - `Exec finished (node=..., id=<runId>, code ...)`
  - 通过以下方式入队：
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - 立即请求唤醒：
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. 系统事件去重弱点

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` 仅抑制**连续的重复文本**：
    - `if (entry.lastText === cleaned) return false`
  - 它存储 `contextKey`，但**不**将 `contextKey` 用于幂等性。
  - 排空后，重复抑制会重置。

这意味着具有相同 `runId` 的重放 `exec.finished` 即使代码已有稳定的幂等性候选（`exec:<runId>`），也可能在之后再次被接受。

### 4. 唤醒处理不是主要的重复制造者

- `src/infra/heartbeat-wake.ts:79-117`
  - 唤醒按 `(agentId, sessionKey)` 合并。
  - 针对同一目标的重复唤醒请求折叠为一个待处理的唤醒条目。

这使得**单独的重复唤醒处理**比重复事件摄取更难解释该现象。

### 5. 心跳消耗事件并将其转化为提示词输入

- `src/infra/heartbeat-runner.ts:535-574`
  - 预检查挂起的系统事件并对 exec 事件运行进行分类。
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` 排空 Session 的队列。
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - 已排空的系统事件块被预置到 Agent 提示词主体中。

### 6. 转录注入点

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` 将完整提示词提交给嵌入式 PI Session。
  - 这是完成派生的提示词成为持久化用户轮次的节点。

因此，一旦同一系统事件被重建为提示词两次，预期会出现重复的 LCM 用户消息。

## 为什么单纯的出站交付重试可能性较低

心跳运行器中存在真实的出站失败路径：

- `src/infra/heartbeat-runner.ts:1194-1242`
  - 回复首先生成。
  - 出站交付随后通过 `deliverOutboundPayloads(...)` 发生。
  - 失败时返回 `{ status: "failed" }`。

然而，对于同一个系统事件队列条目，仅凭这一点**不足以**解释重复的用户轮次：

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - 系统事件队列在出站交付之前已经排空。

因此，Channel 发送重试本身不会重新创建完全相同的已排队事件。它可以解释缺失/失败的外部交付，但本身无法解释第二条完全相同的 Session 用户消息。

## 次要、置信度较低的可能性

Agent 运行器中存在完整运行重试循环：

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - 某些瞬时故障可以重试整个运行并重新提交相同的 `commandBody`。

如果提示词在重试条件触发前已被追加，这可能会在**同一回复执行内**复制持久化的用户提示词。

我将此评级低于重复 `exec.finished` 摄取，原因如下：

- 观察到的间隔约为 51 秒，看起来更像是第二次唤醒/轮次，而非进程内重试；
- 报告中已提到反复的消息发送失败，这更指向单独的后续轮次，而非立即的模型/运行时重试。

## 根本原因假设

最高置信度假设：

- `keen-nexus` 完成通过了 **node exec 事件路径**。
- 同一 `exec.finished` 被两次交付给 `server-node-events`。
- Gateway 两次都接受了，因为 `enqueueSystemEvent(...)` 不按 `contextKey` / `runId` 去重。
- 每个被接受的事件都触发了心跳，并作为用户轮次注入到 PI 转录中。

## 提议的最小手术修复

如果需要修复，最小高价值变更是：

- 使 exec/系统事件幂等性对短时限内的 `contextKey` 生效，至少对于精确的 `(sessionKey, contextKey, text)` 重复；
- 或在 `server-node-events` 中为 `exec.finished` 添加专用的去重，以 `(sessionKey, runId, 事件类型)` 为键。

这将直接阻止重放的 `exec.finished` 重复在成为 Session 轮次之前被拦截。
