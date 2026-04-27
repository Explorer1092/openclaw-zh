---
mmh3_hash: "5a608a49958519a0e04980d912322ab4"
title: "`openclaw agents`"
sidebarTitle: "openclaw agents"
summary: "`openclaw agents` 的 CLI 参考(列出/添加/删除/绑定/解绑/设置身份)"
read_when:
  - 您想要多个隔离的 Agent(工作区 + 路由 + 身份验证)
---

# `openclaw agents`

管理隔离的 Agent(工作区 + 身份验证 + 路由)。

相关:

- 多 Agent 路由:[Multi-Agent Routing](/concepts/multi-agent)
- Agent 工作区:[Agent workspace](/concepts/agent-workspace)
- Skill 可见性配置:[Skills config](/tools/skills-config)

## 示例

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
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

如果您还希望每个 Agent 有不同的可见 Skill,请在 `openclaw.json` 中配置
`agents.defaults.skills` 和 `agents.list[].skills`。参见
[Skills config](/tools/skills-config) 和
[Configuration reference](/gateway/config-agents#agents-defaults-skills)。

列出绑定:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

添加绑定:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

如果省略 `accountId`(`--bind <channel>`),OpenClaw 会在可用时从 Channel 默认值和插件设置 Hook 中解析它。

如果为 `bind` 或 `unbind` 省略 `--agent`,OpenClaw 以当前默认 Agent 为目标。

### 绑定范围行为

- 没有 `accountId` 的绑定仅匹配 Channel 默认账户。
- `accountId: "*"` 是 Channel 范围的回退(所有账户),比显式账户绑定的特异性更低。
- 如果同一 Agent 已经有一个没有 `accountId` 的匹配 Channel 绑定,之后您使用显式或解析的 `accountId` 进行绑定,OpenClaw 会就地升级现有绑定而不是添加重复项。

示例:

```bash
# 初始仅 Channel 绑定
openclaw agents bind --agent work --bind telegram

# 之后升级到账户范围的绑定
openclaw agents bind --agent work --bind telegram:ops
```

升级后,该绑定的路由范围限定为 `telegram:ops`。如果您还想要默认账户路由,请显式添加(例如 `--bind telegram:default`)。

删除绑定:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` 接受 `--all` 或一个或多个 `--bind` 值,但不能同时使用两者。

## 命令界面

### `agents`

不带子命令运行 `openclaw agents` 等同于 `openclaw agents list`。

### `agents list`

选项:

- `--json`
- `--bindings`:包含完整路由规则,而非仅每个 Agent 的计数/摘要

### `agents add [name]`

选项:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>`(可重复)
- `--non-interactive`
- `--json`

说明:

- 传递任何显式的添加标志会将命令切换到非交互路径。
- 非交互模式需要 Agent 名称和 `--workspace`。
- `main` 是保留名称,不能用作新的 Agent ID。

### `agents bindings`

选项:

- `--agent <id>`
- `--json`

### `agents bind`

选项:

- `--agent <id>`(默认为当前默认 Agent)
- `--bind <channel[:accountId]>`(可重复)
- `--json`

### `agents unbind`

选项:

- `--agent <id>`(默认为当前默认 Agent)
- `--bind <channel[:accountId]>`(可重复)
- `--all`
- `--json`

### `agents delete <id>`

选项:

- `--force`
- `--json`

说明:

- 不能删除 `main`。
- 不带 `--force` 时,需要交互式确认。
- 工作区、Agent 状态和 Session 记录目录会被移至回收站,而非直接删除。
- 如果另一个 Agent 的工作区与此工作区路径相同、在此工作区内部或包含此工作区,则工作区会被保留,且 `--json` 报告 `workspaceRetained`、`workspaceRetainedReason` 和 `workspaceSharedWith`。

## 身份文件

每个 Agent 工作区可以在工作区根目录包含一个 `IDENTITY.md`:

- 示例路径:`~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` 从工作区根目录读取(或显式的 `--identity-file`)

头像路径相对于工作区根目录解析。

## 设置身份

`set-identity` 将字段写入 `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar`(工作区相对路径、http(s) URL 或数据 URI)

选项:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

说明:

- `--agent` 或 `--workspace` 可用于选择目标 Agent。
- 如果依赖 `--workspace` 且多个 Agent 共享该工作区,命令会失败并要求传递 `--agent`。
- 当未提供显式身份字段时,命令从 `IDENTITY.md` 读取身份数据。

从 `IDENTITY.md` 加载:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

显式覆盖字段:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

配置示例:

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
