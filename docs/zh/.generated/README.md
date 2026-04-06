---
mmh3_hash: "efd9a637b0866f0bd3585af2f7cdabe2"
---
# 生成的文档工件

SHA-256 哈希文件是被追踪的漂移检测工件。完整的 JSON 基准在本地生成（已在 .gitignore 中忽略），仅供检查使用。

**已追踪（提交到 git）：**

- `config-baseline.sha256` — 配置基准 JSON 工件的哈希。
- `plugin-sdk-api-baseline.sha256` — Plugin SDK API 基准工件的哈希。

**仅本地（已忽略）：**

- `config-baseline.json`、`config-baseline.core.json`、`config-baseline.channel.json`、`config-baseline.plugin.json`
- `plugin-sdk-api-baseline.json`、`plugin-sdk-api-baseline.jsonl`

请勿手动编辑这些文件。

- 重新生成配置基准：`pnpm config:docs:gen`
- 验证配置基准：`pnpm config:docs:check`
- 重新生成 Plugin SDK API 基准：`pnpm plugin-sdk:api:gen`
- 验证 Plugin SDK API 基准：`pnpm plugin-sdk:api:check`
