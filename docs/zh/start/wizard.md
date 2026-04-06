---
mmh3_hash: "21030ac16b34b66eb7d41baad6020213"
summary: "CLI 引导向导：Gateway、工作区、Channel 和 Skill 的引导式设置"
read_when:
  - 运行或配置 CLI 引导向导
  - 设置新机器
title: "引导向导（CLI）"
sidebarTitle: "引导向导：CLI"
---

# 引导向导（CLI）

CLI 引导向导是在 macOS、Linux 或 Windows（通过 WSL2；强烈推荐）上设置 OpenClaw 的**推荐**方式。
它在一个引导式流程中配置本地 Gateway 或远程 Gateway 连接，以及 Channel、Skill 和工作区默认值。

```bash
openclaw onboard
```

<Info>
最快的第一次聊天：打开 Control UI（无需 Channel 设置）。运行
`openclaw dashboard` 并在浏览器中聊天。文档：[Dashboard](/web/dashboard)。
</Info>

后续重新配置：

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 不意味着非交互式模式。对于脚本，使用 `--non-interactive`。
</Note>

<Tip>
CLI 引导向导包含网络搜索步骤，您可以在其中选择 Provider，如
Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、
Ollama Web Search、Perplexity、SearXNG 或 Tavily。部分 Provider 需要 API 密钥，其他不需要。您也可以稍后通过 `openclaw configure --section web` 进行配置。文档：[Web 工具](/tools/web)。
</Tip>

## QuickStart vs Advanced

向导从 **QuickStart**（默认值）vs **Advanced**（完全控制）开始。

<Tabs>
  <Tab title="QuickStart（默认值）">
    - Local Gateway（loopback）
    - 工作区默认值（或现有工作区）
    - Gateway 端口 **18789**
    - Gateway 认证 **Token**（自动生成，即使在 loopback 上）
    - 新本地设置的工具策略默认值：`tools.profile: "coding"`（现有的显式配置文件会被保留）
    - DM 隔离默认值：本地引导在未设置时写入 `session.dmScope: "per-channel-peer"`。详情：[CLI 引导参考](/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 暴露 **Off**
    - Telegram + WhatsApp 私信默认为 **allowlist**（您将被提示输入您的电话号码）
  </Tab>
  <Tab title="Advanced（完全控制）">
    - 公开每个步骤（模式、工作区、Gateway、Channel、Daemon、Skill）。
  </Tab>
</Tabs>

## 向导配置的内容

**Local 模式（默认）**引导您完成以下步骤：

1. **模型/认证** — 选择任何支持的 Provider/认证流程（API 密钥、OAuth 或 Provider 特定的手动认证），包括 Custom Provider
   （OpenAI 兼容、Anthropic 兼容或未知自动检测）。选择默认模型。
   安全提示：如果此 Agent 将运行工具或处理 Webhook/Hook 内容，请选择可用的最强最新一代模型并保持工具策略严格。较弱/较旧的层更容易被提示词注入。
   对于非交互式运行，`--secret-input-mode ref` 在认证配置文件中存储环境支持的引用，而不是明文 API 密钥值。
   在非交互式 `ref` 模式中，Provider 环境变量必须设置；不带该环境变量传递内联密钥标志会快速失败。
   在交互式运行中，选择密钥引用模式允许您指向环境变量或配置的 Provider 引用（`file` 或 `exec`），在保存之前进行快速预检验证。
   对于 Anthropic，交互式引导/配置提供 **Anthropic Claude CLI** 作为本地回退，**Anthropic API 密钥**作为推荐的生产路径。Anthropic setup-token 也作为旧版/手动 OpenClaw 路径再次可用，并带有 Anthropic 的 OpenClaw 特定 **Extra Usage** 计费预期。
2. **工作区** — Agent 文件的位置（默认 `~/.openclaw/workspace`）。播种引导文件。
3. **Gateway** — 端口、绑定地址、认证模式、Tailscale 暴露。
   在交互式 Token 模式下，选择默认明文 Token 存储或选择加入 SecretRef。
   非交互式 Token SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
4. **Channel** — 内置和捆绑的聊天 Channel，如 BlueBubbles、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
5. **Daemon** — 安装 LaunchAgent（macOS）、systemd 用户单元（Linux/WSL2），或原生 Windows 计划任务，带每用户 Startup 文件夹回退。
   如果 Token 认证需要 Token 且 `gateway.auth.token` 由 SecretRef 管理，守护程序安装会验证它，但不会将解析的 Token 保存到守护进程服务环境元数据中。
   如果 Token 认证需要 Token 且配置的 Token SecretRef 未解析，守护程序安装将被阻止，并提供可操作的指导。
   如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置且 `gateway.auth.mode` 未设置，守护程序安装将被阻止，直到明确设置模式。
6. **健康检查** — 启动 Gateway 并验证其正在运行。
7. **Skill** — 安装推荐的 Skill 和可选依赖项。

<Note>
重新运行向导**不会**清除任何内容，除非您明确选择 **Reset**（或传递 `--reset`）。
CLI `--reset` 默认为配置、凭据和 Session；使用 `--reset-scope full` 以包含工作区。
如果配置无效或包含旧密钥，向导会要求您先运行 `openclaw doctor`。
</Note>

**Remote 模式**仅配置本地客户端以连接到其他地方的 Gateway。
它**不**在远程主机上安装或更改任何内容。

## 添加另一个 Agent

使用 `openclaw agents add <name>` 创建一个单独的 Agent，拥有自己的工作区、
Session 和认证配置文件。不使用 `--workspace` 运行会启动引导向导。

它设置什么：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意：

- 默认工作区遵循 `~/.openclaw/workspace-<agentId>`。
- 添加 `bindings` 以路由入站消息（引导向导可以执行此操作）。
- 非交互式标志：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完整参考

有关详细的逐步分解和配置输出，请参阅
[CLI 引导参考](/start/wizard-cli-reference)。
有关非交互式示例，请参阅 [CLI 自动化](/start/wizard-cli-automation)。
有关更深入的技术参考，包括 RPC 详情，请参阅
[引导参考](/reference/wizard)。

## 相关文档

- CLI 命令参考：[`openclaw onboard`](/cli/onboard)
- 引导概述：[引导概述](/start/onboarding-overview)
- macOS 应用引导：[引导](/start/onboarding)
- Agent 首次运行仪式：[Agent 引导](/start/bootstrapping)
