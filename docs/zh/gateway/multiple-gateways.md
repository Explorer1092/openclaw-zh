---
mmh3_hash: "27d9f0f0443643d6ae32e3d421e0ee41"
summary: "在一台主机上运行多个 OpenClaw Gateway(隔离、端口和配置文件)"
read_when:
  - 在同一台机器上运行多个 Gateway
  - 您需要每个 Gateway 的隔离配置/状态/端口
title: "多个 Gateway"
---

# 多个 Gateway(同一主机)

大多数设置应使用一个 Gateway，因为单个 Gateway 可以处理多个消息连接和 Agent。如果您需要更强的隔离或冗余（例如救援机器人），请使用隔离的配置文件/端口运行单独的 Gateway。

## 最佳推荐设置

对于大多数用户，最简单的救援机器人设置是：

- 将主机器人保留在默认 profile 上
- 在 `--profile rescue` 上运行救援机器人
- 为救援账户使用完全独立的 Telegram bot
- 将救援机器人保持在不同的基础端口上，例如 `19789`

这使救援机器人与主机器人隔离，以便在主机器人宕机时它可以调试或应用配置更改。在基础端口之间留至少 20 个端口，以便派生的 browser/canvas/CDP 端口永远不会冲突。

## 救援机器人快速入门

将此作为默认路径，除非您有充分理由做其他事情：

```bash
# 救援机器人（独立的 Telegram bot，独立的 profile，端口 19789）
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

如果您的主机器人已经在运行，这通常就是您需要的全部。

在 `openclaw --profile rescue onboard` 期间：

- 使用独立的 Telegram bot token
- 保留 `rescue` profile
- 使用比主机器人至少高 20 的基础端口
- 接受默认的 rescue workspace，除非您已经自己管理了一个

如果 onboarding 已经为您安装了 rescue 服务，则不需要最后的 `gateway install`。

## 为什么这样有效

救援机器人保持独立，因为它有自己的：

- profile/config
- 状态目录
- workspace
- 基础端口（加上派生端口）
- Telegram bot token

对于大多数设置，为 rescue profile 使用完全独立的 Telegram bot：

- 容易保持仅限操作员
- 独立的 bot token 和身份
- 独立于主机器人的 Channel/App 安装
- 当主机器人损坏时基于 DM 的简单恢复路径

## `--profile rescue onboard` 更改了什么

`openclaw --profile rescue onboard` 使用正常的 onboarding 流程，但它将所有内容写入独立的 profile。

实际上，这意味着救援机器人有自己的：

- 配置文件
- 状态目录
- workspace（默认为 `~/.openclaw/workspace-rescue`）
- 托管服务名称

其余提示与正常 onboarding 相同。

## 通用多 Gateway 设置

上述救援机器人布局是最简单的默认设置，但相同的隔离模式适用于同一主机上的任何 Gateway 对或组。

对于更通用的设置，为每个额外的 Gateway 提供其自己命名的 profile 和自己的基础端口：

```bash
# 主（默认 profile）
openclaw setup
openclaw gateway --port 18789

# 额外的 Gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

如果您希望两个 Gateway 都使用命名 profile，这也可以：

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

服务遵循相同的模式：

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

当您想要备用操作员通道时，使用救援机器人快速入门。当您想要多个长期运行的 Gateway 用于不同的 Channel、租户、workspace 或操作角色时，使用通用 profile 模式。

## 隔离清单

每个 Gateway 实例保持这些唯一：

- `OPENCLAW_CONFIG_PATH` — 每个实例的配置文件
- `OPENCLAW_STATE_DIR` — 每个实例的 sessions、凭证、缓存
- `agents.defaults.workspace` — 每个实例的 workspace 根
- `gateway.port`（或 `--port`）— 每个实例唯一
- 派生的 browser/canvas/CDP 端口

如果这些是共享的，您将遇到配置竞争和端口冲突。

## 端口映射（派生）

基础端口 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- browser 控制服务端口 = 基础 + 2（仅回环）
- canvas host 在 Gateway HTTP 服务器上提供服务（与 `gateway.port` 端口相同）
- Browser profile CDP 端口从 `browser.controlPort + 9 .. + 108` 自动分配

如果您在配置或环境中覆盖这些中的任何一个，您必须保持每个实例的唯一性。

## Browser/CDP 注意事项（常见陷阱）

- **不要**将 `browser.cdpUrl` 固定到多个实例的相同值。
- 每个实例需要其自己的 browser 控制端口和 CDP 范围（从其 Gateway 端口派生）。
- 如果您需要明确的 CDP 端口，请按实例设置 `browser.profiles.<name>.cdpPort`。
- 远程 Chrome：使用 `browser.profiles.<name>.cdpUrl`（每个配置文件，每个实例）。

## 手动环境示例

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## 快速检查

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

解释：

- `gateway status --deep` 有助于捕获旧版安装中过期的 launchd/systemd/schtasks 服务。
- `gateway probe` 警告文本，例如 `multiple reachable gateways detected`，仅在您有意运行多个隔离 Gateway 时是预期的。

## 相关

- [Gateway 服务手册](/gateway)
- [Gateway 锁](/gateway/gateway-lock)
- [配置](/gateway/configuration)
