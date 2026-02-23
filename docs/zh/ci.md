---
mmh3_hash: "388401ebda2f46f6c6dc929e0892583a"
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
| `changed-scope`     | 检测哪些区域发生变更（node/macos/android）      | 非文档 PR                 |
| `check`             | TypeScript 类型检查、lint、格式化               | 非文档变更                |
| `check-docs`        | Markdown lint + 断链检查                        | 文档变更时                |
| `code-analysis`     | 代码行数阈值检查（1000 行）                     | 仅 PR                     |
| `secrets`           | 检测泄露的密钥                                  | 始终                      |
| `build-artifacts`   | 一次性构建 dist 并与其他任务共享                | 非文档、node 变更         |
| `release-check`     | 验证 npm pack 内容                              | 构建后                    |
| `checks`            | Node/Bun 测试 + 协议检查                        | 非文档、node 变更         |
| `checks-windows`    | Windows 专项测试                                | 非文档、node 变更         |
| `macos`             | Swift lint/构建/测试 + TS 测试                  | 有 macOS 变更的 PR        |
| `android`           | Gradle 构建 + 测试                              | 非文档、android 变更      |

## 快速失败顺序

任务排列顺序使得廉价检查先于昂贵检查失败：

1. `docs-scope` + `code-analysis` + `check`（并行，约 1-2 分钟）
2. `build-artifacts`（依赖上述任务）
3. `checks`、`checks-windows`、`macos`、`android`（依赖构建）

## 运行器

| 运行器                            | 任务                                        |
| --------------------------------- | ------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`   | 大多数 Linux 任务，包括范围检测             |
| `blacksmith-16vcpu-windows-2025`  | `checks-windows`                            |
| `macos-latest`                    | `macos`、`ios`                              |

## 本地等效命令

```bash
pnpm check          # 类型检查 + lint + 格式化
pnpm test           # vitest 测试
pnpm check:docs     # 文档格式化 + lint + 断链检查
pnpm release:check  # 验证 npm pack
```
