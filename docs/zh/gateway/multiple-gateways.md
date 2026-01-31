---
title: "多个网关 (同一主机)"
sidebarTitle: "多个网关"
mmh3_hash: "c8c346e1b8dfd06f28c944d471c2be1e"
summary: "在一台主机上运行多个 OpenClaw Gateways(隔离、端口和配置文件)"
read_when:
  - 在同一台机器上运行多个 Gateway
  - 您需要每个 Gateway 的隔离配置/状态/端口
---
# 多个网关 (同一主机)

大多数设置应使用一个 Gateway,因为单个 Gateway 可以处理多个消息连接和 agents。如果您需要更强的隔离或冗余(例如,rescue bot),请使用隔离的配置文件/端口运行单独的 Gateways。

## 隔离清单(必需)
- `OPENCLAW_CONFIG_PATH` — 每个实例的配置文件
- `OPENCLAW_STATE_DIR` — 每个实例的 sessions、creds、caches
- `agents.defaults.workspace` — 每个实例的 workspace 根目录
- `gateway.port`(或 `--port`) — 每个实例唯一
- 派生端口(browser/canvas)不得重叠

如果这些是共享的,您将遇到配置竞争和端口冲突。

## 推荐:profiles(`--profile`)

Profiles 自动限定 `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` 的作用域并为服务名称添加后缀。

```bash
# main
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

每个配置文件的服务:
```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## Rescue-bot 指南

在同一主机上运行第二个 Gateway,具有自己的:
- profile/config
- state dir
- workspace
- 基础端口(加派生端口)

这使 rescue bot 与 main bot 隔离,以便在主 bot 宕机时可以调试或应用配置更改。

端口间距:在基础端口之间至少留出 20 个端口,以便派生的 browser/canvas/CDP 端口永远不会冲突。

### 如何安装(rescue bot)

```bash
# Main bot(现有或新的,无 --profile 参数)
# 在端口 18789 + Chrome CDC/Canvas/... Ports 上运行
openclaw onboard
openclaw gateway install

# Rescue bot(隔离的 profile + 端口)
openclaw --profile rescue onboard
# 注意:
# - workspace 名称默认情况下会带有 -rescue 后缀
# - 端口应至少为 18789 + 20 Ports,
#   最好选择完全不同的基础端口,如 19789,
# - onboarding 的其余部分与正常情况相同

# 要安装服务(如果在 onboarding 期间没有自动发生)
openclaw --profile rescue gateway install
```

## 端口映射(派生)

基础端口 = `gateway.port`(或 `OPENCLAW_GATEWAY_PORT` / `--port`)。

- browser control service port = base + 2(仅 loopback)
- `canvasHost.port = base + 4`
- Browser profile CDP 端口从 `browser.controlPort + 9 .. + 108` 自动分配

如果您在配置或 env 中覆盖其中任何一个,则必须保持每个实例唯一。

## Browser/CDP 注意事项(常见陷阱)

- **不要**在多个实例上将 `browser.cdpUrl` 固定为相同的值。
- 每个实例需要自己的 browser control 端口和 CDP 范围(从其 gateway 端口派生)。
- 如果您需要显式 CDP 端口,请为每个实例设置 `browser.profiles.<name>.cdpPort`。
- 远程 Chrome:使用 `browser.profiles.<name>.cdpUrl`(每个配置文件,每个实例)。

## 手动 env 示例

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
