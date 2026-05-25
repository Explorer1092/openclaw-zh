---
mmh3_hash: "563efd1e07dd82c35e2d8e953e3a9a7a"
title: "默认 AGENTS.md"
summary: "OpenClaw 个人助理设置的默认 Agent 指令和技能列表"
read_when:
  - 启动新的 OpenClaw Agent Session
  - 启用或审计默认技能
---

## 首次运行（推荐）

OpenClaw 为 Agent 使用专用的工作区目录。默认：`~/.openclaw/workspace`（可通过 `agents.defaults.workspace` 配置）。

1. 创建工作区（如果尚不存在）：

```bash
mkdir -p ~/.openclaw/workspace
```

2. 将默认工作区模板复制到工作区：

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 可选：如果需要个人助手技能列表，请将 AGENTS.md 替换为此文件：

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 可选：通过设置 `agents.defaults.workspace` 选择不同的工作区（支持 `~`）：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 安全默认值

- 不要将目录或机密转储到聊天中。
- 除非明确要求，否则不要运行破坏性命令。
- 在更改配置或调度器（例如 crontab、systemd units、nginx 配置或 shell rc 文件）之前，先检查现有状态，默认保留/合并。
- 不要向外部消息界面发送部分/流式回复（仅最终回复）。

## Session 开始（必需）

- 读取 `SOUL.md`、`USER.md`，以及 `memory/` 中的今天和昨天的文件。
- 如果 `MEMORY.md` 存在则读取。
- 在响应之前执行此操作。

## Soul（必需）

- `SOUL.md` 定义身份、语气和边界。保持更新。
- 如果更改了 `SOUL.md`，请告知用户。
- 每个 Session 都是全新实例；连续性保存在这些文件中。

## 共享空间（推荐）

- 不要充当用户的代言人；在群聊或公共 Channel 中要谨慎。
- 不要共享私人数据、联系方式或内部笔记。

## 记忆系统（推荐）

- 每日日志：`memory/YYYY-MM-DD.md`（如有需要，创建 `memory/` 目录）。
- 长期记忆：`MEMORY.md` 用于持久事实、偏好和决策。
- 小写的 `memory.md` 仅作为旧版修复输入；不要故意同时保留两个根文件。
- Session 开始时，读取今天 + 昨天 + `MEMORY.md`（如果存在）。
- 写入记忆文件前，先读取它们；只写入具体更新，不要写空占位符。
- 记录：决策、偏好、约束、待办事项。
- 除非明确要求，否则避免存储机密信息。

## 工具和技能

- 工具存在于技能中；需要时遵循每个技能的 `SKILL.md`。
- 在 `TOOLS.md`（技能注意事项）中保留环境特定的说明。

## 备份提示（推荐）

如果将此工作区视为 Clawd 的"记忆"，请将其设为 git 仓库（最好是私有的），以便备份 `AGENTS.md` 和记忆文件。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# 可选：添加私有远程并推送
```

## OpenClaw 的功能

- 运行 WhatsApp Gateway + Pi 编码 Agent，使助手能够通过主机 Mac 读写聊天、获取上下文并运行技能。
- macOS 应用管理权限（屏幕录制、通知、麦克风），并通过其捆绑的二进制文件提供 `openclaw` CLI。
- 直接聊天默认折叠到 Agent 的 `main` Session；群组以 `agent:<agentId>:<channel>:group:<id>` 保持隔离（房间/Channel：`agent:<agentId>:<channel>:channel:<id>`）；心跳保持后台任务存活。

## 核心技能（在设置 → 技能中启用）

- **mcporter** — 用于管理外部技能后端的工具服务器运行时/CLI。
- **Peekaboo** — 快速 macOS 截图，带可选 AI 视觉分析。
- **camsnap** — 从 RTSP/ONVIF 安全摄像头捕获帧、剪辑或运动警报。
- **oracle** — 带会话回放和浏览器控制的 OpenAI-ready Agent CLI。
- **eightctl** — 从终端控制睡眠设备。
- **imsg** — 发送、读取、流式传输 iMessage 和 SMS。
- **wacli** — WhatsApp CLI：同步、搜索、发送。
- **discord** — Discord 操作：反应、贴纸、投票。使用 `user:<id>` 或 `channel:<id>` 目标（裸数字 id 含义模糊）。
- **gog** — Google Suite CLI：Gmail、Calendar、Drive、Contacts。
- **spotify-player** — 终端 Spotify 客户端，用于搜索/排队/控制播放。
- **sag** — 带 mac 风格 say UX 的 ElevenLabs 语音；默认流式传输到扬声器。
- **Sonos CLI** — 从脚本控制 Sonos 扬声器（发现/状态/播放/音量/分组）。
- **blucli** — 从脚本播放、分组和自动化 BluOS 播放器。
- **OpenHue CLI** — Philips Hue 灯光控制，用于场景和自动化。
- **OpenAI Whisper** — 用于快速听写和语音信箱转录的本地语音转文字。
- **Gemini CLI** — 从终端访问 Google Gemini 模型，进行快速问答。
- **agent-tools** — 用于自动化和辅助脚本的实用工具包。

## 使用说明

- 脚本首选 `openclaw` CLI；mac 应用处理权限。
- 从技能选项卡运行安装；如果二进制文件已存在，按钮会被隐藏。
- 保持心跳启用，以便助手可以安排提醒、监控收件箱并触发摄像头捕获。
- Canvas UI 全屏运行，带原生覆盖层。避免将关键控件放在左上/右上/底部边缘；在布局中添加明确的边距，不要依赖安全区域内边距。
- 对于浏览器驱动的验证，使用 `openclaw browser`（标签页/状态/截图）配合 OpenClaw 管理的 Chrome 配置文件。
- 对于 DOM 检查，使用 `openclaw browser eval|query|dom|snapshot`（需要机器输出时加 `--json`/`--out`）。
- 对于交互，使用 `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run`（click/type 需要快照引用；CSS 选择器使用 `evaluate`）。

## 相关

- [Agent 工作区](/concepts/agent-workspace)
- [Agent 运行时](/concepts/agent)
