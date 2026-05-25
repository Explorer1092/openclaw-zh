---
mmh3_hash: "df8840ec27ed8f6c85a00e2b1fa88898"
summary: "为 Codex 模式的 OpenClaw Agent 配置已迁移的原生 Codex Plugin"
title: "原生 Codex Plugin"
read_when:
  - 您希望 Codex 模式的 OpenClaw Agent 使用原生 Codex Plugin
  - 您正在迁移源安装的 openai-curated Codex Plugin
  - 您正在排查 codexPlugins、应用清单、破坏性操作或 Plugin 应用诊断问题
---

原生 Codex Plugin 支持让 Codex 模式的 OpenClaw Agent 在处理 OpenClaw 轮次的同一 Codex 线程中使用 Codex app-server 自身的应用和 Plugin 能力。

OpenClaw 不会将 Codex Plugin 转换为合成的 `codex_plugin_*` OpenClaw 动态 Tool。Plugin 调用保留在原生 Codex 转录中，Codex app-server 拥有应用支持的 MCP 执行。

在基础的 [Codex Harness](/plugins/codex-harness) 正常工作后，再使用本页面。

## 要求

- 选定的 OpenClaw Agent 运行时必须是原生 Codex Harness。
- `plugins.entries.codex.enabled` 必须为 true。
- `plugins.entries.codex.config.codexPlugins.enabled` 必须为 true。
- V1 仅支持迁移观察到在源 Codex 主目录中已源安装的 `openai-curated` Plugin。
- 目标 Codex app-server 必须能够看到预期的市场、Plugin 和应用清单。

`codexPlugins` 对 PI 运行、正常 OpenAI Provider 运行、ACP 对话绑定或其他 Harness 没有影响，因为这些路径不会创建带有原生 `apps` 配置的 Codex app-server 线程。

## 快速入门

从源 Codex 主目录预览迁移：

```bash
openclaw migrate codex --dry-run
```

当您希望迁移在规划原生 Plugin 激活之前检查源应用可访问性时，使用严格的源应用验证：

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

当计划看起来正确时，应用迁移：

```bash
openclaw migrate apply codex --yes
```

迁移为符合条件的 Plugin 写入显式 `codexPlugins` 条目，并为选定的 Plugin 调用 Codex app-server `plugin/install`。典型的迁移后配置如下：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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

更改 `codexPlugins` 后，新的 Codex 对话会自动获取更新的应用集。使用 `/new` 或 `/reset` 刷新当前对话。Plugin 启用或禁用更改不需要重启 Gateway。

## 从 Chat 管理 Plugin

当您希望从操作 Codex Harness 的同一 Chat 检查或更改已配置的原生 Codex Plugin 时，使用 `/codex plugins`：

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` 是 `/codex plugins list` 的别名。列表输出显示来自 `plugins.entries.codex.config.codexPlugins.plugins` 的已配置 Plugin 键、开/关状态、Codex Plugin 名称和市场。

`enable` 和 `disable` 只写入 `~/.openclaw/openclaw.json` 处的 OpenClaw 配置；它们不编辑 `~/.codex/config.toml` 或安装新的 Codex Plugin。只有所有者或具有 `operator.admin` 范围的 Gateway 客户端才能更改 Plugin 状态。

启用已配置的 Plugin 也会打开全局 `codexPlugins.enabled` 开关。如果 Plugin 因迁移返回 `auth_required` 而被写为已禁用，请在 OpenClaw 中启用它之前在 Codex 中重新授权该应用。

## 原生 Plugin 设置的工作原理

该集成有三个独立的状态：

- 已安装：Codex 在目标 app-server 运行时中具有本地 Plugin 捆绑包。
- 已启用：OpenClaw 配置愿意使 Plugin 可用于 Codex Harness 轮次。
- 可访问：Codex app-server 确认 Plugin 的应用条目对当前账户可用，并且可以映射到迁移的 Plugin 标识。

迁移是持久的安装/资格步骤。在规划期间，OpenClaw 读取源 Codex `plugin/read` 详情，并检查源 Codex app-server 账户响应是否为 ChatGPT 订阅账户。非 ChatGPT 或缺失的账户响应会以 `codex_subscription_required` 跳过应用支持的 Plugin。默认情况下，迁移不调用源 `app/list`；通过账户验证的应用支持源 Plugin 在没有源应用可访问性验证的情况下规划，账户查找传输失败以 `codex_account_unavailable` 跳过。使用 `--verify-plugin-apps` 时，迁移会获取新的源 `app/list` 快照，并要求每个拥有的应用在规划原生激活之前都存在、已启用且可访问。在该模式下，账户查找传输失败会落入源应用清单验证。运行时应用清单是迁移后的目标 Session 可访问性检查。Codex Harness Session 设置随后为已启用且可访问的 Plugin 应用计算限制性的线程应用配置。

线程应用配置在 OpenClaw 建立 Codex Harness Session 或替换过时的 Codex 线程绑定时计算。它不会在每个轮次重新计算，因此 `/codex plugins enable` 和 `/codex plugins disable` 影响新的 Codex 对话。当前对话应获取更新的应用集时，使用 `/new` 或 `/reset`。

## V1 支持边界

V1 是故意保持狭窄的：

- 只有已在源 Codex app-server 清单中安装的 `openai-curated` Plugin 才符合迁移条件。
- 应用支持的源 Plugin 必须通过迁移时的订阅验证。`--verify-plugin-apps` 添加源应用清单验证。订阅受限账户加上（在验证模式下）不可访问、已禁用、缺失的源应用或源应用清单刷新失败，会报告为跳过的手动项目，而不是已启用的配置条目。无法读取的 Plugin 详情在源应用清单验证之前被跳过。
- 迁移写入带有 `marketplaceName` 和 `pluginName` 的显式 Plugin 标识；它不写入本地 `marketplacePath` 缓存路径。
- `codexPlugins.enabled` 是全局启用开关。
- 没有 `plugins["*"]` 通配符，也没有授予任意安装权限的配置键。
- 不支持的市场、缓存的 Plugin 捆绑包、Hook 和 Codex 配置文件会保留在迁移报告中，供手动审查。

## 应用清单和所有权

OpenClaw 通过 app-server `app/list` 读取 Codex 应用清单，缓存一小时，并异步刷新过时或缺失的条目。缓存仅在内存中；重启 CLI 或 Gateway 会清除它，OpenClaw 从下一次 `app/list` 读取中重建它。

迁移和运行时使用独立的缓存键：

- 源迁移验证使用源 Codex 主目录和源 app-server 启动选项。这仅在设置 `--verify-plugin-apps` 时运行，并强制对该规划运行进行新的源 `app/list` 遍历。
- 目标运行时设置在构建 Codex 线程应用配置时使用目标 Agent 的 Codex app-server 标识。Plugin 激活会使该目标缓存键失效，然后在 `plugin/install` 后强制刷新它。

Plugin 应用仅在 OpenClaw 可以通过稳定的所有权将其映射回迁移的 Plugin 时才会暴露：

- 来自 Plugin 详情的精确应用 ID
- 已知的 MCP 服务器名称
- 唯一的稳定元数据

纯显示名称或模糊所有权会被排除，直到下一次清单刷新证明所有权。

## 线程应用配置

OpenClaw 为 Codex 线程注入限制性的 `config.apps` 补丁：`_default` 被禁用，只有已启用的迁移 Plugin 拥有的应用才被启用。

OpenClaw 从有效的全局或每 Plugin `allow_destructive_actions` 策略设置应用级别的 `destructive_enabled`，并让 Codex 从其原生应用 Tool 注释中强制执行破坏性 Tool 元数据。`_default` 应用配置通过 `open_world_enabled: false` 被禁用。已启用的 Plugin 应用以 `open_world_enabled: true` 发出；OpenClaw 不暴露单独的 Plugin 开放世界策略旋钮，也不维护每 Plugin 破坏性 Tool 名称拒绝列表。

Plugin 应用的 Tool 审批模式默认是自动的，因此非破坏性的读取 Tool 可以在没有同线程审批 UI 的情况下运行。破坏性 Tool 仍然由每个应用的 `destructive_enabled` 策略控制。

## 破坏性操作策略

对于迁移的 Codex Plugin，破坏性 Plugin 触发默认是允许的，而不安全的 Schema 和模糊的所有权仍然以关闭方式失败：

- 全局 `allow_destructive_actions` 默认为 `true`。
- 每 Plugin 的 `allow_destructive_actions` 覆盖该 Plugin 的全局策略。
- 当策略为 `false` 时，OpenClaw 返回确定性拒绝。
- 当策略为 `true` 时，OpenClaw 仅自动接受它可以映射到审批响应的安全 Schema，例如布尔审批字段。
- 缺失的 Plugin 标识、模糊的所有权、缺失的轮次 ID、错误的轮次 ID 或不安全的触发 Schema 会拒绝而不是提示。

## 故障排除

**`auth_required`：** 迁移已安装 Plugin，但其中一个应用仍需要身份验证。显式 Plugin 条目被写入为已禁用，直到您重新授权并启用它。

**`app_inaccessible`、`app_disabled` 或 `app_missing`：** 迁移没有安装 Plugin，因为设置了 `--verify-plugin-apps` 时，源 Codex 应用清单没有显示所有拥有的应用都存在、已启用且可访问。在 Codex 中重新授权或启用应用，然后使用 `--verify-plugin-apps` 重新运行迁移。

**`app_inventory_unavailable`：** 迁移没有安装 Plugin，因为请求了严格的源应用验证，但源 Codex 应用清单刷新失败。修复源 Codex app-server 访问，或如果您接受更快的账户验证计划，则不使用 `--verify-plugin-apps` 重试。

**`codex_subscription_required`：** 迁移没有安装应用支持的 Plugin，因为源 Codex app-server 账户没有使用 ChatGPT 订阅账户登录。使用订阅身份验证登录 Codex 应用，然后重新运行迁移。

**`codex_account_unavailable`：** 迁移没有安装应用支持的 Plugin，因为无法读取源 Codex app-server 账户。修复源 Codex app-server 身份验证，或如果您希望在账户查找失败时由源应用清单决定资格，则使用 `--verify-plugin-apps` 重新运行。

**`marketplace_missing` 或 `plugin_missing`：** 目标 Codex app-server 无法看到预期的 `openai-curated` 市场或 Plugin。针对目标运行时重新运行迁移，或检查 Codex app-server Plugin 状态。

**`app_inventory_missing` 或 `app_inventory_stale`：** 应用就绪状态来自空或过时的缓存。OpenClaw 安排异步刷新，并在所有权和就绪状态已知之前排除 Plugin 应用。

**`app_ownership_ambiguous`：** 应用清单仅通过显示名称匹配，因此该应用不会暴露给 Codex 线程。

**配置已更改但 Agent 看不到 Plugin：** 使用 `/codex plugins list` 确认已配置的状态，然后使用 `/new` 或 `/reset`。现有的 Codex 线程绑定会保留它们启动时的应用配置，直到 OpenClaw 建立新的 Harness Session 或替换过时的绑定。

**破坏性操作被拒绝：** 检查全局和每 Plugin 的 `allow_destructive_actions` 值。即使策略为 true，不安全的触发 Schema 和模糊的 Plugin 标识仍然以关闭方式失败。

## 相关

- [Codex Harness](/plugins/codex-harness)
- [Codex Harness 参考](/plugins/codex-harness-reference)
- [Codex Harness 运行时](/plugins/codex-harness-runtime)
- [配置参考](/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/cli/migrate)
