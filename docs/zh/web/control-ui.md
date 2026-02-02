---
title: "Control UI (浏览器)"
sidebarTitle: "Control UI"
mmh3_hash: "a27f4f6edb45247f49ec642e0d90c3d2"
summary: "Gateway 的基于浏览器的 Control UI(聊天、节点、配置)"
read_when: ["您想从浏览器操作 Gateway","您想要无需 SSH 隧道的 Tailnet 访问"]
---
# Control UI (浏览器)

Control UI 是 Gateway 提供的小型 **Vite + Lit** 单页应用:

- 默认: `http://<host>:18789/`
- 可选前缀: 设置 `gateway.controlUi.basePath`(例如 `/openclaw`)

它在同一端口上**直接与 Gateway WebSocket** 通信。

## 快速打开(本地)

如果 Gateway 在同一台计算机上运行,打开:

- http://127.0.0.1:18789/(或 http://localhost:18789/)

如果页面加载失败,首先启动 Gateway: `openclaw gateway`。

身份验证通过以下方式在 WebSocket 握手期间提供:

- `connect.params.auth.token`
- `connect.params.auth.password`
  Dashboard 设置面板允许您存储令牌;密码不会持久化。
  引导向导默认生成 Gateway 令牌,因此在首次连接时在此处粘贴它。

## 设备配对(首次连接)

当您从新浏览器或设备连接到 Control UI 时,Gateway
需要**一次性配对批准** — 即使您在同一 Tailnet 上
并设置了 `gateway.auth.allowTailscale: true`。这是一项安全措施,用于防止
未经授权的访问。

**您将看到:** "disconnected (1008): pairing required"

**批准设备:**

```bash
# 列出待处理的请求
openclaw devices list

# 通过请求 ID 批准
openclaw devices approve <requestId>
```

一旦批准,设备将被记住,不需要重新批准,除非
您使用 `openclaw devices revoke --device <id> --role <role>` 撤销它。请参见
[Devices CLI](/cli/devices) 了解令牌轮换和撤销。

**注意:**

- 本地连接(`127.0.0.1`)会自动批准。
- 远程连接(LAN、Tailnet 等)需要明确批准。
- 每个浏览器配置文件生成唯一的设备 ID,因此切换浏览器或
  清除浏览器数据将需要重新配对。

## 它能做什么(今天)

- 通过 Gateway WS 与模型聊天(`chat.history`、`chat.send`、`chat.abort`、`chat.inject`)
- 在 Chat 中流式传输工具调用 + 实时工具输出卡(代理事件)
- 通道: WhatsApp/Telegram/Discord/Slack + 插件通道(Mattermost 等)状态 + QR 登录 + 每通道配置(`channels.status`、`web.login.*`、`config.patch`)
- 实例: 在线状态列表 + 刷新(`system-presence`)
- 会话: 列表 + 每会话思考/详细覆盖(`sessions.list`、`sessions.patch`)
- Cron 作业: 列表/添加/运行/启用/禁用 + 运行历史(`cron.*`)
- 技能: 状态、启用/禁用、安装、API 密钥更新(`skills.*`)
- 节点: 列表 + 能力(`node.list`)
- Exec 批准: 为 `exec host=gateway/node` 编辑 Gateway 或节点允许列表 + 询问策略(`exec.approvals.*`)
- 配置: 查看/编辑 `~/.openclaw/openclaw.json`(`config.get`、`config.set`)
- 配置: 使用验证应用 + 重启(`config.apply`)并唤醒最后活动的会话
- 配置写入包括基础哈希保护以防止覆盖并发编辑
- 配置架构 + 表单呈现(`config.schema`,包括插件 + 通道架构);原始 JSON 编辑器仍然可用
- 调试: 状态/健康/模型快照 + 事件日志 + 手动 RPC 调用(`status`、`health`、`models.list`)
- 日志: Gateway 文件日志的实时尾随,带过滤/导出(`logs.tail`)
- 更新: 运行包/git 更新 + 重启(`update.run`)并带有重启报告

## Chat 行为

- `chat.send` 是**非阻塞的**: 它立即确认 `{ runId, status: "started" }`,响应通过 `chat` 事件流式传输。
- 使用相同的 `idempotencyKey` 重新发送在运行时返回 `{ status: "in_flight" }`,完成后返回 `{ status: "ok" }`。
- `chat.inject` 将助手注释附加到会话转录并广播 `chat` 事件以进行仅 UI 更新(无代理运行,无通道传递)。
- 停止:
  - 点击 **Stop**(调用 `chat.abort`)
  - 输入 `/stop`(或 `stop|esc|abort|wait|exit|interrupt`)以带外中止
  - `chat.abort` 支持 `{ sessionKey }`(无 `runId`)以中止该会话的所有活动运行

## Tailnet 访问(推荐)

### 集成 Tailscale Serve(首选)

将 Gateway 保持在环回上,让 Tailscale Serve 使用 HTTPS 代理它:

```bash
openclaw gateway --tailscale serve
```

打开:

- `https://<magicdns>/`(或您配置的 `gateway.controlUi.basePath`)

默认情况下,当 `gateway.auth.allowTailscale` 为 `true` 时,Serve 请求可以通过 Tailscale 身份标头(`tailscale-user-login`)进行身份验证。OpenClaw 通过使用 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与标头匹配来验证身份,并且仅在请求使用 Tailscale 的 `x-forwarded-*` 标头命中环回时才接受这些。如果您想即使对于 Serve 流量也要求令牌/密码,请设置 `gateway.auth.allowTailscale: false`(或强制 `gateway.auth.mode: "password"`)。

### 绑定到 tailnet + 令牌

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

然后打开:

- `http://<tailscale-ip>:18789/`(或您配置的 `gateway.controlUi.basePath`)

将令牌粘贴到 UI 设置中(作为 `connect.params.auth.token` 发送)。

## 不安全的 HTTP

如果您通过纯 HTTP(`http://<lan-ip>` 或 `http://<tailscale-ip>`)打开 Dashboard,浏览器在**非安全上下文**中运行并阻止 WebCrypto。默认情况下,OpenClaw **阻止**没有设备身份的 Control UI 连接。

**推荐修复:** 使用 HTTPS(Tailscale Serve)或在本地打开 UI:

- `https://<magicdns>/`(Serve)
- `http://127.0.0.1:18789/`(在 Gateway 主机上)

**降级示例(仅通过 HTTP 的令牌):**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

这会禁用 Control UI 的设备身份 + 配对(即使在 HTTPS 上)。仅在您信任网络时使用。

有关 HTTPS 设置指导,请参见 [Tailscale](/gateway/tailscale)。

## 构建 UI

Gateway 从 `dist/control-ui` 提供静态文件。使用以下命令构建它们:

```bash
pnpm ui:build # 首次运行时自动安装 UI 依赖项
```

可选绝对基础(当您想要固定资产 URL 时):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

对于本地开发(单独的开发服务器):

```bash
pnpm ui:dev # 首次运行时自动安装 UI 依赖项
```

然后将 UI 指向您的 Gateway WS URL(例如 `ws://127.0.0.1:18789`)。

## 调试/测试: 开发服务器 + 远程 Gateway

Control UI 是静态文件;WebSocket 目标是可配置的,可以与 HTTP 源不同。当您想要本地 Vite 开发服务器但 Gateway 在其他地方运行时,这很方便。

1. 启动 UI 开发服务器: `pnpm ui:dev`
2. 打开类似以下的 URL:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

可选的一次性身份验证(如果需要):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789&token=<gateway-token>
```

注意事项:

- `gatewayUrl` 在加载后存储在 localStorage 中并从 URL 中删除。
- `token` 存储在 localStorage 中;`password` 仅保留在内存中。
- 当 Gateway 在 TLS 后面(Tailscale Serve、HTTPS 代理等)时使用 `wss://`。

远程访问设置详细信息: [远程访问](/gateway/remote)。
