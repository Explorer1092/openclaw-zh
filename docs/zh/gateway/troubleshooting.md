---
title: "故障排除 🔧"
sidebarTitle: "故障排除"
mmh3_hash: "f1a69f7ea08d7d589e7a5e652d19b765"
summary: "常见 OpenClaw 故障的快速故障排除指南"
read_when: ["调查运行时问题或故障"]
---
# 故障排除 🔧

当 OpenClaw 出现问题时,这里是修复方法。

如果您只想要快速分类方法,请从 FAQ 的[前 60 秒](/help/faq#first-60-seconds-if-somethings-broken)开始。本页面更深入地介绍运行时故障和诊断。

特定于提供商的快捷方式:[/channels/troubleshooting](/channels/troubleshooting)

## 状态和诊断

快速分类命令(按顺序):

| 命令 | 它告诉您什么 | 何时使用 |
|---|---|---|
| `openclaw status` | 本地摘要:OS + 更新、网关可达性/模式、服务、代理/会话、提供商配置状态 | 首次检查,快速概览 |
| `openclaw status --all` | 完整的本地诊断(只读、可粘贴、相对安全),包括日志尾部 | 当您需要分享调试报告时 |
| `openclaw status --deep` | 运行网关健康检查(包括提供商探测;需要可达的网关) | 当"已配置"不意味着"工作"时 |
| `openclaw gateway probe` | 网关发现 + 可达性(本地 + 远程目标) | 当您怀疑正在探测错误的网关时 |
| `openclaw channels status --probe` | 向正在运行的网关询问通道状态(并可选择性地探测) | 当网关可达但通道行为不正常时 |
| `openclaw gateway status` | 监督程序状态(launchd/systemd/schtasks)、运行时 PID/退出、最后一个网关错误 | 当服务"看起来已加载"但没有运行任何东西时 |
| `openclaw logs --follow` | 实时日志(运行时问题的最佳信号) | 当您需要实际故障原因时 |

**共享输出:** 优先选择 `openclaw status --all`(它会编辑令牌)。如果粘贴 `openclaw status`,请先考虑设置 `OPENCLAW_SHOW_SECRETS=0`(令牌预览)。

另见:[健康检查](/gateway/health)和[日志记录](/logging)。

## 常见问题

### 未找到提供商"anthropic"的 API 密钥

这意味着**代理的身份验证存储为空**或缺少 Anthropic 凭证。身份验证是**每个代理**的,因此新代理不会继承主代理的密钥。

修复选项:
- 重新运行入门并为该代理选择 **Anthropic**。
- 或在**网关主机**上粘贴设置令牌:
  ```bash
  openclaw models auth setup-token --provider anthropic
  ```
- 或将 `auth-profiles.json` 从主代理目录复制到新代理目录。

验证:
```bash
openclaw models status
```

### OAuth 令牌刷新失败(Anthropic Claude 订阅)

这意味着存储的 Anthropic OAuth 令牌已过期且刷新失败。如果您使用 Claude 订阅(无 API 密钥),最可靠的修复是切换到 **Claude Code 设置令牌**并将其粘贴在**网关主机**上。

**推荐(设置令牌):**

```bash
# 在网关主机上运行(粘贴设置令牌)
openclaw models auth setup-token --provider anthropic
openclaw models status
```

如果您在其他地方生成了令牌:

```bash
openclaw models auth paste-token --provider anthropic
openclaw models status
```

更多详细信息:[Anthropic](/providers/anthropic)和 [OAuth](/concepts/oauth)。

### 控制 UI 在 HTTP 上失败("需要设备身份"/"连接失败")

如果您通过纯 HTTP 打开仪表板(例如 `http://<lan-ip>:18789/` 或 `http://<tailscale-ip>:18789/`),浏览器在**非安全上下文**中运行并阻止 WebCrypto,因此无法生成设备身份。

**修复:**
- 通过 [Tailscale Serve](/gateway/tailscale) 优先选择 HTTPS。
- 或在网关主机上本地打开:`http://127.0.0.1:18789/`。
- 如果必须保持 HTTP,请启用 `gateway.controlUi.allowInsecureAuth: true` 并使用网关令牌(仅令牌;无设备身份/配对)。请参阅[控制 UI](/web/control-ui#insecure-http)。

### CI 秘密扫描失败

这意味着 `detect-secrets` 发现了基线中尚未包含的新候选项。遵循[秘密扫描](/gateway/security#secret-scanning-detect-secrets)。

### 服务已安装但没有运行任何东西

如果安装了网关服务但进程立即退出,服务可能看起来"已加载",而实际上没有运行任何东西。

**检查:**
```bash
openclaw gateway status
openclaw doctor
```

Doctor/service 将显示运行时状态(PID/最后退出)和日志提示。

**日志:**
- 优先选择:`openclaw logs --follow`
- 文件日志(始终):`/tmp/openclaw/openclaw-YYYY-MM-DD.log`(或您配置的 `logging.file`)
- macOS LaunchAgent(如果已安装):`$OPENCLAW_STATE_DIR/logs/gateway.log` 和 `gateway.err.log`
- Linux systemd(如果已安装):`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
- Windows:`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

**启用更多日志记录:**
- 提高文件日志详细信息(持久化 JSONL):
  ```json
  { "logging": { "level": "debug" } }
  ```
- 提高控制台详细程度(仅 TTY 输出):
  ```json
  { "logging": { "consoleLevel": "debug", "consoleStyle": "pretty" } }
  ```
- 快速提示:`--verbose` 仅影响**控制台**输出。文件日志仍由 `logging.level` 控制。

请参阅 [/logging](/logging) 以获取格式、配置和访问的完整概述。

### "网关启动被阻止:设置 gateway.mode=local"

这意味着配置存在但 `gateway.mode` 未设置(或不是 `local`),因此网关拒绝启动。

**修复(推荐):**
- 运行向导并将网关运行模式设置为 **Local**:
  ```bash
  openclaw configure
  ```
- 或直接设置:
  ```bash
  openclaw config set gateway.mode local
  ```

**如果您打算改为运行远程网关:**
- 设置远程 URL 并保持 `gateway.mode=remote`:
  ```bash
  openclaw config set gateway.mode remote
  openclaw config set gateway.remote.url "wss://gateway.example.com"
  ```

**仅临时/开发:** 传递 `--allow-unconfigured` 以在没有 `gateway.mode=local` 的情况下启动网关。

**还没有配置文件?** 运行 `openclaw setup` 创建启动配置,然后重新运行网关。

### 服务环境(PATH + 运行时)

网关服务使用**最小 PATH** 运行,以避免 shell/管理器杂乱:
- macOS:`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
- Linux:`/usr/local/bin`、`/usr/bin`、`/bin`

这故意排除了版本管理器(nvm/fnm/volta/asdf)和包管理器(pnpm/npm),因为服务不加载您的 shell 初始化。像 `DISPLAY` 这样的运行时变量应该存在于 `~/.openclaw/.env` 中(由网关早期加载)。在 `host=gateway` 上的 Exec 运行将您的登录 shell `PATH` 合并到 exec 环境中,因此缺少工具通常意味着您的 shell 初始化没有导出它们(或设置 `tools.exec.pathPrepend`)。请参阅 [/tools/exec](/tools/exec)。

WhatsApp + Telegram 通道需要 **Node**;不支持 Bun。如果您的服务是使用 Bun 或版本管理的 Node 路径安装的,请运行 `openclaw doctor` 以迁移到系统 Node 安装。

### 沙箱中缺少技能 API 密钥

**症状:** 技能在主机上工作但在沙箱中因缺少 API 密钥而失败。

**原因:** 沙箱 exec 在 Docker 内运行,**不**继承主机 `process.env`。

**修复:**
- 设置 `agents.defaults.sandbox.docker.env`(或每个代理 `agents.list[].sandbox.docker.env`)
- 或将密钥烘焙到您的自定义沙箱镜像中
- 然后运行 `openclaw sandbox recreate --agent <id>`(或 `--all`)

### 服务正在运行但端口未侦听

如果服务报告**正在运行**但网关端口上没有侦听任何内容,网关可能拒绝绑定。

**"正在运行"在这里意味着什么**
- `Runtime: running` 意味着您的监督程序(launchd/systemd/schtasks)认为进程还活着。
- `RPC probe` 意味着 CLI 可以实际连接到网关 WebSocket 并调用 `status`。
- 始终信任 `Probe target:` + `Config (service):` 作为"我们实际尝试了什么?"行。

**检查:**
- 对于 `openclaw gateway` 和服务,`gateway.mode` 必须是 `local`。
- 如果设置了 `gateway.mode=remote`,**CLI 默认**为远程 URL。服务仍然可以在本地运行,但您的 CLI 可能正在探测错误的位置。使用 `openclaw gateway status` 查看服务的解析端口 + 探测目标(或传递 `--url`)。
- `openclaw gateway status` 和 `openclaw doctor` 在服务看起来正在运行但端口关闭时从日志中显示**最后一个网关错误**。
- 非环回绑定(`lan`/`tailnet`/`custom`,或当环回不可用时的 `auto`)需要身份验证:`gateway.auth.token`(或 `OPENCLAW_GATEWAY_TOKEN`)。
- `gateway.remote.token` 仅用于远程 CLI 调用;它**不**启用本地身份验证。
- `gateway.token` 被忽略;使用 `gateway.auth.token`。

**如果 `openclaw gateway status` 显示配置不匹配**
- `Config (cli): ...` 和 `Config (service): ...` 通常应该匹配。
- 如果它们不匹配,您几乎肯定在编辑一个配置,而服务正在运行另一个配置。
- 修复:从您希望服务使用的相同 `--profile` / `OPENCLAW_STATE_DIR` 重新运行 `openclaw gateway install --force`。

**如果 `openclaw gateway status` 报告服务配置问题**
- 监督程序配置(launchd/systemd/schtasks)缺少当前默认值。
- 修复:运行 `openclaw doctor` 更新它(或 `openclaw gateway install --force` 进行完全重写)。

**如果 `Last gateway error:` 提到"拒绝绑定...没有身份验证"**
- 您将 `gateway.bind` 设置为非环回模式(`lan`/`tailnet`/`custom`,或当环回不可用时的 `auto`),但没有配置身份验证。
- 修复:设置 `gateway.auth.mode` + `gateway.auth.token`(或导出 `OPENCLAW_GATEWAY_TOKEN`)并重启服务。

**如果 `openclaw gateway status` 说 `bind=tailnet` 但未找到 tailnet 接口**
- 网关尝试绑定到 Tailscale IP(100.64.0.0/10),但在主机上未检测到任何。
- 修复:在该机器上启动 Tailscale(或将 `gateway.bind` 更改为 `loopback`/`lan`)。

**如果 `Probe note:` 说探测使用环回**
- 这对于 `bind=lan` 是预期的:网关侦听 `0.0.0.0`(所有接口),环回仍应在本地连接。
- 对于远程客户端,使用真实的 LAN IP(不是 `0.0.0.0`)加上端口,并确保配置了身份验证。

### 地址已被使用(端口 18789)

这意味着某些东西已经在侦听网关端口。

**检查:**
```bash
openclaw gateway status
```

它将显示侦听器和可能的原因(网关已在运行、SSH 隧道)。如果需要,停止服务或选择不同的端口。

### 检测到额外的工作区文件夹

如果您从较旧的安装升级,您可能仍然在磁盘上有 `~/openclaw`。多个工作区目录可能会导致令人困惑的身份验证或状态漂移,因为只有一个工作区处于活动状态。

**修复:** 保留单个活动工作区并存档/删除其余工作区。请参阅[代理工作区](/concepts/agent-workspace#extra-workspace-folders)。

### 主聊天在沙箱工作区中运行

症状:`pwd` 或文件工具显示 `~/.openclaw/sandboxes/...`,即使您期望主机工作区。

**原因:** `agents.defaults.sandbox.mode: "non-main"` 从 `session.mainKey`(默认 `"main"`)开始。群组/通道会话使用自己的密钥,因此它们被视为非主会话并获得沙箱工作区。

**修复选项:**
- 如果您希望代理使用主机工作区:设置 `agents.list[].sandbox.mode: "off"`。
- 如果您希望在沙箱内访问主机工作区:为该代理设置 `workspaceAccess: "rw"`。

### "代理已中止"

代理在响应过程中被中断。

**原因:**
- 用户发送 `stop`、`abort`、`esc`、`wait` 或 `exit`
- 超时超出
- 进程崩溃

**修复:** 只需发送另一条消息。会话继续。

### "代理在回复前失败:未知模型:anthropic/claude-haiku-3-5"

OpenClaw 故意拒绝**较旧/不安全的模型**(尤其是那些更容易受到提示注入攻击的模型)。如果您看到此错误,则不再支持该模型名称。

**修复:**
- 为提供商选择**最新**模型并更新您的配置或模型别名。
- 如果您不确定哪些模型可用,请运行 `openclaw models list` 或 `openclaw models scan` 并选择一个受支持的模型。
- 检查网关日志以获取详细的故障原因。

另见:[模型 CLI](/cli/models)和[模型提供商](/concepts/model-providers)。

### 消息未触发

**检查 1:** 发送者是否在白名单中?
```bash
openclaw status
```
在输出中查找 `AllowFrom: ...`。

**检查 2:** 对于群聊,是否需要提及?
```bash
# 消息必须匹配 mentionPatterns 或明确提及;默认值存在于通道群组/服务器中。
# 多代理:`agents.list[].groupChat.mentionPatterns` 覆盖全局模式。
grep -n "agents\\|groupChat\\|mentionPatterns\\|channels\\.whatsapp\\.groups\\|channels\\.telegram\\.groups\\|channels\\.imessage\\.groups\\|channels\\.discord\\.guilds" \
  "${OPENCLAW_CONFIG_PATH:-$HOME/.openclaw/openclaw.json}"
```

**检查 3:** 检查日志
```bash
openclaw logs --follow
# 或如果您想要快速过滤:
tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)" | grep "blocked\\|skip\\|unauthorized"
```

### 配对代码未到达

如果 `dmPolicy` 是 `pairing`,未知发送者应该收到一个代码,并且在批准之前会忽略他们的消息。

**检查 1:** 是否已有待处理请求在等待?
```bash
openclaw pairing list <channel>
```

默认情况下,待处理的 DM 配对请求限制为**每个通道 3 个**。如果列表已满,在批准或过期之前,新请求不会生成代码。

**检查 2:** 请求是否已创建但未发送回复?
```bash
openclaw logs --follow | grep "pairing request"
```

**检查 3:** 确认该通道的 `dmPolicy` 不是 `open`/`allowlist`。

### 图片 + 提及不起作用

已知问题:当您发送仅带有提及(没有其他文本)的图片时,WhatsApp 有时不包括提及元数据。

**解决方法:** 在提及中添加一些文本:
- ❌ `@openclaw` + 图片
- ✅ `@openclaw check this` + 图片

### 会话未恢复

**检查 1:** 会话文件在那里吗?
```bash
ls -la ~/.openclaw/agents/<agentId>/sessions/
```

**检查 2:** 重置窗口太短了吗?
```json
{
  "session": {
    "reset": {
      "mode": "daily",
      "atHour": 4,
      "idleMinutes": 10080  // 7 天
    }
  }
}
```

**检查 3:** 有人发送 `/new`、`/reset` 或重置触发器吗?

### 代理超时

默认超时为 30 分钟。对于长任务:

```json
{
  "reply": {
    "timeoutSeconds": 3600  // 1 小时
  }
}
```

或使用 `process` 工具将长命令放在后台。

### WhatsApp 已断开连接

```bash
# 检查本地状态(凭证、会话、排队事件)
openclaw status
# 探测正在运行的网关 + 通道(WA 连接 + Telegram + Discord API)
openclaw status --deep

# 查看最近的连接事件
openclaw logs --limit 200 | grep "connection\\|disconnect\\|logout"
```

**修复:** 通常在网关运行后自动重新连接。如果卡住,请重启网关进程(无论您如何监督它),或使用详细输出手动运行:

```bash
openclaw gateway --verbose
```

如果您已注销/取消链接:

```bash
openclaw channels logout
trash "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/credentials" # 如果注销无法完全删除所有内容
openclaw channels login --verbose       # 重新扫描二维码
```

### 媒体发送失败

**检查 1:** 文件路径有效吗?
```bash
ls -la /path/to/your/image.jpg
```

**检查 2:** 它太大了吗?
- 图片:最大 6MB
- 音频/视频:最大 16MB
- 文档:最大 100MB

**检查 3:** 检查媒体日志
```bash
grep "media\\|fetch\\|download" "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)" | tail -20
```

### 内存使用率高

OpenClaw 将对话历史记录保存在内存中。

**修复:** 定期重启或设置会话限制:
```json
{
  "session": {
    "historyLimit": 100  // 要保留的最大消息数
  }
}
```

## 常见故障排除

### "网关无法启动 — 配置无效"

OpenClaw 现在拒绝在配置包含未知键、格式错误的值或无效类型时启动。这是为了安全而故意的。

使用 Doctor 修复它:
```bash
openclaw doctor
openclaw doctor --fix
```

注意:
- `openclaw doctor` 报告每个无效条目。
- `openclaw doctor --fix` 应用迁移/修复并重写配置。
- 即使配置无效,诊断命令如 `openclaw logs`、`openclaw health`、`openclaw status`、`openclaw gateway status` 和 `openclaw gateway probe` 仍然运行。

### "所有模型都失败了" — 我应该首先检查什么?

- **凭证**是否存在用于正在尝试的提供商(身份验证配置文件 + 环境变量)。
- **模型路由**:确认 `agents.defaults.model.primary` 和后备是您可以访问的模型。
- `/tmp/openclaw/...` 中的**网关日志**以获取确切的提供商错误。
- **模型状态**:使用 `/model status`(聊天)或 `openclaw models status`(CLI)。

### 我在个人 WhatsApp 号码上运行 — 为什么自聊很奇怪?

启用自聊模式并将您自己的号码列入白名单:

```json5
{
  channels: {
    whatsapp: {
      selfChatMode: true,
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123"]
    }
  }
}
```

请参阅 [WhatsApp 设置](/channels/whatsapp)。

### WhatsApp 注销了我。我如何重新验证?

再次运行登录命令并扫描二维码:

```bash
openclaw channels login
```

### `main` 上的构建错误 — 标准修复路径是什么?

1) `git pull origin main && pnpm install`
2) `openclaw doctor`
3) 检查 GitHub issues 或 Discord
4) 临时解决方法:检出较旧的提交

### npm install 失败(allow-build-scripts / 缺少 tar 或 yargs)。现在怎么办?

如果您从源代码运行,请使用仓库的包管理器:**pnpm**(首选)。仓库声明 `packageManager: "pnpm@..."`。

典型恢复:
```bash
git status   # 确保您在仓库根目录
pnpm install
pnpm build
openclaw doctor
openclaw gateway restart
```

原因:pnpm 是此仓库配置的包管理器。

### 如何在 git 安装和 npm 安装之间切换?

使用**网站安装程序**并使用标志选择安装方法。它就地升级并重写网关服务以指向新安装。

切换**到 git 安装**:
```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --install-method git --no-onboard
```

切换**到 npm 全局**:
```bash
curl -fsSL https://openclaw.bot/install.sh | bash
```

注意:
- git 流程仅在仓库干净时重新定位。首先提交或暂存更改。
- 切换后,运行:
  ```bash
  openclaw doctor
  openclaw gateway restart
  ```

### Telegram 块流式传输未在工具调用之间拆分文本。为什么?

块流式传输仅发送**已完成的文本块**。您看到单个消息的常见原因:
- `agents.defaults.blockStreamingDefault` 仍然是 `"off"`。
- `channels.telegram.blockStreaming` 设置为 `false`。
- `channels.telegram.streamMode` 是 `partial` 或 `block` **且草稿流式传输处于活动状态**(私聊 + 主题)。草稿流式传输在这种情况下禁用块流式传输。
- 您的 `minChars` / 合并设置太高,因此块被合并。
- 模型发出一个大的文本块(没有中间回复刷新点)。

修复清单:
1) 将块流式传输设置放在 `agents.defaults` 下,而不是根目录。
2) 如果您想要真正的多消息块回复,请设置 `channels.telegram.streamMode: "off"`。
3) 在调试时使用较小的块/合并阈值。

请参阅[流式传输](/concepts/streaming)。

### Discord 即使使用 `requireMention: false` 也不会在我的服务器中回复。为什么?

`requireMention` 仅在通道通过白名单**之后**控制提及控制。默认情况下,`channels.discord.groupPolicy` 是 **allowlist**,因此必须明确启用服务器。如果设置 `channels.discord.guilds.<guildId>.channels`,则仅允许列出的通道;省略它以允许服务器中的所有通道。

修复清单:
1) 设置 `channels.discord.groupPolicy: "open"` **或**添加服务器白名单条目(并可选择性地添加通道白名单)。
2) 在 `channels.discord.guilds.<guildId>.channels` 中使用**数字通道 ID**。
3) 将 `requireMention: false` 放在 `channels.discord.guilds` **下**(全局或每个通道)。顶级 `channels.discord.requireMention` 不是受支持的键。
4) 确保机器人具有**消息内容意图**和通道权限。
5) 运行 `openclaw channels status --probe` 以获取审计提示。

文档:[Discord](/channels/discord),[通道故障排除](/channels/troubleshooting)。

### Cloud Code Assist API 错误:无效的工具模式(400)。现在怎么办?

这几乎总是**工具模式兼容性**问题。Cloud Code Assist 端点接受 JSON Schema 的严格子集。OpenClaw 在当前 `main` 中清理/规范化工具模式,但修复尚未在最后一个版本中(截至 2026 年 1 月 13 日)。

修复清单:
1) **更新 OpenClaw**:
   - 如果可以从源代码运行,请拉取 `main` 并重启网关。
   - 否则,等待包含模式清理器的下一个版本。
2) 避免不支持的关键字,如 `anyOf/oneOf/allOf`、`patternProperties`、`additionalProperties`、`minLength`、`maxLength`、`format` 等。
3) 如果定义自定义工具,请将顶级模式保持为 `type: "object"`,包含 `properties` 和简单枚举。

请参阅[工具](/tools)和 [TypeBox 模式](/concepts/typebox)。

## macOS 特定问题

### 授予权限时应用崩溃(语音/麦克风)

如果在隐私提示上单击"允许"时应用消失或显示"Abort trap 6":

**修复 1:重置 TCC 缓存**
```bash
tccutil reset All bot.molt.mac.debug
```

**修复 2:强制新 Bundle ID**
如果重置不起作用,请在 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 中更改 `BUNDLE_ID`(例如,添加 `.test` 后缀)并重建。这迫使 macOS 将其视为新应用。

### 网关卡在"正在启动..."

应用连接到端口 `18789` 上的本地网关。如果它一直卡住:

**修复 1:停止监督程序(首选)**
如果网关由 launchd 监督,终止 PID 只会重新生成它。首先停止监督程序:
```bash
openclaw gateway status
openclaw gateway stop
# 或:launchctl bootout gui/$UID/bot.molt.gateway(替换为 bot.molt.<profile>;旧版 com.openclaw.* 仍然有效)
```

**修复 2:端口忙(查找侦听器)**
```bash
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

如果是一个非监督的进程,请先尝试优雅停止,然后升级:
```bash
kill -TERM <PID>
sleep 1
kill -9 <PID> # 最后手段
```

**修复 3:检查 CLI 安装**
确保全局 `openclaw` CLI 已安装并与应用版本匹配:
```bash
openclaw --version
npm install -g openclaw@<version>
```

## 调试模式

获取详细日志记录:

```bash
# 在配置中打开跟踪日志记录:
#   ${OPENCLAW_CONFIG_PATH:-$HOME/.openclaw/openclaw.json} -> { logging: { level: "trace" } }
#
# 然后运行详细命令以将调试输出镜像到 stdout:
openclaw gateway --verbose
openclaw channels login --verbose
```

## 日志位置

| 日志 | 位置 |
|-----|----------|
| 网关文件日志(结构化) | `/tmp/openclaw/openclaw-YYYY-MM-DD.log`(或 `logging.file`) |
| 网关服务日志(监督程序) | macOS:`$OPENCLAW_STATE_DIR/logs/gateway.log` + `gateway.err.log`(默认:`~/.openclaw/logs/...`;配置文件使用 `~/.openclaw-<profile>/logs/...`)<br />Linux:`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`<br />Windows:`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST` |
| 会话文件 | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/` |
| 媒体缓存 | `$OPENCLAW_STATE_DIR/media/` |
| 凭证 | `$OPENCLAW_STATE_DIR/credentials/` |

## 健康检查

```bash
# 监督程序 + 探测目标 + 配置路径
openclaw gateway status
# 包括系统级扫描(旧版/额外服务、端口侦听器)
openclaw gateway status --deep

# 网关可达吗?
openclaw health --json
# 如果失败,请使用连接详细信息重新运行:
openclaw health --verbose

# 有东西在默认端口上侦听吗?
lsof -nP -iTCP:18789 -sTCP:LISTEN

# 最近活动(RPC 日志尾部)
openclaw logs --follow
# 如果 RPC 关闭,则回退
tail -20 /tmp/openclaw/openclaw-*.log
```

## 重置一切

核选项:

```bash
openclaw gateway stop
# 如果您安装了服务并希望全新安装:
# openclaw gateway uninstall

trash "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
openclaw channels login         # 重新配对 WhatsApp
openclaw gateway restart           # 或:openclaw gateway
```

⚠️ 这会丢失所有会话并需要重新配对 WhatsApp。

## 获取帮助

1. 首先检查日志:`/tmp/openclaw/`(默认:`openclaw-YYYY-MM-DD.log`,或您配置的 `logging.file`)
2. 在 GitHub 上搜索现有 issues
3. 打开新 issue,包括:
   - OpenClaw 版本
   - 相关日志片段
   - 重现步骤
   - 您的配置(编辑秘密!)

---

*"您试过关闭再打开吗?"* — 每个 IT 人员

🦞🔧

### 浏览器未启动(Linux)

如果您看到 `"Failed to start Chrome CDP on port 18800"`:

**最可能的原因:** Ubuntu 上的 Snap 打包的 Chromium。

**快速修复:** 改为安装 Google Chrome:
```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

然后在配置中设置:
```json
{
  "browser": {
    "executablePath": "/usr/bin/google-chrome-stable"
  }
}
```

**完整指南:** 请参阅 [browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
