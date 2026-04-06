---
mmh3_hash: "18f29af82a159c2810f2cdfc4a182945"
summary: "安装、配置和管理 OpenClaw Plugin"
read_when:
  - 安装或配置 Plugin
  - 了解 Plugin 发现和加载规则
  - 使用与 Codex/Claude 兼容的 Plugin 包
title: "Plugin"
sidebarTitle: "安装和配置"
---

# Plugin

Plugin 为 OpenClaw 扩展新能力：Channel、模型 Provider、工具、技能、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取、Web 搜索等。某些 Plugin 是**核心**的（随 OpenClaw 附带），其他是**外部**的（由社区发布在 npm 上）。

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

安装路径使用与 CLI 相同的解析器：本地路径/存档、显式 `clawhub:<pkg>`，或裸包规格（ClawHub 优先，然后 npm 回退）。

如果配置无效，安装通常会安全失败并指向 `openclaw doctor --fix`。唯一的恢复例外是针对选择加入 `openclaw.install.allowInvalidConfigRecovery` 的 Plugin 的窄范围捆绑 Plugin 重新安装路径。

## Plugin 类型

OpenClaw 识别两种 Plugin 格式：

| 格式       | 工作原理                                                       | 示例                                                   |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **原生**   | `openclaw.plugin.json` + 运行时模块；在进程内执行              | 官方 Plugin、社区 npm 包                               |
| **包**     | 兼容 Codex/Claude/Cursor 的布局；映射到 OpenClaw 功能          | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都在 `openclaw plugins list` 下显示。参见 [Plugin 包](/plugins/bundles) 了解包详情。

如果你在编写原生 Plugin，从 [构建 Plugin](/plugins/building-plugins) 和 [Plugin SDK 概览](/plugins/sdk-overview) 开始。

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
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
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

配置更改**需要重启 Gateway**。如果 Gateway 运行时启用了配置监视 + 进程内重启（默认的 `openclaw gateway` 路径），通常会在配置写入后自动执行该重启。

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

### 启用规则

- `plugins.enabled: false` 禁用所有 Plugin
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 禁用该 Plugin
- 工作区来源的 Plugin **默认禁用**（必须显式启用）
- 捆绑 Plugin 遵循内置默认启用集，除非被覆盖
- 独占槽位可以强制启用该槽位的选定 Plugin

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
openclaw plugins list --enabled            # 仅已加载的 Plugin
openclaw plugins list --verbose            # 每个 Plugin 的详细行
openclaw plugins list --json               # 机器可读清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读
openclaw plugins inspect --all             # 全范围表格
openclaw plugins info <id>                 # inspect 别名
openclaw plugins doctor                    # 诊断

openclaw plugins install <package>         # 安装（ClawHub 优先，然后 npm）
openclaw plugins install clawhub:<pkg>     # 仅从 ClawHub 安装
openclaw plugins install <spec> --force    # 覆盖现有安装
openclaw plugins install <path>            # 从本地路径安装
openclaw plugins install -l <path>         # 链接（不复制）用于开发
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 记录精确解析的 npm 规格
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # 更新单个 Plugin
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # 更新全部
openclaw plugins uninstall <id>          # 移除配置/安装记录
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

兼容包参与相同的 Plugin list/inspect/enable/disable 流程。当前运行时支持包括包技能、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` 和 manifest 声明的 `lspServers` 默认值、Cursor command-skills 和兼容的 Codex hook 目录。

`openclaw plugins inspect <id>` 还会报告检测到的包能力以及包支持 Plugin 的已支持或不支持的 MCP 和 LSP 服务器条目。

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

有关完整的类型化 Hook 行为，参见 [SDK 概览](/plugins/sdk-overview#hook-decision-semantics)。

## 相关

- [构建 Plugin](/plugins/building-plugins) — 创建自己的 Plugin
- [Plugin 包](/plugins/bundles) — Codex/Claude/Cursor 包兼容性
- [Plugin Manifest](/plugins/manifest) — Manifest Schema
- [注册工具](/plugins/building-plugins#registering-agent-tools) — 在 Plugin 中添加 Agent 工具
- [Plugin 内部](/plugins/architecture) — 能力模型和加载流水线
- [社区 Plugin](/plugins/community) — 第三方列表
