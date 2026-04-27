---
mmh3_hash: "9ab0f881b010c6a82f1d08ec607532de"
summary: "Plugin 兼容性契约、弃用元数据和迁移预期"
title: "Plugin 兼容性"
read_when:
  - 您维护一个 OpenClaw Plugin
  - 您看到 Plugin 兼容性警告
  - 您正在规划 Plugin SDK 或 Manifest 迁移
---

OpenClaw 在删除旧版 Plugin 契约之前，通过命名兼容性适配器保持它们的接线。这在 SDK、Manifest、设置、配置和 Agent 运行时契约演进的同时，保护现有的 Bundle 和外部 Plugin。

## 兼容性注册表

Plugin 兼容性契约在 `src/plugins/compat/registry.ts` 的核心注册表中跟踪。

每条记录包含：

- 稳定的兼容性代码
- 状态：`active`、`deprecated`、`removal-pending` 或 `removed`
- 所有者：SDK、配置、设置、Channel、Provider、Plugin 执行、Agent 运行时或核心
- 适用时的引入和弃用日期
- 替换指南
- 覆盖旧版和新版行为的文档、诊断和测试

注册表是维护者规划和未来 Plugin 检查器检查的来源。如果面向 Plugin 的行为发生更改，请在添加适配器的同一更改中添加或更新兼容性记录。

Doctor 修复和迁移兼容性在 `src/commands/doctor/shared/deprecation-compat.ts` 中单独跟踪。这些记录涵盖旧版配置形式、安装账本布局和修复 Shim，这些可能在删除运行时兼容性路径后仍需要保持可用。

发布扫描应检查两个注册表。不要仅因为匹配的运行时或配置兼容性记录已过期就删除 doctor 迁移；首先验证是否没有仍需要修复的受支持升级路径。在发布规划期间还要重新验证每个替换注释，因为随着 Provider 和 Channel 从核心移出，Plugin 所有权和配置占用空间可能会发生变化。

## Plugin 检查器包

Plugin 检查器应作为单独的包/仓库存在于核心 OpenClaw 仓库之外，以版本化的兼容性和 Manifest 契约为后盾。

第一天的 CLI 应为：

```sh
openclaw-plugin-inspector ./my-plugin
```

它应输出：

- Manifest/Schema 验证
- 正在检查的契约兼容性版本
- 安装/源元数据检查
- 冷路径导入检查
- 弃用和兼容性警告

对 CI 注释使用 `--json` 以获得稳定的机器可读输出。OpenClaw 核心应公开检查器可以消费的契约和固定装置，但不应从主 `openclaw` 包发布检查器二进制文件。

## 弃用策略

OpenClaw 不应在引入替换的同一版本中删除记录的 Plugin 契约。

迁移顺序为：

1. 添加新契约。
2. 通过命名兼容性适配器保持旧版行为的接线。
3. 在 Plugin 作者可以采取行动时发出诊断或警告。
4. 记录替换和时间表。
5. 测试旧版和新版路径。
6. 等待宣布的迁移窗口。
7. 仅在获得明确的破坏性发布批准后删除。

已弃用的记录必须包含警告开始日期、替换、文档链接和不超过警告开始后三个月的最终删除日期。不要添加具有开放式删除窗口的已弃用兼容性路径，除非维护者明确决定它是永久兼容性并将其标记为 `active`。

## 当前兼容性领域

当前兼容性记录包括：

- 旧版广泛 SDK 导入，如 `openclaw/plugin-sdk/compat`
- 旧版仅 Hook Plugin 形态和 `before_agent_start`
- 旧版 `activate(api)` Plugin 入口点，同时 Plugin 迁移到 `register(api)`
- 旧版 SDK 别名，如 `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` 状态构建器、`openclaw/plugin-sdk/test-utils` 以及 `ClawdbotConfig`/`OpenClawSchemaType` 类型别名
- Bundle Plugin 允许列表和启用行为
- 旧版 Provider/Channel 环境变量 Manifest 元数据
- 旧版 Provider Plugin Hook 和类型别名，同时 Provider 迁移到显式目录、身份验证、思考、重放和传输 Hook
- 旧版运行时别名，如 `api.runtime.taskFlow`、`api.runtime.subagent.getSession` 和 `api.runtime.stt`
- 旧版内存 Plugin 分割注册，同时内存 Plugin 迁移到 `registerMemoryCapability`
- 旧版 Channel SDK 助手，用于原生消息 Schema、提及门控、入站包络格式化和审批能力嵌套
- 被 Manifest 贡献所有权替换的激活提示
- `setup-api` 运行时回退，同时设置描述符迁移到冷 `setup.requiresRuntime: false` 元数据
- Provider `discovery` Hook，同时 Provider 目录 Hook 迁移到 `catalog.run(...)`
- Channel `showConfigured`/`showInSetup` 元数据，同时 Channel 包迁移到 `openclaw.channel.exposure`
- 旧版运行时策略配置键，同时 doctor 将操作员迁移到 `agentRuntime`
- 生成的 Bundle Channel 配置元数据回退，同时注册表优先的 `channelConfigs` 元数据落地
- 持久化的 Plugin 注册表禁用和安装迁移环境标志，同时修复流程将操作员迁移到 `openclaw plugins registry --refresh` 和 `openclaw doctor --fix`
- 旧版 Plugin 拥有的网络搜索、网络获取和 x_search 配置路径，同时 doctor 将它们迁移到 `plugins.entries.<plugin>.config`
- 旧版 `plugins.installs` 创作配置和 Bundle Plugin 加载路径别名，同时安装元数据移入状态管理的 Plugin 账本

新 Plugin 代码应优先使用注册表和特定迁移指南中列出的替换。现有 Plugin 可以继续使用兼容性路径，直到文档、诊断和发布说明宣布删除窗口。

## 发布说明

发布说明应包含即将到来的 Plugin 弃用，并附有目标日期和迁移文档链接。在兼容性路径移至 `removal-pending` 或 `removed` 之前，需要发出该警告。
