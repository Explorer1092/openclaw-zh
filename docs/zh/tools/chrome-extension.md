---
mmh3_hash: "1bbc60900a940f3b36a5624100183669"
summary: "Chrome 扩展: 让 OpenClaw 驱动您现有的 Chrome 标签页"
read_when:
  - 您希望 agent 驱动现有的 Chrome 标签页(工具栏按钮)
  - 您需要通过 Tailscale 进行远程网关 + 本地浏览器自动化
  - 您想了解浏览器接管的安全影响
---

# Chrome 扩展(浏览器中继)

OpenClaw Chrome 扩展让 agent 控制您的**现有 Chrome 标签页**(您的正常 Chrome 窗口),而不是启动单独的 openclaw 管理的 Chrome 配置文件。

附加/分离通过**单个 Chrome 工具栏按钮**进行。

## 它是什么(概念)

有三个部分:
- **浏览器控制服务**(网关或节点): agent/工具调用的 API(通过网关)
- **本地中继服务器**(本地回环 CDP): 在控制服务器和扩展之间桥接(默认为 `http://127.0.0.1:18792`)
- **Chrome MV3 扩展**: 使用 `chrome.debugger` 附加到活动标签页并将 CDP 消息管道传输到中继

然后 OpenClaw 通过正常的 `browser` 工具表面(选择正确的配置文件)控制附加的标签页。

## 安装/加载(未打包)

1) 将扩展安装到稳定的本地路径:

```bash
openclaw browser extension install
```

2) 打印已安装的扩展目录路径:

```bash
openclaw browser extension path
```

3) Chrome → `chrome://extensions`
- 启用"开发者模式"
- "加载已解压的扩展程序" → 选择上面打印的目录

4) 固定扩展。

## 更新(无构建步骤)

扩展作为静态文件包含在 OpenClaw 发布版本(npm 包)中。没有单独的"构建"步骤。

升级 OpenClaw 后:
- 重新运行 `openclaw browser extension install` 以刷新 OpenClaw 状态目录下的已安装文件。
- Chrome → `chrome://extensions` → 在扩展上点击"重新加载"。

## 使用它(无需额外配置)

OpenClaw 附带一个名为 `chrome` 的内置浏览器配置文件,该配置文件定位到默认端口上的扩展中继。

使用它:
- CLI: `openclaw browser --browser-profile chrome tabs`
- Agent 工具: 使用 `profile="chrome"` 的 `browser`

如果您想要不同的名称或不同的中继端口,创建您自己的配置文件:

```bash
openclaw browser create-profile \
  --name my-chrome \
  --driver extension \
  --cdp-url http://127.0.0.1:18792 \
  --color "#00AA00"
```

## 附加/分离(工具栏按钮)

- 打开您想要 OpenClaw 控制的标签页。
- 点击扩展图标。
  - 附加时徽章显示 `ON`。
- 再次点击以分离。

## 它控制哪个标签页?

- 它**不会**自动控制"您正在查看的任何标签页"。
- 它**仅**控制您通过点击工具栏按钮**明确附加**的标签页。
- 要切换: 打开其他标签页并在那里点击扩展图标。

## 徽章 + 常见错误

- `ON`: 已附加;OpenClaw 可以驱动该标签页。
- `…`: 正在连接到本地中继。
- `!`: 中继无法访问(最常见: 浏览器中继服务器未在此机器上运行)。

如果您看到 `!`:
- 确保网关在本地运行(默认设置),或者如果网关在其他地方运行,在此机器上运行节点主机。
- 打开扩展选项页面;它显示中继是否可访问。

## 远程网关(使用节点主机)

### 本地网关(与 Chrome 相同的机器) — 通常**无需额外步骤**

如果网关与 Chrome 在同一台机器上运行,它会在本地回环上启动浏览器控制服务并自动启动中继服务器。扩展与本地中继通信; CLI/工具调用发送到网关。

### 远程网关(网关在其他地方运行) — **运行节点主机**

如果您的网关在另一台机器上运行,在运行 Chrome 的机器上启动节点主机。网关将把浏览器操作代理到该节点;扩展 + 中继保持在浏览器机器本地。

如果连接了多个节点,使用 `gateway.nodes.browser.node` 固定一个或设置 `gateway.nodes.browser.mode`。

## 沙箱(工具容器)

如果您的 agent 会话被沙箱化(`agents.defaults.sandbox.mode != "off"`),`browser` 工具可能受到限制:

- 默认情况下,沙箱会话通常定位到**沙箱浏览器**(`target="sandbox"`),而不是您的主机 Chrome。
- Chrome 扩展中继接管需要控制**主机**浏览器控制服务器。

选项:
- 最简单: 从**非沙箱**会话/agent 使用扩展。
- 或允许沙箱会话的主机浏览器控制:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        browser: {
          allowHostControl: true
        }
      }
    }
  }
}
```

然后确保工具策略未拒绝该工具,并且(如果需要)使用 `target="host"` 调用 `browser`。

调试: `openclaw sandbox explain`

## 远程访问提示

- 将网关和节点主机保持在同一 tailnet 上;避免将中继端口暴露给局域网或公共互联网。
- 有意配对节点;如果您不想远程控制,禁用浏览器代理路由(`gateway.nodes.browser.mode="off"`)。

## "扩展路径"的工作原理

`openclaw browser extension path` 打印包含扩展文件的**已安装**磁盘目录。

CLI 有意**不**打印 `node_modules` 路径。始终先运行 `openclaw browser extension install` 将扩展复制到 OpenClaw 状态目录下的稳定位置。

如果您移动或删除该安装目录,Chrome 将把扩展标记为损坏,直到您从有效路径重新加载它。

## 安全影响(阅读此内容)

这很强大且有风险。将其视为给模型"在您的浏览器上动手"。

- 扩展使用 Chrome 的调试器 API(`chrome.debugger`)。附加时,模型可以:
  - 在该标签页中点击/输入/导航
  - 读取页面内容
  - 访问标签页的已登录会话可以访问的任何内容
- **这不像**专用的 openclaw 管理配置文件那样隔离。
  - 如果您附加到您的日常驱动配置文件/标签页,您就授予了对该账户状态的访问权限。

建议:
- 优先使用专用的 Chrome 配置文件(与您的个人浏览分开)进行扩展中继使用。
- 将网关和任何节点主机仅保持在 tailnet 上;依赖网关认证 + 节点配对。
- 避免通过局域网(`0.0.0.0`)暴露中继端口并避免 Funnel(公共)。

相关:
- 浏览器工具概述: [浏览器](/tools/browser)
- 安全审计: [安全](/gateway/security)
- Tailscale 设置: [Tailscale](/gateway/tailscale)

<!-- i18n-hash:b747ba4b40362b0fc218d1ff607bce95 -->
