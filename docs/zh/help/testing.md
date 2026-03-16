---
mmh3_hash: "9fb140dfe43bd6dba818558eba158739"
summary: "测试套件：单元/e2e/实时套件、Docker 运行器以及每个测试涵盖的内容"
read_when:
  - 在本地或 CI 中运行测试
  - 为 model/provider 错误添加回归测试
  - 调试 gateway + agent 行为
title: "测试"
---

# 测试

OpenClaw 有三个 Vitest 套件（单元/集成、e2e、实时）和一小组 Docker 运行器。

本文档是"我们如何测试"的指南：

- 每个套件涵盖什么（以及它刻意_不_涵盖什么）
- 常见工作流（本地、推送前、调试）运行哪些命令
- 实时测试如何发现凭据并选择 models/providers
- 如何为真实 model/provider 问题添加回归测试

## 快速入门

大多数时候：

- 完整门控（推送前预期）：`pnpm build && pnpm check && pnpm test`

当你修改测试或想要额外信心时：

- 覆盖率门控：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

调试真实 providers/models 时（需要真实凭据）：

- 实时套件（models + gateway 工具/图像探测）：`pnpm test:live`

提示：当你只需要一个失败案例时，优先通过下面描述的允许列表 env vars 缩小实时测试范围。

## 测试套件（什么在哪里运行）

将套件视为"增加真实性"（以及增加不稳定性/成本）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：`scripts/test-parallel.mjs`（运行 `vitest.unit.config.ts`、`vitest.extensions.config.ts`、`vitest.gateway.config.ts`）
- 文件：`src/**/*.test.ts`、`extensions/**/*.test.ts`
- 范围：
  - 纯单元测试
  - 进程内集成测试（gateway auth、路由、工具、解析、配置）
  - 已知错误的确定性回归测试
- 期望：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
- Pool 注意事项：
  - OpenClaw 在 Node 22、23 和 24 上使用 Vitest `vmForks` 以获得更快的单元分片。
  - 在 Node 25+ 上，OpenClaw 自动回退到常规 `forks`，直到 repo 在那里重新验证。
  - 使用 `OPENCLAW_TEST_VM_FORKS=0`（强制 `forks`）或 `OPENCLAW_TEST_VM_FORKS=1`（强制 `vmForks`）手动覆盖。

### E2E（gateway 冒烟测试）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- 运行时默认值：
  - 使用 Vitest `vmForks` 以获得更快的文件启动。
  - 使用自适应 workers（CI：2-4，本地：4-8）。
  - 默认以静默模式运行以减少控制台 I/O 开销。
- 有用的覆盖：
  - `OPENCLAW_E2E_WORKERS=<n>` 强制 worker 数量（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 重新启用详细控制台输出。
- 范围：
  - 多实例 gateway 端到端行为
  - WebSocket/HTTP 接口、node 配对和更重的网络
- 期望：
  - 在 CI 中运行（当在管道中启用时）
  - 不需要真实密钥
  - 比单元测试有更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟测试

- 命令：`pnpm test:e2e:openshell`
- 文件：`test/openshell-sandbox.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动隔离的 OpenShell gateway
  - 从临时本地 Dockerfile 创建沙盒
  - 通过真实的 `sandbox ssh-config` + SSH exec 在 OpenClaw 的 OpenShell 后端上进行练习
  - 通过沙盒 fs 桥验证远程规范文件系统行为
- 期望：
  - 仅选择性加入；不是默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 加上正常工作的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 gateway 和沙盒
- 有用的覆盖：
  - `OPENCLAW_E2E_OPENSHELL=1` 在手动运行更广泛的 e2e 套件时启用测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 指向非默认 CLI 二进制或包装脚本

### 实时测试（真实 providers + 真实 models）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - "这个 provider/model _今天_用真实凭据实际上有效吗？"
  - 捕获 provider 格式更改、工具调用怪癖、auth 问题和速率限制行为
- 期望：
  - 设计上不稳定 CI（真实网络、真实 provider 策略、配额、中断）
  - 花钱 / 使用速率限制
  - 优先运行缩小的子集而不是"所有内容"
  - 实时运行将获取 `~/.profile` 以获取缺失的 API keys
- API key 轮换（provider 特定）：用逗号/分号格式设置 `*_API_KEYS` 或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）或通过 `OPENCLAW_LIVE_*_KEY` 按实时覆盖；测试在速率限制响应时重试。

## 我应该运行哪个套件？

使用这个决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果你改变了很多，加上 `pnpm test:coverage`）
- 触及 gateway 网络 / WS 协议 / 配对：添加 `pnpm test:e2e`
- 调试"我的 bot 停了" / provider 特定失败 / 工具调用：运行缩小的 `pnpm test:live`

## 实时测试：Android node 能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用连接的 Android node 当前**广告的每个命令**并断言命令契约行为。
- 范围：
  - 前置条件/手动设置（套件不安装/运行/配对应用）。
  - 为所选 Android node 逐命令 gateway `node.invoke` 验证。
- 需要预设置：
  - Android 应用已连接 + 与 gateway 配对。
  - 应用保持在前台。
  - 为你期望通过的能力授予权限/捕获同意。
- 可选目标覆盖：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情：[Android App](/platforms/android)

## 实时测试：model 冒烟（profile keys）

实时测试分为两层，这样我们可以隔离失败：

- "直接 model"告诉我们 provider/model 是否能用给定的 key 完全回答。
- "Gateway 冒烟"告诉我们完整的 gateway+agent 管道是否对该 model 有效（sessions、历史记录、工具、沙盒策略等）。

### 第 1 层：直接 model completion（无 gateway）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举发现的 models
  - 使用 `getApiKeyForModel` 选择你有凭据的 models
  - 每个 model 运行一个小的 completion（需要时加上有针对性的回归测试）
- 如何启用：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，是 modern 的别名）以实际运行此套件；否则它会跳过以使 `pnpm test:live` 专注于 gateway 冒烟
- 如何选择 models：
  - `OPENCLAW_LIVE_MODELS=modern` 运行现代允许列表（Opus/Sonnet/Haiku 4.5、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.5、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是现代允许列表的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,..."` （逗号允许列表）
- 如何选择 providers：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` （逗号允许列表）
- keys 来自哪里：
  - 默认：profile 存储和 env 回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制**仅** profile 存储
- 为什么存在：
  - 将"provider API 坏了 / key 无效"与"gateway agent 管道坏了"分开
  - 包含小型隔离回归测试（示例：OpenAI Responses/Codex Responses 推理重播 + 工具调用流）

### 第 2 层：Gateway + dev agent 冒烟（"@openclaw"实际做的事情）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动进程内 gateway
  - 创建/修补 `agent:dev:*` session（每次运行 model 覆盖）
  - 遍历有 key 的 models 并断言：
    - "有意义"的响应（无工具）
    - 真实工具调用有效（read 探测）
    - 可选的额外工具探测（exec+read 探测）
    - OpenAI 回归路径（仅工具调用 → 后续）保持有效
- 探测详情（这样你可以快速解释失败）：
  - `read` 探测：测试在 workspace 中写入一个随机文件并要求 agent `read` 它并回显该随机内容。
  - `exec+read` 探测：测试要求 agent `exec` 将随机内容写入临时文件，然后 `read` 它回来。
  - 图像探测：测试附加生成的 PNG（cat + 随机化代码）并期望 model 返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 如何启用：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 如何选择 models：
  - 默认：现代允许列表（Opus/Sonnet/Haiku 4.5、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.5、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代允许列表的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）来缩小
- 如何选择 providers（避免"OpenRouter 所有"）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` （逗号允许列表）
- 工具 + 图像探测在此实时测试中始终开启：
  - `read` 探测 + `exec+read` 探测（工具压力）
  - 图像探测在 model 广告图像输入支持时运行
  - 流程（高层次）：
    - 测试生成带"CAT" + 随机代码的小 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式 agent 将多模态用户消息转发给 model
    - 断言：回复包含 `cat` + 代码（OCR 容错：允许轻微错误）

提示：要查看你机器上可以测试的内容（以及确切的 `provider/model` ids），运行：

```bash
openclaw models list
openclaw models list --json
```

## 实时测试：Anthropic setup-token 冒烟

- 测试：`src/agents/anthropic.setup-token.live.test.ts`
- 目标：验证 Claude Code CLI setup-token（或粘贴的 setup-token profile）可以完成 Anthropic prompt。
- 启用：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_SETUP_TOKEN=1`
- Token 来源（选一）：
  - Profile：`OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test`
  - 原始 token：`OPENCLAW_LIVE_SETUP_TOKEN_VALUE=sk-ant-oat01-...`
- Model 覆盖（可选）：
  - `OPENCLAW_LIVE_SETUP_TOKEN_MODEL=anthropic/claude-opus-4-6`

设置示例：

```bash
openclaw models auth paste-token --provider anthropic --profile-id anthropic:setup-token-test
OPENCLAW_LIVE_SETUP_TOKEN=1 OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test pnpm test:live src/agents/anthropic.setup-token.live.test.ts
```

## 实时测试：CLI 后端冒烟（Claude Code CLI 或其他本地 CLIs）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway + agent 管道，而不触及你的默认配置。
- 启用：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认：
  - Model：`claude-cli/claude-sonnet-4-6`
  - 命令：`claude`
  - 参数：`["-p","--output-format","json","--permission-mode","bypassPermissions"]`
- 覆盖（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 发送真实图像附件（路径注入到 prompt 中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 将图像文件路径作为 CLI 参数传递而不是 prompt 注入。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）控制设置 `IMAGE_ARG` 时图像参数如何传递。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 发送第二轮并验证 resume 流程。
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` 保持 Claude Code CLI MCP 配置启用（默认使用临时空文件禁用 MCP 配置）。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

### 推荐的实时测试配方

缩窄、明确的允许列表最快且最不不稳定：

- 单个 model，直接（无 gateway）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单个 model，gateway 冒烟：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个 providers 的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 重点（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注意：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth 桥（Cloud Code Assist 风格 agent 端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（单独的 auth + 工具怪癖）。
- Gemini API vs Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API key / profile auth）；这是大多数用户所说的"Gemini"。
  - CLI：OpenClaw 调用本地 `gemini` 二进制；它有自己的 auth，行为可能不同（流/工具支持/版本偏差）。

## 实时测试：model 矩阵（我们涵盖什么）

没有固定的"CI model 列表"（实时是选择性加入），但这些是我们期望在有 key 的开发机器上定期覆盖的**推荐** models。

### 现代冒烟集（工具调用 + 图像）

这是我们期望保持有效的"常见 models"运行：

- OpenAI（非 Codex）：`openai/gpt-5.2`（可选：`openai/gpt-5.1`）
- OpenAI Codex：`openai-codex/gpt-5.4`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-5`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免旧的 Gemini 2.x models）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/minimax-m2.5`

用工具 + 图像运行 gateway 冒烟：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基准：工具调用（Read + 可选 Exec）

每个 provider 系列至少选一个：

- OpenAI：`openai/gpt-5.2`（或 `openai/gpt-5-mini`）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-5`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/minimax-m2.5`

可选额外覆盖（最好有）：

- xAI：`xai/grok-4`（或最新可用）
- Mistral：`mistral/`...（选一个你启用的支持工具的 model）
- Cerebras：`cerebras/`...（如果你有访问权限）
- LM Studio：`lmstudio/`...（本地；工具调用取决于 API 模式）

### 视觉：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的 model（Claude/Gemini/OpenAI 视觉能力变体等）以练习图像探测。

### 聚合器 / 替代 gateways

如果你启用了 key，我们还支持通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个 models；使用 `openclaw models scan` 查找支持工具+图像的候选者）
- OpenCode：`opencode/...` 用于 Zen，`opencode-go/...` 用于 Go（auth 通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

你可以在实时矩阵中包含的更多 providers（如果你有凭据/配置）：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云/API），以及任何 OpenAI/Anthropic 兼容代理（LM Studio、vLLM、LiteLLM 等）

提示：不要尝试在文档中硬编码"所有 models"。权威列表是你机器上 `discoverModels(...)` 返回的内容加上可用的 keys。

## 凭据（永远不要提交）

实时测试与 CLI 相同方式发现凭据。实际含义：

- 如果 CLI 有效，实时测试应该找到相同的 keys。
- 如果实时测试说"无凭据"，用与调试 `openclaw models list` / model 选择相同的方式调试。

- Profile 存储：`~/.openclaw/credentials/`（首选；测试中"profile keys"的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）

如果你想依赖 env keys（例如在 `~/.profile` 中导出的），在 `source ~/.profile` 后运行本地测试，或使用下面的 Docker 运行器（它们可以将 `~/.profile` 挂载到容器中）。

## Deepgram 实时测试（音频转录）

- 测试：`src/media-understanding/providers/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus 编码计划实时测试

- 测试：`src/agents/byteplus.live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 可选 model 覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## Docker 运行器（可选的"在 Linux 上有效"检查）

这些在 repo Docker 镜像内运行 `pnpm test:live`，挂载你的本地配置目录和 workspace（以及在挂载时获取 `~/.profile`）。当存在时，它们还绑定挂载 CLI auth 目录如 `~/.codex`、`~/.claude`、`~/.qwen` 和 `~/.minimax`，以便外部 CLI OAuth 在容器中保持可用：

- 直接 models：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- Gateway + dev agent：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Gateway 网络（两个容器，WS auth + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- Plugins（自定义扩展加载 + 注册表冒烟）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）

实时 model Docker 运行器还将当前 checkout 只读绑定挂载并将其暂存到容器内的临时工作目录中。这保持运行时镜像精简，同时仍然针对你的确切本地源/配置运行 Vitest。

手动 ACP 自然语言线程冒烟（不是 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归/调试工作流。对于 ACP 线程路由验证可能再次需要它，所以不要删除它。

有用的 env vars：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile` 并在运行测试前获取
- `$HOME` 下的外部 CLI auth 目录（`.codex`、`.claude`、`.qwen`、`.minimax`）在存在时只读挂载到匹配的 `/home/node/...` 路径
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 缩小运行范围
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 确保凭据来自 profile 存储（不是 env）

## 文档健全性检查

在编辑文档后运行文档检查：`pnpm docs:list`。

## 离线回归（CI 安全）

这些是没有真实 providers 的"真实管道"回归测试：

- Gateway 工具调用（mock OpenAI，真实 gateway + agent 循环）：`src/gateway/gateway.test.ts`（案例："通过 gateway agent 循环端到端运行 mock OpenAI 工具调用"）
- Gateway 向导（WS `wizard.start`/`wizard.next`，写入配置 + auth 强制）：`src/gateway/gateway.test.ts`（案例："通过 ws 运行向导并写入 auth token 配置"）

## Agent 可靠性评估（skills）

我们已经有一些行为类似于"agent 可靠性评估"的 CI 安全测试：

- 通过真实 gateway + agent 循环的 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证 session 连线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

Skills 仍然缺少什么（参见 [Skills](/tools/skills)）：

- **决策：** 当 skills 在 prompt 中列出时，agent 是否选择了正确的 skill（或避免不相关的 skill）？
- **合规性：** agent 是否在使用前读取 `SKILL.md` 并遵循必需的步骤/参数？
- **工作流契约：** 断言工具顺序、session 历史携带和沙盒边界的多轮场景。

未来的评估应首先保持确定性：

- 使用 mock providers 的场景运行器，以断言工具调用 + 顺序、skill 文件读取和 session 连线。
- 一小套以 skill 为重点的场景（使用 vs 避免、门控、prompt injection）。
- 可选的实时评估（选择性加入，env 门控），仅在 CI 安全套件就位后。

## 添加回归测试（指导）

当你修复在实时测试中发现的 provider/model 问题时：

- 如果可能，添加 CI 安全回归测试（mock/stub provider，或捕获确切的请求形状转换）
- 如果它本质上是仅实时的（速率限制、auth 策略），保持实时测试缩窄并通过 env vars 选择性加入
- 优先针对能捕获错误的最小层：
  - provider 请求转换/重播错误 → 直接 models 测试
  - gateway session/历史/工具管道错误 → gateway 实时冒烟或 CI 安全 gateway mock 测试
- SecretRef 遍历护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 从注册表元数据（`listSecretTargetRegistryEntries()`）为每个 SecretRef 类派生一个采样目标，然后断言遍历段 exec ids 被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加新的 `includeInPlan` SecretRef 目标系列，更新该测试中的 `classifyTargetClass`。测试在未分类目标 ids 上故意失败，这样新类就不能被静默跳过。
