---
mmh3_hash: "479ac1d61be508ffb06ab5f02a1b4884"
summary: "如何通过操作者管理的过滤代理路由 OpenClaw 运行时 HTTP 和 WebSocket 流量"
title: "网络代理"
read_when:
  - 你想针对 SSRF 和 DNS 重绑定攻击进行纵深防御时
  - 为 OpenClaw 运行时流量配置外部转发代理时
---

OpenClaw 可以通过操作者管理的转发代理路由运行时 HTTP 和 WebSocket 流量。这是一种可选的纵深防御措施，适用于希望集中出口控制、更强 SSRF 保护和更好网络可审计性的部署。

OpenClaw 不提供、下载、启动、配置或认证代理。你运行适合你环境的代理技术，OpenClaw 通过它路由正常的进程本地 HTTP 和 WebSocket 客户端。

## 为什么使用代理

代理为运营商提供了一个出站 HTTP 和 WebSocket 流量的网络控制点。即使在 SSRF 加固之外，这也很有用：

- 集中策略：维护一个出口策略，而不是依赖每个应用程序 HTTP 调用点来正确实施网络规则。
- 连接时检查：在 DNS 解析后和代理打开上游连接前立即评估目标。
- DNS 重绑定防御：减少应用层 DNS 检查和实际出站连接之间的时间差。
- 更广泛的 JavaScript 覆盖：通过相同路径路由普通的 `fetch`、`node:http`、`node:https`、WebSocket、axios、got、node-fetch 和类似客户端。
- 可审计性：在出口边界记录允许和拒绝的目标。
- 操作控制：在不重建 OpenClaw 的情况下执行目标规则、网络分段、速率限制或出站允许列表。

代理路由是正常 HTTP 和 WebSocket 出口的进程级防护。它为通过操作者自己的过滤代理路由支持的 JavaScript HTTP 客户端提供了一个失败关闭路径，但它不是操作系统级网络沙盒，也不使 OpenClaw 认证代理的目标策略。

## OpenClaw 如何路由流量

当 `proxy.enabled=true` 且配置了代理 URL 时，受保护的运行时进程（如 `openclaw gateway run`、`openclaw node run` 和 `openclaw agent --local`）通过配置的代理路由正常的 HTTP 和 WebSocket 出口：

```text
OpenClaw 进程
  fetch                  -> 操作者管理的过滤代理 -> 公共互联网
  node:http 和 https    -> 操作者管理的过滤代理 -> 公共互联网
  WebSocket 客户端      -> 操作者管理的过滤代理 -> 公共互联网
```

公共合约是路由行为，而不是用于实现它的内部 Node hooks。当 Gateway URL 使用 `localhost` 或 `127.0.0.1` 或 `[::1]` 等字面回环 IP 时，OpenClaw Gateway 控制平面 WebSocket 客户端对本地回环 Gateway RPC 流量使用窄直接路径。该控制平面路径必须能够在操作者代理封锁回环目标时也能到达回环 Gateway。正常的运行时 HTTP 和 WebSocket 请求仍使用配置的代理。

OpenClaw 内部安装 Proxyline 作为此功能的进程级路由运行时。Proxyline 涵盖 `fetch`、undici 支持的客户端、Node 核心 `node:http` / `node:https` 调用方、常见 WebSocket 客户端以及辅助器创建的 CONNECT 隧道。托管代理模式替换调用方提供的 Node HTTP Agent，使显式 Agent 不会意外绕过操作者代理。

某些插件拥有自定义传输，即使存在进程级路由也需要显式代理配置。例如，Telegram 的 Bot API 传输使用自己的 HTTP/1 undici 调度器，因此在该所有者特定传输路径中遵守进程代理环境加托管的 `OPENCLAW_PROXY_URL` 后备。

代理 URL 本身可以使用 `http://` 或 `https://`。这些方案描述了 OpenClaw 到代理端点的连接：

- `http://proxy.example:3128`：OpenClaw 向转发代理打开普通 TCP 连接并发送 HTTP 代理请求，包括 HTTPS 目标的 `CONNECT`。
- `https://proxy.example:8443`：OpenClaw 向代理端点打开 TLS 连接，验证代理证书，然后在该 TLS 会话内发送 HTTP 代理请求。

目标 HTTPS 与代理端点 TLS 是独立的。对于 HTTPS 目标，OpenClaw 仍然向代理请求 HTTP `CONNECT` 隧道，然后通过该隧道启动目标 TLS。

当代理处于活跃状态时，OpenClaw 清除 `no_proxy` 和 `NO_PROXY`。这些绕过列表是基于目标的，因此将 `localhost` 或 `127.0.0.1` 留在那里会让高风险的 SSRF 目标跳过过滤代理。

关机时，OpenClaw 恢复之前的代理环境并重置缓存的进程路由状态。

## 相关代理术语

- `proxy.enabled` / `proxy.proxyUrl`：OpenClaw 运行时出口的出站转发代理路由。本页记录该功能。
- `gateway.auth.mode: "trusted-proxy"`：Gateway 访问的入站身份感知反向代理认证。参见[受信任代理认证](/gateway/trusted-proxy-auth)。
- `openclaw proxy`：用于开发和支持的本地调试代理和捕获检查器。参见 [openclaw proxy](/cli/proxy)。
- `tools.web.fetch.useTrustedEnvProxy`：让 `web_fetch` 选择性地允许操作者控制的 HTTP(S) 环境代理解析 DNS，同时保持默认的严格 DNS 固定和主机名策略。参见 [Web fetch](/tools/web-fetch#trusted-env-proxy)。
- Channel 或 Provider 特定代理设置：特定传输的所有者特定覆盖。当目标是跨运行时集中出口控制时，优先使用托管网络代理。

## 配置

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

对于使用私有代理 CA 的 HTTPS 代理端点：

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

你也可以通过环境提供 URL，同时在配置中保持 `proxy.enabled=true`：

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` 优先于 `OPENCLAW_PROXY_URL`。

### Gateway 回环模式

本地 Gateway 控制平面客户端通常连接到回环 WebSocket，如 `ws://127.0.0.1:18789`。使用 `proxy.loopbackMode` 选择当托管代理处于活跃状态时该流量的行为：

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only、proxy 或 block
```

- `gateway-only`（默认）：OpenClaw 在 Proxyline 的托管绕过策略中注册 Gateway 回环权限，使本地 Gateway WebSocket 流量可以直接连接。自定义回环 Gateway 端口有效，因为活跃 Gateway URL 的主机和端口已注册。捆绑的 browser Plugin 也可为 OpenClaw 启动的托管浏览器注册精确的本地 CDP 就绪和 DevTools WebSocket 端点，捆绑的 Ollama 内存嵌入 Provider 可以为配置的主机本地回环嵌入来源使用自己更窄的受保护直接路径。
- `proxy`：OpenClaw 不注册 Gateway 或 Ollama 回环绕过，因此本地 Gateway 流量通过托管代理发送。如果代理是远程的，它必须为 OpenClaw 主机的回环服务提供特殊路由，例如将其映射到代理可达的主机名、IP 或隧道。标准远程代理从代理主机解析 `127.0.0.1` 和 `localhost`，而不是从 OpenClaw 主机解析。
- `block`：OpenClaw 在打开套接字之前拒绝回环 Gateway 控制平面连接和受保护的 Ollama 主机本地嵌入回环连接。

如果 `enabled=true` 但未配置有效的代理 URL，受保护的命令会在启动时失败，而不是回退到直接网络访问。

对于使用 `openclaw gateway start` 启动的托管 Gateway 服务，优先将 URL 存储在配置中：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

环境后备最适合前台运行。如果你将其与已安装的服务一起使用，请将 `OPENCLAW_PROXY_URL` 放在服务持久环境中，例如 `$OPENCLAW_STATE_DIR/.env` 或 `~/.openclaw/.env`，然后重新安装服务，使 launchd、systemd 或计划任务以该值启动 Gateway。

对于 `openclaw --container ...` 命令，当设置了 `OPENCLAW_PROXY_URL` 时，OpenClaw 将其转发到容器目标的子 CLI。URL 必须可以从容器内部到达；`127.0.0.1` 指的是容器本身，而不是主机。OpenClaw 拒绝容器目标命令的回环代理 URL，除非你明确覆盖该安全检查。

## 代理要求

代理策略是安全边界。OpenClaw 无法验证代理是否阻止了正确的目标。

将代理配置为：

- 仅绑定到回环或私有可信接口。
- 限制访问，使只有 OpenClaw 进程、主机、容器或服务账号可以使用它。
- 自行解析目标并在 DNS 解析后阻止目标 IP。
- 在连接时对普通 HTTP 请求和 HTTPS `CONNECT` 隧道都应用策略。
- 拒绝回环、私有、链路本地、元数据、多播、保留或文档范围的基于目标的绕过。
- 避免主机名允许列表，除非你完全信任 DNS 解析路径。
- 记录目标、决定、状态和原因，而不记录请求体、授权头、cookie 或其他机密。
- 将代理策略置于版本控制下，并像安全敏感配置一样审查变更。

## 推荐封锁目标

将此拒绝列表作为任何转发代理、防火墙或出口策略的起点。

OpenClaw 应用层分类逻辑位于 `src/infra/net/ssrf.ts` 和 `src/shared/net/ip.ts`。相关的奇偶性 hooks 是 `BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、`RFC2544_BENCHMARK_PREFIX` 以及 NAT64、6to4、Teredo、ISATAP 和 IPv4 映射形式的嵌入式 IPv4 哨兵处理。在维护外部代理策略时，这些文件是有用的参考，但 OpenClaw 不会自动将这些规则导出或强制执行到你的代理中。

| 范围或主机                                                                           | 封锁原因                                         |
| ------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `127.0.0.0/8`、`localhost`、`localhost.localdomain`                                  | IPv4 回环                                        |
| `::1/128`                                                                            | IPv6 回环                                        |
| `0.0.0.0/8`、`::/128`                                                                | 未指定和本网络地址                               |
| `10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`                                      | RFC1918 私有网络                                 |
| `169.254.0.0/16`、`fe80::/10`                                                        | 链路本地地址和常见云元数据路径                   |
| `169.254.169.254`、`metadata.google.internal`                                        | 云元数据服务                                     |
| `100.64.0.0/10`                                                                      | 运营商级 NAT 共享地址空间                        |
| `198.18.0.0/15`、`2001:2::/48`                                                       | 基准测试范围                                     |
| `192.0.0.0/24`、`192.0.2.0/24`、`198.51.100.0/24`、`203.0.113.0/24`、`2001:db8::/32` | 特殊用途和文档范围                               |
| `224.0.0.0/4`、`ff00::/8`                                                            | 多播                                             |
| `240.0.0.0/4`                                                                        | 保留的 IPv4                                      |
| `fc00::/7`、`fec0::/10`                                                              | IPv6 本地/私有范围                               |
| `100::/64`、`2001:20::/28`                                                           | IPv6 丢弃和 ORCHIDv2 范围                        |
| `64:ff9b::/96`、`64:ff9b:1::/48`                                                     | 带有嵌入 IPv4 的 NAT64 前缀                      |
| `2002::/16`、`2001::/32`                                                             | 带有嵌入 IPv4 的 6to4 和 Teredo                  |
| `::/96`、`::ffff:0:0/96`                                                             | IPv4 兼容和 IPv4 映射 IPv6                       |

如果你的云 Provider 或网络平台记录了额外的元数据主机或保留范围，也要将其添加进去。

## 验证

从运行 OpenClaw 的同一主机、容器或服务账号验证代理：

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

对于由私有 CA 签名的 HTTPS 代理端点：

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

默认情况下，当没有提供自定义目标时，该命令检查 `https://example.com/` 是否成功，并启动一个代理不能到达的临时回环金丝雀。当代理返回非 2xx 拒绝响应或使用传输失败阻止金丝雀时，默认拒绝检查通过；如果成功响应到达金丝雀则失败。如果没有启用和配置代理，验证会报告配置问题；在更改配置之前，使用 `--proxy-url` 进行一次性预检。使用 `--allowed-url` 和 `--denied-url` 测试特定于部署的预期。添加 `--apns-reachable` 还可以验证直接 APNs HTTP/2 交付是否可以通过代理打开 CONNECT 隧道并接收沙盒 APNs 响应；探测使用故意无效的 Provider Token，因此预期 `403 InvalidProviderToken` 并计为可达。自定义拒绝目标是失败关闭的：任何 HTTP 响应意味着目标可以通过代理到达，任何传输错误都报告为不确定，因为 OpenClaw 无法证明代理阻止了可达的来源。验证失败时，命令以代码 1 退出。

使用 `--json` 进行自动化。JSON 输出包含总体结果、有效代理配置来源、任何配置错误以及每个目标检查。代理 URL 凭证在文本和 JSON 输出中被脱敏：

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
    }
  ]
}
```

你也可以使用 `curl` 手动验证：

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

公共请求应该成功。回环和元数据请求应该被代理阻止。对于 `openclaw proxy validate`，内置的回环金丝雀可以区分代理拒绝和可达来源。自定义 `--denied-url` 检查没有该金丝雀，因此将 HTTP 响应和不明确的传输失败都视为验证失败，除非你的代理公开了你可以单独验证的特定于部署的拒绝信号。

## 代理 CA 信任

当代理端点本身使用私有 CA 签名的证书时，请使用托管的 `proxy.tls.caFile`：

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

该 CA 用于代理端点的 TLS 验证。它不是目标 MITM 信任设置、客户端证书，也不是代理目标策略的替代。

仅当整个 Node 进程必须从进程启动起信任额外 CA 时（例如企业 TLS 检查系统对进程中每个 HTTPS 客户端重新签署目标证书），才使用 `NODE_EXTRA_CA_CERTS`。`NODE_EXTRA_CA_CERTS` 是进程全局的，必须在 Node 启动前存在。对于 HTTPS 代理端点信任，优先使用 `proxy.tls.caFile`，因为它的范围限定于托管代理路由。

然后启用 OpenClaw 代理路由：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

或设置：

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## 限制

- 代理改善了进程本地 JavaScript HTTP 和 WebSocket 客户端的覆盖，但它不是操作系统级网络沙盒。
- Gateway 回环控制平面流量默认通过 `proxy.loopbackMode: "gateway-only"` 直接本地绕过。OpenClaw 通过在 Proxyline 的托管绕过策略中注册活跃 Gateway 回环权限来实现该绕过。操作者可以设置 `proxy.loopbackMode: "proxy"` 通过托管代理发送 Gateway 回环流量，或设置 `proxy.loopbackMode: "block"` 拒绝回环 Gateway 连接。请参阅 [Gateway 回环模式](#gateway-loopback-mode) 了解远程代理注意事项。
- 原始的 `net`、`tls` 和 `http2` 套接字、本机插件以及非 OpenClaw 子进程可能绕过 Node 级代理路由，除非它们继承并遵守代理环境变量。分叉的 OpenClaw 子 CLI 继承托管代理 URL 和 `proxy.loopbackMode` 状态。
- IRC 是一个原始 TCP/TLS Channel，在操作者管理的转发代理路由之外。在要求所有出口通过该转发代理的部署中，除非直接 IRC 出口被明确批准，否则设置 `channels.irc.enabled=false`。
- 本地调试代理是诊断工具，当托管代理模式处于活跃状态时，代理请求和 CONNECT 隧道的直接上游转发默认禁用；仅对已批准的本地诊断启用直接转发。
- 用户本地 WebUI 和本地模型服务器在需要时应在操作者代理策略中允许列出；OpenClaw 不为它们公开通用的本地网络绕过。捆绑的 Ollama 内存嵌入 Provider 范围更窄：它仅对从配置的 `baseUrl` 派生的精确主机本地回环嵌入来源使用受保护的直接路径，以便当托管代理无法访问主机回环时主机本地嵌入仍然有效。LAN、tailnet、私有网络和公共 Ollama 嵌入主机仍然使用托管代理路径。`proxy.loopbackMode: "proxy"` 将此 Ollama 回环流量通过托管代理发送，`proxy.loopbackMode: "block"` 在打开连接之前拒绝它。
- Gateway 控制平面代理绕过有意限制为 `localhost` 和字面回环 IP URL。使用 `ws://127.0.0.1:18789`、`ws://[::1]:18789` 或 `ws://localhost:18789` 进行本地直接 Gateway 控制平面连接；其他主机名像普通的基于主机名的流量一样路由。
- OpenClaw 不检查、测试或认证你的代理策略。
- 将代理策略变更视为安全敏感的操作变更。

| 面                                                           | 托管代理状态                                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `fetch`、`node:http`、`node:https`、常见 WebSocket 客户端   | 配置后通过托管代理 hooks 路由。                                                                 |
| APNs 直接 HTTP/2                                             | 通过 APNs 托管 CONNECT 辅助器路由。                                                             |
| Gateway 控制平面回环                                         | 仅对已配置的本地回环 Gateway URL 直接。                                                         |
| 调试代理上游转发                                             | 托管代理模式处于活跃状态时禁用，除非明确为本地诊断启用。                                        |
| IRC                                                          | 原始 TCP/TLS；不通过托管 HTTP 代理模式代理。除非直接 IRC 出口被批准，否则禁用。                 |
| 其他原始 `net`、`tls` 或 `http2` 客户端调用                  | 必须在落地前由原始套接字守卫分类。                                                              |
