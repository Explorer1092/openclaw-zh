---
title: "Node 故障排除"
mmh3_hash: "80c31ce0dad21f799e0d164bc4d693ab"
summary: "排查节点配对、前台要求、权限和工具失败问题"
read_when:
  - 节点已连接但 camera/canvas/screen/exec 工具失败
  - 您需要了解 node 配对与批准的心理模型
---

当 node 在状态中可见但 node 工具失败时，请使用此页面。

## 命令阶梯

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

然后运行 node 特定检查：

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

健康信号：

- Node 已连接并为角色 `node` 配对。
- `nodes describe` 包含您正在调用的能力。
- 执行批准显示预期的模式/允许列表。

## 前台要求

`canvas.*`、`camera.*` 和 `screen.*` 仅在 iOS/Android node 的前台运行。

快速检查和修复：

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

如果您看到 `NODE_BACKGROUND_UNAVAILABLE`，请将 node 应用置于前台并重试。

## 权限矩阵

| 能力 | iOS | Android | macOS node 应用 | 典型失败代码 |
| ---- | --- | ------- | --------------- | ------------ |
| `camera.snap`、`camera.clip` | 相机（+ 片段音频的麦克风） | 相机（+ 片段音频的麦克风） | 相机（+ 片段音频的麦克风） | `*_PERMISSION_REQUIRED` |
| `screen.record` | 屏幕录制（+ 可选麦克风） | 屏幕捕获提示（+ 可选麦克风） | 屏幕录制 | `*_PERMISSION_REQUIRED` |
| `location.get` | 使用时或始终（取决于模式） | 基于模式的前台/后台位置 | 位置权限 | `LOCATION_PERMISSION_REQUIRED` |
| `system.run` | 不适用（node 主机路径） | 不适用（node 主机路径） | 需要执行批准 | `SYSTEM_RUN_DENIED` |

## 配对与批准

这些是不同的门控：

1. **设备配对**：此 node 能否连接到 Gateway？
2. **Gateway node 命令策略**：RPC 命令 ID 是否被 `gateway.nodes.allowCommands` / `denyCommands` 和平台默认值允许？
3. **执行批准**：此 node 能否在本地运行特定的 shell 命令？

快速检查：

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

如果配对缺失，先批准 node 设备。
如果 `nodes describe` 缺少某个命令，检查 Gateway node 命令策略以及 node 是否在连接时实际声明了该命令。
如果配对正常但 `system.run` 失败，修复该 node 上的执行批准/允许列表。

Node 配对是身份/信任门控，而不是每命令批准界面。对于 `system.run`，每 node 策略存储在该 node 的执行批准文件中（`openclaw approvals get --node ...`），而不是在 Gateway 配对记录中。

对于批准支持的 `host=node` 运行，Gateway 还将执行绑定到准备好的规范 `systemRunPlan`。如果后来的调用者在批准的运行转发之前修改了命令/cwd 或会话元数据，Gateway 会以批准不匹配拒绝运行，而不是信任编辑后的负载。

## 常见 node 错误代码

- `NODE_BACKGROUND_UNAVAILABLE` → 应用在后台；将其置于前台。
- `CAMERA_DISABLED` → node 设置中相机切换已禁用。
- `*_PERMISSION_REQUIRED` → 操作系统权限缺失/被拒绝。
- `LOCATION_DISABLED` → 位置模式已关闭。
- `LOCATION_PERMISSION_REQUIRED` → 请求的位置模式未授权。
- `LOCATION_BACKGROUND_UNAVAILABLE` → 应用在后台但只存在使用时权限。
- `SYSTEM_RUN_DENIED: approval required` → 执行请求需要明确批准。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被允许列表模式阻止。
  在 Windows node 主机上，允许列表模式中的 shell 包装形式如 `cmd.exe /c ...` 被视为允许列表未命中，除非通过询问流程批准。

## 快速恢复循环

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

如果仍然卡住：

- 重新批准设备配对。
- 重新打开 node 应用（前台）。
- 重新授予操作系统权限。
- 重新创建/调整执行批准策略。

## 相关文档

- [Nodes 概述](/nodes)
- [相机 node](/nodes/camera)
- [位置命令](/nodes/location-command)
- [执行批准](/tools/exec-approvals)
- [Gateway 配对](/gateway/pairing)
- [Gateway 故障排除](/gateway/troubleshooting)
- [Channel 故障排除](/channels/troubleshooting)
