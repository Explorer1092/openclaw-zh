---
mmh3_hash: "6c5fbafef193198b58e5141bf1d725b3"
read_when:
  - 安装或配置插件
  - 了解插件发现和加载规则
  - 使用 Codex/Claude 兼容的插件包
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
sidebarTitle: 安装与配置
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: tools/plugin.md
  workflow: 15
---

# 插件

插件通过新功能扩展 OpenClaw：渠道、模型提供商、工具、Skills、语音、图像生成等。部分插件是**核心插件**（随 OpenClaw 一起发布），其他是**外部插件**（由社区发布在 npm 上）。

## 快速开始

**查看当前已加载的内容：**

```bash
openclaw plugins list
```

**安装插件：**

```bash
# 从 npm
openclaw plugins install @openclaw/voice-call

# 从本地目录或压缩包
openclaw plugins install ./my-plugin
openclaw plugins install ./my-plugin.tgz
```

**重启 Gateway 网关：**

```bash
openclaw gateway restart
```

然后在配置文件的 `plugins.entries.\<id\>.config` 下进行配置。

如果你偏好聊天原生控制，启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/压缩包、显式 `clawhub:<pkg>` 或裸包规格（先 ClawHub 再 npm 回退）。

## 插件类型

OpenClaw 支持两种插件格式：

| 格式 | 工作方式 | 示例 |
| ---- | -------- | ---- |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行 | 官方插件、社区 npm 包 |
| **Bundle** | Codex/Claude/Cursor 兼容布局；映射到 OpenClaw 特性 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都显示在 `openclaw plugins list` 下。参见 [Plugin Bundles](/plugins/bundles) 了解 bundle 详情。

如果你要编写原生插件，请从 [Building Plugins](/plugins/building-plugins) 和 [Plugin SDK Overview](/plugins/sdk-overview) 开始。

## 官方插件

### 可安装（npm）

| 插件 | 包名 | 文档 |
| ---- | ---- | ---- |
| Matrix | `@openclaw/matrix` | [Matrix](/channels/matrix) |
| Microsoft Teams | `@openclaw/msteams` | [Microsoft Teams](/channels/msteams) |
| Nostr | `@openclaw/nostr` | [Nostr](/channels/nostr) |
| Voice Call | `@openclaw/voice-call` | [Voice Call](/plugins/voice-call) |
| Zalo | `@openclaw/zalo` | [Zalo](/channels/zalo) |
| Zalo Personal | `@openclaw/zalouser` | [Zalo Personal](/plugins/zalouser) |

### 核心（随 OpenClaw 发布）

**模型提供商（默认启用）：**
`anthropic`、`byteplus`、`cloudflare-ai-gateway`、`github-copilot`、`google`、`huggingface`、`kilocode`、`kimi-coding`、`minimax`、`mistral`、`modelstudio`、`moonshot`、`nvidia`、`openai`、`opencode`、`opencode-go`、`openrouter`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、`volcengine`、`xiaomi`、`zai`

**内存插件：**
- `memory-core` — 内置内存搜索（通过 `plugins.slots.memory` 默认启用）
- `memory-lancedb` — 按需安装的带自动召回/捕获的长期内存（设置 `plugins.slots.memory = "memory-lancedb"`）

**语音提供商（默认启用）：**
`elevenlabs`、`microsoft`

**其他：**
- `browser` — 内置浏览器插件，提供浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 方法、浏览器运行时和默认浏览器控制服务（默认启用；在替换前先禁用）
- `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）

寻找第三方插件？参见 [Community Plugins](/plugins/community)。

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

| 字段 | 描述 |
| ---- | ---- |
| `enabled` | 主开关（默认：`true`） |
| `allow` | 插件白名单（可选） |
| `deny` | 插件黑名单（可选；deny 优先） |
| `load.paths` | 额外的插件文件/目录 |
| `slots` | 独占槽位选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 单插件开关 + 配置 |

配置更改**需要 Gateway 网关重启**。如果 Gateway 网关以配置监视 + 进程内重启模式运行（默认的 `openclaw gateway` 路径），该重启通常在配置写入落地后自动执行。

## 发现和优先级

OpenClaw 按以下顺序扫描插件（第一个匹配优先）：

1. **配置路径**：`plugins.load.paths` — 显式文件或目录路径。
2. **工作区扩展**：`\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
3. **全局扩展**：`~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
4. **内置插件**：随 OpenClaw 发布。许多默认启用（模型提供商、语音）。其他需要显式启用。

### 启用规则

- `plugins.enabled: false` 禁用所有插件
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 禁用该插件
- 工作区来源的插件**默认禁用**（必须显式启用）
- 内置插件遵循内置的默认启用集，除非被覆盖
- 独占槽位可以强制启用为该槽位选择的插件

## 插件槽位（独占类别）

某些类别是独占的（一次只有一个活跃）：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 或 "none" 以禁用
      contextEngine: "legacy", // 或插件 id
    },
  },
}
```

| 槽位 | 控制内容 | 默认值 |
| ---- | -------- | ------ |
| `memory` | 活跃内存插件 | `memory-core` |
| `contextEngine` | 活跃上下文引擎 | `legacy`（内置） |

## CLI 参考

```bash
openclaw plugins list                    # 紧凑清单
openclaw plugins inspect <id>            # 深度详情
openclaw plugins inspect <id> --json     # 机器可读
openclaw plugins status                  # 运行状态摘要
openclaw plugins doctor                  # 诊断

openclaw plugins install <package>        # 安装（先 ClawHub 再 npm）
openclaw plugins install clawhub:<pkg>   # 仅从 ClawHub 安装
openclaw plugins install <path>          # 从本地路径安装
openclaw plugins install -l <path>       # 链接（不复制）用于开发
openclaw plugins update <id>             # 更新一个插件
openclaw plugins update --all            # 更新所有插件

openclaw plugins enable <id>
openclaw plugins disable <id>
```

参见 [`openclaw plugins` CLI 参考](/cli/plugins) 了解完整详情。

## 插件 API 概览

插件导出一个函数或带 `register(api)` 的对象：

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

常用注册方法：

| 方法 | 注册内容 |
| ---- | -------- |
| `registerProvider` | 模型提供商（LLM） |
| `registerChannel` | 聊天渠道 |
| `registerTool` | 智能体工具 |
| `registerHook` / `on(...)` | 生命周期 Hook |
| `registerSpeechProvider` | 文本转语音 / STT |
| `registerMediaUnderstandingProvider` | 图像/音频分析 |
| `registerImageGenerationProvider` | 图像生成 |
| `registerWebSearchProvider` | Web 搜索 |
| `registerHttpRoute` | HTTP 端点 |
| `registerCommand` / `registerCli` | CLI 命令 |
| `registerContextEngine` | 上下文引擎 |
| `registerService` | 后台服务 |

类型化生命周期 Hook 的守卫行为：

- `before_tool_call`：`{ block: true }` 是终止性的；优先级较低的处理器被跳过。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除之前的 block。
- `before_install`：`{ block: true }` 是终止性的；优先级较低的处理器被跳过。
- `before_install`：`{ block: false }` 是空操作，不会清除之前的 block。
- `message_sending`：`{ cancel: true }` 是终止性的；优先级较低的处理器被跳过。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除之前的 cancel。

有关完整类型化 Hook 行为，参见 [SDK Overview](/plugins/sdk-overview#hook-decision-semantics)。

## 相关

- [Building Plugins](/plugins/building-plugins) — 创建你自己的插件
- [Plugin Bundles](/plugins/bundles) — Codex/Claude/Cursor bundle 兼容性
- [Plugin Manifest](/plugins/manifest) — manifest schema
- [Registering Tools](/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [Plugin Internals](/plugins/architecture) — 能力模型和加载流水线
- [Community Plugins](/plugins/community) — 第三方列表
