---
mmh3_hash: "2dbc841518d964177dd259536bd02c7a"
---
# Tweakcn 自定义主题导入设计

状态：于 2026-04-22 在终端批准

## 摘要

为 Control UI 添加恰好一个浏览器本地的自定义主题槽，可从 tweakcn 分享链接导入。现有内置主题系列保持为 `claw`、`knot` 和 `dash`。新的 `custom` 系列的行为类似于普通的 OpenClaw 主题系列，当导入的 tweakcn 有效载荷包含明暗两种 token 集时，支持 `light`、`dark` 和 `system` 模式。

导入的主题仅存储在当前浏览器配置文件中，与其他 Control UI 设置一起。它不会写入 Gateway 配置，也不会跨设备或浏览器同步。

## 问题

Control UI 主题系统目前封闭在三个硬编码的主题系列中：

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

用户可以在内置系列和模式变体之间切换，但无法在不编辑仓库 CSS 的情况下从 tweakcn 引入主题。请求的结果比通用主题系统更小：保留三个内置主题，添加一个可从 tweakcn 链接替换的用户控制导入槽。

## 目标

- 保持现有内置主题系列不变。
- 添加恰好一个导入的自定义槽，而不是主题库。
- 接受 tweakcn 分享链接或直接的 `https://tweakcn.com/r/themes/{id}` URL。
- 仅在浏览器本地存储中持久化导入的主题。
- 使导入的槽与现有的 `light`、`dark` 和 `system` 模式控件一起工作。
- 保持失败行为安全：错误的导入绝不破坏活动的 UI 主题。

## 非目标

- 不构建多主题库或浏览器本地导入列表。
- 不进行 Gateway 端持久化或跨设备同步。
- 不提供任意 CSS 编辑器或原始主题 JSON 编辑器。
- 不自动加载来自 tweakcn 的远程字体资产。
- 不尝试支持仅公开一种模式的 tweakcn 有效载荷。
- 不进行超出 Control UI 所需接缝的仓库范围主题重构。

## 已作出的用户决策

- 保留三个内置主题。
- 添加一个 tweakcn 驱动的导入槽。
- 将导入的主题存储在浏览器中，而不是 Gateway 配置中。
- 为导入的槽支持 `light`、`dark` 和 `system`。
- 用下一次导入覆盖自定义槽是预期行为。

## 推荐方法

将第四个主题系列 id `custom` 添加到 Control UI 主题模型中。`custom` 系列仅在存在有效的 tweakcn 导入时才可选择。导入的有效载荷被规范化为 OpenClaw 特定的自定义主题记录，并与其他 UI 设置一起存储在浏览器本地存储中。

在运行时，OpenClaw 渲染一个管理的 `<style>` 标签，定义解析后的自定义 CSS 变量块：

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

这将自定义主题变量限定在 `custom` 系列范围内，避免将内联 CSS 变量泄漏到内置系列中。

## 架构

### 主题模型

更新 `ui/src/ui/theme.ts`：

- 将 `ThemeName` 扩展为包含 `custom`。
- 将 `ResolvedTheme` 扩展为包含 `custom` 和 `custom-light`。
- 扩展 `VALID_THEME_NAMES`。
- 更新 `resolveTheme()`，使 `custom` 反映现有系列行为：
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> 根据操作系统偏好选择 `custom` 或 `custom-light`

不为 `custom` 添加旧版别名。

### 持久化模型

在 `ui/src/ui/storage.ts` 中扩展 `UiSettings` 持久化，添加一个可选的自定义主题有效载荷：

- `customTheme?: ImportedCustomTheme`

推荐的存储结构：

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

说明：

- `sourceUrl` 在规范化后存储原始用户输入。
- `themeId` 是从 URL 提取的 tweakcn 主题 id。
- `label` 是 tweakcn 的 `name` 字段（若存在），否则为 `Custom`。
- `light` 和 `dark` 是已规范化的 OpenClaw token 映射，而不是原始 tweakcn 有效载荷。
- 导入的有效载荷与其他浏览器本地设置一起存放，并在同一个本地存储文档中序列化。
- 如果加载时存储的自定义主题数据缺失或无效，忽略该有效载荷，并在持久化的系列为 `custom` 时回退到 `theme: "claw"`。

### 运行时应用

在 Control UI 运行时中添加一个狭窄的自定义主题样式表管理器，归属于 `ui/src/ui/app-settings.ts` 和 `ui/src/ui/theme.ts` 附近。

职责：

- 在 `document.head` 中创建或更新一个稳定的 `<style id="openclaw-custom-theme">` 标签。
- 仅在存在有效的自定义主题有效载荷时输出 CSS。
- 在有效载荷被清除时删除样式标签内容。
- 将内置系列 CSS 保留在 `ui/src/styles/base.css` 中；不要将导入的 token 拼接到已检入的样式表中。

每当设置被加载、保存、导入或清除时，此管理器都会运行。

### 浅色模式选择器

实现应优先使用 `data-theme-mode="light"` 进行跨系列浅色样式，而不是特殊处理 `custom-light`。如果现有选择器固定为 `data-theme="light"` 且需要应用于每个浅色系列，请在此工作中扩大其范围。

## 导入用户体验

更新 `ui/src/ui/views/config.ts` 中的 `Appearance` 部分：

- 在 `Claw`、`Knot` 和 `Dash` 旁边添加一个 `Custom` 主题卡片。
- 当不存在导入的自定义主题时，将卡片显示为禁用状态。
- 在主题网格下方添加导入面板，包含：
  - 用于 tweakcn 分享链接或 `/r/themes/{id}` URL 的文本输入框
  - 一个 `Import` 按钮
  - 自定义有效载荷已存在时的 `Replace` 路径
  - 自定义有效载荷已存在时的 `Clear` 操作
- 当有效载荷存在时，显示导入的主题标签和来源主机。
- 如果活动主题为 `custom`，导入替换会立即应用。
- 如果活动主题不是 `custom`，导入仅存储新有效载荷，直到用户选择 `Custom` 卡片。

`ui/src/ui/views/config-quick.ts` 中的快速设置主题选择器也应仅在有效载荷存在时显示 `Custom`。

## URL 解析和远程获取

浏览器导入路径接受：

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

实现应将两种形式规范化为：

- `https://tweakcn.com/r/themes/{id}`

然后浏览器直接获取规范化的 `/r/themes/{id}` 端点。

对外部有效载荷使用狭窄的 Schema 验证器。优先使用 zod Schema，因为这是一个不受信任的外部边界。

必需的远程字段：

- 顶级 `name` 作为可选字符串
- `cssVars.theme` 作为可选对象
- `cssVars.light` 作为对象
- `cssVars.dark` 作为对象

如果 `cssVars.light` 或 `cssVars.dark` 中的任何一个缺失，拒绝导入。这是有意为之：批准的产品行为是完整的模式支持，而不是对缺失一端的尽力合成。

## Token 映射

不要盲目镜像 tweakcn 变量。将有限的子集规范化为 OpenClaw token，并在助手中派生其余部分。

### 直接导入的 Token

从每个 tweakcn 模式块：

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

从共享的 `cssVars.theme`（若存在）：

- `font-sans`
- `font-mono`

如果模式块覆盖了 `font-sans`、`font-mono` 或 `radius`，则模式本地值优先。

### 为 OpenClaw 派生的 Token

导入器从导入的基础颜色派生 OpenClaw 专有变量：

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

派生规则存在于一个纯助手中，以便可以独立测试。精确的颜色混合公式是实现细节，但助手必须满足两个约束：

- 保持接近导入主题意图的可读对比度
- 为相同的导入有效载荷产生稳定输出

### v1 中忽略的 Token

这些 tweakcn token 在第一个版本中被有意忽略：

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

这将范围保持在当前 Control UI 实际需要的 token 上。

### 字体

字体栈字符串在存在时被导入，但 OpenClaw 在 v1 中不加载远程字体资产。如果导入的字体栈引用了浏览器中不可用的字体，则应用正常的回退行为。

## 失败行为

错误的导入必须安全失败。

- 无效的 URL 格式：显示内联验证错误，不执行获取。
- 不支持的主机或路径格式：显示内联验证错误，不执行获取。
- 网络失败、非 OK 响应或格式错误的 JSON：显示内联错误，保持当前存储的有效载荷不变。
- Schema 失败或缺失 light/dark 块：显示内联错误，保持当前存储的有效载荷不变。
- Clear 操作：
  - 删除存储的自定义有效载荷
  - 删除管理的自定义样式标签内容
  - 如果 `custom` 为活动状态，将主题系列切换回 `claw`
- 首次加载时存储的自定义有效载荷无效：
  - 忽略存储的有效载荷
  - 不输出自定义 CSS
  - 如果持久化的主题系列为 `custom`，回退到 `claw`

在任何情况下，失败的导入都不应将活动文档置于部分自定义 CSS 变量已应用的状态。

## 实现中预计更改的文件

主要文件：

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

可能的新助手：

- `ui/src/ui/custom-theme.ts`
- `ui/src/ui/custom-theme-import.ts`

测试：

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- 针对 URL 解析和有效载荷规范化的新专项测试

## 测试

最小实现覆盖：

- 将分享链接 URL 解析为 tweakcn 主题 id
- 将 `/themes/{id}` 和 `/r/themes/{id}` 规范化为获取 URL
- 拒绝不支持的主机和格式错误的 id
- 验证 tweakcn 有效载荷结构
- 将有效的 tweakcn 有效载荷映射到规范化的 OpenClaw 明暗 token 映射
- 在浏览器本地设置中加载和保存自定义有效载荷
- 解析 `light`、`dark` 和 `system` 的 `custom`
- 当没有有效载荷时禁用 `Custom` 选择
- 当 `custom` 已处于活动状态时立即应用导入的主题
- 清除活动的自定义主题时回退到 `claw`

手动验证目标：

- 从设置导入已知的 tweakcn 主题
- 在 `light`、`dark` 和 `system` 之间切换
- 在 `custom` 和内置系列之间切换
- 重新加载页面并确认导入的自定义主题在本地持久化

## 发布说明

此功能有意保持小巧。如果用户后来要求多个导入主题、重命名、导出或跨设备同步，请将其视为后续设计。不要在此实现中预先构建主题库抽象。
