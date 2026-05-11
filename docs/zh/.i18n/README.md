---
mmh3_hash: "cd47e5f72af0aa1ff6d3c4c7a267b3cd"
---
# OpenClaw 文档国际化资源

本目录存储源文档仓库的翻译配置。

生成的语言树和实时翻译记忆库现在位于发布仓库中：

- 仓库：`openclaw/docs`
- 本地检出：`~/Projects/openclaw-docs`

## 真相来源

- 英文文档在 `openclaw/openclaw` 中编写。
- 源文档树位于 `docs/` 下。
- 源仓库不再保留已提交的生成语言树，如 `docs/zh-CN/**`、`docs/zh-TW/**`、`docs/ja-JP/**`、`docs/es/**`、`docs/pt-BR/**`、`docs/ko/**`、`docs/de/**`、`docs/fr/**`、`docs/ar/**`、`docs/it/**`、`docs/vi/**`、`docs/nl/**`、`docs/fa/**`、`docs/tr/**`、`docs/uk/**`、`docs/id/**`、`docs/pl/**` 或 `docs/th/**`。

## 端到端流程

1. 在 `openclaw/openclaw` 中编辑英文文档。
2. 推送到 `main`。
3. `openclaw/openclaw/.github/workflows/docs-sync-publish.yml` 将文档树镜像到 `openclaw/docs`。
4. 同步脚本重写发布 `docs/docs.json`，使生成的语言选择器块存在于那里，即使它们不再在源仓库中提交。
5. `openclaw/docs/.github/workflows/translate-all.yml` 等待 `main` 稳定后，仅翻译过时或缺失的语言页面，并上传每种语言的产物。
6. 发布仓库的最终处理器应用成功的语言产物，并推送一个聚合的 `chore(i18n): refresh translations` 提交。
7. 每周的 `full` 运行会协调每个语言/页面路径，以便在不影响热门文档提交的情况下重试偶发的模型格式失败。

## 为什么存在这种分割

- 将生成的语言输出保持在主产品仓库之外。
- 在单一发布文档树上维护 Mintlify。
- 通过让发布仓库拥有生成的语言树，为 Mintlify 支持的生成语言保留内置语言切换器。
- 保留生成的泰语（`th`）和波斯语（`fa`）文档及翻译记忆库，即使 Mintlify 当前不接受这些代码作为 `navigation.languages`。它们不在内置文档语言选择器中，是宿主限制问题，而非翻译运行失败。

## 语言可见性

- Control UI 支持 `en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl` 和 `fa`。
- 文档翻译工作流在 `openclaw/docs` 中生成相同的非英语语言集。
- Mintlify 文档语言选择器只能公开 Mintlify `navigation.languages` 接受的语言；目前包括越南语（`vi`）和荷兰语（`nl`），但不包括泰语（`th`）或波斯语（`fa`）。
- 不要将生成的 `docs/docs.json` 中缺少 `th` 或 `fa` 条目视为流程失败。请改为在 `openclaw/docs` 中验证其生成的文件夹。

## 本目录中的文件

- `glossary.<lang>.json` — 首选术语映射，用作提示引导。
- `zh-Hans-navigation.json` — 在同步期间重新插入发布仓库的精心策划的 zh-Hans Mintlify 语言导航。
- `ar-navigation.json`、`de-navigation.json`、`es-navigation.json`、`fr-navigation.json`、`id-navigation.json`、`it-navigation.json`、`ja-navigation.json`、`ko-navigation.json`、`pl-navigation.json`、`pt-BR-navigation.json` 和 `tr-navigation.json` — 与源仓库一起保存的起始语言元数据，但发布同步现在为 clone-en 语言克隆完整的英文导航树，以便翻译页面在 Mintlify 中可见，而无需手动维护每语言导航 JSON。
- `<lang>.tm.jsonl` — 翻译记忆库，按工作流 + 模型 + 文本哈希索引。

在此仓库中，生成的语言 TM 文件（如 `docs/.i18n/zh-CN.tm.jsonl`、`docs/.i18n/zh-TW.tm.jsonl`、`docs/.i18n/ja-JP.tm.jsonl`、`docs/.i18n/es.tm.jsonl`、`docs/.i18n/pt-BR.tm.jsonl`、`docs/.i18n/ko.tm.jsonl`、`docs/.i18n/de.tm.jsonl`、`docs/.i18n/fr.tm.jsonl`、`docs/.i18n/ar.tm.jsonl`、`docs/.i18n/it.tm.jsonl`、`docs/.i18n/vi.tm.jsonl`、`docs/.i18n/nl.tm.jsonl`、`docs/.i18n/fa.tm.jsonl`、`docs/.i18n/tr.tm.jsonl`、`docs/.i18n/uk.tm.jsonl`、`docs/.i18n/id.tm.jsonl`、`docs/.i18n/pl.tm.jsonl` 和 `docs/.i18n/th.tm.jsonl`）有意不再提交。

## 术语表格式

`glossary.<lang>.json` 是一个条目数组：

```json
{
  "source": "troubleshooting",
  "target": "故障排除"
}
```

字段：

- `source`：英文（或源）短语。
- `target`：首选翻译输出。

## 翻译机制

- `scripts/docs-i18n` 仍然负责翻译生成。
- 文档模式将 `x-i18n.source_hash` 写入每个翻译页面。
- 发布工作流通过将当前英文源哈希与存储的语言 `x-i18n.source_hash` 进行比较来预计算待处理文件列表。
- 如果待处理数量为 `0`，则完全跳过昂贵的翻译步骤。
- 如果有待处理文件，工作流仅翻译这些文件。
- 语言 Worker 会重试瞬态模型格式失败，但未更改的文件保持跳过，因为相同的哈希检查在每次重试时运行。
- 语言 Worker 上传产物；发布仓库的最终处理器将所有成功的语言输出一起提交。
- 已发布的 GitHub Releases 会分发一次聚合的翻译刷新，以便发布文档无需等待每周协调即可跟上。

## 操作说明

- 同步元数据写入发布仓库中的 `.openclaw-sync/source.json`。
- 源仓库 secret：`OPENCLAW_DOCS_SYNC_TOKEN`
- 发布仓库 secret：`OPENCLAW_DOCS_I18N_OPENAI_API_KEY`
- 如果语言输出看起来过时，请首先检查 `openclaw/docs` 中的 `Translate All` 工作流。
