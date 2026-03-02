---
mmh3_hash: "381060afc02009749dd3091dc9c90894"
summary: "CLI 入门向导：Gateway、工作区、Channel 和 Skill 的引导式设置"
read_when:
  - 运行或配置入门向导
  - 设置新机器
title: "入门向导"
sidebarTitle: "引导向导（CLI）"
---

# 入门向导（CLI）

入门向导是在 macOS、Linux 或 Windows（通过 WSL2；强烈推荐）上设置 OpenClaw 的**推荐**方式。
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
推荐：设置 Brave Search API 密钥，以便 Agent 可以使用 `web_search`
（`web_fetch` 无需密钥即可工作）。最简单的路径：`openclaw configure --section web`
它存储 `tools.web.search.apiKey`。文档：[Web 工具](/tools/web)。
</Tip>

## QuickStart vs Advanced

向导从 **QuickStart**（默认值）vs **Advanced**（完全控制）开始。

<Tabs>
  <Tab title="QuickStart（默认值）">
    - Local Gateway（loopback）
    - 工作区默认值（或现有工作区）
    - Gateway 端口 **18789**
    - Gateway 认证 **Token**（自动生成，即使在 loopback 上）
    - DM 隔离默认值：本地引导在未设置时写入 `session.dmScope: "per-channel-peer"`。详情：[CLI 引导参考](/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 暴露 **Off**
    - Telegram + WhatsApp 私信默认为 **allowlist**（您将被提示输入您的电话号码）
  </Tab>
  <Tab title="Advanced（完全控制）">
    - 公开每个步骤（模式、工作区、Gateway、Channel、Daemon、Skill）。
  </Tab>
</Tabs>

## 向导做什么

**Local 模式（默认）**引导您完成以下步骤：

1. **模型/认证** — Anthropic API 密钥（推荐）、OpenAI 或自定义 Provider
   （OpenAI 兼容、Anthropic 兼容或未知自动检测）。选择默认模型。
   对于非交互式运行，`--secret-input-mode ref` 在身份验证配置文件中存储环境支持的引用，而不是明文 API 密钥值。
   在非交互式 `ref` 模式中，提供商环境变量必须设置；不带该环境变量传递内联密钥标志会快速失败。
   在交互式运行中，选择密钥引用模式允许您指向环境变量或配置的提供商引用（`file` 或 `exec`），在保存之前进行快速预检验证。
2. **工作区** — Agent 文件的位置（默认 `~/.openclaw/workspace`）。播种引导文件。
3. **Gateway** — 端口、绑定地址、认证模式、Tailscale 暴露。
4. **Channels** — WhatsApp、Telegram、Discord、Google Chat、Mattermost、Signal、BlueBubbles 或 iMessage。
5. **Daemon** — 安装 LaunchAgent（macOS）或 systemd 用户单元（Linux/WSL2）。
6. **健康检查** — 启动 Gateway 并验证其正在运行。
7. **Skills** — 安装推荐的 Skills 和可选依赖项。

<Note>
重新运行向导**不会**清除任何内容，除非您明确选择 **Reset**（或传递 `--reset`）。
CLI `--reset` 默认为配置、凭据和会话；使用 `--reset-scope full` 以包含工作空间。
如果配置无效或包含旧密钥，向导会要求您先运行 `openclaw doctor`。
</Note>

**Remote 模式**仅配置本地客户端以连接到其他地方的 Gateway。
它**不**在远程主机上安装或更改任何内容。

## 添加另一个 Agent

使用 `openclaw agents add <name>` 创建一个单独的 Agent，拥有自己的工作空间、
Session 和认证配置文件。不使用 `--workspace` 运行会启动向导。

它设置什么：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意：

- 默认工作空间遵循 `~/.openclaw/workspace-<agentId>`。
- 添加 `bindings` 以路由入站消息（向导可以执行此操作）。
- 非交互式标志：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完整参考

有关详细的逐步分解、非交互式脚本、Signal 设置、
RPC API 以及向导写入的完整配置字段列表，请参阅
[向导参考](/reference/wizard)。

## 相关文档

- CLI 命令参考：[`openclaw onboard`](/cli/onboard)
- 引导概述：[引导概述](/start/onboarding-overview)
- macOS 应用引导：[引导](/start/onboarding)
- Agent 首次运行仪式：[Agent 引导](/start/bootstrapping)
