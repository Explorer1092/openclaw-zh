---
mmh3_hash: "60eda3709dbb9b57da9305d4e20cac01"
---
# QA 重构

状态：基础迁移已落地。

## 目标

将 OpenClaw QA 从分离定义模型迁移到单一事实来源：

- 场景元数据
- 发送给模型的提示
- 设置和清理
- 测试框架逻辑
- 断言和成功标准
- 构件和报告提示

期望的最终状态是一个通用 QA 测试框架，它加载功能强大的场景定义文件，而不是在 TypeScript 中硬编码大多数行为。

## 当前状态

主要事实来源现在位于 `qa/scenarios/index.md` 加上 `qa/scenarios/*.md` 下每个场景的一个文件。

已实现：

- `qa/scenarios/index.md`
  - 规范 QA 包元数据
  - 操作员身份
  - 启动任务
- `qa/scenarios/*.md`
  - 每个场景一个 Markdown 文件
  - 场景元数据
  - 处理程序绑定
  - 场景特定执行配置
- `extensions/qa-lab/src/scenario-catalog.ts`
  - Markdown 包解析器 + zod 验证
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - 从 Markdown 包渲染计划
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - 生成兼容文件加 `QA_SCENARIOS.md` 的种子
- `extensions/qa-lab/src/suite.ts`
  - 通过 Markdown 定义的处理程序绑定选择可执行场景
- QA 总线协议 + UI
  - 用于图像/视频/音频/文件渲染的通用内联附件

剩余的分离接口：

- `extensions/qa-lab/src/suite.ts`
  - 仍然拥有大多数可执行的自定义处理程序逻辑
- `extensions/qa-lab/src/report.ts`
  - 仍然从运行时输出派生报告结构

因此，事实来源分离已修复，但执行仍然主要是处理程序支持的，而不是完全声明式的。

## 真实场景接口的样子

阅读当前套件显示了几个不同的场景类别。

### 简单交互

- Channel 基准
- DM 基准
- 线程跟进
- 模型切换
- 批准跟进
- 反应/编辑/删除

### 配置和运行时变更

- 配置补丁 Skill 禁用
- 配置应用重启唤醒
- 配置重启能力翻转
- 运行时清单漂移检查

### 文件系统和仓库断言

- 源/文档发现报告
- 构建 Lobster Invaders
- 生成的图像构件查找

### Memory 编排

- Memory 召回
- Channel 上下文中的 Memory 工具
- Memory 失败回退
- Session Memory 排名
- 线程 Memory 隔离
- Memory 梦境扫描

### 工具和 Plugin 集成

- MCP Plugin 工具调用
- Skill 可见性
- Skill 热安装
- 原生图像生成
- 图像往返
- 从附件理解图像

### 多轮次和多参与者

- 子 Agent 切换
- 子 Agent 扇出综合
- 重启恢复风格流程

这些类别之所以重要，是因为它们驱动 DSL 需求。仅提示 + 预期文本的平面列表是不够的。

## 方向

### 单一事实来源

使用 `qa/scenarios/index.md` 加上 `qa/scenarios/*.md` 作为撰写的事实来源。

包应该保持：

- 在审查中人类可读
- 机器可解析
- 足够丰富以驱动：
  - 套件执行
  - QA 工作区引导
  - QA Lab UI 元数据
  - 文档/发现提示
  - 报告生成

### 首选撰写格式

使用 Markdown 作为顶级格式，其中包含结构化 YAML。

推荐形状：

- YAML 前置内容
  - id
  - title
  - surface
  - tags
  - 文档引用
  - 代码引用
  - 模型/Provider 覆盖
  - 先决条件
- 散文部分
  - 目标
  - 说明
  - 调试提示
- 围栏 YAML 块
  - setup
  - steps
  - assertions
  - cleanup

这提供了：

- 比大型 JSON 更好的 PR 可读性
- 比纯 YAML 更丰富的上下文
- 严格解析和 zod 验证

原始 JSON 只作为中间生成形式可接受。

## 提议的场景文件形状

示例：

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## 运行器必须覆盖的 DSL 能力

基于当前套件，通用运行器需要的不仅仅是提示执行。

### 环境和设置操作

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Agent 轮次操作

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### 配置和运行时操作

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### 文件和构件操作

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Memory 和 Cron 操作

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### MCP 操作

- `mcp.callTool`

### 断言

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## 变量和构件引用

DSL 必须支持保存的输出和后续引用。

当前套件中的示例：

- 创建线程，然后重用 `threadId`
- 创建 Session，然后重用 `sessionKey`
- 生成图像，然后在下一轮次附加文件
- 生成唤醒标记字符串，然后断言它稍后出现

所需能力：

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- 路径、Session 键、线程 ID、标记、工具输出的类型化引用

没有变量支持，测试框架将继续将场景逻辑泄漏回 TypeScript。

## 应该保留为逃生舱的内容

在第 1 阶段，完全纯声明式运行器是不现实的。

某些场景本质上是编排密集型的：

- Memory 梦境扫描
- 配置应用重启唤醒
- 配置重启能力翻转
- 按时间戳/路径解析的生成图像构件
- 发现报告评估

这些应该暂时使用显式自定义处理程序。

推荐规则：

- 85-90% 声明式
- 对困难的剩余部分使用显式 `customHandler` 步骤
- 仅命名和记录自定义处理程序
- 场景文件中没有匿名内联代码

这使通用引擎保持干净，同时仍然允许进展。

## 架构变更

### 当前

场景 Markdown 已经是以下方面的事实来源：

- 套件执行
- 工作区引导文件
- QA Lab UI 场景目录
- 报告元数据
- 发现提示

生成的兼容性：

- 种子工作区仍然包含 `QA_KICKOFF_TASK.md`
- 种子工作区仍然包含 `QA_SCENARIO_PLAN.md`
- 种子工作区现在还包含 `QA_SCENARIOS.md`

## 重构计划

### 第 1 阶段：加载器和 Schema

已完成。

- 添加了 `qa/scenarios/index.md`
- 将场景拆分到 `qa/scenarios/*.md`
- 添加了命名 Markdown YAML 包内容的解析器
- 使用 zod 验证
- 将消费者切换到解析的包
- 删除了仓库级别的 `qa/seed-scenarios.json` 和 `qa/QA_KICKOFF_TASK.md`

### 第 2 阶段：通用引擎

- 将 `extensions/qa-lab/src/suite.ts` 拆分为：
  - 加载器
  - 引擎
  - 操作注册表
  - 断言注册表
  - 自定义处理程序
- 保留现有辅助函数作为引擎操作

交付物：

- 引擎执行简单的声明式场景

从主要是提示 + 等待 + 断言的场景开始：

- 线程跟进
- 从附件理解图像
- Skill 可见性和调用
- Channel 基准

交付物：

- 第一批真正的 Markdown 定义场景通过通用引擎发布

### 第 4 阶段：迁移中等场景

- 图像生成往返
- Channel 上下文中的 Memory 工具
- Session Memory 排名
- 子 Agent 切换
- 子 Agent 扇出综合

交付物：

- 变量、构件、工具断言、请求日志断言已得到验证

### 第 5 阶段：保留困难场景在自定义处理程序上

- Memory 梦境扫描
- 配置应用重启唤醒
- 配置重启能力翻转
- 运行时清单漂移

交付物：

- 相同的撰写格式，但在需要时使用显式自定义步骤块

### 第 6 阶段：删除硬编码场景映射

一旦包覆盖足够好：

- 从 `extensions/qa-lab/src/suite.ts` 中删除大多数场景特定的 TypeScript 分支

## 假 Slack / 富媒体支持

当前 QA 总线是文本优先的。

相关文件：

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

今天 QA 总线支持：

- 文本
- 反应
- 线程

它尚不对内联媒体附件建模。

### 所需的传输合同

添加通用 QA 总线附件模型：

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

然后将 `attachments?: QaBusAttachment[]` 添加到：

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### 为什么首先通用

不要构建仅 Slack 的媒体模型。

相反：

- 一个通用 QA 传输模型
- 其上的多个渲染器
  - 当前 QA Lab 聊天
  - 未来的假 Slack Web
  - 任何其他假传输视图

这防止了重复逻辑，并让媒体场景保持传输无关。

### 所需的 UI 工作

更新 QA UI 以渲染：

- 内联图像预览
- 内联音频播放器
- 内联视频播放器
- 文件附件芯片

当前 UI 已经可以渲染线程和反应，因此附件渲染应该在相同的消息卡模型上分层。

### 媒体传输启用的场景工作

一旦附件流过 QA 总线，我们可以添加更丰富的假聊天场景：

- 假 Slack 中的内联图像回复
- 音频附件理解
- 视频附件理解
- 混合附件排序
- 保留媒体的线程回复

## 建议

下一个实现块应该是：

1. 添加 Markdown 场景加载器 + zod Schema
2. 从 Markdown 生成当前目录
3. 首先迁移几个简单场景
4. 添加通用 QA 总线附件支持
5. 在 QA UI 中渲染内联图像
6. 然后扩展到音频和视频

这是证明两个目标的最小路径：

- 通用 Markdown 定义的 QA
- 更丰富的假消息界面

## 开放问题

- 场景文件是否应该允许带变量插值的嵌入 Markdown 提示模板
- 设置/清理应该是命名部分还是仅仅是有序操作列表
- 构件引用在 Schema 中应该是强类型的还是基于字符串的
- 自定义处理程序应该存在于一个注册表还是每个 surface 注册表中
- 在迁移期间生成的 JSON 兼容文件是否应该保持已检入状态
