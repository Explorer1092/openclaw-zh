---
mmh3_hash: "a9abee2ead5103ca8612235719547ef2"
summary: "向多个 Agents 广播 WhatsApp 消息"
read_when:
  - 配置广播组
  - 调试 WhatsApp 中的多 Agent 回复
status: experimental
title: "广播组"
---

# 广播组

**状态：** 实验性
**版本：** 2026.1.9 中添加

## 概述

广播组使多个 Agents 能够同时处理和响应同一条消息。这允许您创建在单个 WhatsApp 群组或 DM 中协同工作的专业 Agent 团队 — 全部使用一个电话号码。

当前范围：**仅 WhatsApp**（Web Channel）。

广播组在 Channel 白名单和群组激活规则之后进行评估。在 WhatsApp 群组中，这意味着广播发生在 OpenClaw 通常会回复时（例如：被提及时，取决于您的群组设置）。

## 用例

### 1. 专业 Agent 团队

部署具有原子化、专注职责的多个 Agents：

```
群组："Development Team"
Agents:
  - CodeReviewer（审查代码片段）
  - DocumentationBot（生成文档）
  - SecurityAuditor（检查漏洞）
  - TestGenerator（建议测试用例）
```

每个 Agent 处理相同的消息并提供其专业的视角。

### 2. 多语言支持

```
群组："International Support"
Agents:
  - Agent_EN（用英语回复）
  - Agent_DE（用德语回复）
  - Agent_ES（用西班牙语回复）
```

### 3. 质量保证工作流

```
群组："Customer Support"
Agents:
  - SupportAgent（提供答案）
  - QAAgent（审查质量，仅在发现问题时回复）
```

### 4. 任务自动化

```
群组："Project Management"
Agents:
  - TaskTracker（更新任务数据库）
  - TimeLogger（记录花费的时间）
  - ReportGenerator（创建摘要）
```

## 配置

### 基本设置

添加顶级 `broadcast` 部分（在 `bindings` 旁边）。键是 WhatsApp 对等 ID：

- 群聊：群组 JID（例如 `120363403215116621@g.us`）
- DM：E.164 电话号码（例如 `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**结果：** 当 OpenClaw 在此聊天中回复时，它将运行所有三个 Agents。

### 处理策略

控制 Agents 如何处理消息：

#### 并行（默认）

所有 Agents 同时处理：

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### 顺序

Agents 按顺序处理（一个等待上一个完成）：

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### 完整示例

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## 工作原理

### 消息流程

1. **传入消息**到达 WhatsApp 群组
2. **广播检查**：系统检查对等 ID 是否在 `broadcast` 中
3. **如果在广播列表中**：
   - 所有列出的 Agents 处理消息
   - 每个 Agent 都有自己的会话密钥和隔离的上下文
   - Agents 并行（默认）或顺序处理
4. **如果不在广播列表中**：
   - 应用正常路由（第一个匹配的绑定）

注意：广播组不会绕过 Channel 白名单或群组激活规则（提及/命令等）。它们仅在消息有资格处理时更改_运行哪些 Agents_。

### Session 隔离

广播组中的每个 Agent 维护完全独立的：

- **Session 键**（`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`）
- **对话历史**（Agent 看不到其他 Agents 的消息）
- **工作空间**（如果配置则为单独的沙箱）
- **工具访问**（不同的允许/拒绝列表）
- **内存/上下文**（单独的 IDENTITY.md、SOUL.md 等）
- **群组上下文缓冲区**（用于上下文的最近群组消息）每个对等体共享，因此所有广播 Agents 在触发时看到相同的上下文

这允许每个 Agent 拥有：

- 不同的个性
- 不同的工具访问（例如，只读 vs. 读写）
- 不同的模型（例如，opus vs. sonnet）
- 安装不同的 Skills

### 示例：隔离的 Sessions

在群组 `120363403215116621@g.us` 中，使用 Agents `["alfred", "baerbel"]`：

**Alfred 的上下文：**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
历史：[用户消息，alfred 的先前响应]
工作空间：/Users/pascal/openclaw-alfred/
工具：read、write、exec
```

**Bärbel 的上下文：**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
历史：[用户消息，baerbel 的先前响应]
工作空间：/Users/pascal/openclaw-baerbel/
工具：仅 read
```

## 最佳实践

### 1. 保持 Agents 专注

设计每个 Agent 具有单一、明确的职责：

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **好：** 每个 Agent 有一个工作
❌ **坏：** 一个通用的"dev-helper" Agent

### 2. 使用描述性名称

明确说明每个 Agent 的作用：

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. 配置不同的工具访问

仅给予 Agents 所需的工具：

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // 只读
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // 读写
    }
  }
}
```

### 4. 监控性能

对于许多 Agents，请考虑：

- 使用 `"strategy": "parallel"`（默认）以提高速度
- 将广播组限制为 5-10 个 Agents
- 对简单 Agents 使用更快的模型

### 5. 优雅地处理故障

Agents 独立失败。一个 Agent 的错误不会阻止其他 Agents：

```
消息 → [Agent A ✓，Agent B ✗ 错误，Agent C ✓]
结果：Agent A 和 C 回复，Agent B 记录错误
```

## 兼容性

### Providers

广播组目前适用于：

- ✅ WhatsApp（已实现）
- 🚧 Telegram（计划中）
- 🚧 Discord（计划中）
- 🚧 Slack（计划中）

### 路由

广播组与现有路由并存：

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`：仅 alfred 回复（正常路由）
- `GROUP_B`：agent1 和 agent2 回复（广播）

**优先级：** `broadcast` 优先于 `bindings`。

## 故障排除

### Agents 不响应

**检查：**

1. Agent ID 存在于 `agents.list` 中
2. 对等 ID 格式正确（例如 `120363403215116621@g.us`）
3. Agents 不在拒绝列表中

**调试：**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### 仅一个 Agent 响应

**原因：** 对等 ID 可能在 `bindings` 中但不在 `broadcast` 中。

**修复：** 添加到广播配置或从绑定中删除。

### 性能问题

**如果许多 Agents 导致缓慢：**

- 减少每个组的 Agents 数量
- 使用更轻的模型（sonnet 而不是 opus）
- 检查沙箱启动时间

## 示例

### 示例 1：代码审查团队

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**用户发送：** 代码片段
**响应：**

- code-formatter："修复了缩进并添加了类型提示"
- security-scanner："⚠️ 第 12 行存在 SQL 注入漏洞"
- test-coverage："覆盖率为 45%，缺少错误案例的测试"
- docs-checker："函数 `process_data` 缺少文档字符串"

### 示例 2：多语言支持

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## API 参考

### 配置 Schema

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### 字段

- `strategy`（可选）：如何处理 Agents
  - `"parallel"`（默认）：所有 Agents 同时处理
  - `"sequential"`：Agents 按数组顺序处理
- `[peerId]`：WhatsApp 群组 JID、E.164 号码或其他对等 ID
  - 值：应处理消息的 Agent ID 数组

## 限制

1. **最大 Agents：** 无硬限制，但 10+ Agents 可能很慢
2. **共享上下文：** Agents 看不到彼此的响应（设计如此）
3. **消息顺序：** 并行响应可能以任何顺序到达
4. **速率限制：** 所有 Agents 计入 WhatsApp 速率限制

## 未来增强

计划的功能：

- [ ] 共享上下文模式（Agents 看到彼此的响应）
- [ ] Agent 协调（Agents 可以相互发信号）
- [ ] 动态 Agent 选择（根据消息内容选择 Agents）
- [ ] Agent 优先级（某些 Agents 先于其他 Agents 响应）

## 另见

- [多 Agent 配置](/tools/multi-agent-sandbox-tools)
- [路由配置](/channels/channel-routing)
- [Session 管理](/concepts/session)
