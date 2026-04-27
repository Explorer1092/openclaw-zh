---
mmh3_hash: "2093ef6d43d7508ac977b2cf0d99f158"
summary: "在 Hostinger 上托管 OpenClaw"
read_when:
  - 在 Hostinger 上设置 OpenClaw
  - 寻找用于 OpenClaw 的托管 VPS
  - 使用 Hostinger 一键 OpenClaw
title: "Hostinger"
---

通过**一键**托管部署或 **VPS** 安装，在 [Hostinger](https://www.hostinger.com/openclaw) 上运行持久的 OpenClaw Gateway。

## 前提条件

- Hostinger 帐户（[注册](https://www.hostinger.com/openclaw)）
- 大约 5-10 分钟

## 选项 A：一键 OpenClaw

最快的入门方式。Hostinger 负责基础设施、Docker 和自动更新。

<Steps>
  <Step title="购买并启动">
    1. 从 [Hostinger OpenClaw 页面](https://www.hostinger.com/openclaw)，选择一个托管 OpenClaw 计划并完成结账。

    <Note>
    在结账时你可以选择**即用型 AI** 积分，这些积分在 OpenClaw 内部预购并即时集成——无需其他 provider 的外部帐户或 API 密钥。你可以立即开始聊天。或者，在设置时提供你自己的 Anthropic、OpenAI、Google Gemini 或 xAI 密钥。
    </Note>

  </Step>

  <Step title="选择消息 channel">
    选择一个或多个要连接的 channel：

    - **WhatsApp** — 扫描设置向导中显示的二维码。
    - **Telegram** — 粘贴来自 [BotFather](https://t.me/BotFather) 的 bot token。

  </Step>

  <Step title="完成安装">
    点击**完成**以部署实例。准备好后，从 hPanel 中的 **OpenClaw 概览**访问 OpenClaw 仪表板。
  </Step>

</Steps>

## 选项 B：VPS 上的 OpenClaw

对服务器有更多控制权。Hostinger 通过 Docker 在你的 VPS 上部署 OpenClaw，你可以通过 hPanel 中的 **Docker Manager** 进行管理。

<Steps>
  <Step title="购买 VPS">
    1. 从 [Hostinger OpenClaw 页面](https://www.hostinger.com/openclaw)，选择一个 VPS 上的 OpenClaw 计划并完成结账。

    <Note>
    你可以在结账时选择**即用型 AI** 积分——这些积分在 OpenClaw 内部预购并即时集成，让你无需任何其他 provider 的外部帐户或 API 密钥即可开始聊天。
    </Note>

  </Step>

  <Step title="配置 OpenClaw">
    VPS 配置完成后，填写配置字段：

    - **Gateway token** — 自动生成；保存以备后用。
    - **WhatsApp 号码** — 带国家代码的号码（可选）。
    - **Telegram bot token** — 来自 [BotFather](https://t.me/BotFather)（可选）。
    - **API 密钥** — 仅当你在结账时未选择即用型 AI 积分时才需要。

  </Step>

  <Step title="启动 OpenClaw">
    点击**部署**。运行后，点击 **Open** 从 hPanel 打开 OpenClaw 仪表板。
  </Step>

</Steps>

日志、重启和更新直接从 hPanel 中的 Docker Manager 界面管理。如需更新，在 Docker Manager 中按**更新**，这将拉取最新镜像。

## 验证你的设置

向你连接的 channel 上的助手发送"Hi"。OpenClaw 将回复并引导你完成初始设置。

## 故障排除

**仪表板未加载** — 等待几分钟让容器完成配置。检查 hPanel 中的 Docker Manager 日志。

**Docker 容器不断重启** — 打开 Docker Manager 日志，查找配置错误（缺失 token、无效 API 密钥）。

**Telegram bot 不响应** — 在 OpenClaw 聊天中直接发送你的配对码消息到 Telegram，以完成连接。

## 下一步

- [Channels](/channels) — 连接 Telegram、WhatsApp、Discord 等
- [Gateway 配置](/gateway/configuration) — 所有配置选项

## 相关

- [安装概览](/install)
- [VPS 托管](/vps)
- [DigitalOcean](/install/digitalocean)
