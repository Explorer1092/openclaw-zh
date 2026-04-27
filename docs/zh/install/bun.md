---
mmh3_hash: "65d5210981e00423990ca22e6f4e77cf"
title: "Bun（实验性）"
sidebarTitle: "Bun"
summary: "Bun 工作流（实验性）：安装以及与 pnpm 相比的注意事项"
read_when:
  - 你想要最快的本地开发循环（bun + watch）
  - 你遇到了 Bun 安装/补丁/生命周期脚本问题
---

<Warning>
**不建议将 Bun 用于 gateway 运行时**（与 WhatsApp 和 Telegram 存在已知问题）。生产环境请使用 Node。
</Warning>

Bun 是一个可选的本地运行时，用于直接运行 TypeScript（`bun run ...`、`bun --watch ...`）。默认的包管理器仍然是 `pnpm`，它完全受支持并被文档工具使用。Bun 无法使用 `pnpm-lock.yaml`，会忽略它。

## 安装

<Steps>
  <Step title="安装依赖">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已被 gitignored，因此不会产生仓库抖动。如需完全跳过 lockfile 写入：

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

Bun 会阻止依赖的生命周期脚本，除非明确信任。对于此仓库，常见的被阻止脚本并非必需：

- `@whiskeysockets/baileys` `preinstall` — 检查 Node 主版本 >= 20（OpenClaw 默认使用 Node 24，仍支持 Node 22 LTS，当前为 `22.14+`）
- `protobufjs` `postinstall` — 发出关于不兼容版本方案的警告（无构建产出物）

如果你遇到需要这些脚本的运行时问题，请明确信任它们：

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 注意事项

某些脚本仍然硬编码 pnpm（例如 `docs:build`、`ui:*`、`protocol:check`）。目前请通过 pnpm 运行这些脚本。

## 相关

- [安装概览](/install)
- [Node.js](/install/node)
- [更新](/install/updating)
