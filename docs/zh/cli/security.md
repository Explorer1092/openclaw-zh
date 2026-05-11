---
mmh3_hash: "805543fc31b7a68d751d17fe21e0faa3"
summary: "`openclaw security` 的 CLI 参考（审计和修复常见的安全陷阱）"
read_when:
  - 您想对配置/状态运行快速安全审计
  - 您想应用安全的"修复"建议（权限、收紧默认值）
title: "Security"
---

# `openclaw security`

安全工具（审计 + 可选修复）。

相关：

- 安全指南：[安全性](/gateway/security)

## 审计

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

普通的 `security audit` 保持在冷配置/文件系统/只读路径上。默认情况下，它不会通过运行时发现 Plugin 安全收集器，因此常规审计不会加载每个已安装的 Plugin 运行时。使用 `--deep` 包含尽力而为的实时 Gateway 探测和 Plugin 拥有的安全审计收集器；明确的内部调用者在已有适当运行时范围时也可以选择加入这些 Plugin 拥有的收集器。

当多个 DM 发件人共享主 Session 时，审计会发出警告，并推荐**安全 DM 模式**：`session.dmScope="per-channel-peer"`（或多账户 Channel 的 `per-account-channel-peer`）用于共享收件箱。
这适用于协作/共享收件箱加固。由相互不信任/对立的操作员共享的单个 Gateway 不是推荐的设置；使用单独的 Gateway（或单独的操作系统用户/主机）分割信任边界。
当配置暗示可能的共享用户入口（例如开放的 DM/群组策略、配置的群组目标或通配符发件人规则）时，它还会发出 `security.trust_model.multi_user_heuristic`，并提醒您 OpenClaw 默认是个人助手信任模型。
对于有意的共享用户设置，审计指导是对所有 Session 进行沙盒化、将文件系统访问限制在工作空间范围内，并将个人/私人身份或凭据排除在该运行时之外。
当使用小型模型（`<=300B`）且不使用沙盒，同时启用了网络/浏览器工具时，它还会发出警告。
对于 webhook 入口，当 `hooks.token` 重用 Gateway 令牌、`hooks.token` 较短、`hooks.path="/"`、`hooks.defaultSessionKey` 未设置、`hooks.allowedAgentIds` 不受限制、请求 `sessionKey` 覆盖已启用，以及覆盖已启用但没有 `hooks.allowedSessionKeyPrefixes` 时，它会发出警告。
当 Docker 沙盒设置已配置但沙盒模式关闭时、当 `gateway.nodes.denyCommands` 使用无效的模式/未知条目时（仅精确 Node 命令名匹配，而非 Shell 文本过滤）、当 `gateway.nodes.allowCommands` 显式启用危险的 Node 命令时、当全局 `tools.profile="minimal"` 被 Agent 工具配置文件覆盖时、当写入/编辑工具已禁用但 `exec` 仍然在没有约束沙盒文件系统边界的情况下可用时、当开放群组在没有沙盒/工作空间保护的情况下公开运行时/文件系统工具时，以及当已安装的 Plugin 工具可能在宽松的工具策略下可达时，它也会发出警告。
它还标记 `gateway.allowRealIpFallback=true`（如果代理配置错误，标头欺骗风险）和 `discovery.mdns.mode="full"`（通过 mDNS TXT 记录泄漏元数据）。
当沙盒浏览器使用没有 `sandbox.browser.cdpSourceRange` 的 Docker `bridge` 网络时，它也会发出警告。
它还标记危险的沙盒 Docker 网络模式（包括 `host` 和 `container:*` 命名空间加入）。
当现有沙盒浏览器 Docker 容器缺少/过期的哈希标签时（例如缺少 `openclaw.browserConfigEpoch` 的迁移前容器），它还会发出警告并推荐 `openclaw sandbox recreate --browser --all`。
当基于 npm 的 Plugin/Hook 安装记录未固定、缺少完整性元数据或与当前安装的包版本漂移时，它也会发出警告。
它警告 Channel 允许列表依赖于可变名称/电子邮件/标签而非稳定 ID（Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC 适用范围）。
当 `gateway.auth.mode="none"` 使 Gateway HTTP API 在没有共享密钥的情况下可达时（`/tools/invoke` 加上任何已启用的 `/v1/*` 端点），它会发出警告。
以 `dangerous`/`dangerously` 为前缀的设置是明确的紧急操作员覆盖；启用一个本身不是安全漏洞报告。
有关完整的危险参数清单，请参阅[安全性](/gateway/security)中的"不安全或危险标志摘要"部分。

SecretRef 行为：

- `security audit` 以只读模式为其目标路径解析支持的 SecretRef。
- 如果 SecretRef 在当前命令路径中不可用，审计继续并报告 `secretDiagnostics`（而不是崩溃）。
- `--token` 和 `--password` 仅覆盖该命令调用的深度探测身份验证；它们不重写配置或 SecretRef 映射。

## JSON 输出

使用 `--json` 进行 CI/策略检查：

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

如果 `--fix` 和 `--json` 组合使用，输出包括修复操作和最终报告：

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 更改的内容

`--fix` 应用安全的、确定性的修复措施：

- 将常见的 `groupPolicy="open"` 翻转为 `groupPolicy="allowlist"`（包括支持 Channel 中的账户变体）
- 当 WhatsApp 群组策略翻转为 `allowlist` 时，当该列表存在且配置尚未定义 `allowFrom` 时，从存储的 `allowFrom` 文件中填充 `groupAllowFrom`
- 将 `logging.redactSensitive` 从 `"off"` 设置为 `"tools"`
- 收紧状态/配置和常见敏感文件的权限（`credentials/*.json`、`auth-profiles.json`、`sessions.json`、Session `*.jsonl`）
- 还收紧从 `openclaw.json` 引用的配置包含文件
- 在 POSIX 主机上使用 `chmod`，在 Windows 上使用 `icacls` 重置

`--fix` **不会**：

- 轮换令牌/密码/API 密钥
- 禁用工具（`gateway`、`cron`、`exec` 等）
- 更改 Gateway 绑定/身份验证/网络暴露选择
- 删除或重写 Plugin/技能

## 相关

- [CLI 参考](/cli)
- [安全审计](/gateway/security)
