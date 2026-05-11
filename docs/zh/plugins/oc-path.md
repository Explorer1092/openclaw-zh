---
mmh3_hash: "3075eb6a2eb3008ad5aac3e2cadc6864"
summary: "Bundle `oc-path` Plugin：为 `oc://` 工作区文件寻址方案提供 `openclaw path` CLI"
read_when:
  - 您想从终端检查或编辑工作区文件中的单个叶节点
  - 您正在针对工作区状态编写脚本，需要稳定的、与类型无关的寻址方案
  - 您正在决定是否在自托管 Gateway 上启用可选的 `oc-path` Plugin
title: "OC Path Plugin"
---

Bundle `oc-path` Plugin 为 `oc://` 工作区文件寻址方案添加了 [`openclaw path`](/cli/path) CLI。它作为 OpenClaw 仓库中的 `extensions/oc-path/` 提供，但是可选的——安装/构建后保持休眠，直到您启用它。

`oc://` 地址指向工作区文件中的单个叶节点（或一组通配符叶节点）。目前 Plugin 理解三种类型的文件：

- **markdown**（`.md`、`.mdx`）：前置元数据、章节、项目、字段
- **jsonc**（`.jsonc`、`.json5`、`.json`）：注释和格式保留
- **jsonl**（`.jsonl`、`.ndjson`）：面向行的记录

自托管者和编辑器扩展使用 CLI 读取或写入单个叶节点，而无需直接针对 SDK 编写脚本；Agent 和 Hook 将其视为确定性基底，使字节保真度往返和编辑保护标记统一应用于各种类型。

## 为什么启用它

当您希望脚本、Hook 或本地 Agent 工具指向工作区状态的精确部分而不为每种文件形状发明解析器时，请启用 `oc-path`。单个 `oc://` 地址可以命名 Markdown 前置元数据键、章节项目、JSONC 配置叶节点或 JSONL 事件字段。

这对于更改应该小、可审计且可重复的维护工作流来说很重要：检查一个值，找到匹配记录，对写入进行预演，然后仅应用该叶节点，同时保留注释、行结尾和附近的格式。将其作为可选 Plugin 使功能用户拥有寻址基底，而无需将解析器依赖或 CLI 界面放入核心，供永远不需要它的安装使用。

启用它的常见原因：

- **本地自动化**：Shell 脚本可以使用 `openclaw path … --json` 解析或更新一个工作区值，而不需要携带单独的 Markdown、JSONC 和 JSONL 解析代码。
- **Agent 可见编辑**：Agent 可以在写入之前显示一个寻址叶节点的预演差异，这比自由格式文件重写更容易审核。
- **编辑器集成**：编辑器可以将 `oc://AGENTS.md/tools/gh` 映射到确切的 Markdown 节点和行号，而无需从标题文本猜测。
- **诊断**：`emit` 通过解析器和发射器对文件进行往返，以便您可以在依赖自动编辑之前检查文件类型是否字节稳定。

具体示例：

```bash
# 此配置中是否启用了 GitHub Plugin？
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# 此 Session 日志中出现了哪些 Tool 调用名称？
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# 这个小配置编辑会写入什么字节？
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

该 Plugin 有意不是更高级语义的所有者。内存 Plugin 仍然拥有内存写入，配置命令仍然拥有完整的配置管理，LKG 逻辑仍然拥有恢复/提升。`oc-path` 是那些更高级工具可以围绕构建的窄寻址和字节保留文件操作层。

## 运行位置

该 Plugin 在调用命令的主机上的 **`openclaw` CLI 进程内**运行。它不需要运行中的 Gateway，也不打开任何网络 Socket——每个动词都是对您指向的文件的纯变换。

Plugin 元数据位于 `extensions/oc-path/openclaw.plugin.json`：

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` 使 Plugin 不在 Gateway 热路径中。`onCommands: ["path"]` 告诉 CLI 在您第一次运行 `openclaw path …` 时延迟加载 Plugin，因此从不使用该动词的安装不会付出任何代价。

## 启用

```bash
openclaw plugins enable oc-path
```

重启 Gateway（如果您运行一个），以便 Manifest 快照采用新状态。同一主机上的裸 `openclaw path` 调用立即生效——CLI 按需加载 Plugin。

禁用方式：

```bash
openclaw plugins disable oc-path
```

## 依赖

所有解析器依赖都是 Plugin 本地的——启用 `oc-path` 不会将新 Package 拉入核心运行时：

| 依赖           | 用途                                                               |
| -------------- | ------------------------------------------------------------------ |
| `commander`    | 为 `resolve`、`find`、`set`、`validate`、`emit` 提供子命令配线。   |
| `jsonc-parser` | JSONC 解析 + 保留注释和尾随逗号的叶节点编辑。                       |
| `markdown-it`  | 用于章节/项目/字段模型的 Markdown 分词。                            |

JSONL 保持手工实现——面向行的解析比任何依赖都简单，而且每行 JSONC 解析已经通过 `jsonc-parser`。

## 提供的内容

| 界面                           | 由何提供                                                        |
| ------------------------------ | --------------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                        |
| `oc://` 解析器/格式化器        | `extensions/oc-path/src/oc-path/oc-path.ts`                     |
| 每种类型的解析/发射/编辑       | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`               |
| 通用解析/查找/设置             | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts`         |
| 编辑保护标记守卫               | `extensions/oc-path/src/oc-path/sentinel.ts`                    |

CLI 是目前唯一的公共界面。基底动词对 Plugin 是私有的；消费者使用 CLI（或针对 SDK 构建自己的 Plugin）。

## 与其他 Plugin 的关系

- **`memory-*`**：内存写入通过内存 Plugin 进行，而非 `oc-path`。`oc-path` 是通用文件基底；内存 Plugin 在其上层叠自己的语义。
- **LKG**：`path` 不了解最后已知良好的配置恢复。如果文件被 LKG 跟踪，下一次 `observe` 调用将决定是否提升或恢复；通过 LKG 提升/恢复生命周期进行原子多设置的 `set --batch` 计划与 LKG 恢复基底一起。

## 安全

`set` 通过基底的发射路径写入原始字节，该路径自动应用编辑保护标记守卫。携带 `__OPENCLAW_REDACTED__`（逐字或作为子字符串）的叶节点在写入时会被拒绝，显示 `OC_EMIT_SENTINEL`。CLI 还从其打印的任何人类或 JSON 输出中清除文字标记，将其替换为 `[REDACTED]`，以便终端捕获和管道永远不会泄漏标记。

## 相关

- [`openclaw path` CLI 参考](/cli/path)
- [管理 Plugin](/plugins/manage-plugins)
- [构建 Plugin](/plugins/building-plugins)
