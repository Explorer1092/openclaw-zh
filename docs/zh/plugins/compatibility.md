---
mmh3_hash: "1c3e5894dcec1f3cf12a55d21d857565"
summary: "Plugin 兼容性契约、弃用元数据和迁移预期"
title: "Plugin 兼容性"
read_when:
  - 您维护 OpenClaw Plugin
  - 您看到 Plugin 兼容性警告
  - 您正在计划 Plugin SDK 或 Manifest 迁移
---

OpenClaw 在删除旧版 Plugin 契约之前通过命名的兼容性适配器保持其接线。这在 SDK、Manifest、设置、配置和 Agent 运行时契约发展时保护现有的 Bundle 和外部 Plugin。

## 兼容性注册表

Plugin 兼容性契约在 `src/plugins/compat/registry.ts` 的核心注册表中跟踪。

每条记录有：

- 稳定的兼容性代码
- 状态：`active`、`deprecated`、`removal-pending` 或 `removed`
- 所有者：SDK、配置、设置、Channel、Provider、Plugin 执行、Agent 运行时或核心
- 适用时的引入和弃用日期
- 替换指导
- 覆盖旧版和新版行为的文档、诊断和测试

该注册表是维护者规划和未来 Plugin 检查器检查的来源。如果面向 Plugin 的行为发生更改，请在添加适配器的同一更改中添加或更新兼容性记录。

Doctor 修复和迁移兼容性单独在 `src/commands/doctor/shared/deprecation-compat.ts` 中跟踪。这些记录涵盖旧版配置形状、安装分类帐布局和修复垫片，这些在运行时兼容性路径被删除后可能仍需要可用。

发布扫描应检查两个注册表。不要仅因为匹配的运行时或配置兼容性记录已过期就删除 doctor 迁移；首先验证没有仍然需要修复的受支持升级路径。还要在发布规划期间重新验证每个替换注释，因为当 Provider 和 Channel 从核心移出时，Plugin 所有权和配置占用空间可能会更改。

## Plugin 检查器包

Plugin 检查器应作为由版本化兼容性和 Manifest 契约支持的单独包/仓库存在于核心 OpenClaw 仓库之外。

第一天的 CLI 应该是：

```sh
openclaw-plugin-inspector ./my-plugin
```

它应该发出：

- Manifest/Schema 验证
- 正在检查的契约兼容性版本
- 安装/来源元数据检查
- 冷路径导入检查
- 弃用和兼容性警告

在 CI 注释中使用 `--json` 获得稳定的机器可读输出。OpenClaw 核心应该暴露检查器可以使用的契约和固定装置，但不应该从主 `openclaw` 包发布检查器二进制文件。

### 维护者验收通道

在验证外部检查器针对 OpenClaw Plugin 包时，使用 Crabbox 支持的 Blacksmith Testbox 进行可安装包验收通道。从干净的 OpenClaw 检出在包构建后运行它：

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

保持此通道对维护者可选，因为它安装外部 npm 包并可能检查在仓库外克隆的 Plugin 包。本地仓库保护覆盖 SDK 导出映射、兼容性注册表元数据、已弃用 SDK 导入降级和 Bundle 扩展导入边界；Testbox 检查器证明覆盖外部 Plugin 作者使用的包。

## 弃用策略

OpenClaw 不应在引入替换的同一版本中删除已记录的 Plugin 契约。

迁移顺序是：

1. 添加新契约。
2. 通过命名的兼容性适配器保持旧版行为接线。
3. 当 Plugin 作者可以采取行动时发出诊断或警告。
4. 记录替换和时间表。
5. 测试旧版和新版路径。
6. 等待宣布的迁移窗口。
7. 仅在明确的重大发布批准下删除。

已弃用的记录必须包含警告开始日期、替换、文档链接以及警告开始后不超过三个月的最终删除日期。不要添加具有开放式删除窗口的已弃用兼容性路径，除非维护者明确决定它是永久兼容性，并将其标记为 `active`。

## 当前兼容性区域

当前兼容性记录包括：

- 旧版广泛 SDK 导入，如 `openclaw/plugin-sdk/compat`
- 旧版仅 Hook 的 Plugin 形状和 `before_agent_start`
- 旧版 `api.on("deactivate", ...)` 清理 Hook 名称，而 Plugin 迁移到 `gateway_stop`
- 旧版 `activate(api)` Plugin 入口点，而 Plugin 迁移到 `register(api)`
- 旧版 SDK 别名，如 `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` 状态构建器、`openclaw/plugin-sdk/test-utils`（由聚焦的 `openclaw/plugin-sdk/*` 测试子路径替换），以及 `ClawdbotConfig` / `OpenClawSchemaType` 类型别名
- Bundle Plugin 允许列表和启用行为
- 旧版 Provider/Channel 环境变量 Manifest 元数据
- 旧版 Provider Plugin Hook 和类型别名，而 Provider 迁移到显式目录、身份验证、思考、重播和传输 Hook
- 旧版运行时别名，如 `api.runtime.taskFlow`、`api.runtime.subagent.getSession`、`api.runtime.stt` 和已弃用的 `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- 旧版内存 Plugin 分离注册，而内存 Plugin 迁移到 `registerMemoryCapability`
- 旧版 Channel SDK 助手用于原生消息 Schema、提及门控、入站信封格式化和批准能力嵌套
- 旧版 Channel 路由键和可比目标助手别名，而 Plugin 迁移到 `openclaw/plugin-sdk/channel-route`
- 正在被 Manifest 贡献所有权替换的激活提示
- `setup-api` 运行时回退，而设置描述符迁移到冷 `setup.requiresRuntime: false` 元数据
- Provider `discovery` Hook，而 Provider 目录 Hook 迁移到 `catalog.run(...)`
- Channel `showConfigured` / `showInSetup` 元数据，而 Channel 包迁移到 `openclaw.channel.exposure`
- 旧版运行时策略配置键，而 doctor 将操作员迁移到 `agentRuntime`
- 生成的 Bundle Channel 配置元数据回退，而注册表优先的 `channelConfigs` 元数据着陆
- 持久化的 Plugin 注册表禁用和安装迁移环境标志，而修复流程将操作员迁移到 `openclaw plugins registry --refresh` 和 `openclaw doctor --fix`
- 旧版 Plugin 拥有的网络搜索、网络获取和 x_search 配置路径，而 doctor 将它们迁移到 `plugins.entries.<plugin>.config`
- 旧版 `plugins.installs` 编写的配置和 Bundle Plugin 加载路径别名，而安装元数据迁移到状态管理的 Plugin 分类帐中

新 Plugin 代码应该优先使用注册表和特定迁移指南中列出的替换。现有 Plugin 可以继续使用兼容性路径，直到文档、诊断和发布说明宣布删除窗口。

## 发布说明

发布说明应该包含即将到来的 Plugin 弃用，附带目标日期和迁移文档链接。在兼容性路径移到 `removal-pending` 或 `removed` 之前，该警告需要发出。
