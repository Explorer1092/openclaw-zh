---
mmh3_hash: "3bbf465b306e4d5f986d43969d321b13"
title: "日志记录 (macOS)"
sidebarTitle: "日志记录"
summary: "OpenClaw 日志:滚动诊断文件日志 + 统一日志隐私标志"
read_when: ["捕获 macOS 日志或调查私有数据日志记录","调试语音唤醒/会话生命周期问题"]
---

# 日志记录 (macOS)

## 滚动诊断文件日志(调试窗格)

OpenClaw 通过 swift-log(默认为统一日志记录)路由 macOS 应用日志,并且可以
在需要持久捕获时将本地、滚动文件日志写入磁盘。

- 详细程度:**调试窗格 → Logs → App logging → Verbosity**
- 启用:**调试窗格 → Logs → App logging → "Write rolling diagnostics log (JSONL)"**
- 位置:`~/Library/Logs/OpenClaw/diagnostics.jsonl`(自动旋转;旧文件后缀为 `.1`、`.2`、…)
- 清除:**调试窗格 → Logs → App logging → "Clear"**

注意:

- 这**默认关闭**。仅在主动调试时启用。
- 将文件视为敏感文件;未经审查不要共享。

## macOS 上统一日志记录的私有数据

统一日志记录会编辑大多数有效负载,除非子系统选择加入 `privacy -off`。根据
Peter 关于 macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans)(2025)的文章,这由 `/Library/Preferences/Logging/Subsystems/` 中按子系统名称键控的 plist 控制。只有新的日志条目会采用该标志,因此在重现问题之前启用它。

## 为 OpenClaw(`ai.openclaw`)启用

- 首先将 plist 写入临时文件,然后以 root 身份原子安装它:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- 无需重启;logd 会快速注意到该文件,但只有新的日志行才会包含私有有效负载。
- 使用现有帮助器查看更丰富的输出,例如 `./scripts/clawlog.sh --category WebChat --last 5m`。

## 调试后禁用

- 删除覆盖:`sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 可选择运行 `sudo log config --reload` 以强制 logd 立即删除覆盖。
- 请记住,此表面可能包括电话号码和消息正文;仅在你主动需要额外详细信息时才保留 plist。
