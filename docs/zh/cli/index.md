---
mmh3_hash: "f5ad39a3f79d944f9aca84f41b7a2a12"
title: "CLI 参考"
sidebarTitle: "CLI 参考"
summary: "`openclaw` 命令、子命令和选项的 OpenClaw CLI 参考"
read_when:
  - 添加或修改 CLI 命令或选项
  - 记录新的命令界面
---

# CLI 参考

本页描述当前的 CLI 行为。如果命令发生变化，请更新此文档。

## 命令页面

- [`setup`](/cli/setup)
- [`onboard`](/cli/onboard)
- [`configure`](/cli/configure)
- [`config`](/cli/config)
- [`completion`](/cli/completion)
- [`doctor`](/cli/doctor)
- [`dashboard`](/cli/dashboard)
- [`backup`](/cli/backup)
- [`reset`](/cli/reset)
- [`uninstall`](/cli/uninstall)
- [`update`](/cli/update)
- [`message`](/cli/message)
- [`agent`](/cli/agent)
- [`agents`](/cli/agents)
- [`acp`](/cli/acp)
- [`mcp`](/cli/mcp)
- [`status`](/cli/status)
- [`health`](/cli/health)
- [`sessions`](/cli/sessions)
- [`gateway`](/cli/gateway)
- [`logs`](/cli/logs)
- [`system`](/cli/system)
- [`models`](/cli/models)
- [`infer`](/cli/infer)
- [`memory`](/cli/memory)
- [`wiki`](/cli/wiki)
- [`directory`](/cli/directory)
- [`nodes`](/cli/nodes)
- [`devices`](/cli/devices)
- [`node`](/cli/node)
- [`approvals`](/cli/approvals)
- [`sandbox`](/cli/sandbox)
- [`tui`](/cli/tui)
- [`browser`](/cli/browser)
- [`cron`](/cli/cron)
- [`tasks`](/cli/index#tasks)
- [`flows`](/cli/flows)
- [`dns`](/cli/dns)
- [`docs`](/cli/docs)
- [`hooks`](/cli/hooks)
- [`webhooks`](/cli/webhooks)
- [`pairing`](/cli/pairing)
- [`qr`](/cli/qr)
- [`plugins`](/cli/plugins)（插件命令）
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`skills`](/cli/skills)
- [`daemon`](/cli/daemon)（Gateway 服务命令的旧版别名）
- [`clawbot`](/cli/clawbot)（旧版别名命名空间）
- [`voicecall`](/cli/voicecall)（插件；如果已安装）

## 全局标志

- `--dev`：在 `~/.openclaw-dev` 下隔离状态并移动默认端口。
- `--profile <name>`：在 `~/.openclaw-<name>` 下隔离状态。
- `--container <name>`：针对命名容器执行。
- `--no-color`：禁用 ANSI 颜色。
- `--update`：`openclaw update` 的简写（仅限源安装）。
- `-V`、`--version`、`-v`：打印版本并退出。

## 输出样式

- ANSI 颜色和进度指示器仅在 TTY Session 中渲染。
- OSC-8 超链接在支持的终端中渲染为可点击链接；否则我们回退到纯 URL。
- `--json`（以及在支持的地方使用 `--plain`）禁用样式以获得干净的输出。
- `--no-color` 禁用 ANSI 样式；也支持 `NO_COLOR=1`。
- 长时间运行的命令显示进度指示器（在支持时使用 OSC 9;4）。

## 颜色调色板

OpenClaw 使用龙虾调色板进行 CLI 输出。

- `accent`（#FF5A2D）：标题、标签、主要亮点。
- `accentBright`（#FF7A3D）：命令名称、强调。
- `accentDim`（#D14A22）：次要高亮文本。
- `info`（#FF8A5B）：信息值。
- `success`（#2FBF71）：成功状态。
- `warn`（#FFB020）：警告、回退、注意。
- `error`（#E23D2D）：错误、失败。
- `muted`（#8B7F77）：去强调、元数据。

调色板真实来源：`src/terminal/palette.ts`（又名"龙虾调色板"）。

## 命令树

```
openclaw [--dev] [--profile <name>] <command>
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
```

注意：插件可以添加额外的顶级命令（例如 `openclaw voicecall`）。

## 安全

- `openclaw security audit` — 审计配置 + 本地状态的常见安全漏洞。
- `openclaw security audit --deep` — 尽力实时 Gateway 探测。
- `openclaw security audit --fix` — 加强安全默认值并 chmod 状态/配置。

## Secrets

### `secrets`

管理 SecretRef 及相关运行时/配置卫生。

子命令：

- `secrets reload`
- `secrets audit`
- `secrets configure`
- `secrets apply --from <path>`

`secrets reload` 选项：

- `--url`、`--token`、`--timeout`、`--expect-final`、`--json`

`secrets audit` 选项：

- `--check`
- `--allow-exec`
- `--json`

`secrets configure` 选项：

- `--apply`
- `--yes`
- `--providers-only`
- `--skip-provider-setup`
- `--agent <id>`
- `--allow-exec`
- `--plan-out <path>`
- `--json`

`secrets apply --from <path>` 选项：

- `--dry-run`
- `--allow-exec`
- `--json`

说明：

- `reload` 是 Gateway RPC，当解析失败时保留最后已知良好的运行时快照。
- `audit --check` 在有发现时返回非零值；未解析的引用使用更高优先级的非零退出代码。
- 试运行 exec 检查默认跳过；使用 `--allow-exec` 选择加入。

## 插件

管理扩展及其配置：

- `openclaw plugins list` — 发现插件（使用 `--json` 进行机器输出）。
- `openclaw plugins inspect <id>` — 显示插件的详细信息（`info` 是别名）。
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — 安装插件（或将插件路径添加到 `plugins.load.paths`；使用 `--force` 覆盖现有安装目标）。
- `openclaw plugins marketplace list <marketplace>` — 在安装前列出市场条目。
- `openclaw plugins enable <id>` / `disable <id>` — 切换 `plugins.entries.<id>.enabled`。
- `openclaw plugins doctor` — 报告插件加载错误。

大多数插件更改需要重启 Gateway。参见 [/tools/plugin](/tools/plugin)。

## Memory

向量搜索 `MEMORY.md` + `memory/*.md`：

- `openclaw memory status` — 显示索引统计信息；使用 `--deep` 进行向量 + 嵌入就绪检查，或使用 `--fix` 修复过期的召回/提升工件。
- `openclaw memory index` — 重新索引内存文件。
- `openclaw memory search "<query>"`（或 `--query "<query>"`）— 对内存进行语义搜索。
- `openclaw memory promote` — 对短期召回进行排名，并可选地将顶部条目附加到 `MEMORY.md`。

## Sandbox

管理隔离 Agent 执行的沙箱运行时。参见 [/cli/sandbox](/cli/sandbox)。

子命令：

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

说明：

- `sandbox recreate` 删除现有运行时，以便下次使用时用当前配置重新播种。
- 对于 `ssh` 和 OpenShell `remote` 后端，recreate 会删除所选范围的规范远程工作区。

## 聊天斜杠命令

聊天消息支持 `/...` 命令（文本和原生）。参见 [/tools/slash-commands](/tools/slash-commands)。

亮点：

- `/status` 用于快速诊断。
- `/trace` 用于 Session 范围的插件跟踪/调试行。
- `/config` 用于持久化配置更改。
- `/debug` 用于仅运行时的配置覆盖（内存，而非磁盘；需要 `commands.debug: true`）。

## 设置 + 入职

### `completion`

生成 shell 补全脚本并可选地将其安装到 shell 配置文件中。

选项：

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

说明：

- 不带 `--install` 或 `--write-state` 时，`completion` 将脚本打印到 stdout。
- `--install` 将 `OpenClaw Completion` 块写入 shell 配置文件，并指向 OpenClaw 状态目录下缓存的脚本。

### `setup`

初始化配置 + 工作区。

选项：

- `--workspace <dir>`：Agent 工作区路径（默认 `~/.openclaw/workspace`）。
- `--wizard`：运行入职向导。
- `--non-interactive`：运行向导而不提示。
- `--mode <local|remote>`：向导模式。
- `--remote-url <url>`：远程 Gateway URL。
- `--remote-token <token>`：远程 Gateway 令牌。

当存在任何向导标志时，向导会自动运行（`--non-interactive`、`--mode`、`--remote-url`、`--remote-token`）。

### `onboard`

交互式向导以设置 Gateway、工作区和 Skill。

选项：

- `--workspace <dir>`
- `--reset`（在入职前重置配置 + 凭据 + Session）
- `--reset-scope <config|config+creds+sessions|full>`（默认 `config+creds+sessions`；使用 `full` 也删除工作区）
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>`（manual 是 advanced 的别名）
- `--auth-choice <choice>`，其中 `<choice>` 为以下之一：
  `chutes`、`deepseek-api-key`、`openai-codex`、`openai-api-key`、
  `openrouter-api-key`、`kilocode-api-key`、`litellm-api-key`、`ai-gateway-api-key`、
  `cloudflare-ai-gateway-api-key`、`moonshot-api-key`、`moonshot-api-key-cn`、
  `kimi-code-api-key`、`synthetic-api-key`、`venice-api-key`、`together-api-key`、
  `huggingface-api-key`、`apiKey`、`gemini-api-key`、`google-gemini-cli`、`zai-api-key`、
  `zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`、`xiaomi-api-key`、
  `minimax-global-oauth`、`minimax-global-api`、`minimax-cn-oauth`、`minimax-cn-api`、
  `opencode-zen`、`opencode-go`、`github-copilot`、`copilot-proxy`、`xai-api-key`、
  `mistral-api-key`、`volcengine-api-key`、`byteplus-api-key`、`qianfan-api-key`、
  `qwen-standard-api-key-cn`、`qwen-standard-api-key`、`qwen-api-key-cn`、`qwen-api-key`、
  `modelstudio-standard-api-key-cn`、`modelstudio-standard-api-key`、
  `modelstudio-api-key-cn`、`modelstudio-api-key`、`custom-api-key`、`skip`
- Qwen 说明：`qwen-*` 是规范的 auth-choice 系列。`modelstudio-*` ID 仅作为旧版兼容别名保留。
- `--secret-input-mode <plaintext|ref>`（默认 `plaintext`；使用 `ref` 存储提供商默认环境引用而不是明文密钥）
- `--anthropic-api-key <key>`
- `--openai-api-key <key>`
- `--mistral-api-key <key>`
- `--openrouter-api-key <key>`
- `--ai-gateway-api-key <key>`
- `--moonshot-api-key <key>`
- `--kimi-code-api-key <key>`
- `--gemini-api-key <key>`
- `--zai-api-key <key>`
- `--minimax-api-key <key>`
- `--opencode-zen-api-key <key>`
- `--opencode-go-api-key <key>`
- `--custom-base-url <url>`（非交互；与 `--auth-choice custom-api-key` 一起使用）
- `--custom-model-id <id>`（非交互；与 `--auth-choice custom-api-key` 一起使用）
- `--custom-api-key <key>`（非交互；可选；与 `--auth-choice custom-api-key` 一起使用；省略时回退到 `CUSTOM_API_KEY`）
- `--custom-provider-id <id>`（非交互；可选自定义提供商 ID）
- `--custom-compatibility <openai|anthropic>`（非交互；可选；默认 `openai`）
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>`（非交互；将 `gateway.auth.token` 存储为 env SecretRef；要求该环境变量已设置；不能与 `--gateway-token` 组合）
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon`（别名：`--skip-daemon`）
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-search`
- `--skip-health`
- `--skip-ui`
- `--cloudflare-ai-gateway-account-id <id>`
- `--cloudflare-ai-gateway-gateway-id <id>`
- `--node-manager <npm|pnpm|bun>`（Skill 的设置/入职节点管理器；推荐 pnpm，也支持 bun）
- `--json`

### `configure`

交互式配置向导（模型、Channel、Skill、Gateway）。

选项：

- `--section <section>`（可重复；将向导限制到特定部分）

### `config`

非交互式配置助手（获取/设置/取消设置/文件/schema/验证）。运行不带子命令的 `openclaw config` 会启动向导。

子命令：

- `config get <path>`：打印配置值（点/括号路径）。
- `config set`：支持四种赋值模式：
  - 值模式：`config set <path> <value>`（JSON5 或字符串解析）
  - SecretRef 构建器模式：`config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - Provider 构建器模式：`config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - 批量模式：`config set --batch-json '<json>'` 或 `config set --batch-file <path>`
- `config set --dry-run`：不写入 `openclaw.json` 即验证赋值（exec SecretRef 检查默认跳过）。
- `config set --allow-exec --dry-run`：启用 Exec SecretRef 试运行检查（可能执行 Provider 命令）。
- `config set --dry-run --json`：输出机器可读试运行结果（检查 + 完整性信号、操作数、已检查/跳过的 ref 数、错误）。
- `config set --strict-json`：对路径/值输入要求 JSON5 解析。`--json` 作为旧版别名仍受支持，用于严格解析（在试运行输出模式之外）。
- `config unset <path>`：删除值。
- `config file`：打印活动配置文件路径。
- `config schema`：打印 `openclaw.json` 生成的 JSON schema，包括跨嵌套对象、通配符、数组项和组合分支传播的字段 `title`/`description` 文档元数据，以及尽力实时的插件/Channel schema 元数据。
- `config validate`：在不启动 Gateway 的情况下根据 schema 验证当前配置。
- `config validate --json`：输出机器可读的 JSON 输出。

### `doctor`

健康检查 + 快速修复（配置 + Gateway + 遗留服务）。

选项：

- `--no-workspace-suggestions`：禁用工作区内存提示。
- `--yes`：接受默认值而不提示（无头）。
- `--non-interactive`：跳过提示；仅应用安全迁移。
- `--deep`：扫描系统服务以查找额外的 Gateway 安装。
- `--repair`（别名：`--fix`）：尝试自动修复检测到的问题。
- `--force`：即使不严格需要也强制修复。
- `--generate-gateway-token`：生成新的 Gateway 身份验证令牌。

### `dashboard`

使用当前令牌打开 Control UI。

选项：

- `--no-open`：打印 URL 但不启动浏览器

说明：

- 对于 SecretRef 管理的 Gateway 令牌，`dashboard` 打印或打开非令牌化 URL，而不是在终端输出或浏览器启动参数中暴露密钥。

### `update`

更新已安装的 CLI。

根选项：

- `--json`
- `--no-restart`
- `--dry-run`
- `--channel <stable|beta|dev>`
- `--tag <dist-tag|version|spec>`
- `--timeout <seconds>`
- `--yes`

子命令：

- `update status`
- `update wizard`

`update status` 选项：

- `--json`
- `--timeout <seconds>`

`update wizard` 选项：

- `--timeout <seconds>`

说明：

- `openclaw --update` 重写为 `openclaw update`。

### `backup`

为 OpenClaw 状态创建和验证本地备份归档。

子命令：

- `backup create`
- `backup verify <archive>`

`backup create` 选项：

- `--output <path>`
- `--json`
- `--dry-run`
- `--verify`
- `--only-config`
- `--no-include-workspace`

`backup verify <archive>` 选项：

- `--json`

## Channel 助手

### `channels`

管理聊天 Channel 账户（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（插件）/Signal/iMessage/Microsoft Teams）。

子命令：

- `channels list`：显示配置的 Channel 和身份验证配置文件。
- `channels status`：检查 Gateway 可达性和 Channel 健康状况（`--probe` 在 Gateway 可达时运行实时逐账户探测/审计检查；如不可达，则回退到仅配置的 Channel 摘要。使用 `openclaw health` 或 `openclaw status --deep` 进行更广泛的 Gateway 健康探测）。
- 提示：`channels status` 在可以检测到常见错误配置时打印带有建议修复的警告（然后指向您到 `openclaw doctor`）。
- `channels logs`：从 Gateway 日志文件显示最近的 Channel 日志。
- `channels add`：未传递标志时的向导式设置；标志切换到非交互模式。
  - 向非默认账户添加 Channel 时，如果该 Channel 仍使用单账户顶层配置，OpenClaw 会将账户范围的值移动到 Channel 账户映射，然后再写入新账户。大多数 Channel 使用 `accounts.default`；Matrix 可以保留现有匹配的命名/默认目标，而不是替换它。
  - 非交互式 `channels add` 不会自动创建/升级绑定；仅 Channel 的绑定继续匹配默认账户。
- `channels remove`：默认禁用；传递 `--delete` 以在不提示的情况下删除配置条目。
- `channels login`：交互式 Channel 登录（仅限 WhatsApp Web）。
- `channels logout`：注销 Channel Session（如果支持）。

常用选项：

- `--channel <name>`：`whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`：Channel 账户 ID（默认 `default`）
- `--name <label>`：账户的显示名称

`channels login` 选项：

- `--channel <channel>`（默认 `whatsapp`；支持 `whatsapp`/`web`）
- `--account <id>`
- `--verbose`

`channels logout` 选项：

- `--channel <channel>`（默认 `whatsapp`）
- `--account <id>`

`channels list` 选项：

- `--no-usage`：跳过模型提供商使用/配额快照（仅限 OAuth/API 支持）。
- `--json`：输出 JSON（除非设置了 `--no-usage`，否则包括使用情况）。

`channels status` 选项：

- `--probe`
- `--timeout <ms>`
- `--json`

`channels capabilities` 选项：

- `--channel <name>`
- `--account <id>`（仅与 `--channel` 一起使用）
- `--target <dest>`
- `--timeout <ms>`
- `--json`

`channels resolve` 选项：

- `<entries...>`
- `--channel <name>`
- `--account <id>`
- `--kind <auto|user|group>`
- `--json`

`channels logs` 选项：

- `--channel <name|all>`（默认 `all`）
- `--lines <n>`（默认 `200`）
- `--json`

说明：

- `channels login` 支持 `--verbose`。
- `channels capabilities --account` 仅在设置了 `--channel` 时适用。
- `channels status --probe` 可显示传输状态以及探测/审计结果，如 `works`、`probe failed`、`audit ok` 或 `audit failed`，具体取决于 Channel 支持情况。

更多详细信息：[/concepts/oauth](/concepts/oauth)

示例：

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `directory`

查找公开目录界面的 Channel 的自身、对等方和群组 ID。参见 [`openclaw directory`](/cli/directory)。

常用选项：

- `--channel <name>`
- `--account <id>`
- `--json`

子命令：

- `directory self`
- `directory peers list [--query <text>] [--limit <n>]`
- `directory groups list [--query <text>] [--limit <n>]`
- `directory groups members --group-id <id> [--limit <n>]`

### `skills`

列出并检查可用 Skill 以及准备就绪信息。

子命令：

- `skills search [query...]`：搜索 ClawHub Skill。
- `skills search --limit <n> --json`：限制搜索结果或输出机器可读结果。
- `skills install <slug>`：从 ClawHub 安装 Skill 到活动工作区。
- `skills install <slug> --version <version>`：安装特定的 ClawHub 版本。
- `skills install <slug> --force`：覆盖现有工作区 Skill 文件夹。
- `skills update <slug|--all>`：更新已跟踪的 ClawHub Skill。
- `skills list`：列出 Skill（无子命令时默认）。
- `skills list --json`：在 stdout 上输出机器可读的 Skill 清单。
- `skills list --verbose`：在表格中包含缺少的要求。
- `skills info <name>`：显示一个 Skill 的详细信息。
- `skills info <name> --json`：在 stdout 上输出机器可读的详细信息。
- `skills check`：准备就绪与缺少要求的摘要。
- `skills check --json`：在 stdout 上输出机器可读的就绪输出。

选项：

- `--eligible`：仅显示准备就绪的 Skill。
- `--json`：输出 JSON（无样式）。
- `-v`、`--verbose`：包括缺少的要求详细信息。

提示：使用 `openclaw skills search`、`openclaw skills install` 和 `openclaw skills update` 操作 ClawHub Skill。

### `pairing`

批准跨 Channel 的 DM 配对请求。

子命令：

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

说明：

- 如果只配置了一个支持配对的 Channel，`pairing approve <code>` 也可以使用。
- `list` 和 `approve` 都支持多账户 Channel 的 `--account <id>`。

### `devices`

管理 Gateway 设备配对条目和每角色设备令牌。

子命令：

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

说明：

- 当直接配对范围不可用时，`devices list` 和 `devices approve` 可以回退到本地回环上的本地配对文件。
- `devices approve` 在铸造令牌前需要显式的请求 ID；省略 `requestId` 或传递 `--latest` 仅预览最新的待处理请求。
- 存储令牌的重新连接重用令牌缓存的批准范围；显式的 `devices rotate --scope ...` 更新该存储范围集以供未来缓存令牌重新连接使用。
- `devices rotate` 和 `devices revoke` 返回 JSON 载荷。

### `qr`

从当前 Gateway 配置生成移动配对 QR 和设置代码。参见 [`openclaw qr`](/cli/qr)。

选项：

- `--remote`
- `--url <url>`
- `--public-url <url>`
- `--token <token>`
- `--password <password>`
- `--setup-code-only`
- `--no-ascii`
- `--json`

说明：

- `--token` 和 `--password` 互斥。
- 设置代码携带短期引导令牌，而非共享 Gateway 令牌/密码。
- 内置引导交接将主节点令牌保持在 `scopes: []`。
- 任何交接的 operator 引导令牌限定在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`。
- 引导范围检查带有角色前缀，因此 operator 允许列表仅满足 operator 请求；非 operator 角色仍需其自己角色前缀下的范围。
- `--remote` 可以使用 `gateway.remote.url` 或活动的 Tailscale Serve/Funnel URL。
- 扫描后，使用 `openclaw devices list` / `openclaw devices approve <requestId>` 批准请求。

### `clawbot`

旧版别名命名空间。目前支持 `openclaw clawbot qr`，映射到 [`openclaw qr`](/cli/qr)。

### `hooks`

管理内部 Agent Hook。

子命令：

- `hooks list`
- `hooks info <name>`
- `hooks check`
- `hooks enable <name>`
- `hooks disable <name>`
- `hooks install <path-or-spec>`（已弃用，是 `openclaw plugins install` 的别名）
- `hooks update [id]`（已弃用，是 `openclaw plugins update` 的别名）

常用选项：

- `--json`
- `--eligible`
- `-v`、`--verbose`

说明：

- 插件管理的 Hook 不能通过 `openclaw hooks` 启用或禁用；请改为启用或禁用拥有该 Hook 的插件。
- `hooks install` 和 `hooks update` 仍作为兼容别名工作，但会打印弃用警告并转发到插件命令。

### `webhooks`

Webhook 助手。当前内置界面为 Gmail Pub/Sub 设置 + 运行器：

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

Gmail Pub/Sub Hook 设置 + 运行器。参见 [Gmail Pub/Sub](/automation/cron-jobs#gmail-pubsub-integration)。

子命令：

- `webhooks gmail setup`（需要 `--account <email>`；支持 `--project`、`--topic`、`--subscription`、`--label`、`--hook-url`、`--hook-token`、`--push-token`、`--bind`、`--port`、`--path`、`--include-body`、`--max-bytes`、`--renew-minutes`、`--tailscale`、`--tailscale-path`、`--tailscale-target`、`--push-endpoint`、`--json`）
- `webhooks gmail run`（相同标志的运行时覆盖）

说明：

- `setup` 配置 Gmail watch 以及面向 OpenClaw 的推送路径。
- `run` 启动带有可选运行时覆盖的本地 Gmail 观察器/续订循环。

### `dns`

广域发现 DNS 助手（CoreDNS + Tailscale）。当前内置界面：

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

广域发现 DNS 助手（CoreDNS + Tailscale）。参见 [/gateway/discovery](/gateway/discovery)。

选项：

- `--domain <domain>`
- `--apply`：安装/更新 CoreDNS 配置（需要 sudo；仅限 macOS）。

说明：

- 不带 `--apply` 时，这是一个规划助手，打印推荐的 OpenClaw + Tailscale DNS 配置。
- `--apply` 目前仅支持使用 Homebrew CoreDNS 的 macOS。

## 消息 + Agent

### `message`

统一的出站消息 + Channel 操作。

参见：[/cli/message](/cli/message)

子命令：

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

示例：

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

通过 Gateway 运行一轮 Agent（或 `--local` 嵌入式）。

至少传递一个 Session 选择器：`--to`、`--session-id` 或 `--agent`。

必需：

- `-m, --message <text>`

选项：

- `-t, --to <dest>`（用于 Session 密钥和可选传递）
- `--session-id <id>`
- `--agent <id>`（Agent ID；覆盖路由绑定）
- `--thinking <off|minimal|low|medium|high|xhigh>`（提供商支持情况不同；CLI 级别不受模型限制）
- `--verbose <on|off>`
- `--channel <channel>`（传递 Channel；省略以使用主 Session Channel）
- `--reply-to <target>`（传递目标覆盖，与 Session 路由分开）
- `--reply-channel <channel>`（传递 Channel 覆盖）
- `--reply-account <id>`（传递账户 ID 覆盖）
- `--local`（嵌入式运行；插件注册表仍然先预加载）
- `--deliver`
- `--json`
- `--timeout <seconds>`

说明：

- Gateway 模式在 Gateway 请求失败时回退到嵌入式 Agent。
- `--local` 仍然预加载插件注册表，因此插件提供的 Provider、工具和 Channel 在嵌入式运行期间仍然可用。
- `--channel`、`--reply-channel` 和 `--reply-account` 影响回复传递，而不是路由。

### `agents`

管理隔离的 Agent（工作区 + 身份验证 + 路由）。

不带子命令运行 `openclaw agents` 等同于 `openclaw agents list`。

#### `agents list`

列出配置的 Agent。

选项：

- `--json`
- `--bindings`

#### `agents add [name]`

添加新的隔离 Agent。除非传递标志（或 `--non-interactive`），否则运行指导向导；在非交互模式下需要 `--workspace`。

选项：

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>`（可重复）
- `--non-interactive`
- `--json`

绑定规范使用 `channel[:accountId]`。当省略 `accountId` 时，OpenClaw 可以通过 Channel 默认值/插件 Hook 解析账户范围；否则是没有显式账户范围的 Channel 绑定。
传递任何显式的添加标志会将命令切换到非交互路径。`main` 是保留名称，不能用作新的 Agent ID。

#### `agents bindings`

列出路由绑定。

选项：

- `--agent <id>`
- `--json`

#### `agents bind`

为 Agent 添加路由绑定。

选项：

- `--agent <id>`（默认为当前默认 Agent）
- `--bind <channel[:accountId]>`（可重复）
- `--json`

#### `agents unbind`

删除 Agent 的路由绑定。

选项：

- `--agent <id>`（默认为当前默认 Agent）
- `--bind <channel[:accountId]>`（可重复）
- `--all`
- `--json`

使用 `--all` 或 `--bind` 其中之一，不能同时使用。

#### `agents delete <id>`

删除 Agent 并修剪其工作区 + 状态。

选项：

- `--force`
- `--json`

说明：

- 不能删除 `main`。
- 不带 `--force` 时，需要交互式确认。

#### `agents set-identity`

更新 Agent 身份（名称/主题/表情符号/头像）。

选项：

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

说明：

- `--agent` 或 `--workspace` 可用于选择目标 Agent。
- 当未提供显式身份字段时，命令读取 `IDENTITY.md`。

### `acp`

运行将 IDE 连接到 Gateway 的 ACP 桥接。

根选项：

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--session <key>`
- `--session-label <label>`
- `--require-existing`
- `--reset-session`
- `--no-prefix-cwd`
- `--provenance <off|meta|meta+receipt>`
- `--verbose`

#### `acp client`

用于桥接调试的交互式 ACP 客户端。

选项：

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

有关完整行为、安全说明和示例，请参见 [`acp`](/cli/acp)。

### `mcp`

管理已保存的 MCP 服务器定义，并通过 MCP stdio 公开 OpenClaw Channel。

#### `mcp serve`

通过 MCP stdio 公开路由的 OpenClaw Channel 对话。

选项：

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

列出已保存的 MCP 服务器定义。

选项：

- `--json`

#### `mcp show [name]`

显示一个已保存的 MCP 服务器定义或完整的已保存 MCP 服务器对象。

选项：

- `--json`

#### `mcp set <name> <value>`

从 JSON 对象保存一个 MCP 服务器定义。

#### `mcp unset <name>`

删除一个已保存的 MCP 服务器定义。

### `approvals`

管理 exec 批准。别名：`exec-approvals`。

#### `approvals get`

获取 exec 批准快照和有效策略。

选项：

- `--node <node>`
- `--gateway`
- `--json`
- `openclaw nodes` 的节点 RPC 选项

#### `approvals set`

用文件或 stdin 中的 JSON 替换 exec 批准。

选项：

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- `openclaw nodes` 的节点 RPC 选项

#### `approvals allowlist add|remove`

编辑每个 Agent 的 exec 允许列表。

选项：

- `--node <node>`
- `--gateway`
- `--agent <id>`（默认为 `*`）
- `--json`
- `openclaw nodes` 的节点 RPC 选项

### `status`

显示链接的 Session 健康状况和最近的收件人。

选项：

- `--json`
- `--all`（完整诊断；只读，可粘贴）
- `--deep`（要求 Gateway 进行实时健康探测，包括在支持时的 Channel 探测）
- `--usage`（显示模型提供商使用/配额）
- `--timeout <ms>`
- `--verbose`
- `--debug`（`--verbose` 的别名）

说明：

- 概述包括 Gateway + Node 主机服务状态（如果可用）。
- `--usage` 将规范化的提供商使用窗口打印为 `X% left`。

### 使用跟踪

OpenClaw 可以在 OAuth/API 凭据可用时显示提供商使用/配额。

界面：

- `/status`（在可用时添加简短的提供商使用行）
- `openclaw status --usage`（打印完整的提供商细分）
- macOS 菜单栏（上下文下的使用部分）

说明：

- 数据直接来自提供商使用端点（无估计）。
- 人类可读输出在各提供商间规范化为 `X% left`。
- 当前有使用窗口的提供商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi 和 z.ai。
- MiniMax 说明：原始 `usage_percent`/`usagePercent` 表示剩余配额，因此 OpenClaw 在显示前将其反转；当基于计数的字段存在时仍然优先。`model_remains` 响应优先使用聊天模型条目，在需要时从时间戳派生窗口标签，并在计划标签中包含模型名称。
- 使用身份验证在可用时来自提供商特定的 Hook；否则 OpenClaw 回退到匹配的 OAuth/API 密钥凭据（来自身份验证配置文件、环境变量或配置）。如果都无法解析，则隐藏使用情况。
- 详细信息：参见 [使用跟踪](/concepts/usage-tracking)。

### `health`

从正在运行的 Gateway 获取健康状况。

选项：

- `--json`
- `--timeout <ms>`
- `--verbose`（强制实时探测并打印 Gateway 连接详情）
- `--debug`（`--verbose` 的别名）

说明：

- 默认 `health` 可以返回最新的缓存 Gateway 快照。
- `health --verbose` 强制实时探测，并在所有配置的账户和 Agent 间展开人类可读输出。

### `sessions`

列出存储的对话 Session。

选项：

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>`（按 Agent 过滤 Session）
- `--all-agents`（显示所有 Agent 的 Session）

子命令：

- `sessions cleanup` — 删除过期或孤立的 Session

说明：

- `sessions cleanup` 也支持 `--fix-missing` 以修剪记录文件已消失的条目。

## 重置/卸载

### `reset`

重置本地配置/状态（保留已安装的 CLI）。

选项：

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

说明：

- `--non-interactive` 需要 `--scope` 和 `--yes`。

### `uninstall`

卸载 Gateway 服务 + 本地数据（CLI 保留）。

选项：

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

说明：

- `--non-interactive` 需要 `--yes` 和明确的范围（或 `--all`）。
- `--all` 一起删除服务、状态、工作区和应用。

### `tasks`

列出并管理跨 Agent 的[后台任务](/automation/tasks)运行。

- `tasks list` — 显示活动和最近的任务运行
- `tasks show <id>` — 显示特定任务运行的详情
- `tasks notify <id>` — 更改任务运行的通知策略
- `tasks cancel <id>` — 取消正在运行的任务
- `tasks audit` — 显示操作问题（过期、丢失、传递失败）
- `tasks maintenance [--apply] [--json]` — 预览或应用任务和 TaskFlow 清理/对账（ACP/子 Agent 子 Session、活动 Cron 作业、实时 CLI 运行）
- `tasks flow list` — 列出活动和最近的 Task Flow 流
- `tasks flow show <lookup>` — 按 ID 或查找键检查流
- `tasks flow cancel <lookup>` — 取消正在运行的流及其活动任务

### `flows`

旧版文档快捷方式。流命令位于 `openclaw tasks flow` 下：

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway

### `gateway`

运行 WebSocket Gateway。

选项：

- `--port <port>`
- `--bind <loopback|tailnet|lan|auto|custom>`
- `--token <token>`
- `--auth <token|password>`
- `--password <password>`
- `--password-file <path>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--allow-unconfigured`
- `--dev`
- `--reset`（重置开发配置 + 凭据 + Session + 工作区）
- `--force`（杀死端口上的现有监听器）
- `--verbose`
- `--cli-backend-logs`
- `--ws-log <auto|full|compact>`
- `--compact`（`--ws-log compact` 的别名）
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

管理 Gateway 服务（launchd/systemd/schtasks）。

子命令：

- `gateway status`（默认探测 Gateway RPC）
- `gateway install`（服务安装）
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

说明：

- `gateway status` 默认使用服务的解析端口/配置探测 Gateway RPC（使用 `--url/--token/--password` 覆盖）。
- `gateway status` 支持 `--no-probe`、`--deep`、`--require-rpc` 和 `--json` 用于脚本编写。
- `gateway status` 在可以检测到遗留或额外的 Gateway 服务时也会显示它们（`--deep` 添加系统级扫描）。配置文件命名的 OpenClaw 服务被视为一流的，不会被标记为"额外"。
- 即使本地 CLI 配置缺失或无效，`gateway status` 仍可用于诊断。
- `gateway status` 打印已解析的文件日志路径、CLI 与服务配置路径/有效性快照以及已解析的探测目标 URL。
- 如果 Gateway 身份验证 SecretRef 在当前命令路径中未解析，`gateway status --json` 仅在探测连接/身份验证失败时报告 `rpc.authWarning`（探测成功时警告被抑制）。
- 在 Linux systemd 安装中，状态令牌漂移检查包括 `Environment=` 和 `EnvironmentFile=` 单元来源。
- `gateway install|uninstall|start|stop|restart` 支持 `--json` 用于脚本编写（默认输出保持人性化）。
- `gateway install` 默认为 Node 运行时；**不推荐** bun（WhatsApp/Telegram 错误）。
- `gateway install` 选项：`--port`、`--runtime`、`--token`、`--force`、`--json`。

### `daemon`

Gateway 服务管理命令的旧版别名。参见 [/cli/daemon](/cli/daemon)。

子命令：

- `daemon status`
- `daemon install`
- `daemon uninstall`
- `daemon start`
- `daemon stop`
- `daemon restart`

常用选项：

- `status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
- `install`：`--port`、`--runtime <node|bun>`、`--token`、`--force`、`--json`
- `uninstall|start|stop|restart`：`--json`

### `logs`

通过 RPC 尾随 Gateway 文件日志。

选项：

- `--limit <n>`：返回的最大日志行数
- `--max-bytes <n>`：从日志文件读取的最大字节数
- `--follow`：跟随日志文件（tail -f 风格）
- `--interval <ms>`：跟随时的轮询间隔（毫秒）
- `--local-time`：以本地时间显示时间戳
- `--json`：发出行分隔的 JSON
- `--plain`：禁用结构化格式
- `--no-color`：禁用 ANSI 颜色
- `--url <url>`：显式 Gateway WebSocket URL
- `--token <token>`：Gateway 令牌
- `--timeout <ms>`：Gateway RPC 超时
- `--expect-final`：在需要时等待最终响应

示例：

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

说明：

- 如果您传递 `--url`，CLI 不会自动应用配置或环境凭据。
- 本地回环配对失败回退到已配置的本地日志文件；显式 `--url` 目标不会。

### `gateway <subcommand>`

Gateway CLI 助手（对 RPC 子命令使用 `--url`、`--token`、`--password`、`--timeout`、`--expect-final`）。
当您传递 `--url` 时，CLI 不会自动应用配置或环境凭据。显式包含 `--token` 或 `--password`。缺少显式凭据会导致错误。

子命令：

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

说明：

- `gateway status --deep` 添加系统级服务扫描。使用 `gateway probe`、`health --verbose` 或顶层 `status --deep` 获取更深入的运行时探测详情。

常用 RPC：

- `config.schema.lookup`（检查一个配置子树，包含浅层 schema 节点、匹配的提示元数据和直接子摘要）
- `config.get`（读取当前配置快照 + 哈希）
- `config.set`（验证 + 写入完整配置；使用 `baseHash` 进行乐观并发）
- `config.apply`（验证 + 写入配置 + 重启 + 唤醒）
- `config.patch`（合并部分更新 + 重启 + 唤醒）
- `update.run`（运行更新 + 重启 + 唤醒）

提示：当直接调用 `config.set`/`config.apply`/`config.patch` 时，如果配置已存在，则从 `config.get` 传递 `baseHash`。
提示：对于部分编辑，先用 `config.schema.lookup` 检查，优先使用 `config.patch`。
提示：这些配置写入 RPC 对提交的配置载荷中的引用预检活动 SecretRef 解析，并在有效活动的提交引用未解析时拒绝写入。
提示：仅限所有者的 `gateway` 运行时工具仍然拒绝重写 `tools.exec.ask` 或 `tools.exec.security`；旧版 `tools.bash.*` 别名规范化为相同的受保护 exec 路径。

## 模型

有关回退行为和扫描策略，请参见 [/concepts/models](/concepts/models)。

Anthropic 说明：Anthropic 员工告诉我们 OpenClaw 风格的 Claude CLI 使用再次被允许，因此 OpenClaw 将 Claude CLI 重用和 `claude -p` 使用视为此集成的授权使用，除非 Anthropic 发布新政策。对于生产环境，优先使用 Anthropic API 密钥或其他支持的订阅式提供商，如 OpenAI Codex、阿里云模型工作室编码计划、MiniMax 编码计划或 Z.AI / GLM 编码计划。

Anthropic setup-token 仍然作为受支持的令牌身份验证路径提供，但在可用时 OpenClaw 现在优先使用 Claude CLI 重用和 `claude -p`。

### `models`（根）

`openclaw models` 是 `models status` 的别名。

根选项：

- `--status-json`（`models status --json` 的别名）
- `--status-plain`（`models status --plain` 的别名）

### `models list`

选项：

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

### `models status`

选项：

- `--json`
- `--plain`
- `--check`（退出 1=过期/缺失，2=即将过期）
- `--probe`（对配置的身份验证配置文件进行实时探测）
- `--probe-provider <name>`
- `--probe-profile <id>`（重复或逗号分隔）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

始终包括身份验证概述和身份验证存储中配置文件的 OAuth 到期状态。
`--probe` 运行实时请求（可能消耗令牌并触发速率限制）。
探测行可以来自身份验证配置文件、环境变量凭据或 `models.json`。
预期探测状态如 `ok`、`auth`、`rate_limit`、`billing`、`timeout`、`format`、`unknown` 和 `no_model`。
当显式的 `auth.order.<provider>` 省略已存储的配置文件时，探测报告 `excluded_by_auth_order` 而不是静默地尝试该配置文件。

### `models set <model>`

设置 `agents.defaults.model.primary`。

### `models set-image <model>`

设置 `agents.defaults.imageModel.primary`。

### `models aliases list|add|remove`

选项：

- `list`：`--json`、`--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

选项：

- `list`：`--json`、`--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

选项：

- `list`：`--json`、`--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

选项：

- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`
- `--concurrency <n>`
- `--no-probe`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

### `models auth add|login|login-github-copilot|setup-token|paste-token`

选项：

- `add`：交互式身份验证助手（提供商身份验证流程或令牌粘贴）
- `login`：`--provider <name>`、`--method <method>`、`--set-default`
- `login-github-copilot`：GitHub Copilot OAuth 登录流程（`--yes`）
- `setup-token`：`--provider <name>`、`--yes`
- `paste-token`：`--provider <name>`、`--profile-id <id>`、`--expires-in <duration>`

说明：

- `setup-token` 和 `paste-token` 是针对公开令牌身份验证方法的提供商的通用令牌命令。
- `setup-token` 需要交互式 TTY 并运行提供商的令牌身份验证方法。
- `paste-token` 提示输入令牌值，并在省略 `--profile-id` 时默认为身份验证配置文件 ID `<provider>:manual`。
- Anthropic `setup-token`/`paste-token` 仍然作为受支持的 OpenClaw 令牌路径提供，但在可用时 OpenClaw 现在优先使用 Claude CLI 重用和 `claude -p`。

### `models auth order get|set|clear`

选项：

- `get`：`--provider <name>`、`--agent <id>`、`--json`
- `set`：`--provider <name>`、`--agent <id>`、`<profileIds...>`
- `clear`：`--provider <name>`、`--agent <id>`

## 系统

### `system event`

将系统事件排队并可选择触发心跳（Gateway RPC）。

必需：

- `--text <text>`

选项：

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`、`--token`、`--timeout`、`--expect-final`

### `system heartbeat last|enable|disable`

心跳控制（Gateway RPC）。

选项：

- `--json`
- `--url`、`--token`、`--timeout`、`--expect-final`

### `system presence`

列出系统存在条目（Gateway RPC）。

选项：

- `--json`
- `--url`、`--token`、`--timeout`、`--expect-final`

## Cron

管理计划作业（Gateway RPC）。参见 [/automation/cron-jobs](/automation/cron-jobs)。

子命令：

- `cron status [--json]`
- `cron list [--all] [--json]`（默认表格输出；使用 `--json` 获取原始输出）
- `cron add`（别名：`create`；需要 `--name` 和 `--at` | `--every` | `--cron` 中恰好一个，以及 `--system-event` | `--message` 中恰好一个有效负载）
- `cron edit <id>`（修补字段）
- `cron rm <id>`（别名：`remove`、`delete`）
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

所有 `cron` 命令接受 `--url`、`--token`、`--timeout`、`--expect-final`。

`cron add|edit --model ...` 使用所选允许的模型执行该作业。如果该模型不被允许，cron 会发出警告并回退到作业的 Agent/默认模型选择。已配置的回退链仍然适用，但没有显式每作业回退列表的普通模型覆盖不再将 Agent 主要模型作为隐藏的额外重试目标附加。

## Node 主机

### `node`

`node` 运行**无头 Node 主机**或将其作为后台服务管理。参见 [`openclaw node`](/cli/node)。

子命令：

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

身份验证说明：

- `node` 从环境变量/配置解析 Gateway 身份验证（无 `--token`/`--password` 标志）：`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`，然后是 `gateway.auth.*`。在本地模式下，Node 主机有意忽略 `gateway.remote.*`；在 `gateway.mode=remote` 模式下，`gateway.remote.*` 按远程优先规则参与。
- Node 主机身份验证解析仅接受 `OPENCLAW_GATEWAY_*` 环境变量。

## Nodes

`nodes` 与 Gateway 通信并定位配对的 Node。参见 [/nodes](/nodes)。

常用选项：

- `--url`、`--token`、`--timeout`、`--json`

子命令：

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]`（仅限 mac）

相机：

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + 屏幕：

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

位置：

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## 浏览器

浏览器控制 CLI（专用 Chrome/Brave/Edge/Chromium）。参见 [`openclaw browser`](/cli/browser) 和[浏览器工具](/tools/browser)。

常用选项：

- `--url`、`--token`、`--timeout`、`--expect-final`、`--json`
- `--browser-profile <name>`

管理：

- `browser status`
- `browser start`
- `browser stop`
- `browser reset-profile`
- `browser tabs`
- `browser open <url>`
- `browser focus <targetId>`
- `browser close [targetId]`
- `browser profiles`
- `browser create-profile --name <name> [--color <hex>] [--cdp-url <url>] [--driver existing-session] [--user-data-dir <path>]`
- `browser delete-profile --name <name>`

检查：

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

操作：

- `browser navigate <url> [--target-id <id>]`
- `browser resize <width> <height> [--target-id <id>]`
- `browser click <ref> [--double] [--button <left|right|middle>] [--modifiers <csv>] [--target-id <id>]`
- `browser type <ref> <text> [--submit] [--slowly] [--target-id <id>]`
- `browser press <key> [--target-id <id>]`
- `browser hover <ref> [--target-id <id>]`
- `browser drag <startRef> <endRef> [--target-id <id>]`
- `browser select <ref> <values...> [--target-id <id>]`
- `browser upload <paths...> [--ref <ref>] [--input-ref <ref>] [--element <selector>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser fill [--fields <json>] [--fields-file <path>] [--target-id <id>]`
- `browser dialog --accept|--dismiss [--prompt <text>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser wait [--time <ms>] [--text <value>] [--text-gone <value>] [--target-id <id>]`
- `browser evaluate --fn <code> [--ref <ref>] [--target-id <id>]`
- `browser console [--level <error|warn|info>] [--target-id <id>]`
- `browser pdf [--target-id <id>]`

## 语音通话

### `voicecall`

插件提供的语音通话工具。仅在安装并启用语音通话插件时出现。参见 [`openclaw voicecall`](/cli/voicecall)。

常用命令：

- `voicecall call --to <phone> --message <text> [--mode notify|conversation]`
- `voicecall start --to <phone> [--message <text>] [--mode notify|conversation]`
- `voicecall continue --call-id <id> --message <text>`
- `voicecall speak --call-id <id> --message <text>`
- `voicecall end --call-id <id>`
- `voicecall status --call-id <id>`
- `voicecall tail [--file <path>] [--since <n>] [--poll <ms>]`
- `voicecall latency [--file <path>] [--last <n>]`
- `voicecall expose [--mode off|serve|funnel] [--path <path>] [--port <port>] [--serve-path <path>]`

## 文档搜索

### `docs`

搜索实时 OpenClaw 文档索引。

### `docs [query...]`

搜索实时文档索引。

## TUI

### `tui`

打开连接到 Gateway 的终端 UI。

选项：

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>`（默认为 `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`
