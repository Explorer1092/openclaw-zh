---
mmh3_hash: "31c0586ff6e042d015d0fe9938922cd2"
summary: "`secrets apply` 计划的约定：允许的目标路径、验证规则，以及仅使用引用的认证 Profile 行为"
read_when:
  - 生成或审查 `openclaw secrets apply` 计划文件时
  - 调试 `Invalid plan target path` 错误时
  - 了解 `keyRef` 和 `tokenRef` 如何影响隐式 Provider 发现时
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
  ],
}
```

## 允许的目标类型和路径

| `target.type`                        | 允许的 `target.path` 格式                                 | 可选的 ID 匹配规则                                      |
| ------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.<providerId>.apiKey`                    | 若存在，`providerId` 必须与 `<providerId>` 匹配         |
| `skills.entries.apiKey`              | `skills.entries.<skillKey>.apiKey`                        | 无                                                      |
| `channels.googlechat.serviceAccount` | `channels.googlechat.serviceAccount`                      | `accountId` 必须为空或省略                              |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.<accountId>.serviceAccount` | 若存在，`accountId` 必须与 `<accountId>` 匹配          |

## 路径验证规则

每个目标都会经过以下所有验证：

- `type` 必须是上述允许的目标类型之一。
- `path` 必须是非空的点分路径。
- `pathSegments` 可以省略。若提供，其规范化结果必须与 `path` 完全一致。
- 禁止使用以下路径段：`__proto__`、`prototype`、`constructor`。
- 规范化后的路径必须符合该目标类型的允许路径格式之一。
- 若设置了 `providerId` / `accountId`，则必须与路径中编码的 ID 匹配。

## 失败行为

如果某个目标验证失败，apply 会以如下错误退出：

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

对于该无效目标路径，不会提交任何部分修改。

## 仅使用引用的认证 Profile 与隐式 Provider

隐式 Provider 发现也会考虑存储引用而非明文凭据的认证 Profile：

- `type: "api_key"` 的 Profile 可以使用 `keyRef`（例如基于环境变量的引用）。
- `type: "token"` 的 Profile 可以使用 `tokenRef`。

行为说明：

- 对于 API 密钥类 Provider（例如 `volcengine`、`byteplus`），仅使用引用的 Profile 仍可激活隐式 Provider 条目。
- 对于 `github-copilot`，若 Profile 没有明文 token，发现流程会在 token 交换之前尝试 `tokenRef` 环境变量解析。

## 运维检查

```bash
# 验证计划，不执行写入
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# 然后正式应用
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
```

如果 apply 因无效目标路径消息失败，请使用 `openclaw secrets configure` 重新生成计划，或将目标路径修正为上述允许格式之一。

## 相关文档

- [Secrets 管理](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [配置参考](/gateway/configuration-reference)
