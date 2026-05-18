---
mmh3_hash: "4d71996269b3cc1bb4eca3f1e69da400"
summary: "Google Chat 应用支持状态、功能和配置"
read_when:
  - 使用 Google Chat Channel 功能时
title: "Google Chat"
---

状态：通过 Google Chat API Webhook（仅 HTTP）的私信 + 群组空间可下载 Plugin。

## 安装

安装 Google Chat 后再配置 Channel：

```bash
openclaw plugins install @openclaw/googlechat
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## 快速设置（初学者）

1. 创建 Google Cloud 项目并启用 **Google Chat API**。
   - 前往：[Google Chat API 凭据](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - 如果尚未启用 API，请启用它。
2. 创建**服务账户**：
   - 点击**创建凭据** > **服务账户**。
   - 起一个名称（例如 `openclaw-chat`）。
   - 权限留空（点击**继续**）。
   - 主体访问留空（点击**完成**）。
3. 创建并下载 **JSON 密钥**：
   - 在服务账户列表中，点击刚创建的账户。
   - 进入**密钥**选项卡。
   - 点击**添加密钥** > **创建新密钥**。
   - 选择 **JSON** 并点击**创建**。
4. 将下载的 JSON 文件存储在 Gateway 主机上（例如 `~/.openclaw/googlechat-service-account.json`）。
5. 在 [Google Cloud Console 聊天配置](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat)中创建 Google Chat 应用：
   - 填写**应用信息**：
     - **应用名称**：（例如 `OpenClaw`）
     - **头像 URL**：（例如 `https://openclaw.ai/logo.png`）
     - **描述**：（例如 `Personal AI Assistant`）
   - 启用**互动功能**。
   - 在**功能**下，勾选**加入群组和群聊**。
   - 在**连接设置**下，选择 **HTTP 端点 URL**。
   - 在**触发器**下，选择**为所有触发器使用通用 HTTP 端点 URL**，并将其设置为您的 Gateway 公共 URL 后面加 `/googlechat`。
     - _提示：运行 `openclaw status` 查找 Gateway 的公共 URL。_
   - 在**可见性**下，勾选**使此 Chat 应用对 `<您的域>` 中的特定用户和群组可用**。
   - 在文本框中输入您的电子邮件地址（例如 `user@example.com`）。
   - 点击底部的**保存**。
6. **启用应用状态**：
   - 保存后，**刷新页面**。
   - 查找**应用状态**部分（通常在保存后顶部或底部附近）。
   - 将状态更改为**已上线 - 对用户可用**。
   - 再次点击**保存**。
7. 使用服务账户路径 + Webhook 受众配置 OpenClaw：
   - 环境变量：`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - 或配置：`channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8. 设置 Webhook 受众类型 + 值（与您的 Chat 应用配置匹配）。
9. 启动 Gateway。Google Chat 将向您的 Webhook 路径发送 POST 请求。

## 添加到 Google Chat

Gateway 运行且您的电子邮件已添加到可见性列表后：

1. 前往 [Google Chat](https://chat.google.com/)。
2. 点击**直接消息**旁边的 **+**（加号）图标。
3. 在搜索栏中（通常用于添加联系人的地方），输入您在 Google Cloud Console 中配置的**应用名称**。
   - **注意**：机器人不会出现在"市场"浏览列表中，因为它是私有应用。您必须按名称搜索。
4. 从结果中选择您的机器人。
5. 点击**添加**或**聊天**以开始 1:1 对话。
6. 发送"Hello"以触发助手！

## 公共 URL（仅 Webhook）

Google Chat Webhook 需要公共 HTTPS 端点。出于安全考虑，**只将 `/googlechat` 路径**暴露到互联网。将 OpenClaw 控制台和其他敏感端点保留在私有网络中。

### 选项 A：Tailscale Funnel（推荐）

使用 Tailscale Serve 作为私有控制台，Funnel 用于公共 Webhook 路径。这样可以将 `/` 保持私有，同时仅暴露 `/googlechat`。

1. **检查 Gateway 绑定地址：**

   ```bash
   ss -tlnp | grep 18789
   ```

   注意 IP 地址（例如 `127.0.0.1`、`0.0.0.0` 或您的 Tailscale IP，如 `100.x.x.x`）。

2. **仅将控制台暴露到 Tailnet（端口 8443）：**

   ```bash
   # 如果绑定到 localhost（127.0.0.1 或 0.0.0.0）：
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # 如果仅绑定到 Tailscale IP（例如 100.106.161.80）：
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **仅公开暴露 Webhook 路径：**

   ```bash
   # 如果绑定到 localhost（127.0.0.1 或 0.0.0.0）：
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # 如果仅绑定到 Tailscale IP（例如 100.106.161.80）：
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **授权节点进行 Funnel 访问：**
   如有提示，请访问输出中显示的授权 URL，以便在 Tailnet 策略中启用此节点的 Funnel。

5. **验证配置：**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

您的公共 Webhook URL 将是：
`https://<node-name>.<tailnet>.ts.net/googlechat`

您的私有控制台仅在 Tailnet 内可访问：
`https://<node-name>.<tailnet>.ts.net:8443/`

在 Google Chat 应用配置中使用公共 URL（不带 `:8443`）。

> 注意：此配置在重启后持久有效。若要稍后删除，运行 `tailscale funnel reset` 和 `tailscale serve reset`。

### 选项 B：反向代理（Caddy）

如果您使用 Caddy 等反向代理，只代理特定路径：

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

使用此配置，对 `your-domain.com/` 的任何请求将被忽略或返回 404，而 `your-domain.com/googlechat` 则安全地路由到 OpenClaw。

### 选项 C：Cloudflare Tunnel

将隧道的入口规则配置为仅路由 Webhook 路径：

- **路径**：`/googlechat` -> `http://localhost:18789/googlechat`
- **默认规则**：HTTP 404（未找到）

## 工作原理

1. Google Chat 向 Gateway 发送 Webhook POST 请求。每个请求包含 `Authorization: Bearer <token>` 请求头。
   - 当请求头存在时，OpenClaw 在读取/解析完整 Webhook 正文之前验证 Bearer 认证。
   - 正文中携带 `authorizationEventObject.systemIdToken` 的 Google Workspace Add-on 请求通过更严格的预认证正文预算支持。
2. OpenClaw 根据配置的 `audienceType` + `audience` 验证令牌：
   - `audienceType: "app-url"` → 受众是您的 HTTPS Webhook URL。
   - `audienceType: "project-number"` → 受众是 Cloud 项目编号。
3. 消息按空间路由：
   - 私信使用会话键 `agent:<agentId>:googlechat:direct:<spaceId>`。
   - 群组空间使用会话键 `agent:<agentId>:googlechat:group:<spaceId>`。
4. 私信访问默认为配对模式。未知发送者收到配对码；使用以下命令批准：
   - `openclaw pairing approve googlechat <code>`
5. 群组空间默认需要 @提及。如果提及检测需要应用的用户名，请使用 `botUser`。

## 目标标识符

用于传递和 allowlist 的标识符：

- 直接消息：`users/<userId>`（推荐）。
- 原始电子邮件 `name@example.com` 是可变的，仅在 `channels.googlechat.dangerouslyAllowNameMatching: true` 时用于直接 allowlist 匹配。
- 已弃用：`users/<email>` 被视为用户 ID，而非电子邮件 allowlist。
- 群组空间：`spaces/<spaceId>`。

## 配置要点

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // 或 serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // 可选；有助于提及检测
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

注意：

- 服务账户凭据也可以通过 `serviceAccount`（JSON 字符串）内联传递。
- 也支持 `serviceAccountRef`（环境变量/文件 SecretRef），包括 `channels.googlechat.accounts.<id>.serviceAccountRef` 下的每账户引用。
- 如果未设置 `webhookPath`，默认 Webhook 路径为 `/googlechat`。
- `dangerouslyAllowNameMatching` 重新启用可变的电子邮件主体匹配用于 allowlist（兼容性紧急模式）。
- 在 `actions.reactions` 启用时，Reaction 可通过 `reactions` 工具和 `channels action` 使用。
- 消息操作公开 `send` 用于文本发送，`upload-file` 用于显式附件发送。`upload-file` 接受 `media` / `filePath` / `path` 以及可选的 `message`、`filename` 和线程目标。
- `typingIndicator` 支持 `none`、`message`（默认）和 `reaction`（reaction 需要用户 OAuth）。
- 附件通过 Chat API 下载并存储在媒体管道中（大小受 `mediaMaxMb` 限制）。
- 机器人发起的 Google Chat 消息默认被忽略。如果您有意设置 `allowBots: true`，被接受的机器人消息使用共享的[机器人循环保护](/channels/bot-loop-protection)。配置 `channels.defaults.botLoopProtection`，然后在某个群组空间需要不同预算时使用 `channels.googlechat.botLoopProtection` 或 `channels.googlechat.groups.<space>.botLoopProtection` 覆盖。

密钥管理详情：[密钥管理](/gateway/secrets)。

## 故障排除

### 405 Method Not Allowed

如果 Google Cloud Logs Explorer 显示以下错误：

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

这意味着 Webhook 处理器未注册。常见原因：

1. **Channel 未配置**：配置中缺少 `channels.googlechat` 部分。使用以下命令验证：

   ```bash
   openclaw config get channels.googlechat
   ```

   如果返回"Config path not found"，请添加配置（参见[配置要点](#config-highlights)）。

2. **Plugin 未启用**：检查 Plugin 状态：

   ```bash
   openclaw plugins list | grep googlechat
   ```

   如果显示"disabled"，请在配置中添加 `plugins.entries.googlechat.enabled: true`。

3. **Gateway 未重启**：添加配置后，重启 Gateway：

   ```bash
   openclaw gateway restart
   ```

验证 Channel 是否正在运行：

```bash
openclaw channels status
# 应显示：Google Chat default: enabled, configured, ...
```

### 其他问题

- 检查 `openclaw channels status --probe` 以获取认证错误或缺少受众配置的信息。
- 如果没有消息到达，确认 Chat 应用的 Webhook URL + 事件订阅。
- 如果提及门控阻止回复，将 `botUser` 设置为应用的用户资源名称并验证 `requireMention`。
- 使用 `openclaw logs --follow` 的同时发送测试消息，以查看请求是否到达 Gateway。

相关文档：

- [Gateway 配置](/gateway/configuration)
- [Security](/gateway/security)
- [Reactions](/tools/reactions)

## 相关

- [Channel 概述](/channels) — 所有支持的 Channel
- [Pairing](/channels/pairing) — 私信认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
