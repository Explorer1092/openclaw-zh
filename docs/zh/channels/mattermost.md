---
mmh3_hash: "001efa9591a855a25416517a38f61781"
title: "Mattermost"
sidebarTitle: "Mattermost"
summary: "Mattermost bot 设置和 OpenClaw 配置"
read_when:
  - 设置 Mattermost
  - 调试 Mattermost 路由
---

状态：可下载 Plugin（bot token + WebSocket 事件）。支持频道、群组和私信。Mattermost 是可自托管的团队消息平台；产品详情和下载请参见官网 [mattermost.com](https://mattermost.com)。

## 安装

配置 Channel 之前先安装 Mattermost：

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="本地检出">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

详情：[Plugins](/tools/plugin)

## 快速设置

<Steps>
  <Step title="确认 Plugin 可用">
    当前打包的 OpenClaw 版本已内置。旧版/自定义安装可使用以上命令手动添加。
  </Step>
  <Step title="创建 Mattermost bot">
    创建 Mattermost bot 账户并复制 **bot token**。
  </Step>
  <Step title="复制 base URL">
    复制 Mattermost 的 **base URL**（例如 `https://chat.example.com`）。
  </Step>
  <Step title="配置 OpenClaw 并启动 Gateway">
    最小配置：

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

  </Step>
</Steps>

## 原生斜杠命令

原生斜杠命令为可选项。启用后，OpenClaw 通过 Mattermost API 注册 `oc_*` 斜杠命令，并在 Gateway HTTP 服务器上接收回调 POST。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 当 Mattermost 无法直接访问 Gateway 时使用（反向代理/公网 URL）。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="行为说明">
    - `native: "auto"` 对 Mattermost 默认禁用。设置 `native: true` 启用。
    - 省略 `callbackUrl` 时，OpenClaw 从 Gateway host/port + `callbackPath` 推导。
    - 多账户设置中，`commands` 可在顶层或 `channels.mattermost.accounts.<id>.commands` 下设置（账户值覆盖顶层字段）。
    - 命令回调使用 Mattermost 在 OpenClaw 注册 `oc_*` 命令时返回的每命令 Token 进行验证。
    - OpenClaw 在接受每个回调之前刷新当前 Mattermost 命令注册，以确保来自已删除或重新生成斜杠命令的过期 Token 无需重启 Gateway 即可停止被接受。
    - 当注册失败、启动不完整或回调 Token 与已解析命令的注册 Token 不匹配时，斜杠回调失败关闭（一个命令的有效 Token 不能触达不同命令的上游验证）。

  </Accordion>
  <Accordion title="可达性要求">
    回调端点必须从 Mattermost 服务器可达。

    - 除非 Mattermost 与 OpenClaw 运行在同一主机/网络命名空间，否则不要将 `callbackUrl` 设为 `localhost`。
    - 除非该 URL 将 `/api/channels/mattermost/command` 反向代理到 OpenClaw，否则不要将 `callbackUrl` 设为您的 Mattermost base URL。
    - 快速检查：`curl https://<gateway-host>/api/channels/mattermost/command`；GET 应返回 OpenClaw 的 `405 Method Not Allowed`，而非 `404`。

  </Accordion>
  <Accordion title="Mattermost 出站 allowlist">
    如果回调目标是私有/tailnet/内部地址，将 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` 设置为包含回调 host/domain。

    使用 host/domain 条目，而不是完整 URL。

    - 正确：`gateway.tailnet-name.ts.net`
    - 错误：`https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 环境变量（默认账户）

如果您偏好环境变量，在 Gateway 主机上设置：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
环境变量仅适用于**默认**账户（`default`）。其他账户必须使用配置值。

`MATTERMOST_URL` 不能从工作区 `.env` 设置；参见 [工作区 `.env` 文件](/gateway/security)。
</Note>

## 聊天模式

Mattermost 自动响应私信。频道行为由 `chatmode` 控制：

<Tabs>
  <Tab title="oncall（默认）">
    仅在频道中被 @提及时响应。
  </Tab>
  <Tab title="onmessage">
    响应每条频道消息。
  </Tab>
  <Tab title="onchar">
    当消息以触发前缀开头时响应。
  </Tab>
</Tabs>

配置示例：

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

注意：

- `onchar` 仍然响应显式 @提及。
- 旧版配置中的 `channels.mattermost.requireMention` 仍受支持，但推荐使用 `chatmode`。

## 线程和 Session

使用 `channels.mattermost.replyToMode` 控制频道和群组回复是保留在主频道还是在触发帖子下开始线程。

- `off`（默认）：仅在入站帖子已在线程中时才在线程内回复。
- `first`：对于顶层频道/群组帖子，在该帖子下开始线程并将对话路由到线程作用域 Session。
- `all`：目前与 `first` 行为相同。
- 私信忽略此设置，保持非线程状态。

配置示例：

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

注意：

- 线程作用域 Session 使用触发帖子 ID 作为线程根。
- `first` 和 `all` 目前等效，因为 Mattermost 一旦有了线程根，后续块和媒体就继续在同一线程中。

## 访问控制（私信）

- 默认：`channels.mattermost.dmPolicy = "pairing"`（未知发送者收到配对码）。
- 批准方式：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公开私信：`channels.mattermost.dmPolicy="open"` 加 `channels.mattermost.allowFrom=["*"]`。
- `channels.mattermost.allowFrom` 接受 `accessGroup:<name>` 条目。参见 [访问组](/channels/access-groups)。

## 频道（群组）

- 默认：`channels.mattermost.groupPolicy = "allowlist"`（提及门控）。
- 使用 `channels.mattermost.groupAllowFrom` 将发送者加入 allowlist（推荐使用用户 ID）。
- `channels.mattermost.groupAllowFrom` 接受 `accessGroup:<name>` 条目。参见 [访问组](/channels/access-groups)。
- 每频道提及覆盖位于 `channels.mattermost.groups.<channelId>.requireMention` 或 `channels.mattermost.groups["*"].requireMention`（用于默认值）。
- `@username` 匹配是可变的，仅在 `channels.mattermost.dangerouslyAllowNameMatching: true` 时启用。
- 开放频道：`channels.mattermost.groupPolicy="open"`（提及门控）。
- 运行时注意：如果 `channels.mattermost` 完全缺失，运行时回退到 `groupPolicy="allowlist"` 进行群组检查（即使设置了 `channels.defaults.groupPolicy`）。

示例：

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## 出站传递目标

在 `openclaw message send` 或 cron/webhook 中使用以下目标格式：

- `channel:<id>` 用于频道
- `user:<id>` 用于私信
- `@username` 用于私信（通过 Mattermost API 解析）

<Warning>
Mattermost 中的裸不透明 ID（如 `64ifufp...`）**有歧义**（用户 ID 还是频道 ID）。

OpenClaw **用户优先**解析：

- 如果 ID 作为用户存在（`GET /api/v4/users/<id>` 成功），OpenClaw 通过 `/api/v4/channels/direct` 解析直接频道并发送**私信**。
- 否则该 ID 被视为**频道 ID**。

如需确定性行为，始终使用显式前缀（`user:<id>` / `channel:<id>`）。
</Warning>

## DM 频道重试

当 OpenClaw 发送到 Mattermost DM 目标并需要先解析直接频道时，默认会重试瞬时的直接频道创建失败。

使用 `channels.mattermost.dmChannelRetry` 全局调整该行为，或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 针对单个账户。

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

注意：

- 这仅适用于 DM 频道创建（`/api/v4/channels/direct`），不是每个 Mattermost API 调用。
- 重试适用于速率限制、5xx 响应、网络或超时错误等瞬时故障。
- `429` 以外的 4xx 客户端错误被视为永久性错误，不会重试。

## 预览流式传输

Mattermost 将思考、工具活动和部分回复文本流式传输到单个**草稿预览帖子**，在最终答案安全发送时就地最终确认。预览在同一帖子 ID 上更新，而不是用每块消息刷屏。媒体/错误最终答案取消待处理的预览编辑，使用正常传递而不是刷新一次性预览帖子。

通过 `channels.mattermost.streaming` 启用：

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="流式传输模式">
    - `partial` 是通常的选择：一个预览帖子随回复增长被编辑，然后以完整答案最终确认。
    - `block` 在预览帖子内使用追加风格的草稿块。
    - `progress` 在生成时显示状态预览，仅在完成时发布最终答案。
    - `off` 禁用预览流式传输。

  </Accordion>
  <Accordion title="流式传输行为说明">
    - 如果流无法就地最终确认（例如帖子在流式传输中被删除），OpenClaw 回退到发送新的最终帖子，以确保回复不会丢失。
    - 仅推理的载荷在频道帖子中被抑制，包括以 `> Reasoning:` 块引用形式到达的文本。在其他界面设置 `/reasoning on` 可查看思考过程；Mattermost 最终帖子仅保留答案。
    - Channel 映射矩阵参见 [流式传输](/concepts/streaming#preview-streaming-modes)。

  </Accordion>
</AccordionGroup>

## Reaction（message 工具）

- 使用 `message action=react` 加 `channel=mattermost`。
- `messageId` 是 Mattermost 帖子 ID。
- `emoji` 接受 `thumbsup` 或 `:+1:` 等名称（冒号可选）。
- 设置 `remove=true`（布尔值）以移除 Reaction。
- Reaction 添加/移除事件作为系统事件转发到路由的 Agent Session。

示例：

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

配置：

- `channels.mattermost.actions.reactions`：启用/禁用 Reaction 操作（默认 true）。
- 每账户覆盖：`channels.mattermost.accounts.<id>.actions.reactions`。

## 交互按钮（message 工具）

发送带有可点击按钮的消息。用户点击按钮时，Agent 收到选择并可以响应。

普通 Agent 回复也可以包含语义 `presentation` 载荷。OpenClaw 将值按钮渲染为 Mattermost 交互按钮，保持 URL 按钮在消息文本中可见，并将选择菜单降级为可读文本。

通过将 `inlineButtons` 添加到 Channel 功能启用按钮：

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

使用带有 `buttons` 参数的 `message action=send`。Buttons 是二维数组（按钮行）：

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

按钮字段：

<ParamField path="text" type="string" required>
  显示标签。
</ParamField>
<ParamField path="callback_data" type="string" required>
  点击时发回的值（用作操作 ID）。
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  按钮样式。
</ParamField>

用户点击按钮时：

<Steps>
  <Step title="按钮被替换为确认">
    所有按钮被替换为确认行（例如 "✓ **Yes** selected by @user"）。
  </Step>
  <Step title="Agent 收到选择">
    Agent 将选择作为入站消息接收并响应。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="实现说明">
    - 按钮回调使用 HMAC-SHA256 验证（自动，无需配置）。
    - Mattermost 从其 API 响应中删除回调数据（安全功能），因此点击时所有按钮都被移除——不能部分移除。
    - 包含连字符或下划线的操作 ID 会自动清理（Mattermost 路由限制）。

  </Accordion>
  <Accordion title="配置和可达性">
    - `channels.mattermost.capabilities`：功能字符串数组。添加 `"inlineButtons"` 以在 Agent 系统提示中启用按钮工具描述。
    - `channels.mattermost.interactions.callbackBaseUrl`：按钮回调的可选外部 base URL（例如 `https://gateway.example.com`）。当 Mattermost 无法直接访问绑定地址的 Gateway 时使用。
    - 多账户设置中，也可以在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下设置相同字段。
    - 省略 `interactions.callbackBaseUrl` 时，OpenClaw 从 `gateway.customBindHost` + `gateway.port` 推导回调 URL，然后回退到 `http://localhost:<port>`。
    - 可达性规则：按钮回调 URL 必须从 Mattermost 服务器可达。`localhost` 仅在 Mattermost 和 OpenClaw 运行在同一主机/网络命名空间时有效。
    - 如果回调目标是私有/tailnet/内部，将其 host/domain 添加到 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`。

  </Accordion>
</AccordionGroup>

### 直接 API 集成（外部脚本）

外部脚本和 Webhook 可以直接通过 Mattermost REST API 发布按钮，而不必通过 Agent 的 `message` 工具。尽可能使用 Plugin 的 `buildButtonAttachments()`；如果直接发布原始 JSON，请遵循以下规则：

**载荷结构：**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // 仅字母数字——见下文
            type: "button", // 必填，否则点击被静默忽略
            name: "Approve", // 显示标签
            style: "primary", // 可选："default"、"primary"、"danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // 必须与按钮 id 匹配（用于名称查找）
                action: "approve",
                // ... 任何自定义字段 ...
                _token: "<hmac>", // 见下面的 HMAC 部分
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**关键规则**

1. Attachments 放在 `props.attachments` 中，而不是顶层 `attachments`（顶层会被静默忽略）。
2. 每个操作需要 `type: "button"`——没有它，点击会被静默吞掉。
3. 每个操作需要 `id` 字段——Mattermost 忽略没有 ID 的操作。
4. 操作 `id` 必须**仅为字母数字**（`[a-zA-Z0-9]`）。连字符和下划线会破坏 Mattermost 的服务器端操作路由（返回 404）。使用前请删除它们。
5. `context.action_id` 必须与按钮的 `id` 匹配，以便确认消息显示按钮名称（例如 "Approve"）而不是原始 ID。
6. `context.action_id` 是必填的——交互处理程序在没有它时返回 400。

</Warning>

**HMAC Token 生成**

Gateway 使用 HMAC-SHA256 验证按钮点击。外部脚本必须生成与 Gateway 验证逻辑匹配的 Token：

<Steps>
  <Step title="从 bot token 推导密钥">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="构建 context 对象">
    构建包含所有字段（**除** `_token` 外）的 context 对象。
  </Step>
  <Step title="按键排序序列化">
    使用**排序键**和**无空格**序列化（Gateway 使用按键排序的 `JSON.stringify`，产生紧凑输出）。
  </Step>
  <Step title="签名载荷">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="添加 Token">
    将生成的十六进制摘要作为 `_token` 添加到 context 中。
  </Step>
</Steps>

Python 示例：

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="常见 HMAC 陷阱">
    - Python 的 `json.dumps` 默认添加空格（`{"key": "val"}`）。使用 `separators=(",", ":")` 匹配 JavaScript 的紧凑输出（`{"key":"val"}`）。
    - 始终签名**所有** context 字段（减去 `_token`）。Gateway 在签名前删除 `_token`，然后签名剩余的所有内容。对子集签名会导致静默验证失败。
    - 使用 `sort_keys=True`——Gateway 在签名前对键排序，Mattermost 在存储载荷时可能会重新排序 context 字段。
    - 从 bot token 推导密钥（确定性的），而不是随机字节。创建按钮的进程和验证的 Gateway 必须使用相同的密钥。

  </Accordion>
</AccordionGroup>

## 目录适配器

Mattermost Plugin 包含一个目录适配器，通过 Mattermost API 解析频道和用户名称。这使得 `openclaw message send` 和 cron/webhook 传递中可以使用 `#channel-name` 和 `@username` 目标。

无需配置——适配器使用账户配置中的 bot token。

## 多账户

Mattermost 支持 `channels.mattermost.accounts` 下的多个账户：

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## 故障排除

<AccordionGroup>
  <Accordion title="频道中无回复">
    确保 bot 在频道中并提及它（oncall），使用触发前缀（onchar），或设置 `chatmode: "onmessage"`。
  </Accordion>
  <Accordion title="认证或多账户错误">
    - 检查 bot token、base URL 以及账户是否已启用。
    - 多账户问题：环境变量仅适用于 `default` 账户。

  </Accordion>
  <Accordion title="原生斜杠命令失败">
    - `Unauthorized: invalid command token.`：OpenClaw 不接受回调 Token。典型原因：
      - 斜杠命令注册失败或启动时只完成了一部分
      - 回调到达了错误的 Gateway/账户
      - Mattermost 仍有旧命令指向之前的回调目标
      - Gateway 重启后未重新激活斜杠命令
    - 如果原生斜杠命令停止工作，检查日志中是否有 `mattermost: failed to register slash commands` 或 `mattermost: native slash commands enabled but no commands could be registered`。
    - 如果省略了 `callbackUrl` 且日志警告回调解析为 `http://127.0.0.1:18789/...`，该 URL 可能仅在 Mattermost 与 OpenClaw 运行在同一主机/网络命名空间时可达。改为设置显式的可从外部访问的 `commands.callbackUrl`。

  </Accordion>
  <Accordion title="按钮问题">
    - 按钮显示为白色方块：Agent 可能发送了格式错误的按钮数据。检查每个按钮是否都有 `text` 和 `callback_data` 字段。
    - 按钮渲染但点击无响应：验证 Mattermost 服务器配置中的 `AllowedUntrustedInternalConnections` 包含 `127.0.0.1 localhost`，且 ServiceSettings 中的 `EnablePostActionIntegration` 为 `true`。
    - 按钮点击返回 404：按钮 `id` 可能包含连字符或下划线。Mattermost 的操作路由器在非字母数字 ID 上会出错。仅使用 `[a-zA-Z0-9]`。
    - Gateway 日志 `invalid _token`：HMAC 不匹配。检查是否签名了所有 context 字段（而不是子集），使用了排序键，以及使用了紧凑 JSON（无空格）。参见上面的 HMAC 部分。
    - Gateway 日志 `missing _token in context`：`_token` 字段不在按钮的 context 中。构建集成载荷时确保包含它。
    - 确认显示原始 ID 而非按钮名称：`context.action_id` 与按钮的 `id` 不匹配。将两者设置为相同的清理值。
    - Agent 不知道按钮：将 `capabilities: ["inlineButtons"]` 添加到 Mattermost Channel 配置中。

  </Accordion>
</AccordionGroup>

## 相关

- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Channels 概述](/channels) — 所有支持的 Channel
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Pairing](/channels/pairing) — 私信认证和配对流程
- [Security](/gateway/security) — 访问模型和安全加固
