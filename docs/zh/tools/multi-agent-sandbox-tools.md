---
mmh3_hash: "835e121aa7399fdf62d3cd832df25ee6"
summary: "每个 Agent 的沙箱 + 工具限制、优先级和示例"
title: 多 Agent 沙箱和工具
read_when: "您想在多 Agent Gateway 中实现每个 Agent 的沙箱或每个 Agent 的工具允许/拒绝策略。"
status: active
---

# 多 Agent 沙箱和工具配置

多 Agent 设置中的每个 Agent 都可以覆盖全局沙箱和工具策略。本页涵盖每个 Agent 的配置、优先级规则和示例。

- **沙箱后端和模式**：参见 [沙箱化](/gateway/sandboxing)。
- **调试被阻止的工具**：参见 [沙箱 vs 工具策略 vs 提升模式](/gateway/sandbox-vs-tool-policy-vs-elevated) 和 `openclaw sandbox explain`。
- **提升 exec**：参见 [提升模式](/tools/elevated)。

身份验证是每个 Agent 的：每个 Agent 从其自己的 `agentDir` 身份验证存储读取，路径为 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`。
凭据**不**在 Agent 之间共享。永远不要在 Agent 之间重用 `agentDir`。如果你想共享凭据，请将 `auth-profiles.json` 复制到其他 Agent 的 `agentDir`。

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

每个级别都可以进一步限制工具，但不能授予早期级别拒绝的工具。如果设置了 `agents.list[].tools.sandbox.tools`，它将替换该 Agent 的 `tools.sandbox.tools`。如果设置了 `agents.list[].tools.profile`，它将覆盖该 Agent 的 `tools.profile`。Provider 工具键接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.4`）。

工具策略支持 `group:*` 简写，可展开为多个工具。参见 [工具组简写](/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) 查看完整列表。

每个 Agent 的提升模式覆盖（`agents.list[].tools.elevated`）可以进一步限制特定 Agent 的提升 exec。参见 [提升模式](/tools/elevated) 了解详情。

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

此配置文件中的 `sessions_history` 仍然返回有界的、经过净化的回溯视图，而不是原始转录导出。助手回溯会去除 thinking 标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及截断的工具调用块）、降级的工具调用脚手架、泄漏的 ASCII/全角模型控制令牌，以及格式错误的 MiniMax 工具调用 XML，然后才进行修订/截断。

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

- [沙箱化](/gateway/sandboxing) -- 完整沙箱参考（模式、范围、后端、镜像）
- [沙箱 vs 工具策略 vs 提升模式](/gateway/sandbox-vs-tool-policy-vs-elevated) -- 调试"为什么被阻止？"
- [提升模式](/tools/elevated)
- [多 Agent 路由](/concepts/multi-agent)
- [沙箱配置](/gateway/configuration-reference#agentsdefaultssandbox)
- [Session 管理](/concepts/session)
