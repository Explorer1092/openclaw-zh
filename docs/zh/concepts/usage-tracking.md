---
title: "Usage tracking"
sidebarTitle: "Usage tracking"
mmh3_hash: "a7afde1bce074ce9ea9ede25a1f3ed09"
summary: "Usage tracking 界面和凭据要求"
read_when:
  - 正在接入 provider usage/quota 界面
  - 需要解释 usage tracking 行为或认证要求
---

## 是什么

- 直接从 provider 的 usage 端点拉取 provider usage/quota。
- 不估算费用；仅显示 provider 报告的窗口。
- 人类可读的状态输出被规范化为 `X% left`，即使上游 API 报告的是已消耗配额、剩余配额或仅原始计数。
- Session 级别的 `/status` 和 `session_status` 在实时 session 快照稀疏时可以回退到最新的转录 usage 条目。该回退填充缺失的 token/缓存计数器，可以恢复活跃的运行时 model 标签，并在 session 元数据缺失或较小时优先使用较大的 prompt 导向总计。现有的非零实时值仍获优先。

## 显示位置

- 聊天中的 `/status`：带有 session tokens + 估算费用（仅 API key）的富表情状态卡。在 provider usage 可用时，为**当前 model provider** 显示规范化的 `X% left` 窗口。
- 聊天中的 `/usage off|tokens|full`：每次响应的 usage 摘要（OAuth 仅显示 tokens）。
- 聊天中的 `/usage cost`：从 OpenClaw session 日志聚合的本地费用摘要。
- CLI：`openclaw status --usage` 打印完整的 per-provider 细分。
- CLI：`openclaw channels list` 在 provider 配置旁打印相同的 usage 快照（使用 `--no-usage` 跳过）。
- macOS 菜单栏：Context 下的"Usage"部分（仅在可用时显示）。

## Providers + 凭据

- **Anthropic (Claude)**：auth profiles 中的 OAuth tokens。
- **GitHub Copilot**：auth profiles 中的 OAuth tokens。
- **Gemini CLI**：auth profiles 中的 OAuth tokens。
  - JSON usage 回退到 `stats`；`stats.cached` 被规范化为 `cacheRead`。
- **OpenAI Codex**：auth profiles 中的 OAuth tokens（存在时使用 accountId）。
- **MiniMax**：API key 或 MiniMax OAuth auth profile。OpenClaw 将 `minimax`、`minimax-cn` 和 `minimax-portal` 视为同一 MiniMax quota 界面，在存在时优先使用存储的 MiniMax OAuth，否则回退到 `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。Usage 轮询从 `models.providers.minimax-portal.baseUrl` 或 `models.providers.minimax.baseUrl`（已配置时）派生 Coding Plan 主机，否则使用 MiniMax CN 主机。MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示**剩余**配额，因此 OpenClaw 在显示前将其反转；存在时基于计数的字段优先。
  - Coding-plan 窗口标签在存在时来自 provider hours/minutes 字段，然后回退到 `start_time` / `end_time` 范围。
  - 如果 coding-plan 端点返回 `model_remains`，OpenClaw 优先使用 chat-model 条目，在缺少明确的 `window_hours` / `window_minutes` 字段时从时间戳派生窗口标签，并在计划标签中包含 model 名称。
- **Xiaomi MiMo**：通过环境变量/配置/auth store 的 API key（`XIAOMI_API_KEY`）。
- **z.ai**：通过环境变量/配置/auth store 的 API key。

当无法解析可用的 provider usage 认证时，usage 被隐藏。Providers 可以提供 plugin 特定的 usage 认证逻辑；否则 OpenClaw 回退到从 auth profiles、环境变量或配置中匹配 OAuth/API-key 凭据。

## 相关

- [Token 使用和费用](/reference/token-use)
- [API 使用和费用](/reference/api-usage-costs)
- [Prompt caching](/reference/prompt-caching)
