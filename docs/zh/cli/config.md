---
summary: "`openclaw config` 的 CLI 参考（获取/设置/补丁/取消设置/文件/Schema/验证）"
read_when:
  - 您想以非交互方式读取或编辑配置
title: "Config"
sidebarTitle: "Config"
---

在 `openclaw.json` 中进行非交互式编辑的配置助手：按路径获取/设置/补丁/取消设置/文件/Schema/验证值，并打印活跃配置文件。不带子命令运行以打开配置向导（与 `openclaw configure` 相同）。

<Note>
当 `OPENCLAW_NIX_MODE=1` 时，OpenClaw 将 `openclaw.json` 视为不可变。只读命令如 `config get`、`config file`、`config schema` 和 `config validate` 仍然有效，但配置写入器会拒绝操作。Agent 应该改为编辑安装的 Nix 源；对于第一方 nix-openclaw 发行版，请使用 [nix-openclaw 快速入门](https://github.com/openclaw/nix-openclaw#quick-start) 并在 `programs.openclaw.config` 或 `instances.<name>.config` 下设置值。
</Note>

## 根选项

<ParamField path="--section <section>" type="string">
  当不带子命令运行 `openclaw config` 时，可重复的引导设置部分过滤器。
</ParamField>

支持的引导部分：`workspace`、`model`、`web`、`gateway`、`daemon`、`channels`、`plugins`、`skills`、`health`。

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
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

将 `openclaw.json` 的生成 JSON Schema 以 JSON 形式打印到 stdout。

<AccordionGroup>
  <Accordion title="包含内容">
    - 当前根配置 Schema，加上供编辑器工具使用的根 `$schema` 字符串字段。
    - 控制 UI 使用的字段 `title` 和 `description` 文档元数据。
    - 当匹配的字段文档存在时，嵌套对象、通配符（`*`）和数组项（`[]`）节点继承相同的 `title` / `description` 元数据。
    - 当匹配的字段文档存在时，`anyOf` / `oneOf` / `allOf` 分支也继承相同的文档元数据。
    - 当运行时清单可以加载时，尽力而为的实时 Plugin + Channel Schema 元数据。
    - 即使当前配置无效时也有干净的回退 Schema。

  </Accordion>
  <Accordion title="相关运行时 RPC">
    `config.schema.lookup` 返回一个带有浅 Schema 节点（`title`、`description`、`type`、`enum`、`const`、常见边界）的规范化配置路径、匹配的 UI 提示元数据以及直接子摘要。用于控制 UI 或自定义客户端中的路径范围深入查询。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

将其导出到文件以使用其他工具检查或验证：

```bash
openclaw config schema > openclaw.schema.json
```

### 路径

路径使用点或方括号表示法：

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

使用 Agent 列表索引定位特定 Agent：

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 值

值在可能时解析为 JSON5；否则视为字符串。使用 `--strict-json` 要求 JSON5 解析。`--json` 作为旧版别名仍受支持。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 将原始值打印为 JSON，而不是终端格式化的文本。

<Note>
对象赋值默认替换目标路径。通常持有用户添加条目的受保护映射/列表路径，如 `agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries` 和 `auth.profiles`，除非您传递 `--replace`，否则会拒绝删除现有条目的替换。
</Note>

使用 `--merge` 向这些映射添加条目：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

仅在您有意希望提供的值成为完整目标值时使用 `--replace`。

## `config set` 模式

`openclaw config set` 支持四种赋值样式：

<Tabs>
  <Tab title="值模式">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef 构建器模式">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider 构建器模式">
    Provider 构建器模式仅针对 `secrets.providers.<alias>` 路径：

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="批量模式">
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

  </Tab>
</Tabs>

<Warning>
SecretRef 赋值在不受支持的运行时可变界面上被拒绝（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord 线程绑定 webhook token 和 WhatsApp 凭据 JSON）。请参阅 [SecretRef 凭据界面](/reference/secretref-credential-surface)。
</Warning>

批量解析始终使用批量有效载荷（`--batch-json`/`--batch-file`）作为事实来源。`--strict-json` / `--json` 不会更改批量解析行为。

## `config patch`

当您想粘贴或通过管道传递配置形状的补丁而不是运行许多基于路径的 `config set` 命令时，请使用 `config patch`。输入是一个 JSON5 对象。对象递归合并，数组和标量值替换目标值，`null` 删除目标路径。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

您也可以通过 stdin 管道传递补丁，这对于远程设置脚本很有用：

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

示例补丁：

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

当一个对象或数组必须完全变为所提供的值而不是被递归补丁时，使用 `--replace-path <path>`：

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` 在不写入的情况下运行 Schema 和 SecretRef 可解析性检查。Exec 支持的 SecretRef 在 dry-run 期间默认跳过；当您有意希望 dry-run 执行 Provider 命令时，请添加 `--allow-exec`。

JSON 路径/值模式对于 SecretRef 和 Provider 均受支持：

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider 构建器标志

Provider 构建器目标必须使用 `secrets.providers.<alias>` 作为路径。

<AccordionGroup>
  <Accordion title="公共标志">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>`（`file`、`exec`）

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>`（可重复）

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>`（必需）
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
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

  </Accordion>
</AccordionGroup>

强化的 exec provider 示例：

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

## 预演（Dry run）

使用 `--dry-run` 在不写入 `openclaw.json` 的情况下验证更改。

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

<AccordionGroup>
  <Accordion title="Dry-run 行为">
    - 构建器模式：对已更改的 ref/provider 运行 SecretRef 可解析性检查。
    - JSON 模式（`--strict-json`、`--json` 或批量模式）：运行 Schema 验证加上 SecretRef 可解析性检查。
    - 策略验证也针对已知不受支持的 SecretRef 目标界面运行。
    - 策略检查评估完整的后更改配置，因此父对象写入（例如将 `hooks` 设置为对象）不能绕过不支持的界面验证。
    - Exec SecretRef 检查在 dry-run 期间默认跳过，以避免命令副作用。
    - 使用 `--allow-exec` 与 `--dry-run` 选择加入 exec SecretRef 检查（这可能执行 Provider 命令）。
    - `--allow-exec` 仅限 dry-run，如果不带 `--dry-run` 使用则报错。

  </Accordion>
  <Accordion title="--dry-run --json 字段">
    `--dry-run --json` 打印机器可读报告：

    - `ok`：dry-run 是否通过
    - `operations`：评估的赋值数量
    - `checks`：Schema/可解析性检查是否运行
    - `checks.resolvabilityComplete`：可解析性检查是否完整运行（当 exec ref 被跳过时为 false）
    - `refsChecked`：dry-run 期间实际解析的 ref 数量
    - `skippedExecRefs`：因未设置 `--allow-exec` 而跳过的 exec ref 数量
    - `errors`：当 `ok=false` 时的结构化 Schema/可解析性失败

  </Accordion>
</AccordionGroup>

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
      ref?: string, // 可解析性错误时存在
    },
  ],
}
```

<Tabs>
  <Tab title="成功示例">
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
  </Tab>
  <Tab title="失败示例">
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
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="如果 dry-run 失败">
    - `config schema validation failed`：您的后更改配置形状无效；修复路径/值或 provider/ref 对象形状。
    - `Config policy validation failed: unsupported SecretRef usage`：将该凭据移回纯文本/字符串输入，并仅在受支持的界面上保留 SecretRef。
    - `SecretRef assignment(s) could not be resolved`：引用的 provider/ref 当前无法解析（缺少 env 变量、无效的文件指针、exec provider 失败或 provider/source 不匹配）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：dry-run 跳过了 exec ref；如果需要 exec 可解析性验证，请使用 `--allow-exec` 重新运行。
    - 对于批量模式，请修复失败的条目并在写入前重新运行 `--dry-run`。

  </Accordion>
</AccordionGroup>

## 写入安全

`openclaw config set` 和其他 OpenClaw 拥有的配置写入器在将更改提交到磁盘之前验证完整的后更改配置。如果新有效载荷未通过 Schema 验证或看起来像破坏性覆盖，活跃配置保持不变，拒绝的有效载荷将保存在其旁边，命名为 `openclaw.json.rejected.*`。

<Warning>
活跃配置路径必须是常规文件。符号链接的 `openclaw.json` 布局不受写入支持；请使用 `OPENCLAW_CONFIG_PATH` 直接指向真实文件。
</Warning>

对于小型编辑，建议使用 CLI 写入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果写入被拒绝，请检查保存的有效载荷并修复完整的配置形状：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍然允许直接编辑器写入，但运行中的 Gateway 会将其视为不受信任，直到通过验证。无效的直接编辑在启动时失败或被热重载跳过；Gateway 不会重写 `openclaw.json`。运行 `openclaw doctor --fix` 修复前缀/覆盖配置或恢复最后已知良好的副本。请参阅 [Gateway 故障排除](/gateway/troubleshooting#gateway-rejected-invalid-config)。

整文件恢复保留用于 doctor 修复。Plugin Schema 更改或 `minHostVersion` 偏差保持显式，而不是回滚不相关的用户设置，如模型、Provider、auth profiles、Channel、Gateway 暴露、工具、Memory、Browser 或 cron 配置。

## 子命令

- `config file`：打印活跃配置文件路径（从 `OPENCLAW_CONFIG_PATH` 或默认位置解析）。路径应命名常规文件，而不是符号链接。

编辑后重启 Gateway。

## 验证

在不启动 Gateway 的情况下针对活跃 Schema 验证当前配置。

```bash
openclaw config validate
openclaw config validate --json
```

在 `openclaw config validate` 通过后，您可以使用本地 TUI 让嵌入式 Agent 将活跃配置与文档进行比较，同时从同一终端验证每个更改：

<Note>
如果验证已经失败，请从 `openclaw configure` 或 `openclaw doctor --fix` 开始。`openclaw chat` 不绕过无效配置守卫。
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

典型的修复循环：

<Steps>
  <Step title="与文档比较">
    请 Agent 将您的当前配置与相关文档页面进行比较，并建议最小的修复方案。
  </Step>
  <Step title="应用有针对性的编辑">
    使用 `openclaw config set` 或 `openclaw configure` 应用有针对性的编辑。
  </Step>
  <Step title="重新验证">
    每次更改后重新运行 `openclaw config validate`。
  </Step>
  <Step title="Doctor 处理运行时问题">
    如果验证通过但运行时仍不健康，运行 `openclaw doctor` 或 `openclaw doctor --fix` 获取迁移和修复帮助。
  </Step>
</Steps>

## 相关

- [CLI 参考](/cli)
- [配置](/gateway/configuration)
