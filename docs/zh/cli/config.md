---
mmh3_hash: "6c0078013e5641771771e53b3f713042"
title: "`openclaw config`"
summary: "`openclaw config` 的 CLI 参考(获取/设置/取消设置/文件/Schema/验证配置值)"
read_when:
  - 您想以非交互方式读取或编辑配置
---

# `openclaw config`

配置助手,用于在 `openclaw.json` 中进行非交互式编辑:按路径获取/设置/取消设置/文件/Schema/验证值,并打印活动配置文件。不带子命令运行以打开配置向导(与 `openclaw configure` 相同)。

根选项:

- `--section <section>`:当不带子命令运行 `openclaw config` 时,可重复使用的引导设置部分过滤器

支持的引导部分:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## 示例

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

将 `openclaw.json` 的生成 JSON Schema 打印到 stdout 为 JSON。

包含内容:

- 当前根配置 Schema,加上用于编辑器工具的根 `$schema` 字符串字段
- Control UI 使用的字段 `title` 和 `description` 文档元数据
- 当匹配的字段文档存在时,嵌套对象、通配符(`*`)和数组项(`[]`)节点继承相同的 `title`/`description` 元数据
- 当匹配的字段文档存在时,`anyOf`/`oneOf`/`allOf` 分支也继承相同的文档元数据
- 运行时清单可以加载时的最佳努力实时插件 + Channel Schema 元数据
- 即使当前配置无效时也有干净的回退 Schema

相关运行时 RPC:

- `config.schema.lookup` 返回一个规范化的配置路径,包含浅层 Schema 节点(`title`、`description`、`type`、`enum`、`const`、常见边界)、匹配的 UI 提示元数据和直接子摘要。在 Control UI 或自定义客户端中用于路径范围钻取。

```bash
openclaw config schema
```

将其导入文件以便用其他工具检查或验证:

```bash
openclaw config schema > openclaw.schema.json
```

### 路径

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

`config get <path> --json` 将原始值打印为 JSON,而非终端格式化文本。

<Note>
对象赋值默认替换目标路径。通常包含用户添加条目的受保护 map/list 路径（例如 `agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries` 和 `auth.profiles`），除非您传递 `--replace`，否则会拒绝会删除现有条目的替换操作。
</Note>

向这些 map 添加条目时使用 `--merge`:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

仅当您有意希望提供的值成为完整目标值时，才使用 `--replace`。

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

策略说明:

- SecretRef 赋值在不受支持的运行时可变界面上被拒绝(例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord 线程绑定 webhook 令牌和 WhatsApp 凭据 JSON)。参见 [SecretRef Credential Surface](/reference/secretref-credential-surface)。

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
- 策略验证也对已知不支持的 SecretRef 目标界面运行。
- 策略检查评估完整的修改后配置,因此父对象写入(例如将 `hooks` 设置为对象)无法绕过不支持界面验证。
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
- `Config policy validation failed: unsupported SecretRef usage`:将该凭据移回明文/字符串输入,并仅在受支持的界面上保留 SecretRef。
- `SecretRef assignment(s) could not be resolved`:引用的 Provider/ref 当前无法解析(缺少环境变量、无效文件指针、Exec Provider 失败或 Provider/来源不匹配)。
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`:试运行跳过了 Exec ref;如需 Exec 可解析性验证,请重新运行并添加 `--allow-exec`。
- 批量模式下,修复失败的条目后重新运行 `--dry-run` 再写入。

## 子命令

- `config file`:打印活动配置文件路径(从 `OPENCLAW_CONFIG_PATH` 或默认位置解析)。路径应指向一个常规文件，而非符号链接。

编辑后重新启动 Gateway。

## 验证

在不启动 Gateway 的情况下,根据活动 Schema 验证当前配置。

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` 通过后，您可以使用本地 TUI 让嵌入式 Agent 将活动配置与文档对比，同时在同一终端验证每次更改：

<Note>
如果验证已经失败，请从 `openclaw configure` 或 `openclaw doctor --fix` 开始。`openclaw chat` 不会绕过无效配置守卫。
</Note>

```bash
openclaw chat
```

然后在 TUI 中：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

典型修复循环：

1. 让 Agent 将当前配置与相关文档页面对比并建议最小修复方案。
2. 使用 `openclaw config set` 或 `openclaw configure` 应用针对性修改。
3. 每次修改后重新运行 `openclaw config validate`。
4. 如果验证通过但运行时仍不正常，运行 `openclaw doctor` 或 `openclaw doctor --fix` 获取迁移和修复帮助。

## 相关

- [CLI 参考](/cli)
- [Configuration](/gateway/configuration)
