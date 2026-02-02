---
title: "OpenClaw macOS 配套应用 (菜单栏 + 网关代理)"
sidebarTitle: "macOS 配套应用"
mmh3_hash: "2438eef405490d5739cc0d1964e68bcc"
summary: "OpenClaw macOS 配套应用(菜单栏 + 网关代理)"
read_when: ["实现 macOS 应用功能","在 macOS 上更改网关生命周期或节点桥接"]
---
# OpenClaw macOS 配套应用 (菜单栏 + 网关代理)

macOS 应用是 OpenClaw 的**菜单栏配套应用**。它拥有权限,在本地管理/附加到
网关(launchd 或手动),并将 macOS 功能作为节点公开给代理。

## 它的作用

- 在菜单栏中显示原生通知和状态。
- 拥有 TCC 提示(通知、辅助功能、屏幕录制、麦克风、语音识别、自动化/AppleScript)。
- 运行或连接到网关(本地或远程)。
- 公开仅限 macOS 的工具(Canvas、相机、屏幕录制、`system.run`)。
- 在**远程**模式下启动本地节点主机服务(launchd),并在**本地**模式下停止它。
- 可选地托管 **PeekabooBridge** 用于 UI 自动化。
- 根据请求通过 npm/pnpm 安装全局 CLI(`openclaw`)(不推荐 bun 用于网关运行时)。

## 本地 vs 远程模式

- **本地**(默认):如果存在正在运行的本地网关,应用会附加到它;否则它通过
  `openclaw gateway install` 启用 launchd 服务。
- **远程**:应用通过 SSH/Tailscale 连接到网关,从不启动本地进程。
  应用启动本地**节点主机服务**,以便远程网关可以访问此 Mac。
应用不会将网关作为子进程生成。

## Launchd 控制

应用管理标记为 `bot.molt.gateway` 的每个用户 LaunchAgent
(或使用 `--profile`/`OPENCLAW_PROFILE` 时为 `bot.molt.<profile>`;
旧版 `com.openclaw.*` 仍会卸载)。

```bash
launchctl kickstart -k gui/$UID/bot.molt.gateway
launchctl bootout gui/$UID/bot.molt.gateway
```

运行命名配置文件时,将标签替换为 `bot.molt.<profile>`。

如果未安装 LaunchAgent,从应用启用它或运行 `openclaw gateway install`。

## 节点功能(mac)

macOS 应用将自己呈现为节点。常用命令:

- Canvas:`canvas.present`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`
- 相机:`camera.snap`、`camera.clip`
- 屏幕:`screen.record`
- 系统:`system.run`、`system.notify`

节点报告 `permissions` 映射,以便代理可以决定允许什么。

节点服务 + 应用 IPC:
- 当无头节点主机服务运行时(远程模式),它作为节点连接到网关 WS。
- `system.run` 在 macOS 应用(UI/TCC 上下文)中通过本地 Unix 套接字执行;
  提示 + 输出保留在应用内。

图表(SCI):
```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## 执行批准(system.run)

`system.run` 由 macOS 应用中的**执行批准**(设置 → Exec approvals)控制。
安全性 + 询问 + 允许列表在 Mac 上本地存储在:

```
~/.openclaw/exec-approvals.json
```

示例:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [
        { "pattern": "/opt/homebrew/bin/rg" }
      ]
    }
  }
}
```

注意:
- `allowlist` 条目是已解析二进制路径的 glob 模式。
- 在提示中选择"Always Allow"会将该命令添加到允许列表。
- `system.run` 环境覆盖会被过滤(删除 `PATH`、`DYLD_*`、`LD_*`、
  `NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`),然后与应用的环境合并。

## 深度链接

应用注册 `openclaw://` URL 方案用于本地操作。

### `openclaw://agent`

触发网关 `agent` 请求。

```bash
open 'openclaw://agent?message=Hello%20from%20deep%20link'
```

查询参数:
- `message`(必需)
- `sessionKey`(可选)
- `thinking`(可选)
- `deliver` / `to` / `channel`(可选)
- `timeoutSeconds`(可选)
- `key`(可选的无人值守模式密钥)

安全性:
- 没有 `key`,应用会提示确认。
- 使用有效的 `key`,运行是无人值守的(用于个人自动化)。

## 入门流程(典型)

1) 安装并启动 **OpenClaw.app**。
2) 完成权限清单(TCC 提示)。
3) 确保 **Local** 模式处于活动状态且网关正在运行。
4) 如果你想要终端访问,安装 CLI。

## 构建和开发工作流程(原生)

- `cd apps/macos && swift build`
- `swift run OpenClaw`(或 Xcode)
- 打包应用:`scripts/package-mac-app.sh`

## 调试网关连接(macOS CLI)

使用调试 CLI 来执行 macOS 应用使用的相同网关 WebSocket 握手和发现逻辑,
而无需启动应用。

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

连接选项:
- `--url <ws://host:port>`:覆盖配置
- `--mode <local|remote>`:从配置解析(默认:config 或 local)
- `--probe`:强制进行新的健康探测
- `--timeout <ms>`:请求超时(默认:`15000`)
- `--json`:用于比较的结构化输出

发现选项:
- `--include-local`:包括将被过滤为"local"的网关
- `--timeout <ms>`:整体发现窗口(默认:`2000`)
- `--json`:用于比较的结构化输出

提示:与 `openclaw gateway discover --json` 比较,以查看 macOS 应用的
发现管道(NWBrowser + tailnet DNS-SD 回退)是否与 Node CLI 的基于
`dns-sd` 的发现不同。

## 远程连接管道(SSH 隧道)

当 macOS 应用在 **Remote** 模式下运行时,它会打开 SSH 隧道,以便本地 UI
组件可以与远程网关通信,就好像它在 localhost 上一样。

### 控制隧道(网关 WebSocket 端口)
- **目的:** 健康检查、状态、Web 聊天、配置和其他控制平面调用。
- **本地端口:** 网关端口(默认 `18789`),始终稳定。
- **远程端口:** 远程主机上的相同网关端口。
- **行为:** 没有随机本地端口;应用重用现有的健康隧道,或在需要时重启它。
- **SSH 形状:** `ssh -N -L <local>:127.0.0.1:<remote>` 带 BatchMode +
  ExitOnForwardFailure + keepalive 选项。
- **IP 报告:** SSH 隧道使用环回,因此网关将节点 IP 视为 `127.0.0.1`。
  如果你希望显示真实的客户端 IP,请使用 **Direct (ws/wss)** 传输
  (参见 [macOS 远程访问](/platforms/mac/remote))。

有关设置步骤,请参阅 [macOS 远程访问](/platforms/mac/remote)。有关协议详细信息,
请参阅[网关协议](/gateway/protocol)。

## 相关文档

- [网关运行手册](/gateway)
- [网关(macOS)](/platforms/mac/bundled-gateway)
- [macOS 权限](/platforms/mac/permissions)
- [Canvas](/platforms/mac/canvas)
