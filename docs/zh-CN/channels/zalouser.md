---
read_when:
  - 为 OpenClaw 设置 Zalo Personal
  - 调试 Zalo Personal 登录或消息流程
summary: 通过原生 zca-js（QR 登录）支持 Zalo 个人账户、功能和配置
title: Zalo Personal
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: 3a0ceadf12841840f27f3ac725dd3f201f6d6430489db68894dc088a9b360b7d
  source_path: channels/zalouser.md
  workflow: 15
---

# Zalo Personal（非官方）

状态：实验性。此集成通过 OpenClaw 内部的原生 `zca-js` 自动化**个人 Zalo 账户**。

> **警告：**这是一个非官方集成，可能导致账户被暂停/封禁。使用风险自负。

## 需要插件

Zalo Personal 作为插件提供，不包含在核心安装中。

- 通过 CLI 安装：`openclaw plugins install @openclaw/zalouser`
- 或从源码检出安装：`openclaw plugins install ./path/to/local/zalouser-plugin`
- 详情：[插件](/tools/plugin)

不需要外部 `zca`/`openzca` CLI 二进制文件。

## 快速设置（新手）

1. 安装插件（见上文）。
2. 登录（QR，在 Gateway 网关机器上）：
   - `openclaw channels login --channel zalouser`
   - 用 Zalo 手机应用扫描二维码。
3. 启用渠道：

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

4. 重启 Gateway 网关（或完成新手引导）。
5. 私信访问默认为配对模式；首次联系时批准配对码。

## 这是什么

- 完全通过 `zca-js` 在进程内运行。
- 使用原生事件监听器接收入站消息。
- 直接通过 JS API 发送回复（文本/媒体/链接）。
- 专为"个人账户"使用场景设计，适用于 Zalo Bot API 不可用的情况。

## 命名

渠道 ID 为 `zalouser`，以明确表示这是自动化**个人 Zalo 用户账户**（非官方）。我们保留 `zalo` 用于未来可能的官方 Zalo API 集成。

## 查找 ID（目录）

使用目录 CLI 发现联系人/群组及其 ID：

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制

- 出站文本分块为约 2000 字符（Zalo 客户端限制）。
- 默认阻止流式传输。

## 访问控制（私信）

`channels.zalouser.dmPolicy` 支持：`pairing | allowlist | open | disabled`（默认：`pairing`）。

`channels.zalouser.allowFrom` 接受用户 ID 或名称。向导在设置期间通过插件的进程内联系人查找将名称解析为 ID。

通过以下方式批准：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群组访问（可选）

- 默认：`channels.zalouser.groupPolicy = "open"`（允许群组）。使用 `channels.defaults.groupPolicy` 在未设置时覆盖默认值。
- 通过以下方式限制为允许列表：
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（键应为稳定的群组 ID；启动时会尽可能将名称解析为 ID）
  - `channels.zalouser.groupAllowFrom`（控制哪些发送者可以在允许的群组中触发机器人）
- 阻止所有群组：`channels.zalouser.groupPolicy = "disabled"`。
- 配置向导可以提示输入群组允许列表。
- 启动时，OpenClaw 将允许列表中的群组/用户名称解析为 ID 并记录映射。
- 群组允许列表匹配默认仅基于 ID。未解析的名称会被忽略，除非启用 `channels.zalouser.dangerouslyAllowNameMatching: true`。
- `channels.zalouser.dangerouslyAllowNameMatching: true` 是兼容性应急模式，会重新启用可变群组名称匹配。
- 如果 `groupAllowFrom` 未设置，运行时回退到 `allowFrom` 进行群组发送者检查。
- 发送者检查适用于普通群组消息和控制命令（例如 `/new`、`/reset`）。

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
- 解析顺序：精确群组 id/名称 -> 规范化群组 slug -> `*` -> 默认（`true`）。
- 这适用于允许列表群组和开放群组模式。
- 授权的控制命令（例如 `/new`）可以绕过提及门控。
- 当群组消息因需要提及而被跳过时，OpenClaw 会将其存储为待处理的群组历史记录，并在下一条处理的群组消息时包含它。
- 群组历史记录限制默认为 `messages.groupChat.historyLimit`（回退 `50`）。可通过 `channels.zalouser.historyLimit` 按账户覆盖。

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

账户映射到 zalouser 配置文件。示例：

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

## 输入提示、回应和投递确认

- OpenClaw 在发送回复前发送输入事件（尽力而为）。
- `zalouser` 渠道操作中支持消息回应操作 `react`。
  - 使用 `remove: true` 从消息中移除特定回应表情。
  - 回应语义：[回应](/tools/reactions)
- 对于包含事件元数据的入站消息，OpenClaw 会发送已投递 + 已读确认（尽力而为）。

## 故障排除

**登录不保持：**

- `openclaw channels status --probe`
- 重新登录：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**允许列表/群组名称未解析：**

- 在 `allowFrom`/`groupAllowFrom`/`groups` 中使用数字 ID，或使用精确的联系人/群组名称。

**从旧版基于 CLI 的设置升级：**

- 移除任何旧版外部 `zca` 进程假设。
- 该渠道现在完全在 OpenClaw 内部运行，无需外部 CLI 二进制文件。
