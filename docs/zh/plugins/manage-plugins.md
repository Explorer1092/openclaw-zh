---
mmh3_hash: "d5eb33483a4c280cebb94f105acdceb3"
summary: "安装、列出、卸载、更新和发布 OpenClaw Plugin 的快速示例"
read_when:
  - 您需要快速的 Plugin 安装、列出、更新或卸载示例
  - 您想选择 Plugin 安装来源
  - 您想要发布 Plugin 包的正确参考
title: "管理 Plugin"
sidebarTitle: "管理 Plugin"
doc-schema-version: 1
---

本页面提供常用的 Plugin 管理命令。有关详尽的命令契约、标志、来源选择规则和边缘情况，请参见 [`openclaw plugins`](/cli/plugins)。

大多数安装工作流是：

1. 查找包
2. 从 ClawHub、npm、git 或本地路径安装
3. 让托管 Gateway 自动重启，或在非托管时手动重启
4. 验证 Plugin 的运行时注册

## 列出和搜索 Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

使用 `--json` 进行脚本处理：

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` 是冷清单检查。它显示 OpenClaw 可以从配置、Manifest 和 Plugin 注册表发现的内容；它不证明已运行的 Gateway 导入了 Plugin 运行时。JSON 输出在 Plugin 包声明 `dependencies` 或 `optionalDependencies` 时包含注册表诊断和每个 Plugin 的静态 `dependencyStatus`。

`plugins search` 查询 ClawHub 以获取可安装的 Plugin 包，并打印安装提示，如 `openclaw plugins install clawhub:<package>`。

## 安装 Plugin

```bash
# 在 ClawHub 上搜索 Plugin 包。
openclaw plugins search "calendar"

# 从 ClawHub 安装。
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# 从 npm 安装。
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# 从本地 npm pack 包安装。
openclaw plugins install npm-pack:<path.tgz>

# 从 git 或本地开发检出安装。
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

裸包规格在发布切换期间从 npm 安装。当您需要确定性的来源选择时，使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:`。如果裸名称匹配官方 Plugin ID，OpenClaw 可以直接安装目录条目。

仅当您故意想覆盖现有安装目标时才使用 `--force`。对于跟踪的 npm、ClawHub 或 hook-pack 安装的常规升级，使用 `openclaw plugins update`。

## 重启和检查

安装、更新或卸载 Plugin 代码后，启用配置重载的运行中托管 Gateway 会自动重启。如果 Gateway 未托管或重载已禁用，请在检查实时运行时界面之前自行重启它：

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

当您需要证明 Plugin 已注册运行时界面（如 Tool、Hook、服务、Gateway 方法、HTTP 路由或 Plugin 拥有的 CLI 命令）时，使用 `inspect --runtime`。普通的 `inspect` 和 `list` 是冷 Manifest、配置和注册表检查。

## 更新 Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

当您传入 Plugin ID 时，OpenClaw 重用跟踪的安装规格。存储的 dist-tag（如 `@beta`）和精确固定的版本在后续的 `update <plugin-id>` 运行中继续使用。

对于 npm 安装，您可以传入显式的包规格来切换跟踪记录：

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

当 Plugin 之前固定到精确版本或标签时，第二个命令将其移回注册表的默认发布线。

当 `openclaw update` 在 beta Channel 上运行时，Plugin 记录可能倾向于匹配 `@beta` 版本。有关确切的回退和固定规则，请参见 [`openclaw plugins`](/cli/plugins#update)。

## 卸载 Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

卸载会删除 Plugin 的配置条目、持久化的 Plugin 索引记录、允许/拒绝列表条目以及适用时的链接加载路径。除非您传入 `--keep-files`，否则托管安装目录会被删除。当卸载更改 Plugin 来源时，运行中的托管 Gateway 会自动重启。

在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，Plugin 安装、更新、卸载、启用和禁用命令被禁用。请改为在安装的 Nix 源中管理这些选择。

## 选择来源

| 来源      | 使用时机                                                                     | 示例                                                           |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | 您想要 OpenClaw 原生发现、扫描摘要、版本和提示                              | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | 您已经发布 JavaScript 包或需要 npm dist-tag/私有注册表                       | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | 您想要仓库中的分支、标签或提交                                               | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 本地路径    | 您正在同一机器上开发或测试 Plugin                                            | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | 您通过 npm install 语义验证本地包工件                                        | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | 您正在安装与 Claude 兼容的 marketplace Plugin                                | `openclaw plugins install <plugin> --marketplace <source>`     |

## 发布 Plugin

ClawHub 是 OpenClaw Plugin 的主要公共发现界面。当您希望用户在安装前找到 Plugin 元数据、版本历史记录、注册表扫描结果和安装提示时，在那里发布。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

原生 npm Plugin 在发布之前必须包含 Plugin Manifest 和包元数据：

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
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

使用以下页面获取完整的发布契约，而不是将本页面视为发布参考：

- [ClawHub 发布](/clawhub/publishing) 解释所有者、范围、发布、审查、包验证和包转让。
- [构建 Plugin](/plugins/building-plugins) 展示 Plugin 包形状和首次发布工作流程。
- [Plugin Manifest](/plugins/manifest) 定义原生 Plugin Manifest 字段。

如果同一个包在 ClawHub 和 npm 上都可用，当您需要强制使用一个来源时，请使用显式的 `clawhub:` 或 `npm:` 前缀。

## 相关

- [Plugin](/tools/plugin) - 安装、配置、重启和故障排除
- [`openclaw plugins`](/cli/plugins) - 完整的 CLI 参考
- [社区 Plugin](/plugins/community) - 公共发现和 ClawHub 发布
- [ClawHub](/clawhub/cli) - 注册表 CLI 操作
- [构建 Plugin](/plugins/building-plugins) - 创建 Plugin 包
- [Plugin Manifest](/plugins/manifest) - Manifest 和包元数据
