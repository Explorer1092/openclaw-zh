---
mmh3_hash: "7011961f10ffa83535cf400541de0a8d"
title: "Session 绑定 Channel 无关计划"
summary: "Channel 无关 Session 绑定架构与第一迭代交付范围"
read_when:
  - 重构 Channel 无关 Session 路由和绑定
  - 排查跨 Channel 的重复、过时或缺失 Session 投递问题
owner: "onutc"
status: "in-progress"
last_updated: "2026-02-21"
---

# Session 绑定 Channel 无关计划

## 概述

本文档定义了长期的 Channel 无关 Session 绑定模型，以及下一个实施迭代的具体范围。

目标：

- 使子 Agent 绑定的 Session 路由成为核心能力
- 将 Channel 特定行为保留在适配器中
- 避免正常 Discord 行为的回归

## 为何需要此功能

当前行为混合了：

- 完成内容策略
- 目标路由策略
- Discord 特定细节

这导致了以下边缘情况：

- 并发运行时的主频道和线程重复投递
- 复用绑定管理器时使用过时的 token
- webhook 发送缺少活动计入

## 迭代 1 范围

本迭代有意限制范围。

### 1. 添加 Channel 无关核心接口

为绑定和路由添加核心类型和服务接口。

建议的核心类型：

```ts
export type BindingTargetKind = "subagent" | "session";
export type BindingStatus = "active" | "ending" | "ended";

export type ConversationRef = {
  channel: string;
  accountId: string;
  conversationId: string;
  parentConversationId?: string;
};

export type SessionBindingRecord = {
  bindingId: string;
  targetSessionKey: string;
  targetKind: BindingTargetKind;
  conversation: ConversationRef;
  status: BindingStatus;
  boundAt: number;
  expiresAt?: number;
  metadata?: Record<string, unknown>;
};
```

核心服务契约：

```ts
export interface SessionBindingService {
  bind(input: {
    targetSessionKey: string;
    targetKind: BindingTargetKind;
    conversation: ConversationRef;
    metadata?: Record<string, unknown>;
    ttlMs?: number;
  }): Promise<SessionBindingRecord>;

  listBySession(targetSessionKey: string): SessionBindingRecord[];
  resolveByConversation(ref: ConversationRef): SessionBindingRecord | null;
  touch(bindingId: string, at?: number): void;
  unbind(input: {
    bindingId?: string;
    targetSessionKey?: string;
    reason: string;
  }): Promise<SessionBindingRecord[]>;
}
```

### 2. 为子 Agent 完成添加核心投递路由器

为完成事件添加单一目标解析路径。

路由器契约：

```ts
export interface BoundDeliveryRouter {
  resolveDestination(input: {
    eventKind: "task_completion";
    targetSessionKey: string;
    requester?: ConversationRef;
    failClosed: boolean;
  }): {
    binding: SessionBindingRecord | null;
    mode: "bound" | "fallback";
    reason: string;
  };
}
```

本迭代中：

- 仅 `task_completion` 通过此新路径路由
- 其他事件类型的现有路径保持不变

### 3. 保持 Discord 作为适配器

Discord 仍是第一个适配器实现。

适配器职责：

- 创建/复用线程对话
- 通过 webhook 或 Channel 发送绑定消息
- 验证线程状态（已存档/已删除）
- 映射适配器元数据（webhook 身份、线程 id）

### 4. 修复当前已知的正确性问题

本迭代必须：

- 复用现有线程绑定管理器时刷新 token 使用
- 记录基于 webhook 的 Discord 发送的出站活动
- 停止在为 Session 模式完成选择了绑定线程目标时隐式回退到主频道

### 5. 保留当前运行时安全默认值

不对禁用线程绑定生成的用户更改行为。

默认值保持：

- `channels.discord.threadBindings.spawnSubagentSessions = false`

结果：

- 普通 Discord 用户保持当前行为
- 新核心路径仅影响启用了绑定 Session 完成路由的情况

## 不在迭代 1 中

明确推迟：

- ACP 绑定目标（`targetKind: "acp"`）
- Discord 之外的新 Channel 适配器
- 所有投递路径的全局替换（`spawn_ack`、未来的 `subagent_message`）
- 协议级变更
- 所有绑定持久化的存储迁移/版本重设计

关于 ACP 的说明：

- 接口设计为 ACP 保留了空间
- ACP 实现在本迭代中未启动

## 路由不变性

这些不变性在迭代 1 中是强制的。

- 目标选择和内容生成是独立的步骤
- 如果 Session 模式完成解析到活跃的绑定目标，投递必须指向该目标
- 从绑定目标到主频道不得有隐式重路由
- 回退行为必须是显式且可观测的

## 兼容性与发布

兼容性目标：

- 对禁用线程绑定生成的用户无回归
- 本迭代不改变非 Discord Channel 的行为

发布步骤：

1. 在当前功能门控后部署接口和路由器。
2. 通过路由器路由 Discord 完成模式绑定投递。
3. 为非绑定流程保留旧路径。
4. 通过有针对性的测试和金丝雀运行日志进行验证。

## 迭代 1 必要测试

必须覆盖的单元和集成测试：

- 管理器 token 轮换在管理器复用后使用最新 token
- webhook 发送更新 Channel 活动时间戳
- 同一请求者 Channel 中的两个活跃绑定 Session 不重复投递到主频道
- 绑定 Session 模式运行的完成仅解析到线程目标
- 禁用生成标志保持旧行为不变

## 建议的实现文件

核心：

- `src/infra/outbound/session-binding-service.ts`（新增）
- `src/infra/outbound/bound-delivery-router.ts`（新增）
- `src/agents/subagent-announce.ts`（完成目标解析集成）

Discord 适配器和运行时：

- `src/discord/monitor/thread-bindings.manager.ts`
- `src/discord/monitor/reply-delivery.ts`
- `src/discord/send.outbound.ts`

测试：

- `src/discord/monitor/provider*.test.ts`
- `src/discord/monitor/reply-delivery.test.ts`
- `src/agents/subagent-announce.format.test.ts`

## 迭代 1 完成标准

- 核心接口已存在并已为完成路由接线
- 上述正确性修复已带测试合并
- Session 模式绑定运行中无主频道和线程重复完成投递
- 禁用绑定生成的部署无行为变更
- ACP 明确推迟
