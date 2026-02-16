---
title: "Microsoft Teams (插件)"
sidebarTitle: "Microsoft Teams"
mmh3_hash: "8093a88e6d5a4bfc4039fc938c24a63f"
summary: "Microsoft Teams bot 支持状态、功能和配置"
read_when: ["Working on MS Teams channel features"]
---
# Microsoft Teams (插件)

> "Abandon all hope, ye who enter here."


更新时间: 2026-01-21

状态: 支持文本 + DM 附件;频道/群组文件发送需要 `sharePointSiteId` + Graph 权限(参见 [在群聊中发送文件](#sending-files-in-group-chats))。投票通过 Adaptive Cards 发送。

## 需要插件
Microsoft Teams 作为插件发布,不包含在核心安装中。

**重大变更 (2026.1.15):** MS Teams 已从核心移出。如果您使用它,必须安装插件。

说明: 保持核心安装更轻量,并允许 MS Teams 依赖项独立更新。

通过 CLI 安装(npm registry):
```bash
openclaw plugins install @openclaw/msteams
```

本地检出(从 git 仓库运行时):
```bash
openclaw plugins install ./extensions/msteams
```

如果您在配置/入门期间选择 Teams 并检测到 git 检出,
OpenClaw 将自动提供本地安装路径。

详情: [插件](/tools/plugin)

## 快速设置(初学者)
1) 安装 Microsoft Teams 插件。
2) 创建一个 **Azure Bot** (App ID + client secret + tenant ID)。
3) 使用这些凭据配置 OpenClaw。
4) 通过公共 URL 或隧道公开 `/api/messages` (默认端口 3978)。
5) 安装 Teams 应用包并启动网关。

最小配置:
```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" }
    }
  }
}
```
注意: 群聊默认被阻止(`channels.msteams.groupPolicy: "allowlist"`)。要允许群组回复,设置 `channels.msteams.groupAllowFrom` (或使用 `groupPolicy: "open"` 允许任何成员,需要提及)。

## 目标
- 通过 Teams DM、群聊或频道与 OpenClaw 对话。
- 保持路由确定性: 回复始终返回到消息到达的频道。
- 默认安全频道行为(除非配置,否则需要提及)。

## 配置写入
默认情况下,Microsoft Teams 允许写入由 `/config set|unset` 触发的配置更新(需要 `commands.config: true`)。

禁用方法:
```json5
{
  channels: { msteams: { configWrites: false } }
}
```

## 访问控制 (DM + 群组)

**DM 访问**
- 默认: `channels.msteams.dmPolicy = "pairing"`。未知发送者被忽略,直到批准。
- `channels.msteams.allowFrom` 接受 AAD 对象 ID、UPN 或显示名称。当凭据允许时,向导通过 Microsoft Graph 将名称解析为 ID。

**群组访问**
- 默认: `channels.msteams.groupPolicy = "allowlist"` (阻止,除非添加 `groupAllowFrom`)。使用 `channels.defaults.groupPolicy` 在未设置时覆盖默认值。
- `channels.msteams.groupAllowFrom` 控制哪些发送者可以在群聊/频道中触发(回退到 `channels.msteams.allowFrom`)。
- 设置 `groupPolicy: "open"` 以允许任何成员(仍然默认需要提及)。
- 要**不允许任何频道**,设置 `channels.msteams.groupPolicy: "disabled"`。

示例:
```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"]
    }
  }
}
```

**Teams + 频道白名单**
- 通过在 `channels.msteams.teams` 下列出团队和频道来限定群组/频道回复的范围。
- 键可以是团队 ID 或名称;频道键可以是对话 ID 或名称。
- 当 `groupPolicy="allowlist"` 且存在团队白名单时,仅接受列出的团队/频道(需要提及)。
- 配置向导接受 `Team/Channel` 条目并为您存储它们。
- 启动时,OpenClaw 将团队/频道和用户白名单名称解析为 ID(当 Graph 权限允许时)
  并记录映射;未解析的条目按输入保留。

示例:
```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            "General": { requireMention: true }
          }
        }
      }
    }
  }
}
```

## 工作原理
1. 安装 Microsoft Teams 插件。
2. 创建一个 **Azure Bot** (App ID + secret + tenant ID)。
3. 构建一个引用 bot 并包含以下 RSC 权限的 **Teams 应用包**。
4. 将 Teams 应用上传/安装到团队(或用于 DM 的个人范围)。
5. 在 `~/.openclaw/openclaw.json` 中配置 `msteams` (或环境变量)并启动网关。
6. 网关默认在 `/api/messages` 上监听 Bot Framework webhook 流量。

## Azure Bot 设置(先决条件)

在配置 OpenClaw 之前,您需要创建 Azure Bot 资源。

### 步骤 1: 创建 Azure Bot

1. 前往 [创建 Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填写**基础**选项卡:

   | 字段 | 值 |
   |-------|-------|
   | **Bot handle** | 您的 bot 名称,例如 `openclaw-msteams` (必须唯一) |
   | **Subscription** | 选择您的 Azure 订阅 |
   | **Resource group** | 创建新的或使用现有的 |
   | **Pricing tier** | **Free** 用于开发/测试 |
   | **Type of App** | **Single Tenant** (推荐 - 见下面的注意) |
   | **Creation type** | **Create new Microsoft App ID** |

> **弃用通知:** 2025-07-31 之后不再创建新的多租户 bot。新 bot 使用 **Single Tenant**。

3. 点击 **Review + create** → **Create** (等待约 1-2 分钟)

### 步骤 2: 获取凭据

1. 前往您的 Azure Bot 资源 → **Configuration**
2. 复制 **Microsoft App ID** → 这是您的 `appId`
3. 点击 **Manage Password** → 前往应用注册
4. 在 **Certificates & secrets** 下 → **New client secret** → 复制 **Value** → 这是您的 `appPassword`
5. 前往 **Overview** → 复制 **Directory (tenant) ID** → 这是您的 `tenantId`

### 步骤 3: 配置消息端点

1. 在 Azure Bot → **Configuration** 中
2. 将 **Messaging endpoint** 设置为您的 webhook URL:
   - 生产环境: `https://your-domain.com/api/messages`
   - 本地开发: 使用隧道(见下面的[本地开发](#local-development-tunneling))

### 步骤 4: 启用 Teams 频道

1. 在 Azure Bot → **Channels** 中
2. 点击 **Microsoft Teams** → Configure → Save
3. 接受服务条款

## 本地开发(隧道)

Teams 无法访问 `localhost`。使用隧道进行本地开发:

**选项 A: ngrok**
```bash
ngrok http 3978
# 复制 https URL,例如 https://abc123.ngrok.io
# 将消息端点设置为: https://abc123.ngrok.io/api/messages
```

**选项 B: Tailscale Funnel**
```bash
tailscale funnel 3978
# 使用您的 Tailscale funnel URL 作为消息端点
```

## Teams Developer Portal (替代方案)

除了手动创建 manifest ZIP,您可以使用 [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. 点击 **+ New app**
2. 填写基本信息(名称、描述、开发者信息)
3. 前往 **App features** → **Bot**
4. 选择 **Enter a bot ID manually** 并粘贴您的 Azure Bot App ID
5. 勾选范围: **Personal**、**Team**、**Group Chat**
6. 点击 **Distribute** → **Download app package**
7. 在 Teams 中: **Apps** → **Manage your apps** → **Upload a custom app** → 选择 ZIP

这通常比手动编辑 JSON manifest 更容易。

## 测试 Bot

**选项 A: Azure Web Chat (首先验证 webhook)**
1. 在 Azure Portal → 您的 Azure Bot 资源 → **Test in Web Chat**
2. 发送消息 - 您应该看到响应
3. 这在 Teams 设置之前确认您的 webhook 端点工作正常

**选项 B: Teams (应用安装后)**
1. 安装 Teams 应用(旁加载或组织目录)
2. 在 Teams 中找到 bot 并发送 DM
3. 检查网关日志以查看传入活动

## 设置(最小纯文本)
1. **安装 Microsoft Teams 插件**
   - 从 npm: `openclaw plugins install @openclaw/msteams`
   - 从本地检出: `openclaw plugins install ./extensions/msteams`

2. **Bot 注册**
   - 创建 Azure Bot(见上文)并记录:
     - App ID
     - Client secret (App password)
     - Tenant ID (单租户)

3. **Teams 应用 manifest**
   - 包含一个 `bot` 条目,其中 `botId = <App ID>`。
   - 范围: `personal`、`team`、`groupChat`。
   - `supportsFiles: true` (个人范围文件处理所需)。
   - 添加 RSC 权限(下文)。
   - 创建图标: `outline.png` (32x32) 和 `color.png` (192x192)。
   - 将所有三个文件一起压缩: `manifest.json`、`outline.png`、`color.png`。

4. **配置 OpenClaw**
   ```json
   {
     "msteams": {
       "enabled": true,
       "appId": "<APP_ID>",
       "appPassword": "<APP_PASSWORD>",
       "tenantId": "<TENANT_ID>",
       "webhook": { "port": 3978, "path": "/api/messages" }
     }
   }
   ```

   您也可以使用环境变量代替配置键:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **Bot 端点**
   - 将 Azure Bot Messaging Endpoint 设置为:
     - `https://<host>:3978/api/messages` (或您选择的路径/端口)。

6. **运行网关**
   - 当插件已安装且存在带有凭据的 `msteams` 配置时,Teams 频道自动启动。

## 历史上下文
- `channels.msteams.historyLimit` 控制有多少最近的频道/群组消息被包装到提示中。
- 回退到 `messages.groupChat.historyLimit`。设置 `0` 禁用(默认 50)。
- DM 历史可以用 `channels.msteams.dmHistoryLimit` 限制(用户回合)。每用户覆盖: `channels.msteams.dms["<user_id>"].historyLimit`。

## 当前 Teams RSC 权限 (Manifest)
这些是我们 Teams 应用 manifest 中的**现有 resourceSpecific 权限**。它们仅适用于安装应用的团队/聊天内。

**对于频道(团队范围):**
- `ChannelMessage.Read.Group` (Application) - 接收所有频道消息,无需 @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**对于群聊:**
- `ChatMessage.Read.Chat` (Application) - 接收所有群聊消息,无需 @mention

## Teams Manifest 示例(已编辑)
最小、有效的示例,包含所需字段。替换 ID 和 URL。

```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  "manifestVersion": "1.23",
  "version": "1.0.0",
  "id": "00000000-0000-0000-0000-000000000000",
  "name": { "short": "OpenClaw" },
  "developer": {
    "name": "Your Org",
    "websiteUrl": "https://example.com",
    "privacyUrl": "https://example.com/privacy",
    "termsOfUseUrl": "https://example.com/terms"
  },
  "description": { "short": "OpenClaw in Teams", "full": "OpenClaw in Teams" },
  "icons": { "outline": "outline.png", "color": "color.png" },
  "accentColor": "#5B6DEF",
  "bots": [
    {
      "botId": "11111111-1111-1111-1111-111111111111",
      "scopes": ["personal", "team", "groupChat"],
      "isNotificationOnly": false,
      "supportsCalling": false,
      "supportsVideo": false,
      "supportsFiles": true
    }
  ],
  "webApplicationInfo": {
    "id": "11111111-1111-1111-1111-111111111111"
  },
  "authorization": {
    "permissions": {
      "resourceSpecific": [
        { "name": "ChannelMessage.Read.Group", "type": "Application" },
        { "name": "ChannelMessage.Send.Group", "type": "Application" },
        { "name": "Member.Read.Group", "type": "Application" },
        { "name": "Owner.Read.Group", "type": "Application" },
        { "name": "ChannelSettings.Read.Group", "type": "Application" },
        { "name": "TeamMember.Read.Group", "type": "Application" },
        { "name": "TeamSettings.Read.Group", "type": "Application" },
        { "name": "ChatMessage.Read.Chat", "type": "Application" }
      ]
    }
  }
}
```

### Manifest 注意事项(必填字段)
- `bots[].botId` **必须**匹配 Azure Bot App ID。
- `webApplicationInfo.id` **必须**匹配 Azure Bot App ID。
- `bots[].scopes` 必须包含您计划使用的表面(`personal`、`team`、`groupChat`)。
- `bots[].supportsFiles: true` 是个人范围文件处理所需的。
- `authorization.permissions.resourceSpecific` 如果您想要频道流量,必须包含频道读/发送。

### 更新现有应用

要更新已安装的 Teams 应用(例如,添加 RSC 权限):

1. 使用新设置更新您的 `manifest.json`
2. **增加 `version` 字段**(例如,`1.0.0` → `1.1.0`)
3. **重新压缩** manifest 和图标(`manifest.json`、`outline.png`、`color.png`)
4. 上传新的 zip:
   - **选项 A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → 找到您的应用 → Upload new version
   - **选项 B (旁加载):** 在 Teams 中 → Apps → Manage your apps → Upload a custom app
5. **对于团队频道:** 在每个团队中重新安装应用,以使新权限生效
6. **完全退出并重新启动 Teams**(不只是关闭窗口)以清除缓存的应用元数据

## 功能: 仅 RSC vs Graph

### 仅使用 **Teams RSC**(已安装应用,无 Graph API 权限)
有效:
- 读取频道消息**文本**内容。
- 发送频道消息**文本**内容。
- 接收**个人(DM)**文件附件。

无效:
- 频道/群组**图像或文件内容**(有效负载仅包含 HTML 存根)。
- 下载存储在 SharePoint/OneDrive 中的附件。
- 读取消息历史(超出实时 webhook 事件)。

### 使用 **Teams RSC + Microsoft Graph Application 权限**
添加:
- 下载托管内容(粘贴到消息中的图像)。
- 下载存储在 SharePoint/OneDrive 中的文件附件。
- 通过 Graph 读取频道/聊天消息历史。

### RSC vs Graph API

| 功能 | RSC 权限 | Graph API |
|------------|-----------------|-----------|
| **实时消息** | 是(通过 webhook) | 否(仅轮询) |
| **历史消息** | 否 | 是(可以查询历史) |
| **设置复杂性** | 仅应用 manifest | 需要管理员同意 + token 流 |
| **离线工作** | 否(必须运行) | 是(随时查询) |

**底线:** RSC 用于实时监听; Graph API 用于历史访问。要在离线时赶上错过的消息,您需要带有 `ChannelMessage.Read.All` 的 Graph API(需要管理员同意)。

## 启用 Graph 的媒体 + 历史(频道需要)
如果您需要**频道**中的图像/文件或想要获取**消息历史**,您必须启用 Microsoft Graph 权限并授予管理员同意。

1. 在 Entra ID (Azure AD) **App Registration** 中,添加 Microsoft Graph **Application 权限**:
   - `ChannelMessage.Read.All` (频道附件 + 历史)
   - `Chat.Read.All` 或 `ChatMessage.Read.All` (群聊)
2. 为租户**授予管理员同意**。
3. 增加 Teams 应用 **manifest 版本**,重新上传并在 Teams 中**重新安装应用**。
4. **完全退出并重新启动 Teams** 以清除缓存的应用元数据。

**用户提及的附加权限:** 用户 @mentions 对对话中的用户开箱即用。但是,如果您想动态搜索并提及**不在当前对话中**的用户,请添加 `User.Read.All` (Application) 权限并授予管理员同意。

## 已知限制

### Webhook 超时
Teams 通过 HTTP webhook 传递消息。如果处理时间过长(例如,LLM 响应慢),您可能会看到:
- 网关超时
- Teams 重试消息(导致重复)
- 丢失的回复

OpenClaw 通过快速返回并主动发送回复来处理这个问题,但非常慢的响应仍可能导致问题。

### 格式化
Teams markdown 比 Slack 或 Discord 更受限:
- 基本格式有效: **粗体**、*斜体*、`代码`、链接
- 复杂 markdown(表格、嵌套列表)可能无法正确呈现
- 支持 Adaptive Cards 用于投票和任意卡片发送(见下文)

## 配置
关键设置(共享频道模式见 `/gateway/configuration`):

- `channels.msteams.enabled`: 启用/禁用频道。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`: bot 凭据。
- `channels.msteams.webhook.port` (默认 `3978`)
- `channels.msteams.webhook.path` (默认 `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (默认: pairing)
- `channels.msteams.allowFrom`: DM 白名单(AAD 对象 ID、UPN 或显示名称)。当 Graph 访问可用时,向导在设置期间将名称解析为 ID。
- `channels.msteams.textChunkLimit`: 出站文本块大小。
- `channels.msteams.chunkMode`: `length` (默认)或 `newline` 在长度分块之前在空行(段落边界)上拆分。
- `channels.msteams.mediaAllowHosts`: 入站附件主机白名单(默认为 Microsoft/Teams 域)。
- `channels.msteams.mediaAuthAllowHosts`: 媒体重试时附加 Authorization 标头的 allowlist(默认为 Graph + Bot Framework 主机)。
- `channels.msteams.requireMention`: 在频道/群组中需要 @mention (默认 true)。
- `channels.msteams.replyStyle`: `thread | top-level` (见[回复样式](#reply-style-threads-vs-posts))。
- `channels.msteams.teams.<teamId>.replyStyle`: 每团队覆盖。
- `channels.msteams.teams.<teamId>.requireMention`: 每团队覆盖。
- `channels.msteams.teams.<teamId>.tools`: 默认每团队工具策略覆盖(`allow`/`deny`/`alsoAllow`),当缺少频道覆盖时使用。
- `channels.msteams.teams.<teamId>.toolsBySender`: 默认每团队每发送者工具策略覆盖(支持 `"*"` 通配符)。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: 每频道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: 每频道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: 每频道工具策略覆盖(`allow`/`deny`/`alsoAllow`)。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: 每频道每发送者工具策略覆盖(支持 `"*"` 通配符)。
- `channels.msteams.sharePointSiteId`: 群聊/频道中文件上传的 SharePoint 站点 ID(见[在群聊中发送文件](#sending-files-in-group-chats))。

## 路由 & 会话
- 会话键遵循标准 agent 格式(见 [/concepts/session](/concepts/session)):
  - 直接消息共享主会话(`agent:<agentId>:<mainKey>`)。
  - 频道/群组消息使用对话 id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回复样式: Threads vs Posts

Teams 最近在同一底层数据模型上引入了两种频道 UI 样式:

| 样式 | 描述 | 推荐 `replyStyle` |
|-------|-------------|--------------------------|
| **Posts** (经典) | 消息显示为卡片,下方有线程回复 | `thread` (默认) |
| **Threads** (类似 Slack) | 消息线性流动,更像 Slack | `top-level` |

**问题:** Teams API 不公开频道使用哪种 UI 样式。如果您使用错误的 `replyStyle`:
- `thread` 在 Threads 样式频道中 → 回复显示嵌套得很尴尬
- `top-level` 在 Posts 样式频道中 → 回复显示为单独的顶级帖子而不是在线程中

**解决方案:** 根据频道的设置方式配置每频道的 `replyStyle`:

```json
{
  "msteams": {
    "replyStyle": "thread",
    "teams": {
      "19:abc...@thread.tacv2": {
        "channels": {
          "19:xyz...@thread.tacv2": {
            "replyStyle": "top-level"
          }
        }
      }
    }
  }
}
```

## 附件 & 图像

**当前限制:**
- **DM:** 图像和文件附件通过 Teams bot 文件 API 工作。
- **频道/群组:** 附件存储在 M365 存储(SharePoint/OneDrive)中。webhook 有效负载仅包含 HTML 存根,而不是实际文件字节。**需要 Graph API 权限**才能下载频道附件。

没有 Graph 权限,带有图像的频道消息将仅作为文本接收(bot 无法访问图像内容)。
默认情况下,OpenClaw 仅从 Microsoft/Teams 主机名下载媒体。使用 `channels.msteams.mediaAllowHosts` 覆盖(使用 `["*"]` 允许任何主机)。

## 在群聊中发送文件

Bot 可以使用 FileConsentCard 流在 DM 中发送文件(内置)。但是,**在群聊/频道中发送文件**需要额外设置:

| 上下文 | 文件发送方式 | 所需设置 |
|---------|-------------------|--------------|
| **DM** | FileConsentCard → 用户接受 → bot 上传 | 开箱即用 |
| **群聊/频道** | 上传到 SharePoint → 共享链接 | 需要 `sharePointSiteId` + Graph 权限 |
| **图像(任何上下文)** | Base64 编码内联 | 开箱即用 |

### 为什么群聊需要 SharePoint

Bot 没有个人 OneDrive 驱动器(`/me/drive` Graph API 端点对应用程序身份不起作用)。要在群聊/频道中发送文件,bot 上传到 **SharePoint 站点**并创建共享链接。

### 设置

1. **在 Entra ID (Azure AD) → App Registration 中添加 Graph API 权限**:
   - `Sites.ReadWrite.All` (Application) - 上传文件到 SharePoint
   - `Chat.Read.All` (Application) - 可选,启用每用户共享链接

2. 为租户**授予管理员同意**。

3. **获取您的 SharePoint 站点 ID:**
   ```bash
   # 通过 Graph Explorer 或带有有效 token 的 curl:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 示例: 对于站点在 "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # 响应包含: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **配置 OpenClaw:**
   ```json5
   {
     channels: {
       msteams: {
         // ... 其他配置 ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2"
       }
     }
   }
   ```

### 共享行为

| 权限 | 共享行为 |
|------------|------------------|
| 仅 `Sites.ReadWrite.All` | 组织范围共享链接(组织中的任何人都可以访问) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 每用户共享链接(仅聊天成员可以访问) |

每用户共享更安全,因为只有聊天参与者可以访问文件。如果缺少 `Chat.Read.All` 权限,bot 回退到组织范围共享。

### 回退行为

| 场景 | 结果 |
|----------|--------|
| 群聊 + 文件 + 已配置 `sharePointSiteId` | 上传到 SharePoint,发送共享链接 |
| 群聊 + 文件 + 无 `sharePointSiteId` | 尝试 OneDrive 上传(可能失败),仅发送文本 |
| 个人聊天 + 文件 | FileConsentCard 流(无需 SharePoint 即可工作) |
| 任何上下文 + 图像 | Base64 编码内联(无需 SharePoint 即可工作) |

### 文件存储位置

上传的文件存储在配置的 SharePoint 站点默认文档库的 `/OpenClawShared/` 文件夹中。

## 投票 (Adaptive Cards)
OpenClaw 将 Teams 投票作为 Adaptive Cards 发送(没有原生 Teams 投票 API)。

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票由网关记录在 `~/.openclaw/msteams-polls.json` 中。
- 网关必须保持在线才能记录投票。
- 投票尚未自动发布结果摘要(如需要,检查存储文件)。

## Adaptive Cards (任意)
使用 `message` 工具或 CLI 向 Teams 用户或对话发送任何 Adaptive Card JSON。

`card` 参数接受 Adaptive Card JSON 对象。当提供 `card` 时,消息文本是可选的。

**Agent 工具:**
```json
{
  "action": "send",
  "channel": "msteams",
  "target": "user:<id>",
  "card": {
    "type": "AdaptiveCard",
    "version": "1.5",
    "body": [{"type": "TextBlock", "text": "Hello!"}]
  }
}
```

**CLI:**
```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

参见 [Adaptive Cards 文档](https://adaptivecards.io/)了解卡片架构和示例。有关目标格式详细信息,请参见下面的[目标格式](#target-formats)。

## 目标格式

MSTeams 目标使用前缀来区分用户和对话:

| 目标类型 | 格式 | 示例 |
|-------------|--------|---------|
| 用户(按 ID) | `user:<aad-object-id>` | `user:40a1a0ed-4ff2-4164-a219-55518990c197` |
| 用户(按名称) | `user:<display-name>` | `user:John Smith` (需要 Graph API) |
| 群组/频道 | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2` |
| 群组/频道(原始) | `<conversation-id>` | `19:abc123...@thread.tacv2` (如果包含 `@thread`) |

**CLI 示例:**
```bash
# 按 ID 发送给用户
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 按显示名称发送给用户(触发 Graph API 查找)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# 发送到群聊或频道
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# 将 Adaptive Card 发送到对话
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**Agent 工具示例:**
```json
{
  "action": "send",
  "channel": "msteams",
  "target": "user:John Smith",
  "message": "Hello!"
}
```

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "conversation:19:abc...@thread.tacv2",
  "card": {"type": "AdaptiveCard", "version": "1.5", "body": [{"type": "TextBlock", "text": "Hello"}]}
}
```

注意: 没有 `user:` 前缀,名称默认为群组/团队解析。按显示名称定位人员时始终使用 `user:`。

## 主动消息
- 主动消息仅在用户交互**之后**才可能,因为我们此时存储对话引用。
- 有关 `dmPolicy` 和白名单控制,请参见 `/gateway/configuration`。

## 团队和频道 ID(常见陷阱)

Teams URL 中的 `groupId` 查询参数**不是**用于配置的团队 ID。改为从 URL 路径中提取 ID:

**团队 URL:**
```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    团队 ID (URL 解码此部分)
```

**频道 URL:**
```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      频道 ID (URL 解码此部分)
```

**对于配置:**
- 团队 ID = `/team/` 之后的路径段(URL 解码,例如 `19:Bk4j...@thread.tacv2`)
- 频道 ID = `/channel/` 之后的路径段(URL 解码)
- **忽略** `groupId` 查询参数

## 私有频道

Bot 在私有频道中的支持有限:

| 功能 | 标准频道 | 私有频道 |
|---------|-------------------|------------------|
| Bot 安装 | 是 | 有限 |
| 实时消息(webhook) | 是 | 可能不工作 |
| RSC 权限 | 是 | 可能行为不同 |
| @mentions | 是 | 如果 bot 可访问 |
| Graph API 历史 | 是 | 是(带权限) |

**如果私有频道不工作的解决方法:**
1. 使用标准频道进行 bot 交互
2. 使用 DM - 用户始终可以直接向 bot 发送消息
3. 使用 Graph API 进行历史访问(需要 `ChannelMessage.Read.All`)

## 故障排除

### 常见问题

- **频道中图像不显示:** Graph 权限或管理员同意缺失。重新安装 Teams 应用并完全退出/重新打开 Teams。
- **频道中无响应:** 默认需要提及;设置 `channels.msteams.requireMention=false` 或配置每团队/频道。
- **版本不匹配(Teams 仍显示旧 manifest):** 删除 + 重新添加应用并完全退出 Teams 以刷新。
- **来自 webhook 的 401 Unauthorized:** 在没有 Azure JWT 的情况下手动测试时预期 - 意味着端点可达但认证失败。使用 Azure Web Chat 正确测试。

### Manifest 上传错误

- **"Icon file cannot be empty":** manifest 引用的图标文件为 0 字节。创建有效的 PNG 图标(32x32 用于 `outline.png`,192x192 用于 `color.png`)。
- **"webApplicationInfo.Id already in use":** 应用仍安装在另一个团队/聊天中。首先找到并卸载它,或等待 5-10 分钟进行传播。
- **上传时"Something went wrong":** 通过 https://admin.teams.microsoft.com 上传,打开浏览器 DevTools (F12) → Network 选项卡,并检查响应正文以获取实际错误。
- **旁加载失败:** 尝试"Upload an app to your org's app catalog"而不是"Upload a custom app" - 这通常绕过旁加载限制。

### RSC 权限不工作

1. 验证 `webApplicationInfo.id` 完全匹配您的 bot 的 App ID
2. 重新上传应用并在团队/聊天中重新安装
3. 检查您的组织管理员是否阻止了 RSC 权限
4. 确认您使用的是正确的范围: 团队使用 `ChannelMessage.Read.Group`,群聊使用 `ChatMessage.Read.Chat`

## 参考资料
- [创建 Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 设置指南
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - 创建/管理 Teams 应用
- [Teams 应用 manifest 架构](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [使用 RSC 接收频道消息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 权限参考](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot 文件处理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (频道/群组需要 Graph)
- [主动消息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
