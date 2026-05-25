---
mmh3_hash: "7a4f0fe52ad8c0e57ba8065c6785192d"
summary: "Gateway 调度器的定时任务、Webhooks 和 Gmail PubSub 触发器"
read_when:
  - 调度后台任务或唤醒时
  - 将外部触发器（Webhooks、Gmail）接入 OpenClaw 时
  - 在 Heartbeat 和 Cron 之间做定时任务选择时
title: "定时任务"
sidebarTitle: "定时任务"
---

Cron 是 Gateway 的内置调度器。它持久化任务，在正确时间唤醒 Agent，并可将输出交付回聊天 Channel 或 Webhook 端点。

## 快速开始

<Steps>
  <Step title="添加一次性提醒">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="查看你的任务">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="查看运行历史">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron 的工作原理

- Cron 在 **Gateway** 进程内部运行（而非在模型内部）。
- 任务定义持久化在 `~/.openclaw/cron/jobs.json`，重启后不会丢失时间表。
- 运行时执行状态持久化在旁边的 `~/.openclaw/cron/jobs-state.json`。如果你在 git 中跟踪 Cron 定义，请跟踪 `jobs.json` 并将 `jobs-state.json` 加入 gitignore。
- 拆分后，旧版 OpenClaw 可以读取 `jobs.json`，但可能将任务视为全新任务，因为运行时字段现在存放在 `jobs-state.json` 中。
- Gateway 运行或停止时编辑了 `jobs.json`，OpenClaw 会将变更的调度字段与待处理的运行时槽位元数据对比并清除过时的 `nextRunAtMs` 值。纯格式化或仅键顺序变更的重写会保留待处理槽位。
- 所有 Cron 执行都会创建[后台任务](/automation/tasks)记录。
- Gateway 启动时，过期的隔离 Agent 轮次任务会在 Channel 连接窗口外重新调度，而非立即重放，确保 Discord/Telegram 启动和原生命令设置在重启后保持响应。
- 一次性任务（`--at`）成功后默认自动删除。
- 隔离 Cron 运行在完成时尽力关闭其 `cron:<jobId>` Session 的已跟踪浏览器标签/进程，避免遗留孤儿进程。
- 收到窄范围 Cron 自我清理授权的隔离 Cron 运行仍可读取调度器状态、当前任务的自过滤列表及该任务的运行历史，因此状态/Heartbeat 检查可在不获取更广泛 Cron 变更权限的情况下检查自身调度。
- 隔离 Cron 运行还会防范过时的确认回复。如果第一个结果只是临时状态更新（`on it`、`pulling everything together` 等提示语），且没有后代子 Agent 运行仍负责最终答案，OpenClaw 会重新提示一次以获取实际结果。
- 隔离 Cron 运行优先从嵌入运行中获取结构化的执行拒绝元数据，然后回退到已知的最终摘要/输出标记（如 `SYSTEM_RUN_DENIED` 和 `INVALID_REQUEST`），避免将被阻断的命令报告为成功运行。
- 隔离 Cron 运行也将运行级 Agent 失败视为任务错误，即使未产生回复载荷——模型/Provider 失败会增加错误计数器并触发失败通知，而非将任务清除为成功。
- 当隔离 Agent 轮次任务达到 `timeoutSeconds` 时，Cron 会中止底层 Agent 运行并给予短暂的清理窗口。若运行未能排空，Gateway 拥有的清理会在 Cron 记录超时之前强制清除该运行的 Session 所有权，避免排队的聊天工作被困在过时的处理 Session 后面。
- 若隔离 Agent 轮次在运行器启动前或第一次模型调用前停滞，Cron 会记录阶段性超时，如 `setup timed out before runner start` 或 `stalled before first model call (last phase: context-engine)`。这些看门狗在嵌入式 Provider 和 CLI 支持的 Provider 中均有效（在其外部 CLI 进程实际启动之前），且独立于长 `timeoutSeconds` 值进行上限控制，使冷启动/认证/上下文失败能快速暴露。

<a id="maintenance"></a>

<Note>
Cron 的任务对账机制以运行时为主、持久化历史为辅：只要 Cron 运行时仍将该任务标记为运行中，活跃的 Cron 任务就保持存活，即使旧的子 Session 行仍然存在。一旦运行时不再拥有该任务且 5 分钟宽限窗口过期，维护检查会从持久化运行日志和任务状态中查找匹配的 `cron:<jobId>:<startedAt>` 运行。若持久化历史显示终止结果，则从中完成任务账本；否则 Gateway 拥有的维护可将任务标记为 `lost`。离线 CLI 审计可从持久化历史恢复，但它不会将自身内存中空的活跃任务集视为 Gateway 拥有的 Cron 运行已消失的证明。
</Note>

## 调度类型

| 类型    | CLI 参数  | 描述                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 一次性时间戳（ISO 8601 或相对时间，如 `20m`）           |
| `every` | `--every` | 固定间隔                                                |
| `cron`  | `--cron`  | 5 字段或 6 字段 Cron 表达式，可选 `--tz`               |

没有时区的时间戳视为 UTC。添加 `--tz America/New_York` 可按当地挂钟时间调度。

顶部整点的周期性表达式会自动随机错开最多 5 分钟，以减少负载峰值。使用 `--exact` 强制精确时间，或使用 `--stagger 30s` 指定明确的错开窗口。

### 日期和星期使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当日期和星期字段均为非通配符时，croner 匹配**任一**字段匹配的情况，而非两者都匹配。这是标准的 Vixie Cron 行为。

```
# 意图："每月 15 日且为星期一的上午 9 点"
# 实际："每月 15 日的上午 9 点，以及每个星期一的上午 9 点"
0 9 15 * 1
```

这每月会触发约 5-6 次，而非 0-1 次。OpenClaw 使用 Croner 的默认 OR 行为。若需要同时满足两个条件，请使用 Croner 的 `+` 星期修饰符（`0 9 15 * +1`），或仅在一个字段中调度，在任务提示词或命令中守卫另一个字段。

## 执行样式

| 样式           | `--session` 值      | 运行在                    | 最适合                          |
| -------------- | ------------------- | ------------------------- | ------------------------------- |
| 主 Session     | `main`              | 下一次 Heartbeat 轮次     | 提醒、系统事件                  |
| 隔离           | `isolated`          | 专用 `cron:<jobId>`       | 报告、后台任务                  |
| 当前 Session   | `current`           | 创建时绑定                | 上下文感知的周期性工作          |
| 自定义 Session | `session:custom-id` | 持久化命名 Session        | 积累历史的工作流程              |

<AccordionGroup>
  <Accordion title="主 Session、隔离与自定义">
    **主 Session** 任务将系统事件入队，并可选择唤醒 Heartbeat（`--wake now` 或 `--wake next-heartbeat`）。这些系统事件不会为目标 Session 延伸每日/空闲重置新鲜度。**隔离**任务以全新 Session 运行专用 Agent 轮次。**自定义 Session**（`session:xxx`）跨运行持久化上下文，支持如每日站会等基于历史的工作流程。
  </Accordion>
  <Accordion title="隔离任务的"全新 Session"含义">
    对于隔离任务，"全新 Session"意味着每次运行都有新的转录/Session ID。OpenClaw 可能携带安全的偏好设置，如 thinking/fast/verbose 设置、标签和用户显式选择的模型/认证覆盖，但不会从旧的 Cron 行继承环境对话上下文：Channel/群组路由、发送或队列策略、权限提升、来源或 ACP 运行时绑定。当周期性任务需要有意积累相同对话上下文时，请使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="运行时清理">
    对于隔离任务，运行时拆解现在包括对该 Cron Session 的尽力浏览器清理。清理失败会被忽略，实际 Cron 结果仍然有效。

    隔离 Cron 运行还会通过共享运行时清理路径处置为任务创建的所有捆绑 MCP 运行时实例。这与主 Session 和自定义 Session MCP 客户端的拆解方式一致，避免隔离 Cron 任务跨运行泄漏 stdio 子进程或长期 MCP 连接。

  </Accordion>
  <Accordion title="子 Agent 和 Discord 交付">
    当隔离 Cron 运行编排子 Agent 时，交付也优先使用最终后代输出，而非过时的父级临时文本。如果后代仍在运行，OpenClaw 会抑制该父级部分更新，而非提前发布。

    对于纯文本 Discord 通知目标，OpenClaw 仅发送一次规范的最终助手文本，而非重放流式/中间文本载荷和最终答案。媒体和结构化 Discord 载荷仍作为独立载荷交付，避免附件和组件丢失。

  </Accordion>
</AccordionGroup>

### 隔离任务的载荷选项

<ParamField path="--message" type="string" required>
  提示文本（隔离任务必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆盖；使用为该任务选定的允许模型。
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking 级别覆盖。
</ParamField>
<ParamField path="--light-context" type="boolean">
  跳过工作区引导文件注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制任务可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 使用选定的允许模型作为该任务的主模型。它与聊天 Session 的 `/model` 覆盖不同：当任务主模型失败时，配置的后备链仍会生效。如果请求的模型不被允许或无法解析，Cron 会以明确的验证错误使运行失败，而非静默回退到任务的 Agent/默认模型选择。

Cron 任务还可以携带载荷级别的 `fallbacks`。存在时，该列表将替换任务的配置后备链。在任务载荷/API 中使用 `fallbacks: []` 可使 Cron 运行仅尝试选定模型。如果任务有 `--model` 但既无载荷后备也无配置后备，OpenClaw 会传递明确的空后备覆盖，避免将 Agent 主模型作为隐藏的额外重试目标。

隔离任务的模型选择优先级：

1. Gmail Hook 模型覆盖（当运行来自 Gmail 且该覆盖被允许时）
2. 每个任务载荷的 `model`
3. 用户选择的存储 Cron Session 模型覆盖
4. Agent/默认模型选择

Fast 模式也遵循解析后的实时选择。如果选定的模型配置有 `params.fastMode`，隔离 Cron 默认使用该值。无论方向如何，存储的 Session `fastMode` 覆盖仍优先于配置。

如果隔离运行命中实时模型切换移交，Cron 会以切换后的 Provider/模型重试，并在重试前为活跃运行持久化该实时选择。当切换还携带新的认证配置时，Cron 也会为活跃运行持久化该认证配置覆盖。重试有上限：在初始尝试加 2 次切换重试后，Cron 会中止而非无限循环。

在隔离 Cron 运行进入 Agent 运行器之前，OpenClaw 会检查已配置 `api: "ollama"` 和 `api: "openai-completions"` Provider 的可达本地 Provider 端点，这些 Provider 的 `baseUrl` 为回环、私网或 `.local`。如果该端点不可用，运行会以明确的 Provider/模型错误记录为 `skipped`，而非开始模型调用。端点结果缓存 5 分钟，因此使用同一个宕机本地 Ollama、vLLM、SGLang 或 LM Studio 服务器的多个到期任务共享一次小型探测，而非制造请求风暴。跳过的 Provider 预检运行不会增加执行错误退避；启用 `failureAlert.includeSkipped` 可接收重复跳过通知。

## 交付和输出

| 模式       | 行为                                                                |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 若 Agent 未发送，则将最终文本后备交付到目标                         |
| `webhook`  | 将完成事件载荷 POST 到 URL                                          |
| `none`     | 无运行器后备交付                                                    |

使用 `--announce --channel telegram --to "-1001234567890"` 进行 Channel 交付。Telegram 论坛话题请使用 `-1001234567890:topic:123`；直接 RPC/配置调用方也可以将 `delivery.threadId` 作为字符串或数字传递。Slack/Discord/Mattermost 目标应使用明确的前缀（`channel:<id>`、`user:<id>`）。Matrix 房间 ID 区分大小写；请使用来自 Matrix 的确切房间 ID 或 `room:!room:server` 格式。

当通知交付使用 `channel: "last"` 或省略 `channel` 时，`telegram:123` 等带 Provider 前缀的目标可在 Cron 回退到 Session 历史或单个已配置 Channel 之前选择 Channel。只有已加载插件公告的前缀才是 Provider 选择器。如果 `delivery.channel` 是明确的，目标前缀必须命名相同的 Provider；例如，`channel: "whatsapp"` 配合 `to: "telegram:123"` 会被拒绝，而非让 WhatsApp 将 Telegram ID 解释为电话号码。`channel:<id>`、`user:<id>`、`imessage:<handle>` 和 `sms:<number>` 等目标类型和服务前缀仍是 Channel 拥有的目标语法，而非 Provider 选择器。

对于隔离任务，聊天交付是共享的。若聊天路由可用，Agent 可以使用 `message` 工具，即使任务使用了 `--no-deliver`。如果 Agent 发送到已配置/当前目标，OpenClaw 会跳过后备通知。否则，`announce`、`webhook` 和 `none` 只控制运行器在 Agent 轮次结束后如何处理最终回复。

当 Agent 从活跃聊天创建隔离提醒时，OpenClaw 会为后备通知路由存储保留的实时交付目标。内部 Session 键可能是小写的；当前聊天上下文可用时，不会从这些键重建 Provider 交付目标。

隐式通知交付使用已配置的 Channel 允许列表来验证和重新路由过时目标。DM 配对存储批准不是后备自动化接收者；当定时任务应主动发送到 DM 时，请设置 `delivery.to` 或配置 Channel `allowFrom` 条目。

## 输出语言

Cron 任务不会从 Channel、locale 或历史消息中推断回复语言。请将语言规则放在计划消息或模板中：

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

对于模板文件，将语言指令保留在渲染的提示中，并在任务运行前验证 `{{language}}` 等占位符已填充。如果输出混合语言，请明确规则，例如："使用中文描述叙述性文本，技术术语保留英文。"

失败通知遵循独立的目标路径：

- `cron.failureDestination` 设置失败通知的全局默认值。
- `job.delivery.failureDestination` 按任务覆盖该设置。
- 如果两者均未设置且任务已通过 `announce` 交付，失败通知现在会回退到该主通知目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 任务上受支持，除非主交付模式是 `webhook`。
- `failureAlert.includeSkipped: true` 为任务或全局 Cron 告警策略选择加入重复的跳过运行告警。跳过运行保持独立的连续跳过计数器，因此不影响执行错误退避。

## CLI 示例

<Tabs>
  <Tab title="一次性提醒">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="周期性隔离任务">
    ```bash
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Summarize overnight updates." \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="模型和 Thinking 覆盖">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
</Tabs>

## Webhooks

Gateway 可以暴露 HTTP Webhook 端点供外部触发器使用。在配置中启用：

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### 认证

每个请求必须通过请求头包含 Hook Token：

- `Authorization: Bearer <token>`（推荐）
- `x-openclaw-token: <token>`

查询字符串 Token 会被拒绝。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    为主 Session 入队系统事件：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      事件描述。
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` 或 `next-heartbeat`。
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    运行隔离 Agent 轮次：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    字段：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="映射 Hooks（POST /hooks/<name>）">
    自定义 Hook 名称通过配置中的 `hooks.mappings` 解析。映射可以通过模板或代码转换将任意载荷转换为 `wake` 或 `agent` 动作。
  </Accordion>
</AccordionGroup>

<Warning>
将 Hook 端点置于回环、tailnet 或受信任的反向代理后面。

- 使用专用 Hook Token；不要复用 Gateway 认证 Token。
- 将 `hooks.path` 保持在专用子路径上；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制显式 `agentId` 路由。
- 保持 `hooks.allowRequestSessionKey=false`，除非需要调用方选择 Session。
- 如果启用 `hooks.allowRequestSessionKey`，还需设置 `hooks.allowedSessionKeyPrefixes` 以约束允许的 Session 键形状。
- Hook 载荷默认用安全边界包裹。

</Warning>

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器接入 OpenClaw。

<Note>
**前置条件：** `gcloud` CLI、`gog`（gogcli）、OpenClaw Hooks 已启用、用于公共 HTTPS 端点的 Tailscale。
</Note>

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

此命令写入 `hooks.gmail` 配置，启用 Gmail 预设，并使用 Tailscale Funnel 作为推送端点。

### Gateway 自动启动

当 `hooks.enabled=true` 且设置了 `hooks.gmail.account` 时，Gateway 启动时会启动 `gog gmail watch serve` 并自动续期监听。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可退出此行为。

### 手动一次性设置

<Steps>
  <Step title="选择 GCP 项目">
    选择拥有 `gog` 使用的 OAuth 客户端的 GCP 项目：

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="创建话题并授予 Gmail 推送权限">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="启动监听">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail 模型覆盖

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## 管理任务

```bash
# 列出所有任务
openclaw cron list

# 以 JSON 格式获取单个存储任务
openclaw cron get <jobId>

# 查看单个任务，包括已解析的交付路由
openclaw cron show <jobId>

# 编辑任务
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# 立即强制运行任务
openclaw cron run <jobId>

# 立即强制运行任务并等待终止状态
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# 仅在到期时运行
openclaw cron run <jobId> --due

# 查看运行历史
openclaw cron runs --id <jobId> --limit 50

# 查看某次具体运行
openclaw cron runs --id <jobId> --run-id <runId>

# 删除任务
openclaw cron remove <jobId>

# Agent 选择（多 Agent 设置）
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` 在将手动运行入队后立即返回。使用 `--wait` 可在关闭 Hook、维护脚本或其他必须阻塞直到排队运行完成的自动化场景中等待结果。等待模式轮询返回的确切 `runId`；状态为 `ok` 时以 `0` 退出，状态为 `error`、`skipped` 或等待超时时以非零值退出。

<Note>
模型覆盖说明：

- `openclaw cron add|edit --model ...` 更改任务的选定模型。
- 如果模型被允许，该确切的 Provider/模型会到达隔离 Agent 运行。
- 如果不被允许或无法解析，Cron 会以明确的验证错误使运行失败。
- 配置的后备链仍然生效，因为 Cron `--model` 是任务主模型，而非 Session `/model` 覆盖。
- 载荷 `fallbacks` 替换该任务的配置后备链；`fallbacks: []` 禁用后备，使运行严格。
- 没有明确或已配置后备列表的简单 `--model` 不会穿透到 Agent 主模型作为静默的额外重试目标。

</Note>

## 配置

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` 限制定时 Cron 调度和隔离 Agent 轮次执行两者。隔离 Cron Agent 轮次在内部使用队列的专用 `cron-nested` 执行通道，因此提高此值可让独立的 Cron LLM 运行并行进行，而非只是启动其外部 Cron 包装器。共享的非 Cron `nested` 通道不受此设置影响。

运行时状态侧车文件派生自 `cron.store`：如 `~/clawd/cron/jobs.json` 这样的 `.json` 存储使用 `~/clawd/cron/jobs-state.json`，而不带 `.json` 后缀的存储路径则追加 `-state.json`。

如果手动编辑 `jobs.json`，请勿将 `jobs-state.json` 纳入源代码控制。OpenClaw 使用该侧车文件存储待处理槽位、活跃标记、上次运行元数据以及告知调度器外部编辑的任务何时需要全新 `nextRunAtMs` 的调度标识。

禁用 Cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重试行为">
    **一次性重试**：瞬时错误（速率限制、过载、网络、服务器错误）最多重试 3 次，采用指数退避。永久性错误立即禁用。

    **周期性重试**：重试之间指数退避（30 秒到 60 分钟）。下次成功运行后退避重置。

  </Accordion>
  <Accordion title="维护">
    `cron.sessionRetention`（默认 `24h`）清理隔离运行 Session 条目。`cron.runLog.maxBytes` / `cron.runLog.keepLines` 自动清理运行日志文件。
  </Accordion>
</AccordionGroup>

## 故障排除

### 命令阶梯

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron 未触发">
    - 检查 `cron.enabled` 和 `OPENCLAW_SKIP_CRON` 环境变量。
    - 确认 Gateway 持续运行。
    - 对于 `cron` 调度，验证时区（`--tz`）与主机时区的关系。
    - 运行输出中的 `reason: not-due` 意味着用 `openclaw cron run <jobId> --due` 手动运行时任务尚未到期。

  </Accordion>
  <Accordion title="Cron 已触发但无交付">
    - 交付模式 `none` 意味着不期望运行器后备发送。当聊天路由可用时，Agent 仍可直接使用 `message` 工具发送。
    - 交付目标缺失/无效（`channel`/`to`）意味着出站被跳过。
    - 对于 Matrix，复制或遗留任务中小写的 `delivery.to` 房间 ID 可能失败，因为 Matrix 房间 ID 区分大小写。将任务编辑为来自 Matrix 的确切 `!room:server` 或 `room:!room:server` 值。
    - Channel 认证错误（`unauthorized`、`Forbidden`）意味着交付被凭证阻止。
    - 如果隔离运行仅返回静默标记（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站交付，也抑制后备排队摘要路径，因此不会向聊天发布任何内容。
    - 如果 Agent 应该自己向用户发消息，请检查任务是否有可用路由（`channel: "last"` 配合之前的聊天，或明确的 Channel/目标）。

  </Accordion>
  <Accordion title="Cron 或 Heartbeat 似乎阻止了 /new 样式的滚动">
    - 每日和空闲重置新鲜度不基于 `updatedAt`；参见 [Session 管理](/concepts/session#session-lifecycle)。
    - Cron 唤醒、Heartbeat 运行、执行通知和 Gateway 簿记可能会为路由/状态更新 Session 行，但不会延伸 `sessionStartedAt` 或 `lastInteractionAt`。
    - 对于在这些字段存在之前创建的旧行，当文件仍可用时，OpenClaw 可从转录 JSONL Session 头恢复 `sessionStartedAt`。没有 `lastInteractionAt` 的旧空闲行使用该恢复的起始时间作为其空闲基线。

  </Accordion>
  <Accordion title="时区问题">
    - 不带 `--tz` 的 Cron 使用 Gateway 主机时区。
    - 没有时区的 `at` 调度视为 UTC。
    - Heartbeat `activeHours` 使用已配置的时区解析。

  </Accordion>
</AccordionGroup>

## 相关

- [自动化与任务](/automation) — 所有自动化机制概览
- [后台任务](/automation/tasks) — Cron 执行的任务账本
- [Heartbeat](/gateway/heartbeat) — 周期性主会话轮次
- [时区](/concepts/timezone) — 时区配置
