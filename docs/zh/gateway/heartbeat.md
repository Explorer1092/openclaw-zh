---
mmh3_hash: "b2d8be1758bf1fa55e4132c15c9e8ce7"
summary: "Heartbeat 轮询消息和通知规则"
read_when:
  - 调整 Heartbeat 节奏或消息
  - 在 Heartbeat 和 Cron 之间决定用于计划任务
title: "Heartbeat"
---

# Heartbeat (Gateway)

> **Heartbeat vs Cron?** 参见 [Automation & Tasks](/automation) 了解何时使用各自的指导。

Heartbeat 在主 Session 中运行**定期 Agent 轮次**,以便模型能够无需打扰您地呈现任何需要关注的内容。

Heartbeat 是计划的主 Session 轮次 — 它**不会**创建[后台任务](/automation/tasks)记录。任务记录用于分离的工作（ACP 运行、子 Agent、隔离的 Cron 任务）。

故障排除:[计划任务](/automation/cron-jobs#troubleshooting)

## 快速入门(初学者)

1. 保持 Heartbeat 启用(默认是 `30m`,或 Anthropic OAuth/token 认证时为 `1h`,包括 Claude CLI 复用)或设置您自己的节奏。
2. 在 Agent workspace 中创建一个小的 `HEARTBEAT.md` 清单或 `tasks:` 块(可选但推荐)。
3. 决定 Heartbeat 消息应该发送到哪里(`target: "none"` 是默认值;设置 `target: "last"` 路由到最后一个联系人)。
4. 可选:启用 Heartbeat 推理交付以提高透明度。
5. 可选:如果 Heartbeat 运行只需要 `HEARTBEAT.md`,使用轻量引导上下文。
6. 可选:启用隔离 Session 以避免每次 Heartbeat 发送完整对话历史。
7. 可选:将 Heartbeat 限制在活跃时间(本地时间)。

配置示例:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 明确交付到最后一个联系人(默认是 "none")
        directPolicy: "allow", // 默认:允许直接/DM 目标;设置 "block" 以禁止
        lightContext: true, // 可选:仅从引导文件注入 HEARTBEAT.md
        isolatedSession: true, // 可选:每次运行新 Session(无对话历史)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 可选:也发送单独的 `Reasoning:` 消息
      },
    },
  },
}
```

## 默认值

- 间隔:`30m`(或当检测到 Anthropic OAuth/token 认证模式时为 `1h`,包括 Claude CLI 复用)。设置 `agents.defaults.heartbeat.every` 或每个 Agent 的 `agents.list[].heartbeat.every`;使用 `0m` 禁用。
- 提示正文(可通过 `agents.defaults.heartbeat.prompt` 配置):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat 提示以**逐字**方式作为用户消息发送。系统提示包含"Heartbeat"部分,运行在内部被标记。
- 活跃时间(`heartbeat.activeHours`)在配置的时区中检查。在窗口外,Heartbeat 被跳过,直到窗口内的下一个滴答。

## Heartbeat 提示的用途

默认提示故意宽泛:

- **后台任务**:"Consider outstanding tasks" 提示 Agent 审查待处理事项(收件箱、日历、提醒、排队工作)并呈现任何紧急内容。
- **人工检查**:"Checkup sometimes on your human during day time" 偶尔触发轻量的"您有什么需要吗?"消息,但使用您配置的本地时区避免夜间骚扰(参见 [/concepts/timezone](/concepts/timezone))。

Heartbeat 可以响应已完成的[后台任务](/automation/tasks),但 Heartbeat 运行本身不会创建任务记录。

如果您想要 Heartbeat 做一些非常具体的事情(例如"检查 Gmail PubSub 统计"或"验证 Gateway 健康"),请将 `agents.defaults.heartbeat.prompt`(或 `agents.list[].heartbeat.prompt`)设置为自定义正文(逐字发送)。

## 响应约定

- 如果没有需要关注的内容,请回复 **`HEARTBEAT_OK`**。
- 在 Heartbeat 运行期间,当 `HEARTBEAT_OK` 出现在回复的**开头或结尾**时,OpenClaw 将其视为确认。令牌被去除,如果剩余内容 **≤ `ackMaxChars`**(默认:300),则回复被丢弃。
- 如果 `HEARTBEAT_OK` 出现在回复的**中间**,则不会特殊处理。
- 对于警报,**不要**包含 `HEARTBEAT_OK`;只返回警报文本。

在 Heartbeat 外,消息开头/结尾的零散 `HEARTBEAT_OK` 被去除并记录;只有 `HEARTBEAT_OK` 的消息被丢弃。

## 配置

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 默认: 30m (0m 禁用)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 默认: false (当可用时交付单独的 Reasoning: 消息)
        lightContext: false, // 默认: false; true 仅从 workspace 引导文件保留 HEARTBEAT.md
        isolatedSession: false, // 默认: false; true 在新 Session 中运行每次 Heartbeat(无对话历史)
        target: "last", // 默认: none | 选项: last | none | <channel id>(核心或插件,例如 "bluebubbles")
        to: "+15551234567", // 可选的特定于 Channel 的覆盖
        accountId: "ops-bot", // 可选的多账户 Channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK 后允许的最大字符数
      },
    },
  },
}
```

### 范围和优先级

- `agents.defaults.heartbeat` 设置全局 Heartbeat 行为。
- `agents.list[].heartbeat` 在顶部合并;如果任何 Agent 有 `heartbeat` 块,**只有那些 Agent** 运行 Heartbeat。
- `channels.defaults.heartbeat` 为所有 Channel 设置可见性默认值。
- `channels.<channel>.heartbeat` 覆盖 Channel 默认值。
- `channels.<channel>.accounts.<id>.heartbeat`(多账户 Channel)覆盖每个 Channel 设置。

### 每个 Agent 的 Heartbeat

如果任何 `agents.list[]` 条目包含 `heartbeat` 块,**只有那些 Agent** 运行 Heartbeat。每个 Agent 块在 `agents.defaults.heartbeat` 顶部合并(因此您可以设置一次共享默认值并按 Agent 覆盖)。

示例:两个 Agent,只有第二个 Agent 运行 Heartbeat。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 明确交付到最后一个联系人(默认是 "none")
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
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### 活跃时间示例

将 Heartbeat 限制在特定时区的工作时间内:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 明确交付到最后一个联系人(默认是 "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 可选;如果已设置则使用您的 userTimezone,否则使用主机时区
        },
      },
    },
  },
}
```

在此窗口之外(东部时间上午 9 点之前或晚上 10 点之后),Heartbeat 被跳过。窗口内的下一个计划滴答将正常运行。

### 全天候设置

如果您想让 Heartbeat 全天运行,请使用以下模式之一:

- 完全省略 `activeHours`(无时间窗口限制;这是默认行为)。
- 设置全天窗口:`activeHours: { start: "00:00", end: "24:00" }`。

不要将相同的 `start` 和 `end` 时间(例如 `08:00` 到 `08:00`)。这被视为零宽度窗口,因此 Heartbeat 总是被跳过。

### 多账户示例

使用 `accountId` 在 Telegram 等多账户 Channel 上定向特定账户:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // 可选:路由到特定主题/线程
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

### 字段说明

- `every`:Heartbeat 间隔(持续时间字符串;默认单位 = 分钟)。
- `model`:Heartbeat 运行的可选模型覆盖(`provider/model`)。
- `includeReasoning`:启用时,当可用时也交付单独的 `Reasoning:` 消息(与 `/reasoning on` 相同形状)。
- `lightContext`:为 true 时,Heartbeat 运行使用轻量引导上下文,并仅从 workspace 引导文件保留 `HEARTBEAT.md`。
- `isolatedSession`:为 true 时,每次 Heartbeat 在新 Session 中运行,无先前对话历史。使用与 cron `sessionTarget: "isolated"` 相同的隔离模式。显著降低每次 Heartbeat 的 token 成本。与 `lightContext: true` 结合以最大节省。交付路由仍使用主 Session 上下文。
- `session`:Heartbeat 运行的可选 Session 键。
  - `main`(默认):Agent 主 Session。
  - 明确的 Session 键(从 `openclaw sessions --json` 或 [Sessions CLI](/cli/sessions) 复制)。
  - Session 键格式:参见 [Sessions](/concepts/session) 和 [Groups](/channels/groups)。
- `target`:
  - `last`:交付到最后使用的外部 Channel。
  - 明确 Channel:任何已配置的 Channel 或插件 id,例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
  - `none`(默认):运行 Heartbeat 但**不外部交付**。
- `directPolicy`:控制直接/DM 交付行为:
  - `allow`(默认):允许直接/DM Heartbeat 交付。
  - `block`:禁止直接/DM 交付(`reason=dm-blocked`)。
- `to`:可选的接收者覆盖(特定于 Channel 的 ID,例如 WhatsApp 的 E.164 或 Telegram 聊天 ID)。对于 Telegram 主题/线程,使用 `<chatId>:topic:<messageThreadId>`。
- `accountId`:多账户 Channel 的可选账户 ID。当 `target: "last"` 时,账户 ID 适用于已解析的最后一个 Channel(如果它支持账户);否则被忽略。如果账户 ID 与已解析 Channel 的配置账户不匹配,则跳过交付。
- `prompt`:覆盖默认提示正文(不合并)。
- `ackMaxChars`:交付前 `HEARTBEAT_OK` 后允许的最大字符数。
- `suppressToolErrorWarnings`:为 true 时,在 Heartbeat 运行期间抑制工具错误警告负载。
- `activeHours`:将 Heartbeat 运行限制在时间窗口内。包含 `start`(HH:MM,含;使用 `00:00` 表示一天开始)、`end`(HH:MM 不含;`24:00` 允许表示一天结束)和可选 `timezone` 的对象。
  - 省略或 `"user"`:使用您的 `agents.defaults.userTimezone`(如果已设置),否则回退到主机系统时区。
  - `"local"`:始终使用主机系统时区。
  - 任何 IANA 标识符(例如 `America/New_York`):直接使用;如果无效,回退到上述 `"user"` 行为。
  - `start` 和 `end` 对于活跃窗口不能相等;相等值被视为零宽度(始终在窗口外)。
  - 在活跃窗口外,Heartbeat 被跳过,直到窗口内的下一个滴答。

## 交付行为

- Heartbeat 默认在 Agent 的主 Session 中运行(`agent:<id>:<mainKey>`),或当 `session.scope = "global"` 时为 `global`。设置 `session` 覆盖到特定 Channel Session(Discord/WhatsApp 等)。
- `session` 只影响运行上下文;交付由 `target` 和 `to` 控制。
- 要交付到特定 Channel/接收者,设置 `target` + `to`。使用 `target: "last"`,交付使用该 Session 的最后一个外部 Channel。
- Heartbeat 交付默认允许直接/DM 目标。设置 `directPolicy: "block"` 以在仍运行 Heartbeat 轮次的同时禁止直接目标发送。
- 如果主队列忙,Heartbeat 被跳过并稍后重试。
- 如果 `target` 解析为没有外部目的地,运行仍然发生但不发送出站消息。
- 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部禁用,运行会以 `reason=alerts-disabled` 提前跳过。
- 如果仅禁用警报交付,OpenClaw 仍可以运行 Heartbeat、更新到期任务时间戳、恢复 Session 空闲时间戳,并抑制出站警报负载。
- 仅 Heartbeat 的回复**不会**保持 Session 活跃;`updatedAt` 被恢复,以便空闲过期正常行为。
- 分离的[后台任务](/automation/tasks)可以排队系统事件并唤醒 Heartbeat,以便主 Session 快速注意到某些内容。该唤醒不会使 Heartbeat 运行变成后台任务。

## 可见性控制

默认情况下,`HEARTBEAT_OK` 确认被抑制,而警报内容被交付。您可以按 Channel 或按账户调整:

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
          showAlerts: false # 为此账户抑制警报交付
```

优先级:每账户 → 每 Channel → Channel 默认值 → 内置默认值。

### 每个标志的作用

- `showOk`:当模型返回仅 OK 回复时发送 `HEARTBEAT_OK` 确认。
- `showAlerts`:当模型返回非 OK 回复时发送警报内容。
- `useIndicator`:为 UI 状态表面发出指示器事件。

如果**三者**都为 false,OpenClaw 完全跳过 Heartbeat 运行(无模型调用)。

### 每 Channel 与每账户示例

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
          showAlerts: false # 仅为 ops 账户抑制警报
  telegram:
    heartbeat:
      showOk: true
```

### 常见模式

| 目标                                     | 配置                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 默认行为(静默 OK,警报开启)      | _(无需配置)_                                                                             |
| 完全静默(无消息,无指示器) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅指示器(无消息)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 仅在一个 Channel 显示 OK                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md(可选)

如果 workspace 中存在 `HEARTBEAT.md` 文件,默认提示告诉 Agent 读取它。把它想象成您的"Heartbeat 清单":小巧、稳定,每 30 分钟包含一次是安全的。

如果 `HEARTBEAT.md` 存在但实际上是空的(只有空行和像 `# Heading` 这样的 markdown 标题),OpenClaw 跳过 Heartbeat 运行以节省 API 调用。跳过会以 `reason=empty-heartbeat-file` 报告。如果文件缺失,Heartbeat 仍然运行,模型决定做什么。

保持简短(简短清单或提醒)以避免提示膨胀。

`HEARTBEAT.md` 示例:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 块

`HEARTBEAT.md` 还支持小的结构化 `tasks:` 块,用于 Heartbeat 内部基于间隔的检查。

示例:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

行为:

- OpenClaw 解析 `tasks:` 块并检查每个任务的 `interval`。
- 每次 Heartbeat 滴答只有**到期**的任务被包含在提示中。
- 如果没有任务到期,Heartbeat 完全跳过(`reason=no-tasks-due`)以避免浪费的模型调用。
- `HEARTBEAT.md` 中的非任务内容被保留并作为附加上下文附加在到期任务列表之后。
- 任务最后运行时间戳存储在 Session 状态(`heartbeatTaskState`)中,因此间隔在正常重启后仍有效。
- 任务时间戳只在 Heartbeat 运行完成正常回复路径后才推进。跳过的 `empty-heartbeat-file` / `no-tasks-due` 运行不会将任务标记为已完成。

当您想让一个 Heartbeat 文件包含多个周期性检查而无需每次滴答都为所有任务付费时,任务模式非常有用。

### Agent 可以更新 HEARTBEAT.md 吗?

可以 — 如果您要求它。

`HEARTBEAT.md` 只是 Agent workspace 中的一个普通文件,所以您可以在普通聊天中告诉 Agent:

- "更新 `HEARTBEAT.md` 以添加每日日历检查。"
- "重写 `HEARTBEAT.md` 使其更简短并专注于收件箱跟进。"

如果您想让这主动发生,您也可以在 Heartbeat 提示中包含一行明确的指令:"如果清单变得过时,请用更好的更新 HEARTBEAT.md。"

安全注意事项:不要将密钥(API 密钥、电话号码、私人令牌)放入 `HEARTBEAT.md` — 它成为提示上下文的一部分。

## 手动唤醒(按需)

您可以排队一个系统事件并立即触发 Heartbeat:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果多个 Agent 配置了 `heartbeat`,手动唤醒立即运行每个 Agent 的 Heartbeat。

使用 `--mode next-heartbeat` 等待下一个计划滴答。

## 推理交付(可选)

默认情况下,Heartbeat 只交付最终"答案"负载。

如果您想要透明度,启用:

- `agents.defaults.heartbeat.includeReasoning: true`

启用时,Heartbeat 还会交付一个以 `Reasoning:` 为前缀的单独消息(与 `/reasoning on` 相同形状)。当 Agent 管理多个 Session/代码库时,这很有用,您想了解它决定 ping 您的原因 — 但它也可能泄露比您想要更多的内部细节。建议在群聊中保持关闭。

## 成本意识

Heartbeat 运行完整的 Agent 轮次。较短的间隔消耗更多 token。要降低成本:

- 使用 `isolatedSession: true` 以避免发送完整对话历史(每次运行从约 100K token 降低到约 2-5K)。
- 使用 `lightContext: true` 将引导文件限制为仅 `HEARTBEAT.md`。
- 设置更便宜的 `model`(例如 `ollama/llama3.2:1b`)。
- 保持 `HEARTBEAT.md` 简短。
- 如果只想要内部状态更新,使用 `target: "none"`。

## 相关

- [Automation & Tasks](/automation) — 一目了然的所有自动化机制
- [后台任务](/automation/tasks) — 分离工作如何被跟踪
- [Timezone](/concepts/timezone) — 时区如何影响 Heartbeat 调度
- [故障排除](/automation/cron-jobs#troubleshooting) — 调试自动化问题
