---
title: "菜单栏图标状态"
sidebarTitle: "菜单栏图标"
mmh3_hash: "f98052de0c6603677743c417a6e2552c"
summary: "macOS 上 OpenClaw 的菜单栏图标状态和动画"
read_when: ["更改菜单栏图标行为"]
---
# 菜单栏图标状态

作者:steipete · 更新:2025-12-06 · 范围:macOS 应用(`apps/macos`)

- **空闲:** 正常图标动画(眨眼、偶尔摇摆)。
- **暂停:** 状态项使用 `appearsDisabled`;无运动。
- **语音触发(大耳朵):** 语音唤醒检测器在听到唤醒词时调用
  `AppState.triggerVoiceEars(ttl: nil)`,在捕获话语时保持 `earBoostActive=true`。
  耳朵放大(1.9x),获得圆形耳孔以提高可读性,然后在 1 秒静默后通过
  `stopVoiceEars()` 下降。仅从应用内语音管道触发。
- **工作中(代理运行中):** `AppState.isWorking=true` 驱动"尾巴/腿快跑"
  微运动:工作进行中时更快的腿摇摆和轻微偏移。当前在 WebChat 代理运行周围
  切换;当你连接其他长任务时,添加相同的切换。

连接点
- 语音唤醒:运行时/测试器在触发时调用 `AppState.triggerVoiceEars(ttl: nil)`,
  并在 1 秒静默后调用 `stopVoiceEars()` 以匹配捕获窗口。
- 代理活动:在工作范围周围设置 `AppStateStore.shared.setWorking(true/false)`
  (已在 WebChat 代理调用中完成)。保持跨度简短并在 `defer` 块中重置,
  以避免卡住动画。

形状和大小
- 在 `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`
  中绘制基本图标。
- 耳朵缩放默认为 `1.0`;语音提升设置 `earScale=1.9` 并切换 `earHoles=true`,
  无需更改整体框架(18×18 pt 模板图像渲染到 36×36 px Retina 后备存储)。
- 快跑使用腿摇摆最多约 1.0 与小的水平抖动;它是对任何现有空闲摇摆的附加。

行为说明
- 耳朵/工作没有外部 CLI/代理切换;将其保留在应用自己的信号内部,
  以避免意外抖动。
- 保持 TTL 简短(&lt;10s),以便如果作业挂起,图标会快速返回基线。

## 相关文档

- [菜单栏](/platforms/mac/menu-bar)
- [macOS 应用](/platforms/macos)
