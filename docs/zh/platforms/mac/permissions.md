---
mmh3_hash: "b8755171a0e5f7283a96d341ce9bf236"
summary: "macOS 权限持久化(TCC)和签名要求"
read_when:
  - 调试缺失或卡住的 macOS 权限提示
  - 打包或签名 macOS 应用
  - 更改捆绑包 ID 或应用安装路径
---
# macOS 权限(TCC)

macOS 权限授予是脆弱的。TCC 将权限授予与应用的代码签名、捆绑包标识符和
磁盘路径相关联。如果其中任何一个更改,macOS 会将应用视为新应用,并可能
删除或隐藏提示。

## 稳定权限的要求
- 相同路径:从固定位置运行应用(对于 OpenClaw,为 `dist/OpenClaw.app`)。
- 相同的捆绑包标识符:更改捆绑包 ID 会创建新的权限标识。
- 已签名的应用:未签名或 ad-hoc 签名的构建不会持久化权限。
- 一致的签名:使用真正的 Apple Development 或 Developer ID 证书,
  以便签名在重建时保持稳定。

Ad-hoc 签名在每次构建时生成新标识。macOS 会忘记以前的授予,提示可能
完全消失,直到清除陈旧的条目。

## 提示消失时的恢复清单
1. 退出应用。
2. 在系统设置 -> 隐私与安全中删除应用条目。
3. 从相同路径重新启动应用并重新授予权限。
4. 如果提示仍未出现,请使用 `tccutil` 重置 TCC 条目并重试。
5. 某些权限仅在完全 macOS 重启后才会重新出现。

示例重置(根据需要替换捆绑包 ID):

```bash
sudo tccutil reset Accessibility bot.molt.mac
sudo tccutil reset ScreenCapture bot.molt.mac
sudo tccutil reset AppleEvents
```

如果你正在测试权限,请始终使用真实证书签名。Ad-hoc 构建仅适用于权限无关
紧要的快速本地运行。
