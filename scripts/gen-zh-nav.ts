#!/usr/bin/env bun
/**
 * gen-zh-nav.ts — Generate Mintlify docs.json with zh language navigation.
 *
 * Reads the existing docs.json, duplicates the navigation for zh language,
 * keeping only pages that have a Chinese translation in docs/zh/.
 *
 * Usage: bun scripts/gen-zh-nav.ts
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(import.meta.dir ?? new URL(".", import.meta.url).pathname, "..");
const DOCS_JSON = join(ROOT, "docs", "docs.json");
const ZH_DIR = join(ROOT, "docs", "zh");

const config = JSON.parse(readFileSync(DOCS_JSON, "utf-8"));

// Group name translations
const groupNames: Record<string, string> = {
  "Start Here": "开始使用",
  "Help": "帮助",
  "Install & Updates": "安装与更新",
  "CLI": "命令行",
  "Core Concepts": "核心概念",
  "Gateway & Ops": "网关与运维",
  "Web & Interfaces": "Web 与界面",
  "Channels": "消息通道",
  "Providers": "模型提供商",
  "Automation & Hooks": "自动化与钩子",
  "Tools & Skills": "工具与技能",
  "Nodes & Media": "节点与媒体",
  "Platforms": "平台",
  "macOS Companion App": "macOS 伴侣应用",
  "Reference & Templates": "参考与模板",
};

const nav = config.navigation;

// Build zh navigation: mirror groups but only include pages with translations
const zhGroups: { group: string; pages: string[] }[] = [];

for (const group of nav.groups) {
  const zhPages: string[] = [];
  for (const page of group.pages) {
    const zhFile = join(ZH_DIR, page + ".md");
    if (existsSync(zhFile)) {
      zhPages.push("zh/" + page);
    }
  }
  if (zhPages.length > 0) {
    zhGroups.push({
      group: groupNames[group.group] || group.group,
      pages: zhPages,
    });
  }
}

// Convert to Mintlify i18n format: languages array
config.navigation = {
  languages: [
    {
      language: "en",
      groups: nav.groups,
    },
    {
      language: "zh",
      groups: zhGroups,
    },
  ],
};

writeFileSync(DOCS_JSON, JSON.stringify(config, null, 2) + "\n");

const totalZh = zhGroups.reduce((n, g) => n + g.pages.length, 0);
console.log(`Updated docs.json: ${zhGroups.length} groups, ${totalZh} zh pages`);
