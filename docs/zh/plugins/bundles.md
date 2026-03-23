---
mmh3_hash: "f8d17bb5262b43116e8bae7e65f214b4"
summary: "安装和使用 Codex、Claude 和 Cursor Bundle 作为 OpenClaw Plugin"
read_when:
  - 您想安装 Codex、Claude 或 Cursor 兼容的 Bundle
  - 您需要了解 OpenClaw 如何将 Bundle 内容映射到原生功能
  - 您正在调试 Bundle 检测或缺失能力问题
title: "Plugin Bundle"
---

# Plugin Bundle

OpenClaw 可以从三个外部生态系统安装 Plugin：**Codex**、**Claude** 和 **Cursor**。这些被称为 **Bundle** — 内容和元数据包，OpenClaw 将其映射到原生功能，如 Skill、Hook 和 MCP Tool。

<Info>
  Bundle **不**等同于原生 OpenClaw Plugin。原生 Plugin 在进程内运行，可以注册任何能力。Bundle 是具有选择性功能映射和更窄信任边界的内容包。
</Info>

## Bundle 存在的原因

许多有用的 Plugin 以 Codex、Claude 或 Cursor 格式发布。OpenClaw 检测这些格式并将其支持的内容映射到原生功能集，而不是要求作者将其重写为原生 OpenClaw Plugin。这意味着您可以安装 Claude 命令包或 Codex Skill Bundle 并立即使用。

## 安装 Bundle

<Steps>
  <Step title="从目录、归档或市场安装">
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

  <Step title="验证检测">
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

    映射的功能（Skill、Hook、MCP Tool）在下一个会话中可用。

  </Step>
</Steps>

## OpenClaw 从 Bundle 中映射的内容

并非所有 Bundle 功能今天都能在 OpenClaw 中运行。以下是有效的和已检测但尚未连接的内容。

### 当前支持

| 功能          | 映射方式                                                                                       | 适用格式     |
| ------------- | ---------------------------------------------------------------------------------------------- | ------------ |
| Skill 内容    | Bundle Skill 根作为普通 OpenClaw Skill 加载                                                    | 所有格式     |
| 命令          | `commands/` 和 `.cursor/commands/` 被视为 Skill 根                                             | Claude、Cursor |
| Hook 包       | OpenClaw 风格的 `HOOK.md` + `handler.ts` 布局                                                  | Codex        |
| MCP Tool      | Bundle MCP 配置合并到嵌入式 Pi 设置中；支持的 stdio 服务器作为子进程启动                       | 所有格式     |
| 设置          | Claude `settings.json` 作为嵌入式 Pi 默认值导入                                                | Claude       |

### 已检测但未执行

这些已被识别并显示在诊断中，但 OpenClaw 不运行它们：

- Claude `agents`、`hooks.json` 自动化、`lspServers`、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- 超出能力报告范围的 Codex 内联/应用元数据

## Bundle 格式

<AccordionGroup>
  <Accordion title="Codex Bundle">
    标记：`.codex-plugin/plugin.json`

    可选内容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    Codex Bundle 在使用 Skill 根和 OpenClaw 风格的 Hook 包目录（`HOOK.md` + `handler.ts`）时最适合 OpenClaw。

  </Accordion>

  <Accordion title="Claude Bundle">
    两种检测模式：

    - **基于清单：** `.claude-plugin/plugin.json`
    - **无清单：** 默认 Claude 布局（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`settings.json`）

    Claude 特定行为：

    - `commands/` 被视为 Skill 内容
    - `settings.json` 被导入到嵌入式 Pi 设置中（Shell 覆盖键被清理）
    - `.mcp.json` 向嵌入式 Pi 暴露支持的 stdio Tool
    - `hooks/hooks.json` 已被检测但未执行
    - 清单中的自定义组件路径是加法性的（扩展默认值，而非替换）

  </Accordion>

  <Accordion title="Cursor Bundle">
    标记：`.cursor-plugin/plugin.json`

    可选内容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 被视为 Skill 内容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 仅为检测阶段

  </Accordion>
</AccordionGroup>

## 检测优先级

OpenClaw 首先检查原生 Plugin 格式：

1. `openclaw.plugin.json` 或具有 `openclaw.extensions` 的有效 `package.json` — 被视为**原生 Plugin**
2. Bundle 标记（`.codex-plugin/`、`.claude-plugin/` 或默认 Claude/Cursor 布局）— 被视为 **Bundle**

如果目录同时包含两者，OpenClaw 使用原生路径。这防止双格式包被部分安装为 Bundle。

## 安全性

Bundle 的信任边界比原生 Plugin 更窄：

- OpenClaw **不**在进程内加载任意 Bundle 运行时模块
- Skill 和 Hook 包路径必须保持在 Plugin 根目录内（边界检查）
- 设置文件以相同的边界检查读取
- 支持的 stdio MCP 服务器可以作为子进程启动

这使 Bundle 默认更安全，但对于它们确实暴露的功能，您仍应将第三方 Bundle 视为受信任的内容。

## 故障排除

<AccordionGroup>
  <Accordion title="Bundle 已检测但能力未运行">
    运行 `openclaw plugins inspect <id>`。如果能力已列出但标记为未连接，这是产品限制 — 不是损坏的安装。
  </Accordion>

  <Accordion title="Claude 命令文件不显示">
    确保 Bundle 已启用，且 Markdown 文件在已检测的 `commands/` 或 `skills/` 根目录内。
  </Accordion>

  <Accordion title="Claude 设置未应用">
    仅支持来自 `settings.json` 的嵌入式 Pi 设置。OpenClaw 不将 Bundle 设置视为原始配置补丁。
  </Accordion>

  <Accordion title="Claude Hook 未执行">
    `hooks/hooks.json` 仅为检测阶段。如果需要可运行的 Hook，请使用 OpenClaw Hook 包布局或提供原生 Plugin。
  </Accordion>
</AccordionGroup>

## 相关

- [安装和配置 Plugin](/tools/plugin)
- [构建 Plugin](/plugins/building-plugins) — 创建原生 Plugin
- [Plugin 清单](/plugins/manifest) — 原生清单模式
