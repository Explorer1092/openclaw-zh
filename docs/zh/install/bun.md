---
mmh3_hash: "c8d0fa880176864472fb08c78d1ac14a"
title: "Bun（实验性）"
sidebarTitle: "Bun"
summary: "Bun 工作流（实验性）：安装以及与 pnpm 相比的注意事项"
read_when:
  - 你想要最快的本地开发循环 (bun + watch)
  - 你遇到了 Bun install/patch/生命周期脚本问题
---

# Bun（实验性）

<Warning>
Bun **不推荐用于 Gateway 运行时**（WhatsApp 和 Telegram 存在已知问题）。生产环境请使用 Node。
</Warning>

Bun 是一个可选的本地运行时，用于直接运行 TypeScript（`bun run ...`、`bun --watch ...`）。默认包管理器仍为 `pnpm`，完全支持且被文档工具使用。Bun 无法使用 `pnpm-lock.yaml`，会忽略它。

## 安装

<Steps>
  <Step title="安装依赖">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已被 gitignore，因此不会产生仓库变动。要完全跳过锁文件写入：

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="构建和测试">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## 生命周期脚本

Bun 会阻止依赖的生命周期脚本，除非明确信任。对于此仓库，通常被阻止的脚本不是必需的：

- `@whiskeysockets/baileys` `preinstall` -- 检查 Node major >= 20（OpenClaw 默认使用 Node 24，仍支持 Node 22 LTS，目前为 `22.14+`）
- `protobufjs` `postinstall` -- 发出关于不兼容版本方案的警告（无构建工件）

如果你遇到需要这些脚本的运行时问题，明确信任它们：

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 注意事项

一些脚本仍然硬编码了 pnpm（例如 `docs:build`、`ui:*`、`protocol:check`）。暂时通过 pnpm 运行这些脚本。
