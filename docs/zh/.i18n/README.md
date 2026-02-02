---
mmh3_hash: "dcff6f09bccc0b1841a01553aac1b8c8"
---
# OpenClaw 文档国际化资源

本目录存储文档翻译的**生成文件**和**配置文件**。

## 文件

- `glossary.<lang>.json` — 首选术语映射（用于提示引导）。
- `<lang>.tm.jsonl` — 翻译记忆库（缓存），按工作流 + 模型 + 文本哈希索引。

## 术语表格式

`glossary.<lang>.json` 是一个条目数组：

```json
{
  "source": "troubleshooting",
  "target": "故障排除",
  "ignore_case": true,
  "whole_word": false
}
```

字段：

- `source`：英文（或源）短语。
- `target`：首选翻译输出。

## 注意事项

- 术语表条目作为**提示引导**传递给模型（无确定性重写）。
- 翻译记忆库由 `scripts/docs-i18n` 更新。
