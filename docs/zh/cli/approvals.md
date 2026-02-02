---
title: "`openclaw approvals`"
sidebarTitle: "openclaw approvals"
mmh3_hash: "579f1aade70539db566aec4bdc1b9d72"
summary: "`openclaw approvals` 的 CLI 参考(Gateway 或节点主机的执行批准)"
read_when:
  - 您想从 CLI 编辑执行批准
  - 您需要管理 Gateway 或节点主机上的允许列表
---

# `openclaw approvals`

管理**本地主机**、**Gateway 主机**或**节点主机**的执行批准。
默认情况下,命令针对磁盘上的本地批准文件。使用 `--gateway` 针对 Gateway,或使用 `--node` 针对特定节点。

相关:

- 执行批准:[Exec approvals](/tools/exec-approvals)
- 节点:[Nodes](/nodes)

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

## 从文件替换批准

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

## 允许列表助手

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 注意

- `--node` 使用与 `openclaw nodes` 相同的解析器(id、name、ip 或 id 前缀)。
- `--agent` 默认为 `"*"`,适用于所有 Agent。
- 节点主机必须公布 `system.execApprovals.get/set`(macOS 应用或无头节点主机)。
- 批准文件按主机存储在 `~/.openclaw/exec-approvals.json`。
