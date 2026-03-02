---
title: "语音唤醒"
sidebarTitle: "语音唤醒"
mmh3_hash: "0763bec9373c950103591d6669114087"
summary: "全局语音唤醒词 (Gateway 拥有) 以及它们如何在 Node 间同步"
read_when: ["更改语音唤醒词行为或默认值","添加需要唤醒词同步的新 Node 平台"]
---

# 语音唤醒 (全局唤醒词)

OpenClaw 将 **唤醒词视为由 Gateway 拥有的单个全局列表**。

- **没有每个 Node 的自定义唤醒词**。
- **任何 Node/应用 UI 都可以编辑** 该列表；更改由 Gateway 持久化并广播给所有人。
- macOS 和 iOS 保留本地**语音唤醒启用/禁用**开关（本地 UX + 权限不同）。
- Android 目前保持语音唤醒关闭，在 Voice 标签页中使用手动麦克风流程。

## 存储 (Gateway 主机)

唤醒词存储在 Gateway 机器上:

- `~/.openclaw/settings/voicewake.json`

形状:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## 协议

### 方法

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` 带参数 `{ triggers: string[] }` → `{ triggers: string[] }`

注意:

- 触发词被标准化（修剪，删除空值）。空列表回退到默认值。
- 强制执行限制以确保安全（计数/长度上限）。

### 事件

- `voicewake.changed` 载荷 `{ triggers: string[] }`

谁接收它:

- 所有 WebSocket 客户端 (macOS 应用, WebChat 等)
- 所有连接的 Node (iOS/Android)，以及在 Node 连接时作为初始"当前状态"推送。

## 客户端行为

### macOS 应用

- 使用全局列表来门控 `VoiceWakeRuntime` 触发。
- 在语音唤醒设置中编辑"触发词 (Trigger words)"会调用 `voicewake.set`，然后依靠广播来保持其他客户端同步。

### iOS Node

- 使用全局列表进行 `VoiceWakeManager` 触发检测。
- 在设置中编辑唤醒词会调用 `voicewake.set` (通过 Gateway WS)，并保持本地唤醒词检测响应。

### Android Node

- 语音唤醒目前在 Android 运行时/Settings 中已禁用。
- Android 语音使用 Voice 标签页中的手动麦克风捕获，而不是唤醒词触发。
