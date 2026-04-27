---
title: "浏览器登录与 X/Twitter 发帖"
sidebarTitle: "浏览器登录"
mmh3_hash: "60862a39a3a451887d7379dc43122187"
summary: "浏览器自动化 + X/Twitter 发帖的手动登录"
read_when:
  - 需要登录网站以进行浏览器自动化
  - 想要发布更新到 X/Twitter
---

## 手动登录（推荐）

当网站需要登录时，**在宿主**浏览器配置文件（openclaw 浏览器）中**手动登录**。

**不要**将你的凭据提供给模型。自动登录通常会触发反机器人防御，可能导致账号被锁定。

返回浏览器主文档：[Browser](/tools/browser)。

## 使用的是哪个 Chrome 配置文件？

OpenClaw 控制一个**专用 Chrome 配置文件**（名为 `openclaw`，带橙色调 UI）。这与你日常使用的浏览器配置文件是分开的。

对于 Agent 浏览器工具调用：

- 默认选择：Agent 应使用其隔离的 `openclaw` 浏览器。
- 仅在现有已登录 Session 重要且用户在电脑旁可以点击/批准任何附加提示时，才使用 `profile="user"`。
- 如果你有多个用户浏览器配置文件，请显式指定配置文件而非猜测。

两种简便访问方式：

1. **让 Agent 打开浏览器**，然后自己登录。
2. **通过 CLI 打开**：

```bash
openclaw browser start
openclaw browser open https://x.com
```

如果你有多个配置文件，使用 `--browser-profile <name>`（默认为 `openclaw`）。

## X/Twitter：推荐流程

- **阅读/搜索/Threads：** 使用**宿主**浏览器（手动登录）。
- **发布更新：** 使用**宿主**浏览器（手动登录）。

## 沙盒 + 宿主浏览器访问

沙盒浏览器 Session **更容易**触发机器人检测。对于 X/Twitter（以及其他严格的网站），优先使用**宿主**浏览器。

如果 Agent 处于沙盒中，浏览器工具默认使用沙盒。要允许宿主控制：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

然后定向到宿主浏览器：

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

或者为负责发帖更新的 Agent 禁用沙盒。

## 相关

- [浏览器](/tools/browser)
- [浏览器 Linux 故障排除](/tools/browser-linux-troubleshooting)
- [浏览器 WSL2 故障排除](/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
