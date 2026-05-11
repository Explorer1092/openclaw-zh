---
title: "相机捕获"
mmh3_hash: "a3cbaca7ae2fcc5aff0748a0026b369d"
summary: "相机捕获 (iOS/Android node + macOS 应用) 用于 agent 使用: 照片 (jpg) 和短视频片段 (mp4)"
read_when:
  - 添加或修改 iOS/Android node 或 macOS 上的相机捕获
  - 扩展 agent 可访问的 MEDIA 临时文件工作流
---

OpenClaw 支持 agent 工作流的**相机捕获**：

- **iOS node**（通过 Gateway 配对）：通过 `node.invoke` 捕获**照片**（`jpg`）或**短视频片段**（`mp4`，可选含音频）。
- **Android node**（通过 Gateway 配对）：通过 `node.invoke` 捕获**照片**（`jpg`）或**短视频片段**（`mp4`，可选含音频）。
- **macOS 应用**（通过 Gateway 的 node）：通过 `node.invoke` 捕获**照片**（`jpg`）或**短视频片段**（`mp4`，可选含音频）。

所有相机访问均受**用户控制设置**的限制。

## iOS node

### 用户设置（默认开启）

- iOS 设置标签页 → **相机** → **允许相机**（`camera.enabled`）
  - 默认：**开启**（缺失的键被视为已启用）。
  - 关闭时：`camera.*` 命令返回 `CAMERA_DISABLED`。

### 命令（通过 Gateway `node.invoke`）

- `camera.list`
  - 响应负载：
    - `devices`：`{ id, name, position, deviceType }` 数组

- `camera.snap`
  - 参数：
    - `facing`：`front|back`（默认：`front`）
    - `maxWidth`：数字（可选；iOS node 默认 `1600`）
    - `quality`：`0..1`（可选；默认 `0.9`）
    - `format`：当前为 `jpg`
    - `delayMs`：数字（可选；默认 `0`）
    - `deviceId`：字符串（可选；来自 `camera.list`）
  - 响应负载：
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`、`height`
  - 负载限制：照片被重新压缩以将 base64 负载保持在 5 MB 以下。

- `camera.clip`
  - 参数：
    - `facing`：`front|back`（默认：`front`）
    - `durationMs`：数字（默认 `3000`，最大值限制为 `60000`）
    - `includeAudio`：布尔值（默认 `true`）
    - `format`：当前为 `mp4`
    - `deviceId`：字符串（可选；来自 `camera.list`）
  - 响应负载：
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### 前台要求

与 `canvas.*` 类似，iOS node 仅允许在**前台**使用 `camera.*` 命令。后台调用返回 `NODE_BACKGROUND_UNAVAILABLE`。

### CLI 辅助工具（临时文件 + MEDIA）

获取附件最简单的方式是通过 CLI 辅助工具，它将解码的媒体写入临时文件并打印 `MEDIA:<path>`。

示例：

```bash
openclaw nodes camera snap --node <id>               # 默认：前置 + 后置（2 个 MEDIA 行）
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

说明：

- `nodes camera snap` 默认捕获**两个**方向，以便 agent 获得两个视图。
- 输出文件是临时的（在操作系统临时目录中），除非您构建自己的包装器。

## Android node

### Android 用户设置（默认开启）

- Android 设置面板 → **相机** → **允许相机**（`camera.enabled`）
  - 默认：**开启**（缺失的键被视为已启用）。
  - 关闭时：`camera.*` 命令返回 `CAMERA_DISABLED`。

### 权限

- Android 需要运行时权限：
  - `CAMERA` 用于 `camera.snap` 和 `camera.clip`。
  - `RECORD_AUDIO` 用于 `camera.clip`（当 `includeAudio=true` 时）。

如果缺少权限，应用将在可能时提示；如果被拒绝，`camera.*` 请求将失败，返回 `*_PERMISSION_REQUIRED` 错误。

### Android 前台要求

与 `canvas.*` 类似，Android node 仅允许在**前台**使用 `camera.*` 命令。后台调用返回 `NODE_BACKGROUND_UNAVAILABLE`。

### Android 命令（通过 Gateway `node.invoke`）

- `camera.list`
  - 响应负载：
    - `devices`：`{ id, name, position, deviceType }` 数组

### 负载限制

照片被重新压缩以将 base64 负载保持在 5 MB 以下。

## macOS 应用

### 用户设置（默认关闭）

macOS 配套应用提供一个复选框：

- **设置 → 通用 → 允许相机**（`openclaw.cameraEnabled`）
  - 默认：**关闭**
  - 关闭时：相机请求返回"用户已禁用相机"。

### CLI 辅助工具（node invoke）

使用主 `openclaw` CLI 在 macOS node 上调用相机命令。

示例：

```bash
openclaw nodes camera list --node <id>            # 列出相机 ID
openclaw nodes camera snap --node <id>            # 打印 MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # 打印 MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # 打印 MEDIA:<path>（旧标志）
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

说明：

- `openclaw nodes camera snap` 默认 `maxWidth=1600`，除非被覆盖。
- 在 macOS 上，`camera.snap` 在预热/曝光稳定后等待 `delayMs`（默认 2000ms）后再捕获。
- 照片负载被重新压缩以将 base64 保持在 5 MB 以下。

## 安全性和实际限制

- 相机和麦克风访问会触发通常的操作系统权限提示（并需要 Info.plist 中的使用说明字符串）。
- 视频片段有上限（当前 `<= 60s`），以避免 node 负载过大（base64 开销 + 消息限制）。

## macOS 屏幕视频（操作系统级别）

对于_屏幕_视频（非相机），请使用 macOS 配套应用：

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # 打印 MEDIA:<path>
```

说明：

- 需要 macOS **屏幕录制**权限（TCC）。

## 相关文档

- [图像与媒体支持](/nodes/images)
- [媒体理解](/nodes/media-understanding)
- [位置命令](/nodes/location-command)
