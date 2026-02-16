---
title: "Google Chat (Chat API)"
sidebarTitle: "Google Chat"
mmh3_hash: "0206b5b886cc57fadb89542f5a00732d"
summary: "Google Chat 应用支持状态、功能和配置"
read_when: ["Working on Google Chat channel features"]
---
# Google Chat (Chat API)

状态：已准备好通过 Google Chat API webhooks（仅 HTTP）支持私聊 + 空间。

## 快速设置（初学者）
1) 创建 Google Cloud 项目并启用 **Google Chat API**。
   - 前往：[Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - 如果尚未启用，请启用该 API。
2) 创建一个**服务账号**：
   - 点击**创建凭据** > **服务账号**。
   - 为其命名（例如 `openclaw-chat`）。
   - 将权限留空（点击**继续**）。
   - 将有访问权限的主体留空（点击**完成**）。
3) 创建并下载 **JSON 密钥**：
   - 在服务账号列表中，点击您刚创建的账号。
   - 转到 **Keys** 标签。
   - 点击 **Add Key** > **Create new key**。
   - 选择 **JSON** 并点击 **Create**。
4) 将下载的 JSON 文件存储在您的网关主机上（例如 `~/.openclaw/googlechat-service-account.json`）。
5) 在 [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) 中创建 Google Chat 应用：
   - 填写**应用信息**：
     - **App name**：（例如 `OpenClaw`）
     - **Avatar URL**：（例如 `https://openclaw.ai/logo.png`）
     - **Description**：（例如 `Personal AI Assistant`）
   - 启用 **Interactive features**。
   - 在 **Functionality** 下，勾选 **Join spaces and group conversations**。
   - 在 **Connection settings** 下，选择 **HTTP endpoint URL**。
   - 在 **Triggers** 下，选择 **Use a common HTTP endpoint URL for all triggers** 并将其设置为您网关的公共 URL 后跟 `/googlechat`。
     - *提示：运行 `openclaw status` 查找您网关的公共 URL。*
   - 在 **Visibility** 下，勾选 **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;**。
   - 在文本框中输入您的电子邮件地址（例如 `user@example.com`）。
   - 点击底部的 **Save**。
6) **启用应用状态**：
   - 保存后，**刷新页面**。
   - 查找 **App status** 部分（通常在保存后的顶部或底部附近）。
   - 将状态更改为 **Live - available to users**。
   - 再次点击 **Save**。
7) 使用服务账号路径 + webhook audience 配置 OpenClaw：
   - 环境变量：`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - 或配置：`channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8) 设置 webhook audience 类型 + 值（与您的 Chat 应用配置匹配）。
9) 启动网关。Google Chat 将 POST 到您的 webhook 路径。

## 添加到 Google Chat
一旦网关运行且您的电子邮件已添加到可见性列表：
1) 前往 [Google Chat](https://chat.google.com/)。
2) 点击 **Direct Messages** 旁边的 **+**（加号）图标。
3) 在搜索栏（通常用于添加联系人的位置）中，输入您在 Google Cloud Console 中配置的**应用名称**。
   - **注意**：该机器人*不会*出现在"Marketplace"浏览列表中，因为它是私有应用。您必须按名称搜索它。
4) 从结果中选择您的机器人。
5) 点击 **Add** 或 **Chat** 开始一对一对话。
6) 发送"Hello"来触发助手！

## 公共 URL（仅 Webhook）
Google Chat webhooks 需要公共 HTTPS 端点。出于安全考虑，**仅向互联网公开 `/googlechat` 路径**。将 OpenClaw 仪表板和其他敏感端点保留在私有网络中。

### 选项 A：Tailscale Funnel（推荐）
使用 Tailscale Serve 提供私有仪表板，使用 Funnel 提供公共 webhook 路径。这样可以保持 `/` 私有，同时仅公开 `/googlechat`。

1. **检查您的网关绑定到哪个地址：**
   ```bash
   ss -tlnp | grep 18789
   ```
   记录 IP 地址（例如 `127.0.0.1`、`0.0.0.0` 或您的 Tailscale IP，如 `100.x.x.x`）。

2. **仅向 tailnet 公开仪表板（端口 8443）：**
   ```bash
   # 如果绑定到 localhost（127.0.0.1 或 0.0.0.0）：
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # 如果仅绑定到 Tailscale IP（例如 100.106.161.80）：
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **仅公开公开 webhook 路径：**
   ```bash
   # 如果绑定到 localhost（127.0.0.1 或 0.0.0.0）：
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # 如果仅绑定到 Tailscale IP（例如 100.106.161.80）：
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **授权节点访问 Funnel：**
   如果出现提示，请访问输出中显示的授权 URL，以在您的 tailnet 策略中为此节点启用 Funnel。

5. **验证配置：**
   ```bash
   tailscale serve status
   tailscale funnel status
   ```

您的公共 webhook URL 将是：
`https://<node-name>.<tailnet>.ts.net/googlechat`

您的私有仪表板仅限 tailnet：
`https://<node-name>.<tailnet>.ts.net:8443/`

在 Google Chat 应用配置中使用公共 URL（不带 `:8443`）。

> 注意：此配置在重启后保持不变。若要稍后删除，请运行 `tailscale funnel reset` 和 `tailscale serve reset`。

### 选项 B：反向代理（Caddy）
如果您使用像 Caddy 这样的反向代理，仅代理特定路径：
```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```
使用此配置，任何对 `your-domain.com/` 的请求将被忽略或返回 404，而 `your-domain.com/googlechat` 会安全地路由到 OpenClaw。

### 选项 C：Cloudflare Tunnel
配置隧道的入口规则以仅路由 webhook 路径：
- **Path**：`/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**：HTTP 404 (Not Found)

## 工作原理

1. Google Chat 向网关发送 webhook POST 请求。每个请求都包含一个 `Authorization: Bearer <token>` 头。
2. OpenClaw 根据配置的 `audienceType` + `audience` 验证 token：
   - `audienceType: "app-url"` → audience 是您的 HTTPS webhook URL。
   - `audienceType: "project-number"` → audience 是 Cloud 项目编号。
3. 消息按空间路由：
   - 私聊使用会话密钥 `agent:<agentId>:googlechat:dm:<spaceId>`。
   - 空间使用会话密钥 `agent:<agentId>:googlechat:group:<spaceId>`。
4. 私聊访问默认采用配对方式。未知发送者会收到配对代码；使用以下命令批准：
   - `openclaw pairing approve googlechat <code>`
5. 群组空间默认需要 @-提及。如果提及检测需要应用的用户名，请使用 `botUser`。

## 目标

使用这些标识符进行投递和 allowlist：

- 私聊：`users/<userId>`（推荐）或原始电子邮件 `name@example.com`（可变主体）。
- 已弃用：`users/<email>` 被视为用户 ID，而非电子邮件 allowlist。
- 空间：`spaces/<spaceId>`。

## 配置要点
```json5
{
  channels: {
    "googlechat": {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // 可选；帮助提及检测
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890", "name@example.com"]
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only."
        }
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20
    }
  }
}
```

注意：
- 服务账号凭据也可以通过 `serviceAccount`（JSON 字符串）内联传递。
- 如果未设置 `webhookPath`，默认 webhook 路径为 `/googlechat`。
- 当启用 `actions.reactions` 时，可通过 `reactions` 工具和 `channels action` 使用表情回应。
- `typingIndicator` 支持 `none`、`message`（默认）和 `reaction`（reaction 需要用户 OAuth）。
- 附件通过 Chat API 下载并存储在媒体管道中（大小受 `mediaMaxMb` 限制）。

## 故障排除

### 405 Method Not Allowed
如果 Google Cloud Logs Explorer 显示类似以下错误：
```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

这意味着 webhook 处理程序未注册。常见原因：
1. **未配置通道**：配置中缺少 `channels.googlechat` 部分。使用以下命令验证：
   ```bash
   openclaw config get channels.googlechat
   ```
   如果返回"Config path not found"，请添加配置（参见[配置要点](#配置要点)）。

2. **插件未启用**：检查插件状态：
   ```bash
   openclaw plugins list | grep googlechat
   ```
   如果显示"disabled"，请在配置中添加 `plugins.entries.googlechat.enabled: true`。

3. **网关未重启**：添加配置后，重启网关：
   ```bash
   openclaw gateway restart
   ```

验证通道是否正在运行：
```bash
openclaw channels status
# 应显示：Google Chat default: enabled, configured, ...
```

### 其他问题
- 检查 `openclaw channels status --probe` 以查找身份验证错误或缺失的 audience 配置。
- 如果没有消息到达，请确认 Chat 应用的 webhook URL + 事件订阅。
- 如果提及限制阻止回复，请将 `botUser` 设置为应用的用户资源名称并验证 `requireMention`。
- 在发送测试消息时使用 `openclaw logs --follow` 查看请求是否到达网关。

相关文档：
- [网关配置](/gateway/configuration)
- [安全性](/gateway/security)
- [表情回应](/tools/reactions)
