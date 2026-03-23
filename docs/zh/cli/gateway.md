---
mmh3_hash: "484c34292a793b1ff49b64b85dce38de"
title: "Gateway CLI"
sidebarTitle: "Gateway CLI"
summary: "OpenClaw Gateway CLI(`openclaw gateway`) — 运行、查询和发现 Gateway"
read_when:
  - 从 CLI 运行 Gateway(开发或服务器)
  - 调试 Gateway 身份验证、绑定模式和连接性
  - 通过 Bonjour 发现 Gateway(LAN + tailnet)
---

# Gateway CLI

Gateway 是 OpenClaw 的 WebSocket 服务器(Channel、Node、Session、Hook)。

本页中的子命令位于 `openclaw gateway …` 下。

相关文档:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## 运行 Gateway

运行本地 Gateway 进程:

```bash
openclaw gateway
```

前台别名:

```bash
openclaw gateway run
```

注意:

- 默认情况下,除非在 `~/.openclaw/openclaw.json` 中设置了 `gateway.mode=local`,否则 Gateway 拒绝启动。使用 `--allow-unconfigured` 进行临时/开发运行。
- 没有身份验证的绑定超出回环被阻止(安全护栏)。
- `SIGUSR1` 在授权时触发进程内重启(`commands.restart` 默认启用;设置 `commands.restart: false` 以阻止手动重启,同时 Gateway 工具/配置应用/更新仍然允许)。
- `SIGINT`/`SIGTERM` 处理程序停止 Gateway 进程,但它们不会恢复任何自定义终端状态。如果您使用 TUI 或原始模式输入包装 CLI,请在退出前恢复终端。

### 选项

- `--port <port>`:WebSocket 端口(默认来自配置/环境;通常为 `18789`)。
- `--bind <loopback|lan|tailnet|auto|custom>`:监听器绑定模式。
- `--auth <token|password>`:身份验证模式覆盖。
- `--token <token>`:令牌覆盖(同时为进程设置 `OPENCLAW_GATEWAY_TOKEN`)。
- `--password <password>`:密码覆盖。警告:内联密码可能在本地进程列表中暴露。
- `--password-file <path>`:从文件读取 Gateway 密码。
- `--tailscale <off|serve|funnel>`:通过 Tailscale 公开 Gateway。
- `--tailscale-reset-on-exit`:关闭时重置 Tailscale serve/funnel 配置。
- `--allow-unconfigured`:允许在配置中没有 `gateway.mode=local` 的情况下启动 Gateway。
- `--dev`:如果缺少,则创建开发配置 + 工作区(跳过 BOOTSTRAP.md)。
- `--reset`:重置开发配置 + 凭据 + Session + 工作区(需要 `--dev`)。
- `--force`:在启动前杀死所选端口上的任何现有监听器。
- `--verbose`:详细日志。
- `--claude-cli-logs`:仅在控制台中显示 claude-cli 日志(并启用其 stdout/stderr)。
- `--ws-log <auto|full|compact>`:websocket 日志样式(默认 `auto`)。
- `--compact`:`--ws-log compact` 的别名。
- `--raw-stream`:将原始模型流事件记录到 jsonl。
- `--raw-stream-path <path>`:原始流 jsonl 路径。

## 查询正在运行的 Gateway

所有查询命令使用 WebSocket RPC。

输出模式:

- 默认:人类可读(在 TTY 中有颜色)。
- `--json`:机器可读的 JSON(无样式/旋转器)。
- `--no-color`(或 `NO_COLOR=1`):禁用 ANSI,同时保持人类布局。

共享选项(在支持的地方):

- `--url <url>`:Gateway WebSocket URL。
- `--token <token>`:Gateway 令牌。
- `--password <password>`:Gateway 密码。
- `--timeout <ms>`:超时/预算(每个命令不同)。
- `--expect-final`:等待"最终"响应(Agent 调用)。

注意:当您设置 `--url` 时,CLI 不会回退到配置或环境凭据。显式传递 `--token` 或 `--password`。缺少显式凭据会导致错误。

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway status`

`gateway status` 显示 Gateway 服务(launchd/systemd/schtasks)加上可选的 RPC 探测。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

选项:

- `--url <url>`:覆盖探测 URL。
- `--token <token>`:探测的令牌身份验证。
- `--password <password>`:探测的密码身份验证。
- `--timeout <ms>`:探测超时(默认 `10000`)。
- `--no-probe`:跳过 RPC 探测(仅服务视图)。
- `--deep`:也扫描系统级服务。
- `--require-rpc`:当 RPC 探测失败时以非零值退出。不能与 `--no-probe` 组合使用。

注意:

- `gateway status` 在可能的情况下解析已配置的身份验证 SecretRef 用于探测身份验证。
- 如果所需的身份验证 SecretRef 在此命令路径中未解析,当探测连接/身份验证失败时 `gateway status --json` 报告 `rpc.authWarning`;请显式传递 `--token`/`--password` 或先解析密钥源。
- 如果探测成功,未解析的身份验证引用警告将被抑制,以避免误报。
- 在脚本和自动化中需要监听服务还不够而需要 Gateway RPC 本身健康时,使用 `--require-rpc`。
- 在 Linux systemd 安装中,服务身份验证漂移检查从单元读取 `Environment=` 和 `EnvironmentFile=` 值(包括 `%h`、带引号的路径、多个文件和可选的 `-` 文件)。

### `gateway probe`

`gateway probe` 是"调试所有内容"命令。它总是探测:

- 您配置的远程 Gateway(如果已设置),以及
- localhost(回环)**即使配置了远程**。

如果多个 Gateway 可达,它会打印所有 Gateway。当您使用隔离的配置文件/端口(例如,救援机器人)时,支持多个 Gateway,但大多数安装仍运行单个 Gateway。

```bash
openclaw gateway probe
openclaw gateway probe --json
```

解读:

- `Reachable: yes` 表示至少一个目标接受了 WebSocket 连接。
- `RPC: ok` 表示详细的 RPC 调用(`health`/`status`/`system-presence`/`config.get`)也成功了。
- `RPC: limited - missing scope: operator.read` 表示连接成功,但详细 RPC 受范围限制。这被报告为**降级**的可达性,而非完全失败。
- 仅当没有探测目标可达时退出代码才非零。

JSON 说明(`--json`):

- 顶层:
  - `ok`:至少一个目标可达。
  - `degraded`:至少一个目标的详细 RPC 受范围限制。
- 每个目标(`targets[].connect`):
  - `ok`:连接后的可达性 + 降级分类。
  - `rpcOk`:完整详细 RPC 成功。
  - `scopeLimited`:详细 RPC 因缺少 operator 范围而失败。

#### 通过 SSH 的远程(Mac 应用对等)

macOS 应用的"通过 SSH 的远程"模式使用本地端口转发,因此远程 Gateway(可能仅绑定到回环)在 `ws://127.0.0.1:<port>` 处变得可达。

CLI 等效:

```bash
openclaw gateway probe --ssh user@gateway-host
```

选项:

- `--ssh <target>`:`user@host` 或 `user@host:port`(端口默认为 `22`)。
- `--ssh-identity <path>`:身份文件。
- `--ssh-auto`:选择第一个发现的 Gateway 主机作为 SSH 目标(仅限 LAN/WAB)。

配置(可选,用作默认值):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低级 RPC 助手。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

## 管理 Gateway 服务

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

注意:

- `gateway install` 支持 `--port`、`--runtime`、`--token`、`--force`、`--json`。
- 当令牌身份验证需要令牌且 `gateway.auth.token` 由 SecretRef 管理时,`gateway install` 会验证 SecretRef 是否可解析,但不会将已解析的令牌持久化到服务环境元数据中。
- 如果令牌身份验证需要令牌且配置的令牌 SecretRef 未解析,安装将失败关闭而不是持久化回退的明文。
- 对于 `gateway run` 的密码身份验证,优先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file` 或 SecretRef 支持的 `gateway.auth.password`,而非内联 `--password`。
- 在推断身份验证模式下,仅 shell 的 `OPENCLAW_GATEWAY_PASSWORD` 不会放宽安装令牌要求;安装托管服务时请使用持久配置(`gateway.auth.password` 或配置 `env`)。
- 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置且 `gateway.auth.mode` 未设置,安装将被阻止直到明确设置模式。
- 生命周期命令接受 `--json` 用于脚本编写。

## 发现 Gateway(Bonjour)

`gateway discover` 扫描 Gateway 信标(`_openclaw-gw._tcp`)。

- 多播 DNS-SD:`local.`
- 单播 DNS-SD(广域 Bonjour):选择一个域(示例:`openclaw.internal.`)并设置拆分 DNS + DNS 服务器;参见 [/gateway/bonjour](/gateway/bonjour)

只有启用了 Bonjour 发现(默认)的 Gateway 才会公布信标。

广域发现记录包括(TXT):

- `role`(Gateway 角色提示)
- `transport`(传输提示,例如 `gateway`)
- `gatewayPort`(WebSocket 端口,通常为 `18789`)
- `sshPort`(SSH 端口;如果不存在,默认为 `22`)
- `tailnetDns`(MagicDNS 主机名,如果可用)
- `gatewayTls` / `gatewayTlsSha256`(启用 TLS + 证书指纹)
- `cliPath`(远程安装的可选提示)

### `gateway discover`

```bash
openclaw gateway discover
```

选项:

- `--timeout <ms>`:每个命令超时(浏览/解析);默认 `2000`。
- `--json`:机器可读输出(也禁用样式/旋转器)。

示例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```
