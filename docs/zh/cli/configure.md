---
mmh3_hash: "9b014866df8cd80b9ab5ff6f725f13e9"
summary: "`openclaw configure` 的 CLI 参考（交互式配置提示）"
read_when:
  - 您想以交互方式调整凭据、设备或 Agent 默认值
title: "Configure"
---

# `openclaw configure`

针对现有设置进行有针对性更改的交互式提示：凭据、设备、Agent 默认值、Gateway、Channel、Plugin、Skill 和健康检查。

使用 `openclaw onboard` 进行完整的引导式首次运行体验，使用 `openclaw setup` 仅进行基础配置/工作区，使用 `openclaw channels add` 仅需要 Channel 账户设置时。

<Note>
**Model** 部分包含 `agents.defaults.models` 允许列表（在 `/model` 和模型选择器中显示的内容）的多选。Provider 范围的设置选择将其选定的模型合并到现有允许列表中，而不是替换配置中已有的不相关 Provider。

从 configure 重新运行 Provider 身份验证会保留现有的 `agents.defaults.model.primary`，即使 Provider 的身份验证步骤返回带有其自己推荐默认模型的配置补丁也是如此。这意味着添加或重新验证 xAI、OpenRouter 或其他 Provider 应使新模型可用，而不会取代您当前的主要模型。当您有意想要更改默认模型时，请使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

当 configure 从 Provider 身份验证选择开始时，默认模型和允许列表选择器会自动优先选择该 Provider。对于配对的 Provider，如 Volcengine 和 BytePlus，相同的偏好也匹配其编码计划变体（`volcengine-plan/*`、`byteplus-plan/*`）。如果首选 Provider 过滤器会产生空列表，configure 会回退到未过滤的目录，而不是显示空选择器。

<Tip>
不带子命令的 `openclaw config` 打开相同的向导。使用 `openclaw config get|set|unset` 进行非交互式编辑。
</Tip>

对于网络搜索，`openclaw configure --section web` 允许您选择 Provider 并配置其凭据。一些 Provider 还显示特定于 Provider 的后续提示：

- **Grok** 可以提供使用相同 `XAI_API_KEY` 的可选 `x_search` 设置，并让您选择 `x_search` 模型。
- **Kimi** 可以询问 Moonshot API 区域（`api.moonshot.ai` 与 `api.moonshot.cn`）和默认的 Kimi 网络搜索模型。

相关：

- Gateway 配置参考：[Configuration](/gateway/configuration)
- Config CLI：[Config](/cli/config)

## 选项

- `--section <section>`：可重复的部分过滤器

可用部分：

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

注意：

- 完整向导和与 Gateway 相关的部分会询问 Gateway 的运行位置并更新 `gateway.mode`。不包含 `gateway`、`daemon` 或 `health` 的部分过滤器会直接进入所请求的设置。
- 在本地配置写入后，configure 在所选设置路径需要时安装选定的可下载 Plugin。远程 Gateway 配置不安装本地 Plugin 包。
- 面向 Channel 的服务（Slack/Discord/Matrix/Microsoft Teams）在设置期间提示 Channel/房间允许列表。您可以输入名称或 ID；向导尽可能将名称解析为 ID。
- 如果您运行守护进程安装步骤，token 身份验证需要 token，且 `gateway.auth.token` 是 SecretRef 管理的，configure 会验证 SecretRef，但不会将已解析的明文 token 值持久化到监控服务环境元数据中。
- 如果 token 身份验证需要 token 但配置的 token SecretRef 未解析，configure 会在有可行补救指南的情况下阻止守护进程安装。
- 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置且 `gateway.auth.mode` 未设置，configure 会阻止守护进程安装，直到明确设置模式。

## 示例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## 相关

- [CLI 参考](/cli)
- [配置](/gateway/configuration)
