---
mmh3_hash: "0ec476fb3c6333fb65eb702a37d404ed"
title: "`openclaw plugins`"
sidebarTitle: "openclaw plugins"
summary: "`openclaw plugins` 的 CLI 参考(列表、安装、市场、卸载、启用/禁用、doctor)"
read_when:
  - 您想安装或管理 Gateway 插件或兼容包
  - 您想调试插件加载失败
---

管理 Gateway 插件、Hook 包和兼容包。

<CardGroup cols={2}>
  <Card title="Plugin 系统" href="/tools/plugin">
    安装、启用和排除 Plugin 故障的最终用户指南。
  </Card>
  <Card title="Plugin 包" href="/plugins/bundles">
    包兼容性模型。
  </Card>
  <Card title="Plugin 清单" href="/plugins/manifest">
    清单字段和配置 schema。
  </Card>
  <Card title="安全" href="/gateway/security">
    Plugin 安装的安全加固。
  </Card>
</CardGroup>

## 命令

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

<Note>
捆绑插件随 OpenClaw 一起提供。部分默认启用(例如捆绑的模型提供商、捆绑的语音提供商和捆绑的浏览器插件);其他需要 `plugins enable`。

原生 OpenClaw 插件必须附带内联 JSON Schema 的 `openclaw.plugin.json`(`configSchema`,即使为空)。兼容包改用其自己的包清单。

`plugins list` 显示 `Format: openclaw` 或 `Format: bundle`。详细的 list/info 输出还显示包子类型(`codex`、`claude` 或 `cursor`)以及检测到的包能力。
</Note>

### 安装

```bash
openclaw plugins install <package>                      # ClawHub 优先,然后 npm
openclaw plugins install clawhub:<package>              # 仅 ClawHub
openclaw plugins install npm:<package>                  # 仅 npm
openclaw plugins install <package> --force              # 覆盖现有安装
openclaw plugins install <package> --pin                # 固定版本
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # 本地路径
openclaw plugins install <plugin>@<marketplace>         # 市场
openclaw plugins install <plugin> --marketplace <name>  # 市场(显式)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
裸包名先检查 ClawHub,然后检查 npm。像对待运行代码一样对待插件安装。优先使用固定版本。
</Warning>

<AccordionGroup>
  <Accordion title="配置包含和无效配置恢复">
    如果您的 `plugins` 部分由单文件 `$include` 支持,`plugins install/update/enable/disable/uninstall` 会写入该包含文件并保持 `openclaw.json` 不变。根包含、包含数组和带兄弟覆盖的包含会失败关闭而不是展平。有关支持的形状,请参见[配置包含](/gateway/configuration)。

    如果配置无效,`plugins install` 通常会失败关闭并提示您先运行 `openclaw doctor --fix`。唯一有据可查的例外是针对明确选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件的窄捆绑插件恢复路径。

  </Accordion>
  <Accordion title="--force 和重装 vs 更新">
    `--force` 重用现有安装目标并就地覆盖已安装的插件或 Hook 包。当您有意从新的本地路径、存档、ClawHub 包或 npm 构件重新安装相同 ID 时使用它。对于已跟踪 npm 插件的常规升级,优先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果您对已安装的插件 ID 运行 `plugins install`,OpenClaw 会停止并指向 `plugins update <id-or-npm-spec>` 进行正常升级,或者在您真正想从不同来源覆盖当前安装时指向 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 范围">
    `--pin` 仅适用于 npm 安装。`--marketplace` 不支持它,因为市场安装持久化市场来源元数据而不是 npm 规范。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是针对内置危险代码扫描器误报的紧急选项。它允许安装在内置扫描器报告 `critical` 发现时继续,但它**不**绕过插件 `before_install` Hook 策略块,也**不**绕过扫描失败。

    此 CLI 标志适用于插件安装/更新流程。Gateway 支持的 Skill 依赖安装使用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖,而 `openclaw skills install` 仍然是单独的 ClawHub Skill 下载/安装流程。

  </Accordion>
  <Accordion title="Hook 包和 npm 规范">
    `plugins install` 也是暴露 `package.json` 中 `openclaw.hooks` 的 Hook 包的安装入口。使用 `openclaw hooks` 进行筛选的 Hook 可见性和每个 Hook 的启用控制,而非包安装。

    Npm 规范**仅限注册表**(包名称 + 可选**精确版本**或**发行标签**)。Git/URL/文件规范和语义版本范围被拒绝。依赖项安装使用 `--ignore-scripts` 在项目本地运行以确保安全,即使您的 shell 有全局 npm 安装设置。

    使用 `npm:<package>` 跳过 ClawHub 查找并直接从 npm 安装。裸包规范仍然优先使用 ClawHub,只有在 ClawHub 没有该包或版本时才回退到 npm。

    裸规范和 `@latest` 保持稳定轨道。如果 npm 将其中任一解析为预发布版本,OpenClaw 会停止并要求您使用预发布标签(例如 `@beta`/`@rc`)或精确的预发布版本(例如 `@1.2.3-beta.4`)明确选择加入。

    如果裸安装规范匹配捆绑的插件 ID(例如 `diffs`),OpenClaw 会直接安装捆绑的插件。要安装同名的 npm 包,请使用显式范围规范(例如 `@scope/diffs`)。

  </Accordion>
  <Accordion title="存档">
    支持的存档:`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 插件存档必须在提取的插件根目录包含有效的 `openclaw.plugin.json`;仅包含 `package.json` 的存档在 OpenClaw 写入安装记录之前会被拒绝。

    Claude 市场安装也受支持。

  </Accordion>
</AccordionGroup>

ClawHub 安装使用显式 `clawhub:<package>` 定位符:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 现在也对裸 npm 兼容的插件规范优先使用 ClawHub。只有 ClawHub 没有该包或版本时才回退到 npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 强制仅 npm 解析,例如当 ClawHub 不可达或您知道包仅存在于 npm 时:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 从 ClawHub 下载包存档,检查通告的插件 API / 最低 Gateway 兼容性,然后通过正常的存档路径安装它。已记录的安装保留其 ClawHub 来源元数据以供后续更新使用。
未版本化的 ClawHub 安装保留未版本化的已记录规范,以便 `openclaw plugins update` 可以跟随更新的 ClawHub 版本;显式版本或标签选择器(如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`)保持固定到该选择器。

#### 市场快捷方式

当市场名称存在于 Claude 的本地注册表缓存 `~/.claude/plugins/known_marketplaces.json` 中时,使用 `plugin@marketplace` 简写:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

当您想显式传递市场来源时,使用 `--marketplace`:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="市场来源">
    - 来自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知市场名称
    - 本地市场根目录或 `marketplace.json` 路径
    - GitHub 仓库简写(例如 `owner/repo`)
    - GitHub 仓库 URL(例如 `https://github.com/owner/repo`)
    - git URL
  </Tab>
  <Tab title="远程市场规则">
    对于来自 GitHub 或 git 加载的远程市场,插件条目必须保留在克隆的市场仓库内。OpenClaw 接受来自该仓库的相对路径来源,并拒绝来自远程清单的 HTTP(S)、绝对路径、git、GitHub 和其他非路径插件来源。
  </Tab>
</Tabs>

对于本地路径和存档,OpenClaw 自动检测:

- 原生 OpenClaw 插件(`openclaw.plugin.json`)
- Codex 兼容包(`.codex-plugin/plugin.json`)
- Claude 兼容包(`.claude-plugin/plugin.json` 或默认 Claude 组件布局)
- Cursor 兼容包(`.cursor-plugin/plugin.json`)

<Note>
兼容包安装到正常的插件根目录,并参与相同的 list/info/enable/disable 流程。目前支持包 Skill、Claude 命令 Skill、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor 命令 Skill 和兼容 Codex Hook 目录;其他检测到的包能力显示在诊断/信息中,但尚未连接到运行时执行。
</Note>

### 列表

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  仅显示已启用的插件。
</ParamField>
<ParamField path="--verbose" type="boolean">
  从表格视图切换到每个插件的详细行,包含来源/来源/版本/激活元数据。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读清单加注册表诊断。
</ParamField>

<Note>
`plugins list` 首先读取持久化的本地插件注册表,当注册表缺失或无效时使用仅清单派生的回退。它对于检查插件是否已安装、启用以及对冷启动规划可见很有用,但它不是对已运行的 Gateway 进程的实时运行时探测。更改插件代码、启用状态、Hook 策略或 `plugins.load.paths` 后,在期望新的 `register(api)` 代码或 Hook 运行之前,请重启为 Channel 提供服务的 Gateway。对于远程/容器部署,验证您重启的是实际的 `openclaw gateway run` 子进程,而不仅仅是包装进程。
</Note>

对于打包 Docker 镜像内的捆绑插件工作,将插件源目录绑定挂载到匹配的打包源路径上,例如 `/app/extensions/synology-chat`。OpenClaw 将在 `/app/dist/extensions/synology-chat` 之前发现该挂载的源覆盖;纯复制的源目录保持惰性,因此正常的打包安装仍然使用编译的 dist。

对于运行时 Hook 调试:

- `openclaw plugins inspect <id> --json` 显示从模块加载检查通过注册的 Hook 和诊断。
- `openclaw gateway status --deep --require-rpc` 确认可达的 Gateway、服务/进程提示、配置路径和 RPC 健康状况。
- 非捆绑会话 Hook(`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`)需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 避免复制本地目录(添加到 `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支持 `--link`,因为链接安装重用源路径而不是覆盖托管安装目标。

使用 `--pin` 进行 npm 安装,以将已解析的精确规范(`name@version`)保存到托管插件索引中,同时保持默认行为未固定。
</Note>

### 插件索引

插件安装元数据是机器管理的状态,而非用户配置。安装和更新将其写入活动 OpenClaw 状态目录下的 `plugins/installs.json`。其顶级 `installRecords` 映射是安装元数据的持久来源,包括损坏或缺失插件清单的记录。`plugins` 数组是清单派生的冷注册表缓存。该文件包含禁止编辑警告,并由 `openclaw plugins update`、卸载、诊断和冷插件注册表使用。

当 OpenClaw 看到配置中的遗留 `plugins.installs` 记录时,它将其移动到插件索引并删除配置键;如果任一写入失败,则保留配置记录,以免丢失安装元数据。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 从 `plugins.entries`、持久化的插件索引、插件允许/拒绝列表条目以及适用时链接的 `plugins.load.paths` 条目中删除插件记录。除非设置了 `--keep-files`,否则卸载还会在 OpenClaw 插件扩展根目录内时删除已跟踪的托管安装目录。对于活动内存插件,内存插槽重置为 `memory-core`。

<Note>
`--keep-config` 作为 `--keep-files` 的已弃用别名受支持。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新适用于托管插件索引中跟踪的插件安装以及 `hooks.internal.installs` 中跟踪的 Hook 包安装。

<AccordionGroup>
  <Accordion title="解析插件 ID 与 npm 规范">
    当您传递插件 ID 时,OpenClaw 重用该插件的已记录安装规范。这意味着之前存储的发行标签(例如 `@beta`)和精确的固定版本在后续 `update <id>` 运行中继续使用。

    对于 npm 安装,您也可以传递带有发行标签或精确版本的显式 npm 包规范。OpenClaw 将该包名解析回已跟踪的插件记录,更新已安装的插件,并记录新的 npm 规范以供将来基于 ID 的更新使用。

    传递不带版本或标签的 npm 包名也会解析回已跟踪的插件记录。当插件被固定到精确版本且您想将其移回注册表的默认发布线时使用此方法。

  </Accordion>
  <Accordion title="版本检查和完整性漂移">
    在实时 npm 更新之前,OpenClaw 将已安装的包版本与 npm 注册表元数据进行比较。如果已安装版本和已记录的构件标识已与解析的目标匹配,则跳过更新而不下载、重新安装或重写 `openclaw.json`。

    当存在已存储的完整性哈希且获取的构件哈希发生变化时,OpenClaw 将其视为 npm 构件漂移。交互式 `openclaw plugins update` 命令打印预期的和实际的哈希,并在继续之前要求确认。非交互式更新助手会失败关闭,除非调用者提供明确的继续策略。

  </Accordion>
  <Accordion title="更新时的 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 在 `plugins update` 上也可用,作为插件更新期间内置危险代码扫描误报的紧急覆盖。它仍不绕过插件 `before_install` 策略块或扫描失败阻止,且仅适用于插件更新,不适用于 Hook 包更新。
  </Accordion>
</AccordionGroup>

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

对单个插件进行深度自省。显示标识、加载状态、来源、已注册的能力、Hook、工具、命令、服务、Gateway 方法、HTTP 路由、策略标志、诊断、安装元数据、包能力以及任何检测到的 MCP 或 LSP 服务器支持。

每个插件根据其在运行时实际注册的内容进行分类:

- **plain-capability** — 一种能力类型(例如仅 Provider 插件)
- **hybrid-capability** — 多种能力类型(例如文本 + 语音 + 图像)
- **hook-only** — 仅 Hook,没有能力或界面
- **non-capability** — 工具/命令/服务但没有能力

有关能力模型的更多信息,请参见 [Plugin 形状](/plugins/architecture#plugin-shapes)。

<Note>
`--json` 标志输出适合脚本编写和审计的机器可读报告。`inspect --all` 呈现包含形状、能力类型、兼容性通知、包能力和 Hook 摘要列的全局表格。`info` 是 `inspect` 的别名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 报告插件加载错误、清单/发现诊断和兼容性通知。当一切正常时,它打印 `No plugin issues detected.`

对于缺少 `register`/`activate` 导出等模块形状失败,请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行,以在诊断输出中包含紧凑的导出形状摘要。

### 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件注册表是 OpenClaw 用于已安装插件标识、启用状态、来源元数据和贡献所有权的持久化冷读取模型。正常启动、提供商所有者查找、Channel 设置分类和插件清单可以在不导入插件运行时模块的情况下读取它。

使用 `plugins registry` 检查持久化注册表是否存在、当前或过时。使用 `--refresh` 从持久化插件索引、配置策略和清单/包元数据重建它。这是修复路径,不是运行时激活路径。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是注册表读取失败的已弃用紧急兼容性开关。优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`;env 回退仅用于迁移推出期间的紧急启动恢复。
</Warning>

### 市场

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

市场列表接受本地市场路径、`marketplace.json` 路径、GitHub 简写(如 `owner/repo`)、GitHub 仓库 URL 或 git URL。`--json` 打印已解析的来源标签以及解析的市场清单和插件条目。

## 相关

- [构建 Plugin](/plugins/building-plugins)
- [CLI 参考](/cli)
- [社区 Plugin](/plugins/community)
