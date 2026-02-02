---
title: "`openclaw config`"
mmh3_hash: "95aef574bf9c6e8d7d0f7bf3020e83f5"
summary: "`openclaw config` 的 CLI 参考(获取/设置/取消设置配置值)"
read_when:
  - 您想以非交互方式读取或编辑配置
---

# `openclaw config`

配置助手:按路径获取/设置/取消设置值。不带子命令运行以打开配置向导(与 `openclaw configure` 相同)。

## 示例

```bash
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config unset tools.web.search.apiKey
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
使用 `--json` 要求 JSON5 解析。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --json
openclaw config set channels.whatsapp.groups '["*"]' --json
```

编辑后重新启动 Gateway。
