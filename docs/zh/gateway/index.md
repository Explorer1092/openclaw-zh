---
mmh3_hash: "764d280a6ee8295c332c42c231be7f9e"
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
  <Card title="Secrets 管理" icon="key-round" href="/gateway/secrets">
    SecretRef 契约、运行时快照行为以及迁移/重载操作。
  </Card>
  <Card title="Secrets 计划契约" icon="shield-check" href="/gateway/secrets-plan-contract">
    确切的 `secrets apply` 目标/路径规则和仅引用 auth-profile 行为。
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

健康基线：`Runtime: running`、`Connectivity probe: ok` 以及与预期匹配的 `Capability: ...`。当您需要读范围 RPC 证明而不仅仅是可达性时，使用 `openclaw gateway status --require-rpc`。

  </Step>

  <Step title="验证 Channel 就绪">

```bash
openclaw channels status --probe
```

如果 Gateway 可达,此命令将运行实时每账户 Channel 探测和可选审计。如果 Gateway 不可达,CLI 将退回到仅配置的 Channel 摘要,而不是实时探测输出。

  </Step>
</Steps>

<Note>
Gateway 配置重载监视活动配置文件路径(从 profile/state 默认值解析,或在设置时为 `OPENCLAW_CONFIG_PATH`)。
默认模式为 `gateway.reload.mode="hybrid"`。
第一次成功加载后,正在运行的进程提供活动的内存配置快照;成功重载原子地交换该快照。
</Note>

## 运行时模型

- 一个始终在线的进程,用于路由、控制平面和 Channel 连接。
- 单个多路复用端口用于:
  - WebSocket 控制/RPC
  - HTTP API（OpenAI 兼容，`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - Control UI 和 hooks
- 默认绑定模式:`loopback`。
- 默认需要认证。共享密钥设置使用 `gateway.auth.token` / `gateway.auth.password`(或 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`),非 loopback 反向代理设置可以使用 `gateway.auth.mode: "trusted-proxy"`。

## OpenAI 兼容端点

OpenClaw 最高价值的兼容接口现在是:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

为什么这些端点重要:

- 大多数 Open WebUI、LobeChat 和 LibreChat 集成首先探测 `/v1/models`。
- 许多 RAG 和内存管道期望 `/v1/embeddings`。
- Agent 原生客户端越来越倾向于 `/v1/responses`。

规划说明:

- `/v1/models` 以 Agent 为先:返回 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>`。
- `openclaw/default` 是始终映射到已配置默认 Agent 的稳定别名。
- 当您想要后端 provider/model 覆盖时使用 `x-openclaw-model`;否则选定 Agent 的正常模型和嵌入设置保持控制。

所有这些都在主 Gateway 端口上运行,并使用与 Gateway HTTP API 其余部分相同的受信任操作员认证边界。

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
openclaw gateway status --deep   # 添加系统级服务扫描
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` 用于额外的服务发现（LaunchDaemon/systemd 系统单元/schtasks），而不是更深层的 RPC 健康探测。

## 多 Gateway(同一主机)

大多数安装应该每台机器运行一个 Gateway。单个 Gateway 可以托管多个 Agent 和 Channel。

只有当您故意想要隔离或 rescue bot 时才需要多个 Gateway。

有用的检查:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

预期结果:

- 当过期的 launchd/systemd/schtasks 安装仍然存在时,`gateway status --deep` 可以报告 `Other gateway-like services detected (best effort)` 并打印清理提示。
- 当多个目标响应时,`gateway probe` 可以警告 `multiple reachable gateways`。
- 如果这是有意为之,请为每个 Gateway 隔离端口、config/state 和工作区根目录。

详细设置:[/gateway/multiple-gateways](/gateway/multiple-gateways)。

## VoiceClaw 实时 Brain 端点

OpenClaw 在 `/voiceclaw/realtime` 暴露了一个 VoiceClaw 兼容的实时 WebSocket 端点。当 VoiceClaw 桌面客户端应该直接与实时 OpenClaw Brain 对话而不是通过单独的中继进程时，使用它。

该端点使用 Gemini Live 进行实时音频，并通过直接向 Gemini Live 公开 OpenClaw 工具来将 OpenClaw 作为 Brain 调用。工具调用立即返回 `working` 结果以保持语音轮次响应，然后 OpenClaw 异步执行实际工具并将结果注入回实时 Session。在 Gateway 进程环境中设置 `GEMINI_API_KEY`。如果启用了 Gateway 认证，桌面客户端在其第一条 `session.config` 消息中发送 Gateway token 或 password。

实时 Brain 访问运行拥有者授权的 OpenClaw Agent 命令。将 `gateway.auth.mode: "none"` 限制在仅回环的测试实例中。非本地实时 Brain 连接需要 Gateway 认证。

对于隔离的测试 Gateway，使用其自己的端口、配置和状态运行单独的实例：

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

然后将 VoiceClaw 配置为使用：

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## 远程访问

首选:Tailscale/VPN。
回退:SSH 隧道。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

然后客户端本地连接到 `ws://127.0.0.1:18789`。

<Warning>
SSH 隧道不绕过 Gateway 认证。对于共享密钥认证,客户端仍必须发送 `token`/`password`,即使通过隧道。对于身份承载模式,请求仍然必须满足该认证路径。
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

使用 `openclaw gateway restart` 进行重启。不要连锁使用 `openclaw gateway stop` 和 `openclaw gateway start`；在 macOS 上，`gateway stop` 会在停止之前有意禁用 LaunchAgent。

LaunchAgent 标签为 `ai.openclaw.gateway`（默认）或 `ai.openclaw.<profile>`（命名配置文件）。`openclaw doctor` 审计和修复服务配置漂移。

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

需要自定义安装路径时的手动用户单元示例:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

原生 Windows 托管启动使用名为 `OpenClaw Gateway`(或 `OpenClaw Gateway (<profile>)` 用于命名配置文件)的计划任务。如果计划任务创建被拒绝,OpenClaw 将退回到指向 state 目录中 `gateway.cmd` 的每用户 Startup 文件夹启动器。

  </Tab>

  <Tab title="Linux (system service)">

为多用户/始终在线主机使用系统单元。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

使用与用户单元相同的服务主体,但将其安装在 `/etc/systemd/system/openclaw-gateway[-<profile>].service` 下,如果您的 `openclaw` 二进制文件在其他地方,请调整 `ExecStart=`。

  </Tab>
</Tabs>

## Dev profile 快速路径

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

默认值包括隔离的 state/config 和基础 Gateway 端口 `19001`。

## 协议快速参考(操作员视图)

- 第一个客户端帧必须是 `connect`。
- Gateway 返回 `hello-ok` 快照(`presence`、`health`、`stateVersion`、`uptimeMs`、限制/策略)。
- `hello-ok.features.methods` / `events` 是保守的发现列表,不是每个可调用的辅助路由的生成转储。
- 请求:`req(method, params)` → `res(ok/payload|error)`。
- 常见事件包括 `connect.challenge`、`agent`、`chat`、`session.message`、`session.tool`、`sessions.changed`、`presence`、`tick`、`health`、`heartbeat`、配对/审批生命周期事件和 `shutdown`。

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
| `refusing to bind gateway ... without auth`                    | 非 loopback 绑定而没有有效的 Gateway 认证路径          |
| `another gateway instance is already listening` / `EADDRINUSE` | 端口冲突                                               |
| `Gateway start blocked: set gateway.mode=local`                | 配置设置为远程模式,或本地模式标记从损坏的配置中丢失    |
| `unauthorized` 在连接期间                                      | 客户端和 Gateway 之间的认证不匹配                      |

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

## 相关

- [配置](/gateway/configuration)
- [Gateway 故障排除](/gateway/troubleshooting)
- [远程访问](/gateway/remote)
- [Secrets 管理](/gateway/secrets)
