---
title: "`openclaw agents`"
sidebarTitle: "openclaw agents"
mmh3_hash: "bb3aaacc99e810b50dc5788cacd83f2c"
summary: "`openclaw agents` 的 CLI 参考(列出/添加/删除/设置身份)"
read_when:
  - 您想要多个隔离的代理(工作区 + 路由 + 身份验证)
---

# `openclaw agents`

管理隔离的代理(工作区 + 身份验证 + 路由)。

相关:
- 多代理路由:[多代理路由](/concepts/multi-agent)
- 代理工作区:[代理工作区](/concepts/agent-workspace)

## 示例

```bash
openclaw agents list
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## 身份文件

每个代理工作区可以在工作区根目录包含一个 `IDENTITY.md`:
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
          avatar: "avatars/openclaw.png"
        }
      }
    ]
  }
}
```
