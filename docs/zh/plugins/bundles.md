---
mmh3_hash: "06834684844a8180fffeb85399a5f408"
summary: "OpenClaw 中 Codex、Claude 和 Cursor bundle 的统一 bundle 格式指南"
read_when:
  - 您想安装或调试 Codex、Claude 或 Cursor 兼容的 bundle
  - 您需要了解 OpenClaw 如何将 bundle 内容映射到原生功能
  - 您正在记录 bundle 兼容性或当前支持限制
title: "Plugin Bundles"
---

# Plugin bundles

OpenClaw 支持一类共享的外部插件包：**bundle plugins**。

目前包含三个密切相关的生态系统：

- Codex bundles
- Claude bundles
- Cursor bundles

OpenClaw 在 `openclaw plugins list` 中将它们全部显示为 `Format: bundle`。
详细输出和 `openclaw plugins info <id>` 还会显示子类型（`codex`、`claude` 或 `cursor`）。

相关：

- Plugin 系统概述：[Plugins](/tools/plugin)
- CLI 安装/列表流程：[plugins](/cli/plugins)
- 原生 manifest schema：[Plugin manifest](/plugins/manifest)

## 什么是 bundle

bundle 是一个**内容/元数据包**，而不是原生的进程内 OpenClaw 插件。

目前，OpenClaw **不会**在进程内执行 bundle 运行时代码。相反，它检测已知的 bundle 文件，读取元数据，并将支持的 bundle 内容映射到原生 OpenClaw 界面，如 skills、hook packs、MCP 配置和嵌入式 Pi 设置。

这是主要的信任边界：

- 原生 OpenClaw plugin：运行时模块在进程内执行
- bundle：元数据/内容包，具有选择性功能映射

## 共享 bundle 模型

Codex、Claude 和 Cursor bundle 足够相似，以至于 OpenClaw 将它们视为一个标准化模型。

共同理念：

- 一个小的 manifest 文件，或一个默认目录布局
- 一个或多个内容根，例如 `skills/` 或 `commands/`
- 可选的工具/运行时元数据，例如 MCP、hooks、agents 或 LSP
- 作为目录或归档文件安装，然后在正常插件列表中启用

常见 OpenClaw 行为：

- 检测 bundle 子类型
- 将其标准化为一个内部 bundle 记录
- 将支持的部分映射到原生 OpenClaw 功能
- 将不支持的部分报告为已检测但未连接的能力

实际上，大多数用户不需要首先考虑特定于供应商的格式。更有用的问题是：OpenClaw 今天映射哪些 bundle 界面？

## 检测顺序

OpenClaw 在处理 bundle 之前优先选择原生 OpenClaw plugin/package 布局。

实际效果：

- `openclaw.plugin.json` 优先于 bundle 检测
- 具有有效 `package.json` + `openclaw.extensions` 的包安装使用原生安装路径
- 如果目录同时包含原生和 bundle 元数据，OpenClaw 首先将其视为原生

这避免了将双格式包部分安装为 bundle，然后稍后将其作为原生插件加载。

## 今天有效的功能

OpenClaw 将 bundle 元数据标准化为一个内部 bundle 记录，然后将支持的界面映射到现有的原生行为。

### 当前支持

#### Skill 内容

- bundle skill 根作为普通 OpenClaw skill 根加载
- Claude `commands` 根被视为附加的 skill 根
- Cursor `.cursor/commands` 根被视为附加的 skill 根

这意味着 Claude markdown 命令文件通过普通 OpenClaw skill 加载器工作。Cursor 命令 markdown 通过相同路径工作。

#### Hook packs

- bundle hook 根**仅当**它们使用普通 OpenClaw hook-pack 布局时才有效。目前这主要是 Codex 兼容的情况：
  - `HOOK.md`
  - `handler.ts` 或 `handler.js`

#### CLI 后端的 MCP

- 启用的 bundle 可以贡献 MCP 服务器配置
- 当前运行时连接由 `claude-cli` 后端使用
- OpenClaw 将 bundle MCP 配置合并到后端 `--mcp-config` 文件中

#### 嵌入式 Pi 设置

- 当 bundle 启用时，Claude `settings.json` 作为默认嵌入式 Pi 设置导入
- OpenClaw 在应用之前清理 shell 覆盖键

已清理的键：

- `shellPath`
- `shellCommandPrefix`

### 已检测但未执行

这些界面已被检测，显示在 bundle 能力中，并可能出现在诊断/信息输出中，但 OpenClaw 尚未运行它们：

- Claude `agents`
- Claude `hooks.json` 自动化
- Claude `lspServers`
- Claude `outputStyles`
- Cursor `.cursor/agents`
- Cursor `.cursor/hooks.json`
- Cursor `.cursor/rules`
- 当前映射运行时路径之外的 Cursor `mcpServers`
- 超出能力报告范围的 Codex 内联/应用元数据

## 能力报告

`openclaw plugins info <id>` 显示来自标准化 bundle 记录的 bundle 能力。

支持的能力静默加载。不支持的能力会产生如下警告：

```text
bundle capability detected but not wired into OpenClaw yet: agents
```

当前例外：

- Claude `commands` 被认为是受支持的，因为它映射到 skills
- Claude `settings` 被认为是受支持的，因为它映射到嵌入式 Pi 设置
- Cursor `commands` 被认为是受支持的，因为它映射到 skills
- bundle MCP 在 OpenClaw 实际导入的地方被认为是受支持的
- Codex `hooks` 仅对 OpenClaw hook-pack 布局被认为是受支持的

## 格式差异

这些格式很接近，但不是字节级完全相同。以下是在 OpenClaw 中重要的实际差异。

### Codex

典型标记：

- `.codex-plugin/plugin.json`
- 可选 `skills/`
- 可选 `hooks/`
- 可选 `.mcp.json`
- 可选 `.app.json`

Codex bundle 在使用 skill 根和 OpenClaw 风格的 hook-pack 目录时最适合 OpenClaw。

### Claude

OpenClaw 支持两种：

- 基于 manifest 的 Claude bundle：`.claude-plugin/plugin.json`
- 使用默认 Claude 布局的无 manifest Claude bundle

OpenClaw 识别的默认 Claude 布局标记：

- `skills/`
- `commands/`
- `agents/`
- `hooks/hooks.json`
- `.mcp.json`
- `.lsp.json`
- `settings.json`

Claude 特定说明：

- `commands/` 被视为 skill 内容
- `settings.json` 被导入到嵌入式 Pi 设置中
- `hooks/hooks.json` 已被检测，但不作为 Claude 自动化执行

### Cursor

典型标记：

- `.cursor-plugin/plugin.json`
- 可选 `skills/`
- 可选 `.cursor/commands/`
- 可选 `.cursor/agents/`
- 可选 `.cursor/rules/`
- 可选 `.cursor/hooks.json`
- 可选 `.mcp.json`

Cursor 特定说明：

- `.cursor/commands/` 被视为 skill 内容
- `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 目前仅为检测阶段

## Claude 自定义路径

Claude bundle manifest 可以声明自定义组件路径。OpenClaw 将这些路径视为**追加**，而不是替换默认值。

当前识别的自定义路径键：

- `skills`
- `commands`
- `agents`
- `hooks`
- `mcpServers`
- `lspServers`
- `outputStyles`

示例：

- 默认 `commands/` 加上 manifest `commands: "extra-commands"` => OpenClaw 扫描两者
- 默认 `skills/` 加上 manifest `skills: ["team-skills"]` => OpenClaw 扫描两者

## 安全模型

bundle 支持有意比原生插件支持更窄。

当前行为：

- bundle 发现在边界检查的情况下读取插件根内的文件
- skills 和 hook-pack 路径必须保持在插件根内
- bundle 设置文件以相同的边界检查读取
- OpenClaw 不在进程内执行任意 bundle 运行时代码

这使 bundle 支持默认比原生插件模块更安全，但对于它们确实公开的功能，您仍应将第三方 bundle 视为受信任的内容。

## 安装示例

```bash
openclaw plugins install ./my-codex-bundle
openclaw plugins install ./my-claude-bundle
openclaw plugins install ./my-cursor-bundle
openclaw plugins install ./my-bundle.tgz
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
openclaw plugins info my-bundle
```

如果目录是原生 OpenClaw plugin/package，原生安装路径仍然优先。

对于 Claude marketplace 名称，OpenClaw 读取 `~/.claude/plugins/known_marketplaces.json` 中的本地 Claude 已知 marketplace 注册表。Marketplace 条目可以解析为 bundle 兼容的目录/归档文件或原生插件源；解析后，正常安装规则仍然适用。

## 故障排除

### Bundle 已检测但能力未运行

检查 `openclaw plugins info <id>`。

如果能力已列出但 OpenClaw 说它尚未连接，这是真实的产品限制，而不是安装损坏。

### Claude 命令文件不显示

确保 bundle 已启用，且 markdown 文件位于检测到的 `commands` 根或 `skills` 根内。

### Claude 设置未应用

当前支持仅限于来自 `settings.json` 的嵌入式 Pi 设置。OpenClaw 不将 bundle 设置视为原始 OpenClaw 配置补丁。

### Claude hooks 未执行

`hooks/hooks.json` 目前仅被检测。

如果今天需要可运行的 bundle hooks，请通过支持的 Codex hook 根使用普通 OpenClaw hook-pack 布局，或提供原生 OpenClaw 插件。
