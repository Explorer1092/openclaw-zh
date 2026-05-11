---
mmh3_hash: "6180f61cd90d57c77dab3f6a08d349b9"
title: "Diffs"
sidebarTitle: "Diffs"
summary: "供 Agent 使用的只读 diff 查看器与文件渲染器（可选插件工具）"
description: "使用可选的 Diffs 插件，将前后文本或统一格式的 patch 渲染为 Gateway 托管的 diff 查看页面、文件（PNG 或 PDF），或两者兼得。"
read_when:
  - 希望 Agent 以 diff 形式展示代码或 Markdown 的修改内容
  - 需要适用于 Canvas 的查看器 URL 或渲染后的 diff 文件
  - 需要具有安全默认设置的受控、临时 diff 产物
---

`diffs` 是一个可选的插件工具，内置简短的系统引导和配套 Skill，可将变更内容转换为供 Agent 使用的只读 diff 产物。

接受以下输入之一：

- `before` 和 `after` 文本
- 统一格式的 `patch`

可返回以下内容：

- 用于 Canvas 展示的 Gateway 查看器 URL
- 用于消息发送的渲染文件路径（PNG 或 PDF）
- 一次调用同时返回两种输出

启用后，插件会将简洁的使用说明注入系统提示空间，同时提供详细 Skill 以供 Agent 需要完整指引时使用。

## 快速开始

<Steps>
  <Step title="安装插件">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="启用插件">
    ```json5
    {
      plugins: {
        entries: {
          diffs: {
            enabled: true,
          },
        },
      },
    }
    ```
  </Step>
  <Step title="选择模式">
    <Tabs>
      <Tab title="view">
        Canvas 优先流程：Agent 使用 `mode: "view"` 调用 `diffs`，并通过 `canvas present` 打开 `details.viewerUrl`。
      </Tab>
      <Tab title="file">
        聊天文件发送：Agent 使用 `mode: "file"` 调用 `diffs`，并通过 `message` 发送 `details.filePath`（使用 `path` 或 `filePath`）。
      </Tab>
      <Tab title="both">
        组合模式：Agent 使用 `mode: "both"` 调用 `diffs`，一次获取两种产物。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 禁用内置系统引导

如果希望保留 `diffs` 工具但禁用其内置的系统提示引导，可将 `plugins.entries.diffs.hooks.allowPromptInjection` 设置为 `false`：

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

这将在保留插件、工具及配套 Skill 可用的同时，阻止 diffs 插件的 `before_prompt_build` 钩子注入提示。

如需同时禁用引导和工具，请改为禁用整个插件。

## 典型 Agent 工作流

<Steps>
  <Step title="调用 diffs">
    Agent 使用输入调用 `diffs` 工具。
  </Step>
  <Step title="读取 details">
    Agent 从响应中读取 `details` 字段。
  </Step>
  <Step title="展示">
    Agent 使用 `canvas present` 打开 `details.viewerUrl`，或通过 `message` 使用 `path` 或 `filePath` 发送 `details.filePath`，或同时执行两项。
  </Step>
</Steps>

## 输入示例

<Tabs>
  <Tab title="前后对比">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## 工具输入参数说明

除非特别说明，所有字段均为可选。

<ParamField path="before" type="string">
  原始文本。省略 `patch` 时，须与 `after` 一起提供。
</ParamField>
<ParamField path="after" type="string">
  更新后的文本。省略 `patch` 时，须与 `before` 一起提供。
</ParamField>
<ParamField path="patch" type="string">
  统一格式的 diff 文本。与 `before` 和 `after` 互斥。
</ParamField>
<ParamField path="path" type="string">
  前后文本对比模式下显示的文件名。
</ParamField>
<ParamField path="lang" type="string">
  前后文本对比模式下的语言覆盖提示。未知值回退到纯文本。
</ParamField>
<ParamField path="title" type="string">
  查看器标题覆盖。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  输出模式。默认为插件默认值 `defaults.mode`。已废弃的别名：`"image"` 与 `"file"` 行为相同，仍可接受以保持向后兼容。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  查看器主题。默认为插件默认值 `defaults.theme`。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  diff 布局。默认为插件默认值 `defaults.layout`。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  当可展开上下文数据存在时展开未变更的代码段。仅为每次调用的选项（非插件默认配置键）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  渲染文件格式。默认为插件默认值 `defaults.fileFormat`。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG 或 PDF 渲染的质量预设。
</ParamField>
<ParamField path="fileScale" type="number">
  设备缩放比例覆盖（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  最大渲染宽度（CSS 像素，`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  查看器和独立文件输出的产物 TTL（秒）。最大 21600。
</ParamField>
<ParamField path="baseUrl" type="string">
  查看器 URL origin 覆盖。覆盖插件 `viewerBaseUrl`。须为 `http` 或 `https`，不含 query/hash。
</ParamField>

<AccordionGroup>
  <Accordion title="旧版输入别名">
    以下别名仍可接受以保持向后兼容：

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="校验与限制">
    - `before` 和 `after` 各自最大 512 KiB。
    - `patch` 最大 2 MiB。
    - `path` 最大 2048 字节。
    - `lang` 最大 128 字节。
    - `title` 最大 1024 字节。
    - Patch 复杂度上限：最多 128 个文件，总行数不超过 120000 行。
    - 同时提供 `patch` 与 `before` 或 `after` 时会被拒绝。
    - 渲染文件安全限制（适用于 PNG 和 PDF）：
      - `fileQuality: "standard"`：最大 8 MP（800 万渲染像素）。
      - `fileQuality: "hq"`：最大 14 MP（1400 万渲染像素）。
      - `fileQuality: "print"`：最大 24 MP（2400 万渲染像素）。
      - PDF 另有最多 50 页的限制。
  </Accordion>
</AccordionGroup>

## 输出 details 契约

工具在 `details` 下返回结构化的元数据。

<AccordionGroup>
  <Accordion title="查看器字段">
    创建查看器的模式共享以下字段：

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context`（当可用时：`agentId`、`sessionId`、`messageChannel`、`agentAccountId`）

  </Accordion>
  <Accordion title="文件字段">
    渲染 PNG 或 PDF 时的文件字段：

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path`（与 `filePath` 值相同，用于兼容 message 工具）
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="兼容性别名">
    以下字段也会返回以兼容现有调用方：

    - `format`（与 `fileFormat` 值相同）
    - `imagePath`（与 `filePath` 值相同）
    - `imageBytes`（与 `fileBytes` 值相同）
    - `imageQuality`（与 `fileQuality` 值相同）
    - `imageScale`（与 `fileScale` 值相同）
    - `imageMaxWidth`（与 `fileMaxWidth` 值相同）

  </Accordion>
</AccordionGroup>

模式行为说明：

| 模式     | 返回内容                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `"view"` | 仅返回查看器字段。                                                                                        |
| `"file"` | 仅返回文件字段，不创建查看器产物。                                                                        |
| `"both"` | 同时返回查看器字段和文件字段。若文件渲染失败，查看器仍会返回，并附带 `fileError` 和 `imageError` 别名。  |

## 折叠的未变更代码段

- 查看器可显示"N 行未修改"的折叠行。
- 这些行上的展开控件是有条件的，不保证对每种输入类型都可用。
- 展开控件在渲染的 diff 具有可展开上下文数据时出现，这在前后文本输入时较为常见。
- 对于许多统一 patch 输入，解析后的 patch hunks 中不包含省略的上下文内容，因此折叠行可能不显示展开控件。这是预期行为。
- `expandUnchanged` 仅在可展开上下文存在时生效。

## 插件默认配置

在 `~/.openclaw/openclaw.json` 中设置插件全局默认值：

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
            ttlSeconds: 21600,
          },
        },
      },
    },
  },
}
```

支持的默认配置项：

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`
- `ttlSeconds`

工具调用时的显式参数会覆盖这些默认值。

### 持久化查看器 URL 配置

<ParamField path="viewerBaseUrl" type="string">
  插件拥有的回退，用于工具调用未传递 `baseUrl` 时返回的查看器链接。须为 `http` 或 `https`，不含 query/hash。
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## 安全配置

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`：拒绝对查看器路由的非回环（non-loopback）请求。`true`：若 token 化路径有效，则允许远程查看器访问。
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## 产物生命周期与存储

- 产物存储在临时子目录：`$TMPDIR/openclaw-diffs`。
- 查看器产物元数据包含：
  - 随机产物 ID（20 位十六进制字符）
  - 随机 token（48 位十六进制字符）
  - `createdAt` 和 `expiresAt`
  - 存储的 `viewer.html` 路径
- 未指定时，查看器默认 TTL 为 30 分钟。
- 查看器 TTL 最大接受值为 6 小时。
- 清理操作在产物创建后机会性执行。
- 已过期的产物会被删除。
- 当元数据缺失时，兜底清理会删除超过 24 小时的旧目录。

## 查看器 URL 与网络行为

查看器路由：

- `/plugins/diffs/view/{artifactId}/{token}`

查看器资源：

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

查看器文档相对于查看器 URL 解析这些资源，因此可选的 `baseUrl` 路径前缀对两种资源请求都会保留。

URL 构建行为：

- 若提供工具调用的 `baseUrl`，将在严格校验后使用。
- 否则若配置了插件 `viewerBaseUrl`，则使用它。
- 未提供任何覆盖时，查看器 URL 默认使用回环地址 `127.0.0.1`。
- 若 Gateway 绑定模式为 `custom` 且设置了 `gateway.customBindHost`，则使用该主机地址。

`baseUrl` 规则：

- 须以 `http://` 或 `https://` 开头。
- 不允许包含 query 和 hash。
- 允许 origin 加可选的基础路径。

## 安全模型

<AccordionGroup>
  <Accordion title="查看器安全加固">
    - 默认仅限回环访问。
    - Token 化查看器路径，严格校验 ID 和 token。
    - 查看器响应 CSP：
      - `default-src 'none'`
      - 脚本和资源仅来自自身（self）
      - 无出站 `connect-src`
    - 启用远程访问时的远程请求失败限速：
      - 每 60 秒最多 40 次失败
      - 触发后锁定 60 秒（`429 Too Many Requests`）
  </Accordion>
  <Accordion title="文件渲染安全加固">
    - 截图浏览器请求路由默认拒绝所有。
    - 仅允许来自 `http://127.0.0.1/plugins/diffs/assets/*` 的本地查看器资源。
    - 屏蔽外部网络请求。
  </Accordion>
</AccordionGroup>

## 文件模式的浏览器要求

`mode: "file"` 和 `mode: "both"` 需要 Chromium 兼容浏览器。

解析顺序：

<Steps>
  <Step title="配置">
    OpenClaw 配置中的 `browser.executablePath`。
  </Step>
  <Step title="环境变量">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
  </Step>
  <Step title="平台兜底">
    平台命令/路径自动发现兜底。
  </Step>
</Steps>

常见错误提示：

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

修复方式：安装 Chrome、Chromium、Edge 或 Brave，或设置上述任一可执行文件路径选项。

## 故障排除

<AccordionGroup>
  <Accordion title="输入校验错误">
    - `Provide patch or both before and after text.` — 同时提供 `before` 和 `after`，或提供 `patch`。
    - `Provide either patch or before/after input, not both.` — 不要混用两种输入模式。
    - `Invalid baseUrl: ...` — 使用带可选路径的 `http(s)` origin，不含 query/hash。
    - `{field} exceeds maximum size (...)` — 减小 payload 大小。
    - 大型 patch 被拒绝 — 减少 patch 中的文件数量或总行数。
  </Accordion>
  <Accordion title="查看器访问问题">
    - 查看器 URL 默认解析到 `127.0.0.1`。
    - 对于远程访问场景，可选择：
      - 设置插件 `viewerBaseUrl`，或
      - 在每次工具调用时传入 `baseUrl`，或
      - 使用 `gateway.bind=custom` 和 `gateway.customBindHost`
    - 若 `gateway.trustedProxies` 包含同主机代理（例如 Tailscale Serve）的回环地址，则不带转发客户端 IP 头的原始回环查看器请求会按设计失败关闭。
    - 对于该代理拓扑：
      - 若只需附件，优先使用 `mode: "file"` 或 `mode: "both"`，或
      - 若需要可分享的查看器 URL，则有意启用 `security.allowRemoteViewer` 并设置插件 `viewerBaseUrl` 或传递代理/公开的 `baseUrl`
    - 仅在确实需要外部访问查看器时才启用 `security.allowRemoteViewer`。
  </Accordion>
  <Accordion title="未变更行没有展开按钮">
    这在 patch 输入中可能出现，当 patch 不携带可展开上下文时。这是预期行为，不表示查看器故障。
  </Accordion>
  <Accordion title="产物未找到">
    - 产物已因 TTL 过期。
    - Token 或路径已变更。
    - 清理操作已删除旧数据。
  </Accordion>
</AccordionGroup>

## 操作建议

- 本地 Canvas 交互审查首选 `mode: "view"`。
- 需要附件的出站聊天 Channel 首选 `mode: "file"`。
- 除非部署环境需要远程查看器 URL，否则保持 `allowRemoteViewer` 禁用。
- 对敏感 diff 设置较短的显式 `ttlSeconds`。
- 非必要时避免在 diff 输入中包含敏感信息。
- 如果你的 Channel 会对图片进行激进压缩（例如 Telegram 或 WhatsApp），建议使用 PDF 输出（`fileFormat: "pdf"`）。

<Note>
Diff 渲染引擎由 [Diffs](https://diffs.com) 提供支持。
</Note>

## 相关

- [浏览器](/tools/browser)
- [Plugin](/tools/plugin)
- [工具概览](/tools)
