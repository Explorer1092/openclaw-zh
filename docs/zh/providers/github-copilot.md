---
title: "GitHub Copilot"
sidebarTitle: "GitHub Copilot"
mmh3_hash: "af586199c1bbf6922f561c2b1185eb49"
summary: "使用设备流或非交互式令牌导入从 OpenClaw 登录 GitHub Copilot"
read_when:
  - 您想将 GitHub Copilot 用作模型 Provider
  - 您需要 `openclaw models auth login-github-copilot` 流程
---

GitHub Copilot 是 GitHub 的 AI 编码助手。它为您的 GitHub 账户和计划提供对 Copilot 模型的访问。OpenClaw 可以通过两种不同的方式将 Copilot 用作模型 Provider。

## 在 OpenClaw 中使用 Copilot 的两种方式

<Tabs>
  <Tab title="内置 Provider（github-copilot）">
    使用原生设备登录流程获取 GitHub 令牌，然后在 OpenClaw 运行时将其交换为 Copilot API 令牌。这是**默认**且最简单的路径，因为它不需要 VS Code。

    <Steps>
      <Step title="运行登录命令">
        ```bash
        openclaw models auth login-github-copilot
        ```

        系统将提示您访问一个 URL 并输入一次性代码。保持终端打开直到完成。
      </Step>
      <Step title="设置默认模型">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        或在配置中：

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy 插件（copilot-proxy）">
    使用 **Copilot Proxy** VS Code 扩展作为本地桥接。OpenClaw 与代理的 `/v1` 端点通信，并使用您在那里配置的模型列表。

    <Note>
    当您已经在 VS Code 中运行 Copilot Proxy 或需要通过它路由时，选择此方式。您必须启用插件并保持 VS Code 扩展运行。
    </Note>

  </Tab>
</Tabs>

## 可选标志

| 标志            | 描述                                                |
| --------------- | --------------------------------------------------- |
| `--yes`         | 跳过确认提示                                        |
| `--set-default` | 同时应用 Provider 的推荐默认模型                    |

```bash
# 跳过确认
openclaw models auth login-github-copilot --yes

# 登录并在一步中设置默认模型
openclaw models auth login --provider github-copilot --method device --set-default
```

## 非交互式入门

如果您已有 GitHub OAuth 访问令牌用于 Copilot，可以在无头设置中使用 `openclaw onboard --non-interactive` 导入它：

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

您也可以省略 `--auth-choice`；传递 `--github-copilot-token` 会推断 GitHub Copilot Provider 认证选项。如果省略该标志，入门程序将回退到 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`，然后是 `GITHUB_TOKEN`。使用 `--secret-input-mode ref` 并设置 `COPILOT_GITHUB_TOKEN` 可在 `auth-profiles.json` 中存储环境变量引用的 `tokenRef` 而非明文。

<AccordionGroup>
  <Accordion title="需要交互式 TTY">
    设备登录流程需要交互式 TTY。直接在终端中运行，而不是在非交互式脚本或 CI 管道中。
  </Accordion>

  <Accordion title="模型可用性取决于您的计划">
    Copilot 模型可用性取决于您的 GitHub 计划。如果模型被拒绝，请尝试另一个 ID（例如 `github-copilot/gpt-5.5`）。有关当前模型列表，请参见 GitHub 的[每个 Copilot 计划支持的模型](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)。
  </Accordion>

  <Accordion title="从 Copilot API 实时刷新目录">
    一旦设备登录（或环境变量）认证路径解析了 GitHub 令牌，OpenClaw 就会按需从 `${baseUrl}/models`（VS Code Copilot 使用的同一端点）刷新模型目录，以便运行时跟踪每账户权限和准确的上下文窗口，无需频繁更新清单。新发布的 Copilot 模型无需升级 OpenClaw 即可可见，上下文窗口反映真实的每模型限制（例如 gpt-5.x 系列为 400k，内部 `claude-opus-*-1m` 变体为 1M）。

    当发现被禁用、用户没有 GitHub 认证配置文件、令牌交换失败或 `/models` HTTPS 调用出错时，捆绑的静态目录仍然作为可见的回退。若要完全依赖静态清单目录（离线/气闸场景），请选择退出：

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="传输选择">
    Claude 模型 ID 自动使用 Anthropic Messages 传输。GPT、o 系列和 Gemini 模型保持 OpenAI Responses 传输。OpenClaw 根据模型引用选择正确的传输。
  </Accordion>

  <Accordion title="请求兼容性">
    OpenClaw 在 Copilot 传输上发送 Copilot IDE 风格的请求标头，包括内置的压缩、工具结果和图像后续轮次。除非已针对 Copilot API 验证了相关行为，否则不会为 Copilot 启用 Provider 级别的 Responses 续传。
  </Accordion>

  <Accordion title="环境变量解析顺序">
    OpenClaw 按以下优先顺序从环境变量解析 Copilot 身份验证：

    | 优先级 | 变量                   | 说明                                   |
    | ------ | ---------------------- | -------------------------------------- |
    | 1      | `COPILOT_GITHUB_TOKEN` | 最高优先级，Copilot 专用                |
    | 2      | `GH_TOKEN`             | GitHub CLI 令牌（备选）                 |
    | 3      | `GITHUB_TOKEN`         | 标准 GitHub 令牌（最低）                |

    当设置了多个变量时，OpenClaw 使用最高优先级的那个。设备登录流程（`openclaw models auth login-github-copilot`）将令牌存储在身份验证配置文件存储中，优先于所有环境变量。

  </Accordion>

  <Accordion title="令牌存储">
    登录在身份验证配置文件存储中存储 GitHub 令牌，并在 OpenClaw 运行时将其交换为 Copilot API 令牌。您不需要手动管理令牌。
  </Accordion>
</AccordionGroup>

<Warning>
设备登录命令需要交互式 TTY。当需要无头设置时，请使用非交互式入门。
</Warning>

## Memory 搜索嵌入

GitHub Copilot 也可以作为 [Memory 搜索](/concepts/memory-search) 的嵌入 Provider。如果您拥有 Copilot 订阅并已登录，OpenClaw 无需单独的 API 密钥即可将其用于嵌入。

### 自动检测

当 `memorySearch.provider` 为 `"auto"`（默认值）时，GitHub Copilot 以优先级 15 被尝试——在本地嵌入之后、OpenAI 和其他付费 Provider 之前。如果 GitHub 令牌可用，OpenClaw 将从 Copilot API 发现可用的嵌入模型并自动选择最佳模型。

### 显式配置

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // 可选：覆盖自动发现的模型
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### 工作原理

1. OpenClaw 解析您的 GitHub 令牌（来自环境变量或身份验证配置文件）。
2. 将其交换为短期有效的 Copilot API 令牌。
3. 查询 Copilot `/models` 端点以发现可用的嵌入模型。
4. 选择最佳模型（优先选择 `text-embedding-3-small`）。
5. 向 Copilot `/embeddings` 端点发送嵌入请求。

模型可用性取决于您的 GitHub 计划。如果没有可用的嵌入模型，OpenClaw 会跳过 Copilot 并尝试下一个 Provider。

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="OAuth 和身份验证" href="/gateway/authentication" icon="key">
    身份验证详情和凭据复用规则。
  </Card>
</CardGroup>
