---
mmh3_hash: "c9501a7c1343f150c669cc33d8efe6f4"
summary: "节点的位置命令 (location.get)，权限模式和后台行为"
read_when:
  - 添加位置节点支持或权限 UI 时
  - 设计后台位置 + 推送流程时
---

# 位置命令 (节点)

## 摘要 (TL;DR)
- `location.get` 是一个节点命令（通过 `node.invoke`）。
- 默认关闭。
- 设置使用选择器：关闭 (Off) / 使用期间 (While Using) / 始终 (Always)。
- 单独的开关：精确位置 (Precise Location)。

## 为什么是选择器 (不仅仅是开关)
OS 权限是多级的。我们可以在应用内暴露一个选择器，但 OS 仍然决定实际的授予。
- iOS/macOS: 用户可以在系统提示/设置中选择 **使用期间** 或 **始终**。应用可以请求升级，但 OS 可能需要设置。
- Android: 后台位置是一个单独的权限；在 Android 10+ 上通常需要设置流程。
- 精确位置是一个单独的授予（iOS 14+ “精确”，Android “精细” vs “粗略”）。

UI 中的选择器驱动我们请求的模式；实际授予存在于 OS 设置中。

## 设置模型
每个节点设备：
- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

UI 行为：
- 选择 `whileUsing` 请求前台权限。
- 选择 `always` 首先确保 `whileUsing`，然后请求后台（如果需要，则将用户发送到设置）。
- 如果 OS 拒绝请求的级别，则恢复到授予的最高级别并显示状态。

## 权限映射 (node.permissions)
可选。macOS 节点通过权限映射报告 `location`；iOS/Android 可能省略它。

## 命令: `location.get`
通过 `node.invoke` 调用。

参数 (建议):
```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

响应载荷:
```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

错误 (稳定代码):
- `LOCATION_DISABLED`: 选择器关闭。
- `LOCATION_PERMISSION_REQUIRED`: 请求模式缺少权限。
- `LOCATION_BACKGROUND_UNAVAILABLE`: 应用在后台，但只允许使用期间访问。
- `LOCATION_TIMEOUT`: 未及时定位。
- `LOCATION_UNAVAILABLE`: 系统故障 / 无提供商。

## 后台行为 (未来)
目标：模型甚至可以在节点后台运行时请求位置，但仅当：
- 用户选择了 **始终 (Always)**。
- OS 授予后台位置。
- 应用被允许在后台运行以进行定位（iOS 后台模式 / Android 前台服务或特殊允许）。

推送触发流程 (未来):
1) 网关向节点发送推送（静默推送或 FCM 数据）。
2) 节点短暂唤醒并向设备请求位置。
3) 节点将载荷转发给网关。

注意：
- iOS: 需要始终权限 + 后台位置模式。静默推送可能会受到限制；预计会有间歇性故障。
- Android: 后台位置可能需要前台服务；否则，预计会被拒绝。

## 模型/工具集成
- 工具界面：`nodes` 工具添加 `location_get` 动作（需要节点）。
- CLI: `openclaw nodes location get --node <id>`。
- 智能体指南：仅当用户启用了位置并了解范围时才调用。

## UX 文案 (建议)
- 关闭: “位置共享已禁用。”
- 使用期间: “仅当 OpenClaw 打开时。”
- 始终: “允许后台位置。需要系统权限。”
- 精确: “使用精确 GPS 位置。关闭以共享大致位置。”
