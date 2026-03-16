---
mmh3_hash: "c5c7de721cf417022e14d16b88004020"
title: "OpenCode Go"
sidebarTitle: "OpenCode Go"
summary: "将 OpenCode Go 目录与共享 OpenCode 设置一起使用"
read_when:
  - 您想使用 OpenCode Go 目录
  - 您需要 Go 托管模型的运行时模型引用
---

# OpenCode Go

OpenCode Go 是 [OpenCode](/providers/opencode) 中的 Go 目录。
它使用与 Zen 目录相同的 `OPENCODE_API_KEY`，但保留运行时
提供商 ID `opencode-go`，以使上游的每模型路由保持正确。

## 支持的模型

- `opencode-go/kimi-k2.5`
- `opencode-go/glm-5`
- `opencode-go/minimax-m2.5`

## CLI 设置

```bash
openclaw onboard --auth-choice opencode-go
# 或非交互式
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## 配置片段

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## 路由行为

当模型引用使用 `opencode-go/...` 时，OpenClaw 自动处理每模型路由。

## 注意事项

- 有关共享引导和目录概述，请使用 [OpenCode](/providers/opencode)。
- 运行时引用保持显式：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`。
