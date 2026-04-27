---
mmh3_hash: "b020c9dd0ca10af92690d2907c97b62d"
summary: "通过外部 openclaw-weixin 插件设置 WeChat Channel"
read_when:
  - 您想将 OpenClaw 连接到 WeChat 或微信
  - 您正在安装或排查 openclaw-weixin Channel 插件问题
  - 您需要了解外部 Channel 插件如何在 Gateway 旁边运行
title: "WeChat"
---

OpenClaw 通过腾讯的外部 `@tencent-weixin/openclaw-weixin` Channel 插件连接到 WeChat。

状态：外部插件。支持私聊和媒体。当前插件功能元数据未公开群聊支持。

## 命名说明

- **WeChat** 是本文档中使用的用户侧名称。
- **Weixin** 是腾讯软件包和插件 ID 使用的名称。
- `openclaw-weixin` 是 OpenClaw Channel ID。
- `@tencent-weixin/openclaw-weixin` 是 npm 包名。

在 CLI 命令和配置路径中使用 `openclaw-weixin`。

## 工作原理

WeChat 代码不存在于 OpenClaw 核心仓库中。OpenClaw 提供通用的 Channel 插件契约，而外部插件提供 WeChat 特定的运行时：

1. `openclaw plugins install` 安装 `@tencent-weixin/openclaw-weixin`。
2. Gateway 发现插件清单并加载插件入口点。
3. 插件注册 Channel ID `openclaw-weixin`。
4. `openclaw channels login --channel openclaw-weixin` 启动二维码登录。
5. 插件将账户凭据存储在 OpenClaw 状态目录下。
6. 当 Gateway 启动时，插件为每个已配置的账户启动其微信监控器。
7. 入站 WeChat 消息通过 Channel 契约规范化，路由到选定的 OpenClaw Agent，然后通过插件出站路径发回。

这种分离很重要：OpenClaw 核心应保持 Channel 无关性。WeChat 登录、腾讯 iLink API 调用、媒体上传/下载、上下文令牌和账户监控由外部插件负责。

## 安装

快速安装：

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

手动安装：

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

安装后重启 Gateway：

```bash
openclaw gateway restart
```

## 登录

在运行 Gateway 的同一台机器上运行二维码登录：

```bash
openclaw channels login --channel openclaw-weixin
```

在手机上用 WeChat 扫描二维码并确认登录。成功扫描后，插件会在本地保存账户令牌。

如需添加另一个 WeChat 账户，再次运行相同的登录命令。对于多账户，按账户、Channel 和发送者隔离私聊会话：

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## 访问控制

私聊使用 Channel 插件的标准 OpenClaw 配对和 allowlist 模型。

批准新发送者：

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

完整访问控制模型，参见 [Pairing](/channels/pairing)。

## 兼容性

插件在启动时检查宿主 OpenClaw 版本。

| 插件版本线 | OpenClaw 版本           | npm 标签 |
| ---------- | ----------------------- | -------- |
| `2.x`      | `>=2026.3.22`           | `latest` |
| `1.x`      | `>=2026.1.0 <2026.3.22` | `legacy` |

如果插件报告您的 OpenClaw 版本过旧，请升级 OpenClaw 或安装旧版插件版本：

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Sidecar 进程

WeChat 插件在监控腾讯 iLink API 时可以在 Gateway 旁边运行辅助工作。在 issue #68451 中，该辅助路径暴露了 OpenClaw 通用过期 Gateway 清理中的一个错误：子进程可能会尝试清理父 Gateway 进程，在 systemd 等进程管理器下导致重启循环。

当前 OpenClaw 启动清理排除当前进程及其祖先进程，因此 Channel 辅助进程不得终止启动它的 Gateway。此修复是通用的；它不是核心中 WeChat 特定的路径。

## 故障排除

检查安装和状态：

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

如果 Channel 显示已安装但无法连接，确认插件已启用并重启：

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

如果启用 WeChat 后 Gateway 反复重启，同时更新 OpenClaw 和插件：

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

临时禁用：

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## 相关文档

- Channel 概述：[聊天频道](/channels)
- 配对：[Pairing](/channels/pairing)
- Channel 路由：[Channel Routing](/channels/channel-routing)
- 插件架构：[Plugin Architecture](/plugins/architecture)
- Channel 插件 SDK：[Channel Plugin SDK](/plugins/sdk-channel-plugins)
- 外部包：[@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
