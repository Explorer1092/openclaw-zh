---
title: "语音叠加层生命周期 (macOS)"
sidebarTitle: "语音叠加层"
mmh3_hash: "2e1d0a7ff56d2ca8c68b7912cc6f26a6"
summary: "唤醒词和按下说话重叠时的语音叠加层生命周期"
read_when:
  - 调整语音叠加层行为
---
# 语音叠加层生命周期 (macOS)

受众:macOS 应用贡献者。目标:在唤醒词和按下说话重叠时保持语音叠加层可预测。

### 当前意图
- 如果叠加层已经从唤醒词可见,并且用户按下热键,热键会话*采用*现有文本,
  而不是重置它。叠加层在按住热键时保持打开。当用户释放时:如果有修剪的
  文本则发送,否则关闭。
- 仅唤醒词在静默时仍自动发送;按下说话在释放时立即发送。

### 已实现(2025 年 12 月 9 日)
- 叠加层会话现在为每个捕获(唤醒词或按下说话)携带令牌。当令牌不匹配时,
  部分/最终/发送/关闭/级别更新被丢弃,避免陈旧的回调。
- 按下说话采用任何可见的叠加层文本作为前缀(因此在唤醒叠加层打开时按下
  热键会保留文本并附加新语音)。它在回退到当前文本之前等待最多 1.5 秒
  以获得最终转录。
- 提示音/叠加层日志记录以 `info` 级别在类别 `voicewake.overlay`、
  `voicewake.ptt` 和 `voicewake.chime` 中发出(会话开始、部分、最终、
  发送、关闭、提示音原因)。

### 后续步骤
1. **VoiceSessionCoordinator(actor)**
   - 一次拥有一个 `VoiceSession`。
   - API(基于令牌):`beginWakeCapture`、`beginPushToTalk`、`updatePartial`、
     `endCapture`、`cancel`、`applyCooldown`。
   - 丢弃携带陈旧令牌的回调(防止旧识别器重新打开叠加层)。
2. **VoiceSession(模型)**
   - 字段:`token`、`source`(wakeWord|pushToTalk)、提交/易失性文本、
     提示音标志、计时器(自动发送、空闲)、`overlayMode`(display|editing|sending)、
     冷却截止时间。
3. **叠加层绑定**
   - `VoiceSessionPublisher`(`ObservableObject`)将活动会话镜像到 SwiftUI。
   - `VoiceWakeOverlayView` 仅通过发布者渲染;它从不直接改变全局单例。
   - 叠加层用户操作(`sendNow`、`dismiss`、`edit`)使用会话令牌回调到协调器。
4. **统一发送路径**
   - 在 `endCapture` 时:如果修剪的文本为空 → 关闭;否则 `performSend(session:)`
     (播放发送提示音一次、转发、关闭)。
   - 按下说话:无延迟;唤醒词:自动发送的可选延迟。
   - 在按下说话完成后对唤醒运行时应用短冷却,以便唤醒词不会立即重新触发。
5. **日志记录**
   - 协调器在子系统 `bot.molt`、类别 `voicewake.overlay` 和
     `voicewake.chime` 中发出 `.info` 日志。
   - 关键事件:`session_started`、`adopted_by_push_to_talk`、`partial`、
     `finalized`、`send`、`dismiss`、`cancel`、`cooldown`。

### 调试清单
- 在重现粘性叠加层时流式传输日志:

  ```bash
  sudo log stream --predicate 'subsystem == "bot.molt" AND category CONTAINS "voicewake"' --level info --style compact
  ```
- 验证只有一个活动会话令牌;陈旧的回调应该被协调器丢弃。
- 确保按下说话释放始终使用活动令牌调用 `endCapture`;如果文本为空,
  期望 `dismiss` 而没有提示音或发送。

### 迁移步骤(建议)
1. 添加 `VoiceSessionCoordinator`、`VoiceSession` 和 `VoiceSessionPublisher`。
2. 重构 `VoiceWakeRuntime` 以创建/更新/结束会话,而不是直接触摸
   `VoiceWakeOverlayController`。
3. 重构 `VoicePushToTalk` 以采用现有会话并在释放时调用 `endCapture`;
   应用运行时冷却。
4. 将 `VoiceWakeOverlayController` 连接到发布者;从 runtime/PTT 中删除直接调用。
5. 为会话采用、冷却和空文本关闭添加集成测试。
