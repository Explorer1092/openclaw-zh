---
title: "技能"
sidebarTitle: "技能"
mmh3_hash: "d48fd2fb2d97d2a4cd97f19a1d4b87ee"
summary: "技能：管理 vs 工作区、门控规则、Agent 允许列表和配置接线"
read_when:
  - 添加或修改技能
  - 更改 Skill 门控、允许列表或加载规则
  - 了解 Skill 优先级和快照行为
---

OpenClaw 使用**[AgentSkills](https://agentskills.io) 兼容**的 Skill 文件夹来教 Agent 如何使用工具。每个 Skill 是一个包含 `SKILL.md` 的目录，其中包含 YAML frontmatter 和指令。OpenClaw 加载**捆绑 Skill**加上可选的本地覆盖，并在加载时根据环境、配置和二进制存在对其进行过滤。

## 位置和优先级

OpenClaw 从以下来源加载 Skill，**最高优先级优先**：

| #   | 来源                  | 路径                             |
| --- | --------------------- | -------------------------------- |
| 1   | 工作区 Skill          | `<workspace>/skills`             |
| 2   | 项目 Agent Skill      | `<workspace>/.agents/skills`     |
| 3   | 个人 Agent Skill      | `~/.agents/skills`               |
| 4   | 管理/本地 Skill       | `~/.openclaw/skills`             |
| 5   | 捆绑 Skill            | 随安装一起提供                   |
| 6   | 额外 Skill 文件夹     | `skills.load.extraDirs`（配置）  |

如果 Skill 名称冲突，最高来源优先。

Codex CLI 原生的 `$CODEX_HOME/skills` 目录不是这些 OpenClaw Skill 根目录之一。在 Codex 运行时模式下，本地应用服务器启动使用隔离的每 Agent Codex 主目录，因此个人 Codex CLI Skill 不会被隐式加载。使用 `openclaw migrate codex --dry-run` 清点它们，使用 `openclaw migrate codex` 在将其复制到当前 OpenClaw Agent 工作区之前通过交互式复选框提示选择 Skill 目录。对于非交互式运行，对要复制的确切 Skill 重复 `--skill <name>`。

## 每个 Agent vs 共享 Skill

在**多 Agent** 设置中，每个 Agent 都有自己的工作区：

| 范围                 | 路径                                        | 对谁可见                     |
| -------------------- | ------------------------------------------- | ---------------------------- |
| 每个 Agent           | `<workspace>/skills`                        | 仅该 Agent                   |
| 项目 Agent           | `<workspace>/.agents/skills`                | 仅该工作区的 Agent           |
| 个人 Agent           | `~/.agents/skills`                          | 该机器上的所有 Agent         |
| 共享管理/本地        | `~/.openclaw/skills`                        | 该机器上的所有 Agent         |
| 共享额外目录         | `skills.load.extraDirs`（最低优先级）        | 该机器上的所有 Agent         |

同名出现在多个位置时 → 最高来源优先。工作区优先于项目 Agent，优先于个人 Agent，优先于管理/本地，优先于捆绑，优先于额外目录。

## Agent Skill 允许列表

Skill **位置**和 Skill **可见性**是独立的控制项。位置/优先级决定同名 Skill 中哪个副本胜出；Agent 允许列表决定 Agent 实际上可以使用哪些 Skill。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // 继承 github, weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 无 Skill
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="允许列表规则">
    - 省略 `agents.defaults.skills` 以默认不限制 Skill。
    - 省略 `agents.list[].skills` 以继承 `agents.defaults.skills`。
    - 设置 `agents.list[].skills: []` 以无 Skill。
    - 非空的 `agents.list[].skills` 列表是该 Agent 的**最终**集合；它不与默认值合并。
    - 有效允许列表适用于提示构建、Skill Slash 命令发现、沙箱同步和 Skill 快照。
  </Accordion>
</AccordionGroup>

## Plugin 与 Skill

Plugin 可以通过在 `openclaw.plugin.json` 中列出 `skills` 目录（相对于 Plugin 根的路径）来提供自己的 Skill。当 Plugin 启用时加载 Plugin Skill。这是工具特定操作指南的合适位置——这些指南对工具描述来说太长，但在 Plugin 安装时应该可用——例如，browser Plugin 附带了一个 `browser-automation` Skill 用于多步骤浏览器控制。

Plugin Skill 目录被合并到与 `skills.load.extraDirs` 相同的低优先级路径中，因此同名的捆绑、管理、Agent 或工作区 Skill 会覆盖它们。你可以通过 Plugin 配置条目上的 `metadata.openclaw.requires.config` 来限制它们。

有关发现/配置，请参见 [Plugin](/tools/plugin)；有关这些 Skill 教授的工具表面，请参见 [工具](/tools)。

## Skill Workshop

可选的实验性 **Skill Workshop** Plugin 可以根据在 Agent 工作中观察到的可复用程序创建或更新工作区 Skill。默认禁用，必须通过 `plugins.entries.skill-workshop` 显式启用。

Skill Workshop 仅写入 `<workspace>/skills`，扫描生成的内容，支持待批准或自动安全写入，隔离不安全提案，并在成功写入后刷新 Skill 快照，无需重启 Gateway 即可使用新 Skill。

适用于校正（如 _"下次验证 GIF 归属"_）或来之不易的工作流（如媒体 QA 检查清单）。从待批准开始；在审查提案后仅在受信任的工作区中使用自动写入。完整指南：[Skill Workshop Plugin](/plugins/skill-workshop)。

## ClawHub（安装和同步）

[ClawHub](https://clawhub.ai) 是 OpenClaw 的公共 Skill 注册表。使用原生 `openclaw skills` 命令进行发现/安装/更新，或使用单独的 `clawhub` CLI 进行发布/同步工作流。完整指南：[ClawHub](/clawhub)。

| 操作                                | 命令                                                   |
| ----------------------------------- | ------------------------------------------------------ |
| 将 ClawHub Skill 安装到工作区       | `openclaw skills install <skill-slug>`                 |
| 将 Git Skill 安装到工作区           | `openclaw skills install git:owner/repo@ref`           |
| 将本地 Skill 安装到工作区           | `openclaw skills install ./path/to/skill --as my-tool` |
| 为所有本地 Agent 安装 Skill         | `openclaw skills install <skill-slug> --global`        |
| 更新所有已安装的 Skill              | `openclaw skills update --all`                         |
| 更新单个共享托管 Skill              | `openclaw skills update <skill-slug> --global`         |
| 更新所有共享托管/本地 Skill         | `openclaw skills update --all --global`                |
| 同步（扫描 + 发布更新）             | `clawhub sync --all`                                   |

原生 `openclaw skills install` 安装到活动工作区的 `skills/` 目录。单独的 `clawhub` CLI 也安装到当前工作目录下的 `./skills`（或回退到配置的 OpenClaw 工作区）。OpenClaw 在下一个 Session 中将其作为 `<workspace>/skills` 获取。已配置的 Skill 根还支持一级分组，例如 `skills/<group>/<skill>/SKILL.md`，因此相关的第三方 Skill 可以保存在共享文件夹下，无需广泛的递归扫描。

需要私有、非 ClawHub 投递的 Gateway 客户端可以使用 `skills.upload.begin`、`skills.upload.chunk` 和 `skills.upload.commit` 暂存 zip Skill 归档，然后使用 `skills.install({ source: "upload", uploadId, slug, force?, sha256? })` 安装已提交的上传。这是受信任客户端的显式管理员上传路径，不是普通的 `openclaw skills install <slug>` 或 ClawHub 安装流程。默认关闭，仅在 `openclaw.json` 中设置 `skills.install.allowUploadedArchives: true` 时才有效。上传模式仍安装到默认 Agent 工作区的 `skills/<slug>` 目录；存档的内部文件夹名称对最终安装目标无效。

ClawHub Skill 页面在安装前显示最新的安全扫描状态，包含 VirusTotal、ClawScan 和静态分析的扫描器详情页面。`openclaw skills install <slug>` 仍然只是安装路径；发布者通过 ClawHub 控制面板或 `clawhub skill rescan <slug>` 恢复误报。

## 安全

<Warning>
将第三方 Skill 视为**不受信任的代码**。在启用之前阅读它们。对于不受信任的输入和有风险的工具，优先使用沙箱运行。参见 [沙箱](/gateway/sandboxing) 了解 Agent 端控制。
</Warning>

- 工作区、项目 Agent 和 extra-dir Skill 发现只接受 Skill 根目录，其解析的 realpath 须保持在配置的根目录内，除非 `skills.load.allowSymlinkTargets` 显式信任某个目标根。捆绑 Skill 始终处于隔离状态。托管 `~/.openclaw/skills` 和个人 `~/.agents/skills` 根目录可以包含由 ClawHub 或其他本地 Skill 管理器安装的符号链接 Skill 文件夹，但每个 `SKILL.md` 的 realpath 仍必须保持在其解析的 Skill 目录内。
- Gateway 私有归档安装默认关闭。当显式启用时，它们需要包含 `SKILL.md` 的已提交 zip 上传，并重用与 ClawHub Skill 安装相同的归档提取、路径遍历、符号链接、强制和回滚保护。通过 `skills.install.allowUploadedArchives` 进行门控；普通 ClawHub 安装不需要该设置。
- Gateway 支持的 Skill 依赖安装（`skills.install`、引导向导和 Skills 设置 UI）在执行安装器元数据之前会运行内置的危险代码扫描器。`critical` 级发现默认会阻止安装，除非调用者显式设置了危险覆盖；`suspicious` 级发现仍然只会发出警告。
- `openclaw skills install <slug>` 与此不同——它将 ClawHub Skill 文件夹下载到工作区，或通过 `--global` 下载到共享托管/本地 Skill，不使用上述安装器元数据路径。Git 和本地目录安装会将受信任的 `SKILL.md` 目录复制到相同的 Skill 根目录，但不被 `openclaw skills update` 跟踪。
- `skills.entries.*.env` 和 `skills.entries.*.apiKey` 将秘密注入该 Agent 运行的**主机**进程（不是沙箱）。将秘密排除在提示和日志之外。

有关更广泛的威胁模型和检查清单，请参见 [安全](/gateway/security)。

## SKILL.md 格式

`SKILL.md` 必须至少包括：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw 遵循 AgentSkills 规范的布局/意图。嵌入式 Agent 使用的解析器仅支持**单行** frontmatter 键；`metadata` 应该是**单行 JSON 对象**。在指令中使用 `{baseDir}` 引用 Skill 文件夹路径。

### 可选 frontmatter 键

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中显示为"网站"的 URL。也通过 `metadata.openclaw.homepage` 支持。
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  为 `true` 时，Skill 作为用户 Slash 命令暴露。
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  为 `true` 时，OpenClaw 将 Skill 指令排除在 Agent 正常提示之外。当 `user-invocable` 也为 `true` 时，Skill 仍然被安装，仍然可以作为 Slash 命令显式运行。
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  设置为 `tool` 时，Slash 命令绕过模型并直接分派到工具。
</ParamField>
<ParamField path="command-tool" type="string">
  设置 `command-dispatch: tool` 时要调用的工具名称。
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  对于工具分派，将原始 args 字符串转发到工具（无核心解析）。工具使用以下参数调用：`{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。
</ParamField>

## 门控（加载时过滤器）

OpenClaw 使用 `metadata`（单行 JSON）**在加载时过滤 Skill**：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

`metadata.openclaw` 下的字段：

<ParamField path="always" type="boolean">
  为 `true` 时，始终包括 Skill（跳过其他门控）。
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI 使用的可选表情符号。
</ParamField>
<ParamField path="homepage" type="string">
  在 macOS Skills UI 中显示为"网站"的可选 URL。
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  可选的平台列表。如果设置，Skill 仅在这些操作系统上符合条件。
</ParamField>
<ParamField path="requires.bins" type="string[]">
  每个都必须存在于 `PATH` 上。
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  至少一个必须存在于 `PATH` 上。
</ParamField>
<ParamField path="requires.env" type="string[]">
  环境变量必须存在或在配置中提供。
</ParamField>
<ParamField path="requires.config" type="string[]">
  必须为 truthy 的 `openclaw.json` 路径列表。
</ParamField>
<ParamField path="primaryEnv" type="string">
  与 `skills.entries.<name>.apiKey` 关联的环境变量名称。
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI 使用的可选安装器规范（brew/node/go/uv/download）。
</ParamField>

如果不存在 `metadata.openclaw`，则 Skill 始终符合条件（除非在配置中禁用或被捆绑 Skill 的 `skills.allowBundled` 阻止）。

<Note>
旧版 `metadata.clawdbot` 块在 `metadata.openclaw` 不存在时仍然被接受，因此旧版已安装 Skill 保留其依赖门控和安装器提示。新 Skill 和更新的 Skill 应使用 `metadata.openclaw`。
</Note>

### 沙箱注意事项

- `requires.bins` 在 Skill 加载时在**主机**上检查。
- 如果 Agent 被沙箱化，二进制文件也必须存在于**容器内**。通过 `agents.defaults.sandbox.docker.setupCommand`（或自定义镜像）安装它。`setupCommand` 在创建容器后运行一次。包安装还需要网络出口、可写根文件系统和沙箱中的 root 用户。
- 示例：`summarize` Skill（`skills/summarize/SKILL.md`）需要沙箱容器中的 `summarize` CLI 才能在那里运行。

### 安装器规范

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="安装器选择规则">
    - 如果列出多个安装器，Gateway 会选择单个首选选项（可用时为 brew，否则为 node）。
    - 如果所有安装器都是 `download`，OpenClaw 会列出每个条目，以便你可以看到可用的工件。
    - 安装器规范可以包含 `os: ["darwin"|"linux"|"win32"]` 以按平台过滤选项。
    - Node 安装遵守 `openclaw.json` 中的 `skills.install.nodeManager`（默认：npm；选项：npm/pnpm/yarn/bun）。这仅影响 Skill 安装；Gateway 运行时仍应为 Node——不推荐 Bun 用于 WhatsApp/Telegram。
    - Gateway 支持的安装器选择是偏好驱动的：当安装规范混合多种类型时，OpenClaw 优先使用 Homebrew（当 `skills.install.preferBrew` 启用且 `brew` 存在时），其次是 `uv`，然后是配置的 node 管理器，再然后是 `go` 或 `download` 等其他回退。
    - 如果每个安装规范都是 `download`，OpenClaw 会显示所有下载选项，而不是折叠为一个首选安装器。

  </Accordion>
  <Accordion title="每个安装器的详情">
    - **Homebrew 安装：**OpenClaw 不会自动安装 Homebrew，也不会将 brew formula 转换为系统包管理器命令。在没有 `brew` 的 Linux 容器中，引导向导会隐藏仅限 brew 的依赖安装器；使用自定义镜像或在启用该 Skill 之前手动安装依赖项。
    - **Go 安装：**如果 `go` 缺失且 `brew` 可用，Gateway 首先通过 Homebrew 安装 Go，并在可能时将 `GOBIN` 设置为 Homebrew 的 `bin`。
    - **下载安装：**`url`（必需）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（默认：检测到归档时自动）、`stripComponents`、`targetDir`（默认：`~/.openclaw/tools/<skillKey>`）。

  </Accordion>
</AccordionGroup>

## 配置覆盖

捆绑/管理 Skill 可以在 `~/.openclaw/openclaw.json` 的 `skills.entries` 下切换并提供环境值：

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或纯文本字符串
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` 禁用 Skill，即使它是捆绑的或已安装的。捆绑的 `coding-agent` Skill 是可选加入的：在向 Agent 暴露之前设置 `skills.entries.coding-agent.enabled: true`，然后确保 `claude`、`codex`、`opencode` 或 `pi` 之一已安装并通过认证用于其自己的 CLI。
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  声明 `metadata.openclaw.primaryEnv` 的 Skill 的便利功能。支持纯文本或 SecretRef。
</ParamField>
<ParamField path="env" type="Record<string, string>">
  仅在变量尚未在进程中设置时才注入。
</ParamField>
<ParamField path="config" type="object">
  自定义每个 Skill 字段的可选包。自定义键必须位于此处。
</ParamField>
<ParamField path="allowBundled" type="string[]">
  **仅捆绑** Skill 的可选允许列表。如果设置，仅列表中的捆绑 Skill 符合条件（管理/工作区 Skill 不受影响）。
</ParamField>

如果 Skill 名称包含连字符，引用键（JSON5 允许引用键）。配置键默认匹配 **Skill 名称**——如果 Skill 定义了 `metadata.openclaw.skillKey`，在 `skills.entries` 下使用该键。

<Note>
对于 OpenClaw 内置的图像生成/编辑，使用核心 `image_generate` 工具配合 `agents.defaults.imageGenerationModel`，而不是捆绑 Skill。这里的 Skill 示例适用于自定义或第三方工作流。对于原生图像分析，使用 `image` 工具配合 `agents.defaults.imageModel`。如果你选择 `openai/*`、`google/*`、`fal/*` 或其他 Provider 特定的图像模型，也需要添加该 Provider 的认证/API 密钥。
</Note>

## 环境注入

当 Agent 运行开始时，OpenClaw：

1. 读取 Skill 元数据。
2. 将 `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 应用到 `process.env`。
3. 使用**符合条件的** Skill 构建系统提示。
4. 在运行结束后恢复原始环境。

环境注入是**限定于 Agent 运行的**，不是全局 Shell 环境。

对于捆绑的 `claude-cli` 后端，OpenClaw 还会将相同的符合条件快照物化为临时 Claude Code Plugin，并通过 `--plugin-dir` 传递。Claude Code 可以使用其原生 Skill 解析器，而 OpenClaw 仍然掌管优先级、每 Agent 允许列表、门控和 `skills.entries.*` 环境/API 密钥注入。其他 CLI 后端仅使用提示目录。

## 快照和刷新

OpenClaw 在 **Session 开始时**对符合条件的 Skill 进行快照，并在同一 Session 的后续轮次中重用该列表。对 Skill 或配置的更改在下一个新 Session 时生效。

Skill 在两种情况下可以在 Session 中刷新：

- 启用了 Skill 监视器。
- 出现了新的符合条件的远程节点。

将此视为**热重载**：刷新的列表在下一个 Agent 轮次时被获取。如果该 Session 的有效 Agent Skill 允许列表发生变化，OpenClaw 会刷新快照，使可见 Skill 与当前 Agent 保持同步。

### Skill 监视器

默认情况下，OpenClaw 监视 Skill 文件夹，并在 `SKILL.md` 文件更改时更新 Skill 快照。在 `skills.load` 下配置：

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

对于工作区、项目 Agent 或 extra-dir Skill 根包含符号链接（例如 `<workspace>/skills/manager -> ~/Projects/manager/skills`）的有意兄弟仓库布局，使用 `allowSymlinkTargets`。托管 `~/.openclaw/skills` 和个人 `~/.agents/skills` 默认允许本地 Skill 管理器跟随 Skill 目录符号链接；目标列表在 realpath 解析后匹配，配置时应保持范围较窄。

### 远程 macOS 节点（Linux Gateway）

如果 Gateway 在 Linux 上运行，但连接了**允许 `system.run`** 的 **macOS 节点**（Exec 批准安全性未设置为 `deny`），OpenClaw 可以在该节点上存在所需的二进制文件时将仅 macOS Skill 视为符合条件。Agent 应通过带 `host=node` 的 `exec` 工具执行这些 Skill。

这依赖于节点报告其命令支持以及通过 `system.which` 或 `system.run` 进行的 bin 探测。离线节点**不**使仅远程的 Skill 可见。如果已连接的节点停止响应 bin 探测，OpenClaw 会清除其缓存的 bin 匹配，使 Agent 不再看到当前无法在那里运行的 Skill。

## 令牌影响

当 Skill 符合条件时，OpenClaw 将可用 Skill 的紧凑 XML 列表注入系统提示（通过 `pi-coding-agent` 中的 `formatSkillsForPrompt`）。成本是确定性的：

- **基础开销（仅当 ≥1 个 Skill 时）：**195 个字符。
- **每个 Skill：**97 个字符 + XML 转义的 `<name>`、`<description>` 和 `<location>` 值的长度。

公式（字符）：

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML 转义将 `& < > " '` 扩展为实体（`&amp;`、`&lt;` 等），增加长度。令牌计数因模型分词器而异。粗略的 OpenAI 风格估计是每个令牌约 4 个字符，因此**97 个字符 ≈ 每个 Skill 24 个令牌**加上你的实际字段长度。

## 管理 Skill 生命周期

OpenClaw 将一组基线 Skill 作为安装的一部分（npm 包或 OpenClaw.app）作为**捆绑 Skill**提供。`~/.openclaw/skills` 用于本地覆盖——例如，在不更改捆绑副本的情况下固定或修补 Skill。工作区 Skill 是用户拥有的，并在名称冲突时覆盖两者。

## 寻找更多 Skill?

浏览 [https://clawhub.ai](https://clawhub.ai)。完整配置 Schema：[Skill 配置](/tools/skills-config)。

## 相关

- [ClawHub](/clawhub) — 公共 Skill 注册表
- [创建 Skill](/tools/creating-skills) — 构建自定义 Skill
- [Plugin](/tools/plugin) — Plugin 系统概览
- [Skill Workshop Plugin](/plugins/skill-workshop) — 根据 Agent 工作生成 Skill
- [Skill 配置](/tools/skills-config) — Skill 配置参考
- [Slash 命令](/tools/slash-commands) — 所有可用 Slash 命令
