---
mmh3_hash: "26f6c2536820684deac59615b1aa1b03"
summary: "在 exe.dev（VM + HTTPS 代理）上运行 OpenClaw Gateway 以实现远程访问"
read_when:
  - 你想要便宜的永久在线 Linux 主机来运行 Gateway
  - 你想要无需运行自己的 VPS 即可远程访问控制 UI
title: "exe.dev"
---

目标：在 exe.dev VM 上运行 OpenClaw Gateway，可以通过以下地址从你的笔记本访问：`https://<vm-name>.exe.xyz`

本页面假设 exe.dev 的默认 **exeuntu** 镜像。如果你选择了不同的发行版，请相应地映射软件包。

## 初学者快速路径

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. 根据需要填写你的认证密钥/token
3. 点击 VM 旁边的"Agent"，等待 Shelley 完成配置
4. 打开 `https://<vm-name>.exe.xyz/` 并使用配置的共享密钥进行认证（本指南默认使用 token 认证，但如果你切换了 `gateway.auth.mode`，密码认证也可以）
5. 用 `openclaw devices approve <requestId>` 批准任何待处理的设备配对请求

## 你需要什么

- exe.dev 帐户
- 对 [exe.dev](https://exe.dev) 虚拟机的 `ssh exe.dev` 访问权限（可选）

## 使用 Shelley 自动安装

[exe.dev](https://exe.dev) 的 agent Shelley 可以使用我们的提示词即时安装 OpenClaw。使用的提示词如下：

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 手动安装

## 1) 创建 VM

从你的设备：

```bash
ssh exe.dev new
```

然后连接：

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
保持此 VM **有状态**。OpenClaw 将 `openclaw.json`、每个 agent 的 `auth-profiles.json`、sessions 和 channel/provider 状态存储在 `~/.openclaw/` 下，工作区存储在 `~/.openclaw/workspace/` 下。
</Tip>

## 2) 安装前提条件（在 VM 上）

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) 安装 OpenClaw

运行 OpenClaw 安装脚本：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) 设置 nginx 将 OpenClaw 代理到端口 8000

编辑 `/etc/nginx/sites-enabled/default`，内容如下：

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 标准代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 长期连接的超时设置
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

覆盖转发头而不是保留客户端提供的链。
OpenClaw 仅信任来自明确配置代理的转发 IP 元数据，
追加样式的 `X-Forwarded-For` 链被视为加固风险。

## 5) 访问 OpenClaw 并授予权限

访问 `https://<vm-name>.exe.xyz/`（参见入门引导的控制 UI 输出）。如果提示认证，粘贴来自 VM 的配置共享密钥。本指南使用 token 认证，因此用 `openclaw config get gateway.auth.token` 检索 `gateway.auth.token`（或用 `openclaw doctor --generate-gateway-token` 生成一个）。
如果你将 gateway 更改为密码认证，请使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`。
用 `openclaw devices list` 和 `openclaw devices approve <requestId>` 批准设备。遇到问题时，使用浏览器中的 Shelley！

## 远程访问

远程访问由 [exe.dev](https://exe.dev) 的认证处理。默认情况下，来自端口 8000 的 HTTP 流量通过邮件认证转发到 `https://<vm-name>.exe.xyz`。

## 更新

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

指南：[更新](/install/updating)

## 相关

- [远程 gateway](/gateway/remote)
- [安装概览](/install)
