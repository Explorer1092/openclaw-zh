---
summary: "技能: 管理 vs 工作区、门控规则和配置/环境接线"
read_when:
  - 添加或修改技能
  - 更改技能门控或加载规则
---
# 技能(OpenClaw)

OpenClaw 使用**[AgentSkills](https://agentskills.io) 兼容**的技能文件夹来教 agent 如何使用工具。每个技能是一个包含 `SKILL.md` 的目录,其中包含 YAML frontmatter 和指令。OpenClaw 加载**捆绑技能**加上可选的本地覆盖,并在加载时根据环境、配置和二进制存在对其进行过滤。

## 位置和优先级

技能从**三个**位置加载:

1) **捆绑技能**: 随安装一起提供(npm 包或 OpenClaw.app)
2) **管理/本地技能**: `~/.openclaw/skills`
3) **工作区技能**: `<workspace>/skills`

如果技能名称冲突,优先级是:

`<workspace>/skills`(最高) → `~/.openclaw/skills` → 捆绑技能(最低)

此外,您可以通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 配置额外的技能文件夹(最低优先级)。

## 每个 agent vs 共享技能

在**多 agent** 设置中,每个 agent 都有自己的工作区。这意味着:

- **每个 agent 的技能**位于该 agent 的 `<workspace>/skills` 中。
- **共享技能**位于 `~/.openclaw/skills`(管理/本地)中,对同一台机器上的**所有 agent** 可见。
- **共享文件夹**也可以通过 `skills.load.extraDirs` 添加(最低优先级),如果您想要多个 agent 使用的公共技能包。

如果同一技能名称存在于多个位置,则应用通常的优先级: 工作区优先,然后是管理/本地,然后是捆绑。

## 插件 + 技能

插件可以通过在 `openclaw.plugin.json` 中列出 `skills` 目录(相对于插件根的路径)来提供自己的技能。当插件启用时加载插件技能,并参与正常的技能优先级规则。您可以通过插件配置条目上的 `metadata.openclaw.requires.config` 来限制它们。有关发现/配置,请参见 [插件](/plugin),有关这些技能教授的工具表面,请参见 [工具](/tools)。

## ClawdHub(安装 + 同步)

ClawdHub 是 OpenClaw 的公共技能注册表。在 https://clawdhub.com 浏览。使用它来发现、安装、更新和备份技能。完整指南: [ClawdHub](/tools/clawdhub)。

常见流程:

- 将技能安装到您的工作区:
  - `clawdhub install <skill-slug>`
- 更新所有已安装的技能:
  - `clawdhub update --all`
- 同步(扫描 + 发布更新):
  - `clawdhub sync --all`

默认情况下,`clawdhub` 安装到当前工作目录下的 `./skills` 中(或回退到配置的 OpenClaw 工作区)。OpenClaw 在下一个会话中将其作为 `<workspace>/skills` 获取。

## 安全注意事项

- 将第三方技能视为**受信任的代码**。在启用之前阅读它们。
- 对于不受信任的输入和有风险的工具,优先使用沙箱运行。参见 [沙箱](/gateway/sandboxing)。
- `skills.entries.*.env` 和 `skills.entries.*.apiKey` 将秘密注入该 agent 转换的**主机**进程(而非沙箱)。将秘密排除在提示和日志之外。
- 有关更广泛的威胁模型和检查清单,请参见 [安全](/gateway/security)。

## 格式(AgentSkills + Pi 兼容)

`SKILL.md` 必须至少包括:

```markdown
---
name: nano-banana-pro
description: 通过 Gemini 3 Pro Image 生成或编辑图像
---
```

注意:
- 我们遵循 AgentSkills 规范的布局/意图。
- 嵌入式 agent 使用的解析器仅支持**单行** frontmatter 键。
- `metadata` 应该是**单行 JSON 对象**。
- 在指令中使用 `{baseDir}` 引用技能文件夹路径。
- 可选的 frontmatter 键:
  - `homepage` — 在 macOS Skills UI 中作为"网站"显示的 URL(也通过 `metadata.openclaw.homepage` 支持)。
  - `user-invocable` — `true|false`(默认: `true`)。为 `true` 时,技能作为用户斜杠命令公开。
  - `disable-model-invocation` — `true|false`(默认: `false`)。为 `true` 时,技能从模型提示中排除(仍可通过用户调用获得)。
  - `command-dispatch` — `tool`(可选)。设置为 `tool` 时,斜杠命令绕过模型并直接分派到工具。
  - `command-tool` — 设置 `command-dispatch: tool` 时要调用的工具名称。
  - `command-arg-mode` — `raw`(默认)。对于工具分派,将原始 args 字符串转发到工具(无核心解析)。

    工具使用以下参数调用:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。

## 门控(加载时过滤器)

OpenClaw 使用 `metadata`(单行 JSON)**在加载时过滤技能**:

```markdown
---
name: nano-banana-pro
description: 通过 Gemini 3 Pro Image 生成或编辑图像
metadata: {"openclaw":{"requires":{"bins":["uv"],"env":["GEMINI_API_KEY"],"config":["browser.enabled"]},"primaryEnv":"GEMINI_API_KEY"}}
---
```

`metadata.openclaw` 下的字段:
- `always: true` — 始终包括技能(跳过其他门控)。
- `emoji` — macOS Skills UI 使用的可选表情符号。
- `homepage` — 在 macOS Skills UI 中显示为"网站"的可选 URL。
- `os` — 可选的平台列表(`darwin`、`linux`、`win32`)。如果设置,技能仅在这些操作系统上符合条件。
- `requires.bins` — 列表;每个必须存在于 `PATH` 上。
- `requires.anyBins` — 列表;至少一个必须存在于 `PATH` 上。
- `requires.env` — 列表;环境变量必须存在**或**在配置中提供。
- `requires.config` — 必须为 truthy 的 `openclaw.json` 路径列表。
- `primaryEnv` — 与 `skills.entries.<name>.apiKey` 关联的环境变量名称。
- `install` — macOS Skills UI 使用的可选安装程序规范数组(brew/node/go/uv/download)。

关于沙箱的注意事项:
- `requires.bins` 在技能加载时在**主机**上检查。
- 如果 agent 被沙箱化,二进制文件也必须存在于**容器内**。通过 `agents.defaults.sandbox.docker.setupCommand`(或自定义镜像)安装它。`setupCommand` 在创建容器后运行一次。包安装还需要网络出口、可写根文件系统和沙箱中的 root 用户。示例: `summarize` 技能(`skills/summarize/SKILL.md`)需要沙箱容器中的 `summarize` CLI 才能在那里运行。

安装程序示例:

```markdown
---
name: gemini
description: 使用 Gemini CLI 进行编码辅助和 Google 搜索查询。
metadata: {"openclaw":{"emoji":"♊️","requires":{"bins":["gemini"]},"install":[{"id":"brew","kind":"brew","formula":"gemini-cli","bins":["gemini"],"label":"安装 Gemini CLI (brew)"}]}}
---
```

注意:
- 如果列出多个安装程序,网关会选择**单个**首选选项(可用时为 brew,否则为 node)。
- 如果所有安装程序都是 `download`,OpenClaw 会列出每个条目,以便您可以看到可用的工件。
- 安装程序规范可以包含 `os: ["darwin"|"linux"|"win32"]` 以按平台过滤选项。
- Node 安装遵守 `openclaw.json` 中的 `skills.install.nodeManager`(默认: npm;选项: npm/pnpm/yarn/bun)。这仅影响**技能安装**;网关运行时仍应为 Node(不推荐 Bun 用于 WhatsApp/Telegram)。
- Go 安装: 如果缺少 `go` 且 `brew` 可用,网关首先通过 Homebrew 安装 Go,并在可能的情况下将 `GOBIN` 设置为 Homebrew 的 `bin`。
 - 下载安装: `url`(必需)、`archive`(`tar.gz` | `tar.bz2` | `zip`)、`extract`(默认: 检测到存档时自动)、`stripComponents`、`targetDir`(默认: `~/.openclaw/tools/<skillKey>`)。

如果不存在 `metadata.openclaw`,则技能始终符合条件(除非在配置中禁用或被捆绑技能的 `skills.allowBundled` 阻止)。

## 配置覆盖(`~/.openclaw/openclaw.json`)

可以切换捆绑/管理技能并提供环境值:

```json5
{
  skills: {
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: "GEMINI_KEY_HERE",
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE"
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro"
        }
      },
      peekaboo: { enabled: true },
      sag: { enabled: false }
    }
  }
}
```

注意: 如果技能名称包含连字符,引用键(JSON5 允许引用键)。

配置键默认匹配**技能名称**。如果技能定义了 `metadata.openclaw.skillKey`,在 `skills.entries` 下使用该键。

规则:
- `enabled: false` 禁用技能,即使它是捆绑的/已安装的。
- `env`: **仅当**变量尚未在进程中设置时才注入。
- `apiKey`: 声明 `metadata.openclaw.primaryEnv` 的技能的便利功能。
- `config`: 自定义每个技能字段的可选包;自定义键必须位于此处。
- `allowBundled`: **仅捆绑**技能的可选允许列表。如果设置,仅列表中的捆绑技能符合条件(管理/工作区技能不受影响)。

## 环境注入(每个 agent 运行)

当 agent 运行开始时,OpenClaw:
1) 读取技能元数据。
2) 将任何 `skills.entries.<key>.env` 或 `skills.entries.<key>.apiKey` 应用到 `process.env`。
3) 使用**符合条件的**技能构建系统提示。
4) 在运行结束后恢复原始环境。

这是**限定于 agent 运行的**,而不是全局 shell 环境。

## 会话快照(性能)

OpenClaw 在**会话开始时**对符合条件的技能进行快照,并在同一会话的后续转换中重用该列表。对技能或配置的更改在下一个新会话时生效。

当启用技能监视器或出现新的符合条件的远程节点时,技能也可以在会话中刷新(见下文)。将此视为**热重载**: 刷新的列表在下一个 agent 转换时被获取。

## 远程 macOS 节点(Linux 网关)

如果网关在 Linux 上运行,但连接了**允许 `system.run`** 的 **macOS 节点**(Exec 批准安全性未设置为 `deny`),OpenClaw 可以在该节点上存在所需的二进制文件时将仅 macOS 技能视为符合条件。agent 应通过 `nodes` 工具(通常是 `nodes.run`)执行这些技能。

这依赖于节点报告其命令支持以及通过 `system.run` 进行的 bin 探测。如果 macOS 节点稍后离线,技能保持可见;调用可能会失败,直到节点重新连接。

## 技能监视器(自动刷新)

默认情况下,OpenClaw 监视技能文件夹,并在 `SKILL.md` 文件更改时更新技能快照。在 `skills.load` 下配置:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250
    }
  }
}
```

## 令牌影响(技能列表)

当技能符合条件时,OpenClaw 将可用技能的紧凑 XML 列表注入系统提示(通过 `pi-coding-agent` 中的 `formatSkillsForPrompt`)。成本是确定性的:

- **基础开销(仅当 ≥1 个技能时):** 195 个字符。
- **每个技能:** 97 个字符 + XML 转义的 `<name>`、`<description>` 和 `<location>` 值的长度。

公式(字符):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

注意:
- XML 转义将 `& < > " '` 扩展为实体(`&amp;`、`&lt;` 等),增加长度。
- 令牌计数因模型分词器而异。粗略的 OpenAI 风格估计是每个令牌约 4 个字符,因此**97 个字符 ≈ 每个技能 24 个令牌**加上您的实际字段长度。

## 管理技能生命周期

OpenClaw 将一组基线技能作为安装的一部分(npm 包或 OpenClaw.app)作为**捆绑技能**提供。`~/.openclaw/skills` 用于本地覆盖(例如,在不更改捆绑副本的情况下固定/修补技能)。工作区技能是用户拥有的,并在名称冲突时覆盖两者。

## 配置参考

有关完整配置架构,请参见 [技能配置](/tools/skills-config)。

## 寻找更多技能?

浏览 https://clawdhub.com。

<!-- i18n-hash:674da177d94d07716c32261c2ebd54ab -->
