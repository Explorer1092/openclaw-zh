---
mmh3_hash: "eede3a737cfa840397f5c9c050ee05b7"
summary: "在 EasyRunner 上使用 Podman 和 Caddy 运行 OpenClaw Gateway"
read_when:
  - 在 EasyRunner 上部署 OpenClaw
  - 在 EasyRunner 的 Caddy 代理后运行 Gateway
  - 为托管 Gateway 选择持久化卷和 Auth 方案
title: "EasyRunner"
---

EasyRunner 可以在其 Caddy 代理后将 OpenClaw Gateway 作为小型容器化应用托管。本指南假设 EasyRunner 主机运行 Podman 兼容的 Compose 应用，并通过 Caddy 暴露 HTTPS。

## 开始之前

- 具有路由域名的 EasyRunner 服务器。
- 已构建或已发布的 OpenClaw 容器镜像。
- `/home/node/.openclaw` 的持久化配置卷。
- `/workspace` 的持久化工作区卷。
- 强 Gateway 令牌或密码。

尽可能启用设备 Auth。如果反向代理部署无法正确传递设备身份，请先修复 trusted-proxy 设置；仅在完全私有、运营商控制的网络中才使用危险 Auth 绕过。

## Compose 应用

使用以下形状的 Compose 文件创建 EasyRunner 应用：

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

将 `openclaw.example.com` 替换为您的 Gateway 主机名。将 `OPENCLAW_GATEWAY_TOKEN` 存储在 EasyRunner 的密钥/环境管理器中，而不是提交到应用定义中。

## 配置 OpenClaw

在持久化配置卷中，保持 Gateway 只能通过代理访问并要求 Auth：

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

如果 Caddy 为 Gateway 终止 TLS，请为确切的代理路径配置 trusted proxy 设置，而不是全局禁用 Auth 检查。参见 [Trusted proxy auth](/gateway/trusted-proxy-auth)。

## 验证

从工作站执行：

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

从 EasyRunner 主机检查应用日志，确认 Gateway 正在监听，且没有启动时的 SecretRef、Plugin 或 Channel Auth 失败。

## 更新和备份

- 拉取或构建新的 OpenClaw 镜像，然后重新部署 EasyRunner 应用。
- 在更新前备份 `openclaw-config` 卷。
- 如果 Agent 在工作区写入持久化项目数据，请备份 `openclaw-workspace`。
- 重大更新后运行 `openclaw doctor` 以发现配置迁移和服务警告。

## 故障排除

- `gateway probe` 无法连接：确认 Caddy 主机名指向应用，且容器监听在 `0.0.0.0:1455`。
- Auth 失败：同时轮换 EasyRunner 密钥中的令牌和本地客户端命令中的令牌。
- 恢复后文件归 root 所有：修复挂载卷，使容器用户可以写入 `/home/node/.openclaw` 和 `/workspace`。
- Browser 或 Channel Plugin 失败：检查容器内是否有所需的外部二进制文件、网络出口和挂载的凭证。
