---
title: "Gateway 服务手册"
mmh3_hash: "5da70948a6be6061083e310c2b2f7704"
summary: "Gateway 服务、生命周期和操作手册"
read_when:
  - 运行或调试 gateway 进程
---
# Gateway 服务手册

最后更新:2025-12-09

## 它是什么
- 始终在线的进程,拥有单个 Baileys/Telegram 连接和控制/事件平面。
- 替换旧版 `gateway` 命令。CLI 入口点:`openclaw gateway`。
- 运行直到停止;在致命错误时以非零退出,以便 supervisor 重启它。

## 如何运行(本地)
```bash
openclaw gateway --port 18789
# 获取 stdio 中的完整 debug/trace 日志:
openclaw gateway --port 18789 --verbose
# 如果端口繁忙,终止监听器然后启动:
openclaw gateway --force
# dev 循环(TS 更改时自动重新加载):
pnpm gateway:watch
```
- 配置热重载监视 `~/.openclaw/openclaw.json`(或 `OPENCLAW_CONFIG_PATH`)。
  - 默认模式:`gateway.reload.mode="hybrid"`(热应用安全更改,关键时重启)。
  - 热重载在需要时通过 **SIGUSR1** 使用进程内重启。
  - 使用 `gateway.reload.mode="off"` 禁用。
- 将 WebSocket 控制平面绑定到 `127.0.0.1:<port>`(默认 18789)。
- 同一端口还提供 HTTP(控制 UI、hooks、A2UI)。单端口多路复用。
  - OpenAI Chat Completions(HTTP):[`/v1/chat/completions`](/zh/gateway/openai-http-api)。
  - OpenResponses(HTTP):[`/v1/responses`](/zh/gateway/openresponses-http-api)。
  - Tools Invoke(HTTP):[`/tools/invoke`](/zh/gateway/tools-invoke-http-api)。
- 默认在 `canvasHost.port`(默认 `18793`)上启动 Canvas 文件服务器,从 `~/.openclaw/workspace/canvas` 提供 `http://<gateway-host>:18793/__openclaw__/canvas/`。使用 `canvasHost.enabled=false` 或 `OPENCLAW_SKIP_CANVAS_HOST=1` 禁用。
- 记录到 stdout;使用 launchd/systemd 保持活动并轮换日志。
- 传递 `--verbose` 在故障排除时将 debug 日志(握手、req/res、events)从日志文件镜像到 stdio。
- `--force` 使用 `lsof` 在所选端口上查找监听器,发送 SIGTERM,记录它杀死的内容,然后启动 gateway(如果缺少 `lsof` 则快速失败)。
- 如果在 supervisor 下运行(launchd/systemd/mac app 子进程模式),停止/重启通常发送 **SIGTERM**;较旧的构建可能将其显示为 `pnpm` `ELIFECYCLE` 退出代码 **143**(SIGTERM),这是正常关闭,而不是崩溃。
- **SIGUSR1** 在授权时触发进程内重启(gateway tool/config apply/update,或为手动重启启用 `commands.restart`)。
- 默认需要 Gateway 认证:设置 `gateway.auth.token`(或 `OPENCLAW_GATEWAY_TOKEN`)或 `gateway.auth.password`。客户端必须发送 `connect.params.auth.token/password`,除非使用 Tailscale Serve 身份。
- 向导现在默认生成令牌,即使在 loopback 上。
- 端口优先级:`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > 默认 `18789`。

## 远程访问
- 首选 Tailscale/VPN;否则 SSH 隧道:
  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@host
  ```
- 然后客户端通过隧道连接到 `ws://127.0.0.1:18789`。
- 如果配置了令牌,即使通过隧道,客户端也必须在 `connect.params.auth.token` 中包含它。

## 多个 gateways(同一主机)

通常不必要:一个 Gateway 可以服务多个消息 channels 和 agents。仅在冗余或严格隔离(例如:rescue bot)时使用多个 Gateways。

如果隔离状态 + 配置并使用唯一端口,则支持。完整指南:[Multiple gateways](/zh/gateway/multiple-gateways)。

服务名称具有配置文件感知:
- macOS:`bot.molt.<profile>`(旧版 `com.openclaw.*` 可能仍然存在)
- Linux:`openclaw-gateway-<profile>.service`
- Windows:`OpenClaw Gateway (<profile>)`

安装元数据嵌入在服务配置中:
- `OPENCLAW_SERVICE_MARKER=openclaw`
- `OPENCLAW_SERVICE_KIND=gateway`
- `OPENCLAW_SERVICE_VERSION=<version>`

Rescue-Bot 模式:保持第二个 Gateway 隔离,具有自己的配置文件、状态目录、workspace 和基础端口间距。完整指南:[Rescue-bot guide](/zh/gateway/multiple-gateways#rescue-bot-guide)。

### Dev 配置文件(`--dev`)

快速路径:运行完全隔离的 dev 实例(config/state/workspace),而不触及您的主要设置。

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
# 然后定位 dev 实例:
openclaw --dev status
openclaw --dev health
```

默认值(可以通过 env/flags/config 覆盖):
- `OPENCLAW_STATE_DIR=~/.openclaw-dev`
- `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
- `OPENCLAW_GATEWAY_PORT=19001`(Gateway WS + HTTP)
- browser control service port = `19003`(派生:`gateway.port+2`,仅 loopback)
- `canvasHost.port=19005`(派生:`gateway.port+4`)
- 当您在 `--dev` 下运行 `setup`/`onboard` 时,`agents.defaults.workspace` 默认变为 `~/.openclaw/workspace-dev`。

派生端口(经验法则):
- 基础端口 = `gateway.port`(或 `OPENCLAW_GATEWAY_PORT` / `--port`)
- browser control service port = base + 2(仅 loopback)
- `canvasHost.port = base + 4`(或 `OPENCLAW_CANVAS_HOST_PORT` / config 覆盖)
- Browser 配置文件 CDP 端口从 `browser.controlPort + 9 .. + 108` 自动分配(每个配置文件持久化)。

每个实例的清单:
- 唯一的 `gateway.port`
- 唯一的 `OPENCLAW_CONFIG_PATH`
- 唯一的 `OPENCLAW_STATE_DIR`
- 唯一的 `agents.defaults.workspace`
- 单独的 WhatsApp 号码(如果使用 WA)

每个配置文件的服务安装:
```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

示例:
```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

## 协议(操作员视图)
- 完整文档:[Gateway 协议](/zh/gateway/protocol) 和 [Bridge 协议(旧版)](/zh/gateway/bridge-protocol)。
- 客户端的强制第一帧:`req {type:"req", id, method:"connect", params:{minProtocol,maxProtocol,client:{id,displayName?,version,platform,deviceFamily?,modelIdentifier?,mode,instanceId?}, caps, auth?, locale?, userAgent? } }`。
- Gateway 回复 `res {type:"res", id, ok:true, payload:hello-ok }`(或 `ok:false` 带错误,然后关闭)。
- 握手后:
  - 请求:`{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - 事件:`{type:"event", event, payload, seq?, stateVersion?}`
- 结构化 presence 条目:`{host, ip, version, platform?, deviceFamily?, modelIdentifier?, mode, lastInputSeconds?, ts, reason?, tags?[], instanceId? }`(对于 WS 客户端,`instanceId` 来自 `connect.client.instanceId`)。
- `agent` 响应是两阶段的:首先 `res` ack `{runId,status:"accepted"}`,然后在运行完成后的最终 `res` `{runId,status:"ok"|"error",summary}`;流式输出作为 `event:"agent"` 到达。

## 方法(初始集)
- `health` — 完整健康快照(与 `openclaw health --json` 相同的形状)。
- `status` — 简短摘要。
- `system-presence` — 当前 presence 列表。
- `system-event` — 发布 presence/system 注释(结构化)。
- `send` — 通过活动 channel(s)发送消息。
- `agent` — 运行 agent 轮次(在同一连接上流回 events)。
- `node.list` — 列出配对 + 当前连接的节点(包括 `caps`、`deviceFamily`、`modelIdentifier`、`paired`、`connected` 和广播的 `commands`)。
- `node.describe` — 描述节点(功能 + 支持的 `node.invoke` 命令;适用于配对节点和当前连接的未配对节点)。
- `node.invoke` — 在节点上调用命令(例如 `canvas.*`、`camera.*`)。
- `node.pair.*` — 配对生命周期(`request`、`list`、`approve`、`reject`、`verify`)。

另请参见:[Presence](/zh/concepts/presence) 了解如何生成/去重 presence 以及为什么稳定的 `client.instanceId` 很重要。

## 事件
- `agent` — 来自 agent 运行的流式 tool/output events(seq 标记)。
- `presence` — presence 更新(带 stateVersion 的 deltas)推送到所有连接的客户端。
- `tick` — 周期性保活/无操作以确认活跃。
- `shutdown` — Gateway 正在退出;payload 包括 `reason` 和可选的 `restartExpectedMs`。客户端应重新连接。

## WebChat 集成
- WebChat 是一个原生 SwiftUI UI,直接与 Gateway WebSocket 对话以获取历史、发送、中止和 events。
- 远程使用通过相同的 SSH/Tailscale 隧道;如果配置了 gateway 令牌,客户端在 `connect` 期间包含它。
- macOS 应用程序通过单个 WS 连接(共享连接);它从初始快照水化 presence 并监听 `presence` events 以更新 UI。

## 类型和验证
- 服务器使用 AJV 根据从协议定义发出的 JSON Schema 验证每个入站帧。
- 客户端(TS/Swift)使用生成的类型(TS 直接;Swift 通过 repo 的生成器)。
- 协议定义是事实来源;使用以下命令重新生成 schema/models:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`

## 连接快照
- `hello-ok` 包括一个 `snapshot`,带有 `presence`、`health`、`stateVersion` 和 `uptimeMs` 加上 `policy {maxPayload,maxBufferedBytes,tickIntervalMs}`,以便客户端可以立即渲染而无需额外请求。
- `health`/`system-presence` 仍然可用于手动刷新,但在连接时不需要。

## 错误代码(res.error 形状)
- 错误使用 `{ code, message, details?, retryable?, retryAfterMs? }`。
- 标准代码:
  - `NOT_LINKED` — WhatsApp 未认证。
  - `AGENT_TIMEOUT` — agent 未在配置的截止时间内响应。
  - `INVALID_REQUEST` — schema/param 验证失败。
  - `UNAVAILABLE` — Gateway 正在关闭或依赖项不可用。

## 保活行为
- `tick` events(或 WS ping/pong)定期发出,以便客户端知道 Gateway 即使在没有流量时也处于活动状态。
- 发送/agent 确认保持单独的响应;不要为发送重载 ticks。

## 重放/间隙
- Events 不会重放。客户端检测 seq 间隙,应在继续之前刷新(`health` + `system-presence`)。WebChat 和 macOS 客户端现在在间隙时自动刷新。

## Supervision(macOS 示例)
- 使用 launchd 保持服务活动:
  - Program:到 `openclaw` 的路径
  - Arguments:`gateway`
  - KeepAlive:true
  - StandardOut/Err:文件路径或 `syslog`
- 失败时,launchd 重启;致命的错误配置应该继续退出,以便操作员注意到。
- LaunchAgents 是每个用户的,需要登录 session;对于无头设置,使用自定义 LaunchDaemon(未附带)。
  - `openclaw gateway install` 写入 `~/Library/LaunchAgents/bot.molt.gateway.plist`(或 `bot.molt.<profile>.plist`;旧版 `com.openclaw.*` 已清理)。
  - `openclaw doctor` 审计 LaunchAgent 配置,并可以将其更新为当前默认值。

## Gateway 服务管理(CLI)

使用 Gateway CLI 进行 install/start/stop/restart/status:

```bash
openclaw gateway status
openclaw gateway install
openclaw gateway stop
openclaw gateway restart
openclaw logs --follow
```

注意:
- `gateway status` 默认使用服务解析的端口/配置探测 Gateway RPC(使用 `--url` 覆盖)。
- `gateway status --deep` 添加系统级扫描(LaunchDaemons/system units)。
- `gateway status --no-probe` 跳过 RPC 探测(当网络关闭时有用)。
- `gateway status --json` 对脚本稳定。
- `gateway status` 将 **supervisor 运行时**(launchd/systemd 运行)与 **RPC 可达性**(WS 连接 + status RPC)分开报告。
- `gateway status` 打印配置路径 + 探测目标以避免"localhost vs LAN bind"混淆和配置文件不匹配。
- `gateway status` 包括服务看起来正在运行但端口关闭时的最后一个 gateway 错误行。
- `logs` 通过 RPC 追踪 Gateway 文件日志(不需要手动 `tail`/`grep`)。
- 如果检测到其他类似 gateway 的服务,CLI 会发出警告,除非它们是 OpenClaw 配置文件服务。我们仍然建议大多数设置**每台机器一个 gateway**;为冗余或 rescue bot 使用隔离的配置文件/端口。参见 [Multiple gateways](/zh/gateway/multiple-gateways)。
  - 清理:`openclaw gateway uninstall`(当前服务)和 `openclaw doctor`(旧版迁移)。
- `gateway install` 在已安装时是无操作的;使用 `openclaw gateway install --force` 重新安装(profile/env/path 更改)。

捆绑的 mac 应用程序:
- OpenClaw.app 可以捆绑基于 Node 的 gateway 中继,并安装标记为 `bot.molt.gateway`(或 `bot.molt.<profile>`;旧版 `com.openclaw.*` 标签仍然干净地卸载)的每个用户 LaunchAgent。
- 要干净地停止它,使用 `openclaw gateway stop`(或 `launchctl bootout gui/$UID/bot.molt.gateway`)。
- 要重启,使用 `openclaw gateway restart`(或 `launchctl kickstart -k gui/$UID/bot.molt.gateway`)。
  - `launchctl` 仅在安装了 LaunchAgent 时有效;否则首先使用 `openclaw gateway install`。
  - 运行命名配置文件时,用 `bot.molt.<profile>` 替换标签。

## Supervision(systemd 用户单元)
OpenClaw 在 Linux/WSL2 上默认安装 **systemd 用户服务**。我们建议单用户机器使用用户服务(更简单的 env,每个用户的配置)。为多用户或始终在线服务器使用 **系统服务**(不需要 lingering,共享 supervision)。

`openclaw gateway install` 写入用户单元。`openclaw doctor` 审计单元,并可以更新它以匹配当前推荐的默认值。

创建 `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:
```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
Environment=OPENCLAW_GATEWAY_TOKEN=
WorkingDirectory=/home/youruser

[Install]
WantedBy=default.target
```
启用 lingering(必需,以便用户服务在 logout/idle 后存活):
```
sudo loginctl enable-linger youruser
```
Onboarding 在 Linux/WSL2 上运行此操作(可能提示 sudo;写入 `/var/lib/systemd/linger`)。然后启用服务:
```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

**替代(系统服务)** - 对于始终在线或多用户服务器,您可以安装 systemd **系统** 单元而不是用户单元(不需要 lingering)。创建 `/etc/systemd/system/openclaw-gateway[-<profile>].service`(复制上面的单元,切换 `WantedBy=multi-user.target`,设置 `User=` + `WorkingDirectory=`),然后:
```
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

## Windows(WSL2)

Windows 安装应使用 **WSL2** 并遵循上面的 Linux systemd 部分。

## 操作检查
- 活跃度:打开 WS 并发送 `req:connect` → 期望 `res` 带有 `payload.type="hello-ok"`(带快照)。
- 就绪度:调用 `health` → 期望 `ok: true` 和 `linkChannel` 中的链接 channel(适用时)。
- 调试:订阅 `tick` 和 `presence` events;确保 `status` 显示 linked/auth age;presence 条目显示 Gateway 主机和连接的客户端。

## 安全保证
- 默认假设每个主机一个 Gateway;如果运行多个配置文件,隔离端口/状态并定位正确的实例。
- 不回退到直接 Baileys 连接;如果 Gateway 宕机,发送快速失败。
- 非连接第一帧或格式错误的 JSON 被拒绝,socket 被关闭。
- 优雅关闭:在关闭前发出 `shutdown` event;客户端必须处理关闭 + 重新连接。

## CLI 帮助器
- `openclaw gateway health|status` — 通过 Gateway WS 请求 health/status。
- `openclaw message send --target <num> --message "hi" [--media ...]` — 通过 Gateway 发送(对 WhatsApp 幂等)。
- `openclaw agent --message "hi" --to <num>` — 运行 agent 轮次(默认等待最终)。
- `openclaw gateway call <method> --params '{"k":"v"}'` — 用于调试的原始方法调用器。
- `openclaw gateway stop|restart` — 停止/重启受监督的 gateway 服务(launchd/systemd)。
- Gateway 帮助器子命令假设在 `--url` 上运行 gateway;它们不再自动生成一个。

## 迁移指导
- 停用 `openclaw gateway` 和旧版 TCP 控制端口的使用。
- 更新客户端以使用强制连接和结构化 presence 来讲 WS 协议。
