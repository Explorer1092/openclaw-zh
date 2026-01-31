---
title: "智能体工作区"
sidebarTitle: "智能体工作区"
mmh3_hash: "eeae1c937d93a39cb96deb59e1a5f0e5"
summary: "Agent workspace: 位置、布局和备份策略"
read_when:
  - 你需要解释 agent workspace 或其文件布局
  - 你想要备份或迁移 agent workspace
---
# 智能体工作区

workspace 是 agent 的主目录。它是用于文件工具和 workspace context 的唯一工作目录。保持它私密并将其视为记忆。

这与 `~/.openclaw/` 是分开的,后者存储配置、凭据和 sessions。

**重要:** workspace 是 **默认 cwd**,而不是硬沙盒。工具会针对 workspace 解析相对路径,但绝对路径仍然可以访问主机上的其他位置,除非启用了沙盒。如果需要隔离,请使用 [`agents.defaults.sandbox`](/zh/gateway/sandboxing) (和/或每个 agent 的沙盒配置)。当启用沙盒且 `workspaceAccess` 不是 `"rw"` 时,工具在 `~/.openclaw/sandboxes` 下的沙盒 workspace 中操作,而不是你的主机 workspace。

## 默认位置

- 默认值: `~/.openclaw/workspace`
- 如果设置了 `OPENCLAW_PROFILE` 且不是 `"default"`,默认值变为
  `~/.openclaw/workspace-<profile>`。
- 在 `~/.openclaw/openclaw.json` 中覆盖:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace"
  }
}
```

`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 将创建 workspace 并在缺少时植入 bootstrap 文件。

如果你已经自己管理 workspace 文件,可以禁用 bootstrap 文件创建:

```json5
{ agent: { skipBootstrap: true } }
```

## 额外的 workspace 文件夹

较旧的安装可能创建了 `~/openclaw`。保留多个 workspace 目录可能会导致混淆的 auth 或状态漂移,因为一次只有一个 workspace 处于活动状态。

**建议:** 保留单个活动 workspace。如果你不再使用额外的文件夹,请将它们归档或移至回收站(例如 `trash ~/openclaw`)。如果你有意保留多个 workspaces,请确保 `agents.defaults.workspace` 指向活动的那个。

当检测到额外的 workspace 目录时,`openclaw doctor` 会发出警告。

## Workspace 文件映射(每个文件的含义)

这些是 OpenClaw 在 workspace 中期望的标准文件:

- `AGENTS.md`
  - Agent 的操作说明以及它应该如何使用内存。
  - 在每个 session 开始时加载。
  - 适合放置规则、优先级和"如何行为"的详细信息。

- `SOUL.md`
  - 人格、语气和边界。
  - 每个 session 加载。

- `USER.md`
  - 用户是谁以及如何称呼他们。
  - 每个 session 加载。

- `IDENTITY.md`
  - Agent 的名称、氛围和表情符号。
  - 在 bootstrap 仪式期间创建/更新。

- `TOOLS.md`
  - 关于你的本地工具和约定的注释。
  - 不控制工具可用性;它只是指导。

- `HEARTBEAT.md`
  - heartbeat 运行的可选小型检查清单。
  - 保持简短以避免 token 消耗。

- `BOOT.md`
  - 启用 internal hooks 时在 gateway 重启时执行的可选启动检查清单。
  - 保持简短;使用 message tool 进行出站发送。

- `BOOTSTRAP.md`
  - 一次性首次运行仪式。
  - 仅为全新 workspace 创建。
  - 仪式完成后删除它。

- `memory/YYYY-MM-DD.md`
  - 每日内存日志(每天一个文件)。
  - 建议在 session 开始时读取今天 + 昨天。

- `MEMORY.md` (可选)
  - 精选的长期记忆。
  - 仅在主要私有 session 中加载(不在共享/group contexts 中)。

参见 [Memory](/zh/concepts/memory) 了解工作流程和自动内存刷新。

- `skills/` (可选)
  - Workspace 特定的 skills。
  - 当名称冲突时覆盖托管/捆绑的 skills。

- `canvas/` (可选)
  - node 显示的 Canvas UI 文件(例如 `canvas/index.html`)。

如果任何 bootstrap 文件缺失,OpenClaw 会将"缺失文件"标记注入 session 并继续。注入时会截断大型 bootstrap 文件;使用 `agents.defaults.bootstrapMaxChars` 调整限制(默认: 20000)。`openclaw setup` 可以重新创建缺失的默认值而不覆盖现有文件。

## workspace 中没有什么

这些位于 `~/.openclaw/` 下,不应提交到 workspace repo:

- `~/.openclaw/openclaw.json` (配置)
- `~/.openclaw/credentials/` (OAuth tokens、API keys)
- `~/.openclaw/agents/<agentId>/sessions/` (session transcripts + 元数据)
- `~/.openclaw/skills/` (托管 skills)

如果需要迁移 sessions 或配置,请单独复制它们并将它们排除在版本控制之外。

## Git 备份(推荐,私有)

将 workspace 视为私有内存。将其放在 **私有** git repo 中,以便备份和恢复。

在运行 Gateway 的机器上运行这些步骤(这是 workspace 所在的位置)。

### 1) 初始化 repo

如果安装了 git,全新的 workspaces 会自动初始化。如果此 workspace 还不是 repo,请运行:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) 添加私有 remote(适合初学者的选项)

选项 A: GitHub web UI

1. 在 GitHub 上创建新的 **私有** repository。
2. 不要使用 README 初始化(避免合并冲突)。
3. 复制 HTTPS remote URL。
4. 添加 remote 并推送:

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

1. 在 GitLab 上创建新的 **私有** repository。
2. 不要使用 README 初始化(避免合并冲突)。
3. 复制 HTTPS remote URL。
4. 添加 remote 并推送:

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

## 不要提交 secrets

即使在私有 repo 中,也要避免在 workspace 中存储 secrets:

- API keys、OAuth tokens、passwords 或私有凭据。
- `~/.openclaw/` 下的任何内容。
- 聊天或敏感附件的原始转储。

如果必须存储敏感引用,请使用占位符并将真实 secret 保存在其他地方(密码管理器、环境变量或 `~/.openclaw/`)。

建议的 `.gitignore` 起始点:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 将 workspace 移动到新机器

1. 将 repo 克隆到所需路径(默认 `~/.openclaw/workspace`)。
2. 在 `~/.openclaw/openclaw.json` 中将 `agents.defaults.workspace` 设置为该路径。
3. 运行 `openclaw setup --workspace <path>` 以植入任何缺失的文件。
4. 如果需要 sessions,请从旧机器单独复制 `~/.openclaw/agents/<agentId>/sessions/`。

## 高级注释

- Multi-agent 路由可以为每个 agent 使用不同的 workspaces。参见 [Channel routing](/zh/concepts/channel-routing) 了解路由配置。
- 如果启用了 `agents.defaults.sandbox`,非主 sessions 可以在 `agents.defaults.sandbox.workspaceRoot` 下使用每个 session 的沙盒 workspaces。
