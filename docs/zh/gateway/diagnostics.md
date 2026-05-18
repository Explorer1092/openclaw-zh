---
mmh3_hash: "69c1a29f6ede5df301eb75b00bd27b26"
summary: "为 bug 报告创建可共享的 Gateway 诊断包"
title: "Diagnostics export"
read_when:
  - 准备 bug 报告或支持请求
  - 调试 Gateway 崩溃、重启、内存压力或超大有效负载
  - 审查记录或编辑了哪些诊断数据
---

OpenClaw 可以创建一个本地诊断 zip，用于 bug 报告。它结合了经过净化的 Gateway 状态、健康状况、日志、配置形状和最近无有效负载的稳定性事件。

在审查诊断包之前，请将其视为敏感信息。它们设计为省略或编辑有效负载和凭证，但仍汇总本地 Gateway 日志和主机级运行时状态。

## 快速开始

```bash
openclaw gateway diagnostics export
```

该命令打印写入的 zip 路径。选择路径：

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

用于自动化：

```bash
openclaw gateway diagnostics export --json
```

## 聊天命令

Owner 可以在聊天中使用 `/diagnostics [note]` 请求本地 Gateway 导出。当 bug 发生在真实对话中且您希望获得一份可复制粘贴的支持报告时使用此命令：

1. 在您注意到问题的对话中发送 `/diagnostics`。如有帮助，可添加简短说明，例如 `/diagnostics bad tool choice`。
2. OpenClaw 发送诊断前言并请求一次明确的 exec 批准。该批准运行 `openclaw gateway diagnostics export --json`。不要通过 allow-all 规则批准诊断。
3. 批准后，OpenClaw 回复一份可粘贴的报告，包含本地包路径、清单摘要、隐私说明和相关 Session id。

在群聊中，owner 仍可运行 `/diagnostics`，但 OpenClaw 不会将诊断详情发布回共享聊天。它通过私人批准路由将前言、批准提示、Gateway 导出结果和 Codex Session/线程明细发送给 owner。群聊只收到诊断流程已私下发送的简短通知。如果 OpenClaw 找不到私人 owner 路由，该命令以关闭状态失败并要求 owner 从私信中运行。

当活跃的 OpenClaw Session 使用原生 OpenAI Codex harness 时，同一 exec 批准还涵盖 OpenClaw 已知的 Codex 运行时线程的 OpenAI 反馈上传。该上传独立于本地 Gateway zip，且仅对 Codex harness Session 显示。批准前，提示会说明批准诊断也将发送 Codex 反馈，但不列出 Codex Session 或线程 id。批准后，聊天回复会列出已发送到 OpenAI 服务器的线程的 Channel、OpenClaw Session id、Codex 线程 id 和本地恢复命令。如果您拒绝或忽略批准，OpenClaw 不会运行导出、不发送 Codex 反馈，也不打印 Codex id。

这使常见的 Codex 调试循环变得简短：在 Telegram、Discord 或其他 Channel 中注意到异常行为，运行 `/diagnostics`，批准一次，将报告分享给支持团队，然后如果想在本地检查原生 Codex 线程，运行打印的 `codex resume <thread-id>` 命令。参见 [Codex harness](/plugins/codex-harness#inspect-codex-threads-locally) 了解检查工作流。

## 导出包含的内容

zip 包含：

- `summary.md`：面向支持的人类可读概述。
- `diagnostics.json`：配置、日志、状态、健康和稳定性数据的机器可读摘要。
- `manifest.json`：导出元数据和文件列表。
- 净化的配置形状和非密钥配置详情。
- 净化的日志摘要和最近经过编辑的日志行。
- 尽力而为的 Gateway 状态和健康快照。
- `stability/latest.json`：最新持久化的稳定性包（如果可用）。

即使 Gateway 不健康，导出也很有用。如果 Gateway 无法响应状态或健康请求，本地日志、配置形状和最新稳定性包在可用时仍会被收集。

## 隐私模型

诊断设计为可共享的。导出保留有助于调试的操作数据，例如：

- 子系统名称、Plugin id、Provider id、Channel id 和配置的模式
- 状态码、持续时间、字节数、队列状态和内存读数
- 净化的日志元数据和经过编辑的操作消息
- 配置形状和非密钥功能设置

导出省略或编辑：

- 聊天文本、prompt、指令、webhook 正文和工具输出
- 凭据、API 密钥、token、cookie 和密钥值
- 原始请求或响应正文
- 账户 id、消息 id、原始 Session id、主机名和本地用户名

当日志消息看起来像用户、聊天、prompt 或工具有效负载文本时，导出只保留该消息被省略的记录和字节数。

## 稳定性记录器

启用诊断时，Gateway 默认记录有界的、无有效负载的稳定性流。它记录操作事实，而非内容。

同一诊断心跳在 Gateway 持续运行但 Node.js 事件循环或 CPU 看起来饱和时记录活跃度样本。这些 `diagnostic.liveness.warning` 事件包括事件循环延迟、事件循环利用率、CPU 核心比率、活跃/等待/排队 Session 计数、当前启动/运行时阶段（已知时）、最近阶段时间跨度和有界的活跃/排队工作标签。空闲样本在遥测中保持 `info` 级别。仅当工作正在等待或排队，或活跃工作与持续的事件循环延迟重叠时，活跃度样本才成为 Gateway 警告。在其他健康的后台工作期间出现的瞬间最大延迟峰值保持在调试日志中，它们本身不会重启 Gateway。

启动阶段也会发出带有挂钟和 CPU 计时的 `diagnostic.phase.completed` 事件。当最后一次 bridge 进度看起来是终止状态（例如原始响应项或响应完成事件）但 Gateway 仍认为嵌入式运行活跃时，停滞的嵌入式运行诊断会将 `terminalProgressStale=true` 标记为 true。

检查实时记录器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在致命退出、关闭超时或重启启动失败后检查最新持久化的稳定性包：

```bash
openclaw gateway stability --bundle latest
```

从最新持久化的包创建诊断 zip：

```bash
openclaw gateway stability --bundle latest --export
```

事件存在时，持久化包位于 `~/.openclaw/logs/stability/` 下。

## 有用的选项

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`：写入特定 zip 路径。
- `--log-lines <count>`：要包含的最大净化日志行数。
- `--log-bytes <bytes>`：要检查的最大日志字节数。
- `--url <url>`：用于状态和健康快照的 Gateway WebSocket URL。
- `--token <token>`：用于状态和健康快照的 Gateway token。
- `--password <password>`：用于状态和健康快照的 Gateway 密码。
- `--timeout <ms>`：状态和健康快照超时。
- `--no-stability-bundle`：跳过持久化稳定性包查找。
- `--json`：打印机器可读的导出元数据。

## 禁用诊断

诊断默认启用。要禁用稳定性记录器和诊断事件收集：

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

禁用诊断会减少 bug 报告的细节。它不影响正常的 Gateway 日志记录。

关键内存压力快照默认关闭。要保留诊断事件并同时捕获预 OOM 稳定性快照：

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

仅在关键内存压力期间可以承受额外文件系统扫描和快照写入的主机上使用此选项。快照关闭时，普通内存压力事件仍记录 RSS、heap、阈值和增长事实。

## 相关文档

- [健康检查](/gateway/health)
- [Gateway CLI](/cli/gateway#gateway-diagnostics-export)
- [Gateway 协议](/gateway/protocol#system-and-identity)
- [日志记录](/logging)
- [OpenTelemetry 导出](/gateway/opentelemetry) — 将诊断流式传输到收集器的独立流程
