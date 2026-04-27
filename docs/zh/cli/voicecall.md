---
title: "`openclaw voicecall`"
sidebarTitle: "openclaw voicecall"
mmh3_hash: "6ddfce743bbce141be737def34711c33"
summary: "`openclaw voicecall` 的 CLI 参考(语音呼叫插件命令界面)"
read_when:
  - 您使用语音呼叫插件并想要 CLI 入口点
  - 您想要 `voicecall setup|smoke|call|continue|dtmf|status|tail|expose` 的快速示例
---

# `openclaw voicecall`

`voicecall` 是插件提供的命令。仅当安装并启用语音呼叫插件时才会出现。

主要文档:

- 语音呼叫插件:[语音呼叫](/plugins/voice-call)

## 常用命令

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` 默认打印人类可读的就绪检查。使用 `--json` 用于脚本:

```bash
openclaw voicecall setup --json
```

对于外部 Provider(`twilio`、`telnyx`、`plivo`),setup 必须从 `publicUrl`、隧道或 Tailscale 暴露中解析公开 webhook URL。回环/私有服务回退会被拒绝,因为运营商无法访问它。

`smoke` 运行相同的就绪检查。除非同时存在 `--to` 和 `--yes`,否则不会发起真实电话:

```bash
openclaw voicecall smoke --to "+15555550123"        # 模拟运行
openclaw voicecall smoke --to "+15555550123" --yes  # 实时通知呼叫
```

## 公开 webhook(Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

安全注意事项:仅将 webhook 端点公开给您信任的网络。在可能的情况下,优先使用 Tailscale Serve 而不是 Funnel。

## 相关

- [CLI 参考](/cli)
- [语音呼叫插件](/plugins/voice-call)
