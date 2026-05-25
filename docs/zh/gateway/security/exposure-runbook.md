---
mmh3_hash: "b8a3ef396654fd24f71b1e919287debe"
summary: "将 OpenClaw Gateway 暴露至回环地址以外之前的预检和回滚清单"
title: "Gateway 暴露 Runbook"
sidebarTitle: "暴露 Runbook"
read_when:
  - 通过 LAN、tailnet、Tailscale Serve、Funnel 或反向代理暴露 Gateway
  - 在允许真实消息用户之前审查部署
  - 回滚存在风险的远程访问或 DM 配置
---

<Warning>
仅在能够清晰说明谁可以访问、如何进行身份验证、哪些 Agent 可以被触发以及这些 Agent 可以使用哪些工具之后，才暴露 Gateway。如有疑问，请恢复到仅限回环的访问并重新运行审计。
</Warning>

本 Runbook 将更广泛的 [Security](/gateway/security) 指南转化为远程访问和消息暴露的运营商清单。

## 选择暴露模式

优先选择满足工作流要求的最窄模式。

| 模式                      | 适用场景                                    | 必要控制                                                                                          |
| ------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 回环 + SSH 隧道           | 个人使用、管理员访问、调试                  | 保持 `gateway.bind: "loopback"` 并隧道 `127.0.0.1:18789`                                          |
| 回环 + Tailscale Serve    | 通过个人 tailnet 访问 Control UI/WebSocket  | 保持 Gateway 仅限回环；仅对支持的接口依赖 Tailscale 身份标头                                      |
| Tailnet/LAN 绑定          | 具有已知设备的专用私有网络                  | Gateway Auth、防火墙白名单、无公开端口转发                                                        |
| 受信任反向代理            | 组织 SSO/OIDC 前置于 Gateway                | `trusted-proxy` Auth、严格的 `trustedProxies`、标头覆盖/剥离规则、明确的允许用户列表             |
| 公共互联网                | 罕见、高风险部署                            | 身份感知代理、TLS、速率限制、严格白名单、沙箱化的非主会话                                         |

避免直接将公共端口转发到 Gateway。如果需要公共访问，请在前置身份感知代理，并使代理成为通往 Gateway 的唯一网络路径。

## 预检清单

在更改绑定、代理、Tailscale 或 Channel 策略之前记录以下内容：

- Gateway 主机、OS 用户和状态目录。
- Gateway URL 和绑定模式。
- Auth 模式、令牌/密码来源或受信任代理身份来源。
- 所有已启用的 Channel 及其是否接受 DM、群组或 Webhook。
- 非本地发送方可访问的 Agent。
- 每个可访问 Agent 的工具 Profile、沙箱模式和高权限工具策略。
- 这些 Agent 可用的外部凭证。
- `~/.openclaw/openclaw.json` 和凭证的备份位置。

如果多人可以向机器人发送消息，请将其视为共享的委托工具权限，而非每用户主机隔离。

## 基线检查

在开放访问之前运行以下命令：

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

首先解决严重问题。仅当警告是有意为之且已为部署记录在案时，才可接受。

对于远程 CLI 验证，请显式传递凭证：

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

不要假设本地配置凭证适用于显式远程 URL。

## 最低安全基线

使用以下配置作为暴露部署的起点：

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

然后逐一放宽控制。例如，在启用具有写入能力的工具之前先添加特定 Channel 白名单，或在接受远程 Control UI 流量之前启用反向代理。

严格的 `exec.security: "deny"` 基线会阻止所有 exec 调用，包括无害的诊断。如果需要诊断或低风险命令，仅在选定特定发送方、Agent、命令和审批模式以匹配威胁模型后才放宽此限制。

## DM 和群组暴露

消息 Channel 是不受信任的输入接口。在允许 DM 或群组之前：

- 优先使用 `dmPolicy: "pairing"` 或严格的 `allowFrom` 列表。
- 除非每个发送方都受信任，否则避免 `dmPolicy: "open"`。
- 不要将 `"*"` 白名单与广泛的工具访问组合使用。
- 除非群组受到严格控制，否则在群组中要求 @提及。
- 当多人可以向机器人发送 DM 时，使用 `session.dmScope: "per-channel-peer"`。
- 将共享 Channel 路由到具有最少工具且无个人凭证的 Agent。

配对操作批准发送方触发机器人。它不会使该发送方成为独立的主机安全边界。

## 反向代理检查

对于身份感知代理：

- 代理必须在转发到 Gateway 之前对用户进行身份验证。
- 对 Gateway 端口的直接访问必须由防火墙或网络策略阻止。
- `gateway.trustedProxies` 必须仅包含代理源 IP。
- 代理必须剥离或覆盖客户端提供的身份和转发标头。
- 当代理服务于多个受众时，`gateway.auth.trustedProxy.allowUsers` 应列出预期用户。
- 当本地进程受信任且代理拥有身份标头时，同主机回环代理模式才应使用 `allowLoopback`。

代理更改后运行 `openclaw security audit --deep`。受信任代理的发现结果故意设置为高信号，因为代理成为身份验证边界。

## 工具和沙箱审查

在将 Agent 暴露给远程发送方之前：

- 确认哪些会话在主机上运行，哪些在沙箱中运行。
- 拒绝或要求审批主机 exec。
- 除非特定的受信任发送方需要，否则禁用高权限工具。
- 对于开放或半开放的消息接口，避免使用 browser、canvas、node、cron、gateway 和 session-spawn 工具。
- 保持绑定挂载范围窄，避免凭证、home 目录、Docker socket 和系统路径。
- 对于本质上不同的信任边界，使用独立的 Gateway、OS 用户或主机。

如果远程用户不完全受信任，隔离必须来自独立部署，而不仅仅依赖于提示或会话标签。

## 变更后验证

每次暴露变更后：

1. 重新运行 `openclaw security audit --deep`。
2. 测试成功的授权连接。
3. 测试未授权发送方或浏览器会话被拒绝。
4. 确认日志中密钥已被脱敏。
5. 确认 DM/群组路由仅到达预期的 Agent。
6. 确认高影响工具要求审批或被拒绝。
7. 记录已接受的残余警告。

在理解当前变更之前，不要进行下一个暴露变更。

## 回滚计划

如果 Gateway 可能过度暴露：

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

然后：

1. 停止公共转发、Tailscale Funnel 或反向代理路由。
2. 轮换 Gateway 令牌/密码和受影响的集成凭证。
3. 从白名单中删除 `"*"` 和意外发送方。
4. 审查近期审计日志、运行历史、工具调用和配置变更。
5. 重新运行 `openclaw security audit --deep`。
6. 使用满足工作流要求的最窄模式重新启用访问。

## 审查清单

- 除非有文档记录的原因，Gateway 保持仅限回环。
- 非回环访问具有 Auth、防火墙和无公开直接路由。
- Trusted-proxy 部署具有严格的代理 IP 和标头控制。
- DM 默认使用配对或白名单，而非开放访问。
- 群组要求 @提及或明确白名单。
- 共享 Channel 不访问个人凭证。
- 非主会话在沙箱模式下运行。
- 主机 exec 和高权限工具被拒绝或需要审批。
- 日志中密钥已被脱敏。
- 严重审计问题已解决。
- 回滚步骤已测试并记录在案。
