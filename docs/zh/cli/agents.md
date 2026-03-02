---
title: "`openclaw agents`"
sidebarTitle: "openclaw agents"
mmh3_hash: "46bf13e19a8c294fc66bb08e89966644"
summary: "`openclaw agents` 的 CLI 参考(列出/添加/删除/绑定/解绑/设置身份)"
read_when:
  - 您想要多个隔离的 Agent(工作区 + 路由 + 身份验证)
---

# `openclaw agents`

管理隔离的 Agent(工作区 + 身份验证 + 路由)。

相关:

- 多 Agent 路由:[Multi-Agent Routing](/concepts/multi-agent)
- Agent 工作区:[Agent workspace](/concepts/agent-workspace)

## 示例

```bash
openclaw agents list
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## 路由绑定

使用路由绑定将入站 Channel 流量固定到特定 Agent。

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
