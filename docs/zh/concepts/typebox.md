---
title: "TypeBox 作为协议真相来源"
sidebarTitle: "TypeBox 协议真相来源"
mmh3_hash: "78c9a91e49df0b051814e03642803626"
summary: "TypeBox schemas 作为 gateway protocol 的单一真相来源"
read_when:
  - 更新 protocol schemas 或 codegen
---
# TypeBox 作为协议真相来源

最后更新: 2026-01-10

TypeBox 是 TypeScript 优先的 schema 库。我们使用它定义 **Gateway WebSocket protocol**(握手、request/response、server events)。这些 schemas 驱动 **runtime 验证**、**JSON Schema 导出** 和 macOS app 的 **Swift codegen**。一个真相来源;其他一切都是生成的。

如果你想要更高层次的 protocol context,请从 [Gateway architecture](/zh/concepts/architecture) 开始。

## 心智模型(30 秒)

每个 Gateway WS 消息都是三种帧之一:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

第一帧 **必须** 是 `connect` request。之后,clients 可以调用 methods(例如 `health`、`send`、`chat.send`)并订阅 events(例如 `presence`、`tick`、`agent`)。

连接流程(最小):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

常见 methods + events:

| 类别 | 示例 | 注意 |
| --- | --- | --- |
| Core | `connect`, `health`, `status` | `connect` 必须是第一个 |
| Messaging | `send`, `poll`, `agent`, `agent.wait` | 副作用需要 `idempotencyKey` |
| Chat | `chat.history`, `chat.send`, `chat.abort`, `chat.inject` | WebChat 使用这些 |
| Sessions | `sessions.list`, `sessions.patch`, `sessions.delete` | session admin |
| Nodes | `node.list`, `node.invoke`, `node.pair.*` | Gateway WS + node actions |
| Events | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown` | server push |

权威列表位于 `src/gateway/server.ts` (`METHODS`, `EVENTS`)。

## Schemas 位于何处

- 源: `src/gateway/protocol/schema.ts`
- Runtime validators (AJV): `src/gateway/protocol/index.ts`
- Server handshake + method dispatch: `src/gateway/server.ts`
- Node client: `src/gateway/client.ts`
- 生成的 JSON Schema: `dist/protocol.schema.json`
- 生成的 Swift models: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## 当前管道

- `pnpm protocol:gen`
  - 将 JSON Schema (draft‑07) 写入 `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - 生成 Swift gateway models
- `pnpm protocol:check`
  - 运行两个生成器并验证输出已提交

## Schemas 在 runtime 如何使用

- **Server side**: 每个入站帧都用 AJV 验证。握手仅接受其参数匹配 `ConnectParams` 的 `connect` request。
- **Client side**: JS client 在使用之前验证 event 和 response 帧。
- **Method surface**: Gateway 在 `hello-ok` 中公布支持的 `methods` 和 `events`。

## 示例帧

Connect (第一条消息):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 2,
    "maxProtocol": 2,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

Hello-ok response:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 2,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": { "presence": [], "health": {}, "stateVersion": { "presence": 0, "health": 0 }, "uptimeMs": 0 },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Request + response:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Event:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## 最小 client (Node.js)

最小有用流程:connect + health。

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(JSON.stringify({
    type: "req",
    id: "c1",
    method: "connect",
    params: {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: "cli",
        displayName: "example",
        version: "dev",
        platform: "node",
        mode: "cli"
      }
    }
  }));
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## 工作示例:端到端添加 method

示例:添加返回 `{ ok: true, text }` 的新 `system.echo` request。

1) **Schema (真相来源)**

添加到 `src/gateway/protocol/schema.ts`:

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

将两者添加到 `ProtocolSchemas` 并导出类型:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2) **验证**

在 `src/gateway/protocol/index.ts` 中,导出 AJV validator:

```ts
export const validateSystemEchoParams =
  ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3) **Server 行为**

在 `src/gateway/server-methods/system.ts` 中添加 handler:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

在 `src/gateway/server-methods.ts` 中注册它(已合并 `systemHandlers`),然后将 `"system.echo"` 添加到 `src/gateway/server.ts` 中的 `METHODS`。

4) **重新生成**

```bash
pnpm protocol:check
```

5) **Tests + docs**

在 `src/gateway/server.*.test.ts` 中添加 server 测试,并在文档中注释该 method。

## Swift codegen 行为

Swift 生成器发出:

- 带有 `req`、`res`、`event` 和 `unknown` cases 的 `GatewayFrame` enum
- 强类型 payload structs/enums
- `ErrorCode` 值和 `GATEWAY_PROTOCOL_VERSION`

未知帧类型作为原始 payloads 保留以实现向前兼容性。

## 版本控制 + 兼容性

- `PROTOCOL_VERSION` 位于 `src/gateway/protocol/schema.ts`。
- Clients 发送 `minProtocol` + `maxProtocol`;server 拒绝不匹配。
- Swift models 保留未知帧类型以避免破坏较旧的 clients。

## Schema 模式和约定

- 大多数对象使用 `additionalProperties: false` 以获得严格的 payloads。
- `NonEmptyString` 是 IDs 和 method/event 名称的默认值。
- 顶级 `GatewayFrame` 在 `type` 上使用 **discriminator**。
- 具有副作用的 Methods 通常需要参数中的 `idempotencyKey`(例如:`send`、`poll`、`agent`、`chat.send`)。

## 实时 schema JSON

生成的 JSON Schema 位于 repo 的 `dist/protocol.schema.json`。发布的原始文件通常可从以下位置获得:

- https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json

## 当你更改 schemas 时

1) 更新 TypeBox schemas。
2) 运行 `pnpm protocol:check`。
3) 提交重新生成的 schema + Swift models。
