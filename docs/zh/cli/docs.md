---
mmh3_hash: "803e841f82a4b168636768648dc1d7aa"
summary: "`openclaw docs` 的 CLI 参考（搜索实时文档索引）"
read_when:
  - 您想从终端搜索实时 OpenClaw 文档
  - 您需要了解 docs CLI 调用了哪些辅助二进制文件
title: "Docs"
---

# `openclaw docs`

从终端搜索实时 OpenClaw 文档索引。该命令调用 Mintlify 托管的公共 docs MCP 搜索端点 `https://docs.openclaw.ai/mcp.search_open_claw`，并在终端中渲染结果。

## 用法

```bash
openclaw docs                       # 打印文档入口点和示例搜索
openclaw docs <query...>            # 搜索实时文档索引
```

参数：

| 参数         | 描述                                                                               |
| ------------ | ---------------------------------------------------------------------------------- |
| `[query...]` | 自由格式搜索查询。多词查询以空格连接并作为一个整体发送。                           |

## 示例

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

不带查询时，`openclaw docs` 打印文档入口点 URL 加上示例搜索命令，而不是运行搜索。

## 工作原理

`openclaw docs` 调用 `mcporter` CLI 来调用文档搜索 MCP 工具，然后将工具输出中的 `Title: / Link: / Content:` 块解析为结果列表。

为了解析 `mcporter`，OpenClaw 按顺序检查：

1. `PATH` 上的 `mcporter`（如果存在则直接使用）。
2. `pnpm dlx mcporter ...`（如果安装了 `pnpm`）。
3. `npx -y mcporter ...`（如果安装了 `npx`）。

如果都不可用，命令以安装 `pnpm` 的提示失败（`npm install -g pnpm`）。

搜索调用使用固定的 30 秒超时。结果摘要每条截断为约 220 个字符。

## 输出

在富（TTY）终端中，结果呈现为标题后跟项目符号列表。每个项目符号显示页面标题、链接的文档 URL 和下一行的简短摘要。空结果打印"No results."。

在非富输出（管道、`--no-color`、脚本）中，相同的数据呈现为 Markdown：

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## 退出码

| 代码 | 含义                                                  |
| ---- | ----------------------------------------------------- |
| `0`  | 搜索成功（包括零结果响应）。                          |
| `1`  | MCP 工具调用失败；stderr 内联打印。                   |

## 相关

- [CLI 参考](/cli)
- [实时文档](https://docs.openclaw.ai)
