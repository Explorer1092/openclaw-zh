---
mmh3_hash: "4cdac787d0d7404f6e694ab87701fd01"
title: "Matrix"
summary: "Matrix 支持状态、设置和配置示例"
read_when:
  - 在 OpenClaw 中设置 Matrix
  - 配置 Matrix E2EE 和验证
---

Matrix 是 OpenClaw 的可下载 Channel Plugin。
它使用官方 `matrix-js-sdk`，支持私信、房间、话题串、媒体、表情反应、投票、位置和 E2EE。

## 安装

在配置 Channel 之前，从 ClawHub 安装 Matrix：

```bash
openclaw plugins install @openclaw/matrix
```

裸 Plugin 规格优先尝试 ClawHub，然后回退到 npm。要强制指定来源，使用 `openclaw plugins install clawhub:@openclaw/matrix` 或 `openclaw plugins install npm:@openclaw/matrix`。

从本地检出：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` 会注册并启用 Plugin，因此不需要单独执行 `openclaw plugins enable matrix`。在您完成下面的 Channel 配置之前，该 Plugin 不会执行任何操作。详情参见[插件](/tools/plugin)。

## 设置

1. 在您的 Homeserver 上创建 Matrix 账户。
2. 配置 `channels.matrix`，使用 `homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`。
3. 重启 Gateway。
4. 向机器人发送私信或邀请它加入房间（参见 [auto-join](#auto-join)——全新的邀请仅在 `autoJoin` 允许时才有效）。

### 交互式设置

```bash
openclaw channels add
openclaw configure --section channels
```

向导询问：Homeserver URL、认证方式（访问令牌或密码）、用户 ID（密码认证时）、可选设备名称、是否启用 E2EE，以及是否配置房间访问和自动加入。

如果匹配的 `MATRIX_*` 环境变量已存在且所选账户尚未保存认证，向导会提供环境变量快捷方式。要在保存 allowlist 之前解析房间名称，请运行 `openclaw channels resolve --channel matrix "Project Room"`。启用 E2EE 时，向导写入配置并运行与 [`openclaw matrix encryption setup`](#encryption-and-verification) 相同的引导流程。

### 最小配置

令牌认证：

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

### Auto-join

`channels.matrix.autoJoin` 默认为 `off`。在默认情况下，机器人不会加入来自全新邀请的新房间或私信，除非您手动加入。

OpenClaw 在邀请时无法判断被邀请的房间是私信还是群组，因此所有邀请（包括私信式邀请）首先通过 `autoJoin`。`dm.policy` 只在机器人加入并将房间分类为私信后才生效。

<Warning>
将 `autoJoin: "allowlist"` 与 `autoJoinAllowlist` 一起设置以限制接受哪些邀请，或设置 `autoJoin: "always"` 以接受所有邀请。

`autoJoinAllowlist` 只接受稳定目标：`!roomId:server`、`#alias:server` 或 `*`。普通房间名称会被拒绝；别名条目在 Homeserver 上解析，而不是在被邀请房间声称的状态上解析。
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

要接受所有邀请，使用 `autoJoin: "always"`。

### Allowlist 目标格式

私信和房间 allowlist 最好使用稳定 ID：

- 私信（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：使用 `@user:server`。显示名称默认被忽略，因为它们是可变的；仅在明确需要与显示名称条目兼容时才设置 `dangerouslyAllowNameMatching: true`。
- 房间 allowlist 键（`groups`、旧版 `rooms`）：使用 `!room:server` 或 `#alias:server`。普通房间名称默认被忽略；仅在明确需要与已加入房间名称查找兼容时才设置 `dangerouslyAllowNameMatching: true`。
- 邀请 allowlist（`autoJoinAllowlist`）：使用 `!room:server`、`#alias:server` 或 `*`。普通房间名称会被拒绝。

### 账户 ID 规范化

向导将友好名称转换为规范化账户 ID。例如，`Ops Bot` 变为 `ops-bot`。标点在作用域内的环境变量名称中进行转义，以防止两个账户冲突：`-` → `_X2D_`，因此 `ops-prod` 映射为 `MATRIX_OPS_X2D_PROD_*`。

### 缓存凭据

Matrix 将缓存的凭据存储在 `~/.openclaw/credentials/matrix/`。
默认账户使用 `credentials.json`；命名账户使用 `credentials-<account>.json`。
当缓存凭据存在时，OpenClaw 在设置、doctor 和 Channel 状态发现中将 Matrix 视为已配置，即使当前认证未直接设置在配置中。

### 环境变量

配置键未设置时使用。默认账户使用无前缀名称；命名账户在后缀前插入账户 ID。

| 默认账户              | 命名账户（`<ID>` 为规范化账户 ID）  |
| --------------------- | ----------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`          |

对于账户 `ops`，名称变为 `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN` 等。恢复密钥环境变量在您通过 `--recovery-key-stdin` 管道传入密钥时，会被恢复感知的 CLI 流（`verify backup restore`、`verify device`、`verify bootstrap`）读取。

`MATRIX_HOMESERVER` 不能从工作区 `.env` 设置；参见 [工作区 `.env` 文件](/gateway/security)。

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

Matrix 回复流式传输是可选的。`streaming` 控制 OpenClaw 如何传递进行中的助手回复；`blockStreaming` 控制每个完成的块是否保留为独立的 Matrix 消息。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

要保留实时答案预览但隐藏中间的工具/进度行，使用对象形式：

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

| `streaming`        | 行为                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `"off"`（默认）    | 等待完整回复，一次性发送。`true` ↔ `"partial"`，`false` ↔ `"off"`。                                         |
| `"partial"`        | 在模型写入当前块时就地编辑一条普通文本消息。标准 Matrix 客户端可能在第一次预览时而非最终编辑时发送通知。    |
| `"quiet"`          | 与 `"partial"` 相同，但消息是非通知型通知。接收者仅在每用户推送规则匹配最终确定的编辑时才收到通知（见下文）。|

`blockStreaming` 与 `streaming` 独立：

| `streaming`              | `blockStreaming: true`                          | `blockStreaming: false`（默认）          |
| ------------------------ | ----------------------------------------------- | --------------------------------------- |
| `"partial"` / `"quiet"` | 当前块的实时草稿，已完成块保留为消息            | 当前块的实时草稿，就地最终确定          |
| `"off"`                  | 每个完成块一条通知 Matrix 消息                  | 完整回复一条通知 Matrix 消息            |

注意：

- 如果预览超出 Matrix 每事件大小限制，OpenClaw 停止预览流式传输并回退到仅最终传递。
- 媒体回复仍正常发送附件。如果过时的预览无法安全重用，OpenClaw 在发送最终媒体回复之前将其撤回。
- Matrix 预览流式传输激活时，工具进度预览更新默认启用。设置 `streaming.preview.toolProgress: false` 可保留答案文本的预览编辑，但让工具进度走正常传递路径。
- 预览编辑会消耗额外的 Matrix API 调用。如果您需要最保守的速率限制行为，请将 `streaming` 设为 `"off"`。

### 为静默最终预览配置自托管推送规则

`streaming: "quiet"` 仅在块或轮次最终确定时通知接收者——每用户推送规则必须匹配最终化的预览标记。参见 [Matrix 静默预览推送规则](/channels/matrix-push-rules) 获取完整方案（接收者令牌、推送器检查、规则安装、每 Homeserver 说明）。

## 审批元数据

Matrix 原生审批提示是普通的 `m.room.message` 事件，在 `com.openclaw.approval` 下带有 OpenClaw 特定的自定义事件内容。Matrix 允许自定义事件内容键，因此标准客户端仍然渲染文本正文，而支持 OpenClaw 的客户端可以读取结构化的审批 ID、类型、状态、可用决策以及 exec/Plugin 详情。

当审批提示对于单个 Matrix 事件来说太长时，OpenClaw 会分块显示文本，并将 `com.openclaw.approval` 仅附加到第一个块。allow/deny 决策的表情反应绑定到该第一个事件，因此长提示与单事件提示保持相同的审批目标。

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

所有 `openclaw matrix` 命令接受 `--verbose`（完整诊断）、`--json`（机器可读输出）和 `--account <id>`（多账户设置）。默认输出简洁并静默内部 SDK 日志。以下示例展示规范形式；根据需要添加标志。

### 启用加密

```bash
openclaw matrix encryption setup
```

引导密钥存储和交叉签名，必要时创建房间密钥备份，然后打印状态和后续步骤。有用的标志：

- `--recovery-key <key>` 在引导之前应用恢复密钥（优先使用下面记录的 stdin 形式）
- `--force-reset-cross-signing` 丢弃当前交叉签名身份并创建新身份（仅有意使用）

对于新账户，在创建时启用 E2EE：

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` 是 `--enable-e2ee` 的别名。

手动配置等效：

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

`verify status` 报告三个独立的信任信号（`--verbose` 显示所有信号）：

- `Locally trusted`：仅受此客户端信任
- `Cross-signing verified`：SDK 通过交叉签名报告已验证
- `Signed by owner`：由您自己的自签名密钥签名（仅诊断用）

`Verified by owner` 仅在 `Cross-signing verified` 为 `yes` 时才变为 `yes`。仅本地信任或所有者签名本身都不够。

`--allow-degraded-local-state` 在不预先准备 Matrix 账户的情况下返回尽力而为的诊断；适用于离线或部分配置的探测。

### 使用恢复密钥验证此设备

恢复密钥是敏感的——通过 stdin 管道传入，而不是在命令行上传入。设置 `MATRIX_RECOVERY_KEY`（或命名账户的 `MATRIX_<ID>_RECOVERY_KEY`）：

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

该命令报告三种状态：

- `Recovery key accepted`：Matrix 接受了密钥用于密钥存储或设备信任。
- `Backup usable`：可以使用受信任的恢复材料加载房间密钥备份。
- `Device verified by owner`：此设备具有完整的 Matrix 交叉签名身份信任。

当完整身份信任不完整时，即使恢复密钥解锁了备份材料，也会以非零退出。在这种情况下，从另一个 Matrix 客户端完成自我验证：

```bash
openclaw matrix verify self
```

`verify self` 在退出之前等待 `Cross-signing verified: yes`。使用 `--timeout-ms <ms>` 调整等待时间。

字面密钥形式 `openclaw matrix verify device "<recovery-key>"` 也被接受，但密钥会进入您的 shell 历史记录。

### 引导或修复交叉签名

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` 是加密账户的修复和设置命令。按顺序执行：

- 引导密钥存储，尽可能复用现有恢复密钥
- 引导交叉签名并上传缺失的公共密钥
- 标记并交叉签名当前设备
- 如果服务器侧房间密钥备份不存在则创建

如果 Homeserver 要求 UIA 上传交叉签名密钥，OpenClaw 先尝试无认证，然后 `m.login.dummy`，再在配置了 `channels.matrix.password` 时使用 `m.login.password`。

有用的标志：

- `--recovery-key-stdin`（与 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` 配合使用）或 `--recovery-key <key>`
- `--force-reset-cross-signing` 丢弃当前交叉签名身份（仅有意使用）

### 房间密钥备份

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` 显示服务器侧备份是否存在以及此设备是否可以解密。`backup restore` 将备份的房间密钥导入本地加密存储；如果恢复密钥已在磁盘上，可以省略 `--recovery-key-stdin`。

要用新基线替换损坏的备份（接受丢失不可恢复的旧历史；如果当前备份密钥无法加载，也可以重新创建密钥存储）：

```bash
openclaw matrix verify backup reset --yes
```

仅在您有意希望之前的恢复密钥停止解锁新备份基线时添加 `--rotate-recovery-key`。

### 列出、请求和响应验证

```bash
openclaw matrix verify list
```

列出所选账户的待处理验证请求。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

从此 OpenClaw 账户发送验证请求。`--own-user` 请求自我验证（您在同一用户的另一个 Matrix 客户端接受提示）；`--user-id`/`--device-id`/`--room-id` 针对其他人。`--own-user` 不能与其他目标标志组合。

对于较低级别的生命周期处理——通常在跟踪来自另一个客户端的入站请求时——这些命令作用于特定请求 `<id>`（由 `verify list` 和 `verify request` 打印）：

| 命令                                           | 用途                                        |
| ---------------------------------------------- | ------------------------------------------- |
| `openclaw matrix verify accept <id>`           | 接受入站请求                                |
| `openclaw matrix verify start <id>`            | 启动 SAS 流程                               |
| `openclaw matrix verify sas <id>`              | 打印 SAS 表情或十进制                       |
| `openclaw matrix verify confirm-sas <id>`      | 确认 SAS 与另一个客户端显示的匹配           |
| `openclaw matrix verify mismatch-sas <id>`     | 当表情或十进制不匹配时拒绝 SAS              |
| `openclaw matrix verify cancel <id>`           | 取消；接受可选的 `--reason <text>` 和 `--code <matrix-code>` |

`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas` 和 `cancel` 都接受 `--user-id` 和 `--room-id` 作为验证锚定到特定直接消息房间时的 DM 跟进提示。

### 多账户说明

没有 `--account <id>` 时，Matrix CLI 命令使用隐式默认账户。如果您有多个命名账户且未设置 `channels.matrix.defaultAccount`，命令会拒绝猜测并要求您选择。当命名账户的 E2EE 被禁用或不可用时，错误会指向该账户的配置键，例如 `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="启动行为">
    当 `encryption: true` 时，`startupVerification` 默认为 `"if-unverified"`。启动时，未验证的设备在另一个 Matrix 客户端请求自我验证，跳过重复并应用冷却期（默认 24 小时）。使用 `startupVerificationCooldownHours` 调整，或使用 `startupVerification: "off"` 禁用。

    启动还运行保守的加密引导流程，复用当前密钥存储和交叉签名身份。如果引导状态损坏，OpenClaw 即使没有 `channels.matrix.password` 也会尝试受保护的修复；如果 Homeserver 要求密码 UIA，启动记录警告并保持非致命。已由所有者签名的设备被保留。

    参见 [Matrix 迁移](/channels/matrix-migration) 获取完整升级流程。

  </Accordion>

  <Accordion title="验证通知">
    Matrix 将验证生命周期通知作为 `m.notice` 消息发布到严格的私信验证房间：请求、就绪（带"通过表情验证"指引）、开始/完成，以及可用时的 SAS（表情/十进制）详情。

    来自另一个 Matrix 客户端的入站请求被跟踪并自动接受。对于自我验证，OpenClaw 自动启动 SAS 流程并确认自己一侧——您仍需要在 Matrix 客户端中比较并确认"它们匹配"。

    验证系统通知不会转发到 Agent 聊天管道。

  </Accordion>

  <Accordion title="已删除或无效的 Matrix 设备">
    如果 `verify status` 显示当前设备不再列于 Homeserver，请创建新的 OpenClaw Matrix 设备。对于密码登录：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    对于令牌认证，在 Matrix 客户端或管理 UI 中创建新的访问令牌，然后更新 OpenClaw：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    将 `assistant` 替换为失败命令中的账户 ID，或省略 `--account` 以使用默认账户。

  </Accordion>

  <Accordion title="设备维护">
    旧的 OpenClaw 管理设备会积累。列出并清理：

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="加密存储">
    Matrix E2EE 使用官方 `matrix-js-sdk` Rust 加密路径，以 `fake-indexeddb` 作为 IndexedDB 垫片。加密状态持久化到 `crypto-idb-snapshot.json`（受限文件权限）。

    加密运行时状态位于 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`，包含同步存储、加密存储、恢复密钥、IDB 快照、线程绑定和启动验证状态。当令牌更改但账户身份保持不变时，OpenClaw 复用最佳现有根，使先前的状态保持可见。

  </Accordion>
</AccordionGroup>

## 配置文件管理

使用以下命令更新所选账户的 Matrix 自身配置文件：

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

在需要明确针对命名 Matrix 账户时添加 `--account <id>`。

Matrix 直接接受 `mxc://` 头像 URL。当您传入 `http://` 或 `https://` 头像 URL 时，OpenClaw 会先将其上传到 Matrix，并将解析后的 `mxc://` URL 存回 `channels.matrix.avatarUrl`（或所选账户覆盖）。

## 话题串

Matrix 支持原生 Matrix 话题串，用于自动回复和消息工具发送。以下两个独立开关控制其行为：

### 会话路由（sessionScope）

`dm.sessionScope` 决定 Matrix 私信房间如何映射到 OpenClaw Session：

- `"per-user"`（默认）：与相同路由对等体的所有私信房间共享同一个 Session。
- `"per-room"`：每个 Matrix 私信房间获得自己的 Session 键，即使对等体相同。

显式对话绑定始终优先于 `sessionScope`，因此已绑定的房间和话题串保持其选定的目标 Session。

### 回复话题串（threadReplies）

`threadReplies` 决定机器人在哪里发布回复：

- `"off"`：回复在顶层。入站话题串消息保留在父 Session 中。
- `"inbound"`：仅在入站消息已在话题串中时在话题串内回复。
- `"always"`：在以触发消息为根的话题串内回复；该对话从第一个触发器开始通过匹配的话题串范围 Session 路由。

`dm.threadReplies` 仅为私信覆盖顶层设置——例如，在保持房间话题串隔离的同时保持私信扁平化。

### 话题串继承和斜杠命令

- 入站话题串消息将话题串根消息作为额外的 Agent 上下文包含。
- 消息工具发送在目标为相同房间或相同私信用户目标时自动继承当前 Matrix 话题串，除非提供了明确的 `threadId`。
- 相同会话私信用户目标复用仅在当前会话元数据证明同一 Matrix 账户上的相同私信对等体时触发；否则 OpenClaw 回退到正常的用户范围路由。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和话题串绑定的 `/acp spawn` 在 Matrix 房间和私信中均可使用。
- 顶层 `/focus` 在 `threadBindings.spawnSessions` 启用时创建新的 Matrix 话题串并将其绑定到目标 Session。
- 在现有 Matrix 话题串内运行 `/focus` 或 `/acp spawn --thread here` 会就地绑定该话题串。

当 OpenClaw 检测到 Matrix 私信房间与另一个私信房间在相同共享 Session 上发生冲突时，它会在该房间中发布一次性 `m.notice`，指向 `/focus` 退出路径并建议更改 `dm.sessionScope`。该通知仅在话题串绑定已启用时出现。

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
- `threadBindings.spawnSessions` 用于管控 `/acp spawn --thread auto|here`，其中 OpenClaw 需要创建或绑定子 Matrix 话题串。

### 话题串绑定配置

Matrix 从 `session.threadBindings` 继承全局默认值，并支持每个 Channel 的覆盖：

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix 话题串绑定的生成功能默认开启：

- 设置 `threadBindings.spawnSessions: false` 以阻止顶层 `/focus` 和 `/acp spawn --thread auto|here` 创建/绑定 Matrix 话题串。
- 设置 `threadBindings.defaultSpawnContext: "isolated"` 以在原生子 Agent 话题串生成时不 fork 父对话记录。

## 表情反应

Matrix 支持出站表情反应操作、入站表情反应通知和确认反应。

出站表情反应工具受 `channels.matrix.actions.reactions` 控制：

- `react` 为特定 Matrix 事件添加表情反应。
- `reactions` 列出特定 Matrix 事件的当前表情反应摘要。
- `emoji=""` 移除机器人账户对该事件的自己的表情反应。
- `remove: true` 仅从机器人账户移除指定的表情反应。

**解析顺序**（第一个已定义的值优先）：

| 设置                    | 顺序                                                                           |
| ----------------------- | ------------------------------------------------------------------------------ |
| `ackReaction`           | 每账户 → Channel → `messages.ackReaction` → Agent 身份表情回退                 |
| `ackReactionScope`      | 每账户 → Channel → `messages.ackReactionScope` → 默认 `"group-mentions"`       |
| `reactionNotifications` | 每账户 → Channel → 默认 `"own"`                                                |

`reactionNotifications: "own"` 在 `m.reaction` 事件针对机器人发送的 Matrix 消息时转发已添加的事件；`"off"` 禁用表情反应系统事件。表情反应移除未被合成为系统事件，因为 Matrix 将这些作为撤销而非独立的 `m.reaction` 移除来呈现。

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
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

要完全屏蔽私信同时保持房间正常工作，设置 `dm.enabled: false`：

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

两个命令均接受 `--account <id>` 用于多账户设置。修复流程：

- 优先选择已在 `m.direct` 中映射的严格 1:1 私信
- 回退到与该用户任何当前已加入的严格 1:1 私信
- 如果没有健康的私信，创建新的直接房间并重写 `m.direct`

修复流程不会自动删除旧房间。它只选择健康的私信并更新映射，使新的 Matrix 发送、验证通知和其他直接消息流指向正确的房间。

## Exec 审批

Matrix 可以作为原生审批客户端。在 `channels.matrix.execApprovals` 下配置（或使用 `channels.matrix.accounts.<account>.execApprovals` 进行每账户覆盖）：

- `enabled`：通过 Matrix 原生提示传递审批。未设置或为 `"auto"` 时，当至少一个审批者可以解析时 Matrix 自动启用。设置 `false` 可明确禁用。
- `approvers`：允许批准 exec 请求的 Matrix 用户 ID（`@owner:example.org`）。可选——回退到 `channels.matrix.dm.allowFrom`。
- `target`：提示发送位置。`"dm"`（默认）发送到审批者私信；`"channel"` 发送到发起的 Matrix 房间或私信；`"both"` 同时发送。
- `agentFilter` / `sessionFilter`：可选的 Agent/Session allowlist，用于决定哪些 Agent/Session 触发 Matrix 传递。

不同审批类型的授权规则略有不同：

- **Exec 审批**使用 `execApprovals.approvers`，回退到 `dm.allowFrom`。
- **Plugin 审批**仅通过 `dm.allowFrom` 授权。

两种类型共享 Matrix 表情反应快捷方式和消息更新。审批者在主审批消息上看到表情反应快捷方式：

- `✅` 允许一次
- `❌` 拒绝
- `♾️` 始终允许（当有效的 exec 策略允许时）

备用斜杠命令：`/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

只有已解析的审批者才能批准或拒绝。exec 审批的 Channel 传递包含命令文本——仅在受信任的房间中启用 `channel` 或 `both`。

相关文档：[Exec 审批](/tools/exec-approvals)。

## 斜杠命令

斜杠命令（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` 等）在私信中直接工作。在房间中，OpenClaw 还会识别以机器人自身 Matrix 提及为前缀的命令，因此 `@bot:server /new` 会触发命令路径，无需自定义提及正则表达式。这使机器人能响应 Element 等客户端在用户 Tab 补全机器人后键入命令时发送的房间式 `@mention /command` 消息。

授权规则仍然适用：命令发送者必须满足与普通消息相同的私信或房间 allowlist/所有者策略。

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
- 使用 `groups.<room>.account` 将继承的房间条目限定到特定账户。不带 `account` 的条目在所有账户间共享；`account: "default"` 在顶层配置了默认账户时仍然有效。

**默认账户选择：**

- 设置 `defaultAccount` 以选择隐式路由、探测和 CLI 命令优先使用的命名账户。
- 如果您有多个账户且其中一个 ID 为 `default`，即使未设置 `defaultAccount`，OpenClaw 也会隐式使用该账户。
- 如果您有多个命名账户且未选择默认账户，CLI 命令会拒绝猜测——设置 `defaultAccount` 或传入 `--account <id>`。
- 顶层 `channels.matrix.*` 块仅在其认证完整（`homeserver` + `accessToken`，或 `homeserver` + `userId` + `password`）时才被视为隐式 `default` 账户。命名账户一旦缓存凭据满足认证，即可从 `homeserver` + `userId` 被发现。

**提升：**

- 当 OpenClaw 在修复或设置期间将单账户配置提升为多账户时，如果已有命名账户或 `defaultAccount` 已指向某账户键，则保留该账户。只有 Matrix 认证/引导键会移入提升后的账户；共享的传递策略键保留在顶层。

参见[配置参考](/gateway/config-channels#multi-account-all-channels)了解共享的多账户模式。

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

Matrix 房间 ID 区分大小写。在配置明确的传递目标、cron 任务、绑定或 allowlist 时，请使用 Matrix 中的精确房间 ID 大小写。OpenClaw 对存储使用规范化的内部 Session 键，因此这些小写键不是 Matrix 传递 ID 的可靠来源。

实时目录查找使用已登录的 Matrix 账户：

- 用户查找在该 Homeserver 上查询 Matrix 用户目录。
- 房间查找直接接受明确的房间 ID 和别名，然后回退到搜索该账户已加入的房间名称。
- 已加入房间的名称查找是尽力而为的。如果房间名称无法解析为 ID 或别名，运行时 allowlist 解析会忽略它。

## 配置参考

Allowlist 类型字段（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）接受完整的 Matrix 用户 ID（最安全）。非 ID 用户条目默认被忽略。如果设置了 `dangerouslyAllowNameMatching: true`，精确的 Matrix 目录显示名称匹配会在启动时以及 monitor 运行期间 allowlist 更改时解析；无法解析的条目在运行时被忽略。

房间 allowlist 键（`groups`、旧版 `rooms`）应为房间 ID 或别名。普通房间名称键默认被忽略；`dangerouslyAllowNameMatching: true` 可恢复针对已加入房间名称的尽力查找。

### 账户和连接

- `enabled`：启用或禁用 Channel。
- `name`：账户的可选标签。
- `defaultAccount`：配置了多个 Matrix 账户时的首选账户 ID。
- `accounts`：命名的每账户覆盖。顶层 `channels.matrix` 值作为这些条目的默认值。
- `homeserver`：Homeserver URL，例如 `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`：允许此账户连接到 `localhost`、LAN/Tailscale IP 或内部主机名。
- `proxy`：Matrix 流量的可选 HTTP(S) 代理 URL。支持每账户覆盖。
- `userId`：完整的 Matrix 用户 ID（`@bot:example.org`）。
- `accessToken`：基于令牌认证的访问令牌。支持明文值和 SecretRef 值，适用于 env/file/exec 提供者（[密钥管理](/gateway/secrets)）。
- `password`：密码登录的密码。支持明文值和 SecretRef 值。
- `deviceId`：明确的 Matrix 设备 ID。
- `deviceName`：密码登录的设备显示名称。
- `avatarUrl`：存储的自头像 URL，用于配置文件同步和 `profile set` 更新。
- `initialSyncLimit`：启动同步期间获取的最大事件数。

### 加密

- `encryption`：启用 E2EE。默认：`false`。
- `startupVerification`：`"if-unverified"`（E2EE 开启时的默认值）或 `"off"`。在此设备未验证时启动时自动请求自我验证。
- `startupVerificationCooldownHours`：下次自动启动请求前的冷却时间。默认：`24`。

### 访问和策略

- `groupPolicy`：`"open"`、`"allowlist"` 或 `"disabled"`。默认：`"allowlist"`。
- `groupAllowFrom`：房间流量的用户 ID allowlist。
- `dm.enabled`：为 `false` 时忽略所有私信。默认：`true`。
- `dm.policy`：`"pairing"`（默认）、`"allowlist"`、`"open"` 或 `"disabled"`。在机器人加入并将房间分类为私信后生效；不影响邀请处理。
- `dm.allowFrom`：私信流量的用户 ID allowlist。
- `dm.sessionScope`：`"per-user"`（默认）或 `"per-room"`。
- `dm.threadReplies`：仅私信话题串策略覆盖（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`：接受来自其他已配置 Matrix 机器人账户的消息（`true` 或 `"mentions"`）。
- `allowlistOnly`：为 `true` 时，强制所有活跃私信策略（除 `"disabled"` 外）和 `"open"` 房间策略改为 `"allowlist"`。不更改 `"disabled"` 策略。
- `autoJoin`：`"always"`、`"allowlist"` 或 `"off"`。默认：`"off"`。适用于所有 Matrix 邀请，包括私信式邀请。
- `autoJoinAllowlist`：`autoJoin` 为 `"allowlist"` 时允许的房间/别名。别名条目在 Homeserver 上解析，而非基于被邀请房间声称的状态。
- `contextVisibility`：补充上下文可见性（默认 `"all"`、`"allowlist"`、`"allowlist_quote"`）。

### 回复行为

- `replyToMode`：`"off"`、`"first"`、`"all"` 或 `"batched"`。
- `threadReplies`：`"off"`、`"inbound"` 或 `"always"`。
- `threadBindings`：话题串绑定会话路由和生命周期的每 Channel 覆盖。
- `streaming`：`"off"`（默认）、`"partial"`、`"quiet"` 或对象形式 `{ mode, preview: { toolProgress } }`。`true` ↔ `"partial"`，`false` ↔ `"off"`。
- `blockStreaming`：为 `true` 时，已完成的助手块保留为独立的进度消息。
- `markdown`：出站文本的可选 Markdown 渲染配置。
- `responsePrefix`：出站回复的可选前缀字符串。
- `textChunkLimit`：`chunkMode: "length"` 时的出站块大小（字符数）。默认：`4000`。
- `chunkMode`：`"length"`（默认，按字符数分割）或 `"newline"`（在行边界处分割）。
- `historyLimit`：房间消息触发 Agent 时作为 `InboundHistory` 包含的最近房间消息数。回退到 `messages.groupChat.historyLimit`；有效默认值 `0`（禁用）。
- `mediaMaxMb`：出站发送和入站媒体处理的媒体大小上限（MB）。

### 表情反应设置

- `ackReaction`：此 Channel/账户的确认反应覆盖。
- `ackReactionScope`：范围覆盖（默认 `"group-mentions"`、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`：入站表情反应通知模式（默认 `"own"`、`"off"`）。

### 工具和每房间覆盖

- `actions`：每操作工具门控（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`：每房间策略映射。会话身份在解析后使用稳定的房间 ID。（`rooms` 是旧版别名。）
  - `groups.<room>.account`：将一个继承的房间条目限制到特定账户。
  - `groups.<room>.allowBots`：每房间覆盖 Channel 级设置（`true` 或 `"mentions"`）。
  - `groups.<room>.users`：每房间发送者 allowlist。
  - `groups.<room>.tools`：每房间工具允许/拒绝覆盖。
  - `groups.<room>.autoReply`：每房间提及门控覆盖。`true` 禁用该房间的提及要求；`false` 强制重新启用。
  - `groups.<room>.skills`：可选的每房间技能过滤器。
  - `groups.<room>.systemPrompt`：可选的每房间系统提示片段。

### Exec 审批设置

- `execApprovals.enabled`：通过 Matrix 原生提示传递 exec 审批。
- `execApprovals.approvers`：允许批准的 Matrix 用户 ID。回退到 `dm.allowFrom`。
- `execApprovals.target`：`"dm"`（默认）、`"channel"` 或 `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`：可选的 Agent/Session allowlist，用于传递。

## 相关

- [Channel 概述](/channels) — 所有支持的 Channel
- [Pairing](/channels/pairing) — 私信认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
