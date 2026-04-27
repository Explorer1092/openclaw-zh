---
mmh3_hash: "e60ac6bac7744f92ef4fbe513d7706bc"
summary: "OpenClaw 如何为 macOS 应用中的友好名称供应 Apple 设备模型标识符。"
read_when:
  - 更新设备模型标识符映射或 NOTICE/许可证文件
  - 更改实例 UI 显示设备名称的方式
title: "设备模型数据库"
---

macOS 伴侣应用通过将 Apple 模型标识符(例如 `iPad16,6`、`Mac16,6`)映射到人类可读的名称,在**实例** UI 中显示友好的 Apple 设备模型名称。

映射以 JSON 形式供应在:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## 数据源

我们目前从 MIT 许可的存储库供应映射:

- `kyle-seongwoo-jun/apple-device-identifiers`

为了保持构建确定性,JSON 文件被固定到特定的上游提交(记录在 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` 中)。

## 更新数据库

1. 选择您想要固定到的上游提交(一个用于 iOS,一个用于 macOS)。
2. 在 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` 中更新提交哈希。
3. 重新下载 JSON 文件,固定到这些提交:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. 确保 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` 仍然与上游匹配(如果上游许可证更改,请替换它)。
5. 验证 macOS 应用干净构建(无警告):

```bash
swift build --package-path apps/macos
```

## 相关

- [节点](/nodes)
- [节点故障排除](/nodes/troubleshooting)
