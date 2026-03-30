---
mmh3_hash: "1a3889c5c7a2344952f0bb3a8415dca9"
title: "Honcho 记忆"
summary: "通过 Honcho Plugin 实现的 AI 原生跨 Session 记忆"
read_when:
  - 您想要跨 Session 和 Channel 工作的持久记忆
  - 您想要 AI 驱动的召回和用户建模
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: placeholder
  source_path: "concepts/memory-honcho.md"
  workflow: 15
---

# Honcho 记忆

[Honcho](https://honcho.dev) 为 OpenClaw 添加 AI 原生记忆。它将对话持久化到专用服务，并随时间构建用户和 Agent 模型，为您的 Agent 提供超越工作区 Markdown 文件的跨 Session 上下文。

## 提供的功能

- **跨 Session 记忆** — 每次轮次后对话都会持久化，因此上下文可以跨 Session 重置、压缩和 Channel 切换保留。
- **用户建模** — Honcho 为每个用户（偏好、事实、沟通风格）和 Agent（个性、学习到的行为）维护档案。
- **语义搜索** — 在过去对话的观察结果上搜索，而不仅仅是当前 Session。
- **多 Agent 感知** — 父 Agent 自动跟踪生成的子 Agent，父 Agent 作为观察者添加到子 Session 中。

## 可用工具

Honcho 注册 Agent 可以在对话中使用的工具：

**数据检索（快速，无 LLM 调用）：**

| 工具                        | 功能                                           |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | 跨 Session 的完整用户表示                       |
| `honcho_search_conclusions` | 对存储结论进行语义搜索                          |
| `honcho_search_messages`    | 跨 Session 查找消息（按发件人、日期过滤）        |
| `honcho_session`            | 当前 Session 历史和摘要                         |

**问答（LLM 驱动）：**

| 工具         | 功能                                                              |
| ------------ | ------------------------------------------------------------------------- |
| `honcho_ask` | 询问关于用户的信息。`depth='quick'` 用于事实，`'thorough'` 用于综合分析 |

## 入门

安装 Plugin 并运行设置：

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

setup 命令会提示输入 API 凭据，写入配置，并可选择迁移现有工作区记忆文件。

<Info>
Honcho 可以完全在本地运行（自托管）或通过 `api.honcho.dev` 上的托管 API 运行。自托管选项不需要外部依赖。
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
          workspaceId: "openclaw", // 记忆隔离
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

对于自托管实例，将 `baseUrl` 指向您的本地服务器（例如 `http://localhost:8000`）并省略 API key。

## 迁移现有记忆

如果您有现有的工作区记忆文件（`USER.md`、`MEMORY.md`、`IDENTITY.md`、`memory/`、`canvas/`），`openclaw honcho setup` 会检测并提供迁移它们。

<Info>
迁移是非破坏性的 — 文件被上传到 Honcho。原始文件永远不会被删除或移动。
</Info>

## 工作原理

每次 AI 轮次后，对话都会持久化到 Honcho。用户和 Agent 消息都会被观察，使 Honcho 能够随时间构建和完善其模型。

在对话中，Honcho 工具在 `before_prompt_build` 阶段查询服务，在模型看到提示之前注入相关上下文。这确保了准确的轮次边界和相关召回。

## Honcho 与内置记忆的比较

|                   | 内置 / QMD                    | Honcho                              |
| ----------------- | ---------------------------- | ----------------------------------- |
| **存储**          | 工作区 Markdown 文件          | 专用服务（本地或托管）               |
| **跨 Session**    | 通过记忆文件                  | 自动，内置                           |
| **用户建模**      | 手动（写入 MEMORY.md）        | 自动档案                             |
| **搜索**          | 向量 + 关键词（混合）         | 对观察结果的语义搜索                  |
| **多 Agent**      | 不跟踪                        | 父/子感知                            |
| **依赖**          | 无（内置）或 QMD 二进制文件   | Plugin 安装                          |

Honcho 和内置记忆系统可以一起工作。当配置了 QMD 时，可以使用额外的工具来搜索本地 Markdown 文件以及 Honcho 的跨 Session 记忆。

## CLI 命令

```bash
openclaw honcho setup                        # 配置 API key 并迁移文件
openclaw honcho status                       # 检查连接状态
openclaw honcho ask <question>               # 向 Honcho 询问用户信息
openclaw honcho search <query> [-k N] [-d D] # 对记忆进行语义搜索
```

## 延伸阅读

- [Plugin 源代码](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho 文档](https://docs.honcho.dev)
- [Honcho OpenClaw 集成指南](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [记忆](/concepts/memory) — OpenClaw 记忆概述
- [Context Engines](/concepts/context-engine) — Plugin Context Engines 的工作原理
