---
mmh3_hash: "e8e584e7fec27f02e4fb12b6e725fd43"
summary: "通过预览的、可逆的导入从 Hermes 迁移到 OpenClaw"
read_when:
  - 你来自 Hermes，想要保留模型配置、提示词、内存和 Skill
  - 你想了解 OpenClaw 自动导入什么以及什么只保留为存档
  - 你需要干净的、脚本化的迁移路径（CI、全新笔记本、自动化）
title: "从 Hermes 迁移"
---

OpenClaw 通过捆绑的迁移 Provider 导入 Hermes 状态。Provider 在更改状态之前预览所有内容，在计划和报告中编辑密钥，并在应用之前创建已验证的备份。

<Note>
导入需要全新的 OpenClaw 设置。如果你已经有本地 OpenClaw 状态，请先重置配置、凭据、Session 和工作区，或者在审查计划后直接使用带有 `--overwrite` 的 `openclaw migrate`。
</Note>

## 两种导入方式

<Tabs>
  <Tab title="Onboarding 向导">
    最快的路径。向导在 `~/.hermes` 检测到 Hermes，并在应用之前显示预览。

    ```bash
    openclaw onboard --flow import
    ```

    或指向特定源：

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    使用 `openclaw migrate` 进行脚本化或可重复的运行。完整参考见 [`openclaw migrate`](/cli/migrate)。

    ```bash
    openclaw migrate hermes --dry-run    # 仅预览
    openclaw migrate apply hermes --yes  # 跳过确认应用
    ```

    当 Hermes 在 `~/.hermes` 之外时添加 `--from <path>`。

  </Tab>
</Tabs>

## 导入的内容

<AccordionGroup>
  <Accordion title="模型配置">
    - 来自 Hermes `config.yaml` 的默认模型选择。
    - 来自 `providers` 和 `custom_providers` 的已配置模型 Provider 和自定义 OpenAI 兼容端点。
  </Accordion>
  <Accordion title="MCP 服务器">
    来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。
  </Accordion>
  <Accordion title="工作区文件">
    - `SOUL.md` 和 `AGENTS.md` 被复制到 OpenClaw Agent 工作区中。
    - `memories/MEMORY.md` 和 `memories/USER.md` **追加**到匹配的 OpenClaw 内存文件中，而不是覆盖它们。
  </Accordion>
  <Accordion title="内存配置">
    OpenClaw 文件内存的内存配置默认值。外部内存 Provider（如 Honcho）被记录为存档或手动审查项目，以便你可以有意地迁移它们。
  </Accordion>
  <Accordion title="Skill">
    在 `skills/<name>/` 下具有 `SKILL.md` 文件的 Skill 被复制，以及来自 `skills.config` 的每个 Skill 配置值。
  </Accordion>
  <Accordion title="API 密钥（可选）">
    设置 `--include-secrets` 导入受支持的 `.env` 密钥：`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`OPENROUTER_API_KEY`、`GOOGLE_API_KEY`、`GEMINI_API_KEY`、`GROQ_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`DEEPSEEK_API_KEY`。不带该标志，密钥永远不会被复制。
  </Accordion>
</AccordionGroup>

## 仅保留为存档的内容

Provider 将这些内容复制到迁移报告目录中供手动审查，但**不**将它们加载到实时 OpenClaw 配置或凭据中：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw 拒绝自动执行或信任此状态，因为系统之间的格式和信任假设可能存在偏差。审查存档后手动移动你需要的内容。

## 推荐流程

<Steps>
  <Step title="预览计划">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    计划列出将要更改的所有内容，包括冲突、跳过的项目和任何敏感项目。计划输出编辑嵌套的类密钥。

  </Step>
  <Step title="应用并备份">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw 在应用之前创建并验证备份。如果你需要导入 API 密钥，添加 `--include-secrets`。

  </Step>
  <Step title="运行 Doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/gateway/doctor) 重新应用任何待处理的配置迁移，并检查导入期间引入的问题。

  </Step>
  <Step title="重启并验证">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    确认 Gateway 健康，并且你导入的模型、内存和 Skill 已加载。

  </Step>
</Steps>

## 冲突处理

当计划报告冲突（目标处已存在文件或配置值）时，应用拒绝继续。

<Warning>
仅当有意替换现有目标时才使用 `--overwrite` 重新运行。Provider 仍可能在迁移报告目录中为覆盖的文件写入项目级备份。
</Warning>

对于全新的 OpenClaw 安装，冲突不常见。当你在已有用户编辑的设置上重新运行导入时，通常会出现。

如果冲突在应用过程中出现（例如，配置文件上出现意外竞争），Hermes 将剩余的相关配置项标记为 `skipped`，原因为 `blocked by earlier apply conflict`，而不是部分写入它们。迁移报告记录每个被阻塞的项目，以便你可以解决原始冲突并重新运行导入。

## 密钥

默认情况下永远不导入密钥。

- 首先运行 `openclaw migrate apply hermes --yes` 导入非密钥状态。
- 如果你还想复制受支持的 `.env` 密钥，使用 `--include-secrets` 重新运行。
- 对于 SecretRef 管理的凭据，在导入完成后配置 SecretRef 源。

## 自动化的 JSON 输出

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

使用 `--json` 但不带 `--yes` 时，apply 打印计划并且不改变状态。这是 CI 和共享脚本最安全的模式。

## 故障排除

<AccordionGroup>
  <Accordion title="应用因冲突拒绝">
    检查计划输出。每个冲突识别源路径和现有目标。按项目决定是跳过、编辑目标还是使用 `--overwrite` 重新运行。
  </Accordion>
  <Accordion title="Hermes 在 ~/.hermes 之外">
    传递 `--from /actual/path`（CLI）或 `--import-source /actual/path`（onboarding）。
  </Accordion>
  <Accordion title="Onboarding 拒绝在现有设置上导入">
    Onboarding 导入需要全新设置。要么重置状态并重新 onboard，要么直接使用 `openclaw migrate apply hermes`，它支持 `--overwrite` 和显式备份控制。
  </Accordion>
  <Accordion title="API 密钥未导入">
    需要 `--include-secrets`，并且只识别上面列出的密钥。`.env` 中的其他变量被忽略。
  </Accordion>
</AccordionGroup>

## 相关

- [`openclaw migrate`](/cli/migrate)：完整 CLI 参考、插件合约和 JSON 形状。
- [Onboarding](/cli/onboard)：向导流程和非交互式标志。
- [迁移](/install/migrating)：在机器之间移动 OpenClaw 安装。
- [Doctor](/gateway/doctor)：迁移后健康检查。
- [Agent 工作区](/concepts/agent-workspace)：`SOUL.md`、`AGENTS.md` 和内存文件的存储位置。
