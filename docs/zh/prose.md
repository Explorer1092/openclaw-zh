---
mmh3_hash: "16a2618af0abe6d0d93222597f79b616"
summary: "OpenProse:.prose 工作流、斜杠命令和 OpenClaw 中的状态"
read_when:
  - 您想运行或编写 .prose 工作流
  - 您想启用 OpenProse 插件
  - 您需要了解状态存储
---
# OpenProse

OpenProse 是一种可移植的、以 markdown 为先的工作流格式,用于编排 AI 会话。在 OpenClaw 中,它作为插件提供,安装 OpenProse 技能包加上 `/prose` 斜杠命令。程序存储在 `.prose` 文件中,可以使用显式控制流生成多个子代理。

官方网站: https://www.prose.md

## 它能做什么

- 具有显式并行性的多代理研究 + 综合。
- 可重复的批准安全工作流(代码审查、事件分类、内容管道)。
- 可重用的 `.prose` 程序,您可以在支持的代理运行时中运行。

## 安装 + 启用

捆绑插件默认禁用。启用 OpenProse:

```bash
openclaw plugins enable open-prose
```

启用插件后重启网关。

开发/本地检出:`openclaw plugins install ./extensions/open-prose`

相关文档:[插件](/plugin)、[插件清单](/plugins/manifest)、[技能](/tools/skills)。

## 斜杠命令

OpenProse 将 `/prose` 注册为用户可调用的技能命令。它路由到 OpenProse VM 指令,并在底层使用 OpenClaw 工具。

常用命令:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## 示例:一个简单的 `.prose` 文件

```prose
# 使用两个并行运行的代理进行研究 + 综合。

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## 文件位置

OpenProse 在您的工作区中的 `.prose/` 下保存状态:

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

用户级持久代理位于:

```
~/.prose/agents/
```

## 状态模式

OpenProse 支持多个状态后端:

- **filesystem**(默认):`.prose/runs/...`
- **in-context**:瞬态,用于小程序
- **sqlite**(实验性):需要 `sqlite3` 二进制文件
- **postgres**(实验性):需要 `psql` 和连接字符串

注意:
- sqlite/postgres 是可选的和实验性的。
- postgres 凭证流入子代理日志;使用专用的、最少权限的 DB。

## 远程程序

`/prose run <handle/slug>` 解析为 `https://p.prose.md/<handle>/<slug>`。
直接 URL 按原样获取。这使用 `web_fetch` 工具(或用于 POST 的 `exec`)。

## OpenClaw 运行时映射

OpenProse 程序映射到 OpenClaw 原语:

| OpenProse 概念 | OpenClaw 工具 |
| --- | --- |
| 生成会话 / 任务工具 | `sessions_spawn` |
| 文件读/写 | `read` / `write` |
| Web 获取 | `web_fetch` |

如果您的工具允许列表阻止这些工具,OpenProse 程序将失败。请参阅[技能配置](/tools/skills-config)。

## 安全 + 批准

将 `.prose` 文件视为代码。运行前请审查。使用 OpenClaw 工具允许列表和批准门来控制副作用。

对于确定性的、经批准的工作流,请与 [Lobster](/tools/lobster) 进行比较。
