---
mmh3_hash: "4f2ee3fa24fc7b67b15f02cc02f9d73e"
summary: "设计方案：作为可选扩展的 Firecrawl，增加搜索/抓取价值，而无需将 Firecrawl 硬编码到核心默认值中"
read_when:
  - 设计 Firecrawl 集成工作
  - 评估 web_search/web_fetch 插件接缝
  - 决定 Firecrawl 属于核心还是扩展
title: "Firecrawl 扩展设计"
---

# Firecrawl 扩展设计

## 目标

将 Firecrawl 作为**可选扩展**发布，添加：

- 面向 agent 的显式 Firecrawl 工具，
- 可选的 Firecrawl 支持的 `web_search` 集成，
- 自托管支持，
- 比当前核心回退路径更强的安全默认值，

同时不将 Firecrawl 推入默认设置/引导路径。

## 为何采用此形态

最近的 Firecrawl issue/PR 集中在三个方面：

1. **发布/schema 漂移**
   - 多个版本拒绝了 `tools.web.fetch.firecrawl`，即使文档和运行时代码支持它。
2. **安全加固**
   - 当前 `fetchFirecrawlContent()` 仍然使用原始 `fetch()` 向 Firecrawl 端点发送请求，而主要 web-fetch 路径使用 SSRF 保护。
3. **产品压力**
   - 用户需要 Firecrawl 原生的搜索/抓取流程，特别是对于自托管/私有设置。
   - 维护者明确拒绝将 Firecrawl 深度融入核心默认值、设置流程和浏览器行为。

这种组合表明应该使用扩展，而不是在默认核心路径中添加更多 Firecrawl 特定逻辑。

## 设计原则

- **可选加入，供应商隔离**：无自动启用、无设置劫持、无默认工具配置文件扩展。
- **扩展拥有 Firecrawl 特定配置**：相比继续扩展 `tools.web.*`，优先使用插件配置。
- **第一天即可使用**：即使核心 `web_search` / `web_fetch` 接缝保持不变，也能正常工作。
- **安全优先**：端点请求使用与其他 web 工具相同的受保护网络姿态。
- **自托管友好**：配置 + 环境变量回退、显式 base URL、无仅托管假设。

## 建议扩展

Plugin id：`firecrawl`

### MVP 能力

注册显式工具：

- `firecrawl_search`
- `firecrawl_scrape`

可选的后续功能：

- `firecrawl_crawl`
- `firecrawl_map`

第一版**不要**添加 Firecrawl 浏览器自动化。这是 PR #32543 中将 Firecrawl 过于深入核心行为并引发最多维护顾虑的部分。

## 配置形态

使用插件范围的配置：

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          apiKey: "FIRECRAWL_API_KEY",
          baseUrl: "https://api.firecrawl.dev",
          timeoutSeconds: 60,
          maxAgeMs: 172800000,
          proxy: "auto",
          storeInCache: true,
          onlyMainContent: true,
          search: {
            enabled: true,
            defaultLimit: 5,
            sources: ["web"],
            categories: [],
            scrapeResults: false,
          },
          scrape: {
            formats: ["markdown"],
            fallbackForWebFetchLikeUse: false,
          },
        },
      },
    },
  },
}
```

### 凭据解析

优先级：

1. `plugins.entries.firecrawl.config.apiKey`
2. `FIRECRAWL_API_KEY`

Base URL 优先级：

1. `plugins.entries.firecrawl.config.baseUrl`
2. `FIRECRAWL_BASE_URL`
3. `https://api.firecrawl.dev`

### 兼容性桥接

对于第一个版本，扩展也可以**读取** `tools.web.fetch.firecrawl.*` 中的现有核心配置作为回退来源，这样现有用户无需立即迁移。

写入路径保持在插件本地。不要继续扩展核心 Firecrawl 配置界面。

## 工具设计

### `firecrawl_search`

输入：

- `query`
- `limit`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

行为：

- 调用 Firecrawl `v2/search`
- 返回标准化的 OpenClaw 友好结果对象：
  - `title`
  - `url`
  - `snippet`
  - `source`
  - 可选 `content`
- 将结果内容包装为不受信任的外部内容
- 缓存键包括查询 + 相关提供商参数

为何先使用显式工具：

- 今天无需更改 `tools.web.search.provider` 即可工作
- 避免当前 schema/加载器限制
- 立即为用户提供 Firecrawl 价值

### `firecrawl_scrape`

输入：

- `url`
- `formats`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

行为：

- 调用 Firecrawl `v2/scrape`
- 返回 markdown/text 加上元数据：
  - `title`
  - `finalUrl`
  - `status`
  - `warning`
- 以与 `web_fetch` 相同的方式包装提取的内容
- 在实际可行的情况下与 web 工具期望共享缓存语义

为何使用显式抓取工具：

- 绕过核心 `web_fetch` 中未解决的 `Readability -> Firecrawl -> 基本 HTML 清理` 排序错误
- 为 JS 重型/反爬虫保护网站提供确定性的"始终使用 Firecrawl"路径

## 扩展不应做的事

- 不自动将 `browser`、`web_search` 或 `web_fetch` 添加到 `tools.alsoAllow`
- 不在 `openclaw setup` 中添加默认引导步骤
- 不在核心中添加 Firecrawl 特定的浏览器会话生命周期
- 在扩展 MVP 中不更改内置 `web_fetch` 回退语义

## 阶段计划

### 阶段 1：仅扩展，无核心 schema 更改

实现：

- `extensions/firecrawl/`
- 插件配置 schema
- `firecrawl_search`
- `firecrawl_scrape`
- 配置解析、端点选择、缓存、错误处理和 SSRF 保护使用的测试

这一阶段足以提供真正的用户价值。

### 阶段 2：可选 `web_search` 提供商集成

仅在修复两个核心限制后才支持 `tools.web.search.provider = "firecrawl"`：

1. `src/plugins/web-search-providers.ts` 必须加载已配置/已安装的 web 搜索提供商插件，而不是硬编码的捆绑列表。
2. `src/config/types.tools.ts` 和 `src/config/zod-schema.agent-runtime.ts` 必须停止以阻止插件注册 id 的方式硬编码提供商枚举。

推荐形态：

- 保持文档化内置提供商，
- 在运行时允许任何注册的插件提供商 id，
- 通过提供商插件或通用提供商包验证特定于提供商的配置。

### 阶段 3：可选 `web_fetch` 提供商接缝

仅当维护者希望供应商特定的 fetch 后端参与 `web_fetch` 时才执行此操作。

所需的核心添加：

- `registerWebFetchProvider` 或等效的 fetch 后端接缝

没有该接缝，扩展应将 `firecrawl_scrape` 保持为显式工具，而不是尝试修补内置 `web_fetch`。

## 安全要求

扩展必须将 Firecrawl 视为**受信任的操作员配置端点**，但仍需加强传输：

- 对 Firecrawl 端点调用使用 SSRF 保护的 fetch，而不是原始 `fetch()`
- 使用与其他地方使用的相同受信任 web 工具端点策略保持自托管/私有网络兼容性
- 永远不记录 API 密钥
- 保持端点/base URL 解析显式且可预测
- 将 Firecrawl 返回的内容视为不受信任的外部内容

这反映了 SSRF 加固 PR 背后的意图，而不假设 Firecrawl 是敌对的多租户界面。

## 为何不使用 skill

仓库已经关闭了一个 Firecrawl skill PR，转而支持 ClawHub 分发。对于可选的用户安装的提示工作流来说这很好，但它不解决：

- 确定性的工具可用性，
- 提供商级别的配置/凭据处理，
- 自托管端点支持，
- 缓存，
- 稳定的类型化输出，
- 网络行为的安全审查。

这属于扩展，而不是仅提示的 skill。

## 成功标准

- 用户可以安装/启用一个扩展，在不触及核心默认值的情况下获得可靠的 Firecrawl 搜索/抓取。
- 自托管 Firecrawl 可通过配置/环境变量回退工作。
- 扩展端点请求使用受保护的网络。
- 无新的 Firecrawl 特定核心引导/默认行为。
- 核心稍后可以采用插件原生 `web_search` / `web_fetch` 接缝，而无需重新设计扩展。

## 推荐实现顺序

1. 构建 `firecrawl_scrape`
2. 构建 `firecrawl_search`
3. 添加文档和示例
4. 如果需要，推广 `web_search` 提供商加载，使扩展可以支持 `web_search`
5. 然后才考虑真正的 `web_fetch` 提供商接缝
