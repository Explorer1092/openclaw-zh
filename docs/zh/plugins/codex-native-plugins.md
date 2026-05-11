---
mmh3_hash: "6beabef482b7d5831d695f5083b4b9b6"
summary: "为 Codex 模式的 OpenClaw Agent 配置已迁移的原生 Codex Plugin"
title: "原生 Codex Plugin"
read_when:
  - 您希望 Codex 模式的 OpenClaw Agent 使用原生 Codex Plugin
  - 您正在迁移源安装的 openai-curated Codex Plugin
  - 您正在排查 codexPlugins、应用清单、破坏性操作或 Plugin 应用诊断问题
---

原生 Codex Plugin 支持让 Codex 模式的 OpenClaw Agent 在处理 OpenClaw 轮次的同一 Codex 线程中使用 Codex app-server 自己的应用和 Plugin 能力。

OpenClaw 不将 Codex Plugin 转换为合成 `codex_plugin_*` OpenClaw 动态 Tool。Plugin 调用保留在原生 Codex 转录中，Codex app-server 拥有应用支持的 MCP 执行。

在基础 [Codex Harness](/plugins/codex-harness) 正常工作后，请使用此页面。

## 要求

- 所选 OpenClaw Agent 运行时必须是原生 Codex Harness。
- `plugins.entries.codex.enabled` 必须为 true。
- `plugins.entries.codex.config.codexPlugins.enabled` 必须为 true。
- V1 仅支持迁移观察到在源 Codex 主目录中已源安装的 `openai-curated` Plugin。
- 目标 Codex app-server 必须能够看到预期的 Marketplace、Plugin 和应用清单。

`codexPlugins` 对 Pi 运行、普通 OpenAI Provider 运行、ACP 对话绑定或其他 Harness 没有影响，因为这些路径不使用原生 `apps` 配置创建 Codex app-server 线程。

## 快速开始

从源 Codex 主目录预览迁移：

```bash
openclaw migrate codex --dry-run
```

当计划看起来正确时应用迁移：

```bash
openclaw migrate apply codex --yes
```

迁移为符合条件的 Plugin 写入显式 `codexPlugins` 条目，并为所选 Plugin 调用 Codex app-server `plugin/install`。典型的已迁移配置如下所示：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

更改 `codexPlugins` 后，使用 `/new`、`/reset` 或重启 Gateway，以便未来的 Codex Harness Session 以更新的应用集启动。

## 原生 Plugin 设置工作原理

集成有三个独立状态：

- 已安装：Codex 在目标 app-server 运行时中具有本地 Plugin Bundle。
- 已启用：OpenClaw 配置愿意使 Plugin 对 Codex Harness 轮次可用。
- 可访问：Codex app-server 确认 Plugin 的应用条目对活动账户可用，并可以映射到已迁移的 Plugin 身份。

迁移是持久的安装/资格步骤。运行时应用清单是可访问性检查。然后 Codex Harness Session 设置为已启用和可访问的 Plugin 应用计算限制性线程应用配置。

线程应用配置在 OpenClaw 建立 Codex Harness Session 或替换过时的 Codex 线程绑定时计算。它不会在每次轮次时重新计算。

## V1 支持边界

V1 有意保持窄小：

- 只有在源 Codex app-server 清单中已安装的 `openai-curated` Plugin 才有资格迁移。
- 迁移写入带有 `marketplaceName` 和 `pluginName` 的显式 Plugin 身份；它不写入本地 `marketplacePath` 缓存路径。
- `codexPlugins.enabled` 是全局启用开关。
- 没有 `plugins["*"]` 通配符，也没有授予任意安装权限的配置键。
- 不支持的 Marketplace、缓存的 Plugin Bundle、Hook 和 Codex 配置文件会在迁移报告中保留供手动审核。

## 应用清单和所有权

OpenClaw 通过 app-server `app/list` 读取 Codex 应用清单，缓存一小时，并异步刷新过时或缺失的条目。

只有当 OpenClaw 可以通过稳定所有权将其映射回已迁移的 Plugin 时，Plugin 应用才会暴露：

- 来自 Plugin 详情的精确应用 id
- 已知的 MCP 服务器名称
- 唯一的稳定元数据

仅显示名称或模糊所有权的情况会被排除，直到下一次清单刷新证明所有权。

## 线程应用配置

OpenClaw 为 Codex 线程注入限制性 `config.apps` 补丁：`_default` 被禁用，只有已启用的已迁移 Plugin 拥有的应用才被启用。

OpenClaw 从有效的全局或每插件 `allow_destructive_actions` 策略设置应用级别的 `destructive_enabled`，并让 Codex 从其原生应用 Tool 注释强制执行破坏性 Tool 元数据。`_default` 应用配置以 `open_world_enabled: false` 禁用。已启用的 Plugin 应用以 `open_world_enabled: true` 发出；OpenClaw 不暴露单独的 Plugin 开放世界策略旋钮，也不维护每个 Plugin 的破坏性 Tool 名称拒绝列表。

Plugin 应用的 Tool 审批模式默认为自动，以便非破坏性读取 Tool 可以在没有同线程审批 UI 的情况下运行。破坏性 Tool 仍然由每个应用的 `destructive_enabled` 策略控制。

## 破坏性操作策略

破坏性 Plugin 征询默认关闭失败：

- 全局 `allow_destructive_actions` 默认为 `false`。
- 每 Plugin 的 `allow_destructive_actions` 覆盖该 Plugin 的全局策略。
- 当策略为 `false` 时，OpenClaw 返回确定性拒绝。
- 当策略为 `true` 时，OpenClaw 仅自动接受它可以映射到审批响应的安全 Schema，例如布尔审批字段。
- 缺少 Plugin 身份、模糊所有权、缺少轮次 id、错误的轮次 id 或不安全的征询 Schema 会拒绝而不是提示。

## 故障排查

**`auth_required`：** 迁移安装了 Plugin，但其某个应用仍然需要身份验证。显式 Plugin 条目被写为已禁用，直到您重新授权并启用它。

**`marketplace_missing` 或 `plugin_missing`：** 目标 Codex app-server 看不到预期的 `openai-curated` Marketplace 或 Plugin。针对目标运行时重新运行迁移或检查 Codex app-server Plugin 状态。

**`app_inventory_missing` 或 `app_inventory_stale`：** 应用就绪状态来自空的或过时的缓存。OpenClaw 安排异步刷新并排除 Plugin 应用，直到所有权和就绪状态已知。

**`app_ownership_ambiguous`：** 应用清单只通过显示名称匹配，因此应用未暴露给 Codex 线程。

**配置已更改但 Agent 看不到 Plugin：** 使用 `/new`、`/reset` 或重启 Gateway。现有 Codex 线程绑定保留其启动时的应用配置，直到 OpenClaw 建立新的 Harness Session 或替换过时的绑定。

**破坏性操作被拒绝：** 检查全局和每 Plugin 的 `allow_destructive_actions` 值。即使策略为 true，不安全的征询 Schema 和模糊的 Plugin 身份仍然关闭失败。

## 相关

- [Codex Harness](/plugins/codex-harness)
- [Codex Harness 参考](/plugins/codex-harness-reference)
- [Codex Harness 运行时](/plugins/codex-harness-runtime)
- [配置参考](/gateway/configuration-reference#codex-harness-plugin-config)
- [迁移 CLI](/cli/migrate)
