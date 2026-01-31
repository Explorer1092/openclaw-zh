---
title: "`openclaw onboard`"
sidebarTitle: "openclaw onboard"
mmh3_hash: "09926de5f27b01e42667e750ec755a87"
summary: "`openclaw onboard` 的 CLI 参考(交互式入职向导)"
read_when: ["您想要网关、工作区、身份验证、频道和技能的指导性设置"]
---

# `openclaw onboard`

交互式入职向导(本地或远程网关设置)。

相关:
- 向导指南:[入职](/start/onboarding)

## 示例

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url ws://gateway-host:18789
```

流程注意事项:
- `quickstart`:最少提示,自动生成网关令牌。
- `manual`:端口/绑定/身份验证的完整提示(`advanced` 的别名)。
- 最快的第一次聊天:`openclaw dashboard`(控制 UI,无频道设置)。
