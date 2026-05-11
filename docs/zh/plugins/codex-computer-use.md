---
mmh3_hash: "88ae8d4c6291a4899ecebdf2ad0e9957"
summary: "为 Codex 模式的 OpenClaw Agent 设置 Codex Computer Use"
title: "Codex Computer Use"
read_when:
  - 您希望 Codex 模式的 OpenClaw Agent 使用 Codex Computer Use
  - 您正在 Codex Computer Use、PeekabooBridge 和直接 cua-driver MCP 之间进行选择
  - 您正在为 Bundle Codex Plugin 配置 computerUse
  - 您正在排查 /codex computer-use status 或 install 的问题
---

Computer Use 是 Codex 原生的用于本地桌面控制的 MCP Plugin。OpenClaw 不托管桌面应用程序、自行执行桌面操作，也不绕过 Codex 权限。Bundle `codex` Plugin 仅负责准备 Codex app-server：它启用 Codex Plugin 支持，查找或安装配置的 Codex Computer Use Plugin，检查 `computer-use` MCP 服务器是否可用，然后让 Codex 在 Codex 模式轮次中拥有原生 MCP Tool 调用。

当 OpenClaw 已经在使用原生 Codex Harness 时，请使用此页面。有关运行时设置本身，请参见 [Codex Harness](/plugins/codex-harness)。

## OpenClaw.app 和 Peekaboo

OpenClaw.app 的 Peekaboo 集成与 Codex Computer Use 是分开的。macOS 应用可以托管 PeekabooBridge Socket，以便 `peekaboo` CLI 可以为 Peekaboo 自己的自动化工具重用应用的本地辅助功能和屏幕录制授权。该桥接不安装或代理 Codex Computer Use，Codex Computer Use 也不通过 PeekabooBridge Socket 调用。

当您希望 OpenClaw.app 成为 Peekaboo CLI 自动化的权限感知主机时，请使用 [Peekaboo 桥接](/platforms/mac/peekaboo)。当 Codex 模式的 OpenClaw Agent 应在轮次开始前使用 Codex 的原生 `computer-use` MCP Plugin 时，请使用此页面。

## iOS 应用

iOS 应用与 Codex Computer Use 是分开的。它不安装或代理 Codex `computer-use` MCP 服务器，也不是桌面控制后端。相反，iOS 应用作为 OpenClaw Node 连接，并通过 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*` 等 Node 命令暴露移动能力。

当您希望 Agent 通过 Gateway 驱动 iPhone Node 时，请使用 [iOS](/platforms/ios)。当 Codex 模式的 Agent 应通过 Codex 的原生 Computer Use Plugin 控制本地 macOS 桌面时，请使用此页面。

## 直接 cua-driver MCP

Codex Computer Use 不是暴露桌面控制的唯一方式。如果您希望 OpenClaw 管理的运行时直接调用 TryCua 的驱动程序，请通过 OpenClaw 的 MCP 注册表使用上游 `cua-driver mcp` 服务器，而不是 Codex 特定的 Marketplace 流程。

安装 `cua-driver` 后，可以向其请求 OpenClaw 命令：

```bash
cua-driver mcp-config --client openclaw
```

或者自行注册 stdio 服务器：

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

该路径保持上游 MCP Tool 界面完整，包括驱动程序 Schema 和结构化 MCP 响应。当您希望 CUA 驱动程序作为普通 OpenClaw MCP 服务器可用时，请使用它。当 Codex app-server 应拥有插件安装、MCP 重载以及 Codex 模式轮次内的原生 Tool 调用时，请使用本页面上的 Codex Computer Use 设置。

CUA 驱动程序是 macOS 特定的，仍然需要其应用程序提示的本地 macOS 权限，例如辅助功能和屏幕录制。OpenClaw 不安装 `cua-driver`，不授予这些权限，也不绕过上游驱动程序的安全模型。

## 快速设置

当 Codex 模式的轮次必须在线程开始前具有 Computer Use 时，设置 `plugins.entries.codex.config.computerUse`：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

使用此配置，OpenClaw 在每次 Codex 模式轮次前检查 Codex app-server。如果 Computer Use 缺失但 Codex app-server 已经发现了可安装的 Marketplace，OpenClaw 会要求 Codex app-server 安装或重新启用该 Plugin 并重载 MCP 服务器。在 macOS 上，当没有注册匹配的 Marketplace 且标准 Codex 应用程序包存在时，OpenClaw 还会尝试从 `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 自动注册 Bundle Codex Marketplace，然后才失败。如果设置仍无法使 MCP 服务器可用，轮次将在线程开始前失败。

更改 Computer Use 配置后，如果现有 Codex 线程已经启动，请在受影响的聊天中使用 `/new` 或 `/reset` 后再进行测试。

## 命令

在 `codex` Plugin 命令界面可用的任何聊天界面中使用 `/codex computer-use` 命令。这些是 OpenClaw 聊天/运行时命令，而非 `openclaw codex ...` CLI 子命令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是只读的。它不添加 Marketplace 来源、安装 Plugin 或启用 Codex Plugin 支持。

`install` 启用 Codex app-server Plugin 支持，可选地添加已配置的 Marketplace 来源，通过 Codex app-server 安装或重新启用配置的 Plugin，重载 MCP 服务器，并验证 MCP 服务器暴露了 Tool。

## Marketplace 选择

OpenClaw 使用与 Codex 本身暴露的相同 app-server API。Marketplace 字段选择 Codex 应在哪里找到 `computer-use`。

| 字段                | 何时使用                                                        | 安装支持                                                      |
| ------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| 无 Marketplace 字段  | 您希望 Codex app-server 使用其已知的 Marketplace。              | 是，当 app-server 返回本地 Marketplace 时。                   |
| `marketplaceSource` | 您有 app-server 可以添加的 Codex Marketplace 来源。             | 是，用于显式 `/codex computer-use install`。                  |
| `marketplacePath`   | 您已知道主机上本地 Marketplace 文件路径。                       | 是，用于显式安装和轮次启动自动安装。                           |
| `marketplaceName`   | 您想通过名称选择已注册的 Marketplace。                          | 仅当所选 Marketplace 具有本地路径时才是。                     |

新的 Codex 主目录可能需要片刻时间来填充其官方 Marketplace。在安装期间，OpenClaw 会轮询 `plugin/list` 长达 `marketplaceDiscoveryTimeoutMs` 毫秒。默认值为 60 秒。

如果多个已知 Marketplace 包含 Computer Use，OpenClaw 优先选择 `openai-bundled`，然后是 `openai-curated`，然后是 `local`。未知的模糊匹配会关闭失败并要求您设置 `marketplaceName` 或 `marketplacePath`。

## Bundle macOS Marketplace

最近的 Codex 桌面版本在以下位置 Bundle 了 Computer Use：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

当 `computerUse.autoInstall` 为 true 且没有注册包含 `computer-use` 的 Marketplace 时，OpenClaw 会尝试自动添加标准 Bundle Marketplace 根目录：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

您也可以从带有 Codex 的 Shell 中显式注册它：

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

如果您使用非标准 Codex 应用路径，请将 `computerUse.marketplacePath` 设置为本地 Marketplace 文件路径，或运行一次 `/codex computer-use install --source <marketplace-source>`。

## 远程目录限制

Codex app-server 可以列出和读取仅远程目录条目，但目前不支持远程 `plugin/install`。这意味着 `marketplaceName` 可以选择仅远程 Marketplace 进行状态检查，但安装和重新启用仍然需要通过 `marketplaceSource` 或 `marketplacePath` 使用本地 Marketplace。

如果状态显示 Plugin 在远程 Codex Marketplace 中可用但不支持远程安装，请使用本地来源或路径运行安装：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 配置参考

| 字段                            | 默认值         | 含义                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | 推断           | 需要 Computer Use。当设置了另一个 Computer Use 字段时默认为 true。             |
| `autoInstall`                   | false          | 在轮次启动时从已发现的 Marketplace 安装或重新启用。                             |
| `marketplaceDiscoveryTimeoutMs` | 60000          | 安装等待 Codex app-server Marketplace 发现的时长。                              |
| `marketplaceSource`             | 未设置         | 传递给 Codex app-server `marketplace/add` 的来源字符串。                        |
| `marketplacePath`               | 未设置         | 包含该 Plugin 的本地 Codex Marketplace 文件路径。                               |
| `marketplaceName`               | 未设置         | 要选择的已注册 Codex Marketplace 名称。                                         |
| `pluginName`                    | `computer-use` | Codex Marketplace Plugin 名称。                                                 |
| `mcpServerName`                 | `computer-use` | 已安装 Plugin 暴露的 MCP 服务器名称。                                           |

轮次启动自动安装有意拒绝已配置的 `marketplaceSource` 值。添加新来源是一项显式设置操作，因此请先使用 `/codex computer-use install --source <marketplace-source>` 一次，然后让 `autoInstall` 处理从已发现的本地 Marketplace 进行的未来重新启用。轮次启动自动安装可以使用已配置的 `marketplacePath`，因为这已经是主机上的本地路径。

## OpenClaw 检查的内容

OpenClaw 在内部报告稳定的设置原因，并为聊天格式化面向用户的状态：

| 原因                         | 含义                                                   | 下一步                                        |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析为 false。                   | 设置 `enabled` 或其他 Computer Use 字段。     |
| `marketplace_missing`        | 没有匹配的 Marketplace 可用。                           | 配置来源、路径或 Marketplace 名称。           |
| `plugin_not_installed`       | Marketplace 存在，但 Plugin 未安装。                   | 运行安装或启用 `autoInstall`。               |
| `plugin_disabled`            | Plugin 已安装但在 Codex 配置中已禁用。                  | 运行安装以重新启用它。                        |
| `remote_install_unsupported` | 所选 Marketplace 仅为远程。                             | 使用 `marketplaceSource` 或 `marketplacePath`。|
| `mcp_missing`                | Plugin 已启用，但 MCP 服务器不可用。                    | 检查 Codex Computer Use 和 OS 权限。         |
| `ready`                      | Plugin 和 MCP Tool 可用。                              | 启动 Codex 模式轮次。                         |
| `check_failed`               | 状态检查期间 Codex app-server 请求失败。                | 检查 app-server 连接和日志。                  |
| `auto_install_blocked`       | 轮次启动设置需要添加新来源。                            | 先运行显式安装。                              |

聊天输出包括 Plugin 状态、MCP 服务器状态、Marketplace、可用时的 Tool，以及失败设置步骤的具体消息。

## macOS 权限

Computer Use 是 macOS 特定的。Codex 拥有的 MCP 服务器在检查或控制应用程序之前可能需要本地 OS 权限。如果 OpenClaw 显示 Computer Use 已安装但 MCP 服务器不可用，请先验证 Codex 侧的 Computer Use 设置：

- Codex app-server 正在桌面控制应该发生的同一主机上运行。
- Computer Use Plugin 在 Codex 配置中已启用。
- `computer-use` MCP 服务器出现在 Codex app-server MCP 状态中。
- macOS 已为桌面控制应用授予所需权限。
- 当前主机 Session 可以访问正在控制的桌面。

当 `computerUse.enabled` 为 true 时，OpenClaw 有意关闭失败。Codex 模式轮次不应在没有配置所需原生桌面 Tool 的情况下静默继续。

## 故障排查

**状态显示未安装。** 运行 `/codex computer-use install`。如果未发现 Marketplace，请传递 `--source` 或 `--marketplace-path`。

**状态显示已安装但已禁用。** 再次运行 `/codex computer-use install`。Codex app-server 安装会将 Plugin 配置写回为已启用。

**状态显示不支持远程安装。** 使用本地 Marketplace 来源或路径。仅远程目录条目可以通过当前 app-server API 检查但无法安装。

**状态显示 MCP 服务器不可用。** 重新运行安装一次以重载 MCP 服务器。如果仍不可用，请修复 Codex Computer Use 应用、Codex app-server MCP 状态或 macOS 权限。

**状态或探测在 `computer-use.list_apps` 上超时。** Plugin 和 MCP 服务器存在，但本地 Computer Use 桥接没有响应。退出或重启 Codex Computer Use，如需重新启动 Codex Desktop，然后在新的 OpenClaw Session 中重试。

**Computer Use Tool 显示 `Native hook relay unavailable`。** Codex 原生 Tool Hook 无法通过本地桥接或 Gateway 回退到达活动的 OpenClaw Relay。使用 `/new` 或 `/reset` 启动新的 OpenClaw Session。如果持续发生，请重启 Gateway 以删除旧的 app-server 线程和 Hook 注册，然后重试。

**轮次启动自动安装拒绝来源。** 这是有意的。先使用显式 `/codex computer-use install --source <marketplace-source>` 添加来源，然后未来的轮次启动自动安装才可以使用已发现的本地 Marketplace。

## 相关

- [Codex Harness](/plugins/codex-harness)
- [Peekaboo 桥接](/platforms/mac/peekaboo)
- [iOS 应用](/platforms/ios)
