---
mmh3_hash: "f384fae582061a2fcd25796ea57e7152"
summary: "Zalo Personal Plugin: 通过 zca-cli 的 QR 登录 + 消息(Plugin 安装 + channel 配置 + CLI + Tool)"
read_when:
  - 您想要 OpenClaw 中的 Zalo Personal(非官方)支持
  - 您正在配置或开发 zalouser Plugin
title: "Zalo Personal Plugin"
---

# Zalo Personal(Plugin)

通过 Plugin 为 OpenClaw 提供 Zalo Personal 支持,使用 `zca-cli` 自动化正常的 Zalo 用户帐户。

> **警告:** 非官方自动化可能导致帐户暂停/封禁。使用风险自负。

## 命名

Channel id 为 `zalouser`,以明确表明这会自动化**个人 Zalo 用户帐户**(非官方)。我们保留 `zalo` 用于将来可能的官方 Zalo API 集成。

## 它在哪里运行

此 Plugin 在 **Gateway 进程内**运行。

如果您使用远程 Gateway,请在**运行 Gateway 的机器**上安装/配置它,然后重启 Gateway。

## 安装

### 选项 A: 从 npm 安装

```bash
openclaw plugins install @openclaw/zalouser
```

之后重启 Gateway。

### 选项 B: 从本地文件夹安装(开发)

```bash
openclaw plugins install ./extensions/zalouser
cd ./extensions/zalouser && pnpm install
```

之后重启 Gateway。

## 先决条件: zca-cli

Gateway 机器必须在 `PATH` 上有 `zca`:

```bash
zca --version
```

## 配置

Channel 配置位于 `channels.zalouser` 下(不是 `plugins.entries.*`):

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

## Agent Tool

Tool 名称: `zalouser`

操作: `send`、`image`、`link`、`friends`、`groups`、`me`、`status`
