---
mmh3_hash: "26921bbc2598765f7914bb731a8a3222"
summary: "社区维护的 OpenClaw Plugin：浏览、安装和提交您自己的 Plugin"
read_when:
  - 您想查找第三方 OpenClaw Plugin
  - 您想发布或列出自己的 Plugin
title: "社区 Plugin"
---

# 社区 Plugin

社区 Plugin 是扩展 OpenClaw 功能的第三方包，可添加新的 Channel、Tool、Provider 或其他能力。它们由社区构建和维护，发布在 [ClawHub](/tools/clawhub) 或 npm 上，并可以通过单个命令安装。

ClawHub 是社区 Plugin 的规范发现入口。请不要仅仅为了在此处增加可发现性而打开文档 PR；请改为在 ClawHub 上发布。

```bash
openclaw plugins install <package-name>
```

OpenClaw 首先检查 ClawHub，然后自动回退到 npm。

## 已收录 Plugin

### Apify

使用 20,000 多个现成的爬虫从任何网站抓取数据。让您的 Agent 仅通过提问就能从 Instagram、Facebook、TikTok、YouTube、Google Maps、Google Search、电商网站等提取数据。

- **npm：** `@apify/apify-openclaw-plugin`
- **仓库：** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

用于 Codex App Server 对话的独立 OpenClaw 桥接。将聊天绑定到 Codex 线程，用纯文本与其交谈，并使用聊天原生命令进行恢复、规划、审查、模型选择、压缩等操作。

- **npm：** `openclaw-codex-app-server`
- **仓库：** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

使用 Stream 模式的企业机器人集成。通过任何 DingTalk 客户端支持文本、图像和文件消息。

- **npm：** `@largezhou/ddingtalk`
- **仓库：** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw 的无损上下文管理 Plugin。基于 DAG 的对话摘要与增量压缩 — 在减少 Token 使用的同时保留完整上下文保真度。

- **npm：** `@martian-engineering/lossless-claw`
- **仓库：** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

将 Agent 追踪导出到 Opik 的官方 Plugin。监控 Agent 行为、成本、Token、错误等。

- **npm：** `@opik/opik-openclaw`
- **仓库：** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

为您的 OpenClaw Agent 提供具有实时口型同步、情感表情和文字转语音功能的 Live2D 形象。包含用于 AI 资产生成的创作工具以及一键部署到 Prometheus Marketplace 的功能。目前处于 alpha 阶段。

- **npm：** `@prometheusavatar/openclaw-plugin`
- **仓库：** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

通过 QQ Bot API 将 OpenClaw 连接到 QQ。支持私聊、群组提及、频道消息以及包括语音、图像、视频和文件在内的丰富媒体。

当前 OpenClaw 版本已捆绑 QQ Bot。对于正常安装，请使用 [QQ Bot](/channels/qqbot) 中的捆绑设置；仅当您有意需要腾讯维护的独立包时，才安装此外部 Plugin。

- **npm：** `@tencent-connect/openclaw-qqbot`
- **仓库：** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

腾讯企业微信团队出品的 OpenClaw 企业微信 Channel Plugin。由企业微信 Bot WebSocket 持久连接驱动，支持私信和群聊、流式回复、主动消息、图片/文件处理、Markdown 格式化、内置访问控制以及文档/会议/消息 Skill。

- **npm：** `@wecom/wecom-openclaw-plugin`
- **仓库：** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## 提交您的 Plugin

我们欢迎实用、有文档且安全可操作的社区 Plugin。

<Steps>
  <Step title="发布到 ClawHub 或 npm">
    您的 Plugin 必须可通过 `openclaw plugins install <package-name>` 安装。发布到 [ClawHub](/tools/clawhub)（首选）或 npm。完整指南请参见 [构建 Plugin](/plugins/building-plugins)。

  </Step>

  <Step title="托管在 GitHub">
    源代码必须在公开仓库中，并附有设置文档和问题追踪器。

  </Step>

  <Step title="仅对源文档变更使用文档 PR">
    您不需要提交文档 PR 只是为了让您的 Plugin 可被发现。请改为在 ClawHub 上发布。

    仅当 OpenClaw 的源文档需要实际内容更改时才打开文档 PR，例如更正安装指南或添加属于主文档集的跨仓库文档。

  </Step>
</Steps>

## 质量标准

| 要求                        | 原因                                           |
| --------------------------- | ---------------------------------------------- |
| 发布到 ClawHub 或 npm       | 用户需要 `openclaw plugins install` 能正常工作 |
| 公开的 GitHub 仓库          | 源码审查、问题跟踪、透明度                     |
| 设置和使用文档              | 用户需要知道如何配置                           |
| 积极维护                    | 近期更新或响应及时的问题处理                   |

低质量包装、所有权不明确或无人维护的包可能会被拒绝。

## 相关

- [安装和配置 Plugin](/tools/plugin) — 如何安装任何 Plugin
- [构建 Plugin](/plugins/building-plugins) — 创建您自己的 Plugin
- [Plugin 清单](/plugins/manifest) — 清单模式
