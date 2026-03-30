---
read_when:
  - 你想了解智能体拥有哪些会话工具
  - 你想配置跨会话访问或子智能体生成
summary: 用于列出会话、读取历史记录和跨会话消息发送的智能体工具
title: 会话工具
x-i18n:
  generated_at: "2026-02-03T07:46:54Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 293c9d53b18cee08ceadea7f3d14c3d273d326a7ecc5b2561afc22a08b57da87
  source_path: concepts/session-tool.md
  workflow: 15
---

# 会话工具

OpenClaw 为智能体提供了跨会话工作的工具——列出对话、读取历史记录、向其他会话发送消息以及生成子智能体。

## 可用工具

| 工具               | 功能                                                    |
| ------------------ | ------------------------------------------------------- |
| `sessions_list`    | 列出会话，支持可选过滤（类型、最近活跃）                |
| `sessions_history` | 读取特定会话的记录                                      |
| `sessions_send`    | 向另一个会话发送消息，并可选择等待响应                  |
| `sessions_spawn`   | 生成隔离的子智能体会话以执行后台任务                    |

## 列出和读取会话

`sessions_list` 返回会话及其键、类型、渠道、模型、token 数和时间戳。可按类型（`main`、`group`、`cron`、`hook`、`node`）或最近活跃时间（`activeMinutes`）过滤。

`sessions_history` 获取特定会话的对话记录。默认不含工具结果——传入 `includeTools: true` 可查看。

两个工具都接受**会话键**（如 `"main"`）或之前列出时获得的**会话 ID**。

## 跨会话消息发送

`sessions_send` 向另一个会话投递消息，并可选择等待响应：

- **即发即忘：** 设置 `timeoutSeconds: 0` 可入队后立即返回。
- **等待回复：** 设置超时时间并内联获取响应。

目标响应后，OpenClaw 可运行**回复循环**，让两个智能体交替发送消息（最多 5 轮）。目标智能体可回复 `REPLY_SKIP` 提前结束。

## 生成子智能体

`sessions_spawn` 为后台任务创建隔离会话。它始终是非阻塞的——立即返回 `runId` 和 `childSessionKey`。

关键选项：

- `runtime: "subagent"`（默认）或 `"acp"`（用于外部 harness 智能体）。
- 为子会话覆盖 `model` 和 `thinking`。
- `thread: true` 将生成绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"` 为子任务强制启用沙箱隔离。

子智能体拥有完整工具集，但不含会话工具（不支持递归生成）。完成后，通告步骤会将结果发布到请求者的渠道。

ACP 专属行为请参阅 [ACP 智能体](/tools/acp-agents)。

## 可见范围

会话工具的作用域限制了智能体的可见范围：

| 级别    | 范围                              |
| ------- | --------------------------------- |
| `self`  | 仅当前会话                        |
| `tree`  | 当前会话 + 生成的子智能体         |
| `agent` | 此智能体的所有会话                |
| `all`   | 所有会话（如已配置，跨智能体）    |

默认为 `tree`。沙箱隔离会话无论配置如何，都会被限制为 `tree`。

## 延伸阅读

- [会话管理](/concepts/session) — 路由、生命周期、维护
- [ACP 智能体](/tools/acp-agents) — 外部 harness 生成
- [多智能体](/concepts/multi-agent) — 多智能体架构
- [Gateway 网关配置](/gateway/configuration) — 会话工具配置选项
