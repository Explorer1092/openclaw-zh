---
title: "会话工具"
sidebarTitle: "会话工具"
mmh3_hash: "4b3a657f50f9ac3de442b4e8cfa21e28"
summary: "Agent session tools 用于列出 sessions、获取历史记录和发送跨 session 消息"
read_when:
  - 添加或修改 session tools
---

# 会话工具

目标:小型、难以误用的 tool 集,以便 agents 可以列出 sessions、获取历史记录和发送到另一个 session。

## Tool 名称

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

## Key Model

- Main direct chat bucket 始终是文字键 `"main"`(解析为当前 agent 的 main key)。
- Group chats 使用 `agent:<agentId>:<channel>:group:<id>` 或 `agent:<agentId>:<channel>:channel:<id>`(传递完整键)。
- Cron jobs 使用 `cron:<job.id>`。
- Hooks 使用 `hook:<uuid>`,除非明确设置。
- Node sessions 使用 `node-<nodeId>`,除非明确设置。

`global` 和 `unknown` 是保留值,永远不会列出。如果 `session.scope = "global"`,我们将其别名为 `main` 用于所有 tools,因此调用者永远看不到 `global`。

## sessions_list

将 sessions 列为行数组。

参数:

- `kinds?: string[]` 过滤器:以下任意 `"main" | "group" | "cron" | "hook" | "node" | "other"`
- `limit?: number` 最大行数(默认:服务器默认值,钳位例如 200)
- `activeMinutes?: number` 仅在 N 分钟内更新的 sessions
- `messageLimit?: number` 0 = 无消息(默认 0);>0 = 包括最后 N 条消息

行为:

- `messageLimit > 0` 为每个 session 获取 `chat.history` 并包括最后 N 条消息。
- Tool results 在列表输出中被过滤掉;使用 `sessions_history` 获取 tool 消息。
- 在 **沙盒** agent session 中运行时,session tools 默认为 **仅生成可见性**(见下文)。

行形状(JSON):

- `key`: session key (string)
- `kind`: `main | group | cron | hook | node | other`
- `channel`: `whatsapp | telegram | discord | signal | imessage | webchat | internal | unknown`
- `displayName` (如果可用,group 显示标签)
- `updatedAt` (ms)
- `sessionId`
- `model`, `contextTokens`, `totalTokens`
- `thinkingLevel`, `verboseLevel`, `systemSent`, `abortedLastRun`
- `sendPolicy` (如果设置,session 覆盖)
- `lastChannel`, `lastTo`
- `deliveryContext` (规范化的 `{ channel, to, accountId }`,在可用时)
- `transcriptPath` (从 store dir + sessionId 派生的尽力路径)
- `messages?` (仅当 `messageLimit > 0` 时)

## sessions_history

获取一个 session 的 transcript。

参数:

- `sessionKey` (必需;接受 session key 或来自 `sessions_list` 的 `sessionId`)
- `limit?: number` 最大消息数(服务器钳位)
- `includeTools?: boolean` (默认 false)

行为:

- `includeTools=false` 过滤 `role: "toolResult"` 消息。
- 以原始 transcript 格式返回消息数组。
- 当给定 `sessionId` 时,OpenClaw 将其解析为相应的 session key(缺失 ids 错误)。

## sessions_send

向另一个 session 发送消息。

参数:

- `sessionKey` (必需;接受 session key 或来自 `sessions_list` 的 `sessionId`)
- `message` (必需)
- `timeoutSeconds?: number` (默认 >0;0 = fire-and-forget)

行为:

- `timeoutSeconds = 0`: 入队并返回 `{ runId, status: "accepted" }`。
- `timeoutSeconds > 0`: 等待最多 N 秒完成,然后返回 `{ runId, status: "ok", reply }`。
- 如果等待超时:`{ runId, status: "timeout", error }`。运行继续;稍后调用 `sessions_history`。
- 如果运行失败:`{ runId, status: "error", error }`。
- Announce delivery 在主运行完成后运行,并且是尽力而为;`status: "ok"` 不保证 announce 已传递。
- 通过 gateway `agent.wait`(服务器端)等待,因此重新连接不会丢弃等待。
- Agent-to-agent message context 为主运行注入。
- 跨 session 消息以 `message.provenance.kind = "inter_session"` 持久化,以便 transcript 读取者可以区分路由的 agent 指令与外部用户输入。
- 主运行完成后,OpenClaw 运行 **reply-back loop**:
  - 第 2 轮+ 在请求者和目标 agents 之间交替。
  - 精确回复 `REPLY_SKIP` 以停止乒乓。
  - 最大回合数为 `session.agentToAgent.maxPingPongTurns` (0–5,默认 5)。
- 一旦循环结束,OpenClaw 运行 **agent‑to‑agent announce 步骤**(仅目标 agent):
  - 精确回复 `ANNOUNCE_SKIP` 以保持静默。
  - 任何其他回复都发送到目标 channel。
  - Announce 步骤包括原始请求 + 第 1 轮回复 + 最新乒乓回复。

## Channel 字段

- 对于 groups,`channel` 是在 session 条目上记录的 channel。
- 对于直接聊天,`channel` 从 `lastChannel` 映射。
- 对于 cron/hook/node,`channel` 是 `internal`。
- 如果缺失,`channel` 是 `unknown`。

## 安全 / Send Policy

基于 channel/chat 类型(不是每个 session id)的基于 policy 的阻止。

```json
{
  "session": {
    "sendPolicy": {
      "rules": [
        {
          "match": { "channel": "discord", "chatType": "group" },
          "action": "deny"
        }
      ],
      "default": "allow"
    }
  }
}
```

Runtime 覆盖(每个 session 条目):

- `sendPolicy: "allow" | "deny"` (未设置 = 继承配置)
- 通过 `sessions.patch` 或仅所有者的 `/send on|off|inherit`(独立消息)可设置。

强制执行点:

- `chat.send` / `agent` (gateway)
- auto-reply delivery 逻辑

## sessions_spawn

在隔离的 session 中生成 sub-agent 运行,并将结果宣布回请求者 chat channel。

参数:

- `task` (必需)
- `label?` (可选;用于日志/UI)
- `agentId?` (可选;如果允许,在另一个 agent id 下生成)
- `model?` (可选;覆盖 sub-agent model;无效值错误)
- `thinking?` (可选;覆盖 sub-agent 运行的 thinking level)
- `runTimeoutSeconds?` (默认为 `agents.defaults.subagents.runTimeoutSeconds`(若已设置),否则为 `0`;设置时,在 N 秒后中止 sub-agent 运行)
- `thread?` (默认 false;在支持的 channel/plugin 中请求线程绑定路由)
- `mode?` (`run|session`;默认 `run`,但当 `thread=true` 时默认 `session`;`mode="session"` 需要 `thread=true`)
- `cleanup?` (`delete|keep`,默认 `keep`)
- `sandbox?` (`inherit|require`,默认 `inherit`;`require` 在目标子 runtime 未沙盒化时拒绝 spawn)
- `attachments?` (可选内联文件数组;仅子 agent runtime,ACP 拒绝)。每个条目:`{ name, content, encoding?: "utf8" | "base64", mimeType? }`。文件被实例化到子 workspace 的 `.openclaw/attachments/<uuid>/` 中。返回包含每个文件 sha256 的收据。
- `attachAs?` (可选;`{ mountPath? }` 提示,保留供将来挂载实现使用)

允许列表:

- `agents.list[].subagents.allowAgents`: 通过 `agentId` 允许的 agent ids 列表(`["*"]` 允许任何)。默认:仅请求者 agent。
- Sandbox 继承守卫:如果请求者 session 是沙盒化的,`sessions_spawn` 拒绝将在非沙盒化环境中运行的目标。

发现:

- 使用 `agents_list` 发现哪些 agent ids 允许用于 `sessions_spawn`。

行为:

- 使用 `deliver: false` 启动新的 `agent:<agentId>:subagent:<uuid>` session。
- Sub-agents 默认为完整 tool 集 **减去 session tools**(通过 `tools.subagents.tools` 可配置)。
- Sub-agents 不允许调用 `sessions_spawn`(无 sub-agent → sub-agent 生成)。
- 始终非阻塞:立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 当 `thread=true` 时,channel plugins 可以将传递/路由绑定到线程目标(Discord 支持由 `session.threadBindings.*` 和 `channels.discord.threadBindings.*` 控制)。
- 完成后,OpenClaw 运行 sub-agent **announce 步骤** 并将结果发布到请求者 chat channel。
  - 如果 assistant 最终回复为空,则将 sub-agent 历史中的最新 `toolResult` 包含为 `Result`。
- 在 announce 步骤期间精确回复 `ANNOUNCE_SKIP` 以保持静默。
- Announce 回复规范化为 `Status`/`Result`/`Notes`;`Status` 来自 runtime 结果(不是 model 文本)。
- Sub-agent sessions 在 `agents.defaults.subagents.archiveAfterMinutes`(默认:60)后自动归档。
- Announce 回复包括统计行(runtime、tokens、sessionKey/sessionId、transcript 路径和可选成本)。

## Sandbox Session 可见性

Session tools 可以限定范围以减少跨 session 访问。

默认行为:

- `tools.sessions.visibility` 默认为 `tree`(当前 session + 生成的 subagent sessions)。
- 对于沙盒 sessions,`agents.defaults.sandbox.sessionToolsVisibility` 可以硬性限制可见性。

配置:

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      // 默认: "tree"
      visibility: "tree",
    },
  },
  agents: {
    defaults: {
      sandbox: {
        // 默认: "spawned"
        sessionToolsVisibility: "spawned", // 或 "all"
      },
    },
  },
}
```

注意:

- `self`: 仅当前 session key。
- `tree`: 当前 session + 当前 session 生成的 sessions。
- `agent`: 属于当前 agent id 的任何 session。
- `all`: 任何 session(跨 agent 访问仍需要 `tools.agentToAgent`)。
- 当 session 处于沙盒中且 `sessionToolsVisibility="spawned"` 时,即使您设置了 `tools.sessions.visibility="all"`,OpenClaw 也会将可见性限制到 `tree`。
