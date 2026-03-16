---
mmh3_hash: "900886aa695f4857116209d1b34d92e1"
summary: "Gateway WebSocket 协议:握手、帧、版本控制"
read_when:
  - 实现或更新 Gateway WS 客户端
  - 调试协议不匹配或连接失败
  - 重新生成协议 schema/models
title: "Gateway 协议"
---

# Gateway 协议(WebSocket)

Gateway WS 协议是 OpenClaw 的**单一控制平面 + 节点传输**。所有客户端(CLI、Web UI、macOS 应用、iOS/Android 节点、无头节点)通过 WebSocket 连接,并在握手时声明其**角色** + **范围**。

## 传输

- WebSocket,带有 JSON 负载的文本帧。
- 第一帧**必须**是 `connect` 请求。

## 握手(connect)

Gateway → 客户端(连接前挑战):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

客户端 → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → 客户端:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

当发出设备令牌时,`hello-ok` 还包含:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

### 节点示例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## 帧

- **请求**:`{type:"req", id, method, params}`
- **响应**:`{type:"res", id, ok, payload|error}`
- **事件**:`{type:"event", event, payload, seq?, stateVersion?}`

有副作用的方法需要**幂等性键**(参见 schema)。

## 角色 + 范围

### 角色

- `operator` = 控制平面客户端(CLI/UI/自动化)。
- `node` = 能力主机(camera/screen/canvas/system.run)。

### 范围(operator)

常见范围:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`

方法范围只是第一道关卡。某些通过 `chat.send` 到达的 slash 命令在顶部应用更严格的命令级别检查。例如,持久的 `/config set` 和 `/config unset` 写入需要 `operator.admin`。

### Caps/commands/permissions(节点)

节点在连接时声明能力声明:

- `caps`:高级能力类别。
- `commands`:调用的命令允许列表。
- `permissions`:细粒度切换(例如 `screen.record`、`camera.capture`)。

Gateway 将这些视为**声明**并强制执行服务器端允许列表。

## 存在

- `system-presence` 返回按设备身份键控的条目。
- 存在条目包含 `deviceId`、`roles` 和 `scopes`,以便 UI 可以为每个设备显示单行,即使它同时以**操作员**和**节点**身份连接。

### 节点辅助方法

- 节点可以调用 `skills.bins` 获取当前技能可执行文件列表以进行自动允许检查。

### 操作员辅助方法

- 操作员可以调用 `tools.catalog`(`operator.read`)获取 Agent 的运行时工具目录。响应包括分组工具和来源元数据:
  - `source`:`core` 或 `plugin`
  - `pluginId`:当 `source="plugin"` 时的插件所有者
  - `optional`:插件工具是否为可选

## Exec 审批

- 当 exec 请求需要审批时,Gateway 广播 `exec.approval.requested`。
- 操作员客户端通过调用 `exec.approval.resolve` 来解决(需要 `operator.approvals` 范围)。
- 对于 `host=node`,`exec.approval.request` 必须包含 `systemRunPlan`(规范的 `argv`/`cwd`/`rawCommand`/Session 元数据)。缺少 `systemRunPlan` 的请求会被拒绝。

## 版本控制

- `PROTOCOL_VERSION` 位于 `src/gateway/protocol/schema.ts` 中。
- 客户端发送 `minProtocol` + `maxProtocol`;服务器拒绝不匹配。
- Schema + models 从 TypeBox 定义生成:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## 认证

- 如果设置了 `OPENCLAW_GATEWAY_TOKEN`(或 `--token`),`connect.params.auth.token` 必须匹配,否则 socket 关闭。
- 配对后,Gateway 发出一个范围为连接角色 + 范围的**设备令牌**。它在 `hello-ok.auth.deviceToken` 中返回,客户端应持久化以供将来连接使用。
- 设备令牌可以通过 `device.token.rotate` 和 `device.token.revoke` 轮换/撤销(需要 `operator.pairing` 范围)。
- 认证失败包含 `error.details.code` 加上恢复提示:
  - `error.details.canRetryWithDeviceToken`(布尔值)
  - `error.details.recommendedNextStep`(`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` 的客户端行为:
  - 受信任的客户端可以尝试一次使用缓存的每设备令牌进行有界重试。
  - 如果该重试失败,客户端应停止自动重连循环并呈现操作员操作指导。

## 设备身份 + 配对

- 节点应包含从密钥对指纹派生的稳定设备身份(`device.id`)。
- Gateway 为每个设备 + 角色发出令牌。
- 除非启用了本地自动审批,否则新设备 ID 需要配对审批。
- **本地**连接包括回环和 Gateway 主机自身的 tailnet 地址(因此同一主机的 tailnet 绑定仍然可以自动审批)。
- 所有 WS 客户端在 `connect` 时必须包含 `device` 身份(操作员 + 节点)。Control UI 只能在以下模式中省略它:
  - `gateway.controlUi.allowInsecureAuth=true` 仅用于本地回环不安全 HTTP 兼容性。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`(紧急方案,严重安全降级)。
- 所有连接必须签署服务器提供的 `connect.challenge` nonce。

### 设备认证迁移诊断

对于仍使用预挑战签名行为的旧版客户端,`connect` 现在在 `error.details.code` 下返回 `DEVICE_AUTH_*` 详细代码,带有稳定的 `error.details.reason`。

常见迁移失败:

| 消息                     | details.code                     | details.reason           | 含义                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 客户端省略了 `device.nonce`(或发送为空)。     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 客户端使用陈旧/错误的 nonce 签名。            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 签名负载与 v2 负载不匹配。       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 签名时间戳超出允许的偏差。          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 与公钥指纹不匹配。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公钥格式/规范化失败。         |

迁移目标:

- 始终等待 `connect.challenge`。
- 签署包含服务器 nonce 的 v2 负载。
- 在 `connect.params.device.nonce` 中发送相同的 nonce。
- 首选签名负载是 `v3`,它除了 device/client/role/scopes/token/nonce 字段外还绑定 `platform` 和 `deviceFamily`。
- 旧版 `v2` 签名仍被接受以保持兼容性,但配对设备元数据固定仍在重连时控制命令策略。

## TLS + 固定

- WS 连接支持 TLS。
- 客户端可以选择固定 Gateway 证书指纹(参见 `gateway.tls` 配置加上 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`)。

## 范围

此协议公开**完整的 Gateway API**(状态、Channel、模型、聊天、Agent、Session、节点、审批等)。确切的表面由 `src/gateway/protocol/schema.ts` 中的 TypeBox schema 定义。
