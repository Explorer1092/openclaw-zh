---
title: "工具和 Plugin"
mmh3_hash: "0e7de821be16ea194276d585201fd7af"
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
    Plugin 是一个可以注册任意组合能力的包：Channel、模型 Provider、工具、技能、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取、Web 搜索等。某些 Plugin 是**核心**的（随 OpenClaw 附带），其他是**外部**的（由社区发布在 npm 上）。

    [安装和配置 Plugin](/tools/plugin) | [构建自己的 Plugin](/plugins/building-plugins)

  </Step>
</Steps>

## 内置工具

这些工具随 OpenClaw 一起提供，无需安装任何 Plugin 即可使用：

| 工具                                       | 功能                                                                  | 页面                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------- |
| `exec` / `process`                         | 运行 Shell 命令，管理后台进程                                         | [Exec](/tools/exec)、[Exec 批准](/tools/exec-approvals) |
| `code_execution`                           | 运行沙盒远程 Python 分析                                              | [Code Execution](/tools/code-execution)     |
| `browser`                                  | 控制 Chromium 浏览器（导航、点击、截图）                              | [浏览器](/tools/browser)                    |
| `web_search` / `x_search` / `web_fetch`    | 搜索网页，搜索 X 帖子，抓取页面内容                                   | [Web](/tools/web)、[Web Fetch](/tools/web-fetch) |
| `read` / `write` / `edit`                  | 工作区中的文件 I/O                                                    |                                             |
| `apply_patch`                              | 多块文件补丁                                                          | [Apply Patch](/tools/apply-patch)           |
| `message`                                  | 跨所有 Channel 发送消息                                               | [Agent Send](/tools/agent-send)             |
| `nodes`                                    | 发现和定位配对设备                                                    |                                             |
| `cron` / `gateway`                         | 管理定时任务；检查、修补、重启或更新 Gateway                          |                                             |
| `image` / `image_generate`                 | 分析或生成图像                                                        | [Image Generation](/tools/image-generation) |
| `music_generate`                           | 生成音乐曲目                                                          | [Music Generation](/tools/music-generation) |
| `video_generate`                           | 生成视频                                                              | [Video Generation](/tools/video-generation) |
| `tts`                                      | 一次性文字转语音转换                                                  | [TTS](/tools/tts)                           |
| `sessions_*` / `subagents` / `agents_list` | Session 管理、状态和子 Agent 编排                                     | [子 Agent](/tools/subagents)                |
| `session_status`                           | 轻量级 `/status` 风格的回读和 Session 模型覆盖                        | [Session 工具](/concepts/session-tool)      |

对于图像工作，使用 `image` 进行分析，使用 `image_generate` 进行生成或编辑。如果你针对 `openai/*`、`google/*`、`fal/*` 或其他非默认图像 Provider，请先配置该 Provider 的认证/API 密钥。

对于音乐工作，使用 `music_generate`。如果你针对 `google/*`、`minimax/*` 或其他非默认音乐 Provider，请先配置该 Provider 的认证/API 密钥。

对于视频工作，使用 `video_generate`。如果你针对 `qwen/*` 或其他非默认视频 Provider，请先配置该 Provider 的认证/API 密钥。

对于工作流驱动的音频生成，当 ComfyUI 等 Plugin 注册时使用 `music_generate`。这与 `tts`（文字转语音）不同。

`session_status` 是 sessions 组中的轻量级状态/回读工具。它回答有关当前 Session 的 `/status` 风格问题，并可选地设置每 Session 的模型覆盖；`model=default` 清除该覆盖。与 `/status` 一样，它可以从最新的转录使用条目中补充稀疏的令牌/缓存计数器和活跃运行时模型标签。

`gateway` 是用于 Gateway 操作的仅所有者运行时工具：

- `config.schema.lookup` 用于在编辑前查看一个路径范围的配置子树
- `config.get` 用于当前配置快照 + 哈希
- `config.patch` 用于带重启的部分配置更新
- `config.apply` 仅用于完整配置替换
- `update.run` 用于显式自我更新 + 重启

对于部分更改，优先使用 `config.schema.lookup` 然后 `config.patch`。仅在有意替换整个配置时使用 `config.apply`。更广泛的配置文档请阅读 [配置](/gateway/configuration) 和 [配置参考](/gateway/configuration-reference)。该工具还拒绝更改 `tools.exec.ask` 或 `tools.exec.security`；旧版 `tools.bash.*` 别名规范化为相同的受保护 exec 路径。

### Plugin 提供的工具

Plugin 可以注册额外的工具。一些示例：

- [Canvas](/plugins/reference/canvas) — 用于节点 Canvas 控制和 A2UI 渲染的实验性捆绑 Plugin
- [Diffs](/tools/diffs) — diff 查看器和渲染器
- [LLM Task](/tools/llm-task) — 用于结构化输出的仅 JSON LLM 步骤
- [Lobster](/tools/lobster) — 带可恢复批准的类型化工作流运行时
- [Music Generation](/tools/music-generation) — 带工作流支持 Provider 的共享 `music_generate` 工具
- [OpenProse](/prose) — Markdown 优先的工作流编排
- [Tokenjuice](/tools/tokenjuice) — 压缩嘈杂的 `exec` 和 `bash` 工具结果

[Tool Search](/tools/tool-search) 是大型目录的紧凑入口。OpenClaw 不再将所有 OpenClaw、MCP 或客户端工具 schema 放入提示词，而是可以为模型提供一个隔离的 Node 运行时，内含 `openclaw.tools.search`、`openclaw.tools.describe` 和 `openclaw.tools.call`。调用仍通过 Gateway 回流，因此工具策略、批准、Hook 和 Session 日志保持权威性。

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

当显式允许列表解析为没有可调用的工具时，OpenClaw 会安全失败。例如，`tools.allow: ["query_db"]` 仅在已加载的 Plugin 实际注册了 `query_db` 时才有效。如果没有内置、Plugin 或捆绑的 MCP 工具匹配允许列表，运行会在模型调用之前停止，而不是继续进行可能产生幻觉工具结果的纯文本运行。

### 工具配置文件

`tools.profile` 在应用 `allow`/`deny` 之前设置基础允许列表。每个 Agent 覆盖：`agents.list[].tools.profile`。

| 配置文件    | 包含内容                                                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | 所有核心和可选 Plugin 工具；更广泛命令/控制访问的无限制基线                                                                                     |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`music_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                                        |
| `minimal`   | 仅 `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` 对于以 Channel 为中心的 Agent 来说是有意收窄的。它不包含更广泛的命令/控制工具，如文件系统、运行时、浏览器、canvas、nodes、cron 和 gateway 控制。使用 `tools.profile: "full"` 作为更广泛命令/控制访问的无限制基线，然后在需要时通过 `tools.allow` / `tools.deny` 修剪访问权限。
</Note>

`coding` 包含轻量级 Web 工具（`web_search`、`web_fetch`、`x_search`），但不包含完整的浏览器控制工具。浏览器自动化可以驱动真实的 Session 和已登录的配置文件，因此请使用 `tools.alsoAllow: ["browser"]` 或每个 Agent 的 `agents.list[].tools.alsoAllow: ["browser"]` 显式添加它。

<Note>
在限制性配置文件（`messaging`、`minimal`）下配置 `tools.exec` 或 `tools.fs` 并不会隐式扩展配置文件的允许列表。当你想要限制性配置文件使用这些已配置的部分时，请添加明确的 `tools.alsoAllow` 条目（例如，exec 用 `["exec", "process"]`，fs 用 `["read", "write", "edit"]`）。当配置部分存在但没有匹配的 `alsoAllow` 授权时，OpenClaw 会在启动时记录警告。
</Note>

`coding` 和 `messaging` 配置文件还允许在 Plugin 键 `bundle-mcp` 下配置的捆绑 MCP 工具。当你想要配置文件保留其正常内置工具但隐藏所有配置的 MCP 工具时，添加 `tools.deny: ["bundle-mcp"]`。`minimal` 配置文件不包含捆绑 MCP 工具。

### 工具组

在允许/拒绝列表中使用 `group:*` 简写：

| 组                 | 工具                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution（`bash` 作为 `exec` 的别名被接受）                                          |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser；启用捆绑 Canvas Plugin 时加上 canvas                                                            |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | 所有内置 OpenClaw 工具（不包括 Plugin 工具）                                                              |

`sessions_history` 返回有界的、经安全过滤的回溯视图。它会去除 thinking 标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>` 等）、降级的工具调用脚手架、泄漏的 ASCII/全角模型控制令牌，以及来自助手文本的格式错误的 MiniMax 工具调用 XML，然后应用修订/截断，而不是作为原始转录导出。

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
