---
mmh3_hash: "223af18ec69f1a1eeebfdd2e108c7394"
summary: "在 Upstash Box 上托管 OpenClaw，支持保活和 SSH 隧道访问"
read_when:
  - 将 OpenClaw 部署到 Upstash Box
  - 您希望通过 SSH 隧道访问 Dashboard 的 OpenClaw 托管 Linux 环境
title: "Upstash Box"
---

在 Upstash Box（一个支持保活生命周期的托管 Linux 环境）上运行持久化的 OpenClaw Gateway。

使用 SSH 隧道访问 Dashboard。不要将 Gateway 端口直接暴露到公共互联网。

## 前提条件

- Upstash 账户
- 开启保活的 Upstash Box
- 本地机器上的 SSH 客户端

## 创建 Box

在 Upstash Console 中创建一个保活 Box。记录 Box ID（例如 `right-flamingo-14486`）和您的 Box API Key。

Upstash 在以下地址维护其当前的 OpenClaw Box 使用指南：
[OpenClaw Setup](https://upstash.com/docs/box/guides/openclaw-setup)。

## 使用 SSH 隧道连接

将 OpenClaw Dashboard 端口转发到本地机器。当提示时，使用您的 Box API Key 作为 SSH 密码：

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

保活选项可减少引导过程中的空闲隧道断开。

## 安装 OpenClaw

在 Box 内部执行：

```bash
sudo npm install -g openclaw
```

## 运行引导程序

```bash
openclaw onboard --install-daemon
```

按照提示操作。引导完成后复制 Dashboard URL 和令牌。

## 启动 Gateway

为 Box 网络配置 Gateway 并在后台启动：

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

在 SSH 隧道激活的情况下，在本地打开 Dashboard URL：

```text
http://127.0.0.1:18789/#token=<your-token>
```

## 自动重启

将以下命令设置为 Box 的初始化脚本，以便在 Box 启动时自动重启 Gateway：

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## 故障排除

如果在引导过程中 SSH 卡住，请使用干净的 SSH 配置和保活选项重新连接：

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

此命令会绕过过时的本地 `~/.ssh/config` 设置，并在空闲网络期间保持隧道活跃。

## 相关

- [远程访问](/gateway/remote)
- [Gateway 安全](/gateway/security)
- [更新 OpenClaw](/install/updating)
