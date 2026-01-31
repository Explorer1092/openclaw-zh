---
mmh3_hash: "ec437a94864e4b476dcb2df147335b3b"
summary: "计划: 为所有消息连接器提供一个干净的插件 SDK + 运行时"
read_when:
  - 定义或重构插件架构
  - 将通道连接器迁移到插件 SDK/运行时
---
# 插件 SDK + 运行时重构计划

目标: 每个消息连接器都是使用一个稳定 API 的插件(捆绑或外部)。
没有插件直接从 `src/**` 导入。所有依赖项都通过 SDK 或运行时。

## 为什么现在
- 当前连接器混合模式: 直接核心导入、仅 dist 桥和自定义助手。
- 这使升级变得脆弱并阻止干净的外部插件表面。

## 目标架构(两层)

### 1) 插件 SDK(编译时、稳定、可发布)
范围: 类型、助手和配置实用程序。没有运行时状态,没有副作用。

内容(示例):
- 类型: `ChannelPlugin`、适配器、`ChannelMeta`、`ChannelCapabilities`、`ChannelDirectoryEntry`。
- 配置助手: `buildChannelConfigSchema`、`setAccountEnabledInConfigSection`、`deleteAccountFromConfigSection`、
  `applyAccountNameToChannelSection`。
- 配对助手: `PAIRING_APPROVED_MESSAGE`、`formatPairingApproveHint`。
- 引导助手: `promptChannelAccessConfig`、`addWildcardAllowFrom`、引导类型。
- 工具参数助手: `createActionGate`、`readStringParam`、`readNumberParam`、`readReactionParams`、`jsonResult`。
- 文档链接助手: `formatDocsLink`。

交付:
- 发布为 `openclaw/plugin-sdk`(或从 `openclaw/plugin-sdk` 下的核心导出)。
- Semver 具有显式稳定性保证。

### 2) 插件运行时(执行表面、注入)
范围: 触及核心运行时行为的一切。
通过 `OpenClawPluginApi.runtime` 访问,因此插件从不导入 `src/**`。

提议的表面(最小但完整):
```ts
export type PluginRuntime = {
  channel: {
    text: {
      chunkMarkdownText(text: string, limit: number): string[];
      resolveTextChunkLimit(cfg: OpenClawConfig, channel: string, accountId?: string): number;
      hasControlCommand(text: string, cfg: OpenClawConfig): boolean;
    };
    reply: {
      dispatchReplyWithBufferedBlockDispatcher(params: {
        ctx: unknown;
        cfg: unknown;
        dispatcherOptions: {
          deliver: (payload: { text?: string; mediaUrls?: string[]; mediaUrl?: string }) =>
            void | Promise<void>;
          onError?: (err: unknown, info: { kind: string }) => void;
        };
      }): Promise<void>;
      createReplyDispatcherWithTyping?: unknown;
    };
    routing: {
      resolveAgentRoute(params: {
        cfg: unknown;
        channel: string;
        accountId: string;
        peer: { kind: "dm" | "group" | "channel"; id: string };
      }): { sessionKey: string; accountId: string };
    };
    pairing: {
      buildPairingReply(params: { channel: string; idLine: string; code: string }): string;
      readAllowFromStore(channel: string): Promise<string[]>;
      upsertPairingRequest(params: {
        channel: string;
        id: string;
        meta?: { name?: string };
      }): Promise<{ code: string; created: boolean }>;
    };
    media: {
      fetchRemoteMedia(params: { url: string }): Promise<{ buffer: Buffer; contentType?: string }>;
      saveMediaBuffer(
        buffer: Uint8Array,
        contentType: string | undefined,
        direction: "inbound" | "outbound",
        maxBytes: number,
      ): Promise<{ path: string; contentType?: string }>;
    };
    mentions: {
      buildMentionRegexes(cfg: OpenClawConfig, agentId?: string): RegExp[];
      matchesMentionPatterns(text: string, regexes: RegExp[]): boolean;
    };
    groups: {
      resolveGroupPolicy(cfg: OpenClawConfig, channel: string, accountId: string, groupId: string): {
        allowlistEnabled: boolean;
        allowed: boolean;
        groupConfig?: unknown;
        defaultConfig?: unknown;
      };
      resolveRequireMention(
        cfg: OpenClawConfig,
        channel: string,
        accountId: string,
        groupId: string,
        override?: boolean,
      ): boolean;
    };
    debounce: {
      createInboundDebouncer<T>(opts: {
        debounceMs: number;
        buildKey: (v: T) => string | null;
        shouldDebounce: (v: T) => boolean;
        onFlush: (entries: T[]) => Promise<void>;
        onError?: (err: unknown) => void;
      }): { push: (v: T) => void; flush: () => Promise<void> };
      resolveInboundDebounceMs(cfg: OpenClawConfig, channel: string): number;
    };
    commands: {
      resolveCommandAuthorizedFromAuthorizers(params: {
        useAccessGroups: boolean;
        authorizers: Array<{ configured: boolean; allowed: boolean }>;
      }): boolean;
    };
  };
  logging: {
    shouldLogVerbose(): boolean;
    getChildLogger(name: string): PluginLogger;
  };
  state: {
    resolveStateDir(cfg: OpenClawConfig): string;
  };
};
```

注意事项:
- 运行时是访问核心行为的唯一方式。
- SDK 故意小而稳定。
- 每个运行时方法映射到现有核心实现(无重复)。

## 迁移计划(分阶段、安全)

### 阶段 0: 脚手架
- 引入 `openclaw/plugin-sdk`。
- 使用上述表面向 `OpenClawPluginApi` 添加 `api.runtime`。
- 在过渡窗口期间维护现有导入(弃用警告)。

### 阶段 1: 桥清理(低风险)
- 用 `api.runtime` 替换每个扩展的 `core-bridge.ts`。
- 首先迁移 BlueBubbles、Zalo、Zalo Personal(已经接近)。
- 删除重复的桥代码。

### 阶段 2: 轻直接导入插件
- 将 Matrix 迁移到 SDK + 运行时。
- 验证引导、目录、组提及逻辑。

### 阶段 3: 重直接导入插件
- 迁移 MS Teams(最大的运行时助手集)。
- 确保回复/打字语义与当前行为匹配。

### 阶段 4: iMessage 插件化
- 将 iMessage 移动到 `extensions/imessage`。
- 用 `api.runtime` 替换直接核心调用。
- 保持配置键、CLI 行为和文档完整。

### 阶段 5: 执行
- 添加 lint 规则 / CI 检查: 没有来自 `src/**` 的 `extensions/**` 导入。
- 添加插件 SDK/版本兼容性检查(运行时 + SDK semver)。

## 兼容性和版本控制
- SDK: semver、已发布、记录的更改。
- 运行时: 每个核心版本版本化。添加 `api.runtime.version`。
- 插件声明所需的运行时范围(例如 `openclawRuntime: ">=2026.2.0"`)。

## 测试策略
- 适配器级单元测试(使用真实核心实现执行的运行时函数)。
- 每个插件的黄金测试: 确保没有行为漂移(路由、配对、允许列表、提及门控)。
- CI 中使用的单个端到端插件示例(安装 + 运行 + 冒烟)。

## 待解决的问题
- 在哪里托管 SDK 类型: 单独的包还是核心导出?
- 运行时类型分发: 在 SDK(仅类型)还是在核心?
- 如何为捆绑 vs 外部插件公开文档链接?
- 我们是否允许在过渡期间对仓库内插件进行有限的直接核心导入?

## 成功标准
- 所有通道连接器都是使用 SDK + 运行时的插件。
- 没有来自 `src/**` 的 `extensions/**` 导入。
- 新的连接器模板仅依赖于 SDK + 运行时。
- 外部插件可以在没有核心源访问的情况下开发和更新。

相关文档: [插件](/plugin)、[通道](/channels/index)、[配置](/gateway/configuration)。
