---
mmh3_hash: "ccab4aa87af9ebff1a5939dff0e13679"
title: "`openclaw plugins`"
sidebarTitle: "openclaw plugins"
summary: "`openclaw plugins` 的 CLI 参考(列表、安装、市场、卸载、启用/禁用、doctor)"
read_when:
  - 您想安装或管理 Gateway 插件或兼容包
  - 您想调试插件加载失败
---

# `openclaw plugins`

管理 Gateway 插件/扩展、Hook 包和兼容包。

相关:

- Plugin 系统:[Plugins](/tools/plugin)
- 包兼容性:[Plugin bundles](/plugins/bundles)
- Plugin 清单 + 架构:[Plugin manifest](/plugins/manifest)
- 安全加固:[安全](/gateway/security)

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
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

捆绑插件随 OpenClaw 一起提供。部分默认启用(例如捆绑的模型提供商、捆绑的语音提供商和捆绑的浏览器插件);其他需要 `plugins enable`。

原生 OpenClaw 插件必须附带内联 JSON Schema 的 `openclaw.plugin.json`(`configSchema`,即使为空)。兼容包改用其自己的包清单。

`plugins list` 显示 `Format: openclaw` 或 `Format: bundle`。详细的 list/info 输出还显示包子类型(`codex`、`claude` 或 `cursor`)以及检测到的包能力。

### 安装

```bash
openclaw plugins install <package>                      # ClawHub 优先,然后 npm
openclaw plugins install clawhub:<package>              # 仅 ClawHub
openclaw plugins install <package> --force              # 覆盖现有安装
openclaw plugins install <package> --pin                # 固定版本
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # 本地路径
openclaw plugins install <plugin>@<marketplace>         # 市场
openclaw plugins install <plugin> --marketplace <name>  # 市场(显式)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

裸包名先检查 ClawHub,然后检查 npm。安全注意事项:像运行代码一样对待插件安装。优先使用固定版本。

如果配置无效,`plugins install` 通常会失败关闭并提示您先运行 `openclaw doctor --fix`。唯一有据可查的例外是针对明确选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件的窄捆绑插件恢复路径。

`--force` 重用现有安装目标并就地覆盖已安装的插件或 Hook 包。当您有意从新的本地路径、存档、ClawHub 包或 npm 构件重新安装相同 ID 时使用它。

`--pin` 仅适用于 npm 安装。`--marketplace` 不支持它,因为市场安装持久化市场来源元数据而不是 npm 规范。

`--dangerously-force-unsafe-install` 是针对内置危险代码扫描器误报的紧急选项。它允许安装在内置扫描器报告 `critical` 发现时继续,但它**不**绕过插件 `before_install` Hook 策略块,也**不**绕过扫描失败。

`plugins install` 也是暴露 `package.json` 中 `openclaw.hooks` 的 Hook 包的安装入口。使用 `openclaw hooks` 进行筛选的 Hook 可见性和每个 Hook 的启用控制,而非包安装。

Npm 规范**仅限注册表**(包名称 + 可选**精确版本**或**发行标签**)。Git/URL/文件规范和语义版本范围被拒绝。依赖项安装使用 `--ignore-scripts` 运行以确保安全。

裸规范和 `@latest` 保持稳定轨道。如果 npm 将其中任一解析为预发布版本,OpenClaw 会停止并要求您使用预发布标签(例如 `@beta`/`@rc`)或精确的预发布版本(例如 `@1.2.3-beta.4`)明确选择加入。

如果裸安装规范匹配捆绑的插件 ID(例如 `diffs`),OpenClaw 会直接安装捆绑的插件。要安装同名的 npm 包,请使用显式范围规范(例如 `@scope/diffs`)。

支持的存档:`.zip`、`.tgz`、`.tar.gz`、`.tar`。

Claude 市场安装也受支持。

ClawHub 安装使用显式 `clawhub:<package>` 定位符:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 现在也对裸 npm 兼容的插件规范优先使用 ClawHub。只有 ClawHub 没有该包或版本时才回退到 npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw 从 ClawHub 下载包存档,检查通告的插件 API / 最低 Gateway 兼容性,然后通过正常的存档路径安装它。已记录的安装保留其 ClawHub 来源元数据以供后续更新使用。

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

市场来源可以是:

- 来自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知市场名称
- 本地市场根目录或 `marketplace.json` 路径
- GitHub 仓库简写(例如 `owner/repo`)
- GitHub 仓库 URL(例如 `https://github.com/owner/repo`)
- git URL

对于来自 GitHub 或 git 加载的远程市场,插件条目必须保留在克隆的市场仓库内。OpenClaw 接受来自该仓库的相对路径来源,并拒绝来自远程清单的 HTTP(S)、绝对路径、git、GitHub 和其他非路径插件来源。

对于本地路径和存档,OpenClaw 自动检测:

- 原生 OpenClaw 插件(`openclaw.plugin.json`)
- Codex 兼容包(`.codex-plugin/plugin.json`)
- Claude 兼容包(`.claude-plugin/plugin.json` 或默认 Claude 组件布局)
- Cursor 兼容包(`.cursor-plugin/plugin.json`)

兼容包安装到正常的扩展根目录,并参与相同的 list/info/enable/disable 流程。目前支持包 Skill、Claude 命令 Skill、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor 命令 Skill 和兼容 Codex Hook 目录;其他检测到的包能力显示在诊断/信息中,但尚未连接到运行时执行。

### 列表

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

使用 `--enabled` 仅显示已加载的插件。使用 `--verbose` 从表格视图切换到每个插件的详细行,包含来源/来源/版本/激活元数据。使用 `--json` 获取机器可读清单加注册表诊断。

使用 `--link` 避免复制本地目录(添加到 `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` 不支持 `--link`,因为链接安装重用源路径而不是覆盖托管安装目标。

使用 `--pin` 进行 npm 安装,以将已解析的精确规范(`name@version`)保存到 `plugins.installs` 中,同时保持默认行为未固定。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 从 `plugins.entries`、`plugins.installs`、插件允许列表和适用时链接的 `plugins.load.paths` 条目中删除插件记录。对于活动内存插件,内存插槽重置为 `memory-core`。

默认情况下,卸载还会删除活动状态目录插件根目录下的插件安装目录。使用 `--keep-files` 在磁盘上保留文件。

`--keep-config` 作为 `--keep-files` 的已弃用别名受支持。

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新适用于 `plugins.installs` 中跟踪的安装以及 `hooks.internal.installs` 中跟踪的 Hook 包安装。

当您传递插件 ID 时,OpenClaw 重用该插件的已记录安装规范。这意味着之前存储的发行标签(例如 `@beta`)和精确的固定版本在后续 `update <id>` 运行中继续使用。

对于 npm 安装,您也可以传递带有发行标签或精确版本的显式 npm 包规范。OpenClaw 将该包名解析回已跟踪的插件记录,更新已安装的插件,并记录新的 npm 规范以供将来基于 ID 的更新使用。

当存在已存储的完整性哈希且获取的构件哈希发生变化时,OpenClaw 会打印警告并在继续前请求确认。在 CI/非交互运行中使用全局 `--yes` 跳过提示。

`--dangerously-force-unsafe-install` 在 `plugins update` 上也可用,作为插件更新期间内置危险代码扫描误报的紧急覆盖。它仍不绕过插件 `before_install` 策略块或扫描失败阻止,且仅适用于插件更新,不适用于 Hook 包更新。

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

`--json` 标志输出适合脚本编写和审计的机器可读报告。

`inspect --all` 呈现一个包含形状、能力类型、兼容性通知、包能力和 Hook 摘要列的全局表格。

`info` 是 `inspect` 的别名。

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 报告插件加载错误、清单/发现诊断和兼容性通知。当一切正常时,它打印 `No plugin issues detected.`

### 市场

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

市场列表接受本地市场路径、`marketplace.json` 路径、GitHub 简写(如 `owner/repo`)、GitHub 仓库 URL 或 git URL。`--json` 打印已解析的来源标签以及解析的市场清单和插件条目。
