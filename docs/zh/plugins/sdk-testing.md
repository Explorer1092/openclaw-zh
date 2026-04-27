---
mmh3_hash: "af584f763f0e4601fbb1cbdbc56b16cb"
title: "Plugin 测试"
sidebarTitle: "测试"
summary: "OpenClaw Plugin 的测试工具和模式"
read_when:
  - 您正在为 Plugin 编写测试
  - 您需要来自 Plugin SDK 的测试工具
  - 您想了解打包 Plugin 的契约测试
---

# Plugin 测试

OpenClaw Plugin 的测试工具、模式和 lint 执行参考文档。

<Tip>
  **正在寻找测试示例？** 操作指南包含已验证的测试示例：[Channel Plugin 测试](/plugins/sdk-channel-plugins#step-6-test) 和 [Provider Plugin 测试](/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 测试工具

**导入：** `openclaw/plugin-sdk/testing`

testing 子路径为 Plugin 作者导出一组精简的辅助工具：

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### 可用导出

| 导出                                   | 目的                                                     |
| -------------------------------------- | -------------------------------------------------------- |
| `installCommonResolveTargetErrorCases` | 目标解析错误处理的共享测试用例                           |
| `shouldAckReaction`                    | 检查 Channel 是否应该添加确认反应                        |
| `removeAckReactionAfterReply`          | 在回复传递后删除确认反应                                 |

### 类型

testing 子路径还重新导出测试文件中有用的类型：

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
  OpenClawConfig,
  PluginRuntime,
  RuntimeEnv,
  MockFn,
} from "openclaw/plugin-sdk/testing";
```

## 测试目标解析

使用 `installCommonResolveTargetErrorCases` 为 Channel 目标解析添加标准错误用例：

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
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
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
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

打包的 Plugin 有验证注册所有权的契约测试：

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
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
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
