---
mmh3_hash: "fb2fd96dffeebcc58542add20e0783e9"
summary: "为 OpenClaw Plugin 系统添加新共享能力的贡献者指南"
read_when:
  - 添加新的核心能力和 Plugin 注册入口
  - 决定代码应归属于核心、供应商 Plugin 还是功能 Plugin
  - 为 Channel 或工具连接新的运行时 Helper
title: "添加能力（贡献者指南）"
sidebarTitle: "添加能力"
---

# 添加能力

<Info>
  本文是面向 OpenClaw 核心开发者的**贡献者指南**。如果你在构建外部 Plugin，
  请参见 [构建 Plugin](/plugins/building-plugins)。
</Info>

当 OpenClaw 需要新的领域（如图像生成、视频生成或未来某个供应商支持的功能区域）时，请参考本文。

规则：

- plugin = 归属边界
- capability = 共享核心契约

这意味着不应直接将供应商连接到 Channel 或工具。应从定义能力开始。

## 何时创建能力

当以下条件全部满足时，创建新的能力：

1. 多个供应商有可能实现它
2. Channel、工具或功能 Plugin 应能在不关心供应商的情况下使用它
3. 核心需要拥有回退、策略、配置或交付行为

如果工作仅针对特定供应商且尚无共享契约，请先停下来定义契约。

## 标准流程

1. 定义类型化核心契约。
2. 为该契约添加 Plugin 注册。
3. 添加共享运行时 Helper。
4. 接入一个真实的供应商 Plugin 作为验证。
5. 将功能/Channel 消费者迁移到运行时 Helper。
6. 添加契约测试。
7. 撰写面向运营者的配置和归属模型文档。

## 各模块职责

核心：

- 请求/响应类型
- 提供商注册表 + 解析
- 回退行为
- 配置 schema 和标签/帮助信息
- 运行时 Helper 接口

供应商 Plugin：

- 供应商 API 调用
- 供应商鉴权处理
- 供应商特定的请求归一化
- 注册能力实现

功能/Channel Plugin：

- 调用 `api.runtime.*` 或对应的 `plugin-sdk/*-runtime` Helper
- 永远不直接调用供应商实现

## 文件核查清单

对于新能力，预计需要修改以下区域：

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
- 一个或多个 `extensions/<vendor>/...`
- 配置/文档/测试

## 示例：图像生成

图像生成遵循标准形态：

1. 核心定义 `ImageGenerationProvider`
2. 核心暴露 `registerImageGenerationProvider(...)`
3. 核心暴露 `runtime.imageGeneration.generate(...)`
4. `openai` 和 `google` Plugin 注册供应商支持的实现
5. 未来的供应商可注册相同契约，无需修改 Channel/工具

配置键与视觉分析路由分离：

- `agents.defaults.imageModel` = 分析图像
- `agents.defaults.imageGenerationModel` = 生成图像

保持二者分离，使回退和策略保持明确。

## 审查核查清单

在发布新能力之前，请验证：

- 没有 Channel/工具直接导入供应商代码
- 运行时 Helper 是共享路径
- 至少有一个契约测试断言了捆绑归属关系
- 配置文档列出了新的模型/配置键
- Plugin 文档解释了归属边界

如果 PR 跳过了能力层并将供应商行为硬编码到 Channel/工具中，请退回并先定义契约。
