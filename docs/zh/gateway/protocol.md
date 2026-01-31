---
title: "Gateway 协议(WebSocket)"
mmh3_hash: "4ac9154e70fa20f0f258602ad8296136"
summary: "Gateway WebSocket 协议:握手、帧、版本控制"
read_when:
  - 实现或更新 gateway WS 客户端
  - 调试协议不匹配或连接失败
  - 重新生成协议 schema/models
---

# Gateway 协议(WebSocket)

Gateway WS 协议是 OpenClaw 的**单一控制平面 + 节点传输**。所有客户端(CLI、web UI、macOS app、iOS/Android 节点、无头节点)通过 WebSocket 连接并在握手时声明其**角色** + **作用域**。

## 传输

- WebSocket,带 JSON 有效负载的文本帧。
- 第一帧**必须**是 `connect` 请求。

## 握手(connect)

Gateway → Client(预连接挑战):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

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

Gateway → Client:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

当颁发设备令牌时,`hello-ok` 还包括:

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

有副作用的方法需要**幂等键**(参见 schema)。

## 角色 + 作用域

### 角色
- `operator` = 控制平面客户端(CLI/UI/automation)。
- `node` = 功能主机(camera/screen/canvas/system.run)。

### 作用域(operator)
常见作用域:
- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`

### Caps/commands/permissions(node)
节点在连接时声明功能声明:
- `caps`:高级功能类别。
- `commands`:invoke 的命令 allowlist。
- `permissions`:粒度切换(例如 `screen.record`、`camera.capture`)。

Gateway 将这些视为**声明**并强制执行服务器端 allowlists。

## Presence

- `system-presence` 返回按设备身份键入的条目。
- Presence 条目包括 `deviceId`、`roles` 和 `scopes`,以便 UIs 可以显示每个设备的单行,即使它同时作为 **operator** 和 **node** 连接。

### 节点辅助方法

- 节点可以调用 `skills.bins` 以获取当前的 skill 可执行文件列表,用于自动允许检查。

## Exec 批准

- 当 exec 请求需要批准时,gateway 广播 `exec.approval.requested`。
- Operator 客户端通过调用 `exec.approval.resolve` 解决(需要 `operator.approvals` 作用域)。

## 版本控制

- `PROTOCOL_VERSION` 位于 `src/gateway/protocol/schema.ts` 中。
- 客户端发送 `minProtocol` + `maxProtocol`;服务器拒绝不匹配。
- Schemas + models 从 TypeBox 定义生成:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Auth

- 如果设置了 `OPENCLAW_GATEWAY_TOKEN`(或 `--token`),`connect.params.auth.token` 必须匹配,否则 socket 被关闭。
- 配对后,Gateway 颁发一个限定为连接角色 + 作用域的**设备令牌**。它在 `hello-ok.auth.deviceToken` 中返回,应由客户端持久化以供将来连接。
- 设备令牌可以通过 `device.token.rotate` 和 `device.token.revoke` 轮换/撤销(需要 `operator.pairing` 作用域)。

## 设备身份 + 配对

- 节点应包含从密钥对指纹派生的稳定设备身份(`device.id`)。
- Gateways 为每个设备 + 角色颁发令牌。
- 除非启用本地自动批准,否则新设备 IDs 需要配对批准。
- **本地**连接包括 loopback 和 gateway 主机自己的 tailnet 地址(因此同主机 tailnet 绑定仍然可以自动批准)。
- 所有 WS 客户端在 `connect` 期间必须包含 `device` 身份(operator + node)。Control UI **仅**在启用 `gateway.controlUi.allowInsecureAuth`(或用于紧急使用的 `gateway.controlUi.dangerouslyDisableDeviceAuth`)时才能省略它。
- 非本地连接必须签署服务器提供的 `connect.challenge` nonce。

## TLS + 固定

- WS 连接支持 TLS。
- 客户端可以选择固定 gateway 证书指纹(参见 `gateway.tls` 配置加上 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`)。

## 作用域

此协议公开**完整的 gateway API**(status、channels、models、chat、agent、sessions、nodes、approvals 等)。确切的 surface 由 `src/gateway/protocol/schema.ts` 中的 TypeBox schemas 定义。
