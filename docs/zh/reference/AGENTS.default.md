---
title: "AGENTS.md — OpenClaw 个人助手(默认)"
mmh3_hash: "54e4638a6a2511d3bc5e12eddc4df265"
summary: "个人助手设置的默认 OpenClaw 代理指令和技能名单"
read_when:
  - 启动新的 OpenClaw 代理会话
  - 启用或审计默认技能
---
# AGENTS.md — OpenClaw 个人助手(默认)

## 首次运行(推荐)

OpenClaw 为代理使用专用的工作空间目录。默认: `~/.openclaw/workspace`(可通过 `agents.defaults.workspace` 配置)。

1) 创建工作空间(如果尚不存在):

```bash
mkdir -p ~/.openclaw/workspace
```

2) 将默认工作空间模板复制到工作空间:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3) 可选: 如果您想要个人助手技能名单,请将 AGENTS.md 替换为此文件:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4) 可选: 通过设置 `agents.defaults.workspace` 选择不同的工作空间(支持 `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } }
}
```

## 安全默认值
- 不要将目录或机密转储到聊天中。
- 除非明确要求,否则不要运行破坏性命令。
- 不要向外部消息表面发送部分/流式回复(仅最终回复)。

## 会话开始(必需)
- 读取 `SOUL.md`、`USER.md`、`memory.md`,以及 `memory/` 中的今天和昨天。
- 在响应之前执行此操作。

## Soul(必需)
- `SOUL.md` 定义身份、语气和边界。保持最新。
- 如果您更改 `SOUL.md`,请告诉用户。
- 您是每个会话的新实例;连续性存在于这些文件中。

## 共享空间(推荐)
- 您不是用户的声音;在群聊或公共频道中要小心。
- 不要共享私人数据、联系信息或内部笔记。

## 内存系统(推荐)
- 每日日志: `memory/YYYY-MM-DD.md`(如果需要,创建 `memory/`)。
- 长期内存: `memory.md` 用于持久事实、偏好和决定。
- 在会话开始时,读取今天 + 昨天 + `memory.md`(如果存在)。
- 捕获: 决定、偏好、约束、开放循环。
- 除非明确要求,否则避免机密。

## 工具和技能
- 工具存在于技能中;当您需要时遵循每个技能的 `SKILL.md`。
- 在 `TOOLS.md`(技能注意事项)中保留特定于环境的注意事项。

## 备份提示(推荐)
如果您将此工作空间视为 Clawd 的"内存",请将其设为 git 仓库(最好是私有的),以便备份 `AGENTS.md` 和您的内存文件。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# 可选: 添加私有远程 + push
```

## OpenClaw 做什么
- 运行 WhatsApp 网关 + Pi 编码代理,以便助手可以通过主机 Mac 读/写聊天、获取上下文和运行技能。
- macOS 应用管理权限(屏幕录制、通知、麦克风)并通过其捆绑的二进制文件公开 `openclaw` CLI。
- 直接聊天默认情况下折叠到代理的 `main` 会话中;组保持隔离为 `agent:<agentId>:<channel>:group:<id>`(房间/频道: `agent:<agentId>:<channel>:channel:<id>`);心跳使后台任务保持活动。

## 核心技能(在设置 → 技能中启用)
- **mcporter** — 用于管理外部技能后端的工具服务器运行时/CLI。
- **Peekaboo** — 快速 macOS 截图,带可选 AI 视觉分析。
- **camsnap** — 从 RTSP/ONVIF 安全摄像头捕获帧、剪辑或运动警报。
- **oracle** — 具有会话重放和浏览器控制的 OpenAI-ready 代理 CLI。
- **eightctl** — 从终端控制您的睡眠。
- **imsg** — 发送、读取、流式传输 iMessage 和 SMS。
- **wacli** — WhatsApp CLI: 同步、搜索、发送。
- **discord** — Discord 操作: 反应、贴纸、投票。使用 `user:<id>` 或 `channel:<id>` 目标(裸数字 id 是模棱两可的)。
- **gog** — Google Suite CLI: Gmail、Calendar、Drive、Contacts。
- **spotify-player** — 终端 Spotify 客户端,用于搜索/排队/控制播放。
- **sag** — 具有 mac 风格 say UX 的 ElevenLabs 语音;默认流式传输到扬声器。
- **Sonos CLI** — 从脚本控制 Sonos 扬声器(发现/状态/播放/音量/分组)。
- **blucli** — 从脚本播放、分组和自动化 BluOS 播放器。
- **OpenHue CLI** — Philips Hue 照明控制,用于场景和自动化。
- **OpenAI Whisper** — 用于快速听写和语音邮件转录的本地语音转文本。
- **Gemini CLI** — 从终端获取 Google Gemini 模型以进行快速问答。
- **bird** — X/Twitter CLI,用于在没有浏览器的情况下发推、回复、阅读线程和搜索。
- **agent-tools** — 用于自动化和辅助脚本的实用工具包。

## 使用说明
- 对脚本首选 `openclaw` CLI;mac 应用处理权限。
- 从技能选项卡运行安装;如果已存在二进制文件,它会隐藏按钮。
- 保持心跳启用,以便助手可以安排提醒、监视收件箱和触发相机捕获。
- Canvas UI 以全屏运行,带有原生覆盖。避免将关键控件放在左上/右上/底部边缘;在布局中添加显式装订线,不要依赖安全区域插入。
- 对于浏览器驱动的验证,使用 `openclaw browser`(标签/状态/截图)与 OpenClaw 管理的 Chrome 配置文件。
- 对于 DOM 检查,使用 `openclaw browser eval|query|dom|snapshot`(当您需要机器输出时使用 `--json`/`--out`)。
- 对于交互,使用 `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run`(click/type 需要快照引用;对 CSS 选择器使用 `evaluate`)。
