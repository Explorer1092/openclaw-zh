---
mmh3_hash: "8a493ce35aca4ec2a3b4d20c17ce83e5"
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

    `bun.lock` / `bun.lockb` 已被 gitignore，因此不会产生仓库变更。若要完全跳过 lockfile 写入：

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

Bun 会阻止依赖项的生命周期脚本，除非明确信任。对于本仓库，通常被阻止的脚本不是必需的：

- `baileys` `preinstall` -- 检查 Node 主版本 >= 20（OpenClaw 默认使用 Node 24，仍支持 Node 22 LTS，当前 `22.19+`）
- `protobufjs` `postinstall` -- 发出关于不兼容版本方案的警告（无构建产物）

如果你遇到需要这些脚本的运行时问题，请明确信任它们：

```sh
bun pm trust baileys protobufjs
```

## 注意事项

部分脚本仍然硬编码使用 pnpm（例如 `docs:build`、`ui:*`、`protocol:check`）。目前请通过 pnpm 运行这些脚本。

## 相关

- [安装概览](/install)
- [Node.js](/install/node)
- [更新](/install/updating)
