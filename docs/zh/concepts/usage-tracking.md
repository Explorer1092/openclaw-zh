---
title: "用量跟踪"
sidebarTitle: "用量跟踪"
mmh3_hash: "43579207bcbcb63aa1f063f5dc510f57"
summary: "Usage tracking 表面和凭据要求"
read_when: ["你正在连接 provider usage/quota 表面","你需要解释 usage tracking 行为或 auth 要求"]
---
# 用量跟踪

## 它是什么
- 直接从 provider 的 usage 端点拉取 provider usage/quota。
- 没有估计成本;仅 provider 报告的窗口。

## 它在哪里显示
- 聊天中的 `/status`: 带有 session tokens + 估计成本(仅 API key)的 emoji 丰富状态卡。当可用时,**当前 model provider** 的 Provider usage 显示。
- 聊天中的 `/usage off|tokens|full`: 每个响应的 usage footer(OAuth 仅显示 tokens)。
- 聊天中的 `/usage cost`: 从 OpenClaw session 日志聚合的本地成本摘要。
- CLI: `openclaw status --usage` 打印完整的每个 provider 细分。
- CLI: `openclaw channels list` 在 provider 配置旁边打印相同的 usage 快照(使用 `--no-usage` 跳过)。
- macOS 菜单栏: Context 下的"Usage"部分(仅在可用时)。

## Providers + 凭据
- **Anthropic (Claude)**: auth profiles 中的 OAuth tokens。
- **GitHub Copilot**: auth profiles 中的 OAuth tokens。
- **Gemini CLI**: auth profiles 中的 OAuth tokens。
- **Antigravity**: auth profiles 中的 OAuth tokens。
- **OpenAI Codex**: auth profiles 中的 OAuth tokens(存在时使用 accountId)。
- **MiniMax**: API key (coding plan key; `MINIMAX_CODE_PLAN_KEY` 或 `MINIMAX_API_KEY`);使用 5‑小时 coding plan 窗口。
- **z.ai**: 通过 env/config/auth store 的 API key。

如果不存在匹配的 OAuth/API 凭据,则隐藏 Usage。
