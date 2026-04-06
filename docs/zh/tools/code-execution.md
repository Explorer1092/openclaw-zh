---
mmh3_hash: "c4da4679c146da76f7912d86671975ec"
summary: "code_execution -- 通过 xAI 运行沙盒远程 Python 分析"
read_when:
  - 希望启用或配置 code_execution
  - 希望在无本地 Shell 访问的情况下进行远程分析
  - 希望将 x_search 或 web_search 与远程 Python 分析结合使用
title: "Code Execution"
---

# Code Execution

`code_execution` 在 xAI 的 Responses API 上运行沙盒远程 Python 分析。
这与本地 [`exec`](/tools/exec) 不同：

- `exec` 在你的机器或 Node 上运行 Shell 命令
- `code_execution` 在 xAI 的远程沙盒中运行 Python

适合使用 `code_execution` 的场景：

- 计算
- 制表
- 快速统计
- 图表式分析
- 分析 `x_search` 或 `web_search` 返回的数据

当你需要访问本地文件、Shell、代码仓库或配对设备时，**不要**使用它。请改用 [`exec`](/tools/exec)。

## 设置

你需要一个 xAI API 密钥，以下任一方式均可：

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

示例：

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## 使用方法

以自然语言提问，并明确分析意图：

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

该工具在内部接受单个 `task` 参数，因此 Agent 应在一条提示中发送完整的分析请求和所有内联数据。

## 限制

- 这是远程 xAI 执行，而非本地进程执行。
- 应将其视为临时分析，而非持久化的 Notebook。
- 不要假设可以访问本地文件或工作区。
- 如需获取最新 X 数据，请先使用 [`x_search`](/tools/web#x_search)。

## 相关

- [Web 工具](/tools/web)
- [Exec](/tools/exec)
- [xAI](/providers/xai)
