---
mmh3_hash: "9e0ea922a3165d078255003975f4d484"
summary: "`openclaw tui` 的 CLI 参考（连接到 Gateway 的终端 UI 或本地嵌入模式）"
read_when:
  - 您想要适用于 Gateway 的终端 UI（远程友好）
  - 您想从脚本传递 url/token/session
  - 您想在没有 Gateway 的情况下以本地嵌入模式运行 TUI
  - 您想使用 openclaw chat 或 openclaw tui --local
title: "TUI"
---

# `openclaw tui`

打开连接到 Gateway 的终端 UI，或在本地嵌入模式下运行。

相关：

- TUI 指南：[TUI](/web/tui)

## 选项

| 标志                  | 默认值                                    | 描述                                                                               |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | 针对本地嵌入式 Agent 运行时运行，而不是 Gateway。                                  |
| `--url <url>`         | 配置中的 `gateway.remote.url`             | Gateway WebSocket URL。                                                            |
| `--token <token>`     | （无）                                    | 如果需要，Gateway 令牌。                                                           |
| `--password <pass>`   | （无）                                    | 如果需要，Gateway 密码。                                                           |
| `--session <key>`     | `main`（或范围为全局时为 `global`）       | Session 键。在 Agent 工作空间内，除非带前缀，否则自动选择该 Agent。                |
| `--deliver`           | `false`                                   | 通过已配置的 Channel 交付助手回复。                                                |
| `--thinking <level>`  | （模型默认值）                            | 思考级别覆盖。                                                                     |
| `--message <text>`    | （无）                                    | 连接后发送初始消息。                                                               |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | Agent 超时。无效值记录警告并被忽略。                                               |
| `--history-limit <n>` | `200`                                     | 附加时加载的历史条目数。                                                           |

别名：`openclaw chat` 和 `openclaw terminal` 调用带有隐含 `--local` 的同一命令。

注意事项：

- `chat` 和 `terminal` 是 `openclaw tui --local` 的别名。
- `--local` 不能与 `--url`、`--token` 或 `--password` 组合。
- `tui` 在可能的情况下为令牌/密码身份验证解析已配置的 Gateway 身份验证 SecretRef（`env`/`file`/`exec` Provider）。
- 从已配置的 Agent 工作空间目录启动时，TUI 自动为 Session 键默认选择该 Agent（除非 `--session` 显式为 `agent:<id>:...`）。
- 本地模式直接使用嵌入式 Agent 运行时。大多数本地工具可用，但仅限 Gateway 的功能不可用。
- 本地模式在 TUI 命令界面内添加 `/auth [provider]`。
- Plugin 审批门控在本地模式下仍然适用。需要审批的工具会在终端提示决策；不会因为 Gateway 未参与而静默自动批准。

## 示例

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# 在 Agent 工作空间内运行时，自动推断该 Agent
openclaw tui --session bugfix
```

## 配置修复循环

当当前配置已通过验证，并且您希望嵌入式 Agent 检查它、与文档对比并从同一终端帮助修复时，使用本地模式：

如果 `openclaw config validate` 已经失败，请先使用 `openclaw configure` 或 `openclaw doctor --fix`。`openclaw chat` 不绕过无效配置守卫。

```bash
openclaw chat
```

然后在 TUI 内：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

使用 `openclaw config set` 或 `openclaw configure` 应用有针对性的修复，然后重新运行 `openclaw config validate`。请参阅 [TUI](/web/tui) 和 [Config](/cli/config)。

## 相关

- [CLI 参考](/cli)
- [TUI](/web/tui)
