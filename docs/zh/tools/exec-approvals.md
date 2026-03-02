---
title: "Exec 批准"
mmh3_hash: "ee8c85fcdc1ad90565a935129b1ea149"
summary: "Exec 批准、允许列表和沙盒逃逸提示"
read_when:
  - 配置 exec 批准或允许列表
  - 在 macOS 应用中实现 exec 批准 UX
  - 审查沙盒逃逸提示和影响
---

# Exec 批准

Exec 批准是让沙盒化 agent 在真实主机（`gateway` 或 `node`）上运行命令的**伴侣应用/节点主机防护**。将其视为安全联锁：只有当策略 + 允许列表 + （可选）用户批准都同意时，才允许命令。Exec 批准是**除了**工具策略和提升门控之外的（除非提升设置为 `full`，这会跳过批准）。有效策略是 `tools.exec.*` 和批准默认值中**更严格**的；如果省略批准字段，则使用 `tools.exec` 值。

如果伴侣应用 UI **不可用**，任何需要提示的请求都会由**询问回退**解决（默认：拒绝）。

## 适用范围

Exec 批准在执行主机上本地强制执行：

- **Gateway 主机** → Gateway 机器上的 `openclaw` 进程
- **节点主机** → 节点运行器（macOS 伴侣应用或无头节点主机）

信任模型说明：

- 经过 Gateway 认证的调用者是该 Gateway 的受信任操作员。
- 配对节点将受信任的操作员能力扩展到节点主机。
- Exec 批准降低了意外执行的风险，但不是每用户的身份验证边界。

macOS 拆分：

- **节点主机服务**通过本地 IPC 将 `system.run` 转发到 **macOS 应用**。
- **macOS 应用**强制执行批准 + 在 UI 上下文中执行命令。

## 设置和存储

批准位于执行主机上的本地 JSON 文件中：

`~/.openclaw/exec-approvals.json`

示例架构：

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

## 策略配置

### 安全（`exec.security`）

- **deny**：阻止所有主机 exec 请求。
- **allowlist**：仅允许允许列表中的命令。
- **full**：允许所有内容（相当于提升）。

### 询问（`exec.ask`）

- **off**：从不提示。
- **on-miss**：仅在允许列表不匹配时提示。
- **always**：每次命令都提示。

### 询问回退（`askFallback`）

如果需要提示但无法访问 UI，回退决定：

- **deny**：阻止。
- **allowlist**：仅当允许列表匹配时允许。
- **full**：允许。

## 允许列表（每个 agent）

允许列表是**每个 agent** 的。如果存在多个 agent，在 macOS 应用中切换您正在编辑的 agent。模式是**不区分大小写的通配符匹配**。模式应解析为**二进制路径**（忽略仅基名条目）。旧的 `agents.default` 条目在加载时迁移到 `agents.main`。

示例：

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个允许列表条目跟踪：

- **id** 用于 UI 标识的稳定 UUID（可选）
- **上次使用**时间戳
- **上次使用的命令**
- **上次解析的路径**

## 自动允许 Skill CLI

当启用**自动允许 Skill CLI** 时，已知 Skill 引用的可执行文件在节点（macOS 节点或无头节点主机）上被视为允许列表。这通过 Gateway RPC 使用 `skills.bins` 来获取 Skill bin 列表。如果您想要严格的手动允许列表，请禁用此功能。

重要信任说明：

- 这是一个**隐式便利允许列表**，与手动路径允许列表条目分开。
- 它适用于 Gateway 和节点在同一信任边界内的受信任操作员环境。
- 如果您需要严格的显式信任，请保持 `autoAllowSkills: false` 并仅使用手动路径允许列表条目。

## 安全 bin（仅 stdin）

`tools.exec.safeBins` 定义了一个小的**仅 stdin** 二进制文件列表（例如 `jq`），可以在允许列表模式下**无需**显式允许列表条目即可运行。安全 bin 拒绝位置文件参数和类路径令牌，因此它们只能在传入流上操作。将其视为流过滤器的窄快速路径，而不是通用信任列表。**不要**将解释器或运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。如果命令可以评估代码、执行子命令或按设计读取文件，请优先使用显式允许列表条目并保持启用批准提示。自定义安全 bin 必须在 `tools.exec.safeBinProfiles.<bin>` 中定义明确的配置文件。验证仅从 argv 形状确定性地进行（无主机文件系统存在检查），这防止了允许/拒绝差异导致的文件存在预言行为。默认安全 bin 的文件导向选项被拒绝（例如 `sort -o`、`sort --output`、`sort --files0-from`、`sort --compress-program`、`sort --random-source`、`sort --temporary-directory`/`-T`、`wc --files0-from`、`jq -f/--from-file`、`grep -f/--file`）。安全 bin 还为破坏仅 stdin 行为的选项强制执行明确的每二进制标志策略（例如 `sort -o/--output/--compress-program` 和 grep 递归标志）。长选项在安全 bin 模式下以失败关闭的方式验证：未知标志和模糊缩写被拒绝。

按安全 bin 配置文件拒绝的标志：

<!-- SAFE_BIN_DENIED_FLAGS:START -->

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`
<!-- SAFE_BIN_DENIED_FLAGS:END -->

安全 bin 还强制将 argv 令牌在执行时视为**字面文本**（无通配符展开和无 `$VARS` 扩展），以防止像 `*` 或 `$HOME/...` 这样的模式被用来偷运文件读取。安全 bin 还必须从受信任的二进制目录解析（系统默认值加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目永远不会自动受信任。默认受信任的安全 bin 目录有意最小化：`/bin`、`/usr/bin`。如果您的安全 bin 可执行文件位于包管理器/用户路径（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`）中，请将其显式添加到 `tools.exec.safeBinTrustedDirs`。在允许列表模式下不会自动允许 shell 链接和重定向。

Shell 链接（`&&`、`||`、`;`）在每个顶级段满足允许列表时被允许（包括安全 bin 或 Skill 自动允许）。在允许列表模式下重定向仍不受支持。命令替换（`$()` / 反引号）在允许列表解析期间被拒绝，包括双引号内；如果需要字面 `$()` 文本，请使用单引号。在 macOS 伴侣应用批准中，包含 shell 控制或扩展语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 文本被视为允许列表未命中，除非 shell 二进制文件本身被允许列表。对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围的环境覆盖被减少到一个小的显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。对于允许列表模式下的始终允许决策，已知的调度包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）持久化内部可执行文件路径而不是包装器路径。Shell 多路复用器（`busybox`、`toybox`）也被解包，用于 shell 小程序（`sh`、`ash` 等），因此持久化内部可执行文件而不是多路复用器二进制文件。如果无法安全地解包包装器或多路复用器，则不会自动持久化允许列表条目。

默认安全 bin：`jq`、`cut`、`uniq`、`head`、`tail`、`tr`、`wc`。

`grep` 和 `sort` 不在默认列表中。如果您选择加入，请为其非 stdin 工作流保留显式允许列表条目。对于安全 bin 模式下的 `grep`，使用 `-e`/`--regexp` 提供模式；位置模式形式被拒绝，因此文件操作数无法作为模糊位置参数被偷运。

### 安全 bin 与允许列表

| 主题             | `tools.exec.safeBins`                                  | 允许列表（`exec-approvals.json`）                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| 目标             | 自动允许窄 stdin 过滤器                                | 显式信任特定可执行文件                                       |
| 匹配类型         | 可执行文件名称 + 安全 bin argv 策略                    | 解析的可执行文件路径通配符模式                               |
| 参数范围         | 受安全 bin 配置文件和字面令牌规则限制                  | 仅路径匹配；否则参数由您负责                                 |
| 典型示例         | `jq`、`head`、`tail`、`wc`                             | `python3`、`node`、`ffmpeg`、自定义 CLI                      |
| 最佳用途         | 管道中的低风险文本转换                                 | 任何具有更广泛行为或副作用的工具                             |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或每个 agent 的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或每个 agent 的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或每个 agent 的 `agents.list[].tools.exec.safeBinProfiles`）。每个 agent 的配置文件键覆盖全局键。
- 允许列表条目存放在主机本地的 `~/.openclaw/exec-approvals.json` 中，位于 `agents.<id>.allowlist` 下（或通过控制 UI / `openclaw approvals allowlist ...`）。
- `openclaw security audit` 在 `safeBins` 中出现没有明确配置文件的解释器/运行时 bin 时，使用 `tools.exec.safe_bins_interpreter_unprofiled` 发出警告。
- `openclaw doctor --fix` 可以将缺失的自定义 `safeBinProfiles.<bin>` 条目脚手架为 `{}`（之后查看并收紧）。解释器/运行时 bin 不会自动脚手架。

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

## 控制 UI 编辑

使用**控制 UI → 节点 → Exec 批准**卡编辑默认值、每个 agent 的覆盖和允许列表。选择一个范围（默认值或 agent），调整策略，添加/删除允许列表模式，然后**保存**。UI 显示每个模式的**上次使用**元数据，以便您可以保持列表整洁。

目标选择器选择 **Gateway**（本地批准）或**节点**。节点必须公告 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。如果节点尚未公告 exec 批准，直接编辑其本地 `~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持 Gateway 或节点编辑（参见 [批准 CLI](/cli/approvals)）。

## 批准流程

当需要提示时，Gateway 向操作员客户端广播 `exec.approval.requested`。控制 UI 和 macOS 应用通过 `exec.approval.resolve` 解决它，然后 Gateway 将批准的请求转发到节点主机。

对于 `host=node`，批准请求包含一个规范的 `systemRunPlan` 负载。Gateway 使用该计划作为权威命令/cwd/Session 上下文，在转发已批准的 `system.run` 请求时。

当需要批准时，exec 工具立即返回批准 id。使用该 id 关联稍后的系统事件（`Exec finished` / `Exec denied`）。如果在超时之前没有决定到达，请求被视为批准超时并作为拒绝原因浮出水面。

确认对话框包括：

- 命令 + 参数
- cwd
- agent id
- 解析的可执行文件路径
- 主机 + 策略元数据

操作：

- **仅允许一次** → 立即运行
- **始终允许** → 添加到允许列表 + 运行
- **拒绝** → 阻止

## 批准转发到聊天 Channel

您可以将 exec 批准提示转发到任何聊天 Channel（包括 Plugin Channel），并使用 `/approve` 批准它们。这使用正常的出站投递管道。

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

### macOS IPC 流程

```
Gateway -> 节点服务（WS）
                 |  IPC（UDS + 令牌 + HMAC + TTL）
                 v
             Mac 应用（UI + 批准 + system.run）
```

安全注意事项：

- Unix 套接字模式 `0600`，令牌存储在 `exec-approvals.json` 中。
- 相同 UID 对等检查。
- 挑战/响应（nonce + HMAC 令牌 + 请求哈希）+ 短 TTL。

## 系统事件

Exec 生命周期作为系统消息浮出水面：

- `Exec running`（仅当命令超过运行通知阈值时）
- `Exec finished`
- `Exec denied`

这些在节点报告事件后发布到 agent 的 Session。Gateway 主机 exec 批准在命令完成时发出相同的生命周期事件（并且可选地在运行时间超过阈值时）。批准门控的 exec 在这些消息中重用批准 id 作为 `runId`，以便于关联。

## 影响

- **full** 很强大；在可能的情况下优先使用允许列表。
- **ask** 让您保持在循环中，同时仍然允许快速批准。
- 每个 agent 的允许列表防止一个 agent 的批准泄漏到其他 agent。
- 批准仅适用于来自**授权发送者**的主机 exec 请求。未授权的发送者无法发出 `/exec`。
- `/exec security=full` 是授权操作员的 Session 级便利功能，按设计跳过批准。要硬阻止主机 exec，将批准安全性设置为 `deny` 或通过工具策略拒绝 `exec` 工具。

相关：

- [Exec 工具](/tools/exec)
- [提升模式](/tools/elevated)
- [Skill](/tools/skills)
