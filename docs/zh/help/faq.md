---
mmh3_hash: "e59cf18e00284f860ccd7a9dc16a5e81"
title: "常见问题解答"
sidebarTitle: "常见问题"
summary: "关于 OpenClaw 设置、配置和使用的常见问题解答"
read_when:
  - "回答常见的设置、安装、引导或运行时支持问题"
  - "在深入调试之前对用户报告的问题进行分类"
---

# 常见问题解答

关于实际使用场景（本地开发、VPS、多代理、OAuth/API 密钥、模型故障转移）的快速解答及深入故障排除。运行时诊断请参阅[故障排除](/gateway/troubleshooting)，完整配置参考请参阅[配置](/gateway/configuration)。

## 目录

- [快速开始和首次运行设置]
  - [我遇到问题了，最快的解决方法是什么?](#im-stuck-whats-the-fastest-way-to-get-unstuck)
  - [安装和设置 OpenClaw 的推荐方式是什么?](#whats-the-recommended-way-to-install-and-set-up-openclaw)
  - [引导完成后如何打开仪表板?](#how-do-i-open-the-dashboard-after-onboarding)
  - [如何在本地主机与远程验证仪表板令牌?](#how-do-i-authenticate-the-dashboard-token-on-localhost-vs-remote)
  - [需要什么运行时?](#what-runtime-do-i-need)
  - [可以在 Raspberry Pi 上运行吗?](#does-it-run-on-raspberry-pi)
  - [Raspberry Pi 安装有哪些技巧?](#any-tips-for-raspberry-pi-installs)
  - [卡在"唤醒我的朋友"/ 引导无法孵化。怎么办?](#it-is-stuck-on-wake-up-my-friend-onboarding-will-not-hatch-what-now)
  - [可以将设置迁移到新机器（Mac mini）而无需重新引导吗?](#can-i-migrate-my-setup-to-a-new-machine-mac-mini-without-redoing-onboarding)
  - [在哪里查看最新版本的新功能?](#where-do-i-see-what-is-new-in-the-latest-version)
  - [无法访问 docs.openclaw.ai（SSL 错误）。怎么办?](#i-cant-access-docsopenclawai-ssl-error-what-now)
  - [稳定版和测试版有什么区别?](#whats-the-difference-between-stable-and-beta)
  - [如何安装测试版，测试版和开发版有什么区别?](#how-do-i-install-the-beta-version-and-whats-the-difference-between-beta-and-dev)
  - [如何尝试最新版本?](#how-do-i-try-the-latest-bits)
  - [安装和引导通常需要多长时间?](#how-long-does-install-and-onboarding-usually-take)
  - [安装程序卡住了？如何获取更多反馈?](#installer-stuck-how-do-i-get-more-feedback)
  - [Windows 安装提示找不到 git 或无法识别 openclaw](#windows-install-says-git-not-found-or-openclaw-not-recognized)
  - [文档没有回答我的问题——如何获得更好的答案?](#the-docs-didnt-answer-my-question-how-do-i-get-a-better-answer)
  - [如何在 Linux 上安装 OpenClaw?](#how-do-i-install-openclaw-on-linux)
  - [如何在 VPS 上安装 OpenClaw?](#how-do-i-install-openclaw-on-a-vps)
  - [云/VPS 安装指南在哪里?](#where-are-the-cloudvps-install-guides)
  - [可以让 OpenClaw 自我更新吗?](#can-i-ask-openclaw-to-update-itself)
  - [引导向导实际上做了什么?](#what-does-the-onboarding-wizard-actually-do)
  - [运行 OpenClaw 需要 Claude 或 OpenAI 订阅吗?](#do-i-need-a-claude-or-openai-subscription-to-run-this)
  - [可以不用 API 密钥使用 Claude Max 订阅吗?](#can-i-use-claude-max-subscription-without-an-api-key)
  - [Anthropic "setup-token" 身份验证如何工作?](#how-does-anthropic-setuptoken-auth-work)
  - [在哪里找到 Anthropic setup-token?](#where-do-i-find-an-anthropic-setuptoken)
  - [支持 Claude 订阅身份验证（Claude Pro 或 Max）吗?](#do-you-support-claude-subscription-auth-claude-pro-or-max)
  - [为什么看到来自 Anthropic 的 `HTTP 429: rate_limit_error`?](#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)
  - [支持 AWS Bedrock 吗?](#is-aws-bedrock-supported)
  - [Codex 身份验证如何工作?](#how-does-codex-auth-work)
  - [支持 OpenAI 订阅身份验证（Codex OAuth）吗?](#do-you-support-openai-subscription-auth-codex-oauth)
  - [如何设置 Gemini CLI OAuth?](#how-do-i-set-up-gemini-cli-oauth)
  - [本地模型适合日常聊天吗?](#is-a-local-model-ok-for-casual-chats)
  - [如何让托管模型流量保留在特定区域?](#how-do-i-keep-hosted-model-traffic-in-a-specific-region)
  - [必须购买 Mac Mini 来安装吗?](#do-i-have-to-buy-a-mac-mini-to-install-this)
  - [支持 iMessage 需要 Mac mini 吗?](#do-i-need-a-mac-mini-for-imessage-support)
  - [购买 Mac mini 运行 OpenClaw 后，可以连接到 MacBook Pro 吗?](#if-i-buy-a-mac-mini-to-run-openclaw-can-i-connect-it-to-my-macbook-pro)
  - [可以使用 Bun 吗?](#can-i-use-bun)
  - [Telegram：`allowFrom` 里填什么?](#telegram-what-goes-in-allowfrom)
  - [多个人能用同一个 WhatsApp 号码配合不同的 OpenClaw 实例吗?](#can-multiple-people-use-one-whatsapp-number-with-different-openclaw-instances)
  - [可以同时运行"快速聊天"代理和"Opus 编码"代理吗?](#can-i-run-a-fast-chat-agent-and-an-opus-for-coding-agent)
  - [Homebrew 在 Linux 上可用吗?](#does-homebrew-work-on-linux)
  - [可破解（git）安装和 npm 安装有什么区别?](#whats-the-difference-between-the-hackable-git-install-and-npm-install)
  - [之后可以在 npm 和 git 安装之间切换吗?](#can-i-switch-between-npm-and-git-installs-later)
  - [应该在笔记本还是 VPS 上运行 Gateway?](#should-i-run-the-gateway-on-my-laptop-or-a-vps)
  - [在专用机器上运行 OpenClaw 有多重要?](#how-important-is-it-to-run-openclaw-on-a-dedicated-machine)
  - [最低 VPS 要求和推荐操作系统是什么?](#what-are-the-minimum-vps-requirements-and-recommended-os)
  - [可以在虚拟机中运行 OpenClaw，有哪些要求?](#can-i-run-openclaw-in-a-vm-and-what-are-the-requirements)
- [OpenClaw 是什么?](#what-is-openclaw)
  - [用一段话描述 OpenClaw 是什么?](#what-is-openclaw-in-one-paragraph)
  - [价值主张是什么?](#whats-the-value-proposition)
  - [刚设置好，应该先做什么?](#i-just-set-it-up-what-should-i-do-first)
  - [OpenClaw 最常见的五个日常用例是什么?](#what-are-the-top-five-everyday-use-cases-for-openclaw)
  - [OpenClaw 能帮助 SaaS 进行潜在客户开发、推广广告和博客吗?](#can-openclaw-help-with-lead-gen-outreach-ads-and-blogs-for-a-saas)
  - [与 Claude Code 相比用于 Web 开发有什么优势?](#what-are-the-advantages-vs-claude-code-for-web-development)
- [技能和自动化](#skills-and-automation)
  - [如何在不使仓库变脏的情况下自定义技能?](#how-do-i-customize-skills-without-keeping-the-repo-dirty)
  - [可以从自定义文件夹加载技能吗?](#can-i-load-skills-from-a-custom-folder)
  - [如何对不同任务使用不同模型?](#how-can-i-use-different-models-for-different-tasks)
  - [Bot 在繁重工作时卡住了。如何卸载?](#the-bot-freezes-while-doing-heavy-work-how-do-i-offload-that)
  - [Cron 或提醒不触发。应该检查什么?](#cron-or-reminders-do-not-fire-what-should-i-check)
  - [如何在 Linux 上安装技能?](#how-do-i-install-skills-on-linux)
  - [OpenClaw 可以按计划或在后台持续运行任务吗?](#can-openclaw-run-tasks-on-a-schedule-or-continuously-in-the-background)
  - [可以从 Linux 运行仅适用于 Apple macOS 的技能吗?](#can-i-run-apple-macos-only-skills-from-linux)
  - [你们有 Notion 或 HeyGen 集成吗?](#do-you-have-a-notion-or-heygen-integration)
  - [如何安装用于浏览器控制的 Chrome 扩展程序?](#how-do-i-install-the-chrome-extension-for-browser-takeover)
- [沙箱和内存](#sandboxing-and-memory)
  - [有专门的沙箱文档吗?](#is-there-a-dedicated-sandboxing-doc)
  - [如何将主机文件夹绑定到沙箱中?](#how-do-i-bind-a-host-folder-into-the-sandbox)
  - [内存如何工作?](#how-does-memory-work)
  - [内存一直忘事。如何让它记住?](#memory-keeps-forgetting-things-how-do-i-make-it-stick)
  - [内存会永久保存吗？有什么限制?](#does-memory-persist-forever-what-are-the-limits)
  - [语义内存搜索需要 OpenAI API 密钥吗?](#does-semantic-memory-search-require-an-openai-api-key)
- [数据存储位置](#where-things-live-on-disk)
  - [OpenClaw 使用的所有数据都保存在本地吗?](#is-all-data-used-with-openclaw-saved-locally)
  - [OpenClaw 将数据存储在哪里?](#where-does-openclaw-store-its-data)
  - [AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里?](#where-should-agentsmd-soulmd-usermd-memorymd-live)
  - [推荐的备份策略是什么?](#whats-the-recommended-backup-strategy)
  - [如何完全卸载 OpenClaw?](#how-do-i-completely-uninstall-openclaw)
  - [代理可以在工作区之外工作吗?](#can-agents-work-outside-the-workspace)
  - [我在远程模式下——会话存储在哪里?](#im-in-remote-mode-where-is-the-session-store)
- [配置基础](#config-basics)
  - [配置文件是什么格式的，在哪里?](#what-format-is-the-config-where-is-it)
  - [我设置了 `gateway.bind: "lan"`（或 `"tailnet"`），但现在什么都不监听/UI 显示未授权](#i-set-gatewaybind-lan-or-tailnet-and-now-nothing-listens-the-ui-says-unauthorized)
  - [为什么现在在 localhost 上需要令牌?](#why-do-i-need-a-token-on-localhost-now)
  - [更改配置后需要重启吗?](#do-i-have-to-restart-after-changing-config)
  - [如何启用网络搜索（和网络抓取）?](#how-do-i-enable-web-search-and-web-fetch)
  - [config.apply 清除了我的配置。如何恢复并避免这种情况?](#configapply-wiped-my-config-how-do-i-recover-and-avoid-this)
  - [如何在设备间运行带有专业工作节点的中央 Gateway?](#how-do-i-run-a-central-gateway-with-specialized-workers-across-devices)
  - [OpenClaw 浏览器可以无头运行吗?](#can-the-openclaw-browser-run-headless)
  - [如何使用 Brave 进行浏览器控制?](#how-do-i-use-brave-for-browser-control)
- [远程 Gateway 和节点](#remote-gateways-and-nodes)
  - [命令如何在 Telegram、Gateway 和节点之间传播?](#how-do-commands-propagate-between-telegram-the-gateway-and-nodes)
  - [如果 Gateway 托管在远程，我的代理如何访问我的计算机?](#how-can-my-agent-access-my-computer-if-the-gateway-is-hosted-remotely)
  - [Tailscale 已连接，但没有收到回复。怎么办?](#tailscale-is-connected-but-i-get-no-replies-what-now)
  - [两个 OpenClaw 实例可以互相通信吗（本地 + VPS）?](#can-two-openclaw-instances-talk-to-each-other-local-vps)
  - [多个代理需要单独的 VPS 吗?](#do-i-need-separate-vpses-for-multiple-agents)
  - [在个人笔记本上使用节点与从 VPS SSH 相比有什么好处?](#is-there-a-benefit-to-using-a-node-on-my-personal-laptop-instead-of-ssh-from-a-vps)
  - [节点运行 Gateway 服务吗?](#do-nodes-run-a-gateway-service)
  - [有 API/RPC 方式来应用配置吗?](#is-there-an-api-rpc-way-to-apply-config)
  - [首次安装的最小"合理"配置是什么?](#whats-a-minimal-sane-config-for-a-first-install)
  - [如何在 VPS 上设置 Tailscale 并从 Mac 连接?](#how-do-i-set-up-tailscale-on-a-vps-and-connect-from-my-mac)
  - [如何将 Mac 节点连接到远程 Gateway（Tailscale Serve）?](#how-do-i-connect-a-mac-node-to-a-remote-gateway-tailscale-serve)
  - [应该在第二台笔记本上安装还是只添加一个节点?](#should-i-install-on-a-second-laptop-or-just-add-a-node)
- [环境变量和 .env 加载](#env-vars-and-env-loading)
  - [OpenClaw 如何加载环境变量?](#how-does-openclaw-load-environment-variables)
  - ["我通过服务启动了 Gateway，我的环境变量消失了。"怎么办?](#i-started-the-gateway-via-the-service-and-my-env-vars-disappeared-what-now)
  - [我设置了 `COPILOT_GITHUB_TOKEN`，但模型状态显示"Shell env: off"。为什么?](#i-set-copilotgithubtoken-but-models-status-shows-shell-env-off-why)
- [会话和多聊天](#sessions-and-multiple-chats)
  - [如何开始新对话?](#how-do-i-start-a-fresh-conversation)
  - [如果我从不发送 `/new`，会话会自动重置吗?](#do-sessions-reset-automatically-if-i-never-send-new)
  - [有没有办法创建一支 OpenClaw 实例团队——一个 CEO 和多个代理?](#is-there-a-way-to-make-a-team-of-openclaw-instances-one-ceo-and-many-agents)
  - [为什么上下文在任务中途被截断？如何防止?](#why-did-context-get-truncated-midtask-how-do-i-prevent-it)
  - [如何完全重置 OpenClaw 但保持安装?](#how-do-i-completely-reset-openclaw-but-keep-it-installed)
  - [收到"上下文太大"错误——如何重置或压缩?](#im-getting-context-too-large-errors-how-do-i-reset-or-compact)
  - [为什么看到"LLM 请求被拒绝：messages.content.tool_use.input 字段必填"?](#why-am-i-seeing-llm-request-rejected-messagescontenttool_useinput-field-required)
  - [为什么每 30 分钟收到一次心跳消息?](#why-am-i-getting-heartbeat-messages-every-30-minutes)
  - [需要在 WhatsApp 群组中添加"机器人账户"吗?](#do-i-need-to-add-a-bot-account-to-a-whatsapp-group)
  - [如何获取 WhatsApp 群组的 JID?](#how-do-i-get-the-jid-of-a-whatsapp-group)
  - [为什么 OpenClaw 不在群组中回复?](#why-doesnt-openclaw-reply-in-a-group)
  - [群组/线程与私信共享上下文吗?](#do-groupsthreads-share-context-with-dms)
  - [可以创建多少个工作区和代理?](#how-many-workspaces-and-agents-can-i-create)
  - [可以同时运行多个机器人或聊天吗（Slack），如何设置?](#can-i-run-multiple-bots-or-chats-at-the-same-time-slack-and-how-should-i-set-that-up)
- [模型：默认、选择、别名、切换](#models-defaults-selection-aliases-switching)
  - [什么是"默认模型"?](#what-is-the-default-model)
  - [您推荐什么模型?](#what-model-do-you-recommend)
  - [如何在不清除配置的情况下切换模型?](#how-do-i-switch-models-without-wiping-my-config)
  - [可以使用自托管模型（llama.cpp、vLLM、Ollama）吗?](#can-i-use-selfhosted-models-llamacpp-vllm-ollama)
  - [OpenClaw、Flawd 和 Krill 使用什么模型?](#what-do-openclaw-flawd-and-krill-use-for-models)
  - [如何即时切换模型（无需重启）?](#how-do-i-switch-models-on-the-fly-without-restarting)
  - [可以将 GPT 5.2 用于日常任务，将 Codex 5.3 用于编码吗?](#can-i-use-gpt-52-for-daily-tasks-and-codex-53-for-coding)
  - [为什么看到"模型 … 不被允许"然后没有回复?](#why-do-i-see-model-is-not-allowed-and-then-no-reply)
  - [为什么看到"未知模型：minimax/MiniMax-M2.1"?](#why-do-i-see-unknown-model-minimaxminimaxm21)
  - [可以将 MiniMax 作为默认值，将 OpenAI 用于复杂任务吗?](#can-i-use-minimax-as-my-default-and-openai-for-complex-tasks)
  - [opus / sonnet / gpt 是内置快捷方式吗?](#are-opus-sonnet-gpt-builtin-shortcuts)
  - [如何定义/覆盖模型快捷方式（别名）?](#how-do-i-defineoverride-model-shortcuts-aliases)
  - [如何从 OpenRouter 或 Z.AI 等其他提供商添加模型?](#how-do-i-add-models-from-other-providers-like-openrouter-or-zai)
- [模型故障转移和"所有模型都失败了"](#model-failover-and-all-models-failed)
  - [故障转移如何工作?](#how-does-failover-work)
  - [这个错误是什么意思?](#what-does-this-error-mean)
  - [`No credentials found for profile "anthropic:default"` 的修复清单](#fix-checklist-for-no-credentials-found-for-profile-anthropicdefault)
  - [为什么它还尝试了 Google Gemini 并失败了?](#why-did-it-also-try-google-gemini-and-fail)
- [身份验证配置：是什么以及如何管理](#auth-profiles-what-they-are-and-how-to-manage-them)
  - [什么是身份验证配置?](#what-is-an-auth-profile)
  - [典型的配置 ID 有哪些?](#what-are-typical-profile-ids)
  - [可以控制首先尝试哪个身份验证配置吗?](#can-i-control-which-auth-profile-is-tried-first)
  - [OAuth 与 API 密钥有什么区别?](#oauth-vs-api-key-whats-the-difference)
- [Gateway：端口、"已在运行"和远程模式](#gateway-ports-already-running-and-remote-mode)
  - [Gateway 使用什么端口?](#what-port-does-the-gateway-use)
  - [为什么 `openclaw gateway status` 显示 `Runtime: running` 但 `RPC probe: failed`?](#why-does-openclaw-gateway-status-say-runtime-running-but-rpc-probe-failed)
  - [为什么 `openclaw gateway status` 显示 `Config (cli)` 和 `Config (service)` 不同?](#why-does-openclaw-gateway-status-show-config-cli-and-config-service-different)
  - ["另一个 Gateway 实例已在监听"是什么意思?](#what-does-another-gateway-instance-is-already-listening-mean)
  - [如何以远程模式运行 OpenClaw（客户端连接到其他地方的 Gateway）?](#how-do-i-run-openclaw-in-remote-mode-client-connects-to-a-gateway-elsewhere)
  - [控制 UI 显示"未授权"（或不断重新连接）。怎么办?](#the-control-ui-says-unauthorized-or-keeps-reconnecting-what-now)
  - [我设置了 `gateway.bind: "tailnet"` 但无法绑定/没有监听](#i-set-gatewaybind-tailnet-but-it-cant-bind-nothing-listens)
  - [可以在同一主机上运行多个 Gateway 吗?](#can-i-run-multiple-gateways-on-the-same-host)
  - ["握手无效"/代码 1008 是什么意思?](#what-does-invalid-handshake-code-1008-mean)
- [日志记录和调试](#logging-and-debugging)
  - [日志在哪里?](#where-are-logs)
  - [如何启动/停止/重启 Gateway 服务?](#how-do-i-startstoprestart-the-gateway-service)
  - [我在 Windows 上关闭了终端——如何重启 OpenClaw?](#i-closed-my-terminal-on-windows-how-do-i-restart-openclaw)
  - [Gateway 正常运行但回复从未到达。应该检查什么?](#the-gateway-is-up-but-replies-never-arrive-what-should-i-check)
  - ["与 Gateway 断开连接：无原因"——怎么办?](#disconnected-from-gateway-no-reason-what-now)
  - [Telegram setMyCommands 因网络错误失败。应该检查什么?](#telegram-setmycommands-fails-with-network-errors-what-should-i-check)
  - [TUI 无输出。应该检查什么?](#tui-shows-no-output-what-should-i-check)
  - [如何完全停止然后启动 Gateway?](#how-do-i-completely-stop-then-start-the-gateway)
  - [通俗解释：`openclaw gateway restart` 与 `openclaw gateway`](#eli5-openclaw-gateway-restart-vs-openclaw-gateway)
  - [出现故障时获取更多详细信息的最快方法是什么?](#whats-the-fastest-way-to-get-more-details-when-something-fails)
- [媒体和附件](#media-and-attachments)
  - [我的技能生成了图像/PDF，但什么都没发送](#my-skill-generated-an-imagepdf-but-nothing-was-sent)
- [安全和访问控制](#security-and-access-control)
  - [向入站私信公开 OpenClaw 安全吗?](#is-it-safe-to-expose-openclaw-to-inbound-dms)
  - [提示注入仅是公共机器人的问题吗?](#is-prompt-injection-only-a-concern-for-public-bots)
  - [我的机器人应该有自己的电子邮件、GitHub 账户或电话号码吗?](#should-my-bot-have-its-own-email-github-account-or-phone-number)
  - [可以给它对我短信的自主权，这安全吗?](#can-i-give-it-autonomy-over-my-text-messages-and-is-that-safe)
  - [可以使用更便宜的模型用于个人助理任务吗?](#can-i-use-cheaper-models-for-personal-assistant-tasks)
  - [我在 Telegram 中运行了 `/start` 但没有收到配对码](#i-ran-start-in-telegram-but-didnt-get-a-pairing-code)
  - [WhatsApp：它会给我的联系人发消息吗？配对如何工作?](#whatsapp-will-it-message-my-contacts-how-does-pairing-work)
- [聊天命令、中止任务和"它不停止"](#chat-commands-aborting-tasks-and-it-wont-stop)
  - [如何阻止内部系统消息出现在聊天中?](#how-do-i-stop-internal-system-messages-from-showing-in-chat)
  - [如何停止/取消正在运行的任务?](#how-do-i-stopcancel-a-running-task)
  - [如何从 Telegram 发送 Discord 消息？（"跨上下文消息被拒绝"）](#how-do-i-send-a-discord-message-from-telegram-crosscontext-messaging-denied)
  - [为什么感觉机器人会"忽略"快速连续的消息?](#why-does-it-feel-like-the-bot-ignores-rapidfire-messages)

## 出现问题后的前 60 秒

1. **快速状态（首次检查）**

   ```bash
   openclaw status
   ```

   快速本地摘要：操作系统 + 更新、Gateway/服务可达性、代理/会话、提供商配置 + 运行时问题（当 Gateway 可达时）。

2. **可粘贴报告（可安全共享）**

   ```bash
   openclaw status --all
   ```

   仅读取的诊断，带日志尾部（令牌已脱敏）。

3. **守护进程 + 端口状态**

   ```bash
   openclaw gateway status
   ```

   显示监督器运行时与 RPC 可达性、探测目标 URL，以及服务可能使用的配置。

4. **深度探测**

   ```bash
   openclaw status --deep
   ```

   运行 Gateway 健康检查 + 提供商探测（需要可达的 Gateway）。参阅[健康检查](/gateway/health)。

5. **跟踪最新日志**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 不可用，回退到：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   文件日志与服务日志是分开的；参阅[日志记录](/logging)和[故障排除](/gateway/troubleshooting)。

6. **运行 doctor（修复）**

   ```bash
   openclaw doctor
   ```

   修复/迁移配置/状态 + 运行健康检查。参阅 [Doctor](/gateway/doctor)。

7. **Gateway 快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # 在错误时显示目标 URL + 配置路径
   ```

   向运行中的 Gateway 请求完整快照（仅 WS）。参阅[健康检查](/gateway/health)。

## 快速开始和首次运行设置

### 我遇到问题了，最快的解决方法是什么

使用**能够看到您机器**的本地 AI 代理。这比在 Discord 中提问要有效得多，因为大多数"遇到问题"的情况都是**本地配置或环境问题**，远程帮助者无法检查。

- **Claude Code**：[https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
- **OpenAI Codex**：[https://openai.com/codex/](https://openai.com/codex/)

这些工具可以读取仓库、运行命令、检查日志，并帮助修复您的机器级设置（PATH、服务、权限、认证文件）。通过可破解（git）安装给它们提供**完整源代码检出**：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

这会从 git 检出安装 OpenClaw，因此代理可以读取代码 + 文档，并对您正在运行的确切版本进行推理。您可以随时通过重新运行安装程序（不带 `--install-method git`）切换回稳定版。

提示：让代理**计划并监督**修复（逐步），然后只执行必要的命令。这样可以保持变更小且易于审查。

如果您发现了真正的 Bug 或修复，请提交 GitHub Issue 或发送 PR：
[https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
[https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

从这些命令开始（在寻求帮助时分享输出）：

```bash
openclaw status
openclaw models status
openclaw doctor
```

功能说明：

- `openclaw status`：Gateway/代理健康 + 基本配置的快速快照。
- `openclaw models status`：检查提供商身份验证 + 模型可用性。
- `openclaw doctor`：验证并修复常见的配置/状态问题。

其他有用的 CLI 检查：`openclaw status --all`、`openclaw logs --follow`、`openclaw gateway status`、`openclaw health --verbose`。

快速调试循环：[出现问题后的前 60 秒](#出现问题后的前-60-秒)。
安装文档：[安装](/install)、[安装程序标志](/install/installer)、[更新](/install/updating)。

### 安装和设置 OpenClaw 的推荐方式是什么

仓库推荐从源代码运行并使用引导向导：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw onboard --install-daemon
```

向导还可以自动构建 UI 资源。引导后，通常在端口 **18789** 上运行 Gateway。

从源代码（贡献者/开发）：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build # 首次运行时自动安装 UI 依赖
openclaw onboard
```

如果还没有全局安装，通过 `pnpm openclaw onboard` 运行。

### 引导完成后如何打开仪表板

向导在引导后立即使用干净的（无令牌）仪表板 URL 打开您的浏览器，并在摘要中打印链接。保持该选项卡打开；如果没有启动，在同一台机器上复制/粘贴打印的 URL。

### 如何在本地主机与远程验证仪表板令牌

**本地主机（同一台机器）：**

- 打开 `http://127.0.0.1:18789/`。
- 如果要求身份验证，将 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）中的令牌粘贴到控制 UI 设置中。
- 从 Gateway 主机检索：`openclaw config get gateway.auth.token`（或生成一个：`openclaw doctor --generate-gateway-token`）。

**不在本地主机上：**

- **Tailscale Serve**（推荐）：保持绑定到环回，运行 `openclaw gateway --tailscale serve`，打开 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 为 `true`，身份标识头满足控制 UI/WebSocket 身份验证（无令牌，假设受信任的 Gateway 主机）；HTTP API 仍需要令牌/密码。
- **Tailnet 绑定**：运行 `openclaw gateway --bind tailnet --token "<token>"`，打开 `http://<tailscale-ip>:18789/`，在仪表板设置中粘贴令牌。
- **SSH 隧道**：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`，在控制 UI 设置中粘贴令牌。

参阅[仪表板](/web/dashboard)和 [Web 界面](/web)了解绑定模式和认证详情。

### 需要什么运行时

需要 Node **>= 22**。推荐使用 `pnpm`。**不推荐**将 Bun 用于 Gateway。

### 可以在 Raspberry Pi 上运行吗

可以。Gateway 非常轻量——文档列出 **512MB-1GB RAM**、**1 核心**和约 **500MB** 磁盘对个人使用已足够，并指出 **Raspberry Pi 4 可以运行它**。

如果您需要额外的余量（日志、媒体、其他服务），**推荐 2GB**，但这不是硬性最低要求。

提示：小型 Pi/VPS 可以托管 Gateway，您可以在笔记本/手机上配对**节点**以获取本地屏幕/摄像头/Canvas 或命令执行。参阅[节点](/nodes)。

### Raspberry Pi 安装有哪些技巧

简短版本：它可以工作，但预期会有一些粗糙的边缘。

- 使用 **64 位**操作系统并保持 Node >= 22。
- 首选**可破解（git）安装**，以便您可以快速查看日志并更新。
- 不添加任何通道/技能开始，然后逐一添加。
- 如果遇到奇怪的二进制问题，通常是 **ARM 兼容性**问题。

文档：[Linux](/platforms/linux)、[安装](/install)。

### 卡在"唤醒我的朋友"/ 引导无法孵化。怎么办

该屏幕依赖 Gateway 的可达性和身份验证。TUI 在首次孵化时也会自动发送"唤醒我的朋友！"如果您看到该行**没有回复**且令牌保持为 0，代理从未运行。

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

3. 如果仍然卡住，运行：

```bash
openclaw doctor
```

如果 Gateway 是远程的，确保隧道/Tailscale 连接已建立，并且 UI 指向正确的 Gateway。参阅[远程访问](/gateway/remote)。

### 可以将设置迁移到新机器（Mac mini）而无需重新引导吗

可以。复制**状态目录**和**工作区**，然后运行一次 Doctor。这会保持您的机器人"完全相同"（内存、会话历史、认证和通道状态），只要您**同时**复制两个位置：

1. 在新机器上安装 OpenClaw。
2. 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
3. 复制您的工作区（默认：`~/.openclaw/workspace`）。
4. 运行 `openclaw doctor` 并重启 Gateway 服务。

这会保留配置、认证配置、WhatsApp 凭据、会话和内存。如果您处于远程模式，请记住 Gateway 主机拥有会话存储和工作区。

**重要：** 如果您只将工作区提交/推送到 GitHub，您在备份**内存 + 引导文件**，但**不是**会话历史或认证。这些位于 `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

相关：[迁移](/install/migrating)、[数据存储位置](/help/faq#where-does-openclaw-store-its-data)、[代理工作区](/concepts/agent-workspace)、[Doctor](/gateway/doctor)、[远程模式](/gateway/remote)。

### 在哪里查看最新版本的新功能

查看 GitHub 更新日志：
[https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

最新条目在顶部。如果顶部部分标记为 **Unreleased**，下一个有日期的部分是最新发布的版本。条目按**亮点**、**更改**和**修复**分组（需要时还有文档/其他部分）。

### 无法访问 docs.openclaw.ai（SSL 错误）。怎么办

某些 Comcast/Xfinity 连接通过 Xfinity Advanced Security 错误地封锁了 `docs.openclaw.ai`。禁用它或将 `docs.openclaw.ai` 加入白名单，然后重试。更多详情：[故障排除](/help/troubleshooting#docsopenclawai-shows-an-ssl-error-comcastxfinity)。
请通过以下链接帮助我们解除封锁：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

如果您仍然无法访问该网站，文档已在 GitHub 上镜像：
[https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

### 稳定版和测试版有什么区别

**稳定版**和**测试版**是 **npm dist-tag**，不是独立的代码线：

- `latest` = 稳定版
- `beta` = 用于测试的早期构建

我们将构建发布到 **beta**，进行测试，一旦构建稳定，我们就会**将相同版本提升为 `latest`**。这就是为什么测试版和稳定版可能指向**相同版本**的原因。

查看更改：
[https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

### 如何安装测试版，测试版和开发版有什么区别

**Beta** 是 npm dist-tag `beta`（可能与 `latest` 相同）。
**Dev** 是 `main` 的移动头部（git）；发布时使用 npm dist-tag `dev`。

单行命令（macOS/Linux）：

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
```

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
```

Windows 安装程序（PowerShell）：
[https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

更多详情：[开发渠道](/install/development-channels)和[安装程序标志](/install/installer)。

### 安装和引导通常需要多长时间

粗略指南：

- **安装：** 2-5 分钟
- **引导：** 5-15 分钟，取决于您配置了多少通道/模型

如果卡住，使用[安装程序卡住](/help/faq#installer-stuck-how-do-i-get-more-feedback)和[遇到问题](/help/faq#im-stuck--whats-the-fastest-way-to-get-unstuck)中的快速调试循环。

### 如何尝试最新版本

两个选项：

1. **开发渠道（git 检出）：**

```bash
openclaw update --channel dev
```

这会切换到 `main` 分支并从源代码更新。

2. **可破解安装（从安装程序网站）：**

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

这给您一个可以编辑的本地仓库，然后通过 git 更新。

如果您倾向于手动干净克隆，使用：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
```

文档：[更新](/cli/update)、[开发渠道](/install/development-channels)、[安装](/install)。

### 安装程序卡住了？如何获取更多反馈

使用**详细输出**重新运行安装程序：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
```

带详细输出的 Beta 安装：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
```

对于可破解（git）安装：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
```

Windows (PowerShell) 等效：

```powershell
# install.ps1 目前还没有专用的 -Verbose 标志。
Set-PSDebug -Trace 1
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
Set-PSDebug -Trace 0
```

更多选项：[安装程序标志](/install/installer)。

### Windows 安装提示找不到 git 或无法识别 openclaw

两个常见的 Windows 问题：

**1) npm 错误 spawn git / 找不到 git**

- 安装 **Git for Windows** 并确保 `git` 在您的 PATH 上。
- 关闭并重新打开 PowerShell，然后重新运行安装程序。

**2) 安装后 openclaw 无法识别**

- 您的 npm 全局 bin 文件夹不在 PATH 上。
- 检查路径：

  ```powershell
  npm config get prefix
  ```

- 确保 `<prefix>\\bin` 在 PATH 上（在大多数系统上是 `%AppData%\\npm`）。
- 更新 PATH 后关闭并重新打开 PowerShell。

如果您想要最流畅的 Windows 设置，请使用 **WSL2** 而不是原生 Windows。
文档：[Windows](/platforms/windows)。

### 文档没有回答我的问题——如何获得更好的答案

使用**可破解（git）安装**，这样您就拥有了完整的源代码和本地文档，然后从那个文件夹向您的机器人（或 Claude/Codex）提问，以便它能读取仓库并精确回答。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

更多详情：[安装](/install)和[安装程序标志](/install/installer)。

### 如何在 Linux 上安装 OpenClaw

简短答案：按照 Linux 指南操作，然后运行引导向导。

- Linux 快速路径 + 服务安装：[Linux](/platforms/linux)。
- 完整演练：[入门](/start/getting-started)。
- 安装程序 + 更新：[安装与更新](/install/updating)。

### 如何在 VPS 上安装 OpenClaw

任何 Linux VPS 均可使用。在服务器上安装，然后使用 SSH/Tailscale 访问 Gateway。

指南：[exe.dev](/install/exe-dev)、[Hetzner](/install/hetzner)、[Fly.io](/install/fly)。
远程访问：[Gateway 远程](/gateway/remote)。

### 云/VPS 安装指南在哪里

我们维护了一个**托管中心**，列出了常用提供商。选择一个并按照指南操作：

- [VPS 托管](/vps)（所有提供商汇总）
- [Fly.io](/install/fly)
- [Hetzner](/install/hetzner)
- [exe.dev](/install/exe-dev)

云端的工作原理：**Gateway 运行在服务器上**，您从笔记本/���机通过控制 UI（或 Tailscale/SSH）访问它。您的状态 + 工作区驻留在服务器上，因此将主机视为真实来源并进行备份。

您可以将**节点**（Mac/iOS/Android/无头）配对到该云 Gateway，以访问本地屏幕/摄像头/Canvas 或在笔记本上运行命令，同时将 Gateway 保留在云端。

中心：[平台](/platforms)。远程访问：[Gateway 远程](/gateway/remote)。
节点：[节点](/nodes)、[节点 CLI](/cli/nodes)。

### 可以让 OpenClaw 自我更新吗

简短答案：**可能可以，但不推荐**。更新流程可能重启 Gateway（这会断开活动会话），可能需要干净的 git 检出，并且可能提示确认。更安全的做法：以操作员身份从 shell 运行更新。

使用 CLI：

```bash
openclaw update
openclaw update status
openclaw update --channel stable|beta|dev
openclaw update --tag <dist-tag|version>
openclaw update --no-restart
```

如果必须从代理自动化：

```bash
openclaw update --yes --no-restart
openclaw gateway restart
```

文档：[更新](/cli/update)、[更新指南](/install/updating)。

### 引导向导实际上做了什么

`openclaw onboard` 是推荐的设置路径。在**本地模式**下，它引导您完成：

- **模型/认证设置**（Anthropic **setup-token** 推荐用于 Claude 订阅，支持 OpenAI Codex OAuth，可选 API 密钥，支持 LM Studio 本地模型）
- **工作区**位置 + 引导文件
- **Gateway 设置**（绑定/端口/认证/tailscale）
- **提供商**（WhatsApp、Telegram、Discord、Mattermost（插件）、Signal、iMessage）
- **守护进程安装**（macOS 上的 LaunchAgent；Linux/WSL2 上的 systemd 用户单元）
- **健康检查**和**技能**选择

如果您配置的模型未知或缺少认证，它还会发出警告。

### 运行 OpenClaw 需要 Claude 或 OpenAI 订阅吗

不需要。您可以使用 **API 密钥**（Anthropic/OpenAI/其他）或**仅本地模型**运行 OpenClaw，从而让您的数据保留在设备上。订阅（Claude Pro/Max 或 OpenAI Codex）是验证这些提供商的可选方式。

文档：[Anthropic](/providers/anthropic)、[OpenAI](/providers/openai)、[本地模型](/gateway/local-models)、[模型](/concepts/models)。

### 可以不用 API 密钥使用 Claude Max 订阅吗

可以。您可以使用 **setup-token** 进行身份验证，而不是 API 密钥。这是订阅路径。

Claude Pro/Max 订阅**不包含 API 密钥**，因此这是订阅账户的正确做法。重要：您必须向 Anthropic 确认此用法在其订阅政策和条款下是允许的。如果您想要最明确、受支持的路径，请使用 Anthropic API 密钥。

### Anthropic setup-token 认证如何工作

`claude setup-token` 通过 Claude Code CLI 生成一个**令牌字符串**（在 Web 控制台中不可用）。您可以在**任何机器**上运行它。在向导中选择 **Anthropic token（粘贴 setup-token）** 或使用 `openclaw models auth paste-token --provider anthropic` 粘贴它。令牌作为 **anthropic** 提供商的认证配置存储，用法类似 API 密钥（不自动刷新）。更多详情：[OAuth](/concepts/oauth)。

### 在哪里找到 Anthropic setup-token

它**不在** Anthropic 控制台中。setup-token 由 **Claude Code CLI** 在**任何机器**上生成：

```bash
claude setup-token
```

复制它打印的令牌，然后在向导中选择 **Anthropic token（粘贴 setup-token）**。如果您想在 Gateway 主机上运行它，使用 `openclaw models auth setup-token --provider anthropic`。如果您在其他地方运行了 `claude setup-token`，在 Gateway 主机上使用 `openclaw models auth paste-token --provider anthropic` 粘贴它。参阅 [Anthropic](/providers/anthropic)。

### 支持 Claude 订阅认证（Claude Pro 或 Max）吗

支持——通过 **setup-token**。OpenClaw 不再重用 Claude Code CLI OAuth 令牌；请使用 setup-token 或 Anthropic API 密钥。在任何地方生成令牌并在 Gateway 主机上粘贴它。参阅 [Anthropic](/providers/anthropic) 和 [OAuth](/concepts/oauth)。

注意：Claude 订阅访问受 Anthropic 条款约束。对于生产或多用户工作负载，API 密钥通常是更安全的选择。

### 为什么看到来自 Anthropic 的 HTTP 429 rate_limit_error

这意味着您的 **Anthropic 配额/速率限制**在当前窗口内已耗尽。如果您使用 **Claude 订阅**（setup-token 或 Claude Code OAuth），请等待窗口重置或升级您的计划。如果您使用 **Anthropic API 密钥**，请检查 Anthropic 控制台的使用/计费并根据需要提高限制。

如果消息具体是：
`Extra usage is required for long context requests`，则请求正在尝试使用 Anthropic 的 1M 上下文测试版（`context1m: true`）。这仅在您的凭据符合长上下文计费资格时有效（API 密钥计费或启用了额外用量的订阅）。

提示：设置**备用模型**，以便在提供商受到速率限制时 OpenClaw 可以继续回复。
参阅[模型](/cli/models)、[OAuth](/concepts/oauth) 和 [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

### 支持 AWS Bedrock 吗

支持——通过 pi-ai 的 **Amazon Bedrock（Converse）** 提供商和**手动配置**。您必须在 Gateway 主机上提供 AWS 凭据/区域，并在模型配置中添加 Bedrock 提供商条目。参阅 [Amazon Bedrock](/providers/bedrock) 和[模型提供商](/providers/models)。如果您更喜欢托管密钥流程，在 Bedrock 前面设置一个 OpenAI 兼容代理仍然是一个有效选项。

### Codex 认证如何工作

OpenClaw 通过 OAuth（ChatGPT 登录）支持 **OpenAI Code (Codex)**。向导可以运行 OAuth 流程，并在适当时将默认模型设置为 `openai-codex/gpt-5.3-codex`。参阅[模型提供商](/concepts/model-providers)和[向导](/start/wizard)。

### 支持 OpenAI 订阅认证（Codex OAuth）吗

支持。OpenClaw 完全支持 **OpenAI Code（Codex）订阅 OAuth**。引导向导可以为您运行 OAuth 流程。

参阅 [OAuth](/concepts/oauth)、[模型提供商](/concepts/model-providers)和[向导](/start/wizard)。

### 如何设置 Gemini CLI OAuth

Gemini CLI 使用**插件认证流程**，而不是 `openclaw.json` 中的客户端 ID 或密钥。

步骤：

1. 启用插件：`openclaw plugins enable google-gemini-cli-auth`
2. 登录：`openclaw models auth login --provider google-gemini-cli --set-default`

这将 OAuth 令牌存储在 Gateway 主机的认证配置中。详情：[模型提供商](/concepts/model-providers)。

### 本地模型适合日常聊天吗

通常不适合。OpenClaw 需要大上下文 + 强安全性；小模型会截断并泄漏。如果必须使用，请在本地运行您能运行的**最大** MiniMax M2.1 构建（LM Studio），并参阅 [/gateway/local-models](/gateway/local-models)。较小/量化的模型会增加提示注入风险——参阅[安全性](/gateway/security)。

### 如何让托管模型流量保留在特定区域

选择区域固定的端点。OpenRouter 为 MiniMax、Kimi 和 GLM 公开了美国托管选项；选择美国托管的变体以使数据保留在区域内。您仍然可以通过使用 `models.mode: "merge"` 将 Anthropic/OpenAI 与这些一起列出，以便在尊重您选择的区域提供商的同时保持备用可用。

### 必须购买 Mac Mini 来安装吗

不需要。OpenClaw 在 macOS 或 Linux（Windows 通过 WSL2）上运行。Mac mini 是可选的——有些人购买它作为始终开机的主机，但小型 VPS、家庭服务器或 Raspberry Pi 级别的设备也可以。

您只需要 Mac **用于仅 macOS 的工具**。对于 iMessage，使用 [BlueBubbles](/channels/bluebubbles)（推荐）——BlueBubbles 服务器可以在任何 Mac 上运行，而 Gateway 可以在 Linux 或其他地方运行。如果您想要其他仅 macOS 的工具，请在 Mac 上运行 Gateway 或配对 macOS 节点。

文档：[BlueBubbles](/channels/bluebubbles)、[节点](/nodes)、[Mac 远程模式](/platforms/mac/remote)。

### 支持 iMessage 需要 Mac mini 吗

您需要**某个已登录 Messages 的 macOS 设备**。它**不必**是 Mac mini——任何 Mac 都可以。**使用 [BlueBubbles](/channels/bluebubbles)**（推荐）用于 iMessage——BlueBubbles 服务器在 macOS 上运行，而 Gateway 可以在 Linux 或其他地方运行。

常见设置：

- 在 Linux/VPS 上运行 Gateway，在任何已登录 Messages 的 Mac 上运行 BlueBubbles 服务器。
- 如果您想要最简单的单机设置，在 Mac 上运行所有内容。

文档：[BlueBubbles](/channels/bluebubbles)、[节点](/nodes)、[Mac 远程模式](/platforms/mac/remote)。

### 购买 Mac mini 运行 OpenClaw 后，可以连接到 MacBook Pro 吗

可以。**Mac mini 可以运行 Gateway**，您的 MacBook Pro 可以作为**节点**（伴侣设备）连接。节点不运行 Gateway——它们在该设备上提供额外功能，如屏幕/摄像头/Canvas 和 `system.run`。

常见模式：

- Gateway 在 Mac mini 上（始终开机）。
- MacBook Pro 运行 macOS 应用或节点主机并配对到 Gateway。
- 使用 `openclaw nodes status` / `openclaw nodes list` 查看它。

文档：[节点](/nodes)、[节点 CLI](/cli/nodes)。

### 可以使用 Bun 吗

**不推荐使用 Bun**。我们发现运行时错误，特别是与 WhatsApp 和 Telegram 相关的。使用 **Node** 以获得稳定的 Gateway。

如果您仍然想尝试 Bun，请在没有 WhatsApp/Telegram 的非生产 Gateway 上进行。

### Telegram：allowFrom 里填什么

`channels.telegram.allowFrom` 是**人类发送者的 Telegram 用户 ID**（数字）。它不是机器人用户名。

引导向导接受 `@username` 输入并将其解析为数字 ID，但 OpenClaw 授权仅使用数字 ID。

更安全的方法（无第三方机器人）：

- 向您的机器人发送私信，然后运行 `openclaw logs --follow` 并读取 `from.id`。

官方 Bot API：

- 向您的机器人发送私信，然后调用 `https://api.telegram.org/bot<bot_token>/getUpdates` 并读取 `message.from.id`。

第三方（隐私较低）：

- 向 `@userinfobot` 或 `@getidsbot` 发送私信。

参阅 [/channels/telegram](/channels/telegram#access-control-dms--groups)。

### 多个人能用同一个 WhatsApp 号码配合不同的 OpenClaw 实例吗

可以，通过**多代理路由**。将每个发送者的 WhatsApp **私信**（peer `kind: "direct"`，发送者 E.164 格式如 `+15551234567`）绑定到不同的 `agentId`，这样每个人都有自己的工作区和会话存储。回复仍然来自**同一个 WhatsApp 账户**，私信访问控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）是每个 WhatsApp 账户全局的。参阅[多代理路由](/concepts/multi-agent)和 [WhatsApp](/channels/whatsapp)。

### 可以同时运行"快速聊天"代理和"Opus 编码"代理吗

可以。使用多代理路由：给每个代理自己的默认模型，然后将入站路由（提供商账户或特定 peer）绑定到每个代理。示例配置在[多代理路由](/concepts/multi-agent)中。另参阅[模型](/concepts/models)和[配置](/gateway/configuration)。

### Homebrew 在 Linux 上可用吗

可以。Homebrew 支持 Linux（Linuxbrew）。快速设置：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
brew install <formula>
```

如果您通过 systemd 运行 OpenClaw，确保服务 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或您的 brew 前缀），以便 `brew` 安装的工具在非登录 shell 中可解析。
最新构建还会在 Linux systemd 服务上预置常见的用户 bin 目录（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），并在设置时遵循 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR`。

### 可破解（git）安装和 npm 安装有什么区别

- **可破解（git）安装：** 完整源代码检出，可编辑，最适合贡献者。您在本地运行构建，可以修补代码/文档。
- **npm 安装：** 全局 CLI 安装，无仓库，最适合"直接运行"。更新来自 npm dist-tag。

文档：[入门](/start/getting-started)、[更新](/install/updating)。

### 之后可以在 npm 和 git 安装之间切换吗

可以。安装另一种方式，然后运行 Doctor 以便 Gateway 服务指向新的入口点。这**不会删除您的数据**——它只会更改 OpenClaw 代码安装。您的状态（`~/.openclaw`）和工作区（`~/.openclaw/workspace`）保持不变。

从 npm 切换到 git：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
openclaw doctor
openclaw gateway restart
```

从 git 切换到 npm：

```bash
npm install -g openclaw@latest
openclaw doctor
openclaw gateway restart
```

Doctor 检测 Gateway 服务入口点不匹配，并提供将服务配置重写为与当前安装匹配（在自动化中使用 `--repair`）。

备份提示：参阅[备份策略](/help/faq#whats-the-recommended-backup-strategy)。

### 应该在笔记本还是 VPS 上运行 Gateway

简短答案：**如果您需要 24/7 可靠性，请使用 VPS**。如果您想要最低摩擦，并且可以接受睡眠/重启，请在本地运行。

**笔记本（本地 Gateway）**

- **优点：** 无服务器成本，直接访问本地文件，实时浏览器窗口。
- **缺点：** 睡眠/网络断开 = 断连，操作系统更新/重启会中断，必须保持运行。

**VPS/云**

- **优点：** 始终开机，稳定网络，无笔记本睡眠问题，更容易保持运行。
- **缺点：** 通常无头运行（使用截图），仅远程文件访问，必须通过 SSH 进行更新。

**OpenClaw 特定说明：** WhatsApp/Telegram/Slack/Mattermost（插件）/Discord 都可以从 VPS 正常工作。唯一真正的权衡是**无头浏览器**与可见窗口。参阅[浏览器](/tools/browser)。

**推荐默认值：** 如果以前有 Gateway 断连，请使用 VPS。当您积极使用 Mac 并希望本��文件访问或带可见浏览器的 UI 自动化时，本地是很好的选择。

### 在专用机器上运行 OpenClaw 有多重要

不是必需的，但**推荐用于可靠性和隔离**。

- **专用主机（VPS/Mac mini/Pi）：** 始终开机，睡眠/重启中断更少，权限更干净，更容易保持运行。
- **共享笔记本/台式机：** 完全适用于测试和积极使用，但当机器睡眠或更新时预期会有暂停。

如果您想两全其美，将 Gateway 保留在专用主机上，并将笔记本配对为**节点**以获取本地屏幕/摄像头/执行工具。参阅[节点](/nodes)。
安全指导，请阅读[安全性](/gateway/security)。

### 最低 VPS 要求和推荐操作系统是什么

OpenClaw 非常轻量。对于基本 Gateway + 一个聊天通道：

- **绝对最低：** 1 vCPU，1GB RAM，~500MB 磁盘。
- **推荐：** 1-2 vCPU，2GB RAM 或更多以获得余量（日志、媒体、多个通道）。节点工具和浏览器自动化可能占用大量资源。

操作系统：使用 **Ubuntu LTS**（或任何现代 Debian/Ubuntu）。Linux 安装路径在那里测试得最好。

文档：[Linux](/platforms/linux)、[VPS 托管](/vps)。

### 可以在虚拟机中运行 OpenClaw，有哪些要求

可以。像对待 VPS 一样对待虚拟机：它需要始终开机、可达，并且有足够的 RAM 用于 Gateway 和您启用的任何通道。

基线指导：

- **绝对最低：** 1 vCPU，1GB RAM。
- **推荐：** 如果您运行多个通道、浏览器自动化或媒体工具，则 2GB RAM 或更多。
- **操作系统：** Ubuntu LTS 或其他现代 Debian/Ubuntu。

如果您在 Windows 上，**WSL2 是最简单的虚拟机风格设置**，工具兼容性最好。参阅 [Windows](/platforms/windows)、[VPS 托管](/vps)。
如果您在虚拟机中运行 macOS，参阅 [macOS VM](/install/macos-vm)。

## OpenClaw 是什么？

### 用一段话描述 OpenClaw 是什么

OpenClaw 是您在自己设备上运行的个人 AI 助手。它在您已经使用的消息平台上回复（WhatsApp、Telegram、Slack、Mattermost（插件）、Discord、Google Chat、Signal、iMessage、WebChat），并且在支持的平台上还可以进行语音 + 实时 Canvas。**Gateway** 是始终开机的控制平面；助手是产品。

### 价值主张是什么

OpenClaw 不只是"Claude 包装器"。它是一个**本地优先的控制平面**，让您可以在**自己的硬件**上运行强大的助手，从您已经使用的聊天应用访问，具有有状态的会话、内存和工具——无需将您的工作流控制权交给托管 SaaS。

亮点：

- **您的设备，您的数据：** 在任何地方运行 Gateway（Mac、Linux、VPS），并保持工作区 + 会话历史在本地。
- **真实通道，不是 Web 沙箱：** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/等，以及在支持的平台上的移动语音和 Canvas。
- **模型无关：** 使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，支持每个代理路由和故障转移。
- **仅本地选项：** 运行本地模型，如果需要，**所有数据可以保留在您的设备上**。
- **多代理路由：** 每个通道、账户或任务的独立代理，各有自己的工作区和默认值。
- **开源且可破解：** 无供应商锁定地检查、扩展和自托管。

文档：[Gateway](/gateway)、[通道](/channels)、[多代理](/concepts/multi-agent)、[内存](/concepts/memory)。

### 刚设置好，应该先做什么

好的第一个项目：

- 构建网站（WordPress、Shopify 或简单的静态网站）。
- 原型移动应用（大纲、屏幕、API 计划）。
- 整理文件和文件夹（清理、命名、标记）。
- 连接 Gmail 并自动化摘要或后续跟进。

它可以处理大型任务，但当您将其分阶段并使用子代理进行并行工作时效果最佳。

### OpenClaw 最常见的五个日常用例是什么

日常好处通常如下所示：

- **个人简报：** 收件箱、日历和您关心的新闻摘要。
- **研究和起草：** 快速研究、摘要以及电子邮件或文档的初稿。
- **提醒和跟进：** 由 Cron 或心跳驱动的提示和清单。
- **浏览器自动化：** 填写表单、收集数据和重复网络任务。
- **跨设备协调：** 从手机发送任务，让 Gateway 在服务器上运行它，并在聊天中获得结果。

### OpenClaw 能帮助 SaaS 进行潜在客户开发、推广广告和博客吗

可以，用于**研究、资格认证和起草**。它可以扫描网站、构建候选名单、总结潜在客户，以及撰写推广或广告文案草稿。

对于**推广或广告运行**，保持人工参与循环。避免垃圾邮件，遵守当地法律和平台政策，并在发送前审查任何内容。最安全的模式是让 OpenClaw 起草，您来批准。

文档：[安全性](/gateway/security)。

### 与 Claude Code 相比用于 Web 开发有什么优势

OpenClaw 是**个人助手**和协调层，不是 IDE 替代品。在仓库内最快速的直接编码循环中使用 Claude Code 或 Codex。当您需要持久内存、跨��备访问和工具编排时使用 OpenClaw。

优势：

- **跨会话的持久内存 + 工作区**
- **多平台访问**（WhatsApp、Telegram、TUI、WebChat）
- **工具编排**（浏览器、文件、调度、钩子）
- **始终开机的 Gateway**（在 VPS 上运行，从任何地方交互）
- **节点**用于本地浏览器/屏幕/摄像头/执行

展示：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)

## 技能和自动化

### 如何在不使仓库变脏的情况下自定义技能

使用托管覆盖而不是编辑仓库副本。将您的更改放在 `~/.openclaw/skills/<name>/SKILL.md`（或通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加文件夹）。优先级是 `<workspace>/skills` > `~/.openclaw/skills` > 捆绑，因此托管覆盖在不触碰 git 的情况下获胜。只有上游值得的编辑应该放在仓库中并作为 PR 提交。

### 可以从自定义文件夹加载技能吗

可以。通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加额外目录（最低优先级）。默认优先级保持不变：`<workspace>/skills` → `~/.openclaw/skills` → 捆绑 → `skills.load.extraDirs`。`clawhub` 默认安装到 `./skills`，OpenClaw 将其视为 `<workspace>/skills`。

### 如何对不同任务使用不同模型

目前支持的模式有：

- **Cron 作业**：隔离作业可以为每个作业设置 `model` 覆盖。
- **子代理**：将任务路由到具有不同默认模型的独立代理。
- **按需切换**：使用 `/model` 随时切换当前会话模型。

参阅[Cron 作业](/automation/cron-jobs)、[多代理路由](/concepts/multi-agent)和[斜杠命令](/tools/slash-commands)。

### Bot 在繁重工作时卡住了。如何卸载

使用**子代理**处理长时间或并行任务。子代理在自己的会话中运行，返回摘要，并保持您的主聊天响应。

让您的机器人"为此任务生成子代理"或使用 `/subagents`。
在聊天中使用 `/status` 查看 Gateway 当前正在做什么（以及它是否繁忙）。

令牌提示：长任务和子代理都消耗令牌。如果成本是一个问题，通过 `agents.defaults.subagents.model` 为子代理设置更便宜的模型。

文档：[子代理](/tools/subagents)。

### Discord 上线程绑定的子代理会话如何工作

使用线程绑定。您可以将 Discord 线程绑定到子代理或会话目标，以便该线程中的后续消息保持在该绑定会话上。

基本流程：

- 使用 `sessions_spawn` 和 `thread: true` 生成（以及可选的 `mode: "session"` 用于持久跟进）。
- 或手动使用 `/focus <target>` 绑定。
- 使用 `/agents` 检查绑定状态。
- 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自动取消焦点。
- 使用 `/unfocus` 分离线程。

所需配置：

- 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- Discord 覆盖：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
- 生成时自动绑定：设置 `channels.discord.threadBindings.spawnSubagentSessions: true`。

文档：[子代理](/tools/subagents)、[Discord](/channels/discord)、[配置参考](/gateway/configuration-reference)、[斜杠命令](/tools/slash-commands)。

### Cron 或提醒不触发。应该检查什么

Cron 在 Gateway 进程内运行。如果 Gateway 不持续运行，计划作业将不会运行。

检查清单：

- 确认 Cron 已启用（`cron.enabled`）且未设置 `OPENCLAW_SKIP_CRON`。
- 检查 Gateway 是否 24/7 运行（无睡眠/重启）。
- 验证作业的时区设置（`--tz` 与主机时区）。

调试：

```bash
openclaw cron run <jobId> --force
openclaw cron runs --id <jobId> --limit 50
```

文档：[Cron 作业](/automation/cron-jobs)、[Cron 与心跳](/automation/cron-vs-heartbeat)。

### 如何在 Linux 上安装技能

使用 **ClawHub**（CLI）或将技能放入您的工作区。macOS 技能 UI 在 Linux 上不可用。
在 [https://clawhub.com](https://clawhub.com) 浏览技能。

安装 ClawHub CLI（选择一个包管理器）：

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

### OpenClaw 可以按计划或在后台持续运行任务吗

可以。使用 Gateway 调度器：

- **Cron 作业**用于计划或定期任务（跨重启持久）。
- **心跳**用于"主会话"定期检查。
- **隔离作业**用于发布摘要或向聊天发送内容的自主代理。

文档：[Cron 作业](/automation/cron-jobs)、[Cron 与心跳](/automation/cron-vs-heartbeat)、[心跳](/gateway/heartbeat)。

### 可以从 Linux 运行仅适用于 Apple macOS 的技能吗

不能直接运行。macOS 技能由 `metadata.openclaw.os` 加上所需二进制文件控制，技能只有在 **Gateway 主机**上符合条件时才会出现在系统提示中。在 Linux 上，仅 `darwin` 的技能（如 `apple-notes`、`apple-reminders`、`things-mac`）除非您覆盖门控，否则不会加载。

您有三种支持的模式：

**选项 A - 在 Mac 上运行 Gateway（最简单）。**
在存在 macOS 二进制文件的地方运行 Gateway，然后在[远程模式](#how-do-i-run-openclaw-in-remote-mode-client-connects-to-a-gateway-elsewhere)下或通过 Tailscale 从 Linux 连接。技能正常加载，因为 Gateway 主机是 macOS。

**选项 B - 使用 macOS 节点（无 SSH）。**
在 Linux 上运行 Gateway，配对 macOS 节点（菜单栏应用），并在 Mac 上将**节点运行命令**设置为"始终询问"或"始终允许"。当节点上存在所需二进制文件时，OpenClaw 可以将仅 macOS 技能视为符合条件。代理通过 `nodes` 工具运行这些技能。如果您选择"始终询问"，在提示中批准"始终允许"会将该命令添加到允许列表。

**选项 C - 通过 SSH 代理 macOS 二进制文件（高级）。**
将 Gateway 保留在 Linux 上，但使所需的 CLI 二进制文件解析为在 Mac 上运行的 SSH 包装器。然后覆盖技能以允许 Linux，以便它保持符合条件。

1. 为二进制文件创建 SSH 包装器（示例：Apple Notes 的 `memo`）：

   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
   ```

2. 将包装器放在 Linux 主机上的 `PATH` 上（例如 `~/bin/memo`）。
3. 覆盖技能元数据（工作区或 `~/.openclaw/skills`）以允许 Linux：

   ```markdown
   ---
   name: apple-notes
   description: Manage Apple Notes via the memo CLI on macOS.
   metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
   ---
   ```

4. 启动新会话以刷新技能快照。

### 你们有 Notion 或 HeyGen 集成吗

目前没有内置集成。

选项：

- **自定义技能/插件：** 最适合可靠的 API 访问（Notion/HeyGen 都有 API）。
- **浏览器自动化：** 无需代码但速度更慢且更脆弱。

如果您想为每个客户保留上下文（代理工作流），一个简单的模式是：

- 每个客户一个 Notion 页面（上下文 + 偏好 + 活动工作）。
- 在会话开始时让代理获取该页面。

如果您想要原生集成，请提交功能请求或构建针对这些 API 的技能。

安装技能：

```bash
clawhub install <skill-slug>
clawhub update --all
```

ClawHub 安装到您当前目录下的 `./skills`（或回退到您配置的 OpenClaw 工作区）；OpenClaw 在下一个会话中将其视为 `<workspace>/skills`。对于跨代理共享技能，请将其放在 `~/.openclaw/skills/<name>/SKILL.md` 中。一些技能期望通过 Homebrew 安装的二进制文件；在 Linux 上这意味着 Linuxbrew（参见上面的 Homebrew Linux 常见问题条目）。参阅[技能](/tools/skills)和 [ClawHub](/tools/clawhub)。

### 如何安装用于浏览器控制的 Chrome 扩展程序

使用内置安装程序，然后在 Chrome 中加载未打包的扩展程序：

```bash
openclaw browser extension install
openclaw browser extension path
```

然后 Chrome → `chrome://extensions` → 启用"开发者模式" → "加载已解压的扩展程序" → 选择该文件夹。

完整指南（包括远程 Gateway + 安全说明）：[Chrome 扩展程序](/tools/chrome-extension)

如果 Gateway 与 Chrome 在同一台机器上运行（默认设置），通常**不需要**额外操作。
如果 Gateway 在其他地方运行，在浏览器机器上运行节点主机，以便 Gateway 可以代理浏览器操作。
您仍然需要在要控制的选项卡上单击扩展程序按钮（它不会自动附加）。

## 沙箱和内存

### 有专门的沙箱文档吗

有。参阅[沙箱](/gateway/sandboxing)。对于 Docker 特定设置（Docker 中的完整 Gateway 或沙箱镜像），参阅 [Docker](/install/docker)。

### Docker 感觉受限。如何启用完整功能

默认镜像优先考虑安全性，以 `node` 用户运行，因此不包含系统包、Homebrew 或捆绑浏览器。对于更完整的设置：

- 使用 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，以便缓存在重启后存活。
- 使用 `OPENCLAW_DOCKER_APT_PACKAGES` 将系统依赖项烘焙到镜像中。
- 通过捆绑的 CLI 安装 Playwright 浏览器：
  `node /app/node_modules/playwright-core/cli.js install chromium`
- 设置 `PLAYWRIGHT_BROWSERS_PATH` 并确保路径持久化。

文档：[Docker](/install/docker)、[浏览器](/tools/browser)。

**可以让私信保持个人性但让群组使用带一个代理的公共沙箱吗**

可以——如果您的私人流量是**私信**，您的公共流量是**群组**。

使用 `agents.defaults.sandbox.mode: "non-main"` 以便群组/频道会话（非主键）在 Docker 中运行，而主私信会话保留在主机上。然后通过 `tools.sandbox.tools` 限制沙箱会话中可用的工具。

设置演练 + 示例配置：[群组：个人私信 + 公共群组](/channels/groups#pattern-personal-dms-public-groups-single-agent)

关键配置参考：[Gateway 配置](/gateway/configuration#agentsdefaultssandbox)

### 如何将主机文件夹绑定到沙箱中

将 `agents.defaults.sandbox.docker.binds` 设置为 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全局 + 每个代理的绑定合并；当 `scope: "shared"` 时忽略每个代理的绑定。对敏感内容使用 `:ro`，并记住绑定会绕过沙箱文件系统墙。参阅[沙箱](/gateway/sandboxing#custom-bind-mounts)和[沙箱与工具策略与提升](/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)获取示例和安全说明。

### 内存如何工作

OpenClaw 内存只是代理工作区中的 Markdown 文件：

- `memory/YYYY-MM-DD.md` 中的每日笔记
- `MEMORY.md` 中的精选长期笔记（仅主/私密会话）

OpenClaw 还运行**静默预压缩内存刷新**，以提醒模型在自动压缩之前写入持久笔记。这仅在工作区可写时运行（只读沙箱会跳过它）。参阅[内存](/concepts/memory)。

### 内存一直忘事。如何让它记住

让机器人**将事实写入内存**。长期笔记属于 `MEMORY.md`，短期上下文进入 `memory/YYYY-MM-DD.md`。

这仍然是我们正在改进的领域。提醒模型存储记忆会有帮助；它会知道该怎么做。如果它持续忘记，请验证 Gateway 在每次运行时使用相同的工作区。

文档：[内存](/concepts/memory)、[代理工作区](/concepts/agent-workspace)。

### 语义内存搜索需要 OpenAI API 密钥吗

仅在使用 **OpenAI 嵌入**时需要。Codex OAuth 涵盖聊天/补全，**不**授予嵌入访问权限，因此**使用 Codex 登录（OAuth 或 Codex CLI 登录）**对语义内存搜索没有帮助。OpenAI 嵌入仍然需要真实的 API 密钥（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

如果您没有明确设置提供商，OpenClaw 在能够解析 API 密钥时会自动选择提供商（认证配置、`models.providers.*.apiKey` 或环境变量）。如果 OpenAI 密钥解析，它首选 OpenAI；否则如果 Gemini 密钥解析则首选 Gemini，然后是 Voyage，然后是 Mistral。如果没有远程密钥可用，内存搜索将保持禁用，直到您配置它。如果您配置了本地模型路径并且路径存在，OpenClaw 首选 `local`。

如果您宁愿保持本地，设置 `memorySearch.provider = "local"`（以及可选的 `memorySearch.fallback = "none"`）。如果您想要 Gemini 嵌入，设置 `memorySearch.provider = "gemini"` 并提供 `GEMINI_API_KEY`（或 `memorySearch.remote.apiKey`）。我们支持 **OpenAI、Gemini、Voyage、Mistral 或本地**嵌入模型——参阅[内存](/concepts/memory)了解设置详情。

### 内存会永久保存吗？有什么限制

内存文件驻留在磁盘上，直到您删除它们才会持久。限制是您的存储，而不是模型。**会话上下文**仍然受模型上下文窗口限制，因此长对话可能会压缩或截断。这就是内存搜索存在的原因——它只将相关部分拉回上下文。

文档：[内存](/concepts/memory)、[上下文](/concepts/context)。

## 数据存储位置

### OpenClaw 使用的所有数据都保存在本地吗

不是——**OpenClaw 的状态是本地的**，但**外部服务仍然会看到您发送给它们的内容**。

- **默认本地：** 会话、内存文件、配置和工作区驻留在 Gateway 主机上（`~/.openclaw` + 您的工作区目录）。
- **必要时远程：** 您发送给模型提供商（Anthropic/OpenAI/等）的消息会进入它们的 API，聊天平台（WhatsApp/Telegram/Slack/等）在其服务器上存储消息数据。
- **您控制足迹：** 使用本地模型将提示保留在您的机器上，但通道流量仍然通过通道服务器传输。

相关：[代理工作区](/concepts/agent-workspace)、[内存](/concepts/memory)。

### OpenClaw 将数据存储在哪里

所有内容都位于 `$OPENCLAW_STATE_DIR` 下（默认：`~/.openclaw`）：

| 路径                                                            | 用途                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------ |
| `$OPENCLAW_STATE_DIR/openclaw.json`                             | 主配置（JSON5）                                                     |
| `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 旧版 OAuth 导入（首次使用时复制到认证配置）                           |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 认证配置（OAuth、API 密钥和可选的 `keyRef`/`tokenRef`）             |
| `$OPENCLAW_STATE_DIR/secrets.json`                              | 用于 `file` SecretRef 提供商的可选文件支持的密钥负载                  |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 旧版兼容性文件（静态 `api_key` 条目已清除）                           |
| `$OPENCLAW_STATE_DIR/credentials/`                              | 提供商状态（例如 `whatsapp/<accountId>/creds.json`）                |
| `$OPENCLAW_STATE_DIR/agents/`                                   | 每个代理的状态（agentDir + 会话）                                    |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 对话历史和状态（每个代理）                                            |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 会话元数据（每个代理）                                               |

旧版单代理路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）。

您的**工作区**（AGENTS.md、内存文件、技能等）是独立的，通过 `agents.defaults.workspace` 配置（默认：`~/.openclaw/workspace`）。

### AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里

这些文件位于**代理工作区**，而不是 `~/.openclaw`。

- **工作区（每个代理）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`（或 `memory.md`）、`memory/YYYY-MM-DD.md`、可选的 `HEARTBEAT.md`。
- **状态目录（`~/.openclaw`）**：配置、凭据、认证配置、会话、日志和共享技能（`~/.openclaw/skills`）。

默认工作区是 `~/.openclaw/workspace`，可通过以下方式配置：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

如果机器人在重启后"忘记"，请确认 Gateway 在每次启动时使用相同的工作区（记住：远程模式使用 **Gateway 主机的**工作区，而不是您的本地笔记本）。

提示：如果您想要持久的行为或偏好，让机器人**将其写入 AGENTS.md 或 MEMORY.md**，而不是依赖聊天历史。

参阅[代理工作区](/concepts/agent-workspace)和[内存](/concepts/memory)。

### 推荐的备份策略是什么

将您的**代理工作区**放入**私有** git 仓库并在某个私有地方备份（例如 GitHub 私有）。这会捕获内存 + AGENTS/SOUL/USER 文件，并让您以后恢复助手的"思维"。

**不要**提交 `~/.openclaw` 下的任何内容（凭据、会话、令牌或加密密钥负载）。
如果您需要完全恢复，请分别备份工作区和状态目录（参见上面的迁移问题）。

文档：[代理工作区](/concepts/agent-workspace)。

### 如何完全卸载 OpenClaw

参阅专门指南：[卸载](/install/uninstall)。

### 代理可以在工作区之外工作吗

可以。工作区是**默认 cwd** 和内存锚点，不是硬性沙箱。相对路径在工作区内解析，但绝对路径可以访问其他主机位置，除非启用了沙箱。如果您需要隔离，请使用 [`agents.defaults.sandbox`](/gateway/sandboxing) 或每个代理的沙箱设置。如果您希望仓库成为默认工作目录，将该代理的 `workspace` 指向仓库根目录。OpenClaw 仓库只是源代码；除非您有意让代理在其中工作，否则请将工作区分开。

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

### 我在远程模式下——会话存储在哪里

会话状态由 **Gateway 主机**拥有。如果您处于远程模式，您关心的会话存储在远程机器上，而不是您的本地笔记本上。参阅[会话管理](/concepts/session)。

## 配置基础

### 配置文件是什么格式的，在哪里

OpenClaw 从 `$OPENCLAW_CONFIG_PATH`（默认：`~/.openclaw/openclaw.json`）读取可选的 **JSON5** 配置：

```
$OPENCLAW_CONFIG_PATH
```

如果文件缺失，它使用安全的默认值（包括 `~/.openclaw/workspace` 的默认工作区）。

### 我设置了 gateway.bind: "lan"（或 "tailnet"），但现在什么都不监听/UI 显示未授权

非环回绑定**需要认证**。配置 `gateway.auth.mode` + `gateway.auth.token`（或使用 `OPENCLAW_GATEWAY_TOKEN`）。

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

注意：

- `gateway.remote.token` / `.password` 本身**不会**启用本地 Gateway 认证。
- 当 `gateway.auth.*` 未设置时，本地调用路径可以使用 `gateway.remote.*` 作为回退。
- 控制 UI 通过 `connect.params.auth.token`（存储在应用/UI 设置中）进行身份验证。避免在 URL 中放置令牌。

### 为什么现在在 localhost 上需要令牌

OpenClaw 默认强制令牌认证，包括环回。如果没有配置令牌，Gateway 启动时会自动生成一个并保存到 `gateway.auth.token`，因此**本地 WS 客户端必须进行身份验证**。这会阻止其他本地进程调用 Gateway。

如果您**真的**想要开放环回，请在您的配置中显式设置 `gateway.auth.mode: "none"`。Doctor 可以随时为您生成令牌：`openclaw doctor --generate-gateway-token`。

### 更改配置后需要重启吗

Gateway 监视配置并支持热重载：

- `gateway.reload.mode: "hybrid"`（默认）：热应用安全更改，对于关键更改重启
- 也支持 `hot`、`restart`、`off`

### 如何启用网络搜索（和网络抓取）

`web_fetch` 无需 API 密钥即可工作。`web_search` 需要 Brave Search API 密钥。**推荐：** 运行 `openclaw configure --section web` 将其存储在 `tools.web.search.apiKey` 中。环境替代方案：为 Gateway 进程设置 `BRAVE_API_KEY`。

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "BRAVE_API_KEY_HERE",
        maxResults: 5,
      },
      fetch: {
        enabled: true,
      },
    },
  },
}
```

注意：

- 如果您使用允许列表，请添加 `web_search`/`web_fetch` 或 `group:web`。
- `web_fetch` 默认启用（除非显式禁用）。
- 守护进程从 `~/.openclaw/.env`（或服务环境）读取环境变量。

文档：[Web 工具](/tools/web)。

### 如何在设备间运行带有专业工作节点的中央 Gateway

常见模式是**一个 Gateway**（例如 Raspberry Pi）加上**节点**和**代理**：

- **Gateway（中央）：** 拥有通道（Signal/WhatsApp）、路由和会话。
- **节点（设备）：** Mac/iOS/Android 作为外设连接，公开本地工具（`system.run`、`canvas`、`camera`）。
- **代理（工作者）：** 用于特殊角色的独立大脑/工作区（例如"Hetzner ops"、"个人数据"）。
- **子代理：** 当您需要并行性时，从主代理生成后台工作。
- **TUI：** 连接到 Gateway 并切换代理/会话。

文档：[节点](/nodes)、[远程访问](/gateway/remote)、[多代理路由](/concepts/multi-agent)、[子代理](/tools/subagents)、[TUI](/web/tui)。

### OpenClaw 浏览器可以无头运行吗

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

默认是 `false`（有头）。无头更可能在某些网站上触发反机器人检查。参阅[浏览器](/tools/browser)。

无头使用**相同的 Chromium 引擎**，适用于大多数自动化（表单、点击、抓取、登录）。主要区别：

- 没有可见的浏览器窗口（如果需要视觉效果，请使用截图）。
- 某些网站对无头模式下的自动化更为严格（CAPTCHA、反机器人）。例如，X/Twitter 经常阻止无头会话。

### 如何使用 Brave 进行浏览器控制

将 `browser.executablePath` 设置为您的 Brave 二进制文件（或任何基于 Chromium 的浏览器）并重启 Gateway。
参阅[浏览器](/tools/browser#use-brave-or-another-chromium-based-browser)中的完整配置示例。

## 远程 Gateway 和节点

### 命令如何在 Telegram、Gateway 和节点之间传播

Telegram 消息由 **Gateway** 处理。Gateway 运行代理，只有当需要节点工具时，才通过 **Gateway WebSocket** 调用节点：

Telegram → Gateway → 代理 → `node.*` → 节点 → Gateway → Telegram

节点看不到入站提供商流量；它们只接收节点 RPC 调用。

### 如果 Gateway 托管在远程，我的代理如何访问我的计算机

简短答案：**将您的计算机配对为节点**。Gateway 在其他地方运行，但它可以通过 Gateway WebSocket 在您的本地机器上调用 `node.*` 工具（屏幕、摄像头、系统）。

典型设置：

1. 在始终开机的主机上运行 Gateway（VPS/家庭服务器）。
2. 将 Gateway 主机 + 您的计算机放在同一个 tailnet 上。
3. 确保 Gateway WS 可达（tailnet 绑定或 SSH 隧道）。
4. 在本地打开 macOS 应用并以**SSH 远程**模式（或直接 tailnet）连接，以便它可以注册为节点。
5. 在 Gateway 上批准节点：

   ```bash
   openclaw devices list
   openclaw devices approve <requestId>
   ```

不需要单独的 TCP 桥；节点通过 Gateway WebSocket 连接。

安全提醒：配对 macOS 节点允许在该机器上使用 `system.run`。只配对您信任的设备，并查阅[安全性](/gateway/security)。

文档：[节点](/nodes)、[Gateway 协议](/gateway/protocol)、[macOS 远程模式](/platforms/mac/remote)、[安全性](/gateway/security)。

### Tailscale 已连接，但没有收到回复。怎么办

检查基础：

- Gateway 正在运行：`openclaw gateway status`
- Gateway 健康：`openclaw status`
- 通道健康：`openclaw channels status`

然后验证认证和路由：

- 如果您使用 Tailscale Serve，确保 `gateway.auth.allowTailscale` 设置正确。
- 如果您通过 SSH 隧道连接，确认本地隧道已建立并指向正确的端口。
- 确认您的允许列表（私信或群组）包含您的账户。

文档：[Tailscale](/gateway/tailscale)、[远程访问](/gateway/remote)、[通道](/channels)。

### 两个 OpenClaw 实例可以互相通信吗（本地 + VPS）

可以。没有内置的"机器人对机器人"桥接，但您可以通过几种可靠的方式连接它们：

**最简单：** 使用两个机器人都可以访问的普通聊天通道（Telegram/Slack/WhatsApp）。让机器人 A 向机器人 B 发送消息，然后让机器人 B 照常回复。

**CLI 桥接（通用）：** 运行一个脚本，使用 `openclaw agent --message ... --deliver` 调用另一个 Gateway，目标是另一个机器人监听的聊天。如果一个机器人在远程 VPS 上，通过 SSH/Tailscale 将 CLI 指向该远程 Gateway（参阅[远程访问](/gateway/remote)）。

示例模式（从可以访问目标 Gateway 的机器运行）：

```bash
openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
```

提示：添加护栏以防止两个机器人无限循环（仅提及、通道允许列表或"不回复机器人消息"规则）。

文档：[远程访问](/gateway/remote)、[代理 CLI](/cli/agent)、[代理发送](/tools/agent-send)。

### 多个代理需要单独的 VPS 吗

不需要。一个 Gateway 可以托管多个代理，每个代理都有自己的工作区、模型默认值和路由。这是正常的设���，比每个代理运行一个 VPS 便宜和简单得多。

只有在需要硬性隔离（安全边界）或您不想共享的非常不同配置时，才使用单独的 VPS。否则，保留一个 Gateway 并使用多个代理或子代理。

### 在个人笔记本上使用节点与从 VPS SSH 相比有什么好处

有——节点是从远程 Gateway 访问您笔记本的一流方式，它们解锁的功能比 shell 访问更多。Gateway 在 macOS/Linux（Windows 通过 WSL2）上运行，是轻量级的（小型 VPS 或 Raspberry Pi 级别的设备就可以；4GB RAM 足够了），因此常见的设置是一个始终开机的主机加上您的笔记本作为节点。

- **不需要入站 SSH。** 节点向外连接到 Gateway WebSocket 并使用设备配对。
- **更安全的执行控制。** `system.run` 由该笔记本上的节点允许列表/批准控制。
- **更多设备工具。** 节点除了 `system.run` 外还公开 `canvas`、`camera` 和 `screen`。
- **本地浏览器自动化。** 将 Gateway 保留在 VPS 上，但使用 Chrome 扩展程序 + 笔记本上的节点主机在本地运行 Chrome 并中继控制。

SSH 适用于临时 shell 访问，但节点对于持续的代理工作流和设备自动化来说更简单。

文档：[节点](/nodes)、[节点 CLI](/cli/nodes)、[Chrome 扩展程序](/tools/chrome-extension)。

### 应该在第二台笔记本上安装还是只添加一个节点

如果您只需要第二台笔记本上的**本地工具**（屏幕/摄像头/执行），将其添加为**节点**。这保持了单个 Gateway 并避免了重复配置。本地节点工具目前仅限 macOS，但我们计划扩展到其他操作系统。

只有当您需要**硬性隔离**或两个完全独立的机器人时，才安装第二个 Gateway。

文档：[节点](/nodes)、[节点 CLI](/cli/nodes)、[多个 Gateway](/gateway/multiple-gateways)。

### 节点运行 Gateway 服务吗

不。每个主机只应该运行**一个 Gateway**，除非您有意运行隔离的配置文件（参阅[多个 Gateway](/gateway/multiple-gateways)）。节点是连接到 Gateway 的外设（iOS/Android 节点，或 macOS 菜单栏应用中的"节点模式"）。对于无头节点主机和 CLI 控制，参阅[节点主机 CLI](/cli/node)。

对于 `gateway`、`discovery` 和 `canvasHost` 更改，需要完全重启。

### 有 API/RPC 方式来应用配置吗

有。`config.apply` 验证 + 写入完整配置，并在操作过程中重启 Gateway。

### config.apply 清除了我的配置。如何恢复并避免这种情况

`config.apply` 替换**整个配置**。如果您发送部分对象，其他所有内容都会被删除。

恢复：

- 从备份恢复（git 或复制的 `~/.openclaw/openclaw.json`）。
- 如果没有备份，重新运行 `openclaw doctor` 并重新配置通道/模型。
- 如果这是意外的，请提交 Bug 报告并包含您最后已知的配置或任何备份。
- 本地编码代理通常可以从日志或历史记录中重建工作配置。

避免：

- 使用 `openclaw config set` 进行小更改。
- 使用 `openclaw configure` 进行交互式编辑。

文档：[配置](/cli/config)、[Configure](/cli/configure)、[Doctor](/gateway/doctor)。

### 首次安装的最小"合理"配置是什么

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

这设置了您的工作区并限制谁可以触发机器人。

### 如何在 VPS 上设置 Tailscale 并从 Mac 连接

最小步骤：

1. **在 VPS 上安装 + 登录**

   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```

2. **在 Mac 上安装 + 登录**
   - 使用 Tailscale 应用并登录到同一 tailnet。
3. **启用 MagicDNS（推荐）**
   - 在 Tailscale 管理控制台中，启用 MagicDNS，以便 VPS 有稳定的名称。
4. **使用 tailnet 主机名**
   - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
   - Gateway WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

如果您想在不使用 SSH 的情况下访问控制 UI，请在 VPS 上使用 Tailscale Serve：

```bash
openclaw gateway --tailscale serve
```

这将 Gateway 绑定到环回并通过 Tailscale 公开 HTTPS。参阅 [Tailscale](/gateway/tailscale)。

### 如何将 Mac 节点连接到远程 Gateway（Tailscale Serve）

Serve 公开 **Gateway 控制 UI + WS**。节点通过相同的 Gateway WS 端点连接。

推荐设置：

1. **确保 VPS + Mac 在同一 tailnet 上**。
2. **在远程模式下使用 macOS 应用**（SSH 目标可以是 tailnet 主机名）。应用将隧道 Gateway 端口并作为节点连接。
3. **在 Gateway 上批准节点**：

   ```bash
   openclaw devices list
   openclaw devices approve <requestId>
   ```

文档：[Gateway 协议](/gateway/protocol)、[Discovery](/gateway/discovery)、[macOS 远程模式](/platforms/mac/remote)。

## 环境变量和 .env 加载

### OpenClaw 如何加载环境变量

OpenClaw 从父进程（shell、launchd/systemd、CI 等）读取环境变量，并额外加载：

- 当前工作目录中的 `.env`
- `~/.openclaw/.env`（又名 `$OPENCLAW_STATE_DIR/.env`）中的全局回退 `.env`

两个 `.env` 文件都不会覆盖现有的环境变量。

您也可以在配置中定义内联环境变量（仅在进程环境中缺失时应用）：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

参阅 [/environment](/help/environment) 了解完整的优先级和来源。

### 我通过服务启动了 Gateway，我的环境变量消失了。怎么办

两个常见修复方法：

1. 将缺失的密钥放在 `~/.openclaw/.env` 中，这样即使服务没有继承您的 shell 环境，它们也能被拾取。
2. 启用 shell 导入（选择加入便利功能）：

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

这会运行您的登录 shell 并仅导入缺失的预期密钥（从不覆盖）。环境变量等效：
`OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

### 我设置了 COPILOT_GITHUB_TOKEN，但模型状态显示"Shell env: off"。为什么

`openclaw models status` 报告**shell 环境导入**是否已启用。"Shell env: off"**不**意味着您的环境变量缺失——它只是意味着 OpenClaw 不会自动加载您的登录 shell。

如果 Gateway 作为服务（launchd/systemd）运行，它不会继承您的 shell 环境。通过以下方法之一修复：

1. 将令牌放在 `~/.openclaw/.env` 中：

   ```
   COPILOT_GITHUB_TOKEN=...
   ```

2. 或启用 shell 导入（`env.shellEnv.enabled: true`）。
3. 或将其添加到您的配置 `env` 块（仅在缺失时应用）。

然后重启 Gateway 并重新检查：

```bash
openclaw models status
```

Copilot 令牌从 `COPILOT_GITHUB_TOKEN`（也支持 `GH_TOKEN` / `GITHUB_TOKEN`）读取。
参阅 [/concepts/model-providers](/concepts/model-providers) 和 [/environment](/help/environment)。

## 会话和多聊天

### 如何开始新对话

作为独立消息发送 `/new` 或 `/reset`。参阅[会话管理](/concepts/session)。

### 如果我从不发送 `/new`，会话会自动重置吗

是的。会话在 `session.idleMinutes` 后过期（默认 **60**）。**下一条**消息为该聊天键启动一个新的会话 ID。这不会删除转录——它只是启动一个新会话。

```json5
{
  session: {
    idleMinutes: 240,
  },
}
```

### 有没有办法创建一支 OpenClaw 实例团队——一个 CEO 和多个代理

有，通过**多代理路由**和**子代理**。您可以创建一个协调代理和几个具有自己工作区和模型的工作代理。

不过，这最好被视为**有趣的实验**。它令牌消耗大，通常比使用一个有独立会话进行并行工作的机器人效率低。我们设想的典型模式是您与一个机器人交谈，并为并行工作使用不同的会话。该机器人也可以在需要时生成子代理。

文档：[多代理路由](/concepts/multi-agent)、[子代理](/tools/subagents)、[代理 CLI](/cli/agents)。

### 为什么上下文在任务中途被截断？如何防止

会话上下文受模型窗口限制。长时间聊天、大型工具输出或许多文件可能会触发压缩或截断。

有帮助的做法：

- 让机器人总结当前状态并将其写入文件。
- 在长任务之前使用 `/compact`，切换主题时使用 `/new`。
- 将重要上下文保留在工作区中，并让机器人重新读取它。
- 对长时间或并行工作使用子代理，以保持主聊天较小。
- 如果经常发生这种情况，选择具有更大上下文窗口的模型。

### 如何完全重置 OpenClaw 但保持安装

使用重置命令：

```bash
openclaw reset
```

非交互式完全重置：

```bash
openclaw reset --scope full --yes --non-interactive
```

然后重新运行引导：

```bash
openclaw onboard --install-daemon
```

注意：

- 如果引导向导看到现有配置，也会提供**重置**。参阅[向导](/start/wizard)。
- 如果您使用了配置文件（`--profile` / `OPENCLAW_PROFILE`），请重置每个状态目录（默认为 `~/.openclaw-<profile>`）。
- 开发重置：`openclaw gateway --dev --reset`（仅限开发；清除开发配置 + 凭据 + 会话 + 工作区）。

### 收到"上下文太大"错误——如何重置或压缩

使用其中一种：

- **压缩**（保留对话但总结较早的轮次）：

  ```
  /compact
  ```

  或 `/compact <instructions>` 来引导摘要。

- **重置**（为同一聊天键启动新的会话 ID）：

  ```
  /new
  /reset
  ```

如果持续发生：

- 启用或调整**会话修剪**（`agents.defaults.contextPruning`）以修剪旧工具输出。
- 使用具有更大上下文窗口的模型。

文档��[压缩](/concepts/compaction)、[会话修剪](/concepts/session-pruning)、[会话管理](/concepts/session)。

### 为什么看到"LLM 请求被拒绝：messages.content.tool_use.input 字段必填"？

这是一个提供商验证错误：模型发出了没有必需的 `input` 的 `tool_use` 块。这通常意味着会话历史记录过期或损坏（通常在长线程或工具/架构更改之后）。

修复：以 `/new`（独立消息）开始新会话。

### 为什么每 30 分钟收到一次心跳消息

心跳默认每 **30 分钟**运行一次。调整或禁用它们：

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

如果 `HEARTBEAT.md` 存在但实际上为空（只有空行和 Markdown 标题如 `# Heading`），OpenClaw 会跳过心跳运行以节省 API 调用。
如果文件缺失，心跳仍会运行，模型决定做什么。

每个代理的覆盖使用 `agents.list[].heartbeat`。文档：[心跳](/gateway/heartbeat)。

### 需要在 WhatsApp 群组中添加"机器人账户"吗

不需要。OpenClaw 在**您自己的账户**上运行，所以如果您在群组中，OpenClaw 可以看到它。
默认情况下，群组回复被阻止，直到您允许发送者（`groupPolicy: "allowlist"`）。

如果您只想**您**能触发群组回复：

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

### 如何获取 WhatsApp 群组的 JID

选项 1（最快）：跟踪日志并在群组中发送测试消息：

```bash
openclaw logs --follow --json
```

查找以 `@g.us` 结尾的 `chatId`（或 `from`），如：
`1234567890-1234567890@g.us`。

选项 2（如果已配置/白名单）：从配置中列出群组：

```bash
openclaw directory groups list --channel whatsapp
```

文档：[WhatsApp](/channels/whatsapp)、[目录](/cli/directory)、[日志](/cli/logs)。

### 为什么 OpenClaw 不在群组中回复

两个常见原因：

- 提及门控已开启（默认）。您必须 @提及机器人（或匹配 `mentionPatterns`）。
- 您配置了 `channels.whatsapp.groups` 而没有 `"*"`，且该群���未在白名单中。

参阅[群组](/channels/groups)和[群组消息](/channels/group-messages)。

### 群组/线程与私信共享上下文吗

私信默认折叠到主会话。群组/频道有自己的会话键，Telegram 话题/Discord 线程是独立的会话。参阅[群组](/channels/groups)和[群组消息](/channels/group-messages)。

### 可以创建多少个工作区和代理

没有硬性限制。数十个（甚至数百个）都可以，但注意：

- **磁盘增长：** 会话 + 转录位于 `~/.openclaw/agents/<agentId>/sessions/`。
- **令牌成本：** 更多代理意味着更多并发模型使用。
- **运营开销：** 每个代理的认证配置、工作区和通道路由。

提示：

- 每个代理保留一个**活跃**工作区（`agents.defaults.workspace`）。
- 如果磁盘增长，修剪旧会话（删除 JSONL 或存储条目）。
- 使用 `openclaw doctor` 发现迷失的工作区和配置文件不匹配。

### 可以同时运行多个机器人或聊天吗（Slack），如何设置

可以。使用**多代理路由**运行多个隔离代理，并按通道/账户/peer 路由入站消息。Slack 作为通道受支持，可以绑定到特定代理。

浏览器访问功能强大，但不是"做人类能做的任何事"——反机器人、CAPTCHA 和 MFA 仍然可以阻止自动化。对于最可靠的浏览器控制，请在运行浏览器的机器上使用 Chrome 扩展程序中继（并将 Gateway 放在任何地方）。

最佳实践设置：

- 始终开机的 Gateway 主机（VPS/Mac mini）。
- 每个角色一个代理（绑定）。
- 绑定到这些代理的 Slack 通道。
- 需要时通过扩展程序中继（或节点）使用本地浏览器。

文档：[多代理路由](/concepts/multi-agent)、[Slack](/channels/slack)、[浏览器](/tools/browser)、[Chrome 扩展程序](/tools/chrome-extension)、[节点](/nodes)。

## 模型：默认、选择、别名、切换

### 什么是"默认模型"

OpenClaw 的默认模型是您设置的：

```
agents.defaults.model.primary
```

模型以 `provider/model` 格式引用（示例：`anthropic/claude-opus-4-6`）。如果省略提供商，OpenClaw 目前假设 `anthropic` 作为临时弃用回退——但您仍应**明确**设置 `provider/model`。

### 您推荐什么模型

**推荐默认值：** `anthropic/claude-opus-4-6`。
**好的替代方案：** `anthropic/claude-sonnet-4-5`。
**可靠（性格少些）：** `openai/gpt-5.2`——几乎与 Opus 一样好，只是性格少些。
**预算：** `zai/glm-4.7`。

MiniMax M2.1 有自己的文档：[MiniMax](/providers/minimax) 和[本地模型](/gateway/local-models)。

经验法则：对于高风险工作使用**您能负担得起的最佳模型**，对于日常聊天或摘要使用更便宜的模型。您可以按代理路由模型，并使用子代理并行化长任务（每个子代理消耗令牌）。参阅[模型](/concepts/models)和[子代理](/tools/subagents)。

强烈警告：较弱/过度量化的模型更容易受到提示注入和不安全行为的影响。参阅[安全性](/gateway/security)。

更多背景：[模型](/concepts/models)。

### 可以使用自托管模型（llama.cpp、vLLM、Ollama）吗

可以。如果您的本地服务器公开了兼容 OpenAI 的 API，您可以将自定义提供商指向它。Ollama 直接支持且是最简单的路径。

安全说明：较小或大量量化的模型更容易受到提示注入的影响。我们强烈建议为任何可以使用工具的机器人使用**大型模型**。如果您仍然想使用小型模型，请启用沙箱和严格的工具允许列表。

文档：[Ollama](/providers/ollama)、[本地模型](/gateway/local-models)、[模型提供商](/concepts/model-providers)、[安全性](/gateway/security)、[沙箱](/gateway/sandboxing)。

### 如何在不清除配置的情况下切换模型

使用**模型命令**或仅编辑**模型**字段。避免完整配置替换。

安全选项：

- 聊天中的 `/model`（快速，每会话）
- `openclaw models set ...`（仅更新模型配置）
- `openclaw configure --section model`（交互式）
- 在 `~/.openclaw/openclaw.json` 中编辑 `agents.defaults.model`

避免使用部分对象的 `config.apply`，除非您打算替换整个配置。如果您确实覆盖了配置，请从备份恢复或重新运行 `openclaw doctor` 进行修复。

文档：[模型](/concepts/models)、[Configure](/cli/configure)、[配置](/cli/config)、[Doctor](/gateway/doctor)。

### OpenClaw、Flawd 和 Krill 使用什么模型

- **OpenClaw + Flawd：** Anthropic Opus（`anthropic/claude-opus-4-6`）——参阅 [Anthropic](/providers/anthropic)。
- **Krill：** MiniMax M2.1（`minimax/MiniMax-M2.1`）——参阅 [MiniMax](/providers/minimax)。

### 如何即时切换模型（无需重启）

使用 `/model` 命令作为独立消息：

```
/model sonnet
/model haiku
/model opus
/model gpt
/model gpt-mini
/model gemini
/model gemini-flash
```

您可以用 `/model`、`/model list` 或 `/model status` 列出可用模型。

`/model`（和 `/model list`）显示紧凑的编号选择器。按编号选择：

```
/model 3
```

您也可以为提供商强制使用特定的认证配置（每会话）：

```
/model opus@anthropic:default
/model opus@anthropic:work
```

提示：`/model status` 显示哪个代理处于活跃状态、使用哪个 `auth-profiles.json` 文件，以及接下来会尝试哪个认证配置。
它还会显示已配置的提供商端点（`baseUrl`）和 API 模式（`api`）（当可用时）。

**如何取消我使用 profile 设置的固定**

重新运行 `/model` **不带** `@profile` 后缀：

```
/model anthropic/claude-opus-4-6
```

如果您想返回默认值，从 `/model` 中选择它（或发送 `/model <default provider/model>`）。
使用 `/model status` 确认哪个认证配置处于活跃状态。

### 可以将 GPT 5.2 用于日常任务，将 Codex 5.3 用于编码吗

可以。设置一个为默认值，按需切换：

- **快速切换（每会话）：** `/model gpt-5.2` 用于日常任务，`/model gpt-5.3-codex` 用于编码。
- **默认 + 切换：** 将 `agents.defaults.model.primary` 设置为 `openai/gpt-5.2`，然后在编码时切换到 `openai-codex/gpt-5.3-codex`（或反之）。
- **子代理：** 将编码任务路由到具有不同默认模型的子代理。

参阅[模型](/concepts/models)和[斜杠命令](/tools/slash-commands)。

### 为什么看到"模型 … 不被允许"然后没有回复

如果设置了 `agents.defaults.models`，它会成为 `/model` 和任何会话覆盖的**允许列表**。选择不在该列表中的模型会返回：

```
Model "provider/model" is not allowed. Use /model to list available models.
```

该错误**代替**正常回复返回。修复：将模型添加到 `agents.defaults.models`，删除允许列表，或从 `/model list` 中选择模型。

### 为什么看到"未知模型：minimax/MiniMax-M2.1"

这意味着**提供商未配置**（找不到 MiniMax 提供商配置或认证配置），因此无法解析模型。此检测的修复在 **2026.1.12** 中（写作时尚未发布）。

修复清单：

1. 升级到 **2026.1.12**（或从源代码 `main` 运行），然后重启 Gateway。
2. 确保 MiniMax 已配置（向导或 JSON），或者环境/认证配置中存在 MiniMax API 密钥，以便可以注入提供商。
3. 使用准确的模型 ID（区分大小写）：`minimax/MiniMax-M2.1` 或 `minimax/MiniMax-M2.1-lightning`。
4. 运行：

   ```bash
   openclaw models list
   ```

   并从列表中选择（或在聊天中使用 `/model list`）。

参阅 [MiniMax](/providers/minimax) 和[模型](/concepts/models)。

### 可以将 MiniMax 作为默认值，将 OpenAI 用于复杂任务吗

可以。将 **MiniMax 作为默认值**，在需要时**按会话**切换模型。
备用是针对**错误**的，不是"困难任务"，所以请使用 `/model` 或独立的代理。

**选项 A：按会话切换**

```json5
{
  env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.1" },
      models: {
        "minimax/MiniMax-M2.1": { alias: "minimax" },
        "openai/gpt-5.2": { alias: "gpt" },
      },
    },
  },
}
```

然后：

```
/model gpt
```

**选项 B：独立代理**

- 代理 A 默认：MiniMax
- 代理 B 默认：OpenAI
- 按代理路由或使用 `/agent` 切换

文档：[模型](/concepts/models)、[多代理路由](/concepts/multi-agent)、[MiniMax](/providers/minimax)、[OpenAI](/providers/openai)。

### opus / sonnet / gpt 是内置快捷方式吗

是的。OpenClaw 提供了一些默认简写（仅在 `agents.defaults.models` 中存在该模型时应用）：

- `opus` → `anthropic/claude-opus-4-6`
- `sonnet` → `anthropic/claude-sonnet-4-5`
- `gpt` → `openai/gpt-5.2`
- `gpt-mini` → `openai/gpt-5-mini`
- `gemini` → `google/gemini-3-pro-preview`
- `gemini-flash` → `google/gemini-3-flash-preview`

如果您设置了具有相同名称的自己的别名，您的值优先。

### 如何定义/覆盖模型快捷方式（别名）

别名来自 `agents.defaults.models.<modelId>.alias`。示例：

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "anthropic/claude-sonnet-4-5": { alias: "sonnet" },
        "anthropic/claude-haiku-4-5": { alias: "haiku" },
      },
    },
  },
}
```

然后 `/model sonnet`（或支持时的 `/<alias>`）解析为该模型 ID。

### 如何从 OpenRouter 或 Z.AI 等其他提供商添加模型

OpenRouter（按令牌计费；许多模型）：

```json5
{
  agents: {
    defaults: {
      model: { primary: "openrouter/anthropic/claude-sonnet-4-5" },
      models: { "openrouter/anthropic/claude-sonnet-4-5": {} },
    },
  },
  env: { OPENROUTER_API_KEY: "sk-or-..." },
}
```

Z.AI（GLM 模型）：

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
  env: { ZAI_API_KEY: "..." },
}
```

如果您引用了 provider/model 但缺少所需的提供商密钥，您将收到运行时认证错误（例如 `No API key found for provider "zai"`）。

**添加新代理后找不到提供商的 API 密钥**

这通常意味着**新代理**有一个空的认证存储。认证是按代理的，存储在：

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

修复选项：

- 运行 `openclaw agents add <id>` 并在向导期间配置认证。
- 或将 `auth-profiles.json` 从主代理的 `agentDir` 复制到新代理的 `agentDir`。

**不要**在代理之间重用 `agentDir`；这会导致认证/会话冲突。

## 模型故障转移和"所有模型都失败了"

### 故障转移如何工作

故障转移分两个阶段发生：

1. 同一提供商内的**认证配置轮换**。
2. 到 `agents.defaults.model.fallbacks` 中下一个模型的**模型回退**。

冷却时间适用于失败的配置文件（指数退避），因此即使提供商受到速率限制或暂时失败，OpenClaw 也可以继续响应。

### 这个错误是什么意思

```
No credentials found for profile "anthropic:default"
```

这意味着系统尝试使用认证配置 ID `anthropic:default`，但在预期的认证存储中找不到其凭据。

### `No credentials found for profile "anthropic:default"` 的修复清单

- **确认认证配置的位置**（新路径与旧路径）
  - 当前：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 旧版：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）
- **确认您的环境变量由 Gateway 加载**
  - 如果您在 shell 中设置了 `ANTHROPIC_API_KEY`，但通过 systemd/launchd 运行 Gateway，它可能不会继承它。将其放在 `~/.openclaw/.env` 中或启用 `env.shellEnv`。
- **确保您正在编辑正确的代理**
  - 多代理设置意味着可能有多个 `auth-profiles.json` 文件。
- **健全性检查模型/认证状态**
  - 使用 `openclaw models status` 查看已配置的模型以及提供商是否已通过身份验证。

**`No credentials found for profile "anthropic"` 的修复清单**

这意味着运行被固定到 Anthropic 认证配置，但 Gateway 在其认证存储中找不到它。

- **使用 setup-token**
  - 运行 `claude setup-token`，然后使用 `openclaw models auth setup-token --provider anthropic` 粘贴它。
  - 如果令牌是在另一台机器上创建的，使用 `openclaw models auth paste-token --provider anthropic`。
- **如果您想使用 API 密钥**
  - 将 `ANTHROPIC_API_KEY` 放在 **Gateway 主机**上的 `~/.openclaw/.env` 中。
  - 清除任何强制使用缺失配置文件的固定顺序：

    ```bash
    openclaw models auth order clear --provider anthropic
    ```

- **确认您在 Gateway 主机上运行命令**
  - 在远程模式下，认证配置位于 Gateway 机器上，而不是您的笔记本上。

### 为什么它还尝试了 Google Gemini 并失败了

如果您的模型配置包含 Google Gemini 作为备用（或您切换到了 Gemini 简写），OpenClaw 将在模型回退期间尝试它。如果您没有配置 Google 凭据，您将看到 `No API key found for provider "google"`。

修复：要么提供 Google 认证，要么在 `agents.defaults.model.fallbacks` / 别名中删除/避免使用 Google 模型，以防回退路由到那里。

**LLM 请求被拒绝：消息思考签名必填（google antigravity）**

原因：会话历史包含**没有签名的思考块**（通常来自中断/部分流）。Google Antigravity 需要思考块的签名。

修复：OpenClaw 现在为 Google Antigravity Claude 去除未签名的思考块。如果仍然出现，请启动**新会话**或为该代理设置 `/thinking off`。

## 身份验证配置：是什么以及如何管理

相关：[/concepts/oauth](/concepts/oauth)（OAuth 流程、令牌存储、多账户模式）

### 什么是身份验证配置

认证配置是绑定到提供商的命名凭据记录（OAuth 或 API 密钥）。配置文件位于：

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

### 典型的配置 ID 有哪些

OpenClaw 使用提供商前缀的 ID，如：

- `anthropic:default`（没有电子邮件身份时常见）
- `anthropic:<email>` 用于 OAuth 身份
- 您选择的自定义 ID（例如 `anthropic:work`）

### 可以控制首先尝试哪个身份验证配置吗

可以。配置支持配置文件的可选元数据和每个提供商的排序（`auth.order.<provider>`）。这**不**存储密钥；它将 ID 映射到提供商/模式并设置轮换顺序。

如果认证配置处于短暂**冷却**状态（速率限制/超时/认证失败）或较长的**禁用**状态（计费/积分不足），OpenClaw 可能会暂时跳过该配置文件。要检查这一点，运行 `openclaw models status --json` 并检查 `auth.unusableProfiles`。调整：`auth.cooldowns.billingBackoffHours*`。

您也可以通过 CLI 设置**每个代理**的顺序覆盖（存储在该代理的 `auth-profiles.json` 中）：

```bash
# 默认为配置的默认代理（省略 --agent）
openclaw models auth order get --provider anthropic

# 将轮换锁定到单个配置文件（只尝试这一个）
openclaw models auth order set --provider anthropic anthropic:default

# 或设置显式顺序（提供商内的回退）
openclaw models auth order set --provider anthropic anthropic:work anthropic:default

# 清除覆盖（回退到配置 auth.order / 轮询）
openclaw models auth order clear --provider anthropic
```

要针对特定代理：

```bash
openclaw models auth order set --provider anthropic --agent main anthropic:default
```

### OAuth 与 API 密钥有什么区别

OpenClaw 两者都支持：

- **OAuth** 通常利用订阅访问（在适用的情况下）。
- **API 密钥**使用按令牌计费。

向导明确支持 Anthropic setup-token 和 OpenAI Codex OAuth，并可以为您存储 API 密钥。

## Gateway：端口、"已在运行"和远程模式

### Gateway 使用什么端口

`gateway.port` 控制用于 WebSocket + HTTP 的单一多路复用端口（控制 UI、钩子等）。

优先级：

```
--port > OPENCLAW_GATEWAY_PORT > gateway.port > 默认 18789
```

### 为什么 `openclaw gateway status` 显示 `Runtime: running` 但 `RPC probe: failed`

因为"运行中"是**监督器的**视图（launchd/systemd/schtasks）。RPC 探测是 CLI 实际连接到 Gateway WebSocket 并调用 `status`。

使用 `openclaw gateway status` 并信任这些行：

- `Probe target:`（探测实际使用的 URL）
- `Listening:`（端口上实际绑定的内容）
- `Last gateway error:`（当进程存活但端口未监听时的常见根本原因）

### 为什么 `openclaw gateway status` 显示 `Config (cli)` 和 `Config (service)` 不同

您正在编辑一个配置文件，而服务正在运行另一个（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不匹配）。

修复：

```bash
openclaw gateway install --force
```

从您希望服务使用的相同 `--profile` / 环境中运行该命令。

### "另一个 Gateway 实例已在监听"是什么意思

OpenClaw 通过在启动时立即绑定 WebSocket 监听器（默认 `ws://127.0.0.1:18789`）来强制运行时锁。如果绑定以 `EADDRINUSE` 失败，它抛出 `GatewayLockError`，表示另一个实例已在监听。

修复：停止另一个实例，释放端口，或使用 `openclaw gateway --port <port>` 运行。

### 如何以远程模式运行 OpenClaw（客户端连接到其他地方的 Gateway）

设置 `gateway.mode: "remote"` 并指向远程 WebSocket URL，可选带令牌/密码：

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

注意：

- 仅当 `gateway.mode` 为 `local` 时（或您传递了覆盖标志），`openclaw gateway` 才会启动。
- 当这些值更改时，macOS 应用会实时监视配置文件并切换模式。

### 控制 UI 显示"未授权"（或不断重新连接）。怎么办

您的 Gateway 正在运行启用认证（`gateway.auth.*`），但 UI 没有发送匹配的令牌/密码。

事实（来自代码）：

- 控制 UI 将令牌存储在浏览器 localStorage 键 `openclaw.control.settings.v1` 中。

修复：

- 最快：`openclaw dashboard`（打印 + 复制仪表板 URL，尝试打开；如果无头则显示 SSH 提示）。
- 如果您还没有令牌：`openclaw doctor --generate-gateway-token`。
- 如果是远程，先建立隧道：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`。
- 在 Gateway 主机上设置 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 在控制 UI 设置中粘贴相同的令牌。
- 仍然卡住？运行 `openclaw status --all` 并按照[故障排除](/gateway/troubleshooting)操作。参阅[仪表板](/web/dashboard)了解认证详情。

### 我设置了 gateway.bind: "tailnet"，但无法绑定/没有监听

`tailnet` 绑定从您的网络接口选择 Tailscale IP（100.64.0.0/10）。如果机器不在 Tailscale 上（或接口已断开），则没有可绑定的内容。

修复：

- 在该主机上启动 Tailscale（以便它有 100.x 地址），或者
- 切换到 `gateway.bind: "loopback"` / `"lan"`。

注意：`tailnet` 是显式的。`auto` 首选环回；当您想要仅 tailnet 绑定时使用 `gateway.bind: "tailnet"`。

### 可以在同一主机上运行多个 Gateway 吗

通常不行——一个 Gateway 可以运行多个消息通道和代理。只有在需要冗余（例如：救援机器人）或硬性隔离时才使用多个 Gateway。

可以，但您必须隔离：

- `OPENCLAW_CONFIG_PATH`（每个实例的配置）
- `OPENCLAW_STATE_DIR`（每个实例的状态）
- `agents.defaults.workspace`（工作区隔离）
- `gateway.port`（唯一端口）

快速设置（推荐）：

- 每个实例使用 `openclaw --profile <name> …`（自动创建 `~/.openclaw-<name>`）。
- 在每个配置文件的配置中设置唯一的 `gateway.port`（或手动运行时传递 `--port`）。
- 安装每个配置文件的服务：`openclaw --profile <name> gateway install`。

配置文件还会给服务名称添加后缀（`ai.openclaw.<profile>`；旧版 `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
完整指南：[多个 Gateway](/gateway/multiple-gateways)。

### "握手无效"/代码 1008 是什么意思

Gateway 是一个 **WebSocket 服务器**，它期望第一条消息是 `connect` 帧。如果收到其他任何内容，它会以**代码 1008**（策略违规）关闭连接。

常见原因：

- 您在浏览器中打开了 **HTTP** URL（`http://...`）而不是 WS 客户端。
- 您使用了错误的端口或路径。
- 代理或隧道去除了认证标头或发送了非 Gateway 请求。

快速修复：

1. 使用 WS URL：`ws://<host>:18789`（或 `wss://...` 如果是 HTTPS）。
2. 不要在普通浏览器选项卡中打开 WS 端口。
3. 如果认证已开启，在 `connect` 帧中包含令牌/密码。

如果您使用 CLI 或 TUI，URL 应该如下所示：

```
openclaw tui --url ws://<host>:18789 --token <token>
```

协议详情：[Gateway 协议](/gateway/protocol)。

## 日志记录和调试

### 日志在哪里

文件日志（结构化）：

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

您可以通过 `logging.file` 设置稳定路径。文件日志级别由 `logging.level` 控制。控制台详细程度由 `--verbose` 和 `logging.consoleLevel` 控制。

最快的日志跟踪：

```bash
openclaw logs --follow
```

服务/监督器日志（当 Gateway 通过 launchd/systemd 运行时）：

- macOS：`$OPENCLAW_STATE_DIR/logs/gateway.log` 和 `gateway.err.log`（默认：`~/.openclaw/logs/...`；配置文件使用 `~/.openclaw-<profile>/logs/...`）
- Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
- Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

参阅[故障排除](/gateway/troubleshooting#log-locations)了解更多。

### 如何启动/停止/重启 Gateway 服务

使用 Gateway 帮助命令：

```bash
openclaw gateway status
openclaw gateway restart
```

如果您手动运行 Gateway，`openclaw gateway --force` 可以回收端口。参阅 [Gateway](/gateway)。

### 我在 Windows 上关闭了终端——如何重启 OpenClaw

有**两种 Windows 安装模式**：

**1) WSL2（推荐）：** Gateway 在 Linux 内部运行。

打开 PowerShell，进入 WSL，然后重启：

```powershell
wsl
openclaw gateway status
openclaw gateway restart
```

如果您从未安装过服务，在前台启动它：

```bash
openclaw gateway run
```

**2) 原生 Windows（不推荐）：** Gateway 直接在 Windows 中运行。

打开 PowerShell 并运行：

```powershell
openclaw gateway status
openclaw gateway restart
```

如果您手动运行（无服务），使用：

```powershell
openclaw gateway run
```

文档：[Windows (WSL2)](/platforms/windows)、[Gateway 服务运行手册](/gateway)。

### Gateway 正常运行但回复从未到达。应该检查什么

从快速健康检查开始：

```bash
openclaw status
openclaw models status
openclaw channels status
openclaw logs --follow
```

常见原因：

- **Gateway 主机**上未加载模型认证（检查 `models status`）。
- 通道配对/允许列表阻止回复（检查通道配置 + 日志）。
- WebChat/仪表板打开时没有正确的令牌。

如果您是远程的，确认隧道/Tailscale 连接已建立，并且 Gateway WebSocket 可达。

文档：[通道](/channels)、[故障排除](/gateway/troubleshooting)、[远程访问](/gateway/remote)。

### "与 Gateway 断开连接：无原因"——怎么办

这通常意味着 UI 失去了 WebSocket 连接。检查：

1. Gateway 正在运行吗？`openclaw gateway status`
2. Gateway 健康吗？`openclaw status`
3. UI 有正确的令牌吗？`openclaw dashboard`
4. 如果是远程，隧道/Tailscale 链接是否正常？

然后跟踪日志：

```bash
openclaw logs --follow
```

文档：[仪表板](/web/dashboard)、[远程访问](/gateway/remote)、[故障排除](/gateway/troubleshooting)。

### Telegram setMyCommands 因网络错误失败。应该检查什么

从日志和通道状态开始：

```bash
openclaw channels status
openclaw channels logs --channel telegram
```

如果您在 VPS 上或在代理后面，确认允许出站 HTTPS 且 DNS 正常工作。
如果 Gateway 是远程的，确保您查看的是 Gateway 主机上的日志。

文档：[Telegram](/channels/telegram)、[通道故障排除](/channels/troubleshooting)。

### TUI 无输出。应该检查什么

首先确认 Gateway 可达且代理可以运行：

```bash
openclaw status
openclaw models status
openclaw logs --follow
```

在 TUI 中，使用 `/status` 查看当前状态。如果您期望在聊天通道中收到回复，确保投递已启用（`/deliver on`）。

文档：[TUI](/web/tui)、[斜杠命令](/tools/slash-commands)。

### 如何完全停止然后启动 Gateway

如果您安装了服务：

```bash
openclaw gateway stop
openclaw gateway start
```

这会停止/启动**监督服务**（macOS 上的 launchd，Linux 上的 systemd）。
当 Gateway 作为守护进程在后台运行时使用此方法。

如果您在前台运行，使用 Ctrl-C 停止，然后：

```bash
openclaw gateway run
```

文档：[Gateway 服务运行手册](/gateway)。

### 通俗解释：openclaw gateway restart 与 openclaw gateway

- `openclaw gateway restart`：重启**后台服务**（launchd/systemd）。
- `openclaw gateway`：在此终端会话中**前台**运行 Gateway。

如果您安装了服务，使用 gateway 命令。当您想要一次性前台运行时，使用 `openclaw gateway`。

### 出现故障时获取更多详细信息的最快方法是什么

使用 `--verbose` 启动 Gateway 以获取更多控制台详情。然后检查日志文件以了解通道认证、模型路由和 RPC 错误。

## 媒体和附件

### 我的技能生成了图像/PDF，但什么都没发送

来自代理的出站附件必须包含 `MEDIA:<path-or-url>` 行（单独一行）。参阅 [OpenClaw 助手设置](/start/openclaw)和[代理发送](/tools/agent-send)。

CLI 发送：

```bash
openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
```

还要检查：

- 目标通道支持出站媒体且未被允许列表阻止。
- 文件在提供商的大小限制内（图像被调整大小到最大 2048px）。

参阅[图像](/nodes/images)。

## 安全和访问控制

### 向入站私信公开 OpenClaw 安全吗

将入站私信视为不受信任的输入。默认设置旨在降低风险：

- 支持私信的通道上的默认行为是**配对**：
  - 未知发送者收到配对码；机器人不处理他们的消息。
  - 批准方式：`openclaw pairing approve --channel <channel> [--account <id>] <code>`
  - 待处理请求上限为**每通道 3 个**；如果代码没有到达，检查 `openclaw pairing list --channel <channel> [--account <id>]`。
- 公开私信需要明确选择加入（`dmPolicy: "open"` 和允许列表 `"*"`）。

运行 `openclaw doctor` 以发现有风险的私信策略。

### 提示注入仅是公共机器人的问题吗

不是。提示注入是关于**不受信任的内容**，不仅仅是谁可以私信机器人。
如果您的助手读取外部内容（网络搜索/抓取、浏览器页面、电子邮件、文档、附件、粘贴的日志），该内容可能包含试图劫持模型的指令。即使**您是唯一的发送者**，这也可能发生。

当工具启用时风险最大：模型可能被欺骗代您泄漏上下文或调用工具。通过以下方式减少影响：

- 使用只读或禁用工具的"阅读器"代理总结不受信任的内容
- 对于启用工具的代理，关闭 `web_search` / `web_fetch` / `browser`
- 沙箱和严格的工具允许列表

详情：[安全性](/gateway/security)。

### 我的机器人应该有自己的电子邮件、GitHub 账户或电话号码吗

是的，对于大多数设置。用单独的账户和电话号码隔离机器人，可以减少出错时的影响范围。这也使得轮换凭据或撤销访问权限变得更容易，而不影响您的个人账户。

从小处着手。只授予您实际需要的工具和账户的访问权限，如有需要稍后再扩展。

文档：[安全性](/gateway/security)、[配对](/channels/pairing)。

### 可以给它对我短信的自主权，这安全吗

我们**不建议**对您的个人消息完全自主。最安全的模式是：

- 将私信保持在**配对模式**或严格的允许列表中。
- 如果您想让它代表您发消息，使用**单独的号码或账户**。
- 让它起草，然后**批准后再发送**。

如果您想实验，请在专用账户上进行并保持隔离。参阅[安全性](/gateway/security)。

### 可以使用更便宜的模型用于个人助理任务吗

可以，**如果**代理仅用于聊天且输入受信任。较小的层级更容易受到指令劫持，所以对于启用工具的代理或读取不受信任内容时避免使用它们。如果必须使用较小的模型，请锁定工具并在沙箱内运行。参阅[安全性](/gateway/security)。

### 我在 Telegram 中运行了 `/start` 但没有收到配对码

配对码仅在未知发送者向机器人发送消息且启用了 `dmPolicy: "pairing"` 时**才会发送**。`/start` 本身不会生成代码。

检查待处理请求：

```bash
openclaw pairing list telegram
```

如果您想立即访问，将您的发送者 ID 加入白名单或为该账户设置 `dmPolicy: "open"`。

### WhatsApp：它会给我的联系人发消息吗？配对如何工作

不会。默认 WhatsApp 私信策略是**配对**。未知发送者只会收到配对码，他们的消息**不被处理**。OpenClaw 只回复它收到的聊天或您触发的显式发送。

使用以下方式批准配对：

```bash
openclaw pairing approve whatsapp <code>
```

列出待处理请求：

```bash
openclaw pairing list whatsapp
```

向导电话号码提示：它用于设置您的**允许列表/所有者**，以便您自己的私信被允许。它不用于自动发送。如果您在个人 WhatsApp 号码上运行，使用该号码并启用 `channels.whatsapp.selfChatMode`。

## 聊天命令、中止任务和"它不停止"

### 如何阻止内部系统消息出现在聊天中

大多数内部或工具消息仅在该会话启用了**详细**或**推理**模式时出现。

在您看到的聊天中修复：

```
/verbose off
/reasoning off
```

如果仍然有噪音，检查控制 UI 中的会话设置并将详细模式设置为**继承**。还要确认您没有使用 `verboseDefault` 在配置中设置为 `on` 的机器人配置文件。

文档：[思考和详细](/tools/thinking)、[安全性](/gateway/security#reasoning--verbose-output-in-groups)。

### 如何停止/取消正在运行的任务

将以下任何一个作为**独立消息**发送（无斜杠）：

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

对于后台进程（来自执行工具），您可以让代理运行：

```
process action:kill sessionId:XXX
```

斜杠命令概述：参阅[斜杠命令](/tools/slash-commands)。

大多数命令必须作为以 `/` 开头的**独立**消息发送，但一些快捷方式（如 `/status`）也可以为白名单发送者内联工作。

### 如何从 Telegram 发送 Discord 消息？（"跨上下文消息被拒绝"）

OpenClaw 默认阻止**跨提供商**消息。如果工具调用绑定到 Telegram，除非您明确允许，否则它不会发送到 Discord。

为代理启用跨提供商消息：

```json5
{
  agents: {
    defaults: {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    },
  },
}
```

编辑配置后重启 Gateway。如果您只想为单个代理启用此功能，请在 `agents.list[].tools.message` 下设置。

### 为什么感觉机器人会"忽略"快速连续的消息

队列模式控制新消息如何与飞行中的运行交互。使用 `/queue` 更改模式：

- `steer` - 新消息重定向当前任务
- `followup` - 一次运行一条消息
- `collect` - 批量消息并一次回复（默认）
- `steer-backlog` - 现在转向，然后处理积压
- `interrupt` - 中止当前运行并重新开始

您可以为跟进模式添加选项，如 `debounce:2s cap:25 drop:summarize`。

## 从截图/聊天日志回答确切问题

**问："Anthropic 使用 API 密钥的默认模型是什么？"**

**答：** 在 OpenClaw 中，凭据和模型选择是分开的。设置 `ANTHROPIC_API_KEY`（或在认证配置中存储 Anthropic API 密钥）启用身份验证，但实际的默认模型是您在 `agents.defaults.model.primary` 中配置的内容（例如 `anthropic/claude-sonnet-4-5` 或 `anthropic/claude-opus-4-6`）。如果您看到 `No credentials found for profile "anthropic:default"`，这意味着 Gateway 在运行代理的预期 `auth-profiles.json` 中找不到 Anthropic 凭据。

---

仍然卡住？在 [Discord](https://discord.com/invite/clawd) 中提问或开一个 [GitHub 讨论](https://github.com/openclaw/openclaw/discussions)。
