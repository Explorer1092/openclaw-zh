---
title: "模型 CLI"
sidebarTitle: "模型 CLI"
mmh3_hash: "e42a0d34d3a6389d5a4ee40a557d1c2f"
summary: "Models CLI: list、set、aliases、fallbacks、scan、status"
read_when:
  - 添加或修改 models CLI (models list/set/scan/aliases/fallbacks)
  - 更改 model fallback 行为或选择 UX
  - 更新 model scan probes (tools/images)
---

# 模型 CLI

参见 [/concepts/model-failover](/concepts/model-failover) 了解 auth profile 轮换、cooldowns 以及它与 fallbacks 的交互方式。快速 provider 概述 + 示例：[/concepts/model-providers](/concepts/model-providers)。

## Model 选择如何工作

OpenClaw 按以下顺序选择 models：

1. **Primary** model（`agents.defaults.model.primary` 或 `agents.defaults.model`）。
2. `agents.defaults.model.fallbacks` 中的 **Fallbacks**（按顺序）。
3. **Provider auth failover** 在移动到下一个 model 之前发生在 provider 内部。

相关：

- `agents.defaults.models` 是 OpenClaw 可以使用的 models 的允许列表/catalog（加上别名）。
- `agents.defaults.imageModel` 仅在**主 model 无法接受图像时**使用。
- `agents.defaults.pdfModel` 由 `pdf` 工具使用。如果省略，该工具回退到 `agents.defaults.imageModel`，然后是已解析的 session/默认 model。
- `agents.defaults.imageGenerationModel` 由共享的图像生成能力使用。如果省略，`image_generate` 仍然可以推断出 auth 支持的 provider 默认值。它首先尝试当前默认 provider，然后按 provider-id 顺序尝试剩余的已注册图像生成 providers。如果你设置了特定的 provider/model，还需配置该 provider 的 auth/API key。
- `agents.defaults.musicGenerationModel` 由共享的音乐生成能力使用。如果省略，`music_generate` 仍然可以推断出 auth 支持的 provider 默认值。它首先尝试当前默认 provider，然后按 provider-id 顺序尝试剩余的已注册音乐生成 providers。如果你设置了特定的 provider/model，还需配置该 provider 的 auth/API key。
- `agents.defaults.videoGenerationModel` 由共享的视频生成能力使用。如果省略，`video_generate` 仍然可以推断出 auth 支持的 provider 默认值。它首先尝试当前默认 provider，然后按 provider-id 顺序尝试剩余的已注册视频生成 providers。如果你设置了特定的 provider/model，还需配置该 provider 的 auth/API key。
- 每个 agent 的默认值可以通过 `agents.list[].model` 加绑定覆盖 `agents.defaults.model`（参见 [/concepts/multi-agent](/concepts/multi-agent)）。

## 快速 model 策略

- 将你的 primary 设置为你可用的最强最新一代 model。
- 使用 fallbacks 进行成本/延迟敏感的任务和较低风险的聊天。
- 对于启用 tool 的 agents 或不受信任的输入，避免使用旧的/较弱的 model 层。

## 设置向导（推荐）

如果你不想手动编辑配置，运行设置向导：

```bash
openclaw onboard
```

它可以为常见 providers 设置 model + auth，包括 **OpenAI Code (Codex) 订阅**（OAuth）和 **Anthropic**（API key 或 Claude CLI）。

## 配置 keys（概述）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 和 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 和 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 和 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（允许列表 + 别名 + provider 参数）
- `models.providers`（写入 `models.json` 的自定义 providers）

Model refs 规范化为小写。像 `z.ai/*` 这样的 provider 别名规范化为 `zai/*`。

Provider 配置示例（包括 OpenCode）位于 [/providers/opencode](/providers/opencode)。

## "Model 不被允许"（以及为什么回复停止）

如果设置了 `agents.defaults.models`，它将成为 `/model` 和 session 覆盖的**允许列表**。当用户选择不在该允许列表中的 model 时，OpenClaw 返回：

```
Model "provider/model" is not allowed. Use /model to list available models.
```

这发生在**正常回复生成之前**，因此该消息可能感觉像"没有响应"。修复方法是：

- 将 model 添加到 `agents.defaults.models`，或
- 清除允许列表（删除 `agents.defaults.models`），或
- 从 `/model list` 选择 model。

示例允许列表配置：

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## 在聊天中切换 models（`/model`）

你可以在不重新启动的情况下切换当前 session 的 models：

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

注意：

- `/model`（和 `/model list`）是紧凑的编号选择器（model 系列 + 可用 providers）。
- 在 Discord 上，`/model` 和 `/models` 打开带有 provider 和 model 下拉列表以及提交步骤的交互式选择器。
- `/model <#>` 从该选择器中选择。
- `/model` 立即持久化新的 session 选择。
- 如果 agent 空闲，下一次运行立即使用新 model。
- 如果运行已处于活跃状态，OpenClaw 将实时切换标记为待处理，并仅在干净的重试点重新启动到新 model。
- 如果 tool 活动或回复输出已开始，待处理切换可以保持排队直到后续重试机会或下一个用户回合。
- `/model status` 是详细视图（auth 候选者，以及在配置时，provider 端点 `baseUrl` + `api` 模式）。
- Model refs 通过在**第一个** `/` 上分割来解析。在输入 `/model <ref>` 时使用 `provider/model`。
- 如果 model ID 本身包含 `/`（OpenRouter 样式），你必须包含 provider 前缀（示例：`/model openrouter/moonshotai/kimi-k2`）。
- 如果省略 provider，OpenClaw 按以下顺序解析输入：
  1. 别名匹配
  2. 该精确未前缀 model id 的唯一已配置 provider 匹配
  3. 已弃用的回退到已配置的默认 provider
     如果该 provider 不再公开已配置的默认 model，OpenClaw 改为回退到第一个已配置的 provider/model 以避免显示过时的已删除 provider 默认值。

完整命令行为/配置：[Slash commands](/tools/slash-commands)。

## CLI 命令

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models`（无子命令）是 `models status` 的快捷方式。

### `models list`

默认显示已配置的 models。有用的 flags：

- `--all`：完整 catalog
- `--local`：仅本地 providers
- `--provider <name>`：按 provider 过滤
- `--plain`：每行一个 model
- `--json`：机器可读输出

### `models status`

显示已解析的 primary model、fallbacks、image model 以及已配置 providers 的 auth 概述。它还显示在 auth store 中找到的 profiles 的 OAuth 过期状态（默认在 24 小时内警告）。`--plain` 仅打印已解析的 primary model。
OAuth 状态始终显示（并包含在 `--json` 输出中）。如果已配置的 provider 没有凭据，`models status` 打印 **Missing auth** 部分。
JSON 包含 `auth.oauth`（警告窗口 + profiles）和 `auth.providers`（每个 provider 的有效 auth，包括 env 支持的凭据）。`auth.oauth` 仅限 auth-store profile 健康状态；仅环境变量的 providers 不会出现在那里。
使用 `--check` 进行自动化（当缺失/过期时退出 `1`，当即将过期时退出 `2`）。
使用 `--probe` 进行实时 auth 检查；probe 行可以来自 auth profiles、env 凭据或 `models.json`。
如果显式 `auth.order.<provider>` 省略了存储的 profile，probe 报告 `excluded_by_auth_order` 而不是尝试它。如果存在 auth 但无法为该 provider 解析可探测的 model，probe 报告 `status: no_model`。

Auth 选择取决于 provider/账户。对于始终在线的 gateway 主机，API keys 通常是最可预测的；Claude CLI 重用和现有 Anthropic OAuth/token profiles 也受支持。

示例（Claude CLI）：

```bash
claude auth login
openclaw models status
```

## 扫描（OpenRouter 免费 models）

`openclaw models scan` 检查 OpenRouter 的**免费 model catalog**，并可以选择性地探测 models 以获得 tool 和 image 支持。

关键 flags：

- `--no-probe`：跳过实时探测（仅元数据）
- `--min-params <b>`：最小参数大小（十亿）
- `--max-age-days <days>`：跳过较旧的 models
- `--provider <name>`：provider 前缀过滤器
- `--max-candidates <n>`：fallback 列表大小
- `--set-default`：将 `agents.defaults.model.primary` 设置为第一个选择
- `--set-image`：将 `agents.defaults.imageModel.primary` 设置为第一个图像选择

探测需要 OpenRouter API key（来自 auth profiles 或 `OPENROUTER_API_KEY`）。没有 key 时，使用 `--no-probe` 仅列出候选者。

扫描结果按以下排名：

1. 图像支持
2. Tool 延迟
3. Context 大小
4. 参数数量

输入

- OpenRouter `/models` 列表（过滤 `:free`）
- 需要来自 auth profiles 或 `OPENROUTER_API_KEY` 的 OpenRouter API key（参见 [/environment](/help/environment)）
- 可选过滤器：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 探测控制：`--timeout`、`--concurrency`

在 TTY 中运行时，你可以交互式地选择 fallbacks。在非交互模式下，传递 `--yes` 接受默认值。

## Models 注册表（`models.json`）

`models.providers` 中的自定义 providers 写入 agent 目录下的 `models.json`（默认 `~/.openclaw/agents/<agentId>/agent/models.json`）。除非将 `models.mode` 设置为 `replace`，否则默认合并此文件。

匹配 provider IDs 的合并模式优先级：

- agent `models.json` 中已存在的非空 `baseUrl` 优先。
- agent `models.json` 中的非空 `apiKey` 仅在该 provider 不受当前 config/auth-profile context 的 SecretRef 管理时优先。
- SecretRef 管理的 provider `apiKey` 值从源标记刷新（`ENV_VAR_NAME` 用于 env refs，`secretref-managed` 用于 file/exec refs），而不是持久化已解析的 secrets。
- SecretRef 管理的 provider header 值从源标记刷新（`secretref-env:ENV_VAR_NAME` 用于 env refs，`secretref-managed` 用于 file/exec refs）。
- 空或缺失的 agent `apiKey`/`baseUrl` 回退到 config `models.providers`。
- 其他 provider 字段从 config 和规范化 catalog 数据中刷新。

标记持久性是源权威的：OpenClaw 从活跃源 config 快照（解析前）写入标记，而不是从已解析的运行时 secret 值。
这适用于 OpenClaw 重新生成 `models.json` 的任何时候，包括像 `openclaw agent` 这样的命令驱动路径。

## 延伸阅读

- [Model Providers](/concepts/model-providers) — provider 路由和 auth
- [Model Failover](/concepts/model-failover) — fallback 链
- [Image Generation](/tools/image-generation) — 图像 model 配置
- [Music Generation](/tools/music-generation) — 音乐 model 配置
- [Video Generation](/tools/video-generation) — 视频 model 配置
- [Configuration Reference](/gateway/configuration-reference#agent-defaults) — model 配置 keys
