---
title: "Exec 审批"
mmh3_hash: "966d81fd50b5356347f1de2b841a0ef8"
summary: "主机 exec 审批：策略旋钮、允许列表和 YOLO/严格工作流"
read_when:
  - 配置 exec 审批或允许列表
  - 在 macOS 应用中实现 exec 审批 UX
  - 审查沙盒逃逸提示及其含义
---

Exec 审批是**配套应用/节点主机安全联锁**，用于允许沙盒 Agent 在真实主机（`gateway` 或 `node`）上运行命令。安全联锁：只有当策略 + 允许列表 + （可选）用户审批三者都同意时，命令才会被允许执行。Exec 审批是工具策略和提权门控**之外**的额外保障（除非提权设置为 `full`，这会跳过审批）。

<Note>
有效策略是 `tools.exec.*` 和审批默认值中**更严格**的一个；如果审批字段被省略，则使用 `tools.exec` 的值。主机 exec 也使用该机器上的本地审批状态——`~/.openclaw/exec-approvals.json` 中的主机本地 `ask: "always"` 即使 Session 或配置默认值请求 `ask: "on-miss"` 也会继续提示。
</Note>

## 检查有效策略

| 命令                                                              | 显示内容                                             |
| ----------------------------------------------------------------- | ---------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 请求的策略、主机策略来源和有效结果。                 |
| `openclaw exec-policy show`                                       | 本地机器的合并视图。                                 |
| `openclaw exec-policy set` / `preset`                             | 一步将本地请求的策略与本地主机审批文件同步。         |

当本地范围请求 `host=node` 时，`exec-policy show` 将该范围报告为运行时由节点管理，而非假装本地审批文件是有效的事实来源。

如果配套应用 UI **不可用**，任何需要提示的请求都由**询问回退**处理（默认：拒绝）。

<Tip>
原生聊天审批客户端可以在待处理审批消息上暴露 Channel 特定的功能。例如，Matrix 可以在审批提示上种入反应快捷键（`✅` 允许一次，`❌` 拒绝，`♾️` 始终允许），同时仍将 `/approve ...` 命令留在消息中作为回退。
</Tip>

## 适用范围

Exec 审批在执行主机上本地执行：

- **Gateway 主机** → Gateway 机器上的 `openclaw` 进程。
- **节点主机** → 节点运行器（macOS 配套应用或无头节点主机）。

### 信任模型

- Gateway 认证的调用者对该 Gateway 是受信任的操作者。
- 配对节点将受信任的操作者能力扩展到节点主机上。
- Exec 审批降低了意外执行风险，但不是每个用户的认证边界。
- 已审批的节点主机运行会绑定规范执行上下文：规范 cwd、精确 argv、存在时的环境绑定，以及适用时的固定可执行文件路径。
- 对于 Shell 脚本和直接解释器/运行时文件调用，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该绑定文件在审批后但执行前发生变化，运行将被拒绝而非执行漂移内容。
- 此文件绑定是尽力而为的，并非每个解释器/运行时加载器路径的完整语义模型。如果审批模式无法确定恰好一个具体的本地文件进行绑定，它将拒绝创建基于审批的运行，而非假装拥有完整覆盖。

### macOS 分工

- **节点主机服务**通过本地 IPC 将 `system.run` 转发给 **macOS 应用**。
- **macOS 应用**在 UI 上下文中执行审批 + 执行命令。

## 设置与存储

审批保存在执行主机上的本地 JSON 文件中：

```text
~/.openclaw/exec-approvals.json
```

示例 schema：

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "source": "allow-always",
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 策略旋钮

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — 阻止所有主机 exec 请求。
  - `allowlist` — 仅允许允许列表中的命令。
  - `full` — 允许一切（等同于提权）。
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — 永不提示。
  - `on-miss` — 仅在允许列表不匹配时提示。
  - `always` — 每次命令都提示。`allow-always` 持久信任在有效询问模式为 `always` 时**不会**抑制提示。
</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  如果需要提示但没有 UI 可达时的处理方式。

- `deny` — 阻止。
- `allowlist` — 仅在允许列表匹配时允许。
- `full` — 允许。
  </ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  当 `true` 时，OpenClaw 将内联代码 eval 形式视为需要审批的操作，即使解释器二进制文件本身已在允许列表中。针对不能干净映射到一个稳定文件操作数的解释器加载器的纵深防御。
</ParamField>

严格模式捕获的示例：

- `python -c`
- `node -e`、`node --eval`、`node -p`
- `ruby -e`
- `perl -e`、`perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

在严格模式下，这些命令仍需要显式审批，且 `allow-always` 不会自动为它们持久化新的允许列表条目。

## YOLO 模式（无审批）

如果你希望主机 exec 在没有审批提示的情况下运行，必须开放**两个**策略层：OpenClaw 配置中请求的 exec 策略（`tools.exec.*`）**以及** `~/.openclaw/exec-approvals.json` 中的主机本地审批策略。

YOLO 是默认主机行为，除非你显式收紧它：

| 层                    | YOLO 设置                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` 上的 `full` |
| `tools.exec.ask`      | `off`                      |
| 主机 `askFallback`    | `full`                     |

<Warning>
**重要区别：**

- `tools.exec.host=auto` 选择 exec 运行**位置**：有沙盒时在沙盒中，否则在 gateway 中。
- YOLO 选择主机 exec 的**审批方式**：`security=full` 加 `ask=off`。
- 在 YOLO 模式下，OpenClaw 不会在配置的主机 exec 策略之上添加单独的启发式命令混淆审批门或脚本预检拒绝层。
- `auto` 不会让 gateway 路由成为沙盒 Session 的自由覆盖。沙盒 Session 允许每次调用的 `host=node` 请求；`host=gateway` 仅在没有活跃沙盒运行时从 `auto` 允许。如果你想要稳定的非自动默认值，请显式设置 `tools.exec.host` 或使用 `/exec host=...`。
</Warning>

暴露自身非交互式权限模式的 CLI 支持的提供商可以遵循此策略。当 OpenClaw 请求的 exec 策略为 YOLO 时，Claude CLI 会添加 `--permission-mode bypassPermissions`。通过 `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 下的显式 Claude 参数覆盖该后端行为——例如 `--permission-mode default`、`acceptEdits` 或 `bypassPermissions`。

如果你想要更保守的设置，将任一层收紧回 `allowlist` / `on-miss` 或 `deny`。

### 持久 Gateway 主机"永不提示"设置

<Steps>
  <Step title="设置请求的配置策略">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="匹配主机审批文件">
    ```bash
    openclaw approvals set --stdin <<'EOF'
    {
      version: 1,
      defaults: {
        security: "full",
        ask: "off",
        askFallback: "full"
      }
    }
    EOF
    ```
  </Step>
</Steps>

### 本地快捷方式

```bash
openclaw exec-policy preset yolo
```

该本地快捷方式同时更新：

- 本地 `tools.exec.host/security/ask`。
- 本地 `~/.openclaw/exec-approvals.json` 默认值。

它是故意仅本地的。如果你需要远程更改 Gateway 主机或节点主机审批，请使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node <id|name|ip>`。

### 节点主机

对于节点主机，在该节点上应用相同的审批文件：

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

<Note>
**仅本地限制：**

- `openclaw exec-policy` 不同步节点审批。
- `openclaw exec-policy set --host node` 被拒绝。
- 节点 exec 审批在运行时从节点获取，因此针对节点的更新必须使用 `openclaw approvals --node ...`。
</Note>

### 仅 Session 快捷方式

- `/exec security=full ask=off` 仅更改当前 Session。
- `/elevated full` 是破玻璃快捷方式，也跳过该 Session 的 exec 审批。

如果主机审批文件比配置更严格，更严格的主机策略仍然优先。

## 允许列表（每 Agent）

允许列表是**每个 Agent** 独立的。如果存在多个 Agent，在 macOS 应用中切换你正在编辑的 Agent。模式是 glob 匹配。

模式可以是解析后的二进制路径 glob 或裸命令名 glob。裸名称仅匹配通过 `PATH` 调用的命令，因此 `rg` 可以匹配 `/opt/homebrew/bin/rg`，但**不能**匹配 `./rg` 或 `/tmp/rg`。如果你想信任某个特定的二进制文件位置，请使用路径 glob。

旧版 `agents.default` 条目在加载时迁移到 `agents.main`。Shell 链式（如 `echo ok && pwd`）仍需要每个顶层段满足允许列表规则。

示例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### 使用 argPattern 限制参数

当允许列表条目应匹配某个二进制文件和特定的参数形式时，添加 `argPattern`。OpenClaw 将正则表达式与解析后的命令参数进行评估，不包含可执行文件 token（`argv[0]`）。对于手动编写的条目，参数以单个空格连接，因此当需要精确匹配时请锚定模式。

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

该条目允许 `python3 safe.py`；`python3 other.py` 是允许列表未命中。如果同一二进制文件还有仅路径的条目，未匹配的参数仍可回退到该仅路径的条目。当目标是将该二进制文件限制到声明的参数时，省略仅路径的条目。

通过审批流程保存的条目可能使用内部分隔符格式进行精确 argv 匹配。优先使用 UI 或审批流程来重新生成这些条目，而不是手动编辑编码值。如果 OpenClaw 无法解析某个命令段的 argv，则带有 `argPattern` 的条目不会匹配。

每个允许列表条目支持：

| 字段               | 含义                                               |
| ------------------ | -------------------------------------------------- |
| `pattern`          | 解析后的二进制路径 glob 或裸命令名 glob            |
| `argPattern`       | 可选的 argv 正则表达式；省略则为仅路径的条目       |
| `id`               | 用于 UI 身份的稳定 UUID                            |
| `source`           | 条目来源，例如 `allow-always`                      |
| `commandText`      | 审批流程创建该条目时捕获的命令文本                 |
| `lastUsedAt`       | 最后使用时间戳                                     |
| `lastUsedCommand`  | 最后匹配的命令                                     |
| `lastResolvedPath` | 最后解析的二进制文件路径                           |

## 自动允许 Skill CLI

当**自动允许 Skill CLI** 启用时，已知 Skill 引用的可执行文件在节点（macOS 节点或无头节点主机）上被视为已允许列表。这通过 Gateway RPC 使用 `skills.bins` 获取 Skill bin 列表。如果需要严格的手动允许列表，禁用此功能。

<Warning>
- 这是一个**隐式的便捷允许列表**，与手动路径允许列表条目分开。
- 它适用于 Gateway 和节点在相同信任边界内的受信任操作者环境。
- 如果需要严格的显式信任，保持 `autoAllowSkills: false` 并仅使用手动路径允许列表条目。
</Warning>

## 安全 bin 和审批转发

关于安全 bin（仅标准输入快速通道）、解释器绑定详情，以及如何将审批提示转发到 Slack/Discord/Telegram（或将其作为原生审批客户端运行），请参见 [Exec 审批 — 高级](/tools/exec-approvals-advanced)。

## Control UI 编辑

使用 **Control UI → Nodes → Exec approvals** 卡片来编辑默认值、每 Agent 覆盖和允许列表。选择范围（默认值或某个 Agent），调整策略，添加/删除允许列表模式，然后**保存**。UI 显示每个模式的最后使用元数据，以便你保持列表整洁。

目标选择器选择 **Gateway**（本地审批）或 **Node**。节点必须公告 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。如果节点尚未公告 exec 审批，直接编辑其本地 `~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持 Gateway 或节点编辑——参见 [Approvals CLI](/cli/approvals)。

## 审批流程

当需要提示时，Gateway 向操作者客户端广播 `exec.approval.requested`。Control UI 和 macOS 应用通过 `exec.approval.resolve` 解决它，然后 Gateway 将已审批的请求转发给节点主机。

对于 `host=node`，审批请求包含规范的 `systemRunPlan` 载荷。Gateway 使用该计划作为在转发已审批的 `system.run` 请求时的权威命令/cwd/Session 上下文。

这对异步审批延迟很重要：

- 节点 exec 路径预先准备一个规范计划。
- 审批记录存储该计划及其绑定元数据。
- 一旦审批，最终转发的 `system.run` 调用复用存储的计划而非信任后续调用方编辑。
- 如果调用方在审批请求创建后更改了 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 会拒绝转发的运行，视为审批不匹配。

## 系统事件

Exec 生命周期作为系统消息呈现：

- `Exec running`（仅当命令超过运行通知阈值时）。
- `Exec finished`。
- `Exec denied`。

这些在节点报告事件后发布到 Agent Session。Gateway 主机 exec 审批在命令完成时（以及可选地在运行时间超过阈值时）发出相同的生命周期事件。受审批门控的 exec 将审批 id 复用为这些消息中的 `runId` 以便于关联。

## 被拒绝审批的行为

当异步 exec 审批被拒绝时，OpenClaw 会阻止 Agent 在 Session 中重用之前相同命令运行的输出。拒绝原因会带有明确的指导（没有命令输出可用），这会阻止 Agent 声称有新输出或使用之前成功运行的过时结果重复被拒绝的命令。

## 影响

- **`full`** 功能强大；尽可能优先使用允许列表。
- **`ask`** 让你保持参与同时仍允许快速审批。
- 每 Agent 允许列表防止一个 Agent 的审批泄漏到其他 Agent 中。
- 审批仅适用于来自**授权发送者**的主机 exec 请求。未授权发送者无法发出 `/exec`。
- `/exec security=full` 是授权操作者的 Session 级便捷设置，按设计跳过审批。要硬性阻止主机 exec，将审批安全性设置为 `deny` 或通过工具策略拒绝 `exec` 工具。

## 相关

<CardGroup cols={2}>
  <Card title="Exec 审批 — 高级" href="/tools/exec-approvals-advanced" icon="gear">
    安全 bin、解释器绑定和审批转发到聊天。
  </Card>
  <Card title="Exec 工具" href="/tools/exec" icon="terminal">
    Shell 命令执行工具。
  </Card>
  <Card title="提升模式" href="/tools/elevated" icon="shield-exclamation">
    也会跳过审批的破玻璃路径。
  </Card>
  <Card title="沙盒化" href="/gateway/sandboxing" icon="box">
    沙盒模式和工作区访问。
  </Card>
  <Card title="安全" href="/gateway/security" icon="lock">
    安全模型和加固。
  </Card>
  <Card title="沙盒 vs 工具策略 vs 提升模式" href="/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何时使用各项控制。
  </Card>
  <Card title="Skills" href="/tools/skills" icon="sparkles">
    Skill 支持的自动允许行为。
  </Card>
</CardGroup>
