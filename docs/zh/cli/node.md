---
mmh3_hash: "a50c01dd561f84a142bb4e2158d17141"
title: "`openclaw node`"
summary: "`openclaw node` 的 CLI 参考(无头 Node 主机)"
read_when:
  - 运行无头 Node 主机
  - 为 system.run 配对非 macOS Node
---

# `openclaw node`

运行连接到 Gateway WebSocket 并在此机器上公开
`system.run` / `system.which` 的**无头 Node 主机**。

## 为什么使用 Node 主机?

当您希望 Agent 在您的网络中的其他机器上**运行命令**而不在那里安装完整的 macOS 伴侣应用时,请使用 Node 主机。

常见用例:

- 在远程 Linux/Windows 机器上运行命令(构建服务器、实验室机器、NAS)。
- 在 Gateway 上保持 exec **沙盒化**,但将批准的运行委托给其他主机。
- 为自动化或 CI Node 提供轻量级、无头执行目标。

执行仍受 Node 主机上的**exec 批准**和每个 Agent 允许列表的保护,因此您可以保持命令访问范围和明确性。

## 浏览器代理(零配置)

如果 Node 上未禁用 `browser.enabled`,Node 主机会自动公布浏览器代理。这允许 Agent 在该 Node 上使用浏览器自动化,而无需额外配置。

如果需要,在 Node 上禁用它:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## 运行(前台)

```bash
openclaw node run --host <gateway-host> --port 18789
```

选项:

- `--host <host>`:Gateway WebSocket 主机(默认:`127.0.0.1`)
- `--port <port>`:Gateway WebSocket 端口(默认:`18789`)
- `--tls`:为 Gateway 连接使用 TLS
- `--tls-fingerprint <sha256>`:预期的 TLS 证书指纹(sha256)
- `--node-id <id>`:覆盖 Node ID(清除配对令牌)
- `--display-name <name>`:覆盖 Node 显示名称

## Node 主机的 Gateway 身份验证

`openclaw node run` 和 `openclaw node install` 从配置/环境变量解析 Gateway 身份验证(node 命令上没有 `--token`/`--password` 标志):

- 首先检查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 然后本地配置回退:`gateway.auth.token` / `gateway.auth.password`。
- 在本地模式下,当 `gateway.auth.*` 未设置时,`gateway.remote.token` / `gateway.remote.password` 也可用作回退。
- 在 `gateway.mode=remote` 模式下,远程客户端字段(`gateway.remote.token` / `gateway.remote.password`)也按远程优先规则可用。
- 遗留的 `CLAWDBOT_GATEWAY_*` 环境变量对 Node 主机身份验证解析被忽略。

## 服务(后台)

将无头 Node 主机安装为用户服务。

```bash
openclaw node install --host <gateway-host> --port 18789
```

选项:

- `--host <host>`:Gateway WebSocket 主机(默认:`127.0.0.1`)
- `--port <port>`:Gateway WebSocket 端口(默认:`18789`)
- `--tls`:为 Gateway 连接使用 TLS
- `--tls-fingerprint <sha256>`:预期的 TLS 证书指纹(sha256)
- `--node-id <id>`:覆盖 Node ID(清除配对令牌)
- `--display-name <name>`:覆盖 Node 显示名称
- `--runtime <runtime>`:服务运行时(`node` 或 `bun`)
- `--force`:如果已安装则重新安装/覆盖

管理服务:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

使用 `openclaw node run` 进行前台 Node 主机(无服务)。

服务命令接受 `--json` 用于机器可读输出。

## 配对

第一次连接在 Gateway 上创建待处理的设备配对请求(`role: node`)。
通过以下方式批准它:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Node 主机将其 Node ID、令牌、显示名称和 Gateway 连接信息存储在
`~/.openclaw/node.json` 中。

## Exec 批准

`system.run` 受本地 exec 批准的限制:

- `~/.openclaw/exec-approvals.json`
- [Exec 批准](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`(从 Gateway 编辑)
