---
read_when:
  - 你想交互式地调整凭证、设备或智能体默认设置
summary: "`openclaw configure` 的 CLI 参考（交互式配置提示）"
title: configure
x-i18n:
  generated_at: "2026-02-03T07:44:46Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: fcd913f07aaf91cc6ced5bc48b5153a5e28cdc84e120932dc822d8edf3e4c29a
  source_path: cli/configure.md
  workflow: 15
---

# `openclaw configure`

用于设置凭证、设备和智能体默认值的交互式提示。

注意：**模型**部分现在包含一个用于 `agents.defaults.models` 允许列表的多选项（显示在 `/model` 和模型选择器中的内容）。

提示：不带子命令的 `openclaw config` 会打开相同的向导。使用 `openclaw config get|set|unset` 进行非交互式编辑。

对于网络搜索，`openclaw configure --section web` 可让你选择提供商并配置其凭证。如果你选择 **Grok**，configure 还可以显示一个单独的后续步骤，使用相同的 `XAI_API_KEY` 启用 `x_search` 并选择 `x_search` 模型。其他网络搜索提供商不会显示该步骤。

相关内容：

- Gateway 网关配置参考：[配置](/gateway/configuration)
- Config CLI：[Config](/cli/config)

注意事项：

- 选择 Gateway 网关运行位置始终会更新 `gateway.mode`。如果这是你唯一需要的，可以不选择其他部分直接选择"继续"。
- 面向渠道的服务（Slack/Discord/Matrix/Microsoft Teams）在设置期间会提示输入频道/房间允许列表。你可以输入名称或 ID；向导会尽可能将名称解析为 ID。
- 如果你运行守护进程安装步骤，令牌认证需要令牌，且 `gateway.auth.token` 由 SecretRef 管理，configure 会验证 SecretRef，但不会将已解析的明文令牌值持久化到 supervisor 服务环境元数据中。
- 如果令牌认证需要令牌，而配置的令牌 SecretRef 未解析，configure 会阻止守护进程安装并提供可操作的修复指引。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，configure 会阻止守护进程安装，直到显式设置 mode。

## 示例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
```
