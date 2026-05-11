---
mmh3_hash: "c4531a1bf90c2b36b8b9d8c814aaa288"
summary: "code_execution -- 通过 xAI 运行沙盒远程 Python 分析"
read_when:
  - 希望启用或配置 code_execution
  - 希望在无本地 Shell 访问的情况下进行远程分析
  - 希望将 x_search 或 web_search 与远程 Python 分析结合使用
title: "Code execution"
---

`code_execution` 在 xAI 的 Responses API 上运行沙盒远程 Python 分析。它由捆绑的 `xai` Plugin（在 `tools` 契约下）注册，并分发到 `x_search` 使用的同一 `https://api.x.ai/v1/responses` 端点。

| 属性               | 值                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------- |
| 工具名称           | `code_execution`                                                                   |
| Provider Plugin    | `xai`（捆绑，`enabledByDefault: true`）                                            |
| 认证               | xAI 认证配置文件、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey` |
| 默认模型           | `grok-4-1-fast`                                                                    |
| 默认超时           | 30 秒                                                                              |
| 默认 `maxTurns`    | 未设置（xAI 应用其自身的内部限制）                                                 |

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

<Steps>
  <Step title="提供 xAI API 密钥">
    运行 `openclaw onboard --auth-choice xai-api-key` 以同时设置 `code_execution` 和
    `x_search`，或设置 `XAI_API_KEY` / 在 xAI Plugin 下配置密钥（如果你也希望 Grok 网络搜索使用同一凭据）：

    ```bash
    export XAI_API_KEY=xai-...
    ```

    或通过配置：

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="启用并调整 code_execution">
    该工具通过 `plugins.entries.xai.config.codeExecution.enabled` 控制，默认关闭。

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // 覆盖默认的 xAI 代码执行模型
                maxTurns: 2,            // 可选的内部工具 turn 上限
                timeoutSeconds: 30,     // 请求超时（默认：30）
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="重启 Gateway">
    ```bash
    openclaw gateway restart
    ```

    一旦 xAI Plugin 以 `enabled: true` 重新注册，`code_execution` 将出现在 Agent 的工具列表中。

  </Step>
</Steps>

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

## 错误

当工具在无认证的情况下运行时，它会返回一个结构化的 `missing_xai_api_key` 错误，指向认证配置文件、环境变量和配置选项。该错误是 JSON 格式，而非抛出的异常，因此 Agent 可以自行修正：

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Run openclaw onboard --auth-choice xai-api-key, set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 限制

- 这是远程 xAI 执行，而非本地进程执行。
- 应将其视为临时分析，而非持久化的 Notebook Session。
- 不要假设可以访问本地文件或工作区。
- 如需获取最新 X 数据，请先使用 [`x_search`](/tools/web#x_search) 并将结果传入 `code_execution`。

## 相关

<CardGroup cols={2}>
  <Card title="Exec 工具" href="/tools/exec" icon="terminal">
    在你的机器或配对 Node 上进行本地 Shell 执行。
  </Card>
  <Card title="Exec 审批" href="/tools/exec-approvals" icon="shield">
    Shell 执行的允许/拒绝策略。
  </Card>
  <Card title="Web 工具" href="/tools/web" icon="globe">
    `web_search`、`x_search` 和 `web_fetch`。
  </Card>
  <Card title="xAI Provider" href="/providers/xai" icon="microchip">
    Grok 模型、网络/X 搜索和代码执行配置。
  </Card>
</CardGroup>
