---
mmh3_hash: "01d3b804d00b4fa3fdf381455b39b960"
summary: "使用 Qianfan 的统一 API 在 OpenClaw 中访问许多模型"
read_when:
  - 您想要单个 API 密钥用于许多 LLM
  - 您需要百度千帆设置指导
title: "Qianfan"
---

# Qianfan Provider 指南

Qianfan 是百度的 MaaS 平台，提供**统一的 API**，将请求路由到单个端点和 API 密钥后面的许多模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 通过切换 Base URL 即可工作。

## 先决条件

1. 具有 Qianfan API 访问权限的百度云账户
2. 来自 Qianfan 控制台的 API 密钥
3. 系统上已安装 OpenClaw

## 获取您的 API 密钥

1. 访问 [Qianfan 控制台](https://console.bce.baidu.com/qianfan/ais/console/apiKey)
2. 创建新应用程序或选择现有应用程序
3. 生成 API 密钥（格式：`bce-v3/ALTAK-...`）
4. 复制 API 密钥以在 OpenClaw 中使用

## CLI 设置

```bash
openclaw onboard --auth-choice qianfan-api-key
```

## 配置片段

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

## 注意事项

- 默认内置模型引用：`qianfan/deepseek-v3.2`
- 默认 Base URL：`https://qianfan.baidubce.com/v2`
- 内置目录目前包含 `deepseek-v3.2` 和 `ernie-5.0-thinking-preview`
- 仅在需要自定义 Base URL 或模型元数据时添加或覆盖 `models.providers.qianfan`
- Qianfan 通过 OpenAI 兼容传输路径运行，不使用原生 OpenAI 请求塑形

## 相关文档

- [OpenClaw 配置](/gateway/configuration)
- [模型 Provider](/concepts/model-providers)
- [Agent 设置](/concepts/agent)
- [Qianfan API 文档](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)
