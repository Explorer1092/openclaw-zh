---
mmh3_hash: "a41bb4b94e89158516f8ec0c1b5b8e90"
title: "Diffs"
summary: "供 Agent 使用的只读 diff 查看器与文件渲染器（可选插件工具）"
description: "使用可选的 Diffs 插件，将前后文本或统一格式的 patch 渲染为 Gateway 托管的 diff 查看页面、文件（PNG 或 PDF），或两者兼得。"
read_when:
  - 希望 Agent 以 diff 形式展示代码或 Markdown 的修改内容
  - 需要适用于 Canvas 的查看器 URL 或渲染后的 diff 文件
  - 需要具有安全默认设置的受控、临时 diff 产物
---

# Diffs

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

1. 启用插件。
2. 对于以 Canvas 为主的流程，使用 `mode: "view"` 调用 `diffs`。
3. 对于以聊天文件发送为主的流程，使用 `mode: "file"` 调用 `diffs`。
4. 同时需要两种产物时，使用 `mode: "both"` 调用 `diffs`。

## 启用插件

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

1. Agent 调用 `diffs`。
2. Agent 读取 `details` 字段。
3. Agent 执行以下操作之一：
   - 使用 `canvas present` 打开 `details.viewerUrl`
   - 使用 `path` 或 `filePath` 通过 `message` 发送 `details.filePath`
   - 同时执行以上两项

## 输入示例

前后文本对比：

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch：

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## 工具输入参数说明

除非特别说明，所有字段均为可选：

- `before`（`string`）：原始文本。省略 `patch` 时，须与 `after` 一起提供。
- `after`（`string`）：更新后的文本。省略 `patch` 时，须与 `before` 一起提供。
- `patch`（`string`）：统一格式的 diff 文本。与 `before` 和 `after` 互斥。
- `path`（`string`）：前后文本对比模式下显示的文件名。
- `lang`（`string`）：前后文本对比模式下的语言覆盖提示。
- `title`（`string`）：查看器标题覆盖。
- `mode`（`"view" | "file" | "both"`）：输出模式。默认为插件默认值 `defaults.mode`。
- `theme`（`"light" | "dark"`）：查看器主题。默认为插件默认值 `defaults.theme`。
- `layout`（`"unified" | "split"`）：diff 布局。默认为插件默认值 `defaults.layout`。
- `expandUnchanged`（`boolean`）：当可展开上下文数据存在时展开未变更的代码段。仅为每次调用的选项（非插件默认配置键）。
- `fileFormat`（`"png" | "pdf"`）：渲染文件格式。默认为插件默认值 `defaults.fileFormat`。
- `fileQuality`（`"standard" | "hq" | "print"`）：PNG 或 PDF 渲染的质量预设。
- `fileScale`（`number`）：设备缩放比例覆盖（`1`-`4`）。
- `fileMaxWidth`（`number`）：最大渲染宽度（CSS 像素，`640`-`2400`）。
- `ttlSeconds`（`number`）：查看器产物的 TTL（秒）。默认 1800，最大 21600。
- `baseUrl`（`string`）：查看器 URL 的 origin 覆盖。须为 `http` 或 `https`，不含 query/hash。

校验与限制：

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

## 输出 details 契约

工具在 `details` 下返回结构化的元数据。

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

模式行为说明：

- `mode: "view"`：仅返回查看器字段。
- `mode: "file"`：仅返回文件字段，不创建查看器产物。
- `mode: "both"`：同时返回查看器字段和文件字段。若文件渲染失败，查看器仍会返回，并附带 `fileError`。

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

工具调用时的显式参数会覆盖这些默认值。

## 安全配置

- `security.allowRemoteViewer`（`boolean`，默认 `false`）
  - `false`：拒绝对查看器路由的非回环（non-loopback）请求。
  - `true`：若 token 化路径有效，则允许远程查看器访问。

示例：

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

URL 构建行为：

- 若提供 `baseUrl`，将在严格校验后使用。
- 未提供 `baseUrl` 时，查看器 URL 默认使用回环地址 `127.0.0.1`。
- 若 Gateway 绑定模式为 `custom` 且设置了 `gateway.customBindHost`，则使用该主机地址。

`baseUrl` 规则：

- 须以 `http://` 或 `https://` 开头。
- 不允许包含 query 和 hash。
- 允许 origin 加可选的基础路径。

## 安全模型

查看器安全加固：

- 默认仅限回环访问。
- Token 化查看器路径，严格校验 ID 和 token。
- 查看器响应 CSP：
  - `default-src 'none'`
  - 脚本和资源仅来自自身（self）
  - 无出站 `connect-src`
- 启用远程访问时的远程请求失败限速：
  - 每 60 秒最多 40 次失败
  - 触发后锁定 60 秒（`429 Too Many Requests`）

文件渲染安全加固：

- 截图浏览器请求路由默认拒绝所有。
- 仅允许来自 `http://127.0.0.1/plugins/diffs/assets/*` 的本地查看器资源。
- 屏蔽外部网络请求。

## 文件模式的浏览器要求

`mode: "file"` 和 `mode: "both"` 需要 Chromium 兼容浏览器。

解析顺序：

1. OpenClaw 配置中的 `browser.executablePath`。
2. 环境变量：
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. 平台命令/路径自动发现兜底。

常见错误提示：

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

修复方式：安装 Chrome、Chromium、Edge 或 Brave，或设置上述任一可执行文件路径选项。

## 故障排除

输入校验错误：

- `Provide patch or both before and after text.`
  - 同时提供 `before` 和 `after`，或提供 `patch`。
- `Provide either patch or before/after input, not both.`
  - 不要混用两种输入模式。
- `Invalid baseUrl: ...`
  - 使用带可选路径的 `http(s)` origin，不含 query/hash。
- `{field} exceeds maximum size (...)`
  - 减小 payload 大小。
- 大型 patch 被拒绝
  - 减少 patch 中的文件数量或总行数。

查看器访问问题：

- 查看器 URL 默认解析到 `127.0.0.1`。
- 对于远程访问场景，可选择：
  - 在每次工具调用时传入 `baseUrl`，或
  - 使用 `gateway.bind=custom` 和 `gateway.customBindHost`
- 仅在确实需要外部访问查看器时才启用 `security.allowRemoteViewer`。

未变更行没有展开按钮：

- 这在 patch 输入中可能出现，当 patch 不携带可展开上下文时。
- 这是预期行为，不表示查看器故障。

产物未找到：

- 产物已因 TTL 过期。
- Token 或路径已变更。
- 清理操作已删除旧数据。

## 操作建议

- 本地 Canvas 交互审查首选 `mode: "view"`。
- 需要附件的出站聊天 Channel 首选 `mode: "file"`。
- 除非部署环境需要远程查看器 URL，否则保持 `allowRemoteViewer` 禁用。
- 对敏感 diff 设置较短的显式 `ttlSeconds`。
- 非必要时避免在 diff 输入中包含敏感信息。
- 如果您的 Channel 会对图片进行激进压缩（例如 Telegram 或 WhatsApp），建议使用 PDF 输出（`fileFormat: "pdf"`）。

Diff 渲染引擎：

- 由 [Diffs](https://diffs.com) 提供支持。

## 相关文档

- [Tools overview](/tools)
- [Plugins](/tools/plugin)
- [Browser](/tools/browser)
