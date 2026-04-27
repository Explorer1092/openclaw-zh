---
mmh3_hash: "03730122103639a488756219a49fd523"
summary: "将 Claude Code 和 Claude Desktop 本地状态导入 OpenClaw，并预览导入内容"
read_when:
  - 你来自 Claude Code 或 Claude Desktop，想要保留指令、MCP 服务器和 Skill
  - 你需要了解 OpenClaw 自动导入什么以及什么只保留为存档
title: "从 Claude 迁移"
---

OpenClaw 通过捆绑的 Claude 迁移 Provider 导入本地 Claude 状态。Provider 在更改状态之前预览每个项目，在计划和报告中编辑密钥，并在应用之前创建已验证的备份。

<Note>
Onboarding 导入需要全新的 OpenClaw 设置。如果你已经有本地 OpenClaw 状态，请先重置配置、凭据、Session 和工作区，或者在审查计划后直接使用带有 `--overwrite` 的 `openclaw migrate`。
</Note>

## 两种导入方式

<Tabs>
  <Tab title="Onboarding 向导">
    当向导检测到本地 Claude 状态时，可以提供 Claude 选项。

    ```bash
    openclaw onboard --flow import
    ```

    或指向特定源：

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    使用 `openclaw migrate` 进行脚本化或可重复的运行。完整参考见 [`openclaw migrate`](/cli/migrate)。

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    添加 `--from <path>` 导入特定的 Claude Code 主目录或项目根目录。

  </Tab>
</Tabs>

## 导入的内容

<AccordionGroup>
  <Accordion title="指令和内存">
    - 项目 `CLAUDE.md` 和 `.claude/CLAUDE.md` 内容被复制或追加到 OpenClaw Agent 工作区的 `AGENTS.md` 中。
    - 用户 `~/.claude/CLAUDE.md` 内容追加到工作区的 `USER.md` 中。
  </Accordion>
  <Accordion title="MCP 服务器">
    MCP 服务器定义从项目 `.mcp.json`、Claude Code `~/.claude.json` 以及（如果存在）Claude Desktop `claude_desktop_config.json` 中导入。
  </Accordion>
  <Accordion title="Skill 和命令">
    - 具有 `SKILL.md` 文件的 Claude Skill 被复制到 OpenClaw 工作区 Skill 目录中。
    - `.claude/commands/` 或 `~/.claude/commands/` 下的 Claude 命令 Markdown 文件被转换为带有 `disable-model-invocation: true` 的 OpenClaw Skill。
  </Accordion>
</AccordionGroup>

## 仅保留为存档的内容

Provider 将这些内容复制到迁移报告中供手动审查，但**不**将它们加载到实时 OpenClaw 配置中：

- Claude 钩子
- Claude 权限和宽泛工具白名单
- Claude 环境默认值
- `CLAUDE.local.md`
- `.claude/rules/`
- `.claude/agents/` 或 `~/.claude/agents/` 下的 Claude 子 Agent
- Claude Code 缓存、计划和项目历史目录
- Claude Desktop 扩展和 OS 存储的凭据

OpenClaw 拒绝自动执行钩子、信任权限白名单或解码不透明的 OAuth 和 Desktop 凭据状态。

## 推荐流程

<Steps>
  <Step title="预览计划">
    ```bash
    openclaw migrate claude --dry-run
    ```

    计划列出将要更改的所有内容，包括冲突、跳过的项目，以及从嵌套 MCP `env` 或 `headers` 字段编辑的敏感值。

  </Step>
  <Step title="应用并备份">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw 在应用之前创建并验证备份。

  </Step>
  <Step title="运行 Doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/gateway/doctor) 在导入后检查配置或状态问题。

  </Step>
</Steps>

## 源选择

不带 `--from` 时，OpenClaw 检查 `~/.claude` 处的默认 Claude Code 主目录、采样的 Claude Code `~/.claude.json` 状态文件，以及 macOS 上的 Claude Desktop MCP 配置。

当 `--from` 指向项目根目录时，OpenClaw 仅导入该项目的 Claude 文件，如 `CLAUDE.md`、`.claude/settings.json`、`.claude/commands/`、`.claude/skills/` 和 `.mcp.json`。在项目根目录导入期间，它不读取你的全局 Claude 主目录。

## 冲突处理

当计划报告冲突时，应用拒绝继续。

<Warning>
仅当有意替换现有目标时才使用 `--overwrite` 重新运行。Provider 仍可能在迁移报告目录中为覆盖的文件写入项目级备份。
</Warning>

## 相关

- [`openclaw migrate`](/cli/migrate)：完整 CLI 参考、插件合约和 JSON 形状。
- [Onboarding](/cli/onboard)：向导流程和非交互式标志。
- [Doctor](/gateway/doctor)：迁移后健康检查。
- [Agent 工作区](/concepts/agent-workspace)：`AGENTS.md`、`USER.md` 和 Skill 的存储位置。
