---
mmh3_hash: "54480f06f26e65b657af3e6dfc35013a"
summary: "`openclaw meeting-notes` 的 CLI 参考（列出、显示和定位存储的会议记录）"
read_when:
  - 您想在终端中读取存储的会议记录摘要
  - 您需要会议记录 Markdown 摘要的路径
  - 您正在调试 meeting-notes Plugin 的存储布局
title: "Meeting Notes CLI"
---

# `openclaw meeting-notes`

检查由外部 `meeting-notes` Plugin 写入的会议记录。此 CLI 为只读模式，在该 Plugin 已安装或从源代码加载时可用。捕获、导入和摘要生成由 `meeting_notes` Agent 工具及已配置的自动启动来源负责。

当您需要查找昨天的记录、在编辑器中打开 Markdown 文件、将转录文本传递给其他工具，或调试会话在磁盘上的存储位置时，请使用 CLI。它不会启动或停止捕获。

工件存储在 OpenClaw 状态目录下：

```text
$OPENCLAW_STATE_DIR/meeting-notes/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

默认状态目录为 `~/.openclaw`；设置 `OPENCLAW_STATE_DIR` 可使用其他目录。日期目录来自会话开始时间，会话目录是从会话 ID 派生的安全文件系统段。

## 命令

```bash
openclaw meeting-notes list
openclaw meeting-notes show <session>
openclaw meeting-notes show YYYY-MM-DD/<session>
openclaw meeting-notes path <session>
openclaw meeting-notes path YYYY-MM-DD/<session>
openclaw meeting-notes path <session> --dir
openclaw meeting-notes path <session> --metadata
openclaw meeting-notes path <session> --transcript
openclaw meeting-notes list --json
openclaw meeting-notes show <session> --json
openclaw meeting-notes path <session> --json
```

- `list`：列出存储的会话，包含日期限定选择器、开始时间、标题和 `summary.md` 路径。
- `show <session>`：打印存储的 `summary.md`。
- `path <session>`：打印 `summary.md` 路径。
- `path <session> --dir`：打印会话目录。
- `path <session> --metadata`：打印 `metadata.json`。
- `path <session> --transcript`：打印 `transcript.jsonl`。
- `--json`：打印机器可读输出。

当人类可读的会话 ID 在多天中重复时，请使用 `list` 中的日期限定选择器，例如 `openclaw meeting-notes show 2026-05-22/standup`。默认会话 ID 包含时间戳和随机后缀；仅在同一天内唯一时才配置固定会话 ID。

## 输出

`list` 每行打印一个会话：

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  每周站会  /Users/alex/.openclaw/meeting-notes/2026-05-22/standup/summary.md
```

输出以制表符分隔。列分别为：选择器、开始时间、标题和摘要路径。选择器是传递给 `show` 或 `path` 的最安全值。

`list --json` 打印包含以下字段的对象：

- `sessionId`
- `selector`
- `date`
- `title`
- `startedAt`
- `stoppedAt`
- `source`
- `path`
- `summaryPath`
- `hasSummary`

`show --json` 返回存储的会话元数据、选择器、会话目录、摘要路径和摘要 Markdown 文本。`path --json` 返回选定路径及该文件是否存在。

## 同一天多个会议

Meeting Notes 按日期分组会话，再按会话 ID 分组。同一天的十个会议将成为十个同级文件夹：

```text
~/.openclaw/meeting-notes/2026-05-22/
  meeting-2026-05-22T09-00-00-000Z-a1b2c3d4/
  meeting-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

大多数自动化场景使用默认生成的 ID。仅在同一天不会重复使用时才使用固定 ID，例如 `standup`。

## 缺少摘要

实时会话在停止时写入 `summary.md`。导入的转录文本在导入后立即写入 `summary.md`。当捕获正在进行、Provider 在停止时失败，或元数据在任何发言到达之前已写入时，会话仍可能出现在 `list` 中但没有摘要。

使用 `path <session> --transcript` 检查仅追加的转录文件，并使用 `meeting_notes` 工具的 `summarize` 操作重新生成 Markdown 摘要。

相关文档：[Meeting Notes](/plugins/meeting-notes)（配置、自动启动和来源 Provider 详情）。
