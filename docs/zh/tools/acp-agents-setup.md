---
mmh3_hash: "f0568485529f489e82aac0ed157d3002"
summary: "设置 ACP Agent：acpx 线束配置、Plugin 设置、权限"
read_when:
  - 为 Claude Code / Codex / Gemini CLI 安装或配置 acpx 线束
  - 启用 plugin-tools 或 OpenClaw-tools MCP 桥接
  - 配置 ACP 权限模式
title: "ACP Agent — 设置"
---

有关概览、操作员运行手册和概念，请参见 [ACP Agent](/tools/acp-agents)。

以下部分涵盖 acpx 线束配置、MCP 桥接的 Plugin 设置以及权限配置。

仅在设置 ACP/acpx 路由时使用本页。对于原生 Codex 应用服务器运行时配置，请使用 [Codex 线束](/plugins/codex-harness)。对于 OpenAI API 密钥或 Codex OAuth 模型 Provider 配置，请使用 [OpenAI](/providers/openai)。

Codex 有两条 OpenClaw 路由：

| 路由                    | 配置/命令                                              | 设置页面                                |
| ----------------------- | ------------------------------------------------------ | --------------------------------------- |
| 原生 Codex 应用服务器   | `/codex ...`、`agentRuntime.id: "codex"`               | [Codex 线束](/plugins/codex-harness)    |
| 显式 Codex ACP 适配器   | `/acp spawn codex`、`runtime: "acp", agentId: "codex"` | 本页                                    |

除非您明确需要 ACP/acpx 行为，否则优先使用原生路由。

## acpx 线束支持（当前）

当前 acpx 内置线束别名：

- `claude`
- `codex`
- `copilot`
- `cursor`（Cursor CLI：`cursor-agent acp`）
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

当 OpenClaw 使用 acpx 后端时，优先使用这些值作为 `agentId`，除非您的 acpx 配置定义了自定义 Agent 别名。如果您的本地 Cursor 安装仍将 ACP 公开为 `agent acp`，请在 acpx 配置中覆盖 `cursor` Agent 命令，而不是更改内置默认值。

直接的 acpx CLI 使用还可以通过 `--agent <command>` 针对任意适配器，但这是 acpx CLI 的原始逃生舱功能（不是普通的 OpenClaw `agentId` 路径）。

模型控制取决于适配器能力。Codex ACP 模型引用在启动前由 OpenClaw 规范化。其他线束需要 ACP `models` 加上 `session/set_model` 支持；如果某个线束既不公开该 ACP 能力，也没有自己的启动模型标志，OpenClaw/acpx 就无法强制选择模型。

## 必需配置

核心 ACP 基线：

```json5
{
  acp: {
    enabled: true,
    // 可选。默认为 true；设置为 false 以在保留 /acp 控件的同时暂停 ACP 调度。
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

线程绑定配置特定于 Channel 适配器。Discord 示例：

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

如果线程绑定 ACP 生成不起作用，请首先验证适配器功能标志：

- Discord：`channels.discord.threadBindings.spawnAcpSessions=true`

当前对话绑定不需要子线程创建。它们需要活动的对话上下文以及公开 ACP 对话绑定的 Channel 适配器。

请参见[配置参考](/gateway/configuration-reference)。

## acpx 后端的 Plugin 设置

新安装默认启用捆绑的 `acpx` 运行时 Plugin，因此 ACP 通常无需手动 Plugin 安装步骤即可工作。

从以下开始：

```text
/acp doctor
```

如果您禁用了 `acpx`、通过 `plugins.allow` / `plugins.deny` 拒绝了它，或者想要切换到本地开发检出版本，请使用显式 Plugin 路径：

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

开发期间的本地工作区安装：

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

然后验证后端健康状态：

```text
/acp doctor
```

### acpx 命令和版本配置

默认情况下，捆绑的 `acpx` Plugin 注册嵌入式 ACP 后端，而不在 Gateway 启动时生成 ACP Agent。运行 `/acp doctor` 进行显式实时探测。仅在需要 Gateway 在启动时探测已配置的 Agent 时才设置 `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1`。

在 Plugin 配置中覆盖命令或版本：

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` 接受绝对路径、相对路径（从 OpenClaw 工作区解析）或命令名称。
- `expectedVersion: "any"` 禁用严格的版本匹配。
- 自定义 `command` 路径禁用 Plugin 本地自动安装。

请参见 [Plugin](/tools/plugin)。

### 自动依赖安装

当您使用 `npm install -g openclaw` 全局安装 OpenClaw 时，acpx 运行时依赖项（特定于平台的二进制文件）通过安装后钩子自动安装。如果自动安装失败，Gateway 仍然正常启动，并通过 `openclaw acp doctor` 报告缺失的依赖项。

### Plugin 工具 MCP 桥接

默认情况下，ACPX Session 不会将 OpenClaw Plugin 注册的工具暴露给 ACP 线束。

如果您希望 Codex 或 Claude Code 等 ACP Agent 调用已安装的 OpenClaw Plugin 工具（如记忆回忆/存储），请启用专用桥接：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

此操作的作用：

- 将名为 `openclaw-plugin-tools` 的内置 MCP 服务器注入 ACPX Session 引导程序。
- 公开已安装并启用的 OpenClaw Plugin 注册的 Plugin 工具。
- 保持该功能显式和默认关闭。

安全和信任说明：

- 这扩展了 ACP 线束工具界面。
- ACP Agent 只能访问 Gateway 中已激活的 Plugin 工具。
- 将其视为与允许这些 Plugin 在 OpenClaw 本身中执行相同的信任边界。
- 启用前审查已安装的 Plugin。

自定义 `mcpServers` 仍然像以前一样工作。内置 Plugin 工具桥接是额外的选择性便利功能，而非通用 MCP 服务器配置的替代品。

### OpenClaw 工具 MCP 桥接

默认情况下，ACPX Session 也不会通过 MCP 公开内置 OpenClaw 工具。当 ACP Agent 需要选定的内置工具（如 `cron`）时，启用单独的核心工具桥接：

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

此操作的作用：

- 将名为 `openclaw-tools` 的内置 MCP 服务器注入 ACPX Session 引导程序。
- 公开选定的内置 OpenClaw 工具。初始服务器公开 `cron`。
- 保持核心工具暴露显式和默认关闭。

### 运行时超时配置

捆绑的 `acpx` Plugin 默认嵌入式运行时轮次超时为 120 秒。这为较慢的线束（如 Gemini CLI）提供足够的时间来完成 ACP 启动和初始化。如果您的主机需要不同的运行时限制，请覆盖它：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

更改此值后重启 Gateway。

### 健康探测 Agent 配置

当 `/acp doctor` 或选择性启动探测检查后端时，捆绑的 `acpx` Plugin 探测一个线束 Agent。如果设置了 `acp.allowedAgents`，默认为第一个允许的 Agent；否则默认为 `codex`。如果您的部署需要不同的 ACP Agent 进行健康检查，请显式设置探测 Agent：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

更改此值后重启 Gateway。

## 权限配置

ACP Session 以非交互方式运行——没有 TTY 来批准或拒绝文件写入和 Shell 执行权限提示。acpx Plugin 提供两个配置键来控制权限处理方式：

这些 ACPX 线束权限与 OpenClaw exec 审批分开，也与 CLI 后端供应商绕过标志（如 Claude CLI `--permission-mode bypassPermissions`）分开。ACPX `approve-all` 是 ACP Session 的线束级紧急开关。

### `permissionMode`

控制线束 Agent 无需提示即可执行的操作。

| 值              | 行为                                        |
| --------------- | ------------------------------------------- |
| `approve-all`   | 自动批准所有文件写入和 Shell 命令。         |
| `approve-reads` | 仅自动批准读取；写入和执行需要提示。        |
| `deny-all`      | 拒绝所有权限提示。                          |

### `nonInteractivePermissions`

控制当权限提示应该显示但没有交互式 TTY 可用时（对于 ACP Session 始终如此）会发生什么。

| 值     | 行为                                                       |
| ------ | ---------------------------------------------------------- |
| `fail` | 以 `AcpRuntimeError` 中止 Session。**（默认）**            |
| `deny` | 静默拒绝权限并继续（优雅降级）。                           |

### 配置

通过 Plugin 配置设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

更改这些值后重启 Gateway。

<Warning>
OpenClaw 默认为 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非交互式 ACP Session 中，任何触发权限提示的写入或执行都可能以 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` 失败。

如果您需要限制权限，请将 `nonInteractivePermissions` 设置为 `deny`，以便 Session 优雅降级而不是崩溃。
</Warning>

## 相关

- [ACP Agent](/tools/acp-agents) — 概览、操作员运行手册、概念
- [Sub-agent](/tools/subagents)
- [多 Agent 路由](/concepts/multi-agent)
