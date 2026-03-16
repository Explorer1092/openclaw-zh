---
mmh3_hash: "e7d595761aade425bfabe546d8c00137"
title: "CI 流水线"
summary: "CI 任务图、范围控制门以及本地等效命令"
read_when:
  - 需要了解某个 CI 任务是否运行及其原因
  - 调试失败的 GitHub Actions 检查
---

# CI 流水线

CI 在每次推送到 `main` 分支以及每个拉取请求时运行。它使用智能范围控制，当仅有文档或原生代码发生变更时跳过开销较大的任务。

## 任务概览

| 任务                | 用途                                            | 运行时机                  |
| ------------------- | ----------------------------------------------- | ------------------------- |
| `docs-scope`        | 检测是否仅有文档变更                            | 始终                      |
| `changed-scope`     | 检测哪些区域发生变更（node/macos/android/windows） | 非文档 PR              |
| `check`             | TypeScript 类型检查、lint、格式化               | 非文档、node 相关变更     |
| `check-docs`        | Markdown lint + 断链检查                        | 文档变更时                |
| `secrets`           | 检测泄露的密钥                                  | 始终                      |
| `build-artifacts`   | 一次性构建 dist 并与 `release-check` 共享       | 推送到 `main`、node 变更  |
| `release-check`     | 验证 npm pack 内容                              | 推送到 `main`，构建后     |
| `checks`            | Node 测试 + PR 协议检查；push 时 Bun 兼容测试  | 非文档、node 变更         |
| `compat-node22`     | 最低支持 Node 运行时兼容性                      | 推送到 `main`、node 变更  |
| `checks-windows`    | Windows 专项测试                                | 非文档、windows 相关变更  |
| `macos`             | Swift lint/构建/测试 + TS 测试                  | 有 macOS 变更的 PR        |
| `android`           | Gradle 构建 + 测试                              | 非文档、android 变更      |

## 快速失败顺序

任务排列顺序使得廉价检查先于昂贵检查失败：

1. `docs-scope` + `changed-scope` + `check` + `secrets`（并行，先运行廉价门控）
2. PR：`checks`（Linux Node 测试拆分为 2 个分片）、`checks-windows`、`macos`、`android`
3. 推送到 `main`：`build-artifacts` + `release-check` + Bun 兼容性 + `compat-node22`

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。

## 运行器

| 运行器                            | 任务                                        |
| --------------------------------- | ------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`   | 大多数 Linux 任务，包括范围检测             |
| `blacksmith-32vcpu-windows-2025`  | `checks-windows`                            |
| `macos-latest`                    | `macos`、`ios`                              |

## 本地等效命令

```bash
pnpm check          # 类型检查 + lint + 格式化
pnpm test           # vitest 测试
pnpm check:docs     # 文档格式化 + lint + 断链检查
pnpm release:check  # 验证 npm pack
```
