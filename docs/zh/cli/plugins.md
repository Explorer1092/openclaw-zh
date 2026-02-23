---
title: "`openclaw plugins`"
sidebarTitle: "openclaw plugins"
mmh3_hash: "e97dc701bfd25e13118e7406c61edf30"
summary: "`openclaw plugins` 的 CLI 参考(列表、安装、启用/禁用、doctor)"
read_when:
  - 您想安装或管理进程内Gateway插件
  - 您想调试插件加载失败
---

# `openclaw plugins`

管理Gateway插件/扩展(在进程内加载)。

相关:

- Plugin系统:[Plugin](/tools/plugin)
- Plugin清单 + 架构:[Plugin清单](/plugins/manifest)
- 安全加固:[安全](/gateway/security)

## 命令

```bash
openclaw plugins list
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id>
openclaw plugins update --all
```

捆绑Plugin随 OpenClaw 一起提供,但默认禁用。使用 `plugins enable` 激活它们。

所有Plugin必须附带一个带有内联 JSON Schema 的 `openclaw.plugin.json` 文件(`configSchema`,即使为空)。缺少/无效的清单或架构会阻止Plugin加载并导致配置验证失败。

### 安装

```bash
openclaw plugins install <path-or-spec>
openclaw plugins install <npm-spec> --pin
```

安全注意事项:像运行代码一样对待 Plugin 安装。优先使用固定版本。

Npm 规范**仅限注册表**(包名称 + 可选版本/标签)。Git/URL/文件规范被拒绝。依赖项安装使用 `--ignore-scripts` 运行以确保安全。

支持的存档:`.zip`、`.tgz`、`.tar.gz`、`.tar`。

使用 `--link` 避免复制本地目录(添加到 `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

使用 `--pin` 进行 npm 安装,以将已解析的精确规范(`name@version`)保存到 `plugins.installs` 中,同时保持默认行为未固定。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 从 `plugins.entries`、`plugins.installs`、Plugin允许列表和适用时链接的 `plugins.load.paths` 条目中删除Plugin记录。对于活动内存Plugin,内存插槽重置为 `memory-core`。

默认情况下,卸载还会删除活动状态目录扩展根目录(`$OPENCLAW_STATE_DIR/extensions/<id>`)下的Plugin安装目录。使用 `--keep-files` 在磁盘上保留文件。

`--keep-config` 作为 `--keep-files` 的已弃用别名受支持。

### 更新

```bash
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update <id> --dry-run
```

更新仅适用于从 npm 安装的 Plugin(在 `plugins.installs` 中跟踪)。

当存在已存储的完整性哈希且获取的构件哈希发生变化时,OpenClaw 会打印警告并在继续前请求确认。在 CI/非交互运行中使用全局 `--yes` 跳过提示。
