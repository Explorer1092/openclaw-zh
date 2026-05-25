---
mmh3_hash: "580137d90a3ae61f849dfce33451f273"
summary: "OpenClaw CLI 索引：命令列表、全局标志和各命令页面链接"
read_when:
  - 查找合适的 `openclaw` 子命令
  - 查看全局标志或输出样式规则
title: "CLI 参考"
---

`openclaw` 是主 CLI 入口。每个核心命令都有专属参考页，或与其别名命令一起记录；本索引列出命令、全局标志以及适用于整个 CLI 的输出样式规则。

按意图使用设置命令：

- `openclaw setup` 创建基础配置和工作区，无需完整的引导式入职流程。
- `openclaw onboard` 是针对 Gateway、模型身份验证、工作区、Channel、Skill 和健康的完整引导式首次运行路径。
- `openclaw configure` 更改现有设置的有针对性部分，如模型身份验证、Gateway、Channel、Plugin 或 Skill。
- `openclaw channels add` 在基础存在后配置 Channel 账户；不带标志运行以进行引导式 Channel 设置，或使用 Channel 特定标志用于脚本。

## 命令页面

| 区域                 | 命令                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 设置与入职 | [`crestodian`](/cli/crestodian) · [`setup`](/cli/setup) · [`onboard`](/cli/onboard) · [`configure`](/cli/configure) · [`config`](/cli/config) · [`completion`](/cli/completion) · [`doctor`](/cli/doctor) · [`dashboard`](/cli/dashboard)   |
| 重置与卸载  | [`backup`](/cli/backup) · [`reset`](/cli/reset) · [`uninstall`](/cli/uninstall) · [`update`](/cli/update)                                                                                                                                   |
| 消息与 Agent | [`message`](/cli/message) · [`agent`](/cli/agent) · [`agents`](/cli/agents) · [`acp`](/cli/acp) · [`mcp`](/cli/mcp)                                                                                                                         |
| 健康与 Session  | [`status`](/cli/status) · [`health`](/cli/health) · [`sessions`](/cli/sessions)                                                                                                                                                             |
| Gateway 与日志     | [`gateway`](/cli/gateway) · [`logs`](/cli/logs) · [`system`](/cli/system)                                                                                                                                                                   |
| 模型与推断 | [`models`](/cli/models) · [`infer`](/cli/infer) · `capability`（[`infer`](/cli/infer) 的别名）· [`memory`](/cli/memory) · [`commitments`](/cli/commitments) · [`wiki`](/cli/wiki)                                                            |
| 网络与 Node    | [`directory`](/cli/directory) · [`nodes`](/cli/nodes) · [`devices`](/cli/devices) · [`node`](/cli/node)                                                                                                                                     |
| 运行时与沙盒  | [`approvals`](/cli/approvals) · `exec-policy`（参见 [`approvals`](/cli/approvals)）· [`sandbox`](/cli/sandbox) · [`tui`](/cli/tui) · `chat`/`terminal`（[`tui --local`](/cli/tui) 的别名）· [`browser`](/cli/browser)                       |
| 自动化           | [`cron`](/cli/cron) · [`tasks`](/cli/tasks) · [`hooks`](/cli/hooks) · [`webhooks`](/cli/webhooks)                                                                                                                                           |
| 发现与文档   | [`dns`](/cli/dns) · [`docs`](/cli/docs)                                                                                                                                                                                                     |
| 配对与 Channel | [`pairing`](/cli/pairing) · [`qr`](/cli/qr) · [`channels`](/cli/channels)                                                                                                                                                                  |
| 安全与 Plugin | [`security`](/cli/security) · [`secrets`](/cli/secrets) · [`skills`](/cli/skills) · [`plugins`](/cli/plugins) · [`proxy`](/cli/proxy)                                                                                                       |
| 旧版别名       | [`daemon`](/cli/daemon)（Gateway 服务）· [`clawbot`](/cli/clawbot)（命名空间）                                                                                                                                                              |
| Plugin（可选）   | [`meeting-notes`](/cli/meeting-notes) · [`path`](/cli/path) · [`policy`](/cli/policy) · [`voicecall`](/cli/voicecall)（如已安装）                                                                                                            |

## 全局标志

| 标志                    | 用途                                                                    |
| ----------------------- | ----------------------------------------------------------------------- |
| `--dev`                 | 将状态隔离在 `~/.openclaw-dev` 下并移动默认端口                         |
| `--profile <name>`      | 将状态隔离在 `~/.openclaw-<name>` 下                                    |
| `--container <name>`    | 以命名容器为目标执行                                                    |
| `--no-color`            | 禁用 ANSI 颜色（也支持 `NO_COLOR=1`）                                   |
| `--update`              | [`openclaw update`](/cli/update) 的简写（仅限源安装）                   |
| `-V`, `--version`, `-v` | 打印版本并退出                                                          |

## 输出模式

- ANSI 颜色和进度指示器仅在 TTY 会话中渲染。
- OSC-8 超链接在支持的地方渲染为可点击链接；否则 CLI 回退到纯 URL。
- `--json`（以及支持的地方的 `--plain`）禁用样式以获得干净的输出。
- 长时间运行的命令显示进度指示器（支持时使用 OSC 9;4）。

调色板事实来源：`src/terminal/palette.ts`。

## 命令树

<Accordion title="完整命令树">

```
openclaw [--dev] [--profile <name>] <command>
  crestodian
  setup
  onboard
  configure
  config
    get
    set
    unset
    file
    schema
    validate
  completion
  doctor
  dashboard
  backup
    create
    verify
  security
    audit
  secrets
    reload
    audit
    configure
    apply
  reset
  uninstall
  update
    wizard
    status
  channels
    list
    status
    capabilities
    resolve
    logs
    add
    remove
    login
    logout
  directory
    self
    peers list
    groups list|members
  skills
    search
    install
    update
    list
    info
    check
  plugins
    list
    inspect
    install
    uninstall
    update
    enable
    disable
    doctor
    marketplace list
  memory
    status
    index
    search
  meeting-notes
    list
    show
    path
  path
    resolve
    find
    set
    validate
    emit
  commitments
    list
    dismiss
  wiki
    status
    doctor
    init
    ingest
    compile
    lint
    search
    get
    apply
    bridge import
    unsafe-local import
    obsidian status|search|open|command|daily
  message
    send
    broadcast
    poll
    react
    reactions
    read
    edit
    delete
    pin
    unpin
    pins
    permissions
    search
    thread create|list|reply
    emoji list|upload
    sticker send|upload
    role info|add|remove
    channel info|list
    member info
    voice status
    event list|create
    timeout
    kick
    ban
  agent
  agents
    list
    add
    delete
    bindings
    bind
    unbind
    set-identity
  acp
  mcp
    serve
    list
    show
    set
    unset
  status
  health
  sessions
    cleanup
  tasks
    list
    audit
    maintenance
    show
    notify
    cancel
    flow list|show|cancel
  gateway
    call
    usage-cost
    health
    status
    probe
    discover
    install
    uninstall
    start
    stop
    restart
    run
  daemon
    status
    install
    uninstall
    start
    stop
    restart
  logs
  system
    event
    heartbeat last|enable|disable
    presence
  models
    list
    status
    set
    set-image
    aliases list|add|remove
    fallbacks list|add|remove|clear
    image-fallbacks list|add|remove|clear
    scan
  infer (alias: capability)
    list
    inspect
    model run|list|inspect|providers|auth login|logout|status
    image generate|edit|describe|describe-many|providers
    audio transcribe|providers
    tts convert|voices|providers|status|enable|disable|set-provider
    video generate|describe|providers
    web search|fetch|providers
    embedding create|providers
    auth add|login|login-github-copilot|setup-token|paste-token
    auth order get|set|clear
  sandbox
    list
    recreate
    explain
  cron
    status
    list
    get
    add
    edit
    rm
    enable
    disable
    runs
    run
  nodes
    status
    describe
    list
    pending
    approve
    reject
    rename
    invoke
    notify
    push
    canvas snapshot|present|hide|navigate|eval
    canvas a2ui push|reset
    camera list|snap|clip
    screen record
    location get
  devices
    list
    remove
    clear
    approve
    reject
    rotate
    revoke
  node
    run
    status
    install
    uninstall
    stop
    restart
  approvals
    get
    set
    allowlist add|remove
  exec-policy
    show
    preset
    set
  browser
    status
    start
    stop
    reset-profile
    tabs
    open
    focus
    close
    profiles
    create-profile
    delete-profile
    screenshot
    snapshot
    navigate
    resize
    click
    type
    press
    hover
    drag
    select
    upload
    fill
    dialog
    wait
    evaluate
    console
    pdf
  hooks
    list
    info
    check
    enable
    disable
    install
    update
  webhooks
    gmail setup|run
  proxy
    start
    run
    coverage
    sessions
    query
    blob
    purge
  pairing
    list
    approve
  qr
  clawbot
    qr
  docs
  dns
    setup
  tui
  chat (alias: tui --local)
  terminal (alias: tui --local)
```

Plugin 可以添加额外的顶层命令（例如 `openclaw voicecall`）。

</Accordion>

## 聊天 Slash 命令

聊天消息支持 `/...` 命令。请参阅 [Slash 命令](/tools/slash-commands)。

亮点：

- `/status` — 快速诊断。
- `/trace` — Session 范围的插件跟踪/调试行。
- `/config` — 持久化配置更改。
- `/debug` — 仅运行时的配置覆盖（Memory，非磁盘；需要 `commands.debug: true`）。

## 使用跟踪

`openclaw status --usage` 和控制 UI 在 OAuth/API 凭据可用时显示 Provider 使用/配额。数据直接来自 Provider 使用端点并规范化为 `X% left`。具有当前使用窗口的 Provider：Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

详情请参阅 [使用跟踪](/concepts/usage-tracking)。

## 相关

- [Slash 命令](/tools/slash-commands)
- [配置](/gateway/configuration)
- [环境](/help/environment)
