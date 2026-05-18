---
mmh3_hash: "de3d851c13db86290e17d6b85ec02ba0"
summary: "CLI backend：通过本地 AI CLI 的纯文本回退，以及可选的 MCP 工具桥接"
read_when:
  - 您希望在 API 提供商失败时有一个可靠的回退
  - 您正在运行本地 AI CLI 并希望重用它们
  - 您想了解 CLI backend 工具访问的 MCP 回环桥接
title: "CLI backends"
---

当 API 提供商宕机、速率受限或暂时行为异常时，OpenClaw 可以运行**本地 AI CLI** 作为**纯文本回退**。这是有意保守的：

- **OpenClaw 工具不会直接注入**，但设置了 `bundleMcp: true` 的 backend 可以通过回环 MCP 桥接接收 Gateway 工具。
- **JSONL 流式传输**，适用于支持它的 CLI。
- **支持 Session**（因此后续轮次保持连贯）。
- **可以传递图像**（如果 CLI 接受图像路径）。

这被设计为**安全网**而不是主要路径。当您希望"始终有效"的文本响应而不依赖外部 API 时使用它。

如果您想要带有 ACP Session 控制、后台任务、线程/对话绑定和持久外部编码 Session 的完整运行时，请改用 [ACP Agents](/tools/acp-agents)。CLI backend 不是 ACP。

<Tip>
  正在构建新的 backend 插件？请使用 [CLI backend 插件](/plugins/cli-backend-plugins)。本页面面向配置和操作已注册 backend 的用户。
</Tip>

## 初学者友好的快速入门

您可以**无需任何配置**使用 Claude Code CLI（捆绑的 Anthropic 插件注册了一个默认 backend）：

```bash
openclaw agent --message "hi" --model claude-cli/claude-sonnet-4-6
```

如果您的 Gateway 在 launchd/systemd 下运行并且 PATH 很少，只需添加命令路径：

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

就是这样。除了 CLI 本身之外，不需要密钥，不需要额外的认证配置。

如果您将捆绑的 CLI backend 作为 Gateway 主机上的**主要消息提供商**使用，当您的配置在模型引用或 `agents.defaults.cliBackends` 下明确引用该 backend 时，OpenClaw 现在会自动加载拥有该 backend 的捆绑插件。

## 将其用作回退

将 CLI backend 添加到您的回退列表中，以便仅在主要模型失败时运行：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

注意：

- 如果您使用 `agents.defaults.models`（allowlist），则必须包含您的 CLI backend 模型。
- 如果主要提供商失败（认证、速率限制、超时），OpenClaw 将接下来尝试 CLI backend。

## 配置概述

所有 CLI backend 位于：

```
agents.defaults.cliBackends
```

每个条目由**provider ID** 键入（例如 `claude-cli`、`my-cli`）。provider ID 成为您的模型引用的左侧：

```
<provider>/<model>
```

### 示例配置

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // 对于具有专用提示文件标志的 CLI：
          // systemPromptFileArg: "--system-file",
          // Codex 风格的 CLI 可以指向提示文件：
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // 仅在该 backend 可能在压缩前从有界原始 OpenClaw 转录历史重播安全失效 Session 时启用
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## 工作原理

1. **选择一个 backend** 基于 provider 前缀（`claude-cli/...`）。
2. **构建系统提示** 使用相同的 OpenClaw 提示 + workspace 上下文。
3. **执行 CLI** 带有 Session ID（如果支持），以便历史保持一致。捆绑的 `claude-cli` 后端在每个 OpenClaw Session 中保持一个 Claude stdio 进程活跃，并通过 stream-json stdin 发送后续轮次。
4. **解析输出**（JSON 或纯文本）并返回最终文本。
5. **持久化 Session ID** 每个 backend，以便后续重用相同的 CLI Session。

<Note>
捆绑的 Anthropic `claude-cli` backend 再次被支持。Anthropic 工作人员告知我们 OpenClaw 风格的 Claude CLI 使用已再次获得许可，因此除非 Anthropic 发布新的政策，OpenClaw 将 `claude -p` 的使用视为此集成的认可路径。
</Note>

捆绑的 Anthropic `claude-cli` backend 通过两种方式接收 OpenClaw Skills 快照：附加系统提示中的紧凑 OpenClaw Skills 目录，以及通过 `--plugin-dir` 传递的临时 Claude Code 插件。该插件仅包含该 Agent/Session 的符合条件的 Skills，因此 Claude Code 的原生 Skill 解析器看到的是 OpenClaw 在提示中会通告的同一过滤集。Skill 环境变量/API 密钥覆盖仍然由 OpenClaw 应用于运行的子进程环境。

Claude CLI 也有自己的非交互式权限模式。OpenClaw 将其映射到现有的 exec 策略，而不是添加 Claude 特定配置：当有效请求的 exec 策略为 YOLO 时（`tools.exec.security: "full"` 且 `tools.exec.ask: "off"`），OpenClaw 添加 `--permission-mode bypassPermissions`。每个 Agent 的 `agents.list[].tools.exec` 设置会覆盖该 Agent 的全局 `tools.exec`。若要强制使用不同的 Claude 模式，请在 `agents.defaults.cliBackends.claude-cli.args` 和匹配的 `resumeArgs` 下设置明确的原始 backend 参数，例如 `--permission-mode default` 或 `--permission-mode acceptEdits`。

捆绑的 Anthropic `claude-cli` backend 还将 OpenClaw `/think` 级别映射到 Claude Code 的原生 `--effort` 标志（非 off 级别）。`minimal` 和 `low` 映射到 `low`，`adaptive` 和 `medium` 映射到 `medium`，`high`、`xhigh` 和 `max` 直接映射。其他 CLI backend 需要其所属插件声明等效的 argv 映射器，`/think` 才能影响生成的 CLI。

在 OpenClaw 可以使用捆绑的 `claude-cli` backend 之前，Claude Code 本身必须已在同一主机上登录：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

仅当 `claude` 二进制文件尚未在 `PATH` 上时，才使用 `agents.defaults.cliBackends.claude-cli.command`。

## Session

- 如果 CLI 支持 Session，设置 `sessionArg`（例如 `--session-id`）或 `sessionArgs`（占位符 `{sessionId}`），当 ID 需要插入多个标志时。
- 如果 CLI 使用带有不同标志的**resume 子命令**，设置 `resumeArgs`（恢复时替换 `args`）和可选的 `resumeOutput`（用于非 JSON 恢复）。
- `sessionMode`：
  - `always`：始终发送 Session ID（如果未存储则为新 UUID）。
  - `existing`：仅在之前存储了 Session ID 时发送。
  - `none`：从不发送 Session ID。
- `claude-cli` 默认为 `liveSession: "claude-stdio"`、`output: "jsonl"` 和 `input: "stdin"`，以便后续轮次在活跃的 Claude 进程期间重用。热 stdio 现在是默认值，包括省略传输字段的自定义配置。如果 Gateway 重启或空闲进程退出，OpenClaw 将从存储的 Claude Session ID 恢复。存储的 Session ID 在恢复前会与现有的可读项目转录进行验证，因此幻影绑定会以 `reason=transcript-missing` 清除，而不是在 `--resume` 下静默启动新的 Claude CLI Session。
- Claude 实时 Session 保持有界 JSONL 输出限制。默认每轮允许最多 8 MiB 和 20,000 行原始 JSONL。工具密集型 Claude 轮次可通过 `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` 和 `maxTurnLines` 提高每个 backend 的限制；OpenClaw 将这些设置限制在 64 MiB 和 100,000 行。
- 存储的 CLI Session 是提供商拥有的连续性。隐式每日 Session 重置不会中断它们；`/reset` 和显式 `session.reset` 策略仍然会中断。
- 新的 CLI Session 通常只从 OpenClaw 的压缩摘要加上压缩后尾部重播。若要恢复在压缩前失效的短 Session，backend 可以通过 `reseedFromRawTranscriptWhenUncompacted: true` 选择加入。OpenClaw 仍然将原始转录重播保持在有界范围内，并将其限制在安全的失效情况（如缺失的 CLI 转录、系统提示/MCP 变更或 Session 过期重试）；auth profile 或凭证 epoch 变更永远不会重播原始转录历史。

序列化说明：

- `serialize: true` 保持同一通道运行有序。
- 大多数 CLI 在一个 provider 通道上序列化。
- 当所选认证身份更改时，OpenClaw 会丢弃存储的 CLI Session 复用，包括更改的 auth profile ID、静态 API 密钥、静态令牌，或 CLI 公开 OAuth 账户身份时。OAuth 访问和刷新令牌轮换不会中断存储的 CLI Session。如果 CLI 不公开稳定的 OAuth 账户 ID，OpenClaw 让该 CLI 强制执行恢复权限。

## 从 claude-cli Session 的回退前导

当 `claude-cli` 尝试失败并转移到 [`agents.defaults.model.fallbacks`](/concepts/model-failover) 中的非 CLI 候选时，OpenClaw 会从 `~/.claude/projects/` 的 Claude Code 本地 JSONL 转录中收集上下文前导，为下一次尝试提供种子。没有这个种子，回退提供商将从冷启动，因为 OpenClaw 自身的 Session 转录对于 `claude-cli` 运行是空的。

- 前导优先使用最新的 `/compact` 摘要或 `compact_boundary` 标记，然后附加压缩边界后最近的轮次（最多字符预算）。边界前的轮次被丢弃，因为摘要已经代表了它们。
- 工具块被合并为紧凑的 `(tool call: name)` 和 `(tool result: …)` 提示以保持提示预算准确。如果溢出，摘要会标记为 `(truncated)`。
- 同提供商的 `claude-cli` 到 `claude-cli` 回退依赖 Claude 自己的 `--resume`，跳过前导。
- 种子重用现有的 Claude Session 文件路径验证，因此无法读取任意路径。

## 图像（透传）

如果您的 CLI 接受图像路径，设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 将 base64 图像写入临时文件。如果设置了 `imageArg`，这些路径将作为 CLI 参数传递。如果缺少 `imageArg`，OpenClaw 将文件路径附加到提示中（路径注入），这对于从纯路径自动加载本地文件的 CLI 来说已经足够了。

## 输入/输出

- `output: "json"`（默认）尝试解析 JSON 并提取文本 + Session ID。
- 对于 Gemini CLI JSON 输出，当 `usage` 缺失或为空时，OpenClaw 从 `response` 读取回复文本，从 `stats` 读取使用量。
- `output: "jsonl"` 解析 JSONL 流并在存在时提取最后一条 Agent 消息加上 Session 标识符。
- `output: "text"` 将 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）将提示作为最后一个 CLI 参数传递。
- `input: "stdin"` 通过 stdin 发送提示。
- 如果提示很长且设置了 `maxPromptArgChars`，则使用 stdin。

## 默认值（插件拥有）

捆绑的 CLI backend 默认值随其所属插件一起提供。例如，Anthropic 拥有 `claude-cli`，Google 拥有 `google-gemini-cli`。OpenAI Codex agent 运行通过 `openai/*` 使用 Codex app-server harness；OpenClaw 不再注册捆绑的 `codex-cli` backend。

捆绑的 Anthropic 插件为 `claude-cli` 注册了默认值：

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

捆绑的 Google 插件还为 `google-gemini-cli` 注册了默认值：

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件：本地 Gemini CLI 必须已安装，并且在 `PATH` 上可作为 `gemini` 使用（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）。

Gemini CLI JSON 说明：

- 回复文本从 JSON `response` 字段读取。
- 当 `usage` 缺失或为空时，使用量回退到 `stats`。
- `stats.cached` 被规范化为 OpenClaw `cacheRead`。
- 如果 `stats.input` 缺失，OpenClaw 从 `stats.input_tokens - stats.cached` 推导输入 token。

仅在需要时覆盖（常见：绝对 `command` 路径）。

## 插件拥有的默认值

CLI backend 默认值现在是插件接口的一部分：

- 插件通过 `api.registerCliBackend(...)` 注册它们。
- backend `id` 成为模型引用中的 provider 前缀。
- `agents.defaults.cliBackends.<id>` 中的用户配置仍然覆盖插件默认值。
- 特定于 backend 的配置清理通过可选的 `normalizeConfig` hook 保持插件拥有。

需要微小提示/消息兼容性垫片的插件可以在不替换 provider 或 CLI backend 的情况下声明双向文本转换：

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` 重写传递给 CLI 的系统提示和用户提示。`output` 在 OpenClaw 处理其自己的控制标记和 Channel 交付之前重写流式助手增量和解析的最终文本。

对于发出兼容 Claude Code stream-json 的 JSONL 的 CLI，在该 backend 的配置上设置 `jsonlDialect: "claude-stream-json"`。

## Bundle MCP overlays

CLI backend **不会**直接接收 OpenClaw 工具调用，但 backend 可以通过 `bundleMcp: true` 选择接收生成的 MCP 配置 overlay。

当前捆绑行为：

- `claude-cli`：生成严格的 MCP 配置文件
- `google-gemini-cli`：生成 Gemini 系统设置文件

启用 Bundle MCP 时，OpenClaw：

- 生成一个回环 HTTP MCP 服务器，向 CLI 进程公开 Gateway 工具
- 使用每个 Session 的令牌（`OPENCLAW_MCP_TOKEN`）对桥接进行认证
- 将工具访问范围限定到当前 Session、账户和 Channel 上下文
- 为当前 workspace 加载已启用的 bundle-MCP 服务器
- 将它们与任何现有 backend MCP 配置/设置形状合并
- 使用拥有扩展中 backend 拥有的集成模式重写启动配置

如果没有 MCP 服务器被启用，当 backend 选择 Bundle MCP 时，OpenClaw 仍然注入严格配置，以使后台运行保持隔离。

Session 范围的捆绑 MCP 运行时在 Session 内缓存以供重用，然后在 `mcp.sessionIdleTtlMs` 毫秒空闲时间后回收（默认 10 分钟；设置 `0` 以禁用）。一次性嵌入式运行（如 auth 探测、slug 生成和 active-memory recall）在运行结束时请求清理，以便 stdio 子进程和 Streamable HTTP/SSE 流不会超出运行寿命。

## 限制

- **无直接 OpenClaw 工具调用。** OpenClaw 不向 CLI backend 协议注入工具调用。Backend 仅在选择 `bundleMcp: true` 时才能看到 Gateway 工具。
- **流式传输特定于 backend。** 某些 backend 流式传输 JSONL；其他 backend 缓冲直到退出。
- **结构化输出**取决于 CLI 的 JSON 格式。

## 故障排除

- **找不到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` → CLI 模型映射。
- **无 Session 连续性**：确保设置了 `sessionArg` 且 `sessionMode` 不是 `none`。
- **图像被忽略**：设置 `imageArg`（并验证 CLI 支持文件路径）。

## 相关

- [Gateway 说明书](/gateway)
- [本地模型](/gateway/local-models)
