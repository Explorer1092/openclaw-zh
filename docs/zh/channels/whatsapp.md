---
title: "WhatsApp（Web 频道）"
sidebarTitle: "WhatsApp"
mmh3_hash: "0a919d65e9d7d91b3811bce2a81f6edf"
summary: "WhatsApp 频道支持、访问控制、传递行为和运维"
read_when:
  - 开发 WhatsApp/web 频道行为或收件箱路由
---

# WhatsApp（Web 频道）

状态：通过 WhatsApp Web（Baileys）生产可用。Gateway 拥有关联的会话。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/channels/pairing">
    未知发送者的默认私信策略为配对。
  </Card>
  <Card title="频道故障排除" icon="wrench" href="/channels/troubleshooting">
    跨频道诊断和修复手册。
  </Card>
  <Card title="Gateway 配置" icon="settings" href="/gateway/configuration">
    完整的频道配置模式和示例。
  </Card>
</CardGroup>

## 快速设置

<Steps>
  <Step title="配置 WhatsApp 访问策略">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="关联 WhatsApp（二维码）">

```bash
openclaw channels login --channel whatsapp
```

    针对特定账户：

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="启动 gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="批准首条配对请求（如使用配对模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配对请求 1 小时后过期。每个频道的待处理请求上限为 3 个。

  </Step>
</Steps>

<Note>
OpenClaw 建议在可能的情况下在单独的号码上运行 WhatsApp。（频道元数据和新手引导流程针对该设置进行了优化，但也支持个人号码设置。）
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="专用号码（推荐）">
    这是最简洁的运营模式：

    - 为 OpenClaw 使用单独的 WhatsApp 身份
    - 更清晰的私信 allowlist 和路由边界
    - 降低自聊混淆的可能性

    最小策略配置：

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="个人号码回退">
    新手引导支持个人号码模式并写入对自聊友好的基线配置：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含您的个人号码
    - `selfChatMode: true`

    运行时，自聊保护以关联的自身号码和 `allowFrom` 为基准。

  </Accordion>

  <Accordion title="仅 WhatsApp Web 频道范围">
    当前 OpenClaw 频道架构中的消息平台频道基于 WhatsApp Web（`Baileys`）。

    内置聊天频道注册表中没有单独的 Twilio WhatsApp 消息频道。

  </Accordion>
</AccordionGroup>

## 运行时模型

- Gateway 拥有 WhatsApp socket 和重连循环。
- 出站发送需要目标账户有活动的 WhatsApp 监听器。
- 状态和广播聊天被忽略（`@status`、`@broadcast`）。
- 直接聊天使用私信会话规则（`session.dmScope`；默认 `main` 将私信折叠到 agent 主会话）。
- 群组会话是隔离的（`agent:<agentId>:whatsapp:group:<jid>`）。

## 访问控制和激活

<Tabs>
  <Tab title="私信策略">
    `channels.whatsapp.dmPolicy` 控制直接聊天访问：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 格式号码（内部规范化）。

    多账户覆盖：`channels.whatsapp.accounts.<id>.dmPolicy`（和 `allowFrom`）优先于该账户的频道级默认值。

    运行时行为细节：

    - 配对持久化在频道 allow-store 中，并与配置的 `allowFrom` 合并
    - 如果未配置 allowlist，关联的自身号码默认被允许
    - 出站 `fromMe` 私信从不自动配对

  </Tab>

  <Tab title="群组策略 + allowlist">
    群组访问有两层：

    1. **群组成员 allowlist**（`channels.whatsapp.groups`）
       - 如果省略 `groups`，所有群组都符合条件
       - 如果存在 `groups`，它作为群组 allowlist（允许 `"*"`）

    2. **群组发送者策略**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：绕过发送者 allowlist
       - `allowlist`：发送者必须匹配 `groupAllowFrom`（或 `*`）
       - `disabled`：阻止所有群组入站

    发送者 allowlist 回退：

    - 如果未设置 `groupAllowFrom`，在可用时运行时回退到 `allowFrom`
    - 在提及/回复激活之前评估发送者 allowlist

    注意：如果完全不存在 `channels.whatsapp` 块，运行时群组策略回退为 `allowlist`（带警告日志），即使设置了 `channels.defaults.groupPolicy`。

  </Tab>

  <Tab title="提及 + /activation">
    群组回复默认需要提及。

    提及检测包括：

    - 显式 WhatsApp 提及 bot 身份
    - 配置的提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退 `messages.groupChat.mentionPatterns`）
    - 隐式回复-bot 检测（回复发送者匹配 bot 身份）

    安全注意：

    - 引用/回复仅满足提及门控；它**不**授予发送者授权
    - 使用 `groupPolicy: "allowlist"` 时，非 allowlist 发送者仍然被阻止，即使他们回复了 allowlist 用户的消息

    会话级激活命令：

    - `/activation mention`
    - `/activation always`

    `activation` 更新会话状态（不是全局配置）。它由所有者门控。

  </Tab>
</Tabs>

## 个人号码和自聊行为

当关联的自身号码也存在于 `allowFrom` 中时，WhatsApp 自聊保护激活：

- 跳过自聊轮次的已读回执
- 忽略否则会 ping 自己的提及 JID 自动触发行为
- 如果未设置 `messages.responsePrefix`，自聊回复默认为 `[{identity.name}]` 或 `[openclaw]`

## 消息规范化和上下文

<AccordionGroup>
  <Accordion title="入站信封 + 回复上下文">
    传入的 WhatsApp 消息被包装在共享入站信封中。

    如果存在引用回复，上下文以此形式附加：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    回复元数据字段在可用时也会填充（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、发送者 JID/E.164）。

  </Accordion>

  <Accordion title="媒体占位符和位置/联系人提取">
    仅媒体的入站消息使用占位符规范化，例如：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    位置和联系人负载在路由之前规范化为文本上下文。

  </Accordion>

  <Accordion title="待处理群组历史注入">
    对于群组，未处理的消息可以在 bot 最终被触发时作为上下文缓冲和注入。

    - 默认限制：`50`
    - 配置：`channels.whatsapp.historyLimit`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 禁用

    注入标记：

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="已读回执">
    接受的入站 WhatsApp 消息默认启用已读回执。

    全局禁用：

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    每账户覆盖：

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    自聊轮次即使全局启用也会跳过已读回执。

  </Accordion>
</AccordionGroup>

## 传递、分块和媒体

<AccordionGroup>
  <Accordion title="文本分块">
    - 默认分块限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 模式优先考虑段落边界（空行），然后回退到长度安全分块
  </Accordion>

  <Accordion title="出站媒体行为">
    - 支持图像、视频、音频（PTT 语音笔记）和文档负载
    - `audio/ogg` 被重写为 `audio/ogg; codecs=opus` 以实现语音笔记兼容性
    - 通过视频发送上的 `gifPlayback: true` 支持动画 GIF 播放
    - 发送多媒体回复负载时，标题应用于第一个媒体项
    - 媒体源可以是 HTTP(S)、`file://` 或本地路径
  </Accordion>

  <Accordion title="媒体大小限制和回退行为">
    - 入站媒体保存上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 出站媒体发送上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 每账户覆盖：`channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 图像自动优化（调整大小/质量扫描）以符合限制
    - 媒体发送失败时，第一项回退发送文本警告而非静默丢弃响应
  </Accordion>
</AccordionGroup>

## 确认 Reaction

WhatsApp 通过 `channels.whatsapp.ackReaction` 支持入站接收时的即时 ack reaction。

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

行为注意：

- 在入站被接受后立即发送（回复前）
- 失败被记录但不阻止正常回复传递
- 群组模式 `mentions` 在提及触发的轮次上 react；群组激活 `always` 作为此检查的绕过
- WhatsApp 使用 `channels.whatsapp.ackReaction`（旧版 `messages.ackReaction` 不在此使用）

## 多账户和凭据

<AccordionGroup>
  <Accordion title="账户选择和默认值">
    - 账户 ID 来自 `channels.whatsapp.accounts`
    - 默认账户选择：如果存在则为 `default`，否则为第一个配置的账户 ID（已排序）
    - 账户 ID 在内部规范化以供查找
  </Accordion>

  <Accordion title="凭据路径和旧版兼容性">
    - 当前认证路径：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 备份文件：`creds.json.bak`
    - 旧版默认认证在 `~/.openclaw/credentials/` 中仍被识别/迁移，用于默认账户流程
  </Accordion>

  <Accordion title="登出行为">
    `openclaw channels logout --channel whatsapp [--account <id>]` 清除该账户的 WhatsApp 认证状态。

    在旧版认证目录中，`oauth.json` 被保留，而 Baileys 认证文件被删除。

  </Accordion>
</AccordionGroup>

## 工具、操作和配置写入

- Agent 工具支持包括 WhatsApp reaction 操作（`react`）。
- 操作门控：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 频道发起的配置写入默认启用（通过 `channels.whatsapp.configWrites=false` 禁用）。

## 故障排除

<AccordionGroup>
  <Accordion title="未关联（需要二维码）">
    症状：频道状态报告未关联。

    修复：

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="已关联但断开连接 / 重连循环">
    症状：已关联账户出现重复断开连接或重连尝试。

    修复：

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    如需要，通过 `channels login` 重新关联。

  </Accordion>

  <Accordion title="发送时无活动监听器">
    当目标账户没有活动的 gateway 监听器时，出站发送快速失败。

    确保 gateway 正在运行且账户已关联。

  </Accordion>

  <Accordion title="群组消息意外被忽略">
    按以下顺序检查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` allowlist 条目
    - 提及门控（`requireMention` + 提及模式）
    - `openclaw.json` 中的重复键（JSON5）：后面的条目覆盖前面的，因此每个范围保留单个 `groupPolicy`

  </Accordion>

  <Accordion title="Bun 运行时警告">
    WhatsApp gateway 运行时应使用 Node。Bun 被标记为与稳定的 WhatsApp/Telegram gateway 操作不兼容。
  </Accordion>
</AccordionGroup>

## 配置参考指针

主要参考：

- [配置参考 - WhatsApp](/gateway/configuration-reference#whatsapp)

WhatsApp 高优先级字段：

- 访问：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 传递：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`
- 多账户：`accounts.<id>.enabled`、`accounts.<id>.authDir`、账户级覆盖
- 运维：`configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`
- 会话行为：`session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`

## 相关

- [配对](/channels/pairing)
- [频道路由](/channels/channel-routing)
- [多 Agent 路由](/concepts/multi-agent)
- [故障排除](/channels/troubleshooting)
