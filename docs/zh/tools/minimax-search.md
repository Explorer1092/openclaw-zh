---
mmh3_hash: "5e060072095a314a8c41eaecc8b60058"
summary: "通过 Coding Plan 搜索 API 使用 MiniMax Search"
read_when:
  - 希望将 MiniMax 用于 web_search
  - 需要 MiniMax Coding Plan 密钥
  - 需要 MiniMax CN/全球搜索主机指引
title: "MiniMax Search"
---

# MiniMax Search

OpenClaw 通过 MiniMax Coding Plan 搜索 API 支持将 MiniMax 作为 `web_search` 提供商。它返回包含标题、URL、摘要和相关查询的结构化搜索结果。

## 获取 Coding Plan 密钥

<Steps>
  <Step title="创建密钥">
    从 [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) 创建或复制 MiniMax Coding Plan 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 环境中设置 `MINIMAX_CODE_PLAN_KEY`，或通过以下方式配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw 也接受 `MINIMAX_CODING_API_KEY` 作为环境变量别名。当 `MINIMAX_API_KEY` 已指向 coding-plan token 时，仍可作为兼容回退读取。

## 配置

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // 若已设置 MINIMAX_CODE_PLAN_KEY 则可选
            region: "global", // 或 "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**环境变量替代方案：** 在 Gateway 环境中设置 `MINIMAX_CODE_PLAN_KEY`。对于 Gateway 安装，将其放入 `~/.openclaw/.env`。

## 地区选择

MiniMax Search 使用以下端点：

- 全球：`https://api.minimax.io/v1/coding_plan/search`
- CN：`https://api.minimaxi.com/v1/coding_plan/search`

如果未设置 `plugins.entries.minimax.config.webSearch.region`，OpenClaw 按以下顺序解析地区：

1. `tools.web.search.minimax.region` / 插件自有 `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

这意味着 CN 入驻配置或 `MINIMAX_API_HOST=https://api.minimaxi.com/...` 会自动使 MiniMax Search 保持在 CN 主机上。

即使你通过 OAuth `minimax-portal` 路径完成了 MiniMax 认证，网页搜索仍注册为提供商 ID `minimax`；OAuth 提供商基础 URL 仅用作 CN/全球主机选择的地区提示。

## 支持的参数

MiniMax Search 支持：

- `query`
- `count`（OpenClaw 会将返回的结果列表裁剪至请求的数量）

目前不支持提供商特定的过滤器。

## 相关

- [Web Search 概览](/tools/web) -- 所有提供商和自动检测
- [MiniMax](/providers/minimax) -- 模型、图像、语音和认证设置
