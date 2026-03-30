---
mmh3_hash: "f42cc6e164de48549263bdf88137f39d"
read_when:
  - 想了解 OpenClaw 提供哪些工具
  - 需要配置、允许或禁止工具
  - 在内置工具、Skills 和插件之间进行选择
summary: OpenClaw 工具与插件概览：智能体能做什么以及如何扩展
title: 工具与插件
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: tools/index.md
  workflow: 15
---

# 工具与插件

智能体除生成文本之外的所有操作都通过**工具**完成。
工具是智能体读取文件、运行命令、浏览网页、发送消息以及与设备交互的方式。

## 工具、Skills 与插件

OpenClaw 有三个协同工作的层次：

**工具是智能体调用的内容**

工具是智能体可以调用的类型化函数（例如 `exec`、`browser`、`web_search`、`message`）。OpenClaw 内置了一套**内置工具**，插件可以注册额外的工具。

智能体将工具视为发送给模型 API 的结构化函数定义。

**Skills 教导智能体何时以及如何操作**

Skill 是注入到系统提示中的 markdown 文件（`SKILL.md`）。
Skills 为智能体提供上下文、约束和逐步指导，帮助其有效使用工具。Skills 存放在你的工作区、共享文件夹中，或内置于插件中。

[Skills 参考](/tools/skills) | [创建 Skills](/tools/creating-skills)

**插件将一切打包在一起**

插件是可以注册任意组合能力的包：渠道、模型提供商、工具、Skills、语音、图像生成等。部分插件是**核心插件**（随 OpenClaw 提供），其他是**外部插件**（由社区发布在 npm 上）。

[安装和配置插件](/tools/plugin) | [构建自己的插件](/plugins/building-plugins)

## 内置工具

以下工具随 OpenClaw 提供，无需安装插件即可使用：

| 工具 | 功能 | 页面 |
| ---- | ---- | ---- |
| `exec` / `process` | 运行 shell 命令，管理后台进程 | [Exec](/tools/exec) |
| `code_execution` | 运行沙箱化的远程 Python 分析 | [Code Execution](/tools/code-execution) |
| `browser` | 控制 Chromium 浏览器（导航、点击、截图） | [Browser](/tools/browser) |
| `web_search` / `x_search` / `web_fetch` | 搜索网页、搜索 X 帖子、获取页面内容 | [Web](/tools/web) |
| `read` / `write` / `edit` | 工作区中的文件 I/O | |
| `apply_patch` | 多块文件补丁 | [Apply Patch](/tools/apply-patch) |
| `message` | 跨所有渠道发送消息 | [Agent Send](/tools/agent-send) |
| `canvas` | 驱动节点 Canvas（present、eval、snapshot） | |
| `nodes` | 发现和定位配对设备 | |
| `cron` / `gateway` | 管理定时任务，重启 Gateway 网关 | |
| `image` / `image_generate` | 分析或生成图像 | |
| `sessions_*` / `agents_list` | 会话管理，子智能体 | [Sub-agents](/tools/subagents) |

图像处理：使用 `image` 进行分析，使用 `image_generate` 进行生成或编辑。如果目标是 `openai/*`、`google/*`、`fal/*` 或其他非默认图像提供商，请先配置该提供商的认证/API 密钥。

### 插件提供的工具

插件可以注册额外的工具。一些示例：

- [Lobster](/tools/lobster) — 带有可恢复审批的类型化工作流运行时
- [LLM Task](/tools/llm-task) — 用于结构化输出的 JSON-only LLM 步骤
- [Diffs](/tools/diffs) — diff 查看器和渲染器
- [OpenProse](/prose) — markdown 优先的工作流编排

## 工具配置

### 允许和拒绝列表

通过配置中的 `tools.allow` / `tools.deny` 控制智能体可以调用的工具。deny 始终优先于 allow。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### 工具配置文件

`tools.profile` 在 `allow`/`deny` 应用之前设置基础允许列表。
按智能体覆盖：`agents.list[].tools.profile`。

| 配置文件 | 包含内容 |
| -------- | -------- |
| `full` | 所有工具（默认） |
| `coding` | 文件 I/O、运行时、会话、内存、image |
| `messaging` | 消息、会话列表/历史/发送/状态 |
| `minimal` | 仅 `session_status` |

### 工具组

在 allow/deny 列表中使用 `group:*` 简写：

| 组 | 工具 |
| -- | ---- |
| `group:runtime` | exec、bash、process、code_execution |
| `group:fs` | read、write、edit、apply_patch |
| `group:sessions` | sessions_list、sessions_history、sessions_send、sessions_spawn、sessions_yield、subagents、session_status |
| `group:memory` | memory_search、memory_get |
| `group:web` | web_search、x_search、web_fetch |
| `group:ui` | browser、canvas |
| `group:automation` | cron、gateway |
| `group:messaging` | message |
| `group:nodes` | nodes |
| `group:openclaw` | 所有内置 OpenClaw 工具（不包括插件工具） |

### 特定提供商的限制

使用 `tools.byProvider` 为特定提供商限制工具，而不更改全局默认值：

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
