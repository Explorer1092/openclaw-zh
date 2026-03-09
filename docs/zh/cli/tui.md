---
mmh3_hash: "f0b4cfe06b6f08b6b10598e71703a145"
title: "`openclaw tui`"
sidebarTitle: "openclaw tui"
summary: "`openclaw tui` 的 CLI 参考(连接到Gateway的终端 UI)"
read_when:
  - 您想要Gateway的终端 UI(远程友好)
  - 您想从脚本传递 url/token/session
---

# `openclaw tui`

打开连接到Gateway的终端 UI。

相关:

- TUI 指南:[TUI](/web/tui)

注意:

- `tui` 在可能的情况下解析已配置的 Gateway 身份验证 SecretRef 用于令牌/密码身份验证(`env`/`file`/`exec` Provider)。
- 从已配置的 Agent 工作区目录内启动时,TUI 自动为 Session 密钥默认值选择该 Agent(除非 `--session` 明确为 `agent:<id>:...`)。

## 示例

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# 在 Agent 工作区内运行时，自动推断该 Agent
openclaw tui --session bugfix
```
