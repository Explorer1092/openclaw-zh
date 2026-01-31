---
description: "Project-wide conventions and guidelines that apply to all work in this repository"
---

# Project Guide

This skill defines project-wide conventions. Follow these rules at all times.

## Documentation Translation (i18n)

### Rules

1. **Every `docs/**/*.md` must have a corresponding `.zh.md` Chinese translation.**
   - Example: `docs/start/getting-started.md` → `docs/start/getting-started.zh.md`
   - Exclude: files already ending in `.zh.md`, `README.md`, changelogs, and non-doc markdown.

2. **`.zh.md` frontmatter must include `mmh3_hash`** — the MurmurHash3-128 hex digest of the full English source file contents.
   ```yaml
   ---
   mmh3_hash: "a1b2c3d4e5f6..."
   ---
   ```

3. **Translation quality:**
   - Preserve all Mintlify components (`<Card>`, `<Tabs>`, `<Accordion>`, etc.) and code blocks as-is.
   - Keep links as root-relative paths (no `.md`/`.mdx` suffix per Mintlify convention).
   - Translate prose naturally; do not machine-translate-dump. Keep technical terms (CLI flags, command names, config keys) untranslated.
   - Preserve the original frontmatter fields (`summary`, `read_when`, etc.) and translate their values.

4. **When creating or modifying an English `.md` doc, you must also create or update its `.zh.md` counterpart.**
   - After translation, run `bun scripts/docs-i18n-hash.ts update <file.zh.md>` to stamp the hash.

5. **Checking translation status:**
   - Run `bun scripts/docs-i18n-hash.ts check` to see missing or outdated translations.

---

*Future sections: add additional project-wide conventions below this line.*
