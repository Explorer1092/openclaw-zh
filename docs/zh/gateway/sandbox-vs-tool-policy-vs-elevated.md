---
mmh3_hash: "b9bb9b009949d1475bced02203243b9d"
title: "Sandbox vs tool policy vs elevated"
sidebarTitle: "沙盒与工具策略"
summary: "工具被阻止的原因:sandbox runtime、工具允许/拒绝策略和提升 exec 门控"
read_when: "你遇到'sandbox jail'或看到工具/elevated 拒绝,想要找到需要更改的确切配置键。"
status: active
---

# 沙盒 vs 工具策略 vs 提升模式

OpenClaw 有三个相关(但不同)的控件:

1. **Sandbox**(`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`)决定**工具在哪里运行**(Docker 与主机)。
2. **工具策略**(`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`)决定**哪些工具可用/允许**。
3. **Elevated**(`tools.elevated.*`、`agents.list[].tools.elevated.*`)是一个**仅 exec 的逃生通道**,在沙盒化时在沙盒外运行(`gateway` 默认,或当 exec 目标配置为 `node` 时为 `node`)。

## 快速调试

使用检查器查看 OpenClaw 实际在做什么:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它打印:

- 有效的 sandbox mode/scope/workspace access
- session 当前是否已沙盒化(main 与 non-main)
- 有效的 sandbox 工具允许/拒绝(以及是否来自 agent/global/default)
- elevated 门控和修复键路径

## Sandbox: 工具在哪里运行

沙盒化由 `agents.defaults.sandbox.mode` 控制:

- `"off"`: 所有内容在主机上运行。
- `"non-main"`: 仅非主 sessions 被沙盒化(群组/channels 的常见"惊喜")。
- `"all"`: 所有内容都被沙盒化。

参见 [Sandboxing](/gateway/sandboxing) 了解完整矩阵(scope、workspace mounts、images)。

### 绑定挂载(安全快速检查)

- `docker.binds` _穿透_ sandbox 文件系统:你挂载的任何内容都以你设置的模式(`:ro` 或 `:rw`)在容器内可见。
- 如果省略模式,默认为读写;对于源代码/secrets,优先使用 `:ro`。
- `scope: "shared"` 忽略每个 agent 的绑定(仅应用全局绑定)。
- OpenClaw 对绑定源进行两次验证：首先在规范化的源路径上，然后在通过最深现有祖先解析后再次验证。符号链接父级转义不会绕过阻止路径或允许根检查。
- 不存在的叶路径也会被安全检查。如果 `/workspace/alias-out/new-file` 通过符号链接父级解析到阻止路径或配置允许根之外，则绑定被拒绝。
- 绑定 `/var/run/docker.sock` 实际上将主机控制权交给 sandbox;只有在有意时才这样做。
- Workspace access(`workspaceAccess: "ro"`/`"rw"`)独立于绑定模式。

## 工具策略: 哪些工具存在/可调用

两层很重要:

- **Tool profile**: `tools.profile` 和 `agents.list[].tools.profile`(基础允许列表)
- **Provider tool profile**: `tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全局/每个 agent 工具策略**: `tools.allow`/`tools.deny` 和 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider 工具策略**: `tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox 工具策略**(仅在沙盒化时适用): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

经验法则:

- `deny` 总是优先。
- 如果 `allow` 非空,其他所有内容都被视为阻止。
- 工具策略是硬停止:`/exec` 无法覆盖被拒绝的 `exec` 工具。
- `/exec` 仅更改授权发送者的 session 默认值;它不授予工具访问权限。
  Provider 工具键接受 `provider`(例如 `google-antigravity`)或 `provider/model`(例如 `openai/gpt-5.4`)。

### 工具组(简写)

工具策略(全局、agent、sandbox)支持展开为多个工具的 `group:*` 条目:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

可用组:

- `group:runtime`: `exec`、`process`、`code_execution`（`bash` 作为 `exec` 的别名被接受）
- `group:fs`: `read`、`write`、`edit`、`apply_patch`
- `group:sessions`: `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`
- `group:memory`: `memory_search`、`memory_get`
- `group:web`: `web_search`、`x_search`、`web_fetch`
- `group:ui`: `browser`、`canvas`
- `group:automation`: `cron`、`gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`、`image_generate`、`video_generate`、`tts`
- `group:openclaw`: 所有内置 OpenClaw 工具(不包括 provider plugin)

## Elevated: 仅 exec 的"在主机上运行"

Elevated **不**授予额外工具;它只影响 `exec`。

- 如果你已沙盒化,`/elevated on`(或带 `elevated: true` 的 `exec`)在主机上运行(审批可能仍然适用)。
- 使用 `/elevated full` 跳过 session 的 exec 审批。
- 如果你已经直接运行,elevated 实际上是无操作的(仍然受门控)。
- Elevated **不**受 skill 范围限制,也**不**覆盖工具允许/拒绝。
- Elevated 不从 `host=auto` 授予任意跨主机覆盖；它遵循正常的 exec 目标规则，只有当配置/session 目标已经是 `node` 时才保留 `node`。
- `/exec` 与 elevated 是分开的。它只调整授权发送者的每 session exec 默认值。

门控:

- 启用:`tools.elevated.enabled`(以及可选地 `agents.list[].tools.elevated.enabled`)
- 发送者允许列表:`tools.elevated.allowFrom.<provider>`(以及可选地 `agents.list[].tools.elevated.allowFrom.<provider>`)

参见 [Elevated Mode](/tools/elevated)。

## 常见"sandbox jail"修复

### "工具 X 被 sandbox 工具策略阻止"

修复键(选一个):

- 禁用 sandbox: `agents.defaults.sandbox.mode=off`(或每个 agent 的 `agents.list[].sandbox.mode=off`)
- 在 sandbox 内允许工具:
  - 从 `tools.sandbox.tools.deny` 中删除它(或每个 agent 的 `agents.list[].tools.sandbox.tools.deny`)
  - 或将其添加到 `tools.sandbox.tools.allow`(或每个 agent 允许)

### "我以为这是 main,为什么它被沙盒化了?"

在 `"non-main"` 模式下,group/channel 键_不是_ main。使用主 session key(由 `sandbox explain` 显示)或将模式切换为 `"off"`。

## 相关

- [Sandboxing](/gateway/sandboxing) — 完整 sandbox 参考(modes、scopes、backends、images)
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) — 每个 agent 覆盖和优先级
- [Elevated Mode](/tools/elevated)
