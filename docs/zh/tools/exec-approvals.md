---
title: "Exec 批准"
mmh3_hash: "8d2232962a2096cf0e629a8ad4698f38"
summary: "Exec 批准、允许列表和沙盒逃逸提示"
read_when:
  - 配置 exec 批准或允许列表
  - 在 macOS 应用中实现 exec 批准 UX
  - 审查沙盒逃逸提示及其含义
---

# Exec 批准

Exec 批准是**配套应用/节点主机的安全联锁**，用于允许沙盒 Agent 在真实主机（`gateway` 或 `node`）上运行命令。可以把它想象成安全联锁：只有当策略 + 允许列表 + （可选）用户批准三者都同意时，命令才会被允许执行。
Exec 批准是工具策略和提权门控**之外**的额外保障（除非提权设置为 `full`，这会跳过批准）。
有效策略是 `tools.exec.*` 和批准默认值中**更严格**的一个；如果批准字段被省略，则使用 `tools.exec` 的值。

如果配套应用 UI **不可用**，任何需要提示的请求都由**询问回退**处理（默认：拒绝）。

## 适用范围

Exec 批准在执行主机上本地执行：

- **Gateway 主机** → Gateway 机器上的 `openclaw` 进程
- **节点主机** → 节点运行器（macOS 配套应用或无头节点主机）

信任模型说明：

- Gateway 认证的调用者对该 Gateway 是受信任的操作者。
- 配对节点将受信任的操作者能力扩展到节点主机上。
- Exec 批准降低了意外执行风险，但不是每个用户的认证边界。
- 已批准的节点主机运行会绑定规范执行上下文：规范 cwd、精确 argv、存在时的环境绑定，以及适用时的固定可执行文件路径。
- 对于 Shell 脚本和直接解释器/运行时文件调用，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该绑定文件在批准后但执行前发生变化，运行将被拒绝而非执行漂移内容。
- 此文件绑定是尽力而为的，并非每个解释器/运行时加载器路径的完整语义模型。如果批准模式无法确定恰好一个具体的本地文件进行绑定，它将拒绝创建基于批准的运行，而非假装拥有完整覆盖。

macOS 分工：

- **节点主机服务**通过本地 IPC 将 `system.run` 转发给 **macOS 应用**。
- **macOS 应用**在 UI 上下文中执行批准 + 执行命令。

## 设置与存储

批准保存在执行主机上的本地 JSON 文件中：

`~/.openclaw/exec-approvals.json`

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

### 安全性（`exec.security`）

- **deny**：阻止所有主机 exec 请求。
- **allowlist**：仅允许允许列表中的命令。
- **full**：允许一切（等同于提权）。

### 询问（`exec.ask`）

- **off**：永不提示。
- **on-miss**：仅在允许列表不匹配时提示。
- **always**：每次命令都提示。

### 询问回退（`askFallback`）

如果需要提示但没有 UI 可达，回退决定：

- **deny**：阻止。
- **allowlist**：仅在允许列表匹配时允许。
- **full**：允许。

### 内联解释器 eval 加固（`tools.exec.strictInlineEval`）

当 `tools.exec.strictInlineEval=true` 时，OpenClaw 将内联代码 eval 形式视为需要批准的操作，即使解释器二进制文件本身已在允许列表中。

示例：

- `python -c`
- `node -e`、`node --eval`、`node -p`
- `ruby -e`
- `perl -e`、`perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

这是针对不能干净映射到一个稳定文件操作数的解释器加载器的纵深防御。在严格模式下：

- 这些命令仍需要显式批准；
- `allow-always` 不会自动为它们持久化新的允许列表条目。

## 允许列表（每 Agent）

允许列表是**每个 Agent** 独立的。如果存在多个 Agent，在 macOS 应用中切换你正在编辑的 Agent。模式是**不区分大小写的 glob 匹配**。
模式应解析为**二进制文件路径**（仅基本名称的条目会被忽略）。
旧版 `agents.default` 条目在加载时迁移到 `agents.main`。

示例：

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个允许列表条目跟踪：

- **id** 用于 UI 身份的稳定 UUID（可选）
- **last used** 时间戳
- **last used command**
- **last resolved path**

## 自动允许 Skill CLI

当**自动允许 Skill CLI** 启用时，已知 Skill 引用的可执行文件在节点（macOS 节点或无头节点主机）上被视为已允许列表。这通过 Gateway RPC 使用 `skills.bins` 获取 Skill bin 列表。如果需要严格的手动允许列表，禁用此功能。

重要信任说明：

- 这是一个**隐式的便捷允许列表**，与手动路径允许列表条目分开。
- 它适用于 Gateway 和节点在相同信任边界内的受信任操作者环境。
- 如果需要严格的显式信任，保持 `autoAllowSkills: false` 并仅使用手动路径允许列表条目。

## 安全 bin（仅标准输入）

`tools.exec.safeBins` 定义了一小组**仅限标准输入**的二进制文件（例如 `jq`），这些文件可以在允许列表模式下运行**而无需**显式允许列表条目。安全 bin 拒绝位置文件参数和类路径令牌，因此它们只能对传入流进行操作。
将此视为流过滤器的窄通道，而非通用信任列表。
**不要**将解释器或运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。
如果命令可以评估代码、执行子命令或按设计读取文件，优先使用显式允许列表条目并保持批准提示启用。
自定义安全 bin 必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式配置文件。
验证仅从 argv 形状确定性进行（不进行主机文件系统存在检查），这防止了允许/拒绝差异带来的文件存在 oracle 行为。
默认安全 bin 的面向文件选项被拒绝（例如 `sort -o`、`sort --output`、
`sort --files0-from`、`sort --compress-program`、`sort --random-source`、
`sort --temporary-directory`/`-T`、`wc --files0-from`、`jq -f/--from-file`、
`grep -f/--file`）。
安全 bin 还对破坏仅标准输入行为的选项实施每二进制显式标志策略（例如 `sort -o/--output/--compress-program` 和 grep 递归标志）。
在安全 bin 模式下，长选项以失败关闭方式验证：未知标志和模糊缩写被拒绝。
安全 bin 配置文件拒绝的标志：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`：`--dereference-recursive`、`--directories`、`--exclude-from`、`--file`、`--recursive`、`-R`、`-d`、`-f`、`-r`
- `jq`：`--argfile`、`--from-file`、`--library-path`、`--rawfile`、`--slurpfile`、`-L`、`-f`
- `sort`：`--compress-program`、`--files0-from`、`--output`、`--random-source`、`--temporary-directory`、`-T`、`-o`
- `wc`：`--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全 bin 还强制 argv 令牌在执行时被视为**字面文本**（对于仅标准输入部分，不进行 glob 扩展和 `$VARS` 展开），因此 `*` 或 `$HOME/...` 等模式无法被用来偷偷进行文件读取。
安全 bin 还必须从受信任的二进制目录解析（系统默认值加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目永不自动受信任。
默认受信任的安全 bin 目录故意最小化：`/bin`、`/usr/bin`。
如果你的安全 bin 可执行文件位于包管理器/用户路径中（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将它们显式添加到 `tools.exec.safeBinTrustedDirs`。
在允许列表模式下，Shell 链式和重定向不会自动允许。

Shell 链式（`&&`、`||`、`;`）在每个顶层段都满足允许列表（包括安全 bin 或 Skill 自动允许）时可以使用。在允许列表模式下，重定向仍不受支持。
命令替换（`$()` / 反引号）在允许列表解析期间被拒绝，包括双引号内；如果需要字面 `$()` 文本，使用单引号。
在 macOS 配套应用批准中，包含 Shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 Shell 文本被视为允许列表未命中，除非 Shell 二进制文件本身在允许列表中。
对于 Shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围的环境覆盖被简化为一个小的显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
对于允许列表模式中的始终允许决策，已知的分发包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径而非包装器路径。Shell 多路复用器（`busybox`、`toybox`）也会为 Shell 小程序（`sh`、`ash` 等）解包，以便内部可执行文件路径被持久化而非多路复用器二进制文件。如果包装器或多路复用器无法安全解包，则不会自动持久化允许列表条目。

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`、`uniq`、`head`、`tail`、`tr`、`wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果你选择加入，请为其非标准输入工作流保留显式允许列表条目。
对于安全 bin 模式下的 `grep`，使用 `-e`/`--regexp` 提供模式；位置模式形式被拒绝，以防文件操作数被伪装成模糊位置参数。

### 安全 bin 与允许列表对比

| 主题            | `tools.exec.safeBins`                                  | 允许列表（`exec-approvals.json`）                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| 目标             | 自动允许窄范围标准输入过滤器                        | 显式信任特定可执行文件                        |
| 匹配类型       | 可执行文件名 + 安全 bin argv 策略                 | 解析后的可执行文件路径 glob 模式                        |
| 参数范围   | 受安全 bin 配置文件和字面令牌规则限制 | 仅路径匹配；参数由你负责 |
| 典型示例 | `head`、`tail`、`tr`、`wc`                             | `jq`、`python3`、`node`、`ffmpeg`、自定义 CLI               |
| 最佳用途         | 流水线中的低风险文本转换                  | 任何行为更广泛或有副作用的工具               |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或每 Agent 的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或每 Agent 的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或每 Agent 的 `agents.list[].tools.exec.safeBinProfiles`）。每 Agent 配置文件键覆盖全局键。
- 允许列表条目位于主机本地的 `~/.openclaw/exec-approvals.json` 中的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...`）。
- `openclaw security audit` 在 `safeBins` 中出现没有显式配置文件的解释器/运行时 bin 时，会以 `tools.exec.safe_bins_interpreter_unprofiled` 发出警告。
- `openclaw doctor --fix` 可以将缺失的自定义 `safeBinProfiles.<bin>` 条目搭建为 `{}`（之后检查并收紧）。解释器/运行时 bin 不会自动搭建。

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

如果你显式将 `jq` 加入 `safeBins`，OpenClaw 仍然会在安全 bin 模式下拒绝 `env` 内置，因此 `jq -n env` 无法在没有显式允许列表路径或批准提示的情况下转储主机进程环境。

## Control UI 编辑

使用 **Control UI → Nodes → Exec approvals** 卡片来编辑默认值、每 Agent 覆盖和允许列表。选择范围（默认值或某个 Agent），调整策略，添加/删除允许列表模式，然后**保存**。UI 显示每个模式的**最后使用**元数据，以便你保持列表整洁。

目标选择器选择 **Gateway**（本地批准）或 **Node**。节点必须公告 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。
如果节点尚未公告 exec 批准，直接编辑其本地 `~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持 Gateway 或节点编辑（参阅 [Approvals CLI](/cli/approvals)）。

## 批准流程

当需要提示时，Gateway 向操作者客户端广播 `exec.approval.requested`。Control UI 和 macOS 应用通过 `exec.approval.resolve` 解决它，然后 Gateway 将已批准的请求转发给节点主机。

对于 `host=node`，批准请求包含规范的 `systemRunPlan` 载荷。Gateway 使用该计划作为在转发已批准的 `system.run` 请求时的权威命令/cwd/Session 上下文。

## 解释器/运行时命令

基于批准的解释器/运行时运行是故意保守的：

- 精确的 argv/cwd/env 上下文始终会绑定。
- 直接 Shell 脚本和直接运行时文件形式会尽力绑定到一个具体的本地文件快照。
- 仍解析到一个直接本地文件的常见包管理器包装器形式（例如 `pnpm exec`、`pnpm node`、`npm exec`、`npx`）在绑定前会被解包。
- 如果 OpenClaw 无法为解释器/运行时命令确认恰好一个具体的本地文件（例如包脚本、eval 形式、运行时特定的加载器链或模糊的多文件形式），则拒绝基于批准的执行，而非声称它没有的语义覆盖。
- 对于这些工作流，优先使用沙盒、单独的主机边界，或者操作者接受更广泛运行时语义的显式受信任允许列表/full 工作流。

当需要批准时，exec 工具立即返回一个批准 id。使用该 id 关联后续系统事件（`Exec finished` / `Exec denied`）。如果在超时前没有做出决定，请求被视为批准超时并作为拒绝原因呈现。

确认对话框包含：

- 命令 + 参数
- cwd
- Agent id
- 解析后的可执行文件路径
- 主机 + 策略元数据

操作：

- **Allow once** → 立即运行
- **Always allow** → 添加到允许列表 + 运行
- **Deny** → 阻止

### 跟进交付行为

已批准的异步 exec 完成后，OpenClaw 向同一 Session 发送跟进 `agent` 轮次。

- 如果存在有效的外部交付目标（可交付 Channel 加目标 `to`），跟进交付使用该 Channel。
- 在无外部目标的仅 webchat 或内部 Session 流程中，跟进交付保持仅 Session（`deliver: false`）。
- 如果调用者明确请求严格外部交付但没有可解析的外部 Channel，请求以 `INVALID_REQUEST` 失败。
- 如果启用了 `bestEffortDeliver` 且无法解析外部 Channel，交付降级为仅 Session 而非失败。

## 将批准转发到聊天 Channel

你可以将 exec 批准提示转发到任何聊天 Channel（包括 Plugin Channel），并使用 `/approve` 批准它们。这使用正常的出站交付流水线。

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

### Plugin 批准转发

Plugin 批准转发使用与 exec 批准相同的交付流水线，但在 `approvals.plugin` 下有独立配置。启用或禁用其中一个不影响另一个。

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

配置形态与 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、`sessionFilter` 和 `targets` 工作方式相同。

支持共享交互式回复的 Channel 为 exec 和 plugin 批准渲染相同的批准按钮。没有共享交互式 UI 的 Channel 退回到带 `/approve` 说明的纯文本。

### 任意 Channel 上的同聊天批准

当 exec 或 plugin 批准请求来自可交付的聊天界面时，同一聊天现在可以默认使用 `/approve` 批准它。这适用于 Slack、Matrix 和 Microsoft Teams 等 Channel，以及现有的 Web UI 和终端 UI 流程。

这个共享文本命令路径使用该对话的正常 Channel 认证模型。如果发起聊天已经可以发送命令并接收回复，批准请求不再需要单独的原生交付适配器来保持待处理状态。

Discord 和 Telegram 也支持同聊天 `/approve`，但这些 Channel 即使在禁用原生批准交付时仍使用其已解析的审批者列表进行授权。

### 原生批准交付

某些 Channel 也可以作为原生批准客户端。原生客户端在共享的同聊天 `/approve` 流程之上添加审批者私信、原始聊天扇出和 Channel 特定的交互式批准 UX。

当原生批准卡片/按钮可用时，该原生 UI 是主要的面向 Agent 的路径。Agent 不应额外回显重复的纯聊天 `/approve` 命令，除非工具结果表明聊天批准不可用或手动批准是唯一剩余路径。

原生批准客户端在以下所有条件为真时自动启用私信优先交付：

- Channel 支持原生批准交付
- 可以从明确的 `execApprovals.approvers` 或该 Channel 记录的回退来源解析审批者
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

将 `enabled: false` 设置为显式禁用原生批准客户端。当审批者解析时，将 `enabled: true` 强制开启。公共原始聊天交付通过 `channels.<channel>.execApprovals.target` 保持明确。

FAQ：[为什么聊天批准有两个 exec 批准配置？](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

这些原生批准客户端在共享的同聊天 `/approve` 流程和共享批准按钮之上添加私信路由和可选 Channel 扇出。

共同行为：

- Slack、Matrix、Microsoft Teams 和类似可交付聊天使用同聊天 `/approve` 的正常 Channel 认证模型
- 当原生批准客户端自动启用时，默认原生交付目标为审批者私信
- 对于 Discord 和 Telegram，只有已解析的审批者可以批准或拒绝
- Discord 审批者可以是明确的（`execApprovals.approvers`）或从 `commands.ownerAllowFrom` 推断
- Telegram 审批者可以是明确的（`execApprovals.approvers`）或从现有所有者配置推断（`allowFrom`，加上支持时的直接消息 `defaultTo`）
- Slack 审批者可以是明确的（`execApprovals.approvers`）或从 `commands.ownerAllowFrom` 推断
- Slack 原生按钮保留批准 id 类型，因此 `plugin:` id 可以解析 plugin 批准而无需第二个 Slack 本地回退层
- Matrix 原生私信/Channel 路由仅限 exec；Matrix plugin 批准保留在共享的同聊天 `/approve` 和可选的 `approvals.plugin` 转发路径上
- 请求者不需要是审批者
- 当该聊天已经支持命令和回复时，原始聊天可以直接使用 `/approve` 批准
- 原生 Discord 批准按钮按批准 id 类型路由：`plugin:` id 直接进入 plugin 批准，其他都进入 exec 批准
- 原生 Telegram 批准按钮遵循与 `/approve` 相同的有界 exec 到 plugin 回退
- 当原生 `target` 启用原始聊天交付时，批准提示包含命令文本
- 待处理 exec 批准默认在 30 分钟后过期
- 如果没有操作者 UI 或配置的批准客户端可以接受请求，提示回退到 `askFallback`

Telegram 默认发送到审批者私信（`target: "dm"`）。当你希望批准提示也出现在原始 Telegram 聊天/话题中时，可以切换到 `channel` 或 `both`。对于 Telegram 论坛话题，OpenClaw 会为批准提示和批准后的跟进保留话题。

参阅：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + approvals + system.run)
```

安全说明：

- Unix socket 模式 `0600`，token 存储在 `exec-approvals.json` 中。
- 相同 UID 对等检查。
- 质询/响应（nonce + HMAC token + 请求哈希）+ 短 TTL。

## 系统事件

Exec 生命周期作为系统消息呈现：

- `Exec running`（仅当命令超过运行通知阈值时）
- `Exec finished`
- `Exec denied`

这些在节点报告事件后发布到 Agent Session。
Gateway 主机 exec 批准在命令完成时（以及可选地在运行时间超过阈值时）发出相同的生命周期事件。
受批准门控的 exec 将批准 id 复用为这些消息中的 `runId` 以便于关联。

## 被拒绝批准的行为

当异步 exec 批准被拒绝时，OpenClaw 会阻止 Agent 在 Session 中重用之前相同命令运行的输出。拒绝原因会带有明确的指导（没有命令输出可用），这会阻止 Agent 声称有新输出或使用之前成功运行的过时结果重复被拒绝的命令。

## 影响

- **full** 功能强大；尽可能优先使用允许列表。
- **ask** 让你保持参与同时仍允许快速批准。
- 每 Agent 允许列表防止一个 Agent 的批准泄漏到其他 Agent 中。
- 批准仅适用于来自**授权发送者**的主机 exec 请求。未授权发送者无法发出 `/exec`。
- `/exec security=full` 是授权操作者的 Session 级便捷设置，按设计跳过批准。
  要硬性阻止主机 exec，将批准安全性设置为 `deny` 或通过工具策略拒绝 `exec` 工具。

相关：

- [Exec tool](/tools/exec)
- [Elevated mode](/tools/elevated)
- [Skills](/tools/skills)

## 相关

- [Exec](/tools/exec) — Shell 命令执行工具
- [沙盒化](/gateway/sandboxing) — 沙盒模式和工作区访问
- [安全](/gateway/security) — 安全模型和加固
- [沙盒 vs 工具策略 vs 提升模式](/gateway/sandbox-vs-tool-policy-vs-elevated) — 何时使用各项功能
