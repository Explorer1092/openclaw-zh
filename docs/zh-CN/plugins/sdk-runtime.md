---
mmh3_hash: "a8ba8f92b2b97f8febffc5bc8fd8a497"
title: 插件运行时辅助工具
sidebarTitle: 运行时辅助工具
summary: api.runtime — 注入到插件中的运行时辅助工具
read_when:
  - 你需要从插件中调用核心辅助工具（TTS、STT、图像生成、网络搜索、子 Agent）
  - 你想了解 api.runtime 暴露了什么
  - 你正在从插件代码中访问配置、Agent 或媒体辅助工具
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: plugins/sdk-runtime.md
  workflow: 15
---

# 插件运行时辅助工具

注册期间注入到每个插件的 `api.runtime` 对象的参考文档。使用这些辅助工具，而非直接导入宿主内部模块。

<Tip>
  **在找操作演练？** 参阅 [Channel 插件](/plugins/sdk-channel-plugins) 或 [Provider 插件](/plugins/sdk-provider-plugins) 的分步指南，了解这些辅助工具的使用场景。
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 运行时命名空间

### `api.runtime.agent`

Agent 标识、目录和 Session 管理。

```typescript
// 解析 Agent 工作目录
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// 解析 Agent 工作区
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// 获取 Agent 标识
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// 获取默认思考级别
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// 获取 Agent 超时时间
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// 确保工作区存在
await api.runtime.agent.ensureAgentWorkspace(cfg);

// 运行嵌入式 Pi Agent
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedPiAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Summarize the latest changes",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

**Session Store 辅助工具** 位于 `api.runtime.agent.session` 下：

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

默认模型和 Provider 常量：

```typescript
const model = api.runtime.agent.defaults.model; // 如 "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // 如 "anthropic"
```

### `api.runtime.subagent`

启动和管理后台子 Agent 运行。

```typescript
// 启动子 Agent 运行
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // 可选覆盖
  model: "gpt-4.1-mini", // 可选覆盖
  deliver: false,
});

// 等待完成
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// 读取 Session 消息
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// 删除 Session
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  模型覆盖（`provider`/`model`）需要运营者通过配置中的 `plugins.entries.<id>.subagent.allowModelOverride: true` 选择启用。不受信任的插件仍然可以运行子 Agent，但覆盖请求会被拒绝。
</Warning>

### `api.runtime.tts`

文本转语音合成。

```typescript
// 标准 TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// 电话优化 TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// 列出可用语音
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

使用核心 `messages.tts` 配置和 Provider 选择。返回 PCM 音频缓冲区和采样率。

### `api.runtime.mediaUnderstanding`

图像、音频和视频分析。

```typescript
// 描述图像
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// 转录音频
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // 可选，当无法推断 MIME 时使用
});

// 描述视频
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// 通用文件分析
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

当没有输出时（如跳过的输入），返回 `{ text: undefined }`。

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` 作为 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` 的兼容别名保留。
</Info>

### `api.runtime.imageGeneration`

图像生成。

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

网络搜索。

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

低级媒体工具。

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
```

### `api.runtime.config`

配置加载和写入。

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

系统级工具。

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

事件订阅。

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

日志记录。

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

模型和 Provider 认证解析。

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

状态目录解析。

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

记忆工具工厂和 CLI。

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Channel 专属运行时辅助工具（在 Channel 插件加载时可用）。

## 存储运行时引用

使用 `createPluginRuntimeStore` 存储运行时引用，以便在 `register` 回调之外使用：

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("my-plugin runtime not initialized");

// 在你的入口点中
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// 在其他文件中
export function getRuntime() {
  return store.getRuntime(); // 未初始化时抛出异常
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // 未初始化时返回 null
}
```

## 其他顶级 `api` 字段

除 `api.runtime` 外，API 对象还提供：

| 字段                     | 类型                      | 描述                                                             |
| ------------------------ | ------------------------- | ---------------------------------------------------------------- |
| `api.id`                 | `string`                  | 插件 id                                                          |
| `api.name`               | `string`                  | 插件显示名称                                                     |
| `api.config`             | `OpenClawConfig`          | 当前配置快照                                                     |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件专属配置                |
| `api.logger`             | `PluginLogger`            | 作用域日志记录器（`debug`, `info`, `warn`, `error`）             |
| `api.registrationMode`   | `PluginRegistrationMode`  | `"full"`, `"setup-only"`, `"setup-runtime"` 或 `"cli-metadata"` |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径                                       |

## 相关文档

- [SDK Overview](/plugins/sdk-overview) — 子路径参考
- [SDK Entry Points](/plugins/sdk-entrypoints) — `definePluginEntry` 选项
- [插件内部机制](/plugins/architecture) — 能力模型和注册表
