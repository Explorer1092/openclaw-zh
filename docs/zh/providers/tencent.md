---
mmh3_hash: "89bda1bcc686a612d75141041f368231"
summary: "Tencent Cloud TokenHub 设置，用于 Hy3 预览"
title: "Tencent Cloud (TokenHub)"
read_when:
  - 您希望在 OpenClaw 中使用 Tencent Hy3 预览
  - 您需要 TokenHub API 密钥设置
---

Tencent Cloud 作为 OpenClaw 的捆绑 Provider Plugin 提供。它通过 TokenHub 端点（`tencent-tokenhub`）提供对 Tencent Hy3 预览的访问，使用 OpenAI 兼容 API。

| 属性             | 值                                                    |
| ---------------- | ----------------------------------------------------- |
| Provider id      | `tencent-tokenhub`                                    |
| Plugin           | bundled, `enabledByDefault: true`                     |
| 认证环境变量     | `TOKENHUB_API_KEY`                                    |
| Onboarding flag  | `--auth-choice tokenhub-api-key`                      |
| 直接 CLI 标志    | `--tokenhub-api-key <key>`                            |
| API              | OpenAI 兼容（`openai-completions`）                   |
| 默认 Base URL    | `https://tokenhub.tencentmaas.com/v1`                 |
| 全球 Base URL    | `https://tokenhub-intl.tencentmaas.com/v1`（覆盖）   |
| 默认模型         | `tencent-tokenhub/hy3-preview`                        |

## 快速开始

<Steps>
  <Step title="创建 TokenHub API 密钥">
    在 Tencent Cloud TokenHub 中创建 API 密钥。如果您为密钥选择了有限访问范围，请在允许的模型中包含 **Hy3 预览**。
  </Step>
  <Step title="运行引导程序">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="验证模型">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## 非交互式设置

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## 内置目录

| 模型引用                       | 名称                   | 输入 | 上下文  | 最大输出 | 说明                         |
| ------------------------------ | ---------------------- | ---- | ------- | -------- | ---------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | 文本 | 256,000 | 64,000   | 默认；支持推理               |

Hy3 预览是 Tencent Hunyuan 用于推理、长上下文指令跟随、代码和 Agent 工作流的大型 MoE 语言模型。Tencent 的 OpenAI 兼容示例使用 `hy3-preview` 作为模型 id，支持标准聊天补全工具调用和 `reasoning_effort`。

<Tip>
  模型 id 为 `hy3-preview`。不要将其与 Tencent 的 `HY-3D-*` 模型混淆，后者是 3D 生成 API，不是此 Provider 配置的 OpenClaw 聊天模型。
</Tip>

## 分层定价

内置目录附带分层成本元数据，可根据输入窗口长度进行扩展，因此无需手动覆盖即可填充成本估算。

| 输入 Token 范围    | 输入费率 | 输出费率 | 缓存读取 |
| ------------------ | -------- | -------- | -------- |
| 0 - 16,000         | 0.176    | 0.587    | 0.059    |
| 16,000 - 32,000    | 0.235    | 0.939    | 0.088    |
| 32,000+            | 0.293    | 1.173    | 0.117    |

费率为每百万 Token 的 USD 价格，按 Tencent 公告为准。仅在需要不同接口时才在 `models.providers.tencent-tokenhub` 下覆盖定价。

## 高级配置

<AccordionGroup>
  <Accordion title="端点覆盖">
    OpenClaw 默认使用 Tencent Cloud 的 `https://tokenhub.tencentmaas.com/v1` 端点。Tencent 还提供了国际 TokenHub 端点：

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    仅在您的 TokenHub 账户或区域需要时才覆盖端点。

  </Accordion>

  <Accordion title="守护进程的环境可用性">
    如果 Gateway 作为托管服务（launchd、systemd、Docker）运行，`TOKENHUB_API_KEY` 必须对该进程可见。请在 `~/.openclaw/.env` 中或通过 `env.shellEnv` 进行设置，以便 launchd、systemd 或 Docker exec 环境能够读取。

    <Warning>
      仅在 `~/.profile` 中设置的密钥对托管 Gateway 进程不可见。请使用 env 文件或配置入口以确保持久可用性。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型 Provider" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/gateway/configuration" icon="gear">
    包含 Provider 设置的完整配置 Schema。
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud TokenHub 产品页面。
  </Card>
  <Card title="Hy3 预览模型卡" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 预览详情和基准测试。
  </Card>
</CardGroup>
