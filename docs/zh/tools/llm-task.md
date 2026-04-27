---
title: "LLM 任务"
sidebarTitle: "LLM 任务"
mmh3_hash: "cf838e510391bf365bd03789dae827c3"
summary: "用于工作流的仅 JSON LLM 任务（可选插件工具）"
read_when:
  - 您想要工作流内的仅 JSON LLM 步骤
  - 您需要经过 Schema 验证的 LLM 输出以进行自动化
---

# LLM 任务

`llm-task` 是一个**可选插件工具**，运行仅 JSON 的 LLM 任务并返回结构化输出（可选地根据 JSON Schema 进行验证）。

这对于像 Lobster 这样的工作流引擎来说非常理想：您可以添加单个 LLM 步骤，而无需为每个工作流编写自定义 OpenClaw 代码。

## 启用插件

1. 启用插件：

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. 将工具加入允许列表（它以 `optional: true` 注册）：

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## 配置（可选）

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` 是 `provider/model` 字符串的允许列表。如果设置，列表之外的任何请求都会被拒绝。

## 工具参数

- `prompt`（string，必需）
- `input`（any，可选）
- `schema`（object，可选 JSON Schema）
- `provider`（string，可选）
- `model`（string，可选）
- `thinking`（string，可选）
- `authProfileId`（string，可选）
- `temperature`（number，可选）
- `maxTokens`（number，可选）
- `timeoutMs`（number，可选）

`thinking` 接受 OpenClaw 标准推理预设，例如 `low` 或 `medium`。

## 输出

返回包含解析后 JSON 的 `details.json`（在提供 `schema` 时进行验证）。

## 示例：Lobster 工作流步骤

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## 安全注意事项

- 该工具是**仅 JSON** 的，并指示模型只输出 JSON（无代码栅栏，无注释）。
- 此运行不向模型公开任何工具。
- 除非使用 `schema` 进行验证，否则请将输出视为不受信任。
- 在任何有副作用的步骤（发送、发布、exec）之前进行审批。

## 相关

- [思考级别](/tools/thinking)
- [子 Agent](/tools/subagents)
- [Slash Command](/tools/slash-commands)
