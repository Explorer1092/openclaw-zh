---
title: "`openclaw node`"
mmh3_hash: "e23dcdfa2f09780867b6c0486b95e51d"
summary: "`openclaw node` 的 CLI 参考(无头Node主机)"
read_when:
  - 运行无头Node主机
  - 为 system.run 配对非 macOS Node
---

# `openclaw node`

运行连接到Gateway WebSocket 并在此机器上公开
`system.run` / `system.which` 的**无头Node主机**。

## 为什么使用Node主机?

当您希望Agent在您的网络中的其他机器上**运行命令**而不在那里安装完整的 macOS 伴侣应用时,请使用Node主机。

常见用例:
- 在远程 Linux/Windows 机器上运行命令(构建服务器、实验室机器、NAS)。
- 在Gateway上保持 exec **沙盒化**,但将批准的运行委托给其他主机。
- 为自动化或 CI Node提供轻量级、无头执行目标。

执行仍受Node主机上的**exec 批准**和每个Agent允许列表的保护,因此您可以保持命令访问范围和明确性。

## 浏览器Agent(零配置)

如果Node上未禁用 `browser.enabled`,Node主机会自动公布浏览器Agent。这允许Agent在该Node上使用浏览器自动化,而无需额外配置。

如果需要,在Node上禁用它:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false
    }
  }
}
```

## 运行(前台)

```bash
openclaw node run --host <gateway-host> --port 18789
```

选项:
- `--host <host>`:Gateway WebSocket 主机(默认:`127.0.0.1`)
- `--port <port>`:Gateway WebSocket 端口(默认:`18789`)
- `--tls`:为Gateway连接使用 TLS
- `--tls-fingerprint <sha256>`:预期的 TLS 证书指纹(sha256)
- `--node-id <id>`:覆盖Node ID(清除配对令牌)
- `--display-name <name>`:覆盖Node显示名称

## 服务(后台)

将无头Node主机安装为用户服务。

```bash
openclaw node install --host <gateway-host> --port 18789
```

选项:
- `--host <host>`:Gateway WebSocket 主机(默认:`127.0.0.1`)
- `--port <port>`:Gateway WebSocket 端口(默认:`18789`)
- `--tls`:为Gateway连接使用 TLS
- `--tls-fingerprint <sha256>`:预期的 TLS 证书指纹(sha256)
- `--node-id <id>`:覆盖Node ID(清除配对令牌)
- `--display-name <name>`:覆盖Node显示名称
- `--runtime <runtime>`:服务运行时(`node` 或 `bun`)
- `--force`:如果已安装则重新安装/覆盖

管理服务:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

使用 `openclaw node run` 进行前台Node主机(无服务)。

服务命令接受 `--json` 用于机器可读输出。

## 配对

第一次连接在Gateway上创建待处理的Node配对请求。
通过以下方式批准它:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Node主机将其Node ID、令牌、显示名称和Gateway连接信息存储在
`~/.openclaw/node.json` 中。

## Exec 批准

`system.run` 受本地 exec 批准的限制:

- `~/.openclaw/exec-approvals.json`
- [Exec 批准](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`(从Gateway编辑)
