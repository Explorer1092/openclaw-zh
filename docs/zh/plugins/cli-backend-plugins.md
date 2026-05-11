---
mmh3_hash: "e1f12ec941666a5c390ca4b872c7c237"
summary: "构建注册本地 AI CLI 后端的 Plugin"
title: "构建 CLI 后端 Plugin"
sidebarTitle: "CLI 后端 Plugin"
read_when:
  - 您正在构建本地 AI CLI 后端 Plugin
  - 您想为 acme-cli/model 等模型引用注册后端
  - 您需要将第三方 CLI 映射到 OpenClaw 的文本回退运行器中
---

CLI 后端 Plugin 让 OpenClaw 将本地 AI CLI 作为文本推理后端调用。该后端在模型引用中以 Provider 前缀形式出现：

```text
acme-cli/acme-large
```

当上游集成已以本地命令形式暴露、CLI 拥有本地登录状态，或者在 API Provider 不可用时 CLI 是有用的回退时，使用 CLI 后端。

<Info>
  如果上游服务暴露了标准 HTTP 模型 API，请改写 [Provider Plugin](/plugins/sdk-provider-plugins)。如果上游运行时拥有完整的 Agent Session、Tool 事件、压缩或后台任务状态，请使用 [Agent Harness](/plugins/sdk-agent-harness)。
</Info>

## Plugin 拥有的内容

CLI 后端 Plugin 有三个契约：

| 契约             | 文件                   | 用途                                                   |
| ---------------- | ---------------------- | ------------------------------------------------------ |
| Package 入口      | `package.json`         | 将 OpenClaw 指向 Plugin 运行时模块                      |
| Manifest 所有权   | `openclaw.plugin.json` | 在运行时加载前声明后端 id                               |
| 运行时注册        | `index.ts`             | 使用命令默认值调用 `api.registerCliBackend(...)`         |

Manifest 是发现元数据。它不执行 CLI 也不注册运行时行为。当 Plugin 入口调用 `api.registerCliBackend(...)` 时，运行时行为才开始。

## 最小后端 Plugin

<Steps>
  <Step title="创建 Package 元数据">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    已发布的 Package 必须包含已构建的 JavaScript 运行时文件。如果您的源入口是 `./src/index.ts`，请添加指向已构建 JavaScript 对应文件的 `openclaw.runtimeExtensions`。请参见[入口点](/plugins/sdk-entrypoints)。

  </Step>

  <Step title="声明后端所有权">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` 是运行时所有权列表。它让 OpenClaw 在配置或模型选择提及 `acme-cli/...` 时自动加载 Plugin。

    `setup.cliBackends` 是描述符优先的设置界面。当模型发现、引导或状态功能应在不加载 Plugin 运行时的情况下识别后端时，请添加它。仅当这些静态描述符足以进行设置时才使用 `requiresRuntime: false`。

  </Step>

  <Step title="注册后端">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    后端 id 必须与 Manifest 的 `cliBackends` 条目匹配。注册的 `config` 只是默认值；运行时会将 `agents.defaults.cliBackends.acme-cli` 下的用户配置合并到其上。

  </Step>
</Steps>

## 配置形式

`CliBackendConfig` 描述 OpenClaw 应如何启动和解析 CLI：

| 字段                                      | 用途                                                         |
| ----------------------------------------- | ------------------------------------------------------------ |
| `command`                                 | 二进制名称或绝对命令路径                                      |
| `args`                                    | 新启动时的基础 argv                                           |
| `resumeArgs`                              | 恢复 Session 时的备用 argv；支持 `{sessionId}`               |
| `output` / `resumeOutput`                 | 解析器：`json`、`jsonl` 或 `text`                             |
| `input`                                   | 提示传输：`arg` 或 `stdin`                                    |
| `modelArg`                                | 模型 id 前使用的标志                                          |
| `modelAliases`                            | 将 OpenClaw 模型 id 映射到 CLI 原生 id                        |
| `sessionArg` / `sessionArgs`              | 如何传递 Session id                                           |
| `sessionMode`                             | `always`、`existing` 或 `none`                               |
| `sessionIdFields`                         | OpenClaw 从 CLI 输出中读取的 JSON 字段                        |
| `systemPromptArg` / `systemPromptFileArg` | 系统提示传输                                                  |
| `systemPromptWhen`                        | `first`、`always` 或 `never`                                 |
| `imageArg` / `imageMode`                  | 图像路径支持                                                  |
| `serialize`                               | 保持同一后端运行有序                                          |
| `reliability.watchdog`                    | 无输出超时调整                                                |

优先选择与 CLI 匹配的最小静态配置。仅对真正属于后端的行为添加 Plugin 回调。

## 高级后端 Hook

`CliBackendPlugin` 还可以定义：

| Hook                               | 用途                                                   |
| ---------------------------------- | ------------------------------------------------------ |
| `normalizeConfig(config, context)` | 合并后重写旧版用户配置                                  |
| `resolveExecutionArgs(ctx)`        | 添加请求范围的标志，例如思考努力程度                    |
| `prepareExecution(ctx)`            | 在启动前创建临时身份验证或配置桥接                      |
| `transformSystemPrompt(ctx)`       | 应用最终的 CLI 特定系统提示转换                         |
| `textTransforms`                   | 双向提示/输出替换                                       |
| `defaultAuthProfileId`             | 优先选择特定的 OpenClaw 身份验证配置文件                |
| `authEpochMode`                    | 决定身份验证更改如何使存储的 CLI Session 失效           |
| `nativeToolMode`                   | 声明 CLI 是否具有始终开启的原生 Tool                    |
| `bundleMcp` / `bundleMcpMode`      | 选择加入 OpenClaw 的回环 MCP Tool 桥接                  |

保持这些 Hook 归 Provider 所有。当后端 Hook 可以表达行为时，不要向核心添加 CLI 特定的分支。

## MCP Tool 桥接

CLI 后端默认不接收 OpenClaw Tool。如果 CLI 可以使用 MCP 配置，请显式选择加入：

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

支持的桥接模式有：

| 模式                     | 用途                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| `claude-config-file`     | 接受 MCP 配置文件的 CLI                                            |
| `codex-config-overrides` | 接受 argv 配置覆盖的 CLI                                           |
| `gemini-system-settings` | 从系统设置目录读取 MCP 设置的 CLI                                  |

仅在 CLI 确实可以使用该桥接时才启用它。如果 CLI 有无法禁用的内置 Tool 层，请设置 `nativeToolMode: "always-on"`，以便 OpenClaw 在调用者要求不使用原生 Tool 时可以关闭失败。

## 用户配置

用户可以覆盖任何后端默认值：

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

记录用户最可能需要的最小覆盖。通常仅在二进制文件不在 `PATH` 中时才需要 `command`。

## 验证

对于 Bundle Plugin，围绕构建器和设置注册添加聚焦测试，然后运行 Plugin 的目标测试通道：

```bash
pnpm test extensions/acme-cli
```

对于本地或已安装的 Plugin，验证发现和一次真实的模型运行：

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

如果后端支持图像或 MCP，请添加使用真实 CLI 验证这些路径的实时冒烟测试。不要仅依靠静态检查来验证提示、图像、MCP 或 Session 恢复行为。

## 清单

<Check>`package.json` 包含 `openclaw.extensions` 和已发布 Package 的已构建运行时条目</Check>
<Check>`openclaw.plugin.json` 声明 `cliBackends` 和有意的 `activation.onStartup`</Check>
<Check>当设置/模型发现应在冷启动状态下看到后端时，`setup.cliBackends` 已存在</Check>
<Check>`api.registerCliBackend(...)` 使用与 Manifest 相同的后端 id</Check>
<Check>`agents.defaults.cliBackends.<id>` 下的用户覆盖仍然生效</Check>
<Check>Session、系统提示、图像和输出解析器设置与真实 CLI 契约匹配</Check>
<Check>目标测试和至少一次实时 CLI 冒烟测试验证了后端路径</Check>

## 相关

- [CLI 后端](/gateway/cli-backends) - 用户配置和运行时行为
- [构建 Plugin](/plugins/building-plugins) - Package 和 Manifest 基础知识
- [Plugin SDK 概览](/plugins/sdk-overview) - 注册 API 参考
- [Plugin Manifest](/plugins/manifest) - `cliBackends` 和设置描述符
- [Agent Harness](/plugins/sdk-agent-harness) - 完整的外部 Agent 运行时
