---
mmh3_hash: "5b849be9a82fd5d8a9202a507848f6ed"
---
# Tweakcn 自定义主题导入设计

状态：2026-04-22 已在终端批准

## 摘要

在 Control UI 中添加一个可以从 tweakcn 分享链接导入的浏览器本地自定义主题槽位。现有的内置主题系列保持 `claw`、`knot` 和 `dash`。新的 `custom` 系列表现得像普通的 OpenClaw 主题系列，当导入的 tweakcn 载荷包含亮色和暗色 token 集时支持 `light`、`dark` 和 `system` 模式。

导入的主题仅存储在当前浏览器配置文件中，与其余 Control UI 设置一起保存。它不写入 Gateway 配置，也不跨设备或浏览器同步。

## 问题

Control UI 主题系统目前在三个硬编码的主题系列上封闭：

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

用户可以在内置系列和模式变体之间切换，但不能在不编辑仓库 CSS 的情况下从 tweakcn 引入主题。请求的结果比通用主题系统小：保留三个内置项并添加一个可以从 tweakcn 链接替换的用户控制导入槽位。

## 目标

- 保持现有的内置主题系列不变。
- 添加一个导入的自定义槽位，而非主题库。
- 接受 tweakcn 分享链接或直接的 `https://tweakcn.com/r/themes/{id}` URL。
- 仅在浏览器本地存储中持久化导入的主题。
- 使导入的槽位与现有的 `light`、`dark` 和 `system` 模式控件一起工作。
- 保持失败行为安全：坏的导入永远不会破坏活跃的 UI 主题。

## 非目标

- 不提供多主题库或浏览器本地导入列表。
- 不提供 Gateway 侧持久化或跨设备同步。
- 不提供任意 CSS 编辑器或原始主题 JSON 编辑器。
- 不自动加载来自 tweakcn 的远程字体资源。
- 不尝试支持仅公开一种模式的 tweakcn 载荷。
- 不进行超出 Control UI 所需接缝的仓库范围主题重构。

## 已做出的用户决策

- 保留三个内置主题。
- 添加一个 tweakcn 驱动的导入槽位。
- 将导入的主题存储在浏览器中，而非 Gateway 配置中。
- 为导入的槽位支持 `light`、`dark` 和 `system`。
- 使用下一次导入覆盖自定义槽位是预期行为。

## 推荐方式

向 Control UI 主题模型添加第四个主题系列 ID `custom`。`custom` 系列仅在存在有效的 tweakcn 导入时才可选择。导入的载荷规范化为 OpenClaw 特定的自定义主题记录，并与其余 UI 设置一起存储在浏览器本地存储中。

运行时，OpenClaw 渲染一个定义已解析的自定义 CSS 变量块的托管 `<style>` 标签：

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
- 更新 `resolveTheme()` 使 `custom` 镜像现有的系列行为：
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> 基于 OS 偏好的 `custom` 或 `custom-light`

不为 `custom` 添加旧版别名。

### 持久化模型

在 `ui/src/ui/storage.ts` 中扩展 `UiSettings` 持久化，添加一个可选的自定义主题载荷：

- `customTheme?: ImportedCustomTheme`

推荐的存储形状：

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

注意：

- `sourceUrl` 存储规范化后的原始用户输入。
- `themeId` 是从 URL 中提取的 tweakcn 主题 ID。
- `label` 是 tweakcn 的 `name` 字段（如果存在），否则为 `Custom`。
- `light` 和 `dark` 是已规范化的 OpenClaw token 映射，而非原始 tweakcn 载荷。
- 导入的载荷存放在其他浏览器本地设置旁边，并序列化在同一个本地存储文档中。
- 如果加载时存储的自定义主题数据缺失或无效，忽略载荷，并在持久化的系列是 `custom` 时回退到 `theme: "claw"`。

### 运行时应用

在 Control UI 运行时中添加一个窄的自定义主题样式表管理器，位于 `ui/src/ui/app-settings.ts` 和 `ui/src/ui/theme.ts` 附近。

职责：

- 在 `document.head` 中创建或更新一个稳定的 `<style id="openclaw-custom-theme">` 标签。
- 仅在存在有效的自定义主题载荷时发出 CSS。
- 清除载荷时删除样式标签内容。
- 将内置系列 CSS 保留在 `ui/src/styles/base.css` 中；不要将导入的 token 拼接到已检入的样式表中。

此管理器在设置加载、保存、导入或清除时运行。

### 亮色模式选择器

实现应该优先使用 `data-theme-mode="light"` 进行跨系列的亮色样式，而非对 `custom-light` 进行特殊处理。如果现有的选择器被固定到 `data-theme="light"` 且需要应用于每个亮色系列，请在此工作中将其扩展。

## 导入用户体验

在 `Appearance` 部分更新 `ui/src/ui/views/config.ts`：

- 在 `Claw`、`Knot` 和 `Dash` 旁边添加一个 `Custom` 主题卡片。
- 当没有导入的自定义主题存在时，将卡片显示为禁用。
- 在主题网格下添加一个导入面板，包含：
  - 一个用于 tweakcn 分享链接或 `/r/themes/{id}` URL 的文本输入
  - 一个 `Import` 按钮
  - 自定义载荷已存在时的一个 `Replace` 路径
  - 自定义载荷已存在时的一个 `Clear` 操作
- 当载荷存在时，显示导入的主题标签和来源主机。
- 如果活跃主题是 `custom`，导入替换会立即应用。
- 如果活跃主题不是 `custom`，导入只存储新载荷，直到用户选择 `Custom` 卡片。

`ui/src/ui/views/config-quick.ts` 中的快速设置主题选择器也应该仅在载荷存在时显示 `Custom`。

## URL 解析和远程获取

浏览器导入路径接受：

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

实现应该将两种格式规范化为：

- `https://tweakcn.com/r/themes/{id}`

然后浏览器直接获取规范化的 `/r/themes/{id}` 端点。

对外部载荷使用窄的模式验证器。由于这是不受信任的外部边界，优先使用 zod 模式。

所需的远程字段：

- 顶层 `name`，可选字符串
- `cssVars.theme`，可选对象
- `cssVars.light`，对象
- `cssVars.dark`，对象

如果 `cssVars.light` 或 `cssVars.dark` 缺失，拒绝导入。这是刻意的：批准的产品行为是完整模式支持，而不是尽力合成缺失的一侧。

## Token 映射

不要盲目镜像 tweakcn 变量。将有界子集规范化为 OpenClaw token，并在助手中推导其余部分。

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

当存在时，从共享的 `cssVars.theme`：

- `font-sans`
- `font-mono`

如果模式块覆盖了 `font-sans`、`font-mono` 或 `radius`，模式本地值获胜。

### 为 OpenClaw 推导的 Token

导入器从导入的基础颜色推导 OpenClaw 专用变量：

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

推导规则存放在纯助手中，以便可以独立测试。精确的颜色混合公式是实现细节，但助手必须满足两个约束：

- 保持接近导入主题意图的可读对比度
- 为相同的导入载荷产生稳定的输出

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

如果字体堆叠字符串存在，则导入它们，但 OpenClaw 在 v1 中不加载远程字体资源。如果导入的堆叠引用了浏览器中不可用的字体，则应用正常的回退行为。

## 失败行为

坏的导入必须失败关闭。

- 无效的 URL 格式：显示内联验证错误，不获取。
- 不支持的主机或路径形状：显示内联验证错误，不获取。
- 网络失败、非 OK 响应或格式错误的 JSON：显示内联错误，保持当前存储载荷不变。
- 模式失败或缺失亮/暗块：显示内联错误，保持当前存储载荷不变。
- 清除操作：
  - 删除存储的自定义载荷
  - 删除托管的自定义样式标签内容
  - 如果 `custom` 处于活跃状态，将主题系列切换回 `claw`
- 首次加载时无效的存储自定义载荷：
  - 忽略存储的载荷
  - 不发出自定义 CSS
  - 如果持久化的主题系列是 `custom`，回退到 `claw`

在任何时候，失败的导入都不应让活跃文档保留部分应用的自定义 CSS 变量。

## 预期在实现中更改的文件

主要文件：

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

可能的新助手：

- `ui/src/ui/custom-theme.ts`

测试：

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- 新的针对 URL 解析和载荷规范化的专项测试

## 测试

最小实现覆盖：

- 将分享链接 URL 解析为 tweakcn 主题 ID
- 将 `/themes/{id}` 和 `/r/themes/{id}` 规范化为获取 URL
- 拒绝不支持的主机和格式错误的 ID
- 验证 tweakcn 载荷形状
- 将有效的 tweakcn 载荷映射到规范化的 OpenClaw 亮色和暗色 token 映射
- 在浏览器本地设置中加载和保存自定义载荷
- 解析 `light`、`dark` 和 `system` 的 `custom`
- 当没有载荷存在时禁用 `Custom` 选择
- 当 `custom` 已经活跃时立即应用导入的主题
- 当活跃的自定义主题被清除时回退到 `claw`

手动验证目标：

- 从设置中导入已知的 tweakcn 主题
- 在 `light`、`dark` 和 `system` 之间切换
- 在 `custom` 和内置系列之间切换
- 重新加载页面并确认导入的自定义主题在本地持久化

## 发布说明

此功能有意设计得小。如果用户之后要求多个导入主题、重命名、导出或跨设备同步，请将其视为后续设计。不要在此实现中预先构建主题库抽象。
