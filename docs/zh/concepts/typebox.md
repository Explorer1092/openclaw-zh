---
title: "TypeBox"
sidebarTitle: "TypeBox"
mmh3_hash: "62167c990083418a2549cab5139f9d77"
summary: "TypeBox schemas 作为 gateway protocol 的单一真相来源"
read_when:
  - 更新 protocol schemas 或 codegen
---

TypeBox 是一个 TypeScript 优先的 schema 库。我们用它定义 **Gateway WebSocket protocol**（握手、请求/响应、服务器事件）。这些 schemas 驱动**运行时验证**、**JSON Schema 导出**和 macOS 应用的 **Swift codegen**。单一真相来源；其他一切皆由此生成。

如果你需要更高层次的 protocol context，从 [Gateway 架构](/concepts/architecture)开始。

## 心智模型（30 秒）

每条 Gateway WS 消息是三种帧之一：

- **Request**：`{ type: "req", id, method, params }`
- **Response**：`{ type: "res", id, ok, payload | error }`
- **Event**：`{ type: "event", event, payload, seq?, stateVersion? }`

第一帧**必须**是 `connect` 请求。之后，客户端可以调用方法（如 `health`、`send`、`chat.send`）并订阅事件（如 `presence`、`tick`、`agent`）。

连接流程（最小化）：

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

常见方法 + 事件：

| 类别 | 示例 | 备注 |
| --- | --- | --- |
| Core | `connect`, `health`, `status` | `connect` 必须在最前 |
| Messaging | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | 有副作用的需要 `idempotencyKey` |
| Chat | `chat.history`, `chat.send`, `chat.abort` | WebChat 使用这些 |
| Sessions | `sessions.list`, `sessions.patch`, `sessions.delete` | session 管理 |
| Automation | `wake`, `cron.list`, `cron.run`, `cron.runs` | wake + cron 控制 |
| Nodes | `node.list`, `node.invoke`, `node.pair.*` | Gateway WS + node 操作 |
| Events | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown` | 服务器推送 |

权威的已公告**发现**清单位于 `src/gateway/server-methods-list.ts`（`listGatewayMethods`、`GATEWAY_EVENTS`）。

## Schemas 所在位置

- 源代码：`src/gateway/protocol/schema.ts`
- 运行时验证器（AJV）：`src/gateway/protocol/index.ts`
- 已公告功能/发现注册表：`src/gateway/server-methods-list.ts`
- 服务器握手 + 方法分发：`src/gateway/server.impl.ts`
- Node 客户端：`src/gateway/client.ts`
- 生成的 JSON Schema：`dist/protocol.schema.json`
- 生成的 Swift models：`apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## 当前 pipeline

- `pnpm protocol:gen`
  - 将 JSON Schema（draft-07）写入 `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - 生成 Swift gateway models
- `pnpm protocol:check`
  - 运行两个生成器并验证输出已提交

## 运行时 schemas 的使用方式

- **服务器端**：每个入站帧都用 AJV 验证。握手只接受参数匹配 `ConnectParams` 的 `connect` 请求。
- **客户端**：JS 客户端在使用前验证事件和响应帧。
- **功能发现**：Gateway 在 `hello-ok` 中从 `listGatewayMethods()` 和 `GATEWAY_EVENTS` 发送保守的 `features.methods` 和 `features.events` 列表。
- 该发现列表不是 `coreGatewayHandlers` 中每个可调用 helper 的生成转储；一些 helper RPC 在 `src/gateway/server-methods/*.ts` 中实现，但未在已公告的功能列表中枚举。

## 示例帧

Connect（第一条消息）：

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
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

Hello-ok 响应：

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

请求 + 响应：

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

事件：

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## 最小化客户端（Node.js）

最小可用流程：connect + health。

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 4,
        maxProtocol: 4,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
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

## 端到端添加方法示例

示例：添加一个新的 `system.echo` 请求，返回 `{ ok: true, text }`。

1. **Schema（真相来源）**

在 `src/gateway/protocol/schema.ts` 中添加：

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

将两者添加到 `ProtocolSchemas` 并导出类型：

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **验证**

在 `src/gateway/protocol/index.ts` 中导出 AJV 验证器：

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **服务器行为**

在 `src/gateway/server-methods/system.ts` 中添加处理器：

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

在 `src/gateway/server-methods.ts` 中注册它（已合并 `systemHandlers`），然后在 `src/gateway/server-methods-list.ts` 的 `listGatewayMethods` 输入中添加 `"system.echo"`。

如果该方法可被 operator 或 node 客户端调用，还需在 `src/gateway/method-scopes.ts` 中对其分类，以便范围强制执行和 `hello-ok` 功能公告保持一致。

4. **重新生成**

```bash
pnpm protocol:check
```

5. **测试 + 文档**

在 `src/gateway/server.*.test.ts` 中添加服务器测试，并在文档中注明该方法。

## Swift codegen 行为

Swift 生成器生成：

- 带有 `req`、`res`、`event` 和 `unknown` case 的 `GatewayFrame` 枚举
- 强类型的 payload 结构体/枚举
- `ErrorCode` 值、`GATEWAY_PROTOCOL_VERSION` 和 `GATEWAY_MIN_PROTOCOL_VERSION`

未知帧类型保留为原始载荷以实现向前兼容。

## 版本控制 + 兼容性

- `PROTOCOL_VERSION` 位于 `src/gateway/protocol/version.ts`。
- 客户端发送 `minProtocol` + `maxProtocol`；服务器拒绝不包含其当前 protocol 的范围。
- Swift models 保留未知帧类型以避免破坏旧客户端。

## Schema 模式和约定

- 大多数对象对严格载荷使用 `additionalProperties: false`。
- `NonEmptyString` 是 ID 和方法/事件名称的默认值。
- 顶级 `GatewayFrame` 在 `type` 上使用**判别器**。
- 有副作用的方法通常在参数中需要 `idempotencyKey`（示例：`send`、`poll`、`agent`、`chat.send`）。
- `agent` 接受可选的 `internalEvents` 用于运行时生成的编排 context（例如子 agent/cron 任务完成切换）；将其视为内部 API 界面。

## 实时 schema JSON

生成的 JSON Schema 在仓库中位于 `dist/protocol.schema.json`。已发布的原始文件通常可在以下位置获取：

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## 更改 schemas 时

1. 更新 TypeBox schemas。
2. 在 `src/gateway/server-methods-list.ts` 中注册方法/事件。
3. 当新 RPC 需要 operator 或 node 范围分类时，更新 `src/gateway/method-scopes.ts`。
4. 运行 `pnpm protocol:check`。
5. 提交重新生成的 schema + Swift models。

## 相关

- [Rich output protocol](/reference/rich-output-protocol)
- [RPC adapters](/reference/rpc)
