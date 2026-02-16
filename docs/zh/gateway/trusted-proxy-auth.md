---
mmh3_hash: "cbb3a79e185c209b6f00a69d0de5469d"
summary: "将 Gateway 身份验证委托给受信任的反向代理（Pomerium、Caddy、nginx + OAuth）"
read_when:
  - 在身份感知代理后面运行 OpenClaw
  - 在 OpenClaw 前面设置 Pomerium、Caddy 或 nginx with OAuth
  - 修复反向代理设置的 WebSocket 1008 未授权错误
---

# 受信任代理身份验证

> ⚠️ **安全敏感功能。** 此模式将身份验证完全委托给您的反向代理。配置错误可能会使您的 Gateway 暴露于未经授权的访问。在启用之前请仔细阅读本页面。

## 何时使用

在以下情况下使用 `trusted-proxy` 身份验证模式：

- 您在**身份感知代理**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）后面运行 OpenClaw
- 您的代理处理所有身份验证并通过标头传递用户身份
- 您处于 Kubernetes 或容器环境中，其中代理是到达 Gateway 的唯一路径
- 您遇到 WebSocket `1008 unauthorized` 错误，因为浏览器无法在 WS 负载中传递令牌

## 何时不使用

- 如果您的代理不对用户进行身份验证（只是 TLS 终止器或负载均衡器）
- 如果有任何绕过代理的 Gateway 路径（防火墙漏洞、内部网络访问）
- 如果您不确定代理是否正确剥离/覆盖转发的标头
- 如果您只需要个人单用户访问（考虑 Tailscale Serve + 回环以获得更简单的设置）

## 工作原理

1. 您的反向代理对用户进行身份验证（OAuth、OIDC、SAML 等）
2. 代理添加带有经过身份验证的用户身份的标头（例如 `x-forwarded-user: nick@example.com`）
3. OpenClaw 检查请求是否来自**受信任的代理 IP**（在 `gateway.trustedProxies` 中配置）
4. OpenClaw 从配置的标头中提取用户身份
5. 如果一切正常，则请求被授权

## 配置

```json5
{
  gateway: {
    // 必须绑定到网络接口（不是回环）
    bind: "lan",

    // 关键：仅在此处添加您的代理 IP
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 包含经过身份验证的用户身份的标头（必需）
        userHeader: "x-forwarded-user",

        // 可选：必须存在的标头（代理验证）
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // 可选：限制为特定用户（空 = 允许所有）
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

### 配置参考

| 字段                                        | 必需 | 描述                                                             |
| ------------------------------------------- | ---- | ---------------------------------------------------------------- |
| `gateway.trustedProxies`                    | 是   | 要信任的代理 IP 地址数组。来自其他 IP 的请求将被拒绝。          |
| `gateway.auth.mode`                         | 是   | 必须为 `"trusted-proxy"`                                         |
| `gateway.auth.trustedProxy.userHeader`      | 是   | 包含经过身份验证的用户身份的标头名称                             |
| `gateway.auth.trustedProxy.requiredHeaders` | 否   | 请求被信任必须存在的其他标头                                     |
| `gateway.auth.trustedProxy.allowUsers`      | 否   | 用户身份白名单。空表示允许所有经过身份验证的用户。               |

## 代理设置示例

### Pomerium

Pomerium 在 `x-pomerium-claim-email`（或其他声明标头）和 `x-pomerium-jwt-assertion` 中的 JWT 中传递身份。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Pomerium 的 IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

Pomerium 配置片段：

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy with OAuth

Caddy 与 `caddy-security` 插件可以对用户进行身份验证并传递身份标头。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["127.0.0.1"], // Caddy 的 IP（如果在同一主机上）
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Caddyfile 片段：

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxy 对用户进行身份验证并在 `x-auth-request-email` 中传递身份。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

nginx 配置片段：

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik with Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // Traefik 容器 IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## 安全检查清单

在启用受信任代理身份验证之前，请验证：

- [ ] **代理是唯一路径**：Gateway 端口被防火墙阻止，除了您的代理之外的所有内容
- [ ] **trustedProxies 是最小的**：仅您的实际代理 IP，而不是整个子网
- [ ] **代理剥离标头**：您的代理覆盖（而不是追加）来自客户端的 `x-forwarded-*` 标头
- [ ] **TLS 终止**：您的代理处理 TLS；用户通过 HTTPS 连接
- [ ] **设置了 allowUsers**（推荐）：限制为已知用户，而不是允许任何经过身份验证的人

## 安全审计

`openclaw security audit` 将以**严重**严重性发现标记受信任代理身份验证。这是故意的 — 这是一个提醒，您正在将安全委托给您的代理设置。

审计检查：

- 缺少 `trustedProxies` 配置
- 缺少 `userHeader` 配置
- 空 `allowUsers`（允许任何经过身份验证的用户）

## 故障排除

### "trusted_proxy_untrusted_source"

请求不是来自 `gateway.trustedProxies` 中的 IP。检查：

- 代理 IP 是否正确？（Docker 容器 IP 可能会更改）
- 代理前面是否有负载均衡器？
- 使用 `docker inspect` 或 `kubectl get pods -o wide` 查找实际 IP

### "trusted_proxy_user_missing"

用户标头为空或缺失。检查：

- 您的代理是否配置为传递身份标头？
- 标头名称是否正确？（不区分大小写，但拼写很重要）
- 用户在代理处是否实际通过身份验证？

### "trusted_proxy_missing_header_*"

所需标头不存在。检查：

- 这些特定标头的代理配置
- 标头是否在链中的某个地方被剥离

### "trusted_proxy_user_not_allowed"

用户已通过身份验证但不在 `allowUsers` 中。添加它们或删除白名单。

### WebSocket 仍然失败

确保您的代理：

- 支持 WebSocket 升级（`Upgrade: websocket`、`Connection: upgrade`）
- 在 WebSocket 升级请求上传递身份标头（不仅仅是 HTTP）
- 没有用于 WebSocket 连接的单独身份验证路径

## 从令牌身份验证迁移

如果您从令牌身份验证转移到受信任代理：

1. 配置您的代理以对用户进行身份验证并传递标头
2. 独立测试代理设置（使用标头的 curl）
3. 使用受信任代理身份验证更新 OpenClaw 配置
4. 重启 Gateway
5. 从 Control UI 测试 WebSocket 连接
6. 运行 `openclaw security audit` 并查看发现

## 相关

- [安全](/gateway/security) — 完整安全指南
- [配置](/gateway/configuration) — 配置参考
- [远程访问](/gateway/remote) — 其他远程访问模式
- [Tailscale](/gateway/tailscale) — 仅 tailnet 访问的更简单替代方案
