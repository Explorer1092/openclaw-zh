---
mmh3_hash: "1b6ff3adb53f3c7c1bf4316b7644b4fd"
summary: "`openclaw doctor` 的 CLI 参考(健康检查 + 指导性修复)"
read_when:
  - 您有连接/认证问题并想要指导性修复
  - 您已更新并想要进行健全性检查
---

# `openclaw doctor`

网关和频道的健康检查 + 快速修复。

相关:
- 故障排除:[故障排除](/gateway/troubleshooting)
- 安全审计:[安全](/gateway/security)

## 示例

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
```

注意:
- 交互式提示(如钥匙串/OAuth 修复)仅在 stdin 是 TTY 且**未**设置 `--non-interactive` 时运行。无头运行(cron、Telegram、无终端)将跳过提示。
- `--fix`(`--repair` 的别名)将备份写入 `~/.openclaw/openclaw.json.bak` 并删除未知的配置键,列出每个删除。

## macOS:`launchctl` 环境覆盖

如果您之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`(或 `...PASSWORD`),该值会覆盖您的配置文件并可能导致持久的"未授权"错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
