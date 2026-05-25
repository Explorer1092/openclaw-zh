---
mmh3_hash: "5242f58606082c658882856aac1a261e"
summary: "安装 Codex、Claude 和 Cursor 兼容的 Bundle 作为 OpenClaw Plugin"
read_when:
  - 您想安装 Codex、Claude 或 Cursor 兼容的 Bundle
  - 您需要了解 OpenClaw 执行哪些 Bundle 功能
  - 您正在调试 Bundle 检测、MCP Tool、LSP 默认值或缺失能力问题
title: "Plugin Bundle"
doc-schema-version: 1
---

Plugin Bundle 让 OpenClaw 无需将 Codex、Claude 和 Cursor 兼容的 Plugin 加载为原生 OpenClaw 运行时模块即可复用它们。当您已有一个现有 Bundle 并需要安装它、了解 OpenClaw 如何分类它、以及理解哪些部分会成为 OpenClaw Skill、Hook、MCP Tool、设置或诊断信息时，请参阅本页面。

<Info>
  Bundle **不**等同于原生 OpenClaw Plugin。原生 Plugin 在进程内运行，可以直接注册 OpenClaw 能力。Bundle 是 OpenClaw 选择性映射到支持界面的内容和元数据包。
</Info>

## 选择合适的 Plugin 格式

当您已有 Codex、Claude 或 Cursor 兼容的包，并希望 OpenClaw 将其支持的内容映射到 Skill、Hook 包、MCP Tool、设置或 LSP 默认值，而无需将其重写为原生 Plugin 时，请使用 Bundle。当集成必须注册 Channel、Provider、服务、HTTP 路由、Gateway 方法、Plugin 拥有的 CLI 命令或其他运行时能力时，请构建原生 OpenClaw Plugin。

| 需求                                                                            | 使用          |
| ------------------------------------------------------------------------------- | ------------- |
| 从兼容生态系统复用 Skill、命令 Markdown、MCP 配置或 LSP 默认值                 | Bundle        |
| 在 OpenClaw 中执行任意 Plugin 运行时代码                                       | 原生 Plugin   |
| 发布完整的 OpenClaw 能力                                                        | 原生 Plugin   |
| 移植现有 Claude 或 Cursor 命令包                                                | Bundle        |

请参阅 [构建 Plugin](/plugins/building-plugins) 了解原生 Plugin 创作，参阅 [Plugin](/tools/plugin) 了解主要安装工作流。

## 安装和验证 Bundle

<Steps>
  <Step title="安装 Bundle">
    从本地目录、归档或支持的市场来源安装：

    ```bash
    # 本地目录
    openclaw plugins install ./my-bundle

    # 归档文件
    openclaw plugins install ./my-bundle.tgz

    # Claude 市场
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="检查检测结果">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    兼容的 Bundle 显示为 `Format: bundle`，子类型为 `codex`、`claude` 或 `cursor`。

  </Step>

  <Step title="重启 Gateway">
    ```bash
    openclaw gateway restart
    ```

    安装或更新 Plugin 代码需要重启 Gateway。

  </Step>
</Steps>

## OpenClaw 从 Bundle 中映射的内容

并非所有 Bundle 功能今天都能在 OpenClaw 中运行。OpenClaw 将支持的内容映射到原生界面，并在 Plugin 诊断中报告仅检测到的内容。

### 当前支持

| 功能          | 映射方式                                                                                       | 适用格式       |
| ------------- | ---------------------------------------------------------------------------------------------- | -------------- |
| Skill 内容    | Bundle Skill 根作为普通 OpenClaw Skill 加载                                                    | 所有格式       |
| 命令          | `commands/` 和 `.cursor/commands/` 被视为 Skill 根                                             | Claude、Cursor |
| Hook 包       | OpenClaw 风格的 `HOOK.md` 和 `handler.ts` 或 `handler.js` 布局                                 | 主要是 Codex   |
| MCP Tool      | Bundle MCP 配置合并到嵌入式 Pi 设置中；支持的 stdio 和 HTTP 服务器被加载                       | 所有格式       |
| LSP 服务器    | Claude `.lsp.json` 和清单声明的 `lspServers` 合并到嵌入式 Pi LSP 默认值中                      | Claude         |
| 设置          | Claude `settings.json` 在移除 Shell 覆盖键后作为嵌入式 Pi 默认值导入                           | Claude         |

### Skill 内容

Bundle Skill 根作为普通 OpenClaw Skill 根加载。Claude `commands/` 和 Cursor `.cursor/commands/` 通过相同路径加载。

### Hook 包

Bundle Hook 根**仅当**它们使用普通 OpenClaw Hook 包布局时才有效：带有 `handler.ts` 或 `handler.js` 的 `HOOK.md`。目前这主要是 Codex 兼容的情况。

### MCP Tool

启用的 Bundle 可以向嵌入式 Pi 贡献 MCP 服务器配置作为 `mcpServers`。支持的 stdio 和 HTTP 服务器可以在嵌入式 Pi 轮次期间暴露 Tool。`coding` 和 `messaging` 工具配置文件默认包含 Bundle MCP Tool；使用 `tools.deny: ["bundle-mcp"]` 可为某个 Agent 或 Gateway 退出。

### 嵌入式 Pi 设置

当 Bundle 启用时，Claude `settings.json` 作为默认嵌入式 Pi 设置导入。OpenClaw 在应用前清理 Shell 覆盖键。

### 嵌入式 Pi LSP

Claude `.lsp.json` 和清单声明的 `lspServers` 合并到嵌入式 Pi LSP 默认值中。支持的 stdio 后端 LSP 服务器可以运行。

### 已检测但未执行

OpenClaw 在诊断中报告这些内容但不运行它们：

- Claude `agents`、`hooks/hooks.json`、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex 应用或内联元数据

## Bundle 格式和检测

OpenClaw 在检查 Bundle 标记之前先检查原生 Plugin 标记。包含 `openclaw.plugin.json` 或有效 `package.json` `openclaw.extensions` 条目的目录被视为原生 Plugin，即使它也包含 Bundle 文件。这防止双格式包通过 Bundle 路径被部分加载。

原生检测之后，OpenClaw 识别以下 Bundle 布局：

<AccordionGroup>
  <Accordion title="Codex Bundle">
    标记：`.codex-plugin/plugin.json`

    支持的映射内容：`skills/`、`hooks/`、`.mcp.json` 和 `.app.json` 能力报告。

    当 Codex Bundle 使用 Skill 根和 OpenClaw 风格的 Hook 包目录时，最适合 OpenClaw。

  </Accordion>

  <Accordion title="Claude Bundle">
    检测模式：

    - **基于清单：** `.claude-plugin/plugin.json`
    - **无清单：** 带有 `skills/`、`commands/`、`agents/`、`hooks/hooks.json`、`.mcp.json`、`.lsp.json` 或 `settings.json` 的默认 Claude 布局

    支持的映射内容：`skills/`、`commands/`、`settings.json`、`.mcp.json`、`.lsp.json`、清单声明的 `mcpServers` 和清单声明的 `lspServers`。

    仅检测内容：`agents`、`hooks/hooks.json` 和 `outputStyles`。

  </Accordion>

  <Accordion title="Cursor Bundle">
    标记：`.cursor-plugin/plugin.json`

    支持的映射内容：`skills/`、`.cursor/commands/` 和 `.mcp.json`。

    仅检测内容：`.cursor/agents`、`.cursor/hooks.json` 和 `.cursor/rules`。

  </Accordion>
</AccordionGroup>

Claude 清单组件路径是加法性的。声明自定义路径会扩展 Bundle 中现有的默认路径，而不是替换它们。

## MCP 配置参考

Bundle MCP Tool 使用合成 Plugin 键 `bundle-mcp` 进行配置文件过滤。要为某个 Agent 或 Gateway 退出，请拒绝该键：

```json5
{
  tools: {
    deny: ["bundle-mcp"],
  },
}
```

项目本地嵌入式 Pi 设置在 Bundle 默认值之后仍然适用，因此工作区设置可以在需要时覆盖 Bundle MCP 条目。

### MCP 配置格式

Bundle MCP 文件可以使用 `mcpServers`、`servers` 或顶层服务器映射。Stdio 服务器启动子进程：

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["server.js"],
      "env": { "PORT": "3000" }
    }
  }
}
```

HTTP 服务器默认通过 `sse` 连接，或在请求时使用 `streamable-http`：

```json
{
  "mcpServers": {
    "my-server": {
      "url": "http://localhost:3100/mcp",
      "transport": "streamable-http",
      "headers": {
        "Authorization": "Bearer local-dev-token"
      },
      "connectionTimeoutMs": 30000
    }
  }
}
```

规则：

- `transport` 可以是 `"sse"` 或 `"streamable-http"`。省略时，OpenClaw 使用 `sse`。
- `type: "http"` 是 CLI 原生下游别名。Bundle 配置中优先使用 `transport: "streamable-http"`；`openclaw mcp set` 和 `openclaw doctor --fix` 会规范化该别名。
- 仅支持 `http:` 和 `https:` URL。
- `headers` 必须是具有字符串兼容值的 JSON 对象。
- 带有 `command` 的服务器条目被视为 stdio。带有 `url` 且无 command 的服务器条目被视为 HTTP。
- URL 凭证（包括 userinfo 和查询参数）会从 Tool 描述和日志中编辑删除。
- `connectionTimeoutMs` 覆盖 stdio 和 HTTP 传输的默认 30 秒连接超时。

对于 stdio 启动安全，不支持的环境变量条目会以诊断方式忽略，而不是盲目传递。

### MCP 路径和 Tool 名称

文件支持的 MCP 配置相对于声明它的 Bundle 文件解析。显式的相对 `command`、`args`、`cwd` 和 `workingDirectory` 值相对于该文件的目录展开。Claude Bundle 配置还可以使用 `${CLAUDE_PLUGIN_ROOT}` 引用 Bundle 根目录。

OpenClaw 使用 Provider 安全名称注册 Bundle MCP Tool：

```text
serverName__toolName
```

命名规则：

- `A-Za-z0-9_-` 以外的字符替换为 `-`。
- 服务器前缀必须以字母开头；数字服务器键获得 `mcp-` 前缀。
- 空服务器名称回退到 `mcp`。
- 服务器前缀上限为 30 个字符。
- 完整 Tool 名称上限为 64 个字符。
- 冲突的清理后名称获得数字后缀。
- 暴露的 Tool 按安全名称确定性排序，使重复的 Pi 轮次保持稳定的 Tool 块。
- 配置文件允许列表和拒绝列表可以指定单个暴露的 Tool 或 `bundle-mcp` Plugin 键。

## 嵌入式 Pi 设置和 LSP 默认值

启用的 Claude Bundle 可以向嵌入式 Pi 运行时贡献 `settings.json` 默认值。OpenClaw 在项目本地设置之前应用这些设置，然后清理 Shell 覆盖键，使 Bundle 或工作区设置无法更改 Shell 执行行为。

清理的键：

- `shellPath`
- `shellCommandPrefix`

启用的 Claude Bundle 还可以通过 `.lsp.json` 或清单声明的 `lspServers` 贡献 LSP 服务器配置。OpenClaw 将这些条目合并到嵌入式 Pi LSP 默认值中。支持的 stdio 后端 LSP 服务器可以运行；不支持的服务器条目仍会显示在 `openclaw plugins inspect <id>` 诊断中。

## 运行时依赖和清理

第三方兼容 Bundle 在启动时不会获得 `npm install` 修复。通过 `openclaw plugins install` 安装它们，并在已安装的 Plugin 目录中附带所需的每个运行时文件。

OpenClaw 自有的打包 Plugin 要么以轻量方式随核心发布，要么可通过 Plugin 安装器下载。Gateway 启动时不为它们运行包管理器。`openclaw doctor --fix` 可以移除遗留的暂存依赖目录，并在配置引用但本地 Plugin 索引中缺失的可下载 Plugin 时进行恢复。

## 安全边界

Bundle 的运行时边界比原生 Plugin 更窄：

- OpenClaw 不在进程内加载任意 Bundle 运行时模块。
- Skill 根、Hook 包路径、设置文件、MCP 文件和 LSP 文件通过 Plugin 根边界检查读取。
- OpenClaw 风格的 Hook 包必须保持在 Plugin 根目录内。
- 支持的 stdio MCP 服务器仍然可以启动子进程。

对于第三方 Bundle 所映射的功能，请将其视为受信任的内容，尤其是 MCP 服务器和 Hook 包。

## 故障排除

| 症状                                         | 检查                                                                             | 修复                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 能力已列出但未运行                           | 运行 `openclaw plugins inspect <id>` 并检查是否标记为未连接                      | 这是当前产品限制，不是损坏的安装                                                               |
| Claude 命令文件不显示为 Skill               | 检查 Markdown 文件是否在 `commands/` 或声明的命令路径内                           | 将文件移至已检测的 `commands/` 或 `skills/` 根目录，启用 Bundle 并重启                        |
| Claude `settings.json` 未应用               | 检查 Bundle 是否已启用并查看诊断                                                  | 仅导入嵌入式 Pi 设置；Shell 覆盖键会被移除                                                    |
| Claude Hook 未执行                           | 检查 Bundle 是否只有 `hooks/hooks.json`                                           | 使用 OpenClaw Hook 包布局或提供原生 Plugin                                                     |

## 相关

- [Plugin](/tools/plugin) - 安装、配置和排查 Plugin 问题
- [管理 Plugin](/plugins/manage-plugins) - 常见 Plugin CLI 示例
- [Plugin 清单](/plugins/plugin-inventory) - 生成的打包和外部 Plugin 列表
- [Plugin Manifest](/plugins/manifest) - 原生 Plugin Manifest Schema
- [构建 Plugin](/plugins/building-plugins) - 创建原生 Plugin
