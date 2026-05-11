---
mmh3_hash: "05aab794b3d2a45f4e1587a7192542b9"
summary: "Gateway 客户端的 Operator 角色、作用域和审批时检查"
read_when:
  - 调试缺少 operator scope 错误
  - 审查设备或节点配对审批
  - 添加或分类 Gateway RPC 方法
title: "Operator 作用域"
---

Operator 作用域定义了 Gateway 客户端在认证后可以执行的操作。它们是一个受信任的 Gateway operator 域内部的控制平面保护机制，而非针对不可信多租户的隔离。如果您需要在人员、团队或机器之间进行强隔离，请在独立的操作系统用户或主机下运行独立的 Gateway。

相关：[Security](/gateway/security)、[Gateway 协议](/gateway/protocol)、[Gateway 配对](/gateway/pairing)、[Devices CLI](/cli/devices)。

## 角色

Gateway WebSocket 客户端使用以下角色之一连接：

- `operator`：控制平面客户端，例如 CLI、Control UI、自动化工具和受信任的辅助进程。
- `node`：能力主机，例如 macOS、iOS、Android 或通过 `node.invoke` 公开命令的无头节点。

Operator RPC 方法需要 `operator` 角色。节点发起的方法需要 `node` 角色。

## 作用域级别

| 作用域                  | 含义                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 只读状态、列表、目录、日志、Session 读取和其他非变更控制平面调用。                                                                                                |
| `operator.write`        | 正常的变更 operator 操作，例如发送消息、调用工具、更新 talk/voice 设置和节点命令中继。也满足 `operator.read`。                                                    |
| `operator.admin`        | 管理控制平面访问。满足所有 `operator.*` 作用域。配置变更、更新、原生 Hook、敏感保留命名空间和高风险审批所需。                                                      |
| `operator.pairing`      | 设备和节点配对管理，包括列出、审批、拒绝、移除、轮换和撤销配对记录或设备令牌。                                                                                    |
| `operator.approvals`    | Exec 和 Plugin 审批 API。                                                                                                                                         |
| `operator.talk.secrets` | 读取包含 secret 的 Talk 配置。                                                                                                                                    |

未知的未来 `operator.*` 作用域需要精确匹配，除非调用者拥有 `operator.admin`。

## 方法作用域只是第一道门

每个 Gateway RPC 都有一个最小权限方法作用域。该方法作用域决定请求是否能到达处理程序。某些处理程序会根据正在审批或变更的具体内容应用更严格的审批时检查。

示例：

- `device.pair.approve` 可通过 `operator.pairing` 访问，但审批 operator 设备时只能铸造或保留调用者已有的作用域。
- `node.pair.approve` 可通过 `operator.pairing` 访问，然后从待处理节点命令列表中派生额外的审批作用域。
- `chat.send` 通常是 write 作用域的方法，但持久化的 `/config set` 和 `/config unset` 在命令级别需要 `operator.admin`。

这使低作用域的 operator 可以执行低风险的配对操作，而无需将所有配对审批变为仅限管理员。

## 设备配对审批

设备配对记录是已审批角色和作用域的持久来源。已配对的设备不会静默获得更广泛的访问：请求更广泛角色或作用域的重连会创建新的待处理升级请求。

审批设备请求时：

- 不含 operator 角色的请求不需要 operator 令牌作用域审批。
- 请求 `operator.read`、`operator.write`、`operator.approvals`、`operator.pairing` 或 `operator.talk.secrets` 时，需要调用者持有这些作用域或 `operator.admin`。
- 请求 `operator.admin` 需要 `operator.admin`。
- 无显式作用域的修复请求可以继承现有的 operator 令牌作用域。如果该现有令牌是管理员作用域，审批仍然需要 `operator.admin`。

对于已配对设备的令牌 Session，管理是自作用域的，除非调用者还有 `operator.admin`：非管理员调用者只能看到自己的配对条目，只能审批或拒绝自己的待处理请求，只能轮换、撤销或移除自己的设备条目。

## 节点配对审批

遗留的 `node.pair.*` 使用独立的 Gateway 自有节点配对存储。WS 节点使用带有 `role: node` 的设备配对，但相同的审批级别词汇适用。

`node.pair.approve` 使用待处理请求命令列表来派生额外所需作用域：

- 无命令请求：`operator.pairing`
- 非 exec 节点命令：`operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare` 或 `system.which`：`operator.pairing` + `operator.admin`

节点配对建立身份和信任。它不替代节点自身的 `system.run` exec 审批策略。

## 共享密钥认证

共享 Gateway 令牌/密码认证被视为该 Gateway 的受信任 operator 访问。兼容 OpenAI 的 HTTP 接口和 `/tools/invoke` 会为共享密钥 bearer 认证恢复正常的完整 operator 默认作用域集，即使调用者发送了更窄的声明作用域。

带有身份的模式（例如 trusted proxy 认证或私有入口 `none`）仍然可以遵守显式声明的作用域。对于真正的信任边界分离，请使用独立的 Gateway。
