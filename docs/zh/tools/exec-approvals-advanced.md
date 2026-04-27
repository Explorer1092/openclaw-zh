---
mmh3_hash: "ebec2825c54cee2c0f864c375466c342"
summary: "高级 exec 审批：安全二进制文件、解释器绑定、审批转发、原生交付"
read_when:
  - 配置安全二进制文件或自定义安全二进制文件配置文件
  - 将审批转发到 Slack/Discord/Telegram 或其他聊天 Channel
  - 为 Channel 实现原生审批客户端
title: "Exec 审批 — 高级"
---

高级 exec 审批主题：`safeBins` 快速路径、解释器/运行时绑定，以及向聊天 Channel 转发审批（包括原生交付）。有关核心策略和审批流程，请参见 [Exec 审批](/tools/exec-approvals)。

## 安全二进制文件（仅限 stdin）

`tools.exec.safeBins` 定义了一小列**仅限 stdin** 的二进制文件（例如 `cut`），可以在允许列表模式下**无需**显式允许列表条目即可运行。安全二进制文件拒绝位置文件参数和路径状 token，因此它们只能对传入流进行操作。将其视为流过滤器的狭窄快速路径，而不是通用信任列表。

<Warning>
**不要**将解释器或运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）添加到 `safeBins`。如果命令可以评估代码、执行子命令或按设计读取文件，请优先使用显式允许列表条目并保持审批提示启用。自定义安全二进制文件必须在 `tools.exec.safeBinProfiles.<bin>` 中定义显式配置文件。
</Warning>

默认安全二进制文件：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`、`uniq`、`head`、`tail`、`tr`、`wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在默认列表中。如果您选择加入，请为其非 stdin 工作流保留显式允许列表条目。对于安全二进制文件模式下的 `grep`，请使用 `-e`/`--regexp` 提供模式；位置模式形式被拒绝，因此文件操作数无法被伪装成模糊的位置参数。

### 参数验证和拒绝标志

验证仅从 argv 形状确定（无主机文件系统存在检查），这防止了允许/拒绝差异产生的文件存在预言机行为。文件导向的选项对默认安全二进制文件被拒绝；长选项以失败关闭方式验证（未知标志和模糊缩写被拒绝）。

按安全二进制文件配置文件拒绝的标志：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`：`--dereference-recursive`、`--directories`、`--exclude-from`、`--file`、`--recursive`、`-R`、`-d`、`-f`、`-r`
- `jq`：`--argfile`、`--from-file`、`--library-path`、`--rawfile`、`--slurpfile`、`-L`、`-f`
- `sort`：`--compress-program`、`--files0-from`、`--output`、`--random-source`、`--temporary-directory`、`-T`、`-o`
- `wc`：`--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全二进制文件还强制在执行时将 argv token 视为**字面文本**（对仅 stdin 段无通配符展开和无 `$VARS` 展开），因此 `*` 或 `$HOME/...` 等模式不能用于伪装文件读取。

### 受信任的二进制目录

安全二进制文件必须从受信任的二进制目录解析（系统默认值加上可选的 `tools.exec.safeBinTrustedDirs`）。`PATH` 条目从不自动受信任。默认受信任目录有意保持最小：`/bin`、`/usr/bin`。如果您的安全二进制可执行文件位于包管理器/用户路径中（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），请将其显式添加到 `tools.exec.safeBinTrustedDirs`。

### Shell 链接、包装器和多路复用器

当每个顶级段满足允许列表（包括安全二进制文件或 Skill 自动允许）时，允许 Shell 链接（`&&`、`||`、`;`）。在允许列表模式下仍不支持重定向。命令替换（`$()` / 反引号）在允许列表解析期间被拒绝，包括在双引号内；如果需要字面 `$()` 文本，请使用单引号。

在 macOS 伴随应用审批中，包含 Shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 Shell 文本被视为允许列表未命中，除非 Shell 二进制文件本身在允许列表中。

对于 Shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围的环境覆盖被简化为一个小的显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

对于允许列表模式下的 `allow-always` 决策，已知的调度包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）持久化内部可执行文件路径而不是包装器路径。Shell 多路复用器（`busybox`、`toybox`）以相同方式为 Shell applet（`sh`、`ash` 等）解包。如果包装器或多路复用器无法安全解包，则不会自动持久化允许列表条目。

如果您在允许列表中添加了像 `python3` 或 `node` 这样的解释器，优先使用 `tools.exec.strictInlineEval=true`，以便内联 eval 仍然需要显式审批。在严格模式下，`allow-always` 仍然可以持久化良性的解释器/脚本调用，但内联 eval 载体不会自动持久化。

### 安全二进制文件与允许列表

| 主题         | `tools.exec.safeBins`                        | 允许列表（`exec-approvals.json`）                                          |
| ------------ | -------------------------------------------- | -------------------------------------------------------------------------- |
| 目标         | 自动允许狭窄的 stdin 过滤器                  | 显式信任特定可执行文件                                                     |
| 匹配类型     | 可执行文件名 + 安全二进制文件 argv 策略      | 解析的可执行文件路径通配符，或 PATH 调用命令的裸命令名通配符              |
| 参数范围     | 受安全二进制文件配置文件和字面 token 规则限制 | 仅路径匹配；参数否则由您负责                                               |
| 典型示例     | `head`、`tail`、`tr`、`wc`                   | `jq`、`python3`、`node`、`ffmpeg`、自定义 CLI                              |
| 最佳用途     | 管道中的低风险文本转换                       | 任何具有更广泛行为或副作用的工具                                           |

配置位置：

- `safeBins` 来自配置（`tools.exec.safeBins` 或每 Agent 的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 来自配置（`tools.exec.safeBinTrustedDirs` 或每 Agent 的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 来自配置（`tools.exec.safeBinProfiles` 或每 Agent 的 `agents.list[].tools.exec.safeBinProfiles`）。每 Agent 配置文件键覆盖全局键。
- 允许列表条目位于主机本地 `~/.openclaw/exec-approvals.json` 的 `agents.<id>.allowlist` 下（或通过 Control UI / `openclaw approvals allowlist ...`）。
- 当解释器/运行时二进制文件出现在没有显式配置文件的 `safeBins` 中时，`openclaw security audit` 以 `tools.exec.safe_bins_interpreter_unprofiled` 发出警告。
- `openclaw doctor --fix` 可以将缺失的自定义 `safeBinProfiles.<bin>` 条目脚手架为 `{}`（之后检查并收紧）。解释器/运行时二进制文件不会自动脚手架。

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

如果您显式将 `jq` 加入 `safeBins`，OpenClaw 在安全二进制文件模式下仍然拒绝 `env` 内置，因此 `jq -n env` 无法在没有显式允许列表路径或审批提示的情况下转储主机进程环境。

## 解释器/运行时命令

经审批支持的解释器/运行时运行有意保持保守：

- 确切的 argv/cwd/env 上下文始终被绑定。
- 直接 Shell 脚本和直接运行时文件形式尽力绑定到一个具体的本地文件快照。
- 仍然解析到一个直接本地文件的常见包管理器包装器形式（例如 `pnpm exec`、`pnpm node`、`npm exec`、`npx`）在绑定前解包。
- 如果 OpenClaw 无法为解释器/运行时命令识别恰好一个具体的本地文件（例如包脚本、eval 形式、运行时特定的加载器链或模糊的多文件形式），则拒绝经审批的执行，而不是声明它没有的语义覆盖。
- 对于这些工作流，优先使用沙箱化、单独的主机边界，或操作员接受更广泛的运行时语义的显式受信任允许列表/完整工作流。

当需要审批时，exec 工具立即返回审批 id。使用该 id 关联后续系统事件（`Exec finished` / `Exec denied`）。如果在超时前没有决策到达，则该请求被视为审批超时，并作为拒绝原因显示。

### 后续交付行为

经批准的异步 exec 完成后，OpenClaw 向同一 Session 发送后续 `agent` 轮次。

- 如果存在有效的外部交付目标（可交付的 Channel 加上目标 `to`），后续交付使用该 Channel。
- 在没有外部目标的 webchat 专用或内部 Session 流中，后续交付保持仅 Session（`deliver: false`）。
- 如果调用者明确请求严格的外部交付但没有可解析的外部 Channel，则请求失败并返回 `INVALID_REQUEST`。
- 如果启用了 `bestEffortDeliver` 且没有外部 Channel 可解析，则交付降级为仅 Session，而不是失败。

## 向聊天 Channel 转发审批

您可以将 exec 审批提示转发到任何聊天 Channel（包括 Plugin Channel），并使用 `/approve` 批准它们。这使用正常的出站交付管道。

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

`/approve` 命令处理 exec 审批和 Plugin 审批两者。如果 ID 不匹配待处理的 exec 审批，它会自动检查 Plugin 审批。

### Plugin 审批转发

Plugin 审批转发使用与 exec 审批相同的交付管道，但在 `approvals.plugin` 下有其独立配置。启用或禁用其中一个不影响另一个。

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

配置形状与 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、`sessionFilter` 和 `targets` 以相同方式工作。

支持共享交互式回复的 Channel 为 exec 和 Plugin 审批渲染相同的审批按钮。没有共享交互式 UI 的 Channel 回退到带有 `/approve` 说明的纯文本。

### 任何 Channel 上的同聊天审批

当 exec 或 Plugin 审批请求来自可交付的聊天界面时，同一聊天现在可以默认使用 `/approve` 批准它。这适用于 Slack、Matrix 和 Microsoft Teams 等 Channel，以及现有的 Web UI 和终端 UI 流。

此共享文本命令路径使用该对话的正常 Channel 认证模型。如果发起聊天已经可以发送命令并接收回复，则审批请求不再需要单独的原生交付适配器来保持待处理状态。

Discord 和 Telegram 也支持同聊天 `/approve`，但这些 Channel 在禁用原生审批交付时仍然使用其解析的审批者列表进行授权。

对于 Telegram 和其他直接调用 Gateway 的原生审批客户端，此回退有意限定为"未找到审批"失败。真正的 exec 审批拒绝/错误不会静默重试为 Plugin 审批。

### 原生审批交付

某些 Channel 也可以充当原生审批客户端。原生客户端在共享同聊天 `/approve` 流之上添加审批者私信、来源聊天扇出和 Channel 特定的交互式审批 UX。

当原生审批卡片/按钮可用时，该原生 UI 是面向 Agent 的主要路径。Agent 不应再回显重复的纯聊天 `/approve` 命令，除非工具结果表示聊天审批不可用或手动审批是唯一剩余的路径。

通用模型：

- 主机 exec 策略仍然决定是否需要 exec 审批
- `approvals.exec` 控制将审批提示转发到其他聊天目的地
- `channels.<channel>.execApprovals` 控制该 Channel 是否充当原生审批客户端

满足以下所有条件时，原生审批客户端自动启用 DM 优先交付：

- Channel 支持原生审批交付
- 审批者可以从显式的 `execApprovals.approvers` 或该 Channel 记录的回退来源解析
- `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"`

设置 `enabled: false` 以显式禁用原生审批客户端。当审批者解析时，设置 `enabled: true` 以强制启用。公共来源聊天交付通过 `channels.<channel>.execApprovals.target` 保持显式。

FAQ：[为什么聊天审批有两个 exec 审批配置？](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

这些原生审批客户端在共享同聊天 `/approve` 流和共享审批按钮之上添加 DM 路由和可选 Channel 扇出。

共享行为：

- Slack、Matrix、Microsoft Teams 和类似可交付聊天对同聊天 `/approve` 使用正常的 Channel 认证模型
- 当原生审批客户端自动启用时，默认原生交付目标是审批者私信
- 对于 Discord 和 Telegram，只有解析的审批者可以批准或拒绝
- Discord 审批者可以是显式的（`execApprovals.approvers`）或从 `commands.ownerAllowFrom` 推断
- Telegram 审批者可以是显式的（`execApprovals.approvers`）或从现有所有者配置推断（`allowFrom`，加上支持的直接消息 `defaultTo`）
- Slack 审批者可以是显式的（`execApprovals.approvers`）或从 `commands.ownerAllowFrom` 推断
- Slack 原生按钮保留审批 id 类型，因此 `plugin:` id 可以在没有第二个 Slack 本地回退层的情况下解析 Plugin 审批
- Matrix 原生 DM/Channel 路由和反应快捷方式处理 exec 和 Plugin 审批两者；Plugin 授权仍然来自 `channels.matrix.dm.allowFrom`
- 请求者不需要是审批者
- 当该聊天已支持命令和回复时，发起聊天可以直接使用 `/approve` 批准
- 原生 Discord 审批按钮按审批 id 类型路由：`plugin:` id 直接进入 Plugin 审批，其他所有内容进入 exec 审批
- 原生 Telegram 审批按钮遵循与 `/approve` 相同的有界 exec 到 Plugin 回退
- 当原生 `target` 启用来源聊天交付时，审批提示包含命令文本
- 待处理的 exec 审批默认在 30 分钟后过期
- 如果没有操作员 UI 或配置的审批客户端可以接受请求，提示回退到 `askFallback`

Telegram 默认为审批者私信（`target: "dm"`）。当您希望审批提示也出现在发起的 Telegram 聊天/话题中时，可以切换到 `channel` 或 `both`。对于 Telegram 论坛话题，OpenClaw 为审批提示和批准后的后续消息保留话题。

请参见：

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
- 相同 UID 的对等检查。
- 挑战/响应（随机数 + HMAC token + 请求哈希）+ 短 TTL。

## 相关

- [Exec 审批](/tools/exec-approvals) — 核心策略和审批流程
- [Exec 工具](/tools/exec)
- [提升模式](/tools/elevated)
- [Skill](/tools/skills) — Skill 支持的自动允许行为
