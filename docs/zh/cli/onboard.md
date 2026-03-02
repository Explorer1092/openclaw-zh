---
title: "`openclaw onboard`"
sidebarTitle: "openclaw onboard"
mmh3_hash: "27b64506787a42048d4aeea1b888a942"
summary: "`openclaw onboard` 的 CLI 参考(交互式入职向导)"
read_when:
  - 您想要 Gateway、工作区、身份验证、Channel 和 Skill 的指导性设置
---

# `openclaw onboard`

交互式入职向导(本地或远程 Gateway 设置)。

## 相关指南

- CLI 入职中心:[入职向导 (CLI)](/start/wizard)
- 入职概述:[入职概述](/start/onboarding-overview)
- CLI 入职参考:[CLI 入职参考](/start/wizard-cli-reference)
- CLI 自动化:[CLI 自动化](/start/wizard-cli-automation)
- macOS 入职:[入职 (macOS 应用)](/start/onboarding)

## 示例

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

对于纯文本私有网络 `ws://` 目标(仅限受信任的网络),请在入职流程环境中设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

非交互式自定义提供商:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` 在非交互模式下是可选的。如果省略,入职检查 `CUSTOM_API_KEY`。

将提供商密钥存储为引用而不是明文:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 时,入职写入基于环境变量的引用而不是明文密钥值。
对于基于身份验证配置文件的提供商,这会写入 `keyRef` 条目;对于自定义提供商,这会将 `models.providers.<id>.apiKey` 写入为环境变量引用(例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)。

非交互式 `ref` 模式约定:

- 在入职流程环境中设置提供商环境变量(例如 `OPENAI_API_KEY`)。
- 除非也设置了该环境变量,否则不要传递内联密钥标志(例如 `--openai-api-key`)。
- 如果在没有必要环境变量的情况下传递内联密钥标志,入职会快速失败并提供指导。

交互式入职与引用模式的行为:

- 在提示时选择**使用密钥引用**。
- 然后选择:
  - 环境变量
  - 已配置的密钥提供商(`file` 或 `exec`)
- 入职在保存引用之前执行快速预检验证。
  - 如果验证失败,入职会显示错误并允许您重试。

非交互式 Z.AI 端点选择:

注意:`--auth-choice zai-api-key` 现在自动检测您密钥的最佳 Z.AI 端点(优先使用 `zai/glm-5` 的通用 API)。如果您特别想要 GLM Coding Plan 端点,请选择 `zai-coding-global` 或 `zai-coding-cn`。

```bash
# 无提示端点选择
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# 其他 Z.AI 端点选择:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

非交互式 Mistral 示例:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

流程注意事项:

- `quickstart`:最少提示,自动生成 Gateway 令牌。
- `manual`:端口/绑定/身份验证的完整提示(`advanced` 的别名)。
- 本地入职 DM 范围行为:[CLI 入职参考](/start/wizard-cli-reference#outputs-and-internals)。
- 最快的第一次聊天:`openclaw dashboard`(控制 UI,无 Channel 设置)。
- 自定义提供商:连接任何 OpenAI 或 Anthropic 兼容端点,包括未列出的托管提供商。使用 Unknown 自动检测。

## 常见后续命令

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 不意味着非交互模式。使用 `--non-interactive` 用于脚本。
</Note>
