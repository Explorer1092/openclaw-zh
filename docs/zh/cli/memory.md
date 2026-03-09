---
mmh3_hash: "574a3a30cbf3cd82a65ed4f9247a2b38"
title: "`openclaw memory`"
sidebarTitle: "openclaw memory"
summary: "`openclaw memory` 的 CLI 参考(状态/索引/搜索)"
read_when:
  - 您想索引或搜索语义内存
  - 您正在调试内存可用性或索引
---

# `openclaw memory`

管理语义内存索引和搜索。
由活动内存插件提供(默认:`memory-core`;设置 `plugins.slots.memory = "none"` 以禁用)。

相关:

- 内存概念:[内存](/concepts/memory)
- Plugin:[Plugin](/tools/plugin)

## 示例

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## 选项

`memory status` 和 `memory index`:

- `--agent <id>`:范围限定到单个 Agent。不使用时,这些命令对每个配置的 Agent 运行;如果未配置 Agent 列表,则回退到默认 Agent。
- `--verbose`:在探测和索引期间发出详细日志。

`memory status`:

- `--deep`:探测向量 + 嵌入可用性。
- `--index`:如果存储脏了则运行重新索引(隐含 `--deep`)。
- `--json`:打印 JSON 输出。

`memory index`:

- `--force`:强制完整重新索引。

`memory search`:

- 查询输入:传递位置参数 `[query]` 或 `--query <text>`。
- 如果两者都提供,`--query` 优先。
- 如果两者都未提供,命令以错误退出。
- `--agent <id>`:范围限定到单个 Agent(默认:默认 Agent)。
- `--max-results <n>`:限制返回结果的数量。
- `--min-score <n>`:过滤掉低分匹配。
- `--json`:打印 JSON 结果。

注意:

- `memory index --verbose` 打印每个阶段的详细信息(提供商、模型、源、批处理活动)。
- `memory status` 包括通过 `memorySearch.extraPaths` 配置的任何额外路径。
- 如果有效的活动内存远程 API 密钥字段配置为 SecretRef,命令会从活动 Gateway 快照解析这些值。如果 Gateway 不可用,命令会快速失败。
- Gateway 版本偏差说明:此命令路径需要支持 `secrets.resolve` 的 Gateway;较旧的 Gateway 会返回未知方法错误。
