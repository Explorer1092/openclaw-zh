---
title: "Control UI (浏览器)"
sidebarTitle: "Control UI"
mmh3_hash: "444cd171b180725e5b27d0022d61b409"
summary: "Gateway 的基于浏览器的 Control UI（聊天、Node、配置）"
read_when:
  - 您想从浏览器操作 Gateway
  - 您想要 Tailnet 访问而不使用 SSH 隧道
---

Control UI 是由 Gateway 提供的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它**直接与同一端口上的 Gateway WebSocket 通信**。

## 快速打开（本地）

如果 Gateway 在同一台计算机上运行，打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面加载失败，先启动 Gateway：`openclaw gateway`。

认证在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时的 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时的可信代理身份标头

仪表板设置面板为当前浏览器标签会话和所选 Gateway URL 保留令牌；密码不会被持久化。入门通常会在首次连接时为共享密钥认证生成 Gateway 令牌，但当 `gateway.auth.mode` 为 `"password"` 时，密码认证也有效。

## 设备配对（首次连接）

从新浏览器或设备连接到 Control UI 时，Gateway 通常需要**一次性配对批准**。这是防止未经授权访问的安全措施。

**您会看到：** "disconnected (1008): pairing required"

<Steps>
  <Step title="列出待处理请求">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="按请求 ID 批准">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

如果浏览器以更改的认证详情（角色/范围/公钥）重试配对，之前的待处理请求将被取代，并创建新的 `requestId`。批准之前重新运行 `openclaw devices list`。

如果浏览器已配对，并且您将其从读取访问更改为写入/管理员访问，这将被视为批准升级，而不是静默重新连接。OpenClaw 保持旧批准活动，阻止更广泛的重新连接，并要求您明确批准新的范围集。

批准后，设备将被记住，不需要重新批准，除非您使用 `openclaw devices revoke --device <id> --role <role>` 撤销它。有关令牌轮换和撤销，请参阅 [设备 CLI](/cli/devices)。

<Note>
- 直接本地环回浏览器连接（`127.0.0.1` / `localhost`）会自动批准。
- 当 `gateway.auth.allowTailscale: true`，Tailscale 身份验证通过，且浏览器提供其设备身份时，Tailscale Serve 可以跳过 Control UI 操作员会话的配对往返。
- 直接 Tailnet 绑定、LAN 浏览器连接和没有设备身份的浏览器配置文件仍然需要明确批准。
- 每个浏览器配置文件生成唯一的设备 ID，因此切换浏览器或清除浏览器数据将需要重新配对。

</Note>

## 个人身份（浏览器本地）

Control UI 支持每浏览器的个人身份（显示名称和头像），附加到发出消息以便在共享会话中归因。它存储在浏览器存储中，范围限于当前浏览器配置文件，不会同步到其他设备或在您实际发送的消息的正常转录作者元数据之外持久化在服务器端。清除网站数据或切换浏览器会将其重置为空。

相同的浏览器本地模式适用于助手头像覆盖。上传的助手头像仅在本地浏览器上覆盖 Gateway 解析的身份，从不通过 `config.patch` 往返。共享的 `ui.assistant.avatar` 配置字段仍然可供直接写入该字段的非 UI 客户端使用（例如脚本 Gateway 或自定义仪表板）。

## 运行时配置端点

Control UI 从 `/__openclaw/control-ui-config.json` 获取其运行时设置。该端点受与 HTTP 界面其余部分相同的 Gateway 认证保护：未认证的浏览器无法获取它，成功获取需要已有效的 Gateway 令牌/密码、Tailscale Serve 身份或可信代理身份。

## 语言支持

Control UI 可以在首次加载时根据您的浏览器语言环境进行本地化。要稍后覆盖它，打开**概述 -> Gateway 访问 -> 语言**。语言选择器位于 Gateway 访问卡中，而不在外观下。

- 支持的语言环境：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英语翻译在浏览器中延迟加载。
- 所选语言环境保存在浏览器存储中，在未来访问时重用。
- 缺失的翻译键回退到英语。

文档翻译为相同的非英语语言环境集生成，但文档站点内置的 Mintlify 语言选择器仅限于 Mintlify 接受的语言环境代码。泰语（`th`）和波斯语（`fa`）文档仍在发布仓库中生成；在 Mintlify 支持这些代码之前，它们可能不会出现在该选择器中。

## 外观主题

外观面板保留内置的 Claw、Knot 和 Dash 主题，加上一个浏览器本地的 tweakcn 导入槽。要导入主题，打开 [tweakcn 编辑器](https://tweakcn.com/editor/theme)，选择或创建主题，点击**分享**，并将复制的主题链接粘贴到外观中。导入器还接受 `https://tweakcn.com/r/themes/<id>` 注册表 URL、编辑器 URL 如 `https://tweakcn.com/editor/theme?theme=amethyst-haze`、相对 `/themes/<id>` 路径、原始主题 ID 和默认主题名称如 `amethyst-haze`。

外观还包括浏览器本地的文本大小设置。该设置与其余 Control UI 首选项一起存储，适用于聊天文本、编辑器文本、工具卡片和聊天侧边栏，并将文本输入保持在至少 16px，以防移动端 Safari 在聚焦时自动缩放。

导入的主题仅存储在当前浏览器配置文件中。它们不会写入 Gateway 配置，也不会在设备间同步。替换导入的主题会更新一个本地插槽；清除它会在所选导入主题时将活动主题切换回 Claw。

## 功能（当前）

<AccordionGroup>
  <Accordion title="聊天和对讲">
    - 通过 Gateway WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 聊天历史刷新请求有界的最近窗口，带有每条消息的文本上限，以便大型会话不会强制浏览器在聊天变得可用之前渲染完整的转录负载。
    - 通过浏览器实时会话对讲。OpenAI 使用直接 WebRTC，Google Live 在 WebSocket 上使用受约束的一次性浏览器令牌，仅后端实时语音插件使用 Gateway relay 传输。客户端拥有的 provider 会话以 `talk.client.create` 开始；Gateway relay 会话以 `talk.session.create` 开始。relay 将 provider 凭据保留在 Gateway 上，而浏览器通过 `talk.session.appendAudio` 流式传输麦克风 PCM，并通过 `talk.client.toolCall` 转发 `openclaw_agent_consult` provider 工具调用，用于 Gateway 策略和更大的配置 OpenClaw 模型，并通过 `talk.client.steer` 或 `talk.session.steer` 路由活跃运行的语音引导。
    - 在聊天中流式传输工具调用 + 实时工具输出卡片（agent 事件）。
    - 聊天中的活动标签页，包含来自现有 `session.tool` / 工具事件交付的实时工具活动浏览器本地、脱敏优先摘要。

  </Accordion>
  <Accordion title="Channel、实例、会话、梦境">
    - Channel：内置加上捆绑/外部插件 Channel 状态、QR 登录和每 Channel 配置（`channels.status`、`web.login.*`、`config.patch`）。
    - Channel 探测刷新在慢速 provider 检查完成时保持之前的快照可见，当探测或审计超过其 UI 预算时，部分快照会被标记。
    - 实例：存在列表 + 刷新（`system-presence`）。
    - 会话：默认按配置的 agent 会话列出，从过时的未配置 agent 会话键回退，并应用每会话模型/思考/快速/详细/跟踪/推理覆盖（`sessions.list`、`sessions.patch`）。
    - 梦境：梦境状态、启用/禁用切换和梦境日记阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、技能、Node、执行批准">
    - Cron 作业：列表/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）。
    - 技能：状态、启用/禁用、安装、API 密钥更新（`skills.*`）。
    - Node：列表 + 能力（`node.list`）。
    - 执行批准：编辑 Gateway 或 node 允许列表 + `exec host=gateway/node` 的询问策略（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="配置">
    - 查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 应用 + 重启并验证（`config.apply`）并唤醒最后一个活动会话。
    - 写入包括基础哈希保护以防止覆盖并发编辑。
    - 写入（`config.set`/`config.apply`/`config.patch`）在提交的配置负载中预检活动 SecretRef 解析；未解析的活动提交引用在写入前被拒绝。
    - 表单保存会丢弃无法从已保存配置恢复的过时已脱敏占位符，同时保留仍映射到已保存密钥的已脱敏值。
    - Schema + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、即时子摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及在可用时的插件 + Channel schema）；仅当快照具有安全的原始往返时，才提供原始 JSON 编辑器。
    - 如果快照不能安全地往返原始文本，Control UI 强制使用表单模式并为该快照禁用原始模式。
    - 原始 JSON 编辑器"重置为已保存"保留原始编写的格式（格式化、注释、`$include` 布局），而不是重新渲染扁平化的快照，因此当快照可以安全往返时，外部编辑在重置后仍然存在。
    - 结构化 SecretRef 对象值在表单文本输入中以只读方式渲染，以防止意外的对象到字符串损坏。

  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：状态/健康/模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）。
    - 事件日志包括 Control UI 刷新/RPC 计时、慢速聊天/配置渲染计时，以及当浏览器公开这些 PerformanceObserver 条目类型时长动画帧或长任务的浏览器响应性条目。
    - 日志：带过滤/导出的 Gateway 文件日志实时尾随（`logs.tail`）。
    - 更新：运行包/git 更新 + 重启（`update.run`）并附带重启报告，然后在重新连接后轮询 `update.status` 以验证运行中的 Gateway 版本。

  </Accordion>
  <Accordion title="Cron 作业面板说明">
    - 对于隔离作业，交付默认为公告摘要。如果您想要仅内部运行，可以切换到无。
    - 选择公告时会出现 Channel/目标字段。
    - Webhook 模式使用 `delivery.mode = "webhook"`，`delivery.to` 设置为有效的 HTTP(S) webhook URL。
    - 对于主会话作业，可以使用 webhook 和无交付模式。
    - 高级编辑控件包括删除后运行、清除 agent 覆盖、cron 精确/随机选项、agent 模型/思考覆盖和尽力而为交付切换。
    - 表单验证内联显示字段级错误；无效值禁用保存按钮，直到修复。
    - 设置 `cron.webhookToken` 以发送专用的承载令牌，如果省略，webhook 将在没有认证标头的情况下发送。
    - 已弃用的回退：存储了 `notify: true` 的旧版作业可以在迁移之前继续使用 `cron.webhook`。

  </Accordion>
</AccordionGroup>

## 活动标签页

活动标签页是用于实时工具活动的临时浏览器本地观察者。它源自同一 Gateway `session.tool` / 工具事件流，该流也驱动聊天工具卡片；它不会添加另一个 Gateway 事件族、端点、持久活动存储、指标源或外部观察者流。

活动条目仅保留已净化的摘要和脱敏的、截断的输出预览。工具参数值不存储在活动状态中；UI 显示参数已隐藏，仅记录参数字段数。内存中的列表跟随当前浏览器标签页，在 Control UI 内导航时存活，在页面重新加载、会话切换或**清除**时重置。

## 聊天行为

<AccordionGroup>
  <Accordion title="发送和历史语义">
    - `chat.send` 是**非阻塞的**：它立即以 `{ runId, status: "started" }` 确认，响应通过 `chat` 事件流式传输。
    - 聊天上传接受图像加上非视频文件。图像保留原生图像路径；其他文件存储为托管媒体，并在历史中显示为附件链接。
    - 使用相同的 `idempotencyKey` 重新发送在运行时返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
    - `chat.history` 响应受大小限制以确保 UI 安全。当转录条目过大时，Gateway 可能会截断长文本字段，省略重型元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
    - 助手/生成的图像作为托管媒体引用持久化，并通过经过认证的 Gateway 媒体 URL 提供，因此重新加载不依赖于原始 base64 图像负载保留在聊天历史响应中。
    - 渲染 `chat.history` 时，Control UI 从可见助手文本中剥离仅显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和截断的工具调用块）和泄漏的 ASCII/全角模型控制令牌，并省略整个可见文本只是精确静默令牌 `NO_REPLY` / `no_reply` 或心跳确认令牌 `HEARTBEAT_OK` 的助手条目。
    - 在活动发送和最终历史刷新期间，如果 `chat.history` 短暂返回较旧的快照，聊天视图会保持本地乐观的用户/助手消息可见；一旦 Gateway 历史追上，规范转录就会替换那些本地消息。
    - 实时 `chat` 事件是交付状态，而 `chat.history` 是从持久会话转录重建的。工具最终事件后，Control UI 重新加载历史并仅合并一个小的乐观尾部；转录边界记录在 [WebChat](/web/webchat) 中。
    - `chat.inject` 将助手注释附加到会话转录，并广播 `chat` 事件以进行仅 UI 更新（无 agent 运行，无 Channel 交付）。
    - 聊天标头在会话选择器之前显示 agent 过滤器，会话选择器按所选 agent 限定范围。切换 agent 只显示与该 agent 关联的会话，并在尚无已保存的仪表板会话时回退到该 agent 的主会话。
    - 在桌面宽度上，聊天控件保持在一个紧凑行上，在向下滚动转录时折叠；向上滚动、返回顶部或到达底部时恢复控件。
    - 连续重复的纯文本消息以带计数徽章的单个气泡渲染。携带图像、附件、工具输出或 canvas 预览的消息不会折叠。
    - 聊天标头模型和思考选择器通过 `sessions.patch` 立即修补活动会话；它们是持久的会话覆盖，而不是仅一次发送选项。
    - 如果您在同一会话的模型选择器更改仍在保存时发送消息，编辑器会等待该会话修补完成后再调用 `chat.send`，以便发送使用所选模型。
    - 在 Control UI 中输入 `/new` 会创建并切换到与新聊天相同的新仪表板会话，除非配置了 `session.dmScope: "main"` 且当前父级是 agent 的主会话；在这种情况下，它会就地重置主会话。输入 `/reset` 保留 Gateway 对当前会话的显式就地重置。
    - 聊天模型选择器请求 Gateway 配置的模型视图。如果存在 `agents.defaults.models`，该允许列表驱动选择器，包括保持 provider 范围目录动态的 `provider/*` 条目。否则，选择器显示明确的 `models.providers.*.models` 条目以及具有可用认证的 provider。完整目录通过调试 `models.list` RPC 与 `view: "all"` 保持可用。
    - 当新鲜的 Gateway 会话使用报告包含当前上下文令牌时，聊天编辑区域显示紧凑的上下文使用指示器。它在高上下文压力下切换到警告样式，并在推荐的压缩级别上显示运行正常会话压缩路径的紧凑按钮。过时的令牌快照在 Gateway 再次报告新鲜使用之前被隐藏。

  </Accordion>
  <Accordion title="对讲模式（浏览器实时）">
    对讲模式使用注册的实时语音 provider。通过 `talk.realtime.provider: "openai"` 加上 `talk.realtime.providers.openai.apiKey`、`OPENAI_API_KEY` 或 `openai-codex` OAuth 配置文件配置 OpenAI；通过 `talk.realtime.provider: "google"` 加上 `talk.realtime.providers.google.apiKey` 配置 Google。浏览器从不接收标准 provider API 密钥。OpenAI 接收用于 WebRTC 的临时 Realtime 客户端密钥。Google Live 接收一次性受约束的 Live API 认证令牌，用于浏览器 WebSocket 会话，指令和工具声明锁定在 Gateway 中的令牌中。仅公开后端实时桥接的 Provider 通过 Gateway relay 传输运行，因此凭据和供应商套接字保留在服务器端，而浏览器音频通过经过认证的 Gateway RPC 移动。Realtime 会话提示由 Gateway 组装；`talk.client.create` 不接受调用者提供的指令覆盖。

    聊天编辑器在对讲开始/停止按钮旁边包含一个对讲选项按钮。这些选项应用于下一个对讲会话，可以覆盖 provider、传输、模型、语音、推理工作量、VAD 阈值、静音时长和前缀填充。当选项为空白时，Gateway 在可用时使用配置的默认值，或使用 provider 默认值。选择 Gateway relay 强制后端 relay 路径；选择 WebRTC 保持会话客户端拥有，如果 provider 无法创建浏览器会话，则失败而不是静默回退到 relay。

    在聊天编辑器中，对讲控件是麦克风听写按钮旁边的波形按钮。当对讲开始时，编辑器状态行显示 `Connecting Talk...`，然后在音频连接时显示 `Talk live`，或在实时工具调用通过 `talk.client.toolCall` 咨询配置的更大模型时显示 `Asking OpenClaw...`。

    维护者实时冒烟测试：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 验证 OpenAI 后端 WebSocket 桥、OpenAI 浏览器 WebRTC SDP 交换、Google Live 受约束令牌浏览器 WebSocket 设置，以及带有假麦克风媒体的 Gateway relay 浏览器适配器。该命令仅打印 provider 状态，不记录密钥。

  </Accordion>
  <Accordion title="停止和中止">
    - 点击**停止**（调用 `chat.abort`）。
    - 运行活动时，正常后续消息排队。在排队的消息上点击**引导**以将该后续消息注入到运行中的轮次。
    - 输入 `/stop`（或独立中止短语如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以带外中止。
    - `chat.abort` 支持 `{ sessionKey }`（无 `runId`）以中止该会话的所有活动运行。

  </Accordion>
  <Accordion title="中止部分保留">
    - 当运行被中止时，部分助手文本仍然可以在 UI 中显示。
    - 当存在缓冲输出时，Gateway 将中止的部分助手文本持久化到转录历史中。
    - 持久化条目包含中止元数据，以便转录消费者可以区分中止部分和正常完成输出。

  </Accordion>
</AccordionGroup>

## PWA 安装和 Web Push

Control UI 包含 `manifest.webmanifest` 和服务工作者，因此现代浏览器可以将其作为独立的 PWA 安装。Web Push 允许 Gateway 在标签页或浏览器窗口未打开时唤醒已安装的 PWA 并发送通知。

如果页面在 OpenClaw 更新后显示**协议不匹配**，请先用 `openclaw dashboard` 重新打开 Dashboard 并强制刷新页面。如果仍然失败，请清除 Dashboard 来源的站点数据，或在隐私浏览窗口中测试；旧的标签页或浏览器 Service Worker 缓存可能会让更新前的 Control UI 包继续对较新的 Gateway 运行。

| 界面 | 功能 |
| ---- | ---- |
| `ui/public/manifest.webmanifest` | PWA 清单。浏览器在可访问时提供"安装应用"。 |
| `ui/public/sw.js` | 处理 `push` 事件和通知点击的服务工作者。 |
| `push/vapid-keys.json`（在 OpenClaw 状态目录下） | 用于签署 Web Push 负载的自动生成 VAPID 密钥对。 |
| `push/web-push-subscriptions.json` | 持久化的浏览器订阅端点。 |

当您想要固定密钥时（用于多主机部署、密钥轮换或测试），通过 Gateway 进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认为 `https://openclaw.ai`）

Control UI 使用这些范围控制的 Gateway 方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` — 获取活动的 VAPID 公钥。
- `push.web.subscribe` — 注册 `endpoint` 加 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 删除已注册的端点。
- `push.web.test` — 向调用者的订阅发送测试通知。

<Note>
Web Push 独立于 iOS APNS relay 路径（有关 relay 支持的推送，请参阅 [配置](/gateway/configuration)）和现有的 `push.test` 方法，后者针对原生移动配对。
</Note>

## 托管嵌入

助手消息可以使用 `[embed ...]` 短代码内联渲染托管的 Web 内容。iframe 沙盒策略由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict（严格）">
    在托管嵌入内禁用脚本执行。
  </Tab>
  <Tab title="scripts（脚本，默认）">
    允许交互式嵌入，同时保持源隔离；这是默认值，通常对独立的浏览器游戏/小部件足够。
  </Tab>
  <Tab title="trusted（可信）">
    在 `allow-scripts` 之上添加 `allow-same-origin`，用于故意需要更强特权的同站文档。
  </Tab>
</Tabs>

示例：

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
仅当嵌入的文档确实需要同源行为时才使用 `trusted`。对于大多数 agent 生成的游戏和交互式 canvas，`scripts` 是更安全的选择。
</Warning>

默认情况下，绝对外部 `http(s)` 嵌入 URL 会被阻止。如果您有意希望 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天消息宽度

分组的聊天消息使用可读的默认最大宽度。宽屏监视器部署可以通过设置 `gateway.controlUi.chatMessageMaxWidth` 来覆盖它，而无需修补捆绑的 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

该值在到达浏览器之前经过验证。支持的值包括纯长度和百分比，如 `960px` 或 `82%`，以及受约束的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 宽度表达式。

## Tailnet 访问（推荐）

<Tabs>
  <Tab title="集成 Tailscale Serve（首选）">
    将 Gateway 保持在环回上，让 Tailscale Serve 使用 HTTPS 代理：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开：

    - `https://<magicdns>/`（或您配置的 `gateway.controlUi.basePath`）

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行认证。OpenClaw 通过使用 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与标头匹配来验证身份，且仅当请求通过 Tailscale 的 `x-forwarded-*` 标头到达环回时才接受这些。对于具有浏览器设备身份的 Control UI 操作员会话，此经过验证的 Serve 路径还会跳过设备配对往返；无设备身份的浏览器和 node 角色连接仍遵循正常的设备检查。如果您想要即使对于 Serve 流量也需要显式共享密钥凭据，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于该异步 Serve 身份路径，针对同一客户端 IP 和认证范围的失败认证尝试在速率限制写入之前被序列化。因此，来自同一浏览器的并发错误重试可能会在第二个请求上显示 `retry later`，而不是两个普通不匹配并行竞争。

    <Warning>
    无令牌 Serve 认证假定 Gateway 主机是可信的。如果不受信任的本地代码可能在该主机上运行，请要求令牌/密码认证。
    </Warning>

  </Tab>
  <Tab title="绑定到 tailnet + 令牌">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然后打开：

    - `http://<tailscale-ip>:18789/`（或您配置的 `gateway.controlUi.basePath`）

    将匹配的共享密钥粘贴到 UI 设置中（作为 `connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果您通过普通 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）打开仪表板，浏览器在**非安全上下文**中运行，并阻止 WebCrypto。默认情况下，OpenClaw **阻止**没有设备身份的 Control UI 连接。

记录的例外：

- 具有 `gateway.controlUi.allowInsecureAuth=true` 的仅本地环回不安全 HTTP 兼容性
- 通过 `gateway.auth.mode: "trusted-proxy"` 的成功操作员 Control UI 认证
- 紧急情况下的 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复：** 使用 HTTPS（Tailscale Serve）或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 Gateway 主机上）

<AccordionGroup>
  <Accordion title="不安全认证切换行为">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` 仅是本地兼容性切换：

    - 它允许本地主机 Control UI 会话在非安全 HTTP 上下文中不使用设备身份继续。
    - 它不会绕过配对检查。
    - 它不会放宽远程（非本地主机）设备身份要求。

  </Accordion>
  <Accordion title="仅供紧急使用">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` 禁用 Control UI 设备身份检查，是严重的安全降级。紧急使用后请迅速恢复。
    </Warning>

  </Accordion>
  <Accordion title="可信代理说明">
    - 成功的可信代理认证可以在没有设备身份的情况下允许**操作员** Control UI 会话。
    - 这**不**扩展到 node 角色 Control UI 会话。
    - 同主机环回反向代理仍然不满足可信代理认证；请参阅 [可信代理认证](/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

有关 HTTPS 设置指南，请参阅 [Tailscale](/gateway/tailscale)。

## 内容安全策略

Control UI 配备了严格的 `img-src` 策略：只允许**同源**资产、`data:` URL 和本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图像 URL 被浏览器拒绝，不会发出网络请求。

实际意义：

- 相对路径下提供的头像和图像（例如 `/avatars/<id>`）仍然渲染，包括 UI 获取并转换为本地 `blob:` URL 的经过认证的头像路由。
- 内联 `data:image/...` URL 仍然渲染（对于协议内负载很有用）。
- Control UI 创建的本地 `blob:` URL 仍然渲染。
- Channel 元数据发出的远程头像 URL 在 Control UI 的头像助手中被剥离，替换为内置的徽标/徽章，因此被破坏或恶意的 Channel 不能强制从操作员浏览器获取任意远程图像。

您不需要更改任何内容来获得此行为 — 它始终开启且不可配置。

## 头像路由认证

当配置了 Gateway 认证时，Control UI 头像端点需要与 API 其余部分相同的 Gateway 令牌：

- `GET /avatar/<agentId>` 仅向经过认证的调用者返回头像图像。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 任一路由的未认证请求都将被拒绝（与相邻的助手媒体路由匹配）。这防止头像路由在其他受保护的主机上泄露 agent 身份。
- Control UI 本身在获取头像时将 Gateway 令牌作为承载标头转发，并使用经过认证的 blob URL，以便图像仍然在仪表板中渲染。

如果您禁用 Gateway 认证（不推荐在共享主机上），头像路由也会变为未认证，与 Gateway 的其余部分一致。

## 助手媒体路由认证

当配置了 Gateway 认证时，助手本地媒体预览使用两步路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要正常的 Control UI 操作员认证。浏览器在检查可用性时将 Gateway 令牌作为承载标头发送。
- 成功的元数据响应包含限定到该精确源路径的短期 `mediaTicket`。
- 浏览器渲染的图像、音频、视频和文档 URL 使用 `mediaTicket=<ticket>` 而不是活动的 Gateway 令牌或密码。票据快速过期，不能授权不同的源。

这使得正常的媒体渲染与浏览器本机媒体元素兼容，而不会将可重用的 Gateway 凭据放在可见的媒体 URL 中。

## 构建 UI

Gateway 从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对基础（当您想要固定的资产 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（独立开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向您的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

## 空白 Control UI 页面

如果浏览器加载了空白的 Dashboard 且 DevTools 没有显示有用的错误，某个扩展或提前注入的内容脚本可能阻止了 JavaScript 模块应用的执行。静态页面包含一个纯 HTML 恢复面板，当启动后 `<openclaw-app>` 未注册时会显示出来。

在更改浏览器环境后使用面板的**重试**操作，或在以下检查之后手动重新加载：

- 禁用注入到所有页面的扩展，尤其是带有 `<all_urls>` 内容脚本的扩展。
- 尝试隐私窗口、干净的浏览器配置文件或其他浏览器。
- 保持 Gateway 运行，并在更改浏览器后用相同的 Dashboard URL 验证。

## 调试/测试：开发服务器 + 远程 Gateway

Control UI 是静态文件；WebSocket 目标是可配置的，可以与 HTTP 源不同。当您想要本地 Vite 开发服务器但 Gateway 在其他地方运行时，这很方便。

<Steps>
  <Step title="启动 UI 开发服务器">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="使用 gatewayUrl 打开">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    可选的一次性认证（如果需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="说明">
    - `gatewayUrl` 在加载后存储在 localStorage 中，并从 URL 中删除。
    - 如果您通过 `gatewayUrl` 传递完整的 `ws://` 或 `wss://` 端点，请对 `gatewayUrl` 值进行 URL 编码，以便浏览器正确解析查询字符串。
    - `token` 应尽可能通过 URL 片段（`#token=...`）传递。片段不发送到服务器，这避免了请求日志和 Referer 泄漏。旧版 `?token=` 查询参数仍然导入一次以实现兼容性，但仅作为回退，并在引导后立即剥离。
    - `password` 仅保存在内存中。
    - 设置 `gatewayUrl` 时，UI 不会回退到配置或环境凭据。明确提供 `token`（或 `password`）。缺少显式凭据是错误。
    - 当 Gateway 在 TLS 后面时使用 `wss://`（Tailscale Serve、HTTPS 代理等）。
    - `gatewayUrl` 仅在顶级窗口（未嵌入）中接受，以防止点击劫持。
    - 公共非环回 Control UI 部署必须明确设置 `gateway.controlUi.allowedOrigins`（完整的源）。来自环回、RFC1918/链路本地、`.local`、`.ts.net` 或 Tailscale CGNAT 主机的私有同源 LAN/Tailnet 加载可在不启用 Host 标头回退的情况下被接受。
    - Gateway 启动可能会从有效的运行时绑定和端口中生成本地源，如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但远程浏览器源仍然需要显式条目。
    - 不要使用 `gateway.controlUi.allowedOrigins: ["*"]`，除非用于严格控制的本地测试。它表示允许任何浏览器源，而不是"匹配我使用的任何主机"。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 启用主机标头源回退模式，但它是危险的安全模式。

  </Accordion>
</AccordionGroup>

示例：

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

远程访问设置详情：[远程访问](/gateway/remote)。

## 相关文档

- [Dashboard](/web/dashboard) — Gateway 仪表板
- [健康检查](/gateway/health) — Gateway 健康监控
- [TUI](/web/tui) — 终端用户界面
- [WebChat](/web/webchat) — 基于浏览器的聊天界面
