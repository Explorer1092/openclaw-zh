---
mmh3_hash: "339e9b6080142273a2813e2a25d8707a"
summary: "Microsoft Teams bot 支持状态、功能和配置"
read_when:
  - 开发 Microsoft Teams Channel 功能
title: "Microsoft Teams"
---

状态：支持文本 + DM 附件；Channel/群组文件发送需要 `sharePointSiteId` + Graph 权限（参见[在群聊中发送文件](#sending-files-in-group-chats)）。投票通过 Adaptive Cards 发送。消息操作提供显式 `upload-file` 用于文件优先发送。

## 内置插件

Microsoft Teams 作为内置插件随当前 OpenClaw 版本提供，正常打包的构建无需单独安装。

如果您使用的是旧版本或不包含内置 Teams 的自定义安装，请手动安装：

```bash
openclaw plugins install @openclaw/msteams
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

详情：[插件](/tools/plugin)

## 快速设置

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) 在一个命令中处理 bot 注册、manifest 创建和凭据生成。

**1. 安装并登录**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # 验证已登录并查看您的租户信息
```

<Note>
Teams CLI 目前处于预览版。命令和标志可能在版本之间发生变化。
</Note>

**2. 启动隧道**（Teams 无法访问 localhost）

如果尚未安装和认证 devtunnel CLI，请先操作（[入门指南](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# 一次性设置（跨会话持久 URL）：
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 每次开发会话：
devtunnel host my-openclaw-bot
# 您的端点：https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` 是必需的，因为 Teams 无法使用 devtunnels 进行认证。每个入站 bot 请求仍然由 Teams SDK 自动验证。
</Note>

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（但这些每次会话可能会更改 URL）。

**3. 创建应用**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

此单个命令：

- 创建 Entra ID（Azure AD）应用程序
- 生成客户端密钥
- 构建并上传 Teams 应用 manifest（含图标）
- 注册 bot（默认 Teams 管理——不需要 Azure 订阅）

输出将显示 `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID` 和 **Teams App ID**——记录这些以备后续步骤使用。它还会提议直接在 Teams 中安装应用。

**4. 配置 OpenClaw**，使用输出中的凭据：

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

或直接使用环境变量：`MSTEAMS_APP_ID`、`MSTEAMS_APP_PASSWORD`、`MSTEAMS_TENANT_ID`。

**5. 在 Teams 中安装应用**

`teams app create` 会提示您安装应用——选择"Install in Teams"。如果您跳过了，可以稍后获取链接：

```bash
teams app get <teamsAppId> --install-link
```

**6. 验证一切正常**

```bash
teams app doctor <teamsAppId>
```

这会对 bot 注册、AAD 应用配置、manifest 有效性和 SSO 设置运行诊断。

对于生产部署，考虑使用[联合认证](#federated-authentication-certificate-plus-managed-identity)（证书或托管身份）代替客户端密钥。

<Note>
群聊默认被阻止（`channels.msteams.groupPolicy: "allowlist"`）。要允许群组回复，设置 `channels.msteams.groupAllowFrom`，或使用 `groupPolicy: "open"` 允许任何成员（需要提及）。
</Note>

## 目标

- 通过 Teams DM、群聊或 Channel 与 OpenClaw 对话。
- 保持路由确定性：回复始终返回到消息到达的 Channel。
- 默认安全 Channel 行为（除非配置，否则需要提及）。

## 配置写入

默认情况下，Microsoft Teams 允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

禁用方法：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 访问控制（DM + 群组）

**DM 访问**

- 默认：`channels.msteams.dmPolicy = "pairing"`。未知发送者被忽略，直到批准。
- `channels.msteams.allowFrom` 应使用稳定的 AAD 对象 ID 或静态发送者访问组（如 `accessGroup:core-team`）。
- UPN/显示名称是可变的；直接匹配默认禁用，仅在 `channels.msteams.dangerouslyAllowNameMatching: true` 时启用。
- 当凭据允许时，向导通过 Microsoft Graph 将名称解析为 ID。

**群组访问**

- 默认：`channels.msteams.groupPolicy = "allowlist"`（阻止，除非添加 `groupAllowFrom`）。使用 `channels.defaults.groupPolicy` 在未设置时覆盖默认值。
- `channels.msteams.groupAllowFrom` 控制哪些发送者或静态发送者访问组可以在群聊/Channel 中触发（回退到 `channels.msteams.allowFrom`）。
- 设置 `groupPolicy: "open"` 以允许任何成员（仍然默认需要提及）。
- 要**不允许任何 Channel**，设置 `channels.msteams.groupPolicy: "disabled"`。

示例：

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Teams + Channel allowlist**

- 通过在 `channels.msteams.teams` 下列出团队和 Channel 来限定群组/Channel 回复的范围。
- 键应使用稳定的团队 ID 和 Channel 对话 ID。
- 当 `groupPolicy="allowlist"` 且存在团队 allowlist 时，仅接受列出的团队/Channel（需要提及）。
- 配置向导接受 `Team/Channel` 条目并为您存储它们。
- 启动时，OpenClaw 将团队/Channel 和用户 allowlist 名称解析为 ID（当 Graph 权限允许时）并记录映射；未解析的团队/Channel 名称按输入保留，但默认情况下路由时被忽略，除非启用 `channels.msteams.dangerouslyAllowNameMatching: true`。

示例：

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

<details>
<summary><strong>手动设置（不使用 Teams CLI）</strong></summary>

如果无法使用 Teams CLI，可以通过 Azure Portal 手动设置 bot。

### 工作原理

1. 确认 Microsoft Teams 插件可用（当前版本已内置）。
2. 创建一个 **Azure Bot**（App ID + secret + tenant ID）。
3. 构建一个引用 bot 并包含以下 RSC 权限的 **Teams 应用包**。
4. 将 Teams 应用上传/安装到团队（或用于 DM 的个人范围）。
5. 在 `~/.openclaw/openclaw.json` 中配置 `msteams`（或环境变量）并启动 Gateway。
6. Gateway 默认在 `/api/messages` 上监听 Bot Framework Webhook 流量。

### 步骤 1：创建 Azure Bot

1. 前往 [创建 Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填写**基础**选项卡：

   | 字段               | 值                                              |
   | ------------------ | ----------------------------------------------- |
   | **Bot handle**     | 您的 bot 名称，例如 `openclaw-msteams`（必须唯一） |
   | **Subscription**   | 选择您的 Azure 订阅                              |
   | **Resource group** | 创建新的或使用现有的                             |
   | **Pricing tier**   | **Free** 用于开发/测试                           |
   | **Type of App**    | **Single Tenant**（推荐——见下面的注意）           |
   | **Creation type**  | **Create new Microsoft App ID**                 |

<Warning>
2025-07-31 之后不再创建新的多租户 bot。新 bot 使用 **Single Tenant**。
</Warning>

3. 点击 **Review + create** → **Create**（等待约 1-2 分钟）

### 步骤 2：获取凭据

1. 前往您的 Azure Bot 资源 → **Configuration**
2. 复制 **Microsoft App ID** → 这是您的 `appId`
3. 点击 **Manage Password** → 前往应用注册
4. 在 **Certificates & secrets** 下 → **New client secret** → 复制 **Value** → 这是您的 `appPassword`
5. 前往 **Overview** → 复制 **Directory (tenant) ID** → 这是您的 `tenantId`

### 步骤 3：配置消息端点

1. 在 Azure Bot → **Configuration** 中
2. 将 **Messaging endpoint** 设置为您的 Webhook URL：
   - 生产环境：`https://your-domain.com/api/messages`
   - 本地开发：使用隧道（见[本地开发（隧道）](#local-development-tunneling)）

### 步骤 4：启用 Teams Channel

1. 在 Azure Bot → **Channels** 中
2. 点击 **Microsoft Teams** → Configure → Save
3. 接受服务条款

### 步骤 5：构建 Teams 应用 Manifest

- 包含一个 `bot` 条目，其中 `botId = <App ID>`。
- 范围：`personal`、`team`、`groupChat`。
- `supportsFiles: true`（个人范围文件处理所需）。
- 添加 RSC 权限（参见[当前 Teams RSC 权限](#current-teams-rsc-permissions-manifest)）。
- 创建图标：`outline.png`（32x32）和 `color.png`（192x192）。
- 将所有三个文件一起压缩：`manifest.json`、`outline.png`、`color.png`。

### 步骤 6：配置 OpenClaw

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

环境变量：`MSTEAMS_APP_ID`、`MSTEAMS_APP_PASSWORD`、`MSTEAMS_TENANT_ID`。

### 步骤 7：运行 Gateway

当插件已安装且存在带有凭据的 `msteams` 配置时，Teams Channel 自动启动。

</details>

## 联合认证（证书 + 托管身份）

> 2026.4.11 版本新增

对于生产部署，OpenClaw 支持**联合认证**，作为客户端密钥的更安全替代方案。提供两种方法：

### 选项 A：基于证书的认证

使用在 Entra ID 应用注册中注册的 PEM 证书。

**设置：**

1. 生成或获取证书（带私钥的 PEM 格式）。
2. 在 Entra ID → App Registration → **Certificates & secrets** → **Certificates** → 上传公共证书。

**配置：**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**环境变量：**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### 选项 B：Azure 托管身份

使用 Azure 托管身份进行无密码认证。这非常适合 Azure 基础设施上的部署（AKS、App Service、Azure VM），其中托管身份可用。

**工作原理：**

1. bot Pod/VM 具有托管身份（系统分配或用户分配）。
2. **联合身份凭据**将托管身份链接到 Entra ID 应用注册。
3. 运行时，OpenClaw 使用 `@azure/identity` 从 Azure IMDS 端点（`169.254.169.254`）获取 token。
4. token 被传递给 Teams SDK 用于 bot 认证。

**先决条件：**

- 启用了托管身份的 Azure 基础设施（AKS 工作负载身份、App Service、VM）
- 在 Entra ID 应用注册上创建的联合身份凭据
- 从 Pod/VM 访问 IMDS（`169.254.169.254:80`）的网络访问

**配置（系统分配托管身份）：**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**配置（用户分配托管身份）：**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**环境变量：**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（仅用户分配）

### AKS 工作负载身份设置

对于使用工作负载身份的 AKS 部署：

1. **在 AKS 集群上启用工作负载身份**。
2. **在 Entra ID 应用注册上创建联合身份凭据：**

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **使用应用客户端 ID 注释 Kubernetes 服务账户：**

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **为工作负载身份注入标记 Pod：**

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **确保网络访问** IMDS（`169.254.169.254`）——如果使用 NetworkPolicy，添加允许流量到 `169.254.169.254/32` 的端口 80 出口规则。

### 认证类型比较

| 方法               | 配置                                               | 优点                            | 缺点                           |
| ------------------ | -------------------------------------------------- | ------------------------------- | ------------------------------ |
| **客户端密钥**     | `appPassword`                                      | 设置简单                        | 需要密钥轮换，安全性较低       |
| **证书**           | `authType: "federated"` + `certificatePath`        | 网络上无共享密钥                | 证书管理开销                   |
| **托管身份**       | `authType: "federated"` + `useManagedIdentity`     | 无密码，无需管理密钥            | 需要 Azure 基础设施            |

**默认行为：** 当未设置 `authType` 时，OpenClaw 默认使用客户端密钥认证。现有配置无需更改即可继续使用。

## 本地开发（隧道）

Teams 无法访问 `localhost`。使用持久开发隧道确保 URL 跨会话保持一致：

```bash
# 一次性设置：
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 每次开发会话：
devtunnel host my-openclaw-bot
```

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（每次会话 URL 可能更改）。

如果您的隧道 URL 发生变化，更新端点：

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## 测试 Bot

**运行诊断：**

```bash
teams app doctor <teamsAppId>
```

一次性检查 bot 注册、AAD 应用、manifest 和 SSO 配置。

**发送测试消息：**

1. 安装 Teams 应用（使用 `teams app get <id> --install-link` 获取安装链接）
2. 在 Teams 中找到 bot 并发送 DM
3. 检查 Gateway 日志以查看传入活动

## 环境变量

所有配置键都可以通过环境变量设置：

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`（可选：`"secret"` 或 `"federated"`）
- `MSTEAMS_CERTIFICATE_PATH`（联合 + 证书）
- `MSTEAMS_CERTIFICATE_THUMBPRINT`（可选，认证不需要）
- `MSTEAMS_USE_MANAGED_IDENTITY`（联合 + 托管身份）
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（仅用户分配 MI）

## 成员信息操作

OpenClaw 为 Microsoft Teams 提供 Graph 支持的 `member-info` 操作，使 Agent 和自动化可以直接从 Microsoft Graph 解析 Channel 成员详细信息（显示名称、电子邮件、角色）。

要求：

- `Member.Read.Group` RSC 权限（已在推荐 manifest 中）
- 跨团队查找：`User.Read.All` Graph 应用程序权限加管理员同意

该操作受 `channels.msteams.actions.memberInfo` 控制（默认：当 Graph 凭据可用时启用）。

## 历史上下文

- `channels.msteams.historyLimit` 控制有多少最近的 Channel/群组消息被包装到提示中。
- 回退到 `messages.groupChat.historyLimit`。设置 `0` 禁用（默认 50）。
- 获取的话题串历史按发送者 allowlist（`allowFrom` / `groupAllowFrom`）过滤，因此话题串上下文植入仅包含来自允许发送者的消息。
- 引用附件上下文（从 Teams 回复 HTML 派生的 `ReplyTo*`）目前按接收时传递。
- 换句话说，allowlist 控制谁可以触发 Agent；今天只有特定的补充上下文路径被过滤。
- DM 历史可以用 `channels.msteams.dmHistoryLimit` 限制（用户回合）。每用户覆盖：`channels.msteams.dms["<user_id>"].historyLimit`。

## 当前 Teams RSC 权限（Manifest）

这些是我们 Teams 应用 manifest 中的**现有 resourceSpecific 权限**。它们仅适用于安装应用的团队/聊天内。

**对于 Channel（团队范围）：**

- `ChannelMessage.Read.Group`（Application）——接收所有 Channel 消息，无需 @mention
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**对于群聊：**

- `ChatMessage.Read.Chat`（Application）——接收所有群聊消息，无需 @mention

通过 Teams CLI 添加 RSC 权限：

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams Manifest 示例（已编辑）

最小、有效的示例，包含所需字段。替换 ID 和 URL。

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Manifest 注意事项（必填字段）

- `bots[].botId` **必须**匹配 Azure Bot App ID。
- `webApplicationInfo.id` **必须**匹配 Azure Bot App ID。
- `bots[].scopes` 必须包含您计划使用的表面（`personal`、`team`、`groupChat`）。
- `bots[].supportsFiles: true` 是个人范围文件处理所需的。
- `authorization.permissions.resourceSpecific` 如果您想要 Channel 流量，必须包含 Channel 读/发送。

### 更新现有应用

要更新已安装的 Teams 应用（例如，添加 RSC 权限）：

```bash
# 下载、编辑并重新上传 manifest
teams app manifest download <teamsAppId> manifest.json
# 在本地编辑 manifest.json...
teams app manifest upload manifest.json <teamsAppId>
# 如果内容更改，版本会自动递增
```

更新后，在每个团队中重新安装应用以使新权限生效，并**完全退出并重新启动 Teams**（不只是关闭窗口）以清除缓存的应用元数据。

<details>
<summary>手动 manifest 更新（不使用 CLI）</summary>

1. 使用新设置更新您的 `manifest.json`
2. **增加 `version` 字段**（例如，`1.0.0` → `1.1.0`）
3. **重新压缩** manifest 和图标（`manifest.json`、`outline.png`、`color.png`）
4. 上传新的 zip：
   - **Teams Admin Center：** Teams apps → Manage apps → 找到您的应用 → Upload new version
   - **旁加载：** 在 Teams 中 → Apps → Manage your apps → Upload a custom app

</details>

## 功能：仅 RSC vs Graph

### 仅使用 **Teams RSC**（已安装应用，无 Graph API 权限）

有效：

- 读取 Channel 消息**文本**内容。
- 发送 Channel 消息**文本**内容。
- 接收**个人（DM）**文件附件。

无效：

- Channel/群组**图像或文件内容**（有效负载仅包含 HTML 存根）。
- 下载存储在 SharePoint/OneDrive 中的附件。
- 读取消息历史（超出实时 Webhook 事件）。

### 使用 **Teams RSC + Microsoft Graph Application 权限**

添加：

- 下载托管内容（粘贴到消息中的图像）。
- 下载存储在 SharePoint/OneDrive 中的文件附件。
- 通过 Graph 读取 Channel/聊天消息历史。

### RSC vs Graph API

| 功能              | RSC 权限              | Graph API                           |
| ----------------- | --------------------- | ----------------------------------- |
| **实时消息**      | 是（通过 Webhook）    | 否（仅轮询）                        |
| **历史消息**      | 否                    | 是（可以查询历史）                  |
| **设置复杂性**    | 仅应用 manifest       | 需要管理员同意 + token 流           |
| **离线工作**      | 否（必须运行）        | 是（随时查询）                      |

**底线：** RSC 用于实时监听；Graph API 用于历史访问。要在离线时赶上错过的消息，您需要带有 `ChannelMessage.Read.All` 的 Graph API（需要管理员同意）。

## 启用 Graph 的媒体 + 历史（Channel 需要）

如果您需要 **Channel** 中的图像/文件或想要获取**消息历史**，您必须启用 Microsoft Graph 权限并授予管理员同意。

1. 在 Entra ID（Azure AD）**App Registration** 中，添加 Microsoft Graph **Application 权限**：
   - `ChannelMessage.Read.All`（Channel 附件 + 历史）
   - `Chat.Read.All` 或 `ChatMessage.Read.All`（群聊）
2. 为租户**授予管理员同意**。
3. 增加 Teams 应用 **manifest 版本**，重新上传并在 Teams 中**重新安装应用**。
4. **完全退出并重新启动 Teams** 以清除缓存的应用元数据。

**用户提及的附加权限：** 用户 @mentions 对对话中的用户开箱即用。但是，如果您想动态搜索并提及**不在当前对话中**的用户，请添加 `User.Read.All`（Application）权限并授予管理员同意。

## 已知限制

### Webhook 超时

Teams 通过 HTTP Webhook 传递消息。如果处理时间过长（例如，LLM 响应慢），您可能会看到：

- Gateway 超时
- Teams 重试消息（导致重复）
- 丢失的回复

OpenClaw 通过快速返回并主动发送回复来处理这个问题，但非常慢的响应仍可能导致问题。

### 格式化

Teams markdown 比 Slack 或 Discord 更受限：

- 基本格式有效：**粗体**、*斜体*、`代码`、链接
- 复杂 markdown（表格、嵌套列表）可能无法正确呈现
- 支持 Adaptive Cards 用于投票和语义展示发送（见下文）

## 配置

关键设置（共享 Channel 模式见 `/gateway/configuration`）：

- `channels.msteams.enabled`：启用/禁用 Channel。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：bot 凭据。
- `channels.msteams.webhook.port`（默认 `3978`）
- `channels.msteams.webhook.path`（默认 `/api/messages`）
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）
- `channels.msteams.allowFrom`：DM allowlist（推荐使用 AAD 对象 ID）。当 Graph 访问可用时，向导在设置期间将名称解析为 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：紧急开关，重新启用可变 UPN/显示名称匹配和直接团队/Channel 名称路由。
- `channels.msteams.textChunkLimit`：出站文本块大小。
- `channels.msteams.chunkMode`：`length`（默认）或 `newline`，在长度分块之前在空行（段落边界）上拆分。
- `channels.msteams.mediaAllowHosts`：入站附件主机 allowlist（默认为 Microsoft/Teams 域）。
- `channels.msteams.mediaAuthAllowHosts`：媒体重试时附加 Authorization 标头的 allowlist（默认为 Graph + Bot Framework 主机）。保持此列表严格（避免多租户后缀）。
- `channels.msteams.requireMention`：在 Channel/群组中需要 @mention（默认 true）。
- `channels.msteams.replyStyle`：`thread | top-level`（见[回复样式](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：每团队覆盖。
- `channels.msteams.teams.<teamId>.requireMention`：每团队覆盖。
- `channels.msteams.teams.<teamId>.tools`：默认每团队工具策略覆盖（`allow`/`deny`/`alsoAllow`），当缺少 Channel 覆盖时使用。
- `channels.msteams.teams.<teamId>.toolsBySender`：默认每团队每发送者工具策略覆盖（支持 `"*"` 通配符）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：每 Channel 覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：每 Channel 覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：每 Channel 工具策略覆盖（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：每 Channel 每发送者工具策略覆盖（支持 `"*"` 通配符）。
- `toolsBySender` 键应使用显式前缀：`id:`、`e164:`、`username:`、`name:`（旧版无前缀键仍映射到 `id:`）。
- `channels.msteams.actions.memberInfo`：启用或禁用 Graph 支持的成员信息操作（默认：当 Graph 凭据可用时启用）。
- `channels.msteams.authType`：认证类型——`"secret"`（默认）或 `"federated"`。
- `channels.msteams.certificatePath`：PEM 证书文件路径（联合 + 证书认证）。
- `channels.msteams.certificateThumbprint`：证书指纹（可选，认证不需要）。
- `channels.msteams.useManagedIdentity`：启用托管身份认证（联合模式）。
- `channels.msteams.managedIdentityClientId`：用户分配托管身份的客户端 ID。
- `channels.msteams.sharePointSiteId`：群聊/Channel 中文件上传的 SharePoint 站点 ID（见[在群聊中发送文件](#sending-files-in-group-chats)）。

## 路由和 Session

- Session 键遵循标准 Agent 格式（见 [/concepts/session](/concepts/session)）：
  - 直接消息共享主 Session（`agent:<agentId>:<mainKey>`）。
  - Channel/群组消息使用对话 id：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回复样式：Threads vs Posts

Teams 最近在同一底层数据模型上引入了两种 Channel UI 样式：

| 样式                    | 描述                               | 推荐 `replyStyle` |
| ----------------------- | ---------------------------------- | ----------------- |
| **Posts**（经典）       | 消息显示为卡片，下方有线程回复     | `thread`（默认）  |
| **Threads**（类似 Slack）| 消息线性流动，更像 Slack            | `top-level`       |

**问题：** Teams API 不公开 Channel 使用哪种 UI 样式。如果您使用错误的 `replyStyle`：

- `thread` 在 Threads 样式 Channel 中 → 回复显示嵌套得很尴尬
- `top-level` 在 Posts 样式 Channel 中 → 回复显示为单独的顶级帖子而不是在线程中

**解决方案：** 根据 Channel 的设置方式配置每 Channel 的 `replyStyle`：

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

### 解析优先级

当 bot 向 Channel 发送回复时，`replyStyle` 从最具体的覆盖一直解析到默认值。第一个非 `undefined` 的值胜出：

1. **每 Channel** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **每团队** — `channels.msteams.teams.<teamId>.replyStyle`
3. **全局** — `channels.msteams.replyStyle`
4. **隐式默认** — 从 `requireMention` 派生：
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

如果您在全局设置了 `requireMention: false` 但没有显式的 `replyStyle`，Posts 样式 Channel 中的提及将显示为顶级帖子，即使入站消息是话题串回复。在全局、团队或 Channel 级别固定 `replyStyle: "thread"` 以避免意外情况。

### 话题串上下文保留

当 `replyStyle: "thread"` 生效且 bot 被从 Channel 话题串内部 @提及时，OpenClaw 将原始话题串根重新附加到出站对话引用（`19:…@thread.tacv2;messageid=<root>`），使回复落在同一话题串内。这适用于实时（在回合内）发送和在 Bot Framework 回合上下文过期后进行的主动发送（例如，长时间运行的 Agent、通过 `mcp__openclaw__message` 排队的工具调用回复）。

话题串根取自对话引用上存储的 `threadId`。早于 `threadId` 的旧存储引用回退到 `activityId`（最后一个为对话播种的入站活动），因此现有部署无需重新播种即可继续工作。

当 `replyStyle: "top-level"` 生效时，Channel 话题串入站消息会故意作为新的顶级帖子回复——不附加话题串后缀。这是 Threads 样式 Channel 的正确行为；如果您看到顶级帖子而期望的是话题串回复，说明该 Channel 的 `replyStyle` 设置有误。

## 附件和图像

**当前限制：**

- **DM：** 图像和文件附件通过 Teams bot 文件 API 工作。
- **Channel/群组：** 附件存储在 M365 存储（SharePoint/OneDrive）中。Webhook 有效负载仅包含 HTML 存根，而不是实际文件字节。**需要 Graph API 权限**才能下载 Channel 附件。
- 对于显式文件优先发送，使用 `action=upload-file` 配合 `media` / `filePath` / `path`；可选的 `message` 成为附带的文本/评论，`filename` 覆盖上传的名称。

没有 Graph 权限，带有图像的 Channel 消息将仅作为文本接收（bot 无法访问图像内容）。
默认情况下，OpenClaw 仅从 Microsoft/Teams 主机名下载媒体。使用 `channels.msteams.mediaAllowHosts` 覆盖（使用 `["*"]` 允许任何主机）。
Authorization 标头仅附加到 `channels.msteams.mediaAuthAllowHosts` 中的主机（默认为 Graph + Bot Framework 主机）。保持此列表严格（避免多租户后缀）。

## 在群聊中发送文件

Bot 可以使用 FileConsentCard 流在 DM 中发送文件（内置）。但是，**在群聊/Channel 中发送文件**需要额外设置：

| 上下文                  | 文件发送方式                      | 所需设置                                    |
| ----------------------- | --------------------------------- | ------------------------------------------- |
| **DM**                  | FileConsentCard → 用户接受 → bot 上传 | 开箱即用                                    |
| **群聊/Channel**        | 上传到 SharePoint → 共享链接      | 需要 `sharePointSiteId` + Graph 权限        |
| **图像（任何上下文）**  | Base64 编码内联                   | 开箱即用                                    |

### 为什么群聊需要 SharePoint

Bot 没有个人 OneDrive 驱动器（`/me/drive` Graph API 端点对应用程序身份不起作用）。要在群聊/Channel 中发送文件，bot 上传到 **SharePoint 站点**并创建共享链接。

### 设置

1. **在 Entra ID（Azure AD）→ App Registration 中添加 Graph API 权限**：
   - `Sites.ReadWrite.All`（Application）——上传文件到 SharePoint
   - `Chat.Read.All`（Application）——可选，启用每用户共享链接

2. 为租户**授予管理员同意**。

3. **获取您的 SharePoint 站点 ID：**

   ```bash
   # 通过 Graph Explorer 或带有有效 token 的 curl：
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 示例：对于站点在 "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # 响应包含："id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **配置 OpenClaw：**

   ```json5
   {
     channels: {
       msteams: {
         // ... 其他配置 ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### 共享行为

| 权限                                        | 共享行为                                                  |
| ------------------------------------------- | --------------------------------------------------------- |
| 仅 `Sites.ReadWrite.All`                    | 组织范围共享链接（组织中的任何人都可以访问）              |
| `Sites.ReadWrite.All` + `Chat.Read.All`     | 每用户共享链接（仅聊天成员可以访问）                      |

每用户共享更安全，因为只有聊天参与者可以访问文件。如果缺少 `Chat.Read.All` 权限，bot 回退到组织范围共享。

### 回退行为

| 场景                                                      | 结果                                               |
| --------------------------------------------------------- | -------------------------------------------------- |
| 群聊 + 文件 + 已配置 `sharePointSiteId`                  | 上传到 SharePoint，发送共享链接                    |
| 群聊 + 文件 + 无 `sharePointSiteId`                      | 尝试 OneDrive 上传（可能失败），仅发送文本          |
| 个人聊天 + 文件                                           | FileConsentCard 流（无需 SharePoint 即可工作）     |
| 任何上下文 + 图像                                         | Base64 编码内联（无需 SharePoint 即可工作）        |

### 文件存储位置

上传的文件存储在配置的 SharePoint 站点默认文档库的 `/OpenClawShared/` 文件夹中。

## 投票（Adaptive Cards）

OpenClaw 将 Teams 投票作为 Adaptive Cards 发送（没有原生 Teams 投票 API）。

- CLI：`openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票由 Gateway 记录在 `~/.openclaw/msteams-polls.json` 中。
- Gateway 必须保持在线才能记录投票。
- 投票尚未自动发布结果摘要（如需要，检查存储文件）。

## 展示卡片

使用 `message` 工具或 CLI 向 Teams 用户或对话发送语义展示载荷。OpenClaw 从通用展示契约将它们渲染为 Teams Adaptive Cards。

当提供 `presentation` 时，消息文本是可选的。

**Agent 工具：**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI：**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

有关目标格式详细信息，请参见下面的[目标格式](#target-formats)。

## 目标格式

MSTeams 目标使用前缀来区分用户和对话：

| 目标类型              | 格式                              | 示例                                               |
| --------------------- | --------------------------------- | -------------------------------------------------- |
| 用户（按 ID）         | `user:<aad-object-id>`            | `user:40a1a0ed-4ff2-4164-a219-55518990c197`        |
| 用户（按名称）        | `user:<display-name>`             | `user:John Smith`（需要 Graph API）                |
| 群组/Channel          | `conversation:<conversation-id>`  | `conversation:19:abc123...@thread.tacv2`           |
| 群组/Channel（原始）  | `<conversation-id>`               | `19:abc123...@thread.tacv2`（如果包含 `@thread`）  |

**CLI 示例：**

```bash
# 按 ID 发送给用户
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 按显示名称发送给用户（触发 Graph API 查找）
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# 发送到群聊或 Channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# 将展示卡片发送到对话
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Agent 工具示例：**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

<Note>
没有 `user:` 前缀，名称默认为群组或团队解析。按显示名称定位人员时始终使用 `user:`。
</Note>

## 主动消息

- 主动消息仅在用户交互**之后**才可能，因为我们此时存储对话引用。
- 有关 `dmPolicy` 和 allowlist 控制，请参见 `/gateway/configuration`。

## 团队和 Channel ID（常见陷阱）

Teams URL 中的 `groupId` 查询参数**不是**用于配置的团队 ID。改为从 URL 路径中提取 ID：

**团队 URL：**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    团队 ID（URL 解码此部分）
```

**Channel URL：**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID（URL 解码此部分）
```

**对于配置：**

- 团队 ID = `/team/` 之后的路径段（URL 解码，例如 `19:Bk4j...@thread.tacv2`；较旧的租户可能显示 `@thread.skype`，同样有效）
- Channel ID = `/channel/` 之后的路径段（URL 解码）
- **忽略** `groupId` 查询参数——它是 Microsoft Entra 组 ID，而非 Bot Framework 对话 ID

## 私有 Channel

Bot 在私有 Channel 中的支持有限：

| 功能                  | 标准 Channel  | 私有 Channel         |
| --------------------- | ------------- | -------------------- |
| Bot 安装              | 是            | 有限                 |
| 实时消息（Webhook）   | 是            | 可能不工作           |
| RSC 权限              | 是            | 可能行为不同         |
| @mentions             | 是            | 如果 bot 可访问      |
| Graph API 历史        | 是            | 是（带权限）         |

**如果私有 Channel 不工作的解决方法：**

1. 使用标准 Channel 进行 bot 交互
2. 使用 DM——用户始终可以直接向 bot 发送消息
3. 使用 Graph API 进行历史访问（需要 `ChannelMessage.Read.All`）

## 故障排除

### 常见问题

- **Channel 中图像不显示：** Graph 权限或管理员同意缺失。重新安装 Teams 应用并完全退出/重新打开 Teams。
- **Channel 中无响应：** 默认需要提及；设置 `channels.msteams.requireMention=false` 或配置每团队/Channel。
- **版本不匹配（Teams 仍显示旧 manifest）：** 删除 + 重新添加应用并完全退出 Teams 以刷新。
- **来自 Webhook 的 401 Unauthorized：** 在没有 Azure JWT 的情况下手动测试时预期——意味着端点可达但认证失败。使用 Azure Web Chat 正确测试。

### Manifest 上传错误

- **"Icon file cannot be empty"：** manifest 引用的图标文件为 0 字节。创建有效的 PNG 图标（32x32 用于 `outline.png`，192x192 用于 `color.png`）。
- **"webApplicationInfo.Id already in use"：** 应用仍安装在另一个团队/聊天中。首先找到并卸载它，或等待 5-10 分钟进行传播。
- **上传时"Something went wrong"：** 通过 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上传，打开浏览器 DevTools（F12）→ Network 选项卡，并检查响应正文以获取实际错误。
- **旁加载失败：** 尝试"Upload an app to your org's app catalog"而不是"Upload a custom app"——这通常绕过旁加载限制。

### RSC 权限不工作

1. 验证 `webApplicationInfo.id` 完全匹配您的 bot 的 App ID
2. 重新上传应用并在团队/聊天中重新安装
3. 检查您的组织管理员是否阻止了 RSC 权限
4. 确认您使用的是正确的范围：团队使用 `ChannelMessage.Read.Group`，群聊使用 `ChatMessage.Read.Chat`

## 参考资料

- [创建 Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration)——Azure Bot 设置指南
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps)——创建/管理 Teams 应用
- [Teams 应用 manifest 架构](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [使用 RSC 接收 Channel 消息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 权限参考](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot 文件处理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（Channel/群组需要 Graph）
- [主动消息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli)——bot 管理 Teams CLI

## 相关

- [Channels 概述](/channels) — 所有支持的 Channels
- [Pairing](/channels/pairing) — DM 认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
