---
mmh3_hash: "6794beffabe92f6c4da4f969d9d220c3"
summary: "Webhooks Plugin：用于受信任外部自动化的经过身份验证的 TaskFlow 入口"
read_when:
  - 您想从外部系统触发或驱动 TaskFlow
  - 您正在配置捆绑的 webhooks Plugin
title: "Webhooks Plugin"
---

# Webhooks（Plugin）

Webhooks Plugin 添加经过身份验证的 HTTP 路由，将外部自动化绑定到 OpenClaw TaskFlow。

当您希望受信任的系统（如 Zapier、n8n、CI 作业或内部服务）在不首先编写自定义 Plugin 的情况下创建和驱动托管 TaskFlow 时使用它。

## 运行位置

Webhooks Plugin 在 Gateway 进程内运行。

如果您的 Gateway 在另一台机器上运行，请在该 Gateway 主机上安装和配置 Plugin，然后重启 Gateway。

## 配置路由

在 `plugins.entries.webhooks.config` 下设置配置：

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

路由字段：

- `enabled`：可选，默认为 `true`
- `path`：可选，默认为 `/plugins/webhooks/<routeId>`
- `sessionKey`：拥有绑定 TaskFlow 的必需 Session
- `secret`：必需的共享密钥或 SecretRef
- `controllerId`：为创建的托管流程的可选控制器 ID
- `description`：可选的操作员说明

支持的 `secret` 输入：

- 纯字符串
- 带有 `source: "env" | "file" | "exec"` 的 SecretRef

如果密钥支持的路由在启动时无法解析其密钥，Plugin 会跳过该路由并记录警告，而不是公开损坏的端点。

## 安全模型

每个路由都受信任，以其配置的 `sessionKey` 的 TaskFlow 权限进行操作。

这意味着路由可以检查和改变该 Session 拥有的 TaskFlow，因此您应该：

- 每个路由使用强唯一密钥
- 优先使用密钥引用而不是内联纯文本密钥
- 将路由绑定到适合工作流的最窄 Session
- 只公开您需要的特定 Webhook 路径

Plugin 应用：

- 共享密钥认证
- 请求正文大小和超时守卫
- 固定窗口速率限制
- 飞行中请求限制
- 通过 `api.runtime.taskFlow.bindSession(...)` 的所有者绑定 TaskFlow 访问

## 请求格式

发送带有以下内容的 `POST` 请求：

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` 或 `x-openclaw-webhook-secret: <secret>`

示例：

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## 支持的操作

Plugin 目前接受以下 JSON `action` 值：

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

为路由的绑定 Session 创建托管 TaskFlow。

示例：

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

在现有托管 TaskFlow 内创建托管子任务。

允许的运行时为：

- `subagent`
- `acp`

示例：

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## 响应形状

成功的响应返回：

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

被拒绝的请求返回：

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin 有意从 Webhook 响应中清除所有者/Session 元数据。

## 相关文档

- [Plugin 运行时 SDK](/plugins/sdk-runtime)
- [Hooks 和 webhooks 概述](/automation/hooks)
- [CLI webhooks](/cli/webhooks)
