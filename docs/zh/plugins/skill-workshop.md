---
mmh3_hash: "7a7f69f0456852c2059396f9dc120855"
summary: "实验性的将可复用程序捕获为工作区 Skill，支持审核、批准、隔离和热刷新"
title: "Skill Workshop 插件"
read_when:
  - 您希望 Agent 将纠正或可复用程序转化为工作区 Skill
  - 您正在配置程序性 Skill 记忆
  - 您正在调试 skill_workshop 工具行为
  - 您在决定是否启用自动 Skill 创建
---

Skill Workshop 处于**实验性**阶段。默认情况下禁用，其捕获启发式和审阅者提示可能在版本之间发生变化，自动写入应仅在可信工作区中使用，并在此之前先审查 pending 模式的输出。

Skill Workshop 是工作区 Skill 的程序性记忆。它让 Agent 能将可复用的工作流、用户纠正、来之不易的修复方法以及反复出现的问题转化为 `SKILL.md` 文件，存储在：

```text
<workspace>/skills/<skill-name>/SKILL.md
```

这与长期记忆不同：

- **记忆**存储事实、偏好、实体和过去的上下文。
- **Skill**存储 Agent 在未来任务中应遵循的可复用程序。
- **Skill Workshop** 是从有用的对话轮次到持久工作区 Skill 的桥梁，带有安全检查和可选审批。

Skill Workshop 在 Agent 学到以下程序时很有用：

- 如何验证外部来源的动态 GIF 资产
- 如何替换截图资产并验证尺寸
- 如何运行仓库特定的 QA 场景
- 如何调试反复出现的 Provider 故障
- 如何修复过时的本地工作流说明

不适用于：

- "用户喜欢蓝色"等事实
- 广泛的自传式记忆
- 原始对话存档
- 密钥、凭据或隐藏提示文本
- 不会重复的一次性指令

## 默认状态

捆绑的 Plugin 处于**实验性**阶段，默认**禁用**，除非在 `plugins.entries.skill-workshop` 中明确启用。

Plugin Manifest 未设置 `enabledByDefault: true`。Plugin 配置 Schema 内部的 `enabled: true` 默认值仅在 Plugin 入口已被选择并加载后才适用。

实验性意味着：

- 该 Plugin 足够支持选择性测试和内部使用
- 提案存储、审阅者阈值和捕获启发式可能演进
- 建议以 pending 审批模式作为起始模式
- 自动应用适用于可信的个人/工作区设置，不适用于共享或高度面向恶意输入的环境

## 启用

最小安全配置：

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

使用此配置：

- `skill_workshop` 工具可用
- 明确的可复用纠正被排入 pending 提案
- 基于阈值的审阅者通过可以提出 Skill 更新
- 在 pending 提案被应用之前不会写入任何 Skill 文件

仅在可信工作区中使用自动写入：

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` 仍然使用相同的扫描器和隔离路径。它不会应用具有严重发现的提案。

## 配置

| 键                   | 默认值      | 范围/值                                      | 含义                                             |
| -------------------- | ----------- | ------------------------------------------- | ------------------------------------------------ |
| `enabled`            | `true`      | boolean                                     | 在 Plugin 入口加载后启用该 Plugin。               |
| `autoCapture`        | `true`      | boolean                                     | 在成功的 Agent 轮次后启用事后捕获/审阅。          |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | 将提案排队或自动写入安全提案。                    |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | 选择显式纠正捕获、LLM 审阅者、两者都用或都不用。 |
| `reviewInterval`     | `15`        | `1..200`                                    | 在此数量的成功轮次后运行审阅者。                  |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | 在观察到此数量的工具调用后运行审阅者。            |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | 嵌入式审阅者运行的超时时间。                      |
| `maxPending`         | `50`        | `1..200`                                    | 每个工作区保留的最大 pending/隔离提案数量。        |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | 生成的 Skill/支持文件的最大大小。                 |

推荐配置：

```json5
// 保守模式：仅显式工具使用，不自动捕获。
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// 先审阅：自动捕获，但需要批准。
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// 受信任自动化：立即写入安全提案。
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// 低成本：不调用 LLM 审阅者，仅使用显式纠正短语。
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## 捕获路径

Skill Workshop 有三条捕获路径。

### 工具建议

当模型看到可复用程序或用户要求保存/更新 Skill 时，可以直接调用 `skill_workshop`。

这是最显式的路径，即使 `autoCapture: false` 时也有效。

### 启发式捕获

当 `autoCapture` 启用且 `reviewMode` 为 `heuristic` 或 `hybrid` 时，Plugin 会扫描成功轮次中的显式用户纠正短语：

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

启发式从最新匹配的用户指令创建提案。它使用主题提示为常见工作流选择 Skill 名称：

- 动态 GIF 任务 -> `animated-gif-workflow`
- 截图或资产任务 -> `screenshot-asset-workflow`
- QA 或场景任务 -> `qa-scenario-workflow`
- GitHub PR 任务 -> `github-pr-workflow`
- 回退 -> `learned-workflows`

启发式捕获的范围有意很窄。它用于明确的纠正和可重复的流程说明，而非用于通用的对话摘要。

### LLM 审阅者

当 `autoCapture` 启用且 `reviewMode` 为 `llm` 或 `hybrid` 时，Plugin 在达到阈值后运行紧凑的嵌入式审阅者。

审阅者接收：

- 最近的对话文本，上限为最后 12,000 个字符
- 最多 12 个现有工作区 Skill
- 每个现有 Skill 最多 2,000 个字符
- 仅 JSON 格式的指令

审阅者没有工具：

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

审阅者返回 `{ "action": "none" }` 或一个提案。`action` 字段为 `create`、`append` 或 `replace`——当相关 Skill 已存在时优先使用 `append`/`replace`；仅当没有现有 Skill 匹配时才使用 `create`。

`create` 示例：

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` 添加 `section` + `body`。`replace` 将命名 Skill 中的 `oldText` 替换为 `newText`。

## 提案生命周期

每个生成的更新都成为一个提案，包含：

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- 可选的 `agentId`
- 可选的 `sessionId`
- `skillName`
- `title`
- `reason`
- `source`：`tool`、`agent_end` 或 `reviewer`
- `status`
- `change`
- 可选的 `scanFindings`
- 可选的 `quarantineReason`

提案状态：

- `pending` - 等待批准
- `applied` - 已写入 `<workspace>/skills`
- `rejected` - 被操作员/模型拒绝
- `quarantined` - 被扫描器严重发现阻止

状态按工作区存储在 Gateway 状态目录下：

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Pending 和隔离提案按 Skill 名称和更改内容去重。存储保留最新的 pending/隔离提案，上限为 `maxPending`。

## 工具参考

该 Plugin 注册了一个 Agent 工具：

```text
skill_workshop
```

### `status`

统计活跃工作区中按状态分组的提案数量。

```json
{ "action": "status" }
```

结果结构：

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

列出 pending 提案。

```json
{ "action": "list_pending" }
```

列出其他状态：

```json
{ "action": "list_pending", "status": "applied" }
```

有效的 `status` 值：

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

列出隔离提案。

```json
{ "action": "list_quarantine" }
```

当自动捕获似乎什么都没有做且日志中提到 `skill-workshop: quarantined <skill>` 时使用此命令。

### `inspect`

按 id 获取提案。

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

创建提案。使用 `approvalPolicy: "pending"`（默认值）时，此操作会排队而非立即写入。

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="在 auto 模式下请求立即写入 (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

使用 `approvalPolicy: "pending"` 时，`apply: true` 仍然将提案排队。审阅后，使用 `apply` 操作进行批准。

  </Accordion>

  <Accordion title="在 auto 策略下强制 pending (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="追加到命名章节">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="替换精确文本">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

应用 pending 提案。

使用 `approvalPolicy: "pending"` 时，此操作在写入工作区 Skill 之前会请求操作员批准。

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` 拒绝隔离提案：

```text
quarantined proposal cannot be applied
```

### `reject`

将提案标记为已拒绝。

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

在现有或提案的 Skill 目录中写入支持文件。

允许的顶级支持目录：

- `references/`
- `templates/`
- `scripts/`
- `assets/`

示例：

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

支持文件受工作区作用域、路径检查、`maxSkillBytes` 字节限制、扫描和原子写入保护。

## Skill 写入

Skill Workshop 仅在以下目录下写入：

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill 名称经过规范化处理：

- 转换为小写
- 非 `[a-z0-9_-]` 字符组替换为 `-`
- 删除前后的非字母数字字符
- 最大长度为 80 个字符
- 最终名称必须匹配 `[a-z0-9][a-z0-9_-]{1,79}`

对于 `create`：

- 如果 Skill 不存在，Skill Workshop 写入新的 `SKILL.md`
- 如果已存在，Skill Workshop 将内容追加到 `## Workflow`

对于 `append`：

- 如果 Skill 存在，Skill Workshop 追加到请求的章节
- 如果不存在，Skill Workshop 创建最小 Skill 然后追加

对于 `replace`：

- Skill 必须已存在
- `oldText` 必须精确存在
- 仅替换第一个精确匹配项

所有写入均为原子操作，并立即刷新内存中的 Skill 快照，因此新的或更新的 Skill 无需重启 Gateway 即可生效。

## 安全模型

Skill Workshop 对生成的 `SKILL.md` 内容和支持文件进行安全扫描。

严重发现会隔离提案：

| 规则 id                                | 阻止的内容...                                             |
| -------------------------------------- | --------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | 指示 Agent 忽略先前/更高级别指令                          |
| `prompt-injection-system`              | 引用系统提示、开发者消息或隐藏指令                        |
| `prompt-injection-tool`                | 鼓励绕过工具权限/审批                                     |
| `shell-pipe-to-shell`                  | 包含 `curl`/`wget` 管道到 `sh`、`bash` 或 `zsh`          |
| `secret-exfiltration`                  | 似乎通过网络发送环境/进程环境数据                         |

警告发现会保留但不单独阻止：

| 规则 id              | 警告内容...                     |
| -------------------- | ------------------------------- |
| `destructive-delete` | 广泛的 `rm -rf` 风格命令        |
| `unsafe-permissions` | `chmod 777` 风格的权限使用      |

隔离提案：

- 保留 `scanFindings`
- 保留 `quarantineReason`
- 出现在 `list_quarantine` 中
- 无法通过 `apply` 应用

要从隔离提案中恢复，请创建删除不安全内容的新安全提案。不要手动编辑存储 JSON。

## 提示指南

启用后，Skill Workshop 注入一个简短的提示部分，告知 Agent 使用 `skill_workshop` 进行持久程序性记忆。

指南强调：

- 程序，而非事实/偏好
- 用户纠正
- 非显而易见的成功程序
- 反复出现的问题
- 通过 append/replace 修复过时/简短/错误的 Skill
- 在长工具循环或困难修复后保存可复用程序
- 简短的命令式 Skill 文本
- 不要转储对话记录

写入模式文本随 `approvalPolicy` 变化：

- pending 模式：排队建议；仅在明确批准后应用
- auto 模式：当明确可复用时应用安全的工作区 Skill 更新

## 成本和运行时行为

启发式捕获不调用模型。

LLM 审阅在活跃/默认 Agent 模型上使用嵌入式运行。它基于阈值，因此默认情况下不会在每次轮次后运行。

审阅者：

- 在可用时使用相同的已配置 Provider/模型上下文
- 回退到运行时 Agent 默认值
- 具有 `reviewTimeoutMs`
- 使用轻量级引导上下文
- 没有工具
- 不直接写入任何内容
- 只能发出经过正常扫描器和批准/隔离路径处理的提案

如果审阅者失败、超时或返回无效 JSON，Plugin 会记录警告/调试消息并跳过该审阅通过。

## 操作模式

当用户说以下内容时使用 Skill Workshop：

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

良好的 Skill 文本：

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

不良的 Skill 文本：

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

不良版本不应保存的原因：

- 对话形式
- 非命令式
- 包含嘈杂的一次性细节
- 不告诉下一个 Agent 该做什么

## 调试

检查 Plugin 是否已加载：

```bash
openclaw plugins list --enabled
```

从 Agent/工具上下文检查提案数量：

```json
{ "action": "status" }
```

检查 pending 提案：

```json
{ "action": "list_pending" }
```

检查隔离提案：

```json
{ "action": "list_quarantine" }
```

常见症状：

| 症状                           | 可能原因                                                                           | 检查                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 工具不可用                     | Plugin 入口未启用                                                                  | `plugins.entries.skill-workshop.enabled` 和 `openclaw plugins list`  |
| 没有自动提案出现               | `autoCapture: false`、`reviewMode: "off"` 或未达到阈值                             | 配置、提案状态、Gateway 日志                                         |
| 启发式未捕获                   | 用户措辞不匹配纠正模式                                                             | 使用显式 `skill_workshop.suggest` 或启用 LLM 审阅者                  |
| 审阅者未创建提案               | 审阅者返回 `none`、无效 JSON 或超时                                                | Gateway 日志、`reviewTimeoutMs`、阈值                                |
| 提案未被应用                   | `approvalPolicy: "pending"`                                                        | `list_pending`，然后 `apply`                                         |
| 提案从 pending 中消失          | 重复提案被复用、达到最大 pending 修剪，或已被应用/拒绝/隔离                        | `status`、带状态过滤器的 `list_pending`、`list_quarantine`           |
| Skill 文件存在但模型未使用     | Skill 快照未刷新或 Skill 门控排除了它                                              | `openclaw skills` 状态和工作区 Skill 资格                            |

相关日志：

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA 场景

仓库支持的 QA 场景：

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

运行确定性覆盖：

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

运行审阅者覆盖：

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

审阅者场景是有意单独设置的，因为它启用 `reviewMode: "llm"` 并执行嵌入式审阅者通过。

## 何时不启用自动应用

在以下情况下避免 `approvalPolicy: "auto"`：

- 工作区包含敏感程序
- Agent 正在处理不可信输入
- Skill 在广泛的团队中共享
- 您仍在调整提示或扫描器规则
- 模型经常处理恶意的网络/电子邮件内容

先使用 pending 模式。只有在审阅 Agent 在该工作区中提出的 Skill 类型之后，才切换到 auto 模式。

## 相关文档

- [Skill](/tools/skills)
- [Plugin](/tools/plugin)
- [测试](/reference/test)
