---
mmh3_hash: "13aae55d37c358a4904be19d3b492fdb"
title: "`openclaw configure`"
sidebarTitle: "openclaw configure"
summary: "`openclaw configure` 的 CLI 参考(交互式配置提示)"
read_when:
  - 您想以交互方式调整凭据、设备或 Agent 默认值
---

# `openclaw configure`

交互式提示以设置凭据、设备和 Agent 默认值。

<Note>
**Model** 部分包括一个多选项,用于 `agents.defaults.models` 允许列表(在 `/model` 和模型选择器中显示的内容)。Provider 范围的设置选项将其所选模型合并到现有允许列表中，而非替换配置中已有的其他 Provider。从 configure 重新运行 Provider 认证会保留现有的 `agents.defaults.model.primary`。若要有意更改默认模型，请使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

当 configure 从 Provider 认证选择启动时,默认模型和允许列表选择器会自动优先选择该 Provider。对于配对的 Provider（如 Volcengine 和 BytePlus），同样的优先选择也匹配其编码计划变体(`volcengine-plan/*`、`byteplus-plan/*`)。如果优先 Provider 过滤器会产生空列表,configure 会回退到未过滤的目录,而不是显示空白选择器。

<Tip>
不带子命令的 `openclaw config` 打开相同的向导。使用 `openclaw config get|set|unset` 进行非交互式编辑。
</Tip>

对于网络搜索,`openclaw configure --section web` 允许您选择提供商并配置其凭据。某些提供商还会显示提供商特定的后续提示:

- **Grok** 可以使用相同的 `XAI_API_KEY` 提供可选的 `x_search` 设置,并让您选择 `x_search` 模型。
- **Kimi** 可以询问 Moonshot API 区域(`api.moonshot.ai` 与 `api.moonshot.cn`)以及默认的 Kimi 网络搜索模型。

相关:

- Gateway 配置参考:[Configuration](/gateway/configuration)
- Config CLI:[Config](/cli/config)

## 选项

- `--section <section>`:可重复的部分过滤器

可用部分:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

说明:

- 选择 Gateway 运行位置始终更新 `gateway.mode`。如果这是您唯一需要的,您可以选择"Continue"而不选择其他部分。
- 面向 Channel 的服务(Slack/Discord/Matrix/Microsoft Teams)在设置期间提示 Channel/房间允许列表。您可以输入名称或 ID;向导在可能的情况下将名称解析为 ID。
- 如果您运行 daemon 安装步骤,令牌身份验证需要令牌,且 `gateway.auth.token` 由 SecretRef 管理,configure 会验证 SecretRef 但不会将已解析的明文令牌值持久化到监督服务环境元数据中。
- 如果令牌身份验证需要令牌且配置的令牌 SecretRef 未解析,configure 会阻止 daemon 安装并提供可操作的修复指引。
- 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置且 `gateway.auth.mode` 未设置,configure 会阻止 daemon 安装直到明确设置模式。

## 示例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## 相关

- [CLI 参考](/cli)
- [Configuration](/gateway/configuration)
