---
title: "Kilo Gateway Provider 集成设计"
description: "将 Kilo Gateway 作为一等 Provider 集成到 OpenClaw 的设计方案"
mmh3_hash: "9ce97e5f3119dc9ebb23ab4d21d60c2d"
---

# Kilo Gateway Provider 集成设计

## 概述

本文档概述了将"Kilo Gateway"作为一等 Provider 集成到 OpenClaw 的设计方案，参照现有的 OpenRouter 实现进行建模。Kilo Gateway 使用与 OpenAI 兼容的 completions API，但使用不同的基础 URL。

## 设计决策

### 1. Provider 命名

**推荐：`kilocode`**

理由：

- 与用户配置示例一致（`kilocode` provider 键）
- 与现有 provider 命名模式保持一致（例如 `openrouter`、`opencode`、`moonshot`）
- 简短易记
- 避免与通用的"kilo"或"gateway"术语混淆

已考虑的替代方案：`kilo-gateway` — 被否决，因为带连字符的名称在代码库中不常见，且 `kilocode` 更为简洁。

### 2. 默认模型引用

**推荐：`kilocode/anthropic/claude-opus-4.6`**

理由：

- 基于用户配置示例
- Claude Opus 4.5 是一个功能强大的默认模型
- 显式指定模型可避免依赖自动路由

### 3. 基础 URL 配置

**推荐：硬编码默认值 + 配置覆盖**

- **默认基础 URL：** `https://api.kilo.ai/api/gateway/`
- **可配置：** 是，通过 `models.providers.kilocode.baseUrl`

这与 Moonshot、Venice 和 Synthetic 等其他 provider 使用的模式一致。

### 4. 模型扫描

**推荐：初始阶段不设置专用模型扫描端点**

理由：

- Kilo Gateway 代理到 OpenRouter，因此模型是动态的
- 用户可以在配置中手动配置模型
- 如果 Kilo Gateway 将来暴露 `/models` 端点，可以再添加扫描支持

### 5. 特殊处理

**推荐：对 Anthropic 模型继承 OpenRouter 行为**

由于 Kilo Gateway 代理到 OpenRouter，应该应用相同的特殊处理：

- `anthropic/*` 模型的缓存 TTL 资格
- `anthropic/*` 模型的额外参数（cacheControlTtl）
- 转录策略遵循 OpenRouter 模式

## 需要修改的文件

### 核心凭证管理

#### 1. `src/commands/onboard-auth.credentials.ts`

添加：

```typescript
export const KILOCODE_DEFAULT_MODEL_REF = "kilocode/anthropic/claude-opus-4.6";

export async function setKilocodeApiKey(key: string, agentDir?: string) {
  upsertAuthProfile({
    profileId: "kilocode:default",
    credential: {
      type: "api_key",
      provider: "kilocode",
      key,
    },
    agentDir: resolveAuthAgentDir(agentDir),
  });
}
```

#### 2. `src/agents/model-auth.ts`

在 `resolveEnvApiKey()` 的 `envMap` 中添加：

```typescript
const envMap: Record<string, string> = {
  // ... 现有条目
  kilocode: "KILOCODE_API_KEY",
};
```

#### 3. `src/config/io.ts`

添加到 `SHELL_ENV_EXPECTED_KEYS`：

```typescript
const SHELL_ENV_EXPECTED_KEYS = [
  // ... 现有条目
  "KILOCODE_API_KEY",
];
```

### 配置应用

#### 4. `src/commands/onboard-auth.config-core.ts`

添加新函数：

```typescript
export const KILOCODE_BASE_URL = "https://api.kilo.ai/api/gateway/";

export function applyKilocodeProviderConfig(cfg: OpenClawConfig): OpenClawConfig {
  const models = { ...cfg.agents?.defaults?.models };
  models[KILOCODE_DEFAULT_MODEL_REF] = {
    ...models[KILOCODE_DEFAULT_MODEL_REF],
    alias: models[KILOCODE_DEFAULT_MODEL_REF]?.alias ?? "Kilo Gateway",
  };

  const providers = { ...cfg.models?.providers };
  const existingProvider = providers.kilocode;
  const { apiKey: existingApiKey, ...existingProviderRest } = (existingProvider ?? {}) as Record<
    string,
    unknown
  > as { apiKey?: string };
  const resolvedApiKey = typeof existingApiKey === "string" ? existingApiKey : undefined;
  const normalizedApiKey = resolvedApiKey?.trim();

  providers.kilocode = {
    ...existingProviderRest,
    baseUrl: KILOCODE_BASE_URL,
    api: "openai-completions",
    ...(normalizedApiKey ? { apiKey: normalizedApiKey } : {}),
  };

  return {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...cfg.agents?.defaults,
        models,
      },
    },
    models: {
      mode: cfg.models?.mode ?? "merge",
      providers,
    },
  };
}

export function applyKilocodeConfig(cfg: OpenClawConfig): OpenClawConfig {
  const next = applyKilocodeProviderConfig(cfg);
  const existingModel = next.agents?.defaults?.model;
  return {
    ...next,
    agents: {
      ...next.agents,
      defaults: {
        ...next.agents?.defaults,
        model: {
          ...(existingModel && "fallbacks" in (existingModel as Record<string, unknown>)
            ? {
                fallbacks: (existingModel as { fallbacks?: string[] }).fallbacks,
              }
            : undefined),
          primary: KILOCODE_DEFAULT_MODEL_REF,
        },
      },
    },
  };
}
```

### 认证选择系统

#### 5. `src/commands/onboard-types.ts`

添加到 `AuthChoice` 类型：

```typescript
export type AuthChoice =
  // ... 现有选择
  "kilocode-api-key";
// ...
```

添加到 `OnboardOptions`：

```typescript
export type OnboardOptions = {
  // ... 现有选项
  kilocodeApiKey?: string;
  // ...
};
```

#### 6. `src/commands/auth-choice-options.ts`

添加到 `AuthChoiceGroupId`：

```typescript
export type AuthChoiceGroupId =
  // ... 现有分组
  "kilocode";
// ...
```

添加到 `AUTH_CHOICE_GROUP_DEFS`：

```typescript
{
  value: "kilocode",
  label: "Kilo Gateway",
  hint: "API key (OpenRouter-compatible)",
  choices: ["kilocode-api-key"],
},
```

添加到 `buildAuthChoiceOptions()`：

```typescript
options.push({
  value: "kilocode-api-key",
  label: "Kilo Gateway API key",
  hint: "OpenRouter-compatible gateway",
});
```

#### 7. `src/commands/auth-choice.preferred-provider.ts`

添加映射：

```typescript
const PREFERRED_PROVIDER_BY_AUTH_CHOICE: Partial<Record<AuthChoice, string>> = {
  // ... 现有映射
  "kilocode-api-key": "kilocode",
};
```

### 认证选择应用

#### 8. `src/commands/auth-choice.apply.api-providers.ts`

添加导入：

```typescript
import {
  // ... 现有导入
  applyKilocodeConfig,
  applyKilocodeProviderConfig,
  KILOCODE_DEFAULT_MODEL_REF,
  setKilocodeApiKey,
} from "./onboard-auth.js";
```

添加 `kilocode-api-key` 的处理逻辑：

```typescript
if (authChoice === "kilocode-api-key") {
  const store = ensureAuthProfileStore(params.agentDir, {
    allowKeychainPrompt: false,
  });
  const profileOrder = resolveAuthProfileOrder({
    cfg: nextConfig,
    store,
    provider: "kilocode",
  });
  const existingProfileId = profileOrder.find((profileId) => Boolean(store.profiles[profileId]));
  const existingCred = existingProfileId ? store.profiles[existingProfileId] : undefined;
  let profileId = "kilocode:default";
  let mode: "api_key" | "oauth" | "token" = "api_key";
  let hasCredential = false;

  if (existingProfileId && existingCred?.type) {
    profileId = existingProfileId;
    mode =
      existingCred.type === "oauth" ? "oauth" : existingCred.type === "token" ? "token" : "api_key";
    hasCredential = true;
  }

  if (!hasCredential && params.opts?.token && params.opts?.tokenProvider === "kilocode") {
    await setKilocodeApiKey(normalizeApiKeyInput(params.opts.token), params.agentDir);
    hasCredential = true;
  }

  if (!hasCredential) {
    const envKey = resolveEnvApiKey("kilocode");
    if (envKey) {
      const useExisting = await params.prompter.confirm({
        message: `Use existing KILOCODE_API_KEY (${envKey.source}, ${formatApiKeyPreview(envKey.apiKey)})?`,
        initialValue: true,
      });
      if (useExisting) {
        await setKilocodeApiKey(envKey.apiKey, params.agentDir);
        hasCredential = true;
      }
    }
  }

  if (!hasCredential) {
    const key = await params.prompter.text({
      message: "Enter Kilo Gateway API key",
      validate: validateApiKeyInput,
    });
    await setKilocodeApiKey(normalizeApiKeyInput(String(key)), params.agentDir);
    hasCredential = true;
  }

  if (hasCredential) {
    nextConfig = applyAuthProfileConfig(nextConfig, {
      profileId,
      provider: "kilocode",
      mode,
    });
  }
  {
    const applied = await applyDefaultModelChoice({
      config: nextConfig,
      setDefaultModel: params.setDefaultModel,
      defaultModel: KILOCODE_DEFAULT_MODEL_REF,
      applyDefaultConfig: applyKilocodeConfig,
      applyProviderConfig: applyKilocodeProviderConfig,
      noteDefault: KILOCODE_DEFAULT_MODEL_REF,
      noteAgentModel,
      prompter: params.prompter,
    });
    nextConfig = applied.config;
    agentModelOverride = applied.agentModelOverride ?? agentModelOverride;
  }
  return { config: nextConfig, agentModelOverride };
}
```

同时在函数顶部添加 tokenProvider 映射：

```typescript
if (params.opts.tokenProvider === "kilocode") {
  authChoice = "kilocode-api-key";
}
```

### CLI 注册

#### 9. `src/cli/program/register.onboard.ts`

添加 CLI 选项：

```typescript
.option("--kilocode-api-key <key>", "Kilo Gateway API key")
```

添加到 action handler：

```typescript
kilocodeApiKey: opts.kilocodeApiKey as string | undefined,
```

更新 auth-choice 帮助文本：

```typescript
.option(
  "--auth-choice <choice>",
  "Auth: setup-token|token|chutes|openai-codex|openai-api-key|openrouter-api-key|kilocode-api-key|ai-gateway-api-key|...",
)
```

### 非交互式 Onboarding

#### 10. `src/commands/onboard-non-interactive/local/auth-choice.ts`

添加 `kilocode-api-key` 的处理逻辑：

```typescript
if (authChoice === "kilocode-api-key") {
  const resolved = await resolveNonInteractiveApiKey({
    provider: "kilocode",
    cfg: baseConfig,
    flagValue: opts.kilocodeApiKey,
    flagName: "--kilocode-api-key",
    envVar: "KILOCODE_API_KEY",
  });
  await setKilocodeApiKey(resolved.apiKey, agentDir);
  nextConfig = applyAuthProfileConfig(nextConfig, {
    profileId: "kilocode:default",
    provider: "kilocode",
    mode: "api_key",
  });
  // ... 应用默认模型
}
```

### 导出更新

#### 11. `src/commands/onboard-auth.ts`

添加导出：

```typescript
export {
  // ... 现有导出
  applyKilocodeConfig,
  applyKilocodeProviderConfig,
  KILOCODE_BASE_URL,
} from "./onboard-auth.config-core.js";

export {
  // ... 现有导出
  KILOCODE_DEFAULT_MODEL_REF,
  setKilocodeApiKey,
} from "./onboard-auth.credentials.js";
```

### 特殊处理（可选）

#### 12. `src/agents/pi-embedded-runner/cache-ttl.ts`

为 Anthropic 模型添加 Kilo Gateway 支持：

```typescript
export function isCacheTtlEligibleProvider(provider: string, modelId: string): boolean {
  const normalizedProvider = provider.toLowerCase();
  const normalizedModelId = modelId.toLowerCase();
  if (normalizedProvider === "anthropic") return true;
  if (normalizedProvider === "openrouter" && normalizedModelId.startsWith("anthropic/"))
    return true;
  if (normalizedProvider === "kilocode" && normalizedModelId.startsWith("anthropic/")) return true;
  return false;
}
```

#### 13. `src/agents/transcript-policy.ts`

添加 Kilo Gateway 处理（类似 OpenRouter）：

```typescript
const isKilocodeGemini = provider === "kilocode" && modelId.toLowerCase().includes("gemini");

// 在 needsNonImageSanitize 检查中包含
const needsNonImageSanitize =
  isGoogle || isAnthropic || isMistral || isOpenRouterGemini || isKilocodeGemini;
```

## 配置结构

### 用户配置示例

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "kilocode": {
        "baseUrl": "https://api.kilo.ai/api/gateway/",
        "apiKey": "xxxxx",
        "api": "openai-completions",
        "models": [
          {
            "id": "anthropic/claude-opus-4.6",
            "name": "Anthropic: Claude Opus 4.6"
          },
          { "id": "minimax/minimax-m2.1:free", "name": "Minimax: Minimax M2.1" }
        ]
      }
    }
  }
}
```

### 认证 Profile 结构

```json
{
  "profiles": {
    "kilocode:default": {
      "type": "api_key",
      "provider": "kilocode",
      "key": "xxxxx"
    }
  }
}
```

## 测试注意事项

1. **单元测试：**
   - 测试 `setKilocodeApiKey()` 写入正确的 profile
   - 测试 `applyKilocodeConfig()` 设置正确的默认值
   - 测试 `resolveEnvApiKey("kilocode")` 返回正确的环境变量

2. **集成测试：**
   - 测试使用 `--auth-choice kilocode-api-key` 的 onboarding 流程
   - 测试使用 `--kilocode-api-key` 的非交互式 onboarding
   - 测试使用 `kilocode/` 前缀的模型选择

3. **端到端测试：**
   - 测试通过 Kilo Gateway 的实际 API 调用（实时测试）

## 迁移说明

- 现有用户无需迁移
- 新用户可以立即使用 `kilocode-api-key` 认证选择
- 已有手动配置 `kilocode` provider 的用户将继续正常工作

## 未来考虑事项

1. **模型目录：** 如果 Kilo Gateway 暴露 `/models` 端点，可添加类似 `scanOpenRouterModels()` 的扫描支持

2. **OAuth 支持：** 如果 Kilo Gateway 添加 OAuth，相应扩展认证系统

3. **速率限制：** 如果需要，考虑添加 Kilo Gateway 特定的速率限制处理

4. **文档：** 在 `docs/providers/kilocode.md` 添加说明设置和使用方法的文档

## 变更摘要

| 文件                                                        | 变更类型 | 描述                                                             |
| ----------------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| `src/commands/onboard-auth.credentials.ts`                  | 新增     | `KILOCODE_DEFAULT_MODEL_REF`、`setKilocodeApiKey()`              |
| `src/agents/model-auth.ts`                                  | 修改     | 在 `envMap` 中添加 `kilocode`                                    |
| `src/config/io.ts`                                          | 修改     | 在 shell env 键中添加 `KILOCODE_API_KEY`                         |
| `src/commands/onboard-auth.config-core.ts`                  | 新增     | `applyKilocodeProviderConfig()`、`applyKilocodeConfig()`         |
| `src/commands/onboard-types.ts`                             | 修改     | 在 `AuthChoice` 中添加 `kilocode-api-key`，在选项中添加 `kilocodeApiKey` |
| `src/commands/auth-choice-options.ts`                       | 修改     | 添加 `kilocode` 分组和选项                                       |
| `src/commands/auth-choice.preferred-provider.ts`            | 修改     | 添加 `kilocode-api-key` 映射                                     |
| `src/commands/auth-choice.apply.api-providers.ts`           | 修改     | 添加 `kilocode-api-key` 处理逻辑                                 |
| `src/cli/program/register.onboard.ts`                       | 修改     | 添加 `--kilocode-api-key` 选项                                   |
| `src/commands/onboard-non-interactive/local/auth-choice.ts` | 修改     | 添加非交互式处理逻辑                                             |
| `src/commands/onboard-auth.ts`                              | 修改     | 导出新函数                                                       |
| `src/agents/pi-embedded-runner/cache-ttl.ts`                | 修改     | 添加 kilocode 支持                                               |
| `src/agents/transcript-policy.ts`                           | 修改     | 添加 kilocode Gemini 处理                                        |
