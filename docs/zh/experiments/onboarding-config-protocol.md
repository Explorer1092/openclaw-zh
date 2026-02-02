---
title: "引导 + 配置协议"
mmh3_hash: "bf8d49119729cb78d9b86a49dd1e598d"
summary: "引导向导和配置架构的 RPC 协议说明"
read_when: "更改引导向导步骤或配置架构端点"
---

# 引导 + 配置协议

目的: 在 CLI、macOS 应用和 Web UI 之间共享引导 + 配置界面。

## 组件
- 向导引擎(共享会话 + 提示 + 引导状态)。
- CLI 引导使用与 UI 客户端相同的向导流程。
- 网关 RPC 公开向导 + 配置架构端点。
- macOS 引导使用向导步骤模型。
- Web UI 从 JSON Schema + UI 提示呈现配置表单。

## 网关 RPC
- `wizard.start` 参数: `{ mode?: "local"|"remote", workspace?: string }`
- `wizard.next` 参数: `{ sessionId, answer?: { stepId, value? } }`
- `wizard.cancel` 参数: `{ sessionId }`
- `wizard.status` 参数: `{ sessionId }`
- `config.schema` 参数: `{}`

响应(结构)
- 向导: `{ sessionId, done, step?, status?, error? }`
- 配置架构: `{ schema, uiHints, version, generatedAt }`

## UI 提示
- `uiHints` 按路径键入;可选元数据(label/help/group/order/advanced/sensitive/placeholder)。
- 敏感字段呈现为密码输入;无脱敏层。
- 不支持的架构节点回退到原始 JSON 编辑器。

## 注意事项
- 本文档是跟踪引导/配置协议重构的单一位置。
