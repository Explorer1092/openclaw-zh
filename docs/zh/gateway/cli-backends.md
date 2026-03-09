---
mmh3_hash: "6427954063cd417b61d6088853c4190e"
summary: "CLI backend:通过本地 AI CLI 的纯文本回退"
read_when:
  - 您希望在 API 提供商失败时有一个可靠的回退
  - 您正在运行 Claude Code CLI 或其他本地 AI CLI 并希望重用它们
  - 您需要一个纯文本、无工具的路径,仍然支持 session 和图像
title: "CLI Backends"
---

# CLI backend(回退运行时)

当 API 提供商宕机、速率受限或暂时行为异常时,OpenClaw 可以运行 **本地 AI CLI** 作为 **纯文本回退**。这是有意保守的:

- **工具被禁用**(无工具调用)。
- **文本输入 → 文本输出**(可靠)。
- **支持 Session**(因此后续轮次保持连贯)。
- **可以传递图像**(如果 CLI 接受图像路径)。

这被设计为 **安全网** 而不是主要路径。当您希望"始终有效"的文本响应而不依赖外部 API 时使用它。

## 初学者友好的快速入门

您可以 **无需任何配置** 使用 Claude Code CLI(OpenClaw 附带内置默认值):

```bash
openclaw agent --message "hi" --model claude-cli/opus-4.6
```

Codex CLI 也可以开箱即用:

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

如果您的 Gateway 在 launchd/systemd 下运行并且 PATH 很少,只需添加命令路径:

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

就是这样。除了 CLI 本身之外,不需要密钥,不需要额外的认证配置。

## 将其用作回退

将 CLI backend 添加到您的回退列表中,以便仅在主要模型失败时运行:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/opus-4.6", "claude-cli/opus-4.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/opus-4.6": {},
        "claude-cli/opus-4.5": {},
      },
    },
  },
}
```

注意:

- 如果您使用 `agents.defaults.models`(allowlist),则必须包含 `claude-cli/...`。
- 如果主要提供商失败(认证、速率限制、超时),OpenClaw 将接下来尝试 CLI backend。

## 配置概述

所有 CLI backend 位于:

```
agents.defaults.cliBackends
```

每个条目由 **provider ID** 键入(例如 `claude-cli`、`my-cli`)。provider ID 成为您的模型引用的左侧:

```
<provider>/<model>
```

### 示例配置

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-opus-4-5": "opus",
            "claude-sonnet-4-5": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
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

## 它是如何工作的

1. **选择一个 backend** 基于 provider 前缀(`claude-cli/...`)。
2. **构建系统提示** 使用相同的 OpenClaw 提示 + workspace 上下文。
3. **执行 CLI** 带有 session ID(如果支持),以便历史保持一致。
4. **解析输出**(JSON 或纯文本)并返回最终文本。
5. **持久化 session ID** 每个 backend,以便后续重用相同的 CLI session。

## Session

- 如果 CLI 支持 session,设置 `sessionArg`(例如 `--session-id`)或 `sessionArgs`(占位符 `{sessionId}`),当 ID 需要插入多个标志时。
- 如果 CLI 使用 **resume 子命令** 带有不同的标志,设置 `resumeArgs`(恢复时替换 `args`)和可选的 `resumeOutput`(用于非 JSON 恢复)。
- `sessionMode`:
  - `always`:始终发送 session ID(如果未存储则为新 UUID)。
  - `existing`:仅在之前存储了 session ID 时发送。
  - `none`:从不发送 session ID。

## 图像(透传)

如果您的 CLI 接受图像路径,设置 `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 将 base64 图像写入临时文件。如果设置了 `imageArg`,这些路径将作为 CLI 参数传递。如果缺少 `imageArg`,OpenClaw 将文件路径附加到提示中(路径注入),这对于从纯路径自动加载本地文件的 CLI(Claude Code CLI 行为)来说已经足够了。

## 输入/输出

- `output: "json"`(默认)尝试解析 JSON 并提取文本 + session ID。
- `output: "jsonl"` 解析 JSONL 流(Codex CLI `--json`)并在存在时提取最后一条 Agent 消息加上 `thread_id`。
- `output: "text"` 将 stdout 视为最终响应。

输入模式:

- `input: "arg"`(默认)将提示作为最后一个 CLI 参数传递。
- `input: "stdin"` 通过 stdin 发送提示。
- 如果提示很长且设置了 `maxPromptArgChars`,则使用 stdin。

## 默认值(内置)

OpenClaw 为 `claude-cli` 附带默认值:

- `command: "claude"`
- `args: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

OpenClaw 也为 `codex-cli` 附带默认值:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

仅在需要时覆盖(常见:绝对 `command` 路径)。

## 限制

- **无 OpenClaw 工具**(CLI backend 从不接收工具调用)。某些 CLI 可能仍然运行自己的 Agent 工具。
- **无流式传输**(CLI 输出被收集后返回)。
- **结构化输出** 取决于 CLI 的 JSON 格式。
- **Codex CLI session** 通过文本输出恢复(无 JSONL),这比初始 `--json` 运行的结构化程度低。OpenClaw session 仍然正常工作。

## 故障排除

- **找不到 CLI**:将 `command` 设置为完整路径。
- **模型名称错误**:使用 `modelAliases` 将 `provider/model` → CLI 模型映射。
- **无 session 连续性**:确保设置了 `sessionArg` 且 `sessionMode` 不是 `none`(Codex CLI 当前无法使用 JSON 输出恢复)。
- **图像被忽略**:设置 `imageArg`(并验证 CLI 支持文件路径)。
