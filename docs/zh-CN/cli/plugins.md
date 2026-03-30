---
read_when:
  - 你想安装或管理 Gateway 网关插件或兼容 Bundle
  - 你想调试插件加载失败问题
summary: "`openclaw plugins` 的 CLI 参考（列表、安装、Marketplace、卸载、启用/禁用、诊断）"
title: plugins
x-i18n:
  generated_at: "2026-02-03T07:45:08Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 26d947b41ce2d95ce8d2ee6c40259e1c6460759a087c61deea4d4826535650fb
  source_path: cli/plugins.md
  workflow: 15
---

# `openclaw plugins`

管理 Gateway 网关插件/扩展、hook 包和兼容 Bundle。

相关内容：

- 插件系统：[插件](/tools/plugin)
- Bundle 兼容性：[插件 Bundle](/plugins/bundles)
- 插件清单 + 模式：[插件清单](/plugins/manifest)
- 安全加固：[安全](/gateway/security)

## 命令

```bash
openclaw plugins list
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
```

内置插件随 OpenClaw 一起发布，但默认禁用。使用 `plugins enable` 来激活它们。

原生 OpenClaw 插件必须提供带内联 JSON Schema 的 `openclaw.plugin.json`（`configSchema`，即使为空）。兼容 Bundle 使用其自己的 Bundle 清单代替。

`plugins list` 显示 `Format: openclaw` 或 `Format: bundle`。详细的列表/信息输出还会显示 Bundle 子类型（`codex`、`claude` 或 `cursor`）加上检测到的 Bundle 能力。

### 安装

```bash
openclaw plugins install <package>                      # 先查 ClawHub，再查 npm
openclaw plugins install clawhub:<package>              # 仅 ClawHub
openclaw plugins install <package> --pin                # 固定版本
openclaw plugins install <path>                         # 本地路径
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace（显式）
```

裸包名称先对照 ClawHub 检查，再对照 npm 检查。安全提示：将插件安装视为运行代码。优先使用固定版本。

`plugins install` 也是暴露 `package.json` 中 `openclaw.hooks` 的 hook 包的安装入口。使用 `openclaw hooks` 进行过滤 hook 可见性和单 hook 启用，而不是包安装。

npm 规格仅限**注册表**（包名 + 可选**精确版本**或 **dist-tag**）。Git/URL/文件规格和 semver 范围会被拒绝。依赖安装以 `--ignore-scripts` 运行以保证安全。

裸规格和 `@latest` 保持在稳定频道。如果 npm 将两者解析为预发布版本，OpenClaw 会停止并要求你用预发布 tag（如 `@beta`/`@rc`）或精确预发布版本（如 `@1.2.3-beta.4`）明确选择加入。

如果裸安装规格与内置插件 id 匹配（例如 `diffs`），OpenClaw 直接安装内置插件。要安装同名 npm 包，请使用显式作用域规格（例如 `@scope/diffs`）。

支持的归档格式：`.zip`、`.tgz`、`.tar.gz`、`.tar`。

Claude marketplace 安装也受支持。

ClawHub 安装使用显式 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 现在对裸 npm 安全插件规格也优先选择 ClawHub。仅在 ClawHub 没有该包或版本时才回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw 从 ClawHub 下载包归档，检查公布的插件 API / 最低 gateway 兼容性，然后通过正常归档路径安装。记录的安装保留其 ClawHub 来源元数据以供后续更新使用。

当 marketplace 名称存在于 Claude 本地注册表缓存 `~/.claude/plugins/known_marketplaces.json` 时，使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

当你想显式传递 marketplace 来源时，使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Marketplace 来源可以是：

- `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 marketplace 名称
- 本地 marketplace 根目录或 `marketplace.json` 路径
- GitHub 仓库简写，如 `owner/repo`
- git URL

对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须保留在克隆的 marketplace 仓库中。OpenClaw 接受来自该仓库的相对路径来源，并拒绝远程清单中的外部 git、GitHub、URL/归档和绝对路径插件来源。

对于本地路径和归档，OpenClaw 自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容 Bundle（`.codex-plugin/plugin.json`）
- Claude 兼容 Bundle（`.claude-plugin/plugin.json` 或默认 Claude 组件布局）
- Cursor 兼容 Bundle（`.cursor-plugin/plugin.json`）

兼容 Bundle 安装到正常的 extensions 根目录，并参与相同的列表/信息/启用/禁用流程。目前支持 Bundle Skills、Claude 命令 Skills、Claude `settings.json` 默认值、Cursor 命令 Skills 和兼容 Codex hook 目录；其他检测到的 Bundle 能力在诊断/信息中显示，但尚未接入运行时执行。

使用 `--link` 避免复制本地目录（添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

在 npm 安装时使用 `--pin` 可将解析的精确规格（`name@version`）保存到 `plugins.installs`，同时保持默认行为不固定版本。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 从 `plugins.entries`、`plugins.installs`、插件允许列表和关联的 `plugins.load.paths` 条目中删除插件记录。对于活动内存插件，内存槽重置为 `memory-core`。

默认情况下，卸载也会删除活动 state-dir 插件根目录下的插件安装目录。使用 `--keep-files` 保留磁盘文件。

`--keep-config` 作为 `--keep-files` 的弃用别名受支持。

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
```

更新适用于 `plugins.installs` 中跟踪的安装和 `hooks.internal.installs` 中跟踪的 hook 包安装。

传入插件 id 时，OpenClaw 重用该插件记录的安装规格。这意味着之前存储的 dist-tag（如 `@beta`）和精确固定版本在后续 `update <id>` 运行时继续使用。

对于 npm 安装，你也可以传入带 dist-tag 或精确版本的显式 npm 包规格。OpenClaw 将该包名解析回已跟踪的插件记录，更新已安装的插件，并记录新的 npm 规格以供后续基于 id 的更新使用。

当存储的完整性哈希存在且获取的工件哈希发生变化时，OpenClaw 打印警告并在继续前请求确认。在 CI/非交互运行中使用全局 `--yes` 绕过提示。

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

对单个插件进行深度自检。显示身份、加载状态、来源、已注册能力、hooks、工具、命令、服务、gateway 方法、HTTP 路由、策略标志、诊断和安装元数据。

每个插件按其在运行时实际注册的内容分类：

- **plain-capability** — 一种能力类型（例如仅提供商插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 只有 hooks，没有能力或界面
- **non-capability** — 工具/命令/服务但没有能力

参见[插件形状](/plugins/architecture#plugin-shapes)了解能力模型的更多信息。

`--json` 标志输出适合脚本和审计的机器可读报告。

`info` 是 `inspect` 的别名。
