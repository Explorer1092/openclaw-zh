---
title: "SOUL Evil 钩子"
mmh3_hash: "705027073390c3741ee89a5d79fe653a"
summary: "SOUL Evil 钩子(用 SOUL_EVIL.md 替换 SOUL.md)"
read_when:
  - 您想启用或调整 SOUL Evil 钩子
  - 您想要清除窗口或随机机会角色交换
---

# SOUL Evil 钩子

SOUL Evil 钩子在清除窗口期间或通过随机机会用 `SOUL_EVIL.md` 替换**注入的** `SOUL.md` 内容。它**不**修改磁盘上的文件。

## 工作原理

当 `agent:bootstrap` 运行时,钩子可以在组装系统提示之前替换内存中的 `SOUL.md` 内容。如果 `SOUL_EVIL.md` 缺失或为空,
OpenClaw 会记录警告并保持正常的 `SOUL.md`。

子代理运行**不**在其引导文件中包含 `SOUL.md`,因此此钩子
对子代理没有影响。

## 启用

```bash
openclaw hooks enable soul-evil
```

然后设置配置:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "soul-evil": {
          "enabled": true,
          "file": "SOUL_EVIL.md",
          "chance": 0.1,
          "purge": { "at": "21:00", "duration": "15m" }
        }
      }
    }
  }
}
```

在代理工作空间根目录(紧邻 `SOUL.md`)创建 `SOUL_EVIL.md`。

## 选项

- `file`(字符串): 备用 SOUL 文件名(默认: `SOUL_EVIL.md`)
- `chance`(数字 0–1): 每次运行使用 `SOUL_EVIL.md` 的随机机会
- `purge.at`(HH:mm): 每日清除开始(24 小时制)
- `purge.duration`(持续时间): 窗口长度(例如 `30s`、`10m`、`1h`)

**优先级:** 清除窗口优先于机会。

**时区:** 设置时使用 `agents.defaults.userTimezone`;否则使用主机时区。

## 注意事项

- 磁盘上没有文件被写入或修改。
- 如果 `SOUL.md` 不在引导列表中,钩子什么也不做。

## 另请参阅

- [钩子](/hooks)
