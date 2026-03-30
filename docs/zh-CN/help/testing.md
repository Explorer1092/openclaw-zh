---
read_when:
  - 在本地或 CI 中运行测试
  - 为模型/提供商问题添加回归测试
  - 调试 Gateway 网关 + 智能体行为
summary: 测试套件：单元/端到端/实时测试套件、Docker 运行器，以及每个测试的覆盖范围
title: 测试
x-i18n:
  generated_at: "2026-02-03T09:23:12Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 16678895a94df3eca64dc2d57478f423ac5d16f1a0b5af07a90def186a80963d
  source_path: help/testing.md
  workflow: 15
---

# 测试

OpenClaw 包含三个 Vitest 测试套件（单元/集成、端到端、实时）以及一小组 Docker 运行器。

本文档是一份"我们如何测试"的指南：

- 每个套件覆盖什么（以及它刻意*不*覆盖什么）
- 常见工作流程应运行哪些命令（本地、推送前、调试）
- 实时测试如何发现凭证并选择模型/提供商
- 如何为现实中的模型/提供商问题添加回归测试

## 快速开始

日常使用：

- 完整检查（推送前的预期流程）：`pnpm build && pnpm check && pnpm test`
- 在大内存机器上更快地运行完整套件：`pnpm test:max`

当你修改测试或需要额外的信心时：

- 覆盖率检查：`pnpm test:coverage`
- 端到端套件：`pnpm test:e2e`

调试真实提供商/模型时（需要真实凭证）：

- 实时套件（模型 + Gateway 网关工具/图像探测）：`pnpm test:live`
- 静默运行单个实时文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`

提示：当你只需要一个失败用例时，建议使用下文描述的允许列表环境变量来缩小实时测试范围。

## 测试套件（在哪里运行什么）

可以将这些套件理解为"逐渐增强的真实性"（以及逐渐增加的不稳定性/成本）：

### 单元/集成测试（默认）

- 命令：`pnpm test`
- 配置：`scripts/test-parallel.mjs`（运行 `vitest.unit.config.ts`、`vitest.extensions.config.ts`、`vitest.gateway.config.ts`）
- 文件：`src/**/*.test.ts`，捆绑插件的 `**/*.test.ts`
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 已知问题的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
- 调度器注意事项：
  - `pnpm test` 保留一份小型已签入的行为清单，用于真正的线程池/隔离覆盖，以及针对最慢单元文件的独立计时快照。
  - 共享单元、扩展、频道和 Gateway 网关运行全部使用 Vitest `forks`。
  - Wrapper 在 `test/fixtures/test-parallel.behavior.json` 中保持已测量的 fork 隔离例外和重量级单例 lane 的显式记录。
  - Wrapper 将最重的已测量文件剥离到专用 lane，而非依赖不断增长的手动维护排除列表。
  - 通过 `pnpm test:perf:update-timings` 和 `pnpm test:perf:update-timings:extensions` 在套件结构大幅变化后刷新计时快照。
- 线程池注意事项：
  - 基础 Vitest 配置默认使用 `forks`。
  - 单元、频道、扩展和 Gateway 网关 Wrapper lane 全部默认使用 `forks`。
  - 单元、频道和扩展配置默认 `isolate: false` 以加快文件启动。
  - `pnpm test` 也在 Wrapper 层传递 `--isolate=false`。
  - 通过 `OPENCLAW_TEST_ISOLATE=1 pnpm test` 重新启用 Vitest 文件隔离。
- 快速本地迭代注意事项：
  - `pnpm test:changed` 使用 `--changed origin/main` 运行 Wrapper。
  - `pnpm test:changed:max` 保持相同的变更文件过滤器，但使用 Wrapper 的激进本地规划器配置文件。
  - `pnpm test:max` 为完整本地运行暴露相同的规划器配置文件。
  - Wrapper 保持 `OPENCLAW_VITEST_FS_MODULE_CACHE` 在受支持的主机上启用，但分配 lane 本地的 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH`，防止并发 Vitest 进程在一个共享的实验性缓存目录上产生竞争。
  - 设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` 以指定直接单次运行性能分析的显式缓存位置。

### 端到端测试（Gateway 网关冒烟测试）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP 接口、节点配对和较重的网络操作
- 预期：
  - 在 CI 中运行（当在流水线中启用时）
  - 不需要真实密钥
  - 比单元测试有更多活动部件（可能较慢）

### 实时测试（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`
- 默认：通过 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - "这个提供商/模型用真实凭证*今天*实际能工作吗？"
  - 捕获提供商格式变更、工具调用怪癖、认证问题和速率限制行为
- 预期：
  - 设计上不适合 CI 稳定运行（真实网络、真实提供商策略、配额、故障）
  - 花费金钱/使用速率限制
  - 建议运行缩小范围的子集而非"全部"
- 实时运行会加载 `~/.profile` 以获取缺失的 API 密钥。
- 默认情况下，实时运行仍会隔离 `HOME` 并将配置/认证材料复制到临时测试 home，以防止单元 fixtures 修改你真实的 `~/.openclaw`。
- 仅在你有意需要实时测试使用真实 home 目录时才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认为更安静的模式：保留 `[live] ...` 进度输出，但抑制额外的 `~/.profile` 通知并静音 Gateway 网关启动日志/Bonjour 噪声。如需完整启动日志，设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（提供商特定）：使用逗号/分号格式设置 `*_API_KEYS`，或使用 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或通过 `OPENCLAW_LIVE_*_KEY` 进行每次实时覆盖；测试在遇到速率限制响应时会重试。

## 我应该运行哪个套件？

使用这个决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果改动较大，加上 `pnpm test:coverage`）
- 涉及 Gateway 网关网络/WS 协议/配对：加上 `pnpm test:e2e`
- 调试"我的机器人挂了"/提供商特定故障/工具调用：运行缩小范围的 `pnpm test:live`

## 实时测试：模型冒烟测试（配置文件密钥）

实时测试分为两层，以便隔离故障：

- "直接模型"告诉我们提供商/模型是否能用给定的密钥正常响应。
- "Gateway 网关冒烟测试"告诉我们完整的 Gateway 网关 + 智能体管道是否对该模型正常工作（会话、历史记录、工具、沙箱策略等）。

### 第一层：直接模型补全（无 Gateway 网关）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举发现的模型
  - 使用 `getApiKeyForModel` 选择你有凭证的模型
  - 每个模型运行一个小型补全（以及需要时的针对性回归测试）
- 如何启用：
  - `pnpm test:live`（或直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，modern 的别名）以实际运行此套件；否则会跳过以保持 `pnpm test:live` 专注于 Gateway 网关冒烟测试
- 如何选择模型：
  - `OPENCLAW_LIVE_MODELS=modern` 运行现代允许列表（Opus/Sonnet/Haiku 4.5、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是现代允许列表的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-5,..."`（逗号分隔的允许列表）
- 如何选择提供商：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔的允许列表）
- 密钥来源：
  - 默认：配置文件存储和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 以强制**仅使用配置文件存储**
- 为什么存在这个测试：
  - 将"提供商 API 损坏/密钥无效"与"Gateway 网关智能体管道损坏"分离
  - 包含小型、隔离的回归测试（例如：OpenAI Responses/Codex Responses 推理重放 + 工具调用流程）

### 第二层：Gateway 网关 + 开发智能体冒烟测试（"@openclaw"实际做的事）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 Gateway 网关
  - 创建/修补一个 `agent:dev:*` 会话（每次运行覆盖模型）
  - 遍历有密钥的模型并断言：
    - "有意义的"响应（无工具）
    - 真实的工具调用工作正常（读取探测）
    - 可选的额外工具探测（执行+读取探测）
    - OpenAI 回归路径（仅工具调用 → 后续）保持工作
- 探测详情（以便你能快速解释故障）：
  - `read` 探测：测试在工作区写入一个随机数文件，要求智能体 `read` 它并回显随机数。
  - `exec+read` 探测：测试要求智能体 `exec` 将随机数写入临时文件，然后 `read` 回来。
  - 图像探测：测试附加一个生成的 PNG（猫 + 随机代码），期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 如何启用：
  - `pnpm test:live`（或直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
- 如何选择模型：
  - 默认：现代允许列表（Opus/Sonnet/Haiku 4.5、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代允许列表的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号分隔列表）来缩小范围
- 如何选择提供商（避免"OpenRouter 全部"）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔的允许列表）
- 工具 + 图像探测在此实时测试中始终开启：
  - `read` 探测 + `exec+read` 探测（工具压力测试）
  - 当模型声明支持图像输入时运行图像探测
  - 流程（高层次）：
    - 测试生成一个带有"CAT"+ 随机代码的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式智能体将多模态用户消息转发给模型
    - 断言：回复包含 `cat` + 代码（OCR 容差：允许轻微错误）

提示：要查看你的机器上可以测试什么（以及确切的 `provider/model` ID），运行：

```bash
openclaw models list
openclaw models list --json
```

## 实时测试：Anthropic 设置令牌冒烟测试

- 测试：`src/agents/anthropic.setup-token.live.test.ts`
- 目标：验证 Claude Code CLI 设置令牌（或粘贴的设置令牌配置文件）能完成 Anthropic 提示。
- 启用：
  - `pnpm test:live`（或直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_SETUP_TOKEN=1`
- 令牌来源（选择一个）：
  - 配置文件：`OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test`
  - 原始令牌：`OPENCLAW_LIVE_SETUP_TOKEN_VALUE=sk-ant-oat01-...`
- 模型覆盖（可选）：
  - `OPENCLAW_LIVE_SETUP_TOKEN_MODEL=anthropic/claude-opus-4-5`

设置示例：

```bash
openclaw models auth paste-token --provider anthropic --profile-id anthropic:setup-token-test
OPENCLAW_LIVE_SETUP_TOKEN=1 OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test pnpm test:live src/agents/anthropic.setup-token.live.test.ts
```

## 实时测试：CLI 后端冒烟测试（Claude Code CLI 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway 网关 + 智能体管道，而不影响你的默认配置。
- 启用：
  - `pnpm test:live`（或直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 模型：`claude-cli/claude-sonnet-4-6`
  - 命令：`claude`
  - 参数：`["-p","--output-format","json","--permission-mode","bypassPermissions"]`
- 覆盖（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 发送真实图像附件（路径注入到提示中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 将图像文件路径作为 CLI 参数传递而非提示注入。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）控制设置 `IMAGE_ARG` 时如何传递图像参数。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 发送第二轮并验证恢复流程。
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` 保持 Claude Code CLI MCP 配置启用（默认使用临时空文件禁用 MCP 配置）。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-cli-backend
```

## 实时测试：ACP bind 冒烟测试（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：验证真实 ACP 对话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 就地绑定一个合成消息频道对话
  - 在同一对话上发送正常的后续消息
  - 验证后续消息出现在绑定的 ACP 会话记录中
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - ACP 智能体：`claude`
  - 合成频道：Slack DM 风格的对话上下文
  - ACP 后端：`acpx`
- 覆盖：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=/full/path/to/acpx`

示例：

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-acp-bind
```

### 推荐的实时测试配方

缩小范围的显式允许列表最快且最不易出错：

- 单个模型，直接测试（无 Gateway 网关）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单个模型，Gateway 网关冒烟测试：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个提供商的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-5,google/gemini-3-flash-preview,zai/glm-4.7,minimax/minimax-m2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 专项（Gemini API 密钥 + Antigravity）：
  - Gemini（API 密钥）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注意：

- `google/...` 使用 Gemini API（API 密钥）。
- `google-antigravity/...` 使用 Antigravity OAuth 桥接（Cloud Code Assist 风格的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（独立的认证 + 工具怪癖）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API 密钥/配置文件认证）；这是大多数用户说的"Gemini"。
  - CLI：OpenClaw 调用本地 `gemini` 二进制文件；它有自己的认证，行为可能不同（流式传输/工具支持/版本差异）。

## 实时测试：模型矩阵（我们覆盖什么）

没有固定的"CI 模型列表"（实时测试是可选的），但这些是建议在有密钥的开发机器上定期覆盖的**推荐**模型。

### 现代冒烟测试集（工具调用 + 图像）

这是我们期望保持工作的"常用模型"运行：

- OpenAI（非 Codex）：`openai/gpt-5.2`（可选：`openai/gpt-5.1`）
- OpenAI Codex：`openai-codex/gpt-5.2`（可选：`openai-codex/gpt-5.2-codex`）
- Anthropic：`anthropic/claude-opus-4-5`（或 `anthropic/claude-sonnet-4-5`）
- Google（Gemini API）：`google/gemini-3-pro-preview` 和 `google/gemini-3-flash-preview`（避免较旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/minimax-m2.7`

运行带工具 + 图像的 Gateway 网关冒烟测试：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-5,google/gemini-3-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/minimax-m2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（Read + 可选 Exec）

每个提供商系列至少选择一个：

- OpenAI：`openai/gpt-5.2`（或 `openai/gpt-5-mini`）
- Anthropic：`anthropic/claude-opus-4-5`（或 `anthropic/claude-sonnet-4-5`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/minimax-m2.7`

可选的额外覆盖（锦上添花）：

- xAI：`xai/grok-4`（或最新可用版本）
- Mistral：`mistral/`…（选择一个你已启用的"工具"能力模型）
- Cerebras：`cerebras/`…（如果你有访问权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### 视觉：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的模型（Claude/Gemini/OpenAI 视觉能力变体等）以测试图像探测。

### 聚合器/替代 Gateway 网关

如果你启用了密钥，我们也支持通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具+图像的候选模型）
- OpenCode Zen：`opencode/...`（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 认证）

如果你有凭证/配置，可以在实时矩阵中包含更多提供商：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云/API），以及任何 OpenAI/Anthropic 兼容代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档中硬编码"所有模型"。权威列表是你机器上 `discoverModels(...)` 返回的内容 + 可用的密钥。

## 凭证（绝不提交）

实时测试以与 CLI 相同的方式发现凭证。实际含义：

- 如果 CLI 能工作，实时测试应该能找到相同的密钥。
- 如果实时测试说"无凭证"，用调试 `openclaw models list`/模型选择相同的方式调试。

- 配置文件存储：`~/.openclaw/credentials/`（首选；测试中"配置文件密钥"的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）

如果你想依赖环境变量密钥（例如在 `~/.profile` 中导出的），在 `source ~/.profile` 后运行本地测试，或使用下面的 Docker 运行器（它们可以将 `~/.profile` 挂载到容器中）。

## Deepgram 实时测试（音频转录）

- 测试：`src/media-understanding/providers/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Docker 运行器（可选的"在 Linux 中工作"检查）

这些 Docker 运行器分为两类：

- 实时模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 在仓库 Docker 镜像内运行 `pnpm test:live`，挂载你的本地配置目录和工作区（如果挂载了 `~/.profile` 则会加载它）。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels` 和 `test:docker:plugins` 启动一个或多个真实容器并验证更高层次的集成路径。

实时模型 Docker 运行器也只挂载所需的 CLI 认证目录（运行未缩小时挂载所有受支持的目录），然后在运行前将其复制到容器 home，以便外部 CLI OAuth 可以刷新令牌而不修改主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP bind 冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Gateway 网关 + 开发智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI 实时冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- MCP 频道桥接（已初始化的 Gateway 网关 + stdio 桥接 + 原始 Claude 通知帧冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- 插件（安装冒烟测试 + `/plugin` 别名 + Claude 捆绑重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile` 并在运行测试前加载
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内部的缓存 CLI 安装
- `$HOME` 下的外部 CLI 认证目录只读挂载到 `/host-auth/...`，然后在测试开始前复制到 `/home/node/...`
  - 默认：挂载所有受支持的目录（`.codex`、`.claude`、`.minimax`）
  - 缩小的提供商运行只挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤提供商
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 确保凭证来自配置文件存储（而非环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 选择 Gateway 网关为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 覆盖 Open WebUI 冒烟测试使用的随机数检查提示
- `OPENWEBUI_IMAGE=...` 覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

文档编辑后运行文档检查：`pnpm check:docs`。
如需页内标题检查，运行完整 Mintlify 锚点验证：`pnpm docs:check-links:anchors`。

## 离线回归测试（CI 安全）

这些是没有真实提供商的"真实管道"回归测试：

- Gateway 网关工具调用（模拟 OpenAI，真实 Gateway 网关 + 智能体循环）：`src/gateway/gateway.tool-calling.mock-openai.test.ts`
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，写入配置 + 强制认证）：`src/gateway/gateway.wizard.e2e.test.ts`

## 智能体可靠性评估（Skills）

我们已经有一些 CI 安全的测试，它们的行为类似于"智能体可靠性评估"：

- 通过真实 Gateway 网关 + 智能体循环的模拟工具调用（`src/gateway/gateway.tool-calling.mock-openai.test.ts`）。
- 验证会话连接和配置效果的端到端向导流程（`src/gateway/gateway.wizard.e2e.test.ts`）。

对于 Skills 仍然缺少的内容（参见 [Skills](/tools/skills)）：

- **决策：** 当 Skills 在提示中列出时，智能体是否选择正确的 skill（或避免不相关的）？
- **合规性：** 智能体是否在使用前读取 `SKILL.md` 并遵循所需的步骤/参数？
- **工作流契约：** 断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来的评估应该首先保持确定性：

- 使用模拟提供商来断言工具调用 + 顺序、skill 文件读取和会话连接的场景运行器。
- 一小套专注于 skill 的场景（使用 vs 避免、门控、提示注入）。
- 可选的实时评估（可选的，环境变量门控），仅在 CI 安全套件就位后。

## 添加回归测试（指导）

当你修复在实时测试中发现的提供商/模型问题时：

- 如果可能，添加 CI 安全的回归测试（模拟/存根提供商，或捕获确切的请求形状转换）
- 如果它本质上是仅限实时的（速率限制、认证策略），保持实时测试范围小且通过环境变量可选
- 优先针对能捕获问题的最小层：
  - 提供商请求转换/重放问题 → 直接模型测试
  - Gateway 网关会话/历史/工具管道问题 → Gateway 网关实时冒烟测试或 CI 安全的 Gateway 网关模拟测试

## 契约测试（插件和频道形状）

契约测试验证每个已注册的插件和频道是否符合其接口契约。它们遍历所有发现的插件并运行一套形状和行为断言。默认的 `pnpm test` 单元 lane 有意跳过这些共享接缝和冒烟文件；当你修改共享频道或提供商接口时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅频道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 频道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基础插件形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息有效载荷结构
- **inbound** - 入站消息处理
- **actions** - 频道动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/成员名册 API
- **group-policy** - 群组策略执行

### 提供商状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 频道状态探测
- **registry** - 插件注册表形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择/选项
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状/接口
- **wizard** - 设置向导

### 何时运行

- 修改 plugin-sdk 导出或子路径后
- 添加或修改频道或提供商插件后
- 重构插件注册或发现后
