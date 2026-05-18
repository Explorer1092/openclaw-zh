---
mmh3_hash: "9530c4dcfa709d4ca226305cdc09acce"
summary: "`openclaw node` 的 CLI 参考（无头 Node 主机）"
read_when:
  - 运行无头 Node 主机
  - 为 system.run 配对非 macOS Node
title: "Node"
---

# `openclaw node`

运行连接到 Gateway WebSocket 并在此机器上公开 `system.run` / `system.which` 的**无头 Node 主机**。

## 为什么使用 Node 主机？

当您希望 Agent 在网络中的**其他机器上运行命令**，而无需在那里安装完整的 macOS 伴随应用时，请使用 Node 主机。

常见使用场景：

- 在远程 Linux/Windows 机器（构建服务器、实验室机器、NAS）上运行命令。
- 在 Gateway 上保持 exec **沙箱**，但将批准的运行委托给其他主机。
- 为自动化或 CI Node 提供轻量级无头执行目标。

执行仍由 Node 主机上的 **exec 审批**和每 Agent 允许列表保护，因此您可以将命令访问限制在明确的范围内。

## 浏览器代理（零配置）

如果在 Node 上未禁用 `browser.enabled`，Node 主机会自动通告浏览器代理。这使 Agent 可以在该 Node 上使用浏览器自动化，无需额外配置。

默认情况下，代理公开 Node 的普通浏览器配置文件界面。如果您设置 `nodeHost.browserProxy.allowProfiles`，代理将变为限制性的：非允许列表的配置文件定向会被拒绝，持久配置文件创建/删除路由通过代理被阻止。

如需禁用，在 Node 上：

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## 运行（前台）

```bash
openclaw node run --host <gateway-host> --port 18789
```

选项：

- `--host <host>`：Gateway WebSocket 主机（默认：`127.0.0.1`）
- `--port <port>`：Gateway WebSocket 端口（默认：`18789`）
- `--tls`：对 Gateway 连接使用 TLS
- `--tls-fingerprint <sha256>`：预期的 TLS 证书指纹（sha256）
- `--node-id <id>`：覆盖 Node ID（清除配对令牌）
- `--display-name <name>`：覆盖 Node 显示名称

## Node 主机的 Gateway 身份验证

`openclaw node run` 和 `openclaw node install` 从配置/环境变量解析 Gateway 身份验证（Node 命令上没有 `--token`/`--password` 标志）：

- 首先检查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 然后是本地配置回退：`gateway.auth.token` / `gateway.auth.password`。
- 在本地模式下，Node 主机有意不继承 `gateway.remote.token` / `gateway.remote.password`。
- 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置且未解析，Node 身份验证解析关闭失败（无远程回退屏蔽）。
- 在 `gateway.mode=remote` 中，远程客户端字段（`gateway.remote.token` / `gateway.remote.password`）也根据远程优先级规则有资格。
- Node 主机身份验证解析仅处理 `OPENCLAW_GATEWAY_*` 环境变量。

对于连接到明文 `ws://` Gateway 的 Node，回环地址、私有 IP 字面量、`.local` 和 Tailnet `*.ts.net` 主机均被接受。对于其他可信私有 DNS 名称，请设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`；否则 Node 启动将关闭失败并要求使用 `wss://`、SSH 隧道或 Tailscale。
这是进程环境选项加入，而非 `openclaw.json` 配置键。
`openclaw node install` 在安装命令环境中存在时将其保留到受监督的 Node 服务中。

## 服务（后台）

将无头 Node 主机安装为用户服务。

```bash
openclaw node install --host <gateway-host> --port 18789
```

选项：

- `--host <host>`：Gateway WebSocket 主机（默认：`127.0.0.1`）
- `--port <port>`：Gateway WebSocket 端口（默认：`18789`）
- `--tls`：对 Gateway 连接使用 TLS
- `--tls-fingerprint <sha256>`：预期的 TLS 证书指纹（sha256）
- `--node-id <id>`：覆盖 Node ID（清除配对令牌）
- `--display-name <name>`：覆盖 Node 显示名称
- `--runtime <runtime>`：服务运行时（`node` 或 `bun`）
- `--force`：如果已安装，则重新安装/覆盖

管理服务：

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

使用 `openclaw node run` 在前台运行 Node 主机（无服务）。

服务命令接受 `--json` 进行机器可读输出。

Node 主机在进程内重试 Gateway 重启和网络关闭。如果 Gateway 报告终端令牌/密码/引导身份验证暂停，Node 主机记录关闭详情并以非零退出，以便 launchd/systemd 可以使用新配置和凭据重启它。需要配对的暂停保持在前台流程中，以便可以批准待处理的请求。

## 配对

第一次连接在 Gateway 上创建待处理的设备配对请求（`role: node`）。
通过以下方式批准：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

在严格控制的 Node 网络上，Gateway 操作员可以明确选择从可信 CIDR 自动批准首次 Node 配对：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

默认禁用。它仅适用于无请求范围的全新 `role: node` 配对。操作员/浏览器客户端、控制 UI、WebChat 以及角色、范围、元数据或公钥升级仍需要手动批准。

如果 Node 以更改的身份验证详细信息（角色/范围/公钥）重试配对，则先前的待处理请求将被取代，并创建新的 `requestId`。批准前再次运行 `openclaw devices list`。

Node 主机将其 Node ID、令牌、显示名称和 Gateway 连接信息存储在 `~/.openclaw/node.json` 中。

## Exec 审批

`system.run` 由本地 exec 审批保护：

- `~/.openclaw/exec-approvals.json`
- [Exec 审批](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（从 Gateway 编辑）

对于批准的异步 Node exec，OpenClaw 在提示之前准备规范的 `systemRunPlan`。后来批准的 `system.run` 转发会重用该存储的计划，因此在审批请求创建后对命令/工作目录/Session 字段的编辑会被拒绝，而不是更改 Node 执行的内容。

## 相关

- [CLI 参考](/cli)
- [Nodes](/nodes)
