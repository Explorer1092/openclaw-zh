---
title: "`openclaw onboard`"
sidebarTitle: "openclaw onboard"
mmh3_hash: "5fc9ee7d3c0ae5dc5c13c3d9cf7fe8c0"
summary: "`openclaw onboard` 的 CLI 参考(交互式入职向导)"
read_when:
  - 您想要Gateway、工作区、身份验证、Channel和技能的指导性设置
---

# `openclaw onboard`

交互式入职向导(本地或远程Gateway设置)。

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
openclaw onboard --mode remote --remote-url ws://gateway-host:18789
```

非交互式自定义提供商:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --custom-compatibility openai
```

`--custom-api-key` 在非交互模式下是可选的。如果省略,入职检查 `CUSTOM_API_KEY`。

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

流程注意事项:

- `quickstart`:最少提示,自动生成Gateway令牌。
- `manual`:端口/绑定/身份验证的完整提示(`advanced` 的别名)。
- 最快的第一次聊天:`openclaw dashboard`(控制 UI,无Channel设置)。
- 自定义提供商:连接任何 OpenAI 或 Anthropic 兼容端点,包括未列出的托管提供商。使用 Unknown 自动检测。

## 常见后续命令

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 不意味着非交互模式。使用 `--non-interactive` 用于脚本。
</Note>
