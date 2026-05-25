---
mmh3_hash: "73ce960d77cd03598eb0db894dd7105c"
summary: "将 Gateway 身份验证委托给受信任的反向代理（Pomerium、Caddy、nginx + OAuth）"
read_when:
  - 在身份感知代理后面运行 OpenClaw
  - 在 OpenClaw 前面设置 Pomerium、Caddy 或 nginx with OAuth
  - 修复反向代理设置的 WebSocket 1008 未授权错误
  - 决定在哪里设置 HSTS 和其他 HTTP 强化标头
title: "Trusted proxy auth"
sidebarTitle: "Trusted proxy auth"
---

<Warning>
**安全敏感功能。** 此模式将身份验证完全委托给您的反向代理。配置错误可能会使您的 Gateway 暴露于未经授权的访问。在启用之前请仔细阅读本页面。
</Warning>

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

<Steps>
  <Step title="代理对用户进行身份验证">
    您的反向代理对用户进行身份验证（OAuth、OIDC、SAML 等）。
  </Step>
  <Step title="代理添加身份标头">
    代理添加带有经过身份验证的用户身份的标头（例如 `x-forwarded-user: nick@example.com`）。
  </Step>
  <Step title="Gateway 验证受信任来源">
    OpenClaw 检查请求是否来自**受信任的代理 IP**（在 `gateway.trustedProxies` 中配置）。
  </Step>
  <Step title="Gateway 提取身份">
    OpenClaw 从配置的标头中提取用户身份。
  </Step>
  <Step title="授权">
    如果一切正常，则请求被授权。
  </Step>
</Steps>

## Control UI 配对行为

当 `gateway.auth.mode = "trusted-proxy"` 处于活动状态且请求通过受信任代理检查时，Control UI WebSocket Session 无需设备配对身份即可连接。

含义：

- 在此模式下，配对不再是 Control UI 访问的主要门禁。
- 您的反向代理认证策略和 `allowUsers` 成为有效的访问控制。
- 仅将 Gateway 入口锁定到受信任的代理 IP（`gateway.trustedProxies` + 防火墙）。

**不带设备身份的范围清除：** 由于浏览器通过普通 HTTP 无法创建 OpenClaw 用于绑定 Operator 范围的设备身份，缺少设备身份的 trusted-proxy WebSocket 连接会将其自我声明的范围清除为空集。连接被允许，但受范围保护的方法（`operator.read`、`operator.write` 等）将以 `missing scope` 失败。

要在没有设备身份的 trusted-proxy WebSocket 连接上保留 Operator 范围，请设置 `gateway.controlUi.dangerouslyDisableDeviceAuth: true`。这是一个紧急方案标志（`openclaw security audit` 将其报告为严重问题）。仅在反向代理是唯一到达 Gateway 的路径且无法建立设备身份时使用。

## 配置

```json5
{
  gateway: {
    // Trusted-proxy 认证默认期望请求来自非回环受信任代理来源
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

        // 可选：显式启用同一主机回环代理后才允许
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**重要运行时规则**

- Trusted-proxy 认证默认拒绝回环源请求（`127.0.0.1`、`::1`、回环 CIDR）。
- 同一主机的回环反向代理**不**满足 trusted-proxy 认证，除非您显式设置 `gateway.auth.trustedProxy.allowLoopback = true` 并将回环地址包含在 `gateway.trustedProxies` 中。
- `allowLoopback` 将本地进程对 Gateway 主机的信任程度提升到与反向代理相同。仅在 Gateway 仍被防火墙阻止直接远程访问且本地代理剥离或覆盖客户端提供的身份标头时启用。
- 不通过反向代理的内部 Gateway 客户端应使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，而不是 trusted-proxy 身份标头。
- 非回环 Control UI 部署仍需要显式的 `gateway.controlUi.allowedOrigins`。
- **转发标头证据优先于本地直接回退的回环局部性。** 如果请求到达回环但携带 `Forwarded`、任何 `X-Forwarded-*` 或 `X-Real-IP` 标头证据，该证据会使本地直接密码回退和设备身份门控失效。使用 `allowLoopback: true`，trusted-proxy 认证仍然可以将请求作为同一主机代理请求接受，而 `requiredHeaders` 和 `allowUsers` 继续适用。

</Warning>

### 配置参考

<ParamField path="gateway.trustedProxies" type="string[]" required>
  要信任的代理 IP 地址数组。来自其他 IP 的请求将被拒绝。
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  必须为 `"trusted-proxy"`。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  包含经过身份验证的用户身份的标头名称。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  请求被信任必须存在的其他标头。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  用户身份白名单。空表示允许所有经过身份验证的用户。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  同一主机回环反向代理的显式启用支持。默认为 `false`。
</ParamField>

<Warning>
仅在本地反向代理是预期信任边界时才启用 `allowLoopback`。任何可以连接到 Gateway 的本地进程都可以尝试发送代理身份标头，因此保持 Gateway 直接访问对主机私有，并在代理支持时要求代理拥有的标头（如 `x-forwarded-proto` 或签名断言标头）。
</Warning>

## TLS 终止和 HSTS

使用一个 TLS 终止点并在那里应用 HSTS。

<Tabs>
  <Tab title="代理 TLS 终止（推荐）">
    当您的反向代理处理 `https://control.example.com` 的 HTTPS 时，在代理处为该域设置 `Strict-Transport-Security`。

    - 适合面向互联网的部署。
    - 将证书 + HTTP 强化策略保留在一处。
    - OpenClaw 可以在代理后面保持在 loopback HTTP 上。

    示例标头值：

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS 终止">
    如果 OpenClaw 本身直接提供 HTTPS（无 TLS 终止代理），请设置：

    ```json5
    {
      gateway: {
        tls: { enabled: true },
        http: {
          securityHeaders: {
            strictTransportSecurity: "max-age=31536000; includeSubDomains",
          },
        },
      },
    }
    ```

    `strictTransportSecurity` 接受字符串标头值，或 `false` 以显式禁用。

  </Tab>
</Tabs>

### 推出指南

- 从较短的 max age 开始（例如 `max-age=300`），同时验证流量。
- 仅在信心高时增加到长期值（例如 `max-age=31536000`）。
- 仅在每个子域都已准备好 HTTPS 时添加 `includeSubDomains`。
- 仅在您有意满足完整域集的预加载要求时使用预加载。
- 仅 loopback 的本地开发不受益于 HSTS。

## 代理设置示例

<AccordionGroup>
  <Accordion title="Pomerium">
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

  </Accordion>
  <Accordion title="Caddy with OAuth">
    Caddy 与 `caddy-security` 插件可以对用户进行身份验证并传递身份标头。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar 代理 IP
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

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
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

  </Accordion>
  <Accordion title="Traefik with forward auth">
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
  </Accordion>
</AccordionGroup>

## 混合令牌配置

OpenClaw 拒绝同时激活 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）和 `trusted-proxy` 模式的模糊配置。混合令牌配置可能导致回环请求在错误的认证路径上静默认证。

如果在启动时看到 `mixed_trusted_proxy_token` 错误：

- 使用 trusted-proxy 模式时删除共享令牌，或
- 如果您打算使用基于令牌的认证，请将 `gateway.auth.mode` 切换为 `"token"`。

回环 trusted-proxy 身份标头仍会失败关闭：同一主机的调用者不会被静默认证为代理用户。不通过代理的内部 OpenClaw 调用者可以使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 进行认证。在 trusted-proxy 模式下，令牌回退被故意不支持。

## Operator 范围头

Trusted-proxy 认证是**身份感知** HTTP 模式，因此调用者可以选择使用 `x-openclaw-scopes` 声明 Operator 范围。

注意：`x-openclaw-scopes` 仅适用于 HTTP 端点。WebSocket 范围由 Gateway 协议握手和设备身份绑定决定。关于 trusted-proxy 的 WebSocket 范围行为，参见 [Control UI 配对行为](#control-ui-配对行为)。

示例：

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

行为：

- 当头存在时，OpenClaw 遵循声明的范围集。
- 当头存在但为空时，请求声明**无** Operator 范围。
- 当头不存在时，正常的身份感知 HTTP API 回退到标准 Operator 默认范围集。
- Gateway 认证**插件 HTTP 路由**默认更窄：当 `x-openclaw-scopes` 不存在时，其运行时范围回退到 `operator.write`。
- 浏览器源 HTTP 请求在 trusted-proxy 认证成功后仍必须通过 `gateway.controlUi.allowedOrigins`（或刻意的 Host 头回退模式）。

实践规则：当您希望 trusted-proxy 请求比默认值更窄时，或当 Gateway 认证插件路由需要比写入范围更强的权限时，请明确发送 `x-openclaw-scopes`。

## 安全检查清单

在启用 trusted proxy 认证之前，请验证：

- [ ] **代理是唯一路径**：Gateway 端口被防火墙阻止，除了您的代理之外的所有内容。
- [ ] **trustedProxies 是最小的**：仅您的实际代理 IP，而不是整个子网。
- [ ] **回环代理来源是刻意的**：对于回环源请求，trusted-proxy 认证默认失败关闭，除非为同一主机代理显式启用了 `gateway.auth.trustedProxy.allowLoopback`。
- [ ] **代理剥离标头**：您的代理覆盖（而不是追加）来自客户端的 `x-forwarded-*` 标头。
- [ ] **TLS 终止**：您的代理处理 TLS；用户通过 HTTPS 连接。
- [ ] **allowedOrigins 是明确的**：非回环 Control UI 使用明确的 `gateway.controlUi.allowedOrigins`。
- [ ] **设置了 allowUsers**（推荐）：限制为已知用户，而不是允许任何经过身份验证的人。
- [ ] **无混合令牌配置**：不要同时设置 `gateway.auth.token` 和 `gateway.auth.mode: "trusted-proxy"`。
- [ ] **本地密码回退是私有的**：如果您为内部直接调用者配置了 `gateway.auth.password`，请保持 Gateway 端口被防火墙阻止，以便非代理远程客户端无法直接访问它。

## 安全审计

`openclaw security audit` 将以**严重**严重性发现标记 trusted proxy 认证。这是故意的——这是一个提醒，您正在将安全委托给您的代理设置。

审计检查：

- 基础 `gateway.trusted_proxy_auth` 警告/严重提醒
- 缺少 `trustedProxies` 配置
- 缺少 `userHeader` 配置
- 空 `allowUsers`（允许任何经过身份验证的用户）
- 为同一主机代理来源启用了 `allowLoopback`
- 暴露的 Control UI 接口上的通配符或缺少浏览器源策略

## 故障排除

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    请求不是来自 `gateway.trustedProxies` 中的 IP。检查：

    - 代理 IP 是否正确？（Docker 容器 IP 可能会更改）
    - 代理前面是否有负载均衡器？
    - 使用 `docker inspect` 或 `kubectl get pods -o wide` 查找实际 IP。

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw 拒绝了回环源的 trusted-proxy 请求。

    检查：

    - 代理是否从 `127.0.0.1` / `::1` 连接？
    - 您是否尝试在同一主机的回环反向代理中使用 trusted-proxy 认证？

    修复：

    - 对不通过代理的同一主机内部客户端优先使用 token/password 认证，或
    - 通过非回环受信任代理地址路由，并将该 IP 保留在 `gateway.trustedProxies` 中，或
    - 对于刻意的同一主机反向代理，设置 `gateway.auth.trustedProxy.allowLoopback = true`，将回环地址保留在 `gateway.trustedProxies` 中，并确保代理剥离或覆盖身份标头。

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    用户标头为空或缺失。检查：

    - 您的代理是否配置为传递身份标头？
    - 标头名称是否正确？（不区分大小写，但拼写很重要）
    - 用户在代理处是否实际通过身份验证？

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    所需标头不存在。检查：

    - 这些特定标头的代理配置。
    - 标头是否在链中的某个地方被剥离。

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    用户已通过身份验证但不在 `allowUsers` 中。添加他们或删除白名单。
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Trusted-proxy 认证成功，但浏览器 `Origin` 头未通过 Control UI 源检查。

    检查：

    - `gateway.controlUi.allowedOrigins` 包含确切的浏览器源。
    - 您不依赖通配符源，除非您有意想要允许所有行为。
    - 如果您有意使用 Host 头回退模式，请明确设置 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`。

  </Accordion>
  <Accordion title="连接成功但方法报告缺少范围">
    WebSocket 连接成功，但 `chat.history` 或 `sessions.list` 以 `missing scope: operator.read` 失败。

    这对于没有设备身份的 trusted-proxy WebSocket 连接是预期行为。缺少设备身份的连接其范围会被清除。浏览器无法通过普通 HTTP 生成设备身份。

    修复：

    - 设置 `gateway.controlUi.dangerouslyDisableDeviceAuth: true` 以在 trusted-proxy WebSocket 连接上保留 Operator 范围，或
    - 使用设备身份配对，使范围绑定到设备令牌。

  </Accordion>
  <Accordion title="WebSocket 仍然失败">
    确保您的代理：

    - 支持 WebSocket 升级（`Upgrade: websocket`、`Connection: upgrade`）。
    - 在 WebSocket 升级请求上传递身份标头（不仅仅是 HTTP）。
    - 没有用于 WebSocket 连接的单独身份验证路径。

  </Accordion>
</AccordionGroup>

## 从令牌身份验证迁移

如果您从令牌身份验证转移到 trusted proxy：

<Steps>
  <Step title="配置代理">
    配置您的代理以对用户进行身份验证并传递标头。
  </Step>
  <Step title="独立测试代理">
    独立测试代理设置（使用标头的 curl）。
  </Step>
  <Step title="更新 OpenClaw 配置">
    使用 trusted-proxy 认证更新 OpenClaw 配置。
  </Step>
  <Step title="重启 Gateway">
    重启 Gateway。
  </Step>
  <Step title="测试 WebSocket">
    从 Control UI 测试 WebSocket 连接。
  </Step>
  <Step title="审计">
    运行 `openclaw security audit` 并查看发现。
  </Step>
</Steps>

## 相关

- [配置](/gateway/configuration) — 配置参考
- [远程访问](/gateway/remote) — 其他远程访问模式
- [Security](/gateway/security) — 完整安全指南
- [Tailscale](/gateway/tailscale) — 仅 tailnet 访问的更简单替代方案
