---
title: "GitHub Copilot"
sidebarTitle: "GitHub Copilot"
mmh3_hash: "6d79d78981a12b4f9a4a0bb62a209a7d"
summary: "使用设备流从 OpenClaw 登录 GitHub Copilot"
read_when:
  - 您想将 GitHub Copilot 用作模型 Provider
  - 您需要 `openclaw models auth login-github-copilot` 流程
---

# GitHub Copilot

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
        openclaw models set github-copilot/gpt-4o
        ```

        或在配置中：

        ```json5
        {
          agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
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

<AccordionGroup>
  <Accordion title="需要交互式 TTY">
    设备登录流程需要交互式 TTY。直接在终端中运行，而不是在非交互式脚本或 CI 管道中。
  </Accordion>

  <Accordion title="模型可用性取决于您的计划">
    Copilot 模型可用性取决于您的 GitHub 计划。如果模型被拒绝，请尝试另一个 ID（例如 `github-copilot/gpt-4.1`）。
  </Accordion>

  <Accordion title="传输选择">
    Claude 模型 ID 自动使用 Anthropic Messages 传输。GPT、o 系列和 Gemini 模型保持 OpenAI Responses 传输。OpenClaw 根据模型引用选择正确的传输。
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
需要交互式 TTY。直接在终端中运行登录命令，而不是在无头脚本或 CI 作业中。
</Warning>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="OAuth 和身份验证" href="/gateway/authentication" icon="key">
    身份验证详情和凭据复用规则。
  </Card>
</CardGroup>
