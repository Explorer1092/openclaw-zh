---
mmh3_hash: "eff063ce4c0e0aa2db21b75d413a11cf"
summary: "捆绑 `oc-path` Plugin：为 `oc://` 工作区文件寻址方案提供 `openclaw path` CLI"
read_when:
  - 您想从终端检查或编辑工作区文件中的单个叶节点
  - 您正在针对工作区状态编写脚本，需要一种稳定的、与类型无关的寻址方案
  - 您正在决定是否在自托管 Gateway 上启用可选的 `oc-path` Plugin
title: "OC Path Plugin"
doc-schema-version: 1
---

捆绑的 `oc-path` Plugin 为 `oc://` 工作区文件寻址方案添加了 [`openclaw path`](/cli/path) CLI。它在 OpenClaw 仓库的 `extensions/oc-path/` 下提供，但采用选择加入方式——安装/构建后，直到启用之前它处于休眠状态。

`oc://` 地址指向工作区文件内的单个叶节点（或通配符叶节点集合）。该 Plugin 目前了解四种类型的文件：

- **markdown**（`.md`、`.mdx`）：前置元数据、节、条目、字段
- **jsonc**（`.jsonc`、`.json5`、`.json`）：注释和格式已保留
- **jsonl**（`.jsonl`、`.ndjson`）：面向行的记录
- **yaml**（`.yaml`、`.yml`、`.lobster`）：通过 YAML 文档 API 处理映射/序列/标量节点

自托管者和编辑器扩展使用 CLI 读取或写入单个叶节点，而无需直接对 SDK 编写脚本；Agent 和 Hook 将其视为确定性底层，因此字节保真度往返和修订哨兵守护统一适用于各种类型。

## 为何启用

当您希望脚本、Hook 或本地 Agent 工具指向精确的工作区状态片段，而无需为每种文件形状发明解析器时，请启用 `oc-path`。单个 `oc://` 地址可以命名 markdown 前置元数据键、节条目、JSONC 配置叶节点、JSONL 事件字段或 YAML 工作流步骤。

这对于维护者工作流很重要，其中更改应该是小型的、可审计的和可重复的：检查一个值，找到匹配记录，干运行写入，然后只应用该叶节点，同时保留注释、行尾和附近的格式。将其作为可选 Plugin 保持给高级用户提供寻址底层，而不会将解析器依赖项或 CLI 表面放入从不需要它的安装的 Core 中。

常见的启用原因：

- **本地自动化**：Shell 脚本可以使用 `openclaw path … --json` 解析或更新一个工作区值，而无需携带单独的 markdown、JSONC、JSONL 和 YAML 解析代码。
- **Agent 可见编辑**：Agent 可以在写入之前显示一个已寻址叶节点的干运行 diff，这比自由格式文件重写更易于审查。
- **编辑器集成**：编辑器可以将 `oc://AGENTS.md/tools/gh` 映射到确切的 markdown 节点和行号，而无需从标题文本猜测。
- **诊断**：`emit` 通过解析器和发射器往返一个文件，因此您可以在依赖自动编辑之前检查文件类型是否字节稳定。

具体示例：

```bash
# 此配置中是否启用了 GitHub Plugin？
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# 此 Session 日志中出现了哪些 Tool 调用名称？
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# 这个小配置编辑会写入哪些字节？
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

该 Plugin 故意不是更高级语义的所有者。内存 Plugin 仍然拥有内存写入，配置命令仍然拥有完整的配置管理，LKG 逻辑仍然拥有恢复/提升。`oc-path` 是那些更高级工具可以构建的狭窄寻址和字节保留文件操作层。

## 运行位置

该 Plugin **在调用命令的主机上的 `openclaw` CLI 进程内运行**。它不需要运行中的 Gateway，也不开放任何网络套接字——每个动词都是对您指向的文件的纯转换。

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

`onStartup: false` 将 Plugin 保留在 Gateway 热路径之外。`onCommands: ["path"]` 告诉 CLI 在您第一次运行 `openclaw path …` 时懒加载 Plugin，因此从不使用该动词的安装不付出任何代价。

## 启用

```bash
openclaw plugins enable oc-path
```

重启 Gateway（如果您运行了一个），以便 Manifest 快照获取新状态。裸 `openclaw path` 调用在同一主机上立即有效——CLI 按需加载 Plugin。

使用以下命令禁用：

```bash
openclaw plugins disable oc-path
```

## 依赖项

所有解析器依赖项都是 Plugin 本地的——启用 `oc-path` 不会向核心运行时引入新包：

| 依赖项         | 用途                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | `resolve`、`find`、`set`、`validate`、`emit` 的子命令连接。            |
| `jsonc-parser` | 保留注释和尾随逗号的 JSONC 解析加叶节点编辑。                          |
| `markdown-it`  | 节/条目/字段模型的 Markdown 标记化。                                   |
| `yaml`         | 保留注释和流样式的 YAML `Document` 解析/发射/编辑。                    |

JSONL 保持手动实现——面向行的解析比任何依赖项都更简单，每行 JSONC 解析已经通过 `jsonc-parser`。

## 提供内容

| 表面                           | 由何提供                                                        |
| ------------------------------ | --------------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                        |
| `oc://` 解析器/格式化器        | `extensions/oc-path/src/oc-path/oc-path.ts`                     |
| 每种类型的解析/发射/编辑       | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`          |
| 通用 resolve / find / set      | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts`         |
| 修订哨兵守护                   | `extensions/oc-path/src/oc-path/sentinel.ts`                    |

目前 CLI 是唯一的公共表面。底层动词对 Plugin 是私有的；消费者使用 CLI（或针对 SDK 构建自己的 Plugin）。

## 与其他 Plugin 的关系

- **`memory-*`**：内存写入通过内存 Plugin 进行，而不是 `oc-path`。`oc-path` 是通用文件底层；内存 Plugin 在其上分层自己的语义。
- **LKG**：`path` 不了解 Last-Known-Good 配置恢复。如果文件被 LKG 追踪，下一次 `observe` 调用决定是否提升或恢复；通过 LKG 提升/恢复生命周期进行原子多设置的 `set --batch` 计划与 LKG 恢复底层一起推出。

## 安全性

`set` 通过底层的发射路径写入原始字节，该路径自动应用修订哨兵守护。携带 `__OPENCLAW_REDACTED__`（逐字或作为子字符串）的叶节点在写入时以 `OC_EMIT_SENTINEL` 被拒绝。CLI 还会从它打印的任何人机或 JSON 输出中清除字面哨兵，将其替换为 `[REDACTED]`，因此终端捕获和管道永远不会泄漏该标记。

## 相关

- [`openclaw path` CLI 参考](/cli/path)
- [管理 Plugin](/plugins/manage-plugins)
- [构建 Plugin](/plugins/building-plugins)
