---
mmh3_hash: "75e87ea0d64e665af3a5785337965d56"
title: "Matrix"
summary: "Matrix 支持状态、设置和配置示例"
read_when:
  - 在 OpenClaw 中设置 Matrix
  - 配置 Matrix E2EE 和验证
---

Matrix 是 OpenClaw 的可下载 Channel Plugin。
使用官方 `matrix-js-sdk`，支持私信、房间、线程、媒体、Reaction、投票、位置和 E2EE。

## 安装

从 ClawHub 安装 Matrix，然后配置 Channel：

```bash
openclaw plugins install @openclaw/matrix
```

裸 Plugin 规范优先尝试 ClawHub，然后回退到 npm。如需强制指定来源，使用 `openclaw plugins install clawhub:@openclaw/matrix` 或 `openclaw plugins install npm:@openclaw/matrix`。

从本地检出安装：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` 会注册并启用 Plugin，无需额外运行 `openclaw plugins enable matrix`。Plugin 在您配置 Channel 之前不会执行任何操作。详见 [Plugins](/tools/plugin)。

## 设置

1. 在您的 homeserver 上创建 Matrix 账户。
2. 配置 `channels.matrix`，使用 `homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`。
3. 重启 Gateway。
4. 向 bot 发起私信，或邀请它加入房间（参见 [auto-join](#auto-join)——新邀请仅在 `autoJoin` 允许时才会生效）。

### 交互式设置

```bash
openclaw channels add
openclaw configure --section channels
```

向导会询问：homeserver URL、认证方式（access token 或密码）、用户 ID（仅密码认证时需要）、可选设备名称、是否启用 E2EE，以及是否配置房间访问和 auto-join。

如果匹配的 `MATRIX_*` 环境变量已存在且所选账户没有保存的认证信息，向导会提供环境变量快捷方式。要在保存 allowlist 之前解析房间名称，运行 `openclaw channels resolve --channel matrix "Project Room"`。启用 E2EE 时，向导写入配置并运行与 [`openclaw matrix encryption setup`](#加密与验证) 相同的 bootstrap。

### 最小配置

基于 Token：

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

基于密码（首次登录后 Token 会被缓存）：

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

### Auto-join

`channels.matrix.autoJoin` 默认为 `off`。使用默认值时，bot 不会出现在新房间或来自新邀请的私信中，除非您手动加入。

OpenClaw 在邀请时无法判断被邀请的房间是私信还是群组，因此所有邀请——包括私信式邀请——都先通过 `autoJoin` 处理。`dm.policy` 仅在之后 bot 加入并将房间分类后才生效。

<Warning>
设置 `autoJoin: "allowlist"` 加 `autoJoinAllowlist` 以限制 bot 接受哪些邀请，或设置 `autoJoin: "always"` 接受所有邀请。

`autoJoinAllowlist` 只接受稳定目标：`!roomId:server`、`#alias:server` 或 `*`。普通房间名称会被拒绝；别名条目针对 homeserver 解析，而非被邀请房间声明的状态。
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

接受所有邀请，使用 `autoJoin: "always"`。

### Allowlist 目标格式

DM 和房间 allowlist 最好使用稳定 ID：

- 私信（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：使用 `@user:server`。默认忽略显示名称，因为它们可变；仅在明确需要与显示名称条目兼容时设置 `dangerouslyAllowNameMatching: true`。
- 房间 allowlist 键（`groups`，旧版 `rooms`）：使用 `!room:server` 或 `#alias:server`。默认忽略普通房间名称；仅在明确需要与已加入房间名称查找兼容时设置 `dangerouslyAllowNameMatching: true`。
- 邀请 allowlist（`autoJoinAllowlist`）：使用 `!room:server`、`#alias:server` 或 `*`。普通房间名称会被拒绝。

### 账户 ID 规范化

向导将友好名称转换为规范化账户 ID。例如，`Ops Bot` 变为 `ops-bot`。标点符号在作用域环境变量名称中会被转义，以防两个账户发生冲突：`-` → `_X2D_`，因此 `ops-prod` 映射到 `MATRIX_OPS_X2D_PROD_*`。

### 缓存凭据

Matrix 将缓存凭据存储在 `~/.openclaw/credentials/matrix/` 下：

- 默认账户：`credentials.json`
- 命名账户：`credentials-<account>.json`

当缓存凭据存在时，即使配置文件中没有 access token，OpenClaw 也将 Matrix 视为已配置——这适用于设置、`openclaw doctor` 和 Channel 状态探测。

### 环境变量

在未设置等效配置键时使用。默认账户使用无前缀名称；命名账户在后缀前插入账户 ID。

| 默认账户              | 命名账户（`<ID>` 为规范化账户 ID）          |
| --------------------- | ------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                   |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                 |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                      |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                     |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                    |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                  |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                 |

对于账户 `ops`，名称变为 `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN` 等。恢复密钥环境变量由感知恢复的 CLI 流程（`verify backup restore`、`verify device`、`verify bootstrap`）在通过 `--recovery-key-stdin` 管道传入密钥时读取。

`MATRIX_HOMESERVER` 不能从工作区 `.env` 设置；参见 [工作区 `.env` 文件](/gateway/security)。

## 配置示例

带有私信配对、房间 allowlist 和 E2EE 的实用基线配置：

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
        "!roomid:example.org": { requireMention: true },
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

Matrix 回复流式传输为可选项。`streaming` 控制 OpenClaw 如何传递进行中的 assistant 回复；`blockStreaming` 控制每个完成的块是否作为独立的 Matrix 消息保留。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

要保留实时答案预览但隐藏中间工具/进度行，使用对象形式：

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming`         | 行为                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（默认）     | 等待完整回复，一次性发送。`true` ↔ `"partial"`，`false` ↔ `"off"`。                                                                  |
| `"partial"`         | 在模型写入当前块时就地编辑一条普通文本消息。标准 Matrix 客户端可能在第一次预览时通知，而非最终编辑时。                               |
| `"quiet"`           | 与 `"partial"` 相同，但消息是不通知的 notice。接收者仅在每用户推送规则匹配最终编辑时收到通知（见下文）。                            |

`blockStreaming` 独立于 `streaming`：

| `streaming`              | `blockStreaming: true`                                  | `blockStreaming: false`（默认）            |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------ |
| `"partial"` / `"quiet"` | 当前块的实时草稿，已完成块保留为消息                   | 当前块的实时草稿，就地最终确认             |
| `"off"`                  | 每个完成块一条通知性 Matrix 消息                        | 完整回复一条通知性 Matrix 消息             |

注意：

- 如果预览超过 Matrix 的每事件大小限制，OpenClaw 停止预览流式传输并回退到仅最终传递。
- 媒体回复始终正常发送附件。如果旧预览无法安全重用，OpenClaw 会在发送最终媒体回复前撤回它。
- 当 Matrix 预览流式传输处于活动状态时，工具进度预览更新默认启用。设置 `streaming.preview.toolProgress: false` 可保留答案文本的预览编辑，但将工具进度保留在普通传递路径上。
- 预览编辑会产生额外的 Matrix API 调用。如果您想要最保守的速率限制配置，请保持 `streaming: "off"`。

## 审批元数据

Matrix 原生审批提示是普通的 `m.room.message` 事件，在 `com.openclaw.approval` 下带有 OpenClaw 特定的自定义事件内容。Matrix 允许自定义事件内容键，因此标准客户端仍然渲染文本正文，而感知 OpenClaw 的客户端可以读取结构化的审批 ID、类型、状态、可用决策及 exec/plugin 详情。

当审批提示对一个 Matrix 事件来说太长时，OpenClaw 将可见文本分块，并仅将 `com.openclaw.approval` 附加到第一块。allow/deny 决策的 Reaction 绑定到该第一个事件，因此长提示与单事件提示保持相同的审批目标。

### 用于安静最终预览的自托管推送规则

`streaming: "quiet"` 仅在块或轮次最终确认后通知接收者——每用户推送规则必须匹配最终预览标记。完整配方（接收者 Token、pusher 检查、规则安装、每 homeserver 注意事项）参见 [Matrix push rules for quiet previews](/channels/matrix-push-rules)。

## Bot 间房间

默认情况下，来自其他已配置 OpenClaw Matrix 账户的 Matrix 消息会被忽略。

当您有意希望进行 Agent 间 Matrix 通信时，使用 `allowBots`：

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

- `allowBots: true` 接受来自已允许房间和私信中其他已配置 Matrix bot 账户的消息。
- `allowBots: "mentions"` 仅在房间中明显提及此 bot 时接受这些消息。私信仍然允许。
- `groups.<room>.allowBots` 覆盖特定房间的账户级设置。
- 已接受的已配置 bot 消息使用共享的 [bot 循环保护](/channels/bot-loop-protection)。配置 `channels.defaults.botLoopProtection`，然后在某个房间需要不同预算时用 `channels.matrix.botLoopProtection` 或 `channels.matrix.groups.<room>.botLoopProtection` 覆盖。
- OpenClaw 仍然忽略来自相同 Matrix 用户 ID 的消息，以避免自我回复循环。
- Matrix 在此不暴露原生 bot 标志；OpenClaw 将"bot 发送"定义为"由此 OpenClaw gateway 上另一个已配置 Matrix 账户发送"。

在共享房间中启用 bot 间通信时，使用严格的房间 allowlist 和提及要求。

## 加密与验证

在加密（E2EE）房间中，出站图像事件使用 `thumbnail_file`，使图像预览与完整附件一起加密。未加密的房间仍使用普通 `thumbnail_url`。无需配置——Plugin 自动检测 E2EE 状态。

所有 `openclaw matrix` 命令接受 `--verbose`（完整诊断）、`--json`（机器可读输出）和 `--account <id>`（多账户设置）。默认输出简洁，内部 SDK 日志安静。以下示例显示规范形式；根据需要添加标志。

### 启用加密

```bash
openclaw matrix encryption setup
```

Bootstrap 密钥存储和交叉签名，必要时创建房间密钥备份，然后打印状态和后续步骤。有用的标志：

- `--recovery-key <key>` 在 bootstrap 之前应用恢复密钥（推荐使用下面记录的 stdin 形式）
- `--force-reset-cross-signing` 丢弃当前交叉签名身份并创建新身份（仅在有意为之时使用）

对于新账户，在创建时启用 E2EE：

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` 是 `--enable-e2ee` 的别名。

手动配置等效项：

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

### 状态和信任信号

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` 报告三个独立的信任信号（`--verbose` 显示全部）：

- `Locally trusted`：仅由此客户端信任
- `Cross-signing verified`：SDK 通过交叉签名报告验证
- `Signed by owner`：由您自己的自签名密钥签名（仅诊断）

`Verified by owner` 仅当 `Cross-signing verified` 为 `yes` 时才变为 `yes`。仅本地信任或所有者签名单独存在是不够的。

`--allow-degraded-local-state` 返回尽力而为的诊断而不先准备 Matrix 账户；适用于离线或部分配置的探测。

### 使用恢复密钥验证此设备

恢复密钥是敏感的——通过 stdin 管道传入，而不是在命令行上传递。设置 `MATRIX_RECOVERY_KEY`（或命名账户的 `MATRIX_<ID>_RECOVERY_KEY`）：

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

命令报告三种状态：

- `Recovery key accepted`：Matrix 接受了密钥用于密钥存储或设备信任。
- `Backup usable`：可以使用受信任的恢复材料加载房间密钥备份。
- `Device verified by owner`：此设备具有完整的 Matrix 交叉签名身份信任。

当完整身份信任不完整时，即使恢复密钥解锁了备份材料，命令也会以非零状态退出。在这种情况下，从另一个 Matrix 客户端完成自我验证：

```bash
openclaw matrix verify self
```

`verify self` 在成功退出前等待 `Cross-signing verified: yes`。使用 `--timeout-ms <ms>` 调整等待时间。

字面量密钥形式 `openclaw matrix verify device "<recovery-key>"` 也被接受，但密钥会保留在 shell 历史中。

### Bootstrap 或修复交叉签名

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` 是加密账户的修复和设置命令。按顺序执行：

- Bootstrap 密钥存储，尽可能重用现有恢复密钥
- Bootstrap 交叉签名并上传缺失的公钥
- 标记并交叉签名当前设备
- 如果不存在，创建服务器端房间密钥备份

如果 homeserver 需要 UIA 才能上传交叉签名密钥，OpenClaw 先尝试无认证，然后 `m.login.dummy`，然后 `m.login.password`（需要 `channels.matrix.password`）。

有用的标志：

- `--recovery-key-stdin`（与 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` 配合使用）或 `--recovery-key <key>`
- `--force-reset-cross-signing` 丢弃当前交叉签名身份（仅在有意为之时使用）

### 房间密钥备份

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` 显示是否存在服务器端备份以及此设备是否可以解密它。`backup restore` 将备份的房间密钥导入本地加密存储；如果恢复密钥已在磁盘上，可以省略 `--recovery-key-stdin`。

用新的基线替换损坏的备份（接受丢失不可恢复的旧历史；如果当前备份密钥不可加载，也可以重新创建密钥存储）：

```bash
openclaw matrix verify backup reset --yes
```

仅当您有意希望之前的恢复密钥停止解锁新的备份基线时，才添加 `--rotate-recovery-key`。

### 列出、请求和响应验证

```bash
openclaw matrix verify list
```

列出所选账户的待处理验证请求。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

从此 OpenClaw 账户发送验证请求。`--own-user` 请求自我验证（您在同一用户的另一个 Matrix 客户端接受提示）；`--user-id`/`--device-id`/`--room-id` 针对其他人。`--own-user` 不能与其他定向标志组合使用。

对于较低级别的生命周期处理——通常在影随来自另一个客户端的入站请求时——这些命令对特定请求 `<id>`（由 `verify list` 和 `verify request` 打印）执行操作：

| 命令                                         | 用途                                                    |
| -------------------------------------------- | ------------------------------------------------------- |
| `openclaw matrix verify accept <id>`         | 接受入站请求                                            |
| `openclaw matrix verify start <id>`          | 启动 SAS 流程                                           |
| `openclaw matrix verify sas <id>`            | 打印 SAS 表情符号或十进制数                             |
| `openclaw matrix verify confirm-sas <id>`    | 确认 SAS 与另一个客户端显示的匹配                       |
| `openclaw matrix verify mismatch-sas <id>`   | 当表情符号或十进制数不匹配时拒绝 SAS                    |
| `openclaw matrix verify cancel <id>`         | 取消；接受可选的 `--reason <text>` 和 `--code <matrix-code>` |

`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas` 和 `cancel` 都接受 `--user-id` 和 `--room-id` 作为 DM 跟进提示，当验证锚定到特定的私信房间时使用。

### 多账户注意事项

不带 `--account <id>` 时，Matrix CLI 命令使用隐式默认账户。如果您有多个命名账户且未设置 `channels.matrix.defaultAccount`，命令会拒绝猜测并要求您选择。当命名账户未启用或不可用 E2EE 时，错误指向该账户的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="启动行为">
    启用 `encryption: true` 时，`startupVerification` 默认为 `"if-unverified"`。启动时，未验证的设备在另一个 Matrix 客户端中请求自我验证，跳过重复项并应用冷却（默认 24 小时）。使用 `startupVerificationCooldownHours` 调整或使用 `startupVerification: "off"` 禁用。

    启动还运行保守的加密 bootstrap 通道，重用当前密钥存储和交叉签名身份。如果 bootstrap 状态损坏，OpenClaw 会尝试在没有 `channels.matrix.password` 的情况下进行受保护的修复；如果 homeserver 需要密码 UIA，启动记录警告但保持非致命。已所有者签名的设备将被保留。

    完整的升级流程参见 [Matrix 迁移](/channels/matrix-migration)。

  </Accordion>

  <Accordion title="验证通知">
    Matrix 将验证生命周期通知作为 `m.notice` 消息发布到严格 DM 验证房间：请求、就绪（带"通过表情符号验证"指导）、开始/完成，以及 SAS（表情符号/十进制）详情（如果可用）。

    来自另一个 Matrix 客户端的入站请求会被跟踪并自动接受。对于自我验证，OpenClaw 自动启动 SAS 流程，并在表情符号验证可用后确认自己的一方——您仍然需要在 Matrix 客户端中比较并确认"它们匹配"。

    验证系统通知不会转发到 Agent 聊天管道。

  </Accordion>

  <Accordion title="已删除或无效的 Matrix 设备">
    如果 `verify status` 显示当前设备不再在 homeserver 上列出，请创建新的 OpenClaw Matrix 设备。密码登录：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    对于 Token 认证，在 Matrix 客户端或管理 UI 中创建新的 access token，然后更新 OpenClaw：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    将 `assistant` 替换为失败命令中的账户 ID，或省略 `--account` 以使用默认账户。

  </Accordion>

  <Accordion title="设备卫生">
    旧的 OpenClaw 管理设备可能会积累。列出并清理：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="加密存储">
    Matrix E2EE 使用官方 `matrix-js-sdk` Rust 加密路径，以 `fake-indexeddb` 作为 IndexedDB 垫片。加密状态持久化到 `crypto-idb-snapshot.json`（严格文件权限）。

    加密运行时状态存储在 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 下，包括同步存储、加密存储、恢复密钥、IDB 快照、线程绑定和启动验证状态。当 Token 变更但账户身份保持不变时，OpenClaw 重用最佳现有根，使先前状态保持可见。

  </Accordion>
</AccordionGroup>

## 个人资料管理

更新所选账户的 Matrix 自身个人资料：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

可以在一次调用中传递两个选项。Matrix 直接接受 `mxc://` 头像 URL；当您传递 `http://` 或 `https://` 时，OpenClaw 先上传文件并将解析的 `mxc://` URL 存储到 `channels.matrix.avatarUrl`（或每账户覆盖中）。

## 线程

Matrix 支持自动回复和 message-tool 发送的原生 Matrix 线程。两个独立的控制项控制行为：

### Session 路由（`sessionScope`）

`dm.sessionScope` 决定 Matrix DM 房间如何映射到 OpenClaw Session：

- `"per-user"`（默认）：与同一路由对等方的所有 DM 房间共享一个 Session。
- `"per-room"`：每个 Matrix DM 房间获得自己的 Session 键，即使对等方相同。

显式会话绑定始终优先于 `sessionScope`，因此已绑定的房间和线程保持其选定的目标 Session。

### 回复线程（`threadReplies`）

`threadReplies` 决定 bot 在哪里发布其回复：

- `"off"`：回复为顶层。入站线程消息保留在父 Session 上。
- `"inbound"`：仅当入站消息已在该线程中时，在线程内回复。
- `"always"`：在以触发消息为根的线程内回复；该对话从第一次触发开始通过匹配的线程作用域 Session 路由。

`dm.threadReplies` 仅覆盖私信——例如，保持房间线程隔离同时保持私信扁平。

### 线程继承和斜杠命令

- 入站线程消息包含线程根消息作为额外 Agent 上下文。
- Message-tool 发送在定向到同一房间（或相同 DM 用户目标）时自动继承当前 Matrix 线程，除非提供了显式 `threadId`。
- DM 用户目标重用仅在当前 Session 元数据证明同一 Matrix 账户上的相同 DM 对等方时才会触发；否则 OpenClaw 回退到正常的用户作用域路由。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和线程绑定的 `/acp spawn` 都在 Matrix 房间和私信中有效。
- 当 `threadBindings.spawnSessions` 启用时，顶层 `/focus` 创建新的 Matrix 线程并将其绑定到目标 Session。
- 在现有 Matrix 线程中运行 `/focus` 或 `/acp spawn --thread here` 会就地绑定该线程。

当 OpenClaw 检测到 Matrix DM 房间与同一共享 Session 上的另一个 DM 房间冲突时，它会在该房间发布一次性 `m.notice`，指向 `/focus` 逃生舱口并建议更改 `dm.sessionScope`。只有在启用了线程绑定时才会出现通知。

## ACP 对话绑定

Matrix 房间、私信和现有 Matrix 线程可以变为持久的 ACP 工作区，而无需更改聊天界面。

快速运维员流程：

- 在您想继续使用的 Matrix 私信、房间或现有线程内运行 `/acp spawn codex --bind here`。
- 在顶层 Matrix 私信或房间中，当前私信/房间保留为聊天界面，未来消息路由到派生的 ACP Session。
- 在现有 Matrix 线程中，`--bind here` 就地绑定该当前线程。
- `/new` 和 `/reset` 就地重置同一绑定的 ACP Session。
- `/acp close` 关闭 ACP Session 并移除绑定。

注意：

- `--bind here` 不创建子 Matrix 线程。
- `threadBindings.spawnSessions` 控制 `/acp spawn --thread auto|here`，OpenClaw 需要在这种情况下创建或绑定子 Matrix 线程。

### 线程绑定配置

Matrix 从 `session.threadBindings` 继承全局默认值，还支持每 Channel 覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix 线程绑定 Session 派生默认开启：

- 设置 `threadBindings.spawnSessions: false` 以阻止顶层 `/focus` 和 `/acp spawn --thread auto|here` 创建/绑定 Matrix 线程。
- 设置 `threadBindings.defaultSpawnContext: "isolated"` 当原生子 Agent 线程派生不应分叉父转录时。

## Reaction

Matrix 支持出站 Reaction、入站 Reaction 通知和 ack Reaction。

出站 Reaction 工具受 `channels.matrix.actions.reactions` 控制：

- `react` 向 Matrix 事件添加 Reaction。
- `reactions` 列出 Matrix 事件的当前 Reaction 摘要。
- `emoji=""` 移除 bot 在该事件上的自身 Reaction。
- `remove: true` 仅从 bot 移除指定的表情符号 Reaction。

**解析顺序**（第一个定义的值优先）：

| 设置                    | 顺序                                                                              |
| ----------------------- | --------------------------------------------------------------------------------- |
| `ackReaction`           | 每账户 → Channel → `messages.ackReaction` → Agent 身份表情符号回退               |
| `ackReactionScope`      | 每账户 → Channel → `messages.ackReactionScope` → 默认 `"group-mentions"`         |
| `reactionNotifications` | 每账户 → Channel → 默认 `"own"`                                                   |

`reactionNotifications: "own"` 在 `m.reaction` 事件针对 bot 发布的 Matrix 消息时转发它们；`"off"` 禁用 Reaction 系统事件。Reaction 移除不会合成为系统事件，因为 Matrix 将这些表面为撤回，而不是独立的 `m.reaction` 移除。

## 历史上下文

- `channels.matrix.historyLimit` 控制当 Matrix 房间消息触发 Agent 时，有多少条最近的房间消息作为 `InboundHistory` 包含。回退到 `messages.groupChat.historyLimit`；如果两者都未设置，有效默认值为 `0`。设置 `0` 禁用。
- Matrix 房间历史仅限房间。私信继续使用正常的 Session 历史。
- Matrix 房间历史是待处理的：OpenClaw 缓冲尚未触发回复的房间消息，然后在提及或其他触发到达时对该窗口进行快照。
- 当前触发消息不包含在 `InboundHistory` 中；它保留在该轮的主入站正文中。
- 相同 Matrix 事件的重试重用原始历史快照，而不是漂移到较新的房间消息。

## 上下文可见性

Matrix 支持共享的 `contextVisibility` 控制，用于获取的回复文本、线程根和待处理历史等补充房间上下文。

- `contextVisibility: "all"` 是默认值。补充上下文按接收原样保留。
- `contextVisibility: "allowlist"` 将补充上下文过滤为活动房间/用户 allowlist 检查允许的发送者。
- `contextVisibility: "allowlist_quote"` 的行为类似于 `allowlist`，但仍保留一个显式引用的回复。

此设置影响补充上下文可见性，而不影响入站消息本身是否可以触发回复。触发授权仍来自 `groupPolicy`、`groups`、`groupAllowFrom` 和 DM 策略设置。

## DM 和房间策略

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
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

完全禁用私信同时保持房间工作，设置 `dm.enabled: false`：

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

参见 [Groups](/channels/groups) 了解提及门控和 allowlist 行为。

Matrix 私信配对示例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

如果未批准的 Matrix 用户在批准前持续向您发消息，OpenClaw 会重用相同的待处理配对码，并可能在短暂冷却后发送提醒回复，而不是生成新码。

参见 [Pairing](/channels/pairing) 了解共享 DM 配对流程和存储布局。

## 直接房间修复

如果私信状态不同步，OpenClaw 可能会出现过期的 `m.direct` 映射，指向旧的单人房间而不是活跃的 DM。检查特定对等方的当前映射：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修复它：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

两个命令都接受 `--account <id>` 用于多账户设置。修复流程：

- 优先选择已映射在 `m.direct` 中的严格 1:1 DM
- 回退到与该用户当前加入的任何严格 1:1 DM
- 如果不存在健康的 DM，创建新的直接房间并重写 `m.direct`

它不会自动删除旧房间。它选择健康的 DM 并更新映射，使未来的 Matrix 发送、验证通知和其他私信流程指向正确的房间。

## Exec 审批

Matrix 可以作为原生审批客户端。在 `channels.matrix.execApprovals` 下配置（或使用 `channels.matrix.accounts.<account>.execApprovals` 进行每账户覆盖）：

- `enabled`：通过 Matrix 原生提示传递审批。未设置或为 `"auto"` 时，一旦至少可以解析一个审批者，Matrix 自动启用。设置 `false` 显式禁用。
- `approvers`：允许批准 exec 请求的 Matrix 用户 ID（`@owner:example.org`）。可选——回退到 `channels.matrix.dm.allowFrom`。
- `target`：提示发送到哪里。`"dm"`（默认）发送到审批者私信；`"channel"` 发送到原始 Matrix 房间或私信；`"both"` 两者都发送。
- `agentFilter` / `sessionFilter`：可选的 allowlist，用于哪些 Agent/Session 触发 Matrix 传递。

不同类型的审批授权略有不同：

- **Exec 审批**使用 `execApprovals.approvers`，回退到 `dm.allowFrom`。
- **Plugin 审批**仅通过 `dm.allowFrom` 授权。

两种类型共享 Matrix Reaction 快捷方式和消息更新。审批者在主审批消息上看到 Reaction 快捷方式：

- `✅` 允许一次
- `❌` 拒绝
- `♾️` 始终允许（当有效 exec 策略允许时）

回退斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

只有已解析的审批者可以批准或拒绝。exec 审批的频道传递包含命令文本——仅在受信任的房间启用 `channel` 或 `both`。

相关：[Exec 审批](/tools/exec-approvals)。

## 斜杠命令

斜杠命令（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` 等）直接在私信中有效。在房间中，OpenClaw 还识别以 bot 自身 Matrix 提及为前缀的命令，因此 `@bot:server /new` 触发命令路径，无需自定义提及正则。这使 bot 能够响应 Element 等客户端在用户 Tab 补全 bot 后输入命令时发出的房间风格 `@提及 /命令` 帖子。

授权规则仍然适用：命令发送者必须满足与普通消息相同的 DM 或房间 allowlist/所有者策略。

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

**继承：**

- 顶层 `channels.matrix` 值作为命名账户的默认值，除非账户覆盖它们。
- 使用 `groups.<room>.account` 将继承的房间条目作用域到特定账户。没有 `account` 的条目跨账户共享；当在顶层配置了默认账户时，`account: "default"` 仍然有效。

**默认账户选择：**

- 设置 `defaultAccount` 以选择隐式路由、探测和 CLI 命令偏好的命名账户。
- 如果您有多个账户且其中一个字面命名为 `default`，即使未设置 `defaultAccount`，OpenClaw 也会隐式使用它。
- 如果您有多个命名账户且未选择默认值，CLI 命令拒绝猜测——设置 `defaultAccount` 或传递 `--account <id>`。
- 顶层 `channels.matrix.*` 块仅在其认证完整（`homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`）时才被视为隐式 `default` 账户。命名账户一旦缓存凭据涵盖认证，即可从 `homeserver` + `userId` 发现。

**升级：**

- 当 OpenClaw 在修复或设置期间将单账户配置升级为多账户时，如果存在现有命名账户或 `defaultAccount` 已指向某个账户，则保留它。只有 Matrix 认证/bootstrap 密钥移入升级后的账户；共享传递策略密钥保留在顶层。

参见 [配置参考](/gateway/config-channels#multi-account-all-channels) 了解共享多账户模式。

## 私有/LAN Homeserver

默认情况下，OpenClaw 阻止私有/内部 Matrix homeserver 以防止 SSRF，除非您明确每账户选择加入。

如果您的 homeserver 运行在 localhost、LAN/Tailscale IP 或内部主机名上，为该 Matrix 账户启用 `network.dangerouslyAllowPrivateNetwork`：

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

此选择加入仅允许受信任的私有/内部目标。公共明文 homeserver（如 `http://matrix.example.org:8008`）仍被阻止。尽可能优先使用 `https://`。

## 代理 Matrix 流量

如果您的 Matrix 部署需要显式出站 HTTP(S) 代理，设置 `channels.matrix.proxy`：

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

命名账户可以用 `channels.matrix.accounts.<id>.proxy` 覆盖顶层默认值。OpenClaw 对运行时 Matrix 流量和账户状态探测使用相同的代理设置。

## 目标解析

Matrix 在 OpenClaw 要求您提供房间或用户目标的任何地方接受以下目标形式：

- 用户：`@user:server`、`user:@user:server` 或 `matrix:user:@user:server`
- 房间：`!room:server`、`room:!room:server` 或 `matrix:room:!room:server`
- 别名：`#alias:server`、`channel:#alias:server` 或 `matrix:channel:#alias:server`

Matrix 房间 ID 区分大小写。在配置显式传递目标、cron 任务、绑定或 allowlist 时，使用 Matrix 中的精确房间 ID 大小写。OpenClaw 保持内部 Session 键为规范格式用于存储，因此这些小写键不是 Matrix 传递 ID 的可靠来源。

实时目录查找使用已登录的 Matrix 账户：

- 用户查找在该 homeserver 上查询 Matrix 用户目录。
- 房间查找直接接受显式房间 ID 和别名。已加入房间的名称查找是尽力而为的，仅在设置了 `dangerouslyAllowNameMatching: true` 时适用于运行时房间 allowlist。
- 如果房间名称无法解析为 ID 或别名，运行时 allowlist 解析会忽略它。

## 配置参考

Allowlist 风格的用户字段（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）接受完整的 Matrix 用户 ID（最安全）。非 ID 用户条目默认被忽略。如果设置了 `dangerouslyAllowNameMatching: true`，精确的 Matrix 目录显示名称匹配在启动时和 allowlist 在监视器运行时发生变化时解析；无法解析的条目在运行时被忽略。

房间 allowlist 键（`groups`，旧版 `rooms`）应该是房间 ID 或别名。普通房间名称键默认被忽略；`dangerouslyAllowNameMatching: true` 恢复对已加入房间名称的尽力而为查找。

### 账户和连接

- `enabled`：启用或禁用 Channel。
- `name`：账户的可选显示标签。
- `defaultAccount`：配置了多个 Matrix 账户时首选的账户 ID。
- `accounts`：命名的每账户覆盖。顶层 `channels.matrix` 值作为默认值继承。
- `homeserver`：homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许此账户连接到 `localhost`、LAN/Tailscale IP 或内部主机名。
- `proxy`：Matrix 流量的可选 HTTP(S) 代理 URL。支持每账户覆盖。
- `userId`：完整的 Matrix 用户 ID（`@bot:example.org`）。
- `accessToken`：基于 Token 认证的 access token。支持明文和 SecretRef 值，跨 env/file/exec Provider（[密钥管理](/gateway/secrets)）。
- `password`：密码登录的密码。支持明文和 SecretRef 值。
- `deviceId`：显式 Matrix 设备 ID。
- `deviceName`：密码登录时使用的设备显示名称。
- `avatarUrl`：存储的自身头像 URL，用于个人资料同步和 `profile set` 更新。
- `initialSyncLimit`：启动同步期间获取的最大事件数。

### 加密

- `encryption`：启用 E2EE。默认：`false`。
- `startupVerification`：`"if-unverified"`（E2EE 开启时默认）或 `"off"`。在此设备未验证时自动在启动时请求自我验证。
- `startupVerificationCooldownHours`：下次自动启动请求前的冷却时间。默认：`24`。

### 访问和策略

- `groupPolicy`：`"open"`、`"allowlist"` 或 `"disabled"`。默认：`"allowlist"`。
- `groupAllowFrom`：房间流量的用户 ID allowlist。
- `dm.enabled`：为 `false` 时，忽略所有私信。默认：`true`。
- `dm.policy`：`"pairing"`（默认）、`"allowlist"`、`"open"` 或 `"disabled"`。在 bot 加入并将房间分类为 DM 后应用；不影响邀请处理。
- `dm.allowFrom`：DM 流量的用户 ID allowlist。
- `dm.sessionScope`：`"per-user"`（默认）或 `"per-room"`。
- `dm.threadReplies`：仅 DM 的回复线程覆盖（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`：接受来自其他已配置 Matrix bot 账户的消息（`true` 或 `"mentions"`）。
- `allowlistOnly`：为 `true` 时，强制所有活动 DM 策略（除 `"disabled"` 外）和 `"open"` 群组策略为 `"allowlist"`。不更改 `"disabled"` 策略。
- `dangerouslyAllowNameMatching`：为 `true` 时，允许 Matrix 显示名称目录查找用于用户 allowlist 条目，以及已加入房间名称查找用于房间 allowlist 键。推荐使用完整的 `@user:server` ID 和房间 ID 或别名。
- `autoJoin`：`"always"`、`"allowlist"` 或 `"off"`。默认：`"off"`。适用于每个 Matrix 邀请，包括 DM 风格的邀请。
- `autoJoinAllowlist`：`autoJoin` 为 `"allowlist"` 时允许的房间/别名。别名条目针对 homeserver 解析，而非被邀请房间声明的状态。
- `contextVisibility`：补充上下文可见性（`"all"` 默认，`"allowlist"`，`"allowlist_quote"`）。

### 回复行为

- `replyToMode`：`"off"`、`"first"`、`"all"` 或 `"batched"`。
- `threadReplies`：`"off"`、`"inbound"` 或 `"always"`。
- `threadBindings`：线程绑定 Session 路由和生命周期的每 Channel 覆盖。
- `streaming`：`"off"`（默认）、`"partial"`、`"quiet"` 或对象形式 `{ mode, preview: { toolProgress } }`。`true` ↔ `"partial"`，`false` ↔ `"off"`。
- `blockStreaming`：为 `true` 时，已完成的 assistant 块作为独立进度消息保留。
- `markdown`：出站文本的可选 Markdown 渲染配置。
- `responsePrefix`：出站回复前置的可选字符串。
- `textChunkLimit`：`chunkMode: "length"` 时的出站块大小（字符数）。默认：`4000`。
- `chunkMode`：`"length"`（默认，按字符数分割）或 `"newline"`（在行边界分割）。
- `historyLimit`：房间消息触发 Agent 时作为 `InboundHistory` 包含的最近房间消息数量。回退到 `messages.groupChat.historyLimit`；有效默认值 `0`（禁用）。
- `mediaMaxMb`：出站发送和入站处理的媒体大小上限（MB）。

### Reaction 设置

- `ackReaction`：此 Channel/账户的 ack Reaction 覆盖。
- `ackReactionScope`：作用域覆盖（`"group-mentions"` 默认，`"group-all"`，`"direct"`，`"all"`，`"none"`，`"off"`）。
- `reactionNotifications`：入站 Reaction 通知模式（`"own"` 默认，`"off"`）。

### 工具和每房间覆盖

- `actions`：每操作工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`：每房间策略映射。Session 身份在解析后使用稳定的房间 ID。（`rooms` 是旧版别名。）
  - `groups.<room>.account`：将一个继承的房间条目限制到特定账户。
  - `groups.<room>.allowBots`：Channel 级设置的每房间覆盖（`true` 或 `"mentions"`）。
  - `groups.<room>.users`：每房间发送者 allowlist。
  - `groups.<room>.tools`：每房间工具允许/拒绝覆盖。
  - `groups.<room>.autoReply`：每房间提及门控覆盖。`true` 禁用该房间的提及要求；`false` 强制重新开启。
  - `groups.<room>.skills`：每房间 Skill 过滤器。
  - `groups.<room>.systemPrompt`：每房间系统提示片段。

### Exec 审批设置

- `execApprovals.enabled`：通过 Matrix 原生提示传递 exec 审批。
- `execApprovals.approvers`：允许审批的 Matrix 用户 ID。回退到 `dm.allowFrom`。
- `execApprovals.target`：`"dm"`（默认）、`"channel"` 或 `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`：传递的可选 Agent/Session allowlist。

## 相关

- [Channels 概述](/channels) — 所有支持的 Channel
- [Pairing](/channels/pairing) — 私信认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
