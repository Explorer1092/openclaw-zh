---
mmh3_hash: "75a673df6841341a6e1471eb294f1e06"
summary: "向 OpenClaw Plugin 系统添加新共享能力的贡献者指南"
read_when:
  - 添加新的核心能力和 Plugin 注册界面
  - 决定代码属于核心、供应商 Plugin 还是功能 Plugin
  - 为 Channel 或 Tool 配置新的运行时助手
title: "添加能力（贡献者指南）"
sidebarTitle: "添加能力"
---

<Info>
  这是面向 OpenClaw 核心开发者的**贡献者指南**。如果您正在构建外部 Plugin，请参见
  [构建 Plugin](/plugins/building-plugins)。如需深入的架构参考（能力模型、所有权、
  加载流程、运行时助手），请参见 [Plugin 内部机制](/plugins/architecture)。
</Info>

当 OpenClaw 需要新的共享领域（如图像生成、视频生成或某些未来由供应商支持的功能区域）时，使用本指南。

规则：

- **Plugin** = 所有权边界
- **能力** = 共享核心契约

不要先将供应商直接连接到 Channel 或 Tool。先定义能力。

## 何时创建能力

当以下**所有**条件成立时，创建新能力：

1. 多个供应商都可以合理地实现它。
2. Channel、Tool 或功能 Plugin 应在不关心供应商的情况下使用它。
3. 核心需要拥有回退、策略、配置或交付行为。

如果工作仅限于某个供应商且尚无共享契约，请先停下来定义契约。

## 标准流程

1. 定义类型化的核心契约。
2. 为该契约添加 Plugin 注册。
3. 添加共享运行时助手。
4. 接入一个真实的供应商 Plugin 作为验证。
5. 将功能/Channel 消费者迁移到运行时助手。
6. 添加契约测试。
7. 记录面向操作员的配置和所有权模型。

## 各部分归属

**核心：**

- 请求/响应类型。
- Provider 注册表 + 解析。
- 回退行为。
- 配置 Schema，包含嵌套对象、通配符、数组项和组合节点上传播的 `title`/`description` 文档元数据。
- 运行时助手界面。

**供应商 Plugin：**

- 供应商 API 调用。
- 供应商身份验证处理。
- 供应商特定的请求规范化。
- 能力实现的注册。

**功能/Channel Plugin：**

- 调用 `api.runtime.*` 或匹配的 `plugin-sdk/*-runtime` 助手。
- 永远不直接调用供应商实现。

## Provider 和 Harness 接缝

当行为属于模型 Provider 契约而非通用 Agent 循环时，使用 **Provider Hook**。示例包括传输选择后的 Provider 特定请求参数、身份验证配置偏好、提示覆盖层，以及模型/配置文件故障转移后的后续回退路由。

当行为属于执行轮次的运行时时，使用 **Agent Harness Hook**。Harness 可以将成功但不可用的尝试结果（如空响应、仅推理或仅规划的响应）分类，以便外部模型回退策略可以做出重试决策。

保持两个接缝窄小：

- 核心拥有重试/回退策略。
- Provider Plugin 拥有 Provider 特定的请求/身份验证/路由提示。
- Harness Plugin 拥有运行时特定的尝试分类。
- 第三方 Plugin 返回提示，而不是直接修改核心状态。

## 文件清单

对于新能力，预期需要触及以下区域：

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- 一个或多个 Bundle Plugin 包。
- 配置、文档、测试。

## 工作示例：图像生成

图像生成遵循标准形式：

1. 核心定义 `ImageGenerationProvider`。
2. 核心暴露 `registerImageGenerationProvider(...)`。
3. 核心暴露 `runtime.imageGeneration.generate(...)`。
4. `openai`、`google`、`fal` 和 `minimax` Plugin 注册由供应商支持的实现。
5. 未来的供应商注册相同契约，而不更改 Channel/Tool。

配置键有意与视觉分析路由分离：

- `agents.defaults.imageModel` 用于分析图像。
- `agents.defaults.imageGenerationModel` 用于生成图像。

保持二者分离，使回退和策略保持明确。

## Embedding providers

使用 `embeddingProviders` 获取可复用的向量嵌入 Provider。此契约有意比 memory 更宽泛：Tool、搜索、检索、导入器或未来的功能 Plugin 可以在不依赖 memory 引擎的情况下使用 embedding。

对于 memory 引擎特定的适配器，继续使用 `memoryEmbeddingProviders`。这些适配器拥有 memory 索引细节，例如查询/文档分割、运行时元数据和本地 memory 引擎设置。不要让通用 embedding provider 依赖 memory 所属模块，除非该 provider 只能由 memory 使用。

## 审查清单

在发布新能力之前，请验证：

- 没有 Channel/Tool 直接导入供应商代码。
- 运行时助手是共享路径。
- 至少一个契约测试断言 Bundle 所有权。
- 配置文档中列出了新的模型/配置键。
- Plugin 文档解释了所有权边界。

如果 PR 跳过能力层并将供应商行为硬编码到 Channel/Tool 中，请退回并先定义契约。

## 相关

- [Plugin 内部机制](/plugins/architecture) — 能力模型、所有权、加载流程、运行时助手。
- [构建 Plugin](/plugins/building-plugins) — 第一个 Plugin 教程。
- [SDK 概览](/plugins/sdk-overview) — 导入映射和注册 API 参考。
- [创建 Skill](/tools/creating-skills) — 配套的贡献者界面。
