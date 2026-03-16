---
title: "OpenCode"
sidebarTitle: "OpenCode"
mmh3_hash: "d4dd97813012b66d471f1ec99eb4f211"
summary: "将 OpenCode Zen 和 Go 目录与 OpenClaw 一起使用"
read_when:
  - 您想使用 OpenCode 托管的模型访问
  - 您想在 Zen 和 Go 目录之间选择
---

# OpenCode

OpenCode 在 OpenClaw 中提供两个托管目录：

- `opencode/...` 用于 **Zen** 目录
- `opencode-go/...` 用于 **Go** 目录

两个目录使用相同的 OpenCode API 密钥。OpenClaw 在运行时保持提供商 ID 分离，以使上游的每模型路由保持正确，但引导和文档将其视为一个 OpenCode 设置。

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

- 运行时提供商：`opencode`
- 示例模型：`opencode/claude-opus-4-6`、`opencode/gpt-5.2`、`opencode/gemini-3-pro`
- 适合需要精选 OpenCode 多模型代理的用户

### Go

- 运行时提供商：`opencode-go`
- 示例模型：`opencode-go/kimi-k2.5`、`opencode-go/glm-5`、`opencode-go/minimax-m2.5`
- 适合需要 OpenCode 托管的 Kimi/GLM/MiniMax 阵容的用户

## 注意事项

- 也支持 `OPENCODE_ZEN_API_KEY`。
- 在设置期间输入一个 OpenCode 密钥，即可为两个运行时提供商存储凭据。
- 您登录到 OpenCode，添加账单详细信息，然后复制您的 API 密钥。
- 账单和目录可用性从 OpenCode 仪表板管理。
