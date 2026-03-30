---
read_when:
  - 你想以非交互方式读取或编辑配置
summary: "`openclaw config` 的 CLI 参考（get/set/unset/file/schema/validate）"
title: config
x-i18n:
  generated_at: "2026-02-03T10:04:13Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 0298024fc5964976284b72da45782a2fcc403ad590acd37baf5d5498f510887b
  source_path: cli/config.md
  workflow: 15
---

# `openclaw config`

用于在 `openclaw.json` 中进行非交互式编辑的配置辅助命令：通过路径获取/设置/取消设置/文件/模式/验证值，并打印活动配置文件。不带子命令运行将打开配置向导（与 `openclaw configure` 相同）。

## 示例

```bash
openclaw config file
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

将 `openclaw.json` 的生成 JSON schema 以纯文本形式打印到 stdout。

```bash
openclaw config schema
```

当你想用其他工具检查或验证时，可以将其导入文件：

```bash
openclaw config schema > openclaw.schema.json
```

### 路径

路径使用点号或括号表示法：

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

使用智能体列表索引来定位特定智能体：

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 值

值会尽可能解析为 JSON5；否则将被视为字符串。
使用 `--strict-json` 强制要求 JSON5 解析。`--json` 作为旧版别名仍受支持。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

## `config set` 模式

`openclaw config set` 支持四种赋值方式：

1. 值模式：`openclaw config set <path> <value>`
2. SecretRef 构建模式：

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. 提供商构建模式（仅限 `secrets.providers.<alias>` 路径）：

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. 批量模式（`--batch-json` 或 `--batch-file`）：

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

批量解析始终以批量载荷（`--batch-json`/`--batch-file`）为准。
`--strict-json` / `--json` 不会改变批量解析行为。

SecretRef 和提供商仍支持 JSON 路径/值模式：

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## 提供商构建标志

提供商构建目标必须使用 `secrets.providers.<alias>` 作为路径。

通用标志：

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>`（`file`、`exec`）

Env 提供商（`--provider-source env`）：

- `--provider-allowlist <ENV_VAR>`（可重复）

File 提供商（`--provider-source file`）：

- `--provider-path <path>`（必需）
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Exec 提供商（`--provider-source exec`）：

- `--provider-command <path>`（必需）
- `--provider-arg <arg>`（可重复）
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>`（可重复）
- `--provider-pass-env <ENV_VAR>`（可重复）
- `--provider-trusted-dir <path>`（可重复）
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

加固的 exec 提供商示例：

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## 试运行

使用 `--dry-run` 验证更改而不写入 `openclaw.json`。

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

试运行行为：

- 构建模式：对更改的 ref/提供商运行 SecretRef 可解析性检查。
- JSON 模式（`--strict-json`、`--json` 或批量模式）：运行 schema 验证加 SecretRef 可解析性检查。
- 试运行期间默认跳过 Exec SecretRef 检查，以避免命令副作用。
- 使用 `--allow-exec` 加 `--dry-run` 可启用 exec SecretRef 检查（这可能会执行提供商命令）。
- `--allow-exec` 仅用于试运行，在没有 `--dry-run` 时会报错。

`--dry-run --json` 输出机器可读报告：

- `ok`：试运行是否通过
- `operations`：评估的赋值数量
- `checks`：schema/可解析性检查是否运行
- `checks.resolvabilityComplete`：可解析性检查是否运行完整（exec ref 跳过时为 false）
- `refsChecked`：试运行期间实际解析的 ref 数量
- `skippedExecRefs`：因未设置 `--allow-exec` 而跳过的 exec ref 数量
- `errors`：`ok=false` 时的结构化 schema/可解析性失败

### JSON 输出形状

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

成功示例：

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

失败示例：

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

如果试运行失败：

- `config schema validation failed`：变更后的配置形状无效；修复路径/值或提供商/ref 对象形状。
- `SecretRef assignment(s) could not be resolved`：引用的提供商/ref 当前无法解析（缺少环境变量、无效文件指针、exec 提供商失败或提供商/源不匹配）。
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：试运行跳过了 exec ref；如需 exec 可解析性验证，请用 `--allow-exec` 重新运行。
- 对于批量模式，修复失败条目后再重新运行 `--dry-run` 再写入。

## 子命令

- `config file`：打印活动配置文件路径（从 `OPENCLAW_CONFIG_PATH` 或默认位置解析）。

编辑后请重启 Gateway 网关。

## 验证

在不启动 Gateway 网关的情况下，根据活动 schema 验证当前配置。

```bash
openclaw config validate
openclaw config validate --json
```
