---
title: "`openclaw doctor`"
sidebarTitle: "openclaw doctor"
mmh3_hash: "c66a03bee82c22be5a2448860bed6a79"
summary: "`openclaw doctor` 的 CLI 参考(健康检查 + 指导性修复)"
read_when:
  - 您有连接/认证问题并想要指导性修复
  - 您已更新并想要进行健全性检查
---

# `openclaw doctor`

Gateway 和 Channel 的健康检查 + 快速修复。

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
- 状态完整性检查现在可以检测 Session 目录中的孤立记录文件,并可以将其归档为 `.deleted.<timestamp>` 以安全回收空间。
- Doctor 现在扫描 `~/.openclaw/cron/jobs.json`(或 `cron.store`)中的旧版 cron 作业形状,并可以在调度器在运行时自动规范化之前原地重写它们。
- Doctor 包括内存搜索就绪检查,当缺少嵌入凭据时可以推荐 `openclaw configure --section model`。
- 如果启用了沙箱模式但 Docker 不可用,doctor 会报告一个高优先级警告并提供修复方法(`安装 Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`)。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理且在当前命令路径中不可用,doctor 报告只读警告而不写入明文回退凭据。

## macOS:`launchctl` 环境覆盖

如果您之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`(或 `...PASSWORD`),该值会覆盖您的配置文件并可能导致持久的"未授权"错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
