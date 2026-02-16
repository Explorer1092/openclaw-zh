---
mmh3_hash: "0e5536dca37de52e1b2bfe64f44f17c3"
summary: "Agent workspace: 位置、布局和备份策略"
read_when:
  - 你需要解释 agent workspace 或其文件布局
  - 你想要备份或迁移 agent workspace
title: "Agent Workspace"
---

# Agent workspace

workspace 是 agent 的家。它是用于文件工具和 workspace context 的唯一工作目录。保持它的私密性并将其视为记忆。

这与 `~/.openclaw/` 是分开的,后者存储配置、凭据和 sessions。

**重要:** workspace 是**默认 cwd**,而不是硬沙箱。工具相对于 workspace 解析相对路径,但绝对路径仍然可以到达主机上的其他位置,除非启用沙箱。如果你需要隔离,使用
[`agents.defaults.sandbox`](/gateway/sandboxing) (和/或每个 agent 的沙箱配置)。
当启用沙箱且 `workspaceAccess` 不是 `"rw"` 时,工具在 `~/.openclaw/sandboxes` 下的沙箱 workspace 内运行,而不是你的主机 workspace。

## 默认位置

- 默认: `~/.openclaw/workspace`
- 如果设置了 `OPENCLAW_PROFILE` 且不是 `"default"`,默认值变为
  `~/.openclaw/workspace-<profile>`。
- 在 `~/.openclaw/openclaw.json` 中覆盖:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 将创建 workspace 并在缺失时填充 bootstrap 文件。

如果你已经自己管理 workspace 文件,可以禁用 bootstrap 文件创建:

```json5
{ agent: { skipBootstrap: true } }
```

## 额外的 workspace 文件夹

较旧的安装可能创建了 `~/openclaw`。保留多个 workspace 目录可能会导致令人困惑的认证或状态漂移,因为一次只有一个 workspace 处于活动状态。

**建议:** 保留一个活动的 workspace。如果你不再使用额外的文件夹,将它们归档或移到垃圾箱(例如 `trash ~/openclaw`)。
如果你有意保留多个 workspaces,确保 `agents.defaults.workspace` 指向活动的那个。

当 `openclaw doctor` 检测到额外的 workspace 目录时会发出警告。

## Workspace 文件映射(每个文件的含义)

这些是 OpenClaw 在 workspace 内期望的标准文件:

- `AGENTS.md`
  - Agent 的操作说明以及如何使用记忆。
  - 在每个 session 开始时加载。
  - 适合存放规则、优先级和"如何行为"的详细信息。

- `SOUL.md`
  - 人格、语气和边界。
  - 每个 session 加载。

- `USER.md`
  - 用户是谁以及如何称呼他们。
  - 每个 session 加载。

- `IDENTITY.md`
  - Agent 的名字、氛围和表情符号。
  - 在 bootstrap 仪式期间创建/更新。

- `TOOLS.md`
  - 关于你的本地工具和约定的注释。
  - 不控制工具可用性;它只是指导。

- `HEARTBEAT.md`
  - heartbeat 运行的可选小清单。
  - 保持简短以避免令牌消耗。

- `BOOT.md`
  - 当启用 internal hooks 时在 gateway 重启时执行的可选启动清单。
  - 保持简短;使用 message 工具进行出站发送。

- `BOOTSTRAP.md`
  - 一次性首次运行仪式。
  - 仅为全新 workspace 创建。
  - 仪式完成后删除它。

- `memory/YYYY-MM-DD.md`
  - 每日记忆日志(每天一个文件)。
  - 建议在 session 开始时读取今天 + 昨天。

- `MEMORY.md` (可选)
  - 精心策划的长期记忆。
  - 仅在主要的私有 session 中加载(不在共享/群组上下文中)。

参见 [Memory](/concepts/memory) 了解工作流程和自动记忆刷新。

- `skills/` (可选)
  - 特定于 workspace 的 skills。
  - 当名称冲突时覆盖托管/捆绑的 skills。

- `canvas/` (可选)
  - 用于节点显示的 Canvas UI 文件(例如 `canvas/index.html`)。

如果缺少任何 bootstrap 文件,OpenClaw 会在 session 中注入一个"缺失文件"标记并继续。大型 bootstrap 文件在注入时会被截断;使用 `agents.defaults.bootstrapMaxChars` 调整限制(默认: 20000)。
`openclaw setup` 可以重新创建缺失的默认值而不覆盖现有文件。

## workspace 中没有的内容

这些位于 `~/.openclaw/` 下,不应提交到 workspace 仓库:

- `~/.openclaw/openclaw.json` (配置)
- `~/.openclaw/credentials/` (OAuth tokens, API keys)
- `~/.openclaw/agents/<agentId>/sessions/` (session 记录 + 元数据)
- `~/.openclaw/skills/` (托管 skills)

如果你需要迁移 sessions 或配置,单独复制它们并将它们排除在版本控制之外。

## Git 备份(推荐,私有)

将 workspace 视为私有记忆。将其放入**私有** git 仓库中,以便备份和恢复。

在运行 Gateway 的机器上运行这些步骤(即 workspace 所在的位置)。

### 1) 初始化仓库

如果安装了 git,全新的 workspaces 会自动初始化。如果此 workspace 还不是仓库,运行:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) 添加私有远程(初学者友好选项)

选项 A: GitHub web UI

1. 在 GitHub 上创建一个新的**私有**仓库。
2. 不要使用 README 初始化(避免合并冲突)。
3. 复制 HTTPS 远程 URL。
4. 添加远程并推送:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

选项 B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

选项 C: GitLab web UI

1. 在 GitLab 上创建一个新的**私有**仓库。
2. 不要使用 README 初始化(避免合并冲突)。
3. 复制 HTTPS 远程 URL。
4. 添加远程并推送:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) 持续更新

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## 不要提交密钥

即使在私有仓库中,也要避免在 workspace 中存储密钥:

- API keys、OAuth tokens、密码或私有凭据。
- `~/.openclaw/` 下的任何内容。
- 聊天记录或敏感附件的原始转储。

如果你必须存储敏感引用,使用占位符并将真实密钥保存在其他地方(密码管理器、环境变量或 `~/.openclaw/`)。

建议的 `.gitignore` 起点:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 将 workspace 移动到新机器

1. 将仓库克隆到所需路径(默认 `~/.openclaw/workspace`)。
2. 在 `~/.openclaw/openclaw.json` 中将 `agents.defaults.workspace` 设置为该路径。
3. 运行 `openclaw setup --workspace <path>` 来填充任何缺失的文件。
4. 如果你需要 sessions,从旧机器单独复制 `~/.openclaw/agents/<agentId>/sessions/`。

## 高级注意事项

- Multi-agent 路由可以为每个 agent 使用不同的 workspaces。参见
  [Channel routing](/channels/channel-routing) 了解路由配置。
- 如果启用了 `agents.defaults.sandbox`,非主 sessions 可以使用 `agents.defaults.sandbox.workspaceRoot` 下的每个 session 沙箱 workspaces。
