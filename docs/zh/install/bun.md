---
title: "Bun (实验性)"
sidebarTitle: "Bun"
mmh3_hash: "2b375926112a91ff7c3c7ad72fd1b24d"
summary: "Bun 工作流（实验性）：安装以及与 pnpm 相比的注意事项"
read_when:
  - 你想要最快的本地开发循环 (bun + watch)
  - 你遇到了 Bun install/patch/生命周期脚本问题
---

# Bun (实验性)

目标：使用 **Bun** 运行此仓库（可选，不推荐用于 WhatsApp/Telegram），而不偏离 pnpm 工作流。

⚠️ **不推荐用于网关运行时** (WhatsApp/Telegram bug)。生产环境请使用 Node。

## 状态

- Bun 是一个可选的本地运行时，用于直接运行 TypeScript (`bun run …`, `bun --watch …`)。
- `pnpm` 是构建的默认值，并保持完全支持（并被一些文档工具使用）。
- Bun 不能使用 `pnpm-lock.yaml` 并将忽略它。

## 安装

默认：

```sh
bun install
```

注意：`bun.lock`/`bun.lockb` 已被 gitignode，所以无论哪种方式都没有仓库变动。如果你想要 *无锁文件写入*：

```sh
bun install --no-save
```

## 构建 / 测试 (Bun)

```sh
bun run build
bun run vitest run
```

## Bun 生命周期脚本 (默认阻止)

Bun 可能会阻止依赖生命周期脚本，除非明确信任 (`bun pm untrusted` / `bun pm trust`)。
对于此仓库，通常阻止的脚本不是必需的：

- `@whiskeysockets/baileys` `preinstall`: 检查 Node major >= 20 (我们运行 Node 22+)。
- `protobufjs` `postinstall`: 发出关于不兼容版本方案的警告（无构建工件）。

如果你遇到需要这些脚本的真实运行时问题，请明确信任它们：

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 警告

- 一些脚本仍然硬编码了 pnpm (例如 `docs:build`, `ui:*`, `protocol:check`)。暂时通过 pnpm 运行这些。
