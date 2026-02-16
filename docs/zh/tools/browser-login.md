---
title: "浏览器登录与 X/Twitter 发帖"
sidebarTitle: "浏览器登录"
mmh3_hash: "c5ae4f43605f02a3be63e757d4cc288a"
summary: "浏览器自动化 + X/Twitter 发帖的手动登录"
read_when: ["需要登录网站以进行浏览器自动化","想要发布更新到 X/Twitter"]
---

# 浏览器登录与 X/Twitter 发帖

## 手动登录(推荐)

当网站需要登录时,在**主机**浏览器配置文件(openclaw 浏览器)中**手动登录**。

**不要**向模型提供您的凭据。自动登录通常会触发反机器人防御,并可能锁定账户。

返回主浏览器文档: [浏览器](/tools/browser)。

## 使用哪个 Chrome 配置文件?

OpenClaw 控制一个**专用的 Chrome 配置文件**(名为 `openclaw`,橙色调 UI)。这与您的日常浏览器配置文件是分开的。

两种简单的访问方式:

1) **让 agent 打开浏览器**,然后您自己登录。
2) **通过 CLI 打开**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

如果您有多个配置文件,传递 `--browser-profile <名称>`(默认是 `openclaw`)。

## X/Twitter: 推荐流程

- **读取/搜索/线程:** 使用**主机**浏览器(手动登录)。
- **发布更新:** 使用**主机**浏览器(手动登录)。

## 沙箱 + 主机浏览器访问

沙箱浏览器会话**更有可能**触发机器人检测。对于 X/Twitter(和其他严格的网站),优先使用**主机**浏览器。

如果 agent 被沙箱化,浏览器工具默认使用沙箱。要允许主机控制:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true
        }
      }
    }
  }
}
```

然后定位到主机浏览器:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

或者禁用发布更新的 agent 的沙箱功能。

