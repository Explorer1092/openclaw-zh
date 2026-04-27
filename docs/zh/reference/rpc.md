---
mmh3_hash: "6cf0232457ca60fb63a606fd982f30aa"
summary: "用于外部 CLI(signal-cli、imsg)和网关模式的 RPC 适配器"
read_when:
  - 添加或更改外部 CLI 集成
  - 调试 RPC 适配器(signal-cli、imsg)
title: "RPC 适配器"
---

# RPC 适配器

OpenClaw 通过 JSON-RPC 集成外部 CLI。今天使用两种模式。

## 模式 A:HTTP 守护程序(signal-cli)

- `signal-cli` 作为守护程序运行,通过 HTTP 进行 JSON-RPC。
- 事件流是 SSE(`/api/v1/events`)。
- 健康探测:`/api/v1/check`。
- 当 `channels.signal.autoStart=true` 时,OpenClaw 拥有生命周期。

有关设置和端点,请参见 [Signal](/channels/signal)。

## 模式 B:stdio 子进程（旧版：imsg）

> **注意：** 对于新的 iMessage 设置，请改用 [BlueBubbles](/channels/bluebubbles)。

- OpenClaw 将 `imsg rpc` 生成为子进程（旧版 iMessage 集成）。
- JSON-RPC 通过 stdin/stdout 进行行分隔（每行一个 JSON 对象）。
- 无 TCP 端口，无需守护程序。

使用的核心方法：

- `watch.subscribe` → 通知（`method: "message"`）
- `watch.unsubscribe`
- `send`
- `chats.list`（探测/诊断）

有关旧版设置和寻址（`chat_id` 首选），请参见 [iMessage](/channels/imessage)。

## 适配器指南

- 网关拥有进程（启动/停止与提供程序生命周期绑定）。
- 保持 RPC 客户端弹性：超时、退出时重启。
- 首选稳定 ID（例如 `chat_id`）而不是显示字符串。

## 相关

- [Gateway 协议](/gateway/protocol)
