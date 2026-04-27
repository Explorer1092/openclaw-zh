---
mmh3_hash: "63a7a56f4eb1ce9ea0cb2d95e33d06c7"
summary: "使用可选的捆绑 Plugin 压缩嘈杂的 exec 和 bash 工具结果"
title: "Tokenjuice"
read_when:
  - 您希望在 OpenClaw 中缩短 `exec` 或 `bash` 工具结果
  - 您希望启用捆绑的 tokenjuice Plugin
  - 您需要了解 tokenjuice 更改了什么以及保留原始状态的内容
---

`tokenjuice` 是一个可选的捆绑 Plugin，在命令运行后压缩嘈杂的 `exec` 和 `bash` 工具结果。

它更改返回的 `tool_result`，而不是命令本身。Tokenjuice 不重写 Shell 输入、不重新运行命令，也不更改退出代码。

目前这适用于 PI 嵌入式运行和 Codex 应用服务器线束中的 OpenClaw 动态工具。Tokenjuice 挂接 OpenClaw 的工具结果中间件，并在输出返回到活跃线束 Session 之前对其进行修剪。

## 启用 Plugin

快速路径：

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

等效命令：

```bash
openclaw plugins enable tokenjuice
```

OpenClaw 已附带该 Plugin。没有单独的 `plugins install` 或 `tokenjuice install openclaw` 步骤。

如果您更喜欢直接编辑配置：

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Tokenjuice 更改的内容

- 在将嘈杂的 `exec` 和 `bash` 结果反馈回 Session 之前对其进行压缩。
- 保持原始命令执行不变。
- 保留精确的文件内容读取和 tokenjuice 应保留原始状态的其他命令。
- 保持选择性：如果您希望随处获得完整输出，请禁用该 Plugin。

## 验证是否正常工作

1. 启用该 Plugin。
2. 启动一个可以调用 `exec` 的 Session。
3. 运行一个嘈杂的命令，例如 `git status`。
4. 检查返回的工具结果是否比原始 Shell 输出更短且更结构化。

## 禁用 Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

或：

```bash
openclaw plugins disable tokenjuice
```

## 相关

- [Exec 工具](/tools/exec)
- [思考级别](/tools/thinking)
- [上下文引擎](/concepts/context-engine)
