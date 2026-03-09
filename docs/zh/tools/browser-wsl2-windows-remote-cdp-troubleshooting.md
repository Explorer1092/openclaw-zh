---
mmh3_hash: "3b991e257112b45a4f663bfa30d0e2da"
summary: "分层排查 WSL2 Gateway + Windows Chrome 远程 CDP 和扩展中继设置"
read_when:
  - 在 WSL2 中运行 OpenClaw Gateway 而 Chrome 在 Windows 上
  - 在 WSL2 和 Windows 上看到重叠的浏览器/control-ui 错误
  - 在分离主机设置中决定使用原始远程 CDP 还是 Chrome 扩展中继
title: "WSL2 + Windows + 远程 Chrome CDP 故障排查"
---

# WSL2 + Windows + 远程 Chrome CDP 故障排查

本指南涵盖常见的分离主机设置，其中：

- OpenClaw Gateway 在 WSL2 内运行
- Chrome 在 Windows 上运行
- 浏览器控制必须跨越 WSL2/Windows 边界

同时涵盖 [issue #39369](https://github.com/openclaw/openclaw/issues/39369) 中的分层故障模式：多个独立问题可能同时出现，这会使错误的层看起来像是最先出现问题的地方。

## 首先选择正确的浏览器模式

您有两种有效的模式：

### 选项 1：原始远程 CDP

使用远程浏览器 Profile，从 WSL2 指向 Windows Chrome CDP 端点。

在以下情况下选择此选项：

- 您只需要浏览器控制
- 您愿意将 Chrome 远程调试暴露给 WSL2
- 您不需要 Chrome 扩展中继

### 选项 2：Chrome 扩展中继

使用内置 `chrome` Profile 加上 OpenClaw Chrome 扩展。

在以下情况下选择此选项：

- 您想通过工具栏按钮附加到现有的 Windows Chrome 标签页
- 您想要基于扩展的控制，而不是原始的 `--remote-debugging-port`
- 中继本身必须跨越 WSL2/Windows 边界可达

如果您跨命名空间使用扩展中继，`browser.relayBindHost` 是在 [Browser](/tools/browser) 和 [Chrome extension](/tools/chrome-extension) 中介绍的重要设置。

## 工作架构

参考形状：

- WSL2 在 `127.0.0.1:18789` 上运行 Gateway
- Windows 在普通浏览器中访问 Control UI，地址为 `http://127.0.0.1:18789/`
- Windows Chrome 在端口 `9222` 上暴露 CDP 端点
- WSL2 可以访问该 Windows CDP 端点
- OpenClaw 将浏览器 Profile 指向从 WSL2 可达的地址

## 为什么这个设置令人困惑

多种故障可能重叠：

- WSL2 无法访问 Windows CDP 端点
- Control UI 从非安全源打开
- `gateway.controlUi.allowedOrigins` 与页面源不匹配
- 缺少 Token 或配对
- 浏览器 Profile 指向错误的地址
- 您实际需要跨命名空间访问时，扩展中继仍然只绑定到本地回环

因此，修复一层问题后，仍然可能看到不同的错误。

## Control UI 的关键规则

当从 Windows 打开 UI 时，除非您有刻意的 HTTPS 设置，否则使用 Windows localhost。

使用：

`http://127.0.0.1:18789/`

不要将 LAN IP 作为 Control UI 的默认地址。HTTP 在 LAN 或 tailnet 地址上可能触发与 CDP 本身无关的不安全源/设备认证行为。参见 [Control UI](/web/control-ui)。

## 分层验证

从上到下逐层验证，不要跳跃。

### 第 1 层：验证 Chrome 在 Windows 上提供 CDP

在 Windows 上启用远程调试启动 Chrome：

```powershell
chrome.exe --remote-debugging-port=9222
```

从 Windows 先验证 Chrome 本身：

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

如果这在 Windows 上失败，OpenClaw 还不是问题所在。

### 第 2 层：验证 WSL2 可以访问该 Windows 端点

从 WSL2 测试您计划在 `cdpUrl` 中使用的确切地址：

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

好的结果：

- `/json/version` 返回包含 Browser / Protocol-Version 元数据的 JSON
- `/json/list` 返回 JSON（如果没有打开页面，空数组也可以）

如果失败：

- Windows 尚未将端口暴露给 WSL2
- WSL2 端使用的地址不正确
- 防火墙 / 端口转发 / 本地代理仍然缺失

在修改 OpenClaw 配置之前先解决这个问题。

### 第 3 层：配置正确的浏览器 Profile

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

说明：

- 使用 WSL2 可达的地址，而不是仅在 Windows 上有效的地址
- 对于外部管理的浏览器保持 `attachOnly: true`
- 在期望 OpenClaw 成功之前，先用 `curl` 测试相同的 URL

### 第 4 层：如果使用 Chrome 扩展中继

如果浏览器机器和 Gateway 被命名空间边界分隔，中继可能需要非本地回环绑定地址。

示例：

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "chrome",
    relayBindHost: "0.0.0.0",
  },
}
```

仅在需要时使用：

- 默认行为更安全，因为中继保持仅本地回环
- `0.0.0.0` 扩大了暴露面
- 保持 Gateway 认证、Node 配对和周围网络的私密性

如果您不需要扩展中继，优先使用上面的原始远程 CDP Profile。

### 第 5 层：单独验证 Control UI 层

从 Windows 打开 UI：

`http://127.0.0.1:18789/`

然后验证：

- 页面源与 `gateway.controlUi.allowedOrigins` 期望的内容匹配
- Token 认证或配对配置正确
- 您不是在把 Control UI 认证问题当作浏览器问题来调试

有用的页面：

- [Control UI](/web/control-ui)

### 第 6 层：验证端到端浏览器控制

从 WSL2：

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

对于扩展中继：

```bash
openclaw browser tabs --browser-profile chrome
```

好的结果：

- 标签页在 Windows Chrome 中打开
- `openclaw browser tabs` 返回目标
- 后续操作（`snapshot`、`screenshot`、`navigate`）从同一 Profile 正常工作

## 常见误导性错误

将每条消息视为层级特定的线索：

- `control-ui-insecure-auth`
  - UI 源 / 安全上下文问题，而非 CDP 传输问题
- `token_missing`
  - 认证配置问题
- `pairing required`
  - 设备审批问题
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 无法访问配置的 `cdpUrl`
- `gateway timeout after 1500ms`
  - 通常仍然是 CDP 可达性问题或缓慢/不可达的远程端点
- `Chrome extension relay is running, but no tab is connected`
  - 选择了扩展中继 Profile，但尚无附加的标签页

## 快速排查清单

1. Windows：`curl http://127.0.0.1:9222/json/version` 是否工作？
2. WSL2：`curl http://WINDOWS_HOST_OR_IP:9222/json/version` 是否工作？
3. OpenClaw 配置：`browser.profiles.<name>.cdpUrl` 是否使用该 WSL2 可达地址？
4. Control UI：您是否打开了 `http://127.0.0.1:18789/` 而不是 LAN IP？
5. 仅扩展中继：您是否真的需要 `browser.relayBindHost`，如果需要，是否已明确设置？

## 实践要点

这个设置通常是可行的。困难在于浏览器传输、Control UI 源安全性、Token/配对和扩展中继拓扑可能各自独立失败，但从用户角度看起来类似。

如有疑问：

- 首先在本地验证 Windows Chrome 端点
- 其次从 WSL2 验证相同端点
- 只有在那之后再调试 OpenClaw 配置或 Control UI 认证
