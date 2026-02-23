---
mmh3_hash: "171c8034b0700af40eb32de0cfc0f350"
summary: "排查节点配对、前台要求、权限和工具失败问题"
read_when:
  - 节点已连接但 camera/canvas/screen/exec 工具失败
  - 您需要节点配对与审批的心智模型
title: "节点故障排除"
---

# 节点故障排除

当节点在状态中可见但节点工具失败时使用本页面。

## 命令阶梯

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

然后运行节点特定检查：

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

健康信号：

- 节点已连接并为角色 `node` 配对。
- `nodes describe` 包括您正在调用的功能。
- Exec 审批显示预期的模式/白名单。

## 前台要求

`canvas.*`、`camera.*` 和 `screen.*` 在 iOS/Android 节点上仅限前台使用。

快速检查和修复：

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

如果您看到 `NODE_BACKGROUND_UNAVAILABLE`，将节点应用置于前台并重试。

## 权限矩阵

| 功能                         | iOS                                    | Android                                      | macOS 节点应用                | 典型失败代码                   |
| ---------------------------- | -------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | 相机（+ 剪辑音频需要麦克风）           | 相机（+ 剪辑音频需要麦克风）                 | 相机（+ 剪辑音频需要麦克风）  | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | 屏幕录制（+ 麦克风可选）               | 屏幕捕获提示（+ 麦克风可选）                 | 屏幕录制                      | `*_PERMISSION_REQUIRED`        |
| `location.get`               | 使用期间或始终（取决于模式）           | 基于模式的前台/后台位置                      | 位置权限                      | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | 不适用（节点主机路径）                 | 不适用（节点主机路径）                       | 需要 Exec 审批                | `SYSTEM_RUN_DENIED`            |

## 配对与审批

这些是不同的门控：

1. **设备配对**：此节点能否连接到 Gateway？
2. **Exec 审批**：此节点能否运行特定的 Shell 命令？

快速检查：

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

如果配对缺失，请先批准节点设备。如果配对正常但 `system.run` 失败，请修复 Exec 审批/白名单。

## 常见节点错误代码

- `NODE_BACKGROUND_UNAVAILABLE` → 应用处于后台；将其置于前台。
- `CAMERA_DISABLED` → 相机切换在节点设置中被禁用。
- `*_PERMISSION_REQUIRED` → 操作系统权限缺失/被拒绝。
- `LOCATION_DISABLED` → 位置模式已关闭。
- `LOCATION_PERMISSION_REQUIRED` → 未授予请求的位置模式。
- `LOCATION_BACKGROUND_UNAVAILABLE` → 应用处于后台但仅存在"使用期间"权限。
- `SYSTEM_RUN_DENIED: approval required` → Exec 请求需要明确审批。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被白名单模式阻止。在 Windows Node host 上，`cmd.exe /c ...` 等 shell 包装器形式在白名单模式下被视为白名单未命中，除非通过询问流程批准。

## 快速恢复循环

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

如果仍然卡住：

- 重新批准设备配对。
- 重新打开节点应用（前台）。
- 重新授予操作系统权限。
- 重新创建/调整 Exec 审批策略。

相关：

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
