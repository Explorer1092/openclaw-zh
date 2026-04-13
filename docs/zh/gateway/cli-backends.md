---
mmh3_hash: "2654df3e3db557757292c8034a0e5e92"
summary: "CLI backend：通过本地 AI CLI 的纯文本回退，以及可选的 MCP 工具桥接"
read_when:
  - 您希望在 API 提供商失败时有一个可靠的回退
  - 您正在运行 Codex CLI 或其他本地 AI CLI 并希望重用它们
  - 您想了解 CLI backend 工具访问的 MCP 回环桥接
title: "CLI Backends"
---

# CLI backend（回退运行时）

当 API 提供商宕机、速率受限或暂时行为异常时，OpenClaw 可以运行**本地 AI CLI** 作为**纯文本回退**。这是有意保守的：

- **OpenClaw 工具不会直接注入**，但设置了 `bundleMcp: true` 的 backend 可以通过回环 MCP 桥接接收 Gateway 工具。
- **JSONL 流式传输**，适用于支持它的 CLI。
- **支持 Session**（因此后续轮次保持连贯）。
- **可以传递图像**（如果 CLI 接受图像路径）。

这被设计为**安全网**而不是主要路径。当您希望"始终有效"的文本响应而不依赖外部 API 时使用它。

如果您想要带有 ACP Session 控制、后台任务、线程/对话绑定和持久外部编码 Session 的完整运行时，请改用 [ACP Agents](/tools/acp-agents)。CLI backend 不是 ACP。

## 初学者友好的快速入门

您可以**无需任何配置**使用 Codex CLI（捆绑的 OpenAI 插件注册了一个默认 backend）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

如果您的 Gateway 在 launchd/systemd 下运行并且 PATH 很少，只需添加命令路径：

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
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
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
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

每个条目由**provider ID** 键入（例如 `codex-cli`、`my-cli`）。provider ID 成为您的模型引用的左侧：

```
<provider>/<model>
```

### 示例配置

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
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
          // Codex 风格的 CLI 可以指向提示文件：
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## 工作原理

1. **选择一个 backend** 基于 provider 前缀（`codex-cli/...`）。
2. **构建系统提示** 使用相同的 OpenClaw 提示 + workspace 上下文。
3. **执行 CLI** 带有 Session ID（如果支持），以便历史保持一致。
4. **解析输出**（JSON 或纯文本）并返回最终文本。
5. **持久化 Session ID** 每个 backend，以便后续重用相同的 CLI Session。

<Note>
捆绑的 Anthropic `claude-cli` backend 再次被支持。Anthropic 工作人员告知我们 OpenClaw 风格的 Claude CLI 使用已再次获得许可，因此除非 Anthropic 发布新的政策，OpenClaw 将 `claude -p` 的使用视为此集成的认可路径。
</Note>

捆绑的 OpenAI `codex-cli` backend 通过 Codex 的 `model_instructions_file` 配置覆盖（`-c model_instructions_file="..."`）传递 OpenClaw 的系统提示。Codex 不暴露类似 Claude 风格的 `--append-system-prompt` 标志，因此 OpenClaw 为每个新的 Codex CLI Session 将组装好的提示写入临时文件。

捆绑的 Anthropic `claude-cli` backend 通过两种方式接收 OpenClaw Skills 快照：附加系统提示中的紧凑 OpenClaw Skills 目录，以及通过 `--plugin-dir` 传递的临时 Claude Code 插件。该插件仅包含该 Agent/Session 的符合条件的 Skills，因此 Claude Code 的原生 Skill 解析器看到的是 OpenClaw 在提示中会通告的同一过滤集。Skill 环境变量/API 密钥覆盖仍然由 OpenClaw 应用于运行的子进程环境。

## Session

- 如果 CLI 支持 Session，设置 `sessionArg`（例如 `--session-id`）或 `sessionArgs`（占位符 `{sessionId}`），当 ID 需要插入多个标志时。
- 如果 CLI 使用带有不同标志的**resume 子命令**，设置 `resumeArgs`（恢复时替换 `args`）和可选的 `resumeOutput`（用于非 JSON 恢复）。
- `sessionMode`：
  - `always`：始终发送 Session ID（如果未存储则为新 UUID）。
  - `existing`：仅在之前存储了 Session ID 时发送。
  - `none`：从不发送 Session ID。

序列化说明：

- `serialize: true` 保持同一通道运行有序。
- 大多数 CLI 在一个 provider 通道上序列化。
- 当 backend 认证状态更改时（包括重新登录、令牌轮换或更改的认证 profile 凭证），OpenClaw 会丢弃存储的 CLI Session 复用。

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
- `output: "jsonl"` 解析 JSONL 流（例如 Codex CLI `--json`）并在存在时提取最后一条 Agent 消息加上 Session 标识符。
- `output: "text"` 将 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）将提示作为最后一个 CLI 参数传递。
- `input: "stdin"` 通过 stdin 发送提示。
- 如果提示很长且设置了 `maxPromptArgChars`，则使用 stdin。

## 默认值（插件拥有）

捆绑的 OpenAI 插件还为 `codex-cli` 注册了默认值：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

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
- `codex-cli`：`mcp_servers` 的内联配置覆盖
- `google-gemini-cli`：生成 Gemini 系统设置文件

启用 Bundle MCP 时，OpenClaw：

- 生成一个回环 HTTP MCP 服务器，向 CLI 进程公开 Gateway 工具
- 使用每个 Session 的令牌（`OPENCLAW_MCP_TOKEN`）对桥接进行认证
- 将工具访问范围限定到当前 Session、账户和 Channel 上下文
- 为当前 workspace 加载已启用的 bundle-MCP 服务器
- 将它们与任何现有 backend MCP 配置/设置形状合并
- 使用拥有扩展中 backend 拥有的集成模式重写启动配置

如果没有 MCP 服务器被启用，当 backend 选择 Bundle MCP 时，OpenClaw 仍然注入严格配置，以使后台运行保持隔离。

## 限制

- **无直接 OpenClaw 工具调用。** OpenClaw 不向 CLI backend 协议注入工具调用。Backend 仅在选择 `bundleMcp: true` 时才能看到 Gateway 工具。
- **流式传输特定于 backend。** 某些 backend 流式传输 JSONL；其他 backend 缓冲直到退出。
- **结构化输出**取决于 CLI 的 JSON 格式。
- **Codex CLI Session** 通过文本输出恢复（无 JSONL），这比初始 `--json` 运行的结构化程度低。OpenClaw Session 仍然正常工作。

## 故障排除

- **找不到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` → CLI 模型映射。
- **无 Session 连续性**：确保设置了 `sessionArg` 且 `sessionMode` 不是 `none`（Codex CLI 当前无法使用 JSON 输出恢复）。
- **图像被忽略**：设置 `imageArg`（并验证 CLI 支持文件路径）。
