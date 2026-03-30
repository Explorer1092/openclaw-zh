---
mmh3_hash: "a7a4fb1a193013ab4e43ef79b30f700f"
read_when:
  - 你想在 OpenClaw 中使用 MiniMax 模型
  - 你需要 MiniMax 设置指南
summary: 在 OpenClaw 中使用 MiniMax 模型
title: MiniMax
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: providers/minimax.md
  workflow: 15
---

# MiniMax

OpenClaw 的 MiniMax 提供商默认使用 **MiniMax M2.7**。

## 模型概览

- `MiniMax-M2.7`：默认托管文本模型。
- `MiniMax-M2.7-highspeed`：更快的 M2.7 文本层级。
- `image-01`：图像生成模型（文生图和图生图编辑）。

## 图像生成

MiniMax 插件为 `image_generate` 工具注册了 `image-01` 模型，支持：

- **文本生成图像**（含宽高比控制）。
- **图生图编辑**（主体参考）（含宽高比控制）。
- 支持的宽高比：`1:1`、`16:9`、`4:3`、`3:2`、`2:3`、`3:4`、`9:16`、`21:9`。

要将 MiniMax 用于图像生成，将其设置为图像生成提供商：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

该插件与文本模型使用相同的 `MINIMAX_API_KEY` 或 OAuth 认证。如果 MiniMax 已经配置，无需额外配置。

## 选择一种设置方式

### MiniMax OAuth（Coding Plan）—— 推荐

**最适合：** 通过 OAuth 使用 MiniMax Coding Plan 快速设置，无需 API key。

启用内置 OAuth 插件并完成认证：

```bash
openclaw plugins enable minimax  # 如果已加载则跳过。
openclaw gateway restart  # 如果 Gateway 已在运行，则重启
openclaw onboard --auth-choice minimax-portal
```

系统会提示你选择一个端点：

- **Global** - 国际用户（`api.minimax.io`）
- **CN** - 中国用户（`api.minimaxi.com`）

详情请参阅 OpenClaw 仓库中的 MiniMax 插件包 README。

### MiniMax M2.7（API key）

**最适合：** 使用与 Anthropic 兼容 API 的托管 MiniMax。

通过 CLI 配置：

- 运行 `openclaw configure`
- 选择 **Model/auth**
- 选择 **MiniMax** 认证选项

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
          {
            id: "MiniMax-M2.7-highspeed",
            name: "MiniMax M2.7 Highspeed",
            reasoning: true,
            input: ["text"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### 将 MiniMax M2.7 作为回退模型（示例）

**最适合：** 保持你最强的最新一代模型作为主模型，并在失败时回退到 MiniMax M2.7。
下面的示例使用 Opus 作为具体主模型；你可以替换成自己偏好的最新一代主模型。

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "primary" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
    },
  },
}
```

## 通过 `openclaw configure` 配置

使用交互式配置向导设置 MiniMax，而无需编辑 JSON：

1. 运行 `openclaw configure`。
2. 选择 **Model/auth**。
3. 选择 **MiniMax** 认证选项。
4. 在提示时选择你的默认模型。

## 配置选项

- `models.providers.minimax.baseUrl`：优先使用 `https://api.minimax.io/anthropic`（与 Anthropic 兼容）；`https://api.minimax.io/v1` 可选，用于与 OpenAI 兼容的负载。
- `models.providers.minimax.api`：优先使用 `anthropic-messages`；`openai-completions` 可选，用于与 OpenAI 兼容的负载。
- `models.providers.minimax.apiKey`：MiniMax API key（`MINIMAX_API_KEY`）。
- `models.providers.minimax.models`：定义 `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost`。
- `agents.defaults.models`：为你希望放入允许列表的模型设置别名。
- `models.mode`：如果你希望在内置模型之外添加 MiniMax，请保持为 `merge`。

## 说明

- 模型引用格式为 `minimax/<model>`。
- 默认文本模型：`MiniMax-M2.7`。
- 备选文本模型：`MiniMax-M2.7-highspeed`。
- Coding Plan 用量 API：`https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains`（需要 coding plan key）。
- 如果你需要精确成本跟踪，请更新 `models.json` 中的定价值。
- MiniMax Coding Plan 推荐链接（九折）：[https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- 关于提供商规则，请参阅 [/concepts/model-providers](/concepts/model-providers)。
- 使用 `openclaw models list` 和 `openclaw models set minimax/MiniMax-M2.7` 进行切换。

## 故障排除

### "Unknown model: minimax/MiniMax-M2.7"

这通常意味着 **MiniMax 提供商未配置**（没有提供商条目，
并且也未找到 MiniMax 凭证配置文件/环境变量 key）。对此检测问题的修复已包含在
**2026.1.12** 中。修复方法：

- 升级到 **2026.1.12**（或从源码运行 `main`），然后重启 Gateway。
- 运行 `openclaw configure` 并选择 **MiniMax** 认证选项，或
- 手动添加 `models.providers.minimax` 配置块，或
- 设置 `MINIMAX_API_KEY`（或 MiniMax 凭证配置文件），以便注入该提供商。

请确保模型 id **区分大小写**：

- `minimax/MiniMax-M2.7`
- `minimax/MiniMax-M2.7-highspeed`

然后使用以下命令重新检查：

```bash
openclaw models list
```
