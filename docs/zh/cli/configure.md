---
mmh3_hash: "8279dfb8be1b4945265f60637bb17622"
title: "`openclaw configure`"
sidebarTitle: "openclaw configure"
summary: "`openclaw configure` 的 CLI 参考(交互式配置提示)"
read_when:
  - 您想以交互方式调整凭据、设备或 Agent 默认值
---

# `openclaw configure`

交互式提示以设置凭据、设备和 Agent 默认值。

注意:**Model** 部分现在包括一个多选项,用于 `agents.defaults.models` 允许列表(在 `/model` 和模型选择器中显示的内容)。

提示:不带子命令的 `openclaw config` 打开相同的向导。使用 `openclaw config get|set|unset` 进行非交互式编辑。

相关:

- Gateway 配置参考:[Configuration](/gateway/configuration)
- Config CLI:[Config](/cli/config)

注意:

- 选择 Gateway 运行位置始终更新 `gateway.mode`。如果这是您唯一需要的,您可以选择"Continue"而不选择其他部分。
- 面向 Channel 的服务(Slack/Discord/Matrix/Microsoft Teams)在设置期间提示 Channel/房间允许列表。您可以输入名称或 ID;向导在可能的情况下将名称解析为 ID。
- 如果您运行 daemon 安装步骤,令牌身份验证需要令牌,且 `gateway.auth.token` 由 SecretRef 管理,configure 会验证 SecretRef 但不会将已解析的明文令牌值持久化到监督服务环境元数据中。
- 如果令牌身份验证需要令牌且配置的令牌 SecretRef 未解析,configure 会阻止 daemon 安装并提供可操作的修复指引。
- 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置且 `gateway.auth.mode` 未设置,configure 会阻止 daemon 安装直到明确设置模式。

## 示例

```bash
openclaw configure
openclaw configure --section model --section channels
```
