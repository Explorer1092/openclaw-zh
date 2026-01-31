---
title: "macOS 上的网关生命周期"
sidebarTitle: "网关生命周期"
mmh3_hash: "33b0269acd38538290b3a8b2c1c04b93"
summary: "macOS 上的网关生命周期(launchd)"
read_when: ["将 mac 应用与网关生命周期集成"]
---
# macOS 上的网关生命周期

macOS 应用默认**通过 launchd 管理网关**,不会将网关作为子进程生成。它首先
尝试附加到配置端口上已运行的网关;如果没有可访问的,它通过外部 `openclaw`
CLI 启用 launchd 服务(无嵌入式运行时)。这为你提供了可靠的登录时自动启动
和崩溃时重启。

子进程模式(网关直接由应用生成)今天**未使用**。如果你需要与 UI 更紧密的
耦合,请在终端中手动运行网关。

## 默认行为(launchd)

- 应用安装标记为 `bot.molt.gateway` 的每个用户 LaunchAgent(或使用
  `--profile`/`OPENCLAW_PROFILE` 时为 `bot.molt.<profile>`;支持旧版 `com.openclaw.*`)。
- 启用本地模式时,应用确保加载 LaunchAgent 并在需要时启动网关。
- 日志写入 launchd 网关日志路径(在调试设置中可见)。

常用命令:

```bash
launchctl kickstart -k gui/$UID/bot.molt.gateway
launchctl bootout gui/$UID/bot.molt.gateway
```

运行命名配置文件时,将标签替换为 `bot.molt.<profile>`。

## 未签名的开发构建

`scripts/restart-mac.sh --no-sign` 用于快速本地构建,当你没有签名密钥时。
为了防止 launchd 指向未签名的中继二进制文件,它:

- 写入 `~/.openclaw/disable-launchagent`。

`scripts/restart-mac.sh` 的签名运行在标记存在时清除此覆盖。手动重置:

```bash
rm ~/.openclaw/disable-launchagent
```

## 仅附加模式

要强制 macOS 应用**从不安装或管理 launchd**,使用 `--attach-only`(或
`--no-launchd`)启动它。这会设置 `~/.openclaw/disable-launchagent`,因此
应用只附加到已运行的网关。你可以在调试设置中切换相同的行为。

## 远程模式

远程模式从不启动本地网关。应用使用到远程主机的 SSH 隧道并通过该隧道连接。

## 为什么我们更喜欢 launchd

- 登录时自动启动。
- 内置重启/KeepAlive 语义。
- 可预测的日志和监督。

如果再次需要真正的子进程模式,应将其记录为单独的、明确的仅开发模式。
