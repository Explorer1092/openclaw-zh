---
mmh3_hash: "3495effc2c9304e6ddafe60166861f2c"
summary: "通过核心及插件支持的运行时中的一流 ACP 控制平面集成 ACP 编码 Agent（acpx 优先）"
owner: "onutc"
status: "draft"
last_updated: "2026-02-25"
title: "ACP 线程绑定 Agent"
---

# ACP 线程绑定 Agent

## 概述

本计划定义了 OpenClaw 如何在支持线程的 Channel（Discord 优先）中，以生产级别的生命周期和恢复能力支持 ACP 编码 Agent。

相关文档：

- [统一运行时流式重构计划](/experiments/plans/acp-unified-streaming-refactor)

目标用户体验：

- 用户在线程中创建或聚焦一个 ACP Session
- 该线程中的用户消息路由至已绑定的 ACP Session
- Agent 输出流式回传至同一线程标识
- Session 可以是持久化模式或一次性模式，并带有明确的清理控制

## 决策摘要

长期建议采用混合架构：

- OpenClaw 核心负责 ACP 控制平面事务
  - Session 标识和元数据
  - 线程绑定与路由决策
  - 投递不变性与重复消息抑制
  - 生命周期清理与恢复语义
- ACP 运行时后端可插拔
  - 首个后端为基于 acpx 的插件服务
  - 运行时负责 ACP 传输、排队、取消、重连

OpenClaw 不应在核心中重新实现 ACP 传输内部逻辑。
OpenClaw 不应依赖纯插件专用的拦截路径来实现路由。

## 北极星架构（终极目标）

将 ACP 作为 OpenClaw 的一流控制平面，并采用可插拔的运行时适配器。

不可妥协的不变性约束：

- 每个 ACP 线程绑定必须引用有效的 ACP Session 记录
- 每个 ACP Session 必须具有明确的生命周期状态（`creating`、`idle`、`running`、`cancelling`、`closed`、`error`）
- 每次 ACP 运行必须具有明确的运行状态（`queued`、`running`、`completed`、`failed`、`cancelled`）
- 创建、绑定与初始入队操作必须是原子的
- 命令重试必须是幂等的（不产生重复运行或重复 Discord 输出）
- 绑定线程的 Channel 输出是 ACP 运行事件的投影，绝不是临时副作用

长期所有权模型：

- `AcpSessionManager` 是唯一的 ACP 写入方和编排器
- 管理器首先运行在 Gateway 进程中；后续可通过相同接口迁移至专用 Sidecar
- 每个 ACP Session 键，管理器持有一个内存 Actor（序列化命令执行）
- 适配器（`acpx` 及未来后端）仅作为传输/运行时实现

长期持久化模型：

- 将 ACP 控制平面状态迁移至 OpenClaw 状态目录下的专用 SQLite 存储（WAL 模式）
- 在迁移期间将 `SessionEntry.acp` 保留为兼容性投影，而非真实来源
- ACP 事件以追加方式存储，以支持回放、崩溃恢复和确定性投递

### 投递策略（通向终极目标的桥梁）

- 短期桥接方案
  - 保留当前线程绑定机制和现有 ACP 配置界面
  - 修复元数据缺口缺陷，并通过单一核心 ACP 分支路由 ACP 轮次
  - 立即添加幂等性键和故障关闭路由检查
- 长期切换方案
  - 将 ACP 真实来源迁移至控制平面数据库与 Actor
  - 使绑定线程的投递完全基于事件投影
  - 移除依赖机会性 Session 条目元数据的遗留回退行为

## 为何不采用纯插件方案

当前插件 Hook 不足以在不修改核心的情况下实现端到端的 ACP Session 路由。

- 来自线程绑定的入站路由首先在核心分发中解析为 Session 键
- 消息 Hook 是即发即忘的，无法短路主要回复路径
- 插件命令适合控制操作，但不适合替代核心的每轮分发流

结论：

- ACP 运行时可以插件化
- ACP 路由分支必须存在于核心中

## 可复用的现有基础

已实现且应保持为规范实现：

- 线程绑定目标支持 `subagent` 和 `acp`
- 入站线程路由覆盖在正常分发前通过绑定进行解析
- 通过回复投递中的 Webhook 实现出站线程标识
- `/focus` 和 `/unfocus` 流程与 ACP 目标兼容
- 具有启动时恢复的持久化绑定存储
- 在归档、删除、unfocus、重置和删除时解除绑定的生命周期

本计划在该基础之上进行扩展，而非替换。

## 架构

### 边界模型

核心（必须在 OpenClaw 核心中）：

- 回复管道中的 ACP Session 模式分发分支
- 避免父 Channel 与线程重复投递的仲裁
- ACP 控制平面持久化（迁移期间使用 `SessionEntry.acp` 兼容性投影）
- 与 Session 重置/删除相关联的生命周期解绑和运行时分离语义

插件后端（acpx 实现）：

- ACP 运行时工作进程监督
- acpx 进程调用和事件解析
- ACP 命令处理器（`/acp ...`）和操作员用户体验
- 后端特定的配置默认值和诊断

### 运行时所有权模型

- 单个 Gateway 进程持有 ACP 编排状态
- ACP 执行通过 acpx 后端在受监督的子进程中运行
- 进程策略是每个活跃 ACP Session 键的长生命周期模式，而非每条消息

这避免了每次提示的启动开销，并保证了取消和重连语义的可靠性。

### 核心运行时契约

添加一个核心 ACP 运行时契约，使路由代码不依赖 CLI 细节，并能在不更改分发逻辑的情况下切换后端：

```ts
export type AcpRuntimePromptMode = "prompt" | "steer";

export type AcpRuntimeHandle = {
  sessionKey: string;
  backend: string;
  runtimeSessionName: string;
};

export type AcpRuntimeEvent =
  | { type: "text_delta"; stream: "output" | "thought"; text: string }
  | { type: "tool_call"; name: string; argumentsText: string }
  | { type: "done"; usage?: Record<string, number> }
  | { type: "error"; code: string; message: string; retryable?: boolean };

export interface AcpRuntime {
  ensureSession(input: {
    sessionKey: string;
    agent: string;
    mode: "persistent" | "oneshot";
    cwd?: string;
    env?: Record<string, string>;
    idempotencyKey: string;
  }): Promise<AcpRuntimeHandle>;

  submit(input: {
    handle: AcpRuntimeHandle;
    text: string;
    mode: AcpRuntimePromptMode;
    idempotencyKey: string;
  }): Promise<{ runtimeRunId: string }>;

  stream(input: {
    handle: AcpRuntimeHandle;
    runtimeRunId: string;
    onEvent: (event: AcpRuntimeEvent) => Promise<void> | void;
    signal?: AbortSignal;
  }): Promise<void>;

  cancel(input: {
    handle: AcpRuntimeHandle;
    runtimeRunId?: string;
    reason?: string;
    idempotencyKey: string;
  }): Promise<void>;

  close(input: { handle: AcpRuntimeHandle; reason: string; idempotencyKey: string }): Promise<void>;

  health?(): Promise<{ ok: boolean; details?: string }>;
}
```

实现细节：

- 首个后端：作为插件服务提供的 `AcpxRuntime`
- 核心通过注册表解析运行时，当没有可用的 ACP 运行时后端时，抛出明确的操作员错误

### 控制平面数据模型与持久化

长期真实来源为专用的 ACP SQLite 数据库（WAL 模式），用于事务性更新和崩溃安全恢复：

- `acp_sessions`
  - `session_key`（主键）、`backend`、`agent`、`mode`、`cwd`、`state`、`created_at`、`updated_at`、`last_error`
- `acp_runs`
  - `run_id`（主键）、`session_key`（外键）、`state`、`requester_message_id`、`idempotency_key`、`started_at`、`ended_at`、`error_code`、`error_message`
- `acp_bindings`
  - `binding_key`（主键）、`thread_id`、`channel_id`、`account_id`、`session_key`（外键）、`expires_at`、`bound_at`
- `acp_events`
  - `event_id`（主键）、`run_id`（外键）、`seq`、`kind`、`payload_json`、`created_at`
- `acp_delivery_checkpoint`
  - `run_id`（主键/外键）、`last_event_seq`、`last_discord_message_id`、`updated_at`
- `acp_idempotency`
  - `scope`、`idempotency_key`、`result_json`、`created_at`，唯一约束 `(scope, idempotency_key)`

```ts
export type AcpSessionMeta = {
  backend: string;
  agent: string;
  runtimeSessionName: string;
  mode: "persistent" | "oneshot";
  cwd?: string;
  state: "idle" | "running" | "error";
  lastActivityAt: number;
  lastError?: string;
};
```

存储规则：

- 在迁移期间将 `SessionEntry.acp` 保留为兼容性投影
- 进程 ID 和 Socket 仅保留在内存中
- 持久化的生命周期和运行状态存储在 ACP 数据库中，而非通用 Session JSON
- 若运行时拥有者崩溃，Gateway 从 ACP 数据库重新加载并从检查点恢复

### 路由与投递

入站：

- 将当前线程绑定查找作为第一路由步骤
- 若绑定目标是 ACP Session，则路由至 ACP 运行时分支，而非 `getReplyFromConfig`
- 显式的 `/acp steer` 命令使用 `mode: "steer"`

出站：

- ACP 事件流被规范化为 OpenClaw 回复片段
- 投递目标通过现有的绑定目标路径解析
- 当该 Session 轮次有活跃的绑定线程时，父 Channel 的完成将被抑制

流式策略：

- 使用合并窗口对部分输出进行流式传输
- 可配置的最小间隔和最大片段字节数，以保持在 Discord 速率限制之内
- 完成或失败时始终发出最终消息

### 状态机与事务边界

Session 状态机：

- `creating -> idle -> running -> idle`
- `running -> cancelling -> idle | error`
- `idle -> closed`
- `error -> idle | closed`

运行状态机：

- `queued -> running -> completed`
- `running -> failed | cancelled`
- `queued -> cancelled`

必需的事务边界：

- 创建事务
  - 创建 ACP Session 行
  - 创建/更新 ACP 线程绑定行
  - 入队初始运行行
- 关闭事务
  - 标记 Session 已关闭
  - 删除/过期绑定行
  - 写入最终关闭事件
- 取消事务
  - 使用幂等性键将目标运行标记为取消中/已取消

这些边界不允许出现部分成功的情况。

### 每 Session 的 Actor 模型

`AcpSessionManager` 为每个 ACP Session 键运行一个 Actor：

- Actor 邮箱序列化 `submit`、`cancel`、`close` 和 `stream` 的副作用
- Actor 持有该 Session 的运行时句柄水合与运行时适配器进程生命周期
- Actor 在任何 Discord 投递之前按顺序（`seq`）写入运行事件
- Actor 在成功出站发送后更新投递检查点

这消除了跨轮次的竞争条件，防止线程输出出现重复或乱序。

### 幂等性与投递投影

所有外部 ACP 操作必须携带幂等性键：

- 创建幂等性键
- 提示/引导幂等性键
- 取消幂等性键
- 关闭幂等性键

投递规则：

- Discord 消息由 `acp_events` 加上 `acp_delivery_checkpoint` 派生
- 重试从检查点恢复，不重新发送已投递的片段
- 最终回复的发送在每次运行的投影逻辑中恰好执行一次

### 恢复与自愈

Gateway 启动时：

- 加载非终态 ACP Session（`creating`、`idle`、`running`、`cancelling`、`error`）
- 在首个入站事件时惰性重建 Actor，或在配置上限内急切重建
- 协调任何缺少心跳的 `running` 运行，并标记为 `failed` 或通过适配器恢复

入站 Discord 线程消息时：

- 若绑定存在但 ACP Session 缺失，则故障关闭并附带明确的过期绑定消息
- 在操作员安全验证后，可选择自动解除过期绑定
- 绝不将过期 ACP 绑定静默路由至普通 LLM 路径

### 生命周期与安全

支持的操作：

- 取消当前运行：`/acp cancel`
- 解绑线程：`/unfocus`
- 关闭 ACP Session：`/acp close`
- 按有效 TTL 自动关闭空闲 Session

TTL 策略：

- 有效 TTL 为以下最小值
  - 全局/Session TTL
  - Discord 线程绑定 TTL
  - ACP 运行时拥有者 TTL

安全控制：

- 按名称设置 ACP Agent 的允许列表
- 限制 ACP Session 的工作区根目录
- 环境变量允许列表透传
- 每账户及全局的最大并发 ACP Session 数
- 运行时崩溃的有界重启退避

## 配置界面

核心键：

- `acp.enabled`
- `acp.dispatch.enabled`（独立的 ACP 路由终止开关）
- `acp.backend`（默认 `acpx`）
- `acp.defaultAgent`
- `acp.allowedAgents[]`
- `acp.maxConcurrentSessions`
- `acp.stream.coalesceIdleMs`
- `acp.stream.maxChunkChars`
- `acp.runtime.ttlMinutes`
- `acp.controlPlane.store`（默认 `sqlite`）
- `acp.controlPlane.storePath`
- `acp.controlPlane.recovery.eagerActors`
- `acp.controlPlane.recovery.reconcileRunningAfterMs`
- `acp.controlPlane.checkpoint.flushEveryEvents`
- `acp.controlPlane.checkpoint.flushEveryMs`
- `acp.idempotency.ttlHours`
- `channels.discord.threadBindings.spawnAcpSessions`

插件/后端键（acpx 插件部分）：

- 后端命令/路径覆盖
- 后端环境变量允许列表
- 后端每 Agent 预设
- 后端启动/停止超时
- 后端每 Session 最大并发运行数

## 实现规范

### 控制平面模块（新增）

在核心中添加专用的 ACP 控制平面模块：

- `src/acp/control-plane/manager.ts`
  - 持有 ACP Actor、生命周期转换、命令序列化
- `src/acp/control-plane/store.ts`
  - SQLite Schema 管理、事务、查询辅助函数
- `src/acp/control-plane/events.ts`
  - 类型化的 ACP 事件定义和序列化
- `src/acp/control-plane/checkpoint.ts`
  - 持久化投递检查点和回放游标
- `src/acp/control-plane/idempotency.ts`
  - 幂等性键预留与响应回放
- `src/acp/control-plane/recovery.ts`
  - 启动时协调与 Actor 重新水合计划

兼容性桥接模块：

- `src/acp/runtime/session-meta.ts`
  - 暂时保留，用于投影至 `SessionEntry.acp`
  - 迁移切换后必须停止作为真实来源

### 必需不变性约束（必须在代码中强制执行）

- ACP Session 创建与线程绑定是原子的（单一事务）
- 每个 ACP Session Actor 同一时刻最多有一个活跃运行
- 事件 `seq` 在每次运行中严格递增
- 投递检查点永远不超过最后提交的事件
- 幂等性回放为重复命令键返回先前的成功载荷
- 过期/缺失的 ACP 元数据不能路由至普通非 ACP 回复路径

### 核心接触点

需要修改的核心文件：

- `src/auto-reply/reply/dispatch-from-config.ts`
  - ACP 分支调用 `AcpSessionManager.submit` 和事件投影投递
  - 移除绕过控制平面不变性约束的直接 ACP 回退
- `src/auto-reply/reply/inbound-context.ts`（或最近的规范化上下文边界）
  - 为 ACP 控制平面公开规范化的路由键和幂等性种子
- `src/config/sessions/types.ts`
  - 将 `SessionEntry.acp` 保留为仅投影的兼容性字段
- `src/gateway/server-methods/sessions.ts`
  - 重置/删除/归档必须调用 ACP 管理器的关闭/解绑事务路径
- `src/infra/outbound/bound-delivery-router.ts`
  - 为 ACP 绑定 Session 轮次强制执行故障关闭的目标行为
- `src/discord/monitor/thread-bindings.ts`
  - 添加与控制平面查找关联的 ACP 过期绑定验证辅助函数
- `src/auto-reply/reply/commands-acp.ts`
  - 通过 ACP 管理器 API 路由创建/取消/关闭/引导操作
- `src/agents/acp-spawn.ts`
  - 停止临时元数据写入；调用 ACP 管理器的创建事务
- `src/plugin-sdk/**` 及插件运行时桥接
  - 清晰公开 ACP 后端注册和健康语义

明确不替换的核心文件：

- `src/discord/monitor/message-handler.preflight.ts`
  - 将线程绑定覆盖行为保留为规范的 Session 键解析器

### ACP 运行时注册表 API

添加核心注册表模块：

- `src/acp/runtime/registry.ts`

必需的 API：

```ts
export type AcpRuntimeBackend = {
  id: string;
  runtime: AcpRuntime;
  healthy?: () => boolean;
};

export function registerAcpRuntimeBackend(backend: AcpRuntimeBackend): void;
export function unregisterAcpRuntimeBackend(id: string): void;
export function getAcpRuntimeBackend(id?: string): AcpRuntimeBackend | null;
export function requireAcpRuntimeBackend(id?: string): AcpRuntimeBackend;
```

行为：

- `requireAcpRuntimeBackend` 在后端不可用时抛出类型化的 ACP 后端缺失错误
- 插件服务在 `start` 时注册后端，在 `stop` 时注销
- 运行时查找是只读且进程本地的

### acpx 运行时插件契约（实现细节）

对于首个生产后端（`extensions/acpx`），OpenClaw 与 acpx 通过严格的命令契约连接：

- 后端 ID：`acpx`
- 插件服务 ID：`acpx-runtime`
- 运行时句柄编码：`runtimeSessionName = acpx:v1:<base64url(json)>`
- 编码载荷字段：
  - `name`（acpx 命名 Session；使用 OpenClaw `sessionKey`）
  - `agent`（acpx Agent 命令）
  - `cwd`（Session 工作区根目录）
  - `mode`（`persistent | oneshot`）

命令映射：

- 确保 Session：
  - `acpx --format json --json-strict --cwd <cwd> <agent> sessions ensure --name <name>`
- 提示轮次：
  - `acpx --format json --json-strict --cwd <cwd> <agent> prompt --session <name> --file -`
- 取消：
  - `acpx --format json --json-strict --cwd <cwd> <agent> cancel --session <name>`
- 关闭：
  - `acpx --format json --json-strict --cwd <cwd> <agent> sessions close <name>`

流式传输：

- OpenClaw 从 `acpx --format json --json-strict` 消费 ndjson 事件
- `text` => `text_delta/output`
- `thought` => `text_delta/thought`
- `tool_call` => `tool_call`
- `done` => `done`
- `error` => `error`

### Session Schema 补丁

在 `src/config/sessions/types.ts` 中修补 `SessionEntry`：

```ts
type SessionAcpMeta = {
  backend: string;
  agent: string;
  runtimeSessionName: string;
  mode: "persistent" | "oneshot";
  cwd?: string;
  state: "idle" | "running" | "error";
  lastActivityAt: number;
  lastError?: string;
};
```

持久化字段：

- `SessionEntry.acp?: SessionAcpMeta`

迁移规则：

- 阶段 A：双写（`acp` 投影 + ACP SQLite 真实来源）
- 阶段 B：从 ACP SQLite 主读，从遗留 `SessionEntry.acp` 回退读
- 阶段 C：迁移命令从有效的遗留条目中补充缺失的 ACP 行
- 阶段 D：移除回退读，保留可选投影仅供用户体验
- 遗留字段（`cliSessionIds`、`claudeCliSessionId`）保持不变

### 错误契约

添加稳定的 ACP 错误码和面向用户的消息：

- `ACP_BACKEND_MISSING`
  - 消息：`ACP 运行时后端未配置。请安装并启用 acpx 运行时插件。`
- `ACP_BACKEND_UNAVAILABLE`
  - 消息：`ACP 运行时后端当前不可用。请稍后重试。`
- `ACP_SESSION_INIT_FAILED`
  - 消息：`无法初始化 ACP Session 运行时。`
- `ACP_TURN_FAILED`
  - 消息：`ACP 轮次在完成前失败。`

规则：

- 在线程中返回可操作的用户安全消息
- 仅在运行时日志中记录详细的后端/系统错误
- 当明确选择 ACP 路由时，绝不静默回退至普通 LLM 路径

### 重复投递仲裁

ACP 绑定轮次的单一路由规则：

- 若目标 ACP Session 和请求者上下文存在活跃的线程绑定，则仅投递至该绑定线程
- 同一轮次不同时发送至父 Channel
- 若绑定目标选择存在歧义，则故障关闭并附带明确错误（不隐式回退至父 Channel）
- 若无活跃绑定，则使用普通 Session 目标行为

### 可观测性与运营就绪

必需指标：

- 按后端和错误码统计的 ACP 创建成功/失败次数
- ACP 运行延迟百分位数（队列等待、运行时轮次时间、投递投影时间）
- ACP Actor 重启次数和重启原因
- 过期绑定检测次数
- 幂等性回放命中率
- Discord 投递重试和速率限制计数器

必需日志：

- 以 `sessionKey`、`runId`、`backend`、`threadId`、`idempotencyKey` 为键的结构化日志
- Session 和运行状态机的显式状态转换日志
- 带有脱敏参数和退出摘要的适配器命令日志

必需诊断：

- `/acp sessions` 包括状态、活跃运行、最后错误和绑定状态
- `/acp doctor`（或等效命令）验证后端注册、存储健康状况和过期绑定

### 配置优先级与有效值

ACP 启用优先级：

- 账户覆盖：`channels.discord.accounts.<id>.threadBindings.spawnAcpSessions`
- Channel 覆盖：`channels.discord.threadBindings.spawnAcpSessions`
- 全局 ACP 开关：`acp.enabled`
- 分发开关：`acp.dispatch.enabled`
- 后端可用性：`acp.backend` 的已注册后端

自动启用行为：

- 当 ACP 已配置（`acp.enabled=true`、`acp.dispatch.enabled=true` 或
  `acp.backend=acpx`）时，插件自动启用将 `plugins.entries.acpx.enabled=true`，
  除非已被拒绝列表或明确禁用

TTL 有效值：

- `min(session ttl, discord thread binding ttl, acp runtime ttl)`

### 测试映射

单元测试：

- `src/acp/runtime/registry.test.ts`（新增）
- `src/auto-reply/reply/dispatch-from-config.acp.test.ts`（新增）
- `src/infra/outbound/bound-delivery-router.test.ts`（扩展 ACP 故障关闭用例）
- `src/config/sessions/types.test.ts` 或最近的 Session 存储测试（ACP 元数据持久化）

集成测试：

- `src/discord/monitor/reply-delivery.test.ts`（绑定 ACP 投递目标行为）
- `src/discord/monitor/message-handler.preflight*.test.ts`（绑定 ACP Session 键路由连续性）
- 后端包中的 acpx 插件运行时测试（服务注册/启动/停止 + 事件规范化）

Gateway 端到端测试：

- `src/gateway/server.sessions.gateway-server-sessions-a.e2e.test.ts`（扩展 ACP 重置/删除生命周期覆盖）
- ACP 线程轮次端到端测试，涵盖创建、消息、流式、取消、unfocus、重启恢复

### 推出保护

添加独立的 ACP 分发终止开关：

- `acp.dispatch.enabled` 首次发布默认为 `false`
- 禁用时：
  - ACP 创建/聚焦控制命令仍可绑定 Session
  - ACP 分发路径不激活
  - 用户收到明确消息，说明 ACP 分发已被策略禁用
- 经金丝雀验证后，可在后续版本中将默认值翻转为 `true`

## 命令与用户体验计划

### 新增命令

- `/acp spawn <agent-id> [--mode persistent|oneshot] [--thread auto|here|off]`
- `/acp cancel [session]`
- `/acp steer <instruction>`
- `/acp close [session]`
- `/acp sessions`

### 现有命令兼容性

- `/focus <sessionKey>` 继续支持 ACP 目标
- `/unfocus` 保留当前语义
- `/session idle` 和 `/session max-age` 替换旧的 TTL 覆盖

## 分阶段推出

### 阶段 0 ADR 与 Schema 冻结

- 发布 ACP 控制平面所有权和适配器边界的 ADR
- 冻结数据库 Schema（`acp_sessions`、`acp_runs`、`acp_bindings`、`acp_events`、`acp_delivery_checkpoint`、`acp_idempotency`）
- 定义稳定的 ACP 错误码、事件契约和状态转换守卫

### 阶段 1 核心控制平面基础

- 实现 `AcpSessionManager` 和每 Session 的 Actor 运行时
- 实现 ACP SQLite 存储和事务辅助函数
- 实现幂等性存储和回放辅助函数
- 实现事件追加 + 投递检查点模块
- 将创建/取消/关闭 API 与管理器进行事务性保证的连接

### 阶段 2 核心路由与生命周期集成

- 将分发管道中的线程绑定 ACP 轮次路由至 ACP 管理器
- 当 ACP 绑定/Session 不变性约束失败时强制执行故障关闭路由
- 将重置/删除/归档/unfocus 生命周期与 ACP 关闭/解绑事务集成
- 添加过期绑定检测和可选的自动解绑策略

### 阶段 3 acpx 后端适配器/插件

- 根据运行时契约实现 `acpx` 适配器（`ensureSession`、`submit`、`stream`、`cancel`、`close`）
- 添加后端健康检查以及启动/停止注册
- 将 acpx ndjson 事件规范化为 ACP 运行时事件
- 强制执行后端超时、进程监督和重启/退避策略

### 阶段 4 投递投影与 Channel 用户体验（Discord 优先）

- 实现带检查点恢复的事件驱动 Channel 投影（Discord 优先）
- 使用感知速率限制的刷新策略合并流式片段
- 保证每次运行的最终完成消息恰好发送一次
- 发布 `/acp spawn`、`/acp cancel`、`/acp steer`、`/acp close`、`/acp sessions`

### 阶段 5 迁移与切换

- 引入对 `SessionEntry.acp` 投影与 ACP SQLite 真实来源的双写
- 添加遗留 ACP 元数据行的迁移工具
- 将读路径切换为 ACP SQLite 主读
- 移除依赖缺失 `SessionEntry.acp` 的遗留回退路由

### 阶段 6 加固、SLO 与规模限制

- 强制执行并发限制（全局/账户/Session）、队列策略和超时预算
- 添加完整的遥测、仪表板和告警阈值
- 对崩溃恢复和重复投递抑制进行混沌测试
- 发布后端中断、数据库损坏和过期绑定修复的运维手册

### 完整实现检查列表

- 核心控制平面模块和测试
- 数据库迁移和回滚计划
- 跨分发和命令的 ACP 管理器 API 集成
- 插件运行时桥接中的适配器注册接口
- acpx 适配器实现和测试
- 具有检查点回放的线程能力 Channel 投递投影逻辑（Discord 优先）
- 重置/删除/归档/unfocus 的生命周期 Hook
- 过期绑定检测器和面向操作员的诊断
- 所有新 ACP 键的配置验证和优先级测试
- 运营文档和故障排查手册

## 测试计划

单元测试：

- ACP 数据库事务边界（创建/绑定/入队原子性、取消、关闭）
- ACP 状态机的 Session 和运行状态转换守卫
- 所有 ACP 命令的幂等性预留/回放语义
- 每 Session 的 Actor 序列化与队列排序
- acpx 事件解析器和片段合并器
- 运行时监督器重启和退避策略
- 配置优先级和有效 TTL 计算
- 核心 ACP 路由分支选择和后端/Session 无效时的故障关闭行为

集成测试：

- 用于确定性流式和取消行为的模拟 ACP 适配器进程
- ACP 管理器 + 分发集成与事务性持久化
- 线程绑定入站路由至 ACP Session 键
- 线程绑定出站投递抑制父 Channel 重复
- 检查点回放在投递失败后恢复并从最后事件继续
- 插件服务注册和 ACP 运行时后端的销毁

Gateway 端到端测试：

- 使用线程创建 ACP，交换多轮提示，unfocus
- Gateway 重启后保留 ACP 数据库和绑定，然后继续同一 Session
- 多个线程中的并发 ACP Session 之间无串扰
- 重复命令重试（相同幂等性键）不创建重复运行或回复
- 过期绑定场景产生明确错误和可选的自动清理行为

## 风险与缓解措施

- 过渡期间的重复投递
  - 缓解措施：单一目标解析器和幂等性事件检查点
- 负载下的运行时进程抖动
  - 缓解措施：每 Session 的长生命周期拥有者 + 并发上限 + 退避
- 插件缺失或配置错误
  - 缓解措施：明确的面向操作员的错误和故障关闭 ACP 路由（不隐式回退至普通 Session 路径）
- subagent 与 ACP 开关之间的配置混淆
  - 缓解措施：明确的 ACP 键和包含有效策略来源的命令反馈
- 控制平面存储损坏或迁移缺陷
  - 缓解措施：WAL 模式、备份/恢复 Hook、迁移冒烟测试和只读回退诊断
- Actor 死锁或邮箱饥饿
  - 缓解措施：看门狗计时器、Actor 健康探针和带拒绝遥测的有界邮箱深度

## 验收检查列表

- ACP Session 创建可以在受支持的 Channel 适配器（当前为 Discord）中创建或绑定线程
- 所有线程消息仅路由至绑定的 ACP Session
- ACP 输出以流式或批量方式出现在同一线程标识中
- 绑定轮次的父 Channel 无重复输出
- 创建 + 绑定 + 初始入队在持久化存储中是原子的
- ACP 命令重试是幂等的，不会重复运行或输出
- 取消、关闭、unfocus、归档、重置和删除执行确定性清理
- 崩溃重启保留映射关系并恢复多轮连续性
- 并发的线程绑定 ACP Session 相互独立工作
- ACP 后端缺失状态产生清晰可操作的错误
- 过期绑定被检测并明确呈现（带可选的安全自动清理）
- 操作员可使用控制平面指标和诊断
- 新的单元、集成和端到端覆盖通过测试

## 附录：当前实现的针对性重构（状态）

这些是非阻塞性的后续工作，用��在当前功能集落地后保持 ACP 路径的可维护性。

### 1) 集中化 ACP 分发策略评估（已完成）

- 通过 `src/acp/policy.ts` 中的共享 ACP 策略辅助函数实现
- 分发、ACP 命令生命周期处理器和 ACP 创建路径现在使用共享策略逻辑

### 2) 按子命令域拆分 ACP 命令处理器（已完成）

- `src/auto-reply/reply/commands-acp.ts` 现在是一个简单的路由器
- 子命令行为被拆分为：
  - `src/auto-reply/reply/commands-acp/lifecycle.ts`
  - `src/auto-reply/reply/commands-acp/runtime-options.ts`
  - `src/auto-reply/reply/commands-acp/diagnostics.ts`
  - `src/auto-reply/reply/commands-acp/shared.ts` 中的共享辅助函数

### 3) 按职责拆分 ACP Session 管理器（已完成）

- 管理器被拆分为：
  - `src/acp/control-plane/manager.ts`（公共门面 + 单例）
  - `src/acp/control-plane/manager.core.ts`（管理器实现）
  - `src/acp/control-plane/manager.types.ts`（管理器类型/依赖）
  - `src/acp/control-plane/manager.utils.ts`（规范化 + 辅助函数）

### 4) 可选的 acpx 运行时适配器清理

- `extensions/acpx/src/runtime.ts` 可拆分为：
- 进程执行/监督
- ndjson 事件解析/规范化
- 运行时 API 界面（`submit`、`cancel`、`close` 等）
- 提高可测试性，使后端行为更易于审计
