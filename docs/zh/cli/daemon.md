---
mmh3_hash: "1cf33efb721c9f270d286ea3209c05a6"
title: "daemon"
summary: "`openclaw daemon` 的 CLI 参考（Gateway 服务管理的旧版别名）"
read_when:
  - 脚本中仍在使用 `openclaw daemon ...`
  - 需要服务生命周期命令（install/start/stop/restart/status）
---

# `openclaw daemon`

Gateway 服务管理命令的旧版别名。

`openclaw daemon ...` 与 `openclaw gateway ...` 服务命令具有相同的服务控制功能。

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

- `status`：显示服务安装状态并探测 Gateway 健康状态
- `install`：安装服务（`launchd`/`systemd`/`schtasks`）
- `uninstall`：移除服务
- `start`：启动服务
- `stop`：停止服务
- `restart`：重启服务

## 常用选项

- `status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
- `install`：`--port`、`--runtime <node|bun>`、`--token`、`--force`、`--json`
- 生命周期（`uninstall|start|stop|restart`）：`--json`

注意:

- `status` 在可能的情况下解析已配置的身份验证 SecretRef 用于探测身份验证。
- 如果所需的身份验证 SecretRef 在此命令路径中未解析,当探测连接/身份验证失败时 `daemon status --json` 报告 `rpc.authWarning`;请显式传递 `--token`/`--password` 或先解析密钥源。
- 如果探测成功,未解析的身份验证引用警告将被抑制,以避免误报。
- 在 Linux systemd 安装中,`status` 令牌漂移检查包括 `Environment=` 和 `EnvironmentFile=` 单元来源。
- 当令牌身份验证需要令牌且 `gateway.auth.token` 由 SecretRef 管理时,`install` 会验证 SecretRef 是否可解析,但不会将已解析的令牌持久化到服务环境元数据中。
- 如果令牌身份验证需要令牌且配置的令牌 SecretRef 未解析,安装将失败关闭。
- 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置且 `gateway.auth.mode` 未设置,安装将被阻止直到明确设置模式。

## 推荐

请使用 [`openclaw gateway`](/cli/gateway) 查看当前文档和示例。
