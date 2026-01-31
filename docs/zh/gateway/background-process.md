---
mmh3_hash: "0285254caece79c711832773a2127710"
summary: "后台 exec 执行和进程管理"
read_when:
  - 添加或修改后台 exec 行为
  - 调试长时间运行的 exec 任务
---

# 后台 Exec + Process 工具

OpenClaw 通过 `exec` 工具运行 shell 命令,并在内存中保留长时间运行的任务。`process` 工具管理这些后台 sessions。

## exec 工具

关键参数:
- `command`(必需)
- `yieldMs`(默认 10000):在此延迟后自动后台化
- `background`(bool):立即后台化
- `timeout`(秒,默认 1800):在此超时后终止进程
- `elevated`(bool):如果启用/允许 elevated 模式,在主机上运行
- 需要真实的 TTY?设置 `pty: true`。
- `workdir`、`env`

行为:
- 前台运行直接返回输出。
- 当后台化(显式或超时)时,工具返回 `status: "running"` + `sessionId` 和一小段尾部输出。
- 输出保存在内存中,直到 session 被轮询或清除。
- 如果 `process` 工具被禁止,`exec` 同步运行并忽略 `yieldMs`/`background`。

## 子进程桥接

当在 exec/process 工具之外生成长时间运行的子进程时(例如,CLI 重启或 gateway 辅助程序),附加子进程桥接辅助程序,以便转发终止信号并在退出/错误时分离监听器。这避免了 systemd 上的孤立进程,并保持跨平台的一致关闭行为。

环境变量覆盖:
- `PI_BASH_YIELD_MS`:默认 yield(毫秒)
- `PI_BASH_MAX_OUTPUT_CHARS`:内存输出上限(字符)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`:每个流的待处理 stdout/stderr 上限(字符)
- `PI_BASH_JOB_TTL_MS`:已完成 sessions 的 TTL(毫秒,限制为 1 分钟–3 小时)

配置(推荐):
- `tools.exec.backgroundMs`(默认 10000)
- `tools.exec.timeoutSec`(默认 1800)
- `tools.exec.cleanupMs`(默认 1800000)
- `tools.exec.notifyOnExit`(默认 true):当后台 exec 退出时,将系统事件加入队列并请求 heartbeat。

## process 工具

操作:
- `list`:运行中 + 已完成的 sessions
- `poll`:排空 session 的新输出(同时报告退出状态)
- `log`:读取聚合输出(支持 `offset` + `limit`)
- `write`:发送 stdin(`data`,可选 `eof`)
- `kill`:终止后台 session
- `clear`:从内存中删除已完成的 session
- `remove`:如果正在运行则终止,否则如果已完成则清除

注意:
- 只有后台化的 sessions 被列出/保留在内存中。
- Sessions 在进程重启时丢失(无磁盘持久化)。
- Session 日志仅在您运行 `process poll/log` 且工具结果被记录时才保存到聊天历史。
- `process` 的作用域为每个 agent;它只能看到该 agent 启动的 sessions。
- `process list` 包含一个派生的 `name`(命令动词 + 目标),用于快速扫描。
- `process log` 使用基于行的 `offset`/`limit`(省略 `offset` 以获取最后 N 行)。

## 示例

运行长任务并稍后轮询:
```json
{"tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000}
```
```json
{"tool": "process", "action": "poll", "sessionId": "<id>"}
```

立即在后台启动:
```json
{"tool": "exec", "command": "npm run build", "background": true}
```

发送 stdin:
```json
{"tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n"}
```
