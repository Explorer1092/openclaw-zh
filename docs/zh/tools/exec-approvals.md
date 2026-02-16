---
title: "Exec 批准"
mmh3_hash: "caea39226c426dbebd76dbc22d0ad02f"
summary: "Exec 批准、允许列表和沙箱逃逸提示"
read_when: ["配置 exec 批准或允许列表","在 macOS 应用中实现 exec 批准 UX","审查沙箱逃逸提示和影响"]
---

# Exec 批准

Exec 批准是让沙箱化 agent 在真实主机(`gateway` 或 `node`)上运行命令的**伴侣应用/节点主机防护**。将其视为安全联锁:只有当策略 + 允许列表 + (可选)用户批准都同意时,才允许命令。Exec 批准是**除了**工具策略和提升门控之外的(除非提升设置为 `full`,这会跳过批准)。有效策略是 `tools.exec.*` 和批准默认值中**更严格**的;如果省略批准字段,则使用 `tools.exec` 值。

如果伴侣应用 UI **不可用**,任何需要提示的请求都会由**询问回退**解决(默认: 拒绝)。

## 适用范围

Exec 批准在执行主机上本地强制执行:
- **网关主机** → 网关机器上的 `openclaw` 进程
- **节点主机** → 节点运行器(macOS 伴侣应用或无头节点主机)

macOS 拆分:
- **节点主机服务**通过本地 IPC 将 `system.run` 转发到 **macOS 应用**。
- **macOS 应用**强制执行批准 + 在 UI 上下文中执行命令。

## 设置和存储

批准位于执行主机上的本地 JSON 文件中:

`~/.openclaw/exec-approvals.json`

示例架构:
```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 策略旋钮

### 安全(`exec.security`)
- **deny**: 阻止所有主机 exec 请求。
- **allowlist**: 仅允许允许列表中的命令。
- **full**: 允许所有内容(相当于提升)。

### 询问(`exec.ask`)
- **off**: 从不提示。
- **on-miss**: 仅在允许列表不匹配时提示。
- **always**: 每次命令都提示。

### 询问回退(`askFallback`)
如果需要提示但无法访问 UI,回退决定:
- **deny**: 阻止。
- **allowlist**: 仅当允许列表匹配时允许。
- **full**: 允许。

## 允许列表(每个 agent)

允许列表是**每个 agent** 的。如果存在多个 agent,在 macOS 应用中切换您正在编辑的 agent。模式是**不区分大小写的通配符匹配**。模式应解析为**二进制路径**(忽略仅基名条目)。旧的 `agents.default` 条目在加载时迁移到 `agents.main`。

示例:
- `~/Projects/**/bin/bird`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个允许列表条目跟踪:
- **id** 用于 UI 标识的稳定 UUID(可选)
- **上次使用**时间戳
- **上次使用的命令**
- **上次解析的路径**

## 自动允许技能 CLI

当启用**自动允许技能 CLI** 时,已知技能引用的可执行文件在节点(macOS 节点或无头节点主机)上被视为允许列表。这通过网关 RPC 使用 `skills.bins` 来获取技能 bin 列表。如果您想要严格的手动允许列表,请禁用此功能。

## 安全 bin(仅 stdin)

`tools.exec.safeBins` 定义了一个小的**仅 stdin** 二进制文件列表(例如 `jq`),可以在允许列表模式下**无需**显式允许列表条目即可运行。安全 bin 拒绝位置文件参数和类路径令牌,因此它们只能在传入流上操作。在允许列表模式下不会自动允许 shell 链接和重定向。

Shell 链接(`&&`、`||`、`;`)在每个顶级段满足允许列表(包括安全 bin 或技能自动允许)时被允许。在允许列表模式下重定向仍不受支持。

默认安全 bin: `jq`、`grep`、`cut`、`sort`、`uniq`、`head`、`tail`、`tr`、`wc`。

## 控制 UI 编辑

使用**控制 UI → 节点 → Exec 批准**卡编辑默认值、每个 agent 的覆盖和允许列表。选择一个范围(默认值或 agent),调整策略,添加/删除允许列表模式,然后**保存**。UI 显示每个模式的**上次使用**元数据,以便您可以保持列表整洁。

目标选择器选择**网关**(本地批准)或**节点**。节点必须公告 `system.execApprovals.get/set`(macOS 应用或无头节点主机)。如果节点尚未公告 exec 批准,直接编辑其本地 `~/.openclaw/exec-approvals.json`。

CLI: `openclaw approvals` 支持网关或节点编辑(参见 [批准 CLI](/cli/approvals))。

## 批准流程

当需要提示时,网关向操作员客户端广播 `exec.approval.requested`。控制 UI 和 macOS 应用通过 `exec.approval.resolve` 解决它,然后网关将批准的请求转发到节点主机。

当需要批准时,exec 工具立即返回批准 id。使用该 id 关联稍后的系统事件(`Exec finished` / `Exec denied`)。如果在超时之前没有决定到达,请求被视为批准超时并作为拒绝原因浮出水面。

确认对话框包括:
- 命令 + 参数
- cwd
- agent id
- 解析的可执行文件路径
- 主机 + 策略元数据

操作:
- **仅允许一次** → 立即运行
- **始终允许** → 添加到允许列表 + 运行
- **拒绝** → 阻止

## 批准转发到聊天频道

您可以将 exec 批准提示转发到任何聊天频道(包括插件频道),并使用 `/approve` 批准它们。这使用正常的出站投递管道。

配置:
```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // 子字符串或正则表达式
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" }
      ]
    }
  }
}
```

在聊天中回复:
```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

### macOS IPC 流程
```
网关 -> 节点服务(WS)
                 |  IPC(UDS + 令牌 + HMAC + TTL)
                 v
             Mac 应用(UI + 批准 + system.run)
```

安全注意事项:
- Unix 套接字模式 `0600`,令牌存储在 `exec-approvals.json` 中。
- 相同 UID 对等检查。
- 挑战/响应(nonce + HMAC 令牌 + 请求哈希)+ 短 TTL。

## 系统事件

Exec 生命周期作为系统消息浮出水面:
- `Exec running`(仅当命令超过运行通知阈值时)
- `Exec finished`
- `Exec denied`

这些在节点报告事件后发布到 agent 的会话。网关主机 exec 批准在命令完成时发出相同的生命周期事件(并且可选地在运行时间超过阈值时)。批准门控的 exec 在这些消息中重用批准 id 作为 `runId`,以便于关联。

## 影响

- **full** 很强大;在可能的情况下优先使用允许列表。
- **ask** 让您保持在循环中,同时仍然允许快速批准。
- 每个 agent 的允许列表防止一个 agent 的批准泄漏到其他 agent。
- 批准仅适用于来自**授权发送者**的主机 exec 请求。未授权的发送者无法发出 `/exec`。
- `/exec security=full` 是授权操作员的会话级便利功能,按设计跳过批准。要硬阻止主机 exec,将批准安全性设置为 `deny` 或通过工具策略拒绝 `exec` 工具。

相关:
- [Exec 工具](/tools/exec)
- [提升模式](/tools/elevated)
- [技能](/tools/skills)

