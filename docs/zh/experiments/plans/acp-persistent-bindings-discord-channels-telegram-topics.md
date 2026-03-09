---
mmh3_hash: "b590ba71403ae472974da9cdd15c074d"
---
# ACP 持久绑定：Discord Channel 与 Telegram Topic

状态：草案

## 摘要

引入持久 ACP 绑定，将以下内容映射到长期 ACP Session：

- Discord Channel（以及在需要时的现有线程），以及
- 群组/超级群组中的 Telegram 论坛 Topic（`chatId:topic:topicId`）

绑定状态使用具有明确绑定类型的顶层 `bindings[]` 条目存储。

这使 ACP 在高流量消息 Channel 中的使用变得可预测且持久，用户可以创建专用的 Channel/Topic，如 `codex`、`claude-1` 或 `claude-myrepo`。

## 背景

当前基于线程的 ACP 行为针对临时 Discord 线程工作流进行了优化。Telegram 没有相同的线程模型；它在群组/超级群组中有论坛 Topic。用户希望在聊天界面中拥有稳定的、始终在线的 ACP"工作区"，而不仅仅是临时线程 Session。

## 目标

- 支持以下内容的持久 ACP 绑定：
  - Discord Channel/线程
  - Telegram 论坛 Topic（群组/超级群组）
- 使绑定的配置成为事实来源。
- 保持 `/acp`、`/new`、`/reset`、`/focus` 以及交付行为在 Discord 和 Telegram 之间的一致性。
- 为临时用法保留现有的临时绑定流程。

## 非目标

- 完全重新设计 ACP 运行时/Session 内部实现。
- 移除现有的临时绑定流程。
- 在第一次迭代中扩展到每个 Channel。
- 在本阶段实现 Telegram Channel 直接消息 Topic（`direct_messages_topic_id`）。
- 在本阶段实现 Telegram 私聊 Topic 变体。

## UX 方向

### 1) 两种绑定类型

- **持久绑定**：保存在配置中，在启动时进行协调，用于"命名工作区"Channel/Topic。
- **临时绑定**：仅运行时，按空闲/最大存活时间策略过期。

### 2) 命令行为

- `/acp spawn ... --thread here|auto|off` 继续可用。
- 添加明确的绑定生命周期控制：
  - `/acp bind [session|agent] [--persist]`
  - `/acp unbind [--persist]`
  - `/acp status` 包含绑定是 `persistent`（持久）还是 `temporary`（临时）的信息。
- 在已绑定的对话中，`/new` 和 `/reset` 就地重置已绑定的 ACP Session 并保持绑定不变。

### 3) 对话标识

- 使用规范对话 ID：
  - Discord：Channel/线程 ID。
  - Telegram Topic：`chatId:topic:topicId`。
- 永远不要单独使用裸 Topic ID 作为 Telegram 绑定的键。

## 配置模型（提案）

在顶层 `bindings[]` 中使用明确的 `type` 鉴别器统一路由和持久 ACP 绑定配置：

```jsonc
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace-main",
        "runtime": { "type": "embedded" },
      },
      {
        "id": "codex",
        "workspace": "~/.openclaw/workspace-codex",
        "runtime": {
          "type": "acp",
          "acp": {
            "agent": "codex",
            "backend": "acpx",
            "mode": "persistent",
            "cwd": "/workspace/repo-a",
          },
        },
      },
      {
        "id": "claude",
        "workspace": "~/.openclaw/workspace-claude",
        "runtime": {
          "type": "acp",
          "acp": {
            "agent": "claude",
            "backend": "acpx",
            "mode": "persistent",
            "cwd": "/workspace/repo-b",
          },
        },
      },
    ],
  },
  "acp": {
    "enabled": true,
    "backend": "acpx",
    "allowedAgents": ["codex", "claude"],
  },
  "bindings": [
    // 路由绑定（现有行为）
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "discord", "accountId": "default" },
    },
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "telegram", "accountId": "default" },
    },
    // 持久 ACP 对话绑定
    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "222222222222222222" },
      },
      "acp": {
        "label": "codex-main",
        "mode": "persistent",
        "cwd": "/workspace/repo-a",
        "backend": "acpx",
      },
    },
    {
      "type": "acp",
      "agentId": "claude",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "333333333333333333" },
      },
      "acp": {
        "label": "claude-repo-b",
        "mode": "persistent",
        "cwd": "/workspace/repo-b",
      },
    },
    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "telegram",
        "accountId": "default",
        "peer": { "kind": "group", "id": "-1001234567890:topic:42" },
      },
      "acp": {
        "label": "tg-codex-42",
        "mode": "persistent",
      },
    },
  ],
  "channels": {
    "discord": {
      "guilds": {
        "111111111111111111": {
          "channels": {
            "222222222222222222": {
              "enabled": true,
              "requireMention": false,
            },
            "333333333333333333": {
              "enabled": true,
              "requireMention": false,
            },
          },
        },
      },
    },
    "telegram": {
      "groups": {
        "-1001234567890": {
          "topics": {
            "42": {
              "requireMention": false,
            },
          },
        },
      },
    },
  },
}
```

### 最简示例（无每绑定 ACP 覆盖）

```jsonc
{
  "agents": {
    "list": [
      { "id": "main", "default": true, "runtime": { "type": "embedded" } },
      {
        "id": "codex",
        "runtime": {
          "type": "acp",
          "acp": { "agent": "codex", "backend": "acpx", "mode": "persistent" },
        },
      },
      {
        "id": "claude",
        "runtime": {
          "type": "acp",
          "acp": { "agent": "claude", "backend": "acpx", "mode": "persistent" },
        },
      },
    ],
  },
  "acp": { "enabled": true, "backend": "acpx" },
  "bindings": [
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "discord", "accountId": "default" },
    },
    {
      "type": "route",
      "agentId": "main",
      "match": { "channel": "telegram", "accountId": "default" },
    },

    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "222222222222222222" },
      },
    },
    {
      "type": "acp",
      "agentId": "claude",
      "match": {
        "channel": "discord",
        "accountId": "default",
        "peer": { "kind": "channel", "id": "333333333333333333" },
      },
    },
    {
      "type": "acp",
      "agentId": "codex",
      "match": {
        "channel": "telegram",
        "accountId": "default",
        "peer": { "kind": "group", "id": "-1009876543210:topic:5" },
      },
    },
  ],
}
```

说明：

- `bindings[].type` 是明确的：
  - `route`：正常的 Agent 路由。
  - `acp`：针对匹配对话的持久 ACP 框架绑定。
- 对于 `type: "acp"`，`match.peer.id` 是规范对话键：
  - Discord Channel/线程：原始 Channel/线程 ID。
  - Telegram Topic：`chatId:topic:topicId`。
- `bindings[].acp.backend` 是可选的。Backend 回退顺序：
  1. `bindings[].acp.backend`
  2. `agents.list[].runtime.acp.backend`
  3. 全局 `acp.backend`
- `mode`、`cwd` 和 `label` 遵循相同的覆盖模式（`绑定覆盖 -> Agent 运行时默认值 -> 全局/默认行为`）。
- 保留现有的 `session.threadBindings.*` 和 `channels.discord.threadBindings.*` 用于临时绑定策略。
- 持久条目声明所需状态；运行时协调到实际的 ACP Session/绑定。
- 每个对话 Node 有一个活跃 ACP 绑定是预期模型。
- 向后兼容性：缺少 `type` 的条目被解释为 `route` 以兼容旧条目。

### Backend 选择

- ACP Session 初始化在生成时已使用配置的 backend 选择（今天的 `acp.backend`）。
- 本提案扩展了生成/协调逻辑，以优先使用类型化 ACP 绑定覆盖：
  - `bindings[].acp.backend` 用于对话本地覆盖。
  - `agents.list[].runtime.acp.backend` 用于每 Agent 默认值。
- 如果不存在覆盖，则保持当前行为（`acp.backend` 默认值）。

## 与当前系统的架构契合

### 复用现有组件

- `SessionBindingService` 已支持与 Channel 无关的对话引用。
- ACP 生成/绑定流程已通过服务 API 支持绑定。
- Telegram 已通过 `MessageThreadId` 和 `chatId` 携带 Topic/线程上下文。

### 新增/扩展组件

- **Telegram 绑定适配器**（与 Discord 适配器并行）：
  - 为每个 Telegram 账户注册适配器，
  - 按规范对话 ID 进行解析/列出/绑定/解绑/触发。
- **类型化绑定解析器/索引**：
  - 将 `bindings[]` 拆分为 `route` 和 `acp` 视图，
  - 仅在 `route` 绑定上保留 `resolveAgentRoute`，
  - 仅从 `acp` 绑定解析持久 ACP 意图。
- **Telegram 的入站绑定解析**：
  - 在路由最终确定之前解析已绑定的 Session（Discord 已经这样做）。
- **持久绑定协调器**：
  - 启动时：加载已配置的顶层 `type: "acp"` 绑定，确保 ACP Session 存在，确保绑定存在。
  - 配置更改时：安全地应用增量。
- **切换模型**：
  - 不读取 Channel 本地 ACP 绑定回退，
  - 持久 ACP 绑定仅来自顶层 `bindings[].type="acp"` 条目。

## 分阶段交付

### 阶段 1：类型化绑定 Schema 基础

- 扩展配置 Schema 以支持 `bindings[].type` 鉴别器：
  - `route`，
  - `acp` 带可选 `acp` 覆盖对象（`mode`、`backend`、`cwd`、`label`）。
- 扩展 Agent Schema，添加运行时描述符以标记 ACP 原生 Agent（`agents.list[].runtime.type`）。
- 添加路由与 ACP 绑定的解析器/索引拆分。

### 阶段 2：运行时解析 + Discord/Telegram 功能对等

- 从顶层 `type: "acp"` 条目解析持久 ACP 绑定，用于：
  - Discord Channel/线程，
  - Telegram 论坛 Topic（`chatId:topic:topicId` 规范 ID）。
- 实现 Telegram 绑定适配器以及与 Discord 的入站已绑定 Session 覆盖功能对等。
- 本阶段不包含 Telegram 直接/私聊 Topic 变体。

### 阶段 3：命令对等和重置

- 对齐已绑定 Telegram/Discord 对话中的 `/acp`、`/new`、`/reset` 和 `/focus` 行为。
- 确保绑定在重置流程中按配置保持。

### 阶段 4：强化

- 更好的诊断（`/acp status`、启动协调日志）。
- 冲突处理和健康检查。

## 安全措施和策略

- 完全按照现在的方式遵守 ACP 启用和沙箱限制。
- 保持明确的账户范围（`accountId`）以避免跨账户污染。
- 在路由不明确时关闭失败。
- 保持每个 Channel 配置中的提及/访问策略行为明确。

## 测试计划

- 单元测试：
  - 对话 ID 规范化（尤其是 Telegram Topic ID），
  - 协调器的创建/更新/删除路径，
  - `/acp bind --persist` 和解绑流程。
- 集成测试：
  - 入站 Telegram Topic -> 已绑定 ACP Session 解析，
  - 入站 Discord Channel/线程 -> 持久绑定优先级。
- 回归测试：
  - 临时绑定继续工作，
  - 未绑定的 Channel/Topic 保持当前路由行为。

## 开放问题

- Telegram Topic 中的 `/acp spawn --thread auto` 是否应默认为 `here`？
- 持久绑定是否应始终在已绑定对话中绕过提及门控，或者需要明确的 `requireMention=false`？
- `/focus` 是否应将 `--persist` 作为 `/acp bind --persist` 的别名？

## 推广

- 以每对话选择加入方式发布（存在 `bindings[].type="acp"` 条目）。
- 仅从 Discord + Telegram 开始。
- 添加包含以下示例的文档：
  - "每个 Channel/Topic 对应一个 Agent"
  - "同一 Agent 的多个 Channel/Topic 使用不同的 `cwd`"
  - "团队命名模式（`codex-1`、`claude-repo-x`）"。
