---
mmh3_hash: "04a36b78c47e0955de9dd061b8710974"
---
# OpenClaw 文档国际化资源

本目录存储源文档仓库的翻译配置。

生成的语言树和实时翻译记忆库现在位于发布仓库中：

- 仓库：`openclaw/docs`
- 本地检出：`~/Projects/openclaw-docs`

## 真相来源

- 英文文档在 `openclaw/openclaw` 中编写。
- 源文档树位于 `docs/` 下。
- 源仓库不再保留已提交的生成语言树，如 `docs/zh-CN/**`、`docs/ja-JP/**`、`docs/es/**`、`docs/pt-BR/**`、`docs/ko/**`、`docs/de/**`、`docs/fr/**`、`docs/ar/**`、`docs/it/**`、`docs/tr/**`、`docs/uk/**`、`docs/id/**` 或 `docs/pl/**`。

## 端到端流程

1. 在 `openclaw/openclaw` 中编辑英文文档。
2. 推送到 `main`。
3. `openclaw/openclaw/.github/workflows/docs-sync-publish.yml` 将文档树镜像到 `openclaw/docs`。
4. 同步脚本重写发布 `docs/docs.json`，使生成的语言选择器块存在于那里，即使它们不再在源仓库中提交。
5. `openclaw/docs/.github/workflows/translate-zh-cn.yml` 每天、按需以及在源仓库发布分发后刷新 `docs/zh-CN/**`。
6. `openclaw/docs/.github/workflows/translate-ja-jp.yml` 对 `docs/ja-JP/**` 执行相同操作。
7. `translate-es.yml`、`translate-pt-br.yml`、`translate-ko.yml`、`translate-de.yml`、`translate-fr.yml`、`translate-ar.yml`、`translate-it.yml`、`translate-tr.yml`、`translate-uk.yml`、`translate-id.yml` 和 `translate-pl.yml` 对相应语言目录执行相同操作。

## 为什么存在这种分割

- 将生成的语言输出保持在主产品仓库之外。
- 在单一发布文档树上维护 Mintlify。
- 通过让发布仓库拥有生成的语言树，保留内置语言切换器。

## 本目录中的文件

- `glossary.<lang>.json` — 首选术语映射，用作提示引导。
- `zh-Hans-navigation.json` — 在同步期间重新插入发布仓库的精心策划的 zh-Hans Mintlify 语言导航。
- `ar-navigation.json`、`de-navigation.json`、`es-navigation.json`、`fr-navigation.json`、`id-navigation.json`、`it-navigation.json`、`ja-navigation.json`、`ko-navigation.json`、`pl-navigation.json`、`pt-BR-navigation.json`、`tr-navigation.json` — 与源仓库一起保存的起始语言元数据，但发布同步现在为这些语言克隆完整的英文导航树，以便翻译页面在 Mintlify 中可见，而无需手动维护每语言导航 JSON。
- `<lang>.tm.jsonl` — 翻译记忆库，按工作流 + 模型 + 文本哈希索引。

在此仓库中，生成的语言 TM 文件（如 `docs/.i18n/zh-CN.tm.jsonl`、`docs/.i18n/ja-JP.tm.jsonl` 等）有意不再提交。

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
- 每个发布工作流通过将当前英文源哈希与存储的语言 `x-i18n.source_hash` 进行比较来预计算待处理文件列表。
- 如果待处理数量为 `0`，则完全跳过昂贵的翻译步骤。
- 如果有待处理文件，工作流仅翻译这些文件。
- 发布工作流重试瞬态模型格式失败，但未更改的文件保持跳过，因为相同的哈希检查在每次重试时运行。
- 源仓库还在发布的 GitHub 发布后分发 zh-CN、ja-JP、es、pt-BR、ko、de、fr、ar、it、tr、uk、id 和 pl 刷新，以便发布文档可以赶上，而无需等待每日 cron。

## 操作说明

- 同步元数据写入发布仓库中的 `.openclaw-sync/source.json`。
- 源仓库 secret：`OPENCLAW_DOCS_SYNC_TOKEN`
- 发布仓库 secret：`OPENCLAW_DOCS_I18N_OPENAI_API_KEY`
- 如果语言输出看起来过时，请首先检查 `openclaw/docs` 中匹配的 `Translate <locale>` 工作流。
