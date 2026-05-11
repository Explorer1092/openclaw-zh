---
mmh3_hash: "2536b00ce2949f8c1f7f375fd3da4bad"
summary: "Google Meet Plugin：通过 Chrome 或 Twilio 加入显式 Meet URL，agent 回话为默认模式"
read_when:
  - 您希望 OpenClaw Agent 加入 Google Meet 通话
  - 您希望 OpenClaw Agent 创建新的 Google Meet 通话
  - 您正在将 Chrome、Chrome node 或 Twilio 配置为 Google Meet 传输
title: "Google Meet Plugin"
---

OpenClaw 的 Google Meet 参与者支持——该 Plugin 在设计上是显式的：

- 仅加入显式的 `https://meet.google.com/...` URL。
- 可以通过 Google Meet API 创建新的 Meet 空间，然后加入返回的 URL。
- `agent` 是默认回话模式：实时转录聆听，配置的 OpenClaw Agent 回答，普通 OpenClaw TTS 通过 Meet 说话。
- `bidi` 作为直接实时语音模型模式的回退仍然可用。
- Agent 使用 `mode` 选择加入行为：使用 `agent` 进行实时聆听/回话，使用 `bidi` 进行直接实时语音回退，或使用 `transcribe` 加入/控制浏览器而不启用回话桥接。
- 身份验证从个人 Google OAuth 或已登录的 Chrome 配置文件开始。
- 没有自动同意公告。
- 默认的 Chrome 音频后端是 `BlackHole 2ch`。
- Chrome 可以在本地或配对的节点主机上运行。
- Twilio 接受拨入号码加上可选的 PIN 或 DTMF 序列；它不能直接拨打 Meet URL。
- CLI 命令是 `googlemeet`；`meet` 保留用于更广泛的 Agent 电话会议工作流。

## 快速开始

安装本地音频依赖项并配置实时转录 Provider 加普通 OpenClaw TTS。OpenAI 是默认的转录 Provider；Google Gemini Live 也作为单独的 `bidi` 语音回退工作，使用 `realtime.voiceProvider: "google"`：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# 或
export GEMINI_API_KEY=...
```

`blackhole-2ch` 安装 `BlackHole 2ch` 虚拟音频设备。Homebrew 的安装程序需要重启后，macOS 才会公开该设备：

```bash
sudo reboot
```

重启后，验证两个部分：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

启用 Plugin：

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

检查设置：

```bash
openclaw googlemeet setup
```

设置输出旨在供 Agent 读取，并具有模式感知。它报告 Chrome 配置文件、节点固定，对于实时 Chrome 加入，还报告 BlackHole/SoX 音频桥接和延迟实时介绍检查。对于仅观察加入，使用 `--mode transcribe` 检查相同的传输；该模式跳过实时音频先决条件，因为它不通过桥接聆听或说话：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

在配置了 Twilio 委托时，设置还报告 `voice-call` Plugin、Twilio 凭据和公共 webhook 暴露是否准备就绪。在请求 Agent 加入之前，将任何 `ok: false` 检查视为已检查传输和模式的阻止器。使用 `openclaw googlemeet setup --json` 获取脚本或机器可读输出。使用 `--transport chrome`、`--transport chrome-node` 或 `--transport twilio` 在 Agent 尝试之前预检特定传输。

对于 Twilio，在默认传输是 Chrome 时始终明确预检传输：

```bash
openclaw googlemeet setup --transport twilio
```

这在 Agent 尝试拨号会议之前，捕获缺失的 `voice-call` 连接、Twilio 凭据或无法访问的 webhook 暴露。

加入会议：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或让 Agent 通过 `google_meet` 工具加入：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

在非 macOS 主机上，面向 Agent 的 `google_meet` 工具对工件、日历、设置、转录、Twilio 和 `chrome-node` 流程保持可用。本地 Chrome 回话操作在那里被阻止，因为捆绑的 Chrome 音频路径目前依赖于 macOS `BlackHole 2ch`。在 Linux 上，请使用 `mode: "transcribe"`、Twilio 拨入或 macOS `chrome-node` 主机进行 Chrome 回话参与。

创建新会议并加入：

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

对于 API 创建的房间，当您希望房间的免敲门策略明确而不是从 Google 账户默认值继承时，请使用 Google Meet `SpaceConfig.accessType`：

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` 让任何拥有 Meet URL 的人无需敲门即可加入。`TRUSTED` 让主机组织的受信任用户、受邀的外部用户和拨入用户无需敲门即可加入。`RESTRICTED` 限制免敲门进入仅限受邀者。这些设置仅适用于官方 Google Meet API 创建路径，因此必须配置 OAuth 凭据。

如果您在此选项可用之前进行了 Google Meet 身份验证，请在向 Google OAuth 同意屏幕添加 `meetings.space.settings` 范围后重新运行 `openclaw googlemeet auth login --json`。

仅创建 URL 而不加入：

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` 有两条路径：

- API 创建：在配置了 Google Meet OAuth 凭据时使用。这是最确定的路径，不依赖于浏览器 UI 状态。
- 浏览器回退：在没有 OAuth 凭据时使用。OpenClaw 使用固定的 Chrome 节点，打开 `https://meet.google.com/new`，等待 Google 重定向到真实的会议代码 URL，然后返回该 URL。此路径要求节点上的 OpenClaw Chrome 配置文件已登录 Google。浏览器自动化处理 Meet 自己的首次运行麦克风提示；该提示不被视为 Google 登录失败。加入和创建流程也会在打开新选项卡之前尝试重用现有的 Meet 选项卡。匹配会忽略无害的 URL 查询字符串（如 `authuser`），因此 Agent 重试应聚焦于已打开的会议而不是创建第二个 Chrome 选项卡。

命令/工具输出包含一个 `source` 字段（`api` 或 `browser`），以便 Agent 可以解释使用了哪条路径。`create` 默认加入新会议并返回 `joined: true` 加上加入 Session。要仅铸造 URL，请在 CLI 上使用 `create --no-join` 或向工具传递 `"join": false`。

或告诉 Agent："创建一个 Google Meet，用 agent 回话模式加入它，并把链接发给我。"Agent 应该用 `action: "create"` 调用 `google_meet`，然后分享返回的 `meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

对于仅观察/浏览器控制加入，请设置 `"mode": "transcribe"`。这不会启动双工实时语音桥接，不需要 BlackHole 或 SoX，也不会在会议中回话。Chrome 以此模式加入时也避免了 OpenClaw 的麦克风/摄像头权限授予，并避免了 Meet 的**使用麦克风**路径。如果 Meet 显示音频选择插页，自动化会尝试无麦克风路径，否则报告手动操作而不是打开本地麦克风。在转录模式下，受管理的 Chrome 传输还会安装尽力而为的 Meet 字幕观察器。`googlemeet status --json` 和 `googlemeet doctor` 显示 `captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText` 和短 `recentTranscript` 尾部，以便操作员可以判断浏览器是否加入了通话以及 Meet 字幕是否正在生成文本。当您需要是/否探测时，使用 `openclaw googlemeet test-listen <meet-url> --transport chrome-node`：它以转录模式加入，等待新鲜的字幕或转录移动，并返回 `listenVerified`、`listenTimedOut`、手动操作字段和最新字幕健康状况。

在实时 Session 期间，`google_meet` 状态包括浏览器和音频桥接健康状况，如 `inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最后输入/输出时间戳、字节计数器和桥接关闭状态。如果出现安全的 Meet 页面提示，浏览器自动化会在可以时处理它。登录、主机准入和浏览器/OS 权限提示会以手动操作的形式报告，包含原因和消息供 Agent 转达。受管理的 Chrome Session 仅在浏览器健康状况报告 `inCall: true` 后才发出介绍或测试短语；否则状态报告 `speechReady: false`，语音尝试被阻止，而不是假装 Agent 向会议说话。

本地 Chrome 通过已登录的 OpenClaw 浏览器配置文件加入。实时模式需要 `BlackHole 2ch` 作为 OpenClaw 使用的麦克风/扬声器路径。为了获得干净的双工音频，请使用独立的虚拟设备或 Loopback 风格的图形；单个 BlackHole 设备对于首次烟雾测试来说就足够了，但可能会产生回声。

### 本地 Gateway + Parallels Chrome

您**不**需要在 macOS 虚拟机中配置完整的 OpenClaw Gateway 或模型 API 密钥，只需让虚拟机拥有 Chrome 即可。在本地运行 Gateway 和 Agent，然后在虚拟机中运行节点主机。在虚拟机上启用一次 Bundle Plugin，以便节点发布 Chrome 命令：

各处运行的内容：

- Gateway 主机：OpenClaw Gateway、Agent 工作区、模型/API 密钥、实时 Provider 和 Google Meet Plugin 配置。
- Parallels macOS 虚拟机：OpenClaw CLI/节点主机、Google Chrome、SoX、BlackHole 2ch 和已登录 Google 的 Chrome 配置文件。
- 虚拟机中不需要：Gateway 服务、Agent 配置、OpenAI/GPT 密钥或模型 Provider 设置。

安装虚拟机依赖项：

```bash
brew install blackhole-2ch sox
```

安装 BlackHole 后重启虚拟机，以便 macOS 公开 `BlackHole 2ch`：

```bash
sudo reboot
```

重启后，验证虚拟机可以看到音频设备和 SoX 命令：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

在虚拟机中安装或更新 OpenClaw，然后启用 Bundle Plugin：

```bash
openclaw plugins enable google-meet
```

在虚拟机中启动节点主机：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

如果 `<gateway-host>` 是 LAN IP 且您未使用 TLS，节点会拒绝明文 WebSocket，除非您为该受信任的私有网络选择加入：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

将节点安装为 LaunchAgent 时使用相同的环境变量：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是进程环境，不是 `openclaw.json` 设置。`openclaw node install` 在安装命令中存在时，将其存储在 LaunchAgent 环境中。

从 Gateway 主机批准节点：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

确认 Gateway 看到该节点，并且它发布了 `googlemeet.chrome` 和浏览器能力/`browser.proxy`：

```bash
openclaw nodes status
```

在 Gateway 主机上通过该节点路由 Meet：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

现在从 Gateway 主机正常加入：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或要求 Agent 使用带有 `transport: "chrome-node"` 的 `google_meet` 工具。

对于创建或重用 Session、说出已知短语并打印 Session 健康状况的一次性烟雾测试：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

加入期间，OpenClaw 浏览器自动化填写访客名称，点击"加入/请求加入"，并在出现该提示时接受 Meet 的首次运行"使用麦克风"选项。在仅浏览器会议创建期间，如果 Meet 不公开使用麦克风按钮，它也可以在没有麦克风的情况下继续。如果浏览器配置文件未登录、Meet 正在等待主机准入、Chrome 需要麦克风/摄像头权限或 Meet 卡在自动化无法解决的提示上，加入/test-speech 结果报告 `manualActionRequired: true`，并附有 `manualActionReason` 和 `manualActionMessage` 供 Agent 转达。Agent 应停止重试加入，报告确切的消息加上当前的 `browserUrl`/`browserTitle`，并仅在手动浏览器操作完成后重试。

如果省略 `chromeNode.node`，OpenClaw 仅在恰好一个已连接节点发布了 `googlemeet.chrome` 和浏览器控制时才自动选择。如果有多个有能力的节点已连接，请将 `chromeNode.node` 设置为节点 id、显示名称或远程 IP。

常见故障检查：

- `Configured Google Meet node ... is not usable: offline`：固定节点已被 Gateway 知晓但不可用。Agent 应将该节点视为诊断状态，而不是可用的 Chrome 主机，并报告设置阻止器，而不是回退到另一种传输，除非用户要求这样做。
- `No connected Google Meet-capable node`：在虚拟机中启动 `openclaw node run`，批准配对，并确保在虚拟机中运行了 `openclaw plugins enable google-meet` 和 `openclaw plugins enable browser`。还要确认 Gateway 主机允许两个节点命令，使用 `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`。
- `BlackHole 2ch audio device not found`：在被检查的主机上安装 `blackhole-2ch` 并在使用本地 Chrome 音频之前重启。
- `BlackHole 2ch audio device not found on the node`：在虚拟机中安装 `blackhole-2ch` 并重启虚拟机。
- Chrome 打开但 Agent 无法加入：在虚拟机中登录浏览器配置文件，或保持设置 `chrome.guestName` 以进行访客加入。访客自动加入使用通过节点浏览器代理的 OpenClaw 浏览器自动化；确保节点浏览器配置指向您想要的配置文件，例如 `browser.defaultProfile: "user"` 或命名的现有 Session 配置文件。
- 重复的 Meet 选项卡：保持 `chrome.reuseExistingTab: true` 启用。OpenClaw 在打开新选项卡之前激活同一 Meet URL 的现有选项卡，浏览器会议创建在打开另一个选项卡之前重用正在进行的 `https://meet.google.com/new` 或 Google 账户提示选项卡。
- 没有音频：在 Meet 中，通过 OpenClaw 使用的虚拟音频设备路径路由麦克风/扬声器；使用独立的虚拟设备或 Loopback 风格的路由以获得干净的双工音频。

## 安装说明

Chrome 实时默认值使用两个外部工具：

- `sox`：命令行音频实用程序。该 Plugin 使用显式 CoreAudio 设备命令用于默认的 24 kHz PCM16 音频桥接。
- `blackhole-2ch`：macOS 虚拟音频驱动程序。它创建 Chrome/Meet 可以通过路由的 `BlackHole 2ch` 音频设备。

OpenClaw 不捆绑或重新分发任何一个包。文档要求用户通过 Homebrew 将它们作为主机依赖项安装。SoX 获得 `LGPL-2.0-only AND GPL-2.0-only` 许可；BlackHole 为 GPL-3.0。如果您构建捆绑 BlackHole 与 OpenClaw 的安装程序或设备，请审查 BlackHole 的上游许可条款或从 Existential Audio 获取单独的许可证。

## 传输

### Chrome

Chrome 传输在 Google Chrome 中打开 Meet URL，并以已登录的 Chrome 配置文件身份加入。在 macOS 上，Plugin 在启动前检查 `BlackHole 2ch`。如果配置了，它还会在打开 Chrome 之前运行音频桥接健康命令和启动命令。当 Chrome/音频位于 Gateway 主机上时使用 `chrome`；当 Chrome/音频位于配对节点（如 Parallels macOS 虚拟机）上时使用 `chrome-node`。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

通过本地 OpenClaw 音频桥接路由 Chrome 麦克风和扬声器音频。如果未安装 `BlackHole 2ch`，加入会失败并出现设置错误，而不是静默加入而没有音频路径。

### Twilio

Twilio 传输是委托给 Voice Call Plugin 的严格拨号计划。它不解析 Meet 页面以获取电话号码。

当 Chrome 参与不可用或您想要电话拨入回退时使用此功能。Google Meet 必须为会议公开电话拨入号码和 PIN；OpenClaw 不从 Meet 页面发现这些。

在 Gateway 主机上启用 Voice Call Plugin，而不是在 Chrome 节点上：

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // 如果 Twilio 应该是默认值，则设置 "twilio"
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

通过环境或配置提供 Twilio 凭据。环境将密钥保存在 `openclaw.json` 之外：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

如果那是您的实时语音 Provider，请改用带有 OpenAI Provider Plugin 的 `realtime.provider: "openai"` 和 `OPENAI_API_KEY`。

启用 `voice-call` 后重启或重新加载 Gateway；Plugin 配置更改不会出现在已运行的 Gateway 进程中，直到它重新加载。

然后验证：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

当配置了 Twilio 委托时，`googlemeet setup` 包含成功的 `twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和 `twilio-voice-call-webhook` 检查。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

当会议需要自定义序列时使用 `--dtmf-sequence`：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 和预检

OAuth 对于创建 Meet 链接是可选的，因为 `googlemeet create` 可以回退到浏览器自动化。当您需要官方 API 创建、空间解析或 Meet Media API 预检检查时，请配置 OAuth。

Google Meet API 访问使用用户 OAuth：创建 Google Cloud OAuth 客户端，请求所需范围，授权 Google 账户，然后将生成的刷新令牌存储在 Google Meet Plugin 配置中或提供 `OPENCLAW_GOOGLE_MEET_*` 环境变量。

OAuth 不替换 Chrome 加入路径。当您使用浏览器参与时，Chrome 和 Chrome 节点传输仍然通过已登录的 Chrome 配置文件、BlackHole/SoX 和已连接的节点加入。OAuth 仅用于官方 Google Meet API 路径：创建会议空间、解析空间和运行 Meet Media API 预检检查。

### 创建 Google 凭据

在 Google Cloud Console 中：

1. 创建或选择 Google Cloud 项目。
2. 为该项目启用 **Google Meet REST API**。
3. 配置 OAuth 同意屏幕。
   - **内部**对 Google Workspace 组织来说最简单。
   - **外部**适用于个人/测试设置；当应用处于测试状态时，将每个将授权该应用的 Google 账户添加为测试用户。
4. 添加 OpenClaw 请求的范围：
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. 创建 OAuth 客户端 ID。
   - 应用程序类型：**Web 应用程序**。
   - 授权的重定向 URI：

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 复制客户端 ID 和客户端密钥。

Google Meet `spaces.create` 需要 `meetings.space.created`。`meetings.space.readonly` 允许 OpenClaw 将 Meet URL/代码解析到空间。`meetings.space.settings` 允许 OpenClaw 在 API 房间创建期间传递 `SpaceConfig` 设置，如 `accessType`。`meetings.conference.media.readonly` 用于 Meet Media API 预检和媒体工作；Google 可能要求实际 Media API 使用需要开发者预览注册。如果您只需要基于浏览器的 Chrome 加入，请完全跳过 OAuth。

### 铸造刷新令牌

配置 `oauth.clientId` 和可选的 `oauth.clientSecret`，或将它们作为环境变量传递，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令打印带有刷新令牌的 `oauth` 配置块。它使用 PKCE、`http://localhost:8085/oauth2callback` 上的本地主机回调和带有 `--manual` 的手动复制/粘贴流程。

示例：

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

当浏览器无法访问本地回调时使用手动模式：

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON 输出包括：

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

在 Google Meet Plugin 配置下存储 `oauth` 对象：

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

当您不想在配置中包含刷新令牌时，优先使用环境变量。如果同时存在配置值和环境值，Plugin 首先解析配置，然后环境回退。

OAuth 同意包括 Meet 空间创建、Meet 空间读取访问权限和 Meet 会议媒体读取访问权限。如果您在会议创建支持存在之前进行了身份验证，请重新运行 `openclaw googlemeet auth login --json`，以便刷新令牌具有 `meetings.space.created` 范围。

### 使用 doctor 验证 OAuth

当您需要快速的非密钥健康检查时运行 OAuth doctor：

```bash
openclaw googlemeet doctor --oauth --json
```

这不会加载 Chrome 运行时或需要已连接的 Chrome 节点。它检查 OAuth 配置是否存在，以及刷新令牌是否可以铸造访问令牌。JSON 报告仅包含状态字段，如 `ok`、`configured`、`tokenSource`、`expiresAt` 和检查消息；它不打印访问令牌、刷新令牌或客户端密钥。

常见结果：

| 检查 | 含义 |
| --- | --- |
| `oauth-config` | `oauth.clientId` 加上 `oauth.refreshToken`，或缓存的访问令牌存在。 |
| `oauth-token` | 缓存的访问令牌仍然有效，或刷新令牌铸造了新的访问令牌。 |
| `meet-spaces-get` | 可选的 `--meeting` 检查解析了现有的 Meet 空间。 |
| `meet-spaces-create` | 可选的 `--create-space` 检查创建了新的 Meet 空间。 |

要同时证明 Google Meet API 启用和 `spaces.create` 范围，请运行有副作用的创建检查：

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` 创建一个临时 Meet URL。当您需要确认 Google Cloud 项目已启用 Meet API，且授权账户具有 `meetings.space.created` 范围时使用它。

要证明对现有会议空间的读取访问权限：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 和 `resolve-space` 证明对授权 Google 账户可以访问的现有空间的读取访问权限。这些检查的 `403` 通常意味着 Google Meet REST API 已禁用、同意的刷新令牌缺少所需范围或 Google 账户无法访问该 Meet 空间。刷新令牌错误意味着重新运行 `openclaw googlemeet auth login --json` 并存储新的 `oauth` 块。

浏览器回退不需要 OAuth 凭据。在该模式下，Google 身份验证来自所选节点上已登录的 Chrome 配置文件，而不是 OpenClaw 配置。

这些环境变量作为回退接受：

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` 或 `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 或 `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 或 `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` 或 `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` 或 `GOOGLE_MEET_PREVIEW_ACK`

通过 `spaces.get` 解析 Meet URL、代码或 `spaces/{id}`：

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

在媒体工作之前运行预检：

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

在 Meet 创建会议记录后，列出会议工件和出勤情况：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

使用 `--meeting` 时，`artifacts` 和 `attendance` 默认使用最新的会议记录。当您想要该会议的每条保留记录时，传递 `--all-conference-records`。

日历查找可以在读取 Meet 工件之前从 Google 日历解析会议 URL：

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 搜索今天的 `primary` 日历，查找包含 Google Meet 链接的日历事件。使用 `--event <query>` 搜索匹配的事件文本，使用 `--calendar <id>` 搜索非主日历。日历查找需要包含日历事件只读范围的新鲜 OAuth 登录。`calendar-events` 预览匹配的 Meet 事件，并标记 `latest`、`artifacts`、`attendance` 或 `export` 将选择的事件。

如果您已经知道会议记录 id，请直接处理它：

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

编写可读报告：

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` 返回会议记录元数据加上参与者、录制、转录、结构化转录条目和智能笔记资源元数据（当 Google 为会议公开时）。使用 `--no-transcript-entries` 跳过大型会议的条目查找。`attendance` 将参与者展开为带有第一次/最后一次看到时间、总 Session 持续时间、迟到/早退标志的参与者-Session 行，以及按已登录用户或显示名称合并的重复参与者资源。传递 `--no-merge-duplicates` 以保持原始参与者资源分离，`--late-after-minutes` 调整迟到检测，`--early-before-minutes` 调整早退检测。

`export` 写入一个包含 `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json` 和 `manifest.json` 的文件夹。`manifest.json` 记录所选输入、导出选项、会议记录、输出文件、计数、令牌来源、使用的日历事件（如果有）以及任何部分检索警告。传递 `--zip` 以在文件夹旁边写入便携存档。传递 `--include-doc-bodies` 通过 Google Drive `files.export` 导出链接的转录和智能笔记 Google Docs 文本；这需要包含 Drive Meet 只读范围的新鲜 OAuth 登录。没有 `--include-doc-bodies`，导出仅包括 Meet 元数据和结构化转录条目。如果 Google 返回部分工件失败，如智能笔记列表、转录条目或 Drive 文档正文错误，摘要和 Manifest 保留警告而不是使整个导出失败。使用 `--dry-run` 获取相同的工件/出勤数据并打印 Manifest JSON，而不创建文件夹或 ZIP。这在写入大型导出之前或 Agent 只需要计数、所选记录和警告时很有用。

Agent 也可以通过 `google_meet` 工具创建相同的包：

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

设置 `"dryRun": true` 仅返回导出 Manifest 并跳过文件写入。

Agent 也可以创建具有显式访问策略的 API 支持房间：

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

他们还可以结束已知房间的活动会议：

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

对于先听后说验证，Agent 应在声明会议有用之前使用 `test_listen`：

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

针对真实保留的会议运行有防护的实时烟雾：

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

运行针对会议（有人会发言并提供 Meet 字幕）的实时先听后说浏览器探测：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

实时烟雾环境：

- `OPENCLAW_LIVE_TEST=1` 启用有防护的实时测试。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` 指向保留的 Meet URL、代码或 `spaces/{id}`。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID` 提供 OAuth 客户端 id。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN` 提供刷新令牌。
- 可选：`OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、`OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 和 `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 使用相同的回退名称，不带 `OPENCLAW_` 前缀。

基础工件/出勤实时烟雾需要 `https://www.googleapis.com/auth/meetings.space.readonly` 和 `https://www.googleapis.com/auth/meetings.conference.media.readonly`。日历查找需要 `https://www.googleapis.com/auth/calendar.events.readonly`。Drive 文档正文导出需要 `https://www.googleapis.com/auth/drive.meet.readonly`。

创建新的 Meet 空间：

```bash
openclaw googlemeet create
```

该命令打印新的 `meeting uri`、来源和加入 Session。使用 OAuth 凭据时，它使用官方 Google Meet API。没有 OAuth 凭据时，它使用固定 Chrome 节点的已登录浏览器配置文件作为回退。Agent 可以使用带有 `action: "create"` 的 `google_meet` 工具在一个步骤中创建并加入。对于仅 URL 创建，传递 `"join": false`。

来自浏览器回退的 JSON 输出示例：

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

如果浏览器回退在创建 URL 之前遇到 Google 登录或 Meet 权限阻止，Gateway 方法返回失败响应，`google_meet` 工具返回结构化详情而不是简单字符串：

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

当 Agent 看到 `manualActionRequired: true` 时，它应该报告 `manualActionMessage` 加上浏览器节点/选项卡上下文，并在操作员完成浏览器步骤之前停止打开新的 Meet 选项卡。

来自 API 创建的 JSON 输出示例：

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

创建 Meet 默认会加入。Chrome 或 Chrome 节点传输仍然需要已登录的 Google Chrome 配置文件才能通过浏览器加入。如果配置文件已注销，OpenClaw 报告 `manualActionRequired: true` 或浏览器回退错误，并要求操作员在重试之前完成 Google 登录。

仅在确认您的 Cloud 项目、OAuth 主体和会议参与者已注册 Google Workspace Developer Preview Program 获取 Meet 媒体 API 后，才将 `preview.enrollmentAcknowledged: true` 设置为 `true`。

## 配置

常见的 Chrome agent 路径仅需要启用 Plugin、BlackHole、SoX、实时转录 Provider 密钥和配置的 OpenClaw TTS Provider。OpenAI 是默认的转录 Provider；设置 `realtime.voiceProvider` 为 `"google"` 并设置 `realtime.model` 以在不更改默认 agent 模式转录 Provider 的情况下使用 Google Gemini Live 进行 `bidi` 模式：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# 或
export GEMINI_API_KEY=...
```

在 `plugins.entries.google-meet.config` 下设置 Plugin 配置：

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

默认值：

- `defaultTransport: "chrome"`
- `defaultMode: "agent"`（`"realtime"` 仅作为旧版兼容性别名被接受用于 `"agent"`；新的工具调用应使用 `"agent"`）
- `chromeNode.node`：`chrome-node` 的可选节点 id/名称/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：在未登录的 Meet 访客屏幕上使用的名称
- `chrome.autoJoin: true`：通过 `chrome-node` 上的 OpenClaw 浏览器自动化进行尽力访客名称填写和"立即加入"点击
- `chrome.reuseExistingTab: true`：激活现有的 Meet 选项卡而不是打开重复项
- `chrome.waitForInCallMs: 20000`：在触发实时介绍之前等待 Meet 选项卡报告通话中
- `chrome.audioFormat: "pcm16-24khz"`：命令对音频格式。仅对仍发出电话音频的旧版/自定义命令对使用 `"g711-ulaw-8khz"`
- `chrome.audioBufferBytes: 4096`：生成的 Chrome 命令对音频命令的 SoX 处理缓冲区
- `chrome.audioInputCommand`：从 CoreAudio `BlackHole 2ch` 读取并以 `chrome.audioFormat` 写入音频的 SoX 命令
- `chrome.audioOutputCommand`：以 `chrome.audioFormat` 读取音频并写入 CoreAudio `BlackHole 2ch` 的 SoX 命令
- `chrome.bargeInInputCommand`：可选的本地麦克风命令，在助手播放活跃时写入用于人类打断检测的有符号 16 位小端单声道 PCM
- `chrome.bargeInRmsThreshold: 650`：在 `chrome.bargeInInputCommand` 上计为人类中断的 RMS 级别
- `chrome.bargeInPeakThreshold: 2500`：在 `chrome.bargeInInputCommand` 上计为人类中断的峰值级别
- `chrome.bargeInCooldownMs: 900`：重复人类中断清除之间的最小延迟
- `mode: "agent"`：默认回话模式。参与者语音由配置的实时转录 Provider 转录，最终参与者转录通过配置的 OpenClaw Agent 路由，答案通过普通 OpenClaw TTS 运行时说出。
- `mode: "bidi"`：回退直接双向实时模型模式。实时语音 Provider 直接回答参与者语音，并可以调用 `openclaw_agent_consult` 获取更深入/工具支持的回答。
- `mode: "transcribe"`：不带回话桥接的仅观察模式。
- `realtime.provider: "openai"`：在下面的范围 Provider 字段未设置时使用的兼容性回退。
- `realtime.transcriptionProvider: "openai"`：`agent` 模式用于实时转录的 Provider id。
- `realtime.voiceProvider`：`bidi` 模式用于直接实时语音的 Provider id。设置为 `"google"` 以在保持 agent 模式转录在 OpenAI 上的同时使用 Gemini Live。
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：简短的口头回复，带 `openclaw_agent_consult` 用于更深入的回答
- `realtime.introMessage`：实时桥接连接时的简短口头准备就绪检查；设置为 `""` 以静默加入
- `realtime.agentId`：`openclaw_agent_consult` 的可选 OpenClaw Agent id；默认为 `main`

可选覆盖：

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        voice: "Kore",
      },
    },
  },
}
```

ElevenLabs 同时用于 agent 模式聆听和说话：

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

持久的 Meet 语音来自 `messages.tts.providers.elevenlabs.voiceId`。

仅 Twilio 配置：

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` 默认为 `true`；使用 Twilio 传输时，它将实际的 PSTN 呼叫和 DTMF 委托给 Voice Call Plugin。如果 `voice-call` 未启用，Google Meet 仍然可以验证和记录拨号计划，但无法发起 Twilio 呼叫。

## 工具

Agent 可以使用 `google_meet` 工具：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

当 Chrome 在 Gateway 主机上运行时使用 `transport: "chrome"`。当 Chrome 在配对节点（如 Parallels 虚拟机）上运行时使用 `transport: "chrome-node"`。在这两种情况下，模型 Provider 和 `openclaw_agent_consult` 都在 Gateway 主机上运行，因此模型凭据保留在那里。使用默认的 `mode: "agent"` 时，实时转录 Provider 处理聆听，配置的 OpenClaw Agent 生成答案，普通 OpenClaw TTS 通过 Meet 说出。当您希望实时语音模型直接回答时，使用 `mode: "bidi"`。原始 `mode: "realtime"` 仍作为 `mode: "agent"` 的旧版兼容性别名被接受，但不再在 Agent 工具模式中发布。Agent 模式日志包括桥接启动时解析的转录 Provider/模型以及每次合成回复后的 TTS Provider、模型、语音、输出格式和采样率。

使用 `action: "status"` 列出活动 Session 或检查 Session ID。使用 `action: "speak"` 加上 `sessionId` 和 `message` 让实时 Agent 立即说话。使用 `action: "test_speech"` 创建或重用 Session，触发已知短语，并在 Chrome 主机可以报告时返回 `inCall` 健康状况。使用 `action: "leave"` 将 Session 标记为结束。

`status` 在可用时包括 Chrome 健康状况：

- `inCall`：Chrome 似乎在 Meet 通话中
- `micMuted`：尽力而为的 Meet 麦克风状态
- `manualActionRequired`/`manualActionReason`/`manualActionMessage`：浏览器配置文件需要手动登录、Meet 主机准入、权限或浏览器控制修复，语音才能工作
- `speechReady`/`speechBlockedReason`/`speechBlockedMessage`：受管理的 Chrome 语音现在是否被允许
- `providerConnected`/`realtimeReady`：实时语音桥接状态
- `lastInputAt`/`lastOutputAt`：最后一次从桥接看到或发送到桥接的音频
- `audioOutputRouted`/`audioOutputDeviceLabel`：Meet 选项卡的媒体输出是否被主动路由到桥接使用的 BlackHole 设备
- `lastSuppressedInputAt`/`suppressedInputBytes`：助手播放活跃时被忽略的回路输入

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Agent 和 bidi 模式

Chrome `agent` 模式针对"我的 Agent 在会议中"行为进行了优化。实时转录 Provider 听取会议音频，最终参与者转录通过配置的 OpenClaw Agent 路由，答案通过普通 OpenClaw TTS 运行时说出。当您希望实时语音模型直接回答时，设置 `mode: "bidi"`。附近的最终转录片段在咨询之前合并，以便一次口头发言不会产生几个过时的部分答案。当排队的助手音频仍在播放时，实时输入也被抑制，并且在 Agent 咨询之前忽略最近的类似助手转录回声，以防止 BlackHole 回路使 Agent 回答自己的语音。

| 模式     | 谁决定答案                  | 语音输出路径                        | 使用时机                                                  |
| -------- | --------------------------- | ----------------------------------- | --------------------------------------------------------- |
| `agent`  | 配置的 OpenClaw Agent       | 普通 OpenClaw TTS 运行时            | 您想要"我的 Agent 在会议中"行为                           |
| `bidi`   | 实时语音模型                | 实时语音 Provider 音频响应          | 您想要最低延迟的对话式语音循环                            |

在 `bidi` 模式下，当实时模型需要更深层推理、当前信息或正常的 OpenClaw 工具时，它可以调用 `openclaw_agent_consult`。

咨询工具在幕后用最近的会议转录上下文运行常规 OpenClaw Agent，并返回简洁的口头答案。在 `agent` 模式下，OpenClaw 将该答案直接发送到 TTS 运行时；在 `bidi` 模式下，实时语音模型可以将咨询结果说回会议。它使用与 Voice Call 相同的共享咨询机制。

默认情况下，咨询针对 `main` Agent 运行。当 Meet 通道应咨询专用的 OpenClaw Agent 工作区、模型默认值、工具策略、内存和 Session 历史时，设置 `realtime.agentId`。

Agent 模式咨询使用每会议的 `agent:<id>:subagent:google-meet:<session>` Session 键，以便后续问题保持会议上下文，同时从配置的 Agent 继承正常的 Agent 策略。

`realtime.toolPolicy` 控制咨询运行：

- `safe-read-only`：公开咨询工具，并将常规 Agent 限制为 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。
- `owner`：公开咨询工具，让常规 Agent 使用正常的 Agent 工具策略。
- `none`：不向实时语音模型公开咨询工具。

咨询 Session 键的范围限定于每个 Meet Session，因此后续咨询调用可以在同一会议期间重用先前的咨询上下文。

在 Chrome 完全加入通话后强制进行口头准备就绪检查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

对于完整的加入和说话烟雾：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 实时测试清单

在将会议交给无人值守的 Agent 之前，使用此序列：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

预期的 Chrome 节点状态：

- `googlemeet setup` 全部绿色。
- 当 Chrome 节点是默认传输或节点已固定时，`googlemeet setup` 包含 `chrome-node-connected`。
- `nodes status` 显示所选节点已连接。
- 所选节点发布了 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 选项卡加入通话，`test-speech` 返回带有 `inCall: true` 的 Chrome 健康状况。

对于远程 Chrome 主机（如 Parallels macOS 虚拟机），这是更新 Gateway 或虚拟机后的最短安全检查：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

这在 Agent 打开真实会议选项卡之前，证明 Gateway Plugin 已加载、虚拟机节点以当前令牌连接，以及 Meet 音频桥接可用。

对于 Twilio 烟雾，使用公开电话拨入详情的会议：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

预期的 Twilio 状态：

- `googlemeet setup` 包含绿色的 `twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和 `twilio-voice-call-webhook` 检查。
- Gateway 重新加载后，`voicecall` 在 CLI 中可用。
- 返回的 Session 包含 `transport: "twilio"` 和 `twilio.voiceCallId`。
- `openclaw logs --follow` 显示在实时 TwiML 之前提供的 DTMF TwiML，然后是带有初始问候排队的实时桥接。
- `googlemeet leave <sessionId>` 挂断委托的语音通话。

## 故障排除

### Agent 看不到 Google Meet 工具

确认 Plugin 在 Gateway 配置中已启用并重新加载 Gateway：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果您刚刚编辑了 `plugins.entries.google-meet`，请重启或重新加载 Gateway。运行中的 Agent 只看到当前 Gateway 进程注册的 Plugin 工具。

### 没有已连接的 Google Meet 有能力的节点

在节点主机上运行：

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

在 Gateway 主机上批准节点并验证命令：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

节点必须已连接并列出 `googlemeet.chrome` 加上 `browser.proxy`。Gateway 配置必须允许这些节点命令：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

如果 `googlemeet setup` 失败 `chrome-node-connected` 或 Gateway 日志报告 `gateway token mismatch`，请使用当前 Gateway 令牌重新安装或重启节点。对于 LAN Gateway，这通常意味着：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

然后重新加载节点服务并重新运行：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### 浏览器打开但 Agent 无法加入

运行 `googlemeet test-speech` 并检查返回的 Chrome 健康状况。如果报告 `manualActionRequired: true`，向操作员显示 `manualActionMessage` 并停止重试，直到浏览器操作完成。

常见的手动操作：

- 登录 Chrome 配置文件。
- 从 Meet 主机账户接纳访客。
- 当 Chrome 的原生权限提示出现时，授予 Chrome 麦克风/摄像头权限。
- 关闭或修复卡住的 Meet 权限对话框。

不要仅因为 Meet 显示"您是否希望人们在会议中听到您？"就报告"未登录"。这是 Meet 的音频选择插页；OpenClaw 在可用时通过浏览器自动化点击**使用麦克风**，并继续等待真实的会议状态。对于仅创建浏览器回退，OpenClaw 可能会点击**继续而不使用麦克风**，因为创建 URL 不需要实时音频路径。

### 会议创建失败

`googlemeet create` 在配置了 OAuth 凭据时首先使用 Google Meet API `spaces.create` 端点。没有 OAuth 凭据时，它回退到固定 Chrome 节点浏览器。确认：

- 对于 API 创建：`oauth.clientId` 和 `oauth.refreshToken` 已配置，或存在匹配的 `OPENCLAW_GOOGLE_MEET_*` 环境变量。
- 对于 API 创建：刷新令牌是在添加创建支持后铸造的。较旧的令牌可能缺少 `meetings.space.created` 范围；重新运行 `openclaw googlemeet auth login --json` 并更新 Plugin 配置。
- 对于浏览器回退：`defaultTransport: "chrome-node"` 和 `chromeNode.node` 指向具有 `browser.proxy` 和 `googlemeet.chrome` 的已连接节点。
- 对于浏览器回退：该节点上的 OpenClaw Chrome 配置文件已登录 Google，可以打开 `https://meet.google.com/new`。
- 对于浏览器回退：重试在打开新选项卡之前重用现有的 `https://meet.google.com/new` 或 Google 账户提示选项卡。如果 Agent 超时，请重试工具调用而不是手动打开另一个 Meet 选项卡。
- 对于浏览器回退：如果工具返回 `manualActionRequired: true`，请使用返回的 `browser.nodeId`、`browser.targetId`、`browserUrl` 和 `manualActionMessage` 来指导操作员。在该操作完成之前不要循环重试。
- 对于浏览器回退：如果 Meet 显示"您是否希望人们在会议中听到您？"，请保持选项卡打开。OpenClaw 应通过浏览器自动化点击**使用麦克风**，或对于仅创建回退点击**继续而不使用麦克风**，并继续等待生成的 Meet URL。如果无法做到，错误应该提到 `meet-audio-choice-required`，而不是 `google-login-required`。

### Agent 加入但不说话

检查实时路径：

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

使用 `mode: "agent"` 获取正常的 STT -> OpenClaw Agent -> TTS 回话路径，或 `mode: "bidi"` 获取直接实时语音回退。`mode: "transcribe"` 故意不启动回话桥接。对于仅观察调试，在参与者说话后运行 `openclaw googlemeet status --json <session-id>` 并检查 `captioning`、`transcriptLines` 和 `lastCaptionText`。如果 `inCall` 为 true 但 `transcriptLines` 保持为 `0`，则 Meet 字幕可能被禁用、自观察者安装以来没有人说话、Meet UI 已更改，或会议语言/账户不支持实时字幕。

`googlemeet test-speech` 始终检查实时路径并报告是否为该调用观察到桥接输出字节。如果 `speechOutputVerified` 为 false 且 `speechOutputTimedOut` 为 true，则实时 Provider 可能已接受话语，但 OpenClaw 未看到新的输出字节到达 Chrome 音频桥接。

还要验证：

- Gateway 主机上有可用的实时 Provider 密钥，如 `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- `BlackHole 2ch` 在 Chrome 主机上可见。
- `sox` 在 Chrome 主机上存在。
- Meet 麦克风和扬声器通过 OpenClaw 使用的虚拟音频路径路由。`doctor` 对于本地 Chrome 实时加入应显示 `meet output routed: yes`。

`googlemeet doctor [session-id]` 打印 Session、节点、通话状态、手动操作原因、实时 Provider 连接、`realtimeReady`、音频输入/输出活动、最后音频时间戳、字节计数器和浏览器 URL。当您需要原始 JSON 时使用 `googlemeet status [session-id]`。当您需要验证 Google Meet OAuth 刷新而不暴露令牌时使用 `googlemeet doctor --oauth`；当您还需要 Google Meet API 证明时添加 `--meeting` 或 `--create-space`。

如果 Agent 超时，您可以看到已打开的 Meet 选项卡，请在不打开另一个选项卡的情况下检查该选项卡：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等效的工具操作是 `recover_current_tab`。它聚焦并检查所选传输的现有 Meet 选项卡。使用 `chrome` 时，它通过 Gateway 使用本地浏览器控制；使用 `chrome-node` 时，它使用配置的 Chrome 节点。它不打开新选项卡或创建新 Session；它报告当前阻止器，如登录、准入、权限或音频选择状态。CLI 命令与配置的 Gateway 通信，因此 Gateway 必须运行；`chrome-node` 还需要 Chrome 节点已连接。

### Twilio 设置检查失败

`twilio-voice-call-plugin` 在 `voice-call` 未允许或未启用时失败。将其添加到 `plugins.allow`，启用 `plugins.entries.voice-call`，并重新加载 Gateway。

`twilio-voice-call-credentials` 在 Twilio 后端缺少账户 SID、身份验证令牌或呼叫者号码时失败。在 Gateway 主机上设置这些：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` 在 `voice-call` 没有公共 webhook 暴露时失败，或 `publicUrl` 指向回路或私有网络空间时失败。将 `plugins.entries.voice-call.config.publicUrl` 设置为公共 Provider URL 或配置 `voice-call` 隧道/Tailscale 暴露。

回路和私有 URL 对运营商回调无效。不要使用 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 作为 `publicUrl`。

对于稳定的公共 URL：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

对于本地开发，请使用隧道或 Tailscale 暴露而不是私有主机 URL：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // 或
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

然后重启或重新加载 Gateway 并运行：

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` 默认仅检查准备情况。要对特定号码进行空运行：

```bash
openclaw voicecall smoke --to "+15555550123"
```

仅当您有意想要发起实时出站通知呼叫时才添加 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 呼叫开始但从未进入会议

确认 Meet 事件公开了电话拨入详情。传递确切的拨入号码和 PIN 或自定义 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果 Provider 在输入 PIN 之前需要暂停，请在 `--dtmf-sequence` 中使用前导 `w` 或逗号。

如果电话通话已创建但 Meet 花名册从未显示拨入参与者：

- 运行 `openclaw googlemeet doctor <session-id>` 以确认委托的 Twilio 呼叫 ID、DTMF 是否已排队，以及是否已请求介绍问候。
- 运行 `openclaw voicecall status --call-id <id>` 并确认通话仍然活跃。
- 运行 `openclaw voicecall tail` 并检查 Twilio webhook 是否到达 Gateway。
- 运行 `openclaw logs --follow` 并查找 Twilio Meet 序列：Google Meet 委托加入，Voice Call 存储并提供预连接 DTMF TwiML，Voice Call 为 Twilio 通话提供实时 TwiML，然后 Google Meet 使用 `voicecall.speak` 请求介绍语音。
- 重新运行 `openclaw googlemeet setup --transport twilio`；绿色设置检查是必要的，但不能证明会议 PIN 序列是正确的。
- 确认拨入号码属于与 PIN 相同的 Meet 邀请和地区。
- 如果 Meet 回答缓慢或通话记录在发送预连接 DTMF 后仍显示要求 PIN 的提示，请将 `voiceCall.dtmfDelayMs` 从 12 秒默认值提高。
- 如果参与者加入但您没有听到问候，请检查 `openclaw logs --follow` 中的 DTMF 后 `voicecall.speak` 请求以及媒体流 TTS 播放或 Twilio `<Say>` 回退。如果通话记录仍然包含"输入会议 PIN"，则电话端尚未加入 Meet 房间，因此会议参与者不会听到语音。

如果 webhook 未到达，请首先调试 Voice Call Plugin：Provider 必须能够访问 `plugins.entries.voice-call.config.publicUrl` 或配置的隧道。请参见 [Voice call 故障排除](/plugins/voice-call#troubleshooting)。

## 说明

Google Meet 的官方媒体 API 是面向接收的，因此向 Meet 通话说话仍然需要参与者路径。该 Plugin 保持该边界可见：Chrome 处理浏览器参与和本地音频路由；Twilio 处理电话拨入参与。

Chrome 回话模式需要 `BlackHole 2ch` 加以下之一：

- `chrome.audioInputCommand` 加上 `chrome.audioOutputCommand`：OpenClaw 拥有桥接，并在这些命令和所选 Provider 之间以 `chrome.audioFormat` 传输音频。Agent 模式使用实时转录加普通 TTS；bidi 模式使用实时语音 Provider。默认 Chrome 路径是 24 kHz PCM16，`chrome.audioBufferBytes: 4096`；8 kHz G.711 mu-law 对旧版命令对仍然可用。
- `chrome.audioBridgeCommand`：外部桥接命令拥有整个本地音频路径，并且必须在启动或验证其守护程序后退出。这仅对 `bidi` 有效，因为 `agent` 模式需要直接命令对访问用于 TTS。

为了获得干净的双工音频，请通过独立的虚拟设备或 Loopback 风格的虚拟设备图形路由 Meet 输出和 Meet 麦克风。单个共享的 BlackHole 设备可能会将其他参与者的声音回声到通话中。

当 Agent 以 agent 模式调用 `google_meet` 工具时，会议咨询 Session 在回答参与者语音之前分叉调用者的当前转录。Meet Session 仍然保持独立（`agent:<agentId>:subagent:google-meet:<sessionId>`），因此会议后续问题不会直接改变调用者转录。

对于干净的双工音频，通过独立的虚拟设备或 Loopback 风格的虚拟设备图形路由 Meet 输出和 Meet 麦克风。单个共享的 BlackHole 设备可能会将其他参与者的声音回声到通话中。

使用命令对 Chrome 桥接时，`chrome.bargeInInputCommand` 可以监听独立的本地麦克风，并在人类开始说话时清除助手播放。这使人类语音领先于助手输出，即使在助手播放期间共享的 BlackHole 回路输入暂时被抑制时也是如此。与 `chrome.audioInputCommand` 和 `chrome.audioOutputCommand` 一样，它是操作员配置的本地命令。使用显式的可信命令路径或参数列表，不要将其指向来自不可信位置的脚本。

`googlemeet speak` 为 Chrome Session 触发活动的回话音频桥接。`googlemeet leave` 停止该桥接。对于通过 Voice Call Plugin 委托的 Twilio Session，`leave` 也会挂断底层语音通话。当您还想关闭 API 管理空间的活动 Google Meet 会议时，使用 `googlemeet end-active-conference`。

## 相关

- [Voice call Plugin](/plugins/voice-call)
- [Talk 模式](/nodes/talk)
- [构建 Plugin](/plugins/building-plugins)
