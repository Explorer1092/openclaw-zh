---
mmh3_hash: "bb55e897fead8ace4e052e7db1a6ba73"
summary: "Gateway WebSocket 协议:握手、帧、版本控制"
read_when:
  - 实现或更新 Gateway WS 客户端
  - 调试协议不匹配或连接失败
  - 重新生成协议 schema/models
title: "Gateway protocol"
---

Gateway WS 协议是 OpenClaw 的**单一控制平面 + 节点传输**。所有客户端（CLI、Web UI、macOS 应用、iOS/Android 节点、无头节点）通过 WebSocket 连接，并在握手时声明其**角色** + **范围**。

## 传输

- WebSocket，带有 JSON 负载的文本帧。
- 第一帧**必须**是 `connect` 请求。
- 连接前帧上限为 64 KiB。成功握手后，客户端应遵循 `hello-ok.policy.maxPayload` 和 `hello-ok.policy.maxBufferedBytes` 限制。启用诊断后，超大入站帧和慢速出站缓冲区在 Gateway 关闭或丢弃受影响的帧之前发出 `payload.large` 事件。这些事件保留大小、限制、表面和安全原因码，不保留消息正文、附件内容、原始帧正文、令牌、Cookie 或密钥值。

## 握手（connect）

Gateway → 客户端（连接前挑战）：

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

客户端 → Gateway：

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
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

Gateway → 客户端：

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

当 Gateway 仍在完成启动边车时，`connect` 请求可以返回可重试的 `UNAVAILABLE` 错误，`details.reason` 设置为 `"startup-sidecars"` 并附带 `retryAfterMs`。客户端应在其整体连接预算内重试该响应，而不是将其视为终端握手失败。

`server`、`features`、`snapshot` 和 `policy` 均为 schema 必填字段（`src/gateway/protocol/schema/frames.ts`）。`auth` 也是必需的，报告协商的角色/范围。`pluginSurfaceUrls` 是可选的，将插件表面名称（如 `canvas`）映射到有范围的托管 URL。

有范围的插件表面 URL 可能会过期。节点可以使用 `{ "surface": "canvas" }` 调用 `node.pluginSurface.refresh` 以在 `pluginSurfaceUrls` 中接收新鲜条目。实验性 Canvas 插件重构不支持已弃用的 `canvasHostUrl`、`canvasCapability` 或 `node.canvas.capability.refresh` 兼容性路径；当前原生客户端和 Gateway 必须使用插件表面。

未发出设备令牌时，`hello-ok.auth` 报告协商的权限而不含令牌字段：

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

受信任的同进程后端客户端（`client.id: "gateway-client"`，`client.mode: "backend"`）在使用共享 Gateway token/password 进行身份验证时，可以在直接回环连接上省略 `device`。此路径保留给内部控制平面 RPC，使陈旧的 CLI/设备配对基线不会阻塞本地后端工作（如子 Agent Session 更新）。远程客户端、浏览器源客户端、节点客户端和显式设备令牌/设备身份客户端仍使用正常的配对和范围升级检查。

发出设备令牌时，`hello-ok` 还包含：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

内置 QR/设置码引导仅限节点。所有者批准待处理的节点请求后，`hello-ok.auth` 包含主要节点令牌：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": []
  }
}
```

内置设置码流程不包含额外的 `deviceTokens` 条目，也不会移交操作员令牌。客户端作者应将可选的 `hello-ok.auth.deviceTokens` 字段视为旧版/自定义引导扩展数据：仅在受信任传输上存在时才持久化，并且不要将其要求于内置配对。

### 节点示例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
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

- **请求**：`{type:"req", id, method, params}`
- **响应**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

有副作用的方法需要**幂等性键**（参见 schema）。

## 角色 + 范围

有关完整的操作员范围模型、批准时检查和共享密钥语义，请参见 [Operator scopes](/gateway/operator-scopes)。

### 角色

- `operator` = 控制平面客户端（CLI/UI/自动化）。
- `node` = 能力主机（camera/screen/canvas/system.run）。

### 范围（operator）

常见范围：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` 带 `includeSecrets: true` 需要 `operator.talk.secrets`（或 `operator.admin`）。

插件注册的 Gateway RPC 方法可能请求自己的操作员范围，但保留的核心管理员前缀（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终解析为 `operator.admin`。

方法范围只是第一道关卡。某些通过 `chat.send` 到达的 slash 命令在顶部应用更严格的命令级别检查。例如，持久的 `/config set` 和 `/config unset` 写入需要 `operator.admin`。

`node.pair.approve` 在基础方法范围之上还有一个额外的批准时范围检查：

- 无命令请求：`operator.pairing`
- 带非 exec 节点命令的请求：`operator.pairing` + `operator.write`
- 包含 `system.run`、`system.run.prepare` 或 `system.which` 的请求：
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions（节点）

节点在连接时声明能力声明：

- `caps`：高级能力类别，如 `camera`、`canvas`、`screen`、`location`、`voice` 和 `talk`。
- `commands`：调用的命令允许列表。
- `permissions`：细粒度切换（例如 `screen.record`、`camera.capture`）。

Gateway 将这些视为**声明**并强制执行服务器端允许列表。

## 存在

- `system-presence` 返回按设备身份键控的条目。
- 存在条目包含 `deviceId`、`roles` 和 `scopes`，以便 UI 可以为每个设备显示单行，即使它同时以**操作员**和**节点**身份连接。
- `node.list` 包含可选的 `lastSeenAtMs` 和 `lastSeenReason` 字段。已连接节点将其当前连接时间报告为带原因 `connect` 的 `lastSeenAtMs`；配对节点还可以在受信任的节点事件更新其配对元数据时报告持久后台存在。

### 节点后台存活事件

节点可以使用 `event: "node.presence.alive"` 调用 `node.event`，记录配对节点在后台唤醒期间处于存活状态，而不将其标记为已连接。

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` 是一个封闭枚举：`background`、`silent_push`、`bg_app_refresh`、`significant_location`、`manual` 或 `connect`。未知的触发器字符串在持久化之前由 Gateway 规范化为 `background`。该事件仅对已认证的节点设备 Session 是持久的；无设备或未配对的 Session 返回 `handled: false`。

成功的 Gateway 返回结构化结果：

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

旧版 Gateway 可能仍为 `node.event` 返回 `{ "ok": true }`；客户端应将其视为已确认的 RPC，而不是持久存在持久化。

## 广播事件范围

服务器推送的 WebSocket 广播事件受范围门控，使仅配对范围或仅节点 Session 不会被动接收 Session 内容。

- **聊天、Agent 和工具结果帧**（包括流式 `agent` 事件和工具调用结果）需要至少 `operator.read`。没有 `operator.read` 的 Session 完全跳过这些帧。
- **插件定义的 `plugin.*` 广播**根据插件注册方式被门控到 `operator.write` 或 `operator.admin`。
- **状态和传输事件**（`heartbeat`、`presence`、`tick`、connect/disconnect 生命周期等）保持不受限制，因此传输健康对每个已认证 Session 均可观察。
- **未知广播事件系列**默认受范围门控（失败关闭），除非注册的处理程序明确放宽它们。

每个客户端连接保留自己的每客户端序列号，因此即使不同客户端看到不同的范围过滤事件流子集，广播也能在该 socket 上保持单调排序。

## 常见 RPC 方法系列

公开的 WS 表面比上面的握手/认证示例更广泛。这不是生成的转储 —— `hello-ok.features.methods` 是从 `src/gateway/server-methods-list.ts` 加上已加载的插件/Channel 方法导出构建的保守发现列表。将其视为功能发现，而不是 `src/gateway/server-methods/*.ts` 的完整枚举。

<AccordionGroup>
  <Accordion title="系统和身份">
    - `health` 返回缓存的或新鲜探测的 Gateway 健康快照。
    - `diagnostics.stability` 返回最近有界的诊断稳定性记录器。它保留操作元数据，如事件名称、计数、字节大小、内存读数、队列/Session 状态、Channel/插件名称和 Session ID。不保留聊天文本、Webhook 正文、工具输出、原始请求或响应正文、令牌、Cookie 或密钥值。需要操作员读取范围。
    - `status` 返回 `/status` 风格的 Gateway 摘要；敏感字段仅对管理员范围的操作员客户端可见。
    - `gateway.identity.get` 返回 Gateway 设备身份，用于中继和配对流程。
    - `system-presence` 返回连接的操作员/节点设备的当前存在快照。
    - `system-event` 附加系统事件并可以更新/广播存在上下文。
    - `last-heartbeat` 返回最新持久化的 Heartbeat 事件。
    - `set-heartbeats` 切换 Gateway 上的 Heartbeat 处理。

  </Accordion>

  <Accordion title="模型和使用量">
    - `models.list` 返回运行时允许的模型目录。传递 `{ "view": "configured" }` 获取选择器大小的已配置模型（`agents.defaults.models` 优先，然后是 `models.providers.*.models`），或 `{ "view": "all" }` 获取完整目录。
    - `usage.status` 返回 Provider 使用量窗口/剩余配额摘要。
    - `usage.cost` 返回日期范围的聚合成本使用摘要。
    - `doctor.memory.status` 返回活跃默认 Agent workspace 的向量内存/嵌入缓存就绪状态。仅当调用者明确需要实时嵌入提供商 ping 时才传递 `{ "probe": true }` 或 `{ "deep": true }`。
    - `doctor.memory.remHarness` 返回远程控制平面客户端的有界只读 REM 运行时预览。它可以包含 workspace 路径、记忆片段、渲染的接地 Markdown 和深度提升候选，因此调用者需要 `operator.read`。
    - `sessions.usage` 返回每 Session 使用摘要。
    - `sessions.usage.timeseries` 返回一个 Session 的时间序列使用。
    - `sessions.usage.logs` 返回一个 Session 的使用日志条目。

  </Accordion>

  <Accordion title="Channel 和登录辅助">
    - `channels.status` 返回内置 + 捆绑的 Channel/插件状态摘要。
    - `channels.logout` 注销特定的 Channel/账户（Channel 支持注销时）。
    - `web.login.start` 为当前 QR 能力的 Web Channel Provider 启动 QR/web 登录流程。
    - `web.login.wait` 等待该 QR/web 登录流程完成并在成功时启动 Channel。
    - `push.test` 向已注册的 iOS 节点发送测试 APNs 推送。
    - `voicewake.get` 返回存储的唤醒词触发器。
    - `voicewake.set` 更新唤醒词触发器并广播更改。

  </Accordion>

  <Accordion title="消息传递和日志">
    - `send` 是 Channel/账户/线程目标发送的直接出站交付 RPC，在 Chat 运行器之外。
    - `logs.tail` 返回带有游标/限制和最大字节控制的已配置 Gateway 文件日志尾部。

  </Accordion>

  <Accordion title="Talk 和 TTS">
    - `talk.catalog` 返回用于语音、流式转录和实时语音的只读 Talk Provider 目录。它包含 Provider ID、标签、配置状态、公开的模型/声音 ID、规范模式、传输、大脑策略和实时音频/能力标志，而不返回 Provider 密钥或修改全局配置。
    - `talk.config` 返回有效的 Talk 配置负载；`includeSecrets` 需要 `operator.talk.secrets`（或 `operator.admin`）。
    - `talk.session.create` 为 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room` 创建 Gateway 拥有的 Talk Session。对于 `stt-tts/managed-room`，传递 `sessionKey` 的 `operator.write` 调用者还必须传递 `spawnedBy` 以实现有范围的 Session 键可见性；无范围的 `sessionKey` 创建和 `brain: "direct-tools"` 需要 `operator.admin`。
    - `talk.session.join` 验证托管房间 Session 令牌，根据需要发出 `session.ready` 或 `session.replaced` 事件，并返回房间/Session 元数据以及最近的 Talk 事件，而不包含明文令牌或存储的令牌哈希。
    - `talk.session.appendAudio` 将 base64 PCM 输入音频附加到 Gateway 拥有的实时中继和转录 Session。
    - `talk.session.startTurn`、`talk.session.endTurn` 和 `talk.session.cancelTurn` 在状态清除前使用陈旧轮次拒绝驱动托管房间轮次生命周期。
    - `talk.session.cancelOutput` 停止助手音频输出，主要用于 Gateway 中继 Session 中 VAD 门控的插话中断。
    - `talk.session.submitToolResult` 完成 Gateway 拥有的实时中继 Session 发出的提供商工具调用。对于最终结果将跟随的中间工具输出，传递 `options: { willContinue: true }`；当工具结果应满足提供商调用而不启动另一个实时助手响应时，传递 `options: { suppressResponse: true }`。
    - `talk.session.close` 关闭 Gateway 拥有的中继、转录或托管房间 Session 并发出终端 Talk 事件。
    - `talk.mode` 为 WebChat/Control UI 客户端设置/广播当前 Talk 模式状态。
    - `talk.client.create` 使用 `webrtc` 或 `provider-websocket` 创建客户端拥有的实时 Provider Session，同时 Gateway 拥有配置、凭据、指令和工具策略。
    - `talk.client.toolCall` 让客户端拥有的实时传输将 Provider 工具调用转发到 Gateway 策略。第一个支持的工具是 `openclaw_agent_consult`；客户端接收运行 ID 并等待正常聊天生命周期事件，然后再提交提供商特定的工具结果。
    - `talk.event` 是实时、转录、STT/TTS、托管房间、电话和会议适配器的单一 Talk 事件通道。
    - `talk.speak` 通过活跃的 Talk 语音 Provider 合成语音。
    - `tts.status` 返回 TTS 启用状态、活跃 Provider、备用 Provider 和 Provider 配置状态。
    - `tts.providers` 返回可见的 TTS Provider 清单。
    - `tts.enable` 和 `tts.disable` 切换 TTS 首选项状态。
    - `tts.setProvider` 更新首选的 TTS Provider。
    - `tts.convert` 运行一次性文本到语音转换。

  </Accordion>

  <Accordion title="Secrets、配置、更新和向导">
    - `secrets.reload` 重新解析活跃的 SecretRef 并仅在完全成功时交换运行时密钥状态。
    - `secrets.resolve` 解析特定命令/目标集的命令目标密钥分配。
    - `config.get` 返回当前配置快照和哈希。
    - `config.set` 写入经过验证的配置负载。
    - `config.patch` 合并部分配置更新。
    - `config.apply` 验证 + 替换完整配置负载。
    - `config.schema` 返回 Control UI 和 CLI 工具使用的实时配置 schema 负载：schema、`uiHints`、版本和生成元数据，在运行时可加载时包含插件 + Channel schema 元数据。schema 包含字段 `title` / `description` 元数据，来源于 UI 使用的相同标签和帮助文本，包括嵌套对象、通配符、数组项和 `anyOf` / `oneOf` / `allOf` 组合分支（当匹配的字段文档存在时）。
    - `config.schema.lookup` 返回一个配置路径的路径范围查找负载：规范化路径、浅层 schema 节点、匹配的 hint + `hintPath` 以及用于 UI/CLI 深入的直接子节点摘要。查找 schema 节点保留面向用户的文档和常见验证字段（`title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数字/字符串/数组/对象边界，以及 `additionalProperties`、`deprecated`、`readOnly`、`writeOnly` 等标志）。子节点摘要公开 `key`、规范化 `path`、`type`、`required`、`hasChildren`，加上匹配的 `hint` / `hintPath`。
    - `update.run` 运行 Gateway 更新流程，仅在更新本身成功时安排重启；带有 Session 的调用者可以包含 `continuationMessage`，以便启动在重启延续队列中恢复一次后续 Agent 轮次。来自控制平面的包管理器更新使用分离的托管服务切换，而不是在实时 Gateway 内替换包树。已启动的切换返回 `ok: true` 带 `result.reason: "managed-service-handoff-started"` 和 `handoff.status: "started"`；不可用或失败的切换返回 `ok: false` 带 `managed-service-handoff-unavailable` 或 `managed-service-handoff-failed`，以及需要手动 shell 更新时的 `handoff.command`。切换启动期间，重启哨兵可能短暂报告 `stats.reason: "restart-health-pending"`；延续会延迟到 CLI 验证重启的 Gateway 并写入最终 `ok` 哨兵。
    - `update.status` 返回最新缓存的更新重启哨兵，包括可用时的重启后运行版本。
    - `wizard.start`、`wizard.next`、`wizard.status` 和 `wizard.cancel` 通过 WS RPC 公开入门向导。

  </Accordion>

  <Accordion title="Agent 和 workspace 辅助">
    - `agents.list` 返回已配置的 Agent 条目，包括有效模型和运行时元数据。
    - `agents.create`、`agents.update` 和 `agents.delete` 管理 Agent 记录和 workspace 连接。
    - `agents.files.list`、`agents.files.get` 和 `agents.files.set` 管理为 Agent 公开的引导 workspace 文件。
    - `tasks.list`、`tasks.get` 和 `tasks.cancel` 向 SDK 和操作员客户端公开 Gateway 任务分类账。
    - `artifacts.list`、`artifacts.get` 和 `artifacts.download` 为显式的 `sessionKey`、`runId` 或 `taskId` 范围公开转录派生的制品摘要和下载。运行和任务查询在服务器端解析拥有的 Session，只返回具有匹配来源的转录媒体；不安全或本地 URL 来源返回不支持的下载，而不是在服务器端获取。
    - `environments.list` 和 `environments.status` 为 SDK 客户端公开只读的 Gateway 本地和节点环境发现。
    - `agent.identity.get` 返回 Agent 或 Session 的有效助手身份。
    - `agent.wait` 等待运行完成并在可用时返回终端快照。

  </Accordion>

  <Accordion title="Session 控制">
    - `sessions.list` 返回当前 Session 索引，包括配置了 Agent 运行时后端时的每行 `agentRuntime` 元数据。
    - `sessions.subscribe` 和 `sessions.unsubscribe` 为当前 WS 客户端切换 Session 更改事件订阅。
    - `sessions.messages.subscribe` 和 `sessions.messages.unsubscribe` 为一个 Session 切换转录/消息事件订阅。
    - `sessions.preview` 返回特定 Session 键的有界转录预览。
    - `sessions.describe` 返回精确 Session 键的一个 Gateway Session 行。
    - `sessions.resolve` 解析或规范化 Session 目标。
    - `sessions.create` 创建新的 Session 条目。
    - `sessions.send` 向现有 Session 发送消息。
    - `sessions.steer` 是活跃 Session 的中断和引导变体。
    - `sessions.abort` 中止 Session 的活跃工作。调用者可以传递 `key` 加上可选的 `runId`，或单独传递 `runId` 用于 Gateway 可以解析到 Session 的活跃运行。
    - `sessions.patch` 更新 Session 元数据/覆盖并报告解析的规范模型加上有效的 `agentRuntime`。
    - `sessions.reset`、`sessions.delete` 和 `sessions.compact` 执行 Session 维护。
    - `sessions.get` 返回完整存储的 Session 行。
    - Chat 执行仍使用 `chat.history`、`chat.send`、`chat.abort` 和 `chat.inject`。`chat.history` 为 UI 客户端进行显示规范化：内联指令标记从可见文本中剥离，纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和截断的工具调用块）以及泄露的 ASCII/全角模型控制令牌被剥离，纯静默令牌助手行（如精确的 `NO_REPLY` / `no_reply`）被省略，超大行可以用占位符替换。

  </Accordion>

  <Accordion title="设备配对和设备令牌">
    - `device.pair.list` 返回待处理和已批准的配对设备。
    - `device.pair.approve`、`device.pair.reject` 和 `device.pair.remove` 管理设备配对记录。
    - `device.token.rotate` 在其批准的角色和调用者范围边界内轮换配对设备令牌。
    - `device.token.revoke` 在其批准的角色和调用者范围边界内撤销配对设备令牌。

  </Accordion>

  <Accordion title="节点配对、调用和待处理工作">
    - `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.remove` 和 `node.pair.verify` 涵盖节点配对和引导验证。
    - `node.list` 和 `node.describe` 返回已知/连接的节点状态。
    - `node.rename` 更新配对节点标签。
    - `node.invoke` 将命令转发到连接的节点。
    - `node.invoke.result` 返回调用请求的结果。
    - `node.event` 将节点发起的事件带回 Gateway。
    - `node.pending.pull` 和 `node.pending.ack` 是连接节点队列 API。
    - `node.pending.enqueue` 和 `node.pending.drain` 管理离线/断开连接节点的持久待处理工作。

  </Accordion>

  <Accordion title="批准系列">
    - `exec.approval.request`、`exec.approval.get`、`exec.approval.list` 和 `exec.approval.resolve` 涵盖一次性 exec 批准请求以及待处理批准查找/回放。
    - `exec.approval.waitDecision` 等待一个待处理的 exec 批准并返回最终决定（或超时时为 `null`）。
    - `exec.approvals.get` 和 `exec.approvals.set` 管理 Gateway exec 批准策略快照。
    - `exec.approvals.node.get` 和 `exec.approvals.node.set` 通过节点中继命令管理节点本地 exec 批准策略。
    - `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision` 和 `plugin.approval.resolve` 涵盖插件定义的批准流程。

  </Accordion>

  <Accordion title="自动化、Skills 和工具">
    - 自动化：`wake` 调度立即或下一个 Heartbeat 唤醒文本注入；`cron.get`、`cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs` 管理计划工作。
    - `cron.run` 保持为手动运行的入队风格 RPC。需要完成语义的客户端应读取返回的 `runId` 并轮询 `cron.runs`。
    - `cron.runs` 接受可选的非空 `runId` 过滤器，以便客户端可以跟踪一个排队的手动运行，而不与同一作业的其他历史条目竞争。
    - Skills 和工具：`commands.list`、`skills.*`、`tools.catalog`、`tools.effective`、`tools.invoke`。

  </Accordion>
</AccordionGroup>

### 常见事件系列

- `chat`：UI 聊天更新，如 `chat.inject` 和其他仅转录的聊天事件。在协议 v4 中，delta 负载携带 `deltaText`；`message` 保持为累积助手快照。非前缀替换设置 `replace=true` 并使用 `deltaText` 作为替换文本。
- `session.message`、`session.operation` 和 `session.tool`：已订阅 Session 的转录、飞行中 Session 操作和事件流更新。
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

### 任务分类账 RPC

操作员客户端可以通过任务分类账 RPC 检查和取消 Gateway 后台任务记录。这些方法返回已清理的任务摘要，而不是原始运行时状态。

- `tasks.list` 需要 `operator.read`。
  - 参数：可选的 `status`（`"queued"`、`"running"`、`"completed"`、`"failed"`、`"cancelled"` 或 `"timed_out"`）或这些状态的数组，可选的 `agentId`，可选的 `sessionKey`，可选的从 `1` 到 `500` 的 `limit`，以及可选的字符串 `cursor`。
  - 结果：`{ "tasks": TaskSummary[], "nextCursor"?: string }`。
- `tasks.get` 需要 `operator.read`。
  - 参数：`{ "taskId": string }`。
  - 结果：`{ "task": TaskSummary }`。
  - 缺少的任务 ID 返回 Gateway 未找到错误形状。
- `tasks.cancel` 需要 `operator.write`。
  - 参数：`{ "taskId": string, "reason"?: string }`。
  - 结果：`{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`。
  - `found` 报告分类账是否有匹配的任务。`cancelled` 报告运行时是否接受或记录了取消。

`TaskSummary` 包含 `id`、`status` 以及可选元数据，如 `kind`、`runtime`、`title`、`agentId`、`sessionKey`、`childSessionKey`、`ownerKey`、`runId`、`taskId`、`flowId`、`parentTaskId`、`sourceId`、时间戳、进度、终端摘要和已清理的错误文本。

### 操作员辅助方法

- 操作员可以调用 `commands.list`（`operator.read`）获取 Agent 的运行时命令清单。
  - `agentId` 是可选的；省略它以读取默认 Agent workspace。
  - `scope` 控制主 `name` 的目标表面：
    - `text` 返回不带前导 `/` 的主文本命令令牌
    - `native` 和默认 `both` 路径在可用时返回 Provider 感知的原生名称
  - `textAliases` 携带精确的斜杠别名，如 `/model` 和 `/m`。
  - `nativeName` 携带 Provider 感知的原生命令名称（如果存在）。
  - `provider` 是可选的，仅影响原生命名加上原生插件命令可用性。
  - `includeArgs=false` 从响应中省略序列化的参数元数据。
- 操作员可以调用 `tools.catalog`（`operator.read`）获取 Agent 的运行时工具目录。响应包括分组工具和来源元数据：
  - `source`：`core` 或 `plugin`
  - `pluginId`：当 `source="plugin"` 时的插件所有者
  - `optional`：插件工具是否为可选
- 操作员可以调用 `tools.effective`（`operator.read`）获取 Session 的运行时有效工具清单。
  - `sessionKey` 是必需的。
  - Gateway 从服务器端的 Session 派生受信任的运行时上下文，而不是接受调用者提供的认证或交付上下文。
  - 响应是 Session 范围的，反映活跃对话现在可以使用的内容，包括核心、插件和 Channel 工具。
- 操作员可以调用 `tools.invoke`（`operator.write`）通过与 `/tools/invoke` 相同的 Gateway 策略路径调用一个可用工具。
  - `name` 是必需的。`args`、`sessionKey`、`agentId`、`confirm` 和 `idempotencyKey` 是可选的。
  - 如果 `sessionKey` 和 `agentId` 都存在，解析的 Session Agent 必须匹配 `agentId`。
  - 响应是 SDK 面向的信封，带有 `ok`、`toolName`、可选的 `output` 和类型化的 `error` 字段。批准或策略拒绝在负载中返回 `ok:false`，而不是绕过 Gateway 工具策略管道。
- 操作员可以调用 `skills.status`（`operator.read`）获取 Agent 的可见技能清单。
  - `agentId` 是可选的；省略它以读取默认 Agent workspace。
  - 响应包括资格、缺少的需求、配置检查和无原始密钥值的清理安装选项。
- 操作员可以调用 `skills.search` 和 `skills.detail`（`operator.read`）用于 ClawHub 发现元数据。
- 操作员可以调用 `skills.upload.begin`、`skills.upload.chunk` 和 `skills.upload.commit`（`operator.admin`）在安装之前暂存私有技能存档。这是受信任客户端的单独管理员上传路径，而不是正常的 ClawHub 技能安装流程，默认情况下禁用，除非启用了 `skills.install.allowUploadedArchives`。
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` 创建绑定到该 slug 和 force 值的上传。
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` 在精确的解码偏移量处附加字节。
  - `skills.upload.commit({ uploadId, sha256? })` 验证最终大小和 SHA-256。提交仅完成上传；不安装技能。
  - 上传的技能存档是包含 `SKILL.md` 根目录的 zip 存档。存档的内部目录名称不会选择安装目标。
- 操作员可以调用 `skills.install`（`operator.admin`）以三种模式：
  - ClawHub 模式：`{ source: "clawhub", slug, version?, force? }` 将技能文件夹安装到默认 Agent workspace `skills/` 目录。
  - 上传模式：`{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` 将已提交的上传安装到默认 Agent workspace `skills/<slug>` 目录。slug 和 force 值必须匹配原始的 `skills.upload.begin` 请求。除非启用了 `skills.install.allowUploadedArchives`，否则此模式将被拒绝。该设置不影响 ClawHub 安装。
  - Gateway 安装器模式：`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` 在 Gateway 主机上运行声明的 `metadata.openclaw.install` 操作。
- 操作员可以调用 `skills.update`（`operator.admin`）以两种模式：
  - ClawHub 模式更新一个跟踪的 slug 或默认 Agent workspace 中所有跟踪的 ClawHub 安装。
  - 配置模式修补 `skills.entries.<skillKey>` 值，如 `enabled`、`apiKey` 和 `env`。

### `models.list` 视图

`models.list` 接受可选的 `view` 参数：

- 省略或 `"default"`：当前运行时行为。如果配置了 `agents.defaults.models`，响应是允许的目录，包括 `provider/*` 条目的动态发现模型。否则响应是完整的 Gateway 目录。
- `"configured"`：选择器大小的行为。如果配置了 `agents.defaults.models`，它仍然优先，包括 `provider/*` 条目的 Provider 范围发现。没有允许列表时，响应使用显式的 `models.providers.*.models` 条目，仅在没有配置模型行时回退到完整目录。
- `"all"`：完整的 Gateway 目录，绕过 `agents.defaults.models`。用于诊断和发现 UI，不用于正常的模型选择器。

## Exec 审批

- 当 exec 请求需要审批时，Gateway 广播 `exec.approval.requested`。
- 操作员客户端通过调用 `exec.approval.resolve` 来解决（需要 `operator.approvals` 范围）。
- 对于 `host=node`，`exec.approval.request` 必须包含 `systemRunPlan`（规范的 `argv`/`cwd`/`rawCommand`/Session 元数据）。缺少 `systemRunPlan` 的请求会被拒绝。
- 批准后，转发的 `node.invoke system.run` 调用将该规范 `systemRunPlan` 作为权威命令/cwd/Session 上下文重用。
- 如果调用者在准备和最终批准的 `system.run` 转发之间修改了 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 会拒绝运行而不是信任修改后的负载。

## Agent 交付回退

- `agent` 请求可以包含 `deliver=true` 以请求出站交付。
- `bestEffortDeliver=false` 保持严格行为：未解析或仅内部交付目标返回 `INVALID_REQUEST`。
- `bestEffortDeliver=true` 在无法解析外部可交付路由时（例如内部/webchat Session 或不明确的多 Channel 配置）允许回退到仅 Session 执行。
- 最终 `agent` 结果在请求交付时可能包含 `result.deliveryStatus`，使用与 [`openclaw agent --json --deliver`](/cli/agent#json-delivery-status) 中记录的相同 `sent`、`suppressed`、`partial_failed` 和 `failed` 状态。

## 版本控制

- `PROTOCOL_VERSION` 位于 `src/gateway/protocol/version.ts` 中。
- 客户端发送 `minProtocol` + `maxProtocol`；服务器拒绝不包含其当前协议的范围。当前客户端和服务器需要协议 v4。
- Schema + models 从 TypeBox 定义生成：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 客户端常量

`src/gateway/client.ts` 中的参考客户端使用这些默认值。这些值在协议 v4 中保持稳定，是第三方客户端的预期基线。

| 常量                                      | 默认值                                                    | 来源                                                                                       |
| ----------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                       | `src/gateway/protocol/version.ts`                                                          |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                       | `src/gateway/protocol/version.ts`                                                          |
| 请求超时（每个 RPC）                      | `30_000` ms                                               | `src/gateway/client.ts`（`requestTimeoutMs`）                                              |
| 预认证/连接挑战超时                       | `15_000` ms                                               | `src/gateway/handshake-timeouts.ts`（配置/环境可以提高配对的服务器/客户端预算）            |
| 初始重连退避                              | `1_000` ms                                                | `src/gateway/client.ts`（`backoffMs`）                                                     |
| 最大重连退避                              | `30_000` ms                                               | `src/gateway/client.ts`（`scheduleReconnect`）                                             |
| 设备令牌关闭后的快速重试限制              | `250` ms                                                  | `src/gateway/client.ts`                                                                    |
| `terminate()` 前强制停止宽限              | `250` ms                                                  | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 默认超时                  | `1_000` ms                                                | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 默认 tick 间隔（`hello-ok` 前）           | `30_000` ms                                               | `src/gateway/client.ts`                                                                    |
| Tick 超时关闭                             | 静默超过 `tickIntervalMs * 2` 时代码 `4000`               | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`（25 MB）                               | `src/gateway/server-constants.ts`                                                          |

服务器在 `hello-ok` 中通告有效的 `policy.tickIntervalMs`、`policy.maxPayload` 和 `policy.maxBufferedBytes`；客户端应遵循这些值而不是握手前的默认值。

## 认证

- 共享密钥 Gateway 认证使用 `connect.params.auth.token` 或 `connect.params.auth.password`，取决于已配置的认证模式。
- 身份承载模式（如 Tailscale Serve（`gateway.auth.allowTailscale: true`）或非回环 `gateway.auth.mode: "trusted-proxy"`）从请求头而不是 `connect.params.auth.*` 满足 connect 认证检查。
- 私有入口 `gateway.auth.mode: "none"` 完全跳过共享密钥 connect 认证；不要在公共/不受信任的入口暴露该模式。
- 配对后，Gateway 发出范围为连接角色 + 范围的**设备令牌**。它在 `hello-ok.auth.deviceToken` 中返回，客户端应持久化以供将来连接使用。
- 客户端应在任何成功 connect 后持久化主要的 `hello-ok.auth.deviceToken`。
- 使用该**存储的**设备令牌重新连接还应重用为该令牌存储的已批准范围集。这保留了已授予的读取/探测/状态访问权限，并避免无声地将重连折叠为更窄的隐式仅管理员范围。
- 客户端端 connect 认证组装（`src/gateway/client.ts` 中的 `selectConnectAuth`）：
  - `auth.password` 是正交的，始终在设置时转发。
  - `auth.token` 按优先级顺序填充：首先是明确的共享令牌，然后是明确的 `deviceToken`，然后是存储的每设备令牌（按 `deviceId` + `role` 键控）。
  - `auth.bootstrapToken` 仅在上述均未解析 `auth.token` 时发送。共享令牌或任何已解析的设备令牌会抑制它。
  - 在一次性 `AUTH_TOKEN_MISMATCH` 重试中自动提升存储的设备令牌仅限于**受信任端点** —— 回环，或带有固定 `tlsFingerprint` 的 `wss://`。未固定的公共 `wss://` 不符合条件。
- 内置设置码引导仅返回主要节点 `hello-ok.auth.deviceToken`；客户端不能期望 `hello-ok.auth.deviceTokens` 中有额外的操作员令牌。
- 当内置设置码引导等待批准时，`PAIRING_REQUIRED` 详细信息包含 `recommendedNextStep: "wait_then_retry"`、`retryable: true` 和 `pauseReconnect: false`。客户端应继续使用相同的引导令牌重新连接，直到请求被批准或令牌变为无效。
- 如果旧版或自定义受信任的引导流程包含可选的 `hello-ok.auth.deviceTokens` 条目，仅在 connect 在受信任传输（如 `wss://` 或回环/本地配对）上使用引导认证时才持久化它们。
- 如果客户端提供了**明确的** `deviceToken` 或明确的 `scopes`，该调用者请求的范围集保持权威；缓存范围仅在客户端重用存储的每设备令牌时才重用。
- 设备令牌可以通过 `device.token.rotate` 和 `device.token.revoke` 轮换/撤销（需要 `operator.pairing` 范围）。
- `device.token.rotate` 返回轮换元数据。它仅对已使用该设备令牌进行身份验证的同设备调用回显替换的承载令牌，以便仅令牌的客户端在重新连接之前可以持久化其替换。共享/管理员轮换不回显承载令牌。
- 令牌颁发、轮换和撤销保持在该设备配对条目中记录的已批准角色集的范围内；令牌变更不能扩展或针对配对批准从未授予的设备角色。
- 对于配对设备令牌 Session，设备管理是自范围的，除非调用者也有 `operator.admin`：非管理员调用者只能移除/撤销/轮换他们**自己的**设备条目。
- `device.token.rotate` 和 `device.token.revoke` 还检查目标操作员令牌范围集与调用者当前 Session 范围。非管理员调用者不能轮换或撤销比他们已持有的更广泛的操作员令牌。
- 认证失败包含 `error.details.code` 加上恢复提示：
  - `error.details.canRetryWithDeviceToken`（布尔值）
  - `error.details.recommendedNextStep`（`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` 的客户端行为：
  - 受信任的客户端可以尝试一次使用缓存的每设备令牌进行有界重试。
  - 如果该重试失败，客户端应停止自动重连循环并呈现操作员操作指导。
- `AUTH_SCOPE_MISMATCH` 意味着设备令牌已被识别但不涵盖请求的角色/范围。客户端不应将其呈现为无效令牌；提示操作员重新配对或批准更窄/更广的范围契约。

## 设备身份 + 配对

- 节点应包含从密钥对指纹派生的稳定设备身份（`device.id`）。
- Gateway 为每个设备 + 角色发出令牌。
- 除非启用了本地自动审批，否则新设备 ID 需要配对审批。
- 配对自动审批以直接本地回环连接为中心。
- OpenClaw 也有一个窄的后端/容器本地自连接路径，用于受信任的共享密钥辅助流程。
- 同一主机的 tailnet 或 LAN 连接仍被视为远程，用于配对，需要批准。
- WS 客户端通常在 `connect` 时包含 `device` 身份（操作员 + 节点）。唯一的无设备操作员例外是显式信任路径：
  - `gateway.controlUi.allowInsecureAuth=true` 仅用于本地回环不安全 HTTP 兼容性。
  - 成功的 `gateway.auth.mode: "trusted-proxy"` 操作员 Control UI 认证。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（紧急方案，严重安全降级）。
  - 使用共享 Gateway token/password 进行身份验证的直接回环 `gateway-client` 后端 RPC。
- 所有连接必须签署服务器提供的 `connect.challenge` nonce。

### 设备认证迁移诊断

对于仍使用预挑战签名行为的旧版客户端，`connect` 现在在 `error.details.code` 下返回 `DEVICE_AUTH_*` 详细代码，带有稳定的 `error.details.reason`。

常见迁移失败：

| 消息                        | details.code                     | details.reason           | 含义                                              |
| --------------------------- | -------------------------------- | ------------------------ | ------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 客户端省略了 `device.nonce`（或发送为空）。       |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 客户端使用陈旧/错误的 nonce 签名。               |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 签名负载与 v2 负载不匹配。                       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 签名时间戳超出允许的偏差。                       |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` 与公钥指纹不匹配。                   |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公钥格式/规范化失败。                            |

迁移目标：

- 始终等待 `connect.challenge`。
- 签署包含服务器 nonce 的 v2 负载。
- 在 `connect.params.device.nonce` 中发送相同的 nonce。
- 首选签名负载是 `v3`，它除了 device/client/role/scopes/token/nonce 字段外还绑定 `platform` 和 `deviceFamily`。
- 旧版 `v2` 签名仍被接受以保持兼容性，但配对设备元数据固定仍在重连时控制命令策略。

## TLS + 固定

- WS 连接支持 TLS。
- 客户端可以选择固定 Gateway 证书指纹（参见 `gateway.tls` 配置加上 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

## 范围

此协议公开**完整的 Gateway API**（状态、Channel、模型、聊天、Agent、Session、节点、审批等）。确切的表面由 `src/gateway/protocol/schema.ts` 中的 TypeBox schema 定义。

## 相关

- [Bridge 协议](/gateway/bridge-protocol)
- [Gateway 服务手册](/gateway)
