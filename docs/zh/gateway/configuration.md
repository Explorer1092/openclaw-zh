---
mmh3_hash: "8eb0700015100dedbd992acef8149d21"
summary: "配置概览:常见任务、快速设置以及完整参考文档的链接"
read_when:
  - 首次设置 OpenClaw
  - 查找常见配置模式
  - 导航到特定配置部分
title: "配置"
---

# 配置

OpenClaw 从 `~/.openclaw/openclaw.json` 读取一个可选的 <Tooltip tip="JSON5 支持注释和尾随逗号">**JSON5**</Tooltip> 配置文件。

如果文件缺失,OpenClaw 使用安全的默认值。添加配置的常见原因:

- 连接 Channel 并控制谁可以向 bot 发送消息
- 设置模型、工具、沙盒或自动化(Cron、Hook)
- 调整 Session、媒体、网络或 UI

请参阅[完整参考文档](/gateway/configuration-reference)了解所有可用字段。

<Tip>
**配置新手?** 从 `openclaw onboard` 开始进行交互式设置,或查看[配置示例](/gateway/configuration-examples)指南获取完整的复制粘贴配置。
</Tip>

## 最小配置

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## 编辑配置

<Tabs>
  <Tab title="交互式向导">
    ```bash
    openclaw onboard       # 完整设置向导
    openclaw configure     # 配置向导
    ```
  </Tab>
  <Tab title="CLI (一行命令)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    打开 [http://127.0.0.1:18789](http://127.0.0.1:18789) 并使用 **Config** 标签页。
    Control UI 从实时配置 schema 渲染表单，包含字段 `title` / `description` 文档元数据，以及在可用时包含插件和 Channel schema，并以 **Raw JSON** 编辑器作为备选方案。如需下探 UI 和其他工具，Gateway 还公开 `config.schema.lookup` 以获取一个路径范围的 schema 节点加上直接子摘要。
  </Tab>
  <Tab title="直接编辑">
    直接编辑 `~/.openclaw/openclaw.json`。Gateway 会监视文件并自动应用更改(参见[热重载](#config-hot-reload))。
  </Tab>
</Tabs>

## 严格验证

<Warning>
OpenClaw 只接受完全符合架构的配置。未知键、格式错误的类型或无效值会导致 Gateway **拒绝启动**。唯一的根级别例外是 `$schema`(字符串),以便编辑器可以附加 JSON Schema 元数据。
</Warning>

Schema 工具说明：

- `openclaw config schema` 输出 Control UI 和配置验证使用的相同 JSON Schema 系列。
- 将该 schema 输出视为 `openclaw.json` 的规范机器可读契约；本概览和配置参考对其进行了总结。
- 字段 `title` 和 `description` 值会被携带到 schema 输出中，供编辑器和表单工具使用。
- 嵌套对象、通配符（`*`）和数组项（`[]`）条目在存在匹配字段文档时继承相同的文档元数据。
- `anyOf` / `oneOf` / `allOf` 组合分支同样继承相同的文档元数据，因此联合/交叉变体保留相同的字段帮助信息。
- `config.schema.lookup` 返回一个带有浅层 schema 节点（`title`、`description`、`type`、`enum`、`const`、常见边界及类似验证字段）、匹配 UI 提示元数据和即时子摘要的规范化配置路径，供下探工具使用。
- 当 gateway 可以加载当前清单注册表时，运行时插件/channel schema 会被合并进来。
- `pnpm config:docs:check` 检测文档面向的配置基线工件与当前 schema 表面之间的漂移。

当验证失败时：

- Gateway 不会启动
- 只有诊断命令可用（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 运行 `openclaw doctor` 查看具体问题
- 运行 `openclaw doctor --fix`（或 `--yes`）应用修复

## 常见任务

<AccordionGroup>
  <Accordion title="设置 Channel(WhatsApp、Telegram、Discord 等)">
    每个 Channel 在 `channels.<provider>` 下有自己的配置部分。请参阅专门的 Channel 页面了解设置步骤:

    - [WhatsApp](/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/channels/telegram) — `channels.telegram`
    - [Discord](/channels/discord) — `channels.discord`
    - [Feishu](/channels/feishu) — `channels.feishu`
    - [Google Chat](/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/channels/msteams) — `channels.msteams`
    - [Slack](/channels/slack) — `channels.slack`
    - [Signal](/channels/signal) — `channels.signal`
    - [iMessage](/channels/imessage) — `channels.imessage`
    - [Mattermost](/channels/mattermost) — `channels.mattermost`

    所有 Channel 共享相同的 DM 策略模式:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // 仅用于 allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="选择和配置模型">
    设置主模型和可选的备用模型:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` 定义模型目录并作为 `/model` 的允许列表。
    - 模型引用使用 `provider/model` 格式(例如 `anthropic/claude-opus-4-6`)。
    - `agents.defaults.imageMaxDimensionPx` 控制转录/工具图像缩放（默认 `1200`）；在截图密集的运行中，较低的值通常可以减少视觉 token 使用量。
    - 参见[模型 CLI](/concepts/models)了解在聊天中切换模型,参见[模型故障转移](/concepts/model-failover)了解认证轮换和备用行为。
    - 对于自定义/自托管提供商,请参阅参考文档中的[自定义提供商](/gateway/configuration-reference#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="控制谁可以向 bot 发送消息">
    DM 访问通过 `dmPolicy` 按 Channel 控制:

    - `"pairing"`(默认):未知发送者获得一次性配对代码以供批准
    - `"allowlist"`:仅 `allowFrom` 中的发送者(或配对允许存储)
    - `"open"`:允许所有入站 DM(需要 `allowFrom: ["*"]`)
    - `"disabled"`:忽略所有 DM

    对于群组,使用 `groupPolicy` + `groupAllowFrom` 或特定于 Channel 的允许列表。

    参见[完整参考文档](/gateway/configuration-reference#dm-and-group-access)了解每个 Channel 的详细信息。

  </Accordion>

  <Accordion title="设置群聊提及门控">
    群组消息默认**需要提及**。按 Agent 配置模式:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **元数据提及**:原生 @-提及(WhatsApp 点击提及、Telegram @bot 等)
    - **文本模式**:`mentionPatterns` 中的正则表达式模式
    - 参见[完整参考文档](/gateway/configuration-reference#group-chat-mention-gating)了解每个 Channel 的覆盖和自聊模式。

  </Accordion>

  <Accordion title="按 Agent 限制技能">
    使用 `agents.defaults.skills` 作为共享基准，然后用 `agents.list[].skills` 覆盖特定 Agent：

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // 继承 github、weather
          { id: "docs", skills: ["docs-search"] }, // 替换默认值
          { id: "locked-down", skills: [] }, // 无技能
        ],
      },
    }
    ```

    - 省略 `agents.defaults.skills` 则默认不限制技能。
    - 省略 `agents.list[].skills` 则继承默认值。
    - 设置 `agents.list[].skills: []` 则无技能。
    - 参见 [Skills](/tools/skills)、[Skills 配置](/tools/skills-config) 和[配置参考文档](/gateway/configuration-reference#agentsdefaultsskills)。

  </Accordion>

  <Accordion title="调整 Gateway Channel 健康监控">
    控制 Gateway 重启看起来陈旧的 Channel 的积极程度:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - 设置 `gateway.channelHealthCheckMinutes: 0` 以全局禁用健康监控重启。
    - `channelStaleEventThresholdMinutes` 应大于或等于检查间隔。
    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled` 禁用一个 Channel 或账户的自动重启,而不禁用全局监控。
    - 参见[健康检查](/gateway/health)进行操作调试,参见[完整参考文档](/gateway/configuration-reference#gateway)了解所有字段。

  </Accordion>

  <Accordion title="配置 Session 和重置">
    Session 控制对话连续性和隔离:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // 推荐用于多用户
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main`(共享) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: 线程绑定 Session 路由的全局默认值（Discord 支持 `/focus`、`/unfocus`、`/agents`、`/session idle` 和 `/session max-age`）。
    - 参见[Session 管理](/concepts/session)了解范围、身份链接和发送策略。
    - 参见[完整参考文档](/gateway/configuration-reference#session)了解所有字段。

  </Accordion>

  <Accordion title="启用沙盒">
    在隔离的 Docker 容器中运行 Agent Session:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    首先构建镜像:`scripts/sandbox-setup.sh`

    参见[沙盒](/gateway/sandboxing)完整指南和[完整参考文档](/gateway/configuration-reference#sandbox)了解所有选项。

  </Accordion>

  <Accordion title="为官方 iOS 构建启用中继支持的推送">
    中继支持的推送在 `openclaw.json` 中配置。

    在 Gateway 配置中设置:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // 可选。默认: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    CLI 等效命令:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    功能说明:

    - 让 Gateway 通过外部中继发送 `push.test`、唤醒通知和重连唤醒。
    - 使用由配对 iOS 应用转发的注册范围发送授权。Gateway 不需要全部署的中继令牌。
    - 将每个中继支持的注册绑定到 iOS 应用配对的 Gateway 身份,因此其他 Gateway 无法重用存储的注册。
    - 保持本地/手动 iOS 构建使用直接 APNs。中继支持的发送仅适用于通过中继注册的官方分发构建。
    - 必须与官方/TestFlight iOS 构建中内置的中继基础 URL 匹配,以便注册和发送流量到达同一中继部署。

    端到端流程:

    1. 安装使用相同中继基础 URL 编译的官方/TestFlight iOS 构建。
    2. 在 Gateway 上配置 `gateway.push.apns.relay.baseUrl`。
    3. 将 iOS 应用与 Gateway 配对,让节点和操作员 Session 都连接。
    4. iOS 应用获取 Gateway 身份,使用 App Attest 加应用收据向中继注册,然后将中继支持的 `push.apns.register` 负载发布到配对的 Gateway。
    5. Gateway 存储中继句柄和发送授权,然后将它们用于 `push.test`、唤醒通知和重连唤醒。

    操作注意事项:

    - 如果您将 iOS 应用切换到不同的 Gateway,请重新连接应用,以便它可以发布绑定到该 Gateway 的新中继注册。
    - 如果您发布指向不同中继部署的新 iOS 构建,应用会刷新其缓存的中继注册,而不是重用旧的中继来源。

    兼容性说明:

    - `OPENCLAW_APNS_RELAY_BASE_URL` 和 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍然作为临时环境变量覆盖有效。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍然是仅限回环的开发应急方案;请勿在配置中持久化 HTTP 中继 URL。

    参见 [iOS 应用](/platforms/ios#relay-backed-push-for-official-builds)了解端到端流程,参见[认证和信任流程](/platforms/ios#authentication-and-trust-flow)了解中继安全模型。

  </Accordion>

  <Accordion title="设置 Heartbeat(定期检查)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`：持续时间字符串（`30m`、`2h`）。设置 `0m` 禁用。
    - `target`：`last` | `none` | `<channel-id>`（例如 `discord`、`matrix`、`telegram` 或 `whatsapp`）
    - `directPolicy`：`allow`（默认）或 `block`，用于 DM 风格的 heartbeat 目标
    - 参见[Heartbeat](/gateway/heartbeat)完整指南。

  </Accordion>

  <Accordion title="配置 Cron 作业">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`:从 `sessions.json` 中清理已完成的独立运行 Session(默认 `24h`;设置 `false` 禁用)。
    - `runLog`:按大小和保留行数清理 `cron/runs/<jobId>.jsonl`。
    - 参见[Cron 作业](/automation/cron-jobs)功能概览和 CLI 示例。

  </Accordion>

  <Accordion title="设置 Webhook(Hook)">
    在 Gateway 上启用 HTTP Webhook 端点:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    安全注意事项：
    - 将所有 hook/webhook 负载内容视为不可信输入。
    - 使用专用的 `hooks.token`；不要复用共享 Gateway token。
    - Hook 认证仅限请求头（`Authorization: Bearer ...` 或 `x-openclaw-token`）；查询字符串 token 会被拒绝。
    - `hooks.path` 不能为 `/`；webhook 入口应保留在专用子路径（如 `/hooks`）上。
    - 除非进行严格范围的调试，否则请禁用不安全内容绕过标志（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`）。
    - 如果启用了 `hooks.allowRequestSessionKey`，还需设置 `hooks.allowedSessionKeyPrefixes` 以限制调用者选择的 Session 键范围。
    - 对于 hook 驱动的 Agent，建议使用强大的现代模型级别和严格的工具策略（例如，尽可能仅消息传递加沙盒）。

    参见[完整参考文档](/gateway/configuration-reference#hooks)了解所有映射选项和 Gmail 集成。

  </Accordion>

  <Accordion title="配置多 Agent 路由">
    运行具有独立工作空间和 Session 的多个隔离 Agent:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    参见[多 Agent](/concepts/multi-agent)和[完整参考文档](/gateway/configuration-reference#multi-agent-routing)了解绑定规则和每个 Agent 的访问配置文件。

  </Accordion>

  <Accordion title="将配置拆分为多个文件($include)">
    使用 `$include` 组织大型配置:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **单个文件**:替换包含的对象
    - **文件数组**:按顺序深度合并(后者优先)
    - **同级键**:在包含后合并(覆盖包含的值)
    - **嵌套包含**:支持最多 10 层深度
    - **相对路径**:相对于包含文件解析
    - **错误处理**:清晰的错误提示,包括缺失文件、解析错误和循环包含

  </Accordion>
</AccordionGroup>

## 配置热重载 {#config-hot-reload}

Gateway 监视 `~/.openclaw/openclaw.json` 并自动应用更改 — 大多数设置无需手动重启。

### 重载模式

| 模式                   | 行为                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**(默认) | 立即热应用安全更改。自动重启以应用关键更改。           |
| **`hot`**              | 仅热应用安全更改。当需要重启时记录警告 — 由您处理。 |
| **`restart`**          | 在任何配置更改时重启 Gateway,无论是否安全。                                 |
| **`off`**              | 禁用文件监视。更改在下次手动重启时生效。                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 什么可以热应用,什么需要重启

大多数字段可以热应用而无需停机。在 `hybrid` 模式下,需要重启的更改会自动处理。

| 类别            | 字段                                                               | 需要重启? |
| ------------------- | -------------------------------------------------------------------- | --------------- |
| Channel            | `channels.*`、`web`(WhatsApp) — 所有内置和扩展 Channel | 否              |
| Agent 和模型      | `agent`、`agents`、`models`、`routing`                               | 否              |
| 自动化          | `hooks`、`cron`、`agent.heartbeat`                                   | 否              |
| Session 和消息 | `session`、`messages`                                                | 否              |
| 工具和媒体       | `tools`、`browser`、`skills`、`audio`、`talk`                        | 否              |
| UI 和其他           | `ui`、`logging`、`identity`、`bindings`                              | 否              |
| Gateway 服务器      | `gateway.*`(端口、绑定、认证、Tailscale、TLS、HTTP)                 | **是**         |
| 基础设施      | `discovery`、`canvasHost`、`plugins`                                 | **是**         |

<Note>
`gateway.reload` 和 `gateway.remote` 是例外 — 更改它们**不会**触发重启。
</Note>

## 配置 RPC（编程更新）

<Note>
控制平面写入 RPC（`config.apply`、`config.patch`、`update.run`）对每个 `deviceId+clientIp` 限速为**每 60 秒 3 次请求**。当达到限制时，RPC 返回 `UNAVAILABLE` 并附带 `retryAfterMs`。
</Note>

安全/默认流程：

- `config.schema.lookup`：检查一个路径范围的配置子树，包含浅层 schema 节点、匹配的提示元数据和即时子摘要
- `config.get`：获取当前快照 + 哈希
- `config.patch`：首选的部分更新路径
- `config.apply`：仅用于完整配置替换
- `update.run`：显式自我更新 + 重启

当不替换整个配置时，优先使用 `config.schema.lookup` 然后 `config.patch`。

<AccordionGroup>
  <Accordion title="config.apply(完整替换)">
    验证 + 写入完整配置并在一步中重启 Gateway。

    <Warning>
    `config.apply` 替换**整个配置**。使用 `config.patch` 进行部分更新,或使用 `openclaw config set` 更改单个键。
    </Warning>

    参数:

    - `raw`(字符串) — 整个配置的 JSON5 负载
    - `baseHash`(可选) — 来自 `config.get` 的配置哈希(配置存在时必需)
    - `sessionKey`(可选) — 用于重启后唤醒 ping 的 Session 键
    - `note`(可选) — 重启哨兵的注释
    - `restartDelayMs`(可选) — 重启前的延迟(默认 2000)

    当某次重启已在挂起/进行中时,重启请求会被合并,且两次重启周期之间有 30 秒的冷却期。

    ```bash
    openclaw gateway call config.get --params '{}'  # 捕获 payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch(部分更新)">
    将部分更新合并到现有配置中(JSON merge patch 语义):

    - 对象递归合并
    - `null` 删除键
    - 数组替换

    参数:

    - `raw`(字符串) — 仅包含要更改的键的 JSON5
    - `baseHash`(必需) — 来自 `config.get` 的配置哈希
    - `sessionKey`、`note`、`restartDelayMs` — 与 `config.apply` 相同

    重启行为与 `config.apply` 相同:合并待处理的重启请求,以及重启周期之间 30 秒的冷却期。

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## 环境变量

OpenClaw 从父进程读取环境变量,以及:

- 当前工作目录中的 `.env`(如果存在)
- `~/.openclaw/.env`(全局备用)

这两个文件都不会覆盖现有的环境变量。您还可以在配置中设置内联环境变量:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell 环境导入(可选)">
  如果启用且预期的键未设置,OpenClaw 会运行您的登录 Shell 并仅导入缺失的键:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

环境变量等效项:`OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="配置值中的环境变量替换">
  使用 `${VAR_NAME}` 在任何配置字符串值中引用环境变量:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

规则:

- 仅匹配大写名称:`[A-Z_][A-Z0-9_]*`
- 缺失/空变量在加载时抛出错误
- 使用 `$${VAR}` 转义以获得字面输出
- 在 `$include` 文件中工作
- 内联替换:`"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs(env、file、exec)">
  对于支持 SecretRef 对象的字段,您可以使用:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "nano-banana-pro": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/nano-banana-pro/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

SecretRef 详情(包括 `env`/`file`/`exec` 的 `secrets.providers`)请参见 [Secrets 管理](/gateway/secrets)。
支持的凭证路径列在 [SecretRef Credential Surface](/reference/secretref-credential-surface) 中。
</Accordion>

参见[环境](/help/environment)了解完整的优先级和来源。

## 完整参考文档

有关逐个字段的完整参考,请参阅 **[配置参考文档](/gateway/configuration-reference)**。

---

_相关:[配置示例](/gateway/configuration-examples) · [配置参考文档](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_
