---
mmh3_hash: "4c4a1783f8876b3adb3162ad5f5272f1"
title: Zalo Personal 插件
summary: Zalo Personal 插件：通过原生 zca-js 实现 QR 登录和消息发送（插件安装 + Channel 配置 + 工具）
read_when:
  - 你想在 OpenClaw 中使用 Zalo Personal（非官方）支持
  - 你正在配置或开发 zalouser 插件
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: plugins/zalouser.md
  workflow: 15
---

# Zalo Personal（插件）

通过插件为 OpenClaw 提供 Zalo Personal 支持，使用原生 `zca-js` 自动化普通 Zalo 用户账号。

> **警告：** 非官方自动化可能导致账号被暂停/封禁。使用风险自担。

## 命名说明

Channel id 为 `zalouser`，明确表示这是在自动化 **Zalo 个人用户账号**（非官方）。我们保留 `zalo` 以供未来可能的官方 Zalo API 集成使用。

## 运行位置

此插件运行在 **Gateway 进程内部**。

如果你使用远程 Gateway，在**运行 Gateway 的机器**上安装和配置它，然后重启 Gateway。

无需外部 `zca`/`openzca` CLI 二进制文件。

## 安装

### 选项 A：从 npm 安装

```bash
openclaw plugins install @openclaw/zalouser
```

安装后重启 Gateway。

### 选项 B：从本地文件夹安装（开发）

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

安装后重启 Gateway。

## 配置

Channel 配置位于 `channels.zalouser` 下（不是 `plugins.entries.*`）：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Agent 工具

工具名称：`zalouser`

动作：`send`、`image`、`link`、`friends`、`groups`、`me`、`status`

Channel 消息动作还支持 `react`（消息反应）。
