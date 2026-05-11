---
mmh3_hash: "2caf7fe605a2d7ad0a99f95121e19027"
summary: "在 OpenClaw 模型请求前按需启动本地模型服务器"
read_when:
  - 您希望 OpenClaw 仅在选择本地模型时才启动本地模型服务器
  - 您运行 ds4、inferrs、vLLM、llama.cpp、MLX 或其他兼容 OpenAI 的本地服务器
  - 您需要控制本地 Provider 的冷启动、就绪状态和空闲关闭
title: "本地模型服务"
---

`models.providers.<id>.localService` 让 OpenClaw 按需启动 Provider 自有的本地模型服务器。这是 Provider 级别的配置：当所选模型属于该 Provider 时，OpenClaw 会探测服务，如果端点不可用则启动进程，等待就绪，然后发送模型请求。

适用于全天运行成本较高的本地服务器，或者手动设置中选择模型即可唤起后端的场景。

## 工作原理

1. 模型请求解析到已配置的 Provider。
2. 如果该 Provider 有 `localService`，OpenClaw 会探测 `healthUrl`。
3. 如果探测成功，OpenClaw 使用现有服务器。
4. 如果探测失败，OpenClaw 使用 `args` 启动 `command`。
5. OpenClaw 轮询就绪状态，直到 `readyTimeoutMs` 超时。
6. 模型请求通过正常的 Provider 传输发送。
7. 如果 OpenClaw 启动了进程且 `idleStopMs` 为正值，则在最后一个进行中的请求空闲了指定时长后停止该进程。

OpenClaw 不会为此安装 launchd、systemd、Docker 或守护进程。服务器是最先需要它的 OpenClaw 进程的子进程。

## 配置结构

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 字段说明

- `command`：可执行文件的绝对路径。不使用 shell 查找。
- `args`：进程参数。不应用 shell 展开、管道、通配符或引号规则。
- `cwd`：进程的可选工作目录。
- `env`：可选的环境变量，合并到 OpenClaw 进程环境之上。
- `healthUrl`：就绪检查 URL。如果省略，OpenClaw 会将 `/models` 附加到 `baseUrl`，例如 `http://127.0.0.1:8000/v1` 变为 `http://127.0.0.1:8000/v1/models`。
- `readyTimeoutMs`：启动就绪截止时间。默认值：`120000`。
- `idleStopMs`：OpenClaw 启动的进程的空闲关闭延迟。`0` 或省略则保持进程运行，直到 OpenClaw 退出。

## Inferrs 示例

Inferrs 是一个自定义的兼容 OpenAI 的 `/v1` 后端，因此相同的本地服务 API 适用于 `inferrs` Provider 条目。

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

将 `command` 替换为在运行 OpenClaw 的机器上执行 `which inferrs` 的结果。

## ds4 示例

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/Users/you/Projects/oss/ds4/ds4-server",
          args: [
            "--model",
            "/Users/you/Projects/oss/ds4/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "393216",
          ],
          cwd: "/Users/you/Projects/oss/ds4",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

## 操作注意事项

- 一个 OpenClaw 进程管理其启动的子进程。另一个 OpenClaw 进程如果看到相同的健康 URL 已在运行，则会复用它而不接管它。
- 启动按 Provider 命令和参数集序列化，因此并发请求不会为相同配置生成重复的服务器。
- 活跃的流式响应持有租约；空闲关闭等待响应体处理完成。
- 对于启动缓慢的本地 Provider，使用 `timeoutSeconds` 以避免冷启动和长时间生成触及默认模型请求超时。
- 如果您的服务器在 `/v1/models` 以外的地方公开就绪状态，请使用显式的 `healthUrl`。

## 相关

<CardGroup cols={2}>
  <Card title="本地模型" href="/gateway/local-models" icon="server">
    本地模型设置、Provider 选择和安全指南。
  </Card>
  <Card title="Inferrs" href="/providers/inferrs" icon="cpu">
    通过 inferrs 兼容 OpenAI 的本地服务器运行 OpenClaw。
  </Card>
</CardGroup>
