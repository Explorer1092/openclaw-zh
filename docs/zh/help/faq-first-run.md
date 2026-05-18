---
mmh3_hash: "ee799dbd1ed04b033d415cd1ff893639"
summary: "常见问题：快速入门和首次运行设置——安装、引导、认证、订阅、初始故障"
read_when:
  - 新安装、引导卡住或首次运行错误
  - 选择认证和 Provider 订阅
  - 无法访问 docs.openclaw.ai、无法打开 dashboard、安装卡住
title: "常见问题：首次运行设置"
sidebarTitle: "首次运行常见问题"
---

快速入门和首次运行问答。日常操作、模型、认证、Session 和故障排除，请参阅主[常见问题](/help/faq)。

## 快速入门和首次运行设置

<AccordionGroup>
  <Accordion title="我卡住了，最快的解决方法是什么">
    使用能**看到你机器**的本地 AI agent。这比在 Discord 中求助有效得多，因为大多数"我卡住了"的情况都是**本地配置或环境问题**，远程帮助者无法检查。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    这些工具可以读取仓库、运行命令、检查日志，并帮助修复你机器级别的设置（PATH、服务、权限、认证文件）。通过可改造（git）安装方式将**完整的源代码检出**提供给它们：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这将**从 git 检出**安装 OpenClaw，因此 agent 可以读取代码 + 文档，并推理你正在运行的确切版本。你随时可以通过重新运行不带 `--install-method git` 的安装程序切换回稳定版本。

    提示：让 agent **规划并监督**修复过程（逐步），然后只执行必要的命令。这样可以保持更改小且更易于审计。

    如果你发现了真正的错误或修复方案，请提交 GitHub issue 或发送 PR：
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    从这些命令开始（寻求帮助时分享输出）：

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    它们的作用：

    - `openclaw status`：Gateway/agent 健康状态 + 基本配置的快速快照。
    - `openclaw models status`：检查 Provider 认证 + 模型可用性。
    - `openclaw doctor`：验证并修复常见的配置/状态问题。

    其他有用的 CLI 检查：`openclaw status --all`、`openclaw logs --follow`、`openclaw gateway status`、`openclaw health --verbose`。

    快速调试循环：[出现问题时的前 60 秒](/help/faq#first-60-seconds-if-something-is-broken)。
    安装文档：[安装](/install)、[安装程序标志](/install/installer)、[更新](/install/updating)。

  </Accordion>

  <Accordion title="心跳一直跳过。跳过原因是什么意思？">
    常见的心跳跳过原因：

    - `quiet-hours`：在配置的活跃时间窗口之外
    - `empty-heartbeat-file`：`HEARTBEAT.md` 存在但只包含空白/仅标题的脚手架
    - `no-tasks-due`：`HEARTBEAT.md` 任务模式处于活跃状态，但没有任务间隔到期
    - `alerts-disabled`：所有心跳可见性已禁用（`showOk`、`showAlerts` 和 `useIndicator` 全部关闭）

    在任务模式下，只有在真正的心跳运行完成后才会推进到期时间戳。跳过的运行不会将任务标记为已完成。

    文档：[心跳](/gateway/heartbeat)、[自动化](/automation)。

  </Accordion>

  <Accordion title="安装和设置 OpenClaw 的推荐方式">
    仓库推荐从源码运行并使用引导向导：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    向导还可以自动构建 UI 资产。引导后，通常在端口 **18789** 上运行 Gateway。

    从源码安装（贡献者/开发）：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    如果还没有全局安装，通过 `pnpm openclaw onboard` 运行。

  </Accordion>

  <Accordion title="引导后如何打开 dashboard？">
    向导在引导完成后立即用干净（非令牌化）的 dashboard URL 打开你的浏览器，并在摘要中打印链接。保持该标签页打开；如果没有启动，请在同一台机器上复制/粘贴打印的 URL。
  </Accordion>

  <Accordion title="如何在 localhost 和远程上对 dashboard 进行认证？">
    **Localhost（同一台机器）：**

    - 打开 `http://127.0.0.1:18789/`。
    - 如果询问共享密钥认证，请将配置的令牌或密码粘贴到 Control UI 设置中。
    - 令牌来源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - 密码来源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果尚未配置共享密钥，使用 `openclaw doctor --generate-gateway-token` 生成令牌。

    **非 localhost：**

    - **Tailscale Serve**（推荐）：保持绑定 loopback，运行 `openclaw gateway --tailscale serve`，打开 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 为 `true`，身份标头满足 Control UI/WebSocket 认证（不需要粘贴共享密钥，假设 Gateway 主机受信任）；HTTP API 仍然需要共享密钥认证，除非你故意使用 private-ingress `none` 或受信任代理 HTTP 认证。
    - **Tailnet 绑定**：运行 `openclaw gateway --bind tailnet --token "<token>"`（或配置密码认证），打开 `http://<tailscale-ip>:18789/`，然后在 dashboard 设置中粘贴匹配的共享密钥。
    - **身份感知反向代理**：将 Gateway 保持在受信任代理后面，配置 `gateway.auth.mode: "trusted-proxy"`，然后打开代理 URL。同一主机 loopback 代理需要明确的 `gateway.auth.trustedProxy.allowLoopback = true`。
    - **SSH 隧道**：`ssh -N -L 18789:127.0.0.1:18789 user@host` 然后打开 `http://127.0.0.1:18789/`。共享密钥认证仍然适用于隧道；如果提示，请粘贴配置的令牌或密码。

    参阅 [Dashboard](/web/dashboard) 和 [Web 界面](/web) 了解绑定模式和认证详情。

  </Accordion>

  <Accordion title="为什么聊天批准有两个 exec 批准配置？">
    它们控制不同的层：

    - `approvals.exec`：将批准提示转发到聊天目的地
    - `channels.<channel>.execApprovals`：使该 Channel 充当 exec 批准的原生批准客户端

    主机 exec 策略仍然是真正的批准门控。聊天配置只控制批准提示出现的位置以及人们如何回答。

    在大多数设置中，你**不需要**两者都有：

    - 如果聊天已经支持命令和回复，同一聊天的 `/approve` 通过共享路径工作。
    - 如果支持的原生 Channel 可以安全地推断批准者，当 `channels.<channel>.execApprovals.enabled` 未设置或为 `"auto"` 时，OpenClaw 现在自动启用 DM 优先的原生批准。
    - 当原生批准卡片/按钮可用时，该原生 UI 是主要路径；agent 只有在工具结果说聊天批准不可用或手动批准是唯一路径时才应包含手动 `/approve` 命令。
    - 只有当提示还需要转发到其他聊天或明确的操作室时，才使用 `approvals.exec`。
    - 只有当你明确希望批准提示发回到原始房间/话题时，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - Plugin 批准再次独立：它们默认使用同一聊天的 `/approve`，可选的 `approvals.plugin` 转发，只有一些原生 Channel 在顶部保留 plugin 批准原生处理。

    简短版本：转发用于路由，原生客户端配置用于更丰富的 Channel 特定 UX。
    参阅 [Exec 批准](/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什么运行时？">
    需要 Node **>= 22**。推荐 `pnpm`。**不推荐** Bun 用于 Gateway。
  </Accordion>

  <Accordion title="它能在 Raspberry Pi 上运行吗？">
    是的。Gateway 很轻量——文档列出 **512MB-1GB RAM**、**1 核**和约 **500MB** 磁盘空间对于个人使用已足够，并指出 **Raspberry Pi 4 可以运行它**。

    如果你想要额外的余量（日志、媒体、其他服务），**推荐 2GB**，但这不是硬性最低要求。

    提示：小型 Pi/VPS 可以托管 Gateway，你可以在笔记本电脑/手机上配对 **Node**，用于本地屏幕/摄像头/Canvas 或命令执行。参阅 [Node](/nodes)。

  </Accordion>

  <Accordion title="Raspberry Pi 安装有什么提示？">
    简短版本：可以运行，但要有心理准备遇到一些粗糙的边缘。

    - 使用 **64 位** OS 并保持 Node >= 22。
    - 优先使用**可改造（git）安装**，这样你可以看到日志并快速更新。
    - 不带 Channel/技能开始，然后逐个添加。
    - 如果遇到奇怪的二进制问题，通常是 **ARM 兼容性**问题。

    文档：[Linux](/platforms/linux)、[安装](/install)。

  </Accordion>

  <Accordion title="卡在"唤醒我的朋友"/引导不会孵化。现在怎么办？">
    该界面依赖于 Gateway 可达且已认证。TUI 也会在第一次孵化时自动发送"唤醒我的朋友！"。如果你看到那一行**没有回复**且令牌保持为 0，agent 从未运行。

    1. 重启 Gateway：

    ```bash
    openclaw gateway restart
    ```

    2. 检查状态 + 认证：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 如果仍然挂起，运行：

    ```bash
    openclaw doctor
    ```

    如果 Gateway 是远程的，请确保隧道/Tailscale 连接正常，并且 UI 指向正确的 Gateway。参阅[远程访问](/gateway/remote)。

  </Accordion>

  <Accordion title="我可以将设置迁移到新机器（Mac mini）而不重新进行引导吗？">
    是的。复制**状态目录**和**工作区**，然后运行一次 Doctor。这保持你的机器人"完全相同"（内存、Session 历史记录、认证和 Channel 状态），只要你复制**两个**位置：

    1. 在新机器上安装 OpenClaw。
    2. 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
    3. 复制你的工作区（默认：`~/.openclaw/workspace`）。
    4. 运行 `openclaw doctor` 并重启 Gateway 服务。

    这将保留配置、认证配置文件、WhatsApp 凭据、Session 和内存。如果你处于远程模式，请记住 Gateway 主机拥有 Session 存储和工作区。

    **重要：**如果你只将工作区提交/推送到 GitHub，你是在备份**内存 + 引导文件**，而**不是** Session 历史记录或认证。这些存储在 `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相关：[迁移](/install/migrating)、[磁盘上存放的位置](/help/faq#where-things-live-on-disk)、[Agent 工作区](/concepts/agent-workspace)、[Doctor](/gateway/doctor)、[远程模式](/gateway/remote)。

  </Accordion>

  <Accordion title="我在哪里可以看到最新版本的新功能？">
    查看 GitHub 更新日志：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新条目在顶部。如果顶部部分标记为 **Unreleased**，则下一个带日期的部分是最新发布的版本。条目按**亮点**、**更改**和**修复**分组（加上文档/其他部分，需要时）。

  </Accordion>

  <Accordion title="无法访问 docs.openclaw.ai（SSL 错误）">
    一些 Comcast/Xfinity 连接通过 Xfinity Advanced Security 错误地阻止了 `docs.openclaw.ai`。禁用它或将 `docs.openclaw.ai` 加入白名单，然后重试。
    请通过报告此处帮助我们解除封锁：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    如果你仍然无法访问该站点，文档已在 GitHub 上镜像：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="稳定版和测试版的区别">
    **稳定版**和**测试版**是 **npm dist-tag**，而不是独立的代码线：

    - `latest` = 稳定版
    - `beta` = 用于测试的早期构建

    通常，稳定版首先发布到 **beta**，然后明确的推广步骤将相同版本移动到 `latest`。维护者也可以在需要时直接发布到 `latest`。这就是为什么 beta 和稳定版在推广后可以指向**相同版本**。

    查看更改内容：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    关于安装一行命令和 beta 与 dev 的区别，请参见下面的折叠项。

  </Accordion>

  <Accordion title="如何安装测试版以及测试版和开发版有什么区别？">
    **Beta** 是 npm dist-tag `beta`（推广后可能与 `latest` 匹配）。
    **Dev** 是 `main` 的移动头（git）；发布时，它使用 npm dist-tag `dev`。

    一行命令（macOS/Linux）：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 安装程序（PowerShell）：
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    更多详情：[开发渠道](/install/development-channels) 和 [安装程序标志](/install/installer)。

  </Accordion>

  <Accordion title="如何尝试最新版本？">
    两个选项：

    1. **Dev 渠道（git 检出）：**

    ```bash
    openclaw update --channel dev
    ```

    这会切换到 `main` 分支并从源码更新。

    2. **可改造安装（来自安装程序站点）：**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    这给你一个可以编辑的本地仓库，然后通过 git 更新。

    如果你更喜欢手动干净克隆，使用：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文档：[更新](/cli/update)、[开发渠道](/install/development-channels)、[安装](/install)。

  </Accordion>

  <Accordion title="安装和引导通常需要多长时间？">
    粗略指南：

    - **安装：** 2-5 分钟
    - **引导：** 5-15 分钟，取决于你配置了多少 Channel/模型

    如果挂起，使用[安装程序卡住](#quick-start-and-first-run-setup)和[我卡住了](#quick-start-and-first-run-setup)中的快速调试循环。

  </Accordion>

  <Accordion title="安装程序卡住了？如何获得更多反馈？">
    使用**详细输出**重新运行安装程序：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    带详细输出的 beta 安装：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    对于可改造（git）安装：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）等效：

    ```powershell
    # install.ps1 尚无专用的 -Verbose 标志。
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    更多选项：[安装程序标志](/install/installer)。

  </Accordion>

  <Accordion title="Windows 安装提示找不到 git 或不识别 openclaw">
    两个常见的 Windows 问题：

    **1) npm 错误 spawn git / 找不到 git**

    - 安装 **Git for Windows** 并确保 `git` 在你的 PATH 中。
    - 关闭并重新打开 PowerShell，然后重新运行安装程序。

    **2) 安装后不识别 openclaw**

    - 你的 npm 全局 bin 文件夹不在 PATH 中。
    - 检查路径：

      ```powershell
      npm config get prefix
      ```

    - 将该目录添加到你的用户 PATH（Windows 上不需要 `\bin` 后缀；在大多数系统上是 `%AppData%\npm`）。
    - 更新 PATH 后关闭并重新打开 PowerShell。

    如果你想要最流畅的 Windows 设置，请使用 **WSL2** 而不是原生 Windows。
    文档：[Windows](/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 输出显示乱码中文文字——我该怎么办？">
    这通常是原生 Windows shell 上的控制台代码页不匹配问题。

    症状：

    - `system.run`/`exec` 输出将中文渲染为乱码
    - 同一命令在另一个终端配置文件中显示正常

    PowerShell 中的快速解决方法：

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    然后重启 Gateway 并重试命令：

    ```powershell
    openclaw gateway restart
    ```

    如果你仍然在最新的 OpenClaw 上复现此问题，请在以下位置跟踪/报告：

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="文档没有回答我的问题——如何获得更好的答案？">
    使用**可改造（git）安装**，这样你可以在本地获得完整的源代码和文档，然后从该文件夹询问你的机器人（或 Claude/Codex），这样它就可以读取仓库并精确回答。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更多详情：[安装](/install) 和 [安装程序标志](/install/installer)。

  </Accordion>

  <Accordion title="如何在 Linux 上安装 OpenClaw？">
    简短回答：按照 Linux 指南操作，然后运行引导。

    - Linux 快速路径 + 服务安装：[Linux](/platforms/linux)。
    - 完整演练：[入门](/start/getting-started)。
    - 安装程序 + 更新：[安装 & 更新](/install/updating)。

  </Accordion>

  <Accordion title="如何在 VPS 上安装 OpenClaw？">
    任何 Linux VPS 都可以使用。在服务器上安装，然后使用 SSH/Tailscale 访问 Gateway。

    指南：[exe.dev](/install/exe-dev)、[Hetzner](/install/hetzner)、[Fly.io](/install/fly)。
    远程访问：[Gateway 远程](/gateway/remote)。

  </Accordion>

  <Accordion title="云/VPS 安装指南在哪里？">
    我们保留了一个包含常见 Provider 的**托管中心**。选择一个并按照指南操作：

    - [VPS 托管](/vps)（所有 Provider 在一个地方）
    - [Fly.io](/install/fly)
    - [Hetzner](/install/hetzner)
    - [exe.dev](/install/exe-dev)

    云端工作原理：**Gateway 在服务器上运行**，你从笔记本电脑/手机通过 Control UI（或 Tailscale/SSH）访问它。你的状态 + 工作区存储在服务器上，因此将主机视为真实来源并备份它。

    你可以将 **Node**（Mac/iOS/Android/无头）配对到该云 Gateway，以访问本地屏幕/摄像头/Canvas 或在笔记本电脑上运行命令，同时将 Gateway 保留在云中。

    中心：[平台](/platforms)。远程访问：[Gateway 远程](/gateway/remote)。
    Node：[Node](/nodes)、[Node CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="我可以让 OpenClaw 自我更新吗？">
    简短回答：**可能，但不推荐**。更新流程可能会重启 Gateway（这会断开活跃 Session），可能需要干净的 git 检出，并且可能提示确认。更安全的做法：以操作员身份从 shell 运行更新。

    使用 CLI：

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    如果必须从 agent 自动化：

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    文档：[更新](/cli/update)、[更新](/install/updating)。

  </Accordion>

  <Accordion title="引导实际上做了什么？">
    `openclaw onboard` 是推荐的设置路径。在**本地模式**下，它引导你完成：

    - **模型/认证设置**（Provider OAuth、API 密钥、Anthropic setup-token，以及本地模型选项，如 LM Studio）
    - **工作区**位置 + 引导文件
    - **Gateway 设置**（绑定/端口/认证/tailscale）
    - **Channel**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage，以及捆绑的 Channel 插件，如 QQ Bot）
    - **守护进程安装**（macOS 上的 LaunchAgent；Linux/WSL2 上的 systemd 用户单元）
    - **健康检查**和**技能**选择

    如果你配置的模型未知或缺少认证，它还会发出警告。

  </Accordion>

  <Accordion title="我需要 Claude 或 OpenAI 订阅才能运行吗？">
    不需要。你可以使用 **API 密钥**（Anthropic/OpenAI/其他）或使用**纯本地模型**运行 OpenClaw，这样你的数据就保留在你的设备上。订阅（Claude Pro/Max 或 OpenAI Codex）是认证这些 Provider 的可选方式。

    对于 OpenClaw 中的 Anthropic，实际分为：

    - **Anthropic API 密钥**：正常的 Anthropic API 计费
    - **Claude CLI / Claude 订阅在 OpenClaw 中的认证**：Anthropic 工作人员告诉我们此用法再次被允许，OpenClaw 将 `claude -p` 用法视为已批准的集成，除非 Anthropic 发布新政策

    对于长期运行的 Gateway 主机，Anthropic API 密钥仍然是更可预测的设置。OpenAI Codex OAuth 明确支持外部工具（如 OpenClaw）。

    OpenClaw 还支持其他托管订阅式选项，包括 **Qwen Cloud 编码计划**、**MiniMax 编码计划**和 **Z.AI / GLM 编码计划**。

    文档：[Anthropic](/providers/anthropic)、[OpenAI](/providers/openai)、[Qwen Cloud](/providers/qwen)、[MiniMax](/providers/minimax)、[GLM 模型](/providers/glm)、[本地模型](/gateway/local-models)、[模型](/concepts/models)。

  </Accordion>

  <Accordion title="我可以不用 API 密钥使用 Claude Max 订阅吗？">
    是的。

    Anthropic 工作人员告诉我们 OpenClaw 风格的 Claude CLI 用法再次被允许，所以 OpenClaw 将 Claude 订阅认证和 `claude -p` 用法视为已批准的集成，除非 Anthropic 发布新政策。如果你想要最可预测的服务器端设置，请改用 Anthropic API 密钥。

  </Accordion>

  <Accordion title="你支持 Claude 订阅认证（Claude Pro 或 Max）吗？">
    是的。

    Anthropic 工作人员告诉我们此用法再次被允许，所以 OpenClaw 将 Claude CLI 重用和 `claude -p` 用法视为已批准的集成，除非 Anthropic 发布新政策。

    Anthropic setup-token 仍然可用作支持的 OpenClaw 令牌路径，但 OpenClaw 现在在可用时优先使用 Claude CLI 重用和 `claude -p`。对于生产或多用户工作负载，Anthropic API 密钥认证仍然是更安全、更可预测的选择。如果你想要 OpenClaw 中其他订阅式托管选项，请参阅 [OpenAI](/providers/openai)、[Qwen / 模型云](/providers/qwen)、[MiniMax](/providers/minimax) 和 [GLM 模型](/providers/glm)。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="为什么我看到来自 Anthropic 的 HTTP 429 rate_limit_error？">
    这意味着你当前窗口的 **Anthropic 配额/速率限制**已耗尽。如果你使用 **Claude CLI**，请等待窗口重置或升级计划。如果你使用 **Anthropic API 密钥**，请查看 Anthropic 控制台了解使用情况/计费并根据需要提高限制。

    如果消息具体是：`Extra usage is required for long context requests`，则请求正在尝试使用 Anthropic 的 1M 上下文 beta（`context1m: true`）。这仅在你的凭据有资格获得长上下文计费（API 密钥计费或启用了额外用量的 OpenClaw Claude 登录路径）时才有效。

    提示：设置**备用模型**，这样当 Provider 受到速率限制时 OpenClaw 可以继续回复。参阅 [模型](/cli/models)、[OAuth](/concepts/oauth) 和 [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="支持 AWS Bedrock 吗？">
    是的。OpenClaw 有一个捆绑的 **Amazon Bedrock（Converse）** Provider。有了 AWS 环境标记，OpenClaw 可以自动发现流式/文本 Bedrock 目录并将其合并为隐式的 `amazon-bedrock` Provider；否则你可以明确启用 `plugins.entries.amazon-bedrock.config.discovery.enabled` 或添加手动 Provider 条目。参阅 [Amazon Bedrock](/providers/bedrock) 和 [模型 Provider](/providers/models)。如果你更喜欢托管密钥流程，Bedrock 前面的 OpenAI 兼容代理仍然是一个有效的选项。
  </Accordion>

  <Accordion title="Codex 认证如何工作？">
    OpenClaw 通过 OAuth（ChatGPT 登录）支持 **OpenAI Code（Codex）**。使用 `openai/gpt-5.5` 进行常见设置：ChatGPT/Codex 订阅认证加上原生 Codex 应用服务器执行。`openai-codex/gpt-*` 模型引用是由 `openclaw doctor --fix` 修复的旧版配置。直接 OpenAI API 密钥访问仍然可用于非 agent OpenAI API 界面以及通过有序的 `openai-codex` API 密钥配置文件的 agent 模型。参阅 [模型 Provider](/concepts/model-providers) 和 [引导（CLI）](/start/wizard)。
  </Accordion>

  <Accordion title="为什么 OpenClaw 仍然提到 openai-codex？">
    `openai-codex` 是 ChatGPT/Codex OAuth 的 Provider 和认证配置文件 ID。较旧的配置也将其用作模型前缀：

    - `openai/gpt-5.5` = 具有原生 Codex 运行时的 ChatGPT/Codex 订阅认证，用于 agent 轮次
    - `openai-codex/gpt-5.5` = 由 `openclaw doctor --fix` 修复的旧版模型路由
    - `openai/gpt-5.5` 加上有序的 `openai-codex` API 密钥配置文件 = OpenAI agent 模型的 API 密钥认证
    - `openai-codex:...` = 认证配置文件 ID，不是模型引用

    如果你想要直接的 OpenAI 平台计费/限制路径，请设置 `OPENAI_API_KEY`。如果你想要 ChatGPT/Codex 订阅认证，请使用 `openclaw models auth login --provider openai-codex` 登录。将模型引用保持为 `openai/gpt-5.5`；`openai-codex/*` 模型引用是由 `openclaw doctor --fix` 重写的旧版配置。

  </Accordion>

  <Accordion title="为什么 Codex OAuth 限制可能与 ChatGPT 网页版不同？">
    Codex OAuth 使用 OpenAI 管理的、依赖于计划的配额窗口。实际上，这些限制可能与 ChatGPT 网站/应用体验不同，即使两者都绑定到同一个账户。

    OpenClaw 可以在 `openclaw models status` 中显示当前可见的 Provider 使用/配额窗口，但它不会将 ChatGPT 网页权益发明或规范化为直接 API 访问。如果你想要直接的 OpenAI 平台计费/限制路径，请使用带有 API 密钥的 `openai/*`。

  </Accordion>

  <Accordion title="你支持 OpenAI 订阅认证（Codex OAuth）吗？">
    是的。OpenClaw 完全支持 **OpenAI Code（Codex）订阅 OAuth**。OpenAI 明确允许在外部工具/工作流（如 OpenClaw）中使用订阅 OAuth。引导可以为你运行 OAuth 流程。

    参阅 [OAuth](/concepts/oauth)、[模型 Provider](/concepts/model-providers) 和 [引导（CLI）](/start/wizard)。

  </Accordion>

  <Accordion title="如何设置 Gemini CLI OAuth？">
    Gemini CLI 使用**插件认证流程**，而不是 `openclaw.json` 中的客户端 ID 或密钥。

    步骤：

    1. 在本地安装 Gemini CLI，使 `gemini` 在 `PATH` 上
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 启用插件：`openclaw plugins enable google`
    3. 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登录后的默认模型：`google-gemini-cli/gemini-3-flash-preview`
    5. 如果请求失败，请在 Gateway 主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`

    这在 Gateway 主机上的认证配置文件中存储 OAuth 令牌。详情：[模型 Provider](/concepts/model-providers)。

  </Accordion>

  <Accordion title="本地模型适合日常聊天吗？">
    通常不适合。OpenClaw 需要大上下文 + 强安全性；小型模型会截断并泄漏。如果必须使用，在本地运行你能运行的**最大**模型构建（LM Studio），并参阅 [/gateway/local-models](/gateway/local-models)。较小/量化的模型会增加提示注入风险——参阅[安全性](/gateway/security)。
  </Accordion>

  <Accordion title="如何将托管模型流量保持在特定区域？">
    选择固定区域的端点。OpenRouter 为 MiniMax、Kimi 和 GLM 公开了美国托管选项；选择美国托管变体以将数据保持在区域内。你仍然可以通过使用 `models.mode: "merge"` 将 Anthropic/OpenAI 与这些一起列出，这样在遵守你选择的区域 Provider 的同时，备用选项仍然可用。
  </Accordion>

  <Accordion title="我必须购买 Mac Mini 才能安装这个吗？">
    不需要。OpenClaw 在 macOS 或 Linux 上运行（Windows 通过 WSL2）。Mac mini 是可选的——一些人购买一个作为始终在线的主机，但小型 VPS、家庭服务器或 Raspberry Pi 级别的设备也可以。

    你只需要 Mac 来使用 **macOS 专用工具**。对于 iMessage，在任何签入 Messages 的 Mac 上使用 [iMessage](/channels/imessage) 和 `imsg`。如果 Gateway 在 Linux 或其他地方运行，请将 `channels.imessage.cliPath` 设置为在该 Mac 上运行 `imsg` 的 SSH 包装器。如果你想要其他 macOS 专用工具，请在 Mac 上运行 Gateway 或配对 macOS Node。

    文档：[iMessage](/channels/imessage)、[Node](/nodes)、[Mac 远程模式](/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage 支持需要 Mac mini 吗？">
    你需要**某个签入 Messages 的 macOS 设备**。它**不必**是 Mac mini——任何 Mac 都可以。**使用 [iMessage](/channels/imessage)** 和 `imsg`；Gateway 可以在该 Mac 上运行，或者可以在其他地方运行，带有 SSH 包装器 `cliPath`。

    常见设置：

    - 在 Linux/VPS 上运行 Gateway，并将 `channels.imessage.cliPath` 设置为在签入 Messages 的 Mac 上运行 `imsg` 的 SSH 包装器。
    - 如果你想要最简单的单机设置，在 Mac 上运行一切。

    文档：[iMessage](/channels/imessage)、[Node](/nodes)、[Mac 远程模式](/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我购买 Mac mini 来运行 OpenClaw，我可以将其连接到我的 MacBook Pro 吗？">
    是的。**Mac mini 可以运行 Gateway**，而你的 MacBook Pro 可以作为 **Node**（配套设备）连接。Node 不运行 Gateway——它们提供额外的功能，如该设备上的屏幕/摄像头/Canvas 和 `system.run`。

    常见模式：

    - Mac mini 上的 Gateway（始终在线）。
    - MacBook Pro 运行 macOS 应用或 Node 主机并配对到 Gateway。
    - 使用 `openclaw nodes status` / `openclaw nodes list` 查看它。

    文档：[Node](/nodes)、[Node CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="我可以使用 Bun 吗？">
    **不推荐** Bun。我们看到运行时错误，特别是 WhatsApp 和 Telegram。
    使用 **Node** 进行稳定的 Gateway。

    如果你仍然想尝试 Bun，请在没有 WhatsApp/Telegram 的非生产 Gateway 上进行。

  </Accordion>

  <Accordion title="Telegram：allowFrom 中填什么？">
    `channels.telegram.allowFrom` 是**人类发送者的 Telegram 用户 ID**（数字）。不是机器人用户名。

    设置只需要数字用户 ID。如果配置中已经有旧版的 `@username` 条目，`openclaw doctor --fix` 可以尝试解析它们。

    更安全（不需要第三方机器人）：

    - 向你的机器人发送 DM，然后运行 `openclaw logs --follow` 并读取 `from.id`。

    官方 Bot API：

    - 向你的机器人发送 DM，然后调用 `https://api.telegram.org/bot<bot_token>/getUpdates` 并读取 `message.from.id`。

    第三方（不太私密）：

    - 向 `@userinfobot` 或 `@getidsbot` 发送 DM。

    参阅 [/channels/telegram](/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多人可以用一个 WhatsApp 号码使用不同的 OpenClaw 实例吗？">
    是的，通过**多 Agent 路由**。将每个发送者的 WhatsApp **DM**（对等方 `kind: "direct"`，发送者 E.164 如 `+15551234567`）绑定到不同的 `agentId`，这样每个人都有自己的工作区和 Session 存储。回复仍然来自**同一个 WhatsApp 账户**，DM 访问控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）对每个 WhatsApp 账户是全局的。参阅 [多 Agent 路由](/concepts/multi-agent) 和 [WhatsApp](/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以运行"快速聊天" agent 和"Opus 编码" agent 吗？'>
    是的。使用多 Agent 路由：给每个 Agent 自己的默认模型，然后将入站路由（Provider 账户或特定对等方）绑定到每个 Agent。配置示例在 [多 Agent 路由](/concepts/multi-agent) 中。另请参阅 [模型](/concepts/models) 和 [配置](/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 在 Linux 上有效吗？">
    是的。Homebrew 支持 Linux（Linuxbrew）。快速设置：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    如果你通过 systemd 运行 OpenClaw，请确保服务 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前缀），这样 `brew` 安装的工具就可以在非登录 shell 中解析。
    最近的构建还会在 Linux systemd 服务上预先添加常见的用户 bin 目录（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），并在设置时遵守 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR`。

  </Accordion>

  <Accordion title="可改造 git 安装和 npm 安装的区别">
    - **可改造（git）安装：**完整的源代码检出，可编辑，最适合贡献者。你在本地运行构建，可以修补代码/文档。
    - **npm 安装：**全局 CLI 安装，没有仓库，最适合"直接运行"。更新来自 npm dist-tag。

    文档：[入门](/start/getting-started)、[更新](/install/updating)。

  </Accordion>

  <Accordion title="我可以稍后在 npm 和 git 安装之间切换吗？">
    是的。当 OpenClaw 已经安装时，使用 `openclaw update --channel ...`。这**不会删除你的数据**——它只更改 OpenClaw 代码安装。你的状态（`~/.openclaw`）和工作区（`~/.openclaw/workspace`）保持不变。

    从 npm 到 git：

    ```bash
    openclaw update --channel dev
    ```

    从 git 到 npm：

    ```bash
    openclaw update --channel stable
    ```

    添加 `--dry-run` 先预览计划的模式切换。更新程序运行 Doctor 后续步骤，刷新目标渠道的插件源，并重启 Gateway，除非你传递 `--no-restart`。

    安装程序也可以强制任一模式：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    备份提示：参阅[备份策略](/help/faq#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="我应该在笔记本电脑上还是 VPS 上运行 Gateway？">
    简短回答：**如果你想要 24/7 可靠性，使用 VPS**。如果你可以接受睡眠/重启，请在本地运行。

    **笔记本电脑（本地 Gateway）**

    - **优点：**无服务器成本，直接访问本地文件，实时浏览器窗口。
    - **缺点：**睡眠/网络断开 = 断线，OS 更新/重启中断，必须保持唤醒。

    **VPS / 云**

    - **优点：**始终在线，稳定网络，无笔记本电脑睡眠问题，更容易保持运行。
    - **缺点：**通常无头运行（使用截图），仅远程文件访问，必须通过 SSH 进行更新。

    **OpenClaw 特定说明：**WhatsApp/Telegram/Slack/Mattermost/Discord 都可以从 VPS 正常工作。唯一真正的权衡是**无头浏览器**与可见窗口。参阅[浏览器](/tools/browser)。

    **推荐默认：**如果你之前有 Gateway 断开连接，请使用 VPS。当你在 Mac 上积极使用并想要本地文件访问或带有可见浏览器的 UI 自动化时，本地是很好的。

  </Accordion>

  <Accordion title="在专用机器上运行 OpenClaw 有多重要？">
    不是必需的，但**推荐用于可靠性和隔离性**。

    - **专用主机（VPS/Mac mini/Pi）：**始终在线，更少的睡眠/重启中断，更清洁的权限，更容易保持运行。
    - **共享笔记本/桌面：**对于测试和积极使用完全没问题，但当机器睡眠或更新时会有暂停。

    如果你想兼顾两者，将 Gateway 保持在专用主机上，将笔记本电脑配对为 **Node** 以使用本地屏幕/摄像头/exec 工具。参阅 [Node](/nodes)。
    安全指南请阅读[安全性](/gateway/security)。

  </Accordion>

  <Accordion title="最低 VPS 要求和推荐的 OS 是什么？">
    OpenClaw 很轻量。对于基本 Gateway + 一个聊天 Channel：

    - **绝对最低：**1 vCPU、1GB RAM、约 500MB 磁盘。
    - **推荐：**1-2 vCPU、2GB RAM 或更多以获得余量（日志、媒体、多个 Channel）。Node 工具和浏览器自动化可能需要大量资源。

    OS：使用 **Ubuntu LTS**（或任何现代 Debian/Ubuntu）。Linux 安装路径在那里测试得最好。

    文档：[Linux](/platforms/linux)、[VPS 托管](/vps)。

  </Accordion>

  <Accordion title="我可以在 VM 中运行 OpenClaw 吗，要求是什么？">
    是的。将 VM 视为与 VPS 相同：它需要始终开启、可达，并且有足够的 RAM 用于 Gateway 和你启用的任何 Channel。

    基准指南：

    - **绝对最低：**1 vCPU、1GB RAM。
    - **推荐：**如果你运行多个 Channel、浏览器自动化或媒体工具，则 2GB RAM 或更多。
    - **OS：**Ubuntu LTS 或另一个现代 Debian/Ubuntu。

    如果你在 Windows 上，**WSL2 是最简单的 VM 风格设置**，具有最佳的工具兼容性。参阅 [Windows](/platforms/windows)、[VPS 托管](/vps)。
    如果你在 VM 中运行 macOS，请参阅 [macOS VM](/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 相关

- [FAQ](/help/faq) — 主要常见问题（模型、Session、Gateway、安全性等）
- [安装概览](/install)
- [入门](/start/getting-started)
- [故障排除](/help/troubleshooting)
