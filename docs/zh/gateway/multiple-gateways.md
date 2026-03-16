---
mmh3_hash: "229be5ff41c6aec7834200572565c61f"
summary: "在一台主机上运行多个 OpenClaw Gateway(隔离、端口和配置文件)"
read_when:
  - 在同一台机器上运行多个 Gateway
  - 您需要每个 Gateway 的隔离配置/状态/端口
title: "多个 Gateway"
---

# 多个 Gateway(同一主机)

大多数设置应使用一个 Gateway,因为单个 Gateway 可以处理多个消息连接和 Agent。如果您需要更强的隔离或冗余(例如救援机器人),请使用隔离的配置文件/端口运行单独的 Gateway。

## 隔离清单(必需)

- `OPENCLAW_CONFIG_PATH` — 每个实例的配置文件
- `OPENCLAW_STATE_DIR` — 每个实例的 sessions、凭证、缓存
- `agents.defaults.workspace` — 每个实例的 workspace 根
- `gateway.port`(或 `--port`) — 每个实例唯一
- 派生端口(browser/canvas)不得重叠

如果这些是共享的,您将遇到配置竞争和端口冲突。

## 推荐:配置文件(`--profile`)

配置文件自动限定 `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` 并为服务名称添加后缀。

```bash
# 主
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# 救援
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

每个配置文件的服务:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## 救援机器人指南

在同一主机上运行第二个 Gateway,具有其自己的:

- 配置文件/配置
- 状态目录
- workspace
- 基础端口(加上派生端口)

这使救援机器人与主机器人隔离,以便它可以在主机器人宕机时调试或应用配置更改。

端口间距:在基础端口之间留至少 20 个端口,以便派生的 Browser/canvas/CDP 端口永远不会冲突。

### 如何安装(救援机器人)

```bash
# 主机器人(现有或全新,不带 --profile 参数)
# 在端口 18789 + Chrome CDC/Canvas/... 端口上运行
openclaw onboard
openclaw gateway install

# 救援机器人(隔离配置文件 + 端口)
openclaw --profile rescue onboard
# 注意:
# - workspace 名称默认会以 -rescue 为后缀
# - 端口应至少为 18789 + 20 个端口,
#   最好选择完全不同的基础端口,例如 19789,
# - 其余的引导与正常相同

# 安装服务(如果在设置过程中没有自动发生)
openclaw --profile rescue gateway install
```

## 端口映射(派生)

基础端口 = `gateway.port`(或 `OPENCLAW_GATEWAY_PORT` / `--port`)。

- browser 控制服务端口 = 基础 + 2(仅回环)
- canvas host 在 Gateway HTTP 服务器上提供服务(与 `gateway.port` 端口相同)
- Browser 配置文件 CDP 端口从 `browser.controlPort + 9 .. + 108` 自动分配

如果您在配置或环境中覆盖这些中的任何一个,您必须保持每个实例的唯一性。

## Browser/CDP 注意事项(常见陷阱)

- **不要**将 `browser.cdpUrl` 固定到多个实例的相同值。
- 每个实例需要其自己的 browser 控制端口和 CDP 范围(从其 Gateway 端口派生)。
- 如果您需要明确的 CDP 端口,请按实例设置 `browser.profiles.<name>.cdpPort`。
- 远程 Chrome:使用 `browser.profiles.<name>.cdpUrl`(每个配置文件,每个实例)。

## 手动环境示例

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## 快速检查

```bash
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```
