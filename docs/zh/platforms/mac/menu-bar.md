---
title: "菜单栏状态逻辑"
sidebarTitle: "菜单栏状态"
mmh3_hash: "d05736752dae5d05cf7cd0fde00de3d3"
summary: "菜单栏状态逻辑以及向用户显示的内容"
read_when: ["调整 mac 菜单 UI 或状态逻辑"]
---
# 菜单栏状态逻辑

## 显示的内容

- 我们在菜单栏图标和菜单的第一个状态行中显示当前 agent 工作状态。
- 工作活跃时隐藏健康状态；所有 session 空闲时返回。
- 根菜单中的"Context"子菜单包含最近的 session，而不是直接在根菜单中展开它们。
- 根菜单中的"Nodes"块仅列出**设备**（通过 `node.list` 配对的节点），而不是客户端/在线条目。
- 当 provider 使用快照可用时，根菜单中会出现"Usage"部分（在 Context 下方），当使用成本详情可用时，也会显示成本详情。

## 状态模型

- Session：事件到达时带有 `runId`（每次运行）加上有效负载中的 `sessionKey`。
  "main" session 是键 `main`；如果不存在，我们回退到最近更新的 session。
- 优先级：main 始终获胜。如果 main 活跃，则立即显示其状态。如果 main 空闲，
  则显示最近活跃的非 main session。我们不会在活动中间翻转；仅在当前 session 空闲
  或 main 变为活跃时才切换。
- 活动类型：
  - `job`：高级命令执行（`state: started|streaming|done|error`）。
  - `tool`：`phase: start|result` 带有 `toolName` 和 `meta/args`。

## IconState 枚举(Swift)
- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`(调试覆盖)

### ActivityKind → 字形
- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- default → 🛠️

### 视觉映射
- `idle`:正常小动物。
- `workingMain`:带字形的徽章、完整色调、腿"工作"动画。
- `workingOther`:带字形的徽章、静音色调、无快跑。
- `overridden`:使用选择的字形/色调,无论活动如何。

## Context 子菜单

- 根菜单显示一个"Context"行，包含 session 数量/状态，打开子菜单。
- Context 子菜单标题显示过去 24 小时的活跃 session 数量。
- 每个 session 行保留其 token 条、时间、预览、thinking/verbose、重置、压缩和删除操作。
- 加载中、断开连接和 session 加载错误消息出现在 Context 子菜单内。
- Provider 使用和使用成本详情保留在根菜单 Context 下方，以便在不打开子菜单的情况下一目了然。

## 状态行文本（菜单）

- 工作活跃时：`<Session role> · <activity label>`
  - 示例：`Main · exec: pnpm test`、`Other · read: apps/macos/Sources/OpenClaw/AppState.swift`。
- 空闲时：回退到健康摘要。

## 事件摄取

- 来源：控制 Channel `agent` 事件（`ControlChannel.handleAgentEvent`）。
- 解析的字段：
  - `stream: "job"` 带有 `data.state` 用于开始/停止。
  - `stream: "tool"` 带有 `data.phase`、`name`、可选的 `meta`/`args`。
- 标签：
  - `exec`：`args.command` 的第一行。
  - `read`/`write`：缩短的路径。
  - `edit`：路径加上从 `meta`/diff 计数推断的更改类型。
  - 回退：工具名称。

## 调试覆盖

- 设置 ▸ Debug ▸ "Icon override" 选择器：
  - `System (auto)`（默认）
  - `Working: main`（每种工具类型）
  - `Working: other`（每种工具类型）
  - `Idle`
- 通过 `@AppStorage("iconOverride")` 存储；映射到 `IconState.overridden`。

## 测试清单

- 触发 main session 作业：验证图标立即切换，状态行显示 main 标签。
- 在 main 空闲时触发非 main session 作业：图标/状态显示非 main；保持稳定直到完成。
- 在其他活跃时启动 main：图标立即翻转到 main。
- 快速工具突发：确保徽章不闪烁（工具结果上的 TTL 宽限期）。
- 所有 session 空闲后健康行重新出现。

## 相关文档

- [macOS 应用](/platforms/macos)
- [菜单栏图标](/platforms/mac/icon)
