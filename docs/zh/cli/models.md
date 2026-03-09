---
mmh3_hash: "60f5298fc6a4f460ea483ce5e209fd97"
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
当提供商使用快照可用时,OAuth/令牌状态部分包括
提供商使用标头。
添加 `--probe` 以对每个配置的提供商配置文件运行实时身份验证探测。
探测是真实请求(可能消耗令牌并触发速率限制)。
使用 `--agent <id>` 检查已配置 Agent 的模型/身份验证状态。省略时,命令使用 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`(如果已设置),否则使用配置的默认 Agent。

注意:

- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- 模型引用通过在**第一个** `/` 上拆分来解析。如果模型 ID 包含 `/`(OpenRouter 风格),请包含提供商前缀(示例:`openrouter/moonshotai/kimi-k2`)。
- 如果省略提供商,OpenClaw 将输入视为别名或**默认提供商**的模型(仅当模型 ID 中没有 `/` 时才有效)。
- `models status` 可能在身份验证输出中为非密钥占位符显示 `marker(<value>)`(例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`qwen-oauth`、`ollama-local`),而不是将其屏蔽为密钥。

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

## 别名 + 回退

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 身份验证配置文件

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token
openclaw models auth paste-token
```
`models auth login` 运行提供商插件的身份验证流程(OAuth/API 密钥)。使用
`openclaw plugins list` 查看已安装的提供商。

注意:

- `setup-token` 提示输入 setup-token 值(在任何机器上使用 `claude setup-token` 生成它)。
- `paste-token` 接受从其他地方生成的令牌字符串或来自自动化的令牌字符串。
- Anthropic 政策说明:setup-token 支持是技术兼容性。Anthropic 过去曾在 Claude Code 之外的某些订阅使用中设置限制,因此在广泛使用之前请确认当前条款。
