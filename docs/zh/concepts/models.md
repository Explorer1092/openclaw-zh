---
title: "Models CLI"
sidebarTitle: "Models CLI"
mmh3_hash: "28c549f943065b29a58e787a87d621d0"
summary: "Models CLI: list、set、aliases、fallbacks、scan、status"
read_when:
  - 添加或修改 models CLI（models list/set/scan/aliases/fallbacks）
  - 更改 model 故障转移行为或选择 UX
  - 更新 model scan 探测（tools/images）
---

<CardGroup cols={2}>
  <Card title="Model failover" href="/concepts/model-failover">
    Auth profile 轮换、冷却及其与 fallbacks 的交互方式。
  </Card>
  <Card title="Model providers" href="/concepts/model-providers">
    快速 provider 概述和示例。
  </Card>
  <Card title="Agent runtimes" href="/concepts/agent-runtimes">
    PI、Codex 和其他 agent 循环 runtimes。
  </Card>
  <Card title="Configuration reference" href="/gateway/config-agents#agent-defaults">
    Model 配置键。
  </Card>
</CardGroup>

Model 引用选择 provider 和 model，通常不选择底层 agent runtime。OpenAI agent 引用是主要例外：`openai/gpt-5.5` 在官方 OpenAI provider 上默认通过 Codex app-server runtime 运行。明确的 runtime 覆盖应放在 provider/model 策略上，而不是整个 agent 或 session 上。在 Codex runtime 模式下，`openai/gpt-*` 引用不意味着 API 密钥计费；auth 可以来自 Codex 账户或 `openai-codex` auth profile。见 [Agent runtimes](/concepts/agent-runtimes)。

## Model 选择工作原理

OpenClaw 按以下顺序选择 model：

<Steps>
  <Step title="主 model">
    `agents.defaults.model.primary`（或 `agents.defaults.model`）。
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks`（按顺序）。
  </Step>
  <Step title="Provider auth 故障转移">
    Auth 故障转移在移至下一个 model 之前在 provider 内部发生。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="相关 model 表面">
    - `agents.defaults.models` 是 OpenClaw 可以使用的 model 允许列表/目录（加上别名）。使用 `provider/*` 条目来限制可见 provider，同时保持 provider 发现动态。
    - `agents.defaults.imageModel` 仅在主 model 无法接受图像时使用。
    - `agents.defaults.pdfModel` 由 `pdf` 工具使用。省略时，工具回退到 `agents.defaults.imageModel`，然后是解析的 session/默认 model。
    - `agents.defaults.imageGenerationModel` 由共享图像生成能力使用。省略时，`image_generate` 仍可推断 auth 支持的 provider 默认值。它首先尝试当前默认 provider，然后按 provider-id 顺序尝试其余已注册的图像生成 provider。如果设置了特定 provider/model，也需配置该 provider 的 auth/API 密钥。
    - `agents.defaults.musicGenerationModel` 由共享音乐生成能力使用。省略时，`music_generate` 仍可推断 auth 支持的 provider 默认值。它首先尝试当前默认 provider，然后按 provider-id 顺序尝试其余已注册的音乐生成 provider。如果设置了特定 provider/model，也需配置该 provider 的 auth/API 密钥。
    - `agents.defaults.videoGenerationModel` 由共享视频生成能力使用。省略时，`video_generate` 仍可推断 auth 支持的 provider 默认值。它首先尝试当前默认 provider，然后按 provider-id 顺序尝试其余已注册的视频生成 provider。如果设置了特定 provider/model，也需配置该 provider 的 auth/API 密钥。
    - 每 agent 默认值可以通过 `agents.list[].model` 加 bindings 覆盖 `agents.defaults.model`（见 [Multi-agent routing](/concepts/multi-agent)）。

  </Accordion>
</AccordionGroup>

## 选择来源和故障转移行为

相同的 `provider/model` 根据来源可能有不同含义：

- 已配置默认值（`agents.defaults.model.primary` 和 agent 特定主 model）是正常起点，使用 `agents.defaults.model.fallbacks`。
- 自动故障转移选择是临时恢复状态。它们以 `modelOverrideSource: "auto"` 存储，以便后续轮次可以继续使用故障转移链，而无需每次探测已知不良的主 model；OpenClaw 定期再次探测原始主 model，恢复时清除自动选择，并在每次状态变化时公告一次故障转移/恢复过渡。
- 用户 Session 选择是精确的。`/model`、model 选择器、`session_status(model=...)` 和 `sessions.patch` 存储 `modelOverrideSource: "user"`；如果所选 provider/model 不可达，OpenClaw 明显失败，而不是回落到另一个已配置 model。
- Cron `--model` / payload `model` 是每 job 主 model。它仍使用已配置的 fallbacks，除非 job 提供明确的 payload `fallbacks`（用 `fallbacks: []` 进行严格 cron 运行）。
- CLI 默认 model 和允许列表选择器通过列出明确的 `models.providers.*.models` 来遵守 `models.mode: "replace"`，而不是加载完整的内置目录。
- Control UI model 选择器向 Gateway 询问其已配置的 model 视图：当存在时的 `agents.defaults.models`，包括 provider 范围的 `provider/*` 条目，否则是明确的 `models.providers.*.models` 加上具有可用 auth 的 provider。完整内置目录保留给明确的浏览视图，如带 `view: "all"` 的 `models.list` 或 `openclaw models list --all`。

## 快速 model 策略

- 将主 model 设置为你可用的最强最新一代 model。
- 将 fallbacks 用于成本/延迟敏感任务和低风险聊天。
- 对于启用工具的 agent 或不可信输入，避免使用较旧/较弱的 model 层。

## 引导（推荐）

如果不想手动编辑配置，运行引导：

```bash
openclaw onboard
```

它可以为常用 provider 设置 model + auth，包括 **OpenAI Code（Codex）订阅**（OAuth）和 **Anthropic**（API 密钥或 Claude CLI）。

## 配置键（概述）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 和 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 和 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 和 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（允许列表 + 别名 + provider 参数 + `provider/*` 动态 provider 条目）
- `models.providers`（写入 `models.json` 的自定义 provider）

<Note>
Model 引用被规范化为小写。Provider 别名如 `z.ai/*` 规范化为 `zai/*`。

Provider 配置示例（包括 OpenCode）存在于 [OpenCode](/providers/opencode)。
</Note>

### 安全的允许列表编辑

手动更新 `agents.defaults.models` 时使用增量写入：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="覆盖保护规则">
    `openclaw config set` 保护 model/provider 映射免受意外覆盖。对 `agents.defaults.models`、`models.providers` 或 `models.providers.<id>.models` 的普通对象赋值在会删除现有条目时被拒绝。对增量更改使用 `--merge`；仅当提供的值应成为完整目标值时才使用 `--replace`。

    交互式 provider 设置和 `openclaw configure --section model` 也将 provider 范围的选择合并到现有允许列表中，因此添加 Codex、Ollama 或其他 provider 不会删除无关的 model 条目。配置在重新应用 provider auth 时保留现有的 `agents.defaults.model.primary`。明确的默认设置命令，如 `openclaw models auth login --provider <id> --set-default` 和 `openclaw models set <model>` 仍会替换 `agents.defaults.model.primary`。

  </Accordion>
</AccordionGroup>

## "Model is not allowed"（以及为什么回复停止）

如果设置了 `agents.defaults.models`，它将成为 `/model` 和 session 覆盖的**允许列表**。当用户选择不在该允许列表中的 model 时，OpenClaw 返回：

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
这发生在正常回复生成**之前**，所以消息可能感觉"没有响应"。修复方法是：

- 将 model 添加到 `agents.defaults.models`，或
- 清除允许列表（删除 `agents.defaults.models`），或
- 从 `/model list` 选择一个 model。

</Warning>

当被拒绝的命令包含运行时覆盖（如 `/model openai/gpt-5.5 --runtime codex`）时，先修复允许列表，然后重试相同的 `/model ... --runtime ...` 命令。对于原生 Codex 执行，所选 model 仍为 `openai/gpt-5.5`；`codex` runtime 选择 harness 并单独使用 Codex auth。

对于本地/GGUF model，将完整的 provider 前缀引用存储在允许列表中，例如 `ollama/gemma4:26b`、`lmstudio/Gemma4-26b-a4-it-gguf`，或 `openclaw models list --provider <provider>` 显示的确切 provider/model。当允许列表活跃时，裸本地文件名或显示名称不够。

如果想限制 provider 而不手动列出每个 model，在 `agents.defaults.models` 中添加 `provider/*` 条目：

```json5
{
  agents: {
    defaults: {
      models: {
        "openai-codex/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

使用该策略，`/model`、`/models` 和 model 选择器仅显示这些 provider 的已发现目录。所选 provider 的新 model 无需编辑允许列表即可出现。当需要来自另一个 provider 的某个特定 model 时，可以将精确的 `provider/model` 条目与 `provider/*` 条目混合。

允许列表配置示例：

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

## 在聊天中切换 model（`/model`）

可以在不重启的情况下为当前 session 切换 model：

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="选择器行为">
    - `/model`（和 `/model list`）是紧凑的编号选择器（model 系列 + 可用 provider）。
    - 在 Discord 上，`/model` 和 `/models` 打开带有 provider 和 model 下拉菜单加提交步骤的交互式选择器。
    - 在 Telegram 上，`/models` 选择器选项是 session 范围的；它们不会更改 agent 在 `openclaw.json` 中的持久默认值。
    - `/models add` 已弃用，现在返回弃用消息，而不是从聊天注册 model。
    - `/model <#>` 从该选择器中选择。

  </Accordion>
  <Accordion title="持久性和实时切换">
    - `/model` 立即持久化新的 session 选择。
    - 如果 agent 处于空闲状态，下一次运行立即使用新 model。
    - 如果运行已活跃，OpenClaw 将实时切换标记为待处理，仅在干净的重试点重启到新 model。
    - 如果工具活动或回复输出已经开始，待处理的切换可以排队等待稍后的重试机会或下一个用户轮次。
    - 用户选择的 `/model` 引用对该 session 是严格的：如果所选 provider/model 不可达，回复明显失败，而不是从 `agents.defaults.model.fallbacks` 静默回答。这与配置的默认值和 cron job 主 model 不同，后者仍可使用故障转移链。
    - `/model status` 是详细视图（auth 候选，以及配置时的 provider 端点 `baseUrl` + `api` 模式）。

  </Accordion>
  <Accordion title="引用解析">
    - Model 引用通过在**第一个** `/` 上分割来解析。输入 `/model <ref>` 时使用 `provider/model`。
    - 如果 model ID 本身包含 `/`（OpenRouter 风格），必须包含 provider 前缀（示例：`/model openrouter/moonshotai/kimi-k2`）。
    - 如果省略 provider，OpenClaw 按以下顺序解析输入：
      1. 别名匹配
      2. 该精确无前缀 model id 的唯一已配置 provider 匹配
      3. 已弃用的回退到已配置的默认 provider — 如果该 provider 不再暴露已配置的默认 model，OpenClaw 改为回退到第一个已配置的 provider/model，以避免暴露过时的已删除 provider 默认值
  </Accordion>
</AccordionGroup>

完整命令行为/配置：[Slash commands](/tools/slash-commands)。

## CLI 命令

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models`（无子命令）是 `models status` 的快捷方式。

### `models list`

默认显示已配置/auth 可用的 model。常用标志：

<ParamField path="--all" type="boolean">
  完整目录。包括在 auth 配置之前捆绑 provider 拥有的静态目录行，以便发现视图可以显示在添加匹配 provider 凭据之前不可用的 model。
</ParamField>
<ParamField path="--local" type="boolean">
  仅显示本地 provider。
</ParamField>
<ParamField path="--provider <id>" type="string">
  按 provider id 过滤，例如 `moonshot`。不接受交互式选择器中的显示标签。
</ParamField>
<ParamField path="--plain" type="boolean">
  每行一个 model。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读输出。
</ParamField>

### `models status`

显示已解析的主 model、fallbacks、图像 model，以及已配置 provider 的 auth 概述。它还会显示在 auth store 中找到的 profile 的 OAuth 到期状态（默认在 24 小时内警告）。`--plain` 仅打印已解析的主 model。

<AccordionGroup>
  <Accordion title="Auth 和探测行为">
    - OAuth 状态始终显示（并包含在 `--json` 输出中）。如果已配置的 provider 没有凭据，`models status` 打印**缺少 auth** 部分。
    - JSON 包含 `auth.oauth`（警告窗口 + profile）和 `auth.providers`（每个 provider 的有效 auth，包括环境变量支持的凭据）。`auth.oauth` 仅是 auth store profile 健康状况；仅有环境变量的 provider 不出现在那里。
    - 使用 `--check` 进行自动化（缺少/过期时退出 `1`，即将到期时退出 `2`）。
    - 使用 `--probe` 进行实时 auth 检查；探测行可以来自 auth profiles、环境凭据或 `models.json`。
    - 如果明确的 `auth.order.<provider>` 省略了已存储的 profile，探测报告 `excluded_by_auth_order`，而不是尝试它。如果 auth 存在但无法为该 provider 解析可探测的 model，探测报告 `status: no_model`。

  </Accordion>
</AccordionGroup>

<Note>
Auth 选择取决于 provider/账户。对于始终在线的 Gateway 主机，API 密钥通常是最可预测的；也支持 Claude CLI 重用和现有 Anthropic OAuth/token profiles。
</Note>

示例（Claude CLI）：

```bash
claude auth login
openclaw models status
```

## 扫描（OpenRouter 免费 model）

`openclaw models scan` 检查 OpenRouter 的**免费 model 目录**，可选择探测 model 的工具和图像支持。

<ParamField path="--no-probe" type="boolean">
  跳过实时探测（仅元数据）。
</ParamField>
<ParamField path="--min-params <b>" type="number">
  最小参数大小（十亿）。
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  跳过较旧的 model。
</ParamField>
<ParamField path="--provider <name>" type="string">
  Provider 前缀过滤器。
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Fallback 列表大小。
</ParamField>
<ParamField path="--set-default" type="boolean">
  将 `agents.defaults.model.primary` 设置为第一个选择。
</ParamField>
<ParamField path="--set-image" type="boolean">
  将 `agents.defaults.imageModel.primary` 设置为第一个图像选择。
</ParamField>

<Note>
OpenRouter `/models` 目录是公开的，因此仅元数据扫描可以列出免费候选，无需密钥。探测和推理仍需要 OpenRouter API 密钥（来自 auth profiles 或 `OPENROUTER_API_KEY`）。如果没有可用密钥，`openclaw models scan` 回退到仅元数据输出并保持配置不变。使用 `--no-probe` 明确请求仅元数据模式。
</Note>

扫描结果按以下排名：

1. 图像支持
2. 工具延迟
3. 上下文大小
4. 参数数量

输入：

- OpenRouter `/models` 列表（过滤 `:free`）
- 实时探测需要来自 auth profiles 或 `OPENROUTER_API_KEY` 的 OpenRouter API 密钥（见[环境变量](/help/environment)）
- 可选过滤器：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 请求/探测控制：`--timeout`、`--concurrency`

当实时探测在 TTY 中运行时，可以交互式选择 fallbacks。在非交互模式下，传递 `--yes` 接受默认值。仅元数据结果是信息性的；`--set-default` 和 `--set-image` 需要实时探测，以便 OpenClaw 不配置无法使用的无密钥 OpenRouter model。

## Model 注册表（`models.json`）

`models.providers` 中的自定义 provider 写入 agent 目录下的 `models.json`（默认 `~/.openclaw/agents/<agentId>/agent/models.json`）。除非 `models.mode` 设置为 `replace`，否则默认合并此文件。

<AccordionGroup>
  <Accordion title="合并模式优先级">
    匹配 provider ID 的合并模式优先级：

    - agent `models.json` 中已存在的非空 `baseUrl` 优先。
    - agent `models.json` 中的非空 `apiKey` 仅在该 provider 在当前配置/auth profile 上下文中不受 SecretRef 管理时优先。
    - SecretRef 管理的 provider `apiKey` 值从来源标记（环境引用为 `ENV_VAR_NAME`，文件/exec 引用为 `secretref-managed`）刷新，而不是持久化解析的密钥。
    - SecretRef 管理的 provider 标头值从来源标记（环境引用为 `secretref-env:ENV_VAR_NAME`，文件/exec 引用为 `secretref-managed`）刷新。
    - 空或缺失的 agent `apiKey`/`baseUrl` 回退到配置 `models.providers`。
    - 其他 provider 字段从配置和规范化目录数据刷新。

  </Accordion>
</AccordionGroup>

<Note>
标记持久性是来源权威的：OpenClaw 从活跃来源配置快照（预解析）写入标记，而不是从已解析的运行时密钥值。这适用于 OpenClaw 重新生成 `models.json` 的任何时候，包括命令驱动的路径，如 `openclaw agent`。
</Note>

## 相关

- [Agent runtimes](/concepts/agent-runtimes) — PI、Codex 和其他 agent 循环 runtimes
- [配置参考](/gateway/config-agents#agent-defaults) — model 配置键
- [图像生成](/tools/image-generation) — 图像 model 配置
- [Model failover](/concepts/model-failover) — 故障转移链
- [Model providers](/concepts/model-providers) — provider 路由和 auth
- [音乐生成](/tools/music-generation) — 音乐 model 配置
- [视频生成](/tools/video-generation) — 视频 model 配置
