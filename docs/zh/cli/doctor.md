---
mmh3_hash: "dc977c3398df42ba3fc553b8ad88f2b7"
title: "`openclaw doctor`"
sidebarTitle: "openclaw doctor"
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
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## 选项

- `--no-workspace-suggestions`:禁用工作区内存/搜索建议
- `--yes`:不提示接受默认值
- `--repair`:不提示应用推荐修复
- `--fix`:`--repair` 的别名
- `--force`:应用激进修复,包括在需要时覆盖自定义服务配置
- `--non-interactive`:无提示运行;仅安全迁移
- `--generate-gateway-token`:生成并配置 Gateway 令牌
- `--deep`:扫描系统服务查找额外的 Gateway 安装

说明:

- 交互式提示(如钥匙串/OAuth 修复)仅在 stdin 是 TTY 且**未**设置 `--non-interactive` 时运行。无头运行(cron、Telegram、无终端)将跳过提示。
- 性能：非交互式 `doctor` 运行会跳过提前加载插件，使无头健康检查保持快速。交互式 Session 仍会在检查需要插件贡献时完整加载插件。
- `--fix`(`--repair` 的别名)将备份写入 `~/.openclaw/openclaw.json.bak` 并删除未知的配置键,列出每个删除。
- 状态完整性检查现在可以检测 Session 目录中的孤立记录文件,并可以将其归档为 `.deleted.<timestamp>` 以安全回收空间。
- Doctor 扫描 `~/.openclaw/cron/jobs.json`(或 `cron.store`)中的旧版 cron 作业形状,并可以在调度器在运行时自动规范化之前原地重写它们。
- Doctor 在不写入打包的全局安装的情况下修复缺失的捆绑插件运行时依赖。对于 root 拥有的 npm 安装或强化的 systemd 单元，请将 `OPENCLAW_PLUGIN_STAGE_DIR` 设置为可写目录，如 `/var/lib/openclaw/plugin-runtime-deps`；也可以是路径列表，如 `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`，其中较早的根是只读查找层，最后的根是修复目标。
- 当另一个 supervisor 拥有 Gateway 生命周期时，设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍会报告 Gateway/服务健康状况并应用非服务修复，但会跳过服务安装/启动/重启/引导和旧版服务清理。
- Doctor 自动迁移旧版平面 Talk 配置(`talk.voiceId`、`talk.modelId` 等)到 `talk.provider` + `talk.providers.<provider>`。
- 当唯一差异是对象键顺序时,重复的 `doctor --fix` 运行不再报告/应用 Talk 规范化。
- Doctor 包括内存搜索就绪检查,当缺少嵌入凭据时可以推荐 `openclaw configure --section model`。
- 如果启用了沙箱模式但 Docker 不可用,doctor 会报告一个高优先级警告并提供修复方法(`安装 Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`)。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理且在当前命令路径中不可用,doctor 报告只读警告而不写入明文回退凭据。
- 如果 Channel SecretRef 检查在修复路径中失败,doctor 继续并报告警告而不是提前退出。
- Telegram `allowFrom` 用户名自动解析(`doctor --fix`)需要当前命令路径中可解析的 Telegram 令牌。如果令牌检查不可用,doctor 报告警告并跳过该次传递的自动解析。

## macOS:`launchctl` 环境覆盖

如果您之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`(或 `...PASSWORD`),该值会覆盖您的配置文件并可能导致持久的"未授权"错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相关

- [CLI 参考](/cli)
- [Gateway doctor](/gateway/doctor)
