---
mmh3_hash: "1e9ccb72499ee3ae29b3ce5fb88b12de"
summary: "提案：ACP 绑定对话的长期命令授权模型"
read_when:
  - 在 Telegram/Discord ACP 绑定 Channel/Topic 中设计原生命令 auth 行为
title: "ACP 绑定命令授权（提案）"
---

# ACP 绑定命令授权（提案）

状态：已提出，**尚未实现**。

本文档描述了 ACP 绑定对话中原生命令的长期授权模型。这是一个实验性提案，不替代当前的生产行为。

关于已实现的行为，请阅读以下内容中的源码和测试：

- `src/telegram/bot-native-commands.ts`
- `src/discord/monitor/native-command.ts`
- `src/auto-reply/reply/commands-core.ts`

## 问题

目前我们有命令特定的检查（例如 `/new` 和 `/reset`），即使在 allowlist 为空的情况下，也需要在 ACP 绑定 Channel/Topic 内部工作。这解决了当下的用户体验痛点，但基于命令名称的例外情况无法扩展。

## 长期形态

将命令授权从临时处理器逻辑转移到命令元数据加共享策略评估器。

### 1) 向命令定义添加 auth 策略元数据

每个命令定义应声明一个 auth 策略。示例形状：

```ts
type CommandAuthPolicy =
  | { mode: "owner_or_allowlist" } // 默认，当前严格行为
  | { mode: "bound_acp_or_owner_or_allowlist" } // 允许在明确绑定的 ACP 对话中
  | { mode: "owner_only" };
```

`/new` 和 `/reset` 将使用 `bound_acp_or_owner_or_allowlist`。
大多数其他命令将保持 `owner_or_allowlist`。

### 2) 跨 Channel 共享一个评估器

引入一个使用以下内容评估命令 auth 的辅助函数：

- 命令策略元数据
- 发送者授权状态
- 已解析的对话绑定状态

Telegram 和 Discord 原生处理器都应调用同一个辅助函数，以避免行为偏差。

### 3) 使用绑定匹配作为绕过边界

当策略允许绑定 ACP 绕过时，仅在为当前对话解析了已配置的绑定匹配时才授权（而不仅仅是因为当前 Session 键看起来像 ACP）。

这使边界保持明确，并最小化意外扩大。

## 为什么这更好

- 扩展到未来命令时无需添加更多命令名称条件。
- 保持跨 Channel 行为的一致性。
- 通过要求明确的绑定匹配来保留当前安全模型。
- 保持 allowlist 为可选的强化手段，而非普遍要求。

## 推广计划（未来）

1. 向命令注册表类型和命令数据添加命令 auth 策略字段。
2. 实现共享评估器，并迁移 Telegram + Discord 原生处理器。
3. 将 `/new` 和 `/reset` 转移到元数据驱动的策略。
4. 按策略模式和 Channel 界面添加测试。

## 非目标

- 本提案不更改 ACP Session 生命周期行为。
- 本提案不要求所有 ACP 绑定命令使用 allowlist。
- 本提案不更改现有路由绑定语义。

## 说明

本提案是有意叠加式的，不删除或替换现有的实验文档。
