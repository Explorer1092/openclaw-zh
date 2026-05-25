---
mmh3_hash: "d7d1abb4b6e1c118e2ddcf18b4e9c925"
summary: "Meeting Notes Plugin：捕获来自 Discord 语音和导入会议来源的转录文本，并生成摘要"
read_when:
  - 您想让 OpenClaw 记录会议笔记
  - 您正在将 Discord 语音、Google Meet、Slack 会议室或其他会议来源接入笔记系统
  - 您需要了解 meeting_notes 工具协议
title: "Meeting Notes plugin"
---

Meeting Notes Plugin 是用于实时通话和导入会议转录文本的通用笔记层。它负责转录存储、摘要渲染和 `meeting_notes` 工具。Channel Plugin 负责捕获、身份验证和特定平台的会议加入。

当您想让 OpenClaw 今天就捕获 Discord 语音笔记、从其他会议系统导入转录文本，或者正在构建 Google Meet、Slack 会议室、Zoom 或日历来源 Provider 时，请查看本页。

## 来源模型

会议来源通过 Plugin SDK 注册 `meetingNotesSourceProviders`。第一个实时 Provider 是 `discord-voice`；内置的 `manual-transcript` Provider 在会后导入转录文本。

- `live-audio`：来源加入或监听通话并流式传输最终发言。
- `live-caption`：来源从浏览器或会议界面读取字幕。
- `posthoc-transcript`：来源在会后导入转录文本或笔记工件。
- `recording-stt`：来源在导入发言前对录音进行语音转文字处理。

这种设计使 Discord、Google Meet、Slack 会议室和未来的会议接口与笔记引擎解耦。每个来源提供带说话人标记的发言；Meeting Notes 负责写入工件和摘要。

## 安装和启用

Meeting Notes 是本仓库中的外部来源 Plugin。它不属于核心 OpenClaw npm 包，仅在作为 Plugin 安装或从包含 `extensions/meeting-notes` 的源代码检出中加载后才可用。

加载 Plugin 后，除非以下设置之一阻止，否则默认启用：

- `plugins.enabled: false` 禁用所有 Plugin。
- `plugins.deny` 包含 `meeting-notes`。
- `plugins.allow` 已设置但不包含 `meeting-notes`。
- `plugins.entries.meeting-notes.enabled: false` 禁用此 Plugin 条目。
- `plugins.entries.meeting-notes.config.enabled: false` 保持 Plugin 加载但禁用 `meeting_notes` 工具和自动启动服务。

普通用户配置文件为 `~/.openclaw/openclaw.json`。`plugins` 部分控制 Plugin 加载，嵌套的 `entries.<pluginId>.config` 对象作为 Plugin 专用配置传递给该 Plugin。`meeting-notes` 下需要一个单独的 `config: { ... }` 块；这是 Plugin 在不向核心配置键添加内容的情况下接收自身选项的方式。

当配置具有 Plugin 白名单时，使用以下形式：

```json5
{
  plugins: {
    allow: ["discord", "meeting-notes"],
    entries: {
      "meeting-notes": {
        enabled: true,
        config: {
          enabled: true,
          maxUtterances: 2000,
          autoStart: [],
        },
      },
    },
  },
}
```

编辑后运行配置检查：

```bash
openclaw config validate
```

Gateway 配置热重载会应用 Plugin 白名单和 Plugin 条目变更。如果您同时更改来源 Plugin 本身、安装新的 Plugin 文件或更改 Discord 语音凭证，请重启 Gateway。

## 配置

Meeting Notes 有三个 Plugin 配置字段：

- `enabled`：默认 `true`。设置为 `false` 可保持 Plugin 安装但禁用工具和自动启动服务。
- `maxUtterances`：默认 `2000`。摘要生成仅读取 `transcript.jsonl` 中最新的 N 条发言；有效值被限制在 `1` 到 `10000` 之间。
- `autoStart`：默认为空。每个条目在 Gateway 启动或重新加载 Plugin 时启动一个实时笔记来源。

`autoStart` 条目接受以下字段：

- `providerId`：必填。Discord 语音使用 `discord-voice`。
- `enabled`：可选，默认 `true`。设置为 `false` 可保留条目但不启动。
- `sessionId`：可选。省略时，OpenClaw 生成带时间戳的 ID。
- `title`：可选，用于摘要和 CLI 输出的人类可读标题。
- `accountId`：可选，当存在多个账户时使用的来源账户 ID。
- `guildId`：Discord 特定的 Guild ID。
- `channelId`：Discord 特定的语音 Channel ID。
- `meetingUrl`：用于浏览器或日历来源的特定会议 URL。

当 OpenClaw 应在 Gateway 启动时自动开始笔记捕获时，使用 `autoStart`：

```json5
{
  plugins: {
    entries: {
      "meeting-notes": {
        config: {
          autoStart: [
            {
              providerId: "discord-voice",
              guildId: "123",
              channelId: "456",
              title: "每周计划",
            },
          ],
        },
      },
    },
  },
}
```

自动启动以 5 秒延迟最多重试 12 次启动失败。这让笔记服务可以等待 Discord 等 Channel Plugin 完成初始化。由自动启动启动的会话在 Plugin 服务干净停止时也会停止并生成摘要。

Discord 语音捕获仍需要正常的 Discord 语音设置和权限。参见 [Discord voice](/channels/discord#voice-mode)。

## Discord 语音

Discord 是第一个实时来源。Discord Plugin 负责语音连接、说话人检测、音频解码和转录。Meeting Notes 接收带说话人标记的最终发言并持久化。

对于 Discord 实时捕获：

- 首先启用并配置 Discord Plugin。
- 配置 Discord 语音模式，使 OpenClaw 可以加入目标语音 Channel。
- 使用 `providerId: "discord-voice"`。
- 提供 `guildId` 和 `channelId`。
- 仅当运行多个 Discord 账户时才添加 `accountId`。

转录模型不由 Meeting Notes 选择。在 Discord `stt-tts` 语音模式中，STT 使用 `tools.media.audio`；`voice.model` 控制 Agent 回复模型，而非转录。在实时语音模式中，转录遵循已配置的实时 Provider 和模型。参见 [Discord voice](/channels/discord#voice-mode) 了解当前 Discord 语音模型和 Provider 配置项。

## Google Meet、Slack 会议室和其他来源

Meeting Notes 刻意设计为来源中立。Google Meet、Slack 会议室、Zoom、日历录音或浏览器字幕捕获应作为独立的来源 Provider 通过 Plugin SDK 注册。

推荐的来源选择：

- Google Meet 实时浏览器/字幕支持：实现一个接受 `meetingUrl` 并发出最终字幕发言的 `live-caption` Provider。
- Google Meet 录音或下载的转录文本：实现 `posthoc-transcript` 或在 Provider 可用之前使用 `manual-transcript`。
- 当前的 Slack 会议室：导入会后的会议室笔记或转录工件。Slack 不提供通用机器人实时加入语音 API。
- 未来的 Slack 会议室：让 Slack 拥有的来源 Provider 负责 Slack Auth、工件查找和转录规范化。

笔记引擎不应包含平台加入、浏览器自动化、Slack API 轮询或 Discord 语音逻辑。这些属于拥有来源的 Plugin。

## 工具

使用带 `action` 的 `meeting_notes`：

- `status`：列出已注册的 Provider 和活跃会话。
- `start`：启动实时笔记会话。
- `stop`：停止实时会话并写入 `summary.md`。
- `import`：导入转录文本并写入 `summary.md`。
- `summarize`：为现有会话重新生成摘要。

Discord 实时笔记需要 `providerId: "discord-voice"`，加上 `guildId` 和 `channelId`。当只有一个 Discord 账户活跃时，`accountId` 是可选的。

```json
{
  "action": "start",
  "providerId": "discord-voice",
  "guildId": "123",
  "channelId": "456",
  "title": "每周计划"
}
```

按会话 ID 停止：

```json
{
  "action": "stop",
  "sessionId": "meeting-2026-05-22T10-00-00-000Z-a1b2c3d4"
}
```

导入转录文本：

```json
{
  "action": "import",
  "providerId": "manual-transcript",
  "title": "设计评审",
  "transcript": "Alex: 我们决定先发布 Discord 来源。\nSam: 行动项：稍后添加 Slack 会议室导入。"
}
```

`manual-transcript` 将纯文本转录文本分割为发言。可用于复制的 Google Meet 笔记、Slack 会议室摘要、日历转录文本或任何已生成文本的来源。

## 存储布局

工件存储在 OpenClaw 状态目录下：

```text
$OPENCLAW_STATE_DIR/meeting-notes/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

如果未设置 `OPENCLAW_STATE_DIR`，默认状态目录为 `~/.openclaw`。因此，普通本地安装将笔记写入 `~/.openclaw/meeting-notes/...`。

每个文件有其专属职责：

- `metadata.json`：会话 ID、来源 Provider、标题、开始时间、停止时间和 Provider 元数据。
- `transcript.jsonl`：仅追加的说话人发言。每行是一个包含发言文本和会话 ID 的 JSON 对象。
- `summary.json`：工具使用的结构化摘要数据，包括用于生成摘要的带说话人标记的转录窗口。
- `summary.md`：用于终端、编辑器和文档工作流的人类可读笔记，包含带说话人标记的转录部分。

日期目录来自会话开始时间，因此同一天的多个会议保持分组。如果人类会话 ID 在多天中重复，请使用 `openclaw meeting-notes list` 中的日期限定选择器，例如 `2026-05-22/standup`。

默认情况下，OpenClaw 生成带时间戳的会话 ID：

```text
meeting-2026-05-22T10-00-00-000Z-a1b2c3d4
```

这意味着同一天的十个会议将成为十个同级目录：

```text
~/.openclaw/meeting-notes/2026-05-22/
  meeting-2026-05-22T09-00-00-000Z-a1b2c3d4/
  meeting-2026-05-22T10-30-00-000Z-b2c3d4e5/
  meeting-2026-05-22T13-00-00-000Z-c3d4e5f6/
```

仅在该 ID 在当天唯一时才配置 `sessionId`。人类可读 ID（如 `standup`）适用于每天只有一次的定期会议。如果同一 ID 出现在多天，请在 CLI 中使用日期限定选择器。

## CLI 访问

使用只读 CLI 查找或打印存储的摘要：

```bash
openclaw meeting-notes list
openclaw meeting-notes show <session>
openclaw meeting-notes path <session>
openclaw meeting-notes path <session> --transcript
```

参见 [Meeting Notes CLI](/cli/meeting-notes) 了解完整命令参考。

## 长时间会议

对于长时间会议，发言在到达时追加到 `transcript.jsonl`。摘要生成读取由 `plugins.entries.meeting-notes.config.maxUtterances`（默认：`2000`）控制的有界窗口，因此多小时通话不需要无界摘要内存。

这意味着转录文本可以在磁盘上持续增长，而摘要生成保持有界。当您需要在生成的摘要和带说话人标记的转录部分中包含更多多小时会议内容时，增加 `maxUtterances`。当摘要过慢或过大时，减小此值。

当前摘要在会话停止、导入后或 `summarize` 操作运行时生成。它们不会为每条发言持续重写。

## 故障排除

### `meeting_notes` 缺失

检查 Plugin 是否已安装或从源代码加载，以及 Plugin 加载是否未排除它：

```bash
openclaw config validate
openclaw meeting-notes list
```

如果设置了 `plugins.allow`，它必须包含 `meeting-notes`。如果 `plugins.deny` 包含 `meeting-notes`，请将其删除。

### 自动启动未加入 Discord

确认 `autoStart` 条目使用 `providerId: "discord-voice"` 并同时包含 `guildId` 和 `channelId`。如果您运行多个 Discord 账户，请包含 `accountId`。同时通过 Discord 语音命令加入相同的语音 Channel 来验证 Discord 语音是否在 Meeting Notes 之外正常工作。

### 摘要缺失

实时会话在停止时写入 `summary.md`。使用 `meeting_notes` 操作 `stop` 停止会话，然后检查：

```bash
openclaw meeting-notes list
openclaw meeting-notes path <session>
```

使用 `meeting_notes` 操作 `summarize` 为现有存储会话重新生成 `summary.md`。

### 选择器不明确

如果您重复使用了人类会话 ID（如 `standup`），请使用 `openclaw meeting-notes list` 显示的日期限定选择器：

```bash
openclaw meeting-notes show 2026-05-22/standup
```

## 相关

- [Meeting Notes CLI](/cli/meeting-notes)
- [Discord voice](/channels/discord#voice-mode)
- [Plugin 管理](/tools/plugin)
- [Plugin 架构](/plugins/architecture)
