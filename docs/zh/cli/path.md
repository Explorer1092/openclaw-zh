---
mmh3_hash: "1e3a53b905b78ab92f8fd5129ea84686"
summary: "`openclaw path` 的 CLI 参考（通过 `oc://` 寻址方案检查和编辑工作区文件）"
read_when:
  - 您想从终端读取或写入工作区文件中的某个叶子节点
  - 您在针对工作区状态编写脚本，需要稳定的、与类型无关的寻址方案
  - 您在调试 `oc://` 路径（验证语法，查看其解析结果）
title: "Path"
---

# `openclaw path`

Plugin 提供的针对 `oc://` 寻址基底的 Shell 访问接口：一种按类型分派的路径方案，用于检查和编辑可寻址的工作区文件（markdown、jsonc、jsonl、yaml/yml/lobster）。自托管用户、Plugin 作者和编辑器扩展可用它来读取、查找或更新某个特定位置，而无需为每种文件格式手写专用解析器。

CLI 镜像了基底的公共动词：

- `resolve` 是具体的、单匹配的动词。
- `find` 是用于通配符、联合、谓词和位置展开的多匹配动词。
- `set` 只接受具体路径或插入标记；通配符模式在写入前会被拒绝。

`path` 由捆绑的可选 Plugin `oc-path` 提供。首次使用前需先启用：

```bash
openclaw plugins enable oc-path
```

## 为何使用它

OpenClaw 的状态分布在人工编辑的 Markdown、带注释的 JSONC 配置、仅追加的 JSONL 日志和 YAML 工作流/规格文件中。Shell 脚本、Hook 和 Agent 通常只需要这些文件中的一个小值：前置元数据键、Plugin 设置、日志记录字段、YAML 步骤或某个命名节下的某个列表项。

`openclaw path` 为这些调用者提供了稳定的地址，而不是针对每种文件格式进行一次性的 grep、正则或专用解析。同一个 `oc://` 路径可以从终端进行验证、解析、搜索、预演（dry-run）和写入，使狭义的自动化更易于审查且更安全。它特别适合在只需更新某一个叶子节点、同时保留文件中其余注释、换行符和周围格式的场景。

以下情况下使用它：

- Hook 需要从带注释的 JSONC 中读取一个设置，并在写回值时保留注释。
- 维护脚本需要在 JSONL 日志中查找所有匹配的事件字段，而无需把整个日志加载到自定义解析器中。
- 编辑器扩展需要通过 slug 跳转到 Markdown 的某个节或列表项，然后渲染其解析到的准确行。
- Agent 需要在应用前 dry-run 一个微小的工作区编辑，并让变更字节可供审查。

对于普通的整文件编辑、丰富的配置迁移或 Memory 特定写入，通常不需要 `openclaw path`。这些操作应使用对应的拥有者命令或 Plugin。`path` 专为小范围、可寻址的文件操作而设计，在这些场景下，可重复的终端命令比另一个专用解析器更清晰。

## 使用方式

从人工编辑的配置文件中读取一个值：

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

预览写入而不实际写入磁盘：

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

在仅追加的 JSONL 日志中查找匹配记录：

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

通过节和列表项（而不是行号）定位 Markdown 中的某条指令：

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

在 CI 或预检脚本中，在脚本读写之前验证路径：

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

这些命令可直接复制到 Shell 脚本中。需要结构化输出时使用 `--json`，供人工检查时使用 `--human`。

## 工作原理

`openclaw path` 完成四件事：

1. 将 `oc://` 地址解析为槽位：文件、节、项、字段和可选的 Session。
2. 根据目标文件扩展名（`.md`、`.jsonc`、`.jsonl`、`.yaml`、`.yml`、`.lobster` 及相关别名）选择文件类型适配器。
3. 将槽位解析到该文件类型的 AST：Markdown 标题/列表项、JSONC 对象键/数组索引、JSONL 行记录，或 YAML 映射/序列节点。
4. 对于 `set`，通过同一适配器发出编辑后的字节，以便在类型支持的情况下保留文件中未被修改部分的注释、换行符和周围格式。

`resolve` 和 `set` 需要一个具体目标。`find` 是探索性动词：它将通配符、联合、谓词和序数展开为具体匹配项，供您在选择要写入的目标之前进行检查。

## 子命令

| 子命令                  | 用途                                                                         |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | 打印路径处的具体匹配项（或"未找到"）。                                       |
| `find <pattern>`        | 枚举通配符/联合/谓词路径的所有匹配项。                                       |
| `set <oc-path> <value>` | 在具体路径处写入叶子节点或插入目标。支持 `--dry-run`。                       |
| `validate <oc-path>`    | 仅解析；打印结构分解（文件/节/项/字段）。                                    |
| `emit <file>`           | 将文件通过 `parseXxx` + `emitXxx` 进行往返（字节保真度诊断）。               |

## 全局标志

| 标志            | 用途                                                                     |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | 相对此目录解析文件槽位（默认：`process.cwd()`）。                        |
| `--file <path>` | 覆盖文件槽位的解析路径（绝对路径访问）。                                 |
| `--json`        | 强制 JSON 输出（stdout 非 TTY 时为默认值）。                             |
| `--human`       | 强制人类可读输出（stdout 为 TTY 时为默认值）。                           |
| `--dry-run`     | （仅限 `set`）打印将被写入的字节而不实际写入。                           |
| `--diff`        | （与 `set --dry-run` 配合使用）以统一差异格式打印预览，而非完整字节。    |

## `oc://` 语法

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

槽位规则：`field` 需要 `item`，`item` 需要 `section`。四个槽位的规则：

- **带引号的段** — `"a/b.c"` 能保留 `/` 和 `.` 分隔符。内容为字节字面量；引号内不允许出现 `"` 和 `\`。文件槽位也支持引号：`oc://"skills/email-drafter"/Tools/$last` 将 `skills/email-drafter` 视为单个文件路径。
- **谓词** — `[k=v]`、`[k!=v]`、`[k<v]`、`[k<=v]`、`[k>v]`、`[k>=v]`。数值操作要求两侧均可强制转换为有限数字。
- **联合** — `{a,b,c}` 匹配任意一个备选项。
- **通配符** — `*`（单个子段）和 `**`（零个或多个，递归）。`find` 接受这些；`resolve` 和 `set` 因歧义而拒绝。
- **位置** — `$first` / `$last` 解析为第一个/最后一个索引或声明的键。
- **序数** — `#N` 表示文档顺序中的第 N 个匹配项。
- **插入标记** — `+`、`+key`、`+nnn` 用于键式/索引式插入（与 `set` 配合使用）。
- **Session 范围** — `?session=cron-daily` 等。与槽位嵌套正交。Session 值为原始值，不经百分比解码；不得包含控制字符或保留的查询分隔符（`?`、`&`、`%`）。

引号、谓词或联合段之外的保留字符（`?`、`&`、`%`）会被拒绝。控制字符（U+0000-U+001F、U+007F）在任何位置（包括 `session` 查询值）均被拒绝。

`formatOcPath(parseOcPath(path)) === path` 对规范路径是保证的。非规范查询参数除第一个非空的 `session=` 值外均被忽略。

## 按文件类型寻址

| 类型               | 寻址模型                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Markdown           | 通过 slug 的 H2 节、通过 slug 或 `#N` 的列表项、通过 `[frontmatter]` 的前置元数据。          |
| JSONC/JSON         | 对象键和数组索引；点号分割嵌套子段，除非带引号。                                              |
| JSONL              | 顶层行地址（`L1`、`L2`、`$first`、`$last`），然后在行内以 JSONC 风格下降。                   |
| YAML/YML/.lobster  | 映射键和序列索引；注释和流式样式由 YAML 文档 API 处理。                                       |

`resolve` 返回结构化匹配：`root`、`node`、`leaf` 或 `insertion-point`，附带基于 1 的行号。叶子值以文本和 `leafType` 的形式呈现，以便 Plugin 作者无需依赖特定类型的 AST 形状即可渲染预览。

## 修改契约

`set` 写入一个具体目标：

- Markdown 前置元数据值和 `- key: value` 项字段是字符串叶子。Markdown 插入会追加节、前置元数据键或节列表项，并为变更后的文件呈现规范的 Markdown 形状。
- JSONC 叶子写入将字符串值强制转换为现有叶子类型（`string`、有限 `number`、`true`/`false` 或 `null`）。当 JSONC/JSON/JSONL 叶子替换应将 `<value>` 解析为 JSON 且可能改变形状时（例如将字符串 SecretRef 简写替换为对象），使用 `--value-json`。JSONC 对象和数组插入将 `<value>` 解析为 JSON，并对普通叶子写入使用 `jsonc-parser` 编辑路径，保留注释和周围格式。
- JSONL 叶子写入与行内的 JSONC 强制转换方式相同。整行替换和追加将 `<value>` 解析为 JSON。渲染的 JSONL 保留文件的主要 LF/CRLF 换行惯例。
- YAML 叶子写入将字符串值强制转换为现有标量类型（`string`、有限 `number`、`true`/`false` 或 `null`）。YAML 插入使用捆绑的 `yaml` 包的文档 API 进行映射/序列更新。存在解析器错误的格式错误 YAML 文档在修改前会以 `parse-error` 被拒绝。

在用户可见的写入之前使用 `--dry-run`（当确切字节至关重要时）。基底保证解析/发出往返的字节完全相同，但修改可能会根据类型对编辑的区域或文件进行规范化。
添加 `--diff` 可将预览显示为聚焦的前后对比差异，而非完整渲染文件。

## 示例

```bash
# 验证路径（无文件系统访问）
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# 读取叶子节点
openclaw path resolve 'oc://gateway.jsonc/version'

# 通配符搜索
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run 写入
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# 以统一差异格式进行 Dry-run 写入
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# 应用写入
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# 字节保真度往返（诊断）
openclaw path emit ./AGENTS.md
```

更多语法示例：

```bash
# 引用包含 / 或 . 的键
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# 深层 JSON/JSONC 路径可以使用斜杠段；它们规范化为点分隔子段
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# 用解析后的对象替换 JSONC 叶子
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# 在 JSONC 子项上进行谓词搜索
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# 插入到 JSONC 数组
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# 插入 JSONC 对象键
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# 追加 JSONL 事件
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# 解析最后一个 JSONL 值行
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# 解析 YAML 工作流步骤
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# 更新 YAML 标量
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# 定位 Markdown 前置元数据
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# 插入 Markdown 前置元数据
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# 查找 Markdown 列表项字段
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# 验证带 Session 范围的路径
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## 按文件类型的使用示例

五个动词在所有类型上均可使用；寻址方案按文件扩展名分派。以下示例使用 PR 描述中的测试数据。

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

`[frontmatter]` 谓词定位 YAML 前置元数据块；`tools` 通过 slug 匹配 `## Tools` 标题，且列表项叶子即使源代码使用下划线也保留其 slug 形式（`send_email` → `send-email`）。

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

JSONC 编辑通过 `jsonc-parser` 进行，因此 `set` 操作可保留注释和空白符。请先以 `--dry-run` 运行以在提交前检查字节。

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

每行是一条记录。当不知道行号时用谓词（`[event=action]`）寻址，知道行号时用规范的 `LN` 段寻址。

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML 使用 `yaml` 包的 `Document` API 而非手写解析器，因此普通解析/发出往返可保留注释和创作风格，同时解析的路径与 JSONC 使用相同的映射键/序列索引模型。同一适配器处理 `.yaml`、`.yml` 和 `.lobster` 文件。

## 子命令参考

### `resolve <oc-path>`

读取单个叶子节点或节点。拒绝通配符——对通配符使用 `find`。匹配时退出码为 `0`，未找到时为 `1`，解析错误或拒绝模式时为 `2`。

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

枚举通配符/谓词/联合模式的所有匹配项。至少有一个匹配时退出码为 `0`，零个匹配时为 `1`。文件槽位通配符以 `OC_PATH_FILE_WILDCARD_UNSUPPORTED` 被拒绝——请传入具体文件（多文件 glob 为后续功能）。

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

写入叶子节点。配合 `--dry-run` 可预览将被写入的字节而不实际修改文件。成功写入时退出码为 `0`，被基底拒绝（例如哨兵守卫被触发）时为 `1`，解析错误时为 `2`。

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

`+key` 插入标记会在命名子节点不存在时创建它；`+nnn` 和裸 `+` 分别用于索引插入和追加。

### `validate <oc-path>`

仅解析检查。无文件系统访问。适用于在替换变量前确认模板路径是否格式正确，或需要结构分解以进行调试时：

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

有效时退出码为 `0`，无效时为 `1`（附带结构化的 `code` 和 `message`），参数错误时为 `2`。

### `emit <file>`

将文件通过每种类型的解析器和发射器进行往返。在健全的文件上，输出应与输入字节完全相同——差异表明解析器存在 Bug 或触发了哨兵。适用于在真实输入上调试基底行为。

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## 退出码

| 代码 | 含义                                                                       |
| ---- | -------------------------------------------------------------------------- |
| `0`  | 成功。（`resolve` / `find`：至少一个匹配。`set`：写入成功。）              |
| `1`  | 未找到，或 `set` 被基底拒绝（无系统级错误）。                              |
| `2`  | 参数或解析错误。                                                           |

## 输出模式

`openclaw path` 感知 TTY：在终端中输出人类可读内容，在管道或重定向时输出 JSON。`--json` 和 `--human` 会覆盖自动检测。

## 注意事项

- `set` 通过基底的发射路径写入字节，该路径会自动应用密文哨兵守卫。包含 `__OPENCLAW_REDACTED__`（逐字或作为子字符串）的叶子在写入时会被拒绝。
- JSONC 解析和叶子编辑使用 Plugin 本地的 `jsonc-parser` 依赖，因此普通叶子写入时注释和格式得以保留，而不会经过手写解析器/重新渲染路径。
- `path` 不了解 LKG。如果文件受 LKG 追踪，下一次 observe 调用将决定是否提升/恢复。通过 LKG 提升/恢复生命周期进行原子多次设置的 `set --batch` 正与 LKG 恢复基底一同规划中。

## 相关

- [CLI 参考](/cli)
