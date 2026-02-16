---
title: "模型 CLI"
sidebarTitle: "模型 CLI"
mmh3_hash: "296e3a814c854476ab5155aa2371a5c8"
summary: "Models CLI: list、set、aliases、fallbacks、scan、status"
read_when: ["添加或修改 models CLI (models list/set/scan/aliases/fallbacks)","更改 model fallback 行为或选择 UX","更新 model scan probes (tools/images)"]
---
# 模型 CLI

参见 [/concepts/model-failover](/zh/concepts/model-failover) 了解 auth profile 轮换、cooldowns 以及它与 fallbacks 的交互方式。快速 provider 概述 + 示例:[/concepts/model-providers](/zh/concepts/model-providers)。

## Model 选择如何工作

OpenClaw 按以下顺序选择 models:

1) **Primary** model (`agents.defaults.model.primary` 或 `agents.defaults.model`)。
2) `agents.defaults.model.fallbacks` 中的 **Fallbacks**(按顺序)。
3) **Provider auth failover** 在移动到下一个 model 之前在 provider 内部发生。

相关:
- `agents.defaults.models` 是 OpenClaw 可以使用的 models 的允许列表/catalog(加上 aliases)。
- `agents.defaults.imageModel` **仅在** primary model 无法接受图像时使用。
- 每个 agent 的默认值可以通过 `agents.list[].model` 加上 bindings 覆盖 `agents.defaults.model`(参见 [/concepts/multi-agent](/zh/concepts/multi-agent))。

## 快速 model 选择(轶事)

- **GLM**: 在编码/tool 调用方面稍好一些。
- **MiniMax**: 在写作和氛围方面更好。

## 设置向导(推荐)

如果你不想手动编辑配置,请运行 onboarding 向导:

```bash
openclaw onboard
```

它可以为常见 providers 设置 model + auth,包括 **OpenAI Code (Codex) subscription** (OAuth) 和 **Anthropic** (推荐 API key;也支持 `claude setup-token`)。

## 配置键(概述)

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.models` (允许列表 + aliases + provider 参数)
- `models.providers` (写入 `models.json` 的自定义 providers)

Model refs 规范化为小写。Provider 别名如 `z.ai/*` 规范化为 `zai/*`。

Provider 配置示例(包括 OpenCode Zen)位于 [/gateway/configuration](/zh/gateway/configuration#opencode-zen-multi-model-proxy)。

## "Model is not allowed"(以及为什么回复停止)

如果设置了 `agents.defaults.models`,它将成为 `/model` 和 session 覆盖的 **允许列表**。当用户选择不在该允许列表中的 model 时,OpenClaw 返回:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

这发生在生成正常回复 **之前**,因此消息可能会感觉像"没有响应"。修复方法是:

- 将 model 添加到 `agents.defaults.models`,或
- 清除允许列表(删除 `agents.defaults.models`),或
- 从 `/model list` 中选择一个 model。

示例允许列表配置:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-5" },
    models: {
      "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
      "anthropic/claude-opus-4-5": { alias: "Opus" }
    }
  }
}
```

## 在聊天中切换 models (`/model`)

你可以在不重启的情况下为当前 session 切换 models:

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model status
```

注意:
- `/model`(和 `/model list`)是紧凑的编号选择器(model family + 可用 providers)。
- `/model <#>` 从该选择器中选择。
- `/model status` 是详细视图(auth 候选和配置时的 provider 端点 `baseUrl` + `api` 模式)。
- Model refs 通过在 **第一个** `/` 上拆分来解析。输入 `/model <ref>` 时使用 `provider/model`。
- 如果 model ID 本身包含 `/`(OpenRouter 样式),你必须包含 provider 前缀(例如:`/model openrouter/moonshotai/kimi-k2`)。
- 如果省略 provider,OpenClaw 将输入视为别名或 **默认 provider** 的 model(仅当 model ID 中没有 `/` 时才有效)。

完整命令行为/配置:[Slash commands](/zh/tools/slash-commands)。

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

`openclaw models`(无子命令)是 `models status` 的快捷方式。

### `models list`

默认显示配置的 models。有用的 flags:

- `--all`: 完整 catalog
- `--local`: 仅本地 providers
- `--provider <name>`: 按 provider 过滤
- `--plain`: 每行一个 model
- `--json`: 机器可读输出

### `models status`

显示解析的 primary model、fallbacks、image model 以及配置的 providers 的 auth 概述。它还显示在 auth store 中找到的 profiles 的 OAuth 过期状态(默认在 24 小时内警告)。`--plain` 仅打印解析的 primary model。始终显示 OAuth 状态(并包含在 `--json` 输出中)。如果配置的 provider 没有凭据,`models status` 打印 **Missing auth** 部分。JSON 包括 `auth.oauth`(警告窗口 + profiles)和 `auth.providers`(每个 provider 的有效 auth)。使用 `--check` 进行自动化(缺失/过期时退出 `1`,即将过期时退出 `2`)。

首选的 Anthropic auth 是 Claude Code CLI setup-token(在任何地方运行;如果需要,在 gateway 主机上粘贴):

```bash
claude setup-token
openclaw models status
```

## 扫描(OpenRouter 免费 models)

`openclaw models scan` 检查 OpenRouter 的 **免费 model catalog**,并可以选择性地探测 models 的 tool 和 image 支持。

关键 flags:

- `--no-probe`: 跳过实时探测(仅元数据)
- `--min-params <b>`: 最小参数大小(十亿)
- `--max-age-days <days>`: 跳过较旧的 models
- `--provider <name>`: provider 前缀过滤器
- `--max-candidates <n>`: fallback 列表大小
- `--set-default`: 将 `agents.defaults.model.primary` 设置为第一个选择
- `--set-image`: 将 `agents.defaults.imageModel.primary` 设置为第一个 image 选择

探测需要 OpenRouter API key(来自 auth profiles 或 `OPENROUTER_API_KEY`)。没有 key,使用 `--no-probe` 仅列出候选。

扫描结果按以下排名:
1) Image 支持
2) Tool 延迟
3) Context 大小
4) 参数计数

输入:
- OpenRouter `/models` 列表(过滤 `:free`)
- 需要来自 auth profiles 或 `OPENROUTER_API_KEY` 的 OpenRouter API key(参见 [/environment](/zh/environment))
- 可选过滤器:`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 探测控制:`--timeout`、`--concurrency`

在 TTY 中运行时,你可以交互式地选择 fallbacks。在非交互式模式下,传递 `--yes` 以接受默认值。

## Models registry (`models.json`)

`models.providers` 中的自定义 providers 写入 agent 目录下的 `models.json`(默认 `~/.openclaw/agents/<agentId>/models.json`)。除非 `models.mode` 设置为 `replace`,否则此文件默认合并。
