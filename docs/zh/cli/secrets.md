---
mmh3_hash: "252f8170d00da1779f930aa124942057"
summary: "`openclaw secrets` 的 CLI 参考(reload、audit、configure、apply)"
read_when:
  - 在运行时重新解析 secret ref
  - 审计明文残留和未解析的 ref
  - 配置 SecretRef 并应用单向清除变更
title: "secrets"
---

# `openclaw secrets`

使用 `openclaw secrets` 管理 SecretRef 并保持活跃的运行时快照健康。

命令职责:

- `reload`: Gateway RPC（`secrets.reload`），仅在完全成功时重新解析 ref 并原子性替换运行时快照（不写入配置）。
- `audit`: 对配置/身份验证/生成的模型存储和遗留残留中的明文、未解析 ref 和优先级漂移进行只读扫描（除非设置了 `--allow-exec`,否则跳过 Exec ref）。
- `configure`: 交互式规划工具，用于 Provider 设置 + 目标映射 + 预检（需要 TTY）。
- `apply`: 执行已保存的计划（`--dry-run` 仅用于验证;试运行默认跳过 Exec 检查，写入模式拒绝含 Exec 的计划除非设置了 `--allow-exec`），然后清除已迁移的明文残留。

推荐的运维流程:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

如果您的计划包含 `exec` SecretRef/Provider，请在试运行和写入应用命令中都传递 `--allow-exec`。

CI/门控的退出码说明:

- `audit --check` 发现问题时返回 `1`，ref 未解析时返回 `2`。

相关文档:

- Secrets 指南:[Secrets 管理](/gateway/secrets)
- 凭据面:[SecretRef 凭据面](/reference/secretref-credential-surface)
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
- 优先级漂移(`auth-profiles.json` 凭据遮蔽 `openclaw.json` ref)
- 生成的 `agents/*/agent/models.json` 残留(Provider `apiKey` 值和敏感 Provider 标头)
- 遗留残留(遗留身份验证存储条目、OAuth 提醒)

标头残留说明:

- 敏感 Provider 标头检测基于名称启发式(常见身份验证/凭据标头名称和片段,例如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`)。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

退出行为:

- `--check` 发现问题时以非零状态退出。
- 未解析的 ref 以更高优先级非零代码退出。

报告内容摘要:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`、`skippedExecRefs`、`resolvabilityComplete`
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
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

流程:

- 首先设置 Provider（为 `secrets.providers` 别名执行 `add/edit/remove`）。
- 其次进行凭证映射（选择字段并分配 `{source, provider, id}` ref）。
- 最后进行预检和可选应用。

标志:

- `--providers-only`: 仅配置 `secrets.providers`，跳过凭证映射。
- `--skip-provider-setup`: 跳过 Provider 设置，将凭证映射到现有 Provider。
- `--agent <id>`:将 `auth-profiles.json` 目标发现和写入范围限定到一个 Agent 存储。
- `--allow-exec`: 允许在预检/应用期间进行 Exec SecretRef 检查（可能执行 Provider 命令）。

说明:

- 需要交互式 TTY。
- 不能同时使用 `--providers-only` 和 `--skip-provider-setup`。
- `configure` 针对所选 Agent 范围内 `openclaw.json` 中含 secret 的字段以及 `auth-profiles.json`。
- `configure` 支持直接在选择器流程中创建新的 `auth-profiles.json` 映射。
- 规范支持的面:[SecretRef 凭据面](/reference/secretref-credential-surface)。
- 在应用前执行预检解析。
- 如果预检/应用包含 Exec ref，请为两个步骤都保留 `--allow-exec`。
- 生成的计划默认启用清除选项（`scrubEnv`、`scrubAuthProfilesForProviderTargets`、`scrubLegacyAuthJson` 均已启用）。
- 已迁移明文值的应用路径是单向的。
- 不使用 `--apply` 时，CLI 仍会在预检后提示 `Apply this plan now?`。
- 使用 `--apply`（且不带 `--yes`）时，CLI 会额外提示不可逆迁移确认。

Exec Provider 安全说明:

- Homebrew 安装通常会在 `/opt/homebrew/bin/*` 下暴露符号链接二进制文件。
- 仅在受信任的包管理器路径需要时才设置 `allowSymlinkCommand: true`，并配合 `trustedDirs`（例如 `["/opt/homebrew"]`）使用。
- 在 Windows 上，如果 Provider 路径的 ACL 验证不可用，OpenClaw 会失败关闭。仅对受信任的路径，在该 Provider 上设置 `allowInsecurePath: true` 以绕过路径安全检查。

## 应用已保存的计划

应用或预检之前生成的计划:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Exec 行为:

- `--dry-run` 在不写入文件的情况下验证预检。
- 试运行期间默认跳过 Exec SecretRef 检查。
- 写入模式拒绝含有 Exec SecretRef/Provider 的计划，除非设置了 `--allow-exec`。
- 使用 `--allow-exec` 可在任一模式下启用 Exec Provider 检查/执行。

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
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

如果 `audit --check` 仍报告明文发现，请更新剩余报告的目标路径并重新运行审计。
