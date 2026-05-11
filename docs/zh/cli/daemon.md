---
mmh3_hash: "6b6c54f40992a29c1b5df860d50668ac"
summary: "`openclaw daemon` 的 CLI 参考（Gateway 服务管理的旧版别名）"
read_when:
  - 您仍在脚本中使用 `openclaw daemon ...`
  - 您需要服务生命周期命令（install/start/stop/restart/status）
title: "Daemon"
---

# `openclaw daemon`

Gateway 服务管理命令的旧版别名。

`openclaw daemon ...` 映射到与 `openclaw gateway ...` 服务命令相同的服务控制界面。

## 用法

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## 子命令

- `status`：显示服务安装状态并探测 Gateway 健康状况
- `install`：安装服务（`launchd`/`systemd`/`schtasks`）
- `uninstall`：删除服务
- `start`：启动服务
- `stop`：停止服务
- `restart`：重启服务

## 常用选项

- `status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
- `install`：`--port`、`--runtime <node|bun>`、`--token`、`--force`、`--json`
- `restart`：`--safe`、`--skip-deferral`、`--force`、`--wait <duration>`、`--json`
- 生命周期（`uninstall|start|stop`）：`--json`

注意：

- `status` 在可能时为探测身份验证解析已配置的 auth SecretRef。
- 如果此命令路径中所需的 auth SecretRef 未解析，当探测连接性/身份验证失败时，`daemon status --json` 报告 `rpc.authWarning`；显式传递 `--token`/`--password` 或先解析密钥来源。
- 如果探测成功，未解析的 auth-ref 警告会被抑制以避免误报。
- `status --deep` 添加尽力而为的系统级服务扫描。当它找到其他类似 Gateway 的服务时，人类输出会打印清理提示并警告每台机器一个 Gateway 仍然是正常建议。
- `status --deep` 还以插件感知模式运行配置验证，并呈现已配置的插件清单警告（例如缺少 Channel 配置元数据），以便安装和更新冒烟检查能发现它们。默认 `status` 保留跳过插件验证的快速只读路径。
- 在 Linux systemd 安装上，`status` token 漂移检查同时包含 `Environment=` 和 `EnvironmentFile=` 单元来源。
- 漂移检查使用合并的运行时 env 解析 `gateway.auth.token` SecretRef（服务命令 env 优先，然后是进程 env 回退）。
- 如果 token 身份验证未有效激活（显式的 `gateway.auth.mode` 为 `password`/`none`/`trusted-proxy`，或模式未设置且密码可以获胜且没有 token 候选可以获胜），token 漂移检查会跳过配置 token 解析。
- 当 token 身份验证需要 token 且 `gateway.auth.token` 是 SecretRef 管理的，`install` 验证 SecretRef 可解析，但不将已解析的 token 持久化到服务环境元数据中。
- 如果 token 身份验证需要 token 且配置的 token SecretRef 未解析，install 失败关闭。
- 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置且 `gateway.auth.mode` 未设置，install 被阻止直到明确设置模式。
- 在 macOS 上，`install` 保持 LaunchAgent plist 为拥有者专有，并通过仅拥有者文件和包装器加载管理的服务环境值，而不是将 API 密钥或 auth-profile env ref 序列化到 `EnvironmentVariables` 中。
- 如果您有意在一台主机上运行多个 Gateway，请隔离端口、配置/状态和工作区；请参阅 [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)。
- `restart --safe` 要求运行中的 Gateway 对活跃工作进行预检，并在活跃工作排空后安排一次合并的重启。普通 `restart` 保留现有的服务管理器行为；`--force` 仍然是立即覆盖路径。
- `restart --safe --skip-deferral` 运行 OpenClaw 感知的安全重启，但绕过活跃工作延迟门，因此即使报告了阻塞者，Gateway 也会立即发出重启。当卡住的任务运行固定了安全重启时的操作员逃生舱口；需要 `--safe`。

## 建议使用

使用 [`openclaw gateway`](/cli/gateway) 获取当前文档和示例。

## 相关

- [CLI 参考](/cli)
- [Gateway 手册](/gateway)
