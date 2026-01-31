---
title: "快速开始"
sidebarTitle: "快速开始"
mmh3_hash: "6b492947b03a0d6c789b28589952d218"
summary: "初学者指南：从零开始到发送第一条消息（向导、认证、频道、配对）"
read_when: ["首次从零开始设置", "你想要从安装 → 入门 → 发送第一条消息的最快路径"]
---

# 快速开始

目标：以最快速度从 **零** → **第一次可用的聊天**（使用合理的默认设置）。

最快聊天方式：打开控制界面（无需设置频道）。运行 `openclaw dashboard` 并在浏览器中聊天，或者打开网关主机上的 `http://127.0.0.1:18789/`。
文档：[仪表盘](/web/dashboard) 和 [控制界面](/web/control-ui)。

推荐路径：使用 **CLI 入门向导** (`openclaw onboard`)。它会设置：
- 模型/认证 (推荐 OAuth)
- 网关设置
- 频道 (WhatsApp/Telegram/Discord/Mattermost (插件)/...)
- 配对默认值 (安全私信)
- 工作区引导 + 技能
- 可选的后台服务

如果你想要更深入的参考页面，请跳转至：[向导](/start/wizard)、[设置](/start/setup)、[配对](/start/pairing)、[安全](/gateway/security)。

沙盒说明：`agents.defaults.sandbox.mode: "non-main"` 使用 `session.mainKey` (默认为 `"main"`)，因此群组/频道会话是沙盒化的。如果你希望主智能体始终在主机上运行，请设置明确的每个智能体覆盖：

```json
{
  "routing": {
    "agents": {
      "main": {
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    }
  }
}
```

## 0) 前提条件

- Node `>=22`
- `pnpm` (可选；如果你从源码构建则推荐使用)
- **推荐：** 用于网络搜索的 Brave Search API 密钥。最简单的路径：
  `openclaw configure --section web` (存储 `tools.web.search.apiKey`)。
  参见 [Web 工具](/tools/web)。

macOS：如果你计划构建应用程序，请安装 Xcode / CLT。仅对于 CLI + Gateway，Node 就足够了。
Windows：使用 **WSL2** (推荐 Ubuntu)。强烈推荐使用 WSL2；原生 Windows 未经测试，问题较多，且工具兼容性较差。先安装 WSL2，然后在 WSL 内运行 Linux 步骤。参见 [Windows (WSL2)](/platforms/windows)。

## 1) 安装 CLI (推荐)

```bash
curl -fsSL https://openclaw.bot/install.sh | bash
```

安装程序选项（安装方法、非交互式、从 GitHub）：[安装](/install)。

Windows (PowerShell):

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

替代方案 (全局安装):

```bash
npm install -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

## 2) 运行入门向导 (并安装服务)

```bash
openclaw onboard --install-daemon
```

你将选择：
- **本地 (Local) vs 远程 (Remote)** 网关
- **认证 (Auth)**: OpenAI Code (Codex) 订阅 (OAuth) 或 API 密钥。对于 Anthropic 我们推荐 API 密钥；也支持 `claude setup-token`。
- **提供商 (Providers)**: WhatsApp 二维码登录、Telegram/Discord 机器人令牌、Mattermost 插件令牌等。
- **守护进程 (Daemon)**: 后台安装 (launchd/systemd; WSL2 使用 systemd)
  - **运行时 (Runtime)**: Node (推荐；WhatsApp/Telegram 需要)。**不推荐**使用 Bun。
- **网关令牌 (Gateway token)**: 向导默认会生成一个（即使在回环地址上）并将其存储在 `gateway.auth.token` 中。

向导文档：[向导](/start/wizard)

### 认证：它在哪里 (重要)

- **推荐的 Anthropic 路径：** 设置一个 API 密钥（向导可以将其存储以供服务使用）。如果你想重用 Claude Code 凭据，也支持 `claude setup-token`。

- OAuth 凭据 (旧版导入): `~/.openclaw/credentials/oauth.json`
- 认证配置文件 (OAuth + API 密钥): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

无头/服务器提示：先在普通机器上进行 OAuth，然后将 `oauth.json` 复制到网关主机。

## 3) 启动网关

如果你在引导过程中安装了服务，网关应该已经在运行了：

```bash
openclaw gateway status
```

手动运行 (前台):

```bash
openclaw gateway --port 18789 --verbose
```

仪表盘 (本地回环): `http://127.0.0.1:18789/`
如果配置了令牌，请将其粘贴到控制界面设置中（存储为 `connect.params.auth.token`）。

⚠️ **Bun 警告 (WhatsApp + Telegram):** Bun 在这些频道上存在已知问题。如果你使用 WhatsApp 或 Telegram，请使用 **Node** 运行网关。

## 3.5) 快速验证 (2 分钟)

```bash
openclaw status
openclaw health
openclaw security audit --deep
```

## 4) 配对 + 连接你的第一个聊天界面

### WhatsApp (二维码登录)

```bash
openclaw channels login
```

通过 WhatsApp → 设置 → 已关联设备 进行扫描。

WhatsApp 文档：[WhatsApp](/channels/whatsapp)

### Telegram / Discord / 其他

向导可以为你写入令牌/配置。如果你更喜欢手动配置，请从这里开始：
- Telegram: [Telegram](/channels/telegram)
- Discord: [Discord](/channels/discord)
- Mattermost (插件): [Mattermost](/channels/mattermost)

**Telegram 私信提示：** 你的第一条私信会返回一个配对码。批准它（见下一步），否则机器人不会回复。

## 5) 私信安全 (配对批准)

默认姿态：未知的私信会收到一个简短的代码，且消息在批准前不会被处理。
如果你的第一条私信没有收到回复，请批准配对：

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <code>
```

配对文档：[配对](/start/pairing)

## 从源码 (开发)

如果你正在修改 OpenClaw 本身，请从源码运行：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # 首次运行时自动安装 UI 依赖
pnpm build
openclaw onboard --install-daemon
```

如果你还没有全局安装，请从仓库运行引导步骤 `pnpm openclaw ...`。
`pnpm build` 也会打包 A2UI 资源；如果你只需要运行该步骤，请使用 `pnpm canvas:a2ui:bundle`。

网关 (从本仓库):

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 7) 端到端验证

在一个新的终端中，发送测试消息：

```bash
openclaw message send --target +15555550123 --message "Hello from OpenClaw"
```

如果 `openclaw health` 显示“未配置认证 (no auth configured)”，请返回向导并设置 OAuth/密钥认证 —— 否则智能体将无法回复。

提示：`openclaw status --all` 是最好的可粘贴、只读调试报告。
健康探针：`openclaw health` (或 `openclaw status --deep`) 会向运行中的网关请求健康快照。

## 下一步 (可选，但很棒)

- macOS 菜单栏应用 + 语音唤醒：[macOS 应用](/platforms/macos)
- iOS/Android 节点 (画布/相机/语音)：[节点](/nodes)
- 远程访问 (SSH 隧道 / Tailscale Serve)：[远程访问](/gateway/remote) 和 [Tailscale](/gateway/tailscale)
- 始终在线 / VPN 设置：[远程访问](/gateway/remote)、[exe.dev](/platforms/exe-dev)、[Hetzner](/platforms/hetzner)、[macOS 远程](/platforms/mac/remote)
