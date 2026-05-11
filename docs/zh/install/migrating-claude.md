---
mmh3_hash: "48388da0333dbb7937b8f1899c1b77d9"
summary: "将 Claude Code 和 Claude Desktop 本地状态导入 OpenClaw，并预览导入内容"
read_when:
  - 你来自 Claude Code 或 Claude Desktop，想要保留指令、MCP 服务器和 Skill
  - 你需要了解 OpenClaw 自动导入什么以及什么仅归档
title: "从 Claude 迁移"
---

OpenClaw 通过内置的 Claude 迁移 provider 导入本地 Claude 状态。该 provider 在更改状态之前预览每个项目，在计划和报告中编辑 secret，并在应用之前创建已验证的备份。

<Note>
引导导入需要全新的 OpenClaw 设置。如果你已经有本地 OpenClaw 状态，请先重置配置、凭据、session 和工作区，或者在查看计划后直接使用带 `--overwrite` 的 `openclaw migrate`。
</Note>

## 两种导入方式

<Tabs>
  <Tab title="引导向导">
    当检测到本地 Claude 状态时，向导会提供 Claude 选项。

    ```bash
    openclaw onboard --flow import
    ```

    或指向特定来源：

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    使用 `openclaw migrate` 进行脚本化或可重复的运行。完整参考请参阅 [`openclaw migrate`](/cli/migrate)。

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    添加 `--from <path>` 以导入特定的 Claude Code 主目录或项目根目录。

  </Tab>
</Tabs>

## 导入内容

<AccordionGroup>
  <Accordion title="指令和内存">
    - 项目 `CLAUDE.md` 和 `.claude/CLAUDE.md` 内容被复制或追加到 OpenClaw agent 工作区 `AGENTS.md` 中。
    - 用户 `~/.claude/CLAUDE.md` 内容被追加到工作区 `USER.md` 中。

  </Accordion>
  <Accordion title="MCP 服务器">
    从项目 `.mcp.json`、Claude Code `~/.claude.json` 和 Claude Desktop `claude_desktop_config.json`（如果存在）导入 MCP 服务器定义。
  </Accordion>
  <Accordion title="Skill 和命令">
    - 具有 `SKILL.md` 文件的 Claude skill 被复制到 OpenClaw 工作区 skill 目录。
    - `.claude/commands/` 或 `~/.claude/commands/` 下的 Claude 命令 Markdown 文件被转换为带有 `disable-model-invocation: true` 的 OpenClaw skill。

  </Accordion>
</AccordionGroup>

## 仅归档的内容

provider 将这些内容复制到迁移报告中供手动审查，但**不会**将其加载到实时 OpenClaw 配置中：

- Claude hook
- Claude 权限和广泛的工具允许列表
- Claude 环境默认值
- `CLAUDE.local.md`
- `.claude/rules/`
- `.claude/agents/` 或 `~/.claude/agents/` 下的 Claude 子 agent
- Claude Code 缓存、计划和项目历史目录
- Claude Desktop 扩展和操作系统存储的凭据

OpenClaw 拒绝自动执行 hook、信任权限允许列表或解码不透明的 OAuth 和 Desktop 凭据状态。在查看归档内容后，手动移动你需要的内容。

## 来源选择

没有 `--from` 时，OpenClaw 检查 `~/.claude` 处的默认 Claude Code 主目录、采样的 Claude Code `~/.claude.json` 状态文件，以及 macOS 上的 Claude Desktop MCP 配置。

当 `--from` 指向项目根目录时，OpenClaw 仅导入该项目的 Claude 文件，如 `CLAUDE.md`、`.claude/settings.json`、`.claude/commands/`、`.claude/skills/` 和 `.mcp.json`。在项目根目录导入期间不读取你的全局 Claude 主目录。

## 推荐流程

<Steps>
  <Step title="预览计划">
    ```bash
    openclaw migrate claude --dry-run
    ```

    计划列出将要更改的所有内容，包括冲突、跳过的项目，以及从嵌套 MCP `env` 或 `headers` 字段中编辑的敏感值。

  </Step>
  <Step title="使用备份应用">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw 在应用之前创建并验证备份。

  </Step>
  <Step title="运行 doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/gateway/doctor) 在导入后检查配置或状态问题。

  </Step>
  <Step title="重启并验证">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    确认 gateway 健康，并且你导入的指令、MCP 服务器和 skill 已加载。

  </Step>
</Steps>

## 冲突处理

当计划报告冲突（目标处已存在文件或配置值）时，应用拒绝继续。

<Warning>
仅当替换现有目标是有意为之时才使用 `--overwrite` 重新运行。provider 可能仍会在迁移报告目录中为覆盖的文件写入项目级备份。
</Warning>

对于全新的 OpenClaw 安装，冲突不常见。它们通常出现在你在已有用户编辑的设置上重新运行导入时。

## 用于自动化的 JSON 输出

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

使用 `--json` 而不带 `--yes` 时，应用打印计划且不改变状态。这是 CI 和共享脚本最安全的模式。

## 故障排除

<AccordionGroup>
  <Accordion title="Claude 状态在 ~/.claude 之外">
    传递 `--from /actual/path`（CLI）或 `--import-source /actual/path`（引导）。
  </Accordion>
  <Accordion title="引导拒绝在现有设置上导入">
    引导导入需要全新设置。要么重置状态并重新引导，要么直接使用 `openclaw migrate apply claude`，它支持 `--overwrite` 和明确的备份控制。
  </Accordion>
  <Accordion title="来自 Claude Desktop 的 MCP 服务器未导入">
    Claude Desktop 从平台特定路径读取 `claude_desktop_config.json`。如果 OpenClaw 未自动检测到，请将 `--from` 指向该文件所在目录。
  </Accordion>
  <Accordion title="Claude 命令变成了禁用模型调用的 skill">
    这是设计意图。Claude 命令由用户触发，因此 OpenClaw 将其导入为带有 `disable-model-invocation: true` 的 skill。如果你希望 agent 自动调用它们，请编辑每个 skill 的 frontmatter。
  </Accordion>
</AccordionGroup>

## 相关

- [`openclaw migrate`](/cli/migrate)：完整 CLI 参考、plugin 合约和 JSON 格式。
- [迁移指南](/install/migrating)：所有迁移路径。
- [从 Hermes 迁移](/install/migrating-hermes)：另一个跨系统导入路径。
- [引导](/cli/onboard)：向导流程和非交互式标志。
- [Doctor](/gateway/doctor)：迁移后健康检查。
- [Agent 工作区](/concepts/agent-workspace)：`AGENTS.md`、`USER.md` 和 skill 的存储位置。
