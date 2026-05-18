---
mmh3_hash: "a5f9635c8e1f90c90795d7fc2f7a47d8"
doc-schema-version: 1
summary: "OpenClaw 工具、技能和 Plugin 概览：Agent 可以调用什么以及如何扩展能力"
read_when:
  - 您想了解 OpenClaw 提供哪些工具
  - 您正在选择内置工具、技能和 Plugin
  - 您需要工具策略、自动化或 Agent 协调的文档入口
title: "概览"
---

使用本页选择合适的能力入口。**工具**是可调用的操作，**技能**教 Agent 如何工作，**Plugin** 添加运行时能力，例如工具、Provider、Channel、Hook 和打包的技能。

本页是概览和路由页。如需完整的工具策略、默认值、组成员、Provider 限制和配置字段，请使用[工具和自定义 Provider](/gateway/config-tools)。

## 从这里开始

对于大多数 Agent，从内置工具类别开始，仅在 Agent 应看到更少工具或需要显式主机访问时才调整策略。

| 如果您需要...                        | 首先使用                                           | 然后阅读                                                                        |
| ------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| 让 Agent 使用现有能力执行操作        | [内置工具](#built-in-tool-categories)              | [工具类别](#built-in-tool-categories)                                           |
| 控制 Agent 可以调用什么              | [工具策略](#configure-access-and-approvals)        | [工具和自定义 Provider](/gateway/config-tools)                                  |
| 教 Agent 一个工作流                  | [技能](#choose-tools-skills-or-plugins)            | [技能](/tools/skills) 和 [创建技能](/tools/creating-skills)                     |
| 添加新集成或运行时入口               | [Plugin](#extend-capabilities)                     | [Plugin](/tools/plugin) 和 [构建 Plugin](/plugins/building-plugins)             |
| 稍后或在后台运行工作                 | [自动化](/automation)                              | [自动化概览](/automation)                                                        |
| 协调多个 Agent 或运行框架            | [子 Agent](/tools/subagents)                       | [ACP Agent](/tools/acp-agents) 和 [Agent 发送](/tools/agent-send)               |
| 搜索大型 PI 工具目录                 | [Tool Search](/tools/tool-search)                  | [Tool Search](/tools/tool-search)                                               |

## 选择工具、技能或 Plugin

<Steps>
  <Step title="当 Agent 需要执行操作时使用工具">
    工具是 Agent 可以调用的类型化函数，例如 `exec`、`browser`、`web_search`、`message` 或 `image_generate`。当 Agent 需要读取数据、修改文件、发送消息、调用 Provider 或操作其他系统时使用工具。可见工具以结构化函数定义的形式发送给模型。

    模型只能看到通过活动配置文件、允许/拒绝策略、Provider 限制、沙盒状态、Channel 权限和 Plugin 可用性的工具。

  </Step>

  <Step title="当 Agent 需要指令时使用技能">
    技能是加载到 Agent 提示词中的 `SKILL.md` 指令包。当 Agent 已有所需工具，但需要可重复的工作流、审核规范、命令序列或操作约束时，使用技能。

    技能可以存放在工作区、共享技能目录、托管的 OpenClaw 技能根目录或 Plugin 包中。

    [技能](/tools/skills) | [创建技能](/tools/creating-skills) | [技能配置](/tools/skills-config)

  </Step>

  <Step title="当 OpenClaw 需要新能力时使用 Plugin">
    Plugin 可以添加工具、技能、Channel、模型 Provider、语音、实时语音、媒体生成、Web 搜索、Web 抓取、Hook 和其他运行时能力。当该能力包含代码、凭据、生命周期 Hook、清单元数据或可安装打包时，使用 Plugin。现有 Plugin 可从 ClawHub、npm、git、本地目录或归档文件安装。

    [安装和配置 Plugin](/tools/plugin) | [构建 Plugin](/plugins/building-plugins) | [Plugin SDK](/plugins/sdk-overview)

  </Step>
</Steps>

## 内置工具类别

下表列出了代表性工具，以便您了解各入口。这不是完整的策略参考。如需精确的组、默认值和允许/拒绝语义，请使用[工具和自定义 Provider](/gateway/config-tools)。

| 类别               | 当 Agent 需要...                                                              | 代表性工具                                                           | 下一步阅读                                                             |
| ------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 运行时             | 运行命令、管理进程或使用 Provider 支持的 Python 分析                          | `exec`、`process`、`code_execution`                                  | [Exec](/tools/exec)、[代码执行](/tools/code-execution)                 |
| 文件               | 读取和修改工作区文件                                                          | `read`、`write`、`edit`、`apply_patch`                               | [Apply Patch](/tools/apply-patch)                                      |
| Web                | 搜索网页、搜索 X 帖子或抓取可读页面内容                                      | `web_search`、`x_search`、`web_fetch`                                | [Web 工具](/tools/web)、[Web Fetch](/tools/web-fetch)                  |
| Browser            | 操作 Browser Session                                                          | `browser`                                                            | [Browser](/tools/browser)                                              |
| 消息和 Channel     | 发送回复或 Channel 操作                                                       | `message`                                                            | [Agent 发送](/tools/agent-send)                                        |
| Session 和 Agent   | 检查 Session、委派工作、引导另一个运行或报告状态                              | `sessions_*`、`subagents`、`agents_list`、`session_status`           | [子 Agent](/tools/subagents)、[Session 工具](/concepts/session-tool)   |
| 自动化             | 调度工作或响应后台事件                                                        | `cron`、`heartbeat_respond`                                          | [自动化](/automation)                                                  |
| Gateway 和节点     | 检查 Gateway 状态或配对的目标设备                                             | `gateway`、`nodes`                                                   | [Gateway 配置](/gateway/configuration)、[节点](/nodes)                 |
| 媒体               | 分析、生成或播放媒体                                                          | `image`、`image_generate`、`music_generate`、`video_generate`、`tts` | [媒体概览](/tools/media-overview)                                      |
| 大型 PI 目录       | 搜索和调用许多合适的工具，而无需将每个 schema 发送给模型                      | `tool_search_code`、`tool_search`、`tool_describe`                   | [Tool Search](/tools/tool-search)                                      |

<Note>
Tool Search 是实验性的 PI Agent 入口。Codex 运行框架使用 Codex 原生代码模式、原生工具搜索、延迟动态工具和嵌套工具调用，而非 `tools.toolSearch`。
</Note>

## Plugin 提供的工具

Plugin 可以注册额外的工具。Plugin 作者通过 `api.registerTool(...)` 和清单的 `contracts.tools` 注册工具；合约详情请使用 [Plugin SDK](/plugins/sdk-overview) 和 [Plugin 清单](/plugins/manifest)。

常见的 Plugin 提供工具包括：

- [Diffs](/tools/diffs)：用于渲染文件和 Markdown 差异
- [LLM Task](/tools/llm-task)：用于仅 JSON 工作流步骤
- [Lobster](/tools/lobster)：带可恢复批准的类型化工作流
- [Tokenjuice](/tools/tokenjuice)：压缩嘈杂的 `exec` 和 `bash` 工具输出
- [Tool Search](/tools/tool-search)：在不将每个 schema 放入提示词的情况下发现和调用大型工具目录
- [Canvas](/plugins/reference/canvas)：用于节点 Canvas 控制和 A2UI 渲染

## 配置访问和批准

工具策略在模型调用前执行。如果策略移除了某个工具，模型在该轮次不会收到该工具的 schema。运行可能因全局配置、每 Agent 配置、Channel 策略、Provider 限制、沙盒规则、仅所有者门控或 Plugin 可用性而失去工具。

- [工具和自定义 Provider](/gateway/config-tools) 记录了工具配置文件、允许/拒绝列表、Provider 特定限制、循环检测和 Provider 支持的工具设置。
- [Exec 批准](/tools/exec-approvals) 记录了主机命令批准策略。
- [Elevated exec](/tools/elevated) 记录了沙盒外的受控执行。
- [沙盒 vs 工具策略 vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) 解释了哪一层控制文件和进程访问。
- [每 Agent 沙盒和工具限制](/tools/multi-agent-sandbox-tools) 记录了委派运行的 Agent 特定限制。

## 扩展能力

根据您希望 OpenClaw 完成的任务选择扩展路径：

- 使用 [Plugin](/tools/plugin) 安装或管理现有 Plugin。
- 使用[构建 Plugin](/plugins/building-plugins) 构建新的集成、Provider、Channel、工具或 Hook。
- 使用[技能](/tools/skills)和[创建技能](/tools/creating-skills)添加或调整可复用的 Agent 指令。
- 当工作流属于 Plugin 分发的技能包时，使用 [Skill workshop](/plugins/skill-workshop) 打包可复用的工作流材料。
- 当您需要实现合约时，使用 [Plugin SDK](/plugins/sdk-overview) 和 [Plugin 清单](/plugins/manifest)。

## 排查缺失工具

如果模型无法看到或调用某个工具，从当前轮次的有效策略开始排查：

1. 在[工具和自定义 Provider](/gateway/config-tools) 中检查活动配置文件、`tools.allow` 和 `tools.deny`。
2. 在[工具和自定义 Provider](/gateway/config-tools) 中检查 Provider 特定限制，并确认所选[模型 Provider](/concepts/model-providers) 是否支持该工具形状。
3. 使用[沙盒 vs 工具策略 vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) 和 [Elevated exec](/tools/elevated) 检查 Channel 权限、沙盒状态和 Elevated 访问。
4. 在 [Plugin](/tools/plugin) 中检查拥有该工具的 Plugin 是否已安装并启用。
5. 对于委派运行，在[每 Agent 沙盒和工具限制](/tools/multi-agent-sandbox-tools) 中检查每 Agent 限制。
6. 对于大型 PI 目录，确认运行使用的是直接工具暴露还是 [Tool Search](/tools/tool-search)。

## 相关

- [自动化](/automation)：cron、任务、心跳、承诺、Hook、常驻命令和 Task Flow
- [Agent](/concepts/agent)：Agent 模型、Session、记忆和多 Agent 协调
- [工具和自定义 Provider](/gateway/config-tools)：规范的工具策略参考
- [Plugin](/tools/plugin)：Plugin 安装和管理
- [Plugin SDK](/plugins/sdk-overview)：Plugin 作者参考
- [技能](/tools/skills)：技能加载顺序、门控和配置
- [Tool Search](/tools/tool-search)：紧凑的 PI 工具目录发现
