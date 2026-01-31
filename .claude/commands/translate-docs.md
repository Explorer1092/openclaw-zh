---
description: "Check and translate missing or outdated Chinese docs"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Translate Docs

Run the i18n check script, then translate missing or outdated documents.

## Steps

1. Run the check script:
   ```bash
   bun scripts/docs-i18n-hash.ts check
   ```

2. Review the output. It will list:
   - **Missing**: English docs with no `.zh.md` counterpart
   - **Outdated**: `.zh.md` files whose `mmh3_hash` does not match the current English source

3. For each file that needs work (missing or outdated):
   a. Read the English source file.
   b. If a `.zh.md` exists, read it too to understand what changed.
   c. Create or update the `.zh.md` translation following the rules in the project-guide skill.
   d. After writing the translation, run:
      ```bash
      bun scripts/docs-i18n-hash.ts update <path-to-file.zh.md>
      ```

4. After all translations are done, run the check again to confirm everything is up to date:
   ```bash
   bun scripts/docs-i18n-hash.ts check
   ```

5. Report a summary of what was translated/updated.
