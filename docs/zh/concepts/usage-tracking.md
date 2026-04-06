---
title: "用量跟踪"
sidebarTitle: "用量跟踪"
mmh3_hash: "f73cc59b0c87446b27e3e57fafa71520"
summary: "Usage tracking 表面和凭据要求"
read_when: ["你正在连接 provider usage/quota 表面","你需要解释 usage tracking 行为或 auth 要求"]
---

# 用量跟踪

## 它是什么

- 直接从 provider 的 usage 端点拉取 provider usage/quota。
- 没有估计成本；仅 provider 报告的窗口。
- 人类可读的状态输出规范化为 `X% left`，即使上游 API 报告的是已消耗配额、剩余配额或仅原始计数。
- Session 级别的 `/status` 和 `session_status` 在实时 session 快照稀疏时可以回退到最新的 transcript usage 条目。该回退填充缺失的 token/cache 计数器，可以恢复活跃的运行时 model 标签，并在 session 元数据缺失或更小时优先使用较大的面向 prompt 的总计。现有的非零实时值仍然优先。

## 它在哪里显示

- 聊天中的 `/status`：带有 session tokens + 估计成本（仅 API key）的 emoji 丰富状态卡。当可用时，**当前 model provider** 的 Provider usage 显示为规范化的 `X% left` 窗口。
- 聊天中的 `/usage off|tokens|full`：每个响应的 usage footer（OAuth 仅显示 tokens）。
- 聊天中的 `/usage cost`：从 OpenClaw session 日志聚合的本地成本摘要。
- CLI：`openclaw status --usage` 打印完整的每个 provider 细分。
- CLI：`openclaw channels list` 在 provider 配置旁边打印相同的 usage 快照（使用 `--no-usage` 跳过）。
- macOS 菜单栏："Context" 下的 "Usage" 部分（仅在可用时）。

## Providers + 凭据

- **Anthropic (Claude)**：auth profiles 中的 OAuth tokens。
- **GitHub Copilot**：auth profiles 中的 OAuth tokens。
- **Gemini CLI**：auth profiles 中的 OAuth tokens。
  - JSON usage 回退到 `stats`；`stats.cached` 规范化为 `cacheRead`。
- **OpenAI Codex**：auth profiles 中的 OAuth tokens（存在时使用 accountId）。
- **MiniMax**：API key 或 MiniMax OAuth auth profile。OpenClaw 将 `minimax`、`minimax-cn` 和 `minimax-portal` 视为同一 MiniMax 配额表面，优先使用存储的 MiniMax OAuth（如存在），否则回退到 `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示**剩余**配额，因此 OpenClaw 在显示前将其反转；存在基于计数的字段时优先使用。
  - Coding-plan 窗口标签在存在时来自 provider 的 hours/minutes 字段，然后回退到 `start_time` / `end_time` 时间跨度。
  - 如果 coding-plan 端点返回 `model_remains`，OpenClaw 优先使用 chat-model 条目，在显式 `window_hours` / `window_minutes` 字段缺失时从时间戳推导窗口标签，并在 plan 标签中包含 model 名称。
- **Xiaomi MiMo**：通过 env/config/auth store 的 API key（`XIAOMI_API_KEY`）。
- **z.ai**：通过 env/config/auth store 的 API key。

当无法解析可用的 provider usage auth 时，隐藏 Usage。Providers 可以提供插件特定的 usage auth 逻辑；否则 OpenClaw 回退到从 auth profiles、环境变量或配置中匹配 OAuth/API-key 凭据。
