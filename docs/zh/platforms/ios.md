---
mmh3_hash: "1dcca59f4d5d52d824d0a21325904a67"
title: "iOS 应用 (节点)"
summary: "iOS 节点应用：连接到 Gateway、配对、canvas 和故障排除"
read_when:
  - 配对或重新连接 iOS 节点
  - 从源代码运行 iOS 应用
  - 调试 gateway 发现或 canvas 命令
---

可用性：内部预览。iOS 应用尚未公开分发。

## 功能

- 通过 WebSocket（局域网或 tailnet）连接到 Gateway。
- 暴露节点能力：Canvas、屏幕快照、摄像头捕获、位置、对话模式、语音唤醒。
- 接收 `node.invoke` 命令并报告节点状态事件。

## 要求

- Gateway 运行在另一台设备上（macOS、Linux 或 Windows 通过 WSL2）。
- 网络路径：
  - 同一局域网通过 Bonjour，**或**
  - 通过 unicast DNS-SD 连接 Tailnet（示例域：`openclaw.internal.`），**或**
  - 手动主机/端口（备用）。

## 快速入门（配对 + 连接）

1. 启动 Gateway：

```bash
openclaw gateway --port 18789
```

2. 在 iOS 应用中，打开 Settings 并选择发现的 gateway（或启用 Manual Host 并输入主机/端口）。

3. 在 gateway 主机上批准配对请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果应用使用更改的 auth 详情（角色/作用域/公钥）重试配对，之前的待处理请求将被取代，并创建新的 `requestId`。
在批准之前重新运行 `openclaw devices list`。

可选：如果 iOS 节点始终从严格控制的子网连接，你可以使用明确的 CIDR 或精确 IP 选择首次节点自动批准：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

默认禁用。仅适用于没有请求作用域的全新 `role: node` 配对。Operator/browser 配对以及任何角色、作用域、元数据或公钥更改仍然需要手动批准。

4. 验证连接：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方构建的中继推送

官方分发的 iOS 构建使用外部推送中继，而不是将原始 APNs token 发布到 gateway。

Gateway 端要求：

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

流程如何工作：

- iOS 应用使用 App Attest 和 StoreKit 应用交易 JWS 向 relay 注册。
- 中继返回一个不透明的中继句柄加上一个注册范围的发送授权。
- iOS 应用获取配对的 gateway 身份并将其包含在中继注册中，因此中继支持的注册被委托给该特定 gateway。
- 应用使用 `push.apns.register` 将中继支持的注册转发给配对的 gateway。
- gateway 使用该存储的中继句柄进行 `push.test`、后台唤醒和唤醒推送。
- gateway 中继 base URL 必须与官方/TestFlight iOS 构建中内置的中继 URL 匹配。
- 如果应用后来连接到不同的 gateway 或具有不同中继 base URL 的构建，它会刷新中继注册而不是重用旧绑定。

这条路径 gateway **不需要**：

- 不需要全局部署的中继 token。
- 不需要官方/TestFlight 中继支持的发送的直接 APNs 密钥。

预期运营商流程：

1. 安装官方/TestFlight iOS 构建。
2. 在 gateway 上设置 `gateway.push.apns.relay.baseUrl`。
3. 将应用配对到 gateway 并让其完成连接。
4. 应用在拥有 APNs token、运营商 session 已连接且中继注册成功后自动发布 `push.apns.register`。
5. 之后，`push.test`、重连唤醒和唤醒推送可以使用存储的中继支持注册。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍然作为 gateway 的临时 env 覆盖有效。

## 后台在线信标

当 iOS 唤醒应用进行静默推送、后台刷新或重大位置事件时，应用会尝试短暂的节点重连，然后调用 `node.event`，传入 `event: "node.presence.alive"`。只有在已知认证节点设备身份后，gateway 才会将此记录为配对节点/设备元数据上的 `lastSeenAtMs`/`lastSeenReason`。

只有当 gateway 响应包含 `handled: true` 时，应用才将后台唤醒视为已成功记录。旧版 gateway 可能以 `{ "ok": true }` 确认 `node.event`；该响应兼容，但不计为持久的最后在线更新。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍然作为 gateway 的临时环境覆盖有效。

## 认证和信任流程

relay 的存在是为了强制执行直接 gateway 上的 APNs 无法为官方 iOS 构建提供的两个约束：

- 只有通过 Apple 分发的正版 OpenClaw iOS 构建才能使用托管中继。
- Gateway 只能为与该特定 gateway 配对的 iOS 设备发送中继支持的推送。

逐步说明：

1. `iOS 应用 -> gateway`
   - 应用首先通过正常的 Gateway auth 流程与 gateway 配对。
   - 这给应用一个已认证的节点 session 加上一个已认证的运营商 session。
   - 运营商 session 用于调用 `gateway.identity.get`。

2. `iOS 应用 -> 中继`
   - 应用通过 HTTPS 调用中继注册端点。
   - 注册包含 App Attest 证明加应用收据。
   - relay 验证 bundle ID、App Attest 证明和 Apple 分发证明，并要求官方/生产分发路径。
   - 这就是阻止本地 Xcode/dev 构建使用托管 relay 的原因。本地构建可能已签名，但不满足 relay 期望的官方 Apple 分发证明。

3. `gateway 身份委托`
   - 在中继注册之前，应用从 `gateway.identity.get` 获取配对的 gateway 身份。
   - 应用将该 gateway 身份包含在中继注册有效载荷中。
   - 中继返回一个中继句柄和一个委托给该 gateway 身份的注册范围发送授权。

4. `gateway -> 中继`
   - gateway 存储来自 `push.apns.register` 的中继句柄和发送授权。
   - 在 `push.test`、重连唤醒和唤醒推送时，gateway 用其自己的设备身份签署发送请求。
   - 中继根据注册中委托的 gateway 身份验证存储的发送授权和 gateway 签名。
   - 另一个 gateway 不能重用该存储的注册，即使它以某种方式获得了句柄。

5. `中继 -> APNs`
   - 中继拥有官方构建的生产 APNs 凭据和原始 APNs token。
   - gateway 不会为中继支持的官方构建存储原始 APNs token。
   - 中继代表配对的 gateway 向 APNs 发送最终推送。

为什么创建这种设计：

- 使生产 APNs 凭据不进入用户 gateways。
- 避免在 gateway 上存储原始官方构建 APNs tokens。
- 只允许官方/TestFlight OpenClaw 构建使用托管中继。
- 防止一个 gateway 向属于不同 gateway 的 iOS 设备发送唤醒推送。

本地/手动构建保留直接 APNs。如果你在没有中继的情况下测试这些构建，gateway 仍然需要直接 APNs 凭据：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

这些是 gateway 主机运行时 env 变量，而不是 Fastlane 设置。`apps/ios/fastlane/.env` 只存储 App Store Connect / TestFlight 身份验证，例如 `ASC_KEY_ID` 和 `ASC_ISSUER_ID`；它不配置本地 iOS 构建的直接 APNs 传递。

推荐的 gateway 主机存储：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

不要提交 `.p8` 文件或将其放在仓库检出目录下。

## 发现路径

### Bonjour（局域网）

iOS 应用在 `local.` 上浏览 `_openclaw-gw._tcp`，配置时还会浏览相同的广域 DNS-SD 发现域。同一局域网的 gateways 从 `local.` 自动出现；跨网络发现可以使用配置的广域域，而无需更改 beacon 类型。

### Tailnet（跨网络）

如果 mDNS 被阻止，使用 unicast DNS-SD 区域（选择一个域名；示例：`openclaw.internal.`）和 Tailscale 分割 DNS。
参见 [Bonjour](/gateway/bonjour) 了解 CoreDNS 示例。

### 手动主机/端口

在 Settings 中，启用 **Manual Host** 并输入 gateway 主机 + 端口（默认 `18789`）。

## Canvas + A2UI

iOS 节点渲染 WKWebView canvas。使用 `node.invoke` 驱动它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

说明：

- Gateway canvas host 服务 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它从 Gateway HTTP 服务器（与 `gateway.port` 相同端口，默认 `18789`）提供服务。
- iOS 节点在连接时广告 canvas host URL 时自动导航到 A2UI。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回内置脚手架。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 与 Computer Use 的关系

iOS 应用是移动节点界面，不是 Codex Computer Use 后端。Codex
Computer Use 和 `cua-driver mcp` 通过 MCP 工具控制本地 macOS 桌面；iOS 应用通过 OpenClaw 节点命令（如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`）提供 iPhone 功能。

Agent 仍然可以通过 OpenClaw 调用节点命令来操作 iOS 应用，但这些调用通过 gateway 节点协议，并遵循 iOS 前台/后台限制。使用 [Codex Computer Use](/plugins/codex-computer-use) 进行本地桌面控制，本页用于 iOS 节点功能。

## Voice wake + talk 模式

- Voice wake 和 talk 模式在设置中可用。
- 具有 talk 能力的 iOS 节点会广播 `talk` 能力，并可以声明 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；Gateway 默认允许受信任的具有 Talk 能力的节点使用这些按下说话命令。
- iOS 可能会挂起后台音频；当应用不活跃时，将语音功能视为尽力而为。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`：将 iOS 应用切换到前台（canvas/摄像头/屏幕命令需要前台）。
- `A2UI_HOST_NOT_CONFIGURED`：Gateway 未广播 Canvas plugin 界面 URL；检查 [Gateway 配置](/gateway/configuration) 中的 `plugins.entries.canvas.config.host`。
- 配对提示从未出现：运行 `openclaw devices list` 并手动批准。
- 重装后重连失败：Keychain 配对 token 已清除；重新配对节点。

## 相关文档

- [配对](/channels/pairing)
- [发现](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
