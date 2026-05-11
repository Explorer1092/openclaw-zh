---
mmh3_hash: "d73669813bf8d88ddf603a674a87a9bf"
summary: "实时（网络触达）测试：模型矩阵、CLI 后端、ACP、媒体 Provider、凭据"
read_when:
  - 运行实时模型矩阵 / CLI 后端 / ACP / 媒体 Provider 冒烟测试
  - 调试实时测试凭据解析
  - 添加新的特定 Provider 实时测试
title: "测试：实时套件"
sidebarTitle: "实时测试"
---

有关快速入门、QA 运行器、单元/集成套件和 Docker 流程，请参阅[测试](/help/testing)。本页面涵盖**实时**（网络触达）测试套件：模型矩阵、CLI 后端、ACP 和媒体 Provider 实时测试，以及凭据处理。

## 实时：本地配置文件冒烟命令

在即席实时检查之前源 `~/.profile`，使 Provider 密钥和本地工具路径与你的 Shell 匹配：

```bash
source ~/.profile
```

安全媒体冒烟：

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

安全语音通话就绪冒烟：

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` 是空运行，除非同时存在 `--yes`。仅在你有意想要发出真实通知通话时使用 `--yes`。对于 Twilio、Telnyx 和 Plivo，成功的就绪检查需要公共 webhook URL；本地环回/私有回退在设计上被拒绝。

## 实时：Android Node 能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 Android Node 当前广告的**每个命令**并断言命令合约行为。
- 范围：
  - 预置/手动设置（套件不安装/运行/配对应用）。
  - 针对选定 Android Node 的逐命令 Gateway `node.invoke` 验证。
- 必需的预设置：
  - Android 应用已连接并配对到 Gateway。
  - 应用保持在前台。
  - 你期望通过的能力已授予权限/捕获同意。
- 可选目标覆盖：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情：[Android 应用](/platforms/android)

## 实时：模型冒烟（配置文件密钥）

实时测试分为两层，以便我们可以隔离故障：

- "直接模型"告诉我们 Provider/模型是否可以用给定密钥回答。
- "Gateway 冒烟"告诉我们该模型的完整 Gateway + Agent 管道是否有效（Session、历史、工具、沙盒策略等）。

### 第一层：直接模型完成（无 Gateway）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举发现的模型
  - 使用 `getApiKeyForModel` 选择有凭据的模型
  - 每个模型运行一个小型完成（以及在需要时进行有针对性的回归）
- 如何启用：
  - `pnpm test:live`（或在直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，modern 的别名）以实际运行此套件；否则跳过以使 `pnpm test:live` 专注于 Gateway 冒烟
- 如何选择模型：
  - `OPENCLAW_LIVE_MODELS=modern` 运行现代白名单（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_MODELS=all` 是现代白名单的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."`（逗号白名单）
  - Modern/all 扫描默认为精选的高信号上限；设置 `OPENCLAW_LIVE_MAX_MODELS=0` 进行详尽的现代扫描或设置正数进行较小上限。
  - 详尽扫描使用 `OPENCLAW_LIVE_TEST_TIMEOUT_MS` 作为整个直接模型测试超时。默认：60 分钟。
  - 直接模型探测默认以 20 路并行性运行；设置 `OPENCLAW_LIVE_MODEL_CONCURRENCY` 进行覆盖。
- 如何选择 Provider：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号白名单）
- 密钥来源：
  - 默认：配置文件存储和环境回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制仅使用**配置文件存储**
- 存在原因：
  - 将"Provider API 损坏/密钥无效"与"Gateway Agent 管道损坏"分离
  - 包含小型隔离的回归（示例：OpenAI Responses/Codex Responses 推理重放 + 工具调用流）

### 第二层：Gateway + 开发 Agent 冒烟（"@openclaw"实际执行的操作）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动进程内 Gateway
  - 创建/修补 `agent:dev:*` Session（每次运行的模型覆盖）
  - 迭代有密钥的模型并断言：
    - "有意义"的响应（无工具）
    - 真实的工具调用有效（读取探测）
    - 可选的额外工具探测（exec + 读取探测）
    - OpenAI 回归路径（仅工具调用 → 跟进）保持有效
- 探测详情（以便你快速解释故障）：
  - `read` 探测：测试在工作区中写入一个随机数文件，并要求 Agent `read` 它并回显随机数。
  - `exec+read` 探测：测试要求 Agent `exec` 将随机数写入临时文件，然后 `read` 回来。
  - 图像探测：测试附加生成的 PNG（猫 + 随机代码）并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 如何启用：
  - `pnpm test:live`（或在直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
- 如何选择模型：
  - 默认：现代白名单（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代白名单的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）进行缩小
  - Modern/all Gateway 扫描默认为精选的高信号上限；设置 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 进行详尽的现代扫描或设置正数进行较小上限。
- 如何选择 Provider（避免"OpenRouter 所有"）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号白名单）
- 工具 + 图像探测在此实时测试中始终开启：
  - `read` 探测 + `exec+read` 探测（工具压力）
  - 当模型广告图像输入支持时运行图像探测
  - 流程（高级）：
    - 测试生成带有"CAT" + 随机代码的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式 Agent 将多模态用户消息转发给模型
    - 断言：回复包含 `cat` + 代码（OCR 容忍：允许轻微错误）

<Tip>
要查看你的机器上可以测试什么（以及确切的 `provider/model` ID），运行：

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## 实时：CLI 后端冒烟（Claude、Codex、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway + Agent 管道，而不触及你的默认配置。
- 特定后端的冒烟默认值与拥有的扩展 `cli-backend.ts` 定义一起存在。
- 启用：
  - `pnpm test:live`（或在直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认 Provider/模型：`claude-cli/claude-sonnet-4-6`
  - 命令/参数/图像行为来自拥有的 CLI 后端 Plugin 元数据。
- 覆盖（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 发送真实的图像附件（路径注入到提示词中）。Docker 配方默认关闭此功能，除非明确请求。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 通过 CLI 参数传递图像文件路径，而不是提示词注入。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）控制当设置 `IMAGE_ARG` 时图像参数的传递方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 发送第二轮并验证续集流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` 当选定模型支持切换目标时，选择加入 Claude Sonnet -> Opus 同 Session 连续性探测。Docker 配方默认关闭此功能以保证聚合可靠性。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` 选择加入 MCP/工具环回探测。Docker 配方默认关闭此功能，除非明确请求。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

廉价的 Gemini MCP 配置冒烟：

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

这不会要求 Gemini 生成响应。它写入 OpenClaw 给 Gemini 的相同系统设置，然后运行 `gemini --debug mcp list` 证明已保存的 `transport: "streamable-http"` 服务器被规范化为 Gemini 的 HTTP MCP 形状，并且可以连接到本地 streamable-HTTP MCP 服务器。

Docker 配方：

```bash
pnpm test:docker:live-cli-backend
```

单 Provider Docker 配方：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

说明：

- Docker 运行器位于 `scripts/test-live-cli-backend-docker.sh`。
- 它以非根 `node` 用户在仓库 Docker 镜像内运行实时 CLI 后端冒烟。
- 它从拥有的扩展解析 CLI 冒烟元数据，然后将匹配的 Linux CLI 包（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安装到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 处的缓存可写前缀中（默认：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要通过 `~/.claude/.credentials.json` 和 `claudeAiOauth.subscriptionType` 或来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN` 的可携带 Claude Code 订阅 OAuth。它首先在 Docker 中证明直接的 `claude -p`，然后运行两个 Gateway CLI 后端轮次而不保留 Anthropic API 密钥环境变量。此订阅通道默认禁用 Claude MCP/工具和图像探测，因为 Claude 目前通过额外使用账单而不是正常订阅计划限制路由第三方应用使用。
- 实时 CLI 后端冒烟现在对 Claude、Codex 和 Gemini 执行相同的端到端流程：文本轮次、图像分类轮次，然后通过 Gateway CLI 验证的 MCP `cron` 工具调用。
- Claude 的默认冒烟还将 Session 从 Sonnet 修补到 Opus，并验证续集 Session 仍然记住早先的说明。

## 实时：APNs HTTP/2 代理可达性

- 测试：`src/infra/push-apns-http2.live.test.ts`
- 目标：通过本地 HTTP CONNECT 代理隧道到 Apple 的沙盒 APNs 端点，发送 APNs HTTP/2 验证请求，并断言 Apple 真实的 `403 InvalidProviderToken` 响应通过代理路径返回。
- 启用：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 可选超时：
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## 实时：ACP 绑定冒烟（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用实时 ACP Agent 验证真实的 ACP 对话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 就地绑定合成消息 Channel 对话
  - 在同一对话上发送正常的跟进
  - 验证跟进落地在绑定的 ACP Session 脚本中
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - Docker 中的 ACP Agent：`claude,codex,gemini`
  - 直接 `pnpm test:live ...` 的 ACP Agent：`claude`
  - 合成 Channel：Slack DM 风格的对话上下文
  - ACP 后端：`acpx`
- 覆盖：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- 说明：
  - 此通道使用 Gateway `chat.send` 界面，带有仅管理员的合成发起路由字段，因此测试可以附加消息 Channel 上下文，而无需假装外部投递。
  - 当 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 未设置时，测试使用嵌入式 `acpx` Plugin 内置的 Agent 注册表来选择 ACP 测试套件 Agent。
  - 绑定 Session Cron MCP 创建默认是尽力而为，因为外部 ACP 测试套件可以在绑定/图像证明通过后取消 MCP 调用；设置 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` 使该绑定后 Cron 探测严格。

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

单 Agent Docker 配方：

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker 说明：

- Docker 运行器位于 `scripts/test-live-acp-bind-docker.sh`。
- 默认情况下，它按顺序对聚合实时 CLI Agent 运行 ACP 绑定冒烟：`claude`、`codex`，然后是 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` 缩小矩阵。
- 它源 `~/.profile`，将匹配的 CLI 认证材料暂存到容器中，然后在缺失时安装请求的实时 CLI（`@anthropic-ai/claude-code`、`@openai/codex`、通过 `https://app.factory.ai/cli` 的 Factory Droid、`@google/gemini-cli` 或 `opencode-ai`）。ACP 后端本身是来自官方 `acpx` Plugin 的嵌入式 `acpx/runtime` 包。
- Droid Docker 变体暂存 `~/.factory` 用于设置，转发 `FACTORY_API_KEY`，并需要该 API 密钥，因为本地 Factory OAuth/密钥环认证不可携带到容器中。它使用 ACPX 内置的 `droid exec --output-format acp` 注册表条目。
- OpenCode Docker 变体是严格的单 Agent 回归通道。在源 `~/.profile` 之后，它从 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（默认 `opencode/kimi-k2.6`）写入临时 `OPENCODE_CONFIG_CONTENT` 默认模型，`pnpm test:docker:live-acp-bind:opencode` 需要绑定的 Assistant 脚本，而不是接受通用的绑定后跳过。
- 直接 `acpx` CLI 调用只是在 Gateway 外部比较行为的手动/变通路径。Docker ACP 绑定冒烟测试 OpenClaw 的嵌入式 `acpx` 运行时后端。

## 实时：Codex 应用服务器测试套件冒烟

- 目标：通过正常 Gateway `agent` 方法验证 Plugin 拥有的 Codex 测试套件：
  - 加载捆绑的 `codex` Plugin
  - 选择 `openai/gpt-5.5`，默认通过 Codex 路由 OpenAI Agent 轮次
  - 向 `openai/gpt-5.5` 发送第一个 Gateway Agent 轮次，选择 Codex 测试套件
  - 向同一 OpenClaw Session 发送第二轮并验证应用服务器线程可以续集
  - 通过相同 Gateway 命令路径运行 `/codex status` 和 `/codex models`
  - 可选运行两个 Guardian 审查的升级 Shell 探测：一个应该被批准的良性命令和一个应该被拒绝的假密钥上传，让 Agent 回问
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 默认模型：`openai/gpt-5.5`
- 可选图像探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP/工具探测：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可选 Guardian 探测：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 冒烟强制 Provider/模型 `agentRuntime.id: "codex"`，因此损坏的 Codex 测试套件无法通过静默回退到 PI 来通过。
- 认证：来自本地 Codex 订阅登录的 Codex 应用服务器认证。Docker 冒烟也可以在适用时为非 Codex 探测提供 `OPENAI_API_KEY`，以及可选复制的 `~/.codex/auth.json` 和 `~/.codex/config.toml`。

本地配方：

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 配方：

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker 说明：

- Docker 运行器位于 `scripts/test-live-codex-harness-docker.sh`。
- 它源挂载的 `~/.profile`，传递 `OPENAI_API_KEY`，在存在时复制 Codex CLI 认证文件，将 `@openai/codex` 安装到可写挂载的 npm 前缀，暂存源代码树，然后只运行 Codex 测试套件实时测试。
- Docker 默认启用图像、MCP/工具和 Guardian 探测。当需要更窄的调试运行时，设置 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`、`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或 `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 使用相同的显式 Codex 运行时配置，因此旧版别名或 PI 回退不能隐藏 Codex 测试套件回归。

### 推荐的实时配方

窄的显式白名单最快且最不不稳定：

- 单模型，直接（无 Gateway）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单模型，Gateway 冒烟：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个 Provider 的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 专注（Gemini API 密钥 + Antigravity）：
  - Gemini（API 密钥）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 自适应思考冒烟：
  - 如果本地密钥在 Shell 配置文件中：`source ~/.profile`
  - Gemini 3 动态默认：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 动态预算：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

说明：

- `google/...` 使用 Gemini API（API 密钥）。
- `google-antigravity/...` 使用 Antigravity OAuth 桥（Cloud Code Assist 风格的 Agent 端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（单独的认证 + 工具怪癖）。
- Gemini API vs Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API 密钥/配置文件认证）；这是大多数用户所说的"Gemini"。
  - CLI：OpenClaw 调用本地 `gemini` 二进制；它有自己的认证，可能表现不同（流式传输/工具支持/版本偏差）。

## 实时：模型矩阵（我们涵盖的内容）

没有固定的"CI 模型列表"（实时是可选的），但这些是我们期望在有密钥的开发机器上定期保持工作的**推荐**模型。

### 现代冒烟集（工具调用 + 图像）

这是我们期望保持工作的"常见模型"运行：

- OpenAI（非 Codex）：`openai/gpt-5.5`
- OpenAI Codex OAuth：`openai-codex/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- DeepSeek：`deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro`
- Z.AI（GLM）：`zai/glm-5.1`
- MiniMax：`minimax/MiniMax-M2.7`

使用工具 + 图像运行 Gateway 冒烟：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（读取 + 可选执行）

每个 Provider 家族至少选择一个：

- OpenAI：`openai/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- DeepSeek：`deepseek/deepseek-v4-flash`
- Z.AI（GLM）：`zai/glm-5.1`
- MiniMax：`minimax/MiniMax-M2.7`

可选的额外覆盖（很好有）：

- xAI：`xai/grok-4.3`（或最新可用）
- Mistral：`mistral/`...（选择一个你启用的支持"工具"的模型）
- Cerebras：`cerebras/`...（如果你有访问权限）
- LM Studio：`lmstudio/`...（本地；工具调用取决于 API 模式）

### 视觉：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中包含至少一个支持图像的模型（Claude/Gemini/OpenAI 视觉能力变体等）以测试图像探测。

### 聚合器/备用网关

如果你启用了密钥，我们还支持通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具 + 图像的候选）
- OpenCode：`opencode/...` 用于 Zen，`opencode-go/...` 用于 Go（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 认证）

实时矩阵中可以包含的更多 Provider（如果你有凭据/配置）：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云/API），以及任何 OpenAI/Anthropic 兼容代理（LM Studio、vLLM、LiteLLM 等）

<Tip>
不要在文档中硬编码"所有模型"。权威列表是你机器上 `discoverModels(...)` 返回的任何内容加上可用的密钥。
</Tip>

## 凭据（绝不提交）

实时测试以与 CLI 相同的方式发现凭据。实际含义：

- 如果 CLI 工作，实时测试应该找到相同的密钥。
- 如果实时测试说"无凭据"，以调试 `openclaw models list` / 模型选择的方式进行调试。

- 每 Agent 认证配置文件：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这是实时测试中"配置文件密钥"的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（存在时复制到暂存的实时主目录，但不是主要配置文件密钥存储）
- 实时本地运行默认将活跃配置、每 Agent `auth-profiles.json` 文件、旧版 `credentials/` 和支持的外部 CLI 认证目录复制到临时测试主目录；暂存的实时主目录跳过 `workspace/` 和 `sandboxes/`，以及 `agents.*.workspace` / `agentDir` 路径覆盖被剥离，使探测保持在你真实的主机工作区之外。

如果你想依赖环境密钥（例如在你的 `~/.profile` 中导出），在 `source ~/.profile` 之后运行本地测试，或使用下面的 Docker 运行器（它们可以将 `~/.profile` 挂载到容器中）。

## Deepgram 实时（音频转录）

- 测试：`extensions/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus 编码计划实时

- 测试：`extensions/byteplus/live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流媒体实时

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 测试捆绑的 comfy 图像、视频和 `music_generate` 路径
  - 除非配置了 `plugins.entries.comfy.config.<capability>`，否则跳过每个能力
  - 在更改 comfy 工作流提交、轮询、下载或 Plugin 注册后有用

## 图像生成实时

- 测试：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- 测试套件：`pnpm test:live:media image`
- 范围：
  - 枚举每个已注册的图像生成 Provider Plugin
  - 在探测之前从你的登录 Shell（`~/.profile`）加载缺失的 Provider 环境变量
  - 默认使用实时/环境 API 密钥而不是存储的认证配置文件，因此 `auth-profiles.json` 中的过期测试密钥不会掩盖真实的 Shell 凭据
  - 跳过没有可用认证/配置文件/模型的 Provider
  - 通过共享图像生成运行时对每个配置的 Provider 运行：
    - `<provider>:generate`
    - `<provider>:edit` 当 Provider 声明编辑支持时
- 当前涵盖的捆绑 Provider：
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- 可选缩小：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用配置文件存储认证并忽略仅环境覆盖

对于已发布的 CLI 路径，在 Provider/运行时实时测试通过后添加 `infer` 冒烟：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

这涵盖 CLI 参数解析、配置/默认 Agent 解析、捆绑 Plugin 激活、共享图像生成运行时和实时 Provider 请求。Plugin 依赖项预期在运行时加载之前存在。

## 音乐生成实时

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 测试套件：`pnpm test:live:media music`
- 范围：
  - 测试共享的捆绑音乐生成 Provider 路径
  - 目前涵盖 Google 和 MiniMax
  - 在探测之前从你的登录 Shell（`~/.profile`）加载 Provider 环境变量
  - 默认使用实时/环境 API 密钥而不是存储的认证配置文件，因此 `auth-profiles.json` 中的过期测试密钥不会掩盖真实的 Shell 凭据
  - 跳过没有可用认证/配置文件/模型的 Provider
  - 在可用时运行两种声明的运行时模式：
    - `generate` 仅提示词输入
    - `edit` 当 Provider 声明 `capabilities.edit.enabled` 时
  - 当前共享通道覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：单独的 Comfy 实时文件，不是此共享扫描
- 可选缩小：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用配置文件存储认证并忽略仅环境覆盖

## 视频生成实时

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 测试套件：`pnpm test:live:media video`
- 范围：
  - 测试共享的捆绑视频生成 Provider 路径
  - 默认为发布安全的冒烟路径：非 FAL Provider、每个 Provider 一个文本到视频请求、一秒钟的龙虾提示词，以及来自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（默认 `180000`）的每个 Provider 操作上限
  - 默认跳过 FAL，因为 Provider 端队列延迟可能主导发布时间；传递 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 显式运行它
  - 在探测之前从你的登录 Shell（`~/.profile`）加载 Provider 环境变量
  - 默认使用实时/环境 API 密钥而不是存储的认证配置文件
  - 跳过没有可用认证/配置文件/模型的 Provider
  - 默认只运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 在可用时也运行声明的转换模式：
    - `imageToVideo` 当 Provider 声明 `capabilities.imageToVideo.enabled` 且选定的 Provider/模型在共享扫描中接受缓冲区支持的本地图像输入时
    - `videoToVideo` 当 Provider 声明 `capabilities.videoToVideo.enabled` 且选定的 Provider/模型在共享扫描中接受缓冲区支持的本地视频输入时
  - 共享扫描中当前声明但跳过的 `imageToVideo` Provider：
    - `vydra` 因为捆绑的 `veo3` 是仅文本的，捆绑的 `kling` 需要远程图像 URL
  - 特定 Provider 的 Vydra 覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件默认运行 `veo3` 文本到视频加上使用远程图像 URL 固件的 `kling` 通道
  - 当前 `videoToVideo` 实时覆盖：
    - 仅当选定的模型是 `runway/gen4_aleph` 时才覆盖 `runway`
  - 共享扫描中当前声明但跳过的 `videoToVideo` Provider：
    - `alibaba`、`qwen`、`xai` 因为这些路径当前需要远程 `http(s)` / MP4 参考 URL
    - `google` 因为当前共享的 Gemini/Veo 通道使用本地缓冲区支持的输入，该路径在共享扫描中不被接受
    - `openai` 因为当前共享通道缺乏特定组织的视频修补/混音访问保证
- 可选缩小：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 在默认扫描中包含每个 Provider，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 减少每个 Provider 操作上限以进行激进的冒烟运行
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用配置文件存储认证并忽略仅环境覆盖

## 媒体实时测试套件

- 命令：`pnpm test:live:media`
- 目的：
  - 通过一个仓库原生入口点运行共享的图像、音乐和视频实时套件
  - 自动从 `~/.profile` 加载缺失的 Provider 环境变量
  - 默认自动将每个套件缩小到当前具有可用认证的 Provider
  - 重用 `scripts/test-live.mjs`，因此心跳和安静模式行为保持一致
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相关

- [测试](/help/testing) - 单元、集成、QA 和 Docker 套件
