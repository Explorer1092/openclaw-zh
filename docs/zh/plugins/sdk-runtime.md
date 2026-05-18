---
mmh3_hash: "ff9c7dd0e48f1c6a18ad51e82a7bba7d"
title: "Plugin 运行时辅助工具"
sidebarTitle: "运行时辅助工具"
summary: "api.runtime -- 注入到 Plugin 的运行时辅助工具"
read_when:
  - 您需要从 Plugin 调用 Core 辅助工具（TTS、STT、图像生成、Web 搜索、子 Agent、节点）
  - 您想了解 api.runtime 公开了什么
  - 您正在从 Plugin 代码访问配置、Agent 或媒体辅助工具
doc-schema-version: 1
---

注入到每个 Plugin 注册时的 `api.runtime` 对象参考。使用这些辅助工具而不是直接导入主机内部。

<CardGroup cols={2}>
  <Card title="Channel Plugin" href="/plugins/sdk-channel-plugins">
    在 Channel Plugin 上下文中使用这些辅助工具的分步指南。
  </Card>
  <Card title="Provider Plugin" href="/plugins/sdk-provider-plugins">
    在 Provider Plugin 上下文中使用这些辅助工具的分步指南。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 配置加载和写入

优先使用已传入活跃调用路径的配置，例如注册时的 `api.config` 或 Channel/Provider 回调上的 `cfg` 参数。这使一个进程快照流过工作，而不是在热路径上重新解析配置。

只有当长期处理程序需要当前进程快照且没有配置传递给该函数时，才使用 `api.runtime.config.current()`。返回值是只读的；在编辑之前克隆或使用变更辅助工具。

工具工厂接收 `ctx.runtimeConfig` 加上 `ctx.getRuntimeConfig()`。当配置可以在工具定义创建后改变时，在长期工具的 `execute` 回调内使用 getter。

使用 `api.runtime.config.mutateConfigFile(...)` 或 `api.runtime.config.replaceConfigFile(...)` 持久化更改。每次写入必须选择一个明确的 `afterWrite` 策略：

- `afterWrite: { mode: "auto" }` 让 Gateway 重新加载规划器决定。
- `afterWrite: { mode: "restart", reason: "..." }` 在写入者知道热重载不安全时强制干净重启。
- `afterWrite: { mode: "none", reason: "..." }` 仅在调用者拥有后续操作时抑制自动重载/重启。

变更辅助工具返回 `afterWrite` 加上类型化的 `followUp` 摘要，以便调用者可以记录或测试他们是否请求了重启。Gateway 仍然拥有该重启实际发生的时机。

`api.runtime.config.loadConfig()` 和 `api.runtime.config.writeConfigFile(...)` 是 `runtime-config-load-write` 下的已弃用兼容性辅助工具。它们在运行时发出一次警告，并在迁移窗口期间对旧外部 Plugin 保持可用。捆绑 Plugin 不得使用它们；如果 Plugin 代码调用它们或从 Plugin SDK 子路径导入这些辅助工具，配置边界守卫会失败。

对于直接 SDK 导入，使用专注的配置子路径而不是宽泛的 `openclaw/plugin-sdk/config-runtime` 兼容性桶：`config-contracts` 用于类型，`plugin-config-runtime` 用于已加载的配置断言和 Plugin 入口查找，`runtime-config-snapshot` 用于当前进程快照，`config-mutation` 用于写入。捆绑 Plugin 测试应直接模拟这些专注的子路径，而不是模拟宽泛的兼容性桶。

内部 OpenClaw 运行时代码有相同的方向：在 CLI、Gateway 或进程边界加载一次配置，然后传递该值。成功的变更写入刷新进程运行时快照并推进其内部修订；长期缓存应以运行时拥有的缓存键为键，而不是在本地序列化配置。长期运行的运行时模块对环境 `loadConfig()` 调用有零容忍扫描器；使用传入的 `cfg`、请求的 `context.getRuntimeConfig()` 或在明确进程边界的 `getRuntimeConfig()`。

Provider 和 Channel 执行路径必须使用活跃的运行时配置快照，而不是为配置回读或编辑返回的文件快照。文件快照保留 UI 和写入的源值，如 SecretRef 标记；Provider 回调需要已解析的运行时视图。当辅助工具可能被活跃源快照或活跃运行时快照调用时，在读取凭据之前通过 `selectApplicableRuntimeConfig()` 路由。

## 可重用运行时实用程序

对于机器人编写的入站消息，使用 Channel 轮次的 `botLoopProtection` 事实。Core 在 Session 记录和分发之前应用共享的内存滑动窗口守卫，无需将策略绑定到一个 Channel。守卫跟踪 `(scopeId, conversationId, 参与者对)` 键，一起计数一对的两个方向，一旦超过窗口预算就应用冷却时间，并机会性地修剪非活跃条目。

向运营商公开此行为的 Channel Plugin 应优先使用共享的 `channels.defaults.botLoopProtection` 形状作为基准预算，然后在顶部叠加 Channel/Provider 特定的覆盖。共享配置使用秒，因为它面向用户：

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

将规范化的机器人对事实与已解析的轮次一起传递。Core 解析默认值、单位转换和 `enabled` 语义：

```typescript
return {
  channel: "example",
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  runDispatch,
  botLoopProtection: {
    scopeId: "account-1",
    conversationId: "channel-1",
    senderId: "bot-a",
    receiverId: "bot-b",
    config: channelConfig.botLoopProtection,
    defaultsConfig: runtimeConfig.channels?.defaults?.botLoopProtection,
    defaultEnabled: allowBotsMode !== "off",
  },
};
```

仅当 Plugin 拥有不通过共享 Channel 轮次内核的自定义双方事件循环时，直接使用 `openclaw/plugin-sdk/pair-loop-guard-runtime`。

## 运行时命名空间

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agent 身份、目录和 Session 管理。

    ```typescript
    // 解析 Agent 的工作目录
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // 解析 Agent 工作区
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // 获取 Agent 身份
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // 获取默认思考级别
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // 针对活跃 Provider 配置文件验证用户提供的思考级别
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // 将级别传递给嵌入式运行
    }

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

    `runEmbeddedAgent(...)` 是从 Plugin 代码启动普通 OpenClaw Agent 轮次的中立辅助工具。它使用与 Channel 触发的回复相同的 Provider/模型解析和 Agent 执行器选择。

    `runEmbeddedPiAgent(...)` 保留为兼容性别名。

    `resolveThinkingPolicy(...)` 返回 Provider/模型支持的思考级别和可选默认值。Provider Plugin 通过其思考 Hook 拥有特定于模型的配置文件，因此工具 Plugin 应调用此运行时辅助工具，而不是导入或复制 Provider 列表。

    `normalizeThinkingLevel(...)` 在检查已解析策略之前将用户文本（如 `on`、`x-high` 或 `extra high`）转换为规范存储级别。

    **Session 存储辅助工具**在 `api.runtime.agent.session` 下：

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // 修补一个条目而不从过时状态替换整个文件。
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    对于运行时写入，优先使用 `updateSessionStore(...)` 或 `updateSessionStoreEntry(...)`。它们通过 Gateway 拥有的 Session 存储写入器路由，保留并发更新，并重用热缓存。`saveSessionStore(...)` 对于兼容性和离线维护式重写仍然可用。

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    默认模型和 Provider 常量：

    ```typescript
    const model = api.runtime.agent.defaults.model; // 例如 "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // 例如 "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    运行主机拥有的文本补全，而不导入 Provider 内部或复制 OpenClaw 模型/认证/基础 URL 准备。

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    辅助工具使用与 OpenClaw 内置运行时相同的简单补全准备路径和主机拥有的运行时配置快照。上下文引擎接收 Session 绑定的 `llm.complete` 能力，因此模型调用使用活跃 Session 的 Agent，不会静默回退到默认 Agent。结果包括 Provider/模型/Agent 归因，以及可用时规范化的令牌、缓存和估计成本使用情况。

    <Warning>
    模型覆盖需要运营商通过配置中的 `plugins.entries.<id>.llm.allowModelOverride: true` 选择加入。使用 `plugins.entries.<id>.llm.allowedModels` 将受信任的 Plugin 限制到特定的规范 `provider/model` 目标。跨 Agent 补全需要 `plugins.entries.<id>.llm.allowAgentIdOverride: true`。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
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
    模型覆盖（`provider`/`model`）需要运营商通过配置中的 `plugins.entries.<id>.subagent.allowModelOverride: true` 选择加入。不受信任的 Plugin 仍然可以运行子 Agent，但覆盖请求会被拒绝。
    </Warning>

    `deleteSession(...)` 可以删除同一 Plugin 通过 `api.runtime.subagent.run(...)` 创建的 Session。删除任意用户或运营商 Session 仍然需要管理员范围的 Gateway 请求。

  </Accordion>
  <Accordion title="api.runtime.nodes">
    列出已连接的节点并从 Gateway 加载的 Plugin 代码或 Plugin CLI 命令调用节点主机命令。当 Plugin 拥有配对设备上的本地工作时使用，例如另一台 Mac 上的浏览器或音频桥接。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    在 Gateway 内部，此运行时是进程内的。在 Plugin CLI 命令中，它通过 RPC 调用已配置的 Gateway，因此 `openclaw googlemeet recover-tab` 等命令可以从终端检查配对节点。节点命令仍然通过正常的 Gateway 节点配对、命令允许列表、Plugin 节点调用策略和节点本地命令处理。

    公开危险节点主机命令的 Plugin 应使用 `api.registerNodeInvokePolicy(...)` 注册节点调用策略。策略在命令允许列表检查之后和命令转发到节点之前在 Gateway 中运行，因此直接的 `node.invoke` 调用和更高级别的 Plugin 工具共享相同的执行路径。

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    将 Task Flow 运行时绑定到现有的 OpenClaw Session 键或受信任的工具上下文，然后无需在每次调用时传递所有者即可创建和管理 Task Flow。

    Task Flow 跟踪持久的多步骤工作流状态。它不是调度器：使用 Cron 或 `api.session.workflow.scheduleSessionTurn(...)` 进行未来唤醒，然后在已调度轮次中当工作需要流状态、子任务、等待或取消时使用 `managedFlows`。

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

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

    当您已经从自己的绑定层获得受信任的 OpenClaw Session 键时，使用 `bindSession({ sessionKey, requesterOrigin })`。不要从原始用户输入绑定。

  </Accordion>
  <Accordion title="api.runtime.tts">
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

    使用 Core `messages.tts` 配置和 Provider 选择。返回 PCM 音频缓冲区 + 采样率。

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
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

    // 通过特定 Provider/模型进行结构化图像提取。
    // 至少包含一个图像；文本输入是补充上下文。
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.5",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "Prefer the printed total over handwritten notes." },
      ],
      instructions: "Extract vendor, total, and searchable tags.",
      schemaName: "receipt.evidence",
      jsonSchema: {
        type: "object",
        properties: {
          vendor: { type: "string" },
          total: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["vendor", "total"],
      },
      cfg: api.config,
    });
    ```

    当没有输出时（例如跳过的输入），返回 `{ text: undefined }`。

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` 保留为 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` 的兼容性别名。
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    图像生成。

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Web 搜索。

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    低级媒体实用程序。

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
    const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
    const metadata = await api.runtime.media.getImageMetadata(filePath);
    const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
    const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
    const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
      scale: 6, // 1-12
      marginModules: 4, // 0-16
    });
    const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
    const tmpRoot = resolvePreferredOpenClawTmpDir();
    const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
      tmpRoot,
      dirPrefix: "my-plugin-qr-",
      fileName: "qr.png",
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.config">
    当前运行时配置快照和事务性配置写入。优先使用已传入活跃调用路径的配置；只有当处理程序直接需要进程快照时才使用 `current()`。

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` 和 `replaceConfigFile(...)` 返回 `followUp` 值，例如 `{ mode: "restart", requiresRestart: true, reason }`，它记录写入者意图而不从 Gateway 夺取重启控制权。

  </Accordion>
  <Accordion title="api.runtime.system">
    系统级实用程序。

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // 已弃用的兼容性别名。
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

  </Accordion>
  <Accordion title="api.runtime.events">
    事件订阅。

    ```typescript
    api.runtime.events.onAgentEvent((event) => {
      /* ... */
    });
    api.runtime.events.onSessionTranscriptUpdate((update) => {
      /* ... */
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.logging">
    日志记录。

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    模型和 Provider 认证解析。

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    状态目录解析和基于 SQLite 的键值存储。

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const claimed = await store.registerIfAbsent("dedupe-key", { value: "first" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    键值存储在重启后仍然存在，并按运行时绑定的 Plugin ID 隔离。使用 `registerIfAbsent(...)` 进行原子去重声明：当键缺失或已过期并注册时返回 `true`，当存在活跃值时返回 `false`，不覆盖其值、创建时间或 TTL。限制：每个命名空间的 `maxEntries`，每个 Plugin 1,000 个活跃行，64KB 以下的 JSON 值，以及可选的 TTL 过期。

    <Warning>
    此版本仅限捆绑 Plugin。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    内存工具工厂和 CLI。

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Channel 特定的运行时辅助工具（在加载 Channel Plugin 时可用）。

    `api.runtime.channel.media` 是 Channel 媒体下载和存储的首选表面：

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    当远程 URL 应该成为 OpenClaw 媒体时，使用 `saveRemoteMedia(...)`。当 Plugin 已经使用 Plugin 拥有的认证、重定向或允许列表处理获取了 `Response` 时，使用 `saveResponseMedia(...)`。只有当 Plugin 需要用于检查、转换、解密或重新上传的原始字节时，才使用 `readRemoteMediaBuffer(...)`。`fetchRemoteMedia(...)` 保留为 `readRemoteMediaBuffer(...)` 的已弃用兼容性别名。

    `api.runtime.channel.mentions` 是使用运行时注入的捆绑 Channel Plugin 的共享入站提及策略表面：

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

    `api.runtime.channel.mentions` 故意不公开较旧的 `resolveMentionGating*` 兼容性辅助工具。优先使用规范化的 `{ facts, policy }` 路径。

  </Accordion>
</AccordionGroup>

## 存储运行时引用

使用 `createPluginRuntimeStore` 存储运行时引用，以便在 `register` 回调之外使用：

<Steps>
  <Step title="创建存储">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="连接到入口点">
    ```typescript
    export default defineChannelPluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Example",
      plugin: myPlugin,
      setRuntime: store.setRuntime,
    });
    ```
  </Step>
  <Step title="从其他文件访问">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // 如果未初始化则抛出
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // 如果未初始化则返回 null
    }
    ```

  </Step>
</Steps>

<Note>
优先使用 `pluginId` 作为运行时存储身份。较低级别的 `key` 形式用于一个 Plugin 故意需要多个运行时插槽的不常见情况。
</Note>

## 其他顶级 `api` 字段

除了 `api.runtime`，API 对象还提供：

<ParamField path="api.id" type="string">
  Plugin ID。
</ParamField>
<ParamField path="api.name" type="string">
  Plugin 显示名称。
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  当前配置快照（可用时为活跃内存运行时快照）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  来自 `plugins.entries.<id>.config` 的特定于 Plugin 的配置。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  范围化日志记录器（`debug`、`info`、`warn`、`error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  当前加载模式；`"setup-runtime"` 是轻量级的预完整入口启动/设置窗口。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  相对于 Plugin 根解析路径。
</ParamField>

## 相关

- [Plugin 内部](/plugins/architecture) — 能力模型和注册表
- [SDK 入口点](/plugins/sdk-entrypoints) — `definePluginEntry` 选项
- [SDK 概览](/plugins/sdk-overview) — 子路径参考
