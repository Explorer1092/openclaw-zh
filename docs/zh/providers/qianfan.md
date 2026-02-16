---
summary: "使用 Qianfan 的统一 API 在 OpenClaw 中访问许多模型"
read_when:
  - 您想要单个 API 密钥用于许多 LLM
  - 您需要百度千帆设置指导
title: "Qianfan"
---

# Qianfan Provider 指南

Qianfan 是百度的 MaaS 平台，提供**统一的 API**，将请求路由到单个端点和 API 密钥后面的许多模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 通过切换 Base URL 即可工作。

## 先决条件

1. 具有 Qianfan API 访问权限的百度云帐户
2. 来自 Qianfan 控制台的 API 密钥
3. 系统上安装的 OpenClaw

## 获取您的 API 密钥

1. 访问 [Qianfan 控制台](https://console.bce.baidu.com/qianfan/ais/console/apiKey)
2. 创建新应用程序或选择现有应用程序
3. 生成 API 密钥（格式：`bce-v3/ALTAK-...`）
4. 复制 API 密钥以与 OpenClaw 一起使用

## CLI 设置

```bash
openclaw onboard --auth-choice qianfan-api-key
```

## 相关文档

- [OpenClaw 配置](/gateway/configuration)
- [模型 Providers](/concepts/model-providers)
- [Agent 设置](/concepts/agent)
- [Qianfan API 文档](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)
