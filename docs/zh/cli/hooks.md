---
mmh3_hash: "ebfe8d933c2311a51e7d3c510537b34d"
title: "`openclaw hooks`"
sidebarTitle: "openclaw hooks"
summary: "`openclaw hooks` 的 CLI 参考(Agent Hook)"
read_when:
  - 您想管理Agent Hook
  - 您想安装或更新Hook
---

# `openclaw hooks`

管理Agent Hook(用于 `/new`、`/reset` 和Gateway启动等命令的事件驱动自动化)。

相关:

- Hook:[Hook](/automation/hooks)
- Plugin Hook:[Plugin](/tools/plugin#plugin-hooks)

## 列出所有Hook

```bash
openclaw hooks list
```

列出从工作区、管理和捆绑目录发现的所有Hook。

**选项:**

- `--eligible`:仅显示符合条件的Hook(满足要求)
- `--json`:输出为 JSON
- `-v, --verbose`:显示详细信息,包括缺少的要求

**示例输出:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new command is issued
```

**示例(详细):**

```bash
openclaw hooks list --verbose
```

显示不符合条件的Hook缺少的要求。

**示例(JSON):**

```bash
openclaw hooks list --json
```

返回结构化 JSON 供程序使用。

## 获取Hook信息

```bash
openclaw hooks info <name>
```

显示特定Hook的详细信息。

**参数:**

- `<name>`:Hook名称(例如,`session-memory`)

**选项:**

- `--json`:输出为 JSON

**示例:**

```bash
openclaw hooks info session-memory
```

**输出:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new

Requirements:
  Config: ✓ workspace.dir
```

## 检查Hook资格

```bash
openclaw hooks check
```

显示Hook资格状态摘要(准备就绪与未准备就绪的数量)。

**选项:**

- `--json`:输出为 JSON

**示例输出:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## 启用Hook

```bash
openclaw hooks enable <name>
```

通过将特定Hook添加到您的配置(`~/.openclaw/config.json`)来启用它。

**注意:** 由Plugin管理的Hook在 `openclaw hooks list` 中显示 `plugin:<id>`,不能在此处启用/禁用。请改为启用/禁用Plugin。

**参数:**

- `<name>`:Hook名称(例如,`session-memory`)

**示例:**

```bash
openclaw hooks enable session-memory
```

**输出:**

```
✓ Enabled hook: 💾 session-memory
```

**它的作用:**

- 检查Hook是否存在且符合条件
- 在配置中更新 `hooks.internal.entries.<name>.enabled = true`
- 将配置保存到磁盘

**启用后:**

- 重新启动Gateway以重新加载Hook(在 macOS 上重新启动菜单栏应用,或在开发中重新启动Gateway进程)。

## 禁用Hook

```bash
openclaw hooks disable <name>
```

通过更新配置来禁用特定Hook。

**参数:**

- `<name>`:Hook名称(例如,`command-logger`)

**示例:**

```bash
openclaw hooks disable command-logger
```

**输出:**

```
⏸ Disabled hook: 📝 command-logger
```

**禁用后:**

- 重新启动Gateway以重新加载Hook

## 安装Hook

```bash
openclaw hooks install <path-or-spec>
```

从本地文件夹/存档或 npm 安装Hook包。

Npm 规范**仅限注册表**(包名称 + 可选版本/标签)。Git/URL/文件规范被拒绝。依赖项安装使用 `--ignore-scripts` 运行以确保安全。

**它的作用:**

- 将Hook包复制到 `~/.openclaw/hooks/<id>`
- 在 `hooks.internal.entries.*` 中启用已安装的Hook
- 在 `hooks.internal.installs` 下记录安装

**选项:**

- `-l, --link`:链接本地目录而不是复制(将其添加到 `hooks.internal.load.extraDirs`)

**支持的存档:** `.zip`、`.tgz`、`.tar.gz`、`.tar`

**示例:**

```bash
# 本地目录
openclaw hooks install ./my-hook-pack

# 本地存档
openclaw hooks install ./my-hook-pack.zip

# NPM 包
openclaw hooks install @openclaw/my-hook-pack

# 链接本地目录而不复制
openclaw hooks install -l ./my-hook-pack
```

## 更新Hook

```bash
openclaw hooks update <id>
openclaw hooks update --all
```

更新已安装的Hook包(仅限 npm 安装)。

**选项:**

- `--all`:更新所有跟踪的Hook包
- `--dry-run`:显示将更改的内容而不写入

## 捆绑Hook

### session-memory

在您发出 `/new` 时将Session上下文保存到内存。

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

在Gateway启动时运行 `BOOT.md`(Channel启动后)。

**事件**: `gateway:startup`

**启用**:

```bash
openclaw hooks enable boot-md
```

**参见:** [boot-md 文档](/automation/hooks#boot-md)
