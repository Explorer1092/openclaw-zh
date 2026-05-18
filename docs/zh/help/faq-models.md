---
mmh3_hash: "991ae9013a14c3ad0114375ab5a35124"
summary: "常见问题：模型默认值、选择、别名、切换、故障转移和认证配置文件"
read_when:
  - 选择或切换模型、配置别名
  - 调试模型故障转移 / "All models failed"
  - 了解认证配置文件及其管理方式
title: "常见问题：模型和认证"
sidebarTitle: "模型常见问题"
---

模型和认证配置文件问答。有关设置、Session、Gateway、Channel 和故障排除，请参阅主[常见问题](/help/faq)。

## 模型：默认值、选择、别名、切换

<AccordionGroup>
  <Accordion title='"默认模型"是什么？'>
    OpenClaw 的默认模型是你设置为以下内容的任何内容：

    ```
    agents.defaults.model.primary
    ```

    模型以 `provider/model` 的形式引用（示例：`openai/gpt-5.5` 或 `anthropic/claude-sonnet-4-6`）。如果省略 Provider，OpenClaw 首先尝试别名，然后尝试该确切模型 ID 的唯一配置 Provider 匹配，最后才回退到配置的默认 Provider（已弃用的兼容性路径）。如果该 Provider 不再公开配置的默认模型，OpenClaw 会回退到第一个配置的 Provider/模型，而不是显示已过时的已移除 Provider 默认值。你仍然应该**明确**设置 `provider/model`。

  </Accordion>

  <Accordion title="你推荐什么模型？">
    **推荐默认值：**使用你的 Provider 堆栈中可用的最强最新一代模型。
    **对于支持工具或不受信任输入的 Agent：**优先考虑模型强度而非成本。
    **对于日常/低风险聊天：**使用更便宜的备用模型并按 Agent 角色路由。

    MiniMax 有自己的文档：[MiniMax](/providers/minimax) 和[本地模型](/gateway/local-models)。

    经验法则：对于高风险工作使用**你能负担得起的最佳模型**，对于日常聊天或摘要使用更便宜的模型。你可以按 Agent 路由模型，并使用子 Agent 并行化长任务（每个子 Agent 都消耗令牌）。参阅[模型](/concepts/models)和[子 Agent](/tools/subagents)。

    强烈警告：较弱/过度量化的模型更容易受到提示注入和不安全行为的影响。参阅[安全性](/gateway/security)。

    更多背景：[模型](/concepts/models)。

  </Accordion>

  <Accordion title="如何在不清除配置的情况下切换模型？">
    使用**模型命令**或只编辑**模型**字段。避免完全替换配置。

    安全选项：

    - 在聊天中使用 `/model`（快速，每个 Session）
    - `openclaw models set ...`（只更新模型配置）
    - `openclaw configure --section model`（交互式）
    - 在 `~/.openclaw/openclaw.json` 中编辑 `agents.defaults.model`

    避免使用部分对象进行 `config.apply`，除非你打算替换整个配置。
    对于 RPC 编辑，先用 `config.schema.lookup` 检查，并优先使用 `config.patch`。查找有效负载给你规范化路径、浅层 schema 文档/约束和直接子摘要。
    用于部分更新。
    如果你确实覆盖了配置，请从备份恢复或重新运行 `openclaw doctor` 进行修复。

    文档：[模型](/concepts/models)、[配置](/cli/configure)、[配置](/cli/config)、[Doctor](/gateway/doctor)。

  </Accordion>

  <Accordion title="我可以使用自托管模型（llama.cpp、vLLM、Ollama）吗？">
    是的。Ollama 是本地模型最简单的路径。

    最快设置：

    1. 从 `https://ollama.com/download` 安装 Ollama
    2. 拉取本地模型，如 `ollama pull gemma4`
    3. 如果你还想要云模型，运行 `ollama signin`
    4. 运行 `openclaw onboard` 并选择 `Ollama`
    5. 选择 `Local` 或 `Cloud + Local`

    说明：

    - `Cloud + Local` 给你云模型加上你的本地 Ollama 模型
    - 云模型如 `kimi-k2.5:cloud` 不需要本地拉取
    - 对于手动切换，使用 `openclaw models list` 和 `openclaw models set ollama/<model>`

    安全说明：较小或大量量化的模型更容易受到提示注入的影响。我们强烈建议对任何可以使用工具的机器人使用**大型模型**。如果你仍然想要小型模型，请启用沙箱和严格的工具白名单。

    文档：[Ollama](/providers/ollama)、[本地模型](/gateway/local-models)、[模型 Provider](/concepts/model-providers)、[安全性](/gateway/security)、[沙箱](/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd 和 Krill 使用什么模型？">
    - 这些部署可能有所不同，并且可能随时间变化；没有固定的 Provider 推荐。
    - 使用 `openclaw models status` 检查每个 Gateway 的当前运行时设置。
    - 对于安全敏感/工具启用的 Agent，使用可用的最强最新一代模型。

  </Accordion>

  <Accordion title="如何动态切换模型（无需重启）？">
    使用 `/model` 命令作为独立消息：

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    这些是内置别名。可以通过 `agents.defaults.models` 添加自定义别名。

    你可以使用 `/model`、`/model list` 或 `/model status` 列出可用模型。

    `/model`（和 `/model list`）显示紧凑的编号选择器。按编号选择：

    ```
    /model 3
    ```

    你还可以为 Provider 强制指定特定的认证配置文件（每个 Session）：

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    提示：`/model status` 显示哪个 Agent 处于活跃状态、使用哪个 `auth-profiles.json` 文件，以及下一个将尝试哪个认证配置文件。
    当可用时，它还显示配置的 Provider 端点（`baseUrl`）和 API 模式（`api`）。

    **如何取消用 @profile 设置的配置文件？**

    **不带** `@profile` 后缀重新运行 `/model`：

    ```
    /model anthropic/claude-opus-4-6
    ```

    如果你想返回默认值，从 `/model` 中选择它（或发送 `/model <默认 provider/model>`）。
    使用 `/model status` 确认哪个认证配置文件处于活跃状态。

  </Accordion>

  <Accordion title="如果两个 Provider 公开相同的模型 ID，/model 使用哪个？">
    `/model provider/model` 为 Session 选择该确切的 Provider 路由。

    例如，`qianfan/deepseek-v4-flash` 和 `deepseek/deepseek-v4-flash` 是不同的模型引用，即使两者都包含 `deepseek-v4-flash`。OpenClaw 不应该仅因为裸模型 ID 匹配就静默地从一个 Provider 切换到另一个。

    用户选择的 `/model` 引用对备用策略也是严格的。如果选定的 Provider/模型不可用，回复会明显失败，而不是从 `agents.defaults.model.fallbacks` 回答。配置的备用链仍然适用于配置的默认值、cron 作业主要模型和自动选择的备用状态。

    如果从非 Session 覆盖开始的运行被允许使用备用，OpenClaw 首先尝试请求的 Provider/模型，然后是配置的备用，最后才是配置的主要模型。这防止重复的裸模型 ID 直接跳回默认 Provider。

    参阅[模型](/concepts/models)和[模型故障转移](/concepts/model-failover)。

  </Accordion>

  <Accordion title="我可以将 GPT 5.5 用于日常任务，将 Codex 5.5 用于编码吗？">
    是的。将模型选择和运行时选择分开处理：

    - **原生 Codex 编码 Agent：**将 `agents.defaults.model.primary` 设置为 `openai/gpt-5.5`。当你想要 ChatGPT/Codex 订阅认证时，使用 `openclaw models auth login --provider openai-codex` 登录。
    - **Agent 循环之外的直接 OpenAI API 任务：**配置 `OPENAI_API_KEY` 用于图像、嵌入、语音、实时和其他非 Agent OpenAI API 界面。
    - **OpenAI Agent API 密钥认证：**使用带有有序 `openai-codex` API 密钥配置文件的 `/model openai/gpt-5.5`。
    - **子 Agent：**将编码任务路由到具有自己的 `openai/gpt-5.5` 模型的 Codex 专注 Agent。

    参阅[模型](/concepts/models)和[Slash 命令](/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何为 GPT 5.5 配置快速模式？">
    使用 Session 切换或配置默认值：

    - **每个 Session：**在 Session 使用 `openai/gpt-5.5` 时发送 `/fast on`。
    - **每个模型默认值：**将 `agents.defaults.models["openai/gpt-5.5"].params.fastMode` 设置为 `true`。

    示例：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    对于 OpenAI，快速模式在支持的原生 Responses 请求上映射到 `service_tier = "priority"`。Session `/fast` 覆盖优先于配置默认值。

    参阅[思考和快速模式](/tools/thinking)和 [OpenAI 快速模式](/providers/openai#fast-mode)。

  </Accordion>

  <Accordion title='为什么我看到"Model ... is not allowed"然后没有回复？'>
    如果设置了 `agents.defaults.models`，它就成为 `/model` 和任何 Session 覆盖的**白名单**。选择不在该列表中的模型会返回：

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    该错误**代替**正常回复返回。修复：将确切模型添加到 `agents.defaults.models`，为动态 Provider 目录添加 Provider 通配符如 `"provider/*": {}`，删除白名单，或从 `/model list` 中选择模型。
    如果命令还包含 `--runtime codex`，请先更新白名单，然后重试相同的 `/model provider/model --runtime codex` 命令。

  </Accordion>

  <Accordion title='为什么我看到"Unknown model: minimax/MiniMax-M2.7"？'>
    这意味着 **Provider 未配置**（未找到 MiniMax Provider 配置或认证配置文件），因此无法解析模型。

    修复清单：

    1. 升级到当前的 OpenClaw 版本（或从源码 `main` 运行），然后重启 Gateway。
    2. 确保 MiniMax 已配置（向导或 JSON），或者 MiniMax 认证存在于环境/认证配置文件中，以便可以注入匹配的 Provider（`minimax` 的 `MINIMAX_API_KEY`，`minimax-portal` 的 `MINIMAX_OAUTH_TOKEN` 或存储的 MiniMax OAuth）。
    3. 使用你认证路径的确切模型 ID（区分大小写）：API 密钥设置使用 `minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`，OAuth 设置使用 `minimax-portal/MiniMax-M2.7` / `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 运行：

       ```bash
       openclaw models list
       ```

       并从列表中选择（或在聊天中使用 `/model list`）。

    参阅 [MiniMax](/providers/minimax) 和[模型](/concepts/models)。

  </Accordion>

  <Accordion title="我可以将 MiniMax 作为默认值，将 OpenAI 用于复杂任务吗？">
    是的。使用 **MiniMax 作为默认值**，并在需要时**每个 Session 切换模型**。备用是用于**错误**，而不是"困难任务"，因此使用 `/model` 或单独的 Agent。

    **选项 A：每个 Session 切换**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    然后：

    ```
    /model gpt
    ```

    **选项 B：单独的 Agent**

    - Agent A 默认：MiniMax
    - Agent B 默认：OpenAI
    - 按 Agent 路由或使用 `/agent` 切换

    文档：[模型](/concepts/models)、[多 Agent 路由](/concepts/multi-agent)、[MiniMax](/providers/minimax)、[OpenAI](/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt 是内置快捷方式吗？">
    是的。OpenClaw 附带了一些默认简写（仅在模型存在于 `agents.defaults.models` 中时应用）：

    - `opus` → `anthropic/claude-opus-4-7`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    如果你设置了同名的自定义别名，你的值优先。

  </Accordion>

  <Accordion title="如何定义/覆盖模型快捷方式（别名）？">
    别名来自 `agents.defaults.models.<modelId>.alias`。示例：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    然后 `/model sonnet`（或支持时的 `/<alias>`）解析为该模型 ID。

  </Accordion>

  <Accordion title="如何从其他 Provider（如 OpenRouter 或 Z.AI）添加模型？">
    OpenRouter（按令牌付费；多种模型）：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI（GLM 模型）：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    如果你引用了 Provider/模型但缺少所需的 Provider 密钥，你将收到运行时认证错误（例如 `No API key found for provider "zai"`）。

    **添加新 Agent 后找不到 Provider 的 API 密钥**

    这通常意味着**新 Agent** 有一个空的认证存储。认证是按 Agent 的，存储在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修复选项：

    - 运行 `openclaw agents add <id>` 并在向导期间配置认证。
    - 或者只将可移植的静态 `api_key` / `token` 配置文件从主 Agent 的认证存储复制到新 Agent 的认证存储。
    - 对于 OAuth 配置文件，在需要自己的账户时从新 Agent 登录；否则 OpenClaw 可以读取到默认/主 Agent，无需克隆刷新令牌。

    **不要**在 Agent 之间重用 `agentDir`；这会导致认证/Session 冲突。

  </Accordion>
</AccordionGroup>

## 模型故障转移和"All models failed"

<AccordionGroup>
  <Accordion title="故障转移如何工作？">
    故障转移分两个阶段进行：

    1. 同一 Provider 内的**认证配置文件轮换**。
    2. **模型备用**到 `agents.defaults.model.fallbacks` 中的下一个模型。

    冷却时间适用于失败的配置文件（指数退避），因此即使 Provider 受到速率限制或临时失败，OpenClaw 也可以继续响应。

    速率限制桶包含的内容不只是普通的 `429` 响应。OpenClaw 还将以下消息视为值得故障转移的速率限制：`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` 以及定期使用窗口限制（`weekly/monthly limit reached`）。

    一些看起来像计费的响应不是 `402`，一些 HTTP `402` 响应也保留在该临时桶中。如果 Provider 在 `401` 或 `403` 上返回明确的计费文本，OpenClaw 仍然可以将其保留在计费通道中，但特定于 Provider 的文本匹配器仍然限定于拥有它们的 Provider（例如 OpenRouter `Key limit exceeded`）。如果 `402` 消息看起来像可重试的使用窗口或组织/工作区支出限制（`daily limit reached, resets tomorrow`、`organization spending limit exceeded`），OpenClaw 将其视为 `rate_limit`，而不是长时间计费禁用。

    上下文溢出错误是不同的：签名如 `request_too_large`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model` 或 `ollama error: context length exceeded` 保留在压缩/重试路径上，而不是推进模型备用。

    通用服务器错误文本故意比"带有未知/错误的任何内容"更窄。OpenClaw 确实将 Provider 范围的临时形状视为值得故障转移的超时/过载信号：Anthropic 裸 `An unknown error occurred`、OpenRouter 裸 `Provider returned error`、停止原因错误如 `Unhandled stop reason: error`、带有临时服务器文本的 JSON `api_error` 有效负载（`internal server error`、`unknown error, 520`、`upstream error`、`backend error`），以及 Provider 忙错误如 `ModelNotReadyException`（当 Provider 上下文匹配时）。
    像 `LLM request failed with an unknown error.` 这样的通用内部备用文本保持保守，不会单独触发模型备用。

  </Accordion>

  <Accordion title='什么是"No credentials found for profile anthropic:default"的意思？'>
    这意味着系统尝试使用认证配置文件 ID `anthropic:default`，但无法在预期的认证存储中找到其凭据。

    **修复清单：**

    - **确认认证配置文件存储的位置**（新路径与旧路径）
      - 当前：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 旧版：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）
    - **确认你的环境变量由 Gateway 加载**
      - 如果你在 shell 中设置了 `ANTHROPIC_API_KEY` 但通过 systemd/launchd 运行 Gateway，它可能不会继承它。将其放在 `~/.openclaw/.env` 中或启用 `env.shellEnv`。
    - **确保你正在编辑正确的 Agent**
      - 多 Agent 设置意味着可能存在多个 `auth-profiles.json` 文件。
    - **健全性检查模型/认证状态**
      - 使用 `openclaw models status` 查看配置的模型以及 Provider 是否已认证。

    **"No credentials found for profile anthropic"的修复清单**

    这意味着运行被固定到 Anthropic 认证配置文件，但 Gateway 无法在其认证存储中找到它。

    - **使用 Claude CLI**
      - 在 Gateway 主机上运行 `openclaw models auth login --provider anthropic --method cli --set-default`。
    - **如果你想改用 API 密钥**
      - 将 `ANTHROPIC_API_KEY` 放在 **Gateway 主机**的 `~/.openclaw/.env` 中。
      - 清除任何强制使用缺失配置文件的固定顺序：

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **确认你在 Gateway 主机上运行命令**
      - 在远程模式下，认证配置文件存储在 Gateway 机器上，而不是你的笔记本电脑上。

  </Accordion>

  <Accordion title="为什么它还尝试了 Google Gemini 并失败了？">
    如果你的模型配置将 Google Gemini 包含为备用（或你切换到了 Gemini 简写），OpenClaw 将在模型备用期间尝试它。如果你没有配置 Google 凭据，你会看到 `No API key found for provider "google"`。

    修复：提供 Google 认证，或删除/避免 `agents.defaults.model.fallbacks` / 别名中的 Google 模型，这样备用不会路由到那里。

    **LLM 请求被拒绝：需要思考签名（Google Antigravity）**

    原因：Session 历史记录包含**没有签名的思考块**（通常来自中止/部分流）。Google Antigravity 需要思考块的签名。

    修复：OpenClaw 现在为 Google Antigravity Claude 剥离未签名的思考块。如果仍然出现，请开始**新 Session** 或为该 Agent 设置 `/thinking off`。

  </Accordion>
</AccordionGroup>

## 认证配置文件：它们是什么以及如何管理它们

相关：[/concepts/oauth](/concepts/oauth)（OAuth 流程、令牌存储、多账户模式）

<AccordionGroup>
  <Accordion title="什么是认证配置文件？">
    认证配置文件是绑定到 Provider 的命名凭据记录（OAuth 或 API 密钥）。配置文件存储在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    要检查保存的配置文件而不泄露密钥，运行 `openclaw models auth list`（可选择 `--provider <id>` 或 `--json`）。有关详情，请参阅[模型 CLI](/cli/models#auth-profiles)。

  </Accordion>

  <Accordion title="典型的配置文件 ID 是什么？">
    OpenClaw 使用带有 Provider 前缀的 ID，如：

    - `anthropic:default`（当不存在电子邮件身份时很常见）
    - 对于 OAuth 身份使用 `anthropic:<email>`
    - 你选择的自定义 ID（例如 `anthropic:work`）

  </Accordion>

  <Accordion title="我可以控制首先尝试哪个认证配置文件吗？">
    是的。配置支持可选的配置文件元数据和每个 Provider 的排序（`auth.order.<provider>`）。这**不会**存储密钥；它将 ID 映射到 Provider/模式并设置轮换顺序。

    如果配置文件处于短暂**冷却**（速率限制/超时/认证失败）或较长的**禁用**状态（计费/信用不足），OpenClaw 可能临时跳过该配置文件。要检查这个，运行 `openclaw models status --json` 并检查 `auth.unusableProfiles`。调整：`auth.cooldowns.billingBackoffHours*`。

    速率限制冷却可以是模型范围的。正在为一个模型冷却的配置文件对同一 Provider 上的同级模型仍然可用，而计费/禁用窗口仍然阻止整个配置文件。

    你还可以通过 CLI 设置**每个 Agent** 的顺序覆盖（存储在该 Agent 的 `auth-state.json` 中）：

    ```bash
    # 默认为配置的默认 Agent（省略 --agent）
    openclaw models auth order get --provider anthropic

    # 将轮换锁定到单个配置文件（只尝试这一个）
    openclaw models auth order set --provider anthropic anthropic:default

    # 或设置明确的顺序（Provider 内的备用）
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # 清除覆盖（回退到配置 auth.order / 轮询）
    openclaw models auth order clear --provider anthropic
    ```

    要针对特定 Agent：

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    要验证实际将尝试什么，使用：

    ```bash
    openclaw models status --probe
    ```

    如果存储的配置文件被明确顺序省略，探测报告该配置文件的 `excluded_by_auth_order` 而不是静默尝试它。

  </Accordion>

  <Accordion title="OAuth 与 API 密钥——有什么区别？">
    OpenClaw 两者都支持：

    - **OAuth** 通常利用订阅访问（在适用的情况下）。
    - **API 密钥**使用按令牌计费。

    向导明确支持 Anthropic Claude CLI、OpenAI Codex OAuth 和 API 密钥。

  </Accordion>
</AccordionGroup>

## 相关

- [FAQ](/help/faq) — 主要常见问题
- [FAQ — 快速入门和首次运行设置](/help/faq-first-run)
- [模型选择](/concepts/model-providers)
- [模型故障转移](/concepts/model-failover)
