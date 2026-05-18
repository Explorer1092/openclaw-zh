---
mmh3_hash: "5216097beed8cee77d3f8bdf3828bb4a"
summary: "WhatsApp 频道支持、访问控制、传递行为和运维"
read_when:
  - 开发 WhatsApp/web 频道行为或收件箱路由
title: "WhatsApp"
---

状态：通过 WhatsApp Web（Baileys）生产可用。Gateway 拥有关联的 Session。

## 按需安装

- 新手引导（`openclaw onboard`）和 `openclaw channels add --channel whatsapp` 在首次选择 WhatsApp Plugin 时会提示安装。
- `openclaw channels login --channel whatsapp` 在 Plugin 尚未存在时也会提供安装流程。
- 开发版 Channel + git 检出：默认使用本地 Plugin 路径。
- 稳定版/测试版：优先从 ClawHub 安装官方 `@openclaw/whatsapp` Plugin，以 npm 为备选。
- WhatsApp 运行时作为独立 Plugin 分发，使 WhatsApp 专属运行时依赖项与外部 Plugin 保持一致。

手动安装仍然可用：

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

仅在需要注册表备选时才使用裸 npm 包（`@openclaw/whatsapp`）。仅在需要可复现安装时才固定确切版本。

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

    在登录前附加现有/自定义 WhatsApp Web 认证目录：

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
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
- 重连 watchdog 使用 WhatsApp Web 传输活动，而不仅仅是入站应用消息量，因此安静的关联设备会话不会仅因为最近没有人发送消息而重启。如果传输帧持续到达但在 watchdog 窗口内没有处理任何应用消息，较长的应用静默上限仍会强制重连；对于最近活跃的会话，在短暂重连后，第一个恢复窗口使用正常消息超时进行应用静默检查。
- Baileys socket 计时通过 `web.whatsapp.*` 显式配置：`keepAliveIntervalMs` 控制 WhatsApp Web 应用 ping，`connectTimeoutMs` 控制开启握手超时，`defaultQueryTimeoutMs` 控制 Baileys 查询超时。
- 出站发送需要目标账户有活动的 WhatsApp 监听器。
- 出站发送在文本和媒体标题中对 `@+<digits>` 和 `@<digits>` 令牌附加原生提及元数据（匹配当前 WhatsApp 参与者元数据，包括基于 LID 的群组）。
- 状态和广播聊天被忽略（`@status`、`@broadcast`）。
- 直接聊天使用私信会话规则（`session.dmScope`；默认 `main` 将私信折叠到 agent 主会话）。
- 群组会话是隔离的（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Channels/Newsletters 可以作为显式出站目标，使用其原生 `@newsletter` JID。出站 newsletter 发送使用频道会话元数据（`agent:<agentId>:whatsapp:channel:<jid>`），而非私信会话语义。
- WhatsApp Web 传输遵循 Gateway 主机上的标准代理环境变量（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小写变体）。优先使用主机级代理配置，而非特定于 Channel 的 WhatsApp 代理设置。
- 启用 `messages.removeAckAfterReply` 后，OpenClaw 在传递可见回复后会清除 WhatsApp ack reaction。

## Plugin Hooks 和隐私

WhatsApp 入站消息可能包含个人消息内容、电话号码、群组标识符、发送者名称和会话关联字段。因此，除非您明确选择加入，否则 WhatsApp 不会向插件广播入站 `message_received` hook 负载：

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

您可以将选择加入范围限定到单个账户：

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

仅为您信任其接收入站 WhatsApp 消息内容和标识符的插件启用此功能。

## 访问控制和激活

<Tabs>
  <Tab title="私信策略">
    `channels.whatsapp.dmPolicy` 控制直接聊天访问：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 格式号码（内部规范化）。

    `allowFrom` 是私信发送者访问控制列表。它不阻止对 WhatsApp 群组 JID 或 `@newsletter` 频道 JID 的显式出站发送。

    多账户覆盖：`channels.whatsapp.accounts.<id>.dmPolicy`（和 `allowFrom`）优先于该账户的频道级默认值。

    运行时行为细节：

    - 配对持久化在频道 allow-store 中，并与配置的 `allowFrom` 合并
    - 定时自动化和心跳接收者回退使用显式传递目标或配置的 `allowFrom`；私信配对批准不是隐式的 cron 或心跳接收者
    - 如果未配置 allowlist，关联的自身号码默认被允许
    - OpenClaw 从不自动配对出站 `fromMe` 私信（您从关联设备发送给自己的消息）

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
    - 已授权群组消息的入站语音笔记转录
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

    回复元数据字段在可用时也会填充（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、发送者 JID/E.164）。当引用回复目标是可下载媒体时，OpenClaw 通过正常入站媒体存储保存它，并将其作为 `MediaPath`/`MediaType` 公开，使 agent 可以检查被引用的图像，而不仅仅看到 `<media:image>`。

  </Accordion>

  <Accordion title="媒体占位符和位置/联系人提取">
    仅媒体的入站消息使用占位符规范化，例如：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    当正文仅为 `<media:audio>` 时，已授权群组消息的语音笔记在提及门控之前被转录，因此在语音笔记中说出 bot 提及词可以触发回复。如果转录仍未提及 bot，转录内容会保留在待处理群组历史记录中，而非原始占位符。

    位置正文使用简洁坐标文本。位置标签/注释和联系人/vCard 详情以围栏不可信元数据形式呈现，而非内联提示文本。

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
    - 音频媒体通过带有 `ptt: true` 的 Baileys `audio` 负载发送，因此 WhatsApp 客户端将其渲染为按压通话语音笔记
    - 回复负载保留 `audioAsVoice`；WhatsApp 的 TTS 语音笔记输出即使在 provider 返回 MP3 或 WebM 时也保持在此 PTT 路径上
    - 原生 Ogg/Opus 音频以 `audio/ogg; codecs=opus` 发送以实现语音笔记兼容性
    - 非 Ogg 音频（包括 Microsoft Edge TTS MP3/WebM 输出）在 PTT 传递前使用 `ffmpeg` 转码为 48 kHz 单声道 Ogg/Opus
    - `/tts latest` 将最新的助手回复作为一条语音笔记发送，并抑制同一回复的重复发送；`/tts chat on|off|default` 控制当前 WhatsApp 聊天的自动 TTS
    - 通过视频发送上的 `gifPlayback: true` 支持动画 GIF 播放
    - 发送多媒体回复负载时，标题应用于第一个媒体项，但 PTT 语音笔记先发送音频，再单独发送可见文本，因为 WhatsApp 客户端无法一致渲染语音笔记标题
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

## 回复引用

WhatsApp 支持原生回复引用，出站回复会在视觉上引用入站消息。通过 `channels.whatsapp.replyToMode` 控制。

| 值            | 行为                                         |
| ------------- | -------------------------------------------- |
| `"off"`       | 从不引用；以普通消息发送                     |
| `"first"`     | 仅引用第一个出站回复分块                     |
| `"all"`       | 引用每个出站回复分块                         |
| `"batched"`   | 引用已排队的批量回复，立即回复不引用         |

默认为 `"off"`。每账户覆盖使用 `channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Reaction 级别

`channels.whatsapp.reactionLevel` 控制 agent 在 WhatsApp 上使用表情 reaction 的范围：

| 级别          | Ack reaction | Agent 发起的 reaction | 描述                                 |
| ------------- | ------------ | --------------------- | ------------------------------------ |
| `"off"`       | 否           | 否                    | 完全不使用 reaction                  |
| `"ack"`       | 是           | 否                    | 仅 ack reaction（回复前接收确认）    |
| `"minimal"`   | 是           | 是（保守）            | Ack + agent reaction，保守指导方针   |
| `"extensive"` | 是           | 是（鼓励）            | Ack + agent reaction，鼓励指导方针   |

默认：`"minimal"`。

每账户覆盖使用 `channels.whatsapp.accounts.<id>.reactionLevel`。

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## 确认 Reaction

WhatsApp 通过 `channels.whatsapp.ackReaction` 支持入站接收时的即时 ack reaction。Ack reaction 受 `reactionLevel` 门控——当 `reactionLevel` 为 `"off"` 时被抑制。

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

## 生命周期状态 Reaction

设置 `messages.statusReactions.enabled: true` 可让 WhatsApp 在轮次期间替换 ack reaction，而非留下静态接收确认 emoji。启用后，OpenClaw 将相同的入站消息 reaction 槽位用于排队、思考中、工具活动、压缩、完成和错误等生命周期状态。

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

行为注意：

- `channels.whatsapp.ackReaction` 仍控制状态 reaction 是否对私信和群组适用。
- WhatsApp 每条消息只有一个 bot reaction 槽位，因此生命周期更新会就地替换当前 reaction。
- `messages.removeAckAfterReply: true` 在配置的完成/错误保留期后清除最终状态 reaction。
- 工具 emoji 类别包括 `tool`、`coding`、`web`、`deploy`、`build` 和 `concierge`。

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

    当 Gateway 可达时，登出会先停止所选账户的实时 WhatsApp 监听器，使关联的会话不会在下次重启前继续接收消息。`openclaw channels remove --channel whatsapp` 在禁用或删除账户配置前也会停止实时监听器。

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

    安静的账户可以在正常消息超时之后保持连接；当 WhatsApp Web 传输活动停止、socket 关闭或应用级活动在较长安全窗口内保持静默时，watchdog 会重启。

    如果日志显示重复的 `status=408 Request Time-out Connection was lost`，请在 `web.whatsapp` 下调整 Baileys socket 计时。首先将 `keepAliveIntervalMs` 缩短至低于您网络的空闲超时，并在慢速或丢包链路上增加 `connectTimeoutMs`：

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    修复：

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    如果 `~/.openclaw/logs/whatsapp-health.log` 显示 `Gateway inactive`，但 `openclaw gateway status` 和 `openclaw channels status --probe` 显示 gateway 和 WhatsApp 正常，请运行 `openclaw doctor`。在 Linux 上，doctor 会警告仍调用 `~/.openclaw/bin/ensure-whatsapp.sh` 的旧版 crontab 条目；使用 `crontab -e` 删除那些陈旧条目，因为 cron 可能缺少 systemd 用户总线环境，使旧脚本误报 gateway 健康状态。

    如需要，通过 `channels login` 重新关联。

  </Accordion>

  <Accordion title="代理后面的二维码登录超时">
    症状：`openclaw channels login --channel whatsapp` 在显示可用的二维码前失败，提示 `status=408 Request Time-out` 或 TLS socket 断开。

    WhatsApp Web 登录使用 gateway 主机的标准代理环境（`HTTPS_PROXY`、`HTTP_PROXY`、小写变体和 `NO_PROXY`）。验证 gateway 进程继承了代理环境，且 `NO_PROXY` 不匹配 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="发送时无活动监听器">
    当目标账户没有活动的 gateway 监听器时，出站发送快速失败。

    确保 gateway 正在运行且账户已关联。

  </Accordion>

  <Accordion title="回复出现在记录中但未出现在 WhatsApp 中">
    记录行记录的是 agent 生成的内容。WhatsApp 传递单独检查：只有在 Baileys 对至少一条可见文本或媒体发送返回出站消息 ID 后，OpenClaw 才将自动回复视为已发送。

    Ack reaction 是独立的回复前接收确认。成功的 reaction 不能证明后续的文本或媒体回复已被 WhatsApp 接受。

    检查 gateway 日志中的 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

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

## System Prompts

WhatsApp 通过 `groups` 和 `direct` 映射支持群组和直接聊天的 Telegram 风格 system prompt。

群组消息的解析层次：

首先确定有效的 `groups` 映射：如果账户定义了自己的 `groups`，它完全替换根 `groups` 映射（不做深度合并）。然后在得到的单一映射上执行 prompt 查找：

1. **群组特定 system prompt**（`groups["<groupId>"].systemPrompt`）：当特定群组条目存在于映射中**且**其 `systemPrompt` 键已定义时使用。如果 `systemPrompt` 为空字符串（`""`），则通配符被抑制且不应用任何 system prompt。
2. **群组通配符 system prompt**（`groups["*"].systemPrompt`）：当特定群组条目完全不在映射中，或存在但未定义 `systemPrompt` 键时使用。

直接消息的解析层次：

首先确定有效的 `direct` 映射：如果账户定义了自己的 `direct`，它完全替换根 `direct` 映射（不做深度合并）。然后在得到的单一映射上执行 prompt 查找：

1. **直接聊天特定 system prompt**（`direct["<peerId>"].systemPrompt`）：当特定对端条目存在于映射中**且**其 `systemPrompt` 键已定义时使用。如果 `systemPrompt` 为空字符串（`""`），则通配符被抑制且不应用任何 system prompt。
2. **直接聊天通配符 system prompt**（`direct["*"].systemPrompt`）：当特定对端条目完全不在映射中，或存在但未定义 `systemPrompt` 键时使用。

<Note>
`dms` 仍是轻量级的每私信历史覆盖桶（`dms.<id>.historyLimit`）。Prompt 覆盖位于 `direct` 下。
</Note>

**与 Telegram 多账户行为的区别：** 在 Telegram 中，根 `groups` 在多账户设置中对所有账户都会被有意抑制——即使是未定义自己 `groups` 的账户——以防止 bot 接收它不属于的群组的群组消息。WhatsApp 不应用此保护：根 `groups` 和根 `direct` 始终被未定义账户级覆盖的账户继承，无论配置了多少个账户。在多账户 WhatsApp 设置中，如果您想要每账户的群组或直接 prompt，请在每个账户下显式定义完整映射，而不是依赖根级默认值。

重要行为：

- `channels.whatsapp.groups` 既是每群组配置映射，也是聊天级群组 allowlist。在根或账户范围内，`groups["*"]` 表示该范围"所有群组均被允许"。
- 仅在您已经希望该范围接受所有群组时才添加通配符群组 `systemPrompt`。如果您仍然希望只有固定的一组群组 ID 有资格，请不要将 `groups["*"]` 用于 prompt 默认值。而是在每个明确 allowlist 的群组条目上重复该 prompt。
- 群组准入和发送者授权是独立检查。`groups["*"]` 扩大了可以到达群组处理的群组集合，但它本身并不授权这些群组中的每个发送者。发送者访问仍由 `channels.whatsapp.groupPolicy` 和 `channels.whatsapp.groupAllowFrom` 单独控制。
- `channels.whatsapp.direct` 对私信没有相同的副作用。`direct["*"]` 仅在私信已经由 `dmPolicy` 加上 `allowFrom` 或配对存储规则允许后，才提供默认直接聊天配置。

示例：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // 仅在根范围应接受所有群组时使用。
        // 适用于未定义自己 groups 映射的所有账户。
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // 适用于未定义自己 direct 映射的所有账户。
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // 此账户定义了自己的 groups，因此根 groups 被完全替换。
            // 要保留通配符，也需在此处显式定义 "*"。
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // 仅在此账户应接受所有群组时使用。
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // 此账户定义了自己的 direct 映射，因此根 direct 条目被完全替换。
            // 要保留通配符，也需在此处显式定义 "*"。
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## 配置参考指针

主要参考：

- [配置参考 - WhatsApp](/gateway/config-channels#whatsapp)

WhatsApp 高优先级字段：

- 访问：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 传递：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`
- 多账户：`accounts.<id>.enabled`、`accounts.<id>.authDir`、账户级覆盖
- 运维：`configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`、`web.whatsapp.*`
- 会话行为：`session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`
- prompts：`groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt`

## 相关

- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Security](/gateway/security)
- [Channel 路由](/channels/channel-routing)
- [多 Agent 路由](/concepts/multi-agent)
