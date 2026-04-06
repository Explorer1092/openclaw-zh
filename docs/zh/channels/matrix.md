---
title: "Matrix (插件)"
sidebarTitle: "Matrix"
mmh3_hash: "5ccb115670ab94c3e5e31350373051fc"
summary: "Matrix 支持状态、设置和配置示例"
read_when:
  - 在 OpenClaw 中设置 Matrix
  - 配置 Matrix E2EE 和验证
---

# Matrix (插件)

Matrix 是 OpenClaw 的 Matrix Channel 插件。
它使用官方 `matrix-js-sdk` 并支持私信、房间、话题串、媒体、表情反应、投票、位置和 E2EE。

## 需要插件

Matrix 作为插件提供，不随核心 OpenClaw 捆绑。

从 npm 安装：

```bash
openclaw plugins install @openclaw/matrix
```

从本地检出安装：

```bash
openclaw plugins install ./extensions/matrix
```

详情参见 [插件](/tools/plugin)。

## 设置

1. 安装插件。
2. 在 Homeserver 上创建 Matrix 账户。
3. 配置 `channels.matrix`，使用以下之一：
   - `homeserver` + `accessToken`，或
   - `homeserver` + `userId` + `password`。
4. 重启 Gateway。
5. 向机器人发送私信或邀请它加入房间。

交互式设置：

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 向导会询问的内容：

- Homeserver URL
- 认证方式：访问令牌或密码
- 选择密码认证时需要用户 ID
- 可选设备名称
- 是否启用 E2EE
- 是否现在配置 Matrix 房间访问

向导行为说明：

- 如果所选账户已有 Matrix 认证环境变量，且该账户尚未在配置中保存认证，向导会提供环境变量快捷方式，只写入 `enabled: true`。
- 交互式添加另一个 Matrix 账户时，输入的账户名称会被规范化为配置和环境变量中使用的账户 ID。例如，`Ops Bot` 变为 `ops-bot`。
- 私信 allowlist 提示直接接受完整的 `@user:server` 值。显示名称仅在目录搜索找到唯一精确匹配时有效；否则向导会要求使用完整 Matrix ID 重试。
- 房间 allowlist 提示直接接受房间 ID 和别名，也可以实时解析已加入房间的名称，但未解析的名称在设置时保持原样，运行时 allowlist 解析会忽略它们。优先使用 `!room:server` 或 `#alias:server`。
- 运行时房间/会话身份使用稳定的 Matrix 房间 ID。房间别名仅作为查找输入，不作为长期会话键或稳定群组身份。
- 要在保存前解析房间名称，使用 `openclaw channels resolve --channel matrix "Project Room"`。

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

规范化账户 ID `ops-bot`，使用：

- `MATRIX_OPS_BOT_HOMESERVER`
- `MATRIX_OPS_BOT_ACCESS_TOKEN`

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
- `streaming: "quiet"` 为当前助手块创建一个可编辑的静默预览通知。仅在您也为最终确定的预览编辑配置了接收者推送规则时使用此选项。
- `blockStreaming: true` 启用单独的 Matrix 进度消息。启用预览流式传输后，Matrix 保持当前块的实时草稿，并将已完成的块保留为单独的消息。
- 当预览流式传输开启且 `blockStreaming` 关闭时，Matrix 就地编辑实时草稿，并在块或轮次完成时最终确定该同一事件。
- 如果预览不再适合一个 Matrix 事件，OpenClaw 停止预览流式传输并回退到正常的最终传递。
- 媒体回复仍正常发送附件。如果过时的预览无法安全重用，OpenClaw 在发送最终媒体回复之前将其撤回。

## 加密和验证

在加密（E2EE）房间中，出站图片事件使用 `thumbnail_file`，使图片预览与完整附件一起加密。未加密的房间仍使用普通的 `thumbnail_url`。无需配置——插件自动检测 E2EE 状态。

### 机器人对机器人房间

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

多账户支持：使用 `channels.matrix.accounts` 配置每个账户的凭据和可选的 `name`。参见 [配置参考](/gateway/configuration-reference#multi-account-all-channels) 了解共享模式。

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

删除当前服务器备份并创建新的备份基线：

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

- 引导秘密存储，尽可能复用现有恢复密钥
- 引导交叉签名并上传缺失的公共交叉签名密钥
- 尝试标记并交叉签名当前设备
- 如果服务器侧房间密钥备份不存在则创建新备份

如果 Homeserver 要求交互式认证来上传交叉签名密钥，OpenClaw 会先尝试不带认证上传，然后使用 `m.login.dummy`，再在配置了 `channels.matrix.password` 时使用 `m.login.password`。

仅在您有意丢弃当前交叉签名身份并创建新身份时使用 `--force-reset-cross-signing`。

如果您有意丢弃当前房间密钥备份并为未来消息创建新备份基线，使用 `openclaw matrix verify backup reset --yes`。
仅在您接受无法恢复的旧加密历史记录将保持不可用时执行此操作。

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
该流程优先复用当前秘密存储和交叉签名身份，避免重置交叉签名，除非您运行明确的引导修复流程。

如果启动发现损坏的引导状态且配置了 `channels.matrix.password`，OpenClaw 可以尝试更严格的修复路径。
如果当前设备已经由所有者签名，OpenClaw 会保留该身份而不自动重置它。

从之前的公共 Matrix 插件升级：

- OpenClaw 会尽可能自动复用相同的 Matrix 账户、访问令牌和设备身份。
- 在任何实质性 Matrix 迁移更改运行之前，OpenClaw 在 `~/Backups/openclaw-migrations/` 下创建或复用恢复快照。
- 如果您使用多个 Matrix 账户，在从旧的扁平存储布局升级前设置 `channels.matrix.defaultAccount`，以便 OpenClaw 知道哪个账户应接收共享的旧状态。
- 如果之前的插件本地存储了 Matrix 房间密钥备份解密密钥，启动或 `openclaw doctor --fix` 会自动将其导入新的恢复密钥流程。
- 如果迁移准备后 Matrix 访问令牌发生了变化，启动现在会扫描同级令牌哈希存储根以查找待处理的旧版恢复状态，然后再放弃自动备份恢复。
- 如果同一账户、Homeserver 和用户的 Matrix 访问令牌之后发生变化，OpenClaw 现在优先复用最完整的现有令牌哈希存储根，而不是从空的 Matrix 状态目录开始。
- 在下次 Gateway 启动时，备份的房间密钥会自动恢复到新的加密存储中。
- 如果旧插件有从未备份的本地房间密钥，OpenClaw 会清楚地发出警告。那些密钥无法从之前的 Rust 加密存储自动导出，因此某些旧加密历史可能在手动恢复之前保持不可用。
- 完整的升级流程、限制、恢复命令和常见迁移消息，参见 [Matrix 迁移](/install/migrating-matrix)。

加密运行时状态组织在
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 下的每账户、每用户令牌哈希根目录中。
该目录包含同步存储（`bot-storage.json`）、加密存储（`crypto/`）、
恢复密钥文件（`recovery-key.json`）、IndexedDB 快照（`crypto-idb-snapshot.json`）、
话题串绑定（`thread-bindings.json`）和启动验证状态（`startup-verification.json`）（在使用这些功能时）。
当令牌更改但账户身份保持不变时，OpenClaw 为该账户/Homeserver/用户组合复用最佳现有根，
使先前的同步状态、加密状态、话题串绑定和启动验证状态保持可见。

### Node 加密存储模型

此插件中的 Matrix E2EE 使用官方 `matrix-js-sdk` 的 Rust 加密路径（在 Node 中）。
该路径期望 IndexedDB 支持的持久化以在重启后保留加密状态。

OpenClaw 目前在 Node 中通过以下方式提供这一功能：

- 使用 `fake-indexeddb` 作为 SDK 期望的 IndexedDB API 垫片
- 在 `initRustCrypto` 之前从 `crypto-idb-snapshot.json` 恢复 Rust 加密 IndexedDB 内容
- 在初始化期间和运行时将更新的 IndexedDB 内容持久化回 `crypto-idb-snapshot.json`

这是兼容性/存储管道，而非自定义加密实现。
快照文件是敏感的运行时状态，以受限文件权限存储。
在 OpenClaw 的安全模型下，Gateway 主机和本地 OpenClaw 状态目录已在受信任的运营者边界内，因此这主要是运营耐久性问题，而不是独立的远程信任边界。

计划改进：

- 为持久 Matrix 密钥材料添加 SecretRef 支持，使恢复密钥和相关存储加密密钥可以从 OpenClaw 密钥提供者而非仅本地文件获取

## 自动验证通知

Matrix 现在将验证生命周期通知直接作为 `m.notice` 消息发布到严格的私信验证房间中。
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

### 直接房间修复

如果直接消息状态不同步，OpenClaw 可能会以过期的 `m.direct` 映射结束，指向旧的单人房间而非活跃私信。使用以下命令检查某个对等体的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

使用以下命令修复：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修复将 Matrix 特定逻辑保留在插件内：

- 优先选择已在 `m.direct` 中映射的严格 1:1 私信
- 否则回退到与该用户任何当前已加入的严格 1:1 私信
- 如果没有健康的私信，创建新的直接房间并重写 `m.direct` 指向它

修复流程不会自动删除旧房间。它只选择健康的私信并更新映射，使新的 Matrix 发送、验证通知和其他直接消息流指向正确的房间。

## 话题串

Matrix 支持原生 Matrix 话题串，用于自动回复和消息工具发送。

- `threadReplies: "off"` 保持回复在顶层。
- `threadReplies: "inbound"` 仅在入站消息已在话题串中时在话题串内回复。
- `threadReplies: "always"` 将房间回复保持在以触发消息为根的话题串中。
- 入站话题串消息将话题串根消息作为额外的 Agent 上下文包含。
- 消息工具发送现在自动继承当前 Matrix 话题串，当目标是相同房间或相同私信用户目标时，除非提供了明确的 `threadId`。
- Matrix 的运行时话题串绑定受支持。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和话题串绑定的 `/acp spawn` 现在在 Matrix 房间和私信中工作。
- 顶层 Matrix 房间/私信的 `/focus` 在 `threadBindings.spawnSubagentSessions=true` 时创建新的 Matrix 话题串并将其绑定到目标会话。
- 在现有 Matrix 话题串内运行 `/focus` 或 `/acp spawn --thread here` 会绑定该当前话题串。

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

当前行为：

- `reactionNotifications: "own"` 在 `m.reaction` 事件针对机器人发送的 Matrix 消息时转发。
- `reactionNotifications: "off"` 禁用表情反应系统事件。
- 表情反应移除仍未合成为系统事件，因为 Matrix 将这些作为撤销而非独立的 `m.reaction` 移除来呈现。

## 私信和房间策略示例

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
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

参见 [群组](/channels/groups) 了解提及门控和 allowlist 行为。

Matrix 私信的配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果未批准的 Matrix 用户在批准前不断向您发消息，OpenClaw 会复用相同的待处理配对码，并可能在短暂冷却后再次发送提醒回复，而非生成新码。

参见 [配对](/channels/pairing) 了解共享的私信配对流程和存储布局。

## 多账户示例

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
          },
        },
      },
    },
  },
}
```

顶层 `channels.matrix` 值作为命名账户的默认值，除非账户覆盖它们。
设置 `defaultAccount` 使 OpenClaw 优先使用一个命名 Matrix 账户进行隐式路由、探测和 CLI 操作。
如果配置了多个命名账户，设置 `defaultAccount` 或在依赖隐式账户选择的 CLI 命令中传入 `--account <id>`。
向 `openclaw matrix verify ...` 和 `openclaw matrix devices ...` 传入 `--account <id>` 以为单个命令覆盖该隐式选择。

## 私有/LAN Homeserver

默认情况下，OpenClaw 为防止 SSRF 攻击会阻止私有/内部 Matrix Homeserver，除非您按账户明确选择启用。

如果您的 Homeserver 运行在 localhost、LAN/Tailscale IP 或内部主机名上，请为该 Matrix 账户启用 `allowPrivateNetwork`：

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      allowPrivateNetwork: true,
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
- `allowPrivateNetwork`：允许此 Matrix 账户连接到私有/内部 Homeserver。当 Homeserver 解析为 `localhost`、LAN/Tailscale IP 或 `matrix-synapse` 等内部主机时启用。
- `userId`：完整的 Matrix 用户 ID，例如 `@bot:example.org`。
- `accessToken`：基于令牌认证的访问令牌。
- `password`：密码登录的密码。
- `deviceId`：明确的 Matrix 设备 ID。
- `deviceName`：密码登录的设备显示名称。
- `avatarUrl`：存储的自头像 URL，用于配置文件同步和 `set-profile` 更新。
- `initialSyncLimit`：启动同步事件限制。
- `encryption`：启用 E2EE。
- `allowlistOnly`：强制私信 + 房间使用 allowlist 规则。
- `groupPolicy`：`open`、`allowlist` 或 `disabled`。
- `groupAllowFrom`：房间流量的用户 ID allowlist。
- `groupAllowFrom` 条目应为完整的 Matrix 用户 ID。未解析的名称在运行时被忽略。
- `replyToMode`：`off`、`first` 或 `all`。
- `threadReplies`：`off`、`inbound` 或 `always`。
- `threadBindings`：话题串绑定会话路由和生命周期的每 Channel 覆盖。
- `startupVerification`：启动时自动自我验证请求模式（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`：自动启动验证请求重试前的冷却时间。
- `textChunkLimit`：出站消息块大小。
- `chunkMode`：`length` 或 `newline`。
- `responsePrefix`：出站回复的可选消息前缀。
- `ackReaction`：此 Channel/账户的可选确认表情反应覆盖。
- `ackReactionScope`：可选确认表情反应范围覆盖（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`：入站表情反应通知模式（`own`、`off`）。
- `mediaMaxMb`：出站媒体大小上限（MB）。
- `autoJoin`：邀请自动加入策略（`always`、`allowlist`、`off`）。默认：`off`。
- `autoJoinAllowlist`：`autoJoin` 为 `allowlist` 时允许的房间/别名。别名条目在邀请处理期间解析为房间 ID；OpenClaw 不信任被邀请房间声称的别名状态。
- `dm`：私信策略块（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`：在 OpenClaw 加入房间并将其分类为私信后控制私信访问。不影响邀请是否自动加入。
- `dm.allowFrom` 条目应为完整的 Matrix 用户 ID，除非已通过实时目录查找解析它们。
- `dm.sessionScope`：`per-user`（默认）或 `per-room`。当您希望每个 Matrix 私信房间保持独立上下文（即使对等体相同）时使用 `per-room`。
- `dm.threadReplies`：仅私信话题串策略覆盖（`off`、`inbound`、`always`）。覆盖私信中的顶层 `threadReplies` 设置（包括回复位置和会话隔离）。
- `execApprovals`：Matrix 原生执行审批传递（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`：允许批准执行请求的 Matrix 用户 ID。当 `dm.allowFrom` 已识别审批者时为可选。
- `execApprovals.target`：`dm | channel | both`（默认：`dm`）。
- `accounts`：命名的每账户覆盖。顶层 `channels.matrix` 值作为这些条目的默认值。
- `groups`：每房间策略映射。优先使用房间 ID 或别名；未解析的房间名称在运行时被忽略。会话/群组身份在解析后使用稳定的房间 ID，而人类可读标签仍来自房间名称。
- `groups.<room>.account`：在多账户设置中将一个继承的房间条目限制到特定 Matrix 账户。
- `groups.<room>.allowBots`：已配置机器人发送者的房间级覆盖（`true` 或 `"mentions"`）。
- `groups.<room>.users`：每房间发送者 allowlist。
- `groups.<room>.tools`：每房间工具允许/拒绝覆盖。
- `groups.<room>.autoReply`：房间级提及门控覆盖。`true` 禁用该房间的提及要求；`false` 强制重新启用。
- `groups.<room>.skills`：可选的房间级技能过滤器。
- `groups.<room>.systemPrompt`：可选的房间级系统提示片段。
- `rooms`：`groups` 的旧版别名。
- `actions`：每操作工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `contextVisibility`：补充房间上下文可见性模式（`all`、`allowlist`、`allowlist_quote`）。
- `allowBots`：允许来自其他已配置 OpenClaw Matrix 账户的消息（`true` 或 `"mentions"`）。
- `historyLimit`：作为群组历史上下文包含的最大房间消息数。回退到 `messages.groupChat.historyLimit`；如果两者都未设置，有效默认值为 `0`。设置 `0` 禁用。
- `markdown`：出站 Matrix 文本的可选 Markdown 渲染配置。
- `streaming`：`off`（默认）、`partial`、`quiet`、`true` 或 `false`。`partial` 和 `true` 启用带有普通 Matrix 文本消息的预览优先草稿更新。`quiet` 使用非通知预览通知，适用于自托管推送规则设置。
- `blockStreaming`：`true` 在草稿预览流式传输活跃时为已完成的助手块启用单独的进度消息。
- `proxy`：Matrix 流量的可选 HTTP(S) 代理 URL。命名账户可以用自己的 `proxy` 覆盖顶层默认值。

## 相关

- [Channels 概述](/channels) — 所有支持的 Channels
- [Pairing](/channels/pairing) — DM 认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
