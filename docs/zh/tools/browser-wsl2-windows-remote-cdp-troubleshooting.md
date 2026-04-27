---
mmh3_hash: "3d723caa2fece16f6b553574bae18b84"
summary: "分层排查 WSL2 Gateway + Windows Chrome 远程 CDP"
read_when:
  - 在 WSL2 中运行 OpenClaw Gateway 而 Chrome 在 Windows 上
  - 在 WSL2 和 Windows 之间看到重叠的浏览器/控制 UI 错误
  - 在分体主机设置中决策宿主本地 Chrome MCP 与原始远程 CDP
title: "WSL2 + Windows + 远程 Chrome CDP 故障排除"
---

在常见的分体主机设置中，OpenClaw Gateway 在 WSL2 内运行，Chrome 在 Windows 上运行，浏览器控制必须跨越 WSL2/Windows 边界。来自 [issue #39369](https://github.com/openclaw/openclaw/issues/39369) 的分层失败模式意味着多个独立问题可能同时出现，这会让错误的层看起来首先出现故障。

## 首先选择正确的浏览器模式

你有两种有效方案：

### 方案一：从 WSL2 到 Windows 的原始远程 CDP

使用指向 Windows Chrome CDP 端点的远程浏览器配置文件（从 WSL2 发起）。

适用场景：

- Gateway 保持在 WSL2 内
- Chrome 在 Windows 上运行
- 浏览器控制需要跨越 WSL2/Windows 边界

### 方案二：宿主本地 Chrome MCP

仅在 Gateway 本身与 Chrome 在同一主机上运行时使用 `existing-session` / `user`。

适用场景：

- OpenClaw 和 Chrome 在同一台机器上
- 需要使用本地已登录的浏览器状态
- 不需要跨主机浏览器传输

对于 WSL2 Gateway + Windows Chrome，优先使用原始远程 CDP。Chrome MCP 是宿主本地的，不是 WSL2 到 Windows 的桥接。

## 工作架构

参考结构：

- WSL2 在 `127.0.0.1:18789` 运行 Gateway
- Windows 在普通浏览器中通过 `http://127.0.0.1:18789/` 打开 Control UI
- Windows Chrome 在端口 `9222` 暴露 CDP 端点
- WSL2 可以访问该 Windows CDP 端点
- OpenClaw 将浏览器配置文件指向从 WSL2 可达的地址

## 为何此设置容易混淆

多个失败可能重叠：

- WSL2 无法访问 Windows CDP 端点
- Control UI 从非安全来源打开
- `gateway.controlUi.allowedOrigins` 与页面来源不匹配
- token 或配对缺失
- 浏览器配置文件指向错误地址

因此，修复一层仍可能看到另一层的错误。

## Control UI 的关键规则

当 UI 从 Windows 打开时，除非你有刻意的 HTTPS 设置，否则使用 Windows localhost。

使用：

`http://127.0.0.1:18789/`

不要默认使用局域网 IP 作为 Control UI 地址。在局域网或 tailnet 地址上使用普通 HTTP 可能触发与 CDP 本身无关的不安全来源/设备认证行为。参阅 [Control UI](/web/control-ui)。

## 分层验证

从上到下逐层操作。不要跳过。

### 第一层：验证 Chrome 在 Windows 上提供 CDP 服务

在 Windows 上启动带远程调试的 Chrome：

```powershell
chrome.exe --remote-debugging-port=9222
```

先在 Windows 上验证 Chrome 本身：

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

如果在 Windows 上失败，OpenClaw 还不是问题所在。

### 第二层：验证 WSL2 可以访问该 Windows 端点

从 WSL2，测试你计划在 `cdpUrl` 中使用的确切地址：

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

正确结果：

- `/json/version` 返回包含 Browser / Protocol-Version 元数据的 JSON
- `/json/list` 返回 JSON（若没有打开页面，空数组也可以）

如果失败：

- Windows 尚未将端口暴露给 WSL2
- WSL2 侧的地址不正确
- 防火墙/端口转发/本地代理仍缺失

在修改 OpenClaw 配置之前先解决此问题。

### 第三层：配置正确的浏览器配置文件

对于原始远程 CDP，将 OpenClaw 指向从 WSL2 可达的地址：

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

注意事项：

- 使用 WSL2 可达的地址，而非仅在 Windows 上有效的地址
- 对外部管理的浏览器保持 `attachOnly: true`
- `cdpUrl` 可以是 `http://`、`https://`、`ws://` 或 `wss://`
- 需要 OpenClaw 发现 `/json/version` 时使用 HTTP(S)
- 仅在浏览器提供商给你直接 DevTools Socket URL 时使用 WS(S)
- 在期望 OpenClaw 成功之前，用 `curl` 测试相同的 URL

### 第四层：单独验证 Control UI 层

从 Windows 打开 UI：

`http://127.0.0.1:18789/`

然后验证：

- 页面来源与 `gateway.controlUi.allowedOrigins` 预期匹配
- token 认证或配对配置正确
- 你没有将 Control UI 认证问题当作浏览器问题来调试

参考页面：

- [Control UI](/web/control-ui)

### 第五层：验证端到端浏览器控制

从 WSL2：

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

正确结果：

- 标签页在 Windows Chrome 中打开
- `openclaw browser tabs` 返回目标
- 后续操作（`snapshot`、`screenshot`、`navigate`）从同一配置文件正常工作

## 常见的误导性错误

将每条消息视为特定层的线索：

- `control-ui-insecure-auth`
  - UI 来源/安全上下文问题，而非 CDP 传输问题
- `token_missing`
  - 认证配置问题
- `pairing required`
  - 设备批准问题
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 无法访问配置的 `cdpUrl`
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP 端点有响应，但 DevTools WebSocket 仍无法打开
- stale viewport / dark-mode / locale / offline overrides after a remote session
  - 运行 `openclaw browser stop --browser-profile remote`
  - 这会关闭活动控制 Session 并释放 Playwright/CDP 模拟状态，而不重启 Gateway 或外部浏览器
- `gateway timeout after 1500ms`
  - 通常仍是 CDP 可达性或慢速/不可达的远程端点
- `No Chrome tabs found for profile="user"`
  - 在无宿主本地标签页可用的地方选择了本地 Chrome MCP 配置文件

## 快速排查清单

1. Windows：`curl http://127.0.0.1:9222/json/version` 是否正常？
2. WSL2：`curl http://WINDOWS_HOST_OR_IP:9222/json/version` 是否正常？
3. OpenClaw 配置：`browser.profiles.<name>.cdpUrl` 是否使用了 WSL2 可达的确切地址？
4. Control UI：你是否打开的是 `http://127.0.0.1:18789/` 而非局域网 IP？
5. 你是否在尝试跨 WSL2 和 Windows 使用 `existing-session`，而非原始远程 CDP？

## 实践建议

这种设置通常是可行的。难点在于浏览器传输、Control UI 来源安全性以及 token/配对这三个方面可以各自独立失败，但从用户角度看起来相似。

如有疑问：

- 先在本地验证 Windows Chrome 端点
- 再从 WSL2 验证同一端点
- 之后才调试 OpenClaw 配置或 Control UI 认证

## 相关

- [浏览器](/tools/browser)
- [浏览器登录](/tools/browser-login)
- [浏览器 Linux 故障排除](/tools/browser-linux-troubleshooting)
