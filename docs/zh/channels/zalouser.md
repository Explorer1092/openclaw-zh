---
mmh3_hash: "0d50b2ac584fb6aca7004ad102f689f3"
summary: "通过原生 zca-js（二维码登录）的 Zalo 个人账户支持、功能和配置"
read_when:
  - 为 OpenClaw 设置 Zalo 个人号
  - 调试 Zalo 个人号登录或消息流
title: "Zalo personal"
---

状态：实验性。此集成通过 OpenClaw 内置的原生 `zca-js` 自动化 **个人 Zalo 账户**。

<Warning>
这是一个非官方集成，可能导致账户被暂停或封禁。使用风险自负。
</Warning>

## 内置插件

Zalo Personal 作为内置插件随当前 OpenClaw 版本提供，正常打包的构建无需单独安装。

如果您使用的是旧版本或不包含 Zalo Personal 的自定义安装，请手动安装：

- 通过 CLI 安装：`openclaw plugins install @openclaw/zalouser`
- 固定版本：`openclaw plugins install @openclaw/zalouser@2026.5.2`
- 或从源码检出安装：`openclaw plugins install ./path/to/local/zalouser-plugin`
- 详情：[插件](/tools/plugin)

不需要外部 `zca`/`openzca` CLI 二进制文件。

## 快速设置（新手）

1. 确认 Zalo Personal 插件可用。
   - 当前打包的 OpenClaw 版本已内置。
   - 旧版/自定义安装可使用上述命令手动添加。
2. 登录（二维码，在 Gateway 机器上）：
   - `openclaw channels login --channel zalouser`
   - 使用 Zalo 移动应用扫描二维码。
3. 启用 Channel：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. 重启 Gateway（或完成设置）。
5. DM 访问默认为配对模式；首次联系时批准配对码。

## 它是什么

- 完全在进程内通过 `zca-js` 运行。
- 使用原生事件监听器接收入站消息。
- 直接通过 JS API 发送回复（文本/媒体/链接）。
- 专为无法使用 Zalo Bot API 的"个人账户"使用场景设计。

## 命名

Channel id 为 `zalouser`，明确表示这是自动化 **个人 Zalo 用户账户**（非官方）。我们保留 `zalo` 用于未来可能的官方 Zalo API 集成。

## 查找 ID（目录）

使用目录 CLI 发现对等方/群组及其 ID：

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制

- 出站文本会被分块为约 2000 个字符（Zalo 客户端限制）。
- 默认情况下阻止流式传输。

## 访问控制（私信）

`channels.zalouser.dmPolicy` 支持：`pairing | allowlist | open | disabled`（默认：`pairing`）。

`channels.zalouser.allowFrom` 应使用稳定的 Zalo 用户 ID。也可以引用静态发送者访问组（`accessGroup:<name>`）。在交互式设置过程中，输入的名称可通过插件的进程内联系人查找解析为 ID。

如果原始名称保留在配置中，仅当启用 `channels.zalouser.dangerouslyAllowNameMatching: true` 时，启动时才会解析。未启用此选项，运行时发送者检查仅基于 ID，原始名称在授权时被忽略。

通过以下方式批准：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群组访问（可选）

- 默认：`channels.zalouser.groupPolicy = "open"`（允许群组）。使用 `channels.defaults.groupPolicy` 在未设置时覆盖默认值。
- 使用 allowlist 限制：
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（键应为稳定的群组 ID；仅当启用 `channels.zalouser.dangerouslyAllowNameMatching: true` 时，名称才在启动时解析为 ID）
  - `channels.zalouser.groupAllowFrom`（控制允许的群组中哪些发送者可以触发 bot；可使用 `accessGroup:<name>` 引用静态发送者访问组）
- 阻止所有群组：`channels.zalouser.groupPolicy = "disabled"`。
- 配置向导可以提示输入群组 allowlist。
- 启动时，仅当启用 `channels.zalouser.dangerouslyAllowNameMatching: true` 时，OpenClaw 才将 allowlist 中的群组/用户名称解析为 ID 并记录映射。
- 群组 allowlist 匹配默认仅使用 ID。未解析的名称在授权时被忽略，除非启用 `channels.zalouser.dangerouslyAllowNameMatching: true`。
- `channels.zalouser.dangerouslyAllowNameMatching: true` 是一个应急兼容模式，重新启用可变启动名称解析和运行时群组名称匹配。
- 如果未设置 `groupAllowFrom`，运行时回退到 `allowFrom` 进行群组发送者检查。
- 发送者检查同时适用于普通群组消息和控制命令（例如 `/new`、`/reset`）。

示例：

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### 群组提及门控

- `channels.zalouser.groups.<group>.requireMention` 控制群组回复是否需要提及。
- 解析顺序：精确群组 id/名称 -> 规范化群组 slug -> `*` -> 默认值（`true`）。
- 这适用于 allowlist 群组和开放群组模式。
- 引用 bot 消息视为群组激活的隐式提及。
- 已授权的控制命令（例如 `/new`）可以绕过提及门控。
- 当因需要提及而跳过群组消息时，OpenClaw 将其存储为待处理的群组历史，并在下一条已处理的群组消息时包含。
- 群组历史限制默认为 `messages.groupChat.historyLimit`（回退值 `50`）。可以通过 `channels.zalouser.historyLimit` 按账户覆盖。

示例：

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## 多账户

账户映射到 OpenClaw 状态中的 `zalouser` 配置文件。示例：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## 环境变量

Zalo Personal 插件还可以从环境变量读取配置文件选择：

- `ZALOUSER_PROFILE`：当 Channel 或账户配置中未设置 `profile` 时使用的配置文件名称。
- `ZCA_PROFILE`：旧版回退配置文件名称，仅在未设置 `ZALOUSER_PROFILE` 时使用。

配置文件名称选择 OpenClaw 状态中保存的 Zalo 登录凭据。解析顺序为：

1. 配置中的显式 `profile`。
2. `ZALOUSER_PROFILE`。
3. `ZCA_PROFILE`。
4. 非默认账户使用账户 ID，默认账户使用 `default`。

对于多账户设置，优先在配置中为每个账户设置 `profile`，以避免一个环境变量导致多个账户共享同一登录 Session。

## 打字状态、Reaction 和送达确认

- OpenClaw 在发送回复前发送打字状态事件（尽力而为）。
- `zalouser` 频道的操作支持消息 reaction 操作 `react`。
  - 使用 `remove: true` 从消息中移除特定 reaction 表情。
  - Reaction 语义：[Reactions](/tools/reactions)
- 对于包含事件元数据的入站消息，OpenClaw 发送已送达 + 已读确认（尽力而为）。

## 故障排除

**登录状态无法保持：**

- `openclaw channels status --probe`
- 重新登录：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist/群组名称未解析：**

- 在 `allowFrom`/`groupAllowFrom` 中使用数字 ID，在 `groups` 中使用稳定的群组 ID。如果确实需要精确的好友/群组名称，请启用 `channels.zalouser.dangerouslyAllowNameMatching: true`。

**从旧的基于 CLI 的设置升级：**

- 移除所有旧的外部 `zca` 进程假设。
- 该 Channel 现在完全在 OpenClaw 内运行，无需外部 CLI 二进制文件。

## 相关

- [Channels 概述](/channels) — 所有支持的 Channels
- [Pairing](/channels/pairing) — DM 认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
