---
mmh3_hash: "2d2b1efcff0b121cb0ba46855057a80b"
summary: "OpenClaw 如何安装 Plugin Package 及解析 Plugin 依赖"
read_when:
  - 您正在调试 Plugin Package 安装问题
  - 您正在更改 Plugin 启动、doctor 或 Package 管理器安装行为
  - 您正在维护打包的 OpenClaw 安装或 Bundle Plugin Manifest
title: "Plugin 依赖解析"
sidebarTitle: "依赖"
---

OpenClaw 将 Plugin 依赖工作保留在安装/更新时进行。运行时加载不运行 Package 管理器、修复依赖树或修改 OpenClaw Package 目录。

## 责任划分

Plugin Package 拥有其依赖图：

- 运行时依赖位于 Plugin Package 的 `dependencies` 或 `optionalDependencies` 中
- SDK/核心导入是对等或由 OpenClaw 提供的导入
- 本地开发 Plugin 自带已安装的依赖
- npm 和 git Plugin 安装到 OpenClaw 拥有的 Package 根目录中

OpenClaw 只拥有 Plugin 生命周期：

- 发现 Plugin 来源
- 在明确请求时安装或更新 Package
- 记录安装元数据
- 加载 Plugin 入口点
- 在依赖缺失时以可操作的错误失败

## 安装根目录

OpenClaw 使用稳定的每来源根目录：

- npm Package 安装在 `~/.openclaw/npm` 下
- git Package 克隆在 `~/.openclaw/git` 下
- 本地/路径/归档安装在不修复依赖的情况下复制或引用

npm 安装在 npm 根目录中运行：

```bash
cd ~/.openclaw/npm
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` 对本地 npm-pack 压缩包使用相同的托管 npm 根目录。OpenClaw 读取压缩包的 npm 元数据，将其作为复制的 `file:` 依赖添加到托管根目录，运行正常 npm 安装，然后在信任 Plugin 前验证已安装的锁文件元数据。这用于 Package 验收和候选发布验证，其中本地 pack 制件的行为应与其模拟的注册表制件相同。

npm 可能会将传递依赖提升到 `~/.openclaw/npm/node_modules` 中，与 Plugin Package 并列。OpenClaw 在信任安装之前会扫描托管 npm 根目录，并在卸载时使用 npm 删除 npm 托管的 Package，因此提升的运行时依赖保留在托管清理边界内。

导入 `openclaw/plugin-sdk/*` 的 Plugin 将 `openclaw` 声明为对等依赖。OpenClaw 不让 npm 将宿主 Package 的单独注册表副本安装到托管根目录中，因为过时的宿主 Package 可能会影响后续 Plugin 安装期间的 npm 对等解析。托管 npm 安装为共享根目录跳过 npm 对等解析/实体化，OpenClaw 在安装、更新或卸载后为声明宿主对等的已安装 Package 重新声明 Plugin 本地 `node_modules/openclaw` 链接。

git 安装克隆或刷新仓库，然后运行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

已安装的 Plugin 然后从该 Package 目录加载，因此 Package 本地和父 `node_modules` 解析与普通 Node Package 的工作方式相同。

## 本地 Plugin

本地 Plugin 被视为开发者控制的目录。OpenClaw 不为它们运行 `npm install`、`pnpm install` 或依赖修复。如果本地 Plugin 有依赖，请在加载之前在该 Plugin 中安装它们。

第三方 TypeScript 本地 Plugin 可以使用紧急 Jiti 路径。打包的 JavaScript Plugin 和 Bundle 内部 Plugin 通过原生 import/require 而非 Jiti 加载。

## 启动和重载

Gateway 启动和配置重载从不安装 Plugin 依赖。它们读取 Plugin 安装记录，计算入口点，然后加载它。

如果运行时依赖缺失，Plugin 无法加载，错误应将操作员指向明确的修复：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理旧版 OpenClaw 生成的依赖状态，并恢复配置引用但本地安装记录中缺失的可下载 Plugin。Doctor 不修复已安装的本地 Plugin 的依赖。

## Bundle Plugin

轻量级和核心关键的 Bundle Plugin 作为 OpenClaw 的一部分发布。它们要么没有沉重的运行时依赖树，要么被移动到 ClawHub/npm 上的可下载 Package 中。

有关随核心 Package 一起发布、外部安装或仅源代码的 Plugin 当前生成列表，请参见 [Plugin 清单](/plugins/plugin-inventory)。

Bundle Plugin Manifest 不得请求依赖暂存。大型或可选的 Plugin 功能应打包为普通 Plugin，并通过与第三方 Plugin 相同的 npm/git/ClawHub 路径安装。

在源代码检出中，OpenClaw 将仓库视为 pnpm monorepo。在 `pnpm install` 后，Bundle Plugin 从 `extensions/<id>` 加载，以便 Package 本地工作区依赖可用，编辑可以直接生效。源代码检出开发仅支持 pnpm；在仓库根目录运行普通 `npm install` 不是准备 Bundle Plugin 依赖的受支持方式。

| 安装形式                          | Bundle Plugin 位置                    | 依赖所有者                                                           |
| --------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`         | Package 内的已构建运行时树             | OpenClaw Package 和显式 Plugin 安装/更新/doctor 流程                 |
| Git 检出加 `pnpm install`          | `extensions/<id>` 工作区 Package      | pnpm 工作区，包括每个 Plugin Package 自己的依赖                      |
| `openclaw plugins install ...`    | 托管 npm/git/ClawHub Plugin 根目录    | Plugin 安装/更新流程                                                  |

## 旧版清理

旧版 OpenClaw 在启动时或 doctor 修复期间在 Bundle Plugin 依赖根目录生成依赖。当使用 `--fix` 时，当前 doctor 清理会删除那些过时的目录和符号链接，包括旧的 `plugin-runtime-deps` 根目录、指向已修剪 `plugin-runtime-deps` 目标的全局 Node 前缀 Package 符号链接、`.openclaw-runtime-deps*` Manifest、生成的 Plugin `node_modules`、安装暂存目录和 Package 本地 pnpm 存储。打包的 postinstall 也在修剪旧版目标根目录之前删除那些全局符号链接，以便升级不会留下悬空的 ESM Package 导入。

这些路径只是旧版碎片。新安装不应创建它们。
