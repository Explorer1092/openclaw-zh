---
mmh3_hash: "8bb7afabb49e0debe2f3b821572101ad"
title: "Anthropic (Claude)"
sidebarTitle: "Anthropic"
summary: "在 OpenClaw 中通过 API 密钥或 Claude CLI 使用 Anthropic Claude"
read_when:
  - 您想在 OpenClaw 中使用 Anthropic 模型
---

# Anthropic (Claude)

Anthropic 构建了 **Claude** 模型系列。OpenClaw 支持两种身份验证路由：

- **API 密钥** — 直接 Anthropic API 访问，按使用量计费（`anthropic/*` 模型）
- **Claude CLI** — 在同一主机上复用现有的 Claude CLI 登录

<Warning>
Anthropic 工作人员告知我们，OpenClaw 风格的 Claude CLI 使用再次被允许，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 使用视为已获批准的方式，除非 Anthropic 发布新政策。

对于长期运行的 Gateway 主机，Anthropic API 密钥仍然是最清晰、最可预测的生产路径。

Anthropic 当前的公开文档：

- [Claude Code CLI 参考](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK 概述](https://platform.claude.com/docs/en/agent-sdk/overview)
- [使用 Pro 或 Max 计划的 Claude Code](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [使用 Team 或 Enterprise 计划的 Claude Code](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)
  </Warning>

## 快速开始

<Tabs>
  <Tab title="API 密钥">
    **适用于：** 标准 API 访问和基于使用量的计费。

    <Steps>
      <Step title="获取 API 密钥">
        在 [Anthropic Console](https://console.anthropic.com/) 中创建 API 密钥。
      </Step>
      <Step title="运行入门">
        ```bash
        openclaw onboard
        # 选择：Anthropic API key
        ```

        或直接传递密钥：

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
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **适用于：** 无需单独 API 密钥，复用现有的 Claude CLI 登录。

    <Steps>
      <Step title="确保 Claude CLI 已安装并登录">
        通过以下命令验证：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="运行入门">
        ```bash
        openclaw onboard
        # 选择：Claude CLI
        ```

        OpenClaw 会检测并复用现有的 Claude CLI 凭据。
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

    <Tip>
    如果您想要最清晰的计费路径，请改用 Anthropic API 密钥。OpenClaw 还支持 [OpenAI Codex](/providers/openai)、[Qwen Cloud](/providers/qwen)、[MiniMax](/providers/minimax) 和 [Z.AI / GLM](/providers/glm) 的订阅式选项。
    </Tip>

  </Tab>
</Tabs>

## 思考默认值（Claude 4.6）

当没有设置明确的思考级别时，Claude 4.6 模型在 OpenClaw 中默认使用 `adaptive` 思考模式。

通过 `/think:<level>` 或在模型参数中按消息覆盖：

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

## Prompt 缓存

OpenClaw 支持 Anthropic 的 prompt 缓存功能，适用于 API 密钥身份验证。

| 值                   | 缓存持续时间 | 描述                          |
| -------------------- | ------------ | ----------------------------- |
| `"short"`（默认）    | 5 分钟       | API 密钥身份验证自动应用      |
| `"long"`             | 1 小时       | 扩展缓存                      |
| `"none"`             | 不缓存       | 禁用 prompt 缓存              |

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
  <Accordion title="按 Agent 的缓存覆盖">
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

    这允许一个 Agent 保持长期缓存，而同一模型上的另一个 Agent 禁用缓存，以避免对突发/低重用流量产生写入成本。

  </Accordion>

  <Accordion title="Bedrock Claude 注意事项">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在配置时接受 `cacheRetention` 透传。
    - 非 Anthropic Bedrock 模型在运行时强制设置为 `cacheRetention: "none"`。
    - Anthropic API 密钥智能默认值也会在没有设置显式值时为 Claude-on-Bedrock 模型引用生成 `cacheRetention: "short"`。
  </Accordion>
</AccordionGroup>

## 高级配置

<AccordionGroup>
  <Accordion title="Fast 模式">
    OpenClaw 的共享 `/fast` 切换支持直接 Anthropic 流量（API 密钥和 OAuth 到 `api.anthropic.com`）。

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
    - 仅对直接 `api.anthropic.com` 请求注入。代理路由不修改 `service_tier`。
    - 当两者都设置时，显式的 `serviceTier` 或 `service_tier` 参数会覆盖 `/fast`。
    - 在没有 Priority Tier 容量的账户上，`service_tier: "auto"` 仍可能解析为 `standard`。
    </Note>

  </Accordion>

  <Accordion title="媒体理解（图像和 PDF）">
    内置的 Anthropic 插件注册了图像和 PDF 理解。OpenClaw
    自动从配置的 Anthropic 身份验证解析媒体能力——
    无需额外配置。

    | 属性           | 值                   |
    | -------------- | -------------------- |
    | 默认模型       | `claude-opus-4-6`    |
    | 支持的输入     | 图像、PDF 文档        |

    当对话中附加了图像或 PDF 时，OpenClaw 自动
    通过 Anthropic 媒体理解 Provider 路由。

  </Accordion>

  <Accordion title="1M 上下文窗口（beta）">
    Anthropic 的 1M 上下文窗口处于 beta 阶段。按模型启用：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw 将此映射到请求的 `anthropic-beta: context-1m-2025-08-07`。

    <Warning>
    需要您的 Anthropic 凭据具有长上下文访问权限。旧版令牌身份验证（`sk-ant-oat-*`）会被拒绝用于 1M 上下文请求——OpenClaw 记录警告并回退到标准上下文窗口。
    </Warning>

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="401 错误 / 令牌突然无效">
    Anthropic 令牌身份验证可能会过期或被撤销。对于新设置，请迁移到 Anthropic API 密钥。
  </Accordion>

  <Accordion title='找不到提供商 "anthropic" 的 API 密钥'>
    身份验证是**按 Agent** 的。新 Agent 不继承主 Agent 的密钥。为该 Agent 重新运行入门，或在 Gateway 主机上配置 API 密钥，然后使用 `openclaw models status` 验证。
  </Accordion>

  <Accordion title='找不到配置文件 "anthropic:default" 的凭据'>
    运行 `openclaw models status` 查看哪个身份验证配置文件处于活动状态。重新运行入门，或为该配置文件路径配置 API 密钥。
  </Accordion>

  <Accordion title="没有可用的身份验证配置文件（全部处于冷却状态）">
    检查 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 速率限制冷却可能是模型范围的，因此同系列的 Anthropic 模型仍可能可用。添加另一个 Anthropic 配置文件或等待冷却结束。
  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排除](/help/troubleshooting) 和 [FAQ](/help/faq)。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="CLI 后端" href="/gateway/cli-backends" icon="terminal">
    Claude CLI 后端设置和运行时详情。
  </Card>
  <Card title="Prompt 缓存" href="/reference/prompt-caching" icon="database">
    跨 Provider 的 prompt 缓存工作方式。
  </Card>
  <Card title="OAuth 和身份验证" href="/gateway/authentication" icon="key">
    身份验证详情和凭据复用规则。
  </Card>
</CardGroup>
