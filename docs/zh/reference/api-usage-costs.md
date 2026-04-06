---
mmh3_hash: "3e3f3b6f7cc0a083fcf6961c53f470e6"
summary: "审计哪些功能可能花费资金、使用哪些密钥以及如何查看使用情况"
read_when:
  - 您想了解哪些功能可能调用付费 API
  - 您需要审计密钥、费用和使用可见性
  - 您在解释 /status 或 /usage 费用报告
title: "API 使用量与费用"
---

# API 使用量与费用

本文档列出了**可以调用 API 密钥的功能**以及它们的费用出现在哪里。它专注于可能产生提供商使用量或付费 API 调用的 OpenClaw 功能。

## 费用在哪里显示（聊天 + CLI）

**每 Session 费用快照**

- `/status` 显示当前 Session 模型、上下文使用情况和最后响应的 token 数。
- 如果模型使用 **API 密钥身份验证**，`/status` 还会显示最后一次回复的**估计费用**。
- 如果实时 Session 元数据稀少，`/status` 可以从最新的转录使用条目中恢复 token/缓存计数器和活动运行时模型标签。现有的非零实时值仍然优先，当存储的总计缺失或更小时，提示大小的转录总计可以胜出。

**每消息费用页脚**

- `/usage full` 为每条回复附加一个使用页脚，包括**估计费用**（仅 API 密钥）。
- `/usage tokens` 仅显示 token；订阅式 OAuth/token 和 CLI 流程隐藏美元费用。
- Gemini CLI 注意：当 CLI 返回 JSON 输出时，OpenClaw 从 `stats` 读取使用情况，将 `stats.cached` 规范化为 `cacheRead`，并在需要时从 `stats.input_tokens - stats.cached` 推导输入 token。

Anthropic 注意：Anthropic 的公开 Claude Code 文档仍然将直接 Claude Code 终端使用量计入 Claude 计划限制。另外，Anthropic 告知 OpenClaw 用户，从 **2026 年 4 月 4 日太平洋时间下午 12:00 / 英国夏令时间晚上 8:00** 起，**OpenClaw** 的 Claude 登录路径作为第三方工具使用量，需要独立于订阅的**额外使用量**计费。Anthropic 不会公开 OpenClaw 可以在 `/usage full` 中显示的每消息美元估算。

**CLI 使用窗口（提供商配额）**

- `openclaw status --usage` 和 `openclaw channels list` 显示提供商**使用窗口**（配额快照，不是每消息费用）。
- 人性化输出规范化为各提供商统一的 `X% left`。
- 当前使用窗口提供商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、小米和 z.ai。
- MiniMax 注意：其原始 `usage_percent` / `usagePercent` 字段表示剩余配额，因此 OpenClaw 在显示前将其反转。当存在基于计数的字段时仍然优先使用。如果提供商返回 `model_remains`，OpenClaw 优先使用聊天模型条目，在需要时从时间戳推导窗口标签，并在计划标签中包含模型名称。
- 这些配额窗口的使用身份验证来自提供商特定的钩子（如果可用）；否则 OpenClaw 回退到从身份验证配置文件、环境或配置中匹配 OAuth/API 密钥凭据。

有关详细信息和示例，请参见 [Token 使用与费用](/reference/token-use)。

## 如何发现密钥

OpenClaw 可以从以下位置获取凭据：

- **身份验证配置文件**（每个 Agent，存储在 `auth-profiles.json` 中）。
- **环境变量**（例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`）。
- **配置**（`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`memorySearch.*`、`talk.providers.*.apiKey`）。
- **技能**（`skills.entries.<name>.apiKey`），可能会将密钥导出到技能进程环境。

## 可能消耗密钥的功能

### 1) 核心模型响应（聊天 + 工具）

每次回复或工具调用都使用**当前模型提供商**（OpenAI、Anthropic 等）。这是使用量和费用的主要来源。

这还包括仍然在 OpenClaw 本地 UI 之外计费的订阅式托管提供商，如 **OpenAI Codex**、**阿里云模型工作室编码计划**、**MiniMax 编码计划**、**Z.AI / GLM 编码计划**，以及启用了**额外使用量**的 Anthropic 的 OpenClaw Claude 登录路径。

有关定价配置，请参见[模型](/providers/models)；有关显示，请参见[Token 使用与费用](/reference/token-use)。

### 2) 媒体理解（音频/图像/视频）

入站媒体可以在回复运行前进行摘要/转录。这使用模型/提供商 API。

- 音频：OpenAI / Groq / Deepgram / Google / Mistral。
- 图像：OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI。
- 视频：Google / Qwen / Moonshot。

请参见[媒体理解](/nodes/media-understanding)。

### 3) 图像和视频生成

共享生成功能也可能消耗提供商密钥：

- 图像生成：OpenAI / Google / fal / MiniMax
- 视频生成：Qwen

当 `agents.defaults.imageGenerationModel` 未设置时，图像生成可以推断基于身份验证的提供商默认值。视频生成目前需要明确的 `agents.defaults.videoGenerationModel`，例如 `qwen/wan2.6-t2v`。

请参见[图像生成](/tools/image-generation)、[Qwen Cloud](/providers/qwen) 和[模型](/concepts/models)。

### 4) 记忆嵌入 + 语义搜索

当配置为远程提供商时，语义记忆搜索使用**嵌入 API**：

- `memorySearch.provider = "openai"` → OpenAI 嵌入
- `memorySearch.provider = "gemini"` → Gemini 嵌入
- `memorySearch.provider = "voyage"` → Voyage 嵌入
- `memorySearch.provider = "mistral"` → Mistral 嵌入
- `memorySearch.provider = "ollama"` → Ollama 嵌入（本地/自托管；通常无托管 API 计费）
- 可选回退到远程提供商（如果本地嵌入失败）

使用 `memorySearch.provider = "local"` 可以保持本地（无 API 使用）。

请参见[记忆](/concepts/memory)。

### 5) 网络搜索工具

`web_search` 可能会根据您的提供商产生使用费用：

- **Brave Search API**：`BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**：`EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**：`FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini（Google Search）**：`GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`
- **Grok（xAI）**：`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi（Moonshot）**：`KIMI_API_KEY`、`MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**：`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**：默认无需密钥，但需要可访问的 Ollama 主机和 `ollama signin`；当主机需要时也可以重用普通 Ollama 提供商 bearer 身份验证
- **Perplexity Search API**：`PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**：`TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**：免费回退（无 API 计费，但非官方且基于 HTML）
- **SearXNG**：`SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（免费/自托管；无托管 API 计费）

旧版 `tools.web.search.*` 提供商路径仍通过临时兼容性填充加载，但不再是推荐的配置界面。

**Brave Search 免费额度：** 每个 Brave 计划包含每月 \$5 的可更新免费额度。Search 计划每 1,000 次请求收费 \$5，因此该额度涵盖每月 1,000 次免费请求。在 Brave 仪表板中设置使用限制以避免意外收费。

请参见[网络工具](/tools/web)。

### 5) 网页抓取工具（Firecrawl）

`web_fetch` 在存在 API 密钥时可以调用 **Firecrawl**：

- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webFetch.apiKey`

如果未配置 Firecrawl，该工具回退到直接抓取 + 可读性处理（无付费 API）。

请参见[网络工具](/tools/web)。

### 6) 提供商使用快照（状态/健康）

某些状态命令调用**提供商使用端点**以显示配额窗口或身份验证健康状态。这些通常是低量调用，但仍然会访问提供商 API：

- `openclaw status --usage`
- `openclaw models status --json`

请参见[模型 CLI](/cli/models)。

### 7) 压缩保障摘要

压缩保障可以使用**当前模型**对 Session 历史进行摘要，这在运行时会调用提供商 API。

请参见[Session 管理 + 压缩](/reference/session-management-compaction)。

### 8) 模型扫描 / 探测

`openclaw models scan` 可以探测 OpenRouter 模型，并在启用探测时使用 `OPENROUTER_API_KEY`。

请参见[模型 CLI](/cli/models)。

### 9) Talk（语音）

Talk 模式在配置时可以调用 **ElevenLabs**：

- `ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`

请参见[Talk 模式](/nodes/talk)。

### 10) 技能（第三方 API）

技能可以在 `skills.entries.<name>.apiKey` 中存储 `apiKey`。如果技能将该密钥用于外部 API，则可能根据技能提供商产生费用。

请参见[技能](/tools/skills)。
