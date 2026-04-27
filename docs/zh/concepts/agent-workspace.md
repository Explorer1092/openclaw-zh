---
mmh3_hash: "392e4a000e6330a0d07e63bf6c69cca2"
summary: "Agent workspace: 位置、布局和备份策略"
read_when:
  - 您需要解释 Agent workspace 或其文件布局
  - 您想要备份或迁移 Agent workspace
title: "Agent Workspace"
sidebarTitle: "Agent Workspace"
---

workspace 是 Agent 的家。它是用于文件工具和 workspace context 的唯一工作目录。保持它的私密性并将其视为记忆。

这与 `~/.openclaw/` 是分开的，后者存储配置、凭据和 Session。

<Warning>
workspace 是**默认 cwd**，而不是硬沙箱。工具相对于 workspace 解析相对路径，但绝对路径仍然可以到达主机上的其他位置，除非启用沙箱。如果您需要隔离，使用
[`agents.defaults.sandbox`](/gateway/sandboxing)（和/或每个 Agent 的沙箱配置）。

当启用沙箱且 `workspaceAccess` 不是 `"rw"` 时，工具在 `~/.openclaw/sandboxes` 下的沙箱 workspace 内运行，而不是您的主机 workspace。
</Warning>

## 默认位置

- 默认：`~/.openclaw/workspace`
- 如果设置了 `OPENCLAW_PROFILE` 且不是 `"default"`，默认值变为 `~/.openclaw/workspace-<profile>`。
- 在 `~/.openclaw/openclaw.json` 中覆盖：

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 将创建 workspace 并在缺失时填充 bootstrap 文件。

<Note>
沙盒种子复制仅接受 workspace 内的常规文件；解析到源 workspace 之外的 symlink/hardlink 别名将被忽略。
</Note>

如果您已经自己管理 workspace 文件，可以禁用 bootstrap 文件创建：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 额外的 workspace 文件夹

较旧的安装可能创建了 `~/openclaw`。保留多个 workspace 目录可能会导致令人困惑的认证或状态漂移，因为一次只有一个 workspace 处于活动状态。

<Note>
**建议：** 保留一个活动的 workspace。如果您不再使用额外的文件夹，将它们归档或移到垃圾箱（例如 `trash ~/openclaw`）。如果您有意保留多个 workspace，确保 `agents.defaults.workspace` 指向活动的那个。

当 `openclaw doctor` 检测到额外的 workspace 目录时会发出警告。
</Note>

## Workspace 文件映射

这些是 OpenClaw 在 workspace 内期望的标准文件：

<AccordionGroup>
  <Accordion title="AGENTS.md — 操作说明">
    Agent 的操作说明以及如何使用记忆。在每个 Session 开始时加载。适合存放规则、优先级和"如何行为"的详细信息。
  </Accordion>
  <Accordion title="SOUL.md — 人格和语气">
    人格、语气和边界。每个 Session 加载。指南：[SOUL.md 个性指南](/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md — 用户是谁">
    用户是谁以及如何称呼他们。每个 Session 加载。
  </Accordion>
  <Accordion title="IDENTITY.md — 名字、氛围、表情符号">
    Agent 的名字、氛围和表情符号。在 bootstrap 仪式期间创建/更新。
  </Accordion>
  <Accordion title="TOOLS.md — 本地工具约定">
    关于您的本地工具和约定的注释。不控制工具可用性；它只是指导。
  </Accordion>
  <Accordion title="HEARTBEAT.md — heartbeat 清单">
    heartbeat 运行的可选小清单。保持简短以避免 token 消耗。
  </Accordion>
  <Accordion title="BOOT.md — 启动清单">
    当启用 [internal hooks](/automation/hooks) 时在 Gateway 重启时自动运行的可选启动清单。保持简短；使用 message 工具进行出站发送。
  </Accordion>
  <Accordion title="BOOTSTRAP.md — 首次运行仪式">
    一次性首次运行仪式。仅为全新 workspace 创建。仪式完成后删除它。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — 每日记忆日志">
    每日记忆日志（每天一个文件）。建议在 Session 开始时读取今天 + 昨天。
  </Accordion>
  <Accordion title="MEMORY.md — 精心策划的长期记忆（可选）">
    精心策划的长期记忆。仅在主要的私有 Session 中加载（不在共享/群组上下文中）。参见 [Memory](/concepts/memory) 了解工作流程和自动记忆刷新。
  </Accordion>
  <Accordion title="skills/ — workspace skills（可选）">
    特定于 workspace 的 Skills。该 workspace 中最高优先级的 Skill 位置。当名称冲突时覆盖项目 Agent Skills、个人 Agent Skills、托管 Skills、捆绑 Skills 和 `skills.load.extraDirs`。
  </Accordion>
  <Accordion title="canvas/ — Canvas UI 文件（可选）">
    用于节点显示的 Canvas UI 文件（例如 `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
如果缺少任何 bootstrap 文件，OpenClaw 会在 Session 中注入一个"缺失文件"标记并继续。大型 bootstrap 文件在注入时会被截断；使用 `agents.defaults.bootstrapMaxChars`（默认：12000）和 `agents.defaults.bootstrapTotalMaxChars`（默认：60000）调整限制。`openclaw setup` 可以重新创建缺失的默认值而不覆盖现有文件。
</Note>

## workspace 中没有的内容

这些位于 `~/.openclaw/` 下，不应提交到 workspace 仓库：

- `~/.openclaw/openclaw.json`（配置）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（model auth profiles：OAuth + API 密钥）
- `~/.openclaw/credentials/`（Channel/provider 状态以及旧版 OAuth 导入数据）
- `~/.openclaw/agents/<agentId>/sessions/`（Session 记录 + 元数据）
- `~/.openclaw/skills/`（托管 Skills）

如果您需要迁移 Session 或配置，单独复制它们并将它们排除在版本控制之外。

## Git 备份（推荐，私有）

将 workspace 视为私有记忆。将其放入**私有** git 仓库中，以便备份和恢复。

在运行 Gateway 的机器上运行这些步骤（即 workspace 所在的位置）。

<Steps>
  <Step title="初始化仓库">
    如果安装了 git，全新的 workspace 会自动初始化。如果此 workspace 还不是仓库，运行：

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="添加私有远程">
    <Tabs>
      <Tab title="GitHub web UI">
        1. 在 GitHub 上创建一个新的**私有**仓库。
        2. 不要使用 README 初始化（避免合并冲突）。
        3. 复制 HTTPS 远程 URL。
        4. 添加远程并推送：

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. 在 GitLab 上创建一个新的**私有**仓库。
        2. 不要使用 README 初始化（避免合并冲突）。
        3. 复制 HTTPS 远程 URL。
        4. 添加远程并推送：

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="持续更新">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## 不要提交密钥

<Warning>
即使在私有仓库中，也要避免在 workspace 中存储密钥：

- API keys、OAuth tokens、密码或私有凭据。
- `~/.openclaw/` 下的任何内容。
- 聊天记录或敏感附件的原始转储。

如果您必须存储敏感引用，使用占位符并将真实密钥保存在其他地方（密码管理器、环境变量或 `~/.openclaw/`）。
</Warning>

建议的 `.gitignore` 起点：

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 将 workspace 移动到新机器

<Steps>
  <Step title="克隆仓库">
    将仓库克隆到所需路径（默认 `~/.openclaw/workspace`）。
  </Step>
  <Step title="更新配置">
    在 `~/.openclaw/openclaw.json` 中将 `agents.defaults.workspace` 设置为该路径。
  </Step>
  <Step title="填充缺失文件">
    运行 `openclaw setup --workspace <path>` 来填充任何缺失的文件。
  </Step>
  <Step title="复制 Session（可选）">
    如果您需要 Session，从旧机器单独复制 `~/.openclaw/agents/<agentId>/sessions/`。
  </Step>
</Steps>

## 高级注意事项

- Multi-agent 路由可以为每个 Agent 使用不同的 workspace。参见 [Channel routing](/channels/channel-routing) 了解路由配置。
- 如果启用了 `agents.defaults.sandbox`，非主 Session 可以使用 `agents.defaults.sandbox.workspaceRoot` 下的每个 Session 沙箱 workspace。

## 相关链接

- [Heartbeat](/gateway/heartbeat) — HEARTBEAT.md workspace 文件
- [Sandboxing](/gateway/sandboxing) — 沙盒环境中的 workspace 访问
- [Session](/concepts/session) — Session 存储路径
- [Standing Orders](/automation/standing-orders) — workspace 文件中的持久指令
