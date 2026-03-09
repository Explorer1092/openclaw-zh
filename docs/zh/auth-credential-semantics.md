---
mmh3_hash: "5b145300a1234a5bc3ee1efbce757937"
---
# Auth 凭据语义

本文档定义了以下组件所使用的标准凭据资格与解析语义：

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目标是保持选择阶段与运行时行为的一致性。

## 稳定的原因代码

- `ok`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`

## Token 凭据

Token 凭据（`type: "token"`）支持内联 `token` 和/或 `tokenRef`。

### 资格规则

1. 当 `token` 和 `tokenRef` 均缺失时，Token Profile 不符合资格。
2. `expires` 是可选的。
3. 如果存在 `expires`，它必须是大于 `0` 的有限数字。
4. 如果 `expires` 无效（`NaN`、`0`、负数、非有限数或类型错误），则该 Profile 以 `invalid_expires` 为原因不符合资格。
5. 如果 `expires` 已过期，则该 Profile 以 `expired` 为原因不符合资格。
6. `tokenRef` 不会绕过 `expires` 验证。

### 解析规则

1. 解析器语义与 `expires` 的资格语义保持一致。
2. 对于符合资格的 Profile，Token 材料可以从内联值或 `tokenRef` 中解析。
3. 无法解析的引用会在 `models status --probe` 输出中产生 `unresolved_ref`。

## 向下兼容的消息格式

为了保证脚本兼容性，probe 错误的第一行保持不变：

`Auth profile credentials are missing or expired.`

后续行可以添加对用户友好的详细信息和稳定的原因代码。
