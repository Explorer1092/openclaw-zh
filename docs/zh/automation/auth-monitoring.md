---
title: "认证监控"
sidebarTitle: "认证监控"
mmh3_hash: "5a9f717a07c28b0a20dbdea35361c2f7"
summary: "监控模型提供商的 OAuth 过期情况"
read_when: ["设置认证过期监控或警报时","自动化 Claude Code / Codex OAuth 刷新检查时"]
---
# 认证监控

OpenClaw 通过 `openclaw models status` 暴露 OAuth 过期健康状态。使用它进行自动化和警报；脚本是针对手机工作流的可选额外功能。

## 首选：CLI 检查 (便携)

```bash
openclaw models status --check
```

退出代码：
- `0`: 正常
- `1`: 过期或缺少凭据
- `2`: 即将过期 (24小时内)

这适用于 cron/systemd，不需要额外的脚本。

## 可选脚本 (运维 / 手机工作流)

这些位于 `scripts/` 下，是 **可选的**。它们假设拥有对网关主机的 SSH 访问权限，并针对 systemd + Termux 进行了调整。

- `scripts/claude-auth-status.sh` 现在使用 `openclaw models status --json` 作为事实来源（如果 CLI 不可用，则回退到直接文件读取），因此请将 `openclaw` 保留在 `PATH` 中以供定时器使用。
- `scripts/auth-monitor.sh`: cron/systemd 定时器目标；发送警报 (ntfy 或手机)。
- `scripts/systemd/openclaw-auth-monitor.{service,timer}`: systemd 用户定时器。
- `scripts/claude-auth-status.sh`: Claude Code + OpenClaw 认证检查器 (full/json/simple)。
- `scripts/mobile-reauth.sh`: 通过 SSH 的引导式重新认证流程。
- `scripts/termux-quick-auth.sh`: 一键小部件状态 + 打开认证 URL。
- `scripts/termux-auth-widget.sh`: 完整的引导式小部件流程。
- `scripts/termux-sync-widget.sh`: 同步 Claude Code 凭据 → OpenClaw。

如果你不需要手机自动化或 systemd 定时器，请跳过这些脚本。
