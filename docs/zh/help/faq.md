---
mmh3_hash: "417b1bd39aedb30eb74e96413089c6b0"
title: "FAQ"
summary: "关于 OpenClaw 设置、配置和使用的常见问题"
read_when:
  - 回答常见的设置、安装、入门或运行时支持问题
  - 在深入调试之前对用户报告的问题进行分类
---

针对真实场景（本地开发、VPS、多 Agent、OAuth/API 密钥、模型故障转移）的快速解答及深度故障排除。运行时诊断请参见[故障排除](/gateway/troubleshooting)。完整配置参考请参见[配置](/gateway/configuration)。

## 出问题时的前 60 秒

1. **快速状态（首次检查）**

   ```bash
   openclaw status
   ```

   快速本地摘要：OS + 更新、Gateway/服务可达性、Agent/Session、Provider 配置 + 运行时问题（当 Gateway 可达时）。

2. **可粘贴报告（可安全共享）**

   ```bash
   openclaw status --all
   ```

   只读诊断，带日志尾部（令牌已脱敏）。

3. **守护进程 + 端口状态**

   ```bash
   openclaw gateway status
   ```

   显示 supervisor 运行时与 RPC 可达性、探测目标 URL，以及服务可能使用的配置。

4. **深度探测**

   ```bash
   openclaw status --deep
   ```

   运行实时 Gateway 健康探测，包括支持时的 Channel 探测（需要可达的 Gateway）。参见 [Health](/gateway/health)。

5. **跟踪最新日志**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 不可用，退回到：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   文件日志与服务日志是分开的；参见[日志记录](/logging)和[故障排除](/gateway/troubleshooting)。

6. **运行 Doctor（修复）**

   ```bash
   openclaw doctor
   ```

   修复/迁移配置/状态 + 运行健康检查。参见 [Doctor](/gateway/doctor)。

7. **Gateway 快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # 出错时显示目标 URL + 配置路径
   ```

   向运行中的 Gateway 请求完整快照（仅 WS）。参见 [Health](/gateway/health)。

## 快速入门和首次运行设置

首次运行问答——安装、入门、认证路径、订阅、初始故障——
请查看[首次运行 FAQ](/help/faq-first-run)。

## OpenClaw 是什么？

<AccordionGroup>
  <Accordion title="用一段话说明 OpenClaw 是什么？">
    OpenClaw 是你在自己设备上运行的个人 AI 助手。它在你已经使用的消息平台上回复（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及 QQ Bot 等捆绑 Channel 插件），并可在支持的平台上进行语音对话和实时 Canvas。**Gateway** 是始终运行的控制平面，助手是产品本身。
  </Accordion>

  <Accordion title="价值主张">
    OpenClaw 不是"Claude 的简单封装"。它是一个**本地优先的控制平面**，让你在**自己的硬件**上运行功能强大的助手，可从你已经使用的聊天应用访问，具有有状态 Session、记忆和工具——无需将工作流控制权交给托管 SaaS。

    亮点：

    - **你的设备，你的数据：** 在任何地方运行 Gateway（Mac、Linux、VPS），保持工作区 + Session 历史本地化。
    - **真实 Channel，非 Web 沙箱：** WhatsApp/Telegram/Slack/Discord/Signal/iMessage 等，加上支持平台的移动语音和 Canvas。
    - **模型无关：** 使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，支持按 Agent 路由和故障转移。
    - **本地仅选项：** 运行本地模型，如果你愿意，**所有数据都可以留在你的设备上**。
    - **多 Agent 路由：** 按 Channel、账户或任务分设 Agent，每个都有自己的工作区和默认值。
    - **开源且可扩展：** 无需供应商锁定即可检查、扩展和自托管。

    文档：[Gateway](/gateway)、[Channels](/channels)、[多 Agent](/concepts/multi-agent)、[记忆](/concepts/memory)。

  </Accordion>

  <Accordion title="刚设置好——我应该先做什么？">
    好的起步项目：

    - 构建网站（WordPress、Shopify 或简单的静态网站）。
    - 原型移动应用（大纲、界面、API 方案）。
    - 整理文件和文件夹（清理、命名、标记）。
    - 连接 Gmail 并自动生成摘要或跟进。

    它可以处理大型任务，但分阶段进行并使用子 Agent 并行处理效果最好。

  </Accordion>

  <Accordion title="OpenClaw 最常用的五个使用场景是什么？">
    日常效果通常体现在：

    - **个人简报：** 收件箱、日历和你关心的新闻摘要。
    - **研究和起草：** 快速研究、摘要，以及电子邮件或文档的初稿。
    - **提醒和跟进：** 由 Cron 或心跳驱动的提醒和清单。
    - **浏览器自动化：** 填写表单、收集数据和重复网页任务。
    - **跨设备协调：** 从手机发送任务，让 Gateway 在服务器上运行，然后在聊天中收到结果。

  </Accordion>

  <Accordion title="OpenClaw 能帮助 SaaS 进行潜在客户开发、外联、广告和博客吗？">
    **研究、资格认定和起草**可以。它可以扫描网站、构建候选名单、总结潜在客户，并撰写外联或广告文案草稿。

    对于**外联或广告发布**，请保持人工参与。避免垃圾邮件，遵守当地法律和平台政策，在发送前审查所有内容。最安全的模式是让 OpenClaw 起草，由你审批。

    文档：[安全性](/gateway/security)。

  </Accordion>

  <Accordion title="与 Claude Code 相比，用于 Web 开发有什么优势？">
    OpenClaw 是**个人助手**和协调层，而非 IDE 替代品。在仓库内使用 Claude Code 或 Codex 实现最快的直接编码循环。当你想要持久记忆、跨设备访问和工具编排时使用 OpenClaw。

    优势：

    - **跨 Session 的持久记忆 + 工作区**
    - **多平台访问**（WhatsApp、Telegram、TUI、WebChat）
    - **工具编排**（浏览器、文件、调度、Hook）
    - **始终运行的 Gateway**（在 VPS 上运行，从任何地方交互）
    - **Node** 用于本地浏览器/屏幕/摄像头/exec

    展示：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## 技能和自动化

<AccordionGroup>
  <Accordion title="如何在不让仓库变脏的情况下自定义技能？">
    使用托管覆盖而不是编辑仓库副本。将更改放在 `~/.openclaw/skills/<name>/SKILL.md` 中（或通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加文件夹）。优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 捆绑 → `skills.load.extraDirs`，因此托管覆盖仍然优于捆绑技能，而无需修改 git。如果你需要全局安装技能但只让某些 Agent 可见，请将共享副本保存在 `~/.openclaw/skills` 中，并使用 `agents.defaults.skills` 和 `agents.list[].skills` 控制可见性。只有值得上游合并的编辑才应保留在仓库中并作为 PR 提交。
  </Accordion>

  <Accordion title="我可以从自定义文件夹加载技能吗？">
    可以。通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加额外目录（最低优先级）。默认优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 捆绑 → `skills.load.extraDirs`。`clawhub` 默认安装到 `./skills`，OpenClaw 在下一个 Session 中将其视为 `<workspace>/skills`。如果技能只应对某些 Agent 可见，请配合 `agents.defaults.skills` 或 `agents.list[].skills` 使用。
  </Accordion>

  <Accordion title="如何对不同任务使用不同的模型？">
    目前支持的模式有：

    - **Cron 任务**：隔离任务可以每个任务设置 `model` 覆盖。
    - **子 Agent**：将任务路由到具有不同默认模型的独立 Agent。
    - **按需切换**：使用 `/model` 随时切换当前 Session 模型。

    参见 [Cron 任务](/automation/cron-jobs)、[多 Agent 路由](/concepts/multi-agent)和 [Slash 命令](/tools/slash-commands)。

  </Accordion>

  <Accordion title="机器人在执行繁重工作时卡住了。如何将其卸载？">
    对于长时间或并行任务，使用**子 Agent**。子 Agent 在自己的 Session 中运行，返回摘要，并保持主聊天响应。

    让你的机器人"为这个任务创建一个子 Agent"或使用 `/subagents`。
    在聊天中使用 `/status` 查看 Gateway 当前正在执行的操作（以及它是否繁忙）。

    令牌提示：长任务和子 Agent 都会消耗令牌。如果成本是个问题，通过 `agents.defaults.subagents.model` 为子 Agent 设置更便宜的模型。

    文档：[子 Agent](/tools/subagents)、[后台任务](/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上线程绑定的子 Agent Session 是如何工作的？">
    使用线程绑定。你可以将 Discord 线程绑定到子 Agent 或 Session 目标，使该线程中的后续消息保持在该绑定 Session 上。

    基本流程：

    - 使用 `sessions_spawn` 并设置 `thread: true`（以及可选的 `mode: "session"` 用于持久跟进）来创建。
    - 或使用 `/focus <target>` 手动绑定。
    - 使用 `/agents` 检查绑定状态。
    - 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自动取消焦点。
    - 使用 `/unfocus` 解除线程绑定。

    所需配置：

    - 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 覆盖：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 创建时自动绑定：`channels.discord.threadBindings.spawnSessions` 默认为 `true`；设置为 `false` 可禁用线程绑定 Session 创建。

    文档：[子 Agent](/tools/subagents)、[Discord](/channels/discord)、[配置参考](/gateway/configuration-reference)、[Slash 命令](/tools/slash-commands)。

  </Accordion>

  <Accordion title="子 Agent 完成了，但完成更新发送到了错误的地方或从未发送。我应该检查什么？">
    首先检查已解析的请求者路由：

    - 完成模式子 Agent 交付优先使用任何绑定的线程或对话路由（如果存在）。
    - 如果完成来源只携带 Channel，OpenClaw 回退到请求者 Session 存储的路由（`lastChannel` / `lastTo` / `lastAccountId`），使直接交付仍能成功。
    - 如果既没有绑定路由也没有可用的存储路由，直接交付可能失败，结果会回退到队列 Session 交付，而不是立即发送到聊天。
    - 无效或过时的目标仍然可以强制回退到队列或最终交付失败。
    - 如果子 Agent 最后可见的助手回复恰好是静默令牌 `NO_REPLY` / `no_reply`，或恰好是 `ANNOUNCE_SKIP`，OpenClaw 会故意抑制通知，而不是发送过时的早期进度。
    - 如果子 Agent 仅在工具调用后超时，通知可能会将其折叠成简短的部分进度摘要，而不是重放原始工具输出。

    调试：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[子 Agent](/tools/subagents)、[后台任务](/automation/tasks)、[Session 工具](/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或提醒未触发。我应该检查什么？">
    Cron 在 Gateway 进程内运行。如果 Gateway 不持续运行，计划任务将不会运行。

    检查清单：

    - 确认 Cron 已启用（`cron.enabled`）且未设置 `OPENCLAW_SKIP_CRON`。
    - 检查 Gateway 是否全天候运行（无休眠/重启）。
    - 验证任务的时区设置（`--tz` 与主机时区）。

    调试：

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文档：[Cron 任务](/automation/cron-jobs)、[自动化](/automation)。

  </Accordion>

  <Accordion title="Cron 触发了，但没有向 Channel 发送任何内容。为什么？">
    首先检查交付模式：

    - `--no-deliver` / `delivery.mode: "none"` 意味着不期望运行器回退发送。
    - 缺少或无效的通知目标（`channel` / `to`）意味着运行器跳过了出站交付。
    - Channel 认证失败（`unauthorized`、`Forbidden`）意味着运行器尝试交付但凭据阻止了它。
    - 静默隔离结果（仅 `NO_REPLY` / `no_reply`）被视为故意不可交付，因此运行器也抑制了队列回退交付。

    对于隔离 Cron 任务，当聊天路由可用时，Agent 仍可以使用 `message` 工具直接发送。`--announce` 仅控制 Agent 尚未发送的最终文本的运行器回退路径。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron 任务](/automation/cron-jobs)、[后台任务](/automation/tasks)。

  </Accordion>

  <Accordion title="为什么隔离 Cron 运行切换了模型或重试了一次？">
    这通常是实时模型切换路径，而不是重复调度。

    隔离 Cron 可以在活动运行抛出 `LiveSessionModelSwitchError` 时持久化运行时模型切换并重试。重试保留了切换后的 Provider/模型，如果切换携带了新的认证配置文件覆盖，Cron 也会在重试前持久化它。

    相关选择规则：

    - Gmail Hook 模型覆盖首先生效（如适用）。
    - 然后是每个任务的 `model`。
    - 然后是任何存储的 Cron Session 模型覆盖。
    - 然后是正常的 Agent/默认模型选择。

    重试循环是有界的。在初始尝试加 2 次切换重试之后，Cron 会中止而不是无限循环。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron 任务](/automation/cron-jobs)、[Cron CLI](/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装技能？">
    使用原生 `openclaw skills` 命令或将技能放入你的工作区。macOS 技能 UI 在 Linux 上不可用。
    在 [https://clawhub.ai](https://clawhub.ai) 浏览技能。

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    原生 `openclaw skills install` 写入活动工作区的 `skills/` 目录。只有在你想发布或同步自己的技能时才安装独立的 `clawhub` CLI。对于跨 Agent 的共享安装，将技能放在 `~/.openclaw/skills` 下，如果你想限制哪些 Agent 可以看到它，使用 `agents.defaults.skills` 或 `agents.list[].skills`。

  </Accordion>

  <Accordion title="OpenClaw 可以按计划或在后台持续运行任务吗？">
    可以。使用 Gateway 调度器：

    - **Cron 任务**，用于计划或重复任务（重启后持久）。
    - **心跳**，用于"主 Session"定期检查。
    - **隔离任务**，用于发布摘要或交付到聊天的自主 Agent。

    文档：[Cron 任务](/automation/cron-jobs)、[自动化和任务](/automation)、[心跳](/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以从 Linux 运行仅 Apple macOS 的技能吗？">
    不能直接运行。macOS 技能受 `metadata.openclaw.os` 加所需二进制文件限制，技能只有在 **Gateway 主机**上符合条件时才会出现在系统提示中。在 Linux 上，仅限 `darwin` 的技能（如 `apple-notes`、`apple-reminders`、`things-mac`）不会加载，除非你覆盖了限制。

    支持三种模式：

    **选项 A - 在 Mac 上运行 Gateway（最简单）。**
    在 macOS 二进制文件所在的地方运行 Gateway，然后在[远程模式](#gateway-ports-already-running-and-remote-mode)或通过 Tailscale 从 Linux 连接。技能正常加载，因为 Gateway 主机是 macOS。

    **选项 B - 使用 macOS Node（无 SSH）。**
    在 Linux 上运行 Gateway，配对 macOS Node（菜单栏应用），并在 Mac 上将 **Node 运行命令**设置为"总是询问"或"总是允许"。当所需二进制文件存在于 Node 上时，OpenClaw 可以将仅 macOS 的技能视为符合条件。Agent 通过 `nodes` 工具运行这些技能。如果你选择"总是询问"，在提示中批准"总是允许"会将该命令添加到允许列表。

    **选项 C - 通过 SSH 代理 macOS 二进制文件（高级）。**
    保持 Gateway 在 Linux 上，但让所需的 CLI 二进制文件解析为在 Mac 上运行的 SSH 包装器。然后覆盖技能以允许 Linux，使其保持符合条件。

    1. 为二进制文件创建 SSH 包装器（示例：Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 将包装器放在 Linux 主机的 `PATH` 上（例如 `~/bin/memo`）。
    3. 覆盖技能元数据（工作区或 `~/.openclaw/skills`）以允许 Linux：

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 启动新 Session 以刷新技能快照。

  </Accordion>

  <Accordion title="你们有 Notion 或 HeyGen 集成吗？">
    目前没有内置集成。

    选项：

    - **自定义技能/插件：** 最适合可靠的 API 访问（Notion/HeyGen 都有 API）。
    - **浏览器自动化：** 无需代码，但速度较慢且更脆弱。

    如果你想为每个客户保留上下文（代理工作流），一个简单的模式是：

    - 每个客户一个 Notion 页面（上下文 + 偏好 + 活动工作）。
    - 让 Agent 在 Session 开始时获取该页面。

    如果你想要原生集成，请提交功能请求或构建针对这些 API 的技能。

    安装技能：

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生安装落在活动工作区的 `skills/` 目录中。对于跨 Agent 的共享技能，将其放在 `~/.openclaw/skills/<name>/SKILL.md` 中。如果只有某些 Agent 应该看到共享安装，配置 `agents.defaults.skills` 或 `agents.list[].skills`。一些技能需要通过 Homebrew 安装的二进制文件；在 Linux 上这意味着 Linuxbrew（参见上面的 Homebrew Linux FAQ 条目）。参见[技能](/tools/skills)、[技能配置](/tools/skills-config)和 [ClawHub](/clawhub)。

  </Accordion>

  <Accordion title="如何在 OpenClaw 中使用我现有的已登录 Chrome？">
    使用内置的 `user` 浏览器配置文件，通过 Chrome DevTools MCP 连接：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    如果你想要自定义名称，创建一个显式 MCP 配置文件：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    此路径可以使用本地主机浏览器或已连接的浏览器 Node。如果 Gateway 运行在其他地方，可以在浏览器所在机器上运行 Node 主机，或改用远程 CDP。

    `existing-session` / `user` 的当前限制：

    - 操作由 ref 驱动，而非 CSS 选择器驱动
    - 上传需要 `ref` / `inputRef`，目前每次支持一个文件
    - `responsebody`、PDF 导出、下载拦截和批量操作仍需要托管浏览器或原始 CDP 配置文件

  </Accordion>
</AccordionGroup>

## 沙箱和记忆

<AccordionGroup>
  <Accordion title="有专门的沙箱文档吗？">
    有。参见[沙箱](/gateway/sandboxing)。关于 Docker 特定设置（完整 Gateway 在 Docker 或沙箱镜像中），参见 [Docker](/install/docker)。
  </Accordion>

  <Accordion title="Docker 感觉受限——如何启用完整功能？">
    默认镜像以安全为先，以 `node` 用户运行，因此不包含系统包、Homebrew 或捆绑浏览器。要获得更完整的设置：

    - 使用 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，使缓存在重启后保留。
    - 使用 `OPENCLAW_IMAGE_APT_PACKAGES` 将系统依赖项烘焙到镜像中。
    - 通过捆绑 CLI 安装 Playwright 浏览器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 设置 `PLAYWRIGHT_BROWSERS_PATH` 并确保路径被持久化。

    文档：[Docker](/install/docker)、[浏览器](/tools/browser)。

  </Accordion>

  <Accordion title="我能保持 DM 私密，同时对一个 Agent 公开/沙箱化群组吗？">
    可以——如果你的私密流量是 **DM**，公共流量是**群组**。

    使用 `agents.defaults.sandbox.mode: "non-main"` 使群组/Channel Session（非主键）在配置的沙箱后端运行，而主 DM Session 保持在主机上。如果你不选择，Docker 是默认后端。然后通过 `tools.sandbox.tools` 限制沙箱 Session 中可用的工具。

    设置演练 + 示例配置：[群组：个人 DM + 公共群组](/channels/groups#pattern-personal-dms-public-groups-single-agent)

    关键配置参考：[Gateway 配置](/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="如何将主机文件夹绑定到沙箱中？">
    将 `agents.defaults.sandbox.docker.binds` 设置为 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全局 + 每个 Agent 的绑定会合并；当 `scope: "shared"` 时，每个 Agent 的绑定会被忽略。对任何敏感内容使用 `:ro`，记住绑定会绕过沙箱文件系统壁垒。

    OpenClaw 会针对规范化路径和通过最深现有祖先解析的规范路径验证绑定源。这意味着即使最后一个路径段尚不存在，符号链接父级逃逸仍然会失败，并且在符号链接解析后仍会应用允许根检查。

    参见[沙箱](/gateway/sandboxing#custom-bind-mounts)和[沙箱 vs 工具策略 vs 提升](/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)的示例和安全说明。

  </Accordion>

  <Accordion title="记忆是如何工作的？">
    OpenClaw 记忆只是 Agent 工作区中的 Markdown 文件：

    - `memory/YYYY-MM-DD.md` 中的每日笔记
    - `MEMORY.md` 中的精选长期笔记（仅限主/私有 Session）

    OpenClaw 还会运行**静默预压缩记忆刷新**，在自动压缩之前提醒模型写入持久笔记。只有当工作区可写时才会运行（只读沙箱跳过它）。参见[记忆](/concepts/memory)。

  </Accordion>

  <Accordion title="记忆一直忘事。如何让它记住？">
    让机器人**将事实写入记忆**。长期笔记属于 `MEMORY.md`，短期上下文放入 `memory/YYYY-MM-DD.md`。

    这仍然是我们正在改进的领域。提醒模型存储记忆很有帮助；它会知道该怎么做。如果它一直忘记，确认 Gateway 每次运行时都使用相同的工作区。

    文档：[记忆](/concepts/memory)、[Agent 工作区](/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="记忆会永久保存吗？有什么限制？">
    记忆文件保存在磁盘上，直到你删除它们为止。限制是你的存储空间，而不是模型。**Session 上下文**仍然受模型上下文窗口限制，因此长对话可能会被压缩或截断。这就是记忆搜索存在的原因——它只将相关部分拉回上下文。

    文档：[记忆](/concepts/memory)、[上下文](/concepts/context)。

  </Accordion>

  <Accordion title="语义记忆搜索需要 OpenAI API 密钥吗？">
    只有在使用 **OpenAI 嵌入**时才需要。Codex OAuth 涵盖聊天/completions，**不**授予嵌入访问权限，因此**使用 Codex 登录（OAuth 或 Codex CLI 登录）**对语义记忆搜索没有帮助。OpenAI 嵌入仍然需要真实的 API 密钥（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你没有明确设置 Provider，OpenClaw 会在能解析 API 密钥时自动选择 Provider（认证配置文件、`models.providers.*.apiKey` 或环境变量）。它优先选择 OpenAI（如果 OpenAI 密钥解析），否则选择 Gemini（如果 Gemini 密钥解析），然后是 Voyage，然后是 Mistral。如果没有可用的远程密钥，记忆搜索将保持禁用，直到你配置它。如果你配置了本地模型路径且该路径存在，OpenClaw 优先选择 `local`。当你显式设置 `memorySearch.provider = "ollama"` 时支持 Ollama。

    如果你希望保持本地，设置 `memorySearch.provider = "local"`（以及可选的 `memorySearch.fallback = "none"`）。如果你想要 Gemini 嵌入，设置 `memorySearch.provider = "gemini"` 并提供 `GEMINI_API_KEY`（或 `memorySearch.remote.apiKey`）。我们支持 **OpenAI、Gemini、Voyage、Mistral、Ollama 或本地**嵌入模型——参见[记忆](/concepts/memory)了解设置详情。

  </Accordion>
</AccordionGroup>

## 数据存储位置

<AccordionGroup>
  <Accordion title="与 OpenClaw 一起使用的所有数据都保存在本地吗？">
    不——**OpenClaw 的状态是本地的**，但**外部服务仍然看到你发送给它们的内容**。

    - **默认本地：** Session、记忆文件、配置和工作区保存在 Gateway 主机上（`~/.openclaw` + 你的工作区目录）。
    - **必要时远程：** 你发送给模型 Provider（Anthropic/OpenAI 等）的消息会发送到它们的 API，聊天平台（WhatsApp/Telegram/Slack 等）将消息数据存储在它们的服务器上。
    - **你控制足迹：** 使用本地模型可以将提示保留在你的机器上，但 Channel 流量仍然通过 Channel 的服务器。

    相关：[Agent 工作区](/concepts/agent-workspace)、[记忆](/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 将数据存储在哪里？">
    所有内容都在 `$OPENCLAW_STATE_DIR` 下（默认：`~/.openclaw`）：

    | 路径                                                              | 用途                                                             |
    | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                               | 主配置（JSON5）                                                  |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                      | 旧版 OAuth 导入（首次使用时复制到认证配置文件）                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`   | 认证配置文件（OAuth、API 密钥和可选的 `keyRef`/`tokenRef`）      |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                | `file` SecretRef Provider 的可选文件支持的密钥有效负载           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`            | 旧版兼容性文件（已清除静态 `api_key` 条目）                      |
    | `$OPENCLAW_STATE_DIR/credentials/`                                | Provider 状态（例如 `whatsapp/<accountId>/creds.json`）          |
    | `$OPENCLAW_STATE_DIR/agents/`                                     | 每个 Agent 状态（agentDir + Session）                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                  | 对话历史和状态（每个 Agent）                                     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`     | Session 元数据（每个 Agent）                                     |

    旧版单 Agent 路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）。

    你的**工作区**（AGENTS.md、记忆文件、技能等）是独立的，通过 `agents.defaults.workspace` 配置（默认：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里？">
    这些文件位于 **Agent 工作区**，而不是 `~/.openclaw`。

    - **工作区（每个 Agent）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`memory/YYYY-MM-DD.md`，可选 `HEARTBEAT.md`。
      小写根目录 `memory.md` 仅为旧版修复输入；`openclaw doctor --fix` 可在两个文件都存在时将其合并到 `MEMORY.md`。
    - **状态目录（`~/.openclaw`）**：配置、Channel/Provider 状态、认证配置文件、Session、日志和共享技能（`~/.openclaw/skills`）。

    默认工作区为 `~/.openclaw/workspace`，可通过以下方式配置：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果机器人在重启后"忘记"了，确认 Gateway 每次启动时都使用相同的工作区（记住：远程模式使用 **Gateway 主机的**工作区，而不是你本地笔记本电脑的工作区）。

    提示：如果你想要持久的行为或偏好，让机器人**将其写入 AGENTS.md 或 MEMORY.md**，而不是依赖聊天历史。

    参见 [Agent 工作区](/concepts/agent-workspace)和[记忆](/concepts/memory)。

  </Accordion>

  <Accordion title="推荐的备份策略">
    将你的 **Agent 工作区**放在**私有** git 仓库中，并将其备份到私有的地方（例如 GitHub 私有仓库）。这会捕获记忆 + AGENTS/SOUL/USER 文件，让你以后可以恢复助手的"思维"。

    **不要**提交 `~/.openclaw` 下的任何内容（凭据、Session、令牌或加密密钥有效负载）。
    如果你需要完整恢复，分别备份工作区和状态目录（参见上面的迁移问题）。

    文档：[Agent 工作区](/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何完全卸载 OpenClaw？">
    参见专用指南：[卸载](/install/uninstall)。
  </Accordion>

  <Accordion title="Agent 可以在工作区外工作吗？">
    可以。工作区是**默认 cwd** 和记忆锚点，而不是硬沙箱。
    相对路径在工作区内解析，但绝对路径可以访问其他主机位置，除非启用了沙箱。如果你需要隔离，使用
    [`agents.defaults.sandbox`](/gateway/sandboxing) 或每个 Agent 的沙箱设置。如果你想让某个仓库成为默认工作目录，将该 Agent 的
    `workspace` 指向仓库根目录。OpenClaw 仓库只是源代码；保持工作区独立，除非你故意想让 Agent 在其中工作。

    示例（仓库作为默认 cwd）：

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="远程模式：Session 存储在哪里？">
    Session 状态由 **Gateway 主机**拥有。如果你处于远程模式，你关心的 Session 存储在远程机器上，而不是你的本地笔记本电脑上。参见 [Session 管理](/concepts/session)。
  </Accordion>
</AccordionGroup>

## 配置基础

<AccordionGroup>
  <Accordion title="配置是什么格式的？在哪里？">
    OpenClaw 从 `$OPENCLAW_CONFIG_PATH` 读取可选的 **JSON5** 配置（默认：`~/.openclaw/openclaw.json`）：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果文件缺失，它会使用相对安全的默认值（包括默认工作区 `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title='我设置了 gateway.bind: "lan"（或 "tailnet"），现在什么都没监听 / UI 说未授权'>
    非回环绑定**需要有效的 Gateway 认证路径**。实际上这意味着：

    - 共享密钥认证：令牌或密码
    - `gateway.auth.mode: "trusted-proxy"` 在正确配置的身份感知反向代理后面

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    注意事项：

    - `gateway.remote.token` / `.password` 本身**不**启用本地 Gateway 认证。
    - 本地调用路径只能在 `gateway.auth.*` 未设置时使用 `gateway.remote.*` 作为回退。
    - 对于密码认证，设置 `gateway.auth.mode: "password"` 加 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置但未解析，解析会失败关闭（无远程回退掩盖）。
    - 共享密钥 Control UI 设置通过 `connect.params.auth.token` 或 `connect.params.auth.password` 进行认证（存储在应用/UI 设置中）。Tailscale Serve 或 `trusted-proxy` 等身份承载模式使用请求头。避免在 URL 中放置共享密钥。
    - 使用 `gateway.auth.mode: "trusted-proxy"` 时，同一主机回环反向代理需要显式的 `gateway.auth.trustedProxy.allowLoopback = true` 和 `gateway.trustedProxies` 中的回环条目。

  </Accordion>

  <Accordion title="为什么现在在本地主机上也需要令牌？">
    OpenClaw 默认强制 Gateway 认证，包括回环。在正常默认路径中，这意味着令牌认证：如果没有配置显式认证路径，Gateway 启动时会解析为令牌模式，并为该启动生成仅运行时令牌，因此**本地 WS 客户端必须进行认证**。当客户端需要在重启之间保持稳定密钥时，显式配置 `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD`。这会阻止其他本地进程调用 Gateway。

    如果你希望不同的认证路径，可以显式选择密码模式（或者，对于身份感知反向代理，使用 `trusted-proxy`）。如果你**真的**想要开放回环，在配置中显式设置 `gateway.auth.mode: "none"`。Doctor 可以随时为你生成令牌：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="更改配置后需要重启吗？">
    Gateway 监视配置并支持热重载：

    - `gateway.reload.mode: "hybrid"`（默认）：热应用安全更改，对关键更改重启
    - 也支持 `hot`、`restart`、`off`

  </Accordion>

  <Accordion title="如何禁用有趣的 CLI 标语？">
    在配置中设置 `cli.banner.taglineMode`：

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`：隐藏标语文本，但保留横幅标题/版本行。
    - `default`：每次都使用 `All your chats, one OpenClaw.`。
    - `random`：轮换的有趣/季节性标语（默认行为）。
    - 如果你根本不想要横幅，设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何启用 Web 搜索（和 Web 抓取）？">
    `web_fetch` 无需 API 密钥即可工作。`web_search` 取决于你选择的 Provider：

    - 基于 API 的 Provider（如 Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity 和 Tavily）需要其常规 API 密钥设置。
    - Ollama Web Search 免密钥，但它使用你配置的 Ollama 主机，需要 `ollama signin`。
    - DuckDuckGo 免密钥，但它是一种非官方的基于 HTML 的集成。
    - SearXNG 免密钥/自托管；配置 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **推荐：** 运行 `openclaw configure --section web` 并选择 Provider。
    环境变量替代方案：

    - Brave：`BRAVE_API_KEY`
    - Exa：`EXA_API_KEY`
    - Firecrawl：`FIRECRAWL_API_KEY`
    - Gemini：`GEMINI_API_KEY`
    - Grok：`XAI_API_KEY`
    - Kimi：`KIMI_API_KEY` 或 `MOONSHOT_API_KEY`
    - MiniMax Search：`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`
    - Perplexity：`PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`
    - SearXNG：`SEARXNG_BASE_URL`
    - Tavily：`TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // 可选；省略则自动检测
            },
          },
        },
    }
    ```

    Provider 特定的 Web 搜索配置现在位于 `plugins.entries.<plugin>.config.webSearch.*` 下。
    旧版 `tools.web.search.*` Provider 路径暂时仍加载以保持兼容性，但不应在新配置中使用。
    Firecrawl Web 抓取回退配置位于 `plugins.entries.firecrawl.config.webFetch.*` 下。

    注意事项：

    - 如果你使用允许列表，添加 `web_search`/`web_fetch`/`x_search` 或 `group:web`。
    - `web_fetch` 默认启用（除非明确禁用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 从可用凭据中自动检测第一个就绪的抓取回退 Provider。目前捆绑的 Provider 是 Firecrawl。
    - 守护进程从 `~/.openclaw/.env`（或服务环境）读取环境变量。

    文档：[Web 工具](/tools/web)。

  </Accordion>

  <Accordion title="config.apply 清空了我的配置。如何恢复并避免这种情况？">
    `config.apply` 替换**整个配置**。如果你发送一个部分对象，其他所有内容都会被删除。

    当前 OpenClaw 保护许多意外覆盖：

    - OpenClaw 拥有的配置写入在写入前会验证完整的后更改配置。
    - 无效或破坏性的 OpenClaw 拥有的写入会被拒绝，并保存为 `openclaw.json.rejected.*`。
    - 如果直接编辑破坏了启动或热重载，Gateway 会失败关闭或跳过重载；它不会重写 `openclaw.json`。
    - `openclaw doctor --fix` 拥有修复，可以恢复最后已知良好状态，同时将拒绝的文件保存为 `openclaw.json.clobbered.*`。

    恢复：

    - 检查 `openclaw logs --follow` 中的 `Invalid config at`、`Config write rejected:` 或 `config reload skipped (invalid config)`。
    - 检查活动配置旁边最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 运行 `openclaw config validate` 和 `openclaw doctor --fix`。
    - 使用 `openclaw config set` 或 `config.patch` 仅复制回预期的键。
    - 如果你没有最后已知良好状态或拒绝的有效负载，从备份恢复，或重新运行 `openclaw doctor` 并重新配置 Channel/模型。
    - 如果这是意外的，请提交 bug 并包含你最后已知的配置或任何备份。
    - 本地编码 Agent 通常可以从日志或历史记录重建工作配置。

    避免：

    - 对小更改使用 `openclaw config set`。
    - 对交互式编辑使用 `openclaw configure`。
    - 如果你不确定确切路径或字段形状，先使用 `config.schema.lookup`；它返回一个浅层 schema 节点加直接子摘要以供向下钻取。
    - 对部分 RPC 编辑使用 `config.patch`；仅将 `config.apply` 用于完整配置替换。
    - 如果你使用来自 Agent 运行的仅拥有者 `gateway` 工具，它仍然拒绝写入 `tools.exec.ask` / `tools.exec.security`；旧版 `tools.bash.*` 别名规范化为相同的受保护 exec 路径。

    文档：[Config](/cli/config)、[Configure](/cli/configure)、[Gateway 故障排除](/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/gateway/doctor)。

  </Accordion>

  <Accordion title="如何跨设备运行带有专业 Worker 的中央 Gateway？">
    常见模式是**一个 Gateway**（例如 Raspberry Pi）加上 **Node** 和 **Agent**：

    - **Gateway（中央）：** 拥有 Channel（Signal/WhatsApp）、路由和 Session。
    - **Node（设备）：** Mac/iOS/Android 作为外设连接并公开本地工具（`system.run`、`canvas`、`camera`）。
    - **Agent（Worker）：** 用于特殊角色的独立工作区（例如"Hetzner 运维"、"个人数据"）。
    - **子 Agent：** 当你需要并行处理时，从主 Agent 创建后台工作。
    - **TUI：** 连接到 Gateway 并切换 Agent/Session。

    文档：[Node](/nodes)、[远程访问](/gateway/remote)、[多 Agent 路由](/concepts/multi-agent)、[子 Agent](/tools/subagents)、[TUI](/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw 浏览器可以无头运行吗？">
    可以。这是一个配置选项：

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    默认为 `false`（有头）。无头模式在某些网站上更容易触发反机器人检查。参见[浏览器](/tools/browser)。

    无头使用**相同的 Chromium 引擎**，适用于大多数自动化（表单、点击、抓取、登录）。主要区别：

    - 无可见浏览器窗口（需要视觉效果时使用截图）。
    - 某些网站在无头模式下对自动化更严格（验证码、反机器人）。
      例如，X/Twitter 经常阻止无头 Session。

  </Accordion>

  <Accordion title="如何使用 Brave 进行浏览器控制？">
    将 `browser.executablePath` 设置为你的 Brave 二进制文件（或任何基于 Chromium 的浏览器）并重启 Gateway。
    参见[浏览器](/tools/browser#use-brave-or-another-chromium-based-browser)中的完整配置示例。
  </Accordion>
</AccordionGroup>

## 远程 Gateway 和 Node

<AccordionGroup>
  <Accordion title="命令如何在 Telegram、Gateway 和 Node 之间传播？">
    Telegram 消息由 **Gateway** 处理。Gateway 运行 Agent，只有在需要 Node 工具时才通过 **Gateway WebSocket** 调用 Node：

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node 不看到入站 Provider 流量；它们只接收 Node RPC 调用。

  </Accordion>

  <Accordion title="如果 Gateway 远程托管，我的 Agent 如何访问我的计算机？">
    简答：**将你的计算机配对为 Node**。Gateway 运行在其他地方，但它可以通过 Gateway WebSocket 在你的本地机器上调用 `node.*` 工具（屏幕、摄像头、系统）。

    典型设置：

    1. 在始终运行的主机（VPS/家庭服务器）上运行 Gateway。
    2. 将 Gateway 主机和你的计算机放在同一 tailnet 上。
    3. 确保 Gateway WS 可达（tailnet 绑定或 SSH 隧道）。
    4. 在本地打开 macOS 应用，在**远程通过 SSH** 模式下连接（或直接 tailnet），使其可以注册为 Node。
    5. 在 Gateway 上批准 Node：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要单独的 TCP 桥接；Node 通过 Gateway WebSocket 连接。

    安全提示：配对 macOS Node 允许在该机器上使用 `system.run`。只配对你信任的设备，并审查[安全性](/gateway/security)。

    文档：[Node](/nodes)、[Gateway 协议](/gateway/protocol)、[macOS 远程模式](/platforms/mac/remote)、[安全性](/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已连接但我没有收到回复。现在怎么办？">
    检查基础：

    - Gateway 正在运行：`openclaw gateway status`
    - Gateway 健康：`openclaw status`
    - Channel 健康：`openclaw channels status`

    然后验证认证和路由：

    - 如果你使用 Tailscale Serve，确保正确设置了 `gateway.auth.allowTailscale`。
    - 如果你通过 SSH 隧道连接，确认本地隧道已启动并指向正确的端口。
    - 确认你的允许列表（DM 或群组）包含你的账户。

    文档：[Tailscale](/gateway/tailscale)、[远程访问](/gateway/remote)、[Channel](/channels)。

  </Accordion>

  <Accordion title="两个 OpenClaw 实例可以互相通信（本地 + VPS）吗？">
    可以。没有内置的"机器人对机器人"桥接，但你可以通过几种可靠的方式连接：

    **最简单：** 使用两个机器人都可以访问的普通聊天 Channel（Telegram/Slack/WhatsApp）。
    让机器人 A 向机器人 B 发送消息，然后让机器人 B 正常回复。

    **CLI 桥接（通用）：** 运行一个脚本，通过
    `openclaw agent --message ... --deliver` 调用另一个 Gateway，目标是另一个机器人监听的聊天。如果一个机器人在远程 VPS 上，通过 SSH/Tailscale 将你的 CLI 指向该远程 Gateway（参见[远程访问](/gateway/remote)）。

    示例模式（从可以访问目标 Gateway 的机器运行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：添加一个保护措施，防止两个机器人无限循环（仅提及、Channel 允许列表或"不回复机器人消息"规则）。

    文档：[远程访问](/gateway/remote)、[Agent CLI](/cli/agent)、[Agent 发送](/tools/agent-send)。

  </Accordion>

  <Accordion title="多个 Agent 需要单独的 VPS 吗？">
    不需要。一个 Gateway 可以托管多个 Agent，每个都有自己的工作区、模型默认值和路由。这是正常设置，比每个 Agent 运行一个 VPS 便宜得多也简单得多。

    只有在需要严格隔离（安全边界）或非常不同的配置时才使用单独的 VPS。否则，保持一个 Gateway，使用多个 Agent 或子 Agent。

  </Accordion>

  <Accordion title="在个人笔记本上使用 Node 与从 VPS SSH 相比有什么好处？">
    有——Node 是从远程 Gateway 访问你笔记本的一流方式，它们解锁的功能远不止 shell 访问。Gateway 在 macOS/Linux（通过 WSL2 的 Windows）上运行，轻量级（小型 VPS 或 Raspberry Pi 级别的设备就可以；4 GB RAM 够用），因此常见设置是始终运行的主机加上笔记本作为 Node。

    - **无需入站 SSH。** Node 向外连接到 Gateway WebSocket，使用设备配对。
    - **更安全的执行控制。** `system.run` 由该笔记本上的 Node 允许列表/批准控制。
    - **更多设备工具。** 除了 `system.run`，Node 还公开 `canvas`、`camera` 和 `screen`。
    - **本地浏览器自动化。** 将 Gateway 保持在 VPS 上，但通过笔记本上的 Node 主机在本地运行 Chrome，或通过 Chrome MCP 连接到主机上的本地 Chrome。

    SSH 对于临时 shell 访问很好，但 Node 对于持续的 Agent 工作流和设备自动化更简单。

    文档：[Node](/nodes)、[Node CLI](/cli/nodes)、[浏览器](/tools/browser)。

  </Accordion>

  <Accordion title="Node 是否运行 Gateway 服务？">
    不运行。每个主机只应运行**一个 Gateway**，除非你故意运行隔离配置文件（参见[多个 Gateway](/gateway/multiple-gateways)）。Node 是连接到 Gateway 的外设（iOS/Android Node，或 macOS 菜单栏应用中的"Node 模式"）。对于无头 Node 主机和 CLI 控制，参见 [Node 主机 CLI](/cli/node)。

    `gateway`、`discovery` 和托管插件表面变更需要完全重启。

  </Accordion>

  <Accordion title="有没有 API / RPC 方式应用配置？">
    有。

    - `config.schema.lookup`：在写入前检查一个配置子树，包含其浅层 schema 节点、匹配的 UI 提示和直接子摘要
    - `config.get`：获取当前快照 + 哈希
    - `config.patch`：安全的部分更新（大多数 RPC 编辑的首选）；尽可能热重载，必要时重启
    - `config.apply`：验证 + 替换完整配置；尽可能热重载，必要时重启
    - 仅拥有者 `gateway` 运行时工具仍然拒绝重写 `tools.exec.ask` / `tools.exec.security`；旧版 `tools.bash.*` 别名规范化为相同的受保护 exec 路径

  </Accordion>

  <Accordion title="首次安装的最小合理配置">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    这设置了你的工作区并限制了谁可以触发机器人。

  </Accordion>

  <Accordion title="如何在 VPS 上设置 Tailscale 并从 Mac 连接？">
    最小步骤：

    1. **在 VPS 上安装 + 登录**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在 Mac 上安装 + 登录**
       - 使用 Tailscale 应用并登录到同一 tailnet。
    3. **启用 MagicDNS（推荐）**
       - 在 Tailscale 管理控制台中，启用 MagicDNS，使 VPS 有稳定的名称。
    4. **使用 tailnet 主机名**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你想在没有 SSH 的情况下使用 Control UI，在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    这使 Gateway 绑定到回环，并通过 Tailscale 公开 HTTPS。参见 [Tailscale](/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何将 Mac Node 连接到远程 Gateway（Tailscale Serve）？">
    Serve 公开 **Gateway Control UI + WS**。Node 通过相同的 Gateway WS 端点连接。

    推荐设置：

    1. **确保 VPS + Mac 在同一 tailnet 上**。
    2. **在远程模式下使用 macOS 应用**（SSH 目标可以是 tailnet 主机名）。
       应用将隧道 Gateway 端口并作为 Node 连接。
    3. **在 Gateway 上批准 Node**：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文档：[Gateway 协议](/gateway/protocol)、[Discovery](/gateway/discovery)、[macOS 远程模式](/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我应该在第二台笔记本上安装还是只添加一个 Node？">
    如果你只需要在第二台笔记本上使用**本地工具**（屏幕/摄像头/exec），将其添加为
    **Node**。这保持单一 Gateway 并避免重复配置。本地 Node 工具目前仅限 macOS，但我们计划将其扩展到其他操作系统。

    只有在需要**严格隔离**或两个完全独立的机器人时才安装第二个 Gateway。

    文档：[Node](/nodes)、[Node CLI](/cli/nodes)、[多个 Gateway](/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 环境变量和 .env 加载 {#env-vars-and-env-loading}

<AccordionGroup>
  <Accordion title="OpenClaw 如何加载环境变量？">
    OpenClaw 从父进程（shell、launchd/systemd、CI 等）读取环境变量，并另外加载：

    - 当前工作目录中的 `.env`
    - `~/.openclaw/.env` 中的全局回退 `.env`（即 `$OPENCLAW_STATE_DIR/.env`）

    两个 `.env` 文件都不会覆盖现有的环境变量。

    你还可以在配置中定义内联环境变量（仅在进程环境中缺失时应用）：

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    参见 [/environment](/help/environment) 了解完整优先级和来源。

  </Accordion>

  <Accordion title="我通过服务启动了 Gateway，我的环境变量消失了。现在怎么办？">
    两个常见修复：

    1. 将缺失的密钥放入 `~/.openclaw/.env`，这样即使服务不继承你的 shell 环境也能加载它们。
    2. 启用 shell 导入（可选的便捷功能）：

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    这会运行你的登录 shell 并仅导入缺失的预期密钥（从不覆盖）。等效的环境变量：
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我设置了 COPILOT_GITHUB_TOKEN，但 models status 显示"Shell env: off"。为什么？'>
    `openclaw models status` 报告是否启用了 **shell 环境导入**。"Shell env: off"
    **不**意味着你的环境变量缺失——它只是意味着 OpenClaw 不会自动加载你的登录 shell。

    如果 Gateway 作为服务运行（launchd/systemd），它不会继承你的 shell 环境。通过以下方式之一修复：

    1. 将令牌放入 `~/.openclaw/.env`：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或启用 shell 导入（`env.shellEnv.enabled: true`）。
    3. 或将其添加到配置 `env` 块（仅在缺失时应用）。

    然后重启 Gateway 并重新检查：

    ```bash
    openclaw models status
    ```

    Copilot 令牌从 `COPILOT_GITHUB_TOKEN`（也支持 `GH_TOKEN` / `GITHUB_TOKEN`）读取。
    参见 [/concepts/model-providers](/concepts/model-providers) 和 [/environment](/help/environment)。

  </Accordion>
</AccordionGroup>

## Session 和多聊天

<AccordionGroup>
  <Accordion title="如何开始新的对话？">
    发送 `/new` 或 `/reset` 作为独立消息。参见 [Session 管理](/concepts/session)。
  </Accordion>

  <Accordion title="如果我从不发送 /new，Session 会自动重置吗？">
    Session 可以在 `session.idleMinutes` 后过期，但这**默认禁用**（默认 **0**）。
    将其设置为正值以启用空闲过期。启用时，空闲期后的**下一条**消息会为该聊天键启动新的 Session ID。
    这不会删除对话记录——它只是开始一个新 Session。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="有没有办法组建 OpenClaw 实例团队（一个 CEO 和多个 Agent）？">
    有，通过**多 Agent 路由**和**子 Agent**。你可以创建一个协调 Agent 和几个具有自己工作区和模型的 Worker Agent。

    不过，这最好看作是一个**有趣的实验**。它消耗大量令牌，通常比使用一个机器人加独立 Session 效率低。我们设想的典型模型是你与之交谈的一个机器人，用于并行工作的不同 Session。该机器人还可以在需要时创建子 Agent。

    文档：[多 Agent 路由](/concepts/multi-agent)、[子 Agent](/tools/subagents)、[Agents CLI](/cli/agents)。

  </Accordion>

  <Accordion title="为什么任务中途上下文被截断了？如何防止？">
    Session 上下文受模型窗口限制。长对话、大型工具输出或多个文件可能触发压缩或截断。

    有帮助的方法：

    - 让机器人总结当前状态并将其写入文件。
    - 在长任务之前使用 `/compact`，切换话题时使用 `/new`。
    - 将重要上下文保存在工作区中，让机器人读回。
    - 使用子 Agent 进行长时间或并行工作，使主聊天保持较小。
    - 如果经常出现，选择具有更大上下文窗口的模型。

  </Accordion>

  <Accordion title="如何完全重置 OpenClaw 但保持安装？">
    使用重置命令：

    ```bash
    openclaw reset
    ```

    非交互式完全重置：

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    然后重新运行设置：

    ```bash
    openclaw onboard --install-daemon
    ```

    注意事项：

    - 如果看到现有配置，入门向导也会提供**重置**选项。参见[入门向导（CLI）](/start/wizard)。
    - 如果你使用了配置文件（`--profile` / `OPENCLAW_PROFILE`），重置每个状态目录（默认为 `~/.openclaw-<profile>`）。
    - 开发重置：`openclaw gateway --dev --reset`（仅限开发；清除开发配置 + 凭据 + Session + 工作区）。

  </Accordion>

  <Accordion title='我遇到"context too large"错误——如何重置或压缩？'>
    使用以下方法之一：

    - **压缩**（保留对话但总结旧轮次）：

      ```
      /compact
      ```

      或 `/compact <指令>` 以引导总结。

    - **重置**（为同一聊天键创建新 Session ID）：

      ```
      /new
      /reset
      ```

    如果持续发生：

    - 启用或调整 **Session 修剪**（`agents.defaults.contextPruning`）以修剪旧工具输出。
    - 使用具有更大上下文窗口的模型。

    文档：[压缩](/concepts/compaction)、[Session 修剪](/concepts/session-pruning)、[Session 管理](/concepts/session)。

  </Accordion>

  <Accordion title='为什么我看到"LLM request rejected: messages.content.tool_use.input field required"？'>
    这是 Provider 验证错误：模型发出了 `tool_use` 块但没有所需的 `input`。通常意味着 Session 历史记录过时或损坏（通常在长线程或工具/schema 变更后）。

    修复：用 `/new`（独立消息）开始新 Session。

  </Accordion>

  <Accordion title="为什么我每 30 分钟收到一次心跳消息？">
    心跳默认每 **30 分钟**运行一次（使用 OAuth 认证时为 **1 小时**）。调整或禁用：

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // 或 "0m" 禁用
          },
        },
      },
    }
    ```

    如果 `HEARTBEAT.md` 存在但实际上为空（只有空白行和 markdown 标题如 `# Heading`），OpenClaw 会跳过心跳运行以节省 API 调用。
    如果文件缺失，心跳仍然运行，模型决定做什么。

    每个 Agent 的覆盖使用 `agents.list[].heartbeat`。文档：[心跳](/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要将"机器人账户"添加到 WhatsApp 群组吗？'>
    不需要。OpenClaw 在**你自己的账户**上运行，所以如果你在群组中，OpenClaw 就可以看到它。
    默认情况下，群组回复被阻止，直到你允许发送者（`groupPolicy: "allowlist"`）。

    如果你只想让**你**能够触发群组回复：

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="如何获取 WhatsApp 群组的 JID？">
    选项 1（最快）：跟踪日志并在群组中发送测试消息：

    ```bash
    openclaw logs --follow --json
    ```

    寻找 `chatId`（或 `from`）以 `@g.us` 结尾，例如：
    `1234567890-1234567890@g.us`。

    选项 2（如果已配置/在允许列表中）：从配置列出群组：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文档：[WhatsApp](/channels/whatsapp)、[Directory](/cli/directory)、[日志](/cli/logs)。

  </Accordion>

  <Accordion title="为什么 OpenClaw 在群组中不回复？">
    两个常见原因：

    - 提及限制已开启（默认）。你必须 @提及机器人（或匹配 `mentionPatterns`）。
    - 你配置了 `channels.whatsapp.groups` 但没有 `"*"`，且该群组未在允许列表中。

    参见[群组](/channels/groups)和[群组消息](/channels/group-messages)。

  </Accordion>

  <Accordion title="群组/线程与 DM 共享上下文吗？">
    默认情况下，直接聊天折叠到主 Session。群组/Channel 有自己的 Session 键，Telegram 话题/Discord 线程是独立 Session。参见[群组](/channels/groups)和[群组消息](/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以创建多少个工作区和 Agent？">
    没有硬性限制。几十个甚至几百个都没问题，但要注意：

    - **磁盘增长：** Session + 对话记录保存在 `~/.openclaw/agents/<agentId>/sessions/` 下。
    - **令牌成本：** 更多 Agent 意味着更多并发模型使用。
    - **运维开销：** 每个 Agent 的认证配置文件、工作区和 Channel 路由。

    提示：

    - 每个 Agent 保持一个**活动**工作区（`agents.defaults.workspace`）。
    - 如果磁盘增长，修剪旧 Session（删除 JSONL 或存储条目）。
    - 使用 `openclaw doctor` 发现游离工作区和配置文件不匹配。

  </Accordion>

  <Accordion title="我能同时运行多个机器人或聊天（Slack），应该如何设置？">
    可以。使用**多 Agent 路由**运行多个隔离 Agent，并按 Channel/账户/对端路由入站消息。Slack 作为 Channel 支持，可以绑定到特定 Agent。

    浏览器访问功能强大，但并非"人类能做的一切"——反机器人、验证码和 MFA 仍然可以阻止自动化。要获得最可靠的浏览器控制，在主机上使用本地 Chrome MCP，或在实际运行浏览器的机器上使用 CDP。

    最佳实践设置：

    - 始终运行的 Gateway 主机（VPS/Mac mini）。
    - 每个角色一个 Agent（绑定）。
    - 绑定到这些 Agent 的 Slack Channel。
    - 需要时通过 Chrome MCP 或 Node 使用本地浏览器。

    文档：[多 Agent 路由](/concepts/multi-agent)、[Slack](/channels/slack)、[浏览器](/tools/browser)、[Node](/nodes)。

  </Accordion>
</AccordionGroup>

## 模型、故障转移和认证配置文件

模型问答——默认值、选择、别名、切换、故障转移、认证配置文件——
请查看[模型 FAQ](/help/faq-models)。

## Gateway：端口、"已在运行"和远程模式

<AccordionGroup>
  <Accordion title="Gateway 使用哪个端口？">
    `gateway.port` 控制 WebSocket + HTTP（Control UI、Hook 等）的单一多路复用端口。

    优先级：

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > 默认 18789
    ```

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示"Runtime: running"但"Connectivity probe: failed"？'>
    因为"running"是 **supervisor** 的视图（launchd/systemd/schtasks）。连接性探测是 CLI 实际连接到 Gateway WebSocket。

    使用 `openclaw gateway status` 并信任这些行：

    - `Probe target:`（探测实际使用的 URL）
    - `Listening:`（端口上实际绑定的内容）
    - `Last gateway error:`（当进程存活但端口未监听时的常见根本原因）

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示"Config (cli)"和"Config (service)"不同？'>
    你在编辑一个配置文件，而服务在运行另一个（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不匹配）。

    修复：

    ```bash
    openclaw gateway install --force
    ```

    从你希望服务使用的相同 `--profile` / 环境运行该命令。

  </Accordion>

  <Accordion title='"another gateway instance is already listening" 是什么意思？'>
    OpenClaw 通过在启动时立即绑定 WebSocket 监听器（默认 `ws://127.0.0.1:18789`）来强制运行时锁。如果绑定失败并出现 `EADDRINUSE`，它会抛出 `GatewayLockError`，表示另一个实例已经在监听。

    修复：停止另一个实例，释放端口，或使用 `openclaw gateway --port <port>` 运行。

  </Accordion>

  <Accordion title="如何以远程模式运行 OpenClaw（客户端连接到其他地方的 Gateway）？">
    设置 `gateway.mode: "remote"` 并指向远程 WebSocket URL，可选带共享密钥远程凭据：

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    注意事项：

    - `openclaw gateway` 仅在 `gateway.mode` 为 `local` 时启动（或你传递了覆盖标志）。
    - macOS 应用监视配置文件，当这些值更改时实时切换模式。
    - `gateway.remote.token` / `.password` 是仅限客户端的远程凭据；它们本身不启用本地 Gateway 认证。

  </Accordion>

  <Accordion title='Control UI 显示"unauthorized"（或不断重连）。现在怎么办？'>
    你的 Gateway 认证路径和 UI 的认证方法不匹配。

    事实（来自代码）：

    - Control UI 将令牌保存在当前浏览器标签 Session 和所选 Gateway URL 的 `sessionStorage` 中，因此同标签刷新无需恢复长期的 localStorage 令牌持久性即可继续工作。
    - 在 `AUTH_TOKEN_MISMATCH` 上，受信任的客户端可以在 Gateway 返回重试提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）时尝试用缓存的设备令牌进行一次有界重试。
    - 缓存令牌重试现在重用与设备令牌一起存储的缓存已批准范围。显式 `deviceToken` / 显式 `scopes` 调用者仍保留其请求的范围集，而不是继承缓存的范围。
    - 在该重试路径之外，连接认证优先级为：显式共享令牌/密码，然后是显式 `deviceToken`，然后是存储的设备令牌，然后是引导令牌。
    - 内置设置代码引导仅适用于 Node。批准后，它返回 `scopes: []` 的 Node 设备令牌，不返回交接的操作员令牌。

    修复：

    - 最快：`openclaw dashboard`（打印 + 复制仪表板 URL，尝试打开；无头时显示 SSH 提示）。
    - 如果你还没有令牌：`openclaw doctor --generate-gateway-token`。
    - 如果是远程，先建立隧道：`ssh -N -L 18789:127.0.0.1:18789 user@host` 然后打开 `http://127.0.0.1:18789/`。
    - 共享密钥模式：设置 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然后在 Control UI 设置中粘贴匹配的密钥。
    - Tailscale Serve 模式：确保启用了 `gateway.auth.allowTailscale`，并且你打开的是 Serve URL，而不是绕过 Tailscale 身份头的原始回环/tailnet URL。
    - 受信任代理模式：确保你通过配置的身份感知代理访问，而不是原始 Gateway URL。同一主机的回环代理还需要 `gateway.auth.trustedProxy.allowLoopback = true`。
    - 如果一次重试后不匹配仍然存在，轮换/重新批准配对设备令牌：
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 如果该轮换调用说被拒绝，检查两件事：
      - 配对设备 Session 只能轮换**自己的**设备，除非他们还有 `operator.admin`
      - 显式 `--scope` 值不能超过调用者当前的操作员范围
    - 仍然卡住？运行 `openclaw status --all` 并遵循[故障排除](/gateway/troubleshooting)。参见 [Dashboard](/web/dashboard) 了解认证详情。

  </Accordion>

  <Accordion title="我设置了 gateway.bind tailnet 但它无法绑定且什么都没监听">
    `tailnet` 绑定从你的网络接口选择一个 Tailscale IP（100.64.0.0/10）。如果机器不在 Tailscale 上（或接口关闭），就没有可绑定的地址。

    修复：

    - 在该主机上启动 Tailscale（使其有 100.x 地址），或
    - 切换到 `gateway.bind: "loopback"` / `"lan"`。

    注意：`tailnet` 是显式的。`auto` 优先选择回环；当你想要仅 tailnet 绑定时使用 `gateway.bind: "tailnet"`。

  </Accordion>

  <Accordion title="我能在同一主机上运行多个 Gateway 吗？">
    通常不——一个 Gateway 可以运行多个消息 Channel 和 Agent。只有在需要冗余（例如救援机器人）或严格隔离时才使用多个 Gateway。

    可以，但你必须隔离：

    - `OPENCLAW_CONFIG_PATH`（每个实例配置）
    - `OPENCLAW_STATE_DIR`（每个实例状态）
    - `agents.defaults.workspace`（工作区隔离）
    - `gateway.port`（唯一端口）

    快速设置（推荐）：

    - 每个实例使用 `openclaw --profile <name> ...`（自动创建 `~/.openclaw-<name>`）。
    - 在每个配置文件配置中设置唯一的 `gateway.port`（或手动运行时传入 `--port`）。
    - 安装每个配置文件的服务：`openclaw --profile <name> gateway install`。

    配置文件还会给服务名称添加后缀（`ai.openclaw.<profile>`；旧版 `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完整指南：[多个 Gateway](/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='"invalid handshake" / 代码 1008 是什么意思？'>
    Gateway 是 **WebSocket 服务器**，它期望第一条消息是 `connect` 帧。如果收到其他任何内容，它会以**代码 1008**（策略违规）关闭连接。

    常见原因：

    - 你在浏览器中打开了 **HTTP** URL（`http://...`）而不是 WS 客户端。
    - 你使用了错误的端口或路径。
    - 代理或隧道剥离了认证头或发送了非 Gateway 请求。

    快速修复：

    1. 使用 WS URL：`ws://<host>:18789`（如果是 HTTPS 则用 `wss://...`）。
    2. 不要在普通浏览器标签中打开 WS 端口。
    3. 如果认证已开启，在 `connect` 帧中包含令牌/密码。

    如果你使用 CLI 或 TUI，URL 应该如下所示：

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    协议详情：[Gateway 协议](/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## 日志记录和调试

<AccordionGroup>
  <Accordion title="日志在哪里？">
    文件日志（结构化）：

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    你可以通过 `logging.file` 设置稳定路径。文件日志级别由 `logging.level` 控制。控制台详细程度由 `--verbose` 和 `logging.consoleLevel` 控制。

    最快日志跟踪：

    ```bash
    openclaw logs --follow
    ```

    服务/supervisor 日志（当 Gateway 通过 launchd/systemd 运行时）：

    - macOS：`$OPENCLAW_STATE_DIR/logs/gateway.log` 和 `gateway.err.log`（默认：`~/.openclaw/logs/...`；配置文件使用 `~/.openclaw-<profile>/logs/...`）
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    更多内容参见[故障排除](/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="如何启动/停止/重启 Gateway 服务？">
    使用 Gateway 辅助命令：

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手动运行 Gateway，`openclaw gateway --force` 可以重新占用端口。参见 [Gateway](/gateway)。

  </Accordion>

  <Accordion title="我在 Windows 上关闭了终端——如何重启 OpenClaw？">
    有**两种 Windows 安装模式**：

    **1) WSL2（推荐）：** Gateway 在 Linux 内部运行。

    打开 PowerShell，进入 WSL，然后重启：

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你从未安装服务，在前台启动：

    ```bash
    openclaw gateway run
    ```

    **2) 原生 Windows（不推荐）：** Gateway 直接在 Windows 中运行。

    打开 PowerShell 并运行：

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手动运行（无服务），使用：

    ```powershell
    openclaw gateway run
    ```

    文档：[Windows (WSL2)](/platforms/windows)、[Gateway 服务手册](/gateway)。

  </Accordion>

  <Accordion title="Gateway 正在运行但回复从未到达。我应该检查什么？">
    从快速健康扫描开始：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常见原因：

    - 模型认证未在 **Gateway 主机**上加载（检查 `models status`）。
    - Channel 配对/允许列表阻止回复（检查 Channel 配置 + 日志）。
    - WebChat/Dashboard 在没有正确令牌的情况下打开。

    如果你是远程的，确认隧道/Tailscale 连接正常，Gateway WebSocket 可达。

    文档：[Channel](/channels)、[故障排除](/gateway/troubleshooting)、[远程访问](/gateway/remote)。

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason"——现在怎么办？'>
    这通常意味着 UI 失去了 WebSocket 连接。检查：

    1. Gateway 正在运行吗？`openclaw gateway status`
    2. Gateway 是否健康？`openclaw status`
    3. UI 是否有正确的令牌？`openclaw dashboard`
    4. 如果是远程，隧道/Tailscale 链接是否正常？

    然后跟踪日志：

    ```bash
    openclaw logs --follow
    ```

    文档：[Dashboard](/web/dashboard)、[远程访问](/gateway/remote)、[故障排除](/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands 失败。我应该检查什么？">
    从日志和 Channel 状态开始：

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    然后匹配错误：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 菜单条目太多。OpenClaw 已经修剪到 Telegram 限制并用更少的命令重试，但仍需删除一些菜单条目。减少插件/技能/自定义命令，或如果不需要菜单则禁用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!` 或类似网络错误：如果你在 VPS 上或代理后面，确认允许出站 HTTPS 并且 DNS 对 `api.telegram.org` 有效。

    如果 Gateway 是远程的，确保你查看的是 Gateway 主机上的日志。

    文档：[Telegram](/channels/telegram)、[Channel 故障排除](/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI 没有显示输出。我应该检查什么？">
    首先确认 Gateway 可达且 Agent 可以运行：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    在 TUI 中，使用 `/status` 查看当前状态。如果你期望在聊天 Channel 中收到回复，确保交付已启用（`/deliver on`）。

    文档：[TUI](/web/tui)、[Slash 命令](/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何完全停止然后启动 Gateway？">
    如果你安装了服务：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    这会停止/启动**监督服务**（macOS 上的 launchd，Linux 上的 systemd）。
    当 Gateway 作为守护进程在后台运行时使用此方法。

    如果你在前台运行，用 Ctrl-C 停止，然后：

    ```bash
    openclaw gateway run
    ```

    文档：[Gateway 服务手册](/gateway)。

  </Accordion>

  <Accordion title="通俗解释：openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`：重启**后台服务**（launchd/systemd）。
    - `openclaw gateway`：在这个终端 Session 中**在前台**运行 Gateway。

    如果你安装了服务，使用 Gateway 命令。当你想要一次性的前台运行时使用 `openclaw gateway`。

  </Accordion>

  <Accordion title="出现失败时获取更多详情的最快方法">
    使用 `--verbose` 启动 Gateway 以获得更多控制台详情。然后检查日志文件中的 Channel 认证、模型路由和 RPC 错误。
  </Accordion>
</AccordionGroup>

## 媒体和附件

<AccordionGroup>
  <Accordion title="我的技能生成了图片/PDF，但没有发送任何内容">
    来自 Agent 的出站附件必须包含一行 `MEDIA:<path-or-url>`（独占一行）。参见 [OpenClaw 助手设置](/start/openclaw)和 [Agent 发送](/tools/agent-send)。

    CLI 发送：

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    另请检查：

    - 目标 Channel 支持出站媒体且未被允许列表阻止。
    - 文件在 Provider 的大小限制内（图片会调整大小至最大 2048px）。
    - `tools.fs.workspaceOnly=true` 将本地路径发送限制在工作区、临时/媒体存储和沙箱验证的文件。
    - `tools.fs.workspaceOnly=false` 让 `MEDIA:` 发送 Agent 已经可以读取的主机本地文件，但仅限媒体和安全文档类型（图片、音频、视频、PDF 和 Office 文档）。纯文本和类似密钥的文件仍然被阻止。

    参见[图片](/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全和访问控制

<AccordionGroup>
  <Accordion title="向入站 DM 公开 OpenClaw 安全吗？">
    将入站 DM 视为不受信任的输入。默认值旨在降低风险：

    - DM 能力 Channel 上的默认行为是**配对**：
      - 未知发送者收到配对码；机器人不处理他们的消息。
      - 使用以下命令批准：`openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 待处理请求每个 Channel 上限为 **3 个**；如果代码未到达，检查 `openclaw pairing list --channel <channel> [--account <id>]`。
    - 公开 DM 需要显式选入（`dmPolicy: "open"` 和允许列表 `"*"`）。

    运行 `openclaw doctor` 以发现有风险的 DM 策略。

  </Accordion>

  <Accordion title="提示注入只是公共机器人需要关心的问题吗？">
    不。提示注入涉及**不受信任的内容**，而不仅仅是谁可以 DM 机器人。
    如果你的助手读取外部内容（Web 搜索/抓取、浏览器页面、电子邮件、文档、附件、粘贴的日志），该内容可能包含试图劫持模型的指令。即使**你是唯一的发送者**，这也可能发生。

    最大的风险是启用了工具时：模型可能被欺骗代表你泄露上下文或调用工具。通过以下方式减少爆炸半径：

    - 使用只读或工具禁用的"阅读器" Agent 总结不受信任的内容
    - 对于启用工具的 Agent 关闭 `web_search` / `web_fetch` / `browser`
    - 将解码后的文件/文档文本也视为不受信任：OpenResponses `input_file` 和媒体附件提取都将提取的文本包裹在明确的外部内容边界标记中，而不是传递原始文件文本
    - 沙箱和严格的工具允许列表

    详情：[安全性](/gateway/security)。

  </Accordion>

  <Accordion title="我的机器人是否应该有自己的电子邮件、GitHub 账户或电话号码？">
    是的，对于大多数设置。用单独的账户和电话号码隔离机器人可以减少出错时的爆炸半径。这也使轮换凭据或撤销访问权限更容易，而不影响你的个人账户。

    从小开始。只授予你实际需要的工具和账户的访问权限，必要时再扩展。

    文档：[安全性](/gateway/security)、[配对](/channels/pairing)。

  </Accordion>

  <Accordion title="我可以让它自主管理我的短信吗？安全吗？">
    我们**不**建议对你的个人消息完全自主。最安全的模式是：

    - 保持 DM 处于**配对模式**或严格的允许列表。
    - 如果你想让它代表你发消息，使用**单独的号码或账户**。
    - 让它起草，然后**发送前审批**。

    如果你想试验，在专用账户上进行并保持隔离。参见[安全性](/gateway/security)。

  </Accordion>

  <Accordion title="我可以使用更便宜的模型执行个人助手任务吗？">
    可以，**如果** Agent 仅用于聊天且输入是受信任的。较小等级的模型更容易受到指令劫持，因此对于启用工具的 Agent 或读取不受信任内容时避免使用。如果必须使用较小的模型，请锁定工具并在沙箱内运行。参见[安全性](/gateway/security)。
  </Accordion>

  <Accordion title="我在 Telegram 中运行了 /start 但没有收到配对码">
    配对码**仅在**未知发送者向机器人发消息且启用了 `dmPolicy: "pairing"` 时发送。`/start` 本身不会生成代码。

    检查待处理请求：

    ```bash
    openclaw pairing list telegram
    ```

    如果你想要立即访问，将你的发送者 ID 加入允许列表或为该账户设置 `dmPolicy: "open"`。

  </Accordion>

  <Accordion title="WhatsApp：它会给我的联系人发消息吗？配对是如何工作的？">
    不会。默认 WhatsApp DM 策略是**配对**。未知发送者只收到配对码，他们的消息**不被处理**。OpenClaw 只回复它收到的聊天或你明确触发的发送。

    使用以下命令批准配对：

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    列出待处理请求：

    ```bash
    openclaw pairing list whatsapp
    ```

    向导电话号码提示：用于设置你的**允许列表/所有者**，使你自己的 DM 被允许。不用于自动发送。如果你在个人 WhatsApp 号码上运行，使用该号码并启用 `channels.whatsapp.selfChatMode`。

  </Accordion>
</AccordionGroup>

## 聊天命令、中止任务和"它不停止"

<AccordionGroup>
  <Accordion title="如何停止内部系统消息在聊天中显示？">
    大多数内部或工具消息只有在启用了该 Session 的**详细模式**、**追踪**或**推理**时才出现。

    在你看到它的聊天中修复：

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    如果仍然很嘈杂，检查 Control UI 中的 Session 设置，将详细模式设置为**继承**。还要确认你没有在配置中使用设置了 `verboseDefault` 为 `on` 的机器人配置文件。

    文档：[思考和详细模式](/tools/thinking)、[安全性](/gateway/security/index#reasoning-and-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="如何停止/取消正在运行的任务？">
    将以下任意内容作为**独立消息**发送（无斜杠）：

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    这些是中止触发器（不是 slash 命令）。

    对于后台进程（来自 exec 工具），你可以让 Agent 运行：

    ```
    process action:kill sessionId:XXX
    ```

    Slash 命令概述：参见 [Slash 命令](/tools/slash-commands)。

    大多数命令必须作为以 `/` 开头的**独立**消息发送，但少数快捷方式（如 `/status`）也适用于允许列表发送者的内联消息。

  </Accordion>

  <Accordion title='如何从 Telegram 发送 Discord 消息？（"Cross-context messaging denied"）'>
    OpenClaw 默认阻止**跨 Provider** 消息。如果工具调用绑定到 Telegram，它不会发送到 Discord，除非你明确允许。

    为 Agent 启用跨 Provider 消息：

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    编辑配置后重启 Gateway。

  </Accordion>

  <Accordion title='为什么感觉机器人"忽略"了快速连发的消息？'>
    队列模式控制新消息如何与正在飞行的运行交互。使用 `/queue` 更改模式：

    - `steer` - 将所有待处理的引导排队到当前运行中的下一个模型边界
    - `queue` - 旧版一次一条引导
    - `followup` - 逐条运行消息
    - `collect` - 批处理消息并回复一次
    - `steer-backlog` - 立即引导，然后处理积压
    - `interrupt` - 中止当前运行并重新开始

    默认模式是 `steer`。你可以为 followup 模式添加选项，如 `debounce:0.5s cap:25 drop:summarize`。参见[命令队列](/concepts/queue)和[引导队列](/concepts/queue-steering)。

  </Accordion>
</AccordionGroup>

## 杂项

<AccordionGroup>
  <Accordion title='使用 API 密钥的 Anthropic 默认模型是什么？'>
    在 OpenClaw 中，凭据和模型选择是分开的。设置 `ANTHROPIC_API_KEY`（或在认证配置文件中存储 Anthropic API 密钥）可以启用认证，但实际的默认模型是你在 `agents.defaults.model.primary` 中配置的内容（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。如果你看到 `No credentials found for profile "anthropic:default"`，这意味着 Gateway 在运行中的 Agent 的预期 `auth-profiles.json` 中找不到 Anthropic 凭据。
  </Accordion>
</AccordionGroup>

---

还有问题？在 [Discord](https://discord.com/invite/clawd) 中提问或在 [GitHub 讨论](https://github.com/openclaw/openclaw/discussions)中发帖。

## 相关

- [首次运行 FAQ](/help/faq-first-run) — 安装、入门、认证、订阅、早期故障
- [模型 FAQ](/help/faq-models) — 模型选择、故障转移、认证配置文件
- [故障排除](/help/troubleshooting) — 基于症状的分类
