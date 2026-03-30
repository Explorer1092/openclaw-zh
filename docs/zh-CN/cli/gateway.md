---
read_when:
  - 从 CLI 运行 Gateway 网关（开发或服务器）
  - 调试 Gateway 网关认证、绑定模式和连接性
  - 通过 Bonjour 发现 Gateway 网关（局域网 + tailnet）
summary: OpenClaw Gateway 网关 CLI（`openclaw gateway`）— 运行、查询和发现 Gateway 网关
title: gateway
x-i18n:
  generated_at: "2026-02-03T07:45:15Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: d1beb5e5e45c05d04bf6357a744fee3cc3309e390fe82a40af36c923c9e4d32b
  source_path: cli/gateway.md
  workflow: 15
---

# Gateway 网关 CLI

Gateway 网关是 OpenClaw 的 WebSocket 服务器（渠道、节点、会话、hooks）。

本页中的子命令位于 `openclaw gateway …` 下。

相关文档：

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## 运行 Gateway 网关

运行本地 Gateway 网关进程：

```bash
openclaw gateway
```

前台运行别名：

```bash
openclaw gateway run
```

注意事项：

- 默认情况下，除非在 `~/.openclaw/openclaw.json` 中设置了 `gateway.mode=local`，否则 Gateway 网关将拒绝启动。使用 `--allow-unconfigured` 进行临时/开发运行。
- 在没有认证的情况下绑定到 loopback 之外的地址会被阻止（安全护栏）。
- `SIGUSR1` 在授权时触发进程内重启（`commands.restart` 默认启用；设置 `commands.restart: false` 可阻止手动重启，同时 gateway 工具/config apply/update 仍允许）。
- `SIGINT`/`SIGTERM` 处理程序会停止 Gateway 网关进程，但不会恢复任何自定义终端状态。如果你用 TUI 或 raw-mode 输入包装 CLI，请在退出前恢复终端。

### 选项

- `--port <port>`：WebSocket 端口（默认来自配置/环境变量；通常为 `18789`）。
- `--bind <loopback|lan|tailnet|auto|custom>`：监听器绑定模式。
- `--auth <token|password>`：认证模式覆盖。
- `--token <token>`：令牌覆盖（同时为进程设置 `OPENCLAW_GATEWAY_TOKEN`）。
- `--password <password>`：密码覆盖。警告：内联密码可能在本地进程列表中暴露。
- `--password-file <path>`：从文件读取 Gateway 网关密码。
- `--tailscale <off|serve|funnel>`：通过 Tailscale 暴露 Gateway 网关。
- `--tailscale-reset-on-exit`：关闭时重置 Tailscale serve/funnel 配置。
- `--allow-unconfigured`：允许在配置中没有 `gateway.mode=local` 的情况下启动 Gateway 网关。
- `--dev`：如果缺失则创建开发配置 + 工作区（跳过 BOOTSTRAP.md）。
- `--reset`：重置开发配置 + 凭证 + 会话 + 工作区（需要 `--dev`）。
- `--force`：启动前杀死所选端口上的任何现有监听器。
- `--verbose`：详细日志。
- `--cli-backend-logs`：仅在控制台显示 CLI 后端日志（并启用其 stdout/stderr）。
- `--claude-cli-logs`：`--cli-backend-logs` 的弃用别名。
- `--ws-log <auto|full|compact>`：WebSocket 日志样式（默认 `auto`）。
- `--compact`：`--ws-log compact` 的别名。
- `--raw-stream`：将原始模型流事件记录到 jsonl。
- `--raw-stream-path <path>`：原始流 jsonl 路径。

## 查询运行中的 Gateway 网关

所有查询命令使用 WebSocket RPC。

输出模式：

- 默认：人类可读（TTY 中带颜色）。
- `--json`：机器可读 JSON（无样式/进度指示器）。
- `--no-color`（或 `NO_COLOR=1`）：禁用 ANSI 但保持人类可读布局。

共享选项（在支持的地方）：

- `--url <url>`：Gateway 网关 WebSocket URL。
- `--token <token>`：Gateway 网关令牌。
- `--password <password>`：Gateway 网关密码。
- `--timeout <ms>`：超时/预算（因命令而异）。
- `--expect-final`：等待"最终"响应（智能体调用）。

注意：当你设置 `--url` 时，CLI 不会回退到配置或环境凭证。请明确传递 `--token` 或 `--password`。缺少明确凭证是错误。

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway status`

`gateway status` 显示 Gateway 网关服务（launchd/systemd/schtasks）以及可选的 RPC 探测。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

选项：

- `--url <url>`：覆盖探测 URL。
- `--token <token>`：探测的令牌认证。
- `--password <password>`：探测的密码认证。
- `--timeout <ms>`：探测超时（默认 `10000`）。
- `--no-probe`：跳过 RPC 探测（仅服务视图）。
- `--deep`：也扫描系统级服务。
- `--require-rpc`：当 RPC 探测失败时以非零退出。不能与 `--no-probe` 组合使用。

注意事项：

- `gateway status` 在可能时解析已配置的认证 SecretRef 以用于探测认证。
- 如果必需的认证 SecretRef 在此命令路径中未解析，`gateway status --json` 会在探测连接/认证失败时报告 `rpc.authWarning`；请明确传递 `--token`/`--password` 或先解析密钥来源。
- 如果探测成功，未解析的认证 ref 警告会被抑制以避免误报。
- 在脚本和自动化中，当监听服务不够用且需要 Gateway 网关 RPC 本身健康时，请使用 `--require-rpc`。
- 在 Linux systemd 安装上，服务认证漂移检查会读取单元中的 `Environment=` 和 `EnvironmentFile=` 值（包括 `%h`、带引号的路径、多个文件和可选的 `-` 文件）。

### `gateway probe`

`gateway probe` 是"调试一切"命令。它始终探测：

- 你配置的远程 Gateway 网关（如果设置了），以及
- localhost（loopback）**即使配置了远程也会探测**。

如果多个 Gateway 网关可达，它会打印所有。当你使用隔离的配置文件/端口（例如救援机器人）时支持多个 Gateway 网关，但大多数安装仍然运行单个 Gateway 网关。

```bash
openclaw gateway probe
openclaw gateway probe --json
```

解读：

- `Reachable: yes` 表示至少一个目标接受了 WebSocket 连接。
- `RPC: ok` 表示详细 RPC 调用（`health`/`status`/`system-presence`/`config.get`）也成功。
- `RPC: limited - missing scope: operator.read` 表示连接成功，但详细 RPC 受到范围限制。这被报告为**降级**可达性，而非完全失败。
- 仅当没有探测目标可达时，退出码才非零。

JSON 注意事项（`--json`）：

- 顶层：
  - `ok`：至少一个目标可达。
  - `degraded`：至少一个目标的详细 RPC 受到范围限制。
- 每个目标（`targets[].connect`）：
  - `ok`：连接后的可达性及降级分类。
  - `rpcOk`：完整详细 RPC 成功。
  - `scopeLimited`：详细 RPC 因缺少 operator 范围而失败。

#### 通过 SSH 远程（Mac 应用对等）

macOS 应用的"通过 SSH 远程"模式使用本地端口转发，因此远程 Gateway 网关（可能仅绑定到 loopback）变得可以通过 `ws://127.0.0.1:<port>` 访问。

CLI 等效命令：

```bash
openclaw gateway probe --ssh user@gateway-host
```

选项：

- `--ssh <target>`：`user@host` 或 `user@host:port`（端口默认为 `22`）。
- `--ssh-identity <path>`：身份文件。
- `--ssh-auto`：选择第一个发现的 Gateway 网关主机作为 SSH 目标（仅限局域网/WAB）。

配置（可选，用作默认值）：

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低级 RPC 辅助工具。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

## 管理 Gateway 网关服务

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

注意事项：

- `gateway install` 支持 `--port`、`--runtime`、`--token`、`--force`、`--json`。
- 当令牌认证需要令牌且 `gateway.auth.token` 由 SecretRef 管理时，`gateway install` 会验证 SecretRef 是否可解析，但不会将已解析的令牌持久化到服务环境元数据中。
- 如果令牌认证需要令牌，而配置的令牌 SecretRef 未解析，安装会以封闭失败方式终止，而不是持久化回退明文。
- 对于 `gateway run` 的密码认证，建议优先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file` 或由 SecretRef 支持的 `gateway.auth.password`，而非内联 `--password`。
- 在推断认证模式下，仅 shell 的 `OPENCLAW_GATEWAY_PASSWORD` 不会放宽安装令牌要求；安装受管服务时请使用持久配置（`gateway.auth.password` 或 config `env`）。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，安装会被阻止，直到显式设置 mode。
- 生命周期命令接受 `--json` 用于脚本。

## 发现 Gateway 网关（Bonjour）

`gateway discover` 扫描 Gateway 网关信标（`_openclaw-gw._tcp`）。

- 组播 DNS-SD：`local.`
- 单播 DNS-SD（广域 Bonjour）：选择一个域（示例：`openclaw.internal.`）并设置分割 DNS + DNS 服务器；参见 [/gateway/bonjour](/gateway/bonjour)

只有启用了 Bonjour 发现（默认）的 Gateway 网关才会广播信标。

广域发现记录包括（TXT）：

- `role`（Gateway 网关角色提示）
- `transport`（传输提示，例如 `gateway`）
- `gatewayPort`（WebSocket 端口，通常为 `18789`）
- `sshPort`（SSH 端口；如果不存在则默认为 `22`）
- `tailnetDns`（MagicDNS 主机名，如果可用）
- `gatewayTls` / `gatewayTlsSha256`（TLS 启用 + 证书指纹）
- `cliPath`（远程安装的可选提示）

### `gateway discover`

```bash
openclaw gateway discover
```

选项：

- `--timeout <ms>`：每个命令的超时（浏览/解析）；默认 `2000`。
- `--json`：机器可读输出（同时禁用样式/进度指示器）。

示例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```
