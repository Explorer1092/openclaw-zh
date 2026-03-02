---
mmh3_hash: "cdc003e2e2cc625db728b6bc378dac42"
summary: "Heartbeat 轮询消息和通知规则"
read_when:
  - 调整 Heartbeat 节奏或消息
  - 在 Heartbeat 和 Cron 之间决定用于计划任务
title: "Heartbeat"
---

# Heartbeat (Gateway)

> **Heartbeat vs Cron?** 有关何时使用每个的指导,请参见 [Cron vs Heartbeat](/automation/cron-vs-heartbeat)。

Heartbeat 在主 Session 中运行**周期性 Agent 轮次**,以便模型可以显示需要注意的任何内容,而不会向您发送垃圾信息。

故障排除:[/automation/troubleshooting](/automation/troubleshooting)

## 快速入门(初学者)

1. 保持 Heartbeat 启用(默认为 `30m`,或对于 Anthropic OAuth/setup-token 为 `1h`)或设置您自己的节奏。
2. 在 Agent 工作空间中创建一个微小的 `HEARTBEAT.md` 清单(可选但推荐)。
3. 决定 Heartbeat 消息应该去哪里(`target: "none"` 是默认值;设置 `target: "last"` 以路由到最后的联系人)。
4. 可选:启用 Heartbeat Reasoning 传递以提高透明度。
5. 可选:将 Heartbeat 限制在活动时间(本地时间)。

示例配置:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 显式传递到最后的联系人(默认为 "none")
        directPolicy: "allow", // 默认:允许直接/DM 目标;设置 "block" 以抑制
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 可选:也发送单独的 `Reasoning:` 消息
      },
    },
  },
}
```

## 默认值

- 间隔:`30m`(或当检测到 Anthropic OAuth/setup-token 认证模式时为 `1h`)。设置 `agents.defaults.heartbeat.every` 或每个 Agent 的 `agents.list[].heartbeat.every`;使用 `0m` 禁用。
- 提示正文(可通过 `agents.defaults.heartbeat.prompt` 配置):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat 提示**逐字**作为用户消息发送。系统提示包括"Heartbeat"部分,并且运行在内部被标记。
- 活动时间(`heartbeat.activeHours`)在配置的时区中检查。在窗口之外,Heartbeat 被跳过,直到窗口内的下一个滴答。

## Heartbeat 提示的用途

默认提示有意广泛:

- **后台任务**:"Consider outstanding tasks"促使 Agent 审查后续事项(收件箱、日历、提醒、排队工作)并显示任何紧急内容。
- **人工检查**:"Checkup sometimes on your human during day time"促使偶尔的轻量级"anything you need?"消息,但通过使用您配置的本地时区避免夜间垃圾信息(参见 [/concepts/timezone](/concepts/timezone))。

如果您希望 Heartbeat 执行非常具体的操作(例如"check Gmail PubSub stats"或"verify gateway health"),请将 `agents.defaults.heartbeat.prompt`(或 `agents.list[].heartbeat.prompt`)设置为自定义正文(逐字发送)。

## 响应契约

- 如果不需要注意,请回复 **`HEARTBEAT_OK`**。
- 在 Heartbeat 运行期间,当它出现在回复的**开头或结尾**时,OpenClaw 将 `HEARTBEAT_OK` 视为确认。令牌被剥离,如果剩余内容 **≤ `ackMaxChars`**(默认:300),则回复被丢弃。
- 如果 `HEARTBEAT_OK` 出现在回复的**中间**,则不会特别对待。
- 对于警报,**不要**包含 `HEARTBEAT_OK`;仅返回警报文本。

在 Heartbeat 之外,消息开头/结尾的游离 `HEARTBEAT_OK` 被剥离并记录;仅包含 `HEARTBEAT_OK` 的消息被丢弃。

## 配置

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 默认:30m(0m 禁用)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 默认:false(可用时传递单独的 Reasoning: 消息)
        target: "last", // 默认:none | 选项:last | none | <channel id>(核心或 Plugin,例如"bluebubbles")
        to: "+15551234567", // 可选的特定 Channel 覆盖
        accountId: "ops-bot", // 可选的多账户 Channel ID
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK 后允许的最大字符数
      },
    },
  },
}
```

### 作用域和优先级

- `agents.defaults.heartbeat` 设置全局 Heartbeat 行为。
- `agents.list[].heartbeat` 在顶部合并;如果任何 Agent 有 `heartbeat` 块,**仅那些 Agent** 运行 Heartbeat。
- `channels.defaults.heartbeat` 为所有 Channel 设置可见性默认值。
- `channels.<channel>.heartbeat` 覆盖 Channel 默认值。
- `channels.<channel>.accounts.<id>.heartbeat`(多账户 Channel)覆盖每个 Channel 的设置。

### 每个 Agent 的 Heartbeat

如果任何 `agents.list[]` 条目包含 `heartbeat` 块,**仅那些 Agent** 运行 Heartbeat。每个 Agent 的块在 `agents.defaults.heartbeat` 之上合并(因此您可以设置一次共享默认值并按 Agent 覆盖)。

示例:两个 Agent,只有第二个 Agent 运行 Heartbeat。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 显式传递到最后的联系人(默认为 "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### 活动时间示例

将 Heartbeat 限制在特定时区的工作时间:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 显式传递到最后的联系人(默认为 "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 可选;如果设置则使用您的 userTimezone,否则使用主机时区
        },
      },
    },
  },
}
```

在此窗口之外(东部时间早上 9 点之前或晚上 10 点之后),Heartbeat 被跳过。窗口内的下一个计划滴答将正常运行。

### 全天候设置

如果您希望 Heartbeat 全天运行,请使用以下模式之一:

- 完全省略 `activeHours`(无时间窗口限制;这是默认行为)。
- 设置全天窗口:`activeHours: { start: "00:00", end: "24:00" }`。

不要将 `start` 和 `end` 设置为相同的时间(例如 `08:00` 到 `08:00`)。这被视为零宽度窗口,因此 Heartbeat 始终被跳过。

### 多账户示例

使用 `accountId` 在多账户 Channel(如 Telegram)上定位特定账户:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // 可选:路由到特定话题/线程
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### 字段注释

- `every`:Heartbeat 间隔(持续时间字符串;默认单位 = 分钟)。
- `model`:Heartbeat 运行的可选模型覆盖(`provider/model`)。
- `includeReasoning`:启用时,在可用时也传递单独的 `Reasoning:` 消息(与 `/reasoning on` 相同的形状)。
- `session`:Heartbeat 运行的可选 Session 键。
  - `main`(默认):Agent 主 Session。
  - 显式 Session 键(从 `openclaw sessions --json` 或 [Sessions CLI](/cli/sessions) 复制)。
  - Session 键格式:参见 [Session](/concepts/session) 和 [群组](/channels/groups)。
- `target`:
  - `last`:传递到最后使用的外部 Channel。
  - 显式 Channel:`whatsapp` / `telegram` / `discord` / `googlechat` / `slack` / `msteams` / `signal` / `imessage`。
  - `none`(默认):运行 Heartbeat 但**不要**外部传递。
- `directPolicy`:控制直接/DM 传递行为:
  - `allow`(默认):允许直接/DM Heartbeat 传递。
  - `block`:抑制直接/DM 传递(`reason=dm-blocked`)。
- `to`:可选的接收者覆盖(特定 Channel 的 ID,例如 WhatsApp 的 E.164 或 Telegram 聊天 ID)。对于 Telegram 话题/线程,使用 `<chatId>:topic:<messageThreadId>`。
- `accountId`:多账户 Channel 的可选账户 ID。当 `target: "last"` 时,账户 ID 适用于已解析的最后一个 Channel(如果支持账户);否则被忽略。如果账户 ID 与已解析 Channel 的已配置账户不匹配,则跳过传递。
- `prompt`:覆盖默认提示正文(不合并)。
- `ackMaxChars`:传递前 `HEARTBEAT_OK` 后允许的最大字符数。
- `suppressToolErrorWarnings`:为 true 时,在 Heartbeat 运行期间抑制工具错误警告有效负载。
- `activeHours`:将 Heartbeat 运行限制在时间窗口内。具有 `start`(HH:MM,包含;使用 `00:00` 表示一天开始)、`end`(HH:MM 排他;允许 `24:00` 表示一天结束)和可选 `timezone` 的对象。
  - 省略或 `"user"`:如果设置则使用您的 `agents.defaults.userTimezone`,否则回退到主机系统时区。
  - `"local"`:始终使用主机系统时区。
  - 任何 IANA 标识符(例如 `America/New_York`):直接使用;如果无效,则回退到上面的 `"user"` 行为。
  - `start` 和 `end` 不能相等以形成活动窗口;相等的值被视为零宽度(始终在窗口外)。
  - 在活动窗口之外,Heartbeat 被跳过,直到窗口内的下一个滴答。

## 传递行为

- Heartbeat 默认在 Agent 的主 Session 中运行(`agent:<id>:<mainKey>`),或当 `session.scope = "global"` 时为 `global`。设置 `session` 以覆盖到特定的 Channel Session(Discord/WhatsApp/等)。
- `session` 仅影响运行上下文;传递由 `target` 和 `to` 控制。
- 要传递到特定的 Channel/接收者,设置 `target` + `to`。使用 `target: "last"`,传递使用该 Session 的最后一个外部 Channel。
- Heartbeat 传递默认允许直接/DM 目标。设置 `directPolicy: "block"` 以在仍然运行 Heartbeat 轮次的同时抑制直接目标发送。
- 如果主队列繁忙,Heartbeat 被跳过并稍后重试。
- 如果 `target` 解析为无外部目标,运行仍然发生,但不发送出站消息。
- 仅 Heartbeat 的回复**不会**保持 Session 活动;最后的 `updatedAt` 被恢复,因此空闲过期正常运行。

## 可见性控制

默认情况下,`HEARTBEAT_OK` 确认被抑制,而警报内容被传递。您可以按 Channel 或按账户调整此设置:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # 隐藏 HEARTBEAT_OK(默认)
      showAlerts: true # 显示警报消息(默认)
      useIndicator: true # 发出指示器事件(默认)
  telegram:
    heartbeat:
      showOk: true # 在 Telegram 上显示 OK 确认
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # 抑制此账户的警报传递
```

优先级:每个账户 → 每个 Channel → Channel 默认值 → 内置默认值。

### 每个标志的作用

- `showOk`:当模型返回仅 OK 回复时发送 `HEARTBEAT_OK` 确认。
- `showAlerts`:当模型返回非 OK 回复时发送警报内容。
- `useIndicator`:为 UI 状态表面发出指示器事件。

如果**全部三个**都为 false,OpenClaw 完全跳过 Heartbeat 运行(无模型调用)。

### 每个 Channel vs 每个账户示例

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # 所有 Slack 账户
    accounts:
      ops:
        heartbeat:
          showAlerts: false # 仅抑制 ops 账户的警报
  telegram:
    heartbeat:
      showOk: true
```

### 常见模式

| 目标                                     | 配置                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 默认行为(静默 OK,警报开启) | _(不需要配置)_                                                                     |
| 完全静默(无消息,无指示器) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅指示器(无消息)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 仅在一个 Channel 中 OK                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md(可选)

如果工作空间中存在 `HEARTBEAT.md` 文件,默认提示告诉 Agent 读取它。将其视为您的"Heartbeat 清单":小、稳定且每 30 分钟包含一次是安全的。

如果 `HEARTBEAT.md` 存在但实际上为空(仅空白行和 markdown 标题,如 `# Heading`),OpenClaw 跳过 Heartbeat 运行以节省 API 调用。如果文件缺失,Heartbeat 仍然运行,模型决定做什么。

保持它很小(简短的清单或提醒)以避免提示膨胀。

示例 `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Agent 可以更新 HEARTBEAT.md 吗?

是的 — 如果您要求它。

`HEARTBEAT.md` 只是 Agent 工作空间中的一个普通文件,因此您可以在正常聊天中告诉 Agent 类似:

- "Update `HEARTBEAT.md` to add a daily calendar check."
- "Rewrite `HEARTBEAT.md` so it's shorter and focused on inbox follow-ups."

如果您希望这主动发生,您还可以在 Heartbeat 提示中包含一个显式行,例如:"If the checklist becomes stale, update HEARTBEAT.md with a better one."

安全注意事项:不要将秘密(API 密钥、电话号码、私有令牌)放入 `HEARTBEAT.md` — 它成为提示上下文的一部分。

## 手动唤醒(按需)

您可以将系统事件加入队列并使用以下命令触发立即 Heartbeat:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果多个 Agent 配置了 `heartbeat`,手动唤醒会立即运行每个这些 Agent Heartbeat。

使用 `--mode next-heartbeat` 等待下一个计划的滴答。

## Reasoning 传递(可选)

默认情况下,Heartbeat 仅传递最终的"answer"有效负载。

如果您想要透明度,启用:

- `agents.defaults.heartbeat.includeReasoning: true`

启用时,Heartbeat 还将传递一个单独的消息,前缀为 `Reasoning:`(与 `/reasoning on` 相同的形状)。当 Agent 管理多个 Session/Codex 并且您想看到它为什么决定 ping 您时,这可能很有用 — 但它也可能泄漏比您想要的更多的内部细节。在群聊中最好保持关闭。

## 成本意识

Heartbeat 运行完整的 Agent 轮次。较短的间隔消耗更多令牌。保持 `HEARTBEAT.md` 小,并考虑更便宜的 `model` 或 `target: "none"`,如果您只想要内部状态更新。
