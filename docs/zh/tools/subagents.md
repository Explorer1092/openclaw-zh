---
title: "子 agent"
mmh3_hash: "23bea4475c628ad02d42be5d93a1ec4c"
summary: "子 agent: 生成隔离的 agent 运行,将结果公告回请求者聊天"
read_when:
  - 您想通过 agent 进行后台/并行工作
  - 您正在更改 sessions_spawn 或子 agent 工具策略
---

# 子 agent

子 agent 是从现有 agent 运行生成的后台 agent 运行。它们在自己的会话(`agent:<agentId>:subagent:<uuid>`)中运行,完成后,将其结果**公告**回请求者聊天频道。

## 斜杠命令

使用 `/subagents` 检查或控制**当前会话**的子 agent 运行:
- `/subagents list`
- `/subagents stop <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`

`/subagents info` 显示运行元数据(状态、时间戳、会话 id、记录路径、清理)。

主要目标:
- 并行化"研究/长任务/慢工具"工作,而不阻塞主运行。
- 默认情况下保持子 agent 隔离(会话分离 + 可选沙箱)。
- 保持工具表面难以误用: 子 agent 默认**不**获得会话工具。
- 避免嵌套扇出: 子 agent 无法生成子 agent。

成本注意事项: 每个子 agent 都有其**自己的**上下文和令牌使用。对于繁重或重复性任务,为子 agent 设置更便宜的模型,并将主 agent 保留在更高质量的模型上。您可以通过 `agents.defaults.subagents.model` 或每个 agent 的覆盖来配置这一点。

## 工具

使用 `sessions_spawn`:
- 启动子 agent 运行(`deliver: false`,全局通道: `subagent`)
- 然后运行公告步骤并将公告回复发布到请求者聊天频道
- 默认模型: 继承调用者,除非您设置 `agents.defaults.subagents.model`(或每个 agent 的 `agents.list[].subagents.model`);显式的 `sessions_spawn.model` 仍然获胜。

工具参数:
- `task`(必需)
- `label?`(可选)
- `agentId?`(可选;如果允许,在另一个 agent id 下生成)
- `model?`(可选;覆盖子 agent 模型;无效值被跳过,子 agent 在默认模型上运行,工具结果中有警告)
- `thinking?`(可选;覆盖子 agent 运行的 thinking 级别)
- `runTimeoutSeconds?`(默认 `0`;设置时,子 agent 运行在 N 秒后中止)
- `cleanup?`(`delete|keep`,默认 `keep`)

允许列表:
- `agents.list[].subagents.allowAgents`: 可以通过 `agentId` 定位的 agent id 列表(`["*"]` 允许任何)。默认: 仅请求者 agent。

发现:
- 使用 `agents_list` 查看当前允许 `sessions_spawn` 的 agent id。

自动归档:
- 子 agent 会话在 `agents.defaults.subagents.archiveAfterMinutes`(默认: 60)后自动归档。
- 归档使用 `sessions.delete` 并将记录重命名为 `*.deleted.<timestamp>`(相同文件夹)。
- `cleanup: "delete"` 在公告后立即归档(仍通过重命名保留记录)。
- 自动归档是尽力而为的;如果网关重启,挂起的计时器会丢失。
- `runTimeoutSeconds` **不**自动归档;它只停止运行。会话保留直到自动归档。

## 认证

子 agent 认证由 **agent id** 解析,而不是会话类型:
- 子 agent 会话键是 `agent:<agentId>:subagent:<uuid>`。
- 认证存储从该 agent 的 `agentDir` 加载。
- 主 agent 的认证配置文件合并为**回退**;agent 配置文件在冲突时覆盖主配置文件。

注意: 合并是累加的,因此主配置文件始终作为回退可用。尚不支持每个 agent 的完全隔离认证。

## 公告

子 agent 通过公告步骤报告:
- 公告步骤在子 agent 会话内运行(而非请求者会话)。
- 如果子 agent 恰好回复 `ANNOUNCE_SKIP`,则不发布任何内容。
- 否则,公告回复通过后续 `agent` 调用(`deliver=true`)发布到请求者聊天频道。
- 公告回复在可用时保留线程/主题路由(Slack 线程、Telegram 主题、Matrix 线程)。
- 公告消息规范化为稳定模板:
  - `Status:` 从运行结果派生(`success`、`error`、`timeout` 或 `unknown`)。
  - `Result:` 公告步骤的摘要内容(如果缺失则为 `(not available)`)。
  - `Notes:` 错误详细信息和其他有用的上下文。
- `Status` 不是从模型输出推断的;它来自运行时结果信号。

公告负载在末尾包含统计行(即使包装):
- 运行时(例如,`runtime 5m12s`)
- 令牌使用(输入/输出/总计)
- 配置模型定价时的估计成本(`models.providers.*.models[].cost`)
- `sessionKey`、`sessionId` 和记录路径(以便主 agent 可以通过 `sessions_history` 获取历史记录或检查磁盘上的文件)

## 工具策略(子 agent 工具)

默认情况下,子 agent 获得**除会话工具之外的所有工具**:
- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

通过配置覆盖:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1
      }
    }
  },
  tools: {
    subagents: {
      tools: {
        // deny 获胜
        deny: ["gateway", "cron"],
        // 如果设置 allow,它变为仅允许(deny 仍然获胜)
        // allow: ["read", "exec", "process"]
      }
    }
  }
}
```

## 并发

子 agent 使用专用的进程内队列通道:
- 通道名称: `subagent`
- 并发: `agents.defaults.subagents.maxConcurrent`(默认 `8`)

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话并停止从中生成的任何活动子 agent 运行。

## 限制

- 子 agent 公告是**尽力而为**。如果网关重启,挂起的"公告回"工作会丢失。
- 子 agent 仍共享相同的网关进程资源;将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的: 它立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子 agent 上下文仅注入 `AGENTS.md` + `TOOLS.md`(无 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`)。

<!-- i18n-hash:da6e3b423fbbeae1126a4345904a4cba -->
