---
title: "位置命令"
sidebarTitle: "位置命令"
mmh3_hash: "8145ee0d6a95aa713cc2431a7ba1d0de"
summary: "Node 的位置命令 (location.get)，权限模式和 Android 前台行为"
read_when: ["添加位置 Node 支持或权限 UI 时","设计 Android 位置权限或前台行为时"]
---

## 摘要 (TL;DR)

- `location.get` 是一个 Node 命令（通过 `node.invoke`）。
- 默认关闭。
- Android 应用设置使用选择器：关闭 (Off) / 使用期间 (While Using)。
- 单独的开关：精确位置 (Precise Location)。

## 为什么是选择器 (不仅仅是开关)

OS 权限是多级的。我们可以在应用内暴露一个选择器，但 OS 仍然决定实际的授予。

- iOS/macOS 可能在系统提示/设置中提供 **使用期间** 或 **始终**。
- Android 应用目前仅支持前台位置。
- 精确位置是一个单独的授予（iOS 14+ "精确"，Android "精细" vs "粗略"）。

UI 中的选择器驱动我们请求的模式；实际授予存在于 OS 设置中。

## 设置模型

每个 Node 设备:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI 行为:

- 选择 `whileUsing` 请求前台权限。
- 如果 OS 拒绝请求的级别，则恢复到授予的最高级别并显示状态。

## 权限映射 (node.permissions)

可选。macOS Node 通过权限映射报告 `location`；iOS/Android 可能省略它。

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

## 后台行为

- Android 应用在后台时拒绝 `location.get`。
- 在 Android 上请求位置时保持 OpenClaw 打开。
- 其他 Node 平台可能有所不同。

## 模型/工具集成

- 工具界面: `nodes` 工具添加 `location_get` 动作（需要 Node）。
- CLI: `openclaw nodes location get --node <id>`。
- Agent 指南: 仅当用户启用了位置并了解范围时才调用。

## UX 文案 (建议)

- 关闭: "位置共享已禁用。"
- 使用期间: "仅当 OpenClaw 打开时。"
- 精确: "使用精确 GPS 位置。关闭以共享大致位置。"

## 相关文档

- [Channel 位置解析](/channels/location)
- [相机捕获](/nodes/camera)
- [对讲模式](/nodes/talk)
