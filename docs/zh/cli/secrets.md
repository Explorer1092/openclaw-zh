---
mmh3_hash: "aeeb49b0ce77588086fac497961651d4"
summary: "`openclaw secrets` 的 CLI 参考(reload、audit、configure、apply)"
read_when:
  - 在运行时重新解析 secret ref
  - 审计明文残留和未解析的 ref
  - 配置 SecretRef 并应用单向清除变更
title: "secrets"
---

# `openclaw secrets`

使用 `openclaw secrets` 将凭证从明文迁移到 SecretRef,并保持活跃的 secrets 运行时健康。

命令职责:

- `reload`: Gateway RPC（`secrets.reload`），仅在完全成功时重新解析 ref 并原子性替换运行时快照（不写入配置）。
- `audit`: 对配置 + 认证存储 + 遗留残留（`.env`、`auth.json`）中的明文、未解析 ref 和优先级漂移进行只读扫描。
- `configure`: 交互式规划工具，用于 Provider 设置 + 目标映射 + 预检（需要 TTY）。
- `apply`: 执行已保存的计划（`--dry-run` 仅用于验证），然后清除已迁移的明文残留。

推荐的运维流程:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

CI/门控的退出码说明:

- `audit --check` 发现问题时返回 `1`，ref 未解析时返回 `2`。

相关文档:

- Secrets 指南:[Secrets 管理](/gateway/secrets)
- 安全指南:[安全](/gateway/security)

## 重新加载运行时快照

重新解析 secret ref 并原子性替换运行时快照。

```bash
openclaw secrets reload
openclaw secrets reload --json
```

说明:

- 使用 Gateway RPC 方法 `secrets.reload`。
- 如果解析失败，Gateway 保留上一个已知正常的快照并返回错误（不进行部分激活）。
- JSON 响应包含 `warningCount`。

## 审计

扫描 OpenClaw 状态，检查:

- 明文 secret 存储
- 未解析的 ref
- 优先级漂移（`auth-profiles` 覆盖配置 ref）
- 遗留残留（`auth.json`、OAuth 范围外说明）

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
```

退出行为:

- `--check` 发现问题时以非零状态退出。
- 未解析的 ref 以更高优先级非零代码退出。

报告内容摘要:

- `status`: `clean | findings | unresolved`
- `summary`: `plaintextCount`、`unresolvedRefCount`、`shadowedRefCount`、`legacyResidueCount`
- 发现代码:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## 配置（交互式助手）

以交互方式构建 Provider + SecretRef 变更，运行预检，并可选择立即应用:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --json
```

流程:

- 首先设置 Provider（为 `secrets.providers` 别名执行 `add/edit/remove`）。
- 其次进行凭证映射（选择字段并分配 `{source, provider, id}` ref）。
- 最后进行预检和可选应用。

标志:

- `--providers-only`: 仅配置 `secrets.providers`，跳过凭证映射。
- `--skip-provider-setup`: 跳过 Provider 设置，将凭证映射到现有 Provider。

说明:

- 需要交互式 TTY。
- 不能同时使用 `--providers-only` 和 `--skip-provider-setup`。
- `configure` 针对 `openclaw.json` 中含 secret 的字段。
- 请包含所有您打算迁移的含 secret 字段（例如同时包含 `models.providers.*.apiKey` 和 `skills.entries.*.apiKey`），以便 audit 能达到干净状态。
- 在应用前执行预检解析。
- 生成的计划默认启用清除选项（`scrubEnv`、`scrubAuthProfilesForProviderTargets`、`scrubLegacyAuthJson` 均已启用）。
- 已迁移明文值的应用路径是单向的。
- 不使用 `--apply` 时，CLI 仍会在预检后提示 `Apply this plan now?`。
- 使用 `--apply`（且不带 `--yes`）时，CLI 会额外提示不可逆迁移确认。

Exec Provider 安全说明:

- Homebrew 安装通常会在 `/opt/homebrew/bin/*` 下暴露符号链接二进制文件。
- 仅在受信任的包管理器路径需要时才设置 `allowSymlinkCommand: true`，并配合 `trustedDirs`（例如 `["/opt/homebrew"]`）使用。

## 应用已保存的计划

应用或预检之前生成的计划:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

计划合约详情（允许的目标路径、验证规则和失败语义）:

- [Secrets Apply 计划合约](/gateway/secrets-plan-contract)

`apply` 可能更新的内容:

- `openclaw.json`（SecretRef 目标 + Provider 更新/删除）
- `auth-profiles.json`（Provider 目标清除）
- 遗留 `auth.json` 残留
- `~/.openclaw/.env` 中已迁移值的已知 secret 键

## 为何没有回滚备份

`secrets apply` 有意不写入包含旧明文值的回滚备份。

安全性来自严格的预检 + 原子式应用（失败时尽力进行内存内恢复）。

## 示例

```bash
# 先审计，然后配置，再确认干净状态:
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

如果部分迁移后 `audit --check` 仍报告明文发现，请确认您也迁移了 skill 密钥（`skills.entries.*.apiKey`）及任何其他报告的目标路径。
