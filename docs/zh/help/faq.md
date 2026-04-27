---
mmh3_hash: "d544155a62b7568b965b00d246622521"
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

   快速本地摘要：OS + 更新、gateway/服务可达性、agents/sessions、provider 配置 + 运行时问题（当 gateway 可达时）。

2. **可粘贴的报告（可安全分享）**

   ```bash
   openclaw status --all
   ```

   只读诊断，带日志尾部（令牌已编辑）。

3. **守护进程 + 端口状态**

   ```bash
   openclaw gateway status
   ```

   显示 supervisor 运行时与 RPC 可达性、探测目标 URL 以及服务可能使用的配置。

4. **深度探测**

   ```bash
   openclaw status --deep
   ```

   运行实时 gateway 健康探测，支持时包括 channel 探测（需要可达的 gateway）。参见[健康检查](/gateway/health)。

5. **跟踪最新日志**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 不可用，回退到：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   文件日志与服务日志分开；参见[日志记录](/logging)和[故障排除](/gateway/troubleshooting)。

6. **运行 doctor（修复）**

   ```bash
   openclaw doctor
   ```

   修复/迁移配置/状态 + 运行健康检查。参见[Doctor](/gateway/doctor)。

7. **Gateway 快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # 错误时显示目标 URL + 配置路径
   ```

   向运行中的 gateway 请求完整快照（仅 WS）。参见[健康检查](/gateway/health)。

## 快速入门和首次运行设置

首次运行问答——安装、入门、auth 路由、订阅、初始失败——在[首次运行 FAQ](/help/faq-first-run)上。

## OpenClaw 是什么？

<AccordionGroup>
  <Accordion title="用一段话描述 OpenClaw 是什么？">
    OpenClaw 是你在自己设备上运行的个人 AI 助手。它在你已经使用的消息界面上回复（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及 QQ Bot 等捆绑 channel 插件），并且可以在支持的平台上进行语音 + 实时 Canvas。**Gateway** 是始终在线的控制平面；助手是产品。
  </Accordion>

  <Accordion title="价值主张">
    OpenClaw 不是"只是 Claude 的包装器"。它是一个**本地优先的控制平面**，让你在**自己的硬件**上运行能干的助手，从你已经使用的聊天应用程序中访问，具有有状态的 sessions、记忆和工具——无需将工作流控制权交给托管 SaaS。

    亮点：

    - **你的设备，你的数据：** 在任何你想要的地方运行 Gateway（Mac、Linux、VPS），并将工作区 + session 历史保留在本地。
    - **真实 channels，不是网络沙盒：** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/等，以及在支持平台上的移动语音和 Canvas。
    - **模型无关：** 使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，每个 agent 的路由和故障转移。
    - **仅本地选项：** 运行本地模型，如果你想，**所有数据都可以保留在你的设备上**。
    - **多 agent 路由：** 每个 channel、账户或任务的独立 agent，每个都有自己的工作区和默认值。
    - **开源且可定制：** 无需供应商锁定即可检查、扩展和自托管。

    文档：[Gateway](/gateway)、[Channels](/channels)、[多 Agent](/concepts/multi-agent)、[记忆](/concepts/memory)。

  </Accordion>

  <Accordion title="我刚设置好——我应该先做什么？">
    不错的第一个项目：

    - 构建网站（WordPress、Shopify 或简单的静态站点）。
    - 原型移动应用（概要、屏幕、API 计划）。
    - 整理文件和文件夹（清理、命名、标记）。
    - 连接 Gmail 并自动生成摘要或跟进。

    它可以处理大型任务，但分阶段拆分并使用子 agents 并行工作效果最好。

  </Accordion>

  <Accordion title="OpenClaw 的五大日常用例是什么？">
    日常胜利通常看起来像：

    - **个人简报：** 收件箱、日历和你关心的新闻摘要。
    - **研究和起草：** 快速研究、摘要，以及电子邮件或文档的初稿。
    - **提醒和跟进：** 由 cron 或 heartbeat 驱动的提示和检查清单。
    - **浏览器自动化：** 填写表单、收集数据和重复网络任务。
    - **跨设备协调：** 从手机发送任务，让 Gateway 在服务器上运行它，然后在聊天中获取结果。

  </Accordion>

  <Accordion title="OpenClaw 能帮助 SaaS 的潜在客户开发、外展、广告和博客吗？">
    是的，用于**研究、资质审查和起草**。它可以扫描站点、建立候选名单、总结潜在客户，以及撰写外展或广告文案草稿。

    对于**外展或广告投放**，请保持人工参与。避免垃圾邮件，遵守当地法律和平台政策，并在发送之前审查所有内容。最安全的模式是让 OpenClaw 起草，你来批准。

    文档：[安全](/gateway/security)。

  </Accordion>

  <Accordion title="与 Claude Code 相比用于 Web 开发的优势是什么？">
    OpenClaw 是**个人助手**和协调层，不是 IDE 替代品。对于仓库内最快的直接编码循环，使用 Claude Code 或 Codex。当你想要持久记忆、跨设备访问和工具编排时使用 OpenClaw。

    优势：

    - 跨 sessions 的**持久记忆 + 工作区**
    - **多平台访问**（WhatsApp、Telegram、TUI、WebChat）
    - **工具编排**（浏览器、文件、调度、hooks）
    - **始终在线的 Gateway**（在 VPS 上运行，从任何地方交互）
    - 用于本地浏览器/屏幕/摄像头/exec 的 **Nodes**

    展示：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 和自动化

<AccordionGroup>
  <Accordion title="如何在不让仓库变脏的情况下自定义 skills？">
    使用托管覆盖而不是编辑仓库副本。将更改放在 `~/.openclaw/skills/<name>/SKILL.md` 中（或通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加文件夹）。优先级是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 捆绑 → `skills.load.extraDirs`，因此托管覆盖仍然比捆绑的 skills 优先，而无需触碰 git。如果你需要全局安装 skill 但只让某些 agents 可见，请将共享副本保留在 `~/.openclaw/skills` 中，并使用 `agents.defaults.skills` 和 `agents.list[].skills` 控制可见性。只有上游值得的编辑才应该存在于仓库中并作为 PR 提交。
  </Accordion>

  <Accordion title="我可以从自定义文件夹加载 skills 吗？">
    可以。通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加额外目录（最低优先级）。默认优先级是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 捆绑 → `skills.load.extraDirs`。`clawhub` 默认安装到 `./skills`，OpenClaw 在下一个 session 中将其视为 `<workspace>/skills`。如果 skill 只应对某些 agents 可见，请结合 `agents.defaults.skills` 或 `agents.list[].skills` 使用。
  </Accordion>

  <Accordion title="如何为不同任务使用不同模型？">
    目前支持的模式有：

    - **Cron jobs**：隔离的作业可以每个作业设置一个 `model` 覆盖。
    - **子 agents**：将任务路由到具有不同默认模型的独立 agents。
    - **按需切换**：使用 `/model` 随时切换当前 session 模型。

    参见[Cron jobs](/automation/cron-jobs)、[多 Agent 路由](/concepts/multi-agent)和[斜杠命令](/tools/slash-commands)。

  </Accordion>

  <Accordion title="Bot 在做繁重工作时冻结。如何卸载？">
    对长时或并行任务使用**子 agents**。子 agents 在自己的 session 中运行，返回摘要，并保持主聊天响应。

    让你的 bot 说"为此任务生成一个子 agent"或使用 `/subagents`。在聊天中使用 `/status` 查看 Gateway 当前正在做什么（以及它是否繁忙）。

    令牌提示：长任务和子 agents 都消耗令牌。如果成本是个问题，通过 `agents.defaults.subagents.model` 为子 agents 设置更便宜的模型。

    文档：[子 agents](/tools/subagents)、[后台任务](/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上线程绑定的子 agent sessions 如何工作？">
    使用线程绑定。你可以将 Discord 线程绑定到子 agent 或 session 目标，这样该线程中的后续消息就会保留在该绑定 session 上。

    基本流程：

    - 使用 `sessions_spawn` 加 `thread: true`（以及可选的 `mode: "session"` 用于持久跟进）生成。
    - 或手动使用 `/focus <target>` 绑定。
    - 使用 `/agents` 检查绑定状态。
    - 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自动取消聚焦。
    - 使用 `/unfocus` 分离线程。

    必需配置：

    - 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 覆盖：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 生成时自动绑定：设置 `channels.discord.threadBindings.spawnSubagentSessions: true`。

    文档：[子 agents](/tools/subagents)、[Discord](/channels/discord)、[配置参考](/gateway/configuration-reference)、[斜杠命令](/tools/slash-commands)。

  </Accordion>

  <Accordion title="子 agent 完成了，但完成更新去了错误的地方或从未发布。我应该检查什么？">
    首先检查已解析的请求者路由：

    - 完成模式的子 agent 投递在存在时优先使用任何绑定的线程或对话路由。
    - 如果完成来源只携带 channel，OpenClaw 会回退到请求者 session 存储的路由（`lastChannel` / `lastTo` / `lastAccountId`），以便直接投递仍然可以成功。
    - 如果既没有绑定路由也没有可用的存储路由，直接投递可能失败，结果会回退到排队的 session 投递而不是立即发布到聊天。
    - 无效或过时的目标仍然可以强制队列回退或最终投递失败。
    - 如果子项最后可见的助手回复是完全静默令牌 `NO_REPLY` / `no_reply`，或完全是 `ANNOUNCE_SKIP`，OpenClaw 故意抑制通告而不是发布过时的早期进度。
    - 如果子项在只有工具调用后超时，通告可能会将其折叠为简短的部分进度摘要，而不是重播原始工具输出。

    调试：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[子 agents](/tools/subagents)、[后台任务](/automation/tasks)、[Session 工具](/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或提醒不触发。我应该检查什么？">
    Cron 在 Gateway 进程内运行。如果 Gateway 不持续运行，定时作业将不运行。

    检查清单：

    - 确认 cron 已启用（`cron.enabled`）且 `OPENCLAW_SKIP_CRON` 未设置。
    - 检查 Gateway 是否 24/7 运行（无睡眠/重启）。
    - 验证作业的时区设置（`--tz` 与主机时区）。

    调试：

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文档：[Cron jobs](/automation/cron-jobs)、[自动化和任务](/automation)。

  </Accordion>

  <Accordion title="Cron 触发了，但没有发送到 channel。为什么？">
    首先检查投递模式：

    - `--no-deliver` / `delivery.mode: "none"` 意味着不期望运行器回退发送。
    - 缺失或无效的通告目标（`channel` / `to`）意味着运行器跳过了出站投递。
    - Channel auth 失败（`unauthorized`、`Forbidden`）意味着运行器尝试投递但凭据阻止了它。
    - 静默的隔离结果（仅 `NO_REPLY` / `no_reply`）被视为故意不可投递，因此运行器也抑制排队的回退投递。

    对于隔离的 cron jobs，当聊天路由可用时，agent 仍然可以直接使用 `message` 工具发送。`--announce` 仅控制 agent 尚未发送的最终文本的运行器回退路径。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron jobs](/automation/cron-jobs)、[后台任务](/automation/tasks)。

  </Accordion>

  <Accordion title="为什么隔离的 cron 运行切换了模型或重试了一次？">
    这通常是实时模型切换路径，而不是重复调度。

    隔离的 cron 可以在活跃运行抛出 `LiveSessionModelSwitchError` 时持久化运行时模型切换并重试。重试保留了切换的 provider/model，如果切换携带了新的 auth profile 覆盖，cron 在重试之前也会持久化它。

    相关选择规则：

    - Gmail hook 模型覆盖在适用时首先获胜。
    - 然后是每个作业的 `model`。
    - 然后是任何存储的 cron-session 模型覆盖。
    - 然后是正常的 agent/默认模型选择。

    重试循环是有界的。在初始尝试加上 2 次切换重试后，cron 会中止而不是无限循环。

    调试：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文档：[Cron jobs](/automation/cron-jobs)、[cron CLI](/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 skills？">
    使用原生 `openclaw skills` 命令或将 skills 放入你的工作区。macOS Skills UI 在 Linux 上不可用。在 [https://clawhub.ai](https://clawhub.ai) 浏览 skills。

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

    原生 `openclaw skills install` 写入活跃工作区 `skills/` 目录。仅在你想要发布或同步自己的 skills 时安装单独的 `clawhub` CLI。对于跨 agents 的共享安装，将 skill 放在 `~/.openclaw/skills` 下，如果你想缩小哪些 agents 可以看到它，使用 `agents.defaults.skills` 或 `agents.list[].skills`。

  </Accordion>

  <Accordion title="OpenClaw 可以按计划或在后台持续运行任务吗？">
    可以。使用 Gateway 调度器：

    - **Cron jobs** 用于定时或定期任务（在重启后持久化）。
    - **Heartbeat** 用于"主 session"定期检查。
    - **隔离作业** 用于发布摘要或投递到聊天的自主 agents。

    文档：[Cron jobs](/automation/cron-jobs)、[自动化和任务](/automation)、[Heartbeat](/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以在 Linux 上运行 Apple macOS 专有的 skills 吗？">
    不能直接运行。macOS skills 由 `metadata.openclaw.os` 加上所需二进制文件限定，skills 只有在 **Gateway 主机**上满足资格时才会出现在系统提示中。在 Linux 上，`darwin` 专有的 skills（如 `apple-notes`、`apple-reminders`、`things-mac`）不会加载，除非你覆盖限定。

    你有三种支持的模式：

    **选项 A - 在 Mac 上运行 Gateway（最简单）。**
    在 macOS 二进制文件存在的地方运行 Gateway，然后在[远程模式](#gateway-ports-already-running-and-remote-mode)或通过 Tailscale 从 Linux 连接。由于 Gateway 主机是 macOS，skills 正常加载。

    **选项 B - 使用 macOS 节点（无 SSH）。**
    在 Linux 上运行 Gateway，配对一个 macOS 节点（菜单栏应用），并在 Mac 上将**节点运行命令**设置为"始终询问"或"始终允许"。当所需二进制文件存在于节点上时，OpenClaw 可以将 macOS 专有 skills 视为有资格。agent 通过 `nodes` 工具运行这些 skills。如果你选择"始终询问"，在提示中批准"始终允许"会将该命令添加到允许列表。

    **选项 C - 通过 SSH 代理 macOS 二进制文件（高级）。**
    将 Gateway 保留在 Linux 上，但让所需的 CLI 二进制文件解析到在 Mac 上运行的 SSH 包装器。然后覆盖 skill 以允许 Linux，使其保持有资格。

    1. 为二进制文件创建 SSH 包装器（示例：Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 将包装器放在 Linux 主机的 `PATH` 上（例如 `~/bin/memo`）。
    3. 覆盖 skill 元数据（工作区或 `~/.openclaw/skills`）以允许 Linux：

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 开始新 session，以便 skills 快照刷新。

  </Accordion>

  <Accordion title="你们有 Notion 或 HeyGen 集成吗？">
    今天没有内置集成。

    选项：

    - **自定义 skill / 插件：** 最适合可靠的 API 访问（Notion/HeyGen 都有 API）。
    - **浏览器自动化：** 无需代码，但速度较慢且更脆弱。

    如果你想为每个客户保留上下文（代理工作流），一个简单的模式是：

    - 每个客户一个 Notion 页面（上下文 + 偏好 + 活跃工作）。
    - 让 agent 在 session 开始时获取该页面。

    如果你想要原生集成，请提交功能请求或构建一个针对这些 API 的 skill。

    安装 skills：

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生安装落在活跃工作区 `skills/` 目录中。对于跨 agents 的共享 skills，将它们放在 `~/.openclaw/skills/<name>/SKILL.md` 中。如果只有某些 agents 应该看到共享安装，配置 `agents.defaults.skills` 或 `agents.list[].skills`。参见[Skills](/tools/skills)、[Skills 配置](/tools/skills-config)和[ClawHub](/tools/clawhub)。

  </Accordion>

  <Accordion title="如何将我现有的已登录 Chrome 与 OpenClaw 一起使用？">
    使用内置的 `user` 浏览器 profile，它通过 Chrome DevTools MCP 附加：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    如果你想要自定义名称，创建显式的 MCP profile：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    此路径可以使用本地主机浏览器或已连接的浏览器节点。如果 Gateway 在其他地方运行，要么在浏览器机器上运行节点主机，要么改用远程 CDP。

    `existing-session` / `user` 的当前限制：

    - 操作由 ref 驱动，而不是 CSS 选择器驱动
    - 上传需要 `ref` / `inputRef`，目前一次支持一个文件
    - `responsebody`、PDF 导出、下载拦截和批量操作仍然需要托管浏览器或原始 CDP profile

  </Accordion>
</AccordionGroup>

## 沙盒和记忆

<AccordionGroup>
  <Accordion title="有专门的沙盒文档吗？">
    有。参见[沙盒](/gateway/sandboxing)。对于 Docker 特定设置（Docker 中的完整 gateway 或沙盒镜像），参见[Docker](/install/docker)。
  </Accordion>

  <Accordion title="Docker 感觉有限制——如何启用完整功能？">
    默认镜像以安全优先，以 `node` 用户运行，因此不包括系统包、Homebrew 或捆绑的浏览器。对于更完整的设置：

    - 使用 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，以便缓存在重启后存活。
    - 使用 `OPENCLAW_DOCKER_APT_PACKAGES` 将系统依赖项烘焙到镜像中。
    - 通过捆绑的 CLI 安装 Playwright 浏览器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 设置 `PLAYWRIGHT_BROWSERS_PATH` 并确保路径被持久化。

    文档：[Docker](/install/docker)、[浏览器](/tools/browser)。

  </Accordion>

  <Accordion title="我能让 DM 保持私密但使群组公开/沙盒化（使用一个 agent）吗？">
    可以——如果你的私密流量是 **DM**，公开流量是**群组**。

    使用 `agents.defaults.sandbox.mode: "non-main"` 使群组/channel sessions（非主键）在配置的沙盒后端中运行，而主 DM session 保持在主机上。如果你不选择，Docker 是默认后端。然后通过 `tools.sandbox.tools` 限制沙盒 sessions 中可用的工具。

    设置演练 + 示例配置：[群组：个人 DM + 公开群组](/channels/groups#pattern-personal-dms-public-groups-single-agent)

    关键配置参考：[Gateway 配置](/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="如何将主机文件夹绑定到沙盒中？">
    将 `agents.defaults.sandbox.docker.binds` 设置为 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全局 + 每个 agent 的绑定合并；当 `scope: "shared"` 时，每个 agent 的绑定被忽略。对敏感内容使用 `:ro`，记住绑定会绕过沙盒文件系统墙。

    OpenClaw 对允许的绑定源进行验证，既针对规范化路径，也针对通过最深现有祖先解析的规范路径。这意味着即使最后一个路径段尚不存在，符号链接父级逃逸在解析后仍然失败，并且允许的根检查在符号链接解析后仍然适用。

    参见[沙盒](/gateway/sandboxing#custom-bind-mounts)和[沙盒与工具策略与提升](/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)的示例和安全注意事项。

  </Accordion>

  <Accordion title="记忆是如何工作的？">
    OpenClaw 记忆只是 agent 工作区中的 Markdown 文件：

    - `memory/YYYY-MM-DD.md` 中的日记
    - `MEMORY.md` 中精心整理的长期笔记（仅主/私有 sessions）

    OpenClaw 还运行**静默的预压缩记忆刷新**，提醒模型在自动压缩之前写入持久笔记。这只有在工作区可写时才会运行（只读沙盒跳过它）。参见[记忆](/concepts/memory)。

  </Accordion>

  <Accordion title="记忆一直忘事。如何让它记住？">
    让 bot **将事实写入记忆**。长期笔记属于 `MEMORY.md`，短期上下文进入 `memory/YYYY-MM-DD.md`。

    这仍然是我们正在改进的领域。提醒模型存储记忆是有帮助的；它会知道该做什么。如果它一直忘记，请验证 Gateway 在每次运行时使用相同的工作区。

    文档：[记忆](/concepts/memory)、[Agent 工作区](/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="记忆会永远持续吗？有什么限制？">
    记忆文件存在于磁盘上，直到你删除它们。限制是你的存储，而不是模型。**session 上下文**仍然受模型上下文窗口限制，因此长对话可能会压缩或截断。这就是为什么存在记忆搜索——它只将相关部分拉回上下文。

    文档：[记忆](/concepts/memory)、[上下文](/concepts/context)。

  </Accordion>

  <Accordion title="语义记忆搜索需要 OpenAI API 密钥吗？">
    仅当你使用 **OpenAI embeddings** 时才需要。Codex OAuth 涵盖 chat/completions，但**不**授予 embeddings 访问权限，因此**使用 Codex 登录（OAuth 或 Codex CLI 登录）**对语义记忆搜索没有帮助。OpenAI embeddings 仍然需要真实的 API 密钥（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你没有显式设置 provider，OpenClaw 在可以解析 API 密钥时会自动选择 provider（auth profiles、`models.providers.*.apiKey` 或 env 变量）。如果 OpenAI 密钥解析，它优先 OpenAI；如果 Gemini 密钥解析，则优先 Gemini；然后是 Voyage；然后是 Mistral。如果没有远程密钥可用，记忆搜索保持禁用，直到你配置它。如果你配置了本地模型路径且存在，OpenClaw 优先 `local`。当你显式设置 `memorySearch.provider = "ollama"` 时，支持 Ollama。

    如果你宁愿保持本地，设置 `memorySearch.provider = "local"`（以及可选的 `memorySearch.fallback = "none"`）。如果你想要 Gemini embeddings，设置 `memorySearch.provider = "gemini"` 并提供 `GEMINI_API_KEY`（或 `memorySearch.remote.apiKey`）。我们支持 **OpenAI、Gemini、Voyage、Mistral、Ollama 或本地** embedding 模型——参见[记忆](/concepts/memory)了解设置详情。

  </Accordion>
</AccordionGroup>

## 数据存储位置

<AccordionGroup>
  <Accordion title="与 OpenClaw 一起使用的所有数据都保存在本地吗？">
    不——**OpenClaw 的状态是本地的**，但**外部服务仍然看到你发送给它们的内容**。

    - **默认本地：** sessions、记忆文件、配置和工作区存在于 Gateway 主机上（`~/.openclaw` + 你的工作区目录）。
    - **必要时远程：** 你发送给模型 providers（Anthropic/OpenAI/等）的消息会发送到他们的 API，聊天平台（WhatsApp/Telegram/Slack/等）在他们的服务器上存储消息数据。
    - **你控制占用空间：** 使用本地模型将提示保留在你的机器上，但 channel 流量仍然通过 channel 的服务器。

    相关：[Agent 工作区](/concepts/agent-workspace)、[记忆](/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 在哪里存储其数据？">
    所有内容都在 `$OPENCLAW_STATE_DIR` 下（默认：`~/.openclaw`）：

    | 路径                                                            | 目的                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 主配置（JSON5）                                                    |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 旧版 OAuth 导入（首次使用时复制到 auth profiles）                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles（OAuth、API 密钥和可选的 `keyRef`/`tokenRef`）       |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef providers 的可选文件支持的 secret 载荷            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 旧版兼容性文件（静态 `api_key` 条目已删除）                        |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider 状态（例如 `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 每个 agent 的状态（agentDir + sessions）                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 对话历史和状态（每个 agent）                                       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Session 元数据（每个 agent）                                       |

    旧版单 agent 路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）。

    你的**工作区**（AGENTS.md、记忆文件、skills 等）是独立的，通过 `agents.defaults.workspace` 配置（默认：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里？">
    这些文件存在于 **agent 工作区**中，而不是 `~/.openclaw`。

    - **工作区（每个 agent）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`memory/YYYY-MM-DD.md`、可选的 `HEARTBEAT.md`。小写根 `memory.md` 仅为旧版修复输入；当两个文件都存在时，`openclaw doctor --fix` 可以将其合并到 `MEMORY.md` 中。
    - **状态目录（`~/.openclaw`）**：配置、channel/provider 状态、auth profiles、sessions、日志和共享 skills（`~/.openclaw/skills`）。

    默认工作区是 `~/.openclaw/workspace`，可通过以下配置：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果 bot 在重启后"忘记"，确认 Gateway 在每次启动时使用相同的工作区（记住：远程模式使用 **gateway 主机**的工作区，不是你的本地笔记本电脑）。

    提示：如果你想要持久的行为或偏好，让 bot 将其**写入 AGENTS.md 或 MEMORY.md**，而不是依赖聊天历史。

    参见[Agent 工作区](/concepts/agent-workspace)和[记忆](/concepts/memory)。

  </Accordion>

  <Accordion title="推荐的备份策略">
    将你的 **agent 工作区**放在**私有** git 仓库中，并在私有地方备份（例如 GitHub 私有）。这捕获了记忆 + AGENTS/SOUL/USER 文件，让你之后可以恢复助手的"思维"。

    **不要**提交 `~/.openclaw` 下的任何内容（凭据、sessions、令牌或加密的 secrets 载荷）。如果你需要完整恢复，请分别备份工作区和状态目录（参见上面的迁移问题）。

    文档：[Agent 工作区](/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何完全卸载 OpenClaw？">
    参见专用指南：[卸载](/install/uninstall)。
  </Accordion>

  <Accordion title="Agents 可以在工作区外工作吗？">
    可以。工作区是**默认 cwd** 和记忆锚点，不是硬沙盒。相对路径在工作区内解析，但绝对路径可以访问其他主机位置，除非启用了沙盒。如果你需要隔离，使用 [`agents.defaults.sandbox`](/gateway/sandboxing) 或每个 agent 的沙盒设置。如果你想让仓库成为默认工作目录，将该 agent 的 `workspace` 指向仓库根目录。OpenClaw 仓库只是源代码；将工作区分开保存，除非你有意要让 agent 在其中工作。

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

  <Accordion title="远程模式：session 存储在哪里？">
    Session 状态由 **gateway 主机**拥有。如果你处于远程模式，你关心的 session 存储在远程机器上，而不是你的本地笔记本电脑。参见[Session 管理](/concepts/session)。
  </Accordion>
</AccordionGroup>

## 配置基础

<AccordionGroup>
  <Accordion title="配置是什么格式的？在哪里？">
    OpenClaw 从 `$OPENCLAW_CONFIG_PATH`（默认：`~/.openclaw/openclaw.json`）读取可选的 **JSON5** 配置：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果文件缺失，它使用相对安全的默认值（包括默认工作区 `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title='我设置了 gateway.bind: "lan"（或 "tailnet"），现在什么都不监听 / UI 显示未授权'>
    非 loopback 绑定**需要有效的 gateway auth 路径**。实际上，这意味着：

    - 共享密钥 auth：令牌或密码
    - `gateway.auth.mode: "trusted-proxy"` 在正确配置的非 loopback 身份感知反向代理后面

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

    - `gateway.remote.token` / `.password` 本身**不**启用本地 gateway auth。
    - 仅当 `gateway.auth.*` 未设置时，本地调用路径才能使用 `gateway.remote.*` 作为回退。
    - 对于密码 auth，设置 `gateway.auth.mode: "password"` 加上 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置且未解析，解析失败关闭（没有远程回退屏蔽）。
    - 共享密钥 Control UI 设置通过 `connect.params.auth.token` 或 `connect.params.auth.password`（存储在应用/UI 设置中）进行身份验证。Tailscale Serve 或 `trusted-proxy` 等具有身份的模式使用请求头。避免在 URL 中放置共享密钥。
    - 使用 `gateway.auth.mode: "trusted-proxy"` 时，同主机 loopback 反向代理**仍然不**满足 trusted-proxy auth。受信任的代理必须是配置的非 loopback 源。

  </Accordion>

  <Accordion title="为什么我现在在 localhost 上也需要令牌？">
    OpenClaw 默认强制执行 gateway auth，包括 loopback。在正常默认路径中，这意味着令牌 auth：如果没有配置显式的 auth 路径，gateway 启动会解析为令牌模式并自动生成一个，将其保存到 `gateway.auth.token`，因此**本地 WS 客户端必须进行身份验证**。这阻止了其他本地进程调用 Gateway。

    如果你更喜欢不同的 auth 路径，你可以显式选择密码模式（或对于非 loopback 身份感知反向代理，选择 `trusted-proxy`）。如果你**真的**想要开放的 loopback，在你的配置中显式设置 `gateway.auth.mode: "none"`。Doctor 可以随时为你生成令牌：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="更改配置后我必须重启吗？">
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

    - `off`：隐藏标语文本但保留横幅标题/版本行。
    - `default`：每次使用 `All your chats, one OpenClaw.`。
    - `random`：轮换有趣/季节性标语（默认行为）。
    - 如果你根本不想要横幅，设置 env `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何启用网络搜索（和网络获取）？">
    `web_fetch` 无需 API 密钥即可工作。`web_search` 取决于你选择的 provider：

    - 基于 API 的 providers（如 Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity 和 Tavily）需要其正常的 API 密钥设置。
    - Ollama Web Search 不需要密钥，但它使用你配置的 Ollama 主机，需要 `ollama signin`。
    - DuckDuckGo 不需要密钥，但它是非官方的基于 HTML 的集成。
    - SearXNG 不需要密钥/自托管；配置 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **推荐：** 运行 `openclaw configure --section web` 并选择 provider。
    环境变量替代：

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
              provider: "firecrawl", // 可选；省略以自动检测
            },
          },
        },
    }
    ```

    Provider 特定的 web-search 配置现在位于 `plugins.entries.<plugin>.config.webSearch.*` 下。旧版 `tools.web.search.*` provider 路径暂时仍加载以兼容，但不应用于新配置。Firecrawl web-fetch 回退配置位于 `plugins.entries.firecrawl.config.webFetch.*` 下。

    注意事项：

    - 如果你使用允许列表，添加 `web_search`/`web_fetch`/`x_search` 或 `group:web`。
    - `web_fetch` 默认启用（除非显式禁用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 从可用凭据中自动检测第一个就绪的获取回退 provider。今天捆绑的 provider 是 Firecrawl。
    - 守护进程从 `~/.openclaw/.env`（或服务环境）读取 env 变量。

    文档：[Web 工具](/tools/web)。

  </Accordion>

  <Accordion title="config.apply 清除了我的配置。如何恢复并避免这种情况？">
    `config.apply` 替换**整个配置**。如果你发送了部分对象，其他所有内容都会被删除。

    当前 OpenClaw 保护许多意外覆盖：

    - OpenClaw 拥有的配置写入在写入之前验证完整的变更后配置。
    - 无效或破坏性的 OpenClaw 拥有的写入被拒绝并保存为 `openclaw.json.rejected.*`。
    - 如果直接编辑破坏了启动或热重载，Gateway 恢复最后已知良好的配置并将被拒绝的文件保存为 `openclaw.json.clobbered.*`。
    - 主 agent 在恢复后收到启动警告，因此它不会盲目地再次写入坏配置。

    恢复：

    - 检查 `openclaw logs --follow` 中的 `Config auto-restored from last-known-good`、`Config write rejected:` 或 `config reload restored last-known-good config`。
    - 检查活跃配置旁边最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 如果有效，保留活跃的已恢复配置，然后仅使用 `openclaw config set` 或 `config.patch` 复制预期的键。
    - 运行 `openclaw config validate` 和 `openclaw doctor`。
    - 如果你没有最后已知良好或被拒绝的载荷，从备份恢复，或重新运行 `openclaw doctor` 并重新配置 channels/models。
    - 如果这是意外的，提交一个 bug 并包含你最后已知的配置或任何备份。
    - 本地编码 agent 通常可以从日志或历史中重建工作配置。

    避免：

    - 对小的更改使用 `openclaw config set`。
    - 对交互式编辑使用 `openclaw configure`。
    - 在不确定确切路径或字段形状时，先使用 `config.schema.lookup`；它返回浅层模式节点加上直接子节点摘要，用于向下钻取。
    - 对部分 RPC 编辑使用 `config.patch`；仅对完整配置替换使用 `config.apply`。
    - 如果你从 agent 运行中使用仅所有者的 `gateway` 工具，它仍然拒绝写入 `tools.exec.ask` / `tools.exec.security`（包括规范化为相同受保护 exec 路径的旧版 `tools.bash.*` 别名）。

    文档：[配置](/cli/config)、[配置向导](/cli/configure)、[Gateway 故障排除](/gateway/troubleshooting#gateway-restored-last-known-good-config)、[Doctor](/gateway/doctor)。

  </Accordion>

  <Accordion title="如何跨设备运行一个中央 Gateway 和专业工作器？">
    常见模式是**一个 Gateway**（例如 Raspberry Pi）加上 **nodes** 和 **agents**：

    - **Gateway（中央）：** 拥有 channels（Signal/WhatsApp）、路由和 sessions。
    - **Nodes（设备）：** Mac/iOS/Android 作为外设连接，并暴露本地工具（`system.run`、`canvas`、`camera`）。
    - **Agents（工作器）：** 特殊角色的独立大脑/工作区（例如"Hetzner ops"、"个人数据"）。
    - **子 agents：** 当你想要并行时，从主 agent 生成后台工作。
    - **TUI：** 连接到 Gateway 并切换 agents/sessions。

    文档：[Nodes](/nodes)、[远程访问](/gateway/remote)、[多 Agent 路由](/concepts/multi-agent)、[子 agents](/tools/subagents)、[TUI](/web/tui)。

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

    默认是 `false`（有头）。无头在某些站点上更可能触发反 bot 检查。参见[浏览器](/tools/browser)。

    无头使用**相同的 Chromium 引擎**，适用于大多数自动化（表单、点击、抓取、登录）。主要区别：

    - 没有可见的浏览器窗口（如果需要视觉效果，使用截图）。
    - 某些站点在无头模式下对自动化更严格（CAPTCHA、反 bot）。例如，X/Twitter 经常阻止无头 sessions。

  </Accordion>

  <Accordion title="如何使用 Brave 进行浏览器控制？">
    将 `browser.executablePath` 设置为你的 Brave 二进制文件（或任何基于 Chromium 的浏览器）并重启 Gateway。参见[浏览器](/tools/browser#use-brave-or-another-chromium-based-browser)中的完整配置示例。
  </Accordion>
</AccordionGroup>

## 远程 Gateways 和 Nodes

<AccordionGroup>
  <Accordion title="命令如何在 Telegram、gateway 和 nodes 之间传播？">
    Telegram 消息由 **gateway** 处理。gateway 运行 agent，只有在需要 node 工具时才通过 **Gateway WebSocket** 调用 nodes：

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes 看不到入站 provider 流量；它们只接收 node RPC 调用。

  </Accordion>

  <Accordion title="如果 Gateway 远程托管，我的 agent 如何访问我的计算机？">
    简短回答：**将你的计算机配对为 node**。Gateway 在其他地方运行，但它可以通过 Gateway WebSocket 在你的本地机器上调用 `node.*` 工具（屏幕、摄像头、系统）。

    典型设置：

    1. 在始终在线的主机（VPS/家庭服务器）上运行 Gateway。
    2. 将 Gateway 主机和你的计算机放在同一 tailnet 上。
    3. 确保 Gateway WS 可达（tailnet 绑定或 SSH 隧道）。
    4. 在本地打开 macOS 应用并以**通过 SSH 远程**模式（或直接 tailnet）连接，以便它可以注册为 node。
    5. 在 Gateway 上批准 node：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要单独的 TCP 桥；nodes 通过 Gateway WebSocket 连接。

    安全提示：配对 macOS node 允许在该机器上执行 `system.run`。只配对你信任的设备，并查阅[安全](/gateway/security)。

    文档：[Nodes](/nodes)、[Gateway 协议](/gateway/protocol)、[macOS 远程模式](/platforms/mac/remote)、[安全](/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已连接但我没有回复。现在怎么办？">
    检查基础：

    - Gateway 正在运行：`openclaw gateway status`
    - Gateway 健康：`openclaw status`
    - Channel 健康：`openclaw channels status`

    然后验证 auth 和路由：

    - 如果你使用 Tailscale Serve，确保 `gateway.auth.allowTailscale` 设置正确。
    - 如果你通过 SSH 隧道连接，确认本地隧道已启动并指向正确的端口。
    - 确认你的允许列表（DM 或群组）包括你的账户。

    文档：[Tailscale](/gateway/tailscale)、[远程访问](/gateway/remote)、[Channels](/channels)。

  </Accordion>

  <Accordion title="两个 OpenClaw 实例可以相互通信吗（本地 + VPS）？">
    可以。没有内置的"bot 间"桥，但你可以用几种可靠的方式连接它们：

    **最简单：** 使用两个 bot 都可以访问的普通聊天 channel（Telegram/Slack/WhatsApp）。让 Bot A 向 Bot B 发送消息，然后让 Bot B 照常回复。

    **CLI 桥（通用）：** 运行一个脚本，用 `openclaw agent --message ... --deliver` 调用另一个 Gateway，将其目标指向另一个 bot 监听的聊天。如果一个 bot 在远程 VPS 上，通过 SSH/Tailscale 将你的 CLI 指向该远程 Gateway（参见[远程访问](/gateway/remote)）。

    示例模式（从可以访问目标 Gateway 的机器运行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：添加护栏，使两个 bot 不会无休止地循环（仅提及、channel 允许列表或"不回复 bot 消息"规则）。

    文档：[远程访问](/gateway/remote)、[Agent CLI](/cli/agent)、[Agent 发送](/tools/agent-send)。

  </Accordion>

  <Accordion title="多个 agents 需要独立的 VPS 吗？">
    不需要。一个 Gateway 可以托管多个 agents，每个都有自己的工作区、模型默认值和路由。这是正常设置，比每个 agent 运行一个 VPS 便宜且简单得多。

    只有在你需要强隔离（安全边界）或非常不同的不想共享的配置时，才使用独立的 VPS。否则，保持一个 Gateway，使用多个 agents 或子 agents。

  </Accordion>

  <Accordion title="在我的个人笔记本电脑上使用 node 而不是从 VPS SSH 有什么好处？">
    有——nodes 是从远程 Gateway 访问你的笔记本电脑的一流方式，它们解锁的不仅仅是 shell 访问。Gateway 在 macOS/Linux（Windows 通过 WSL2）上运行且轻量（小型 VPS 或 Raspberry Pi 级别的机器就够了；4 GB RAM 足够），因此常见设置是始终在线的主机加上你的笔记本作为 node。

    - **不需要入站 SSH。** Nodes 连接到 Gateway WebSocket 并使用设备配对。
    - **更安全的执行控制。** `system.run` 在那台笔记本上由 node 允许列表/批准控制。
    - **更多设备工具。** Nodes 除了 `system.run` 还暴露 `canvas`、`camera` 和 `screen`。
    - **本地浏览器自动化。** 将 Gateway 保留在 VPS 上，但通过笔记本上的 node 主机在本地运行 Chrome，或通过主机上的 Chrome MCP 连接到本地 Chrome。

    SSH 对临时 shell 访问很好，但对于持续的 agent 工作流和设备自动化，nodes 更简单。

    文档：[Nodes](/nodes)、[Nodes CLI](/cli/nodes)、[浏览器](/tools/browser)。

  </Accordion>

  <Accordion title="Nodes 运行 gateway 服务吗？">
    不运行。每个主机只应运行**一个 gateway**，除非你有意运行隔离的 profiles（参见[多个 gateways](/gateway/multiple-gateways)）。Nodes 是连接到 gateway 的外设（iOS/Android nodes，或 macOS 菜单栏应用中的"node 模式"）。对于无头 node 主机和 CLI 控制，参见[Node 主机 CLI](/cli/node)。

    `gateway`、`discovery` 和 `canvasHost` 更改需要完整重启。

  </Accordion>

  <Accordion title="有 API / RPC 方式应用配置吗？">
    有。

    - `config.schema.lookup`：在写入之前检查一个配置子树及其浅层模式节点、匹配的 UI 提示和直接子节点摘要
    - `config.get`：获取当前快照 + hash
    - `config.patch`：安全的部分更新（大多数 RPC 编辑的首选）；可能时热重载，需要时重启
    - `config.apply`：验证 + 替换完整配置；可能时热重载，需要时重启
    - 仅所有者的 `gateway` 运行时工具仍然拒绝重写 `tools.exec.ask` / `tools.exec.security`；旧版 `tools.bash.*` 别名规范化为相同的受保护 exec 路径

  </Accordion>

  <Accordion title="首次安装的最小合理配置">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    这设置了你的工作区并限制了谁可以触发 bot。

  </Accordion>

  <Accordion title="如何在 VPS 上设置 Tailscale 并从我的 Mac 连接？">
    最小步骤：

    1. **在 VPS 上安装 + 登录**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在你的 Mac 上安装 + 登录**
       - 使用 Tailscale 应用并登录到同一 tailnet。
    3. **启用 MagicDNS（推荐）**
       - 在 Tailscale 管理控制台中，启用 MagicDNS，使 VPS 有稳定的名称。
    4. **使用 tailnet 主机名**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你想要 Control UI 而不需要 SSH，在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    这使 gateway 绑定到 loopback 并通过 Tailscale 暴露 HTTPS。参见[Tailscale](/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何将 Mac node 连接到远程 Gateway（Tailscale Serve）？">
    Serve 暴露 **Gateway Control UI + WS**。Nodes 通过相同的 Gateway WS 端点连接。

    推荐设置：

    1. **确保 VPS + Mac 在同一 tailnet 上**。
    2. **在远程模式下使用 macOS 应用**（SSH 目标可以是 tailnet 主机名）。应用将隧道 Gateway 端口并作为 node 连接。
    3. **在 gateway 上批准 node**：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文档：[Gateway 协议](/gateway/protocol)、[发现](/gateway/discovery)、[macOS 远程模式](/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我应该在第二台笔记本电脑上安装，还是只添加一个 node？">
    如果你只需要第二台笔记本电脑上的**本地工具**（屏幕/摄像头/exec），将其添加为 **node**。这保持了单一 Gateway 并避免了重复的配置。本地 node 工具目前仅在 macOS 上可用，但我们计划扩展到其他操作系统。

    只有在你需要**强隔离**或两个完全独立的 bot 时，才安装第二个 Gateway。

    文档：[Nodes](/nodes)、[Nodes CLI](/cli/nodes)、[多个 gateways](/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 环境变量和 .env 加载

<AccordionGroup>
  <Accordion title="OpenClaw 如何加载环境变量？">
    OpenClaw 从父进程（shell、launchd/systemd、CI 等）读取 env 变量，并额外加载：

    - 当前工作目录中的 `.env`
    - 来自 `~/.openclaw/.env` 的全局回退 `.env`（又名 `$OPENCLAW_STATE_DIR/.env`）

    两个 `.env` 文件都不覆盖现有的 env 变量。

    你还可以在配置中定义内联 env 变量（仅在进程 env 中缺失时应用）：

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    参见[/environment](/help/environment)了解完整的优先级和来源。

  </Accordion>

  <Accordion title="我通过服务启动了 Gateway，我的 env 变量消失了。现在怎么办？">
    两个常见修复：

    1. 将缺失的密钥放在 `~/.openclaw/.env` 中，这样即使服务不继承你的 shell env，它们也会被获取。
    2. 启用 shell 导入（选择性方便）：

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

    这运行你的登录 shell 并只导入缺失的预期密钥（从不覆盖）。环境变量等效：`OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我设置了 COPILOT_GITHUB_TOKEN，但 models status 显示"Shell env: off"。为什么？'>
    `openclaw models status` 报告**shell env 导入**是否启用。"Shell env: off"**并不**意味着你的 env 变量缺失——它只是意味着 OpenClaw 不会自动加载你的登录 shell。

    如果 Gateway 作为服务运行（launchd/systemd），它不会继承你的 shell 环境。通过以下方法之一修复：

    1. 将令牌放在 `~/.openclaw/.env` 中：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或启用 shell 导入（`env.shellEnv.enabled: true`）。
    3. 或将其添加到你的配置 `env` 块中（仅在缺失时应用）。

    然后重启 gateway 并重新检查：

    ```bash
    openclaw models status
    ```

    Copilot 令牌从 `COPILOT_GITHUB_TOKEN`（也是 `GH_TOKEN` / `GITHUB_TOKEN`）读取。参见[/concepts/model-providers](/concepts/model-providers)和[/environment](/help/environment)。

  </Accordion>
</AccordionGroup>

## Sessions 和多个聊天

<AccordionGroup>
  <Accordion title="如何开始新对话？">
    发送 `/new` 或 `/reset` 作为独立消息。参见[Session 管理](/concepts/session)。
  </Accordion>

  <Accordion title="如果我从不发送 /new，sessions 会自动重置吗？">
    Sessions 可以在 `session.idleMinutes` 后过期，但**默认禁用**（默认 **0**）。将其设置为正值以启用空闲过期。启用后，空闲期后的**下一条**消息为该聊天键开始新的 session id。这不会删除记录——它只是开始新 session。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="有办法组建一个 OpenClaw 实例团队（一个 CEO 和多个 agents）吗？">
    有，通过**多 agent 路由**和**子 agents**。你可以创建一个协调 agent 和几个具有自己工作区和模型的工作器 agents。

    话虽如此，这最好被视为**有趣的实验**。它令牌消耗大，通常比使用一个 bot 加独立 sessions 效率更低。我们设想的典型模型是你与之交谈的一个 bot，带有用于并行工作的不同 sessions。那个 bot 还可以在需要时生成子 agents。

    文档：[多 agent 路由](/concepts/multi-agent)、[子 agents](/tools/subagents)、[Agents CLI](/cli/agents)。

  </Accordion>

  <Accordion title="为什么上下文在任务中途被截断？如何防止？">
    Session 上下文受模型窗口限制。长聊天、大型工具输出或许多文件可能触发压缩或截断。

    有帮助的方法：

    - 让 bot 总结当前状态并将其写入文件。
    - 在长任务前使用 `/compact`，切换主题时使用 `/new`。
    - 将重要上下文保留在工作区中，让 bot 重新读取它。
    - 使用子 agents 进行长时或并行工作，使主聊天保持较小。
    - 如果经常发生，选择上下文窗口更大的模型。

  </Accordion>

  <Accordion title="如何完全重置 OpenClaw 但保持安装？">
    使用重置命令：

    ```bash
    openclaw reset
    ```

    非交互式完整重置：

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    然后重新运行设置：

    ```bash
    openclaw onboard --install-daemon
    ```

    注意事项：

    - 入门向导在看到现有配置时也提供**重置**。参见[入门向导（CLI）](/start/wizard)。
    - 如果你使用了 profiles（`--profile` / `OPENCLAW_PROFILE`），重置每个状态目录（默认是 `~/.openclaw-<profile>`）。
    - 开发重置：`openclaw gateway --dev --reset`（仅开发；清除开发配置 + 凭据 + sessions + 工作区）。

  </Accordion>

  <Accordion title='我收到"context too large"错误——如何重置或压缩？'>
    使用以下之一：

    - **压缩**（保留对话但总结较旧的轮次）：

      ```
      /compact
      ```

      或 `/compact <instructions>` 来指导摘要。

    - **重置**（相同聊天键的新 session ID）：

      ```
      /new
      /reset
      ```

    如果持续发生：

    - 启用或调整**session 修剪**（`agents.defaults.contextPruning`）以修剪旧的工具输出。
    - 使用上下文窗口更大的模型。

    文档：[压缩](/concepts/compaction)、[Session 修剪](/concepts/session-pruning)、[Session 管理](/concepts/session)。

  </Accordion>

  <Accordion title='为什么我看到"LLM request rejected: messages.content.tool_use.input field required"？'>
    这是一个 provider 验证错误：模型发出了没有必需 `input` 的 `tool_use` 块。这通常意味着 session 历史是过期的或损坏的（通常在长线程或工具/模式更改后）。

    修复：以 `/new`（独立消息）开始新 session。

  </Accordion>

  <Accordion title="为什么我每 30 分钟收到 heartbeat 消息？">
    Heartbeats 默认每 **30 分钟**运行一次（使用 OAuth auth 时每 **1 小时**）。调整或禁用它们：

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // 或 "0m" 以禁用
          },
        },
      },
    }
    ```

    如果 `HEARTBEAT.md` 存在但实际上为空（只有空行和 markdown 标题如 `# Heading`），OpenClaw 跳过 heartbeat 运行以节省 API 调用。如果文件缺失，heartbeat 仍然运行，模型决定做什么。

    每个 agent 的覆盖使用 `agents.list[].heartbeat`。文档：[Heartbeat](/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要向 WhatsApp 群组添加"bot 账户"吗？'>
    不需要。OpenClaw 在**你自己的账户**上运行，因此如果你在群组中，OpenClaw 可以看到它。默认情况下，群组回复被阻止，直到你允许发件人（`groupPolicy: "allowlist"`）。

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

    查找以 `@g.us` 结尾的 `chatId`（或 `from`），如：`1234567890-1234567890@g.us`。

    选项 2（如果已配置/允许列表）：从配置列出群组：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文档：[WhatsApp](/channels/whatsapp)、[目录](/cli/directory)、[日志](/cli/logs)。

  </Accordion>

  <Accordion title="为什么 OpenClaw 不在群组中回复？">
    两个常见原因：

    - 提及门控已开启（默认）。你必须 @提及 bot（或匹配 `mentionPatterns`）。
    - 你配置了 `channels.whatsapp.groups` 但没有 `"*"`，群组不在允许列表中。

    参见[群组](/channels/groups)和[群组消息](/channels/group-messages)。

  </Accordion>

  <Accordion title="群组/线程与 DM 共享上下文吗？">
    直接聊天默认折叠到主 session。群组/channels 有自己的 session 键，Telegram 主题 / Discord 线程是独立的 sessions。参见[群组](/channels/groups)和[群组消息](/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以创建多少个工作区和 agents？">
    没有硬性限制。几十个（甚至几百个）都没问题，但注意：

    - **磁盘增长：** sessions + 记录存在于 `~/.openclaw/agents/<agentId>/sessions/` 下。
    - **令牌成本：** 更多 agents 意味着更多并发模型使用。
    - **运维开销：** 每个 agent 的 auth profiles、工作区和 channel 路由。

    提示：

    - 每个 agent 保持一个**活跃**工作区（`agents.defaults.workspace`）。
    - 如果磁盘增长，修剪旧 sessions（删除 JSONL 或存储条目）。
    - 使用 `openclaw doctor` 发现游离的工作区和 profile 不匹配。

  </Accordion>

  <Accordion title="我可以同时运行多个 bots 或聊天（Slack），应该如何设置？">
    可以。使用**多 Agent 路由**运行多个隔离的 agents，并按 channel/账户/对等方路由入站消息。Slack 作为 channel 受支持，可以绑定到特定 agents。

    浏览器访问很强大，但不是"做人类能做的任何事"——反 bot、CAPTCHA 和 MFA 仍然可以阻止自动化。对于最可靠的浏览器控制，在主机上使用本地 Chrome MCP，或在实际运行浏览器的机器上使用 CDP。

    最佳实践设置：

    - 始终在线的 Gateway 主机（VPS/Mac mini）。
    - 每个角色一个 agent（绑定）。
    - Slack channel(s) 绑定到这些 agents。
    - 需要时通过 Chrome MCP 或 node 使用本地浏览器。

    文档：[多 Agent 路由](/concepts/multi-agent)、[Slack](/channels/slack)、[浏览器](/tools/browser)、[Nodes](/nodes)。

  </Accordion>
</AccordionGroup>

## 模型、故障转移和 Auth Profiles

模型问答——默认值、选择、别名、切换、故障转移、auth profiles——在[模型 FAQ](/help/faq-models)上。

## Gateway：端口、"已在运行"和远程模式

<AccordionGroup>
  <Accordion title="Gateway 使用哪个端口？">
    `gateway.port` 控制 WebSocket + HTTP（Control UI、hooks 等）的单个多路复用端口。

    优先级：

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > 默认 18789
    ```

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示"Runtime: running"但"Connectivity probe: failed"？'>
    因为"running"是 **supervisor** 的视图（launchd/systemd/schtasks）。连接探测是 CLI 实际连接到 gateway WebSocket。

    使用 `openclaw gateway status` 并信任这些行：

    - `Probe target:`（探测实际使用的 URL）
    - `Listening:`（实际绑定在端口上的内容）
    - `Last gateway error:`（进程存活但端口未监听时的常见根本原因）

  </Accordion>

  <Accordion title='为什么 openclaw gateway status 显示"Config (cli)"和"Config (service)"不同？'>
    你在编辑一个配置文件，而服务运行另一个（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不匹配）。

    修复：

    ```bash
    openclaw gateway install --force
    ```

    从你希望服务使用的相同 `--profile` / 环境运行该命令。

  </Accordion>

  <Accordion title='"another gateway instance is already listening"是什么意思？'>
    OpenClaw 通过在启动时立即绑定 WebSocket 监听器（默认 `ws://127.0.0.1:18789`）来强制执行运行时锁。如果绑定因 `EADDRINUSE` 而失败，它抛出 `GatewayLockError`，表明另一个实例已经在监听。

    修复：停止另一个实例，释放端口，或使用 `openclaw gateway --port <port>` 运行。

  </Accordion>

  <Accordion title="如何在远程模式下运行 OpenClaw（客户端连接到其他地方的 Gateway）？">
    设置 `gateway.mode: "remote"` 并指向远程 WebSocket URL，可选地带有共享密钥远程凭据：

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

    - `openclaw gateway` 只有在 `gateway.mode` 是 `local` 时才启动（或你传递了覆盖标志）。
    - macOS 应用监视配置文件并在这些值更改时实时切换模式。
    - `gateway.remote.token` / `.password` 仅是客户端侧的远程凭据；它们本身不启用本地 gateway auth。

  </Accordion>

  <Accordion title='Control UI 显示"unauthorized"（或一直重连）。现在怎么办？'>
    你的 gateway auth 路径和 UI 的 auth 方法不匹配。

    事实（来自代码）：

    - Control UI 将令牌保留在当前浏览器标签 session 和选定 gateway URL 的 `sessionStorage` 中，因此同标签刷新在不恢复长期 localStorage 令牌持久性的情况下继续工作。
    - 在 `AUTH_TOKEN_MISMATCH` 时，当 gateway 返回重试提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）时，受信任的客户端可以尝试一次带缓存设备令牌的有界重试。
    - 该缓存令牌重试现在重用与设备令牌一起存储的缓存批准范围。显式 `deviceToken` / 显式 `scopes` 调用者仍然保留其请求的范围集而不是继承缓存范围。
    - 在该重试路径之外，连接 auth 优先级是显式共享令牌/密码优先，然后是显式 `deviceToken`，然后是存储的设备令牌，然后是引导令牌。
    - 引导令牌范围检查是角色前缀的。内置引导操作员允许列表只满足操作员请求；node 或其他非操作员角色仍然需要其自己角色前缀下的范围。

    修复：

    - 最快：`openclaw dashboard`（打印 + 复制 dashboard URL，尝试打开；如果无头显示 SSH 提示）。
    - 如果你还没有令牌：`openclaw doctor --generate-gateway-token`。
    - 如果远程，先隧道：`ssh -N -L 18789:127.0.0.1:18789 user@host` 然后打开 `http://127.0.0.1:18789/`。
    - 共享密钥模式：设置 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然后在 Control UI 设置中粘贴匹配的密钥。
    - Tailscale Serve 模式：确保 `gateway.auth.allowTailscale` 已启用，并且你打开的是 Serve URL，而不是绕过 Tailscale 身份头的原始 loopback/tailnet URL。
    - Trusted-proxy 模式：确保你是通过配置的非 loopback 身份感知代理来的，而不是同主机 loopback 代理或原始 gateway URL。
    - 如果在一次重试后仍然不匹配，轮换/重新批准配对的设备令牌：
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 如果该轮换调用说被拒绝，检查两点：
      - 配对设备 sessions 只能轮换**自己的**设备，除非它们还有 `operator.admin`
      - 显式 `--scope` 值不能超过调用者当前的操作员范围
    - 还卡住了？运行 `openclaw status --all` 并按照[故障排除](/gateway/troubleshooting)操作。参见[Dashboard](/web/dashboard)了解 auth 详情。

  </Accordion>

  <Accordion title="我设置了 gateway.bind tailnet 但它无法绑定且什么都不监听">
    `tailnet` 绑定从你的网络接口选取 Tailscale IP（100.64.0.0/10）。如果机器不在 Tailscale 上（或接口关闭），没有什么可以绑定的。

    修复：

    - 在该主机上启动 Tailscale（使其有 100.x 地址），或
    - 切换到 `gateway.bind: "loopback"` / `"lan"`。

    注意：`tailnet` 是显式的。`auto` 优先 loopback；当你想要仅 tailnet 绑定时使用 `gateway.bind: "tailnet"`。

  </Accordion>

  <Accordion title="我可以在同一主机上运行多个 Gateways 吗？">
    通常不——一个 Gateway 可以运行多个消息 channels 和 agents。仅在你需要冗余（例如：救援 bot）或强隔离时使用多个 Gateways。

    可以，但你必须隔离：

    - `OPENCLAW_CONFIG_PATH`（每个实例的配置）
    - `OPENCLAW_STATE_DIR`（每个实例的状态）
    - `agents.defaults.workspace`（工作区隔离）
    - `gateway.port`（唯一端口）

    快速设置（推荐）：

    - 每个实例使用 `openclaw --profile <name> ...`（自动创建 `~/.openclaw-<name>`）。
    - 在每个 profile 配置中设置唯一的 `gateway.port`（或传递 `--port` 用于手动运行）。
    - 安装每个 profile 的服务：`openclaw --profile <name> gateway install`。

    Profiles 还会加上服务名称后缀（`ai.openclaw.<profile>`；旧版 `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。完整指南：[多个 gateways](/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='"invalid handshake" / 代码 1008 是什么意思？'>
    Gateway 是 **WebSocket 服务器**，它期望第一条消息是 `connect` 帧。如果它收到其他任何内容，它以**代码 1008**（策略违反）关闭连接。

    常见原因：

    - 你在浏览器中打开了 **HTTP** URL（`http://...`）而不是 WS 客户端。
    - 你使用了错误的端口或路径。
    - 代理或隧道剥离了 auth 头或发送了非 Gateway 请求。

    快速修复：

    1. 使用 WS URL：`ws://<host>:18789`（或 HTTPS 时 `wss://...`）。
    2. 不要在普通浏览器标签中打开 WS 端口。
    3. 如果 auth 开启，在 `connect` 帧中包含令牌/密码。

    如果你使用 CLI 或 TUI，URL 应该看起来像：

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

    你可以通过 `logging.file` 设置稳定路径。文件日志级别由 `logging.level` 控制。控制台详细度由 `--verbose` 和 `logging.consoleLevel` 控制。

    最快的日志跟踪：

    ```bash
    openclaw logs --follow
    ```

    服务/supervisor 日志（当 gateway 通过 launchd/systemd 运行时）：

    - macOS：`$OPENCLAW_STATE_DIR/logs/gateway.log` 和 `gateway.err.log`（默认：`~/.openclaw/logs/...`；profiles 使用 `~/.openclaw-<profile>/logs/...`）
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    参见[故障排除](/gateway/troubleshooting)了解更多。

  </Accordion>

  <Accordion title="如何启动/停止/重启 Gateway 服务？">
    使用 gateway 助手：

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手动运行 gateway，`openclaw gateway --force` 可以回收端口。参见[Gateway](/gateway)。

  </Accordion>

  <Accordion title="我在 Windows 上关闭了终端——如何重启 OpenClaw？">
    有**两种 Windows 安装模式**：

    **1) WSL2（推荐）：** Gateway 在 Linux 内运行。

    打开 PowerShell，进入 WSL，然后重启：

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你从未安装过服务，在前台启动它：

    ```bash
    openclaw gateway run
    ```

    **2) 原生 Windows（不推荐）：** Gateway 直接在 Windows 中运行。

    打开 PowerShell 并运行：

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手动运行它（没有服务），使用：

    ```powershell
    openclaw gateway run
    ```

    文档：[Windows (WSL2)](/platforms/windows)、[Gateway 服务手册](/gateway)。

  </Accordion>

  <Accordion title="Gateway 正常但回复从未到达。我应该检查什么？">
    从快速健康扫描开始：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常见原因：

    - 模型 auth 未在 **gateway 主机**上加载（检查 `models status`）。
    - Channel 配对/允许列表阻止回复（检查 channel 配置 + 日志）。
    - WebChat/Dashboard 在没有正确令牌的情况下打开。

    如果你是远程的，确认隧道/Tailscale 连接已启动，并且 Gateway WebSocket 可达。

    文档：[Channels](/channels)、[故障排除](/gateway/troubleshooting)、[远程访问](/gateway/remote)。

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason"——现在怎么办？'>
    这通常意味着 UI 丢失了 WebSocket 连接。检查：

    1. Gateway 正在运行吗？`openclaw gateway status`
    2. Gateway 健康吗？`openclaw status`
    3. UI 有正确的令牌吗？`openclaw dashboard`
    4. 如果远程，隧道/Tailscale 链接是否启动？

    然后跟踪日志：

    ```bash
    openclaw logs --follow
    ```

    文档：[Dashboard](/web/dashboard)、[远程访问](/gateway/remote)、[故障排除](/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands 失败。我应该检查什么？">
    从日志和 channel 状态开始：

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    然后匹配错误：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 菜单条目太多。OpenClaw 已经修剪到 Telegram 限制并重试更少的命令，但仍然需要删除一些菜单条目。减少插件/skill/自定义命令，或如果不需要菜单则禁用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!` 或类似网络错误：如果你在 VPS 或代理后面，确认允许出站 HTTPS 并且 `api.telegram.org` 的 DNS 工作正常。

    如果 Gateway 是远程的，确保你在 Gateway 主机上查看日志。

    文档：[Telegram](/channels/telegram)、[Channel 故障排除](/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI 没有输出。我应该检查什么？">
    首先确认 Gateway 可达且 agent 可以运行：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    在 TUI 中，使用 `/status` 查看当前状态。如果你希望在聊天 channel 中回复，确保投递已启用（`/deliver on`）。

    文档：[TUI](/web/tui)、[斜杠命令](/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何完全停止然后启动 Gateway？">
    如果你安装了服务：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    这停止/启动**受监督的服务**（macOS 上的 launchd，Linux 上的 systemd）。当 Gateway 作为守护进程在后台运行时使用这个。

    如果你在前台运行，用 Ctrl-C 停止，然后：

    ```bash
    openclaw gateway run
    ```

    文档：[Gateway 服务手册](/gateway)。

  </Accordion>

  <Accordion title="ELI5：openclaw gateway restart 与 openclaw gateway 的区别">
    - `openclaw gateway restart`：重启**后台服务**（launchd/systemd）。
    - `openclaw gateway`：在此终端 session 中**在前台**运行 gateway。

    如果你安装了服务，使用 gateway 命令。当你想要一次性、前台运行时使用 `openclaw gateway`。

  </Accordion>

  <Accordion title="出问题时获取更多详情的最快方法">
    使用 `--verbose` 启动 Gateway 以获取更多控制台详情。然后检查日志文件中的 channel auth、模型路由和 RPC 错误。
  </Accordion>
</AccordionGroup>

## 媒体和附件

<AccordionGroup>
  <Accordion title="我的 skill 生成了图像/PDF，但没有发送任何内容">
    来自 agent 的出站附件必须包含 `MEDIA:<path-or-url>` 行（在其自己的行上）。参见[OpenClaw 助手设置](/start/openclaw)和[Agent 发送](/tools/agent-send)。

    CLI 发送：

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    还需检查：

    - 目标 channel 支持出站媒体且不受允许列表阻止。
    - 文件在 provider 的大小限制内（图像缩放到最大 2048px）。
    - `tools.fs.workspaceOnly=true` 将本地路径发送限制在工作区、临时/媒体存储和沙盒验证的文件。
    - `tools.fs.workspaceOnly=false` 让 `MEDIA:` 发送 agent 已经可以读取的主机本地文件，但仅限于媒体加安全文档类型（图像、音频、视频、PDF 和 Office 文档）。纯文本和类似 secret 的文件仍然被阻止。

    参见[图像](/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全和访问控制

<AccordionGroup>
  <Accordion title="将 OpenClaw 暴露给入站 DM 安全吗？">
    将入站 DM 视为不受信任的输入。默认值旨在降低风险：

    - 支持 DM 的 channels 上的默认行为是**配对**：
      - 未知发件人收到配对码；bot 不处理他们的消息。
      - 使用批准：`openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 待处理请求上限为每个 channel **3 个**；如果代码没有到达，检查 `openclaw pairing list --channel <channel> [--account <id>]`。
    - 公开开放 DM 需要显式选择（`dmPolicy: "open"` 和允许列表 `"*"`）。

    运行 `openclaw doctor` 以显示有风险的 DM 策略。

  </Accordion>

  <Accordion title="提示注入只是公共 bot 的问题吗？">
    不。提示注入是关于**不受信任的内容**，不仅仅是谁可以向 bot 发送 DM。如果你的助手读取外部内容（网络搜索/获取、浏览器页面、电子邮件、文档、附件、粘贴的日志），该内容可能包含试图劫持模型的指令。**即使你是唯一的发件人**，这也可能发生。

    最大风险是当工具启用时：模型可能被欺骗以泄露上下文或代表你调用工具。通过以下方式减小爆炸半径：

    - 使用只读或禁用工具的"读取器" agent 总结不受信任的内容
    - 对于启用工具的 agents 或读取不受信任内容时，关闭 `web_search` / `web_fetch` / `browser`
    - 将解码的文件/文档文本也视为不受信任：OpenResponses `input_file` 和媒体附件提取都将提取的文本包装在显式外部内容边界标记中，而不是传递原始文件文本
    - 沙盒和严格的工具允许列表

    详情：[安全](/gateway/security)。

  </Accordion>

  <Accordion title="我的 bot 应该有自己的电子邮件、GitHub 账户或电话号码吗？">
    是的，对于大多数设置。用独立账户和电话号码隔离 bot 可以在出问题时减小爆炸半径。这也使轮换凭据或撤销访问权限更容易，而不会影响你的个人账户。

    从小处开始。只授予对你实际需要的工具和账户的访问权限，如果需要可以稍后扩展。

    文档：[安全](/gateway/security)、[配对](/channels/pairing)。

  </Accordion>

  <Accordion title="我可以给它对我短信的自主权吗，这安全吗？">
    我们**不**建议对你的个人消息完全自主。最安全的模式是：

    - 将 DM 保持在**配对模式**或严格的允许列表中。
    - 如果你想让它代表你发送消息，使用**独立号码或账户**。
    - 让它起草，然后**在发送前批准**。

    如果你想实验，在专用账户上进行并保持隔离。参见[安全](/gateway/security)。

  </Accordion>

  <Accordion title="我可以为个人助手任务使用更便宜的模型吗？">
    可以，**如果** agent 只聊天且输入是受信任的。较小的模型更容易受到指令劫持，因此避免对启用工具的 agents 或读取不受信任内容时使用它们。如果必须使用较小的模型，锁定工具并在沙盒内运行。参见[安全](/gateway/security)。
  </Accordion>

  <Accordion title="我在 Telegram 中运行了 /start 但没有收到配对码">
    配对码**只有**在未知发件人向 bot 发送消息且 `dmPolicy: "pairing"` 启用时才会发送。`/start` 本身不会生成代码。

    检查待处理请求：

    ```bash
    openclaw pairing list telegram
    ```

    如果你想立即访问，将你的发件人 id 加入允许列表或将该账户的 `dmPolicy` 设置为 `"open"`。

  </Accordion>

  <Accordion title="WhatsApp：它会给我的联系人发消息吗？配对是如何工作的？">
    不会。默认 WhatsApp DM 策略是**配对**。未知发件人只获得配对码，他们的消息**不被处理**。OpenClaw 只回复它收到的聊天或你触发的显式发送。

    批准配对：

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    列出待处理请求：

    ```bash
    openclaw pairing list whatsapp
    ```

    向导电话号码提示：它用于设置你的**允许列表/所有者**，使你的 DM 被允许。它不用于自动发送。如果你在个人 WhatsApp 号码上运行，使用该号码并启用 `channels.whatsapp.selfChatMode`。

  </Accordion>
</AccordionGroup>

## 聊天命令、中止任务和"它不停止"

<AccordionGroup>
  <Accordion title="如何停止内部系统消息在聊天中显示？">
    大多数内部或工具消息只有在该 session 启用**详细**、**追踪**或**推理**时才会出现。

    在你看到它的聊天中修复：

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    如果仍然嘈杂，检查 Control UI 中的 session 设置并将详细设置为**继承**。还确认你没有使用在配置中将 `verboseDefault` 设置为 `on` 的 bot profile。

    文档：[思考和详细](/tools/thinking)、[安全](/gateway/security#reasoning-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="如何停止/取消正在运行的任务？">
    将以下任何一条**作为独立消息**发送（无斜杠）：

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

    这些是中止触发器（不是斜杠命令）。

    对于后台进程（来自 exec 工具），你可以让 agent 运行：

    ```
    process action:kill sessionId:XXX
    ```

    斜杠命令概述：参见[斜杠命令](/tools/slash-commands)。

    大多数命令必须作为以 `/` 开头的**独立**消息发送，但一些快捷方式（如 `/status`）对加入允许列表的发件人也可以内联工作。

  </Accordion>

  <Accordion title='如何从 Telegram 发送 Discord 消息？（"Cross-context messaging denied"）'>
    OpenClaw 默认阻止**跨 provider** 消息。如果工具调用绑定到 Telegram，它不会发送到 Discord，除非你显式允许它。

    为 agent 启用跨 provider 消息：

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

    编辑配置后重启 gateway。

  </Accordion>

  <Accordion title='为什么感觉 bot"忽略"快速连续的消息？'>
    队列模式控制新消息如何与正在进行的运行交互。使用 `/queue` 更改模式：

    - `steer` - 新消息重定向当前任务
    - `followup` - 一次运行一条消息
    - `collect` - 批量消息并一次回复（默认）
    - `steer-backlog` - 现在转向，然后处理积压
    - `interrupt` - 中止当前运行并重新开始

    你可以为 followup 模式添加 `debounce:2s cap:25 drop:summarize` 等选项。

  </Accordion>
</AccordionGroup>

## 杂项

<AccordionGroup>
  <Accordion title='使用 API 密钥时 Anthropic 的默认模型是什么？'>
    在 OpenClaw 中，凭据和模型选择是分开的。设置 `ANTHROPIC_API_KEY`（或在 auth profiles 中存储 Anthropic API 密钥）启用身份验证，但实际的默认模型是你在 `agents.defaults.model.primary` 中配置的任何内容（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。如果你看到 `No credentials found for profile "anthropic:default"`，这意味着 Gateway 在运行的 agent 的预期 `auth-profiles.json` 中找不到 Anthropic 凭据。
  </Accordion>
</AccordionGroup>

---

还卡住了？在 [Discord](https://discord.com/invite/clawd) 上提问或开一个 [GitHub discussion](https://github.com/openclaw/openclaw/discussions)。

## 相关

- [首次运行 FAQ](/help/faq-first-run) — 安装、入门、auth、订阅、早期故障
- [模型 FAQ](/help/faq-models) — 模型选择、故障转移、auth profiles
- [故障排除](/help/troubleshooting) — 症状优先分类
