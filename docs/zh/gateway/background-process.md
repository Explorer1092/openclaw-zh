---
mmh3_hash: "7b965ac84a6a40a314d60fa0d8faec04"
summary: "后台 exec 执行和进程管理"
read_when:
  - 添加或修改后台 exec 行为
  - 调试长时间运行的 exec 任务
title: "Background Exec 和 Process 工具"
---

OpenClaw 通过 `exec` 工具运行 shell 命令，并在内存中保留长时间运行的任务。`process` 工具管理这些后台 Session。

## exec 工具

关键参数：

- `command`（必需）
- `yieldMs`（默认 10000）：在此延迟后自动后台化
- `background`（bool）：立即后台化
- `timeout`（秒，默认 `tools.exec.timeoutSec`）：在此超时后终止进程；仅当该调用需要禁用 exec 进程超时时才设置 `timeout: 0`
- `elevated`（bool）：如果启用/允许 elevated 模式，则在沙箱外运行（默认为 `gateway`，或当 exec 目标为 `node` 时为 `node`）
- 需要真实的 TTY？设置 `pty: true`。
- `workdir`、`env`

行为：

- 前台运行直接返回输出。
- 当后台化（显式或超时）时，工具返回 `status: "running"` + `sessionId` 和一小段尾部输出。
- 输出保存在内存中，直到 Session 被轮询或清除。
- 如果 `process` 工具被禁止，`exec` 同步运行并忽略 `yieldMs`/`background`。
- 派生的 exec 命令会收到 `OPENCLAW_SHELL=exec`，用于上下文感知的 shell/profile 规则。
- 对于立即开始的长时间运行工作，只需启动一次，并在启用自动完成唤醒且命令产生输出或失败时依赖它。
- 如果自动完成唤醒不可用，或者您需要对无输出干净退出的命令进行安静成功确认，请使用 `process` 来确认完成。
- 不要使用 `sleep` 循环或重复轮询来模拟提醒或延迟跟进；请使用 cron 处理将来的工作。

## 子进程桥接

当在 exec/process 工具之外生成长时间运行的子进程时（例如，CLI 重启或 Gateway 辅助程序），附加子进程桥接辅助程序，以便转发终止信号并在退出/错误时分离监听器。这避免了 systemd 上的孤立进程，并保持跨平台的一致关闭行为。

环境变量覆盖：

- `PI_BASH_YIELD_MS`：默认 yield（毫秒）
- `PI_BASH_MAX_OUTPUT_CHARS`：内存输出上限（字符）
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`：每个流的待处理 stdout/stderr 上限（字符）
- `PI_BASH_JOB_TTL_MS`：已完成 Session 的 TTL（毫秒，限制为 1 分钟–3 小时）
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`：在将可写后台 Session 标记为可能正在等待输入之前的空闲输出阈值（默认 15000 毫秒）

配置（推荐）：

- `tools.exec.backgroundMs`（默认 10000）
- `tools.exec.timeoutSec`（默认 1800）
- `tools.exec.cleanupMs`（默认 1800000）
- `tools.exec.notifyOnExit`（默认 true）：当后台 exec 退出时，将系统事件加入队列并请求 heartbeat。
- `tools.exec.notifyOnExitEmptySuccess`（默认 false）：当为 true 时，也会为未产生输出的成功后台运行加入完成事件队列。

## process 工具

操作：

- `list`：运行中 + 已完成的 Session
- `poll`：排空 Session 的新输出（同时报告退出状态）
- `log`：读取聚合输出（支持 `offset` + `limit`）
- `write`：发送 stdin（`data`，可选 `eof`）
- `send-keys`：向 PTY 支持的 Session 发送显式按键令牌或字节
- `submit`：向 PTY 支持的 Session 发送 Enter / 回车
- `paste`：发送字面文本，可选择包裹在括号粘贴模式中
- `kill`：终止后台 Session
- `clear`：从内存中删除已完成的 Session
- `remove`：如果正在运行则终止，否则如果已完成则清除

注意：

- 只有后台化的 Session 被列出/保留在内存中。
- Session 在进程重启时丢失（无磁盘持久化）。
- Session 日志仅在您运行 `process poll/log` 且工具结果被记录时才保存到聊天历史。
- `process` 的作用域为每个 Agent；它只能看到该 Agent 启动的 Session。
- 使用 `poll` / `log` 进行状态查看、日志查看、安静成功确认，或在自动完成唤醒不可用时进行完成确认。
- 在恢复交互式 CLI 之前使用 `log`，以便当前转录、stdin 状态和输入等待提示同时可见。
- 需要输入或干预时使用 `write` / `send-keys` / `submit` / `paste` / `kill`。
- `process list` 包含一个派生的 `name`（命令动词 + 目标），用于快速扫描。
- `process list`、`poll` 和 `log` 仅在 Session 仍有可写 stdin 且空闲时间超过输入等待阈值时才报告 `waitingForInput`。
- `process log` 使用基于行的 `offset`/`limit`。
- 当 `offset` 和 `limit` 都省略时，它返回最后 200 行并包含分页提示。
- 当提供 `offset` 而省略 `limit` 时，它从 `offset` 返回到末尾（不限制为 200）。
- 轮询用于按需状态查询，而非等待循环调度。如果工作应该稍后进行，请改用 cron。

## 示例

运行长任务并稍后轮询：

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

在发送输入前检查交互式 Session：

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

立即在后台启动：

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

发送 stdin：

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

发送 PTY 按键：

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

提交当前行：

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

粘贴字面文本：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## 相关

- [Exec 工具](/tools/exec)
- [Exec 审批](/tools/exec-approvals)
