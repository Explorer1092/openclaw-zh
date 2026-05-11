---
title: "位置命令"
sidebarTitle: "位置命令"
mmh3_hash: "e07ccb8976a3b9ed323f9565185b8eaf"
summary: "Node 的位置命令 (location.get)，权限模式和 Android 前台行为"
read_when:
  - 添加位置 node 支持或权限 UI
  - 设计 Android 位置权限或前台行为
---

## 简介

- `location.get` 是一个 node 命令（通过 `node.invoke`）。
- 默认关闭。
- Android 应用设置使用选择器：关闭 / 使用时。
- 单独的切换：精确位置。

## 为什么使用选择器（而不仅仅是开关）

操作系统权限是多级别的。我们可以在应用内公开选择器，但操作系统仍然决定实际授权。

- iOS/macOS 可能在系统提示/设置中公开**使用时**或**始终**。
- Android 应用目前仅支持前台位置。
- 精确位置是单独的授权（iOS 14+ "精确"，Android "fine" 与 "coarse"）。

UI 中的选择器驱动我们请求的模式；实际授权在操作系统设置中。

## 设置模型

每个 node 设备：

- `location.enabledMode`：`off | whileUsing`
- `location.preciseEnabled`：布尔值

UI 行为：

- 选择 `whileUsing` 请求前台权限。
- 如果操作系统拒绝请求的级别，则恢复到最高已授权级别并显示状态。

## 权限映射（node.permissions）

可选。macOS node 通过权限映射报告 `location`；iOS/Android 可能忽略它。

## 命令：`location.get`

通过 `node.invoke` 调用。

建议的参数：

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

响应负载：

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

错误（稳定代码）：

- `LOCATION_DISABLED`：选择器已关闭。
- `LOCATION_PERMISSION_REQUIRED`：请求模式缺少权限。
- `LOCATION_BACKGROUND_UNAVAILABLE`：应用在后台但只允许使用时。
- `LOCATION_TIMEOUT`：在规定时间内未获得定位。
- `LOCATION_UNAVAILABLE`：系统故障 / 无提供者。

## 后台行为

- Android 应用在后台时拒绝 `location.get`。
- 在 Android 上请求位置时，请保持 OpenClaw 打开。
- 其他 node 平台可能有所不同。

## 模型/工具集成

- 工具界面：`nodes` 工具添加 `location_get` 操作（需要 node）。
- CLI：`openclaw nodes location get --node <id>`。
- Agent 指南：仅在用户启用位置且了解范围时才调用。

## UX 文案（建议）

- 关闭："位置共享已禁用。"
- 使用时："仅在 OpenClaw 打开时。"
- 精确："使用精确 GPS 位置。切换关闭以共享大概位置。"

## 相关文档

- [Channel 位置解析](/channels/location)
- [相机捕获](/nodes/camera)
- [对讲模式](/nodes/talk)
