---
title: "工具和 Plugin"
mmh3_hash: "a6a542bb40edfc99be542e548f924ab8"
summary: "OpenClaw 工具和 Plugin 概览：Agent 可以做什么以及如何扩展它"
read_when:
  - 了解 OpenClaw 提供哪些工具
  - 需要配置、允许或拒绝工具
  - 在内置工具、技能和 Plugin 之间做决定
---

# 工具和 Plugin

Agent 除了生成文本之外的所有操作都通过**工具**完成。工具是 Agent 读取文件、运行命令、浏览网页、发送消息以及与设备交互的方式。

## 工具、技能和 Plugin

OpenClaw 有三个协同工作的层次：

<Steps>
  <Step title="工具是 Agent 调用的内容">
    工具是 Agent 可以调用的类型化函数（例如 `exec`、`browser`、`web_search`、`message`）。OpenClaw 附带一组**内置工具**，Plugin 可以注册额外的工具。

    Agent 将工具视为发送到模型 API 的结构化函数定义。

  </Step>

  <Step title="技能教 Agent 何时以及如何使用工具">
    技能是注入到系统提示中的 Markdown 文件（`SKILL.md`）。技能为 Agent 提供上下文、约束以及有效使用工具的逐步指导。技能存放在你的工作区、共享文件夹中，或随 Plugin 一起打包。

    [技能参考](/tools/skills) | [创建技能](/tools/creating-skills)

  </Step>

  <Step title="Plugin 将所有内容打包在一起">
    Plugin 是一个可以注册任意组合能力的包：Channel、模型 Provider、工具、技能、语音、图像生成等。某些 Plugin 是**核心**的（随 OpenClaw 附带），其他是**外部**的（由社区发布在 npm 上）。

    [安装和配置 Plugin](/tools/plugin) | [构建自己的 Plugin](/plugins/building-plugins)

  </Step>
</Steps>

## 内置工具

这些工具随 OpenClaw 一起提供，无需安装任何 Plugin 即可使用：

| 工具                         | 功能                                                     | 页面                              |
| ---------------------------- | -------------------------------------------------------- | --------------------------------- |
| `exec` / `process`           | 运行 Shell 命令，管理后台进程                            | [Exec](/tools/exec)               |
| `browser`                    | 控制 Chromium 浏览器（导航、点击、截图）                 | [浏览器](/tools/browser)          |
| `web_search` / `web_fetch`   | 搜索网页，抓取页面内容                                   | [Web](/tools/web)                 |
| `read` / `write` / `edit`    | 工作区中的文件 I/O                                       |                                   |
| `apply_patch`                | 多块文件补丁                                             | [Apply Patch](/tools/apply-patch) |
| `message`                    | 跨所有 Channel 发送消息                                  | [Agent Send](/tools/agent-send)   |
| `canvas`                     | 驱动节点 Canvas（present、eval、snapshot）               |                                   |
| `nodes`                      | 发现和定位配对设备                                       |                                   |
| `cron` / `gateway`           | 管理定时任务，重启 Gateway                               |                                   |
| `image` / `image_generate`   | 分析或生成图像                                           |                                   |
| `sessions_*` / `agents_list` | Session 管理，子 Agent                                   | [子 Agent](/tools/subagents)      |

对于图像工作，使用 `image` 进行分析，使用 `image_generate` 进行生成或编辑。如果你针对 `openai/*`、`google/*`、`fal/*` 或其他非默认图像 Provider，请先配置该 Provider 的认证/API 密钥。

### Plugin 提供的工具

Plugin 可以注册额外的工具。一些示例：

- [Lobster](/tools/lobster) — 带可恢复批准的类型化工作流运行时
- [LLM Task](/tools/llm-task) — 用于结构化输出的仅 JSON LLM 步骤
- [Diffs](/tools/diffs) — diff 查看器和渲染器
- [OpenProse](/prose) — Markdown 优先的工作流编排

## 工具配置

### 允许和拒绝列表

通过配置中的 `tools.allow` / `tools.deny` 控制 Agent 可以调用哪些工具。拒绝始终优先于允许。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### 工具配置文件

`tools.profile` 在应用 `allow`/`deny` 之前设置基础允许列表。每个 Agent 覆盖：`agents.list[].tools.profile`。

| 配置文件    | 包含内容                            |
| ----------- | ----------------------------------- |
| `full`      | 所有工具（默认）                    |
| `coding`    | 文件 I/O、运行时、Session、内存、图像|
| `messaging` | 消息、Session 列表/历史/发送/状态   |
| `minimal`   | 仅 `session_status`                 |

### 工具组

在允许/拒绝列表中使用 `group:*` 简写：

| 组                 | 工具                                                                           |
| ------------------ | ------------------------------------------------------------------------------ |
| `group:runtime`    | exec, bash, process                                                            |
| `group:fs`         | read, write, edit, apply_patch                                                 |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, session_status |
| `group:memory`     | memory_search, memory_get                                                      |
| `group:web`        | web_search, web_fetch                                                          |
| `group:ui`         | browser, canvas                                                                |
| `group:automation` | cron, gateway                                                                  |
| `group:messaging`  | message                                                                        |
| `group:nodes`      | nodes                                                                          |
| `group:openclaw`   | 所有内置 OpenClaw 工具（不包括 Plugin 工具）                                   |

### 特定 Provider 的限制

使用 `tools.byProvider` 为特定 Provider 限制工具，而无需更改全局默认值：

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
