---
mmh3_hash: "09300ca3eba688b56a4f18557d3ecacc"
title: "Auth 凭据语义"
summary: "auth profile 的标准凭据资格与解析语义"
read_when:
  - 在处理 auth profile 解析或凭据路由时
  - 调试模型身份验证失败或 profile 顺序问题时
---
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

## Agent 副本可移植性

Agent auth 继承是透传的。当 Agent 没有本地 Profile 时，可以在运行时从默认/主 Agent 存储中解析 Profile，无需将密钥材料复制到自己的 `auth-profiles.json` 中。

显式复制流程（如 `openclaw agents add`）使用以下可移植性策略：

- `api_key` Profile 默认可移植，除非设置了 `copyToAgents: false`。
- `token` Profile 默认可移植，除非设置了 `copyToAgents: false`。
- `oauth` Profile 默认不可移植，因为刷新 Token 可能是一次性的或对轮换敏感。
- Provider 自有的 OAuth 流程仅在已知跨 Agent 复制刷新材料是安全的情况下，才可以通过 `copyToAgents: true` 选择加入。

不可移植的 Profile 在目标 Agent 单独登录并创建自己的本地 Profile 之前，仍可通过透传继承获取。

## 仅配置的 Auth 路由

`auth.profiles` 中带有 `mode: "aws-sdk"` 的条目是路由元数据，而非存储的凭据。当目标 Provider 使用 `models.providers.<id>.auth: "aws-sdk"` 或内置的 Amazon Bedrock 默认 AWS SDK 路由时，这些条目有效。即使 `auth-profiles.json` 中不存在对应条目，这些 Profile ID 也可以出现在 `auth.order` 和 Session 覆盖中。

不要将 `type: "aws-sdk"` 写入 `auth-profiles.json`。如果旧版安装中存在此类标记，`openclaw doctor --fix` 会将其移至 `auth.profiles` 并从凭据存储中删除该标记。

## 显式身份验证顺序过滤

- 当为某个 Provider 设置了 `auth.order.<provider>` 或 auth-store 顺序覆盖时，`models status --probe` 仅探测保留在该 Provider 解析身份验证顺序中的 Profile ID。
- 为该 Provider 存储但被排除在显式顺序之外的 Profile 不会在稍后静默尝试。Probe 输出以 `reasonCode: excluded_by_auth_order` 和详情 `Excluded by auth.order for this provider.` 报告它。

## Probe 目标解析

- Probe 目标可以来自 auth profiles、环境凭据或 `models.json`。
- 如果 Provider 有凭据，但 OpenClaw 无法为其解析可探测的模型候选，`models status --probe` 会报告 `status: no_model`，`reasonCode: no_model`。

## 外部 CLI 凭据发现

- 外部 CLI 拥有的仅运行时凭据，仅在该 Provider、运行时或 auth Profile 在当前操作的范围内时，或者当该外部来源的已存储本地 Profile 已存在时，才会被发现。
- Auth 存储调用者应选择明确的外部 CLI 发现模式：`none` 表示仅持久化/Plugin auth，`existing` 表示刷新已存储的外部 CLI Profile，`scoped` 表示具体的 Provider/Profile 集。
- 只读/状态路径传入 `allowKeychainPrompt: false`；它们仅使用文件支撑的外部 CLI 凭据，不读取或复用 macOS Keychain 结果。

## OAuth SecretRef 策略保护

- SecretRef 输入仅用于静态凭据。
- 如果 Profile 凭据为 `type: "oauth"`，则该 Profile 凭据材料不支持 SecretRef 对象。
- 如果 `auth.profiles.<id>.mode` 为 `"oauth"`，则该 Profile 的 SecretRef 支持的 `keyRef`/`tokenRef` 输入将被拒绝。
- 违规是启动/重新加载身份验证解析路径中的硬失败。

## 向下兼容的消息格式

为了保证脚本兼容性，probe 错误的第一行保持不变：

`Auth profile credentials are missing or expired.`

后续行可以添加对用户友好的详细信息和稳定的原因代码。

## 相关

- [密钥管理](/gateway/secrets)
- [Auth 存储](/concepts/oauth)
