---
mmh3_hash: "dcfd03a8f54726b443fa4e7f67ebbf7e"
title: "`openclaw models`"
sidebarTitle: "openclaw models"
summary: "`openclaw models` 的 CLI 参考(状态/列表/设置/扫描、别名、回退、身份验证)"
read_when:
  - 您想更改默认模型或查看提供商身份验证状态
  - 您想扫描可用的模型/提供商并调试身份验证配置文件
---

# `openclaw models`

模型发现、扫描和配置(默认模型、回退、身份验证配置文件)。

相关:

- 提供商 + 模型:[模型](/providers/models)
- 提供商身份验证设置:[入门](/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 显示解析的默认值/回退加上身份验证概述。
当提供商使用快照可用时,OAuth/API 密钥状态部分包括
提供商使用窗口和配额快照。
当前使用窗口提供商:Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。使用身份验证在可用时来自提供商特定的 Hook;
否则 OpenClaw 回退到匹配的 OAuth/API 密钥凭据(来自身份验证配置文件、环境变量或配置)。
在 `--json` 输出中,`auth.providers` 是环境变量/配置/存储感知的提供商
概述,而 `auth.oauth` 仅是身份验证存储配置文件健康状况。
添加 `--probe` 以对每个配置的提供商配置文件运行实时身份验证探测。
探测是真实请求(可能消耗令牌并触发速率限制)。
使用 `--agent <id>` 检查已配置 Agent 的模型/身份验证状态。省略时,
命令使用 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`(如果已设置),否则使用配置的默认 Agent。
探测行可以来自身份验证配置文件、环境变量凭据或 `models.json`。

注意:

- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- 模型引用通过在**第一个** `/` 上拆分来解析。如果模型 ID 包含 `/`(OpenRouter 风格),请包含提供商前缀(示例:`openrouter/moonshotai/kimi-k2`)。
- 如果省略提供商,OpenClaw 将输入首先解析为别名,然后解析为该确切模型 ID 的唯一已配置提供商匹配,最后才回退到配置的默认提供商并显示弃用警告。如果该提供商不再公开配置的默认模型,OpenClaw 回退到第一个配置的提供商/模型,而不是呈现过时的已删除提供商默认值。
- `models status` 可能在身份验证输出中为非密钥占位符显示 `marker(<value>)`(例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`),而不是将其屏蔽为密钥。

### `models status`

选项:

- `--json`
- `--plain`
- `--check`(退出 1=过期/缺失,2=即将过期)
- `--probe`(对配置的身份验证配置文件进行实时探测)
- `--probe-provider <name>`(探测一个提供商)
- `--probe-profile <id>`(重复或逗号分隔的配置文件 ID)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`(已配置的 Agent ID;覆盖 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

探测状态分类:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

预期的探测详细/原因代码情况:

- `excluded_by_auth_order`:存在已存储的配置文件,但显式的 `auth.order.<provider>` 将其省略,因此探测报告排除而不是尝试它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`:配置文件存在但不符合条件/无法解析。
- `no_model`:提供商身份验证存在,但 OpenClaw 无法为该提供商解析可探测的模型候选。

## 别名 + 回退

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 身份验证配置文件

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是交互式身份验证助手。它可以启动提供商身份验证
流程(OAuth/API 密钥)或根据您选择的提供商引导您进行手动令牌粘贴。

`models auth login` 运行提供商插件的身份验证流程(OAuth/API 密钥)。使用
`openclaw plugins list` 查看已安装的提供商。

示例:

```bash
openclaw models auth login --provider openai-codex --set-default
```

注意:

- `setup-token` 和 `paste-token` 仍然是针对公开令牌身份验证方法的提供商的通用令牌命令。
- `setup-token` 需要交互式 TTY 并运行提供商的令牌身份验证方法(当提供商公开时默认为该提供商的 `setup-token` 方法)。
- `paste-token` 接受从其他地方生成的令牌字符串或来自自动化的令牌字符串。
- `paste-token` 需要 `--provider`,提示输入令牌值,并将其写入默认配置文件 ID `<provider>:manual`,除非您传递 `--profile-id`。
- `paste-token --expires-in <duration>` 从相对持续时间(如 `365d` 或 `12h`)存储绝对令牌到期时间。
- Anthropic 计费说明:对于 OpenClaw 中的 Anthropic,实际选择是 **API 密钥**或**具有额外使用量的 Claude 订阅**。Anthropic 于 **2026 年 4 月 4 日太平洋时间下午 12:00 / 英国夏令时间晚上 8:00** 通知 OpenClaw 用户,**OpenClaw** Claude 登录路径算作第三方套件使用,需要与订阅单独计费的**额外使用量**。我们的本地重现也表明,OpenClaw 标识提示字符串在 Anthropic SDK + API 密钥路径上不会重现。
- Anthropic `setup-token` / `paste-token` 再次作为传统/手动 OpenClaw 路径提供。使用它们时请注意 Anthropic 告知 OpenClaw 用户此路径需要**额外使用量**。
