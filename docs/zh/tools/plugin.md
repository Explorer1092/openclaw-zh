---
mmh3_hash: "48f22965ed26d017b0c947d10d8ebc1b"
summary: "安装、配置和管理 OpenClaw Plugin"
read_when:
  - 安装或配置 Plugin
  - 了解 Plugin 发现和加载规则
  - 使用与 Codex/Claude 兼容的 Plugin 包
title: "Plugin"
sidebarTitle: "安装和配置"
---

Plugin 为 OpenClaw 扩展新能力：Channel、模型 Provider、Agent 运行时、工具、技能、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取、Web 搜索等。某些 Plugin 是**核心**的（随 OpenClaw 附带），其他是**外部**的（由社区发布在 npm 上）。

## 快速入门

<Steps>
  <Step title="查看已加载的内容">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="安装 Plugin">
    ```bash
    # 从 npm
    openclaw plugins install @openclaw/voice-call

    # 从本地目录或存档
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="重启 Gateway">
    ```bash
    openclaw gateway restart
    ```

    然后在你的配置文件中的 `plugins.entries.\<id\>.config` 下进行配置。

  </Step>
</Steps>

如果你更喜欢通过聊天控制，启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/存档、显式 `clawhub:<pkg>`、显式 `npm:<pkg>`，或裸包规格（ClawHub 优先，然后 npm 回退）。

如果配置无效，安装通常会安全失败并指向 `openclaw doctor --fix`。唯一的恢复例外是针对选择加入 `openclaw.install.allowInvalidConfigRecovery` 的 Plugin 的窄范围捆绑 Plugin 重新安装路径。

打包的 OpenClaw 安装不会主动安装每个捆绑 Plugin 的运行时依赖树。当捆绑的 OpenClaw 自有 Plugin 通过 Plugin 配置、旧版 Channel 配置或默认启用的 Manifest 激活时，启动过程仅在导入之前修复该 Plugin 声明的运行时依赖。已持久化的 Channel 认证状态本身不会激活捆绑 Channel 进行 Gateway 启动运行时依赖修复。
显式禁用仍然优先：`plugins.entries.<id>.enabled: false`、`plugins.deny`、`plugins.enabled: false` 和 `channels.<id>.enabled: false` 会阻止该 Plugin/Channel 的自动捆绑运行时依赖修复。
非空的 `plugins.allow` 也会限制默认启用的捆绑运行时依赖修复；显式的捆绑 Channel 启用（`channels.<id>.enabled: true`）仍然可以修复该 Channel 的 Plugin 依赖。
外部 Plugin 和自定义加载路径仍必须通过 `openclaw plugins install` 安装。

## Plugin 类型

OpenClaw 识别两种 Plugin 格式：

| 格式       | 工作原理                                                       | 示例                                                   |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **原生**   | `openclaw.plugin.json` + 运行时模块；在进程内执行              | 官方 Plugin、社区 npm 包                               |
| **包**     | 兼容 Codex/Claude/Cursor 的布局；映射到 OpenClaw 功能          | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都在 `openclaw plugins list` 下显示。参见 [Plugin 包](/plugins/bundles) 了解包详情。

如果你在编写原生 Plugin，从 [构建 Plugin](/plugins/building-plugins) 和 [Plugin SDK 概览](/plugins/sdk-overview) 开始。

## Package entrypoints

原生 Plugin npm 包必须在 `package.json` 中声明 `openclaw.extensions`。
每个入口必须保持在包目录内，并解析为可读的运行时文件，或解析为带有推断出的内置 JavaScript 对等文件的 TypeScript 源文件，例如 `src/index.ts` 对应 `dist/index.js`。

当发布的运行时文件与源入口路径不同时，使用 `openclaw.runtimeExtensions`。存在时，`runtimeExtensions` 必须包含与每个 `extensions` 入口对应的条目。列表不匹配会导致安装和 Plugin 发现失败，而不是静默回退到源路径。

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## 官方 Plugin

### 可安装（npm）

| Plugin          | 包                     | 文档                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/plugins/zalouser)   |

### 核心（随 OpenClaw 附带）

<AccordionGroup>
  <Accordion title="模型 Provider（默认启用）">
    `anthropic`、`byteplus`、`cloudflare-ai-gateway`、`github-copilot`、`google`、
    `huggingface`、`kilocode`、`kimi-coding`、`minimax`、`mistral`、`qwen`、
    `moonshot`、`nvidia`、`openai`、`opencode`、`opencode-go`、`openrouter`、
    `qianfan`、`synthetic`、`together`、`venice`、
    `vercel-ai-gateway`、`volcengine`、`xiaomi`、`zai`
  </Accordion>

  <Accordion title="内存 Plugin">
    - `memory-core` — 捆绑的内存搜索（通过 `plugins.slots.memory` 默认启用）
    - `memory-lancedb` — 按需安装的长期内存，带自动回忆/捕获（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音 Provider（默认启用）">
    `elevenlabs`、`microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 方法、浏览器运行时和默认浏览器控制服务的捆绑 Plugin（默认启用；替换前先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）
  </Accordion>
</AccordionGroup>

想找第三方 Plugin？参见 [社区 Plugin](/plugins/community)。

## 配置

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| 字段             | 描述                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 主开关（默认：`true`）                                    |
| `allow`          | Plugin 允许列表（可选）                                   |
| `deny`           | Plugin 拒绝列表（可选；拒绝优先）                         |
| `load.paths`     | 额外的 Plugin 文件/目录                                   |
| `slots`          | 独占槽位选择器（例如 `memory`、`contextEngine`）          |
| `entries.\<id\>` | 每个 Plugin 的开关 + 配置                                 |

配置更改**需要重启 Gateway**。如果 Gateway 运行时启用了配置监视 + 进程内重启（默认的 `openclaw gateway` 路径），通常会在配置写入后自动执行该重启。原生 Plugin 运行时代码或生命周期 Hook 没有受支持的热重载路径；在期望更新的 `register(api)` 代码、`api.on(...)` Hook、工具、服务或 Provider/运行时 Hook 运行之前，请重启服务于实时 Channel 的 Gateway 进程。

`openclaw plugins list` 是本地 Plugin 注册表/配置快照。其中 `enabled` 的 Plugin 意味着持久化注册表和当前配置允许该 Plugin 参与。这不能证明已运行的远程 Gateway 子进程已重启到相同的 Plugin 代码。在带有包装进程的 VPS/容器设置中，请将重启信号发送给实际的 `openclaw gateway run` 进程，或对运行中的 Gateway 使用 `openclaw gateway restart`。

<Accordion title="Plugin 状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：Plugin 存在，但启用规则关闭了它。配置被保留。
  - **缺失**：配置引用了发现未找到的 Plugin id。
  - **无效**：Plugin 存在，但其配置与声明的 Schema 不匹配。
</Accordion>

## 发现和优先级

OpenClaw 按以下顺序扫描 Plugin（第一个匹配优先）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` — 显式文件或目录路径。
  </Step>

  <Step title="工作区扩展">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局扩展">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="捆绑 Plugin">
    随 OpenClaw 附带。许多默认启用（模型 Provider、语音）。其他需要显式启用。
  </Step>
</Steps>

打包安装和 Docker 镜像通常从编译的 `dist/extensions` 树解析捆绑 Plugin。如果捆绑 Plugin 源目录被绑定挂载到匹配的打包源路径上，例如 `/app/extensions/synology-chat`，OpenClaw 会将挂载的源目录视为捆绑源覆盖层，并在打包的 `/app/dist/extensions/synology-chat` 包之前发现它。这使维护者容器循环可以正常工作，无需将每个捆绑 Plugin 切换回 TypeScript 源代码。设置 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` 以强制使用打包的 dist 包，即使存在源覆盖挂载。

### 启用规则

- `plugins.enabled: false` 禁用所有 Plugin
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 禁用该 Plugin
- 工作区来源的 Plugin **默认禁用**（必须显式启用）
- 捆绑 Plugin 遵循内置默认启用集，除非被覆盖
- 独占槽位可以强制启用该槽位的选定 Plugin
- 某些捆绑的可选加入 Plugin 会在配置命名 Plugin 自有表面时自动启用，例如 Provider 模型引用、Channel 配置或 Agent 运行时
- OpenAI 系列 Codex 路由保持独立的 Plugin 边界：`openai-codex/*` 属于 OpenAI Plugin，而捆绑的 Codex 应用服务器 Plugin 通过 `agentRuntime.id: "codex"` 或旧版 `codex/*` 模型引用选择

## 运行时 Hook 故障排除

如果 Plugin 出现在 `plugins list` 中，但 `register(api)` 副作用或 Hook 在实时聊天流量中不运行，首先检查以下内容：

- 运行 `openclaw gateway status --deep --require-rpc`，确认活动 Gateway URL、配置文件、配置路径和进程是你正在编辑的那些。
- 在 Plugin 安装/配置/代码更改后重启实时 Gateway。在包装容器中，PID 1 可能只是一个监督进程；重启或向子进程 `openclaw gateway run` 发送信号。
- 使用 `openclaw plugins inspect <id> --json` 确认 Hook 注册和诊断信息。`llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end` 等非捆绑对话 Hook 需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它在 Agent 轮次的模型解析之前运行；`llm_output` 仅在模型尝试产生 Assistant 输出后运行。
- 对于有效 Session 模型的证明，使用 `openclaw sessions` 或 Gateway Session/状态表面，调试 Provider 负载时，用 `--raw-stream --raw-stream-path <path>` 启动 Gateway。

### Channel 或工具所有权冲突

症状：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

这意味着多个已启用的 Plugin 正在尝试拥有同一个 Channel、设置流程或工具名称。最常见的原因是在提供相同 Channel id 的捆绑 Plugin 旁边安装了外部 Channel Plugin。

调试步骤：

- 运行 `openclaw plugins list --enabled --verbose` 查看每个已启用的 Plugin 及其来源。
- 对每个可疑的 Plugin 运行 `openclaw plugins inspect <id> --json`，比较 `channels`、`channelConfigs`、`tools` 和诊断信息。
- 安装或移除 Plugin 包后运行 `openclaw plugins registry --refresh`，使持久化元数据反映当前安装状态。
- 在安装、注册表或配置更改后重启 Gateway。

修复选项：

- 如果一个 Plugin 有意替换另一个 Plugin 的相同 Channel id，首选 Plugin 应在 `channelConfigs.<channel-id>.preferOver` 中声明较低优先级的 Plugin id。参见 [/plugins/manifest#replacing-another-channel-plugin](/plugins/manifest#replacing-another-channel-plugin)。
- 如果冲突是意外的，使用 `plugins.entries.<plugin-id>.enabled: false` 禁用一方，或移除过时的 Plugin 安装。
- 如果你明确启用了两个 Plugin，OpenClaw 会保留该请求并报告冲突。为 Channel 选择一个所有者，或重命名 Plugin 自有工具，使运行时表面明确无歧义。

## Plugin 槽位（独占类别）

某些类别是独占的（一次只能有一个处于活动状态）：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 或 "none" 以禁用
      contextEngine: "legacy", // 或 Plugin id
    },
  },
}
```

| 槽位            | 控制内容              | 默认              |
| --------------- | --------------------- | ----------------- |
| `memory`        | 活动内存 Plugin       | `memory-core`     |
| `contextEngine` | 活动上下文引擎        | `legacy`（内置）  |

## CLI 参考

```bash
openclaw plugins list                       # 紧凑清单
openclaw plugins list --enabled            # 仅已启用的 Plugin
openclaw plugins list --verbose            # 每个 Plugin 的详细行
openclaw plugins list --json               # 机器可读清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读
openclaw plugins inspect --all             # 全范围表格
openclaw plugins info <id>                 # inspect 别名
openclaw plugins doctor                    # 诊断
openclaw plugins registry                  # 检查持久化注册表状态
openclaw plugins registry --refresh        # 重建持久化注册表
openclaw doctor --fix                      # 修复 Plugin 注册表状态

openclaw plugins install <package>         # 安装（ClawHub 优先，然后 npm）
openclaw plugins install clawhub:<pkg>     # 仅从 ClawHub 安装
openclaw plugins install npm:<pkg>         # 仅从 npm 安装
openclaw plugins install <spec> --force    # 覆盖现有安装
openclaw plugins install <path>            # 从本地路径安装
openclaw plugins install -l <path>         # 链接（不复制）用于开发
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 记录精确解析的 npm 规格
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 更新单个 Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # 更新全部
openclaw plugins uninstall <id>          # 移除配置和 Plugin 索引记录
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

捆绑 Plugin 随 OpenClaw 附带。许多默认启用（例如捆绑的模型 Provider、捆绑的语音 Provider 和捆绑的 browser Plugin）。其他捆绑 Plugin 仍然需要 `openclaw plugins enable <id>`。

`--force` 原地覆盖现有安装的 Plugin 或 hook 包。不支持与 `--link` 一起使用，因为 `--link` 重用源路径而不是复制到托管安装目标。

`--pin` 仅限 npm。不支持与 `--marketplace` 一起使用，因为 marketplace 安装保留 marketplace 源元数据而非 npm 规格。

`--dangerously-force-unsafe-install` 是内置危险代码扫描器误报的破玻璃覆盖。它允许 Plugin 安装和更新继续通过内置 `critical` 发现，但仍然不会绕过 Plugin `before_install` 策略阻止或扫描失败阻止。

此 CLI 标志仅适用于 Plugin 安装/更新流程。Gateway 支持的技能依赖安装使用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是独立的 ClawHub 技能下载/安装流程。

兼容包参与相同的 Plugin list/inspect/enable/disable 流程。当前运行时支持包括包技能、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` 和 manifest 声明的 `lspServers` 默认值、Cursor command-skills 和兼容的 Codex hook 目录。

`openclaw plugins inspect <id>` 还会报告检测到的包能力以及包支持 Plugin 的已支持或不支持的 MCP 和 LSP 服务器条目。

当 `plugins.allow` 已设置时，`openclaw plugins install` 会在启用前将已安装的 Plugin id 添加到该允许列表。如果相同的 Plugin id 存在于 `plugins.deny` 中，安装会移除该过时的拒绝条目，以便显式安装在重启后立即可加载。

OpenClaw 将持久化本地 Plugin 注册表作为 Plugin 清单、贡献所有权和启动规划的冷读模型。安装、更新、卸载、启用和禁用流程在更改 Plugin 状态后刷新该注册表。同一 `plugins/installs.json` 文件在顶层 `installRecords` 中保存持久安装元数据，在 `plugins` 中保存可重建的 Manifest 元数据。如果注册表缺失、过时或无效，`openclaw plugins registry --refresh` 会从安装记录、配置策略和 Manifest/包元数据重建其 Manifest 视图，而无需加载 Plugin 运行时模块。
`openclaw plugins update <id-or-npm-spec>` 适用于跟踪的安装。传入带有 dist-tag 或精确版本的 npm 包规格会将包名解析回跟踪的 Plugin 记录并记录新规格以供将来更新。传入不带版本的包名会将精确固定的安装移回注册表的默认发布线。如果已安装的 npm Plugin 已匹配解析的版本和记录的工件身份，OpenClaw 会跳过更新，不进行下载、重新安装或配置重写。

Marketplace 源可以是来自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名称、本地 marketplace 根目录或 `marketplace.json` 路径、GitHub 简写如 `owner/repo`、GitHub 仓库 URL 或 git URL。对于远程 marketplace，Plugin 条目必须保持在克隆的 marketplace 仓库内并仅使用相对路径源。

参见 [`openclaw plugins` CLI 参考](/cli/plugins) 了解完整详情。

## Plugin API 概览

原生 Plugin 导出一个暴露 `register(api)` 的入口对象。较旧的 Plugin 仍可使用 `activate(api)` 作为旧版别名，但新 Plugin 应使用 `register`。

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw 加载入口对象并在 Plugin 激活期间调用 `register(api)`。加载器仍然为旧 Plugin 回退到 `activate(api)`，但捆绑 Plugin 和新外部 Plugin 应将 `register` 视为公共契约。

`api.registrationMode` 告知 Plugin 其入口被加载的原因：

| 模式            | 含义                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| `full`          | 运行时激活。注册工具、Hook、服务、命令、路由和其他实时副作用。                                             |
| `discovery`     | 只读能力发现。注册 Provider 和元数据；受信任的 Plugin 入口代码可以加载，但跳过实时副作用。                 |
| `setup-only`    | 通过轻量级设置入口加载 Channel 设置元数据。                                                                |
| `setup-runtime` | Channel 设置加载，同时需要运行时入口。                                                                     |
| `cli-metadata`  | 仅 CLI 命令元数据收集。                                                                                    |

打开 socket、数据库、后台 Worker 或长期客户端的 Plugin 入口应使用 `api.registrationMode === "full"` 保护这些副作用。发现加载与激活加载分开缓存，不会替换运行中的 Gateway 注册表。发现是非激活的，但不是无导入的：OpenClaw 可能会评估受信任的 Plugin 入口或 Channel Plugin 模块以构建快照。保持模块顶层轻量且无副作用，将网络客户端、子进程、监听器、凭据读取和服务启动放在全运行时路径之后。

常用注册方法：

| 方法                                    | 注册内容              |
| --------------------------------------- | --------------------- |
| `registerProvider`                      | 模型 Provider（LLM）  |
| `registerChannel`                       | 聊天 Channel          |
| `registerTool`                          | Agent 工具            |
| `registerHook` / `on(...)`              | 生命周期 Hook         |
| `registerSpeechProvider`                | 文本转语音 / STT      |
| `registerRealtimeTranscriptionProvider` | 流式 STT              |
| `registerRealtimeVoiceProvider`         | 双工实时语音          |
| `registerMediaUnderstandingProvider`    | 图像/音频分析         |
| `registerImageGenerationProvider`       | 图像生成              |
| `registerMusicGenerationProvider`       | 音乐生成              |
| `registerVideoGenerationProvider`       | 视频生成              |
| `registerWebFetchProvider`              | Web 抓取/提取 Provider |
| `registerWebSearchProvider`             | 网页搜索              |
| `registerHttpRoute`                     | HTTP 端点             |
| `registerCommand` / `registerCli`       | CLI 命令              |
| `registerContextEngine`                 | 上下文引擎            |
| `registerService`                       | 后台服务              |

类型化生命周期 Hook 的 Hook 守卫行为：

- `before_tool_call`：`{ block: true }` 是终端性的；低优先级处理器被跳过。
- `before_tool_call`：`{ block: false }` 是无操作的，不会清除较早的阻止。
- `before_install`：`{ block: true }` 是终端性的；低优先级处理器被跳过。
- `before_install`：`{ block: false }` 是无操作的，不会清除较早的阻止。
- `message_sending`：`{ cancel: true }` 是终端性的；低优先级处理器被跳过。
- `message_sending`：`{ cancel: false }` 是无操作的，不会清除较早的取消。

原生 Codex 应用服务器运行时会将 Codex 原生工具事件桥接回此 Hook 表面。Plugin 可以通过 `before_tool_call` 阻止原生 Codex 工具，通过 `after_tool_call` 观察结果，并参与 Codex `PermissionRequest` 审批。桥接尚未重写 Codex 原生工具参数。确切的 Codex 运行时支持边界在 [Codex harness v1 支持契约](/plugins/codex-harness#v1-support-contract) 中。

有关完整的类型化 Hook 行为，参见 [SDK 概览](/plugins/sdk-overview#hook-decision-semantics)。

## 相关

- [构建 Plugin](/plugins/building-plugins) — 创建自己的 Plugin
- [Plugin 包](/plugins/bundles) — Codex/Claude/Cursor 包兼容性
- [Plugin Manifest](/plugins/manifest) — Manifest Schema
- [注册工具](/plugins/building-plugins#registering-agent-tools) — 在 Plugin 中添加 Agent 工具
- [Plugin 内部](/plugins/architecture) — 能力模型和加载流水线
- [社区 Plugin](/plugins/community) — 第三方列表
