---
mmh3_hash: "3b89a361b5378fb84c189521ade35971"
title: "`openclaw hooks`"
sidebarTitle: "openclaw hooks"
summary: "`openclaw hooks` 的 CLI 参考(Agent Hook)"
read_when:
  - 您想管理 Agent Hook
  - 您想检查 Hook 可用性或启用工作区 Hook
---

# `openclaw hooks`

管理 Agent Hook(用于 `/new`、`/reset` 和 Gateway 启动等命令的事件驱动自动化)。

相关:

- Hook:[Hook](/automation/hooks)
- Plugin Hook:[Plugin hooks](/plugins/hooks)

## 列出所有 Hook

```bash
openclaw hooks list
```

列出从工作区、管理、扩展和捆绑目录发现的所有 Hook。Gateway 启动在至少配置了一个内部 Hook 之前不会加载内部 Hook 处理程序。

**选项:**

- `--eligible`:仅显示符合条件的 Hook(满足要求)
- `--json`:输出为 JSON
- `-v, --verbose`:显示详细信息,包括缺少的要求

**示例输出:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**示例(详细):**

```bash
openclaw hooks list --verbose
```

显示不符合条件的 Hook 缺少的要求。

**示例(JSON):**

```bash
openclaw hooks list --json
```

返回结构化 JSON 供程序使用。

## 获取 Hook 信息

```bash
openclaw hooks info <name>
```

显示特定 Hook 的详细信息。

**参数:**

- `<name>`:Hook 名称(例如,`session-memory`)

**选项:**

- `--json`:输出为 JSON

**示例:**

```bash
openclaw hooks info session-memory
```

**输出:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## 检查 Hook 资格

```bash
openclaw hooks check
```

显示 Hook 资格状态摘要(准备就绪与未准备就绪的数量)。

**选项:**

- `--json`:输出为 JSON

**示例输出:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## 启用 Hook

```bash
openclaw hooks enable <name>
```

通过将特定 Hook 添加到您的配置(`~/.openclaw/openclaw.json`)来启用它。

**注意:** 工作区 Hook 默认禁用,需要在此处启用或在配置中启用。由 Plugin 管理的 Hook 在 `openclaw hooks list` 中显示 `plugin:<id>`,不能在此处启用/禁用。请改为启用/禁用 Plugin。

**参数:**

- `<name>`:Hook 名称(例如,`session-memory`)

**示例:**

```bash
openclaw hooks enable session-memory
```

**输出:**

```
✓ Enabled hook: 💾 session-memory
```

**它的作用:**

- 检查 Hook 是否存在且符合条件
- 在配置中更新 `hooks.internal.entries.<name>.enabled = true`
- 将配置保存到磁盘

如果 Hook 来自 `<workspace>/hooks/`,则需要此选择加入步骤,Gateway 才会加载它。

**启用后:**

- 重新启动 Gateway 以重新加载 Hook(在 macOS 上重新启动菜单栏应用,或在开发中重新启动 Gateway 进程)。

## 禁用 Hook

```bash
openclaw hooks disable <name>
```

通过更新配置来禁用特定 Hook。

**参数:**

- `<name>`:Hook 名称(例如,`command-logger`)

**示例:**

```bash
openclaw hooks disable command-logger
```

**输出:**

```
⏸ Disabled hook: 📝 command-logger
```

**禁用后:**

- 重新启动 Gateway 以重新加载 Hook

## 安装 Hook 包

```bash
openclaw plugins install <package>        # ClawHub 优先,然后 npm
openclaw plugins install npm:<package>    # 仅 npm
openclaw plugins install <package> --pin  # 固定版本
openclaw plugins install <path>           # 本地路径
```

通过统一的插件安装程序安装 Hook 包。

`openclaw hooks install` 仍可作为兼容性别名使用,但会打印弃用警告并转发到 `openclaw plugins install`。

Npm 规范**仅限注册表**(包名称 + 可选**精确版本**或**发行标签**)。Git/URL/文件规范和语义版本范围被拒绝。依赖项安装使用 `--ignore-scripts` 运行以确保安全。

裸规范和 `@latest` 保持稳定轨道。如果 npm 将其中任一解析为预发布版本,OpenClaw 会停止并要求您使用预发布标签(例如 `@beta`/`@rc`)或精确的预发布版本明确选择加入。

**它的作用:**

- 将 Hook 包复制到 `~/.openclaw/hooks/<id>`
- 在 `hooks.internal.entries.*` 中启用已安装的 Hook
- 在 `hooks.internal.installs` 下记录安装

**选项:**

- `-l, --link`:链接本地目录而不是复制(将其添加到 `hooks.internal.load.extraDirs`)
- `--pin`:将 npm 安装记录为 `hooks.internal.installs` 中精确解析的 `name@version`

**支持的存档:** `.zip`、`.tgz`、`.tar.gz`、`.tar`

**示例:**

```bash
# 本地目录
openclaw plugins install ./my-hook-pack

# 本地存档
openclaw plugins install ./my-hook-pack.zip

# NPM 包
openclaw plugins install @openclaw/my-hook-pack

# 链接本地目录而不复制
openclaw plugins install -l ./my-hook-pack
```

链接的 Hook 包被视为操作员配置目录中的托管 Hook,而非工作区 Hook。

## 更新 Hook 包

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

通过统一的插件更新程序更新已跟踪的基于 npm 的 Hook 包。

`openclaw hooks update` 仍可作为兼容性别名使用,但会打印弃用警告并转发到 `openclaw plugins update`。

**选项:**

- `--all`:更新所有跟踪的 Hook 包
- `--dry-run`:显示将更改的内容而不写入

当存在已存储的完整性哈希且获取的构件哈希发生变化时,OpenClaw 会打印警告并在继续前请求确认。在 CI/非交互运行中使用全局 `--yes` 跳过提示。

## 捆绑 Hook

### session-memory

在您发出 `/new` 或 `/reset` 时将 Session 上下文保存到内存。

**启用:**

```bash
openclaw hooks enable session-memory
```

**输出:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**参见:** [session-memory 文档](/automation/hooks#session-memory)

### bootstrap-extra-files

在 `agent:bootstrap` 期间注入额外的引导文件(例如单体仓库本地的 `AGENTS.md` / `TOOLS.md`)。

**启用:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**参见:** [bootstrap-extra-files 文档](/automation/hooks#bootstrap-extra-files)

### command-logger

将所有命令事件记录到集中审计文件。

**启用:**

```bash
openclaw hooks enable command-logger
```

**输出:** `~/.openclaw/logs/commands.log`

**查看日志:**

```bash
# 最近的命令
tail -n 20 ~/.openclaw/logs/commands.log

# 美化打印
cat ~/.openclaw/logs/commands.log | jq .

# 按操作过滤
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**参见:** [command-logger 文档](/automation/hooks#command-logger)

### boot-md

在 Gateway 启动时运行 `BOOT.md`(Channel 启动后)。

**事件**: `gateway:startup`

**启用**:

```bash
openclaw hooks enable boot-md
```

**参见:** [boot-md 文档](/automation/hooks#boot-md)

## 说明

- `openclaw hooks list --json`、`info --json` 和 `check --json` 将结构化 JSON 直接写入 stdout。
- Plugin 管理的 Hook 不能在此处启用或禁用；请改为启用或禁用拥有该 Hook 的 Plugin。

## 相关

- [CLI 参考](/cli)
- [Automation hooks](/automation/hooks)
