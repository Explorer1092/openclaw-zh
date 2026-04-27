---
mmh3_hash: "e2e35859e8b626a3652fea849a4ea188"
summary: "`openclaw migrate` 的 CLI 参考（从其他 Agent 系统导入状态）"
read_when:
  - 您想从 Hermes 或其他 Agent 系统迁移到 OpenClaw
  - 您正在添加 Plugin 拥有的迁移 Provider
title: "Migrate"
---

# `openclaw migrate`

通过 Plugin 拥有的迁移 Provider 从其他 Agent 系统导入状态。

<Tip>
有关从 Hermes 迁移的用户指南，请参阅[从 Hermes 迁移](/install/migrating-hermes)。
</Tip>

## 命令

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  已注册的迁移 Provider 名称，例如 `hermes`。运行 `openclaw migrate list` 查看已安装的 Provider。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  构建计划并退出，不更改任何状态。
</ParamField>
<ParamField path="--from <path>" type="string">
  覆盖源状态目录。Hermes 默认为 `~/.hermes`。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  导入受支持的凭据。默认关闭。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  当计划报告冲突时，允许 apply 替换已有目标。
</ParamField>
<ParamField path="--yes" type="boolean">
  跳过确认提示。在非交互模式下必须提供。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  跳过 apply 前的备份。当本地 OpenClaw 状态已存在时，需要同时传入 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  当 apply 否则会拒绝跳过备份时，与 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 格式打印计划或 apply 结果。与 `--json` 且不带 `--yes` 时，apply 打印计划而不修改状态。
</ParamField>

## 安全模型

`openclaw migrate` 以预览优先的方式运行。

<AccordionGroup>
  <Accordion title="先预览再应用">
    Provider 在任何更改发生之前返回逐项计划，包括冲突、跳过的项目和敏感项目。JSON 计划、apply 输出和迁移报告会对嵌套的疑似密钥（如 API 密钥、令牌、授权标头、Cookie 和密码）进行脱敏处理。

    `openclaw migrate apply <provider>` 会预览计划并在更改状态前提示确认，除非设置了 `--yes`。在非交互模式下，apply 需要 `--yes`。

  </Accordion>
  <Accordion title="备份">
    Apply 在应用迁移之前会创建并验证 OpenClaw 备份。如果尚无本地 OpenClaw 状态，则跳过备份步骤，迁移可继续进行。如需在状态已存在时跳过备份，请同时传入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="冲突">
    当计划存在冲突时，apply 拒绝继续。查看计划后，如果有意替换已有目标，请加上 `--overwrite` 重新运行。Provider 仍可能在迁移报告目录中为被覆盖的文件写入逐项备份。
  </Accordion>
  <Accordion title="密钥">
    默认情况下绝不导入密钥。使用 `--include-secrets` 导入受支持的凭据。
  </Accordion>
</AccordionGroup>

## Claude Provider

内置的 Claude Provider 默认在 `~/.claude` 检测 Claude Code 状态。使用 `--from <path>` 导入特定的 Claude Code 主目录或项目根目录。

<Tip>
有关用户指南，请参阅[从 Claude 迁移](/install/migrating-claude)。
</Tip>

### Claude 导入的内容

- 项目 `CLAUDE.md` 和 `.claude/CLAUDE.md` 导入到 OpenClaw Agent 工作区。
- 用户 `~/.claude/CLAUDE.md` 追加到工作区 `USER.md`。
- 来自项目 `.mcp.json`、Claude Code `~/.claude.json` 和 Claude Desktop `claude_desktop_config.json` 的 MCP 服务器定义。
- 包含 `SKILL.md` 的 Claude Skill 目录。
- Claude 命令 Markdown 文件转换为仅手动调用的 OpenClaw Skill。

### 归档和手动审查状态

Claude Hooks、权限、环境默认值、本地内存、路径范围规则、子 Agent、缓存、计划和项目历史被保存在迁移报告中或标记为手动审查项目。OpenClaw 不会自动执行 Hooks、复制宽泛的许可列表或导入 OAuth/Desktop 凭据状态。

## Hermes Provider

内置的 Hermes Provider 默认在 `~/.hermes` 检测状态。如果 Hermes 在其他位置，请使用 `--from <path>`。

### Hermes 导入的内容

- `config.yaml` 中的默认模型配置。
- `providers` 和 `custom_providers` 中配置的模型 Provider 和自定义 OpenAI 兼容端点。
- `mcp_servers` 或 `mcp.servers` 中的 MCP 服务器定义。
- `SOUL.md` 和 `AGENTS.md` 导入到 OpenClaw Agent 工作区。
- `memories/MEMORY.md` 和 `memories/USER.md` 追加到工作区内存文件。
- OpenClaw 文件内存的内存配置默认值，以及外部内存 Provider（如 Honcho）的归档或手动审查项目。
- `skills/<name>/` 下包含 `SKILL.md` 文件的 Skill。
- `skills.config` 中的每个 Skill 配置值。
- `.env` 中受支持的 API 密钥（仅当使用 `--include-secrets` 时）。

### 支持的 `.env` 键

`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`OPENROUTER_API_KEY`、`GOOGLE_API_KEY`、`GEMINI_API_KEY`、`GROQ_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`DEEPSEEK_API_KEY`。

### 仅归档状态

OpenClaw 无法安全解释的 Hermes 状态会被复制到迁移报告以供手动审查，但不会加载到实时 OpenClaw 配置或凭据中。这样可以在不假装 OpenClaw 能自动执行或信任这些内容的情况下保留不透明或不安全的状态：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### 应用后

```bash
openclaw doctor
```

## Plugin 契约

迁移源是 Plugin。Plugin 在 `openclaw.plugin.json` 中声明其 Provider ID：

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

在运行时，Plugin 调用 `api.registerMigrationProvider(...)`。Provider 实现 `detect`、`plan` 和 `apply`。核心负责 CLI 编排、备份策略、提示、JSON 输出和冲突预检。核心将已审查的计划传入 `apply(ctx, plan)`，Provider 仅在该参数缺失时出于兼容性原因才可重建计划。

Provider Plugin 可以使用 `openclaw/plugin-sdk/migration` 进行项目构建和摘要统计，以及 `openclaw/plugin-sdk/migration-runtime` 进行感知冲突的文件复制、仅归档报告复制和迁移报告生成。

## 引导程序集成

当 Provider 检测到已知来源时，引导程序可以提供迁移选项。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用相同的 Plugin 迁移 Provider，并在应用前仍会显示预览。

<Note>
引导程序导入需要全新的 OpenClaw 设置。如果您已有本地状态，请先重置配置、凭据、Session 和工作区。现有设置的备份加覆盖或合并导入为功能门控功能。
</Note>

## 相关链接

- [从 Hermes 迁移](/install/migrating-hermes)：用户指南。
- [从 Claude 迁移](/install/migrating-claude)：用户指南。
- [迁移](/install/migrating)：将 OpenClaw 迁移到新机器。
- [Doctor](/gateway/doctor)：应用迁移后的健康检查。
- [Plugin](/tools/plugin)：Plugin 安装和注册。
