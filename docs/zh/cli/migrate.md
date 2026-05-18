---
mmh3_hash: "5b0e7f4bfe09ce1f3d65632daecaffc3"
summary: "`openclaw migrate` 的 CLI 参考（从其他 Agent 系统导入状态）"
read_when:
  - 您想从 Hermes 或其他 Agent 系统迁移到 OpenClaw
  - 您正在添加 Plugin 拥有的迁移 Provider
title: "Migrate"
---

# `openclaw migrate`

通过 Plugin 拥有的迁移 Provider 从其他 Agent 系统导入状态。捆绑的 Provider 涵盖 Codex CLI 状态、[Claude](/install/migrating-claude) 和 [Hermes](/install/migrating-hermes)；第三方 Plugin 可以注册其他 Provider。

<Tip>
有关面向用户的演练，请参阅[从 Claude 迁移](/install/migrating-claude)和[从 Hermes 迁移](/install/migrating-hermes)。[迁移中心](/install/migrating)列出了所有路径。
</Tip>

## 命令

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  已注册迁移 Provider 的名称，例如 `hermes`。运行 `openclaw migrate list` 查看已安装的 Provider。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  构建计划并退出，不更改状态。
</ParamField>
<ParamField path="--from <path>" type="string">
  覆盖源状态目录。Hermes 默认为 `~/.hermes`。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  导入支持的凭据。默认关闭。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  当计划报告冲突时，允许应用替换现有目标。
</ParamField>
<ParamField path="--yes" type="boolean">
  跳过确认提示。在非交互模式下必需。
</ParamField>
<ParamField path="--skill <name>" type="string">
  按技能名称或条目 ID 选择一个技能复制条目。重复此标志以迁移多个技能。省略时，交互式 Codex 迁移显示复选框选择器，非交互式迁移保留所有计划技能。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  按 Plugin 名称或条目 ID 选择一个 Codex Plugin 安装条目。重复此标志以迁移多个 Codex Plugin。省略时，交互式 Codex 迁移显示原生 Codex Plugin 复选框选择器，非交互式迁移保留所有计划 Plugin。这仅适用于 Codex 应用服务器库存发现的源安装 `openai-curated` Codex Plugin。
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  仅 Codex。在计划原生 Plugin 激活之前，强制对源 Codex 应用服务器 `app/list` 进行新鲜遍历。默认关闭以保持迁移计划快速。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  跳过预应用备份。当本地 OpenClaw 状态存在时，需要 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  当应用否则会拒绝跳过备份时，需要与 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  将计划或应用结果打印为 JSON。使用 `--json` 且无 `--yes` 时，apply 打印计划且不改变状态。
</ParamField>

## 安全模型

`openclaw migrate` 以预览优先。

<AccordionGroup>
  <Accordion title="应用前预览">
    Provider 在任何更改发生之前返回逐项计划，包括冲突、跳过的条目和敏感条目。JSON 计划、应用输出和迁移报告会脱敏嵌套的密钥类字段，如 API 密钥、令牌、授权标头、Cookie 和密码。

    `openclaw migrate apply <provider>` 在更改状态之前预览计划并提示，除非设置了 `--yes`。在非交互模式下，apply 需要 `--yes`。

  </Accordion>
  <Accordion title="备份">
    Apply 在应用迁移之前创建并验证 OpenClaw 备份。如果尚不存在本地 OpenClaw 状态，则跳过备份步骤，迁移可以继续。要在状态存在时跳过备份，请同时传递 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="冲突">
    当计划存在冲突时，Apply 拒绝继续。审查计划，然后在有意替换现有目标时使用 `--overwrite` 重新运行。Provider 可能仍会在迁移报告目录中为覆盖的文件写入条目级备份。
  </Accordion>
  <Accordion title="密钥">
    默认情况下永远不导入密钥。使用 `--include-secrets` 导入支持的凭据。
  </Accordion>
</AccordionGroup>

## Claude Provider

捆绑的 Claude Provider 默认检测 `~/.claude` 处的 Claude Code 状态。使用 `--from <path>` 导入特定的 Claude Code 主目录或项目根目录。

<Tip>
有关面向用户的演练，请参阅[从 Claude 迁移](/install/migrating-claude)。
</Tip>

### Claude 导入的内容

- 项目 `CLAUDE.md` 和 `.claude/CLAUDE.md` 到 OpenClaw Agent 工作空间。
- 用户 `~/.claude/CLAUDE.md` 附加到工作空间 `USER.md`。
- 来自项目 `.mcp.json`、Claude Code `~/.claude.json` 和 Claude Desktop `claude_desktop_config.json` 的 MCP 服务器定义。
- 包含 `SKILL.md` 的 Claude 技能目录。
- 转换为仅手动调用的 OpenClaw 技能的 Claude 命令 Markdown 文件。

### 归档和手动审查状态

Claude hooks、权限、环境默认值、本地内存、路径范围规则、子 Agent、缓存、计划和项目历史记录保留在迁移报告中或报告为手动审查条目。OpenClaw 不会自动执行 hooks、复制广泛的允许列表或导入 OAuth/Desktop 凭据状态。

## Codex Provider

捆绑的 Codex Provider 默认检测 `~/.codex` 处的 Codex CLI 状态，或在设置了 `CODEX_HOME` 环境变量时检测该路径。使用 `--from <path>` 清点特定的 Codex 主目录。

当您迁移到 OpenClaw Codex 运行时并希望有意保留有用的个人 Codex CLI 资源时，请使用此 Provider。本地 Codex 应用服务器启动使用每个 Agent 的 `CODEX_HOME`，因此默认不读取您的个人 `~/.codex`。普通进程 `HOME` 仍然被继承，因此 Codex 可以看到共享的 `$HOME/.agents/*` 技能/Plugin marketplace 条目，子进程也可以找到用户主目录配置和令牌。

在交互式终端中运行 `openclaw migrate codex` 会预览完整计划，然后在最终应用确认之前打开复选框选择器。技能复制条目首先提示。使用"全部切换开启"或"全部切换关闭"进行批量选择。按空格切换行，或按 Enter 激活高亮行并继续。计划的技能开始时已勾选，冲突技能开始时未勾选，"暂时跳过"在继续 Plugin 选择时跳过此运行的技能复制。当源安装的精选 Codex Plugin 可迁移且未提供 `--plugin` 时，迁移会按 Plugin 名称提示原生 Codex Plugin 激活。Plugin 条目开始时已勾选，除非目标 OpenClaw Codex Plugin 配置已包含该 Plugin。现有目标 Plugin 开始时未勾选，并显示冲突提示，如 `conflict: plugin exists`；选择"全部切换关闭"以在该运行中不迁移原生 Codex Plugin，或"暂时跳过"以在应用前停止。对于脚本或精确运行，每个技能传递一次 `--skill <name>`，例如：

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

使用 `--plugin <name>` 非交互式地将原生 Codex Plugin 迁移限制为一个或多个源安装的精选 Plugin：

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex 导入的内容

- `$CODEX_HOME/skills` 下的 Codex CLI 技能目录，排除 Codex 的 `.system` 缓存。
- `$HOME/.agents/skills` 下的个人 AgentSkills，在您希望每个 Agent 拥有所有权时复制到当前 OpenClaw Agent 工作空间。
- 通过 Codex 应用服务器 `plugin/list` 发现的源安装 `openai-curated` Codex Plugin。计划为每个已启用安装的 Plugin 读取 `plugin/read`。支持应用的 Plugin 要求源 Codex 应用服务器账户响应为 ChatGPT 订阅账户；非 ChatGPT 或缺少账户响应的将以 `codex_subscription_required` 跳过。默认情况下，迁移不调用源 `app/list`，因此通过账户门控的支持应用的 Plugin 将在不验证源应用可访问性的情况下进行计划，账户查找传输失败以 `codex_account_unavailable` 跳过。当您希望迁移强制进行新鲜源 `app/list` 快照并在计划原生激活前要求每个拥有的应用存在、已启用且可访问时，请传递 `--verify-plugin-apps`。在该模式下，账户查找传输失败会回退到源应用库存验证。源应用库存快照保存在当前进程的内存中；不会写入迁移输出或目标配置。禁用的 Plugin、不可读的 Plugin 详细信息、订阅门控的源账户，以及在请求验证时，缺少的应用、禁用的应用、不可访问的应用或源应用库存失败，都会成为带有类型化原因的手动跳过条目，而非目标配置条目。Apply 为每个选定的符合条件的 Plugin 调用应用服务器 `plugin/install`，即使目标应用服务器已将该 Plugin 报告为已安装且已启用。迁移的 Codex Plugin 仅在选择原生 Codex 运行时的 Session 中可用；它们不对 Pi、正常 OpenAI Provider 运行、ACP 会话绑定或其他运行时公开。

### 手动审查的 Codex 状态

Codex `config.toml`、原生 `hooks/hooks.json`、非精选 marketplace、不是源安装精选 Plugin 的缓存 Plugin 包，以及未通过源订阅门控的源安装 Plugin 不会自动激活。当设置 `--verify-plugin-apps` 时，未通过源应用库存门控的 Plugin 也会被跳过。它们被复制或报告在迁移报告中供手动审查。

对于迁移的源安装精选 Plugin，apply 写入：

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 每个选定 Plugin 的一个显式 Plugin 条目，包含 `marketplaceName: "openai-curated"` 和 `pluginName`

迁移永远不会写入 `plugins["*"]`，也不会存储本地 marketplace 缓存路径。源端订阅失败在手动条目上报告，类型化原因如 `codex_subscription_required`、`codex_account_unavailable`、`plugin_disabled` 或 `plugin_read_unavailable`。使用 `--verify-plugin-apps` 时，源应用库存失败也可能显示为 `app_inaccessible`、`app_disabled`、`app_missing` 或 `app_inventory_unavailable`。跳过的 Plugin 不会写入目标配置。目标端需要身份验证的安装在受影响的 Plugin 条目上报告，状态为 `"skipped"`、原因为 `"auth_required"`，以及清理过的应用标识符。它们的显式配置条目被写入为禁用，直到您重新授权并启用它们。其他安装失败是条目范围的 `error` 结果。

如果在计划期间 Codex 应用服务器 Plugin 清单不可用，迁移会回退到缓存的包建议条目，而不是使整个迁移失败。

## Hermes Provider

捆绑的 Hermes Provider 默认检测 `~/.hermes` 处的状态。当 Hermes 位于其他位置时，使用 `--from <path>`。

### Hermes 导入的内容

- `config.yaml` 中的默认模型配置。
- 来自 `providers` 和 `custom_providers` 的已配置模型 Provider 和自定义 OpenAI 兼容端点。
- 来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。
- `SOUL.md` 和 `AGENTS.md` 到 OpenClaw Agent 工作空间。
- `memories/MEMORY.md` 和 `memories/USER.md` 附加到工作空间内存文件。
- OpenClaw 文件内存的内存配置默认值，以及外部内存 Provider（如 Honcho）的归档或手动审查条目。
- 在 `skills/<name>/` 下包含 `SKILL.md` 文件的技能。
- 来自 `skills.config` 的每个技能配置值。
- 仅在使用 `--include-secrets` 时，来自 `.env` 的支持的 API 密钥。

### 支持的 `.env` 密钥

`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`OPENROUTER_API_KEY`、`GOOGLE_API_KEY`、`GEMINI_API_KEY`、`GROQ_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`DEEPSEEK_API_KEY`。

### 仅归档状态

OpenClaw 无法安全解释的 Hermes 状态被复制到迁移报告供手动审查，但不会加载到实时 OpenClaw 配置或凭据中。这在不假装 OpenClaw 可以自动执行或信任它的情况下保留了不透明或不安全的状态：

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

在运行时，Plugin 调用 `api.registerMigrationProvider(...)`。Provider 实现 `detect`、`plan` 和 `apply`。核心拥有 CLI 编排、备份策略、提示、JSON 输出和冲突预检。核心将审查过的计划传递给 `apply(ctx, plan)`，Provider 只有在该参数缺失时才重新构建计划以保持兼容性。

Provider Plugin 可以使用 `openclaw/plugin-sdk/migration` 进行条目构建和摘要计数，以及 `openclaw/plugin-sdk/migration-runtime` 进行感知冲突的文件复制、仅归档报告复制、缓存配置运行时包装器和迁移报告。

## 入职集成

当 Provider 检测到已知源时，入职可以提供迁移。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用相同的 Plugin 迁移 Provider，并且在应用之前仍会显示预览。

<Note>
入职导入需要全新的 OpenClaw 设置。如果您已有本地状态，请先重置配置、凭据、Session 和工作空间，然后再导入。针对现有设置的备份加覆盖或合并导入是功能门控的。
</Note>

## 相关

- [从 Hermes 迁移](/install/migrating-hermes)：面向用户的演练。
- [从 Claude 迁移](/install/migrating-claude)：面向用户的演练。
- [迁移](/install/migrating)：将 OpenClaw 移至新机器。
- [Doctor](/gateway/doctor)：应用迁移后的健康检查。
- [Plugins](/tools/plugin)：Plugin 安装和注册。
