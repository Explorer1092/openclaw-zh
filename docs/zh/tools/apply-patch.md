---
mmh3_hash: "332a3a7ca377e588578fa83fccc4efb8"
summary: "使用 apply_patch 工具应用多文件补丁"
read_when:
  - 需要跨多个文件进行结构化编辑
  - 想记录或调试基于补丁的编辑
title: "apply_patch 工具"
---

使用结构化补丁格式应用文件更改。这非常适合多文件或多块编辑，因为单个 `edit` 调用在这种情况下可能不够稳定。

该工具接受一个包含一个或多个文件操作的 `input` 字符串：

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## 参数

- `input`（必填）：包含 `*** Begin Patch` 和 `*** End Patch` 的完整补丁内容。

## 注意事项

- 补丁路径支持相对路径（从工作区目录开始）和绝对路径。
- `tools.exec.applyPatch.workspaceOnly` 默认为 `true`（限于工作区内）。仅在您有意希望 `apply_patch` 在工作区目录之外写入/删除时，才将其设置为 `false`。
- 在 `*** Update File:` 块中使用 `*** Move to:` 来重命名文件。
- `*** End of File` 标记仅需要 EOF 插入时的情况。
- 默认适用于 OpenAI 和 OpenAI Codex 模型。设置 `tools.exec.applyPatch.enabled: false` 可禁用它。
- 可选地通过 `tools.exec.applyPatch.allowModels` 按模型设置门控。
- 配置仅在 `tools.exec` 下。

## 示例

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## 相关

<CardGroup cols={2}>
  <Card title="Diffs" href="/tools/diffs" icon="code-compare">
    用于变更展示的只读 diff 查看器。
  </Card>
  <Card title="Exec 工具" href="/tools/exec" icon="terminal">
    从 Agent 执行 Shell 命令。
  </Card>
  <Card title="代码执行" href="/tools/code-execution" icon="square-code">
    使用 xAI 进行沙箱化远程 Python 分析。
  </Card>
</CardGroup>
