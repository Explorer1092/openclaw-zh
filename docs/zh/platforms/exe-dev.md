---
title: "exe.dev"
sidebarTitle: "exe.dev"
mmh3_hash: "0abf84258b75824f5e0cea569cda3982"
summary: "在 exe.dev 上运行 OpenClaw 网关(VM + HTTPS 代理)以实现远程访问"
read_when:
  - 你想要一个廉价的始终在线的 Linux 主机用于网关
  - 你想要远程控制 UI 访问而不运行自己的 VPS
---

# exe.dev

目标:OpenClaw 网关在 exe.dev VM 上运行,可从你的笔记本电脑通过 `https://<vm-name>.exe.xyz` 访问

本页假设使用 exe.dev 的默认 **exeuntu** 镜像。如果你选择了不同的发行版,请相应地映射包。

## 初学者快速路径

1) [https://exe.new/openclaw](https://exe.new/openclaw)
2) 根据需要填写你的认证密钥/令牌
3) 点击 VM 旁边的"Agent",然后等待...
4) ???
5) 获利

## 你需要什么

- exe.dev 账户
- 访问 [exe.dev](https://exe.dev) 虚拟机的 `ssh exe.dev` 访问权限(可选)


## 使用 Shelley 自动安装

Shelley 是 [exe.dev](https://exe.dev) 的代理,可以使用我们的提示立即安装 OpenClaw。使用的提示如下:

```
在此 VM 上设置 OpenClaw(https://docs.openclaw.ai/install)。使用 openclaw onboarding 的非交互式和接受风险标志。根据需要添加提供的认证或令牌。配置 nginx 从默认端口 18789 转发到默认启用站点配置的根位置,确保启用 Websocket 支持。配对通过 "openclaw devices list" 和 "openclaw device approve <request id>" 完成。确保仪表板显示 OpenClaw 的健康状态为 OK。exe.dev 为我们处理从端口 8000 到端口 80/443 的转发和 HTTPS,因此最终的"可访问"应该是 <vm-name>.exe.xyz,无需端口规范。
```

## 手动安装

## 1) 创建 VM

从你的设备:

```bash
ssh exe.dev new 
```

然后连接:

```bash
ssh <vm-name>.exe.xyz
```

提示:保持此 VM **有状态**。OpenClaw 将状态存储在 `~/.openclaw/` 和 `~/.openclaw/workspace/` 下。

## 2) 安装前置条件(在 VM 上)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) 安装 OpenClaw

运行 OpenClaw 安装脚本:

```bash
curl -fsSL https://openclaw.bot/install.sh | bash
```

## 4) 设置 nginx 代理 OpenClaw 到端口 8000

编辑 `/etc/nginx/sites-enabled/default`:

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

        # 标准代理标头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 长连接的超时设置
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

## 5) 访问 OpenClaw 并授予权限

访问 `https://<vm-name>.exe.xyz/?token=YOUR-TOKEN-FROM-TERMINAL`。使用 `openclaw devices list` 和 `openclaw device approve` 批准设备。有疑问时,从浏览器使用 Shelley!

## 远程访问

远程访问由 [exe.dev](https://exe.dev) 的认证处理。默认情况下,来自端口 8000 的 HTTP 流量通过电子邮件认证转发到 `https://<vm-name>.exe.xyz`。

## 更新

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

指南:[更新](/install/updating)
