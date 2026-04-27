---
mmh3_hash: "2702062b4793f255b7103b4895db1403"
summary: "为 bug 报告创建可共享的 Gateway 诊断包"
title: "诊断导出"
read_when:
  - 准备 bug 报告或支持请求
  - 调试 Gateway 崩溃、重启、内存压力或超大有效负载
  - 审查记录或编辑了哪些诊断数据
---

OpenClaw 可以创建一个本地诊断 zip，可以安全地附加到 bug 报告中。它结合了经过净化的 Gateway 状态、健康状况、日志、配置形状和最近无有效负载的稳定性事件。

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

## 相关文档

- [健康检查](/gateway/health)
- [Gateway CLI](/cli/gateway#gateway-diagnostics-export)
- [Gateway 协议](/gateway/protocol#system-and-identity)
- [日志记录](/logging)
- [OpenTelemetry 导出](/gateway/opentelemetry) — 将诊断流式传输到收集器的独立流程
