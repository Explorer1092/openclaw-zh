---
mmh3_hash: "f8ef8937284194d04366efbc4180549d"
summary: "`openclaw onboard` 的 CLI 参考（交互式入职向导）"
read_when:
  - 您想要 Gateway、工作空间、身份验证、Channel 和技能的引导设置
title: "Onboard"
---

# `openclaw onboard`

用于本地或远程 Gateway 设置的完整引导入职。当您希望 OpenClaw 在一个流程中引导完成模型身份验证、工作空间、Gateway、Channel、技能和健康检查时使用此命令。

## 相关指南

<CardGroup cols={2}>
  <Card title="CLI 入职中心" href="/start/wizard" icon="rocket">
    交互式 CLI 流程演练。
  </Card>
  <Card title="入职概述" href="/start/onboarding-overview" icon="map">
    OpenClaw 入职如何组合在一起。
  </Card>
  <Card title="CLI 设置参考" href="/start/wizard-cli-reference" icon="book">
    输出、内部机制和每步行为。
  </Card>
  <Card title="CLI 自动化" href="/start/wizard-cli-automation" icon="terminal">
    非交互式标志和脚本设置。
  </Card>
  <Card title="macOS 应用入职" href="/start/onboarding" icon="apple">
    macOS 菜单栏应用的入职流程。
  </Card>
</CardGroup>

## 示例

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` 使用 Plugin 拥有的迁移 Provider（如 Hermes）。它只在全新的 OpenClaw 设置上运行；如果现有配置、凭据、Session 或工作空间内存/身份文件存在，请在导入前重置或选择全新设置。

`--modern` 启动 Crestodian 会话式入职预览。不使用
`--modern` 时，`openclaw onboard` 保留经典入职流程。

明文 `ws://` 可用于回环地址、私有 IP 字面量、`.local` 以及 Tailnet `*.ts.net` Gateway URL。对于其他受信任的私有 DNS 名称，请在入职进程环境中设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

## 语言设置

交互式入职使用 CLI 向导语言设置来显示固定的设置文案。解析顺序为：

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英语回退

支持的向导语言为 `en`、`zh-CN` 和 `zh-TW`。语言设置值可以使用下划线或 POSIX 后缀形式，例如 `zh_CN.UTF-8`。产品名称、命令名称、配置键、URL、Provider ID、模型 ID 和 Plugin/Channel 标签保持为字面值。

示例：

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

非交互式自定义 Provider：

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` 在非交互模式下是可选的。如果省略，入职检查 `CUSTOM_API_KEY`。
OpenClaw 自动将常见视觉模型 ID 标记为支持图像。对未知的自定义视觉 ID 传递 `--custom-image-input`，或传递 `--custom-text-input` 强制仅文本元数据。

LM Studio 在非交互模式下也支持特定于 Provider 的密钥标志：

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

非交互式 Ollama：

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` 默认为 `http://127.0.0.1:11434`。`--custom-model-id` 是可选的；如果省略，入职使用 Ollama 建议的默认值。云模型 ID（如 `kimi-k2.5:cloud`）也可以在这里使用。

将 Provider 密钥存储为引用而非明文：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref`，入职写入环境变量支持的引用而不是明文密钥值。
对于身份验证配置文件支持的 Provider，这会写入 `keyRef` 条目；对于自定义 Provider，这会将 `models.providers.<id>.apiKey` 写入环境引用（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非交互式 `ref` 模式契约：

- 在入职进程环境中设置 Provider 环境变量（例如 `OPENAI_API_KEY`）。
- 除非该环境变量也已设置，否则不要传递内联密钥标志（例如 `--openai-api-key`）。
- 如果传递了内联密钥标志而未设置所需的环境变量，入职将快速失败并提供指导。

非交互模式下的 Gateway 令牌选项：

- `--gateway-auth token --gateway-token <token>` 存储明文令牌。
- `--gateway-auth token --gateway-token-ref-env <name>` 将 `gateway.auth.token` 存储为环境变量 SecretRef。
- `--gateway-token` 和 `--gateway-token-ref-env` 互斥。
- `--gateway-token-ref-env` 需要入职进程环境中的非空环境变量。
- 使用 `--install-daemon` 时，当令牌身份验证需要令牌时，SecretRef 管理的 Gateway 令牌会被验证，但不会作为已解析的明文保留在监督服务环境元数据中。
- 使用 `--install-daemon` 时，如果令牌模式需要令牌而已配置的令牌 SecretRef 未解析，入职将关闭失败并提供补救指导。
- 使用 `--install-daemon` 时，如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置，且 `gateway.auth.mode` 未设置，入职将阻止安装直到显式设置模式。
- 本地入职将 `gateway.mode="local"` 写入配置。如果后来的配置文件缺少 `gateway.mode`，请将其视为配置损坏或不完整的手动编辑，而不是有效的本地模式快捷方式。
- 本地入职在所选设置路径需要时安装选定的可下载 Plugin。
- 远程入职仅写入远程 Gateway 的连接信息，不安装本地 Plugin 包。
- `--allow-unconfigured` 是单独的 Gateway 运行时紧急措施。它不意味着入职可以省略 `gateway.mode`。

示例：

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

非交互式本地 Gateway 健康：

- 除非传递 `--skip-health`，否则入职等待可达的本地 Gateway 后才成功退出。
- `--install-daemon` 首先启动托管 Gateway 安装路径。没有它，您必须已经运行了本地 Gateway，例如 `openclaw gateway run`。
- 如果您只想在自动化中进行配置/工作空间/引导写入，请使用 `--skip-health`。
- 如果您自己管理工作空间文件，请传递 `--skip-bootstrap` 以设置 `agents.defaults.skipBootstrap: true` 并跳过创建 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 首先尝试计划任务，如果任务创建被拒绝则回退到每用户启动文件夹登录项。

使用参考模式的交互式入职行为：

- 在提示时选择**使用密钥引用**。
- 然后选择：
  - 环境变量
  - 已配置的密钥 Provider（`file` 或 `exec`）
- 入职在保存引用之前执行快速预检验证。
  - 如果验证失败，入职显示错误并让您重试。

### 非交互式 Z.AI 端点选择

<Note>
`--auth-choice zai-api-key` 自动检测您密钥的最佳 Z.AI 端点（优先使用带 `zai/glm-5.1` 的通用 API）。如果您特别想要 GLM 编码计划端点，请选择 `zai-coding-global` 或 `zai-coding-cn`。
</Note>

```bash
# 无提示端点选择
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# 其他 Z.AI 端点选择：
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

非交互式 Mistral 示例：

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## 流程说明

<AccordionGroup>
  <Accordion title="流程类型">
    - `quickstart`：最少提示，自动生成 Gateway 令牌。
    - `manual`：完整提示，包括端口、绑定和身份验证（`advanced` 的别名）。
    - `import`：运行检测到的迁移 Provider，预览计划，然后在确认后应用。

  </Accordion>
  <Accordion title="Provider 预过滤">
    当身份验证选择暗示首选 Provider 时，入职会将默认模型和允许列表选择器预过滤到该 Provider。对于 Volcengine 和 BytePlus，这也匹配编码计划变体（`volcengine-plan/*`、`byteplus-plan/*`）。

    如果首选 Provider 过滤器尚未产生已加载的模型，入职会回退到未过滤的目录，而不是让选择器为空。

  </Accordion>
  <Accordion title="网络搜索后续操作">
    某些网络搜索 Provider 会触发特定于 Provider 的后续提示：

    - **Grok** 可以提供可选的 `x_search` 设置，使用相同的 `XAI_API_KEY` 和 `x_search` 模型选择。
    - **Kimi** 可以询问 Moonshot API 区域（`api.moonshot.ai` 对比 `api.moonshot.cn`）和默认的 Kimi 网络搜索模型。

  </Accordion>
  <Accordion title="其他行为">
    - 本地入职 DM 范围行为：[CLI 设置参考](/start/wizard-cli-reference#outputs-and-internals)。
    - 最快的首次聊天：`openclaw dashboard`（控制 UI，无 Channel 设置）。
    - 自定义 Provider：连接任何 OpenAI 或 Anthropic 兼容端点，包括未列出的托管 Provider。使用"未知"自动检测。
    - 如果检测到 Hermes 状态，入职会提供迁移流程。使用 [Migrate](/cli/migrate) 进行干运行计划、覆盖模式、报告和精确映射。

  </Accordion>
</AccordionGroup>

## 常见后续命令

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

仅需要基准配置/工作空间时使用 `openclaw setup`。之后使用 `openclaw configure` 进行有针对性的更改，使用 `openclaw channels add` 进行仅 Channel 设置。

<Note>
`--json` 不暗示非交互模式。对于脚本，请使用 `--non-interactive`。
</Note>
