---
mmh3_hash: "e9ea1cf8db4b9f05291d15d00c11828a"
summary: "测试套件:单元/e2e/实时套件、Docker 运行器以及每个测试覆盖的内容"
read_when:
  - 在本地或 CI 中运行测试
  - 为模型/提供程序错误添加回归
  - 调试网关 + 代理行为
---

# 测试

OpenClaw 有三个 Vitest 套件(单元/集成、e2e、实时)和一小组 Docker 运行器。

本文档是"我们如何测试"指南:
- 每个套件涵盖什么(以及故意*不*涵盖什么)
- 针对常见工作流(本地、推送前、调试)运行哪些命令
- 实时测试如何发现凭证并选择模型/提供程序
- 如何为真实世界的模型/提供程序问题添加回归

## 快速入门

大多数日子:
- 完整门禁(推送前预期):`pnpm lint && pnpm build && pnpm test`

当您触及测试或需要额外信心时:
- 覆盖门禁:`pnpm test:coverage`
- E2E 套件:`pnpm test:e2e`

调试真实提供程序/模型时(需要真实凭证):
- 实时套件(模型 + 网关工具/图像探测):`pnpm test:live`

提示:当您只需要一个失败案例时,优先通过下面描述的允许列表环境变量缩小实时测试范围。

## 测试套件(在哪里运行什么)

将套件视为"增加现实性"(以及增加不稳定性/成本):

### 单元 / 集成(默认)

- 命令:`pnpm test`
- 配置:`vitest.config.ts`
- 文件:`src/**/*.test.ts`
- 范围:
  - 纯单元测试
  - 进程内集成测试(网关身份验证、路由、工具、解析、配置)
  - 已知错误的确定性回归
- 期望:
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定

### E2E(网关冒烟)

- 命令:`pnpm test:e2e`
- 配置:`vitest.e2e.config.ts`
- 文件:`src/**/*.e2e.test.ts`
- 范围:
  - 多实例网关端到端行为
  - WebSocket/HTTP 界面、节点配对和更重的网络
- 期望:
  - 在 CI 中运行(在管道中启用时)
  - 不需要真实密钥
  - 比单元测试更多的活动部件(可能更慢)

### 实时(真实提供程序 + 真实模型)

- 命令:`pnpm test:live`
- 配置:`vitest.live.config.ts`
- 文件:`src/**/*.live.test.ts`
- 默认:**已启用** 通过 `pnpm test:live`(设置 `OPENCLAW_LIVE_TEST=1`)
- 范围:
  - "这个提供程序/模型*今天*是否真正使用真实凭证工作?"
  - 捕获提供程序格式更改、工具调用怪癖、身份验证问题和速率限制行为
- 期望:
  - 设计上不是 CI 稳定的(真实网络、真实提供程序策略、配额、中断)
  - 花费金钱/使用速率限制
  - 优先运行缩小的子集而不是"所有内容"
  - 实时运行将获取 `~/.profile` 以获取缺少的 API 密钥
  - Anthropic 密钥轮换:设置 `OPENCLAW_LIVE_ANTHROPIC_KEYS="sk-...,sk-..."`(或 `OPENCLAW_LIVE_ANTHROPIC_KEY=sk-...`)或多个 `ANTHROPIC_API_KEY*` 变量;测试将在速率限制时重试

## 我应该运行哪个套件?

使用此决策表:
- 编辑逻辑/测试:运行 `pnpm test`(如果您更改了很多,还可以运行 `pnpm test:coverage`)
- 触及网关网络 / WS 协议 / 配对:添加 `pnpm test:e2e`
- 调试"我的机器人停机了"/提供程序特定故障/工具调用:运行缩小的 `pnpm test:live`

## 实时:模型冒烟(配置文件密钥)

实时测试分为两层,以便我们可以隔离故障:
- "直接模型"告诉我们提供程序/模型是否可以使用给定密钥回答。
- "网关冒烟"告诉我们该模型的完整网关+代理管道是否工作(会话、历史、工具、沙箱策略等)。

### 层 1: 直接模型完成(无网关)

- 测试:`src/agents/models.profiles.live.test.ts`
- 目标:
  - 枚举已发现的模型
  - 使用 `getApiKeyForModel` 选择您有凭证的模型
  - 为每个模型运行小的完成(以及需要的有针对性的回归)
- 如何启用:
  - `pnpm test:live`(或如果直接调用 Vitest,则为 `OPENCLAW_LIVE_TEST=1`)
- 设置 `OPENCLAW_LIVE_MODELS=modern`(或 `all`,modern 的别名)以实际运行此套件;否则它会跳过以保持 `pnpm test:live` 专注于网关冒烟
- 如何选择模型:
  - `OPENCLAW_LIVE_MODELS=modern` 运行现代允许列表(Opus/Sonnet/Haiku 4.5、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.1、Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` 是现代允许列表的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-5,..."`(逗号允许列表)
- 如何选择提供程序:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`(逗号允许列表)
- 密钥来自哪里:
  - 默认情况下:配置文件存储和环境回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 以仅强制**配置文件存储**
- 为什么存在这个:
  - 将"提供程序 API 损坏/密钥无效"与"网关代理管道损坏"分开
  - 包含小的、隔离的回归(示例:OpenAI Responses/Codex Responses 推理重放 + 工具调用流)

### 层 2: 网关 + 开发代理冒烟("@openclaw" 实际做什么)

- 测试:`src/gateway/gateway-models.profiles.live.test.ts`
- 目标:
  - 启动进程内网关
  - 创建/修补 `agent:dev:*` 会话(每次运行的模型覆盖)
  - 迭代带密钥的模型并断言:
    - "有意义的"响应(无工具)
    - 真实的工具调用工作(read 探测)
    - 可选的额外工具探测(exec+read 探测)
    - OpenAI 回归路径(仅工具调用 → 跟进)保持工作
- 探测详细信息(以便您可以快速解释故障):
  - `read` 探测:测试在工作区中写入一个随机数文件,并要求代理 `read` 它并回显随机数。
  - `exec+read` 探测:测试要求代理 `exec`-将随机数写入临时文件,然后 `read` 它。
  - 图像探测:测试附加生成的 PNG(cat + 随机代码)并期望模型返回 `cat <CODE>`。
  - 实现参考:`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 如何启用:
  - `pnpm test:live`(或如果直接调用 Vitest,则为 `OPENCLAW_LIVE_TEST=1`)
- 如何选择模型:
  - 默认:现代允许列表(Opus/Sonnet/Haiku 4.5、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.1、Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代允许列表的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`(或逗号列表)以缩小范围
- 如何选择提供程序(避免"OpenRouter 所有内容"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`(逗号允许列表)
- 工具 + 图像探测在此实时测试中始终开启:
  - `read` 探测 + `exec+read` 探测(工具压力)
  - 当模型宣传图像输入支持时运行图像探测
  - 流程(高级):
    - 测试生成带有"CAT" + 随机代码的小 PNG(`src/gateway/live-image-probe.ts`)
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - 网关将附件解析为 `images[]`(`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - 嵌入式代理将多模态用户消息转发到模型
    - 断言:回复包含 `cat` + 代码(OCR 容差:允许轻微错误)

提示:要查看您可以在机器上测试什么(以及确切的 `provider/model` id),运行:

```bash
openclaw models list
openclaw models list --json
```

## 实时: Anthropic setup-token 冒烟

- 测试:`src/agents/anthropic.setup-token.live.test.ts`
- 目标:验证 Claude Code CLI setup-token(或粘贴的 setup-token 配置文件)可以完成 Anthropic 提示。
- 启用:
  - `pnpm test:live`(或如果直接调用 Vitest,则为 `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_SETUP_TOKEN=1`
- 令牌源(选择一个):
  - 配置文件:`OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test`
  - 原始令牌:`OPENCLAW_LIVE_SETUP_TOKEN_VALUE=sk-ant-oat01-...`
- 模型覆盖(可选):
  - `OPENCLAW_LIVE_SETUP_TOKEN_MODEL=anthropic/claude-opus-4-5`

设置示例:

```bash
openclaw models auth paste-token --provider anthropic --profile-id anthropic:setup-token-test
OPENCLAW_LIVE_SETUP_TOKEN=1 OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test pnpm test:live src/agents/anthropic.setup-token.live.test.ts
```

## 实时: CLI 后端冒烟(Claude Code CLI 或其他本地 CLI)

- 测试:`src/gateway/gateway-cli-backend.live.test.ts`
- 目标:使用本地 CLI 后端验证网关 + 代理管道,而不触及您的默认配置。
- 启用:
  - `pnpm test:live`(或如果直接调用 Vitest,则为 `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值:
  - 模型:`claude-cli/claude-sonnet-4-5`
  - 命令:`claude`
  - 参数:`["-p","--output-format","json","--dangerously-skip-permissions"]`
- 覆盖(可选):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2-codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 发送真实图像附件(路径注入到提示中)。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 将图像文件路径作为 CLI 参数而不是提示注入传递。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`(或 `"list"`)在设置 `IMAGE_ARG` 时控制如何传递图像参数。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 发送第二轮并验证恢复流程。
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` 保持 Claude Code CLI MCP 配置启用(默认使用临时空文件禁用 MCP 配置)。

示例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

### 推荐的实时配方

狭窄、显式的允许列表最快且最不易出错:

- 单个模型,直接(无网关):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单个模型,网关冒烟:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个提供程序的工具调用:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-5,google/gemini-3-flash-preview,zai/glm-4.7,minimax/minimax-m2.1" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 焦点(Gemini API 密钥 + Antigravity):
  - Gemini (API 密钥):`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth):`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-5-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注意:
- `google/...` 使用 Gemini API(API 密钥)。
- `google-antigravity/...` 使用 Antigravity OAuth 桥接(Cloud Code Assist 样式代理端点)。
- `google-gemini-cli/...` 使用您机器上的本地 Gemini CLI(单独的身份验证 + 工具怪癖)。
- Gemini API vs Gemini CLI:
  - API: OpenClaw 通过 HTTP 调用 Google 的托管 Gemini API(API 密钥/配置文件身份验证);这是大多数用户所说的"Gemini"。
  - CLI: OpenClaw 调用本地 `gemini` 二进制文件;它有自己的身份验证,行为可能不同(流式传输/工具支持/版本偏差)。

## 实时:模型矩阵(我们覆盖什么)

没有固定的"CI 模型列表"(实时是可选的),但这些是**推荐的**模型,可以在有密钥的开发机器上定期覆盖。

### 现代冒烟集(工具调用 + 图像)

这是我们期望保持工作的"常见模型"运行:
- OpenAI(非 Codex):`openai/gpt-5.2`(可选:`openai/gpt-5.1`)
- OpenAI Codex:`openai-codex/gpt-5.2`(可选:`openai-codex/gpt-5.2-codex`)
- Anthropic:`anthropic/claude-opus-4-5`(或 `anthropic/claude-sonnet-4-5`)
- Google (Gemini API):`google/gemini-3-pro-preview` 和 `google/gemini-3-flash-preview`(避免旧的 Gemini 2.x 模型)
- Google (Antigravity):`google-antigravity/claude-opus-4-5-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI (GLM):`zai/glm-4.7`
- MiniMax:`minimax/minimax-m2.1`

使用工具 + 图像运行网关冒烟:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-5,google/gemini-3-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-5-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/minimax-m2.1" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线:工具调用(Read + 可选 Exec)

每个提供程序系列至少选择一个:
- OpenAI:`openai/gpt-5.2`(或 `openai/gpt-5-mini`)
- Anthropic:`anthropic/claude-opus-4-5`(或 `anthropic/claude-sonnet-4-5`)
- Google:`google/gemini-3-flash-preview`(或 `google/gemini-3-pro-preview`)
- Z.AI (GLM):`zai/glm-4.7`
- MiniMax:`minimax/minimax-m2.1`

可选的额外覆盖(很好有):
- xAI:`xai/grok-4`(或最新可用)
- Mistral:`mistral/`…(选择一个您已启用的"工具"功能模型)
- Cerebras:`cerebras/`…(如果您有访问权限)
- LM Studio:`lmstudio/`…(本地;工具调用取决于 API 模式)

### 视觉:图像发送(附件 → 多模态消息)

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的模型(Claude/Gemini/OpenAI 视觉功能变体等)以执行图像探测。

### 聚合器 / 备用网关

如果您启用了密钥,我们还支持通过以下方式进行测试:
- OpenRouter:`openrouter/...`(数百个模型;使用 `openclaw models scan` 查找支持工具+图像的候选者)
- OpenCode Zen:`opencode/...`(通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 进行身份验证)

您可以在实时矩阵中包含的更多提供程序(如果您有凭证/配置):
- 内置:`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`(自定义端点):`minimax`(云/API),加上任何与 OpenAI/Anthropic 兼容的代理(LM Studio、vLLM、LiteLLM 等)

提示:不要尝试在文档中硬编码"所有模型"。权威列表是您机器上 `discoverModels(...)` 返回的任何内容 + 任何可用的密钥。

## 凭证(永不提交)

实时测试发现凭证的方式与 CLI 相同。实际影响:
- 如果 CLI 工作,实时测试应该找到相同的密钥。
- 如果实时测试说"无凭证",则以与调试 `openclaw models list` / 模型选择相同的方式进行调试。

- 配置文件存储:`~/.openclaw/credentials/`(首选;测试中"配置文件密钥"的含义)
- 配置:`~/.openclaw/openclaw.json`(或 `OPENCLAW_CONFIG_PATH`)

如果您想依赖环境密钥(例如,在 `~/.profile` 中导出),请在 `source ~/.profile` 后运行本地测试,或使用下面的 Docker 运行器(它们可以将 `~/.profile` 挂载到容器中)。

## Deepgram 实时(音频转录)

- 测试:`src/media-understanding/providers/deepgram/audio.live.test.ts`
- 启用:`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Docker 运行器(可选的"在 Linux 中工作"检查)

这些在仓库 Docker 镜像内运行 `pnpm test:live`,挂载您的本地配置目录和工作区(如果挂载,则获取 `~/.profile`):

- 直接模型:`pnpm test:docker:live-models`(脚本:`scripts/test-live-models-docker.sh`)
- 网关 + 开发代理:`pnpm test:docker:live-gateway`(脚本:`scripts/test-live-gateway-models-docker.sh`)
- 入职向导(TTY,完整脚手架):`pnpm test:docker:onboard`(脚本:`scripts/e2e/onboard-docker.sh`)
- 网关网络(两个容器,WS 身份验证 + 健康):`pnpm test:docker:gateway-network`(脚本:`scripts/e2e/gateway-network-docker.sh`)
- 插件(自定义扩展加载 + 注册表冒烟):`pnpm test:docker:plugins`(脚本:`scripts/e2e/plugins-docker.sh`)

有用的环境变量:

- `OPENCLAW_CONFIG_DIR=...`(默认:`~/.openclaw`)挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`(默认:`~/.openclaw/workspace`)挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`(默认:`~/.profile`)挂载到 `/home/node/.profile` 并在运行测试之前获取
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 缩小运行范围
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 确保凭证来自配置文件存储(而非环境)

## 文档健全性

编辑文档后运行文档检查:`pnpm docs:list`。

## 离线回归(CI 安全)

这些是"真实管道"回归,没有真实提供程序:
- 网关工具调用(模拟 OpenAI,真实网关 + 代理循环):`src/gateway/gateway.tool-calling.mock-openai.test.ts`
- 网关向导(WS `wizard.start`/`wizard.next`,写入配置 + 强制执行身份验证):`src/gateway/gateway.wizard.e2e.test.ts`

## 代理可靠性评估(技能)

我们已经有一些像"代理可靠性评估"一样运行的 CI 安全测试:
- 通过真实网关 + 代理循环的模拟工具调用(`src/gateway/gateway.tool-calling.mock-openai.test.ts`)。
- 验证会话接线和配置效果的端到端向导流程(`src/gateway/gateway.wizard.e2e.test.ts`)。

技能仍然缺少什么(请参阅[技能](/tools/skills)):
- **决策:**当技能在提示中列出时,代理是否选择正确的技能(或避免不相关的技能)?
- **合规性:**代理是否在使用前阅读 `SKILL.md` 并遵循所需的步骤/参数?
- **工作流合同:**断言工具顺序、会话历史继承和沙箱边界的多轮场景。

未来的评估应该首先保持确定性:
- 使用模拟提供程序断言工具调用 + 顺序、技能文件读取和会话接线的场景运行器。
- 一小组以技能为重点的场景(使用 vs 避免、门控、提示注入)。
- 可选的实时评估(可选,环境门控)仅在 CI 安全套件到位后。

## 添加回归(指导)

当您修复在实时中发现的提供程序/模型问题时:
- 如果可能,添加 CI 安全回归(模拟/存根提供程序,或捕获确切的请求形状转换)
- 如果它本质上仅限实时(速率限制、身份验证策略),请通过环境变量保持实时测试狭窄且可选
- 优先针对捕获错误的最小层:
  - 提供程序请求转换/重放错误 → 直接模型测试
  - 网关会话/历史/工具管道错误 → 网关实时冒烟或 CI 安全网关模拟测试
