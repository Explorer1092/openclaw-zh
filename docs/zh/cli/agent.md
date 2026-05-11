---
summary: "`openclaw agent` 的 CLI 参考（通过 Gateway 发送一轮 Agent）"
read_when:
  - 您想从脚本运行一轮 Agent（可选择传递回复）
title: "Agent"
---

# `openclaw agent`

通过 Gateway 运行 Agent 轮次（使用 `--local` 进行嵌入式运行）。
使用 `--agent <id>` 直接定位已配置的 Agent。

至少传递一个 Session 选择器：

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

相关：

- Agent send 工具：[Agent send](/tools/agent-send)

## 选项

- `-m, --message <text>`：必需的消息内容
- `-t, --to <dest>`：用于派生 Session 密钥的收件人
- `--session-id <id>`：显式 Session ID
- `--agent <id>`：Agent ID；覆盖路由绑定
- `--model <id>`：本次运行的模型覆盖（`provider/model` 或模型 ID）
- `--thinking <level>`：Agent 思考级别（`off`、`minimal`、`low`、`medium`、`high`，以及 Provider 支持的自定义级别，如 `xhigh`、`adaptive` 或 `max`）
- `--verbose <on|off>`：为 Session 持久化详细程度级别
- `--channel <channel>`：传递 Channel；省略则使用主 Session Channel
- `--reply-to <target>`：传递目标覆盖
- `--reply-channel <channel>`：传递 Channel 覆盖
- `--reply-account <id>`：传递账户覆盖
- `--local`：直接运行嵌入式 Agent（Plugin 注册表预加载后）
- `--deliver`：将回复发送回所选 Channel/目标
- `--timeout <seconds>`：覆盖 Agent 超时（默认 600 或配置值）
- `--json`：输出 JSON

## 示例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 注意事项

- Gateway 模式在 Gateway 请求失败时回退到嵌入式 Agent。使用 `--local` 可强制优先使用嵌入式执行。
- `--local` 仍会先预加载 Plugin 注册表，因此 Plugin 提供的 Provider、工具和 Channel 在嵌入式运行期间仍然可用。
- `--local` 和嵌入式回退运行被视为一次性运行。为该本地进程打开的捆绑 MCP 回环资源和热 Claude stdio Session 在回复后被停用，因此脚本化调用不会保持本地子进程存活。
- 由 Gateway 支持的运行将 Gateway 拥有的 MCP 回环资源保留在运行中的 Gateway 进程下；旧版客户端可能仍发送历史清理标志，但 Gateway 将其作为兼容性空操作接受。
- `--channel`、`--reply-channel` 和 `--reply-account` 影响回复传递，而不影响 Session 路由。
- `--json` 将 stdout 保留用于 JSON 响应。Gateway、Plugin 和嵌入式回退诊断被路由到 stderr，以便脚本可以直接解析 stdout。
- 嵌入式回退 JSON 包含 `meta.transport: "embedded"` 和 `meta.fallbackFrom: "gateway"`，以便脚本可以区分回退运行和 Gateway 运行。
- 如果 Gateway 接受 Agent 运行但 CLI 等待最终回复超时，嵌入式回退使用新的显式 `gateway-fallback-*` Session/运行 ID 并报告 `meta.fallbackReason: "gateway_timeout"` 加上回退 Session 字段。这避免了与 Gateway 拥有的转录锁竞争或静默替换原始路由对话 Session。
- 当此命令触发 `models.json` 重新生成时，SecretRef 管理的 Provider 凭据被持久化为非密文标记（例如 env 变量名、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），而不是解析后的密文明文。
- 标记写入是源权威的：OpenClaw 从活跃源配置快照中持久化标记，而不是从解析的运行时密文值中持久化。

## JSON 传递状态

当使用 `--json --deliver` 时，CLI JSON 响应可能包含顶层 `deliveryStatus`，以便脚本可以区分已传递、已抑制、部分失败和失败的发送：

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

`deliveryStatus.status` 为 `sent`、`suppressed`、`partial_failed` 或 `failed` 之一。`suppressed` 表示传递被有意未发送，例如消息发送 Hook 取消了它或没有可见结果；这仍然是最终的无重试结果。`partial_failed` 表示在后续有效载荷失败之前至少发送了一个有效载荷。`failed` 表示没有完成持久发送或传递预检失败。

由 Gateway 支持的 CLI 响应也保留原始 Gateway 结果形状，其中同一对象在 `result.deliveryStatus` 处可用。

常见字段：

- `requested`：当对象存在时始终为 `true`。
- `attempted`：持久发送路径运行后为 `true`；预检失败或无可见有效载荷时为 `false`。
- `succeeded`：`true`、`false` 或 `"partial"`；`"partial"` 与 `status: "partial_failed"` 配对。
- `reason`：来自持久传递或预检验证的小写蛇形命名原因。已知原因包括 `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target` 和 `no_delivery_target`；失败的持久发送也可能报告失败阶段。将未知值视为不透明，因为该集合可能扩展。
- `resultCount`：可用时 Channel 发送结果的数量。
- `sentBeforeError`：部分失败在错误前发送了至少一个有效载荷时为 `true`。
- `error`：失败或部分失败的发送的布尔值 `true`。
- `errorMessage`：仅在捕获到底层传递错误消息时包含。预检失败携带 `error` 和 `reason` 但没有 `errorMessage`。
- `payloadOutcomes`：可选的每有效载荷结果，包含 `index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError` 或可用时的 Hook 元数据。

## 相关

- [CLI 参考](/cli)
- [Agent 运行时](/concepts/agent)
