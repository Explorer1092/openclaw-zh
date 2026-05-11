---
title: "Elevated mode"
mmh3_hash: "ecc3afb0ebd2fcdd7db21d143b84225a"
summary: "提升执行模式：在沙盒 Agent 中从沙盒外运行命令"
read_when:
  - 调整提升模式默认值、允许列表或 Slash Command 行为
  - 了解沙盒 Agent 如何访问主机
---

当 Agent 在沙盒内运行时，其 `exec` 命令被限制在沙盒环境中。**提升模式**让 Agent 突破限制，在沙盒外运行命令，并带有可配置的批准门控。

<Info>
  提升模式仅在 Agent **被沙盒化**时改变行为。对于未沙盒化的 Agent，exec 已经在主机上运行。
</Info>

## 指令

通过 Slash Command 按 Session 控制提升模式：

| 指令             | 作用                                                |
| ---------------- | --------------------------------------------------- |
| `/elevated on`   | 在配置的主机路径上运行（沙盒外），保持批准          |
| `/elevated ask`  | 与 `on` 相同（别名）                                |
| `/elevated full` | 在配置的主机路径上运行（沙盒外）并跳过批准          |
| `/elevated off`  | 返回到沙盒限制执行                                  |

也可以使用 `/elev on|off|ask|full`。

发送不带参数的 `/elevated` 可查看当前级别。

## 工作原理

<Steps>
  <Step title="检查可用性">
    提升必须在配置中启用，且发送者必须在允许列表中：

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="设置级别">
    发送一条仅含指令的消息以设置 Session 默认值：

    ```
    /elevated full
    ```

    或在消息中内联使用（仅适用于该消息）：

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="命令在沙盒外运行">
    提升激活后，`exec` 调用会离开沙盒。有效主机默认为 `gateway`，当已配置/Session 的 exec 目标为 `node` 时为 `node`。在 `full` 模式下，exec 批准被跳过。在 `on`/`ask` 模式下，已配置的批准规则仍然适用。
  </Step>
</Steps>

## 解析顺序

1. **内联指令** 在消息中（仅适用于该消息）
2. **Session 覆盖**（通过发送仅含指令的消息设置）
3. **全局默认值**（配置中的 `agents.defaults.elevatedDefault`）

## 可用性和允许列表

- **全局门控**：`tools.elevated.enabled`（必须为 `true`）
- **发送者允许列表**：`tools.elevated.allowFrom`，带有每个 Channel 的列表
- **每个 Agent 的门控**：`agents.list[].tools.elevated.enabled`（只能进一步限制）
- **每个 Agent 的允许列表**：`agents.list[].tools.elevated.allowFrom`（发送者必须同时匹配全局 + 每个 Agent 的列表）
- **Discord 回退**：如果省略 `tools.elevated.allowFrom.discord`，使用 `channels.discord.allowFrom` 作为回退
- **所有门控都必须通过**；否则提升被视为不可用

允许列表条目格式：

| 前缀                    | 匹配内容                        |
| ----------------------- | ------------------------------- |
| （无）                  | 发送者 ID、E.164 或 From 字段   |
| `name:`                 | 发送者显示名称                  |
| `username:`             | 发送者用户名                    |
| `tag:`                  | 发送者标签                      |
| `id:`、`from:`、`e164:` | 明确的身份定向                  |

## 提升不控制什么

- **工具策略**：如果 `exec` 被工具策略拒绝，提升无法覆盖
- **主机选择策略**：提升不会将 `auto` 变成自由的跨主机覆盖。它使用已配置/Session 的 exec 目标规则，仅在目标已经是 `node` 时才选择 `node`。
- **与 `/exec` 分开**：`/exec` 指令为授权发送者调整每 Session 的 exec 默认值，不需要提升模式

<Note>
  Bash 聊天命令（`!` 前缀；`/bash` 别名）是一个单独的门控，除了其自身的 `tools.bash.enabled` 标志外，还需要启用 `tools.elevated`。禁用提升模式也会锁定 `!` Shell 命令。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="Exec 工具" href="/tools/exec" icon="terminal">
    从 Agent 执行 Shell 命令。
  </Card>
  <Card title="Exec 审批" href="/tools/exec-approvals" icon="shield">
    `exec` 的审批和允许列表系统。
  </Card>
  <Card title="沙盒化" href="/gateway/sandboxing" icon="box">
    Gateway 级别的沙盒配置。
  </Card>
  <Card title="沙盒 vs 工具策略 vs 提升模式" href="/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    三种门控在工具调用中的组合方式。
  </Card>
</CardGroup>
