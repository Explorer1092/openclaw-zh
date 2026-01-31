#!/usr/bin/env bun
/**
 * docs-i18n-hash.ts — Zero-dependency i18n hash checker for docs translations.
 *
 * Uses MurmurHash3-128 (x64 variant) to track English source changes.
 *
 * Usage:
 *   bun scripts/docs-i18n-hash.ts check [--json]
 *   bun scripts/docs-i18n-hash.ts generate <file.md>
 *   bun scripts/docs-i18n-hash.ts update <file.zh.md>
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname, basename, join } from "node:path";
import { globSync } from "node:fs";

// ─── MurmurHash3 x64 128-bit (pure JS) ────────────────────────────────────
// Based on the canonical implementation by Austin Appleby, ported to JS BigInt.

function murmurhash3_x64_128(keyBytes: Uint8Array, seed = 0): string {
  const len = keyBytes.length;
  const nblocks = Math.floor(len / 16);

  let h1 = BigInt(seed);
  let h2 = BigInt(seed);

  const c1 = 0x87c37b91114253d5n;
  const c2 = 0x4cf5ad432745937fn;
  const mask64 = 0xffffffffffffffffn;

  const view = new DataView(keyBytes.buffer, keyBytes.byteOffset, keyBytes.byteLength);

  function rotl64(x: bigint, r: number): bigint {
    return ((x << BigInt(r)) | (x >> BigInt(64 - r))) & mask64;
  }

  function fmix64(k: bigint): bigint {
    k = ((k ^ (k >> 33n)) * 0xff51afd7ed558ccdn) & mask64;
    k = ((k ^ (k >> 33n)) * 0xc4ceb9fe1a85ec53n) & mask64;
    k = k ^ (k >> 33n);
    return k;
  }

  function getBlock64(i: number): bigint {
    const offset = i * 8;
    // Little-endian read
    const lo = BigInt(view.getUint32(offset, true));
    const hi = BigInt(view.getUint32(offset + 4, true));
    return (hi << 32n) | lo;
  }

  // body
  for (let i = 0; i < nblocks; i++) {
    let k1 = getBlock64(i * 2);
    let k2 = getBlock64(i * 2 + 1);

    k1 = (k1 * c1) & mask64;
    k1 = rotl64(k1, 31);
    k1 = (k1 * c2) & mask64;
    h1 ^= k1;

    h1 = rotl64(h1, 27);
    h1 = (h1 + h2) & mask64;
    h1 = (h1 * 5n + 0x52dce729n) & mask64;

    k2 = (k2 * c2) & mask64;
    k2 = rotl64(k2, 33);
    k2 = (k2 * c1) & mask64;
    h2 ^= k2;

    h2 = rotl64(h2, 31);
    h2 = (h2 + h1) & mask64;
    h2 = (h2 * 5n + 0x38495ab5n) & mask64;
  }

  // tail
  const tail = nblocks * 16;
  let k1 = 0n;
  let k2 = 0n;

  const remaining = len & 15;
  if (remaining >= 15) k2 ^= BigInt(keyBytes[tail + 14]) << 48n;
  if (remaining >= 14) k2 ^= BigInt(keyBytes[tail + 13]) << 40n;
  if (remaining >= 13) k2 ^= BigInt(keyBytes[tail + 12]) << 32n;
  if (remaining >= 12) k2 ^= BigInt(keyBytes[tail + 11]) << 24n;
  if (remaining >= 11) k2 ^= BigInt(keyBytes[tail + 10]) << 16n;
  if (remaining >= 10) k2 ^= BigInt(keyBytes[tail + 9]) << 8n;
  if (remaining >= 9) {
    k2 ^= BigInt(keyBytes[tail + 8]);
    k2 = (k2 * c2) & mask64;
    k2 = rotl64(k2, 33);
    k2 = (k2 * c1) & mask64;
    h2 ^= k2;
  }

  if (remaining >= 8) k1 ^= BigInt(keyBytes[tail + 7]) << 56n;
  if (remaining >= 7) k1 ^= BigInt(keyBytes[tail + 6]) << 48n;
  if (remaining >= 6) k1 ^= BigInt(keyBytes[tail + 5]) << 40n;
  if (remaining >= 5) k1 ^= BigInt(keyBytes[tail + 4]) << 32n;
  if (remaining >= 4) k1 ^= BigInt(keyBytes[tail + 3]) << 24n;
  if (remaining >= 3) k1 ^= BigInt(keyBytes[tail + 2]) << 16n;
  if (remaining >= 2) k1 ^= BigInt(keyBytes[tail + 1]) << 8n;
  if (remaining >= 1) {
    k1 ^= BigInt(keyBytes[tail]);
    k1 = (k1 * c1) & mask64;
    k1 = rotl64(k1, 31);
    k1 = (k1 * c2) & mask64;
    h1 ^= k1;
  }

  // finalization
  h1 ^= BigInt(len);
  h2 ^= BigInt(len);

  h1 = (h1 + h2) & mask64;
  h2 = (h2 + h1) & mask64;

  h1 = fmix64(h1);
  h2 = fmix64(h2);

  h1 = (h1 + h2) & mask64;
  h2 = (h2 + h1) & mask64;

  // Output as 32 hex chars (h1 ++ h2, little-endian per half)
  const hex1 = h1.toString(16).padStart(16, "0");
  const hex2 = h2.toString(16).padStart(16, "0");
  return hex1 + hex2;
}

function hashFile(filePath: string): string {
  const content = readFileSync(filePath);
  return murmurhash3_x64_128(new Uint8Array(content));
}

// ─── Frontmatter helpers ───────────────────────────────────────────────────

function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string; raw: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  const raw = match[1];
  const body = match[2];
  const frontmatter: Record<string, string> = {};
  // Simple YAML-like parse for scalar values
  for (const line of raw.split("\n")) {
    const kv = line.match(/^(\w[\w_-]*):\s*"?([^"]*)"?\s*$/);
    if (kv) frontmatter[kv[1]] = kv[2];
  }
  return { frontmatter, body, raw };
}

function upsertHash(zhPath: string, newHash: string): void {
  const content = readFileSync(zhPath, "utf-8");
  const fmMatch = content.match(/^(---\n)([\s\S]*?)(\n---\n)([\s\S]*)$/);

  if (fmMatch) {
    const fmBody = fmMatch[2];
    const rest = fmMatch[4];
    let updatedFm: string;
    if (/^mmh3_hash:/m.test(fmBody)) {
      updatedFm = fmBody.replace(/^mmh3_hash:.*$/m, `mmh3_hash: "${newHash}"`);
    } else {
      updatedFm = `mmh3_hash: "${newHash}"\n${fmBody}`;
    }
    writeFileSync(zhPath, `---\n${updatedFm}\n---\n${rest}`);
  } else {
    // No frontmatter — prepend one
    writeFileSync(zhPath, `---\nmmh3_hash: "${newHash}"\n---\n${content}`);
  }
}

// ─── Glob helper (works with Node 22+ or Bun) ─────────────────────────────

function findDocs(docsDir: string): string[] {
  // Use a simple recursive walk instead of globSync for compatibility
  const results: string[] = [];
  const { readdirSync, statSync } = require("node:fs");

  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".md") && !entry.name.endsWith(".zh.md")) {
        results.push(full);
      }
    }
  }

  walk(docsDir);
  return results.sort();
}

// ─── Commands ──────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dir ?? dirname(new URL(import.meta.url).pathname), "..");
const DOCS = join(ROOT, "docs");

function cmdCheck(jsonOutput: boolean) {
  const docs = findDocs(DOCS);
  const missing: string[] = [];
  const outdated: { file: string; expected: string; actual: string }[] = [];
  const ok: string[] = [];

  for (const doc of docs) {
    const rel = doc.slice(ROOT.length + 1);
    const zhPath = doc.replace(/\.md$/, ".zh.md");
    const zhRel = zhPath.slice(ROOT.length + 1);

    if (!existsSync(zhPath)) {
      missing.push(rel);
      continue;
    }

    const expectedHash = hashFile(doc);
    const zhContent = readFileSync(zhPath, "utf-8");
    const fm = parseFrontmatter(zhContent);
    const actualHash = fm?.frontmatter?.mmh3_hash ?? "";

    if (actualHash !== expectedHash) {
      outdated.push({ file: rel, expected: expectedHash, actual: actualHash || "(none)" });
    } else {
      ok.push(rel);
    }
  }

  if (jsonOutput) {
    console.log(JSON.stringify({ missing, outdated, ok }, null, 2));
    return;
  }

  if (missing.length === 0 && outdated.length === 0) {
    console.log(`✓ All ${ok.length} docs have up-to-date translations.`);
    return;
  }

  if (missing.length > 0) {
    console.log(`\n⚠ Missing translations (${missing.length}):`);
    for (const f of missing) console.log(`  - ${f}`);
  }

  if (outdated.length > 0) {
    console.log(`\n⚠ Outdated translations (${outdated.length}):`);
    for (const o of outdated)
      console.log(`  - ${o.file}  (hash: ${o.actual.slice(0, 12)}… → ${o.expected.slice(0, 12)}…)`);
  }

  if (ok.length > 0) {
    console.log(`\n✓ Up-to-date: ${ok.length}`);
  }

  process.exit(missing.length + outdated.length > 0 ? 1 : 0);
}

function cmdGenerate(file: string) {
  const resolved = resolve(file);
  if (!existsSync(resolved)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }
  console.log(hashFile(resolved));
}

function cmdUpdate(zhFile: string) {
  const resolved = resolve(zhFile);
  if (!existsSync(resolved)) {
    console.error(`File not found: ${zhFile}`);
    process.exit(1);
  }
  if (!resolved.endsWith(".zh.md")) {
    console.error(`Expected a .zh.md file, got: ${zhFile}`);
    process.exit(1);
  }
  const enPath = resolved.replace(/\.zh\.md$/, ".md");
  if (!existsSync(enPath)) {
    console.error(`English source not found: ${enPath}`);
    process.exit(1);
  }
  const hash = hashFile(enPath);
  upsertHash(resolved, hash);
  console.log(`Updated ${zhFile} with mmh3_hash: ${hash}`);
}

// ─── CLI entry ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const cmd = args[0];

switch (cmd) {
  case "check":
    cmdCheck(args.includes("--json"));
    break;
  case "generate":
    if (!args[1]) {
      console.error("Usage: docs-i18n-hash.ts generate <file>");
      process.exit(1);
    }
    cmdGenerate(args[1]);
    break;
  case "update":
    if (!args[1]) {
      console.error("Usage: docs-i18n-hash.ts update <file.zh.md>");
      process.exit(1);
    }
    cmdUpdate(args[1]);
    break;
  default:
    console.error("Usage: docs-i18n-hash.ts <check|generate|update> [args]");
    process.exit(1);
}
