---
mmh3_hash: "969323bebaceff2e54d082772b45649c"
title: "Plugin 测试"
sidebarTitle: "测试"
summary: "OpenClaw Plugin 的测试工具和模式"
read_when:
  - 您正在为 Plugin 编写测试
  - 您需要来自 Plugin SDK 的测试工具
  - 您想了解打包 Plugin 的契约测试
---

OpenClaw Plugin 的测试工具、模式和 lint 执行参考文档。

<Tip>
  **正在寻找测试示例？** 操作指南包含已验证的测试示例：[Channel Plugin 测试](/plugins/sdk-channel-plugins#step-6-test) 和 [Provider Plugin 测试](/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 测试工具

这些测试助手子路径是 OpenClaw 自身捆绑 Plugin 测试的仓库本地源入口点。它们不是第三方 Plugin 的包导出。

**Plugin API 模拟导入：** `openclaw/plugin-sdk/plugin-test-api`

**Agent 运行时契约导入：** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Channel 契约导入：** `openclaw/plugin-sdk/channel-contract-testing`

**Channel 测试助手导入：** `openclaw/plugin-sdk/channel-test-helpers`

**Channel 目标测试导入：** `openclaw/plugin-sdk/channel-target-testing`

**Plugin 契约导入：** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin 运行时测试导入：** `openclaw/plugin-sdk/plugin-test-runtime`

**Provider 契约导入：** `openclaw/plugin-sdk/provider-test-contracts`

**Provider HTTP 模拟导入：** `openclaw/plugin-sdk/provider-http-test-mocks`

**环境/网络测试导入：** `openclaw/plugin-sdk/test-env`

**通用固件导入：** `openclaw/plugin-sdk/test-fixtures`

**Node 内置模拟导入：** `openclaw/plugin-sdk/test-node-mocks`

对于新 Plugin 测试，优先使用下面的聚焦子路径。宽泛的 `openclaw/plugin-sdk/testing` 桶仅用于旧版兼容性。仓库守护拒绝来自 `plugin-sdk/testing` 和 `plugin-sdk/test-utils` 的新的真实导入；这些名称仅作为兼容性记录测试的已弃用兼容性界面保留。

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { AUTH_PROFILE_RUNTIME_CONTRACT } from "openclaw/plugin-sdk/agent-runtime-test-contracts";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { getProviderHttpMocks } from "openclaw/plugin-sdk/provider-http-test-mocks";
import { withEnv, withFetchPreconnect, withServer } from "openclaw/plugin-sdk/test-env";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

### 可用导出

| 导出                                               | 目的                                                                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                              | 构建用于直接注册单元测试的最小 Plugin API 模拟。从 `plugin-sdk/plugin-test-api` 导入                              |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                    | 原生 Agent 运行时适配器的共享身份验证配置文件契约固件。从 `plugin-sdk/agent-runtime-test-contracts` 导入          |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`               | 原生 Agent 运行时适配器的共享交付抑制契约固件。从 `plugin-sdk/agent-runtime-test-contracts` 导入                  |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                | 原生 Agent 运行时适配器的共享回退分类契约固件。从 `plugin-sdk/agent-runtime-test-contracts` 导入                  |
| `createParameterFreeTool`                          | 为原生运行时契约测试构建动态工具 Schema 固件。从 `plugin-sdk/agent-runtime-test-contracts` 导入                   |
| `expectChannelInboundContextContract`              | 断言 Channel 入站上下文形状。从 `plugin-sdk/channel-contract-testing` 导入                                        |
| `installChannelOutboundPayloadContractSuite`       | 安装 Channel 出站有效负载契约用例。从 `plugin-sdk/channel-contract-testing` 导入                                  |
| `createStartAccountContext`                        | 构建 Channel 账户生命周期上下文。从 `plugin-sdk/channel-test-helpers` 导入                                        |
| `installChannelActionsContractSuite`               | 安装通用 Channel 消息操作契约用例。从 `plugin-sdk/channel-test-helpers` 导入                                      |
| `installChannelSetupContractSuite`                 | 安装通用 Channel 设置契约用例。从 `plugin-sdk/channel-test-helpers` 导入                                          |
| `installChannelStatusContractSuite`                | 安装通用 Channel 状态契约用例。从 `plugin-sdk/channel-test-helpers` 导入                                          |
| `expectDirectoryIds`                               | 从目录列表函数断言 Channel 目录 id。从 `plugin-sdk/channel-test-helpers` 导入                                     |
| `assertBundledChannelEntries`                      | 断言捆绑 Channel 入口点暴露预期的公开契约。从 `plugin-sdk/channel-test-helpers` 导入                              |
| `formatEnvelopeTimestamp`                          | 格式化确定性包络时间戳。从 `plugin-sdk/channel-test-helpers` 导入                                                 |
| `expectPairingReplyText`                           | 断言 Channel 配对回复文本并提取其代码。从 `plugin-sdk/channel-test-helpers` 导入                                  |
| `describePluginRegistrationContract`               | 安装 Plugin 注册契约检查。从 `plugin-sdk/plugin-test-contracts` 导入                                              |
| `registerSingleProviderPlugin`                     | 在加载器冒烟测试中注册一个 Provider Plugin。从 `plugin-sdk/plugin-test-runtime` 导入                              |
| `registerProviderPlugin`                           | 从一个 Plugin 捕获所有 Provider 类型。从 `plugin-sdk/plugin-test-runtime` 导入                                    |
| `registerProviderPlugins`                          | 跨多个 Plugin 捕获 Provider 注册。从 `plugin-sdk/plugin-test-runtime` 导入                                        |
| `requireRegisteredProvider`                        | 断言 Provider 集合包含一个 id。从 `plugin-sdk/plugin-test-runtime` 导入                                           |
| `createRuntimeEnv`                                 | 构建模拟的 CLI/Plugin 运行时环境。从 `plugin-sdk/plugin-test-runtime` 导入                                        |
| `createPluginSetupWizardStatus`                    | 为 Channel Plugin 构建设置状态助手。从 `plugin-sdk/plugin-test-runtime` 导入                                      |
| `describeOpenAIProviderRuntimeContract`            | 安装 Provider 家族运行时契约检查。从 `plugin-sdk/provider-test-contracts` 导入                                    |
| `expectPassthroughReplayPolicy`                    | 断言 Provider 重放策略传递 Provider 自有的工具和元数据。从 `plugin-sdk/provider-test-contracts` 导入              |
| `runRealtimeSttLiveTest`                           | 使用共享音频固件运行实时 STT Provider 实时测试。从 `plugin-sdk/provider-test-contracts` 导入                      |
| `normalizeTranscriptForMatch`                      | 在模糊断言之前规范化实时转录输出。从 `plugin-sdk/provider-test-contracts` 导入                                    |
| `expectExplicitVideoGenerationCapabilities`        | 断言视频 Provider 声明了显式的生成模式能力。从 `plugin-sdk/provider-test-contracts` 导入                          |
| `expectExplicitMusicGenerationCapabilities`        | 断言音乐 Provider 声明了显式的生成/编辑能力。从 `plugin-sdk/provider-test-contracts` 导入                         |
| `mockSuccessfulDashscopeVideoTask`                 | 安装成功的 DashScope 兼容视频任务响应。从 `plugin-sdk/provider-test-contracts` 导入                               |
| `getProviderHttpMocks`                             | 访问可选的 Provider HTTP/身份验证 Vitest 模拟。从 `plugin-sdk/provider-http-test-mocks` 导入                      |
| `installProviderHttpMockCleanup`                   | 每次测试后重置 Provider HTTP/身份验证模拟。从 `plugin-sdk/provider-http-test-mocks` 导入                          |
| `installCommonResolveTargetErrorCases`             | 目标解析错误处理的共享测试用例。从 `plugin-sdk/channel-target-testing` 导入                                       |
| `shouldAckReaction`                                | 检查 Channel 是否应该添加确认反应。从 `plugin-sdk/channel-feedback` 导入                                          |
| `removeAckReactionAfterReply`                      | 在回复传递后删除确认反应。从 `plugin-sdk/channel-feedback` 导入                                                   |
| `createTestRegistry`                               | 构建 Channel Plugin 注册表固件。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入     |
| `createEmptyPluginRegistry`                        | 构建空 Plugin 注册表固件。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入           |
| `setActivePluginRegistry`                          | 为 Plugin 运行时测试安装注册表固件。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入 |
| `createRequestCaptureJsonFetch`                    | 在媒体助手测试中捕获 JSON 获取请求。从 `plugin-sdk/test-env` 导入                                                 |
| `withServer`                                       | 针对一次性本地 HTTP 服务器运行测试。从 `plugin-sdk/test-env` 导入                                                 |
| `createMockIncomingRequest`                        | 构建最小传入 HTTP 请求对象。从 `plugin-sdk/test-env` 导入                                                         |
| `withFetchPreconnect`                              | 使用预连接 Hook 运行获取测试。从 `plugin-sdk/test-env` 导入                                                       |
| `withEnv` / `withEnvAsync`                         | 临时修补环境变量。从 `plugin-sdk/test-env` 导入                                                                   |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 创建隔离的文件系统测试固件。从 `plugin-sdk/test-env` 导入                                                       |
| `createMockServerResponse`                         | 创建最小 HTTP 服务器响应模拟。从 `plugin-sdk/test-env` 导入                                                       |
| `createCliRuntimeCapture`                          | 在测试中捕获 CLI 运行时输出。从 `plugin-sdk/test-fixtures` 导入                                                   |
| `importFreshModule`                                | 使用新的查询令牌导入 ESM 模块以绕过模块缓存。从 `plugin-sdk/test-fixtures` 导入                                   |
| `bundledPluginRoot` / `bundledPluginFile`          | 解析捆绑 Plugin 源或 dist 固件路径。从 `plugin-sdk/test-fixtures` 导入                                            |
| `mockNodeBuiltinModule`                            | 安装窄 Node 内置 Vitest 模拟。从 `plugin-sdk/test-node-mocks` 导入                                                |
| `createSandboxTestContext`                         | 构建沙箱测试上下文。从 `plugin-sdk/test-fixtures` 导入                                                            |
| `writeSkill`                                       | 编写 Skill 固件。从 `plugin-sdk/test-fixtures` 导入                                                               |
| `makeAgentAssistantMessage`                        | 构建 Agent 转录消息固件。从 `plugin-sdk/test-fixtures` 导入                                                       |
| `peekSystemEvents` / `resetSystemEventsForTest`    | 检查和重置系统事件固件。从 `plugin-sdk/test-fixtures` 导入                                                        |
| `sanitizeTerminalText`                             | 清理终端输出以用于断言。从 `plugin-sdk/test-fixtures` 导入                                                        |
| `countLines` / `hasBalancedFences`                 | 断言分块输出形状。从 `plugin-sdk/test-fixtures` 导入                                                              |
| `runProviderCatalog`                               | 使用测试依赖执行 Provider 目录 Hook                                                                               |
| `resolveProviderWizardOptions`                     | 在契约测试中解析 Provider 设置向导选项                                                                            |
| `resolveProviderModelPickerEntries`                | 在契约测试中解析 Provider 模型选择器条目                                                                          |
| `buildProviderPluginMethodChoice`                  | 为断言构建 Provider 向导选项 id                                                                                    |
| `setProviderWizardProvidersResolverForTest`         | 为隔离测试注入 Provider 向导 Provider                                                                             |
| `createProviderUsageFetch`                         | 构建 Provider 使用量获取固件                                                                                       |
| `useFrozenTime` / `useRealTime`                    | 冻结和恢复计时器以用于时间敏感的测试。从 `plugin-sdk/test-env` 导入                                               |
| `createTestWizardPrompter`                         | 构建模拟的设置向导提示器                                                                                           |
| `createRuntimeTaskFlow`                            | 创建隔离的运行时任务流状态                                                                                         |
| `typedCases`                                       | 为表驱动测试保留字面量类型。从 `plugin-sdk/test-fixtures` 导入                                                    |

捆绑 Plugin 契约套件也使用 SDK 测试子路径来获取仅测试的注册表、清单、公开工件和运行时固件助手。依赖捆绑 OpenClaw 清单的核心专用套件保留在 `src/plugins/contracts` 下。对于新的扩展测试，使用有文档的聚焦 SDK 子路径，如 `plugin-sdk/plugin-test-api`、`plugin-sdk/channel-contract-testing`、`plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/plugin-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/provider-test-contracts`、`plugin-sdk/provider-http-test-mocks`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures`，而不是导入宽泛的 `plugin-sdk/testing` 兼容性桶、仓库 `src/**` 文件或仓库 `test/helpers/*` 桥接文件。

### 类型

聚焦的测试子路径还重新导出测试文件中有用的类型：

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## 测试目标解析

使用 `installCommonResolveTargetErrorCases` 为 Channel 目标解析添加标准错误用例：

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // 您的 Channel 目标解析逻辑
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // 添加 Channel 特定的测试用例
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## 测试模式

### 测试注册契约

将手写的 `api` mock 传递给 `register(api)` 的单元测试不会执行 OpenClaw 的加载器验收门控。为您的 Plugin 依赖的每个注册界面（尤其是 Hook 和内存等独占能力）添加至少一个加载器支持的冒烟测试。

真实加载器在缺少必需元数据或 Plugin 调用其不拥有的能力 API 时会使 Plugin 注册失败。例如，`api.registerHook(...)` 需要 Hook 名称，`api.registerMemoryCapability(...)` 需要 Plugin 清单或导出的入口声明 `kind: "memory"`。

### 测试运行时配置访问

在测试捆绑 Channel Plugin 时，优先使用来自 `openclaw/plugin-sdk/channel-test-helpers` 的共享 Plugin 运行时模拟。其已弃用的 `runtime.config.loadConfig()` 和 `runtime.config.writeConfigFile(...)` 模拟默认抛出错误，以便测试能捕获兼容 API 的新用法。只有当测试明确覆盖旧版兼容行为时才覆盖这些模拟。

### 单元测试 Channel Plugin

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("should resolve account from config", () => {
    const cfg = {
      channels: {
        "my-channel": {
          token: "test-token",
          allowFrom: ["user1"],
        },
      },
    };

    const account = myPlugin.setup.resolveAccount(cfg, undefined);
    expect(account.token).toBe("test-token");
  });

  it("should inspect account without materializing secrets", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // 不暴露令牌值
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### 单元测试 Provider Plugin

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... 上下文
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... 上下文
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### 模拟 Plugin 运行时

对于使用 `createPluginRuntimeStore` 的代码，在测试中模拟运行时：

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// 在测试设置中
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... 其他模拟
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... 其他命名空间
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// 测试后
store.clearRuntime();
```

### 使用每实例存根进行测试

优先使用每实例存根而不是原型修改：

```typescript
// 推荐：每实例存根
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// 避免：原型修改
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 契约测试（仓库内 Plugin）

捆绑的 Plugin 有验证注册所有权的契约测试：

```bash
pnpm test -- src/plugins/contracts/
```

这些测试断言：

- 哪些 Plugin 注册哪些 Provider
- 哪些 Plugin 注册哪些语音 Provider
- 注册形态的正确性
- 运行时契约合规性

### 运行范围测试

对于特定 Plugin：

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

仅运行契约测试：

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint 执行（仓库内 Plugin）

`pnpm check` 为仓库内 Plugin 执行三条规则：

1. **无单体根导入** — `openclaw/plugin-sdk` 根 barrel 被拒绝
2. **无直接 `src/` 导入** — Plugin 不能直接导入 `../../src/`
3. **无自导入** — Plugin 不能导入自己的 `plugin-sdk/<name>` 子路径

外部 Plugin 不受这些 lint 规则约束，但遵循相同的模式是推荐的。

## 测试配置

OpenClaw 使用 Vitest 和 V8 覆盖率阈值。对于 Plugin 测试：

```bash
# 运行所有测试
pnpm test

# 运行特定 Plugin 测试
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# 使用特定测试名称过滤器运行
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# 带覆盖率运行
pnpm test:coverage
```

如果本地运行导致内存压力：

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 相关

- [SDK 概览](/plugins/sdk-overview) — 导入规范
- [SDK Channel Plugin](/plugins/sdk-channel-plugins) — Channel Plugin 接口
- [SDK Provider Plugin](/plugins/sdk-provider-plugins) — Provider Plugin Hook
- [构建 Plugin](/plugins/building-plugins) — 入门指南
