---
mmh3_hash: "e47393d1e4785c18d47c2fab5c81200b"
summary: "让用户审批 Plugin 工具调用和 Plugin 拥有的权限提示"
title: "Plugin 权限请求"
sidebarTitle: "权限请求"
read_when:
  - 您需要 Plugin Hook 或工具在执行副作用之前请求确认
  - 您需要配置 Plugin 审批提示的投递位置
  - 您正在选择可选工具、exec 审批和 Plugin 审批之间的方案
---

Plugin 权限请求让 Plugin 代码在工具调用或 Plugin 拥有的操作执行前暂停，等待用户批准或拒绝。它们使用 Gateway 的 `plugin.approval.*` 流程，以及处理聊天审批按钮和 `/approve` 命令的相同审批 UI 接口。

Plugin 权限请求用于 Plugin/应用权限。它们不替代主机 exec 审批、可选工具白名单或 Codex 的原生权限审查。

## 选择正确的门控

选择与所需决策点相匹配的门控：

| 门控                              | 适用场景                                                       | 控制范围                                                                                                            |
| --------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 可选工具                          | 工具在用户主动启用之前不应对模型可见。                          | 通过 `tools.allow` 控制工具暴露。                                                                                    |
| Plugin 权限请求                   | Plugin Hook 或 Plugin 拥有的操作在每次执行前必须请求确认。     | 通过 `plugin.approval.*` 进行运行时审批。                                                                            |
| Exec 审批                         | 主机命令或类 shell 工具需要运营商批准。                        | 主机 exec 策略和持久化 exec 白名单。                                                                                 |
| Codex 原生权限请求                | Codex 在原生 shell、文件、MCP 或应用服务器操作之前请求确认。   | Codex 应用服务器或原生 Hook 审批处理；当 OpenClaw 拥有提示时通过 Plugin 审批路由。                                   |
| MCP 审批请求                      | Codex MCP 服务器为工具调用请求审批。                           | 通过 OpenClaw Plugin 审批桥接的 MCP 审批响应。                                                                       |

可选工具是发现时门控。Plugin 权限请求是每次调用门控。当敏感工具既需要显式启用（模型才能看到）又需要在操作运行前审批时，同时使用两者。

## 在工具调用之前请求审批

大多数 Plugin 编写的提示应从 `before_tool_call` Hook 开始。Hook 在模型选择工具之后、OpenClaw 执行之前运行：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "部署服务",
          description: `将服务部署到 ${environment}。`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`部署审批已解决：${decision}`);
          },
        },
      };
    });
  },
});
```

为将要审批操作的人编写提示文本：

- `title` 保持简短且以操作为中心。Gateway 接受最多 80 个字符。
- `description` 保持具体且有界。Gateway 接受最多 256 个字符。
- 包含操作、目标和风险。不要包含不应出现在聊天审批接口中的密钥、令牌或私有载荷。
- 仅对错误决策可能造成生产损坏或数据丢失的操作使用 `severity: "critical"`。
- 当持久信任对该操作不安全时，使用 `allowedDecisions: ["allow-once", "deny"]`。

## 决策行为

OpenClaw 创建一个带有 `plugin:` ID 的待审批请求，将其投递到可用的审批接口，并等待决策。

| 决策               | 结果                                                           |
| ------------------ | -------------------------------------------------------------- |
| `allow-once`       | 当前调用继续执行。                                             |
| `allow-always`     | 当前调用继续执行，决策传递给 Plugin。                          |
| `deny`             | 调用被阻止，返回被拒绝的工具结果。                             |
| 超时               | 除非 `timeoutBehavior` 为 `"allow"`，否则调用被阻止。         |
| 取消               | 运行中止时调用被阻止。                                         |
| 无审批路由         | 没有已连接的审批接口可以解决请求时调用被阻止。                 |

`allow-always` 仅在请求 Plugin 或运行时实现持久化时才有持久效果。对于普通的 `before_tool_call.requireApproval` Hook，OpenClaw 将 `allow-once` 和 `allow-always` 视为当前调用的审批决策，并将解决值传递给 `onResolution`。如果您的 Plugin 提供 `allow-always`，请明确记录和实现它信任哪些未来调用。

如果 Hook 还返回 `params`，OpenClaw 仅在审批成功后才应用这些参数变更。低优先级的 Hook 仍然可以在高优先级 Hook 请求审批后阻止。

`allowedDecisions` 限制显示给用户的按钮和命令。Gateway 会拒绝请求未提供的任何决策的解决尝试。

## 路由审批提示

审批提示可以在本地 UI 接口或支持审批处理的聊天 Channel 中解决。要将 Plugin 审批提示转发到明确的聊天目标，请配置 `approvals.plugin`：

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin` 独立于 `approvals.exec`。启用 exec 审批转发不会路由 Plugin 审批提示，启用 Plugin 审批转发也不会更改主机 exec 策略。

当提示包含手动审批文本时，使用提供的决策之一解决：

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

参见 [高级 exec 审批](/tools/exec-approvals-advanced#plugin-approval-forwarding) 了解完整的转发模型、同聊天审批行为、原生 Channel 投递和特定 Channel 审批者规则。

## Codex 原生权限

Codex 原生权限提示也可以通过 Plugin 审批传递，但它们的所有权与 Plugin 编写的 Hook 不同。

- Codex 应用服务器审批请求在 Codex 审查后路由通过 OpenClaw。
- 原生 Hook `permission_request` 中继在启用时可通过 `plugin.approval.request` 请求。
- 当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，MCP 工具审批请求通过 Plugin 审批路由。

参见 [Codex harness runtime](/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations) 了解 Codex 特定行为和回退规则。

## 故障排除

**工具提示 Plugin 审批不可用。** 没有审批 UI 或已配置的审批路由接受请求。连接支持审批的客户端，使用支持同聊天 `/approve` 的 Channel，或配置 `approvals.plugin`。

**出现 `allow-always` 但下次调用又弹出提示。** 通用 Plugin 审批流程不会自动为任意 Hook 持久化信任。在 `onResolution("allow-always")` 后在您的 Plugin 中持久化 Plugin 拥有的信任，或仅提供 `allow-once` 和 `deny`。

**`/approve` 拒绝该决策。** 请求限制了 `allowedDecisions`。使用提示中打印的决策之一。

**Slack、Discord、Telegram 或 Matrix 提示的路由与 exec 审批不同。** Plugin 审批和 exec 审批使用独立的配置，可能使用不同的授权检查。验证 `approvals.plugin` 和 Channel 的 Plugin 审批支持，而不仅仅检查 `approvals.exec`。

## 相关

- [Plugin Hook](/plugins/hooks#tool-call-policy)
- [构建 Plugin](/plugins/building-plugins#registering-agent-tools)
- [高级 exec 审批](/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Gateway 协议](/gateway/protocol)
- [Codex harness runtime](/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
