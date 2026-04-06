---
mmh3_hash: "cbd5b35c8b69b8dd5622174ff3a0ad2e"
title: "OpenCode"
sidebarTitle: "OpenCode"
summary: "将 OpenCode Zen 和 Go 目录与 OpenClaw 一起使用"
read_when:
  - 您想要 OpenCode 托管的模型访问
  - 您想在 Zen 和 Go 目录之间选择
---

# OpenCode

OpenCode 在 OpenClaw 中公开两个托管目录：

- `opencode/...` 用于 **Zen** 目录
- `opencode-go/...` 用于 **Go** 目录

两个目录使用相同的 OpenCode API 密钥。OpenClaw 保持运行时 Provider id 分离，以便上游的每个模型路由保持正确，但入门和文档将它们视为一个 OpenCode 设置。

## CLI 设置

### Zen 目录

```bash
openclaw onboard --auth-choice opencode-zen
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

### Go 目录

```bash
openclaw onboard --auth-choice opencode-go
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## 配置片段

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## 目录

### Zen

- 运行时 Provider：`opencode`
- 示例模型：`opencode/claude-opus-4-6`、`opencode/gpt-5.4`、`opencode/gemini-3-pro`
- 当您想要精选的 OpenCode 多模型代理时的最佳选择

### Go

- 运行时 Provider：`opencode-go`
- 示例模型：`opencode-go/kimi-k2.5`、`opencode-go/glm-5`、`opencode-go/minimax-m2.5`
- 当您想要 OpenCode 托管的 Kimi/GLM/MiniMax 阵容时的最佳选择

## 注意事项

- 也支持 `OPENCODE_ZEN_API_KEY`。
- 在设置期间输入一个 OpenCode 密钥会为两个运行时 Provider 存储凭据。
- 您登录 OpenCode，添加账单详情，并复制您的 API 密钥。
- 账单和目录可用性从 OpenCode 仪表板管理。
- Gemini 支持的 OpenCode 引用保持在代理 Gemini 路径上，因此 OpenClaw 在那里保持 Gemini 思维签名清理，而不启用原生 Gemini 回放验证或引导重写。
- 非 Gemini OpenCode 引用保持最小 OpenAI 兼容回放策略。
