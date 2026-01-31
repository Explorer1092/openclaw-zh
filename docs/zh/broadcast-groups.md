---
mmh3_hash: "ee5fbeedeebdef1d9ecb865218a40f84"
summary: "将 WhatsApp 消息广播给多个代理"
read_when:
  - 配置广播组
  - 在 WhatsApp 中调试多代理回复
status: experimental
---

# 广播组

**状态:** 实验性  
**版本:** 在 2026.1.9 中添加

## 概述

广播组使多个代理能够同时处理和响应同一条消息。这使您能够创建专业的代理团队,在单个 WhatsApp 群组或私聊中协同工作——全部使用一个电话号码。

当前范围:**仅限 WhatsApp**(Web 通道)。

广播组在通道白名单和群组激活规则之后进行评估。在 WhatsApp 群组中,这意味着当 OpenClaw 通常会回复时(例如:被提及时,取决于您的群组设置)会发生广播。

## 使用场景

### 1. 专业代理团队
部署具有原子化、专注职责的多个代理:
```
群组:"开发团队"
代理:
  - CodeReviewer(审查代码片段)
  - DocumentationBot(生成文档)
  - SecurityAuditor(检查漏洞)
  - TestGenerator(建议测试用例)
```

每个代理处理相同的消息并提供其专业的观点。

### 2. 多语言支持
```
群组:"国际支持"
代理:
  - Agent_EN(用英语回复)
  - Agent_DE(用德语回复)
  - Agent_ES(用西班牙语回复)
```

### 3. 质量保证工作流
```
群组:"客户支持"
代理:
  - SupportAgent(提供答案)
  - QAAgent(审查质量,仅在发现问题时回复)
```

### 4. 任务自动化
```
群组:"项目管理"
代理:
  - TaskTracker(更新任务数据库)
  - TimeLogger(记录花费的时间)
  - ReportGenerator(创建摘要)
```

## 配置

### 基本设置

添加一个顶级 `broadcast` 部分(与 `bindings` 相邻)。键是 WhatsApp 对等 ID:
- 群聊:群组 JID(例如 `120363403215116621@g.us`)
- 私聊:E.164 电话号码(例如 `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**结果:** 当 OpenClaw 在此聊天中回复时,它将运行所有三个代理。

### 处理策略

控制代理如何处理消息:

#### 并行(默认)
所有代理同时处理:
```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### 顺序
代理按顺序处理(一个等待前一个完成):
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

### 消息流

1. **传入消息**到达 WhatsApp 群组
2. **广播检查**:系统检查对等 ID 是否在 `broadcast` 中
3. **如果在广播列表中**:
   - 所有列出的代理处理消息
   - 每个代理都有自己的会话键和隔离的上下文
   - 代理并行(默认)或顺序处理
4. **如果不在广播列表中**:
   - 应用正常路由(第一个匹配的绑定)

注意:广播组不会绕过通道白名单或群组激活规则(提及/命令等)。它们只会改变消息有资格处理时*运行哪些代理*。

### 会话隔离

广播组中的每个代理完全独立维护:

- **会话键**(`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **对话历史**(代理看不到其他代理的消息)
- **工作区**(如果配置,则为独立沙箱)
- **工具访问**(不同的允许/拒绝列表)
- **内存/上下文**(独立的 IDENTITY.md、SOUL.md 等)
- **群组上下文缓冲区**(用于上下文的最近群组消息)按对等共享,因此所有广播代理在触发时看到相同的上下文

这允许每个代理具有:
- 不同的个性
- 不同的工具访问(例如,只读 vs 读写)
- 不同的模型(例如,opus vs sonnet)
- 安装不同的技能

### 示例:隔离会话

在群组 `120363403215116621@g.us` 中,代理为 `["alfred", "baerbel"]`:

**Alfred 的上下文:**
```
会话: agent:alfred:whatsapp:group:120363403215116621@g.us
历史: [用户消息, alfred 的先前回复]
工作区: /Users/pascal/openclaw-alfred/
工具: read, write, exec
```

**Bärbel 的上下文:**
```
会话: agent:baerbel:whatsapp:group:120363403215116621@g.us  
历史: [用户消息, baerbel 的先前回复]
工作区: /Users/pascal/openclaw-baerbel/
工具: 只读
```

## 最佳实践

### 1. 保持代理专注

为每个代理设计单一、明确的职责:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **好:** 每个代理有一个工作  
❌ **坏:** 一个通用的"dev-helper"代理

### 2. 使用描述性名称

明确每个代理的作用:

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

只给代理它们需要的工具:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] }  // 只读
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] }  // 读写
    }
  }
}
```

### 4. 监控性能

对于多个代理,请考虑:
- 使用 `"strategy": "parallel"`(默认)以提高速度
- 将广播组限制为 5-10 个代理
- 对简单代理使用更快的模型

### 5. 优雅地处理失败

代理独立失败。一个代理的错误不会阻止其他代理:

```
消息 → [代理 A ✓, 代理 B ✗ 错误, 代理 C ✓]
结果: 代理 A 和 C 回复,代理 B 记录错误
```

## 兼容性

### 提供程序

广播组目前支持:
- ✅ WhatsApp(已实现)
- 🚧 Telegram(计划中)
- 🚧 Discord(计划中)
- 🚧 Slack(计划中)

### 路由

广播组与现有路由一起工作:

```json
{
  "bindings": [
    { "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } }, "agentId": "alfred" }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: 只有 alfred 回复(正常路由)
- `GROUP_B`: agent1 和 agent2 回复(广播)

**优先级:** `broadcast` 优先于 `bindings`。

## 故障排除

### 代理不响应

**检查:**
1. 代理 ID 存在于 `agents.list` 中
2. 对等 ID 格式正确(例如,`120363403215116621@g.us`)
3. 代理不在拒绝列表中

**调试:**
```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### 只有一个代理响应

**原因:** 对等 ID 可能在 `bindings` 中但不在 `broadcast` 中。

**修复:** 添加到广播配置或从绑定中删除。

### 性能问题

**如果多个代理速度慢:**
- 减少每个组的代理数量
- 使用更轻的模型(sonnet 而不是 opus)
- 检查沙箱启动时间

## 示例

### 示例 1: 代码审查团队

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
      { "id": "code-formatter", "workspace": "~/agents/formatter", "tools": { "allow": ["read", "write"] } },
      { "id": "security-scanner", "workspace": "~/agents/security", "tools": { "allow": ["read", "exec"] } },
      { "id": "test-coverage", "workspace": "~/agents/testing", "tools": { "allow": ["read", "exec"] } },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**用户发送:** 代码片段  
**回复:**
- code-formatter:"修复了缩进并添加了类型提示"
- security-scanner:"⚠️ 第 12 行存在 SQL 注入漏洞"
- test-coverage:"覆盖率为 45%,缺少错误情况的测试"
- docs-checker:"函数 `process_data` 缺少文档字符串"

### 示例 2: 多语言支持

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

### 配置架构

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### 字段

- `strategy`(可选):如何处理代理
  - `"parallel"`(默认):所有代理同时处理
  - `"sequential"`:代理按数组顺序处理
  
- `[peerId]`: WhatsApp 群组 JID、E.164 号码或其他对等 ID
  - 值:应处理消息的代理 ID 数组

## 限制

1. **最大代理数:** 没有硬性限制,但 10+ 个代理可能会很慢
2. **共享上下文:** 代理看不到彼此的回复(按设计)
3. **消息排序:** 并行回复可能以任何顺序到达
4. **速率限制:** 所有代理都计入 WhatsApp 速率限制

## 未来增强

计划的功能:
- [ ] 共享上下文模式(代理看到彼此的回复)
- [ ] 代理协调(代理可以相互发信号)
- [ ] 动态代理选择(根据消息内容选择代理)
- [ ] 代理优先级(某些代理在其他代理之前响应)

## 另请参阅

- [多代理配置](/multi-agent-sandbox-tools)
- [路由配置](/concepts/channel-routing)
- [会话管理](/concepts/sessions)
