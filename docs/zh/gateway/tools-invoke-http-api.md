---
mmh3_hash: "cc829164d4d44bbbfa50d2f98d7a3cf2"
summary: "通过 Gateway HTTP 端点直接调用单个工具"
read_when:
  - 在不运行完整 Agent 轮次的情况下调用工具
  - 构建需要工具策略强制执行的自动化
title: "Tools Invoke API"
---

# Tools Invoke (HTTP)

OpenClaw 的 Gateway 暴露了一个简单的 HTTP 端点，用于直接调用单个工具。它始终启用，并使用 Gateway 身份验证加工具策略。与 OpenAI 兼容的 `/v1/*` 接口一样，共享密钥 Bearer 认证被视为整个 Gateway 的受信任 Operator 访问。

- `POST /tools/invoke`
- 与 Gateway 相同的端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/tools/invoke`

默认最大有效载荷大小为 2 MB。

## 身份验证

使用 Gateway 身份验证配置。

常见 HTTP 认证路径：

- 共享密钥认证（`gateway.auth.mode="token"` 或 `"password"`）：
  `Authorization: Bearer <token-or-password>`
- 受信任身份感知 HTTP 认证（`gateway.auth.mode="trusted-proxy"`）：
  通过配置的身份感知代理路由，让其注入所需的身份头
- 私有 ingress 开放认证（`gateway.auth.mode="none"`）：
  无需认证头

注意：

- 当 `gateway.auth.mode="token"` 时，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 当 `gateway.auth.mode="password"` 时，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 当 `gateway.auth.mode="trusted-proxy"` 时，HTTP 请求必须来自配置的非回环受信任代理来源；同一主机的回环代理不满足此模式。
- 如果配置了 `gateway.auth.rateLimit` 且发生太多认证失败，端点返回 `429` 和 `Retry-After`。

## 安全边界（重要）

将此端点视为 Gateway 实例的**完整 Operator 访问**接口。

- 此处的 HTTP Bearer 认证不是狭义的按用户范围模型。
- 此端点有效的 Gateway token/password 应被视为 owner/operator 凭证。
- 对于共享密钥认证模式（`token` 和 `password`），即使调用者发送了更窄的 `x-openclaw-scopes` 头，端点也会恢复正常的完整 Operator 默认值。
- 共享密钥认证还将此端点上的直接工具调用视为 owner-sender 轮次。
- 受信任身份感知 HTTP 模式（例如 trusted proxy 认证或私有 ingress 上的 `gateway.auth.mode="none"`）在存在 `x-openclaw-scopes` 时遵循它，否则回退到正常 Operator 默认范围集。
- 仅在回环/tailnet/私有 ingress 上保留此端点；不要将其直接暴露到公共互联网。

认证矩阵：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 证明持有共享 Gateway Operator 密钥
  - 忽略更窄的 `x-openclaw-scopes`
  - 恢复完整的默认 Operator 范围集：
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - 将此端点上的直接工具调用视为 owner-sender 轮次
- 受信任身份感知 HTTP 模式（例如 trusted proxy 认证，或私有 ingress 上的 `gateway.auth.mode="none"`）
  - 认证某个外部受信任身份或部署边界
  - 当头存在时遵循 `x-openclaw-scopes`
  - 当头不存在时回退到正常 Operator 默认范围集
  - 仅当调用者明确缩小范围并省略 `operator.admin` 时才失去 owner 语义

## 请求正文

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

字段：

- `tool`（字符串，必需）：要调用的工具名称。
- `action`（字符串，可选）：如果工具架构支持 `action` 且 args 有效载荷省略了它，则映射到 args。
- `args`（对象，可选）：工具特定的参数。
- `sessionKey`（字符串，可选）：目标 Session 键。如果省略或 `"main"`，Gateway 使用配置的主 Session 键（遵守 `session.mainKey` 和默认 Agent，或全局作用域中的 `global`）。
- `dryRun`（布尔值，可选）：保留供将来使用；当前忽略。

## 策略 + 路由行为

工具可用性通过 Gateway Agent 使用的相同策略链过滤：

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 群组策略（如果 Session 键映射到群组或 Channel）
- 子 Agent 策略（当使用子 Agent Session 键调用时）

如果策略不允许工具，端点返回 **404**。

重要边界说明：

- Exec 审批是 Operator 护栏，不是此 HTTP 端点的单独授权边界。如果工具通过 Gateway 认证 + 工具策略可达，`/tools/invoke` 不会添加额外的每次调用审批提示。
- 不要与不受信任的调用者共享 Gateway Bearer 凭证。如果需要跨信任边界分隔，请运行独立的 Gateway（理想情况下是独立的 OS 用户/主机）。

Gateway HTTP 还默认应用硬拒绝列表（即使 Session 策略允许工具）：

- `exec` — 直接命令执行（RCE 接口）
- `spawn` — 任意子进程创建（RCE 接口）
- `shell` — Shell 命令执行（RCE 接口）
- `fs_write` — 主机上的任意文件修改
- `fs_delete` — 主机上的任意文件删除
- `fs_move` — 主机上的任意文件移动/重命名
- `apply_patch` — 补丁应用可重写任意文件
- `sessions_spawn` — Session 编排；远程生成 Agent 是 RCE
- `sessions_send` — 跨 Session 消息注入
- `cron` — 持久自动化控制平面
- `gateway` — Gateway 控制平面；防止通过 HTTP 重新配置
- `nodes` — 节点命令中继可以在配对主机上执行 system.run
- `whatsapp_login` — 需要终端 QR 扫描的交互式设置；在 HTTP 上挂起

您可以通过 `gateway.tools` 自定义此拒绝列表：

```json5
{
  gateway: {
    tools: {
      // 通过 HTTP /tools/invoke 阻止的额外工具
      deny: ["browser"],
      // 从默认拒绝列表中删除工具
      allow: ["gateway"],
    },
  },
}
```

为帮助群组策略解析上下文，您可以选择性地设置：

- `x-openclaw-message-channel: <channel>`（示例：`slack`、`telegram`）
- `x-openclaw-account-id: <accountId>`（当存在多个账户时）

## 响应

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }`（无效请求或工具输入错误）
- `401` → 未授权
- `429` → 认证速率受限（`Retry-After` 已设置）
- `404` → 工具不可用（未找到或未列入允许列表）
- `405` → 方法不允许
- `500` → `{ ok: false, error: { type, message } }`（意外工具执行错误；清理的消息）

## 示例

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## 相关

- [Gateway 协议](/gateway/protocol)
- [工具和插件](/tools)
