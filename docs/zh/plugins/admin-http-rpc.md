---
mmh3_hash: "8f2206887d0c5c6190a80febd4c87481"
summary: "通过捆绑的可选 admin-http-rpc 插件将选定的 Gateway 控制平面方法暴露为 HTTP 接口"
read_when:
  - 构建无法使用 Gateway WebSocket RPC 客户端的主机工具时
  - 在私有受信任入口后面暴露 Gateway 管理自动化时
  - 审计对 Gateway 方法 HTTP 访问的安全模型时
title: "Admin HTTP RPC plugin"
---

捆绑的 `admin-http-rpc` 插件通过 HTTP 暴露选定的 Gateway 控制平面方法，供无法使用正常 Gateway WebSocket RPC 客户端的受信任主机自动化使用。

该插件随 OpenClaw 一同提供，但默认关闭。禁用时，路由不会被注册。启用后，它会添加：

- `POST /api/v1/admin/rpc`
- 与 Gateway 相同的监听器：`http://<gateway-host>:<port>/api/v1/admin/rpc`

仅在私有主机工具、tailnet 自动化或受信任内部入口时启用。不要将此路由直接暴露到公共互联网。

## 启用前须知

Admin HTTP RPC 是完整的操作者控制平面界面。任何通过 Gateway HTTP 认证的调用方均可调用本页上列入白名单的方法。

仅在以下所有条件均满足时使用：

- 调用方被信任可操作 Gateway。
- 调用方无法使用 WebSocket RPC 客户端。
- 路由仅在回环地址、tailnet 或私有认证入口上可达。
- 你已审查允许的方法，且它们与你计划运行的自动化相匹配。

对于能保持 Gateway WebSocket 连接开放的 OpenClaw 客户端和交互式工具，请使用 WebSocket RPC 路径。

## 启用

启用捆绑插件：

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

路由在插件启动期间注册。更改插件配置后重启 Gateway。

不再需要 HTTP 界面时禁用：

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## 验证路由

使用 `health` 作为最小安全请求：

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

成功响应包含 `ok: true`：

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

插件禁用时，路由返回 `404`，因为它未被注册。

## 认证

插件路由使用 Gateway HTTP 认证。

常见认证路径：

- 共享密钥认证（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
- 受信任的携带身份 HTTP 认证（`gateway.auth.mode="trusted-proxy"`）：通过已配置的身份感知代理路由，让其注入所需的身份请求头
- 私有入口开放认证（`gateway.auth.mode="none"`）：不需要认证头

## 安全模型

将此插件视为完整的 Gateway 操作者界面。

- 启用该插件有意在 `/api/v1/admin/rpc` 提供对白名单管理 RPC 方法的访问。
- 该插件声明了保留的 `contracts.gatewayMethodDispatch: ["authenticated-request"]` Manifest 合约，以便其经过 Gateway 认证的 HTTP 路由可以在进程内分发控制平面方法。
- 共享密钥 Bearer 认证证明持有 Gateway 操作者密钥。
- 对于 `token` 和 `password` 认证，较窄的 `x-openclaw-scopes` 请求头被忽略，恢复正常的完整操作者默认值。
- 受信任的携带身份 HTTP 模式会在存在 `x-openclaw-scopes` 时遵守它。
- `gateway.auth.mode="none"` 意味着如果插件被启用，此路由为未认证状态。仅在你完全信任的私有入口后面使用。
- 请求通过与 WebSocket RPC 相同的 Gateway 方法处理器和范围检查进行分发（插件路由认证通过后）。
- 保持此路由在回环地址、tailnet 或私有受信任入口上。不要直接暴露到公共互联网。
- 插件 Manifest 合约不是沙箱。它们防止意外使用保留的 SDK 辅助函数；受信任的插件仍在 Gateway 进程中运行。

当调用方跨越信任边界时，请使用独立的 Gateway。

## 请求

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

字段：

- `id`（字符串，可选）：复制到响应中。省略时生成 UUID。
- `method`（字符串，必填）：允许的 Gateway 方法名称。
- `params`（任意，可选）：方法特定参数。

默认最大请求体大小为 1 MB。

## 响应

成功响应使用 Gateway RPC 格式：

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Gateway 方法错误使用：

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

HTTP 状态在可能时遵循 Gateway 错误。例如，`INVALID_REQUEST` 返回 `400`，`UNAVAILABLE` 返回 `503`。

## 允许的方法

- discovery：`commands.list`
  返回此插件允许的 HTTP RPC 方法名称。
- gateway：`health`、`status`、`logs.tail`、`usage.status`、`usage.cost`、`gateway.restart.request`
- config：`config.get`、`config.schema`、`config.schema.lookup`、`config.set`、`config.patch`、`config.apply`
- channels：`channels.status`、`channels.start`、`channels.stop`、`channels.logout`
- models：`models.list`、`models.authStatus`
- agents：`agents.list`、`agents.create`、`agents.update`、`agents.delete`
- approvals：`exec.approvals.get`、`exec.approvals.set`、`exec.approvals.node.get`、`exec.approvals.node.set`
- cron：`cron.status`、`cron.list`、`cron.get`、`cron.runs`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`
- devices：`device.pair.list`、`device.pair.approve`、`device.pair.reject`、`device.pair.remove`
- nodes：`node.list`、`node.describe`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove`、`node.rename`
- tasks：`tasks.list`、`tasks.get`、`tasks.cancel`
- diagnostics：`doctor.memory.status`、`update.status`

其他 Gateway 方法在有意添加之前被阻止。

## 与 WebSocket 的对比

正常的 Gateway WebSocket RPC 路径仍然是 OpenClaw 客户端的首选控制平面 API。仅对需要请求/响应 HTTP 界面的主机工具使用 admin HTTP RPC。

没有受信任设备身份的共享 Token WebSocket 客户端无法在连接时自行声明管理员范围。Admin HTTP RPC 有意遵循现有的受信任 HTTP 操作者模型：插件启用时，共享密钥 Bearer 认证被视为此管理界面的完整操作者访问权限。

## 故障排除

`404 Not Found`

: 插件已禁用、Gateway 在启用后未重启，或请求发送到了不同的 Gateway 进程。

`401 Unauthorized`

: 请求未满足 Gateway HTTP 认证。检查 Bearer Token 或受信任代理身份请求头。

`400 INVALID_REQUEST`

: 请求体不是有效的 JSON，`method` 字段缺失，或方法不在插件白名单中。

`503 UNAVAILABLE`

: Gateway 方法处理器不可用。检查 Gateway 日志，并在 Gateway 完成启动后重试。

## 相关

- [操作者范围](/gateway/operator-scopes)
- [Gateway 安全](/gateway/security)
- [远程访问](/gateway/remote)
- [插件 Manifest](/plugins/manifest#contracts)
- [SDK 子路径](/plugins/sdk-subpaths)
