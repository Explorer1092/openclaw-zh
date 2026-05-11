---
mmh3_hash: "952daf12fc57d796ffe49b253559b97b"
---
# 文档指南

本目录负责文档编写、Mintlify 链接规则和文档国际化策略。

## Mintlify 规则

- 文档托管在 Mintlify（`https://docs.openclaw.ai`）。
- `docs/**/*.md` 中的内部文档链接必须保持根相对路径，不带 `.md` 或 `.mdx` 后缀（示例：`[Config](/gateway/configuration)`）。
- 章节交叉引用应在根相对路径上使用锚点（示例：`[Hooks](/gateway/configuration-reference#hooks)`）。
- 文档标题应避免使用破折号和撇号，因为 Mintlify 锚点生成在这些情况下不稳定。
- README 和其他 GitHub 渲染文档应保留绝对文档 URL，以便链接在 Mintlify 外部也能正常工作。
- 文档内容必须保持通用性：不包含个人设备名称、主机名或本地路径；使用 `user@gateway-host` 等占位符。

## 文档内容规则

- 对于文档、UI 文案和选择器列表，除非该章节明确描述运行时顺序或自动检测顺序，否则请按字母顺序排列服务/Provider。
- 保持捆绑 Plugin 命名与根目录 `AGENTS.md` 中的 repo 范围 Plugin 术语规则一致。

## 内部文档

- 长期私有运维文档应存放在 `~/Projects/manager/docs/`。
- 仓库本地的内部草稿/镜像文档可存放在被 git 忽略的 `docs/internal/` 下。
- 永远不要将 `docs/internal/**` 页面添加到 `docs/docs.json` 导航，也不要从公开文档中链接它们。
- `scripts/docs-sync-publish.mjs` 会排除并从公开的 `openclaw/docs` 发布仓库中清除 `docs/internal/**`，即使之后有页面被强制添加进来。
- 内部文档可以提及仓库路径、私有应用名称、1Password 条目名称和运维手册，但绝不包含密钥值。

## 文档国际化

- 本仓库不维护外语文档。生成的发布输出存储在单独的 `openclaw/docs` 仓库中（通常在本地克隆为 `../openclaw-docs`）。
- 请勿在此处添加或编辑 `docs/<locale>/**` 下的本地化文档。
- 将本仓库中的英文文档及词汇表文件视为事实来源。
- 流程：在此处更新英文文档，根据需要更新 `docs/.i18n/glossary.<locale>.json`，然后让发布仓库同步并在 `openclaw/docs` 中运行 `scripts/docs-i18n`。
- 在重新运行 `scripts/docs-i18n` 之前，为任何新技术术语、页面标题或必须保留英文或使用固定翻译的简短导航标签添加词汇表条目。
- `pnpm docs:check-i18n-glossary` 是已更改英文文档标题和简短内部文档标签的守护程序。
- 翻译记忆库存储在发布仓库中生成的 `docs/.i18n/*.tm.jsonl` 文件中。
- 参见 `docs/.i18n/README.md`。
