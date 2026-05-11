---
mmh3_hash: "e72efb5d12202b73d9346463ec3a5247"
summary: "将 Canvas 从核心迁移至捆绑实验性 Plugin 的计划和审计检查清单。"
read_when:
  - 移动 Canvas 主机、工具、命令、文档或协议所有权
  - 审计 Canvas 是否仍由核心拥有
  - 准备或审查实验性 Canvas Plugin PR
title: "Canvas Plugin 重构"
---

# Canvas Plugin 重构

Canvas 使用率低且属于实验性功能。将其视为捆绑 Plugin，而非核心功能。核心可以保留通用的 Gateway、节点、HTTP、认证、配置和原生客户端管道，但 Canvas 特定行为应位于 `extensions/canvas` 下。

## 目标

将 Canvas 所有权迁移至 `extensions/canvas`，同时保留当前的配对节点行为：

- 面向 Agent 的 `canvas` 工具由 Canvas Plugin 注册
- Canvas 节点命令仅在 Canvas Plugin 注册时才被允许
- A2UI 主机/源文件位于 Canvas Plugin 下
- Canvas 文档物化位于 Canvas Plugin 下
- CLI 命令实现位于 Canvas Plugin 下，或通过 Plugin 拥有的运行时桶委托
- 文档和 Plugin 清单将 Canvas 描述为实验性且由 Plugin 支持

## 非目标

- 不在此次重构中重新设计原生应用的 Canvas UI。
- 不从 iOS、Android 或 macOS 中移除 Canvas 协议/客户端支持，除非有单独的产品决策表明应删除 Canvas。
- 不仅为 Canvas 构建广泛的 Plugin 服务框架，除非至少有另一个捆绑 Plugin 需要相同的接缝。

## 当前分支状态

已完成：

- 在 `extensions/canvas` 中添加了捆绑 Plugin 包。
- 添加了 `extensions/canvas/openclaw.plugin.json`。
- 将 Agent `canvas` 工具从 `src/agents/tools/canvas-tool.ts` 迁移至 `extensions/canvas/src/tool.ts`。
- 从 `src/agents/openclaw-tools.ts` 中移除了 `createCanvasTool` 的核心注册。
- 将 Canvas 主机实现从 `src/canvas-host` 迁移至 `extensions/canvas/src/host`。
- 将 `extensions/canvas/runtime-api.ts` 保留为 Plugin 拥有的兼容性桶，用于测试、打包和外部公共 Canvas 助手。
- 将 Canvas 文档物化从 `src/gateway/canvas-documents.ts` 迁移至 `extensions/canvas/src/documents.ts`。
- 将 Canvas CLI 实现和 A2UI JSONL 助手迁移至 `extensions/canvas/src/cli.ts`。
- 将 Canvas 主机 URL 和范围化功能助手迁移至 `extensions/canvas/src`。
- 将 Canvas 节点命令默认值从硬编码的核心列表移出，并移入 Plugin `nodeInvokePolicies`。
- 在 `plugins.entries.canvas.config.host` 添加了 Plugin 拥有的 Canvas 主机配置。
- 将 Canvas 和 A2UI HTTP 服务移至 Canvas Plugin HTTP 路由注册后面。
- 为 Plugin 拥有的 HTTP 路由添加了通用 Plugin WebSocket 升级调度。
- 用通用托管 Plugin 界面和节点功能助手替换了 Canvas 特定的 Gateway 主机 URL 和节点功能认证。
- 添加了 Plugin 拥有的托管媒体解析器，使 Canvas 文档 URL 通过 Canvas Plugin 而不是核心导入 Canvas 文档内部来解析。
- 添加了 `api.registerNodeCliFeature(...)`，使 Canvas 可以将 `openclaw nodes canvas` 声明为 Plugin 拥有的节点功能，而无需手动拼写父命令路径。
- 从生产 `src/**` 导入中移除了 `extensions/canvas/runtime-api.js`。
- 将 A2UI 包源从 `apps/shared/OpenClawKit/Tools/CanvasA2UI` 迁移至 `extensions/canvas/src/host/a2ui-app`。
- 将 A2UI 构建/复制实现移至 `extensions/canvas/scripts` 下，并用通用捆绑 Plugin 资产 Hook 替换了根构建连接。
- 移除了运行时旧版顶级 `canvasHost` 配置别名。
- 保留了 Canvas doctor 迁移，使 `openclaw doctor --fix` 将旧的 `canvasHost` 配置重写为 `plugins.entries.canvas.config.host`。
- 移除了 Gateway 协议 v4 后面的旧 Agent Canvas 协议兼容性。原生客户端和 Gateway 现在仅使用 `pluginSurfaceUrls.canvas` 加 `node.pluginSurface.refresh`；已弃用的 `canvasHostUrl`、`canvasCapability` 和 `node.canvas.capability.refresh` 路径在此实验性重构中有意不受支持。
- 更新了生成的 Plugin 清单以包含 Canvas。
- 在 `docs/plugins/reference/canvas.md` 添加了 Plugin 参考文档。

已知剩余的核心拥有的 Canvas 界面：

- `apps/` 下的原生应用 Canvas 处理器仍有意消费 Canvas Plugin 界面
- `apps/` 下的原生应用 Canvas 协议/客户端处理器
- 发布工件输出仍使用 `dist/canvas-host/a2ui` 进行向后兼容的运行时查找，但复制步骤现已由 Plugin 拥有

## 目标形态

`extensions/canvas` 应拥有：

- Plugin 清单和包元数据
- Agent 工具注册
- 节点调用命令策略
- Canvas 主机和 A2UI 运行时
- Canvas A2UI 包源和资产构建/复制脚本
- Canvas 文档创建和资产解析
- Canvas CLI 实现
- Canvas 文档页面和 Plugin 清单条目

核心应仅拥有通用接缝：

- Plugin 发现和注册
- 通用 Agent 工具注册表
- 通用节点调用策略注册表
- 通用 Gateway HTTP/认证和 WebSocket 升级调度
- 通用托管 Plugin 界面 URL 解析
- 通用托管媒体解析器注册
- 通用节点功能传输
- 通用配置管道
- 通用捆绑 Plugin 资产 Hook 发现

原生应用可以保留 Canvas 命令处理器作为协议客户端。它们不是 Plugin 运行时所有者。

## 迁移步骤

1. 将 `plugins.entries.canvas.config.host` 视为 Plugin 拥有的配置界面。
2. 更新文档，使 Canvas 被描述为实验性捆绑 Plugin。
3. 运行专注的 Canvas 测试、Plugin 清单检查、Plugin SDK API 检查以及受运行时边界影响的构建/类型门控。

## 审计检查清单

在宣布重构完成之前：

- `rg "src/canvas-host|../canvas-host"` 返回无活跃源导入。
- `rg "canvas-tool|createCanvasTool" src` 找不到核心拥有的 Canvas 工具实现。
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` 在通用 Plugin 策略测试之外找不到硬编码的允许列表默认值。
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` 为空。
- `rg "canvas-documents" src` 为空。
- `rg "registerNodesCanvasCommands|nodes-canvas" src` 为空；Canvas Plugin 通过嵌套 Plugin CLI 元数据注册 `openclaw nodes canvas`。
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` 返回无 Gateway 运行时所有权。
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` 仅找到兼容性包装器或 Plugin 拥有的路径。
- `pnpm plugins:inventory:check` 通过。
- `pnpm plugin-sdk:api:check` 通过，或者生成的 API 基线被有意更新和审查。
- 专注的 Canvas 测试通过。
- Canvas 主机/A2UI 路径的变更通道测试通过。
- PR 正文明确表示 Canvas 是实验性且由 Plugin 支持的。

## 验证命令

在迭代时使用专注的本地检查：

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

如果运行时桶、惰性导入、打包或已发布 Plugin 界面发生更改，请在推送前运行 `pnpm build`。
