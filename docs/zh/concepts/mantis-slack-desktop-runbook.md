---
mmh3_hash: "39817fa05adae4cd2824999ba8167929"
summary: "Mantis Slack 桌面端 QA 操作手册：GitHub dispatch、本地 CLI、热 VNC 租约、hydrate 模式、时序解读、产物和故障处理。"
read_when:
  - 从 GitHub 或本地运行 Mantis Slack 桌面端 QA
  - 调试缓慢的 Mantis Slack 桌面端运行
  - 选择 source、prehydrated 或 warm-lease 模式
  - 将截图和视频证据发布到 PR
title: "Mantis Slack 桌面端运行手册"
---

Mantis Slack 桌面端 QA 是针对 Slack 类型 Bug 的真实 UI 测试通道，这类 Bug 需要 Linux 桌面、VNC 救援、Slack Web、真实的 OpenClaw Gateway、截图、视频以及 PR 证据评论。

当单元测试或无界面 Slack live 通道无法证明该 Bug 时，使用此通道。

## 存储模型

Mantis 使用三种不同的存储层：

- Provider 镜像：由 Crabbox 拥有，存储在云 Provider 账户中。包含机器能力，如 Chrome/Chromium、ffmpeg、scrot、Node/corepack/pnpm、原生构建工具和空缓存目录。
- 热租约状态：由当前操作员 Session 拥有。在租约有效期间可包含已登录的浏览器配置文件、`/var/cache/crabbox/pnpm` 和已准备好的源代码检出。
- Mantis 产物：由 OpenClaw 运行拥有。存储在 `.artifacts/qa-e2e/mantis/...` 下，然后 GitHub Actions 上传它们，Mantis GitHub App 在 PR 上内联注释证据。

永远不要将密钥、浏览器 Cookie、Slack 登录状态、仓库检出、`node_modules` 或 `dist/` 放入预制的 Provider 镜像中。

## GitHub dispatch

从 `main` 运行工作流：

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

允许的 `candidate_ref` 值范围被有意限制，因为该工作流使用真实凭据：当前 `main` 的祖先 commit、发布标签，或来自 `openclaw/openclaw` 的开放 PR 头部。

工作流写入：

- 上传产物：`mantis-slack-desktop-smoke-<run-id>-<attempt>`；
- Mantis GitHub App 的内联 PR 评论；
- `slack-desktop-smoke.png`；
- `slack-desktop-smoke.mp4`；
- `slack-desktop-smoke-preview.gif`；
- `slack-desktop-smoke-change.mp4`；
- `mantis-slack-desktop-smoke-summary.json`；
- `mantis-slack-desktop-smoke-report.md`；
- 远程日志，如 `slack-desktop-command.log`、`openclaw-gateway.log`、`chrome.log` 和 `ffmpeg.log`。

PR 评论通过隐藏的 `<!-- mantis-slack-desktop-smoke -->` 标记就地更新。

## 本地 CLI

冷源证明：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

保留 VM 以进行 VNC 救援：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

打开 VNC：

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

复用热租约：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

仅当复用的远程工作区已有 `node_modules` 和构建好的 `dist/` 时，才使用 `--hydrate-mode prehydrated`。若这些文件缺失，Mantis 会以关闭方式失败。

证明原生 Slack 审批 UI：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

审批检查点模式与 `--gateway-setup` 互斥。除非传入显式的审批检查点 `--scenario` 标志，否则它运行可选的 `slack-approval-exec-native` 和 `slack-approval-plugin-native` 场景；其他 Slack 场景在 VM 启动前会被拒绝。Slack QA 运行器从其观察到的真实 Slack API 消息写入每个检查点 JSON 文件，然后远程监视器将该消息快照渲染到 `approval-checkpoints/<scenario>-pending.png` 和 `approval-checkpoints/<scenario>-resolved.png`。如果任何检查点 JSON、消息证据、ack JSON 或渲染的截图缺失或为空，则运行失败。

冷的 GitHub Actions 租约没有 Slack Web Cookie，因此其浏览器捕获可能会停留在 Slack 登录页面。对于审批检查点证明，请信任渲染的检查点图像和 Slack QA 产物，而非 `slack-desktop-smoke.png`。仅当浏览器截图本身必须显示 Slack Web 时，才使用保留的带有手动登录 Slack Web 配置文件的热租约。

## Hydrate 模式

| 模式           | 使用场景                       | 远程行为                                                                           | 权衡                         |
| -------------- | ------------------------------ | ---------------------------------------------------------------------------------- | ---------------------------- |
| `source`       | 正常 PR 证明、冷机器、CI       | 在 VM 内运行 `pnpm install --frozen-lockfile --prefer-offline` 和 `pnpm build`     | 最慢，源代码检出证明最强     |
| `prehydrated`  | 您有意准备了复用租约           | 需要已有的 `node_modules` 和 `dist/`；跳过安装/构建                               | 快速，但仅适用于操作员控制的热租约 |

GitHub Actions 始终在 VM 运行前准备候选检出。其 pnpm store 按 OS、Node 版本和锁文件缓存。VM source 运行也会在存在时使用 `/var/cache/crabbox/pnpm`。

## 时序解读

`mantis-slack-desktop-smoke-report.md` 包含阶段时序：

- `crabbox.warmup`：云 Provider 启动、桌面/浏览器就绪和 SSH。
- `crabbox.inspect`：租约元数据查询。
- `credentials.prepare`：Convex 凭据租约获取。
- `crabbox.remote_run`：同步、浏览器启动、OpenClaw 安装/构建或 hydrate 验证、Gateway 启动、截图和视频捕获。
- `artifacts.copy`：从 VM rsync 回本地。

当 Mantis 已复制元数据证明 OpenClaw Gateway 设置已完成或 Slack QA 命令本身已成功退出后，若 Crabbox 返回非零远程状态，`crabbox.remote_run` 可被标记为 `accepted`。将 `accepted` 视为带解释的通过，而非场景失败。

如果运行缓慢：

- warmup 占主导：预制或推广更好的 Crabbox Provider 镜像；
- source 模式下 remote_run 占主导：使用热租约、改善 pnpm store 复用，或将机器先决条件移入 Provider 镜像；
- prehydrated 模式下 remote_run 占主导：远程工作区未真正就绪，或 Gateway/浏览器/Slack 设置很慢；
- artifact copy 占主导：检查视频大小和产物目录内容。

## 证据清单

良好的 PR 评论应展示：

- 场景 ID 和候选 SHA；
- GitHub Actions 运行 URL；
- 产物 URL；
- 内联审批检查点截图，或来自已登录热租约的 Slack Web 截图；
- 有动态预览时的内联动态预览；
- 完整 MP4 和裁剪 MP4 链接；
- 通过/失败状态；
- 附带报告中的时序摘要。

不要将截图或视频提交到仓库中。将它们保存在 GitHub Actions 产物或 PR 评论中。

## 故障处理

如果工作流在 VM 运行前失败，先检查 Actions 作业。典型原因有：不受信任的 `candidate_ref`、缺少环境密钥或候选安装/构建失败。

如果 VM 运行失败但截图已复制回来，请检查：

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

如果运行保留了租约，使用报告中的 `crabbox vnc ...` 命令打开 VNC。完成后停止租约：

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

如果 Slack 登录已过期，在保留的租约上通过 VNC 修复，然后使用 `--lease-id` 重新运行。不要将该浏览器配置文件烧录进 Provider 镜像。

## 相关

- [QA 概述](/concepts/qa-e2e-automation)
- [Slack Channel](/channels/slack)
- [测试](/help/testing)
