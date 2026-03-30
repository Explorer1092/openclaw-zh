---
mmh3_hash: "c4da4679c146da76f7912d86671975ec"
summary: "code_execution -- 使用 xAI 运行沙箱化的远程 Python 分析"
read_when:
  - 您想启用或配置 code_execution
  - 您想要远程分析而无需本地 Shell 访问
  - 您想将 x_search 或 web_search 与远程 Python 分析结合使用
title: "Code Execution"
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: placeholder
  source_path: "tools/code-execution.md"
  workflow: 15
---

# Code Execution

`code_execution` 在 xAI 的 Responses API 上运行沙箱化的远程 Python 分析。
这与本地 [`exec`](/tools/exec) 不同：

- `exec` 在您的机器或 Node 上运行 Shell 命令
- `code_execution` 在 xAI 的远程沙箱中运行 Python

使用 `code_execution` 进行：

- 计算
- 表格处理
- 快速统计
- 图表式分析
- 分析由 `x_search` 或 `web_search` 返回的数据

当您需要本地文件、Shell、代码库或配对设备时，**不要**使用它。改用 [`exec`](/tools/exec)。

## 设置

您需要 xAI API key。以下任一方式均可：

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

自然地提问并明确表达分析意图：

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

该工具内部接受单个 `task` 参数，因此 Agent 应在一个提示中发送完整的分析请求和任何内联数据。

## 限制

- 这是远程 xAI 执行，不是本地进程执行。
- 应将其视为临时分析，而非持久 Notebook。
- 不要假设可以访问本地文件或您的工作区。
- 要获取最新 X 数据，请先使用 [`x_search`](/tools/web#x_search)。

## 另请参阅

- [Web 工具](/tools/web)
- [Exec](/tools/exec)
- [xAI](/providers/xai)
