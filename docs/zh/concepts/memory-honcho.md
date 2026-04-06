---
title: "Honcho 内存"
summary: "通过 Honcho 插件实现的 AI 原生跨 Session 内存"
read_when:
  - 你想要在 Session 和 Channel 间持久化的内存
  - 你想要 AI 驱动的召回和用户建模
---

# Honcho 内存

[Honcho](https://honcho.dev) 为 OpenClaw 添加了 AI 原生内存。它将对话持久化到专用服务，并随时间构建用户和 Agent 模型，为你的 Agent 提供跨 Session 的上下文，超越工作区 Markdown 文件的范围。

## 提供的功能

- **跨 Session 内存** — 对话在每次回合后持久化，因此上下文可以跨 Session 重置、compaction 和 Channel 切换保留。
- **用户建模** — Honcho 为每个用户（偏好、事实、沟通风格）和 Agent（人格、学到的行为）维护档案。
- **语义搜索** — 搜索过去对话的观察记录，而不仅仅是当前 Session。
- **多 Agent 感知** — 父 Agent 自动跟踪派生的子 Agent，父 Agent 作为观察者加入子 Session。

## 可用工具

Honcho 注册的工具供 Agent 在对话中使用：

**数据检索（快速，无 LLM 调用）：**

| 工具                        | 功能                                         |
| --------------------------- | -------------------------------------------- |
| `honcho_context`            | 跨 Session 的完整用户表示                    |
| `honcho_search_conclusions` | 对存储结论进行语义搜索                       |
| `honcho_search_messages`    | 跨 Session 查找消息（按发送者、日期过滤）    |
| `honcho_session`            | 当前 Session 历史和摘要                      |

**问答（LLM 驱动）：**

| 工具         | 功能                                                            |
| ------------ | --------------------------------------------------------------- |
| `honcho_ask` | 询问关于用户的问题。`depth='quick'` 查事实，`'thorough'` 做综合 |

## 入门指南

安装插件并运行设置：

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

设置命令会提示输入 API 凭据，写入配置，并可选地迁移现有工作区内存文件。

<Info>
Honcho 可以完全在本地运行（自托管），也可以通过 `api.honcho.dev` 的托管 API 运行。自托管选项不需要外部依赖。
</Info>

## 配置

设置位于 `plugins.entries["openclaw-honcho"].config` 下：

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // 自托管时省略
          workspaceId: "openclaw", // 内存隔离
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

对于自托管实例，将 `baseUrl` 指向你的本地服务器（例如 `http://localhost:8000`）并省略 API 密钥。

## 迁移现有内存

如果你有现有的工作区内存文件（`USER.md`、`MEMORY.md`、`IDENTITY.md`、`memory/`、`canvas/`），`openclaw honcho setup` 会检测并提供迁移选项。

<Info>
迁移是非破坏性的 — 文件被上传到 Honcho，原始文件不会被删除或移动。
</Info>

## 工作原理

每次 AI 回合后，对话被持久化到 Honcho。用户和 Agent 消息都被观察，使 Honcho 能够随时间构建和完善其模型。

在对话过程中，Honcho 工具在 `before_prompt_build` 阶段查询服务，在模型看到 prompt 之前注入相关上下文。这确保了准确的回合边界和相关的召回内容。

## Honcho vs 内置内存

|                   | 内置 / QMD                   | Honcho                              |
| ----------------- | ---------------------------- | ----------------------------------- |
| **存储**          | 工作区 Markdown 文件         | 专用服务（本地或托管）              |
| **跨 Session**    | 通过内存文件                 | 自动内置                            |
| **用户建模**      | 手动（写入 MEMORY.md）       | 自动档案                            |
| **搜索**          | 向量 + 关键词（混合）        | 对观察记录进行语义搜索              |
| **多 Agent**      | 未跟踪                       | 父/子感知                           |
| **依赖**          | 无（内置）或 QMD 二进制文件  | 插件安装                            |

Honcho 和内置内存系统可以协同工作。当配置了 QMD 时，可以使用额外工具在本地 Markdown 文件和 Honcho 的跨 Session 内存中同时搜索。

## CLI 命令

```bash
openclaw honcho setup                        # 配置 API 密钥并迁移文件
openclaw honcho status                       # 检查连接状态
openclaw honcho ask <question>               # 向 Honcho 查询关于用户的信息
openclaw honcho search <query> [-k N] [-d D] # 对内存进行语义搜索
```

## 延伸阅读

- [插件源代码](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho 文档](https://docs.honcho.dev)
- [Honcho OpenClaw 集成指南](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memory](/concepts/memory) — OpenClaw 内存概述
- [Context Engines](/concepts/context-engine) — 插件 context engine 的工作原理
