---
mmh3_hash: "887f249929a7c4b72ae9e65d6caf9da1"
summary: "Agent 引导仪式，播种工作空间和身份文件"
read_when:
  - 了解第一次 Agent 运行时发生的事情
  - 解释引导文件的位置
  - 调试引导身份设置
title: "Agent 引导"
sidebarTitle: "引导"
---

引导是**首次运行**仪式，用于准备 Agent 工作空间并收集身份详细信息。它在引导之后、Agent 首次启动时发生。

## 引导的作用

在第一次 Agent 运行时，OpenClaw 引导工作空间（默认 `~/.openclaw/workspace`）：

- 播种 `AGENTS.md`、`BOOTSTRAP.md`、`IDENTITY.md`、`USER.md`。
- 运行简短的问答仪式（一次一个问题）。
- 将身份 + 偏好写入 `IDENTITY.md`、`USER.md`、`SOUL.md`。
- 完成后删除 `BOOTSTRAP.md`，使其仅运行一次。

对于嵌入式/本地模型运行，OpenClaw 将 `BOOTSTRAP.md` 排除在特权系统上下文之外。在主要的交互式首次运行时，仍会在用户提示中传递文件内容，以便不能可靠调用 `read` 工具的模型也能完成仪式。如果当前运行无法安全访问工作区，Agent 将收到有限的引导说明，而不是通用问候。

## 跳过引导

如需跳过预置工作空间的引导，请运行 `openclaw onboard --skip-bootstrap`。

## 它在哪里运行

引导始终在 **Gateway 主机**上运行。如果 macOS 应用程序连接到远程 Gateway，则工作空间和引导文件位于该远程机器上。

<Note>
当 Gateway 在另一台机器上运行时，请在 Gateway 主机上编辑工作空间文件（例如，`user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 相关文档

- macOS 应用程序引导：[引导](/start/onboarding)
- 工作空间布局：[Agent 工作空间](/concepts/agent-workspace)
