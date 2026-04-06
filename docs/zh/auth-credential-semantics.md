---
mmh3_hash: "5f849a8de49f1ec0fa39644512a4788a"
title: "Auth 凭据语义"
summary: "auth profile 的标准凭据资格与解析语义"
read_when:
  - 在处理 auth profile 解析或凭据路由时
  - 调试模型身份验证失败或 profile 顺序问题时
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
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

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

## 显式身份验证顺序过滤

- 当为某个 Provider 设置了 `auth.order.<provider>` 或 auth-store 顺序覆盖时，`models status --probe` 仅探测保留在该 Provider 解析身份验证顺序中的 Profile ID。
- 为该 Provider 存储但被排除在显式顺序之外的 Profile 不会在稍后静默尝试。Probe 输出以 `reasonCode: excluded_by_auth_order` 和详情 `Excluded by auth.order for this provider.` 报告它。

## Probe 目标解析

- Probe 目标可以来自 auth profiles、环境凭据或 `models.json`。
- 如果 Provider 有凭据，但 OpenClaw 无法为其解析可探测的模型候选，`models status --probe` 会报告 `status: no_model`，`reasonCode: no_model`。

## OAuth SecretRef 策略保护

- SecretRef 输入仅用于静态凭据。
- 如果 Profile 凭据为 `type: "oauth"`，则该 Profile 凭据材料不支持 SecretRef 对象。
- 如果 `auth.profiles.<id>.mode` 为 `"oauth"`，则该 Profile 的 SecretRef 支持的 `keyRef`/`tokenRef` 输入将被拒绝。
- 违规是启动/重新加载身份验证解析路径中的硬失败。

## 向下兼容的消息格式

为了保证脚本兼容性，probe 错误的第一行保持不变：

`Auth profile credentials are missing or expired.`

后续行可以添加对用户友好的详细信息和稳定的原因代码。
