---
mmh3_hash: "fb19ca02cd2f008bfa0afb8e8270e480"
title: "`openclaw approvals`"
sidebarTitle: "openclaw approvals"
summary: "`openclaw approvals` 的 CLI 参考(Gateway 或节点主机的执行批准)"
read_when:
  - 您想从 CLI 编辑执行批准
  - 您需要管理 Gateway 或节点主机上的允许列表
---

# `openclaw approvals`

管理**本地主机**、**Gateway 主机**或**节点主机**的执行批准。
默认情况下,命令针对磁盘上的本地批准文件。使用 `--gateway` 针对 Gateway,或使用 `--node` 针对特定节点。

别名:`openclaw exec-approvals`

相关:

- 执行批准:[Exec approvals](/tools/exec-approvals)
- 节点:[Nodes](/nodes)

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` 现在显示本地、Gateway 和节点目标的有效 exec 策略:

- 请求的 `tools.exec` 策略
- 主机批准文件策略
- 应用优先规则后的有效结果

优先级是有意为之的:

- 主机批准文件是可强制执行的真实来源
- 请求的 `tools.exec` 策略可以缩小或扩大意图,但有效结果仍从主机规则派生
- `--node` 将节点主机批准文件与 Gateway `tools.exec` 策略结合,因为两者在运行时仍然适用
- 如果 Gateway 配置不可用,CLI 回退到节点批准快照并说明无法计算最终运行时策略

## 从文件替换批准

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` 接受 JSON5,而不仅仅是严格的 JSON。使用 `--file` 或 `--stdin` 其中之一,不能同时使用。

## "从不提示" / YOLO 示例

对于不应在 exec 批准时停止的主机,将主机批准默认值设置为 `full` + `off`:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

节点变体:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

这仅更改**主机批准文件**。要保持请求的 OpenClaw 策略一致,还需设置:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

此示例中 `tools.exec.host=gateway` 的原因:

- `host=auto` 仍然意味着"有沙箱时使用沙箱,否则使用 gateway"。
- YOLO 关于批准,而非路由。
- 如果您希望在配置了沙箱时仍使用主机 exec,请使用 `gateway` 或 `/exec host=gateway` 明确指定主机选择。

这与当前的主机默认 YOLO 行为匹配。如果您需要批准,请收紧它。

## 允许列表助手

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 常用选项

`get`、`set` 和 `allowlist add|remove` 均支持:

- `--node <id|name|ip>`
- `--gateway`
- 共享节点 RPC 选项:`--url`、`--token`、`--timeout`、`--json`

目标说明:

- 无目标标志表示磁盘上的本地批准文件
- `--gateway` 针对 Gateway 主机批准文件
- `--node` 在解析 ID、名称、IP 或 ID 前缀后针对一个节点主机

`allowlist add|remove` 还支持:

- `--agent <id>`(默认为 `*`)

## 注意

- `--node` 使用与 `openclaw nodes` 相同的解析器(id、name、ip 或 id 前缀)。
- `--agent` 默认为 `"*"`,适用于所有 Agent。
- 节点主机必须公布 `system.execApprovals.get/set`(macOS 应用或无头节点主机)。
- 批准文件按主机存储在 `~/.openclaw/exec-approvals.json`。
