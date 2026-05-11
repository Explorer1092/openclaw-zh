---
mmh3_hash: "3c2aad5427c597e3e1bdfc3208d6d77e"
summary: "`openclaw sessions` 的 CLI 参考（列出存储的 Session + 使用情况）"
read_when:
  - 您想列出存储的 Session 并查看最近的活动
title: "Sessions"
---

# `openclaw sessions`

列出存储的会话 Session。

Session 列表不是 Channel/Provider 活跃性检查。它们显示来自 Session 存储的持久化会话行。安静的 Discord、Slack、Telegram 或其他 Channel 可以在不创建新 Session 行的情况下成功重新连接，直到有消息被处理。当您需要实时 Channel 连接性时，使用 `openclaw channels status --probe`、`openclaw status --deep` 或 `openclaw health --verbose`。

`openclaw sessions` 和 Gateway `sessions.list` 响应默认受限制，以避免大型长期存储垄断 CLI 进程或 Gateway 事件循环。CLI 默认返回最新的 100 个 Session；传递 `--limit <n>` 以获得较小/较大的窗口，或在有意需要完整存储时传递 `--limit all`。JSON 响应在调用者需要显示存在更多行时包含 `totalCount`、`limitApplied` 和 `hasMore`。

RPC 客户端可以传递 `configuredAgentsOnly: true` 以保持广泛的综合发现源，但只返回当前在配置中存在的 Agent 的行。控制 UI 默认使用该模式，以便已删除或仅磁盘的 Agent 存储不会重新出现在 Sessions 视图中。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

范围选择：

- 默认：已配置的默认 Agent 存储
- `--verbose`：详细日志记录
- `--agent <id>`：一个已配置的 Agent 存储
- `--all-agents`：聚合所有已配置的 Agent 存储
- `--store <path>`：显式存储路径（不能与 `--agent` 或 `--all-agents` 组合）
- `--limit <n|all>`：最大输出行数（默认 `100`；`all` 恢复完整输出）

导出存储 Session 的轨迹包：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

这是所有者批准 exec 请求后 `/export-trajectory` 斜杠命令使用的命令路径。输出目录始终在选定工作空间下的 `.openclaw/trajectory-exports/` 中解析。

`openclaw sessions --all-agents` 读取已配置的 Agent 存储。Gateway 和 ACP Session 发现更广泛：它们还包括在默认 `agents/` 根目录或模板化的 `session.store` 根目录下找到的仅磁盘存储。这些发现的存储必须解析为 Agent 根目录内的常规 `sessions.json` 文件；符号链接和根目录外的路径被跳过。

JSON 示例：

`openclaw sessions --all-agents --json`：

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## 清理维护

立即运行维护（而不是等待下一个写入周期）：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` 使用配置中的 `session.maintenance` 设置：

- 范围注意：`openclaw sessions cleanup` 维护 Session 存储、对话记录和轨迹附属文件。它不会清理 cron 运行日志（`cron/runs/<jobId>.jsonl`），这些由 [Cron 配置](/automation/cron-jobs#configuration) 中的 `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 管理，并在 [Cron 维护](/automation/cron-jobs#maintenance) 中说明。
- 清理还会清除早于 `session.maintenance.pruneAfter` 的未引用主对话记录、压缩检查点和轨迹附属文件；仍被 `sessions.json` 引用的文件将被保留。

- `--dry-run`：预览将清除/上限多少条目，不写入。
  - 在文本模式下，dry-run 打印每 Session 操作表格（`Action`、`Key`、`Age`、`Model`、`Flags`），以便您看到将保留什么与删除什么。
- `--enforce`：即使 `session.maintenance.mode` 为 `warn` 也应用维护。
- `--fix-missing`：删除对话记录文件缺失的条目，即使它们通常不会按年龄/计数超出。
- `--fix-dm-scope`：当 `session.dmScope` 为 `main` 时，退役之前 `per-peer`、`per-channel-peer` 或 `per-account-channel-peer` 路由留下的过时同级键直接 DM 行。先使用 `--dry-run`；应用清理会从 `sessions.json` 中删除这些行，并将其对话记录保留为已删除的归档。
- `--active-key <key>`：保护特定活动键不受磁盘预算驱逐。持久的外部会话指针（如群组 Session 和线程范围的聊天 Session）也按年龄/计数/磁盘预算维护保留。
- `--agent <id>`：对一个已配置的 Agent 存储运行清理。
- `--all-agents`：对所有已配置的 Agent 存储运行清理。
- `--store <path>`：针对特定的 `sessions.json` 文件运行。
- `--json`：打印 JSON 摘要。使用 `--all-agents` 时，输出包括每个存储的一个摘要。

当 Gateway 可达时，已配置 Agent 存储的非 dry-run 清理通过 Gateway 发送，使其与运行时流量共享同一 Session 存储写入器。对于存储文件的显式离线修复，使用 `--store <path>`。

`openclaw sessions cleanup --all-agents --dry-run --json`：

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

相关：

- Session 配置：[配置参考](/gateway/config-agents#session)

## 相关

- [CLI 参考](/cli)
- [Session 管理](/concepts/session)
