---
summary: "`openclaw hooks` 的 CLI 参考（Agent Hook）"
read_when:
  - 您想管理 Agent Hook
  - 您想检查 Hook 可用性或启用工作区 Hook
title: "Hooks"
---

# `openclaw hooks`

管理 Agent Hook（用于 `/new`、`/reset` 和 Gateway 启动等命令的事件驱动自动化）。

不带子命令运行 `openclaw hooks` 等同于 `openclaw hooks list`。

相关：

- Hook：[Hooks](/automation/hooks)
- Plugin Hook：[Plugin hooks](/plugins/hooks)

## 列出所有 Hook

```bash
openclaw hooks list
```

列出从工作区、托管、额外和捆绑目录发现的所有 Hook。
Gateway 启动在至少配置了一个内部 Hook 之前不会加载内部 Hook 处理程序。

**选项：**

- `--eligible`：仅显示符合条件的 Hook（满足要求）
- `--json`：以 JSON 格式输出
- `-v, --verbose`：显示包含缺失要求的详细信息

**示例输出：**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**示例（详细）：**

```bash
openclaw hooks list --verbose
```

显示不符合条件的 Hook 的缺失要求。

**示例（JSON）：**

```bash
openclaw hooks list --json
```

返回用于程序化使用的结构化 JSON。

## 获取 Hook 信息

```bash
openclaw hooks info <name>
```

显示特定 Hook 的详细信息。

**参数：**

- `<name>`：Hook 名称或 Hook 键（例如 `session-memory`）

**选项：**

- `--json`：以 JSON 格式输出

**示例：**

```bash
openclaw hooks info session-memory
```

**输出：**

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

显示 Hook 资格状态摘要（有多少就绪与未就绪）。

**选项：**

- `--json`：以 JSON 格式输出

**示例输出：**

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

通过将其添加到您的配置（默认为 `~/.openclaw/openclaw.json`）来启用特定 Hook。

**注意：** 工作区 Hook 默认禁用，直到在此处或在配置中启用。由 Plugin 管理的 Hook 在 `openclaw hooks list` 中显示 `plugin:<id>`，不能在此处启用/禁用。请改为启用/禁用该 Plugin。

**参数：**

- `<name>`：Hook 名称（例如 `session-memory`）

**示例：**

```bash
openclaw hooks enable session-memory
```

**输出：**

```
✓ Enabled hook: 💾 session-memory
```

**操作内容：**

- 检查 Hook 是否存在且符合条件
- 更新您的配置中的 `hooks.internal.entries.<name>.enabled = true`
- 将配置保存到磁盘

如果 Hook 来自 `<workspace>/hooks/`，则在 Gateway 加载它之前需要此选择加入步骤。

**启用后：**

- 重启 Gateway 以便 Hook 重新加载（macOS 上的菜单栏应用重启，或在开发中重启 Gateway 进程）。

## 禁用 Hook

```bash
openclaw hooks disable <name>
```

通过更新您的配置禁用特定 Hook。

**参数：**

- `<name>`：Hook 名称（例如 `command-logger`）

**示例：**

```bash
openclaw hooks disable command-logger
```

**输出：**

```
⏸ Disabled hook: 📝 command-logger
```

**禁用后：**

- 重启 Gateway 以便 Hook 重新加载

## 注意事项

- `openclaw hooks list --json`、`info --json` 和 `check --json` 直接将结构化 JSON 写入 stdout。
- Plugin 管理的 Hook 不能在此处启用或禁用；请改为启用或禁用拥有的 Plugin。

## 安装 Hook 包

```bash
openclaw plugins install <package>        # 默认 npm
openclaw plugins install npm:<package>    # 仅 npm
openclaw plugins install <package> --pin  # 固定版本
openclaw plugins install <path>           # 本地路径
```

通过统一的 Plugin 安装器安装 Hook 包。

`openclaw hooks install` 仍然作为兼容性别名有效，但它打印弃用警告并转发到 `openclaw plugins install`。

Npm 规范是**仅注册表**（包名 + 可选的**精确版本**或 **dist-tag**）。Git/URL/文件规范和语义版本范围被拒绝。出于安全原因，即使您的 shell 有全局 npm 安装设置，依赖安装也以 `--ignore-scripts` 在项目本地运行。

裸规范和 `@latest` 保持在稳定轨道上。如果 npm 将其中之一解析为预发布版本，OpenClaw 会停止并要求您使用预发布标签（如 `@beta`/`@rc` 或精确的预发布版本）明确选择加入。

**操作内容：**

- 将 Hook 包复制到 `~/.openclaw/hooks/<id>`
- 在 `hooks.internal.entries.*` 中启用已安装的 Hook
- 在 `hooks.internal.installs` 下记录安装

**选项：**

- `-l, --link`：链接本地目录而不是复制（将其添加到 `hooks.internal.load.extraDirs`）
- `--pin`：将 npm 安装记录为 `hooks.internal.installs` 中精确解析的 `name@version`

**支持的归档：** `.zip`、`.tgz`、`.tar.gz`、`.tar`

**示例：**

```bash
# 本地目录
openclaw plugins install ./my-hook-pack

# 本地归档
openclaw plugins install ./my-hook-pack.zip

# NPM 包
openclaw plugins install @openclaw/my-hook-pack

# 链接本地目录而不复制
openclaw plugins install -l ./my-hook-pack
```

链接的 Hook 包被视为来自操作员配置目录的托管 Hook，而不是工作区 Hook。

## 更新 Hook 包

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

通过统一的 Plugin 更新器更新跟踪的基于 npm 的 Hook 包。

`openclaw hooks update` 仍然作为兼容性别名有效，但它打印弃用警告并转发到 `openclaw plugins update`。

**选项：**

- `--all`：更新所有跟踪的 Hook 包
- `--dry-run`：显示将要更改的内容而不写入

当存储的完整性哈希存在且获取的工件哈希改变时，OpenClaw 在继续之前打印警告并要求确认。在 CI/非交互式运行中使用全局 `--yes` 以绕过提示。

## 捆绑 Hook

### session-memory

当您发出 `/new` 或 `/reset` 时将 Session 上下文保存到 Memory。

**启用：**

```bash
openclaw hooks enable session-memory
```

**输出：** 默认为 `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md`。设置 `hooks.internal.entries.session-memory.llmSlug: true` 以获取模型生成的文件名 slug。

**参阅：** [session-memory 文档](/automation/hooks#session-memory)

### bootstrap-extra-files

在 `agent:bootstrap` 期间注入额外的引导文件（例如 monorepo 本地的 `AGENTS.md` / `TOOLS.md`）。

**启用：**

```bash
openclaw hooks enable bootstrap-extra-files
```

**参阅：** [bootstrap-extra-files 文档](/automation/hooks#bootstrap-extra-files)

### command-logger

将所有命令事件记录到集中的审计文件。

**启用：**

```bash
openclaw hooks enable command-logger
```

**输出：** `~/.openclaw/logs/commands.log`

**查看日志：**

```bash
# 最近的命令
tail -n 20 ~/.openclaw/logs/commands.log

# 格式化打印
cat ~/.openclaw/logs/commands.log | jq .

# 按操作过滤
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**参阅：** [command-logger 文档](/automation/hooks#command-logger)

### boot-md

Gateway 启动时运行 `BOOT.md`（Channel 启动后）。

**事件**：`gateway:startup`

**启用**：

```bash
openclaw hooks enable boot-md
```

**参阅：** [boot-md 文档](/automation/hooks#boot-md)

## 相关

- [CLI 参考](/cli)
- [Automation hooks](/automation/hooks)
