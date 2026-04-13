---
mmh3_hash: "14f9b19cb50b281128a3f87e3c45e40c"
summary: "Gateway WebSocket 协议:握手、帧、版本控制"
read_when:
  - 实现或更新 Gateway WS 客户端
  - 调试协议不匹配或连接失败
  - 重新生成协议 schema/models
title: "Gateway 协议"
---

# Gateway 协议(WebSocket)

Gateway WS 协议是 OpenClaw 的**单一控制平面 + 节点传输**。所有客户端(CLI、Web UI、macOS 应用、iOS/Android 节点、无头节点)通过 WebSocket 连接,并在握手时声明其**角色** + **范围**。

## 传输

- WebSocket,带有 JSON 负载的文本帧。
- 第一帧**必须**是 `connect` 请求。

## 握手(connect)

Gateway → 客户端(连接前挑战):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

客户端 → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → 客户端:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

当发出设备令牌时,`hello-ok` 还包含:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

### 节点示例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## 帧

- **请求**:`{type:"req", id, method, params}`
- **响应**:`{type:"res", id, ok, payload|error}`
- **事件**:`{type:"event", event, payload, seq?, stateVersion?}`

有副作用的方法需要**幂等性键**(参见 schema)。

## 角色 + 范围

### 角色

- `operator` = 控制平面客户端(CLI/UI/自动化)。
- `node` = 能力主机(camera/screen/canvas/system.run)。

### 范围(operator)

常见范围:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` 带 `includeSecrets: true` 需要 `operator.talk.secrets`（或 `operator.admin`）。

插件注册的 Gateway RPC 方法可能请求自己的操作员范围，但保留的核心管理员前缀（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终解析为 `operator.admin`。

方法范围只是第一道关卡。某些通过 `chat.send` 到达的 slash 命令在顶部应用更严格的命令级别检查。例如,持久的 `/config set` 和 `/config unset` 写入需要 `operator.admin`。

`node.pair.approve` 在基础方法范围之上还有一个额外的批准时范围检查：

- 无命令请求：`operator.pairing`
- 带非 exec 节点命令的请求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的请求：
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions(节点)

节点在连接时声明能力声明:

- `caps`:高级能力类别。
- `commands`:调用的命令允许列表。
- `permissions`:细粒度切换(例如 `screen.record`、`camera.capture`)。

Gateway 将这些视为**声明**并强制执行服务器端允许列表。

## 存在

- `system-presence` 返回按设备身份键控的条目。
- 存在条目包含 `deviceId`、`roles` 和 `scopes`,以便 UI 可以为每个设备显示单行,即使它同时以**操作员**和**节点**身份连接。

## 常见 RPC 方法系列

此页面不是生成的完整转储，但公开的 WS 接口比上面的握手/认证示例更广泛。这些是 Gateway 今天公开的主要方法系列。

`hello-ok.features.methods` 是从 `src/gateway/server-methods-list.ts` 加上已加载的插件/Channel 方法导出构建的保守发现列表。将其视为功能发现，而不是 `src/gateway/server-methods/*.ts` 中每个可调用辅助实现的生成转储。

### 系统和身份

- `health` 返回缓存的或新鲜探测的 Gateway 健康快照。
- `status` 返回 `/status` 风格的 Gateway 摘要；敏感字段仅对管理员范围的操作员客户端可见。
- `gateway.identity.get` 返回 Gateway 设备身份，用于中继和配对流程。
- `system-presence` 返回连接的操作员/节点设备的当前存在快照。
- `system-event` 附加系统事件并可以更新/广播存在上下文。
- `last-heartbeat` 返回最新持久化的 Heartbeat 事件。
- `set-heartbeats` 切换 Gateway 上的 Heartbeat 处理。

### 模型和使用量

- `models.list` 返回运行时允许的模型目录。
- `usage.status` 返回 provider 使用量窗口/剩余配额摘要。
- `usage.cost` 返回日期范围的聚合成本使用摘要。
- `doctor.memory.status` 返回活跃默认 Agent workspace 的向量内存/嵌入就绪状态。
- `sessions.usage` 返回每 Session 使用摘要。
- `sessions.usage.timeseries` 返回一个 Session 的时间序列使用。
- `sessions.usage.logs` 返回一个 Session 的使用日志条目。

### Channel 和登录辅助

- `channels.status` 返回内置 + 捆绑的 Channel/插件状态摘要。
- `channels.logout` 注销特定的 Channel/账户（Channel 支持注销时）。
- `web.login.start` 为当前 QR 能力的 Web Channel provider 启动 QR/web 登录流程。
- `web.login.wait` 等待该 QR/web 登录流程完成并在成功时启动 Channel。
- `push.test` 向已注册的 iOS 节点发送测试 APNs 推送。
- `voicewake.get` 返回存储的唤醒词触发器。
- `voicewake.set` 更新唤醒词触发器并广播更改。

### 消息传递和日志

- `send` 是 Channel/账户/线程目标发送的直接出站交付 RPC，在 Chat 运行器之外。
- `logs.tail` 返回带有游标/限制和最大字节控制的已配置 Gateway 文件日志尾部。

### Talk 和 TTS

- `talk.config` 返回有效的 Talk 配置负载；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
- `talk.mode` 为 WebChat/Control UI 客户端设置/广播当前 Talk 模式状态。
- `talk.speak` 通过活跃的 Talk 语音 provider 合成语音。
- `tts.status` 返回 TTS 启用状态、活跃 provider、备用 provider 和 provider 配置状态。
- `tts.providers` 返回可见的 TTS provider 清单。
- `tts.enable` 和 `tts.disable` 切换 TTS 首选项状态。
- `tts.setProvider` 更新首选的 TTS provider。
- `tts.convert` 运行一次性文本到语音转换。

### Secrets、配置、更新和向导

- `secrets.reload` 重新解析活跃的 SecretRef 并仅在完全成功时交换运行时密钥状态。
- `secrets.resolve` 解析特定命令/目标集的命令目标密钥分配。
- `config.get` 返回当前配置快照和哈希。
- `config.set` 写入经过验证的配置负载。
- `config.patch` 合并部分配置更新。
- `config.apply` 验证 + 替换完整配置负载。
- `config.schema` 返回 Control UI 和 CLI 工具使用的实时配置 schema 负载。
- `config.schema.lookup` 返回一个配置路径的路径范围查找负载。
- `update.run` 运行 Gateway 更新流程，仅在更新本身成功时安排重启。
- `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 通过 WS RPC 公开入门向导。

### 现有主要系列

#### Agent 和 workspace 辅助

- `agents.list` 返回已配置的 Agent 条目。
- `agents.create`、`agents.update` 和 `agents.delete` 管理 Agent 记录和 workspace 连接。
- `agents.files.list`、`agents.files.get` 和 `agents.files.set` 管理为 Agent 公开的引导 workspace 文件。
- `agent.identity.get` 返回 Agent 或 Session 的有效助手身份。
- `agent.wait` 等待运行完成并在可用时返回终端快照。

#### Session 控制

- `sessions.list` 返回当前 Session 索引。
- `sessions.subscribe` 和 `sessions.unsubscribe` 为当前 WS 客户端切换 Session 更改事件订阅。
- `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 为一个 Session 切换转录/消息事件订阅。
- `sessions.preview` 返回特定 Session 键的有界转录预览。
- `sessions.resolve` 解析或规范化 Session 目标。
- `sessions.create` 创建新的 Session 条目。
- `sessions.send` 向现有 Session 发送消息。
- `sessions.steer` 是活跃 Session 的中断和引导变体。
- `sessions.abort` 中止 Session 的活跃工作。
- `sessions.patch` 更新 Session 元数据/覆盖。
- `sessions.reset`、`sessions.delete` 和 `sessions.compact` 执行 Session 维护。
- `sessions.get` 返回完整存储的 Session 行。
- Chat 执行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。
- `chat.history` 为 UI 客户端进行显示规范化：内联指令标记从可见文本中剥离，纯文本工具调用 XML 负载和泄露的 ASCII/全角模型控制令牌被剥离，纯静默令牌助手行（如精确的 `NO_REPLY` / `no_reply`）被省略，超大行可以用占位符替换。

#### 设备配对和设备令牌

- `device.pair.list` 返回待处理和已批准的配对设备。
- `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 管理设备配对记录。
- `device.token.rotate` 在其批准的角色和范围边界内轮换配对设备令牌。
- `device.token.revoke` 撤销配对设备令牌。

#### 节点配对、调用和待处理工作

- `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject` 和 `node.pair.verify` 涵盖节点配对和引导验证。
- `node.list` 和 `node.describe` 返回已知/连接的节点状态。
- `node.rename` 更新配对节点标签。
- `node.invoke` 将命令转发到连接的节点。
- `node.invoke.result` 返回调用请求的结果。
- `node.event` 将节点发起的事件带回 Gateway。
- `node.canvas.capability.refresh` 刷新范围化的 Canvas 功能令牌。
- `node.pending.pull` 和 `node.pending.ack` 是连接节点队列 API。
- `node.pending.enqueue` 和 `node.pending.drain` 管理离线/断开连接节点的持久待处理工作。

#### 批准系列

- `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵盖一次性 exec 批准请求以及待处理批准查找/回放。
- `exec.approval.waitDecision` 等待一个待处理的 exec 批准并返回最终决定（或超时时为 `null`）。
- `exec.approvals.get` 和 `exec.approvals.set` 管理 Gateway exec 批准策略快照。
- `exec.approvals.node.get` 和 `exec.approvals.node.set` 通过节点中继命令管理节点本地 exec 批准策略。
- `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵盖插件定义的批准流程。

#### 其他主要系列

- 自动化：
  - `wake` 调度立即或下一个 Heartbeat 唤醒文本注入
  - `cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs`
- 技能/工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`

### 常见事件系列

- `chat`：UI 聊天更新，如 `chat.inject` 和其他仅转录的聊天事件。
- `session.message` 和 `session.tool`：已订阅 Session 的转录/事件流更新。
- `sessions.changed`：Session 索引或元数据已更改。
- `presence`：系统存在快照更新。
- `tick`：定期保活/活跃度事件。
- `health`：Gateway 健康快照更新。
- `heartbeat`：Heartbeat 事件流更新。
- `cron`：Cron 运行/作业更改事件。
- `shutdown`：Gateway 关闭通知。
- `node.pair.requested` / `node.pair.resolved`：节点配对生命周期。
- `node.invoke.request`：节点调用请求广播。
- `device.pair.requested` / `device.pair.resolved`：配对设备生命周期。
- `voicewake.changed`：唤醒词触发配置已更改。
- `exec.approval.requested` / `exec.approval.resolved`：exec 批准生命周期。
- `plugin.approval.requested` / `plugin.approval.resolved`：插件批准生命周期。

### 节点辅助方法

- 节点可以调用 `skills.bins` 获取当前技能可执行文件列表以进行自动允许检查。

### 操作员辅助方法

- 操作员可以调用 `commands.list`（`operator.read`）获取 Agent 的运行时命令清单。
  - `agentId` 是可选的；省略它以读取默认 Agent workspace。
  - `scope` 控制主 `name` 的目标界面：
    - `text` 返回不带前导 `/` 的主文本命令令牌
    - `native` 和默认 `both` 路径在可用时返回 Provider 感知的原生名称
  - `textAliases` 携带精确的斜杠别名,例如 `/model` 和 `/m`。
  - `nativeName` 携带 Provider 感知的原生命令名称（如果存在）。
  - `provider` 是可选的,仅影响原生命名加上原生插件命令可用性。
  - `includeArgs=false` 从响应中省略序列化的参数元数据。
- 操作员可以调用 `tools.catalog`(`operator.read`)获取 Agent 的运行时工具目录。响应包括分组工具和来源元数据:
  - `source`:`core` 或 `plugin`
  - `pluginId`:当 `source="plugin"` 时的插件所有者
  - `optional`:插件工具是否为可选
- 操作员可以调用 `tools.effective`（`operator.read`）获取 Session 的运行时有效工具清单。
  - `sessionKey` 是必需的。
  - Gateway 从服务器端的 Session 派生受信任的运行时上下文，而不是接受调用者提供的认证或交付上下文。
  - 响应是 Session 范围的，反映活跃对话现在可以使用的内容，包括核心、插件和 Channel 工具。
- 操作员可以调用 `skills.status`（`operator.read`）获取 Agent 的可见技能清单。
  - `agentId` 是可选的；省略它以读取默认 Agent workspace。
  - 响应包括资格、缺少的需求、配置检查和无原始密钥值的清理安装选项。
- 操作员可以调用 `skills.search` 和 `skills.detail`（`operator.read`）用于 ClawHub 发现元数据。
- 操作员可以调用 `skills.install`（`operator.admin`）以两种模式：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 将技能文件夹安装到默认 Agent workspace `skills/` 目录。
  - Gateway 安装器模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` 在 Gateway 主机上运行声明的 `metadata.openclaw.install` 操作。
- 操作员可以调用 `skills.update`（`operator.admin`）以两种模式：
  - ClawHub 模式更新一个跟踪的 slug 或默认 Agent workspace 中所有跟踪的 ClawHub 安装。
  - 配置模式修补 `skills.entries.<skillKey>` 值，如 `enabled`、`apiKey` 和 `env`。

## Exec 审批

- 当 exec 请求需要审批时,Gateway 广播 `exec.approval.requested`。
- 操作员客户端通过调用 `exec.approval.resolve` 来解决(需要 `operator.approvals` 范围)。
- 对于 `host=node`,`exec.approval.request` 必须包含 `systemRunPlan`(规范的 `argv`/`cwd`/`rawCommand`/Session 元数据)。缺少 `systemRunPlan` 的请求会被拒绝。
- 批准后，转发的 `node.invoke system.run` 调用将该规范 `systemRunPlan` 作为权威命令/cwd/Session 上下文重用。
- 如果调用者在准备和最终批准的 `system.run` 转发之间修改了 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 会拒绝运行而不是信任修改后的负载。

## Agent 交付回退

- `agent` 请求可以包含 `deliver=true` 以请求出站交付。
- `bestEffortDeliver=false` 保持严格行为：未解析或仅内部交付目标返回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 在无法解析外部可交付路由时（例如内部/webchat Session 或不明确的多 Channel 配置）允许回退到仅 Session 执行。

## 版本控制

- `PROTOCOL_VERSION` 位于 `src/gateway/protocol/schema.ts` 中。
- 客户端发送 `minProtocol` + `maxProtocol`;服务器拒绝不匹配。
- Schema + models 从 TypeBox 定义生成:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## 认证

- 共享密钥 Gateway 认证使用 `connect.params.auth.token` 或 `connect.params.auth.password`，取决于已配置的认证模式。
- 身份承载模式（如 Tailscale Serve（`gateway.auth.allowTailscale: true`）或非回环 `gateway.auth.mode: "trusted-proxy"`）从请求头而不是 `connect.params.auth.*` 满足 connect 认证检查。
- 私有入口 `gateway.auth.mode: "none"` 完全跳过共享密钥 connect 认证；不要在公共/不受信任的入口暴露该模式。
- 配对后，Gateway 发出范围为连接角色 + 范围的**设备令牌**。它在 `hello-ok.auth.deviceToken` 中返回，客户端应持久化以供将来连接使用。
- 客户端应在任何成功 connect 后持久化主要的 `hello-ok.auth.deviceToken`。
- 使用该**存储的**设备令牌重新连接还应重用为该令牌存储的已批准范围集。这保留了已授予的读取/探测/状态访问权限，并避免无声地将重连折叠为更窄的隐式仅管理员范围。
- 正常 connect 认证优先级是：明确的共享 token/password 优先，然后明确的 `deviceToken`，然后存储的每设备令牌，然后引导令牌。
- 额外的 `hello-ok.auth.deviceTokens` 条目是引导切换令牌。只有当 connect 在受信任的传输（如 `wss://` 或回环/本地配对）上使用引导认证时才持久化它们。
- 如果客户端提供了**明确的** `deviceToken` 或明确的 `scopes`，该调用者请求的范围集保持权威；缓存范围仅在客户端重用存储的每设备令牌时才重用。
- 设备令牌可以通过 `device.token.rotate` 和 `device.token.revoke` 轮换/撤销（需要 `operator.pairing` 范围）。
- 令牌颁发/轮换保持在该设备配对条目中记录的已批准角色集的范围内；轮换令牌不能将设备扩展到配对批准从未授予的角色。
- 对于配对设备令牌 Session，设备管理是自范围的，除非调用者也有 `operator.admin`：非管理员调用者只能移除/撤销/轮换他们**自己的**设备条目。
- `device.token.rotate` 还检查请求的操作员范围集与调用者当前 Session 范围。非管理员调用者不能将令牌轮换为比他们已持有的更广泛的操作员范围集。
- 认证失败包含 `error.details.code` 加上恢复提示:
  - `error.details.canRetryWithDeviceToken`(布尔值)
  - `error.details.recommendedNextStep`(`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` 的客户端行为:
  - 受信任的客户端可以尝试一次使用缓存的每设备令牌进行有界重试。
  - 如果该重试失败,客户端应停止自动重连循环并呈现操作员操作指导。

## 设备身份 + 配对

- 节点应包含从密钥对指纹派生的稳定设备身份(`device.id`)。
- Gateway 为每个设备 + 角色发出令牌。
- 除非启用了本地自动审批,否则新设备 ID 需要配对审批。
- 配对自动审批以直接本地回环连接为中心。
- OpenClaw 也有一个窄的后端/容器本地自连接路径，用于受信任的共享密钥辅助流程。
- 同一主机的 tailnet 或 LAN 连接仍被视为远程，用于配对，需要批准。
- 所有 WS 客户端在 `connect` 时必须包含 `device` 身份(操作员 + 节点)。Control UI 只能在以下模式中省略它:
  - `gateway.controlUi.allowInsecureAuth=true` 仅用于本地回环不安全 HTTP 兼容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作员 Control UI 认证。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`(紧急方案,严重安全降级)。
- 所有连接必须签署服务器提供的 `connect.challenge` nonce。

### 设备认证迁移诊断

对于仍使用预挑战签名行为的旧版客户端,`connect` 现在在 `error.details.code` 下返回 `DEVICE_AUTH_*` 详细代码,带有稳定的 `error.details.reason`。

常见迁移失败:

| 消息                     | details.code                     | details.reason           | 含义                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 客户端省略了 `device.nonce`(或发送为空)。     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 客户端使用陈旧/错误的 nonce 签名。            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 签名负载与 v2 负载不匹配。       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 签名时间戳超出允许的偏差。          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 与公钥指纹不匹配。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公钥格式/规范化失败。         |

迁移目标:

- 始终等待 `connect.challenge`。
- 签署包含服务器 nonce 的 v2 负载。
- 在 `connect.params.device.nonce` 中发送相同的 nonce。
- 首选签名负载是 `v3`,它除了 device/client/role/scopes/token/nonce 字段外还绑定 `platform` 和 `deviceFamily`。
- 旧版 `v2` 签名仍被接受以保持兼容性,但配对设备元数据固定仍在重连时控制命令策略。

## TLS + 固定

- WS 连接支持 TLS。
- 客户端可以选择固定 Gateway 证书指纹(参见 `gateway.tls` 配置加上 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`)。

## 范围

此协议公开**完整的 Gateway API**(状态、Channel、模型、聊天、Agent、Session、节点、审批等)。确切的表面由 `src/gateway/protocol/schema.ts` 中的 TypeBox schema 定义。
