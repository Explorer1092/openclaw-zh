---
title: "Exec 工具"
sidebarTitle: "Exec"
mmh3_hash: "f2044b0a0a51c3830f32c8ce0747b044"
summary: "Exec 工具使用、stdin 模式和 TTY 支持"
read_when: ["使用或修改 exec 工具","调试 stdin 或 TTY 行为"]
---

# Exec 工具

在工作区中运行 shell 命令。通过 `process` 支持前台 + 后台执行。如果 `process` 被禁止,`exec` 同步运行并忽略 `yieldMs`/`background`。后台会话的作用域限定为每个 agent;`process` 只能看到来自同一 agent 的会话。

## 参数

- `command`(必需)
- `workdir`(默认为 cwd)
- `env`(键/值覆盖)
- `yieldMs`(默认 10000): 延迟后自动后台运行
- `background`(bool): 立即后台运行
- `timeout`(秒,默认 1800): 超时时杀死
- `pty`(bool): 在可用时在伪终端中运行(仅 TTY CLI、编码 agent、终端 UI)
- `host`(`sandbox | gateway | node`): 执行位置
- `security`(`deny | allowlist | full`): `gateway`/`node` 的强制模式
- `ask`(`off | on-miss | always`): `gateway`/`node` 的批准提示
- `node`(string): `host=node` 的节点 id/名称
- `elevated`(bool): 请求提升模式(网关主机);仅当 elevated 解析为 `full` 时才强制 `security=full`

注意:
- `host` 默认为 `sandbox`。
- 当沙箱关闭时,`elevated` 被忽略(exec 已在主机上运行)。
- `gateway`/`node` 批准由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要配对的节点(伴侣应用或无头节点主机)。
- 如果有多个节点可用,设置 `exec.node` 或 `tools.exec.node` 以选择一个。
- 在非 Windows 主机上,exec 在设置时使用 `SHELL`;如果 `SHELL` 是 `fish`,它会优先选择 `PATH` 中的 `bash`(或 `sh`)以避免与 fish 不兼容的脚本,如果两者都不存在则回退到 `SHELL`。
- 重要: 沙箱**默认关闭**。如果沙箱关闭,`host=sandbox` 直接在网关主机上运行(无容器)并且**不需要批准**。要要求批准,使用 `host=gateway` 运行并配置 exec 批准(或启用沙箱)。

## 配置

- `tools.exec.notifyOnExit`(默认: true): 为 true 时,后台 exec 会话在退出时排队系统事件并请求心跳。
- `tools.exec.approvalRunningNoticeMs`(默认: 10000): 当批准门控的 exec 运行时间超过此值时发出单个"运行中"通知(0 禁用)。
- `tools.exec.host`(默认: `sandbox`)
- `tools.exec.security`(对于沙箱默认为 `deny`,对于网关 + 节点在未设置时默认为 `allowlist`)
- `tools.exec.ask`(默认: `on-miss`)
- `tools.exec.node`(默认: 未设置)
- `tools.exec.pathPrepend`: 要为 exec 运行前置到 `PATH` 的目录列表。
- `tools.exec.safeBins`: 可以在没有显式允许列表条目的情况下运行的仅 stdin 安全二进制文件。

示例:
```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"]
    }
  }
}
```

### PATH 处理

- `host=gateway`: 将您的登录 shell `PATH` 合并到 exec 环境中(除非 exec 调用已设置 `env.PATH`)。守护进程本身仍然使用最小的 `PATH` 运行:
  - macOS: `/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux: `/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`: 在容器内运行 `sh -lc`(登录 shell),因此 `/etc/profile` 可能会重置 `PATH`。OpenClaw 在配置文件来源后通过内部环境变量前置 `env.PATH`(无 shell 插值);`tools.exec.pathPrepend` 也在这里应用。
- `host=node`: 只有您传递的环境覆盖才会发送到节点。`tools.exec.pathPrepend` 仅在 exec 调用已设置 `env.PATH` 时应用。无头节点主机仅在前置节点主机 PATH 时接受 `PATH`(无替换)。macOS 节点完全丢弃 `PATH` 覆盖。

每个 agent 的节点绑定(在配置中使用 agent 列表索引):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

控制 UI: 节点选项卡包含一个小的"Exec 节点绑定"面板,用于相同的设置。

## 会话覆盖(`/exec`)

使用 `/exec` 为 `host`、`security`、`ask` 和 `node` 设置**每会话**默认值。发送不带参数的 `/exec` 以显示当前值。

示例:
```
/exec host=gateway security=allowlist ask=on-miss node=mac-1
```

## 授权模型

`/exec` 仅对**授权发送者**(频道允许列表/配对加 `commands.useAccessGroups`)有效。它**仅**更新会话状态,不写入配置。要硬禁用 exec,通过工具策略拒绝它(`tools.deny: ["exec"]` 或每个 agent)。除非您明确设置 `security=full` 和 `ask=off`,否则主机批准仍然适用。

## Exec 批准(伴侣应用/节点主机)

沙箱化的 agent 可以在 `exec` 在网关或节点主机上运行之前要求每请求批准。有关策略、允许列表和 UI 流程,请参见 [Exec 批准](/tools/exec-approvals)。

当需要批准时,exec 工具立即返回 `status: "approval-pending"` 和批准 id。一旦批准(或拒绝/超时),网关发出系统事件(`Exec finished` / `Exec denied`)。如果命令在 `tools.exec.approvalRunningNoticeMs` 后仍在运行,会发出单个 `Exec running` 通知。

## 允许列表 + 安全 bin

允许列表强制执行**仅**匹配解析的二进制路径(无基名匹配)。当 `security=allowlist` 时,仅当每个管道段都在允许列表中或是安全 bin 时,才自动允许 shell 命令。在允许列表模式下拒绝链接(`;`、`&&`、`||`)和重定向。

## 示例

前台:
```json
{"tool":"exec","command":"ls -la"}
```

后台 + 轮询:
```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

发送键(tmux 样式):
```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

提交(仅发送 CR):
```json
{"tool":"process","action":"submit","sessionId":"<id>"}
```

粘贴(默认使用括号):
```json
{"tool":"process","action":"paste","sessionId":"<id>","text":"line1\nline2\n"}
```

## apply_patch(实验性)

`apply_patch` 是 `exec` 的子工具,用于结构化的多文件编辑。明确启用它:

```json5
{
  tools: {
    exec: {
      applyPatch: { enabled: true, allowModels: ["gpt-5.2"] }
    }
  }
}
```

注意:
- 仅适用于 OpenAI/OpenAI Codex 模型。
- 工具策略仍然适用;`allow: ["exec"]` 隐式允许 `apply_patch`。
- 配置位于 `tools.exec.applyPatch` 下。

