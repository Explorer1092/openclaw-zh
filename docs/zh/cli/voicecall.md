---
title: "`openclaw voicecall`"
sidebarTitle: "openclaw voicecall"
mmh3_hash: "3e02e2ccf043d3f4108b92d5eebdedb4"
summary: "`openclaw voicecall` 的 CLI 参考(语音呼叫插件命令界面)"
read_when:
  - 您使用语音呼叫插件并想要 CLI 入口点
  - 您想要 `voicecall call|continue|status|tail|expose` 的快速示例
---

# `openclaw voicecall`

`voicecall` 是插件提供的命令。仅当安装并启用语音呼叫插件时才会出现。

主要文档:
- 语音呼叫插件:[语音呼叫](/plugins/voice-call)

## 常用命令

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## 公开 webhook(Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall unexpose
```

安全注意事项:仅将 webhook 端点公开给您信任的网络。在可能的情况下,优先使用 Tailscale Serve 而不是 Funnel。
