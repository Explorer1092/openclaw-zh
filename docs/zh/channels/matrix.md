---
mmh3_hash: "4b0dbc538318a8ceebcf01e46fe99b36"
title: "Matrix"
summary: "Matrix 支持状态、设置和配置示例"
read_when:
  - 在 OpenClaw 中设置 Matrix
  - 配置 Matrix E2EE 和验证
---

# Matrix

Matrix 是 OpenClaw 的内置 Channel Plugin。
它使用官方 `matrix-js-sdk`，支持私信、房间、话题串、媒体、表情反应、投票、位置和 E2EE。

## 内置插件

Matrix 作为内置插件随当前 OpenClaw 版本提供，正常打包的构建无需单独安装。

如果您使用的是旧版本或不包含 Matrix 的自定义安装，请手动安装：

从 npm 安装：

```bash
openclaw plugins install @openclaw/matrix
```

从本地检出安装：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

详情参见[插件](/tools/plugin)。

## 设置

1. 确认 Matrix 插件可用。
   - 当前打包的 OpenClaw 版本已内置。
   - 旧版/自定义安装可使用上述命令手动添加。
2. 在您的 Homeserver 上创建 Matrix 账户。
3. 配置 `channels.matrix`，使用以下之一：
   - `homeserver` + `accessToken`，或
   - `homeserver` + `userId` + `password`。
4. 重启 Gateway。
5. 向机器人发送私信或邀请它加入房间。
   - 全新的 Matrix 邀请仅在 `channels.matrix.autoJoin` 允许时才有效。

交互式设置：

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 向导会询问：

- Homeserver URL
- 认证方式：访问令牌或密码
- 用户 ID（密码认证时）
- 可选设备名称
- 是否启用 E2EE
- 是否配置房间访问和邀请自动加入

向导行为说明：

- 如果 Matrix 认证环境变量已存在，且所选账户在配置中尚未保存认证，向导提供环境变量快捷方式以将认证保留在环境变量中。
- 账户名称被规范化为账户 ID。例如，`Ops Bot` 变为 `ops-bot`。
- 私信 allowlist 条目直接接受 `@user:server`；显示名称仅在实时目录查找找到唯一精确匹配时有效。
- 房间 allowlist 条目直接接受房间 ID 和别名。优先使用 `!room:server` 或 `#alias:server`；运行时 allowlist 解析会忽略未解析的名称。
- 在邀请自动加入 allowlist 模式下，仅使用稳定的邀请目标：`!roomId:server`、`#alias:server` 或 `*`。普通房间名称将被拒绝。
- 要在保存前解析房间名称，使用 `openclaw channels resolve --channel matrix "Project Room"`。

<Warning>
`channels.matrix.autoJoin` 默认为 `off`。

如果未设置，机器人不会加入被邀请的房间或全新的私信式邀请，因此除非您先手动加入，否则它不会出现在新群组或被邀请的私信中。

将 `autoJoin: "allowlist"` 与 `autoJoinAllowlist` 一起设置以限制接受哪些邀请，或设置 `autoJoin: "always"` 以加入所有邀请。

在 `allowlist` 模式下，`autoJoinAllowlist` 仅接受 `!roomId:server`、`#alias:server` 或 `*`。
</Warning>

allowlist 示例：

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

加入所有邀请：

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

最小令牌配置：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

密码配置（登录后令牌会被缓存）：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix 将缓存的凭据存储在 `~/.openclaw/credentials/matrix/`。
默认账户使用 `credentials.json`；命名账户使用 `credentials-<account>.json`。
当缓存凭据存在时，OpenClaw 在设置、doctor 和 Channel 状态发现中将 Matrix 视为已配置，即使当前认证未直接设置在配置中。

环境变量（配置键未设置时使用）：

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

非默认账户使用账户级环境变量：

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

账户 `ops` 的示例：

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

规范化账户 ID `ops-bot` 使用：

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix 对账户 ID 中的标点进行转义，以避免环境变量命名冲突。
例如，`-` 变为 `_X2D_`，因此 `ops-prod` 映射为 `MATRIX_OPS_X2D_PROD_*`。

只有当那些认证环境变量已存在，且所选账户在配置中尚未保存 Matrix 认证时，交互式向导才会提供环境变量快捷方式。

## 配置示例

这是一个包含私信配对、房间 allowlist 和 E2EE 的实用基线配置：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin` 适用于所有 Matrix 邀请，包括私信式邀请。OpenClaw 在邀请时无法可靠地将受邀房间分类为私信或群组，因此所有邀请首先通过 `autoJoin`。`dm.policy` 在机器人加入且房间被分类为私信后生效。

## 流式预览

Matrix 回复流式传输是可选的。

当您希望 OpenClaw 发送单个实时预览回复、在模型生成文本时就地编辑该预览，然后在回复完成时最终确定时，将 `channels.matrix.streaming` 设置为 `"partial"`：

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` 是默认值。OpenClaw 等待最终回复并一次性发送。
- `streaming: "partial"` 使用普通 Matrix 文本消息为当前助手块创建一个可编辑的预览消息。这保留了 Matrix 的传统预览优先通知行为，因此标准客户端可能会在第一条流式预览文本而非完成的块上发送通知。
- `streaming: "quiet"` 为当前助手块创建一个可编辑的静默预览通知。仅在您也为最终确定的预览编辑配置了接收者推送规则时使用。
- `blockStreaming: true` 启用单独的 Matrix 进度消息。启用预览流式传输后，Matrix 保持当前块的实时草稿，并将已完成的块保留为单独的消息。
- 当预览流式传输开启且 `blockStreaming` 关闭时，Matrix 就地编辑实时草稿，并在块或轮次完成时最终确定该同一事件。
- 如果预览不再适合一个 Matrix 事件，OpenClaw 停止预览流式传输并回退到正常的最终传递。
- 媒体回复仍正常发送附件。如果过时的预览无法安全重用，OpenClaw 在发送最终媒体回复之前将其撤回。
- 预览编辑会消耗额外的 Matrix API 调用。如果您需要最保守的速率限制行为，请关闭流式传输。

`blockStreaming` 本身不启用草稿预览。
使用 `streaming: "partial"` 或 `streaming: "quiet"` 进行预览编辑；仅在您希望已完成的助手块作为单独进度消息保留可见时才添加 `blockStreaming: true`。

如果您需要无自定义推送规则的标准 Matrix 通知，使用 `streaming: "partial"` 获得预览优先行为，或关闭 `streaming` 仅获得最终传递。当 `streaming: "off"` 时：

- `blockStreaming: true` 将每个完成的块作为正常通知 Matrix 消息发送。
- `blockStreaming: false` 仅将最终完成的回复作为正常通知 Matrix 消息发送。

### 为静默最终预览配置自托管推送规则

如果您运行自己的 Matrix 基础设施并希望静默预览仅在块或最终回复完成时通知，请设置 `streaming: "quiet"` 并为每个接收者账户添加最终化预览编辑的推送规则。

这通常是接收者用户设置，而非 Homeserver 全局配置更改：

开始前的快速说明：

- 接收者用户 = 应收到通知的人
- 机器人用户 = 发送回复的 OpenClaw Matrix 账户
- 以下 API 调用使用接收者用户的访问令牌
- 在推送规则中匹配 `sender` 与机器人用户的完整 MXID

1. 配置 OpenClaw 使用静默预览：

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. 确保接收者账户已经可以接收正常的 Matrix 推送通知。静默预览规则仅在该用户已有正常推送器/设备时才有效。

3. 获取接收者用户的访问令牌。
   - 使用接收用户的令牌，而非机器人的令牌。
   - 复用现有客户端会话令牌通常最简便。
   - 如果需要生成新令牌，可通过标准 Matrix 客户端-服务器 API 登录：

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. 验证接收者账户已有推送器：

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

如果返回无活跃推送器/设备，请先修复正常的 Matrix 通知，再添加以下 OpenClaw 规则。

OpenClaw 以如下方式标记最终化的纯文本预览编辑：

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. 为每个应接收通知的接收者账户创建覆盖推送规则：

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

运行命令前替换以下值：

- `https://matrix.example.org`：您的 Homeserver 基础 URL
- `$USER_ACCESS_TOKEN`：接收用户的访问令牌
- `openclaw-finalized-preview-botname`：对此接收用户唯一的规则 ID
- `@bot:example.org`：您的 OpenClaw Matrix 机器人 MXID，而非接收用户的 MXID

多机器人设置的重要说明：

- 推送规则以 `ruleId` 为键。对相同规则 ID 重新运行 `PUT` 会更新该规则。
- 如果一个接收用户需要接收多个 OpenClaw Matrix 机器人账户的通知，为每个发送者匹配创建一条规则，每条规则使用唯一的规则 ID。
- 简单模式为 `openclaw-finalized-preview-<botname>`，例如 `openclaw-finalized-preview-ops` 或 `openclaw-finalized-preview-support`。

规则针对事件发送者进行评估：

- 使用接收用户的令牌认证
- 将 `sender` 与 OpenClaw 机器人 MXID 匹配

6. 验证规则存在：

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. 测试流式回复。在静默模式下，房间应显示静默草稿预览，当块或轮次完成时最终就地编辑应通知一次。

如需稍后删除规则，使用接收用户的令牌删除相同规则 ID：

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

注意：

- 使用接收用户的访问令牌创建规则，而非机器人的令牌。
- 新的用户定义 `override` 规则在默认抑制规则之前插入，无需额外排序参数。
- 这只影响 OpenClaw 可以安全就地最终化的纯文本预览编辑。媒体回退和过时预览回退仍使用正常的 Matrix 传递。
- 如果 `GET /_matrix/client/v3/pushers` 显示无推送器，则该账户/设备尚无 Matrix 推送传递。

#### Synapse

对于 Synapse，上述设置通常已足够：

- 无需特殊 `homeserver.yaml` 更改即可支持 OpenClaw 最终化预览通知。
- 如果您的 Synapse 部署已发送正常的 Matrix 推送通知，用户令牌 + `pushrules` 调用是主要设置步骤。
- 如果您将 Synapse 运行在反向代理或 worker 后面，确保 `/_matrix/client/.../pushrules/` 正确到达 Synapse。
- 如果您运行 Synapse worker，确保推送器正常工作。推送传递由主进程或 `synapse.app.pusher` / 已配置的推送器 worker 处理。

#### Tuwunel

对于 Tuwunel，使用上述相同的设置流程和推送规则 API 调用：

- 无需特定于 Tuwunel 的配置来支持最终化预览标记本身。
- 如果该用户的正常 Matrix 通知已工作，用户令牌 + `pushrules` 调用是主要设置步骤。
- 如果当用户在另一台设备上活跃时通知似乎消失，请检查是否启用了 `suppress_push_when_active`。Tuwunel 在 2025 年 9 月 12 日的 Tuwunel 1.4.2 中添加了此选项，它可以有意地在一台设备活跃时抑制向其他设备的推送。

## 机器人对机器人房间

默认情况下，来自其他已配置 OpenClaw Matrix 账户的 Matrix 消息会被忽略。

当您有意希望 Agent 间进行 Matrix 通信时，使用 `allowBots`：

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` 在允许的房间和私信中接受来自其他已配置 Matrix 机器人账户的消息。
- `allowBots: "mentions"` 仅在房间中明确提及此机器人时接受这些消息。私信仍然允许。
- `groups.<room>.allowBots` 覆盖单个房间的账户级设置。
- OpenClaw 仍然忽略来自相同 Matrix 用户 ID 的消息，以避免自回复循环。
- Matrix 在这里没有暴露原生机器人标志；OpenClaw 将"机器人发送"视为"由此 OpenClaw Gateway 上另一个已配置 Matrix 账户发送"。

在共享房间中启用机器人对机器人通信时，使用严格的房间 allowlist 和提及要求。

## 加密和验证

在加密（E2EE）房间中，出站图片事件使用 `thumbnail_file`，使图片预览与完整附件一起加密。未加密的房间仍使用普通的 `thumbnail_url`。无需配置——插件自动检测 E2EE 状态。

启用加密：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

检查验证状态：

```bash
openclaw matrix verify status
```

详细状态（完整诊断）：

```bash
openclaw matrix verify status --verbose
```

以机器可读格式输出包含恢复密钥的内容：

```bash
openclaw matrix verify status --include-recovery-key --json
```

引导交叉签名和验证状态：

```bash
openclaw matrix verify bootstrap
```

详细引导诊断：

```bash
openclaw matrix verify bootstrap --verbose
```

引导前强制重置交叉签名身份：

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

使用恢复密钥验证此设备：

```bash
openclaw matrix verify device "<your-recovery-key>"
```

详细设备验证信息：

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

检查房间密钥备份健康状态：

```bash
openclaw matrix verify backup status
```

详细备份健康诊断：

```bash
openclaw matrix verify backup status --verbose
```

从服务器备份恢复房间密钥：

```bash
openclaw matrix verify backup restore
```

详细恢复诊断：

```bash
openclaw matrix verify backup restore --verbose
```

删除当前服务器备份并创建新的备份基线。如果存储的备份密钥无法干净加载，此重置还可以重新创建密钥存储，以便未来的冷启动可以加载新的备份密钥：

```bash
openclaw matrix verify backup reset --yes
```

所有 `verify` 命令默认简洁（包括静默内部 SDK 日志），仅在使用 `--verbose` 时显示详细诊断。
脚本编写时使用 `--json` 获取完整的机器可读输出。

在多账户设置中，Matrix CLI 命令除非传入 `--account <id>` 否则使用隐式 Matrix 默认账户。
如果配置了多个命名账户，请先设置 `channels.matrix.defaultAccount`，否则隐式 CLI 操作会停下来要求您明确选择账户。
当您希望验证或设备操作针对命名账户时，使用 `--account`：

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

当命名账户的加密被禁用或不可用时，Matrix 警告和验证错误会指向该账户的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

### "已验证"的含义

OpenClaw 仅在此 Matrix 设备经过您自己的交叉签名身份验证时才将其视为已验证。
实际上，`openclaw matrix verify status --verbose` 暴露三个信任信号：

- `Locally trusted`：此设备仅受当前客户端信任
- `Cross-signing verified`：SDK 通过交叉签名报告设备已验证
- `Signed by owner`：设备由您自己的自签名密钥签名

`Verified by owner` 仅在存在交叉签名验证或所有者签名时才变为 `yes`。
仅本地信任不足以让 OpenClaw 将设备视为完全验证。

### 引导的作用

`openclaw matrix verify bootstrap` 是加密 Matrix 账户的修复和设置命令。
它按顺序执行以下所有操作：

- 引导密钥存储，尽可能复用现有恢复密钥
- 引导交叉签名并上传缺失的公共交叉签名密钥
- 尝试标记并交叉签名当前设备
- 如果服务器侧房间密钥备份不存在则创建新备份

如果 Homeserver 要求交互式认证来上传交叉签名密钥，OpenClaw 会先尝试不带认证上传，然后使用 `m.login.dummy`，再在配置了 `channels.matrix.password` 时使用 `m.login.password`。

仅在您有意丢弃当前交叉签名身份并创建新身份时使用 `--force-reset-cross-signing`。

如果您有意丢弃当前房间密钥备份并为未来消息创建新备份基线，使用 `openclaw matrix verify backup reset --yes`。
仅在您接受无法恢复的旧加密历史记录将保持不可用，且 OpenClaw 在当前备份密钥无法安全加载时可能重新创建密钥存储时执行此操作。

### 新的备份基线

如果您希望保持未来加密消息正常工作并接受丢失无法恢复的旧历史，按顺序运行这些命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

当您希望明确针对某个命名 Matrix 账户时，在每个命令后添加 `--account <id>`。

### 启动行为

当 `encryption: true` 时，Matrix 默认将 `startupVerification` 设置为 `"if-unverified"`。
启动时，如果此设备仍未验证，Matrix 会在另一个 Matrix 客户端请求自我验证，
跳过已有待处理请求时的重复请求，并在重启后重试前应用本地冷却期。
失败的请求尝试比成功的请求创建默认重试更快。
设置 `startupVerification: "off"` 禁用自动启动请求，或调整 `startupVerificationCooldownHours`
以设置更短或更长的重试窗口。

启动还会自动执行保守的加密引导流程。
该流程优先复用当前密钥存储和交叉签名身份，避免重置交叉签名，除非您运行明确的引导修复流程。

如果启动发现损坏的引导状态，OpenClaw 即使未配置 `channels.matrix.password` 也可以尝试受保护的修复路径。
如果 Homeserver 要求基于密码的 UIA 进行该修复，OpenClaw 记录警告并保持启动非致命，而非中止机器人。
如果当前设备已由所有者签名，OpenClaw 保留该身份而不自动重置它。

完整升级流程、限制、恢复命令和常见迁移消息，参见 [Matrix 迁移](/install/migrating-matrix)。

### 验证通知

Matrix 将验证生命周期通知直接作为 `m.notice` 消息发布到严格的私信验证房间中。
包括：

- 验证请求通知
- 验证就绪通知（带有明确的"通过表情验证"指引）
- 验证开始和完成通知
- 可用时的 SAS 详情（表情和十进制）

来自另一个 Matrix 客户端的入站验证请求由 OpenClaw 跟踪并自动接受。
对于自我验证流程，OpenClaw 也会在表情验证可用时自动启动 SAS 流程并确认自己一侧。
对于来自另一个 Matrix 用户/设备的验证请求，OpenClaw 自动接受请求，然后等待 SAS 流程正常进行。
您仍需要在 Matrix 客户端中比较表情或十进制 SAS 并确认"它们匹配"来完成验证。

OpenClaw 不会盲目自动接受自发起的重复流程。启动时如果已有待处理的自我验证请求则跳过创建新请求。

验证协议/系统通知不会转发到 Agent 聊天管道，因此不会产生 `NO_REPLY`。

### 设备维护

旧的 OpenClaw 管理的 Matrix 设备会在账户上积累，使加密房间的信任推理变得更困难。
使用以下命令列出它们：

```bash
openclaw matrix devices list
```

使用以下命令移除过期的 OpenClaw 管理设备：

```bash
openclaw matrix devices prune-stale
```

### 加密存储

Matrix E2EE 使用官方 `matrix-js-sdk` 在 Node 中的 Rust 加密路径，以 `fake-indexeddb` 作为 IndexedDB 垫片。加密状态持久化到快照文件（`crypto-idb-snapshot.json`）并在启动时恢复。快照文件是以受限文件权限存储的敏感运行时状态。

加密运行时状态存储在
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`
下的每账户、每用户令牌哈希根目录中。
该目录包含同步存储（`bot-storage.json`）、加密存储（`crypto/`）、
恢复密钥文件（`recovery-key.json`）、IndexedDB 快照（`crypto-idb-snapshot.json`）、
话题串绑定（`thread-bindings.json`）和启动验证状态（`startup-verification.json`）。
当令牌更改但账户身份保持不变时，OpenClaw 为该账户/Homeserver/用户组合复用最佳现有根，
使先前的同步状态、加密状态、话题串绑定和启动验证状态保持可见。

## 配置文件管理

使用以下命令更新所选账户的 Matrix 自身配置文件：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

在需要明确针对命名 Matrix 账户时添加 `--account <id>`。

Matrix 直接接受 `mxc://` 头像 URL。当您传入 `http://` 或 `https://` 头像 URL 时，OpenClaw 会先将其上传到 Matrix，并将解析后的 `mxc://` URL 存回 `channels.matrix.avatarUrl`（或所选账户覆盖）。

## 话题串

Matrix 支持原生 Matrix 话题串，用于自动回复和消息工具发送。

- `dm.sessionScope: "per-user"`（默认）保持 Matrix 私信路由以发送者为范围，因此多个私信房间在解析到相同对等体时可以共享一个会话。
- `dm.sessionScope: "per-room"` 将每个 Matrix 私信房间隔离到自己的会话键，同时仍使用正常的私信认证和 allowlist 检查。
- 显式 Matrix 对话绑定仍优先于 `dm.sessionScope`，因此已绑定的房间和话题串保持其选定的目标会话。
- `threadReplies: "off"` 保持回复在顶层，并将入站话题串消息保留在父会话中。
- `threadReplies: "inbound"` 仅在入站消息已在话题串中时在话题串内回复。
- `threadReplies: "always"` 将房间回复保持在以触发消息为根的话题串中，并通过第一条触发消息的匹配话题串范围会话路由该对话。
- `dm.threadReplies` 仅为私信覆盖顶层设置。例如，您可以在保持房间话题串隔离的同时保持私信扁平化。
- 入站话题串消息将话题串根消息作为额外的 Agent 上下文包含。
- 消息工具发送在目标为相同房间或相同私信用户目标时自动继承当前 Matrix 话题串，除非提供了明确的 `threadId`。
- 相同会话私信用户目标复用仅在当前会话元数据证明同一 Matrix 账户上的相同私信对等体时触发；否则 OpenClaw 回退到正常的用户范围路由。
- 当 OpenClaw 看到 Matrix 私信房间与另一个私信房间在相同共享 Matrix 私信会话上发生冲突时，它会在该房间中发布一次性 `m.notice`，包含 `/focus` 退出路径（当话题串绑定已启用且 `dm.sessionScope` 提示时）。
- Matrix 支持运行时话题串绑定。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和话题串绑定的 `/acp spawn` 在 Matrix 房间和私信中工作。
- 顶层 Matrix 房间/私信的 `/focus` 在 `threadBindings.spawnSubagentSessions=true` 时创建新的 Matrix 话题串并将其绑定到目标会话。
- 在现有 Matrix 话题串内运行 `/focus` 或 `/acp spawn --thread here` 会绑定该当前话题串。

## ACP 对话绑定

Matrix 房间、私信和现有 Matrix 话题串可以变成持久的 ACP 工作区，而无需更改聊天界面。

快速操作流程：

- 在您想继续使用的 Matrix 私信、房间或现有话题串中运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信/房间保持为聊天界面，未来消息路由到已生成的 ACP 会话。
- 在现有 Matrix 话题串内，`--bind here` 就地绑定该当前话题串。
- `/new` 和 `/reset` 就地重置相同的已绑定 ACP 会话。
- `/acp close` 关闭 ACP 会话并移除绑定。

注意：

- `--bind here` 不创建子 Matrix 话题串。
- `threadBindings.spawnAcpSessions` 仅对 `/acp spawn --thread auto|here` 是必需的，其中 OpenClaw 需要创建或绑定子 Matrix 话题串。

### 话题串绑定配置

Matrix 从 `session.threadBindings` 继承全局默认值，并支持每个 Channel 的覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 话题串绑定的生成标志是可选的：

- 设置 `threadBindings.spawnSubagentSessions: true` 以允许顶层 `/focus` 创建并绑定新的 Matrix 话题串。
- 设置 `threadBindings.spawnAcpSessions: true` 以允许 `/acp spawn --thread auto|here` 将 ACP 会话绑定到 Matrix 话题串。

## 表情反应

Matrix 支持出站表情反应操作、入站表情反应通知和入站确认反应。

- 出站表情反应工具受 `channels["matrix"].actions.reactions` 控制。
- `react` 为特定 Matrix 事件添加表情反应。
- `reactions` 列出特定 Matrix 事件的当前表情反应摘要。
- `emoji=""` 移除机器人账户对该事件的自己的表情反应。
- `remove: true` 仅从机器人账户移除指定的表情反应。

确认反应使用标准 OpenClaw 解析顺序：

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- Agent 身份表情回退

确认反应范围按此顺序解析：

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

表情反应通知模式按此顺序解析：

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- 默认：`own`

行为：

- `reactionNotifications: "own"` 在 `m.reaction` 事件针对机器人发送的 Matrix 消息时转发已添加的事件。
- `reactionNotifications: "off"` 禁用表情反应系统事件。
- 表情反应移除未被合成为系统事件，因为 Matrix 将这些作为撤销而非独立的 `m.reaction` 移除来呈现。

## 历史上下文

- `channels.matrix.historyLimit` 控制 Matrix 房间消息触发 Agent 时作为 `InboundHistory` 包含的最近房间消息数量。回退到 `messages.groupChat.historyLimit`；如果两者都未设置，有效默认值为 `0`。设置 `0` 禁用。
- Matrix 房间历史仅限于房间。私信继续使用正常的会话历史。
- Matrix 房间历史是待处理式的：OpenClaw 缓冲未触发回复的房间消息，然后在提及或其他触发器到达时对该窗口进行快照。
- 当前触发消息不包含在 `InboundHistory` 中；它保留在该轮次的主入站正文中。
- 相同 Matrix 事件的重试复用原始历史快照，而非漂移到更新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于补充房间上下文，例如获取的回复文本、话题串根和待处理历史。

- `contextVisibility: "all"` 是默认值。补充上下文按接收时保留。
- `contextVisibility: "allowlist"` 将补充上下文过滤为活跃房间/用户 allowlist 检查允许的发送者。
- `contextVisibility: "allowlist_quote"` 行为类似 `allowlist`，但仍保留一个显式的引用回复。

此设置影响补充上下文可见性，而非入站消息本身是否可以触发回复。
触发授权仍来自 `groupPolicy`、`groups`、`groupAllowFrom` 和私信策略设置。

## 私信和房间策略

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

参见[群组](/channels/groups)了解提及门控和 allowlist 行为。

Matrix 私信的配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果未批准的 Matrix 用户在批准前不断向您发消息，OpenClaw 会复用相同的待处理配对码，并可能在短暂冷却后再次发送提醒回复，而非生成新码。

参见[Pairing](/channels/pairing)了解共享的私信配对流程和存储布局。

## 直接房间修复

如果直接消息状态不同步，OpenClaw 可能会以过期的 `m.direct` 映射结束，指向旧的单人房间而非活跃私信。使用以下命令检查某个对等体的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

使用以下命令修复：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修复流程：

- 优先选择已在 `m.direct` 中映射的严格 1:1 私信
- 回退到与该用户任何当前已加入的严格 1:1 私信
- 如果没有健康的私信，创建新的直接房间并重写 `m.direct`

修复流程不会自动删除旧房间。它只选择健康的私信并更新映射，使新的 Matrix 发送、验证通知和其他直接消息流指向正确的房间。

## Exec 审批

Matrix 可以作为 Matrix 账户的原生审批客户端。原生私信/Channel 路由控制仍在 exec 审批配置下：

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（可选；回退到 `channels.matrix.dm.allowFrom`）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

审批者必须是 Matrix 用户 ID，例如 `@owner:example.org`。当 `enabled` 未设置或为 `"auto"` 且至少一个审批者可以解析时，Matrix 自动启用原生审批。Exec 审批优先使用 `execApprovals.approvers`，可以回退到 `channels.matrix.dm.allowFrom`。插件审批通过 `channels.matrix.dm.allowFrom` 授权。设置 `enabled: false` 可明确禁用 Matrix 作为原生审批客户端。否则审批请求回退到其他已配置的审批路由或审批后备策略。

Matrix 原生路由支持两种审批类型：

- `channels.matrix.execApprovals.*` 控制 Matrix 审批提示的原生私信/Channel 扇出模式。
- Exec 审批使用来自 `execApprovals.approvers` 或 `channels.matrix.dm.allowFrom` 的 exec 审批者集合。
- 插件审批使用来自 `channels.matrix.dm.allowFrom` 的 Matrix 私信 allowlist。
- Matrix 表情反应快捷方式和消息更新适用于 exec 和插件两种审批。

传递规则：

- `target: "dm"` 向审批者私信发送审批提示
- `target: "channel"` 将提示发回到发起的 Matrix 房间或私信
- `target: "both"` 发送到审批者私信和发起的 Matrix 房间或私信

Matrix 审批提示在主审批消息上设置表情反应快捷方式：

- `✅` = 允许一次
- `❌` = 拒绝
- `♾️` = 在有效 exec 策略允许时始终允许

审批者可以对该消息做出反应，或使用备用斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always` 或 `/approve <id> deny`。

只有已解析的审批者才能批准或拒绝。对于 exec 审批，Channel 传递包含命令文本，因此仅在受信任的房间中启用 `channel` 或 `both`。

每账户覆盖：

- `channels.matrix.accounts.<account>.execApprovals`

相关文档：[Exec 审批](/tools/exec-approvals)

## 多账户

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

顶层 `channels.matrix` 值作为命名账户的默认值，除非账户覆盖它们。
您可以用 `groups.<room>.account` 将继承的房间条目限定到一个 Matrix 账户。
不带 `account` 的条目在所有 Matrix 账户间共享，带 `account: "default"` 的条目在直接在顶层 `channels.matrix.*` 上配置默认账户时仍然有效。
部分共享认证默认值本身不会创建单独的隐式默认账户。OpenClaw 仅在该默认账户拥有完整认证时合成顶层 `default` 账户；命名账户仍可在缓存凭据满足认证时从 `homeserver` 加 `userId` 发现。
如果 Matrix 恰好有一个命名账户，或 `defaultAccount` 指向现有命名账户键，单账户到多账户的修复/设置升级会保留该账户，而非创建新的 `accounts.default` 条目。只有 Matrix 认证/引导键会移入该升级的账户；共享的传递策略键保留在顶层。
设置 `defaultAccount` 使 OpenClaw 优先使用一个命名 Matrix 账户进行隐式路由、探测和 CLI 操作。
如果配置了多个命名账户且其中一个账户 ID 为 `default`，即使未设置 `defaultAccount`，OpenClaw 也会隐式使用该账户。
如果配置了多个命名账户，请设置 `defaultAccount` 或在依赖隐式账户选择的 CLI 命令中传入 `--account <id>`。
向 `openclaw matrix verify ...` 和 `openclaw matrix devices ...` 传入 `--account <id>` 以为单个命令覆盖该隐式选择。

参见[配置参考](/gateway/configuration-reference#multi-account-all-channels)了解共享的多账户模式。

## 私有/LAN Homeserver

默认情况下，OpenClaw 为防止 SSRF 攻击会阻止私有/内部 Matrix Homeserver，除非您按账户明确选择启用。

如果您的 Homeserver 运行在 localhost、LAN/Tailscale IP 或内部主机名上，请为该 Matrix 账户启用 `network.dangerouslyAllowPrivateNetwork`：

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

CLI 设置示例：

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

此选项仅允许受信任的私有/内部目标。公共明文 Homeserver（如 `http://matrix.example.org:8008`）仍然被阻止。尽可能优先使用 `https://`。

## 代理 Matrix 流量

如果您的 Matrix 部署需要显式的出站 HTTP(S) 代理，设置 `channels.matrix.proxy`：

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

命名账户可以用 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。
OpenClaw 对运行时 Matrix 流量和账户状态探测使用相同的代理设置。

## 目标解析

Matrix 在 OpenClaw 要求您提供房间或用户目标的任何地方都接受以下格式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

实时目录查找使用已登录的 Matrix 账户：

- 用户查找在该 Homeserver 上查询 Matrix 用户目录。
- 房间查找直接接受明确的房间 ID 和别名，然后回退到搜索该账户已加入的房间名称。
- 已加入房间的名称查找是尽力而为的。如果房间名称无法解析为 ID 或别名，运行时 allowlist 解析会忽略它。

## 配置参考

- `enabled`：启用或禁用 Channel。
- `name`：账户的可选标签。
- `defaultAccount`：配置了多个 Matrix 账户时的首选账户 ID。
- `homeserver`：Homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许此 Matrix 账户连接到私有/内部 Homeserver。当 Homeserver 解析为 `localhost`、LAN/Tailscale IP 或 `matrix-synapse` 等内部主机时启用。
- `proxy`：Matrix 流量的可选 HTTP(S) 代理 URL。命名账户可以用自己的 `proxy` 覆盖顶层默认值。
- `userId`：完整的 Matrix 用户 ID，例如 `@bot:example.org`。
- `accessToken`：基于令牌认证的访问令牌。支持 `channels.matrix.accessToken` 和 `channels.matrix.accounts.<id>.accessToken` 的明文值和 SecretRef 值，适用于 env/file/exec 提供者。参见[密钥管理](/gateway/secrets)。
- `password`：密码登录的密码。支持明文值和 SecretRef 值。
- `deviceId`：明确的 Matrix 设备 ID。
- `deviceName`：密码登录的设备显示名称。
- `avatarUrl`：存储的自头像 URL，用于配置文件同步和 `profile set` 更新。
- `initialSyncLimit`：启动同步期间获取的最大事件数。
- `encryption`：启用 E2EE。
- `allowlistOnly`：为 `true` 时，将 `open` 房间策略升级为 `allowlist`，并强制除 `disabled` 外的所有活跃私信策略（包括 `pairing` 和 `open`）改为 `allowlist`。不影响 `disabled` 策略。
- `allowBots`：允许来自其他已配置 OpenClaw Matrix 账户的消息（`true` 或 `"mentions"`）。
- `groupPolicy`：`open`、`allowlist` 或 `disabled`。
- `contextVisibility`：补充房间上下文可见性模式（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`：房间流量的用户 ID allowlist。条目应为完整的 Matrix 用户 ID；未解析的名称在运行时被忽略。
- `historyLimit`：作为群组历史上下文包含的最大房间消息数。回退到 `messages.groupChat.historyLimit`；如果两者都未设置，有效默认值为 `0`。设置 `0` 禁用。
- `replyToMode`：`off`、`first`、`all` 或 `batched`。
- `markdown`：出站 Matrix 文本的可选 Markdown 渲染配置。
- `streaming`：`off`（默认）、`"partial"`、`"quiet"`、`true` 或 `false`。`"partial"` 和 `true` 使用普通 Matrix 文本消息启用预览优先草稿更新。`"quiet"` 使用非通知预览通知，适用于自托管推送规则设置。`false` 等同于 `"off"`。
- `blockStreaming`：`true` 在草稿预览流式传输活跃时为已完成的助手块启用单独的进度消息。
- `threadReplies`：`off`、`inbound` 或 `always`。
- `threadBindings`：话题串绑定会话路由和生命周期的每 Channel 覆盖。
- `startupVerification`：启动时自动自我验证请求模式（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`：自动启动验证请求重试前的冷却时间。
- `textChunkLimit`：出站消息块大小（字符数，在 `chunkMode` 为 `length` 时适用）。
- `chunkMode`：`length` 按字符数分割消息；`newline` 在行边界处分割。
- `responsePrefix`：此 Channel 所有出站回复的可选前缀字符串。
- `ackReaction`：此 Channel/账户的可选确认表情反应覆盖。
- `ackReactionScope`：可选确认表情反应范围覆盖（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`：入站表情反应通知模式（`own`、`off`）。
- `mediaMaxMb`：出站发送和入站媒体处理的媒体大小上限（MB）。
- `autoJoin`：邀请自动加入策略（`always`、`allowlist`、`off`）。默认：`off`。适用于所有 Matrix 邀请，包括私信式邀请。
- `autoJoinAllowlist`：`autoJoin` 为 `allowlist` 时允许的房间/别名。别名条目在邀请处理期间解析为房间 ID；OpenClaw 不信任被邀请房间声称的别名状态。
- `dm`：私信策略块（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`：在 OpenClaw 加入房间并将其分类为私信后控制私信访问。不影响邀请是否自动加入。
- `dm.allowFrom`：条目应为完整的 Matrix 用户 ID，除非已通过实时目录查找解析它们。
- `dm.sessionScope`：`per-user`（默认）或 `per-room`。当您希望每个 Matrix 私信房间保持独立上下文（即使对等体相同）时使用 `per-room`。
- `dm.threadReplies`：仅私信话题串策略覆盖（`off`、`inbound`、`always`）。覆盖私信中的顶层 `threadReplies` 设置（包括回复位置和会话隔离）。
- `execApprovals`：Matrix 原生 exec 审批传递（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`：允许批准 exec 请求的 Matrix 用户 ID。当 `dm.allowFrom` 已识别审批者时为可选。
- `execApprovals.target`：`dm | channel | both`（默认：`dm`）。
- `accounts`：命名的每账户覆盖。顶层 `channels.matrix` 值作为这些条目的默认值。
- `groups`：每房间策略映射。优先使用房间 ID 或别名；未解析的房间名称在运行时被忽略。会话/群组身份在解析后使用稳定的房间 ID。
- `groups.<room>.account`：在多账户设置中将一个继承的房间条目限制到特定 Matrix 账户。
- `groups.<room>.allowBots`：已配置机器人发送者的房间级覆盖（`true` 或 `"mentions"`）。
- `groups.<room>.users`：每房间发送者 allowlist。
- `groups.<room>.tools`：每房间工具允许/拒绝覆盖。
- `groups.<room>.autoReply`：房间级提及门控覆盖。`true` 禁用该房间的提及要求；`false` 强制重新启用。
- `groups.<room>.skills`：可选的房间级技能过滤器。
- `groups.<room>.systemPrompt`：可选的房间级系统提示片段。
- `rooms`：`groups` 的旧版别名。
- `actions`：每操作工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 相关

- [Channel 概述](/channels) — 所有支持的 Channel
- [Pairing](/channels/pairing) — 私信认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
