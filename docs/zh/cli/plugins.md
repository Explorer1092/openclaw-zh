---
mmh3_hash: "8476b248ba23c0e8e673fef85cb88dc8"
summary: "`openclaw plugins` 的 CLI 参考（init、build、validate、列表、安装、marketplace、卸载、启用/禁用、doctor）"
read_when:
  - 您想安装或管理 Gateway Plugin 或兼容包
  - 您想搭建或验证简单的工具 Plugin
  - 您想调试 Plugin 加载失败
title: "Plugins"
sidebarTitle: "Plugins"
---

管理 Gateway Plugin、Hook 包和兼容包。

<CardGroup cols={2}>
  <Card title="Plugin 系统" href="/tools/plugin">
    安装、启用和排除 Plugin 故障的最终用户指南。
  </Card>
  <Card title="管理 Plugin" href="/plugins/manage-plugins">
    安装、列出、更新、卸载和发布的快速示例。
  </Card>
  <Card title="Plugin 包" href="/plugins/bundles">
    包兼容性模型。
  </Card>
  <Card title="Plugin 清单" href="/plugins/manifest">
    清单字段和配置架构。
  </Card>
  <Card title="安全性" href="/gateway/security">
    Plugin 安装的安全加固。
  </Card>
</CardGroup>

## 命令

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
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
openclaw plugins init <id>
openclaw plugins init <id> --directory ./my-plugin --name "My Plugin"
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

对于缓慢的安装、检查、卸载或注册表刷新调查，使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 运行命令。跟踪将阶段计时写入 stderr 并保持 JSON 输出可解析。请参阅[调试](/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，Plugin 生命周期变更操作被禁用。对于此安装，请使用 Nix 源代替 `plugins install`、`plugins update`、`plugins uninstall`、`plugins enable` 或 `plugins disable`；对于 nix-openclaw，使用 Agent 优先的[快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
捆绑的 Plugin 随 OpenClaw 一起提供。有些默认启用（例如捆绑的模型 Provider、捆绑的语音 Provider 和捆绑的浏览器 Plugin）；其他需要 `plugins enable`。

原生 OpenClaw Plugin 必须附带 `openclaw.plugin.json` 和内联 JSON Schema（`configSchema`，即使为空）。兼容包使用其自己的包清单代替。

`plugins list` 显示 `Format: openclaw` 或 `Format: bundle`。详细列表/信息输出还显示包子类型（`codex`、`claude` 或 `cursor`）以及检测到的包能力。
</Note>

### 创作

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` 创建一个使用 `defineToolPlugin` 的最小 TypeScript 工具 Plugin。`plugins build` 导入该入口，读取其静态工具元数据，写入 `openclaw.plugin.json`，并保持 `package.json` `openclaw.extensions` 对齐。`plugins validate` 检查生成的清单、包元数据和当前入口导出是否一致。请参阅[工具 Plugin](/plugins/tool-plugins) 了解完整的编写工作流程。

scaffold 写入 TypeScript 源，但从构建的 `./dist/index.js` 入口生成元数据，因此工作流程也适用于已发布的 CLI。当入口不是默认包入口时，使用 `--entry <path>`。在 CI 中使用 `plugins build --check` 在生成的元数据过期时失败，而不重写文件。

### 安装

```bash
openclaw plugins search "calendar"                   # 搜索 ClawHub Plugin
openclaw plugins install <package>                      # 默认从 npm
openclaw plugins install clawhub:<package>              # 仅 ClawHub
openclaw plugins install npm:<package>                  # 仅 npm
openclaw plugins install npm-pack:<path.tgz>            # 通过 npm install 语义的本地 npm pack
openclaw plugins install git:github.com/<owner>/<repo>  # git 仓库
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # 覆盖现有安装
openclaw plugins install <package> --pin                # 固定版本
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # 本地路径
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace（显式）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

测试设置时安装的维护者可以使用受保护的环境变量覆盖自动 Plugin 安装源。请参阅 [Plugin 安装覆盖](/plugins/install-overrides)。

<Warning>
在启动切换期间，裸包名默认从 npm 安装。对于 ClawHub 使用 `clawhub:<package>`。将 Plugin 安装视为运行代码。优先使用固定版本。
</Warning>

`plugins search` 查询 ClawHub 以获取可安装的 Plugin 包并打印安装就绪的包名。它搜索代码 Plugin 和包 Plugin，而非技能。对于 ClawHub 技能使用 `openclaw skills search`。

<Note>
ClawHub 是大多数 Plugin 的主要分发和发现界面。Npm 仍然是受支持的后备和直接安装路径。OpenClaw 拥有的 `@openclaw/*` Plugin 包再次发布在 npm 上；请参阅 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 上的当前列表或 [Plugin 清单](/plugins/plugin-inventory)。稳定安装使用 `latest`。测试版渠道安装和更新优先使用 npm `beta` dist-tag（如果该标签可用），然后回退到 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="配置包含和无效配置修复">
    如果您的 `plugins` 部分由单文件 `$include` 支持，`plugins install/update/enable/disable/uninstall` 会写入该包含文件，保持 `openclaw.json` 不变。根包含、包含数组和带有兄弟覆盖的包含会关闭失败，而不是展平。请参阅[配置包含](/gateway/configuration)了解支持的形状。

    如果在安装期间配置无效，`plugins install` 通常会关闭失败并告诉您先运行 `openclaw doctor --fix`。在 Gateway 启动和热重载期间，无效的 Plugin 配置与任何其他无效配置一样关闭失败；`openclaw doctor --fix` 可以隔离无效的 Plugin 条目。唯一记录的安装时异常是针对明确选择加入 `openclaw.install.allowInvalidConfigRecovery` 的捆绑 Plugin 的窄恢复路径。

  </Accordion>
  <Accordion title="--force 和重新安装与更新">
    `--force` 重用现有安装目标，并就地覆盖已安装的 Plugin 或 Hook 包。当您有意从新的本地路径、归档、ClawHub 包或 npm 工件重新安装相同 ID 时使用。对于已跟踪的 npm Plugin 的常规升级，优先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果您为已安装的 Plugin ID 运行 `plugins install`，OpenClaw 会停止并指向 `plugins update <id-or-npm-spec>` 进行正常升级，或在您确实想从不同源覆盖当前安装时指向 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 范围">
    `--pin` 仅适用于 npm 安装。不支持 `git:` 安装；当您想要固定源时，使用显式的 git 引用，如 `git:github.com/acme/plugin@v1.2.3`。不支持 `--marketplace`，因为 marketplace 安装保留 marketplace 源元数据而不是 npm 规范。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是内置危险代码扫描器误报的紧急措施选项。即使内置扫描器报告 `critical` 发现，它也允许安装继续，但它**不**绕过 Plugin `before_install` Hook 策略块，**不**绕过扫描失败。

    此 CLI 标志适用于 Plugin 安装/更新流程。Gateway 支持的技能依赖安装使用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是单独的 ClawHub 技能下载/安装流程。

    如果您在 ClawHub 上发布的 Plugin 被注册表扫描阻止，请使用 [ClawHub](/clawhub/security) 中的发布者步骤。

  </Accordion>
  <Accordion title="Hook 包和 npm 规范">
    `plugins install` 也是在 `package.json` 中公开 `openclaw.hooks` 的 Hook 包的安装界面。使用 `openclaw hooks` 进行过滤的 Hook 可见性和每 Hook 启用，而不是包安装。

    Npm 规范是**仅注册表**的（包名 + 可选**精确版本**或 **dist-tag**）。Git/URL/文件规范和语义版本范围被拒绝。依赖安装在项目本地运行，带 `--ignore-scripts` 以确保安全，即使您的 Shell 有全局 npm 安装设置。托管 Plugin npm 根目录继承 OpenClaw 的包级 npm `overrides`，因此主机安全固定适用于提升的 Plugin 依赖项。

    当您想使 npm 解析显式时，使用 `npm:<package>`。在启动切换期间，裸包规范也直接从 npm 安装。

    裸规范和 `@latest` 保持在稳定轨道上。OpenClaw 日期戳更正版本（如 `2026.5.3-1`）是此检查的稳定版本。如果 npm 将其中任何一个解析为预发布版本，OpenClaw 会停止并要求您明确选择加入，使用预发布标签（如 `@beta`/`@rc`）或精确的预发布版本（如 `@1.2.3-beta.4`）。

    如果裸安装规范匹配官方 Plugin ID（例如 `diffs`），OpenClaw 直接安装目录条目。要安装同名的 npm 包，请使用显式的范围规范（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 仓库">
    使用 `git:<repo>` 直接从 git 仓库安装。支持的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整的 `https://`、`ssh://`、`git://`、`file://` 和 `git@host:owner/repo.git` 克隆 URL。添加 `@<ref>` 或 `#<ref>` 以在安装前检出分支、标签或提交。

    Git 安装克隆到临时目录，在有请求的引用时检出，然后使用普通的 Plugin 目录安装程序。这意味着清单验证、危险代码扫描、包管理器安装工作和安装记录的行为与 npm 安装相同。记录的 git 安装包括源 URL/引用加上解析的提交，以便 `openclaw plugins update` 以后可以重新解析源。

    从 git 安装后，使用 `openclaw plugins inspect <id> --runtime --json` 验证运行时注册（如 Gateway 方法和 CLI 命令）。如果 Plugin 用 `api.registerCli` 注册了 CLI 根目录，请通过 OpenClaw 根 CLI 直接执行该命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="归档">
    支持的归档：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw Plugin 归档必须在提取的 Plugin 根目录包含有效的 `openclaw.plugin.json`；仅包含 `package.json` 的归档在 OpenClaw 写入安装记录之前被拒绝。

    当文件是 npm-pack tarball 且您想测试注册表安装使用的同一托管 npm 根安装路径（包括 `package-lock.json` 验证、提升的依赖项扫描和 npm 安装记录）时，使用 `npm-pack:<path.tgz>`。纯归档路径仍然作为本地归档安装在 Plugin 扩展根目录下。

    也支持 Claude marketplace 安装。

  </Accordion>
</AccordionGroup>

ClawHub 安装使用显式的 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

裸 npm 安全 Plugin 规范在启动切换期间默认从 npm 安装：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 使仅 npm 解析显式：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 在安装前检查通告的 Plugin API/最低 Gateway 兼容性。当选定的 ClawHub 版本发布 ClawPack 工件时，OpenClaw 下载版本化的 npm-pack `.tgz`，验证 ClawHub 摘要标头和工件摘要，然后通过普通的归档路径安装它。没有 ClawPack 元数据的旧版 ClawHub 仍然通过旧版包归档验证路径安装。记录的安装保留其 ClawHub 源元数据、工件类型、npm 完整性、npm shasum、tarball 名称和 ClawPack 摘要事实以供以后更新。
无版本的 ClawHub 安装保留无版本的记录规范，以便 `openclaw plugins update` 可以跟进较新的 ClawHub 版本；显式版本或标签选择器（如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）保持固定在该选择器。

#### Marketplace 简写

当 marketplace 名称存在于 Claude 的本地注册表缓存 `~/.claude/plugins/known_marketplaces.json` 中时，使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

当您想显式传递 marketplace 源时，使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
```

<Tabs>
  <Tab title="Marketplace 来源">
    - `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 marketplace 名称
    - 本地 marketplace 根目录或 `marketplace.json` 路径
    - GitHub 仓库简写，如 `owner/repo`
    - GitHub 仓库 URL，如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="远程 marketplace 规则">
    对于从 GitHub 或 git 加载的远程 marketplace，Plugin 条目必须保留在克隆的 marketplace 仓库内。OpenClaw 接受来自该仓库的相对路径源，并拒绝来自远程清单的 HTTP(S)、绝对路径、git、GitHub 和其他非路径 Plugin 源。
  </Tab>
</Tabs>

对于本地路径和归档，OpenClaw 自动检测：

- 原生 OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 兼容包（`.codex-plugin/plugin.json`）
- Claude 兼容包（`.claude-plugin/plugin.json` 或默认 Claude 组件布局）
- Cursor 兼容包（`.cursor-plugin/plugin.json`）

<Note>
兼容包安装到普通的 Plugin 根目录，并参与相同的列表/信息/启用/禁用流程。目前，支持包技能、Claude 命令技能、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor 命令技能和兼容的 Codex Hook 目录；其他检测到的包能力在诊断/信息中显示，但尚未连接到运行时执行。
</Note>

### 列表

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  仅显示已启用的 Plugin。
</ParamField>
<ParamField path="--verbose" type="boolean">
  从表格视图切换到带有源/来源/版本/激活元数据的每 Plugin 详细行。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读清单加上注册表诊断和包依赖安装状态。
</ParamField>

<Note>
`plugins list` 首先读取持久化的本地 Plugin 注册表，当注册表缺失或无效时使用仅清单的派生回退。它对检查 Plugin 是否已安装、已启用且对冷启动规划可见很有用，但它不是已运行 Gateway 进程的实时运行时探测。更改 Plugin 代码、启用状态、Hook 策略或 `plugins.load.paths` 后，在期望新的 `register(api)` 代码或 Hook 运行之前，重启服务该 Channel 的 Gateway。对于远程/容器部署，验证您是在重启实际的 `openclaw gateway run` 子进程，而不只是包装进程。

`plugins list --json` 包括每个 Plugin 的 `package.json` `dependencies` 和 `optionalDependencies` 中的 `dependencyStatus`。OpenClaw 检查这些包名是否沿 Plugin 的普通 Node `node_modules` 查找路径存在；它不导入 Plugin 运行时代码、运行包管理器或修复缺失的依赖项。
</Note>

`plugins search` 是远程 ClawHub 目录查找。它不检查本地状态、改变配置、安装包或加载 Plugin 运行时代码。搜索结果包括 ClawHub 包名、系列、Channel、版本、摘要和安装提示，如 `openclaw plugins install clawhub:<package>`。

对于打包的 Docker 镜像内的捆绑 Plugin 工作，将 Plugin 源目录绑定挂载到匹配的打包源路径上，如 `/app/extensions/synology-chat`。OpenClaw 在 `/app/dist/extensions/synology-chat` 之前发现该挂载的源覆盖；纯复制的源目录保持不活动，因此普通的打包安装仍然使用编译后的 dist。

对于运行时 Hook 调试：

- `openclaw plugins inspect <id> --runtime --json` 显示来自模块加载检查过程的已注册 Hook 和诊断。运行时检查从不安装依赖项；使用 `openclaw doctor --fix` 清理旧版依赖状态或恢复配置引用的缺失可下载 Plugin。
- `openclaw gateway status --deep --require-rpc` 确认可达的 Gateway、服务/进程提示、配置路径和 RPC 健康。
- 非捆绑的会话 Hook（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 避免复制本地目录（添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支持 `--link`，因为链接安装重用源路径而不是复制到托管的安装目标上。

在 npm 安装上使用 `--pin` 将解析的精确规范（`name@version`）保存在托管的 Plugin 索引中，同时保持默认行为为未固定。
</Note>

### Plugin 索引

Plugin 安装元数据是机器管理的状态，而非用户配置。安装和更新将其写入活动 OpenClaw 状态目录下的 `plugins/installs.json`。其顶级 `installRecords` 映射是安装元数据的持久来源，包括损坏或缺失 Plugin 清单的记录。`plugins` 数组是清单派生的冷注册表缓存。该文件包含禁止编辑的警告，并由 `openclaw plugins update`、卸载、诊断和冷 Plugin 注册表使用。

当 OpenClaw 看到配置中已发布的旧版 `plugins.installs` 记录时，运行时读取将其作为兼容性输入而不重写 `openclaw.json`。显式的 Plugin 写入和 `openclaw doctor --fix` 将这些记录移入 Plugin 索引，并在允许配置写入时删除配置键；如果任一写入失败，配置记录将保留，以免安装元数据丢失。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 从 `plugins.entries`、持久化的 Plugin 索引、Plugin 允许/拒绝列表条目和链接的 `plugins.load.paths` 条目（如适用）中删除 Plugin 记录。除非设置了 `--keep-files`，卸载还会在跟踪的托管安装目录在 OpenClaw 的 Plugin 扩展根目录内时删除它。对于活动的内存 Plugin，内存槽重置为 `memory-core`。

<Note>
`--keep-config` 作为 `--keep-files` 的已弃用别名受支持。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新适用于托管 Plugin 索引中跟踪的 Plugin 安装和 `hooks.internal.installs` 中跟踪的 Hook 包安装。

<AccordionGroup>
  <Accordion title="解析 Plugin ID 与 npm 规范">
    当您传递 Plugin ID 时，OpenClaw 重用该 Plugin 的记录安装规范。这意味着以前存储的 dist-tag（如 `@beta`）和精确固定版本在以后的 `update <id>` 运行中继续使用。

    对于 npm 安装，您也可以传递带有 dist-tag 或精确版本的显式 npm 包规范。OpenClaw 将该包名解析回跟踪的 Plugin 记录，更新该已安装的 Plugin，并记录新的 npm 规范以供未来基于 ID 的更新使用。

    传递没有版本或标签的 npm 包名也会解析回跟踪的 Plugin 记录。当 Plugin 被固定到精确版本而您想将其移回注册表的默认发布线时使用此功能。

  </Accordion>
  <Accordion title="测试版渠道更新">
    `openclaw plugins update` 重用跟踪的 Plugin 规范，除非您传递新规范。`openclaw update` 还知道活动的 OpenClaw 更新渠道：在测试版渠道上，默认线 npm 和 ClawHub Plugin 记录首先尝试 `@beta`，然后如果不存在 Plugin 测试版则回退到记录的默认/最新规范。精确版本和显式标签保持固定在该选择器。

  </Accordion>
  <Accordion title="版本检查和完整性漂移">
    在实时 npm 更新之前，OpenClaw 根据 npm 注册表元数据检查已安装的包版本。如果已安装版本和记录的工件标识已与解析的目标匹配，则跳过更新，不下载、重新安装或重写 `openclaw.json`。

    当存储的完整性哈希存在而获取的工件哈希变化时，OpenClaw 将其视为 npm 工件漂移。交互式 `openclaw plugins update` 命令打印预期和实际哈希，并在继续之前询问确认。非交互式更新助手关闭失败，除非调用者提供显式的继续策略。

  </Accordion>
  <Accordion title="更新时的 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也在 `plugins update` 上作为 Plugin 更新期间内置危险代码扫描误报的紧急覆盖可用。它仍然不绕过 Plugin `before_install` 策略块或扫描失败阻止，并且只适用于 Plugin 更新，而不是 Hook 包更新。
  </Accordion>
</AccordionGroup>

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

检查显示身份、加载状态、源、清单能力、策略标志、诊断、安装元数据、包能力以及任何检测到的 MCP 或 LSP 服务器支持，默认不导入 Plugin 运行时。添加 `--runtime` 以加载 Plugin 模块并包含已注册的 Hook、工具、命令、服务、Gateway 方法和 HTTP 路由。运行时检查直接报告缺失的 Plugin 依赖项；安装和修复留给 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix`。

Plugin 拥有的 CLI 命令通常安装为根 `openclaw` 命令组，但 Plugin 也可以在核心父级下注册嵌套命令，如 `openclaw nodes`。`inspect --runtime` 在 `cliCommands` 下显示命令后，在列出的路径运行它；例如注册 `demo-git` 的 Plugin 可以用 `openclaw demo-git ping` 验证。

每个 Plugin 按其在运行时实际注册的内容分类：

- **plain-capability** — 一种能力类型（例如仅 Provider Plugin）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 只有 Hook，没有能力或界面
- **non-capability** — 工具/命令/服务，但没有能力

请参阅 [Plugin 形状](/plugins/architecture#plugin-shapes) 了解更多关于能力模型的信息。

<Note>
`--json` 标志输出适合脚本和审计的机器可读报告。`inspect --all` 渲染带有形状、能力类型、兼容性通知、包能力和 Hook 摘要列的全组表格。`info` 是 `inspect` 的别名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 报告 Plugin 加载错误、清单/发现诊断、兼容性通知和过期的 Plugin 配置引用（如缺失的 Plugin 槽）。当安装树和 Plugin 配置都正常时，打印 `No plugin issues detected.`。如果存在过期配置但安装树本身健康，则摘要会说明这一点，而不暗示完整的 Plugin 健康状况。

如果已配置的 Plugin 在磁盘上存在，但被加载器的路径安全检查阻止，配置验证会保留 Plugin 条目并将其报告为 `present but blocked`。修复前面的被阻止 Plugin 诊断，如路径所有权或全球可写权限，而不是删除 `plugins.entries.<id>` 或 `plugins.allow` 配置。

对于缺失 `register`/`activate` 导出等模块形状失败，使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以在诊断输出中包含紧凑的导出形状摘要。

### 注册表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地 Plugin 注册表是 OpenClaw 的持久化冷读模型，用于已安装 Plugin 标识、启用状态、源元数据和贡献所有权。普通启动、Provider 所有者查找、Channel 设置分类和 Plugin 清单可以在不导入 Plugin 运行时模块的情况下读取它。

使用 `plugins registry` 检查持久化注册表是否存在、当前或过期。使用 `--refresh` 从持久化的 Plugin 索引、配置策略和清单/包元数据重建它。这是修复路径，而非运行时激活路径。

`openclaw doctor --fix` 还修复注册表相邻的托管 npm 漂移：如果托管的 Plugin npm 根目录下孤立或恢复的 `@openclaw/*` 包遮蔽了捆绑的 Plugin，doctor 会删除该过期包并重建注册表，以便启动对捆绑的清单进行验证。Doctor 还会将主机 `openclaw` 包重新链接到声明了 `peerDependencies.openclaw` 的托管 npm Plugin 中，以便在更新或 npm 修复后，包本地运行时导入（如 `openclaw/plugin-sdk/*`）能够正确解析。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是注册表读取失败的已弃用紧急兼容性开关。优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；环境变量回退仅用于迁移推出时的紧急启动恢复。
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace 列表接受本地 marketplace 路径、`marketplace.json` 路径、GitHub 简写（如 `owner/repo`）、GitHub 仓库 URL 或 git URL。`--json` 打印解析的源标签加上解析的 marketplace 清单和 Plugin 条目。

## 相关

- [构建 Plugin](/plugins/building-plugins)
- [CLI 参考](/cli)
- [ClawHub](/clawhub)
