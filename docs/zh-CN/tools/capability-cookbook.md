---
mmh3_hash: "786a320619f17db750efbac915c667a3"
read_when:
  - 向 OpenClaw 插件系统添加新的共享能力
  - 决定代码属于核心、厂商插件还是功能插件
  - 为 Channel 或工具接线新的运行时辅助工具
sidebarTitle: 添加能力
summary: 向 OpenClaw 插件系统添加新共享能力的贡献者指南
title: 添加能力（贡献者指南）
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: tools/capability-cookbook.md
  workflow: 15
---

# 添加能力

<Info>
  这是面向 OpenClaw 核心开发者的**贡献者指南**。如果你在构建外部插件，请参见 [Building Plugins](/plugins/building-plugins)。
</Info>

当 OpenClaw 需要新的领域（如图像生成、视频生成或未来某些厂商支持的功能领域）时使用此指南。

规则：

- 插件 = 所有权边界
- 能力 = 共享核心契约

这意味着你不应该从将厂商直接接线到 Channel 或工具开始。从定义能力开始。

## 何时创建能力

当以下所有条件都成立时创建新能力：

1. 多个厂商都可能合理地实现它
2. Channel、工具或功能插件应该在不关心厂商的情况下消费它
3. 核心需要拥有回退、策略、配置或投递行为

如果工作是纯厂商性质的且尚无共享契约，停下来先定义契约。

## 标准流程

1. 定义类型化的核心契约。
2. 为该契约添加插件注册。
3. 添加共享运行时辅助工具。
4. 接线一个真实的厂商插件作为验证。
5. 将功能/Channel 消费者迁移到运行时辅助工具。
6. 添加契约测试。
7. 记录面向操作员的配置和所有权模型。

## 各部分归属

核心：

- 请求/响应类型
- 提供商注册表 + 解析
- 回退行为
- 配置 Schema 和标签/帮助
- 运行时辅助工具接口

厂商插件：

- 厂商 API 调用
- 厂商认证处理
- 厂商专属请求规范化
- 注册能力实现

功能/Channel 插件：

- 调用 `api.runtime.*` 或匹配的 `plugin-sdk/*-runtime` 辅助工具
- 永远不直接调用厂商实现

## 文件清单

对于新能力，预期需要修改这些区域：

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
- 一个或多个内置插件包
- 配置/文档/测试

## 示例：图像生成

图像生成遵循标准形状：

1. 核心定义 `ImageGenerationProvider`
2. 核心暴露 `registerImageGenerationProvider(...)`
3. 核心暴露 `runtime.imageGeneration.generate(...)`
4. `openai` 和 `google` 插件注册厂商支持的实现
5. 未来的厂商可以注册相同的契约而无需更改 Channel/工具

配置键与视觉分析路由分开：

- `agents.defaults.imageModel` = 分析图像
- `agents.defaults.imageGenerationModel` = 生成图像

保持这些分离，以便回退和策略保持明确。

## 审查清单

在发布新能力之前，验证：

- 没有 Channel/工具直接导入厂商代码
- 运行时辅助工具是共享路径
- 至少一个契约测试断言内置所有权
- 配置文档命名了新的模型/配置键
- 插件文档解释了所有权边界

如果 PR 跳过了能力层并将厂商行为硬编码到 Channel/工具中，退回去先定义契约。
