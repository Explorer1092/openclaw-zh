---
title: "OpenCode Zen"
sidebarTitle: "OpenCode Zen"
mmh3_hash: "a88c1673d063be7b8cbbeb6ea2f55e60"
summary: "将 OpenCode Zen (精选模型) 与 OpenClaw 一起使用"
read_when: ["您想使用 OpenCode Zen 进行模型访问","您想要一个编码友好模型的精选列表"]
---
# OpenCode Zen

OpenCode Zen 是 OpenCode 团队推荐的用于编码代理的**精选模型列表**。
它是一个可选的托管模型访问路径,使用 API 密钥和 `opencode` 提供商。
Zen 目前处于 beta 阶段。

## CLI 设置

```bash
openclaw onboard --auth-choice opencode-zen
# 或非交互式
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

## 配置片段

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## 注意事项

- 也支持 `OPENCODE_ZEN_API_KEY`。
- 您登录到 Zen,添加账单详细信息,然后复制您的 API 密钥。
- OpenCode Zen 按请求计费;有关详细信息,请查看 OpenCode 仪表板。
