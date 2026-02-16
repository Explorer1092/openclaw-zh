---
mmh3_hash: "43a37bc1a9d37c5c87dd72edb2806474"
summary: "每个 Agent 的沙箱 + 工具限制、优先级和示例"
title: 多 Agent 沙箱和工具
read_when: "您想在多 Agent Gateway 中实现每个 Agent 的沙箱或每个 Agent 的工具允许/拒绝策略。"
status: active
---

# 多 Agent 沙箱和工具配置

## 概述

多 Agent 设置中的每个 Agent 现在都可以拥有自己的：

- **沙箱配置**（`agents.list[].sandbox` 覆盖 `agents.defaults.sandbox`）
- **工具限制**（`tools.allow` / `tools.deny`，加上 `agents.list[].tools`）

这允许您使用不同的安全配置文件运行多个 Agent：

- 具有完全访问权限的个人助手
- 具有受限工具的家庭/工作 Agent
- 沙箱中的面向公众的 Agent

`setupCommand` 属于 `sandbox.docker`（全局或每个 Agent）下，并在创建容器时运行一次。

身份验证是每个 Agent 的：每个 Agent 从其自己的 `agentDir` 身份验证存储读取：

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

凭据**不**在 Agent 之间共享。永远不要在 Agent 之间重用 `agentDir`。如果您想共享凭据，请将 `auth-profiles.json` 复制到其他 Agent 的 `agentDir`。

有关沙箱在运行时的行为，请参阅 [Sandboxing](/gateway/sandboxing)。对于调试"为什么被阻止？"，请参阅 [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) 和 `openclaw sandbox explain`。

---

## 配置示例

### 示例 1：个人 + 受限家庭 Agent

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**结果：**

- `main` Agent：在主机上运行，完全工具访问
- `family` Agent：在 Docker 中运行（每个 Agent 一个容器），仅 `read` 工具

---

### 示例 2：具有共享沙箱的工作 Agent

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### 示例 2b：全局编码配置文件 + 仅消息传递 Agent

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**结果：**

- 默认 Agent 获得编码工具
- `support` Agent 仅消息传递（+ Slack 工具）

---

### 示例 3：每个 Agent 不同的沙箱模式

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // 全局默认
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // 覆盖：main 永不沙箱化
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // 覆盖：public 始终沙箱化
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## 配置优先级

当全局（`agents.defaults.*`）和 Agent 特定（`agents.list[].*`）配置同时存在时：

### 沙箱配置

Agent 特定设置覆盖全局：

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**注意：**

- `agents.list[].sandbox.{docker,browser,prune}.*` 覆盖该 Agent 的 `agents.defaults.sandbox.{docker,browser,prune}.*`（当沙箱范围解析为 `"shared"` 时被忽略）。

### 工具限制

过滤顺序为：

1. **工具配置文件**（`tools.profile` 或 `agents.list[].tools.profile`）
2. **Provider 工具配置文件**（`tools.byProvider[provider].profile` 或 `agents.list[].tools.byProvider[provider].profile`）
3. **全局工具策略**（`tools.allow` / `tools.deny`）
4. **Provider 工具策略**（`tools.byProvider[provider].allow/deny`）
5. **Agent 特定工具策略**（`agents.list[].tools.allow/deny`）
6. **Agent Provider 策略**（`agents.list[].tools.byProvider[provider].allow/deny`）
7. **沙箱工具策略**（`tools.sandbox.tools` 或 `agents.list[].tools.sandbox.tools`）
8. **Subagent 工具策略**（`tools.subagents.tools`，如果适用）

每个级别都可以进一步限制工具，但不能授予早期级别拒绝的工具。如果设置了 `agents.list[].tools.sandbox.tools`，它将替换该 Agent 的 `tools.sandbox.tools`。如果设置了 `agents.list[].tools.profile`，它将覆盖该 Agent 的 `tools.profile`。Provider 工具键接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.2`）。

### 工具组（简写）

工具策略（全局、Agent、沙箱）支持 `group:*` 条目，这些条目扩展为多个具体工具：

- `group:runtime`：`exec`、`bash`、`process`
- `group:fs`：`read`、`write`、`edit`、`apply_patch`
- `group:sessions`：`sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status`
- `group:memory`：`memory_search`、`memory_get`
- `group:ui`：`browser`、`canvas`
- `group:automation`：`cron`、`gateway`
- `group:messaging`：`message`
- `group:nodes`：`nodes`
- `group:openclaw`：所有内置 OpenClaw 工具（不包括 Provider Plugins）

### Elevated 模式

`tools.elevated` 是全局基线（基于发送者的白名单）。`agents.list[].tools.elevated` 可以进一步限制特定 Agent 的提升（两者都必须允许）。

缓解模式：

- 对不受信任的 Agent 拒绝 `exec`（`agents.list[].tools.deny: ["exec"]`）
- 避免将路由到受限 Agent 的发送者列入白名单
- 如果您只想要沙箱执行，请全局禁用提升（`tools.elevated.enabled: false`）
- 对敏感配置文件禁用每个 Agent 的提升（`agents.list[].tools.elevated.enabled: false`）

---

## 从单个 Agent 迁移

**之前（单个 Agent）：**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**之后（具有不同配置文件的多 Agent）：**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

旧版 `agent.*` 配置由 `openclaw doctor` 迁移；今后请使用 `agents.defaults` + `agents.list`。

---

## 工具限制示例

### 只读 Agent

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### 安全执行 Agent（无文件修改）

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### 仅通信 Agent

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

---

## 常见陷阱："non-main"

`agents.defaults.sandbox.mode: "non-main"` 基于 `session.mainKey`（默认 `"main"`），而不是 Agent ID。群组/Channel 会话始终获得自己的密钥，因此它们被视为非 main 并将被沙箱化。如果您希望 Agent 永不沙箱化，请设置 `agents.list[].sandbox.mode: "off"`。

---

## 测试

配置多 Agent 沙箱和工具后：

1. **检查 Agent 解析：**

   ```exec
   openclaw agents list --bindings
   ```

2. **验证沙箱容器：**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **测试工具限制：**
   - 发送需要受限工具的消息
   - 验证 Agent 无法使用被拒绝的工具

4. **监控日志：**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## 故障排除

### Agent 尽管设置了 `mode: "all"` 但未沙箱化

- 检查是否有覆盖它的全局 `agents.defaults.sandbox.mode`
- Agent 特定配置优先，因此设置 `agents.list[].sandbox.mode: "all"`

### 尽管有拒绝列表，工具仍然可用

- 检查工具过滤顺序：全局 → Agent → 沙箱 → Subagent
- 每个级别只能进一步限制，不能授予回来
- 使用日志验证：`[tools] filtering tools for agent:${agentId}`

### 容器未按 Agent 隔离

- 在 Agent 特定沙箱配置中设置 `scope: "agent"`
- 默认为 `"session"`，每个会话创建一个容器

---

## 另见

- [多 Agent 路由](/concepts/multi-agent)
- [沙箱配置](/gateway/configuration#agentsdefaults-sandbox)
- [Session 管理](/concepts/session)
