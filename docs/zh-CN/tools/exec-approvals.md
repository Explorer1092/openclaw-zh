---
mmh3_hash: "975a9ff19c0eb92435399f1e72b45de7"
read_when:
  - 配置执行审批或允许列表
  - 在 macOS 应用中实现执行审批用户体验
  - 审查沙箱逃逸提示及其影响
summary: 执行审批、允许列表和沙箱逃逸提示
title: 执行审批
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: tools/exec-approvals.md
  workflow: 15
---

# 执行审批

执行审批是**配套应用/节点主机的安全护栏**，用于允许沙箱隔离的智能体在真实主机（`gateway` 或 `node`）上运行命令。可以将其理解为安全联锁：只有当策略 + 允许列表 +（可选的）用户审批都同意时，命令才会被允许执行。
执行审批是**附加于**工具策略和提权门控之上的（除非 elevated 设置为 `full`，这会跳过审批）。
生效策略取 `tools.exec.*` 和审批默认值中**更严格**的一方；如果审批字段被省略，则使用 `tools.exec` 的值。

如果配套应用 UI **不可用**，任何需要提示的请求都将由 **ask fallback**（默认：deny）决定。

## 适用范围

执行审批在执行主机上本地强制执行：

- **gateway 主机** → gateway 机器上的 `openclaw` 进程
- **node 主机** → 节点运行器（macOS 配套应用或无头节点主机）

信任模型说明：

- Gateway 认证的调用者对该 Gateway 而言是受信任的操作员。
- 已配对的节点将该受信任的操作员能力延伸到节点主机上。
- 执行审批降低意外执行风险，但不是按用户的认证边界。
- 已批准的节点主机运行会绑定规范执行上下文：规范的 cwd、精确的 argv、存在时的 env 绑定以及适用时固定的可执行文件路径。
- 对于 shell 脚本和直接解释器/运行时文件调用，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该绑定文件在审批后但执行前发生变化，将拒绝运行而不是执行漂移的内容。
- 此文件绑定是尽力而为的，不是对每个解释器/运行时加载器路径的完整语义模型。如果审批模式无法为解释器/运行时命令识别出恰好一个具体的本地文件，它会拒绝创建审批支持的运行，而不是声称覆盖范围。

macOS 分工：

- **node 主机服务**通过本地 IPC 将 `system.run` 转发给 **macOS 应用**。
- **macOS 应用**执行审批并在 UI 上下文中执行命令。

## 设置和存储

审批信息存储在执行主机上的本地 JSON 文件中：

`~/.openclaw/exec-approvals.json`

示例结构：

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 策略选项

### Security（`exec.security`）

- **deny**：阻止所有主机执行请求。
- **allowlist**：仅允许在允许列表中的命令。
- **full**：允许所有命令（等同于提权模式）。

### Ask（`exec.ask`）

- **off**：从不提示。
- **on-miss**：仅在允许列表未匹配时提示。
- **always**：每次命令都提示。

### Ask fallback（`askFallback`）

如果需要提示但无法访问 UI，fallback 决定：

- **deny**：阻止。
- **allowlist**：仅在允许列表匹配时允许。
- **full**：允许。

### 内联解释器 eval 加固（`tools.exec.strictInlineEval`）

当 `tools.exec.strictInlineEval=true` 时，OpenClaw 即使解释器二进制本身已在允许列表中，也会将内联代码 eval 形式视为仅限审批形式。

示例：

- `python -c`
- `node -e`、`node --eval`、`node -p`
- `ruby -e`
- `perl -e`、`perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

这是针对无法干净映射到一个稳定文件操作数的解释器加载器的深度防御。在严格模式下：

- 这些命令仍需要显式审批；
- `allow-always` 不会自动为它们持久化新的允许列表条目。

## 允许列表（按智能体）

允许列表是**按智能体**配置的。如果存在多个智能体，请在 macOS 应用中切换要编辑的智能体。模式是**不区分大小写的 glob 匹配**。
模式应解析为**二进制路径**（仅包含基本名称的条目会被忽略）。
旧版 `agents.default` 条目在加载时会迁移到 `agents.main`。

示例：

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个允许列表条目会跟踪：

- **id** 用于 UI 标识的稳定 UUID（可选）
- **last used** 时间戳
- **last used command**
- **last resolved path**

## 自动允许 Skill CLI

启用 **Auto-allow skill CLIs** 后，已知 Skills 引用的可执行文件在节点（macOS 节点或无头节点主机）上被视为已列入允许列表。这通过 Gateway RPC 的 `skills.bins` 获取 skill 二进制列表。如果你想要严格的手动允许列表，请禁用此选项。

重要信任说明：

- 这是一个**隐式的便利允许列表**，与手动路径允许列表条目分开。
- 它适用于 Gateway 和节点处于同一信任边界的受信任操作员环境。
- 如果你需要严格的显式信任，请将 `autoAllowSkills: false` 并仅使用手动路径允许列表条目。

## 安全二进制（仅限标准输入）

`tools.exec.safeBins` 定义了一小组**仅限标准输入**的二进制文件（例如 `cut`），这些文件可以在允许列表模式下运行，**无需**显式的允许列表条目。安全二进制会拒绝位置文件参数和类路径标记，因此它们只能操作传入的流。
将其视为流过滤器的窄快速通道，而不是通用信任列表。
**不要**将解释器或运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。
如果命令可以按设计评估代码、执行子命令或读取文件，请优先使用显式允许列表条目并保持审批提示启用。
自定义安全二进制必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式配置文件。

默认安全二进制：`cut`、`uniq`、`head`、`tail`、`tr`、`wc`

`grep` 和 `sort` 不在默认列表中。如果选择加入，请为其非标准输入工作流保留显式允许列表条目。

### 安全二进制与允许列表对比

| 主题 | `tools.exec.safeBins` | 允许列表（`exec-approvals.json`） |
| ---- | --------------------- | --------------------------------- |
| 目标 | 自动允许窄标准输入过滤器 | 显式信任特定可执行文件 |
| 匹配类型 | 可执行文件名 + 安全二进制 argv 策略 | 解析后的可执行文件路径 glob 模式 |
| 参数范围 | 受安全二进制配置文件和字面标记规则限制 | 仅路径匹配；参数否则由你负责 |
| 典型示例 | `head`、`tail`、`tr`、`wc` | `jq`、`python3`、`node`、`ffmpeg`、自定义 CLI |
| 最佳用途 | 流水线中的低风险文本转换 | 具有更广泛行为或副作用的任何工具 |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或按智能体 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或按智能体）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或按智能体；按智能体配置文件键覆盖全局键）。
- 允许列表条目存储在主机本地的 `~/.openclaw/exec-approvals.json` 下的 `agents.<id>.allowlist`（或通过 Control UI / `openclaw approvals allowlist ...`）。

自定义配置文件示例：

```json5
{
  tools: {
    exec: {
      safeBins: ["jq", "myfilter"],
      safeBinProfiles: {
        myfilter: {
          minPositional: 0,
          maxPositional: 0,
          allowedValueFlags: ["-n", "--limit"],
          deniedFlags: ["-f", "--file", "-c", "--command"],
        },
      },
    },
  },
}
```

## Control UI 编辑

使用 **Control UI → Nodes → Exec approvals** 卡片来编辑默认值、按智能体的覆盖设置和允许列表。选择一个作用域（Defaults 或某个智能体），调整策略，添加/删除允许列表模式，然后点击 **Save**。UI 会显示每个模式的 **last used** 元数据，以便你保持列表整洁。

目标选择器可选择 **Gateway**（本地审批）或 **Node**。节点必须通告 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。
如果节点尚未通告执行审批，请直接编辑其本地的 `~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持 gateway 或 node 编辑（参见 [Approvals CLI](/cli/approvals)）。

## 审批流程

当需要提示时，gateway 向操作员客户端广播 `exec.approval.requested`。
Control UI 和 macOS 应用通过 `exec.approval.resolve` 进行处理，然后 gateway 将已批准的请求转发给节点主机。

对于 `host=node`，审批请求包含规范的 `systemRunPlan` 负载。gateway 使用该计划作为转发已批准 `system.run` 请求时的权威命令/cwd/会话上下文。

## 解释器/运行时命令

审批支持的解释器/运行时运行是故意保守的：

- 始终绑定精确的 argv/cwd/env 上下文。
- 直接 shell 脚本和直接运行时文件形式是尽力而为地绑定到一个具体的本地文件快照。
- 仍然解析为一个直接本地文件的常见包管理器包装形式（例如 `pnpm exec`、`pnpm node`、`npm exec`、`npx`）在绑定前会被解包。
- 如果 OpenClaw 无法为解释器/运行时命令识别出恰好一个具体的本地文件（例如包脚本、eval 形式、运行时特定的加载器链或模糊的多文件形式），将拒绝审批支持的执行而不是声称它没有的语义覆盖。
- 对于这些工作流，优先使用沙箱隔离、单独的主机边界，或操作员接受更广泛运行时语义的显式受信任允许列表/full 工作流。

当需要审批时，exec 工具会立即返回一个审批 id。使用该 id 来关联后续的系统事件（`Exec finished` / `Exec denied`）。如果在超时前没有收到决定，请求将被视为审批超时，并作为拒绝原因显示。

### 后续投递行为

已批准的异步 exec 完成后，OpenClaw 向同一会话发送后续 `agent` 轮次。

- 如果存在有效的外部投递目标（可投递渠道加上目标 `to`），后续投递使用该渠道。
- 在仅 webchat 或无外部目标的内部会话流中，后续投递保持仅会话（`deliver: false`）。
- 如果调用者请求严格的外部投递但没有可解析的外部渠道，请求将失败并显示 `INVALID_REQUEST`。
- 如果启用了 `bestEffortDeliver` 且无法解析外部渠道，投递将降级为仅会话而不是失败。

确认对话框包括：

- 命令 + 参数
- cwd
- 智能体 id
- 解析后的可执行文件路径
- 主机 + 策略元数据

操作：

- **Allow once** → 立即运行
- **Always allow** → 添加到允许列表 + 运行
- **Deny** → 阻止

## 审批转发到聊天渠道

你可以将执行审批提示转发到任何聊天渠道（包括插件渠道），并使用 `/approve` 进行批准。这使用正常的出站投递管道。

配置：

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // 子字符串或正则表达式
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

在聊天中回复：

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

`/approve` 命令同时处理执行审批和插件审批。如果 ID 与待处理的执行审批不匹配，它会自动检查插件审批。

### 插件审批转发

插件审批转发使用与执行审批相同的投递管道，但在 `approvals.plugin` 下有其独立的配置。启用或禁用其中一个不影响另一个。

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

配置形式与 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、`sessionFilter` 和 `targets` 的工作方式相同。

支持共享交互回复的渠道会为执行审批和插件审批渲染相同的审批按钮。没有共享交互 UI 的渠道则回退到带 `/approve` 说明的纯文本。

### 任意渠道上的同渠道审批

当执行或插件审批请求来自可投递的聊天界面时，同一聊天现在可以默认使用 `/approve` 批准它。这适用于 Slack、Matrix 和 Microsoft Teams 等渠道，以及现有的 Web UI 和终端 UI 流程。

此共享文本命令路径对该对话使用正常的渠道认证模型。如果发起聊天已经可以发送命令并接收回复，审批请求不再需要单独的原生投递适配器来保持待处理状态。

Discord 和 Telegram 也支持同渠道 `/approve`，但这些渠道即使在禁用原生审批投递时，仍然使用其解析的审批者列表进行授权。

### 原生审批投递

Discord 和 Telegram 还可以作为带有渠道特定配置的原生审批投递适配器。

- Discord：`channels.discord.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

这些原生投递适配器是选择加入的。它们在共享的同渠道 `/approve` 流程和共享审批按钮之上添加了 DM 路由和渠道扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 和类似的可投递聊天对同渠道 `/approve` 使用正常的渠道认证模型
- 对于 Discord 和 Telegram，只有已解析的审批者才能批准或拒绝
- Discord 和 Telegram 审批者可以是显式的（`execApprovals.approvers`）或从现有所有者配置推断的（`allowFrom`，加上支持的直接消息 `defaultTo`）
- 请求者不需要是审批者
- 当该聊天已经支持命令和回复时，发起聊天可以直接使用 `/approve` 批准
- 当渠道投递启用时，审批提示包含命令文本
- 待处理的执行审批默认在 30 分钟后过期
- 如果没有操作员 UI 或配置的审批客户端可以接受请求，提示将回退到 `askFallback`

Telegram 默认使用审批者 DM（`target: "dm"`）。当你想要审批提示出现在发起的 Telegram 聊天/话题中时，可以切换到 `channel` 或 `both`。对于 Telegram 论坛话题，OpenClaw 会为审批提示和审批后的后续消息保留话题。

参见：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + approvals + system.run)
```

安全注意事项：

- Unix socket 模式 `0600`，token 存储在 `exec-approvals.json` 中。
- 同 UID 对端检查。
- 挑战/响应（nonce + HMAC token + 请求哈希）+ 短 TTL。

## 系统事件

执行生命周期以系统消息的形式呈现：

- `Exec running`（仅当命令超过运行通知阈值时）
- `Exec finished`
- `Exec denied`

这些消息在节点报告事件后发布到智能体的会话中。
Gateway 主机执行审批在命令完成时（以及可选地在运行时间超过阈值时）发出相同的生命周期事件。
经过审批门控的执行会复用审批 id 作为这些消息中的 `runId`，以便于关联。

## 拒绝审批行为

当异步执行审批被拒绝时，OpenClaw 会阻止智能体在会话中重用来自同一命令任何早期运行的输出。拒绝原因会附带明确的指导，说明没有可用的命令输出，这会阻止智能体声称有新输出或用先前成功运行的过时结果重复执行被拒绝的命令。

## 影响

- **full** 权限很大；尽可能优先使用允许列表。
- **ask** 让你保持知情，同时仍允许快速审批。
- 按智能体的允许列表可防止一个智能体的审批泄漏到其他智能体。
- 审批仅适用于来自**授权发送者**的主机执行请求。未授权的发送者无法发出 `/exec`。
- `/exec security=full` 是为授权操作员提供的会话级便利功能，设计上会跳过审批。
  要完全阻止主机执行，请将审批 security 设置为 `deny`，或通过工具策略拒绝 `exec` 工具。

相关内容：

- [Exec 工具](/tools/exec)
- [提权模式](/tools/elevated)
- [Skills](/tools/skills)
