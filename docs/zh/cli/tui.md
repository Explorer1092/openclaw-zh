---
mmh3_hash: "e5e54d91350968fa62f3acbe917cae23"
title: "`openclaw tui`"
sidebarTitle: "openclaw tui"
summary: "`openclaw tui` 的 CLI 参考(连接到 Gateway 的终端 UI 或本地嵌入模式)"
read_when:
  - 您想要 Gateway 的终端 UI(远程友好)
  - 您想从脚本传递 url/token/session
  - 您想在没有 Gateway 的情况下以本地嵌入模式运行 TUI
  - 您想使用 openclaw chat 或 openclaw tui --local
---

# `openclaw tui`

打开连接到 Gateway 的终端 UI,或以本地嵌入模式运行。

相关:

- TUI 指南:[TUI](/web/tui)

注意:

- `chat` 和 `terminal` 是 `openclaw tui --local` 的别名。
- `--local` 不能与 `--url`、`--token` 或 `--password` 组合使用。
- `tui` 在可能的情况下解析已配置的 Gateway 身份验证 SecretRef 用于令牌/密码身份验证(`env`/`file`/`exec` Provider)。
- 从已配置的 Agent 工作区目录内启动时,TUI 自动为 Session 密钥默认值选择该 Agent(除非 `--session` 明确为 `agent:<id>:...`)。
- 本地模式直接使用嵌入式 Agent 运行时。大多数本地工具可以使用,但仅限 Gateway 的功能不可用。
- 本地模式在 TUI 命令界面中添加 `/auth [provider]`。
- Plugin 批准门控在本地模式下仍然适用。需要批准的工具会在终端中提示决定;由于不涉及 Gateway,不会静默自动批准。

## 示例

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# 在 Agent 工作区内运行时，自动推断该 Agent
openclaw tui --session bugfix
```

## 配置修复循环

当当前配置已通过验证且您希望嵌入式 Agent 检查它、将其与文档对比并从同一终端帮助修复时,使用本地模式:

如果 `openclaw config validate` 已经失败,请先使用 `openclaw configure` 或 `openclaw doctor --fix`。`openclaw chat` 不会绕过无效配置防护。

```bash
openclaw chat
```

然后在 TUI 内:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

使用 `openclaw config set` 或 `openclaw configure` 应用针对性修复,然后重新运行 `openclaw config validate`。参见 [TUI](/web/tui) 和 [配置](/cli/config)。

## 相关

- [CLI 参考](/cli)
- [TUI](/web/tui)
