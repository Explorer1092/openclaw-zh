---
read_when:
  - 调整心跳频率或消息时
  - 在心跳和 cron 之间选择定时任务方案时
summary: 心跳轮询消息和通知规则
title: 心跳
x-i18n:
  generated_at: "2026-02-03T07:48:57Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: b416fc2e08e0414eb62951f05ed0ee19375fc683e88cd3238c821c30ec695eb4
  source_path: gateway/heartbeat.md
  workflow: 15
---

# 心跳（Gateway 网关）

> **心跳 vs Cron？** 参见 [Cron vs 心跳](/automation/cron-vs-heartbeat) 了解何时使用哪种方案。

心跳在主会话中运行**周期性智能体轮次**，使模型能够在不打扰你的情况下提醒需要关注的事项。

心跳是一个定时的主会话轮次——它**不**创建[后台任务](/automation/tasks)记录。任务记录用于分离的工作（ACP 运行、子智能体、隔离的 cron 任务）。

故障排除：[/automation/troubleshooting](/automation/troubleshooting)

## 快速开始（新手）

1. 保持心跳启用（默认 `30m`，Anthropic OAuth/setup-token 为 `1h`）或设置你自己的频率。
2. 在智能体工作区创建一个简单的 `HEARTBEAT.md` 检查清单（可选但推荐）。
3. 决定心跳消息发送到哪里（默认 `target: "none"`；设置 `target: "last"` 路由到最后一个联系人）。
4. 可选：启用心跳推理内容发送以提高透明度。
5. 可选：使用轻量引导上下文（仅需 `HEARTBEAT.md`）。
6. 可选：启用隔离会话以避免每次心跳都发送完整对话历史。
7. 可选：将心跳限制在活动时段（本地时间）。

配置示例：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 明确发送到最后联系人（默认为 "none"）
        directPolicy: "allow", // 默认：允许私信/DM 目标；设置 "block" 可抑制
        lightContext: true, // 可选：仅从引导文件注入 HEARTBEAT.md
        isolatedSession: true, // 可选：每次运行使用新会话（无对话历史）
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 可选：同时发送单独的 `Reasoning:` 消息
      },
    },
  },
}
```

## 默认值

- 间隔：`30m`（当检测到的认证模式为 Anthropic OAuth/setup-token 时为 `1h`）。设置 `agents.defaults.heartbeat.every` 或单智能体 `agents.list[].heartbeat.every`；使用 `0m` 禁用。
- 提示内容（可通过 `agents.defaults.heartbeat.prompt` 配置）：
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- 心跳提示**原样**作为用户消息发送。系统提示包含"Heartbeat"部分，运行在内部被标记。
- 活动时段（`heartbeat.activeHours`）按配置的时区检查。在时段外，心跳会被跳过直到下一个时段内的时钟周期。

## 心跳提示的用途

默认提示故意设计得比较宽泛：

- **后台任务**："Consider outstanding tasks"促使智能体审查待办事项（收件箱、日历、提醒、排队工作）并提醒任何紧急事项。
- **人类签到**："Checkup sometimes on your human during day time"促使偶尔发送轻量级的"有什么需要帮助的吗？"消息，但通过使用你配置的本地时区避免夜间打扰（参见 [/concepts/timezone](/concepts/timezone)）。

如果你希望心跳执行非常具体的任务（例如"检查 Gmail PubSub 统计"或"验证 Gateway 网关健康状态"），将 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）设置为自定义内容（原样发送）。

## 响应约定

- 如果没有需要关注的事项，回复 **`HEARTBEAT_OK`**。
- 在心跳运行期间，当 `HEARTBEAT_OK` 出现在回复的**开头或结尾**时，OpenClaw 将其视为确认。该标记会被移除，如果剩余内容 **≤ `ackMaxChars`**（默认：300），则回复被丢弃。
- 如果 `HEARTBEAT_OK` 出现在回复的**中间**，则不会被特殊处理。
- 对于警报，**不要**包含 `HEARTBEAT_OK`；只返回警报文本。

在心跳之外，消息开头/结尾的意外 `HEARTBEAT_OK` 会被移除并记录日志；仅包含 `HEARTBEAT_OK` 的消息会被丢弃。

## 配置

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 默认：30m（0m 禁用）
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 默认：false（可用时发送单独的 Reasoning: 消息）
        lightContext: false, // 默认：false；true 仅保留工作区引导文件中的 HEARTBEAT.md
        isolatedSession: false, // 默认：false；true 在新会话中运行每次心跳（无对话历史）
        target: "last", // 默认：none | 选项：last | none | <channel id>（核心或插件，例如 "bluebubbles"）
        to: "+15551234567", // 可选的渠道特定覆盖
        accountId: "ops-bot", // 可选的多账户渠道 ID
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK 后允许的最大字符数
      },
    },
  },
}
```

### 作用域和优先级

- `agents.defaults.heartbeat` 设置全局心跳行为。
- `agents.list[].heartbeat` 在其之上合并；如果任何智能体有 `heartbeat` 块，**只有这些智能体**运行心跳。
- `channels.defaults.heartbeat` 为所有渠道设置可见性默认值。
- `channels.<channel>.heartbeat` 覆盖渠道默认值。
- `channels.<channel>.accounts.<id>.heartbeat`（多账户渠道）覆盖单渠道设置。

### 单智能体心跳

如果任何 `agents.list[]` 条目包含 `heartbeat` 块，**只有这些智能体**运行心跳。单智能体块在 `agents.defaults.heartbeat` 之上合并（因此你可以设置一次共享默认值，然后按智能体覆盖）。

示例：两个智能体，只有第二个智能体运行心跳。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",
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

### 活动时段示例

将心跳限制在特定时区的工作时间：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 明确发送到最后联系人（默认为 "none"）
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 可选；未设置时使用 userTimezone，否则使用主机时区
        },
      },
    },
  },
}
```

在此时段外（东部时间早上 9 点前或晚上 10 点后），心跳会被跳过。时段内的下一个计划时钟周期将正常运行。

### 全天运行

如果你想要全天运行心跳，使用以下之一：

- 完全省略 `activeHours`（无时间窗口限制；这是默认行为）。
- 设置全天时段：`activeHours: { start: "00:00", end: "24:00" }`。

不要设置相同的 `start` 和 `end` 时间（例如 `08:00` 到 `08:00`）。这会被视为零宽时段，因此心跳始终被跳过。

### 多账户示例

使用 `accountId` 针对 Telegram 等多账户渠道上的特定账户：

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // 可选：路由到特定话题/线程
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

- `every`：心跳间隔（时长字符串；默认单位 = 分钟）。
- `model`：心跳运行的可选模型覆盖（`provider/model`）。
- `includeReasoning`：启用时，也会发送单独的 `Reasoning:` 消息（如果可用）（与 `/reasoning on` 格式相同）。
- `lightContext`：为 true 时，心跳运行使用轻量引导上下文，仅保留工作区引导文件中的 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次心跳在无先前对话历史的新会话中运行。使用与 cron `sessionTarget: "isolated"` 相同的隔离模式。大幅降低每次心跳的 token 成本。与 `lightContext: true` 结合使用效果最佳。发送路由仍使用主会话上下文。
- `session`：心跳运行的可选会话键。
  - `main`（默认）：智能体主会话。
  - 显式会话键（从 `openclaw sessions --json` 或 [sessions CLI](/cli/sessions) 复制）。
  - 会话键格式：参见[会话](/concepts/session)和[群组](/channels/groups)。
- `target`：
  - `last`：发送到最后使用的外部渠道。
  - 显式渠道：`whatsapp` / `telegram` / `discord` / `googlechat` / `slack` / `msteams` / `signal` / `imessage`。
  - `none`（默认）：运行心跳但**不发送**到外部。
- `directPolicy`：控制私信/DM 发送行为：
  - `allow`（默认）：允许私信/DM 心跳发送。
  - `block`：抑制私信/DM 发送（`reason=dm-blocked`）。
- `to`：可选的收件人覆盖（渠道特定 ID，例如 WhatsApp 的 E.164 或 Telegram 聊天 ID）。Telegram 话题/线程使用 `<chatId>:topic:<messageThreadId>`。
- `accountId`：可选的多账户渠道账户 ID。使用 `target: "last"` 时，账户 ID 适用于支持账户的已解析最后渠道；否则忽略。如果账户 ID 与已解析渠道的已配置账户不匹配，则跳过发送。
- `prompt`：覆盖默认提示内容（不合并）。
- `ackMaxChars`：`HEARTBEAT_OK` 后在发送前允许的最大字符数。
- `suppressToolErrorWarnings`：为 true 时，在心跳运行期间抑制工具错误警告负载。
- `activeHours`：将心跳运行限制在时间窗口内。包含 `start`（HH:MM，含；使用 `00:00` 表示一天的开始）、`end`（HH:MM，不含；允许 `24:00` 表示一天的结束）和可选的 `timezone` 的对象。

## 发送行为

- 心跳默认在智能体主会话中运行（`agent:<id>:<mainKey>`），或当 `session.scope = "global"` 时在 `global` 中运行。设置 `session` 可覆盖为特定渠道会话（Discord/WhatsApp 等）。
- `session` 只影响运行上下文；发送由 `target` 和 `to` 控制。
- 要发送到特定渠道/收件人，设置 `target` + `to`。使用 `target: "last"` 时，发送使用该会话的最后一个外部渠道。
- 心跳发送默认允许私信/DM 目标。设置 `directPolicy: "block"` 可在仍运行心跳轮次的情况下抑制直接目标发送。
- 如果主队列繁忙，心跳会被跳过并稍后重试。
- 如果 `target` 解析为无外部目标，运行仍会发生但不会发送出站消息。
- 仅心跳回复**不会**保持会话活跃；最后的 `updatedAt` 会被恢复，因此空闲过期正常工作。
- 分离的[后台任务](/automation/tasks)可以排队系统事件并唤醒心跳，以便主会话能快速注意到某些事情。这种唤醒不会使心跳运行成为后台任务。

## 可见性控制

默认情况下，`HEARTBEAT_OK` 确认会被抑制，而警报内容会被发送。你可以按渠道或按账户调整：

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # 隐藏 HEARTBEAT_OK（默认）
      showAlerts: true # 显示警报消息（默认）
      useIndicator: true # 发出指示器事件（默认）
  telegram:
    heartbeat:
      showOk: true # 在 Telegram 上显示 OK 确认
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # 为此账户抑制警报发送
```

优先级：单账户 → 单渠道 → 渠道默认值 → 内置默认值。

### 各标志的作用

- `showOk`：当模型返回仅 OK 的回复时，发送 `HEARTBEAT_OK` 确认。
- `showAlerts`：当模型返回非 OK 回复时，发送警报内容。
- `useIndicator`：为 UI 状态界面发出指示器事件。

如果**所有三个**都为 false，OpenClaw 会完全跳过心跳运行（不调用模型）。

### 单渠道 vs 单账户示例

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

| 目标                          | 配置                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| 默认行为（静默 OK，警报开启） | _（无需配置）_                                                                           |
| 完全静默（无消息，无指示器）  | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅指示器（无消息）            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 仅在一个渠道显示 OK           | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（可选）

如果工作区中存在 `HEARTBEAT.md` 文件，默认提示会告诉智能体读取它。把它想象成你的"心跳检查清单"：小巧、稳定，可以安全地每 30 分钟包含一次。

如果 `HEARTBEAT.md` 存在但实际上是空的（只有空行和 markdown 标题如 `# Heading`），OpenClaw 会跳过心跳运行以节省 API 调用。如果文件不存在，心跳仍会运行，由模型决定做什么。

保持它小巧（简短的检查清单或提醒）以避免提示膨胀。

`HEARTBEAT.md` 示例：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### 智能体可以更新 HEARTBEAT.md 吗？

可以 — 如果你要求它这样做。

`HEARTBEAT.md` 只是智能体工作区中的普通文件，所以你可以在普通聊天中告诉智能体：

- "更新 `HEARTBEAT.md` 添加每日日历检查。"
- "重写 `HEARTBEAT.md`，使其更短并专注于收件箱跟进。"

如果你希望这主动发生，你也可以在心跳提示中包含明确的一行，如："If the checklist becomes stale, update HEARTBEAT.md with a better one."

安全提示：不要在 `HEARTBEAT.md` 中放置密钥（API 密钥、电话号码、私有令牌）— 它会成为提示上下文的一部分。

## 手动唤醒（按需）

你可以排队一个系统事件并触发即时心跳：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果多个智能体配置了 `heartbeat`，手动唤醒会立即运行每个智能体的心跳。

使用 `--mode next-heartbeat` 等待下一个计划的时钟周期。

## 推理内容发送（可选）

默认情况下，心跳只发送最终的"答案"负载。

如果你想要透明度，请启用：

- `agents.defaults.heartbeat.includeReasoning: true`

启用后，心跳还会发送一条以 `Reasoning:` 为前缀的单独消息（与 `/reasoning on` 格式相同）。当智能体管理多个会话/代码库并且你想了解它为什么决定联系你时，这很有用 — 但它也可能泄露比你想要的更多内部细节。在群聊中建议保持关闭。

## 成本意识

心跳运行完整的智能体轮次。更短的间隔消耗更多 token。减少成本的方法：

- 使用 `isolatedSession: true` 避免发送完整对话历史（从约 10 万 token 降至每次运行约 2-5 千 token）。
- 使用 `lightContext: true` 将引导文件限制为仅 `HEARTBEAT.md`。
- 设置更便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 保持 `HEARTBEAT.md` 小巧。
- 如果你只想要内部状态更新，使用 `target: "none"`。
