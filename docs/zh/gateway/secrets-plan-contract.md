---
mmh3_hash: "53d4a1fcabefc498277832eef0b7fc9e"
summary: "`secrets apply` 计划的约定：目标验证、路径匹配，以及 `auth-profiles.json` 目标作用域"
read_when:
  - 生成或审查 `openclaw secrets apply` 计划
  - 调试 `Invalid plan target path` 错误
  - 了解目标类型和路径验证行为
title: "Secrets Apply 计划约定"
---

# Secrets apply 计划约定

本页定义了 `openclaw secrets apply` 强制执行的严格约定。

如果目标不符合这些规则，apply 会在修改配置之前退出并报错。

## 计划文件结构

`openclaw secrets apply --from <plan.json>` 需要一个包含计划目标的 `targets` 数组：

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## 支持的目标作用域

计划目标接受以下支持的凭证路径：

- [SecretRef 凭证字段](/reference/secretref-credential-surface)

## 目标类型行为

通用规则：

- `target.type` 必须是已识别的类型，且必须与规范化后的 `target.path` 形式匹配。

兼容性别名仍对现有计划有效：

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## 路径验证规则

每个目标都会经过以下所有验证：

- `type` 必须是已识别的目标类型。
- `path` 必须是非空的点分路径。
- `pathSegments` 可以省略。若提供，其规范化结果必须与 `path` 完全一致。
- 禁止使用以下路径段：`__proto__`、`prototype`、`constructor`。
- 规范化后的路径必须符合该目标类型已注册的路径形式。
- 若设置了 `providerId` 或 `accountId`，则必须与路径中编码的 ID 匹配。
- `auth-profiles.json` 目标需要 `agentId`。
- 创建新的 `auth-profiles.json` 映射时，需包含 `authProfileProvider`。

## 失败行为

如果某个目标验证失败，apply 会以如下错误退出：

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

对于无效计划，不会提交任何写入。

## Exec provider 同意行为

- `--dry-run` 默认跳过 exec SecretRef 检查。
- 包含 exec SecretRef/provider 的计划在写入模式下会被拒绝，除非设置了 `--allow-exec`。
- 验证/应用包含 exec 的计划时，在 dry-run 和写入命令中都传递 `--allow-exec`。

## 运行时和审计作用域说明

- 仅引用的 `auth-profiles.json` 条目（`keyRef`/`tokenRef`）包含在运行时解析和审计覆盖中。
- `secrets apply` 写入支持的 `openclaw.json` 目标、支持的 `auth-profiles.json` 目标以及可选的清除目标。

## 运维检查

```bash
# 验证计划，不执行写入
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# 然后正式应用
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
```

如果 apply 因无效目标路径消息失败，请使用 `openclaw secrets configure` 重新生成计划，或将目标路径修正为上述支持的形式之一。

## 相关文档

- [Secrets 管理](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [SecretRef 凭证字段](/reference/secretref-credential-surface)
- [配置参考](/gateway/configuration-reference)
