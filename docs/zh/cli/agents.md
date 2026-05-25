---
mmh3_hash: "9889132b47ee645356bd58db13e7bd55"
summary: "`openclaw agents` 的 CLI 参考（列出/添加/删除/绑定/解绑/设置身份）"
read_when:
  - 您想要多个隔离的 Agent（工作区 + 路由 + 身份验证）
title: "Agents"
---

# `openclaw agents`

管理隔离的 Agent（工作区 + 身份验证 + 路由）。

相关：

- 多 Agent 路由：[Multi-agent routing](/concepts/multi-agent)
- Agent 工作区：[Agent workspace](/concepts/agent-workspace)
- Skill 可见性配置：[Skills config](/tools/skills-config)

## 示例

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## 路由绑定

使用路由绑定将入站 Channel 流量固定到特定 Agent。

如果您还想要每个 Agent 具有不同的可见 Skill，请在 `openclaw.json` 中配置 `agents.defaults.skills` 和 `agents.list[].skills`。请参阅 [Skills config](/tools/skills-config) 和 [配置参考](/gateway/config-agents#agents-defaults-skills)。

列出绑定：

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

添加绑定：

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

您也可以在创建 Agent 时添加绑定：

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

如果省略 `accountId`（`--bind <channel>`），OpenClaw 会从 Plugin 设置 Hook、强制账户绑定或 Channel 已配置账户数量中解析它。

如果省略 `bind` 或 `unbind` 的 `--agent`，OpenClaw 以当前默认 Agent 为目标。

### `--bind` 格式

| 格式                           | 含义                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `--bind <channel>:*`           | 匹配 Channel 上的所有账户。                                                             |
| `--bind <channel>:<account>`   | 匹配一个账户。                                                                          |
| `--bind <channel>`             | 仅匹配默认账户，除非 CLI 能安全解析 Plugin 特定的账户范围。                              |

### 绑定范围行为

- 没有 `accountId` 的绑定仅匹配 Channel 默认账户。
- `accountId: "*"` 是全 Channel 回退（所有账户），其特异性低于显式账户绑定。
- 如果同一 Agent 已有匹配的不含 `accountId` 的 Channel 绑定，而您稍后绑定了显式或已解析的 `accountId`，OpenClaw 会就地升级现有绑定，而不是添加重复项。

示例：

```bash
# 匹配 Channel 上的所有账户
openclaw agents bind --agent work --bind telegram:*

# 匹配特定账户
openclaw agents bind --agent work --bind telegram:ops

# 初始的仅 Channel 绑定
openclaw agents bind --agent work --bind telegram

# 之后升级为账户范围的绑定
openclaw agents bind --agent work --bind telegram:alerts
```

升级后，该绑定的路由范围限定为 `telegram:alerts`。如果您还想要默认账户路由，请显式添加（例如 `--bind telegram:default`）。

删除绑定：

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` 接受 `--all` 或一个或多个 `--bind` 值，但不能同时接受两者。

## 命令界面

### `agents`

不带子命令运行 `openclaw agents` 等同于 `openclaw agents list`。

### `agents list`

选项：

- `--json`
- `--bindings`：包含完整的路由规则，而不仅仅是每个 Agent 的计数/摘要

### `agents add [name]`

选项：

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>`（可重复）
- `--non-interactive`
- `--json`

注意：

- 传递任何显式的 add 标志会将命令切换到非交互路径。
- 非交互模式需要 Agent 名称和 `--workspace`。
- `main` 是保留的，不能用作新 Agent ID。
- 在交互模式下，身份验证播种仅复制可移植的静态配置文件（默认为 `api_key` 和静态 `token`）。OAuth 刷新 Token 配置文件仍仅通过读取继承从真实的 `main` Agent 存储获得。如果配置的默认 Agent 不是 `main`，请为新 Agent 上的 OAuth 配置文件单独登录。

### `agents bindings`

选项：

- `--agent <id>`
- `--json`

### `agents bind`

选项：

- `--agent <id>`（默认为当前默认 Agent）
- `--bind <channel[:accountId]>`（可重复）
- `--json`

### `agents unbind`

选项：

- `--agent <id>`（默认为当前默认 Agent）
- `--bind <channel[:accountId]>`（可重复）
- `--all`
- `--json`

### `agents delete <id>`

选项：

- `--force`
- `--json`

注意：

- `main` 不能被删除。
- 不带 `--force` 时，需要交互式确认。
- 工作区、Agent 状态和 Session 转录目录被移到废纸篓，而不是直接删除。
- 当 Gateway 可访问时，删除通过 Gateway 发送，以便配置和 Session 存储清理与运行时流量共享同一写入器。如果无法访问 Gateway，CLI 回退到离线本地路径。
- 如果另一个 Agent 的工作区与此工作区相同、在此工作区内部或包含此工作区，则保留工作区，`--json` 报告 `workspaceRetained`、`workspaceRetainedReason` 和 `workspaceSharedWith`。

## 身份文件

每个 Agent 工作区可以在工作区根目录包含一个 `IDENTITY.md`：

- 示例路径：`~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` 从工作区根目录读取（或使用显式的 `--identity-file`）

头像路径相对于工作区根目录解析。

## 设置身份

`set-identity` 将字段写入 `agents.list[].identity`：

- `name`
- `theme`
- `emoji`
- `avatar`（工作区相对路径、http(s) URL 或 data URI）

选项：

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

注意：

- 可以使用 `--agent` 或 `--workspace` 选择目标 Agent。
- 如果您依赖 `--workspace` 且多个 Agent 共享该工作区，命令会失败并要求您传递 `--agent`。
- 当未提供显式身份字段时，命令从 `IDENTITY.md` 读取身份数据。

从 `IDENTITY.md` 加载：

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

显式覆盖字段：

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

配置示例：

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## 相关

- [CLI 参考](/cli)
- [多 Agent 路由](/concepts/multi-agent)
- [Agent 工作区](/concepts/agent-workspace)
