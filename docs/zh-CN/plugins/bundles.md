---
mmh3_hash: "dddc1ca61e91071df9dfc3ef95125a1e"
title: Plugin Bundles
summary: 安装并使用 Codex、Claude 和 Cursor Bundle 作为 OpenClaw 插件
read_when:
  - 你想安装 Codex、Claude 或 Cursor 兼容的 Bundle
  - 你需要了解 OpenClaw 如何将 Bundle 内容映射为原生功能
  - 你在调试 Bundle 检测或缺失能力的问题
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: plugins/bundles.md
  workflow: 15
---

# Plugin Bundles

OpenClaw 可以从三个外部生态系统安装插件：**Codex**、**Claude** 和 **Cursor**。这些被称为 **Bundle**——包含内容和元数据的包，OpenClaw 将其映射为原生功能，如 Skills、Hook 和 MCP 工具。

<Info>
  Bundle **不**等同于原生 OpenClaw 插件。原生插件在进程内运行，可注册任意能力。Bundle 是内容包，功能映射有限，信任边界也更窄。
</Info>

## Bundle 存在的意义

许多实用的插件以 Codex、Claude 或 Cursor 格式发布。OpenClaw 无需要求作者将其重写为原生插件，而是自动检测这些格式并将其支持的内容映射到原生功能集。这意味着你可以安装 Claude 命令包或 Codex Skill Bundle 并立即使用。

## 安装 Bundle

<Steps>
  <Step title="从目录、归档文件或市场安装">
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

  <Step title="验证检测结果">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundle 显示为 `Format: bundle`，子类型为 `codex`、`claude` 或 `cursor`。

  </Step>

  <Step title="重启并使用">
    ```bash
    openclaw gateway restart
    ```

    映射的功能（Skills、Hook、MCP 工具）将在下一个 Session 中可用。

  </Step>
</Steps>

## OpenClaw 从 Bundle 中映射的内容

并非所有 Bundle 功能目前都能在 OpenClaw 中运行。以下是已支持的功能和已检测但尚未接入的功能。

### 当前支持

| 功能            | 映射方式                                                                     | 适用格式        |
| --------------- | ---------------------------------------------------------------------------- | --------------- |
| Skill 内容      | Bundle Skill 根目录作为普通 OpenClaw Skills 加载                             | 所有格式        |
| 命令            | `commands/` 和 `.cursor/commands/` 被视为 Skill 根目录                       | Claude、Cursor  |
| Hook 包         | OpenClaw 风格的 `HOOK.md` + `handler.ts` 布局                                | Codex           |
| MCP 工具        | Bundle MCP 配置合并到嵌入式 Pi 设置；加载支持的 stdio 和 HTTP 服务器         | 所有格式        |
| 设置            | Claude `settings.json` 作为嵌入式 Pi 默认值导入                              | Claude          |

#### Skill 内容

- Bundle Skill 根目录作为普通 OpenClaw Skill 根目录加载
- Claude `commands` 根目录被视为额外的 Skill 根目录
- Cursor `.cursor/commands` 根目录被视为额外的 Skill 根目录

这意味着 Claude Markdown 命令文件通过普通的 OpenClaw Skill 加载器工作。Cursor 命令 Markdown 也走相同路径。

#### Hook 包

- Bundle Hook 根目录**仅**在使用 OpenClaw Hook 包布局时才有效。目前这主要是 Codex 兼容的情况：
  - `HOOK.md`
  - `handler.ts` 或 `handler.js`

#### MCP for Pi

- 已启用的 Bundle 可以提供 MCP 服务器配置
- OpenClaw 将 Bundle MCP 配置合并到有效的嵌入式 Pi 设置中（作为 `mcpServers`）
- OpenClaw 在嵌入式 Pi Agent 轮次中通过启动 stdio 服务器或连接 HTTP 服务器来暴露支持的 Bundle MCP 工具
- 项目本地的 Pi 设置在 Bundle 默认值之后仍然生效，因此工作区设置可以在需要时覆盖 Bundle MCP 条目

##### 传输方式

MCP 服务器可以使用 stdio 或 HTTP 传输：

**Stdio** 启动子进程：

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** 默认通过 `sse` 连接到运行中的 MCP 服务器，或在请求时使用 `streamable-http`：

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` 可设置为 `"streamable-http"` 或 `"sse"`；省略时 OpenClaw 使用 `sse`
- 只允许 `http:` 和 `https:` URL Scheme
- `headers` 值支持 `${ENV_VAR}` 插值
- 同时包含 `command` 和 `url` 的服务器条目会被拒绝
- URL 凭证（用户信息和查询参数）会从工具描述和日志中脱敏
- `connectionTimeoutMs` 覆盖 stdio 和 HTTP 传输的默认 30 秒连接超时

##### 工具命名

OpenClaw 以 `serverName__toolName` 的形式为 Bundle MCP 工具注册 Provider 安全名称。例如，键名为 `"vigil-harbor"` 的服务器暴露的 `memory_search` 工具注册为 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 以外的字符替换为 `-`
- 服务器前缀最长 30 个字符
- 完整工具名最长 64 个字符
- 空服务器名回退为 `mcp`
- 冲突的规范化名称使用数字后缀消歧

#### 嵌入式 Pi 设置

- 启用 Bundle 时，Claude `settings.json` 作为默认嵌入式 Pi 设置导入
- OpenClaw 在应用前会对 Shell 覆盖键进行清理

清理的键：

- `shellPath`
- `shellCommandPrefix`

### 已检测但未执行

这些内容会被识别并显示在诊断信息中，但 OpenClaw 不会运行它们：

- Claude 的 `agents`、`hooks.json` 自动化、`lspServers`、`outputStyles`
- Cursor 的 `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex 的内联/应用元数据（能力报告之外的部分）

## Bundle 格式

<AccordionGroup>
  <Accordion title="Codex Bundle">
    标识文件：`.codex-plugin/plugin.json`

    可选内容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    使用 Skill 根目录和 OpenClaw 风格 Hook 包目录（`HOOK.md` + `handler.ts`）的 Codex Bundle 与 OpenClaw 最兼容。

  </Accordion>

  <Accordion title="Claude Bundle">
    两种检测模式：

    - **基于 Manifest：** `.claude-plugin/plugin.json`
    - **无 Manifest：** 默认 Claude 布局（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`settings.json`）

    Claude 特有行为：

    - `commands/` 被视为 Skill 内容
    - `settings.json` 导入到嵌入式 Pi 设置中（Shell 覆盖键会被清理）
    - `.mcp.json` 向嵌入式 Pi 暴露支持的 stdio 工具
    - `hooks/hooks.json` 被检测但不执行
    - Manifest 中的自定义组件路径是累加的（扩展默认值，不替换）

  </Accordion>

  <Accordion title="Cursor Bundle">
    标识文件：`.cursor-plugin/plugin.json`

    可选内容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 被视为 Skill 内容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 仅做检测

  </Accordion>
</AccordionGroup>

## 检测优先级

OpenClaw 优先检查原生插件格式：

1. `openclaw.plugin.json` 或包含 `openclaw.extensions` 的有效 `package.json` — 视为**原生插件**
2. Bundle 标识文件（`.codex-plugin/`、`.claude-plugin/` 或默认 Claude/Cursor 布局）— 视为 **Bundle**

如果目录同时包含两者，OpenClaw 使用原生路径。这可以防止双格式包被部分安装为 Bundle。

## 安全性

Bundle 的信任边界比原生插件更窄：

- OpenClaw **不**在进程内加载任意 Bundle 运行时模块
- Skills 和 Hook 包路径必须位于插件根目录内（边界检查）
- 设置文件的读取也受相同的边界检查
- 支持的 stdio MCP 服务器可能作为子进程启动

这使 Bundle 默认更安全，但你仍应将第三方 Bundle 视为其暴露功能范围内的可信内容来对待。

## 故障排查

<AccordionGroup>
  <Accordion title="Bundle 被检测到但能力未运行">
    运行 `openclaw plugins inspect <id>`。如果某能力已列出但标记为未接入，这是产品限制——而非安装问题。
  </Accordion>

  <Accordion title="Claude 命令文件不显示">
    确保 Bundle 已启用，且 Markdown 文件在已检测的 `commands/` 或 `skills/` 根目录内。
  </Accordion>

  <Accordion title="Claude 设置未生效">
    只支持来自 `settings.json` 的嵌入式 Pi 设置。OpenClaw 不会将 Bundle 设置作为原始配置补丁处理。
  </Accordion>

  <Accordion title="Claude Hook 未执行">
    `hooks/hooks.json` 仅做检测。如果需要可运行的 Hook，请使用 OpenClaw Hook 包布局或发布原生插件。
  </Accordion>
</AccordionGroup>

## 相关文档

- [安装和配置插件](/tools/plugin)
- [构建插件](/plugins/building-plugins) — 创建原生插件
- [Plugin Manifest](/plugins/manifest) — 原生 Manifest Schema
