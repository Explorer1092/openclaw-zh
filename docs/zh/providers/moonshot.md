---
mmh3_hash: "7aa94ce6915da49e7c9a9db0473ae76e"
title: "Moonshot AI (Kimi)"
sidebarTitle: "Moonshot AI"
summary: "配置 Moonshot K2 vs Kimi Coding（单独的 Provider + 密钥）"
read_when:
  - 您想设置 Moonshot K2 (Moonshot Open Platform) vs Kimi Coding
  - 您需要了解单独的端点、密钥和模型引用
  - 您想要复制/粘贴任一 Provider 的配置
---

# Moonshot AI (Kimi)

Moonshot 提供 Kimi API，具有 OpenAI 兼容的端点。配置 Provider 并将默认模型设置为 `moonshot/kimi-k2.5`，或使用 Kimi Coding 的 `kimi/kimi-code`。

当前 Kimi K2 模型 ID：

- `kimi-k2.5`
- `kimi-k2-thinking`
- `kimi-k2-thinking-turbo`
- `kimi-k2-turbo`

```bash
openclaw onboard --auth-choice moonshot-api-key
# 或
openclaw onboard --auth-choice moonshot-api-key-cn
```

Kimi Coding：

```bash
openclaw onboard --auth-choice kimi-code-api-key
```

注意：Moonshot 和 Kimi Coding 是独立的 Provider。密钥不可互换，端点不同，模型引用也不同（Moonshot 使用 `moonshot/...`，Kimi Coding 使用 `kimi/...`）。

Kimi Web 搜索也使用 Moonshot 插件：

```bash
openclaw configure --section web
```

在 Web 搜索部分选择 **Kimi** 以存储 `plugins.entries.moonshot.config.webSearch.*`。

## 配置片段（Moonshot API）

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: {
        "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
        "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
        "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
        "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
          {
            id: "kimi-k2-thinking",
            name: "Kimi K2 Thinking",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
          {
            id: "kimi-k2-thinking-turbo",
            name: "Kimi K2 Thinking Turbo",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
          {
            id: "kimi-k2-turbo",
            name: "Kimi K2 Turbo",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 16384,
          },
        ],
      },
    },
  },
}
```

## Kimi Coding

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: {
        "kimi/kimi-code": { alias: "Kimi" },
      },
    },
  },
}
```

## Kimi Web 搜索

OpenClaw 也将 **Kimi** 作为 `web_search` Provider，由 Moonshot Web 搜索支持。

交互式设置可以提示：

- Moonshot API 区域：
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- 默认 Kimi Web 搜索模型（默认为 `kimi-k2.5`）

配置位于 `plugins.entries.moonshot.config.webSearch` 下：

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // 或使用 KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.5",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## 注意事项

- Moonshot 模型引用使用 `moonshot/<modelId>`。Kimi Coding 模型引用使用 `kimi/<modelId>`。
- 当前 Kimi Coding 默认模型引用为 `kimi/kimi-code`。旧版 `kimi/k2p5` 作为兼容性模型 id 仍被接受。
- Kimi Web 搜索使用 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，默认为 `https://api.moonshot.ai/v1`，模型为 `kimi-k2.5`。
- 原生 Moonshot 端点（`https://api.moonshot.ai/v1` 和 `https://api.moonshot.cn/v1`）在共享的 `openai-completions` 传输上声明流式传输使用兼容性。
- 如果需要，在 `models.providers` 中覆盖价格和上下文元数据。
- 使用 `https://api.moonshot.ai/v1` 作为国际端点，使用 `https://api.moonshot.cn/v1` 作为中国端点。
- 入门选项：
  - `moonshot-api-key` 用于 `https://api.moonshot.ai/v1`
  - `moonshot-api-key-cn` 用于 `https://api.moonshot.cn/v1`

## 原生思考模式（Moonshot）

Moonshot Kimi 支持二元原生思考：

- `thinking: { type: "enabled" }`
- `thinking: { type: "disabled" }`

通过 `agents.defaults.models.<provider/model>.params` 按模型配置：

```json5
{
  agents: {
    defaults: {
      models: {
        "moonshot/kimi-k2.5": {
          params: {
            thinking: { type: "disabled" },
          },
        },
      },
    },
  },
}
```

OpenClaw 也为 Moonshot 映射运行时 `/think` 级别：

- `/think off` -> `thinking.type=disabled`
- 任何非 off 思考级别 -> `thinking.type=enabled`

当 Moonshot 思考启用时，`tool_choice` 必须为 `auto` 或 `none`。OpenClaw 会将不兼容的 `tool_choice` 值归一化为 `auto` 以确保兼容性。
