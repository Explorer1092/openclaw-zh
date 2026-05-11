---
mmh3_hash: "be9c29d642b2d167708a9b6b41ab678f"
summary: "安装、列出、卸载、更新和发布 OpenClaw Plugin 的快速示例"
read_when:
  - 您需要快速的 Plugin 安装、列出、更新或卸载示例
  - 您想在 ClawHub 和 npm Plugin 分发之间做出选择
  - 您正在发布 Plugin Package
title: "管理 Plugin"
sidebarTitle: "管理 Plugin"
---

大多数 Plugin 工作流只需要几个命令：搜索、安装、重启 Gateway、验证，以及在不再需要 Plugin 时卸载。

## 列出 Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

使用 `--json` 用于脚本。它包含注册表诊断和每个 Plugin 的静态 `dependencyStatus`（当 Plugin Package 声明 `dependencies` 或 `optionalDependencies` 时）。

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` 是一次冷清单检查。它显示 OpenClaw 可以从配置、Manifest 和 Plugin 注册表发现的内容；它不证明已运行的 Gateway 进程已导入 Plugin 运行时。

## 安装 Plugin

```bash
# 在 ClawHub 中搜索 Plugin Package。
openclaw plugins search "calendar"

# 裸 Package 规格先尝试 ClawHub，然后回退到 npm。
openclaw plugins install <package>

# 强制指定来源。
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# 安装特定版本或 dist-tag。
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# 从 git 或本地开发检出安装。
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

安装 Plugin 代码后，重启为您的 Channel 提供服务的 Gateway：

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

当您需要证明 Plugin 已注册运行时界面（如 Tool、Hook、服务、Gateway 方法或 Plugin 拥有的 CLI 命令）时，使用 `inspect --runtime`。

## 更新 Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

如果 Plugin 是从 npm dist-tag（如 `@beta`）安装的，后续的 `update <plugin-id>` 调用会重用该记录的标签。传递显式 npm 规格会将跟踪的安装切换到该规格以供将来更新。

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

第二个命令在 Plugin 之前固定到精确版本或标签时，将其移回注册表的默认发布线。

当 `openclaw update` 在 beta 通道上运行时，默认线路的 npm 和 ClawHub Plugin 记录首先尝试匹配的 Plugin `@beta` 版本。如果该 beta 版本不存在，OpenClaw 回退到记录的默认/最新规格。对于 npm Plugin，当 beta Package 存在但安装验证失败时，OpenClaw 也会回退。精确版本和明确的标签（如 `@rc` 或 `@beta`）会被保留。

## 卸载 Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

卸载会删除 Plugin 的配置条目、Plugin 索引记录、允许/拒绝列表条目，以及适用时的链接加载路径。除非您传递 `--keep-files`，否则托管安装目录会被删除。

在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，Plugin 安装、更新、卸载、启用和禁用命令被禁用。请在 Nix 源中管理这些选择；对于 nix-openclaw，请使用 Agent 优先的[快速入门](https://github.com/openclaw/nix-openclaw#quick-start)。

## 发布 Plugin

您可以将外部 Plugin 发布到 [ClawHub](https://clawhub.ai)、npmjs.com 或两者。

### 发布到 ClawHub

ClawHub 是 OpenClaw Plugin 的主要公共发现界面。它为用户提供可搜索的元数据、版本历史和安装前的注册表扫描结果。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

用户通过以下方式从 ClawHub 安装：

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

裸形式仍然首先检查 ClawHub。

### 发布到 npmjs.com

原生 npm Plugin 必须包含 Plugin Manifest 和 `package.json` OpenClaw 入口点元数据。

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
```

用户通过仅 npm 方式安装：

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

如果同一 Package 也在 ClawHub 上可用，`npm:` 会跳过 ClawHub 查找并强制使用 npm 解析。

## 来源选择

- **ClawHub**：当您想要 OpenClaw 原生发现、扫描摘要、版本和安装提示时使用。
- **npmjs.com**：当您已经发布 JavaScript Package 或需要 npm dist-tag/私有注册表工作流时使用。
- **Git**：当您想直接从分支、标签或提交安装时使用。
- **本地路径**：当您在同一台机器上开发或测试 Plugin 时使用。

## 相关

- [Plugin](/tools/plugin) - 概览和故障排查
- [`openclaw plugins`](/cli/plugins) - 完整 CLI 参考
- [ClawHub](/clawhub/cli) - 发布和注册表操作
- [构建 Plugin](/plugins/building-plugins) - 创建 Plugin Package
- [Plugin Manifest](/plugins/manifest) - Manifest 和 Package 元数据
