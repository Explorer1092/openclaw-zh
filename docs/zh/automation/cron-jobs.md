---
mmh3_hash: "16570d6910626530beec77cf681a9a9c"
summary: "Gateway 调度器的定时作业、Webhooks 和 Gmail PubSub 触发器"
read_when:
  - 调度后台作业或唤醒时
  - 将外部触发器（Webhooks、Gmail）接入 OpenClaw 时
  - 在 Heartbeat 和 Cron 之间决定定时任务时
title: "定时任务"
sidebarTitle: "定时任务"
---

# 定时任务 (Cron)

Cron 是 Gateway 的内置调度器。它持久化作业，在正确的时间唤醒 Agent，并可将输出传递回聊天 Channel 或 Webhook 端点。

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
  <Step title="检查您的作业">
    ```bash
    openclaw cron list
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

- Cron 在 **Gateway 内部**运行（不在模型内部）。
- 作业定义持久化在 `~/.openclaw/cron/jobs.json`，因此重启不会丢失计划。
- 运行时执行状态持久化在其旁边的 `~/.openclaw/cron/jobs-state.json` 中。如果您在 git 中跟踪 cron 定义，请跟踪 `jobs.json` 并 gitignore `jobs-state.json`。
- 拆分后，较旧的 OpenClaw 版本可以读取 `jobs.json`，但可能将作业视为新作业，因为运行时字段现在位于 `jobs-state.json` 中。
- 当 `jobs.json` 在 Gateway 运行或停止时被编辑，OpenClaw 会将变更的计划字段与待处理的运行时槽元数据进行比较，并清除过时的 `nextRunAtMs` 值。纯格式化或仅键顺序的重写会保留待处理的槽。
- 所有 Cron 执行都创建[后台任务](/automation/tasks)记录。
- 一次性作业（`--at`）默认在成功后自动删除。
- 独立 Cron 运行在完成时尽力关闭其 `cron:<jobId>` 会话的追踪浏览器标签/进程，避免后台浏览器自动化留下孤立进程。
- 独立 Cron 运行还会防范陈旧的确认回复。如果第一个结果只是中间状态更新（"on it"、"pulling everything together"等类似提示），且没有后代子 Agent 运行负责最终答案，OpenClaw 会在传递前再次提示获取实际结果。
- 独立 Cron 运行优先从嵌入式运行获取结构化执行拒绝元数据，然后回退到已知的最终摘要/输出标记（如 `SYSTEM_RUN_DENIED` 和 `INVALID_REQUEST`），因此被阻止的命令不会被报告为绿色运行。
- 独立 Cron 运行还将运行级别 Agent 失败视为作业错误，即使没有产生回复有效载荷，因此模型/Provider 失败会增加错误计数器并触发失败通知，而不是将作业清除为成功。

<a id="maintenance"></a>

<Note>
Cron 的任务协调是运行时拥有的优先，持久历史支持的其次：活动的 Cron 任务在 Cron 运行时仍将该作业追踪为运行时保持活动，即使旧的子会话行仍然存在。一旦运行时停止拥有该作业且 5 分钟宽限窗口过期，维护检查持久运行日志和作业状态以获取匹配的 `cron:<jobId>:<startedAt>` 运行。如果持久历史显示终态结果，任务账本从中完成；否则 Gateway 拥有的维护可以将任务标记为 `lost`。离线 CLI 审计可以从持久历史中恢复，但它不会将自己空的进程内活动作业集视为 Gateway 拥有的 Cron 运行已消失的证明。
</Note>

## 调度类型

| 类型    | CLI 标志  | 描述                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 一次性时间戳（ISO 8601 或相对时间如 `20m`）             |
| `every` | `--every` | 固定间隔                                                |
| `cron`  | `--cron`  | 5 字段或 6 字段 Cron 表达式，带可选 `--tz`              |

没有时区的时间戳被视为 UTC。添加 `--tz America/New_York` 以按本地时钟调度。

周期性整点表达式会自动错开最多 5 分钟，以减少负载峰值。使用 `--exact` 强制精确时间，或使用 `--stagger 30s` 设置显式窗口。

### 月份日和星期日使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当月份日和星期日字段均非通配符时，croner 在**任一**字段匹配时触发——而非两者同时匹配。这是标准 Vixie cron 行为。

```
# 预期：「15 号上午 9 点，且仅在周一时」
# 实际：「每个 15 号上午 9 点，以及每个周一上午 9 点」
0 9 15 * 1
```

这会每月触发约 5-6 次，而非 0-1 次。OpenClaw 使用 Croner 的默认 OR 行为。若需要同时满足两个条件，请使用 Croner 的 `+` 星期日修饰符（`0 9 15 * +1`），或在一个字段上调度并在作业提示或命令中守卫另一个条件。

## 执行风格

| 风格            | `--session` 值      | 运行于                     | 最适合                        |
| --------------- | ------------------- | -------------------------- | ----------------------------- |
| 主会话          | `main`              | 下一次 Heartbeat 轮次       | 提醒、系统事件                |
| 独立            | `isolated`          | 专用 `cron:<jobId>`        | 报告、后台杂务                |
| 当前会话        | `current`           | 创建时绑定                 | 上下文感知的周期性工作        |
| 自定义会话      | `session:custom-id` | 持久命名会话               | 构建在历史上的工作流          |

<AccordionGroup>
  <Accordion title="主会话 vs 独立 vs 自定义">
    **主会话**作业将系统事件排队，并可选择唤醒 Heartbeat（`--wake now` 或 `--wake next-heartbeat`）。这些系统事件不会延伸目标会话的每日/闲置重置新鲜度。**独立**作业以新鲜会话运行专用 Agent 轮次。**自定义会话**（`session:xxx`）跨运行持久化上下文，支持如每日站会这样构建在之前摘要上的工作流。
  </Accordion>
  <Accordion title="独立作业的「新鲜会话」含义">
    对于独立作业，「新鲜会话」意味着每次运行都有新的记录/会话 ID。OpenClaw 可能携带安全偏好，如 thinking/fast/verbose 设置、标签和显式用户选择的模型/认证覆盖，但它不会从旧 Cron 行继承环境对话上下文：Channel/组路由、发送或队列策略、提升、来源或 ACP 运行时绑定。当周期性作业应该故意在同一对话上下文上构建时，使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="运行时清理">
    对于独立作业，运行时拆除现在包括对 Cron 会话的尽力浏览器清理。清理失败被忽略，实际 Cron 结果仍然优先。

    独立 Cron 运行还通过共享运行时清理路径处置为该作业创建的任何捆绑 MCP 运行时实例。这与主会话和自定义会话 MCP 客户端的拆除方式相匹配，因此独立 Cron 作业不会在各次运行中泄漏 stdio 子进程或长期 MCP 连接。
  </Accordion>
  <Accordion title="子 Agent 和 Discord 传递">
    当独立 Cron 运行编排子 Agent 时，传递也优先使用最终后代输出而非陈旧的父中间文本。如果后代仍在运行，OpenClaw 会抑制那个部分父更新而不宣告它。

    对于纯文本 Discord 宣告目标，OpenClaw 一次性发送规范的最终助手文本，而不是重放流式/中间文本有效载荷和最终答案两者。媒体和结构化 Discord 有效载荷仍然作为单独有效载荷传递，以避免附件和组件丢失。
  </Accordion>
</AccordionGroup>

### 独立作业的负载选项

<ParamField path="--message" type="string" required>
  提示文本（独立作业必需）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆盖；使用为该作业选择的允许模型。
</ParamField>
<ParamField path="--thinking" type="string">
  thinking 级别覆盖。
</ParamField>
<ParamField path="--light-context" type="boolean">
  跳过工作空间引导文件注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制作业可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 使用为该作业选择的允许模型。如果请求的模型不被允许，Cron 记录警告并回退到作业的 Agent/默认模型选择。配置的回退链仍然适用，但没有显式每作业回退列表的普通模型覆盖不再将 Agent 主模型附加为隐藏的额外重试目标。

独立作业的模型选择优先级：

1. Gmail Hook 模型覆盖（当运行来自 Gmail 且该覆盖被允许时）
2. 每作业负载 `model`
3. 存储的 Cron 会话模型覆盖
4. Agent/默认模型选择

Fast 模式也遵循已解析的实时选择。如果选择的模型配置有 `params.fastMode`，独立 Cron 默认使用它。存储的会话 `fastMode` 覆盖在任一方向上仍然优先于配置。

如果独立运行遇到实时模型切换交接，Cron 会用切换后的 Provider/模型重试，并在重试前持久化该实时选择。当切换也携带新的认证配置文件时，Cron 也持久化该认证配置文件覆盖。重试是有界的：在初始尝试加 2 次切换重试后，Cron 中止而不是无限循环。

## 传递和输出

| 模式       | 发生的事情                                                |
| ---------- | --------------------------------------------------------- |
| `announce` | 如果 Agent 未发送，则将最终文本回退传递到目标            |
| `webhook`  | 将完成事件负载 POST 到 URL                                |
| `none`     | 没有运行器回退传递                                        |

使用 `--announce --channel telegram --to "-1001234567890"` 进行 Channel 传递。对于 Telegram 论坛主题，使用 `-1001234567890:topic:123`。Slack/Discord/Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。Matrix 房间 ID 区分大小写；使用精确的房间 ID 或 Matrix 中的 `room:!room:server` 形式。

对于独立作业，聊天传递是共享的。如果聊天路由可用，Agent 即使在作业使用 `--no-deliver` 时也可以使用 `message` 工具。如果 Agent 发送到配置/当前目标，OpenClaw 跳过回退宣告。否则 `announce`、`webhook` 和 `none` 仅控制运行器在 Agent 轮次后对最终回复做什么。

当 Agent 从活动聊天创建独立提醒时，OpenClaw 为回退宣告路由存储保留的实时传递目标。内部会话键可能是小写的；当当前聊天上下文可用时，Provider 传递目标不会从这些键重新构建。

失败通知遵循单独的目标路径：

- `cron.failureDestination` 为失败通知设置全局默认值。
- `job.delivery.failureDestination` 按作业覆盖该值。
- 如果两者都未设置且作业已通过 `announce` 传递，失败通知现在回退到该主要 announce 目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 的作业上受支持，除非主要传递模式是 `webhook`。
- `failureAlert.includeSkipped: true` 将作业或全局 Cron 警报策略选择进入重复的跳过运行警报。跳过运行保持单独的连续跳过计数器，因此它们不影响执行错误退避。

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
  <Tab title="周期性独立作业">
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
  <Tab title="模型和 thinking 覆盖">
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

Gateway 可以为外部触发器暴露 HTTP Webhook 端点。在配置中启用：

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

每个请求必须通过标头包含 Hook 令牌：

- `Authorization: Bearer <token>`（推荐）
- `x-openclaw-token: <token>`

查询字符串令牌被拒绝。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    为主会话排队系统事件：

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
    运行独立 Agent 轮次：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    字段：`message`（必需）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="映射 Hooks（POST /hooks/<name>）">
    自定义 Hook 名称通过配置中的 `hooks.mappings` 解析。映射可以使用模板或代码转换将任意负载转换为 `wake` 或 `agent` 动作。
  </Accordion>
</AccordionGroup>

<Warning>
将 Hook 端点保持在回环、tailnet 或受信任的反向代理后面。

- 使用专用的 Hook 令牌；不要重用 Gateway 认证令牌。
- 将 `hooks.path` 保持在专用子路径上；`/` 被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制显式 `agentId` 路由。
- 保持 `hooks.allowRequestSessionKey=false`，除非你需要调用者选择的会话。
- 如果启用 `hooks.allowRequestSessionKey`，还要设置 `hooks.allowedSessionKeyPrefixes` 以约束允许的会话键形状。
- Hook 负载默认用安全边界包装。
  </Warning>

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器接入 OpenClaw。

<Note>
**前提条件：** `gcloud` CLI、`gog`（gogcli）、已启用的 OpenClaw Hooks、用于公共 HTTPS 端点的 Tailscale。
</Note>

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

这会写入 `hooks.gmail` 配置，启用 Gmail 预设，并使用 Tailscale Funnel 作为推送端点。

### Gateway 自动启动

当 `hooks.enabled=true` 且 `hooks.gmail.account` 已设置时，Gateway 在启动时启动 `gog gmail watch serve` 并自动续订 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 以选择退出。

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
  <Step title="创建主题并授予 Gmail 推送访问权限">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="启动 watch">
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

## 管理作业

```bash
# 列出所有作业
openclaw cron list

# 显示一个作业，包括已解析的传递路由
openclaw cron show <jobId>

# 编辑作业
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# 立即强制运行作业
openclaw cron run <jobId>

# 仅在到期时运行
openclaw cron run <jobId> --due

# 查看运行历史
openclaw cron runs --id <jobId> --limit 50

# 删除作业
openclaw cron remove <jobId>

# Agent 选择（多 Agent 设置）
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
模型覆盖说明：

- `openclaw cron add|edit --model ...` 更改作业的选择模型。
- 如果模型被允许，该确切 Provider/模型将到达独立 Agent 运行。
- 如果不被允许，Cron 警告并回退到作业的 Agent/默认模型选择。
- 配置的回退链仍然适用，但没有显式每作业回退列表的普通 `--model` 覆盖不再将 Agent 主模型作为静默的额外重试目标。
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

`maxConcurrentRuns` 限制计划 Cron 分发和独立 Agent 轮次执行两者。独立 Cron Agent 轮次在内部使用队列的专用 `cron-nested` 执行通道，因此提高此值可以让独立的 Cron LLM 运行并行进行，而不是只启动其外部 Cron 包装器。此设置不会扩展共享的非 Cron `nested` 通道。

运行时状态附属文件从 `cron.store` 派生：像 `~/clawd/cron/jobs.json` 这样的 `.json` 存储使用 `~/clawd/cron/jobs-state.json`，而没有 `.json` 后缀的存储路径则附加 `-state.json`。

如果您手动编辑 `jobs.json`，请将 `jobs-state.json` 排除在源代码控制之外。OpenClaw 使用该附属文件存储待处理槽、活动标记、最后运行元数据以及告知调度器外部编辑的作业何时需要新 `nextRunAtMs` 的调度标识。

禁用 Cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重试行为">
    **一次性重试**：瞬时错误（速率限制、过载、网络、服务器错误）最多重试 3 次，采用指数退避。永久错误立即禁用。

    **周期性重试**：重试之间采用指数退避（30s 到 60m）。退避在下一次成功运行后重置。
  </Accordion>
  <Accordion title="维护">
    `cron.sessionRetention`（默认 `24h`）清理独立运行会话条目。`cron.runLog.maxBytes` / `cron.runLog.keepLines` 自动清理运行日志文件。
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
    - 对于 `cron` 计划，验证时区（`--tz`）与主机时区。
    - 运行输出中的 `reason: not-due` 表示手动运行时使用了 `openclaw cron run <jobId> --due` 但作业尚未到期。
  </Accordion>
  <Accordion title="Cron 触发但无传递">
    - 传递模式 `none` 表示不期望有运行器回退发送。当聊天路由可用时，Agent 仍然可以使用 `message` 工具直接发送。
    - 传递目标缺失/无效（`channel`/`to`）表示出站被跳过。
    - 对于 Matrix，具有小写 `delivery.to` 房间 ID 的复制或旧版作业可能失败，因为 Matrix 房间 ID 区分大小写。将作业编辑为 Matrix 中精确的 `!room:server` 或 `room:!room:server` 值。
    - Channel 认证错误（`unauthorized`、`Forbidden`）表示传递被凭据阻止。
    - 如果独立运行只返回静默令牌（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站传递，也抑制回退的排队摘要路径，因此不会向聊天发布任何内容。
    - 如果 Agent 应该自己给用户发消息，请检查作业是否有可用路由（带有之前聊天的 `channel: "last"`，或显式的 Channel/目标）。
  </Accordion>
  <Accordion title="Cron 或 Heartbeat 似乎阻止了 /new 风格的滚动">
    - 每日和闲置重置新鲜度不基于 `updatedAt`；参见[会话管理](/concepts/session#session-lifecycle)。
    - Cron 唤醒、Heartbeat 运行、exec 通知和 Gateway 记录可能会更新路由/状态的会话行，但它们不会延伸 `sessionStartedAt` 或 `lastInteractionAt`。
    - 对于在这些字段存在之前创建的旧版行，当文件仍然可用时，OpenClaw 可以从记录 JSONL 会话标头中恢复 `sessionStartedAt`。没有 `lastInteractionAt` 的旧版闲置行使用恢复的开始时间作为其闲置基线。
  </Accordion>
  <Accordion title="时区问题">
    - 没有 `--tz` 的 Cron 使用 Gateway 主机时区。
    - 没有时区的 `at` 计划被视为 UTC。
    - Heartbeat `activeHours` 使用配置的时区解析。
  </Accordion>
</AccordionGroup>

## 相关

- [自动化与任务](/automation) — 所有自动化机制一览
- [后台任务](/automation/tasks) — Cron 执行的任务账本
- [Heartbeat](/gateway/heartbeat) — 周期性主会话轮次
- [时区](/concepts/timezone) — 时区配置
