---
mmh3_hash: "dc65ae51d0b3160216e2be1683716fcf"
title: "CI 流水线"
summary: "CI 任务图、范围控制门以及本地等效命令"
read_when:
  - 需要了解某个 CI 任务是否运行及其原因
  - 调试失败的 GitHub Actions 检查
---

# CI 流水线

CI 在每次推送到 `main` 分支以及每个拉取请求时运行。它使用智能范围控制，当仅有不相关区域发生变更时跳过开销较大的任务。

## 任务概览

| 任务                        | 用途                                                                   | 运行时机                     |
| --------------------------- | ---------------------------------------------------------------------- | ---------------------------- |
| `preflight`                 | 检测仅文档变更、变更范围、变更扩展，并构建 CI 清单                     | 非草稿推送和 PR 时始终运行   |
| `security-fast`             | 私钥检测、通过 `zizmor` 的工作流审计、生产依赖审计                     | 非草稿推送和 PR 时始终运行   |
| `build-artifacts`           | 一次性构建 `dist/` 和 Control UI，上传可复用工件供下游任务使用         | Node 相关变更                |
| `checks-fast-core`          | 快速 Linux 正确性通道，如打包/插件合约/协议检查                        | Node 相关变更                |
| `checks-fast-extensions`    | 在 `checks-fast-extensions-shard` 完成后聚合扩展分片通道               | Node 相关变更                |
| `extension-fast`            | 仅针对变更的捆绑插件的专注测试                                         | 检测到扩展变更时             |
| `check`                     | CI 中的主本地门控：`pnpm check` 加 `pnpm build:strict-smoke`           | Node 相关变更                |
| `check-additional`          | 架构和边界保护以及 Gateway watch 回归测试                              | Node 相关变更                |
| `build-smoke`               | 已构建 CLI 冒烟测试和启动内存冒烟测试                                  | Node 相关变更                |
| `checks`                    | 较重的 Linux Node 通道：完整测试、Channel 测试和仅推送 Node 22 兼容性  | Node 相关变更                |
| `check-docs`                | 文档格式化、lint 和断链检查                                            | 文档变更时                   |
| `skills-python`             | Python 支持 Skill 的 Ruff + pytest                                     | Python Skill 相关变更        |
| `checks-windows`            | Windows 专项测试通道                                                   | Windows 相关变更             |
| `macos-node`                | macOS TypeScript 测试通道，使用共享构建工件                            | macOS 相关变更               |
| `macos-swift`               | macOS 应用的 Swift lint、构建和测试                                    | macOS 相关变更               |
| `android`                   | Android 构建和测试矩阵                                                 | Android 相关变更             |

## 快速失败顺序

任务排列顺序使得廉价检查先于昂贵检查失败：

1. `preflight` 决定哪些通道存在。`docs-scope` 和 `changed-scope` 逻辑是此任务中的步骤，而非独立任务。
2. `security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 快速失败，无需等待较重的工件和平台矩阵任务。
3. `build-artifacts` 与快速 Linux 通道重叠，以便下游消费者可以在共享构建就绪后立即启动。
4. 较重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-extensions`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
独立的 `install-smoke` 工作流通过其自己的 `preflight` 任务复用相同的范围脚本。它从较窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装冒烟测试仅在安装、打包和容器相关变更时运行。

推送时，`checks` 矩阵添加仅推送的 `compat-node22` 通道。在拉取请求上，该通道被跳过，矩阵专注于正常的测试/Channel 通道。

## 运行器

| 运行器                            | 任务                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`   | `preflight`、`security-fast`、`build-artifacts`、Linux 检查、文档检查、Python Skill、`android` |
| `blacksmith-32vcpu-windows-2025`  | `checks-windows`                                                                            |
| `macos-latest`                    | `macos-node`、`macos-swift`                                                                 |

## 本地等效命令

```bash
pnpm check          # 类型检查 + lint + 格式化
pnpm build:strict-smoke
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm check:docs     # 文档格式化 + lint + 断链检查
pnpm build          # 当 CI 工件/build-smoke 通道重要时构建 dist
```
