---
mmh3_hash: "45fd18b7e52ce1ad248f1675b2b5d0cb"
summary: "测试套件：单元/e2e/实时套件、Docker 运行器以及每个测试涵盖的内容"
read_when:
  - 在本地或 CI 中运行测试
  - 为模型/Provider 错误添加回归测试
  - 调试 Gateway + Agent 行为
title: "测试"
---

# 测试

OpenClaw 有三个 Vitest 套件（单元/集成、e2e、实时）和一小组 Docker 运行器。

本文档是"我们如何测试"指南：

- 每个套件涵盖什么（以及它故意_不_涵盖什么）
- 为常见工作流运行哪些命令（本地、推送前、调试）
- 实时测试如何发现凭据并选择模型/Providers
- 如何为真实世界的模型/Provider 问题添加回归测试

## 快速开始

大多数情况下：

- 完整门控（推送前预期）：`pnpm build && pnpm check && pnpm test`

当您触及测试或想要额外信心时：

- 覆盖率门控：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

调试真实 Providers/模型时（需要真实凭据）：

- 实时套件（模型 + Gateway 工具/图像探测）：`pnpm test:live`

提示：当您只需要一个失败案例时，优先通过下面描述的白名单环境变量缩小实时测试范围。

## 测试套件（在哪里运行什么）

将套件视为"增加现实感"（以及增加不稳定性/成本）：

### 单元/集成（默认）

- 命令：`pnpm test`
- 配置：`scripts/test-parallel.mjs`（运行 `vitest.unit.config.ts`、`vitest.extensions.config.ts`、`vitest.gateway.config.ts`）
- 文件：`src/**/*.test.ts`、`extensions/**/*.test.ts`
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 身份验证、路由、工具、解析、配置）
  - 已知错误的确定性回归测试
- 期望：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速稳定
- 池注意事项：
  - OpenClaw 在 Node 22/23 上使用 Vitest `vmForks` 以获得更快的单元分片。
  - 在 Node 24+ 上，OpenClaw 自动回退到常规 `forks` 以避免 Node VM 链接错误（`ERR_VM_MODULE_LINK_FAILURE` / `module is already linked`）。
  - 使用 `OPENCLAW_TEST_VM_FORKS=0`（强制 `forks`）或 `OPENCLAW_TEST_VM_FORKS=1`（强制 `vmForks`）手动覆盖。

### E2E（Gateway 冒烟测试）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`
- 运行时默认值：
  - 使用 Vitest `vmForks` 以获得更快的文件启动。
  - 使用自适应工作器（CI：2-4，本地：4-8）。
  - 默认以静默模式运行以减少控制台 I/O 开销。
- 有用的覆盖：
  - `OPENCLAW_E2E_WORKERS=<n>` 强制工作器计数（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 端到端行为
  - WebSocket/HTTP 界面、节点配对和更重的网络
- 期望：
  - 在 CI 中运行（在管道中启用时）
  - 不需要真实密钥
  - 比单元测试有更多移动部件（可能更慢）

### 实时（真实 Providers + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`
- 默认：通过 `pnpm test:live`（设置 `OPENCLAW_LIVE_TEST=1`）**启用**
- 范围：
  - "这个 Provider/模型今天使用真实凭据实际上是否有效？"
  - 捕获 Provider 格式更改、工具调用怪癖、身份验证问题和速率限制行为
- 期望：
  - 设计上不是 CI 稳定的（真实网络、真实 Provider 策略、配额、中断）
  - 花费金钱/使用速率限制
  - 优先运行缩小的子集而不是"所有内容"
  - 实时运行将获取 `~/.profile` 以获取缺失的 API 密钥
  - API 密钥轮换（特定于 Provider）：以逗号/分号格式设置 `*_API_KEYS`，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或通过 `OPENCLAW_LIVE_*_KEY` 进行每次实时覆盖；测试将在速率限制响应时重试

## 我应该运行哪个套件？

使用此决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果您更改了很多，则运行 `pnpm test:coverage`）
- 触及 Gateway 网络/WS 协议/配对：添加 `pnpm test:e2e`
- 调试"我的机器人宕机"/Provider 特定故障/工具调用：运行缩小的 `pnpm test:live`

## 实时：Android node 能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接的 Android node 当前**宣告的每个命令**，并断言命令契约行为。
- 范围：
  - 预先配置/手动设置（套件不安装/运行/配对应用）。
  - 针对所选 Android node 的逐命令 Gateway `node.invoke` 验证。
- 所需预设置：
  - Android 应用已连接 + 配对到 Gateway。
  - 应用保持在前台。
  - 已为您期望通过的能力授予权限/捕获同意。
- 可选目标覆盖：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情：[Android 应用](/platforms/android)

## 实时：模型冒烟测试（配置文件密钥）

实时测试分为两层，以便我们可以隔离故障：

- "直接模型"告诉我们 Provider/模型可以使用给定密钥回答。
- "Gateway 冒烟测试"告诉我们该模型的完整 Gateway+Agent 管道工作（会话、历史、工具、沙箱策略等）。

### 第 1 层：直接模型完成（无 Gateway）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举发现的模型
  - 使用 `getApiKeyForModel` 选择您有凭据的模型
  - 每个模型运行一个小完成（并根据需要进行针对性回归测试）
- 如何启用：
  - `pnpm test:live`（或直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，modern 的别名）以实际运行此套件；否则它会跳过以保持 `pnpm test:live` 专注于 Gateway 冒烟测试
- 如何选择模型：
  - `OPENCLAW_LIVE_MODELS=modern` 运行现代白名单（Opus/Sonnet/Haiku 4.5、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.5、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是现代白名单的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,..."`（逗号白名单）
- 如何选择 Providers：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号白名单）
- 密钥来自哪里：
  - 默认情况下：配置文件存储和环境回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 仅强制**配置文件存储**
- 为什么存在：
  - 将"Provider API 损坏/密钥无效"与"Gateway Agent 管道损坏"分开
  - 包含小的、隔离的回归测试（例如：OpenAI Responses/Codex Responses 推理重放 + 工具调用流程）

### 第 2 层：Gateway + dev Agent 冒烟测试（"@openclaw"实际做什么）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动进程内 Gateway
  - 创建/修补 `agent:dev:*` 会话（每次运行的模型覆盖）
  - 迭代带密钥的模型并断言：
    - "有意义"的响应（无工具）
    - 真实的工具调用工作（读取探测）
    - 可选的额外工具探测（exec+read 探测）
    - OpenAI 回归路径（仅工具调用 → 后续）保持工作
- 探测详情（以便您可以快速解释故障）：
  - `read` 探测：测试在工作空间中写入一个 nonce 文件，并要求 Agent `read` 它并回显 nonce。
  - `exec+read` 探测：测试要求 Agent `exec` 写入 nonce 到临时文件，然后 `read` 回来。
  - 图像探测：测试附加生成的 PNG（cat + 随机代码）并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 如何启用：
  - `pnpm test:live`（或直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
- 如何选择模型：
  - 默认：现代白名单（Opus/Sonnet/Haiku 4.5、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.5、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代白名单的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）以缩小范围
- 如何选择 Providers（避免"OpenRouter 所有内容"）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号白名单）
- 工具 + 图像探测在此实时测试中始终开启：
  - `read` 探测 + `exec+read` 探测（工具压力）
  - 当模型广告图像输入支持时运行图像探测
  - 流程（高级别）：
    - 测试生成带有"CAT" + 随机代码的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式 Agent 将多模态用户消息转发到模型
    - 断言：回复包含 `cat` + 代码（OCR 容差：允许小错误）

提示：要查看您可以在机器上测试什么（以及确切的 `provider/model` ID），请运行：

```bash
openclaw models list
openclaw models list --json
```

## 实时：Anthropic setup-token 冒烟测试

- 测试：`src/agents/anthropic.setup-token.live.test.ts`
- 目标：验证 Claude Code CLI setup-token（或粘贴的 setup-token 配置文件）可以完成 Anthropic 提示。
- 启用：
  - `pnpm test:live`（或直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_SETUP_TOKEN=1`
- 令牌来源（选择一个）：
  - 配置文件：`OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test`
  - 原始令牌：`OPENCLAW_LIVE_SETUP_TOKEN_VALUE=sk-ant-oat01-...`
- 模型覆盖（可选）：
  - `OPENCLAW_LIVE_SETUP_TOKEN_MODEL=anthropic/claude-opus-4-6`

设置示例：

```bash
openclaw models auth paste-token --provider anthropic --profile-id anthropic:setup-token-test
OPENCLAW_LIVE_SETUP_TOKEN=1 OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test pnpm test:live src/agents/anthropic.setup-token.live.test.ts
```

## 实时：CLI 后端冒烟测试（Claude Code CLI 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway + Agent 管道，而不触及您的默认配置。
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
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 将图像文件路径作为 CLI 参数而不是提示注入传递。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）控制设置 `IMAGE_ARG` 时如何传递图像参数。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 发送第二轮并验证恢复流程。
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` 保持 Claude Code CLI MCP 配置启用（默认使用临时空文件禁用 MCP 配置）。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

### 推荐的实时配方

狭窄、明确的白名单是最快且最不容易出错的：

- 单个模型，直接（无 Gateway）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单个模型，Gateway 冒烟测试：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个 Providers 的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 焦点（Gemini API 密钥 + Antigravity）：
  - Gemini（API 密钥）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注意：

- `google/...` 使用 Gemini API（API 密钥）。
- `google-antigravity/...` 使用 Antigravity OAuth 桥接（Cloud Code Assist 样式的 Agent 端点）。
- `google-gemini-cli/...` 在您的机器上使用本地 Gemini CLI（单独的身份验证 + 工具怪癖）。
- Gemini API vs Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API 密钥/配置文件身份验证）；这是大多数用户所说的"Gemini"。
  - CLI：OpenClaw 调用本地 `gemini` 二进制文件；它有自己的身份验证，行为可能不同（流式/工具支持/版本偏差）。

## 实时：模型矩阵（我们涵盖什么）

没有固定的"CI 模型列表"（实时是选择加入的），但这些是定期在具有密钥的开发机器上涵盖的**推荐**模型。

### 现代冒烟测试集（工具调用 + 图像）

这是我们期望保持工作的"常见模型"运行：

- OpenAI（非 Codex）：`openai/gpt-5.2`（可选：`openai/gpt-5.1`）
- OpenAI Codex：`openai-codex/gpt-5.4`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-5`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/minimax-m2.5`

使用工具 + 图像运行 Gateway 冒烟测试：`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（Read + 可选 Exec）

每个 Provider 系列至少选择一个：

- OpenAI：`openai/gpt-5.2`（或 `openai/gpt-5-mini`）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-5`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/minimax-m2.5`

可选的额外覆盖（很好有）：

- xAI：`xai/grok-4`（或最新可用）
- Mistral：`mistral/`...（选择一个您启用的"工具"功能模型）
- Cerebras：`cerebras/`...（如果您有访问权限）
- LM Studio：`lmstudio/`...（本地；工具调用取决于 API 模式）

### 视觉：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的模型（Claude/Gemini/OpenAI 视觉功能变体等）以练习图像探测。

### 聚合器/备用 Gateways

如果您启用了密钥，我们还支持通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具+图像的候选者）
- OpenCode Zen：`opencode/...`（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 进行身份验证）

您可以在实时矩阵中包含的更多 Providers（如果您有凭据/配置）：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云/API），加上任何 OpenAI/Anthropic 兼容代理（LM Studio、vLLM、LiteLLM 等）

提示：不要尝试在文档中硬编码"所有模型"。权威列表是您机器上 `discoverModels(...)` 返回的内容 + 任何可用的密钥。

## 凭据（永不提交）

实时测试以与 CLI 相同的方式发现凭据。实际影响：

- 如果 CLI 工作，实时测试应该找到相同的密钥。
- 如果实时测试说"没有凭据"，请以调试 `openclaw models list` / 模型选择的相同方式进行调试。

- 配置文件存储：`~/.openclaw/credentials/`（首选；测试中"配置文件密钥"的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）

如果您想依赖环境密钥（例如在 `~/.profile` 中导出），请在 `source ~/.profile` 后运行本地测试，或使用下面的 Docker 运行器（它们可以将 `~/.profile` 挂载到容器中）。

## Deepgram 实时（音频转录）

- 测试：`src/media-understanding/providers/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus 编码计划实时测试

- 测试：`src/agents/byteplus.live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## Docker 运行器（可选的"在 Linux 中工作"检查）

这些在仓库 Docker 镜像内运行 `pnpm test:live`，挂载您的本地配置目录和工作空间（并在挂载时获取 `~/.profile`）：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- Gateway + dev Agent：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Gateway 网络（两个容器，WS 身份验证 + 健康）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- Plugins（自定义扩展加载 + 注册表冒烟测试）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）

手动 ACP 纯文本线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归/调试工作流。ACP 线程路由验证可能再次需要它，请勿删除。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile` 并在运行测试前获取
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 缩小运行范围
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 确保凭据来自配置文件存储（不是环境）

## 文档健全性

编辑文档后运行文档检查：`pnpm docs:list`。

## 离线回归（CI 安全）

这些是没有真实 Providers 的"真实管道"回归测试：

- Gateway 工具调用（模拟 OpenAI，真实 Gateway + Agent 循环）：`src/gateway/gateway.test.ts`（用例："runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway 向导（WS `wizard.start`/`wizard.next`，写入配置 + 强制执行身份验证）：`src/gateway/gateway.test.ts`（用例："runs wizard over ws and writes auth token config"）

## Agent 可靠性评估（Skills）

我们已经有一些 CI 安全测试，行为类似于"Agent 可靠性评估"：

- 通过真实 Gateway + Agent 循环模拟工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话连接和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的内容（参见 [Skills](/tools/skills)）：

- **决策**：当 Skills 在提示中列出时，Agent 是否选择正确的 Skill（或避免不相关的 Skill）？
- **合规性**：Agent 在使用前是否阅读 `SKILL.md` 并遵循所需的步骤/参数？
- **工作流合约**：断言工具顺序、会话历史结转和沙箱边界的多轮场景。

未来的评估应首先保持确定性：

- 使用模拟 Providers 断言工具调用 + 顺序、Skill 文件读取和会话连接的场景运行器。
- 一小组以 Skill 为中心的场景（使用 vs 避免、门控、提示注入）。
- 可选的实时评估（选择加入、环境门控）仅在 CI 安全套件就位后。

## 添加回归测试（指南）

当您修复在实时中发现的 Provider/模型问题时：

- 如果可能，添加 CI 安全回归测试（模拟/存根 Provider，或捕获确切的请求形状转换）
- 如果它本质上是仅实时的（速率限制、身份验证策略），请通过环境变量保持实时测试狭窄且选择加入
- 优先定位捕获错误的最小层：
  - Provider 请求转换/重放错误 → 直接模型测试
  - Gateway 会话/历史/工具管道错误 → Gateway 实时冒烟测试或 CI 安全 Gateway 模拟测试
