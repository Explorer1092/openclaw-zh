---
mmh3_hash: "8c8cf440b1366e75dec8f7454b63dfa9"
summary: "Gateway 服务、生命周期和操作手册"
read_when:
  - 运行或调试 Gateway 进程
title: "Gateway 服务手册"
---

# Gateway 服务手册

使用此页面进行 Gateway 服务的第一天启动和第二天操作。

<CardGroup cols={2}>
  <Card title="深度故障排除" icon="siren" href="/gateway/troubleshooting">
    基于症状的诊断,包含确切的命令梯度和日志特征。
  </Card>
  <Card title="配置" icon="sliders" href="/gateway/configuration">
    面向任务的设置指南 + 完整配置参考。
  </Card>
</CardGroup>

## 5 分钟本地启动

<Steps>
  <Step title="启动 Gateway">

```bash
openclaw gateway --port 18789
# debug/trace 镜像到 stdio
openclaw gateway --port 18789 --verbose
# 强制终止所选端口上的监听器,然后启动
openclaw gateway --force
```

  </Step>

  <Step title="验证服务健康">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

健康基线:`Runtime: running` 和 `RPC probe: ok`。

  </Step>

  <Step title="验证 Channel 就绪">

```bash
openclaw channels status --probe
```

  </Step>
</Steps>

<Note>
Gateway 配置重载监视活动配置文件路径(从 profile/state 默认值解析,或在设置时为 `OPENCLAW_CONFIG_PATH`)。
默认模式为 `gateway.reload.mode="hybrid"`。
</Note>

## 运行时模型

- 一个始终在线的进程,用于路由、控制平面和 Channel 连接。
- 单个多路复用端口用于:
  - WebSocket 控制/RPC
  - HTTP API(OpenAI 兼容、Responses、tools invoke)
  - Control UI 和 hooks
- 默认绑定模式:`loopback`。
- 默认需要认证(`gateway.auth.token` / `gateway.auth.password`,或 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)。

### 端口和绑定优先级

| 设置       | 解析顺序                                                      |
| ---------- | ------------------------------------------------------------- |
| Gateway 端口 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| 绑定模式     | CLI/覆盖 → `gateway.bind` → `loopback`                        |

### 热重载模式

| `gateway.reload.mode` | 行为                              |
| --------------------- | --------------------------------- |
| `off`                 | 无配置重载                         |
| `hot`                 | 仅应用热安全的更改                  |
| `restart`             | 在需要重载的更改时重启              |
| `hybrid`(默认)        | 安全时热应用,需要时重启             |

## 操作员命令集

```bash
openclaw gateway status
openclaw gateway status --deep
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw logs --follow
openclaw doctor
```

## 远程访问

首选:Tailscale/VPN。
回退:SSH 隧道。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

然后客户端本地连接到 `ws://127.0.0.1:18789`。

<Warning>
如果配置了 Gateway 认证,客户端仍必须发送认证(`token`/`password`),即使通过 SSH 隧道也是如此。
</Warning>

参见:[Remote Gateway](/gateway/remote)、[Authentication](/gateway/authentication)、[Tailscale](/gateway/tailscale)。

## Supervision 和服务生命周期

为生产级可靠性使用受监督的运行。

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgent 标签为 `ai.openclaw.gateway`(默认)或 `ai.openclaw.<profile>`(命名配置文件)。`openclaw doctor` 审计和修复服务配置漂移。

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

为注销后的持久性启用 lingering:

```bash
sudo loginctl enable-linger <user>
```

  </Tab>

  <Tab title="Linux (system service)">

为多用户/始终在线主机使用系统单元。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

  </Tab>
</Tabs>

## 一台主机上的多个 Gateways

大多数设置应该运行 **一个** Gateway。
仅在严格隔离/冗余(例如 rescue profile)时使用多个。

每个实例的清单:

- 唯一的 `gateway.port`
- 唯一的 `OPENCLAW_CONFIG_PATH`
- 唯一的 `OPENCLAW_STATE_DIR`
- 唯一的 `agents.defaults.workspace`

示例:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

参见:[Multiple gateways](/gateway/multiple-gateways)。

### Dev profile 快速路径

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

默认值包括隔离的 state/config 和基础 Gateway 端口 `19001`。

## 协议快速参考(操作员视图)

- 第一个客户端帧必须是 `connect`。
- Gateway 返回 `hello-ok` 快照(`presence`、`health`、`stateVersion`、`uptimeMs`、限制/策略)。
- 请求:`req(method, params)` → `res(ok/payload|error)`。
- 常见事件:`connect.challenge`、`agent`、`chat`、`presence`、`tick`、`health`、`heartbeat`、`shutdown`。

Agent 运行分为两个阶段:

1. 立即接受确认(`status:"accepted"`)
2. 最终完成响应(`status:"ok"|"error"`),中间有流式 `agent` 事件。

参见完整协议文档:[Gateway Protocol](/gateway/protocol)。

## 操作检查

### 活跃度

- 打开 WS 并发送 `connect`。
- 期望 `hello-ok` 响应带快照。

### 就绪度

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### 间隙恢复

事件不会重放。在序列间隙时,在继续之前刷新状态(`health`、`system-presence`)。

## 常见故障特征

| 特征                                                           | 可能的问题                           |
| -------------------------------------------------------------- | ------------------------------------ |
| `refusing to bind gateway ... without auth`                    | 非 loopback 绑定而没有 token/password |
| `another gateway instance is already listening` / `EADDRINUSE` | 端口冲突                             |
| `Gateway start blocked: set gateway.mode=local`                | 配置设置为远程模式                   |
| `unauthorized` 在连接期间                                      | 客户端和 Gateway 之间的认证不匹配    |

完整诊断梯度,请使用 [Gateway Troubleshooting](/gateway/troubleshooting)。

## 安全保证

- Gateway 协议客户端在 Gateway 不可用时快速失败(无隐式直接 Channel 回退)。
- 无效/非连接第一帧被拒绝并关闭。
- 优雅关闭在 socket 关闭前发出 `shutdown` 事件。

---

相关:

- [Troubleshooting](/gateway/troubleshooting)
- [Background Process](/gateway/background-process)
- [Configuration](/gateway/configuration)
- [Health](/gateway/health)
- [Doctor](/gateway/doctor)
- [Authentication](/gateway/authentication)
