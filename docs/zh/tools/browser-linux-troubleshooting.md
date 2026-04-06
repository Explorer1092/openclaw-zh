---
title: "浏览器故障排除 (Linux)"
sidebarTitle: "浏览器故障排除"
mmh3_hash: "de84d7bd1842b3116abb2421a3c60f85"
summary: "修复 Linux 上 OpenClaw 浏览器控制的 Chrome/Brave/Edge/Chromium CDP 启动问题"
read_when: "浏览器控制在 Linux 上失败，特别是使用 snap Chromium"
---

# 浏览器故障排除 (Linux)

## 问题："Failed to start Chrome CDP on port 18800"

OpenClaw 的浏览器控制服务器无法启动 Chrome/Brave/Edge/Chromium，并出现以下错误：

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### 根本原因

在 Ubuntu（及许多 Linux 发行版）上，默认的 Chromium 安装是一个 **snap 包**。Snap 的 AppArmor 限制会干扰 OpenClaw 启动和监控浏览器进程的方式。

`apt install chromium` 命令会安装一个重定向到 snap 的存根包：

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

这不是真正的浏览器——它只是一个包装器。

### 解决方案一：安装 Google Chrome（推荐）

安装官方 Google Chrome `.deb` 包，该包不受 snap 沙盒限制：

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # 如果有依赖错误
```

然后更新你的 OpenClaw 配置（`~/.openclaw/openclaw.json`）：

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### 解决方案二：使用 snap Chromium 的仅附加模式

如果你必须使用 snap Chromium，可以配置 OpenClaw 附加到手动启动的浏览器：

1. 更新配置：

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. 手动启动 Chromium：

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. 可选：创建一个 systemd 用户服务来自动启动 Chrome：

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

启用方法：`systemctl --user enable --now openclaw-browser.service`

### 验证浏览器是否正常工作

检查状态：

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

测试浏览：

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### 配置参考

| 选项                   | 说明                                                          | 默认值                                                     |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | 启用浏览器控制                                               | `true`                                                      |
| `browser.executablePath` | 基于 Chromium 的浏览器二进制文件路径（Chrome/Brave/Edge/Chromium） | 自动检测（有 Chromium 内核时优先使用默认浏览器） |
| `browser.headless`       | 以无界面模式运行                                                      | `false`                                                     |
| `browser.noSandbox`      | 添加 `--no-sandbox` 标志（某些 Linux 环境需要）               | `false`                                                     |
| `browser.attachOnly`     | 不启动浏览器，仅附加到已运行的浏览器                        | `false`                                                     |
| `browser.cdpPort`        | Chrome DevTools Protocol 端口                                        | `18800`                                                     |

### 问题："No Chrome tabs found for profile=\"user\""

你正在使用 `existing-session` / Chrome MCP 配置文件。OpenClaw 可以看到本地 Chrome，但没有可附加的打开标签页。

修复选项：

1. **使用托管浏览器：** `openclaw browser start --browser-profile openclaw`
   （或设置 `browser.defaultProfile: "openclaw"`）。
2. **使用 Chrome MCP：** 确保本地 Chrome 运行时至少有一个打开的标签页，然后用 `--browser-profile user` 重试。

注意事项：

- `user` 仅适用于主机。对于 Linux 服务器、容器或远程主机，优先使用 CDP 配置文件。
- `user` / 其他 `existing-session` 配置文件保持当前 Chrome MCP 限制：基于 ref 的操作、单文件上传 Hook、无对话框超时覆盖、不支持 `wait --load networkidle`，以及不支持 `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl`；仅在远程 CDP 时才需手动设置。
- 远程 CDP 配置文件支持 `http://`、`https://`、`ws://` 和 `wss://`。使用 HTTP(S) 进行 `/json/version` 发现，或在浏览器服务提供直接 DevTools Socket URL 时使用 WS(S)。
