---
mmh3_hash: "650364e9dd4b044b7209325a3302ce6b"
summary: "添加 WhatsApp Channel 界面，用于发送和接收 OpenClaw 消息。"
read_when:
  - 你正在安装、配置或审计 whatsapp Plugin
title: "WhatsApp Plugin"
---

# WhatsApp Plugin

添加 WhatsApp Channel 界面，用于发送和接收 OpenClaw 消息。

## 分发

- 包名：`@openclaw/whatsapp`
- 安装方式：npm；ClawHub

## 接口

channels: whatsapp

## Windows 安装说明

在 Windows 上，WhatsApp Plugin 在 npm 安装期间需要 `PATH` 中存在 Git，因为其 Baileys/libsignal 依赖项之一从 git URL 获取。请安装 Git for Windows，然后重启 shell 并重新运行安装：

```powershell
winget install --id Git.Git -e
```

如果便携版 Git 的 `bin` 目录在 `PATH` 中，也可使用便携版 Git。

## 相关文档

- [whatsapp](/channels/whatsapp)
