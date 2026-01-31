---
title: "语音唤醒 (全局唤醒词)"
mmh3_hash: "6fd0a067a8ac5ca2f013aff03e856893"
summary: "全局语音唤醒词 (网关拥有) 以及它们如何在节点间同步"
read_when:
  - 更改语音唤醒词行为或默认值
  - 添加需要唤醒词同步的新节点平台
---
# 语音唤醒 (全局唤醒词)

OpenClaw 将 **唤醒词视为由网关拥有的单个全局列表**。

- **没有每个节点的自定义唤醒词**。
- **任何节点/应用 UI 都可以编辑** 该列表；更改由网关持久化并广播给所有人。
- 每个设备仍然保留自己的 **语音唤醒启用/禁用** 开关 (本地 UX + 权限不同)。

## 存储 (网关主机)

唤醒词存储在网关机器上：

- `~/.openclaw/settings/voicewake.json`

形状：

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## 协议

### 方法

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` 带参数 `{ triggers: string[] }` → `{ triggers: string[] }`

注意：
- 触发词被标准化（修剪，删除空值）。空列表回退到默认值。
- 强制执行限制以确保安全（计数/长度上限）。

### 事件

- `voicewake.changed` 载荷 `{ triggers: string[] }`

谁接收它：
- 所有 WebSocket 客户端 (macOS 应用, WebChat 等)
- 所有连接的节点 (iOS/Android)，以及在节点连接时作为初始“当前状态”推送。

## 客户端行为

### macOS 应用

- 使用全局列表来门控 `VoiceWakeRuntime` 触发。
- 在语音唤醒设置中编辑“触发词 (Trigger words)”会调用 `voicewake.set`，然后依靠广播来保持其他客户端同步。

### iOS 节点

- 使用全局列表进行 `VoiceWakeManager` 触发检测。
- 在设置中编辑唤醒词会调用 `voicewake.set` (通过网关 WS)，并保持本地唤醒词检测响应。

### Android 节点

- 在设置中暴露唤醒词编辑器。
- 通过网关 WS 调用 `voicewake.set`，以便编辑同步到任何地方。
