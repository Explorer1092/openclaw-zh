---
mmh3_hash: "8ec679db1c04c6ccb9164e207e3f06e2"
summary: "OpenClaw Gateway CLI（`openclaw gateway`）— 运行、查询和发现 Gateway"
read_when:
  - 从 CLI 运行 Gateway（开发或服务器）
  - 调试 Gateway 身份验证、绑定模式和连接性
  - 通过 Bonjour 发现 Gateway（本地 + 广域 DNS-SD）
title: "Gateway"
sidebarTitle: "Gateway"
---

Gateway 是 OpenClaw 的 WebSocket 服务器（Channel、Node、Session、Hook）。本页中的子命令位于 `openclaw gateway …` 下。

<CardGroup cols={3}>
  <Card title="Bonjour 发现" href="/gateway/bonjour">
    本地 mDNS + 广域 DNS-SD 设置。
  </Card>
  <Card title="发现概述" href="/gateway/discovery">
    OpenClaw 如何通告和查找 Gateway。
  </Card>
  <Card title="配置" href="/gateway/configuration">
    顶层 Gateway 配置键。
  </Card>
</CardGroup>

## 运行 Gateway

运行本地 Gateway 进程：

```bash
openclaw gateway
```

前台别名：

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="启动行为">
    - 默认情况下，除非在 `~/.openclaw/openclaw.json` 中设置了 `gateway.mode=local`，否则 Gateway 拒绝启动。对于临时/开发运行，使用 `--allow-unconfigured`。
    - `openclaw onboard --mode local` 和 `openclaw setup` 应写入 `gateway.mode=local`。如果文件存在但 `gateway.mode` 缺失，请将其视为损坏或被覆盖的配置并修复它，而不是隐式假设本地模式。
    - 如果文件存在且 `gateway.mode` 缺失，Gateway 将其视为可疑的配置损坏并拒绝为您"猜测本地"。
    - 没有身份验证的情况下绑定到回环之外的地址被阻止（安全护栏）。
    - 当授权时（`commands.restart` 默认启用；设置 `commands.restart: false` 以阻止手动重启，同时仍允许 Gateway 工具/配置应用/更新），`SIGUSR1` 触发进程内重启。
    - `SIGINT`/`SIGTERM` 处理程序停止 Gateway 进程，但不恢复任何自定义终端状态。如果您用 TUI 或原始模式输入包装 CLI，请在退出前恢复终端。

  </Accordion>
</AccordionGroup>

### 选项

<ParamField path="--port <port>" type="number">
  WebSocket 端口（默认来自配置/env；通常为 `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  侦听器绑定模式。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  身份验证模式覆盖。
</ParamField>
<ParamField path="--token <token>" type="string">
  Token 覆盖（也为进程设置 `OPENCLAW_GATEWAY_TOKEN`）。
</ParamField>
<ParamField path="--password <password>" type="string">
  密码覆盖。
</ParamField>
<ParamField path="--password-file <path>" type="string">
  从文件读取 Gateway 密码。
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  通过 Tailscale 暴露 Gateway。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  关闭时重置 Tailscale serve/funnel 配置。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  允许在配置中没有 `gateway.mode=local` 的情况下启动 Gateway。仅为临时/开发引导绕过启动守卫；不写入或修复配置文件。
</ParamField>
<ParamField path="--dev" type="boolean">
  如果缺少则创建开发配置 + 工作区（跳过 BOOTSTRAP.md）。
</ParamField>
<ParamField path="--reset" type="boolean">
  重置开发配置 + 凭据 + Session + 工作区（需要 `--dev`）。
</ParamField>
<ParamField path="--force" type="boolean">
  在启动之前终止所选端口上的任何现有侦听器。
</ParamField>
<ParamField path="--verbose" type="boolean">
  详细日志。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  仅在控制台中显示 CLI 后端日志（并启用 stdout/stderr）。
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Websocket 日志样式。
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` 的别名。
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  将原始模型流事件记录到 jsonl。
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  原始流 jsonl 路径。
</ParamField>

## 重启 Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` 要求运行中的 Gateway 在重启之前对活跃的 OpenClaw 工作进行预检。如果排队的操作、回复传递、嵌入运行或任务运行处于活跃状态，Gateway 报告阻塞者，合并重复的安全重启请求，并在活跃工作排空后重启。普通 `restart` 保留现有的服务管理器行为以确保兼容性。仅当您明确想要立即覆盖路径时使用 `--force`。

`openclaw gateway restart --safe --skip-deferral` 运行与 `--safe` 相同的 OpenClaw 感知协调重启，但绕过活跃工作延迟门，因此即使报告了阻塞者，Gateway 也会立即发出重启。当卡住的任务运行已无限期固定延迟且单独使用 `--safe` 会无限等待时，将其用作操作员逃生舱口。`--skip-deferral` 需要 `--safe`。

<Warning>
内联 `--password` 可能在本地进程列表中暴露。建议使用 `--password-file`、env 或 SecretRef 支持的 `gateway.auth.password`。
</Warning>

### 启动分析

- 设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 以在 Gateway 启动期间记录阶段计时，包括每阶段 `eventLoopMax` 延迟以及已安装索引、清单注册表、启动规划和拥有者映射工作的插件查找表计时。
- 设置 `OPENCLAW_GATEWAY_RESTART_TRACE=1` 以记录重启范围的 `restart trace:` 行，涵盖重启信号处理、活跃工作排空、关闭阶段、下次启动、就绪计时和内存指标。
- 设置 `OPENCLAW_DIAGNOSTICS=timeline` 与 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` 以为外部 QA 运行环境写入尽力而为的 JSONL 启动诊断时间线。您也可以在配置中使用 `diagnostics.flags: ["timeline"]` 启用该标志；路径仍然由 env 提供。添加 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` 以包含事件循环样本。
- 运行 `pnpm test:startup:gateway -- --runs 5 --warmup 1` 以对 Gateway 启动进行基准测试。基准记录第一次进程输出、`/healthz`、`/readyz`、启动跟踪计时、事件循环延迟和插件查找表计时详情。

## 查询运行中的 Gateway

所有查询命令使用 WebSocket RPC。

<Tabs>
  <Tab title="输出模式">
    - 默认：人类可读（TTY 中带颜色）。
    - `--json`：机器可读 JSON（无样式/旋转器）。
    - `--no-color`（或 `NO_COLOR=1`）：禁用 ANSI 同时保持人类布局。

  </Tab>
  <Tab title="共享选项">
    - `--url <url>`：Gateway WebSocket URL。
    - `--token <token>`：Gateway token。
    - `--password <password>`：Gateway 密码。
    - `--timeout <ms>`：超时/预算（因命令而异）。
    - `--expect-final`：等待"最终"响应（Agent 调用）。

  </Tab>
</Tabs>

<Note>
当您设置 `--url` 时，CLI 不会回退到配置或环境凭据。显式传递 `--token` 或 `--password`。缺少显式凭据是错误。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` 端点是活性探测：它在服务器可以回答 HTTP 后返回。HTTP `/readyz` 端点更严格，在启动插件 sidecar、Channel 或已配置的 Hook 仍在稳定时保持红色。本地或经身份验证的详细就绪响应包含一个 `eventLoop` 诊断块，包含事件循环延迟、事件循环利用率、CPU 核心比率和 `degraded` 标志。

### `gateway usage-cost`

从 Session 日志获取使用成本摘要。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  要包含的天数。
</ParamField>

### `gateway stability`

从运行中的 Gateway 获取最近的诊断稳定性记录器。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  要包含的最近事件的最大数量（最大 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  按诊断事件类型过滤，如 `payload.large` 或 `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  仅包含诊断序列号之后的事件。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  读取持久化的稳定性包而不是调用运行中的 Gateway。使用 `--bundle latest`（或仅 `--bundle`）获取状态目录下最新的包，或直接传递包 JSON 路径。
</ParamField>
<ParamField path="--export" type="boolean">
  写入可共享的支持诊断 zip 而不是打印稳定性详情。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的输出路径。
</ParamField>

<AccordionGroup>
  <Accordion title="隐私和包行为">
    - 记录保留操作元数据：事件名称、计数、字节大小、内存读数、队列/Session 状态、Channel/插件名称和已编辑的 Session 摘要。它们不保留聊天文本、webhook 正文、工具输出、原始请求或响应正文、token、cookie、密钥值、主机名或原始 Session ID。设置 `diagnostics.enabled: false` 以完全禁用记录器。
    - 在 Gateway 致命退出、关闭超时和重启启动失败时，当记录器有事件时，OpenClaw 将相同的诊断快照写入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。使用 `openclaw gateway stability --bundle latest` 检查最新的包；`--limit`、`--type` 和 `--since-seq` 也适用于包输出。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

写入用于附加到错误报告的本地诊断 zip。有关隐私模型和包内容，请参阅 [Diagnostics Export](/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  输出 zip 路径。默认为状态目录下的支持导出。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  要包含的最大净化日志行数。
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  要检查的最大日志字节数。
</ParamField>
<ParamField path="--url <url>" type="string">
  健康快照的 Gateway WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  健康快照的 Gateway token。
</ParamField>
<ParamField path="--password <password>" type="string">
  健康快照的 Gateway 密码。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  状态/健康快照超时。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  跳过持久化的稳定性包查找。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 格式打印写入的路径、大小和清单。
</ParamField>

导出包含清单、Markdown 摘要、配置形状、净化的配置详情、净化的日志摘要、净化的 Gateway 状态/健康快照，以及存在时最新的稳定性包。

它旨在被共享。它保留有助于调试的操作详情，如安全的 OpenClaw 日志字段、子系统名称、状态码、持续时间、配置的模式、端口、插件 ID、Provider ID、非密钥功能设置和已编辑的操作日志消息。它省略或编辑聊天文本、webhook 正文、工具输出、凭据、cookie、账户/消息标识符、提示/指令文本、主机名和密钥值。当 LogTape 样式的消息看起来像用户/聊天/工具有效载荷文本时，导出仅保留消息被省略加上其字节计数。

### `gateway status`

`gateway status` 显示 Gateway 服务（launchd/systemd/schtasks）以及连接性/身份验证能力的可选探测。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  添加显式探测目标。配置的远程 + localhost 仍然被探测。
</ParamField>
<ParamField path="--token <token>" type="string">
  探测的 Token 身份验证。
</ParamField>
<ParamField path="--password <password>" type="string">
  探测的密码身份验证。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  探测超时。
</ParamField>
<ParamField path="--no-probe" type="boolean">
  跳过连接性探测（仅服务视图）。
</ParamField>
<ParamField path="--deep" type="boolean">
  也扫描系统级服务。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  将默认连接性探测升级为读取探测，并在该读取探测失败时以非零退出。不能与 `--no-probe` 组合使用。
</ParamField>

<AccordionGroup>
  <Accordion title="状态语义">
    - `gateway status` 即使在本地 CLI 配置缺失或无效时也可用于诊断。
    - 默认 `gateway status` 证明服务状态、WebSocket 连接和握手时可见的身份验证能力。它不证明读/写/管理操作。
    - 诊断探测对于首次设备身份验证是非修改的：当存在现有缓存的设备 token 时它们重用它，但它们不创建新的 CLI 设备身份或只读设备配对记录仅为了检查状态。
    - `gateway status` 在可能时为探测身份验证解析已配置的 auth SecretRef。
    - 如果此命令路径中所需的 auth SecretRef 未解析，当探测连接性/身份验证失败时，`gateway status --json` 报告 `rpc.authWarning`；显式传递 `--token`/`--password` 或先解析密钥来源。
    - 如果探测成功，未解析的 auth-ref 警告会被抑制以避免误报。
    - 在脚本和自动化中，当侦听服务不够且您需要读取范围的 RPC 调用也健康时，使用 `--require-rpc`。
    - `--deep` 为额外的 launchd/systemd/schtasks 安装添加尽力而为的扫描。当检测到多个类似 Gateway 的服务时，人类输出打印清理提示并警告大多数设置应每台机器运行一个 Gateway。
    - `--deep` 还报告服务进程干净退出进行外部监督器重启时的最近 Gateway 监督器重启移交。
    - `--deep` 以插件感知模式（`pluginValidation: "full"`）运行配置验证，并呈现已配置的插件清单警告（例如缺少 Channel 配置元数据），以便安装和更新冒烟检查能发现它们。默认 `gateway status` 保留跳过插件验证的快速只读路径。
    - 人类输出包括已解析的文件日志路径加上 CLI 与服务配置路径/有效性快照，以帮助诊断配置文件或状态目录漂移。

  </Accordion>
  <Accordion title="Linux systemd 身份验证漂移检查">
    - 在 Linux systemd 安装上，服务身份验证漂移检查从单元读取 `Environment=` 和 `EnvironmentFile=` 值（包括 `%h`、带引号的路径、多个文件和可选的 `-` 文件）。
    - 漂移检查使用合并的运行时 env 解析 `gateway.auth.token` SecretRef（服务命令 env 优先，然后是进程 env 回退）。
    - 如果 token 身份验证未有效激活（显式的 `gateway.auth.mode` 为 `password`/`none`/`trusted-proxy`，或模式未设置且密码可以获胜且没有 token 候选可以获胜），token 漂移检查会跳过配置 token 解析。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` 是"调试所有内容"的命令。它始终探测：

- 您配置的远程 Gateway（如果已设置），以及
- localhost（回环）**即使已配置远程**。

如果您传递 `--url`，该显式目标被添加到两者之前。人类输出将目标标记为：

- `URL (explicit)`
- `Remote (configured)` 或 `Remote (configured, inactive)`
- `Local loopback`

<Note>
如果多个 Gateway 可访问，它会打印所有这些。当您使用隔离的配置文件/端口（例如救援机器人）时支持多个 Gateway，但大多数安装仍然运行单个 Gateway。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="解释">
    - `Reachable: yes` 表示至少一个目标接受了 WebSocket 连接。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 报告探测可以证明的身份验证情况。它与可达性分开。
    - `Read probe: ok` 表示读取范围的详细 RPC 调用（`health`/`status`/`system-presence`/`config.get`）也成功了。
    - `Read probe: limited - missing scope: operator.read` 表示连接成功但读取范围的 RPC 受到限制。这被报告为**降级**可达性，而不是完全失败。
    - `Read probe: failed` 在 `Connect: ok` 之后表示 Gateway 接受了 WebSocket 连接，但后续读取诊断超时或失败。这也是**降级**可达性，而不是不可达的 Gateway。
    - 与 `gateway status` 一样，探测重用现有的缓存设备身份验证，但不创建首次设备身份或配对状态。
    - 仅在没有被探测的目标可访问时，退出码为非零。

  </Accordion>
  <Accordion title="JSON 输出">
    顶层：

    - `ok`：至少一个目标可访问。
    - `degraded`：至少一个目标接受了连接但未完成完整的详细 RPC 诊断。
    - `capability`：跨可访问目标看到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：按此顺序视为活跃获胜者的最佳目标：显式 URL、SSH 隧道、配置的远程，然后是本地回环。
    - `warnings[]`：带有 `code`、`message` 和可选 `targetIds` 的尽力而为的警告记录。
    - `network`：从当前配置和主机网络派生的本地回环/tailnet URL 提示。
    - `discovery.timeoutMs` 和 `discovery.count`：此探测轮次使用的实际发现预算/结果计数。

    每个目标（`targets[].connect`）：

    - `ok`：连接 + 降级分类后的可达性。
    - `rpcOk`：完整详细 RPC 成功。
    - `scopeLimited`：详细 RPC 因缺少 operator 范围而失败。

    每个目标（`targets[].auth`）：

    - `role`：当 `hello-ok` 中可用时报告的身份验证角色。
    - `scopes`：当 `hello-ok` 中可用时报告的授予范围。
    - `capability`：该目标的表面身份验证能力分类。

  </Accordion>
  <Accordion title="常见警告代码">
    - `ssh_tunnel_failed`：SSH 隧道设置失败；命令回退到直接探测。
    - `multiple_gateways`：多个目标可访问；这不寻常，除非您有意运行隔离的配置文件，如救援机器人。
    - `auth_secretref_unresolved`：无法为失败的目标解析已配置的 auth SecretRef。
    - `probe_scope_limited`：WebSocket 连接成功，但读取探测受到缺少 `operator.read` 的限制。

  </Accordion>
</AccordionGroup>

#### 通过 SSH 的远程（Mac 应用奇偶性）

macOS 应用"通过 SSH 的远程"模式使用本地端口转发，以便远程 Gateway（可能仅绑定到回环）在 `ws://127.0.0.1:<port>` 变得可访问。

CLI 等效：

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` 或 `user@host:port`（端口默认为 `22`）。
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  身份文件。
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  从已解析的发现端点（`local.` 加上已配置的广域域，如果有的话）中选取第一个发现的 Gateway 主机作为 SSH 目标。仅 TXT 的提示被忽略。
</ParamField>

配置（可选，用作默认值）：

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低级 RPC 助手。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  params 的 JSON 对象字符串。
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway token。
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway 密码。
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  超时预算。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主要用于在最终有效载荷之前流式传输中间事件的 Agent 样式 RPC。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读 JSON 输出。
</ParamField>

<Note>
`--params` 必须是有效的 JSON。
</Note>

## 管理 Gateway 服务

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### 使用包装器安装

当管理的服务必须通过另一个可执行文件启动时使用 `--wrapper`，例如密钥管理器 shim 或运行助手。包装器接收正常的 Gateway 参数，并负责最终以这些参数执行 `openclaw` 或 Node。

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

您也可以通过环境设置包装器。`gateway install` 验证路径是可执行文件，将包装器写入服务 `ProgramArguments`，并在服务环境中持久化 `OPENCLAW_WRAPPER` 以供后续强制重新安装、更新和 doctor 修复使用。

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

要删除持久化的包装器，请在重新安装时清除 `OPENCLAW_WRAPPER`：

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="命令选项">
    - `gateway status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
    - `gateway install`：`--port`、`--runtime <node|bun>`、`--token`、`--wrapper <path>`、`--force`、`--json`
    - `gateway restart`：`--safe`、`--skip-deferral`、`--force`、`--wait <duration>`、`--json`
    - `gateway uninstall|start`：`--json`
    - `gateway stop`：`--disable`、`--json`

  </Accordion>
  <Accordion title="生命周期行为">
    - 使用 `gateway restart` 重启管理的服务。不要将 `gateway stop` 和 `gateway start` 链接作为重启替代。
    - 在 macOS 上，`gateway stop` 默认使用 `launchctl bootout`，从当前引导会话中删除 LaunchAgent，而不持久化禁用——KeepAlive 自动恢复对未来崩溃保持活跃，`gateway start` 无需手动 `launchctl enable` 即可干净地重新启用。传递 `--disable` 以持久抑制 KeepAlive 和 RunAtLoad，使 Gateway 在下一次显式 `gateway start` 之前不会重新生成；当手动停止应该在重启或系统重启中存活时使用此功能。
    - `gateway restart --safe` 要求运行中的 Gateway 对活跃的 OpenClaw 工作进行预检，并延迟重启直到回复传递、嵌入运行和任务运行排空。`--safe` 不能与 `--force` 或 `--wait` 组合。
    - `gateway restart --wait 30s` 覆盖该重启的已配置重启排空预算。裸数字是毫秒；接受 `s`、`m` 和 `h` 等单位。`--wait 0` 无限等待。
    - `gateway restart --safe --skip-deferral` 运行 OpenClaw 感知的安全重启，但绕过延迟门，使 Gateway 即使在报告了阻塞者时也立即发出重启。当操作员已检查列出的任务阻塞者并希望现在恢复 Gateway 时的操作员逃生舱口；需要 `--safe`。
    - `gateway restart --force` 跳过活跃工作排空并立即重启。仅当操作员已检查列出的任务阻塞者并明确想要立即恢复 Gateway 时使用。
    - 生命周期命令接受 `--json` 用于脚本编写。

  </Accordion>
  <Accordion title="安装时的身份验证和 SecretRef">
    - 当 token 身份验证需要 token 且 `gateway.auth.token` 是 SecretRef 管理的，`gateway install` 验证 SecretRef 可解析但不将已解析的 token 持久化到服务环境元数据中。
    - 如果 token 身份验证需要 token 且配置的 token SecretRef 未解析，install 失败关闭，而不是持久化回退明文。
    - 对于 `gateway run` 上的密码身份验证，建议使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file` 或 SecretRef 支持的 `gateway.auth.password`，而不是内联 `--password`。
    - 在推断身份验证模式下，仅 shell 的 `OPENCLAW_GATEWAY_PASSWORD` 不会放宽安装 token 要求；在安装管理的服务时使用持久配置（`gateway.auth.password` 或配置 `env`）。
    - 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置且 `gateway.auth.mode` 未设置，install 被阻止直到明确设置模式。

  </Accordion>
</AccordionGroup>

## 发现 Gateway（Bonjour）

`gateway discover` 扫描 Gateway 信标（`_openclaw-gw._tcp`）。

- 多播 DNS-SD：`local.`
- 单播 DNS-SD（广域 Bonjour）：选择一个域（例如：`openclaw.internal.`）并设置分割 DNS + DNS 服务器；请参阅 [Bonjour](/gateway/bonjour)。

只有启用了 Bonjour 发现（默认）的 Gateway 才会通告信标。

广域发现记录包含（TXT）：

- `role`（Gateway 角色提示）
- `transport`（传输提示，例如 `gateway`）
- `gatewayPort`（WebSocket 端口，通常为 `18789`）
- `sshPort`（仅完整发现模式；缺席时客户端默认 SSH 目标为 `22`）
- `tailnetDns`（MagicDNS 主机名，如果可用）
- `gatewayTls` / `gatewayTlsSha256`（TLS 启用 + 证书指纹）
- `cliPath`（仅完整发现模式）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  每命令超时（浏览/解析）。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读输出（也禁用样式/旋转器）。
</ParamField>

示例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI 扫描 `local.` 加上配置了广域域时的已配置广域域。
- JSON 输出中的 `wsUrl` 来源于已解析的服务端点，而不是来自仅 TXT 的提示，如 `lanHost` 或 `tailnetDns`。
- 在 `local.` mDNS 和广域 DNS-SD 上，`sshPort` 和 `cliPath` 仅在 `discovery.mdns.mode` 为 `full` 时发布。

</Note>

## 相关

- [CLI 参考](/cli)
- [Gateway 手册](/gateway)
