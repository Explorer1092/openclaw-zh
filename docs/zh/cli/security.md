---
title: "`openclaw security`"
sidebarTitle: "openclaw security"
mmh3_hash: "7e3ef2a8dc37c85f5fd69bb980ab126a"
summary: "`openclaw security` 的 CLI 参考(审计和修复常见的安全陷阱)"
read_when:
  - 您想对配置/状态运行快速安全审计
  - 您想应用安全的"修复"建议(chmod、加强默认值)
---

# `openclaw security`

安全工具(审计 + 可选修复)。

相关:

- 安全指南:[安全](/gateway/security)

## 审计

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

当多个 DM 发件人共享主 Session 时,审计会发出警告,并建议**安全 DM 模式**:对共享收件箱使用 `session.dmScope="per-channel-peer"`(或对多账户 Channel 使用 `per-account-channel-peer`)。这适用于协作/共享收件箱加固。单个由相互不信任/对抗性运营者共享的 Gateway 不是推荐的设置;请使用单独的 Gateway(或单独的 OS 用户/主机)分割信任边界。

当使用小型模型(`<=300B`)而没有沙盒并启用 web/浏览器工具时,它也会发出警告。

对于 webhook 入口,当 `hooks.defaultSessionKey` 未设置、当启用请求 `sessionKey` 覆盖以及当在没有 `hooks.allowedSessionKeyPrefixes` 的情况下启用覆盖时,它会发出警告。

当沙盒模式关闭时配置了沙盒 Docker 设置、当 `gateway.nodes.denyCommands` 使用无效的模式类/未知条目、当 `gateway.nodes.allowCommands` 显式启用危险的 Node 命令、当全局 `tools.profile="minimal"` 被 Agent 工具配置文件覆盖、当开放组在没有沙盒/工作区保护的情况下暴露运行时/文件系统工具,以及当安装的扩展 Plugin 工具可能在宽松的工具策略下可达时,它也会发出警告。

它还标记 `gateway.allowRealIpFallback=true`(如果代理配置错误,存在 header 欺骗风险)和 `discovery.mdns.mode="full"`(通过 mDNS TXT 记录泄露元数据)。

当沙盒浏览器使用 Docker `bridge` 网络而没有 `sandbox.browser.cdpSourceRange` 时,它也会发出警告。

当现有沙盒浏览器 Docker 容器缺少/过期的哈希标签(例如缺少 `openclaw.browserConfigEpoch` 的迁移前容器)时,它也会发出警告,并建议 `openclaw sandbox recreate --browser --all`。

当基于 npm 的 Plugin/Hook 安装记录未固定、缺少完整性元数据或与当前安装的包版本存在差异时,它会发出警告。

当 Discord 允许列表(`channels.discord.allowFrom`、`channels.discord.guilds.*.users`、配对存储)使用名称或标签条目而非稳定 ID 时,它会发出警告。

当 `gateway.auth.mode="none"` 使 Gateway HTTP API 在没有共享密钥的情况下可达(`/tools/invoke` 以及任何启用的 `/v1/*` 端点)时,它会发出警告。

## JSON 输出

使用 `--json` 进行 CI/策略检查:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

如果 `--fix` 和 `--json` 组合使用,输出同时包含修复操作和最终报告:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 更改的内容

`--fix` 应用安全、确定性的修复措施:

- 将常见的 `groupPolicy="open"` 翻转为 `groupPolicy="allowlist"`(包括支持 Channel 中的账户变体)
- 将 `logging.redactSensitive` 从 `"off"` 设置为 `"tools"`
- 收紧状态/配置和常见敏感文件的权限(`credentials/*.json`、`auth-profiles.json`、`sessions.json`、Session `*.jsonl`)

`--fix` **不会**:

- 轮换令牌/密码/API 密钥
- 禁用工具(`gateway`、`cron`、`exec` 等)
- 更改 Gateway 绑定/身份验证/网络暴露选择
- 删除或重写 Plugin/Skill
