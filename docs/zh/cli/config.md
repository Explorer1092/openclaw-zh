---
title: "`openclaw config`"
mmh3_hash: "60bbb94df24f3d7c789149e0bc8716b8"
summary: "`openclaw config` 的 CLI 参考(获取/设置/取消设置/文件/验证配置值)"
read_when:
  - 您想以非交互方式读取或编辑配置
---

# `openclaw config`

配置助手:按路径获取/设置/取消设置/验证值,并打印活动配置文件。不带子命令运行以打开配置向导(与 `openclaw configure` 相同)。

## 示例

```bash
openclaw config file
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config unset tools.web.search.apiKey
openclaw config validate
openclaw config validate --json
```

## 路径

路径使用点或括号表示法:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

使用 Agent 列表索引来定位特定 Agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 值

值在可能的情况下被解析为 JSON5;否则它们被视为字符串。
使用 `--strict-json` 要求 JSON5 解析。`--json` 作为旧版别名仍受支持。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

## 子命令

- `config file`:打印活动配置文件路径(从 `OPENCLAW_CONFIG_PATH` 或默认位置解析)。

编辑后重新启动 Gateway。

## 验证

在不启动 Gateway 的情况下,根据活动 Schema 验证当前配置。

```bash
openclaw config validate
openclaw config validate --json
```
