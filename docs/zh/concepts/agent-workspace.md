---
mmh3_hash: "394f6351b0f8124cd6a6823ecd71e12e"
summary: "Agent 工作区：位置、布局和备份策略"
read_when:
  - 您需要解释 Agent 工作区或其文件布局
  - 您想备份或迁移 Agent 工作区
title: "Agent 工作区"
sidebarTitle: "Agent 工作区"
---

工作区是 Agent 的主目录。它是文件工具和工作区上下文使用的唯一工作目录。将其保密并视为 Memory。

这与存储配置、凭据和 Session 的 `~/.openclaw/` 是分开的。

<Warning>
工作区是**默认 cwd**，而不是硬沙盒。工具相对于工作区解析相对路径，但除非启用沙盒化，绝对路径仍然可以到达主机上的其他位置。如果需要隔离，请使用 [`agents.defaults.sandbox`](/gateway/sandboxing)（和/或每个 Agent 的沙盒配置）。

启用沙盒化且 `workspaceAccess` 不是 `"rw"` 时，工具在 `~/.openclaw/sandboxes` 下的沙盒工作区内操作，而不是您的主机工作区。
</Warning>

## 默认位置

- 默认：`~/.openclaw/workspace`
- 如果 `OPENCLAW_PROFILE` 已设置且不是 `"default"`，默认变为 `~/.openclaw/workspace-<profile>`。
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

`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 将在工作区缺失时创建工作区并填充 Bootstrap 文件。

<Note>
沙盒种子副本只接受常规的工作区内文件；在源工作区外解析的符号链接/硬链接别名将被忽略。
</Note>

如果您已经自己管理工作区文件，可以禁用 Bootstrap 文件创建：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 额外的工作区文件夹

较旧的安装可能已创建 `~/openclaw`。保留多个工作区目录可能导致混乱的认证或状态漂移，因为每次只有一个工作区是活跃的。

<Note>
**建议：** 保留单个活跃工作区。如果您不再使用额外的文件夹，请将其归档或移至回收站（例如 `trash ~/openclaw`）。如果您有意保留多个工作区，请确保 `agents.defaults.workspace` 指向活跃的那个。

`openclaw doctor` 会在检测到额外的工作区目录时发出警告。
</Note>

## 工作区文件映射

这些是 OpenClaw 在工作区内期望的标准文件：

<AccordionGroup>
  <Accordion title="AGENTS.md - 操作指令">
    Agent 的操作指令及其如何使用 Memory。在每个 Session 开始时加载。适合放置规则、优先事项和"如何行为"的详情。
  </Accordion>
  <Accordion title="SOUL.md - 人设和语气">
    人设、语气和边界。每个 Session 加载。指南：[SOUL.md 人格指南](/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md - 用户是谁">
    用户是谁以及如何称呼他们。每个 Session 加载。
  </Accordion>
  <Accordion title="IDENTITY.md - 名称、氛围、表情符号">
    Agent 的名称、氛围和表情符号。在 Bootstrap 仪式期间创建/更新。
  </Accordion>
  <Accordion title="TOOLS.md - 本地工具约定">
    关于本地工具和约定的说明。不控制工具可用性；仅为指导。
  </Accordion>
  <Accordion title="HEARTBEAT.md - 心跳清单">
    可选的心跳运行小清单。保持简短以避免 token 消耗。
  </Accordion>
  <Accordion title="BOOT.md - 启动清单">
    可选的启动清单，在 Gateway 重启时自动运行（当启用[内部 Hook](/automation/hooks) 时）。保持简短；使用消息工具进行出站发送。
  </Accordion>
  <Accordion title="BOOTSTRAP.md - 首次运行仪式">
    一次性的首次运行仪式。仅为全新工作区创建。仪式完成后删除它。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - 每日 Memory 日志">
    每日 Memory 日志（每天一个文件）。建议在 Session 开始时读取今天和昨天的日志。
  </Accordion>
  <Accordion title="MEMORY.md - 精心整理的长期 Memory（可选）">
    精心整理的长期 Memory：持久事实、偏好、决策和简短摘要。在 `memory/YYYY-MM-DD.md` 中保留详细日志，以便 Memory 工具按需检索而不必将其注入每个提示。仅在主要的私人 Session 中加载 `MEMORY.md`（不在共享/群组上下文中）。参见 [Memory](/concepts/memory) 了解工作流程和自动 Memory 刷新。
  </Accordion>
  <Accordion title="skills/ - 工作区 Skill（可选）">
    工作区特定的 Skill。该工作区中 Skill 位置的最高优先级。当名称冲突时覆盖项目 Agent Skill、个人 Agent Skill、托管 Skill、捆绑 Skill 和 `skills.load.extraDirs`。
  </Accordion>
  <Accordion title="canvas/ - Canvas UI 文件（可选）">
    Node 显示的 Canvas UI 文件（例如 `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
如果任何 Bootstrap 文件缺失，OpenClaw 会在 Session 中注入"缺失文件"标记并继续。注入时大型 Bootstrap 文件会被截断；使用 `agents.defaults.bootstrapMaxChars`（默认：12000）和 `agents.defaults.bootstrapTotalMaxChars`（默认：60000）调整限制。`openclaw setup` 可以重新创建缺失的默认值而不覆盖现有文件。
</Note>

## 工作区中没有的内容

这些存储在 `~/.openclaw/` 下，**不应**提交到工作区仓库：

- `~/.openclaw/openclaw.json`（配置）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（模型认证 Profile：OAuth + API 密钥）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（每个 Agent 的 Codex 运行时账户、配置、Skill、Plugin 和原生线程状态）
- `~/.openclaw/credentials/`（Channel/Provider 状态加旧版 OAuth 导入数据）
- `~/.openclaw/agents/<agentId>/sessions/`（Session 转录 + 元数据）
- `~/.openclaw/skills/`（托管 Skill）

如果需要迁移 Session 或配置，请单独复制它们并将其排除在版本控制之外。

## Git 备份（推荐，私有）

将工作区视为私有 Memory。将其放在**私有** Git 仓库中，以便备份和恢复。

在 Gateway 运行的机器上运行这些步骤（工作区就在那里）。

<Steps>
  <Step title="初始化仓库">
    如果安装了 Git，全新的工作区会自动初始化。如果此工作区还不是仓库，请运行：

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="添加私有远程">
    <Tabs>
      <Tab title="GitHub Web UI">
        1. 在 GitHub 上创建一个新的**私有**仓库。
        2. 不要用 README 初始化（避免合并冲突）。
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
      <Tab title="GitLab Web UI">
        1. 在 GitLab 上创建一个新的**私有**仓库。
        2. 不要用 README 初始化（避免合并冲突）。
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
即使在私有仓库中，也要避免在工作区中存储密钥：

- API 密钥、OAuth 令牌、密码或私有凭据。
- `~/.openclaw/` 下的任何内容。
- 聊天或敏感附件的原始转储。

如果必须存储敏感引用，使用占位符并将真实密钥保存在其他地方（密码管理器、环境变量或 `~/.openclaw/`）。
</Warning>

建议的 `.gitignore` 起始配置：

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 将工作区移到新机器

<Steps>
  <Step title="克隆仓库">
    将仓库克隆到所需路径（默认 `~/.openclaw/workspace`）。
  </Step>
  <Step title="更新配置">
    在 `~/.openclaw/openclaw.json` 的 `agents.defaults.workspace` 中设置该路径。
  </Step>
  <Step title="填充缺失文件">
    运行 `openclaw setup --workspace <path>` 以填充任何缺失的文件。
  </Step>
  <Step title="复制 Session（可选）">
    如果需要 Session，从旧机器单独复制 `~/.openclaw/agents/<agentId>/sessions/`。
  </Step>
</Steps>

## 高级说明

- 多 Agent 路由可以为每个 Agent 使用不同的工作区。参见 [Channel 路由](/channels/channel-routing) 了解路由配置。
- 如果启用了 `agents.defaults.sandbox`，非主 Session 可以在 `agents.defaults.sandbox.workspaceRoot` 下使用每个 Session 的沙盒工作区。

## 相关

- [心跳](/gateway/heartbeat) - HEARTBEAT.md 工作区文件
- [沙盒化](/gateway/sandboxing) - 沙盒环境中的工作区访问
- [Session](/concepts/session) - Session 存储路径
- [常备指令](/automation/standing-orders) - 工作区文件中的持久指令
