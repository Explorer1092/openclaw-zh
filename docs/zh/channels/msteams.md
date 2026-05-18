---
mmh3_hash: "2c00b814d872d305f64308ccfd3f2880"
summary: "Microsoft Teams bot 支持状态、功能和配置"
read_when:
  - 开发 Microsoft Teams Channel 功能
title: "Microsoft Teams"
---

状态：支持文本和私信附件；频道/群组文件发送需要 `sharePointSiteId` + Graph 权限（参见[在群组聊天中发送文件](#在群组聊天中发送文件)）。投票通过 Adaptive Cards 发送。Message 操作暴露显式 `upload-file` 用于文件优先发送。

## 捆绑 Plugin

Microsoft Teams 作为捆绑 Plugin 随当前 OpenClaw 版本一起发布，正常打包构建中无需单独安装。

如果您使用的是旧版构建或不包含捆绑 Teams 的自定义安装，直接安装 npm 包：

```bash
openclaw plugins install @openclaw/msteams
```

使用裸包跟随当前官方版本标签。仅在需要可重现安装时才固定精确版本。

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

详情：[Plugins](/tools/plugin)

## 快速设置

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) 在单个命令中处理 bot 注册、清单创建和凭据生成。

**1. 安装并登录**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # 验证已登录并查看租户信息
```

<Note>
Teams CLI 目前处于预览阶段。命令和标志可能在版本之间发生变化。
</Note>

**2. 启动隧道**（Teams 无法访问 localhost）

如果尚未安装，请安装并认证 devtunnel CLI（[入门指南](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# 一次性设置（跨会话的持久 URL）：
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 每次开发会话：
devtunnel host my-openclaw-bot
# 端点：https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` 是必需的，因为 Teams 无法对 devtunnels 进行认证。每个传入的 bot 请求仍由 Teams SDK 自动验证。
</Note>

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（但这些可能每次会话都更改 URL）。

**3. 创建应用**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

此单个命令：

- 创建 Entra ID（Azure AD）应用程序
- 生成客户端密钥
- 构建并上传 Teams 应用清单（带图标）
- 注册 bot（默认由 Teams 管理——无需 Azure 订阅）

输出将显示 `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID` 和 **Teams App ID**——记录这些以备下一步使用。它还提供直接在 Teams 中安装应用。

**4. 使用输出中的凭据配置 OpenClaw：**

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

`teams app create` 会提示您安装应用——选择"Install in Teams"。如果跳过了，可以稍后获取链接：

```bash
teams app get <teamsAppId> --install-link
```

**6. 验证一切正常**

```bash
teams app doctor <teamsAppId>
```

这对 bot 注册、AAD 应用配置、清单有效性和 SSO 设置运行诊断。

对于生产部署，考虑使用[联合认证](/channels/msteams#联合认证证书加托管身份)（证书或托管身份）而不是客户端密钥。

<Note>
群组聊天默认被阻止（`channels.msteams.groupPolicy: "allowlist"`）。要允许群组回复，设置 `channels.msteams.groupAllowFrom`，或使用 `groupPolicy: "open"` 允许任何成员（提及门控）。
</Note>

## 目标

- 通过 Teams 私信、群组聊天或频道与 OpenClaw 交谈。
- 保持路由确定性：回复始终返回到到达的频道。
- 默认安全频道行为（除非另行配置，否则需要提及）。

## 配置写入

默认情况下，Microsoft Teams 允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

禁用方式：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 访问控制（私信 + 群组）

**私信访问**

- 默认：`channels.msteams.dmPolicy = "pairing"`。未知发送者被忽略直到获批。
- `channels.msteams.allowFrom` 应使用稳定的 AAD 对象 ID 或静态发送者访问组，如 `accessGroup:core-team`。
- 不要依赖 UPN/显示名称匹配进行 allowlist——它们可以更改。OpenClaw 默认禁用直接名称匹配；使用 `channels.msteams.dangerouslyAllowNameMatching: true` 显式选择加入。
- 向导可以在凭据允许时通过 Microsoft Graph 将名称解析为 ID。

**群组访问**

- 默认：`channels.msteams.groupPolicy = "allowlist"`（除非添加 `groupAllowFrom`，否则被阻止）。使用 `channels.defaults.groupPolicy` 在未设置时覆盖默认值。
- `channels.msteams.groupAllowFrom` 控制哪些发送者或静态发送者访问组可以在群组聊天/频道中触发（回退到 `channels.msteams.allowFrom`）。
- 设置 `groupPolicy: "open"` 允许任何成员（默认仍需提及）。
- 要**禁止所有频道**，设置 `channels.msteams.groupPolicy: "disabled"`。

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

**Teams + 频道 allowlist**

- 在 `channels.msteams.teams` 下列出团队和频道，限制群组/频道回复。
- 键应使用来自 Teams 链接的稳定 Teams 会话 ID，而不是可变的显示名称。
- 当 `groupPolicy="allowlist"` 且存在 teams allowlist 时，只接受列出的团队/频道（提及门控）。
- 配置向导接受 `Team/Channel` 条目并为您存储。
- 启动时，OpenClaw 将团队/频道和用户 allowlist 名称解析为 ID（当 Graph 权限允许时）并记录映射；默认情况下，未解析的团队/频道名称保持原样但被忽略用于路由，除非启用了 `channels.msteams.dangerouslyAllowNameMatching: true`。

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

如果无法使用 Teams CLI，可以通过 Azure 门户手动设置 bot。

### 工作原理

1. 确保 Microsoft Teams Plugin 可用（当前版本已捆绑）。
2. 创建 **Azure Bot**（App ID + 密钥 + 租户 ID）。
3. 构建引用 bot 并包含以下 RSC 权限的 **Teams 应用包**。
4. 将 Teams 应用上传/安装到团队（或用于私信的个人范围）。
5. 在 `~/.openclaw/openclaw.json`（或环境变量）中配置 `msteams` 并启动 Gateway。
6. Gateway 默认监听 `/api/messages` 上的 Bot Framework webhook 流量。

### 第 1 步：创建 Azure Bot

1. 前往 [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填写 **Basics** 选项卡：

   | 字段               | 值                                                   |
   | ------------------ | ---------------------------------------------------- |
   | **Bot handle**     | Bot 名称，例如 `openclaw-msteams`（必须唯一）        |
   | **Subscription**   | 选择您的 Azure 订阅                                  |
   | **Resource group** | 创建新的或使用现有的                                 |
   | **Pricing tier**   | **Free**（用于开发/测试）                            |
   | **Type of App**    | **Single Tenant**（推荐——见下方注意）                |
   | **Creation type**  | **Create new Microsoft App ID**                      |

<Warning>
2025-07-31 之后弃用了新多租户 bot 的创建。新 bot 请使用 **Single Tenant**。
</Warning>

3. 点击 **Review + create** → **Create**（等待约 1-2 分钟）

### 第 2 步：获取凭据

1. 前往 Azure Bot 资源 → **Configuration**
2. 复制 **Microsoft App ID** → 这是您的 `appId`
3. 点击 **Manage Password** → 前往 App Registration
4. 在 **Certificates & secrets** → **New client secret** → 复制 **Value** → 这是您的 `appPassword`
5. 前往 **Overview** → 复制 **Directory (tenant) ID** → 这是您的 `tenantId`

### 第 3 步：配置消息端点

1. 在 Azure Bot → **Configuration**
2. 将 **Messaging endpoint** 设置为您的 webhook URL：
   - 生产环境：`https://your-domain.com/api/messages`
   - 本地开发：使用隧道（参见下方[本地开发](#本地开发隧道)）

### 第 4 步：启用 Teams Channel

1. 在 Azure Bot → **Channels**
2. 点击 **Microsoft Teams** → Configure → Save
3. 接受服务条款

### 第 5 步：构建 Teams 应用清单

- 包含带 `botId = <App ID>` 的 `bot` 条目。
- 范围：`personal`、`team`、`groupChat`。
- `supportsFiles: true`（个人范围文件处理必需）。
- 添加 RSC 权限（参见[当前 Teams RSC 权限（清单）](#当前-teams-rsc-权限清单)）。
- 创建图标：`outline.png`（32x32）和 `color.png`（192x192）。
- 将三个文件一起压缩：`manifest.json`、`outline.png`、`color.png`。

### 第 6 步：配置 OpenClaw

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

### 第 7 步：运行 Gateway

当 Plugin 可用且存在带凭据的 `msteams` 配置时，Teams Channel 自动启动。

</details>

## 联合认证：证书加托管身份

> 2026.4.11 添加

对于生产部署，OpenClaw 支持**联合认证**作为客户端密钥更安全的替代方案。有两种方法：

### 方案 A：基于证书的认证

使用向您的 Entra ID 应用注册注册的 PEM 证书。

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

### 方案 B：Azure 托管身份

使用 Azure 托管身份进行无密码认证。适用于有托管身份可用的 Azure 基础设施部署（AKS、App Service、Azure VM）。

**工作原理：**

1. Bot pod/VM 具有托管身份（系统分配或用户分配）。
2. **联合身份凭据**将托管身份链接到 Entra ID 应用注册。
3. 运行时，OpenClaw 使用 `@azure/identity` 从 Azure IMDS 端点（`169.254.169.254`）获取 Token。
4. Token 传递给 Teams SDK 进行 bot 认证。

**先决条件：**

- 启用了托管身份的 Azure 基础设施（AKS 工作负载身份、App Service、VM）
- 在 Entra ID 应用注册上创建的联合身份凭据
- 从 pod/VM 对 IMDS（`169.254.169.254:80`）的网络访问

**配置（系统分配的托管身份）：**

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

**配置（用户分配的托管身份）：**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（仅用于用户分配的 MI）

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

3. **用应用客户端 ID 注解 Kubernetes 服务账户：**

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

5. **确保网络访问** IMDS（`169.254.169.254`）——如果使用 NetworkPolicy，添加允许到 `169.254.169.254/32` 端口 80 的出口规则。

### 认证类型比较

| 方法             | 配置                                           | 优点                               | 缺点                              |
| ---------------- | ---------------------------------------------- | ---------------------------------- | --------------------------------- |
| **客户端密钥**   | `appPassword`                                  | 设置简单                           | 需要密钥轮换，安全性较低          |
| **证书**         | `authType: "federated"` + `certificatePath`    | 无需通过网络共享密钥               | 证书管理开销                      |
| **托管身份**     | `authType: "federated"` + `useManagedIdentity` | 无密码，无需管理密钥               | 需要 Azure 基础设施               |

**默认行为：** 未设置 `authType` 时，OpenClaw 默认使用客户端密钥认证。现有配置无需更改即可继续工作。

## 本地开发（隧道）

Teams 无法访问 `localhost`。使用持久开发隧道以使 URL 在会话之间保持不变：

```bash
# 一次性设置：
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 每次开发会话：
devtunnel host my-openclaw-bot
```

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 可能每次会话都更改）。

如果隧道 URL 更改，更新端点：

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## 测试 Bot

**运行诊断：**

```bash
teams app doctor <teamsAppId>
```

在一次通过中检查 bot 注册、AAD 应用、清单和 SSO 配置。

**发送测试消息：**

1. 安装 Teams 应用（使用 `teams app get <id> --install-link` 中的安装链接）
2. 在 Teams 中找到 bot 并发送私信
3. 检查 Gateway 日志中的传入活动

## 环境变量

所有配置键都可以通过环境变量设置：

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`（可选：`"secret"` 或 `"federated"`）
- `MSTEAMS_CERTIFICATE_PATH`（联合 + 证书）
- `MSTEAMS_CERTIFICATE_THUMBPRINT`（可选，认证不需要）
- `MSTEAMS_USE_MANAGED_IDENTITY`（联合 + 托管身份）
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（仅用于用户分配的 MI）

## 成员信息操作

OpenClaw 为 Microsoft Teams 暴露 Graph 支持的 `member-info` 操作，使 Agent 和自动化可以直接从 Microsoft Graph 解析频道成员详情（显示名称、电子邮件、角色）。

要求：

- `Member.Read.Group` RSC 权限（已在推荐清单中）
- 跨团队查找：需要管理员同意的 `User.Read.All` Graph 应用程序权限

该操作受 `channels.msteams.actions.memberInfo` 控制（默认：当 Graph 凭据可用时启用）。

## 历史上下文

- `channels.msteams.historyLimit` 控制有多少条最近频道/群组消息被包装到提示中。
- 回退到 `messages.groupChat.historyLimit`。设置 `0` 禁用（默认 50）。
- 获取的线程历史按发送者 allowlist（`allowFrom` / `groupAllowFrom`）过滤，因此线程上下文种子只包含来自允许发送者的消息。
- 引用的附件上下文（从 Teams 回复 HTML 派生的 `ReplyTo*`）目前按原样传递。
- 换句话说，allowlist 控制谁可以触发 Agent；目前只有特定的补充上下文路径被过滤。
- 私信历史可以用 `channels.msteams.dmHistoryLimit`（用户轮次）限制。每用户覆盖：`channels.msteams.dms["<user_id>"].historyLimit`。

## 当前 Teams RSC 权限（清单）

这些是我们 Teams 应用清单中**现有的 resourceSpecific 权限**。它们仅适用于安装了应用的团队/聊天内。

**对于频道（团队范围）：**

- `ChannelMessage.Read.Group`（应用程序）- 无需 @提及即可接收所有频道消息
- `ChannelMessage.Send.Group`（应用程序）
- `Member.Read.Group`（应用程序）
- `Owner.Read.Group`（应用程序）
- `ChannelSettings.Read.Group`（应用程序）
- `TeamMember.Read.Group`（应用程序）
- `TeamSettings.Read.Group`（应用程序）

**对于群组聊天：**

- `ChatMessage.Read.Chat`（应用程序）- 无需 @提及即可接收所有群组聊天消息

通过 Teams CLI 添加 RSC 权限：

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams 清单示例（已删减）

带必填字段的最小有效示例。替换 ID 和 URL。

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

### 清单注意事项（必填字段）

- `bots[].botId` **必须**与 Azure Bot App ID 匹配。
- `webApplicationInfo.id` **必须**与 Azure Bot App ID 匹配。
- `bots[].scopes` 必须包含您计划使用的界面（`personal`、`team`、`groupChat`）。
- `bots[].supportsFiles: true` 是个人范围文件处理所必需的。
- `authorization.permissions.resourceSpecific` 必须包含频道读取/发送（如果您想要频道流量）。

### 更新现有应用

更新已安装的 Teams 应用（例如添加 RSC 权限）：

```bash
# 下载、编辑并重新上传清单
teams app manifest download <teamsAppId> manifest.json
# 在本地编辑 manifest.json...
teams app manifest upload manifest.json <teamsAppId>
# 如果内容更改，版本会自动递增
```

更新后，在每个团队中重新安装应用以使新权限生效，并**完全退出并重新启动 Teams**（而不仅仅是关闭窗口）以清除缓存的应用元数据。

<details>
<summary>手动清单更新（不使用 CLI）</summary>

1. 使用新设置更新 `manifest.json`
2. **递增 `version` 字段**（例如 `1.0.0` → `1.1.0`）
3. **重新压缩**清单和图标（`manifest.json`、`outline.png`、`color.png`）
4. 上传新的 zip：
   - **Teams 管理中心：** Teams 应用 → 管理应用 → 找到您的应用 → 上传新版本
   - **旁加载：** 在 Teams → 应用 → 管理您的应用 → 上传自定义应用

</details>

## 功能：仅 RSC 与 Graph

### 仅使用 **Teams RSC**（已安装应用，无 Graph API 权限）

有效：

- 读取频道消息**文本**内容。
- 发送频道消息**文本**内容。
- 接收**个人（私信）**文件附件。

无效：

- 频道/群组**图像或文件内容**（载荷仅包含 HTML 存根）。
- 下载存储在 SharePoint/OneDrive 中的附件。
- 读取消息历史（超出实时 webhook 事件范围）。

### 使用 **Teams RSC + Microsoft Graph 应用程序权限**

新增：

- 下载托管内容（粘贴到消息中的图像）。
- 下载存储在 SharePoint/OneDrive 中的文件附件。
- 通过 Graph 读取频道/聊天消息历史。

### RSC 与 Graph API

| 功能                 | RSC 权限             | Graph API                           |
| -------------------- | -------------------- | ----------------------------------- |
| **实时消息**         | 是（通过 webhook）   | 否（仅轮询）                        |
| **历史消息**         | 否                   | 是（可以查询历史）                  |
| **设置复杂度**       | 仅应用清单           | 需要管理员同意 + Token 流程         |
| **离线工作**         | 否（必须运行中）     | 是（随时查询）                      |

**结论：** RSC 用于实时监听；Graph API 用于历史访问。要追上离线时错过的消息，需要带 `ChannelMessage.Read.All` 的 Graph API（需要管理员同意）。

## Graph 启用的媒体 + 历史（频道必需）

如果您需要**频道**中的图像/文件或想要获取**消息历史**，必须启用 Microsoft Graph 权限并授予管理员同意。

1. 在 Entra ID（Azure AD）**App Registration** 中，添加 Microsoft Graph **应用程序权限**：
   - `ChannelMessage.Read.All`（频道附件 + 历史）
   - `Chat.Read.All` 或 `ChatMessage.Read.All`（群组聊天）
2. 为租户**授予管理员同意**。
3. 递增 Teams 应用**清单版本**，重新上传，并**在 Teams 中重新安装应用**。
4. **完全退出并重新启动 Teams** 以清除缓存的应用元数据。

**用户提及的额外权限：** 对话中的用户 @提及开箱即用。但是，如果您想动态搜索并提及**不在当前对话中**的用户，需要添加 `User.Read.All`（应用程序）权限并授予管理员同意。

## 已知限制

### Webhook 超时

Teams 通过 HTTP webhook 传递消息。如果处理时间过长（例如 LLM 响应缓慢），可能会出现：

- Gateway 超时
- Teams 重试消息（导致重复）
- 回复丢失

OpenClaw 通过快速返回并主动发送回复来处理这个问题，但非常慢的响应仍可能导致问题。

### 格式化

Teams Markdown 比 Slack 或 Discord 更受限：

- 基本格式有效：**粗体**、_斜体_、`代码`、链接
- 复杂 Markdown（表格、嵌套列表）可能无法正确渲染
- Adaptive Cards 用于投票和语义 presentation 发送（见下文）

## 配置

关键设置（共享 Channel 模式参见 `/gateway/configuration`）：

- `channels.msteams.enabled`：启用/禁用 Channel。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：bot 凭据。
- `channels.msteams.webhook.port`（默认 `3978`）
- `channels.msteams.webhook.path`（默认 `/api/messages`）
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）
- `channels.msteams.allowFrom`：私信 allowlist（推荐 AAD 对象 ID）。向导在设置期间当 Graph 访问可用时将名称解析为 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：紧急切换，重新启用可变 UPN/显示名称匹配和直接团队/频道名称路由。
- `channels.msteams.textChunkLimit`：出站文本块大小。
- `channels.msteams.chunkMode`：`length`（默认）或 `newline`，在长度分块之前按空行（段落边界）分割。
- `channels.msteams.mediaAllowHosts`：入站附件主机 allowlist（默认为 Microsoft/Teams 域）。
- `channels.msteams.mediaAuthAllowHosts`：媒体重试时附加 Authorization 头的主机 allowlist（默认为 Graph + Bot Framework 主机）。保持此列表严格（避免多租户后缀）。
- `channels.msteams.requireMention`：在频道/群组中需要 @提及（默认 true）。
- `channels.msteams.replyStyle`：`thread | top-level`（参见[回复风格：线程与帖子](#回复风格线程与帖子)）。
- `channels.msteams.teams.<teamId>.replyStyle`：每团队覆盖。
- `channels.msteams.teams.<teamId>.requireMention`：每团队覆盖。
- `channels.msteams.teams.<teamId>.tools`：默认每团队工具策略覆盖（`allow`/`deny`/`alsoAllow`），在频道覆盖缺失时使用。
- `channels.msteams.teams.<teamId>.toolsBySender`：默认每团队每发送者工具策略覆盖（支持 `"*"` 通配符）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：每频道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：每频道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：每频道工具策略覆盖（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：每频道每发送者工具策略覆盖（支持 `"*"` 通配符）。
- `toolsBySender` 键应使用显式前缀：`channel:`、`id:`、`e164:`、`username:`、`name:`（旧版无前缀键仍仅映射到 `id:`）。
- `channels.msteams.actions.memberInfo`：启用或禁用 Graph 支持的成员信息操作（默认：当 Graph 凭据可用时启用）。
- `channels.msteams.authType`：认证类型——`"secret"`（默认）或 `"federated"`。
- `channels.msteams.certificatePath`：PEM 证书文件路径（联合 + 证书认证）。
- `channels.msteams.certificateThumbprint`：证书指纹（可选，认证不需要）。
- `channels.msteams.useManagedIdentity`：启用托管身份认证（联合模式）。
- `channels.msteams.managedIdentityClientId`：用户分配的托管身份的客户端 ID。
- `channels.msteams.sharePointSiteId`：群组聊天/频道中文件上传的 SharePoint 网站 ID（参见[在群组聊天中发送文件](#在群组聊天中发送文件)）。

## 路由和 Session

- Session 键遵循标准 Agent 格式（参见 [/concepts/session](/concepts/session)）：
  - 私信共享主 Session（`agent:<agentId>:<mainKey>`）。
  - 频道/群组消息使用会话 ID：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回复风格：线程与帖子

Teams 最近在相同底层数据模型上引入了两种频道 UI 风格：

| 风格                   | 描述                                               | 推荐 `replyStyle` |
| ---------------------- | -------------------------------------------------- | ------------------ |
| **帖子**（经典）       | 消息显示为带有线程回复的卡片                       | `thread`（默认）  |
| **线程**（类 Slack）   | 消息线性流动，更像 Slack                           | `top-level`       |

**问题：** Teams API 不暴露频道使用哪种 UI 风格。如果使用了错误的 `replyStyle`：

- 在线程风格频道中使用 `thread` → 回复嵌套显示很奇怪
- 在帖子风格频道中使用 `top-level` → 回复显示为单独的顶层帖子而不是在线程中

**解决方案：** 根据频道的设置方式按频道配置 `replyStyle`：

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

当 bot 向频道发送回复时，`replyStyle` 从最具体的覆盖解析到默认值。第一个非 `undefined` 值优先：

1. **每频道** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **每团队** — `channels.msteams.teams.<teamId>.replyStyle`
3. **全局** — `channels.msteams.replyStyle`
4. **隐式默认** — 从 `requireMention` 派生：
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

如果全局设置 `requireMention: false` 而没有显式 `replyStyle`，帖子风格频道中的提及将显示为顶层帖子，即使入站是线程回复。在全局、团队或频道级别固定 `replyStyle: "thread"` 以避免意外。

### 线程上下文保留

当 `replyStyle: "thread"` 生效且 bot 从频道线程内被 @提及时，OpenClaw 将原始线程根重新附加到出站会话引用（`19:…@thread.tacv2;messageid=<root>`），使回复落在同一线程中。这适用于实时（轮次内）发送和在 Bot Framework 轮次上下文过期后进行的主动发送（例如长时间运行的 Agent、通过 `mcp__openclaw__message` 排队的工具调用回复）。

线程根取自存储在会话引用上的 `threadId`。早于 `threadId` 的旧存储引用回退到 `activityId`（上次种子化会话的入站活动），因此现有部署无需重新种子即可继续工作。

当 `replyStyle: "top-level"` 生效时，频道线程入站被有意地作为新的顶层帖子回复——不附加线程后缀。这是线程风格频道的正确行为；如果您看到顶层帖子而预期的是线程回复，说明该频道的 `replyStyle` 设置不正确。

## 附件和图像

**当前限制：**

- **私信：** 图像和文件附件通过 Teams bot 文件 API 有效。
- **频道/群组：** 附件存储在 M365 存储中（SharePoint/OneDrive）。webhook 载荷只包含 HTML 存根，而非实际文件字节。**下载频道附件需要 Graph API 权限**。
- 对于显式的文件优先发送，使用带 `media` / `filePath` / `path` 的 `action=upload-file`；可选的 `message` 变为附带的文本/评论，`filename` 覆盖上传的名称。

没有 Graph 权限，带图像的频道消息将只能以纯文本形式接收（图像内容无法被 bot 访问）。
默认情况下，OpenClaw 只从 Microsoft/Teams 主机名下载媒体。使用 `channels.msteams.mediaAllowHosts` 覆盖（使用 `["*"]` 允许任何主机）。
Authorization 头仅附加到 `channels.msteams.mediaAuthAllowHosts` 中的主机（默认为 Graph + Bot Framework 主机）。保持此列表严格（避免多租户后缀）。

## 在群组聊天中发送文件

Bot 可以使用 FileConsentCard 流程在私信中发送文件（内置）。但是，**在群组聊天/频道中发送文件**需要额外设置：

| 上下文                   | 文件发送方式                           | 所需设置                                        |
| ------------------------ | -------------------------------------- | ----------------------------------------------- |
| **私信**                 | FileConsentCard → 用户接受 → bot 上传  | 开箱即用                                        |
| **群组聊天/频道**        | 上传到 SharePoint → 共享链接           | 需要 `sharePointSiteId` + Graph 权限            |
| **图像（任何上下文）**   | Base64 编码内联                        | 开箱即用                                        |

### 为什么群组聊天需要 SharePoint

Bot 没有个人 OneDrive 驱动器（`/me/drive` Graph API 端点对应用程序身份不起作用）。要在群组聊天/频道中发送文件，bot 上传到 **SharePoint 网站**并创建共享链接。

### 设置

1. 在 Entra ID（Azure AD）→ App Registration 中**添加 Graph API 权限**：
   - `Sites.ReadWrite.All`（应用程序）- 上传文件到 SharePoint
   - `Chat.Read.All`（应用程序）- 可选，启用每用户共享链接

2. 为租户**授予管理员同意**。

3. **获取您的 SharePoint 网站 ID：**

   ```bash
   # 通过 Graph Explorer 或使用有效 Token 的 curl：
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 示例：对于 "contoso.sharepoint.com/sites/BotFiles" 上的网站
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

| 权限                                      | 共享行为                                            |
| ----------------------------------------- | --------------------------------------------------- |
| 仅 `Sites.ReadWrite.All`                  | 组织范围共享链接（组织中任何人都可以访问）          |
| `Sites.ReadWrite.All` + `Chat.Read.All`   | 每用户共享链接（只有聊天成员可以访问）              |

每用户共享更安全，因为只有聊天参与者可以访问文件。如果缺少 `Chat.Read.All` 权限，bot 回退到组织范围共享。

### 回退行为

| 场景                                          | 结果                                             |
| --------------------------------------------- | ------------------------------------------------ |
| 群组聊天 + 文件 + 已配置 `sharePointSiteId`   | 上传到 SharePoint，发送共享链接                  |
| 群组聊天 + 文件 + 无 `sharePointSiteId`       | 尝试 OneDrive 上传（可能失败），仅发送文本       |
| 个人聊天 + 文件                               | FileConsentCard 流程（无需 SharePoint 即可工作） |
| 任何上下文 + 图像                             | Base64 编码内联（无需 SharePoint 即可工作）      |

### 文件存储位置

上传的文件存储在已配置 SharePoint 网站默认文档库中的 `/OpenClawShared/` 文件夹中。

## 投票（Adaptive Cards）

OpenClaw 将 Teams 投票作为 Adaptive Cards 发送（没有原生 Teams 投票 API）。

- CLI：`openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票由 Gateway 记录在 `~/.openclaw/msteams-polls.json` 中。
- Gateway 必须保持在线才能记录投票。
- 投票尚未自动发布结果摘要（如需查看请检查存储文件）。

## Presentation Cards

使用 `message` 工具、CLI 或正常回复传递，向 Teams 用户或对话发送语义 presentation 载荷。OpenClaw 从通用 presentation 合约将它们渲染为 Teams Adaptive Cards。

`presentation` 参数接受语义块。提供 `presentation` 时，消息文本是可选的。按钮渲染为 Adaptive Card 提交或 URL 操作。选择菜单在 Teams 渲染器中还不是原生的，所以 OpenClaw 在传递前将它们降级为可读文本。

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

目标格式详情，参见下方[目标格式](#目标格式)。

## 目标格式

MSTeams 目标使用前缀区分用户和对话：

| 目标类型           | 格式                             | 示例                                                |
| ------------------ | -------------------------------- | --------------------------------------------------- |
| 用户（按 ID）      | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| 用户（按名称）     | `user:<display-name>`            | `user:John Smith`（需要 Graph API）                 |
| 群组/频道          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| 群组/频道（裸）    | `<conversation-id>`              | `19:abc123...@thread.tacv2`（如果包含 `@thread`）   |

**CLI 示例：**

```bash
# 按 ID 发送给用户
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 按显示名称发送给用户（触发 Graph API 查找）
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# 发送到群组聊天或频道
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# 向对话发送 presentation card
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
不带 `user:` 前缀时，名称默认解析为群组或团队。按显示名称定向用户时始终使用 `user:`。
</Note>

## 主动消息

- 主动消息仅在**用户交互后**才可能，因为我们在那时存储会话引用。
- `dmPolicy` 和 allowlist 门控参见 `/gateway/configuration`。

## 团队和频道 ID（常见陷阱）

Teams URL 中的 `groupId` 查询参数**不是**用于配置的团队 ID。改为从 URL 路径中提取 ID：

**团队 URL：**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    团队会话 ID（URL 解码这个）
```

**频道 URL：**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      频道 ID（URL 解码这个）
```

**对于配置：**

- 团队键 = `/team/` 后的路径段（URL 解码，例如 `19:Bk4j...@thread.tacv2`；较旧的租户可能显示 `@thread.skype`，也有效）
- 频道键 = `/channel/` 后的路径段（URL 解码）
- **忽略**用于 OpenClaw 路由的 `groupId` 查询参数。它是 Microsoft Entra 组 ID，而不是传入 Teams 活动中使用的 Bot Framework 会话 ID。

## 私有频道

Bot 在私有频道中的支持有限：

| 功能                        | 标准频道          | 私有频道               |
| --------------------------- | ----------------- | ---------------------- |
| Bot 安装                    | 是                | 有限                   |
| 实时消息（webhook）         | 是                | 可能不起作用           |
| RSC 权限                    | 是                | 可能表现不同           |
| @提及                       | 是                | 如果 bot 可访问        |
| Graph API 历史              | 是                | 是（需要权限）         |

**私有频道不起作用的变通方法：**

1. 对 bot 交互使用标准频道
2. 使用私信——用户始终可以直接向 bot 发消息
3. 使用 Graph API 进行历史访问（需要 `ChannelMessage.Read.All`）

## 故障排除

### 常见问题

- **图像在频道中不显示：** Graph 权限或管理员同意缺失。重新安装 Teams 应用并完全退出/重新打开 Teams。
- **频道中无响应：** 默认需要提及；设置 `channels.msteams.requireMention=false` 或按团队/频道配置。
- **版本不匹配（Teams 仍显示旧清单）：** 删除 + 重新添加应用并完全退出 Teams 以刷新。
- **来自 webhook 的 401 Unauthorized：** 手动测试时（没有 Azure JWT）的预期情况——表示端点可达但认证失败。使用 Azure Web Chat 正确测试。

### 清单上传错误

- **"Icon file cannot be empty"：** 清单引用的图标文件为 0 字节。创建有效的 PNG 图标（`outline.png` 为 32x32，`color.png` 为 192x192）。
- **"webApplicationInfo.Id already in use"：** 应用仍安装在另一个团队/聊天中。先找到并卸载它，或等待 5-10 分钟进行传播。
- **上传时"出了点问题"：** 改为通过 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上传，打开浏览器 DevTools（F12）→ Network 选项卡，检查响应正文获取实际错误。
- **旁加载失败：** 尝试"Upload an app to your org's app catalog"而不是"Upload a custom app"——这通常绕过旁加载限制。

### RSC 权限不起作用

1. 验证 `webApplicationInfo.id` 与 bot 的 App ID 完全匹配
2. 重新上传应用并在团队/聊天中重新安装
3. 检查您的组织管理员是否阻止了 RSC 权限
4. 确认您使用了正确的范围：`ChannelMessage.Read.Group` 用于团队，`ChatMessage.Read.Chat` 用于群组聊天

## 参考资料

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) — Azure Bot 设置指南
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) — 创建/管理 Teams 应用
- [Teams 应用清单架构](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [通过 RSC 接收频道消息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 权限参考](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot 文件处理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（频道/群组需要 Graph）
- [主动消息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) — Teams CLI 用于 bot 管理

## 相关

- [Channels 概述](/channels) — 所有支持的 Channel
- [Pairing](/channels/pairing) — 私信认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
