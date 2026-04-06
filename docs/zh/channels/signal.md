---
mmh3_hash: "f76713a003eab8b6f20c1290035a4bb7"
summary: "通过 signal-cli (JSON-RPC + SSE) 提供 Signal 支持、设置路径和号码模型"
read_when:
  - 设置 Signal 支持
  - 调试 Signal 发送/接收
title: "Signal"
---

# Signal (signal-cli)

状态：外部 CLI 集成。Gateway 通过 HTTP JSON-RPC + SSE 与 `signal-cli` 通信。

## 先决条件

- 在服务器上安装 OpenClaw（以下 Linux 流程在 Ubuntu 24 上测试）。
- `signal-cli` 在 Gateway 运行的主机上可用。
- 一个可以接收验证短信的电话号码（用于 SMS 注册路径）。
- 浏览器访问 Signal 验证码（`signalcaptchas.org`）用于注册。

## 快速设置（初学者）

1. 为 bot 使用**单独的 Signal 号码**（推荐）。
2. 安装 `signal-cli`（如果使用 JVM 构建版本需要 Java）。
3. 选择一个设置路径：
   - **路径 A（二维码链接）：** `signal-cli link -n "OpenClaw"` 然后用 Signal 扫描。
   - **路径 B（SMS 注册）：** 使用验证码 + SMS 验证注册专用号码。
4. 配置 OpenClaw 并重启 Gateway。
5. 发送首条私信并批准配对（`openclaw pairing approve signal <CODE>`）。

最小配置：

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

字段参考：

| 字段 | 描述 |
| --- | --- |
| `account` | E.164 格式的 Bot 电话号码（`+15551234567`） |
| `cliPath` | `signal-cli` 的路径（如果在 `PATH` 中则为 `signal-cli`） |
| `dmPolicy` | DM 访问策略（推荐 `pairing`） |
| `allowFrom` | 允许发送 DM 的电话号码或 `uuid:<id>` 值 |

## 它是什么

- 通过 `signal-cli` 提供 Signal Channel（非嵌入式 libsignal）。
- 确定性路由：回复始终返回到 Signal。
- DM 共享 Agent 的主 Session；群组是隔离的（`agent:<agentId>:signal:group:<groupId>`）。

## 配置写入

默认情况下，Signal 允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

禁用方式：

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 号码模型（重要）

- Gateway 连接到一个 **Signal 设备**（`signal-cli` 账号）。
- 如果您在**个人 Signal 账号**上运行 bot，它将忽略您自己的消息（循环保护）。
- 对于"我给 bot 发消息然后它回复"，请使用**单独的 bot 号码**。

## 设置路径 A：链接现有 Signal 账号（二维码）

1. 安装 `signal-cli`（JVM 或原生构建）。
2. 链接 bot 账号：
   - `signal-cli link -n "OpenClaw"` 然后在 Signal 中扫描二维码。
3. 配置 Signal 并启动 Gateway。

示例：

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

多账户支持：使用 `channels.signal.accounts` 配置每个账户，可选 `name`。参见 [配置参考](/gateway/configuration-reference#multi-account-all-channels) 了解共享模式。

## 设置路径 B：注册专用 bot 号码（SMS，Linux）

当您想要专用 bot 号码而不是链接现有 Signal 应用账号时，使用此方式。

1. 获取一个可以接收 SMS 的号码（或用于座机的语音验证）。
   - 使用专用 bot 号码以避免账户/会话冲突。
2. 在 Gateway 主机上安装 `signal-cli`：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

如果使用 JVM 构建（`signal-cli-${VERSION}.tar.gz`），请先安装 JRE 25+。
保持 `signal-cli` 更新；上游指出旧版本可能因 Signal 服务器 API 更改而失效。

3. 注册并验证号码：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

如果需要验证码：

1. 打开 `https://signalcaptchas.org/registration/generate.html`。
2. 完成验证码，从"Open Signal"复制 `signalcaptcha://...` 链接目标。
3. 如果可能，从与浏览器会话相同的外部 IP 运行。
4. 立即重新运行注册（验证码 token 很快过期）：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. 配置 OpenClaw，重启 Gateway，验证 Channel：

```bash
# 如果您将 Gateway 作为用户 systemd 服务运行：
systemctl --user restart openclaw-gateway

# 然后验证：
openclaw doctor
openclaw channels status --probe
```

5. 配对您的 DM 发送者：
   - 向 bot 号码发送任何消息。
   - 在服务器上批准代码：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 将 bot 号码保存为手机上的联系人以避免"未知联系人"。

重要提示：使用 `signal-cli` 注册电话号码账户可能会取消该号码的主 Signal 应用会话的身份验证。优先使用专用 bot 号码，或者如果您需要保留现有手机应用设置，请使用二维码链接模式。

上游参考：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- 验证码流程：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 链接流程：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部守护进程模式（httpUrl）

如果您想自己管理 `signal-cli`（JVM 冷启动慢、容器初始化或共享 CPU），请单独运行守护进程并将 OpenClaw 指向它：

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

这会跳过 OpenClaw 内部的自动生成和启动等待。对于自动生成时启动缓慢的情况，请设置 `channels.signal.startupTimeoutMs`。

## 访问控制（DM + 群组）

DM：

- 默认：`channels.signal.dmPolicy = "pairing"`。
- 未知发送者会收到配对码；在批准之前消息将被忽略（码 1 小时后过期）。
- 批准方式：
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- 配对是 Signal DM 的默认 token 交换方式。详情：[Pairing](/channels/pairing)
- 仅 UUID 发送者（来自 `sourceUuid`）在 `channels.signal.allowFrom` 中存储为 `uuid:<id>`。

群组：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- 当设置为 `allowlist` 时，`channels.signal.groupAllowFrom` 控制谁可以在群组中触发。
- `channels.signal.groups["<group-id>" | "*"]` 可以用 `requireMention`、`tools` 和 `toolsBySender` 覆盖群组行为。
- 对于多账户设置中的每账户覆盖，使用 `channels.signal.accounts.<id>.groups`。
- 运行时注意：如果 `channels.signal` 完全缺失，运行时会回退到 `groupPolicy="allowlist"` 进行群组检查（即使 `channels.defaults.groupPolicy` 已设置）。

## 工作原理（行为）

- `signal-cli` 作为守护进程运行；Gateway 通过 SSE 读取事件。
- 入站消息被规范化为共享 Channel 信封。
- 回复始终路由回相同的号码或群组。

## 媒体和限制

- 出站文本按 `channels.signal.textChunkLimit` 分块（默认 4000）。
- 可选换行分块：设置 `channels.signal.chunkMode="newline"` 以在长度分块之前按空行（段落边界）分割。
- 支持附件（从 `signal-cli` 获取 base64）。
- 默认媒体上限：`channels.signal.mediaMaxMb`（默认 8）。
- 使用 `channels.signal.ignoreAttachments` 跳过媒体下载。
- 群组历史上下文使用 `channels.signal.historyLimit`（或 `channels.signal.accounts.*.historyLimit`），回退到 `messages.groupChat.historyLimit`。设置 `0` 禁用（默认 50）。

## 输入指示和已读回执

- **输入指示**：OpenClaw 通过 `signal-cli sendTyping` 发送输入信号，并在回复运行时刷新它们。
- **已读回执**：当 `channels.signal.sendReadReceipts` 为 true 时，OpenClaw 转发允许的 DM 的已读回执。
- Signal-cli 不公开群组的已读回执。

## Reaction（message 工具）

- 使用 `message action=react` 配合 `channel=signal`。
- 目标：发送者 E.164 或 UUID（使用配对输出中的 `uuid:<id>`；裸 UUID 也可以）。
- `messageId` 是您要回应的消息的 Signal 时间戳。
- 群组 reaction 需要 `targetAuthor` 或 `targetAuthorUuid`。

示例：

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

配置：

- `channels.signal.actions.reactions`：启用/禁用 reaction 操作（默认 true）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`。
  - `off`/`ack` 禁用 Agent reaction（message 工具 `react` 会报错）。
  - `minimal`/`extensive` 启用 Agent reaction 并设置指导级别。
- 每账户覆盖：`channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 投递目标（CLI/cron）

- DM：`signal:+15551234567`（或纯 E.164）。
- UUID DM：`uuid:<id>`（或裸 UUID）。
- 群组：`signal:group:<groupId>`。
- 用户名：`username:<name>`（如果您的 Signal 账号支持）。

## 故障排除

首先运行此阶梯：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

然后根据需要确认 DM pairing 状态：

```bash
openclaw pairing list signal
```

常见故障：

- 守护进程可达但无回复：验证账号/守护进程设置（`httpUrl`、`account`）和接收模式。
- DM 被忽略：发送者待 pairing 批准。
- 群组消息被忽略：群组发送者/提及门控阻止投递。
- 编辑后配置验证错误：运行 `openclaw doctor --fix`。
- 诊断中缺少 Signal：确认 `channels.signal.enabled: true`。

额外检查：

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

故障排除流程：[/channels/troubleshooting](/channels/troubleshooting)。

## 安全注意事项

- `signal-cli` 在本地存储账户密钥（通常为 `~/.local/share/signal-cli/data/`）。
- 在服务器迁移或重建之前备份 Signal 账户状态。
- 保持 `channels.signal.dmPolicy: "pairing"`，除非您明确希望更广泛的 DM 访问。
- SMS 验证仅用于注册或恢复流程，但失去对号码/账户的控制可能会使重新注册变得复杂。

## 配置参考（Signal）

完整配置：[配置](/gateway/configuration)

Provider 选项：

- `channels.signal.enabled`：启用/禁用 Channel 启动。
- `channels.signal.account`：bot 账号的 E.164。
- `channels.signal.cliPath`：`signal-cli` 的路径。
- `channels.signal.httpUrl`：完整守护进程 URL（覆盖 host/port）。
- `channels.signal.httpHost`、`channels.signal.httpPort`：守护进程绑定（默认 127.0.0.1:8080）。
- `channels.signal.autoStart`：自动生成守护进程（如果未设置 `httpUrl` 则默认 true）。
- `channels.signal.startupTimeoutMs`：启动等待超时（毫秒）（上限 120000）。
- `channels.signal.receiveMode`：`on-start | manual`。
- `channels.signal.ignoreAttachments`：跳过附件下载。
- `channels.signal.ignoreStories`：忽略守护进程的故事。
- `channels.signal.sendReadReceipts`：转发已读回执。
- `channels.signal.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.signal.allowFrom`：DM allowlist（E.164 或 `uuid:<id>`）。`open` 需要 `"*"`。Signal 没有用户名；使用电话/UUID id。
- `channels.signal.groupPolicy`：`open | allowlist | disabled`（默认：allowlist）。
- `channels.signal.groupAllowFrom`：群组发送者 allowlist。
- `channels.signal.groups`：按 Signal 群组 id（或 `"*"`）键入的每群组覆盖。支持的字段：`requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`：多账户设置中 `channels.signal.groups` 的每账户版本。
- `channels.signal.historyLimit`：作为上下文包含的最大群组消息数（0 禁用）。
- `channels.signal.dmHistoryLimit`：用户回合的 DM 历史限制。每用户覆盖：`channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`：出站分块大小（字符）。
- `channels.signal.chunkMode`：`length`（默认）或 `newline` 以在长度分块之前按空行（段落边界）分割。
- `channels.signal.mediaMaxMb`：入站/出站媒体上限（MB）。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（Signal 不支持原生提及）。
- `messages.groupChat.mentionPatterns`（全局回退）。
- `messages.responsePrefix`。

## 相关

- [Channels 概述](/channels) — 所有支持的 Channels
- [Pairing](/channels/pairing) — DM 认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
