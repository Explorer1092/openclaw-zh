---
mmh3_hash: "b6f536cf7c3a751edfcf1ba3cab0b174"
summary: "Discord Gateway 监听器与长时间运行 Agent 轮次解耦的状态和后续步骤，通过 Discord 专用入站 Worker 实现"
owner: "openclaw"
status: "in_progress"
last_updated: "2026-03-05"
title: "Discord 异步入站 Worker 计划"
---

# Discord 异步入站 Worker 计划

## 目标

通过使入站 Discord 轮次异步化，消除 Discord 监听器超时作为用户可见的失败模式：

1. Gateway 监听器快速接受并规范化入站事件。
2. Discord 运行队列以我们今天使用的相同排序边界为键存储序列化的任务。
3. Worker 在 Carbon 监听器生命周期之外执行实际的 Agent 轮次。
4. 运行完成后，回复被投递回原始 Channel 或线程。

这是解决 Discord 排队运行在 `channels.discord.eventQueue.listenerTimeout` 超时的长期修复方案，而 Agent 运行本身仍在正常执行。

## 当前状态

此计划已部分实现。

已完成：

- Discord 监听器超时和 Discord 运行超时现在是独立的设置。
- 已接受的入站 Discord 轮次被加入 `src/discord/monitor/inbound-worker.ts` 中的队列。
- Worker 现在拥有长时间运行的轮次，而不是 Carbon 监听器。
- 通过队列键保留每路由的现有排序。
- 针对 Discord Worker 路径存在超时回归覆盖。

这意味着：

- 生产超时 Bug 已修复
- 长时间运行的轮次不再因为 Discord 监听器预算过期而死亡
- Worker 架构尚未完成

仍然缺失的内容：

- `DiscordInboundJob` 仍然只是部分规范化，仍然携带活跃运行时引用
- 命令语义（`stop`、`new`、`reset`、未来的 Session 控制）尚未完全成为 Worker 原生
- Worker 可观测性和操作员状态仍然很少
- 仍然没有重启持久性

## 存在原因

当前行为将完整的 Agent 轮次与监听器生命周期绑定：

- `src/discord/monitor/listeners.ts` 应用超时和中止边界。
- `src/discord/monitor/message-handler.ts` 将排队的运行保持在该边界内。
- `src/discord/monitor/message-handler.process.ts` 内联执行媒体加载、路由、分发、打字、草稿流式传输和最终回复投递。

该架构有两个不良属性：

- 长期但正常的轮次可能被监听器看门狗中止
- 即使下游运行时本来会产生回复，用户也可能看不到回复

提高超时有所帮助，但不会改变失败模式。

## 非目标

- 本次不重新设计非 Discord Channel。
- 第一次实现中不扩展到通用的全 Channel Worker 框架。
- 尚不提取共享的跨 Channel 入站 Worker 抽象；仅在重复明显时共享低级原语。
- 除非为了安全落地而需要，否则第一次不添加持久崩溃恢复。
- 本计划不更改路由选择、绑定语义或 ACP 策略。

## 当前约束

当前 Discord 处理路径仍然依赖于一些不应留在长期任务负载中的活跃运行时对象：

- Carbon `Client`
- 原始 Discord 事件形状
- 内存中的 Guild 历史映射
- 线程绑定管理器回调
- 活跃的打字和草稿流状态

我们已经将执行移到 Worker 队列上，但规范化边界仍然不完整。目前 Worker 是"稍后在同一进程中运行，带有一些相同的活跃对象"，而不是完全的数据专属任务边界。

## 目标架构

### 1. 监听器阶段

`DiscordMessageListener` 仍然是入口点，但其职责变为：

- 运行预检和策略检查
- 将已接受的输入规范化为可序列化的 `DiscordInboundJob`
- 将任务加入每 Session 或每 Channel 的异步队列
- 加入队列成功后立即返回给 Carbon

监听器不再应该拥有端到端 LLM 轮次的生命周期。

### 2. 规范化任务负载

引入可序列化的任务描述符，仅包含稍后运行轮次所需的数据。

最小形状：

- 路由标识
  - `agentId`
  - `sessionKey`
  - `accountId`
  - `channel`
- 投递标识
  - 目标 Channel ID
  - 回复目标消息 ID
  - 线程 ID（如有）
- 发送者标识
  - 发送者 ID、标签、用户名、tag
- Channel 上下文
  - Guild ID
  - Channel 名称或 slug
  - 线程元数据
  - 已解析的系统提示覆盖
- 规范化消息正文
  - 基础文本
  - 有效消息文本
  - 附件描述符或已解析的媒体引用
- 门控决策
  - 提及要求结果
  - 命令授权结果
  - 已绑定的 Session 或 Agent 元数据（如适用）

任务负载不得包含活跃的 Carbon 对象或可变闭包。

当前实现状态：

- 部分完成
- `src/discord/monitor/inbound-job.ts` 已存在并定义了 Worker 交接
- 负载仍然包含活跃的 Discord 运行时上下文，应进一步减少

### 3. Worker 阶段

添加 Discord 专用 Worker 运行器，负责：

- 从 `DiscordInboundJob` 重建轮次上下文
- 加载媒体和运行所需的任何额外 Channel 元数据
- 分发 Agent 轮次
- 投递最终回复负载
- 更新状态和诊断

推荐位置：

- `src/discord/monitor/inbound-worker.ts`
- `src/discord/monitor/inbound-job.ts`

### 4. 排序模型

排序必须与给定路由边界的今天保持等效。

推荐键：

- 使用与 `resolveDiscordRunQueueKey(...)` 相同的队列键逻辑

这保留了现有行为：

- 一个已绑定的 Agent 对话不会与自身交错
- 不同的 Discord Channel 仍然可以独立进行

### 5. 超时模型

切换后，有两个独立的超时类：

- 监听器超时
  - 仅覆盖规范化和入队
  - 应该很短
- 运行超时
  - 可选、Worker 拥有、明确且用户可见
  - 不应从 Carbon 监听器设置中意外继承

这消除了当前"Discord Gateway 监听器保持活跃"和"Agent 运行正常"之间的意外耦合。

## 推荐实现阶段

### 阶段 1：规范化边界

- 状态：部分实现
- 已完成：
  - 提取了 `buildDiscordInboundJob(...)`
  - 添加了 Worker 交接测试
- 剩余：
  - 使 `DiscordInboundJob` 仅包含纯数据
  - 将活跃运行时依赖移至 Worker 拥有的服务，而不是每任务负载
  - 停止通过将活跃监听器引用拼回任务来重建进程上下文

### 阶段 2：内存 Worker 队列

- 状态：已实现
- 已完成：
  - 添加了按已解析运行队列键的 `DiscordInboundWorkerQueue`
  - 监听器将任务加入队列，而不是直接等待 `processDiscordMessage(...)`
  - Worker 在进程内、仅内存中执行任务

这是第一个功能性切换。

### 阶段 3：进程拆分

- 状态：未开始
- 将投递、打字和草稿流式传输所有权移到面向 Worker 的适配器后面。
- 用 Worker 上下文重建替换对活跃预检上下文的直接使用。
- 如有需要，暂时将 `processDiscordMessage(...)` 保留为外观，然后拆分它。

### 阶段 4：命令语义

- 状态：未开始
  确保原生 Discord 命令在工作排队时仍然正常运行：

- `stop`
- `new`
- `reset`
- 任何未来的 Session 控制命令

Worker 队列必须暴露足够的运行状态，以便命令可以针对活跃或排队的轮次。

### 阶段 5：可观测性和操作员 UX

- 状态：未开始
- 将队列深度和活跃 Worker 计数发送到监控状态
- 记录入队时间、开始时间、完成时间以及超时或取消原因
- 在日志中清晰显示 Worker 拥有的超时或投递失败

### 阶段 6：可选持久性后续

- 状态：未开始
  仅在内存版本稳定后：

- 决定排队的 Discord 任务是否应在 Gateway 重启后存活
- 如果是，则持久化任务描述符和投递检查点
- 如果否，则明确记录内存边界

这应该是一个独立的后续工作，除非重启恢复是落地所必需的。

## 文件影响

当前主要文件：

- `src/discord/monitor/listeners.ts`
- `src/discord/monitor/message-handler.ts`
- `src/discord/monitor/message-handler.preflight.ts`
- `src/discord/monitor/message-handler.process.ts`
- `src/discord/monitor/status.ts`

当前 Worker 文件：

- `src/discord/monitor/inbound-job.ts`
- `src/discord/monitor/inbound-worker.ts`
- `src/discord/monitor/inbound-job.test.ts`
- `src/discord/monitor/message-handler.queue.test.ts`

可能的后续接触点：

- `src/auto-reply/dispatch.ts`
- `src/discord/monitor/reply-delivery.ts`
- `src/discord/monitor/thread-bindings.ts`
- `src/discord/monitor/native-command.ts`

## 当前下一步

下一步是使 Worker 边界真实而非部分。

接下来做：

1. 将活跃运行时依赖移出 `DiscordInboundJob`
2. 改为将这些依赖保留在 Discord Worker 实例上
3. 将排队任务减少到纯 Discord 特定数据：
   - 路由标识
   - 投递目标
   - 发送者信息
   - 规范化消息快照
   - 门控和绑定决策
4. 在 Worker 内部从该纯数据重建 Worker 执行上下文

实践中，这意味着：

- `client`
- `threadBindings`
- `guildHistories`
- `discordRestFetch`
- 其他可变的仅运行时句柄

应该停止存在于每个排队任务上，而是存在于 Worker 本身或 Worker 拥有的适配器后面。

落地后，下一个后续应该是 `stop`、`new` 和 `reset` 的命令状态清理。

## 测试计划

保留现有超时重现覆盖在：

- `src/discord/monitor/message-handler.queue.test.ts`

为以下内容添加新测试：

1. 监听器在入队后立即返回，无需等待完整轮次
2. 每路由排序得到保留
3. 不同 Channel 仍然并发运行
4. 回复被投递到原始消息目标
5. `stop` 取消活跃的 Worker 拥有的运行
6. Worker 失败产生可见诊断，不阻塞后续任务
7. ACP 绑定的 Discord Channel 在 Worker 执行下仍然正确路由

## 风险与缓解

- 风险：命令语义偏离当前同步行为
  缓解：在同一次切换中落地命令状态管道，而不是稍后

- 风险：回复投递丢失线程或回复目标上下文
  缓解：使投递标识在 `DiscordInboundJob` 中成为一等公民

- 风险：重试或队列重启期间重复发送
  缓解：第一次仅保持内存版本，或在持久化之前添加明确的投递幂等性

- 风险：迁移过程中 `message-handler.process.ts` 变得更难推理
  缓解：在 Worker 切换之前或期间将其拆分为规范化、执行和投递辅助函数

## 验收标准

计划完成时：

1. Discord 监听器超时不再中止正常的长时间运行轮次。
2. 监听器生命周期和 Agent 轮次生命周期在代码中是独立的概念。
3. 现有的每 Session 排序得到保留。
4. ACP 绑定的 Discord Channel 通过相同的 Worker 路径工作。
5. `stop` 针对 Worker 拥有的运行，而不是旧的监听器拥有的调用栈。
6. 超时和投递失败成为明确的 Worker 结果，而不是无声的监听器丢弃。

## 剩余落地策略

在后续 PR 中完成：

1. 使 `DiscordInboundJob` 仅包含纯数据，并将活跃运行时引用移到 Worker 上
2. 清理 `stop`、`new` 和 `reset` 的命令状态所有权
3. 添加 Worker 可观测性和操作员状态
4. 决定是否需要持久性，或明确记录内存边界

如果保持仅 Discord 且继续避免过早的跨 Channel Worker 抽象，这仍然是一个有限的后续工作。
