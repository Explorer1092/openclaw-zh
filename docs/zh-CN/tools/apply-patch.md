---
mmh3_hash: "d2c0ca5b3e1de8584a1b98527bc6ba1a"
read_when:
  - 你需要跨多个文件进行结构化编辑
  - 你想要记录或调试基于补丁的编辑
summary: 使用 apply_patch 工具应用多文件补丁
title: apply_patch 工具
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: tools/apply-patch.md
  workflow: 15
---

# apply_patch 工具

使用结构化补丁格式应用文件更改。这非常适合多文件或多段编辑，在这些场景下单次 `edit` 调用会很脆弱。

该工具接受一个 `input` 字符串，其中包含一个或多个文件操作：

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

- `input`（必填）：完整的补丁内容，包括 `*** Begin Patch` 和 `*** End Patch`。

## 说明

- 补丁路径支持相对路径（从工作区目录）和绝对路径。
- `tools.exec.applyPatch.workspaceOnly` 默认为 `true`（仅限工作区）。仅在你有意想让 `apply_patch` 在工作区目录之外写入/删除时才设置为 `false`。
- 在 `*** Update File:` 段中使用 `*** Move to:` 可重命名文件。
- 需要时使用 `*** End of File` 标记仅在文件末尾的插入。
- 对于 OpenAI 和 OpenAI Codex 模型默认可用。设置 `tools.exec.applyPatch.enabled: false` 可禁用。
- 可选通过 `tools.exec.applyPatch.allowModels` 按模型进行限制。
- 配置仅在 `tools.exec` 下。

## 示例

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
