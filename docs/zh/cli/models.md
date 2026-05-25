---
mmh3_hash: "f0fda7d40358765f563555bc4c8eea0b"
summary: "`openclaw models` 的 CLI 参考（状态/列表/设置/扫描、别名、回退、身份验证）"
read_when:
  - 您想更改默认模型或查看 Provider 身份验证状态
  - 您想扫描可用的模型/Provider 并调试身份验证配置文件
title: "Models"
---

# `openclaw models`

模型发现、扫描和配置（默认模型、回退、身份验证配置文件）。

相关：

- Provider + 模型：[Models](/providers/models)
- 模型选择概念 + `/models` 斜杠命令：[Models 概念](/concepts/models)
- Provider 身份验证设置：[入门](/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 显示已解析的默认/回退值以及身份验证概览。
当 Provider 使用快照可用时，OAuth/API 密钥状态部分包含 Provider 使用窗口和配额快照。
当前使用窗口 Provider：Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi 和 z.ai。使用身份验证来自 Provider 特定的 hooks（如可用）；否则 OpenClaw 回退到来自身份验证配置文件、环境变量或配置的匹配 OAuth/API 密钥凭据。
在 `--json` 输出中，`auth.providers` 是环境/配置/存储感知的 Provider 概览，而 `auth.oauth` 仅是身份验证存储配置文件健康状态。
添加 `--probe` 以对每个已配置的 Provider 配置文件运行实时身份验证探测。探测是真实请求（可能消耗令牌并触发速率限制）。
使用 `--agent <id>` 检查已配置 Agent 的模型/身份验证状态。省略时，命令使用 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`（如已设置），否则使用已配置的默认 Agent。
探测行可以来自身份验证配置文件、环境变量凭据或 `models.json`。
对于 Codex OAuth 故障排除，`openclaw models status`、
`openclaw models auth list --provider openai-codex` 和
`openclaw config get agents.defaults.model --json` 是确认 Agent 是否具有可用的 `openai-codex` 身份验证配置文件以通过原生 Codex 运行时处理 `openai/*` 的最快方法。请参阅 [OpenAI Provider 设置](/providers/openai#check-and-recover-codex-oauth-routing)。

注意事项：

- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- `models list` 是只读的：它读取配置、身份验证配置文件、现有目录状态和 Provider 拥有的目录行，但不重写 `models.json`。
- `Auth` 列是 Provider 级别且只读的。它从本地身份验证配置文件元数据、环境标记、已配置的 Provider 密钥、本地 Provider 标记、AWS Bedrock 环境/配置文件标记和 Plugin 合成身份验证元数据计算；它不加载 Provider 运行时、读取密钥链密钥、调用 Provider API 或证明确切的每模型执行就绪状态。
- `models list --all --provider <id>` 可以包含来自 Plugin 清单或捆绑 Provider 目录元数据的 Provider 拥有的静态目录行，即使您尚未与该 Provider 进行身份验证。这些行在配置匹配的身份验证之前仍显示为不可用。
- `models list` 在 Provider 目录发现缓慢时保持控制平面响应。默认和已配置视图在短暂等待后回退到已配置或合成模型行，并让发现在后台完成。当您需要确切的完整发现目录且愿意等待 Provider 发现时，使用 `--all`。
- 宽泛的 `models list --all` 合并清单目录行而不加载 Provider 运行时补充 hooks。Provider 过滤的清单快速路径仅使用标记为 `static` 的 Provider；标记为 `refreshable` 的 Provider 保持注册表/缓存支持并将清单行作为补充附加，而标记为 `runtime` 的 Provider 保持注册表/运行时发现。
- `models list` 保持原生模型元数据和运行时上限不同。在表格输出中，当有效运行时上限与原生上下文窗口不同时，`Ctx` 显示 `contextTokens/contextWindow`；JSON 行在 Provider 公开该上限时包含 `contextTokens`。
- `models list --provider <id>` 按 Provider ID 过滤，如 `moonshot` 或 `openai-codex`。它不接受交互式 Provider 选择器中的显示标签，如 `Moonshot AI`。
- 模型引用通过拆分**第一个** `/` 解析。如果模型 ID 包含 `/`（OpenRouter 风格），请包含 Provider 前缀（示例：`openrouter/moonshotai/kimi-k2`）。
- 如果省略 Provider，OpenClaw 首先将输入解析为别名，然后作为该确切模型 ID 的唯一已配置 Provider 匹配，最后才以弃用警告回退到已配置的默认 Provider。如果该 Provider 不再公开已配置的默认模型，OpenClaw 回退到第一个已配置的 Provider/模型，而不是显示过期的已删除 Provider 默认值。
- `models status` 可能在身份验证输出中显示 `marker(<value>)`，用于非密钥占位符（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是将其作为密钥屏蔽。

### Models scan

`models scan` 读取 OpenRouter 的公共 `:free` 目录并对候选进行回退使用排名。目录本身是公开的，因此仅元数据扫描不需要 OpenRouter 密钥。

默认情况下，OpenClaw 尝试通过实时模型调用探测工具和图像支持。
如果没有配置 OpenRouter 密钥，命令回退到仅元数据输出，并解释 `:free` 模型仍然需要 `OPENROUTER_API_KEY` 才能进行探测和推断。

选项：

- `--no-probe`（仅元数据；无配置/密钥查找）
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`（目录请求和每探测超时）
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` 和 `--set-image` 需要实时探测；仅元数据扫描结果是信息性的，不会应用到配置中。

### Models status

选项：

- `--json`
- `--plain`
- `--check`（退出 1=已过期/缺失，2=即将过期）
- `--probe`（已配置身份验证配置文件的实时探测）
- `--probe-provider <name>`（探测一个 Provider）
- `--probe-profile <id>`（重复或逗号分隔的配置文件 ID）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已配置的 Agent ID；覆盖 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

`--json` 保留 stdout 用于 JSON 有效载荷。身份验证配置文件、Provider 和启动诊断被路由到 stderr，以便脚本可以将 stdout 直接管道传输到 `jq` 等工具。

探测状态分类：

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

预期的探测详细信息/原因码情况：

- `excluded_by_auth_order`：存在已存储的配置文件，但显式 `auth.order.<provider>` 省略了它，因此探测报告排除而不是尝试它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：配置文件存在但不符合条件/无法解析。
- `no_model`：Provider 身份验证存在，但 OpenClaw 无法为该 Provider 解析可探测的模型候选。

## 别名 + 回退

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 身份验证配置文件

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是交互式身份验证助手。它可以启动 Provider 身份验证流程（OAuth/API 密钥）或根据您选择的 Provider 引导您进行手动令牌粘贴。

`models auth list` 列出选定 Agent 的已保存身份验证配置文件，不打印令牌、API 密钥或 OAuth 密钥材料。使用 `--provider <id>` 过滤到一个 Provider，如 `openai-codex`，使用 `--json` 进行脚本处理。

`models auth login` 运行 Provider Plugin 的身份验证流程（OAuth/API 密钥）。使用 `openclaw plugins list` 查看已安装的 Provider。
使用 `openclaw models auth --agent <id> <subcommand>` 将身份验证结果写入特定的已配置 Agent 存储。父级 `--agent` 标志由 `add`、`list`、`login`、`paste-api-key`、`setup-token`、`paste-token` 和 `login-github-copilot` 使用。

对于 OpenAI 模型，`--provider openai` 默认为 ChatGPT/Codex 账户登录。仅当您希望添加 OpenAI API 密钥配置文件（通常作为 Codex 订阅限制的备份）时，才使用 `--method api-key`。旧版 `--provider openai-codex` 拼写对现有脚本仍然有效。

示例：

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai-codex
openclaw models auth list --provider openai
```

注意事项：

- `login` 接受 `--profile-id <id>`，用于在登录时支持命名配置文件的 Provider。使用此选项可使同一 Provider 的多个登录保持独立。
- `paste-api-key` 接受在其他地方生成的 API 密钥，提示输入密钥值，并将其写入默认配置文件 ID `<provider>:manual`，除非传递 `--profile-id`。在自动化中，通过 stdin 管道传输密钥，例如 `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai-codex`。
- `setup-token` 和 `paste-token` 仍然是公开令牌身份验证方法的 Provider 的通用令牌命令。
- `setup-token` 需要交互式 TTY 并运行 Provider 的令牌身份验证方法（在 Provider 公开时默认为该 Provider 的 `setup-token` 方法）。
- `paste-token` 接受来自其他地方生成的或来自自动化的令牌字符串。
- `paste-token` 需要 `--provider`，提示输入令牌值，并将其写入默认配置文件 ID `<provider>:manual`，除非传递 `--profile-id`。
- `paste-token --expires-in <duration>` 从相对持续时间（如 `365d` 或 `12h`）存储绝对令牌到期时间。
- 对于 `openai-codex`，OpenAI API 密钥和 ChatGPT/OAuth 令牌材料是不同的身份验证形式。对于 `sk-...` OpenAI API 密钥使用 `paste-api-key`，仅对令牌身份验证材料使用 `paste-token`。
- Anthropic 注意：Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 使用再次被允许，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 使用视为此集成的授权使用，除非 Anthropic 发布新政策。
- Anthropic `setup-token` / `paste-token` 仍然作为支持的 OpenClaw 令牌路径可用，但 OpenClaw 现在在可用时优先使用 Claude CLI 复用和 `claude -p`。

## 相关

- [CLI 参考](/cli)
- [模型选择](/concepts/model-providers)
- [模型故障转移](/concepts/model-failover)
