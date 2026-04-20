---
mmh3_hash: "7bc60beec8c589f24bf9b569c790a244"
title: "Plugin 运行时辅助工具"
sidebarTitle: "运行时辅助工具"
summary: "api.runtime -- 注入到 Plugin 的运行时辅助工具"
read_when:
  - 您需要从 Plugin 调用核心辅助工具（TTS、STT、图像生成、Web 搜索、子 Agent）
  - 您想了解 api.runtime 暴露什么
  - 您正在从 Plugin 代码访问配置、Agent 或媒体辅助工具
---

# Plugin 运行时辅助工具

注册期间注入到每个 Plugin 的 `api.runtime` 对象的参考文档。使用这些辅助工具而不是直接导入宿主内部。

<Tip>
  **正在寻找演练？** 请参见 [Channel Plugin](/plugins/sdk-channel-plugins) 或 [Provider Plugin](/plugins/sdk-provider-plugins) 获取在上下文中展示这些辅助工具的分步指南。
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 运行时命名空间

### `api.runtime.agent`

Agent 身份、目录和会话管理。

```typescript
// 解析 Agent 工作目录
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// 解析 Agent 工作区
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// 获取 Agent 身份
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// 获取默认思考级别
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// 获取 Agent 超时
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// 确保工作区存在
await api.runtime.agent.ensureAgentWorkspace(cfg);

// 运行嵌入式 Agent 轮次
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Summarize the latest changes",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)` 是从 Plugin 代码启动正常 OpenClaw Agent 轮次的中性辅助工具。它使用与 Channel 触发的回复相同的 Provider/模型解析和 Agent 执行器选择。

`runEmbeddedPiAgent(...)` 作为兼容性别名保留。

**会话存储辅助工具**在 `api.runtime.agent.session` 下：

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

默认模型和 Provider 常量：

```typescript
const model = api.runtime.agent.defaults.model; // 例如 "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // 例如 "anthropic"
```

### `api.runtime.taskFlow`

将 Task Flow 运行时绑定到现有 OpenClaw Session 键或受信任的 Tool 上下文，然后创建和管理 Task Flow 而无需在每次调用时传递所有者。

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Review new pull requests",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "Review PR #123",
  status: "running",
  startedAt: Date.now(),
});

const waiting = taskFlow.setWaiting({
  flowId: created.flowId,
  expectedRevision: created.revision,
  currentStep: "await-human-reply",
  waitJson: { kind: "reply", channel: "telegram" },
});
```

当您已经从自己的绑定层获得了受信任的 OpenClaw Session 键时，使用 `bindSession({ sessionKey, requesterOrigin })`。不要从原始用户输入进行绑定。

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

// 读取会话消息
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// 删除会话
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  模型覆盖（`provider`/`model`）需要操作员通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 选择加入。不受信任的 Plugin 仍然可以运行子 Agent，但覆盖请求会被拒绝。
</Warning>

### `api.runtime.tts`

文字转语音合成。

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

使用核心 `messages.tts` 配置和 Provider 选择。返回 PCM 音频缓冲区 + 采样率。

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
  mime: "audio/ogg", // 可选，当无法推断 MIME 时
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

当没有产生输出时（例如跳过的输入），返回 `{ text: undefined }`。

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` 仍然作为 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` 的兼容性别名存在。
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

Web 搜索。

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

模型和 Provider 身份验证解析。

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

内存 Tool 工厂和 CLI。

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Channel 特定的运行时辅助工具（在加载 Channel Plugin 时可用）。

`api.runtime.channel.mentions` 是使用运行时注入的捆绑 Channel Plugin 的共享入站提及策略接口：

```typescript
const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
  facts: {
    canDetectMention: true,
    wasMentioned: mentionMatch.matched,
    implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
      "reply_to_bot",
      isReplyToBot,
    ),
  },
  policy: {
    isGroup,
    requireMention,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});
```

可用的提及辅助工具：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` 有意不暴露旧版 `resolveMentionGating*` 兼容性辅助工具。优先使用规范化的 `{ facts, policy }` 路径。

## 存储运行时引用

使用 `createPluginRuntimeStore` 存储运行时引用，以便在 `register` 回调外部使用：

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

// 在您的入口点
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// 在其他文件中
export function getRuntime() {
  return store.getRuntime(); // 如果未初始化则抛出
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // 如果未初始化则返回 null
}
```

优先使用 `pluginId` 作为运行时存储身份。较低级别的 `key` 形式适用于一个 Plugin 有意需要多个运行时槽的不常见情况。

## 其他顶级 `api` 字段

除 `api.runtime` 外，API 对象还提供：

| 字段                     | 类型                      | 描述                                                          |
| ------------------------ | ------------------------- | ------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                     |
| `api.name`               | `string`                  | Plugin 显示名称                                               |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（可用时为活跃的内存运行时快照）                  |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的 Plugin 特定配置         |
| `api.logger`             | `PluginLogger`            | 作用域日志记录器（`debug`、`info`、`warn`、`error`）          |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是完整入口启动/设置窗口前的轻量级预启动阶段 |
| `api.resolvePath(input)` | `(string) => string`      | 相对于 Plugin 根目录解析路径                                  |

## 相关

- [SDK 概览](/plugins/sdk-overview) — 子路径参考
- [SDK 入口点](/plugins/sdk-entrypoints) — `definePluginEntry` 选项
- [Plugin 内部架构](/plugins/architecture) — 能力模型和注册表
