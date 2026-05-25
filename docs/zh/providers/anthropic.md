---
mmh3_hash: "79abde6ccce4de4b470ca4482abd5f2a"
title: "Anthropic"
summary: "在 OpenClaw 中通过 API 密钥或 Claude CLI 使用 Anthropic Claude"
read_when:
  - 您想在 OpenClaw 中使用 Anthropic 模型
---

Anthropic 构建了 **Claude** 模型系列。OpenClaw 支持两种认证路由：

- **API 密钥** — 直接 Anthropic API 访问，按使用量计费（`anthropic/*` 模型）
- **Claude CLI** — 在同一主机上复用现有的 Claude CLI 登录

<Warning>
Anthropic 工作人员告知我们，OpenClaw 风格的 Claude CLI 使用再次被允许，因此
OpenClaw 将 Claude CLI 复用和 `claude -p` 使用视为已授权，除非
Anthropic 发布新政策。

对于长期运行的 Gateway 主机，Anthropic API 密钥仍然是最清晰、
最可预测的生产路径。

Anthropic 当前公开文档：

- [Claude Code CLI 参考](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK 概述](https://platform.claude.com/docs/en/agent-sdk/overview)
- [使用 Claude Code 与您的 Pro 或 Max 计划](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [使用 Claude Code 与您的 Team 或 Enterprise 计划](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## 快速开始

<Tabs>
  <Tab title="API 密钥">
    **适合：** 标准 API 访问和基于使用量的计费。

    <Steps>
      <Step title="获取 API 密钥">
        在 [Anthropic Console](https://console.anthropic.com/) 中创建 API 密钥。
      </Step>
      <Step title="运行引导程序">
        ```bash
        openclaw onboard
        # 选择：Anthropic API key
        ```

        或直接传入密钥：

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### 配置示例

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **适合：** 无需单独 API 密钥即可复用现有的 Claude CLI 登录。

    <Steps>
      <Step title="确保 Claude CLI 已安装并登录">
        验证方式：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="运行引导程序">
        ```bash
        openclaw onboard
        # 选择：Claude CLI
        ```

        OpenClaw 检测并复用现有的 Claude CLI 凭据。
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI 后端的设置和运行时详情请参见 [CLI 后端](/gateway/cli-backends)。
    </Note>

    ### 配置示例

    建议使用规范的 Anthropic 模型引用加上 CLI 运行时覆盖：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          models: {
            "anthropic/claude-opus-4-7": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    旧版 `claude-cli/claude-opus-4-7` 模型引用仍可用于兼容，但新配置应将 Provider/模型选择保留为 `anthropic/*`，并将执行后端放入 Provider/模型运行时策略中。

    <Tip>
    如果您想要最清晰的计费路径，请改用 Anthropic API 密钥。OpenClaw 还支持来自 [OpenAI Codex](/providers/openai)、[Qwen Cloud](/providers/qwen)、[MiniMax](/providers/minimax) 和 [Z.AI / GLM](/providers/zai) 的订阅风格选项。
    </Tip>

  </Tab>
</Tabs>

## 思考默认值（Claude 4.6）

Claude 4.6 模型在 OpenClaw 中未设置显式思考级别时默认为 `adaptive` 思考。

使用 `/think:<level>` 或在模型参数中按消息覆盖：

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
相关 Anthropic 文档：
- [自适应思考](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [扩展思考](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## 提示缓存

OpenClaw 支持 Anthropic 的提示缓存功能，用于 API 密钥认证。

| 值                    | 缓存时长  | 描述                                   |
| --------------------- | --------- | -------------------------------------- |
| `"short"`（默认）     | 5 分钟    | 为 API 密钥认证自动应用                |
| `"long"`              | 1 小时    | 扩展缓存                               |
| `"none"`              | 无缓存    | 禁用提示缓存                           |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="每 Agent 缓存覆盖">
    使用模型级参数作为基准，然后通过 `agents.list[].params` 覆盖特定 Agent：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    配置合并顺序：

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params`（匹配 `id`，按键覆盖）

    这允许一个 Agent 保持长期缓存，而另一个使用相同模型的 Agent 为突发/低复用流量禁用缓存。

  </Accordion>

  <Accordion title="Bedrock Claude 说明">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在配置时接受 `cacheRetention` 直通。
    - 非 Anthropic Bedrock 模型在运行时强制设置 `cacheRetention: "none"`。
    - API 密钥智能默认值也会在没有设置显式值时为 Claude-on-Bedrock 引用设置 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 高级配置

<AccordionGroup>
  <Accordion title="快速模式">
    OpenClaw 的共享 `/fast` 开关支持直接 Anthropic 流量（API 密钥和 OAuth 到 `api.anthropic.com`）。

    | 命令 | 映射到 |
    |------|--------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - 仅对直接 `api.anthropic.com` 请求注入。代理路由保持 `service_tier` 不变。
    - 当两者都设置时，显式的 `serviceTier` 或 `service_tier` 参数优先于 `/fast`。
    - 在没有优先级层容量的账户上，`service_tier: "auto"` 可能解析为 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒体理解（图像和 PDF）">
    内置 Anthropic Plugin 注册图像和 PDF 理解。OpenClaw 从配置的 Anthropic 认证自动解析媒体功能——无需额外配置。

    | 属性          | 值                    |
    | ------------- | --------------------- |
    | 默认模型      | `claude-opus-4-7`     |
    | 支持的输入    | 图像、PDF 文档        |

    当图像或 PDF 附加到对话时，OpenClaw 自动通过 Anthropic 媒体理解 Provider 路由。

  </Accordion>

  <Accordion title="1M 上下文窗口">
    Anthropic 的 1M 上下文窗口已在支持 GA 的 Claude 4.x 模型上可用，
    例如 Opus 4.6、Opus 4.7 和 Sonnet 4.6。OpenClaw 会自动将这些模型的上下文大小设为 1M：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    旧配置可以保留 `params.context1m: true`，但 OpenClaw 不再发送
    已停用的 `context-1m-2025-08-07` 测试版请求头。包含该值的旧版 `anthropicBeta` 配置条目
    在请求头解析时会被忽略，不支持的旧版 Claude 模型仍会使用其正常的上下文窗口。

    `params.context1m: true` 也适用于 Claude CLI 后端（`claude-cli/*`）中符合条件的
    支持 GA 的 Opus 和 Sonnet 模型，保持这些 CLI Session 的运行时上下文窗口与直接 API 行为一致。

    <Warning>
    需要您的 Anthropic 凭据具有长上下文访问权限。OAuth/订阅 Token 认证保留其所需的 Anthropic 测试版请求头，但 OpenClaw 会在旧配置中仍存在时清除已停用的 1M 测试版请求头。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M 上下文">
    `anthropic/claude-opus-4.7` 及其 `claude-cli` 变体默认具有 1M 上下文窗口——无需 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="401 错误 / Token 突然失效">
    Anthropic Token 认证会过期并可被撤销。对于新设置，请改用 Anthropic API 密钥。
  </Accordion>

  <Accordion title='未找到 Provider "anthropic" 的 API 密钥'>
    Anthropic 认证是**每个 Agent** 独立的——新 Agent 不继承主 Agent 的密钥。为该 Agent 重新运行引导程序（或在 Gateway 主机上配置 API 密钥），然后使用 `openclaw models status` 验证。
  </Accordion>

  <Accordion title='未找到配置文件 "anthropic:default" 的凭据'>
    运行 `openclaw models status` 查看哪个认证配置文件处于活动状态。重新运行引导程序，或为该配置文件路径配置 API 密钥。
  </Accordion>

  <Accordion title="没有可用的认证配置文件（全部处于冷却中）">
    检查 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 速率限制冷却时间可以是模型范围的，因此同级 Anthropic 模型仍然可用。添加另一个 Anthropic 配置文件或等待冷却时间。
  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排除](/help/troubleshooting)和 [FAQ](/help/faq)。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="CLI 后端" href="/gateway/cli-backends" icon="terminal">
    Claude CLI 后端设置和运行时详情。
  </Card>
  <Card title="提示缓存" href="/reference/prompt-caching" icon="database">
    提示缓存如何在各 Provider 间工作。
  </Card>
  <Card title="OAuth 和认证" href="/gateway/authentication" icon="key">
    认证详情和凭据复用规则。
  </Card>
</CardGroup>
