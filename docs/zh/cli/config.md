---
title: "`openclaw config`"
mmh3_hash: "5635d0102cb036f7ce1f473b3eb6ea31"
summary: "`openclaw config` 的 CLI 参考(获取/设置/取消设置/文件/验证配置值)"
read_when:
  - 您想以非交互方式读取或编辑配置
---

# `openclaw config`

配置助手:按路径获取/设置/取消设置/验证值,并打印活动配置文件。不带子命令运行以打开配置向导(与 `openclaw configure` 相同)。

## 示例

```bash
openclaw config file
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

## 路径

路径使用点或括号表示法:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

使用 Agent 列表索引来定位特定 Agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 值

值在可能的情况下被解析为 JSON5;否则它们被视为字符串。
使用 `--strict-json` 要求 JSON5 解析。`--json` 作为旧版别名仍受支持。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

## `config set` 模式

`openclaw config set` 支持四种赋值方式:

1. 值模式:`openclaw config set <path> <value>`
2. SecretRef 构建器模式:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Provider 构建器模式(仅限 `secrets.providers.<alias>` 路径):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. 批量模式(`--batch-json` 或 `--batch-file`):

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

批量解析始终使用批量有效载荷(`--batch-json`/`--batch-file`)作为真实来源。
`--strict-json` / `--json` 不影响批量解析行为。

JSON 路径/值模式对 SecretRef 和 Provider 均受支持:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider 构建器标志

Provider 构建器目标路径必须为 `secrets.providers.<alias>`。

通用标志:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>`(`file`、`exec`)

Env Provider(`--provider-source env`):

- `--provider-allowlist <ENV_VAR>`(可重复)

File Provider(`--provider-source file`):

- `--provider-path <path>`(必需)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Exec Provider(`--provider-source exec`):

- `--provider-command <path>`(必需)
- `--provider-arg <arg>`(可重复)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>`(可重复)
- `--provider-pass-env <ENV_VAR>`(可重复)
- `--provider-trusted-dir <path>`(可重复)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

加固 Exec Provider 示例:

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

试运行行为:

- 构建器模式:对已更改的 ref/Provider 运行 SecretRef 可解析性检查。
- JSON 模式(`--strict-json`、`--json` 或批量模式):运行 Schema 验证以及 SecretRef 可解析性检查。
- 默认情况下,试运行期间跳过 Exec SecretRef 检查以避免命令副作用。
- 使用 `--allow-exec` 配合 `--dry-run` 可启用 Exec SecretRef 检查(此操作可能执行 Provider 命令)。
- `--allow-exec` 仅适用于试运行,不与 `--dry-run` 同时使用时会报错。

`--dry-run --json` 输出机器可读报告:

- `ok`:试运行是否通过
- `operations`:评估的赋值数量
- `checks`:是否运行了 Schema/可解析性检查
- `checks.resolvabilityComplete`:可解析性检查是否完整运行(跳过 Exec ref 时为 false)
- `refsChecked`:试运行期间实际解析的 ref 数量
- `skippedExecRefs`:因未设置 `--allow-exec` 而跳过的 Exec ref 数量
- `errors`:当 `ok=false` 时的结构化 Schema/可解析性失败信息

### JSON 输出结构

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
      ref?: string, // 可解析性错误时存在
    },
  ],
}
```

成功示例:

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

失败示例:

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

若试运行失败:

- `config schema validation failed`:修改后的配置结构无效;请修正路径/值或 Provider/ref 对象结构。
- `SecretRef assignment(s) could not be resolved`:引用的 Provider/ref 当前无法解析(缺少环境变量、无效文件指针、Exec Provider 失败或 Provider/来源不匹配)。
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`:试运行跳过了 Exec ref;如需 Exec 可解析性验证,请重新运行并添加 `--allow-exec`。
- 批量模式下,修复失败的条目后重新运行 `--dry-run` 再写入。

## 子命令

- `config file`:打印活动配置文件路径(从 `OPENCLAW_CONFIG_PATH` 或默认位置解析)。

编辑后重新启动 Gateway。

## 验证

在不启动 Gateway 的情况下,根据活动 Schema 验证当前配置。

```bash
openclaw config validate
openclaw config validate --json
```
